import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import { LoadoutChooser } from './LoadoutPick.jsx';
import EnchantRest from './EnchantRest.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { formatNumber } from '../../lib/characterModel.js';
import { getRest, labourAffordable, restEnchanting, restLabours, restPlan } from '../../lib/rest.js';
import { restSwaps, toggleLoadoutPick } from '../../lib/loadouts.js';
import { setTalentPicks } from '../../lib/talents.js';

/**
 * Taking a rest, said out loud before it happens.
 *
 * A rest moves several pools at once and ends several effects at once, which
 * makes it the one thing on the sheet most worth reading before confirming.
 * So the window is the plan: every line the rest is about to write, in the
 * order it writes them, with the crate's balance underneath. Nothing is
 * guessed at after the fact.
 *
 * A short rest is only that list. A long rest is the list plus the work of the
 * camp: the background skills that are actions taken *during* a long rest,
 * each with the numbers its own card names. Crafting a potion for Supplies is
 * a thing you do while resting, so this is where it is done, and picking an
 * amount folds it into the same write and the same ledger as the rest itself.
 *
 * Both kinds also re-prepare. A set that chooses its own cards names the rests
 * that may re-choose them — a Mycomancer swaps spells "after a successful short
 * or long rest" — so the pool is opened from here, before the rest is taken,
 * which is when a player actually decides what tomorrow looks like. The new hand
 * rides in the rest's own patch: cancel the rest and you cancel the swap.
 *
 * An Enchanter's evening is the third thing, and a long rest only. ENCHANTING is
 * a Long Rest action and WIELDER OF WONDER is a Long Rest choice, so both are
 * here — one section, two rows — and both write into the same `prepared` draft as
 * the spell swaps, priced into the same crate and the same ledger. See
 * EnchantRest.jsx.
 */
