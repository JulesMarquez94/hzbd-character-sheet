/**
 * The campaign calendar, held to the rules that make its dates and its rests
 * trustworthy.
 *
 * Three things are easy to break by tidying and hard to notice when broken:
 *
 *   **The clock is arithmetic.** Today is Day 1's date plus the day the table is
 *   on, less one, and a countdown is a date less today. Nothing is stored that
 *   could drift: one press of +1 moves every countdown on every sheet. The dates
 *   are UTC days, so a reader west of Greenwich never reads the day before.
 *
 *   **A call is answered once.** The Game Master calls a rest; a sheet takes it
 *   through its own client, and both the sheet's record and the table's fold say
 *   so. Only the newest call naming a sheet is ever offered, an older one nobody
 *   answered is missed, and a row of rests stands up again until the last is
 *   taken or the player stops.
 *
 *   **A rest is priced the way it was called.** Its own Supplies once a night,
 *   nothing, or coins a night in their place, with whatever the roof gives on
 *   top of a Long Rest. A rest the player took for themselves is exactly what it
 *   always was.
 *
 *   node scripts/check-calendar.mjs        report and exit 1 on any finding
 *   node scripts/check-calendar.mjs --list print every case, then exit 0
 */

import {
  addDays,
  addEvent,
  agenda,
  answerCall,
  callRest,
  callStatus,
  callWords,
  countdownWords,
  dateWords,
  daysBetween,
  dropEvent,
  editEvent,
  foldAnswer,
  isDate,
  moveForward,
  normalizeCalendar,
  normalizeTableCalls,
  openCall,
  payWords,
  setDay,
  statusWords,
  todayOf,
  upcoming,
  waitingCalls,
  withdrawCall,
} from '../src/lib/calendar.js';
import { labourAffordable, restPlan, restPrice } from '../src/lib/rest.js';
import { BLANK_CHARACTER } from '../src/lib/characterModel.js';
import { noticeOf } from '../src/lib/logChain.js';
import {
  calendarMovedEvent,
  eventWords,
  restCallEvent,
  restDeclinedEvent,
  restEvent,
} from '../src/lib/campaignLog.js';

const LIST = process.argv.includes('--list');
const findings = [];

function check(what, got, want) {
  const same = JSON.stringify(got) === JSON.stringify(want);
  if (LIST) console.log(`  ${same ? 'ok  ' : 'FAIL'} ${what}`);
  if (!same) findings.push({ what, got, want });
}

function section(title) {
  if (LIST) console.log(`\n===== ${title} =====`);
}

/* ------------------------------------------------------------------ the dates */

section('the dates');

check('a real day is a date', isDate('1204-03-14'), true);
check('the thirtieth of February is not', isDate('2026-02-30'), false);
check('nor is half a date', isDate('1204-3-14'), false);
check('a day forward', addDays('1204-03-14', 1), '1204-03-15');
check('across a month', addDays('1204-03-30', 3), '1204-04-02');
check('across a year', addDays('1204-12-31', 1), '1205-01-01');
check('a leap year has its day', addDays('2028-02-28', 1), '2028-02-29');
check('and a common year does not', addDays('2027-02-28', 1), '2027-03-01');
check('a day back', addDays('1204-03-01', -1), '1204-02-29');
check('days between, forward', daysBetween('1204-03-14', '1204-04-02'), 19);
check('days between, backward', daysBetween('1204-03-14', '1204-03-11'), -3);
check('no date, no count', daysBetween(null, '1204-03-14'), null);
check('a date in words', dateWords('1204-03-14'), '14 March 1204');
check('a year under a thousand is not padded', dateWords('0812-11-02'), '2 November 812');
check('held inside what a date field holds', addDays('9999-12-30', 10), '9999-12-31');

/* The words a countdown chip says. */
check('today', countdownWords(0), 'today');
check('tomorrow', countdownWords(1), 'tomorrow');
check('in six days', countdownWords(6), 'in 6 days');
check('yesterday', countdownWords(-1), 'yesterday');
check('three days ago', countdownWords(-3), '3 days ago');
check('a long way off still reads', countdownWords(1200), 'in 1,200 days');

/* ------------------------------------------------------------------ the clock */

section('the clock');

const blank = normalizeCalendar(null);
check('nothing stored is a calendar switched off on day 1', blank, {
  enabled: false,
  start: null,
  day: 1,
  events: [],
  rests: [],
});
check('with no Day 1 there is no today', todayOf(blank), null);

