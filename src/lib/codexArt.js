/**
 * Where a codex picture lives, and what it is called.
 *
 * The pictures the codex draws — card plates, item tiles, the square plates on
 * lineages, talents and backgrounds — used to ship inside the repository under
 * public/cards and its neighbours. They do not any more. The repository is
 * public on GitHub and the site is served from an unauthenticated origin, so
 * shipping them there meant the art rule in tiers.js decided whether a plate was
 * *drawn* while the file behind it stayed readable by anyone who guessed the
 * path, or who simply browsed the repository.
 *
 * They live in a private Supabase bucket now, reachable only through a signed
 * URL that a policy has to allow first. See the CODEX ART section of
 * supabase/schema.sql, which is where the rule is actually enforced.
 *
 * This file is the naming law and nothing else. No Supabase import, no state,
 * no async: it is read by the uploader in scripts/push-codex-art.mjs, by the
 * pull scripts that cut the pictures, and by the app when it signs them. Three
 * callers that must agree on every character of a path, so the path is built in
 * one place. Same reasoning as src/lib/imageViews.js, which does this job for
 * the pictures players upload.
 *
 * ------------------------------------------------------------------- the shape
 *
 *     <set>/<id>.<part>.<ext>
 *
 *     cards/heal.full.webp                720px, the plate a dealt card draws
 *     cards/heal.thumb.webp               200px, the 92px plate a brief draws
 *     items/healing-potion.full.webp      720px, the item card
 *     items/healing-potion.thumb.webp     128px, the 40px icon tile
 *     lineages/celestial.full.jpg         the square plate
 *     talents/berserker.full.jpg          the square plate
 *     backgrounds/criminal.full.jpg       the square plate
 *
 * Three dot-separated pieces after the set, always. A picture with only one
 * size still carries its part, so one parser reads every name in the bucket and
 * a second size can be added later without renaming anything that exists.
 *
 * ------------------------------------------------------- why a dot, not a dash
 * The repository named the small one `<id>-thumb.webp`. Every id is kebab-case
 * and full of hyphens, so `healing-potion-thumb` only comes apart if you already
 * know that `-thumb` is a reserved trailing word — and that an item called
 * `thumb` would be a genuine ambiguity rather than a joke. A dot cannot occur in
 * an id, so `split_part` is enough and there is nothing to know. It is also what
 * the portraits bucket already does.
 *
 * -------------------------------------------------------------- no hash inside
 * The name carries no content hash. A signed URL is minted fresh each session,
 * so a redraw is picked up without one, and a stable name means a redrawn
 * picture overwrites in place: nothing that already points at it has to be found
 * and rewritten. The hash stays in the manifests cardArt.js and itemArt.js
 * carry, where it still versions the art that is served from the repository.
 *
 * ------------------------------------------------------------ the second home
 * A picture is in the bucket because it is AI generated placeholder art, made
 * for one table and not for the open web. Commissioned art is the opposite: it
 * is owned, it is meant to be seen, and it belongs in the repository where
 * Cloudflare caches it at the edge for nothing. So there are two homes, and a
 * manifest entry says which one a picture is in. `local` here is the second
 * home's shape, unchanged from what the site has always served.
 *
 * The day an artist replaces a placeholder, that one picture moves from the
 * bucket to public/ and its manifest entry flips. No gate is rewritten, nothing
 * is switched over at once, and the bucket empties one picture at a time.
 */

/** The one bucket. Private: it has no public route and no write policy. */
export const CODEX_BUCKET = 'codex';

/**
 * What a manifest entry looks like when its picture is in the bucket.
 *
 * `codex:cards/heal.full.webp` is the scheme and then the object path exactly,
 * so reading one back is a `slice` and never a reconstruction. A manifest entry
 * without the prefix is a plain path into public/ and is served as it always
 * was. That one character of difference is the whole of the two-home rule, and
 * useCodexArt is the only thing that reads it.
 */
export const CODEX_SCHEME = 'codex:';

/** A manifest entry for one object in the bucket. */
export function codexRef(setId, id, part = 'full') {
  return `${CODEX_SCHEME}${objectPath(setId, id, part)}`;
}

