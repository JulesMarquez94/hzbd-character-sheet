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
 * move beside it.
 *
 * ------------------------------------------------- the roster is a cost table
 * Rebuilt on 2026-08-24 off the designer's own weapon table, which is a grid of
 * ten families against five costs. **The cost column is the Action Point cost of
 * the plain attack, and it is the only thing that sets the damage:**
 *
 *   Cost 2   1d6 + stat
 *   Cost 3   2d6 + stat
 *   Cost 4   2d6 + 2*stat
 *   Cost 5   3d6 + 2*stat
 *   Cost 6   3d6 + 3*stat
 *
 * A weapon that hits harder than its neighbour costs more to swing, and that is
 * the whole of the balance. What a family buys with the points it spends is its
 * *second* card.
 *
 * Three families read the grid sideways and each is the designer's own rule:
 *
 *   X + Shield   the base weapon's damage at 1 more Action Point, and the shield
 *                is worth 3 Armor and 1 Defense while it is in your hand
 *   Paired X     the base weapon's dice as d4 rolled twice, at 1 more Action
 *                Point, and every roll it makes is at disadvantage
 *   Crossbow     its own rung's damage for 1 Action Point less, and a Reload
 *
 * So Finesse + Shield deals what a Finesse Weapon deals and costs 3 rather than
 * 2, and Paired Finesse deals 1d4 + stat twice for the same 3.
 *
 * **The firearms are off the cost column entirely.** "All shoot ability should
 * cost 1 for firearms", 2026-08-24, so all three fire for 1 Action Point and keep
 * the damage their rung buys. What prices them instead is the magazine: see
 * `ammo` below.
 *
 * ---------------------------------------------------------------- what it is on
 * `weapon` is the weapon the card belongs to, as the card itself names it. It is
 * the only thing on a card the *title* does not print: on Jules's instruction of
 * 2026-08-24, "the weapon name should be in the banner not the title", so
 * `Short Bow - Shoot` is titled **Shoot** and banners RANGED - WEAPON ATTACK -
 * SHORT BOW. `name` stays the whole of it, because that is what the art work
 * list, every {{link}} and every saved row already point at. See `cardTitle` and
 * `cardBanner` in cardText.js, and the round trip in scripts/check-weapons.mjs
 * that holds the three in step.
 *
 * ------------------------------------------------------------------- the ammo
 * A firearm and a crossbow hold a countable number of shots and hand them back
 * to a Reload rather than to a rest:
 *
 *   ammo     `{ max, unit, reload }` on the attack. `unit` is the word the card
 *            and the pips use, Shot or Bolt
 *   reloads   the id of the attack a Reload fills, on the Reload
 *
 * Counted in `card_uses` beside everything else a card spends, and drawn as pips
 * the shape of the round beside the row. See uses.js.
 *
 * ------------------------------------------------------------ what a range is
 * **Every melee weapon reaches 1 Meter unless it is a reach weapon**, on the
 * designer's rule of 2026-08-24, and only three things are: the Whip at 4.5
 * Meter and the two Polearms at 3. The ranged distances are house-written off
 * that same instruction ("I let you review the range of them to be logical") and
 * every one of them is listed in data/README.md.
 *
 * ------------------------------------------------------- what a special costs
 * The designer priced four of them outright and the rest are read off those:
 *
 *   Flurry       5 Action Points and 2 Willpower              (given)
 *   Volley       5 Action Points and 2 Willpower              (given)
 *   Chorus       4 Action Points and 2 Willpower              (given)
 *   Aimed Shot   the plain attack's cost + 1, and 1 Willpower (given)
 *   Drive        the plain attack's cost, and 1 Willpower     (given)
 *   Discord      the plain attack's cost, and 1 Willpower     (given)
 *
 * So a special that multiplies what one swing puts out costs a point more than
 * the plain attack, and one that spends itself on an area or a rider costs the
 * same. Willpower is 1 on every special that makes a roll and 2 on the three the
 * designer priced by hand, which are the three that put out more than one hit.
 * A Reload makes no roll and costs no Willpower.
 *
 * --------------------------------------------------------------- card text
 * Card bodies are authored the way the printed cards read. See the note at the
 * top of this file for the markers.
 */
