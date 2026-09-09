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
 * ------------------------------------------------------- one body, or a roster
 * A `minion` spec describes **one** creature, and for the Draconic Bond that is
 * the whole story: taking the set puts an ally on the board and there is never a
 * second one. The Necromancer (2026-09-09) is the other shape. It hands over a
 * *menu*: seven kinds of undead, each with its own body, its own price and the
 * rung it opens at, and a Necromancer stands up as many of them as they can pay
 * for. So a spec may carry a `roster` of kinds instead of being a body itself:
 *
 *   minion: { tag, noun, roster: [{ id, label, tag, cost, rank, base, ... }] }
 *
 * A kind is read **over** the spec (`{ ...spec, ...kind }`), so anything true of
 * every body in the set is written once at the top and a kind says only what is
 * its own. Everything below this line works on the merged object and never asks
 * which shape it came from: the same two blocks draw a draconic ally and a ghoul,
 * the same prompt pays for both, and `minionState` is the one place that knows
 * the difference.
 *
 * What a roster set does *not* keep here is the pool the bodies are paid out of.
 * That is undead.js's, the same way a slate's ceiling is loadouts.js's: this file
 * knows what a creature is and never what it cost.
 *
 * -------------------------------------------------------------------- storage
 * One `minions` jsonb column on the character. A set with one body is keyed by
 * the set that granted it; a roster's bodies are keyed by an id of their own,
 * carrying `set` and `kind` to say what they are:
 *
 *   { "draconic-bond": { name, scale, portrait_url, health, shield, ap, reaction, effects } }
 *   { "u7k2f1": { set: 'necromancer', kind: 'ghoul', name, spells, health, ... } }
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
 * A body may also **know a Martial Move outright**, which is the one thing it
 * plays that is not a card of its own: `knows: ['reckless']` on the kind, and
 * the move is offered inside its own swing's prompt exactly as a Duelist's is.
 * A move is never a chip — see `moveRows` — so this is a list of ids and not a
 * tag. Beside it, `moves: { count, tiers }` is a body that *chooses* some the
 * night it stands up, and a kind may carry either or both.
 *
 * This file reads the codex and the character. It writes nothing on its own —
 * every writer here hands back a patch body for somebody else to save.
 */

import { clamp, levelForXp } from './characterModel.js';
import { getCard } from './weapons.js';
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

/** The kinds a spec offers, or the spec itself for a set with one body. */
export function minionKinds(spec) {
  const roster = spec?.roster;
  return Array.isArray(roster) && roster.length > 0 ? roster : [];
}

/** One kind off a roster by id, or null. */
export function minionKind(spec, id) {
  return minionKinds(spec).find((kind) => kind.id === id) ?? null;
}

/**
 * A kind read over the spec it belongs to, which is the object everything below
 * works on.
 *
 * `{ ...spec, ...kind }` and not the other way round: what is true of every body
 * a set raises is written once at the top of the spec, and a kind overrides only
 * what is its own. `roster` is dropped on the way through so a merged body can
 * never be mistaken for the menu it came off.
 */
function bodyOf(spec, kind) {
  if (!kind || kind === spec) return spec;
  const merged = { ...(spec ?? {}), ...kind };
  delete merged.roster;
  return merged;
}

/**
 * The tags every minion spec in the codex claims for its creature.
 *
 * Read across the whole codex rather than off one set, because the question the
 * quick bar asks is "is this card mine to play", and the answer is no if it
 * belongs to *any* creature. Built once at module load: `knownGroups` asks it
 * of every card a character holds, on every render of the quick bar.
 *
 * A roster's kinds each claim their own tag, and all of them go in: a ghoul's
 * Infected Claws are no more the Necromancer's to play than Wyrm Bolt is its
 * bonded's.
 */
