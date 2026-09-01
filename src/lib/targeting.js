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

  return null;
}

/**
 * The plan: whether to offer the picker, and how far it may be filled.
 *
 * `times` is how many times the card's second half has been taken. It only
 * moves the answer for the two halves that are about targets, and which half
 * this card carries is read off its own `sub_name`, exactly as overcast.js
 * reads the price off the same text.
 */
export function targetPlan(card, { times = 0 } = {}) {
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

  if (!base && !taken) return { some: false, count: 0 };

  // An uncounted answer on either half leaves the whole plan uncapped.
  const open = (base && base.count === null) || (taken && taken.count === null);

  return {
    some: true,
    count: open ? null : (base?.count ?? 0) + extra,
  };
}

/** How many bodies the picker may take, as a number a loop can use. */
export function targetCeiling(plan, roster = []) {
  if (!plan?.some) return 0;
  return plan.count === null ? roster.length : Math.min(plan.count, roster.length);
}
