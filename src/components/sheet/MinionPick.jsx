import { useState } from 'react';
import Modal from '../Modal.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { damageStyle } from '../../lib/cardText.js';
import { minionState, setMinionIdentity } from '../../lib/minions.js';

/**
 * Naming the creature a talent set just put on the board.
 *
 * "When selecting Draconic bond in the selection screen just after taking it
 * (like how when you have to select spell) a new window open, you name the
 * draconic ally. You choose it scale color ... When naming it should also allow
 * you to add an image to it like for character."
 *
 * So this opens on top of the take, the way a Mycomancer's spell pool does, and
 * it asks the three things in one place. Afterwards it is a button — on the set
 * on the Advancement tab, and on the creature's own block on the Character tab —
 * because a choice that can only be made once and never seen again is the thing
 * the sheet was told off for.
 *
 * Everything commits as you type. There is no Save: the block behind the window
 * is already wearing the name, which is the whole reason the window is small.
 */
export function MinionWindow({ character, minion, patch, readOnly = false, onClose }) {
  const { spec } = minion;
  const scales = spec.scales?.options ?? [];

  const write = (body) => patch(setMinionIdentity(character, minion.id, body));

  return (
    <Modal
      title={minion.named ? minion.name : `Your ${spec.noun ?? 'ally'}`}
      onClose={onClose}
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <p className="pick-lead">
        A {spec.kin ?? 'creature'} has bound its life to yours. Give it a name, say what colour it
        is, and it stands on your Character tab with two blocks of its own.
      </p>

      <div className="minion-editor">
        <div className="minion-portrait">
          {minion.portrait_url ? (
            <img src={minion.portrait_url} alt="" />
          ) : (
            <span className="muted">No picture</span>
          )}
        </div>

        <div className="minion-fields">
          <label className="form-label" htmlFor="minion-name">
            Name
          </label>
          <input
            className="form-input"
            id="minion-name"
            readOnly={readOnly}
            value={minion.name}
            placeholder="What do you call it?"
            maxLength={60}
            onChange={(event) => write({ name: event.target.value })}
          />

          <label className="form-label" htmlFor="minion-art" style={{ marginTop: '1rem' }}>
            Picture URL
          </label>
          <input
            className="form-input"
            id="minion-art"
            readOnly={readOnly}
            value={minion.portrait_url ?? ''}
            placeholder="https://…/wyrmling.png"
            onChange={(event) => write({ portrait_url: event.target.value })}
          />
          <p className="form-hint">
            Paste a link to any image, the same as a portrait. Its block draws it square.
          </p>
        </div>
      </div>

      {scales.length > 0 && (
        <div className="pick-part">
          <span className="talent-summary-label">
            {spec.scales.label ?? 'Colour'}
            <span className={`pick-count${minion.scale ? '' : ' is-open'}`}>
              {minion.scale ? minion.scale.label : 'not chosen'}
            </span>
          </span>

          {spec.scales.prompt && <p className="pick-line">{spec.scales.prompt}</p>}

          <div className="minion-scales">
            {scales.map((option) => {
              const tone = damageStyle(option.damage);
              return (
                <button
                  type="button"
                  key={option.id}
                  className={`minion-scale${minion.scale?.id === option.id ? ' active' : ''}`}
                  style={tone ? { '--scale-tone': tone.color } : undefined}
                  disabled={readOnly}
                  onClick={() => write({ scale: option.id })}
                >
                  <span className="minion-scale-swatch" aria-hidden="true" />
                  <span className="minion-scale-name">{option.label}</span>
                  <span className="minion-scale-dmg">{option.damage}</span>
                </button>
              );
            })}
          </div>

          <p className="form-hint">
            The colour is what its breath and its bolts are made of. Everything it deals is{' '}
            {minion.scale ? minion.scale.damage : 'that type'}.
          </p>
        </div>
      )}
    </Modal>
  );
}

/**
 * The creature as the Advancement tab's talent block shows it: who it is, and
 * the way back into the window.
 *
 * Shown on the slot that bought Rank 1, the way a loadout is shown on the slot
 * holding the highest rank — the bond is formed once, and later ranks deepen a
 * creature that already has a name.
 */
export default function MinionSection({
  talent,
  character,
  patch,
  readOnly = false,
  autoOpen = false,
}) {
  const [editing, setEditing] = useState(autoOpen);

  const minion = minionState(character).find((row) => row.id === talent.id);
  if (!minion) return null;

  const { spec } = minion;

  return (
    <div className="pick-part">
      <span className="talent-summary-label">
        {spec.label}
        <span className={`pick-count${minion.named ? '' : ' is-open'}`}>
          {minion.named ? minion.name : 'not named yet'}
        </span>
      </span>

      <p className="pick-line">
        {minion.named
          ? `${minion.name} stands at level ${minion.level} with ${minion.stats.health_max} Health, ` +
            `Defense ${minion.stats.avoid}, and ${minion.scale ? `${minion.scale.label} scales` : 'no colour chosen'}` +
            `${minion.scale ? ` that deal ${minion.scale.damage}` : ''}.`
          : `Nothing named yet. Your ${spec.kin ?? 'ally'} takes two blocks on the Character tab as soon as it has a name.`}
      </p>

      {!readOnly && (
        <div className="pick-tools pick-tools-tight">
          <button type="button" className="btn btn-sub btn-sm" onClick={() => setEditing(true)}>
            {minion.named ? `Change your ${spec.noun ?? 'ally'}` : `Name your ${spec.noun ?? 'ally'}`}
          </button>
        </div>
      )}

      {editing && (
        <MinionWindow
          character={character}
          minion={minion}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
