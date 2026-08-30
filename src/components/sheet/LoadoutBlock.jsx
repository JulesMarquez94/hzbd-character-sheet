import { useState } from 'react';
import UsePrompt from './UsePrompt.jsx';
import { AmmoPips, ChargeDots, ItemIcon, SlotGlyph } from './itemParts.jsx';
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
import { cardCost } from '../../lib/cardText.js';
import { characterSkillGrantSources } from '../../lib/levelPicks.js';
import { shortName } from '../../lib/combatBar.js';
import { usePlayCard } from './usePlayCard.js';
import { attackModifiers, ridingLine } from '../../lib/moves.js';
import { magazineUse } from '../../lib/uses.js';

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

/**
 * Drawing the other weapon is an action of its own, and it is a card like any
 * other: SWAP WEAPONS prints its own price in weapons.js and this block reads it
 * rather than restating it. The number here is only what to charge if the codex
 * has somehow lost the card.
 */
const SWAP_AP = 2;

/**
 * What the holder does to SWAP WEAPONS.
 *
 * QUICK DRAW: "The cost of swapping weapon is reduced by 1." It is the one skill
 * in the codex that prices an action rather than a roll, and it rides the card
 * exactly as an Arcanist's PERFECT CASTING rides a spellbook. `apCut` and
 * `apCutFrom` meet the printed cost in `cardCost`, so the orb on the button,
 * the orb on the pay button and the card in the prompt all print 1 with the 2
 * struck out beside it, and none of the three can disagree with the others.
 *
 * No floor is passed, because the card names none: "reduced by 1" and nothing
 * about a minimum. `cardCost` floors at nothing when it is given nothing.
 *
 * Read off the named rows rather than a sum so the orb can say what cut it, the
 * same trade `restCut` in rest.js makes. Here rather than in the codex because
 * this block is the only place SWAP WEAPONS is ever played; it moves the day the
 * swap reaches the quick bar.
 */
function swapModifiers(character) {
  const rows = characterSkillGrantSources(character)
    .map((row) => ({ name: row.name, cut: Math.floor(Number(row.swapAp) || 0) }))
    .filter((row) => row.cut > 0);

  if (rows.length === 0) return null;

  return {
    apCut: rows.reduce((sum, row) => sum + row.cut, 0),
    apCutFrom: rows.map((row) => row.name),
  };
}

