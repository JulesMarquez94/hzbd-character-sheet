/**
 * Creatures a table forged for itself.
 *
 * The bestiary in creatures.js is codex data, shipped with the site. This is the
 * other half, and it is the half that lives in the database: a Game Master
 * builds an enemy, it lands on their own shelf, and from that moment it is a
 * creature like any other. It appears in the Bestiary tab, it can be added to an
 * encounter, it rolls with the same arithmetic, and it signs the log the same
 * way. Nothing downstream of `getCreature` knows the difference, which is the
 * whole design: one enemy block, one set of stat math, one shelf.
 *
 * Jules, 2026-09-02: "I want you to create a tool in the bestiary that allow the
 * user to add a custom made entity. Note that it should be able to learn any
 * ability the player can use. For premium user they can create personal one with
 * a cap. They have to edit or remove existing one if they want to do new one.
 * Admins can create one that are added for everyone. Free and Friends for now
 * cannot."
 *
 * ------------------------------------------------------------------ two scopes
 *   personal   one account's own. It counts against that account's slots (see
 *              CREATURE_SLOTS in tiers.js) and only they and an admin browse it.
 *   codex      an admin's, published into the shelf every account reads. The
 *              `forgeCodex` capability, and the reason it is the keys: a row here
 *              is on everybody's screen.
 *
 * ---------------------------------------------------------- what it can learn
 * "Any ability the player can use", taken literally: the picker is the whole
 * card registry (see `forgeableCards`), so a forged creature can hold Fireball,
 * a martial move, a lineage trait or the Blightgeist's own Blightbolt. That is
 * why this file exists rather than the forge writing into creatures.js: the
 * registry lives in weapons.js, weapons.js imports creatures.js, and creatures.js
 * must stay a leaf. This file sits above both and resolves the cards on the way
 * in, so what reaches the registry carries card objects rather than ids.
 *
 * ------------------------------------------------------------- the two halves
 * `normalizeBody` is the trust boundary. A stored body is jsonb written by a
 * client, so every number is clamped, every id is checked against the codex and
 * every string is cut to length before anything reads it. The database's own
 * guards (the slot cap, the scope) are in supabase/schema.sql, because a ceiling
 * the client enforces is not a ceiling.
 *
 * `hydrateCreature` is the shape creatures.js wants: a prefixed id, resolved
 * cards, and the provenance a shelf needs to draw an Edit button.
 */

import { requireSupabase } from './supabaseClient.js';
import {
  CREATURE_MAX_LEVEL,
  FORGED_PREFIX,
  RANKS,
  clampCreatureLevel,
  getRank,
  registerForged,
} from './creatures.js';
import { BASIC_ACTIONS } from './actions.js';
import { CARDS, getCard } from './weapons.js';

/* ------------------------------------------------------------------ the shape */

/** How long each hand-typed field may be. */
export const FORGED_NAME_MAX = 60;
export const FORGED_TYPE_MAX = 40;
export const FORGED_LORE_MAX = 1200;
const URL_MAX = 500;

/** How many cards one forged creature may hold. The printed pages carry two or
    three; twelve is room for a boss with a whole repertoire and a ceiling that
    keeps one row from becoming a spellbook. */
export const FORGED_CARDS_MAX = 12;

/** The hit dice a creature may be built on, which are the ones the codex uses. */
export const FORGED_DICE = [4, 6, 8, 10, 12, 20];

/** The sizes the printed type lines are written from. A type is `<size> <kind>`:
    "Small Undead", "Huge Dragon". Free text for the kind, because the codex has
    nine kinds today and a table will want the tenth. */
export const FORGED_SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];

/** The kinds the codex has used so far, offered as suggestions rather than as a
    closed list. */
export const FORGED_KINDS = [
  'Aberration',
  'Beast',
  'Construct',
  'Dragon',
  'Elemental',
  'Fiend',
  'Humanoid',
  'Plant',
  'Undead',
];

/**
 * Every field on a body, with what it may hold. One table rather than a wall of
 * clamps, so the form, the normalizer and the checker all read the same limits
 * and cannot drift apart.
 *
 * `step` is what the form nudges by and `dp` how many decimals survive. Two
 * coefficients keep a half: a Fenrat Skirmisher is 1.5 Health a Physique, which
 * is the design sheet's own arithmetic and not a rounding error.
 */
