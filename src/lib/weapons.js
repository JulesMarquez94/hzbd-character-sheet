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

import { withArt } from './cardArt.js';
import { SPELLS } from './spells.js';
import { MARTIAL_MOVES } from './martial.js';
import { ENCHANTMENTS, getEnchantment } from './enchantments.js';
import { INGREDIENTS } from './ingredients.js';
import { UTILITY_CARDS } from './utility.js';
import { TALENT_CARDS } from './talents.js';
import { LINEAGE_CARDS } from './lineages.js';
import { BACKGROUND_CARDS } from './backgrounds.js';
import { BASIC_ACTIONS } from './actions.js';

/* ------------------------------------------------------------- enchantments */

/**
 * An enchantment is a passive card, a price tag, and — where it changes what the
 * wielder is or how their weapon hits — a rider that something reads:
 *
 *   burden      Magic Burden it adds to whatever carries it
 *   cost        price in coin
 *   damageType  replaces the weapon's own damage type
 *   empower     steps every damage die up a category (d6 -> d8), capped at d12
 *   spell       true when the item names the spell it carries
 *   attributes  what it adds to the wielder's own three
 *   healthMax   flat maximum Health it adds to them
 *
 * An item lists what has been laid on it in `enchants: [{ id, spell? }]`.
 *
 * **The codex itself moved to enchantments.js**, a leaf, when the Enchanter
 * arrived: the whole shelf of thirteen is needed by a set that lays them, and
 * needed without pulling this registry in behind it. Re-exported from here
 * because this is where the codex's enchantments have always been imported from,
 * and folded into CARDS below exactly as before.
 */
export { ENCHANTMENTS };

/* -------------------------------------------------------------------- spells */

/* Spells live in their own leaf module so the landing page can reach one
   without pulling the whole codex in behind it. Imported rather than
   re-exported straight through, because CARDS below folds them in, and
   re-exported because this file has always been where the codex's spells are
   imported from. */
export { SPELLS };

/* ------------------------------------------------------------ martial moves */

/* And the Martial Moves, for the same reason and on the same terms. A move is
   what a Guardian's SHIELD EXPERTISE and a Duelist's DEXTEROUS hand over a
   *choice* of, so the pool has to be reachable by loadouts.js and by moves.js
   without this registry behind it. See martial.js. */
export { MARTIAL_MOVES };

/* ------------------------------------------------------------ basic actions */

/**
 * Things every character can do, whatever they are holding. They are cards for
 * the same reason a weapon's attacks are: the sheet asks what a use costs and
 * then shows the card, so the reader never has to be told what they just spent
 * points on.
 */
export const ACTION_CARDS = withArt([
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
]);

/* ------------------------------------------------------------ weapon cards */

/**
 * Every weapon teaches two cards: the plain attack it makes, and the special
 * move that costs more (and usually Willpower) to pull off.
 */
