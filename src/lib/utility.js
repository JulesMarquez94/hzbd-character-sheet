/**
 * Utility items — everything that hangs off the belt rather than being worn
 * or held in your hands.
 *
 * A belt item is an item like any other (see items.js); it just teaches one
 * card — the single thing it does when you reach for it — and it comes in two
 * kinds:
 *
 *   consumable — a limited number of uses, and gone once they are spent
 *   usable     — using it costs you something, but the thing itself stays
 *
 * Charges are what the belt keeps track of: `charges` is how many uses an item
 * holds, and the loop it sits in remembers how many have been spent. A usable
 * item names what brings its charges back (`recharge`); a consumable has
 * nothing to come back to.
 *
 * Card bodies are authored with the same markers as every other card in the
 * game — see the header of weapons.js for what each one means.
 *
 * **The twenty four potions are the designer's**, transcribed 2026-08-27 off
 * `data/Potions/` and priced off its Willpower column: see the note over the
 * potion block in UTILITY_ITEMS. They replaced everything this shelf used to
 * carry under the word potion, the Aether Draught included.
 *
 * Terra Cotta Disk is the other printed card. Druidic Tome is Jules's, handed
 * over in chat on 2026-08-20. The remaining four are stand-ins written in the
 * same voice, so there is something to fill a belt with until their own cards
 * exist.
 *
 * The cards carry art from 2026-08-20, when the one-off drop brought a picture for
 * the Druidic Tome, and from the potion drop, which brought one for each of its
 * twenty four. `art_url` is null for the rest, which is every card that has no
 * picture yet rather than a card that cannot have one.
 */

import { withArt } from './cardArt.js';
import { HIGHEST } from './attributes.js';

/* --------------------------------------------------------------- the cards */

/**
 * One card per item, named the same as the item it belongs to — reaching for
 * a potion is the whole of what a potion does.
 */
