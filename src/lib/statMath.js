/**
 * Where every number on the sheet came from, named.
 *
 * The tiles on the Character tab are read-only by design: nothing in one is typed
 * in, all of it is bought by an attribute, a level, a worn piece, a working or a
 * shape you are currently in. Which is exactly why a bare number is not enough.
 * A Defense of 11 on a character whose Instinct is 5 is six points somebody has
 * to go and reconstruct, out of the armor block, the trinket list, the talent
 * ranks and whatever is running for the hour.
 *
 * So every tile carries its arithmetic on hover: one extra line under the words
 * that already say what the stat is for, reading
 *
 *     5 Instinct + 2 Armor + 3 Resilience + 1 Duelist = 11
 *
 * ------------------------------------------------------------------ the rules
 * **This file computes nothing the sheet does not already compute.** Every sum
 * below mirrors the one function that owns it — `deriveStats` and `shieldCapFor`
 * in characterModel.js, `attributeTotals` in levelPicks.js, `magicBurdenMax` in
 * items.js, `minionDerived` in minions.js — term for term, in the same order, and
 * a second reading is the one thing it must never be. When one of those formulas
 * changes, the breakdown here changes with it or it starts lying, which is worse
 * than saying nothing at all.
 *
 * **The line always adds up to the number above it.** A stored column can
 * disagree with its own formula: a row saved by an older build and opened by
 * somebody who cannot write it is never brought back into line (`syncDerived`
 * runs for the owner only), and an attribute can be raised from outside the level
 * ledger. Rather than print a sum that contradicts the tile, `settle` closes the
 * gap with a term named `unaccounted`. That is honest twice over: the reader is
 * told the number is not fully explained, and they are told by how much.
 *
 * **A source is named once.** The same-source law is not re-implemented here.
 * `characterGrantSources` hands back the enchantments already deduplicated by
 * `grantsFrom`'s own `dedupe`, so a math line can never credit Primal Sense twice
 * for a point it only granted once. See the note in enchanting.js.
 *
 * **A term is as coarse as the answer.** What the loadout lends is named by the
 * *place* it is lent from and never piece by piece: `32kg Armor`, not the helm,
 * the cuirass and the greaves one after another. Three pieces is a line a reader
 * has to add up to learn the one thing they opened it for, which is that the armor
 * is what is heavy, and a pack of forty things is not a line at all. The same rule
 * collapses the level ledger, where six levels each bought a point of the same
 * attribute and `6 Advancement` is the whole of what a reader can act on.
 *
 * Named sources are the exception and stay named. A working, a talent and a card
 * on the tracker are each one thing you can go and take off, so each keeps its own
 * name. Where two of those really do collide, which is the same card on the
 * tracker twice because two different people cast it, they fold into one term with
 * a count (`Barkskin x2`) rather than printing the same word twice.
 *
 * And so is a piece that was never one of a list. Two lines name a single item:
 * the Supreme Runed hood that raises the Shield ceiling, and the bag that raises
 * the carry one. There is exactly one of either on a character, so a place would
 * be a worse answer than the name and `7 Trinkets` on a Shield ceiling would be a
 * wrong one. `WALKS` in scripts/check-stat-math.mjs is where that line is drawn,
 * and everything not in it is checked for naming a piece.
 */

import { ATTRIBUTE_BASE, ATTRIBUTE_KEYS } from './attributes.js';
import { SHIELD_SHARE, karmaCap, levelForXp, shieldCapFor } from './characterModel.js';
import {
  ARMOR_SLOTS,
  BAG_SLOT_KEY,
  CARRY_PER_PHYSIQUE,
  WEAPON_SLOTS,
  armorSetName,
  bagItem,
  carryCapacity,
  carryState,
  characterGrantSources,
  characterGrants,
  encumberedSpeed,
  heldItem,
  isCustomEntry,
  itemBurden,
  itemWeight,
  magicBurdenMax,
  magicBurdenUsed,
  normalizeBelt,
  normalizeEquipment,
  normalizePack,
  normalizeTrinkets,
  OFF_HAND_SLOT_KEY,
  wornItems,
} from './items.js';
import { feralArmorFrom, feralShieldShare, feralState } from './feral.js';
import { levelGrants, levelPicksState, lineageBonuses } from './levelPicks.js';
import { lineageGrantSources } from './lineages.js';
import { weaponRiders } from './moves.js';
import { runningRiders } from './riders.js';
import { spellbookWillpowerFrom } from './spellbook.js';
import { pointCeilings, tricksterOf } from './tricks.js';

