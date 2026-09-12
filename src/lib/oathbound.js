/**
 * The Oathbound: a talent set that hands over a **vow**, and a bar that says how
 * well it is being kept.
 *
 * The twelfth shape of what a set can give you, after the fixed hand, a
 * `loadout`, `brewing`, `enchanting`, a `minion`, the Trickster's `tricks`, the
 * Duelist's `martial`, the Feral Curse's `feral`, the Pact's debt, the
 * Runebearer's `runes`, the Spellblade's `blade` and the Weaver's `weaving`. The
 * split is the same one all eleven keep: the `oath` spec on the set in talents.js
 * says what THIS vow system is made of, oaths.js is the list of vows, and this
 * file knows what a vow IS.
 *
 * ------------------------------------------------------------------ the rules
 * Every one of these is the designer's, spoken on 2026-09-11, and none of the
 * numbers below is hard-coded here:
 *
 *   the vow       "you take a vow, and that vow binds you to having to follow
 *                  certain tenets. Each of these vows has three tenets."
 *   the magic     "based on that choice, you'll get to learn all the spells of
 *                  two sub-schools ... at Rank 1 you would know all the Novice
 *                  Fire and Light spells, at Rank 2 all the Adept, and so on
 *                  until you are Rank 3 and you know all the Master."
 *   the Attribute "your Oathbound abilities are always scaled off your highest
 *                  stat."
 *   the bar       "you start at neutral zero ... whenever you do things that go
 *                  in line with your tenets you gain Faith, and if you do
 *                  anything that's against, then you lose Faith."
 *   the bonus     "if your Faith bar is in the positive, then you have a +1 to
 *                  whatever your highest Attribute rolls ... on the other hand,
 *                  if your Faith is low because you have been sinning against
 *                  your tenets, it is the opposite effect, you have a -1."
 *   the range     "this is like a minus hundred to a hundred with a zero in the
 *                  middle."
 *   the night     "taking a Long Rest always gives you minus five to that score."
 *   the start     "someone that starts as an Oathbound starts with fifty points
 *                  right up there, so they don't have to worry too much about it."
 *
 * ------------------------------------------------------------- sworn once
 * **The vow is chosen when the set is taken, and it does not change.** "You need
 * to select the Oath before you finish the selection. It is not something you
 * select later, it is something you select at character creation, and that is
 * permanent, so you cannot change it later" (Jules, 2026-09-11).
 *
 * So `swearOath` refuses a sheet that already holds one, and there is no press
 * anywhere that unswears. The one way back is the one way back from any level:
 * hand the rank in on the Advancement tab, which takes the whole set with it.
 * `forswearOath` is what that path calls, and nothing else calls it.
 *
 * The question is asked where the set is taken rather than found later. It is an
 * `oath` row in `levelAsks`, so the Advancement tab badges a sheet that has taken
 * the set and not chosen, exactly as an unnamed creature or an unsealed pact does.
 *
 * ------------------------------------------------------------------- the bend
 * **The bonus bends the Attribute, not the sheet.** "The stat for your spell will
 * be your Mind plus one" is a fact about the card being read, in the same way a
 * creature's best Attribute is: nothing on the Character tab moves, no Health
 * arrives with a point of Physique, and a card read in the codex with nobody
 * holding it prints what it was written with.
 *
 * So it is a rider carrying an `actor`, which is `foeModifiers`'s exact shape
 * (see encounters.js). What differs is one thing and it matters: the rider names
 * the Attribute **as a key** rather than as the HIGHEST rule. A -1 on a character
 * standing 6 / 6 / 4 would leave the bent sheet at 5 / 6 / 4, and HIGHEST
 * resolved against *that* would name the Attribute the penalty did not touch and
 * print a 6. The best is settled against the unbent numbers, once, here.
 *
 * -------------------------------------------------------------------- storage
 * One `oath` jsonb column on the character, keyed by the set that granted the
 * vow:
 *
 *   { "oathbound": { oath, faith, log, sanctuary: { name, note, at } } }
 *
 * `faith` is where the bar stands and it is the only number the player moves by
 * hand. `log` is what moved it, newest first, so a table can see why a bar that
 * was at 50 is at 15. `sanctuary` is the ground a Long Rest consecrated, and it
 * is one place at a time: consecrating another lets the last one go.
 *
 * A missing field reads as its floor: no vow sworn, the bar at the spec's own
 * start, nothing logged and no ground held. Which is what makes a set taken one
 * minute ago work with nothing written for it yet.
 *
 * ------------------------------------------------------------------- this file
 * It reads the character and the codex and it writes nothing: every function
 * hands back a value or a patch body for somebody else to save. It may not import
 * characterModel.js, items.js or weapons.js. loadouts.js imports it for the two
 * families a vow opens, so it must stay above nothing and below loadouts.
 */