/**
 * The five sets, each a folder in the bucket and a folder under public/.
 *
 * `parts` is in the order the uploader walks them, and is also the answer to
 * "does this set have a small cut". Cards and items do because two plates draw
 * them at very different sizes; the three square plates are drawn at one size
 * and would gain nothing from a second file.
 */
export const SETS = [
  { id: 'cards', ext: 'webp', parts: ['full', 'thumb'] },
  { id: 'items', ext: 'webp', parts: ['full', 'thumb'] },
  { id: 'lineages', ext: 'jpg', parts: ['full'] },
  { id: 'talents', ext: 'jpg', parts: ['full'] },
  { id: 'backgrounds', ext: 'jpg', parts: ['full'] },
];

export const SET_IDS = SETS.map((set) => set.id);

const BY_ID = new Map(SETS.map((set) => [set.id, set]));

/** The parts a name may end in. Kept as a list so the parser and the uploader
    cannot drift from each other. */
export const PARTS = ['full', 'thumb'];

/** What a stored object is served as. Two, because the square plates were cut
    as JPEG long before any of this and re-cutting them buys nothing. */
export const CONTENT_TYPE = { webp: 'image/webp', jpg: 'image/jpeg' };

/** One object's name in the bucket. The single place a path is spelled. */
export function objectPath(setId, id, part = 'full') {
  const set = BY_ID.get(setId);
  if (!set) throw new Error(`No such codex set: ${setId}`);
  if (!set.parts.includes(part)) throw new Error(`${setId} has no ${part} cut`);
  return `${set.id}/${id}.${part}.${set.ext}`;
}

/** Every object one picture is kept as, which is what an upload writes and a
    delete removes. */
export function objectPathsFor(setId, id) {
  const set = BY_ID.get(setId);
  if (!set) throw new Error(`No such codex set: ${setId}`);
  return set.parts.map((part) => objectPath(setId, id, part));
}

/**
 * A bucket path back into its pieces, or null if it is not one of ours.
 *
 * Null rather than a throw: the bucket is walked by the uploader's prune pass,
 * and something in there that this file does not recognise is a thing to report
 * rather than a thing to crash on.
 */
export function parseObjectPath(path) {
  const cut = String(path ?? '').split('/');
  if (cut.length !== 2) return null;
  const [setId, name] = cut;
  const set = BY_ID.get(setId);
  if (!set) return null;

  const pieces = name.split('.');
  if (pieces.length !== 3) return null;
  const [id, part, ext] = pieces;
  if (!id || !set.parts.includes(part) || ext !== set.ext) return null;

  return { set: setId, id, part, ext };
}

/**
 * What the repository calls the same picture, under public/.
 *
 * The second home's shape, and the one the site has served since the beginning:
 * `<id>.webp` for the big cut and `<id>-thumb.webp` for the small one. It is
 * kept exactly as it was rather than brought into line with the bucket, because
 * every URL in the two manifests already points at it and a rename would be a
 * rewrite of both for no gain.
 */
export function localPath(setId, id, part = 'full') {
  const set = BY_ID.get(setId);
  if (!set) throw new Error(`No such codex set: ${setId}`);
  if (!set.parts.includes(part)) throw new Error(`${setId} has no ${part} cut`);
  return `${set.id}/${id}${part === 'thumb' ? '-thumb' : ''}.${set.ext}`;
}

/**
 * A file sitting in public/<set>/ read back into its pieces, or null.
 *
 * This is the half that has to know `-thumb` is a reserved trailing word, which
 * is the whole argument for the dot in the bucket. It is confined to this one
 * function.
 */
export function parseLocalName(setId, filename) {
  const set = BY_ID.get(setId);
  if (!set) return null;

  const suffix = `.${set.ext}`;
  if (!filename.endsWith(suffix)) return null;
  const stem = filename.slice(0, -suffix.length);
  if (!stem || stem.includes('.')) return null;

  if (stem.endsWith('-thumb')) {
    if (!set.parts.includes('thumb')) return null;
    const id = stem.slice(0, -'-thumb'.length);
    return id ? { set: setId, id, part: 'thumb', ext: set.ext } : null;
  }
  return { set: setId, id: stem, part: 'full', ext: set.ext };
}
