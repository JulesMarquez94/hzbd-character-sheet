import { useState } from 'react';
import Modal from '../Modal.jsx';
import { ALL_DAMAGE, DAMAGE_FAMILIES, damageStyle } from '../../lib/cardText.js';
import { asksOf } from '../../lib/riders.js';

/**
 * The number a running effect needs and the sheet cannot work out.
 *
 * Jules, 2026-09-20: "thing you are nto sure how to track add a popup for
 * confirmation of stat when relevant."
 *
 * Nine cards in the codex name a number this sheet holds and measure it against
 * something it cannot see. VIGOR raises a maximum Health "by 3 x your Mind" and
 * the Mind is the *caster's*; SEVER LIFE cuts one "by the damage dealt", which
 * nobody knows until the dice land; AIR CONTROL has two modes and the tracker
 * had nowhere to record which was chosen. Every one of them sat in the "cannot
 * be wired" list at the foot of riders.js with that reason written beside it.
 *
 * This is the other answer: ask. The row remembers, `measure` reads it, and the
 * tile moves. See `ask` in riders.js, which is where the questions are declared.
 *
 * ------------------------------------------------------- a confirmation, mostly
 * A question carrying `from` names one of the *caster's* own numbers, so the
 * sheet that laid the row filled it in on the way over and this window opens
 * with the answer already in the box. That is the difference between confirming
 * a number and being sent to go and ask somebody for one, and it is why the
 * button says Confirm when nothing is missing.
 *
 * ------------------------------------------------------------- three questions
 *   number   a box. The commonest, and every `from` is one.
 *   choice   named options, one of them on. AIR CONTROL's two modes, and
 *            SICKNESS asking which side of it you are.
 *   types    the damage-type picker the tracker already draws for Vulnerable and
 *            Resistant, for the one card whose type is whatever lands next.
 *
 * Nothing here is refused. A blank answer is allowed out, because a table that
 * has not worked the number out yet should be able to close the window and come
 * back: the row goes on saying it needs one and bends nothing in the meantime,
 * which is the same nothing it did before this window existed.
 */

/** The nine types, the three families and All, exactly as the tracker offers them. */
const TYPE_WORDS = [
  ...DAMAGE_FAMILIES.Physical,
  ...DAMAGE_FAMILIES.Elemental.filter((type) => type !== 'Frost'),
  ...DAMAGE_FAMILIES.Metaphysical.filter((type) => type !== 'Necrotic' && type !== 'Poison'),
  'Poison',
  ...Object.keys(DAMAGE_FAMILIES),
  ALL_DAMAGE,
];

export default function AnswerWindow({ effect, onAnswer, onClose }) {
  const asks = asksOf(effect);
  const [values, setValues] = useState(() =>
    Object.fromEntries(asks.map((ask) => [ask.id, ask.answer ?? (ask.kind === 'types' ? [] : '')]))
  );

  /* Whether anything is still blank, which is the whole difference between a
     window that is confirming a filled box and one that is asking for a number
     nobody has. It changes one word on one button and nothing else: an unanswered
     row is allowed out, on purpose. */
  const missing = asks.filter((ask) => {
    const said = values[ask.id];
    return said === '' || said === null || said === undefined || (Array.isArray(said) && said.length === 0);
  });

  function set(id, value) {
    setValues((held) => ({ ...held, [id]: value }));
  }

  function toggleType(id, word) {
    const held = Array.isArray(values[id]) ? values[id] : [];
    set(id, held.includes(word) ? held.filter((one) => one !== word) : [...held, word]);
  }

  function save() {
    /* Blanks are sent as nothing rather than as zero. `answerMap` drops what it
       cannot read, so a box left empty leaves the question open rather than
       answering it with a number nobody typed. */
    const answered = {};
    for (const ask of asks) {
      const said = values[ask.id];
      if (said === '' || said === null || said === undefined) continue;
      if (Array.isArray(said)) {
        if (said.length > 0) answered[ask.id] = said;
        continue;
      }
      answered[ask.id] = ask.kind === 'choice' ? String(said) : Number(said);
    }
    onAnswer(answered);
    onClose();
  }

  return (
    <Modal
      title={`${effect?.name ?? 'This effect'}: what it is worth`}
      onClose={onClose}
      footer={
        <>
          <span className="pick-line">
            {missing.length === 0
              ? 'These are the numbers it will use.'
              : `${missing.length} still open. It bends nothing until they are answered.`}
          </span>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Not now
          </button>
          <button type="button" className="btn btn-copper btn-sm" onClick={save} autoFocus>
            {missing.length === 0 ? 'Confirm' : 'Save what there is'}
          </button>
        </>
      }
    >
      <div className="fx-answers">
        {asks.map((ask) => (
          <div className="fx-field" key={ask.id}>
            <span className="fx-label">{ask.label}</span>

            {ask.kind === 'choice' && (
              <div className="fx-conditions">
                {(ask.options ?? []).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`fx-until-opt${values[ask.id] === option.id ? ' is-on' : ''}`}
                    onClick={() => set(ask.id, option.id)}
                    title={option.hint}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {ask.kind === 'types' && (
              <div className="fx-conditions">
                {TYPE_WORDS.map((word) => (
                  <button
                    key={word}
                    type="button"
                    className={`fx-until-opt${
                      (values[ask.id] ?? []).includes(word) ? ' is-on' : ''
                    }`}
                    onClick={() => toggleType(ask.id, word)}
                    style={damageStyle(word) ? { '--fx-type': damageStyle(word).color } : undefined}
                  >
                    {word}
                  </button>
                ))}
              </div>
            )}

            {ask.kind !== 'choice' && ask.kind !== 'types' && (
              <input
                type="number"
                className="fx-input"
                value={values[ask.id] ?? ''}
                onChange={(event) => set(ask.id, event.target.value)}
                placeholder="A number"
              />
            )}

            {/* What the number buys, and where it came from. A box the caster's
                own sheet filled in says so, because "confirm 6" reads very
                differently from "confirm the 6 they told you". */}
            <p className="forge-hint">
              {ask.hint}
              {ask.from && ask.answer !== null && ask.answer !== undefined
                ? ' Filled in by whoever cast it.'
                : ''}
            </p>
          </div>
        ))}
      </div>
    </Modal>
  );
}
