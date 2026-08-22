/**
 * Loadouts: the sets that hand you a *choice* of cards rather than a fixed
 * hand.
 *
 * Most talent sets teach the same cards to everyone who takes them. A few do
 * not. A Mycomancer taking Rank 1 learns two Nature spells, and which two is
 * theirs to decide; at Rank 2 they know three, and Adept spells come within
 * reach. Nothing about that fits in a card, so the set carries a `loadout`
 * spec beside its cards, and this file is what turns the spec into a list of
 * real cards out of the codex.
 *
 * The split matters: talents.js is a leaf and may not import the card registry,
 * so it can only *describe* the pool (a kind, a school, how many are known at
 * each rank, which tiers are legal). Everything that has to look at the codex
 * happens here.
 *
 * ------------------------------------------------------------------ storage
 * Picks live on the talent entry itself, as `picks: ['bramble-whip', ...]`, so
 * handing the set back takes its spells with it. They are not level-bound:
 * swapping spells after a long rest is not undoing a level, and the card that
 * grants them says so in as many words.
 *
 * -------------------------------------------------------------------- rests
 * Which is why a rest can re-prepare them, and why the rest window asks. The
 * permission is the set's own `swap` list, transcribed off the granting card,
 * and the bottom of this file is what a rest needs to honour it: who may swap,
 * and what actually changed when they did.
 */

import { castModifier } from './cardText.js';
import { CARDS } from './weapons.js';
import { getTalent, normalizeTalents, setTalentPicks } from './talents.js';

/** The tier word a card's tags carry: "Novice Spell" -> "Novice". */
function tierOf(card) {
  for (const tag of card.tags ?? []) {
    const match = /^(Novice|Adept|Master)\b/.exec(tag);
    if (match) return match[1];
  }
  return null;
}

/**
 * The school a card belongs to. Spell banners read
 * "NOVICE SPELL - NATURE - BLOOD": the tier, then the school, then the sub-school.
 */
function schoolOf(card) {
  const tags = card.tags ?? [];
  return tags[1] ?? null;
}

/**
 * The sub-school under it, the third word on the banner: Flora, Wild, Life,
 * Blood. The school is what you are *allowed* to learn and rarely changes; the
 * sub-school is what a spell actually does, which is what a player is really
 * choosing between when they browse a pool of two dozen.
 */
function subSchoolOf(card) {
  const tags = card.tags ?? [];
  return tags[2] ?? null;
}

/* What a set does to the cards it hands out. A spell prepared by a set that
   casts off a different attribute prints that attribute's numbers, so the value
   on the card is the one this caster actually rolls.

   The rider itself is cardText.js's now, because a loadout is no longer the only
   thing that imposes one: every card that teaches a spell "cast with your
   highest Attribute" hands the same shape over. Re-exported so the reading of a
   loadout stays in one file. */
export { castModifier };

/** Everything in the codex the spec could ever draw from, tier or no tier. */
export function loadoutPool(spec) {
  if (!spec) return [];
  return CARDS.filter((card) => card.kind === spec.kind);
}

/** How many cards a set knows at a given rank. */
export function knownAt(spec, rank) {
  return spec?.known?.[rank] ?? 0;
}

/** Which tiers that rank may learn from. */
export function tiersAt(spec, rank) {
  return spec?.tiers?.[rank] ?? [];
}

/**
 * The tiers a rank opens that the rank below it could not reach.
 *
 * At Rank 1 the rank below reaches nothing, so everything the rank can learn
 * from is newly opened. At Rank 2 a Mycomancer keeps Novice and gains Adept,
 * and only Adept is new.
 */
export function openedAt(spec, rank) {
  const below = tiersAt(spec, rank - 1);
  return tiersAt(spec, rank).filter((tier) => !below.includes(tier));
}

/** The loadout spec a talent carries, or null for the sets that teach a fixed hand. */
export function loadoutOf(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return set?.loadout ?? null;
}

/** What one character's talent entry holds, whether it is legal or not. */
export function heldPicks(talents, talentId) {
  const entry = normalizeTalents(talents).find((row) => row.id === talentId);
  return entry?.picks ?? [];
}