/* Speed is the one stat whose formula is written in metres and printed in either
   unit. Converting the terms would break the line: `metersToFeet` snaps to 5ft
   steps, so 10ft + 8ft would not come to the 20ft on the tile. So the breakdown
   stays metric and says so with its suffix, and the tile above it keeps whatever
   unit the reader chose. */
const METRES = 'm';

/* And weight, for the same reason plus one of its own: a capacity is a running
   total that one potion can tip over a line, so a breakdown that converted would
   have to round, and a rounded line could disagree with the meter above it about
   which side of the line the total is on. Kilos, and the suffix says so. */
const KILOS = 'kg';

/** How close two decimals have to be before the gap is not worth a term. */
const EPSILON = 0.001;

/** What both point pools hold before anything in the game moves them. */
const POINTS_BASE = 6;

/* ------------------------------------------------------------------ the shape */

/**
 * A term is `{ value, label }`: what it is worth, and what lent it. A sum is
 * `{ terms, total, suffix }`.
 *
 * The label is what the reader would go to, and never a formula. `Primal Sense`,
 * `Duelist`, `Wildheart` for a named source; `Armor`, `Trinkets`, `Pack` for a
 * place the loadout lends from; `Advancement` for the level ledger. Where a stat is
 * bought by an attribute rather than by a thing, the attribute is the source and is
 * named as one.
 */
function term(value, label) {
  return { value, label };
}

/** Terms with nothing in them dropped, so a zero is never printed as a source. */
function kept(terms) {
  return terms.filter((row) => row && Math.abs(row.value) > EPSILON);
}

/**
 * Identical labels merged, with a count when more than one was folded in.
 *
 * Gear no longer collides here: a place is summed into one term before it arrives,
 * so `32kg Armor x3` can never be printed. What still collides is a named source
 * genuinely on the sheet twice, which is one card on the tracker cast by two
 * different people. `Barkskin x2` is two rows, both real, and the same-source law
 * does not touch them because the sources are not the same. Everything else
 * arrives already unique.
 */
function fold(terms) {
  const order = [];
  const byLabel = new Map();

  for (const row of terms) {
    const seen = byLabel.get(row.label);
    if (seen) {
      seen.value += row.value;
      seen.count += 1;
      continue;
    }
    const entry = { ...row, count: 1 };
    byLabel.set(row.label, entry);
    order.push(entry);
  }

  return order.map(({ value, label, count }) =>
    term(round(value), count > 1 ? `${label} x${count}` : label)
  );
}

/**
 * A sum, closed against the number the sheet is actually showing.
 *
 * `shown` is the tile's own value. Where the terms fall short of it something has
 * moved this stat that this file cannot name, and the remainder is printed as
 * `unaccounted` rather than left out: a breakdown that does not add up to the
 * number above it is a breakdown nobody can trust, and one that silently drops
 * the difference is worse than one that admits to it.
 */
function settle(rawTerms, shown, suffix = '') {
  const terms = fold(kept(rawTerms));
  const sum = terms.reduce((total, row) => total + row.value, 0);
  const target = Number(shown);

  if (Number.isFinite(target) && Math.abs(target - sum) > EPSILON) {
    terms.push(term(round(target - sum), 'unaccounted'));
    return { terms, total: round(target), suffix };
  }
  return { terms, total: round(sum), suffix };
}

/** Two decimals at most. Speed is the only stat that ever needs one. */
function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/* ------------------------------------------------------------ printing a line */

/**
 * A sum as the one line a tooltip prints: `4 base + 2 Level 1 + 1 Wildkin = 7`.
 *
 * A single term keeps its name and loses the `=`, because `3 Resilience` is the
 * whole answer and `3 Resilience = 3` is the same answer with a stutter. That
 * case is not the rare one: a Feral Cursed's Armor is a single term reading
 * `4 Feral Curse`, and a number that appeared out of nowhere is precisely the one
 * a reader needs the source of.
 *
 * Null only for a sum with no terms at all, which is a stat nothing has given
 * anything to: an Armor of 0 on somebody wearing no armor has no line to print,
 * and printing `0` would be the sheet explaining a number that was never a sum.
 *
 * A negative term is joined with a minus rather than printed with a sign, so a
 * penalty reads as arithmetic and not as a strange-looking source.
 */
