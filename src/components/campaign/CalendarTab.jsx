import { useMemo, useState } from 'react';
import CalendarTimeline from './CalendarTimeline.jsx';
import RestLog from './RestLog.jsx';
import {
  COINS_MAX,
  MOVE_MAX,
  NOTE_MAX,
  ROW_MAX,
  TITLE_MAX,
  addDays,
  addEvent,
  agenda,
  callRest,
  callWords,
  countdownWords,
  dateWords,
  dayNumberOf,
  daysBetween,
  dropEvent,
  editEvent,
  isDate,
  moveForward,
  normalizeCalendar,
  payWords,
  roofWords,
  setDay,
  shortDate,
  todayOf,
  withdrawCall,
} from '../../lib/calendar.js';
import { calendarMovedEvent, postEvent, restCallEvent } from '../../lib/campaignLog.js';
import { formatNumber } from '../../lib/characterModel.js';
import { ROOFS } from '../../lib/rest.js';
import { townRestWords } from '../../lib/fiefRest.js';
import './calendar.css';

/**
 * The Calendar tab: the table's clock, its agenda and the rests the Game Master
 * calls, all on the Game Master's own page.
 *
 * Jules, 2026-10-15: "Day one corresponds to the day set by the DM, which can be
 * any date. Then he manually moves forward days, one at a time or in bulk. The
 * long rest feature triggers the players to take their own, and pay the price:
 * the default one or a set one. When moving several days forward the DM can
 * trigger a long rest with multiple cost, or multiple long rests in a row."
 *
 * Four panels, top to bottom, in the order an evening uses them:
 *
 *   The Clock      the switch that puts the block on every linked sheet, the
 *                  date of Day 1 and the day the table is on.
 *   Move Forward   one press for "time passes", with a rest called on the way
 *                  if one is wanted: how many days, which rest, how the nights
 *                  are taken, how it is paid, who for, and what it is called.
 *   The Agenda     what is coming, on a line and in a list, each with its
 *                  countdown. An event may be the Game Master's alone.
 *   The Rest Log   every rest called and who took it.
 *
 * Every write goes through `change`, which hands the newest calendar in and
 * takes the next one back, so two writes in one breath build on each other
 * instead of the second undoing the first. See `changeCalendar` in
 * CampaignPage.jsx.
 *
 * Nothing here writes to a character. A rest is a call on the campaign row and
 * an announcement on the table log; each sheet named in it takes the rest
 * itself. See RestCall.jsx.
 */
/* `tavern` is the tier of the best open Tavern in the party's town, or null for
   a table with no town. It is what a rest called in the town is stamped with. */
export default function CalendarTab({ campaign, members, change, tavern = null }) {
  const cal = useMemo(() => normalizeCalendar(campaign?.calendar), [campaign?.calendar]);
  const table = useMemo(() => [{ id: campaign.id }], [campaign.id]);

  return (
    <div className="camp-details cal-tab">
      <ClockPanel cal={cal} change={change} />
      <MovePanel cal={cal} change={change} table={table} members={members} tavern={tavern} />
      <AgendaPanel cal={cal} change={change} />

      <section className="camp-panel">
        <h3 className="camp-panel-title">The Rest Log</h3>
        <RestLog calendar={cal} onWithdraw={(id) => change((latest) => withdrawCall(latest, id))} />
      </section>
    </div>
  );
}

/* --------------------------------------------------------------- the clock */