export const FORGED_FIELDS = {
  xp: { label: 'XP a level', min: 0, max: 9999, step: 5, dp: 0 },
  'health.perLevel': { label: 'Health a level', min: 0, max: 40, step: 1, dp: 1 },
  'health.perPhysique': { label: 'Health a Physique', min: 0, max: 40, step: 1, dp: 1 },
  'willpower.perLevel': { label: 'Willpower a level', min: 0, max: 20, step: 1, dp: 1 },
  'willpower.perMind': { label: 'Willpower a Mind', min: 0, max: 20, step: 1, dp: 1 },
  'willpower.flat': { label: 'Willpower, flat', min: 0, max: 100, step: 1, dp: 0 },
  avoid_bonus: { label: 'Defense over Instinct', min: 0, max: 30, step: 1, dp: 0 },
  armor: { label: 'Armor', min: 0, max: 30, step: 1, dp: 0 },
  speed_m: { label: 'Speed, meters', min: 0, max: 60, step: 1, dp: 1 },
  ap_max: { label: 'Action Points', min: 0, max: 30, step: 1, dp: 0 },
  reaction_max: { label: 'Reaction Points', min: 0, max: 30, step: 1, dp: 0 },
};

/** How far a creature's own `bonus` may move an attribute either way. The codex
    spans -3 to +2; ten each way is room for a deliberate monster. */
const BONUS_LIMIT = 10;

const ATTRIBUTE_KEYS = ['physique', 'instinct', 'mind'];

/** Ids that are on every creature's bar already. Offering one would print it
    twice: see `basicGroup` in combatBar.js, which hands them to everybody. Up
    here because both halves of the rule read it, the normalizer below and the
    picker further down. */
const ALREADY_EVERYONE = new Set(BASIC_ACTIONS.map((card) => card.id));

/** Whatever a body says, held inside a number this file will admit to. */
function held(value, { min, max, dp }, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const factor = 10 ** dp;
  return Math.min(max, Math.max(min, Math.round(n * factor) / factor));
}

function text(value, max) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * A body, cleaned. The one function every reader of a stored creature goes
 * through, and the reason nothing downstream has to be defensive.
 *
 * A rank this build has never heard of reads as Minion, the way `getRank`
 * already resolves one, because a creature that cannot be drawn is worse than a
 * creature drawn as the weakest thing it could be.
 */
export function normalizeBody(raw) {
  const body = raw && typeof raw === 'object' ? raw : {};
  const rank = getRank(String(body.rank ?? ''));

  const primary = ATTRIBUTE_KEYS.includes(body.primary) ? body.primary : 'physique';
  const secondary = ATTRIBUTE_KEYS.includes(body.secondary) ? body.secondary : 'instinct';

  const bonus = {};
  for (const key of ATTRIBUTE_KEYS) {
    bonus[key] = held(body.bonus?.[key], { min: -BONUS_LIMIT, max: BONUS_LIMIT, dp: 0 });
  }

  /* Card ids, checked against the registry and deduplicated. An id the codex no
     longer holds is dropped rather than kept as a broken link: a card renamed
     out from under a forged creature costs it that card and nothing else. */
  const cards = [];
  for (const id of Array.isArray(body.cards) ? body.cards : []) {
    const card = getCard(id);
    if (!card || cards.includes(card.id)) continue;
    // A basic action is on every bar already, so one stored here would print
    // twice. Refused in the same place the picker refuses to offer it.
    if (ALREADY_EVERYONE.has(card.id)) continue;
    cards.push(card.id);
    if (cards.length >= FORGED_CARDS_MAX) break;
  }

  const die = FORGED_DICE.includes(Number(body.die)) ? Number(body.die) : 8;

  return {
    name: text(body.name, FORGED_NAME_MAX) || 'Unnamed Creature',
    type: text(body.type, FORGED_TYPE_MAX) || 'Medium Beast',
    rank: rank.id,
    level: clampCreatureLevel(body.level),
    xp: held(body.xp, FORGED_FIELDS.xp, 10),

    primary,
    secondary,
    bonus,

    health: {
      perLevel: held(body.health?.perLevel, FORGED_FIELDS['health.perLevel']),
      perPhysique: held(body.health?.perPhysique, FORGED_FIELDS['health.perPhysique']),
    },
    willpower: {
      perLevel: held(body.willpower?.perLevel, FORGED_FIELDS['willpower.perLevel']),
      perMind: held(body.willpower?.perMind, FORGED_FIELDS['willpower.perMind']),
      flat: held(body.willpower?.flat, FORGED_FIELDS['willpower.flat']),
    },

    avoid_bonus: held(body.avoid_bonus, FORGED_FIELDS.avoid_bonus),
    armor: held(body.armor, FORGED_FIELDS.armor),
    speed_m: held(body.speed_m, FORGED_FIELDS.speed_m),
    die,

    /* Both point pools default to the rank's, exactly as a printed creature's do
       (see `creatureStats`), so a body that says nothing about them gets the
       rank's clock. A Minion's Reaction Points are still forced to zero
       downstream: the rule is the creature's, not the form's. */
    ap_max: held(body.ap_max, FORGED_FIELDS.ap_max, rank.ap),
    reaction_max: held(body.reaction_max, FORGED_FIELDS.reaction_max, rank.reaction),

    cards,
    lore: text(body.lore, FORGED_LORE_MAX),
    portrait_url: text(body.portrait_url, URL_MAX) || null,
  };
}

