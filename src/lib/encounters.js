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
import { HIGHEST } from './attributes.js';
import { clamp } from './characterModel.js';
import { struck } from './combatApply.js';
import { rollCheck } from './dice.js';
import {
  CONJURED_ID,
  CONJURED_RANK,
  CREATURE_ARMOR,
  RANKS,
  clampCreatureLevel,
  creatureMoves,
  creaturePassives,
  creatureStats,
  creatureWards,
  getCreature,
  getRank,
} from './creatures.js';
import { healedEffects } from './statuses.js';

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

    /* A conjured body carries its numbers with it, because no page prints
       them: a Hard Light wall has the Health its caster's Mind gave it. A
       conjured row with no body is a row that says nothing, and is dropped. */
    if (row.creature === CONJURED_ID) {
      const body = normalizeConjured(raw.body);
      if (!body) continue;
      row.body = body;
    }

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
 * were laid down: 1.Blightgeist through 6.Blightgeist, the number in front where
 * a scanning eye finds it (Jules, 2026-09-01: "they get named 1.Fenrat
 * 2.Fenrat"). One on its own keeps its plain name, because "1.Vaultkeeper Lich"
 * is worse than "Vaultkeeper Lich".
 */
export function encounterState(encounter) {
  const foes = normalizeFoes(encounter?.foes);

  /* How many of each creature are here, so a lone one is not numbered. A
     conjured body counts under its own name rather than under "conjured", so
     a wall and a flower on the same table are not 1.Conjured and 2.Conjured. */
  const kindOf = (row) => (row.body ? `${row.creature}:${row.body.name}` : row.creature);
  const total = new Map();
  for (const row of foes) total.set(kindOf(row), (total.get(kindOf(row)) ?? 0) + 1);

  const seen = new Map();

  return foes.map((row) => {
    const creature = getCreature(row.creature);
    const nth = (seen.get(kindOf(row)) ?? 0) + 1;
    seen.set(kindOf(row), nth);
    return dressFoe(creature, row, { nth, many: total.get(kindOf(row)) > 1 });
  });
}

/* ------------------------------------------------------------ the conjured
 *
 * Jules, 2026-09-04: "If something is created like with hard light in the
 * target it should appear, become a target with proper health." A HARD LIGHT
 * wall, a DEVOURING BLOSSOM, a GUARDIAN ANGEL: each is a thing on the table
 * with Health and Defense the card works out off its caster, and until now
 * each was a sentence the Game Master kept in their head. Now it is a body in
 * the pile, drawn as one, aimed at as one and struck as one.
 *
 * It is not a creature. No page prints it, it has no attributes, it takes no
 * turn and it knows no cards. So it is a row whose `creature` is the one
 * registry stub creatures.js keeps for exactly this, and whose numbers ride on
 * the row itself as `body`. `dressFoe` reads them there instead of running the
 * curve. See castPlan in combatBar.js for where the numbers are read off the
 * card, and FightProvider.jsx for how the players' sheets hear of it.
 */

/** A conjured body's numbers, as stored: what the card said and who made it. */
function normalizeConjured(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name ?? '').trim().slice(0, 60);
  const health_max = Math.max(1, Math.floor(Number(raw.health_max) || 0));
  if (!name) return null;

  const avoid = Math.max(0, Math.floor(Number(raw.avoid) || 0));
  return {
    name,
    health_max,
    avoid,
    // A roll "against its Reflex" at a wall is judged by the one number it has.
    reflex: Math.max(0, Math.floor(Number(raw.reflex ?? avoid) || 0)),
    grit: Math.max(0, Math.floor(Number(raw.grit ?? avoid) || 0)),
    armor: Math.max(0, Math.floor(Number(raw.armor) || 0)),
    ...(raw.card ? { card: String(raw.card).slice(0, 60) } : {}),
    ...(raw.owner ? { owner: String(raw.owner).slice(0, 60) } : {}),
    ...(raw.ownerId ? { ownerId: String(raw.ownerId).slice(0, 60) } : {}),
  };
}

/** The stats shape every tile draws, filled from a conjured body's numbers. */
function conjuredStats(body) {
  return {
    level: 1,
    attributes: { physique: 0, instinct: 0, mind: 0 },
    health_max: body.health_max,
    shield_cap: 0,
    willpower_max: 0,
    avoid: body.avoid,
    defense: body.armor,
    armor: CREATURE_ARMOR[0],
    initiative: 0,
    speed_m: 0,
    ap_max: 0,
    reaction_max: 0,
    reflex: body.reflex,
    grit: body.grit,
    xp: 0,
  };
}

