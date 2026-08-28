/**
 * Minions: the second body a talent set can put on the board.
 *
 * A Draconic Bond does not hand you cards, it hands you a *creature*. It has
 * its own attributes, its own Health, its own Action Points, and on your turn
 * you play it as well as yourself. Nothing else on the sheet works that way,
 * and the Developpement Notes say plainly that it will not be the only set that
 * does — so what a minion *is* lives here, generically, and what a particular
 * one is made of is a `minion` spec on the set in talents.js. Same split as
 * `loadout`, `brewing` and `enchanting`: talents.js describes, the resolver
 * resolves, and talents.js stays a leaf.
 *
 * ------------------------------------------------------------------ the rules
 * All of these are the Developpement Notes', transcribed rather than invented:
 *
 *   "The minion stats are all derived from the level, the minion is always the
 *    level of the character."
 *   "All the stats are derived the same" — Reflex, Grit, Initiative, Speed and
 *    the two point pools are the character's own formulas (see deriveStats in
 *    characterModel.js) run against the minion's own attributes.
 *   "The draconic ally has a Defense equal to its Grit."
 *   "The draconic ally health is 5 per level and 5 per physique."
 *   "The minion always uses his own action point and reaction point but uses
 *    the character willpower."
 *   "If its health reaches 0 it instantly is shown as dead, it cannot go in
 *    negative."
 *
 * Every number above is spec data, never hard-coded here: `base`, `growth`,
 * `health`, `defense`. A second set with a different creature writes a
 * different spec and nothing in this file changes.
 *
 * -------------------------------------------------------------------- storage
 * One `minions` jsonb column on the character, keyed by the set that granted
 * the creature:
 *
 *   { "draconic-bond": { name, scale, portrait_url, health, shield, ap, reaction, effects } }
 *
 * Identity, pools and whatever is running on it, because they are the same
 * creature and they are written from the same two blocks. Not on the talent
 * entry beside `picks`:
 * pools move several times a turn and the talents column is a record of what
 * levels bought, which should not be rewritten every time something takes a hit.
 *
 * A pool that is missing reads as full. That is what makes a creature that has
 * only just been named work without anything being written for it first, and it
 * is why every read below goes through `minionState`.
 *
 * ------------------------------------------------------------------- the cards
 * A set's cards are split by the sheet's own Tags column. Draconic Bond writes
 * `Draconic Ally` on the four cards the creature plays and `Draconic Bond` on
 * the five its bonded plays, so the split is the designer's and not a guess.
 * `spec.tag` is that word. Cards carrying it are the creature's: they are played
 * from its quick bar, paid out of its Action Points, and they are kept off the
 * character's own bar so that nothing is ever paid out of the wrong pool.
 *
 * This file reads the codex and the character. It writes nothing on its own —
 * every writer here hands back a patch body for somebody else to save.
 */

import { clamp, levelForXp } from './characterModel.js';
import { TALENTS, cardsThroughRank, getTalent, normalizeTalents } from './talents.js';

/* --------------------------------------------------------------- the spec */

/** The minion spec a set carries, or null for every set that grants no body. */
export function minionOf(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return set?.minion ?? null;
}

/** Every set this character holds that has put a creature on the board. */
export function minionSets(talents) {
  return normalizeTalents(talents)
    .map((entry) => {
      const talent = getTalent(entry.id);
      const spec = minionOf(talent);
      return spec ? { talent, spec, entry } : null;
    })
    .filter(Boolean);
}

/**
 * The tags every minion spec in the codex claims for its creature.
 *
 * Read across the whole codex rather than off one set, because the question the
 * quick bar asks is "is this card mine to play", and the answer is no if it
 * belongs to *any* creature. Built once at module load: `knownGroups` asks it
 * of every card a character holds, on every render of the quick bar.
 */
export const MINION_TAGS = new Set(
  TALENTS.map((talent) => talent.minion?.tag).filter(Boolean)
);

/** True for a card some creature plays rather than the character holding it. */
export function isMinionCard(card) {
  return (card?.tags ?? []).some((tag) => MINION_TAGS.has(tag));
}

