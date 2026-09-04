/**
 * Whether a card reaches somebody else, and how many somebodies.
 *
 * Jules, 2026-09-01: "Whenever an ability is used that can affect other
 * entities such as attack, spells etc, on the page before using the action you
 * should also be able to target. This should know spells that have limits,
 * manage multicast or overcast target change."
 *
 * So the use prompt on the encounter page needs an answer to one question
 * before it can offer a row of bodies: *does this card land on other people at
 * all, and if so on how many?* No card carries a `targets` field, and none is
 * getting one — the card already says, in the same printed text `rollPlan`
 * reads the dice out of and `effectDuration` reads the clock out of. "Make a
 * Melee Attack against an entity" is one target. "Up to 3 entities you can
 * see" is three. "Every entity within 6 meters" is however many are standing
 * there. This file reads it the same way those two do: off the prose, with the
 * card as the source and nothing restated beside it.
 *
 * ---------------------------------------------------------------- the answer
 *   { some, count }
 *
 *   some    whether the card lands on other bodies at all. False for Move,
 *           Hide, a potion you drink and every "you gain" card, which is most
 *           of the codex: a picker offered on those would be a question with
 *           no right answer.
 *   count   how many at most, or null for "no printed ceiling" — an area, an
 *           "every entity", a card that names targets without counting them.
 *           The picker reads null as no cap.
 *
 * ------------------------------------------------------------- the two halves
 * The main text answers for the cast. The second half answers only once it is
 * *taken*, and it moves the answer two ways:
 *
 *   Multicast    "spend more to catch more targets", the glossary's own words,
 *                so every take raises the ceiling by one. GIANT GROWTH's "for
 *                each additional entity" is the shape.
 *   Overcast     a few change where the spell lands ("hurl the flame at an
 *                entity"), so a taken Overcast whose text names a target makes
 *                the card targetable even when its base half was not, and its
 *                own count joins the base's.
 *
 * The `times` option is how many times the half has been taken, straight off
 * the prompt's own dial, and 0 reads the main text alone.
 *
 * ------------------------------------------------------- and the things held
 * A card that reaches for a *thing* rather than a body lands on whoever is
 * holding the thing: "a weapon you can touch" is somebody's weapon. That is
 * read last, only for a card that named no body at all, and `heldThing` is what
 * names it. See the block above the reader.
 *
 * This file reads cards. It writes nothing and changes no character.
 */

import { cardProse } from './cardText.js';

/** The nouns a card lands on. "you" is deliberately not one of them. */
const BODY = '(?:entit(?:y|ies)|targets?|creatures?|enem(?:y|ies)|all(?:y|ies)|beings?)';

/** "three" the way cards write it when they do not write "3". */
const COUNTS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

/**
 * Every way the codex counts targets, most specific first. The first pattern
 * that matches answers, which is the same rule `readDuration` settles ties by:
 * a clause that says how many is better information than one that only says
 * the card lands on somebody.
 */
const COUNTED = [
  // "up to 3 entities", "up to three targets"
  { at: new RegExp(`up\\s+to\\s+(\\d+|${Object.keys(COUNTS).join('|')})\\s+(?:\\w+\\s+){0,2}?${BODY}`, 'i'), n: (m) => asCount(m[1]) },
  // "3 entities of your choice", "two creatures"
  { at: new RegExp(`\\b(\\d+|${Object.keys(COUNTS).join('|')})\\s+(?:\\w+\\s+){0,2}?${BODY}`, 'i'), n: (m) => asCount(m[1]) },
  // "each entity", "every creature", "all enemies" — an area, not a count.
  { at: new RegExp(`\\b(?:each|every|all)\\s+(?:\\w+\\s+){0,2}?${BODY}`, 'i'), n: () => null },
  // "an entity", "another target", "the target", "one enemy you can see"
  { at: new RegExp(`\\b(?:an?|another|the)\\s+(?:\\w+\\s+){0,2}?${BODY}`, 'i'), n: () => 1 },
];

function asCount(word) {
  const n = Number(word);
  if (Number.isFinite(n)) return Math.max(1, Math.floor(n));
  return COUNTS[String(word).toLowerCase()] ?? 1;
}

