import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import { EnchantShelf } from './WornEnchants.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useCardStack } from '../../context/card-stack.js';
import {
  CATEGORY_ORDER,
  heldItem,
  isCustomEntry,
  itemCategory,
  normalizeBelt,
  normalizeEquipment,
  normalizePack,
  normalizeTrinkets,
} from '../../lib/items.js';
import { enchanterState, itemRoom, laidOn, layOn, layingCost, stripFrom } from '../../lib/enchanting.js';
import { layingAffordable } from '../../lib/rest.js';

/**
 * ENCHANTING, as one long rest action.
 *
 *   "Whenever you take a Long Rest, you can use your Long Rest action to
 *    enchant. Enchanting an item costs you an amount of supplies equal to 70
 *    times the Magic Burden value of the enchantment. ... An item can hold one
 *    enchantment at a time."
 *
 * This used to be half of a standing section in the rest window, beside WIELDER
 * OF WONDER, with no limit on how many items a night could take. It is now one
 * of the things the rest's single action slot can be spent on, and it walks:
 * **which thing → what to lay on it → back to the rest.**
 *
 * -------------------------------------------------------------- the cap
 * One enchantment an item, until LAYERED ENCHANTMENT at Rank 3 makes it two.
 * The number is `enchanting.perItem` on the set and is read here through
 * `itemRoom`, so the shelf refuses a full item by the same rule `layOn` refuses
 * it. A full item can still be *changed*, because stripping and laying are the
 * same action: the strip is offered on the item's own row.
 *
 * Nothing here writes. Every choice goes into the rest window's `talents` draft,
 * is priced into its plan, and is only committed by "Yes, rest".
 */
export default function EnchantAction({ character, talents, kind, onClose, onDraft }) {
  /* Which item is being worked on, or null while the list is up. */
  const [onItem, setOnItem] = useState(null);
  const stack = useCardStack();

  const state = enchanterState({ ...character, talents });

  /* What the character is carrying that could take a working: everything worn,
     on the belt, or in the pack. A written note is not a thing you can enchant. */
  const carried = useMemo(() => enchantableItems(character), [character]);

  const shelves = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        rows: carried.filter((item) => itemCategory(item) === category),
      })).filter((shelf) => shelf.rows.length > 0),
    [carried]
  );

  if (!state) return null;

  const cap = state.perItem;

  return (
    <>
      <Modal
        title="Enchant what?"
        onClose={onClose}
        wide
        accent={PICK_ACCENTS.talent}
        footer={
          <>
            <span className="brew-step-note">
              {layingCost({ burden: 1 })} Supplies a point of Magic Burden
            </span>
            <span className="spacer" />
            <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
              ← Back to the rest
            </button>
          </>
        }
      >
        <p className="frame-foot" style={{ marginTop: 0 }}>
          Anything you are carrying: worn, in hand, on the belt or in the pack.{' '}
          {cap === 1
            ? 'An item holds one enchantment at a time, so a worked item has to be stripped before it takes another.'
            : `An item holds up to ${cap} at your rank.`}
        </p>

        {carried.length === 0 && (
          <p className="pick-line">Nothing you are carrying can take a working.</p>
        )}

        {shelves.map(({ category, rows }) => (
          <section className="brew-step" key={category}>
            <div className="brew-step-head">
              <span className="brew-step-label">{category}</span>
              <span className="brew-step-note">{rows.length}</span>
            </div>

            <div className="rest-labours">
              {rows.map((item) => {
                const on = laidOn({ talents }, item.id);
                const room = itemRoom({ talents }, item.id);

                return (
                  <div className="rest-labour is-prepare" key={item.id}>
                    <button
                      type="button"
                      className="rest-labour-head"
                      disabled={room === 0}
                      onClick={() => setOnItem(item)}
                      title={
                        room === 0
                          ? `${item.name} is full at your rank. Strip something first.`
                          : `Lay a working on ${item.name}`
                      }
                    >
                      <span className="rest-labour-name">{item.name}</span>
                      <span className="rest-labour-line">
                        {on.length > 0
                          ? `${on.map((entry) => entry.name).join(' · ')}, ${on.length} of ${cap}`
                          : `Nothing on it. Room for ${cap === 1 ? 'one' : cap}.`}
                      </span>
                    </button>

                    <span className="rest-labour-opts">
                      {on.map((entry) => (
                        <button
                          type="button"
                          key={entry.id}
                          className="rest-opt"
                          title={`Strip ${entry.name} off ${item.name}. The Supplies do not come back.`}
                          onClick={() => onDraft(stripFrom(talents, item.id, entry.id))}
                        >
                          Strip {entry.name}
                        </button>
                      ))}

                      <button
                        type="button"
                        className="rest-opt is-gain"
                        disabled={room === 0}
                        onClick={() => setOnItem(item)}
                        title={room === 0 ? 'Full at your rank' : undefined}
                      >
                        {room === 0 ? 'Full' : 'Lay one'}
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </Modal>

      {/* The shelf for the thing that was picked. Laying one closes both and
          lands back on the rest, which is where the price shows up. */}
      {onItem && (
        <EnchantShelf
          title={`On ${onItem.name}`}
          rule={`Permanent, and paid for out of the crate at ${layingCost({ burden: 1 })} Supplies a point of Magic Burden.`}
          character={character}
          held={laidOn({ talents }, onItem.id).map((entry) => entry.id)}
          room={cap}
          priced
          afford={(enchantment) => layingAffordable(character, kind, talents, enchantment)}
          onClose={() => setOnItem(null)}
          onPick={(enchantment) => {
            onDraft(layOn(talents, onItem.id, enchantment.id));
            setOnItem(null);
            onClose();
          }}
          onRead={(card) => stack?.openCard(card)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ helpers */

/**
 * Everything this character carries that could take a working: what is worn, what
 * is in hand, what is on a trinket, what is clipped to the belt and what is in
 * the pack.
 *
 * A written note is left out. Those are "a scrap of paper with a note on it, a
 * stone worth keeping" with nothing mechanical about them, and an enchantment laid
 * on one would have nothing to attach to.
 *
 * **Wider than `carriedItems` in items.js on purpose**, and the pack is the whole
 * difference: this is what may be *worked on* at the fire, that is what a working
 * *counts from*. A spare dagger in the pack can be enchanted tonight and does
 * nothing until it is drawn, the same as a breastplate nobody is wearing. The
 * belt is in both now — a loop grants what it carries.
 *
 * `heldItem`, so a piece the player made is offered by its own name. It is also
 * the one place the *instance* matters: `laid` is keyed by id, and a forged id is
 * an instance, so a working laid on one silver ring lands on that ring rather
 * than on every silver ring the character owns.
 */
function enchantableItems(character) {
  const equipment = normalizeEquipment(character?.equipment);
  const ids = [
    ...Object.values(equipment),
    ...normalizeTrinkets(character?.trinkets),
    ...normalizeBelt(character?.belt).map((entry) => entry?.id),
    ...normalizePack(character?.pack).filter((entry) => !isCustomEntry(entry)),
  ];

  const seen = new Set();
  const items = [];

  for (const raw of ids) {
    const id = typeof raw === 'string' ? raw : raw?.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const item = heldItem(character, id);
    if (item) items.push(item);
  }

  return items;
}
