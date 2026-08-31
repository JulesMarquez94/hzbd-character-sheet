/**
 * Encounters: the enemies actually on the table tonight, and the fight itself.
 *
 * creatures.js is the printed page and never changes. This is the *instance*: a
 * Blightgeist at level 5 with 3 Health left, the second of six, with a ward
 * already broken and something running on it. One encounter is a named pile of
 * those, owned by the Game Master, on one campaign.
 *
 * Jules, 2026-08-31: "a feature that can be used to create encounter. Encounter
 * are grouping of enemies we will use later for player to setup combat." And
 * then: "when you have built an encounter you can run it which will take control
 * of the character turn start and end."
 *
 * So there are two halves here. The **pile**, which is the grouping, and the
 * **run**, which is the fight it becomes.
 *
 * ------------------------------------------------------------------- the row
 * One `encounters` row per encounter, on the campaign, with the whole pile in
 * one `foes` jsonb column and the fight in one `run`:
 *
 *   foes  [{ key, creature, level, name, health, shield, ap, reaction,
 *            willpower, effects, broken }]
 *   run   { live, round, at, order, awaiting }
 *
 * One column rather than a row per enemy, for the reason the character sheet
 * keeps its minions in one: six goblins losing Health across one turn is six
 * writes to one row instead of six rows, every reader gets a consistent picture
 * of the whole fight in one payload, and adding an enemy needs no policy of its
 * own. The ceiling is what pays for it, and it is generous: `FOES_MAX` below.
 *
 * **A pool that is absent reads as full.** The same law minions.js keeps, for
 * the same reason: an enemy dropped onto the table a moment ago has nothing
 * written for it and must still stand there at full Health. Shield and Reaction
 * Points are the two that start empty, exactly as a character's do at the bell.
 *
 * ------------------------------------------------------------------ the level
 * "All enemies should have a level scale option", 2026-08-31, and the level is
 * the *instance's* rather than the creature's: a Blightgeist is level 1 in the
 * crypt and level 9 in the vault, and it is the same Blightgeist. `level` on the
 * foe row, absent meaning the level the creature was written at.
 *
 * **Changing it empties the pools**, which is not laziness: a level 9
 * Blightgeist has six times the Health of a level 1 one, and 4 of 52 is not a
 * sensible reading of "it had taken four damage". A different level is a
 * different body.
 *
 * ---------------------------------------------------------------- who writes
 * The Game Master, and only them. The read policy in schema.sql is the same:
 * an encounter is not visible to the players at the table, because half of what
 * is on it is the answer to "how much has the boss got left". Jules's ruling of
 * 2026-08-31. What *is* visible to a player is their own turn, and that crosses
 * as an event rather than as a read of this row. See campaignLog.js.
 *
 * ------------------------------------------------------------- the two rules
 * Two of the three ranks have a rule this file is the only enforcer of:
 *
 *   A Minion has no Reaction Points. `creatureStats` forces the ceiling to
 *   zero, so `setFoePool` clamps every write to it and the pips draw an empty
 *   row. It cannot be handed any by anything.
 *
 *   An Overlord gains 3 Reaction Points every time a player takes a turn.
 *   `crossTurn` is that. The runner fires it the moment the order lands on a
 *   player, and it stays a button for a table running the fight by hand.
 *
 * This file reads the codex and the encounter row. Every writer hands back a
 * patch body for somebody else to save, exactly as minions.js does, except the
 * four at the foot which talk to the database.
 */

import { requireSupabase } from './supabaseClient.js';
import { clamp } from './characterModel.js';
import { rollCheck } from './dice.js';
import {
  RANKS,
  clampCreatureLevel,
  creatureMoves,
  creaturePassives,
  creatureStats,
  creatureWards,
  getCreature,
  getRank,
} from './creatures.js';

/** As many enemies as one encounter's column will carry. */
export const FOES_MAX = 60;

