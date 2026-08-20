import { useMemo, useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useCardStack } from '../../context/card-stack.js';
import { getEnchantment } from '../../lib/enchantments.js';
import { enchantOptions, enchanterState, layingCost, setWorn } from '../../lib/enchanting.js';

/**
 * WIELDER OF WONDER's slots: the enchantments an Enchanter wears on their own
 * person, and the shelf they are chosen from.
 *
 *   "The enchanter body is able to withstand the power of enchantments onto
 *    itself. Enchantments apply to your person. Choose one when becoming an
 *    enchanter, you can change it during a Long Rest. The amount of such
 *    enchantments you can have is equal to your rank in enchanter."
 *
 * That sentence names two moments and this component serves both, which is why it
 * is here rather than inside either of them:
 *
 *   **when becoming an enchanter**  the Advancement tab, on the block that just
 *                                   bought the rank. `autoOpen` is what makes the
 *                                   shelf arrive with the set instead of waiting
 *                                   to be found, the same way a Mycomancer's spell
 *                                   pool does.
 *   **during a Long Rest**          the rest window, where the choice is part of
 *                                   the plan and nothing is written until the rest
 *                                   is taken.
 *
 * The difference between the two is entirely `onChange`: one hands the new talents
 * value to `patch` and one hands it to the rest's draft. This component never
 * writes anything itself.
 *
 * `talents` is read rather than `character.talents` so a draft shows as a draft.
 */
export default function WornEnchants({
  character,
  talents,
  onChange,
  readOnly = false,
  autoOpen = false,
  tone = 'summary',
}) {
  /* Open on mount when the rank was just bought. After that it is the `+`. */
  const [choosing, setChoosing] = useState(autoOpen);
  const stack = useCardStack();

  const state = enchanterState({ ...character, talents });
  if (!state) return null;

  const room = Math.max(0, state.wornMax - state.worn.length);
  const full = room === 0;

  return (
    <>
      {tone === 'summary' ? (
        <span className="talent-summary-label">
          Wielder of Wonder
          <span className={`pick-count${full ? '' : ' is-open'}`}>
            {state.worn.length} of {state.wornMax} on your person
          </span>
        </span>
      ) : (
        <div className="ench-rest-head">
          <span className="ench-rest-title">On your own person</span>
          <span className="ench-rest-note">
            {state.worn.length} of {state.wornMax}
            {full ? ' — full' : ', and no Supplies to change them'}
          </span>
        </div>
      )}

      <div className="brew-slots">
        {state.worn.map((id, index) => (
          <WornSlot
            key={`${id}-${index}`}
            id={id}
            readOnly={readOnly}
            onRead={(card) => stack?.openCard(card)}
            onDrop={() => onChange(setWorn(talents, state.worn.filter((_, at) => at !== index)))}
          />
        ))}

        {Array.from({ length: room }, (_, index) => (
          <button
            key={`open-${index}`}
            type="button"
            className="brew-slot brew-slot-add"
            disabled={readOnly}
            onClick={() => setChoosing(true)}
            title="Choose an enchantment for your own person"
          >
            <span className="brew-slot-plus" aria-hidden="true">
              +
            </span>
            <span className="brew-slot-add-label">Enchantment</span>
          </button>
        ))}
      </div>

      {tone === 'summary' && (
        <p className="pick-line">
          {full
            ? 'Changed at a Long Rest, for nothing: the card names no price for what you wear.'
            : `Choose ${room === 1 ? 'one' : room}. Changed at a Long Rest afterwards, for nothing.`}
        </p>
      )}

      {choosing && !readOnly && (
        <EnchantShelf
          title="On your own person"
          rule="Chosen when you become an enchanter and changed at a Long Rest. No Supplies: the card names none for what you wear."
          character={character}
          held={state.worn}
          room={state.wornMax}
          onClose={() => setChoosing(false)}
          onPick={(enchantment) => {
            onChange(setWorn(talents, [...state.worn, enchantment.id]));
            setChoosing(false);
          }}
          onRead={(card) => stack?.openCard(card)}
        />
      )}
    </>
  );
}

/** One enchantment on the Enchanter's own person, with a way to take it off. */
function WornSlot({ id, readOnly, onRead, onDrop }) {
  const enchantment = getEnchantment(id);
  if (!enchantment) return null;

  return (
    <div className="brew-slot is-filled">
      <button
        type="button"
        className="brew-slot-body"
        onClick={() => onRead(enchantment)}
        title={`Read the ${enchantment.name} card`}
      >
        <span className="brew-slot-name">{enchantment.name}</span>
        <span className="brew-slot-meta">
          {enchantment.burden} Burden · {enchantment.effect}
        </span>
      </button>

      {!readOnly && (
        <button
          type="button"
          className="brew-slot-drop"
          onClick={onDrop}
          title="Take it off"
          aria-label={`Take ${enchantment.name} off your person`}
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * The shelf, opened by a slot and filtered to what the rank knows.
 *
 * Same shape the Cauldron's shelf has, and for the same reason: what is being
 * asked is "what goes in *this* slot", and an enchantment that cannot go in one
 * says why on its own button rather than being left off the wall.
 *
 * `priced` is for the half of the Long Rest window that lays on a thing, where
 * every choice costs the crate 70 Supplies a point of burden. A body slot is free,
 * so it prints no price and refuses nothing for money.
 */
export function EnchantShelf({
  title,
  rule,
  character,
  held,
  room,
  priced = false,
  afford,
  onClose,
  onPick,
  onRead,
}) {
  const options = useMemo(
    () => enchantOptions(character, { held, room }),
    [character, held, room]
  );

  const within = options.filter((option) => option.ok).length;

  return (
    <Modal
      title={title}
      onClose={onClose}
      wide
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className="brew-step-note">{within} within reach</span>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        {rule}
      </p>

      <div className="card-brief-wall">
        {options.map((option) => {
          const { enchantment, ok, reason, held: on } = option;
          /* A price you could not pay is offered dead rather than left to fail at
             the last button, the same law the camp-work chips read by. */
          const canPay = !priced || !ok || !afford || afford(enchantment);
          const allowed = ok && canPay;

          return (
            <CardBrief
              card={enchantment}
              character={character}
              held={on}
              key={enchantment.id}
              onOpen={() => onRead(enchantment)}
            >
              <span className="brew-reagent-held">
                {enchantment.burden} Burden
                {priced ? ` · ${layingCost(enchantment)} Supplies` : ''}
              </span>

              <button
                type="button"
                className={`btn btn-sm card-brief-btn ${allowed ? 'btn-take' : 'btn-minimal'}`}
                disabled={!allowed}
                title={
                  ok ? (canPay ? undefined : 'Beyond the crate, once the rest is paid for.') : reason
                }
                onClick={() => onPick(enchantment)}
              >
                {allowed ? 'Lay this one' : ok ? 'Beyond the crate' : reason}
              </button>
            </CardBrief>
          );
        })}
      </div>
    </Modal>
  );
}
