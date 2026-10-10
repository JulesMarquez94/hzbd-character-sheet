import { useState } from 'react';
import UsePrompt from './UsePrompt.jsx';
import { InfoButton } from './LoadoutBlock.jsx';
import { LoadoutChooser } from './LoadoutPick.jsx';
import CostOrbs from '../CostOrbs.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { levelForXp } from '../../lib/characterModel.js';
import { cardCost } from '../../lib/cardText.js';
import { loadoutState, toggleLoadoutPick } from '../../lib/loadouts.js';
import { shortName } from '../../lib/combatBar.js';
import { setTalentPicks } from '../../lib/talents.js';
import { spendCardUse } from '../../lib/uses.js';
import { usePlayCard } from './usePlayCard.js';

/**
 * The rune block: the one a talent set adds when it writes its spells onto its
 * holder.
 *
 * Asked for directly (Jules, 2026-09-08): "I want to have a rune interface so a
 * new block that allow to preview and manage tattoo." Preview and manage are the
 * two halves, and they are the two halves this block has:
 *
 *   preview   every rune on one line, with what firing it costs in these hands
 *             and whether it has been fired since the last Long Rest. The ⓘ
 *             deals the real card, so what a rune actually *does* is one tap
 *             away without leaving the tab.
 *   manage    the chooser, which is the very panel the Abilities tab raises for
 *             every other pool on the sheet. A second chooser built for one set
 *             would be the one place the sheet asked for a hand differently.
 *
 * ------------------------------------------------------------------- one block
 * A creature needs two blocks because it has a stat block and a turn of its own.
 * A slate has neither: it is a list, a count and a press. Everything here fits
 * one 360x640 cell, and the list is the only part with no natural length, so the
 * *block* holds its shape and the list scrolls inside it. Same arrangement a
 * creature's action block makes with its quick bar.
 *
 * ------------------------------------------------------------------- the press
 * Tapping a rune fires it, and firing goes through the same prompt and the same
 * `usePlayCard` every other use on this sheet goes through: the action or
 * reaction question, the price, the log line and whatever the spell rolls. What
 * is different is only the price, and that is not this block's doing either. It
 * rides on the pool (`price` in loadouts.js) so a rune costs 1 Action Point and
 * no Willpower wherever it is met, here or on the quick bar, and the printed
 * numbers are struck through beside it in all of them.
 *
 * The runes are on the quick bar too, and deliberately. That bar is everything
 * you can spend points on in reaching order, and a rune is exactly that. This
 * block is where you look at the slate; that bar is where you reach for one
 * mid-turn without looking.
 */
