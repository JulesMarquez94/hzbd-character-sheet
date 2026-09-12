/**
 * Starting above level 1: what a character made at a higher level is handed.
 *
 * The Free Hand is the way in for a character who joins a table already under
 * way (see creationPaths.js). When they are named, the enlist box asks which
 * level they start at, and this file is what that level hands over besides the
 * choices the ledger will then ask for. Jules, 2026-09-12:
 *
 *   "you also get 1000 coins per level. Also at level 6 you get a full tier 2
 *    armor choice instead of the basic. At level 8 you get to also choose an
 *    enchanted ring of mind, physique or instinct. At level 10 you get highest
 *    quality armor. for each 2 level above 1 you get a healing potion."
 *
 * Four grants, every one read off the level alone:
 *
 *   coins     COINS_PER_LEVEL a level, into the wealth ledger. Level 6 is 6,000.
 *   potions   one Healing Potion for every two levels above the first, into the
 *             pack: none at level 2, one at 3, two at 5, five at 11.
 *   armor     the tier the background's kit dresses you in. Common below level
 *             6, Rare (the second tier) from 6, Epic (the third) from 10. Not
 *             handed over here: the outfitter reads `startingArmorRarity` off
 *             the character's level when the kit is taken, so the same kit
 *             window serves every level. See KitOutfitter in BackgroundPick.jsx
 *             and buildKitPatch in kit.js.
 *   ring      from level 8, a Silver Ring worked with the one Novice enchantment
 *             that raises the attribute chosen: Bodily Vigor, Primal Sense or
 *             Mental Focus. Minted as a forged record and worn from the start,
 *             so it is the same kind of ring the forge makes and can be taken
 *             off, renamed or handed on exactly like one.
 *
 * ------------------------------------------------------------------ the ledger
 * The experience and the coins go through the ledger under one note, "Made at
 * level N", the way the Crossroads stamps "Made at the Crossroads": the ledger
 * is the record of every level a sheet has, and the history still adds up to
 * the balance. `madeAtLevel` reads the note back, which is how the creation
 * page can say what the start handed over without a column for it.
 *
 * ------------------------------------------------------------- what is not here
 * Nothing here decides what the levels *ask*. That is `levelGrants` in
 * levels.js, and a level 6 start opens the same six blocks a climb to 6 would.
 * The coins are literal, 1,000 a level and not 1,000 a level above the first,
 * because that is what was said; both readings are logged in data/README.md.
 */

import { MAX_LEVEL, XP_TABLE, clampLevel, levelForXp, xpForLevel } from './levels.js';
import { appendLedger, formatNumber, newLedgerId } from './characterModel.js';
import { forgeRecord, normalizeForged } from './forged.js';
import { normalizePack, normalizeTrinkets } from './items.js';
import { getEnchantment } from './enchantments.js';
import { attributeLabel } from './attributes.js';

/** The Free Hand starts above level 1, and no character climbs past the cap. */
export const STARTING_LEVEL_MIN = 2;
export const STARTING_LEVEL_MAX = MAX_LEVEL;

/** "1000 coins per level." */
export const COINS_PER_LEVEL = 1000;

/** "for each 2 level above 1 you get a healing potion." */
export const POTION_ID = 'healing-potion';
export const POTION_EVERY = 2;

/** "At level 8 you get to also choose an enchanted ring of mind, physique or instinct." */
export const RING_LEVEL = 8;
export const RING_BASE = 'silver-ring';
export const RING_CHOICES = [
  { key: 'physique', ench: 'bodily-vigor', name: 'Ring of Physique' },
  { key: 'instinct', ench: 'primal-sense', name: 'Ring of Instinct' },
  { key: 'mind', ench: 'mental-focus', name: 'Ring of Mind' },
];

/**
 * "at level 6 you get a full tier 2 armor choice instead of the basic ... At
 * level 10 you get highest quality armor." Highest rung first, so the first
 * row a level reaches is its tier. Below the lowest rung the kit is Common.
 */
export const ARMOR_TIERS = [
  { level: 10, rarity: 'Epic' },
  { level: 6, rarity: 'Rare' },
];
export const BASE_ARMOR_RARITY = 'Common';

/* ------------------------------------------------------------------ the ladder */

/** A starting level the enlist box will accept, from whatever was typed. */
export function clampStartingLevel(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return STARTING_LEVEL_MIN;
  return Math.min(STARTING_LEVEL_MAX, Math.max(STARTING_LEVEL_MIN, n));
}

/** Every level the Free Hand offers, lowest first. */
export function startingLevels() {
  const out = [];
  for (let n = STARTING_LEVEL_MIN; n <= STARTING_LEVEL_MAX; n += 1) out.push(n);
  return out;
}

/** Coins a start at this level is handed. Nothing at level 1. */
export function startingCoins(level) {
  const n = clampLevel(level);
  return n > 1 ? n * COINS_PER_LEVEL : 0;
}

/** Healing Potions a start at this level is handed. */
export function startingPotions(level) {
  return Math.max(0, Math.floor((clampLevel(level) - 1) / POTION_EVERY));
}

/** The tier the background's kit dresses a character of this level in. */
export function startingArmorRarity(level) {
  const n = clampLevel(level);
  return ARMOR_TIERS.find((tier) => n >= tier.level)?.rarity ?? BASE_ARMOR_RARITY;
}

/** Whether a start at this level comes with the ring. */
export function grantsRing(level) {
  return clampLevel(level) >= RING_LEVEL;
}

/** One of the three rings by the attribute it raises, or null. */
export function ringChoice(key) {
  return RING_CHOICES.find((choice) => choice.key === key) ?? null;
}