/** As long a list of running effects as one enemy will carry. Minions' ceiling. */
const EFFECTS_MAX = 40;

/** The pools an enemy owns. Willpower is one of them, unlike a bonded minion's. */
const POOLS = ['health', 'shield', 'ap', 'reaction', 'willpower'];

/* --------------------------------------------------------------- the column */

/** Eight characters of nothing, unique inside one encounter. Not an id anybody
    types or reads: it is what tells the second Blightgeist from the fourth. */
export function foeKey() {
  const draws = new Uint32Array(2);
  crypto.getRandomValues(draws);
  return Array.from(draws, (n) => n.toString(36).padStart(7, '0').slice(-4)).join('');
}

/**
 * A stored `foes` value is only ever a hint: it may be a JSON string, name
 * creatures this build has never heard of, or carry pools written by an older
 * rule. Whatever comes in, this hands back a plain list of plain rows.
 *
 * A pool that is absent stays absent rather than becoming a zero. Absent means
 * "full", and an enemy laid down a moment ago has none of them written yet.
 *
 * Effects are carried through as rows rather than repaired here. What an effect
 * *is* belongs to combatTurn.js, which is above this file and must stay there,
 * so every reader runs the list through that file's own `normalizeEffects`.
 */
export function normalizeFoes(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!Array.isArray(source)) return [];

  const clean = [];
  const seen = new Set();

  for (const raw of source) {
    if (!raw || typeof raw !== 'object') continue;
    if (!getCreature(raw.creature)) continue;

    /* A key that collided, or that was never written, is minted here. Two rows
       sharing one would be two enemies the block could not tell apart, and
       every write below is keyed on it. */
    let key = typeof raw.key === 'string' && raw.key.trim() ? raw.key.trim().slice(0, 16) : '';
    if (!key || seen.has(key)) key = foeKey();
    seen.add(key);

    const row = { key, creature: String(raw.creature) };
    if (typeof raw.name === 'string' && raw.name.trim()) row.name = raw.name.trim().slice(0, 60);

    // Absent is "the level it was written at", which encounterState resolves.
    if (Number.isFinite(Number(raw.level))) row.level = clampCreatureLevel(raw.level);

    for (const pool of POOLS) {
      const n = Number(raw[pool]);
      if (Number.isFinite(n)) row[pool] = Math.floor(n);
    }

    if (Array.isArray(raw.effects)) {
      const rows = raw.effects.filter((entry) => entry && typeof entry === 'object');
      if (rows.length > 0) row.effects = rows.slice(0, EFFECTS_MAX);
    }

    /* Which of its environmental passives have been switched off. Card ids, so
       a ward renamed in the codex simply stops matching and the passive comes
       back on rather than the row becoming unreadable. */
    if (Array.isArray(raw.broken)) {
      const ids = raw.broken.filter((id) => typeof id === 'string' && id.trim());
      if (ids.length > 0) row.broken = [...new Set(ids)].slice(0, 12);
    }

    clean.push(row);
    if (clean.length >= FOES_MAX) break;
  }

  return clean;
}

/* ---------------------------------------------------------------- the state */

/**
 * Every enemy in an encounter, ready to be drawn.
 *
 * The auto-numbering is the part worth explaining. Six Blightgeists all called
 * "Blightgeist" are six blocks nobody can tell apart, and "their number is the
 * danger" means six is a normal count. So where a creature appears more than
 * once and has not been named by hand, its copies are numbered in the order they
 * were laid down: Blightgeist 1 through 6. One on its own keeps its plain name,
 * because "Vaultkeeper Lich 1" is worse than "Vaultkeeper Lich".
 */
