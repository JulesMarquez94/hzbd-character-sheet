/**
 * The item codex — every piece of gear the game knows about, plus the maths
 * for what a loadout of equipped items does to a character.
 *
 * Everything in the game is described by tags ("Common", "Head Gear",
 * "Magic Armor", …): the browser filters on them and future item types just
 * bring their own tags. Mechanical, always-on effects live in dedicated
 * fields (`defense`, `armor`, `burden`, `shieldCapBonus`); anything the table
 * resolves by hand stays as `effect` text.
 *
 * Weapons live in weapons.js — they are items like any other, they just also
 * teach two ability cards while they are held. Belt items live in utility.js
 * for the same reason: one card each, and charges the belt counts down.
 */

import { WEAPONS, itemEnchantments } from './weapons.js';
import { UTILITY_ITEMS } from './utility.js';

export const ARMOR_SLOTS = [
  { key: 'head', label: 'Head' },
  { key: 'torso', label: 'Torso' },
  { key: 'legs', label: 'Legs' },
];

/**
 * Two weapons, not two hands: a single item can already be a pair of pistols
 * or a shield-and-sword, so the slots are what you have drawn and what you
 * can switch to.
 */
export const WEAPON_SLOTS = [
  { key: 'main_hand', label: 'Primary' },
  { key: 'off_hand', label: 'Secondary' },
];

export const EQUIPMENT_SLOTS = [...ARMOR_SLOTS, ...WEAPON_SLOTS];

/**
 * The utility belt is not part of the equipment map — a loop remembers how
 * much of what it holds has been used, so it keeps its own entries on the
 * character row. Five loops is the whole belt; three of them start open.
 */
export const BELT_SLOT_KEY = 'belt';
export const BELT_MAX = 5;
export const BELT_DEFAULT = 3;

/** One key per slot; the value is an item id or null. */
export const EMPTY_EQUIPMENT = {
  head: null,
  torso: null,
  legs: null,
  main_hand: null,
  off_hand: null,
};

/**
 * A stored loadout may be missing, half-written, or carry slots that no
 * longer exist. Whatever comes in, this returns exactly the known slots.
 * Ids are kept as-is even when the codex doesn't know them (the codex may
 * simply be older than the save) — `getItem` guards every read anyway.
 */
export function normalizeEquipment(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!source || typeof source !== 'object') source = {};

  const equipment = {};
  for (const slot of Object.keys(EMPTY_EQUIPMENT)) {
    equipment[slot] = typeof source[slot] === 'string' ? source[slot] : null;
  }
  return equipment;
}

/**
 * The pack is a flat list of what is carried but not equipped. Most entries
 * are a bare codex id; the rest are things the codex has never heard of — see
 * `isCustomEntry`.
 */
export function normalizePack(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!Array.isArray(source)) return [];

  return source
    .map((entry, index) => {
      if (typeof entry === 'string') return entry;
      if (!entry || typeof entry !== 'object' || typeof entry.name !== 'string') return null;

      // A written thing is repaired rather than dropped: the id is what marks
      // it as one, and it has to be there for the block to key and edit it.
      const id = String(entry.id ?? '');
      return {
        id: id.startsWith(CUSTOM_PREFIX) ? id : `${CUSTOM_PREFIX}${index}`,
        name: entry.name,
        note: typeof entry.note === 'string' ? entry.note : '',
      };
    })
    .filter(Boolean);
}

/**
 * Not everything a character carries is in the codex: a scrap of paper with a
 * note on it, a stone worth keeping, a letter of introduction. Those are
 * written into the pack as their own entries — a name, a line about what it
 * is, and nothing mechanical at all.
 *
 * The id prefix is what tells one apart, since a codex item is an object with
 * a name too. No codex id may begin with it.
 */
const CUSTOM_PREFIX = 'custom-';

export function isCustomEntry(entry) {
  return Boolean(
    entry &&
      typeof entry === 'object' &&
      typeof entry.name === 'string' &&
      String(entry.id ?? '').startsWith(CUSTOM_PREFIX)
  );
}

export function newCustomId() {
  return `${CUSTOM_PREFIX}${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)}`;
}

