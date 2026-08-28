/**
 * What a card *does to the sheet* the moment it is used, beyond paying for it.
 *
 * Nearly nothing does. A spell rolls dice the table reads, a swing lands where
 * the Game Master says it lands, a Healing Potion moves one pool. The sheet's
 * job for all of that is to take the points and get out of the way.
 *
 * Two cards are not like that, and they are the two Jules asked for on
 * 2026-08-28: "If there is trigger like long rest or clean potion that do
 * something do it."
 *
 *   DRAUGHT OF CLEANSING  clears rows off the tracker
 *   LIFE TREE TEA         does everything a Long Rest does
 *
 * Both were printed and neither was wired, which is the worst of the three
 * possible states: the card says the thing happens, the player pays six Action
 * Points and two Willpower for it, and then goes and does the bookkeeping by
 * hand anyway.
 *
 * ------------------------------------------------------ keyed on the card, again
 * The same shape `EFFECT_RIDERS` takes and for the same reason: a card id, and
 * beside it what that card does. **A card in this table is a card whose printed
 * text names something this sheet already holds**, and one that names anything
 * else is deliberately absent. The ETHEREALNESS POTION makes you "immune to all
 * effects", which is every rule at once rather than a write, and it stays a
 * card the table reads.
 *
 * A trigger is handed the character as the use has already left them, so it
 * reads a belt with the flask's charge already spent and an effects list with
 * whatever else this use laid on it. What it hands back is merged into the same
 * patch: one use is one write.
 *
 * ---------------------------------------------------------------- and it says so
 * Every trigger carries a `line`, printed in the use prompt before the tap. A
 * sheet that quietly rewrites six columns because you drank something is a sheet
 * you stop trusting, so what is about to happen is said first and in the fewest
 * words that stay true.
 *
 * ------------------------------------------------------------------- the name
 * `onUse.js` and not `useTriggers.js`, which is what it was called for about ten
 * minutes: a module whose exports begin with `use` is a module every one of
 * whose exports React's lint reads as a hook, and `fireUseTrigger` was refused
 * for being called somewhere a hook may not be. The file is named after when it
 * runs instead, and its three readers are named after `riderOf` and `riderLine`
 * in riders.js, which is the table this one is modelled on anyway.
 */

import { normalizeEffects } from './combatTurn.js';
import { restPlan } from './rest.js';

/** As long as a status effect can run and still be washed off. */
export const CLEANSE_TURNS = 20;

/**
 * The cards that write something on their own, by card id.
 *
 * `fire` is handed the character as the use leaves them and gives back a patch,
 * or null when there was nothing to do. `line` is what the prompt prints, and
 * it may read the character too, because "removes 3 effects" is worth more than
 * "removes effects" at the moment somebody is deciding whether to drink it.
 */
export const USE_TRIGGERS = {
  /* "Drinking this draught removes every status effect on you that lasts 20
     turns or less, along with every one that would only have ended at a Long
     Rest."

     Two tests, because the card now draws the line at both ends. The count is
     the designer's own. The second clause is Jules' addition, and the shape it
     takes here is the one already written down in rest.js: **everything a Long
     Rest would have ended**, which is `until` of either kind, since a long rest
     ends everything a short one does and more.

     A row that has already run out goes with them. It is sitting on the block to
     be noticed rather than doing anything, and a draught that left the corpses
     behind would look like a draught that missed something. */
  'draught-of-cleansing': {
    fire(character) {
      const effects = normalizeEffects(character?.effects);
      const washed = effects.filter(cleansed);
      if (washed.length === 0) return null;

      return { effects: effects.filter((effect) => !cleansed(effect)) };
    },
    line(character) {
      const washed = normalizeEffects(character?.effects).filter(cleansed);
      if (washed.length === 0) return 'Nothing on you is short enough or shallow enough to wash off.';
      return `Washes off ${washed.map((effect) => effect.name).join(', ')}.`;
    },
  },

  /* "Drinking this tea gives you the benefit of a Long Rest. It costs no
     Supplies and it does not spend your Long Rest action."

     So it is a Long Rest, run through the one function that knows what one is.
     Not a copy of it: a rest fills six pools, brings a downed creature back,
     reloads a belt, gives back every card that said you had to sleep before
     using it again and ends everything written to end at one, and a second
     implementation of that list would be wrong within a month.

     `free` is what the two clauses ask for. No labours, no prepared hand, no
     brews and no reshaped blade: those are the Long Rest *action*, offered in
     the rest window, and the card says this cup does not spend one. */
  'life-tree-tea': {
    fire(character) {
      return restPlan(character, 'long', [], null, [], null, { free: true })?.patch ?? null;
    },
    line() {
      return 'Everything a Long Rest gives back, out of the cup. No Supplies, and no Long Rest action.';
    },
  },

  /* -------------------------------------------------- considered and left out
   *
   * Cards that plainly do something on use and whose something this sheet has
   * nowhere to write. Each still prints its own card, and the table applies it.
   *
   *   etherealness-potion  "immune to all effects" is every rule at once. The
   *                        two turns of it are tracked; what they mean is the
   *                        table's.
   *   elixir-of-chaos      two potions rolled for on 2d10. The roll is the
   *                        table's, and a sheet that rolled it would be taking
   *                        the one interesting thing about the card away.
   *   elixir-of-time       a turn replayed, with every pool and every item put
   *                        back the way it was when the flask was opened. That
   *                        is a snapshot of the whole character rather than a
   *                        patch, and nothing on this sheet keeps one.
   *   healing-potion       and every other card that moves a pool once. Those
   *                        belong to the pools on block 2, which is where a
   *                        number is dragged and a ledger row is written with a
   *                        reason on it.
   */
};

/**
 * Whether a Draught of Cleansing takes this row off.
 *
 * Written once and read twice, by the patch and by the line that promises it, so
 * the sentence in the prompt cannot come apart from the write behind it.
 */
function cleansed(effect) {
  if (effect.until === 'short' || effect.until === 'long') return true;
  return effect.turns !== null && effect.turns <= CLEANSE_TURNS;
}

/**
 * What this card does on its own, or null for the nearly every card that does
 * not. `riderOf` in riders.js is the shape, down to the name.
 */
export function triggerOf(cardId) {
  const entry = cardId ? USE_TRIGGERS[String(cardId)] : null;
  return entry ?? null;
}

/**
 * The patch a use writes on its own, given the character as the use has already
 * left them, or null when this card writes nothing.
 */
export function fireTrigger(card, character) {
  return triggerOf(card?.id)?.fire(character) ?? null;
}

/**
 * And what that patch will do, in words, for the prompt to print before the tap.
 * Null for every card with no trigger, which is what the prompt tests on.
 */
export function triggerLine(card, character) {
  return triggerOf(card?.id)?.line(character) ?? null;
}
