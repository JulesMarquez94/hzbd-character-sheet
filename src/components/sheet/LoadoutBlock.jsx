import { useState } from 'react';
import UsePrompt from './UsePrompt.jsx';
import { ChargeDots, ItemIcon, SlotGlyph } from './itemParts.jsx';
import CostOrbs, { CostOrb } from '../CostOrbs.jsx';
import { useCardStack } from '../../context/card-stack.js';
import {
  BELT_MAX,
  beltEntry,
  beltSlotCount,
  heldItem,
  normalizeBelt,
  normalizeEquipment,
  rarityColor,
  wieldModifiers,
} from '../../lib/items.js';
import { getCard } from '../../lib/weapons.js';
import { shortName, spendUse } from '../../lib/combatBar.js';
import { attackModifiers, ridingLine } from '../../lib/moves.js';

/**
 * The Character tab's third block: what you have in your hands and on your
 * belt, summarised down to the only thing this tab is for — using it.
 *
 * The Inventory tab is where a loadout is *arranged*; nothing here changes
 * what you carry. Everything on this block is either a use or a look: tapping
 * a row spends it, and the ⓘ beside it deals the card so you can read what it
 * actually does without leaving the tab.
 *
 * Only the primary weapon's cards are usable, because only one weapon is in
 * your hands. The secondary is shown stowed above it, and the swap that draws
 * it costs Action Points like anything else — which is what makes carrying two
 * weapons a decision rather than a formality.
 *
 * Both weapons and all five loops have to fit one 360x640 block without
 * scrolling, so every row here is one line: the move's short name, what it
 * costs, and what is left of it.
 */

/** Drawing the other weapon is an action of its own. */
const SWAP_AP = 2;

