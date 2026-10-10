/**
 * Uploaded pictures, proved. Covers the promises the picture system makes:
 * **the slot ladder says the same thing in tiers.js and in the schema, a stored
 * URL can be asked for any of the three shapes and comes back pointing at the
 * right file, a crop can never see past the edge of the picture, and no frame on
 * the site draws a stored portrait without asking for a shape.**
 *
 *   node scripts/check-images.mjs         report and exit 1 on any finding
 *   node scripts/check-images.mjs --list  print every assertion as it passes
 *
 * The risks here are not the sort a browser shows you. Three of them:
 *
 *   the ceiling    IMAGE_SLOTS is what the interface offers and
 *                  public.image_slots is what refuses the upload. Two tables
 *                  that can drift, and the drift is invisible until somebody
 *                  hits a wall the page said was not there.
 *   the addresses  every render site rewrites one filename into another. A
 *                  typo in that rewrite is a broken picture on a page nobody
 *                  opened this week.
 *   the clamp      a crop is three numbers, and the only thing standing between
 *                  them and a band of empty in a frame is the clamp. It is
 *                  arithmetic, so it can be checked rather than looked at.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANON_VIEW,
  IMAGE_BUCKET,
  MASTER_EDGE,
  OBJECT_BYTES_MAX,
  VIEWS,
  VIEW_IDS,
  imageIdOf,
  imageIdsIn,
  isVaultImage,
  metaPath,
  objectPath,
  viewUrl,
} from '../src/lib/imageViews.js';
import {
  coverWindow,
  cropRect,
  defaultCrop,
  defaultCrops,
  frameGeometry,
  normalizeCrops,
  panCrop,
  zoomCrop,
  zoomMax,
} from '../src/lib/imageCrop.js';
import { IMAGE_SLOTS, imageSlots } from '../src/lib/tiers.js';

const LIST = process.argv.includes('--list');
const findings = [];
const note = (what, said) => findings.push(`  ${what}\n    ${said}`);

function check(what, got, want) {
  const same = JSON.stringify(got) === JSON.stringify(want);
  if (LIST) console.log(`  ${same ? 'ok  ' : 'FAIL'} ${what}${same ? '' : `  got ${JSON.stringify(got)}`}`);
  if (!same) note(what, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

function section(title) {
  if (LIST) console.log(`\n===== ${title} =====`);
}

const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');

/* ==================================================== the ladder, said twice */

section('the slot ladder says the same thing in both places');
{
  const body = /create or replace function public\.image_slots[\s\S]*?\$\$;/.exec(sql)?.[0] ?? '';
  check('the schema has an image_slots function at all', body.length > 0, true);

  for (const [tier, slots] of Object.entries(IMAGE_SLOTS)) {
    const said = new RegExp(`when '${tier}'\\s+then (\\d+)`).exec(body);
    /* Free is the `else` branch rather than a case of its own, the way every
       other ladder in that file is written. */
    const want = said ? Number(said[1]) : Number(/else (\d+)/.exec(body)?.[1] ?? 0);
    check(`${tier} has the same ceiling in the schema`, want, slots);
  }

  check('the ladder never goes down', [
    IMAGE_SLOTS.free <= IMAGE_SLOTS.premium,
    IMAGE_SLOTS.premium <= IMAGE_SLOTS.friend,
    IMAGE_SLOTS.friend <= IMAGE_SLOTS.admin,
  ], [true, true, true]);
  check('a friend gets exactly what premium gets', IMAGE_SLOTS.friend, IMAGE_SLOTS.premium);
  check('an unknown tier reads as free', imageSlots('nonsense'), IMAGE_SLOTS.free);
  check('a legacy row reads as free', imageSlots('user'), IMAGE_SLOTS.free);
  check('every tier may upload something', Object.values(IMAGE_SLOTS).every((n) => n > 0), true);
}

/* ================================================== the bucket and its guards */

