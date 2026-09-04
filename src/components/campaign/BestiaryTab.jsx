import { useState } from 'react';
import Modal from '../Modal.jsx';
import CreatureBrief from './CreatureBrief.jsx';
import EnemyBlock from './EnemyBlock.jsx';
import CreatureForge from './CreatureForge.jsx';
import { RANKS, bestiary, getRank } from '../../lib/creatures.js';
import { previewFoe } from '../../lib/encounters.js';
import { creatureSlots } from '../../lib/tiers.js';

const STILL = () => {};

/**
 * The bestiary: every creature in the codex, said in a line, with the block it
 * would be one tap behind.
 *
 * Jules, 2026-09-04: "the bestiary should be a menu with summary version of the
 * enemies. The block should show when you click on it. Summary should be the
 * same size as like spell summary."
 *
 * So the tab is the same two steps a school of spells is, and for the same
 * reason: this shelf was nine blocks when it was written and it grows every time
 * Jules draws a stat block. At 736x640 apiece thirty creatures are a wall you
 * scroll past, and none of the things you scroll for (how big is it, what rank,
 * how much Health) needs the whole block to answer. See CreatureBrief, which is
 * the spell summary's own measure by construction.
 *
 * ------------------------------------------------------------ and the block
 * Read only, and deliberately the *same block* an encounter draws rather than a
 * second, tidier one. Jules asked for one enemy block; two components that both
 * claim to be it would disagree inside a month, and the thing a Game Master is
 * browsing here is exactly the thing they are about to put on the table.
 *
 * So every pool is full, every ward stands and nothing can be pressed. See
 * `previewFoe`, which is what dresses a printed page as an untouched instance.
 *
 * It opens in a dialog at the three-block measure, which is the width rule
 * Modal keeps for the three kinds of dialog that have something to put in it:
 * this is the first of them, a thing drawn at its real footprint. The block is
 * 736px and never scrolls, so the dialog holds it at that and centres it. Where
 * the window is too short for 640px the dialog's own body scrolls, which is what
 * every page dialog on the site does.
 *
 * The creature is held **by id** rather than as an object, because a forge save
 * behind the open dialog rewrites the page: reading it back off the shelf on
 * every render means the block redraws as the creature it now is, and closes by
 * itself if the creature was removed.
 *
 * ---------------------------------------------------------------- the filter
 * One row of four, because the rank is the only question anybody asks of a
 * bestiary before they ask anything else: what am I fighting, and how big is it.
 *
 * A fifth button appears once anything has been forged, and it is a filter of
 * the same kind: which subset am I looking at. It is last because the printed
 * bestiary is the thing this tab is for and a table's own creatures are the
 * thing they already know they have.
 *
 * ----------------------------------------------------------------- the forge
 * Jules, 2026-09-02: a table can build a creature of its own, and it lands on
 * this shelf beside the printed ones. Which account may do that at all is a slot
 * count (see CREATURE_SLOTS in tiers.js), and publishing one into the shelf
 * everybody reads is an admin. Both are enforced in supabase/schema.sql; what is
 * decided here is only what is offered.
 *
 * The Edit button is under the brief rather than up here, because a shelf of
 * thirty rows with an edit control per row in the toolbar would make you match a
 * name to a button. Editing a creature's page is not editing an instance of it,
 * which is why the block still draws `readOnly`: nothing on it can be pressed,
 * and the page behind it can be rewritten. It is on the brief *and* on the block,
 * because either one is a place you have just decided this creature is the wrong
 * shape.
 */