import { ATTRIBUTE_KEYS, highestAttribute } from './attributes.js';
import { sourceRow } from './attribution.js';
import { OATHS, getOath } from './oaths.js';
import { getTalent, normalizeTalents } from './talents.js';

/** How many rows the Faith ledger keeps. Old deeds fall off the end. */
export const FAITH_LOG_LIMIT = 80;

/**
 * What a note on a Faith movement may run to.
 *
 * Longer than a pact's 60, because a pact's note is typed by hand and this one
 * usually is not: pressing a tenet writes **that tenet** into the ledger, and a
 * tenet is a whole sentence. Cut to 60 it read "Keep going once the guilty are
 * beaten, or take payment twice", which is the wrong half of the rule. The row on
 * the block still truncates to its own width and carries the whole of it on hover.
 */
export const FAITH_NOTE_MAX = 160;

/** And what a consecrated place may be called and described as. */
export const SANCTUARY_NAME_MAX = 60;
export const SANCTUARY_NOTE_MAX = 240;

/* ------------------------------------------------------------ the spec reads */

/** The oath spec a set carries, or null for every set that swears nothing. */
export function oathOf(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return set?.oath ?? null;
}

/** Every set this character holds that binds them to a vow. */
export function oathSets(talents) {
  return normalizeTalents(talents)
    .map((entry) => {
      const talent = getTalent(entry.id);
      const spec = oathOf(talent);
      return talent && spec ? { talent, spec, entry } : null;
    })
    .filter(Boolean);
}

/** Whether this character is bound to anything at all, which is what a block asks. */
export function isOathbound(talents) {
  return oathSets(talents).length > 0;
}

/** The vows a spec offers. Its own list if it names one, else the whole codex. */
export function oathOffers(spec) {
  const ids = spec?.oaths ?? null;
  if (!Array.isArray(ids) || ids.length === 0) return OATHS;
  return ids.map((id) => getOath(id)).filter(Boolean);
}

/* --------------------------------------------------------------- the bounds */

/** Where a spec floors its bar, its ceiling, and where a new vow starts. */
function boundsOf(spec) {
  const floor = Math.floor(Number(spec?.floor ?? -100));
  const ceiling = Math.floor(Number(spec?.ceiling ?? 100));
  return {
    floor: Math.min(floor, ceiling),
    ceiling: Math.max(floor, ceiling),
    start: Math.floor(Number(spec?.start ?? 0)),
  };
}

/** A number clamped into a spec's own bar. */
export function clampFaith(spec, value) {
  const { floor, ceiling } = boundsOf(spec);
  return Math.max(floor, Math.min(ceiling, Math.floor(Number(value) || 0)));
}

/**
 * What the bar is worth to the Attribute it bends: +1, 0 or -1.
 *
 * "If your Faith bar is in the positive, then you have a +1 ... if your Faith is
 * low ... you have a -1." Zero is neither, which is what "you start at neutral
 * zero" means: the bar has a middle and standing on it buys nothing.
 *
 * The size comes off the spec rather than being the 1 he said, because a set is
 * data here and a second vow system with a bigger swing would want the same code.
 */
export function faithBonus(spec, faith) {
  const step = Math.max(0, Math.floor(Number(spec?.bonus ?? 1)));
  const held = Math.floor(Number(faith) || 0);
  if (held > 0) return step;
  if (held < 0) return -step;
  return 0;
}

