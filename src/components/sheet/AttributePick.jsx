import { useState } from 'react';
import Modal from '../Modal.jsx';
import PickBlock from './PickBlock.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import {
  ATTRIBUTES,
  ATTRIBUTE_BASE,
  BOOSTS,
  attributeLabel,
} from '../../lib/attributes.js';
import {
  ATTRIBUTE_POINTS,
  clearLevelPick,
  reapplyTotals,
  setBoosts,
  setLevelAttributes,
} from '../../lib/levelPicks.js';
import { deriveStats, formatSpeed } from '../../lib/characterModel.js';

/**
 * Attributes — the only choice on this page that has no cards to deal.
 *
 * Level 1 hands out two boosts at once, a +2 and a +1 on two different
 * attributes, so a finished spread reads 6 / 5 / 4. Every odd level after that
 * hands out two points, a +1 apiece, and they land on two different attributes
 * too. So both are the same choice at two sizes, and both open the same chooser:
 * three tiles per slot, and a plain account of what the numbers you are about to
 * move actually buy — which for attributes is the whole story, since none of
 * them do anything except make other numbers bigger.
 *
 * Neither panel writes to `physique` / `instinct` / `mind` itself. Both hand
 * their choice to the level ledger, which rebuilds all three columns from the
 * whole record — see levelPicks.js.
 */

/* -------------------------------------------------------------- level one */

export default function AttributeSpreadPick({
  character,
  state,
  patch,
  level = 1,
  step = null,
  readOnly = false,
  unit = 'metric',
}) {
  const [choosing, setChoosing] = useState(false);

  const { boosts, spreadDone, values, totals } = state;
  const spread = {};
  for (const attribute of ATTRIBUTES) {
    spread[attribute.key] =
      ATTRIBUTE_BASE +
      (boosts?.major === attribute.key ? 2 : boosts?.minor === attribute.key ? 1 : 0);
  }

  // Later levels and your ancestry both put points on top of the spread. Said
  // once, here, rather than in every odd-level block underneath.
  const grown = ATTRIBUTES.some((attribute) => totals[attribute.key] !== spread[attribute.key]);

  /* A lineage card that says "your Instinct increases by +1" really does raise
     it, so the panel names what your blood is adding rather than leaving an
     unexplained number on the Character tab. */
  const bloodline = Object.entries(state.lineage ?? {}).map(
    ([key, bonus]) => `+${bonus} ${attributeLabel(key)}`
  );

  return (
    <PickBlock kind="attribute" step={step} title="Attributes" done={spreadDone}>
      <p className="pick-lead">
        Your three <b>attributes</b> are the numbers everything else on this sheet is built from.
        Each one starts at <b>{ATTRIBUTE_BASE}</b>. Level 1 hands you two boosts, a <b>+2</b> and a{' '}
        <b>+1</b>, and they go on two different attributes.
      </p>

      <div className="attr-spread">
        {ATTRIBUTES.map((attribute) => (
          <SpreadTile
            key={attribute.key}
            attribute={attribute}
            value={spread[attribute.key]}
            bonus={spread[attribute.key] - ATTRIBUTE_BASE}
          />
        ))}
      </div>

      {!spreadDone && (
        <p className="pick-line">
          Nothing assigned yet. All three sit at {ATTRIBUTE_BASE}.
          {/* Base plus your blood is where an unassigned sheet should stand.
              Anything else was typed in by hand, and assigning will rewrite it. */}
          {ATTRIBUTES.some(
            (a) => values[a.key] !== ATTRIBUTE_BASE + (state.lineage?.[a.key] ?? 0)
          ) && ' This sheet was written by hand, and assigning the boosts rewrites all three.'}
        </p>
      )}

      {bloodline.length > 0 && (
        <p className="pick-line">
          Your lineage carries {bloodline.join(' and ')} on top of this.
        </p>
      )}

      {grown && (
        <p className="frame-foot">
          Everything counted, the three now stand at{' '}
          {ATTRIBUTES.map((attribute) => `${attribute.label} ${totals[attribute.key]}`).join(' · ')}.
        </p>
      )}

      <DriftNotice character={character} state={state} patch={patch} readOnly={readOnly} />

      <div className="pick-tools">
        {!readOnly && (
          <button type="button" className="btn btn-pick btn-sm" onClick={() => setChoosing(true)}>
            {spreadDone ? 'Change your boosts' : 'Choose your Attribute Boosts'}
          </button>
        )}
        {!readOnly && spreadDone && (
          <>
            <span className="spacer" />
            <button
              type="button"
              className="btn btn-minimal btn-sm talent-drop"
              onClick={() => patch(clearLevelPick(character, level, 'boosts'))}
            >
              Clear
            </button>
          </>
        )}
      </div>

      {choosing && (
        <AttributeChooser
          title="Level 1: Assign your Attribute Boosts"
          lead={`Every attribute starts at ${ATTRIBUTE_BASE}. One takes the +2 and a different one takes the +1, so you finish on 6 / 5 / 4.`}
          slots={BOOSTS}
          start={{ major: boosts?.major ?? null, minor: boosts?.minor ?? null }}
          character={character}
          unit={unit}
          preview={(pick) => setBoosts(character, pick.major, pick.minor)}
          onTake={(pick) => {
            patch(setBoosts(character, pick.major, pick.minor));
            setChoosing(false);
          }}
          onClose={() => setChoosing(false)}
        />
      )}
    </PickBlock>
  );
}

