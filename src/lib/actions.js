/**
 * The basic actions — what every character can do, whatever they are,
 * whatever they are holding, from level 1 to the cap.
 *
 * Pulled from the designer's sheet ("General Rules — Basic Abilities",
 * 2026-08-19). They are cards for the same reason a weapon's attacks are
 * cards: the sheet asks what a use costs, spends it, and shows the card, so
 * nobody spends four Action Points and only afterwards goes looking for what
 * Stabilize does.
 *
 * ---------------------------------------------------------------- the name
 * The sheet calls these Basic Actions and so does the tag on every card here.
 * They were "Standard Actions" while the only source was the printed V4
 * cheatsheet; the sheet is the source now, and the game's word wins.
 *
 * ------------------------------------------------------------------ modular
 * A basic action names its attribute outright, unlike a spell: Grapple is
 * Physique for everybody and there is no talent that moves it. What is *not*
 * hardcoded is any number. Every roll prints {roll:…} so the card says what
 * this character adds, and Move and Jump print [[speed]] so they say how far
 * this character actually goes rather than pointing at a stat block.
 *
 * Investigate is the one that offers a choice, and it is written as a choice:
 * both attributes are printed with both bonuses, so the reader picks by
 * looking rather than by remembering which of the two is better.
 *
 * ------------------------------------------------------- what was translated
 * The sheet's own typos are corrected, and nothing else: "hieight" is height,
 * "acertain weakenss or strenght" is ascertain weakness or strength, "losoe"
 * is lose, "devied" is divided, "helad" is healed, "cna" is can, "itno" is
 * into. Where the sheet leaves a value blank and writes "(value here)", the
 * card prints the live number instead.
 *
 * ------------------------------------------------------------- the odd ones
 * `variable: true` marks an action whose Action Point cost is not fixed. Two
 * of them are:
 *
 *   Interact    the cost is the Game Master's to set, so the sheet asks for a
 *               number instead of assuming one
 *   Anticipate  it is not really a cost at all — the points are not spent,
 *               they are moved into the Reaction pool one for one, which is
 *               why it carries `converts: 'reaction'` and never asks the
 *               action-or-reaction question every other use asks
 *
 * `stat` is the attribute a card's {roll} prints against, exactly as on any
 * other card.
 *
 * ------------------------------------------------------------------- Climb
 * Climb is not on the sheet. It came off the V4 cheatsheet and is kept here
 * rather than dropped, because a basic action nobody transcribed is far more
 * likely than a basic action deliberately removed. It is the one card on this
 * list the sheet does not vouch for.
 */

import { withArt } from './cardArt.js';

/** The Action Point ceiling a variable-cost action will offer to spend. */
export const VARIABLE_CAP = 12;