export function encounterState(encounter) {
  const foes = normalizeFoes(encounter?.foes);

  // How many of each creature are here, so a lone one is not numbered.
  const total = new Map();
  for (const row of foes) total.set(row.creature, (total.get(row.creature) ?? 0) + 1);

  const seen = new Map();

  return foes.map((row) => {
    const creature = getCreature(row.creature);
    const rank = getRank(creature);
    const level = clampCreatureLevel(row.level ?? creature.level);
    const stats = creatureStats(creature, level);

    const nth = (seen.get(row.creature) ?? 0) + 1;
    seen.set(row.creature, nth);
    const numbered = total.get(row.creature) > 1 ? `${creature.name} ${nth}` : creature.name;

    /* Absent is full, and Health is clamped rather than repaired on the row: a
       stored number above a ceiling should read as the ceiling rather than sit
       there being impossible. */
    const health = clamp(row.health ?? stats.health_max, 0, stats.health_max);
    const shield = clamp(row.shield ?? 0, 0, stats.shield_cap);
    const ap = clamp(row.ap ?? stats.ap_max, 0, stats.ap_max);
    const reaction = clamp(row.reaction ?? 0, 0, stats.reaction_max);
    const willpower = clamp(row.willpower ?? stats.willpower_max, 0, stats.willpower_max);

    const broken = new Set(row.broken ?? []);

    return {
      key: row.key,
      creature,
      rank,
      stats,
      level,
      // Whether this one has been moved off the level its page was written at.
      scaled: level !== creature.level,
      /* Its three attributes at *this* level. Read off the stats rather than the
         creature, because a creature no longer carries any. */
      attributes: stats.attributes,
      /* What it is called on the block. The hand-typed name wins, then the
         numbered one, and `title` is what the log and the tracker sign. */
      name: row.name ?? '',
      named: Boolean(row.name),
      title: row.name || numbered,
      nth,
      health,
      shield,
      ap,
      reaction,
      willpower,
      effects: row.effects ?? [],
      broken,
      /* Down at zero, and it stays on the board: a body the party can still see
         is a body worth drawing, and clearing it away is the Game Master
         pressing Remove. Nothing goes negative. */
      down: health <= 0,
      moves: creatureMoves(creature),
      passives: creaturePassives(creature),
      wards: creatureWards(creature),
    };
  });
}

/**
 * A creature as an untouched enemy, for the Bestiary tab.
 *
 * The bestiary draws the same double block the encounter does, because the ask
 * was for one enemy block and a second one that only *looked* like it would
 * drift within a month. So the printed page is dressed as an instance nothing
 * has happened to yet: full pools, nothing running, every ward standing. It has
 * no encounter behind it and the block is handed `readOnly`, so none of the
 * writers can be reached from there.
 */
export function previewFoe(creature, level = null) {
  if (!creature) return null;
  return encounterState({
    foes: [{ key: `codex-${creature.id}`, creature: creature.id, level: level ?? creature.level }],
  })[0];
}

/**
 * How many of each rank are in the pile: "5 Minions · 1 General · 2 Overlords".
 *
 * In RANKS order rather than in the order they were added, because this is a
 * summary and a summary read twice has to read the same way both times. The
 * blocks themselves stay in the order the Game Master laid them down, which is
 * their choice to make.
 */
export function encounterTally(encounter) {
  const counts = new Map();
  for (const foe of encounterState(encounter)) {
    counts.set(foe.rank.id, (counts.get(foe.rank.id) ?? 0) + 1);
  }
  return RANKS.filter((rank) => counts.has(rank.id)).map((rank) => ({
    rank,
    count: counts.get(rank.id),
  }));
}

/**
 * The enemy as a *character*, so everything on the site that already knows how
 * to read one can read it.
 *
 * The same trick `minionActor` plays and for the same reason: AbilityCard prints
 * "2d6 + Mind" by resolving it against a character, and UsePrompt decides whether
 * a cost can be paid by reading pools off a character. Hand either of them this
 * and Withering Word prints the *lich's* Mind and is refused when the *lich* is
 * out of Willpower, with no second copy of either component.
 *
 * Nothing is borrowed here, which is the one difference from a bonded minion. An
 * enemy has its own Willpower (Jules, 2026-08-31: "They have willpower"), so
 * every pool the prompt checks is its own and the whole spend lands on its own
 * row.
 */
