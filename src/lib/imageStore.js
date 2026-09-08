/**
 * The shelf: what an account has uploaded, what it costs it, and the four calls
 * that put a picture on it or take one off.
 *
 * One bucket, one folder per account, five objects per picture. There is no
 * table behind it and that is deliberate: a row and a file can disagree, and the
 * way they disagree in practice is that a file exists with no row, which means
 * bytes an account is paying for and cannot see to delete. Storage is therefore
 * the only record, `list()` is the only query, and everything the library shows
 * is something that is really there.
 *
 * ------------------------------------------------------------------ the ceiling
 * `imageSlots()` in src/lib/tiers.js is what this file offers and what the page
 * shows. It is **not** what enforces anything. The policy on the bucket in
 * supabase/schema.sql counts the account's own pictures and refuses the insert,
 * and the bucket's own `file_size_limit` refuses an oversized object whatever
 * the browser claims it encoded. Both of those are the boundary. This is the
 * courtesy that lets a player see the wall before walking into it.
 *
 * ---------------------------------------------------------------- the addresses
 * A stored URL never changes. A re-crop overwrites the same four objects at the
 * same four addresses, so every sheet, every creature and every log row that
 * already points at the picture keeps pointing at it and simply shows the new
 * framing. Nothing has to be found and rewritten, which is the only reason a
 * picture can be re-cropped at all: the log copies a URL into a row when the row
 * is written and nothing may ever go back and edit that.
 */
import { requireSupabase } from './supabaseClient.js';
import {
  CANON_VIEW,
  IMAGE_BUCKET,
  VIEWS,
  imageIdsIn,
  metaPath,
  objectPath,
} from './imageViews.js';
import { defaultCrops, encodeMaster, encodeView, normalizeCrop, normalizeCrops } from './imageCrop.js';
import { imageSlots } from './tiers.js';

/** One object name inside an account's folder, as its picture and its part. */
const OBJECT_NAME = /^([^./]+)\.(portrait|plate|face|master|meta)\.(webp|json)$/i;

/** Storage's own page size. Five objects a picture, so this is 100 pictures at
    a time and a ceiling of 300 is three requests. */
const PAGE = 500;

function client() {
  return requireSupabase().storage.from(IMAGE_BUCKET);
}

