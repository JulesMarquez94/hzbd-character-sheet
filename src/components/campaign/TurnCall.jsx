import { useCallback, useEffect, useRef, useState } from 'react';
import { useCampaignLog } from '../../context/campaign-log.js';
import { turnDoneEvent } from '../../lib/campaignLog.js';
import { endTurn, normalizeTurn, startTurn } from '../../lib/combatTurn.js';
import { lockScroll } from '../../lib/scrollLock.js';
import { subscribeToTable } from '../../lib/realtime.js';

/**
 * Your turn, called from the other side of the table.
 *
 * Jules, 2026-08-31: "the turn start then become automatic with a pop up full
 * screen notification and the end turn is manual by player when done."
 *
 * ------------------------------------------------------------- how it arrives
 * Not by anybody writing to this sheet. A Game Master cannot, and the whole
 * site is built on their not being able to: RLS refuses it, and every campaign
 * page is careful to say so. What crosses is an **announcement** on the table
 * log, and this is the component that hears its own name in it.
 *
 *   the Game Master advances the order
 *   an event lands saying "Turn 4, and it is this character's"
 *   this sheet sees its own id, starts its own turn, and covers the screen
 *   the player presses End Turn, which ends it here and says so back
 *
 * So the sheet is still the only writer of its own numbers. The turn arrives the
 * way a knock on the door arrives: somebody else made the noise, and you are the
 * one who opens it.
 *
 * ------------------------------------------------------------- what it starts
 * `startTurn`, unchanged, and that is deliberate. It is the same function the
 * Turn button on block 6 calls, so an automatic turn and a hand-pressed one are
 * the same turn: Action Points back, the tracker ticked, every creature on the
 * board refilled. A second, quieter version of a turn start is exactly the sort
 * of thing that drifts.
 *
 * ------------------------------------------------------------------ the guard
 * Two things it will not do, and both matter more than they look:
 *
 *   **It never starts a turn twice.** The row's own id is remembered, so a
 *   reconnect that replays the channel, or a second copy of the sheet open on a
 *   phone, cannot hand out two turns' worth of Action Points.
 *
 *   **It only listens when the sheet is yours.** A viewer reading somebody's
 *   public sheet is not the person whose turn it is, and `canEdit` is false for
 *   them, so nothing is subscribed and nothing is written.
 *
 * ------------------------------------------------------------------ the cover
 * Full screen, on purpose, and it is the one thing on the site that covers the
 * sheet. A player who has been watching the fight go round for ten minutes is
 * not looking at their own Action Points, and a badge in a corner is a thing you
 * find after somebody says your name out loud. This is the sheet saying it.
 *
 * It closes two ways: End Turn, which is the real one, and Dismiss, which puts
 * the cover away and leaves the turn running. The turn has already started
 * either way, because that is what the announcement did.
 */
export default function TurnCall({ character, patch, canEdit = false }) {
  const { tables, log } = useCampaignLog();
  const [call, setCall] = useState(null); // { round, name, campaignId, key }

  /* Every announcement this sheet has already acted on. A channel that
     reconnects replays nothing by design, but a resync, a second tab or a Game
     Master pressing Next twice all can, and two Start Turns is two turns of
     Action Points out of thin air. */
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

    const drop = ids.split(',').map((campaignId) =>
      subscribeToTable({
        table: 'campaign_events',
        filter: `campaign_id=eq.${campaignId}`,
        onChange: (payload) => {
          if (payload.eventType !== 'INSERT') return;
          const row = payload.new;
          if (row?.kind !== 'turn') return;
          if (row?.data?.move !== 'your-turn') return;
          if (row?.data?.character !== characterId) return;
          if (actedRef.current.has(row.id)) return;
          actedRef.current.add(row.id);

          const held = stateRef.current;
          if (!held.canEdit) return;

          /* The turn itself, through this sheet's own patch and the sheet's own
             `startTurn`. Nothing about it is special because it was called from
             across the table. */
          held.patch(startTurn(held.character));

          setCall({
            key: row.id,
            round: Math.max(1, Math.floor(Number(row.data.round) || 1)),
            campaignId,
            name: held.character?.name ?? '',
          });
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

  const done = useCallback(() => {
    const held = stateRef.current;
    const round = call?.round ?? normalizeTurn(held.character?.turn_state).n;

    held.patch(endTurn(held.character));
    log(turnDoneEvent(held.character, round));
    setCall(null);
  }, [call, log]);

  /* Enter ends the turn and Escape puts the cover away. Caught while the cover
     is up and nowhere else, so neither key means anything on an ordinary sheet. */
  useEffect(() => {
    if (!call) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') setCall(null);
      if (event.key === 'Enter') done();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [call, done]);

  if (!call) return null;

  return (
    <div className="turn-call" role="dialog" aria-modal="true" aria-label="Your turn">
      <div className="turn-call-body">
        <span className="turn-call-round">Round {call.round}</span>
        <h2 className="turn-call-title">Your Turn</h2>
        <p className="turn-call-line">
          Your Action Points are back and everything running on you has ticked. End it when you
          are done and the table moves on.
        </p>

        <div className="turn-call-acts">
          <button type="button" className="btn btn-primary turn-call-end" onClick={done}>
            End my turn
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
