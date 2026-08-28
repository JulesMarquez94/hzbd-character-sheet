import { useState } from 'react';
import ItemBrowser from './ItemBrowser.jsx';
import { ItemFoot, ItemIcon, ItemTags, SlotGlyph, SlotTools } from './itemParts.jsx';
import CostOrbs from '../CostOrbs.jsx';
import { CardLine } from '../CardText.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { WEAPON_SLOTS, heldItem, rarityColor, wieldModifiers } from '../../lib/items.js';
import { getCard, itemEnchantments } from '../../lib/weapons.js';
import { attackModifiers } from '../../lib/moves.js';
import { pactWeaponId } from '../../lib/pact.js';
import { cardTitle } from '../../lib/cardText.js';

/**
 * The Inventory tab's weapon block: the two weapons a character has in hand.
 *
 * A weapon is gear that teaches cards. Held, it lends you the two abilities
 * printed on it — tapping either deals the full card onto the pile in front
 * of the sheet, printed for whoever is holding it: this character's numbers,
 * and whatever damage type and Empowering the weapon's enchantments impose.
 *
 * Three things are clickable on a weapon: its name opens the codex for that
 * slot (swap, or send it back to the pack), the ⓘ opens the item itself with
 * its lore and workings, and each ability box opens that card.
 */