function ClockPanel({ cal, change }) {
  /* The day field is typed into, and a number field that snaps back to the
     stored day on every keystroke cannot be cleared to type a new one. So it
     holds its own draft while focused and writes on blur or Enter. */
  const [dayDraft, setDayDraft] = useState(null);
  const today = todayOf(cal);

  function commitDay() {
    if (dayDraft === null) return;
    const day = Number(dayDraft);
    if (Number.isFinite(day) && day >= 1) change((latest) => setDay(latest, day));
    setDayDraft(null);
  }

  return (
    <section className="camp-panel">
      <h3 className="camp-panel-title">The Clock</h3>

      <label className="cal-switch">
        <input
          type="checkbox"
          checked={cal.enabled}
          onChange={(event) => {
            const on = event.target.checked;
            change((latest) => ({ ...latest, enabled: on }));
          }}
        />
        Show the calendar on linked sheets
      </label>
      <p className="form-hint">
        On, every character at this table grows a Calendar block with today, the agenda and the
        rest log. Off, the block goes away and nothing here is lost. A rest you call reaches the
        players either way.
      </p>

      <div className="cal-today">
        <span className="cal-today-day">Day {formatNumber(cal.day)}</span>
        <span className="cal-today-date">
          {today ? dateWords(today) : 'Give Day 1 a date to see the date here'}
        </span>
      </div>

      <div className="cal-fields">
        <div className="form-group">
          <label className="form-label" htmlFor="cal-start">
            Day 1 is
          </label>
          <input
            className="form-input"
            id="cal-start"
            type="date"
            value={cal.start ?? ''}
            onChange={(event) => {
              const start = event.target.value;
              if (start === '' || isDate(start)) {
                change((latest) => ({ ...latest, start: start || null }));
              }
            }}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="cal-day">
            The table is on day
          </label>
          <input
            className="form-input"
            id="cal-day"
            type="number"
            min={1}
            value={dayDraft ?? cal.day}
            onChange={(event) => setDayDraft(event.target.value)}
            onBlur={commitDay}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitDay();
            }}
          />
        </div>
      </div>
      <p className="form-hint">
        Day 1 can be any date in your world. Typing a day here is for putting a mistake right: it
        calls no rest and the table is not told. Time passing is the panel below.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------ move forward */

const REST_CHOICES = [
  { id: 'none', label: 'No rest' },
  { id: 'long', label: 'A Long Rest' },
  { id: 'short', label: 'A Short Rest' },
];

const PAY_CHOICES = [
  { id: 'supplies', label: 'Their own Supplies', note: 'The rules: 5 for a Short Rest, 10 for a Long one, less what their sheet cuts.' },
  { id: 'free', label: 'Free', note: 'Nothing leaves the crate or the purse.' },
  { id: 'coins', label: 'Coins', note: 'A price a night, each, in place of the Supplies.' },
];