export function foeActor(foe) {
  return {
    ...foe.attributes,
    ...foe.stats,
    name: foe.title,
    level: foe.level,
    health: foe.health,
    shield: foe.shield,
    ap: foe.ap,
    reaction: foe.reaction,
    willpower: foe.willpower,
    willpower_max: foe.stats.willpower_max,
    portrait_url: foe.creature.portrait_url ?? null,
    // Its own tracker, because a use can now lay a row on it.
    effects: foe.effects ?? [],
  };
}

/* -------------------------------------------------------------- the writers */

/** One enemy's row with `body` written over it, as a whole new `foes` list.
    Same three-way read `writeMinion` keeps: undefined is not part of this
    write, null and '' are a clear, anything else is stored. */
export function writeFoe(encounter, key, body) {
  const foes = normalizeFoes(encounter?.foes);

  return foes.map((row) => {
    if (row.key !== key) return row;
    const next = { ...row };
    for (const [field, value] of Object.entries(body ?? {})) {
      if (value === undefined) continue;
      if (value === null || value === '') delete next[field];
      else next[field] = value;
    }
    return next;
  });
}

/** What each pool may hold on this enemy. Reaction is zero to zero for a
    Minion, which is where that rule becomes unbreakable. */
function poolCaps(foe, pool) {
  return {
    health: [0, foe.stats.health_max],
    shield: [0, foe.stats.shield_cap],
    ap: [0, foe.stats.ap_max],
    reaction: [0, foe.stats.reaction_max],
    willpower: [0, foe.stats.willpower_max],
  }[pool];
}

/** One pool set to a value, held inside what this enemy can actually hold. */
export function setFoePool(encounter, foe, pool, value) {
  const caps = poolCaps(foe, pool);
  if (!caps) return null;

  return { foes: writeFoe(encounter, foe.key, { [pool]: clamp(value, caps[0], caps[1]) }) };
}

/**
 * One pool moved *by* an amount, read off the encounter it is handed.
 *
 * A step is a delta and not a destination, which matters the moment somebody
 * presses one twice quickly: two presses of -5 in the same React batch both see
 * the same 8 Health, and two writes of "3" is one step lost. Reading the stored
 * value here means the second press sees the first press's answer, whatever the
 * block still has on screen.
 *
 * Absent is full, exactly as everywhere else, so a step on an enemy nothing has
 * been written for starts from its ceiling rather than from zero.
 */
export function stepFoePool(encounter, foe, pool, delta) {
  const caps = poolCaps(foe, pool);
  if (!caps) return null;

  const row = normalizeFoes(encounter?.foes).find((entry) => entry.key === foe.key);
  if (!row) return null;

  const empty = pool === 'shield' || pool === 'reaction';
  const current = row[pool] ?? (empty ? 0 : caps[1]);

  return { foes: writeFoe(encounter, foe.key, { [pool]: clamp(current + delta, caps[0], caps[1]) }) };
}

/**
 * One enemy moved to another level.
 *
 * **Every pool goes with it**, and the tracker too. A level 9 Blightgeist has
 * six times the Health of a level 1 one, so "it had taken 4 damage" does not
 * survive the change in any reading anybody would want: 4 of 52 is not it, and
 * neither is 44 of 52. A different level is a different body, so it arrives
 * whole. The name it was given and the wards already broken are the two things
 * that are about the *fight* rather than the body, and both stay.
 */