export const BASIC_ACTIONS = withArt([
  {
    id: 'move',
    name: 'Move',
    kind: 'ability',
    tags: ['Basic Action', 'Movement'],
    ap: 1,
    wp: null,
    stat: 'instinct',
    summary: 'Cover ground up to your Movement Speed.',
    body: 'You move a distance up to your Movement Speed: [[speed]] meters.',
  },
  {
    id: 'jump',
    name: 'Jump',
    kind: 'ability',
    tags: ['Basic Action', 'Movement'],
    ap: 2,
    wp: null,
    stat: 'physique',
    summary: 'Leap your Movement Speed across, your own height up.',
    body:
      'You jump a distance up to your Movement Speed, [[speed]] meters, and a height equal to your own height.', // text-style-ok: appositive, not a list item
  },
  {
    /* Off the V4 cheatsheet, not the sheet — see the note at the top. */
    id: 'climb',
    name: 'Climb',
    kind: 'ability',
    tags: ['Basic Action', 'Movement'],
    ap: 1,
    wp: null,
    stat: 'physique',
    summary: 'Go up a vertical surface at half your Movement Speed.',
    body:
      'You climb a vertical surface a distance up to half your Movement Speed.\n\n' +
      'Your Game Master might ask for a roll, depending on what you are climbing.',
  },
  {
    id: 'investigate',
    name: 'Investigate',
    kind: 'ability',
    tags: ['Basic Action'],
    ap: 2,
    wp: null,
    stat: 'mind',
    summary: 'Read a room or read an enemy, and learn something worth knowing.',
    body:
      'While in combat, you attempt to ascertain the weakness or the strength of **an enemy**, or to find a weak point or a hazard in the place you are fighting in.\n\n' +
      'Make a {mind} {roll:mind} or {instinct} {roll:instinct} Roll against **an enemy entity**’s Grit, or against an environment difficulty rating your Game Master sets.\n\n' +
      /* The sheet writes "critical information" here. Critical is a defined
         term meaning a natural 20, and it is lit wherever it appears, so that
         wording would offer the crit rule as the explanation of a word being
         used to mean "important". */
      'On a success you learn something worth knowing: what could help you in this fight, or the strengths and the weaknesses of the foe.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* Not on the sheet either, and asked for outright: "Add a new basic action
       which is to do a skill check that let you select an attribute and then add
       any skill that could be relevant (like arcane marshal ect). Skill check
       are modular action cost and can cost nothing." Jules, 2026-09-02.

       Every other card in the codex names its own attribute. This one cannot:
       the whole of a skill check is that the table decides what it is being
       attempted with, so the attribute is a question asked at the moment of use
       and `picks: 'check'` is what raises it. The card's printed `stat` is only
       where the picker opens.

       `ap: 0` with `variable: true`, which is the pair that says "modular, and
       nothing is a real answer": the dial opens on what the card printed, and it
       printed nothing. See the note on `variable` above, and `ap: 0` on RAGING
       BLOW in talents.js for the same argument about saying the nothing out
       loud. */
    id: 'skill-check',
    name: 'Skill Check',
    kind: 'ability',
    tags: ['Basic Action'],
    ap: 0,
    wp: null,
    variable: true,
    picks: 'check',
    stat: 'mind',
    summary: 'Attempt something the world might refuse you, with whatever you know.',
    body:
      'You attempt something that is not an attack and is not certain: a wall to climb, a lock to pick, a guard to talk past.\n\n' + // text-style-ok: a list after a colon
      'Choose the attribute it is made with and roll a {stat} Skill Check {roll} against a difficulty your Game Master sets.\n\n' +
      'What it costs in Action Points is the Game Master’s to set, and most attempts cost nothing. Any skill you hold that applies is brought with it and pays its own price.',
  },
  {
    id: 'interact',
    name: 'Interact',
    kind: 'ability',
    tags: ['Basic Action'],
    ap: null,
    wp: null,
    variable: true,
    stat: 'physique',
    summary: 'Handle something in the world. The Game Master sets the price.',
    body:
      'You interact with an object or with your surroundings: opening a door, pulling a lever, picking something up off the floor.\n\n' +
      'What it costs in Action Points is the Game Master’s to set.',
  },
  {
    id: 'hide',
    name: 'Hide',
    kind: 'ability',
    tags: ['Basic Action', 'Cunning'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    summary: 'Break line of sight and stay unfound until someone goes looking.',
    body:
      'If no enemy has line of sight on you, you may attempt to hide with an {instinct} Roll {roll:instinct} against the Grit of **every enemy**.\n\n' +
      '**Every enemy** whose Grit you beat loses sight of you.\n\n' +
      'On their turn they use {{Investigate}} to attempt to find you.',
  },
  {
    id: 'grapple',
    name: 'Grapple',
    kind: 'ability',
    tags: ['Basic Action'],
    ap: 2,
    wp: null,
    stat: 'physique',
    summary: 'Take hold of something within reach and stop it leaving.',
    body:
      'You attempt to restrain **an entity** within your reach.\n\n' +
      'Make a {physique} Roll {roll:physique} against the target’s Reflex.\n\n' +
      'On a success, the target is grappled.',
  },
  {
    id: 'shove',
    name: 'Shove',
    kind: 'ability',
    tags: ['Basic Action'],
    ap: 2,
    wp: null,
    stat: 'physique',
    summary: 'Put something on the floor, or put it somewhere else.',
    body:
      'You use force to push **an entity** you can touch away from you.\n\n' +
      'Make a {physique} Attack Roll {roll:physique} against the target.\n\n' +
      /* The sheet writes "(3 feet)" here. Every other conversion in the codex
         reads 1.5 meters as 5 feet, and so does the app's own unit switch,
         which snaps to 5ft steps because a battle map is drawn in them. Jules
         confirmed the conversion on 2026-09-02 (1.5 m = 5 ft = 1 space) and
         called this one a slip, so it is corrected here with the sheet's other
         typos rather than carried. See docs/rulebook.md. */
      'On a hit, you push the target back **1.5 meters (5 feet)** or knock it prone.',
  },
  {
    id: 'anticipate',
    name: 'Anticipate',
    kind: 'ability',
    tags: ['Basic Action', 'Reaction'],
    ap: null,
    wp: null,
    variable: true,
    converts: 'reaction',
    stat: 'instinct',
    summary: 'Hold back. Action Points become Reaction Points, one for one.',
    body:
      /* Not "you give up the initiative": Initiative is a defined term meaning
         turn order, and it is lit wherever it appears, so that wording offered
         the turn-order rule as the explanation of an ordinary English phrase. */
      'You hold back and wait on someone else instead.\n\n' +
      'Convert any number of Action Points into Reaction Points, one for one. Nothing is spent by this: the points move from one pool to the other, and no pool may pass its own maximum.',
  },
  {
    id: 'stabilize',
    name: 'Stabilize',
    kind: 'ability',
    tags: ['Basic Action'],
    ap: 4,
    wp: null,
    stat: 'mind',
    summary: 'Stop a dying ally dying. They stay down, but they stay.',
    body:
      'You attempt to stabilize **a dying entity** within your reach.\n\n' +
      'Make a {mind} Roll {roll:mind} against the target’s negative Health divided by 5.\n\n' +
      'On a success they are no longer dying and sit at 0 Health. They remain unconscious until healed.',
  },
  {
    id: 'inventory',
    name: 'Inventory',
    kind: 'ability',
    tags: ['Basic Action'],
    ap: 4,
    wp: null,
    stat: 'physique',
    summary: 'Get into your pack for something that is not on your belt.',
    body:
      'You retrieve, stow or swap an item stored in your pack.\n\n' +
      'Items on your belt can be reached freely. Getting into your pack is what this action costs.',
  },
]);
