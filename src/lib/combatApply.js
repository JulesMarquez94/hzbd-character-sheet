/**
 * A rolled number landing on a body: the one place the arithmetic lives.
 *
 * Jules, 2026-09-01: "Health, shield and other changes by spells and abilities
 * need to be auto applied based on the result." Until now a roll was a number
 * on the table and every pool it moved was moved by hand — the Game Master
 * pressing −5 on a block, a player dragging their own bar. This file is the
 * arithmetic those presses were doing in somebody's head:
 *
 *   damage    Armor comes off each landing first ("flat damage reduction,
 *             applied after a hit lands"), the Shield soaks what is left
 *             ("damage soaked before it reaches Health, and whatever it cannot
 *             absorb carries straight through"), and Health takes the rest.
 *   healing   Health goes up, capped at its own ceiling.
 *   shield    Shield goes up, capped at what this body can hold.
 *
 * Both sides of the table run through here: an enemy's pools are clamped by
 * encounters.js with these numbers, and a player's sheet applies a delivered
 * hit to itself with `characterDelta` below — through the ledger, because every
 * other movement of Health on a sheet is logged and one that arrived from
 * across the table is the one most worth a receipt.
 *
 * ------------------------------------------------------------- who does what
 * Nothing here writes. The Game Master's page turns these answers into a foes
 * patch; a player's own client turns them into its own patch when a delivery
 * names it (see TurnCall.jsx). The sheet stays the only writer of its own
 * numbers, which is the law this whole page is built under.
 *
 * ---------------------------------------------------------- reading a clause
 * The foot of this file reads dice back out of a *resolved* sentence. The turn
 * prompts print what a running card says at a boundary ("the spore deals 2d6 +
 * 8 damage") with the numbers already worked out by cardGist, and the Roll
 * button beside that sentence needs the handful it names. That is a different
 * job from rollPlan's — rollPlan reads the card's own tokens before they
 * resolve; this reads prose that has already been resolved for a body — and it
 * is deliberately humble: the first run of dice arithmetic in the sentence,
 * and nothing else.
 */

import {
  LEDGER_NOTE_MAX,
  appendLedger,
  clamp,
  newLedgerId,
  shieldCapFor,
} from './characterModel.js';
import { isFailure, judge } from './dice.js';
import { healedEffects } from './statuses.js';

/* ----------------------------------------------------------- the arithmetic */

/**
 * One landing of damage against armor, then a shield.
 *
 * `amount` is one landing, because Armor is per hit: three landings of 6
 * against Armor 2 are 12 through, not 16. Callers with several landings call
 * this once per landing over the running pools, which is what `struck` does.
 */
export function landHit({ shield = 0, armor = 0 }, amount) {
  const through = Math.max(
    0,
    Math.floor(Number(amount) || 0) - Math.max(0, Math.floor(Number(armor) || 0))
  );
  const soaked = Math.min(Math.max(0, Math.floor(Number(shield) || 0)), through);
  return { soaked, dealt: through - soaked, through };
}

/**
 * Several landings against one body, as the totals a patch needs.
 *
 *   shield, health    the pools after
 *   soaked, dealt     what the Shield ate and what got through to Health
 *
 * `floor` is 0 for an enemy (a body at nothing is down and stays drawn) and
 * `-health_max` for a character, whose sheet runs past zero on purpose.
 */
export function struck(body, landings, { floor = 0 } = {}) {
  let shield = Math.max(0, Math.floor(Number(body.shield) || 0));
  let health = Math.floor(Number(body.health) || 0);
  let soaked = 0;
  let dealt = 0;

  for (const amount of landings) {
    const hit = landHit({ shield, armor: body.armor }, amount);
    shield -= hit.soaked;
    soaked += hit.soaked;
    dealt += hit.dealt;
  }

  health = Math.max(floor, health - dealt);
  return { shield, health, soaked, dealt };
}

/**
 * What a set of settled rolls adds up to, one row per kind.
 *
 * `thrown` is what a chain hands back: `[{ kind, total, damage }]`, in thrown
 * order. Damage keeps its landings separate because Armor is per landing;
 * healing and Shield are sums because nothing reduces them per throw. Rolls
 * that are neither (a check, a plain Roll) land on nobody and are dropped.
 */
