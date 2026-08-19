/**
 * Pull the card art named by the design sheets, optimise it, and rewrite the
 * lookup the codex reads.
 *
 *     npm run art
 *
 * ---------------------------------------------------------------- why it exists
 * The sheets point at postimg, and pointing the site straight at postimg was
 * costing readers 26.2 MB across 34 pictures — several of them 3 MB PNGs at
 * 1280x956 — served at 200 to 450 KB/s by a host that occasionally stalls for
 * over two minutes on a single file. The card plate is 360x270 CSS pixels, so
 * none of that size was ever reaching a reader's eye.
 *
 * This downloads each one once, resizes it to what the plate can actually show
 * at 2x, writes WebP into public/cards/, and points the codex at the local
 * copy. Cloudflare then serves them from the edge, cached, beside the rest of
 * the site.
 *
 * ------------------------------------------------------------------ the flow
 *   1. read the Image column out of the CSVs in data/
 *   2. a postimg *page* link serves HTML, so follow it to the og:image
 *   3. download, resize, encode
 *   4. rewrite src/lib/cardArt.js
 *
 * Re-runnable and idempotent: a picture already on disk is skipped unless
 * --force is passed, so adding one new spell costs one download rather than
 * thirty-four.
 *
 * ------------------------------------------------------------------- the cost
 * Committing the WebP files is deliberate. They are the product's art, they are
 * ~47 KB each, and having them in the repo is what lets Cloudflare serve them:
 * a build cannot reach out to postimg. The originals stay on postimg, and this
 * script is how they get here.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'public', 'cards');

/* The plate on a dealt card is 360x270 CSS pixels and `background-size: cover`.
   720 is that at 2x, which is as much as any screen can show of it. Quality 78
   is where the card art stops getting visibly better and the file keeps
   growing.

   A brief's plate is 92px wide, and 58px in a list. Sending it the same 720px
   picture is 47 KB to draw 92 pixels, and a wall of two dozen briefs is the
   commonest thing on the sheet — so every card also gets a thumbnail, cut from
   the full one rather than downloaded twice. */
const WIDTH = 720;
const THUMB_WIDTH = 200;
const QUALITY = 78;

const FORCE = process.argv.includes('--force');

/* ----------------------------------------------------------------- the sheets */

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

/** Every sheet drop in data/, as objects keyed by their header row. */
function sheets() {
  if (!existsSync(DATA)) return [];
  return readdirSync(DATA)
    .filter((f) => f.toLowerCase().endsWith('.csv'))
    .flatMap((file) => {
      const rows = parseCSV(readFileSync(path.join(DATA, file), 'utf8'));
      const head = rows[0].map((h) => h.trim());
      return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
    });
}

/* ------------------------------------------------------------------ the codex */

/** Printed name -> card id, so the sheet never has to carry ids it does not have. */
async function cardIds() {
  const { SPELLS } = await import(path.join(ROOT, 'src/lib/spells.js').replace(/\\/g, '/').replace(/^/, 'file:///'));
  const { BASIC_ACTIONS } = await import(path.join(ROOT, 'src/lib/actions.js').replace(/\\/g, '/').replace(/^/, 'file:///'));
  return new Map([...SPELLS, ...BASIC_ACTIONS].map((c) => [c.name.toLowerCase(), c.id]));
}

/* -------------------------------------------------------------------- postimg */

/** A postimg page URL serves HTML; the picture itself is in its og:image tag. */
async function directLink(url) {
  if (/^https:\/\/i\.postimg\.cc\//.test(url)) return url;
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`page returned HTTP ${res.status}`);
  const html = await res.text();
  const og = /<meta property="og:image" content="([^"]+)"/i.exec(html);
  if (og) return og[1];
  const any = /https:\/\/i\.postimg\.cc\/[A-Za-z0-9]+\/[^"'\s)]+\.(?:png|jpg|jpeg|webp|gif)/i.exec(html);
  if (any) return any[0];
  throw new Error('no image on the page');
}

/** postimg stalls now and then, so a slow file is retried rather than lost. */
async function download(url, tries = 3) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt >= tries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

/* ---------------------------------------------------------------------- main */

const ids = await cardIds();
mkdirSync(OUT, { recursive: true });

const art = new Map();
const problems = [];
let fetched = 0;
let skipped = 0;
let sourceBytes = 0;
let outBytes = 0;