/** The address anything on the site can be pointed at. */
export function publicUrl(path) {
  return requireSupabase().storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function newImageId() {
  const made = globalThis.crypto?.randomUUID?.();
  if (made) return made.replace(/-/g, '');
  /* No randomUUID in an old browser or a plain node checker. The id only has to
     be unique inside one account's folder and free of dots, which are what
     separate the name from the part. */
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * An error out of storage, as a sentence worth showing.
 *
 * The one that matters is the policy refusal. A policy cannot say why it said
 * no, and there are only two reasons it can: the folder is not yours, which
 * nothing in this file can cause, or the shelf is full. So a refusal is reported
 * as full, which is true whenever a player can actually see it.
 */
function storageError(error, tier) {
  const text = String(error?.message ?? '');
  if (/policy|violates|unauthor|403/i.test(text)) {
    return new Error(
      `Every picture slot on this account is full. It holds ${imageSlots(tier)}. Delete one to make room.`
    );
  }
  if (/exceeded the maximum allowed size|payload too large|413/i.test(text)) {
    return new Error('That picture came out too large to store. Try a smaller or simpler one.');
  }
  return new Error(text || 'The picture could not be stored. Try again in a moment.');
}

/* ------------------------------------------------------------------ the shelf */

/**
 * Everything this account has uploaded, newest first.
 *
 * `bytes` is summed off the objects themselves rather than guessed from the
 * count, so the page reports what is really being kept. A picture whose parts
 * are half missing (an upload interrupted at the third file) still appears, with
 * whatever it has: it is occupying a slot, so it has to be visible to be
 * deletable.
 */
export async function listImages(userId) {
  if (!userId) return { images: [], bytes: 0, count: 0 };

  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await client().list(userId, {
      limit: PAGE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }

  const byId = new Map();
  for (const row of rows) {
    const parts = OBJECT_NAME.exec(row.name ?? '');
    if (!parts) continue;
    const id = parts[1];
    const found = byId.get(id) ?? { id, bytes: 0, updated: '', parts: new Set() };
    found.bytes += Number(row.metadata?.size ?? 0);
    found.parts.add(parts[2].toLowerCase());
    const stamp = row.updated_at ?? row.created_at ?? '';
    if (stamp > found.updated) found.updated = stamp;
    byId.set(id, found);
  }

  const images = [...byId.values()]
    .map((found) => ({
      id: found.id,
      bytes: found.bytes,
      updated: found.updated,
      /* Whether it can be re-cropped. A picture uploaded by a build that kept no
         master, or one whose master upload failed, can still be used and
         deleted; it just cannot be moved. */
      canRecrop: found.parts.has('master'),
      url: publicUrl(objectPath(userId, found.id, CANON_VIEW)),
    }))
    .sort((a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : 0));

  return {
    images,
    count: images.length,
    bytes: images.reduce((sum, image) => sum + image.bytes, 0),
  };
}

/** Where the three crops were left, or the default framing if this picture has
    no receipt (uploaded before the meta file, or written by hand). */
export async function loadCrops(userId, id) {
  const { data, error } = await client().download(metaPath(userId, id));
  if (error || !data) return defaultCrops();
  try {
    const meta = JSON.parse(await data.text());
    return normalizeCrops(meta?.crops);
  } catch {
    return defaultCrops();
  }
}

/** The kept source, decoded, so an existing picture can be re-cropped. */
export async function loadMaster(userId, id) {
  const { data, error } = await client().download(objectPath(userId, id, 'master'));
  if (error || !data) {
    throw new Error('The original of that picture is missing, so its framing cannot be changed.');
  }
  return data;
}

/* ----------------------------------------------------------------- the upload */

/**
 * Write a picture: the master, the three crops and the receipt.
 *
 * The master goes first when there is one. It is the object that claims the slot,
 * so if the shelf is full the refusal arrives before any of the crops are
 * encoded, and nothing partial is left behind. On a re-crop it is skipped
 * entirely: the source has not changed, only where the frames sit on it.
 *
 * `upsert` throughout, which is what makes a re-crop land on the same addresses
 * the site is already pointing at.
 */
export async function saveImage({ userId, source, crops, id = null, tier = 'free', withMaster = true }) {
  if (!userId) throw new Error('Pictures are kept with your account. Sign in to upload one.');

  const imageId = id ?? newImageId();
  const framing = {};
  for (const view of VIEWS) framing[view.id] = normalizeCrop(source, view, crops?.[view.id]);

  /**
   * Five minutes, not an hour.
   *
   * A stored URL never changes, which is what makes a re-crop possible at all,
   * and the price of that is that a re-crop cannot bust anybody's cache. So the
   * cache is kept short enough that "I moved it and it looks the same" resolves
   * itself while somebody is still looking at the page. The library gets there
   * sooner: it hangs each picture's own timestamp on the tile's URL, so the
   * person who just reframed one sees it immediately.
   */
  async function put(path, blob, contentType) {
    const { error } = await client().upload(path, blob, {
      upsert: true,
      contentType,
      cacheControl: '300',
    });
    if (error) throw storageError(error, tier);
  }

  let bytes = 0;
  if (withMaster) {
    const master = await encodeMaster(source);
    bytes += master.size;
    await put(objectPath(userId, imageId, 'master'), master, 'image/webp');
  }

  for (const view of VIEWS) {
    const blob = await encodeView(source, view, framing[view.id]);
    bytes += blob.size;
    await put(objectPath(userId, imageId, view.id), blob, 'image/webp');
  }

  const meta = new Blob(
    [
      JSON.stringify({
        crops: framing,
        source: { width: source.width, height: source.height },
        saved: new Date().toISOString(),
      }),
    ],
    { type: 'application/json' }
  );
  await put(metaPath(userId, imageId), meta, 'application/json');

  return {
    id: imageId,
    bytes,
    url: publicUrl(objectPath(userId, imageId, CANON_VIEW)),
    crops: framing,
  };
}

/**
 * Take a picture off the shelf.
 *
 * All five objects at once, and a failure on one is not hidden: a picture that
 * half went is the state the library exists to make visible.
 *
 * Nothing goes looking for the sheets that pointed at it. A frame with a missing
 * picture draws its initials, which is exactly what it drew before one was
 * chosen, and every render site on the site already handles it because it is the
 * empty state they were all built with.
 */
export async function deleteImage(userId, id) {
  const paths = [
    objectPath(userId, id, 'master'),
    ...VIEWS.map((view) => objectPath(userId, id, view.id)),
    metaPath(userId, id),
  ];
  const { error } = await client().remove(paths);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ the usage */

/**
 * Which of an account's own things each picture is on.
 *
 * Three queries and a substring scan. A picture can be referenced from a column
 * (`characters.portrait_url`, `campaigns.thumbnail_url`) or from inside a jsonb
 * map (a minion, a feral form, a forged item, a creature's body), so rather than
 * naming every one of those the whole row is stringified and every picture of
 * ours mentioned in it is counted. See imageIdsIn().
 *
 * It is the account's own rows only. A picture handed to another table by URL is
 * still just a URL to that table, and nothing here can see it, which is said out
 * loud on the page: a delete cannot promise nothing anywhere breaks, only that
 * nothing of yours does.
 */
export async function usageIndex(userId) {
  const used = new Map();
  if (!userId) return used;

  const sb = requireSupabase();
  const note = (ids, entry) => {
    for (const id of ids) {
      const list = used.get(id) ?? [];
      list.push(entry);
      used.set(id, list);
    }
  };

  const [characters, creatures, campaigns] = await Promise.all([
    sb.from('characters').select('id, name, portrait_url, minions, feral, forged').eq('user_id', userId),
    sb.from('custom_creatures').select('id, body').eq('user_id', userId),
    sb.from('campaigns').select('id, name, thumbnail_url').eq('dm_user_id', userId),
  ]);

  for (const row of characters.data ?? []) {
    note(imageIdsIn(row), { kind: 'character', name: row.name, href: `/characters/${row.id}` });
  }
  for (const row of creatures.data ?? []) {
    note(imageIdsIn(row), { kind: 'creature', name: row.body?.name || 'A creature', href: null });
  }
  for (const row of campaigns.data ?? []) {
    note(imageIdsIn(row), { kind: 'campaign', name: row.name, href: `/campaigns/${row.id}` });
  }

  return used;
}
