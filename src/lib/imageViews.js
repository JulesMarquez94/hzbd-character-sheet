/**
 * The three shapes a picture is kept in, and how to ask a stored URL for one.
 *
 * A player uploads one picture of one character and the site draws it in three
 * places that disagree about what shape a picture is: a tall card on the
 * dashboard, a wide plate on the sheet, and a face the size of a fingernail in
 * the log. No single file survives all three. A 9:16 portrait in a 24px circle
 * is a stripe of shirt; a square face in the dashboard's tall frame is two bands
 * of empty.
 *
 * So an upload becomes four files rather than one: a capped `master` nothing
 * draws, and one baked crop per shape, each cropped where the player put it.
 * They sit beside each other under one id:
 *
 *   <user id>/<image id>.master.webp     the source, kept only to re-crop from
 *   <user id>/<image id>.portrait.webp   9:16
 *   <user id>/<image id>.plate.webp      4:3
 *   <user id>/<image id>.face.webp       1:1
 *   <user id>/<image id>.meta.json       where the three crops were left
 *
 * ------------------------------------------------------------------ one column
 * Nothing in the database gained a column for this. A sheet still holds one
 * `portrait_url`, a creature one, a campaign one, and each of them holds the
 * `portrait` URL as the canonical reference. Every place that draws one calls
 * `viewUrl(url, 'face')` (or 'plate') and gets the sibling file, because the
 * only difference between the four names is one path segment.
 *
 * That is the whole trick, and it is why it is a pure function in its own file:
 * it is called from a dozen render sites, it has no state, and it must never
 * drag the uploader's canvas work into a bundle that only wanted to draw a row.
 *
 * ------------------------------------------------------- somebody else's link
 * A URL this file does not recognise is handed back exactly as it came. Sheets
 * written before the uploader existed hold links to image hosts, and those still
 * draw: the frame crops them with `object-fit` the way it always did. `viewUrl`
 * is therefore safe to wrap around any picture on the site, ours or not, which
 * is what makes it possible to apply it everywhere at once.
 *
 * It is also idempotent. `viewUrl(viewUrl(u, 'face'), 'plate')` is
 * `viewUrl(u, 'plate')`, so a URL that was copied into a campaign log row a
 * month ago as one view is still asked for the view the log wants today, and old
 * rows come out right without a migration.
 */

/** The one bucket. Public to read, because a sheet is public to read. */
export const IMAGE_BUCKET = 'portraits';

/**
 * The three shapes, in the order the editor shows them.
 *
 * `w`/`h` are what is actually written to storage. They are the biggest frame
 * each shape is ever drawn in, doubled for a retina screen and no further:
 *
 *   portrait  the dashboard's dossier card is 144x256, and 9:16 is also the
 *             block measure the whole site is built on (--block-w / --block-h).
 *   plate     4:3 is the codex's own window. Card art, the creature brief and
 *             the sheet's identity frame are all cropped to it.
 *   face      1:1. The log's 24px circle, the party's 52px one, the roster, the
 *             minion square and the feral plate.
 *
 * `round` says the editor draws that frame as a circle. It changes nothing about
 * the file, which is always square: the circle is a border-radius at the render
 * site, and a face cropped for a circle is the same face a rounded square wants.
 */
export const VIEWS = [
  {
    id: 'portrait',
    label: 'Portrait',
    w: 576,
    h: 1024,
    round: false,
    where: 'Your dashboard card, and any tall frame.',
  },
  {
    id: 'plate',
    label: 'Plate',
    w: 768,
    h: 576,
    round: false,
    where: 'The character sheet, the cards and the campaign page.',
  },
  {
    id: 'face',
    label: 'Face',
    w: 512,
    h: 512,
    round: true,
    where: 'The log, the party bar and every small square.',
  },
];

export const VIEW_IDS = VIEWS.map((view) => view.id);

/** The canonical view. What a `portrait_url` column actually holds, so that a
    render site which forgets to ask for a shape still gets a whole picture. */
export const CANON_VIEW = 'portrait';

export function getView(id) {
  return VIEWS.find((view) => view.id === id) ?? VIEWS[0];
}

/* -------------------------------------------------------------- the master */

/**
 * The longest edge the kept source may have.
 *
 * It exists to be re-cropped from and nothing else, so it only has to be as
 * large as the largest crop taken out of it, which is the portrait's 1024. 1280
 * leaves room to zoom into part of it and still land above that, and it is the
 * difference between a stored picture costing about 150 KB and costing a
 * megabyte and a half. An account's ceiling is a count of pictures, so every
 * kilobyte here is multiplied by a hundred.
 */
