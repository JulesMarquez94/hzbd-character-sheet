/**
 * Who is selling, and the three documents that say so.
 *
 * Every fact a lawyer or a card network would ask for lives in `SELLER` below
 * and nowhere else. The three legal pages read it, the footer reads it, and the
 * refund page reads it, so the company address exists once in this repository
 * instead of three times in prose where two of them go stale.
 *
 * ----------------------------------------------------------------- fill me in
 * The entries marked TODO are the ones only the company can supply. Until they
 * are real, `sellerIsConfigured()` is false and the legal pages say plainly at
 * the top that they are a draft. That banner is deliberate: a terms page that
 * silently names "[Entity name]" as the contracting party is worse than one
 * that admits it is not finished, because the first kind gets shipped.
 *
 * ------------------------------------------------------------- not legal advice
 * These documents were drafted to be honest about what this site actually does
 * rather than to be exhaustive. They describe real behaviour — the webhook, the
 * tier ladder, what happens to a lapsed account — and that is their value. They
 * have not been reviewed by anyone qualified. Have a lawyer read them before the
 * first live payment.
 */

export const SELLER = {
  /* TODO: the exact registered name from the Florida Division of Corporations,
     including the suffix. "Hazebound Inc." and "Hazebound, Inc." are different
     strings and the one on the filing is the one that belongs here. */
  entity: '[Entity name], Inc.',

  /* TODO: the principal business address on the Florida filing. A registered
     agent's address is not the same thing; use the business address. */
  address: {
    line1: '[Street address]',
    line2: '',
    city: '[City]',
    state: 'FL',
    postal: '[ZIP]',
    country: 'United States',
  },

  /* TODO: a mailbox that a human reads. This one goes on the checkout page, in
     Stripe's receipts and in the dispute evidence, so it is the address a
     confused cardholder writes to instead of calling their bank. */
  email: '[support@your-domain]',

  /* The county whose courts govern the terms. Florida corporations normally
     name the county of the principal place of business. TODO: confirm. */
  county: '[County]',

  /* The trading name players actually see. This one is not a TODO. */
  brand: 'Hazebound',
};

/**
 * True once no TODO placeholder is left. The legal pages show a draft banner
 * while this is false, and `scripts/check-legal.mjs` fails the build on it, so
 * a deploy cannot quietly ship the placeholders.
 */
export function sellerIsConfigured() {
  return !JSON.stringify(SELLER).includes('[');
}

/**
 * The seller's address as one line, for the bottom of a legal page.
 */
export function sellerAddress() {
  const { line1, line2, city, state, postal, country } = SELLER.address;
  return [line1, line2, `${city}, ${state} ${postal}`, country].filter(Boolean).join(', ');
}

/* The date each document last changed in a way that affects a subscriber. Bump
   the one you edited, by hand, in the same commit. A "last updated" that moves
   on every deploy tells a reader nothing. */
export const UPDATED = {
  terms: '6 September 2026',
  privacy: '6 September 2026',
  refunds: '6 September 2026',
};

/**
 * The three pages, as data, so the footer and the router agree on what exists.
 */
export const LEGAL_PAGES = [
  { slug: 'terms', path: '/terms', label: 'Terms' },
  { slug: 'privacy', path: '/privacy', label: 'Privacy' },
  { slug: 'refunds', path: '/refunds', label: 'Refunds' },
];