/** Which shelf of the inventory a thing belongs on. */
export function itemCategory(item) {
  if (isCustomEntry(item)) return 'Notes & Oddments';

  const slots = item?.slots ?? [];
  if (slots.includes(BELT_SLOT_KEY)) return 'Belt Gear';
  if (WEAPON_SLOTS.some((slot) => slots.includes(slot.key))) return 'Weapons';
  if (ARMOR_SLOTS.some((slot) => slots.includes(slot.key))) return 'Armor';
  return 'Other';
}

/** Top to bottom, the order the inventory stacks its shelves in. */
export const CATEGORY_ORDER = ['Armor', 'Weapons', 'Belt Gear', 'Other', 'Notes & Oddments'];

/* -------------------------------------------------------------------- belt */

/**
 * The belt as the sheet reads it: always `BELT_MAX` places, each one either
 * empty or an entry of `{ id, used }`. A stored belt may be short, hold bare
 * ids from an older build, or carry a spend count the item can no longer
 * support — whatever comes in, this returns the five loops.
 */
export function normalizeBelt(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  const stored = Array.isArray(source) ? source : [];

  return Array.from({ length: BELT_MAX }, (_, index) => {
    const entry = stored[index];
    const id = typeof entry === 'string' ? entry : typeof entry?.id === 'string' ? entry.id : null;
    if (!id) return null;

    const charges = itemCharges(getItem(id));
    const used = Math.max(0, Math.floor(Number(entry?.used) || 0));
    return { id, used: Math.min(charges, used) };
  });
}

/** How many of the five loops are open to this character. */
export function beltSlotCount(character) {
  const open = Math.floor(Number(character?.belt_slots) || BELT_DEFAULT);
  return Math.min(BELT_MAX, Math.max(1, open));
}

/** How many uses an item holds; 0 when it never runs out. */
export function itemCharges(item) {
  return Math.max(0, Math.floor(Number(item?.charges) || 0));
}

/**
 * What a loop is holding, and how much of it is left. `remaining` is null for
 * something that never runs out; `spent` means there is nothing left to use —
 * which for a consumable is the end of it, and for a usable item only means
 * waiting for whatever fills it again.
 */
export function beltEntry(entry) {
  const item = getItem(entry?.id);
  if (!item) return null;

  const charges = itemCharges(item);
  const used = Math.min(charges, Math.max(0, Math.floor(Number(entry?.used) || 0)));

  return {
    item,
    charges,
    used,
    remaining: charges ? charges - used : null,
    spent: charges > 0 && used >= charges,
    consumable: item.use === 'consumable',
  };
}

/** A consumable with nothing left in it — the one thing the belt destroys. */
export function isUsedUp(entry) {
  const state = beltEntry(entry);
  return Boolean(state?.spent && state.consumable);
}

/* ------------------------------------------------------------------ rarity */

/**
 * An item's colour comes from its rarity tag — the icon tint, the slot edge
 * and the rarity chip all read from here.
 */
export const RARITY_COLORS = {
  Common: 'var(--rarity-common)',
  Uncommon: 'var(--rarity-uncommon)',
  Rare: 'var(--rarity-rare)',
  Epic: 'var(--rarity-epic)',
  Legendary: 'var(--rarity-legendary)',
};

/** The rarity named in the item's tags, defaulting to Common. */
export function itemRarity(item) {
  return item?.tags?.find((tag) => tag in RARITY_COLORS) ?? 'Common';
}

/** The colour that rarity paints the item with. */
export function rarityColor(item) {
  return RARITY_COLORS[itemRarity(item)] ?? RARITY_COLORS.Common;
}

/* ---------------------------------------------------------------- armor sets */

/**
 * Wearing all three armor pieces from one set wakes its bonus. `active` is
 * the short clause shown once the bonus is on; `bonus` is the full rules text
 * printed on each piece.
 */
export const ARMOR_SETS = {
  'Magic Armor': {
    bonus:
      'If all three armor slots are filled with Magic Armor, your Defense is based off your Grit.',
    active: 'Your Defense is based off your Grit.',
  },
  'Heavy Armor': {
    bonus:
      'If all three armor slots are filled with Heavy Armor, your Defense is increased by half your Armor.',
    active: 'Your Defense is increased by half your Armor.',
  },
  'Light Armor': {
    bonus:
      'If all three armor slots are filled with Light Armor, your Defense is equal to your Reflex.',
    active: 'Your Defense is equal to your Reflex.',
  },
};

/* --------------------------------------------------------------- the codex */

