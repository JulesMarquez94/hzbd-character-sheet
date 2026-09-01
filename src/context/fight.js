import { createContext, useContext } from 'react';

/**
 * The fight this sheet is standing in, when the Game Master is running one.
 *
 * `{ live, roster }`, or null outside a provider and off the table. The roster
 * is everybody in the running order as target chips — see FightProvider.jsx
 * for where it comes from and what a player is allowed to know about it.
 */
export const FightContext = createContext(null);

export function useFight() {
  return useContext(FightContext);
}