/**
 * A conjured body put on the table, under the key the caster minted for it.
 *
 * The key arrives from the cast rather than being minted here, because two
 * clients have to agree on it: the Game Master's page writes the row and every
 * player's sheet hears the same key off the log and points its chips at it.
 * A key already in the pile is the same summon heard twice, and lands once.
 */
export function addConjured(encounter, body, key) {
  const clean = normalizeConjured(body);
  if (!clean || typeof key !== 'string' || !key.trim()) return null;

  const foes = normalizeFoes(encounter?.foes);
  if (foes.some((row) => row.key === key)) return null;
  if (foes.length >= FOES_MAX) return null;

  return { foes: [...foes, { key: key.trim().slice(0, 16), creature: CONJURED_ID, body: clean }] };
}

/**
 * One enemy, dressed: the creature, its numbers at the level this one stands at,
 * and whatever the encounter has written on it.
 *
 * Split out of `encounterState` so a creature that is not in the registry at all
 * can still be drawn — which is what the forge needs. A creature being tuned has
 * no id yet, no encounter behind it and nothing stored for it, and it has to be
 * previewable at every keystroke. Going through a row-and-id round trip would
 * have meant registering a half-finished creature to look at it.
 *
 * `row` is the stored entry, and every field on it is optional: absent means
 * full, unnamed, unscaled, nothing running.
 */
function dressFoe(creature, row = {}, { nth = 1, many = false } = {}) {
  /* A conjured body wears the rank of nothing and the numbers it was made
     with. Everything else about the dressing is the same, so one block draws
     both. See the note on the conjured above. */
  const conjured = row.creature === CONJURED_ID && row.body ? row.body : null;
  const rank = conjured ? CONJURED_RANK : getRank(creature);
  const level = clampCreatureLevel(row.level ?? creature.level);
  const stats = conjured ? conjuredStats(conjured) : creatureStats(creature, level);

  const plain = conjured ? conjured.name : creature.name;
  const numbered = many ? `${nth}.${plain}` : plain;

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
    key: row.key ?? '',
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
    moves: conjured ? [] : creatureMoves(creature),
    passives: conjured ? [] : creaturePassives(creature),
    wards: conjured ? [] : creatureWards(creature),
    // The body a spell made, when this is one: who made it and off which card.
    conjured,
  };
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
 *
 * It takes the creature itself rather than an id, so a creature being forged can
 * be drawn before it exists anywhere. See `dressFoe`.
 */
