/**
 * The return page asking: did that go through?
 *
 * ------------------------------------------------------- why this exists at all
 * The redirect back from Stripe is **not** proof of payment. It is a URL, and a
 * player can reach it by typing it, by pressing back, or by paying and then
 * closing the tab before it loads. The webhook is the only thing that decides a
 * tier, and this function does not change that: it looks the session up with
 * the secret key, checks that it belongs to the account that is asking, and
 * then runs the same reconciliation the webhook runs.
 *
 * So it is a nudge, not a shortcut. If the webhook has already landed, this
 * finds the work done and says so. If the webhook is a few seconds behind, this
 * does it first and the webhook later finds nothing left to do. Either way the
 * answer comes from Stripe and lands through one code path.
 *
 * The page mostly does not need it. It is already watching its own profile row
 * over Realtime, so an ordinary purchase flips the badge before anybody thinks
 * to ask. This is what makes the slow case and the failed-webhook case
 * recoverable without an email.
 */
import {
  HttpError,
  adminClient,
  callerFromRequest,
  idOf,
  serveJson,
  stripe,
} from '../_shared/billing.ts';
import { syncCustomer } from '../_shared/sync.ts';

Deno.serve(
  serveJson(async (req) => {
    const user = await callerFromRequest(req);
    if (!user) throw new HttpError(401, 'Sign in first.');

    const body = await req.json().catch(() => ({}));
    const sessionId = String(body?.session_id ?? '').trim();
    if (!sessionId.startsWith('cs_')) throw new HttpError(400, 'That is not a checkout session.');

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    /* Somebody else's receipt is not readable by holding its id. A session id
       travels in a URL and a URL gets pasted into chats, so the account that
       started the checkout is the only one this will answer for. */
    const owner = session.client_reference_id ?? session.metadata?.user_id ?? null;
    if (owner !== user.id) throw new HttpError(403, 'That checkout belongs to another account.');

    const customerId = idOf(session.customer);
    if (!customerId) return { paid: false, tier: null };

    const { tier } = await syncCustomer(adminClient(), customerId, user.id);

    return {
      paid: session.payment_status === 'paid' || session.payment_status === 'no_payment_required',
      tier,
    };
  })
);