/**
 * A blank one, at the rank asked for.
 *
 * The numbers are a General's: a body the party fights like one of their own,
 * which is the middle of the three and the least wrong starting point for
 * whatever is being built. Health and Willpower start on the character's own
 * conversions, so a creature nobody touches after opening the forge is a
 * plausible enemy rather than a corpse.
 */
export function blankBody(rank = 'general') {
  /* The name is put back empty after the clean, deliberately: the normalizer
     fills an unnamed creature in as "Unnamed Creature" so nothing stored is ever
     nameless, and a form that opened with those words already typed would make
     the reader delete them before writing their own. */
  return {
    ...normalizeBody({
      name: '',
    type: 'Medium Humanoid',
    rank,
    level: 4,
    xp: 25,
    primary: 'physique',
    secondary: 'instinct',
    bonus: { physique: 0, instinct: 0, mind: 0 },
    health: { perLevel: 6, perPhysique: 6 },
    willpower: { perLevel: 2, perMind: 2, flat: 10 },
    avoid_bonus: 5,
    armor: 1,
    speed_m: 5,
      die: 10,
      cards: [],
      lore: '',
    }),
    name: '',
  };
}

/* ------------------------------------------------------------- what it learns */

/**
 * Every card a forged creature may be taught.
 *
 * The whole registry, which is the literal reading of "any ability the player
 * can use", less the basic actions every body on the board already has. Nothing
 * else is filtered: a creature holding a lineage trait as a passive or an
 * Alchemist's ingredient as a move is a call for the table to make, and a codex
 * this file pruned by taste would be a second, quieter set of rules.
 */
export function forgeableCards() {
  return CARDS.filter((card) => !ALREADY_EVERYONE.has(card.id));
}

/* ---------------------------------------------------------------- the row */

/** The creature id a row is known by, everywhere a creature is named. */
export function forgedId(rowId) {
  return `${FORGED_PREFIX}${rowId}`;
}

/** And back again, for the one caller that has a creature and wants its row. */
export function rowIdOf(creatureId) {
  const id = String(creatureId ?? '');
  return id.startsWith(FORGED_PREFIX) ? id.slice(FORGED_PREFIX.length) : null;
}

/**
 * A database row as a creature the registry will take.
 *
 * The cards are resolved here, which is the whole reason this function is above
 * creatures.js rather than in it. Everything else is provenance: `forged` is what
 * the shelf draws an Edit button off, `scope` is which shelf it belongs to, and
 * `row` is what an update writes to.
 */
export function hydrateCreature(row) {
  if (!row?.id) return null;
  const body = normalizeBody(row.body);

  return {
    ...body,
    id: forgedId(row.id),
    row: row.id,
    forged: true,
    scope: row.scope === 'codex' ? 'codex' : 'personal',
    owner: row.user_id ?? null,
    /* Card objects rather than ids, because creatures.js cannot reach the
       registry that holds them. See the note on FORGED there. */
    cards: body.cards.map(getCard).filter(Boolean),
  };
}

/* ----------------------------------------------------------------- the table */

/**
 * Whether an error means the table is not there at all.
 *
 * There is one case where an empty shelf is the right answer instead of an
 * error, and it is this one: a deploy that has not had supabase/schema.sql run
 * against it yet. With no table there are no forged creatures, so no encounter
 * can be holding one, so nothing can be lost by carrying on. Every *other*
 * failure is thrown, because a read that failed against a table that does exist
 * is exactly the case where carrying on would quietly drop somebody's enemies.
 *
 * Two codes, because PostgREST answers from a cached copy of the schema: 42P01
 * is Postgres saying the relation is missing and PGRST205 is the cache saying
 * it has never heard of it.
 */
