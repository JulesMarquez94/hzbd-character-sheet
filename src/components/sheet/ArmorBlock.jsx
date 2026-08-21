import { useState } from 'react';
import ItemBrowser from './ItemBrowser.jsx';
import { ItemIcon, ItemTags, ItemValues, SlotGlyph, SlotTools, StatText } from './itemParts.jsx';
import { BurdenMeter } from './parts.jsx';
import { useCardStack } from '../../context/card-stack.js';
import {
  ARMOR_SETS,
  ARMOR_SLOTS,
  armorSetName,
  heldItem,
  rarityColor,
} from '../../lib/items.js';

/**
 * The Inventory tab's armor block: what the character wears, one slot each
 * for head, torso and legs. Clicking a slot opens the codex browser for it.
 * Equipping writes to the character row, so Armor, Defense and the Shield
 * cap on the Character tab move in the same beat.
 *
 * The Magic Burden meter here counts the whole loadout, weapons included —
 * an enchanted blade weighs on it exactly like an enchanted helm. It is the
 * same component block 1 of the Character tab prints, and it keeps the capacity
 * line under the bar because this tab has the room for it.
 */
export default function ArmorBlock({
  character,
  equipment,
  pack,
  equip,
  unequip,
  addToPack,
  onForge,
  readOnly = false,
}) {
  const [browseSlot, setBrowseSlot] = useState(null);
  const stack = useCardStack();

  const fullSet = armorSetName(character);
  const setInfo = fullSet ? ARMOR_SETS[fullSet] : null;
  const worn = ARMOR_SLOTS.filter((slot) => equipment[slot.key]).length;

  function equipItem(slotKey, item) {
    equip(slotKey, item);
    setBrowseSlot(null);
  }

  function unequipItem(slotKey) {
    unequip(slotKey);
    setBrowseSlot(null);
  }

  return (
    <div className="cell-scroll armor-block">
      <div className="block-head">
        <span className="stat-category-label">Armor</span>
        <span className="block-count">
          {worn} / {ARMOR_SLOTS.length}
        </span>
      </div>

      {/* ---------- MAGIC BURDEN ---------- */}
      <BurdenMeter character={character} foot="Capacity is Level + Mind + 10." />

      {ARMOR_SLOTS.map((slot) => {
        const item = heldItem(character, equipment[slot.key]);

        if (!item) {
          return (
            <button
              key={slot.key}
              type="button"
              className="equip-slot equip-slot-empty"
              onClick={() => setBrowseSlot(slot)}
              title={`Browse ${slot.label.toLowerCase()} items`}
            >
              <span className="equip-glyph">
                <SlotGlyph slot={slot.key} />
              </span>
              <span className="equip-empty-body">
                <span className="equip-slot-label">{slot.label}</span>
                <span className="equip-empty-hint">{readOnly ? 'Empty' : 'Empty · tap to browse'}</span>
              </span>
            </button>
          );
        }

        return (
          <div key={slot.key} className="equip-slot" style={{ borderLeftColor: rarityColor(item) }}>
            <button
              type="button"
              className="equip-slot-main"
              onClick={() => setBrowseSlot(slot)}
              title={readOnly ? item.name : `${item.name} · tap to swap or send to inventory`}
            >
              <ItemIcon item={item} />
              <span className="equip-item-body">
                <span className="equip-item-head">
                  <span className="equip-item-name">{item.name}</span>
                  <span className="equip-slot-label">{slot.label}</span>
                </span>
                <ItemTags item={item} />
                <ItemValues item={item} />
                {item.effect && (
                  <span className="equip-item-effect">
                    <StatText text={item.effect} />
                  </span>
                )}
              </span>
            </button>

            <SlotTools
              item={item}
              onInfo={() => stack?.openItem(item)}
              onRemove={readOnly ? null : () => unequip(slot.key)}
              removeTitle={`Take off ${item.name}. It goes to your inventory.`}
            />
          </div>
        );
      })}

      {/* All three pieces from one set — its bonus is live. */}
      {setInfo && (
        <div className="set-banner">
          <span className="set-banner-title">Set Bonus · {fullSet}</span>
          <span className="set-banner-text">
            <StatText text={setInfo.active} />
          </span>
        </div>
      )}

      {browseSlot && (
        <ItemBrowser
          slot={browseSlot}
          character={character}
          equipment={equipment}
          pack={pack}
          onEquip={equipItem}
          onUnequip={unequipItem}
          onAdd={addToPack}
          onForge={onForge}
          onClose={() => setBrowseSlot(null)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
