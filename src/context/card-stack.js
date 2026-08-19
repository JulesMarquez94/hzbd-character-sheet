import { createContext, useContext } from 'react';

/**
 * The pile of cards dealt in front of the sheet. The provider lives in
 * components/CardStack.jsx; anything that can open a card reaches it here.
 */
export const CardStackContext = createContext(null);

/** `{ openCard, openValue, close, depth }`, or null outside a provider. */
export function useCardStack() {
  return useContext(CardStackContext);
}
