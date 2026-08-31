/**
 * What a die looks like, and what it is for.
 *
 * Data and prose rather than a component, so that Die.jsx can export only a
 * component (the repo's fast-refresh rule) and so that anything else that wants
 * to name a die's purpose can, without importing a renderer.
 */

/**
 * Points in a 100 by 100 box, and how far the number sits below centre.
 *
 * A physical die is recognised by its silhouette before anything else, which is
 * the whole reason a table can be read at a glance: a d4 is a triangle and a d6
 * is a square, and neither has to be labelled.
 *
 * `drop` is a correction in percent of the die's own height. A shape that narrows
 * upward puts its visual middle lower than its geometric one, so a numeral
 * centred in a triangle looks like it is falling out of the top.
 */
export const SHAPES = {
  4: { points: '50,8 95,88 5,88', drop: 14 },
  6: { points: '10,10 90,10 90,90 10,90', drop: 0 },
  8: { points: '50,4 94,50 50,96 6,50', drop: 0 },
  10: { points: '50,3 92,40 50,97 8,40', drop: 2 },
  12: { points: '50,5 95,38 78,92 22,92 5,38', drop: 4 },
  20: { points: '50,4 92,27 92,73 50,96 8,73 8,27', drop: 0 },
};

/**
 * What a die is for, in the words the glossary uses for it.
 *
 * The burst says the whole rule rather than naming it, because the roller is
 * where a player meets it: a die they did not ask for appears, and the question
 * is why. No card in the codex states the rule, so there is nothing to tap for it
 * and nowhere else to read it. See the `Exploding Dice` entry in keywords.js.
 */
export function dieTitle(die) {
  if (die.role === 'advantage') return 'Advantage: added to the roll';
  if (die.role === 'disadvantage') return 'Disadvantage: taken off the roll';
  if (die.role === 'karma') {
    return `${die.source ?? 'Karma'}: bought after the dice had stopped, and added to the roll`;
  }
  if (die.role === 'explosion') {
    return (
      'Exploding Dice: the die before this one rolled its maximum, so it threw one of the ' +
      'category above. That adds to the total, and can explode again.'
    );
  }
  return `d${die.sides}`;
}
