/**
 * Shared shape + derived-stat rules for a Hazebound character.
 * Keeping the maths here means the sheet, the dashboard cards and the
 * creation form all agree on what a character is.
 */

import { EMPTY_EQUIPMENT, equipmentEffects } from './items.js';
import { allGrants, ephemeralGrants, wornGrants } from './enchanting.js';

export const BLANK_CHARACTER = {
  name: 'Unnamed Drifter',
  level: 1,
  xp: 0,
  xp_max: 1000,
  wealth: 0,
  // Rations, powder, reagents, spare rope — the crate a character travels on.
  // Moved only through its own ledger, exactly like coins.
  supplies: 0,
  lineage: '',
  background: '',
  campaign: '',
  blurb: '',
  portrait_url: null,

  // Every attribute starts at ATTRIBUTE_BASE and is moved only by advancement:
  // the +2 / +1 spread at level 1, and a point at every odd level after. The
  // level ledger rebuilds all three from its own record — see levelPicks.js.
  physique: 4,
  instinct: 4,
  mind: 4,

  avoid: 4,
  // Armor is gear-only: with nothing equipped it stays flat 0.
  defense: 0,
  speed_m: 5,
  initiative: 5,
  reflex: 8,
  grit: 8,

  health: 50,
  health_max: 50,
  shield: 0,
  // Not read by the app — shield's cap is always computed as half of
  // health_max. syncDerived keeps the column on that number so a raw row
  // reads sensibly.
  shield_max: 25,
  ap: 6,
  ap_max: 6,
  // Reaction points are earned during a round, so a fresh sheet starts empty.
  reaction: 0,
  reaction_max: 6,
  willpower: 20,
  willpower_max: 20,
  karma: 0,

  // What is worn / wielded, one item id (or null) per slot. Slots and the
  // item codex live in items.js; Armor, Defense and the Shield cap are all
  // re-derived from this on every change.
  equipment: { ...EMPTY_EQUIPMENT },
  // Item ids carried in the pack — where unequipped gear goes. The
  // inventory block reads this.
  pack: [],
  // The utility belt: one entry per loop, `{ id, used }` or null. `used`
  // counts the charges spent out of that item's own total.
  belt: [],
  // How many of the five belt loops are open. Three to begin with.
  belt_slots: 3,

  // The background chosen at level 1. The plain name lives in the `background`
  // column above; these two are what it handed out. `background_skills` is the
  // list of skill ids picked from that background pool, and `background_kit` is the
  // record of the starting kit once it has been taken — what was granted, so
  // handing it back returns exactly what it gave — and null until then.
  background_skills: [],
  background_kit: null,

  talents: [],
  // Everything a level handed out that isn't a talent, keyed by the level that
  // granted it: the +2 / +1 spread at level 1, and an attribute point and a
  // learned skill at every odd level after. levelPicks.js owns the shape.
  level_picks: {},
  // Choices a card leaves to the player, keyed by the card that asks for one:
  // { "chromatic-resistance": "red", "dark-bargain": "mind" }. A card that
  // names no choice never appears here.
  choices: {},
  lore: {
    appearance: '',
    personality: '',
    backstory: '',
    allies: '',
    notes: '',
  },
  // Session logs, newest first: [{ id, ts, session, title, body }]. The only
  // part of the sheet that grows without bound. journal.js owns the shape.
  journal: [],
  // Where the turn manager stands: { n, live }. `n` counts your own turns in
  // the fight you are in, and `live` is whether you are inside one right now.
  // Both are reset by the block's own "End the fight". combatTurn.js owns it.
  turn_state: {},
  // What is running on you: [{ id, name, card, note, turns, from }]. `turns`
  // counts down at the top of each of your turns; null means it lasts until
  // something ends it, which is how conditions are held.
  effects: [],
  // Append-only history of every XP, coin and supply movement. Newest first.
  ledger: [],
  // Left-to-right order of the six blocks on the Character tab.
  block_order: [1, 2, 3, 4, 5, 6],
  // Left-to-right order of the Abilities tab's blocks, by source id
  // ("lineage", "talent:mycomancer", "gear"). Unlike block_order this has no
  // fixed length: a source arrives when it is taken and leaves when it is
  // handed back. Empty means nobody has arranged them yet.
  ability_order: [],
  // Left-to-right order of the Inventory tab's three fixed blocks, by block id
  // ("armor", "weapons", "belt"). Must be listed here: the save path only
  // writes columns named in this object (see pickCharacterFields in api.js).
  inventory_order: [],
};

