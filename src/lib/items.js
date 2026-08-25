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
 * Trinkets live in trinkets.js, and are the opposite kind of shelf: twelve
 * pieces of jewellery with no numbers at all, there to hold a working.
 *
 * ------------------------------------------------------------------- the forge
 * An id in an equipment slot is usually a codex id. It may also be a **forged**
 * id — a piece the player made, whose record lives on their own sheet (see
 * forged.js). `heldItem` is the one place either kind becomes an item, so nothing
 * downstream had to learn that there are two kinds.
 */

import { WEAPONS, itemEnchantments, itemModifiers } from './weapons.js';
import { allGrants, damageEnchants, grantSources, laidEntries } from './enchanting.js';
import { forgedItem, forgedRecord, isForgedId, normalizeForged } from './forged.js';
import { BAG_ITEMS } from './bags.js';
import { compareTags } from './cardOrder.js';
import { TRINKET_ITEMS } from './trinkets.js';
import { UTILITY_ITEMS } from './utility.js';
import { withArt } from './itemArt.js';

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

/**
 * The stowed one. Named because two places have to leave it out of a sum: a
 * shielded weapon is only worth its Armor while it is the weapon in your hand.
 * See `heldItems` below and `placesOf` in statMath.js.
 */
export const OFF_HAND_SLOT_KEY = 'off_hand';

/**
 * The bag, and the reason it *is* in the equipment map where the belt and the
 * trinkets are not: there is one of it, and it is one place. That is the whole
 * of what the map is for.
 *
 * It is the only slot on the sheet that changes nothing about a fight. What it
 * changes is the ceiling every other item is weighed against, which is why it
 * sits above the blocks on the Inventory tab rather than inside one of them.
 */
export const BAG_SLOT_KEY = 'bag';
export const BAG_SLOTS = [{ key: BAG_SLOT_KEY, label: 'Bag' }];

export const EQUIPMENT_SLOTS = [...ARMOR_SLOTS, ...WEAPON_SLOTS, ...BAG_SLOTS];

/**
 * The utility belt is not part of the equipment map — a loop remembers how
 * much of what it holds has been used, so it keeps its own entries on the
 * character row. Five loops is the whole belt; three of them start open.
 */
export const BELT_SLOT_KEY = 'belt';
export const BELT_MAX = 5;
export const BELT_DEFAULT = 3;

/**
 * Trinkets are not in the equipment map either, and for the opposite reason to
 * the belt's. The belt is out because a loop *remembers* something; trinkets are
 * out because there is no number of them. The map has one key per place and a
 * fixed set of keys — a character wearing nine rings is wearing nine rings, so
 * they live in their own column as a plain list, the way the pack does.
 *
 * A trinket is worn: it counts against Magic Burden, and whatever is worked into
 * it is on the person wearing it. See `wornItems`.
 */
export const TRINKET_SLOT_KEY = 'trinket';

/** One key per slot; the value is an item id or null. */
export const EMPTY_EQUIPMENT = {
  head: null,
  torso: null,
  legs: null,
  main_hand: null,
  off_hand: null,
  bag: null,
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
  if (slots.includes(TRINKET_SLOT_KEY)) return 'Trinkets';
  if (slots.includes(BAG_SLOT_KEY)) return 'Bags';
  if (WEAPON_SLOTS.some((slot) => slots.includes(slot.key))) return 'Weapons';
  if (ARMOR_SLOTS.some((slot) => slots.includes(slot.key))) return 'Armor';
  return 'Other';
}

/** Top to bottom, the order the inventory stacks its shelves in. */
export const CATEGORY_ORDER = [
  'Armor',
  'Weapons',
  'Trinkets',
  'Belt Gear',
  'Bags',
  'Other',
  'Notes & Oddments',
];

/* ---------------------------------------------------------------- trinkets */

/**
 * The trinkets a character is wearing, as the sheet reads them: a plain list of
 * ids with no ceiling and no empty places in it. A stored list may hold nulls
 * from a half-written save or ids the codex no longer knows; the nulls go and
 * the unknown ids stay, because `heldItem` guards every read anyway and a save
 * may simply be newer than this build.
 *
 * No cap. The pack has none either, for the same reason: there is no number of
 * things a character may own.
 */
export function normalizeTrinkets(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!Array.isArray(source)) return [];

  return source.map((entry) => (typeof entry === 'string' ? entry : null)).filter(Boolean);
}

/* ------------------------------------------------------------------ the forge */

/**
 * Every id this character's sheet points at, wherever it sits. The one answer to
 * "does anything still refer to this?".
 *
 * `next` is whatever a write is about to change, so the question can be asked of
 * the sheet as it will be rather than as it was — the only useful moment to ask
 * it is while throwing something away.
 */
