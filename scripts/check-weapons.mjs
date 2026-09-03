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
 * Four families read the grid sideways and each is the designer's own rule:
 *
 *   shield     the base weapon's damage, one rung down, at 1 more Action Point
 *   paired     the same rung down with twice as many dice, at d4, +1 point
 *   crossbow   its own rung's damage for 1 Action Point less, and a Reload
 *   firearm    its own rung's damage for 1 Action Point flat, and a magazine
 *
 * What this does not check is prose. A card that reads badly still passes, and
 * `npm run lint:text` is the other half.
 */

import { cardProse } from '../src/lib/cardText.js';
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
  'flintlock-pistol': [2, 'instinct', 'firearm'],
  'fire-wand': [2, 'mind', 'plain'],
  'frost-wand': [2, 'mind', 'plain'],
  'lightning-wand': [2, 'mind', 'plain'],
  'fist-weapon': [2, 'instinct', 'plain'],
  /* ---- cost 3 ---- */
  'melee-light': [3, 'physique', 'plain'],
  bow: [3, 'instinct', 'plain'],
  'flintlock-rifle': [3, 'instinct', 'firearm'],
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
  'portable-canon': [4, 'instinct', 'firearm'],
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

/** The four weapons whose names say Great, and which carry the tag. */
const GREAT = ['melee-great', 'great-bow', 'great-polearm', 'paired-great'];

/** What each set hangs on, so a retag that orphans a card is a finding here. */
const SET_TAGS = {
  Duelist: ['Finesse', 'Whip', 'Fist', 'Polearm'],
  Colossus: ['Heavy Melee', 'Great Melee'],
  'Giant Slayer': ['Great'],
  'Feral Curse': ['Natural'],
};

const findings = [];
const note = (what, said) => findings.push(`  ${what}\n    ${said}`);

/** What a family's cost buys, after its sideways rule. */
function wants(cost, how) {
  if (how === 'shield' || how === 'paired') {
    const under = LADDER[cost - 1];
    return how === 'paired' ? paired(under) : under;
  }
  return LADDER[cost];
}

/**
 * A rung read as a pair: **twice as many dice, each one size smaller.**
 *
 * Jules on 2026-09-03: "Paired weapon are incorrectly doing half the number of d4
 * they should[.] Paired heavy should be 4d4." So a Paired Heavy reads the cost-4
 * rung, 2d6, and rolls 4d4 for it — one expression, not one rolled twice.
 *
 * This is the second reading of "Their attack use twice d4 instead of d6" and it
 * supersedes the first. Until this day the pair was the *landing* — 2d4 dealt
 * twice — which put the attribute on the card twice as well, and made a Paired
 * Heavy at 5 Action Points worth 10 + 4x its attribute against a Great Weapon's
 * 10.5 + 2x for the same points. Folded into one throw the dice come out the same
 * and the attribute is counted once, which is what the rest of the wall does. See
 * the Paired Finesse note in src/lib/weapons.js.
 */
function paired(rung) {
  return rung.replace(/(\d+)d6/, (whole, count) => `${Number(count) * 2}d4`);
}