/* --------------------------------------------------------- what a level buys */

/**
 * The creature's three attributes at a level.
 *
 * `base` is its level-1 spread and `growth` is what each level after that adds:
 * a list for odd levels and a list for even ones, each cycled in order. Draconic
 * Bond writes `odd: ['mind']` and `even: ['physique', 'instinct']`, which is the
 * Notes' "every uneven level he gains 1 Mind, and every even level he gains
 * 1 Physique or 1 Instinct, alternating between the two" said as data.
 *
 * Cycling rather than a table so that a creature which alternates over three
 * attributes, or gains two things on one level, needs no code here.
 */
export function minionAttributes(spec, level) {
  const top = Math.max(1, Math.floor(Number(level) || 1));
  const values = { physique: 0, instinct: 0, mind: 0, ...(spec?.base ?? {}) };

  const odd = spec?.growth?.odd ?? [];
  const even = spec?.growth?.even ?? [];
  let odds = 0;
  let evens = 0;

  for (let n = 2; n <= top; n += 1) {
    const list = n % 2 === 0 ? even : odd;
    if (list.length === 0) continue;
    const key = n % 2 === 0 ? list[evens % list.length] : list[odds % list.length];
    values[key] = (values[key] ?? 0) + 1;
    if (n % 2 === 0) evens += 1;
    else odds += 1;
  }

  return values;
}

/**
 * Everything the creature's attributes and level buy it.
 *
 * Deliberately the same shape `deriveStats` hands back for a character, and the
 * same arithmetic wherever the Notes say "the rest is the same", so the two
 * blocks can print their numbers with the very same tiles. Two lines differ, and
 * both are the spec's:
 *
 *   Health   `health.perLevel` per level and `health.perPhysique` per Physique,
 *            where a character gets ten of each.
 *   Defense  the attribute or defense named by `spec.defense` — Grit, for a
 *            draconic ally — where a character's is Instinct plus armor.
 *
 * Armor is flat zero: a creature wears no gear, and there is nowhere on the
 * sheet to give it any.
 */
export function minionDerived(spec, attributes, level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1));
  const p = Math.floor(Number(attributes?.physique) || 0);
  const i = Math.floor(Number(attributes?.instinct) || 0);
  const m = Math.floor(Number(attributes?.mind) || 0);

  const reflex = p + i;
  const grit = i + m;

  const perLevel = Number(spec?.health?.perLevel) || 0;
  const perPhysique = Number(spec?.health?.perPhysique) || 0;
  const health_max = Math.max(1, Math.floor(perLevel * lvl + perPhysique * p));

  const avoid = { grit, reflex, physique: p, instinct: i, mind: m }[spec?.defense ?? 'instinct'] ?? i;

  return {
    health_max,
    shield_cap: Math.floor(health_max / 2),
    avoid: Math.floor(avoid),
    defense: 0,
    initiative: i + lvl,
    // The one value that keeps its half, exactly as a character's does.
    speed_m: 3 + i / 2,
    ap_max: 6,
    reaction_max: 6,
    reflex,
    grit,
  };
}

/* -------------------------------------------------------------- the column */

const POOLS = ['health', 'shield', 'ap', 'reaction'];

/* As long a list of running effects as one creature's row will carry. The same
   ceiling combatTurn.js puts on a character's own tracker, repeated rather than
   imported: this file is below that one and stays there. */
const EFFECTS_MAX = 40;

/**
 * A stored `minions` value is only ever a hint: it may be a JSON string, hold
 * sets this build has never heard of, or carry pools written by an older rule.
 * Whatever comes in, this hands back a plain object of plain rows.
 *
 * A pool that is absent stays absent rather than becoming a zero — absent means
 * "full", and a creature named a moment ago has none of them written yet.
 *
 * The creature's `effects` are carried through as rows rather than repaired
 * here. What an effect *is* belongs to combatTurn.js, which is above this file
 * and must stay there, so every reader of this list runs it through that file's
 * own `normalizeEffects` — the block that draws it, and the three writers that
 * change it. All this does is refuse anything that is plainly not a list of
 * rows, and keep the list to a length one row can hold.
 */
