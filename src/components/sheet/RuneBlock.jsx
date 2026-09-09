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
 * The rune block: the one a talent set adds when it cuts its spells into its
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

  const { talent, pool, runes, capacity, cut, over, recharge, spent } = slate;

  /* The chooser reads the sheet's own panel state: capped at what the slate can
     hold rather than at what tonight allows, because this is the sheet and not a
     rest. The rest window still grants exactly one. See loadoutState. */
  const state = loadoutState(character?.talents, talent, {
    level: levelForXp(character?.xp),
    capped: 'capacity',
    attributes: character,
  });

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
          {cut} of {capacity} cut
        </span>
        {!readOnly && patch && (
          <button
            type="button"
            className="minion-edit"
            onClick={() => setChoosing(true)}
            title={`Change what is cut into you. ${capacity} ${
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
            Bare skin. Your slate holds {capacity} {capacity === 1 ? 'rune' : 'runes'} and nothing
            is cut into it yet.
          </p>
        ) : (
          runes.map((rune) => (
            <RuneRow
              key={rune.id}
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
          {over} more than your skin holds. Cut some away.
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
          ? ` A Short Rest brings back ${recharge.budget} Willpower worth of them, chosen in the rest window.`
          : ''}
      </p>

      {choosing && state && (
        <LoadoutChooser
          talent={talent}
          character={character}
          state={state}
          readOnly={readOnly || !patch}
          onToggle={(cardId) =>
            patch({ talents: toggleLoadoutPick(character?.talents, talent.id, cardId, state.known) })
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
  const { card, fired, modifiers } = rune;

  if (!card) {
    return (
      <p className="pick-line">
        {rune.id} is cut into you, and this build&rsquo;s codex has no card by that name.
      </p>
    );
  }

  const cost = cardCost(card, modifiers);

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
              : `Fire ${shortName(card)}`
        }
      >
        <span className="use-row-name">{shortName(card)}</span>

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
