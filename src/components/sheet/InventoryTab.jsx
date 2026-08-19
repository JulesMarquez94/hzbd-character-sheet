import { useCallback, useMemo } from 'react';
import ArmorBlock from './ArmorBlock.jsx';
import BeltBlock from './BeltBlock.jsx';
import PackBlock from './PackBlock.jsx';
import WeaponBlock from './WeaponBlock.jsx';
import useBlockReorder from './useBlockReorder.js';
import { useEquipSlots } from './useEquipSlots.jsx';
import { CardStackProvider } from '../CardStack.jsx';
import { normalizeSourceOrder } from '../../lib/characterModel.js';
import { inventoryOverview } from '../../lib/items.js';

/**
 * The Inventory tab is built like the Character tab, with one exception.
 * Blocks 1–3 are the fixed 360x640 the whole site is built on — armor, the
 * two weapons in hand, the utility belt. The inventory is the fourth, and it
 * is the only block on the site that is not one block wide: a list has no
 * natural length, so it takes the whole row under the other three and shrinks
 * with the page, down to a single block on a phone.
 *
 * The three fixed blocks are the player's to arrange, exactly as the Character
 * and Abilities tabs' are, and the arrangement is stored on the character so it
 * follows the sheet rather than the browser it was set in. The inventory is not
 * in that order: it is a row wide, so it has only one place it can go.
 *
 * Equipping lives here rather than in any one block, so one rule covers the
 * whole tab: filling an occupied slot always asks where the old piece goes,
 * and taking anything off only ever sends it to the inventory. The inventory
 * block is the single place something can be destroyed.
 *
 * There are two ways in and they meet at the same rule. A block opens the
 * codex on one slot, which answers "what could go here?". A row of the
 * inventory opens the other question, "where does this go?", and both end at
 * the same replace prompt when the place they land on is already taken.
 *
 * Everything writes to the character row itself (`equipment`, `belt`, `pack`),
 * so the Character tab's Armor, Defense and Shield react in the same save —
 * and viewers see the change live through the characters subscription.
 */

/** The three blocks that can move, and what to call one out loud. */
const BLOCKS = [
  { id: 'armor', label: 'Armor' },
  { id: 'weapons', label: 'Weapons' },
  { id: 'belt', label: 'Utility Belt' },
];

const BLOCK_IDS = BLOCKS.map((block) => block.id);

export default function InventoryTab({ character, patch, readOnly = false }) {
  const {
    equipment,
    pack,
    belt,
    beltSlots,
    equip,
    unequip,
    clipToBelt,
    unclipBelt,
    discardBelt,
    setBeltUsed,
    addToPack,
    addCustomToPack,
    updateCustomInPack,
    discardFromPack,
    replacePrompt,
  } = useEquipSlots(character, patch);

  const overview = useMemo(() => inventoryOverview(character), [character]);

  const savedOrder = useMemo(
    () => normalizeSourceOrder(character?.inventory_order, BLOCK_IDS),
    [character?.inventory_order]
  );
  const saveOrder = useCallback((next) => patch?.({ inventory_order: next }), [patch]);

  const { order, ghost, dragId, registerCell, gripProps } = useBlockReorder({
    order: savedOrder,
    onChange: saveOrder,
    disabled: readOnly || !patch,
  });

  const slotProps = { character, equipment, pack, belt, equip, unequip, readOnly };
  const beltProps = {
    character,
    equipment,
    pack,
    belt,
    beltSlots,
    clipToBelt,
    unclipBelt,
    discardBelt,
    setBeltUsed,
    readOnly,
  };
  const packProps = {
    character,
    equipment,
    belt,
    beltSlots,
    pack,
    equip,
    clipToBelt,
    addToPack,
    addCustomToPack,
    updateCustomInPack,
    discardFromPack,
    readOnly,
  };

  /* The contents of each movable block, keyed by the id the order refers to.
     Only the arrangement moves — a block is the same block wherever it lands. */
  const blocks = {
    armor: <ArmorBlock {...slotProps} />,
    weapons: <WeaponBlock {...slotProps} />,
    belt: <BeltBlock {...beltProps} />,
  };

  return (
    <CardStackProvider character={character}>
      <div className="inventory-tab">
        <Overview overview={overview} />

        <div className={`sheet-grid-6${dragId ? ' is-reordering' : ''}`}>
          {order.map((id, index) => (
            <section
              key={id}
              ref={(node) => registerCell(id, node)}
              className={`sheet-cell${dragId === id ? ' is-dragging' : ''}`}
            >
              {!readOnly && patch && (
                <button
                  type="button"
                  className="cell-grip"
                  title="Drag to move this block — or focus it and use the arrow keys"
                  aria-label={`${labelOf(id)}, block ${index + 1} of ${order.length}. Drag, or press the arrow keys, to move it.`}
                  {...gripProps(id)}
                >
                  <span className="grip-dots" aria-hidden="true" />
                </button>
              )}
              {blocks[id]}
            </section>
          ))}

          {/* ==== THE INVENTORY, ACROSS THE WHOLE ROW ====
              Pinned under the other three rather than ordered with them: it is
              as wide as the row is, so there is nowhere else it could sit. */}
          <section className="sheet-cell sheet-cell-wide">
            <PackBlock {...packProps} />
          </section>

          {/* The copy under the pointer. The block itself stays put as the empty
              slot it came from, so nothing has to animate out of the way. */}
          {ghost && (
            <div
              className="sheet-cell cell-ghost"
              style={{
                left: `${ghost.x - ghost.offX}px`,
                top: `${ghost.y - ghost.offY}px`,
                width: `${ghost.w}px`,
                height: `${ghost.h}px`,
              }}
              aria-hidden="true"
              inert
            >
              <span className="cell-grip">
                <span className="grip-dots" />
              </span>
              {blocks[ghost.id]}
            </div>
          )}
        </div>
      </div>

      {replacePrompt}
    </CardStackProvider>
  );
}

/**
 * What the tab says about itself before you have opened a single slot: how
 * much is on this character, and where it is sitting.
 *
 * Three of the four places have a ceiling and say so; the pack, which has
 * none, reports a bare count. Burden is the one number here that can be
 * *wrong*, so it sits at the end on its own, the way the Abilities tab's
 * always-on count does.
 */
function Overview({ overview }) {
  const { burden } = overview;

  return (
    <div className="inventory-overview">
      <span className="abilities-total">
        <span className="abilities-total-n">{overview.total}</span>
        <span className="abilities-total-label">
          {overview.total === 1 ? 'thing' : 'things'} on you
        </span>
      </span>

      <span className="inv-tallies">
        {overview.tallies.map((tally) => (
          <span className={`inv-tally inv-tally-${tally.id}`} key={tally.id}>
            <b>
              {tally.filled}
              {tally.of !== null && <span className="inv-tally-of">/{tally.of}</span>}
            </b>{' '}
            {tally.label}
          </span>
        ))}
      </span>

      <span
        className={`inv-burden${burden.over > 0 ? ' is-over' : ''}`}
        title={
          burden.over > 0
            ? `Overburdened by ${burden.over}. Shed some worn magic.`
            : 'Magic Burden across everything worn, held and clipped on.'
        }
      >
        {burden.used} / {burden.max} burden
      </span>
    </div>
  );
}

function labelOf(id) {
  return BLOCKS.find((block) => block.id === id)?.label ?? id;
}
