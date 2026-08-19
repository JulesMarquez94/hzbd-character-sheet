import { useState } from 'react';
import Modal from '../Modal.jsx';
import AbilityCard from '../AbilityCard.jsx';
import { CostOrb } from '../CostOrbs.jsx';
import { VARIABLE_CAP } from '../../lib/actions.js';

/**
 * The one question every use on the Character tab has to ask: was that an
 * action, or a reaction?
 *
 * Nothing else about the use changes — the same card, the same Willpower, the
 * same charge off the flask. Only where the points come from moves: an action
 * is paid out of Action Points, a reaction out of Reaction Points.
 *
 * Both ways are always offered and both are always clickable. Picking one you
 * cannot pay for is exactly the case the notice is here for: it says which
 * pool came up short and by how much, and nothing at all is spent. The pools
 * are only ever emptied by the sheet's own maths, never dragged below zero to
 * make a use fit.
 *
 * Under the two ways sits the card itself, printed for this character — the
 * rolls it asks for, the numbers it deals. Nobody should have to spend points
 * on something and only afterwards go looking for what it did.
 *
 * Two things on the sheet do not have a printed cost, and both are standard
 * actions (see actions.js):
 *
 *   variable   Interact costs whatever the Game Master says it costs, so the
 *              prompt asks for the number instead of assuming one. Everything
 *              after that is the ordinary question.
 *   converts   Anticipate does not spend anything at all: Action Points move
 *              into the Reaction pool one for one. There is no action-or-
 *              reaction to ask about, so it is offered as the one thing it is,
 *              and the dial cannot be turned past what the pools can hold.
 */

/** The two pools a cost can come out of, and what each one is called. */
const WAYS = [
  {
    mode: 'action',
    label: 'As an Action',
    orb: 'ap',
    pool: 'ap',
    max: 'ap_max',
    resource: 'Action Points',
  },
  {
    mode: 'reaction',
    label: 'As a Reaction',
    orb: 'rp',
    pool: 'reaction',
    max: 'reaction_max',
    resource: 'Reaction Points',
  },
];

/** With nothing to pay in points, there is no question left to ask. */
const CONFIRM_ONLY = { ...WAYS[0], label: 'Use It' };

/** Anticipate: the points are not spent, they cross from one pool to the other. */
const CONVERT = { ...WAYS[0], mode: 'convert', label: 'Hold Back' };

