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
 */

import { compareCards } from './cardOrder.js';
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

/** Everything in the codex the spec could ever draw from, tier or no tier. */
export function loadoutPool(spec) {
  if (!spec) return [];
  return CARDS.filter((card) => card.kind === spec.kind);
}

/** Whether a spec keeps a library rather than a prepared hand. */
export function isLibrary(spec) {
  return Boolean(spec?.capacity);
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
export function knownAt(spec, rank, level = 1) {
  if (isLibrary(spec)) return capacityAt(spec, rank, level);
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
 */
export function capacityAt(spec, rank, level = 1) {
  if (!isLibrary(spec)) return spec?.known?.[rank] ?? 0;
  if (!(Math.floor(Number(rank) || 0) > 0)) return 0;

  const perRank = Math.floor(Number(spec.capacity.perRank) || 0) * Math.floor(Number(rank) || 0);
  const perLevel =
    Math.floor(Number(spec.capacity.perLevel) || 0) * Math.max(1, Math.floor(Number(level) || 1));
  return Math.max(0, perRank + perLevel);
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
export function allowanceAt(spec, rank, level = 1, held = 0, grant = 0) {
  if (!isLibrary(spec)) return knownAt(spec, rank);

  const capacity = capacityAt(spec, rank, level);
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

  const empower = Math.max(0, Math.floor(Number(spec?.boost?.empower?.[rank]) || 0));
  const advantage = Math.max(0, Math.floor(Number(spec?.boost?.advantage?.[rank]) || 0));
  if (empower > 0) riders.empower = empower;
  if (advantage > 0) {
    riders.advantage = advantage;
    /* Named, because the arrow in the card's corner says what lent it and a
       reader with two sources of advantage needs to know which came off. */
    riders.advantageFrom = [spec.boost.from ?? spec.label];
  }

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
  }

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

  const held = new Set(picks ?? []);
  const legalTiers = tiersAt(spec, rank);
  const modifiers = loadoutModifiers(spec, rank);

  return loadoutPool(spec)
    .map((card) => {
      const tier = tierOf(card);
      const school = schoolOf(card);
      const sub = subSchoolOf(card);
      const known = held.has(card.id);
      const row = { card, tier, school, sub, known, modifiers };

      /* A stand-in for a school nobody has written yet. Refused as a school,
         because that is what it is: the school is not written, so there is
         nothing here to learn.

         **This fires on nothing today.** `unwritten-light` and `unwritten-shadow`
         were the only two cards that ever carried the flag, and the Ethereal
         school retired both on 2026-08-25 by simply existing. The gate stays for
         the next school the lineage tab names before a sheet arrives, which is
         the situation it was built for. See "the stand-ins" at the foot of
         spells.js. */
      if (card.placeholder) {
        return { ...row, ok: false, gate: 'school', reason: 'a stand-in for a school not written yet' };
      }
      if (spec.school && school && school !== spec.school) {
        return { ...row, ok: false, gate: 'school', reason: `${school} school, not ${spec.school}` };
      }
      /* No `tier &&` guard any more, and that is a real change. A card off the
         ladder used to pass this gate, and it was safe only because the school
         gate above caught it first: spells.js says so in as many words, that a
         Unique Spell stays out of every pool because "no set's school is
         Elemental or Nightmare". The Arcanist is the first spec to name no
         school at all, so that gate no longer fires and this one has to. */
      if (legalTiers.length > 0 && !legalTiers.includes(tier)) {
        return {
          ...row,
          ok: false,
          gate: 'tier',
          reason: tier
            ? `${tier} needs a higher rank`
            : `${tierWord(card)} is not a rung any set reaches`,
        };
      }
      return { ...row, ok: true };
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
  { level = 1, grant = 0, capped = 'allowance', base = null } = {}
) {
  const spec = loadoutOf(talent);
  if (!spec) return null;

  const entry = normalizeTalents(talents).find((row) => row.id === (talent.id ?? talent));
  const rank = entry?.rank ?? 0;
  const options = loadoutOptions({ talent, rank, picks: entry?.picks ?? [] });

  // A rank lost, or a codex that dropped a card, can leave a stored pick that
  // is no longer legal. It is shown as held and counted, because quietly
  // deleting somebody's spell is worse than showing one they have to fix.
  const legal = new Set(options.filter((option) => option.ok).map((option) => option.card.id));
  const modifiers = loadoutModifiers(spec, rank);
  const picks = (entry?.picks ?? []).map((id) => ({
    id,
    card: options.find((option) => option.card.id === id)?.card ?? null,
    ok: legal.has(id),
    modifiers,
  }));

  /* The two numbers, and for a hand they are the same one twice. `known` is
     what the chooser is capped at and what every "3 of 4 chosen" line counts
     against; `capacity` is the ceiling a library is working towards, and it is
     the only number ARCANE RESEARCH actually prints. */
  const capacity = capacityAt(spec, rank, level);
  const known =
    capped === 'capacity'
      ? capacity
      : allowanceAt(spec, rank, level, base ?? picks.length, grant);

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
  const { spec, owed, library } = state;

  if (owed > 0) {
    return `${library ? 'Write in' : 'Choose'} ${owed} more ${plural(spec.noun, owed)}`;
  }
  return library
    ? `Open your ${spec.label.toLowerCase()}`
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
export function swapsAtRest(spec, kind) {
  return Array.isArray(spec?.swap) && spec.swap.includes(kind);
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
export function restSwaps(talents, kind, level = 1, opened = talents) {
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
      });
      if (state && state.capacity > 0) rows.push({ talent, state, mode: 'research' });
      continue;
    }

    if (!swapsAtRest(spec, kind)) continue;
    const state = loadoutState(talents, talent, { level });
    if (state && state.known > 0) rows.push({ talent, state, mode: 'swap' });
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
export function rankPreview(talent, rank, level = 1) {
  const spec = loadoutOf(talent);
  if (!spec) return null;

  /* For a library these two are ceilings rather than hands, so `gained` below is
     room made and not cards handed over. The note that prints it says which, and
     it is the reason `library` rides along. See LoadoutRankNote. */
  const known = knownAt(spec, rank, level);
  const previous = knownAt(spec, rank - 1, level);
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