export const MINION_TAGS = new Set(
  TALENTS.flatMap((talent) => {
    const spec = talent.minion;
    if (!spec) return [];
    return [spec.tag, ...minionKinds(spec).map((kind) => kind.tag)].filter(Boolean);
  })
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
 *   Defense  the attribute or defense named by `spec.defense`, Grit for a
 *            draconic ally, where a character's is Instinct plus armor.
 *
 * Armor is `spec.armor` and almost always nothing: a creature wears no gear and
 * there is nowhere on the sheet to give it any. **Almost**, because the
 * Necromancer's undead knight rose in plate with a shield on its arm, and a
 * printed body may say so. It is a number in the codex, not a piece of gear:
 * nothing can take it off and nothing can add to it.
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
    defense: Math.max(0, Math.floor(Number(spec?.armor) || 0)),
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

/* And as many spells as one body can have risen knowing. Three is the most any
   kind in the codex asks for; the ceiling is here so a hand-edited column cannot
   hand a ghoul a spellbook. */
const SPELLS_MAX = 8;

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
    /* Which set raised it and which of that set's kinds it is. Only a roster's
       bodies carry either: a set with one body is keyed by the set itself, and
       putting the same fact in the key and in the row would be two records of
       one thing. Both are kept as written and neither is checked against the
       codex here, because a build that has never heard of `ghoul` should leave
       the row alone rather than repair it into some other creature. */
    if (typeof raw.set === 'string' && raw.set.trim()) row.set = raw.set.trim();
    if (typeof raw.kind === 'string' && raw.kind.trim()) row.kind = raw.kind.trim();
    /* And what it rose knowing. A skeleton magus chose two spells the night it
       stood up and an undead cleric three, and those are the body's own and not
       its master's: they are fixed at creation, they are never swapped, and
       destroying the body is the only way to change them. Card ids, kept as a
       list the same way a talent entry's `picks` are. */
    if (Array.isArray(raw.spells)) {
      const ids = raw.spells.filter((id) => typeof id === 'string' && id.trim()).map((id) => id.trim());
      if (ids.length > 0) row.spells = ids.slice(0, SPELLS_MAX);
    }
    /* And what it remembers how to do with a weapon. The abomination is the one
       body in the codex that rose knowing Martial Moves, chosen the same night
       and never changed, and they are its own the same way its spells would be:
       a move is added to a swing rather than played, so these never reach its
       quick bar. See `heldMoves` in moves.js. */
    if (Array.isArray(raw.moves)) {
      const ids = raw.moves.filter((id) => typeof id === 'string' && id.trim()).map((id) => id.trim());
      if (ids.length > 0) row.moves = ids.slice(0, SPELLS_MAX);
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
 * Whether a card the set granted is one this creature commands.
 *
 * The card the roster's bodies are woken by, read straight off the character's
 * tracker. COMMAND THE DEAD lasts "until your next Turn End", so using it lays
 * an ordinary one-turn row and this is what asks whether that row is still
 * running. Null for every creature whose spec names no such card, which is every
 * creature but an undead: a draconic ally acts because it is standing there.
 *
 * Read raw rather than through `normalizeEffects`, for the reason given above
 * `normalizeMinions`: combatTurn.js owns what an effect is and sits above this
 * file. All this needs is "is there a live row from that card", and a row whose
 * `turns` has reached 0 has run out.
 */
function commandedBy(character, spec) {
  const card = spec?.command?.card;
  if (!card) return null;

  const rows = Array.isArray(character?.effects) ? character.effects : [];
  return rows.some((row) => row?.card === card && Math.floor(Number(row?.turns) || 0) !== 0);
}

/**
 * One creature resolved: its body, its pools, its cards and everything a block
 * needs to draw it.
 *
 * `kind` is the row off the roster (or the spec itself, for a set with one body),
 * `id` is the key its row lives under and `row` is that row. Split out of
 * `minionState` when the Necromancer arrived, because the same arithmetic now
 * answers three questions: what is standing on the board, what one of the seven
 * kinds *would* stand up as tonight, and whose numbers a kind's card prints.
 */
function resolveMinion(character, { talent, spec, entry, kind, id, row, level }) {
  const body = bodyOf(spec, kind);
  const attributes = minionAttributes(body, level);
  const stats = minionDerived(body, attributes, level);

  /* A missing pool is a full one. Health is clamped rather than repaired on
     the row: a level lost shrinks the ceiling, and a stored number above it
     should read as the ceiling rather than sit there being impossible. */
  const health = clamp(row.health ?? stats.health_max, body.floor ?? 0, stats.health_max);
  const shield = clamp(row.shield ?? 0, 0, stats.shield_cap);
  const ap = clamp(row.ap ?? stats.ap_max, 0, stats.ap_max);
  const reaction = clamp(row.reaction ?? 0, 0, stats.reaction_max);

  const scale = scaleOf(body, row.scale);
  const rank = entry.rank;
  const spells = row.spells ?? [];
  const moves = row.moves ?? [];

  return {
    id,
    talent,
    /* The merged body, so every reader below this file asks one object for
       `label`, `noun`, `down`, `health` and the rest without ever knowing
       whether the set granted one creature or seven. */
    spec: body,
    /* And the kind it came off, for the callers that have to price it or tell
       one apart from another. Null for a set with one body, which has no kinds
       to be one of. */
    kind: kind === spec ? null : kind,
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
       Frightened dragon is not a frightened drifter. Rows as stored: the block
       runs them through normalizeEffects, for the reason given above
       normalizeMinions. */
    effects: row.effects ?? [],
    /* "If its health reaches 0 it instantly is shown as dead." The card that
       grants it, ONE AND THE SAME, is what says the rest: it retreats into
       your shadow rather than being gone for good. An undead's own spec says
       something harsher, and `perish` is what carries that out. */
    down: health <= 0,
    /* Whether it may act at all this turn. A body that has to be woken says
       true or false; every other creature says null, which means the question
       does not apply to it, and that is what the blocks read. */
    commanded: commandedBy(character, body),
    /* What it rose knowing, beside whatever its kind knows outright. */
    spells,
    moves,
    /* What the creature does to its own cards: the damage its scales are made
       of, and whatever its ranks have Elevated. `actor` is what makes the
       numbers on those cards *its* numbers rather than its bonded's. */
    cards: minionCards(talent, rank, body, spells),
    /* And its Martial Moves, deliberately **not** among them. A move is added to
       a swing inside that swing's own prompt and is never played on its own (see
       "added, not laid" in moves.js), so a chip for one would be a way to spend
       Willpower on nothing. Resolved as the rows `heldMoves` hands back, ready to
       ride on the actor.

       Two sources and they are the same two a character has. `body.knows` is what
       the *kind* was raised knowing however many of them stand — Jules, on
       2026-09-09: "give reckless martial move to skeleton. Ghoul can use wound" —
       and `moves` is what this one body chose the night it stood up, which is the
       abomination and nothing else. Named first because it is the printed half:
       a skeleton's RECKLESS is on every skeleton and cannot be given back. */
    moveRows: [...(body.knows ?? []), ...moves]
      .map((id) => getCard(id))
      .filter(Boolean)
      .map((card) => ({ card, talent, modifiers: null })),
    title: row.name || body.label,
  };
}

/**
 * Every creature this character has, ready to be drawn.
 *
 * One row per set that grants one body, whether or not it has been named yet: a
 * creature you have not named is still standing there, and the blocks are what
 * ask you to name it.
 *
 * A set that grants a **roster** has as many rows as it has bodies standing, in
 * the order they were raised, and none at all until the first one is. Its rows
 * are the ones in the column naming it, so a set handed back leaves its dead
 * where they lie rather than taking them along, and taking the set again finds
 * them standing.
 */
export function minionState(character) {
  if (!character) return [];

  const level = levelForXp(character.xp);
  const stored = normalizeMinions(character.minions);
  const rows = [];

  for (const { talent, spec, entry } of minionSets(character.talents)) {
    if (minionKinds(spec).length === 0) {
      rows.push(
        resolveMinion(character, {
          talent,
          spec,
          entry,
          kind: spec,
          id: talent.id,
          row: stored[talent.id] ?? {},
          level,
        })
      );
      continue;
    }

    for (const [id, row] of Object.entries(stored)) {
      if (row.set !== talent.id) continue;
      const kind = minionKind(spec, row.kind);
      /* A kind this build has never heard of is left standing in the column and
         left off the board, which is the call `loadoutState` makes about a pick
         the codex no longer answers for: quietly turning somebody's ghoul into
         a skeleton would be worse than not drawing it. */
      if (!kind) continue;
      rows.push(resolveMinion(character, { talent, spec, entry, kind, id, row, level }));
    }
  }

  return rows;
}

/**
 * Every kind a roster set could raise, as bodies nobody has raised yet.
 *
 * The same rows `minionState` hands back, built by the same call off no stored
 * row at all: full Health, no name, and the kind's own stat block at this
 * character's level. Two readers want exactly that. The window that raises one
 * shows what each kind would stand up as, and the Abilities tab prints a kind's
 * cards with that kind's numbers on them, which is the only honest answer when
 * the card is worn by no body yet or by three at once.
 *
 * Empty for a set with one body, which has no menu to show.
 */
export function minionKindRows(character, talent, { rank = null } = {}) {
  const spec = minionOf(talent);
  const kinds = minionKinds(spec);
  if (kinds.length === 0) return [];

  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  const held = normalizeTalents(character?.talents).find((row) => row.id === set?.id) ?? null;

  /* At what rank the bodies are read. The held one by default, which is what the
     Abilities tab wants: a rank prints the cards that rank has given, and a body
     whose rung is above it has none of them yet.

     `rank` overrides it for the two readers who are showing a set rather than
     playing one — the presentation page in the chooser draws all three rungs
     whether or not the reader holds any of them, and a preview of an abomination
     under the heading "Rank 3" has to be the abomination at Rank 3. A set held
     by nobody at all is read at whatever rank was asked for, which is how a
     reader with no Necromancer can still look one over. */
  const entry = held ?? { id: set?.id, rank: 0, taken: [], picks: [] };
  const at = rank === null ? entry.rank : Math.max(0, Math.floor(Number(rank) || 0));
  if (at <= 0 && !held) return [];

  const level = levelForXp(character?.xp);

  return kinds.map((kind) =>
    resolveMinion(character, {
      talent: set,
      spec,
      entry: { ...entry, rank: at },
      kind,
      /* Not a key in the column: nothing here is stored. It only has to be
         unique among the menu's own rows, and a block id built from it would
         name a body that is not standing. */
      id: `${set.id}:${kind.id}`,
      row: {},
      level,
    })
  );
}

/**
 * What each of a roster's kinds does to its own cards, keyed by the kind's tag.
 *
 * The Abilities tab prints a set's cards, and a creature's cards print the
 * creature's numbers (see `minionModifiers`). With one body that is one rider for
 * the whole set; with seven it is one rider per kind, and the card's own tag says
 * which. Instance-independent on purpose: a kind's attributes come off its spec
 * and the character's level and nothing else, so two ghouls are the same ghoul
 * and there is no "which one" left to answer.
 */
export function minionKindRiders(character, talent) {
  const riders = {};
  for (const row of minionKindRows(character, talent)) {
    if (row.spec.tag) riders[row.spec.tag] = minionModifiers(character, row);
  }
  return riders;
}

/**
 * The cards this creature plays: the set's own, tagged with the creature's tag,
 * and whatever it rose knowing.
 *
 * The first half is the designer's Tags column and nothing else. The second is
 * the Necromancer's: a skeleton magus chose two spells the night it stood up and
 * an undead cleric three, and those are ordinary codex spells that this body and
 * no other body knows. They are read out of the registry by id, which is the same
 * way a loadout's picks are resolved, and a pick the codex no longer answers for
 * is dropped rather than drawn as a hole: a spell nobody can print is a chip
 * nobody can press.
 */
export function minionCards(talent, rank, spec = null, spells = []) {
  const body = spec ?? minionOf(talent);
  const tag = body?.tag;

  const own = tag
    ? cardsThroughRank(talent, rank).filter((card) => (card.tags ?? []).includes(tag))
    : [];
  if (spells.length === 0) return own;

  return [...own, ...spells.map((id) => getCard(id)).filter(Boolean)];
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
 *
 * And the bonded's ledger rides along with it, for one reason: since 2026-09-03
 * a Willpower spend writes a row saying what it was for (see `spendNote` in
 * combatBar.js), and `appendLedger` appends to whatever it is handed. Handed an
 * actor with no ledger it would hand back a list of one, and `minionSpend` sends
 * `ledger` the bonded's way along with the Willpower — so the creature's cast
 * would have wiped its bonded's history down to its own last row. The pool and
 * the record of it move together or not at all.
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
    // Borrowed with the pool it belongs to. See the note above.
    ledger: Array.isArray(character?.ledger) ? character.ledger : [],
    /* And its own tracker, because a use can now lay a row on it: a creature
       casting something that lasts is a creature with something running on it,
       and the block beside its bar is where that shows. Read off the creature's
       row and never off the character's `effects` column, which is the same line
       `setMinionEffects` draws below. See `castEffect` in combatBar.js, and
       `minionSpend`, which is what sends the answer back to the right sheet. */
    effects: minion.effects ?? [],
    /* And the Martial Moves it brought with it. `heldMoves` reads a talents
       column, which a creature has none of, so an abomination's two moves ride
       here instead and are offered inside its swing's own prompt exactly as a
       Duelist's are. Its Willpower for them is still its master's, which is the
       line above. */
    moves: minion.moveRows ?? [],
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
  const spec = minionOf(id);
  /* A roster owes nothing at the rank that bought it. Taking the Necromancer
     does not put a body on the board, it opens a graveyard: the first undead is
     raised on a night, over a corpse, with a name chosen in the window that
     raises it, so there is no unanswered question here for the Advancement tab
     to badge. See undead.js. */
  if (minionKinds(spec).length > 0) return true;

  const row = normalizeMinions(character?.minions)[id] ?? {};
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

/**
 * The prefix on a roster body's key, so a stored row can be told from the
 * set-keyed one at a glance. Same law as `forged-` on an item instance and
 * `custom-` in the pack.
 */
const BODY_PREFIX = 'body-';

/** A key for one more body in the column. */
export function newMinionId() {
  const seed = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12);
  return `${BODY_PREFIX}${seed}`;
}

/**
 * One more body in the column, as a patch.
 *
 * `set` and `kind` are what make the row readable at all: without them
 * `minionState` cannot say whose it is or what it is, and it would be a row
 * nothing draws. Everything else about it is the caller's, which for a raising is
 * the window that asked for a name and a picture. See `raise` in undead.js.
 *
 * Appended rather than merged into, and under a key of its own, because two
 * ghouls are two creatures: they take their own damage, they run their own
 * effects, and one of them dying is not the other one dying.
 */
export function addMinion(character, talentId, kind, body = {}) {
  const stored = normalizeMinions(character?.minions);
  const id = newMinionId();

  return {
    id,
    patch: {
      minions: {
        ...stored,
        [id]: { ...body, set: talentId, kind },
      },
    },
  };
}

/**
 * One body out of the column for good, as a patch.
 *
 * The only way anything leaves that column by hand. A body laid to rest gives
 * its Marrow back the moment its row is gone, because what holds the Marrow *is*
 * the row (see `marrowState` in undead.js): there is no second record to keep in
 * step, and nothing to forget to decrement.
 */
export function dropMinion(character, id) {
  const stored = normalizeMinions(character?.minions);
  if (!(id in stored)) return null;

  const next = { ...stored };
  delete next[id];
  return { minions: next };
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
 * `ended` is the test for whether this rest is the end of one running row,
 * handed down by rest.js. A creature has no rest of its own — it rests when its
 * bonded does — so what a rest ends on its tracker is decided there and applied
 * here, in the one write that also touches its Health.
 *
 * A predicate rather than the list of durations it used to be, because since
 * 2026-09-09 a rest also ends what it simply outlasts: a row counted in turns is
 * six seconds a turn, and both rests are hours. That arithmetic is one sentence
 * and it belongs in one place. See `restEnds`.
 */
export function minionRest(character, kind, ended = () => false) {
  const list = minionState(character);
  if (list.length === 0) return null;

  const stored = normalizeMinions(character.minions);
  const next = { ...stored };
  const lines = [];
  let moved = false;

  for (const minion of list) {
    /* What the rest ends is asked of every creature, whatever rest brings this
       one back: a short rest that restores nothing still ends what it ends. */
    const ending = minion.effects.filter((effect) => ended(effect));

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

    /* ---- and what does not come back at all ----
       A draconic ally that would die retreats into its bonded's shadow and this
       rest is what lets it out again. An undead is not owed that: THE OSSUARY
       says the Marrow comes back and the body does not, so a rest sweeps up what
       is left of it and the row leaves the column.

       Swept rather than deleted the moment it fell, because a body that dropped
       mid-fight has to be *seen* to have dropped, and because DEEPER GRAVES
       makes its own remains the corpse for the next one: a Necromancer who lost
       a ghoul at dusk can stand it back up that same night. This is the morning
       after, and by then there is nothing left worth keeping. */
    if (minion.down && minion.spec.perish) {
      delete next[minion.id];
      moved = true;
      lines.push({
        key: `minion-${minion.id}`,
        label: `${minion.title} is gone`,
        detail: minion.spec.swept ?? 'Destroyed, and nothing raises it again.',
        tone: 'end',
      });
      continue;
    }

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
