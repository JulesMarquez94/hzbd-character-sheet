import { useState } from 'react';
import Modal from '../Modal.jsx';
import { Gated } from './parts.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { damageStyle } from '../../lib/cardText.js';
import { minionState, setMinionIdentity } from '../../lib/minions.js';
import { marrowNote, ossuary, undeadOffers } from '../../lib/undead.js';
import PortraitField from '../images/PortraitField.jsx';

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

  /* What the creature is still short of, and what shuts Done until it has it.
     Jules, 2026-09-10: "Make sure they need to make those change before the
     confirm/finish. Samething with things like draconic scale color."

     A nameless ally with no colour is a block that cannot print its own
     sentence: everything it deals is "that type", and both of its blocks stand
     on the Character tab titled after a creature nobody named. So the window
     that granted the questions is the window that holds them, the way the pact
     seals and the lineage settles. The escape hatch is the dialog's ×. */
  const wants = [];
  if (!minion.named) wants.push('give it a name');
  if (scales.length > 0 && !minion.scale) {
    wants.push(`choose its ${(spec.scales.label ?? 'colour').toLowerCase()}`);
  }
  /* The count says how the creature stands and the gate is what a player can
     do about it, so a reader is told the truth and refused nothing. */
  const shut =
    readOnly || wants.length === 0
      ? null
      : `Still to do: ${wants.join(' and ')}. Answer that above and this closes.`;

  return (
    <Modal
      title={minion.named ? minion.name : `Your ${spec.noun ?? 'ally'}`}
      onClose={onClose}
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className={`pick-count${wants.length > 0 ? ' is-open' : ''}`}>
            {wants.length > 0 ? `${wants.length} still open` : 'Nothing left to answer'}
          </span>
          <span className="spacer" />
          <Gated className="btn btn-take btn-sm" why={shut} onClick={onClose}>
            Done
          </Gated>
        </>
      }
    >
      {/* The lead is the spec's when it has one. "A draconic beast has bound its
          life to yours" is the Draconic Bond's own sentence and is wrong for a
          body somebody dug up, so a set that means something else says so. */}
      <p className="pick-lead">
        {spec.lead ??
          `A ${spec.kin ?? 'creature'} has bound its life to yours. Give it a name, say what colour it is, and it stands on your Character tab with two blocks of its own.`}
      </p>

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

      <div style={{ marginTop: '1rem' }}>
        <PortraitField
          label="Picture"
          view="face"
          value={minion.portrait_url}
          onChange={(url) => write({ portrait_url: url ?? '' })}
          readOnly={readOnly}
          hint="Its block draws it square, so the face is the frame that matters here."
        />
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

  /* A set that hands over a *menu* of bodies has nothing to name at the rank
     that bought it: taking the Necromancer opens a graveyard, and the first body
     is raised on a night, over a corpse, with a name chosen in the window that
     raises it. So this says what the pool holds and what it can stand up, and the
     way in is a Long Rest rather than a button. See undead.js. */
  const grave = ossuary(character, talent.id);
  if (grave) return <OssuarySection state={grave} />;

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

/**
 * The Ossuary as the Advancement tab shows it: what the pool holds, what is
 * standing in it, and what a night could stand up.
 *
 * No button, and that is the whole point of it. Every other section on this tab
 * is a way into a choice, and this one is a *readout*: a body is raised with a
 * Long Rest action over a corpse, so the way in is the rest window and nowhere
 * else. What this has to do is say so, and say what the rank just opened, which
 * is the question a Necromancer taking Rank 2 or Rank 3 is actually asking.
 */
function OssuarySection({ state }) {
  const { spec, total, spent, left, bodies, wrecks, perMarrow, owed, wrecked } = state;
  const offers = undeadOffers(state);
  const open = offers.filter((offer) => offer.ok);
  const shut = offers.filter((offer) => !offer.ok && offer.gate === 'rank');

  return (
    <div className="pick-part">
      <span className="talent-summary-label">
        {spec.label}
        <span className={`pick-count${left > 0 ? ' is-open' : ''}`}>
          {spent} of {total} {spec.resource ?? 'Marrow'} spent
        </span>
      </span>

      <p className="pick-line">
        {bodies.length === 0
          ? `Nothing raised. ${marrowNote(state, offers)} Raising one is a Long Rest action, over a corpse, and it is named in the window that raises it.`
          : `${bodies.length - wrecks.length} ${
              bodies.length - wrecks.length === 1 ? 'body' : 'bodies'
            } standing${
              wrecks.length > 0
                ? ` and ${wrecks.length} destroyed`
                : `, ${bodies.length === 1 ? 'each' : 'all'} with two blocks on your Character tab`
            }. ${marrowNote(state, offers)}`}
      </p>

      {open.length > 0 && (
        <p className="pick-line">
          Within reach: {open.map((offer) => `${offer.kind.label} at ${offer.cost}`).join(' · ')}.
        </p>
      )}

      {shut.length > 0 && (
        <p className="pick-line">
          A higher rank opens {shut.map((offer) => offer.kind.label.toLowerCase()).join(' and ')}.
        </p>
      )}

      {owed > 0 && (
        <p className="pick-notice">
          {owed} of your maximum Willpower is in {bodies.length === 1 ? 'it' : 'them'}, at{' '}
          {perMarrow} a Marrow. It comes back with any body you lay to rest.
          {wrecked > 0 &&
            ` ${wrecked} of it is in ${wrecks.length === 1 ? 'a wreck' : 'wrecks'} that a Long Rest sweeps up.`}
        </p>
      )}
    </div>
  );
}
