import { formatNumber } from './characterModel.js';
import { ROOFS, getRest } from './rest.js';
import { townGiftWords, townRest } from './fiefRest.js';

/**
 * The campaign calendar: what day it is at the table, what is coming, and the
 * rests the Game Master called.
 *
 * Jules, 2026-10-15: "the date is really world days. The campaign day one
 * corresponds to the day set by the DM which can be any date. Then he manually
 * moves forward days. This can be done one at a time or in bulk."
 *
 * ------------------------------------------------------------------ the clock
 * Two numbers and nothing else: `start`, the in-world date of Day 1, and `day`,
 * the day the table is on. Today is `start + day - 1`, worked out wherever it
 * is read. Nothing on the calendar stores a countdown. An agenda event stores
 * its date, and "in 6 days" is that date less today, so one press of the Game
 * Master's +1 moves every countdown on every sheet at the table at once.
 *
 * Dates are `YYYY-MM-DD` strings read as UTC days. A local-time getter prints
 * the day before for anybody west of Greenwich, so nothing here asks the clock
 * on the wall what day it is: the in-world date is arithmetic on the string.
 *
 * ------------------------------------------------------------------ the rests
 * The Game Master cannot rest anybody. A sheet is the only writer of its own
 * numbers and RLS enforces it, so a rest is **called**: a row on the calendar
 * naming who it is for, what it costs and what it is called. Each named sheet
 * finds it on the campaign row, stands a panel up, and its own client takes the
 * rest through the same rest window the Turn block opens. See RestCall.jsx.
 *
 * A call is one of three shapes, because moving several days at once can mean
 * either of two things and the Game Master says which:
 *
 *   one rest      a Long Rest or a Short Rest, paid for once.
 *   N nights      one Long Rest, paid for every night the days covered. Five
 *                 nights at the Gilded Goose is one night's healing and five
 *                 nights' bill.
 *   N in a row    N Long Rests, each its own window, its own action and its own
 *                 price. A week of brewing is seven nights at the still.
 *
 * How it is paid is the Game Master's too: the rest's own Supplies (the rules'
 * default), nothing at all, or coins a night. Coins may name a roof from the
 * rulebook (8.2), which is what decides whether the night gives anything on top.
 *
 * ------------------------------------------------------------- who answered
 * Two records, and each is written by the only party allowed to write it:
 *
 *   the sheet      `table_calls` on the character row: the last call it took
 *                  or turned down at each table, and how many of its rests. The
 *                  guard that keeps one night from being taken twice.
 *   the table      `answers` on the call itself, folded in by the Game Master's
 *                  page off the rows each answer writes to the table log. What
 *                  the rest log shows everybody, and why it survives the log
 *                  being cleared.
 *
 * Only the newest call naming a character is ever offered. A call nobody
 * answered before the next one came is *missed*, so a player back from a week
 * away is not asked to sleep three nights in a row.
 */

/* ---------------------------------------------------------------- the limits */

/** How many agenda events a calendar holds. */
export const EVENTS_MAX = 100;
/** How many called rests the log keeps. The oldest goes first. */
export const RESTS_MAX = 200;
export const TITLE_MAX = 80;
export const NOTE_MAX = 500;
/** The furthest one press moves the clock: a year. */
export const MOVE_MAX = 365;
/** And the most Long Rests one call asks for in a row. A week of nights, each a
    window to read, is already a lot of pressing. */
export const ROW_MAX = 7;
/** A price a night, in coins. Far past anything the rulebook prints. */
export const COINS_MAX = 1_000_000;
/** How far the day count runs. Far past any campaign. */
const DAY_MAX = 1_000_000;

export const PAY_MODES = ['supplies', 'free', 'coins'];

/* ----------------------------------------------------------------- the dates */

