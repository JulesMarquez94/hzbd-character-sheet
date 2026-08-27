/**
 * The Pact of Ordenance — a bargain with the entity living in a weapon.
 *
 * The eighth shape of what a set can hand over, beside a fixed hand, a
 * `loadout`, a `brewing` spec, an `enchanting` one, a `minion`, the Trickster's
 * `tricks`, the Duelist's `martial` and the Feral Curse's `feral`: this one
 * hands over a **debt**. The set grants little on its own; everything else is
 * bought by feeding the pact what it hungers for, and this file is the ledger
 * of that feeding.
 *
 * Handed over in chat by the designer on 2026-08-27, in his own words: a pact
 * with a weapon "that is either inhabited or connected to a powerful entity",
 * two shapes of it (souls or treasure), an XP-style bar whose price climbs with
 * every fill, boons claimed in a fixed printed order and capped at four a rank,
 * GM missions worth a set amount, and a weapon that cannot be lost. The open
 * readings that spec left are logged in data/README.md under "The Pact of
 * Ordenance, 2026-08-27".
 *
 * Same split as minions.js and feral.js: the `pact` spec on the set in
 * talents.js says what THIS pact is made of (its two kinds, their prices, the
 * boon ladder, the loop factor), and this file knows what a pact IS. talents.js
 * stays a leaf.
 *
 * ------------------------------------------------------------------ storage
 * One jsonb column, `pact`, keyed by the granting set id:
 *
 *   { "pactbound": {
 *       kind: 'souls' | 'collector' | null,   // which bargain was struck
 *       form: 'melee-heavy' | null,           // the weapon the blade is shaped as
 *       weapon: 'forged-…' | null,            // the instance in the forge registry
 *       progress: 12040,                      // lifetime total, never spent down
 *       picks: { 'grant-spell': 'ember',      // boon id -> what was learned.
 *                'novice-enchant': { id, spell? }, … },  // enchant boons store both halves
 *       extra: [{ kind: 'spell', pick: 'x' }, …],  // the endless bargain's picks, in claim order
 *       missions: [{ id, title, body, value }],    // active, at most spec.missions.max
 *       log: [{ id, ts, kind, delta, note }],      // newest first, capped
 *     } }
 *
 * `progress` is a lifetime total like XP, and the bars are derived from it, so
 * nothing is ever subtracted and a tally can never be lost to a claim. A sheet
 * with no such set never writes the column.
 *
 * ------------------------------------------------------------------- imports
 * moves.js and items-adjacent callers read this file, so it must not import
 * items.js, moves.js or characterModel.js (all three sit above it). What it
 * needs from the item world comes through forged.js, which is a leaf, and
 * through arguments at the call.
 */

import { HIGHEST } from './attributes.js';
import { getEnchantment } from './enchantments.js';
import { forgeRecord, normalizeForged } from './forged.js';
import { WEAPONS, getCard } from './weapons.js';
import { getTalent, normalizeTalents } from './talents.js';

/** How many log rows a pact keeps. Old feedings fall off the end, like the ledger. */
export const PACT_LOG_LIMIT = 120;

/** What a mission title and body may run to. */
export const PACT_TITLE_MAX = 60;
export const PACT_BODY_MAX = 400;

/** A note on a tally or a tribute, the same length a ledger note gets. */
export const PACT_NOTE_MAX = 60;

/* ------------------------------------------------------------ the spec reads */

/** The pact spec on a set, or null. Accepts an id or the talent itself. */
export function pactOf(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return set?.pact ?? null;
}

/** Every held set that carries a pact spec: [{ talent, spec, entry }]. */
export function pactSets(talents) {
  return normalizeTalents(talents)
    .map((entry) => {
      const talent = getTalent(entry.id);
      const spec = talent?.pact ?? null;
      return talent && spec ? { talent, spec, entry } : null;
    })
    .filter(Boolean);
}

/** One kind row off the spec, by id. */
export function pactKind(spec, kindId) {
  return (spec?.kinds ?? []).find((row) => row.id === kindId) ?? null;
}

/* ---------------------------------------------------------------- the column */

/**
 * The stored column, repaired rather than trusted, the way every jsonb column
 * on this sheet is. A row holds only what has actually happened to it; every
 * absent field reads as its floor.
 */