/**
 * What a start at this level hands over, said in rows for a screen to print:
 * `{ id, label, detail }`. The ring row names the ring once one is chosen and
 * says the choice is open until then; the armor row is always there, because
 * "Common" is an answer too.
 */
export function startingGrants(level, ringKey = null) {
  const n = clampLevel(level);
  const rows = [];

  const coins = startingCoins(n);
  if (coins > 0) {
    rows.push({
      id: 'coins',
      label: `${formatNumber(coins)} coins`,
      detail: `${formatNumber(COINS_PER_LEVEL)} a level, in the ledger.`,
    });
  }

  const potions = startingPotions(n);
  if (potions > 0) {
    rows.push({
      id: 'potions',
      label: `${potions} Healing Potion${potions === 1 ? '' : 's'}`,
      detail: 'One for every two levels above the first, in the pack.',
    });
  }

  const rarity = startingArmorRarity(n);
  const rungs = [...ARMOR_TIERS].sort((a, b) => a.level - b.level);
  rows.push({
    id: 'armor',
    label: `${rarity} armor`,
    detail:
      rarity === BASE_ARMOR_RARITY
        ? `Your background's kit dresses you in a Common set. ${rungs
            .map((tier) => `${tier.rarity} from level ${tier.level}`)
            .join(', ')}.`
        : `Your background's kit offers every armor set at its ${rarity} tier.`,
  });

  if (grantsRing(n)) {
    const choice = ringChoice(ringKey);
    const ench = choice ? getEnchantment(choice.ench) : null;
    rows.push({
      id: 'ring',
      label: choice ? choice.name : 'An enchanted ring',
      detail: choice
        ? `A Silver Ring worked with ${ench?.name ?? choice.ench}: 1 ${attributeLabel(
            choice.key
          )}, worn from the start.`
        : 'A Silver Ring worked for 1 Physique, Instinct or Mind. Your choice.',
    });
  }

  return rows;
}

/* ------------------------------------------------------------------ the stamp */

/** The ledger note both the experience and the coins are logged under. */
export function startNote(level) {
  return `Made at level ${level}`;
}

const NOTE = /^Made at level (\d+)$/;

/**
 * The level a character was made at, read back off the ledger, or null for a
 * character who was made at level 1 or climbed the ordinary way. The creation
 * page reads it to say what the start handed over; nothing mechanical hangs
 * off it.
 */
export function madeAtLevel(character) {
  const ledger = Array.isArray(character?.ledger) ? character.ledger : [];
  for (const row of ledger) {
    if (row?.kind !== 'xp') continue;
    const hit = NOTE.exec(String(row.note ?? '').trim());
    if (hit) return clampLevel(hit[1]);
  }
  return null;
}

/**
 * The ring the start put on this character, if it is still worn: the choice
 * row plus the forged id it stands under. Null once it is taken off or handed
 * on, which is the truthful answer then.
 */
export function startingRing(character) {
  const worn = new Set(normalizeTrinkets(character?.trinkets));
  for (const record of Object.values(normalizeForged(character?.forged))) {
    if (record.base !== RING_BASE || !worn.has(record.id)) continue;
    const choice = RING_CHOICES.find((entry) => record.ench.some((row) => row.id === entry.ench));
    if (choice) return { ...choice, id: record.id };
  }
  return null;
}

/**
 * The single patch that makes a blank row a character of this level: the
 * experience at the level's threshold, the coins, the potions and the ring,
 * with the experience and the coins logged under one note. Applied to the
 * blank at the moment the row is created, so the creation page opens on a
 * ledger that already stands at the level and asks for everything up to it.
 *
 * Nothing already on the row is taken away: experience only rises to the
 * threshold, coins are added and the pack grows. A ring is minted only when
 * the level grants one and one was chosen; a start at level 8 with no ring
 * named is refused by the enlist box before it reaches here.
 */
export function startingPatch(character, level, { ring = null } = {}) {
  const n = clampStartingLevel(level);
  const ts = new Date().toISOString();
  const note = startNote(n);

  const xpBefore = Math.max(0, Math.floor(Number(character?.xp) || 0));
  const xp = Math.max(xpBefore, XP_TABLE[n]);
  let ledger = Array.isArray(character?.ledger) ? character.ledger : [];
  if (xp !== xpBefore) {
    ledger = appendLedger(
      { ledger },
      { id: newLedgerId(), ts, kind: 'xp', delta: xp - xpBefore, note, balance: xp }
    );
  }

  const coins = startingCoins(n);
  const wealthBefore = Math.max(0, Math.floor(Number(character?.wealth) || 0));
  const wealth = wealthBefore + coins;
  if (coins > 0) {
    ledger = appendLedger(
      { ledger },
      { id: newLedgerId(), ts, kind: 'wealth', delta: coins, note, balance: wealth }
    );
  }

  const potions = startingPotions(n);
  const pack = [
    ...normalizePack(character?.pack),
    ...Array.from({ length: potions }, () => POTION_ID),
  ];

  const standing = levelForXp(xp);
  const patch = { xp, level: standing, xp_max: xpForLevel(standing), wealth, ledger, pack };

  const choice = grantsRing(n) ? ringChoice(ring) : null;
  if (choice) {
    const record = forgeRecord({
      base: RING_BASE,
      ench: [{ id: choice.ench }],
      name: choice.name,
      art: null,
    });
    patch.forged = { ...normalizeForged(character?.forged), [record.id]: record };
    patch.trinkets = [...normalizeTrinkets(character?.trinkets), record.id];
  }

  return patch;
}