export function normalizeMinions(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {};

  const clean = {};
  for (const [id, raw] of Object.entries(source)) {
    if (!raw || typeof raw !== 'object') continue;

    const row = {};
    if (typeof raw.name === 'string' && raw.name.trim()) row.name = raw.name.trim().slice(0, 60);
    if (typeof raw.scale === 'string' && raw.scale.trim()) row.scale = raw.scale.trim();
    if (typeof raw.portrait_url === 'string' && raw.portrait_url.trim()) {
      row.portrait_url = raw.portrait_url.trim();
    }
    for (const pool of POOLS) {
      const n = Number(raw[pool]);
      if (Number.isFinite(n)) row[pool] = Math.floor(n);
    }
    if (Array.isArray(raw.effects)) {
      const rows = raw.effects.filter((entry) => entry && typeof entry === 'object');
      if (rows.length > 0) row.effects = rows.slice(0, EFFECTS_MAX);
    }
    clean[id] = row;
  }
  return clean;
}

/* --------------------------------------------------------------- the state */

/** The scale (or whatever the spec calls its colour choice) this one wears. */
function scaleOf(spec, id) {
  const options = spec?.scales?.options ?? [];
  return options.find((option) => option.id === id) ?? null;
}

/**
 * Every creature this character has, ready to be drawn.
 *
 * One row per set that grants one, whether or not it has been named yet: a
 * creature you have not named is still standing there, and the blocks are what
 * ask you to name it.
 */
export function minionState(character) {
  if (!character) return [];

  const level = levelForXp(character.xp);
  const stored = normalizeMinions(character.minions);

  return minionSets(character.talents).map(({ talent, spec, entry }) => {
    const row = stored[talent.id] ?? {};
    const attributes = minionAttributes(spec, level);
    const stats = minionDerived(spec, attributes, level);

    /* A missing pool is a full one. Health is clamped rather than repaired on
       the row: a level lost shrinks the ceiling, and a stored number above it
       should read as the ceiling rather than sit there being impossible. */
    const health = clamp(row.health ?? stats.health_max, spec.floor ?? 0, stats.health_max);
    const shield = clamp(row.shield ?? 0, 0, stats.shield_cap);
    const ap = clamp(row.ap ?? stats.ap_max, 0, stats.ap_max);
    const reaction = clamp(row.reaction ?? 0, 0, stats.reaction_max);

    const scale = scaleOf(spec, row.scale);
    const rank = entry.rank;

    return {
      id: talent.id,
      talent,
      spec,
      entry,
      rank,
      level,
      name: row.name ?? '',
      named: Boolean(row.name),
      scale,
      portrait_url: row.portrait_url ?? null,
      attributes,
      stats,
      health,
      shield,
      ap,
      reaction,
      /* What is running on the creature. Its own list and not its bonded's: a
         Frightened dragon is not a frightened drifter. Rows as stored — the
         block runs them through normalizeEffects, for the reason given above
         normalizeMinions. */
      effects: row.effects ?? [],
      /* "If its health reaches 0 it instantly is shown as dead." The card that
         grants it, ONE AND THE SAME, is what says the rest: it retreats into
         your shadow rather than being gone for good. */
      down: health <= 0,
      /* What the creature does to its own cards: the damage its scales are made
         of, and whatever its ranks have Elevated. `actor` is what makes the
         numbers on those cards *its* numbers rather than its bonded's. */
      cards: minionCards(talent, rank, spec),
      title: row.name || spec.label,
    };
  });
}

/** The cards this creature plays: the set's own, tagged with the creature's tag. */
export function minionCards(talent, rank, spec = null) {
  const tag = (spec ?? minionOf(talent))?.tag;
  if (!tag) return [];
  return cardsThroughRank(talent, rank).filter((card) => (card.tags ?? []).includes(tag));
}