function heldIds(character, next = {}) {
  const equipment = normalizeEquipment(next.equipment ?? character?.equipment);
  const pack = normalizePack(next.pack ?? character?.pack);
  const belt = normalizeBelt(next.belt ?? character?.belt);
  const trinkets = normalizeTrinkets(next.trinkets ?? character?.trinkets);

  return new Set([
    ...Object.values(equipment).filter(Boolean),
    ...pack.filter((entry) => typeof entry === 'string'),
    ...belt.map((entry) => entry?.id).filter(Boolean),
    ...trinkets,
  ]);
}

/**
 * The forged registry with every record nothing points at any more taken out.
 *
 * A forged record is the *identity* of one thing, so it has to die with that
 * thing: throwing a ring away and leaving its record behind would grow the column
 * forever and leave a Long Rest offering to enchant a ring nobody owns. Ids are
 * never reused, so a pruned record can never come back by accident.
 *
 * Hands back null when nothing needs pruning, so the common write carries no
 * `forged` key at all and a sheet with no forged items never writes the column.
 */
export function pruneForged(character, next = {}) {
  const forged = normalizeForged(character?.forged);
  const ids = Object.keys(forged);
  if (ids.length === 0) return null;

  const kept = heldIds(character, next);
  if (ids.every((id) => kept.has(id))) return null;

  const out = {};
  for (const id of ids) {
    if (kept.has(id)) out[id] = forged[id];
  }
  return out;
}

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
 *
 * It takes the character so a forged flask resolves. Without it, a piece the
 * player made and clipped on read as *nothing in the loop* — the id was in the
 * belt and the block drew an empty slot over it, which is the one shape of bug
 * that loses a thing without ever saying so.
 */