/**
 * What a Long Rest takes off the bar at this rank.
 *
 * "Taking a Long Rest always gives you minus five to that score", and ABSOLUTE
 * CONVICTION at Rank 3 is the one thing that changes it. Indexed by rank like
 * every other grant in the codex.
 */
export function faithDecay(spec, rank) {
  const table = spec?.restCut;
  const said = Array.isArray(table) ? table[rank] : table;
  return Math.max(0, Math.floor(Number(said ?? 0)));
}

/* -------------------------------------------------------------- the storage */

/**
 * A stored `oath` column is only ever a hint: it may be a string, hold a set this
 * build has dropped, name a vow that no longer exists or carry a bar far outside
 * the one the spec draws. This refuses anything that is plainly not a map of rows
 * and leaves the *reading* of each field to `oathState`, which is the only place
 * that knows what a spec's bounds are.
 */
export function normalizeOath(value) {
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
    if (typeof raw.oath === 'string' && raw.oath.trim()) row.oath = raw.oath.trim();

    const faith = Number(raw.faith);
    if (Number.isFinite(faith)) row.faith = Math.floor(faith);

    const log = normalizeFaithLog(raw.log);
    if (log.length > 0) row.log = log;

    const sanctuary = normalizeSanctuary(raw.sanctuary);
    if (sanctuary) row.sanctuary = sanctuary;

    clean[id] = row;
  }
  return clean;
}

/** The ledger, newest first, capped, with every row carrying a real delta. */
function normalizeFaithLog(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const delta = Number(raw.delta);
      if (!Number.isFinite(delta) || Math.floor(delta) === 0) return null;

      const row = { id: String(raw.id ?? ''), delta: Math.floor(delta) };
      if (!row.id) return null;
      if (typeof raw.ts === 'string' && raw.ts) row.ts = raw.ts;
      if (typeof raw.note === 'string' && raw.note.trim()) {
        row.note = raw.note.trim().slice(0, FAITH_NOTE_MAX);
      }
      const tenet = Number(raw.tenet);
      if (Number.isFinite(tenet) && tenet >= 0) row.tenet = Math.floor(tenet);
      const faith = Number(raw.faith);
      if (Number.isFinite(faith)) row.faith = Math.floor(faith);
      return row;
    })
    .filter(Boolean)
    .slice(0, FAITH_LOG_LIMIT);
}

/** The consecrated ground, or null for a sheet that holds none. */
function normalizeSanctuary(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const row = {};
  if (typeof value.name === 'string' && value.name.trim()) {
    row.name = value.name.trim().slice(0, SANCTUARY_NAME_MAX);
  }
  if (typeof value.note === 'string' && value.note.trim()) {
    row.note = value.note.trim().slice(0, SANCTUARY_NOTE_MAX);
  }
  if (typeof value.at === 'string' && value.at) row.at = value.at;

  return Object.keys(row).length > 0 ? row : null;
}

/* ---------------------------------------------------------------- the state */

/**
 * Every vow this character is under, ready to be drawn. One row per set that
 * binds them, whether or not anything has been sworn yet.
 *
 * `best` and `bonus` are the two numbers every other reader actually wants, and
 * they are settled here rather than at each call site so the block, the card and
 * the roll can never print three different Attributes.
 */
