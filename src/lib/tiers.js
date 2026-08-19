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

/* ----------------------------------------------------------------- the art */

/**
 * Whether a given piece of art is shown to this tier.
 *
 * Card art is coming in as plain links to an image host, and a free account is
 * meant to see the empty plate instead of the picture. That is the rule, and
 * this is the one place it is written down, so whoever wires the plates up
 * later cannot get the exception wrong.
 *
 * **The exception:** art a player put on their own sheet is theirs. A portrait
 * they uploaded, an image in their lore — those show to everybody at every
 * tier, always. The gate is on the *codex's* art, which is the thing being
 * given away, never on the player's own.
 *
 * Nothing calls this yet. The plates still render as they always have; this is
 * here so that turning the rule on later is one import and one condition
 * rather than a hunt through every component that draws a picture.
 */
export function showsArt(tier, source = 'codex') {
  if (source === 'lore') return true;
  return can(tier, 'art');
}