export function beltEntry(character, entry) {
  const item = heldItem(character, entry?.id);
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
export function isUsedUp(character, entry) {
  const state = beltEntry(character, entry);
  return Boolean(state?.spent && state.consumable);
}

/* --------------------------------------------------------- what fills again
 *
 * A usable item names what brings its charges back in prose, because that is
 * what the card prints: the Druidic Tome "has nothing more to say until you have
 * taken a Long Rest", and the codex entry says `recharge: 'Long Rest'`.
 *
 * The sheet has two boundaries and no clock, so that prose is read back to one
 * of them. Anything it cannot be read back to is filled at the table rather than
 * here, and returns null: a rest must never quietly refill a thing whose refill
 * it is not.
 */
export function rechargeRest(item) {
  const said = String(item?.recharge ?? '');
  if (/long/i.test(said)) return 'long';
  if (/short/i.test(said)) return 'short';
  return null;
}

/**
 * What a rest gives the belt back.
 *
 * The one place on the sheet where a spent use is written down is a belt loop's
 * `used` count, so the one place a use comes back is here. Nobody should have to
 * remember to tap the dot back on: the tome that has answered is spent until a
 * Long Rest, and a Long Rest is already a button.
 *
 * `ends` is the same list the rest closes its effects against, which gets the
 * law right in both directions for free — a long rest fills a short-rest item
 * because it does everything a short rest does, and a short rest leaves a
 * long-rest item cold.
 *
 * A consumable is never filled, whatever it says: its charges are the thing
 * itself, and spending the last one destroys it.
 *
 * Null when a rest owes the belt nothing, so a belt with nothing spent out of it
 * is never written and never printed.
 */
export function beltRest(character, ends = []) {
  const belt = normalizeBelt(character?.belt);
  const next = [...belt];
  const lines = [];

  belt.forEach((entry, index) => {
    if (!entry?.used) return;

    const state = beltEntry(character, entry);
    if (!state || state.consumable) return;

    const fills = rechargeRest(state.item);
    if (!fills || !ends.includes(fills)) return;

    next[index] = { ...entry, used: 0 };
    lines.push({
      key: `belt-${index}-${entry.id}`,
      label:
        state.charges === 1
          ? `${state.item.name} comes back`
          : `${state.item.name}: ${state.used} of ${state.charges} back`,
      detail: `It was spent. A ${state.item.recharge} is what fills it.`,
      tone: 'gain',
    });
  });

  return lines.length > 0 ? { patch: { belt: next }, lines } : null;
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
 *   weight   — kilograms, counted wherever the thing is: worn, in hand, on a
 *              loop or in the pack. See `carriedWeight`
 *   cost     — what it is worth in coin, before anything worked into it. See
 *              `itemCost`
 *   effect   — rules text for anything beyond the numbers; plain stat bonuses
 *              live only in their field (the value chip already says "+2 Armor",
 *              so the card doesn't repeat it in words)
 *   shieldCapBonus — 'mind' raises the Shield cap by the wearer's Mind
 *
 * Every set runs three tiers, one piece per slot each: Common, Rare and
 * Epic. The names are the sheet’s own, so the tier is read off the name
 * (Chainmail → Half Plate → Full Plate, Runed → Greater → Supreme,
 * Leather → Studded Leather → Scale) rather than out of a field of its own.
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
    weight: 0.5,
    cost: 3000,
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
    weight: 2,
    cost: 3000,
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
    weight: 1,
    cost: 3000,
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
    weight: 0.5,
    cost: 7000,
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
    weight: 2,
    cost: 7000,
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
    weight: 1,
    cost: 7000,
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
    weight: 0.5,
    cost: 12000,
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
    weight: 2,
    cost: 12000,
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
    weight: 1,
    cost: 12000,
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
    weight: 2.5,
    cost: 3000,
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
    weight: 11,
    cost: 3000,
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
    weight: 6,
    cost: 3000,
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
    weight: 3,
    cost: 7000,
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
    weight: 14,
    cost: 7000,
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
    weight: 8,
    cost: 7000,
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
    weight: 4,
    cost: 12000,
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
    weight: 18,
    cost: 12000,
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
    weight: 10,
    cost: 12000,
  },

  /* ----- Light armor — all about not being hit -----
   *
   * Leather → Studded Leather → Scale. The Common tier buys Defense alone;
   * the two above it keep that +1 and add Armor on top, so a Light wearer
   * climbing tiers stops being purely evasive without ever becoming Heavy.
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
    weight: 1,
    cost: 3000,
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
    weight: 4,
    cost: 3000,
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
    weight: 2.5,
    cost: 3000,
  },
  {
    id: 'studded-leather-helm',
    name: 'Studded Leather Helm',
    slots: ['head'],
    tags: ['Rare', 'Head Gear', 'Light Armor'],
    set: 'Light Armor',
    defense: 1,
    armor: 1,
    burden: 0,
    weight: 1.5,
    cost: 7000,
  },
  {
    id: 'studded-leather-tunic',
    name: 'Studded Leather Tunic',
    slots: ['torso'],
    tags: ['Rare', 'Torso Gear', 'Light Armor'],
    set: 'Light Armor',
    defense: 1,
    armor: 1,
    burden: 0,
    weight: 6,
    cost: 7000,
  },
  {
    id: 'studded-leather-breeches',
    name: 'Studded Leather Breeches',
    slots: ['legs'],
    tags: ['Rare', 'Leg Gear', 'Light Armor'],
    set: 'Light Armor',
    defense: 1,
    armor: 1,
    burden: 0,
    weight: 3.5,
    cost: 7000,
  },
  {
    id: 'scale-helm',
    name: 'Scale Helm',
    slots: ['head'],
    tags: ['Epic', 'Head Gear', 'Light Armor'],
    set: 'Light Armor',
    defense: 1,
    armor: 2,
    burden: 0,
    weight: 2,
    cost: 12000,
  },
  /* The sheet's own name for the torso piece — the set is Scale, and the
     chest of it is "Scale Armor" where the other two say what they cover. */
  {
    id: 'scale-armor',
    name: 'Scale Armor',
    slots: ['torso'],
    tags: ['Epic', 'Torso Gear', 'Light Armor'],
    set: 'Light Armor',
    defense: 1,
    armor: 2,
    burden: 0,
    weight: 9,
    cost: 12000,
  },
  {
    id: 'scale-leggings',
    name: 'Scale Leggings',
    slots: ['legs'],
    tags: ['Epic', 'Leg Gear', 'Light Armor'],
    set: 'Light Armor',
    defense: 1,
    armor: 2,
    burden: 0,
    weight: 5,
    cost: 12000,
  },
];

/**
 * The whole codex: what you wear, what you hold, and what is on your belt.
 *
 * Wrapped in `withArt` here rather than around `ARMOR_ITEMS` alone, so a
 * weapon or a potion picks its picture up the day its folder lands in `data/`
 * with no further change — `art_url` and `art_thumb` are simply null until
 * then. Everything downstream reads items through `getItem`, so this is the
 * one place the pictures have to be attached.
 */
export const ITEMS = withArt([
  ...ARMOR_ITEMS,
  ...WEAPONS,
  ...TRINKET_ITEMS,
  ...UTILITY_ITEMS,
  ...BAG_ITEMS,
]);

const ITEMS_BY_ID = new Map(ITEMS.map((item) => [item.id, item]));

export function getItem(id) {
  return id ? ITEMS_BY_ID.get(id) ?? null : null;
}

/**
 * An item as *this character* actually carries it: the codex piece, plus every
 * enchantment they have laid on it themselves.
 *
 * The codex owns what a longsword is. An Enchanter's work on their own longsword
 * is theirs, so it is stored on their sheet (see `laid` in enchanting.js) and
 * merged in here. Everything downstream is already written against
 * `item.enchants` — the damage type and Empowering the weapon block prints, the
 * spell an item teaches, the Magic Burden meter — so merging at the one place
 * items are resolved is the whole change. Nothing had to be taught what an
 * Enchanter is.
 *
 * Hands back the codex item itself when nothing has been laid, so the common case
 * allocates nothing and every identity check downstream still holds.
 *
 * ------------------------------------------------------- and the ones they made
 * **This is the one place a forged id becomes an item.** A piece the player made
 * at the forge is not in the codex at all: its id is minted on their sheet and
 * its record says which codex piece it is made from and what was worked into it
 * (see forged.js). Resolved here, and here only, so every block, browser, meter
 * and quick-bar row already knows what one is.
 *
 * A forged id is what lifted the old limit. `laid` is still keyed by item id, but
 * a forged id *is* an instance, so two silver rings with different work in them
 * are two different rings — and laying a working on one of them lays it on that
 * one. Two of the same **codex** piece are still one piece to `laid`, which is
 * the honest reading of a record keyed by id.
 */
export function heldItem(character, id) {
  const item = forgedFor(character, id) ?? getItem(id);
  if (!item || !character) return item;

  const laid = laidEntries(character, id);
  if (laid.length === 0) return item;

  return { ...item, enchants: [...(item.enchants ?? []), ...laid] };
}

/**
 * Everything this character has made, as items, for one slot.
 *
 * The codex browser answers "what could go here?", and a ring the player forged
 * could very much go there. Without this the browser could not offer one at all:
 * it lists the codex, and a forged piece is on the sheet rather than in the
 * codex — so the piece somebody had just made was the one thing the window that
 * made it could not then put on.
 *
 * Slotted off the *base*, because that is where a forged item's slots come from.
 * Hand it a key nothing is slotted for — `pack`, say — and this is empty, which
 * is what keeps the inventory's own browser a list of the codex.
 */
export function forgedForSlot(character, slotKey) {
  return Object.keys(normalizeForged(character?.forged))
    .map((id) => heldItem(character, id))
    .filter((item) => item?.slots?.includes(slotKey));
}

/**
 * Where on this character an id already sits, said in two words, or null when
 * nothing on them holds it.
 *
 * **This is what keeps an instance in one place.** A codex id may repeat as often
 * as the player owns copies — three healing potions are three ids. A forged id is
 * one *thing*: the same id in two trinket places, or in a hand and on a loop at
 * once, would be two rows that are secretly one ring, and taking one off would
 * take the other with it.
 *
 * The pack is deliberately not a placement. That is where a thing waits to be
 * put somewhere, so a piece in the pack is available and a piece on the body is
 * not.
 */
export function placementOf(character, id) {
  if (!id) return null;

  const worn = normalizeEquipment(character?.equipment);
  for (const slot of EQUIPMENT_SLOTS) {
    if (worn[slot.key] === id) return slot.label;
  }
  if (normalizeTrinkets(character?.trinkets).includes(id)) return 'a trinket';

  const loop = normalizeBelt(character?.belt).findIndex((entry) => entry?.id === id);
  return loop >= 0 ? `belt loop ${loop + 1}` : null;
}

/** A forged id as the item it describes, or null for everything else. */
function forgedFor(character, id) {
  if (!character || !isForgedId(id)) return null;
  const record = forgedRecord(character, id);
  return record ? forgedItem(record, getItem(record.base)) : null;
}

/**
 * Every item on this character's person: what is worn, what is in hand, the bag
 * on their back, and every trinket. The one answer to "what is actually on you",
 * so nothing has to walk the slots and then remember the trinkets as an
 * afterthought.
 *
 * **Not the belt, and not the pack.** This is what an item's *own* numbers hang
 * off — a breastplate's Defense, a Runed Hood's Shield at the bell — and those
 * are true of a thing you are wearing rather than a thing you own. What is
 * worked into a loop is a different question and has a different answer now:
 * see `carriedItems`.
 *
 * `heldItem`, so a forged piece and an Enchanter's own laid work both count.
 */
export function wornItems(character) {
  return borneItems(character, { stowed: true });
}

/**
 * The same walk with the secondary weapon left out: everything on this character
 * that is actually *in play*.
 *
 * The three shielded weapons are the reason this exists. A shield is worth 3
 * Armor and 1 Defense (2026-08-24, Jules: "The shield give 3 Armor and 1 Defense,
 * that is their special is a passive"), and those numbers live on the item the
 * way a breastplate's do. But a weapon in the secondary slot is stowed, not held,
 * which is the whole point of Swap Weapons costing Action Points: a shield on
 * your back stops nothing, and two shielded weapons carried at once would
 * otherwise have been worth 6 Armor.
 *
 * Only the two stats a piece has to be in your hand to be worth read this. Weight
 * and Magic Burden are what a thing costs to carry and both hands carry.
 */
export function heldItems(character) {
  return borneItems(character, { stowed: false });
}

/** The shared walk. `stowed` keeps the secondary weapon in it. */
function borneItems(character, { stowed }) {
  const worn = normalizeEquipment(character?.equipment);
  const keys = EQUIPMENT_SLOTS.map(({ key }) => key).filter(
    (key) => stowed || key !== OFF_HAND_SLOT_KEY
  );

  return [...keys.map((key) => worn[key]), ...normalizeTrinkets(character?.trinkets)]
    .map((id) => heldItem(character, id))
    .filter(Boolean);
}

/**
 * Everything on this character, loops included: worn, in hand, on a trinket, and
 * clipped to the belt.
 *
 * **This is what an enchantment counts from** (2026-08-21, Jules: "items that go
 * on the belt should be able to be enchanted"). The belt used to be left out of
 * the sum, which made a working laid on a flask the one enchantment on the sheet
 * that cost 70 Supplies a point and 4 Magic Burden to carry and then did nothing
 * at all. The meter had already settled the principle — worked magic weighs the
 * same wherever it is carried — and effect follows weight: a Vitality worked into
 * the potion on your hip is 20 Health whether the potion is in your hand or on
 * your belt.
 *
 * **Still not the pack.** What is in the pack is not on you, which is the line
 * that moved rather than the line that went.
 *
 * Every loop, not only the open ones, the same as `magicBurdenUsed`: a save whose
 * `belt_slots` came down still has an item stored in the loop it lost, and it
 * would be the one place a working weighed without working.
 */
export function carriedItems(character) {
  return [
    ...wornItems(character),
    ...normalizeBelt(character?.belt)
      .map((entry) => heldItem(character, entry?.id))
      .filter(Boolean),
  ];
}

/**
 * Every enchantment worked into something on this character, by id.
 *
 * This is the half of the stacking sum that `enchanting.js` cannot reach: it is a
 * leaf and does not know what a codex item is, let alone what is equipped. So the
 * ids are collected here and handed to it — see `characterGrants` below.
 *
 * Duplicates are left in. Deduplication is one rule and it belongs in one place,
 * which is `grantsFrom`: two rings carrying Primal Sense have to be *seen* as two
 * before they can be counted as one.
 */
export function gearEnchantIds(character) {
  return carriedItems(character).flatMap((item) =>
    itemEnchantments(item).map(({ enchantment }) => enchantment.id)
  );
}

/**
 * Everything enchanted on this character, from all three places it can come
 * from, with the same-source law applied once across the lot.
 *
 * Three places: laid on their own person by WIELDER OF WONDER, running on them
 * for the hour by EPHEMERAL ENCHANTMENT, and worked into something they are
 * wearing. **An effect does not stack with itself from the same source.** Primal
 * Sense on two rings is one point of Instinct; Primal Sense on a ring and again
 * on the Enchanter's own person is still one point. A point from a lineage and a
 * point from a ring are different sources and do stack — nothing here touches
 * those, because they are not enchantments.
 *
 * This is the composed reading of `allGrants`, and it is composed here because
 * this is the only file that imports both the codex and the enchanting rules.
 * Everything that wants the whole picture — `deriveStats`, the bell, the price of
 * a rest — calls this rather than `allGrants` directly.
 */
export function characterGrants(character) {
  return allGrants(character, gearEnchantIds(character));
}

/**
 * The same three places, named rather than summed: every enchantment standing on
 * this character, as rows, with the same-source law already applied.
 *
 * `characterGrants` above is what the stat columns read. This is what a *tile*
 * reads, so a hovered number can say which working lent it a point instead of
 * leaving the reader to go and reconstruct the sum. Composed here for the same
 * reason that one is: this is the only file that can see both the codex and the
 * enchanting rules.
 */
export function characterGrantSources(character) {
  return grantSources(character, gearEnchantIds(character));
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


/**
 * What a weapon does to its cards *in this character's hands*.
 *
 * Two things change a weapon: what has been worked into the weapon, and what has
 * been worked into the person holding it. The first is the item's own `enchants`
 * (plus whatever this character has laid on it, see `heldItem`). The second is
 * WIELDER OF WONDER's doing — "Enchantments apply to your person" — and it only
 * counts while the thing is actually **equipped**: a Fire Infusion on an
 * Enchanter's hands does nothing to the spare dagger in their pack.
 *
 * So this is where "is it in their hands" is decided, because this is the file
 * that knows what equipment is. weapons.js is handed the answer.
 */
export function wieldModifiers(character, item) {
  if (!item) return { damage: [], empower: 0 };

  const worn = normalizeEquipment(character?.equipment);
  const held = Object.values(worn).includes(item.id);

  return itemModifiers(item, held ? damageEnchants(character) : []);
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
 * The summed burden of the whole loadout — worn, held, on a trinket, and clipped
 * to the belt. Worked magic weighs the same wherever it is carried.
 *
 * **It takes the character now**, not a loose equipment map. Two call sites used
 * to hand it `(equipment, belt)` with no character at all — the codex browser and
 * the equip prompt, which are the two places that *refuse* an item for being over
 * capacity. Without the character they could not see a working laid on a blade
 * and could not see a forged piece at all, so both read low and let a player
 * equip past their capacity. One argument, and the number is the same everywhere
 * it is printed.
 */
export function magicBurdenUsed(character) {
  const worn = normalizeEquipment(character?.equipment);
  const resolve = (id) => heldItem(character, id);

  let total = 0;
  for (const slot of Object.keys(worn)) {
    total += itemBurden(resolve(worn[slot]));
  }
  for (const id of normalizeTrinkets(character?.trinkets)) {
    total += itemBurden(resolve(id));
  }
  for (const entry of normalizeBelt(character?.belt)) {
    total += itemBurden(resolve(entry?.id));
  }

  /* And nothing at all for what is worked into the character rather than into a
     thing they carry. **WIELDER OF WONDER's body slots weigh nothing**, on Jules's
     ruling (2026-08-21): the card gives the enchanter body the power to withstand
     its own enchantments, so what it holds is not carried the way a worked ring is
     carried. The card says so in as many words now, and the set has two cards that
     cost no Burden rather than one — EPHEMERAL ENCHANTMENT was already the other.

     They were counted here until that ruling, which is why this is a note rather
     than a silence: only what is *carried* weighs now, which is every loop above
     and nothing else. */

  return total;
}

/* ------------------------------------------------------------ what it weighs
 *
 * The second meter on the tab, and the opposite kind of number to Magic Burden.
 * Burden asks what worked magic is on your person; this asks what everything you
 * own weighs, the pack very much included, and it is the only ceiling on this
 * sheet a character is *allowed* to go past.
 *
 * Kilograms, because the sheet's own distances are metres and the unit switch
 * converts on the way to the screen rather than in the data. See `formatWeight`
 * in characterModel.js, which is where a kilo becomes a pound.
 */

/** What one thing weighs. A working adds coin to a piece, never kilos. */
export function itemWeight(item) {
  return Math.max(0, Number(item?.weight) || 0);
}

/**
 * What a working adds to the piece it is in, per point of Magic Burden.
 *
 * Jules's, 2026-08-22: "An enchantment add to the value 1000 coins per burden
 * associated." It is deliberately not the enchantment's own `cost` field, which
 * is 750 a point and answers a different question: what the working costs to buy
 * and lay. This is what having it already in something is worth.
 *
 * A working that weighs nothing adds nothing, which is the honest reading of a
 * rule written per point. The two pieces in the codex that carry one price
 * themselves instead. See the Ring of Shrouding in trinkets.js.
 */
export const ENCHANT_COIN_PER_BURDEN = 1000;

/**
 * What a piece is worth in coin: its own price, plus every working in it.
 *
 * The premium is computed rather than written down, so a piece the player forges
 * is priced by the same rule as one the codex shipped and a reworked enchantment
 * reprices every blade carrying it.
 */
export function itemCost(item) {
  if (!item) return 0;

  const worked = itemEnchantments(item).reduce(
    (total, { enchantment }) => total + Math.max(0, Number(enchantment.burden) || 0),
    0
  );
  return Math.max(0, Math.floor(Number(item.cost) || 0)) + worked * ENCHANT_COIN_PER_BURDEN;
}

/**
 * Kilograms of carrying a Physique buys.
 *
 * Five, Jules's number, down from the ten this started at. Ten echoed the
 * attribute tooltip's own "10 Health a point" and it put the ceiling out of
 * reach: a fresh character stands at 4, and 40 kg is a full suit of plate with a
 * greatsword and change. At five a starting character carries 20, so a bag is a
 * real purchase and the weight on every item row is a number somebody adds up.
 */
export const CARRY_PER_PHYSIQUE = 5;

/** The bag on this character, or null when they are carrying it all by hand. */
export function bagItem(character) {
  return heldItem(character, normalizeEquipment(character?.equipment)[BAG_SLOT_KEY]);
}

/** What the bag adds to the ceiling, and nothing at all when there is none. */
export function bagCapacity(character) {
  return Math.max(0, Number(bagItem(character)?.capacity) || 0);
}

/**
 * What this character may carry: their Physique, and whatever they sling it in.
 *
 * `physique` is an override for the one caller that must not read the column:
 * `deriveStats` works in the *bent* attribute, with every worn enchantment
 * already in it, while the column it was handed is the level ledger's and knows
 * nothing about a Bodily Vigor on somebody's person. Left off, the column is
 * read, which is right everywhere else on the sheet because everything else is
 * handed the character `liveCharacter` has already bent.
 *
 * Getting this wrong would be the quiet kind of wrong: a ring worth a point of
 * Physique would show a whole Physique of capacity on the meter and not be in the
 * ceiling that decides whether Speed is halved.
 */
export function carryCapacity(character, physique = character?.physique) {
  const strength = Math.max(0, Math.floor(Number(physique) || 0));
  return strength * CARRY_PER_PHYSIQUE + bagCapacity(character);
}

/**
 * Everything on this character and everything they own, in kilograms.
 *
 * **The pack is in it, and that is the whole point.** Magic Burden asks what is
 * on your person, so it stops at the belt. Weight does not care where a thing is:
 * a spare breastplate in the pack is a breastplate you are carrying, and the bag
 * on your back weighs against the room it gives you.
 *
 * A written-in thing weighs nothing. A folded note has no rules and no weight,
 * and inventing one for it would mean asking the player for a number every time
 * they wrote something down.
 */
export function carriedWeight(character) {
  const worn = normalizeEquipment(character?.equipment);
  const resolve = (id) => heldItem(character, id);

  let total = 0;
  for (const slot of Object.keys(worn)) total += itemWeight(resolve(worn[slot]));
  for (const id of normalizeTrinkets(character?.trinkets)) total += itemWeight(resolve(id));
  for (const entry of normalizeBelt(character?.belt)) total += itemWeight(resolve(entry?.id));
  for (const entry of normalizePack(character?.pack)) {
    if (!isCustomEntry(entry)) total += itemWeight(resolve(entry));
  }

  /* Two decimals. Half a gram of floating-point drift across forty items is
     what turns "40 of 40" into an overload nobody can find the cause of. */
  return Math.round(total * 100) / 100;
}

/**
 * How far past the ceiling a character stops being able to move at all.
 *
 * Jules's, 2026-08-22: "If you are over weight your speed is halved. If you go
 * 30% above you cannot move." So there are three states and not two, and the
 * middle one is a penalty rather than a refusal: nothing anywhere stops a player
 * picking a thing up. Being overloaded is a condition they are in, not a door
 * that is shut.
 */
export const OVERLOAD_STOP = 1.3;

/**
 * What this character is carrying, against what they can, and which of the three
 * states that puts them in.
 *
 * `state` is `clear`, `over` or `stuck`. `stopAt` is the weight the third one
 * begins at, so a meter can draw the line rather than leaving the player to work
 * out what 30% of their own capacity is.
 *
 * `physique` passes straight through to `carryCapacity`. See the note there.
 */
export function carryState(character, physique = character?.physique) {
  const max = carryCapacity(character, physique);
  const used = carriedWeight(character);
  const stopAt = Math.round(max * OVERLOAD_STOP * 100) / 100;

  const stuck = max > 0 && used >= stopAt;
  const over = used > max;

  return {
    used,
    max,
    stopAt,
    over,
    stuck,
    state: stuck ? 'stuck' : over ? 'over' : 'clear',
    /* Kilos past the ceiling, for the line that says how much to put down. */
    by: Math.round(Math.max(0, used - max) * 100) / 100,
  };
}

/**
 * Movement Speed with the load on it: halved when over, gone when 30% over.
 *
 * Floored to the nearest half rather than left as a quarter, because Speed is the
 * one number on this sheet that keeps its halves and has never printed anything
 * finer. A Speed of 5.5 halves to 2.5 and not to 2.75, which is what
 * `Math.floor(metres) / 2` says in one step.
 *
 * Takes the state rather than the character so `deriveStats` reads the load once
 * and hands it to both this and the tile that explains it.
 */
export function encumberedSpeed(speed, carry) {
  const metres = Math.max(0, Number(speed) || 0);
  if (!carry || carry.state === 'clear') return metres;
  return carry.state === 'stuck' ? 0 : Math.floor(metres) / 2;
}

/* -------------------------------------------------------- equipment effects */

/**
 * The set name if all three armor slots wear it, else null.
 *
 * Takes the character, because a forged breastplate is only a breastplate to a
 * sheet that can resolve it — `getItem` on a forged id is null, which read as
 * "no set" and quietly broke the set bonus of anyone who had renamed a piece.
 */
export function armorSetName(character) {
  const worn = normalizeEquipment(character?.equipment);
  const pieces = ARMOR_SLOTS.map(({ key }) => heldItem(character, worn[key]));
  if (pieces.some((item) => !item?.set)) return null;
  const [first] = pieces;
  return pieces.every((item) => item.set === first.set) ? first.set : null;
}

/**
 * Every always-on modifier the current loadout applies, in one bag. The
 * derived-stat maths in characterModel reads this — nothing else should need
 * to walk the slots by hand.
 *
 * Trinkets are in it: nothing in the trinket codex carries a number of its own,
 * but a forged piece is made from *any* base, and a renamed breastplate worn in
 * the torso slot has to keep its Armor.
 */
export function equipmentEffects(character) {
  const items = wornItems(character);
  /* And the same walk without the stowed weapon, for the two numbers a piece has
     to be in your hand to be worth. See `heldItems` above: this is what keeps a
     shield on your back from being 3 Armor. */
  const held = heldItems(character);

  return {
    /** Flat additions to Defense from individual pieces. */
    defenseFlat: held.reduce((sum, item) => sum + (Number(item.defense) || 0), 0),
    /** Armor is gear-only, so this IS the character's Armor stat. */
    armorTotal: held.reduce((sum, item) => sum + (Number(item.armor) || 0), 0),
    /** True while something worn raises the Shield cap by Mind. */
    shieldCapMind: items.some((item) => item.shieldCapBonus === 'mind'),
    burden: items.reduce((sum, item) => sum + itemBurden(item), 0),
    fullSet: armorSetName(character),
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
 *
 * `wornItems`, so a forged Runed Hood still starts the fight with its Shield and a
 * trinket made from one counts too.
 */
export function combatStartEffects(character) {
  return wornItems(character)
    .filter((item) => item?.onCombatStart)
    .map((item) => {
      const from = item.onCombatStart.shield;
      const times = Math.max(1, Math.floor(Number(item.onCombatStart.times) || 1));
      const value = Math.max(0, Math.floor(Number(character?.[from]) || 0)) * times;
      return { item, shield: value, from, times };
    })
    .filter((entry) => entry.shield > 0);
}

/**
 * Which pieces of worn gear hand Reaction Points over at the bell, and how many
 * each of them gives.
 *
 * PREPARED is the only enchantment that grants any: "you start each combat with 3
 * reaction points." Patien carries it in the codex, and anything a player forges
 * can carry it too.
 *
 * ------------------------------------------ what this is for, and what it is not
 * **It is no longer the number.** `characterGrants` is: an item's workings now
 * reach the same sum an Enchanter's own body slots reach, from all three places
 * at once, with the same-source law applied across the lot. That is what the bell
 * reads.
 *
 * This is the *attribution* — which piece did it, so the button's note can name
 * the ring rather than silently moving a pool. Summing both would count PREPARED
 * twice, so `combatReactionGrant` in combatTurn.js takes the number from one and
 * the names from here.
 *
 * `carriedItems`, so a forged piece counts, an Enchanter's own laid work counts, a
 * trinket counts, and so does a loop on the belt — the same list the number comes
 * from, because a bell that hands over 3 Reaction Points and can name nothing
 * that gave them is worse than either half alone. What is in the pack is not on
 * you.
 */
export function combatReactionEffects(character) {
  return carriedItems(character)
    .map((item) => ({
      item,
      reaction: itemEnchantments(item).reduce(
        (sum, { enchantment }) => sum + Math.max(0, Math.floor(Number(enchantment.reactionAtCombat) || 0)),
        0
      ),
    }))
    .filter((entry) => entry.reaction > 0);
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
  const trinkets = normalizeTrinkets(character?.trinkets);
  const loops = beltSlotCount(character);

  const filled = (keys) => keys.filter((key) => equipment[key]).length;

  const tallies = [
    { id: 'worn', label: 'Worn', filled: filled(ARMOR_SLOTS.map((s) => s.key)), of: ARMOR_SLOTS.length },
    { id: 'hand', label: 'In Hand', filled: filled(WEAPON_SLOTS.map((s) => s.key)), of: WEAPON_SLOTS.length },
    /* No ceiling, so it reports a bare count — the second tally to do so, and for
       the pack's own reason: there is no number of rings a character may wear. */
    { id: 'trinket', label: 'Trinkets', filled: trinkets.length, of: null },
    { id: 'belt', label: 'On Belt', filled: belt.filter((entry, i) => i < loops && entry).length, of: loops },
    { id: 'pack', label: 'In Pack', filled: pack.length, of: null },
  ];

  const used = magicBurdenUsed(character);
  const max = magicBurdenMax(character ?? {});

  return {
    tallies,
    /** Everything on the character, equipped and carried alike. */
    total: tallies.reduce((sum, tally) => sum + tally.filled, 0),
    burden: { used, max, over: Math.max(0, used - max) },
    /* The other number here that can be wrong, and the only one the pack can
       make wrong on its own. Burden stops at the belt; this counts the pack. */
    carry: carryState(character),
  };
}

/**
 * Every tag carried by something in the pack, as the filter row wants them.
 *
 * Rarity is its own kind so that picking Common and Rare widens ("either")
 * while picking Common and Head Gear narrows — the same law the Abilities tab
 * filters by. A written-in thing carries no tags and so answers no chip.
 *
 * Through `heldItem`, so a forged piece offers its own tags — `Enchanted` among
 * them, which is how a player with forty things finds the six they made.
 */
export function packTags(character, pack) {
  const seen = new Map();
  for (const entry of pack) {
    const item = isCustomEntry(entry) ? null : heldItem(character, entry);
    for (const tag of item?.tags ?? []) {
      if (!seen.has(tag)) seen.set(tag, { id: tag, label: tag, kind: tag in RARITY_COLORS ? 'rarity' : 'kind' });
    }
  }
  /* Rarity in its own order rather than the alphabet's, which had Common sitting
     between Epic and Legendary in a row whose chips are coloured by rarity. See
     src/lib/cardOrder.js. */
  return [...seen.values()].sort((a, b) => compareTags(a.label, b.label));
}
