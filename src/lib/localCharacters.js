/**
 * Characters kept on this device, and nowhere else.
 *
 * A visitor with no account can make a character and play it on the full
 * sheet before deciding whether the site is worth signing up for. The row that
 * would have gone to the database goes into localStorage instead, under an id
 * that says so: `local-` and a UUID. Everything that reads or writes a
 * character branches on that prefix in src/lib/api.js, so the dashboard, the
 * creation screen and the sheet are the same code for both kinds of row.
 *
 * What a device-only character is not: shareable, or at a table. The sheet
 * link only opens in the browser that holds the row, and a campaign is a
 * database object that can only seat database rows. Both are the point rather
 * than a gap: the account is what buys a link anyone can read and a chair at
 * a table, and this is the free look before that. `adoptCharacter` in api.js
 * is the step across: the row is written into the account and the device copy
 * is removed.
 *
 * ------------------------------------------------------------------ no codex
 * This module imports nothing from the rest of src/lib on purpose. It is read
 * by App.jsx to route the creation screen and by the header, the login and the
 * signup pages to say a character is waiting, and all of those ship in the
 * bundle a first-time visitor downloads. Reaching BLANK_CHARACTER from here
 * would drag the whole codex in behind it (see the note in Landing.jsx), so the
 * blank row and the column list are the caller's to hand in. api.js does both.
 *
 * ------------------------------------------------------------------ storage
 * One key, holding a map of id to row. Every write reads the whole map fresh
 * and puts the whole map back, so two sheets open in two tabs clobber only
 * their own row. localStorage can be blocked (a browser set to keep no site
 * data) or full (about five megabytes an origin), and either surfaces as a
 * thrown error; a write that cannot happen throws a sentence the sheet's save
 * light can show, and a read that cannot happen reads as an empty shelf.
 */

const KEY = 'hzbd-local-characters';

export const LOCAL_PREFIX = 'local-';

/**
 * How many a device holds. Small on purpose: this is a look at the system and
 * not a second vault, and a browser's storage is a finite thing shared with
 * the fold state and the unit toggle.
 */
export const LOCAL_CHARACTER_SLOTS = 3;

export function isLocalId(id) {
  return typeof id === 'string' && id.startsWith(LOCAL_PREFIX);
}

export function isLocalCharacter(character) {
  return Boolean(character) && isLocalId(character.id);
}

function newLocalId() {
  const uuid =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
  return `${LOCAL_PREFIX}${uuid}`;
}

/* ------------------------------------------------------------------ the map */

function readStore() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch {
    // No storage, or something wrote nonsense into the key. An empty shelf.
    return {};
  }
}

/**
 * The two ways a browser refuses a write, told apart because the reader can do
 * something about one of them and nothing about the other.
 */
function writeStore(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch (err) {
    const full =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014;
    throw new Error(
      full
        ? 'This browser has no room left to save the character on this device. Create an account to keep it there instead.'
        : 'This browser is not keeping site data, so the character could not be saved on this device. Create an account to keep it instead.',
      { cause: err }
    );
  }
}

/* ---------------------------------------------------------------- reading */

/** Every character on this device, oldest first, the order the vault uses. */
export function listLocalCharacters() {
  return Object.values(readStore()).sort((a, b) =>
    String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''))
  );
}

/** Whether there is anything here at all, for a line on a page that has no
    other reason to read the shelf. */
export function hasLocalCharacters() {
  return Object.keys(readStore()).length > 0;
}

/**
 * The shelf named in a sentence: "Thalira", "Thalira and Oswin", "Thalira,
 * Oswin and Bram". No comma before the last `and`, per docs/text-style.md.
 */
export function joinNames(names) {
  const list = names.filter(Boolean);
  if (list.length <= 1) return list[0] ?? '';
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

export function getLocalCharacter(id) {
  const row = readStore()[id];
  if (!row) {
    throw new Error(
      'No character is saved on this device at this link. It may have been deleted, saved to an account or made in another browser.'
    );
  }
  return row;
}

/* ---------------------------------------------------------------- writing */

/**
 * A new row on the shelf. `row` is the whole character as the caller wants it
 * stored (the blank one with the name filled in, usually); this only stamps the
 * id, the empty owner and the two clocks the database would have stamped.
 */
export function createLocalCharacter(row) {
  const store = readStore();
  if (Object.keys(store).length >= LOCAL_CHARACTER_SLOTS) {
    throw new Error(
      `This device holds ${LOCAL_CHARACTER_SLOTS} characters at most. Save one to an account, or delete one, to make room.`
    );
  }

  const now = new Date().toISOString();
  const created = { ...row, id: newLocalId(), user_id: null, created_at: now, updated_at: now };
  store[created.id] = created;
  writeStore(store);
  return created;
}

/** The patch is trusted to be columns only: api.js picks them before it gets here. */
export function updateLocalCharacter(id, patch) {
  const store = readStore();
  const current = store[id];
  if (!current) {
    throw new Error('This character is no longer saved on this device, so the change could not be kept.');
  }

  const next = { ...current, ...patch, id, user_id: null, updated_at: new Date().toISOString() };
  store[id] = next;
  writeStore(store);
  return next;
}

export function deleteLocalCharacter(id) {
  const store = readStore();
  if (!(id in store)) return;
  delete store[id];
  writeStore(store);
}
