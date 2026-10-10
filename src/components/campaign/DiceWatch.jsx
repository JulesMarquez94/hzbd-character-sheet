import { useEffect } from 'react';
import { useDiceTray } from '../../context/dice-tray.js';
import { resultFromRow, worthReplaying } from '../../lib/logChain.js';
import { subscribeToTable } from '../../lib/realtime.js';

/**
 * Somebody else's dice, on your table.
 *
 * One subscription per campaign, listening for the same inserts the log block
 * listens for and putting the ones worth watching on the tray. The row carries
 * every die that was thrown (see rollEvent), so this is not a second roll of the
 * same name: it is the same dice, showing the same faces, on another screen.
 *
 * ------------------------------------------------------------------ two homes
 * The same component in both places the table log lives, and for the same
 * reason: wherever you can read that a roll happened, you should be able to
 * watch it happen.
 *
 *   a character sheet  the tables that sheet sits at, and your own character is
 *                      the one whose rolls are not replayed at you.
 *   the campaign page  the one table, and *every* character of yours at it. A
 *                      player may have two sheets at one table, and a GM
 *                      watching the page has none at all, which is why `mine`
 *                      is a list and is allowed to be empty.
 *
 * It used to be on the sheet alone, which left the campaign page silent. That is
 * the page a Game Master sits on all evening, so it was the wrong page to leave
 * out.
 *
 * ------------------------------------------------------------- what it skips
 * It listens on the realtime channel and never on a fetch, which is what keeps a
 * backlog off the table without having to detect one. A channel only carries
 * rows written after you joined it, so a laptop that has been shut all evening
 * reconnects, refetches the feed into the log block, and replays nothing.
 * `worthReplaying` then filters the rest: your own rolls, anything that arrived
 * late enough to be history, and the queue's own cap is the tray's.
 *
 * Renders nothing. A roll it declines to replay is not a roll it hides: every
 * row still lands in the block underneath.
 */
export default function DiceWatch({ tables, mine = [], table = false }) {
  const watch = useDiceTray()?.watch;

  /* Joined rather than passed as an array, so a parent that rebuilds the list on
     every render does not tear down and rebuild the channel with it. */
  const ours = [].concat(mine ?? []).filter(Boolean).sort().join(',');
  const ids = tables.map((table) => table.id).sort().join(',');

  useEffect(() => {
    if (!watch || !ids) return undefined;

    const drop = ids.split(',').map((campaignId) =>
      subscribeToTable({
        table: 'campaign_events',
        filter: `campaign_id=eq.${campaignId}`,
        onChange: (payload) => {
          if (payload.eventType !== 'INSERT') return;
          const row = payload.new;
          /* Whose it is and how old it is are the row's business and settled
             here. How many are already waiting is the queue's, and the queue is
             the tray's, so the cap is applied there. `table` says the reader is
             the Game Master, whose own enemy rolls carry no character and must
             not be replayed back at the screen that threw them. */
          if (!worthReplaying(row, { mine: ours ? ours.split(',') : [], table })) return;

          const result = resultFromRow(row);
          if (result) watch({ key: row.id, name: row.title, actor: row.actor, result });
        },
      })
    );

    return () => drop.forEach((off) => off());
  }, [watch, ids, ours, table]);

  return null;
}
