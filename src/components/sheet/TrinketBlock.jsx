import { useState } from 'react';
import ItemBrowser from './ItemBrowser.jsx';
import { ItemIcon, ItemTags, ItemValues, SlotGlyph, SlotTools, StatText } from './itemParts.jsx';
import { useCardStack } from '../../context/card-stack.js';
import {
  TRINKET_SLOT_KEY,
  heldItem,
  itemBurden,
  itemsForSlot,
  rarityColor,
} from '../../lib/items.js';
import { itemEnchantments } from '../../lib/weapons.js';

/**
 * The Inventory tab's trinket block: the rings, chains and cloaks a character
 * wears, and the one block on the tab with no ceiling.
 *
 * ---------------------------------------------------------------- no slot count
 * Armor has three places, hands have two, the belt has five loops of which three
 * are open. Trinkets have none of that: a character wearing nine rings is wearing
 * nine rings. So this block is a *list* that grows, with one empty place always
 * waiting at the bottom of it, and the head reports a bare count rather than a
 * fraction — the same thing the inventory does, and for the same reason.
 *
 * Which also means this is the one block where putting something on never asks a
 * question. The replace prompt exists because a slot holds one thing at a time;
 * nothing is displaced by a list.
 *
 * ------------------------------------------------------------- what they are for
 * Nothing in the trinket codex has a number on it. A silver ring is worth wearing
 * because of what has been worked into it, which is why the Magic Burden each one
 * costs is printed on its own row: this block is where a character's capacity
 * actually goes, and the meter over in the armor block is a long way from the
 * decision.
 */
export default function TrinketBlock({
  character,
  equipment,
  pack,
  trinkets,
  wearTrinket,
  removeTrinket,
  swapTrinket,
  addToPack,
  onForge,
  readOnly = false,
}) {
  /* Which place the codex is open on: an index for a swap, or 'new' for the empty
     one at the bottom. Never a number and a flag, so the two can never disagree. */
  const [browsing, setBrowsing] = useState(null);
  const stack = useCardStack();

  const worn = trinkets.map((id) => heldItem(character, id));
  const enchanted = worn.filter((item) => itemEnchantments(item).length > 0).length;

  return (
    <div className="cell-scroll trinket-block">
      <div className="block-head">
        <span className="stat-category-label">Trinkets</span>
        <span className="block-count">
          {trinkets.length} {trinkets.length === 1 ? 'worn' : 'worn'}
          {enchanted > 0 && <span className="trinket-worked"> · {enchanted} worked</span>}
        </span>
      </div>

      {worn.map((item, index) => {
        /* An id the codex no longer knows, or a forged record that has gone. It
           is still on the character, so it is still shown and still removable —
           a row that vanished would be a thing nobody could take off. */
        if (!item) {
          return (
            <div className="equip-slot trinket-slot trinket-unknown" key={`gone-${index}`}>
              <span className="equip-glyph">
                <SlotGlyph slot="note" />
              </span>
              <span className="equip-empty-body">
                <span className="equip-slot-label">Trinket {index + 1}</span>
                <span className="equip-empty-hint">
                  Something this build does not know. Take it off to be rid of it.
                </span>
              </span>
              {!readOnly && (
                <span className="slot-tools">
                  <button
                    type="button"
                    className="item-info-btn slot-remove-btn"
                    onClick={() => removeTrinket(index)}
                    title="Take it off. It goes to your inventory."
                    aria-label="Take it off"
                  >
                    ↓
                  </button>
                </span>
              )}
            </div>
          );
        }

        const burden = itemBurden(item);

        return (
          <div
            className="equip-slot trinket-slot"
            key={`${item.id}-${index}`}
            style={{ borderLeftColor: rarityColor(item) }}
          >
            <button
              type="button"
              className="equip-slot-main"
              onClick={() => setBrowsing(index)}
              title={readOnly ? item.name : `${item.name} · tap to swap or send to inventory`}
            >
              <ItemIcon item={item} />
              <span className="equip-item-body">
                <span className="equip-item-head">
                  <span className="equip-item-name">{item.name}</span>
                  {burden > 0 && <span className="trinket-burden">{burden} Burden</span>}
                </span>
                <ItemTags item={item} />
                <ItemValues item={item} />
                {item.effect && (
                  <span className="equip-item-effect">
                    <StatText text={item.effect} />
                  </span>
                )}
                {/* What is actually in it. A trinket's whole worth is this line,
                    so it is printed on the row rather than left on the card. */}
                {itemEnchantments(item).map(({ id, enchantment }) => (
                  <span className="trinket-working" key={id}>
                    <b>{enchantment.name}</b> <StatText text={enchantment.effect} />
                  </span>
                ))}
              </span>
            </button>

            <SlotTools
              item={item}
              onInfo={() => stack?.openItem(item)}
              onRemove={readOnly ? null : () => removeTrinket(index)}
              removeTitle={`Take off ${item.name}. It goes to your inventory.`}
            />
          </div>
        );
      })}

      {/* The place there is always one more of. Not a locked slot and not a
          numbered one: it is the end of the list. */}
      {!readOnly && (
        <button
          type="button"
          className="equip-slot equip-slot-empty trinket-empty"
          onClick={() => setBrowsing('new')}
          title="Browse the codex for something to put on"
        >
          <span className="equip-glyph">
            <SlotGlyph slot="trinket" />
          </span>
          <span className="equip-empty-body">
            <span className="equip-slot-label">
              {trinkets.length === 0 ? 'Nothing on' : 'One more'}
            </span>
            <span className="equip-empty-hint">Empty · tap to put something on</span>
          </span>
        </button>
      )}

      {readOnly && trinkets.length === 0 && (
        <p className="browser-empty">Nothing on.</p>
      )}

      {browsing !== null && (
        <ItemBrowser
          slot={{
            key: TRINKET_SLOT_KEY,
            label: browsing === 'new' ? 'Trinkets' : `Trinket ${browsing + 1}`,
          }}
          items={itemsForSlot(TRINKET_SLOT_KEY)}
          /* A list has no "currently in this slot" unless one row was tapped, so
             the browser is handed the piece being swapped and nothing otherwise.
             Handing it null on purpose, rather than letting it look the slot up:
             `trinket` is not a key in the equipment map and never will be. */
          current={browsing === 'new' ? null : (worn[browsing] ?? null)}
          equipLabel={browsing === 'new' ? 'Put It On' : 'Wear This Instead'}
          equippedLabel="Worn"
          character={character}
          equipment={equipment}
          pack={pack}
          onEquip={(slotKey, item) => {
            /* A swap is one write, not a removal followed by a wearing — see
               swapTrinket. The old ring still goes to the inventory, which is
               the tab's own removal law. */
            if (browsing === 'new') wearTrinket(item);
            else swapTrinket(browsing, item);
            setBrowsing(null);
          }}
          onUnequip={() => {
            if (browsing !== 'new') removeTrinket(browsing);
            setBrowsing(null);
          }}
          onAdd={addToPack}
          onForge={onForge}
          onClose={() => setBrowsing(null)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