export function setFoeLevel(encounter, key, level, { by = false } = {}) {
  const foes = normalizeFoes(encounter?.foes);
  const row = foes.find((entry) => entry.key === key);
  if (!row) return null;

  /* `by` makes it a step rather than a destination, and the two presses on the
     block use it. Same reason `stepFoePool` exists: three taps of + land in one
     React batch, and three destinations all worked out from the level on screen
     are three writes of "2". Found by pressing it, twice. */
  const held = row.level ?? getCreature(row.creature).level;
  const next = clampCreatureLevel(by ? held + Math.floor(Number(level) || 0) : level);
  if (next === held) return null;

  return {
    foes: foes.map((entry) =>
      entry.key === key
        ? {
            key: entry.key,
            creature: entry.creature,
            level: next,
            ...(entry.name ? { name: entry.name } : {}),
            ...(entry.broken ? { broken: entry.broken } : {}),
          }
        : entry
    ),
  };
}

/** The enemy's own tracker replaced by `list`, built by combatTurn.js's own
    `addEffect`, `nudgeEffect` and `dropEffect` so a row here is the same kind
    of row as a row on a sheet. */
export function setFoeEffects(encounter, key, list) {
  return {
    foes: writeFoe(encounter, key, {
      effects: Array.isArray(list) && list.length > 0 ? list : null,
    }),
  };
}

/** The name somebody typed over it, or the name cleared back to the numbered one. */
export function nameFoe(encounter, key, name) {
  const clean = typeof name === 'string' ? name.trim().slice(0, 60) : '';
  return { foes: writeFoe(encounter, key, { name: clean || null }) };
}

/**
 * An environmental passive switched off, or switched back on.
 *
 * "a lich which has a shield that protects it until a pillar is destroyed."
 * Nothing on a sheet can tell whether a pillar is standing, so nothing tries:
 * this is the Game Master saying it has fallen, and the block draws the passive
 * struck through from that moment.
 */
export function breakWard(encounter, foe, cardId, broken = true) {
  const held = new Set(foe.broken ?? []);
  if (broken) held.add(cardId);
  else held.delete(cardId);

  return { foes: writeFoe(encounter, foe.key, { broken: held.size > 0 ? [...held] : null }) };
}

/**
 * What a use writes onto the enemy's row.
 *
 * All three pools, unlike a bonded minion's: an enemy pays for its own moves out
 * of its own Action Points, its own Reaction Points and its own Willpower
 * (Jules, 2026-08-31: "They have willpower"), so nothing crosses to another
 * sheet and there is no second half to fold back.
 *
 * Filtered rather than written wholesale, which is the one thing `minionSpend`
 * did not have to do. `spendUse` builds its patch against a *character*, and a
 * character has columns an enemy has never heard of: a Blood Tithe writes a
 * `ledger`, an on-use trigger can write a rest's worth of them. No creature card
 * carries either today, and a row on this table must not be able to grow a
 * column because one is written tomorrow.
 */
const FOE_KEYS = new Set(['health', 'shield', 'ap', 'reaction', 'willpower', 'effects']);

export function foeSpend(encounter, foe, body) {
  const mine = {};
  for (const [key, value] of Object.entries(body ?? {})) {
    if (FOE_KEYS.has(key)) mine[key] = value;
  }
  return { foes: writeFoe(encounter, foe.key, mine) };
}

/* ------------------------------------------------------------ laying it out */

/**
 * `count` copies of a creature added to the pile, at `level`.
 *
 * Nothing is written for them beyond their key, which creature they are and
 * what level, which is what makes them arrive at full Health with nothing
 * running: absent is full. See normalizeFoes.
 */
export function addFoes(encounter, creatureId, count = 1, level = null) {
  const creature = getCreature(creatureId);
  if (!creature) return null;

  const foes = normalizeFoes(encounter?.foes);
  const room = Math.max(0, FOES_MAX - foes.length);
  const many = Math.min(Math.max(1, Math.floor(Number(count) || 1)), room);
  if (many === 0) return null;

  const at = clampCreatureLevel(level ?? creature.level);
  const added = Array.from({ length: many }, () => ({
    key: foeKey(),
    creature: creatureId,
    level: at,
  }));
  return { foes: [...foes, ...added] };
}

/** One enemy taken off the table. */
export function dropFoe(encounter, key) {
  const foes = normalizeFoes(encounter?.foes);
  const next = foes.filter((row) => row.key !== key);
  return next.length === foes.length ? null : { foes: next };
}