export default function UsePrompt({ request, character, onCancel, onConfirm }) {
  // The way that was asked for and could not be paid, until another is tried.
  const [denied, setDenied] = useState(null);

  const converts = Boolean(request.converts);
  // How far the dial goes. A conversion is capped by both pools, since moving
  // a point that neither can hold is not a choice, it is a mistake.
  const ceiling = converts ? convertRoom(character) : VARIABLE_CAP;
  const [dialled, setDialled] = useState(() => Math.min(1, ceiling));

  const ap = request.variable ? dialled : Number(request.ap) || 0;
  const wp = Number(request.wp) || 0;
  const ways = converts ? [CONVERT] : ap > 0 ? WAYS : [CONFIRM_ONLY];

  function attempt(way) {
    const short = shortfalls(character, { ap, wp }, way);
    if (short.length > 0) {
      setDenied({ way, short });
      return;
    }
    onConfirm(way.mode, ap);
  }

  function dial(next) {
    setDialled(Math.max(0, Math.min(ceiling, next)));
    setDenied(null);
  }

  return (
    <Modal
      title={`Use — ${request.name}`}
      onClose={onCancel}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onCancel}>
            Cancel
          </button>
        </>
      }
    >
      <div className="use-prompt">
        <p className="use-source">{request.source}</p>

        <span className="use-question">
          {converts
            ? 'How many points do you want waiting on somebody else?'
            : request.variable
              ? 'How many Action Points is this worth? Your Game Master decides.'
              : ap > 0
                ? 'Is this your action, or are you reacting to something?'
                : 'Nothing but the cost below leaves your sheet.'}
        </span>

        {/* The dial only appears for the two actions with no printed cost. */}
        {request.variable && (
          <Dial
            value={dialled}
            ceiling={ceiling}
            onChange={dial}
            label={converts ? 'Points held back' : 'Action Points'}
            hint={converts ? convertHint(character, ceiling) : null}
          />
        )}

        <div className="use-ways">
          {ways.map((way) => {
            const pool = Number(character[way.pool]) || 0;
            const cap = Number(character[way.max]) || 0;

            return (
              <button
                type="button"
                key={way.mode}
                className="use-way"
                onClick={() => attempt(way)}
                disabled={converts && ap === 0}
                aria-label={`${way.label} — ${costLine(ap, wp, way.resource)}`}
              >
                <span className="use-way-costs">
                  {ap > 0 && <CostOrb kind={way.orb} value={ap} size={30} />}
                  {/* A conversion shows both ends of the move, not one cost. */}
                  {converts && ap > 0 && <span className="use-way-arrow">&rarr;</span>}
                  {converts && ap > 0 && <CostOrb kind="rp" value={ap} size={30} />}
                  {wp > 0 && <CostOrb kind="wp" value={wp} size={30} />}
                  {ap === 0 && wp === 0 && (
                    <span className="use-way-free">{converts ? 'None' : 'Free'}</span>
                  )}
                </span>

                <span className="use-way-body">
                  <span className="use-way-label">{way.label}</span>
                  {converts ? (
                    <span className="use-way-pool">
                      {ap === 0
                        ? 'Nothing to move right now'
                        : `${pool} of ${cap} Action Points left, ${
                            (Number(character.reaction) || 0) + ap
                          } of ${Number(character.reaction_max) || 0} Reaction Points after`}
                    </span>
                  ) : (
                    ap > 0 && (
                      <span className="use-way-pool">
                        {pool} of {cap} {way.resource} left
                      </span>
                    )
                  )}
                  {ap === 0 && wp > 0 && (
                    <span className="use-way-pool">
                      {Number(character.willpower) || 0} of {Number(character.willpower_max) || 0}{' '}
                      Willpower left
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* What the item itself loses, on top of the points. */}
        {request.note && <p className="use-note">{request.note}</p>}

        {/* What you are about to do, as the card reads for you. */}
        {request.card && (
          <div className="use-card">
            <AbilityCard
              ability={request.card}
              character={character}
              modifiers={request.modifiers}
            />
          </div>
        )}

        {denied && (
          <div className="use-denied" role="alert">
            <span className="use-denied-head">
              Not done — {denied.way.label.toLowerCase()} is beyond you right now.
            </span>
            {denied.short.map((entry) => (
              <span className="use-denied-line" key={entry.resource}>
                <b>{entry.resource}</b> — {entry.need} needed, {entry.have} left
              </span>
            ))}
            <span className="use-denied-foot">Nothing was spent.</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * The number an action with no printed cost is being used at.
 *
 * Two steppers rather than a slider or a typed box: the numbers involved are
 * single digits, and this is read at a table with one hand on a die.
 */
function Dial({ value, ceiling, onChange, label, hint }) {
  return (
    <div className="use-dial">
      <div className="use-dial-row">
        <button
          type="button"
          className="use-dial-step"
          onClick={() => onChange(value - 1)}
          disabled={value <= 0}
          aria-label="One fewer"
        >
          &minus;
        </button>

        <span className="use-dial-value">
          <span className="use-dial-n">{value}</span>
          <span className="use-dial-label">{label}</span>
        </span>

        <button
          type="button"
          className="use-dial-step"
          onClick={() => onChange(value + 1)}
          disabled={value >= ceiling}
          aria-label="One more"
        >
          +
        </button>
      </div>

      {hint && <span className="use-dial-hint">{hint}</span>}
    </div>
  );
}

/**
 * How many points a conversion may move: what the Action pool actually holds,
 * and no further than the Reaction pool's own ceiling. Moving a point neither
 * end can take is not a choice the sheet should offer.
 */
function convertRoom(character) {
  const ap = Number(character?.ap) || 0;
  const room = (Number(character?.reaction_max) || 0) - (Number(character?.reaction) || 0);
  return Math.max(0, Math.min(ap, room));
}

/** Why the dial stops where it stops. */
function convertHint(character, ceiling) {
  if (ceiling > 0) return `${ceiling} is as many as both pools can take.`;
  return (Number(character?.ap) || 0) === 0
    ? 'You have no Action Points to hold back.'
    : 'Your Reaction Points are already full.';
}

/** The cost in words, for the readers who never see the orbs. */
function costLine(ap, wp, resource) {
  const parts = [];
  if (ap > 0) parts.push(`${ap} ${resource}`);
  if (wp > 0) parts.push(`${wp} Willpower`);
  return parts.length > 0 ? parts.join(' and ') : 'costs nothing';
}

/**
 * Which pools cannot cover this use, paid this way. An empty list means it can
 * be paid; anything in it is what the notice reads out.
 */
function shortfalls(character, { ap, wp }, way) {
  const short = [];

  const points = Number(character[way.pool]) || 0;
  if (ap > points) short.push({ resource: way.resource, need: ap, have: points });

  const willpower = Number(character.willpower) || 0;
  if (wp > willpower) short.push({ resource: 'Willpower', need: wp, have: willpower });

  return short;
}