export function normalizePact(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {};

  const out = {};
  for (const [key, raw] of Object.entries(source)) {
    if (!raw || typeof raw !== 'object') continue;
    out[String(key)] = {
      kind: raw.kind === 'souls' || raw.kind === 'collector' ? raw.kind : null,
      form: cleanId(raw.form),
      weapon: cleanId(raw.weapon),
      progress: Math.max(0, Math.floor(Number(raw.progress) || 0)),
      picks: normalizePicks(raw.picks),
      extra: normalizeExtra(raw.extra),
      missions: normalizeMissions(raw.missions),
      log: normalizeLog(raw.log),
    };
  }
  return out;
}

function cleanId(value) {
  const clean = String(value ?? '').trim();
  return clean || null;
}

/**
 * A pick is a card id for a spell, a move or a skill, and `{ id, spell? }` for
 * an enchantment — an Imbuement binds a spell the moment it is chosen, so the
 * boon has to remember both halves.
 */
function normalizePicks(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'string' && raw.trim()) {
      out[key] = raw.trim();
    } else if (raw && typeof raw === 'object' && typeof raw.id === 'string' && raw.id.trim()) {
      const spell = typeof raw.spell === 'string' ? raw.spell.trim() : '';
      out[key] = spell ? { id: raw.id.trim(), spell } : { id: raw.id.trim() };
    }
  }
  return out;
}

function normalizeExtra(value) {
  const list = Array.isArray(value) ? value : [];
  return list
    .filter((row) => row && typeof row === 'object' && typeof row.pick === 'string' && row.pick)
    .map((row) => ({
      kind: row.kind === 'martial-move' ? 'martial-move' : 'spell',
      pick: row.pick,
    }));
}

function normalizeMissions(value) {
  const list = Array.isArray(value) ? value : [];
  return list
    .filter((row) => row && typeof row === 'object' && String(row.title ?? '').trim())
    .map((row) => ({
      id: String(row.id ?? '') || newPactId(),
      title: String(row.title).trim().slice(0, PACT_TITLE_MAX),
      body: String(row.body ?? '').trim().slice(0, PACT_BODY_MAX),
      value: Math.max(0, Math.floor(Number(row.value) || 0)),
    }));
}

function normalizeLog(value) {
  const list = Array.isArray(value) ? value : [];
  return list
    .filter((row) => row && typeof row === 'object')
    .slice(0, PACT_LOG_LIMIT)
    .map((row) => ({
      id: String(row.id ?? '') || newPactId(),
      ts: typeof row.ts === 'string' ? row.ts : null,
      kind: String(row.kind ?? 'note'),
      delta: Math.floor(Number(row.delta) || 0),
      note: String(row.note ?? '').slice(0, PACT_TITLE_MAX + PACT_NOTE_MAX),
    }));
}

export function newPactId() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
}

/* ------------------------------------------------------------------ the bars */

/**
 * What the nth bar costs to fill, 0-based.
 *
 * The designer's own numbers: a Collector's Pact starts at 4000 coins and grows
 * by 2000 with every fill; a Soulreaping Pact starts at 8 and grows by 4. Once
 * the ladder of set boons is exhausted the static step stops and every further
 * bar costs half again the one before it, rounded up — "the cost is increased
 * by 50% instead of static".
 */
export function pactThreshold(spec, kind, n) {
  if (!kind) return Infinity;
  const start = Math.max(1, Math.floor(Number(kind.start) || 1));
  const step = Math.max(0, Math.floor(Number(kind.step) || 0));
  const ladder = (spec?.boons ?? []).length;
  const factor = Number(spec?.loop?.factor) || 1.5;

  if (n < ladder) return start + step * n;

  let cost = start + step * (ladder - 1);
  for (let i = ladder; i <= n; i += 1) cost = Math.ceil(cost * factor);
  return cost;
}

/**
 * Where a lifetime total stands on the ladder: how many bars it has filled,
 * how far into the next one it is, and what that next one costs.
 *
 * Walked rather than solved, because the ladder changes rule partway. The walk
 * is capped well past anything a table reaches, so a corrupted total cannot
 * spin the sheet.
 */
