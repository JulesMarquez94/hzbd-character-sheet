import {
  ARMOR_SETS,
  RARITY_COLORS,
  itemBurden,
  itemCharges,
  itemCost,
  itemWeight,
  rarityColor,
} from '../../lib/items.js';
import { formatNumber, formatWeight, weightParts } from '../../lib/characterModel.js';
import { useUnit } from '../../context/units.js';
import useCodexArt from '../useCodexArt.js';

/**
 * Shared visual language for items: the slot glyphs, the rarity-tinted icon
 * tile, tag chips, the value chips, the foot the buttons sit on, and rules text
 * with every stat name lit in that stat's own colour.
 *
 * ------------------------------------------------------------------- the row
 * Every item on the sheet wears the same three zones, top to bottom (Jules,
 * 2026-08-22), whether it is a helm in a slot, a ring in a list, a bag above the
 * grid or a line in the codex:
 *
 *     [tile]  Name                            TYPE
 *             tag  tag  tag
 *     +2 Armor
 *     What it does, in a sentence.
 *     4 kg   3,000 c   2 Burden           [i] [down]
 *
 * The tile holds the left edge of the top zone by itself. Everything under it
 * runs the row's full width, which is what gives a block 360 pixels wide a line
 * of rules text worth reading, and the buttons sit at the end rather than in the
 * corner. The shape is `ItemStats` + `ItemFoot` here and `.item-row` in
 * sheet.css; a block writes the zones and never a layout of its own.
 */

/* ------------------------------------------------------------ stat colours */

/**
 * Longest names first, so "Magic Armor" (a set, deliberately uncoloured)
 * wins before "Armor" (the stat) could bite into it. Matching is
 * case-sensitive on purpose: rules text capitalises stat names, so "armor
 * slots" stays plain prose.
 */
const STAT_WORDS = [
  // Set names are matched only so their "Armor" halves stay plain text.
  ...Object.keys(ARMOR_SETS).map((name) => [name, null]),
  ['Magic Burden', 'var(--haze-glow)'],
  ['Willpower', 'var(--stat-wp)'],
  ['Physique', 'var(--attr-physique)'],
  ['Instinct', 'var(--attr-instinct)'],
  ['Defense', 'var(--focus-cyan)'],
  ['Shield', 'var(--stat-shield)'],
  ['Health', 'var(--stat-health)'],
  ['Reflex', 'var(--stat-rp)'],
  ['Armor', 'var(--stat-armor)'],
  ['Grit', 'var(--stat-wp)'],
  ['Mind', 'var(--attr-mind)'],
];

const COLOR_BY_WORD = new Map(STAT_WORDS);

// Optionally swallows a "+1 " / "-2 " bonus in front, so the number lights up
// with the stat it belongs to.
const STAT_REGEX = new RegExp(
  `([+\\-−]\\d+\\s+)?\\b(${STAT_WORDS.map(([word]) => word).join('|')})\\b`,
  'g'
);

