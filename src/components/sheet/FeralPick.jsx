import { useState } from 'react';
import Modal from '../Modal.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { feralState, setFeralIdentity } from '../../lib/feral.js';

/**
 * Naming the thing a Feral Curse turns you into, and saying what it is.
 *
 * The Developpement Notes ask for both in one place: "When creating it you have
 * select an animal type, you can insert an image link for your feral form and
 * you select your starter martial moves." The first two are here. The third is
 * a `loadout` and is chosen in the panel every other picked hand on this sheet
 * is chosen in, which is the whole reason a Feral Cursed's Martial Moves look
 * like a Mycomancer's spells on the Abilities tab.
 *
 * BEAST WITHIN is what makes it a question at all: "When you become Feral Cursed,
 * you choose a Carnivore Mammal. This beast represents how your ability
 * manifests." So it opens on top of the take the way a Mycomancer's spell pool
 * does, and it is a button afterwards in two places — on the set on the
 * Advancement tab, and on the form's own block on the Character tab — because a
 * choice that can only be made once and never seen again is the thing the sheet
 * was told off for.
 *
 * ------------------------------------------------------------------ the beast
 * Eight buttons and a field, rather than a menu of eight. The card says any
 * Carnivore Mammal, so a closed list would be the sheet narrowing a choice the
 * card left open; a press fills the field and the field can then be typed over
 * with a fisher cat or a sun bear. Nothing reads the value — the card says the
 * beast "represents how your ability manifests" and no rule turns on which one
 * it is — so there is nothing an unusual answer can break.
 *
 * Everything commits as you type. There is no Save: the block behind the window
 * is already wearing the name, which is the whole reason the window is small.
 */
export function FeralWindow({ character, form, patch, readOnly = false, onClose }) {
  const { spec } = form;
  const beasts = spec.beasts?.options ?? [];

  const write = (body) => patch(setFeralIdentity(character, form.id, body));

  return (
    <Modal
      title={form.named ? form.name : `Your ${spec.label}`}
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
        Something in you is not yours. Say what carnivore it is, what you call it, and it takes a
        block of its own on your Character tab.
      </p>

      <div className="minion-editor">
        <div className="minion-portrait">
          {form.portrait_url ? (
            <img src={form.portrait_url} alt="" />
          ) : (
            <span className="muted">No picture</span>
          )}
        </div>

        <div className="minion-fields">
          <label className="form-label" htmlFor="feral-name">
            Name
          </label>
          <input
            className="form-input"
            id="feral-name"
            readOnly={readOnly}
            value={form.name}
            placeholder="What do you call it?"
            maxLength={60}
            onChange={(event) => write({ name: event.target.value })}
          />

          <label className="form-label" htmlFor="feral-art" style={{ marginTop: '1rem' }}>
            Picture URL
          </label>
          <input
            className="form-input"
            id="feral-art"
            readOnly={readOnly}
            value={form.portrait_url ?? ''}
            placeholder="https://…/wolf.png"
            onChange={(event) => write({ portrait_url: event.target.value })}
          />
          <p className="form-hint">
            Paste a link to any image, the same as a portrait. Its block draws it square.
          </p>
        </div>
      </div>

      <div className="pick-part">
        <span className="talent-summary-label">
          {spec.beasts?.label ?? 'Your beast'}
          <span className={`pick-count${form.chosen ? '' : ' is-open'}`}>
            {form.chosen ? form.beast : 'nothing chosen'}
          </span>
        </span>
        <p className="pick-line">{spec.beasts?.prompt}</p>

        <label className="form-label" htmlFor="feral-beast">
          Carnivore
        </label>
        <input
          className="form-input"
          id="feral-beast"
          readOnly={readOnly}
          value={form.beast}
          placeholder="Wolf"
          maxLength={40}
          onChange={(event) => write({ beast: event.target.value })}
        />

        {!readOnly && beasts.length > 0 && (
          <div className="feral-beast-row">
            {beasts.map((option) => (
              <button
                type="button"
                key={option}
                className={`feral-beast${form.beast === option ? ' is-on' : ''}`}
                onClick={() => write({ beast: option })}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * The form as the Advancement tab's talent block shows it: what it is, and the
 * way back into the window.
 *
 * Shown on the slot that bought Rank 1, the way a creature's is — the curse is
 * caught once, and the ranks above it are the same animal getting better at it.
 */
export default function FeralSection({
  talent,
  character,
  patch,
  readOnly = false,
  autoOpen = false,
}) {
  const [editing, setEditing] = useState(autoOpen);

  const form = feralState(character).find((row) => row.id === talent.id);
  if (!form) return null;

  const { spec } = form;
  const settled = form.named && form.chosen;

  return (
    <div className="pick-part">
      <span className="talent-summary-label">
        {spec.label}
        <span className={`pick-count${settled ? '' : ' is-open'}`}>
          {settled ? `${form.name} · ${form.beast}` : 'not settled yet'}
        </span>
      </span>

      <p className="pick-line">
        {settled
          ? `${form.name} is a ${form.beast.toLowerCase()}. Going into it costs half the Health you ` +
            `have left and buys twice as much Shield, and the Feral Rage difficulty stands at ` +
            `${form.difficulty}.`
          : `Nothing chosen yet. Your ${spec.label} takes a block on the Character tab as soon as ` +
            `it has a name and a beast.`}
      </p>

      {!readOnly && (
        <div className="pick-tools pick-tools-tight">
          <button type="button" className="btn btn-sub btn-sm" onClick={() => setEditing(true)}>
            {settled ? `Change your ${spec.noun}` : `Name your ${spec.noun}`}
          </button>
        </div>
      )}

      {editing && (
        <FeralWindow
          character={character}
          form={form}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
