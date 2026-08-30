import { useState } from 'react';
import Modal from './Modal.jsx';
import { ATTRIBUTES } from '../lib/attributes.js';
import { CRIT_BAND } from '../lib/dice.js';

/**
 * Setting up a roll the table can read.
 *
 * A scratch roll in the tray is dice beside the keyboard. This is the other
 * thing: a roll with a name on it, which is what Jules asked for and what makes
 * the difference between a number nobody can place and a line in the log. The
 * name is not a label, it is the heading the log block takes.
 *
 * ------------------------------------------------------------ the three kinds
 * An Attack Roll, an Attribute Roll and a Skill Check are the same roll, and
 * Jules said so outright: 2d6 plus an attribute against a DC. They are offered
 * as three anyway because a player reaching for the tray is thinking in one of
 * three situations, and a log line that says which one it was is worth the chip
 * row it costs. Nothing downstream branches on the answer.
 *
 * ---------------------------------------------------------------- the modifier
 * Two boxes rather than one, because a Skill Check's help arrives as either.
 *
 * The attribute is picked and its value is read off the open sheet, so nobody
 * has to copy a number off the page. With no sheet open there is nothing to
 * read, so the picker stands down and the flat box carries the whole modifier.
 *
 * The flat box is typed by hand and it has to be. A skill that lends a bonus
 * lends it in prose: no skill card in the codex carries a number, and `grants`
 * covers Supplies, a swap and a Speed and nothing else. Guessing would be worse
 * than asking, so this asks. If those ever get wired the box prefills and the
 * window does not change.
 *
 * Advantage is the same story in dice: the stepper is there because the tracker
 * cannot know that a Disguise Kit applies to *this* check.
 *
 * ------------------------------------------------------------------- the DC
 * Optional on purpose, and the whole reason the four buttons exist on the
 * surface. A crit in this game is 6 or more over the DC, so a roller that has
 * not been told the DC cannot tell you anything at all. Rather than pretend, it
 * rolls, shows the total and asks.
 */