export function pactBars(spec, kind, progress) {
  const total = Math.max(0, Math.floor(Number(progress) || 0));
  let filled = 0;
  let rest = total;

  for (let i = 0; i < 400; i += 1) {
    const need = pactThreshold(spec, kind, filled);
    if (!Number.isFinite(need) || rest < need) {
      return { filled, into: rest, need: Number.isFinite(need) ? need : 0, total };
    }
    rest -= need;
    filled += 1;
  }
  return { filled, into: rest, need: pactThreshold(spec, kind, filled), total };
}

/* ----------------------------------------------------------------- the state */

/**
 * THE state reader: one derived row per held set that carries a pact spec.
 * Everything a block, a picker or a rest window asks about a pact is on it.
 */
export function pactState(character) {
  const sets = pactSets(character?.talents);
  if (sets.length === 0) return [];

  const stored = normalizePact(character?.pact);
  const forged = normalizeForged(character?.forged);

  return sets.map(({ talent, spec, entry }) => {
    const row = stored[talent.id] ?? {
      kind: null,
      form: null,
      weapon: null,
      progress: 0,
      picks: {},
      extra: [],
      missions: [],
      log: [],
    };

    const rank = entry.rank;
    const kind = pactKind(spec, row.kind);
    const record = row.weapon ? (forged[row.weapon] ?? null) : null;

    /* The ladder, each rung wearing its state. `locked` is a rung whose rank
       this character has not bought; a locked rung can be seen and never
       claimed, the same way a stub set sits on the wall.

       `lapsed` is a claimed rung whose rank has since been given back: the
       pick is remembered and grants nothing until the rank returns. A level
       lost takes back what it bought — the codex's own law — and what it does
       not give back is the bar the claim spent, the same way a stripped
       enchantment keeps the Supplies that went into the work. */
    const boons = (spec.boons ?? []).map((boon) => {
      const pick = row.picks[boon.id] ?? null;
      const state = pick
        ? boon.rank <= rank
          ? 'claimed'
          : 'lapsed'
        : boon.rank <= rank
          ? 'open'
          : 'locked';
      return { boon, state, pick };
    });

    /* Lapsed rungs and the endless picks still count against the bars: the
       claim was paid when it was made, and giving the rank back does not
       refund the feeding. */
    const claimedCount =
      boons.filter((one) => one.state === 'claimed' || one.state === 'lapsed').length +
      row.extra.length;
    const allClaimed = boons.every((one) => one.state === 'claimed');
    const loopOpen = Boolean(spec.loop) && rank >= 3 && allClaimed;

    const bars = pactBars(spec, kind, row.progress);
    const pending = Math.max(0, bars.filled - claimedCount);

    const open = boons.filter((one) => one.state === 'open');
    const nextBoon = open[0]?.boon ?? null;
    const claimable = pending > 0 && (open.length > 0 || loopOpen);

    const grants = (spec.grants ?? []).map((grant) => ({
      grant,
      pick: row.picks[grant.id] ?? null,
    }));

    const sealed =
      Boolean(kind) && Boolean(record) && grants.every((one) => Boolean(one.pick));

    return {
      id: talent.id,
      talent,
      spec,
      entry,
      rank,
      row,
      kind,
      chosen: Boolean(kind),
      form: row.form,
      weapon: record,
      grants,
      boons,
      extra: row.extra,
      bars,
      pending,
      claimable,
      nextBoon,
      loopOpen,
      allClaimed,
      missions: row.missions,
      log: row.log,
      sealed,
      title: spec.label,
    };
  });
}

/** Whether the take-time questions are answered, for the Advancement badge. */
export function pactSettled(character, id) {
  const row = pactState(character).find((one) => one.id === id);
  return row ? row.sealed : true;
}

/* ------------------------------------------------------------------ blocks */

/** The Character-tab block each pact grows: `pact:<setId>`. */
export function pactBlockIds(character) {
  return pactState(character).map((row) => `pact:${row.id}`);
}

export function pactForBlock(rows, id) {
  const match = /^pact:(.+)$/.exec(String(id));
  return match ? (rows.find((row) => row.id === match[1]) ?? null) : null;
}

