/**
 * The turn, and what is running on you while it lasts.
 *
 * Every other block on the Character tab answers a question about the
 * character. This one answers a question about *right now*: whose turn is it,
 * how many of mine have gone by, and what is still ticking.
 *
 * ------------------------------------------------------------------ the turn
 * Three states and one button walking through them: out of a fight, in one but
 * waiting, and in your turn. The button always says the move you are about to
 * make rather than the state you are in.
 *
 * **Starting the fight is its own step**, and it has to be: initiative decides
 * who goes first and it is very often not you. A button that went straight to
 * "your turn 1" would be claiming the first turn on your behalf every single
 * fight. So Start Combat puts you in the fight, and Start Turn is a separate
 * press that comes when the order reaches you.
 *
 * Entering a fight sets Action Points full and Reaction Points to nothing —
 * reactions are *earned* during a round, so a fight begins with none — and
 * hands over whatever your gear gives at the bell (see combatStartEffects in
 * items.js).
 *
 * Starting a turn is the only other thing that changes anything:
 *
 *   Action Points come back to full. This is the game's own rule, printed in
 *   the glossary on Action Points ("you get six back at the start of each of
 *   your turns"), so the sheet does it rather than making you drag six pips.
 *
 *   Every running effect loses a turn. An effect written as "3 turns" is meant
 *   to cover this turn and the two after it, so it is counted down at the top
 *   of each of yours and not at the bottom.
 *
 * Ending a turn spends nothing and moves nothing. It is the state that makes
 * the next Start mean something, and it is what tells you, mid-round, that the
 * points on your sheet are not yours to spend yet.
 *
 * Reaction Points are deliberately left alone by the two *turn* boundaries.
 * They are earned during a round and spent on somebody else's turn, so the top
 * of your own turn is exactly the wrong moment to clear them. The start of the
 * whole fight is the right one, and that is the only place it happens.
 *
 * --------------------------------------------------------------- the effects
 * An effect is a name, how long it has left, and something to read.
 *
 *   turns: 3     three of your turns left, counted down at each Start
 *   turns: 0     it ended at the top of this turn. It stays on the block for
 *                the rest of the turn, marked, so you see what ran out rather
 *                than finding it gone
 *   turns: null  until something ends it. Conditions live here: being grappled
 *                does not expire, it is broken
 *
 * `card` is the id of the card it came from, so an effect you got from Renew
 * opens the Renew card. An effect with no card carries its own `note` instead,
 * which is how a condition the codex has never heard of still says what it
 * does.
 *
 * This file reads the character and the codex, and returns patches. It writes
 * nothing itself.
 */

import { allSourceCards, abilitySources } from './abilitySources.js';
import { combatStartEffects, getItem, normalizeBelt, normalizeEquipment } from './items.js';
import { shieldCapFor } from './characterModel.js';
import { getCard } from './weapons.js';

/** A long fight should not be able to bloat one row past reading. */
export const EFFECT_LIMIT = 40;
export const EFFECT_NAME_MAX = 60;
export const EFFECT_NOTE_MAX = 400;
/** As many turns as the tracker will offer to count. */
export const TURNS_MAX = 99;

export function newEffectId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
}

/* ---------------------------------------------------------------- the turn */

/**
 * A stored turn is only ever a hint: missing, a string, or half-written by an
 * older build. Whatever comes in, this returns something the block can draw.
 */
export function normalizeTurn(value) {
  let state = value;
  if (typeof state === 'string') {
    try {
      state = JSON.parse(state);
    } catch {
      state = null;
    }
  }
  if (!state || typeof state !== 'object') state = {};

  const n = Math.max(0, Math.floor(Number(state.n) || 0));
  const live = Boolean(state.live);

  return {
    n,
    live,
    /* Rows written before Start Combat existed have no flag, and a sheet that
       was mid-turn is plainly in a fight — reading it as "not in a fight" would
       throw away somebody's live combat on upgrade. */
    inCombat: state.inCombat === undefined ? live || n > 0 : Boolean(state.inCombat),
  };
}

