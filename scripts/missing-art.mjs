/**
 * What still has no picture.
 *
 *   node scripts/missing-art.mjs            the counts, and every name
 *   node scripts/missing-art.mjs --summary  the counts only
 *   node scripts/missing-art.mjs --ids      bare ids, one per line, for a script
 *   node scripts/missing-art.mjs --csv      id,name,kind,tags for a spreadsheet
 *
 * A drawing list. Every card, item, lineage, talent set and background in the
 * codex, and whether it has art attached: `art_url` for a card or an item, the
 * `art` field for the three that carry a square plate.
 *
 * This is not a lint and never exits non-zero. A card with no picture is the
 * normal state of a card that has just been written, not a fault. What it is
 * for is the opposite question: at any moment, how much is left to draw and
 * which pieces are they.
 *
 * ---------------------------------------------------------------- the orphan
 * The last section is the other direction: a picture in the bucket that no card
 * claims. That is usually a card that was renamed or cut, and it is worth seeing
 * because it is the only way that mistake ever surfaces. `npm run lint:codex`
 * reports the same thing against the receipt.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BACKGROUNDS } from '../src/lib/backgrounds.js';
import { ITEMS, itemCategory } from '../src/lib/items.js';
import { LINEAGES } from '../src/lib/lineages.js';
import { TALENTS } from '../src/lib/talents.js';
import { CARDS } from '../src/lib/weapons.js';
import { CODEX_SCHEME, parseObjectPath } from '../src/lib/codexArt.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RECEIPT = path.join(ROOT, '.codex-art.json');

const argv = new Set(process.argv.slice(2));
const SUMMARY = argv.has('--summary');
const IDS = argv.has('--ids');
const CSV = argv.has('--csv');

/* The kinds, named the way the codex names them on the rules page rather than
   by their internal id, so a list handed to somebody drawing reads in the words
   they already know. Anything not here keeps its own name. */
const KIND_LABELS = {
  spell: 'Spells',
  talent: 'Talents',
  passive: 'Traits',
  skill: 'Skills',
  'martial-move': 'Martial Moves',
  ability: 'Abilities',
  item: 'Gear Cards',
  ingredient: 'Ingredients',
  creature: 'Creature Cards',
  weave: 'Weaves',
};

const kindLabel = (kind) =>
  KIND_LABELS[kind] ?? `${String(kind).replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())}s`;

const has = (value) => typeof value === 'string' && value.trim().length > 0;

/* ------------------------------------------------------------- gather it all */

/** Every drawable thing on the site, flattened: what it is, and whether it has
    a picture. One shape for all five sets so the report is one loop. */
const everything = [
  ...CARDS.map((card) => ({
    set: 'cards',
    group: kindLabel(card.kind ?? 'ability'),
    id: card.id,
    name: card.name ?? card.id,
    tags: (card.tags ?? []).join(' / '),
    art: card.art_url,
  })),
  ...ITEMS.map((item) => ({
    set: 'items',
    /* `itemCategory` rather than a tag: it is the shelf the inventory itself
       puts the thing on, so a drawing list groups the way the sheet does. */
    group: `Items: ${itemCategory(item)}`,
    id: item.id,
    name: item.name ?? item.id,
    tags: (item.tags ?? []).join(' / '),
    art: item.art_url,
  })),
  ...LINEAGES.map((row) => ({
    set: 'lineages',
    group: 'Lineages',
    id: row.id,
    name: row.name ?? row.id,
    tags: '',
    art: row.art,
  })),
  ...TALENTS.map((row) => ({
    set: 'talents',
    group: 'Talent sets',
    id: row.id,
    name: row.name ?? row.id,
    tags: row.category ?? '',
    art: row.art,
  })),
  ...BACKGROUNDS.map((row) => ({
    set: 'backgrounds',
    group: 'Backgrounds',
    id: row.id,
    name: row.name ?? row.id,
    tags: '',
    art: row.art,
  })),
];

const missing = everything.filter((one) => !has(one.art));

/* --------------------------------------------------------------- the machines */

if (IDS) {
  for (const one of missing) console.log(one.id);
  process.exit(0);
}

if (CSV) {
  console.log('id,name,group,tags');
  const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
  for (const one of missing) {
    console.log([one.id, one.name, one.group, one.tags].map(quote).join(','));
  }
  process.exit(0);
}

/* ----------------------------------------------------------------- the report */

const bySet = new Map();
for (const one of everything) {
  const found = bySet.get(one.set) ?? { total: 0, missing: 0 };
  found.total += 1;
  if (!has(one.art)) found.missing += 1;
  bySet.set(one.set, found);
}

console.log('\nMISSING ART\n');
console.log('  set             drawn   missing   total');
console.log('  ---------------------------------------');
let allTotal = 0;
let allMissing = 0;
for (const [set, { total, missing: gone }] of bySet) {
  allTotal += total;
  allMissing += gone;
  console.log(
    `  ${set.padEnd(14)} ${String(total - gone).padStart(5)}   ${String(gone).padStart(7)}   ${String(total).padStart(5)}`
  );
}
console.log('  ---------------------------------------');
console.log(
  `  ${'all'.padEnd(14)} ${String(allTotal - allMissing).padStart(5)}   ${String(allMissing).padStart(7)}   ${String(allTotal).padStart(5)}`
);

const byGroup = new Map();
for (const one of missing) {
  const list = byGroup.get(one.group) ?? [];
  list.push(one);
  byGroup.set(one.group, list);
}

const groups = [...byGroup.entries()].sort((a, b) => b[1].length - a[1].length);

console.log('\n\nBY GROUP\n');
for (const [group, list] of groups) {
  console.log(`  ${String(list.length).padStart(4)}  ${group}`);
}

if (!SUMMARY) {
  for (const [group, list] of groups) {
    console.log(`\n\n${group.toUpperCase()}  (${list.length})\n`);
    for (const one of list.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`  ${one.name}${one.tags ? `  ·  ${one.tags}` : ''}`);
      console.log(`      ${one.id}`);
    }
  }
}

/* ------------------------------------------------------------------ the orphan */

if (existsSync(RECEIPT)) {
  const claimed = new Set();
  for (const one of everything) {
    if (has(one.art) && one.art.startsWith(CODEX_SCHEME)) {
      const parsed = parseObjectPath(one.art.slice(CODEX_SCHEME.length));
      if (parsed) claimed.add(`${parsed.set}/${parsed.id}`);
    }
  }

  const orphans = new Set();
  for (const object of Object.keys(JSON.parse(readFileSync(RECEIPT, 'utf8')))) {
    const parsed = parseObjectPath(object);
    if (parsed && !claimed.has(`${parsed.set}/${parsed.id}`)) orphans.add(`${parsed.set}/${parsed.id}`);
  }

  if (orphans.size) {
    console.log(`\n\nPICTURES NOTHING CLAIMS  (${orphans.size})\n`);
    console.log('  A picture is in the bucket and no card, item or plate points at');
    console.log('  it. Usually something renamed or cut.\n');
    for (const name of [...orphans].sort()) console.log(`  ${name}`);
  }
}

console.log('');
