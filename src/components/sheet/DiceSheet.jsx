import { useCallback, useEffect } from 'react';
import { useDiceTray } from '../../context/dice-tray.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { rollEvent } from '../../lib/logChain.js';

/**
 * A sheet telling the tray who is holding it, and how to tell the table.
 *
 * Renders nothing. It exists because the two halves of a logged roll are in two
 * different places: the tray is mounted above the router and knows how to roll,
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
  const { log } = useCampaignLog();

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

  return null;
}
