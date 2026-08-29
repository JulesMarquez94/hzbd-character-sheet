import { useCallback, useEffect, useMemo, useState } from 'react';
import { CampaignLogContext } from '../../context/campaign-log.js';
import { listTables, postEvent } from '../../lib/campaignLog.js';
import { subscribeToTable } from '../../lib/realtime.js';

/**
 * Which tables this sheet is sitting at, held for the whole page.
 *
 * Two things need the answer and neither should ask for it twice: the Character
 * tab grows one log block per campaign, and every block that spends something
 * posts what it did to all of them. So the membership is read once here and
 * handed down through context the way the card stack is.
 *
 * The subscription is what makes joining a table feel like joining a table. A
 * player redeems a join code on another page, or a DM links their sheet, and the
 * log block appears on the tab they are looking at without a reload.
 *
 * `canWrite` is the sheet's own editor guard, passed straight through. A viewer
 * reading somebody's public sheet may well be at the same table and should see
 * the log; what they must not do is post to it as somebody else's character.
 * The schema refuses that anyway (see claim_event_actor), and this is the same
 * refusal made before the round trip rather than after it.
 */
export default function LogProvider({ characterId, canWrite = false, children }) {
  const [tables, setTables] = useState([]);

  const read = useCallback(() => {
    if (!characterId) return undefined;
    listTables(characterId)
      .then(setTables)
      // A sheet whose tables cannot be read is a sheet with no log blocks on
      // it, which is what an unlinked sheet looks like anyway.
      .catch(() => setTables([]));
    return undefined;
  }, [characterId]);

  /* The read is the whole effect, and every write it makes is inside a callback
     of its own. See the same shape in LogBlock.jsx. */
  useEffect(read, [read]);

  useEffect(() => {
    if (!characterId) return undefined;

    return subscribeToTable({
      table: 'campaign_members',
      filter: `character_id=eq.${characterId}`,
      onChange: read,
      onResync: read,
    });
  }, [characterId, read]);

  const value = useMemo(
    () => ({
      tables,
      log: (event) => {
        if (!canWrite || !event) return;
        postEvent(tables, { ...event, characterId });
      },
    }),
    [tables, canWrite, characterId]
  );

  return <CampaignLogContext.Provider value={value}>{children}</CampaignLogContext.Provider>;
}
