import {
  addDays,
  callStatus,
  callWords,
  normalizeCalendar,
  payWords,
  roofWords,
  shortDate,
  statusWords,
} from '../../lib/calendar.js';
import './calendar.css';

/**
 * Every rest the Game Master called at one table, newest first, and who took it.
 *
 * "Adding a text and title so there is log of the long and short rest. Players
 * can check that log." Jules, 2026-10-15. So the same list is drawn in two
 * places: the Calendar tab, where the Game Master can take back a call nobody
 * has answered yet, and the dialog behind a sheet's Calendar block, where it
 * is read and nothing else.
 *
 * The log is the campaign row's, not the table log's, so a cleared log and the
 * ninety-day sweep leave it alone. Who answered is folded into it by the Game
 * Master's page as the answers land; a sheet reading its own row also knows
 * what it answered itself, which is `mine` and `guard`, so a player who rested
 * while the Game Master's page was shut still reads their own night as taken.
 * See calendar.js.
 */
export default function RestLog({ calendar, mine = null, guard = null, onWithdraw = null }) {
  const cal = normalizeCalendar(calendar);
  const calls = [...cal.rests].reverse();

  if (calls.length === 0) {
    return (
      <p className="pick-line fx-empty">
        No rest has been called at this table yet. Every rest the Game Master calls lands here,
        with where it was, what it cost and who took it.
      </p>
    );
  }

  return (
    <ul className="cal-rests">
      {calls.map((call) => {
        const when = cal.start ? addDays(cal.start, call.day - 1) : null;
        const who = call.to.map((id) => ({
          id,
          name: call.names[id] || 'Someone',
          status: callStatus(cal, call, id, id === mine ? guard : null),
        }));
        const open = who.some(
          (row) => row.status?.state === 'waiting' || row.status?.state === 'partway'
        );
        const extra = call.rest === 'long' && call.pay.mode === 'coins' ? roofWords(call.pay.roof) : '';

        return (
          <li key={call.id} className={`cal-rest${call.withdrawn ? ' is-withdrawn' : ''}`}>
            <div className="cal-rest-head">
              <span className="cal-rest-day">
                Day {call.day}
                {when ? ` · ${shortDate(when)}` : ''}
              </span>
              <span className="cal-rest-what">{callWords(call)}</span>
              {call.withdrawn && <span className="cal-tag">Withdrawn</span>}
            </div>

            {call.title && <p className="cal-rest-title">{call.title}</p>}

            <p className="cal-rest-pay">
              {payWords(call.pay, call.rest)}
              {extra ? ` · ${extra} on top` : ''}
            </p>

            {call.note && <p className="cal-rest-note">{call.note}</p>}

            <div className="cal-rest-who">
              {who.map((row) => (
                <span
                  key={row.id}
                  className={`cal-who cal-who-${row.status?.state ?? 'waiting'}${
                    row.id === mine ? ' is-mine' : ''
                  }`}
                >
                  {row.name} · {statusWords(row.status, call)}
                </span>
              ))}
            </div>

            {onWithdraw && open && !call.withdrawn && (
              <div className="cal-rest-tools">
                <button
                  type="button"
                  className="btn btn-minimal btn-sm"
                  onClick={() => onWithdraw(call.id)}
                  title="Take this call back. Anybody who has not answered it is not asked again, and what was taken stays taken."
                >
                  Withdraw
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
