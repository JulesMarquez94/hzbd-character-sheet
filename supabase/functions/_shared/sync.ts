/**
 * Reconciling one Stripe customer with this database.
 *
 * Every path that could change what somebody has paid for ends here: the
 * webhook on each event, and the return page when the webhook is slow. It is
 * one function on purpose, because two of them would eventually disagree.
 *
 * ------------------------------------------------------------------ the idea
 * **Never believe the event. Ask Stripe.**
 *
 * A webhook payload is a notification that something changed, not a statement
 * of what is true now. Stripe makes no promise about the order events arrive
 * in, so a `subscription.updated` from ten seconds ago can land after the
 * `subscription.deleted` that followed it, and a handler that wrote what the
 * payload said would leave the account premium forever. So an event is used for
 * exactly one thing, which is the customer id, and everything written comes
 * from a fresh read of that customer's subscriptions.
 *
 * That also makes this self-healing. Whatever went wrong before, the next event
 * of any kind rewrites the whole picture correctly.
 *
 * ------------------------------------------------------------- the field moves
 * Stripe has moved two fields between API versions: `current_period_end` from
 * the subscription onto its items, and the subscription off the invoice. Rather
 * than guess which version an account is pinned to, this reads the period from
 * whichever place holds it, and never reads a subscription off an invoice at
 * all: it lists the customer's subscriptions instead. One extra API call buys
 * immunity from the whole question.
 */
import type Stripe from 'npm:stripe@^22';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2';
import { idOf, stripe } from './billing.ts';

/** The period end, from wherever this API version keeps it. */
function periodEnd(sub: Stripe.Subscription): string | null {
  const raw =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined)
      ?.current_period_end ??
    null;
  return raw ? new Date(raw * 1000).toISOString() : null;
}

function stamp(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

/**
 * Which account a Stripe customer belongs to.
 *
 * Three places to look, in the order of how much they are worth trusting:
 * the mapping this database already wrote, the metadata the checkout stamped
 * onto the customer, and the hint the caller pulled off the event
 * (`client_reference_id` on a session, `metadata.user_id` on a subscription).
 *
 * Null means a customer nobody here has ever heard of, which happens for real:
 * a payment made from the Stripe dashboard by hand, or a leftover from a test.
 * The caller logs it and returns 200, because retrying will not help.
 */
async function resolveUserId(
  admin: SupabaseClient,
  customerId: string,
  hint?: string | null
): Promise<string | null> {
  const { data: known } = await admin
    .from('billing_customers')
    .select('user_id')
    .eq('provider_customer_id', customerId)
    .maybeSingle();
  if (known?.user_id) return known.user_id;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!('deleted' in customer && customer.deleted)) {
      const tagged = (customer as Stripe.Customer).metadata?.supabase_user_id;
      if (tagged) return tagged;
    }
  } catch (err) {
    console.error('[billing] could not read customer', customerId, err);
  }

  return hint ?? null;
}

/**
 * Bring one customer's whole billing picture up to date, and hand back the tier
 * the database settled on.
 *
 * The order matters. The mapping is written first, so an event that arrives
 * before the return page has ever been opened can still find its account next
 * time. The subscriptions follow. The tier is derived last, by the database,
 * because deciding it here would put the rule in two places.
 */
export async function syncCustomer(
  admin: SupabaseClient,
  customerId: string,
  hint?: string | null
): Promise<{ userId: string | null; tier: string | null }> {
  const userId = await resolveUserId(admin, customerId, hint);
  if (!userId) {
    console.warn('[billing] no account for customer', customerId);
    return { userId: null, tier: null };
  }

  const { error: mapError } = await admin
    .from('billing_customers')
    .upsert(
      { user_id: userId, provider: 'stripe', provider_customer_id: customerId },
      { onConflict: 'user_id' }
    );
  if (mapError) throw mapError;

  /* Every subscription this customer has, cancelled ones included. The cancelled
     rows are what let apply_entitlements tell "never subscribed" apart from
     "subscribed and stopped", and ten is far more than the one a person can
     hold here. */
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 10,
  });

  for (const sub of subs.data) {
    const { error } = await admin.from('subscriptions').upsert(
      {
        id: sub.id,
        user_id: userId,
        provider: 'stripe',
        status: sub.status,
        price_id: sub.items?.data?.[0]?.price?.id ?? null,
        cancel_at_period_end: Boolean(sub.cancel_at_period_end),
        current_period_end: periodEnd(sub),
        canceled_at: stamp(sub.canceled_at),
        ended_at: stamp(sub.ended_at),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
  }

  const { data: tier, error: tierError } = await admin.rpc('apply_entitlements', {
    p_user: userId,
  });
  if (tierError) throw tierError;

  return { userId, tier: tier ?? null };
}

/**
 * The customer id an event is about.
 *
 * Most objects carry `customer` outright. A dispute does not: it names a
 * charge, so the charge is fetched for it. Anything with no customer at all is
 * an event about something other than a person's subscription, and the caller
 * skips it.
 */
export async function customerFromEvent(event: Stripe.Event): Promise<string | null> {
  const object = event.data.object as Record<string, unknown>;

  const direct = idOf(object.customer);
  if (direct) return direct;

  if (event.type.startsWith('charge.dispute.')) {
    const chargeId = idOf((object as { charge?: unknown }).charge);
    if (!chargeId) return null;
    const charge = await stripe.charges.retrieve(chargeId);
    return idOf(charge.customer);
  }

  return null;
}

/**
 * The account id an event carries with it, put there by create-checkout-session
 * so that the very first event about a brand new customer can still be placed.
 * Only ever a fallback: see resolveUserId.
 */
export function userHintFromEvent(event: Stripe.Event): string | null {
  const object = event.data.object as Record<string, unknown>;
  const reference = object.client_reference_id;
  if (typeof reference === 'string' && reference) return reference;

  const metadata = object.metadata as Record<string, string> | undefined;
  return metadata?.user_id ?? null;
}
