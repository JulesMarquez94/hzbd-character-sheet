/**
 * The dice themselves: what a roll is, what it comes to and how it read.
 *
 * Nothing in here draws anything. This file decides the numbers, and it is the
 * only place that decides them. Every renderer downstream — the flat roller a
 * free sheet gets, the physics roller a Premium one gets, and the replay every
 * other player at the table watches — is handed a result this file already
 * settled and told to show it.
 *
 * That order is the whole design and it is not an implementation detail:
 *
 *   - A roll must land on the same faces on every screen at the table. Physics
 *     cannot promise that. A number decided once and posted to the log can, and
 *     a 3D roller that accepts predetermined results will land on it.
 *   - A free sheet and a paid one must agree about what happened. They differ
 *     in what they draw, never in what they rolled.
 *   - Skipping the animation has to be free. It is: the result already exists,
 *     so a skip is a cut to the end rather than a shortcut through the maths.
 *
 * ------------------------------------------------------------- the two rolls
 * There are only two kinds of roll in the game and they behave differently
 * enough to be separate functions.
 *
 *   a check   2d6 plus a flat number, against a DC. An Attack Roll, an
 *             Attribute Roll and a Skill Check are the same roll wearing three
 *             names, per Jules on 2026-08-30. Advantage and Disadvantage ride
 *             here and nowhere else.
 *   a value   the dice a card prints, for damage or for healing. No DC, no
 *             verdict, no d4s. Dice explode here and nowhere else.
 *
 * The 2d6 is not a choice this file made. keywords.js has said it since the
 * Critical Hit entry was written: "It cannot be 'a natural 20': a Roll in this
 * game is 2d6 plus an attribute."
 *
 * ------------------------------------------------------------- the four bands
 * A check is judged against its DC by distance rather than by the faces, which
 * is why the roller cannot tell you anything at all until it is told the DC:
 *
 *   critical failure  6 or more under
 *   failure           under
 *   success           equal or over
 *   critical success  6 or more over
 *
 * On 2d6 that puts both crits in the tails, which is the designer's intent and
 * not a bug to round off. When no DC is given the verdict is null and the four
 * bands become four buttons: the table calls it, and what they call rides in
 * the log the same way a computed verdict would.
 *
 * --------------------------------------------------------------- explosions
 * A damage or healing die that rolls its own maximum explodes: you roll one die
 * of the next category up and add it, and if that one maxes it goes again. The
 * ladder is `elevateDie`'s, so it is the same ladder Elevate climbs and it caps
 * the same way. A d12 tops out, so a maxed d12 explodes into another d12 rather
 * than off the end of the list.
 *
 * A check never explodes. Boxcars on the 2d6 are just twelve.
 *
 * A critical success maximises the damage roll that follows it, and because a
 * maximised die is by definition showing its own maximum, every one of them
 * then explodes. That cascade is the intended reading and not an accident of
 * ordering: see the ruling of 2026-08-30.
 */

import { elevateDie } from './cardText.js';

/** A Roll is 2d6. See the Critical Hit note in keywords.js. */
export const CHECK_DICE = { count: 2, faces: 6 };

/** Advantage and Disadvantage are each a d4. See the glossary in keywords.js. */
export const SWING_FACES = 4;

/** How far over or under a DC a check has to land to become a critical. */
export const CRIT_BAND = 6;

/**
 * How many times one die may explode before this file stops believing it.
 *
 * A d12 chain ends on its own with probability 1, so this is not a correctness
 * guard, it is a liveness one: a bad `random` that returns 1 forever would
 * otherwise hang the tab rather than fail. Twenty deep is roughly a 1 in 10^21
 * event on a real d12, so a real roll never meets it.
 */
const EXPLOSION_LIMIT = 20;

/* -------------------------------------------------------------- rolling one */

/** One die, as a number from 1 to `faces`. */
function rollDie(faces, random) {
  return 1 + Math.floor(random() * faces);
}

