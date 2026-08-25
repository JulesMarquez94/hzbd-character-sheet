/**
 * The printed order, proved. Covers the promise src/lib/cardOrder.js makes:
 * **a list of cards climbs the ladder, and inside a rung the schools stay
 * together, and inside a school the families do.**
 *
 *   node scripts/check-order.mjs         report and exit 1 on any finding
 *   node scripts/check-order.mjs --list  print the codex in its order, exit 0
 *
 * The risk this covers is not the comparison, it is the **table**. The law ranks
 * a word by where it sits on a shelf in cardOrder.js, and a word on no shelf is
 * ranked by nothing: it sorts as a tie and lands wherever the codex happened to
 * put it. That failure is silent. A school written tomorrow, a family added to
 * Elemental, an Ingredient part nobody listed, all of them draw a wall that looks
 * plausible and is in no order at all.
 *
 * So every word the codex actually uses is walked back to a shelf, both ladders
 * are walked back to the tables that were already keeping them, and the whole
 * spell codex is sorted and read to see that it comes out monotonic. The last of
 * those is the round trip: it proves the law rather than the tables.
 */

import {
  RARITIES,
  RUNGS,
  SHELVES,
  cardRung,
  cardShelf,
  compareCards,
  compareTags,
  sortCards,
  sortItems,
} from '../src/lib/cardOrder.js';
import { ENCHANTMENTS } from '../src/lib/enchantments.js';
import { INGREDIENTS, INGREDIENT_PARTS, INGREDIENT_TIERS } from '../src/lib/ingredients.js';
import { ARMOR_SLOTS, ITEMS, RARITY_COLORS, itemCategory } from '../src/lib/items.js';
import { MARTIAL_MOVES, MOVE_TIERS } from '../src/lib/martial.js';
import { SPELLS } from '../src/lib/spells.js';

const LIST = process.argv.includes('--list');

const findings = [];
const note = (what, said) => findings.push(`  ${what}\n    ${said}`);

/** Whether any shelf in cardOrder.js has heard of a word. */
const shelved = (word) => SHELVES.some((row) => row.includes(word));

/* ------------------------------------------ the ladders are the ones already kept */

/**
 * RUNGS is longer than the two tables it has to agree with, because Legendary and
 * Unique are rungs the codex prints and no rank climbs. What it may not do is
 * disagree about the three they share.
 */
for (const [where, ladder] of [
  ['MOVE_TIERS in martial.js', MOVE_TIERS],
  ['INGREDIENT_TIERS in ingredients.js', INGREDIENT_TIERS],
]) {
  const head = RUNGS.slice(0, ladder.length);
  if (head.join() !== ladder.join()) {
    note(where, `reads ${ladder.join(', ')} where RUNGS starts ${head.join(', ')}`);
  }
}

const colours = Object.keys(RARITY_COLORS);
if (colours.join() !== RARITIES.join()) {
  note(
    'RARITY_COLORS in items.js',
    `reads ${colours.join(', ')} where RARITIES reads ${RARITIES.join(', ')}`
  );
}

/* --------------------------------------------- no two shelves contradict each other */

/**
 * A word may stand on two shelves. `Infusion` is an Ingredient part and an
 * enchantment kind, and that is allowed precisely because the two are never
 * compared against the same neighbour. What is not allowed is two shelves putting
 * the same pair of words in opposite orders, which would make the answer depend
 * on which shelf was found first.
 */
for (let i = 0; i < SHELVES.length; i += 1) {
  for (let j = i + 1; j < SHELVES.length; j += 1) {
    const both = SHELVES[i].filter((word) => SHELVES[j].includes(word));
    for (const a of both) {
      for (const b of both) {
        if (a === b) continue;
        const left = SHELVES[i].indexOf(a) - SHELVES[i].indexOf(b);
        const right = SHELVES[j].indexOf(a) - SHELVES[j].indexOf(b);
        if (Math.sign(left) !== Math.sign(right)) {
          note(`${a} and ${b}`, `shelf ${i} and shelf ${j} disagree about which comes first`);
        }
      }
    }
  }
}

/* --------------------------------------- every word the codex uses has a place */