/** Rules text with stat names (and their "+N" riders) in the stat's colour. */
export function StatText({ text }) {
  if (!text) return null;

  const parts = [];
  let cursor = 0;
  for (const match of text.matchAll(STAT_REGEX)) {
    const [whole, , word] = match;
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    const color = COLOR_BY_WORD.get(word);
    parts.push(
      color ? (
        <span key={`${match.index}-${word}`} className="stat-word" style={{ color }}>
          {whole}
        </span>
      ) : (
        whole
      )
    );
    cursor = match.index + whole.length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}

/* ------------------------------------------------------------- slot glyphs */

const GLYPH_PATHS = {
  head: (
    <>
      <path d="M5 12.5a7 7 0 0 1 14 0V19h-3.5l-1-3h-5l-1 3H5Z" />
      <path d="M5 12.5h14" />
    </>
  ),
  torso: (
    <>
      <path d="M7 3.5 4.5 6.5l1.5 4V20h12v-9.5l1.5-4L17 3.5l-2.3 1.2a6 6 0 0 1-5.4 0Z" />
      <path d="M12 9v11" />
    </>
  ),
  legs: (
    <>
      <path d="M6 3.5h12l-1.2 17h-3.6L12 12.5l-1.2 8h-3.6Z" />
      <path d="M6.3 8h11.4" />
    </>
  ),
  main_hand: (
    <>
      <path d="M14.5 17 4 6.5v-3h3L17.5 14" />
      <path d="m12.5 15.5 6 6" />
      <path d="m15 19.5 3-3" />
    </>
  ),
  off_hand: (
    <>
      <path d="M12 3.5c2.5 1.5 5 2 7 2V13c0 4-3 6.5-7 8-4-1.5-7-4-7-8V5.5c2 0 4.5-.5 7-2Z" />
      <path d="M12 7v9" />
    </>
  ),
  bow: (
    <>
      <path d="M7.5 3.5a12 12 0 0 1 0 17" />
      <path d="M7.5 3.5v17" />
      <path d="M5 12h14" />
      <path d="m15.5 8.5 3.5 3.5-3.5 3.5" />
    </>
  ),
  firearm: (
    <>
      <path d="M3.5 7.5h15v4h-4.2l-2 5H8.6l-.9-5H3.5Z" />
      <path d="M14 7.5V5.5h3" />
    </>
  ),
  focus: (
    <>
      <path d="M4.5 19.5 15 9" />
      <path d="m13 7 4 4" />
      <path d="M18 2.5l.8 2.7 2.7.8-2.7.8-.8 2.7-.8-2.7-2.7-.8 2.7-.8Z" />
    </>
  ),
  spark: (
    <path d="M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8Z" />
  ),
  /* Belt gear: a pouch for what hangs there, a flask for what you drink. */
  belt: (
    <>
      <path d="M6.4 8.5h11.2l1.1 8.2a3 3 0 0 1-3 3.3H8.3a3 3 0 0 1-3-3.3Z" />
      <path d="M9 8.5V6.8a3 3 0 0 1 6 0v1.7" />
      <path d="M10.3 13h3.4" />
    </>
  ),
  flask: (
    <>
      <path d="M9.8 3.5h4.4" />
      <path d="M10.5 3.5v4.3l-3.9 7.4a3.4 3.4 0 0 0 3 5.3h4.8a3.4 3.4 0 0 0 3-5.3l-3.9-7.4V3.5" />
      <path d="M7.6 14.5h8.8" />
    </>
  ),
  lock: (
    <>
      <path d="M6 10.5h12v9.5H6Z" />
      <path d="M9 10.5V7.6a3 3 0 0 1 6 0v2.9" />
    </>
  ),
  /* A trinket, drawn as the commonest one: a band with a stone set in it. */
  trinket: (
    <>
      <circle cx="12" cy="14.5" r="6" />
      <path d="M9.6 9.1 12 4l2.4 5.1" />
      <path d="M9.6 9.1h4.8" />
    </>
  ),
  /* A chain rather than a band, for what hangs round the neck. */
  necklace: (
    <>
      <path d="M5 4.5a9 9 0 0 0 7 8.5 9 9 0 0 0 7-8.5" />
      <path d="M12 13v2.2" />
      <path d="M12 15.2 14.4 18 12 20.5 9.6 18Z" />
    </>
  ),
  /* And a hanging fold, for what goes over the shoulders. */
  cloak: (
    <>
      <path d="M8.5 3.5 4.5 7l2 13.5h11L19.5 7l-4-3.5" />
      <path d="M8.5 3.5a3.5 3.5 0 0 0 7 0" />
    </>
  ),
  /* The bag: a pack with two straps over the shoulders and a flap on top. Not
     the belt's pouch, which is the same silhouette a size down. */
  bag: (
    <>
      <path d="M5.5 8.5h13l1 11.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5Z" />
      <path d="M8.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
      <path d="M5.8 13.5h12.4" />
    </>
  ),
  /* Whatever the codex has never heard of: a page with something written on it. */
  note: (
    <>
      <path d="M6 3.5h7.6L18 7.9V20.5H6Z" />
      <path d="M13.6 3.5v4.4H18" />
      <path d="M8.6 12.5h6.8" />
      <path d="M8.6 16h4.6" />
    </>
  ),
};

/**
 * Which glyph an item wears. Weapons pick theirs from the family tag they
 * carry, so a bow never shows up as a sword; everything else falls back to
 * the slot it goes in.
 */
function glyphForItem(item) {
  const tags = item?.tags ?? [];
  if (tags.includes('Bag')) return 'bag';
  if (tags.includes('Potion')) return 'flask';
  if (tags.includes('Bow')) return 'bow';
  if (tags.includes('Crossbow')) return 'bow';
  if (tags.includes('Firearm')) return 'firearm';
  if (tags.includes('Focus')) return 'focus';
  if (tags.includes('Shielded')) return 'off_hand';
  // A thrown weapon is a ranged one you hold, so it wears the hand rather than
  // the bow the generic Ranged Weapon fallback below would have given it.
  if (tags.includes('Thrown')) return 'main_hand';
  if (tags.includes('Melee Weapon')) return 'main_hand';
  if (tags.includes('Ranged Weapon')) return 'bow';
  // A trinket says what kind it is in its tags, and a ring and a cloak are not
  // the same shape. Everything else on the shelf falls back to the band.
  if (tags.includes('Necklace')) return 'necklace';
  if (tags.includes('Cloak')) return 'cloak';
  return item?.slots?.[0] ?? 'head';
}

/** The glyph on an ability's little box: how the card is delivered. */
function glyphForCard(card) {
  const tags = card?.tags ?? [];
  // A talent's passives say so in their tags rather than in `kind`.
  if (card?.kind === 'spell' || card?.kind === 'passive' || tags.includes('Passive')) return 'spark';
  if (tags.some((tag) => tag.includes('Move'))) return 'off_hand';
  if (tags.includes('Ranged')) return 'bow';
  return 'main_hand';
}

/**
 * Simple stroke glyph — name the `slot` outright, or hand it an `item` or a
 * `card` and it picks the one that suits.
 */
export function SlotGlyph({ slot, item, card }) {
  const key = card ? glyphForCard(card) : item ? glyphForItem(item) : slot;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {GLYPH_PATHS[key] ?? GLYPH_PATHS.head}
    </svg>
  );
}