export function oathState(character) {
  if (!character) return [];

  /* The sets first, and straight back out for everybody who holds none. Nothing
     below is expensive, but this runs on every render of a sheet and a character
     with no vow must pay nothing at all for this file existing. Same reason
     `feralSets` is deliberately cheap in feral.js. */
  const sets = oathSets(character.talents);
  if (sets.length === 0) return [];

  const stored = normalizeOath(character.oath);
  /* The best Attribute off the *unbent* sheet, once. See "the bend" at the top of
     this file for why it cannot be worked out again after the bonus lands. */
  const best = highestAttribute(character);

  return sets.map(({ talent, spec, entry }) => {
    const row = stored[talent.id] ?? {};
    const rank = entry.rank;
    const bounds = boundsOf(spec);

    const oath = getOath(row.oath);
    const faith = clampFaith(spec, row.faith ?? bounds.start);
    const bonus = faithBonus(spec, faith);
    const held = Math.max(0, Math.floor(Number(character[best]) || 0));

    return {
      id: talent.id,
      talent,
      spec,
      entry,
      rank,

      /* What was sworn. `oath` is null until it has been, and `sworn` is the
         question every panel on the block asks first: an Oathbound who has not
         chosen has no families, no Aura and no tenets to keep. */
      oath,
      sworn: Boolean(oath),
      tenets: oath?.tenets ?? [],
      families: oath?.families ?? [],

      /* Where the bar stands, and everything drawn off it. */
      faith,
      bonus,
      floor: bounds.floor,
      ceiling: bounds.ceiling,
      start: bounds.start,
      step: Math.max(1, Math.floor(Number(spec.step) || 1)),
      decay: faithDecay(spec, rank),

      /* The Attribute this vow rolls, and what it rolls it at. `best` is a key
         and `value` already carries the bend, which is the number a player wants
         on the block: "my spells are cast on Mind, at 7". */
      best,
      value: Math.max(0, held + bonus),
      held,

      /* What the rank has opened. Both are the spec's own numbers, indexed the
         way every other rank grant in the codex is. */
      empower: Math.max(0, Math.floor(Number(spec.empower?.[rank]) || 0)),
      apCut: Math.max(0, Math.floor(Number(spec.apCut?.[rank]) || 0)),
      consecrates: rank >= Math.floor(Number(spec.sanctuary?.rank) || Infinity),
      greater: rank >= Math.floor(Number(spec.sanctuary?.greater) || Infinity),

      /* The ground, if any is held. */
      sanctuary: row.sanctuary ?? null,
      consecrated: Boolean(row.sanctuary),

      log: row.log ?? [],
      label: spec.label ?? 'Faith',
      title: oath?.name ?? spec.unsworn ?? 'No Oath sworn',
    };
  });
}

/**
 * Whether this set has answered the question it asks at the moment it is taken.
 *
 * The shape `feralSettled` and `pactSettled` both keep, and read the same way: it
 * is what `levelAsks` badges the Advancement tab with, and what the panel on the
 * set checks before it calls itself done. An Oathbound who has taken the rank and
 * sworn nothing owes the sheet an answer.
 */
export function oathSettled(character, talentId) {
  const row = oathState(character).find((one) => one.id === talentId) ?? null;
  return Boolean(row?.sworn);
}

/** The vow a block id names, or null. */
export function oathForBlock(list, id) {
  const match = /^oath:(.+)$/.exec(String(id));
  return match ? (list.find((row) => row.id === match[1]) ?? null) : null;
}

/**
 * The block ids a character's vows add to the Character tab, in factory order.
 *
 * One block, for the Feral form's reason: what a vow needs is a bar, three lines
 * of text and a handful of presses, and that fits one 360x640 cell with the
 * ledger taking the scroll.
 */
export function oathBlockIds(character) {
  return oathState(character).map((row) => `oath:${row.id}`);
}

/* ------------------------------------------------------------- what it rides */

/**
 * The rider every card this vow grants is read and rolled with: the Attribute
 * the character stands highest in, bent by the Faith bonus.
 *
 * Handed the state row rather than the character, because `oathState` has already
 * settled which Attribute is highest against the unbent numbers and doing it
 * twice is where the tie bug lives.
 *
 * `actor` is a copy with one number moved and nothing else touched, so every
 * other value a card resolves against it (a level, a Movement Speed, a second
 * Attribute in the same formula) is still the character's own.
 */
export function oathModifiers(character, row) {
  if (!row) return null;

  const actor = { ...character, [row.best]: Math.max(0, row.held + row.bonus) };
  const riders = { stat: row.best, actor };

  const credit = sourceRow(row.oath?.name ?? row.spec.label, { stat: row.best });
  if (credit) riders.sources = [credit];

  return riders;
}

