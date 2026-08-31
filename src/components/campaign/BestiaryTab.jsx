import { useMemo, useState } from 'react';
import EnemyBlock from './EnemyBlock.jsx';
import { RANKS, bestiary } from '../../lib/creatures.js';
import { previewFoe } from '../../lib/encounters.js';

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
 */
export default function BestiaryTab({ unit = 'metric' }) {
  const [rank, setRank] = useState(null);

  const creatures = useMemo(() => bestiary(rank), [rank]);
  const counts = useMemo(() => {
    const map = new Map();
    for (const creature of bestiary()) {
      map.set(creature.rank, (map.get(creature.rank) ?? 0) + 1);
    }
    return map;
  }, []);

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
            <span className="foe-filter-count">{bestiary().length}</span>
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
        </div>

        <p className="camp-toolbar-note">
          The printed page for each one. Tap the <b>i</b> on a block for its lore, and a
          card for what it does.
        </p>
      </div>

      <div className="sheet-grid-6">
        {creatures.map((creature) => (
          <section key={creature.id} className="sheet-cell sheet-cell-wide cell-foe">
            <EnemyBlock foe={previewFoe(creature)} patch={STILL} readOnly unit={unit} />
          </section>
        ))}
      </div>
    </>
  );
}