/**
 * Item fields:
 *   slots    — where it may be equipped
 *   defense  — flat bonus to Defense (how hard you are to hit)
 *   armor    — flat bonus to Armor (flat damage reduction)
 *   burden   — Magic Burden carried while equipped (capacity = Level + Mind + 10)
 *   effect   — rules text for anything beyond the numbers; plain stat bonuses
 *              live only in their field (the value chip already says "+2 Armor",
 *              so the card doesn't repeat it in words)
 *   shieldCapBonus — 'mind' raises the Shield cap by the wearer's Mind
 *
 * Every set runs three tiers, one piece per slot each: Common, Rare and
 * Epic. The names are the sheet’s own, so the tier is read off the name
 * (Chainmail → Half Plate → Full Plate, Runed → Greater → Supreme)
 * rather than out of a field of its own.
 */
const ARMOR_ITEMS = [
  /* ----- Runed set — cloth for casters, all about Shields ----- */
  {
    id: 'runed-hood',
    name: 'Runed Hood',
    slots: ['head'],
    tags: ['Common', 'Head Gear', 'Magic Armor'],
    set: 'Magic Armor',
    defense: 0,
    armor: 0,
    burden: 0,
    effect: 'When you enter combat, you start with a Shield equal to your Mind.',
    // The rider the sheet reads, so Start Combat can actually hand the Shield
    // over rather than leaving the player to notice the line and do it by
    // hand. Mechanics ride as data, exactly as `shieldCapBonus` and an
    // enchantment's `empower` do; the sentence above is what it reads like.
    onCombatStart: { shield: 'mind' },
  },
  {
    id: 'runed-robes',
    name: 'Runed Robes',
    slots: ['torso'],
    tags: ['Common', 'Torso Gear', 'Magic Armor'],
    set: 'Magic Armor',
    defense: 0,
    armor: 0,
    burden: 0,
    effect: 'When you enter combat, you start with a Shield equal to your Mind.',
    onCombatStart: { shield: 'mind' },
  },
  {
    id: 'runed-leggings',
    name: 'Runed Leggings',
    slots: ['legs'],
    tags: ['Common', 'Leg Gear', 'Magic Armor'],
    set: 'Magic Armor',
    defense: 0,
    armor: 0,
    burden: 0,
    effect: 'When you enter combat, you start with a Shield equal to your Mind.',
    onCombatStart: { shield: 'mind' },
  },
  {
    id: 'greater-runed-hood',
    name: 'Greater Runed Hood',
    slots: ['head'],
    tags: ['Rare', 'Head Gear', 'Magic Armor'],
    set: 'Magic Armor',
    defense: 0,
    armor: 0,
    burden: 0,
    effect: 'When you enter combat, you start with a Shield equal to 2 times your Mind.',
    onCombatStart: { shield: 'mind', times: 2 },
  },
  {
    id: 'greater-runed-robes',
    name: 'Greater Runed Robes',
    slots: ['torso'],
    tags: ['Rare', 'Torso Gear', 'Magic Armor'],
    set: 'Magic Armor',
    defense: 0,
    armor: 0,
    burden: 0,
    effect: 'When you enter combat, you start with a Shield equal to 2 times your Mind.',
    onCombatStart: { shield: 'mind', times: 2 },
  },
  {
    id: 'greater-runed-leggings',
    name: 'Greater Runed Leggings',
    slots: ['legs'],
    tags: ['Rare', 'Leg Gear', 'Magic Armor'],
    set: 'Magic Armor',
    defense: 0,
    armor: 0,
    burden: 0,
    effect: 'When you enter combat, you start with a Shield equal to 2 times your Mind.',
    onCombatStart: { shield: 'mind', times: 2 },
  },
  {
    id: 'supreme-runed-hood',
    name: 'Supreme Runed Hood',
    slots: ['head'],
    tags: ['Epic', 'Head Gear', 'Magic Armor'],
    set: 'Magic Armor',
    defense: 0,
    armor: 0,
    burden: 0,
    effect:
      'When you enter combat, you start with a Shield equal to 3 times your Mind. Increases maximum Shield.',
    onCombatStart: { shield: 'mind', times: 3 },
    shieldCapBonus: 'mind',
  },
  {
    id: 'supreme-runed-robes',
    name: 'Supreme Runed Robes',
    slots: ['torso'],
    tags: ['Epic', 'Torso Gear', 'Magic Armor'],
    set: 'Magic Armor',
    defense: 0,
    armor: 0,
    burden: 0,
    effect:
      'When you enter combat, you start with a Shield equal to 3 times your Mind. Increases maximum Shield.',
    onCombatStart: { shield: 'mind', times: 3 },
    shieldCapBonus: 'mind',
  },
  {
    id: 'supreme-runed-leggings',
    name: 'Supreme Runed Leggings',
    slots: ['legs'],
    tags: ['Epic', 'Leg Gear', 'Magic Armor'],
    set: 'Magic Armor',
    defense: 0,
    armor: 0,
    burden: 0,
    effect:
      'When you enter combat, you start with a Shield equal to 3 times your Mind. Increases maximum Shield.',
    onCombatStart: { shield: 'mind', times: 3 },
    shieldCapBonus: 'mind',
  },

  /* ----- Plate set — heavy armor, all flat damage reduction ----- */
  {
    id: 'chainmail-coif',
    name: 'Chainmail Coif',
    slots: ['head'],
    tags: ['Common', 'Head Gear', 'Heavy Armor'],
    set: 'Heavy Armor',
    defense: 0,
    armor: 3,
    burden: 0,
  },
  {
    id: 'chainmail-hauberk',
    name: 'Chainmail Hauberk',
    slots: ['torso'],
    tags: ['Common', 'Torso Gear', 'Heavy Armor'],
    set: 'Heavy Armor',
    defense: 0,
    armor: 3,
    burden: 0,
  },
  {
    id: 'chainmail-chausses',
    name: 'Chainmail Chausses',
    slots: ['legs'],
    tags: ['Common', 'Leg Gear', 'Heavy Armor'],
    set: 'Heavy Armor',
    defense: 0,
    armor: 3,
    burden: 0,
  },
  {
    id: 'half-plate-helm',
    name: 'Half Plate Helm',
    slots: ['head'],
    tags: ['Rare', 'Head Gear', 'Heavy Armor'],
    set: 'Heavy Armor',
    defense: 0,
    armor: 4,
    burden: 0,
  },
  {
    id: 'half-plate-cuirass',
    name: 'Half Plate Cuirass',
    slots: ['torso'],
    tags: ['Rare', 'Torso Gear', 'Heavy Armor'],
    set: 'Heavy Armor',
    defense: 0,
    armor: 4,
    burden: 0,
  },
  {
    id: 'half-plate-greaves',
    name: 'Half Plate Greaves',
    slots: ['legs'],
    tags: ['Rare', 'Leg Gear', 'Heavy Armor'],
    set: 'Heavy Armor',
    defense: 0,
    armor: 4,
    burden: 0,
  },
  {
    id: 'full-plate-helm',
    name: 'Full Plate Helm',
    slots: ['head'],
    tags: ['Epic', 'Head Gear', 'Heavy Armor'],
    set: 'Heavy Armor',
    defense: 0,
    armor: 5,
    burden: 0,
  },
  {
    id: 'full-plate-cuirass',
    name: 'Full Plate Cuirass',
    slots: ['torso'],
    tags: ['Epic', 'Torso Gear', 'Heavy Armor'],
    set: 'Heavy Armor',
    defense: 0,
    armor: 5,
    burden: 0,
  },
  {
    id: 'full-plate-pants',
    name: 'Full Plate Pants',
    slots: ['legs'],
    tags: ['Epic', 'Leg Gear', 'Heavy Armor'],
    set: 'Heavy Armor',
    defense: 0,
    armor: 5,
    burden: 0,
  },

  /* ----- Leather set — light armor, all about not being hit -----
   *
   * `leather-vest` and `leather-pants` keep their old ids under the sheet's
   * new names. Same slot, same set, same rarity, same +1 Defense: it is the
   * same piece renamed, and an id is what a saved character points at. Same
   * call as `sharpen-sense`. */
  {
    id: 'leather-helm',
    name: 'Leather Helm',
    slots: ['head'],
    tags: ['Common', 'Head Gear', 'Light Armor'],
    set: 'Light Armor',
    defense: 1,
    armor: 0,
    burden: 0,
  },
  {
    id: 'leather-vest',
    name: 'Leather Tunic',
    slots: ['torso'],
    tags: ['Common', 'Torso Gear', 'Light Armor'],
    set: 'Light Armor',
    defense: 1,
    armor: 0,
    burden: 0,
  },
  {
    id: 'leather-pants',
    name: 'Leather Breeches',
    slots: ['legs'],
    tags: ['Common', 'Leg Gear', 'Light Armor'],
    set: 'Light Armor',
    defense: 1,
    armor: 0,
    burden: 0,
  },
];