/* --------------------------------------------------- a thing somebody holds
 *
 * Jules, 2026-09-04: "spells like kindle say weapon you can touch so it should
 * allow you to target the weapon someone at the table."
 *
 * KINDLE WEAPON imbues "a weapon you can touch" and names no entity anywhere on
 * the card, so every pattern above came up empty, the picker never opened, and
 * the only blade the spell could light was the caster's own. But a weapon you
 * can touch is a weapon in somebody's hand, and whose hand is exactly the
 * question a row of chips answers. So a card that names no body still lands on
 * one when what it reaches for is a thing somebody is holding, and the body it
 * lands on is the one holding it. EPHEMERAL ENCHANTMENT says as much in its own
 * next sentence: "applying its effect to the wielder of the item".
 *
 * Two guards keep the reading to the cards that mean it:
 *
 *   touch, not sight   "a non-magical object you can see" (TEMPORAL MEND) is a
 *                      broken cart and "a simple stone object" (SHAPE EARTH) is
 *                      a rock. Reach out and touch a thing and somebody is
 *                      holding it; see one across the room and nobody need be.
 *   last resort        read only once every body pattern above has come up
 *                      empty, so no card that already counts entities has its
 *                      answer moved by a weapon named further down its text.
 *
 * And picking is still optional, which is what makes the reading safe: a sword
 * on the ground is a use with nobody picked, exactly as it was before.
 */
const THING = '(?:weapons?|items?|objects?|armor|shields?)';
const HELD = new RegExp(`\\b(?:an?|another|the|one)\\s+(?:\\w+\\s+){0,3}?(${THING})\\s+(?:that\\s+)?you can touch`, 'i');

/** What one block of text says: lands on nobody, on a count, or on an area. */
function readTargets(text) {
  if (!text) return null;

  for (const { at, n } of COUNTED) {
    const hit = at.exec(text);
    if (hit) return { some: true, count: n(hit) };
  }

  /* A body named without an article still lands on somebody: "grants Shield to
     entities you touch". Rare, and honest as an uncounted answer. */
  if (new RegExp(`\\b${BODY}\\b`, 'i').test(text)) return { some: true, count: null };

  /* And last, the thing in somebody's hand: one thing is one body. See HELD. */
  if (HELD.test(text)) return { some: true, count: 1 };

  return null;
}

/**
 * The thing a card reaches for, named ("weapon", "item"), or null for the rest
 * of the codex.
 *
 * The picker's own head reads off this, because "Targets" over a row of chips is
 * the wrong question when what is being picked is whose blade catches fire.
 * `landing` in combatBar.js reads it too: a card with no body in its text still
 * lays its row on whoever holds what it lit.
 */
export function heldThing(card) {
  const hit = HELD.exec(cardProse(card?.body));
  return hit ? hit[1].toLowerCase().replace(/s$/, '') : null;
}

/**
 * The plan: whether to offer the picker, and how far it may be filled.
 *
 * `times` is how many times the card's second half has been taken. It only
 * moves the answer for the two halves that are about targets, and which half
 * this card carries is read off its own `sub_name`, exactly as overcast.js
 * reads the price off the same text.
 *
 * `riders` are the cards riding this use — the Martial Moves waiting on the
 * next weapon attack — read for targets the same way the card itself is,
 * because a rider rewrites the swing's reach in its own prose: SWEEP's "your
 * next Weapon Attack is made against every entity within your reach" is what
 * turns a one-target Strike into a room (Jules, 2026-09-01: "I had used the
 * martial move Sweep that should allow my Strike to take multiple, but it did
 * not let me"). Which rows actually ride which attack is moves.js's law, so
 * the caller hands the cards in rather than this file guessing.
 */
export function targetPlan(card, { times = 0, riders = [] } = {}) {
  if (!card) return { some: false, count: 0 };

  const base = readTargets(cardProse(card.body));

  /* Multicast is the one half whose take is itself the count: each one catches
     one more body, and its prose ("each additional entity", "an additional
     eligible entity") is the repeat marker rather than an area. So a Multicast
     is never *read* for targets — its takes are counted — while a taken
     Overcast contributes whatever its own text states, which is what makes
     RENEW's "all entities currently affected" an uncapped reach. */
  const multicast = card.sub_name === 'Multicast';
  const taken = times > 0 && !multicast ? readTargets(cardProse(card.sub_body)) : null;
  const extra = multicast ? Math.max(0, Math.floor(Number(times) || 0)) : (taken?.count ?? 0);

  const riding = (riders ?? [])
    .map((rider) => readTargets(cardProse(rider?.body)))
    .filter(Boolean);

  if (!base && !taken && riding.length === 0) return { some: false, count: 0 };

  // An uncounted answer anywhere leaves the whole plan uncapped: an area is an
  // area whichever text drew it.
  const open =
    (base && base.count === null) ||
    (taken && taken.count === null) ||
    riding.some((entry) => entry.count === null);

  return {
    some: true,
    count: open
      ? null
      : (base?.count ?? 0) + extra + riding.reduce((sum, entry) => sum + entry.count, 0),
  };
}

/** How many bodies the picker may take, as a number a loop can use. */
export function targetCeiling(plan, roster = []) {
  if (!plan?.some) return 0;
  return plan.count === null ? roster.length : Math.min(plan.count, roster.length);
}