export function mathLine(math) {
  const terms = math?.terms ?? [];
  if (terms.length === 0) return null;

  const unit = math.suffix ?? '';
  const [first, ...rest] = terms;

  let line = `${first.value}${unit} ${first.label}`;
  if (rest.length === 0) return line;

  for (const row of rest) {
    line += `${row.value < 0 ? ' − ' : ' + '}${Math.abs(row.value)}${unit} ${row.label}`;
  }
  return `${line} = ${math.total}${unit}`;
}

/* ---------------------------------------------------------------- attributes */

/**
 * What an attribute is made of: the 4 everybody starts at, what advancement
 * spent on it, what your blood carries and whatever is worked into what you wear.
 *
 * The first three are `attributeTotals`' own sum, walked in the same order it
 * walks. The fourth is the bend `liveCharacter` applies without storing: the tile
 * is showing it, so the line has to account for it.
 *
 * The ledger is **one term**. It used to be one per level, and a level 11 spread
 * across the same attribute read `4 base + 2 Level 1 + 1 Level 3 + 1 Level 7 +
 * 1 Level 9 + 1 Level 11`: six terms to say the one thing a reader came for, which
 * is that six of these points were bought and are already spent. Which level
 * bought which point is the Advancement tab's own question and the ledger there
 * answers it level by level, so the term is named after the tab.
 *
 * `stored` is the character with that bend taken back off. `levelPicksState` reads
 * the three columns to recover a level-1 spread that was never recorded, and the
 * bent columns would have it recovering the wrong one.
 */
function attributeMath(character, stored, level, sources) {
  const state = levelPicksState(stored, level);
  const lineage = lineageBonuses(stored.lineage);
  const math = {};

  for (const key of ATTRIBUTE_KEYS) {
    const terms = [term(ATTRIBUTE_BASE, 'base')];

    let advanced = 0;
    for (const [at, entry] of levelsOf(state.picks)) {
      if (levelGrants(at).boosts && entry.major && entry.minor) {
        if (entry.major === key) advanced += 2;
        if (entry.minor === key) advanced += 1;
      }
      // An odd level raises two, so a level can credit this attribute once and
      // the next one too. Every point the ledger spent here lands in the one term.
      if ((entry.raised ?? []).includes(key)) advanced += 1;
    }
    terms.push(term(advanced, 'Advancement'));

    if (lineage[key]) terms.push(term(lineage[key], stored.lineage));

    for (const row of sources) {
      const plus = Math.floor(Number(row.attributes?.[key]) || 0);
      if (plus) terms.push(term(plus, row.name));
    }

    // And the other bend `liveCharacter` applies without storing: a card on the
    // tracker. Nothing in the codex raises an attribute this way yet.
    terms.push(...riderAttrTerms(character.effects, key));

    math[key] = settle(terms, Math.floor(Number(character[key]) || 0));
  }
  return math;
}

/** The recorded levels in the order they were lived, not the order they were saved. */
function levelsOf(picks) {
  return Object.entries(picks)
    .map(([at, entry]) => [Number(at), entry])
    .sort((a, b) => a[0] - b[0]);
}

/* ------------------------------------------------------- where a thing sits */

/**
 * The places a carried thing can be, each with what is in it: what is worn, what
 * is in hand, the bag, the trinkets, the loops and the pack.
 *
 * A place is what the loadout's terms are named after rather than the things in
 * it. See "a term is as coarse as the answer" at the top of this file: the reader
 * wants the sum, and the place is also the block they would go to to change it.
 *
 * The order is `magicBurdenUsed`'s and `carriedWeight`'s own, which is the stored
 * equipment map, then the trinkets, then the loops, then the pack. This is still a
 * mirror and the mirror is checked.
 *
 * The belt and the pack are asked for rather than assumed, because the three walks
 * this serves stop in different places: an item's own numbers reach what is worn,
 * worked magic reaches the loops as well, and weight reaches everything.
 *
 * And `stowed` is the fourth stopping place: the Armor and Defense lines leave the
 * secondary weapon out, because a shielded weapon is only worth its 3 Armor while
 * it is the weapon in your hand. Weight and Magic Burden keep it, because both
 * hands carry. The mirror of `heldItems` in items.js, and the mirror is checked.
 */
