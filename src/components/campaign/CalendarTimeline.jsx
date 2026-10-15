import { addDays, agenda, countdownWords, normalizeCalendar, shortDate } from '../../lib/calendar.js';
import './calendar.css';

/** How many of the coming events get their name printed under the line. The
    rest are dots with a title on them: a line with twelve names on it is a line
    nobody can read. */
const NAMED = 4;

/**
 * The agenda as a line: Day 1 at the left, today marked, every event a dot at
 * the day it falls on.
 *
 * "There is a time line" was the ask. A list says what is coming; this says how
 * far apart it is, which is what a Game Master pacing a campaign is actually
 * looking at: the festival is a week off and the tithe is the day after it.
 *
 * Laid out in percentages of the span on show, which runs from Day 1 (or the
 * earliest event, if one was set before the campaign began) to a week past
 * today or the last event, whichever is further. Everything is computed off the
 * calendar on each render, so moving the day slides the marker along the line
 * and nothing is stored.
 */
export default function CalendarTimeline({ calendar, shownOnly = false }) {
  const cal = normalizeCalendar(calendar);

  if (!cal.start) {
    return (
      <p className="form-hint">
        Give Day 1 a date on the clock above and the agenda is laid out on a line here.
      </p>
    );
  }

  const events = agenda(cal, { shownOnly }).filter((event) => event.dayNumber !== null);
  const lo = Math.min(1, ...events.map((event) => event.dayNumber));
  const hi = Math.max(cal.day + 7, lo + 1, ...events.map((event) => event.dayNumber));
  const at = (day) => ((day - lo) / (hi - lo)) * 100;
  /* A name hangs centred under its dot, so one too near either end would run off
     the line. It is held a little way in instead, and the dot stays true. */
  const held = (day) => Math.min(90, Math.max(10, at(day)));

  const named = events.filter((event) => event.days >= 0).slice(0, NAMED);
  const said =
    named.length === 0
      ? 'Nothing is coming up.'
      : named
          .map(
            (event) =>
              `${event.title || 'Untitled'} on Day ${event.dayNumber}, ${countdownWords(event.days)}`
          )
          .join('. ');

  return (
    <div className="cal-line" role="img" aria-label={`Today is Day ${cal.day}. ${said}`}>
      <div className="cal-line-rail" aria-hidden="true">
        <span className="cal-line-gone" style={{ width: `${at(cal.day)}%` }} />

        {events.map((event) => (
          <span
            key={event.id}
            className={`cal-line-dot${event.days < 0 ? ' is-past' : ''}${
              event.days === 0 ? ' is-today' : ''
            }${event.shown ? '' : ' is-hidden'}`}
            style={{ left: `${at(event.dayNumber)}%` }}
            title={`${event.title || 'Untitled'} · Day ${event.dayNumber} · ${countdownWords(event.days)}`}
          />
        ))}

        <span className="cal-line-now" style={{ left: `${at(cal.day)}%` }} />
      </div>

      <div className="cal-line-names" aria-hidden="true">
        {named.map((event, i) => (
          <span
            key={event.id}
            className={`cal-line-name${i % 2 ? ' is-low' : ''}`}
            style={{ left: `${held(event.dayNumber)}%` }}
          >
            <b>{event.title || 'Untitled'}</b>
            <span>{countdownWords(event.days)}</span>
          </span>
        ))}
      </div>

      <div className="cal-line-ends" aria-hidden="true">
        <span>
          Day {lo} · {shortDate(addDays(cal.start, lo - 1))}
        </span>
        <span className="cal-line-today">Today · Day {cal.day}</span>
        <span>
          Day {hi} · {shortDate(addDays(cal.start, hi - 1))}
        </span>
      </div>
    </div>
  );
}