section('the bucket is what the encoder thinks it is');
{
  const bucket = /insert into storage\.buckets[\s\S]*?;/.exec(sql)?.[0] ?? '';
  check('the schema makes the bucket', bucket.includes(`'${IMAGE_BUCKET}'`), true);
  check('and it is public to read', /public,?\s*$|true,/.test(bucket) || bucket.includes('true'), true);

  const limit = Number(/file_size_limit[\s\S]*?(\d{5,})/.exec(bucket)?.[1] ?? 0);
  check('its per-object limit matches OBJECT_BYTES_MAX', limit, OBJECT_BYTES_MAX);
  check('it takes webp', bucket.includes("'image/webp'"), true);
  /* The receipt beside the three crops is JSON, so the bucket has to take it or
     a picture saves its files and loses its framing. */
  check('and the receipt', bucket.includes("'application/json'"), true);

  /* The ceiling is only real if the insert policy asks for it. */
  const insert = /create policy "portraits: owner insert"[\s\S]*?;/.exec(sql)?.[0] ?? '';
  check('the insert policy counts the shelf', insert.includes('public.image_room(name)'), true);
  check('and holds it to the caller’s own folder', insert.includes('public.owns_image_path(name)'), true);

  for (const kind of ['read', 'update', 'delete']) {
    const policy = new RegExp(`create policy "portraits: owner ${kind}"`).test(sql);
    check(`there is an owner ${kind} policy`, policy, true);
  }

  /* image_room excludes the picture being written from its own count, which is
     what makes the second, third and fourth object of one upload land. Checked
     as text because there is no Postgres here to run it in. */
  const room = /create or replace function public\.image_room[\s\S]*?\$\$;/.exec(sql)?.[0] ?? '';
  check('image_room counts pictures, not objects', room.includes('count(distinct'), true);
  check('and leaves out the one being written', room.includes('<>'), true);
  check('and it is the ladder it counts against', room.includes('public.image_slots(public.account_tier())'), true);
}

/* ========================================================== the three shapes */

section('the three shapes are the sizes they claim');
{
  check('there are three of them', VIEW_IDS, ['portrait', 'plate', 'face']);
  check('the canonical one is the portrait', CANON_VIEW, 'portrait');

  const ratios = Object.fromEntries(VIEWS.map((view) => [view.id, view.w / view.h]));
  check('the portrait is 9:16', ratios.portrait, 9 / 16);
  check('the plate is 4:3, the codex window', ratios.plate, 4 / 3);
  check('the face is square', ratios.face, 1);
  check('only the face is drawn round', VIEWS.filter((v) => v.round).map((v) => v.id), ['face']);

  /* The master exists to be re-cropped from, so it has to be at least as large
     as the biggest thing cut out of it. */
  const biggest = Math.max(...VIEWS.flatMap((view) => [view.w, view.h]));
  check('the master is big enough to re-crop from', MASTER_EDGE >= biggest, true);
  check('and every shape is an even number of pixels', VIEWS.every((v) => v.w % 2 === 0 && v.h % 2 === 0), true);
}

/* ============================================================ the addresses */