function placesOf(character, { belt = false, pack = false, stowed = true } = {}) {
  const worn = normalizeEquipment(character?.equipment);
  const held = (ids) => ids.map((id) => heldItem(character, id)).filter(Boolean);
  const hands = WEAPON_SLOTS.map(({ key }) => key).filter(
    (key) => stowed || key !== OFF_HAND_SLOT_KEY
  );

  const places = [
    ['Armor', held(ARMOR_SLOTS.map(({ key }) => worn[key]))],
    ['Weapons', held(hands.map((key) => worn[key]))],
    ['Bag', held([worn[BAG_SLOT_KEY]])],
    ['Trinkets', held(normalizeTrinkets(character?.trinkets))],
  ];

  if (belt) {
    places.push(['Belt', held(normalizeBelt(character?.belt).map((entry) => entry?.id))]);
  }
  if (pack) {
    places.push([
      'Pack',
      held(normalizePack(character?.pack).filter((entry) => !isCustomEntry(entry))),
    ]);
  }
  return places;
}

/**
 * One term per place, worth whatever everything in it comes to.
 *
 * Summed here rather than left to `fold`, so a place is one term by construction
 * and never carries a count: `32kg Armor x3` would read as though the armor were
 * worth 32 three times over. An empty place comes to nothing and `kept` drops it.
 */
function placeTerms(places, value) {
  return places.map(([label, items]) =>
    term(
      items.reduce((total, item) => total + (Number(value(item)) || 0), 0),
      label
    )
  );
}

/** One term per place, worth the whole-number `field` of everything in it. */
function gearTerms(places, field) {
  return placeTerms(places, (item) => Math.floor(Number(item[field]) || 0));
}

/** One term per enchantment carrying the rider, named after the working. */
function grantTerms(sources, field, floor = true) {
  return sources.map((row) => {
    const value = Number(row[field]) || 0;
    return term(floor ? Math.floor(value) : value, row.name);
  });
}

/**
 * One term per tracker row carrying the rider, named after the row.
 *
 * Named after the row and not the card, because the row is what the reader can
 * go and take off. Every flat field a rider can carry is mirrored here whether or
 * not a card uses it today: the table in riders.js is meant to grow, and a rider
 * added there without a line here would show up on a tile as `unaccounted`.
 *
 * The Movement Speed factor is the one field this cannot do, because a factor is
 * not a term. It is folded in where the Speed is summed. See `statMath`.
 */
function riderTerms(effects, field) {
  return runningRiders(effects).from.map(({ name, rider }) =>
    term(Math.floor(Number(rider[field]) || 0), name)
  );
}

/** The same, for one of the three attributes a rider could raise. */
function riderAttrTerms(effects, key) {
  return runningRiders(effects).from.map(({ name, rider }) =>
    term(Math.floor(Number(rider.attributes?.[key]) || 0), name)
  );
}

/* ---------------------------------------------------------------- the sheet */

/**
 * Every number the Character tab prints, with its sources named, keyed the way
 * the tiles are keyed.
 *
 * Worked out once per render and handed down rather than asked for inside each
 * tile: the enchantment sources, the worn items and the level ledger are one read
 * each for the whole tab and a dozen reads each if every tile asks for itself.
 *
 * Takes the character the tab is *showing* — the bent one, off `liveCharacter` —
 * because the whole contract of this file is that its lines add up to the numbers
 * on screen.
 */
