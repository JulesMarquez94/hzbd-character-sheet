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
 *
 * ------------------------------------------------------------- two shapes
 * A pool is either a **hand** or a **library**, and the spec says which by
 * carrying `known` or `capacity`.
 *
 *   a hand      a fixed size per rank, re-chosen freely. A Mycomancer knows
 *               four Primal spells at Rank 2, has four, and cannot have five.
 *               `swap: ['long']` re-prepares any number of them.
 *   a library   a ceiling per rank *and level*, filled one card at a time and
 *               never emptied. An Arcanist's spellbook holds 10 x rank + level,
 *               starts with `start` cards and grows by `research: ['long']`,
 *               one a rest, replacing only once it is full.
 *
 * The difference the code actually turns on is **capacity against allowance**.
 * A hand has one number and they are the same. A library has two: what it could
 * hold one day, and what it may hold tonight. See `allowanceAt`.
 *
 * -------------------------------------------------------- and one more axis
 * Every pool before 2026-09-09 held each card at most once, and nothing said so
 * out loud: the stored picks were deduped on the way in and the chooser toggled.
 * A Runebearer may inscribe the same spell twice, and each copy is its own
 * one-shot ("each beings it on 1 time use instance", Jules), so a spec may carry
 * `repeat: true` and everything that counts picks counts *copies* instead.
 *
 * It is orthogonal to the two shapes above: a hand or a library may repeat, and
 * a pool that does not carry the flag behaves exactly as it always did, down to
 * the dedupe in `normalizeTalents`. What changes for a repeating pool is only
 * this: a tap is an add rather than a toggle, taking one back drops one copy,
 * and the count on the wall says how many are on you. See `allowsRepeat`.
 */

import { sourceRow } from './attribution.js';
import { compareCards } from './cardOrder.js';
import { castModifier } from './cardText.js';
import { CARDS } from './weapons.js';
import { TALENT_CARDS, getTalent, normalizeTalents, setTalentPicks } from './talents.js';

/** The tier word a card's tags carry: "Novice Spell" -> "Novice". */
function tierOf(card) {
  for (const tag of card.tags ?? []) {
    const match = /^(Novice|Adept|Master)\b/.exec(tag);
    if (match) return match[1];
  }
  return null;
}

/**
 * What a card calls its rung when the rung is not on the ladder: "Unique".
 *
 * Only ever used to say *why* a card was refused, so a reader is told the real
 * word off the card rather than "no tier". A card whose first tag is not a rung
 * at all has none to report, and "Untiered" is the honest answer for it.
 */
