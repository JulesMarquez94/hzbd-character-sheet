/**
 * Martial Move round trip. Proves the two promises the move system makes:
 * **every move a character holds is offered on the swings its own text allows**,
 * and **what it costs there is the rate its plate prints.**
 *
 *   node scripts/check-moves.mjs        report and exit 1 on any finding
 *   node scripts/check-moves.mjs --list print every move and price, then exit 0
 *
 * ------------------------------------------------------------ what it covers
 * The risk is not arithmetic, it is *shape*. A move is a plain object and five
 * of its keys are read by name somewhere else: `scales` decides which rate
 * prices it, `plain` and `melee` narrow which swing it rides, and two of the
 * `rides` keys can hold a word instead of a number (`elevate: 'paid'`, `ap:
 * 'free'`). Every one of those is a silent failure when it is misspelled — a
 * `scale: 'ap'` prices at the plate forever, a `rides: { elevates: 1 }` prints
 * nothing, and neither shows up as an error anywhere.
 *
 * So the shape of every move is checked against what the readers actually read,
 * the granted three are walked from the set that grants them through to the
 * offer on a real weapon attack, and the five that scale are priced across the
 * whole cost column and compared with their own rate.
 *
 * ------------------------------------------------------------ the two kinds
 * A move arrives two ways and both are here, because a granted move is the newer
 * and thinner path: it is one word on a talent card rather than a row in
 * martial.js, so nothing about it is obviously wrong when it is wrong. See "the
 * granted three" in src/lib/talents.js.
 *
 * `check-weapons.mjs` is what proves the swings themselves are right. This file
 * takes them as given and asks what a move does to one.
 */

import { MARTIAL_MOVES, moveTier, moveWillpower, swingDice } from '../src/lib/martial.js';
import { grantedMoves, moveCost, moveSetFor, offeredMoves, withMoves } from '../src/lib/moves.js';
import { loadoutOf, loadoutPool } from '../src/lib/loadouts.js';
import { TALENTS } from '../src/lib/talents.js';
import { WEAPON_ABILITIES, getCard } from '../src/lib/weapons.js';
import { isPlainAttack } from '../src/lib/tricks.js';

const LIST = process.argv.includes('--list');
const findings = [];
const note = (what, said) => findings.push(`  ${what}\n    ${said}`);

/** The keys a move may carry that the system reads by name. Anything else is a typo. */
const SCALES = [undefined, 'ap', 'dice'];
const RIDES = ['advantage', 'empower', 'elevate', 'ap'];

/** One swing off each rung of the cost column, so a rate can be walked up it. */
const RUNGS = [
  'crossbow-shoot',
  'finesse-strike',
  'melee-light-strike',
  'melee-heavy-strike',
  'melee-great-strike',
];

/* ------------------------------------------------------- every move's shape */

/** Every move in the game, codex and granted, as `{ card, whose }`. */
function everyMove() {
  const rows = MARTIAL_MOVES.map((card) => ({ card, whose: 'codex' }));

  for (const talent of TALENTS) {
    for (const card of talent.cards ?? []) {
      if (card.kind === 'martial-move') rows.push({ card, whose: talent.name });
    }
  }

  return rows;
}

const all = everyMove();

for (const { card, whose } of all) {
  const where = `${card.name} (${whose})`;

  /* A move never costs Action Points: they belong to the attack it rides. Said
     here rather than trusted, because a granted move was an Ability yesterday and
     an Ability prints one. */
  if (card.ap !== null && card.ap !== undefined) {
    note(where, `carries ap: ${JSON.stringify(card.ap)}, and a move costs no Action Points`);
  }

  if (!Number.isInteger(card.wp) || card.wp < 0) {
    note(where, `carries wp: ${JSON.stringify(card.wp)}, and a move's price is a whole number`);
  }

  if (!SCALES.includes(card.scales)) {
    note(where, `scales: ${JSON.stringify(card.scales)}, and the rates are 'ap' and 'dice'`);
  }

  for (const key of Object.keys(card.rides ?? {})) {
    if (!RIDES.includes(key)) note(where, `rides.${key} is a key nothing reads`);
  }

  const elevate = card.rides?.elevate;
  if (elevate !== undefined && elevate !== 'paid' && !Number.isInteger(elevate)) {
    note(where, `rides.elevate is ${JSON.stringify(elevate)}, and it is a count or 'paid'`);
  }

  const ap = card.rides?.ap;
  if (ap !== undefined && ap !== 'free' && !Number.isInteger(ap)) {
    note(where, `rides.ap is ${JSON.stringify(ap)}, and it is a signed count or 'free'`);
  }

  /* The plate has to be honest: what the orb prints is what the cheapest swing in
     the game charges. A cost-2 weapon rolls one die, so both rates agree there. */
  const cheapest = getCard('finesse-strike');
  if (moveWillpower(card, cheapest) !== card.wp) {
    note(
      where,
      `prints ${card.wp} Willpower and charges ${moveWillpower(card, cheapest)} on a Finesse Weapon, which is the swing the rate is quoted against`
    );
  }

  /* And a move with no swing to price against falls back to its plate, which is
     what a codex list and a presentation page are handed. */
  if (moveWillpower(card, null) !== card.wp) {
    note(where, `charges ${moveWillpower(card, null)} with no swing in hand, want its printed ${card.wp}`);
  }
}