/** The whole codex: what you wear, what you hold, and what is on your belt. */
export const ITEMS = [...ARMOR_ITEMS, ...WEAPONS, ...UTILITY_ITEMS];

const ITEMS_BY_ID = new Map(ITEMS.map((item) => [item.id, item]));

export function getItem(id) {
  return id ? ITEMS_BY_ID.get(id) ?? null : null;
}

export function itemsForSlot(slotKey) {
  return ITEMS.filter((item) => item.slots.includes(slotKey));
}

/* ------------------------------------------------------- outfitting a kit */

/**
 * The three pieces of one armor set, keyed by slot. A starting kit hands out a
 * whole set at once, so this is what turns "Light Armor" into the three ids
 * that make it.
 *
 * Common only, the same law `startingWeapons` reads by: a set now runs three
 * tiers and the kit is written as "one full Common set". Without the rarity
 * filter this would hand out whichever tier happened to be listed first.
 */
export function armorSetPieces(setName, rarity = 'Common') {
  const pieces = {};
  for (const { key } of ARMOR_SLOTS) {
    const piece = ARMOR_ITEMS.find(
      (item) =>
        item.set === setName && item.slots.includes(key) && itemRarity(item) === rarity
    );
    if (piece) pieces[key] = piece.id;
  }
  return pieces;
}

