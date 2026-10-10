import { useState } from 'react';
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
 *
 * ------------------------------------------------------------------- folding
 * `foldable` turns the head into a button and lets a finished panel close to it.
 * Jules, 2026-09-03: "For redability make talent selection, lienage selection
 * block collapsible as well when filled."
 *
 * It is the same rule the level block above keeps, one level down: a panel folds
 * itself the moment its last question is answered, unfolds itself if it stops
 * being finished, and stays wherever you last put it by hand. Level 1 is four
 * panels and three of them are a wall of cards once they are chosen; folded, the
 * level is four lines that each say what they hold.
 *
 * `summary` is what a folded panel says. Without it a closed panel would be a
 * title and the word "Chosen", which tells you it is finished and not what it is
 * finished *with* — and the whole reason to fold is to be able to read the level.
 * Optional, because the attribute panels have nothing to add: their state chip
 * already carries the numbers.
 *
 * **Not every panel is foldable.** The Lore tab's two and the journal use this
 * component and are never done in the sense this means — a journal with one
 * entry is not a journal you have finished — so folding is asked for rather than
 * assumed. See LevelLedger.jsx, which asks for it on all five of the level's.
 */
export default function PickBlock({
  kind,
  step = null,
  title,
  state,
  done = false,
  foldable = false,
  summary = null,
  children,
}) {
  /* Shut follows done whenever done changes, derived on the render that sees the
     change rather than in an effect: an effect would paint the finished panel
     open for a frame first, and that flash is the thing being fixed. */
  const [shut, setShut] = useState(foldable && done);
  const [was, setWas] = useState(done);

  if (was !== done) {
    setWas(done);
    setShut(foldable && done);
  }

  const folded = foldable && shut;
  const said = state ?? (done ? 'Chosen' : 'Waiting on you');

  const head = (
    <>
      {step && <span className="pick-block-step">{step}</span>}
      <h4 className="pick-block-title">{title}</h4>
      <span className="pick-block-state">{said}</span>
      {foldable && <span className="pick-block-chevron" aria-hidden="true" />}
    </>
  );

  return (
    <section
      className={`pick-block${done ? ' is-done' : ''}${folded ? ' is-shut' : ''}`}
      style={{ '--pick-accent': PICK_ACCENTS[kind] ?? 'var(--copper)' }}
    >
      {foldable ? (
        <button
          type="button"
          className="pick-block-head is-tap"
          aria-expanded={!folded}
          onClick={() => setShut((open) => !open)}
          title={folded ? `Open ${title}` : `Fold ${title} away`}
        >
          {head}
        </button>
      ) : (
        <header className="pick-block-head">{head}</header>
      )}

      {folded ? (
        <p className="pick-block-shut">{summary ?? said}</p>
      ) : (
        <div className="pick-block-body">{children}</div>
      )}
    </section>
  );
}
