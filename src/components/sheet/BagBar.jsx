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
} from './itemParts.jsx';
import { CarryMeter } from './parts.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { BAG_SLOTS, heldItem, rarityColor } from '../../lib/items.js';
import { statMath } from '../../lib/statMath.js';

/**
 * The bag, and what it lets you carry: the one strip on the Inventory tab that
 * is not a block.
 *
 * It is not a block because it is not about one shelf. Every other thing on this
 * tab answers "what is in this place" — the three armor slots, the two hands, the
 * loops, the list — and this answers a question about all of them at once. So it
 * sits across the top, above the grid, where the tab's own overview line already
 * sits, and the arrangement never touches it: there is nowhere else for it to go.
 *
 * Two halves, side by side. On the left the slot, which reads exactly like a slot
 * in any block on the tab: the same icon tile, the same tags and value chips, and
 * the same foot carrying what it weighs and costs beside the ⓘ and the ↓ that
 * sends it to the inventory. On the right the meter, which is the answer the slot
 * changes.
 *
 * The removal law holds here like everywhere else: taking the bag off sends it to
 * the inventory, and the inventory is the only place anything is destroyed. What
 * was *in* the bag does not go anywhere, because nothing is in the bag: this
 * sheet has one inventory and a bag is a number added to what it may weigh.
 */
export default function BagBar({
  character,
  equipment,
  pack,
  equip,
  unequip,
  addToPack,
  onForge,
  readOnly = false,
}) {
  const [browsing, setBrowsing] = useState(false);
  const stack = useCardStack();
  const [slot] = BAG_SLOTS;

  /* What is filling the meter, named per item, for its hover. The same read the
     armor block makes for Magic Burden, and it matters more here: forty things
     weigh, where six of them are worked. */
  const carryMath = useMemo(() => statMath(character).carry_used, [character]);
  const item = heldItem(character, equipment[slot.key]);

  return (
    <div className="bag-bar">
      {item ? (
        <div className="item-row bag-row" style={{ borderLeftColor: rarityColor(item) }}>
          <button
            type="button"
            className="item-row-tap"
            onClick={() => setBrowsing(true)}
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
          </button>

          <ItemFoot item={item}>
            <SlotTools
              item={item}
              onInfo={() => stack?.openItem(item)}
              onRemove={readOnly ? null : () => unequip(slot.key)}
              removeTitle={`Take off ${item.name}. It goes to your inventory, and your capacity drops.`}
            />
          </ItemFoot>
        </div>
      ) : (
        <button
          type="button"
          className="equip-slot equip-slot-empty bag-slot"
          onClick={() => setBrowsing(true)}
          title="Browse bags"
        >
          <span className="equip-glyph">
            <SlotGlyph slot="bag" />
          </span>
          <span className="equip-empty-body">
            <span className="equip-slot-label">{slot.label}</span>
            <span className="equip-empty-hint">
              {readOnly ? 'No bag' : 'No bag · tap to browse'}
            </span>
          </span>
        </button>
      )}

      <CarryMeter
        character={character}
        foot="Your Physique, and what your bag adds. Past it your Speed is halved."
        math={carryMath}
      />

      {browsing && (
        <ItemBrowser
          slot={slot}
          character={character}
          equipment={equipment}
          pack={pack}
          equipLabel="Sling It On"
          equippedLabel="Worn"
          onEquip={(slotKey, chosen) => {
            equip(slotKey, chosen);
            setBrowsing(false);
          }}
          onUnequip={(slotKey) => {
            unequip(slotKey);
            setBrowsing(false);
          }}
          onAdd={addToPack}
          onForge={onForge}
          onClose={() => setBrowsing(false)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
