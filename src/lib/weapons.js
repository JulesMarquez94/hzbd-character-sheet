/**
 * Weapons, the cards they teach, and the enchantments that can be laid on
 * them.
 *
 * A weapon is an item like any other piece of gear — it just happens to teach
 * two ability cards while it is held. The cards live here as data (never on
 * the character row): equipping a weapon lends you its cards, unequipping
 * takes them back.
 *
 * ---------------------------------------------------------------- card text
 * Card bodies are authored the way the printed cards read, with these markers:
 *
 *   {stat}                the card's own attribute, by name ("Instinct")
 *   {mind} {physique} …   a named attribute, when the card always uses that one
 *   {damage}              the card's damage type — the enchantment on the
 *                         weapon may have turned it into something else
 *   {roll}                what this character adds to that roll — "(+4)".
 *                         Every card that asks for a roll prints one, so the
 *                         reader never has to go and look the number up
 *   [[2d6 + 2*stat]]      a live value — printed as "2d8 + 8" for a character
 *                         with Instinct 4 holding an Empowering weapon, and
 *                         clickable for the breakdown
 *   {{Cold Infusion}}     a link to another card, opened on top of this one
 *
 * There is deliberately no emphasis marker. Three things stand out on a card —
 * an attribute, a damage type and a defined term — and everything else is
 * prose. See the note at the top of keywords.js for why the `**bold**` these
 * bodies used to carry was taken back out.
 *
 * Nothing here hard-codes a number or a damage type a character could change:
 * both are resolved against whoever is holding the weapon and what has been
 * laid on it. One card serves every weapon that teaches it — a plain sword
 * and a Cold-Infused one read the same card, printed differently.
 *
 * ------------------------------------------------------------ what to roll
 * A card that asks for a roll against another entity has exactly two shapes:
 * an **attack** ("Make a {stat} Ranged Attack"), resolved against the target's
 * **Defense**; or a plain **roll**, contested against the target's **Reflex**
 * or **Grit**. A spell that is not swung at someone always names one of those
 * two — there is no third target number.
 */

import { SPELLS } from './spells.js';
import { INGREDIENTS } from './ingredients.js';
import { UTILITY_CARDS } from './utility.js';
import { TALENT_CARDS } from './talents.js';
import { LINEAGE_CARDS } from './lineages.js';
import { BACKGROUND_CARDS } from './backgrounds.js';
import { BASIC_ACTIONS } from './actions.js';

/* ------------------------------------------------------------- enchantments */

/**
 * An enchantment is a passive card, a price tag, and — where it changes how
 * the weapon hits — a rider the ability cards read:
 *
 *   burden      Magic Burden it adds to whatever carries it
 *   cost        price in coin
 *   damageType  replaces the weapon's own damage type
 *   empower     steps every damage die up a category (d6 -> d8), capped at d12
 *   spell       true when the item names the spell it carries
 *
 * An item lists what has been laid on it in `enchants: [{ id, spell? }]`.
 */
