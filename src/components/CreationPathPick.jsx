import { CREATION_PATHS } from '../lib/creationPaths.js';
import './CreationPathPick.css';

/**
 * The four ways in, as four cards.
 *
 * This is the first thing the enlist box asks, before the name and before the
 * row exists. Asking here rather than on the creation page is what keeps an
 * unbuilt path from costing a character slot: nothing is written until a path
 * has been taken, so reading what the other three will be and backing out
 * leaves the vault exactly as it was.
 *
 * A path that is not built yet is shown in full and cannot be taken. It keeps
 * its copy and loses its colour, because the colour is the part that arrives
 * with the path.
 */

/* One glyph each, drawn rather than borrowed: nothing in the icon set says
   "four choices at once" or "a road that forks". Sized by the box they sit in
   and coloured by the card's accent, so they are the one thing on a card that
   is purely its own. */
const GLYPHS = {
  freeform: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  premade: (
    <>
      <rect x="4" y="2.5" width="16" height="19" rx="2" />
      <circle cx="12" cy="9.5" r="3" />
      <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
    </>
  ),
  guided: (
    <>
      <circle cx="5" cy="6" r="1.7" />
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="5" cy="18" r="1.7" />
      <path d="M5 7.7v2.6M5 13.7v2.6M10 6h11M10 12h11M10 18h11" />
    </>
  ),
  adventure: (
    <>
      <path d="M12 21v-6l-4-4V7.2" />
      <path d="M12 15l4-4V7.2" />
      <circle cx="8" cy="5.4" r="1.8" />
      <circle cx="16" cy="5.4" r="1.8" />
    </>
  ),
};

function PathGlyph({ pathKey }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {GLYPHS[pathKey]}
    </svg>
  );
}

export default function CreationPathPick({ onPick }) {
  return (
    <div className="path-grid">
      {CREATION_PATHS.map((path) => (
        <button
          key={path.key}
          type="button"
          className={`path-card${path.ready ? '' : ' is-soon'}`}
          style={{ '--path-accent': path.accent }}
          disabled={!path.ready}
          onClick={() => onPick(path.key)}
        >
          <span className="path-card-head">
            <span className="path-card-icon">
              <PathGlyph pathKey={path.key} />
            </span>
            <span className="path-card-title">{path.title}</span>
            {path.ready ? (
              <span className="path-card-go" aria-hidden="true">
                &rsaquo;
              </span>
            ) : (
              <span className="tag tag-muted">Soon</span>
            )}
          </span>

          <span className="path-card-line">{path.line}</span>
          <span className="path-card-blurb">{path.blurb}</span>
        </button>
      ))}
    </div>
  );
}