/**
 * A spell's banner is the tier, the school and the family, so both words after
 * the rung have to be on a shelf or the wall they draw is unordered.
 *
 * Read off the tags rather than off a list here, which is the whole point: the
 * day a fifth school is written this fails, naming the word, instead of quietly
 * sorting it last.
 */
const schools = new Set();
const families = new Set();
for (const spell of SPELLS) {
  const shelf = cardShelf(spell);
  // ['Spell', school, family]. A spell with no rung has not been tagged at all.
  if (!cardRung(spell)) {
    note(spell.name, `its tags name no rung: ${(spell.tags ?? []).join(' · ')}`);
    continue;
  }
  if (shelf[1]) schools.add(shelf[1]);
  if (shelf[2]) families.add(shelf[2]);
}

for (const word of schools) {
  if (!shelved(word)) note(`the ${word} school`, 'is on no shelf in cardOrder.js, so it sorts nowhere');
}
for (const word of families) {
  if (!shelved(word)) note(`the ${word} family`, 'is on no shelf in cardOrder.js, so it sorts nowhere');
}

for (const part of INGREDIENT_PARTS) {
  if (!shelved(part.label)) note(`the ${part.label} part`, 'is on no shelf in cardOrder.js');
}

for (const entry of ENCHANTMENTS) {
  const kind = cardShelf(entry)[1];
  if (kind && !shelved(kind)) note(`${entry.name}`, `its kind ${kind} is on no shelf in cardOrder.js`);
}

/**
 * And every rarity word an item actually carries is one the ladder knows. The
 * ladder is `RARITY_COLORS`'s keys, so a word off it is an item nothing colours
 * either, which makes this the cheap half of a check the colours already imply.
 */
for (const item of ITEMS) {
  for (const tag of item.tags ?? []) {
    if (tag in RARITY_COLORS && !RARITIES.includes(tag)) {
      note(item.name, `carries the rarity ${tag}, which is not on RARITIES`);
    }
  }
}

/**
 * The armor shelf is the only item path written down in cardOrder.js, and it is
 * only there because the alphabet gets the body wrong. So it has to keep saying
 * what ARMOR_SLOTS says: a fourth piece of armor, or a renamed slot, and these
 * two go out of step silently.
 */
const wornWords = new Set();
for (const item of ITEMS) {
  for (const tag of item.tags ?? []) if (/\bGear$/.test(tag)) wornWords.add(tag);
}
for (const word of wornWords) {
  if (!shelved(word)) note(`the ${word} slot`, 'is on no shelf in cardOrder.js, so armor sorts by its initial');
}

/* Matched on the stem rather than on the whole word, because the slot and the
   tag are not the same string: ARMOR_SLOTS says Legs and the tag says Leg Gear.
   What is being checked is the *order* of the three, not their spelling. */
const stem = (word) => String(word).toLowerCase().replace(/s$/, '');
const bodyShelf = SHELVES.find((row) => row.includes('Head Gear')) ?? [];
const bodySlots = ARMOR_SLOTS.map(
  (slot) => [...wornWords].find((tag) => stem(tag.split(' ')[0]) === stem(slot.label)) ?? `${slot.label}?`
);
if (bodyShelf.join() !== bodySlots.join()) {
  note(
    'the armor shelf in cardOrder.js',
    `reads ${bodyShelf.join(', ')} where ARMOR_SLOTS goes ${bodySlots.join(', ')}`
  );
}

/* --------------------------------------------------- the round trip on the codex */

/**
 * Sorted, the spell codex has to *read* the way it was asked for: never a rung
 * you have already left, never a school you have already left inside one rung,
 * never a family you have already left inside one school.
 *
 * This is the check that would survive the tables being rewritten, because it
 * tests the promise rather than the data behind it.
 */
function walkMonotonic(cards, what) {
  const seen = { rung: new Set(), school: new Set(), family: new Set() };
  let rung = null;
  let school = null;
  let family = null;

  for (const card of cards) {
    const at = cardRung(card);
    const shelf = cardShelf(card);
    const [, itsSchool, itsFamily] = shelf;

    if (at !== rung) {
      if (seen.rung.has(at)) {
        note(card.name, `${what} returns to ${at} after leaving it`);
      }
      seen.rung.add(at);
      seen.school.clear();
      seen.family.clear();
      rung = at;
      school = null;
      family = null;
    }

    if (itsSchool !== school) {
      if (seen.school.has(itsSchool)) {
        note(card.name, `${what} returns to ${itsSchool} inside ${at} after leaving it`);
      }
      seen.school.add(itsSchool);
      seen.family.clear();
      school = itsSchool;
      family = null;
    }

    if (itsFamily !== family) {
      if (seen.family.has(itsFamily)) {
        note(card.name, `${what} returns to ${itsFamily} inside ${itsSchool} after leaving it`);
      }
      seen.family.add(itsFamily);
      family = itsFamily;
    }
  }
}

