import { useState } from 'react';
import Modal from '../Modal.jsx';
import AbilityCard from '../AbilityCard.jsx';
import UsePrompt from './UsePrompt.jsx';
import { CostOrb } from '../CostOrbs.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { spendUse } from '../../lib/combatBar.js';
import { addEffect } from '../../lib/combatTurn.js';
import { heldItem, normalizeEquipment, wieldModifiers } from '../../lib/items.js';
import { getCard } from '../../lib/weapons.js';
import { ambushEffect, ambushOptions } from '../../lib/tricks.js';

/**
 * AMBUSH: which swing is this, and what does it cost.
 *
 * The card prices itself off the weapon rather than off a printed number —
 * "the cost of this ability is equal to the weapon number of base damage dice
 * before enchant or boost" — and the two attacks a weapon teaches do not always
 * roll the same dice. A Longbow shoots for 2d6 and takes aim for 3d6, so an
 * ambush costs 2 one way and 3 the other, and is Elevated to match. The sheet
 * cannot pick for the player, so it asks, and asking is also what makes the
 * price honest: the number in the orb is the number for the attack under it.
 *
 * That is why the card is marked `pays: 'window'`. Charging a printed cost at
 * the chip and the rest here would ask the action-or-reaction question twice and
 * take Willpower off anyone who then closed the window.
 *
 * ------------------------------------------------------------------ afterwards
 * Nothing resolves here. Paying lays a rider on the tracker and the window
 * shuts, and from then on the attack it was bought for prints its Elevated
 * damage everywhere the sheet prints it — on the chip, on block 3, on the card.
 * The Developpement Notes asked for exactly that: "for the next time after he
 * use ambush, the weapon attack should reflect the increase in damage. Thi
 * should be lost on use."
 *
 * The rider comes off when a weapon attack is paid for, wherever it was tapped.
 * See spendUse in combatBar.js.
 */
export default function AmbushWindow({ talent, card, character, patch, readOnly = false, onClose }) {
  /* The attack being bought for, and then the payment it raised. */
  const [picked, setPicked] = useState(null);
  const [paying, setPaying] = useState(null);

  const equipment = normalizeEquipment(character?.equipment);
  const primary = heldItem(character, equipment.main_hand);
  const cards = primary ? (primary.abilities ?? []).map(getCard).filter(Boolean) : [];
  const options = ambushOptions(cards);
  /* What the blade itself brings, so the preview under an option is the attack
     as this character actually swings it and not the codex's printed copy. */
  const worn = wieldModifiers(character, primary);

  /** The one write: the Willpower, and the rider it bought. */
  function confirm(mode, amount) {
    const body = spendUse(paying, character, mode, amount);
    if (Object.keys(body).length > 0) patch(body);
    setPaying(null);
    onClose();
  }

  function buy(option) {
    setPaying({
      name: `${card.name} — ${option.card.name}`,
      source: `${card.name} — ${talent.name}`,
      ap: null,
      wp: option.wp,
      card,
      /* The rider rides in as the use's own extra, so one patch spends the
         Willpower and lays the effect together. Nothing lands if the prompt
         refuses the price. */
      extra: { effects: addEffect(character?.effects, ambushEffect(option)) },
    });
  }

  return (
    <>
      <Modal
        title={`${talent.name}: Ambush`}
        onClose={onClose}
        accent={PICK_ACCENTS.talent}
        footer={
          <>
            <span className="spacer" />
            <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
              Close
            </button>
          </>
        }
      >
        <div className="use-prompt">
          <p className="use-source">{primary ? `${primary.name} — in hand` : 'Nothing in hand'}</p>

          <span className="use-question">
            {options.length === 0
              ? 'An ambush is a weapon attack, and you have no weapon that rolls damage dice.'
              : 'Which attack are you ambushing with? Its base damage dice are the price.'}
          </span>

          {options.length > 0 && (
            <div className="trick-options">
              {options.map((option) => (
                <button
                  type="button"
                  key={option.card.id}
                  className={`trick-option${picked?.card.id === option.card.id ? ' is-picked' : ''}`}
                  onClick={() => setPicked(option)}
                  title={`Read ${option.card.name} as it would land`}
                >
                  <span className="trick-option-costs">
                    <CostOrb kind="wp" value={option.wp} size={30} />
                  </span>

                  <span className="trick-option-body">
                    <span className="trick-option-name">{option.card.name}</span>
                    <span className="trick-option-line">
                      Advantage on the roll, and the damage Elevated{' '}
                      {option.wp === 1 ? 'once' : option.wp === 2 ? 'twice' : `${option.wp} times`}.
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* The attack as it would land, Elevated — read it before paying for
              it. The same card the chip will print once the rider is on. */}
          {picked && (
            <div className="use-card">
              <AbilityCard
                ability={picked.card}
                character={character}
                modifiers={{ ...worn, elevate: (Number(worn?.elevate) || 0) + picked.wp }}
              />
            </div>
          )}

          {picked && !readOnly && (
            <div className="trick-take">
              <button type="button" className="btn btn-take btn-sm" onClick={() => buy(picked)}>
                Ambush with {picked.card.name}
              </button>
              <span className="trick-take-note">
                Costs {picked.wp} Willpower. It waits on the tracker until you swing.
              </span>
            </div>
          )}
        </div>
      </Modal>

      {paying && (
        <UsePrompt
          request={paying}
          character={character}
          onCancel={() => setPaying(null)}
          onConfirm={confirm}
        />
      )}
    </>
  );
}
