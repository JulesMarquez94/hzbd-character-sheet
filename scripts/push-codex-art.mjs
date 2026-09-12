/**
 * Put the codex art in the bucket.
 *
 *   node scripts/push-codex-art.mjs           upload what has changed
 *   node scripts/push-codex-art.mjs --dry     say what would go, send nothing
 *   node scripts/push-codex-art.mjs --force   upload everything again
 *   node scripts/push-codex-art.mjs --prune   also delete what no local file backs
 *   node scripts/push-codex-art.mjs --list    name every file as it goes
 *
 * The pictures the codex draws are AI generated placeholder art made for one
 * table. They used to ship inside the repository, which is public on GitHub and
 * served from an unauthenticated origin, so the tier check decided whether a
 * plate was drawn while the file behind it stayed readable by anybody. This
 * moves them into a private bucket where a policy decides instead. The naming
 * law is src/lib/codexArt.js and the policy is the CODEX ART section of
 * supabase/schema.sql.
 *
 * ------------------------------------------------------------------- the key
 * This writes with the **service role key**, which bypasses every policy in the
 * database. It has to: the bucket has no insert policy at all, deliberately, so
 * that no browser can write to it whatever tier it holds.
 *
 * The key is read from `.env.art`, which `.gitignore` already covers under
 * `.env.*`. It must never be committed, never be given a VITE_ prefix, and never
 * reach the browser bundle. Vite bakes every VITE_ variable into the build, so a
 * VITE_SUPABASE_SERVICE_ROLE_KEY would publish the keys to the kingdom on the
 * next deploy.
 *
 * ---------------------------------------------------------------- the receipt
 * `.codex-art.json` records the sha256 of every object as it was uploaded, so a
 * second run sends only what actually changed. It is local state and git-ignored:
 * delete it and the next run re-uploads everything, which costs time and nothing
 * else. `--force` does the same without deleting it.
 *
 * The receipt is written **after** each upload rather than at the end, so a run
 * interrupted halfway does not lose the record of what already landed.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

import {
  CODEX_BUCKET,
  CONTENT_TYPE,
  SETS,
  objectPath,
  parseLocalName,
  parseObjectPath,
} from '../src/lib/codexArt.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const RECEIPT = path.join(ROOT, '.codex-art.json');

const argv = new Set(process.argv.slice(2));
const DRY = argv.has('--dry');
const FORCE = argv.has('--force');
const PRUNE = argv.has('--prune');
const LIST = argv.has('--list');

/** How many uploads are in the air at once. Six is quick over a home connection
    and gentle enough that Storage never starts refusing. */
const LANES = 6;

/**
 * An hour.
 *
 * A signed URL is minted fresh each session, so a redraw reaches everybody at
 * their next sign-in whatever this says. This only decides how long a browser
 * that already holds one keeps showing the old pixels, and an hour is short
 * enough that "I redrew it and it looks the same" resolves itself while somebody
 * is still looking at the page.
 */
const CACHE = '3600';

/* ------------------------------------------------------------------- the env */

/** A .env file as a plain object. Good enough for KEY=VALUE and nothing else,
    which is all either of these files holds. */
function readEnv(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const at = trimmed.indexOf('=');
    if (at < 1) continue;
    out[trimmed.slice(0, at).trim()] = trimmed
      .slice(at + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = {
  ...readEnv(path.join(ROOT, '.env.local')),
  ...readEnv(path.join(ROOT, '.env.art')),
  ...process.env,
};

const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * The client, demanded only when something is actually about to be sent.
 *
 * A plain `--dry` never touches the network, so it runs in a fresh checkout with
 * no credentials at all. That is the run worth having first: it proves every
 * local filename maps to the bucket path you expect before anybody goes looking
 * for a service role key.
 */
function storage() {
  if (!url || !key) {
    console.error(
      [
        'Missing credentials.',
        '',
        'Create .env.art in the repository root (git-ignored) holding:',
        '',
        '  SUPABASE_URL=https://<your-project-ref>.supabase.co',
        '  SUPABASE_SERVICE_ROLE_KEY=<the service_role key>',
        '',
        'Both are on the Supabase dashboard under Project Settings, API.',
        'The service role key bypasses every policy. Never commit it and never',
        'give it a VITE_ prefix: Vite bakes those into the browser bundle.',
        '',
        'To see what would be sent without any of this: --dry',
      ].join('\n')
    );
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } }).storage.from(CODEX_BUCKET);
}

/* --------------------------------------------------------------- the receipt */

const receipt = existsSync(RECEIPT) ? JSON.parse(readFileSync(RECEIPT, 'utf8')) : {};

function saveReceipt() {
  if (DRY) return;
  writeFileSync(RECEIPT, `${JSON.stringify(receipt, null, 2)}\n`);
}

/* ------------------------------------------------------------ what is on disk */