/**
 * Which way a die counts toward the total.
 *
 * Disadvantage is the only thing on a sheet that subtracts, and it subtracts
 * rather than being stored negative so that the renderer can draw a red d4 with
 * a 3 on its face. The die shows what it rolled. The total knows what it means.
 */
export function signOf(role) {
  return role === 'disadvantage' ? -1 : 1;
}

/* ------------------------------------------------------ advantage, as a net */

/**
 * Advantage against Disadvantage, cancelled 1-to-1, as the survivors.
 *
 * The glossary settles this and RollArrow already draws it: two advantage
 * against one disadvantage is one d4 up, one against one is no d4 at all. Netted
 * here as well as on the badge because a caller may hold both counts and this
 * file must never roll a green d4 and a red d4 that were always going to
 * cancel. A player would watch two dice tumble to decide nothing.
 */
export function netSwing(advantage = 0, disadvantage = 0) {
  const up = Math.max(0, Math.floor(Number(advantage) || 0));
  const down = Math.max(0, Math.floor(Number(disadvantage) || 0));
  const net = up - down;
  return net >= 0
    ? { advantage: net, disadvantage: 0 }
    : { advantage: 0, disadvantage: -net };
}

/* ------------------------------------------------------------- notation */

const DICE_TERM = /^(\d*)d(\d+)$/i;

/**
 * "2d6" as `{ count: 2, faces: 6 }`, or null if it is not a die at all.
 *
 * Deliberately the same shape `resolveValue` splits on in cardText.js, because
 * its `dice` array is what feeds `rollValue`: a card's printed damage arrives
 * here already Empowered and Elevated, and this only has to read it back.
 */
export function parseDie(term) {
  const match = DICE_TERM.exec(String(term || '').trim());
  if (!match) return null;
  const count = Math.max(1, Number(match[1] || 1));
  const faces = Number(match[2]);
  return faces > 0 ? { count, faces } : null;
}

/**
 * What a spec is about to throw, before it throws it: `[{ count, faces, role }]`.
 *
 * Every renderer needs this and none of them should work it out. A surface has
 * to put unthrown dice down before the player presses roll, and a physics box
 * has to build a scene out of them, so the shapes are decided here where the
 * rules about them already live. Explosions are not in it and cannot be: what a
 * roll throws is a consequence of the roll, not a plan.
 */
export function previewOf(spec = {}) {
  if (spec.shape === 'check') {
    const swing = netSwing(spec.advantage, spec.disadvantage);
    return [
      { count: CHECK_DICE.count, faces: CHECK_DICE.faces, role: 'base' },
      ...(swing.advantage > 0
        ? [{ count: swing.advantage, faces: SWING_FACES, role: 'advantage' }]
        : []),
      ...(swing.disadvantage > 0
        ? [{ count: swing.disadvantage, faces: SWING_FACES, role: 'disadvantage' }]
        : []),
    ];
  }

  return []
    .concat(spec.dice ?? [])
    .map((term) => parseDie(term))
    .filter(Boolean)
    .map((term) => ({ ...term, role: 'base' }));
}

/* ---------------------------------------------------------------- the check */

/**
 * A check: 2d6, plus whatever the sheet adds, judged against a DC if there is
 * one.
 *
 *   flat          the attribute and any modifier, already summed by the caller
 *   advantage     d4s up, before cancelling
 *   disadvantage  d4s down, before cancelling
 *   dc            the number to beat, or null if nobody knows it yet
 *   kind          'attack', 'attribute' or 'skill'. Carried, never read: the
 *                 three roll identically and differ only in what the log calls
 *                 them.
 *   parts         the caller's own explanation of `flat`, carried untouched so
 *                 the log can print where the number came from.
 */