/**
 * The top of your turn: the count goes up, the Action Points come back, and
 * everything running loses a turn.
 *
 * Anything that ran out at the *last* Start has been sitting on the block
 * marked "Ended" ever since, so it is cleared here, before the rest count
 * down. That way something always gets one full turn of being visibly over.
 */
/**
 * The bell. You are in the fight, but it is not your turn yet: initiative
 * decides that, and it is very often somebody else.
 *
 * Action Points come up full so the first thing you do is paid for. Reaction
 * Points go to nothing, because they are earned inside a round and a new fight
 * has none earned yet. Whatever your gear hands over at the bell is handed
 * over here, capped by the Shield the character can actually hold and never
 * taking away Shield they already had.
 */
/**
 * What the bell would actually set the Shield to, or null when it moves
 * nothing — the grant is capped, and never takes away Shield already held.
 * The button's note reads from here too, so what it promises is what happens.
 *
 * The pieces add up. Each one says "you start with a Shield equal to your Mind"
 * on its own, so a full Runed set is that sentence three times and grants three
 * times Mind. What stops it is the cap, never the best piece winning. `items`
 * is every piece that gave, so the note can name what did it.
 */
export function combatShieldGrant(character) {
  const granted = combatStartEffects(character);
  if (granted.length === 0) return null;

  const cap = shieldCapFor(character);
  const held = Math.max(0, Math.floor(Number(character?.shield) || 0));
  const total = granted.reduce((sum, entry) => sum + entry.shield, 0);
  const next = Math.min(cap, Math.max(held, total));
  if (next === held) return null;

  return { next, items: granted.map((entry) => entry.item) };
}

export function startCombat(character) {
  const patch = {
    turn_state: { n: 0, live: false, inCombat: true },
    ap: Math.max(0, Math.floor(Number(character?.ap_max) || 0)),
    reaction: 0,
  };

  const grant = combatShieldGrant(character);
  if (grant) patch.shield = grant.next;

  return patch;
}

export function startTurn(character) {
  const { n } = normalizeTurn(character?.turn_state);

  return {
    // Pressing Start Turn from outside a fight is still a fight starting; the
    // block never offers it, but the state must not end up half-set.
    turn_state: { n: n + 1, live: true, inCombat: true },
    ap: Math.max(0, Math.floor(Number(character?.ap_max) || 0)),
    effects: tick(normalizeEffects(character?.effects)),
  };
}

/** The bottom of your turn. Nothing is spent and nothing moves. */
export function endTurn(character) {
  const { n } = normalizeTurn(character?.turn_state);
  return { turn_state: { n, live: false, inCombat: true } };
}

/**
 * The fight is over. Only the count is reset: an effect may well outlast the
 * fight that caused it, and throwing away what the player is tracking is not
 * the sheet's call to make.
 */
export function endCombat() {
  return { turn_state: { n: 0, live: false, inCombat: false } };
}

function tick(effects) {
  return effects
    .filter((effect) => effect.turns !== 0)
    .map((effect) => (effect.turns === null ? effect : { ...effect, turns: effect.turns - 1 }));
}

/**
 * Where the fight stands, and what the one button is about to do.
 *
 * `move` is what pressing it means, which the block turns straight into the
 * matching call. Three states, three moves, and the label always names the
 * move rather than the state.
 */
export function turnState(character) {
  const { n, live, inCombat } = normalizeTurn(character?.turn_state);

  if (!inCombat) {
    return {
      n,
      live,
      inCombat,
      started: false,
      move: 'combat',
      label: 'Start Combat',
      heading: 'Not in a fight',
    };
  }

  if (!live) {
    return {
      n,
      live,
      inCombat,
      started: true,
      move: 'turn',
      label: 'Start Turn',
      heading: n === 0 ? 'In the fight, waiting your turn' : `Turn ${n} is over`,
    };
  }

  return { n, live, inCombat, started: true, move: 'end', label: 'End Turn', heading: `Your turn ${n}` };
}

/* -------------------------------------------------------------- the effects */

