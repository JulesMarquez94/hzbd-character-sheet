import { useCallback, useEffect, useMemo } from 'react';
import { useDiceTray } from '../../context/dice-tray.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { rollEvent } from '../../lib/logChain.js';
import DiceWatch from '../campaign/DiceWatch.jsx';
import { abilitySources, allSourceCards } from '../../lib/abilitySources.js';
import { POOLS } from '../../lib/interventions.js';

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
export default function DiceSheet({ character, patch }) {
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

  /* Every card this character holds, as ids. The tray needs it to know whether
     an after-the-roll ability like DRAGON'S FAVOR is one of theirs, and this is
     the same walk the Abilities tab does. */
  const cards = useMemo(
    () => allSourceCards(abilitySources(character)).map((card) => card.id),
    [character]
  );

  /**
   * Paying for a roll that has already landed.
   *
   * Its own function rather than part of `logRoll` because it happens at a
   * different moment and to a different thing: the log is told what happened,
   * and this changes what the character has. Floored at zero, because a pool is
   * never negative and the offer was only made because there was one to spend.
   */
  const paySpend = useCallback(
    (spends) => {
      if (!spends || !patch) return;
      const body = {};
      for (const [what, amount] of Object.entries(spends)) {
        const column = POOLS[what];
        if (!column) continue;
        body[column] = Math.max(0, (Number(character?.[column]) || 0) - amount);
      }
      if (Object.keys(body).length > 0) patch(body);
    },
    [patch, character]
  );

  useEffect(() => {
    if (!hold) return undefined;
    hold({ character, logRoll, cards, paySpend });
    return () => hold(null);
  }, [hold, character, logRoll, cards, paySpend]);

  return <DiceWatch tables={tables} mine={character?.id} />;
}
