import { useState } from 'react';
import Modal from '../Modal.jsx';
import { MinionActionsBlock, MinionStatsBlock } from './MinionBlock.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useUnit } from '../../context/units.js';

/**
 * A body a talent set could stand up, read as the creature it would be.
 *
 * Jules, 2026-09-09: "You should not see the minion's ability. Instead you
 * should have a preview minion menu at each rank that gives you a pop up that
 * shows the blocks like in the bestiary."
 *
 * ------------------------------------------------------------------- the why
 * A Necromancer at Master owns six cards and can raise seven bodies carrying
 * sixteen more. Those sixteen were briefs in the set's own block on the
 * Abilities tab and rows in the set's presentation page, which is the wrong
 * place for every one of them: a Bone Bow is not something the Necromancer can
 * do. It is something a skeleton does, and if a skeleton is standing it is
 * already on the skeleton's own block with the skeleton's own numbers on it.
 *
 * What a reader actually wants of a roster is the *comparison* — what is a ghoul,
 * and is it worth 3 Marrow — and that question is answered by a stat block and
 * not by a list of card names. The bestiary settled the same question the same
 * way on 2026-09-04: a menu you scan, and the block one press behind it.
 *
 * ------------------------------------------------------------- the same blocks
 * `MinionStatsBlock` and `MinionActionsBlock`, read-only, which are the very two
 * blocks the body takes on the Character tab once it is standing. Not a second
 * rendering of the same numbers: a preview that drifted from the thing it was
 * previewing would be worse than no preview. The bestiary does this too, with
 * `EnemyBlock` inside a dialog, and for the same reason.
 *
 * Two things are bent for the preview and both are about it being nobody:
 *
 *   `commanded`   forced to null. A body that has to be woken says whether it
 *                 has been, and "Not commanded" on a body that does not exist is
 *                 an answer to a question nobody asked.
 *   `patch`       a no-op. Nothing here is stored — see minionKindRows — so
 *                 there is nothing to write, and every control that would write
 *                 is gone with `readOnly` anyway.
 *
 * And one thing is *not* gone with it, since 2026-10-15: the chips. Read-only
 * left every one of them dead, so a reader could see that a skeleton carries a
 * Bone Bow and had no way to read what a Bone Bow does. `preview` makes each
 * chip deal its card with the body's own numbers, the way the bestiary's block
 * deals a creature's card when it cannot be played.
 */
export default function MinionPreview({ bodies, character, lead = null }) {
  const [open, setOpen] = useState(null);

  if (!bodies || bodies.length === 0) return null;

  const shown = bodies.find((body) => body.id === open) ?? null;

  return (
    <div className="minion-peeks">
      <p className="minion-peeks-lead">
        {lead ??
          `${bodies.length === 1 ? 'The body' : `The ${bodies.length} bodies`} this rank opens, with what each one costs. Open one to read it as the blocks it would stand up as.`}
      </p>

      <div className="minion-peek-row">
        {bodies.map((body) => (
          <button
            type="button"
            key={body.id}
            className="minion-peek"
            onClick={() => setOpen(body.id)}
            title={`Read the ${body.spec.label} block`}
          >
            {/* The price on the head beside the name and the numbers under it,
                which is the shape the raise window's own tiles keep. Both on one
                line wrapped raggedly inside a 360px block. */}
            <span className="minion-peek-head">
              <span className="minion-peek-name">{body.spec.label}</span>
              {body.kind?.cost > 0 && <span className="minion-peek-cost">{body.kind.cost}</span>}
            </span>
            <span className="minion-peek-note">
              {body.stats.health_max} Health · Defense {body.stats.avoid}
              {body.stats.defense > 0 ? ` · ${body.stats.defense} Armor` : ''}
            </span>
          </button>
        ))}
      </div>

      {shown && (
        <MinionPreviewWindow body={shown} character={character} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

/**
 * One body behind its door: the two blocks it would stand up as, read-only.
 *
 * Its own export since 2026-10-15, because the row above is not the only door.
 * The Raise the Dead window is where a Necromancer actually decides between a
 * ghoul and a wraith, and its tiles printed a price and a line of card names
 * with no way to read the stat block behind them. It opens this, so the body
 * you raise reads the same as the body the Abilities tab shows you.
 */
export function MinionPreviewWindow({ body, character, onClose }) {
  const unit = useUnit();

  return (
    <Modal title={body.spec.label} size="page" accent={PICK_ACCENTS.talent} onClose={onClose}>
      <p className="pick-lead">
        {body.spec.kin ? `A ${body.spec.kin}.` : ''} At your own level {body.level}, and these are
        the two blocks it takes on your Character tab once it is standing.
      </p>

      <div className="minion-page">
        <section className="sheet-cell">
          <MinionStatsBlock
            character={character}
            minion={{ ...body, commanded: null }}
            patch={STILL}
            readOnly
            unit={unit}
          />
        </section>
        <section className="sheet-cell">
          <MinionActionsBlock
            character={character}
            minion={{ ...body, commanded: null }}
            patch={STILL}
            readOnly
            preview
          />
        </section>
      </div>
    </Modal>
  );
}

/** Nothing here writes. Named, so a stray call is obvious in a stack. */
function STILL() {}