/**
 * The whole pool measured against one set at one rank: what may be learned,
 * what is already known, and for everything else the one line saying why not.
 *
 * A card can be refused for two reasons, and they read differently at the
 * table: the wrong school is never going to be yours, while the wrong tier is
 * only a rank away. `gate` says which, because a wall that leaves both off has
 * only one of them to promise: a Mycomancer's thirty-four Elemental spells are
 * not waiting on a rank and counting them as though they were is a sentence the
 * set can never make good on.
 */
export function loadoutOptions({ talent, rank, picks }) {
  const spec = loadoutOf(talent);
  if (!spec) return [];

  const held = new Set(picks ?? []);
  const legalTiers = tiersAt(spec, rank);
  const modifiers = castModifier(spec);

  return loadoutPool(spec)
    .map((card) => {
      const tier = tierOf(card);
      const school = schoolOf(card);
      const sub = subSchoolOf(card);
      const known = held.has(card.id);
      const row = { card, tier, school, sub, known, modifiers };

      if (spec.school && school && school !== spec.school) {
        return { ...row, ok: false, gate: 'school', reason: `${school} school, not ${spec.school}` };
      }
      if (tier && legalTiers.length > 0 && !legalTiers.includes(tier)) {
        return { ...row, ok: false, gate: 'tier', reason: `${tier} needs a higher rank` };
      }
      return { ...row, ok: true };
    })
    .sort((a, b) => {
      if (a.ok !== b.ok) return a.ok ? -1 : 1;
      return a.card.name.localeCompare(b.card.name);
    });
}

/** Everything the panel needs about one set's loadout. */
export function loadoutState(talents, talent) {
  const spec = loadoutOf(talent);
  if (!spec) return null;

  const entry = normalizeTalents(talents).find((row) => row.id === (talent.id ?? talent));
  const rank = entry?.rank ?? 0;
  const options = loadoutOptions({ talent, rank, picks: entry?.picks ?? [] });

  // A rank lost, or a codex that dropped a card, can leave a stored pick that
  // is no longer legal. It is shown as held and counted, because quietly
  // deleting somebody's spell is worse than showing one they have to fix.
  const legal = new Set(options.filter((option) => option.ok).map((option) => option.card.id));
  const modifiers = castModifier(spec);
  const picks = (entry?.picks ?? []).map((id) => ({
    id,
    card: options.find((option) => option.card.id === id)?.card ?? null,
    ok: legal.has(id),
    modifiers,
  }));

  const known = knownAt(spec, rank);

  return {
    spec,
    rank,
    picks,
    known,
    chosen: picks.length,
    remaining: Math.max(0, known - picks.length),
    over: Math.max(0, picks.length - known),
    complete: picks.length >= known && picks.every((pick) => pick.ok),
    options,
    tiers: tiersAt(spec, rank),
  };
}

/**
 * Take or give back one card, capped at what the rank knows. At the cap the
 * oldest pick gives way, so a full hand is one tap to change rather than two.
 */
export function toggleLoadoutPick(talents, talentId, cardId, known) {
  const picks = heldPicks(talents, talentId);

  if (picks.includes(cardId)) {
    return setTalentPicks(talents, talentId, picks.filter((id) => id !== cardId));
  }
  // A rank that knows nothing takes nothing — without this, "replace the
  // oldest" below would happily store a pick into an empty allowance.
  if (!(Number(known) > 0)) return talents;
  if (picks.length >= known) {
    return setTalentPicks(talents, talentId, [...picks.slice(1), cardId]);
  }
  return setTalentPicks(talents, talentId, [...picks, cardId]);
}

/* ------------------------------------------------------------------ rests */

/**
 * Whether a set may re-choose its hand on a rest of this kind.
 *
 * The permission belongs to the set, transcribed off the card that hands the
 * cards over — a Mycomancer's Fungal Invocation says "whenever you take a long
 * rest, you can use your long rest action to change any number of learned
 * spells", so the spec carries `swap: ['long']`. A spec that
 * names no rest is offered none: a rest is not the place to invent a rule the
 * card never printed, and the panel on the sheet can still change a hand at any
 * time.
 */
