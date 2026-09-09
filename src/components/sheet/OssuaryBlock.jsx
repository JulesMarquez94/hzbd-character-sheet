import { useState } from 'react';
import UsePrompt from './UsePrompt.jsx';
import { InfoButton } from './LoadoutBlock.jsx';
import CostOrbs from '../CostOrbs.jsx';
import { ResourceBar } from './parts.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { cardCost } from '../../lib/cardText.js';
import { shortName } from '../../lib/combatBar.js';
import { dropMinion, minionState } from '../../lib/minions.js';
import { commandOf, commandRiders, commanded, undeadOffers } from '../../lib/undead.js';
import { usePlayCard } from './usePlayCard.js';

/**
 * The Ossuary block: the one a talent set adds when it keeps a graveyard.
 *
 * Three things, and they are the three the set is made of:
 *
 *   the Marrow    how much is in it and how much is spent, on the sheet's own
 *                 resource bar, because it is a pool like any other.
 *   the risen     every body it is holding, what each one cost, and the one press
 *                 that lets one go. A destroyed body is still in here until it is
 *                 laid to rest or a Long Rest sweeps it up — its Marrow came back
 *                 the moment it fell and its Willpower did not, which is the one
 *                 place on this sheet where two costs of one thing end at
 *                 different times. See "a body that fell" in undead.js.
 *   the Command   the Action Points that turn a row of standing corpses into a
 *                 fight, and whether they have been spent this turn. One per four
 *                 Marrow standing, so the price is on the card rather than in it.
 *
 * ------------------------------------------------------------------- one block
 * A body gets two blocks of its own, because it has a stat block and a turn to
 * spend. The Ossuary has neither: it is a count, a list and a press. So it is one
 * ordinary 360x640 cell and the list is the only part with no natural length,
 * which makes the list the part that scrolls. Same arrangement the slate and a
 * creature's action block both make.
 *
 * -------------------------------------------------------------- the one press
 * Commanding is an ordinary card, played through the same prompt and the same
 * `usePlayCard` every other use on this sheet goes through: the action or reaction
 * question, the price, the log line, and the one-turn row it lays because its own
 * text says "until your next Turn End". It is on the quick bar too, and
 * deliberately: that bar is everything you can spend points on in reaching order.
 * This is where you look at what the press is *for*.
 *
 * Nothing here raises a body. That is a Long Rest action and it happens in the
 * rest window, which is the only place it could: see RaiseWindow.jsx.
 */
