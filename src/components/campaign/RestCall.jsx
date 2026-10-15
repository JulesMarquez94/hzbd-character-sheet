import { useState } from 'react';
import RestPrompt from '../sheet/RestPrompt.jsx';
import { useCampaignLog } from '../../context/campaign-log.js';
import {
  answerCall,
  callWords,
  normalizeTableCalls,
  openCall,
  payWords,
  roofWords,
} from '../../lib/calendar.js';
import { postEvent, restDeclinedEvent, restEvent } from '../../lib/campaignLog.js';
import './calendar.css';

/**
 * The Game Master called a rest, and this sheet is one of the ones it names.
 *
 * Jules, 2026-10-15: "The long rest feature triggers the player to take their
 * own and pay the price." Nobody may write to a sheet but the sheet, so the call
 * is a row on the campaign's calendar and this is the panel that stands up on
 * the sheet it names. **Rest** opens the very window the Turn block's own rest
 * buttons open, with the Game Master's price in it: the player reads every line
 * the night will write, picks their Long Rest action, and their own client
 * writes it. **Not this time** turns it down and says so to the table.
 *
 * ------------------------------------------------------------- where it comes from
 * The campaign row, not the table log. The row is live on the sheet already (see
 * LogProvider.jsx), it is there on a sheet opened the morning after, and a
 * cleared log cannot take it. So there is no fetch and no replay to guard
 * against here: the call is a fact about the campaign, and what this sheet
 * answered is a fact about the sheet (`table_calls`, written in the same patch
 * as the rest itself). A second tab reads the same two facts and offers nothing.
 *
 * ------------------------------------------------------------- one at a time
 * Only the newest call naming this sheet is offered (see openCall), and only one
 * table's at once. A call for several rests in a row stands up again after each
 * one, saying which night it is on, until the last is taken or the player stops.
 *
 * Renders nothing for a sheet that is not yours, and nothing at a table with no
 * call standing, which is nearly always.
 */
export default function RestCall({ character, patch, canEdit = false }) {
  const { tables, log } = useCampaignLog();
  /* The call whose rest window is open, by id, so the window closes itself if
     the call stops standing underneath it (taken in another tab, withdrawn). */
  const [taking, setTaking] = useState(null);
  const [busy, setBusy] = useState(null);

  if (!canEdit || !character?.id) return null;

  const guards = normalizeTableCalls(character.table_calls);
  const waiting =
    tables
      .map((table) => {
        const open = openCall(table.calendar, character.id, guards[table.id]);
        return open ? { ...open, table } : null;
      })
      .find(Boolean) ?? null;

  if (!waiting) return null;

  const { call, done, table } = waiting;
  const round = done + 1;
  const pay = { ...call.pay, nights: call.nights, title: call.title };
  const extra = call.rest === 'long' && call.pay.mode === 'coins' ? roofWords(call.pay.roof) : '';

  if (taking === call.id) {
    return (
      <RestPrompt
        kind={call.rest}
        character={character}
        pay={pay}
        called={{
          table: table.name,
          title: call.title,
          note: call.note,
          round,
          count: call.count,
        }}
        onRest={(body, taken) => {
          /* The night and the record that it was taken, in one write: a rest
             that landed without its record would be offered again on reload. */
          patch({ ...body, ...answerCall(character, table.id, call, { done: round }) });
          log(
            restEvent(call.rest, character, {
              action: taken?.action ?? null,
              supplies: taken?.paid?.supplies ?? 0,
              coins: taken?.paid?.coins ?? 0,
              call: call.id,
              round,
              of: call.count,
              title: call.title,
            })
          );
        }}
        onClose={() => setTaking(null)}
      />
    );
  }

  async function decline() {
    if (busy === call.id) return;
    setBusy(call.id);
    patch(answerCall(character, table.id, call, { done, declined: true }));
    /* To the calling table alone: the other tables this sheet sits at never
       asked, and "passed on the Long Rest" there would be news about nothing. */
    await postEvent([{ id: table.id }], {
      ...restDeclinedEvent(character, call),
      characterId: character.id,
    });
    setBusy(null);
  }

  return (
    <div className="reaction-call rest-call" role="alertdialog" aria-label="The Game Master called a rest">
      <span className="reaction-call-body">
        <span className="reaction-call-head">
          {table.name} · {call.count > 1 ? `Rest ${round} of ${call.count}` : 'A rest is called'}
        </span>
        <span className="reaction-call-what">
          <b>{callWords(call)}</b>
          {call.title ? (
            <>
              {' '}
              at <b>{call.title}</b>
            </>
          ) : null}
          . {payWords(call.pay, call.rest, { you: true })}
          {extra ? `, with ${extra} on top` : ''}.
        </span>
        <span className="reaction-call-line">
          {call.note ? `${call.note} ` : ''}
          {done > 0
            ? `You have taken ${done} of ${call.count}. The rest window shows what this one does before anything is written.`
            : 'The rest window shows what it does and what it costs before anything is written.'}
        </span>
      </span>

      <span className="reaction-call-acts">
        <button
          type="button"
          className="btn btn-copper btn-sm"
          onClick={() => setTaking(call.id)}
          disabled={busy === call.id}
        >
          {call.count > 1 ? `Take rest ${round}` : 'Rest'}
        </button>
        <button
          type="button"
          className="btn btn-minimal btn-sm"
          onClick={decline}
          disabled={busy === call.id}
          title={
            done > 0
              ? 'Stop here. What you took stays taken, and the rest of the row is not asked again.'
              : 'Turn this rest down. The table sees that you passed.'
          }
        >
          {done > 0 ? 'Stop here' : 'Not this time'}
        </button>
      </span>
    </div>
  );
}
