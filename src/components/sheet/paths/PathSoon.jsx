import { useSearchParams } from 'react-router-dom';
import { DEFAULT_PATH, creationPath } from '../../../lib/creationPaths.js';

/**
 * A way in that has been chosen and not yet written.
 *
 * The chooser on the dashboard will not hand out an unbuilt path, so nobody
 * reaches this by clicking. What reaches it is a URL: a bookmarked
 * `?path=premade` from the day it worked, or a link somebody typed. The row is
 * already made by the time we are here and nothing on it is spent, so the
 * screen says what the path will be and hands over the one that is built,
 * rather than stranding a blank character on a blank page.
 *
 * Switching rewrites the parameter in place. The sheet is keyed by id and does
 * not remount for it, so nothing is refetched and no edit is lost.
 */
export default function PathSoon({ path, character, onDone }) {
  const [, setParams] = useSearchParams();
  const built = creationPath(DEFAULT_PATH);

  return (
    <div className="tab-narrow creation">
      <div className="panel">
        <header className="creation-head">
          <span className="creation-eyebrow">New character</span>
          <h2 className="creation-title">{character.name || 'Unnamed Drifter'}</h2>
          <p className="creation-line">{path.line}</p>
        </header>

        <div className="path-soon" style={{ '--path-accent': path.accent }}>
          <h3 className="path-soon-title">{path.title} is not built yet</h3>
          <p className="path-soon-blurb">{path.blurb}</p>
          <p className="path-soon-note">
            Until it is, take the way in that is. {built.title} opens every level-1 chooser at
            once, and nothing you do there closes this path off later: all four end on the same
            sheet.
          </p>
        </div>
      </div>

      <div className="creation-foot">
        <button type="button" className="btn btn-minimal btn-sm" onClick={onDone}>
          Open the sheet
        </button>
        <span className="spacer" />
        <button
          type="button"
          className="btn btn-copper btn-sm"
          onClick={() => setParams({ path: built.key }, { replace: true })}
        >
          Take the {built.title.toLowerCase()} instead
        </button>
      </div>
    </div>
  );
}