export default function OssuaryBlock({ character, state, patch, readOnly = false }) {
  const [request, setRequest] = useState(null);
  const stack = useCardStack();
  const play = usePlayCard({ character, patch });

  const { spec, total, spent, left, over, perMarrow, owed, wrecked, bodies, wrecks } = state;
  /* Everything still on its feet, which is what the Command wakes and what every
     line below counts. A wreck is in `bodies` and in the list, because it is
     still holding Willpower and still has to be buried. */
  const up = bodies.length - wrecks.length;

  /* The bodies as the sheet knows them, so this block can say which of them is
     broken. This file may read both; undead.js may not read either (see the note
     on imports at the top of it), which is why the Marrow above is a count of
     rows and the word "Destroyed" below is looked up here. */
  const standing = minionState(character);
  const rowFor = (id) => standing.find((one) => one.id === id) ?? null;

  const card = commandOf(state);
  const woken = commanded(character, state);

  /* What the press costs, off the Marrow in use rather than off the card. Read
     through the same rider the quick bar and the Abilities tab read it through,
     so the three of them can never print three different numbers. See
     `commandRiders` in undead.js. */
  const riders = commandRiders(character, state.id)[card?.id] ?? null;
  const cost = cardCost(card, riders);

  function command() {
    if (!card) return;

    setRequest({
      name: shortName(card),
      source: `${card.name} · ${spec.label}`,
      ap: cost.ap,
      wp: cost.wp,
      card,
      modifiers: riders,
      note:
        up === 0
          ? 'Nothing standing, so nothing to wake.'
          : `${up} ${up === 1 ? 'body' : 'bodies'} can act until your Turn End, at 1 Action Point for every 4 Marrow standing.`,
    });
  }

  return (
    <div className="cell-scroll ossuary-block">
      <div className="block-head">
        <span className="stat-category-label">{spec.label}</span>
        <span className="spacer" />
        <span className={`block-count${left > 0 ? ' is-open' : ''}`}>
          {left} of {total} left
        </span>
      </div>

      {/* What is *left*, not what is spent, because that is what every other bar
          on this sheet reads: a full Health bar is Health you have and a full
          Marrow bar is Marrow to spend. Measured against the ceiling rather than
          against the debt, so an Ossuary holding more than it should reads as an
          empty bar with a warning under it instead of a full bar that quietly
          moved its own ceiling. */}
      <ResourceBar
        label={spec.resource ?? 'Marrow'}
        current={left}
        max={total}
        color="var(--family-death)"
        title={`${spent} of ${total} ${spec.resource ?? 'Marrow'} is in bodies you are holding`}
      />

      {/* ---------- WHO IS STANDING ----------
          The only part of this block with no natural length, so it is the part
          that scrolls. Everything above and below keeps its place. */}
      <div className="ossuary-list">
        {bodies.length === 0 ? (
          <p className="pick-line">
            Nothing raised. Your {spec.label} holds {total} {spec.resource ?? 'Marrow'}, and the
            cheapest body costs {cheapest(state)}. Raising one is a Long Rest action.
          </p>
        ) : (
          bodies.map((body) => (
            <BodyRow
              key={body.id}
              body={body}
              row={rowFor(body.id)}
              spec={spec}
              readOnly={readOnly || !patch}
              onRest={() => {
                const next = dropMinion(character, body.id);
                if (next) patch(next);
              }}
            />
          ))
        )}
      </div>

      {over > 0 && (
        <p className="pick-notice is-warning">
          {over} more {spec.resource ?? 'Marrow'} than you have. Lay something to rest.
        </p>
      )}

      {/* ---------- WHAT THEY ARE COSTING ----------
          The idea the set is built on, said where the list is: every body in here
          is worth Willpower its keeper no longer has, and it comes back the
          moment the body does. */}
      {owed > 0 && (
        <p className="ossuary-debt">
          <b>{owed} Willpower</b> of your maximum is in {bodies.length === 1 ? 'it' : 'them'}, at{' '}
          {perMarrow} for every {spec.resource ?? 'Marrow'} spent, and it comes back with any body
          you lay to rest.
          {wrecked > 0 && (
            <>
              {' '}
              {wrecked} of it is in {wrecks.length === 1 ? 'a wreck' : `${wrecks.length} wrecks`},
              whose {spec.resource ?? 'Marrow'} you already have back.
            </>
          )}
        </p>
      )}

      {/* ---------- THE COMMAND ----------
          Under the list, because it is about the list: this is the press that
          makes any of it able to act. It says which of the two states it is in
          rather than only offering the button, since "did I command this turn"
          is the question a Necromancer asks most. */}
      {card && (
        <div className={`ossuary-command${woken ? ' is-on' : ''}`}>
          <button
            type="button"
            className="use-row-main"
            onClick={command}
            disabled={readOnly || !patch}
            title={
              woken
                ? `Already commanded. They can act until your Turn End`
                : `Wake ${up === 1 ? 'it' : 'them'} for the turn. ${cost.ap} Action ${cost.ap === 1 ? 'Point' : 'Points'} for ${spent} ${spec.resource ?? 'Marrow'} standing`
            }
          >
            <span className="use-row-name">{shortName(card)}</span>
            <CostOrbs ap={cost.ap} wp={cost.wp} size={19} className="use-row-costs" />
          </button>

          <InfoButton onClick={() => stack?.openCard(card)} label={`${card.name} card`} />
        </div>
      )}

      <p className="ossuary-foot">
        {up === 0
          ? 'Nothing standing to command.'
          : woken
            ? `Commanded. ${up === 1 ? 'It acts' : 'They act'} on your turn until your Turn End.`
            : `Not commanded. ${up === 1 ? 'It stands' : 'They stand'} where ${up === 1 ? 'it is' : 'they are'} and does nothing.`}
      </p>

      {request && (
        <UsePrompt
          request={request}
          character={character}
          onCancel={() => setRequest(null)}
          onConfirm={(mode, amount, options) => {
            play(request, mode, amount, options);
            setRequest(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * One body on one line: who it is, what it cost, whether it is still standing,
 * and the press that lets it go.
 *
 * Laying one to rest is the only thing on this sheet that takes a creature off
 * the board by hand, so it asks first. A body cannot be brought back: what it
 * knew was chosen the night it rose, and raising another is another night's work
 * and another corpse.
 */
function BodyRow({ body, row, spec, readOnly, onRest }) {
  const [asking, setAsking] = useState(false);
  const name = row?.title ?? body.row.name ?? 'Unnamed';
  const label = body.kind?.label ?? body.kind ?? 'unknown';

  if (!body.known) {
    return (
      <p className="pick-line">
        {name} is in your {spec.label} and this build&rsquo;s codex has no body by that name.
      </p>
    );
  }

  return (
    <div className={`ossuary-row${body.down ? ' is-down' : ''}`}>
      <span className="ossuary-row-body">
        <span className="ossuary-row-name">{name}</span>
        <span className="ossuary-row-note">
          {/* A wreck reads its Willpower where a standing body reads its Marrow,
              because the wreck has already given the Marrow back and the
              Willpower is the only thing it is still costing. */}
          {label} ·{' '}
          {body.down
            ? `${body.willpower} Willpower`
            : `${body.cost} ${spec.resource ?? 'Marrow'}`}
          {row ? (row.down ? ' · Destroyed' : ` · ${row.health} of ${row.stats.health_max}`) : ''}
        </span>
      </span>

      {!readOnly &&
        (asking ? (
          <span className="ossuary-row-ask">
            <button type="button" className="rest-opt is-gain" onClick={onRest}>
              Let it go
            </button>
            <button type="button" className="rest-opt" onClick={() => setAsking(false)}>
              Keep it
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="rest-opt"
            onClick={() => setAsking(true)}
            title={
              body.down
                ? `Bury ${name}. Its ${spec.resource ?? 'Marrow'} is already back; this is the ${body.willpower} maximum Willpower`
                : `Lay ${name} to rest. ${body.cost} ${spec.resource ?? 'Marrow'} and ${body.willpower} maximum Willpower come back, and it is gone for good`
            }
          >
            {row?.down ? 'Bury it' : 'Lay to rest'}
          </button>
        ))}
    </div>
  );
}

/** What the cheapest body in the roster costs, for the empty line. */
function cheapest(state) {
  const costs = undeadOffers(state).map((offer) => offer.cost);
  const low = costs.length > 0 ? Math.min(...costs) : 0;
  return `${low} ${state.spec.resource ?? 'Marrow'}`;
}
