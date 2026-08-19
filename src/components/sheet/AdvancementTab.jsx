import LevelLedger from './LevelLedger.jsx';
import { CardStackProvider } from '../CardStack.jsx';
import { xpProgress } from '../../lib/characterModel.js';

/**
 * What a character *chose*, level by level.
 *
 * Identity sits at the top, and under it one block per level — level 1 first,
 * and a new block below it every time the character reaches another. Every
 * level hands out something: a talent choice on the even ones, an attribute
 * point and a new skill on the odd ones, and all of level 1 at once.
 *
 * Nothing here is spent or tracked. Pools, the running attribute totals and the
 * experience curve all belong to the Character tab, and the ledger that moves
 * XP is opened from the level badge there.
 */
export default function AdvancementTab({ character, patch, readOnly = false, unit = 'metric' }) {
  const xp = xpProgress(character.xp);

  return (
    <CardStackProvider character={character}>
      <div className="tab-narrow">
        <div className="panel">
          {/* ------------------------------------------------------- identity */}
          <div className="frame">
            <h3 className="frame-heading">Identity</h3>

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
              level-1 block below. All three show on the Character tab.
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

    </CardStackProvider>
  );
}