export function normalizeEffects(value) {
  let list = value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = null;
    }
  }
  if (!Array.isArray(list)) return [];

  const seen = new Set();
  const effects = [];

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;

    const id = String(raw.id ?? '') || newEffectId();
    if (seen.has(id)) continue;
    seen.add(id);

    const name = String(raw.name ?? '').slice(0, EFFECT_NAME_MAX).trim();
    if (!name) continue;

    effects.push({
      id,
      name,
      // A card id this build no longer knows falls back to a plain entry
      // rather than a row whose ⓘ opens nothing.
      card: getCard(raw.card) ? String(raw.card) : null,
      note: String(raw.note ?? '').slice(0, EFFECT_NOTE_MAX),
      turns: raw.turns === null || raw.turns === undefined ? null : clampTurns(raw.turns),
      // Which rest ends it, when a rest is what ends it. A long rest ends
      // everything a short one does, so 'short' is the looser of the two.
      until: raw.until === 'short' || raw.until === 'long' ? raw.until : null,
      from: String(raw.from ?? '').slice(0, EFFECT_NAME_MAX),
    });
  }

  return effects.slice(0, EFFECT_LIMIT);
}

function clampTurns(value) {
  return Math.max(0, Math.min(TURNS_MAX, Math.floor(Number(value) || 0)));
}

/** Newest at the top: the thing you just picked up is the thing you are checking. */
export function addEffect(effects, entry) {
  const next = [
    {
      id: newEffectId(),
      name: String(entry?.name ?? '').slice(0, EFFECT_NAME_MAX).trim(),
      card: getCard(entry?.card) ? String(entry.card) : null,
      note: String(entry?.note ?? '').slice(0, EFFECT_NOTE_MAX),
      // Same rule as normalizeEffects: no count means open-ended, not a
      // zero-turn effect born already ended.
      turns: entry?.turns === null || entry?.turns === undefined ? null : clampTurns(entry.turns),
      until: entry?.until === 'short' || entry?.until === 'long' ? entry.until : null,
      from: String(entry?.from ?? '').slice(0, EFFECT_NAME_MAX),
    },
    ...normalizeEffects(effects),
  ];

  return next.slice(0, EFFECT_LIMIT);
}

export function dropEffect(effects, id) {
  return normalizeEffects(effects).filter((effect) => effect.id !== id);
}

/**
 * The table adjudicates. A turn given back or taken away by hand is normal,
 * and an open-ended effect nudged upward becomes a counted one.
 */
export function nudgeEffect(effects, id, delta) {
  return normalizeEffects(effects).map((effect) => {
    if (effect.id !== id) return effect;
    if (effect.turns === null) return delta > 0 ? { ...effect, turns: 1 } : effect;
    return { ...effect, turns: clampTurns(effect.turns + delta) };
  });
}

/* ------------------------------------------------------- what to track from */

/**
 * How long a card says it lasts, or null when it does not last at all.
 *
 * This is the test the picker filters on, and it is the whole reason the
 * picker is usable: most of what a character holds is not a temporary effect.
 * A sword swing resolves and is over. A trait that gives +1 Instinct is
 * permanent and is not "running" in any sense the tracker means. Offering
 * every card somebody owns would bury the four that actually tick.
 *
 * So the answer is read off the printed text, where the designer already said
 * it. No card carries a duration field, and adding one to every spell in the
 * codex is a much larger change than this block deserves. What comes back is
 * a suggestion, never a rule: the dial in the picker is right there, and the
 * table decides.
 *
 *   { turns: 10, label: '10 turns' }        counted, and countable
 *   { turns: null, label: 'Until a rest' }  lasts, but not in turns
 *   null                                    does not last
 */
