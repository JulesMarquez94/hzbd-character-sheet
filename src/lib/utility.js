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
 * Healing Potion and Terra Cotta Disk are the printed cards. Druidic Tome is
 * Jules's, handed over in chat on 2026-08-20. The rest are stand-ins written in
 * the same voice, so there is something to fill a belt with until their own cards
 * exist.
 *
 * The cards carry art from 2026-08-20, when the one-off drop brought a picture for
 * the Druidic Tome. `art_url` is null for the rest, which is every card that has
 * no picture yet rather than a card that cannot have one.
 */

import { withArt } from './cardArt.js';

/* --------------------------------------------------------------- the cards */

/**
 * One card per item, named the same as the item it belongs to — reaching for
 * a potion is the whole of what a potion does.
 */
export const UTILITY_CARDS = withArt([
  /* ----- consumables ----- */
  {
    id: 'healing-potion',
    name: 'Healing Potion',
    kind: 'item',
    tags: ['Item', 'Consumable'],
    ap: 2,
    wp: 2,
    body: 'Drinking this potion heals for [[2d6 + 5*level]].',
  },
  {
    id: 'aether-draught',
    name: 'Aether Draught',
    kind: 'item',
    tags: ['Item', 'Consumable'],
    ap: 2,
    wp: null,
    body:
      'Drinking this draught restores [[1d6 + 2*level]] Willpower.\n\n' +
      'A second draught taken before your next Long Rest does nothing at all.',
  },
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

  /* ----- the Alchemist's Novice potions -----
     The old Novice Potions table, converted 2026-08-24. Seven rows out of the
     eight: the Intellect potion and the Wits potion both fold into POTION OF
     MIND, because the site has three attributes where the old system had four.

     Every one of them is 2 Action Points and no Willpower. The Willpower the old
     table printed was the *brewer's* price, and this pass turns that into the
     Supplies a brew costs (see `brew` on each item below, and alchemy.js). A
     drinker charged it again would be paying for the flask twice.

     They scale off whoever holds the card. The old table said "the crafter’s
     Spellpower" and the site has nowhere on an item instance to keep a brewer’s
     number, which is what the conversion pass flagged amber. The Healing Potion
     above already scales on whoever drinks it, so these do too. Flagged in
     data/README.md. */
  {
    id: 'healing-draught',
    name: 'Healing Draught',
    kind: 'item',
    tags: ['Item', 'Consumable'],
    ap: 2,
    wp: null,
    stat: 'mind',
    body: 'Drinking this draught restores [[1d6 + stat]] Health.',
  },
  {
    id: 'flame-burst-flask',
    name: 'Flame Burst Flask',
    kind: 'item',
    tags: ['Item', 'Consumable'],
    ap: 2,
    wp: null,
    stat: 'mind',
    body:
      'Throw the flask at a point you can see within **9 meters (30 feet)**. It breaks on contact, and **every entity** within **3 meters (10 feet)** takes [[1d6 + stat]] {damage:Fire} damage.\n\n' +
      'The flames stay for **3 turns**. **An entity** that starts its turn in them takes the same again.',
  },
  {
    id: 'potion-of-physique',
    name: 'Potion of Physique',
    kind: 'item',
    tags: ['Item', 'Consumable'],
    ap: 2,
    wp: null,
    stat: 'mind',
    body: 'Drinking this potion increases your {physique} by 2 for **1 hour**.',
  },
  {
    id: 'potion-of-instinct',
    name: 'Potion of Instinct',
    kind: 'item',
    tags: ['Item', 'Consumable'],
    ap: 2,
    wp: null,
    stat: 'mind',
    body: 'Drinking this potion increases your {instinct} by 2 for **1 hour**.',
  },
  {
    id: 'potion-of-mind',
    name: 'Potion of Mind',
    kind: 'item',
    tags: ['Item', 'Consumable'],
    ap: 2,
    wp: null,
    stat: 'mind',
    body: 'Drinking this potion increases your {mind} by 2 for **1 hour**.',
  },
  {
    id: 'love-potion',
    name: 'Love Potion',
    kind: 'item',
    tags: ['Item', 'Consumable'],
    ap: 2,
    wp: null,
    stat: 'mind',
    body:
      'When **an entity** drinks this potion, make a {mind} Roll {roll} against its Grit.\n\n' +
      'On a success, for **1 hour** the drinker holds you as a trusted ally and is ready to do what it must to help you, so long as it does not put the drinker in harm.',
  },
  {
    id: 'growth-elixir',
    name: 'Growth Elixir',
    kind: 'item',
    tags: ['Item', 'Consumable'],
    ap: 2,
    wp: null,
    stat: 'mind',
    body:
      'Drinking this elixir adds **2 meters (6 feet)** to your height and massively increases your muscle mass for **1 hour**.\n\n' +
      'While it lasts your {physique} is increased by 5, your Movement Speed by 4 and your Defense by 2, and your {instinct} is reduced by 5.',
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
 * is anchored: Jules's own "a healing potion is like 100 coins", and "100 coins
 * is 10 dollars". Everything mundane in the codex is priced against that.
 *
 * A loop's weight and price are the one pair the belt block does not print. Five
 * loops open and full fills that block to the pixel. Both numbers are on the ⓘ
 * card and in the codex browser. See BeltBlock.jsx.
 */
export const UTILITY_ITEMS = [
  /* ----- consumables — spent, then gone ----- */
  {
    id: 'healing-potion',
    name: 'Healing Potion',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.5,
    cost: 100,
    abilities: ['healing-potion'],
    blurb: 'A stoppered flask of red glass, warm through the palm.',
    lore:
      'Every apothecary between here and the coast sells the same red flask, and every one of them swears theirs is the older recipe.\n\n' +
      'It is not. The recipe is four hundred years old and belongs to nobody.',
  },
  {
    id: 'aether-draught',
    name: 'Aether Draught',
    slots: ['belt'],
    tags: ['Uncommon', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.4,
    cost: 250,
    abilities: ['aether-draught'],
    blurb: 'Clear liquid that will not sit still in the bottle.',
  },
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

  /* ----- the Alchemist's Novice potions -----
   * `brew` is what puts a thing on an Alchemist’s shelf, and it is the only new
   * field on this file. Three keys and nothing computed:
   *
   *   tier      which rung of ALCHEMY opens it, read the way an Ingredient tier
   *             and an enchantment tier are.
   *   supplies  what its components cost out of the crate, the night it is
   *             brewed. See alchemy.js for where the number came from.
   *   elements  the dice IMPROVISED BREWING asks for, off the old table’s own
   *             column. `X` is any one of them. Printed on the recipe shelf and
   *             nowhere else, because it is a rule only an Alchemist reads.
   *
   * An item with no `brew` cannot be brewed by anybody, which is every other row
   * on this shelf. Nothing else in the codex carries one yet.
   */
  {
    id: 'healing-draught',
    name: 'Healing Draught',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 100,
    brew: { tier: 'Novice', supplies: 20, elements: ['X', 'X'] },
    abilities: ['healing-draught'],
    blurb: 'A slim apothecary bottle of pale rose liquid, a paper label tied at the neck.',
    lore:
      'The first thing a still is ever put to, and the first thing an alchemist gets wrong. A bad one tastes of iron and does nothing at all.\n\n' +
      'A good one is worth what it took, which was never very much.',
  },
  {
    id: 'flame-burst-flask',
    name: 'Flame Burst Flask',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.4,
    cost: 150,
    brew: { tier: 'Novice', supplies: 30, elements: ['X', 'X'] },
    abilities: ['flame-burst-flask'],
    blurb: 'A round clay flask, orange light showing through a hairline crack.',
  },
  {
    id: 'potion-of-physique',
    name: 'Potion of Physique',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 150,
    brew: { tier: 'Novice', supplies: 30, elements: ['X', 'Earth'] },
    abilities: ['potion-of-physique'],
    blurb: 'A heavy stoppered bottle of thick amber liquid, iron banding around the glass.',
  },
  {
    id: 'potion-of-instinct',
    name: 'Potion of Instinct',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 150,
    brew: { tier: 'Novice', supplies: 30, elements: ['X', 'Water'] },
    abilities: ['potion-of-instinct'],
    blurb: 'A narrow bottle of clear green liquid that moves faster than it should.',
  },
  {
    id: 'potion-of-mind',
    name: 'Potion of Mind',
    slots: ['belt'],
    tags: ['Common', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.3,
    cost: 150,
    /* Two rows of the old table fold into this one, so it takes either of their
       dice: the Intellect potion asked for a Fire and the Wits potion for a Wind.
       This is the one place an element slot is a choice, and the shelf prints it
       as "Fire or Wind". */
    brew: { tier: 'Novice', supplies: 30, elements: ['X', 'Fire|Wind'] },
    abilities: ['potion-of-mind'],
    blurb: 'A faceted vial of luminous violet liquid, faint motes turning inside it.',
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
    cost: 100,
    brew: { tier: 'Novice', supplies: 20, elements: ['Earth', 'Water', 'Water'] },
    abilities: ['love-potion'],
    blurb: 'A small heart-stoppered flask, a dried flower pressed against the inside of the glass.',
    lore:
      'Sold under the counter, brewed for a laugh and regretted at length. Nobody has ever been talked out of buying one.\n\n' +
      'It wears off in an hour. What was said in that hour does not.',
  },
  {
    id: 'growth-elixir',
    name: 'Growth Elixir',
    slots: ['belt'],
    tags: ['Rare', 'Consumable', 'Potion'],
    use: 'consumable',
    charges: 1,
    burden: 0,
    weight: 0.4,
    cost: 200,
    brew: { tier: 'Novice', supplies: 40, elements: ['Wind', 'Wind', 'Wind'] },
    abilities: ['growth-elixir'],
    blurb: 'A tall bottle of murky brown elixir, far too large for the crate it is sitting in.',
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