/**
 * The tile on an item row: a little bigger than the 40 every other icon on the
 * sheet wears (Jules asked for it, 2026-08-22), because on a row it is the only
 * thing holding the left edge of two lines at once, the name and the tags under
 * it. The two blocks measured to the pixel keep the smaller one, and say why:
 * see WeaponBlock.jsx and the belt's own rows.
 */
export const ROW_ICON = 48;

/**
 * The item's icon tile: the piece itself where the codex has a picture of it,
 * and its slot glyph where it does not. The rarity's colour rims both, because
 * in a browser list or a filled slot this tile is the only place rarity shows.
 *
 * **The thumbnail, never the full picture.** This tile is `ROW_ICON` on an item
 * row, 40 in the tighter places that only have one line for it (a belt loop, the
 * loadout block), and 52 in the equip prompt. A browser list draws nine of them
 * at once, and the 128px cut is 2 KB against the item card's 26. Same rule, and
 * the same reason, as a card brief's plate.
 *
 * A picture the *player* pointed at is theirs and shows at every account tier,
 * the way an uploaded portrait does — only the codex's own art is behind the
 * gate. `artOwn` is what a forged item sets to say which it is carrying.
 */
export function ItemIcon({ item, size = 40 }) {
  const color = rarityColor(item);
  const plate = useCodexArt()(
    item?.art_thumb ?? item?.art_url ?? null,
    item?.artOwn ? 'lore' : 'codex'
  );

  return (
    <span
      className={`item-icon${plate ? ' item-icon-art' : ''}`}
      style={{
        width: size,
        height: size,
        color,
        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
        // Stays under the picture as well as behind the glyph: it is what a
        // reader sees in the beat before the plate arrives, and a rarity-tinted
        // square is a better wait than an empty one.
        backgroundColor: `color-mix(in srgb, ${color} 12%, var(--bg-black))`,
        backgroundImage: plate ? `url("${plate}")` : undefined,
      }}
      aria-hidden="true"
    >
      {!plate && <SlotGlyph item={item} />}
    </span>
  );
}