/**
 * Every set a character can be outfitted in — name, its three pieces, and the
 * bonus wearing all three wakes. A set missing a piece is left out rather than
 * offered as a kit that cannot be filled.
 */
export function armorSetOptions() {
  return Object.keys(ARMOR_SETS)
    .map((name) => ({ name, pieces: armorSetPieces(name), ...ARMOR_SETS[name] }))
    .filter((option) => ARMOR_SLOTS.every(({ key }) => option.pieces[key]));
}

/**
 * The weapons a starting kit may hand out: Common, unenchanted, and not something
 * you were born with — Claws & Teeth is nobody's issued gear. Worked magic is
 * found or bought, never handed over at level 1.
 */
export function startingWeapons() {
  return WEAPONS.filter(
    (weapon) => itemRarity(weapon) === 'Common' && !(weapon.enchants?.length > 0) && !weapon.natural
  );
}


/* ------------------------------------------------------------- magic burden */

/** How much worn magic a character can carry: Level + Mind + 10. */
export function magicBurdenMax({ level, mind }) {
  return Math.floor((Number(level) || 1) + (Number(mind) || 0) + 10);
}

/**
 * What one item weighs on the Magic Burden meter: its own burden plus every
 * enchantment laid on it. A plain weapon carries none at all; a blade with
 * three workings on it carries all three.
 */
export function itemBurden(item) {
  if (!item) return 0;
  return itemEnchantments(item).reduce(
    (total, { enchantment }) => total + (Number(enchantment.burden) || 0),
    Number(item.burden) || 0
  );
}

/**
 * The summed burden of the whole loadout — worn, held, and clipped to the
 * belt. Worked magic weighs the same wherever it is carried.
 */
export function magicBurdenUsed(equipment, belt = []) {
  const worn = normalizeEquipment(equipment);
  let total = 0;
  for (const slot of Object.keys(worn)) {
    total += itemBurden(getItem(worn[slot]));
  }
  for (const entry of normalizeBelt(belt)) {
    total += itemBurden(getItem(entry?.id));
  }
  return total;
}

/* -------------------------------------------------------- equipment effects */

/** The set name if all three armor slots wear it, else null. */
export function armorSetName(equipment) {
  const worn = normalizeEquipment(equipment);
  const pieces = ARMOR_SLOTS.map(({ key }) => getItem(worn[key]));
  if (pieces.some((item) => !item?.set)) return null;
  const [first] = pieces;
  return pieces.every((item) => item.set === first.set) ? first.set : null;
}

/**
 * Every always-on modifier the current loadout applies, in one bag. The
 * derived-stat maths in characterModel reads this — nothing else should need
 * to walk the slots by hand.
 */
