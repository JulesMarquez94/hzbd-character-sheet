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
      'Bind a wound on yourself or an entity within 1.5 meters (5 feet), healing [[1d6 + level]].\n\n' +
      'The same entity cannot be bound a second time until they have taken a Long Rest.',
  },
  {
    id: 'smoke-vial',
    name: 'Smoke Vial',
    kind: 'item',
    tags: ['Item', 'Consumable'],
    ap: 2,
    wp: null,
    body:
      'Throw the vial at a point you can see within 9 meters (30 feet). It bursts into a bank of smoke 4.5 meters (15 feet) across that hangs for 3 turns.\n\n' +
      'Attacks made into, out of or through the smoke are made with Disadvantage.',
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
      'This cart can carry up to 500 kg, moves at a speed of 6 km per hour and lasts for 12 hours.\n\n' +
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
      'Throw the hook at a ledge, beam or lip you can see within 9 meters (30 feet).\n\n' +
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
      'Open, it lights 9 meters (30 feet) around you and burns for 6 hours on one filling of oil. Closed, it keeps its flame and shows nothing.',
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
      'The tome is spent once it has answered, and has nothing more to say until you have taken a Long Rest.',
  },
  {
    id: 'thiefs-picks',
    name: "Thief's Picks",
    kind: 'item',
    tags: ['Item', 'Usable'],
    ap: null,
    wp: null,
    body:
      'Working the picks opens a mundane lock, given 1 minute, a free hand and quiet enough to hear the pins.\n\n' +
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
    abilities: ['smoke-vial'],
    blurb: 'Two thin glass bulbs in a padded sleeve. Do not sit down hard.',
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
    abilities: ['thiefs-picks'],
    blurb: 'A leather fold of hooks and tension bars, worn bright at the tips.',
  },
];