/**
 * And the riders on the set's own cards, keyed by card id, which is
 * `commandRiders`'s exact shape in undead.js.
 *
 * Three things ride, and each is a card of the set saying so:
 *
 *   the bend        on everything, for the reason above.
 *   the Aura's      `empower` from UNWAVERING and ABSOLUTE CONVICTION, `apCut`
 *                   from UNWAVERING. Both indexed by rank, both credited to the
 *                   card that gave them rather than to the set, because the
 *                   arrow and the struck-through orb have room for one name and
 *                   a reader with two sources needs to know which came off.
 *   the damage      the Oath's own type, on SMITE. The five Auras print theirs,
 *                   since each is one Oath's card; SMITE is one card for five
 *                   vows and cannot.
 *
 * Empty for a set nobody has sworn under, which keeps every card exactly as the
 * codex printed it.
 */
export function oathRiders(character, talentId = null) {
  const riders = {};

  for (const row of oathState(character)) {
    if (talentId && row.id !== talentId) continue;
    if (!row.sworn) continue;

    const base = oathModifiers(character, row);
    const sources = base?.sources ?? [];

    /* Everything the vow granted gets the bend. The Aura cards are the Oath's
       own; SMITE and the rest are the set's. */
    for (const id of cardIdsOf(row)) riders[id] = { ...base };

    /* And the Aura gets what the ranks did to it. */
    const auraId = row.oath?.aura?.id;
    if (auraId && riders[auraId]) {
      const grown = { ...riders[auraId], sources: [...sources] };

      if (row.empower > 0) {
        grown.empower = row.empower;
        const from = row.spec.empowerFrom?.[row.rank] ?? row.spec.label;
        const credit = sourceRow(from, { empower: row.empower });
        if (credit) grown.sources.push(credit);
      }

      if (row.apCut > 0) {
        grown.apCut = row.apCut;
        grown.apFloor = Math.max(0, Math.floor(Number(row.spec.apFloor) || 0));
        const from = row.spec.apCutFrom ?? row.spec.label;
        grown.apCutFrom = [from];
        const credit = sourceRow(from, { apCut: row.apCut });
        if (credit) grown.sources.push(credit);
      }

      riders[auraId] = grown;
    }

    /* And SMITE gets the Oath's damage type, since it is one card for five vows. */
    const smiteId = row.spec.smite;
    if (smiteId && riders[smiteId] && row.oath?.damage) {
      riders[smiteId] = {
        ...riders[smiteId],
        damage: [row.oath.damage],
        sources: [...sources, sourceRow(row.oath.name, { damage: [row.oath.damage] })].filter(
          Boolean
        ),
      };
    }
  }

  return riders;
}

/** Every card of this set that a holder actually holds, by id. */
function cardIdsOf(row) {
  const auraId = row.oath?.aura?.id ?? null;
  return (row.talent?.cards ?? [])
    .filter((card) => !card.oath || card.oath === row.oath?.id)
    .map((card) => card.id)
    .filter((id) => id !== auraId || Boolean(auraId));
}

/**
 * The set's cards this character really holds, which is every one of them minus
 * the four Auras they did not swear.
 *
 * A card carrying `oath` belongs to one vow (see OATH_AURAS in oaths.js), and an
 * Oathbound of Vindication holds one Aura rather than five. Nothing else in the
 * codex carries the field, so a set with no vow system loses nothing by being
 * passed through here.
 *
 * An Oathbound who has sworn nothing yet holds none of the five, which is right:
 * there is no Aura until there is an Oath to raise.
 */
export function heldOathCards(character, talent, cards) {
  const list = cards ?? talent?.cards ?? [];
  if (!list.some((card) => card.oath)) return list;

  const row = oathState(character).find((one) => one.id === (talent?.id ?? talent)) ?? null;
  const sworn = row?.oath?.id ?? null;

  return list.filter((card) => !card.oath || card.oath === sworn);
}