export const ENCHANTMENTS = [
  {
    id: 'cold-infusion',
    name: 'Cold Infusion',
    kind: 'passive',
    tags: ['Enchantment', 'Infusion'],
    burden: 4,
    cost: 3000,
    damageType: 'Cold',
    empower: 1,
    effect: 'Weapon damage type becomes Cold and its damage is Empowered by 1.',
    body:
      'The weapon this enchantment is laid upon deals {damage:Cold} damage in place of its own damage type.\n\n' +
      'Its damage is Empowered by 1: every damage die it rolls steps up a category — a d6 becomes a d8 — and no die may pass a d12.',
  },
  {
    id: 'decay-infusion',
    name: 'Decay Infusion',
    kind: 'passive',
    tags: ['Enchantment', 'Infusion'],
    burden: 4,
    cost: 3000,
    damageType: 'Decay',
    empower: 1,
    effect: 'Weapon damage type becomes Decay and its damage is Empowered by 1.',
    body:
      'The weapon this enchantment is laid upon deals {damage:Decay} damage in place of its own damage type.\n\n' +
      'Its damage is Empowered by 1: every damage die it rolls steps up a category — a d6 becomes a d8 — and no die may pass a d12.',
  },
  {
    id: 'luminescence',
    name: 'Luminescence',
    kind: 'passive',
    tags: ['Enchantment', 'Utility'],
    burden: 2,
    cost: 1500,
    effect: 'Can be turned on or off to illuminate a 15 meters (50 feet) area.',
    body:
      'The item can be turned on or off at will.\n\n' +
      'While lit, it illuminates an area of 15 meters (50 feet) around it.',
  },
  {
    id: 'novice-imbuement',
    name: 'Novice Imbuement',
    kind: 'passive',
    tags: ['Enchantment', 'Imbuement'],
    burden: 3,
    cost: 2250,
    spell: true,
    effect:
      'Enchant an item with a NOVICE spell, allowing the wielder to cast this spell 1 time until they take a Long Rest.',
    body:
      'A single Novice Spell is bound into the item.\n\n' +
      'Whoever wields it may cast that spell once, paying its costs as normal, whether or not they can cast spells of their own.\n\n' +
      'The casting returns after a Long Rest.',
  },
];

/* -------------------------------------------------------------------- spells */

/* Spells live in their own leaf module so the landing page can reach one
   without pulling the whole codex in behind it. Imported rather than
   re-exported straight through, because CARDS below folds them in, and
   re-exported because this file has always been where the codex's spells are
   imported from. */
export { SPELLS };

/* ------------------------------------------------------------ basic actions */

/**
 * Things every character can do, whatever they are holding. They are cards for
 * the same reason a weapon's attacks are: the sheet asks what a use costs and
 * then shows the card, so the reader never has to be told what they just spent
 * points on.
 */