function tierWord(card) {
  const first = (card.tags ?? [])[0] ?? '';
  const word = first.replace(/\s*(Spell|Martial Move|Talent|Ability)\s*$/i, '').trim();
  return word || 'Untiered';
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

/**
 * Everything in the codex the spec could ever draw from, tier or no tier.
 *
 * **A card a set hands over outright is not in anybody's pool.** That was true by
 * accident until 2026-09-03, when three talent cards became Martial Moves — see
 * "the granted three" in talents.js — and `kind` alone stopped separating the
 * codex from the sets: a Duelist's chooser duly offered AMBUSH, and a Duelist who
 * picked it held a Trickster card nobody had paid a rank for.
 *
 * So the filter says the rule outright rather than leaning on the kinds happening
 * not to overlap. `TALENT_CARDS` is every card every set grants, which is exactly
 * the thing a pool must not contain, and it costs one lookup per card at module
 * load. It is right for every kind and not just this one: a set that granted a
 * spell tomorrow would not want it appearing in a spellbook chooser either.
 */
const GRANTED = new Set(TALENT_CARDS.map((card) => card.id));

export function loadoutPool(spec) {
  if (!spec) return [];
  return CARDS.filter((card) => card.kind === spec.kind && !GRANTED.has(card.id));
}

/** Whether a spec keeps a library rather than a prepared hand. */
export function isLibrary(spec) {
  return Boolean(spec?.capacity);
}

/**
 * Whether the pool *is* the hand: everything in it that this rank may reach is
 * known, and there is nothing to choose.
 *
 * The third shape, and the Necromancer's (2026-09-09). GRAVE LORE: "You know
 * every Death spell in the codex." That is not a hand of four out of twelve and
 * it is not a book filled a spell a night, it is the whole family, arriving as
 * the rungs open. So the spec carries no `known` and no `capacity`, only `all`,
 * and the count comes off the codex.
 *
 * Nothing is stored for such a pool, which is the point: `picks` on the talent
 * entry would be twelve ids that can never be anything else, and the first time
 * a spell was added to the family every existing Necromancer would be missing it.
 */
export function isWhole(spec) {
  return Boolean(spec?.all);
}

/**
 * Whether the same card may be held more than once.
 *
 * The Runebearer's, and the reason it exists: a rune fires once and a second
 * copy of the same rune is a second firing, so "no spell can be inscribed twice"
 * was dropped on 2026-09-09. Every other pool holds each card at most once, and
 * for those this is false and nothing below it changes.
 *
 * Read in three places, and they are the whole of it: `normalizeTalents` keeps
 * duplicates instead of deduping them, `toggleLoadoutPick` adds instead of
 * toggling, and the chooser counts copies rather than asking whether a card is
 * in the list. A whole pool can never repeat: it *is* the codex, and a codex
 * cannot hold a card twice.
 */
export function allowsRepeat(spec) {
  return Boolean(spec?.repeat) && !isWhole(spec);
}

/** How many copies of one card a list of picks holds. */
export function copiesOf(picks, cardId) {
  return (picks ?? []).filter((id) => id === cardId).length;
}

/**
 * Every card in the pool this rank may legally hold.
 *
 * The gates, in one place, because two callers need them: `loadoutOptions`, which
 * has to say *why* a card was refused, and everything about a whole pool, which
 * only needs the list. A gate added here is added to both.
 */
function gateOf(spec, card, legalTiers) {
  if (card.placeholder) {
    return { gate: 'school', reason: 'a stand-in for a school not written yet' };
  }
  const school = schoolOf(card);
  if (spec.school && school && school !== spec.school) {
    return { gate: 'school', reason: `${school} school, not ${spec.school}` };
  }
  /* And the family under it, which is the Necromancer's. A Death spell is a
     Primal spell, and a Primal pool that took the whole school would hand a
     Necromancer the Flora and the Wild along with their own dead. The school
     gate above is not enough on its own: this is the narrower one, and a spec
     with no `family` is unchanged by it. */
  if (spec.family && subSchoolOf(card) !== spec.family) {
    return { gate: 'school', reason: `${subSchoolOf(card) ?? 'no family'}, not ${spec.family}` };
  }
  /* No `tier &&` guard any more, and that is a real change. A card off the
     ladder used to pass this gate, and it was safe only because the school
     gate above caught it first: spells.js says so in as many words, that a
     Unique Spell stays out of every pool because "no set's school is
     Elemental or Nightmare". The Arcanist is the first spec to name no
     school at all, so that gate no longer fires and this one has to. */
  const tier = tierOf(card);
  if (legalTiers.length > 0 && !legalTiers.includes(tier)) {
    return {
      gate: 'tier',
      reason: tier
        ? `${tier} needs a higher rank`
        : `${tierWord(card)} is not a rung any set reaches`,
    };
  }
  return null;
}

/**
 * The cards a whole pool holds at a rank, in printed order.
 *
 * The list *is* the hand, so this is what everything about such a pool counts,
 * prints and plays. Ordered by the codex's own law (see cardOrder.js) rather than
 * by the registry's order, because it is read as a list of spells rather than
 * chosen from.
 */
export function wholePool(spec, rank) {
  if (!isWhole(spec) || !(Math.floor(Number(rank) || 0) > 0)) return [];
  const legalTiers = tiersAt(spec, rank);
  return loadoutPool(spec)
    .filter((card) => gateOf(spec, card, legalTiers) === null)
    .sort(compareCards);
}

/**
 * How many cards a set knows at a given rank.
 *
 * For a hand that is the whole story and `level` is ignored. For a library it
 * falls through to the ceiling, so every caller that only ever wanted "how big
 * can this get" keeps working without knowing which shape it is holding: the
 * rank preview counts it, and `TalentBlock` compares two ranks of it to decide
 * whether a rank just widened the pool enough to open the chooser.
 */
export function knownAt(spec, rank, level = 1, attributes = null) {
  if (isWhole(spec)) return wholePool(spec, rank).length;
  if (isLibrary(spec)) return capacityAt(spec, rank, level, attributes);
  return spec?.known?.[rank] ?? 0;
}

/**
 * The ceiling on a library: everything it could ever hold at this rank and this
 * level.
 *
 * ARCANE RESEARCH: "Your spellbook can hold a number of spells equal to your
 * Rank in Arcanist multiplied by 10 + your level." The formula is the spec's
 * `{ perRank, perLevel }` rather than a number per rank, because level moves
 * underneath it and no `known` array can be indexed by two things.
 *
 * A rank of 0 is a set not taken, and it holds nothing. The level floors at 1,
 * which is the only level a character can actually be at their lowest.
 *
 * ------------------------------------------------------------- the third term
 * `perStat` is the Runebearer's, and it is the first ceiling in the codex that
 * an *attribute* moves: RUNEWORK carries "half your Physique, plus 4 for every
 * Rank in Runebearer", so the slate grows when the body does. It is read off
 * whatever `attributes` is handed in, which is a character on every caller that
 * has one, and it contributes nothing at all to the two callers that do not (a
 * Duelist's hand and a rank-to-rank comparison, neither of which carries one).
 *
 * Divided rather than scaled by a fraction, so "half" is exact arithmetic and
 * not a float that rounds where nobody is looking, and floored on its own before
 * the other two terms join it: half of 5 is 2, and 2 + 4 is 6.
 */
export function capacityAt(spec, rank, level = 1, attributes = null) {
  if (isWhole(spec)) return wholePool(spec, rank).length;
  if (!isLibrary(spec)) return spec?.known?.[rank] ?? 0;
  if (!(Math.floor(Number(rank) || 0) > 0)) return 0;

  const perRank = Math.floor(Number(spec.capacity.perRank) || 0) * Math.floor(Number(rank) || 0);
  const perLevel =
    Math.floor(Number(spec.capacity.perLevel) || 0) * Math.max(1, Math.floor(Number(level) || 1));
  return Math.max(0, perRank + perLevel + statTerm(spec.capacity.perStat, attributes));
}

/** The `perStat` half of a ceiling: `{ stat, divide }` read against a character. */
function statTerm(perStat, attributes) {
  if (!perStat || !attributes) return 0;

  const held = Math.max(0, Math.floor(Number(attributes[perStat.stat]) || 0));
  const divide = Math.max(1, Math.floor(Number(perStat.divide) || 1));
  return Math.floor(held / divide);
}

/**
 * How many a character may hold **right now**, which is the number every chooser
 * is actually capped at.
 *
 * For a hand it is the hand: nothing about it grows between ranks.
 *
 * For a library it is the interesting one. A spellbook holding 11 does not hand
 * over 11 spells, it hands over `start` of them and then one a night, and the
 * only record of how many nights have been spent is **how many are written in
 * it**. So the allowance is what is held, floored at the free grant and ceilinged
 * at the capacity, plus whatever the window in front of the player is granting:
 * `grant: 1` is a long rest's research action, and it is what lets exactly one
 * more card in. Past that the chooser's own "replace the oldest" takes over,
 * which is the card's "you will have to replace a spell" without a line of its
 * own.
 *
 * No stored counter, deliberately. A `researched: 6` column on the talent entry
 * would be a second source of truth for a thing the picks already say, and the
 * two would drift the first time somebody edited a book by hand.
 */
export function allowanceAt(spec, rank, level = 1, held = 0, grant = 0, attributes = null) {
  if (!isLibrary(spec)) return knownAt(spec, rank);

  const capacity = capacityAt(spec, rank, level, attributes);
  if (capacity === 0) return 0;

  const start = Math.max(0, Math.floor(Number(spec.start) || 0));
  const have = Math.max(0, Math.floor(Number(held) || 0));
  const step = Math.max(0, Math.floor(Number(grant) || 0));
  return Math.min(capacity, Math.max(start, have) + step);
}

/**
 * The rider a set imposes on the cards it hands out, at the rank it is held at.
 *
 * Two things ride, and they arrive from different places. `cast` is the set's
 * and never changes: a Mycomancer's spells are cast on Instinct at every rank.
 * `boost` is a *rank's*, and the Arcanist's OVERLOAD is the first of them:
 * "All spells from your spellbook are Empowered and you have Advantage when
 * rolling for those spells" is a Rank 2 card, so it is an array indexed by rank
 * like every other grant in the codex.
 *
 * Both end up on the prepared card rather than in its text, which is the whole
 * point: the same spell in somebody else's book prints no extra die and no
 * arrow, and neither card had to be rewritten to say so.
 */
export function loadoutModifiers(spec, rank) {
  const riders = { ...(castModifier(spec) ?? {}) };
  /* Every rider on this object, itemised and named, for the one place with room
     to print all of it. "if my spells are empowerd because of talents I should
     see", 2026-08-28: a set that Empowers a whole spellbook used to move the
     number on fifty cards and appear on none of them. See attribution.js. */
  const sources = [];

  /* The attribute a set casts off, which is not a number and changes every roll
     on every card in the pool. Credited to the set, since that is the only name
     a reader can look up. */
  const cast = sourceRow(spec?.label, { stat: riders.stat });
  if (cast) sources.push(cast);

  const empower = Math.max(0, Math.floor(Number(spec?.boost?.empower?.[rank]) || 0));
  const advantage = Math.max(0, Math.floor(Number(spec?.boost?.advantage?.[rank]) || 0));
  if (empower > 0) riders.empower = empower;
  if (advantage > 0) {
    riders.advantage = advantage;
    /* Named, because the arrow in the card's corner says what lent it and a
       reader with two sources of advantage needs to know which came off. */
    riders.advantageFrom = [spec.boost.from ?? spec.label];
  }

  const boost = sourceRow(spec?.boost?.from ?? spec?.label, { empower, advantage });
  if (boost) sources.push(boost);

  /* And what a rank takes *off* a card, which is the same shape running the other
     way. PERFECT CASTING is the first of them: "Spells from your spellbook cost 1
     less Action Point to cast, to a minimum of 1" is a Rank 3 card, so it is an
     array indexed by rank sitting beside the boost.

     The cut and its floor ride rather than the finished cost, because there is no
     one finished cost to ride: every spell in the book prints its own Action
     Points, and a rider carrying "2" would be wrong on all but one of them. The
     two meet in cardCost in cardText.js, which is the only place a printed cost
     and a rider that cuts it are ever read together.

     This is the first cut in the codex to be wired rather than left in prose. The
     four before it stay printed, because they are on sets that hand out no pool
     and so have no rider to ride: see data/README.md. */
  const cut = Math.max(0, Math.floor(Number(spec?.discount?.ap?.[rank]) || 0));
  if (cut > 0) {
    riders.apCut = cut;
    riders.apFloor = Math.max(0, Math.floor(Number(spec.discount.floor) || 0));
    riders.apCutFrom = [spec.discount.from ?? spec.label];

    const saved = sourceRow(spec.discount.from ?? spec.label, { apCut: cut });
    if (saved) sources.push(saved);
  }

  /* And the third way a pool can move a price, which is neither a boost nor a
     cut: a set that charges its *own* price for everything in it, whatever the
     card prints. RUNE ACTIVATION is the first and the reason this exists: "fire
     one of your inscribed spells for 1 Action Point and no Willpower" is a flat
     1 and a flat 0 across a pool where the printed costs run from 1 to 5.

     A cut could not say it. `apCut` takes a constant off every card, so a pool
     of thirty different printed costs would come out thirty different numbers,
     and no cut at all reaches the Willpower. So this is a *set* rather than a
     subtraction, and `cardCost` prints the old number struck through beside the
     new one exactly as it does for a cut. See cardCost in cardText.js.

     Not indexed by rank, unlike the boost and the cut above. Both of those are a
     later rank changing what an earlier one already handed over; this is the card
     that hands the pool over in the first place, so it is true at every rank the
     set is held at and false at no rank at all. */
  const price = spec?.price ?? null;
  if (price && rank > 0) {
    if (Number.isFinite(Number(price.ap))) riders.apSet = Math.max(0, Math.floor(Number(price.ap)));
    if (Number.isFinite(Number(price.wp))) riders.wpSet = Math.max(0, Math.floor(Number(price.wp)));
    riders.costFrom = [price.from ?? spec.label];
  }

  /* And the fourth thing a pool can do to a card, which is to take something off
     it: `halves: false` refuses the optional second half.

     The Runebearer's, and Jules's reversal of his own 2026-09-08 ruling
     ("Simply make it that Runebearer cannot overcast, multicast of other
     keywords", 2026-09-09). A rune fires as printed and nothing more. It rides
     on the pool rather than on the cards, exactly as the price does, because the
     same spell out of a spellbook is Overcast as freely as it ever was: the
     refusal belongs to the slate it is inscribed on.

     `noHalfFrom` is what the prompt credits, so the one place the option used to
     be says who took it away rather than quietly printing one fewer control. */
  if (spec?.halves === false && rank > 0) {
    riders.noHalf = true;
    riders.noHalfFrom = [spec.halvesFrom ?? spec.label];
  }

  if (sources.length > 0) riders.sources = sources;

  return Object.keys(riders).length > 0 ? riders : null;
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

  const held = picks ?? [];
  const legalTiers = tiersAt(spec, rank);
  const modifiers = loadoutModifiers(spec, rank);

  return loadoutPool(spec)
    .map((card) => {
      const tier = tierOf(card);
      const school = schoolOf(card);
      const sub = subSchoolOf(card);
      /* How many are held, and whether any is. `known` was the only one of these
         until a pool could hold two of the same card; it stays a boolean because
         every wall, every count and every refusal downstream reads it as one. */
      const copies = copiesOf(held, card.id);
      const known = copies > 0;
      const row = { card, tier, school, sub, known, copies, modifiers };

      /* Every gate in one place, so the chooser's reasons and a whole pool's
         count can never disagree about what is legal. The stand-in gate among
         them fires on nothing today: `unwritten-light` and `unwritten-shadow`
         were the only two cards that ever carried the flag, and the Ethereal
         school retired both on 2026-08-25 by simply existing. See `gateOf`, and
         "the stand-ins" at the foot of spells.js. */
      const refused = gateOf(spec, card, legalTiers);
      return refused ? { ...row, ok: false, ...refused } : { ...row, ok: true };
    })
    /* What you may take first, and then the law in cardOrder.js: the rung, the
       school, the family, and inside a family the codex's own order.

       It sorted alphabetically here until 2026-08-25, which put Barkskin above
       Bramble Whip and Wild Strider fifty rows from the Flora it is shelved
       beside. Jules asked for the ladder: "Novice, Adept then Master, and then
       inside that first main school and secondary school." */
    .sort((a, b) => {
      if (a.ok !== b.ok) return a.ok ? -1 : 1;
      return compareCards(a.card, b.card);
    });
}

/**
 * Everything the panel needs about one set's loadout.
 *
 * `level` is the character's, and only a library reads it: it is half of the
 * ceiling formula, so a state worked out without it would quietly under-report a
 * spellbook by up to ten spells. Every caller that holds a character passes it.
 *
 * `grant` is what the window in front of the player is handing over on top of
 * what they already hold, and it is only ever 1: a long rest's research action.
 * See `allowanceAt`.
 *
 * `base` is **how many the window opened with**, and it defaults to how many are
 * held right now, which is right for every chooser that is not a draft.
 *
 * A rest window is a draft, and there it matters: a library's allowance is measured
 * off what is written in the book, so measuring it off the draft raised the
 * allowance by one every time the draft gained a card. "Research a single spell"
 * became research as many as you cared to tap. Measured off the record the night
 * started from, one night grants exactly one.
 *
 * `capped` is **which of a library's two numbers this chooser answers to**, and it
 * is the difference between the sheet and a rest.
 *
 *   allowance   a rest. One night's work, so the book grows by exactly what the
 *               window granted and the tap after that replaces.
 *   capacity    the sheet's own panel, which may fill the book to its ceiling.
 *
 * A hand has one number twice, so this changes nothing for every other set. For a
 * library it is the whole of the rank-up bug it was written for: pinned to the
 * allowance, a panel could never write into the room a rank had just bought, and
 * every tap in it silently pushed out the oldest spell instead. The panel is the
 * sheet's editing surface, the same way it can rearrange a Mycomancer's hand on a
 * day that is not a rest: the rules live in the rest window, and it still grants
 * one. Flagged in data/README.md.
 */
export function loadoutState(
  talents,
  talent,
  { level = 1, grant = 0, capped = 'allowance', base = null, attributes = null } = {}
) {
  const spec = loadoutOf(talent);
  if (!spec) return null;

  const entry = normalizeTalents(talents).find((row) => row.id === (talent.id ?? talent));
  const rank = entry?.rank ?? 0;

  /* ---- a whole pool answers before any of this ----
     Its hand is the codex, so there are no stored picks to reconcile, no
     allowance to measure and nothing it can owe. The shape handed back is the
     same one every reader downstream already knows: the Abilities tab lists
     `picks`, the quick bar plays them, and `complete` and `owed` keep the
     Advancement tab from badging a set that has nothing left to answer. What is
     different is `whole`, which is what a block reads to know it must not offer
     a chooser: there is nothing in here anybody may change. */
  if (isWhole(spec)) {
    const modifiers = loadoutModifiers(spec, rank);
    const cards = wholePool(spec, rank);
    const picks = cards.map((card) => ({
      id: card.id,
      key: card.id,
      copy: 1,
      card,
      ok: true,
      modifiers,
    }));

    return {
      spec,
      rank,
      picks,
      known: picks.length,
      capacity: picks.length,
      library: false,
      whole: true,
      repeat: false,
      full: true,
      chosen: picks.length,
      remaining: 0,
      owed: 0,
      over: 0,
      complete: true,
      options: loadoutOptions({ talent, rank, picks: cards.map((card) => card.id) }),
      tiers: tiersAt(spec, rank),
    };
  }

  const options = loadoutOptions({ talent, rank, picks: entry?.picks ?? [] });

  // A rank lost, or a codex that dropped a card, can leave a stored pick that
  // is no longer legal. It is shown as held and counted, because quietly
  // deleting somebody's spell is worse than showing one they have to fix.
  const legal = new Set(options.filter((option) => option.ok).map((option) => option.card.id));
  const modifiers = loadoutModifiers(spec, rank);
  /* `key` rather than `id` is what a list renders against, because a repeating
     pool holds two rows wearing one id and React would key both the same. It is
     the id and which copy this is, which is stable for as long as the list is:
     dropping the first of two Fire Seeds renumbers the second, and that is the
     same renumbering the list itself just did. */
  const seen = new Map();
  const picks = (entry?.picks ?? []).map((id) => {
    const copy = (seen.get(id) ?? 0) + 1;
    seen.set(id, copy);

    return {
      id,
      key: copy > 1 ? `${id}#${copy}` : id,
      copy,
      card: options.find((option) => option.card.id === id)?.card ?? null,
      ok: legal.has(id),
      modifiers,
    };
  });

  /* The two numbers, and for a hand they are the same one twice. `known` is
     what the chooser is capped at and what every "3 of 4 chosen" line counts
     against; `capacity` is the ceiling a library is working towards, and it is
     the only number ARCANE RESEARCH actually prints. */
  const capacity = capacityAt(spec, rank, level, attributes);
  const known =
    capped === 'capacity'
      ? capacity
      : allowanceAt(spec, rank, level, base ?? picks.length, grant, attributes);

  /* And the third, which is the only one a pool can actually *owe* you.

     A hand owes its whole count: a Rank 2 Mycomancer with two spells is two short
     of the four it knows, and the block should say so. A library owes the cards
     that arrive with the set and nothing after them. The room a rank opens is
     room, not a debt, so a spellbook holding its five with thirty places left is
     finished rather than four fifths unfinished, and the button on it reads "open
     your spellbook" instead of "write in 30 more spells". */
  const owed = isLibrary(spec)
    ? Math.max(0, Math.min(capacity, Math.max(0, Math.floor(Number(spec.start) || 0))) - picks.length)
    : Math.max(0, known - picks.length);

  return {
    spec,
    rank,
    picks,
    known,
    capacity,
    library: isLibrary(spec),
    whole: false,
    /* Whether one card may be held twice, so a chooser knows a tap on something
       already held is another copy rather than giving it back. */
    repeat: allowsRepeat(spec),
    /* Whether there is any room left at all, which is what turns the rest window's
       line from "adds one more" into "replaces one already written". */
    full: isLibrary(spec) && picks.length >= capacity,
    chosen: picks.length,
    remaining: Math.max(0, known - picks.length),
    owed,
    over: Math.max(0, picks.length - known),
    complete: owed === 0 && picks.every((pick) => pick.ok),
    options,
    tiers: tiersAt(spec, rank),
  };
}

/**
 * Take or give back one card, capped at what the rank knows. At the cap the
 * oldest pick gives way, so a full hand is one tap to change rather than two.
 *
 * `how` is which of the three a gesture meant, and all three are honoured by
 * every pool:
 *
 *   toggle   in the list, take it out; out of it, put it in. What a tap on a
 *            wall has always been, and still the default.
 *   add      have it. One more copy where the pool allows copies, and nothing at
 *            all where it does not and one is already held.
 *   drop     one copy back, the newest of them. The newest rather than the
 *            oldest because it is the one the last tap put on: taking back what
 *            you just did should undo what you just did.
 *
 * The two new ones exist because a drag has a direction and a tap does not.
 * Dropping a card on the column means *have this*, and if it were read as a
 * toggle then dragging something you already held would quietly take it off,
 * which is the opposite of what the gesture looks like.
 */
export function toggleLoadoutPick(talents, talentId, cardId, known, how = 'toggle') {
  const picks = heldPicks(talents, talentId);
  const repeat = allowsRepeat(loadoutOf(getTalent(talentId)));
  const held = picks.includes(cardId);

  if (how === 'drop' || (how === 'toggle' && held)) {
    const at = picks.lastIndexOf(cardId);
    if (at < 0) return talents;
    return setTalentPicks(talents, talentId, picks.filter((_, i) => i !== at));
  }

  // Already have it, and this pool holds one of each. Nothing to do.
  if (how === 'add' && held && !repeat) return talents;

  // A rank that knows nothing takes nothing — without this, "replace the
  // oldest" below would happily store a pick into an empty allowance.
  if (!(Number(known) > 0)) return talents;
  if (picks.length >= known) {
    return setTalentPicks(talents, talentId, [...picks.slice(1), cardId]);
  }
  return setTalentPicks(talents, talentId, [...picks, cardId]);
}

/**
 * What the button on a pool says, in one place, because two blocks raise the same
 * chooser: the set's own block on the Advancement tab, and the set's block on the
 * Abilities tab.
 *
 * Three things it can be, and the difference is between what a pool *owes* you and
 * what it has *room* for.
 *
 *   owed        a hand short of its count, or a library short of the cards that
 *               arrive with the set. This is a debt, and the button names it.
 *   a library   otherwise it is opened, never "changed": what is in it stays in it,
 *               and writing one more in is a night's work rather than a decision
 *               taken here. The count beside the button is what says how full it is.
 *   a hand      otherwise it is changed, which is the only thing left to do with it.
 */
export function poolAction(state) {
  const { spec, owed, library, whole } = state;

  /* A whole pool has no action at all: there is nothing in it to choose and
     nothing to write in. Read, and the block that shows it says so. */
  if (whole) return `Read your ${spec.label.toLowerCase()}`;

  if (owed > 0) {
    /* In the pool's own verb where it has one. "Write in 2 more runes" is the
       Arcanist's sentence on a set whose whole idea is that nothing is written
       down: a Runebearer inscribes them. Same field the rest window and the
       chooser already read, and every pool without one keeps the words it had.
       See `verb` in talents.js. */
    const verb = library ? (spec.verb ?? 'Write in') : 'Choose';
    return `${verb} ${owed} more ${plural(spec.noun, owed)}`;
  }
  return library
    ? `Open ${spec.holds ?? `your ${spec.label.toLowerCase()}`}`
    : `Change your ${plural(spec.noun, 2)}`;
}

/**
 * The card a tap is about to push out, or null when there is room for one more.
 *
 * "Replace the oldest" is a sensible rule and an invisible one: a full hand tapped
 * once loses a card the player never named, and on a library it read as the tap
 * having done nothing at all, since the count could not move. So the wall's own
 * button says whose place it is taking, which is the same rule with a sentence on
 * it.
 *
 * Read off `picks[0]` because that is the end `toggleLoadoutPick` cuts from, and
 * the two would be worth nothing if they disagreed.
 */
export function displacedBy(state) {
  if (!state || state.remaining > 0) return null;
  return state.picks[0] ?? null;
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
export function swapsAtRest(spec, kind, rank = null) {
  return swapRests(spec, rank).includes(kind);
}

/**
 * Which rests a spec allows a swap on, at this rank.
 *
 * Two shapes, and a spec says which by what its entries are:
 *
 *   flat          `['long']`. Every rank's, which is what four of the five
 *                 swapping sets carry and what a swap has always been.
 *   rank-indexed  `[null, ['long'], ['long'], ['long', 'short']]`, the same shape
 *                 `tiers` beside it already carries. The Spellblade is the first
 *                 and only one: TWINNED STRIKE hands a Short Rest the swap a Long
 *                 Rest had, so the *permission* moves with the rank rather than
 *                 only the size of the hand.
 *
 * A rank-indexed spec asked without a rank answers nothing, which is the honest
 * answer: "may this set swap?" has no reading that is true of every rank. Every
 * caller that could not have known better is handed one.
 */
export function swapRests(spec, rank = null) {
  const swap = spec?.swap;
  if (!Array.isArray(swap)) return [];

  const indexed = swap.some((entry) => entry === null || Array.isArray(entry));
  if (!indexed) return swap;

  const at = swap[Math.max(0, Math.floor(Number(rank) || 0))];
  return Array.isArray(at) ? at : [];
}

/**
 * And whether a set may research **one** more into its library on this rest.
 *
 * The other half of the same permission, kept apart from it because the two
 * cards say different things and a rest has to offer the difference. FUNGAL
 * INVOCATION changes any number of spells and takes nothing new; ARCANE RESEARCH
 * takes exactly one new one and changes nothing. A spec carries one or the
 * other, never both.
 */
export function researchesAtRest(spec, kind) {
  return Array.isArray(spec?.research) && spec.research.includes(kind);
}

/**
 * Every set this character holds that may re-prepare itself on this rest, each
 * with the whole state its chooser needs.
 *
 * A set that knows nothing yet — a rank that hands out no cards — is left out:
 * there is nothing to swap, and an empty pool in the rest window is a row that
 * only asks to be tapped and then apologises.
 */
export function restSwaps(talents, kind, level = 1, opened = talents, attributes = null) {
  const rows = [];

  for (const entry of normalizeTalents(talents)) {
    const talent = getTalent(entry.id);
    if (!talent) continue;
    const spec = loadoutOf(talent);

    /* A library is offered its one research, and `grant: 1` is what makes that
       real rather than a label: the window's chooser is capped at the state's
       `known`, so an allowance one above what is held lets exactly one card in
       and makes the tap after it replace instead of add.

       Offered on `capacity` rather than on `known`, because a full book still
       has something to do tonight. Refusing the row there would be refusing the
       replacement the card promises. */
    if (researchesAtRest(spec, kind)) {
      /* Measured off `opened` and not off the draft. Both are the same record for
         every caller that is not a rest window, and in a rest window they are the
         difference between one night's spell and as many as somebody taps: the
         allowance is what is written in the book plus tonight's grant, and reading
         "what is written" off the draft counts tonight's spell as one more night
         already spent. See loadoutState. */
      const state = loadoutState(talents, talent, {
        level,
        grant: 1,
        base: heldPicks(opened, entry.id).length,
        attributes,
      });
      if (state && state.capacity > 0) rows.push({ talent, state, mode: 'research' });
      continue;
    }

    /* The rank rides along because one spec's permission moves with it: a Master
       Spellblade may re-choose on a Short Rest and nobody below them may. See
       swapRests. */
    if (!swapsAtRest(spec, kind, entry.rank)) continue;
    const state = loadoutState(talents, talent, { level, attributes });
    if (state && state.known > 0) rows.push({ talent, state, mode: 'swap' });
  }

  return rows;
}

/** A card's printed name, or its id when this build's codex has no such card. */
function nameOfCard(id) {
  return CARDS.find((card) => card.id === id)?.name ?? id;
}

/**
 * What one list holds that the other does not, named, with a count on anything
 * held more than once: `['Barkskin', 'Fire Seed x2']`.
 *
 * A multiset difference, in the codex's own order. "x2" is the spelling
 * `brewSummary` and the alchemy rack already use for a line of prose; the chips
 * on the sheet write it "×2", and neither is a place the other belongs.
 */
function movedPicks(from, against) {
  const left = new Map();
  for (const id of against) left.set(id, (left.get(id) ?? 0) + 1);

  const moved = new Map();
  for (const id of from) {
    const spare = left.get(id) ?? 0;
    if (spare > 0) {
      left.set(id, spare - 1);
      continue;
    }
    moved.set(id, (moved.get(id) ?? 0) + 1);
  }

  return [...moved].map(([id, count]) => (count > 1 ? `${nameOfCard(id)} x${count}` : nameOfCard(id)));
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

    /* Counted rather than compared with `includes`, because a pool that may hold
       the same card twice can move without either list changing: inscribing a
       second Fire Seed over a first is a night's work, and a diff that asked
       "was Fire Seed there before" would call it no change at all and save
       nothing. Every other pool holds one of each, where a count of 1 against a
       count of 0 is the same answer `includes` gave. */
    const dropped = movedPicks(was.get(entry.id) ?? [], entry.picks ?? []);
    const learned = movedPicks(entry.picks ?? [], was.get(entry.id) ?? []);
    if (dropped.length === 0 && learned.length === 0) continue;

    rows.push({ talent, spec, dropped, learned });
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
export function rankPreview(talent, rank, level = 1, attributes = null) {
  const spec = loadoutOf(talent);
  if (!spec) return null;

  /* For a library these two are ceilings rather than hands, so `gained` below is
     room made and not cards handed over. The note that prints it says which, and
     it is the reason `library` rides along. See LoadoutRankNote. */
  const known = knownAt(spec, rank, level, attributes);
  const previous = knownAt(spec, rank - 1, level, attributes);
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
    library: isLibrary(spec),
    /* What a library actually hands you at this rank, which is only ever the free
       grant at Rank 1. Every later rank raises the ceiling and gives no card. */
    granted: isLibrary(spec) && rank === 1 ? Math.max(0, Math.floor(Number(spec.start) || 0)) : 0,
  };
}

function plural(noun, count) {
  return count === 1 ? noun : `${noun}s`;
}
