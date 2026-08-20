/**
 * Optimise the item pictures that arrive as a folder, and rewrite the lookup
 * the inventory reads.
 *
 *     npm run art:items
 *
 * ---------------------------------------------------------------- why it exists
 * Sibling to pull-card-art.mjs, and the same job with a different source. Card
 * art comes as postimg links in an Image column, so that script downloads. Item
 * art arrived as `data/Armor/`: 27 pictures, every one of them 2048x2048 JPEG,
 * 66 MB in total, against an Image column left empty. Nothing downloads here —
 * the folder is the source — but everything after that is the same pass.
 *
 * The plates those pictures land on are a 40px tile and a 360px card. Sending
 * 2048x2048 to either is 2.4 MB to paint 40 pixels, so each one is cut to the
 * two sizes that are actually drawn: 720px for the card, 128px for the tile.
 * The whole set comes out around 0.75 MB, which is 88x smaller than the folder.
 *
 * ------------------------------------------------------------------ the flow
 *   1. walk data/<Folder>/ for pictures — Armor today, Weapons the day one lands
 *   2. match each file to a codex item by its printed name
 *   3. resize, encode, write public/items/
 *   4. rewrite src/lib/itemArt.js
 *
 * Re-runnable and idempotent: a picture already on disk is skipped unless
 * --force is passed, so a new piece of armor costs one encode rather than 27.
 *
 * ------------------------------------------------------------------- the cost
 * Committing the WebP files is deliberate, for the same reason the card art is
 * committed: they are the product's art, they are ~26 KB each, and having them
 * in the repo is what lets Cloudflare serve them. The 2048px originals stay in
 * `data/`, which is gitignored, and this script is how they get out.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'public', 'items');

/* Two sizes, because there are two plates, and both are square because the
   pictures are: one object centred on a painted ground, 2048x2048 every time.
   Cropping a square master to whatever aspect a plate wants is a line of CSS;
   cropping it here would spend the choice at encode time.

   720 is the 360px item card at 2x — the widest any of this is ever drawn.
   128 is the 40px icon tile at 3x, which is also the 52px tile the equip
   prompt uses at 2.5x. That tile is the commonest sight in the inventory: a
   browser list is nine of them at once, and nine 26 KB pictures to paint nine
   40px squares is the same mistake the card thumbnails were cut to fix.

   Quality 78 is the card pipeline's number, and it holds here for the same
   reason — smooth paint on a flat ground, where the file keeps growing after
   the picture has stopped improving. */
const WIDTH = 720;
const THUMB_WIDTH = 128;
const QUALITY = 78;

const IMAGE_FILE = /\.(?:jpe?g|png|webp)$/i;

const FORCE = process.argv.includes('--force');

/**
 * Names are compared with punctuation and case flattened, because "Studded
 * leather Helm.jpg" is the sheet's "Studded Leather Helm" and nobody should
 * have to notice the l.
 */
const flatten = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** A filename with its extension dropped, flattened. */
const bare = (file) => flatten(file.replace(IMAGE_FILE, ''));

/**
 * Pictures whose filename is not the name the sheet prints.
 *
 * Five of the 27 arrived under a different word, and every one was opened and
 * looked at rather than guessed from the filename — one of them is not the
 * garment its name claims. Keyed by the codex name, valued by the file on
 * disk, so the sheet stays the authority on what a piece is called.
 *
 * This table is a record of a mismatch, not a naming scheme. Filling the
 * sheet's own `Image` column (see `templates/armor.csv`, which now carries the
 * filenames) makes every one of these redundant, because a named file is read
 * from there first.
 */
const ALIASES = {
  // Singular file, plural piece.
  'Greater Runed Leggings': 'Greater Runed Legging.jpg',
  'Runed Robes': 'Runed Robe.jpg',
  // The art calls plate legs pants; the sheet calls this pair greaves. The
  // Full Plate tier is "Pants" in both, so only the Half Plate row differs.
  'Half Plate Greaves': 'Half Plate Pants.jpg',
  'Runed Leggings': 'Runed Pants.jpg',
  /* Not a spelling. `Leather Leggings.jpg` is a sleeveless leather **vest**,
     and the Light set's legs already have their own picture in `Leather
     Breeches.jpg`. The torso piece is the one with no file under its own name,
     the file is the garment that piece is, so this is where it goes — which is
     also why that piece's id is `leather-vest`. */
  'Leather Tunic': 'Leather Leggings.jpg',
};

/* ------------------------------------------------------------------- the sheet */

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim()));
}