/* -------------------------------------------------------------- block order */

/** The six blocks of the Character tab, in their factory order. */
export const SHEET_BLOCK_IDS = [1, 2, 3, 4, 5, 6];

/**
 * A stored order is only ever a hint: it may be missing, half-written by an
 * older build, or hold ids that no longer exist. Whatever comes in, this
 * returns all six ids exactly once — known ids keep the order they were given
 * and anything absent is appended in its factory position.
 */
export function normalizeBlockOrder(value) {
  let list = value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = null;
    }
  }

  const order = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const id = Number(raw);
    if (SHEET_BLOCK_IDS.includes(id) && !order.includes(id)) order.push(id);
  }
  for (const id of SHEET_BLOCK_IDS) {
    if (!order.includes(id)) order.push(id);
  }
  return order;
}

/**
 * The same repair for a list whose members are not known in advance.
 *
 * The Abilities tab has one block per source, and which sources a character has
 * is up to them: a set taken at level 6 is a block that did not exist before,
 * and a set handed back is one that no longer does. So a stored arrangement is
 * matched against the sources that actually exist right now. Ids still present
 * keep the place they were given, ids that have gone are dropped, and anything
 * new is appended in its natural order rather than pushed into the middle of a
 * layout somebody has already arranged.
 */
export function normalizeSourceOrder(value, ids) {
  let list = value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = null;
    }
  }

  const known = new Set(ids);
  const order = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const id = String(raw);
    if (known.has(id) && !order.includes(id)) order.push(id);
  }
  for (const id of ids) {
    if (!order.includes(id)) order.push(id);
  }
  return order;
}

/**
 * The stat block a character's attributes, level and equipment buy them:
 *
 *   Health max  = physique * 10 + level * 10
 *   Defense     = instinct, + gear   (a full armor set may swap the base:
 *                                     Light -> Reflex, Magic -> Grit, and
 *                                     Heavy adds half of Armor on top)
 *   Armor       = gear only          (the summed `armor` of what is worn)
 *   Initiative  = instinct + level
 *   Speed       = 3 + instinct / 2
 *   Reflex      = physique + instinct
 *   Grit        = instinct + mind
 *
 * ------------------------------------------------------- what is laid on them
 * An Enchanter's work counts here, because it is gear: WIELDER OF WONDER puts
 * enchantments on their own person and "1 Instinct" has to *be* 1 Instinct, with
 * everything Instinct buys moving with it. Those are permanent, so they are read
 * off the talents column and `syncDerived` bakes them into the stored columns
 * exactly the way a worn breastplate is baked in.
 *
 * `extra` is the other kind: what is on them for the next hour and must never be
 * stored, because a stored bonus has no way of ever coming back off. Only
 * `liveCharacter` passes it, and only for what the sheet *shows*. See
 * enchanting.js.
 */
