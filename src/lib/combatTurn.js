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
 * **One thing breaks that**, and only at the bell: PREPARED, an enchantment that
 * says "you start each combat with 3 reaction points". So the fight does not
 * begin at nothing for whoever is carrying it — worn, running or worked into
 * something in their hands. See combatReactionGrant below.
 * The two *turn* boundaries are untouched by it, the same as everything else.
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
 * whole fight is the right one, and that is the only place it happens — which is
 * also the only place anything is allowed to put points *in*.
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
 * ------------------------------------------------------------ broken by acting
 * One row is ended by neither of those. HIDE lays it: you are out of sight, and
 * you stay out of sight until you do something. "at the end of the turn, if the
 * player [does] any action during this turn. Otherwise it stay[s] until manual[ly]
 * removed" (Jules, 2026-09-03).
 *
 * So the row is open-ended like a condition, and `stirred` is the one thing
 * stored on it: whether anything has been paid for while it stood. `spendUse`
 * sets it, at the one moment the sheet can be sure an action happened, and
 * `endTurn` is where it costs you the row. The Hide that lays the row cannot
 * stir the row it lays, because the stir is read before the cast writes it, and
 * hiding again is a fresh row that has not moved yet.
 *
 * **Whether the rule applies at all is read off the card and never stored**, the
 * same law `effectDuration` keeps for every other clock: the codex says "until
 * you act" and `breaksOnAction` is what hears it.
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
import { refillMinions } from './minions.js';
import {
  characterGrants,
  combatReactionEffects,
  combatStartEffects,
  heldItem,
  normalizeBelt,
  normalizeEquipment,
} from './items.js';
import { cardProse } from './cardText.js';
import { shieldCapFor } from './characterModel.js';
import { CARDS, getCard } from './weapons.js';
import { getEnchantment } from './enchantments.js';
import { getMartialMove } from './martial.js';
import { riderOf } from './riders.js';
import { trickAdvantage } from './tricks.js';

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

/**
 * What the bell puts in the Reaction pool, or null when nothing does.
 *
 * Reaction Points are earned inside a round, so the honest starting number is
 * zero and that is what every character gets. PREPARED is the exception, and it
 * is a flat grant rather than a roll: "you start each combat with 3 reaction
 * points."
 *
 * Three places it can be coming from, and they add up: laid on the character's own
 * person, running on them for the hour, and worked into something they are wearing
 * or holding. `characterGrants` is all three at once, with the same-source law
 * applied across them — two rings carrying PREPARED brace you once.
 *
 * `combatReactionEffects` is read for the *names* only. It used to be added to the
 * number as well, back when an item's riders reached nothing else; now that they
 * reach `characterGrants` too, adding both would count PREPARED twice.
 *
 * Capped at the pool's own maximum, and never below the zero the bell would have
 * set anyway: an enchantment cannot make a fight start worse. `items` is whatever
 * gear gave, so the note can name what did it.
 */
export function combatReactionGrant(character) {
  const granted = Math.max(0, Math.floor(characterGrants(character).reactionAtCombat));
  if (granted === 0) return null;

  const gear = combatReactionEffects(character);

  const cap = Math.max(0, Math.floor(Number(character?.reaction_max) || 0));
  const next = Math.min(cap, granted);
  return next > 0 ? { next, granted, items: gear.map((entry) => entry.item) } : null;
}

export function startCombat(character) {
  const patch = {
    turn_state: { n: 0, live: false, inCombat: true },
    ap: Math.max(0, Math.floor(Number(character?.ap_max) || 0)),
    reaction: 0,
  };

  const grant = combatShieldGrant(character);
  if (grant) patch.shield = grant.next;

  const braced = combatReactionGrant(character);
  if (braced) patch.reaction = braced.next;

  /* Whatever else is on the board with you comes to the bell in the same state
     you do: Action Points full, Reaction Points at nothing. A creature that is
     down stays down — it comes back on a Long Rest and nowhere else. */
  Object.assign(patch, refillMinions(character, { reaction: true }) ?? {});

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
    /* "During your turn, you also control your draconic ally." It is your turn
       that it acts on, so its Action Points come back when yours do and its own
       tracker counts down on the same press — a creature has no Start Turn of
       its own to count from. Its Reaction Points are left alone for the same
       reason yours are. */
    ...(refillMinions(character, { tick: tickEffects }) ?? {}),
  };
}