export default function WeaponBlock({
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

  const drawn = WEAPON_SLOTS.filter((slot) => equipment[slot.key]).length;

  return (
    <div className="cell-scroll weapon-block">
      <div className="block-head">
        <span className="stat-category-label">Weapons</span>
        <span className="block-count">
          {drawn} / {WEAPON_SLOTS.length}
        </span>
      </div>

      {WEAPON_SLOTS.map((slot) => {
        /* What this character carries, not what the codex prints: an Enchanter's
           own work on their own blade is on their sheet. See heldItem. */
        const item = heldItem(character, equipment[slot.key]);
        /* The Pact of Ordenance's weapon, while its set is held. It cannot be
           put away or replaced: the browser and the remove button both step
           aside, and the row says why. Which hand holds it is the Character
           tab's swap to change, and its form changes over a Long Rest. */
        const bound = Boolean(item) && pactWeaponId(character) === item.id;

        return (
          <section className="weapon-panel" key={slot.key}>
            {item ? (
              <WeaponFace
                item={item}
                slot={slot}
                bound={bound}
                character={character}
                stack={stack}
                readOnly={readOnly}
                onBrowse={() => setBrowseSlot(slot)}
                onRemove={() => unequip(slot.key)}
              />
            ) : (
              <button
                type="button"
                className="weapon-empty"
                onClick={() => setBrowseSlot(slot)}
                title={`Browse weapons for the ${slot.label.toLowerCase()} slot`}
              >
                <span className="equip-glyph">
                  <SlotGlyph slot="main_hand" />
                </span>
                <span className="equip-empty-body">
                  <span className="equip-slot-label">{slot.label}</span>
                  <span className="equip-empty-hint">
                    {readOnly ? 'Empty' : 'Empty · tap to arm yourself'}
                  </span>
                </span>
              </button>
            )}
          </section>
        );
      })}

      {browseSlot && (
        <ItemBrowser
          slot={browseSlot}
          character={character}
          equipment={equipment}
          pack={pack}
          onEquip={(slotKey, item) => {
            equip(slotKey, item);
            setBrowseSlot(null);
          }}
          onUnequip={(slotKey) => {
            unequip(slotKey);
            setBrowseSlot(null);
          }}
          onAdd={addToPack}
          onForge={onForge}
          onClose={() => setBrowseSlot(null)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

/** One held weapon: what it is, what it teaches, and what has been laid on it. */
/** "Sharp", "Fire or Cold", "Fire, Cold or Force". No Oxford comma. */
function listOr(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} or ${words[words.length - 1]}`;
}

function WeaponFace({ item, slot, bound = false, character, stack, readOnly, onBrowse, onRemove }) {
  const cards = (item.abilities ?? []).map(getCard).filter(Boolean);
  const enchantments = itemEnchantments(item);
  /* What this weapon does in *this* character's hands: what is worked into it,
     plus whatever an Enchanter is wearing. See wieldModifiers. */
  const modifiers = wieldModifiers(character, item);

  return (
    <>
      <div
        className={`item-row weapon-row${bound ? ' weapon-row-pact' : ''}`}
        style={{ borderLeftColor: rarityColor(item) }}
      >
        <button
          type="button"
          className="item-row-tap"
          /* A pact-bound weapon has no browser to open: nothing replaces it and
             nothing puts it away. Its tap reads the item instead, which is where
             its workings and its lore already live. */
          onClick={bound ? () => stack?.openItem(item) : onBrowse}
          title={
            bound
              ? `${item.name} · pact-bound. It cannot be put away. Swap hands on the Character tab, reshape it over a Long Rest.`
              : readOnly
                ? item.name
                : `${item.name} · tap to swap or send to inventory`
          }
        >
          <span className="item-row-top">
            {/* The smaller tile, and the only item row on the tab that keeps it.
                A weapon row is two lines and no more (a weapon's numbers are the
                cards under it, not chips on it), so the bigger tile would be 10
                pixels of nothing beside the tags -- and this is the block with
                the least to spare: two panels, four ability boxes and up to six
                workings in one 640 that must not scroll. Measured: with the row
                tile at 48, two Grave-Lantern Blades overlap their panels. */}
            <ItemIcon item={item} />
            <span className="item-row-ident">
              <span className="item-row-line">
                <span className="item-row-name">{item.name}</span>
                <span className="equip-slot-label">{slot.label}</span>
                {bound && <span className="pact-chip">Pact-Bound</span>}
              </span>
              <ItemTags item={item} />
            </span>
          </span>
        </button>

        {/* Weight, price and Burden, the same three a helm states. The Burden
            used to be printed again down in the workings strip below, which was
            the only place on the sheet that said it twice. */}
        <ItemFoot item={item}>
          <SlotTools
            item={item}
            onInfo={() => stack?.openItem(item)}
            onRemove={readOnly || bound ? null : onRemove}
            removeTitle={`Put ${item.name} away. It goes to your inventory.`}
          />
        </ItemFoot>
      </div>

      {/* A block is a fixed 360x640 and never scrolls: an enchanted weapon
          spends that room on its workings, and its description moves to the
          ⓘ card where there is space for it. */}
      {item.blurb && enchantments.length === 0 && <p className="weapon-blurb">{item.blurb}</p>}

      <div className="weapon-cards">
        {cards.map((card) => (
          <button
            type="button"
            className="ability-box"
            key={card.id}
            /* Per card, not per weapon: a Trickster's pending AMBUSH and a
               Duelist's Martial Move both ride the two attacks and not the shield
               block beside them, and so does the advantage a one-handed weapon is
               worth. See attackModifiers in moves.js. */
            onClick={() => stack?.openCard(card, attackModifiers(character, card, modifiers))}
            title={`Open the ${card.name} card`}
          >
            <span className="ability-box-glyph">
              <SlotGlyph card={card} />
            </span>

            <span className="ability-box-body">
              <span className="ability-box-name">{cardTitle(card)}</span>
              <span className="item-tags">
                {card.tags.map((tag) => (
                  <span className="item-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </span>
            </span>

            <CostOrbs ap={card.ap} wp={card.wp} size={22} className="ability-box-costs" />
          </button>
        ))}
      </div>

      {enchantments.length > 0 && (
        <div className="weapon-enchant">
          <span className="weapon-enchant-head">
            <span className="weapon-enchant-label">
              Enchanted{modifiers.damage.length > 0 ? ` · ${listOr(modifiers.damage)}` : ''}
            </span>
          </span>

          {/* One chip per working; each opens its own card. */}
          <span className="weapon-enchant-chips">
            {enchantments.map(({ id, enchantment }) => (
              <button
                type="button"
                key={id}
                className="enchant-chip"
                onClick={() => stack?.openCard(enchantment)}
                title={enchantment.effect}
              >
                {enchantment.name}
              </button>
            ))}
          </span>

          {item.enchantText && enchantments.length === 1 && (
            <span className="weapon-enchant-text">
              <CardLine
                text={item.enchantText}
                character={character}
                onLink={(name) => stack?.openCard(name)}
              />
            </span>
          )}
        </div>
      )}
    </>
  );
}
