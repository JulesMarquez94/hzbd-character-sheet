import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import AbilityCard from '../AbilityCard.jsx';
import { CostOrb } from '../CostOrbs.jsx';
import { AmmoPips } from './itemParts.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { VARIABLE_CAP } from '../../lib/actions.js';
import { getKeyword } from '../../lib/keywords.js';
import { costWords, halfPrice, halfRoom, secondHalf } from '../../lib/overcast.js';

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
 * The notice lands directly under the two ways rather than at the foot of the
 * dialog. This prompt is a whole card tall, and a refusal printed below that
 * card is a refusal nobody reads — it belongs beside the tap that earned it.
 *
 * It carries the way out with it. "Use it anyway" is the table's override, for
 * the ruling that a use stands whatever the sheet thinks of it: the use goes
 * through exactly as a paid one does, and not one point leaves a pool. Still
 * nothing dragged below zero — a cost forgiven rather than a cost paid.
 *
 * ------------------------------------------------------------- two columns
 * Beside all of it sits the card itself, printed for this character — the
 * rolls it asks for, the numbers it deals. Nobody should have to spend points
 * on something and only afterwards go looking for what it did.
 *
 * Beside, and no longer under. Everything you decide is in the left column and
 * the card is in the right, because the card is what the decisions are *about*:
 * take a Multicast and the card's second half is right there saying what each
 * extra target buys. Stacked, that half was 640 pixels below the control that
 * priced it. Under 760 pixels there is no room for two columns of anything, so
 * the card drops back under the choices and the old single file returns.
 *
 * -------------------------------------------------------- the second half
 * Most spells carry an optional second half, and until now the sheet printed it
 * and charged nothing for it. Now it is offered here as a thing you take, with
 * its price added to the way you tap:
 *
 *   Overcast     spend more to do more
 *   Multicast    spend more to catch more targets, any number of times
 *   Blood Tithe  pay in Health, which no card prints as a cost
 *
 * What each one costs is read off the card's own prose rather than restated
 * anywhere — see src/lib/overcast.js. Two things about it show up here:
 *
 *   any number   a half that may be taken repeatedly gets a dial under it, and
 *                every step moves the orbs on both ways. The dial goes past
 *                what the pools hold on purpose, the same way the two ways stay
 *                clickable when you cannot afford them: the hint says how many
 *                you can actually pay for, and the notice says what came short.
 *   instead of   an Overcast written as its own later spend ("You can spend 2
 *                Action Points and 4 Willpower to hurl the flame") is paid in
 *                place of the printed cost, not on top of it. The cast it rides
 *                on was paid for on some earlier turn.
 *
 * Upkeep is the fourth name and it is not offered, because it is not a choice
 * made while casting: it is a toll at every Turn Start. It is printed as a line
 * so the player knows what they are signing up for, and combatTurn.js goes on
 * tracking it as the running effect it is.
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

/** Nothing owed, in the shape a price comes in. */
const NOTHING = { ap: 0, wp: 0, health: 0 };

export default function UsePrompt({ request, character, onCancel, onConfirm }) {
  /* The pile the printed card deals onto. This prompt is a dialog, and the pile
     sits above every dialog (see the z scale in index.css), so a number tapped
     here opens its working over the prompt and closes back onto it. Optional
     because the hook answers null outside a provider, and a card with no pile to
     deal onto prints its numbers flat rather than as dead buttons. */
  const cards = useCardStack();

  // The way that was asked for and could not be paid, until another is tried.
  const [denied, setDenied] = useState(null);

  const converts = Boolean(request.converts);
  // How far the dial goes. A conversion is capped by both pools, since moving
  // a point that neither can hold is not a choice, it is a mistake.
  const ceiling = converts ? convertRoom(character) : VARIABLE_CAP;
  const [dialled, setDialled] = useState(() => Math.min(1, ceiling));

  /* The card's second half, and how many times it has been taken. Zero is not
     taken at all, which is where every use starts: the printed cost is the cost
     until the player says otherwise. */
  const half = useMemo(() => secondHalf(request.card), [request.card]);
  const offer = half?.kind === 'option' ? half : null;
  const toll = half?.kind === 'toll' ? half : null;
  const [times, setTimes] = useState(0);

  // What the card rolls with, for a tithe written off an attribute.
  const stat = request.modifiers?.stat ?? request.card?.stat ?? 'instinct';

  const base = {
    ap: request.variable ? dialled : Number(request.ap) || 0,
    wp: Number(request.wp) || 0,
    health: 0,
  };
  const taken = Boolean(offer) && times > 0;
  const step = offer ? halfPrice(offer, character, 1, stat) : NOTHING;
  const extra = offer ? halfPrice(offer, character, times, stat) : NOTHING;

  /* The price as it stands. An "instead of" half replaces the printed cost
     rather than adding to it, because the cast it hangs off was paid for on an
     earlier turn. See the note above. */
  const price = !taken
    ? base
    : offer.instead
      ? extra
      : { ap: base.ap + extra.ap, wp: base.wp + extra.wp, health: extra.health };

  /* What the card printed, when something the caster carries has already cut it:
     an Arcanist at Rank 3 casts everything in their spellbook for one Action Point
     less. Shown only while nothing else is being added on top, because an Overcast
     moves the same number for its own reasons and two revisions on one orb is a sum
     nobody can read. See cardCost in cardText.js. */
  const apWas = !taken && Number(request.apWas) > 0 ? Number(request.apWas) : null;
  const cutFrom = request.apCutFrom ?? [];

  const ways = converts ? [CONVERT] : price.ap > 0 ? WAYS : [CONFIRM_ONLY];

  /* How many more steps the pools could actually pay for. An "instead of" half
     is not stacked on the printed cost, so nothing is committed against it. */
  const room = halfRoom(offer, character, offer?.instead ? NOTHING : base, stat);

  /* Whole numbers rather than a card and a count: the number printed beside the
     way you tap is the number that leaves the sheet. See spendUse. */
  const settled = taken
    ? { ...price, note: `${offer.name}: ${request.name}` }
    : null;

  function attempt(way) {
    const short = shortfalls(character, price, way);
    if (short.length > 0) {
      setDenied({ way, short });
      return;
    }
    onConfirm(way.mode, price.ap, settled ? { price: settled } : undefined);
  }

  /* The table's override. Whatever came up short is left alone rather than
     driven below zero, and everything else about the use happens as it would
     have: the charge, the effect, the window it opens. See `free` in
     combatBar.js, which is where a use has always been turned into a write. */
  function waveThrough() {
    if (denied) onConfirm(denied.way.mode, price.ap, { free: true, price: settled ?? undefined });
  }

  function dial(next) {
    setDialled(Math.max(0, Math.min(ceiling, next)));
    setDenied(null);
  }

  /* Any change to what is being bought clears the last refusal: it was a
     refusal of a different price. */
  function take(next) {
    setTimes(Math.max(0, Math.min(VARIABLE_CAP, next)));
    setDenied(null);
  }

  return (
    <Modal
      title={`Use: ${request.name}`}
      onClose={onCancel}
      wide
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
        <div className="use-choices">
          <p className="use-source">{request.source}</p>

          {/* Said in words as well as drawn, because this is the one line that
              explains why the orbs below disagree with what the card was written
              with. The card in the right-hand column strikes the old number
              through in the same breath. */}
          {apWas !== null && (
            <p className="use-cut">
              {cutFrom.length > 0 && <b>{listAnd(cutFrom)}</b>}
              {cutFrom.length > 0 ? ' · ' : ''}
              {apWas} Action Points cut to {price.ap}.
            </p>
          )}

          <span className="use-question">
            {converts
              ? 'How many points do you want waiting on somebody else?'
              : request.variable
                ? 'How many Action Points is this worth? Your Game Master decides.'
                : price.ap > 0
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

          {/* What else the card offers, above the ways, so the orbs on a way are
              already final by the time they are read. */}
          {offer && (
            <HalfOffer
              half={offer}
              step={step}
              times={times}
              room={room}
              base={base}
              onTake={take}
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
                  disabled={converts && price.ap === 0}
                  aria-label={`${way.label}: ${costLine(price, way.resource)}`}
                >
                  <span className="use-way-costs">
                    {price.ap > 0 && (
                      <CostOrb
                        kind={way.orb}
                        value={price.ap}
                        size={30}
                        was={apWas}
                        from={cutFrom}
                      />
                    )}
                    {/* A conversion shows both ends of the move, not one cost. */}
                    {converts && price.ap > 0 && <span className="use-way-arrow">&rarr;</span>}
                    {converts && price.ap > 0 && <CostOrb kind="rp" value={price.ap} size={30} />}
                    {price.wp > 0 && <CostOrb kind="wp" value={price.wp} size={30} />}
                    {price.health > 0 && <CostOrb kind="hp" value={price.health} size={30} />}
                    {price.ap === 0 && price.wp === 0 && price.health === 0 && (
                      <span className="use-way-free">{converts ? 'None' : 'Free'}</span>
                    )}
                  </span>

                  <span className="use-way-body">
                    <span className="use-way-label">{way.label}</span>
                    {converts ? (
                      <span className="use-way-pool">
                        {price.ap === 0
                          ? 'Nothing to move right now'
                          : `${pool} of ${cap} Action Points left, ${
                              (Number(character.reaction) || 0) + price.ap
                            } of ${Number(character.reaction_max) || 0} Reaction Points after`}
                      </span>
                    ) : (
                      price.ap > 0 && (
                        <span className="use-way-pool">
                          {pool} of {cap} {way.resource} left
                        </span>
                      )
                    )}
                    {price.ap === 0 && price.wp > 0 && (
                      <span className="use-way-pool">
                        {Number(character.willpower) || 0} of{' '}
                        {Number(character.willpower_max) || 0} Willpower left
                      </span>
                    )}
                    {/* A tithe is the one cost nothing else on the sheet says
                        out loud, so the way that charges it names the pool. */}
                    {price.health > 0 && (
                      <span className="use-way-pool">
                        {Number(character.health) || 0} Health now,{' '}
                        {Math.max(0, (Number(character.health) || 0) - price.health)} after
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Straight under the two ways, above the card: this is the answer to
              the tap, and the tap was up here. */}
          {denied && (
            <div className="use-denied" role="alert">
              <span className="use-denied-head">
                Not done: {denied.way.label.toLowerCase()} is beyond you right now.
              </span>
              {denied.short.map((entry) => (
                <span className="use-denied-line" key={entry.resource}>
                  <b>{entry.resource}</b> · {entry.need} needed, {entry.have} left
                </span>
              ))}
              <span className="use-denied-foot">Nothing was spent.</span>

              <button
                type="button"
                className="use-denied-anyway"
                onClick={waveThrough}
                aria-label="Use it anyway: it goes through and nothing is spent"
              >
                <span className="use-denied-anyway-label">Use it anyway</span>
                <span className="use-denied-anyway-note">
                  Goes through as written. No points leave your sheet.
                </span>
              </button>
            </div>
          )}

          {/* What is loaded, drawn rather than only said. "The preview to use
              should let you know as well", 2026-08-24: a round is the one cost the
              printed card cannot show, and this is the last moment before the
              trigger. The pips are what is in the weapon *now*, and the note under
              them is what will be in it after. */}
          {request.ammo && (
            <div className="use-ammo">
              <AmmoPips
                ammo={request.ammo}
                charges={request.ammoMax}
                used={request.ammoMax - request.ammoLeft}
              />
              <span className="use-ammo-line">
                {request.ammoLeft} of {request.ammoMax} {request.ammo.unit}
                {request.ammoMax === 1 ? '' : 's'} loaded
              </span>
            </div>
          )}

          {/* What the item itself loses, on top of the points. */}
          {request.note && <p className="use-note">{request.note}</p>}

          {/* And what this one keeps costing once it is running. Not an option,
              because nobody chooses an Upkeep: they owe it. */}
          {toll && (
            <p className="use-toll">
              <b>Upkeep</b> · {costWords(toll)} at every Turn Start once this is running. Miss one
              and it ends there.
            </p>
          )}
        </div>

        {/* What you are about to do, as the card reads for you, and readable the
            way any dealt card is: every live value on it opens its own working,
            and every {{link}} deals the card it names. The card printed here used
            to be the one card on the sheet that could not do either, which made
            "2d8 + 8" a number you had to take on faith at the exact moment you
            were being asked to pay for it. */}
        {request.card && (
          <div className="use-card">
            <AbilityCard
              ability={request.card}
              character={character}
              modifiers={request.modifiers}
              onValue={cards?.openValue}
              /* A linked card is cast as written, so it is dealt without this
                 one's modifiers — the same as a link on any other card. */
              onLink={cards ? (name) => cards.openCard(name) : null}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * The card's second half, offered as a thing you take.
 *
 * One tap turns it on, one tap turns it back off, and a half the card lets you
 * take repeatedly grows a dial once it is on. Two controls rather than one
 * because they answer two questions: whether, and how many.
 *
 * It wears the colour its name wears in card text, straight out of the
 * glossary — haze violet for an Overcast or a Multicast, blood red for a Blood
 * Tithe — so the control and the words on the card beside it are visibly the
 * same thing. The glossary's own sentence is its tooltip for the same reason:
 * what Multicast means is defined in exactly one place.
 */
function HalfOffer({ half, step, times, room, base, onTake }) {
  const keyword = getKeyword(half.name);
  const on = times > 0;

  return (
    <div className="use-half" style={keyword ? { '--half-accent': keyword.color } : undefined}>
      <button
        type="button"
        className={`use-half-take${on ? ' is-on' : ''}`}
        onClick={() => onTake(on ? 0 : 1)}
        aria-pressed={on}
        aria-label={`${half.name}: ${costWords(step)}${half.each ? ' each time' : ''}`}
        title={keyword?.detail}
      >
        <span className="use-half-costs">
          {step.ap > 0 && <CostOrb kind="ap" value={step.ap} size={26} />}
          {step.wp > 0 && <CostOrb kind="wp" value={step.wp} size={26} />}
          {step.health > 0 && <CostOrb kind="hp" value={step.health} size={26} />}
        </span>

        <span className="use-half-body">
          <span className="use-half-name">{half.name}</span>
          <span className="use-half-note">{halfNote(half)}</span>
        </span>
      </button>

      {on && half.each && (
        <Dial
          value={times}
          ceiling={VARIABLE_CAP}
          onChange={onTake}
          label="Times"
          hint={roomHint(room, base, half)}
        />
      )}
    </div>
  );
}

/** Whether taking it adds to the printed cost or stands in for it. */
function halfNote(half) {
  if (half.instead) return 'Instead of the printed cost, not on top of it';
  return half.each ? 'On top of the cast, as often as you like' : 'On top of the cast';
}

/** How many steps the pools can really pay for, under a dial that goes further. */
function roomHint(room, base, half) {
  if (room > 0) return `${room} is as many as your pools can pay for.`;
  return half.instead
    ? 'Your pools cannot cover even one of these.'
    : `Your pools cannot cover one of these on top of ${costWords(base)}.`;
}

/**
 * The number an action with no printed cost is being used at, and how many
 * times a repeatable second half has been taken.
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
function costLine({ ap, wp, health }, resource) {
  const parts = [];
  if (ap > 0) parts.push(`${ap} ${resource}`);
  if (wp > 0) parts.push(`${wp} Willpower`);
  if (health > 0) parts.push(`${health} Health`);
  if (parts.length === 0) return 'costs nothing';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * Which pools cannot cover this use, paid this way. An empty list means it can
 * be paid; anything in it is what the notice reads out.
 *
 * Health is in here for the Blood Tithe halves, and it is checked the same way
 * the pools are: a tithe you can pay down to nothing is a tithe you may pay,
 * because how close a character wants to stand to dying is theirs to decide.
 * One you cannot cover at all is refused, and nothing is taken.
 */
function shortfalls(character, { ap, wp, health }, way) {
  const short = [];

  const points = Number(character[way.pool]) || 0;
  if (ap > points) short.push({ resource: way.resource, need: ap, have: points });

  const willpower = Number(character.willpower) || 0;
  if (wp > willpower) short.push({ resource: 'Willpower', need: wp, have: willpower });

  const blood = Number(character.health) || 0;
  if (health > blood) short.push({ resource: 'Health', need: health, have: blood });

  return short;
}

/** "Perfect Casting", "Perfect Casting and Overload". */
function listAnd(words) {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