export function applyPlan(thrown = []) {
  const rows = [];

  for (const one of thrown ?? []) {
    if (one.kind !== 'damage' && one.kind !== 'healing' && one.kind !== 'shield') continue;
    const amount = Math.max(0, Math.floor(Number(one.total) || 0));

    let row = rows.find((held) => held.kind === one.kind);
    if (!row) {
      row = { kind: one.kind, total: 0, landings: [], types: [] };
      rows.push(row);
    }
    row.total += amount;
    row.landings.push(amount);
    for (const type of one.damage ?? []) {
      if (!row.types.includes(type)) row.types.push(type);
    }
  }

  return rows.filter((row) => row.total > 0);
}

/** "14 Fire damage", "9 Health", "6 Shield" — the words under every apply. */
export function deltaWords(row) {
  if (!row) return '';
  if (row.kind === 'damage') {
    return [row.total, row.types?.join(' or '), 'damage'].filter(Boolean).join(' ');
  }
  return `${row.total} ${row.kind === 'healing' ? 'Health' : 'Shield'}`;
}

/**
 * A delivered change applied to a character, as a patch body their own client
 * writes. Health moves through the ledger, so "why am I on 12" has the spell's
 * name in it; Shield does not, because Shield never has.
 *
 * Damage arrives with this body's Armor *not* yet taken off — Armor is the
 * target's own and is read here — and lands one landing at a time, for the
 * same reason `struck` takes a list.
 *
 * `types` is what the damage was made of, so the row says what hit as well as
 * who threw it: "the source and effect" (Jules, 2026-09-03). It is the caller's
 * because only the caller has it — the delivery carries the types and this
 * function is handed the numbers.
 */
export function characterDelta(
  character,
  { kind, landings = null, amount = 0, note = '', types = [] }
) {
  const why = deltaNote(note, kind, types);
  const list = (landings && landings.length > 0 ? landings : [amount]).map((n) =>
    Math.max(0, Math.floor(Number(n) || 0))
  );

  if (kind === 'damage') {
    const held = { shield: Number(character?.shield) || 0, health: Number(character?.health) || 0 };
    const result = struck(
      { ...held, armor: character?.defense },
      list,
      { floor: -Math.max(0, Math.floor(Number(character?.health_max) || 0)) }
    );

    const body = {};
    if (result.shield !== Math.max(0, Math.floor(held.shield))) body.shield = result.shield;
    if (result.dealt > 0) {
      body.health = result.health;
      body.ledger = ledgerRow(character, {
        kind: 'health',
        delta: -result.dealt,
        balance: result.health,
        note: why,
      });
    }
    return Object.keys(body).length > 0 ? body : null;
  }

  if (kind === 'healing') {
    const cap = Math.max(0, Math.floor(Number(character?.health_max) || 0));
    const held = Math.floor(Number(character?.health) || 0);
    const next = clamp(held + sum(list), -cap, cap);
    if (next === held) return null;
    const body = {
      health: next,
      ledger: ledgerRow(character, { kind: 'health', delta: next - held, balance: next, note: why }),
    };
    /* And what Health coming back washes off: Poisoned ends "the moment any
       Health is regained", and a Bleed loses a stack. Read off the glossary in
       one place, so a heal off a boundary prompt and one delivered across the
       table clear the same rows. See statuses.js. */
    const washed = healedEffects(character?.effects);
    if (washed) body.effects = washed;
    return body;
  }

  if (kind === 'shield') {
    const cap = shieldCapFor(character);
    const held = Math.max(0, Math.floor(Number(character?.shield) || 0));
    const next = clamp(held + sum(list), 0, cap);
    return next === held ? null : { shield: next };
  }

  return null;
}

function sum(list) {
  return list.reduce((held, n) => held + n, 0);
}

/**
 * The whole sentence a ledger row carries: what did it, and what it did.
 *
 * The number is the row's own `delta`, so this is the other half — "2.Fenrat:
 * Blightbolt · Necrotic damage". The kind is said even when the types are not,
 * because a row reading "Nyx: Mending Word" alone leaves the reader counting
 * signs to work out whether it healed or hurt.
 *
 * Nothing is said twice: a caller with no note at all gets the effect on its
 * own rather than a leading separator.
 */
function deltaNote(note, kind, types = []) {
  const what =
    kind === 'damage'
      ? [(types ?? []).filter(Boolean).join(' or '), 'damage'].filter(Boolean).join(' ')
      : kind === 'healing'
        ? 'healing'
        : '';
  const said = String(note ?? '').trim();
  if (!what) return said;
  return said ? `${said} · ${what}` : what;
}

