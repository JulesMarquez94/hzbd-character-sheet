/**
 * What a card can only do so many times before it needs a rest.
 *
 * The belt has always known this. A flask holds `charges`, its `recharge` names
 * what fills it again, the loop counts what has been spent, and `beltRest` hands
 * it back. That is the whole shape, and it was only ever wired to *items* — so a
 * lineage ability whose card says "you must take a long rest before you can use
 * this ability again" had nowhere to write down that it had been used. Nothing
 * greyed out, nothing counted down, and nothing came back, because nothing had
 * gone away.
 *
 * This is that same shape for the other half of the sheet:
 *
 *   uses      how many times before it is spent. Absent means never.
 *   recharge  what fills it again, in the card's own words: 'Long Rest'.
 *
 * ------------------------------------------------------------------- one or N
 * "Once per long rest" is `uses: 1` and nothing here treats it as a special
 * case. A card that says you may do it three times is `uses: 3`, spends one at a
 * time, prints how many are left on the chip and comes back whole on the rest it
 * names. The one and the three are the same rule counted to a different number,
 * which is why there is no separate flag for a once-only card.
 *
 * ------------------------------------------------------------- data, not prose
 * The rider is authored on the card, the way `onCombatStart`, `empower` and a
 * flask's own `charges` are. The prose still prints the sentence the designer
 * wrote, and the sheet never reads it back: a card that says something this file
 * cannot see is a card that needs a rider, not a cleverer regular expression.
 *
 * `recharge` is read back to one of the sheet's two boundaries by `rechargeRest`,
 * the belt's own reading, so a Long Rest fills a card the same way it fills a
 * tome. Anything it cannot read lands nowhere and is filled at the table: a rest
 * must never quietly refill a thing whose refill it is not.
 *
 * -------------------------------------------------------------- where it lives
 * One column, `card_uses`, keyed by card id: `{ "sprout-wings": 1 }`. Keyed by
 * the card and not by where the card came from, on purpose, and that is the
 * stacking law rather than a shortcut: an effect does not stack with itself from
 * the same source, so two rings both carrying Defibrillation do not buy two
 * saves. One tracker for the card, however many copies of it are on the sheet.
 *
 * A sheet holding nothing limited never writes the column.
 */

import { rechargeRest } from './items.js';
import { getCard } from './weapons.js';
import { getEnchantment } from './enchantments.js';

/**
 * How many times a card may be used before it is spent, and what fills it, or
 * null for everything with no limit at all.
 *
 * A rider with a count and no `recharge` is still a limit: it runs out and stays
 * out, which is a thing a card is allowed to say. `fills` is null there, and the
 * rest below leaves it alone.
 */
export function cardLimit(card) {
  const max = Math.max(0, Math.floor(Number(card?.uses) || 0));
  if (max === 0) return null;

  return { max, recharge: card?.recharge ?? null, fills: rechargeRest(card) };
}

/** Whether a card is one of the ones this file has anything to say about. */
export function isLimited(card) {
  return cardLimit(card) !== null;
}

/**
 * The stored counts, cleaned. A count is clamped to what the card it names
 * actually holds, so a rider lowered from three uses to one cannot leave a sheet
 * remembering that two were spent out of one.
 *
 * An id no card and no enchantment answers to is dropped rather than kept: it is
 * a card the codex no longer has, and a count of uses against nothing is a row
 * that can never be spent and can never come back.
 */
export function normalizeUses(value) {
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
  for (const [id, count] of Object.entries(source)) {
    const limit = cardLimit(resolveCard(id));
    if (!limit) continue;

    const used = Math.min(limit.max, Math.max(0, Math.floor(Number(count) || 0)));
    if (used > 0) clean[id] = used;
  }

  return clean;
}

/**
 * The card an id names, wherever it is filed.
 *
 * Enchantments are their own registry and are not in `getCard`, and two of them
 * are exactly the kind of thing this file is for: Defibrillation and Death
 * Defiance both fire once and both need a long rest before they fire again. So
 * both registries are asked, in the order a card id is likelier to be in them.
 *
 * **A rider on a card neither registry answers for does nothing at all**, and it
 * does it quietly: the count is dropped on the way in, so the chip stays live and
 * the rest has nothing to hand back. This is the same trap `withArt` sets for a
 * new card family. A family folded into `CARDS` in weapons.js is safe, and every
 * one of them is; a family that is not has to be added here.
 */