/** Every picture under public/, as { object, file, hash, type }. */
function onDisk() {
  const found = [];
  const skipped = [];

  for (const set of SETS) {
    const dir = path.join(PUBLIC, set.id);
    if (!existsSync(dir)) continue;

    for (const filename of readdirSync(dir).sort()) {
      const parsed = parseLocalName(set.id, filename);
      if (!parsed) {
        skipped.push(`${set.id}/${filename}`);
        continue;
      }
      const file = path.join(dir, filename);
      const bytes = readFileSync(file);
      found.push({
        object: objectPath(parsed.set, parsed.id, parsed.part),
        file,
        bytes,
        hash: createHash('sha256').update(bytes).digest('hex'),
        type: CONTENT_TYPE[parsed.ext],
      });
    }
  }

  return { found, skipped };
}

/* ------------------------------------------------------------------ the work */

async function inLanes(items, worker) {
  let next = 0;
  const runners = Array.from({ length: Math.min(LANES, items.length) }, async () => {
    for (;;) {
      const mine = next++;
      if (mine >= items.length) return;
      await worker(items[mine], mine);
    }
  });
  await Promise.all(runners);
}

async function main() {
  const { found, skipped } = onDisk();

  if (!found.length) {
    console.log(
      'Nothing to upload: no pictures under public/cards, items, lineages, talents or backgrounds.'
    );
    return;
  }

  const due = FORCE ? found : found.filter((one) => receipt[one.object] !== one.hash);
  const bytes = due.reduce((sum, one) => sum + one.bytes.length, 0);

  console.log(`${found.length} pictures on disk across ${SETS.length} sets.`);
  if (skipped.length) {
    console.log(`${skipped.length} files ignored (not a name this set uses):`);
    for (const name of skipped.slice(0, 10)) console.log(`  ${name}`);
    if (skipped.length > 10) console.log(`  ... and ${skipped.length - 10} more`);
  }
  console.log(
    due.length
      ? `${due.length} to upload, ${(bytes / 1024 / 1024).toFixed(2)} MB.${DRY ? ' (dry run)' : ''}`
      : 'Everything already in the bucket is current.'
  );

  let done = 0;
  const failures = [];

  /* Asked for once, so a run that both uploads and prunes does not build two
     clients, and a plain --dry builds none. */
  const store = due.length || PRUNE ? (DRY && !PRUNE ? null : storage()) : null;

  if (due.length && !DRY) {
    await inLanes(due, async (one) => {
      const { error } = await store.upload(one.object, one.bytes, {
        upsert: true,
        contentType: one.type,
        cacheControl: CACHE,
      });
      if (error) {
        failures.push({ object: one.object, why: error.message });
        return;
      }
      receipt[one.object] = one.hash;
      done += 1;
      saveReceipt();
      if (LIST) console.log(`  up  ${one.object}`);
      else if (done % 50 === 0) console.log(`  ${done}/${due.length}`);
    });
  } else if (due.length && DRY && LIST) {
    for (const one of due) console.log(`  would upload  ${one.object}`);
  }

  /* ------------------------------------------------------------- the prune */

  if (PRUNE) {
    const mine = new Set(found.map((one) => one.object));
    const stale = [];
    const strangers = [];

    for (const set of SETS) {
      let offset = 0;
      for (;;) {
        const { data, error } = await store.list(set.id, { limit: 500, offset });
        if (error) {
          failures.push({ object: `${set.id}/`, why: `could not list: ${error.message}` });
          break;
        }
        for (const row of data ?? []) {
          const object = `${set.id}/${row.name}`;
          if (mine.has(object)) continue;
          if (parseObjectPath(object)) stale.push(object);
          else strangers.push(object);
        }
        if (!data || data.length < 500) break;
        offset += 500;
      }
    }

    if (strangers.length) {
      console.log(`\n${strangers.length} objects in the bucket this script does not recognise.`);
      console.log('Left alone. Look at them before deleting anything by hand:');
      for (const name of strangers.slice(0, 20)) console.log(`  ${name}`);
    }

    if (!stale.length) {
      console.log('\nNothing to prune.');
    } else if (DRY) {
      console.log(`\n${stale.length} objects would be pruned:`);
      for (const name of stale) console.log(`  would delete  ${name}`);
    } else {
      const { error } = await store.remove(stale);
      if (error) failures.push({ object: 'prune', why: error.message });
      else {
        for (const name of stale) delete receipt[name];
        saveReceipt();
        console.log(`\n${stale.length} stale objects deleted.`);
      }
    }
  }

  /* ------------------------------------------------------------- the verdict */

  if (failures.length) {
    console.error(`\n${failures.length} failed:`);
    for (const bad of failures.slice(0, 20)) console.error(`  ${bad.object}\n    ${bad.why}`);
    if (failures.some((bad) => /bucket not found/i.test(bad.why))) {
      console.error(
        [
          '',
          `The bucket "${CODEX_BUCKET}" does not exist yet.`,
          'Run the CODEX ART section of supabase/schema.sql against the project first.',
        ].join('\n')
      );
    }
    process.exit(1);
  }

  if (!DRY && done) console.log(`\n${done} uploaded.`);
  console.log('Done.');
}

if (!existsSync(PUBLIC)) {
  mkdirSync(PUBLIC, { recursive: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
