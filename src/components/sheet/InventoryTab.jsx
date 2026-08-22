import { useCallback, useMemo, useState } from 'react';
import ArmorBlock from './ArmorBlock.jsx';
import BagBar from './BagBar.jsx';
import BeltBlock from './BeltBlock.jsx';
import ForgeWindow from './ForgeWindow.jsx';
import PackBlock from './PackBlock.jsx';
import TrinketBlock from './TrinketBlock.jsx';
import WeaponBlock from './WeaponBlock.jsx';
import BlockArrange from './BlockArrange.jsx';
import { useEquipSlots } from './useEquipSlots.jsx';
import { CardStackProvider } from '../CardStack.jsx';
import { formatWeight, normalizeSourceOrder } from '../../lib/characterModel.js';
import { inventoryOverview } from '../../lib/items.js';
import { useUnit } from '../../context/units.js';

/**
 * The Inventory tab is built like the Character tab, with one exception.
 * Blocks 1–4 are the fixed 360x640 the whole site is built on — armor, the
 * two weapons in hand, the trinkets, the utility belt. The inventory is the
 * fifth, and it is the only block on the site that is not one block wide: a
 * list has no natural length, so it takes the whole row under the others and
 * shrinks with the page, down to a single block on a phone.
 *
 * The four fixed blocks are the player's to arrange, exactly as the Character
 * and Abilities tabs' are, and the arrangement is stored on the character so it
 * follows the sheet rather than the browser it was set in. The inventory is not
 * in that order: it is a row wide, so it has only one place it can go.
 *
 * ------------------------------------------------------------------- the bag
 * And above all of it, one slot that is not a block at all. A bag is the only
 * thing on this tab that answers a question about the *whole* tab: what
 * everything else is allowed to weigh. So it sits across the top with the meter
 * it moves, above the grid and outside the arrangement. See BagBar.jsx.
 *
 * Equipping lives here rather than in any one block, so one rule covers the
 * whole tab: filling an occupied slot always asks where the old piece goes,
 * and taking anything off only ever sends it to the inventory. The inventory
 * block is the single place something can be destroyed.
 *
 * The trinket block is the one exception to the first half of that, and not to
 * the second: it is a list rather than a set of slots, so nothing is ever
 * displaced and nothing has to be asked. Taking a ring off still sends it to the
 * inventory.
 *
 * There are two ways in and they meet at the same rule. A block opens the
 * codex on one slot, which answers "what could go here?". A row of the
 * inventory opens the other question, "where does this go?", and both end at
 * the same replace prompt when the place they land on is already taken.
 *
 * Everything writes to the character row itself (`equipment`, `belt`,
 * `trinkets`, `pack`, `forged`), so the Character tab's Armor, Defense and
 * Shield react in the same save — and viewers see the change live through the
 * characters subscription.
 *
 * ------------------------------------------------------------------- the forge
 * Making an enchanted item is raised from the codex browser's own head, from
 * whichever block opened it, and lands here because this is where the tab's one
 * writer lives. The window collects a base, its workings and a name; `forgeItem`
 * mints the record and drops the thing in the inventory.
 */

/** The four blocks that can move, and what to call one out loud. */
const BLOCKS = [
  { id: 'armor', label: 'Armor' },
  { id: 'weapons', label: 'Weapons' },
  { id: 'trinkets', label: 'Trinkets' },
  { id: 'belt', label: 'Utility Belt' },
];

const BLOCK_IDS = BLOCKS.map((block) => block.id);