export function previewFoe(creature, level = null) {
  if (!creature) return null;
  return dressFoe(creature, {
    key: `codex-${creature.id ?? 'draft'}`,
    level: level ?? creature.level,
  });
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

/**
 * The rider every ability a creature *owns* is read and rolled with: its own
 * numbers, and its best attribute.
 *
 * "Bestiary abilities for entities always use their best attribute" (Jules,
 * 2026-09-03). A creature page prints one attribute per card, and those were
 * transcribed from the sheet the creature arrived on — a Blightgeist's Withering
 * Word says Mind because a Blightgeist is a Mind creature. Read literally it
 * meant a creature could hold a card written for an attribute it happens to be
 * bad at and roll the bad one, which is not what a stat block is for: a
 * creature's numbers are generated off its rank and its level, so the one
 * attribute worth rolling is the one the generator gave it.
 *
 * `HIGHEST` is the rule written as a word rather than as a key, resolved against
 * whoever is holding the card. It is the same mechanism a lineage's "cast with
 * your highest Attribute" uses, so nothing downstream needed to learn anything:
 * see `castStat` in cardText.js.
 *
 * **The card is not rewritten.** Its printed `stat` stays exactly as the codex
 * has it, and a card read anywhere without a creature behind it — the forge's
 * shelf, the codex — still prints what it was written with. This is a rider on
 * the holder, which is the same shape every other override on this site takes.
 */
export function foeModifiers(actor) {
  return { actor, stat: HIGHEST };
}

/**
 * Whether a card is one of this creature's own, rather than one laid on it.
 *
 * The tracker is the reason this exists: a row on an enemy may be its own spell
 * still burning or it may be a *player's*, delivered by a cast. The best
 * attribute is the creature's rule about the creature's own abilities, and
 * applying it to somebody else's card would be reading their spell off this
 * body's numbers.
 */
export function foeOwns(foe, id) {
  if (!id) return false;
  return [...(foe?.moves ?? []), ...(foe?.passives ?? [])].some((card) => card.id === id);
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
 * `ledger`, an on-use trigger can write a rest's worth of them. A row on this
 * table must not be able to grow a column because one is written tomorrow.
 *
 * The `ledger` half of that stopped being hypothetical on 2026-09-03: a
 * Willpower spend now writes a row saying what it was for, nine creature cards
 * charge Willpower, and an enemy has no ledger to write it on. It is built and
 * dropped here, which is the right outcome — a lich's Withering Word is on the
 * table log under the lich's own name, and the sheet's ledger is the *player's*
 * account of their own pools.
 */
const FOE_KEYS = new Set(['health', 'shield', 'ap', 'reaction', 'willpower', 'effects']);

export function foeSpend(encounter, foe, body) {
  const mine = {};
  for (const [key, value] of Object.entries(body ?? {})) {
    if (FOE_KEYS.has(key)) mine[key] = value;
  }
  return { foes: writeFoe(encounter, foe.key, mine) };
}

/**
 * A rolled result landed on enemies, as one write.
 *
 * `rows` is `[{ key, kind, landings }]`: which enemy, what kind of change and
 * the landings that make it up. The arithmetic is combatApply.js's — Armor per
 * landing, Shield soaking, Health floored at nothing — worked out here against
 * *stored* pools rather than against whatever block raised the window, for the
 * same reason `stepFoePool` reads the stored value: the screen may be a press
 * out of date.
 *
 * One write for however many enemies were hit, because five goblins catching
 * one Fireball is one thing that happened and five writes racing each other
 * rebuilt five different `foes` lists.
 */
export function applyToFoes(encounter, rows) {
  const list = encounterState(encounter);
  let foes = normalizeFoes(encounter?.foes);
  let moved = false;

  for (const { key, kind, landings } of rows ?? []) {
    const foe = list.find((entry) => entry.key === key);
    if (!foe) continue;
    const held = foes.find((entry) => entry.key === key);
    const shield = held?.shield ?? 0;
    const health = held?.health ?? foe.stats.health_max;

    const body = {};
    if (kind === 'damage') {
      const hit = struck({ shield, health, armor: foe.stats.defense }, landings, { floor: 0 });
      if (hit.soaked > 0) body.shield = hit.shield;
      if (hit.dealt > 0) body.health = hit.health;
    } else if (kind === 'healing') {
      const next = clamp(health + sumOf(landings), 0, foe.stats.health_max);
      if (next !== health) {
        body.health = next;
        /* Health coming back washes Poisoned off and takes a stack of Bleed,
           on an enemy exactly as on a sheet. See statuses.js. */
        const washed = healedEffects(held?.effects ?? []);
        if (washed) body.effects = washed.length > 0 ? washed : null;
      }
    } else if (kind === 'shield') {
      const next = clamp(shield + sumOf(landings), 0, foe.stats.shield_cap);
      if (next !== shield) body.shield = next;
    }

    if (Object.keys(body).length === 0) continue;
    foes = writeFoeOn(foes, key, body);
    moved = true;
  }

  return moved ? { foes } : null;
}

function sumOf(landings) {
  return (landings ?? []).reduce((sum, n) => sum + Math.max(0, Math.floor(Number(n) || 0)), 0);
}

/** `writeFoe` over a list already in hand, for the writers that hit several. */
function writeFoeOn(foes, key, body) {
  return foes.map((row) => {
    if (row.key !== key) return row;
    const next = { ...row };
    for (const [field, value] of Object.entries(body)) {
      if (value === undefined) continue;
      if (value === null || value === '') delete next[field];
      else next[field] = value;
    }
    return next;
  });
}

/**
 * One effect laid on several enemies at once, as one write.
 *
 * "When an ability is cast that affects an entity with an effect, this effect
 * needs to populate on the target trackers." The row is the same row a use
 * would have laid on the caster, relaid on each body it was aimed at.
 *
 * `lay` is combatTurn.js's own `layEffect`, handed in the way `tick` is handed
 * to `crossTurn`, because what an effect *is* belongs to that file and this one
 * may not import it. Laid rather than added, so the same card aimed at the same
 * body twice refreshes one row: the same-source law, on somebody else's tracker.
 */
export function layOnFoes(encounter, keys, entry, { lay }) {
  let foes = normalizeFoes(encounter?.foes);

  for (const key of keys ?? []) {
    const row = foes.find((held) => held.key === key);
    if (!row) continue;
    const effects = lay(row.effects ?? [], entry);
    foes = writeFoeOn(foes, key, { effects: effects.length > 0 ? effects : null });
  }

  return { foes };
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
 * Rolled with the dice engine everything else rolls with: 2d6 plus the
 * Initiative on the sheet, which is the grammar of every other check in the
 * game. Ties go to the higher Initiative and then to the roll's own order, so
 * two identical Blightgeists always resolve the same way rather than swapping
 * places on every render.
 *
 * ------------------------------------------------------------- who rolls it
 * Not this file, for a player. "Everybody rolls Initiative" is what chapter
 * five has always said, and a Game Master pressing one button and being handed
 * everybody's number is the tool quietly taking the dice off the table. Jules,
 * 2026-09-04: "make it so it prompt a roll for player with initiative and not
 * just automatic."
 *
 * So the press is an **ask**, and it happens in three moves:
 *
 *   askInitiative    the enemies roll here, because they are the Game
 *                    Master's own bodies, and every seated character is
 *                    written down as asked. The fight is not live yet.
 *   foldInitiative   one player's own throw, folded in. It arrives as a roll
 *                    on the table log, thrown on their own sheet with their
 *                    own dice, and the answer is theirs alone: a second one
 *                    for the same body is refused rather than allowed to
 *                    replace the first.
 *   closeInitiative  the order, sorted and live. Whoever never answered is
 *                    rolled for here, which is what keeps a shut laptop from
 *                    stopping a fight.
 *
 * The pending ask lives on the encounter row, under `run.pending`, for the same
 * reason the order does: a Game Master who reloads mid-ask is still waiting on
 * the same two players, and the enemies do not roll twice.
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
      /* The three numbers a roll is judged against, frozen when the order was
         rolled. They ride the order so a check aimed at this body can carry
         its own DC instead of asking the table for a number the system knows.
         See `against` in rollPlan.js. */
      ...(entry.defenses ? { defenses: normalizeDefenses(entry.defenses) } : {}),
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
    /* The ask that has gone out and not been answered yet. Null for every run
       that is not waiting on anybody, which is every run once the fight has
       started. See askInitiative. */
    pending: normalizePending(state.pending),
  };
}

/**
 * A stored ask, read back.
 *
 * `call` is the whole address: it is minted per press, it rides the event that
 * asks and it is the chain every answering throw is written under, so a roll
 * lands on the fight that asked for it and on no other. A pending block with no
 * call is not an ask.
 */
function normalizePending(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const call = String(value.call ?? '');
  if (!call) return null;

  const asked = (Array.isArray(value.asked) ? value.asked : [])
    .filter((entry) => entry && typeof entry === 'object' && entry.ref)
    .map((entry) => ({
      ref: String(entry.ref),
      name: String(entry.name ?? 'Someone').slice(0, 60),
      /* The Initiative on their sheet when the ask went out. It breaks a tie,
         and it is what they are rolled with if they never answer. */
      flat: Math.floor(Number(entry.flat) || 0),
      defenses: normalizeDefenses(entry.defenses),
    }))
    .slice(0, ORDER_MAX);

  const got = {};
  for (const [ref, answer] of Object.entries(value.got ?? {})) {
    if (!asked.some((entry) => entry.ref === ref)) continue;
    got[ref] = {
      init: Math.floor(Number(answer?.init) || 0),
      tie: Math.floor(Number(answer?.tie) || 0),
    };
  }

  return {
    call,
    asked,
    got,
    /* The enemies, rolled the moment the ask went out. Held rather than rolled
       again at the end so that waiting on a player cannot change what the
       Blightgeist got. */
    foes: (Array.isArray(value.foes) ? value.foes : [])
      .filter((entry) => entry && entry.ref)
      .map((entry) => ({
        kind: 'foe',
        ref: String(entry.ref),
        name: String(entry.name ?? '').slice(0, 60),
        init: Math.floor(Number(entry.init) || 0),
        tie: Math.floor(Number(entry.tie) || 0),
        ...(entry.rank ? { rank: String(entry.rank) } : {}),
        defenses: normalizeDefenses(entry.defenses),
      }))
      .slice(0, ORDER_MAX),
  };
}

/** Whose turn it is, or null when nothing is running. */
export function currentTurn(encounter) {
  const run = normalizeRun(encounter?.run);
  return run.live ? (run.order[run.at] ?? null) : null;
}

/** The three defenses a check can be judged against, as whole numbers. */
function normalizeDefenses(raw) {
  return {
    avoid: Math.floor(Number(raw?.avoid) || 0),
    reflex: Math.floor(Number(raw?.reflex) || 0),
    grit: Math.floor(Number(raw?.grit) || 0),
  };
}

/**
 * The order, every die of it rolled here.
 *
 * `members` is `[{ character_id, name, initiative }]`, which the campaign page
 * already has in hand off `liveCharacter`. Every enemy that is still standing
 * rolls too: a body at 0 Health is not in the order, because it is not taking
 * turns.
 *
 * The roll itself is `rollCheck`, the same 2d6 plus a flat every other check in
 * the game is, so an Initiative roll is a roll and not a private formula.
 *
 * **This is no longer how a fight with players in it starts.** It is what a
 * table with nobody seated gets — a Game Master alone with a pile of
 * goblins — and it is the primitive the three moves above are built out of.
 * A seated player rolls their own: see askInitiative.
 */
export function rollInitiative(encounter, members = [], { random = Math.random } = {}) {
  return runFrom([
    ...foeRolls(encounter, random),
    ...(members ?? [])
      .filter((member) => member?.character_id)
      .map((member) => {
        const flat = Math.floor(Number(member.initiative) || 0);
        return {
          kind: 'member',
          ref: String(member.character_id),
          name: String(member.name ?? 'Someone'),
          init: rollCheck({ flat, kind: 'check', random }).total,
          tie: flat,
          defenses: normalizeDefenses(member),
        };
      }),
  ]);
}

/** Every enemy that is still standing, rolled. A wall takes no turn: what a
    conjured thing does, it does on its caster's. */
function foeRolls(encounter, random) {
  return encounterState(encounter)
    .filter((foe) => !foe.down && !foe.conjured)
    .map((foe) => ({
      kind: 'foe',
      ref: foe.key,
      name: foe.title,
      rank: foe.rank.id,
      init: rollCheck({ flat: foe.stats.initiative, kind: 'check', random }).total,
      tie: foe.stats.initiative,
      defenses: normalizeDefenses(foe.stats),
    }));
}

/**
 * A pile of rolled entries as the run they make: sorted, live, round one.
 *
 * Highest first. A tie goes to the higher Initiative on the sheet, and a tie
 * there keeps the order they were built in, which is the encounter's own order:
 * two identical Blightgeists must not swap places between renders.
 */
function runFrom(entries) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.init - a.init || b.tie - a.tie);

  return {
    run: {
      live: true,
      round: 1,
      at: 0,
      /* `tie` was only ever the sort's business and is not stored: what the
         order needs to remember is who, in what order, on what roll, and what a
         roll against them is judged by. */
      order: sorted.map((entry) => ({
        kind: entry.kind,
        ref: entry.ref,
        name: entry.name,
        init: entry.init,
        ...(entry.rank ? { rank: entry.rank } : {}),
        defenses: entry.defenses,
      })),
      /* Whoever won the roll is up *now*, and when that is a player the runner
         is already waiting on them: the fight used to start with `awaiting`
         empty, so the winner's own End Turn moved nothing until the Game
         Master pressed something. Found by Lark winning initiative. */
      awaiting: sorted[0].kind === 'member' ? sorted[0].ref : null,
      /* Nothing is waiting on anybody any more. A run that starts still
         holding its ask would ask again on the next reload. */
      pending: null,
    },
  };
}

