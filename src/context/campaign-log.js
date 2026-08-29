import { createContext, useContext } from 'react';

/**
 * The tables this sheet is sitting at, and the way to tell them something.
 *
 * `{ tables, log }`: tables is `[{ id, name }]`, log takes an event built by
 * src/lib/campaignLog.js and posts it to every one of them.
 *
 * The provider lives in components/campaign/LogProvider.jsx, exactly as the
 * card stack's does. Anything that spends something reaches it here.
 */
export const CampaignLogContext = createContext(null);

/**
 * Never null, which is the whole point of the default below.
 *
 * A block that plays a card is the same block on a sheet sitting at three
 * campaigns and on one sitting at none, and neither of them should have to ask
 * which it is before calling `log`. Outside a provider the tables are empty and
 * logging is a no-op, so the call site stays one line.
 */
const ALONE = { tables: [], log: () => {} };

export function useCampaignLog() {
  return useContext(CampaignLogContext) ?? ALONE;
}