section('a stored URL can be asked for any shape');
{
  const uid = '11111111-2222-3333-4444-555555555555';
  const id = 'abc123def456';
  const base = 'https://project.supabase.co/storage/v1/object/public';
  const url = (view) => `${base}/${IMAGE_BUCKET}/${objectPath(uid, id, view)}`;

  check('the path shape is <uid>/<id>.<view>.webp', objectPath(uid, id, 'face'), `${uid}/${id}.face.webp`);
  check('and the receipt sits beside it', metaPath(uid, id), `${uid}/${id}.meta.json`);

  check('one of ours is recognised', isVaultImage(url('portrait')), true);
  check('the master is too', isVaultImage(url('master')), true);
  check('somebody else’s host is not', isVaultImage('https://i.imgur.com/x.png'), false);
  check('nor is a near miss', isVaultImage(`${base}/other/${uid}/${id}.face.webp`), false);
  check('nor is nothing', isVaultImage(null), false);

  for (const from of [...VIEW_IDS, 'master']) {
    for (const to of VIEW_IDS) {
      check(`${from} can be asked for the ${to}`, viewUrl(url(from), to), url(to));
    }
  }

  check('asking twice is asking once', viewUrl(viewUrl(url('portrait'), 'face'), 'plate'), url('plate'));
  check('an unknown shape falls back to the canonical one', viewUrl(url('face'), 'nonsense'), url(CANON_VIEW));
  check('a query string survives', viewUrl(`${url('portrait')}?v=2`, 'face'), `${url('face')}?v=2`);
  check('a foreign link is handed back untouched', viewUrl('https://i.imgur.com/x.png', 'face'), 'https://i.imgur.com/x.png');
  check('nothing is null rather than a broken src', viewUrl(''), null);
  check('and so is a non-string', viewUrl(42), null);

  check('the id comes back out', imageIdOf(url('plate')), id);
  check('and is null for a foreign link', imageIdOf('https://i.imgur.com/x.png'), null);

  /* The usage scan reads whole rows rather than named columns, because a
     picture can be inside a jsonb map three levels down. */
  const row = {
    portrait_url: url('portrait'),
    minions: { 'draconic-bond': { portrait_url: `${base}/${IMAGE_BUCKET}/${uid}/second.face.webp` } },
    forged: { 'forged-a1': { art: 'https://i.imgur.com/x.png' } },
  };
  check('every picture in a row is found', [...imageIdsIn(row)].sort(), [id, 'second'].sort());
  check('and a row with none finds none', [...imageIdsIn({ name: 'Thalira' })], []);
}

/* ================================================================= the crops */

section('a crop can never see past the edge of the picture');
{
  const sources = [
    { width: 4000, height: 3000 },
    { width: 900, height: 1600 },
    { width: 512, height: 512 },
    { width: 200, height: 1400 },
  ];

  let inside = true;
  let shaped = true;
  for (const source of sources) {
    for (const view of VIEWS) {
      const top = zoomMax(source, view);
      for (const zoom of [1, 1.5, top, top * 4, 0.2, NaN]) {
        for (const [x, y] of [[0.5, 0.5], [0, 0], [1, 1], [-3, 9], [0.5, 0]]) {
          const rect = cropRect(source, view, { zoom, x, y });
          if (
            rect.x < -0.0001 ||
            rect.y < -0.0001 ||
            rect.x + rect.w > source.width + 0.0001 ||
            rect.y + rect.h > source.height + 0.0001
          ) {
            inside = false;
          }
          if (Math.abs(rect.w / rect.h - view.w / view.h) > 0.0001) shaped = false;
        }
      }
    }
  }
  check('no crop escapes its picture', inside, true);
  check('and every crop is the frame’s own shape', shaped, true);

  const wide = { width: 4000, height: 3000 };
  const portrait = VIEWS[0];
  check('zoom 1 uses the whole of the short edge', coverWindow(wide, portrait).h, 3000);
  check('and only as much of the long one as fits', coverWindow(wide, portrait).w, 3000 * (9 / 16));

  check('the default is top anchored', cropRect(wide, portrait, defaultCrop()).y, 0);
  check('and centred across', cropRect(wide, portrait, defaultCrop()).cx, 0.5);
  check('there is a default per shape', Object.keys(defaultCrops()), VIEW_IDS);

  /* A drag that runs off the end stops rather than pulling in empty. */
  const dragged = panCrop(wide, portrait, defaultCrop(), 0, 9000, 300);
  check('dragging past the top stops at the top', cropRect(wide, portrait, dragged).y, 0);
  const far = panCrop(wide, portrait, defaultCrop(), -9000, 0, 300);
  const farRect = cropRect(wide, portrait, far);
  check('and past the side stops at the side', Math.round(farRect.x + farRect.w), wide.width);

  check('zoom never goes below the frame', zoomCrop(wide, portrait, defaultCrop(), 0.1).zoom, 1);
  check('and never past what the pixels can pay for', zoomCrop(wide, portrait, defaultCrop(), 99).zoom, zoomMax(wide, portrait));
  check('a picture smaller than the shape cannot zoom', zoomMax({ width: 200, height: 356 }, portrait), 1);

  /* The preview draws the picture at a size and an offset. Whatever the crop,
     the frame has to end up wholly covered or there is a band of nothing in it. */
  let covered = true;
  for (const source of sources) {
    for (const view of VIEWS) {
      const frameW = 320;
      const frameH = frameW / (view.w / view.h);
      for (const crop of [defaultCrop(), { zoom: 2.2, x: 0.2, y: 0.9 }, { zoom: 1, x: 1, y: 1 }]) {
        const box = frameGeometry(source, view, crop, frameW);
        if (
          box.left > 0.0001 ||
          box.top > 0.0001 ||
          box.left + box.width < frameW - 0.0001 ||
          box.top + box.height < frameH - 0.0001
        ) {
          covered = false;
        }
      }
    }
  }
  check('the preview always fills its frame', covered, true);

  /* meta.json is a file a browser wrote, so it is repaired rather than trusted. */
  check('junk crops come back usable', normalizeCrops('not json'), defaultCrops());
  check('so does half a set', Object.keys(normalizeCrops({ face: { zoom: 3 } })), VIEW_IDS);
  check('and a zoom below 1 is lifted', normalizeCrops({ face: { zoom: 0.2 } }).face.zoom, 1);
  check('and an infinite one survives the read', Number.isFinite(normalizeCrops({ face: { zoom: 'x' } }).face.zoom), true);
}

