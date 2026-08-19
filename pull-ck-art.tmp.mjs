/* Pull the Cauldron Keeper ability art ahead of the codex module existing.
   Same sizes, quality and destination as scripts/pull-card-art.mjs, so once the
   module lands `npm run art` finds every file already on disk and skips it. */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const WIDTH = 720;
const THUMB_WIDTH = 200;
const QUALITY = 78;
const OUT = 'public/cards';

const drops = JSON.parse(
  readFileSync(
    'C:/Users/jules/AppData/Local/Temp/claude/C--Users-jules-Documents-hzbd-character/89379dd8-87f7-4022-97ed-35f5fdf82243/scratchpad/drops.json',
    'utf8'
  )
);

const slug = (n) => n.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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

mkdirSync(OUT, { recursive: true });

let fetched = 0;
let skipped = 0;
let sourceBytes = 0;
let outBytes = 0;
const problems = [];

for (const row of drops.ability) {
  const id = slug(row.name);
  if (!row.image) {
    problems.push(`${row.name}: no link in the Image column`);
    continue;
  }

  const file = path.join(OUT, `${id}.webp`);
  if (existsSync(file)) {
    skipped += 1;
    outBytes += statSync(file).size;
  } else {
    try {
      const buf = await download(await directLink(row.image));
      const image = sharp(buf);
      const meta = await image.metadata();
      const webp = await image
        .resize({ width: WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
      writeFileSync(file, webp);
      sourceBytes += buf.length;
      outBytes += webp.length;
      fetched += 1;
      console.log(
        `${id.padEnd(24)} ${meta.width}x${meta.height} ${(buf.length / 1024 / 1024).toFixed(2)} MB ${meta.format}` +
          `  ->  ${(webp.length / 1024).toFixed(0)} KB`
      );
    } catch (err) {
      problems.push(`${row.name}: ${err.message}`);
      continue;
    }
  }

  const thumb = path.join(OUT, `${id}-thumb.webp`);
  if (!existsSync(thumb)) {
    const buf = await sharp(file)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    writeFileSync(thumb, buf);
    outBytes += buf.length;
  }
}

console.log(
  `\n${fetched} fetched, ${skipped} already on disk, ${(sourceBytes / 1024 / 1024).toFixed(2)} MB in -> ${(outBytes / 1024).toFixed(0)} KB out`
);
if (problems.length) {
  console.log('\nproblems:');
  for (const p of problems) console.log(' -', p);
}