/* ----------------------------------------------- the codex and the grants differ */

const codexIds = new Set(MARTIAL_MOVES.map((card) => card.id));
const granted = all.filter((row) => row.whose !== 'codex');

for (const { card, whose } of granted) {
  /* A granted move must not also be in the pool. Both would be offered, the
     holder would see the same name twice and one of the two would be pickable at
     a rest — which is the whole distinction between the two kinds. */
  if (codexIds.has(card.id)) {
    note(`${card.name} (${whose})`, 'is granted by a set and is also in the move pool');
  }
  /* And it has to say what it is. The banner is the tags, and a granted move that
     kept `Ability` would print a word the card is no longer. */
  if (!(card.tags ?? []).includes('Martial Move')) {
    note(`${card.name} (${whose})`, `is a move and its tags are [${(card.tags ?? []).join(', ')}]`);
  }
  /* A pool move carries a tier and a granted one must not: `tierOf` walls the
     chooser by that word, and a tier on a card no chooser offers is a lie. */
  if (moveTier(card)) {
    note(`${card.name} (${whose})`, `carries the tier ${moveTier(card)}, and a granted move is not in a pool`);
  }
}

if (granted.length === 0) note('the granted moves', 'no set grants one, and three should');

/* ----------------------------------------- and no pool draws from the grants */

{
  /* The failure this catches happened: `loadoutPool` filtered the whole registry
     by `kind`, which separated the codex from the sets only for as long as no set
     granted a card of a pool's kind. On 2026-09-03 three did, and a Duelist's
     chooser offered AMBUSH — a Trickster card, pickable by somebody who had never
     paid a rank for the set. Asserted against every spec in the game rather than
     the one that broke, because the next one will be a spell. */
  const grantedIds = new Set(granted.map((row) => row.card.id));

  for (const talent of TALENTS) {
    const spec = loadoutOf(talent);
    if (!spec) continue;

    const leaking = loadoutPool(spec).filter((card) => grantedIds.has(card.id));
    if (leaking.length > 0) {
      note(
        `${talent.name}'s pool`,
        `draws ${leaking.map((card) => card.name).join(', ')} from another set's grants`
      );
    }
  }
}

/* --------------------------------------------- every grant reaches its holder */

/** A character holding one set at the rank that grants the card under test. */
const holder = (talentId, rank) => ({ talents: [{ id: talentId, rank, taken: [2, 4, 6].slice(0, rank) }] });

for (const talent of TALENTS) {
  for (const card of talent.cards ?? []) {
    if (card.kind !== 'martial-move') continue;
    const who = holder(talent.id, card.rank);
    const where = `${card.name} (${talent.name} rank ${card.rank})`;

    const held = grantedMoves(who.talents).some((row) => row.card.id === card.id);
    if (!held) note(where, 'is not handed over by the rank that grants it');

    /* A rank below it must not have it, or the rank gate is doing nothing. */
    if (card.rank > 1) {
      const under = holder(talent.id, card.rank - 1);
      if (grantedMoves(under.talents).some((row) => row.card.id === card.id)) {
        note(where, `is already held at rank ${card.rank - 1}`);
      }
    }

    if (moveSetFor(who.talents, card.id)?.id !== talent.id) {
      note(where, 'does not name the set that granted it');
    }

    /* And it is actually offered on a swing it allows. The narrowings are tested
       below; this is the plainer question of whether the offer reaches it at all. */
    const swing = getCard(card.melee ? 'melee-light-strike' : 'finesse-strike');
    if (!offeredMoves(who, swing).some((row) => row.card.id === card.id)) {
      note(where, `is held but not offered on ${swing.name}`);
    }
  }
}

/* ------------------------------------------------------------ the narrowings */

/** A holder of every set that grants a move, at its top rank. */
const everybody = {
  talents: TALENTS.filter((talent) => (talent.cards ?? []).some((card) => card.kind === 'martial-move')).map(
    (talent) => ({ id: talent.id, rank: 3, taken: [2, 4, 6] })
  ),
};

const ranged = getCard('short-bow-shoot');
const special = getCard('finesse-flurry');
const melee = getCard('melee-light-strike');

