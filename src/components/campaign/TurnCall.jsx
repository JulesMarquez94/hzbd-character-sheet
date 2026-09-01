import { useCallback, useEffect, useRef, useState } from 'react';
import { TriggerRow } from '../sheet/TurnPrompt.jsx';
import { useClauseRolls } from '../sheet/useClauseRolls.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { turnDoneEvent } from '../../lib/campaignLog.js';
import { characterDelta } from '../../lib/combatApply.js';
import { endTurn, layEffect, normalizeTurn, startTurn } from '../../lib/combatTurn.js';
import { turnTriggers } from '../../lib/turnTriggers.js';
import { getCard } from '../../lib/weapons.js';
import { lockScroll } from '../../lib/scrollLock.js';
import { subscribeToTable } from '../../lib/realtime.js';

/**
 * The table, reaching your sheet: your turn called, an effect laid on you, a
 * hit landing.
 *
 * Jules, 2026-08-31: "the turn start then become automatic with a pop up full
 * screen notification and the end turn is manual by player when done." And
 * 2026-09-01, the other two: an effect a Game Master aims at you "needs to
 * populate on the target trackers", and "Health, shield and other changes by
 * spells and abilities need to be auto applied based on the result."
 *
 * ------------------------------------------------------------- how it arrives
 * Not by anybody writing to this sheet. A Game Master cannot, and the whole
 * site is built on their not being able to: RLS refuses it, and every campaign
 * page is careful to say so. What crosses is an **announcement** on the table
 * log, and this is the component that hears its own name in one:
 *
 *   your-turn   the runner landed on you. Your own client starts your own turn
 *               through your own patch and covers the screen.
 *   effect      a use across the table was aimed at you and lays something.
 *               Your client lays the same row on your own tracker, through
 *               `layEffect`, so a delivery that somehow arrives twice
 *               refreshes one row rather than doubling it.
 *   apply       a rolled result landed on you. Your client takes it through
 *               your own Armor and Shield at the moment it lands — the pools
 *               as *you* hold them, not as the Game Master's copy held them a
 *               second ago — and the ledger says who did it.
 *
 * The sheet is still the only writer of its own numbers. The turn arrives the
 * way a knock on the door arrives: somebody else made the noise, and you are
 * the one who opens it.
 *
 * ------------------------------------------------------------------ the guard
 * Nothing is acted on twice: every row's id is remembered, so a reconnect that
 * replays the channel, or a second copy of the sheet open on a phone, cannot
 * hand out two turns' worth of Action Points or land one Fireball twice. And
 * nothing is acted on at all unless the sheet is yours: `canEdit` is false for
 * a viewer, so nothing is subscribed and nothing is written.
 *
 * ------------------------------------------------------------------ the cover
 * Full screen, on purpose, and it is the one thing on the site that covers the
 * sheet. It now says what the boundary sets off, exactly as the Turn block's
 * own prompt does — the same rows, with the same Roll beside a clause that
 * rolls and the same one labelled tap to put the number on your sheet ("when
 * an entity starts a turn, it should prompt needed rolls, same at end turn.
 * Like renew or wall of fire"). Ending from the cover walks through the end
 * boundary the same way when anything is waiting on it.
 *
 * It closes two ways: End Turn, which is the real one, and Keep playing, which
 * puts the cover away and leaves the turn running. The turn has already
 * started either way, because that is what the announcement did.
 */