export default function LoadoutBlock({ character, patch, readOnly = false }) {
  // The use waiting on the action-or-reaction question, or null.
  const [request, setRequest] = useState(null);
  const stack = useCardStack();

  const equipment = normalizeEquipment(character.equipment);
  const belt = normalizeBelt(character.belt);
  const beltSlots = beltSlotCount(character);

  const primary = heldItem(character, equipment.main_hand);
  const secondary = heldItem(character, equipment.off_hand);
  /* `wieldModifiers` rather than `itemModifiers`: an Enchanter's own workings
     travel with their hands, and this block prints what the weapon does in
     *these* hands. It was reading the blade alone, so a Fire Infusion on the
     Enchanter changed the chip on the Inventory tab and not the one here. */
  const modifiers = wieldModifiers(character, primary);

  /* What the weapon itself does — its own two attacks, printed for whoever is
     holding it. A spell an enchantment carries is not one of them: that is
     something the blade *teaches* its bearer, and it belongs with the rest of
     what this character can do rather than in the weapon's own moves. */
  const cards = primary ? (primary.abilities ?? []).map(getCard).filter(Boolean) : [];

  /**
   * Every use on this block goes through the same question, and the spend
   * itself lives in combatBar.js, shared with the quick bar — so the same
   * card costs the same wherever it was tapped.
   */
  function confirmUse(mode, amount) {
    const body = spendUse(request, character, mode, amount);
    if (Object.keys(body).length > 0) patch(body);
    setRequest(null);
  }

  function askWeaponCard(card) {
    const riders = attackModifiers(character, card, modifiers);

    setRequest({
      name: card.name,
      source: `${primary.name} — in hand`,
      ap: card.ap,
      wp: card.wp,
      card,
      /* The attack is printed with this weapon's damage type and Empowering,
         exactly as it reads on the block behind the prompt — plus whatever is
         waiting on it, which is the point of paying for an AMBUSH or a Martial
         Move before the swing rather than after. */
      modifiers: riders,
      /* And named, since the prompt is the last thing between the player and the
         swing that spends them. */
      note: ridingLine(riders),
    });
  }

  function askSwap() {
    const card = getCard('swap-weapons');

    setRequest({
      name: card?.name ?? 'Swap Weapons',
      source: swapLine(primary, secondary),
      ap: SWAP_AP,
      wp: null,
      card,
      extra: {
        equipment: { ...equipment, main_hand: equipment.off_hand, off_hand: equipment.main_hand },
      },
    });
  }

  function askBeltItem(index, state) {
    const { item, charges, used, remaining, consumable } = state;
    const card = getCard(item.abilities?.[0]);

    // A charged item spends one on the way out; anything else is only points.
    const nextBelt = charges > 0 ? [...belt] : null;
    if (nextBelt) nextBelt[index] = { id: item.id, used: used + 1 };

    setRequest({
      name: card?.name ?? item.name,
      source: `${item.name} — loop ${index + 1}`,
      ap: card?.ap,
      wp: card?.wp,
      card,
      note: charges > 0 ? chargeNote(remaining, consumable, item) : null,
      extra: nextBelt ? { belt: nextBelt } : null,
    });
  }

  return (
    <div className="cell-scroll loadout-block">
      {/* ---------- WEAPONS ---------- */}
      <div className="loadout-head">
        <span className="stat-category-label">Weapons</span>

        {!readOnly && (primary || secondary) && (
          <button
            type="button"
            className="swap-btn"
            onClick={askSwap}
            title={`${swapLine(primary, secondary)} — it costs ${SWAP_AP} Action Points`}
          >
            <span className="swap-glyph" aria-hidden="true">
              ⇄
            </span>
            Swap
            <CostOrb kind="ap" value={SWAP_AP} size={17} />
          </button>
        )}
      </div>

      <StowedWeapon item={secondary} stack={stack} />

      <div className="drawn-weapon">
        {primary ? (
          <>
            <div className="drawn-head">
              <ItemIcon item={primary} />
              <span className="drawn-name">{primary.name}</span>
              <span className="hand-badge hand-badge-primary">Primary</span>
              <InfoButton onClick={() => stack?.openItem(primary)} label={primary.name} />
            </div>

            {cards.map((card) => (
              <AttackRow
                key={card.id}
                card={card}
                character={character}
                modifiers={modifiers}
                stack={stack}
                readOnly={readOnly}
                onUse={() => askWeaponCard(card)}
              />
            ))}
          </>
        ) : (
          <div className="loadout-empty">
            <span className="equip-glyph">
              <SlotGlyph slot="main_hand" />
            </span>
            <span className="equip-empty-body">
              <span className="equip-slot-label">Primary</span>
              <span className="equip-empty-hint">
                {readOnly ? 'Empty hands' : 'Empty hands — arm yourself on the Inventory tab'}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ---------- QUICK BELT ---------- */}
      <span className="stat-category-label">Quick Belt</span>

      {Array.from({ length: BELT_MAX }, (_, index) => {
        if (index >= beltSlots) {
          return (
            <div className="loadout-empty belt-locked" key={index} title="This loop opens as you advance">
              <span className="equip-glyph">
                <SlotGlyph slot="lock" />
              </span>
              <span className="equip-empty-body">
                <span className="equip-slot-label">Loop {index + 1}</span>
                <span className="equip-empty-hint">Locked</span>
              </span>
            </div>
          );
        }

        const state = beltEntry(character, belt[index]);

        if (!state) {
          return (
            <div className="loadout-empty" key={index}>
              <span className="equip-glyph">
                <SlotGlyph slot="belt" />
              </span>
              <span className="equip-empty-body">
                <span className="equip-slot-label">Loop {index + 1}</span>
                <span className="equip-empty-hint">
                  {readOnly ? 'Empty' : 'Empty — clip something on from the Inventory tab'}
                </span>
              </span>
            </div>
          );
        }

        return (
          <BeltRow
            key={index}
            state={state}
            stack={stack}
            readOnly={readOnly}
            onUse={() => askBeltItem(index, state)}
          />
        );
      })}

      {request && (
        <UsePrompt
          request={request}
          character={character}
          onCancel={() => setRequest(null)}
          onConfirm={confirmUse}
        />
      )}
    </div>
  );
}

/**
 * One of the weapon's attacks, on one line, plus a second line when something is
 * riding it.
 *
 * That second line is the Duelist's Developpement Notes, honoured where they
 * asked for it: "when possible updating the attack text to say (not on the card)
 * that this attack will MARTIAL MOVE NAME". Not on the card — the card is the
 * codex's and says what the attack always does. This row is the sheet's and says
 * what *this* swing will do, which is the only place the distinction can live.
 */
function AttackRow({ card, character, modifiers, stack, readOnly, onUse }) {
  const riders = attackModifiers(character, card, modifiers);
  const riding = ridingLine(riders);

  return (
    <div className={`use-row${riding ? ' use-row-riding' : ''}`}>
      <button
        type="button"
        className="use-row-main"
        onClick={onUse}
        disabled={readOnly}
        title={readOnly ? card.name : `Use ${card.name}`}
      >
        <span className="use-row-name">{shortName(card)}</span>
        <CostOrbs ap={card.ap} wp={card.wp} size={19} className="use-row-costs" />
      </button>

      <InfoButton onClick={() => stack?.openCard(card, riders)} label={`${card.name} card`} />

      {riding && <span className="use-row-rider">{riding}</span>}
    </div>
  );
}

/**
 * One loop, on one line: what it is, what reaching for it costs, and how much
 * of it is left. The dots are a readout here — a charge is spent by using the
 * thing, and only the belt block itself lets you tick them by hand.
 */
function BeltRow({ state, stack, readOnly, onUse }) {
  const { item, charges, used, spent, consumable } = state;
  const card = getCard(item.abilities?.[0]);
  const finished = spent && consumable;

  return (
    <div className={`use-row belt-row${spent ? ' use-row-spent' : ''}`}>
      <button
        type="button"
        className="use-row-main"
        style={{ borderLeftColor: rarityColor(item) }}
        onClick={onUse}
        disabled={readOnly || spent}
        title={spentTitle(state) ?? `Use ${item.name}`}
      >
        <ItemIcon item={item} />
        <span className="use-row-name">{item.name}</span>

        {spent ? (
          <span className="use-row-spent-note">{finished ? 'Used up' : 'Spent'}</span>
        ) : (
          <>
            <CostOrbs ap={card?.ap} wp={card?.wp} size={19} className="use-row-costs" />
            {charges > 0 && <ChargeDots charges={charges} used={used} readOnly />}
          </>
        )}
      </button>

      <InfoButton
        onClick={() => (card ? stack?.openCard(card) : stack?.openItem(item))}
        label={item.name}
      />
    </div>
  );
}

/** The weapon you are not holding: named, numbered, and out of reach. */
function StowedWeapon({ item, stack }) {
  if (!item) {
    return (
      <div className="stowed-weapon stowed-empty">
        <span className="equip-slot-label">Secondary</span>
        <span className="equip-empty-hint">Nothing stowed</span>
      </div>
    );
  }

  return (
    <div className="stowed-weapon">
      <span className="stowed-name">{item.name}</span>
      <span className="hand-badge">Secondary</span>
      <InfoButton onClick={() => stack?.openItem(item)} label={item.name} />
    </div>
  );
}

/** The ⓘ that every row carries: the card or the item, dealt onto the pile. */
function InfoButton({ onClick, label }) {
  return (
    <button
      type="button"
      className="item-info-btn row-info-btn"
      onClick={onClick}
      title={`${label} — read the card`}
      aria-label={`${label} details`}
    >
      i
    </button>
  );
}

/** What the swap actually does, said plainly — one hand may well be empty. */
function swapLine(primary, secondary) {
  if (primary && secondary) return `${secondary.name} comes up, ${primary.name} goes away`;
  if (secondary) return `${secondary.name} comes up — your hands are empty now`;
  return `${primary.name} goes away — you draw nothing in its place`;
}

/** What the item loses on top of the points, said before it happens. */
function chargeNote(remaining, consumable, item) {
  const left = remaining - 1;
  if (left > 0) return `Spends a charge. ${left} of ${remaining} left after this.`;
  if (consumable) return 'This is the last of it. Using it finishes the item.';
  return item.recharge
    ? `Its last charge — it comes back after a ${item.recharge}.`
    : 'Its last charge.';
}

/** Why a row cannot be used, when it cannot. */
function spentTitle({ spent, consumable, item }) {
  if (!spent) return null;
  if (consumable) return `${item.name} is used up — discard it from the Inventory tab`;
  return item.recharge
    ? `${item.name} is spent until a ${item.recharge}`
    : `${item.name} is spent`;
}