export function deriveStats({ physique, instinct, mind, level, equipment, talents }, extra = null) {
  const worn = wornGrants(talents);

  const add = (key) =>
    (worn.attributes[key] ?? 0) + Math.floor(Number(extra?.attributes?.[key]) || 0);

  const p = (Number(physique) || 0) + add('physique');
  const i = (Number(instinct) || 0) + add('instinct');
  const m = (Number(mind) || 0) + add('mind');
  const lvl = Number(level) || 1;

  const health_max =
    Math.floor(10 * lvl + 10 * p) + worn.healthMax + Math.floor(Number(extra?.healthMax) || 0);
  const reflex = Math.floor(p + i);
  const grit = Math.floor(i + m);

  const gear = equipmentEffects(equipment);

  // Defense: the base attribute (or the set-bonus replacement), plus every
  // flat bonus worn, plus Heavy Armor's half-Armor rider.
  let avoidBase = i;
  if (gear.fullSet === 'Light Armor') avoidBase = reflex;
  if (gear.fullSet === 'Magic Armor') avoidBase = grit;
  let avoid = avoidBase + gear.defenseFlat;
  if (gear.fullSet === 'Heavy Armor') avoid += Math.floor(gear.armorTotal / 2);

  return {
    health_max,
    // A shield's base cap is never independently set — it's always half of
    // health_max; worn gear (the Supreme Runed set) can raise it by Mind.
    shield_cap: Math.floor(health_max / 2) + (gear.shieldCapMind ? m : 0),
    willpower_max: Math.floor(2 * lvl + 2 * m + 10),
    avoid: Math.floor(avoid),
    defense: Math.floor(gear.armorTotal),
    initiative: Math.floor(i + lvl),
    // Speed is the one value that stays a precise decimal — everything else
    // here rounds down.
    speed_m: 3 + i / 2,
    ap_max: 6,
    reaction_max: 6,
    reflex,
    grit,
  };
}

/** Half of `healthMax`, rounded down — the bare cap on a character's shield. */
export function shieldCap(healthMax) {
  return Math.floor((Number(healthMax) || 0) / 2);
}

/** The shield cap with worn gear applied — what the sheet should display. */
export function shieldCapFor(character) {
  const gear = equipmentEffects(character?.equipment);
  const bonus = gear.shieldCapMind ? Math.floor(Number(character?.mind) || 0) : 0;
  return shieldCap(character?.health_max) + bonus;
}

/**
 * The character as the sheet should *show* them, which is not always the
 * character as it stores them.
 *
 * An Ephemeral Enchantment lasts an hour. It raises an attribute, and everything
 * that attribute buys, and every number printed on every card that rolls it. What
 * it must never do is move a stored column: `syncDerived` recomputes those from
 * the row itself on every render, so a bonus written into `instinct` would become
 * indistinguishable from a level-up and there would be nothing left to take back
 * off when the hour is out.
 *
 * So this is the one bend, applied where the sheet is read and never where it is
 * written. `patch` in CharacterSheet.jsx closes over the stored row, not this one,
 * which is what keeps a write made from a bent screen honest.
 *
 * Hands back the character itself when nothing is running, so a sheet with no
 * enchantments on it does no work and re-renders no more than it used to.
 */
export function liveCharacter(character) {
  if (!character) return character;

  const grants = allGrants(character);
  if (!grants.any) return character;

  /* The attribute *columns* are the level ledger's, and nothing here may write
     them: levelPicks.js rebuilds all three out of its own record, so a bonus
     stored in one would be read back as a level-up and never come off again.
     What is laid on a person is therefore shown rather than stored, which is the
     same relationship Defense has with a breastplate.

     Both kinds of laying bend what is *shown* — a worn "1 Instinct" is 1
     Instinct, and a tile that said 6 beside a Defense computed from 7 would be
     two numbers contradicting each other on one screen. */
  const bent = { ...character };
  for (const key of ['physique', 'instinct', 'mind']) {
    const plus = grants.attributes[key] ?? 0;
    if (plus) bent[key] = (Number(character[key]) || 0) + plus;
  }

  /* Derived off the *stored* columns, with only the ephemeral part passed in:
     deriveStats reads the worn part out of the talents column itself, so handing
     it the bent attributes as well would count every worn enchantment twice. */
  const level = levelForXp(character.xp);
  return { ...bent, ...deriveStats({ ...character, level }, grants.ephemeral) };
}

/**
 * What is on this character that is not on their row, said in words.
 *
 * Only the ephemeral half: a worn enchantment is permanent and the stored
 * columns already carry it, so the only thing worth flagging as *running* is the
 * hour-long kind. Empty when nothing is.
 */
