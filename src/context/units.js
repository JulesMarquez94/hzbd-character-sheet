import { createContext, useContext } from 'react';

/**
 * Which unit the reader chose, for everything too deep to hand it to.
 *
 * The sheet has passed `unit` down as a prop since there were two tabs that
 * printed a distance, and that was right while distances lived on tiles. Weight
 * does not: it is on every item row in six blocks, in the codex browser, on the
 * equip prompt and on the item card, and every one of those is three or four
 * components below the switch. Threading a prop through all of them would mean a
 * component that neither reads nor renders a weight still having to know about
 * units so that its children can.
 *
 * So this is the one exception, and it stays an exception: the tiles that
 * already take `unit` keep taking it. Nothing here replaces that.
 *
 * Metric by default, which is what a reader with no provider above them gets and
 * what the sheet's own data is written in.
 */
export const UnitContext = createContext('metric');

export function useUnit() {
  return useContext(UnitContext);
}