export function rollCheck({
  flat = 0,
  advantage = 0,
  disadvantage = 0,
  dc = null,
  kind = 'attack',
  parts = [],
  random = Math.random,
} = {}) {
  const swing = netSwing(advantage, disadvantage);
  const dice = [];

  for (let i = 0; i < CHECK_DICE.count; i += 1) {
    dice.push(die(dice.length, CHECK_DICE.faces, rollDie(CHECK_DICE.faces, random), 'base'));
  }
  for (let i = 0; i < swing.advantage; i += 1) {
    dice.push(die(dice.length, SWING_FACES, rollDie(SWING_FACES, random), 'advantage'));
  }
  for (let i = 0; i < swing.disadvantage; i += 1) {
    dice.push(die(dice.length, SWING_FACES, rollDie(SWING_FACES, random), 'disadvantage'));
  }

  return settle({ shape: 'check', kind, dice, flat: whole(flat), dc: asDc(dc), parts });
}

/* ---------------------------------------------------------------- the value */

/**
 * A value: the dice a card prints, exploding as they go.
 *
 *   dice      the strings `resolveValue` handed back, such as `['2d6']`
 *   flat      its `flat`, the attribute and anything lent to the swing
 *   maximize  every printed die lands on its own maximum. What a critical
 *             success does to the damage roll it chains into, which then sets
 *             every one of them exploding.
 *   explode   whether a maximum throws the next die up. On by default, because
 *             the reason this function exists is damage and healing, and both
 *             of them do. The tray turns it off for a scratch roll: a player
 *             tapping two d6 in the corner of the screen has not told anybody
 *             they are rolling damage, and a 6 that quietly grew into a d8
 *             would be the roller inventing a rule.
 *   kind      'damage' or 'healing'. Carried for the log, not read.
 */
export function rollValue({
  dice: notation = [],
  flat = 0,
  maximize = false,
  explode: bursting = true,
  kind = 'damage',
  parts = [],
  random = Math.random,
} = {}) {
  const dice = [];

  for (const term of [].concat(notation)) {
    const spec = parseDie(term);
    if (!spec) continue;

    for (let i = 0; i < spec.count; i += 1) {
      const value = maximize ? spec.faces : rollDie(spec.faces, random);
      const base = die(dice.length, spec.faces, value, 'base');
      dice.push(base);
      if (bursting) explode(base, dice, random);
    }
  }

  return settle({ shape: 'value', kind, dice, flat: whole(flat), dc: null, parts });
}

/**
 * Everything a die sets off by showing its own maximum, appended in order.
 *
 * Iterative rather than recursive so the chain reads as what it is: one die
 * after another, each pointing at the one that threw it, which is what lets a
 * renderer draw the burst growing out of the die that caused it.
 */
function explode(from, dice, random) {
  let parent = from;

  for (let step = 0; step < EXPLOSION_LIMIT; step += 1) {
    if (parent.value !== parent.sides) return;

    const faces = elevateDie(parent.sides, 1);
    const next = die(dice.length, faces, rollDie(faces, random), 'explosion', parent.id);
    dice.push(next);
    parent = next;
  }
}

/* ----------------------------------------------------------- the judgement */

/**
 * Which of the four bands a total lands in, or null with no DC to judge it by.
 *
 * Tested in the order the bands overlap: a total 6 over is both "over" and "6
 * over", and the stronger word wins.
 */
export function judge(total, dc) {
  const target = asDc(dc);
  if (target === null) return null;

  const gap = total - target;
  if (gap >= CRIT_BAND) return 'critical-success';
  if (gap >= 0) return 'success';
  if (gap <= -CRIT_BAND) return 'critical-failure';
  return 'failure';
}

/** Whether a verdict is the one that maximises the damage roll after it. */
export function isCriticalSuccess(verdict) {
  return verdict === 'critical-success';
}

/**
 * Whether a check came up short, either way of coming up short.
 *
 * What a chain reads to know it is over. Almost every card that rolls damage
 * says "On a hit" before it, so a miss has nothing left to roll, and rolling it
 * anyway would put a number on the table that the card never offered.
 */
export function isFailure(verdict) {
  return verdict === 'failure' || verdict === 'critical-failure';
}