export default function CustomRoll({ character, onClose, onRoll }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState('attack');
  const [attribute, setAttribute] = useState('instinct');
  const [flat, setFlat] = useState('');
  const [dc, setDc] = useState('');
  const [swing, setSwing] = useState(0);

  /* What the open sheet is worth on the picked attribute, floored the way every
     other number on the sheet is. Nothing to read without a sheet, which is the
     case on the codex and the campaign page. */
  const fromSheet = character ? Math.floor(Number(character[attribute]) || 0) : null;
  const typed = Math.trunc(Number(flat) || 0);
  const total = (fromSheet ?? 0) + typed;

  const KINDS = [
    { id: 'attack', label: 'Attack Roll' },
    { id: 'attribute', label: 'Attribute Roll' },
    { id: 'skill', label: 'Skill Check' },
  ];

  function go() {
    onRoll({
      shape: 'check',
      kind,
      name: name.trim() || KINDS.find((one) => one.id === kind).label,
      note: character ? character.name : '',
      flat: total,
      advantage: Math.max(0, swing),
      disadvantage: Math.max(0, -swing),
      /* Anything that is not a number is no DC at all, rather than a zero. A DC
         of 0 is a real DC that everything beats, and typing nonsense into the
         box must not quietly become one. */
      dc: whole(dc),
      askVerdict: true,
      /* Named, so the table hears about it. The name is what heads the block in
         the log, which is the whole reason the field is there. */
      log: true,
      parts: [
        fromSheet !== null
          ? { kind: 'stat', text: String(fromSheet), detail: `your ${labelOf(attribute)}` }
          : null,
        typed !== 0 ? { kind: 'flat', text: String(typed), detail: 'a modifier' } : null,
      ].filter(Boolean),
    });
  }

  return (
    <Modal
      title="Make a custom roll"
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-copper btn-sm" onClick={go}>
            Set it up
          </button>
        </>
      }
    >
      <div className="dice-form">
        <label className="dice-field">
          <span className="dice-label">What it is called</span>
          <input
            type="text"
            className="dice-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Climb the cliff, Pick the lock, Swing at the door"
          />
        </label>

        <div className="dice-field">
          <span className="dice-label">What kind of roll</span>
          <span className="dice-chips">
            {KINDS.map((option) => (
              <button
                type="button"
                key={option.id}
                className={`dice-chip${kind === option.id ? ' is-on' : ''}`}
                onClick={() => setKind(option.id)}
              >
                {option.label}
              </button>
            ))}
          </span>
        </div>

        {character && (
          <div className="dice-field">
            <span className="dice-label">What you are rolling with</span>
            <span className="dice-chips">
              {ATTRIBUTES.map((one) => (
                <button
                  type="button"
                  key={one.key}
                  className={`dice-chip${attribute === one.key ? ' is-on' : ''}`}
                  onClick={() => setAttribute(one.key)}
                  style={{ '--dice-tone': one.color }}
                >
                  {one.label} <b>{Math.floor(Number(character[one.key]) || 0)}</b>
                </button>
              ))}
            </span>
          </div>
        )}

        <label className="dice-field">
          <span className="dice-label">
            {character ? 'And anything else you add' : 'What you add to the roll'}
          </span>
          <input
            type="number"
            className="dice-input"
            value={flat}
            onChange={(event) => setFlat(event.target.value)}
            placeholder="0"
          />
          <span className="dice-field-line">
            A skill that lends a bonus lends it in words, so the sheet cannot read it. Type it in.
          </span>
        </label>

        <div className="dice-field">
          <span className="dice-label">Advantage on this roll</span>
          <div
            className="dice-swing"
            /* The two colours the words wear everywhere else: the green of what
               heals for advantage, the red of Health for disadvantage. Same pair
               RollArrow draws the badge in. */
            style={{
              '--dice-tone':
                swing === 0 ? undefined : swing > 0 ? 'var(--def-healing)' : 'var(--stat-health)',
            }}
          >
            <button
              type="button"
              className="dice-step"
              onClick={() => setSwing((v) => v - 1)}
              aria-label="One less"
            >
              &minus;
            </button>
            <span className="dice-swing-value">
              <span className="dice-swing-n">
                {swing === 0 ? '0' : swing > 0 ? `+${swing}` : String(swing)}
              </span>
              <span className="dice-swing-label">
                {swing === 0 ? 'Neither' : swing > 0 ? 'Green d4s' : 'Red d4s'}
              </span>
            </span>
            <button
              type="button"
              className="dice-step"
              onClick={() => setSwing((v) => v + 1)}
              aria-label="One more"
            >
              +
            </button>
          </div>
        </div>

        <label className="dice-field">
          <span className="dice-label">The DC, if the table has said one</span>
          <input
            type="number"
            className="dice-input"
            value={dc}
            onChange={(event) => setDc(event.target.value)}
            placeholder="Leave it blank if nobody knows"
          />
          <span className="dice-field-line">
            {whole(dc) === null
              ? 'Without it the roll shows its total and asks you which of the four it was.'
              : `${whole(dc) + CRIT_BAND} or more is a critical success. ${
                  whole(dc) - CRIT_BAND
                } or less is a critical failure.`}
          </span>
        </label>

        <p className="dice-field-sum">
          {/* "2d6" on its own when nothing is added, rather than "2d6 + 0". */}
          Rolling <b>2d6{total === 0 ? '' : ` ${total < 0 ? '-' : '+'} ${Math.abs(total)}`}</b>
          {swing !== 0 && (
            <>
              {' '}
              with <b>{Math.abs(swing)}</b> {swing > 0 ? 'green' : 'red'}{' '}
              {Math.abs(swing) === 1 ? 'd4' : 'd4s'}
            </>
          )}
        </p>
      </div>
    </Modal>
  );
}

/** An attribute's printed name, off the one list that has them. */
function labelOf(key) {
  return ATTRIBUTES.find((one) => one.key === key)?.label ?? key;
}

/** A typed box as a whole number, or null when it holds nothing usable. */
function whole(text) {
  if (String(text ?? '').trim() === '') return null;
  const number = Number(text);
  return Number.isFinite(number) ? Math.trunc(number) : null;
}