export default function RuneBlock({ character, slate, patch, readOnly = false }) {
  // The rune waiting on the action-or-reaction question, or null.
  const [request, setRequest] = useState(null);
  const [choosing, setChoosing] = useState(false);
  const stack = useCardStack();
  const play = usePlayCard({ character, patch });

  /* Whether the slate has taken the whole maximum. `willpower_max` is already
     floored at zero by deriveStats, so this is the moment the floor is holding
     part of the debt back rather than the sheet charging it. See runeDebtFrom. */
  const spentOut = (Number(character?.willpower_max) || 0) <= 0;

  const { talent, pool, runes, capacity, cut, over, recharge, spent, debt } = slate;

  /* The chooser reads the sheet's own panel state: capped at what the slate can
     hold rather than at what tonight allows, because this is the sheet and not a
     rest. The rest window still grants exactly one. See loadoutState. */
  const state = loadoutState(character?.talents, talent, {
    level: levelForXp(character?.xp),
    capped: 'capacity',
    attributes: character,
  });

  /* How many the set itself still owes: two arrive with it, and until they are
     chosen an empty slate is a question nobody has been asked rather than a
     Runebearer who has decided against runes. See `start` in talents.js. */
  const owed = state?.owed ?? 0;

  function fire(rune) {
    const cost = cardCost(rune.card, rune.modifiers);

    setRequest({
      name: shortName(rune.card),
      source: `${rune.card.name} · ${pool.label}`,
      ap: cost.ap,
      wp: cost.wp,
      /* What the spell printed, so the prompt says the price was replaced rather
         than quietly charging a number the card beside it disagrees with. */
      apWas: cost.cut > 0 ? cost.printed : null,
      wpWas: cost.wpCut > 0 ? cost.wpPrinted : null,
      apCutFrom: cost.from,
      card: rune.card,
      modifiers: rune.modifiers,
      note: 'Its one firing. It comes back after a Long Rest.',
      /* And the rune spent, written in the same patch as the points. Backing out
         of the prompt writes neither. */
      extra: spendCardUse(character, rune.card),
    });
  }

  function confirmUse(mode, amount, options) {
    play(request, mode, amount, options);
    setRequest(null);
  }

  return (
    <div className="cell-scroll rune-block">
      <div className="block-head">
        <span className="stat-category-label">{pool.label}</span>
        <span className="spacer" />
        <span className={`block-count${cut < capacity ? ' is-open' : ''}`}>
          {cut} of {capacity}
        </span>
        {!readOnly && patch && (
          <button
            type="button"
            className="minion-edit"
            onClick={() => setChoosing(true)}
            title={`Change what is written on you. ${capacity} ${
              capacity === 1 ? 'rune' : 'runes'
            } in all`}
          >
            Inscribe
          </button>
        )}
      </div>

      {/* ---------- THE SLATE ----------
          The only part of this block with no natural length, so it is the part
          that scrolls. Everything above and below it keeps its place. */}
      <div className="rune-list">
        {runes.length === 0 ? (
          <p className="pick-line">
            Nothing inscribed yet.{' '}
            {owed > 0 ? `${owed} arrive with the set and are yours to choose. ` : ''}
            Your runework holds {capacity} {capacity === 1 ? 'rune' : 'runes'}, and each one you
            take will hold its own Willpower cost off your maximum.
          </p>
        ) : (
          runes.map((rune) => (
            <RuneRow
              key={rune.key}
              rune={rune}
              stack={stack}
              readOnly={readOnly || !patch}
              onFire={() => fire(rune)}
            />
          ))
        )}
      </div>

      {over > 0 && (
        <p className="pick-notice is-warning">
          {over} more than your runework holds. Take some off.
        </p>
      )}

      {/* ---------- WHAT THEY ARE HOLDING ----------
          The idea the whole set is built on, and the reason firing one costs
          nothing: a rune keeps the Willpower it would have cost to cast, for as
          long as it is on you. So the total is printed where the list is, and the
          line turns into a warning at the moment the maximum runs out. That is
          the workbook's own ask, that a Runebearer spending themselves down to
          nothing should never be a silent trap. */}
      {debt > 0 && (
        <p className={`rune-debt${spentOut ? ' is-warning' : ''}`}>
          {spentOut ? (
            <>
              <b>Your maximum Willpower is gone.</b> The runes on you are worth {debt}, which is
              more than you had to give. Nothing that is not a rune can be paid for until you
              take one off.
            </>
          ) : (
            <>
              <b>{debt} Willpower</b> of your maximum is in them, and it comes back with any
              rune you take off.
            </>
          )}
        </p>
      )}

      {/* ---------- WHAT COMES BACK ----------
          The one sentence that makes the list mean anything: a fired rune is
          gone for the day, and this is what gives it back. The Master card's
          budget is named here as well, because a Runebearer holding it needs to
          know what a Short Rest is worth before they decide to take one. */}
      <p className="rune-foot">
        {runes.length === 0
          ? 'Nothing on you to fire yet.'
          : spent.length === 0
            ? 'Nothing fired. Every rune on you is ready.'
            : `${spent.length} fired. ${
                spent.length === 1 ? 'It comes' : 'They come'
              } back with your next Long Rest.`}
        {recharge && runes.length > 0
          ? ` A Short Rest brings back ${recharge.count} of them, chosen in the rest window.`
          : ''}
      </p>

      {choosing && state && (
        <LoadoutChooser
          talent={talent}
          character={character}
          state={state}
          readOnly={readOnly || !patch}
          onToggle={(cardId, how) =>
            patch({
              talents: toggleLoadoutPick(character?.talents, talent.id, cardId, state.known, how),
            })
          }
          onClear={() => patch({ talents: setTalentPicks(character?.talents, talent.id, []) })}
          onClose={() => setChoosing(false)}
        />
      )}

      {request && (
        <UsePrompt
          request={request}
          character={character}
          onCancel={() => setRequest(null)}
          onConfirm={confirmUse}
        />
      )}
    </div>
  );
}

/**
 * One rune on one line: what it is, what firing it costs here, and whether there
 * is a firing left in it.
 *
 * The same `use-row` every other pressable row on this tab is, so a rune reads
 * as a thing you use rather than as an entry in a list. A spent one is refused
 * with the reason on it, which is the shape the belt gives an empty flask.
 */
function RuneRow({ rune, stack, readOnly, onFire }) {
  const { card, fired, modifiers, copy, copies } = rune;

  if (!card) {
    return (
      <p className="pick-line">
        {rune.id} is inscribed on you, and this build&rsquo;s codex has no card by that name.
      </p>
    );
  }

  const cost = cardCost(card, modifiers);
  /* Which of them this is, on the copies and nowhere else. The same spell may be
     inscribed more than once and each copy is its own firing, so two rows wearing
     one name have to be tellable apart at a glance: the first can be dark and the
     second live. */
  const which = copies > 1 ? `${copy} of ${copies}` : null;

  return (
    <div className={`use-row${fired ? ' use-row-spent' : ''}`}>
      <button
        type="button"
        className="use-row-main"
        onClick={onFire}
        disabled={readOnly || fired}
        title={
          fired
            ? `${card.name} has been fired. It comes back after a Long Rest.`
            : readOnly
              ? card.name
              : `Fire ${shortName(card)}${which ? ` (${which})` : ''}`
        }
      >
        <span className="use-row-name">
          {shortName(card)}
          {which && <span className="rune-copy">{which}</span>}
        </span>

        {fired ? (
          <span className="use-row-spent-note">Fired</span>
        ) : (
          <CostOrbs
            ap={cost.ap}
            wp={cost.wp}
            size={19}
            className="use-row-costs"
            apWas={cost.cut > 0 ? cost.printed : null}
            wpWas={cost.wpCut > 0 ? cost.wpPrinted : null}
            cutFrom={cost.from}
          />
        )}
      </button>

      <InfoButton onClick={() => stack?.openCard(card, modifiers)} label={`${card.name} card`} />
    </div>
  );
}
