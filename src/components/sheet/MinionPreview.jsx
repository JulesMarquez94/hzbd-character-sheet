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
 */
export default function MinionPreview({ bodies, character, lead = null }) {
  const [open, setOpen] = useState(null);
  const unit = useUnit();

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
        <Modal
          title={shown.spec.label}
          size="page"
          accent={PICK_ACCENTS.talent}
          onClose={() => setOpen(null)}
        >
          <p className="pick-lead">
            {shown.spec.kin ? `A ${shown.spec.kin}.` : ''} At your own level {shown.level}, and
            these are the two blocks it takes on your Character tab once it is standing.
          </p>

          <div className="minion-page">
            <section className="sheet-cell">
              <MinionStatsBlock
                character={character}
                minion={{ ...shown, commanded: null }}
                patch={STILL}
                readOnly
                unit={unit}
              />
            </section>
            <section className="sheet-cell">
              <MinionActionsBlock
                character={character}
                minion={{ ...shown, commanded: null }}
                patch={STILL}
                readOnly
              />
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** Nothing here writes. Named, so a stray call is obvious in a stack. */
function STILL() {}
