import { useState } from 'react';
import LedgerModal from './LedgerModal.jsx';
import LevelLedger from './LevelLedger.jsx';
import { CardStackProvider } from '../CardStack.jsx';
import { formatNumber, xpProgress } from '../../lib/characterModel.js';

/**
 * What a character *chose*, level by level.
 *
 * Identity sits at the top, and under it one block per level — level 1 first,
 * and a new block below it every time the character reaches another. Every
 * level hands out something: a talent choice on the even ones, an attribute
 * point and a new skill on the odd ones, and all of level 1 at once.
 *
 * Nothing here is spent or tracked. Pools, the running attribute totals and the
 * experience curve all belong to the Character tab.
 *
 * ------------------------------------------------------------ the level badge
 * The one exception, and it is the ledger rather than a pool. Jules, 2026-09-03:
 * "Allow use to access XP and level change on clicking on the level number."
 *
 * The Experience ledger has moved both since it was written — a signed entry for
 * XP, and "set the level directly" under it — and until now the only door to it
 * was the badge on the Character tab. That is the wrong tab to have to go to: the
 * blocks below are what a level *buys*, so the number that says how many you have
 * belongs at the top of them, and the thing you do after changing it is answer
 * the block that just appeared. Same button, same ledger, second door.
 */
export default function AdvancementTab({ character, patch, readOnly = false, unit = 'metric' }) {
  const xp = xpProgress(character.xp);
  // Whether the Experience ledger is up. The only modal this tab raises.
  const [ledger, setLedger] = useState(false);

  return (
    <CardStackProvider character={character}>
      <div className="tab-narrow">
        <div className="panel">
          {/* ------------------------------------------------------- identity */}
          <div className="frame">
            <div className="frame-head-row">
              <h3 className="frame-heading">Identity</h3>

              {/* The level, and the ledger behind it. It reads the same as the
                  badge on the Character tab and opens the same window, with the
                  experience under it because this is the tab where the number
                  matters rather than the pool it feeds. */}
              <button
                type="button"
                className="adv-level"
                onClick={() => setLedger(true)}
                title={readOnly ? 'View the Experience log' : 'Open the Experience ledger'}
              >
                <span className="adv-level-num">
                  Lvl {String(xp.level).padStart(2, '0')}
                  {xp.isMax && <span className="id-level-cap">MAX</span>}
                </span>
                <span className="adv-level-xp">
                  {xp.isMax
                    ? `${formatNumber(xp.total)} XP`
                    : `${formatNumber(xp.into)} / ${formatNumber(xp.span)} XP`}
                </span>
              </button>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="adv-name">
                  Name
                </label>
                <input
                  className="form-input"
                  readOnly={readOnly}
                  id="adv-name"
                  value={character.name || ''}
                  onChange={(e) => patch({ name: e.target.value })}
                  onBlur={(e) => !e.target.value.trim() && patch({ name: 'Unnamed Drifter' })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="adv-campaign">
                  Campaign
                </label>
                <input
                  className="form-input"
                  readOnly={readOnly}
                  id="adv-campaign"
                  value={character.campaign || ''}
                  placeholder="The Drowned Season"
                  onChange={(e) => patch({ campaign: e.target.value })}
                />
              </div>
            </div>

            <p className="frame-foot">
              Lineage, background and your attribute spread all have their own choosers, in the
              level-1 block below. All three show on the Character tab. Tap the level to move
              experience or set the level outright.
            </p>
          </div>

          {/* ------------------------------------------- the level-by-level ledger */}
          <LevelLedger
            character={character}
            level={xp.level}
            patch={patch}
            readOnly={readOnly}
            unit={unit}
          />
        </div>
      </div>

      {ledger && (
        <LedgerModal
          kind="xp"
          character={character}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setLedger(false)}
        />
      )}
    </CardStackProvider>
  );
}
