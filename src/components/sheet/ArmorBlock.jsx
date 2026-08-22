import { useMemo, useState } from 'react';
import ItemBrowser from './ItemBrowser.jsx';
import {
  ItemFoot,
  ItemIcon,
  ItemStats,
  ItemTags,
  ROW_ICON,
  SlotGlyph,
  SlotTools,
  StatText,
} from './itemParts.jsx';
import { BurdenMeter } from './parts.jsx';
import { useCardStack } from '../../context/card-stack.js';
import {
  ARMOR_SETS,
  ARMOR_SLOTS,
  armorSetName,
  heldItem,
  rarityColor,
} from '../../lib/items.js';
import { statMath } from '../../lib/statMath.js';

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
  /* What is filling the meter, named per piece, for its hover. */
  const burdenMath = useMemo(() => statMath(character).burden_used, [character]);

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
      {/* The piece-by-piece breakdown on hover, which matters more on this tab
          than anywhere: this is where a loadout is chosen, and "what is eating my
          capacity" is the question somebody standing over the armor slots is
          asking. See statMath.js. */}
      <BurdenMeter
        character={character}
        foot="Capacity is Level + Mind + 10."
        math={burdenMath}
      />

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
          <div key={slot.key} className="item-row" style={{ borderLeftColor: rarityColor(item) }}>
            <button
              type="button"
              className="item-row-tap"
              onClick={() => setBrowseSlot(slot)}
              title={readOnly ? item.name : `${item.name} · tap to swap or send to inventory`}
            >
              <span className="item-row-top">
                <ItemIcon item={item} size={ROW_ICON} />
                <span className="item-row-ident">
                  <span className="item-row-line">
                    <span className="item-row-name">{item.name}</span>
                    <span className="equip-slot-label">{slot.label}</span>
                  </span>
                  <ItemTags item={item} />
                </span>
              </span>

              <ItemStats item={item} />

              {item.effect && (
                <span className="item-row-text">
                  <StatText text={item.effect} />
                </span>
              )}
            </button>

            <ItemFoot item={item}>
              <SlotTools
                item={item}
                onInfo={() => stack?.openItem(item)}
                onRemove={readOnly ? null : () => unequip(slot.key)}
                removeTitle={`Take off ${item.name}. It goes to your inventory.`}
              />
            </ItemFoot>
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