/* ----------------------------------------------------------------- writers */

/**
 * Merge one pact row and hand back the patch body. `undefined` means "not part
 * of this write"; null clears a field. The same contract writeMinion keeps,
 * because the naming window writes one field at a time.
 */
export function writePact(character, id, body) {
  const stored = normalizePact(character?.pact);
  const current = stored[String(id)] ?? {};
  const next = { ...current };

  for (const [key, value] of Object.entries(body ?? {})) {
    if (value === undefined) continue;
    if (value === null) delete next[key];
    else next[key] = value;
  }

  return { pact: { ...stored, [String(id)]: next } };
}

/** One log entry onto the front of a row's log, capped. */
function logged(row, entry) {
  return [
    { id: newPactId(), ts: new Date().toISOString(), ...entry },
    ...(row?.log ?? []),
  ].slice(0, PACT_LOG_LIMIT);
}

/** Strike the bargain: which of the two pacts this is. */
export function sealPactKind(character, state, kindId) {
  const kind = pactKind(state.spec, kindId);
  if (!kind) return null;

  return writePact(character, state.id, {
    kind: kind.id,
    log: logged(state.row, {
      kind: 'seal',
      delta: 0,
      note: state.chosen ? `The bargain reshaped: ${kind.label}` : `${kind.label} sealed`,
    }),
  });
}

/**
 * The pact weapon's record, minted for the form the wielder chose. The caller
 * owns the equipment write — this file may not reach items.js — so what comes
 * back is the record to store, flagged as the pact's so the meter and the
 * guards can tell it from an ordinary forged piece.
 */
export function mintPactWeapon(state, weapon) {
  if (!weapon?.id) return null;
  const record = forgeRecord({
    base: weapon.id,
    ench: pactWeaponEnch(state),
    name: `Pact-Bound ${weapon.name}`,
    art: null,
  });
  return record ? { ...record, pact: state.id } : null;
}

/**
 * The enchant boons a pact has claimed, in the shape a forged record's `ench`
 * takes. Handed a picks map so a claim being written right now can build the
 * record it is about to store, rather than the one from a render ago.
 */
export function pactWeaponEnch(state, picks = state.row.picks) {
  return (state.spec.boons ?? [])
    .filter((boon) => boon.kind === 'enchant' && picks[boon.id])
    .map((boon) => {
      const pick = picks[boon.id];
      return typeof pick === 'string' ? { id: pick } : pick;
    });
}

/**
 * The record reshaped into another form. The workings ride along: same weapon,
 * new shape. `ench` is rebuilt from the pact's own picks rather than copied,
 * so a record that ever drifted from them is healed by the next reshape.
 */
export function reshapePactWeapon(state, weapon) {
  if (!state.weapon || !weapon?.id) return null;
  return {
    ...state.weapon,
    base: weapon.id,
    name: `Pact-Bound ${weapon.name}`,
    ench: pactWeaponEnch(state),
  };
}

/**
 * The pact row's own half of a form change, whoever writes the record.
 * `recordId` is passed on the first binding, when the row learns which forged
 * record is the pact's; a reshape leaves it undefined and the row keeps it.
 */
export function writePactForm(character, state, weapon, recordId = undefined) {
  return writePact(character, state.id, {
    form: weapon.id,
    weapon: recordId,
    log: logged(state.row, {
      kind: 'form',
      delta: 0,
      note: state.form ? `Reshaped into a ${weapon.name}` : `Took the form of a ${weapon.name}`,
    }),
  });
}

/* ---------------------------------------------------------------- progress */

/**
 * Feeding the pact. `kind` names what fed it — 'souls', 'coins', 'item',
 * 'mission' — and the note is the player's own words, so the log reads like
 * the level ledger does.
 */
export function addPactProgress(character, state, amount, { kind = 'note', note = '' } = {}) {
  const fed = Math.max(0, Math.floor(Number(amount) || 0));
  if (fed <= 0) return null;

  return writePact(character, state.id, {
    progress: state.row.progress + fed,
    log: logged(state.row, { kind, delta: fed, note: String(note).slice(0, PACT_NOTE_MAX + PACT_TITLE_MAX) }),
  });
}

