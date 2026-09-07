import { requireSupabase } from './supabaseClient.js';
import { CAMPAIGN_SLOTS, CHARACTER_SLOTS, CREATURE_SLOTS, can } from './tiers.js';
import { LOCAL_CHARACTER_SLOTS } from './localCharacters.js';

/**
 * What Premium is, what it costs, and the three calls that sell it.
 *
 * The page at /premium renders this file and nothing else, which is the point:
 * a pricing page that lists its own features by hand drifts from the ladder the
 * moment a number changes, and then the site is advertising something it does
 * not do. Every row below reads its number out of src/lib/tiers.js, so a
 * ceiling that moves there moves here in the same commit.
 *
 * ------------------------------------------------------------------- the money
 * The price written here is **display copy**. What a card is actually charged is
 * the Stripe Price whose id lives in the Edge Function's environment and nowhere
 * near the browser. Changing this string changes the poster, not the till, so
 * change both together or the poster lies.
 *
 * ------------------------------------------------------------------ the calls
 * All three go through Edge Functions rather than talking to Stripe from here,
 * because a browser that could talk to Stripe would need a Stripe key, and a
 * key in a Vite bundle is a public key. See supabase/functions/_shared/billing.ts.
 */

/* ------------------------------------------------------------------ the plans */

/**
 * `key` is the only thing the browser ever sends. The function turns it into a
 * real price id through its own allowlist, so nothing here can be edited into a
 * cheaper subscription.
 *
 * The yearly plan is switched off until there is a Stripe price behind it. To
 * turn it on: make the price in Stripe, set STRIPE_PRICE_YEARLY on the
 * functions, then flip `enabled` and check the two strings below.
 *
 * It is worth doing sooner rather than later. Stripe's fee has a fixed part of
 * about $0.30 a charge, which is a tenth of a $3 month and a hundredth of a $30
 * year. The yearly plan is the same revenue with a tenth of the fee.
 */
export const PLANS = [
  {
    key: 'monthly',
    enabled: true,
    label: 'Monthly',
    price: '3',
    currency: '$',
    per: 'a month',
  },
  {
    key: 'yearly',
    enabled: true,
    label: 'Yearly',
    price: '30',
    currency: '$',
    per: 'a year',
    saving: 'two months free',
  },
];

/**
 * One note for every period, rather than one per plan.
 *
 * The plans used to carry a note each, and the page showed the first plan's.
 * That was harmless while only the monthly plan was enabled and quietly wrong
 * the moment the yearly one was: it promised a yearly subscriber their money
 * ran "to the end of the month you have paid for". The cancellation terms are
 * the same whatever the interval, so they are said once, in words that are true
 * of both.
 */
export const PLAN_NOTE =
  'Cancel any time. A subscription runs to the end of the period you have already paid for.';

export function offeredPlans() {
  return PLANS.filter((plan) => plan.enabled);
}

/* --------------------------------------------------------------- what it buys */

/**
 * The comparison table, as data.
 *
 * `free` and `premium` are what each side of the table says in that row. A row
 * whose `premium` is the same as its `free` does not belong here: this table is
 * the difference and nothing else, so that nobody reads it and feels sold a
 * thing they already had.
 *
 * The art row is not in it. Card art is a `friend` capability rather than a paid
 * one (see CAPABILITIES.art), so listing it would be advertising something a
 * payment does not buy. `PREMIUM_EXCLUDES` below is where that is said out loud
 * instead, on the page, in plain words.
 */
export const COMPARISON = [
  {
    id: 'characters',
    label: 'Characters in your account',
    free: `${CHARACTER_SLOTS.free}`,
    premium: `${CHARACTER_SLOTS.premium}`,
    note: `Plus ${LOCAL_CHARACTER_SLOTS} more kept on any device, signed in or not.`,
  },
  {
    id: 'campaigns',
    label: 'Campaigns you run',
    free: `${CAMPAIGN_SLOTS.free}`,
    premium: `${CAMPAIGN_SLOTS.premium}`,
    note: 'Sitting at somebody else’s table is free and always will be, however many.',
  },
  {
    id: 'creatures',
    label: 'Creatures you forge yourself',
    free: CREATURE_SLOTS.free === 0 ? 'None' : `${CREATURE_SLOTS.free}`,
    premium: `${CREATURE_SLOTS.premium}`,
    note: 'Build an enemy out of the same numbers the printed ones use, and lay it in your own encounters.',
  },
  {
    id: 'dice',
    label: 'The physics dice table',
    free: 'Flat table',
    premium: 'Dice that tumble',
    note: 'The same rolls either way. The roller decides the faces before anything draws them.',
  },
];

/**
 * What Premium is honest about not being. Said on the page, because a supporter
 * who finds this out afterwards is a refund and a bad afternoon.
 */
export const PREMIUM_EXCLUDES = [
  'The sheet, every card and the whole rulebook are free, and none of that is behind this.',
  'Card art is not part of it while the codex is still being drawn.',
  'Nothing here changes a roll, a rule or a number on a sheet.',
];

/** Whether this tier already has everything the page is selling. */
export function alreadyHasPremium(tier) {
  return can(tier, 'physics');
}

/* ------------------------------------------------------------------ the calls */

/**
 * An Edge Function's own error message, dug out of the failure.
 *
 * supabase-js reports a non-2xx as a FunctionsHttpError whose message is the
 * useless "Edge Function returned a non-2xx status code". The sentence worth
 * showing is in the body, which has to be read off `error.context`. A body that
 * will not parse leaves the generic line, which is at least true.
 */
async function readError(error, fallback) {
  try {
    const body = await error?.context?.json?.();
    /* `detail` is only ever present while STRIPE_DEBUG_ERRORS is on for the
       functions. When it is, it carries the provider's own sentence, which is
       the whole reason the flag exists — so show it rather than the polite
       line that hides it. */
    if (body?.error) return body.detail ? `${body.error} ${body.detail}` : body.error;
  } catch {
    /* Not JSON, or already consumed. The fallback says enough. */
  }
  return fallback;
}

async function callFunction(name, body, fallback) {
  const sb = requireSupabase();
  const { data, error } = await sb.functions.invoke(name, { body });
  if (error) throw new Error(await readError(error, fallback));
  return data;
}

/**
 * Start a checkout and hand back the Stripe page to go to.
 *
 * The caller navigates rather than opening a tab, because a payment page in a
 * popup is a payment page a phone will lose.
 */
export async function startCheckout(plan = 'monthly') {
  const data = await callFunction(
    'create-checkout-session',
    { plan },
    'The checkout could not be opened. Try again in a moment.'
  );
  if (!data?.url) throw new Error('The checkout could not be opened. Try again in a moment.');
  return data.url;
}

/** Stripe's own billing portal: change the card, read invoices, cancel. */
export async function openPortalUrl() {
  const data = await callFunction(
    'customer-portal',
    {},
    'The billing portal could not be opened. Try again in a moment.'
  );
  if (!data?.url) throw new Error('The billing portal could not be opened. Try again in a moment.');
  return data.url;
}

/**
 * Ask whether a finished checkout has landed yet.
 *
 * Only ever a nudge. The webhook is what decides a tier and the sheet is
 * already watching its own profile row, so this exists for the seconds before
 * the webhook arrives and for the rare morning when it does not.
 */
export async function confirmCheckout(sessionId) {
  return callFunction(
    'checkout-status',
    { session_id: sessionId },
    'Your payment went through. This page could not confirm it yet.'
  );
}
