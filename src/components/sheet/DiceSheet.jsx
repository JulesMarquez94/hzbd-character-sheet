import { useCallback, useEffect } from 'react';
import { useDiceTray } from '../../context/dice-tray.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { resultFromRow, rollEvent, worthReplaying } from '../../lib/logChain.js';
import { subscribeToTable } from '../../lib/realtime.js';

/**
 * A sheet telling the tray who is holding it, and how to tell the table.
 *
 * It draws nothing of its own. It exists because the two halves of a logged roll
 * are in two different places: the tray is mounted above the router and knows how to roll,
 * and the log provider is inside the sheet and knows which tables to write to.
 * This component is the one spot where both are in scope, so it is where they
 * are introduced.
 *
 * ------------------------------------------------------- why it is not in the tray
 * It lives here, in the sheet's own folder, rather than beside the tray, and
 * that is a bundling decision as much as a tidiness one.
 *
 * `campaignLog.js` imports `combatBar.js`, which reaches the whole codex. The
 * tray is imported eagerly by App.jsx so that its button is on every page, so a
 * single import of `rollEvent` from inside the tray put four hundred kilobytes
 * of cards on the landing page. Keeping the event-building here leaves the tray
 * a component that knows about dice and nothing else, and leaves the codex in
 * the chunk that already needed it.
 *
 * So the tray is handed a function rather than a module: it calls `logRoll` when
 * a roll finishes and has no idea what happens next.
 *
 * ------------------------------------------------------------------ and only here
 * It follows that a roll made anywhere but your own sheet reaches no table. That
 * is the right answer rather than a gap: you roll your own character, and away
 * from its sheet there is no character to sign the row.
 */
export default function DiceSheet({ character }) {
  /* Allowed to find nothing. `useDiceTray` reads a context that defaults to
     null, so a sheet mounted without a tray around it still renders. */
  const hold = useDiceTray()?.hold;
  const { log, tables } = useCampaignLog();

  /* What the tray calls when a roll settles. The character is closed over rather
     than passed back in, so the row is signed by whoever the sheet was showing
     at the moment the dice were thrown. */
  const logRoll = useCallback(
    (result, about) => log(rollEvent(result, character, about)),
    [log, character]
  );

  useEffect(() => {
    if (!hold) return undefined;
    hold({ character, logRoll });
    return () => hold(null);
  }, [hold, character, logRoll]);

  return <DiceWatch tables={tables} mine={character?.id ?? null} />;
}

/**
 * Somebody else's dice, on your table.
 *
 * One subscription per campaign this sheet sits at, listening for the same
 * inserts the log block listens for and putting the ones worth watching on the
 * tray. The row carries every die that was thrown (see rollEvent), so this is
 * not a second roll of the same name: it is the same dice, showing the same
 * faces, on another screen.
 *
 * It listens on the realtime channel and never on a fetch, which is what keeps a
 * backlog off the table without having to detect one. A channel only carries
 * rows written after you joined it, so a laptop that has been shut all evening
 * reconnects, refetches the feed into the log block, and replays nothing. What
 * `worthReplaying` then filters is the rest: your own rolls, anything that
 * arrived late enough to be history, and the overflow when four people act at
 * once.
 *
 * Renders nothing. A roll it declines to replay is not a roll it hides: every
 * row still lands in the block underneath.
 */
function DiceWatch({ tables, mine }) {
  const watch = useDiceTray()?.watch;

  useEffect(() => {
    if (!watch || tables.length === 0) return undefined;

    const drop = tables.map((table) =>
      subscribeToTable({
        table: 'campaign_events',
        filter: `campaign_id=eq.${table.id}`,
        onChange: (payload) => {
          if (payload.eventType !== 'INSERT') return;
          const row = payload.new;
          /* Whose it is and how old it is are the row's business and settled
             here. How many are already waiting is the queue's, and the queue is
             the tray's, so the cap is applied there. */
          if (!worthReplaying(row, { mine })) return;

          const result = resultFromRow(row);
          if (result) watch({ key: row.id, name: row.title, actor: row.actor, result });
        },
      })
    );

    return () => drop.forEach((off) => off());
  }, [watch, tables, mine]);

  return null;
}
