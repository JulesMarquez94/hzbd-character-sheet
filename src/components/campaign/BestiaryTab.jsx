import { useState } from 'react';
import EnemyBlock from './EnemyBlock.jsx';
import CreatureForge from './CreatureForge.jsx';
import { RANKS, bestiary } from '../../lib/creatures.js';
import { previewFoe } from '../../lib/encounters.js';
import { creatureSlots } from '../../lib/tiers.js';

const STILL = () => {};

/**
 * The bestiary: every creature in the codex, drawn as the enemy it would be.
 *
 * Read only, and deliberately the *same block* an encounter draws rather than a
 * second, tidier one. Jules asked for one enemy block; two components that both
 * claim to be it would disagree inside a month, and the thing a Game Master is
 * browsing here is exactly the thing they are about to put on the table.
 *
 * So every pool is full, every ward stands and nothing can be pressed. See
 * `previewFoe`, which is what dresses a printed page as an untouched instance.
 *
 * ---------------------------------------------------------------- the filter
 * One row of four, because the rank is the only question anybody asks of a
 * bestiary before they ask anything else: what am I fighting, and how big is it.
 * Nine creatures fit on one screen without a filter, and this list is going to
 * grow every time Jules draws a stat block.
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
 * The Edit button is on the block itself rather than up here, because a shelf of
 * nine blocks with an edit control per row in the toolbar would make you match
 * a name to a button. Editing a creature's page is not editing an instance of
 * it, which is why the block still draws `readOnly`: nothing on it can be
 * pressed, and the page behind it can be rewritten.
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

  const counts = new Map();
  for (const creature of shelf) counts.set(creature.rank, (counts.get(creature.rank) ?? 0) + 1);

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
            The printed page for each one. Tap the <b>i</b> on a block for its lore, and a card for
            what it does.
          </p>
        )}
      </div>

      <div className="sheet-grid-6">
        {creatures.map((creature) => {
          /* Whose page can be rewritten from here: your own, always, and a
             published one only by an account that may publish. A published
             creature belongs to the shelf rather than to whoever is reading it. */
          const mine = creature.forged && creature.owner === userId && creature.scope !== 'codex';
          const editable = creature.forged && (mine || canPublish);

          return (
            <section key={creature.id} className="sheet-cell sheet-cell-wide cell-foe">
              <EnemyBlock
                foe={previewFoe(creature)}
                patch={STILL}
                readOnly
                unit={unit}
                onEdit={editable ? () => setForging(creature) : null}
              />
            </section>
          );
        })}
      </div>

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