/** Everything back to how it was printed: full pools, nothing running, every
    ward standing. The way to run the same encounter at a second table. */
export function resetEncounter(encounter) {
  const foes = normalizeFoes(encounter?.foes);
  if (foes.length === 0) return null;
  return {
    foes: foes.map((row) => ({
      key: row.key,
      creature: row.creature,
      ...(row.level ? { level: row.level } : {}),
      ...(row.name ? { name: row.name } : {}),
    })),
  };
}

/* ------------------------------------------------------- what a turn does */

/**
 * A player took a turn.
 *
 * "whenever a player take a turn they gain 3 rection points" is the Overlord's
 * whole rule, and this is it. The runner fires it the moment the order lands on
 * a player; it is also a button, for a table running the fight by hand.
 *
 * `tick` is what a turn does to a list of running effects, handed in by
 * combatTurn.js rather than written again here, exactly as `refillMinions`
 * takes it. Only the Overlords tick: the rule is about a player's turn passing,
 * and a Minion has no clock of its own that a player's turn moves.
 *
 * Returns null when nothing moved, so a press with every Overlord already
 * topped up writes no row.
 */
export function crossTurn(encounter, { tick = null } = {}) {
  const list = encounterState(encounter);
  if (list.length === 0) return null;

  const gains = [];
  let moved = false;

  const foes = normalizeFoes(encounter?.foes).map((row) => {
    const foe = list.find((entry) => entry.key === row.key);
    if (!foe || foe.down) return row;

    const per = foe.rank.perPlayerTurn;
    if (per <= 0) return row;

    const next = { ...row };

    const before = foe.reaction;
    const after = clamp(before + per, 0, foe.stats.reaction_max);
    if (after !== before) {
      next.reaction = after;
      moved = true;
      gains.push(`${foe.title}: +${after - before} Reaction ${after - before === 1 ? 'Point' : 'Points'}`);
    }

    const rolled = tick && foe.effects.length > 0 ? tick(foe.effects) : null;
    if (rolled && !sameCount(foe.effects, rolled)) {
      next.effects = rolled;
      moved = true;
    }

    return next;
  });

  return moved ? { patch: { foes }, gains } : null;
}

/** Whether a tick actually moved anything: same rows, same counts left. */
function sameCount(before, after) {
  if (before.length !== after.length) return false;
  return before.every((row, at) => row?.id === after[at]?.id && row?.turns === after[at]?.turns);
}

/**
 * An enemy's Action Points back to full at the top of its own turn, and its
 * tracker ticked.
 *
 * The half of a Start Turn an enemy actually has. It has no rests, no Shield
 * grant and no ledger, so this is the whole of it: the points it spends come
 * back, and what is running on it loses a turn. Reaction Points are left alone,
 * because those are earned inside a round and giving them back at the top of a
 * turn would be a second Overlord rule nobody asked for.
 */
export function foeTurnStart(encounter, key, { tick = null } = {}) {
  const foe = encounterState(encounter).find((entry) => entry.key === key);
  if (!foe || foe.down) return null;

  const body = {};
  if (foe.ap !== foe.stats.ap_max) body.ap = foe.stats.ap_max;

  const rolled = tick && foe.effects.length > 0 ? tick(foe.effects) : null;
  if (rolled && !sameCount(foe.effects, rolled)) body.effects = rolled.length > 0 ? rolled : null;

  return Object.keys(body).length > 0 ? { foes: writeFoe(encounter, key, body) } : null;
}