export function effectDuration(card) {
  if (!card) return null;

  /* The printed text carries the cards' own emphasis markers, and a duration
     is as often written "until your next **Long Rest**" as in plain words.
     They come off before anything is matched, or every pattern below has to
     carry them — which is exactly how Wild Strider came out as a vague "until
     it ends" when the card plainly says which rest ends it. */
  const text = `${card.body ?? ''}\n${card.sub_body ?? ''}`.replace(/\*+/g, '');

  // Checked before the plain turn count, since "until the start of your next
  // turn" holds the word "turn" but means exactly one of them.
  const turnEnd = /until the (?:start|end) of (your|their|its) (?:next )?turn/i.exec(text);
  if (turnEnd) {
    const whose = turnEnd[1].toLowerCase() === 'your' ? 'your' : 'their';
    return { turns: 1, label: `Until ${whose} next turn`, until: null };
  }

  const turns = /(\d+)\s*turns?\b/i.exec(text);
  if (turns) {
    const n = clampTurns(turns[1]);
    return { turns: n, label: `${n} ${n === 1 ? 'turn' : 'turns'}`, until: null };
  }

  // A toll paid every turn to keep the thing going: running by definition.
  if (card.sub_name === 'Upkeep' || /\bupkeep\b/i.test(text)) {
    return { turns: null, label: 'Upkeep, each turn', until: null };
  }

  /* Which rest ends it, and it matters which: a long rest ends everything a
     short one does and more. Read before the clock, because "until your next
     Long Rest" is a rest and not a number of hours. Wide enough for "until
     they have taken a Long Rest" too, which the codex also writes. */
  // "until a short or long rest" ends on either, so it is the looser of the
  // two. Read before the single-word form, which would otherwise catch the
  // "long" at the end of it and claim a nap does not break it.
  if (/until\s+(?:\w+\s+){0,3}(?:short\s+or\s+long|long\s+or\s+short)\s+rest/i.test(text)) {
    return { turns: null, label: 'Until any rest', until: 'short' };
  }

  const rest = /until\s+(?:\w+\s+){0,5}(long|short)\s+rest/i.exec(text);
  if (rest) {
    const which = rest[1].toLowerCase();
    return { turns: null, label: `Until a ${which} rest`, until: which };
  }

  const clock = /\b(\d+)\s*(minute|hour|day)s?\b/i.exec(text);
  if (clock) {
    const n = Number(clock[1]);
    return {
      turns: null,
      label: `${n} ${clock[2].toLowerCase()}${n === 1 ? '' : 's'}`,
      until: null,
    };
  }

  if (/\buntil\b/i.test(text)) return { turns: null, label: 'Until it ends', until: null };

  if (/while\s+[^\n]{1,40}\s+is active|lasts?\s+for|remains?\s+active/i.test(text)) {
    return { turns: null, label: 'While it lasts', until: null };
  }

  return null;
}

/**
 * Everything this character could be tracking, for the picker: what their
 * sources gave them, what is in their hands, and what is on their belt.
 *
 * Narrowed to what actually lasts, by `effectDuration` above. Pass
 * `{ all: true }` for the escape hatch the picker offers when the filter has
 * hidden the one thing somebody wanted, because a filter this build guessed at
 * must never be the reason a player cannot track something.
 *
 * Deduplicated, so a card two sources both hand over is offered once.
 */
export function trackableCards(character, { all = false } = {}) {
  const rows = [];
  const seen = new Set();

  const add = (card, from) => {
    if (!card || seen.has(card.id)) return;
    seen.add(card.id);

    const duration = effectDuration(card);
    if (!duration && !all) return;

    rows.push({
      card,
      from,
      turns: duration?.turns ?? null,
      label: duration?.label ?? null,
      until: duration?.until ?? null,
    });
  };

  for (const source of abilitySources(character)) {
    for (const { card } of allSourceCards([source])) add(card, source.title);
  }

  const equipment = normalizeEquipment(character?.equipment);
  for (const slot of ['main_hand', 'off_hand']) {
    const item = getItem(equipment[slot]);
    for (const id of item?.abilities ?? []) add(getCard(id), item.name);
  }

  for (const entry of normalizeBelt(character?.belt)) {
    const item = getItem(entry?.id);
    for (const id of item?.abilities ?? []) add(getCard(id), item.name);
  }

  // What lasts longest reads first: a 10-turn spell is a likelier thing to be
  // tracking than something that expires at the end of the turn.
  return rows.sort((a, b) => (b.turns ?? 99) - (a.turns ?? 99));
}
