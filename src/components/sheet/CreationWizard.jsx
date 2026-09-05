import { DEFAULT_PATH, creationPath } from '../../lib/creationPaths.js';
import FreeHand from './paths/FreeHand.jsx';
import PathSoon from './paths/PathSoon.jsx';

/**
 * Making a character, whichever way you chose to.
 *
 * There are four ways in and this is the switch between them. Each one owns its
 * whole screen rather than filling in a shared shell: a wall of choosers, a
 * roster to browse and a run of questions have almost nothing in common to
 * share, and a shell built around the first would only be in the way of the
 * other three. What they do share is the row. Every path writes straight to the
 * one the dashboard made, so a character begun on any of them can be finished
 * on any other.
 *
 * Adding a path is three edits: its screen in `paths/`, a line in the table
 * below and `ready: true` in src/lib/creationPaths.js. A path marked ready with
 * no screen behind it falls to the "not built yet" one rather than to a blank
 * page, so the two can never disagree into nothing.
 */
const PATH_VIEWS = {
  freeform: FreeHand,
};

export default function CreationWizard({ path = DEFAULT_PATH, ...props }) {
  const chosen = creationPath(path);
  const View = PATH_VIEWS[chosen.key];

  return View ? <View {...props} /> : <PathSoon path={chosen} {...props} />;
}
