/**
 * Account tiers — what kind of account somebody has, and what it lets them do.
 *
 * Four of them, and they are a ladder rather than a set of flags: every tier
 * can do everything the one below it can, plus its own. That is what keeps the
 * table below readable as it grows, and it is why a capability is answered by
 * "is your tier at least this one" rather than by a list per tier.
 *
 *   free      the default. Anyone who signs up.
 *   premium   a paid account. Two euros a month, through Stripe. See
 *             src/lib/premium.js for what is sold and
 *             supabase/functions/ for how a payment becomes this word.
 *   friend    given by hand, to people the table knows. Everything premium
 *             has, without the paying, plus the card art.
 *   admin     the keys. Edits anybody's sheet, and is the only tier that can
 *             set somebody else's.
 *
 * As of 2026-09-06 the ladder holds for *everything*, capabilities and ceilings
 * alike. It did not always: `friend` used to sit above `premium` and get fewer
 * creature slots than it, which was a standing exception with a comment
 * apologising for itself. Jules's ruling that "friend accounts are free premium
 * accounts" retired it. If a future ceiling wants to break the ladder again,
 * that is allowed and this is where it has to be said out loud.
 *
 * The tier lives in `profiles.role` in the database, which is the column that
 * already existed and already backs `public.is_admin()`. Rows written before
 * tiers say `'user'`, and that reads as `free` here so nothing has to be
 * migrated.
 *
 * ------------------------------------------------------------ what this is not
 * This decides what the *interface* offers. It is not a security boundary: the
 * row-level policies and the slot triggers in supabase/schema.sql are, and a
 * capability answered here must always have a policy behind it if it guards
 * something real. The one thing this file must never be trusted for is deciding
 * whether a write is allowed.
 *
 * Nothing here is ever written by the browser either. A tier is derived from a
 * subscription by `public.apply_entitlements`, called by the webhook handler as
 * the service role, and `guard_account_tier` refuses every other writer.
 */

/* --------------------------------------------------------------- the ladder */

export const TIERS = [
  {
    id: 'free',
    rank: 0,
    label: 'Free',
    blurb: 'The whole sheet and every rule, with three characters and one campaign.',
  },
  {
    id: 'premium',
    rank: 1,
    label: 'Premium',
    blurb: 'A bigger vault, five campaigns and creatures of your own.',
  },
  {
    id: 'friend',
    rank: 2,
    label: 'Friend',
    blurb: 'Everything Premium has, given rather than bought, with the card art on.',
  },
  {
    id: 'admin',
    rank: 3,
    label: 'Admin',
    blurb: 'The keys. Any sheet, and the only tier that can set another.',
  },
];

const BY_ID = new Map(TIERS.map((tier) => [tier.id, tier]));

/** Tiers that were paid for rather than given. What the account page offers a
    Manage Subscription button for, and nothing else reads it. */
export const PAID_TIER = 'premium';

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
  /**
   * See the art on cards and codex entries.
   *
   * **Not a paid capability, and that is deliberate.** Jules, 2026-09-06: "the
   * art currently is only for friend account". So this asks for `friend`, which
   * on the ladder means friends and admins and not the people paying. Premium
   * buys room to play in rather than pictures.
   *
   * It reads oddly next to a price, and it is the right way round while the
   * plates are still arriving: what is sold has to be something that will still
   * be there next month. Move it to `premium` when the artwork is finished and
   * the whole codex is drawn, and the shop window changes with it.
   */
  art: 'friend',
  /**
   * Roll on a physics table rather than a flat one.
   *
   * The one capability that changes nothing about what happens. Every roll is
   * decided by dice.js before anything draws it, so a free sheet and a paid one
   * are shown the same faces, the same total and the same verdict, and the log
   * cannot tell which of them threw it. What this buys is the tumble.
   *
   * Which is also why it can be refused for reasons that have nothing to do with
   * the tier: a reader who asked for less motion and a browser that failed to
   * fetch the chunk both fall back to the flat table and lose nothing.
   */
  physics: 'premium',
  /** Open and edit a sheet somebody else owns. */
  editAny: 'admin',
  /** Set another account's tier. */
  setTier: 'admin',
  /**
   * Publish a forged creature into the bestiary everybody reads.
   *
   * The admin half of the creature forge. Anyone with a slot below may forge a
   * creature onto their own shelf; this is the one that writes into the shelf
   * every account sees, which is why it is the keys and not a slot count.
   * See CREATURE_SLOTS for the other half.
   */
  forgeCodex: 'admin',
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
 * The three ceilings, each a number per tier rather than a capability, because
 * the question is "how many" and not "may they at all". A zero is how a tier is
 * refused outright.
 *
 * Every one of them has a twin in supabase/schema.sql behind a trigger, and the
 * trigger is what actually enforces it: `character_slots`, `campaign_slots` and
 * `creature_slots`. **Change one and change the other.** These are what the
 * interface offers, and an interface is not a boundary.
 *
 * All three are checked on insert only. A subscription that lapses therefore
 * takes nothing away: an account that held five campaigns keeps all five open
 * and editable and simply cannot start a sixth until it is under the free
 * ceiling again. Nothing a player made is ever deleted for not paying.
 *
 * Jules, 2026-09-06: three characters free and twenty-five paid, one campaign
 * free and five paid, "for enemies and other creation have like 50".
 */
export const CHARACTER_SLOTS = {
  free: 3,
  premium: 25,
  friend: 25,
  admin: 50,
};

export function characterSlots(tier) {
  return CHARACTER_SLOTS[normalizeTier(tier)] ?? CHARACTER_SLOTS.free;
}

export const CAMPAIGN_SLOTS = {
  free: 1,
  premium: 5,
  friend: 5,
  admin: 20,
};

export function campaignSlots(tier) {
  return CAMPAIGN_SLOTS[normalizeTier(tier)] ?? CAMPAIGN_SLOTS.free;
}

/**
 * How many creatures of their own each tier may keep on its bestiary shelf.
 *
 * A count per account rather than per campaign: the shelf follows the person
 * who forged it, so the same fifty are there in every table they run. Only a
 * personal creature is counted, because a published one is an admin's
 * contribution to the codex rather than their own shelf.
 */
export const CREATURE_SLOTS = {
  free: 0,
  premium: 50,
  friend: 50,
  admin: 60,
};

export function creatureSlots(tier) {
  return CREATURE_SLOTS[normalizeTier(tier)] ?? CREATURE_SLOTS.free;
}

/** Whether this tier may forge a creature of its own at all. */
export function canForgeCreature(tier) {
  return creatureSlots(tier) > 0;
}

/* ----------------------------------------------------------------- the art */

/**
 * Whether a given piece of art is shown to this tier.
 *
 * Card art is coming in as plain links to an image host, and an account below
 * `friend` is meant to see the empty plate instead of the picture. That is the
 * rule, and this is the one place it is written down, so whoever wires the
 * plates up later cannot get the exception wrong. See CAPABILITIES.art for why
 * the gate is set where it is.
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