/**
 * The four bands, in the order they are offered when the table has to call it
 * by hand. Worst first, the way a result reads when you are looking for the bad
 * news.
 */
export const VERDICTS = [
  { id: 'critical-failure', label: 'Critical failure', tone: 'var(--stat-health)' },
  { id: 'failure', label: 'Failure', tone: 'var(--stat-health)' },
  { id: 'success', label: 'Success', tone: 'var(--def-healing)' },
  { id: 'critical-success', label: 'Critical success', tone: 'var(--level-amber)' },
];

const VERDICT_BY_ID = new Map(VERDICTS.map((verdict) => [verdict.id, verdict]));

/** What a verdict is called, for a badge or a log line. */
export function verdictLabel(id) {
  return VERDICT_BY_ID.get(id)?.label ?? '';
}

/* -------------------------------------------------------------- reading it */

/**
 * What was asked for, as the player would have typed it: "2d6 + 4".
 *
 * Built from the dice that were actually rolled rather than from the notation
 * that was passed in, so an explosion is never in it. An explosion is something
 * the roll *did*, not something it was asked to do.
 */
export function rollNotation(result) {
  const counted = new Map();
  for (const one of result?.dice ?? []) {
    if (one.role === 'explosion') continue;
    const key = one.role === 'disadvantage' ? `-d${one.sides}` : `d${one.sides}`;
    counted.set(key, (counted.get(key) ?? 0) + 1);
  }

  const terms = [...counted].map(([key, count]) =>
    key.startsWith('-') ? `- ${count}${key.slice(1)}` : `${count}${key}`
  );
  const flat = Number(result?.flat) || 0;
  if (flat !== 0) terms.push(flat < 0 ? `- ${Math.abs(flat)}` : String(flat));

  return terms
    .join(' + ')
    .replace(/\+ - /g, '- ')
    .trim();
}

/**
 * The working, without the answer: what was asked for, what the dice showed and
 * what burst out of them. "2d6 + 4 · 5, 3 · burst d8: 3".
 *
 * Split from the total on purpose. A log row prints the total and the verdict
 * big, on the line a reader scans, and the working underneath in the small type
 * that says where the number came from. Handing both back as one string would
 * make the row choose between showing its answer and showing its arithmetic.
 *
 * Middots rather than dashes, and no serial comma. See docs/text-style.md.
 */
export function rollWorking(result) {
  const faces = (result?.dice ?? [])
    .filter((one) => one.role !== 'explosion')
    .map((one) => one.value)
    .join(', ');
  const burst = (result?.dice ?? []).filter((one) => one.role === 'explosion');

  return [
    rollNotation(result),
    faces,
    burst.length > 0
      ? `burst ${burst.map((one) => `d${one.sides}: ${one.value}`).join(', ')}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * The whole of it on one line, for anywhere with room for one line and no more.
 * "2d6 + 4 · 5, 3 · 12 · Success".
 */
export function rollLine(result) {
  return [rollWorking(result), String(result?.total ?? 0), verdictLabel(result?.verdict) || null]
    .filter(Boolean)
    .join(' · ');
}

/* -------------------------------------------------------------- the plumbing */

/** One die on the table, in the shape every renderer and the log both read. */
function die(id, sides, value, role, from = null) {
  return { id, sides, value, role, from };
}

/** The total, the verdict and the frozen result the rest of the app is handed. */
function settle({ shape, kind, dice, flat, dc, parts }) {
  const total = dice.reduce((sum, one) => sum + signOf(one.role) * one.value, flat);
  return { shape, kind, dice, flat, dc, parts, total, verdict: judge(total, dc) };
}

/** A DC that is genuinely a number, or null. An empty field is not a zero. */
function asDc(dc) {
  if (dc === null || dc === undefined || dc === '') return null;
  const number = Number(dc);
  return Number.isFinite(number) ? Math.round(number) : null;
}

/** A modifier that is genuinely a number. Halves have no business on a roll. */
function whole(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : 0;
}