export const WEAPON_ABILITIES = withArt([
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

  /* ----- Trident -----
   * The Bo Staff's two moves with the damage type changed, which is the whole of
   * what a trident is: Jules put it as "a bo staff with sharp damage" on
   * 2026-08-20. Same reach, same points, same Willpower on the sweep — the prongs
   * only change what the hit is made of.
   *
   * Its own cards rather than the staff's, because the type is on the card and not
   * on the item. Reusing bo-staff-slam would have printed Blunt on a trident, and
   * an infusion on the trident would have changed what every bo staff in the game
   * deals. Slam is Impale here, since the thing now has a point on the end.
   */
  {
    id: 'trident-impale',
    name: 'Trident - Impale',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 3 Meter (10 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'trident-swipe',
    name: 'Trident - Swipe',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
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
      'When you Imbue the wand, choose an elemental damage type from Cold, Fire or Lightning. Your wand deals damage of that chosen element.',
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
      'When you Imbue the staff, choose an elemental damage type from Cold, Fire or Lightning. Your staff deals damage of that chosen element.',
  },

  /* ----- Colossal (house-written) -----
   * A weapon category rather than a weapon, asked for on the Colossus set's
   * `Developpement Notes` tab and built with it, because two of that set's seven
   * cards name it and would otherwise point at nothing: GIANT SLAYER grants
   * advantage "when you attack with a Colossal Weapon" and COLOSSAL GRIP takes an
   * Action Point off the same.
   *
   * What the tab settled and what was left here, in its own words: "Make a new
   * category of weapon that is called colosal weapon that uses physique, they cost
   * 5 actoin point to use normal. There is a bow, two-hand, Polearm. The bow as
   * peircing shot that can hit multiple enemy in a line as long as it keep beating
   * the reflex of poel as special attack, two-hand special attack is cleave and
   * polearm is a hit that also push. Polearm as more range. Then also make athe
   * colosal paired two-hand which as a 6 Action point attack were you attack with
   * both weapon at the same time. The special move is wirwind were you hit
   * everyone around you."
   *
   * So the category, the attribute, the four weapons, both costs and all four
   * special attacks are the designer's. **The dice, the reaches and the push are
   * house-written**, off the scale the rest of this file already keeps: 2 Action
   * Points buys 1d6 + stat, 3 buys 2d6 + stat and 4 buys 2d6 + 2*stat, so 5 buys
   * one more die. Every number invented here is listed in data/README.md, which is
   * what to overwrite when a sheet arrives for them.
   *
   * `stat: 'physique'` on all eight, which is the one line of the tab that is not
   * a shape: a Colossal weapon is swung on the body holding it and on nothing else.
   */
  {
    id: 'colossal-two-handed-strike',
    name: 'Colossal Two-Handed - Strike',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 5,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 3 Meter (10 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'colossal-two-handed-cleave',
    name: 'Colossal Two-Handed - Cleave',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    /* The two-hander's own Cleave, one die heavier and the same arc: the tab says
       "two-hand special attack is cleave" and the codex already knows what that
       word means. */
    body:
      'Make a {stat} Melee Attack {roll} against all entities within 4.5 Meter (15 Feet) in front of you.\n\n' +
      'On a hit, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'colossal-polearm-thrust',
    name: 'Colossal Polearm - Thrust',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 5,
    wp: null,
    stat: 'physique',
    damage: ['Sharp'],
    /* "Polearm as more range", and the reach is the whole of what it buys: 4.5
       Meter on the plain attack where every other Colossal melee weapon reaches 3.
       Same dice, so the choice between this and the two-hander is a step of
       distance against an arc. */
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 4.5 Meter (15 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'colossal-polearm-drive',
    name: 'Colossal Polearm - Drive',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp'],
    /* "Polearm is a hit that also push". The distance is house-written and the
       shove is the plain one the glossary already describes, so nothing new is
       invented for a target to be in. */
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 4.5 Meter (15 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + 2*stat]] as {damage} damage and push the target 3 Meter (10 Feet) directly away from you.',
  },
  {
    id: 'colossal-bow-shoot',
    name: 'Colossal Bow - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 5,
    wp: null,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 30 Meter (100 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'colossal-bow-piercing-shot',
    name: 'Colossal Bow - Piercing Shot',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp'],
    /* "The bow as peircing shot that can hit multiple enemy in a line as long as it
       keep beating the reflex of poel", which is {{Greatbow - Piercing Shot}} with
       a condition on how far down the line it carries. One roll and not two: the
       first entity is a Weapon Attack against Defense, and the same number is then
       held against each Reflex behind it, so a shot that runs out of force stops
       where it stopped rather than being rerolled into a second chance. */
    body:
      'Make a {stat} Ranged Attack {roll} against the nearest entity in a line within 30 Meter (100 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + 2*stat]] as {damage} damage, and the shot carries on behind it.\n\n' +
      'Hold that same roll against the **Reflex** of each entity further down the line in turn. It deals the same damage to every one it beats and stops at the first one it does not.',
  },
  {
    id: 'paired-colossal-strike',
    name: 'Paired Colossal - Double Strike',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 6,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    /* Six Action Points is the whole ceiling, and the tab put it there on purpose:
       "a 6 Action point attack were you attack with both weapon at the same time".
       One target and two rolls, the shape {{Daggers - Triple Strike}} already
       prints, because both weapons are landing in the same place. */
    body:
      'Make two {stat} Melee Attack {roll} against an entity within 3 Meter (10 Feet) of you.\n\n' +
      'For each hit, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'paired-colossal-whirlwind',
    name: 'Paired Colossal - Whirlwind',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 6,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    /* "The special move is wirwind were you hit everyone around you", so it is the
       Bo Staff's Swipe at Colossal weight: everything within reach rather than an
       arc in front of you. */
    body:
      'Make a {stat} Melee Attack {roll} against all entities within 3 Meter (10 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + 2*stat]] as {damage} damage.',
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

  /* ----- the ten types the roster was missing, 2026-08-24 -----
   * Off the conversion pass over data/Source Temp/. Six of the ten were named in
   * the old weapon lists and never built (Polearm, Spear, Great Shield, Crossbow,
   * Hand Crossbow, Tome of Incantations); three are the Thrown class, which was
   * the only old weapon class with no descendant here at all (Javelins, Throwing
   * Hatchets, Sling); and Paired One-Handed Weapons mirrors Paired Colossal,
   * which was already built without its ordinary-sized twin.
   *
   * Every number below was priced off the scaling the other 35 cards already use,
   * read back off them rather than invented:
   *
   *   light             1d6 + stat        1 to 2 AP    instinct
   *   standard          2d6 + stat        1 to 3 AP    instinct
   *   heavy two-handed  2d6 + 2*stat      3 to 4 AP    physique
   *   concentrated      3d6 + stat        2 to 4 AP    mind or instinct
   *   colossal          3d6 + 2*stat      5 to 6 AP    physique
   *
   * A Special Weapon Attack costs 1 Willpower and 0 to 1 AP over the plain one. A
   * Reload costs no Willpower and its AP scales with the shots it restores: the
   * pistol restores 3 for 3, the rifle 2 for 4, the canon 1 for 3.
   *
   * Three of these were wrong on the first pass and are corrected here. The Hand
   * Crossbow shot for 1 AP and reloaded for 2, which beat the Flintlock Pistol on
   * every axis; it is on the rifle's rate now. Paired Flurry cost 5 AP and a
   * Willpower for what a One-Handed Weapon does in 5 AP and no Willpower. And the
   * Great Shield's block cost what the ordinary shield's does for nearly twice
   * the reduction.
   */

  /* ----- Polearm ----- */
  {
    id: 'polearm-thrust',
    name: 'Polearm - Thrust',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 4.5 Meter (15 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'polearm-sweep',
    name: 'Polearm - Sweep',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Melee Attack {roll} against all entities in a line within 4.5 Meter (15 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },

  /* ----- Spear -----
   * The one weapon here that is both melee and thrown, so it teaches a melee
   * attack and a ranged special. Throw is a Special Weapon Attack rather than a
   * Weapon Attack because it costs the weapon: the spear is on the floor
   * afterward, which is prose the table plays the way a placed totem would be.
   */
  {
    id: 'spear-thrust',
    name: 'Spear - Thrust',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 3 Meter (10 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'spear-throw',
    name: 'Spear - Throw',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.\n\n' +
      'The spear leaves your hand and lands where the throw ended.',
  },

  /* ----- Paired One-Handed Weapons -----
   * Daggers are the light pair at 1d6; this is the standard one at 2d6. Flurry is
   * 4 AP and a Willpower for two hits, against the 5 AP a One-Handed Weapon spends
   * on a Strike and a Swift Strike for the same total. So the Willpower buys an
   * Action Point, which is what a special is for.
   */
  {
    id: 'paired-one-handed-strike',
    name: 'Paired One-Handed Weapons - Strike',
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
    id: 'paired-one-handed-flurry',
    name: 'Paired One-Handed Weapons - Flurry',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make two {stat} Melee Attacks {roll} against entities within 1.5 Meter (5 Feet) of you. You may send both at one entity or split them.\n\n' +
      'On a hit, each deals [[2d6 + stat]] as {damage} damage.',
  },

  /* ----- Great Shield -----
   * Wall is the only card added here that reaches another sheet, and the second
   * sentence is the part that does. It is the same shape as the Guardian's
   * INTERCEPT, so it is not a new idea, but cut that sentence and the card still
   * works if reaching across turns out to be a problem.
   */
  {
    id: 'great-shield-bash',
    name: 'Great Shield - Bash',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'physique',
    damage: ['Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 1.5 Meter (5 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage and push the target 1.5 meters (5 Feet) away from you.',
  },
  {
    id: 'great-shield-wall',
    name: 'Great Shield - Wall',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Move'],
    ap: 2,
    wp: 1,
    stat: 'physique',
    damage: [],
    body:
      'You set the shield and hold it, reducing the damage from the next attack that hits you by [[3d6 + 2*stat]].\n\n' +
      'While you hold it, an allied entity directly behind you reduces the damage of the next attack that hits it by the same amount.',
  },

  /* ----- Crossbow -----
   * Both of these spend their special slot on the Reload, the way every firearm
   * does, which is why the shot itself is the biggest single hit outside the
   * Colossal class. The Crossbow holds one and restores it for 3 AP, the canon's
   * rate. The Hand Crossbow holds two and restores them for 4, the rifle's.
   */
  {
    id: 'crossbow-shoot',
    name: 'Crossbow - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 30 Meter (100 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + stat]] as {damage} damage.',
  },
  {
    id: 'crossbow-reload',
    name: 'Crossbow - Reload',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: [],
    body:
      'Your Crossbow starts loaded with 1 Shot. Every use of the Crossbow - Shoot ability consumes one shot.\n\n' +
      'After you have used the shot, you must use this Reload ability before you can Shoot again.',
  },
  {
    id: 'hand-crossbow-shoot',
    name: 'Hand Crossbow - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 25 Meter (80 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'hand-crossbow-reload',
    name: 'Hand Crossbow - Reload',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'instinct',
    damage: [],
    body:
      'Your Hand Crossbow starts loaded with 2 Shots. Every use of the Hand Crossbow - Shoot ability consumes one shot.\n\n' +
      'After you have used all 2 shots, you must use this Reload ability to reload all shots before you can Shoot again.',
  },

  /* ----- the Thrown class -----
   * Javelins throw for 3 AP where the Greatbow pays 4 for the same damage, and
   * buy that Action Point with range: 18 meters against 30, and the weapon is on
   * the floor afterward. Hatchets are the light pair, and the Sling is the
   * lightest weapon in the game at 0.2 kg and reads like it.
   *
   * All three say the weapon leaves your hand and none of them says what happens
   * next, because nothing here tracks where a thrown javelin landed. The
   * Skirmisher set answers it for a Skirmisher; for anybody else it is the table's.
   */
  {
    id: 'javelin-throw',
    name: 'Javelins - Throw',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.\n\n' +
      'The javelin leaves your hand and lands where the throw ended.',
  },
  {
    id: 'javelin-volley',
    name: 'Javelins - Volley',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make three {stat} Ranged Attacks {roll} against entities within 18 Meter (60 Feet) of you. You may send them at one entity or split them.\n\n' +
      'On a hit, each deals [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'hatchet-throw',
    name: 'Throwing Hatchets - Throw',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.\n\n' +
      'The hatchet leaves your hand and lands where the throw ended.',
  },
  {
    id: 'hatchet-double-throw',
    name: 'Throwing Hatchets - Double Throw',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make two {stat} Ranged Attacks {roll} against entities within 18 Meter (60 Feet) of you. You may send both at one entity or split them.\n\n' +
      'On a hit, each deals [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'sling-shot',
    name: 'Sling - Shot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Blunt'],
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 25 Meter (80 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'sling-whirl',
    name: 'Sling - Whirl',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Blunt'],
    body:
      'You whirl the sling until the stone is going faster than it should.\n\n' +
      'Make an {stat} Ranged Attack {roll} against an entity within 35 Meter (115 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },

  /* ----- Tome of Incantations -----
   * The Incant the old weapon lists named twice and nobody built. A Focus like
   * the Wand and the Staff, and Inscribe is their Imbue: the same card with a
   * longer hold, 5 turns against 3, which is what both hands on it buys.
   *
   * Against the Staff it is the same 4 AP for 2d6 + 2*stat rather than 3d6 + stat.
   * So the Staff has the higher floor and the Tome scales with Mind, and they
   * cross at about Mind 4.
   */
  {
    id: 'tome-recite',
    name: 'Tome of Incantations - Recite',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'mind',
    damage: ['Elemental'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'tome-inscribe',
    name: 'Tome of Incantations - Inscribe',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Move'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    damage: [],
    body:
      'Before a Tome of Incantations can be used, you must use the Inscribe ability to activate it for 5 turns.\n\n' +
      'When you Inscribe the tome, choose an elemental damage type from Cold, Fire or Lightning. Your tome deals damage of that chosen element.',
  },
]);

/* -------------------------------------------------------------- the weapons */

/**
 * Weapon fields on top of the shared item fields (see items.js):
 *   abilities   — the two card ids the weapon teaches while it is held
 *   blurb       — the one-line description printed under its name
 *   enchants    — [{ id, spell? }] when the weapon carries enchantments
 *   enchantText — the sentence shown for that enchantment, with {{card links}}
 *
 * **Every weapon costs 4000 coins**, on Jules's rule of 2026-08-22, and the five
 * enchanted ones say 4000 here like the rest: what is worked into a piece is
 * priced off its Magic Burden by `itemCost` in items.js, so a Deep Sea Trident is
 * 17,000 without a second number to keep in step. `weight` is the only field that
 * tells one weapon from another here, and it is kilograms.
 */
export const WEAPONS = [
  {
    id: 'bo-staff',
    name: 'Bo Staff',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Two-Handed'],
    blurb: 'A hardwood stave the length of a man, swung in wide arcs.',
    burden: 0,
    weight: 1.8,
    cost: 4000,
    abilities: ['bo-staff-slam', 'bo-staff-swipe'],
  },
  {
    id: 'trident',
    name: 'Trident',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Two-Handed'],
    blurb: 'A three-pronged fishing spear, held like a stave and used like one.',
    burden: 0,
    weight: 2.5,
    cost: 4000,
    abilities: ['trident-impale', 'trident-swipe'],
  },
  {
    id: 'daggers',
    name: 'Daggers',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Paired'],
    blurb: 'A matched pair of short blades, quick in and quicker out.',
    burden: 0,
    weight: 1.2,
    cost: 4000,
    abilities: ['daggers-strike', 'daggers-triple-strike'],
  },
  {
    id: 'one-handed',
    name: 'One-Handed Weapon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'One-Handed'],
    blurb: 'A sword, axe or mace: one hand on the grip, the other free.',
    burden: 0,
    weight: 1.5,
    cost: 4000,
    abilities: ['one-handed-strike', 'one-handed-swift-strike'],
  },
  {
    id: 'two-handed',
    name: 'Two-Handed Weapon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Two-Handed'],
    blurb: 'A greatsword or maul that needs your whole body behind it.',
    burden: 0,
    weight: 3.5,
    cost: 4000,
    abilities: ['two-handed-strike', 'two-handed-cleave'],
  },
  {
    id: 'shield-and-one-handed',
    name: 'Shield & One-Handed',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Shielded'],
    blurb: 'A blade in one hand, a wall of banded wood in the other.',
    burden: 0,
    weight: 6,
    cost: 4000,
    abilities: ['shield-attack', 'shield-block'],
  },
  {
    id: 'whip',
    name: 'Whip',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Reach'],
    blurb: 'Braided leather that bites at fifteen feet and drags them closer.',
    burden: 0,
    weight: 1.2,
    cost: 4000,
    abilities: ['whip-lash', 'whip-pull'],
  },
  {
    id: 'short-bow',
    name: 'Short Bow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Bow'],
    blurb: 'A hunting bow: light draw, fast nock, close work.',
    burden: 0,
    weight: 1,
    cost: 4000,
    abilities: ['short-bow-shoot', 'short-bow-triple-shot'],
  },
  {
    id: 'longbow',
    name: 'Longbow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Bow'],
    blurb: 'A tall yew bow that reaches across the whole field.',
    burden: 0,
    weight: 1.5,
    cost: 4000,
    abilities: ['longbow-shoot', 'longbow-aimed-shot'],
  },
  {
    id: 'greatbow',
    name: 'Greatbow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Bow'],
    blurb: 'A siege bow drawn on raw strength, firing bolts like spears.',
    burden: 0,
    weight: 3.5,
    cost: 4000,
    abilities: ['greatbow-shoot', 'greatbow-piercing-shot'],
  },
  {
    id: 'flintlock-pistol',
    name: 'Flintlock Pistol',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Firearm'],
    blurb: 'Powder and shot in one hand. Three balls, then reload.',
    burden: 0,
    weight: 1.5,
    cost: 4000,
    abilities: ['flintlock-pistol-shoot', 'flintlock-pistol-reload'],
  },
  {
    id: 'dual-pistols',
    name: 'Dual Pistols',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Firearm'],
    blurb: 'A pistol in each hand, two targets at once, six seconds of noise.',
    burden: 0,
    weight: 3,
    cost: 4000,
    abilities: ['dual-pistols-shoot', 'dual-pistols-reload'],
  },
  {
    id: 'flintlock-rifle',
    name: 'Flintlock Rifle',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Firearm'],
    blurb: 'A long barrel and a slow reload for a shot that carries.',
    burden: 0,
    weight: 4.5,
    cost: 4000,
    abilities: ['flintlock-rifle-shoot', 'flintlock-rifle-reload'],
  },
  {
    id: 'portable-canon',
    name: 'Portable Canon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Firearm'],
    blurb: 'A hand-braced cannon. One shot, and everything after it is ringing.',
    burden: 0,
    weight: 12,
    cost: 4000,
    abilities: ['portable-canon-shoot', 'portable-canon-reload'],
  },
  {
    id: 'wand',
    name: 'Wand',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Focus'],
    blurb: 'A focus of carved rowan, imbued with an element before it will fire.',
    burden: 0,
    weight: 0.3,
    cost: 4000,
    abilities: ['wand-shoot', 'wand-imbue'],
  },
  {
    id: 'staff',
    name: 'Staff',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Focus'],
    blurb: 'A caster’s stave: slower than a wand, and far louder.',
    burden: 0,
    weight: 1.6,
    cost: 4000,
    abilities: ['staff-blast', 'staff-imbue'],
  },
  /* ----- Colossal -----
   * The four weapons the Colossus set's notes tab asked for. See the block of the
   * same name in WEAPON_ABILITIES above for what that tab settled and what was
   * house-written.
   *
   * `Colossal` is the tag GIANT SLAYER and COLOSSAL GRIP read, and it is a second
   * tag rather than a category of its own: three of the four are still held in two
   * hands, so they carry `Two-Handed` as well and everything a set hangs on that
   * tag reaches them. That is the reading the Colossus is built on, since its own
   * MARTIAL TRAINING lets Martial Moves be used "with Two-Handed Weapons" and
   * COLOSSAL GRIP calls the paired one "Paired Two-Handed Colossal Weapons" in the
   * same breath. The bow is not a melee weapon and the Greatbow beside it carries
   * no `Two-Handed` either, so it stays `Bow`.
   *
   * **The weights are house-written**, and they are the cost the Action Points do
   * not charge: a starting Physique of 4 carries 20 kg, so a Colossal weapon is a
   * quarter of everything you can lift and the paired pair is most of it. That is
   * the trade the set is about, and the carry ceiling is one a character is
   * allowed to cross.
   */
  {
    id: 'colossal-two-handed',
    name: 'Colossal Two-Handed Weapon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Colossal', 'Two-Handed'],
    blurb: 'A greatsword built at siege scale, swung once and meant once.',
    burden: 0,
    weight: 8,
    cost: 4000,
    abilities: ['colossal-two-handed-strike', 'colossal-two-handed-cleave'],
  },
  {
    id: 'colossal-polearm',
    name: 'Colossal Polearm',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Colossal', 'Two-Handed'],
    blurb: 'A wall-breaker on a haft, and it reaches the rank behind the one it hit.',
    burden: 0,
    weight: 7,
    cost: 4000,
    abilities: ['colossal-polearm-thrust', 'colossal-polearm-drive'],
  },
  {
    id: 'colossal-bow',
    name: 'Colossal Bow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Colossal', 'Bow'],
    blurb: 'A bow braced against the ground and drawn on the whole body.',
    burden: 0,
    weight: 6,
    cost: 4000,
    abilities: ['colossal-bow-shoot', 'colossal-bow-piercing-shot'],
  },
  {
    id: 'paired-colossal',
    name: 'Paired Colossal Weapons',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Colossal', 'Two-Handed', 'Paired'],
    blurb: 'Two of them, one in each hand, and nothing left over for a shield.',
    burden: 0,
    weight: 16,
    cost: 4000,
    abilities: ['paired-colossal-strike', 'paired-colossal-whirlwind'],
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
    weight: 0,
    cost: 0,
    abilities: ['claws-shred', 'teeth-bite'],
  },

  /* ----- the ten missing types, 2026-08-24 -----
   * See the block of the same name in WEAPON_ABILITIES above for where these came
   * from and how every number was priced.
   *
   * **Two new tag values, and only two**: `Crossbow` and `Thrown`. Everything else
   * reuses a tag the wall already knows, which is deliberate — a tag here is what
   * a talent set matches on (`weaponRiders` in moves.js does a plain membership
   * check), so a new tag value is a new thing for a set to fail to cover.
   *
   * **Three tags left off on purpose**, because carrying them would have quietly
   * handed an existing set a weapon it was never written for:
   *
   *   Spear has no `One-Handed`. The Whip does not carry it either, though a whip
   *   is swung one-handed, so on this wall a reach weapon carries `Reach` and
   *   stops there. Adding it would have given a Duelist a spear that reaches 3
   *   meters and can be thrown, on top of everything DEXTEROUS already gives.
   *
   *   Great Shield has no `Two-Handed`, matching Shield & One-Handed, which
   *   carries `Shielded` alone. Adding it would have made this the only weapon in
   *   the codex satisfying two sets' `weapon` tags at once, and a Colossus with a
   *   shield is not a thing anybody has ruled on.
   *
   *   Tome of Incantations has no `Two-Handed`, matching the Staff. Same reason:
   *   COLOSSAL FORCE would have started Elevating a spellbook.
   *
   * Polearm *does* carry `Two-Handed`, because Colossal Polearm already does and
   * the ordinary one should read the same. That is the one new weapon an existing
   * set reaches, and it is the Colossus reaching a polearm, which is right.
   *
   * No `natural: true` on any of them, and no art: nothing here has a picture yet,
   * which is the same state every other weapon on this wall is in.
   */
  {
    id: 'polearm',
    name: 'Polearm',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Two-Handed', 'Reach'],
    blurb: 'A halberd or glaive, held at the far end, hitting things that have not arrived yet.',
    burden: 0,
    weight: 3,
    cost: 4000,
    abilities: ['polearm-thrust', 'polearm-sweep'],
  },
  {
    id: 'spear',
    name: 'Spear',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Reach', 'Thrown'],
    blurb: 'A long shaft with a point on it, kept between you and the trouble, or sent at it.',
    burden: 0,
    weight: 2,
    cost: 4000,
    abilities: ['spear-thrust', 'spear-throw'],
  },
  {
    id: 'paired-one-handed',
    name: 'Paired One-Handed Weapons',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Paired'],
    blurb: 'A full weapon in each hand, and nothing spare to catch anything with.',
    burden: 0,
    weight: 3,
    cost: 4000,
    abilities: ['paired-one-handed-strike', 'paired-one-handed-flurry'],
  },
  {
    id: 'great-shield',
    name: 'Great Shield',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Shielded'],
    blurb: 'A door with a handle, and both hands are on it.',
    burden: 0,
    weight: 12,
    cost: 4000,
    abilities: ['great-shield-bash', 'great-shield-wall'],
  },
  {
    id: 'crossbow',
    name: 'Crossbow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Crossbow'],
    blurb: 'Wound tight, held loaded and spent all at once.',
    burden: 0,
    weight: 4,
    cost: 4000,
    abilities: ['crossbow-shoot', 'crossbow-reload'],
  },
  {
    id: 'hand-crossbow',
    name: 'Hand Crossbow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Crossbow'],
    blurb: 'Small enough for one hand, and quiet enough that the first anyone knows is the bolt.',
    burden: 0,
    weight: 1.5,
    cost: 4000,
    abilities: ['hand-crossbow-shoot', 'hand-crossbow-reload'],
  },
  {
    id: 'javelins',
    name: 'Javelins',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Thrown'],
    blurb: 'A bundle of iron-tipped shafts, and each one is meant to be left behind.',
    burden: 0,
    weight: 2.4,
    cost: 4000,
    abilities: ['javelin-throw', 'javelin-volley'],
  },
  {
    id: 'throwing-hatchets',
    name: 'Throwing Hatchets',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Thrown', 'Paired'],
    blurb: 'Short-hafted axes balanced to turn once and stop.',
    burden: 0,
    weight: 1.6,
    cost: 4000,
    abilities: ['hatchet-throw', 'hatchet-double-throw'],
  },
  {
    id: 'sling',
    name: 'Sling',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Thrown'],
    blurb: 'A strap and a stone, which is all it has ever needed to be.',
    burden: 0,
    weight: 0.2,
    cost: 4000,
    abilities: ['sling-shot', 'sling-whirl'],
  },
  {
    id: 'tome-of-incantations',
    name: 'Tome of Incantations',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Focus'],
    blurb: 'A clasped book read aloud from, held open on the forearm.',
    burden: 0,
    weight: 2.2,
    cost: 4000,
    abilities: ['tome-recite', 'tome-inscribe'],
  },

  /* ----- enchanted weapons ----- */
  {
    id: 'cold-infused-sword',
    name: 'Cold-Infused Sword',
    slots: ['main_hand', 'off_hand'],
    tags: ['Uncommon', 'Melee Weapon', 'One-Handed'],
    blurb: 'A one-handed sword whose edge never stops shedding frost.',
    burden: 0,
    weight: 1.5,
    cost: 4000,
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
    weight: 1.5,
    cost: 4000,
    abilities: ['flintlock-pistol-shoot', 'flintlock-pistol-reload'],
    enchants: [{ id: 'novice-imbuement', spell: 'bramble-whip' }],
    enchantText: 'This pistol carries a {{Novice Imbuement}}, letting its wielder cast {{Bramble Whip}}.',
    lore:
      'Hedge-work, not guild-work: the vines were grown into the barrel rather than chased onto it, and they are still alive.\n\n' +
      'The spell bound inside answers once, then sulks until its bearer has slept.',
  },
  {
    /* Jules's, named by them on 2026-08-20: "an enchanted one-hand sword called
       Patien with that enchantment, making it rare." The enchantment is PREPARED,
       which is where the name comes from — the blade is the waiting, not the
       swing. It teaches the plain one-handed cards and changes nothing about how
       it hits; what it changes is what its wielder brings to the bell. */
    id: 'patien',
    name: 'Patien',
    slots: ['main_hand', 'off_hand'],
    tags: ['Rare', 'Melee Weapon', 'One-Handed'],
    blurb: 'A plain one-handed sword that never seems to be caught off guard.',
    burden: 0,
    weight: 1.5,
    cost: 4000,
    abilities: ['one-handed-strike', 'one-handed-swift-strike'],
    enchants: [{ id: 'prepared' }],
    enchantText: 'This blade is enchanted with {{Prepared}}.',
    lore:
      'Its maker is not recorded and its edge is unremarkable. What is remarkable is that nobody carrying it has ever been the last to move.\n\n' +
      'Duellists call the feeling the half-second, and swear the blade is already turning before they have decided to turn it. The guild examiners who took one apart found nothing in the steel and wrote it up as temperament.',
  },
  {
    /* The trident Deep Sea Accretion lives on, and the only thing in the codex
       carrying a Unique Imbuement. Epic rather than Rare: Grave-Lantern Blade is
       Rare with three ordinary workings, and this holds a spell no shelf stocks.

       **Two workings, and the codex names them separately.** Cold Infusion turns
       the prongs' Sharp into Cold, which is the trident's own two cards. The
       imbuement's spell is dealt without the item's modifiers on purpose (see
       gearSource in abilitySources.js), so Deep Sea Accretion's Ice Spikes stay
       Sharp: the infusion changes what the weapon hits for, not what a spell cast
       through it hits for.

       Named here rather than by Jules, who asked for "a trident" and left it at
       that. Renaming it means this id and the two art filenames, nothing else. */
    id: 'deep-sea-trident',
    name: 'Deep Sea Trident',
    slots: ['main_hand', 'off_hand'],
    tags: ['Epic', 'Melee Weapon', 'Two-Handed'],
    blurb: 'A barnacled trident that sheds frost and keeps ice in orbit around whoever holds it.',
    burden: 0,
    weight: 4,
    cost: 4000,
    abilities: ['trident-impale', 'trident-swipe'],
    enchants: [{ id: 'unique-imbuement', spell: 'deep-sea-accretion' }, { id: 'cold-infusion' }],
    enchantText:
      'Two workings share this haft: a {{Unique Imbuement}} holding {{Deep Sea Accretion}}, and {{Cold Infusion}} in the prongs.',
    lore:
      'Dredged up rather than forged, off a shelf where the water is cold enough that the pressure keeps it from freezing.\n\n' +
      'It is heavier out of the sea than in it, and the ice it grows will not melt indoors. Every owner has been told the same thing by the last one: spend freely, and count the shards.',
  },
  {
    id: 'grave-lantern-blade',
    name: 'Grave-Lantern Blade',
    slots: ['main_hand', 'off_hand'],
    tags: ['Rare', 'Melee Weapon', 'One-Handed'],
    blurb: 'A pitted sword that burns green along the fuller and rots what it cuts.',
    burden: 0,
    weight: 1.6,
    cost: 4000,
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
  /* Not talent cards, for the same reason Ingredients are not: a rank does not
     hand a move over, it opens a tier of them and raises how many you know. See
     martial.js. */
  ...MARTIAL_MOVES,
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

/* A duplicate id does not throw, it *loses a card*: the Map keeps whichever came
   last and every `getCard` for that id quietly returns the wrong one. It cost an
   afternoon once (an enchantment and a lineage trait both called `resilience`), so
   the next one says so out loud in development rather than being found by hand. */
if (import.meta.env?.DEV) {
  const seen = new Set();
  const clashes = CARDS.filter((card) => !seen.add(card.id)).map((card) => card.id);
  if (clashes.length > 0) {
    console.error(
      `[hazebound] Two cards share an id, so one of them is unreachable: ${[...new Set(clashes)].join(', ')}. ` +
        'Ids are what saved characters point at, so the older card keeps its id.'
    );
  }
}

const CARD_BY_ID = new Map(CARDS.map((card) => [card.id, card]));
const CARD_BY_NAME = new Map(CARDS.map((card) => [card.name.toLowerCase(), card]));

/** A card by id or by printed name — `{{Cold Infusion}}` links resolve here. */
export function getCard(key) {
  if (!key) return null;
  return CARD_BY_ID.get(key) ?? CARD_BY_NAME.get(String(key).toLowerCase()) ?? null;
}

/* enchantments.js owns the lookup now, and resolves a printed name as well as an
   id, the same way getCard does. Re-exported so no call site had to move. */
export { getEnchantment };

/** What has been laid on an item: the enchantment record plus its own entry. */
export function itemEnchantments(item) {
  return (item?.enchants ?? [])
    .map((entry) => ({ ...entry, enchantment: getEnchantment(entry.id) }))
    .filter((entry) => entry.enchantment);
}

/**
 * What the item does to the cards it teaches: the damage types it deals, and how
 * far every damage die it rolls steps up.
 *
 * `extra` is what the *wielder* brings rather than the item — the enchantments on
 * an Enchanter's own person, which travel from weapon to weapon with them. See
 * `wieldModifiers` in items.js, which is what works out whether an item is in
 * their hands at all.
 *
 * ---------------------------------------------------------- two types, not one
 * **Every type is kept.** A blade with Decay worked into it, in the hands of
 * someone wearing Lightning, is a blade that deals "Decay or Lightning": two
 * enchantments both replaced its own type and neither of them lost. It used to be
 * whichever came last, which quietly threw one away and made the order of a list
 * into a rule. The renderer already prints a list of types as "Decay or
 * Lightning", each in its own colour, so this hands back a list.
 *
 * A type named twice is named once. Two Fire Infusions are one Fire.
 *
 * ----------------------------------------------------------- and one Empower
 * **The Empower does not stack with itself either.** "Unless they say otherwise,
 * effects do not stack from the same source", and a Fire Infusion in the blade
 * plus a Fire Infusion on the hands holding it is one source named twice: the
 * damage type was already deduplicated, and the Empowering that rides with it is
 * now deduplicated by the same key. Two *different* infusions still both count —
 * Decay in the blade and Lightning on the hands is "Decay or Lightning",
 * Empowered by 2 — because those are two sources.
 */
export function itemModifiers(item, extra = []) {
  const damage = [];
  const counted = new Set();
  let empower = 0;

  const fold = (enchantment) => {
    if (!enchantment || counted.has(enchantment.id)) return;
    counted.add(enchantment.id);

    if (enchantment.damageType && !damage.includes(enchantment.damageType)) {
      damage.push(enchantment.damageType);
    }
    empower += Number(enchantment.empower) || 0;
  };

  for (const { enchantment } of itemEnchantments(item)) fold(enchantment);
  for (const enchantment of extra) fold(enchantment);

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