export const WEAPON_ABILITIES = withArt([
  /* ================================================================= cost 2 */

  /* ----- Finesse Weapon -----
   * The light, quick, one-handed thing: a rapier, a shortsword, a pair of
   * knuckle-knives with only one of them out. `Finesse` is a tag of its own
   * because the Duelist hangs on it now (2026-08-24, Jules: "Duelist to be
   * Finesse & Light Melee"), so it has to be findable without reading a name.
   *
   * FLURRY is the designer's, priced by them: "it cost 5 AP and 2WP, you make an
   * attack and if it lands it strike 3 time." One roll and three hits, which is
   * the shape the old Daggers card had at three rolls. One roll is the change,
   * and it is what makes 2 Willpower worth spending.
   */
  {
    id: 'finesse-strike',
    name: 'Finesse Weapon - Strike',
    weapon: 'Finesse Weapon',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'finesse-flurry',
    name: 'Finesse Weapon - Flurry',
    weapon: 'Finesse Weapon',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 5,
    wp: 2,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, the blade lands three times, each landing dealing [[1d6 + stat]] as {damage} damage.',
  },

  /* ----- Short Bow -----
   * AIMED SHOT is the designer's, and it is the whole bow family's second card:
   * "it cost base weapon attack cost +1 and 1 WP. The attack is made with
   * disadvantage but if its lands it is a guaranteed crit." Critical Hit is
   * already a defined term (keywords.js), so the card says it and stops.
   */
  {
    id: 'short-bow-shoot',
    name: 'Short Bow - Shoot',
    weapon: 'Short Bow',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'short-bow-aimed-shot',
    name: 'Short Bow - Aimed Shot',
    weapon: 'Short Bow',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 3,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Ranged Attack {roll} with disadvantage against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, the shot is a Critical Hit, dealing [[1d6 + stat]] as {damage} damage.',
  },

  /* ----- Flintlock Pistol -----
   * **A firearm fires for 1 Action Point**, on the designer's rule of 2026-08-24:
   * "all shoot ability should cost 1 for firearms". All three of them, whatever
   * rung of the ladder their damage comes off, which takes the three plain
   * attacks off the cost column and puts the whole family's price somewhere else:
   * the magazine. A Portable Canon deals what 4 Action Points buys and fires for
   * 1, and then it is empty until somebody spends 3 loading it.
   *
   * So `ammo` is what a firearm is balanced on rather than the swing, and it is a
   * rider on the card the same way `uses` is. See uses.js.
   */
  {
    id: 'flintlock-pistol-shoot',
    name: 'Flintlock Pistol - Shoot',
    weapon: 'Flintlock Pistol',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 1,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    ammo: { max: 3, unit: 'Shot', reload: 'flintlock-pistol-reload' },
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 15 Meter (50 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.\n\n' +
      'A shot is spent. With all 3 gone you must Reload before you can Shoot again.',
  },
  {
    id: 'flintlock-pistol-reload',
    name: 'Flintlock Pistol - Reload',
    weapon: 'Flintlock Pistol',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Move'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: [],
    reloads: 'flintlock-pistol-shoot',
    body:
      'You seat three fresh balls and prime the pan.\n\n' +
      'Your Flintlock Pistol is loaded with 3 Shots again, and stays loaded until you Shoot them.',
  },

  /* ----- Fist Weapon -----
   * The Finesse Weapon's numbers on Blunt damage and both hands, and the second
   * family the designer gave FLURRY to. Two-Handed because the one-handed list
   * they gave ("finesse melee light, pistol, whip, wand, ect") does not have it
   * and everything off that list is two-handed: a fist weapon is a pair of
   * cestus and you are wearing both.
   */
  {
    id: 'fist-strike',
    name: 'Fist Weapon - Strike',
    weapon: 'Fist Weapon',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Blunt'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'fist-flurry',
    name: 'Fist Weapon - Flurry',
    weapon: 'Fist Weapon',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 5,
    wp: 2,
    stat: 'instinct',
    damage: ['Blunt'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, the fists land three times, each landing dealing [[1d6 + stat]] as {damage} damage.',
  },

  /* ----- the Wands -----
   * "Wands have 3 variation Fire wand, Frost Wand and Lightning Wand." Three
   * items and three pairs of cards rather than one wand and an Imbue, which is
   * the mechanic this replaces: a Fire Wand is a Fire Wand, and the two Action
   * Points and two Willpower the old IMBUE cost every three turns are gone.
   *
   * The damage type is on the card because that is where this codex keeps it.
   * See the Trident note in the file this replaced: an item cannot carry a type
   * without every weapon sharing the card carrying it too.
   *
   * VOLLEY is the designer's: "3 projectile 1 attack roll but can choose
   * different target." One roll held against every target it is split between,
   * which is the same held-roll shape the old Colossal Bow's piercing shot used.
   *
   * They priced it by hand on 2026-08-24 as well: "wand volley should cost 5
   * action points and 2 willpower". Three hits off one roll is what Flurry sells
   * and it is now sold for exactly what Flurry costs, which is the whole reason
   * the number is not read off the plain attack like every other special.
   */
  {
    id: 'fire-wand-bolt',
    name: 'Fire Wand - Bolt',
    weapon: 'Fire Wand',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'mind',
    damage: ['Fire'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'fire-wand-volley',
    name: 'Fire Wand - Volley',
    weapon: 'Fire Wand',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 5,
    wp: 2,
    stat: 'mind',
    damage: ['Fire'],
    body:
      'Three bolts leave the wand at once. You may send them all at one entity within 18 Meter (60 Feet) of you or split them between any entities in that range.\n\n' +
      'Make one {stat} Ranged Attack {roll} and hold it against each of them.\n\n' +
      'Every bolt that beats its target deals [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'frost-wand-bolt',
    name: 'Frost Wand - Bolt',
    weapon: 'Frost Wand',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'mind',
    damage: ['Cold'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'frost-wand-volley',
    name: 'Frost Wand - Volley',
    weapon: 'Frost Wand',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 5,
    wp: 2,
    stat: 'mind',
    damage: ['Cold'],
    body:
      'Three bolts leave the wand at once. You may send them all at one entity within 18 Meter (60 Feet) of you or split them between any entities in that range.\n\n' +
      'Make one {stat} Ranged Attack {roll} and hold it against each of them.\n\n' +
      'Every bolt that beats its target deals [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'lightning-wand-bolt',
    name: 'Lightning Wand - Bolt',
    weapon: 'Lightning Wand',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'mind',
    damage: ['Lightning'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'lightning-wand-volley',
    name: 'Lightning Wand - Volley',
    weapon: 'Lightning Wand',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 5,
    wp: 2,
    stat: 'mind',
    damage: ['Lightning'],
    body:
      'Three bolts leave the wand at once. You may send them all at one entity within 18 Meter (60 Feet) of you or split them between any entities in that range.\n\n' +
      'Make one {stat} Ranged Attack {roll} and hold it against each of them.\n\n' +
      'Every bolt that beats its target deals [[1d6 + stat]] as {damage} damage.',
  },

  /* ================================================================= cost 3 */

  /* ----- Melee Light -----
   * A sword, an axe, a mace: the ordinary one-handed weapon, on Physique. The
   * designer's attribute list of 2026-08-24 puts the whole Melee line there and
   * leaves Finesse on Instinct, which is the difference between the two columns.
   *
   * SWIFT STRIKE is carried over from the One-Handed Weapon this replaces. The
   * designer named specials for every other family and not for the three Melee
   * ones, so these three keep what the codex already gave them. Flagged in
   * data/README.md.
   */
  {
    id: 'melee-light-strike',
    name: 'Melee Light - Strike',
    weapon: 'Melee Light',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'melee-light-swift-strike',
    name: 'Melee Light - Swift Strike',
    weapon: 'Melee Light',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} with disadvantage against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },

  /* ----- Bow ----- */
  {
    id: 'bow-shoot',
    name: 'Bow - Shoot',
    weapon: 'Bow',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 25 Meter (80 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'bow-aimed-shot',
    name: 'Bow - Aimed Shot',
    weapon: 'Bow',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Ranged Attack {roll} with disadvantage against an entity within 25 Meter (80 Feet) of you.\n\n' +
      'On a hit, the shot is a Critical Hit, dealing [[2d6 + stat]] as {damage} damage.',
  },

  /* ----- Flintlock Rifle ----- */
  {
    id: 'flintlock-rifle-shoot',
    name: 'Flintlock Rifle - Shoot',
    weapon: 'Flintlock Rifle',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 1,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    ammo: { max: 2, unit: 'Shot', reload: 'flintlock-rifle-reload' },
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 30 Meter (100 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.\n\n' +
      'A shot is spent. With both gone you must Reload before you can Shoot again.',
  },
  {
    id: 'flintlock-rifle-reload',
    name: 'Flintlock Rifle - Reload',
    weapon: 'Flintlock Rifle',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Move'],
    ap: 4,
    wp: null,
    stat: 'instinct',
    damage: [],
    reloads: 'flintlock-rifle-shoot',
    body:
      'You ram two charges home and prime the pan.\n\n' +
      'Your Flintlock Rifle is loaded with 2 Shots again, and stays loaded until you Shoot them.',
  },

  /* ----- Whip -----
   * "Whip remains a pulling people", so PULL is the card it already had. It is a
   * Melee Weapon at 4.5 Meter, which the designer said twice: once by leaving it
   * in the melee half of the table and once in as many words on 2026-08-24.
   */
  {
    id: 'whip-lash',
    name: 'Whip - Lash',
    weapon: 'Whip',
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
    weapon: 'Whip',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 3,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 4.5 Meter (15 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage. You then either pull the target 4.5 Meter (15 Feet) toward you or pull yourself 4.5 Meter (15 Feet) toward the target.',
  },

  /* ----- Light Crossbow -----
   * The Reload Bolt, which is the crossbow family's whole trade and the
   * designer's own: "The cost of the weapon attack is by default 1 less, but it
   * requires to reload to shoot again."
   *
   * **The Reload costs 1 Action Point**, which is house-written and the number
   * the discount came off. A shot and its reload together cost exactly what the
   * cost table asks for the damage, so a crossbow is never cheaper than a bow
   * over two turns. What it buys is *when*: the shot is cheap now and the
   * winding is paid on a turn with a point to spare. Listed in data/README.md.
   */
  {
    id: 'light-crossbow-shoot',
    name: 'Light Crossbow - Shoot',
    weapon: 'Light Crossbow',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    ammo: { max: 1, unit: 'Bolt', reload: 'light-crossbow-reload' },
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 25 Meter (80 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.\n\n' +
      'The bolt is spent. You cannot Shoot again until you have Reloaded.',
  },
  {
    id: 'light-crossbow-reload',
    name: 'Light Crossbow - Reload',
    weapon: 'Light Crossbow',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Move'],
    ap: 1,
    wp: null,
    stat: 'instinct',
    damage: [],
    reloads: 'light-crossbow-shoot',
    body:
      'You draw the string back and seat a fresh bolt.\n\n' +
      'Your Light Crossbow is loaded again, and stays loaded until you Shoot.',
  },

  /* ----- the Tomes of Incantations -----
   * "Tome of Incant come in Psychic, Sacred and Decay", and the whole family
   * rolls against Grit rather than Defense: "this a tome they read thing from it
   * does not make attack roll but do it against grit. same for weapon attack."
   *
   * So both cards say `Roll` and name Grit, which is the shape every spell in
   * the codex that is not swung at somebody already uses. It is the first weapon
   * on this wall that is not an Attack, and it is why the file header's "exactly
   * two shapes" note holds: a Tome takes the second one.
   *
   * CHORUS is the designer's: "a 6m aoe around them", priced by them on
   * 2026-08-24 at "4 action points and 2 WP". A ring that catches everything
   * within it is the widest thing on this wall, and it is the one area special
   * the designer took off the plain attack's price to charge for separately.
   */
  {
    id: 'psychic-tome-recite',
    name: 'Psychic Tome - Recite',
    weapon: 'Psychic Tome',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'mind',
    damage: ['Psychic'],
    body:
      'You read a line aloud. Make a {stat} Roll {roll} against the Grit of an entity within 12 Meter (40 Feet) of you.\n\n' +
      'On a success, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'psychic-tome-chorus',
    name: 'Psychic Tome - Chorus',
    weapon: 'Psychic Tome',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: 2,
    stat: 'mind',
    damage: ['Psychic'],
    body:
      'You read the whole passage. Make a {stat} Roll {roll} against the Grit of all entities within 6 Meter (20 Feet) of you.\n\n' +
      'On a success, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'sacred-tome-recite',
    name: 'Sacred Tome - Recite',
    weapon: 'Sacred Tome',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'mind',
    damage: ['Sacred'],
    body:
      'You read a line aloud. Make a {stat} Roll {roll} against the Grit of an entity within 12 Meter (40 Feet) of you.\n\n' +
      'On a success, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'sacred-tome-chorus',
    name: 'Sacred Tome - Chorus',
    weapon: 'Sacred Tome',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: 2,
    stat: 'mind',
    damage: ['Sacred'],
    body:
      'You read the whole passage. Make a {stat} Roll {roll} against the Grit of all entities within 6 Meter (20 Feet) of you.\n\n' +
      'On a success, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'decay-tome-recite',
    name: 'Decay Tome - Recite',
    weapon: 'Decay Tome',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'You read a line aloud. Make a {stat} Roll {roll} against the Grit of an entity within 12 Meter (40 Feet) of you.\n\n' +
      'On a success, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'decay-tome-chorus',
    name: 'Decay Tome - Chorus',
    weapon: 'Decay Tome',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: 2,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'You read the whole passage. Make a {stat} Roll {roll} against the Grit of all entities within 6 Meter (20 Feet) of you.\n\n' +
      'On a success, you deal [[2d6 + stat]] as {damage} damage.',
  },

  /* ----- Paired Finesse -----
   * The paired rule, in the designer's own words: "Their attack use twice d4
   * instead of d6 and they do one attack roll to hit damage twice. So Finesse
   * paired if it lands is 2x 1d4 + Stat. Paired attack and special have by
   * default disadvantage on attack rolls. Whirlwind is against the reflex of
   * entity in weapon range."
   *
   * So every Paired weapon is the melee weapon one rung down with its dice
   * halved in size and rolled twice, at one more Action Point, and it never
   * rolls without disadvantage. The live value prints once and the card says
   * twice, which keeps an Empowered pair honest: a die added to 1d4 is added to
   * both halves because it is one expression.
   */
  {
    id: 'paired-finesse-strike',
    name: 'Paired Finesse - Strike',
    weapon: 'Paired Finesse',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} with disadvantage against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, both blades land and you deal [[1d4 + stat]] as {damage} damage twice.',
  },
  {
    id: 'paired-finesse-whirlwind',
    name: 'Paired Finesse - Whirlwind',
    weapon: 'Paired Finesse',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 3,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'You turn once with both blades out. Make an {stat} Roll {roll} with disadvantage against the Reflex of all entities within 1 Meter (3 Feet) of you.\n\n' +
      'On a success, you deal [[1d4 + stat]] as {damage} damage twice.',
  },

  /* ----- Enchanted Instrument -----
   * "Enchanted Instrument are magic and use sound wave to send blast so force
   * damage. The special move is a single target attack that impose 1
   * disadvantage on the next roll of the target cost 1WP."
   *
   * Magic that runs on Instinct, which is the designer's own attribute list and
   * the one caster's implement on this wall that is not a Mind weapon. It is
   * played rather than studied.
   *
   * DISCORD stopped being an attack on 2026-08-24. See the card.
   */
  {
    id: 'enchanted-instrument-blast',
    name: 'Enchanted Instrument - Blast',
    weapon: 'Enchanted Instrument',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: ['Force'],
    body:
      'You strike a note and the air in front of it moves. Make an {stat} Ranged Attack {roll} against an entity within 15 Meter (50 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'enchanted-instrument-discord',
    name: 'Enchanted Instrument - Discord',
    weapon: 'Enchanted Instrument',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 3,
    wp: 1,
    stat: 'instinct',
    damage: ['Force'],
    /* DISCORD is contested rather than aimed, on the designer's ruling of
       2026-08-24: "Instrument discord is against the grit of an entity not an
       attack roll." A wrong note is not thrown at anybody, it is endured, so what
       answers it is the listener's Grit and not their Defense. The codex's second
       roll shape, and the note at the top of this file is what says there is no
       third. */
    body:
      'You bend the note until it is wrong. Make an {stat} Roll {roll} against the Grit of an entity within 15 Meter (50 Feet) of you.\n\n' +
      'On a success, you deal [[2d6 + stat]] as {damage} damage and the target has disadvantage on their next roll.',
  },

  /* ----- Finesse + Shield -----
   * The shield rule, in the designer's own words: "The shield give 3 Armor and 1
   * Defense, that is their special is a passive. They base attack is the same as
   * the normal +1. So finesse + Shield base attack do that same as finesse in
   * damage but cost 1 more."
   *
   * So a shielded weapon deals what the bare one deals and costs a point more,
   * and the point buys a number on the sheet rather than a card to play. The
   * three of them share one passive card, because the numbers are the same three
   * times over and a second copy would only be a second thing to keep in step.
   *
   * `armor` and `defense` are on the *item* and the sheet reads them off the
   * main hand alone. See `equipmentEffects` in items.js: a shield stowed in the
   * secondary slot is a shield on your back.
   */
  {
    id: 'finesse-shield-strike',
    name: 'Finesse + Shield - Strike',
    weapon: 'Finesse + Shield',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'shield-guard',
    name: 'Shield - Guard',
    weapon: 'Shield',
    kind: 'ability',
    tags: ['Melee', 'Passive'],
    ap: null,
    wp: null,
    /* The one card on this wall that names no attribute, because it is one card
       shared by three weapons that do not agree on one: Finesse + Shield swings
       on Instinct and the two Melee ones on Physique. Nothing here rolls, so
       there is nothing for an attribute to be the attribute of. */
    stat: null,
    damage: [],
    body:
      'While this is the weapon in your hand, your Armor is increased by 3 and your Defense is increased by 1.\n\n' +
      'Both are already on your sheet. Stow the weapon and both come off with it.',
  },

  /* ================================================================= cost 4 */

  /* ----- Melee Heavy -----
   * The two-hander, and the bottom half of what the Colossus now hangs on
   * (2026-08-24, Jules: "Colossus to be Heavy & Great Melee"). CLEAVE is carried
   * over from the Two-Handed Weapon this replaces, cut back to the weapon's own
   * reach: melee is 1 Meter now unless the weapon says otherwise, so the arc is
   * 1 Meter rather than the 4.5 the old card swept.
   */
  {
    id: 'melee-heavy-strike',
    name: 'Melee Heavy - Strike',
    weapon: 'Melee Heavy',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'melee-heavy-cleave',
    name: 'Melee Heavy - Cleave',
    weapon: 'Melee Heavy',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} against all entities within 1 Meter (3 Feet) in front of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },

  /* ----- Long Bow ----- */
  {
    id: 'long-bow-shoot',
    name: 'Long Bow - Shoot',
    weapon: 'Long Bow',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 45 Meter (150 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'long-bow-aimed-shot',
    name: 'Long Bow - Aimed Shot',
    weapon: 'Long Bow',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Ranged Attack {roll} with disadvantage against an entity within 45 Meter (150 Feet) of you.\n\n' +
      'On a hit, the shot is a Critical Hit, dealing [[2d6 + 2*stat]] as {damage} damage.',
  },

  /* ----- Portable Canon ----- */
  {
    id: 'portable-canon-shoot',
    name: 'Portable Canon - Shoot',
    weapon: 'Portable Canon',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 1,
    wp: null,
    stat: 'instinct',
    damage: ['Blunt'],
    ammo: { max: 1, unit: 'Shot', reload: 'portable-canon-reload' },
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 25 Meter (80 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.\n\n' +
      'The shot is spent. You cannot Shoot again until you have Reloaded.',
  },
  {
    id: 'portable-canon-reload',
    name: 'Portable Canon - Reload',
    weapon: 'Portable Canon',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Move'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: [],
    reloads: 'portable-canon-shoot',
    body:
      'You tip the muzzle up, pour the charge and seat the ball on it.\n\n' +
      'Your Portable Canon is loaded with 1 Shot again, and stays loaded until you Shoot it.',
  },

  /* ----- Polearm -----
   * "Polearm, and Great Polearm have by default double the range of 3M. The
   * special attack is one that cost 1 Willpower and the same AP as base cost of
   * weapon attack and that one a hit pushed entity by 3."
   *
   * So DRIVE is the one special in the codex the designer priced at the plain
   * attack's own cost, and the push is 3 Meter. Both Polearms are Melee Weapons,
   * which the designer said in as many words on 2026-08-24.
   */
  {
    id: 'polearm-thrust',
    name: 'Polearm - Thrust',
    weapon: 'Polearm',
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
    id: 'polearm-drive',
    name: 'Polearm - Drive',
    weapon: 'Polearm',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 3 Meter (10 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage and push the target 3 Meter (10 Feet) directly away from you.',
  },

  /* ----- Crossbow ----- */
  {
    id: 'crossbow-shoot',
    name: 'Crossbow - Shoot',
    weapon: 'Crossbow',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    ammo: { max: 1, unit: 'Bolt', reload: 'crossbow-reload' },
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 30 Meter (100 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.\n\n' +
      'The bolt is spent. You cannot Shoot again until you have Reloaded.',
  },
  {
    id: 'crossbow-reload',
    name: 'Crossbow - Reload',
    weapon: 'Crossbow',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Move'],
    ap: 1,
    wp: null,
    stat: 'instinct',
    damage: [],
    reloads: 'crossbow-shoot',
    body:
      'You put a foot in the stirrup and haul the string back to the catch.\n\n' +
      'Your Crossbow is loaded again, and stays loaded until you Shoot.',
  },

  /* ----- the Staves -----
   * "Staff use deal arcane magic to deal sharp, force or blunt (three different
   * staff). Special move is an area attack against all target reflex small
   * area."
   *
   * Three staves, three types, and BURST rolls against Reflex rather than
   * Defense because that is what the designer named. The area is 3 Meter, which
   * is house-written off "small area": it is half the Tome's ring and it is the
   * smallest area anything in the codex throws. Listed in data/README.md.
   *
   * ------------------------------------------------------------------ the names
   * Rivenstave, Sunderstave and Loadstave, on Jules's instruction of 2026-08-24:
   * "name the staff something more in lore rather than just force blunt and
   * sharp, arcane sounding things". Each one still says what it deals — riven air,
   * a sundering shove, a load coming down — without naming the damage type twice.
   *
   * **The ids stay `sharp-staff`, `force-staff` and `blunt-staff`.** An id is what
   * a saved sheet points at and what the art work list already names its files
   * for (data/templates/weapon-icons.csv), so renaming one would orphan an
   * equipped weapon and a picture at once. The name is what a reader sees and the
   * id is what the sheet remembers; only the first of those was asked to change.
   */
  {
    id: 'sharp-staff-blast',
    name: 'Rivenstave - Blast',
    weapon: 'Rivenstave',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'mind',
    damage: ['Sharp'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'sharp-staff-burst',
    name: 'Rivenstave - Burst',
    weapon: 'Rivenstave',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'mind',
    damage: ['Sharp'],
    body:
      'Choose a point within 18 Meter (60 Feet) of you. Make a {stat} Roll {roll} against the Reflex of all entities within 3 Meter (10 Feet) of it.\n\n' +
      'On a success, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'force-staff-blast',
    name: 'Sunderstave - Blast',
    weapon: 'Sunderstave',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'mind',
    damage: ['Force'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'force-staff-burst',
    name: 'Sunderstave - Burst',
    weapon: 'Sunderstave',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'mind',
    damage: ['Force'],
    body:
      'Choose a point within 18 Meter (60 Feet) of you. Make a {stat} Roll {roll} against the Reflex of all entities within 3 Meter (10 Feet) of it.\n\n' +
      'On a success, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'blunt-staff-blast',
    name: 'Loadstave - Blast',
    weapon: 'Loadstave',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'mind',
    damage: ['Blunt'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 18 Meter (60 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'blunt-staff-burst',
    name: 'Loadstave - Burst',
    weapon: 'Loadstave',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'mind',
    damage: ['Blunt'],
    body:
      'Choose a point within 18 Meter (60 Feet) of you. Make a {stat} Roll {roll} against the Reflex of all entities within 3 Meter (10 Feet) of it.\n\n' +
      'On a success, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },

  /* ----- Paired Light Weapon ----- */
  {
    id: 'paired-light-strike',
    name: 'Paired Light Weapon - Strike',
    weapon: 'Paired Light Weapon',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} with disadvantage against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, both weapons land and you deal [[2d4 + stat]] as {damage} damage twice.',
  },
  {
    id: 'paired-light-whirlwind',
    name: 'Paired Light Weapon - Whirlwind',
    weapon: 'Paired Light Weapon',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'You turn once with both weapons out. Make a {stat} Roll {roll} with disadvantage against the Reflex of all entities within 1 Meter (3 Feet) of you.\n\n' +
      'On a success, you deal [[2d4 + stat]] as {damage} damage twice.',
  },

  /* ----- Melee Light + Shield ----- */
  {
    id: 'melee-light-shield-strike',
    name: 'Melee Light + Shield - Strike',
    weapon: 'Melee Light + Shield',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] as {damage} damage.',
  },

  /* ================================================================= cost 5 */

  /* ----- Melee Great -----
   * The top of the melee column. The four weapons whose names say Great carry
   * `Great` as a second tag, which is the old `Colossal` under the name the wall
   * itself uses: GIANT SLAYER reads it and would otherwise point at nothing. The
   * Colossus reaches its own weapons through `Heavy Melee` and `Great Melee`
   * instead, on the designer's word of 2026-08-24. The Action Points line up
   * exactly, 5 and 5 and 5 and 6.
   */
  {
    id: 'melee-great-strike',
    name: 'Melee Great - Strike',
    weapon: 'Melee Great',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 5,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'melee-great-cleave',
    name: 'Melee Great - Cleave',
    weapon: 'Melee Great',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} against all entities within 1 Meter (3 Feet) in front of you.\n\n' +
      'On a hit, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },

  /* ----- Great Bow ----- */
  {
    id: 'great-bow-shoot',
    name: 'Great Bow - Shoot',
    weapon: 'Great Bow',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 5,
    wp: null,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 60 Meter (200 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'great-bow-aimed-shot',
    name: 'Great Bow - Aimed Shot',
    weapon: 'Great Bow',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 6,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Ranged Attack {roll} with disadvantage against an entity within 60 Meter (200 Feet) of you.\n\n' +
      'On a hit, the shot is a Critical Hit, dealing [[3d6 + 2*stat]] as {damage} damage.',
  },

  /* ----- Great Polearm ----- */
  {
    id: 'great-polearm-thrust',
    name: 'Great Polearm - Thrust',
    weapon: 'Great Polearm',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 5,
    wp: null,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 3 Meter (10 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'great-polearm-drive',
    name: 'Great Polearm - Drive',
    weapon: 'Great Polearm',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 3 Meter (10 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + 2*stat]] as {damage} damage and push the target 3 Meter (10 Feet) directly away from you.',
  },

  /* ----- Heavy Crossbow ----- */
  {
    id: 'heavy-crossbow-shoot',
    name: 'Heavy Crossbow - Shoot',
    weapon: 'Heavy Crossbow',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    ammo: { max: 1, unit: 'Bolt', reload: 'heavy-crossbow-reload' },
    body:
      'Make an {stat} Ranged Attack {roll} against an entity within 45 Meter (150 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + 2*stat]] as {damage} damage.\n\n' +
      'The bolt is spent. You cannot Shoot again until you have Reloaded.',
  },
  {
    id: 'heavy-crossbow-reload',
    name: 'Heavy Crossbow - Reload',
    weapon: 'Heavy Crossbow',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Move'],
    ap: 1,
    wp: null,
    stat: 'instinct',
    damage: [],
    reloads: 'heavy-crossbow-shoot',
    body:
      'You crank the windlass until the catch takes it and lay a fresh bolt in the groove.\n\n' +
      'Your Heavy Crossbow is loaded again, and stays loaded until you Shoot.',
  },

  /* ----- the Censers -----
   * "Censer use incense to deal decay, sacred or psychic damage. They have real
   * short range. Special move is spread smoke in all direction in an aoe attack.
   * like tome this a weapon that attack grit."
   *
   * So the Censer is the Tome's roll at the Great tier's damage and 3 Meter of
   * reach, which is the shortest range on the wall and shorter than most melee
   * weapons swing. It is one-handed because it hangs off a chain.
   */
  {
    id: 'decay-censer-waft',
    name: 'Decay Censer - Waft',
    weapon: 'Decay Censer',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 5,
    wp: null,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'You swing the censer and the smoke goes where you send it. Make a {stat} Roll {roll} against the Grit of an entity within 3 Meter (10 Feet) of you.\n\n' +
      'On a success, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'decay-censer-fumigate',
    name: 'Decay Censer - Fumigate',
    weapon: 'Decay Censer',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'The censer opens and the smoke goes out in every direction at once. Make a {stat} Roll {roll} against the Grit of all entities within 3 Meter (10 Feet) of you.\n\n' +
      'On a success, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'sacred-censer-waft',
    name: 'Sacred Censer - Waft',
    weapon: 'Sacred Censer',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 5,
    wp: null,
    stat: 'mind',
    damage: ['Sacred'],
    body:
      'You swing the censer and the smoke goes where you send it. Make a {stat} Roll {roll} against the Grit of an entity within 3 Meter (10 Feet) of you.\n\n' +
      'On a success, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'sacred-censer-fumigate',
    name: 'Sacred Censer - Fumigate',
    weapon: 'Sacred Censer',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'mind',
    damage: ['Sacred'],
    body:
      'The censer opens and the smoke goes out in every direction at once. Make a {stat} Roll {roll} against the Grit of all entities within 3 Meter (10 Feet) of you.\n\n' +
      'On a success, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'psychic-censer-waft',
    name: 'Psychic Censer - Waft',
    weapon: 'Psychic Censer',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 5,
    wp: null,
    stat: 'mind',
    damage: ['Psychic'],
    body:
      'You swing the censer and the smoke goes where you send it. Make a {stat} Roll {roll} against the Grit of an entity within 3 Meter (10 Feet) of you.\n\n' +
      'On a success, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'psychic-censer-fumigate',
    name: 'Psychic Censer - Fumigate',
    weapon: 'Psychic Censer',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'mind',
    damage: ['Psychic'],
    body:
      'The censer opens and the smoke goes out in every direction at once. Make a {stat} Roll {roll} against the Grit of all entities within 3 Meter (10 Feet) of you.\n\n' +
      'On a success, you deal [[3d6 + 2*stat]] as {damage} damage.',
  },

  /* ----- Paired Heavy Weapon ----- */
  {
    id: 'paired-heavy-strike',
    name: 'Paired Heavy Weapon - Strike',
    weapon: 'Paired Heavy Weapon',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 5,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} with disadvantage against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, both weapons land and you deal [[2d4 + 2*stat]] as {damage} damage twice.',
  },
  {
    id: 'paired-heavy-whirlwind',
    name: 'Paired Heavy Weapon - Whirlwind',
    weapon: 'Paired Heavy Weapon',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'You turn once with both weapons out. Make a {stat} Roll {roll} with disadvantage against the Reflex of all entities within 1 Meter (3 Feet) of you.\n\n' +
      'On a success, you deal [[2d4 + 2*stat]] as {damage} damage twice.',
  },

  /* ----- Melee Heavy + Shield ----- */
  {
    id: 'melee-heavy-shield-strike',
    name: 'Melee Heavy + Shield - Strike',
    weapon: 'Melee Heavy + Shield',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 5,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },

  /* ================================================================= cost 6 */

  /* ----- Ballista -----
   * The top of the crossbow column and the only weapon in the codex on the cost
   * 6 line of the table, 3d6 + 3*stat, which it fires for 5 because the Reload
   * Bolt takes a point off. Physique rather than Instinct, which is the one
   * place the crossbow column changes attribute: the designer's list of
   * 2026-08-24 puts every other crossbow on Instinct and this one on Physique.
   *
   * "Balista" on the designer's table. Spelled Ballista here, the way "Colosal"
   * was read as Colossal on the way in.
   */
  {
    id: 'ballista-shoot',
    name: 'Ballista - Shoot',
    weapon: 'Ballista',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 5,
    wp: null,
    stat: 'physique',
    damage: ['Sharp'],
    ammo: { max: 1, unit: 'Bolt', reload: 'ballista-reload' },
    body:
      'Make a {stat} Ranged Attack {roll} against an entity within 60 Meter (200 Feet) of you.\n\n' +
      'On a hit, you deal [[3d6 + 3*stat]] as {damage} damage.\n\n' +
      'The bolt is spent. You cannot Shoot again until you have Reloaded.',
  },
  {
    id: 'ballista-reload',
    name: 'Ballista - Reload',
    weapon: 'Ballista',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Move'],
    ap: 1,
    wp: null,
    stat: 'physique',
    damage: [],
    reloads: 'ballista-shoot',
    body:
      'You throw your weight on the lever until the arms come back, and drop the next shaft in.\n\n' +
      'Your Ballista is loaded again, and stays loaded until you Shoot.',
  },

  /* ----- Paired Great Weapon ----- */
  {
    id: 'paired-great-strike',
    name: 'Paired Great Weapon - Strike',
    weapon: 'Paired Great Weapon',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 6,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a {stat} Melee Attack {roll} with disadvantage against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, both weapons land and you deal [[3d4 + 2*stat]] as {damage} damage twice.',
  },
  {
    id: 'paired-great-whirlwind',
    name: 'Paired Great Weapon - Whirlwind',
    weapon: 'Paired Great Weapon',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 6,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'You turn once with both weapons out. Make a {stat} Roll {roll} with disadvantage against the Reflex of all entities within 1 Meter (3 Feet) of you.\n\n' +
      'On a success, you deal [[3d4 + 2*stat]] as {damage} damage twice.',
  },

  /* ----- Claws & Teeth (natural) -----
   * Not on the designer's table and deliberately kept: it is not a weapon
   * anybody buys, it is what a Feral Cursed has instead of one. See FERAL_WEAPON
   * in feral.js, which puts it in the hand when the form runs.
   *
   * Its reach came down to 1 Meter with every other melee weapon.
   */
  {
    id: 'claws-shred',
    name: 'Claws - Shred',
    weapon: 'Claws',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'teeth-bite',
    name: 'Teeth - Bite',
    weapon: 'Teeth',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against an entity within 1 Meter (3 Feet) of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage and gain Shield equal to [[stat]].',
  },
]);

/* -------------------------------------------------------------- the weapons */

/**
 * Weapon fields on top of the shared item fields (see items.js):
 *   abilities   — the two card ids the weapon teaches while it is held
 *   blurb       — the one-line description printed under its name
 *   armor       — flat Armor it is worth **while it is in your hand**
 *   defense     — flat Defense on the same terms
 *   enchants    — [{ id, spell? }] when the weapon carries enchantments
 *   enchantText — the sentence shown for that enchantment, with {{card links}}
 *
 * **Every weapon costs 4000 coins**, on Jules's rule of 2026-08-22, and the five
 * enchanted ones say 4000 here like the rest: what is worked into a piece is
 * priced off its Magic Burden by `itemCost` in items.js, so a Deep Sea Trident is
 * 17,000 without a second number to keep in step. `weight` is in kilograms and it
 * is the only field that tells one weapon of a cost from another here.
 *
 * ------------------------------------------------------------------- the tags
 * Rebuilt on 2026-08-24, on Jules's own pass: "weapon is redundant in the weapon
 * category so it can have but hidden", "ranged weapon should just be ranged,
 * melee just melee. So Great bow can be Great - Ranged - Two-handed - Bow", and
 * "then Wand, Staffs etc are a tag". Five axes, and a set matches on one of them:
 *
 *   rarity      Common, Uncommon, Rare, Epic
 *   kind        `Weapon`, on every weapon and shown on none of them. It is what
 *               the word was always for — finding every weapon at once — and on a
 *               weapon's own row it says nothing the reader cannot see. So it is
 *               carried and hidden, which is what "can have but hidden" asked
 *               for. See HIDDEN_TAGS in itemParts.jsx, which hides `Common` on
 *               the same reasoning: it is the default and it is not news
 *   size        `Great`, on the four weapons whose names say Great. This is the
 *               `Colossal` tag renamed, and renamed on the designer's word that
 *               the Colossus reaches its own weapons through `Heavy Melee` and
 *               `Great Melee` rather than through this. GIANT SLAYER reads it
 *   category    Melee or Ranged. The Whip and both Polearms are Melee at 4.5 and
 *               3 Meter, which the designer ruled on 2026-08-24
 *   hands       One-Handed or Two-Handed, one of the two on every weapon. The
 *               designer's own one-handed list is Finesse Weapon, Melee Light,
 *               Flintlock Pistol, Whip and the Wands; the Light Crossbow and the
 *               Censers were read into it and everything else is Two-Handed
 *   family      what a talent set actually hangs on: Finesse, Light Melee, Heavy
 *               Melee, Great Melee, Fist, Bow, Crossbow, Firearm, Polearm, Whip,
 *               Reach, Wand, Staff, Tome, Censer, Instrument, Paired, Shielded,
 *               Natural
 *
 * **`Focus` is gone.** It held the Wands, the Staves, the Tomes, the Censers and
 * the Instrument under one word that told a reader nothing, and no talent set ever
 * reached for it. Each implement is its own family tag now, which is the same rule
 * the rest of the axis already followed: a Bow is a Bow and not a "Ranged Thing".
 *
 * The Duelist reads `Finesse`, `Whip`, `Fist` and `Polearm`, the Colossus reads
 * `Heavy Melee` and `Great Melee`, and GIANT SLAYER reads `Great`. See `martial`
 * in talents.js and `weaponRiders` in moves.js.
 *
 * A Paired weapon carries its family's tag, so a Colossus reaches Paired Great
 * Weapons the way COLOSSAL GRIP says they should. A shielded one carries
 * `Shielded` and not its family's, which is the reading the codex has always
 * taken: a Duelist with a shield is not a thing anybody has ruled on.
 */
export const WEAPONS = [
  /* ----- cost 2 ----- */
  {
    id: 'finesse-weapon',
    name: 'Finesse Weapon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Melee', 'One-Handed', 'Finesse'],
    blurb: 'A rapier, a smallsword, a long knife. Fast in, faster out.',
    burden: 0,
    weight: 0.9,
    cost: 4000,
    abilities: ['finesse-strike', 'finesse-flurry'],
  },
  {
    id: 'short-bow',
    name: 'Short Bow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Bow'],
    blurb: 'A hunting bow: light draw, fast nock, close work.',
    burden: 0,
    weight: 1,
    cost: 4000,
    abilities: ['short-bow-shoot', 'short-bow-aimed-shot'],
  },
  {
    id: 'flintlock-pistol',
    name: 'Flintlock Pistol',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'One-Handed', 'Firearm'],
    blurb: 'Powder and shot in one hand. Three balls, then reload.',
    burden: 0,
    weight: 1.5,
    cost: 4000,
    abilities: ['flintlock-pistol-shoot', 'flintlock-pistol-reload'],
  },
  {
    id: 'fire-wand',
    name: 'Fire Wand',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'One-Handed', 'Wand'],
    blurb: 'Carved rowan with a seam of ember down it, and it never quite goes out.',
    burden: 0,
    weight: 0.3,
    cost: 4000,
    abilities: ['fire-wand-bolt', 'fire-wand-volley'],
  },
  {
    id: 'frost-wand',
    name: 'Frost Wand',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'One-Handed', 'Wand'],
    blurb: 'Rowan gone white to the grain. It is cold to hold and colder to point.',
    burden: 0,
    weight: 0.3,
    cost: 4000,
    abilities: ['frost-wand-bolt', 'frost-wand-volley'],
  },
  {
    id: 'lightning-wand',
    name: 'Lightning Wand',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'One-Handed', 'Wand'],
    blurb: 'Rowan with copper wound the length of it, and the hair on your arm knows.',
    burden: 0,
    weight: 0.3,
    cost: 4000,
    abilities: ['lightning-wand-bolt', 'lightning-wand-volley'],
  },
  {
    id: 'fist-weapon',
    name: 'Fist Weapon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Melee', 'Two-Handed', 'Fist'],
    blurb: 'Banded cestus on both hands, and nothing between you and the work.',
    burden: 0,
    weight: 1,
    cost: 4000,
    abilities: ['fist-strike', 'fist-flurry'],
  },

  /* ----- cost 3 ----- */
  {
    id: 'melee-light',
    name: 'Melee Light',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Melee', 'One-Handed', 'Light Melee'],
    blurb: 'A sword, an axe or a mace: one hand on the grip, the other free.',
    burden: 0,
    weight: 1.5,
    cost: 4000,
    abilities: ['melee-light-strike', 'melee-light-swift-strike'],
  },
  {
    id: 'bow',
    name: 'Bow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Bow'],
    blurb: 'The bow everybody means when they say bow.',
    burden: 0,
    weight: 1.2,
    cost: 4000,
    abilities: ['bow-shoot', 'bow-aimed-shot'],
  },
  {
    id: 'flintlock-rifle',
    name: 'Flintlock Rifle',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Firearm'],
    blurb: 'A long barrel and a slow reload for a shot that carries.',
    burden: 0,
    weight: 4.5,
    cost: 4000,
    abilities: ['flintlock-rifle-shoot', 'flintlock-rifle-reload'],
  },
  {
    id: 'whip',
    name: 'Whip',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Melee', 'One-Handed', 'Whip', 'Reach'],
    blurb: 'Braided leather that bites at fifteen feet and drags them closer.',
    burden: 0,
    weight: 1.2,
    cost: 4000,
    abilities: ['whip-lash', 'whip-pull'],
  },
  {
    id: 'light-crossbow',
    name: 'Light Crossbow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'One-Handed', 'Crossbow'],
    blurb: 'Small enough for one hand, and the first anyone knows is the bolt.',
    burden: 0,
    weight: 2,
    cost: 4000,
    abilities: ['light-crossbow-shoot', 'light-crossbow-reload'],
  },
  {
    id: 'psychic-tome',
    name: 'Psychic Tome of Incantations',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Tome'],
    blurb: 'A clasped book read aloud from, and the words arrive before the sound does.',
    burden: 0,
    weight: 2.2,
    cost: 4000,
    abilities: ['psychic-tome-recite', 'psychic-tome-chorus'],
  },
  {
    id: 'sacred-tome',
    name: 'Sacred Tome of Incantations',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Tome'],
    blurb: 'A clasped book read aloud from, and what it says of you is held against you.',
    burden: 0,
    weight: 2.2,
    cost: 4000,
    abilities: ['sacred-tome-recite', 'sacred-tome-chorus'],
  },
  {
    id: 'decay-tome',
    name: 'Decay Tome of Incantations',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Tome'],
    blurb: 'A clasped book read aloud from, and the page is damp where the thumb goes.',
    burden: 0,
    weight: 2.2,
    cost: 4000,
    abilities: ['decay-tome-recite', 'decay-tome-chorus'],
  },
  {
    id: 'paired-finesse',
    name: 'Paired Finesse',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Melee', 'Two-Handed', 'Finesse', 'Paired'],
    blurb: 'A matched pair of short blades, and nothing spare to catch anything with.',
    burden: 0,
    weight: 1.8,
    cost: 4000,
    abilities: ['paired-finesse-strike', 'paired-finesse-whirlwind'],
  },
  {
    id: 'enchanted-instrument',
    name: 'Enchanted Instrument',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Instrument'],
    blurb: 'A worked fiddle or hurdy-gurdy whose notes arrive as a shove rather than a sound.',
    burden: 0,
    weight: 2.5,
    cost: 4000,
    abilities: ['enchanted-instrument-blast', 'enchanted-instrument-discord'],
  },
  {
    id: 'finesse-shield',
    name: 'Finesse + Shield',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Melee', 'Two-Handed', 'Shielded'],
    blurb: 'A light blade in one hand and a banded round in the other.',
    burden: 0,
    weight: 5.4,
    cost: 4000,
    armor: 3,
    defense: 1,
    abilities: ['finesse-shield-strike', 'shield-guard'],
  },

  /* ----- cost 4 ----- */
  {
    id: 'melee-heavy',
    name: 'Melee Heavy',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Melee', 'Two-Handed', 'Heavy Melee'],
    blurb: 'A greatsword or a maul that needs your whole body behind it.',
    burden: 0,
    weight: 3.5,
    cost: 4000,
    abilities: ['melee-heavy-strike', 'melee-heavy-cleave'],
  },
  {
    id: 'long-bow',
    name: 'Long Bow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Bow'],
    blurb: 'A tall yew bow that reaches across the whole field.',
    burden: 0,
    weight: 1.5,
    cost: 4000,
    abilities: ['long-bow-shoot', 'long-bow-aimed-shot'],
  },
  {
    id: 'portable-canon',
    name: 'Portable Canon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Firearm'],
    blurb: 'A hand-braced cannon. One shot, and everything after it is ringing.',
    burden: 0,
    weight: 12,
    cost: 4000,
    abilities: ['portable-canon-shoot', 'portable-canon-reload'],
  },
  {
    id: 'polearm',
    name: 'Polearm',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Melee', 'Two-Handed', 'Polearm', 'Reach'],
    blurb: 'A halberd or glaive, held at the far end, hitting things that have not arrived yet.',
    burden: 0,
    weight: 3,
    cost: 4000,
    abilities: ['polearm-thrust', 'polearm-drive'],
  },
  {
    id: 'crossbow',
    name: 'Crossbow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Crossbow'],
    blurb: 'Wound tight, held loaded and spent all at once.',
    burden: 0,
    weight: 4,
    cost: 4000,
    abilities: ['crossbow-shoot', 'crossbow-reload'],
  },
  {
    id: 'sharp-staff',
    name: 'Rivenstave',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Staff'],
    blurb: 'A caster’s stave that throws the air out in edges.',
    burden: 0,
    weight: 1.6,
    cost: 4000,
    abilities: ['sharp-staff-blast', 'sharp-staff-burst'],
  },
  {
    id: 'force-staff',
    name: 'Sunderstave',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Staff'],
    blurb: 'A caster’s stave that throws nothing at all, very hard.',
    burden: 0,
    weight: 1.6,
    cost: 4000,
    abilities: ['force-staff-blast', 'force-staff-burst'],
  },
  {
    id: 'blunt-staff',
    name: 'Loadstave',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Staff'],
    blurb: 'A caster’s stave that lands like something much heavier than a stave.',
    burden: 0,
    weight: 1.6,
    cost: 4000,
    abilities: ['blunt-staff-blast', 'blunt-staff-burst'],
  },
  {
    id: 'paired-light',
    name: 'Paired Light Weapon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Melee', 'Two-Handed', 'Light Melee', 'Paired'],
    blurb: 'A full weapon in each hand, and nothing spare to catch anything with.',
    burden: 0,
    weight: 3,
    cost: 4000,
    abilities: ['paired-light-strike', 'paired-light-whirlwind'],
  },
  {
    id: 'melee-light-shield',
    name: 'Melee Light + Shield',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Melee', 'Two-Handed', 'Shielded'],
    blurb: 'A blade in one hand, a wall of banded wood in the other.',
    burden: 0,
    weight: 6,
    cost: 4000,
    armor: 3,
    defense: 1,
    abilities: ['melee-light-shield-strike', 'shield-guard'],
  },

  /* ----- cost 5 ----- */
  {
    id: 'melee-great',
    name: 'Melee Great',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Great', 'Melee', 'Two-Handed', 'Great Melee'],
    blurb: 'A greatsword built at siege scale, swung once and meant once.',
    burden: 0,
    weight: 8,
    cost: 4000,
    abilities: ['melee-great-strike', 'melee-great-cleave'],
  },
  {
    id: 'great-bow',
    name: 'Great Bow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Great', 'Ranged', 'Two-Handed', 'Bow'],
    blurb: 'A siege bow braced against the ground and drawn on the whole body.',
    burden: 0,
    weight: 6,
    cost: 4000,
    abilities: ['great-bow-shoot', 'great-bow-aimed-shot'],
  },
  {
    id: 'great-polearm',
    name: 'Great Polearm',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Great', 'Melee', 'Two-Handed', 'Polearm', 'Reach'],
    blurb: 'A wall-breaker on a haft, and it reaches the rank behind the one it hit.',
    burden: 0,
    weight: 7,
    cost: 4000,
    abilities: ['great-polearm-thrust', 'great-polearm-drive'],
  },
  {
    id: 'heavy-crossbow',
    name: 'Heavy Crossbow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Crossbow'],
    blurb: 'A windlass, a steel prod and one bolt at a time.',
    burden: 0,
    weight: 6,
    cost: 4000,
    abilities: ['heavy-crossbow-shoot', 'heavy-crossbow-reload'],
  },
  {
    id: 'decay-censer',
    name: 'Decay Censer',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'One-Handed', 'Censer'],
    blurb: 'A pierced brass bulb on a chain, and the smoke off it does not rise.',
    burden: 0,
    weight: 2,
    cost: 4000,
    abilities: ['decay-censer-waft', 'decay-censer-fumigate'],
  },
  {
    id: 'sacred-censer',
    name: 'Sacred Censer',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'One-Handed', 'Censer'],
    blurb: 'A pierced brass bulb on a chain, swung the way a bell is rung.',
    burden: 0,
    weight: 2,
    cost: 4000,
    abilities: ['sacred-censer-waft', 'sacred-censer-fumigate'],
  },
  {
    id: 'psychic-censer',
    name: 'Psychic Censer',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'One-Handed', 'Censer'],
    blurb: 'A pierced brass bulb on a chain, and the smoke smells like something you said.',
    burden: 0,
    weight: 2,
    cost: 4000,
    abilities: ['psychic-censer-waft', 'psychic-censer-fumigate'],
  },
  {
    id: 'paired-heavy',
    name: 'Paired Heavy Weapon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Melee', 'Two-Handed', 'Heavy Melee', 'Paired'],
    blurb: 'Two weapons that each wanted both hands, and you gave them one apiece.',
    burden: 0,
    weight: 7,
    cost: 4000,
    abilities: ['paired-heavy-strike', 'paired-heavy-whirlwind'],
  },
  {
    id: 'melee-heavy-shield',
    name: 'Melee Heavy + Shield',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Melee', 'Two-Handed', 'Shielded'],
    blurb: 'A two-hander swung one-handed, because the other hand is holding a door.',
    burden: 0,
    weight: 8,
    cost: 4000,
    armor: 3,
    defense: 1,
    abilities: ['melee-heavy-shield-strike', 'shield-guard'],
  },

  /* ----- cost 6 ----- */
  {
    id: 'ballista',
    name: 'Ballista',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Ranged', 'Two-Handed', 'Crossbow'],
    blurb: 'A siege engine with a shoulder stock bolted to it. It was never meant to be carried.',
    burden: 0,
    weight: 15,
    cost: 4000,
    abilities: ['ballista-shoot', 'ballista-reload'],
  },
  {
    id: 'paired-great',
    name: 'Paired Great Weapon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Great', 'Melee', 'Two-Handed', 'Great Melee', 'Paired'],
    blurb: 'Two of them, one in each hand, and nothing left over for a shield.',
    burden: 0,
    weight: 16,
    cost: 4000,
    abilities: ['paired-great-strike', 'paired-great-whirlwind'],
  },

  {
    id: 'claws-and-teeth',
    name: 'Claws & Teeth',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Weapon', 'Melee', 'Two-Handed', 'Natural'],
    // Born with, not bought — no shop stocks it and no starting kit issues it.
    natural: true,
    blurb: 'What you were born with, when nothing else is left in your hands.',
    burden: 0,
    weight: 0,
    cost: 0,
    abilities: ['claws-shred', 'teeth-bite'],
  },

  /* ----- enchanted weapons -----
   * All five kept, and all five repointed at cards on the new wall: the One-
   * Handed Weapon is Melee Light now and the Trident is a Polearm. Nothing about
   * what they carry changed, only which two cards they lend.
   */
  {
    id: 'cold-infused-sword',
    name: 'Cold-Infused Sword',
    slots: ['main_hand', 'off_hand'],
    tags: ['Uncommon', 'Weapon', 'Melee', 'One-Handed', 'Light Melee'],
    blurb: 'A one-handed sword whose edge never stops shedding frost.',
    burden: 0,
    weight: 1.5,
    cost: 4000,
    abilities: ['melee-light-strike', 'melee-light-swift-strike'],
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
    tags: ['Uncommon', 'Weapon', 'Ranged', 'One-Handed', 'Firearm'],
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
       swing. */
    id: 'patien',
    name: 'Patien',
    slots: ['main_hand', 'off_hand'],
    tags: ['Rare', 'Weapon', 'Melee', 'One-Handed', 'Light Melee'],
    blurb: 'A plain one-handed sword that never seems to be caught off guard.',
    burden: 0,
    weight: 1.5,
    cost: 4000,
    abilities: ['melee-light-strike', 'melee-light-swift-strike'],
    enchants: [{ id: 'prepared' }],
    enchantText: 'This blade is enchanted with {{Prepared}}.',
    lore:
      'Its maker is not recorded and its edge is unremarkable. What is remarkable is that nobody carrying it has ever been the last to move.\n\n' +
      'Duellists call the feeling the half-second, and swear the blade is already turning before they have decided to turn it. The guild examiners who took one apart found nothing in the steel and wrote it up as temperament.',
  },
  {
    /* The trident Deep Sea Accretion lives on. It teaches the Polearm's two cards
       now: the Trident and the Bo Staff both left the codex with the rest of the
       old roster, and a three-pronged fishing spear held at the far end is what a
       Polearm is. The reach came down from 4.5 Meter to 3 with the family.

       **Two workings, and the codex names them separately.** Cold Infusion turns
       the prongs' Sharp into Cold. The imbuement's spell is dealt without the
       item's modifiers on purpose (see gearSource in abilitySources.js), so Deep
       Sea Accretion's Ice Spikes stay Sharp. */
    id: 'deep-sea-trident',
    name: 'Deep Sea Trident',
    slots: ['main_hand', 'off_hand'],
    tags: ['Epic', 'Weapon', 'Melee', 'Two-Handed', 'Polearm', 'Reach'],
    blurb: 'A barnacled trident that sheds frost and keeps ice in orbit around whoever holds it.',
    burden: 0,
    weight: 4,
    cost: 4000,
    abilities: ['polearm-thrust', 'polearm-drive'],
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
    tags: ['Rare', 'Weapon', 'Melee', 'One-Handed', 'Light Melee'],
    blurb: 'A pitted sword that burns green along the fuller and rots what it cuts.',
    burden: 0,
    weight: 1.6,
    cost: 4000,
    abilities: ['melee-light-strike', 'melee-light-swift-strike'],
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

