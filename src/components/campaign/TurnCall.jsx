import { useEffect, useRef, useState } from 'react';
import { TriggerRow } from '../sheet/TurnPrompt.jsx';
import { useClauseRolls, useUpkeep } from '../sheet/useClauseRolls.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { turnEvent } from '../../lib/campaignLog.js';
import { characterDelta } from '../../lib/combatApply.js';
import {
  endCombat,
  layEffect,
  normalizeTurn,
  startCombat,
  startTurn,
} from '../../lib/combatTurn.js';
import { turnTriggers } from '../../lib/turnTriggers.js';
import { getCard } from '../../lib/weapons.js';
import { lockScroll } from '../../lib/scrollLock.js';
import { subscribeToTable } from '../../lib/realtime.js';

/**
 * The table, reaching your sheet: the bell, your turn called, an effect laid
 * on you, a hit landing.
 *
 * ------------------------------------------------------------- how it arrives
 * Not by anybody writing to this sheet. A Game Master cannot, and the whole
 * site is built on their not being able to: RLS refuses it, and every campaign
 * page is careful to say so. What crosses is an **announcement** on the table
 * log, and this is the component that hears its own name in one:
 *
 *   initiative  the bell. The runner rolled a fight this character is in, so
 *               the sheet enters combat through its own `startCombat`: Action
 *               Points full, reactions at nothing but what PREPARED grants,
 *               the gear's Shield handed over. "When a character is connected
 *               to a campaign, he cannot start combat himself" — because the
 *               table starts it, here.
 *   your-turn   the runner landed on you. The cover goes up saying so, with
 *               whatever the boundary sets off printed on it, and **Start my
 *               turn** is yours to press (Jules, 2026-09-01: the cover should
 *               not offer "keep playing or end my turn... it should show
 *               something like Start My Turn"). Nothing ticks until you do —
 *               the same press, read, press the Turn block has always kept.
 *               Ending comes later, from the Turn block, when you are done.
 *   effect      a use across the table was aimed at you and lays something.
 *               Your client lays the same row on your own tracker, through
 *               `layEffect`, so a delivery that somehow arrives twice
 *               refreshes one row rather than doubling it.
 *   apply       a rolled result landed on you. Your client takes it through
 *               your own Armor and Shield at the moment it lands — the pools
 *               as *you* hold them, not as the Game Master's copy held them a
 *               second ago — and the ledger says who did it.
 *   fight-over  the fight ended, so the sheet leaves combat through its own
 *               `endCombat`: the count back to nothing, the tracker untouched.
 *
 * The sheet is still the only writer of its own numbers. The turn arrives the
 * way a knock on the door arrives: somebody else made the noise, and you are
 * the one who opens it.
 *
 * ------------------------------------------------------------------ the guard
 * Nothing is acted on twice: every row's id is remembered, so a reconnect that
 * replays the channel, or a second copy of the sheet open on a phone, cannot
 * hand out two bells or land one Fireball twice. And nothing is acted on at
 * all unless the sheet is yours: `canEdit` is false for a viewer, so nothing
 * is subscribed and nothing is written.
 */
