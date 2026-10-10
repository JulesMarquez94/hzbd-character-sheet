import { createContext, useContext } from 'react';

/**
 * The fight this sheet is standing in, when the Game Master is running one.
 *
 * `{ live, roster, fights, asking }`, or null outside a provider and off the
 * table. The roster is everybody in the running order as target chips;
 * `fights` is the per-campaign reading behind it — the order, the round and
 * whose turn was last called — for the block that draws the tracker on a
 * linked sheet. See FightProvider.jsx for where it all comes from and what a
 * player is allowed to know.
 *
 * `asking` is the tables waiting on this sheet's own Initiative roll, which is
 * the one thing here that is a question rather than a reading. `live` is a
 * *running* fight and stays false while an ask stands on its own.
 */
export const FightContext = createContext(null);

export function useFight() {
  return useContext(FightContext);
}