export function swapsAtRest(spec, kind) {
  return Array.isArray(spec?.swap) && spec.swap.includes(kind);
}

/**
 * Every set this character holds that may re-prepare itself on this rest, each
 * with the whole state its chooser needs.
 *
 * A set that knows nothing yet — a rank that hands out no cards — is left out:
 * there is nothing to swap, and an empty pool in the rest window is a row that
 * only asks to be tapped and then apologises.
 */
export function restSwaps(talents, kind) {
  const rows = [];

  for (const entry of normalizeTalents(talents)) {
    const talent = getTalent(entry.id);
    if (!talent || !swapsAtRest(loadoutOf(talent), kind)) continue;

    const state = loadoutState(talents, talent);
    if (state && state.known > 0) rows.push({ talent, state });
  }

  return rows;
}

/** A card's printed name, or its id when this build's codex has no such card. */
function nameOfCard(id) {
  return CARDS.find((card) => card.id === id)?.name ?? id;
}

/**
 * What changed between two talent records, set by set — named rather than
 * counted, because "Bramble Whip put down, Spore Cloud taken up" is what the
 * player is about to agree to, and "2 changed" is not.
 *
 * Only sets that choose their cards are looked at, and only the ones that
 * actually moved come back.
 */
export function pickChanges(before, after) {
  const was = new Map(normalizeTalents(before).map((entry) => [entry.id, entry.picks ?? []]));
  const rows = [];

  for (const entry of normalizeTalents(after)) {
    const talent = getTalent(entry.id);
    const spec = loadoutOf(talent);
    if (!spec) continue;

    const held = entry.picks ?? [];
    const previous = was.get(entry.id) ?? [];
    const dropped = previous.filter((id) => !held.includes(id));
    const learned = held.filter((id) => !previous.includes(id));
    if (dropped.length === 0 && learned.length === 0) continue;

    rows.push({
      talent,
      spec,
      dropped: dropped.map(nameOfCard),
      learned: learned.map(nameOfCard),
    });
  }

  return rows;
}

/**
 * Everything a rank can legally learn from, and separately the part of it that
 * is *new* at this rank.
 *
 * A Mycomancer reading Rank 2 already knows what the Novice list looks like:
 * they have been choosing out of it since Rank 1. What Rank 2 actually gives
 * them is Adept, and that is what a preview of Rank 2 should be a list of.
 *
 * A rank that raises how many spells are known without opening a tier adds
 * nothing to the pool, so `fresh` falls back to the whole legal list rather
 * than to an empty one. "This rank opens no new spells" is true but useless
 * next to a blank page.
 */
function rankOptions(talent, rank) {
  const spec = loadoutOf(talent);
  const legal = loadoutOptions({ talent, rank, picks: [] }).filter((option) => option.ok);
  const opened = openedAt(spec, rank);
  const fresh = opened.length > 0 ? legal.filter((option) => opened.includes(option.tier)) : legal;
  return { legal, fresh, opened, widens: opened.length > 0 };
}

/** Which cards a rank adds to the pool, for the preview that lists them. */
export function newAtRank(talent, rank) {
  if (!loadoutOf(talent)) return [];
  return rankOptions(talent, rank).fresh;
}

/** What a rank would open up, for the preview page that has not taken it yet. */
export function rankPreview(talent, rank) {
  const spec = loadoutOf(talent);
  if (!spec) return null;

  const known = knownAt(spec, rank);
  const previous = knownAt(spec, rank - 1);
  const tiers = tiersAt(spec, rank);
  const { legal, fresh, opened, widens } = rankOptions(talent, rank);

  return {
    spec,
    known,
    gained: Math.max(0, known - previous),
    tiers,
    opened,
    widens,
    /* What the rank adds, which is what the preview counts and lists. The full
       legal pool is still here under `reach`: a rank 2 Mycomancer may spend
       their six picks on Novice spells if they want to, and the chooser has to
       go on offering them. */
    count: fresh.length,
    reach: legal.length,
  };
}