/**
 * The press: the enemies roll, and every player is asked to roll their own.
 *
 * `call` is minted by the caller rather than here, because the same string has
 * to reach the event that does the asking and this file writes no events. See
 * `newChain` in logChain.js, which is where every other client-minted address
 * on this site comes from.
 *
 * A table with nobody seated has nobody to ask, so the fight simply starts:
 * a Game Master testing a pile of goblins alone should not be handed a screen
 * waiting on players who do not exist.
 */
export function askInitiative(encounter, members = [], { random = Math.random, call } = {}) {
  const seats = (members ?? []).filter((member) => member?.character_id);
  if (!call || seats.length === 0) return rollInitiative(encounter, seats, { random });

  const foes = foeRolls(encounter, random);
  const asked = seats.map((member) => ({
    ref: String(member.character_id),
    name: String(member.name ?? 'Someone'),
    flat: Math.floor(Number(member.initiative) || 0),
    defenses: normalizeDefenses(member),
  }));

  /* The order is cleared as the ask goes out. Whatever the last fight ended
     on is history, and leaving it standing would have the block drawing an
     order nobody is in while it waits for the dice that make the new one. */
  return {
    run: {
      live: false,
      round: 1,
      at: 0,
      order: [],
      awaiting: null,
      pending: { call, asked, got: {}, foes },
    },
  };
}