for (const { card, whose } of granted) {
  const where = `${card.name} (${whose})`;

  if (card.melee) {
    if (offeredMoves(everybody, ranged).some((row) => row.card.id === card.id)) {
      note(where, 'says melee and is offered on a Short Bow');
    }
    if (!offeredMoves(everybody, melee).some((row) => row.card.id === card.id)) {
      note(where, 'says melee and is not offered on a sword');
    }
  }

  /* `plain` has to hold even when a set has bought the widening, which is the
     whole reason it is a card's flag and not the system's. Forced true here
     rather than waiting for a set to declare it. */
  if (card.plain) {
    const offered = offeredMoves(everybody, special);
    if (offered.some((row) => row.card.id === card.id)) {
      note(where, 'says plain and is offered on a Special Weapon Attack');
    }
  }
}

/* ------------------------------------------------------- the rates, up the wall */

const rows = [];

for (const { card, whose } of all) {
  if (!card.scales) continue;

  for (const id of RUNGS) {
    const swing = getCard(id);
    if (!swing) {
      note('the cost column', `has no card called ${id}`);
      continue;
    }

    const got = moveWillpower(card, swing);
    const want =
      card.scales === 'dice' ? card.wp * swingDice(swing) : card.wp * Math.ceil(Number(swing.ap) / 2);

    if (got !== want) {
      note(`${card.name} (${whose}) on ${swing.name}`, `charges ${got}, and its rate makes it ${want}`);
    }
    rows.push(`  ${card.name.padEnd(20)} ${card.scales.padEnd(5)} ${swing.name.padEnd(26)} ${got}`);
  }
}

/* Every plain weapon attack has to roll at least one die, or a `'dice'` rate
   prices itself at nothing and AMBUSH comes out free. Cheap to assert and the
   one assumption the whole rate rests on. */
for (const card of WEAPON_ABILITIES) {
  if (!isPlainAttack(card)) continue;
  if (swingDice(card) === 0) {
    note(card.name, 'is a plain weapon attack that rolls no Damage Dice, so a dice rate prices at nothing');
  }
}

/* ------------------------------------------------------ the two words in `rides` */

{
  /* `elevate: 'paid'` has to come out as the price on the swing, not as zero and
     not as one. Walked on two rungs, because a constant would pass on one. */
  const paid = all.filter(({ card }) => card.rides?.elevate === 'paid');
  if (paid.length === 0) note("rides.elevate 'paid'", 'nothing carries it, and AMBUSH should');

  for (const { card, whose } of paid) {
    for (const id of ['finesse-strike', 'melee-great-strike']) {
      const swing = getCard(id);
      const folded = withMoves({}, [card], swing);
      const want = moveWillpower(card, swing);
      if (folded.elevate !== want) {
        note(`${card.name} (${whose}) on ${swing.name}`, `Elevates ${folded.elevate}, and it paid ${want}`);
      }
    }
  }

  /* And `ap: 'free'` has to raise the flag rather than be summed as a number.
     `Number('free')` is NaN and NaN quietly adds to nothing. */
  const free = all.filter(({ card }) => card.rides?.ap === 'free');
  if (free.length === 0) note("rides.ap 'free'", 'nothing carries it, and RECKLESS VIOLENCE should');

  for (const { card, whose } of free) {
    const cost = moveCost([card], 0, getCard('melee-great-strike'));
    if (!cost.free) note(`${card.name} (${whose})`, 'says the swing is free and moveCost does not flag it');
    if (cost.ap !== 0) note(`${card.name} (${whose})`, `also moves the Action Points by ${cost.ap}`);
  }
}

/* ------------------------------------------------- and a move is never a chip */

{
  /* The one thing a Martial Move must never be is playable on its own. Asserted
     against the quick bar rather than against the filter that drops them, because
     the filter is the implementation and this is the rule. */
  const { quickBar } = await import('../src/lib/combatBar.js');
  const ids = new Set(all.map(({ card }) => card.id));
  for (const group of quickBar(everybody)) {
    for (const row of group.moves) {
      if (ids.has(row.card?.id)) {
        note(`${row.card.name} on the quick bar`, 'is a Martial Move and a Martial Move is not an action');
      }
    }
  }
}

/* --------------------------------------------------------------------- report */

if (LIST) {
  console.log('\nthe rates, up the cost column\n');
  console.log(rows.join('\n'));
  console.log(`\n${all.length} moves: ${MARTIAL_MOVES.length} in the pool, ${granted.length} granted`);
}

if (findings.length > 0) {
  console.error(`\nmartial moves: ${findings.length} ${findings.length === 1 ? 'finding' : 'findings'}\n`);
  console.error(findings.join('\n'));
  process.exit(LIST ? 0 : 1);
}

const scaling = all.filter(({ card }) => card.scales).length;
console.log(
  `martial moves: ${all.length} hold their shape, ${granted.length} granted ones reach their holder, and ${scaling} rates climb the wall`
);