/** Souls are worth their level: two level 4 kills feed the pact 8. */
export function tallySouls(character, state, count, level, note = '') {
  const heads = Math.max(0, Math.floor(Number(count) || 0));
  const worth = Math.max(1, Math.floor(Number(level) || 1));
  if (heads <= 0) return null;

  const said = note || `${heads} ${heads === 1 ? 'soul' : 'souls'} of level ${worth}`;
  return addPactProgress(character, state, heads * worth, { kind: 'souls', note: said });
}

/* ---------------------------------------------------------------- missions */

/** The pact giver's errand, written by the table. At most `spec.missions.max` stand. */
export function createMission(character, state, { title, body, value }) {
  const max = Math.max(1, Math.floor(Number(state.spec.missions?.max) || 2));
  if (state.missions.length >= max) return null;

  const clean = String(title ?? '').trim();
  if (!clean) return null;

  const mission = {
    id: newPactId(),
    title: clean.slice(0, PACT_TITLE_MAX),
    body: String(body ?? '').trim().slice(0, PACT_BODY_MAX),
    value: Math.max(0, Math.floor(Number(value) || 0)),
  };

  return writePact(character, state.id, { missions: [...state.missions, mission] });
}

/** Done: the reward feeds the pact and the errand leaves the block, in one write. */
export function completeMission(character, state, missionId) {
  const mission = state.missions.find((row) => row.id === missionId);
  if (!mission) return null;

  return writePact(character, state.id, {
    missions: state.missions.filter((row) => row.id !== missionId),
    progress: state.row.progress + mission.value,
    log: logged(state.row, {
      kind: 'mission',
      delta: mission.value,
      note: `Mission complete: ${mission.title}`,
    }),
  });
}

/** Given up. Nothing is fed, and the log says so rather than staying silent. */
export function abandonMission(character, state, missionId) {
  const mission = state.missions.find((row) => row.id === missionId);
  if (!mission) return null;

  return writePact(character, state.id, {
    missions: state.missions.filter((row) => row.id !== missionId),
    log: logged(state.row, { kind: 'mission', delta: 0, note: `Mission abandoned: ${mission.title}` }),
  });
}

/* ------------------------------------------------------------------- boons */

/**
 * Claiming a boon, or re-picking one already claimed — the choices are
 * permanent at the table and adjustable on the Abilities tab, which is the
 * same pair every permanent choice on this sheet keeps.
 *
 * `pick` is a card id, or `{ id, spell? }` for an enchantment. The caller owns
 * the forged-record write an enchant boon also needs; `currentEnchPicks` off
 * the NEXT state is what the record's `ench` should hold, and pickers compose
 * both halves into one patch.
 */
export function claimBoon(character, state, boonId, pick, { again = false } = {}) {
  const one = state.boons.find((row) => row.boon.id === boonId);
  const grant = state.grants.find((row) => row.grant.id === boonId);
  const slot = one?.boon ?? grant?.grant;
  if (!slot || !pick) return null;

  const had = one?.pick ?? grant?.pick ?? null;
  const note = `${slot.label}: ${nameOfPick(slot.kind, pick)}`;

  return writePact(character, state.id, {
    picks: { ...state.row.picks, [slot.id]: pick },
    log: logged(state.row, {
      kind: 'boon',
      delta: 0,
      note: had && again ? `${note} (changed)` : note,
    }),
  });
}

/** The endless bargain: one more spell or Martial Move, forever. */
export function claimLoopBoon(character, state, kind, pick) {
  if (!state.loopOpen || !pick) return null;
  const clean = kind === 'martial-move' ? 'martial-move' : 'spell';

  return writePact(character, state.id, {
    extra: [...state.extra, { kind: clean, pick }],
    log: logged(state.row, {
      kind: 'boon',
      delta: 0,
      note: `Endless bargain: ${nameOfPick(clean, pick)}`,
    }),
  });
}

/** Change one endless pick, by its place in the claim order. */
export function repickLoopBoon(character, state, index, pick) {
  const held = state.extra[index];
  if (!held || !pick) return null;

  const extra = [...state.extra];
  extra[index] = { ...held, pick };

  return writePact(character, state.id, {
    extra,
    log: logged(state.row, {
      kind: 'boon',
      delta: 0,
      note: `Endless bargain: ${nameOfPick(held.kind, pick)} (changed)`,
    }),
  });
}

