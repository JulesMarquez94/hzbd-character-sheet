/**
 * Shared shape + derived-stat rules for a Hazebound character.
 * Keeping the maths here means the sheet, the dashboard cards and the
 * creation form all agree on what a character is.
 */

import {
  EMPTY_EQUIPMENT,
  carryState,
  characterGrants,
  encumberedSpeed,
  equipmentEffects,
  gearEnchantIds,
} from './items.js';
import { ephemeralGrants, wornIds } from './enchanting.js';
import { pointCeilings } from './tricks.js';
import { martialDefense } from './moves.js';
import { feralArmor, feralShieldShare } from './feral.js';
import { spellbookWillpower } from './spellbook.js';
import { effectRiders, riderShift } from './riders.js';

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
  // Not read by the app — shield's cap is always computed from health_max, at
  // half of it for everybody and the whole of it for a Feral Cursed. syncDerived
  // keeps the column on that number so a raw row reads sensibly.
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
  // Rings, chains, cloaks — worn, and with no ceiling on how many. A plain list
  // rather than a slot map for exactly that reason; see normalizeTrinkets in
  // items.js. They count against Magic Burden and whatever is worked into one is
  // on the person wearing it.
  trinkets: [],
  // Items this player made, keyed by the instance id the rest of the sheet points
  // at: { "forged-a1b2": { base, ench, name, art } }. The item *instance* — what
  // lets two silver rings hold different workings, lets one be named, and lets one
  // be handed to another player as a code. forged.js owns the shape, and a sheet
  // that has never made one never writes the column.
  forged: {},

  // The background chosen at level 1. The plain name lives in the `background`
  // column above; these two are what it handed out. `background_skills` is the
  // list of skill ids picked from that background pool, and `background_kit` is the
  // record of the starting kit once it has been taken — what was granted, so
  // handing it back returns exactly what it gave — and null until then.
  background_skills: [],
  background_kit: null,

  talents: [],
  // The creatures a talent set has put on the board, keyed by the set that
  // granted one: { "draconic-bond": { name, scale, portrait_url, health,
  // shield, ap, reaction } }. Identity and pools together, because they are
  // the same creature. A pool that is absent reads as full. minions.js owns
  // the shape, and a sheet with no such set never writes the column.
  minions: {},
  // The forms a talent set can turn this character into, keyed by the set that
  // granted one: { "feral-curse": { beast, name, portrait_url, dc, on } }. A
  // Feral Cursed's identity and the state of their curse together — which
  // carnivore it is, where the Feral Rage difficulty has climbed to, and whether
  // they have given in. The form's *clock* is not here: it is the Shield pool,
  // because the card says "until all Shield is gone". feral.js owns the shape,
  // and a sheet with no such set never writes the column.
  feral: {},
  // Everything a level handed out that isn't a talent, keyed by the level that
  // granted it: the +2 / +1 spread at level 1, and an attribute point and a
  // learned skill at every odd level after. levelPicks.js owns the shape.
  level_picks: {},
  // How much of a limited card has been spent, keyed by the card: { "sprout-wings": 1 }.
  // A card that says you must rest before using it again carries `uses` and
  // `recharge` the way a flask on the belt carries `charges` and `recharge`, and
  // this is where the count of spent ones lives. Filled again by the rest the card
  // names. uses.js owns the shape, and a sheet holding nothing limited never
  // writes the column.
  card_uses: {},
  // Choices a card leaves to the player, keyed by the card that asks for one:
  // { "draconic-scales": "red", "innate-shadow": "gloom-spike" }. A card that
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
  // And how many columns they are laid out in. Every tab with a grid carries
  // its own: three is the shape the site was drawn for, one is a phone and nine
  // is a wall. See normalizeGridColumns.
  block_columns: 3,
  // Left-to-right order of the Abilities tab's blocks, by source id
  // ("lineage", "talent:mycomancer", "gear"). Unlike block_order this has no
  // fixed length: a source arrives when it is taken and leaves when it is
  // handed back. Empty means nobody has arranged them yet.
  ability_order: [],
  ability_columns: 3,
  // Left-to-right order of the Inventory tab's four fixed blocks, by block id
  // ("armor", "weapons", "trinkets", "belt"). Must be listed here: the save path
  // only writes columns named in this object (see pickCharacterFields in api.js).
  inventory_order: [],
  inventory_columns: 3,
};