/* ------------------------------------------------------------- odd levels */

/**
 * The two points every odd level after the first hands out.
 *
 * One apiece, on two *different* attributes, so a level can never pour both into
 * the same number. That is the level-1 spread's own law at a smaller size, which
 * is why the same chooser serves both: two slots, and tapping the one the other
 * slot holds trades places rather than refusing.
 *
 * A sheet written by the older build has one point recorded where two now
 * belong. It reads as one taken and one open rather than being cleared or
 * quietly doubled, so the block asks for the second and the ledger says so.
 */
export function AttributePointPick({
  character,
  state,
  level,
  patch,
  step = null,
  readOnly = false,
  unit = 'metric',
}) {
  const [choosing, setChoosing] = useState(false);

  const raised = state.at(level).raised ?? [];
  const done = raised.length >= ATTRIBUTE_POINTS;
  const taken = raised.map((key) => ATTRIBUTES.find((a) => a.key === key)).filter(Boolean);

  return (
    <PickBlock kind="attribute" step={step} title="Attribute Points" done={done}>
      <p className="pick-lead">
        Level {level} hardens two things about you. Put <b>+1</b> on one attribute and <b>+1</b> on
        another, so no level ever pours both into the same number.
      </p>

      <div className="attr-spread">
        {ATTRIBUTES.map((entry) => (
          <SpreadTile
            key={entry.key}
            attribute={entry}
            value={raised.includes(entry.key) ? 1 : 0}
            bonus={raised.includes(entry.key) ? 1 : 0}
            asDelta
          />
        ))}
      </div>

      {!done && (
        <p className="pick-line">
          {raised.length === 0
            ? `Nothing taken yet. Both of this level's points are unspent.`
            : `${taken.map((entry) => entry.label).join(' and ')} raised. One point still unspent.`}
        </p>
      )}

      <div className="pick-tools">
        {!readOnly && (
          <button type="button" className="btn btn-pick btn-sm" onClick={() => setChoosing(true)}>
            {done ? 'Change your points' : raised.length ? 'Place the other' : 'Choose two Attributes'}
          </button>
        )}
        {!readOnly && raised.length > 0 && (
          <>
            <span className="spacer" />
            <button
              type="button"
              className="btn btn-minimal btn-sm talent-drop"
              onClick={() => patch(clearLevelPick(character, level, 'raised'))}
            >
              Give them back
            </button>
          </>
        )}
      </div>

      {choosing && (
        <AttributeChooser
          title={`Level ${level}: Raise Two Attributes`}
          lead={`A point on each of two different attributes. They stack with everything you have raised before. ${
            done
              ? `Right now this level sits on ${taken.map((entry) => entry.label).join(' and ')}.`
              : 'This level has not spent both yet.'
          }`}
          slots={[
            { slot: 'first', bonus: 1, label: 'The first +1', note: 'any of the three' },
            { slot: 'second', bonus: 1, label: 'The second +1', note: 'a different one' },
          ]}
          start={{ first: raised[0] ?? null, second: raised[1] ?? null }}
          character={character}
          unit={unit}
          preview={(pick) => setLevelAttributes(character, level, [pick.first, pick.second])}
          onTake={(pick) => {
            patch(setLevelAttributes(character, level, [pick.first, pick.second]));
            setChoosing(false);
          }}
          onClose={() => setChoosing(false)}
        />
      )}
    </PickBlock>
  );
}

/* ------------------------------------------------------------------ parts */

/**
 * One attribute as this level touched it. `asDelta` prints the boost itself
 * rather than the total — an odd level gives +1, it does not give a 5.
 */
function SpreadTile({ attribute, value, bonus, asDelta = false }) {
  return (
    <div
      className={`attr-spread-tile${bonus ? ' is-boosted' : ''}`}
      style={{ '--attr-color': attribute.color }}
    >
      <span className="attr-spread-label">{attribute.label}</span>
      <span className="attr-spread-value">{asDelta ? (bonus ? `+${bonus}` : '·') : value}</span>
      <span className="attr-spread-foot">
        {asDelta
          ? bonus
            ? 'this level'
            : 'untouched'
          : bonus
            ? `${ATTRIBUTE_BASE} + ${bonus}`
            : 'base'}
      </span>
    </div>
  );
}

/**
 * The row disagreeing with its own ledger. Rare, and never silently repaired:
 * a number somebody typed into the database by hand is still a number they
 * meant, so the block says what it sees and offers to put it back.
 */
