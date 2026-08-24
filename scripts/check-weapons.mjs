/**
 * Weapon-table round trip. Proves the one promise src/lib/weapons.js makes:
 * **the designer's weapon table is what the cards say.**
 *
 *   node scripts/check-weapons.mjs        report and exit 1 on any drift
 *   node scripts/check-weapons.mjs --list print every weapon, then exit 0
 *
 * The table is a grid of families against costs and it fixes four things at
 * once: what a weapon costs to swing, what it deals, which attribute it swings
 * on and which rung of the ladder it reads its dice off. None of that is derived
 * anywhere in the app, it is typed out card by card, and a card is 25 lines away
 * from the one above it. So the grid is written here once and every card is
 * measured against it rather than read and hoped over.
 *
 * `TABLE` below **is** the designer's sheet, transcribed: the cost column off the
 * table itself, and the attribute off the three lists they sent on 2026-08-24.
 * When a cell changes, it changes here and the run says which cards disagree.
 *
 * Three families read the grid sideways and each is the designer's own rule:
 *
 *   shield     the base weapon's damage, one rung down, at 1 more Action Point
 *   paired     the same rung down with its dice as d4, rolled twice, +1 point
 *   crossbow   its own rung's damage for 1 Action Point less, and a Reload
 *
 * What this does not check is prose. A card that reads badly still passes, and
 * `npm run lint:text` is the other half.
 */

import { WEAPONS, WEAPON_ABILITIES, getCard } from '../src/lib/weapons.js';

const LIST = process.argv.includes('--list');

/** What a cost buys, off the designer's table. The whole balance of the wall. */
const LADDER = {
  2: '1d6 + stat',
  3: '2d6 + stat',
  4: '2d6 + 2*stat',
  5: '3d6 + 2*stat',
  6: '3d6 + 3*stat',
};

/**
 * The table, cell by cell: `id: [cost, attribute, how it reads the ladder]`.
 *
 * `plain` is the default and the other three are the designer's three sideways
 * rules. The five enchanted weapons and Claws & Teeth are deliberately not here:
 * they are not cells on the table, they borrow the cards of the ones that are,
 * and the walk below checks that borrowing rather than re-checking the numbers.
 */
const TABLE = {
  /* ---- cost 2 ---- */
  'finesse-weapon': [2, 'instinct', 'plain'],
  'short-bow': [2, 'instinct', 'plain'],
  'flintlock-pistol': [2, 'instinct', 'plain'],
  'fire-wand': [2, 'mind', 'plain'],
  'frost-wand': [2, 'mind', 'plain'],
  'lightning-wand': [2, 'mind', 'plain'],
  'fist-weapon': [2, 'instinct', 'plain'],
  /* ---- cost 3 ---- */
  'melee-light': [3, 'physique', 'plain'],
  bow: [3, 'instinct', 'plain'],
  'flintlock-rifle': [3, 'instinct', 'plain'],
  whip: [3, 'instinct', 'plain'],
  'light-crossbow': [3, 'instinct', 'crossbow'],
  'psychic-tome': [3, 'mind', 'plain'],
  'sacred-tome': [3, 'mind', 'plain'],
  'decay-tome': [3, 'mind', 'plain'],
  'paired-finesse': [3, 'instinct', 'paired'],
  'enchanted-instrument': [3, 'instinct', 'plain'],
  'finesse-shield': [3, 'instinct', 'shield'],
  /* ---- cost 4 ---- */
  'melee-heavy': [4, 'physique', 'plain'],
  'long-bow': [4, 'physique', 'plain'],
  'portable-canon': [4, 'instinct', 'plain'],
  polearm: [4, 'instinct', 'plain'],
  crossbow: [4, 'instinct', 'crossbow'],
  'sharp-staff': [4, 'mind', 'plain'],
  'force-staff': [4, 'mind', 'plain'],
  'blunt-staff': [4, 'mind', 'plain'],
  'paired-light': [4, 'physique', 'paired'],
  'melee-light-shield': [4, 'physique', 'shield'],
  /* ---- cost 5 ---- */
  'melee-great': [5, 'physique', 'plain'],
  'great-bow': [5, 'physique', 'plain'],
  'great-polearm': [5, 'physique', 'plain'],
  'heavy-crossbow': [5, 'instinct', 'crossbow'],
  'decay-censer': [5, 'mind', 'plain'],
  'sacred-censer': [5, 'mind', 'plain'],
  'psychic-censer': [5, 'mind', 'plain'],
  'paired-heavy': [5, 'physique', 'paired'],
  'melee-heavy-shield': [5, 'physique', 'shield'],
  /* ---- cost 6 ---- */
  ballista: [6, 'physique', 'crossbow'],
  'paired-great': [6, 'physique', 'paired'],
};

