import { useState } from 'react';
import ItemBrowser from './ItemBrowser.jsx';
import { ItemIcon, ItemTags, SlotGlyph, SlotTools } from './itemParts.jsx';
import CostOrbs from '../CostOrbs.jsx';
import { CardLine } from '../CardText.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { WEAPON_SLOTS, heldItem, itemBurden, rarityColor, wieldModifiers } from '../../lib/items.js';
import { getCard, itemEnchantments } from '../../lib/weapons.js';
import { attackModifiers } from '../../lib/moves.js';

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

        return (
          <section className="weapon-panel" key={slot.key}>
            {item ? (
              <WeaponFace
                item={item}
                slot={slot}
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
                    {readOnly ? 'Empty' : 'Empty — tap to arm yourself'}
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

function WeaponFace({ item, slot, character, stack, readOnly, onBrowse, onRemove }) {
  const cards = (item.abilities ?? []).map(getCard).filter(Boolean);
  const enchantments = itemEnchantments(item);
  /* What this weapon does in *this* character's hands: what is worked into it,
     plus whatever an Enchanter is wearing. See wieldModifiers. */
  const modifiers = wieldModifiers(character, item);
  const burden = itemBurden(item);

  return (
    <>
      <div className="weapon-head" style={{ borderLeftColor: rarityColor(item) }}>
        <button
          type="button"
          className="weapon-head-main"
          onClick={onBrowse}
          title={readOnly ? item.name : `${item.name} — tap to swap or send to inventory`}
        >
          <ItemIcon item={item} />
          <span className="weapon-head-body">
            <span className="weapon-head-line">
              <span className="weapon-name">{item.name}</span>
              <span className="equip-slot-label">{slot.label}</span>
            </span>
            <ItemTags item={item} />
          </span>
        </button>

        <SlotTools
          item={item}
          onInfo={() => stack?.openItem(item)}
          onRemove={readOnly ? null : onRemove}
          removeTitle={`Put ${item.name} away — it goes to your inventory`}
        />
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
              <span className="ability-box-name">{card.name}</span>
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
            <span className="item-value" style={{ color: 'var(--haze-glow)' }}>
              <span className="item-value-num">{burden}</span>
              Burden
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