/**
 * Printed name -> the file the sheet names for it, for every drop in `data/`.
 *
 * The Image column is how a sheet says which picture is which, and this reads
 * it so the answer can live at the source rather than in the alias table
 * below. A URL there is pull-card-art.mjs's business, not this script's, so
 * only bare filenames are taken.
 */
function namedFiles() {
  const named = new Map();
  if (!existsSync(DATA)) return named;

  for (const file of readdirSync(DATA).filter((f) => f.toLowerCase().endsWith('.csv'))) {
    const rows = parseCSV(readFileSync(path.join(DATA, file), 'utf8'));
    const head = rows[0].map((h) => h.trim());
    const nameAt = head.indexOf('Name');
    const imageAt = head.indexOf('Image');
    if (nameAt < 0 || imageAt < 0) continue;

    for (const row of rows.slice(1)) {
      const name = (row[nameAt] ?? '').trim();
      const image = (row[imageAt] ?? '').trim();
      if (name && image && !/^https?:\/\//i.test(image)) named.set(name.toLowerCase(), image);
    }
  }
  return named;
}

/* ------------------------------------------------------------------- the codex */

/** Printed name -> item id, so a folder never has to carry ids. */
const { ITEMS, CATEGORY_ORDER, itemCategory } = await import(
  path.join(ROOT, 'src/lib/items.js').replace(/\\/g, '/').replace(/^/, 'file:///')
);

const idByName = new Map(ITEMS.map((item) => [item.name.toLowerCase(), item.id]));

/* --------------------------------------------------------------- the folders */

/**
 * Every picture under a `data/` subfolder named for an inventory shelf, as
 * `{ folder, file, name }`.
 *
 * A folder is claimed by the shelf it fills — `data/Armor/` is the Armor shelf
 * — so dropping a `data/Weapons/` in beside it needs no line here, and a
 * folder that is not a shelf is left alone. That last part matters: `data/` is
 * where every drop lands, and a folder of *card* art (`data/Mycomancer/`) is
 * pull-card-art.mjs's to place, not this script's. Claiming every subfolder
 * would have this one reporting two talent cards as items it cannot find.
 */
const SHELVES = new Set(CATEGORY_ORDER.map(flatten));

function pictures() {
  if (!existsSync(DATA)) return [];

  return readdirSync(DATA, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && SHELVES.has(flatten(entry.name)))
    .flatMap((dir) =>
      readdirSync(path.join(DATA, dir.name))
        .filter((file) => IMAGE_FILE.test(file))
        .map((file) => ({
          folder: dir.name,
          file: path.join(DATA, dir.name, file),
          name: file.replace(IMAGE_FILE, ''),
        }))
    );
}

/**
 * The item a picture belongs to.
 *
 * Three ways, in order: the sheet's own Image column, the picture's filename,
 * then the alias table.
 */

/** file -> id, for the rows whose Image column names one. */
const idBySheetFile = new Map(
  [...namedFiles()]
    .map(([name, file]) => [bare(file), idByName.get(name)])
    .filter(([, id]) => id)
);

const idByFlatName = new Map([...idByName].map(([name, id]) => [flatten(name), id]));

const idByAliasFile = new Map(
  Object.entries(ALIASES)
    .map(([name, file]) => [bare(file), idByName.get(name.toLowerCase())])
    .filter(([, id]) => id)
);

function itemIdFor(name) {
  return (
    idBySheetFile.get(flatten(name)) ??
    idByFlatName.get(flatten(name)) ??
    idByAliasFile.get(flatten(name)) ??
    null
  );
}

/* ---------------------------------------------------------------------- main */

mkdirSync(OUT, { recursive: true });

const art = new Map();
const problems = [];
const folders = new Set();
let encoded = 0;
let skipped = 0;
let sourceBytes = 0;
let outBytes = 0;

for (const picture of pictures()) {
  folders.add(picture.folder);

  const id = itemIdFor(picture.name);
  if (!id) {
    problems.push(`${picture.folder}/${picture.name}: the codex has no item by that name`);
    continue;
  }

  const full = path.join(OUT, `${id}.webp`);
  const thumb = path.join(OUT, `${id}-thumb.webp`);

  if (existsSync(full) && existsSync(thumb) && !FORCE) {
    art.set(id, `/items/${id}.webp`);
    outBytes += statSync(full).size + statSync(thumb).size;
    skipped += 1;
    continue;
  }

  try {
    const source = readFileSync(picture.file);
    const meta = await sharp(source).metadata();

    /* Cut from the source both times rather than from the 720 copy. A card
       picture's thumbnail is cut from its local full-size copy because the
       original is a download away on postimg; here the original is right
       there, and 2048 -> 128 in one step keeps the detail that 2048 -> 720 ->
       128 would throw away twice. */
    const square = (width) =>
      sharp(source)
        .resize({ width, height: width, fit: 'cover', position: 'centre' })
        .webp({ quality: QUALITY })
        .toBuffer();

    const [big, small] = await Promise.all([square(WIDTH), square(THUMB_WIDTH)]);
    writeFileSync(full, big);
    writeFileSync(thumb, small);

    art.set(id, `/items/${id}.webp`);
    sourceBytes += source.length;
    outBytes += big.length + small.length;
    encoded += 1;
    console.log(
      `${id.padEnd(26)} ${meta.width}x${meta.height} ${(source.length / 1024 / 1024).toFixed(2)} MB ${meta.format}` +
        `  ->  ${WIDTH}px ${(big.length / 1024).toFixed(0)} KB + ${THUMB_WIDTH}px ${(small.length / 1024).toFixed(1)} KB`
    );
  } catch (err) {
    problems.push(`${picture.folder}/${picture.name}: ${err.message}`);
  }
}

/* An item on a shelf this run covered that still has no picture. Only the
   shelves that were actually scanned are reported, so a codex full of weapons
   does not read as 21 problems on an Armor-only drop. */
const scanned = new Set([...folders].map(flatten));
for (const item of ITEMS) {
  if (!scanned.has(flatten(itemCategory(item)))) continue;
  if (!art.has(item.id)) problems.push(`${item.name}: no picture in the folder`);
}

/* ------------------------------------------------------------ write the lookup */

const rows = [...art.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([id, src]) => `  '${id}': '${src}',`)
  .join('\n');

writeFileSync(
  path.join(ROOT, 'src/lib/itemArt.js'),
  `/**
 * Item art, keyed by item id.
 *
 * Generated by scripts/pull-item-art.mjs — do not edit by hand. Run \`npm run
 * art:items\` after adding a picture to a folder under data/.
 *
 * The pictures are the designer's, and they arrive as a folder of 2048x2048
 * JPEGs — 2.4 MB apiece. They are not served that way: the plates that draw
 * them are a 40px icon tile and a 360px item card, so the script cuts each one
 * to ${WIDTH}px and ${THUMB_WIDTH}px of WebP in public/items/ and the whole set
 * ships with the site for Cloudflare to serve from the edge.
 *
 * Two sizes, because there are two plates, and the small one is not a nicety:
 * a browser list is nine tiles at once and every block in the inventory draws
 * one, so the tile is the commonest picture on the sheet and the card is the
 * rarest.
 *
 * ------------------------------------------------------------------ the gate
 * Nothing here decides who *sees* a picture. Codex art is a paid capability
 * (see \`showsArt\` in tiers.js), checked at the moment of drawing in
 * useCodexArt.js. This file only says what the picture is.
 */

const ITEM_ART = {
${rows}
};

/** The art for one item, or null for an item that has none yet. */
export function artFor(id) {
  return ITEM_ART[id] ?? null;
}

/** The small square cut of it, for the ${THUMB_WIDTH / 2}px icon tiles. */
export function thumbFor(id) {
  const full = ITEM_ART[id];
  return full ? full.replace(/\\.webp$/, '-thumb.webp') : null;
}

/**
 * The same list of items with their art attached, for the codex to wrap its
 * own arrays in. An item that has no picture keeps \`art_url: null\` rather
 * than losing the field, so a reader never has to guess whether the absence is
 * missing art or a missing lookup.
 */
export function withArt(items) {
  return items.map((item) => ({
    ...item,
    art_url: artFor(item.id),
    art_thumb: thumbFor(item.id),
  }));
}
`,
  'utf8'
);

/* ------------------------------------------------------------------ the report */

console.log(
  `\n${encoded} encoded, ${skipped} already on disk, ${art.size} in the lookup` +
    ` (${[...folders].sort().join(', ') || 'no folders found'})`
);
if (encoded > 0) {
  console.log(
    `read ${(sourceBytes / 1024 / 1024).toFixed(1)} MB, wrote ${(outBytes / 1024 / 1024).toFixed(2)} MB` +
      ` (${(sourceBytes / outBytes).toFixed(0)}x smaller)`
  );
} else {
  console.log(`public/items is ${(outBytes / 1024 / 1024).toFixed(2)} MB`);
}
if (problems.length) console.log(`\n${problems.length} problem(s):\n` + problems.map((p) => `  ${p}`).join('\n'));