export const UTILITY_CARDS = withArt([
  /* ----- consumables ----- */
  {
    id: 'bandage-roll',
    name: 'Bandage Roll',
    kind: 'item',
    tags: ['Item', 'Consumable'],
    ap: 3,
    wp: null,
    body:
      'Bind a wound on yourself or **an entity** within **1.5 meters (5 feet)**, healing [[1d6 + level]].\n\n' +
      'The same entity cannot be bound a second time **until they have taken a Long Rest**.',
  },
  {
    id: 'smoke-vial',
    name: 'Smoke Vial',
    kind: 'item',
    tags: ['Item', 'Consumable'],
    ap: 2,
    wp: null,
    body:
      'Throw the vial at a point you can see within **9 meters (30 feet)**. It bursts into a bank of smoke **4.5 meters (15 feet)** across that hangs for **3 turns**.\n\n' +
      'Attacks made into, out of or through the smoke are made with disadvantage.',
  },

  /* ----- the potions -----
     The whole potion shelf, transcribed 2026-08-27 from `data/Potions/`: twenty
     four rows and twenty four pictures, Novice through Legendary. It **replaces**
     what was here rather than adding to it, which was Jules's own instruction:
     the eight Novice potions converted on 2026-08-24 off the old xlsx, the
     printed Healing Potion, and the Aether Draught that was a stand-in written to
     fill a belt loop. Three ids survive because the new sheet prints their names
     too (`healing-potion`, `love-potion`, `growth-elixir`), and every one of the
     three is a different row from the one it replaces.

     -------------------------------------------------------- what the columns are
     The sheet is Name, Tags, AP, WP and Main Effect:

       AP    the drinker's, printed on the card. 2 for all but three rows.
       WP    **the drinker's too, and settled by Jules on the day of the drop**:
             "The willpower is for the cost of using the poitions". So every card
             charges it, and the same column *also* sets both of the flask's
             prices, 100 coins and 10 Supplies a point. One number doing two jobs,
             which reads right: the hard potion to brew is the hard one to drink.
             See the items below, and the note over `SUPPLIES_PER_WILLPOWER` in
             alchemy.js for the ruling this reverses.
       Tags  `Item, Consumable, <rung> Potion`, which is the first time an item
             card in this codex carries a rung. `cardRung` reads the first word of
             a tag, so `Novice Potion` places the card and leaves `Potion` as its
             shelf word.

     Life Tree Tea is the one card with no Willpower on it, because its cell on
     the sheet is empty. 6 Action Points and nothing else.

     The old table's Improvised Brewing column is **not on this sheet** and its
     element dice are gone with the rows they belonged to. `brew.elements` is
     absent on all twenty four, so the recipe shelf prints no dice at all rather
     than dice somebody made up. Flagged in data/README.md.

     Two of the cells carry a note to the developer in parentheses. Neither is
     printed, because a card never carries one (docs/card-text.md section 7), and
     both are open rulings in data/README.md: POISON asks for its weapon coat to
     be tracked, and LIFE TREE TEA asks for a Long Rest that costs nothing. */

  /* ----- Novice ----- */
  {
    id: 'healing-potion',
    name: 'Healing Potion',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Novice Potion'],
    ap: 2,
    wp: 2,
    /* "Drinking this potion heals for 2d6 + five time your level." The dice and
       the scale are the sheet's; "restores X Health" is the codex's one spelling
       for a heal, and it is the unit the old card was missing. */
    body: 'Drinking this potion restores [[2d6 + 5*level]] Health.',
  },
  {
    id: 'poison',
    name: 'Poison',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Novice Potion'],
    ap: 2,
    wp: 2,
    /* Three paragraphs, and the second is the shape three rows on this sheet
       share: a concoction that can go on a blade instead of down a throat. "for
       the duraiton of combat" is left as a combat rather than a turn count, so
       the tracker holds the row without a clock on it.

       **The coat's bonus is twice the dice, not once.** The sheet said "equal to
       the number of dice rolled" and Jules doubled it on the day of the drop:
       "dobule the bonus of poison". So a swing rolling 3d6 adds 6 Decay. Still
       not wired, for the reason in data/README.md: the rider table has no field
       for a bonus that counts dice. */
    body:
      'Drinking this potion deals [[8d6 + 8*level]] {damage:Decay} damage.\n\n' +
      'This concoction can also be applied to a weapon, where it lasts for the rest of the combat.\n\n' +
      'On a hit with the weapon, you deal additional {damage:Decay} damage equal to twice the number of Damage Dice rolled.',
  },
  {
    id: 'luck-potion',
    name: 'Luck Potion',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Novice Potion'],
    ap: 2,
    wp: 4,
    body: 'Drinking this potion grants you advantage on all skill checks for **1 hour**.',
  },
  {
    id: 'growth-elixir',
    name: 'Growth Elixir',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Novice Potion'],
    ap: 2,
    wp: 4,
    /* The row changed completely. The old Growth Elixir spelled its own numbers
       out; this one hands the drinker a spell the codex already prints, so the
       card links it rather than restating it. */
    body: 'Drinking this elixir grants you the effect of the {{Giant Growth}} spell for **1 hour**.',
  },
  {
    id: 'power-draught',
    name: 'Power Draught',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Novice Potion'],
    ap: 2,
    wp: 4,
    body: 'Drinking this draught grants you advantage on all Attack Rolls for **1 hour**.',
  },
  {
    id: 'life-draught',
    name: 'Life Draught',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Novice Potion'],
    ap: 2,
    wp: 3,
    /* "increases the user's Health and Max Health by 5x level". The user is the
       drinker, so the scale is the sheet holding the card and `level` is the
       token for it. Not wired as a rider: see riders.js. */
    body:
      'Drinking this draught increases your Health and your maximum Health by [[5*level]] for **1 hour**.',
  },
  {
    id: 'defense-draught',
    name: 'Defense Draught',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Novice Potion'],
    ap: 2,
    wp: 6,
    body: 'Drinking this draught increases your Defense by 1 for **1 hour**.',
  },
  {
    id: 'explosive-concoction',
    name: 'Explosive Concoction',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Novice Potion'],
    ap: 2,
    wp: 4,
    /* Two numbers in this cell needed a reading. "up to 6 meter ()" has an empty
       parenthesis where the feet go, and 6 meters is 20 feet. "within 3 meters
       (15 feet)" is two different distances, since 3 meters is 10 feet, and the
       meters won because the codex prints a radius in meters first.

       **Confirmed by Jules on the day of the drop**: "explosion conction is 3meter
       a radius". So the parenthesis was the wrong half, and the throw range is
       still the sheet's 6. */
    body:
      'Throw the flask at a point you can see within **6 meters (20 feet)**.\n\n' +
      'It bursts into flame, and **all entities** within **3 meters (10 feet)** of the point of impact take [[8d4]] {damage:Fire} damage.',
  },

  /* ----- Adept ----- */
  {
    id: 'potion-of-disguise',
    name: 'Potion of Disguise',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Adept Potion'],
    ap: 2,
    wp: 2,
    /* The cell's last sentence, "The changes last until the effect ends", is cut:
       the duration is declared in the first paragraph and a line that only
       restates one is a line the card cannot spare. */
    body:
      'Drinking this potion allows you to alter your appearance for **3 hours**.\n\n' +
      'You can change your height by up to 30 cm (1 foot) and adjust your build to appear thinner or heavier. Your body type must remain the same, maintaining the basic arrangement of limbs. The potion’s effect does not alter your clothing, armor or belongings.',
  },
  {
    id: 'brightscale-draught',
    name: 'Brightscale Draught',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Adept Potion'],
    ap: 2,
    wp: 6,
    body:
      'Drinking this draught grants you resistance to all {damage:Lightning}, {damage:Cold} and {damage:Fire} damage for **1 hour**.',
  },
  {
    id: 'skinstone-draught',
    name: 'Skinstone Draught',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Adept Potion'],
    ap: 2,
    wp: 6,
    body:
      'Drinking this draught grants you resistance to all {damage:Sharp}, {damage:Blunt} and {damage:Force} damage for **1 hour**.',
  },
  {
    id: 'seafarers-elixir',
    name: 'Seafarer’s Elixir',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Adept Potion'],
    ap: 2,
    wp: 2,
    body:
      'Drinking this elixir grants you the ability to breathe underwater and move at your normal Movement Speed. The effect lasts for **1 hour**.',
  },
  {
    id: 'love-potion',
    name: 'Love Potion',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Adept Potion'],
    ap: 2,
    wp: 2,
    /* A different row from the Love Potion this id used to hold: that one was a
       Novice card the drinker was rolled against, this one is an Adept card the
       drinker hands the advantage to. "double advante" is advantage twice, which
       is the count TITANSBANE POISON writes from the other side. */
    body:
      'Drinking this potion makes you irresistible for **1 hour**, granting you advantage on all Rolls related to persuading or gaining favors.\n\n' +
      'Add the hair, blood or a piece of skin of **an entity** before you drink, and that entity falls in love with you instead, granting you double advantage toward it.',
  },
  {
    id: 'vulnerability-potion',
    name: 'Vulnerability Potion',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Adept Potion'],
    ap: 2,
    wp: 4,
    /* "untl your next End Turn" is the codex's Turn End, which is also the form
       the tracker reads a clock off. */
    body:
      'Drinking this potion makes you vulnerable to {damage:Sharp}, {damage:Force} and {damage:Blunt} damage for **1 hour**.\n\n' +
      'This concoction can also be applied to a weapon, where it lasts **until your next Turn End**.\n\n' +
      'On a hit with the weapon, damage dealt is calculated as if the entity were vulnerable.',
  },
  {
    id: 'elixir-of-chaos',
    name: 'Elixir of Chaos',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Adept Potion'],
    ap: 2,
    wp: 4,
    /* The ten-row table is authored as one flowing paragraph, the way STEAL's
       numbered list is: ten paragraphs would not fit the card and ten line breaks
       are not a shape this renderer has. Every name on it is a row on this sheet,
       which is what makes the list checkable. */
    body:
      'When drinking this elixir, you gain the effects of two random potions. Determine them by rolling 2d10 and reading each result against the list below.\n\n' +
      '1. Healing Potion 2. Luck Potion 3. Poison 4. Growth Elixir 5. Power Draught 6. Life Draught 7. Defense Draught 8. Explosive Concoction 9. Shrink Elixir 10. Elixir of Chaos',
  },
  {
    id: 'shrink-elixir',
    name: 'Shrink Elixir',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Adept Potion'],
    ap: 2,
    wp: 4,
    /* "the damage dice you take are empowred by while the damage dice you deal
       are depowered by 1" is missing its first number, and the symmetry answers
       it: 1 either way. "Depowered" is not a word this codex has, so the clause
       is written as one die fewer. Flagged. */
    body:
      'After drinking this elixir you shrink to one-fourth of your size for **1 hour**.\n\n' +
      'Your Defense is reduced by 2, the Damage Dice you take are Empowered by 1, and you roll one Damage Die fewer on the damage you deal.',
  },

  /* ----- Master ----- */
  {
    id: 'draught-of-cleansing',
    name: 'Draught of Cleansing',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Master Potion'],
    ap: 2,
    wp: 6,
    /* "20 turns or less" is a threshold rather than a duration, so it is not
       bolded: bold on a card is how far, at whom and for how long. */
    body: 'Drinking this draught removes all status effects on you that last 20 turns or less.',
  },
  {
    id: 'etherealness-potion',
    name: 'Etherealness Potion',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Master Potion'],
    ap: 2,
    wp: 6,
    body:
      'Drinking this potion makes you ethereal for **2 turns**.\n\n' +
      'While ethereal you cannot take any actions, but you cannot be touched or interacted with, and you are immune to all effects.',
  },
  {
    id: 'elixir-of-slime',
    name: 'Elixir of Slime',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Master Potion'],
    ap: 2,
    wp: 10,
    /* Elemental and Physical are two damage *families* rather than two of the
       codex's types, and the sheet's own rows above name what is in each:
       BRIGHTSCALE is Lightning, Cold and Fire, SKINSTONE is Sharp, Blunt and
       Force. So they stay the words the sheet wrote and are not chipped as damage
       types. */
    body:
      'Drinking this elixir turns your body and equipment into slime for **1 hour**, and you gain control over whether your body is slimy or solid.\n\n' +
      'While in this form you can occupy the same space as another entity and move through spaces as narrow as 2.5 cm (1 inch). You also gain resistance to Elemental and Physical damage.',
  },
  {
    id: 'potion-of-flying',
    name: 'Potion of Flying',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Master Potion'],
    ap: 2,
    wp: 8,
    body:
      'Drinking this potion grants you a flight speed equal to your Movement Speed for **12 hours**.',
  },
  {
    id: 'elixir-of-time',
    name: 'Elixir of Time',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Master Potion'],
    ap: 2,
    wp: 20,
    /* The longest cell on the sheet, and the one that had to be cut to fit. What
       went is the restatement: "restarting your turn" and "allows you to replay
       your turn" are one clause said twice, and "a second Elixir of Time" is the
       card naming itself where "a second dose" says the same thing. Every
       mechanic survives, which is the order the budget is spent in. */
    body:
      'Drinking this elixir activates a short time loop. At your Turn End, time rewinds and your turn starts again.\n\n' +
      'Rewinding time returns to you all resources, items and statuses as they were when you drank it, and lets you replay your turn. The rewind only affects you and does not apply to the environment or enemies. Others just see two versions of yourself acting at the same time.\n\n' +
      'A second dose within **7 days** would kill you, and the elixir used to trigger the rewind is lost.',
  },
  {
    id: 'titansbane-poison',
    name: 'Titansbane Poison',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Master Potion'],
    ap: 3,
    wp: 8,
    /* Titansbane is named on the card because the third paragraph has to point at
       it: what the weapon passes on is the affliction, not the flask. */
    body:
      'Drinking this poison afflicts you with Titansbane. Titansbane gives you two disadvantages on all actions **until you take a Long Rest**.\n\n' +
      'This concoction can also be applied to a weapon, where it lasts **until your next Turn End**.\n\n' +
      'On a hit with the weapon, the entity contracts Titansbane.',
  },
  {
    id: 'bottled-lightning',
    name: 'Bottled Lightning',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Master Potion'],
    ap: 3,
    wp: 12,
    /* "You make a highest attribute rol agaisnt thier reflex" is HIGHEST, the
       same rule the lineage and background innate spells carry: not an attribute
       but the rule that picks one. The article is left off `{stat}` for that
       reason, the way DISARM leaves it off. */
    stat: HIGHEST,
    body:
      'Throw the flask at a point you can see within **6 meters (20 feet)**. It bursts, releasing a bolt of lightning that jumps to the closest **entity** within **3 meters (10 feet)**.\n\n' +
      'Roll your {stat} {roll} against its Reflex. On a success it takes [[5d20]] {damage:Lightning} damage, or half as much on a failure.\n\n' +
      'The bolt then jumps to the closest entity within **3 meters (10 feet)** it has not affected, dealing damage and repeating this process until it cannot bounce anymore.',
  },

  /* ----- Legendary ----- */
  {
    id: 'life-tree-tea',
    name: 'Life Tree Tea',
    kind: 'item',
    tags: ['Item', 'Consumable', 'Legendary Potion'],
    ap: 6,
    wp: null,
    /* The only row on the sheet with an empty WP cell, so it is the only one with
       no brewing price and no coin price derived from one. Jules priced it
       directly at 8000.

       Its parenthesis asks for the rest to be wired: "does all the thing a long
       rest does but does not cost anything nor does it propoer a a long rst
       action". Printed as the two clauses it is, wired as nothing, and open in
       data/README.md. */
    body:
      'Drinking this tea gives you the benefit of a Long Rest. It costs no Supplies and it does not spend your Long Rest action.\n\n' +
      'A second cup within **7 days** would kill you.',
  },

  /* ----- usable ----- */
  {
    id: 'terra-cotta-disk',
    name: 'Terra Cotta Disk',
    kind: 'item',
    tags: ['Item', 'Usable'],
    ap: 9,
    wp: 30,
    body:
      'Infusing the disk with energy manifests a cart made of terracotta.\n\n' +
      'This cart can carry up to 500 kg, moves at a speed of **6 km per hour** and lasts for **12 hours**.\n\n' +
      'It moves on its own with no need for a beast of burden but only functions on smooth surfaces such as roads.\n\n' +
      'After the effect ends, you must take a Long Rest before the disk can be used again.',
  },
  {
    id: 'grappling-hook',
    name: 'Grappling Hook',
    kind: 'item',
    tags: ['Item', 'Usable'],
    ap: 2,
    wp: null,
    body:
      'Throw the hook at a ledge, beam or lip you can see within **9 meters (30 feet)**.\n\n' +
      'If it catches, the line bears 200 kg and anyone may climb it at half their Speed. Setting the hook by hand from where you already stand needs no throw at all.',
  },
  {
    id: 'storm-lantern',
    name: 'Storm Lantern',
    kind: 'item',
    tags: ['Item', 'Usable'],
    ap: 1,
    wp: null,
    body:
      'Open or close the shutter.\n\n' +
      'Open, it lights **9 meters (30 feet)** around you and burns for **6 hours** on one filling of oil. Closed, it keeps its flame and shows nothing.',
  },
  {
    /* Jules's, 2026-08-20: "a special called Druidic Tome — which the player can
       have on their utility belt. The item can be used once a day to auto succeed
       on a skill check related to nature."

       **A day, printed; a Long Rest, tracked.** The sheet has no clock and no
       calendar — Short Rest and Long Rest are the only two boundaries it knows —
       so `recharge` is the long one and the card prints the day the designer said.
       At a table that rests nightly they are the same sentence.

       No Action Points and no Willpower, the way Thief's Picks costs neither: a
       skill check is not a turn, and nothing about looking something up in a book
       is paid for in combat.

       What counts as "related to nature" is the table's, which is how every other
       domain on this sheet works — see the Background skills, where Naturalist is
       "a creature, plant, venom or disease". The card names that same ground so
       the two do not drift. */
    id: 'druidic-tome',
    name: 'Druidic Tome',
    kind: 'item',
    tags: ['Item', 'Usable'],
    ap: null,
    wp: null,
    body:
      'You look the answer up instead of guessing at it.\n\n' +
      'Once a day, you succeed automatically on a skill check to do with the natural world: a plant, a beast, a venom or disease, the weather or the ground you are standing on.\n\n' +
      'The tome is spent once it has answered, and has nothing more to say **until you have taken a Long Rest**.',
  },
  {
    id: 'thiefs-picks',
    name: "Thief's Picks",
    kind: 'item',
    tags: ['Item', 'Usable'],
    ap: null,
    wp: null,
    body:
      'Working the picks opens a mundane lock, given **1 minute**, a free hand and quiet enough to hear the pins.\n\n' +
      'A lock built against picking, or one held shut by a working, is beyond them.',
  },
]);