/**
 * The creature as a *character*, so that everything on the sheet that already
 * knows how to read one can read it.
 *
 * This is the whole trick of the block. `AbilityCard` prints "2d4 + Mind" as a
 * number by resolving it against a character; `UsePrompt` decides whether a
 * cost can be paid by reading pools off a character. Hand either of them this
 * and Wyrm Bolt prints the *ally's* Mind and is refused when the *ally* is out
 * of Action Points, with no second copy of either component.
 *
 * Willpower is the one borrowed field: "the minion always uses his own action
 * point and reaction point but uses the character willpower", so the pool the
 * prompt checks and the pool the spend comes out of are both the bonded's.
 */
export function minionActor(character, minion) {
  return {
    ...minion.attributes,
    ...minion.stats,
    name: minion.title,
    level: minion.level,
    health: minion.health,
    shield: minion.shield,
    ap: minion.ap,
    reaction: minion.reaction,
    willpower: Number(character?.willpower) || 0,
    willpower_max: Number(character?.willpower_max) || 0,
    /* And its own tracker, because a use can now lay a row on it: a creature
       casting something that lasts is a creature with something running on it,
       and the block beside its bar is where that shows. Read off the creature's
       row and never off the character's `effects` column, which is the same line
       `setMinionEffects` draws below. See `castEffect` in combatBar.js, and
       `minionSpend`, which is what sends the answer back to the right sheet. */
    effects: minion.effects ?? [],
  };
}

/**
 * What this creature does to the cards it plays: whose numbers they print, what
 * its damage is made of, and how far its ranks have Elevated it.
 *
 * `elevate` is EMPOWERED BOND's "its damage is Elevated by 1", carried on the
 * spec indexed by rank the way `loadout.known` is, so the rule is read off the
 * card once and never parsed out of its prose.
 */
export function minionModifiers(character, minion) {
  const elevate = minion.spec?.elevate?.[minion.rank] ?? 0;

  return {
    actor: minionActor(character, minion),
    damage: minion.scale?.damage ? [minion.scale.damage] : [],
    elevate,
  };
}

/**
 * Whether a creature has been answered for: named, and given whatever colour
 * its spec asks for.
 *
 * The Advancement tab counts this the way it counts a lineage card's unanswered
 * question (see lineageSettled in levelPicks.js), so a bond taken and never
 * named wears the same badge as a spell slot left empty. A spec that asks for no
 * colour needs only the name.
 */
export function minionSettled(character, id) {
  const row = normalizeMinions(character?.minions)[id] ?? {};
  const spec = minionOf(id);
  if (!row.name) return false;
  if (spec?.scales?.options?.length && !scaleOf(spec, row.scale)) return false;
  return true;
}

/** The two blocks a creature adds to the Character tab, in their factory order. */
export function minionBlockIds(character) {
  return minionState(character).flatMap((minion) => [
    `minion:${minion.id}`,
    `minion:${minion.id}:bar`,
  ]);
}

/** The creature a block id names, and which of its two blocks that is. */
export function minionForBlock(list, id) {
  const match = /^minion:([^:]+)(?::(bar))?$/.exec(String(id));
  if (!match) return null;
  const minion = list.find((row) => row.id === match[1]);
  return minion ? { minion, part: match[2] ?? 'stats' } : null;
}

/* -------------------------------------------------------------- the writers */

/**
 * One creature's stored row with `body` written over it, as a patch.
 *
 * Three kinds of value, and the difference between the first two is the whole
 * reason this is a loop rather than a spread:
 *
 *   undefined   not part of this write. The naming window sends one field at a
 *               time and leaves the other two out of the object; a spread would
 *               put `undefined` in the row and the clean-up below would read
 *               that as a clear, so typing a name deleted the picture and the
 *               scale colour with it.
 *   null or ''  a clear, and meant as one. That is the picture field emptied by
 *               hand, which has to actually empty.
 *   anything    stored.
 */
