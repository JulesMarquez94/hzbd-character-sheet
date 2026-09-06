/**
 * "Go Premium" pressed. Hand back a Stripe-hosted page to send them to.
 *
 * The card is entered on Stripe's own domain and never touches Hazebound, which
 * is the whole reason this is a redirect rather than a form: no payment field
 * is ever served from our origin, so the site stays in the smallest PCI
 * self-assessment there is and a bug in this repo cannot leak a card number.
 *
 * Three things are refused here rather than trusted:
 *
 *   who      the account is read from the verified JWT, never from the body.
 *            A request that claims a user_id is ignored on that point.
 *   what     the plan word is looked up in an allowlist. A price id in a body
 *            would let anybody subscribe at a price of their own invention.
 *   where    success and cancel URLs are built from SITE_URL on this side, so
 *            the redirect cannot be pointed at somebody else's domain.
 */
import {
  HttpError,
  adminClient,
  callerFromRequest,
  priceIdForPlan,
  serveJson,
  siteUrl,
  stripe,
} from '../_shared/billing.ts';

/**
 * Statuses that mean "you already have this". Sending somebody who is already
 * paying to a second checkout is how an account ends up with two subscriptions
 * and one of them unnoticed, so the portal is offered instead.
 */
const ALREADY_PAYING = ['active', 'trialing', 'past_due'];

/**
 * Both of these need something switched on in the Stripe dashboard first, and a
 * checkout that 500s because it was not is worse than a checkout without them.
 * So both are off unless the environment turns them on.
 *
 *   STRIPE_AUTOMATIC_TAX   for selling as your own merchant of record with a
 *                          Stripe Tax registration. Leave it off under Managed
 *                          Payments, where Stripe is the seller and handles the
 *                          tax itself.
 *   STRIPE_REQUIRE_TOS     shows the "I agree to the terms" tickbox, and needs
 *                          a terms of service URL saved under the account's
 *                          public details.
 */
const flag = (name: string) => (Deno.env.get(name) ?? '').toLowerCase() === 'true';

Deno.serve(
  serveJson(async (req) => {
    const user = await callerFromRequest(req);
    if (!user) throw new HttpError(401, 'Sign in before subscribing.');

    const body = await req.json().catch(() => ({}));
    const priceId = priceIdForPlan(body?.plan);

    const admin = adminClient();

    const { data: held } = await admin
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ALREADY_PAYING)
      .maybeSingle();

    if (held) {
      throw new HttpError(
        409,
        'This account already has a subscription. Open Manage Subscription to change or cancel it.'
      );
    }

    /* The customer this account already had, or a new one stamped with the
       account id. The stamp is what lets a later event find its way home even
       if this database were restored from a backup taken before the checkout. */
    const { data: mapped } = await admin
      .from('billing_customers')
      .select('provider_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = mapped?.provider_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await admin
        .from('billing_customers')
        .upsert(
          { user_id: user.id, provider: 'stripe', provider_customer_id: customerId },
          { onConflict: 'user_id' }
        );
    }

    const automaticTax = flag('STRIPE_AUTOMATIC_TAX');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],

      /* The account id, twice. `client_reference_id` rides the session and
         `subscription_data.metadata` rides the subscription that outlives it,
         so both the first event and every later one carry it. */
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },

      success_url: `${siteUrl()}/premium?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/premium?checkout=cancelled`,

      allow_promotion_codes: true,
      ...(automaticTax
        ? { automatic_tax: { enabled: true }, customer_update: { address: 'auto' as const } }
        : {}),
      ...(flag('STRIPE_REQUIRE_TOS')
        ? { consent_collection: { terms_of_service: 'required' as const } }
        : {}),
    });

    if (!session.url) throw new HttpError(502, 'Stripe did not hand back a checkout page.');
    return { url: session.url };
  })
);