export default function LoadoutBlock({ character, patch, readOnly = false }) {
  // The use waiting on the action-or-reaction question, or null.
  const [request, setRequest] = useState(null);
  const stack = useCardStack();
  const play = usePlayCard({ character, patch });

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

  /* What the swap costs these hands: off the card, and after whatever the holder
     takes off it. Read once for the block, so the button prints it, the prompt
     charges it and the card inside the prompt shows the same revision. */
  const swapCard = getCard('swap-weapons');
  const swapRiders = swapModifiers(character);
  const swapCost = cardCost(swapCard ?? { ap: SWAP_AP }, swapRiders);

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
  function confirmUse(mode, amount, options) {
    // Paid, told and rolled exactly as the quick bar does: one swing, one line.
    play(request, mode, amount, options);
    setRequest(null);
  }

  function askWeaponCard(card) {
    const riders = attackModifiers(character, card, modifiers);
    // What the use writes to the magazine, on either side of it. See uses.js.
    const magazine = magazineUse(character, card);

    setRequest({
      name: shortName(card),
      source: `${primary.name} · in hand`,
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
      note: [ridingLine(riders), magazine?.note].filter(Boolean).join(' ') || null,
      /* And drawn, because a round is the one cost a printed card cannot show: the
         prompt is where the player last gets to change their mind about firing the
         only shot they have. */
      ammo: magazine?.ammo ?? null,
      ammoMax: magazine?.charges ?? 0,
      ammoLeft: (magazine?.charges ?? 0) - (magazine?.used ?? 0),
      extra: magazine?.patch ?? null,
    });
  }

  function askSwap() {
    setRequest({
      name: swapCard?.name ?? 'Swap Weapons',
      source: swapLine(primary, secondary),
      ap: swapCost.ap,
      wp: null,
      card: swapCard,
      /* The cut, named, so the prompt says the number was revised and by what
         rather than quietly charging less than the card beside it prints. */
      modifiers: swapRiders,
      apWas: swapCost.cut > 0 ? swapCost.printed : null,
      apCutFrom: swapCost.from,
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
      source: `${item.name} · loop ${index + 1}`,
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

        {/* A pact-bound weapon swaps like anything else. It holds a weapon slot
            for as long as its set is held and it cannot be lost, both of which
            the equip hook enforces in whichever hand it is in. Which hand that
            is is a thing you do in a fight, and PACT-BOUND WEAPON's own "it
            returns to your hand at a word" is the sentence that says so. */}
        {!readOnly && (primary || secondary) && (
          <button
            type="button"
            className="swap-btn"
            onClick={askSwap}
            title={`${swapLine(primary, secondary)}. It costs ${swapCost.ap} Action ${
              swapCost.ap === 1 ? 'Point' : 'Points'
            }${swapCost.cut > 0 ? `, cut from ${swapCost.printed} by ${listOut(swapCost.from)}` : ''}`}
          >
            <span className="swap-glyph" aria-hidden="true">
              ⇄
            </span>
            Swap
            <CostOrb
              kind="ap"
              value={swapCost.ap}
              size={17}
              was={swapCost.cut > 0 ? swapCost.printed : null}
              from={swapCost.from}
            />
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
                {readOnly ? 'Empty hands' : 'Empty hands · arm yourself on the Inventory tab'}
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
                  {readOnly ? 'Empty' : 'Empty · clip something on from the Inventory tab'}
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

  /* And how much of it is loaded. Jules asked for it here, beside the attack:
     "on the action next to shoot you see bullet shaped indicator that empty as you
     use". The rounds are drawn on the Reload beside it as well, because the row
     that fills a magazine is the row a reader looks at to find out whether it
     needs filling. See uses.js. */
  const magazine = magazineUse(character, card);
  const spent = Boolean(magazine?.spent);

  return (
    <div className={`use-row${riding ? ' use-row-riding' : ''}${spent ? ' use-row-spent' : ''}`}>
      <button
        type="button"
        className="use-row-main"
        onClick={onUse}
        disabled={readOnly || spent}
        title={spent ? magazine.spentNote : readOnly ? card.name : `Use ${shortName(card)}`}
      >
        <span className="use-row-name">{shortName(card)}</span>

        {spent ? (
          <span className="use-row-spent-note">{magazine.spentLabel}</span>
        ) : (
          <CostOrbs ap={card.ap} wp={card.wp} size={19} className="use-row-costs" />
        )}

        {magazine && (
          <AmmoPips ammo={magazine.ammo} charges={magazine.charges} used={magazine.used} />
        )}
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
      title={`${label} · read the card`}
      aria-label={`${label} details`}
    >
      i
    </button>
  );
}

/** "Quick Draw", "Quick Draw and something else". No Oxford comma. */
function listOut(words) {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** What the swap actually does, said plainly — one hand may well be empty. */
function swapLine(primary, secondary) {
  if (primary && secondary) return `${secondary.name} comes up, ${primary.name} goes away`;
  if (secondary) return `${secondary.name} comes up, your hands are empty now`;
  return `${primary.name} goes away, you draw nothing in its place`;
}

/** What the item loses on top of the points, said before it happens. */
function chargeNote(remaining, consumable, item) {
  const left = remaining - 1;
  if (left > 0) return `Spends a charge. ${left} of ${remaining} left after this.`;
  if (consumable) return 'This is the last of it. Using it finishes the item.';
  return item.recharge
    ? `Its last charge. It comes back after a ${item.recharge}.`
    : 'Its last charge.';
}

/** Why a row cannot be used, when it cannot. */
function spentTitle({ spent, consumable, item }) {
  if (!spent) return null;
  if (consumable) return `${item.name} is used up. Discard it from the Inventory tab.`;
  return item.recharge
    ? `${item.name} is spent until a ${item.recharge}`
    : `${item.name} is spent`;
}