export function writeMinion(character, id, body) {
  const stored = normalizeMinions(character?.minions);
  const row = { ...(stored[id] ?? {}) };

  for (const [key, value] of Object.entries(body ?? {})) {
    if (value === undefined) continue;
    if (value === null || value === '') delete row[key];
    else row[key] = value;
  }

  return { minions: { ...stored, [id]: row } };
}

/** What the naming window writes: who it is, what colour, and its picture. */
export function setMinionIdentity(character, id, { name, scale, portrait_url }) {
  return writeMinion(character, id, {
    name: typeof name === 'string' ? name.trim().slice(0, 60) : undefined,
    scale: scale ?? undefined,
    portrait_url: typeof portrait_url === 'string' ? portrait_url.trim() : undefined,
  });
}

/**
 * The creature's own tracker replaced by `list`.
 *
 * The list itself is built by combatTurn.js's `addEffect`, `nudgeEffect` and
 * `dropEffect` — the very functions the character's tracker is built with, so a
 * row on a creature is the same kind of row as a row on its bonded and neither
 * block has a private idea of what an effect is. All this does is put the
 * answer on the creature's row instead of the character's `effects` column.
 */
export function setMinionEffects(character, id, list) {
  return writeMinion(character, id, { effects: Array.isArray(list) && list.length > 0 ? list : null });
}

/** One pool moved, held inside what the creature can actually hold. */
export function setMinionPool(character, minion, pool, value) {
  const caps = {
    health: [minion.spec.floor ?? 0, minion.stats.health_max],
    shield: [0, minion.stats.shield_cap],
    ap: [0, minion.stats.ap_max],
    reaction: [0, minion.stats.reaction_max],
  }[pool];
  if (!caps) return null;

  return writeMinion(character, minion.id, { [pool]: clamp(value, caps[0], caps[1]) });
}

/** What a use writes onto the creature's row rather than onto its bonded's. */
const MINION_KEYS = new Set(['ap', 'reaction', 'effects']);

/**
 * A use the creature paid for, as one patch: its points off its own pools, and
 * the Willpower off its bonded's.
 *
 * `spendUse` in combatBar.js already worked out what the use costs, against the
 * actor. All this does is send each half where it belongs, so a use played from
 * the creature's bar writes exactly one row and can never take Action Points off
 * the wrong sheet.
 *
 * `effects` goes the creature's way for the same reason its points do. A use
 * that lasts now lays its own row the moment it is paid for, and a creature's
 * rows live on the creature (see `setMinionEffects`): a spell the ally kept up
 * writing itself onto its bonded's tracker would be counting down on the wrong
 * block, and taking a turn off it on the wrong press.
 *
 * The Willpower is the one thing that crosses back, because it always did: an
 * ally spends its bonded's.
 */
export function minionSpend(character, minion, body) {
  const mine = {};
  const theirs = {};

  for (const [key, value] of Object.entries(body ?? {})) {
    if (MINION_KEYS.has(key)) theirs[key] = value;
    else mine[key] = value;
  }

  return Object.keys(theirs).length > 0
    ? { ...mine, ...writeMinion(character, minion.id, theirs) }
    : mine;
}

/* ---------------------------------------------------- rests and the fight */

/** Whether a tick actually moved anything: same rows, same counts left. */
function sameCount(before, after) {
  if (before.length !== after.length) return false;
  return before.every((row, at) => row?.id === after[at]?.id && row?.turns === after[at]?.turns);
}

/**
 * Every creature's Action Points back to full and its Reaction Points emptied,
 * for the start of a fight.
 *
 * The same rule the character's own pools follow at the bell: reactions are
 * earned inside a round, so a fight begins with none of them. Returns null when
 * there is nothing on the board, so a sheet with no creature writes no column.
 *
 * `tick` is what a turn does to a list of running effects, handed in by
 * combatTurn.js rather than written again here. A creature has no turn of its
 * own — "during your turn, you also control your draconic ally" — so its
 * tracker counts down on its bonded's Start Turn and nowhere else, and the one
 * rule for what counting down means stays in the one file that owns it.
 */
