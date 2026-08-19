import { PICK_ACCENTS } from './pickAccents.js';

/**
 * One choice inside a level.
 *
 * Level 1 asks for three different things at once — a talent set, an ancestry
 * and a background — and read as one column they ran together into a single
 * long form. Each one is its own panel now, numbered, headed, and carrying the
 * colour of the cards it deals: amber for talents, violet for lineage, cyan for
 * a background. That colour follows the choice everywhere, into its buttons and
 * into the dialog it opens, so you always know which of the three you are in.
 *
 * The state chip on the right is the point of the whole thing — three panels
 * that each say whether they are done means level 1 can be read at a glance
 * rather than scrolled through.
 */
export default function PickBlock({ kind, step = null, title, state, done = false, children }) {
  return (
    <section
      className={`pick-block${done ? ' is-done' : ''}`}
      style={{ '--pick-accent': PICK_ACCENTS[kind] ?? 'var(--copper)' }}
    >
      <header className="pick-block-head">
        {step && <span className="pick-block-step">{step}</span>}
        <h4 className="pick-block-title">{title}</h4>
        <span className="pick-block-state">{state ?? (done ? 'Chosen' : 'Waiting on you')}</span>
      </header>

      <div className="pick-block-body">{children}</div>
    </section>
  );
}
