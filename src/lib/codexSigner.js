/**
 * The signed-URL desk for the codex art.
 *
 * The pictures live in a private bucket (see the CODEX ART section of
 * supabase/schema.sql). There is no public route to one, so the only way to
 * draw a plate is a signed URL, and the policy on the bucket decides whether
 * this account may have one at all. That is the point of the arrangement: the
 * art rule used to be an interface courtesy that any direct fetch walked
 * around, and now it is a boundary.
 *
 * ------------------------------------------------- why this is not React state
 * A plate asks for its picture *while it renders*, and signing is a round trip.
 * That is a cache read during render whose answer arrives later, which is
 * exactly the shape `useSyncExternalStore` exists for: the cache lives out here
 * as a plain module, components read it during render, and it tells them when
 * something has changed.
 *
 * Written as React state instead it would have to record its misses in a ref
 * during render and spend them in an effect, which is a render mutating a ref
 * and an effect calling setState. Both are the patterns React now warns about,
 * and both were how this file looked before it was this file.
 *
 * -------------------------------------------------------------------- lazily
 * Nothing is signed in advance. A sheet draws thirty cards and the codex draws
 * nine tiles at a time, so signing all 767 objects up front would be a quarter
 * of a megabyte of tokens to show a page that wanted a handful.
 *
 * Instead a miss goes on a slip and a microtask spends the whole slip in one
 * `createSignedUrls`. React renders a page in one pass, so one page is one
 * request however many plates are on it. Opening a new tab asks for the next
 * handful, and nothing re-asks for what it already holds.
 *
 * -------------------------------------------------------------------- refusal
 * A path the server would not sign is remembered as null rather than forgotten.
 * A forgotten refusal is asked again on the next render, which is an infinite
 * round trip against a policy that will never change its mind. Null means
 * "asked, and refused", the plate stays empty, and nothing asks twice.
 *
 * -------------------------------------------------------------------- the tier
 * Nothing here knows what a tier is. useCodexArt checks `showsArt` before it
 * ever calls in, so a free account never sends a request the policy is only
 * going to refuse. That check is the courtesy and the policy is the boundary.
 */
import { CODEX_BUCKET } from './codexArt.js';
import { supabase } from './supabaseClient.js';

/** Eight hours. Long enough that nobody re-signs in the middle of a session,
    short enough that a URL caught in a screenshot is dead the same day. */
export const TTL = 8 * 60 * 60;

/** Re-sign ten minutes early, so a session left open overnight refreshes rather
    than quietly emptying its plates the moment the tokens lapse. */
const REFRESH_AT = (TTL - 10 * 60) * 1000;

/** path -> URL, or path -> null for one the server refused. */
const urls = new Map();
/** Asked for and not yet sent. */
const wanted = new Set();
/** Sent and not yet answered, so a second render does not ask again. */
const inflight = new Set();

const listeners = new Set();

/**
 * What `useSyncExternalStore` reads.
 *
 * A counter rather than the map, because a snapshot has to be comparable with
 * `Object.is` and a Map that is mutated in place never looks different. It goes
 * up whenever an answer lands or the desk is cleared, which is exactly when a
 * plate might draw differently.
 */
let version = 0;
let flushing = false;
let mintedAt = 0;
let timer = null;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVersion() {
  return version;
}

function changed() {
  version += 1;
  for (const listener of listeners) listener();
}

/**
 * Empty the desk.
 *
 * Called when the account changes, and by the refresh timer. A signed URL is
 * minted for whoever asked, so it must not survive a sign-out into the next
 * person's session, and an account that has just lost its art must stop drawing
 * what it was drawing a moment ago.
 */
export function reset() {
  if (timer) clearTimeout(timer);
  timer = null;
  mintedAt = 0;
  urls.clear();
  wanted.clear();
  inflight.clear();
  changed();
}

function scheduleRefresh() {
  if (timer || !mintedAt) return;
  timer = setTimeout(reset, Math.max(0, mintedAt + REFRESH_AT - Date.now()));
}

async function flush() {
  flushing = false;
  const batch = [...wanted];
  wanted.clear();
  if (!batch.length || !supabase) return;

  for (const path of batch) inflight.add(path);

  /* A network failure is not a refusal, but it is answered the same way: the
     plates stay empty and the desk is not asked again until it is cleared.
     Retrying here would be a loop against whatever is broken. */
  let rows;
  try {
    const { data } = await supabase.storage.from(CODEX_BUCKET).createSignedUrls(batch, TTL);
    rows = data ?? [];
  } catch {
    rows = [];
  }

  /* Every path in the batch is answered, and the default answer is no. A
     refusal is as much an answer as a URL. Whatever came back overwrites its
     own row. */
  for (const path of batch) urls.set(path, null);
  for (const row of rows) {
    if (row?.path) urls.set(row.path, row.error ? null : (row.signedUrl ?? null));
  }
  for (const path of batch) inflight.delete(path);

  if (!mintedAt) mintedAt = Date.now();
  scheduleRefresh();
  changed();
}

/**
 * The URL for one object path, or null.
 *
 * Null is the normal first answer: the plate draws empty, the signature lands,
 * the plate draws again. Every art surface on the site already draws an empty
 * plate when it has no picture, which is what makes this safe to call from
 * anywhere.
 *
 * Recording the miss is a write during a render. It is a `Set.add` of a string
 * behind a dedupe, so a double-invoked render in strict mode does it twice and
 * means it once, and the microtask that spends the slip runs after both.
 */
export function urlFor(path) {
  if (!path) return null;
  if (urls.has(path)) return urls.get(path);
  if (!inflight.has(path)) {
    wanted.add(path);
    if (!flushing) {
      flushing = true;
      queueMicrotask(flush);
    }
  }
  return null;
}