/** What the plain attack costs, after its sideways rule. */
function points(cost, how) {
  if (how === 'firearm') return 1;
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
  } else if (/Volley$/.test(name)) {
    /* Priced by hand on 2026-08-24: "wand volley should cost 5 action points and 2
       willpower". Three hits off one roll, sold for what Flurry is sold for. */
    if (second.ap !== 5 || second.wp !== 2) note(where, `${name} costs ${second.ap} and ${second.wp}, and Volley is 5 and 2`);
  } else if (/Chorus$/.test(name)) {
    // And the same day: "tome of incantations special attack should cost 4 AP and 2 WP".
    if (second.ap !== 4 || second.wp !== 2) note(where, `${name} costs ${second.ap} and ${second.wp}, and Chorus is 4 and 2`);
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

/* Rebuilt with the tag pass of 2026-08-24. Every weapon carries `Weapon` and
   exactly one of Melee and Ranged, exactly one of the two hands, and a rarity. The
   first of those is the one the reader never sees, which is exactly why it is
   checked here: a tag nothing draws is a tag nothing notices going missing. */
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic'];

for (const weapon of WEAPONS) {
  const tags = weapon.tags ?? [];
  const where = `${weapon.name} (${weapon.id})`;
  const hands = tags.filter((tag) => tag === 'One-Handed' || tag === 'Two-Handed');
  const kinds = tags.filter((tag) => tag === 'Melee' || tag === 'Ranged');
  const rarity = tags.filter((tag) => RARITIES.includes(tag));

  if (hands.length !== 1) note(where, `carries ${hands.length} of One-Handed and Two-Handed, and every weapon carries one`);
  if (kinds.length !== 1) note(where, `carries ${kinds.length} of Melee and Ranged, and every weapon carries one`);
  if (rarity.length !== 1) note(where, `carries ${rarity.length} rarities, and every weapon carries one`);
  if (!tags.includes('Weapon')) note(where, 'does not carry the hidden Weapon tag, so a filter for every weapon misses it');
  if (tags.includes('Focus')) note(where, 'still carries Focus, which the tag pass of 2026-08-24 retired');

  /* Melee reaches 1 meter unless the weapon says Reach. The designer's rule of
     2026-08-24, and the one number a reader would never think to check. */
  if (kinds[0] === 'Melee' && !tags.includes('Reach')) {
    const { plain } = taught(weapon);
    if (plain && !/within 1 meter/.test(cardProse(plain.body))) {
      note(where, `${plain.name} does not reach 1 meter, and only a Reach weapon reaches further`);
    }
  }
}

for (const id of GREAT) {
  if (!(byId.get(id)?.tags ?? []).includes('Great')) {
    note(id, 'is a Great weapon without the Great tag, so GIANT SLAYER cannot see it');
  }
}
for (const weapon of WEAPONS) {
  if ((weapon.tags ?? []).includes('Great') && !GREAT.includes(weapon.id)) {
    note(weapon.id, 'carries Great and is not one of the four weapons whose name says Great');
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

/* ------------------------------------------ the title, and what it belongs to
 * Every weapon card names its weapon in `weapon`, and the *title* it prints is
 * its name with that taken off the front. So the field and the name have to agree
 * to the character, or a card headed "Short Bow - Shoot" quietly appears on the
 * one wall where the heading was supposed to be "Shoot". Two ways that goes
 * wrong and both are silent, which is why they are checked rather than read:
 *
 *   no field      the card prints its whole name and nothing says why
 *   wrong field   the prefix does not match, so nothing is taken off
 *
 * See cardTitle and cardBanner in src/lib/cardText.js.
 */

for (const card of WEAPON_ABILITIES) {
  if (!card.weapon) {
    note(card.id, 'is a weapon card with no weapon on it, so its title prints the whole name');
    continue;
  }
  if (!card.name.startsWith(`${card.weapon} - `)) {
    note(card.id, `is named "${card.name}" and belongs to "${card.weapon}", which is not its prefix`);
  }
  if (card.name === `${card.weapon} - `) note(card.id, 'has a weapon and no move after it');
}

/* ------------------------------------------------------------- the magazines
 * A magazine is two cards pointing at each other: `ammo` on the attack names the
 * Reload that fills it, and `reloads` on the Reload names the attack. Either half
 * on its own is a weapon that empties and never fills, or a Reload that costs
 * Action Points and does nothing, and neither of those throws. See uses.js.
 */

const AMMO_MAX = { 'flintlock-pistol-shoot': 3, 'flintlock-rifle-shoot': 2 };

for (const card of WEAPON_ABILITIES) {
  if (card.ammo) {
    const wants = AMMO_MAX[card.id] ?? 1;
    if (card.ammo.max !== wants) {
      note(card.id, `holds ${card.ammo.max} rounds, and the designer's sheet says ${wants}`);
    }
    if (!card.ammo.unit) note(card.id, 'holds rounds with no name, so the pips cannot pick a shape');
    const reload = getCard(card.ammo.reload);
    if (!reload) note(card.id, `names "${card.ammo.reload}" as its Reload and no card has that id`);
    else if (reload.reloads !== card.id) {
      note(card.id, `names ${reload.name} as its Reload, and that card fills "${reload.reloads}"`);
    }
  }

  if (card.reloads) {
    const attack = getCard(card.reloads);
    if (!attack) note(card.id, `fills "${card.reloads}" and no card has that id`);
    else if (!attack.ammo) note(card.id, `fills ${attack.name}, which holds no ammunition to fill`);
  }

  /* And the other direction: a card whose prose counts rounds without a rider is
     a weapon the sheet lets you fire for ever. Every one of them says Reload. */
  const counts = /Reload/.test(card.body ?? '') && !/Reload$/.test(card.name);
  if (counts && !card.ammo) note(card.id, 'tells the reader to Reload and carries no ammo rider, so nothing counts down');
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