export default function InventoryTab({ character, patch, readOnly = false }) {
  const {
    equipment,
    pack,
    belt,
    beltSlots,
    trinkets,
    equip,
    unequip,
    clipToBelt,
    unclipBelt,
    discardBelt,
    setBeltUsed,
    wearTrinket,
    removeTrinket,
    swapTrinket,
    addToPack,
    addCustomToPack,
    updateCustomInPack,
    forgeItem,
    discardFromPack,
    replacePrompt,
  } = useEquipSlots(character, patch);

  const overview = useMemo(() => inventoryOverview(character), [character]);

  const savedOrder = useMemo(
    () => normalizeSourceOrder(character?.inventory_order, BLOCK_IDS),
    [character?.inventory_order]
  );
  const saveOrder = useCallback((next) => patch?.({ inventory_order: next }), [patch]);

  /* Arranged from a list in a modal rather than by dragging the blocks where
     they sit — see the note at the top of BlockArrange.jsx. */
  const [arranging, setArranging] = useState(false);
  /* Whether the forge is up. Any block's codex can raise it, and it always ends
     in the same place: a record in the registry and the item in the inventory. */
  const [forging, setForging] = useState(false);
  const order = savedOrder;

  const openForge = !readOnly && patch ? () => setForging(true) : null;

  const slotProps = {
    character,
    equipment,
    pack,
    belt,
    equip,
    unequip,
    addToPack,
    onForge: openForge,
    readOnly,
  };
  const trinketProps = {
    character,
    equipment,
    pack,
    belt,
    trinkets,
    wearTrinket,
    removeTrinket,
    swapTrinket,
    addToPack,
    onForge: openForge,
    readOnly,
  };
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
    addToPack,
    onForge: openForge,
    readOnly,
  };
  const packProps = {
    character,
    equipment,
    belt,
    beltSlots,
    pack,
    trinkets,
    equip,
    clipToBelt,
    wearTrinket,
    addToPack,
    addCustomToPack,
    updateCustomInPack,
    discardFromPack,
    onForge: openForge,
    readOnly,
  };

  /* The contents of each movable block, keyed by the id the order refers to.
     Only the arrangement moves — a block is the same block wherever it lands. */
  const blocks = {
    armor: <ArmorBlock {...slotProps} />,
    weapons: <WeaponBlock {...slotProps} />,
    trinkets: <TrinketBlock {...trinketProps} />,
    belt: <BeltBlock {...beltProps} />,
  };

  return (
    <CardStackProvider character={character}>
      <div className="inventory-tab">
        {/* The arrange button rides the end of the overview line, the way the
            Abilities tab's does — see the note over .sheet-arrange-bar in
            sheet.css. */}
        <Overview
          overview={overview}
          onArrange={!readOnly && patch ? () => setArranging(true) : null}
        />

        {/* ==== THE BAG, ACROSS THE TOP ====
            Above the grid rather than in it, and never in the arrangement: it
            is the one slot on the tab that is about the whole tab, so there is
            nowhere else it could sit. See BagBar.jsx. */}
        <BagBar {...slotProps} />

        {arranging && (
          <BlockArrange
            title="Arrange your inventory blocks"
            order={order}
            describe={(id) => ({ name: labelOf(id), note: null })}
            onChange={saveOrder}
            onClose={() => setArranging(false)}
          />
        )}

        <div className="sheet-grid-6">
          {order.map((id) => (
            <section key={id} className="sheet-cell">
              {blocks[id]}
            </section>
          ))}

          {/* ==== THE INVENTORY, ACROSS THE WHOLE ROW ====
              Pinned under the others rather than ordered with them: it is
              as wide as the row is, so there is nowhere else it could sit. */}
          <section className="sheet-cell sheet-cell-wide">
            <PackBlock {...packProps} />
          </section>
        </div>
      </div>

      {replacePrompt}

      {forging && (
        <ForgeWindow
          character={character}
          onForge={forgeItem}
          onClose={() => setForging(false)}
        />
      )}
    </CardStackProvider>
  );
}

/**
 * What the tab says about itself before you have opened a single slot: how
 * much is on this character, and where it is sitting.
 *
 * Two of the five places have a ceiling and say so; the trinkets and the pack,
 * which have none, report a bare count. Burden and the load are the two numbers
 * here that can be *wrong*, so they sit at the end, the way the Abilities tab's
 * always-on count does — sharing that end with the arrange button rather than
 * leaving it a row of its own underneath.
 *
 * The two of them together, because they are the two ceilings and a reader
 * checking one is checking both. The bar under this line is the load's readout,
 * exactly as the armor block's meter is Burden's; these are the alarms.
 */
function Overview({ overview, onArrange }) {
  const { burden, carry } = overview;
  const unit = useUnit();

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

      <span className="overview-end">
        <span
          className={`inv-burden${carry.state !== 'clear' ? ' is-over' : ''}`}
          title={
            carry.state === 'stuck'
              ? `${formatWeight(carry.by, unit)} over your capacity, which is past 30%. You cannot move at all.`
              : carry.state === 'over'
                ? `${formatWeight(carry.by, unit)} over your capacity. Your Speed is halved.`
                : 'Everything you own, against what your Physique and your bag can shift.'
          }
        >
          {formatWeight(carry.used, unit)} / {formatWeight(carry.max, unit)}
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

        {onArrange && (
          <button type="button" className="btn btn-minimal btn-sm" onClick={onArrange}>
            Arrange blocks
          </button>
        )}
      </span>
    </div>
  );
}

function labelOf(id) {
  return BLOCKS.find((block) => block.id === id)?.label ?? id;
}