/* ================================================= nothing draws one raw */

section('no frame draws a stored portrait without asking for a shape');
{
  const roots = [fileURLToPath(new URL('../src', import.meta.url))];
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.jsx$/.test(path)) files.push(path);
    }
  };
  for (const root of roots) walk(root);

  const raw = [];
  const pasted = [];
  for (const path of files) {
    const lines = readFileSync(path, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      const at = `${path.split(/[\\/]/).slice(-2).join('/')}:${index + 1}`;

      /* A picture being drawn: an `src` or a CSS background off a stored
         column. Either it went through viewUrl or it is showing the wrong crop
         in at least one of the three frames. */
      const draws = /(src=\{|backgroundImage)/.test(line);
      const column = /\b(portrait_url|thumbnail_url|\.portrait\b|art_url)/.test(line);
      if (draws && column && !/viewUrl\(|codexArt\(/.test(line)) raw.push(at);

      /* And the field that used to be here. Jules, 2026-09-08: the paste-a-link
         input is gone everywhere, so an input bound to one of these columns is
         a regression rather than a feature. */
      if (/<input/.test(line) || /className="form-input"/.test(line)) {
        const near = lines.slice(index, index + 6).join(' ');
        if (/value=\{[^}]*(portrait_url|thumbnail_url)/.test(near)) pasted.push(at);
      }
    });
  }

  check('every frame asks for a shape', raw, []);
  check('and nothing asks for a URL to be typed in', pasted, []);
}

/* ------------------------------------------------------------------ report */

if (findings.length === 0) {
  console.log(
    `pictures: ${VIEWS.length} shapes, ${IMAGE_SLOTS.free} free and ${IMAGE_SLOTS.premium} paid, and every crop stays inside its picture`
  );
  process.exit(0);
}

console.log(`\npictures: ${findings.length} ${findings.length === 1 ? 'finding' : 'findings'}\n`);
for (const finding of findings) console.log(finding);
process.exit(LIST ? 0 : 1);
