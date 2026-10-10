/**
 * "Manage Subscription" pressed. Hand back Stripe's own billing portal.
 *
 * Cancelling has to be at least as easy as subscribing, and the cheapest way to
 * be sure of that is to not build it: the portal is Stripe's hosted page for
 * changing a card, reading past invoices and cancelling, and it is the same
 * page whatever this repository does. Nothing here has to be trusted with a
 * card, and there is no cancellation flow of ours for somebody to get lost in.
 *
 * It needs one thing done in the Stripe dashboard first, under Settings,
 * Billing, Customer portal: the portal has to be turned on and told what
 * customers may do. Until then this call fails with Stripe's own message
 * saying exactly that.
 */
import {
  HttpError,
  adminClient,
  callerFromRequest,
  serveJson,
  siteUrl,
  stripe,
} from '../_shared/billing.ts';

Deno.serve(
  serveJson(async (req) => {
    const user = await callerFromRequest(req);
    if (!user) throw new HttpError(401, 'Sign in first.');

    /* The customer is looked up by the account that is asking, so the portal
       can only ever open onto its own billing. A customer id in the body would
       be somebody else's invoices one guess away. */
    const { data: mapped } = await adminClient()
      .from('billing_customers')
      .select('provider_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!mapped?.provider_customer_id) {
      throw new HttpError(404, 'This account has never been through the checkout.');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: mapped.provider_customer_id,
      return_url: `${siteUrl()}/account`,
    });

    return { url: session.url };
  })
);