export const ACTION_CARDS = [
  {
    id: 'swap-weapons',
    name: 'Swap Weapons',
    kind: 'ability',
    tags: ['Action', 'Loadout'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    body:
      'You stow the weapon in your hands and draw the one you were carrying, so the two change places.\n\n' +
      'Whatever the drawn weapon teaches is yours from this moment; the stowed one takes its cards back with it.',
  },
];

/* ------------------------------------------------------------ weapon cards */

/**
 * Every weapon teaches two cards: the plain attack it makes, and the special
 * move that costs more (and usually Willpower) to pull off.
 */
export const WEAPON_ABILITIES = [
  /* ----- Bo Staff ----- */
  {
    id: 'bo-staff-slam',
    name: 'Bo Staff - Slam',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'instinct',
    damage: ['Blunt'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 3 Meter (10 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'bo-staff-swipe',
    name: 'Bo Staff - Swipe',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Blunt'],
    body:
      'Make an {stat} Melee Attack {roll} against all entities within 3 Meter (10 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },

  /* ----- Daggers ----- */
  {
    id: 'daggers-strike',
    name: 'Daggers - Strike',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 1.5 Meter (5 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'daggers-triple-strike',
    name: 'Daggers - Triple Strike',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make three {stat} Melee Attack {roll} against an entity within 1.5 Meter (5 Feet) of you.\n\n' +
      'For each hit, you deal [[1d6 + stat]] as {damage} damage.',
  },

  /* ----- One-Handed ----- */
  {
    id: 'one-handed-strike',
    name: 'One-Handed - Strike',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 1.5 Meter (5 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'one-handed-swift-strike',
    name: 'One-Handed - Swift Strike',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make an {stat} Melee Attack {roll} with Disadvantage against an entity within 1.5 Meter (5 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },

  /* ----- Two-Handed ----- */
  {
    id: 'two-handed-strike',
    name: 'Two-Handed - Strike',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 3 Meter (10 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'two-handed-cleave',
    name: 'Two-Handed - Cleave',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} against all entities within 4.5 meters (15 feet) in front of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },

  /* ----- Shield & 1-Handed ----- */
  {
    id: 'shield-attack',
    name: 'Shield & 1-Handed - Attack',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 1.5 Meter (5 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'shield-block',
    name: 'Shield & 1-Handed - Block',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Move'],
    ap: 1,
    wp: 1,
    stat: 'physique',
    body:
      'You raise your shield, reducing the damage from the next attack that hits you by [[2d6 + stat]].',
  },

  /* ----- Whip ----- */
  {
    id: 'whip-lash',
    name: 'Whip - Lash',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 4.5 Meter (15 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'whip-pull',
    name: 'Whip - Pull',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 3,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 4.5 Meter (15 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage. You then either pull the target 4.5 meters (15 Feet) toward you or pull yourself 4.5 meters (15 Feet) toward the target.',
  },

  /* ----- Short Bow ----- */
  {
    id: 'short-bow-shoot',
    name: 'Short Bow - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 25 Meter (80 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'short-bow-triple-shot',
    name: 'Short Bow - Triple Shot',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make three {stat} Ranged Attack {roll} against an entity within 25 Meter (80 Feet) of you.\n\n' +
      'For each hit, you deal [[1d6 + stat]] as {damage} damage.',
  },

  /* ----- Longbow ----- */
  {
    id: 'longbow-shoot',
    name: 'Longbow - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 30 Meter (100 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'longbow-aimed-shot',
    name: 'Longbow - Aimed Shot',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Ranged Attack {roll} with Disadvantage against an entity within 45 Meter (150 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + 3*stat]] as {damage} damage.',
  },

  /* ----- Greatbow ----- */
  {
    id: 'greatbow-shoot',
    name: 'Greatbow - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 30 Meter (100 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'greatbow-piercing-shot',
    name: 'Greatbow - Piercing Shot',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Ranged Attack {roll} against a first entity and all entities in a line behind it within 30 Meter (100 Feet).\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },

  /* ----- Flintlock Pistol ----- */
  {
    id: 'flintlock-pistol-shoot',
    name: 'Flintlock Pistol - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 1,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 25 Meter (80 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'flintlock-pistol-reload',
    name: 'Flintlock Pistol - Reload',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    body:
      'Your Flintlock Pistol starts loaded with 3 Shots. Every use of the Flintlock Pistol - Shoot ability consumes one shot.\n\n' +
      'After you have used all 3 shots, you must use this Reload ability before you can Shoot again.',
  },

  /* ----- Dual Pistols ----- */
  {
    id: 'dual-pistols-shoot',
    name: 'Dual Pistols - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make two {stat} Ranged Attack {roll} against up to two entities within 25 Meter (80 Feet) of you.\n\n' +
      'For each hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'dual-pistols-reload',
    name: 'Dual Pistols - Reload',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 6,
    wp: null,
    stat: 'instinct',
    body:
      'Your Dual Pistols start loaded with 3 Shots. Every use of the Dual Pistols - Shoot ability consumes one shot.\n\n' +
      'After you have used all 3 shots, you must use this Reload ability before you can Shoot again.',
  },

  /* ----- Flintlock Rifle ----- */
  {
    id: 'flintlock-rifle-shoot',
    name: 'Flintlock Rifle - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 1,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 30 Meter (100 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'flintlock-rifle-reload',
    name: 'Flintlock Rifle - Reload',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'instinct',
    body:
      'Your Flintlock Rifle starts loaded with 2 Shots. Every use of the Flintlock Rifle - Shoot ability consumes one shot.\n\n' +
      'After you have used all 2 shots, you must use this Reload ability before you can Shoot again.',
  },

  /* ----- Portable Canon ----- */
  {
    id: 'portable-canon-shoot',
    name: 'Portable Canon - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 1,
    wp: null,
    stat: 'instinct',
    damage: ['Blunt'],
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 25 Meter (80 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'portable-canon-reload',
    name: 'Portable Canon - Reload',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    body:
      'Your Portable Canon starts loaded with 1 Shot. Every use of the Portable Canon - Shoot ability consumes one shot.\n\n' +
      'After you have used your 1 shot, you must use this Reload ability before you can Shoot again.',
  },

  /* ----- Wand ----- */
  {
    id: 'wand-shoot',
    name: 'Wand - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'mind',
    damage: ['Elemental'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'wand-imbue',
    name: 'Wand - Imbue',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Move'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    body:
      'Before a Wand can be used, you must use the Imbue ability to activate it for 3 turns.\n\n' +
      'When you Imbue the wand, choose an elemental damage type from Cold, Fire, or Lightning. Your wand deals damage of that chosen element.',
  },

  /* ----- Staff ----- */
  {
    id: 'staff-blast',
    name: 'Staff - Blast',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'mind',
    damage: ['Elemental'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + stat]] as {damage} damage.',
  },
  {
    id: 'staff-imbue',
    name: 'Staff - Imbue',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Move'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    body:
      'Before a Staff can be used, you must use the Imbue ability to activate it for 3 turns.\n\n' +
      'When you Imbue the staff, choose an elemental damage type from Cold, Fire, or Lightning. Your staff deals damage of that chosen element.',
  },

  /* ----- Claws & Teeth (natural) ----- */
  {
    id: 'claws-shred',
    name: 'Claws - Shred',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 1.5 Meter (5 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'teeth-bite',
    name: 'Teeth - Bite',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 1.5 Meter (5 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage and gain Shield equal to [[stat]].',
  },
];

/* -------------------------------------------------------------- the weapons */

/**
 * Weapon fields on top of the shared item fields (see items.js):
 *   abilities   — the two card ids the weapon teaches while it is held
 *   blurb       — the one-line description printed under its name
 *   enchants    — [{ id, spell? }] when the weapon carries enchantments
 *   enchantText — the sentence shown for that enchantment, with {{card links}}
 */
export const WEAPONS = [
  {
    id: 'bo-staff',
    name: 'Bo Staff',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Two-Handed'],
    blurb: 'A hardwood stave the length of a man, swung in wide arcs.',
    burden: 0,
    abilities: ['bo-staff-slam', 'bo-staff-swipe'],
  },
  {
    id: 'daggers',
    name: 'Daggers',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Paired'],
    blurb: 'A matched pair of short blades, quick in and quicker out.',
    burden: 0,
    abilities: ['daggers-strike', 'daggers-triple-strike'],
  },
  {
    id: 'one-handed',
    name: 'One-Handed Weapon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'One-Handed'],
    blurb: 'A sword, axe or mace — one hand on the grip, the other free.',
    burden: 0,
    abilities: ['one-handed-strike', 'one-handed-swift-strike'],
  },
  {
    id: 'two-handed',
    name: 'Two-Handed Weapon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Two-Handed'],
    blurb: 'A greatsword or maul that needs your whole body behind it.',
    burden: 0,
    abilities: ['two-handed-strike', 'two-handed-cleave'],
  },
  {
    id: 'shield-and-one-handed',
    name: 'Shield & One-Handed',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Shielded'],
    blurb: 'A blade in one hand, a wall of banded wood in the other.',
    burden: 0,
    abilities: ['shield-attack', 'shield-block'],
  },
  {
    id: 'whip',
    name: 'Whip',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Reach'],
    blurb: 'Braided leather that bites at fifteen feet and drags them closer.',
    burden: 0,
    abilities: ['whip-lash', 'whip-pull'],
  },
  {
    id: 'short-bow',
    name: 'Short Bow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Bow'],
    blurb: 'A hunting bow — light draw, fast nock, close work.',
    burden: 0,
    abilities: ['short-bow-shoot', 'short-bow-triple-shot'],
  },
  {
    id: 'longbow',
    name: 'Longbow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Bow'],
    blurb: 'A tall yew bow that reaches across the whole field.',
    burden: 0,
    abilities: ['longbow-shoot', 'longbow-aimed-shot'],
  },
  {
    id: 'greatbow',
    name: 'Greatbow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Bow'],
    blurb: 'A siege bow drawn on raw strength, firing bolts like spears.',
    burden: 0,
    abilities: ['greatbow-shoot', 'greatbow-piercing-shot'],
  },
  {
    id: 'flintlock-pistol',
    name: 'Flintlock Pistol',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Firearm'],
    blurb: 'Powder and shot in one hand. Three balls, then reload.',
    burden: 0,
    abilities: ['flintlock-pistol-shoot', 'flintlock-pistol-reload'],
  },
  {
    id: 'dual-pistols',
    name: 'Dual Pistols',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Firearm'],
    blurb: 'A pistol in each hand, two targets at once, six seconds of noise.',
    burden: 0,
    abilities: ['dual-pistols-shoot', 'dual-pistols-reload'],
  },
  {
    id: 'flintlock-rifle',
    name: 'Flintlock Rifle',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Firearm'],
    blurb: 'A long barrel and a slow reload for a shot that carries.',
    burden: 0,
    abilities: ['flintlock-rifle-shoot', 'flintlock-rifle-reload'],
  },
  {
    id: 'portable-canon',
    name: 'Portable Canon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Firearm'],
    blurb: 'A hand-braced cannon. One shot, and everything after it is ringing.',
    burden: 0,
    abilities: ['portable-canon-shoot', 'portable-canon-reload'],
  },
  {
    id: 'wand',
    name: 'Wand',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Focus'],
    blurb: 'A focus of carved rowan, imbued with an element before it will fire.',
    burden: 0,
    abilities: ['wand-shoot', 'wand-imbue'],
  },
  {
    id: 'staff',
    name: 'Staff',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Focus'],
    blurb: 'A caster’s stave — slower than a wand, and far louder.',
    burden: 0,
    abilities: ['staff-blast', 'staff-imbue'],
  },
  {
    id: 'claws-and-teeth',
    name: 'Claws & Teeth',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Natural'],
    // Born with, not bought — no shop stocks it and no starting kit issues it.
    natural: true,
    blurb: 'What you were born with, when nothing else is left in your hands.',
    burden: 0,
    abilities: ['claws-shred', 'teeth-bite'],
  },

  /* ----- enchanted weapons ----- */
  {
    id: 'cold-infused-sword',
    name: 'Cold-Infused Sword',
    slots: ['main_hand', 'off_hand'],
    tags: ['Uncommon', 'Melee Weapon', 'One-Handed'],
    blurb: 'A one-handed sword whose edge never stops shedding frost.',
    burden: 0,
    abilities: ['one-handed-strike', 'one-handed-swift-strike'],
    enchants: [{ id: 'cold-infusion' }],
    enchantText: 'This blade is enchanted with {{Cold Infusion}}.',
    lore:
      'Guild-forged in a cold house under the aether works, where the quenching trough is kept at a temperature no smith will name.\n\n' +
      'The blade sweats frost in any weather. Sheathed too long it welds itself shut, and every owner learns to draw it once an hour whether or not there is anything to cut.',
  },
  {
    id: 'imbued-flintlock-pistol',
    name: 'Imbued Flintlock Pistol',
    slots: ['main_hand', 'off_hand'],
    tags: ['Uncommon', 'Ranged Weapon', 'Firearm'],
    blurb: 'A pistol with green vines chased along the barrel.',
    burden: 0,
    abilities: ['flintlock-pistol-shoot', 'flintlock-pistol-reload'],
    enchants: [{ id: 'novice-imbuement', spell: 'bramble-whip' }],
    enchantText: 'This pistol carries a {{Novice Imbuement}}, letting its wielder cast {{Bramble Whip}}.',
    lore:
      'Hedge-work, not guild-work: the vines were grown into the barrel rather than chased onto it, and they are still alive.\n\n' +
      'The spell bound inside answers once, then sulks until its bearer has slept.',
  },
  {
    id: 'grave-lantern-blade',
    name: 'Grave-Lantern Blade',
    slots: ['main_hand', 'off_hand'],
    tags: ['Rare', 'Melee Weapon', 'One-Handed'],
    blurb: 'A pitted sword that burns green along the fuller and rots what it cuts.',
    burden: 0,
    abilities: ['one-handed-strike', 'one-handed-swift-strike'],
    enchants: [{ id: 'decay-infusion' }, { id: 'luminescence' }, { id: 'novice-imbuement', spell: 'pack-bond' }],
    enchantText:
      'Three workings share this blade: {{Decay Infusion}} in the edge, {{Luminescence}} in the fuller, and an imbuement holding {{Pack Bond}}.',
    lore:
      'Carried by the lantern-bearers who walked the plague roads out of Ashfen, where a light that could be shut off mattered more than a light that was bright.\n\n' +
      'Three enchantments on one blade is one more than most smiths will lay, and the seams show it: the steel is pitted where the workings meet, and it drinks Magic Burden like a much larger weapon.',
  },
];

/* ------------------------------------------------------------------ lookups */

/**
 * Every card the codex knows — weapon abilities, spells, enchantments, the one
 * card each belt item teaches, and everything the talent tracks and lineages
 * hand out. This
 * is the registry every `{{link}}` and every `getCard` call resolves against,
 * so anything printable has to be in it.
 */
export const CARDS = [
  ...WEAPON_ABILITIES,
  ...SPELLS,
  ...ENCHANTMENTS,
  ...UTILITY_CARDS,
  ...TALENT_CARDS,
  /* A Cauldron Keeper's Ingredients. Not talent cards: a rank does not hand them
     over, it opens a tier of them, and what a Brew is made of is chosen at the
     moment it is mixed. See brews.js. */
  ...INGREDIENTS,
  ...LINEAGE_CARDS,
  ...BACKGROUND_CARDS,
  ...ACTION_CARDS,
  ...BASIC_ACTIONS,
];

const CARD_BY_ID = new Map(CARDS.map((card) => [card.id, card]));
const CARD_BY_NAME = new Map(CARDS.map((card) => [card.name.toLowerCase(), card]));
const ENCHANT_BY_ID = new Map(ENCHANTMENTS.map((entry) => [entry.id, entry]));

/** A card by id or by printed name — `{{Cold Infusion}}` links resolve here. */
export function getCard(key) {
  if (!key) return null;
  return CARD_BY_ID.get(key) ?? CARD_BY_NAME.get(String(key).toLowerCase()) ?? null;
}

export function getEnchantment(id) {
  return id ? ENCHANT_BY_ID.get(id) ?? null : null;
}

/** What has been laid on an item: the enchantment record plus its own entry. */
export function itemEnchantments(item) {
  return (item?.enchants ?? [])
    .map((entry) => ({ ...entry, enchantment: getEnchantment(entry.id) }))
    .filter((entry) => entry.enchantment);
}

/**
 * What the item does to the cards it teaches. A weapon's own damage type is
 * whatever the last infusion turned it into, and every Empowering enchantment
 * stacks another die category on top.
 */
export function itemModifiers(item) {
  let damage = null;
  let empower = 0;

  for (const { enchantment } of itemEnchantments(item)) {
    if (enchantment.damageType) damage = enchantment.damageType;
    empower += Number(enchantment.empower) || 0;
  }

  return { damage, empower };
}

/** The cards an item teaches while it is equipped, plus any spell it carries. */
export function cardsForItem(item) {
  const cards = (item?.abilities ?? []).map(getCard).filter(Boolean);
  const spells = itemEnchantments(item)
    .map((entry) => getCard(entry.spell))
    .filter(Boolean);
  return [...cards, ...spells];
}

