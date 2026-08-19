/**
 * The journal: what happened, session by session.
 *
 * Every other record on this sheet is a number or a choice. This one is prose,
 * and it is the only part of the character nobody else can derive: what the
 * table did last Thursday, who they promised what, which door they never opened.
 *
 * An entry is a title and a note, the way a session is remembered. It can carry
 * a session label as well, because most tables count their nights ("Session 12")
 * and a list that counts them reads as a campaign rather than a pile of notes.
 * Both are optional: a note jotted mid-fight is still worth keeping.
 *
 *   journal: [
 *     { id, ts, session: "12", title: "The drowned vault", body: "..." },
 *     ...
 *   ]
 *
 * Newest first, the same order the XP ledger uses, because the last thing that
 * happened is the thing you are looking for.
 */

/** A long campaign should not be able to bloat one row past reading. */
export const JOURNAL_LIMIT = 300;
export const JOURNAL_TITLE_MAX = 80;
export const JOURNAL_SESSION_MAX = 24;

export function newEntryId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * A stored journal is only ever a hint: it may be a string, hold entries with
 * no id, or carry fields this build has never heard of. Whatever comes in, this
 * returns entries that can be rendered and written back.
 */
export function normalizeJournal(value) {
  let list = value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = null;
    }
  }
  if (!Array.isArray(list)) return [];

  const seen = new Set();
  const entries = [];

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;

    const id = String(raw.id ?? '') || newEntryId();
    if (seen.has(id)) continue;
    seen.add(id);

    entries.push({
      id,
      ts: typeof raw.ts === 'string' ? raw.ts : '',
      session: String(raw.session ?? '').slice(0, JOURNAL_SESSION_MAX),
      title: String(raw.title ?? '').slice(0, JOURNAL_TITLE_MAX),
      body: String(raw.body ?? ''),
    });
  }

  return entries.slice(0, JOURNAL_LIMIT);
}

/** A new log at the top of the pile. */
export function addEntry(journal, entry) {
  const list = normalizeJournal(journal);
  const written = {
    id: newEntryId(),
    ts: new Date().toISOString(),
    session: String(entry?.session ?? '').trim().slice(0, JOURNAL_SESSION_MAX),
    title: String(entry?.title ?? '').trim().slice(0, JOURNAL_TITLE_MAX),
    body: String(entry?.body ?? ''),
  };
  return [written, ...list].slice(0, JOURNAL_LIMIT);
}

/** Rewrite one log in place. The date it was first written is never moved. */
export function updateEntry(journal, id, changes) {
  // Only the three writable fields are taken from `changes` — spreading it
  // whole would let a caller quietly rewrite `id` or `ts`.
  return normalizeJournal(journal).map((entry) =>
    entry.id === id
      ? {
          ...entry,
          session: String(changes?.session ?? entry.session).slice(0, JOURNAL_SESSION_MAX),
          title: String(changes?.title ?? entry.title).slice(0, JOURNAL_TITLE_MAX),
          body: String(changes?.body ?? entry.body),
        }
      : entry
  );
}

export function removeEntry(journal, id) {
  return normalizeJournal(journal).filter((entry) => entry.id !== id);
}

/**
 * Everything matching a search, in the order the journal already stands.
 *
 * One box, and it looks in all three fields at once: session, title and note.
 * Somebody hunting for "the vault" does not know or care which of the three
 * they wrote it in, and every word has to hit so that two words narrow rather
 * than widen.
 */
export function searchJournal(journal, query) {
  const entries = normalizeJournal(journal);
  const words = String(query ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return entries;

  return entries.filter((entry) => {
    const hay = `${entry.session} ${entry.title} ${entry.body}`.toLowerCase();
    return words.every((word) => hay.includes(word));
  });
}

/** "Session 12" when there is one, and the date it was written either way. */
export function entryStamp(entry) {
  const date = new Date(entry?.ts ?? '');
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** The first line of a note, for a log that was never given a title. */
export function entryHeading(entry) {
  const title = String(entry?.title ?? '').trim();
  if (title) return title;

  const first = String(entry?.body ?? '')
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);

  return first ? first.slice(0, JOURNAL_TITLE_MAX) : 'Untitled log';
}