/* -------------------------------------------------------------------- chips */

/** The item's tags as chips; the rarity tag carries the rarity's colour. */
export function ItemTags({ item }) {
  return (
    <span className="item-tags">
      {item.tags.map((tag) => {
        const color = RARITY_COLORS[tag] ?? null;
        return (
          <span
            key={tag}
            className="item-tag"
            style={
              color
                ? {
                    color,
                    borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                    backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                  }
                : undefined
            }
          >
            {tag}
          </span>
        );
      })}
    </span>
  );
}

/**
 * What a piece of gear *does*, in numbers, each in its stat's own colour. Only
 * non-zero values render — these chips are the single place a plain stat bonus
 * is stated, so the rules text never repeats them.
 *
 * What it *costs* is not here. Weight, coin and Magic Burden are true of every
 * item rather than of a kind of item, and they live together at the foot of the
 * row: see ItemCarry.
 *
 * A bag says what it *holds* in the same breath, since that is the only reason
 * anybody is reading its numbers at all.
 */
export function ItemStats({ item }) {
  const charges = itemCharges(item);
  const unit = useUnit();
  const capacity = Math.max(0, Number(item?.capacity) || 0);

  const values = [
    { label: 'Defense', value: item.defense, color: 'var(--focus-cyan)', signed: true },
    { label: 'Armor', value: item.armor, color: 'var(--stat-armor)', signed: true },
    {
      label: charges === 1 ? 'Use' : 'Uses',
      value: charges,
      color: 'var(--def-healing)',
      signed: false,
    },
    capacity > 0 && {
      key: 'holds',
      value: capacity,
      /* The one chip that is a whole phrase, because "35 Capacity" is a word
         nobody says and "holds 35 kg" is the question being asked. */
      text: `holds ${formatWeight(capacity, unit)}`,
      color: 'var(--stat-supply)',
    },
  ].filter((entry) => entry && (Number(entry.value) || 0) !== 0);

  if (values.length === 0) return null;

  return (
    <span className="item-values">
      {values.map(({ key, label, text, value, color, signed }) => (
        <span key={key ?? label} className="item-value" style={{ color }}>
          {text ? (
            text
          ) : (
            <>
              <span className="item-value-num">{signed && value > 0 ? `+${value}` : value}</span>
              {label}
            </>
          )}
        </span>
      ))}
    </span>
  );
}

/**
 * What carrying it costs: kilograms, coins and Magic Burden, in that order, on
 * the left of the row's foot.
 *
 * **The three of them belong together** (Jules, 2026-08-22). Burden used to sit
 * up among the stats, which put the three prices one thing charges you in two
 * different places and read as though Burden were a bonus. They are also the
 * other way round from a stat chip: `2.5 kg` is a number with its unit, where
 * `+2 Armor` is a number with the stat it moves.
 *
 * Each wears the colour of the meter it fills, not a colour of its own: the
 * carry meter's wood for weight, coin gold for the price, and for Burden the
 * lilac that is purple's type twin — the ground purple the bar is drawn in goes
 * muddy at this size, which is what --haze-lilac exists for.
 *
 * Weight is in whichever unit the reader chose. See units.js for why that comes
 * out of a context here and off a prop everywhere else.
 */
