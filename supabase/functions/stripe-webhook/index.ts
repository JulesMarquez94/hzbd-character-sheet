/**
 * The only thing in this repository that may write what somebody has paid for.
 *
 * Deployed with JWT verification off, because Stripe is not a signed-in user
 * and cannot present a token. That makes the endpoint reachable by anyone on
 * the internet, so the signature is not one check among several: it is the
 * entire door. Nothing below the verification runs on an unsigned request.
 *
 * ---------------------------------------------------------------- the promises
 * Stripe promises delivery. It does not promise order, and it does not promise
 * once. It retries for up to three days, which means this handler will be
 * called with the same event again, and with an older event after a newer one.
 * Two lines answer both:
 *
 *   the event id goes into billing_events before any work, and a unique
 *   violation is a duplicate rather than a failure.
 *
 *   nothing is written from the payload. syncCustomer re-reads the customer's
 *   subscriptions from Stripe, so the newest truth wins whatever order the
 *   notifications arrived in. See _shared/sync.ts.
 *
 * ------------------------------------------------------------------ the answer
 * A 2xx as soon as the work is done, and a 2xx even when the work was skipped:
 * an event about a customer this database has never heard of will not become
 * one after three days of retries. Only a signature failure gets a 4xx and only
 * a real fault gets a 5xx, so a retry from Stripe always means something worth
 * retrying.
 */
import Stripe from 'npm:stripe@^22';
import { adminClient, mustEnv, stripe } from '../_shared/billing.ts';
import { customerFromEvent, syncCustomer, userHintFromEvent } from '../_shared/sync.ts';

/**
 * Deno's crypto is async only, so the signature is verified with
 * constructEventAsync and the Web Crypto provider. The synchronous
 * constructEvent that Node examples use throws here.
 */
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const flag = (name: string) => (Deno.env.get(name) ?? '').toLowerCase() === 'true';

/**
 * What is worth acting on. Everything here ends in the same place, because the
 * handler does not care what happened, only which customer it happened to.
 *
 *   checkout.session.completed        the moment of purchase
 *   customer.subscription.*           created, changed, cancelled
 *   invoice.paid                      the renewal heartbeat
 *   invoice.payment_failed            a card that failed. Premium is kept while
 *                                     Stripe retries: see apply_entitlements in
 *                                     schema.sql for why past_due still counts
 *   charge.dispute.created            a chargeback
 *
 * Subscribe the Stripe endpoint to exactly this list. Anything else that
 * arrives is answered 200 and ignored.
 */
const HANDLED = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'invoice.paid',
  'invoice.payment_failed',
  'charge.dispute.created',
]);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Use POST.', { status: 405 });

  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return new Response('No signature.', { status: 400 });

  /* The raw text, before anything parses it. The signature is over the exact
     bytes Stripe sent, so reading this as JSON first and re-serialising would
     fail verification for a reason nobody would ever guess. */
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      mustEnv('STRIPE_WEBHOOK_SECRET'),
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error('[webhook] signature refused', err);
    return new Response('Bad signature.', { status: 400 });
  }

  if (!HANDLED.has(event.type)) {
    return new Response(JSON.stringify({ ignored: event.type }), { status: 200 });
  }

  const admin = adminClient();

  /* The idempotency gate, before any work. 23505 is the unique violation, which
     here means this exact event has already been acted on. */
  const { error: seen } = await admin
    .from('billing_events')
    .insert({ id: event.id, provider: 'stripe', type: event.type });

  if (seen) {
    if (seen.code === '23505') {
      return new Response(JSON.stringify({ duplicate: event.id }), { status: 200 });
    }
    console.error('[webhook] could not record event', seen);
    return new Response('Could not record the event.', { status: 500 });
  }

  try {
    const customerId = await customerFromEvent(event);
    if (!customerId) {
      console.warn('[webhook] no customer on', event.type, event.id);
      return new Response(JSON.stringify({ skipped: 'no customer' }), { status: 200 });
    }

    /* A chargeback, if this deployment has asked for it to be acted on. Off by
       default: cancelling somebody's subscription is an outward act and the
       right answer to a dispute over two euros is usually a person looking at
       it, not a rule. Turning it on makes the cancellation emit its own
       subscription.deleted, which demotes the account through the ordinary
       path rather than by a second rule written here. */
    if (event.type === 'charge.dispute.created' && flag('STRIPE_CANCEL_ON_DISPUTE')) {
      const open = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 10,
      });
      for (const sub of open.data) await stripe.subscriptions.cancel(sub.id);
    }

    const { userId, tier } = await syncCustomer(admin, customerId, userHintFromEvent(event));
    return new Response(JSON.stringify({ ok: true, userId, tier }), { status: 200 });
  } catch (err) {
    /* The event row is left behind on purpose. Stripe will retry, the insert
       will collide and this handler will answer 200 without re-doing the work,
       which is the wrong outcome for a fault. So the row is removed to let the
       retry through, and only then is the failure reported. */
    console.error('[webhook] handling failed', event.id, err);
    await admin.from('billing_events').delete().eq('id', event.id);
    return new Response('Handling failed.', { status: 500 });
  }
});