const DAY_MS = 864e5;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Whether a value is a real `YYYY-MM-DD` day. "2026-02-30" is not. */
export function isDate(value) {
  if (typeof value !== 'string' || !ISO.test(value)) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

const FIRST = Math.round(Date.parse('0001-01-01') / DAY_MS);
const LAST = Math.round(Date.parse('9999-12-31') / DAY_MS);

function dayIndex(date) {
  return Math.round(Date.parse(date) / DAY_MS);
}

/** Held between year 1 and year 9999, which is what a date field can hold. */
function dateAt(index) {
  const held = Math.min(LAST, Math.max(FIRST, index));
  return new Date(held * DAY_MS).toISOString().slice(0, 10);
}

/** A date moved by a whole number of days, or null for no date. */
export function addDays(date, days) {
  if (!isDate(date)) return null;
  return dateAt(dayIndex(date) + Math.trunc(Number(days) || 0));
}

/** How many days from one date to the other, negative when `to` is earlier. */
export function daysBetween(from, to) {
  if (!isDate(from) || !isDate(to)) return null;
  return dayIndex(to) - dayIndex(from);
}

/** "14 March 1204". */
export function dateWords(date) {
  if (!isDate(date)) return '';
  const [year, month, day] = date.split('-').map(Number);
  return `${day} ${MONTHS.at(month - 1)} ${year}`;
}

/** "14 Mar". */
export function shortDate(date) {
  if (!isDate(date)) return '';
  const [, month, day] = date.split('-').map(Number);
  return `${day} ${MONTHS.at(month - 1).slice(0, 3)}`;
}

/** The countdown a reader sees: "today", "tomorrow", "in 6 days", "3 days ago". */
export function countdownWords(days) {
  if (days === null || days === undefined || !Number.isFinite(days)) return '';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 1 ? `in ${formatNumber(days)} days` : `${formatNumber(-days)} days ago`;
}

/* -------------------------------------------------------------- the shapes */

function wholeNumber(value, min, max, fallback) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function words(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function newCalendarId(prefix) {
  const id =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${id}`;
}

/** One agenda event, or null for something that is not one. An event is kept
    while its title is being typed, so an empty title is not a reason to drop it. */
function normalizeEvent(raw) {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id || !isDate(raw.date)) return null;
  return {
    id: raw.id,
    date: raw.date,
    title: words(raw.title, TITLE_MAX),
    note: words(raw.note, NOTE_MAX),
    shown: raw.shown !== false,
  };
}

/** How a rest is paid for. A roof is a rulebook lodging and only means anything
    on a Long Rest paid in coins.

    `town` is a rest in the party's own town, stamped with the tier of its best
    open Tavern when the Game Master called it, so every sheet reads the night
    the town had to give that day and not the one it has by the time they wake.
    Null for a rest anywhere else. See fiefRest.js. */
export function normalizePay(raw) {
  const mode = PAY_MODES.includes(raw?.mode) ? raw.mode : 'supplies';
  const town = isRecord(raw?.town) ? { tavern: townRest(raw.town.tavern).tavern } : null;
  if (mode !== 'coins') return { mode, coins: 0, roof: null, ...(town ? { town } : {}) };
  return {
    mode,
    coins: wholeNumber(raw?.coins, 0, COINS_MAX, 0),
    roof: ROOFS[raw?.roof] ? raw.roof : null,
    ...(town ? { town } : {}),
  };
}

function normalizeAnswer(raw) {
  if (!isRecord(raw)) return null;
  return { done: wholeNumber(raw.done, 0, ROW_MAX, 0), declined: raw.declined === true };
}

/** One called rest, or null. */
function normalizeCall(raw) {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id) return null;

  const to = [...new Set((Array.isArray(raw.to) ? raw.to : []).filter((id) => typeof id === 'string' && id))];
  const names = {};
  for (const id of to) names[id] = words(raw.names?.[id], TITLE_MAX);

  const answers = {};
  for (const id of to) {
    const answer = normalizeAnswer(raw.answers?.[id]);
    if (answer) answers[id] = answer;
  }

  const rest = raw.rest === 'short' ? 'short' : 'long';
  const count = rest === 'long' ? wholeNumber(raw.count, 1, ROW_MAX, 1) : 1;

  return {
    id: raw.id,
    ts: typeof raw.ts === 'string' ? raw.ts : '',
    day: wholeNumber(raw.day, 1, DAY_MAX, 1),
    rest,
    /* A call is several nights paid once, or several rests in a row, never
       both. And a Short Rest is an hour, so it is never several nights. */
    nights: count > 1 || rest === 'short' ? 1 : wholeNumber(raw.nights, 1, MOVE_MAX, 1),
    count,
    pay: normalizePay(raw.pay),
    title: words(raw.title, TITLE_MAX),
    note: words(raw.note, NOTE_MAX),
    to,
    names,
    answers,
    withdrawn: raw.withdrawn === true,
  };
}

/**
 * A stored calendar, repaired on read the way every stored layout is: missing,
 * written by an older build or half-typed, it comes back whole.
 */
export function normalizeCalendar(value) {
  const raw = isRecord(value) ? value : {};

  const events = (Array.isArray(raw.events) ? raw.events : [])
    .map(normalizeEvent)
    .filter(Boolean)
    .slice(0, EVENTS_MAX);

  const rests = (Array.isArray(raw.rests) ? raw.rests : [])
    .map(normalizeCall)
    .filter(Boolean)
    .slice(-RESTS_MAX);

  return {
    enabled: raw.enabled === true,
    start: isDate(raw.start) ? raw.start : null,
    day: wholeNumber(raw.day, 1, DAY_MAX, 1),
    events,
    rests,
  };
}

/* ------------------------------------------------------------- the clock */

/** Today's in-world date, or null before Day 1 has one. */
export function todayOf(calendar) {
  const cal = normalizeCalendar(calendar);
  return cal.start ? addDays(cal.start, cal.day - 1) : null;
}

/** Which day of the campaign a date falls on. Day 1 is `start`. */
export function dayNumberOf(calendar, date) {
  const cal = normalizeCalendar(calendar);
  const offset = daysBetween(cal.start, date);
  return offset === null ? null : offset + 1;
}

/** The clock moved forward, a day or a year at a time. */
export function moveForward(calendar, days) {
  const cal = normalizeCalendar(calendar);
  const by = wholeNumber(days, 0, MOVE_MAX, 0);
  return { ...cal, day: wholeNumber(cal.day + by, 1, DAY_MAX, cal.day) };
}

/** The day set outright, which is how a mistake is put right. */
export function setDay(calendar, day) {
  const cal = normalizeCalendar(calendar);
  return { ...cal, day: wholeNumber(day, 1, DAY_MAX, cal.day) };
}

/* ------------------------------------------------------------- the agenda */

export function addEvent(calendar, fields = {}) {
  const cal = normalizeCalendar(calendar);
  const event = normalizeEvent({
    id: newCalendarId('ev'),
    date: isDate(fields.date) ? fields.date : (todayOf(cal) ?? '0001-01-01'),
    title: fields.title ?? '',
    note: fields.note ?? '',
    shown: fields.shown !== false,
  });
  if (cal.events.length >= EVENTS_MAX) return { calendar: cal, event: null };
  return { calendar: { ...cal, events: [...cal.events, event] }, event };
}

export function editEvent(calendar, id, changes = {}) {
  const cal = normalizeCalendar(calendar);
  return {
    ...cal,
    events: cal.events.map((event) =>
      event.id === id ? (normalizeEvent({ ...event, ...changes, id }) ?? event) : event
    ),
  };
}

export function dropEvent(calendar, id) {
  const cal = normalizeCalendar(calendar);
  return { ...cal, events: cal.events.filter((event) => event.id !== id) };
}

/**
 * Every event with its countdown, soonest first. `days` is the date less today
 * and `dayNumber` is which day of the campaign it lands on; both are null while
 * the calendar has no Day 1. `shownOnly` is the players' reading, without what
 * the Game Master is keeping to themselves.
 */
export function agenda(calendar, { shownOnly = false } = {}) {
  const cal = normalizeCalendar(calendar);
  const today = todayOf(cal);

  return cal.events
    .filter((event) => !shownOnly || event.shown)
    .map((event) => ({
      ...event,
      days: daysBetween(today, event.date),
      dayNumber: dayNumberOf(cal, event.date),
    }))
    .sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title) : a.date < b.date ? -1 : 1));
}

/** What is still to come, today included. */
export function upcoming(calendar, { shownOnly = false, limit = Infinity } = {}) {
  return agenda(calendar, { shownOnly })
    .filter((event) => event.days === null || event.days >= 0)
    .slice(0, limit);
}

/* --------------------------------------------------------------- the rests */

/**
 * A rest called, added to the log. Hands back the new calendar and the call, so
 * the page can announce exactly what it stored.
 */
export function callRest(calendar, fields = {}) {
  const cal = normalizeCalendar(calendar);
  const call = normalizeCall({
    ...fields,
    id: newCalendarId('rc'),
    ts: new Date().toISOString(),
    day: cal.day,
    answers: {},
    withdrawn: false,
  });
  return { calendar: { ...cal, rests: [...cal.rests, call].slice(-RESTS_MAX) }, call };
}

/** A call taken back before everybody answered it. What was taken stays taken. */
export function withdrawCall(calendar, id) {
  const cal = normalizeCalendar(calendar);
  return {
    ...cal,
    rests: cal.rests.map((call) => (call.id === id ? { ...call, withdrawn: true } : call)),
  };
}

/** The sheet's own record of what it answered, keyed by table. */
export function normalizeTableCalls(value) {
  const out = {};
  if (!isRecord(value)) return out;
  for (const [campaignId, raw] of Object.entries(value)) {
    if (!isRecord(raw) || typeof raw.call !== 'string' || !raw.call) continue;
    out[campaignId] = {
      call: raw.call,
      done: wholeNumber(raw.done, 0, ROW_MAX, 0),
      declined: raw.declined === true,
    };
  }
  return out;
}

/**
 * How far one character got with one call: the higher of what the table heard
 * and what their own sheet wrote, since either can be ahead of the other.
 */
export function answerOf(call, characterId, guard = null) {
  const heard = call?.answers?.[characterId] ?? null;
  const own = guard && guard.call === call?.id ? guard : null;
  return {
    done: Math.max(heard?.done ?? 0, own?.done ?? 0),
    declined: Boolean(heard?.declined || own?.declined),
  };
}

/**
 * Where one character stands on one call, or null when it never named them.
 *
 *   taken      every rest it asked for
 *   declined   "Not this time"
 *   withdrawn  the Game Master took it back first
 *   missed     a newer call came for them before they answered this one
 *   partway    some of a row taken, the rest still waiting
 *   waiting    not answered yet
 */
export function callStatus(calendar, asked, characterId, guard = null) {
  const cal = normalizeCalendar(calendar);
  /* The calendar's own copy of the call, which is the one the answers were
     folded into: a reader holding the call from before an answer landed would
     otherwise read it as still waiting. */
  const call = cal.rests.find((row) => row.id === asked?.id) ?? asked;
  if (!call?.to?.includes(characterId)) return null;
  const { done, declined } = answerOf(call, characterId, guard);

  if (done >= call.count) return { state: 'taken', done };
  if (declined) return { state: 'declined', done };
  if (call.withdrawn) return { state: 'withdrawn', done };

  const at = cal.rests.findIndex((row) => row.id === call.id);
  const newer = cal.rests
    .slice(at + 1)
    .some((row) => !row.withdrawn && row.to.includes(characterId));
  if (at >= 0 && newer) return { state: 'missed', done };

  return { state: done > 0 ? 'partway' : 'waiting', done };
}

/**
 * The one call this sheet should be answering at this table, or null.
 *
 * Only ever the newest call that names it and has not been withdrawn. Anything
 * older is missed by definition, so a sheet opened after a long absence asks
 * one question, not a backlog of them.
 */
export function openCall(calendar, characterId, guard = null) {
  if (!characterId) return null;
  const cal = normalizeCalendar(calendar);
  const call = cal.rests.findLast((row) => !row.withdrawn && row.to.includes(characterId));
  if (!call) return null;

  const status = callStatus(cal, call, characterId, guard);
  return status.state === 'waiting' || status.state === 'partway'
    ? { call, done: status.done }
    : null;
}

/** The sheet's own write when it takes or turns down a call. */
export function answerCall(character, campaignId, call, { done = 0, declined = false } = {}) {
  const held = normalizeTableCalls(character?.table_calls);
  return {
    table_calls: {
      ...held,
      [campaignId]: {
        call: call.id,
        done: wholeNumber(done, 0, ROW_MAX, 0),
        declined: declined === true,
      },
    },
  };
}

/**
 * One answer off the table log, folded into the call it answers. Null when the
 * row answers nothing on this calendar or tells it nothing new.
 *
 * Read by the Game Master's page, which is the only page allowed to write the
 * campaign row. A rest taken carries the round it was (`data.round`, 1 for the
 * first of a row); a refusal carries `data.move: 'rest-declined'`.
 */
export function foldAnswer(calendar, row) {
  const data = row?.data ?? {};
  if (row?.kind !== 'rest' || !data.call || !row.character_id) return null;

  const cal = normalizeCalendar(calendar);
  const at = cal.rests.findIndex((call) => call.id === data.call);
  if (at < 0) return null;

  const call = cal.rests.at(at);
  if (!call.to.includes(row.character_id)) return null;

  const was = call.answers[row.character_id] ?? { done: 0, declined: false };
  const next =
    data.move === 'rest-declined'
      ? { done: was.done, declined: true }
      : { done: Math.max(was.done, wholeNumber(data.round, 1, call.count, 1)), declined: was.declined };
  if (next.done === was.done && next.declined === was.declined) return null;

  const rests = [...cal.rests];
  rests[at] = { ...call, answers: { ...call.answers, [row.character_id]: next } };
  return { ...cal, rests };
}

/** The calls on this calendar somebody has still to answer. */
export function waitingCalls(calendar) {
  const cal = normalizeCalendar(calendar);
  return cal.rests.filter((call) =>
    call.to.some((id) => {
      const state = callStatus(cal, call, id)?.state;
      return state === 'waiting' || state === 'partway';
    })
  );
}

/* --------------------------------------------------------------- the words */

/** "Long Rest", "Long Rest · 3 nights", "3 Long Rests in a row". */
export function callWords(call) {
  const label = getRest(call?.rest)?.label ?? 'Long Rest';
  if (call?.count > 1) return `${call.count} ${label}s in a row`;
  if (call?.nights > 1) return `${label} · ${call.nights} nights`;
  return label;
}

/**
 * How a call is paid, in a line. The price is a night's: a three-night call at
 * 100 coins says "100 coins a night", and the rest window does the sum. `you`
 * is the panel on a player's own sheet, which is talking to them.
 */
export function payWords(pay, rest = 'long', { you = false } = {}) {
  const held = normalizePay(pay);
  const town = rest === 'long' && held.town ? 'In the town' : '';
  const and = (words) => (town ? `${town} · ${words}` : words);
  if (held.mode === 'free') return and('Free');
  if (held.mode === 'supplies') return and(you ? 'Your own Supplies' : 'Their own Supplies');

  const roof = rest === 'long' && held.roof ? ROOFS[held.roof] : null;
  const price = `${formatNumber(held.coins)} coins a night`;
  return and(roof ? `${roof.label} · ${price}` : price);
}

/** What the town's Tavern gives on top of a Long Rest, in a few words, or ''. */
export function townWords(pay) {
  const held = normalizePay(pay);
  return held.town ? townGiftWords(held.town.tavern) : '';
}

/** And what a roof gives on top, in a line, or '' for a roof that gives nothing. */
export function roofWords(roofId) {
  const roof = ROOFS[roofId];
  if (!roof) return '';
  const extra = [];
  if (roof.karma > 0) extra.push(`${roof.karma} Karma`);
  if (roof.shieldMind) extra.push('Shield equal to Mind');
  return extra.join(' and ');
}

/** "taken", "2 of 3 taken", and the rest, for a status chip. */
export function statusWords(status, call) {
  if (!status) return '';
  if (status.state === 'partway') return `${status.done} of ${call.count} taken`;
  if (status.state === 'declined' && status.done > 0) {
    return `stopped after ${status.done} of ${call.count}`;
  }
  if (status.state === 'taken' && call.count > 1) return `all ${call.count} taken`;
  return status.state;
}