export function statMath(character) {
  if (!character) return {};

  const level = levelForXp(character.xp);
  const sources = characterGrantSources(character);
  const grants = characterGrants(character);
  const items = wornItems(character);
  /* The places, with the stowed weapon left out. The only two lines that read
     this are Armor and Defense, and a shielded weapon is worth its 3 Armor while
     it is in your hand and nothing on your back. The burden and weight lines walk
     their own places below and both hands are in those. See `equipmentEffects` in
     items.js, which this mirrors. */
  const places = placesOf(character, { stowed: false });

  /* The row as it is stored, for the one reader that must not see the bend. */
  const stored = { ...character };
  for (const key of ATTRIBUTE_KEYS) {
    stored[key] = Math.floor(Number(character[key]) || 0) - (grants.attributes[key] ?? 0);
  }

  const p = Math.floor(Number(character.physique) || 0);
  const i = Math.floor(Number(character.instinct) || 0);
  const m = Math.floor(Number(character.mind) || 0);

  const math = attributeMath(character, stored, level, sources);

  /* ---- Health, Willpower and the ceiling Shield is read against ---- */
  math.health_max = settle(
    [
      term(10 * level, 'your level'),
      term(10 * p, 'Physique'),
      ...grantTerms(sources, 'healthMax'),
      ...riderTerms(character.effects, 'healthMax'),
    ],
    Math.floor(Number(character.health_max) || 0)
  );

  math.willpower_max = settle(
    [
      term(10, 'base'),
      term(2 * level, 'your level'),
      term(2 * m, 'Mind'),
      ...grantTerms(sources, 'willpowerMax'),
      ...riderTerms(character.effects, 'willpowerMax'),
      /* Named after the set and not the card, the way a form's hide is: what a
         reader wants from a Willpower of 62 is the word "Arcanist", and the set
         is what they can go and look at. */
      ...spellbookWillpowerFrom(character.talents).map((row) =>
        term(row.willpower, row.talent.name)
      ),
    ],
    Math.floor(Number(character.willpower_max) || 0)
  );

  math.shield_cap = shieldMath(character, items, m);

  /* ---- Armor, and the Defense it is sometimes half of ---- */
  math.defense = settle(
    [
      ...gearTerms(places, 'armor'),
      ...grantTerms(sources, 'armor'),
      ...riderTerms(character.effects, 'armor'),
      ...feralArmorFrom(character, i).map((row) => term(row.armor, row.talent.name)),
    ],
    Math.floor(Number(character.defense) || 0)
  );

  math.avoid = avoidMath(character, places, { physique: p, instinct: i, mind: m });

  /* ---- The three an attribute buys outright ---- */
  math.initiative = settle(
    [term(i, 'Instinct'), term(level, 'your level')],
    Math.floor(Number(character.initiative) || 0)
  );
  math.reflex = settle(
    [term(p, 'Physique'), term(i, 'Instinct')],
    Math.floor(Number(character.reflex) || 0)
  );
  math.grit = settle(
    [term(i, 'Instinct'), term(m, 'Mind')],
    Math.floor(Number(character.grit) || 0)
  );

  /* Speed, and the one thing on the sheet that takes a stat away rather than
     adding to one. `deriveStats` halves it over capacity and empties it at 30%
     over, so the line has to carry that as its own term or it would add up to a
     speed the tile is not showing. Named for what did it, like every other term:
     what a reader wants from a Speed of 2.5 is the word "overloaded". */
  const carry = carryState(character);
  const running = runningRiders(character.effects);
  const speedTerms = [
    term(3, 'base'),
    term(i / 2, 'half your Instinct'),
    /* What their blood is worth, named after the card that carries it: a
       Skybound reads `3 base + 2 half your Instinct + 1.5 Wind Grace`. Drawn with
       the same helper an enchantment is, because `lineageGrantSources` hands back
       the same shape. Unfloored, for the same reason the enchantment line is: 1.5
       metres is a real distance and 1 is the wrong one. */
    ...grantTerms(lineageGrantSources(character.lineage, character.choices), 'speed', false),
    ...grantTerms(sources, 'speed', false),
  ];
  let speedRaw = speedTerms.reduce((total, row) => total + row.value, 0);

  /* And what a card on the tracker multiplies it by. A factor is not a term, so
     what goes on the line is the distance it *added*, named after the card that
     added it: "3 base + 2 half your Instinct + 5 Giant Growth = 10". Which is the
     same shape "overloaded" below already uses for the one thing that takes
     distance away, and it comes first for the same reason `deriveStats` applies
     it first.

     Cumulatively, so two of them add up. A doubling and a half again is threefold
     and the two terms have to say +5 and +5 off a base of 5, not +5 and +2.5 off
     the same 5, or the line would fall short of the tile by the difference. */
  for (const { name, rider } of running.from) {
    const factor = Number(rider.speedFactor) || 1;
    if (factor === 1) continue;
    const grown = speedRaw * factor;
    speedTerms.push(term(grown - speedRaw, name));
    speedRaw = grown;
  }

  if (carry.state !== 'clear') {
    speedTerms.push(term(round(encumberedSpeed(speedRaw, carry) - speedRaw), 'overloaded'));
  }

  math.speed_m = settle(speedTerms, round(Number(character.speed_m) || 0), METRES);

  /* ---- The pools that are a count of presses rather than a stat ---- */
  const points = pointCeilings(character.talents);
  const trickster = tricksterOf(character.talents);
  const raised =
    points.ap > POINTS_BASE && trickster
      ? [term(points.ap - POINTS_BASE, trickster.talent.name)]
      : [];

  math.ap_max = settle(
    [term(POINTS_BASE, 'base'), ...raised],
    Math.floor(Number(character.ap_max) || 0)
  );
  math.reaction_max = settle(
    [term(POINTS_BASE, 'base'), ...raised],
    Math.floor(Number(character.reaction_max) || 0)
  );

  /* Karma has no column of its own. Its ceiling *is* the level, so the line says
     so rather than pretending to a sum. Settled against `karmaCap`, which is what
     the pill draws, and which reads the stored `level` column where everything
     above reads the level the XP buys: on a synced sheet those agree, and on one
     that does not the pill and its own line must still say the same thing. */
  math.karma = settle([term(level, 'your level')], karmaCap(character));

  /* ---- And what the loadout weighs against ---- */
  math.burden_max = settle(
    [term(10, 'base'), term(level, 'your level'), term(m, 'Mind')],
    magicBurdenMax(character)
  );
  math.burden_used = settle(burdenTerms(character), magicBurdenUsed(character));

  /* ---- And what it all weighs, against what they can shift ---- */
  const bag = bagItem(character);
  math.carry_max = settle(
    [
      term(
        Math.max(0, Math.floor(Number(character.physique) || 0)) * CARRY_PER_PHYSIQUE,
        'Physique'
      ),
      ...(bag ? [term(Math.max(0, Number(bag.capacity) || 0), bag.name)] : []),
    ],
    carryCapacity(character),
    KILOS
  );
  math.carry_used = settle(weightTerms(character), carry.used, KILOS);

  return math;
}