/* --------------------------------------------------------------- the items */

/**
 * Belt item fields on top of the shared item fields (see items.js):
 *   use       — 'consumable' | 'usable'
 *   charges   — uses it holds; absent means it never runs out
 *   recharge  — what fills its charges again (usable items only)
 *   abilities — the one card it teaches while it is on the belt
 *
 * `weight` and `cost` are the shared ones and this shelf is where the coin scale
 * was anchored: Jules's own "a healing potion is like 100 coins", and "100 coins
 * is 10 dollars". Everything mundane in the codex is priced against that.
 *
 * **The anchor row moved on 2026-08-27** and the scale did not. The potion drop
 * came with a coin rule of its own (100 a point of the sheet's Willpower, plus
 * 1000 at Adept and 2000 at Master), which prices the Healing Potion at 200 where
 * it used to be 100. Nothing else on any shelf was repriced, so the sentence
 * above is still the scale everything mundane was built on. It is just no longer
 * this row that says it. Flagged in data/README.md.
 *
 * A loop's weight and price are the one pair the belt block does not print. Five
 * loops open and full fills that block to the pixel. Both numbers are on the ⓘ
 * card and in the codex browser. See BeltBlock.jsx.
 */
export const UTILITY_ITEMS = [
  /* ----- consumables — spent, then gone ----- */
  {
    id: 'bandage-roll',
    name: 'Bandage Roll',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Field Kit'],
    use: 'consumable',
    charges: 3,
    burden: 0,
    weight: 0.3,
    cost: 60,
    abilities: ['bandage-roll'],
    blurb: 'Boiled linen wound on a wooden spool: three good bindings.',
  },
  {
    id: 'smoke-vial',
    name: 'Smoke Vial',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Alchemy'],
    use: 'consumable',
    charges: 2,
    burden: 0,
    weight: 0.3,
    cost: 200,
    abilities: ['smoke-vial'],
    blurb: 'Two thin glass bulbs in a padded sleeve. Do not sit down hard.',
  },

  /* ----- the potions -----
   * The twenty four flasks the 2026-08-27 drop brought, in the sheet's own order:
   * eight Novice, eight Adept, seven Master and the one Legendary.
   *
   * ------------------------------------------------------------------ the prices
   * **Both prices come off the sheet's Willpower column**, which is also what the
   * drinker pays (see the cards above). Jules set the coin rate in chat on the day
   * of the drop:
   *
   *     coin     = 100 x Willpower, + 1000 at Adept, + 2000 at Master
   *     Supplies = 10 x Willpower
   *
   * The Supplies rate is the one alchemy.js has carried since 2026-08-24 and is
   * unchanged. The coin rate is new and it **moves the anchor**: a Healing Potion
   * was 100 coins on this shelf and is 200 now, so the "a healing potion is like
   * 100 coins" that everything mundane in the codex was priced against is no
   * longer this row. Flagged in data/README.md.
   *
   * The rung surcharge is coin only. Nothing was said about the crate, and a
   * night's brewing is components rather than scarcity, so Supplies stays a flat
   * ten a point at every rung.
   *
   * Life Tree Tea is the exception on both counts. Its Willpower cell is empty, so
   * there is no number to multiply: Jules priced it at 8000 directly, and it
   * carries no `brew` at all.
   *
   * ------------------------------------------------------------------ the rarity
   * Not on the sheet, and read straight off the rung: Novice is Common, Adept is
   * Uncommon, Master is Rare and the tea is Legendary. Epic is skipped, which
   * leaves the ladder with a gap rather than crowding four rungs into five words.
   * The coin surcharge Jules set is the same ladder said in money, which is what
   * makes this a reading rather than a taste.
   *
   * ------------------------------------------------------------------ the weight
   * Not on the sheet either. 0.3 kg is this shelf's flask, 0.4 kg the two that are
   * thrown and the two heaviest elixirs, and the Healing Potion keeps the 0.5 kg it
   * has always had rather than being quietly relabelled underneath somebody's
   * pack.
   *
   * `brew` is `{ tier, supplies }` and no longer carries `elements`: the new sheet
   * has no Improvised Brewing column. `elementLine` gives back null for all of
   * them, so the recipe shelf prints the price and nothing else.
   */

  /* ----- Novice ----- */
  {
    id: 'healing-potion',
    name: 'Healing Potion',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.5,
    cost: 200,
    brew: { tier: 'Novice', supplies: 20 },
    abilities: ['healing-potion'],
    blurb: 'A stoppered flask of red glass, warm through the palm.',
    lore:
      'Every apothecary between here and the coast sells the same red flask, and every one of them swears theirs is the older recipe.\n\n' +
      'It is not. The recipe is four hundred years old and belongs to nobody.',
  },
  {
    id: 'poison',
    name: 'Poison',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 200,
    brew: { tier: 'Novice', supplies: 20 },
    abilities: ['poison'],
    blurb: 'Standing-water green, with silt that turns over when you lift it.',
    lore:
      'Cheap to make, cheap to buy and the one thing on the shelf nobody asks a second question about.\n\n' +
      'It is sold for the blade. It is bought, now and then, for the cup.',
  },
  {
    id: 'luck-potion',
    name: 'Luck Potion',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 400,
    brew: { tier: 'Novice', supplies: 40 },
    abilities: ['luck-potion'],
    blurb: 'Clear gold with a four-leaf clover hanging dead centre, as though it had been placed.',
  },
  {
    id: 'growth-elixir',
    name: 'Growth Elixir',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.4,
    cost: 400,
    brew: { tier: 'Novice', supplies: 40 },
    abilities: ['growth-elixir'],
    blurb: 'Bright green and restless, coiling up the inside of the glass like something trying to stand.',
  },
  {
    id: 'power-draught',
    name: 'Power Draught',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 400,
    brew: { tier: 'Novice', supplies: 40 },
    abilities: ['power-draught'],
    blurb: 'Deep red under a cork bound in black sinew.',
  },
  {
    id: 'life-draught',
    name: 'Life Draught',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 300,
    brew: { tier: 'Novice', supplies: 30 },
    abilities: ['life-draught'],
    blurb: 'Warm amber that throws its own light, going to green at the shoulder of the bottle.',
  },
  {
    id: 'defense-draught',
    name: 'Defense Draught',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 600,
    brew: { tier: 'Novice', supplies: 60 },
    abilities: ['defense-draught'],
    blurb: 'Grey smoke turning slowly in the flask, the colour of a wall.',
  },
  {
    id: 'explosive-concoction',
    name: 'Explosive Concoction',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.4,
    cost: 400,
    brew: { tier: 'Novice', supplies: 40 },
    abilities: ['explosive-concoction'],
    blurb: 'Molten orange behind hot glass, with a thread of smoke getting out past the cork.',
  },

  /* ----- Adept ----- */
  {
    id: 'potion-of-disguise',
    name: 'Potion of Disguise',
    slots: ['belt'],
    tags: ['Uncommon', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 1200,
    brew: { tier: 'Adept', supplies: 20 },
    abilities: ['potion-of-disguise'],
    blurb: 'Violet smoke with nothing settled in it. Held up to the light, it shows a face that is nearly yours.',
  },
  {
    id: 'brightscale-draught',
    name: 'Brightscale Draught',
    slots: ['belt'],
    tags: ['Uncommon', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 1600,
    brew: { tier: 'Adept', supplies: 60 },
    abilities: ['brightscale-draught'],
    blurb: 'An oil-slick sheen over a single scale, and the scale throws every colour it is shown.',
  },
  {
    id: 'skinstone-draught',
    name: 'Skinstone Draught',
    slots: ['belt'],
    tags: ['Uncommon', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 1600,
    brew: { tier: 'Adept', supplies: 60 },
    abilities: ['skinstone-draught'],
    blurb: 'Ochre and heavy, with grit in it that never quite settles.',
  },
  {
    id: 'seafarers-elixir',
    name: 'Seafarer’s Elixir',
    slots: ['belt'],
    tags: ['Uncommon', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 1200,
    brew: { tier: 'Adept', supplies: 20 },
    abilities: ['seafarers-elixir'],
    blurb: 'Sea green and forever foaming, as though the tide were still working on it.',
  },
  {
    id: 'love-potion',
    name: 'Love Potion',
    slots: ['belt'],
    tags: ['Uncommon', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 1200,
    brew: { tier: 'Adept', supplies: 20 },
    abilities: ['love-potion'],
    blurb: 'Rose pink and lit from inside, throwing its colour onto whatever it is set down on.',
    lore:
      'Sold under the counter, brewed for a laugh and regretted at length. Nobody has ever been talked out of buying one.\n\n' +
      'It wears off in an hour. What was said in that hour does not.',
  },
  {
    id: 'vulnerability-potion',
    name: 'Vulnerability Potion',
    slots: ['belt'],
    tags: ['Uncommon', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 1400,
    brew: { tier: 'Adept', supplies: 40 },
    abilities: ['vulnerability-potion'],
    blurb: 'Thin violet, cold to hold, and it does not catch the light at all.',
  },
  {
    id: 'elixir-of-chaos',
    name: 'Elixir of Chaos',
    slots: ['belt'],
    tags: ['Uncommon', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 1400,
    brew: { tier: 'Adept', supplies: 40 },
    abilities: ['elixir-of-chaos'],
    blurb: 'A dark spiral with a dozen colours caught in it, none of them staying where they were.',
  },
  {
    id: 'shrink-elixir',
    name: 'Shrink Elixir',
    slots: ['belt'],
    tags: ['Uncommon', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 1400,
    brew: { tier: 'Adept', supplies: 40 },
    abilities: ['shrink-elixir'],
    blurb: 'A teal mist in a flask that looks further away than it is.',
  },

  /* ----- Master ----- */
  {
    id: 'draught-of-cleansing',
    name: 'Draught of Cleansing',
    slots: ['belt'],
    tags: ['Rare', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 2600,
    brew: { tier: 'Master', supplies: 60 },
    abilities: ['draught-of-cleansing'],
    blurb: 'White light in a bottle, warm to the touch through the glass.',
  },
  {
    id: 'etherealness-potion',
    name: 'Etherealness Potion',
    slots: ['belt'],
    tags: ['Rare', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 2600,
    brew: { tier: 'Master', supplies: 60 },
    abilities: ['etherealness-potion'],
    blurb: 'Pale cyan wisps that never touch the sides of the bottle.',
  },
  {
    id: 'elixir-of-slime',
    name: 'Elixir of Slime',
    slots: ['belt'],
    tags: ['Rare', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.4,
    cost: 3000,
    brew: { tier: 'Master', supplies: 100 },
    abilities: ['elixir-of-slime'],
    blurb: 'Green globs that pull apart and find each other again, with roots knotted under the cork.',
  },
  {
    id: 'potion-of-flying',
    name: 'Potion of Flying',
    slots: ['belt'],
    tags: ['Rare', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 2800,
    brew: { tier: 'Master', supplies: 80 },
    abilities: ['potion-of-flying'],
    blurb: 'A bottled overcast, and lighter in the hand than a bottle should be.',
  },
  {
    id: 'elixir-of-time',
    name: 'Elixir of Time',
    slots: ['belt'],
    tags: ['Rare', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.4,
    cost: 4000,
    brew: { tier: 'Master', supplies: 200 },
    abilities: ['elixir-of-time'],
    blurb: 'A black and gold spiral turning the wrong way, dried roots bound under the cork.',
    lore:
      'The most expensive thing on any apothecary’s shelf and the only one they will not let you hold.\n\n' +
      'Everyone who has drunk two is dead, which is how the rule about seven days came to be written down at all.',
  },
  {
    id: 'titansbane-poison',
    name: 'Titansbane Poison',
    slots: ['belt'],
    tags: ['Rare', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 2800,
    brew: { tier: 'Master', supplies: 80 },
    abilities: ['titansbane-poison'],
    blurb: 'A green glow over something darker, sealed with wax and wound about with wire.',
    lore:
      'Brewed for the things too big to fight, and it works on them. It works on you first.\n\n' +
      'The name is a promise about the target. It says nothing at all about the one holding the flask.',
  },
  {
    id: 'bottled-lightning',
    name: 'Bottled Lightning',
    slots: ['belt'],
    tags: ['Rare', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.4,
    cost: 3200,
    brew: { tier: 'Master', supplies: 120 },
    abilities: ['bottled-lightning'],
    blurb: 'A live bolt, forked and bright, held in plain glass that is not warm.',
  },

  /* ----- Legendary ----- */
  {
    id: 'life-tree-tea',
    name: 'Life Tree Tea',
    slots: ['belt'],
    tags: ['Legendary', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    /* Jules's own number, and the only price on this shelf that is not 100 a point
       of Willpower: the sheet's Willpower cell is empty for this row. No `brew`
       either, for the same reason and one more of its own. ALCHEMY's ladder tops
       out at Master, so no rank of it opens a Legendary tier to put a price on. */
    cost: 8000,
    abilities: ['life-tree-tea'],
    blurb: 'Steeped leaves in honey-coloured water, a paper tag knotted at the neck. Still warm.',
    lore:
      'One tree, and nobody agrees where. The leaves are traded on by people who have never seen it and would not survive the walk.\n\n' +
      'A cup of it is a night nobody had to stop for. Two cups is the last night you get.',
  },

  /* ----- usable — they stay on the belt ----- */
  {
    id: 'terra-cotta-disk',
    name: 'Terra Cotta Disk',
    slots: ['belt'],
    tags: ['Rare', 'Usable', 'Relic'],
    use: 'usable',
    charges: 1,
    recharge: 'Long Rest',
    burden: 0,
    weight: 0.4,
    cost: 2500,
    abilities: ['terra-cotta-disk'],
    blurb: 'A fired clay medallion, hatched with the plan of a cart.',
    lore:
      'Road-makers carried these by the crate, and the roads they left behind are the only ground the carts will still run on.\n\n' +
      'A disk that has thrown its cart is cold to hold, and stays cold until its bearer has slept.',
  },
  {
    id: 'grappling-hook',
    name: 'Grappling Hook',
    slots: ['belt'],
    tags: ['Common', 'Usable', 'Tool'],
    use: 'usable',
    burden: 0,
    weight: 2.5,
    cost: 120,
    abilities: ['grappling-hook'],
    blurb: 'Three folding flukes and thirty feet of waxed line.',
  },
  {
    id: 'storm-lantern',
    name: 'Storm Lantern',
    slots: ['belt'],
    tags: ['Common', 'Usable', 'Tool'],
    use: 'usable',
    burden: 0,
    weight: 1.5,
    cost: 150,
    abilities: ['storm-lantern'],
    blurb: 'A shuttered lamp that keeps its flame in any wind.',
  },
  {
    id: 'druidic-tome',
    name: 'Druidic Tome',
    slots: ['belt'],
    tags: ['Rare', 'Usable', 'Relic'],
    use: 'usable',
    charges: 1,
    recharge: 'Long Rest',
    burden: 0,
    weight: 2,
    cost: 2000,
    abilities: ['druidic-tome'],
    blurb: 'A living book: bark boards, pressed leaves and an index that rearranges itself.',
    lore:
      'Circle work, copied out of the standing groves and never twice the same way. Two tomes opened side by side will not agree on their page numbers and will agree on every answer.\n\n' +
      'It gives one a day and no more. Pressed for a second, the leaves close over the page and the book smells strongly of wet earth.',
  },
  {
    id: 'thiefs-picks',
    name: "Thief's Picks",
    slots: ['belt'],
    tags: ['Uncommon', 'Usable', 'Tool'],
    use: 'usable',
    burden: 0,
    weight: 0.2,
    cost: 300,
    abilities: ['thiefs-picks'],
    blurb: 'A leather fold of hooks and tension bars, worn bright at the tips.',
  },
];