/**
 * One player's own throw, folded into the ask.
 *
 * The answer arrives as a roll on the table log, thrown on their own sheet
 * under the call's own chain, so `init` is a number this file never decided and
 * `tie` is the Initiative their sheet actually rolled with.
 *
 * **A second answer for the same body is refused.** The first one stands: a
 * player whose panel came back after a reload, or who found the call in the log
 * an hour later, must not be able to roll until they like the number. Both
 * throws are still in the log, which is where an argument about it belongs.
 */
export function foldInitiative(encounter, { call, ref, init, tie = null } = {}) {
  const run = normalizeRun(encounter?.run);
  const pending = run.pending;
  if (!pending || !call || pending.call !== call) return null;

  const seat = pending.asked.find((entry) => entry.ref === ref);
  if (!seat || pending.got[ref]) return null;

  return {
    run: {
      ...run,
      pending: {
        ...pending,
        got: {
          ...pending.got,
          [ref]: {
            init: Math.floor(Number(init) || 0),
            tie: Math.floor(Number(tie ?? seat.flat) || 0),
          },
        },
      },
    },
  };
}

/**
 * The ask, as the screen waiting on it reads: who has answered and who has not.
 *
 * Null when nothing is pending, which is the state every other press is in.
 * `ready` is what the runner watches for: the last answer landing is what
 * starts the fight, with nobody having to press anything.
 */