const dated = { ...blank, enabled: true, start: '1204-03-01', day: 14 };
check('today is Day 1 plus the day, less one', todayOf(dated), '1204-03-14');
check('one day forward', todayOf(moveForward(dated, 1)), '1204-03-15');
check('a week forward', moveForward(dated, 7).day, 21);
check('nothing passes on zero', moveForward(dated, 0).day, 14);
check('a move cannot go backwards', moveForward(dated, -5).day, 14);
check('a move is a year at most', moveForward(dated, 9000).day, 14 + 365);
check('a mistake is put right by setting the day', setDay(dated, 3).day, 3);
check('and a day is never under one', setDay(dated, 0).day, 1);
check('a junk day reads as day 1', normalizeCalendar({ day: 'soon' }).day, 1);
check('a junk start reads as no start', normalizeCalendar({ start: '14/03/1204' }).start, null);

/* ----------------------------------------------------------------- the agenda */

section('the agenda');

let cal = dated;
cal = addEvent(cal, { title: 'Harvest festival', date: '1204-03-20' }).calendar;
cal = addEvent(cal, { title: 'Tithe due', date: '1204-03-15' }).calendar;
cal = addEvent(cal, { title: 'The secret meeting', date: '1204-03-16', shown: false }).calendar;
cal = addEvent(cal, { title: 'The fire', date: '1204-03-02' }).calendar;

const read = (rows) => rows.map((event) => `${event.title} ${event.days}`);

check('soonest first, with countdowns off today', read(agenda(cal)), [
  'The fire -12',
  'Tithe due 1',
  'The secret meeting 2',
  'Harvest festival 6',
]);
check('what players read leaves the Game Master’s own out', read(agenda(cal, { shownOnly: true })), [
  'The fire -12',
  'Tithe due 1',
  'Harvest festival 6',
]);
check('coming up leaves the past out', read(upcoming(cal, { shownOnly: true })), [
  'Tithe due 1',
  'Harvest festival 6',
]);
check(
  'and a press of +1 moves every countdown with it',
  read(upcoming(moveForward(cal, 1), { shownOnly: true })),
  ['Tithe due 0', 'Harvest festival 5']
);
check('an event knows its day of the campaign', agenda(cal).at(-1).dayNumber, 20);

const tithe = agenda(cal).find((event) => event.title === 'Tithe due');
check('an edit keeps the event', editEvent(cal, tithe.id, { title: 'Tithe' }).events.length, 4);
check(
  'an edit to a date that is not one leaves the date',
  editEvent(cal, tithe.id, { date: 'never' }).events.find((event) => event.id === tithe.id).date,
  '1204-03-15'
);
check('a title is kept while it is typed, even empty', editEvent(cal, tithe.id, { title: '' }).events.length, 4);
check('a drop takes it off', dropEvent(cal, tithe.id).events.length, 3);

/* ------------------------------------------------------------------ the calls */

section('the calls');

const KAELEN = 'char-kaelen';
const LARK = 'char-lark';
const names = { [KAELEN]: 'Kaelen', [LARK]: 'Lark Vess' };

const goose = callRest(cal, {
  rest: 'long',
  nights: 3,
  pay: { mode: 'coins', coins: 100, roof: 'common' },
  title: 'The Gilded Goose',
  note: 'Bram sold you the map.',
  to: [KAELEN, LARK],
  names,
});
const one = goose.call;

check('a call is stored on the day it was called', one.day, 14);
check('several nights, one rest', [one.nights, one.count], [3, 1]);
check('a call says itself', callWords(one), 'Long Rest · 3 nights');
check('and its price, a night at a time', payWords(one.pay, one.rest), 'A common room · 100 coins a night');
check(
  'a row of rests is several rests of one night',
  (({ nights, count }) => [nights, count])(callRest(cal, { rest: 'long', nights: 4, count: 4, to: [KAELEN] }).call),
  [1, 4]
);
check('a row is a week at most', callRest(cal, { rest: 'long', count: 30, to: [KAELEN] }).call.count, 7);
check(
  'a Short Rest is never several nights',
  (({ nights, count }) => [nights, count])(callRest(cal, { rest: 'short', nights: 3, count: 3, to: [KAELEN] }).call),
  [1, 1]
);
check('a call keeps who it was for', one.to, [KAELEN, LARK]);

let table = goose.calendar;