export function ItemCarry({ item }) {
  const unit = useUnit();
  const weight = itemWeight(item);
  const cost = itemCost(item);
  const burden = itemBurden(item);
  const load = weightParts(weight, unit);

  if (weight <= 0 && cost <= 0 && burden <= 0) return null;

  return (
    <span className="item-values item-carry">
      {weight > 0 && (
        <span className="item-value" style={{ color: 'var(--stat-supply)' }}>
          <span className="item-value-num">{load.value}</span>
          {load.unit}
        </span>
      )}
      {cost > 0 && (
        <span className="item-value" style={{ color: 'var(--stat-coin)' }}>
          <span className="item-value-num">{formatNumber(cost)}</span>¢
        </span>
      )}
      {burden > 0 && (
        <span className="item-value" style={{ color: 'var(--haze-lilac)' }}>
          <span className="item-value-num">{burden}</span>
          Burden
        </span>
      )}
    </span>
  );
}

/* ---------------------------------------------------------------- the foot */

/**
 * The foot of an item row: what it costs you on the left, what you can do with
 * it on the right.
 *
 * **Why the buttons came down here** (Jules, 2026-08-22). They used to float in
 * the row's top corner, which meant every row's first line had to hold a rail of
 * empty pixels clear of them — sixty pixels on most rows, eighty-eight on a belt
 * loop — and a name that ran long broke onto two lines to make room for two
 * buttons it had nothing to do with. On a line of their own they cost nothing
 * from the name, they line up down a column of rows, and the row reads in the
 * order somebody actually reads it in: what it is, what it does, what it costs
 * and what you can do about it.
 *
 * The foot is outside the row's own tap target, which is what it always was: a
 * button cannot hold a button.
 */
export function ItemFoot({ item, children }) {
  return (
    <div className="item-foot">
      <ItemCarry item={item} />
      {children ? <span className="item-acts">{children}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------- slot corner */

/**
 * The little round buttons every filled slot carries: the item's own page,
 * whatever that block adds of its own (the belt puts its codex here), and the
 * one that takes the item off.
 *
 * A fragment rather than a rail, because two blocks put these in two places: an
 * item row hands them to `ItemFoot`, and a belt loop hangs them off the end of
 * its own charge line. What buttons a slot has is one answer; where they sit is
 * the block's.
 *
 * Taking something off is never destruction — it goes to the inventory, which
 * is the only place a thing can actually be thrown away.
 */
export function SlotTools({ item, onInfo, onRemove, removeTitle = 'Send to your inventory', children }) {
  return (
    <>
      <button
        type="button"
        className="item-info-btn"
        onClick={onInfo}
        title={`${item.name} · details and lore`}
        aria-label={`${item.name} details`}
      >
        i
      </button>

      {children}

      {onRemove && (
        <button
          type="button"
          className="item-info-btn slot-remove-btn"
          onClick={onRemove}
          title={removeTitle}
          aria-label={`Take off ${item.name}`}
        >
          ↓
        </button>
      )}
    </>
  );
}

/* -------------------------------------------------------------- charge dots */

/**
 * What is left in a belt item: one dot per charge, lit while that use is still
 * there. Tapping the last lit dot spends it and tapping a spent one puts it
 * back — the same gesture as the Action Point pips, so a mis-tap costs
 * nothing.
 *
 * `onUse` is handed the new spent count. Read-only dots are a readout rather
 * than a control, so they are drawn as plain marks — which is also what lets
 * them sit inside a row that is itself a button.
 */
export function ChargeDots({ charges, used, onUse, readOnly = false }) {
  const remaining = charges - used;

  return (
    <span className="charge-dots" title={`${remaining} of ${charges} left`}>
      {Array.from({ length: charges }, (_, index) => {
        const lit = index < remaining;
        const className = `charge-dot${lit ? ' lit' : ''}${readOnly ? ' charge-dot-static' : ''}`;

        if (readOnly) {
          return <span key={index} className={className} aria-hidden="true" />;
        }

        return (
          <button
            key={index}
            type="button"
            className={className}
            // Tapping the last lit dot empties it; tapping a spent one refills
            // everything up to it.
            onClick={() => onUse(charges - (remaining === index + 1 ? index : index + 1))}
            title={lit ? 'Use this charge' : 'Put this charge back'}
            aria-label={`${index + 1} of ${charges} charges`}
          />
        );
      })}
    </span>
  );
}
