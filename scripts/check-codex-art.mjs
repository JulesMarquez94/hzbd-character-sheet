/**
 * The codex art, proved. Covers the promises the two-home arrangement makes:
 * **every `codex:` reference in the source obeys the naming law, every one of
 * them names an object that was really uploaded, and nothing is uploaded that
 * nothing points at.**
 *
 *   node scripts/check-codex-art.mjs           report and exit 1 on any finding
 *   node scripts/check-codex-art.mjs --list    print every assertion as it passes
 *
 * The risks here are not the sort a browser shows you. A reference with a typo
 * in it is a plate that draws empty, which is also exactly what a plate does for
 * a free account and for a card that has no picture yet. Three ways to be wrong
 * and one appearance, so the difference has to be checked rather than looked at:
 *
 *   the law      `cards/heal.full.webp` is three dot-separated pieces after the
 *                set. A reference that does not parse can never be signed, and
 *                nothing at runtime will ever say so out loud.
 *   the object   a reference to a picture that was never uploaded. Renaming a
 *                card in the sheets and re-pulling does this, because the old
 *                object stays in the bucket under the old name and the new
 *                reference points at nothing.
 *   the orphan   an object in the bucket nothing references. Harmless, and
 *                worth knowing about: it is bytes being kept for a picture no
 *                page can reach, usually a card that was renamed or cut.
 *
 * ------------------------------------------------------------------ the record
 * What is *in* the bucket is read from `.codex-art.json`, the receipt
 * scripts/push-codex-art.mjs writes as it uploads. That is deliberate: it keeps
 * this check offline and keeps it working after public/ is deleted, which is the
 * whole point of the exercise. The receipt can be wrong in one direction only,
 * by naming something a later hand-delete removed, and `art:push --prune --dry`
 * is the command that compares it against the live bucket.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CODEX_SCHEME, SETS, SET_IDS, objectPath, parseObjectPath } from '../src/lib/codexArt.js';

const HAS_THUMB = new Set(SETS.filter((set) => set.parts.includes('thumb')).map((set) => set.id));

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const RECEIPT = path.join(ROOT, '.codex-art.json');

const LIST = process.argv.includes('--list');

const findings = [];
const passes = [];

const fail = (rule, detail) => findings.push({ rule, detail });
const pass = (what) => passes.push(what);

/* ------------------------------------------------------- every reference found */

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Every `codex:` reference in the source, with where it was written. */
function references() {
  const found = new Map();
  const pattern = new RegExp(`${CODEX_SCHEME}([A-Za-z0-9_\\-./]+)`, 'g');

  for (const file of walk(SRC)) {
    const text = readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const match of line.matchAll(pattern)) {
        const at = `${path.relative(ROOT, file).replace(/\\/g, '/')}:${index + 1}`;
        if (!found.has(match[1])) found.set(match[1], at);
      }
    });
  }
  return found;
}

const refs = references();

/**
 * A manifest holds only the big cut. `thumbFor` in cardArt.js and itemArt.js
 * derives the small one from it at the moment of drawing, so a `.full`
 * reference is a reference to its `.thumb` sibling as well and both have to be
 * in the bucket. Mirrored here rather than inferred, because a brief drawing an
 * empty plate looks exactly like a card that has no picture.
 */
function withDerivedThumbs(found) {
  const all = new Map(found);
  for (const [ref, at] of found) {
    const parsed = parseObjectPath(ref);
    if (!parsed || parsed.part !== 'full' || !HAS_THUMB.has(parsed.set)) continue;
    const thumb = objectPath(parsed.set, parsed.id, 'thumb');
    if (!all.has(thumb)) all.set(thumb, `${at} (via thumbFor)`);
  }
  return all;
}

const wanted = withDerivedThumbs(refs);

if (!refs.size) {
  fail(
    'no references',
    'Not one codex: reference anywhere in src/. Either the manifests were reverted to public/ paths, or this check is looking in the wrong place.'
  );
}

/* --------------------------------------------------------------------- the law */

for (const [ref, at] of refs) {
  const parsed = parseObjectPath(ref);
  if (!parsed) {
    fail('the law', `${at}\n    codex:${ref}\n    is not <set>/<id>.<part>.<ext>. Sets: ${SET_IDS.join(', ')}`);
  } else if (LIST) {
    pass(`law   codex:${ref}`);
  }
}

/* ------------------------------------------------------------------ the object */

if (!existsSync(RECEIPT)) {
  console.log(
    [
      'No .codex-art.json, so what is in the bucket is unknown and only the',
      'naming law could be checked. Run `npm run art:push` to create it.',
      '',
    ].join('\n')
  );
} else {
  const uploaded = new Set(Object.keys(JSON.parse(readFileSync(RECEIPT, 'utf8'))));

  for (const [ref, at] of wanted) {
    if (!parseObjectPath(ref)) continue;
    if (uploaded.has(ref)) {
      if (LIST) pass(`object  codex:${ref}`);
    } else {
      fail(
        'the object',
        `${at}\n    codex:${ref}\n    was never uploaded. Run \`npm run art:push\`, or fix the reference.`
      );
    }
  }

  /* ----------------------------------------------------------------- the orphan */

  const orphans = [...uploaded].filter((object) => !wanted.has(object));
  if (orphans.length) {
    console.log(`\n${orphans.length} objects in the bucket that nothing references:`);
    for (const object of orphans.slice(0, 20)) console.log(`  ${object}`);
    if (orphans.length > 20) console.log(`  ... and ${orphans.length - 20} more`);
    console.log('Not a failure. `npm run art:push -- --prune` removes them once');
    console.log('the pictures behind them are gone from public/ too.');
  }
}

/* ------------------------------------------------------------------ the verdict */

if (LIST) for (const line of passes) console.log(`  ok  ${line}`);

if (findings.length) {
  console.error(`\ncodex art: ${findings.length} findings\n`);
  for (const { rule, detail } of findings) console.error(`  [${rule}] ${detail}\n`);
  process.exit(1);
}

console.log(
  `\ncodex art: ${refs.size} references (${wanted.size} objects once thumbs are counted), every one lawful and uploaded`
);
