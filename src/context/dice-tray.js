import { createContext, useContext } from 'react';

/**
 * The dice tray: the button in the corner, and the surface a roll lands on.
 * The provider lives in components/DiceTray.jsx; anything that can ask for a
 * roll reaches it here.
 */
export const DiceTrayContext = createContext(null);

/**
 * `{ character, hold, open, close, present }`, or null outside a provider.
 *
 * `present(spec)` is the one worth knowing. It puts a roll on the surface, waits
 * for the player to throw it and resolves with the settled result once the
 * verdict is in, so a chain of rolls reads as the sequence it is:
 *
 *   const check = await tray.present({ shape: 'check', dc, flat, ... });
 *   if (damage) await tray.present({ shape: 'value', maximize: check.crit });
 */
export function useDiceTray() {
  return useContext(DiceTrayContext);
}