/**
 * The two sub-schools a character's vow opens, as the `families` a loadout gate
 * reads.
 *
 * This is what makes one `all: true` pool behave as five different ones: the spec
 * in talents.js names no family at all, and the vow on the sheet supplies the
 * pair. An Oathbound who has sworn nothing gets an empty list, and an empty list
 * refuses every card in the codex, so an unsworn Oathbound knows no spells. See
 * `gateOf` in loadouts.js.
 */
export function oathFamilies(character, talentId) {
  const row = oathState(character).find((one) => one.id === talentId) ?? null;
  return (row?.families ?? []).map((pair) => pair.family);
}

/** And the schools those families sit in, for the same gate. */
export function oathSchools(character, talentId) {
  const row = oathState(character).find((one) => one.id === talentId) ?? null;
  return [...new Set((row?.families ?? []).map((pair) => pair.school))];
}

/* ------------------------------------------------------------- the writers */

/** The `oath` column with one vow's row merged, ready to be patched. */
export function writeOath(character, id, body) {
  const stored = normalizeOath(character?.oath);
  const row = { ...(stored[id] ?? {}), ...body };

  // A field cleared is a field gone rather than a null sitting in the column.
  for (const key of ['oath', 'sanctuary']) {
    if (row[key] === null || row[key] === '') delete row[key];
  }

  return { oath: { ...stored, [id]: row } };
}

/**
 * Swearing it, which happens once and never again.
 *
 * A vow sets the bar to the spec's own start: "someone that starts as an
 * Oathbound starts with fifty points".
 *
 * **A sheet that already holds one is refused here**, which is the rule rather
 * than a guard on the button: the chooser offers no press once a vow is sworn,
 * and this refuses one anyway. See "sworn once" at the top of this file. The one
 * way back is handing the rank in, which goes through `forswearOath`.
 */
export function swearOath(character, row, oathId) {
  const oath = getOath(oathId);
  if (!row || !oath || row.sworn) return null;

  return writeOath(character, row.id, {
    oath: oath.id,
    faith: clampFaith(row.spec, row.start),
    log: [],
    sanctuary: null,
  });
}

/**
 * Handing it back: the vow, the bar and everything under it, gone.
 *
 * **Not a press on the sheet.** A vow is permanent, so the only thing that calls
 * this is giving the whole rank back on the Advancement tab, which is undoing the
 * level rather than changing your mind about what you believe.
 */
export function forswearOath(character, row) {
  if (!row) return null;
  return writeOath(character, row.id, { oath: null, faith: row.start, log: [], sanctuary: null });
}

/**
 * Moving the bar, and writing down why.
 *
 * The whole of what the player does with this set between fights. A deed in line
 * with a tenet is a gain and one against it is a loss, and which tenet it was is
 * on the row, because "you passed somebody hurt" and "you took a tyrant's gold"
 * are two different failures of two different vows and a bar that only remembers
 * the number cannot tell them apart.
 *
 * The clamp is the spec's, so a bar at 100 cannot be pushed further and a deed
 * that would have overshot is logged for what it actually moved. A movement that
 * moves nothing writes nothing at all.
 */
export function adjustFaith(character, row, delta, { note = '', tenet = null } = {}) {
  if (!row) return null;

  const want = Math.floor(Number(delta) || 0);
  if (want === 0) return null;

  const next = clampFaith(row.spec, row.faith + want);
  const moved = next - row.faith;
  if (moved === 0) return null;

  const entry = { id: newFaithId(), ts: new Date().toISOString(), delta: moved, faith: next };
  if (note.trim()) entry.note = note.trim().slice(0, FAITH_NOTE_MAX);
  if (Number.isFinite(Number(tenet))) entry.tenet = Math.max(0, Math.floor(Number(tenet)));

  return writeOath(character, row.id, {
    faith: next,
    log: [entry, ...(row.log ?? [])].slice(0, FAITH_LOG_LIMIT),
  });
}

/** The bar set outright, for a table correcting a number rather than telling a story. */
export function setFaith(character, row, value) {
  if (!row) return null;
  const next = clampFaith(row.spec, value);
  return next === row.faith ? null : writeOath(character, row.id, { faith: next });
}

let faithSeq = 0;