function MovePanel({ cal, change, table, members, tavern }) {
  const [days, setDays] = useState('1');
  const [rest, setRest] = useState('none');
  const [taken, setTaken] = useState('nights'); // 'nights' | 'row'
  const [mode, setMode] = useState('supplies');
  const [roof, setRoof] = useState('common');
  /* Whether the party sleeps in its own town tonight. Off until asked, because
     a party is away from home more often than it is in it. */
  const [inTown, setInTown] = useState(false);
  const [coins, setCoins] = useState(String(ROOFS.common.coins));
  /* Who is *left out*, rather than who is in, so a character who joins while
     the panel is open is asked along with everybody else. */
  const [skipped, setSkipped] = useState([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [said, setSaid] = useState('');

  const moving = Math.min(MOVE_MAX, Math.max(0, Math.floor(Number(days) || 0)));
  const party = members
    .map((member) => member.characters)
    .filter(Boolean)
    .map((who) => ({ id: who.id, name: who.name }));
  const to = party.filter((who) => !skipped.includes(who.id));

  /* How the nights are taken only means something for a Long Rest over more than
     one day. A row is capped at a week of windows; past that it is one rest
     paid for every night, which is still offered. */
  const several = rest === 'long' && moving > 1;
  const rowAllowed = several && moving <= ROW_MAX;
  const asRow = several && taken === 'row' && rowAllowed;
  const nights = several && !asRow ? moving : 1;
  const count = asRow ? moving : 1;

  const price = Math.min(COINS_MAX, Math.max(0, Math.floor(Number(coins) || 0)));
  const town = tavern !== null && rest === 'long' && inTown ? { tavern } : null;
  const pay = {
    ...(mode === 'coins'
      ? { mode, coins: price, roof: rest === 'long' && roof ? roof : null }
      : { mode, coins: 0, roof: null }),
    ...(town ? { town } : {}),
  };

  const calling = rest !== 'none';
  const ready = calling ? to.length > 0 : moving > 0;
  const landing = moveForward(cal, moving);
  const landsOn = todayOf(landing);

  const action =
    moving > 0 && calling
      ? `Move ${moving} ${moving === 1 ? 'day' : 'days'} and call the rest`
      : moving > 0
        ? `Move ${moving} ${moving === 1 ? 'day' : 'days'} forward`
        : calling
          ? 'Call the rest'
          : 'Nothing to do';

  function go() {
    if (!ready) return;

    /* Built inside `change`, off the newest calendar, so a fold of an answer
       landing in the same breath is not lost under this write. The call comes
       back out through `made` so the announcement says exactly what was stored. */
    let made = null;
    let moved = null;
    change((latest) => {
      let next = moveForward(latest, moving);
      if (calling) {
        const names = Object.fromEntries(to.map((who) => [who.id, who.name]));
        const called = callRest(next, {
          rest,
          nights,
          count,
          pay,
          title: title.trim(),
          note: note.trim(),
          to: to.map((who) => who.id),
          names,
        });
        next = called.calendar;
        made = called.call;
      }
      moved = next;
      return next;
    });

    if (moving > 0 && moved) {
      postEvent(
        table,
        calendarMovedEvent({ day: moved.day, days: moving, when: dateWords(todayOf(moved)) })
      );
    }
    if (made) {
      postEvent(
        table,
        restCallEvent(made, {
          words: callWords(made),
          pay: payWords(made.pay, made.rest),
          names: made.to.map((id) => made.names[id]).filter(Boolean),
        })
      );
    }

    setSaid(
      [
        moving > 0 ? `The table is on Day ${moved?.day ?? landing.day}.` : null,
        made
          ? `${callWords(made)} called for ${made.to.length} ${made.to.length === 1 ? 'character' : 'characters'}. Each sheet is asking now.`
          : null,
      ]
        .filter(Boolean)
        .join(' ')
    );
    setTitle('');
    setNote('');
  }

  return (
    <section className="camp-panel">
      <h3 className="camp-panel-title">Move Forward</h3>

      <div className="cal-fields">
        <div className="form-group">
          <label className="form-label" htmlFor="cal-move">
            Days that pass
          </label>
          <input
            className="form-input"
            id="cal-move"
            type="number"
            min={0}
            max={MOVE_MAX}
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
        </div>

        <div className="form-group">
          <span className="form-label">The table lands on</span>
          <p className="cal-lands">
            Day {formatNumber(landing.day)}
            {landsOn ? ` · ${dateWords(landsOn)}` : ''}
          </p>
        </div>
      </div>

      <fieldset className="cal-choice">
        <legend className="form-label">With it</legend>
        {REST_CHOICES.map((choice) => (
          <label key={choice.id} className="cal-radio">
            <input
              type="radio"
              name="cal-rest"
              checked={rest === choice.id}
              onChange={() => setRest(choice.id)}
            />
            {choice.label}
          </label>
        ))}
      </fieldset>

      {several && (
        <fieldset className="cal-choice">
          <legend className="form-label">How the nights are taken</legend>
          <label className="cal-radio">
            <input
              type="radio"
              name="cal-taken"
              checked={!asRow}
              onChange={() => setTaken('nights')}
            />
            One Long Rest, paid for all {moving} nights
          </label>
          <label className={`cal-radio${rowAllowed ? '' : ' is-off'}`}>
            <input
              type="radio"
              name="cal-taken"
              checked={asRow}
              disabled={!rowAllowed}
              onChange={() => setTaken('row')}
            />
            {rowAllowed
              ? `${moving} Long Rests in a row, each its own night`
              : `Long Rests in a row: ${ROW_MAX} at most, so move ${ROW_MAX} days at a time for that`}
          </label>
          <p className="form-hint">
            One rest heals once and is paid for every night. A row is a rest window per night: each
            one heals, each one gets its Long Rest action and each one is paid for.
          </p>
        </fieldset>
      )}

      {calling && (
        <>
          <fieldset className="cal-choice">
            <legend className="form-label">How it is paid</legend>
            {PAY_CHOICES.map((choice) => (
              <label key={choice.id} className="cal-radio" title={choice.note}>
                <input
                  type="radio"
                  name="cal-pay"
                  checked={mode === choice.id}
                  onChange={() => setMode(choice.id)}
                />
                {choice.label}
              </label>
            ))}
          </fieldset>

          {tavern !== null && rest === 'long' && (
            <fieldset className="cal-choice">
              <legend className="form-label">Where they sleep</legend>
              <label className="cal-radio">
                <input type="checkbox" checked={inTown} onChange={(event) => setInTown(event.target.checked)} />
                The party rests in the town
              </label>
              <p className="form-hint">
                {inTown ? townRestWords(tavern) : 'Away from the town, a rest is an ordinary rest.'}
              </p>
            </fieldset>
          )}

          {mode === 'coins' && (
            <div className="cal-fields">
              {rest === 'long' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="cal-roof">
                    Under which roof
                  </label>
                  <select
                    className="form-input"
                    id="cal-roof"
                    value={roof}
                    onChange={(event) => {
                      const next = event.target.value;
                      setRoof(next);
                      // A roof brings its printed price; the field stays the Game Master's.
                      if (ROOFS[next]) setCoins(String(ROOFS[next].coins));
                    }}
                  >
                    <option value="">Just a price</option>
                    {Object.values(ROOFS).map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.label}
                        {roofWords(row.id) ? ` · ${roofWords(row.id)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="cal-coins">
                  Coins a night, each
                </label>
                <input
                  className="form-input"
                  id="cal-coins"
                  type="number"
                  min={0}
                  max={COINS_MAX}
                  value={coins}
                  onChange={(event) => setCoins(event.target.value)}
                />
              </div>
            </div>
          )}

          <fieldset className="cal-choice">
            <legend className="form-label">Who rests</legend>
            {party.length === 0 && <p className="form-hint">No characters are linked yet.</p>}
            {party.map((who) => (
              <label key={who.id} className="cal-radio">
                <input
                  type="checkbox"
                  checked={!skipped.includes(who.id)}
                  onChange={(event) => {
                    const on = event.target.checked;
                    setSkipped((was) => (on ? was.filter((id) => id !== who.id) : [...was, who.id]));
                  }}
                />
                {who.name}
              </label>
            ))}
          </fieldset>

          <div className="form-group">
            <label className="form-label" htmlFor="cal-title">
              Where, or what it is called
            </label>
            <input
              className="form-input"
              id="cal-title"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="The Gilded Goose"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cal-note">
              A note for the log
            </label>
            <textarea
              className="form-input camp-desc-input"
              id="cal-note"
              rows={2}
              value={note}
              maxLength={NOTE_MAX}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Bram sold you the map before closing."
            />
          </div>
        </>
      )}

      <p className="cal-preview">
        {calling
          ? `${count > 1 ? `${count} Long Rests in a row` : rest === 'long' ? 'A Long Rest' : 'A Short Rest'}${
              nights > 1 ? `, paid for ${nights} nights` : ''
            } for ${to.length} ${to.length === 1 ? 'character' : 'characters'}. ${payWords(pay, rest)}${
              mode === 'coins' && price > 0
                ? `: ${formatNumber(price * nights * count)} coins each in all`
                : ''
            }${pay.roof ? `, with ${roofWords(pay.roof) || 'nothing'} on top` : ''}. Each sheet takes its own rest and reads what it does before it confirms.`
          : moving > 0
            ? 'Time passes and nobody rests. Every countdown on every sheet moves with it.'
            : 'Set the days that pass, a rest to call or both.'}
      </p>

      <div className="cal-go">
        <button type="button" className="btn btn-copper btn-sm" disabled={!ready} onClick={go}>
          {action}
        </button>
      </div>

      {said && <p className="camp-note-ok">{said}</p>}
    </section>
  );
}

/* --------------------------------------------------------------- the agenda */

function AgendaPanel({ cal, change }) {
  const today = todayOf(cal);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [shown, setShown] = useState(true);
  const [editing, setEditing] = useState(null);

  /* A new event defaults to a week from today, which is about as far as most
     things on a Game Master's list are, and is easy to move from. */
  const fallback = today ? addDays(today, 7) : '';
  const when = date || fallback;
  const lead = today && isDate(when) ? daysBetween(today, when) : null;

  const rows = agenda(cal);
  const coming = rows.filter((event) => event.days === null || event.days >= 0);
  const gone = rows.filter((event) => event.days !== null && event.days < 0).reverse();

  function add(event) {
    event.preventDefault();
    if (!title.trim() || !isDate(when)) return;
    change((latest) => addEvent(latest, { title: title.trim(), date: when, shown }).calendar);
    setTitle('');
    setDate('');
  }

  return (
    <section className="camp-panel">
      <h3 className="camp-panel-title">The Agenda</h3>

      <CalendarTimeline calendar={cal} />

      <form className="cal-add" onSubmit={add}>
        <input
          className="form-input"
          value={title}
          maxLength={TITLE_MAX}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="The harvest festival"
          aria-label="What happens"
        />
        <input
          className="form-input"
          type="date"
          value={when}
          onChange={(event) => setDate(event.target.value)}
          aria-label="On which date"
        />
        <label className="cal-radio" title="Off, the event is on this tab and nowhere else.">
          <input type="checkbox" checked={shown} onChange={(event) => setShown(event.target.checked)} />
          Players see it
        </label>
        <button
          type="submit"
          className="btn btn-copper btn-sm"
          disabled={!title.trim() || !isDate(when)}
        >
          Add
        </button>
      </form>
      <p className="form-hint">
        {lead !== null
          ? `Day ${dayNumberOf(cal, when)}, ${countdownWords(lead)}. The countdown moves by itself as the days pass.`
          : 'Give Day 1 a date on the clock and every event here counts down to itself.'}
      </p>

      {rows.length === 0 && (
        <p className="pick-line fx-empty">
          Nothing on the agenda yet. A festival, a deadline, a ship that sails: anything the table
          is counting down to.
        </p>
      )}

      {coming.length > 0 && (
        <ul className="cal-events">
          {coming.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              editing={editing === event.id}
              onEdit={() => setEditing(event.id)}
              onDone={() => setEditing(null)}
              change={change}
            />
          ))}
        </ul>
      )}

      {gone.length > 0 && (
        <details className="cal-earlier">
          <summary>
            Earlier · {gone.length} {gone.length === 1 ? 'event' : 'events'}
          </summary>
          <ul className="cal-events">
            {gone.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                editing={editing === event.id}
                onEdit={() => setEditing(event.id)}
                onDone={() => setEditing(null)}
                change={change}
              />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function EventRow({ event, editing, onEdit, onDone, change }) {
  const edit = (changes) => change((latest) => editEvent(latest, event.id, changes));

  if (editing) {
    return (
      <li className="cal-event is-editing">
        <div className="cal-event-form">
          <input
            className="form-input"
            value={event.title}
            maxLength={TITLE_MAX}
            onChange={(e) => edit({ title: e.target.value })}
            aria-label="What happens"
            placeholder="Untitled"
          />
          <input
            className="form-input"
            type="date"
            value={event.date}
            onChange={(e) => {
              if (isDate(e.target.value)) edit({ date: e.target.value });
            }}
            aria-label="On which date"
          />
          <textarea
            className="form-input camp-desc-input"
            rows={2}
            value={event.note}
            maxLength={NOTE_MAX}
            onChange={(e) => edit({ note: e.target.value })}
            placeholder="A line players read when they open it."
            aria-label="Note"
          />
          <div className="cal-event-tools">
            <label className="cal-radio">
              <input
                type="checkbox"
                checked={event.shown}
                onChange={(e) => edit({ shown: e.target.checked })}
              />
              Players see it
            </label>
            <span className="spacer" />
            <button
              type="button"
              className="btn btn-minimal btn-sm"
              onClick={() => {
                change((latest) => dropEvent(latest, event.id));
                onDone();
              }}
            >
              Remove
            </button>
            <button type="button" className="btn btn-copper btn-sm" onClick={onDone}>
              Done
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className={`cal-event${event.days !== null && event.days < 0 ? ' is-past' : ''}`}>
      <span className="cal-event-when">
        <b>{shortDate(event.date)}</b>
        {event.dayNumber !== null && <span>Day {event.dayNumber}</span>}
      </span>
      <span className="cal-event-body">
        <span className="cal-event-title">{event.title || 'Untitled'}</span>
        {event.note && <span className="cal-event-note">{event.note}</span>}
      </span>
      {!event.shown && <span className="cal-tag">Game Master only</span>}
      {event.days !== null && (
        <span className={`cal-chip${event.days === 0 ? ' is-today' : ''}`}>
          {countdownWords(event.days)}
        </span>
      )}
      <button type="button" className="btn btn-minimal btn-sm" onClick={onEdit}>
        Edit
      </button>
    </li>
  );
}