export function equipmentEffects(equipment) {
  const worn = normalizeEquipment(equipment);
  const items = Object.keys(worn)
    .map((slot) => getItem(worn[slot]))
    .filter(Boolean);

  return {
    /** Flat additions to Defense from individual pieces. */
    defenseFlat: items.reduce((sum, item) => sum + (Number(item.defense) || 0), 0),
    /** Armor is gear-only, so this IS the character's Armor stat. */
    armorTotal: items.reduce((sum, item) => sum + (Number(item.armor) || 0), 0),
    /** True while something worn raises the Shield cap by Mind. */
    shieldCapMind: items.some((item) => item.shieldCapBonus === 'mind'),
    burden: items.reduce((sum, item) => sum + itemBurden(item), 0),
    fullSet: armorSetName(worn),
  };
}

/**
 * What worn gear hands over the moment a fight starts.
 *
 * Separate from `equipmentEffects` above because those are always-on modifiers
 * the derived stats read on every render, and these fire exactly once, when
 * Start Combat is pressed. An item declares it with an `onCombatStart` rider
 * naming the attribute the value comes from, and how many of it: `{ shield:
 * 'mind' }` is the Runed Hood's "a Shield equal to your Mind", `{ shield:
 * 'mind', times: 2 }` the Greater Runed Hood's "2 times your Mind".
 *
 * Returns what each piece gives and why, so the block can name the item that
 * did it rather than silently moving a number.
 */
export function combatStartEffects(character) {
  const worn = normalizeEquipment(character?.equipment);

  return Object.keys(worn)
    .map((slot) => getItem(worn[slot]))
    .filter((item) => item?.onCombatStart)
    .map((item) => {
      const from = item.onCombatStart.shield;
      const times = Math.max(1, Math.floor(Number(item.onCombatStart.times) || 1));
      const value = Math.max(0, Math.floor(Number(character?.[from]) || 0)) * times;
      return { item, shield: value, from, times };
    })
    .filter((entry) => entry.shield > 0);
}

/* ------------------------------------------------------------- the overview */

/**
 * What the Inventory tab says about itself before you have read a single slot:
 * how much is on this character, and where it is sitting.
 *
 * The tallies are `filled / of` because three of the four places have a
 * ceiling — three armor slots, two hands, however many loops are open — and
 * the pack, which has none, is the one that reports a bare count. Burden rides
 * along because it is the only number here that can be *wrong*: the meter in
 * the armor block is the readout, this is the alarm you can see from the pack.
 */
export function inventoryOverview(character) {
  const equipment = normalizeEquipment(character?.equipment);
  const belt = normalizeBelt(character?.belt);
  const pack = normalizePack(character?.pack);
  const loops = beltSlotCount(character);

  const filled = (keys) => keys.filter((key) => equipment[key]).length;

  const tallies = [
    { id: 'worn', label: 'Worn', filled: filled(ARMOR_SLOTS.map((s) => s.key)), of: ARMOR_SLOTS.length },
    { id: 'hand', label: 'In Hand', filled: filled(WEAPON_SLOTS.map((s) => s.key)), of: WEAPON_SLOTS.length },
    { id: 'belt', label: 'On Belt', filled: belt.filter((entry, i) => i < loops && entry).length, of: loops },
    { id: 'pack', label: 'In Pack', filled: pack.length, of: null },
  ];

  const used = magicBurdenUsed(equipment, belt);
  const max = magicBurdenMax(character ?? {});

  return {
    tallies,
    /** Everything on the character, equipped and carried alike. */
    total: tallies.reduce((sum, tally) => sum + tally.filled, 0),
    burden: { used, max, over: Math.max(0, used - max) },
  };
}

/**
 * Every tag carried by something in the pack, as the filter row wants them.
 *
 * Rarity is its own kind so that picking Common and Rare widens ("either")
 * while picking Common and Head Gear narrows — the same law the Abilities tab
 * filters by. A written-in thing carries no tags and so answers no chip.
 */
export function packTags(pack) {
  const seen = new Map();
  for (const entry of pack) {
    const item = isCustomEntry(entry) ? null : getItem(entry);
    for (const tag of item?.tags ?? []) {
      if (!seen.has(tag)) seen.set(tag, { id: tag, label: tag, kind: tag in RARITY_COLORS ? 'rarity' : 'kind' });
    }
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
}