function nameOfPick(kind, pick) {
  if (kind === 'enchant') {
    const id = typeof pick === 'string' ? pick : pick?.id;
    const enchantment = getEnchantment(id);
    const spell = typeof pick === 'object' && pick?.spell ? getCard(pick.spell) : null;
    return enchantment
      ? spell
        ? `${enchantment.name} (${spell.name})`
        : enchantment.name
      : String(id);
  }
  return getCard(typeof pick === 'string' ? pick : pick?.id)?.name ?? String(pick);
}

/* ------------------------------------------------------------------ riders */

/**
 * What riding the pact is worth, laid on every card it granted.
 *
 * FIRST BOON: everything the pact grants uses the best attribute in place of
 * the printed one. DEEPENED BARGAIN Empowers it all by 1, and ENDLESS BARGAIN
 * rolls it all with advantage. Rank-indexed on the spec, so the numbers stay
 * the designer's.
 */
export function pactModifiers(state) {
  const riders = {};
  if (state.spec.cast === 'highest') riders.stat = HIGHEST;

  const empower = Math.max(0, Math.floor(Number(state.spec.empower?.[state.rank]) || 0));
  if (empower > 0) riders.empower = empower;

  const advantage = Math.max(0, Math.floor(Number(state.spec.advantage?.[state.rank]) || 0));
  if (advantage > 0) {
    riders.advantage = advantage;
    riders.advantageFrom = [state.spec.boostFrom ?? state.talent.name];
  }

  return Object.keys(riders).length > 0 ? riders : null;
}

/**
 * Every card the pact has granted, as `{ card, modifiers }` rows: the two
 * sealed with it, the claimed rungs of the ladder, then the endless picks.
 * Enchant boons are left out — the working rides the weapon, and the weapon's
 * own cards are where it shows.
 */
export function pactBoonRows(state) {
  const riders = pactModifiers(state);
  const rows = [];

  const push = (pick) => {
    const card = getCard(typeof pick === 'string' ? pick : pick?.id);
    if (card) rows.push({ card, modifiers: riders });
  };

  for (const { pick } of state.grants) if (pick) push(pick);
  for (const one of state.boons) {
    if (one.state === 'claimed' && one.boon.kind !== 'enchant') push(one.pick);
  }
  for (const held of state.extra) push(held.pick);

  return rows;
}

/** The skills the pact has taught, so no other chooser offers them again. */
export function pactSkillIds(character) {
  const out = [];
  for (const state of pactState(character)) {
    for (const one of state.boons) {
      if (one.state === 'claimed' && one.boon.kind === 'skill' && typeof one.pick === 'string') {
        out.push(one.pick);
      }
    }
  }
  return out;
}

/* -------------------------------------------------------------- the weapon */

/**
 * The forged id the pact holds, or null. The guards in the equip hook and the
 * two weapon blocks read this: slot 1 is the pact's for as long as the set is
 * held, and nothing else on the sheet may move it.
 */
export function pactWeaponId(character) {
  for (const state of pactState(character)) {
    if (state.weapon) return state.weapon.id;
  }
  return null;
}

/**
 * What holding the pact weapon is worth on a swing, folded into
 * `attackModifiers` in moves.js beside the Colossus and the hide.
 *
 * The weapon itself is a boon — the first one, sealed with the pact — so
 * FIRST BOON's best-attribute rule and the two rank riders land on its
 * attacks exactly as they land on a granted spell.
 */
export function pactWeaponRiders(character) {
  for (const state of pactState(character)) {
    if (!state.weapon) continue;

    /* Only while it is actually in the first slot, which the guards make the
       ordinary case. Read without items.js: the map is slot -> id. */
    const equipment = readEquipment(character?.equipment);
    if (equipment.main_hand !== state.weapon.id) continue;

    const riders = pactModifiers(state);
    if (!riders) return null;
    return { ...riders, from: state.talent.name };
  }
  return null;
}

/** The equipment map, read gently and without items.js. */
function readEquipment(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  return source && typeof source === 'object' && !Array.isArray(source) ? source : {};
}