export default function BestiaryTab({
  unit = 'metric',
  forged = [],
  tier = 'free',
  userId = null,
  canPublish = false,
  onChanged = STILL,
}) {
  const [rank, setRank] = useState(null);
  /** Whose block is open, by creature id, or null while the shelf is the page. */
  const [open, setOpen] = useState(null);
  /** The creature in the forge: an object to edit, 'new' for a blank one, or
      null while nothing is open. */
  const [forging, setForging] = useState(null);

  const slots = creatureSlots(tier);
  /* Only what this account owns counts against its cap. A published creature is
     on the shelf for everybody and belongs to whoever published it. */
  const own = forged.filter((creature) => creature.scope !== 'codex' && creature.owner === userId);
  const room = Math.max(0, slots - own.length);

  /* Worked out on every render rather than memoised, which is a change from how
     this tab read before the forge. `bestiary()` reads the mutable half of the
     registry (see FORGED in creatures.js), so a memo keyed on anything a
     component can see would be keyed on the wrong thing: the list changes when
     module state changes, and there is nothing in props or state that is
     *really* what changed. Sorting a shelf of a few dozen creatures on a render
     costs nothing, and a stale shelf costs a Game Master their new creature. */
  const shelf = bestiary();
  const creatures = rank === 'forged' ? shelf.filter((creature) => creature.forged) : bestiary(rank);

  /* Read off the whole shelf rather than the filtered list, so switching the
     filter under an open block does not shut it. Absent means the creature has
     been removed from under the dialog, and the dialog goes with it. */
  const shown = open ? (shelf.find((creature) => creature.id === open) ?? null) : null;

  const counts = new Map();
  for (const creature of shelf) counts.set(creature.rank, (counts.get(creature.rank) ?? 0) + 1);

  /** Whose page can be rewritten from here: your own, always, and a published
      one only by an account that may publish. A published creature belongs to
      the shelf rather than to whoever is reading it. */
  function editable(creature) {
    const mine = creature.forged && creature.owner === userId && creature.scope !== 'codex';
    return creature.forged && (mine || canPublish);
  }

  /** A save, a publish or a removal: reread the shelf and close the forge. */
  async function settled() {
    setForging(null);
    await onChanged();
  }

  return (
    <>
      <div className="camp-toolbar">
        <div className="foe-filter">
          <button
            type="button"
            className={`foe-filter-btn${rank === null ? ' is-on' : ''}`}
            onClick={() => setRank(null)}
          >
            Everything
            <span className="foe-filter-count">{shelf.length}</span>
          </button>

          {RANKS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`foe-filter-btn${rank === entry.id ? ' is-on' : ''}`}
              style={{ '--rank-tone': entry.color }}
              onClick={() => setRank(entry.id)}
              title={entry.blurb}
            >
              {entry.label}
              <span className="foe-filter-count">{counts.get(entry.id) ?? 0}</span>
            </button>
          ))}

          {forged.length > 0 && (
            <button
              type="button"
              className={`foe-filter-btn${rank === 'forged' ? ' is-on' : ''}`}
              style={{ '--rank-tone': 'var(--copper)' }}
              onClick={() => setRank('forged')}
              title="Creatures forged rather than printed: yours, and anything published to the shelf"
            >
              Forged
              <span className="foe-filter-count">{forged.length}</span>
            </button>
          )}
        </div>

        <span className="spacer" />

        {slots > 0 && (
          <button
            type="button"
            className="btn btn-copper btn-sm"
            disabled={room === 0 && !canPublish}
            onClick={() => setForging('new')}
            title={
              room === 0 && !canPublish
                ? 'Every slot is full. Edit one you have, or remove one to make room.'
                : 'Build a creature of your own'
            }
          >
            Forge a creature
          </button>
        )}

        {slots > 0 ? (
          <p className="camp-toolbar-note">
            {own.length} of {slots} of your own
            {room === 0 ? '. Edit or remove one to make room for another.' : '.'}
          </p>
        ) : (
          <p className="camp-toolbar-note">
            A line each, and the whole of one behind it. Open one for its <b>block</b>, its
            numbers and its cards.
          </p>
        )}
      </div>

      <div className="card-brief-wall foe-brief-wall">
        {creatures.map((creature) => (
          <CreatureBrief
            key={creature.id}
            creature={creature}
            unit={unit}
            onOpen={() => setOpen(creature.id)}
          >
            {editable(creature) && (
              <button
                type="button"
                className="btn btn-minimal btn-sm card-brief-btn"
                onClick={() => setForging(creature)}
                title={`Rebuild ${creature.name}`}
              >
                Edit
              </button>
            )}
          </CreatureBrief>
        ))}
      </div>

      {shown && (
        <Modal
          title={shown.name}
          size="page"
          accent={getRank(shown).color}
          onClose={() => setOpen(null)}
        >
          <div className="foe-page">
            {/* The rank, on the cell's own top edge, which is what
                `.sheet-cell.cell-foe` has always been written to take. The brief
                that opened this dialog wore the rank as its whole accent, so the
                block it opens has to wear it too or the two read as different
                creatures. */}
            <section className="sheet-cell cell-foe" style={{ '--rank-tone': getRank(shown).color }}>
              <EnemyBlock
                foe={previewFoe(shown)}
                patch={STILL}
                readOnly
                unit={unit}
                onEdit={editable(shown) ? () => setForging(shown) : null}
              />
            </section>
          </div>
        </Modal>
      )}

      {forging && (
        <CreatureForge
          creature={forging === 'new' ? null : forging}
          canPublish={canPublish}
          userId={userId}
          onSaved={settled}
          onDeleted={settled}
          onClose={() => setForging(null)}
        />
      )}
    </>
  );
}
