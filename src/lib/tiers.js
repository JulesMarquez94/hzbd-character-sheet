/**
 * Account tiers — what kind of account somebody has, and what it lets them do.
 *
 * Four of them, and they are a ladder rather than a set of flags: every tier
 * can do everything the one below it can, plus its own. That is what keeps the
 * table below readable as it grows, and it is why a capability is answered by
 * "is your tier at least this one" rather than by a list per tier.
 *
 *   free      the default. Anyone who signs up.
 *   premium   a paid account. The paid system does not exist yet; the tier
 *             does, so that nothing has to be retrofitted when it arrives.
 *   friend    given by hand, to people the table knows. Everything premium
 *             has, without the paying.
 *   admin     the keys. Edits anybody's sheet, and is the only tier that can
 *             set somebody else's.
 *
 * The tier lives in `profiles.role` in the database, which is the column that
 * already existed and already backs `public.is_admin()`. Rows written before
 * tiers say `'user'`, and that reads as `free` here so nothing has to be
 * migrated.
 *
 * ------------------------------------------------------------ what this is not
 * This decides what the *interface* offers. It is not a security boundary: the
 * row-level policies in supabase/schema.sql are, and a capability answered
 * here must always have a policy behind it if it guards something real. The
 * one thing this file must never be trusted for is deciding whether a write is
 * allowed.
 */

/* --------------------------------------------------------------- the ladder */

export const TIERS = [
  {
    id: 'free',
    rank: 0,
    label: 'Free',
    blurb: 'Everything the sheet does, with the art plates left empty.',
  },
  {
    id: 'premium',
    rank: 1,
    label: 'Premium',
    blurb: 'The full deck, art and all. Paid, once there is something to pay.',
  },
  {
    id: 'friend',
    rank: 2,
    label: 'Friend',
    blurb: 'Everything Premium has, given rather than bought.',
  },
  {
    id: 'admin',
    rank: 3,
    label: 'Admin',
    blurb: 'The keys. Any sheet, and the only tier that can set another.',
  },
];

const BY_ID = new Map(TIERS.map((tier) => [tier.id, tier]));

/**
 * A stored tier is only ever a hint: it may be missing, it may be the legacy
 * `'user'`, or it may be a value some later build invented and this one has
 * never heard of. Anything unrecognised reads as `free`, because the failure
 * that costs nothing is showing somebody less than they paid for, and the one
 * that costs something is the reverse.
 */
export function normalizeTier(value) {
  const id = String(value ?? '').trim().toLowerCase();
  if (id === 'user' || id === '') return 'free';
  return BY_ID.has(id) ? id : 'free';
}

export function getTier(value) {
  return BY_ID.get(normalizeTier(value)) ?? BY_ID.get('free');
}

/** Where a tier stands on the ladder. */
export function rankOf(value) {
  return getTier(value).rank;
}

/* ---------------------------------------------------------- the capabilities */

/**
 * What each capability costs, as the lowest tier that has it.
 *
 * Kept deliberately short. A capability belongs here once something actually
 * asks for it, not in advance of the question, or the table becomes a list of
 * guesses nobody can safely delete.
 */
export const CAPABILITIES = {
  /** See the art on cards and codex entries. The card rework's whole point. */
  art: 'premium',
  /** Open and edit a sheet somebody else owns. */
  editAny: 'admin',
  /** Set another account's tier. */
  setTier: 'admin',
};

export function can(tier, capability) {
  const needed = CAPABILITIES[capability];
  // An unknown capability is refused rather than allowed. A typo should lock a
  // door, never open one.
  if (!needed) return false;
  return rankOf(tier) >= rankOf(needed);
}

/* ------------------------------------------------------------ the ceilings */

/**
 * How many campaigns each tier may run. A number per tier rather than a
 * capability, because the question is "how many" and not "may they at all".
 *
 * This is what the interface offers; `public.campaign_slots` in
 * supabase/schema.sql is the same ladder again, behind a trigger, and is what
 * actually enforces it. Change one and change the other.
 */
export const CAMPAIGN_SLOTS = {
  free: 1,
  premium: 10,
  friend: 10,
  admin: 20,
};

export function campaignSlots(tier) {
  return CAMPAIGN_SLOTS[normalizeTier(tier)] ?? CAMPAIGN_SLOTS.free;
}

/* ----------------------------------------------------------------- the art */

/**
 * Whether a given piece of art is shown to this tier.
 *
 * Card art is coming in as plain links to an image host, and a free account is
 * meant to see the empty plate instead of the picture. That is the rule, and
 * this is the one place it is written down, so whoever wires the plates up
 * later cannot get the exception wrong.
 *
 * **Two exceptions**, and both are about whose picture it is rather than what
 * it is worth:
 *
 *   lore    art a player put on their own sheet — a portrait they uploaded, an
 *           image in their lore. Theirs, so it shows at every tier, always.
 *   promo   the sample card on the landing page. That card is the shop window:
 *           gating it would hide the thing being sold from everybody who has
 *           not bought it yet, which is exactly backwards. A signed-out visitor
 *           reads as `free`, so without this the one card on the front page
 *           would be the one card with no picture on it.
 *
 * Everything else is the codex's, which is the thing being given away, and it
 * goes through the gate. It is applied in exactly one place: the useCodexArt
 * hook in src/components/useCodexArt.js.
 */
export function showsArt(tier, source = 'codex') {
  if (source === 'lore' || source === 'promo') return true;
  return can(tier, 'art');
}