for (const row of sheets()) {
  const name = row.Name;
  const link = row.Image;
  if (!name) continue;

  const id = ids.get(name.toLowerCase());

  /* A row this importer does not own: nothing in the card codex by that name,
     and no picture asked for either. A Talent Set sheet's Overview row is one of
     those, and warning about it on every run would only train the reader to skip
     the list. A row with a *link* and no card still warns, because that is how a
     renamed spell announces itself. */
  if (!id && !link) continue;

  if (!id) { problems.push(`${name}: the codex has no card by that name`); continue; }
  if (!link) { problems.push(`${name}: no link in the Image column`); continue; }

  const file = path.join(OUT, `${id}.webp`);

  if (existsSync(file) && !FORCE) {
    art.set(id, `/cards/${id}.webp`);
    outBytes += statSync(file).size;
    skipped += 1;
    continue;
  }

  try {
    const buf = await download(await directLink(link));
    const image = sharp(buf);
    const meta = await image.metadata();
    const webp = await image.resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
    writeFileSync(file, webp);

    art.set(id, `/cards/${id}.webp`);
    sourceBytes += buf.length;
    outBytes += webp.length;
    fetched += 1;
    console.log(
      `${id.padEnd(20)} ${meta.width}x${meta.height} ${(buf.length / 1024 / 1024).toFixed(2)} MB ${meta.format}` +
        `  ->  ${WIDTH}px webp ${(webp.length / 1024).toFixed(0)} KB`
    );
  } catch (err) {
    problems.push(`${name}: ${err.message}`);
  }
}

/* ---------------------------------------------------------------- thumbnails */

/* Cut from the local full-size copy rather than downloaded again: at 200px for
   a 92px plate there is nothing left for the original to give that the 720px
   WebP has already lost. */
let thumbBytes = 0;
let thumbsMade = 0;
for (const id of art.keys()) {
  const full = path.join(OUT, `${id}.webp`);
  const thumb = path.join(OUT, `${id}-thumb.webp`);
  if (existsSync(thumb) && !FORCE) { thumbBytes += statSync(thumb).size; continue; }
  const buf = await sharp(full).resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
  writeFileSync(thumb, buf);
  thumbBytes += buf.length;
  thumbsMade += 1;
}

/* ------------------------------------------------------------ write the lookup */

const rows = [...art.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([id, src]) => `  '${id}': '${src}',`)
  .join('\n');

writeFileSync(
  path.join(ROOT, 'src/lib/cardArt.js'),
  `/**
 * Card art, keyed by card id.
 *
 * Generated by scripts/pull-card-art.mjs — do not edit by hand. Run \`npm run
 * art\` after changing an Image column in the sheets.
 *
 * The pictures are the designer's, and the sheets point at postimg. They are
 * not served from postimg: the originals are up to 3 MB at 1280x956, arriving
 * at 200-450 KB/s from a host that sometimes stalls for minutes, and the plate
 * that shows them is 360x270. The script resizes each one to ${WIDTH}px of WebP
 * and puts it in public/cards/, so they ship with the site and Cloudflare
 * serves them from the edge.
 *
 * Two sizes, because there are two plates. A dealt card gets the \${WIDTH}px
 * one; a brief's plate is 92 CSS pixels wide and gets the \${THUMB_WIDTH}px cut
 * of it, which matters because a wall of two dozen briefs is the commonest
 * sight on the sheet.
 *
 * ------------------------------------------------------------------ the gate
 * Nothing here decides who *sees* a picture. Card art is a paid capability
 * (see \`showsArt\` in tiers.js), checked at the moment of drawing in
 * useCodexArt.js. This file only says what the picture is.
 */

const CARD_ART = {
${rows}
};

/** The art for one card, or null for a card that has none yet. */
export function artFor(id) {
  return CARD_ART[id] ?? null;
}

/** The small cut of it, for the 92px plate a brief draws. */
export function thumbFor(id) {
  const full = CARD_ART[id];
  return full ? full.replace(/\\.webp$/, '-thumb.webp') : null;
}

/**
 * The same list of cards with their art attached, for the codex modules to
 * wrap their own arrays in. A card that has no picture keeps \`art_url: null\`
 * rather than losing the field, so a reader never has to guess whether the
 * absence is missing art or a missing lookup.
 */
export function withArt(cards) {
  return cards.map((card) => ({
    ...card,
    art_url: artFor(card.id),
    art_thumb: thumbFor(card.id),
  }));
}
`,
  'utf8'
);

/* ------------------------------------------------------------------ the report */

console.log(`\n${fetched} fetched, ${skipped} already on disk, ${art.size} in the lookup`);
console.log(`${thumbsMade} thumbnail(s) cut, ${(thumbBytes / 1024).toFixed(0)} KB across ${art.size}`);
if (fetched > 0) {
  console.log(
    `downloaded ${(sourceBytes / 1024 / 1024).toFixed(1)} MB, wrote ${((outBytes + thumbBytes) / 1024 / 1024).toFixed(2)} MB` +
      ` (${(sourceBytes / (outBytes + thumbBytes)).toFixed(0)}x smaller)`
  );
} else {
  console.log(`public/cards is ${((outBytes + thumbBytes) / 1024 / 1024).toFixed(2)} MB`);
}
if (problems.length) console.log(`\n${problems.length} problem(s):\n` + problems.map((p) => `  ${p}`).join('\n'));
