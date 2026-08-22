import Modal from '../Modal.jsx';
import ShareCode from './ShareCode.jsx';
import { ItemIcon, ItemTags, ItemValues, SlotGlyph, StatText } from './itemParts.jsx';
import {
  ARMOR_SLOTS,
  BAG_SLOT_KEY,
  BELT_SLOT_KEY,
  EQUIPMENT_SLOTS,
  TRINKET_SLOT_KEY,
  heldItem,
  itemBurden,
  magicBurdenMax,
  magicBurdenUsed,
  placementOf,
} from '../../lib/items.js';
import { forgedRecord } from '../../lib/forged.js';

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
 *
 * ---------------------------------------------------------------- and the code
 * This is also where a made item hands over its code. Clicking a row in the
 * inventory opens this window, so this is the answer to "click on it to get the
 * code" — no extra control anywhere, and the code sits next to the thing it
 * describes.
 */
export default function EquipPrompt({
  item,
  carried = 1,
  character,
  equipment,
  belt,
  beltSlots,
  trinkets = [],
  onEquip,
  onClip,
  onWear,
  onDetails,
  onClose,
}) {
  const targets = targetsFor(item, {
    character,
    equipment,
    belt,
    beltSlots,
    trinkets,
    onEquip,
    onClip,
    onWear,
  });

  const burdenMax = magicBurdenMax(character);
  const burdenUsed = magicBurdenUsed(character);
  const incoming = itemBurden(item);
  const made = forgedRecord(character, item.id);
  /* Where this piece already is, for a made one — null for everything the codex
     shipped, of which a player may own as many copies as they like. */
  const placedOn = made ? placementOf(character, item.id) : null;

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

        {/* A thing you made carries its own code. Anybody you hand it to gets
            the same item, workings, name, picture and all. */}
        {made && <ShareCode record={made} />}

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
                /* And a made piece is one *thing*, so if it is already on the
                   character somewhere else this is not a place it can also go.
                   See placementOf. */
                const alreadyOn = here ? null : placedOn;

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
                    ) : alreadyOn ? (
                      <button
                        type="button"
                        className="btn btn-sm browser-blocked"
                        disabled
                        title={`It is already on you, in ${alreadyOn}. Take it off first. There is only one of it.`}
                      >
                        On you
                      </button>
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
 * armor down the body, then the two weapons, then the trinkets, then the belt.
 */
function targetsFor(piece, { character, equipment, belt, beltSlots, trinkets, onEquip, onClip, onWear }) {
  const slots = piece.slots ?? [];
  const targets = [];

  for (const slot of EQUIPMENT_SLOTS) {
    if (!slots.includes(slot.key)) continue;
    const armor = ARMOR_SLOTS.some((entry) => entry.key === slot.key);
    // A bag is neither worn as armor nor held in a hand, and "Hold it here" for
    // the thing on your back was the one label the two-way test got wrong.
    const bag = slot.key === BAG_SLOT_KEY;

    targets.push({
      id: `slot-${slot.key}`,
      label: slot.label,
      glyph: slot.key,
      verb: bag ? 'Sling it on' : armor ? 'Wear it here' : 'Hold it here',
      hereLabel: bag ? 'On your back' : armor ? 'Worn' : 'In hand',
      holding: heldItem(character, equipment[slot.key]),
      commit: () => onEquip(slot.key, piece),
    });
  }

  /* One target, not one per ring worn. A trinket is a list rather than a set of
     slots, so there is nothing to choose between and nothing to displace: it
     goes on the end. Offering "Trinket 1", "Trinket 2" … would be asking a
     question with only one answer, five times over. */
  if (slots.includes(TRINKET_SLOT_KEY) && onWear) {
    targets.push({
      id: 'trinket',
      label: trinkets.length > 0 ? `Trinkets · ${trinkets.length} on` : 'Trinkets',
      glyph: 'trinket',
      verb: 'Put it on',
      hereLabel: 'On you',
      holding: null,
      commit: () => onWear(piece),
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
        label: `Belt Loop ${index + 1}`,
        glyph: 'belt',
        verb: refresh ? 'Clip a fresh one' : 'Clip it here',
        hereLabel: 'On belt',
        refresh,
        holding: heldItem(character, entry?.id),
        commit: () => onClip(index, piece),
      });
    }
  }

  return targets;
}