/* ============================================================== THE RUN
 *
 * "when you have built an encounter you can run it which will take control of
 * the character turn start and end. Initiative is rolled, then DM make monster
 * turns and player do their turn, the turn start then become automatic with a
 * pop up full screen notification and the end turn is manual by player when
 * done." Jules, 2026-08-31.
 *
 * ------------------------------------------------------------- who writes what
 * The load-bearing constraint is one this codebase has kept since the campaign
 * page was built: **a sheet is the only writer of its own numbers.** RLS says so
 * too, so it is not a convention that can be bent. A Game Master cannot write
 * `turn_state` onto a player's character, and must not be able to.
 *
 * So the run does not push. It **announces**, and the announcement is an event
 * on the table log, which every seated sheet is already listening to:
 *
 *   1. the Game Master advances the order
 *   2. the encounter row moves, and an event is written saying whose turn it is
 *   3. that player's own client sees its own id, applies `startTurn` through its
 *      own patch, and puts the notice on the screen
 *   4. the player ends their turn on their own sheet, which writes an event back
 *   5. the Game Master's runner sees it and advances
 *
 * The sheet never stops being the only writer of itself, the Game Master never
 * needs a permission they should not have, and a player who reloads mid-fight
 * finds the whole order on the log rather than in anybody's memory.
 *
 * ---------------------------------------------------------------- the order
 * Rolled here, once, with the dice engine everything else rolls with: 2d6 plus
 * the Initiative on the sheet, which is the grammar of every other check in the
 * game. Ties go to the higher Initiative and then to the roll's own order, so
 * two identical Blightgeists always resolve the same way rather than swapping
 * places on every render.
 */

/** As many entries as one order will carry: every foe plus every seat. */
const ORDER_MAX = FOES_MAX + 20;

/** A stored `run` is only ever a hint. Whatever comes in, this is a run. */
export function normalizeRun(value) {
  let state = value;
  if (typeof state === 'string') {
    try {
      state = JSON.parse(state);
    } catch {
      state = null;
    }
  }
  if (!state || typeof state !== 'object' || Array.isArray(state)) state = {};

  const order = (Array.isArray(state.order) ? state.order : [])
    .filter((entry) => entry && typeof entry === 'object')
    .filter((entry) => entry.kind === 'foe' || entry.kind === 'member')
    .map((entry) => ({
      kind: entry.kind,
      ref: String(entry.ref ?? ''),
      name: String(entry.name ?? '').slice(0, 60),
      init: Math.floor(Number(entry.init) || 0),
      ...(entry.rank ? { rank: String(entry.rank) } : {}),
    }))
    .filter((entry) => entry.ref)
    .slice(0, ORDER_MAX);

  const live = Boolean(state.live) && order.length > 0;

  return {
    live,
    round: Math.max(1, Math.floor(Number(state.round) || 1)),
    at: order.length === 0 ? 0 : clamp(Math.floor(Number(state.at) || 0), 0, order.length - 1),
    order,
    /* The character whose turn has been announced and not yet ended. Held so a
       Game Master who reloads still knows they are waiting on somebody, and so
       an End Turn from a player who is not up cannot advance the fight. */
    awaiting: typeof state.awaiting === 'string' && state.awaiting ? state.awaiting : null,
  };
}

/** Whose turn it is, or null when nothing is running. */
export function currentTurn(encounter) {
  const run = normalizeRun(encounter?.run);
  return run.live ? (run.order[run.at] ?? null) : null;
}

/**
 * The order, rolled.
 *
 * `members` is `[{ character_id, name, initiative }]`, which the campaign page
 * already has in hand off `liveCharacter`. Every enemy that is still standing
 * rolls too: a body at 0 Health is not in the order, because it is not taking
 * turns.
 *
 * The roll itself is `rollCheck`, the same 2d6 plus a flat every other check in
 * the game is, so an Initiative roll is a roll and not a private formula.
 */