/** The four Great weapons, which are the Colossal ones the Colossus reads. */
const GREAT = ['melee-great', 'great-bow', 'great-polearm', 'paired-great'];

/** What each set hangs on, so a retag that orphans a card is a finding here. */
const SET_TAGS = {
  Duelist: ['Finesse', 'Light Melee'],
  Colossus: ['Heavy Melee', 'Great Melee'],
  'Giant Slayer': ['Colossal'],
  'Feral Curse': ['Natural'],
};

const findings = [];
const note = (what, said) => findings.push(`  ${what}\n    ${said}`);

/** What a family's cost buys, after its sideways rule. */
function wants(cost, how) {
  if (how === 'shield' || how === 'paired') {
    const under = LADDER[cost - 1];
    return how === 'paired' ? under.replace('d6', 'd4') : under;
  }
  return LADDER[cost];
}

/** What the plain attack costs, after its sideways rule. */
function points(cost, how) {
  return how === 'crossbow' ? cost - 1 : cost;
}

/** The live value a card rolls, out of its own printed body. */
function rolled(card) {
  const found = /\[\[([^\]]+)\]\]/.exec(card?.body ?? '');
  return found ? found[1].trim() : null;
}

/** The two cards a weapon teaches, plain one first. */
function taught(weapon) {
  const cards = (weapon.abilities ?? []).map(getCard);
  const plain = cards.find((card) =>
    (card?.tags ?? []).some((tag) => /^Weapon Attack$/i.test(String(tag).trim()))
  );
  return { cards, plain, second: cards.find((card) => card && card !== plain) };
}

/* ------------------------------------------------ every cell is on the wall */

const byId = new Map(WEAPONS.map((weapon) => [weapon.id, weapon]));

for (const id of Object.keys(TABLE)) {
  if (!byId.has(id)) note(id, 'is a cell on the table and no weapon in the codex has this id');
}

const rows = [];

for (const [id, [cost, stat, how]] of Object.entries(TABLE)) {
  const weapon = byId.get(id);
  if (!weapon) continue;

  const { cards, plain, second } = taught(weapon);
  const where = `${weapon.name} (${id})`;

  if (cards.length !== 2 || cards.some((card) => !card)) {
    note(where, `teaches ${cards.filter(Boolean).length} cards, and every weapon teaches two`);
    continue;
  }
  if (!plain) {
    note(where, 'teaches no card tagged Weapon Attack, so nothing can price an ambush off it');
    continue;
  }

  /* ---- the cost column ---- */
  const ap = points(cost, how);
  if (plain.ap !== ap) note(where, `${plain.name} costs ${plain.ap} Action Points, and the table says ${ap}`);
  if (plain.wp) note(where, `${plain.name} costs ${plain.wp} Willpower, and a plain attack costs none`);

  /* ---- the ladder ---- */
  const want = wants(cost, how);
  const got = rolled(plain);
  if (got !== want) note(where, `${plain.name} rolls "${got}", and cost ${cost} buys "${want}"`);

  /* ---- the attribute ----
     A card that names none is allowed and has to be a passive: SHIELD - GUARD is
     one card shared by three weapons that do not agree on an attribute, and it
     rolls nothing. Anything else with no attribute is a card that will silently
     print Instinct. */
  for (const card of cards) {
    if (!card.stat) {
      if (!(card.tags ?? []).includes('Passive')) {
        note(where, `${card.name} names no attribute and is not a passive, so it will print Instinct`);
      }
      continue;
    }
    if (card.stat !== stat) note(where, `${card.name} swings on ${card.stat}, and the designer says ${stat}`);
  }

  /* ---- what the second card costs ---- */
  const passive = (second.tags ?? []).includes('Passive');
  const name = second.name;
  if (passive) {
    if (second.ap !== null || second.wp !== null) note(where, `${name} is a passive and still charges for itself`);
  } else if (/Reload$/.test(name)) {
    if (second.wp) note(where, `${name} costs ${second.wp} Willpower, and a Reload makes no roll`);
    if (how === 'crossbow' && second.ap !== 1) {
      note(where, `${name} costs ${second.ap} Action Points, and a Reload Bolt costs 1`);
    }
  } else if (/Flurry$/.test(name)) {
    if (second.ap !== 5 || second.wp !== 2) note(where, `${name} costs ${second.ap} and ${second.wp}, and Flurry is 5 and 2`);
  } else if (/Aimed Shot$/.test(name)) {
    if (second.ap !== plain.ap + 1 || second.wp !== 1) {
      note(where, `${name} costs ${second.ap} and ${second.wp}, and an Aimed Shot is ${plain.ap + 1} and 1`);
    }
  } else if (/Swift Strike$/.test(name)) {
    /* The one card carried over from the wall this replaced, and the one special
       that costs no Willpower. It buys disadvantage instead. */
    if (second.ap >= plain.ap) note(where, `${name} costs ${second.ap}, and it is meant to be the cheap swing`);
  } else {
    if (second.wp !== 1) note(where, `${name} costs ${second.wp} Willpower, and a special that rolls costs 1`);
    if (second.ap !== plain.ap && second.ap !== plain.ap + 1) {
      note(where, `${name} costs ${second.ap} Action Points, and a special costs ${plain.ap} or ${plain.ap + 1}`);
    }
  }

  /* ---- a paired weapon rolls at disadvantage, both cards, on the designer's rule ---- */
  if (how === 'paired') {
    for (const card of cards) {
      if (!/disadvantage/i.test(card.body ?? '')) note(where, `${card.name} does not roll at disadvantage`);
    }
  }

  rows.push(`  ${String(cost)}  ${weapon.name.padEnd(30)} ${String(plain.ap)} AP  ${want.padEnd(14)} ${stat}`);
}