export const MASTER_EDGE = 1280;

/**
 * The ceiling on any one object, matched by `file_size_limit` on the bucket in
 * supabase/schema.sql. **Change one and change the other.** This one is what the
 * encoder aims under; that one is what refuses the upload if it somehow does not.
 */
export const OBJECT_BYTES_MAX = 1024 * 1024;

/** Roughly what one stored picture comes to: the master plus three crops. Used
    to say what an account's ceiling is worth in megabytes, never to enforce. */
export const IMAGE_BYTES_TYPICAL = 320 * 1024;

/* --------------------------------------------------------------- the intake */

/** What the file picker offers. AVIF and GIF decode fine and are re-encoded to
    WebP like everything else; a GIF loses its animation and keeps frame one. */
export const ACCEPT = 'image/png,image/jpeg,image/webp,image/avif,image/gif';

/**
 * The two guards on what may be handed to the encoder. Neither is about storage:
 * nothing this size is ever stored. They are about the browser tab surviving the
 * decode, which a 200-megapixel PNG does not.
 */
export const SOURCE_BYTES_MAX = 25 * 1024 * 1024;
export const SOURCE_PIXELS_MAX = 60_000_000;

/* ----------------------------------------------------------------- the URLs */

/**
 * One stored object, split into the part before the view and the view itself.
 *
 * Deliberately anchored on the storage route rather than on the project host:
 * the same bucket is served from a project URL, a custom domain and, in a
 * checker, from no host at all. What identifies one of ours is the shape of the
 * path, and the shape is fixed by objectPath() below.
 */
const OBJECT_URL =
  /^(.*\/storage\/v1\/object\/public\/portraits\/[^/?#]+\/[^/?#.]+)\.(portrait|plate|face|master)\.webp(\?[^#]*)?$/i;

/** Where one file lives inside the bucket. */
export function objectPath(userId, imageId, view) {
  return `${userId}/${imageId}.${view}.webp`;
}

/** Where the three crops are remembered, so re-opening one starts where it was
    left rather than back at the default framing. */
export function metaPath(userId, imageId) {
  return `${userId}/${imageId}.meta.json`;
}

/** True for a picture stored by this site, false for a link to somewhere else
    and for anything that is not a URL at all. */
export function isVaultImage(url) {
  return OBJECT_URL.test(typeof url === 'string' ? url.trim() : '');
}

/**
 * The same picture, in the shape this frame wants.
 *
 * Returns null for nothing at all, the URL untouched when it is not one of ours,
 * and the sibling file when it is.
 */
export function viewUrl(url, view = CANON_VIEW) {
  const raw = typeof url === 'string' ? url.trim() : '';
  if (!raw) return null;

  const parts = OBJECT_URL.exec(raw);
  if (!parts) return raw;

  const id = VIEW_IDS.includes(view) || view === 'master' ? view : CANON_VIEW;
  return `${parts[1]}.${id}.webp${parts[3] ?? ''}`;
}

/**
 * Every picture of ours mentioned anywhere in a blob of text.
 *
 * The library uses it to answer "where is this one being used", and it works on
 * a whole row stringified rather than on one column: a portrait is a column, a
 * minion's picture is inside a jsonb map, a forged item's is inside another, and
 * a feral form's is inside a third. Reading them one by one would mean this
 * function needing to know the shape of every column that might ever hold a
 * picture, which is the sort of list that goes out of date silently.
 */
export function imageIdsIn(text) {
  const found = new Set();
  const source = typeof text === 'string' ? text : JSON.stringify(text ?? '');
  const pattern = /\/storage\/v1\/object\/public\/portraits\/[^/"'?#\s]+\/([^/"'?#.\s]+)\.(?:portrait|plate|face|master)\.webp/gi;
  for (const match of source.matchAll(pattern)) found.add(match[1]);
  return found;
}

/**
 * The id of the picture a URL points at, or null.
 *
 * What the library uses to tell "this one is already on a sheet" from "this one
 * is spare", and the only reason a stored URL is ever parsed rather than just
 * rewritten.
 */
export function imageIdOf(url) {
  const parts = OBJECT_URL.exec(typeof url === 'string' ? url.trim() : '');
  if (!parts) return null;
  const tail = parts[1].split('/');
  return tail[tail.length - 1] || null;
}