export function rollInitiative(encounter, members = [], { random = Math.random } = {}) {
  const entries = [];

  for (const foe of encounterState(encounter)) {
    if (foe.down) continue;
    const result = rollCheck({ flat: foe.stats.initiative, kind: 'check', random });
    entries.push({
      kind: 'foe',
      ref: foe.key,
      name: foe.title,
      rank: foe.rank.id,
      init: result.total,
      tie: foe.stats.initiative,
    });
  }

  for (const member of members ?? []) {
    if (!member?.character_id) continue;
    const flat = Math.floor(Number(member.initiative) || 0);
    const result = rollCheck({ flat, kind: 'check', random });
    entries.push({
      kind: 'member',
      ref: String(member.character_id),
      name: String(member.name ?? 'Someone'),
      init: result.total,
      tie: flat,
    });
  }

  if (entries.length === 0) return null;

  /* Highest first. A tie goes to the higher Initiative on the sheet, and a tie
     there keeps the order they were built in, which is the encounter's own
     order: two identical Blightgeists must not swap places between renders. */
  entries.sort((a, b) => b.init - a.init || b.tie - a.tie);

  return {
    run: {
      live: true,
      round: 1,
      at: 0,
      /* `tie` was only ever the sort's business and is not stored: what the
         order needs to remember is who, in what order, on what roll. */
      order: entries.map((entry) => ({
        kind: entry.kind,
        ref: entry.ref,
        name: entry.name,
        init: entry.init,
        ...(entry.rank ? { rank: entry.rank } : {}),
      })),
      awaiting: null,
    },
  };
}

/**
 * The order moved on by one, and what that turn is.
 *
 * Wraps to the top and bumps the round, which is the only place a round ever
 * changes. Hands back the patch *and* the entry it landed on, because every
 * caller needs both: the patch to save, the entry to announce.
 */
export function advanceRun(encounter) {
  const run = normalizeRun(encounter?.run);
  if (!run.live || run.order.length === 0) return null;

  const at = (run.at + 1) % run.order.length;
  const round = at === 0 ? run.round + 1 : run.round;
  const entry = run.order[at];

  return {
    patch: { run: { ...run, at, round, awaiting: entry.kind === 'member' ? entry.ref : null } },
    entry,
    round,
    wrapped: at === 0,
  };
}

/** The fight is over. The order is kept so it can still be read, and `live` is
    what says it is not being played any more. */
export function endRun(encounter) {
  const run = normalizeRun(encounter?.run);
  if (!run.live) return null;
  return { run: { ...run, live: false, awaiting: null } };
}

/** An enemy taken off the board mid-fight leaves the order with it. */
export function dropFromOrder(encounter, ref) {
  const run = normalizeRun(encounter?.run);
  if (!run.live) return null;

  const at = run.order.findIndex((entry) => entry.ref === ref);
  if (at < 0) return null;

  const order = run.order.filter((entry) => entry.ref !== ref);
  if (order.length === 0) return { run: { ...run, live: false, order, at: 0, awaiting: null } };

  /* Whoever is up stays up. Removing somebody *before* the current entry shifts
     every index down by one, so the pointer follows them rather than jumping to
     the next body along. */
  const next = at < run.at ? run.at - 1 : Math.min(run.at, order.length - 1);
  return { run: { ...run, order, at: next } };
}

/* --------------------------------------------------------------- the table */

/** Columns the app writes back. Keeps updates from ever touching id/campaign_id. */
const ENCOUNTER_FIELDS = ['name', 'notes', 'foes', 'run'];

function pickEncounterFields(patch) {
  const clean = {};
  for (const key of Object.keys(patch ?? {})) {
    if (ENCOUNTER_FIELDS.includes(key)) clean[key] = patch[key];
  }
  return clean;
}

/** Every encounter on a campaign, oldest first, which is the order they were
    prepared in and the order the tab lists them. */
export async function listEncounters(campaignId) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('encounters')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createEncounter(campaignId, overrides = {}) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('encounters')
    .insert({ ...pickEncounterFields(overrides), campaign_id: campaignId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEncounter(id, patch) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('encounters')
    .update(pickEncounterFields(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEncounter(id) {
  const sb = requireSupabase();
  const { error } = await sb.from('encounters').delete().eq('id', id);
  if (error) throw error;
}