export function liveShift(character) {
  const grants = ephemeralGrants(character?.effects);
  if (!grants.any) return [];

  const said = [];
  for (const [key, plus] of Object.entries(grants.attributes)) {
    if (plus) said.push(`${plus > 0 ? '+' : ''}${plus} ${attributeWord(key)}`);
  }
  if (grants.healthMax) {
    said.push(`${grants.healthMax > 0 ? '+' : ''}${grants.healthMax} max Health`);
  }
  return said;
}

function attributeWord(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/* ------------------------------------------------------------------- health */

/**
 * Health is the only pool allowed below zero. Past zero the character is
 * bleeding out, and a *second* full bar of damage — health reaching
 * −health_max — kills them outright.
 *
 * `percent` fills the bar with the health colour on the way down; once the
 * value turns negative `poison` takes over and refills it from empty, so a
 * solid green bar reads as dead.
 */
export function healthState(current, max) {
  const cap = Math.max(0, Math.round(Number(max) || 0));
  const hp = Math.round(Number(current) || 0);

  return {
    hp,
    cap,
    // The floor health can be dragged to.
    floor: -cap,
    dying: hp <= 0 && cap > 0,
    dead: cap > 0 && hp <= -cap,
    percent: cap > 0 ? Math.min(100, Math.max(0, (hp / cap) * 100)) : 0,
    poison: cap > 0 ? Math.min(100, Math.max(0, (-hp / cap) * 100)) : 0,
  };
}

/** True once a character has taken a full extra bar of damage past zero. */
export function isDead(character) {
  return healthState(character?.health, character?.health_max).dead;
}

/* ------------------------------------------------------------- derived sync */

/**
 * Columns that are never typed in — they are recomputed from attributes,
 * level and equipment. `defense` (Armor) comes from gear alone, but now that
 * gear is tracked on the row it is derived like the rest.
 */
const DERIVED_COLUMNS = [
  'health_max',
  'willpower_max',
  'avoid',
  'defense',
  'initiative',
  'speed_m',
  'reflex',
  'grit',
  'ap_max',
  'reaction_max',
];

/**
 * The patch needed to bring a stored row back in line with its own attributes,
 * or `null` when it already agrees. Called on every render of an editable
 * sheet, so raising Physique on the Advancement tab moves Health max on the
 * Character tab without anyone pressing "recalculate".
 *
 * Current pools are left where the player put them; they are only pulled back
 * when a shrinking maximum has stranded them out of range.
 */
export function syncDerived(character) {
  if (!character) return null;

  const level = levelForXp(character.xp);
  const derived = deriveStats({ ...character, level });
  const next = {};

  for (const key of DERIVED_COLUMNS) {
    if (Number(character[key]) !== derived[key]) next[key] = derived[key];
  }

  if (Number(character.level) !== level) next.level = level;
  if (Number(character.xp_max) !== xpForLevel(level)) next.xp_max = xpForLevel(level);

  // Nothing reads the column back, but its comment promises it stays on the
  // computed cap — so keep the promise instead of letting it stick at 25.
  if (Number(character.shield_max) !== derived.shield_cap) next.shield_max = derived.shield_cap;

  // Health may sit anywhere in [−max, max]; the rest bottom out at 0.
  const hp = clamp(character.health, -derived.health_max, derived.health_max);
  if (hp !== (Number(character.health) || 0)) next.health = hp;

  const shield = clamp(character.shield, 0, derived.shield_cap);
  if (shield !== (Number(character.shield) || 0)) next.shield = shield;

  const willpower = clamp(character.willpower, 0, derived.willpower_max);
  if (willpower !== (Number(character.willpower) || 0)) next.willpower = willpower;

  const ap = clamp(character.ap, 0, derived.ap_max);
  if (ap !== (Number(character.ap) || 0)) next.ap = ap;

  const reaction = clamp(character.reaction, 0, derived.reaction_max);
  if (reaction !== (Number(character.reaction) || 0)) next.reaction = reaction;

  return Object.keys(next).length > 0 ? next : null;
}

/** No attribute may be raised past this — gear and effects can still push it further. */
export const MAX_ATTRIBUTE = 12;

/* ---------------------------------------------------------------- experience */

export const MAX_LEVEL = 12;

/**
 * Cumulative XP needed to *reach* each level — `xp` on a character is the
 * lifetime total, never a per-level counter that resets.
 *
 * Every step costs more than the one before it: the climb from 11 to 12 is
 * worth seventeen level-1s, so late levels stay an event rather than a
 * formality.
 */
export const XP_TABLE = [
  null, // no level 0
  0,      // 1
  1000,   // 2   +1,000
  2500,   // 3   +1,500
  4500,   // 4   +2,000
  7500,   // 5   +3,000
  11500,  // 6   +4,000
  17000,  // 7   +5,500
  24000,  // 8   +7,000
  33000,  // 9   +9,000
  44000,  // 10  +11,000
  58000,  // 11  +14,000
  75000,  // 12  +17,000
];

function clampLevel(level) {
  return Math.min(MAX_LEVEL, Math.max(1, Math.floor(Number(level) || 1)));
}

/** The level a lifetime XP total buys, capped at the table's last row. */
export function levelForXp(xp) {
  const total = Math.max(0, Number(xp) || 0);
  let level = 1;
  for (let n = 2; n <= MAX_LEVEL; n += 1) {
    if (total < XP_TABLE[n]) break;
    level = n;
  }
  return level;
}

/**
 * Cumulative XP that opens the *next* level. At the cap it returns the level-12
 * threshold, so `xp_max` always holds a real number for the progress bars.
 */
export function xpForLevel(level) {
  const n = clampLevel(level);
  return n >= MAX_LEVEL ? XP_TABLE[MAX_LEVEL] : XP_TABLE[n + 1];
}

/** Everything the bars and badges need from a lifetime XP total. */
export function xpProgress(xp) {
  const total = Math.max(0, Number(xp) || 0);
  const level = levelForXp(total);
  const isMax = level >= MAX_LEVEL;
  const floor = XP_TABLE[level];
  const ceil = isMax ? XP_TABLE[MAX_LEVEL] : XP_TABLE[level + 1];
  const span = Math.max(1, ceil - floor);

  return {
    level,
    isMax,
    floor,
    ceil,
    total,
    into: total - floor,
    span,
    toNext: isMax ? 0 : Math.max(0, ceil - total),
    percent: isMax ? 100 : Math.min(100, ((total - floor) / span) * 100),
  };
}

/* -------------------------------------------------------------------- ledger */

/** Notes are a jotted reason ("boss kill", "bought rope"), not a diary entry. */
export const LEDGER_NOTE_MAX = 60;

/** Oldest entries fall off the end so a long campaign can't bloat the row. */
export const LEDGER_LIMIT = 200;

export function readLedger(character, kind) {
  const all = Array.isArray(character?.ledger) ? character.ledger : [];
  return all.filter((entry) => entry && entry.kind === kind);
}

export function appendLedger(character, entry) {
  const all = Array.isArray(character?.ledger) ? character.ledger : [];
  return [entry, ...all].slice(0, LEDGER_LIMIT);
}

export function newLedgerId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function clamp(value, min, max) {
  const n = Number(value) || 0;
  if (max === null || max === undefined) return Math.max(min, n);
  return Math.min(max, Math.max(min, n));
}

/** 4.5 -> "15ft" (Hazebound uses a 1m ≈ 3.3ft table, rounded to 5ft steps). */
export function metersToFeet(meters) {
  const feet = (Number(meters) || 0) * 3.28084;
  return Math.round(feet / 5) * 5;
}

export function formatSpeed(meters, unit) {
  return unit === 'imperial' ? `${metersToFeet(meters)}ft` : `${Number(meters) || 0}m`;
}

export function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(Number(n) || 0);
}

/** 1800 -> "1.8k" for the tight dashboard cards. */
export function compactNumber(n) {
  const v = Number(n) || 0;
  if (v < 1000) return String(v);
  return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
}

export function initialsOf(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}