export default function RestPrompt({ kind, character, onRest, onClose }) {
  const rest = getRest(kind);
  const stack = useCardStack();

  /* The one piece of work chosen for this rest, or null.
     A long rest buys exactly one action, so this is a single choice and not a
     basket: picking a second replaces the first rather than adding to it, and
     tapping the one you already hold puts it back. */
  const [chosen, setChosen] = useState(null);

  /* The talents column as this window has re-prepared it, or null while it is
     untouched. Nothing is written until the rest is taken. */
  const [prepared, setPrepared] = useState(null);
  /* Which set's pool is open on top of this window, by talent id. */
  const [swapping, setSwapping] = useState(null);

  const talents = prepared ?? character.talents;

  const labours = useMemo(
    () => (kind === 'long' ? restLabours(character) : []),
    [kind, character]
  );

  // Every set that may re-choose its hand on a rest of this kind.
  const swaps = useMemo(() => restSwaps(talents, kind), [talents, kind]);

  /* What this character's Enchanter can do tonight, read off the *draft* rather
     than the row, so a slot filled a moment ago shows as filled. Null for
     everyone who is not one, and on a short rest, which neither card mentions. */
  const enchanter = useMemo(
    () => restEnchanting({ ...character, talents }, kind),
    [character, talents, kind]
  );
  const swapRow = swaps.find((row) => row.talent.id === swapping) ?? null;

  const picked = useMemo(() => {
    if (!chosen) return [];
    const row = labours.find((entry) => entry.card.id === chosen.id);
    return row ? [{ card: row.card, amount: chosen.amount, gain: chosen.gain }] : [];
  }, [chosen, labours]);

  const plan = useMemo(
    () => restPlan(character, kind, picked, prepared),
    [character, kind, picked, prepared]
  );

  const holds = (card, option) =>
    chosen?.id === card.id && chosen.amount === option.amount && chosen.gain === option.gain;

  function choose(card, option) {
    setChosen((current) =>
      current?.id === card.id && current.amount === option.amount && current.gain === option.gain
        ? null
        : { id: card.id, amount: option.amount, gain: option.gain }
    );
  }

  if (!rest || !plan) return null;

  return (
    <Modal
      title={`Take a ${rest.label}`}
      onClose={onClose}
      wide={kind === 'long'}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-copper btn-sm"
            onClick={() => {
              onRest(plan.patch);
              onClose();
            }}
            disabled={!plan.affordable}
            title={
              plan.affordable
                ? undefined
                : `${plan.short} more Supplies than the crate holds. Nothing about this rest happens.`
            }
          >
            Yes, rest
          </button>
        </>
      }
    >
      <div className="rest-prompt">
        <p className="rest-blurb">{rest.blurb}</p>

        <span className="fx-label">What it does</span>
        <ul className="rest-lines">
          {plan.lines.map((line) => (
            <li className={`rest-line rest-line-${line.tone}`} key={line.key}>
              <span className="rest-line-label">{line.label}</span>
              <span className="rest-line-detail">{line.detail}</span>
            </li>
          ))}
        </ul>

        <div className={`rest-crate${plan.affordable ? '' : ' is-short'}`}>
          <span className="rest-crate-label">Supplies after</span>
          <span className="rest-crate-value">
            {plan.affordable
              ? `${formatNumber(character.supplies)} to ${formatNumber(plan.supplies)}`
              : `${formatNumber(character.supplies)}, and ${formatNumber(plan.short)} short`}
          </span>
        </div>

        {!plan.affordable && (
          <p className="rest-refused" role="alert">
            <b>You cannot afford this.</b> A rest is paid for out of the crate, and yours does not
            hold enough. Nothing here happens: no Supplies move, nothing is restored and nothing
            ends. Find {formatNumber(plan.short)} more first{picked.length > 0 ? ', or do less work in camp' : ''}.
          </p>
        )}

        {/* ---------- WHAT YOU PREPARE ---------- *
            Offered on whichever rest the granting card allows, and only to the
            sets that allow it. Changing a hand here changes nothing yet: the new
            picks sit in this window until the rest is taken, and appear in the
            list above as a line like everything else the rest writes. */}
        {swaps.length > 0 && (
          <>
            <span className="fx-label">
              What you prepare
              <span className="rest-labour-rule">Yours to change until you rest</span>
            </span>

            <div className="rest-labours">
              {swaps.map(({ talent, state }) => (
                <div className="rest-labour is-prepare" key={talent.id}>
                  <button
                    type="button"
                    className="rest-labour-head"
                    onClick={() => setSwapping(talent.id)}
                    title={`Open the ${state.spec.label.toLowerCase()} ${talent.name} carries`}
                  >
                    <span className="rest-labour-name">
                      {talent.name} · {state.spec.label}
                    </span>
                    <span className="rest-labour-line">
                      {state.picks.length > 0
                        ? state.picks
                            .map((pick) => pick.card?.name ?? pick.id)
                            .join(' · ')
                        : `Nothing prepared. This set knows ${state.known}.`}
                    </span>
                  </button>

                  <span className="rest-labour-opts">
                    <button
                      type="button"
                      className={`rest-opt${state.remaining > 0 ? ' is-gain' : ''}`}
                      onClick={() => setSwapping(talent.id)}
                      title={`Change what ${talent.name} carries out of this rest`}
                    >
                      {state.remaining > 0 ? `Choose ${state.remaining}` : 'Swap'}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- WHAT YOU ENCHANT ---------- *
            An Enchanter's own two cards, both of which happen at a long rest and
            nowhere else. Priced into the plan above like everything else. */}
        {enchanter && (
          <EnchantRest
            character={character}
            talents={talents}
            kind={kind}
            readOnly={false}
            onDraft={setPrepared}
          />
        )}

        {/* ---------- THE WORK OF THE CAMP ---------- */}
        {kind === 'long' && (
          <>
            <span className="fx-label">
              The work of the camp
              <span className="rest-labour-rule">One action, and only one</span>
            </span>

            {labours.length === 0 ? (
              <p className="pick-line">
                Nothing you know is done during a rest. Skills that are, like crafting or foraging,
                appear here when you take one.
              </p>
            ) : (
              <div className="rest-labours">
                {labours.map(({ card, options }) => (
                  <div
                  className={`rest-labour${chosen?.id === card.id ? ' is-chosen' : ''}${
                    chosen && chosen.id !== card.id ? ' is-passed' : ''
                  }`}
                  key={card.id}
                >
                    <button
                      type="button"
                      className="rest-labour-head"
                      onClick={() => stack?.openCard(card)}
                      title={`${card.name} — read the card`}
                    >
                      <span className="rest-labour-name">{card.name}</span>
                      <span className="rest-labour-line">{card.summary}</span>
                    </button>

                    {options.length === 0 ? (
                      <span className="rest-labour-none">No set price. Move the crate by hand.</span>
                    ) : (
                      <span className="rest-labour-opts">
                        {options.map((option) => {
                          // Priced against the crate *after* the rest itself,
                          // so a chip you could never pay for is offered dead
                          // rather than failing at the last button.
                          const affordable = labourAffordable(character, kind, option);

                          return (
                            <button
                              type="button"
                              key={`${option.amount}-${option.gain}`}
                              className={`rest-opt${option.gain ? ' is-gain' : ''}${
                                holds(card, option) ? ' is-on' : ''
                              }`}
                              onClick={() => choose(card, option)}
                              disabled={!affordable}
                              title={
                                !affordable
                                  ? `${option.amount} Supplies is more than the crate holds once the rest is paid for`
                                  : holds(card, option)
                                    ? 'Chosen. Tap again to do nothing instead.'
                                    : `${card.name} for ${option.amount} Supplies`
                              }
                            >
                              {option.gain ? '+' : '−'}
                              {option.amount}
                            </button>
                          );
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* The same pool the block opens, writing into this window instead of
          into the character. */}
      {swapRow && (
        <LoadoutChooser
          talent={swapRow.talent}
          character={character}
          state={swapRow.state}
          onToggle={(cardId) =>
            setPrepared(toggleLoadoutPick(talents, swapRow.talent.id, cardId, swapRow.state.known))
          }
          onClear={() => setPrepared(setTalentPicks(talents, swapRow.talent.id, []))}
          onClose={() => setSwapping(null)}
        />
      )}
    </Modal>
  );
}
