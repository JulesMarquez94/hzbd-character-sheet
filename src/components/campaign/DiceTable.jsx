import { useCallback, useEffect } from 'react';
import { useDiceTray } from '../../context/dice-tray.js';
import { rollEvent } from '../../lib/logChain.js';
import { postEvent } from '../../lib/campaignLog.js';

/**
 * The encounter page telling the tray who is holding it: the table itself.
 *
 * DiceSheet.jsx does this for a character sheet, and until now nothing did it
 * for the campaign page — which meant an enemy's whole chain of dice landed on
 * the Game Master's screen and *nowhere else*. The use was logged (EnemyBlock
 * writes it as the table), but the throws under it vanished: no rows in the
 * feed, no replay on any player's tray, a fight the players could hear being
 * described but never see rolled.
 *
 * So this holds the tray with the table's own voice. Every logged roll made on
 * the encounter page is written with no character on it — the schema's "the
 * table speaking", which only the Game Master may do, and the Game Master is
 * the only one this is mounted for. The actor named on the row is whichever
 * enemy threw, which the tray now hands over off the spec's own note (see
 * `tell` in DiceTray.jsx), so the feed reads "2.Fenrat · Weapon Attack Roll"
 * exactly as it reads a player's.
 *
 * No cards, no paySpend: the table holds no after-the-roll abilities and pays
 * for nothing. Renders nothing.
 */
export default function DiceTable({ campaignId, campaignName = '' }) {
  const hold = useDiceTray()?.hold;

  const logRoll = useCallback(
    (result, about) => {
      if (!campaignId) return;
      postEvent([{ id: campaignId, name: campaignName }], {
        ...rollEvent(result, { name: about?.actor || 'The table' }, about),
        characterId: null,
      });
    },
    [campaignId, campaignName]
  );

  useEffect(() => {
    if (!hold) return undefined;
    hold({ character: null, logRoll, cards: [] });
    return () => hold(null);
  }, [hold, logRoll]);

  return null;
}