/* -------------------------------------------------------------- the tagging */

for (const weapon of WEAPONS) {
  const tags = weapon.tags ?? [];
  const where = `${weapon.name} (${weapon.id})`;
  const hands = tags.filter((tag) => tag === 'One-Handed' || tag === 'Two-Handed');
  const kinds = tags.filter((tag) => tag === 'Melee Weapon' || tag === 'Ranged Weapon');

  if (hands.length !== 1) note(where, `carries ${hands.length} of One-Handed and Two-Handed, and every weapon carries one`);
  if (kinds.length !== 1) note(where, `carries ${kinds.length} of Melee Weapon and Ranged Weapon, and every weapon carries one`);

  /* Melee reaches 1 Meter unless the weapon says Reach. The designer's rule of
     2026-08-24, and the one number a reader would never think to check. */
  if (kinds[0] === 'Melee Weapon' && !tags.includes('Reach')) {
    const { plain } = taught(weapon);
    if (plain && !/within 1 Meter/.test(plain.body ?? '')) {
      note(where, `${plain.name} does not reach 1 Meter, and only a Reach weapon reaches further`);
    }
  }
}

for (const id of GREAT) {
  if (!(byId.get(id)?.tags ?? []).includes('Colossal')) {
    note(id, 'is a Great weapon without the Colossal tag, so GIANT SLAYER cannot see it');
  }
}
for (const weapon of WEAPONS) {
  if ((weapon.tags ?? []).includes('Colossal') && !GREAT.includes(weapon.id)) {
    note(weapon.id, 'carries Colossal and is not one of the four Great weapons');
  }
}

/* Every tag a set reaches for has to be on something, or the set grants nothing
   to nobody and says so on a card. */
for (const [set, tags] of Object.entries(SET_TAGS)) {
  for (const tag of tags) {
    if (!WEAPONS.some((weapon) => (weapon.tags ?? []).includes(tag))) {
      note(set, `hangs on "${tag}" and no weapon in the codex carries it`);
    }
  }
}

/* ------------------------------------------- nothing taught by nothing at all */

const lent = new Set(WEAPONS.flatMap((weapon) => weapon.abilities ?? []));
for (const card of WEAPON_ABILITIES) {
  if (!lent.has(card.id)) note(card.id, 'is a weapon card no weapon teaches, so nobody can ever hold it');
}

/* ------------------------------------------------------------------- report */

if (LIST) {
  console.log('\ncost  weapon                         swing  damage         attribute');
  console.log(rows.sort().join('\n'));
}

if (findings.length > 0) {
  console.error(`\nweapons: ${findings.length} disagree with the table\n`);
  console.error(findings.join('\n'));
  process.exit(1);
}

console.log(
  `\nweapons: all ${Object.keys(TABLE).length} cells match the table, across ${WEAPONS.length} weapons and ${WEAPON_ABILITIES.length} cards`
);