/**
 * The bottom of your turn. Nothing is spent, and one kind of row comes off.
 *
 * A row its card says acting breaks, that has been acted through, ends here.
 * That is the whole of what this press moves, and it is the only boundary that
 * can move it: the question the rule asks is about a turn, so it is answered at
 * the end of one. A row nobody stirred is left exactly where it is, however many
 * turns go by, because "otherwise it stays until manually removed" is the other
 * half of the same sentence. See the note on the effects above.
 */
export function endTurn(character) {
  const { n } = normalizeTurn(character?.turn_state);
  const patch = { turn_state: { n, live: false, inCombat: true } };

  const effects = normalizeEffects(character?.effects);
  if (effects.some(isBroken)) patch.effects = effects.filter((effect) => !isBroken(effect));

  return patch;
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
 * The same turn, spent on somebody else's list.
 *
 * A creature a talent set put on the board keeps its own tracker on its own row
 * (see minions.js), and it has no turn of its own to count from: it acts on its
 * bonded's. So `startTurn` hands this down to `refillMinions`, and what a turn
 * does to an effect is still written once, here, whoever the effect is on.
 */
export function tickEffects(list) {
  return tick(normalizeEffects(list));
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
      // The enchantment this row *is*, when an Ephemeral Enchantment wrote it.
      // Nothing else on the tracker carries a mechanical consequence: every other
      // row is a note the table reads, while this one raises an attribute and
      // everything that attribute buys, so the id has to survive a reload. Kept
      // only while the codex still knows it — the same guard `card` gets, because
      // a rider nobody can look up is one nobody can take off either.
      ench: getEnchantment(raw.ench) ? String(raw.ench) : null,
      // And the spell it bound in, for the one enchantment that carries a spell
      // rather than a number. A name and not an id: it is what the row prints.
      spell: raw.spell ? String(raw.spell).slice(0, EFFECT_NAME_MAX) : null,
      // And the third mechanical rider a row may carry: a Trickster's AMBUSH or
      // stolen Poison, waiting on their next weapon attack. Read and cleaned here
      // rather than trusted, because it changes printed damage — see tricks.js.
      trick: normalizeTrick(raw.trick),
      // And the fourth: a Martial Move, waiting on the same swing. Same law and
      // the same reason — see moves.js.
      move: normalizeMove(raw.move),
      // Whether anything has been paid for while this row stood. Only ever true
      // on a row whose card says acting breaks it, and read at one boundary:
      // your Turn End, where `endTurn` takes it off. See `stirEffects`.
      stirred: Boolean(raw.stirred),
    });
  }

  return effects.slice(0, EFFECT_LIMIT);
}

/**
 * A rider, or null. Three numbers and an id, and nothing else survives: an
 * effects list is stored jsonb and a row that could carry arbitrary shapes into
 * the card renderer is a row that can print anything.
 *
 * `advantage` is the third, and it is why an AMBUSH bends the roll it was bought
 * for: a field this function does not name is a field that does not survive a
 * reload, so the arrow has to be listed here to exist at all. Read through
 * `trickAdvantage` rather than off the row, so a rider laid before the number was
 * stored keeps the Advantage it paid for — see tricks.js, where that rule lives.
 */
function normalizeTrick(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = String(raw.id ?? '').slice(0, 40);
  if (!id) return null;

  const elevate = Math.max(0, Math.min(9, Math.floor(Number(raw.elevate) || 0)));
  const flat = Math.max(0, Math.min(9, Math.floor(Number(raw.flat) || 0)));
  const advantage = Math.min(9, trickAdvantage(raw));
  return elevate === 0 && flat === 0 && advantage === 0
    ? null
    : { id, elevate, flat, advantage };
}

/**
 * A Martial Move rider, or null. One field, and it has to name a move this
 * build's codex still knows — the same guard `card` and `ench` get above.
 *
 * No numbers, on purpose. What a move does to the swing is printed on its card
 * and never varies (`rides` in martial.js), so it is read back off the card
 * rather than copied into the row: a correction to the codex then corrects every
 * rider already laid. An AMBUSH stores its Elevate because that number is
 * history — what was actually paid for a particular weapon — and this is not.
 */
function normalizeMove(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id ?? '').slice(0, 40);
  return getMartialMove(id) ? { id } : null;
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
      // See normalizeEffects: the two fields an Ephemeral Enchantment writes.
      ench: getEnchantment(entry?.ench) ? String(entry.ench) : null,
      spell: entry?.spell ? String(entry.spell).slice(0, EFFECT_NAME_MAX) : null,
      // See normalizeEffects: the Trickster's pending rider, and the Martial
      // Move waiting on the same swing.
      trick: normalizeTrick(entry?.trick),
      move: normalizeMove(entry?.move),
      // Never on a row being laid: whatever you did a moment ago, you have not
      // moved since this went down. See the note on the effects above.
      stirred: false,
    },
    ...normalizeEffects(effects),
  ];

  return next.slice(0, EFFECT_LIMIT);
}