check('a call stands for the sheet it names', openCall(table, KAELEN)?.call.id, one.id);
check('and not for one it does not', openCall(table, 'char-stranger'), null);
check('nobody has answered it', waitingCalls(table).map((call) => call.id), [one.id]);

/* Kaelen takes it: the sheet's own record, and the table's fold of the row. */
const kaelen = { ...BLANK_CHARACTER, id: KAELEN, name: 'Kaelen' };
const took = answerCall(kaelen, 'camp-1', one, { done: 1 });
const guard = normalizeTableCalls(took.table_calls)['camp-1'];

check('the sheet records the call it took', guard, { call: one.id, done: 1, declined: false });
check('which closes it on that sheet before the table hears', openCall(table, KAELEN, guard), null);
check('and reads as taken there', callStatus(table, one, KAELEN, guard).state, 'taken');

const answer = { kind: 'rest', character_id: KAELEN, data: { call: one.id, round: 1, of: 1 } };
table = foldAnswer(table, answer);
check('the table folds the answer into the log', callStatus(table, one, KAELEN).state, 'taken');
check('a second fold of the same row changes nothing', foldAnswer(table, answer), null);
check('a row about another call is not this table’s', foldAnswer(table, { ...answer, data: { call: 'rc-elsewhere' } }), null);
check(
  'a row from somebody the call never named is ignored',
  foldAnswer(table, { ...answer, character_id: 'char-stranger' }),
  null
);
check('Lark still has it waiting', callStatus(table, one, LARK).state, 'waiting');

/* A newer call comes before Lark answered: the old one is missed, and only the
   new one is offered. */
const week = callRest(moveForward(table, 3), {
  rest: 'long',
  count: 3,
  pay: { mode: 'supplies' },
  to: [LARK],
  names,
});
table = week.calendar;
const row = week.call;

check('only the newest call is offered', openCall(table, LARK)?.call.id, row.id);
check('the one before it is missed', callStatus(table, one, LARK).state, 'missed');
check('the row asks for its first night', openCall(table, LARK)?.done, 0);

table = foldAnswer(table, { kind: 'rest', character_id: LARK, data: { call: row.id, round: 1 } });
check('one night of three is partway', callStatus(table, row, LARK).state, 'partway');
check('and stands up again for the second', openCall(table, LARK)?.done, 1);

check(
  'stopping partway says how far it got',
  statusWords(
    callStatus(foldAnswer(table, { kind: 'rest', character_id: LARK, data: { move: 'rest-declined', call: row.id } }), row, LARK),
    row
  ),
  'stopped after 1 of 3'
);

table = foldAnswer(table, { kind: 'rest', character_id: LARK, data: { call: row.id, round: 3 } });
check('the last night closes it', openCall(table, LARK), null);
check('and reads as all of them taken', statusWords(callStatus(table, row, LARK), row), 'all 3 taken');

/* Turning one down, and the Game Master taking one back. */
const short = callRest(table, { rest: 'short', pay: { mode: 'free' }, to: [KAELEN, LARK], names });
table = short.calendar;
table = foldAnswer(table, {
  kind: 'rest',
  character_id: KAELEN,
  data: { move: 'rest-declined', call: short.call.id },
});
check('a refusal reads as declined', callStatus(table, short.call, KAELEN).state, 'declined');
check('and is not offered again', openCall(table, KAELEN), null);

table = withdrawCall(table, short.call.id);
check('a withdrawn call is not offered', openCall(table, LARK), null);
check('and reads as withdrawn for whoever had not answered', callStatus(table, short.call, LARK).state, 'withdrawn');
check('what was answered stays answered', callStatus(table, short.call, KAELEN).state, 'declined');
check('nothing is left waiting', waitingCalls(table), []);

check(
  'the log keeps two hundred calls, the newest',
  normalizeCalendar({ rests: Array.from({ length: 230 }, (_, i) => ({ id: `rc-${i}`, to: [KAELEN] })) })
    .rests.at(0).id,
  'rc-30'
);

/* ------------------------------------------------------------------ the price */

section('the price');

const camper = {
  ...BLANK_CHARACTER,
  name: 'Fixture',
  level: 3,
  health: 10,
  health_max: 50,
  willpower: 2,
  willpower_max: 20,
  supplies: 40,
  wealth: 1000,
  karma: 1,
  mind: 4,
  shield: 3,
};

const own = restPlan(camper, 'long');
check('a rest of their own is what it always was', [own.paid, own.patch.supplies, own.patch.wealth], [
  { supplies: 10, coins: 0 },
  30,
  undefined,
]);

