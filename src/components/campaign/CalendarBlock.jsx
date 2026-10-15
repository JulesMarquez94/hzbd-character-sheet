import { useState } from 'react';
import Modal from '../Modal.jsx';
import RestLog from './RestLog.jsx';
import {
  addDays,
  callStatus,
  callWords,
  countdownWords,
  dateWords,
  normalizeCalendar,
  payWords,
  shortDate,
  statusWords,
  todayOf,
  upcoming,
} from '../../lib/calendar.js';
import { formatNumber } from '../../lib/characterModel.js';
import './calendar.css';

/** How many coming events the block lists. The rest are on the Game Master's
    agenda, and a block is a fixed size. */
const COMING = 5;

/**
 * The table's calendar, on a linked character's own sheet.
 *
 * Grown on the Character tab beside the table's log and fight blocks, one per
 * campaign, but only while the Game Master has the calendar switched on: this is
 * the block the switch puts there. The same block stands on the campaign's own
 * Overview, where the Game Master reads it with what they are keeping to
 * themselves still on it (`gm`).
 *
 * It is a reading, not a control. Today and its date, the next few things on the
 * agenda each with its countdown, the last rest called for this character and
 * the whole rest log behind a button. Every countdown is worked out here off the
 * calendar the campaign row carries, so a +1 on the Game Master's page moves all
 * of them at once. See calendar.js.
 *
 * A rest being called is not in here. It stands in a panel at the side of the
 * screen on whatever tab the player is on, the way a turn call does, because it
 * asks for an answer. See RestCall.jsx.
 */
export default function CalendarBlock({
  calendar,
  title = '',
  characterId = null,
  guard = null,
  gm = false,
}) {
  const [logOpen, setLogOpen] = useState(false);
  const [opened, setOpened] = useState(null);

  const cal = normalizeCalendar(calendar);
  const today = todayOf(cal);
  const coming = upcoming(cal, { shownOnly: !gm, limit: COMING });

  /* The last rest that named this character, or for the Game Master's reading,
     the last rest called at all. */
  const last = characterId
    ? cal.rests.findLast((call) => call.to.includes(characterId))
    : cal.rests.at(-1);
  const lastStatus = last && characterId ? callStatus(cal, last, characterId, guard) : null;
  const lastWhen = last && cal.start ? addDays(cal.start, last.day - 1) : null;

  return (
    <div className="cell-scroll cal-block">
      <div className="block-head">
        <span className="stat-category-label">Calendar</span>
        <span className="block-count">Day {formatNumber(cal.day)}</span>
      </div>

      {title && <p className="log-note">{title}</p>}

      <div className="cal-today">
        <span className="cal-today-day">Day {formatNumber(cal.day)}</span>
        <span className="cal-today-date">
          {today ? dateWords(today) : 'The Game Master has not dated Day 1 yet'}
        </span>
      </div>

      <span className="fx-label">Coming up</span>
      {coming.length === 0 ? (
        <p className="pick-line fx-empty">Nothing on the agenda yet.</p>
      ) : (
        <ul className="cal-coming">
          {coming.map((event) => {
            const open = opened === event.id;
            return (
              <li key={event.id} className={`cal-coming-row${event.days === 0 ? ' is-today' : ''}`}>
                <button
                  type="button"
                  className="cal-coming-head"
                  onClick={() => setOpened(open ? null : event.id)}
                  aria-expanded={open}
                  disabled={!event.note}
                  title={event.note ? (open ? 'Close the note' : 'Read the note') : undefined}
                >
                  <span className="cal-coming-body">
                    <span className="cal-coming-title">
                      {event.title || 'Untitled'}
                      {!event.shown && <span className="cal-tag">Game Master only</span>}
                    </span>
                    <span className="cal-coming-date">
                      {shortDate(event.date)}
                      {event.dayNumber !== null ? ` · Day ${event.dayNumber}` : ''}
                    </span>
                  </span>
                  {event.days !== null && (
                    <span className={`cal-chip${event.days === 0 ? ' is-today' : ''}`}>
                      {countdownWords(event.days)}
                    </span>
                  )}
                </button>
                {open && event.note && <p className="cal-coming-note">{event.note}</p>}
              </li>
            );
          })}
        </ul>
      )}

      <span className="fx-label">Last rest</span>
      {last ? (
        <div className="cal-last">
          <span className="cal-last-what">
            {callWords(last)}
            {last.title ? ` · ${last.title}` : ''}
          </span>
          <span className="cal-last-detail">
            Day {last.day}
            {lastWhen ? ` · ${shortDate(lastWhen)}` : ''} · {payWords(last.pay, last.rest)}
          </span>
          {lastStatus && (
            <span className={`cal-who cal-who-${lastStatus.state} is-mine`}>
              You · {statusWords(lastStatus, last)}
            </span>
          )}
        </div>
      ) : (
        <p className="pick-line fx-empty">No rest called yet.</p>
      )}

      <div className="cal-block-tools">
        <button type="button" className="btn btn-minimal btn-sm" onClick={() => setLogOpen(true)}>
          Rest log
          {cal.rests.length > 0 ? ` · ${cal.rests.length}` : ''}
        </button>
      </div>

      {logOpen && (
        <Modal title={title ? `Rest Log · ${title}` : 'Rest Log'} onClose={() => setLogOpen(false)}>
          <RestLog calendar={cal} mine={characterId} guard={guard} />
        </Modal>
      )}
    </div>
  );
}
