import { useState } from 'react';
import Modal from '../Modal.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { addEffect } from '../../lib/combatTurn.js';
import {
  LEDGER_NOTE_MAX,
  appendLedger,
  newLedgerId,
  shieldCapFor,
} from '../../lib/characterModel.js';
import { stealNeedsRoll, stealPatch, stealTable } from '../../lib/tricks.js';

/**
 * STEAL: what came out of their pockets.
 *
 * The Developpement Notes are the whole brief for this window: "then when he use
 * steal, it should show the options after he press use. so he can slect which
 * one and apply it. which would include the damage increase ,return ect."
 *
 * So it opens *after* the payment, which is what `opens: 'steal'` on the card
 * means — the two Action Points and the Willpower are the price of the attempt
 * and are already gone by the time this is on screen. Nothing here spends
 * anything. It only decides what was taken.
 *
 * ------------------------------------------------------------------- the d4
 * "Roll a d4 and choose any one effect whose value is below the number you
 * rolled." The die is the table's, never the sheet's — the same law every other
 * die on this sheet keeps — so the first thing asked for is what it came up.
 * Until it is answered, the four rows are shown and none of them can be taken:
 * knowing what you might have got is half of what a d4 is for.
 *
 * *Below* is read as at-or-below, which is a reading and not the sheet's word.
 * See the note on `tricks.steal` in talents.js, and data/README.md.
 *
 * ---------------------------------------------------------------- the fourth
 * Three of the four rows are arithmetic and are applied outright. Healing Tonic
 * is not: it restores "2d6 + twice your Instinct", and the 2d6 is rolled at the
 * table. So that row asks for the roll instead of inventing one, and the flat
 * half is added to whatever is typed in.
 *
 * Health and Shield both move through the ledger, because every other change to
 * either on this sheet is logged and a Trickster's pockets are no exception.
 */
export default function StealWindow({ talent, card, character, patch, onClose }) {
  /* What the d4 came up, what row is taken, and what the tonic's dice came to. */
  const [roll, setRoll] = useState(null);
  const [picked, setPicked] = useState(null);
  const [rolled, setRolled] = useState(0);

  const spec = talent?.tricks?.steal;
  if (!spec) return null;

  const rows = stealTable(spec, character, roll);
  const taken = picked ? rows.find((row) => row.id === picked) : null;
  const needsRoll = stealNeedsRoll(taken);

  function choose(value) {
    setRoll(value);
    // A row the new roll no longer reaches must not stay picked underneath it.
    setPicked(null);
  }

  /** The one write: whatever the row does, and a line in the ledger saying so. */
  function take() {
    if (!taken) return;

    const result = stealPatch(taken, character, {
      rolled,
      cap: shieldCapFor(character),
      wp: Number(card?.wp) || 0,
    });

    const body = { ...(result.patch ?? {}) };

    /* Poison writes no column — it lays a rider on the tracker instead, waiting
       on the next weapon attack the way an AMBUSH does. */
    if (result.effect) body.effects = addEffect(character?.effects, result.effect);

    /* Health and Shield are ledgered pools. A move nobody logged is a move
       somebody will argue about three rounds later. */
    const kind = taken.does === 'heal' ? 'health' : taken.does === 'shield' ? 'shield' : null;
    if (kind && body[kind] !== undefined) {
      const after = Number(body[kind]);
      const delta = after - (Number(character?.[kind]) || 0);
      if (delta !== 0) {
        body.ledger = appendLedger(character, {
          id: newLedgerId(),
          ts: new Date().toISOString(),
          kind,
          delta,
          note: `${taken.name}, off ${card.name}`.slice(0, LEDGER_NOTE_MAX),
          balance: after,
        });
      }
    }

    if (Object.keys(body).length > 0) patch(body);
    onClose();
  }

  return (
    <Modal
      title={`${talent.name}: Steal`}
      onClose={onClose}
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Nothing worth taking
          </button>
          <button
            type="button"
            className="btn btn-take btn-sm"
            disabled={!taken || (needsRoll && rolled <= 0)}
            title={
              !taken
                ? 'Roll the d4, then choose what you lifted'
                : needsRoll && rolled <= 0
                  ? `Say what the ${taken.dice} came to first`
                  : undefined
            }
            onClick={take}
          >
            Take it
          </button>
        </>
      }
    >
      <div className="use-prompt">
        <p className="use-source">{`${card.name} · ${talent.name}`}</p>

        <span className="use-question">
          {roll === null
            ? 'You picked the pocket. What did the d4 come up?'
            : 'What did you lift? Anything at or under your roll.'}
        </span>

        {/* The die, as the four faces it has. */}
        <div className="trick-die">
          {Array.from({ length: spec.die }, (_, i) => i + 1).map((face) => (
            <button
              type="button"
              key={face}
              className={`trick-face${roll === face ? ' is-on' : ''}`}
              onClick={() => choose(face)}
              aria-label={`Rolled a ${face}`}
            >
              {face}
            </button>
          ))}
        </div>

        <div className="trick-options">
          {rows.map((row) => (
            <button
              type="button"
              key={row.id}
              className={`trick-option${picked === row.id ? ' is-picked' : ''}${
                row.reachable ? '' : ' is-out'
              }`}
              onClick={() => setPicked(row.id)}
              disabled={!row.reachable}
              title={
                row.reachable
                  ? `Take the ${row.name}`
                  : roll === null
                    ? 'Roll the d4 first'
                    : `A ${roll} does not reach this one`
              }
            >
              <span className="trick-option-value">{row.value}</span>

              <span className="trick-option-body">
                <span className="trick-option-name">{row.name}</span>
                <span className="trick-option-line">{row.line}</span>
              </span>
            </button>
          ))}
        </div>

        {/* The one row with a die in it. Asked for rather than rolled here. */}
        {needsRoll && (
          <div className="trick-roll">
            <span className="fx-label">What did the {taken.dice} come to?</span>
            <div className="use-dial-row">
              <button
                type="button"
                className="use-dial-step"
                onClick={() => setRolled((v) => Math.max(0, v - 1))}
                disabled={rolled <= 0}
                aria-label="One less"
              >
                &minus;
              </button>
              <span className="use-dial-value">
                <span className="use-dial-n">{rolled}</span>
                <span className="use-dial-label">On the dice</span>
              </span>
              <button
                type="button"
                className="use-dial-step"
                onClick={() => setRolled((v) => v + 1)}
                aria-label="One more"
              >
                +
              </button>
            </div>
            <span className="use-dial-hint">{taken.line}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