function DriftNotice({ character, state, patch, readOnly }) {
  if (state.drift.length === 0) return null;

  return (
    <p className="pick-notice is-warning">
      Your sheet reads{' '}
      {state.drift.map((key) => `${attributeLabel(key)} ${state.values[key]}`).join(' · ')}, but this
      ledger adds up to{' '}
      {state.drift.map((key) => `${attributeLabel(key)} ${state.totals[key]}`).join(' · ')}.
      {!readOnly && (
        <>
          {' '}
          <button
            type="button"
            className="btn btn-sub btn-sm"
            onClick={() => patch(reapplyTotals(character))}
          >
            Put them back
          </button>
        </>
      )}
    </p>
  );
}

/* --------------------------------------------------------------- chooser */

/**
 * One dialog for both sizes of the choice. `slots` is what is being handed out
 * — two boosts at level 1, one point at every odd level after — and each slot
 * gets its own row of the same three tiles.
 *
 * Two slots may never land on the same attribute, so tapping an attribute that
 * the other slot holds *swaps* them rather than refusing. There is no dead end
 * to back out of: every tap leaves a legal spread or an obviously unfinished
 * one.
 */
function AttributeChooser({ title, lead, slots, start, character, preview, onTake, onClose, unit }) {
  const [pick, setPick] = useState(start);

  function choose(slot, key) {
    setPick((prev) => {
      const other = slots.find((entry) => entry.slot !== slot && prev[entry.slot] === key);
      if (!other) return { ...prev, [slot]: key };
      // The other slot already sits here: trade places rather than refuse.
      return { ...prev, [slot]: key, [other.slot]: prev[slot] };
    });
  }

  const ready = slots.every((slot) => pick[slot.slot]);
  const next = ready ? preview(pick) : null;
  const short = slots.find((slot) => !pick[slot.slot]);

  return (
    <Modal
      title={title}
      onClose={onClose}
      wide
      accent={PICK_ACCENTS.attribute}
      footer={
        <>
          <span className="spacer" />
          <button
            type="button"
            className="btn btn-take btn-sm"
            disabled={!ready}
            onClick={() => onTake(pick)}
          >
            {ready
              ? slots.length > 1
                ? 'Take this spread'
                : 'Take the point'
              : `Choose where ${short.label.toLowerCase()} goes`}
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        {lead}
      </p>

      {slots.map((slot) => (
        <section className="kit-step" key={slot.slot}>
          <h4 className="kit-step-head">
            {slot.label} <span className="kit-step-note">{slot.note}</span>
          </h4>

          <div className="kit-options">
            {ATTRIBUTES.map((attribute) => {
              const held = pick[slot.slot] === attribute.key;
              const takenBy = slots.find(
                (entry) => entry.slot !== slot.slot && pick[entry.slot] === attribute.key
              );

              return (
                <button
                  type="button"
                  key={attribute.key}
                  className={`kit-option attr-option${held ? ' is-picked' : ''}`}
                  style={{ '--attr-color': attribute.color }}
                  onClick={() => choose(slot.slot, attribute.key)}
                >
                  <span className="attr-option-head">
                    <span className="attr-option-name">{attribute.label}</span>
                    <span className="attr-option-gain">+{slot.bonus}</span>
                  </span>
                  <span className="attr-option-note">{attribute.buys}</span>
                  {takenBy && (
                    <span className="attr-option-taken">
                      {takenBy.label} sits here, tap to trade places
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <Outcome character={character} next={next} unit={unit} />
    </Modal>
  );
}

/**
 * What the numbers actually buy. Attributes do nothing on their own, so a
 * chooser that only showed "Physique 6" would be asking people to do the
 * sheet's arithmetic in their heads.
 */
const OUTCOME_LINES = [
  { key: 'health_max', label: 'Health' },
  { key: 'willpower_max', label: 'Willpower' },
  { key: 'avoid', label: 'Defense' },
  { key: 'initiative', label: 'Initiative' },
  { key: 'speed_m', label: 'Speed', kind: 'speed' },
  { key: 'reflex', label: 'Reflex' },
  { key: 'grit', label: 'Grit' },
];

function Outcome({ character, next, unit }) {
  const level = Math.max(1, Math.floor(Number(character?.level) || 1));
  const now = deriveStats({ ...character, level });
  const after = next ? deriveStats({ ...character, ...next, level }) : null;

  return (
    <section className="kit-step">
      <h4 className="kit-step-head">
        What it buys <span className="kit-step-note">on this sheet, at level {level}</span>
      </h4>

      <ul className="kit-list">
        {OUTCOME_LINES.map((line) => {
          const from = now[line.key];
          const to = after ? after[line.key] : null;
          const moved = after !== null && to !== from;

          return (
            <li className={`kit-line attr-outcome${moved ? ' is-moved' : ''}`} key={line.key}>
              <span className="kit-line-label">{line.label}</span>
              <span className="kit-line-body">
                <span className="kit-line-value">
                  {show(line, from, unit)}
                  {moved && <span className="attr-outcome-to"> → {show(line, to, unit)}</span>}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function show(line, value, unit) {
  if (line.kind === 'speed') return formatSpeed(Math.round(value * 10) / 10, unit);
  return Math.floor(Number(value) || 0);
}