function missingTable(error) {
  if (!error) return false;
  if (error.code === '42P01' || error.code === 'PGRST205') return true;
  return /could not find the table|does not exist/i.test(String(error.message ?? ''));
}

/**
 * Every forged creature this account can read: its own, plus every published
 * one. Two queries rather than one `or`, so a failure to read somebody's own
 * shelf can never be mistaken for an empty codex.
 */
export async function listForgedCreatures(userId) {
  const sb = requireSupabase();

  const { data: published, error } = await sb
    .from('custom_creatures')
    .select('*')
    .eq('scope', 'codex')
    .order('created_at', { ascending: true });
  if (missingTable(error)) return [];
  if (error) throw error;

  let own = [];
  if (userId) {
    const { data, error: ownError } = await sb
      .from('custom_creatures')
      .select('*')
      .eq('user_id', userId)
      .eq('scope', 'personal')
      .order('created_at', { ascending: true });
    if (missingTable(ownError)) return [];
    if (ownError) throw ownError;
    own = data ?? [];
  }

  return [...(published ?? []), ...own];
}

/**
 * Read the shelf and put it in the registry.
 *
 * Called once, before anything that could name a creature has rendered. That
 * order matters more than it looks: `normalizeFoes` drops a foe whose creature
 * it cannot find, and the next write would persist the drop, so an encounter
 * holding a forged enemy must never be drawn before this has landed. See
 * CampaignPage, which waits on it with the campaign itself.
 *
 * Hands back the hydrated list, so a caller can count what it got.
 */
export async function loadForgedCreatures(userId) {
  const rows = await listForgedCreatures(userId);
  const creatures = rows.map(hydrateCreature).filter(Boolean);
  registerForged(creatures);
  return creatures;
}

/** How many personal creatures this account is holding. What the cap is counted
    against, and the same count the database's own guard makes. */
export async function countOwnCreatures(userId) {
  const sb = requireSupabase();
  const { count, error } = await sb
    .from('custom_creatures')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('scope', 'personal');
  if (missingTable(error)) return 0;
  if (error) throw error;
  return count ?? 0;
}

export async function createForgedCreature(userId, body, scope = 'personal') {
  const sb = requireSupabase();
  const row = {
    user_id: userId,
    scope: scope === 'codex' ? 'codex' : 'personal',
    body: normalizeBody(body),
  };
  const { data, error } = await sb.from('custom_creatures').insert(row).select().single();
  if (error) throw forgeError(error);
  return data;
}

export async function updateForgedCreature(rowId, body, scope = null) {
  const sb = requireSupabase();
  const patch = { body: normalizeBody(body) };
  if (scope) patch.scope = scope === 'codex' ? 'codex' : 'personal';
  const { data, error } = await sb
    .from('custom_creatures')
    .update(patch)
    .eq('id', rowId)
    .select()
    .single();
  if (error) throw forgeError(error);
  return data;
}

export async function deleteForgedCreature(rowId) {
  const sb = requireSupabase();
  const { error } = await sb.from('custom_creatures').delete().eq('id', rowId);
  if (error) throw error;
}

/**
 * The database's own refusals, said in the words the forge should show.
 *
 * The cap and the scope are enforced by a trigger and a policy, which is where
 * they have to be. What comes back from one is a Postgres exception, and "new
 * row violates row-level security policy" is not a sentence to put in front of
 * a Game Master.
 */
function forgeError(error) {
  const said = String(error?.message ?? '');
  if (missingTable(error)) {
    return new Error(
      'The forge has no table to write to yet. Run supabase/schema.sql against this project and try again.'
    );
  }
  if (/creature slot/i.test(said)) {
    return new Error(
      'Every creature slot on this account is full. Edit one you already have, or remove one to make room.'
    );
  }
  if (/row-level security|violates/i.test(said)) {
    return new Error(
      'This account cannot forge that creature. Publishing to the shared bestiary is an admin.'
    );
  }
  return error;
}

/* --------------------------------------------------------------- the ranks */

/** The three ranks and the level ceiling, re-exported so the forge reaches past
    this file for nothing it needs. */
export { CREATURE_MAX_LEVEL, RANKS };
