import { useState } from 'react';
import ItemBrowser from './ItemBrowser.jsx';
import { ChargeDots, ItemIcon, ItemTags, SlotGlyph, SlotTools } from './itemParts.jsx';
import CostOrbs from '../CostOrbs.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { BELT_MAX, BELT_SLOT_KEY, beltEntry, rarityColor } from '../../lib/items.js';
import { getCard } from '../../lib/weapons.js';

/**
 * The Inventory tab's third block: the utility belt.
 *
 * Five loops, three of them open to begin with, holding the things you reach
 * for rather than swing — potions, a grappling hook, a lantern. Each one
 * teaches a single card, and tapping the item deals that card.
 *
 * Two kinds hang here. A **consumable** is spent and gone: its charges tick
 * off as dots, and once the last one is out the loop holds a spent flask
 * waiting to be discarded. A **usable** item is not destroyed — anything that
 * limits it (a disk that needs a Long Rest) counts its charges the same way,
 * and they come back rather than running out.
 *
 * Nothing here is filled from the pack alone: the codex opens on any loop, so
 * a potion bought between sessions can be clipped on straight away.
 */
export default function BeltBlock({
  character,
  equipment,
  pack,
  belt,
  beltSlots,
  clipToBelt,
  unclipBelt,
  discardBelt,
  setBeltUsed,
  addToPack,
  onForge,
  readOnly = false,
}) {
  const [browseIndex, setBrowseIndex] = useState(null);
  const stack = useCardStack();

  const filled = belt.filter((entry, index) => index < beltSlots && entry).length;

  return (
    <div className="cell-scroll belt-block">
      <div className="block-head">
        <span className="stat-category-label">Utility Belt</span>
        <span className="block-count">
          {filled} / {beltSlots}
        </span>
      </div>

      {Array.from({ length: BELT_MAX }, (_, index) => {
        if (index >= beltSlots) return <LockedLoop key={index} index={index} />;

        const state = beltEntry(character, belt[index]);

        if (!state) {
          return (
            <button
              key={index}
              type="button"
              className="equip-slot equip-slot-empty belt-empty"
              onClick={() => setBrowseIndex(index)}
              title="Browse the codex for something to clip on"
            >
              <span className="equip-glyph">
                <SlotGlyph slot="belt" />
              </span>
              <span className="equip-empty-body">
                <span className="equip-slot-label">Slot {index + 1}</span>
                <span className="equip-empty-hint">
                  {readOnly ? 'Empty' : 'Empty — tap to clip something on'}
                </span>
              </span>
            </button>
          );
        }

        return (
          <BeltFace
            key={index}
            index={index}
            state={state}
            stack={stack}
            readOnly={readOnly}
            onBrowse={() => setBrowseIndex(index)}
            onUse={(used) => setBeltUsed(index, used)}
            onDiscard={() => discardBelt(index)}
            onRemove={() => unclipBelt(index)}
          />
        );
      })}

      {browseIndex !== null && (
        <ItemBrowser
          slot={{ key: BELT_SLOT_KEY, label: `Belt Slot ${browseIndex + 1}` }}
          current={beltEntry(character, belt[browseIndex])?.item ?? null}
          equipLabel="Clip On"
          equippedLabel="On Belt"
          character={character}
          equipment={equipment}
          pack={pack}
          onEquip={(slotKey, item) => {
            clipToBelt(browseIndex, item);
            setBrowseIndex(null);
          }}
          onUnequip={() => {
            unclipBelt(browseIndex);
            setBrowseIndex(null);
          }}
          onAdd={addToPack}
          onForge={onForge}
          onClose={() => setBrowseIndex(null)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

/**
 * One loop with something in it. The item itself deals its card; the ⓘ opens
 * the item's own page, and the ⇄ opens the codex to swap it or send it back
 * to the pack.
 */
function BeltFace({ index, state, stack, readOnly, onBrowse, onUse, onDiscard, onRemove }) {
  const { item, charges, used, spent, consumable } = state;
  const card = getCard(item.abilities?.[0]);
  const finished = spent && consumable;

  // Picks cost nothing and never run out, so they get no second line at all.
  const hasCost = Boolean(card && (card.ap != null || card.wp != null));

  return (
    <div
      className={`belt-slot${finished ? ' belt-slot-spent' : ''}`}
      style={{ borderLeftColor: rarityColor(item) }}
    >
      {/* What it is. Only this line steps around the corner buttons. */}
      <button
        type="button"
        className="belt-main"
        onClick={() => card && stack?.openCard(card)}
        title={card ? `Open the ${card.name} card` : item.name}
      >
        <ItemIcon item={item} />
        <span className="belt-body">
          <span className="belt-line">
            <span className="belt-name">{item.name}</span>
            <span className="equip-slot-label">Slot {index + 1}</span>
          </span>
          <ItemTags item={item} />
        </span>
      </button>

      {/* What it costs, and what is left of it — the two numbers you check
          when you reach for it, on one line under the name. */}
      {(hasCost || charges > 0) && (
        <div className="belt-foot">
          {hasCost && <CostOrbs ap={card.ap} wp={card.wp} size={22} className="belt-costs" />}

          {charges > 0 && (
            <span className="belt-charges">
              <ChargeDots charges={charges} used={used} onUse={onUse} readOnly={readOnly} />
              <span className="belt-charge-note">{chargeNote(state)}</span>

              {finished && !readOnly && (
                <button type="button" className="belt-discard" onClick={onDiscard}>
                  Discard
                </button>
              )}
            </span>
          )}
        </div>
      )}

      <SlotTools
        item={item}
        onInfo={() => stack?.openItem(item)}
        onRemove={readOnly ? null : onRemove}
        removeTitle={`Unclip ${item.name} — it goes to your inventory`}
      >
        <button
          type="button"
          className="item-info-btn"
          onClick={onBrowse}
          title={readOnly ? 'Browse the codex' : `Swap ${item.name} for something else`}
          aria-label={`Swap ${item.name}`}
        >
          ⇄
        </button>
      </SlotTools>
    </div>
  );
}

/** The line under the dots: what is left, or what it is waiting on. */
function chargeNote({ charges, remaining, spent, consumable, item }) {
  if (!spent) return `${remaining} of ${charges} left`;
  if (consumable) return 'Used up';
  return item.recharge ? `Spent — back after a ${item.recharge}` : 'Spent';
}

/** A loop this character has not opened yet. */
function LockedLoop({ index }) {
  return (
    <div className="equip-slot belt-locked" title="This loop opens as you advance">
      <span className="equip-glyph">
        <SlotGlyph slot="lock" />
      </span>
      <span className="equip-empty-body">
        <span className="equip-slot-label">Slot {index + 1}</span>
        <span className="equip-empty-hint">Locked</span>
      </span>
    </div>
  );
}