/** A ledger id: the clock, and a counter for two deeds logged in one millisecond. */
function newFaithId() {
  faithSeq = (faithSeq + 1) % 1000;
  return `f${Date.now().toString(36)}${faithSeq.toString(36)}`;
}

/**
 * Consecrating ground, which is what a Long Rest action buys from Rank 2.
 *
 * "You choose a space and during a Long Rest you make it your Sanctuary." One at
 * a time: consecrating another lets the last one go, which is the card's own
 * sentence and is why this replaces rather than appends.
 */
export function consecrate(character, row, { name, note } = {}) {
  if (!row) return null;

  const ground = {};
  if (name !== undefined && String(name).trim()) {
    ground.name = String(name).trim().slice(0, SANCTUARY_NAME_MAX);
  }
  if (note !== undefined && String(note).trim()) {
    ground.note = String(note).trim().slice(0, SANCTUARY_NOTE_MAX);
  }
  if (Object.keys(ground).length === 0) return null;

  ground.at = new Date().toISOString();
  return writeOath(character, row.id, { sanctuary: ground });
}

/* ------------------------------------------------------------- meditation */

/**
 * What a night spent sitting with the vow is worth, off the spec.
 *
 * "Give the Oathbound a new ability which is to meditate during a Long Rest. It
 * allows them to regain 10 Faith" (Jules, 2026-09-12). Ten against the night's
 * own five, so a night spent meditating is worth **+5** rather than +10, and an
 * Oathbound who spends every night on it climbs at half the rate a single good
 * deed does. That is the point of it: meditation is what you do in a week where
 * nothing happened, and it costs the night's one action to do.
 */
export function meditationGain(spec) {
  return Math.max(0, Math.floor(Number(spec?.meditate?.faith) || 0));
}

/** Whether this vow can be meditated on at all, which is whether there is one. */
export function canMeditate(row) {
  return Boolean(row?.sworn) && meditationGain(row.spec) > 0;
}

/**
 * Sitting with it: the Faith back, and the ledger row saying where it came from.
 *
 * The same shape `adjustFaith` hands back and deliberately not a call to it: a
 * night's meditation is written on top of whatever the night has already taken,
 * so the caller passes a character carrying the rest's own patch and the two
 * edits land on one column. See `restPlan` in rest.js.
 */
export function meditate(character, row) {
  if (!canMeditate(row)) return null;

  const held = normalizeOath(character?.oath)[row.id] ?? {};
  const faith = clampFaith(row.spec, held.faith ?? row.faith);
  const next = clampFaith(row.spec, faith + meditationGain(row.spec));
  if (next === faith) return null;

  const entry = {
    id: newFaithId(),
    ts: new Date().toISOString(),
    delta: next - faith,
    faith: next,
    note: row.spec.meditate?.label ?? 'Meditation',
  };

  return writeOath(character, row.id, {
    faith: next,
    log: [entry, ...(held.log ?? row.log ?? [])].slice(0, FAITH_LOG_LIMIT),
  });
}

/** Letting the ground go without consecrating anywhere else. */
export function razeSanctuary(character, row) {
  if (!row?.consecrated) return null;
  return writeOath(character, row.id, { sanctuary: null });
}

/* ------------------------------------------------------------ what it costs */

/**
 * The Willpower a consecrated Sanctuary is holding: what the ground takes off its
 * keeper's maximum for as long as they keep it.
 *
 * HALLOWED GROUND: "maintaining the sanctuary will take away like eight Willpower
 * points on the next day from the Oathbound." The **third** thing in the codex to
 * come off a derived maximum, after a Runebearer's slate and a Necromancer's
 * bodies, and it hands back the same shape both of those do for the same two
 * readers: `deriveStats` in characterModel.js, which is what gets written to the
 * column, and `statMath` in statMath.js, which is what the tile's breakdown
 * promises adds up to it. A debt that landed in one and not the other would make
 * the tooltip lie, which is what scripts/check-stat-math.mjs exists to catch.
 *
 * `room` is everything the maximum is made of before anything is taken off, and
 * the debt is capped at it so a maximum can never go below zero. Both readers
 * pass the same number, having already taken a slate and an Ossuary out of it.
 *
 * Only at the rank that opens the greater Sanctuary. CONSECRATION's ground is a
 * room with advantage in it and costs nothing to hold; HALLOWED GROUND's is a
 * space of its own being kept open, and that is what the eight is for.
 */