/* -------------------------------------------------------------- block order */

/** The six blocks of the Character tab, in their factory order. */
export const SHEET_BLOCK_IDS = [1, 2, 3, 4, 5, 6];

/**
 * A stored order is only ever a hint: it may be missing, half-written by an
 * older build, or hold ids that no longer exist. Whatever comes in, this
 * returns every block this character actually has, exactly once — known ids
 * keep the order they were given and anything absent is appended in its
 * factory position.
 *
 * `extra` is the blocks that are not always there. The six numbered ones are
 * every character's; a talent set that puts a creature on the board adds two
 * more, named `minion:<set>` and `minion:<set>:bar` (see minionBlockIds in
 * minions.js), and one that turns its holder into something adds a single
 * `feral:<set>` (see feralBlockIds in feral.js). Those arrive when the set is
 * taken and leave when it is handed back, so they are matched the way
 * normalizeSourceOrder matches an Abilities tab that grew a block: still
 * present keeps its place, gone is dropped, and new is appended rather than
 * pushed into the middle of an arrangement somebody has already made.
 */
export function normalizeBlockOrder(value, extra = []) {
  let list = value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = null;
    }
  }

  const grown = new Set(extra.map(String));
  const order = [];

  for (const raw of Array.isArray(list) ? list : []) {
    const id = Number(raw);
    if (SHEET_BLOCK_IDS.includes(id)) {
      if (!order.includes(id)) order.push(id);
      continue;
    }
    const named = String(raw);
    if (grown.has(named) && !order.includes(named)) order.push(named);
  }

  for (const id of [...SHEET_BLOCK_IDS, ...grown]) {
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

/* ------------------------------------------------------------ grid columns */

/**
 * How many columns a tab's grid may take. Three is the shape everything on the
 * site was drawn for — a block is a hard 360x640 and three of them are the
 * measure every row above the grid is aligned to — and it stays the default.
 * One is the phone layout chosen deliberately, and nine is the widest wall the
 * arranger will draw.
 */
export const GRID_COLUMN_MIN = 1;
export const GRID_COLUMN_MAX = 9;
export const GRID_COLUMN_DEFAULT = 3;

/**
 * A stored count is only ever a hint, the way a stored order is: missing on a
 * character made before the column existed, a string out of an older build, or
 * a number nobody can lay out. Anything unreadable or below the minimum reads
 * as "not set" and comes back as the default rather than as one column, since a
 * zero in the database should not silently rebuild somebody's sheet as a strip.
 *
 * What comes back is a *ceiling*, not a promise. The grid takes this many
 * columns or as many as the window has room for, whichever is fewer, so a
 * canvas set to nine is nine on a wall and one on a phone. That clamp is
 * `--sheet-fit` in sheet.css, where the width is known.
 */
export function normalizeGridColumns(value) {
  const count = Math.round(Number(value));
  if (!Number.isFinite(count) || count < GRID_COLUMN_MIN) return GRID_COLUMN_DEFAULT;
  return Math.min(count, GRID_COLUMN_MAX);
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
 * **And so does a working in a ring.** That gap used to be open and it is closed
 * here: `characterGrants` reads all three places at once — the Enchanter's own
 * person, what is running on them for the hour, and what is worked into anything
 * they are wearing — with the same-source law applied once across the lot. Primal
 * Sense on two rings is one point of Instinct; a point from a lineage and a point
 * from a ring are different sources and both count.
 *
 * Five riders land here: an attribute (which moves everything it buys), and flat
 * points of maximum Health, maximum Willpower, Movement Speed and Armor. Anything
 * an enchantment does that is *not* one of those is a printed rule the table
 * plays — flight, walking on ceilings, coming back up on 1 Health — because
 * nothing on this sheet knows what a ceiling is or that a character went down.
 *
 * `extra` is the other kind: what is on them for the next hour and must never be
 * stored, because a stored bonus has no way of ever coming back off. Only
 * `liveCharacter` passes it, and only for what the sheet *shows*. See
 * enchanting.js.
 *
 * `running` is the third kind, and the newest: what is on the *tracker*. A card
 * whose printed text names a number this sheet holds moves that number for as
 * long as its row is on the block, whoever cast it. Same contract as `extra` and
 * for the same reason: only `liveCharacter` passes it, and nothing stored ever
 * carries it. See riders.js.
 *
 * It takes the whole character now rather than five named fields, because "what is
 * worked into what you are wearing" needs the equipment map, the trinkets and the
 * forge registry together. Every call site already spread a character in.
 */
export function deriveStats(character, extra = null, running = null) {
  const { physique, instinct, mind, level } = character;
  const worn = characterGrants(character).worn;

  const add = (key) =>
    (worn.attributes[key] ?? 0) +
    Math.floor(Number(extra?.attributes?.[key]) || 0) +
    Math.floor(Number(running?.attributes?.[key]) || 0);

  const p = (Number(physique) || 0) + add('physique');
  const i = (Number(instinct) || 0) + add('instinct');
  const m = (Number(mind) || 0) + add('mind');
  const lvl = Number(level) || 1;

  /* The flat riders, worn and running, summed once each. `extra` is only ever
     the ephemeral half; the worn half is already in `worn`. And `running` is
     whatever is on the tracker, which is a third source and adds like one. */
  const flat = (key) =>
    (worn[key] ?? 0) + (Number(extra?.[key]) || 0) + (Number(running?.[key]) || 0);

  const health_max = Math.floor(10 * lvl + 10 * p) + Math.floor(flat('healthMax'));
  const reflex = Math.floor(p + i);
  const grit = Math.floor(i + m);

  const gear = equipmentEffects(character);
  const points = pointCeilings(character?.talents);
  /* What everything they own weighs, against what they can shift. Read once
     here: it is the only thing on the sheet that can take a stat away rather
     than add to one, and Speed is what it takes.

     `p` and not the column, because the column is the level ledger's and a
     Bodily Vigor worked into a ring is worth ten kilos of capacity that only the
     bent number knows about. See carryCapacity in items.js. */
  const carry = carryState(character, p);

  /* Armor is worn pieces plus whatever has been laid on the wielder. Resilience
     grants "3 armor" and Armor is a stat, so it is one number: the meter reads it,
     and Heavy Armor's "half of Armor" rider reads the same one rather than a
     smaller Armor of its own. Flagged in data/README.md as an interaction the
     designer has not ruled on.

     And the hide, for a Feral Cursed who is wearing one. FERAL HIDE grants "half
     your Instinct" while the form is running, which is a share of an attribute
     rather than a flat number, so `i` goes down with the call: every worn and
     running bonus is already in it, and the unbent column is not. The form ends
     the instant its Shield runs out, so this comes off on the same render that
     empties the bar. See feral.js. */
  const armorTotal = gear.armorTotal + Math.floor(flat('armor')) + feralArmor(character, i);

  // Defense: the base attribute (or the set-bonus replacement), plus every
  // flat bonus worn, plus Heavy Armor's half-Armor rider.
  let avoidBase = i;
  if (gear.fullSet === 'Light Armor') avoidBase = reflex;
  if (gear.fullSet === 'Magic Armor') avoidBase = grit;
  let avoid = avoidBase + gear.defenseFlat;
  if (gear.fullSet === 'Heavy Armor') avoid += Math.floor(armorTotal / 2);
  /* And what the *weapon* in hand is worth. A Duelist's AGILE is the only card
     that grants Defense for what you are holding rather than for what you are
     wearing, and it is a condition the sheet can check, so it is checked here
     rather than printed on the card as a warning: swap to a two-hander and
     syncDerived takes the point straight back off. See moves.js. */
  avoid += martialDefense(character);
  /* And what is running on the tracker. BARKSKIN's "+1 Defense" is a point like
     any other, and it comes off on the render its row is dropped. */
  avoid += Math.floor(Number(running?.defense) || 0);

  /* The factor on the Movement Speed, applied to everything the Speed is already
     made of: GIANT GROWTH doubles the Speed you have, gear and all, rather than
     doubling the three metres everybody starts from. Then the load is applied,
     because being twice as big and twice as burdened is still burdened. */
  const stride = Number(running?.speedFactor) || 1;

  return {
    health_max,
    /* A shield's base cap is never independently set — it is always a share of
       health_max; worn gear (the Supreme Runed set) can raise it by Mind. The
       share is a half for everybody and the whole of it for a Feral Cursed, whose
       BESTIAL SENSE says so, which is the one thing that lets FERAL FORM's "twice
       as much Shield" actually pay twice. See shieldShareFor below. */
    shield_cap: shieldCap(health_max, shieldShareFor(character)) + (gear.shieldCapMind ? m : 0),
      /* And what a bound book is worth. An Arcanist's SPELLBOOK grants 4 Willpower
       a rank, which is the one thing on that track that is not about spells. Read
       off the set rather than the tracker, because it is a Novice passive and not
       a state: the Willpower is there before the first spell is written and stays
       after the book is full. See spellbook.js. */
    willpower_max: Math.floor(
      2 * lvl + 2 * m + 10 + flat('willpowerMax') + spellbookWillpower(character?.talents)
    ),
    avoid: Math.floor(avoid),
    defense: Math.floor(armorTotal),
    initiative: Math.floor(i + lvl),
    // Speed is the one value that stays a precise decimal — everything else
    // here rounds down.
    //
    // And the one value a load can take *off*: over your carry capacity it is
    // halved, and 30% over it is nothing at all. Applied here rather than left
    // as a note somebody has to remember, the same way a breastplate's Armor is
    // applied here. See encumberedSpeed in items.js.
    speed_m: encumberedSpeed((3 + i / 2 + flat('speed')) * stride, carry),
    /* Six for everybody, and seven for a Master Trickster: THRILLED is the only
       thing in the game that moves either ceiling, and both of these were a
       literal 6 before it existed. tricks.js reads the rank off the set and hands
       back the same shape whether or not the character has it. */
    ap_max: points.ap,
    reaction_max: points.reaction,
    reflex,
    grit,
  };
}

/** The share of maximum Health a Shield pool ceilings at for everybody. */
export const SHIELD_SHARE = 0.5;

/**
 * A share of `healthMax`, rounded down — the bare cap on a character's shield.
 *
 * Half of it unless a caller says otherwise, which is what it has always been.
 * The argument exists because BESTIAL SENSE moves the share rather than adding a
 * bonus: "your maximum Shield is now equal to your Health instead of half".
 */
export function shieldCap(healthMax, share = SHIELD_SHARE) {
  return Math.floor((Number(healthMax) || 0) * (Number(share) || SHIELD_SHARE));
}

/**
 * The share this character's Shield ceilings at: the half everybody has, or the
 * larger one a talent set grants them.
 *
 * `Math.max` and not a replacement, so a set that ever asked for *less* than half
 * could not quietly shrink a pool the rest of the sheet has always sized one way,
 * and so a set saying nothing costs nothing. feral.js hands back 0 for everybody
 * who holds no such set.
 */
function shieldShareFor(character) {
  return Math.max(SHIELD_SHARE, feralShieldShare(character));
}

/** The shield cap with worn gear applied — what the sheet should display. */
export function shieldCapFor(character) {
  const gear = equipmentEffects(character);
  const bonus = gear.shieldCapMind ? Math.floor(Number(character?.mind) || 0) : 0;
  return shieldCap(character?.health_max, shieldShareFor(character)) + bonus;
}

/**
 * How much Karma a character may hold: one per level, and no more.
 *
 * Deliberately not a derived *column*. There is no `karma_max` on the row and
 * nothing to keep in sync, because level already is the number: a column would
 * be a second copy of it able to fall out of step. Read it where the pill is
 * drawn and where the cap is enforced, the way `shieldCapFor` is read.
 */
export function karmaCap(character) {
  return Math.max(0, Math.floor(Number(character?.level) || 0));
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
 * A card on the tracker is the second thing that bends without storing, and it
 * bends for exactly the same reason: GIANT GROWTH doubles a Movement Speed for
 * ten turns, and a doubled column would still be doubled next week. So it comes
 * through here too, whether the character cast it or somebody else did.
 *
 * Hands back the character itself when nothing is running, so a sheet with no
 * enchantments and an empty tracker does no work and re-renders no more than it
 * used to.
 */
export function liveCharacter(character) {
  if (!character) return character;

  const grants = characterGrants(character);
  const running = effectRiders(character?.effects);
  if (!grants.any && !running) return character;

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
    const plus = (grants.attributes[key] ?? 0) + (running?.attributes[key] ?? 0);
    if (plus) bent[key] = (Number(character[key]) || 0) + plus;
  }

  /* Derived off the *stored* columns, with only the ephemeral part passed in:
     deriveStats reads the worn part out of the talents column itself, so handing
     it the bent attributes as well would count every worn enchantment twice. The
     tracker's riders are read off the effects column, which deriveStats can also
     see, and are handed in for the same reason: one read, one place. */
  const level = levelForXp(character.xp);
  return { ...bent, ...deriveStats({ ...character, level }, grants.ephemeral, running) };
}

/**
 * What is on this character that is not on their row, said in words.
 *
 * Only the temporary: a worn enchantment is permanent and the stored columns
 * already carry it, so what is worth flagging as *running* is the hour-long kind
 * and whatever is on the tracker. Empty when nothing is, which is nearly
 * everyone.
 *
 * The permanent ids go in so the same-source law can bite here too: an hour of
 * borrowed Primal Sense on somebody already wearing one moves nothing, and a row
 * saying "+1 Instinct" beside a tile that did not move would be the sheet
 * contradicting itself.
 *
 * A tracker row is named after its card rather than reduced to a number, because
 * that is the only name a reader can go and look up: "+1 Defense" says nothing
 * about where to take it off, and "Barkskin" says everything.
 */
export function liveShift(character) {
  const standing = [...wornIds(character?.talents), ...gearEnchantIds(character)];
  const grants = ephemeralGrants(character?.effects, standing);

  const said = [];
  for (const [key, plus] of Object.entries(grants.attributes)) {
    if (plus) said.push(`${plus > 0 ? '+' : ''}${plus} ${attributeWord(key)}`);
  }
  if (grants.healthMax) {
    said.push(`${grants.healthMax > 0 ? '+' : ''}${grants.healthMax} max Health`);
  }

  /* And the cards. Only the ones actually moving a tile: a row lending a die to
     the next swing is running, and it is not what any of these tiles is showing.
     See riders.js. */
  for (const { name, rider } of riderShift(character?.effects)) {
    said.push(`${name} (${rider.line})`);
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

  /* Karma's ceiling is the level itself, so it is capped off the level computed
     here rather than the stored column: a sheet that has just gained a level
     should be able to hold the extra point on the same render. */
  const karma = clamp(character.karma, 0, karmaCap({ level }));
  if (karma !== (Number(character.karma) || 0)) next.karma = karma;

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

/**
 * 11 -> 24.3 (pounds). Not snapped the way feet are.
 *
 * A distance rounds to 5ft steps because a battle map is drawn in them, and
 * nothing is measured off a grid here: a capacity is a running total that a
 * single potion can tip over, so the two sides of the switch have to agree about
 * which side of the line it lands on. One decimal, which is finer than any weight
 * in the codex and coarse enough to read.
 */
export function kgToPounds(kg) {
  return Math.round((Number(kg) || 0) * 2.20462 * 10) / 10;
}

/**
 * A weight split into its number and its unit, for a chip that sets the two in
 * different type: the number in the display face every other number on a row
 * wears, the unit in the body face beside it.
 *
 * The rounding lives here rather than in both, so `4 kg` on an item row and
 * `4 kg` in a tooltip can never disagree about the decimal.
 */
export function weightParts(kg, unit) {
  const imperial = unit === 'imperial';
  return {
    value: imperial ? kgToPounds(kg) : Math.round((Number(kg) || 0) * 100) / 100,
    unit: imperial ? 'lb' : 'kg',
  };
}

/**
 * A weight as the sheet writes it, in whichever unit the reader chose.
 *
 * Trailing zeroes go, so a bag of exactly 5 kg is `5 kg` and not `5.0 kg`. The
 * space is deliberate and the one difference from `formatSpeed`: `5.5m` reads,
 * and `5.5kg` does not.
 */
export function formatWeight(kg, unit) {
  const parts = weightParts(kg, unit);
  return `${parts.value} ${parts.unit}`;
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