/**
 * The Shield ceiling: a share of maximum Health, and the Mind a full Supreme
 * Runed set adds on top.
 *
 * `shieldCapFor` is the number block 2 prints, so this mirrors that rather than
 * `deriveStats` — the two differ on which maximum Health they read, and the tile
 * is showing the stored one.
 *
 * The share is named after what raised it. BESTIAL SENSE does not add to the cap,
 * it replaces the half everybody has with the whole, so a Feral Cursed's line
 * reads `50 Feral Curse` where everyone else's reads `25 half your Health`. A
 * bonus term saying 25 more would be describing a sum the card does not make.
 */
function shieldMath(character, items, mind) {
  const health = Math.floor(Number(character.health_max) || 0);
  const feral = feralShieldShare(character);
  const share = Math.max(SHIELD_SHARE, feral);

  const form =
    feral > SHIELD_SHARE
      ? feralState(character).find((row) => row.shieldShare === feral)
      : null;

  const terms = [term(Math.floor(health * share), form ? form.talent.name : 'half your Health')];

  const runed = items.find((item) => item.shieldCapBonus === 'mind');
  if (runed) terms.push(term(mind, runed.name));

  return settle(terms, shieldCapFor(character));
}

/**
 * Defense: the attribute it is built on, every flat point worn and whatever the
 * weapon in hand is worth.
 *
 * The base is Instinct unless a full armor set replaces it, and the replacement is
 * named with the set that made it so, `9 Reflex (Light Armor)`, because a reader
 * looking at a Defense built on Reflex has no other way to find out why. Heavy
 * Armor is the one set that adds instead of replacing, and its rider reads the
 * same Armor stat the tile beside it shows.
 */
function avoidMath(character, places, { physique, instinct, mind }) {
  const set = armorSetName(character);
  const reflex = physique + instinct;
  const grit = instinct + mind;

  let base = term(instinct, 'Instinct');
  if (set === 'Light Armor') base = term(reflex, 'Reflex (Light Armor)');
  if (set === 'Magic Armor') base = term(grit, 'Grit (Magic Armor)');

  const terms = [base, ...gearTerms(places, 'defense')];

  if (set === 'Heavy Armor') {
    const armor = Math.floor(Number(character.defense) || 0);
    terms.push(term(Math.floor(armor / 2), 'half your Armor (Heavy Armor)'));
  }

  for (const row of weaponRiders(character).from) {
    if (row.defense > 0) terms.push(term(row.defense, row.talent.name));
  }

  /* And whatever is on the tracker. BARKSKIN's point is a point like the ones
     above it, named after the row so a reader knows where to take it off. */
  for (const { name, rider } of runningRiders(character.effects).from) {
    const point = Math.floor(Number(rider.defense) || 0);
    if (point) terms.push(term(point, name));
  }

  return settle(terms, Math.floor(Number(character.avoid) || 0));
}