export default function TurnCall({ character, patch, canEdit = false }) {
  const { tables, log } = useCampaignLog();
  // { key, round, name, campaignId, phase: 'start' | 'end', triggers }
  const [call, setCall] = useState(null);

  /* Every announcement this sheet has already acted on. A channel that
     reconnects replays nothing by design, but a resync, a second tab or a Game
     Master pressing Next twice all can, and two Start Turns is two turns of
     Action Points out of thin air. Deliveries are guarded by the same set for
     the same reason. */
  const actedRef = useRef(new Set());

  const characterId = character?.id;
  const ids = tables.map((table) => table.id).sort().join(',');

  /* Read through a ref so the subscription below stays on the two ids it
     actually depends on. `patch` and `character` are new on every render of the
     sheet, and re-subscribing on each of those would tear the channel down
     several times a second while somebody types. */
  const stateRef = useRef({ character, patch, canEdit });
  useEffect(() => {
    stateRef.current = { character, patch, canEdit };
  });

  useEffect(() => {
    if (!canEdit || !characterId || !ids) return undefined;

    /* One row, routed. Each branch checks the row names this character, checks
       it has not been acted on, and writes through the sheet's own patch. */
    const act = (row, campaignId) => {
      const held = stateRef.current;
      if (!held.canEdit) return;

      if (row.kind === 'turn' && row.data?.move === 'your-turn') {
        if (row.data?.character !== characterId) return;
        if (actedRef.current.has(row.id)) return;
        actedRef.current.add(row.id);

        /* What this boundary sets off, read *before* the turn starts: starting
           is what ticks the tracker, and a reminder computed afterwards would
           be reading the rows a turn late. */
        const triggers = turnTriggers(held.character, 'start');

        /* The turn itself, through this sheet's own patch and the sheet's own
           `startTurn`. Nothing about it is special because it was called from
           across the table. */
        held.patch(startTurn(held.character));

        setCall({
          key: row.id,
          round: Math.max(1, Math.floor(Number(row.data.round) || 1)),
          campaignId,
          name: held.character?.name ?? '',
          phase: 'start',
          triggers: triggers.any ? triggers : null,
        });
        return;
      }

      if (row.kind === 'effect') {
        const mine = (row.data?.targets ?? []).some(
          (target) => target.character === characterId
        );
        if (!mine || !row.data?.effect) return;
        if (actedRef.current.has(row.id)) return;
        actedRef.current.add(row.id);

        /* The same row the caster's own tracker would have carried, laid on
           this one. `layEffect` is what makes a second delivery harmless: the
           same card lands as a refresh of the row that is already there. */
        held.patch({ effects: layEffect(held.character?.effects, row.data.effect) });
        return;
      }

      if (row.kind === 'apply') {
        const target = (row.data?.targets ?? []).find(
          (entry) => entry.character === characterId
        );
        if (!target) return;
        if (actedRef.current.has(row.id)) return;
        actedRef.current.add(row.id);

        /* Through this body's own Armor and Shield, onto this body's own
           pools, with the ledger naming who did it. The landings arrive as
           rolled — Armor is the target's business, so it is done here. */
        const body = characterDelta(held.character, {
          kind: row.data?.kind,
          landings: target.landings,
          note: `${row.actor || 'The table'}: ${getCard(row.data?.card)?.name ?? row.title}`,
        });
        if (body) held.patch(body);
      }
    };

    const drop = ids.split(',').map((campaignId) =>
      subscribeToTable({
        table: 'campaign_events',
        filter: `campaign_id=eq.${campaignId}`,
        onChange: (payload) => {
          if (payload.eventType !== 'INSERT') return;
          if (payload.new) act(payload.new, campaignId);
        },
      })
    );

    return () => drop.forEach((off) => off());
  }, [canEdit, characterId, ids]);

  /* The cover holds the page still while it is up, the way a dialog does. */
  useEffect(() => {
    if (!call) return undefined;
    return lockScroll();
  }, [call]);

  /* The roll-and-take half of the rows on the cover, shared with the Turn
     block's own prompt so a clause rolls and lands the same way from both. */
  const { tray, landed, busy, throwClause, takeIt } = useClauseRolls(
    character,
    canEdit ? patch : null
  );

  const done = useCallback(() => {
    const held = stateRef.current;

    /* The end boundary gets its say first, when it has one: the cover swaps to
       what the bottom of the turn sets off, and the next press is the real
       end. Same walk the Turn block takes — press, read, press. */
    if (call?.phase !== 'end') {
      const triggers = turnTriggers(held.character, 'end');
      if (triggers.any) {
        setCall((was) => (was ? { ...was, phase: 'end', triggers } : was));
        return;
      }
    }

    const round = call?.round ?? normalizeTurn(held.character?.turn_state).n;

    held.patch(endTurn(held.character));
    log(turnDoneEvent(held.character, round));
    setCall(null);
  }, [call, log]);

  /* Enter ends the turn and Escape puts the cover away. Caught while the cover
     is up and nowhere else, so neither key means anything on an ordinary sheet.
     And not while a throw from the cover has the dice up: Enter then belongs to
     the dice, and a turn ended under them would be the cover mishearing. */
  useEffect(() => {
    if (!call || busy) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') setCall(null);
      if (event.key === 'Enter') done();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [call, busy, done]);

  if (!call) return null;

  const ending = call.phase === 'end';

  return (
    <div className="turn-call" role="dialog" aria-modal="true" aria-label="Your turn">
      <div className="turn-call-body">
        <span className="turn-call-round">Round {call.round}</span>
        <h2 className="turn-call-title">{ending ? 'Ending Your Turn' : 'Your Turn'}</h2>
        <p className="turn-call-line">
          {ending
            ? 'Before it closes, here is what happens at the bottom of it.'
            : 'Your Action Points are back and everything running on you has ticked. End it when you are done and the table moves on.'}
        </p>

        {/* What this boundary sets off: the same rows the Turn block's own
            prompt prints, on the cover, because the cover is where this turn
            actually started. Only when there is anything to say. */}
        {call.triggers && (
          <div className="turn-call-triggers">
            {call.triggers.rows.map((row) => (
              <TriggerRow
                key={row.id}
                row={row}
                landed={landed}
                canApply={canEdit}
                onThrow={tray ? (key, spec) => throwClause(row, key, spec) : null}
                onTake={(key) => takeIt(row, key)}
                onOpen={null}
              />
            ))}

            {call.triggers.ending.length > 0 && (
              <p className="turn-prompt-note turn-prompt-ending">
                <b>Runs out {ending ? 'soon' : 'on this turn'}:</b>{' '}
                {call.triggers.ending.map((row) => row.name).join(', ')}.
              </p>
            )}
          </div>
        )}

        <div className="turn-call-acts">
          <button type="button" className="btn btn-primary turn-call-end" onClick={done}>
            {ending ? 'End it' : 'End my turn'}
          </button>
          <button type="button" className="btn btn-minimal" onClick={() => setCall(null)}>
            Keep playing
          </button>
        </div>

        <p className="turn-call-hint">
          Keep playing puts this away and leaves your turn running. The End Turn button on your
          Turn block does the same thing as the one above.
        </p>
      </div>
    </div>
  );
}