const three = restPlan(camper, 'long', [], null, [], null, { pay: { mode: 'supplies', nights: 3 } });
check('three nights on the road is three nights of Supplies', three.patch.supplies, 10);
check('and one rest', three.patch.health, 50);
check('restPrice says the same', restPrice(camper, 'long', { mode: 'supplies', nights: 3 }), 30);

const waved = restPlan(camper, 'long', [], null, [], null, { pay: { mode: 'free' } });
check('a free rest leaves the crate', waved.patch.supplies, 40);
check('and says why', waved.lines.find((line) => line.key === 'cost')?.label, 'No Supplies');

const fine = restPlan(camper, 'long', [], null, [], null, {
  pay: { mode: 'coins', coins: 400, roof: 'fine', nights: 2, title: 'The Gilded Goose' },
});
check('coins a night, out of the purse', fine.patch.wealth, 200);
check('and none out of the crate', fine.patch.supplies, 40);
check('the purse has a ledger row named after the call', fine.patch.ledger?.[0]?.note, 'The Gilded Goose · Long Rest');
check('a fine house is a point of Karma', fine.patch.karma, 2);
check('and Shield equal to Mind in the morning', fine.patch.shield, 4);
check('it says what it paid', fine.paid, { supplies: 0, coins: 800 });

const capped = restPlan({ ...camper, karma: 3 }, 'long', [], null, [], null, {
  pay: { mode: 'coins', coins: 400, roof: 'good' },
});
check('Karma keeps its cap of one per level', capped.patch.karma, undefined);
check('and says so', capped.lines.find((line) => line.key === 'roof-karma')?.label, 'Karma stays at 3');

const nap = restPlan(camper, 'short', [], null, [], null, { pay: { mode: 'coins', coins: 400, roof: 'fine' } });
check('a roof gives nothing on top of a Short Rest', [nap.patch.karma, nap.patch.shield], [undefined, undefined]);

const dear = restPlan(camper, 'long', [], null, [], null, { pay: { mode: 'coins', coins: 1200, nights: 2 } });
check('a purse that cannot pay refuses the rest', [dear.affordable, dear.coinsShort], [false, 1400]);
check('and writes nothing at all', dear.patch, {});

check(
  'a night paid in coin leaves the whole crate to the work',
  labourAffordable({ ...camper, supplies: 30 }, 'long', { amount: 30, gain: false }, { mode: 'coins', coins: 100 }),
  true
);
check(
  'where the road would not have',
  labourAffordable({ ...camper, supplies: 30 }, 'long', { amount: 30, gain: false }),
  false
);

/* ------------------------------------------------------------------ the words */

section('the words');

check('the table calls a rest', eventWords(restCallEvent(one)), 'called a');
check('a player passes on one', eventWords(restDeclinedEvent(kaelen, one)), 'passed on the');
check('a player takes one', eventWords(restEvent('long', kaelen)), 'took a');
check('the calendar moves', eventWords(calendarMovedEvent({ day: 15 })), 'moved the calendar to');
check('the move names the day', calendarMovedEvent({ day: 15, days: 1, when: '15 March 1204' }).detail, '15 March 1204 · 1 day passed');

const taken = restEvent('long', kaelen, { coins: 300, call: one.id, round: 2, of: 3, title: 'The Gilded Goose' });
check('a rest taken carries the call it answers', [taken.data.call, taken.data.round, taken.data.of], [one.id, 2, 3]);
check('and says which night and what it cost', taken.detail, 'The Gilded Goose · 2 of 3 · 300 coins');
check('a rest of their own carries no call', restEvent('long', kaelen).data.call, undefined);

const called = { id: 'e1', kind: 'rest', actor: 'The table', title: 'Long Rest', data: restCallEvent(one).data };
check('a call is not a pop-up on a sheet it names', noticeOf(called, { mine: [KAELEN] }), null);
check('it is on everybody else’s', noticeOf(called, { mine: ['char-other'] })?.line, 'called a Long Rest');

/* ------------------------------------------------------------------- report */

if (findings.length === 0) {
  console.log('calendar: the clock adds up, every call is answered once, every rest is priced as called');
  process.exit(0);
}

console.log(`\ncalendar: ${findings.length} ${findings.length === 1 ? 'case does' : 'cases do'} not hold\n`);
for (const { what, got, want } of findings) {
  console.log(`  ${what}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`);
}
process.exit(LIST ? 0 : 1);