export function refillMinions(character, { reaction = false, tick = null } = {}) {
  const list = minionState(character);
  if (list.length === 0) return null;

  const stored = normalizeMinions(character.minions);
  const next = { ...stored };
  let moved = false;

  for (const minion of list) {
    // A creature that is down stays down. It comes back on a Long Rest and
    // nowhere else, which is ONE AND THE SAME's own rule.
    if (minion.down) continue;

    /* Its tracker runs whether or not its points moved: an effect with a turn
       left on it has to spend that turn even on a turn the creature does
       nothing with. A list of nothing but open-ended rows comes back the same,
       and a tick that changed nothing is not a reason to write the column. */
    const rolled = tick && minion.effects.length > 0 ? tick(minion.effects) : null;
    const ticked = rolled && !sameCount(minion.effects, rolled) ? rolled : null;
    const pools = minion.ap !== minion.stats.ap_max || (reaction && minion.reaction > 0);
    if (!pools && !ticked) continue;

    next[minion.id] = {
      ...(next[minion.id] ?? {}),
      ap: minion.stats.ap_max,
      ...(reaction ? { reaction: 0 } : {}),
      ...(ticked ? { effects: ticked } : {}),
    };
    moved = true;
  }

  // Nothing to give back is no write at all: a bell rung with everything
  // already full should not rewrite the column.
  return moved ? { minions: next } : null;
}

/**
 * What a rest gives every creature back, as lines for the rest window and the
 * patch that carries them out.
 *
 * A creature is restored by whichever rest its spec names in `returns`, which
 * for a draconic ally is the long one: "if it would die, it instead retreats
 * into your shadow and is unable to reemerge until you take a Long Rest". A
 * short rest is offered nothing, because the card never printed one.
 *
 * `ends` is which durations this rest puts an end to, handed in by rest.js from
 * the rest's own entry. A creature has no rest of its own — it rests when its
 * bonded does — so what a rest ends on its tracker is decided there and applied
 * here, in the one write that also touches its Health.
 */
export function minionRest(character, kind, ends = []) {
  const list = minionState(character);
  if (list.length === 0) return null;

  const stored = normalizeMinions(character.minions);
  const next = { ...stored };
  const lines = [];
  let moved = false;

  for (const minion of list) {
    /* What the rest ends is asked of every creature, whatever rest brings this
       one back: a short rest that restores nothing still ends what it ends. */
    const ending = minion.effects.filter((effect) => effect?.until && ends.includes(effect.until));

    if (ending.length > 0) {
      const kept = minion.effects.filter((effect) => !ending.includes(effect));
      next[minion.id] = { ...(next[minion.id] ?? {}), effects: kept };
      if (kept.length === 0) delete next[minion.id].effects;
      moved = true;

      lines.push({
        key: `minion-fx-${minion.id}`,
        label: `${minion.title}: ${ending.length} ${ending.length === 1 ? 'effect ends' : 'effects end'}`,
        detail: ending.map((effect) => effect.name).join(', '),
        tone: 'end',
      });
    }

    if ((minion.spec.returns ?? 'long') !== kind) continue;

    const full = minion.stats.health_max;
    const back = full - minion.health;
    if (back === 0 && minion.ap === minion.stats.ap_max) continue;

    next[minion.id] = { ...(next[minion.id] ?? {}), health: full, ap: minion.stats.ap_max };
    moved = true;

    if (minion.down) {
      lines.push({
        key: `minion-${minion.id}`,
        label: `${minion.title} comes back`,
        detail: `Out of your shadow, and back to ${full} Health.`,
        tone: 'gain',
      });
    } else if (back > 0) {
      lines.push({
        key: `minion-${minion.id}`,
        label: `${minion.title}: +${back} Health`,
        detail: `Back to ${full}, the same as you.`,
        tone: 'gain',
      });
    }
  }

  // A rest that gave a creature nothing writes nothing, so a short rest never
  // touches the column and a long one only touches it when something was owed.
  return moved ? { lines, patch: { minions: next } } : null;
}