function resolveCard(id) {
  return getCard(id) ?? getEnchantment(id) ?? null;
}

/**
 * How a limited card stands right now: what it holds, what is gone, what is
 * left, and whether there is anything left at all.
 *
 * Null for a card with no limit, which is what every caller checks. `remaining`
 * counts down and `spent` is the whole of what greys a chip out.
 */
export function cardUse(character, card) {
  const limit = cardLimit(card);
  if (!limit) return null;

  const stored = normalizeUses(character?.card_uses);
  const used = Math.min(limit.max, Math.max(0, Math.floor(Number(stored[card.id]) || 0)));

  return {
    ...limit,
    id: card.id,
    used,
    remaining: limit.max - used,
    spent: used >= limit.max,
  };
}

/**
 * The column as it reads after one more use, or null when there is nothing left
 * to spend.
 *
 * A patch body rather than a write, the way everything else that a use costs is:
 * the chip hands it to `spendUse` as its `extra` and the points, the effect and
 * the use all land in one call. Backing out of the prompt writes none of it.
 */
export function spendCardUse(character, card) {
  const state = cardUse(character, card);
  if (!state || state.spent) return null;

  return { card_uses: { ...normalizeUses(character?.card_uses), [card.id]: state.used + 1 } };
}

/**
 * The same count, stepped by hand, for the half of this that nobody clicks.
 *
 * Defibrillation fires when you go down, not when you tap it. Nothing on this
 * sheet knows that you went down, so the trigger stays the table's to notice, the
 * way every other printed conditional here is. But *whether it has fired since
 * your last long rest* is a fact about the character rather than about the
 * moment, and a fact about the character belongs on the character. So a standing
 * card that limits itself carries a mark, and the hand that noticed it fire sets
 * it.
 *
 * It **cycles** rather than toggling: one more use gone each tap, and back to
 * whole from spent. That is a toggle for the once-only cards, which is all there
 * is today, and it is still one control and still one row wide for a card that
 * allows three. A mis-tap is never more than a few taps from being undone, which
 * is the whole reason it wraps rather than sticking at spent.
 *
 * Null for a card with no limit, so a caller can hand any row in.
 */
export function cycleCardUse(character, card) {
  const state = cardUse(character, card);
  if (!state) return null;

  const stored = normalizeUses(character?.card_uses);
  const next = state.spent ? 0 : state.used + 1;

  if (next === 0) delete stored[card.id];
  else stored[card.id] = next;

  return { card_uses: stored };
}

/** What using it costs the card, said before it happens. */
export function usageNote(state) {
  const left = state.remaining - 1;
  if (left > 0) return `Spends a use. ${left} of ${state.max} left after this.`;
  return state.recharge
    ? `Its last use. It comes back after a ${state.recharge}.`
    : 'Its last use, and nothing on the sheet brings it back.';
}

/** Why a chip is dead, said in the card's own terms. */
export function spentNote(card, state) {
  return state.recharge
    ? `${card.name} is spent. A ${state.recharge} brings it back.`
    : `${card.name} is spent, and nothing on the sheet brings it back.`;
}

/**
 * What a rest gives back.
 *
 * The mirror of `beltRest`, against the same `ends` list, which gets the law
 * right in both directions for free: a long rest fills a short-rest card because
 * it does everything a short rest does, and a short rest leaves a long-rest card
 * spent. A card whose `recharge` reads back to neither boundary is left exactly
 * as it was.
 *
 * Every id in the column is walked rather than every card the character holds.
 * The column *is* the record of what has been spent, so a card put down between
 * the use and the rest still has its count cleared rather than stranded there.
 *
 * Null when a rest owes nothing, so a sheet with nothing spent is never written
 * and never printed.
 */
export function usesRest(character, ends = []) {
  const stored = normalizeUses(character?.card_uses);
  const next = { ...stored };
  const lines = [];

  for (const [id, used] of Object.entries(stored)) {
    const card = resolveCard(id);
    const limit = cardLimit(card);
    if (!limit?.fills || !ends.includes(limit.fills)) continue;

    delete next[id];
    lines.push({
      key: `uses-${id}`,
      label:
        limit.max === 1 ? `${card.name} comes back` : `${card.name}: ${used} of ${limit.max} back`,
      detail: `It was spent. A ${limit.recharge} is what fills it.`,
      tone: 'gain',
    });
  }

  return lines.length > 0 ? { patch: { card_uses: next }, lines } : null;
}