/** One ledger line, appended the way every other writer appends one. */
function ledgerRow(character, { kind, delta, balance, note }) {
  return appendLedger(character, {
    id: newLedgerId(),
    ts: new Date().toISOString(),
    kind,
    delta,
    note: String(note ?? '').slice(0, LEDGER_NOTE_MAX),
    balance,
  });
}

/* ---------------------------------------------------------- the aimed check */

/**
 * A check aimed at picked targets, carrying what it is judged by.
 *
 * "There is no reason for the dice roller to ask for a DC, as it should be
 * known by the system" (Jules, 2026-09-01). The card says which of the
 * target's numbers the roll is against (`against`, read in rollPlan.js) and
 * the target chips carry those numbers, so the question is never asked:
 *
 *   one number     every picked target answers alike, so the link goes out
 *                  with `dc` set and the surface opens saying "against 15",
 *                  the verdict judged by the engine as always.
 *   many numbers   one throw judged per body ("the roll goes against all the
 *                  different entities"). The link goes out with no dc and no
 *                  verdict buttons, and the total is judged against each
 *                  target by `aimOutcomes` once it lands.
 *
 * Either way the link carries `judged` — who, against what — so the chain can
 * say who was hit, who was critically hit and who dodged. A check against the
 * world (no `against`, no targets, a target with no numbers) is handed back
 * untouched and keeps asking the table.
 */
export function armCheck(link, targets = []) {
  if (link.shape !== 'check' || !link.against || targets.length === 0) return link;

  const judged = targets.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    name: entry.name,
    dc: Number(entry.defenses?.[link.against]),
  }));
  if (judged.some((entry) => !Number.isFinite(entry.dc) || entry.dc <= 0)) return link;

  const one = new Set(judged.map((entry) => entry.dc));
  return one.size === 1
    ? { ...link, dc: judged[0].dc, askDc: false, judged }
    : { ...link, dc: null, askDc: false, askVerdict: false, judged };
}

/**
 * One landed total, judged per body: `[{ id, kind, name, dc, verdict }]`.
 * The four bands are dice.js's own, so 6 over somebody's Reflex is a critical
 * against them and 6 under is a critical miss, exactly as against a called DC.
 */
export function aimOutcomes(total, judged = []) {
  return judged.map((entry) => ({ ...entry, verdict: judge(total, entry.dc) }));
}

/** The outcomes that connected: everything not a miss. */
export function aimHits(outcomes = []) {
  return outcomes.filter((entry) => !isFailure(entry.verdict));
}

/* ------------------------------------------------------------- the clauses */

/** The first run of dice arithmetic in a sentence: "2d6 + 1d4 + 8". */
const THROW_RUN = /\d+d\d+(?:\s*\+\s*(?:\d+d\d+|\d+))*/i;

/**
 * The handful a resolved clause names, or null when it names none.
 *
 * `kind` is read from the words around it the way rollPlan reads the word
 * after a token: damage, healing or Shield, and 'roll' when the sentence
 * settles nothing — an honest throw with no pool to land in.
 */
export function clauseThrow(clause) {
  const text = String(clause ?? '');
  const run = THROW_RUN.exec(text);
  if (!run) return null;

  const dice = [];
  let flat = 0;
  for (const term of run[0].split('+').map((part) => part.trim())) {
    if (/^\d+d\d+$/i.test(term)) dice.push(term.toLowerCase());
    else flat += Number(term) || 0;
  }
  if (dice.length === 0) return null;

  return { dice, flat, kind: clauseKind(text) };
}

/** What the clause's dice are for, by the words that name pools. */
function clauseKind(text) {
  if (/\bdamage\b/i.test(text)) return 'damage';
  if (/\bregain|\brestore|\bheal|\bHealth\b/i.test(text)) return 'healing';
  if (/\bShield\b/.test(text)) return 'shield';
  return 'roll';
}

/**
 * Whether a boundary clause is about the body holding the row, or about
 * somebody it is pointed at. "you regain 1d6 Health" is the holder's own;
 * "the spore deals 2d6 + 8 damage to the target" wants a target picked rather
 * than a number applied blind. Bodies win over pronouns, because a clause that
 * names both ("you deal ... to the target") is pointing away from the holder.
 */
export function clauseAim(clause) {
  const text = String(clause ?? '');
  if (/\btargets?\b|\bentit|\bcreatures?\b|\benem/i.test(text)) return 'other';
  if (/\byou\b|\byour\b|\bits\b|\btheir\b/i.test(text)) return 'self';
  return 'other';
}