export function sanctuaryBurdenFrom(character, room = Infinity) {
  let left = Number.isFinite(room) ? Math.max(0, Math.floor(room)) : Infinity;
  const rows = [];

  for (const row of oathState(character)) {
    if (!row.consecrated || !row.greater) continue;

    const owed = Math.max(0, Math.floor(Number(row.spec.sanctuary?.willpower) || 0));
    if (owed <= 0) continue;

    const willpower = Math.min(owed, left);
    left -= willpower;
    rows.push({ talent: row.talent, willpower, owed, name: row.sanctuary?.name ?? null });
  }

  return rows;
}

/** The same, summed. 0 for everybody holding no ground. */
export function sanctuaryBurden(character, room = Infinity) {
  return sanctuaryBurdenFrom(character, room).reduce((total, row) => total + row.willpower, 0);
}

/* ---------------------------------------------------------------- the night */

/**
 * What a Long Rest does to the bar, as the `{ patch, lines }` every other rest
 * contributor hands back.
 *
 * "Taking a Long Rest always gives you minus five to that score." Always, and
 * that is the word that matters: nothing about the night earns it back, nothing
 * about the night can refuse it and the only thing that changes it is a rank.
 * Keeping a vow is a thing you do between rests.
 *
 * A bar already on its floor loses nothing and says nothing, because a line
 * reading "Faith -100 to -100" is a night reporting that it did not happen.
 *
 * Logged like a deed rather than applied silently, so the ledger on the block
 * accounts for the whole bar: a Faith that fell 40 over eight nights should say
 * eight nights, not go quietly missing.
 */
export function faithRest(character, kind) {
  if (kind !== 'long') return null;

  const rows = oathState(character);
  if (rows.length === 0) return null;

  const patch = {};
  const lines = [];
  let column = normalizeOath(character?.oath);

  for (const row of rows) {
    if (row.decay <= 0) continue;

    const next = clampFaith(row.spec, row.faith - row.decay);
    if (next === row.faith) continue;

    const entry = {
      id: newFaithId(),
      ts: new Date().toISOString(),
      delta: next - row.faith,
      faith: next,
      note: 'A night passed',
    };

    column = {
      ...column,
      [row.id]: {
        ...(column[row.id] ?? {}),
        faith: next,
        log: [entry, ...(row.log ?? [])].slice(0, FAITH_LOG_LIMIT),
      },
    };

    lines.push({
      key: `faith-${row.id}`,
      label: `${row.label} ${row.faith} to ${next}`,
      detail: row.sworn
        ? `A night off the road costs ${row.decay}. Keeping ${row.oath.name} is something you do between rests.`
        : `A night off the road costs ${row.decay}.`,
      tone: 'cost',
    });
  }

  if (lines.length === 0) return null;

  patch.oath = column;
  return { patch, lines };
}

/* ------------------------------------------------------------- for the block */

/** "Light and Fire", off a state row rather than off an Oath. */
export function familyLine(row) {
  const names = (row?.families ?? []).map((pair) => pair.family);
  if (names.length === 0) return 'nothing yet';
  return names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Where the bar sits as a fraction of its whole span, for a meter that has a
 * middle rather than an empty end.
 *
 * Every other bar on this sheet runs 0 to a maximum and fills from the left. This
 * one runs -100 to 100 with a zero in the middle, so what a drawer needs is not
 * "how full" but "how far along", and where the middle is.
 */
export function faithGauge(row) {
  const span = Math.max(1, row.ceiling - row.floor);
  return {
    percent: ((row.faith - row.floor) / span) * 100,
    middle: ((0 - row.floor) / span) * 100,
    span,
  };
}

/** The Attribute keys, re-exported so the block need not reach past this file. */
export { ATTRIBUTE_KEYS };
