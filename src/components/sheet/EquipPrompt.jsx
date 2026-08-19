import Modal from '../Modal.jsx';
import { ItemIcon, ItemTags, ItemValues, SlotGlyph, StatText } from './itemParts.jsx';
import {
  ARMOR_SLOTS,
  BELT_SLOT_KEY,
  EQUIPMENT_SLOTS,
  getItem,
  itemBurden,
  magicBurdenMax,
  magicBurdenUsed,
} from '../../lib/items.js';

/**
 * Putting something on, asked from the inventory rather than from the slot.
 *
 * The blocks each open the codex on one slot, which answers "what could go
 * here?". This is the other question, and the one you actually have while
 * looking at your pack: "where does this go?". So it lists every place on the
 * character this piece fits, says what is already sitting there, and lets you
 * pick one.
 *
 * It does not do the swapping itself. Choosing a slot that is occupied hands
 * off to `useEquipSlots`, which raises the replace prompt and asks where the
 * old piece goes, exactly as it does when a block equips something. One rule
 * for the whole tab, and one place it lives.
 *
 * Magic Burden is checked the way the codex browser checks it: the outgoing
 * piece's burden is freed before the incoming piece's is counted, so a straight
 * swap of like for like never reads as over capacity.
 */
export default function EquipPrompt({
  item,
  carried = 1,
  character,
  equipment,
  belt,
  beltSlots,
  onEquip,
  onClip,
  onDetails,
  onClose,
}) {
  const targets = targetsFor(item, { equipment, belt, beltSlots, onEquip, onClip });

  const burdenMax = magicBurdenMax(character);
  const burdenUsed = magicBurdenUsed(equipment, belt);
  const incoming = itemBurden(item);

  return (
    <Modal
      title={item.name}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-minimal btn-sm" onClick={onDetails}>
            Read the item
          </button>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <div className="equip-prompt">
        <div className="equip-prompt-head">
          <ItemIcon item={item} size={52} />
          <div className="equip-prompt-title">
            <span className="equip-prompt-name">
              {item.name}
              {carried > 1 && <span className="pack-count-chip">×{carried}</span>}
            </span>
            <ItemTags item={item} />
            <ItemValues item={item} />
          </div>
        </div>

        {item.effect && (
          <p className="equip-prompt-effect">
            <StatText text={item.effect} />
          </p>
        )}

        {targets.length === 0 ? (
          <p className="pick-line">
            There is nowhere on you this goes. It stays in your inventory until the table says
            otherwise.
          </p>
        ) : (
          <>
            <span className="stat-category-label">Where it goes</span>

            <div className="equip-target-list">
              {targets.map((target) => {
                const freed = itemBurden(target.holding);
                const projected = burdenUsed - freed + incoming;
                const blocked = projected > burdenMax;
                // Already in this exact place: there is no swap to make —
                // unless a part-spent copy is waiting to be refreshed.
                const here = target.holding?.id === item.id && !target.refresh;

                return (
                  <div className="equip-target" key={target.id}>
                    <span className="equip-glyph">
                      <SlotGlyph slot={target.glyph} />
                    </span>

                    <span className="equip-target-body">
                      <span className="equip-slot-label">{target.label}</span>
                      {target.holding ? (
                        <span className="equip-target-holding">
                          Holding <b>{target.holding.name}</b>
                        </span>
                      ) : (
                        <span className="equip-target-empty">Empty</span>
                      )}
                    </span>

                    {here ? (
                      <span className="browser-equipped-mark">{target.hereLabel}</span>
                    ) : blocked ? (
                      <button
                        type="button"
                        className="btn btn-sm browser-blocked"
                        disabled
                        title={`Would carry ${projected} Magic Burden. Your capacity is ${burdenMax}.`}
                      >
                        Over Burden
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-copper btn-sm"
                        onClick={target.commit}
                        title={
                          target.holding
                            ? `${target.holding.name} comes off first, and you say where it goes`
                            : undefined
                        }
                      >
                        {target.verb}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="equip-prompt-note">
              A slot that already holds something asks where the old piece goes before anything
              changes hands.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}

/**
 * Every place on the character this piece fits, in the order the tab reads:
 * armor down the body, then the two weapons, then the belt.
 */
function targetsFor(piece, { equipment, belt, beltSlots, onEquip, onClip }) {
  const slots = piece.slots ?? [];
  const targets = [];

  for (const slot of EQUIPMENT_SLOTS) {
    if (!slots.includes(slot.key)) continue;
    const armor = ARMOR_SLOTS.some((entry) => entry.key === slot.key);

    targets.push({
      id: `slot-${slot.key}`,
      label: slot.label,
      glyph: slot.key,
      verb: armor ? 'Wear it here' : 'Hold it here',
      hereLabel: armor ? 'Worn' : 'In hand',
      holding: getItem(equipment[slot.key]),
      commit: () => onEquip(slot.key, piece),
    });
  }

  // Only the loops this character has actually opened. A locked one is not a
  // place to put anything, so it is not offered as one.
  if (slots.includes(BELT_SLOT_KEY)) {
    for (let index = 0; index < beltSlots; index += 1) {
      const entry = belt[index];
      // A part-spent copy of this very item can give way to a fresh one — the
      // swap the belt block already allows. An untouched copy is simply here.
      const refresh = entry?.id === piece.id && Number(entry?.used) > 0;

      targets.push({
        id: `belt-${index}`,
        label: `Belt Slot ${index + 1}`,
        glyph: 'belt',
        verb: refresh ? 'Clip a fresh one' : 'Clip it here',
        hereLabel: 'On belt',
        refresh,
        holding: getItem(entry?.id),
        commit: () => onClip(index, piece),
      });
    }
  }

  return targets;
}