/**
 * What each place on the character carries in worked magic.
 *
 * `magicBurdenUsed`'s own walk, in its own order: what is worn and held, then the
 * trinkets, then every belt loop. Two rings carrying the same working are two
 * points on the meter and both land in the Trinkets term, because burden is what a
 * thing weighs rather than what it does and both of them weigh. See the stacking
 * note in enchanting.js.
 *
 * Not `carriedItems`, which is a question that only looks the same: that one is
 * what an enchantment *reaches* and this is what the meter *weighs*, and the two
 * have already drifted apart once. Settling the sum against `magicBurdenUsed` is
 * what keeps a drift visible instead of silent.
 */
function burdenTerms(character) {
  return placeTerms(placesOf(character, { belt: true }), itemBurden);
}

/**
 * What each place on the character weighs.
 *
 * The mirror of `carriedWeight` in items.js, and it has to walk the same four
 * places in the same order: the equipment map, the trinkets, the belt and the
 * pack. **The pack is in it**, which is the one way this differs from the burden
 * line above: worked magic stops at the belt and weight does not care where a
 * thing is sitting.
 *
 * It is also the line that most needed a place rather than a thing. Forty things
 * weigh where six of them are worked, so this used to be the longest breakdown on
 * the sheet by far, and every one of the forty already prints its own weight on
 * its own row. What the meter is asked is which of the six places is eating the
 * capacity, and six terms is the whole answer.
 */
function weightTerms(character) {
  return placeTerms(placesOf(character, { belt: true, pack: true }), itemWeight);
}

/* ---------------------------------------------------------------- a creature */

/**
 * The same breakdown for a creature a talent set has put on the board.
 *
 * Its stats are `minionDerived`'s, which is the character's own arithmetic with
 * two lines the spec owns: Health is `perLevel` a level and `perPhysique` a
 * Physique where a character gets ten of each, and Defense is whichever stat the
 * spec names. Both are read out of the spec rather than hard-coded, so a second
 * set with a different creature needs nothing here.
 *
 * Its level is always its bonded's, which is why every line reading `level` on a
 * character reads the same word here.
 */
export function minionMath(minion) {
  if (!minion) return {};

  const { spec, stats, attributes, level } = minion;
  const p = Math.floor(Number(attributes?.physique) || 0);
  const i = Math.floor(Number(attributes?.instinct) || 0);
  const m = Math.floor(Number(attributes?.mind) || 0);

  const perLevel = Number(spec?.health?.perLevel) || 0;
  const perPhysique = Number(spec?.health?.perPhysique) || 0;

  /* Whichever stat the spec builds its Defense on, named. `minionDerived` falls
     back to Instinct for a spec that names nothing, and so does this. */
  const built =
    {
      grit: term(i + m, 'Grit'),
      reflex: term(p + i, 'Reflex'),
      physique: term(p, 'Physique'),
      instinct: term(i, 'Instinct'),
      mind: term(m, 'Mind'),
    }[spec?.defense ?? 'instinct'] ?? term(i, 'Instinct');

  return {
    health_max: settle(
      [term(perLevel * level, 'its level'), term(perPhysique * p, 'Physique')],
      stats.health_max
    ),
    /* One term each, so `mathLine` prints nothing: a creature's Shield is half
       its Health and nothing moves either, and its Armor is flat zero because it
       wears no gear. In the map anyway, so a tile never has to ask whether a
       breakdown exists for the stat it is drawing. */
    shield_cap: settle([term(stats.shield_cap, 'half its Health')], stats.shield_cap),
    defense: settle([], stats.defense),
    avoid: settle([built], stats.avoid),
    initiative: settle([term(i, 'Instinct'), term(level, 'its level')], stats.initiative),
    reflex: settle([term(p, 'Physique'), term(i, 'Instinct')], stats.reflex),
    grit: settle([term(i, 'Instinct'), term(m, 'Mind')], stats.grit),
    speed_m: settle(
      [term(3, 'base'), term(i / 2, 'half its Instinct')],
      round(stats.speed_m),
      METRES
    ),
    ap_max: settle([term(stats.ap_max, 'base')], stats.ap_max),
    reaction_max: settle([term(stats.reaction_max, 'base')], stats.reaction_max),
  };
}