const ordered = sortCards(SPELLS);
walkMonotonic(ordered, 'the spell codex');

/** And the rungs come out in the ladder's own order rather than merely grouped. */
const climbed = [];
for (const card of ordered) {
  const at = cardRung(card);
  if (climbed[climbed.length - 1] !== at) climbed.push(at);
}
const wanted = RUNGS.filter((word) => climbed.includes(word));
if (climbed.join() !== wanted.join()) {
  note('the spell codex', `climbs ${climbed.join(', ')} where the ladder is ${wanted.join(', ')}`);
}

/* --------------------------------------------------------------- stability */

/**
 * Two cards the law has nothing to say about must come out in the order they
 * went in. This is what keeps a rank's own section in the designer's order, and
 * it is worth a test because it is a property of the *comparison* (it returns 0
 * rather than falling through to the name) and one stray tie-break would undo it.
 */
const primalFlora = SPELLS.filter((card) => {
  const shelf = cardShelf(card);
  return cardRung(card) === 'Novice' && shelf[1] === 'Primal' && shelf[2] === 'Flora';
});
const resorted = sortCards(primalFlora);
if (resorted.map((card) => card.id).join() !== primalFlora.map((card) => card.id).join()) {
  note(
    'the Novice Primal Flora spells',
    'come out of the sort in a different order than they went in, so the codex order is not being kept'
  );
}

for (const card of [...SPELLS, ...MARTIAL_MOVES, ...INGREDIENTS, ...ENCHANTMENTS]) {
  if (compareCards(card, card) !== 0) note(card.name, 'does not compare equal to itself');
}

/* ---------------------------------------------------- and the same for items */

/**
 * A shelf of the inventory climbs its rarity once and never goes back, and a
 * chip row of rarities reads the ladder rather than the alphabet. Both are the
 * `Legendary` collision, which is the one thing about this file that is easy to
 * get wrong twice: the word is a rung *and* a rarity, and read as a rung it
 * sorts above Common.
 */
for (const category of new Set(ITEMS.map(itemCategory))) {
  const shelf = sortItems(ITEMS.filter((item) => itemCategory(item) === category));
  const climbed = [];
  for (const item of shelf) {
    const rarity = (item.tags ?? []).find((tag) => RARITIES.includes(tag)) ?? 'Common';
    if (climbed[climbed.length - 1] !== rarity) climbed.push(rarity);
  }
  const wantedRarity = RARITIES.filter((word) => climbed.includes(word));
  if (climbed.join() !== wantedRarity.join()) {
    note(`the ${category} shelf`, `climbs ${climbed.join(', ')} where rarity is ${wantedRarity.join(', ')}`);
  }
}

const chips = [...RARITIES].reverse().sort(compareTags);
if (chips.join() !== RARITIES.join()) {
  note('a rarity chip row', `sorts to ${chips.join(', ')} where the ladder is ${RARITIES.join(', ')}`);
}

/* ------------------------------------------------------------------ report */

if (LIST) {
  for (const card of ordered) {
    console.log(`${(card.tags ?? []).join(' · ').padEnd(38)} ${card.name}`);
  }
  console.log(`\n${ordered.length} spells, in the order the sheet prints them.`);
  process.exit(0);
}

if (findings.length > 0) {
  console.error(`card order: ${findings.length} finding${findings.length === 1 ? '' : 's'}\n`);
  console.error(findings.join('\n\n'));
  process.exit(1);
}

const counted = SPELLS.length + MARTIAL_MOVES.length + INGREDIENTS.length + ENCHANTMENTS.length;
console.log(
  `card order: ${schools.size} schools and ${families.size} families are shelved, ` +
    `and ${counted} cards sort up the ladder`
);