export default function TurnCall({ character, patch, canEdit = false }) {
  const { tables, log } = useCampaignLog();
  // { key, round, campaignId, triggers }
  const [call, setCall] = useState(null);
  /* The bell's own notice: your roll and your place in the order, cleared by
     time, a tap, or your first turn arriving. { key, init, place, count } */
  const [bell, setBell] = useState(null);

  /* Every announcement this sheet has already acted on. A channel that
     reconnects replays nothing by design, but a resync, a second tab or a Game
     Master pressing Next twice all can, and two bells is two handfuls of
     Shield out of thin air. Deliveries are guarded by the same set for the
     same reason. */
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

      if (row.kind === 'turn' && row.data?.move === 'initiative') {
        /* The bell, for everyone the order names. A sheet not in the order —
           linked after the roll, say — hears nothing and stays out. */
        const order = row.data?.order ?? [];
        const at = order.findIndex(
          (entry) => entry.kind === 'member' && entry.ref === characterId
        );
        if (at < 0) return;
        if (actedRef.current.has(row.id)) return;
        actedRef.current.add(row.id);

        held.patch(startCombat(held.character));

        /* And the notice: "Encounter start. Your initiative is X. You play
           2nd." Timed, because it is news rather than a question. */
        setBell({
          key: row.id,
          init: Math.floor(Number(order[at].init) || 0),
          place: at + 1,
          count: order.length,
        });
        return;
      }

      if (row.kind === 'turn' && row.data?.move === 'fight-over') {
        /* And the bell's other end. Only a sheet that is actually in a fight
           has anything to leave. */
        if (!normalizeTurn(held.character?.turn_state).inCombat) return;
        if (actedRef.current.has(row.id)) return;
        actedRef.current.add(row.id);

        held.patch(endCombat());
        return;
      }

      if (row.kind === 'turn' && row.data?.move === 'your-turn') {
        if (row.data?.character !== characterId) return;
        if (actedRef.current.has(row.id)) return;
        actedRef.current.add(row.id);

        /* Your turn outranks the bell's notice. */
        setBell(null);

        /* Nothing is started here. The cover says the order reached you and
           what the boundary sets off; the press is yours. */
        setCall({
          key: row.id,
          round: Math.max(1, Math.floor(Number(row.data.round) || 1)),
          campaignId,
          triggers: (() => {
            const found = turnTriggers(held.character, 'start');
            return found.any ? found : null;
          })(),
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
          /* And what it was made of, so the ledger row names the effect as well
             as its source. The delivery already carries the types; nothing here
             works them out. See `deltaNote` in combatApply.js. */
          types: row.data?.types ?? [],
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

  /* The bell's notice clears itself: it is news, not a question. */
  useEffect(() => {
    if (!bell) return undefined;
    const id = setTimeout(() => setBell(null), 8000);
    return () => clearTimeout(id);
  }, [bell]);

  /* The roll-and-take half of the rows on the cover, and the Upkeep's keep-or-
     drop, shared with the Turn block's own prompt so a boundary reads the same
     from both. */
  const { tray, landed, busy, throwClause, takeIt } = useClauseRolls(
    character,
    canEdit ? patch : null
  );
  const { upkeep, canPay, pay, drop: dropRow } = useUpkeep(character, canEdit ? patch : null);

  /**
   * The press. Your Action Points come back, everything running on you ticks,
   * and the table is told — the same start the Turn block's own button makes,
   * because an announced turn is not a different kind of turn.
   */
  function start() {
    const held = stateRef.current;
    const turn = normalizeTurn(held.character?.turn_state);
    held.patch(startTurn(held.character));
    log(turnEvent('turn', held.character, turn));
    setCall(null);
  }

  /* Enter starts the turn and Escape puts the cover away — the Turn block can
     still start it, since the order is standing on you either way. Not while a
     throw from the cover has the dice up: Enter then belongs to the dice. */
  useEffect(() => {
    if (!call || busy) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') setCall(null);
      if (event.key === 'Enter') start();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, busy]);

  if (!call) {
    if (!bell) return null;

    /* The bell's notice: timed, tappable, and outranked by the turn call. */
    return (
      <div
        className="turn-call is-bell"
        role="status"
        onClick={() => setBell(null)}
        title="This clears itself. Tap to put it away."
      >
        <div className="turn-call-body">
          <span className="turn-call-round">Encounter start</span>
          <h2 className="turn-call-title">Initiative {bell.init}</h2>
          <p className="turn-call-line">
            You play {ordinal(bell.place)} of {bell.count}. Your Action Points are up, whatever
            your gear grants at the bell is on, and your turn will cover the screen when the
            order reaches you.
          </p>
          <p className="turn-call-hint">This clears itself in a few seconds. Tap to put it away.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="turn-call" role="dialog" aria-modal="true" aria-label="Your turn">
      <div className="turn-call-body">
        <span className="turn-call-round">Round {call.round}</span>
        <h2 className="turn-call-title">Your Turn</h2>
        <p className="turn-call-line">
          The order reached you. Starting brings your Action Points back and ticks everything
          running on you; end it from your Turn block when you are done.
        </p>

        {/* What this boundary sets off: the same rows the Turn block's own
            prompt prints, on the cover, because the cover is where this turn
            is about to start. Only when there is anything to say. */}
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
                upkeep={upkeep}
                canPay={canPay}
                onPay={pay}
                onLetGo={dropRow}
                onOpen={null}
              />
            ))}

            {call.triggers.ending.length > 0 && (
              <p className="turn-prompt-note turn-prompt-ending">
                <b>Runs out on this turn:</b>{' '}
                {call.triggers.ending.map((row) => row.name).join(', ')}.
              </p>
            )}
          </div>
        )}

        <div className="turn-call-acts">
          <button type="button" className="btn btn-primary turn-call-end" onClick={start}>
            Start my turn
          </button>
          <button type="button" className="btn btn-minimal" onClick={() => setCall(null)}>
            Not yet
          </button>
        </div>

        <p className="turn-call-hint">
          Not yet puts this away without starting anything. The Start Turn button on your Turn
          block does the same thing as the one above.
        </p>
      </div>
    </div>
  );
}

/** "1st", "2nd", "3rd", "4th" and so on, for the place in the order. */
function ordinal(n) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const word = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th';
  return `${n}${word}`;
}