export function initiativeAsk(encounter) {
  const pending = normalizeRun(encounter?.run).pending;
  if (!pending) return null;

  const answered = pending.asked.filter((seat) => pending.got[seat.ref]);
  const waiting = pending.asked.filter((seat) => !pending.got[seat.ref]);

  return {
    call: pending.call,
    answered: answered.map((seat) => ({ ...seat, init: pending.got[seat.ref].init })),
    waiting: waiting.map((seat) => ({ ...seat })),
    foes: pending.foes.length,
    ready: waiting.length === 0,
  };
}

/**
 * The ask closed: the order, sorted and live.
 *
 * Whoever never answered is rolled for here. That is not the tool taking the
 * dice back: it is the one press that keeps a shut laptop, a player at the
 * kitchen, or a sheet nobody has open from stopping a fight the rest of the
 * table is ready for.
 *
 * An enemy that went down between the ask and this — a trap, a readied
 * arrow — leaves the order with it, because a body at 0 Health is not taking
 * turns.
 */
export function closeInitiative(encounter, { random = Math.random } = {}) {
  const run = normalizeRun(encounter?.run);
  const pending = run.pending;
  if (!pending) return null;

  const standing = new Set(
    encounterState(encounter)
      .filter((foe) => !foe.down && !foe.conjured)
      .map((foe) => foe.key)
  );

  return runFrom([
    ...pending.foes.filter((entry) => standing.has(entry.ref)),
    ...pending.asked.map((seat) => {
      const answer = pending.got[seat.ref];
      return {
        kind: 'member',
        ref: seat.ref,
        name: seat.name,
        init: answer ? answer.init : rollCheck({ flat: seat.flat, kind: 'check', random }).total,
        tie: answer ? answer.tie : seat.flat,
        defenses: seat.defenses,
      };
    }),
  ]);
}

/** The ask called off. The order it cleared stays cleared: a fight that was
    never rolled is not a fight to go back to. */
export function dropInitiative(encounter) {
  const run = normalizeRun(encounter?.run);
  if (!run.pending) return null;
  return { run: { ...run, pending: null } };
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
const ENCOUNTER_FIELDS = ['name', 'notes', 'foes', 'run', 'share_health'];

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
