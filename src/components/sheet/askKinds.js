/**
 * Which of the questions `openAsks` can hand back have a window to ask them in.
 *
 * `openAsks` in src/lib/levelPicks.js knows what a character still owes; it does
 * not know, and should not, which of those a screen is able to put a dialog in
 * front of somebody for. That is what AskWindow.jsx does, and this is its table
 * of contents: a `kind` in here has a case there, and one that is not is
 * answered on the Advancement tab like anything else.
 *
 * A caller that holds a way out shut until a list is empty has to filter by this
 * first, or a question it cannot ask becomes a door it cannot open. See
 * Crossroads.jsx, which counts what it can ask and nothing else.
 *
 * Kept apart from the component so the set can be imported without dragging six
 * dialogs along with it, the same reason pickAccents.js sits on its own.
 */
export const ASKABLE_KINDS = new Set([
  'lineage',
  'loadout',
  'minion',
  'feral',
  'pact',
  'oath',
  'background',
]);

/** Whether one row out of `openAsks` has a window in AskWindow.jsx. */
export function askable(ask) {
  return Boolean(ask) && ASKABLE_KINDS.has(ask.kind);
}