export function dropEffect(effects, id) {
  return normalizeEffects(effects).filter((effect) => effect.id !== id);
}

/**
 * The same card laid again, rather than laid twice.
 *
 * `addEffect` is what a hand-written row and the picker both use: whatever you
 * asked for goes on the block, because the table asked for it. This is what a
 * *use* goes through, and a use has a rule the picker does not: "unless they say
 * otherwise, effects do not stack from the same source." One card is one source
 * however many times it is cast, so recasting KINDLE WEAPON on the turn before
 * it lapses is a fresh count on the row that is already there and not a second
 * row racing the first to zero. `runningRiders` has always deduplicated by card
 * id for the same reason; this keeps the block agreeing with the arithmetic.
 *
 * The refreshed row goes back to the top, because the thing you just cast is the
 * thing you are checking, which is the rule the whole list is ordered by.
 *
 * A row with no card behind it never matches: two hand-written "Grappled" rows
 * are two grapples, and nothing here can tell otherwise.
 */
export function layEffect(effects, entry) {
  const list = normalizeEffects(effects);
  const card = getCard(entry?.card) ? String(entry.card) : null;
  if (!card) return addEffect(list, entry);

  const standing = list.find((effect) => effect.card === card);
  if (!standing) return addEffect(list, entry);

  const refreshed = addEffect(
    list.filter((effect) => effect.id !== standing.id),
    entry
  );

  // The row keeps the id it was written with, so anything holding a reference to
  // it (a minion's tracker, an open reminder) is still pointing at it.
  return refreshed.map((effect, at) => (at === 0 ? { ...effect, id: standing.id } : effect));
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

/* ------------------------------------------------------ broken by acting */

/**
 * Whether what this card leaves running is broken by acting rather than run
 * down by a clock.
 *
 * Read off the printed text, where the codex says it, exactly as its duration
 * is: HIDE reads "until you act" and that is the whole of the rule. A card that
 * says it tomorrow gets the same behaviour without anybody remembering a list
 * here. See `readDuration` below, which is where the phrase is matched.
 */
export function breaksOnAction(card) {
  return effectDuration(card)?.breaks === 'act';
}

/**
 * Whether this row is one acting breaks, asked of the row.
 *
 * The card is what answers, never the row: a build that changed HIDE's text
 * changes what is standing on everybody's tracker with it. A row that has run
 * out is doing nothing and is not breakable either, the same guard
 * `pendingTricks` keeps.
 */
function breakable(effect) {
  return effect.turns !== 0 && breaksOnAction(getCard(effect.card));
}

/** A row that has been acted through, and so ends at this turn's end. */
function isBroken(effect) {
  return Boolean(effect.stirred) && breakable(effect);
}

/**
 * The effects list with every breakable row marked as moved through, or null
 * when there was nothing to mark.
 *
 * Called from `spendUse` at the one moment the sheet can be sure an action
 * happened: when one is paid for. Null rather than an unchanged copy so the
 * caller writes nothing for the nearly every use that is not being made from
 * cover, which is the same shape `spendTricks` hands back.
 *
 * A reaction stirs a row too. It is still you doing something, and the row does
 * not come off until the end of your own turn either way, so the sheet is never
 * the thing that reveals you early.
 */
export function stirEffects(effects) {
  const list = normalizeEffects(effects);
  if (!list.some((effect) => !effect.stirred && breakable(effect))) return null;

  return list.map((effect) =>
    !effect.stirred && breakable(effect) ? { ...effect, stirred: true } : effect
  );
}

/** The rows this turn's end is about to take off, for the prompt that says so. */
export function brokenRows(effects) {
  return normalizeEffects(effects).filter(isBroken);
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
 *
 * ------------------------------------------------------------- the main text first
 * A card's duration is what its **main text** says. The optional half is read
 * only when the main text is silent about it, because that half is nearly always
 * a way of spending more rather than a second clock: SENSE LIFE runs for 10
 * turns and its Overcast marks something "until your next Long Rest", and the
 * spell is a 10-turn spell.
 *
 * ------------------------------------------------------------- the earliest wins
 * Inside one text, the *first* duration stated is the card's own and anything
 * later belongs to a rider. THORN RAMPART is the card that proved it: the wall
 * stands "for 10 turns (1 minute)" in its opening line and roots what walks into
 * it "until the end of its turn" four lines down, and this used to read the
 * rooting and offer the wall as a one-turn effect. So every pattern is matched
 * for position and the earliest match answers.
 *
 * -------------------------------------------------------- and it has to be a duration
 * A number of hours is only a duration when something is said to last that long.
 * "given 1 minute, a free hand and quiet enough to hear the pins" is how long
 * picking a lock takes, and "if you used Lightning Strike in the last 12 hours"
 * is a memory, and both of those were offered as trackable effects. So the clock
 * and the bare "until" both want a lasting word in front of them.
 */
export function effectDuration(card) {
  if (!card) return null;

  /* The printed text carries the cards' own emphasis markers, and a duration
     is as often written "**until your next Long Rest**" as in plain words.
     They come off before anything is matched, or every pattern below has to
     carry them — which is exactly how Wild Strider came out as a vague "until
     it ends" when the card plainly says which rest ends it. Off in one place
     for every parser now; see cardProse in cardText.js. */
  return (
    readDuration(cardProse(card.body)) ??
    readDuration(cardProse(card.sub_body), { upkeep: card.sub_name === 'Upkeep' })
  );
}

/** A lasting word, so a number of hours is a duration and not a measurement. */
const LASTS = '(?:for|lasts?|last|lasting|remains?|stays?|persists?|hovers?|hangs?|burns?)';

/**
 * Every duration one block of text states, with where and how precisely, so the
 * best of them can answer.
 *
 * `upkeep` says this text is an Upkeep half, which is how a toll announces itself
 * when its prose never uses the word. Every Upkeep in the codex today does say
 * it, so this is the belt to that braces.
 *
 * Two orderings, and the precise one comes first. A clause that names a rest or a
 * count of turns is better information than one that only says the thing lasts,
 * even where the vague one is written first: FIRE SEED "lasts until the target
 * takes a Long Rest", and reading that as "until it ends" would throw away the
 * one word a player needs at the campfire. Between two equally precise answers,
 * position decides, and that is what the note above `effectDuration` is about.
 */
function readDuration(text, { upkeep = false } = {}) {
  if (!text.trim()) {
    // An Upkeep half with no prose at all is still a toll paid every turn, which
    // is as precise as a duration gets. See `vague` at the foot of this function.
    return upkeep ? { turns: null, label: 'Upkeep, each turn', until: null, vague: false } : null;
  }

  const found = [];
  /* `rank` 0 is a clause that says how long. 1 is a clause that only says the
     thing lasts at all. */
  const at = (match, value, rank = 0) => {
    if (match) found.push({ index: match.index, rank, value });
  };

  /* "until the end of its turn", and the codex's own shorter way of writing the
     same thing: "until its Turn End", "until their next Turn End". BLIND, AMBER
     SHARD and DRACONIC MARK are all written the second way and were all read as
     a vague "until it ends" before it was here. */
  const turnEnd = /until\s+(?:the\s+(?:start|end)\s+of\s+)?(your|their|its)\s+(?:next\s+)?(?:turn|Turn\s+(?:End|Start))/i.exec(
    text
  );
  if (turnEnd) {
    const whose = turnEnd[1].toLowerCase() === 'your' ? 'your' : 'their';
    at(turnEnd, { turns: 1, label: `Until ${whose} next turn`, until: null });
  }

  /* Broken by acting. HIDE is the card and so far the only one: you are out of
     sight, and you stay out of sight until you do something.

     Ranked with the precise answers for all that it names no number, because the
     card has said exactly what ends it. That ranking is the whole reason the
     clause is here: without it the `ends` pattern below reads "You stay out of
     sight until you act" as a vague "Until it ends", and a vague duration is
     offered in the picker and never written to anybody's tracker, so HIDE would
     have laid no row at all. `breaks` is what `breaksOnAction` reads back. */
  const acting = /until\s+(?:you|it|they)\s+acts?\b/i.exec(text);
  if (acting) at(acting, { turns: null, label: 'Until you act', until: null, breaks: 'act' });

  /* A count of turns, unless it is a *threshold* rather than a clock. The
     DRAUGHT OF CLEANSING is the one that proved it: "removes every status effect
     on you that lasts 20 turns or less" was read as a spell running for 20 turns,
     which put the potion itself on the tracker for twenty rounds. Its own card
     comment already said the number was a threshold ("20 turns or less is a
     threshold rather than a duration, so it is not bolded"), and now the parser
     agrees with the comment. */
  const turns = /(\d+)\s*turns?\b(?!\s+or\s+(?:less|fewer|more|greater))/i.exec(text);
  if (turns) {
    const n = clampTurns(turns[1]);
    at(turns, { turns: n, label: `${n} ${n === 1 ? 'turn' : 'turns'}`, until: null });
  }

  // A toll paid every turn to keep the thing going: running by definition.
  const toll = /\bupkeep\b/i.exec(text);
  if (toll) at(toll, { turns: null, label: 'Upkeep, each turn', until: null });

  /* Which rest ends it, and it matters which: a long rest ends everything a
     short one does and more. "until a short or long rest" ends on either, so it
     is the looser of the two, and it is read first because the single-word form
     would otherwise catch the "long" at the end of it and claim a nap does not
     break it. Wide enough for "until they have taken a Long Rest" too, which the
     codex also writes. */
  const either = /until\s+(?:\w+\s+){0,3}(?:short\s+or\s+long|long\s+or\s+short)\s+rest/i.exec(text);
  if (either) at(either, { turns: null, label: 'Until any rest', until: 'short' });

  const rest = /until\s+(?:\w+\s+){0,5}(long|short)\s+rest/i.exec(text);
  if (rest && !either) {
    const which = rest[1].toLowerCase();
    at(rest, { turns: null, label: `Until a ${which} rest`, until: which });
  }

  /* A stretch of clock time, and only where something is said to run *for* it.
     Every real one in the codex is written that way ("lasts for 12 hours",
     "burns for 6 hours", "For the next 5 hours"), and the two that were not are
     the two that were wrong: "given 1 minute, a free hand" is how long picking a
     lock takes, and "if you used Lightning Strike in the last 12 hours" is a
     memory rather than a thing running on anybody. */
  const clock = /\bfor\s+(?:up\s+to\s+|the\s+next\s+)*(\d+)\s*(minute|hour|day)s?\b/i.exec(text);
  if (clock) {
    const n = Number(clock[1]);
    at(clock, {
      turns: null,
      label: `${n} ${clock[2].toLowerCase()}${n === 1 ? '' : 's'}`,
      until: null,
    });
  }

  /* An open-ended end: something lasts, remains or is lost until a thing happens.
     A few words are allowed in between, because the codex writes "You remain in
     your Feral Form until all Shield is gone" and "They remain unconscious until
     healed" as readily as the bare "lasts until".

     BARKSKIN is the "when" half of it, and the one that made the clause worth
     having: "This effect is lost when all Shield is depleted" is a duration with
     no duration word in it at all. The lasting verb is what keeps the placeholder
     cards out, whose only "until" is "this card holds the slot until it is".

     **The leading word boundary matters and was missing.** The alternation ends
     in `ends?`, and without a `\b` in front of it that matched the tail of any
     word ending in "end": DISCORD opens "You bend the note until it is wrong" and
     was read as a spell running until it ends, which put a weapon attack on the
     tracker. Every word that could do it is common in card prose (bend, send,
     extend, defend, blend), so the boundary goes on the whole group. */
  const ends = new RegExp(
    `\\b(?:${LASTS}|is\\s+lost|ends?)\\b[^.\\n]{0,40}?\\s(?:until|when)\\b`,
    'i'
  ).exec(text);
  if (ends) at(ends, { turns: null, label: 'Until it ends', until: null }, 1);

  const active = /while\s+[^\n]{1,40}\s+is active|remains?\s+active/i.exec(text);
  if (active) at(active, { turns: null, label: 'While it lasts', until: null }, 1);

  /* And the one thing no prose has to say. An Upkeep half is a toll paid each
     turn, so a spell with one is running by definition. Ranked with the vague,
     because a card that also prints a clock has printed better information. */
  if (upkeep) at({ index: text.length }, { turns: null, label: 'Upkeep, each turn', until: null }, 1);

  if (found.length === 0) return null;

  /* And the rank travels with the answer, as `vague`. The picker never cared
     which of the two it got: a player looking at a shelf can read the label and
     decide. Using a card does care, because that writes a row nobody asked for.
     See `castEffect` in combatBar.js. */
  const best = found.sort((a, b) => a.rank - b.rank || a.index - b.index)[0];
  return { ...best.value, vague: best.rank > 0 };
}

/**
 * Everything that could be tracked, for the picker: what this character's
 * sources gave them, what is in their hands, what is on their belt and, when
 * asked for, every card in the codex.
 *
 * Narrowed to what actually lasts, by `effectDuration` above. Pass
 * `{ all: true }` for the escape hatch the picker offers when the filter has
 * hidden the one thing somebody wanted, because a filter this build guessed at
 * must never be the reason a player cannot track something.
 *
 * -------------------------------------------------------- somebody else's card
 * `{ codex: true }` is the other escape hatch, and it answers a different
 * question. **What is running on you is very often not yours.** The druid across
 * the table casts GIANT GROWTH on you: nothing was spent on your sheet, no
 * source of yours has ever heard of the spell, and your Movement Speed has just
 * doubled for ten turns. Before this the only way to record that was to type the
 * name in by hand, which got you the row and none of the doubling.
 *
 * So the whole codex is reachable, and a card reached that way lands with its
 * rider like any other: the picker knows which card it is, and riders.js knows
 * what the card does. Whose it was never enters into it.
 *
 * `mine` says which side of that line a row came from, so the picker can offer a
 * player their own spells first. A card that is both is yours, because the first
 * `add` wins and the character's own sources are read first.
 *
 * Deduplicated, so a card two sources both hand over is offered once.
 */
export function trackableCards(character, { all = false, codex = false } = {}) {
  const rows = [];
  const seen = new Set();

  const add = (card, from, mine = true) => {
    if (!card || seen.has(card.id)) return;
    seen.add(card.id);

    /* A card whose text says how long it runs, or one this sheet already knows
       how to apply. The second is the case the filter cannot read: WISP OF MIST
       raises a Movement Speed by half and never says for how long, and a card the
       sheet will actually bend a tile for is a card worth offering whatever its
       prose left out. The duration then goes on the dial as open, because the
       card printed none and this is not the place to invent one. See riders.js. */
    const duration = trackedDuration(card);
    if (!duration && !all) return;

    rows.push({
      card,
      from,
      mine,
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
    const item = heldItem(character, equipment[slot]);
    for (const id of item?.abilities ?? []) add(getCard(id), item.name);
  }

  for (const entry of normalizeBelt(character?.belt)) {
    const item = heldItem(character, entry?.id);
    for (const id of item?.abilities ?? []) add(getCard(id), item.name);
  }

  /* And the rest of the world. A card nobody at this table owns still has a
     provenance worth printing, and its own tags are it: "Novice Spell · Primal ·
     Life" is what a player will recognise the thing by. */
  if (codex) {
    for (const card of CARDS) add(card, codexFrom(card), false);
  }

  /* Yours first, then what lasts longest: a 10-turn spell is a likelier thing to
     be tracking than something that expires at the end of the turn, and your own
     spell is a likelier thing than a stranger's however long either runs. */
  return rows.sort(
    (a, b) => Number(b.mine) - Number(a.mine) || (b.turns ?? 99) - (a.turns ?? 99)
  );
}

/**
 * The duration a card carrying a rider gets when its own text printed none.
 *
 * "While it lasts" and not a count, because the card said nothing and the sheet
 * must not put words in its mouth. Three Cauldron Keeper Ingredients are the case:
 * an Ingredient is part of a Brew rather than a spell of its own, and the
 * designer's sheet gives the Brew no clock. The dial in the picker is right there
 * and the table decides, which is what every duration here has always been.
 */
function riderDuration(card) {
  /* Not vague, for all that the words are. The card printed no clock, and the
     reason to offer this row at all is that the sheet knows a number to bend for
     it: a use that laid no row would be a use whose Speed never moved. See
     `castEffect` in combatBar.js, which is what reads the flag. */
  return riderOf(card?.id) ? { turns: null, label: 'While it lasts', until: null, vague: false } : null;
}

/**
 * How long a card runs, by either measure: what its own text says, and failing
 * that whether this sheet already knows how to bend a number for it.
 *
 * The two were folded together inside `trackableCards` because the picker was
 * the only thing that asked. Using a card asks the same question now, so it is
 * a name rather than a line in a loop. See `castEffect` in combatBar.js.
 */
export function trackedDuration(card) {
  return effectDuration(card) ?? riderDuration(card);
}

/** Where a card nobody here owns comes from: what is printed on its own banner. */
function codexFrom(card) {
  const tags = (card?.tags ?? []).filter(Boolean);
  return tags.length > 0 ? tags.join(' · ') : 'In the codex';
}
