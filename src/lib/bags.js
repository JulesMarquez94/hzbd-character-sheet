/**
 * Bags — the one thing you wear that holds nothing of its own and decides how
 * much everything else may weigh.
 *
 * Every other shelf in the codex is here for what it does to a fight: armor
 * moves Defense, a weapon teaches two cards, a belt item has a card and a
 * charge count. A bag does nothing at all in a fight. What it does is raise the
 * ceiling `carryCapacity` measures against, which is the only number on this
 * sheet a character can be *under* rather than over.
 *
 * ------------------------------------------------------------------- the slot
 * `bag` is in the equipment map, unlike the belt and the trinkets: there is one
 * of it and it is one place, which is exactly what that map is for. It sits above
 * the blocks on the Inventory tab rather than inside one, because it is the only
 * slot on the sheet whose answer is about the whole tab.
 *
 * ------------------------------------------------------------------ the ladder
 * Seven rungs, and one number sets two of the three columns:
 *
 *   capacity   5, 10, 15, 20, 30, 40, 50 kilograms
 *   cost       20 coins a kilogram of it, so 100 at the bottom and 1000 at the top
 *
 * Fives to twenty and tens after, which is the shape of a ladder that is cheap to
 * climb early and expensive to finish. The price is the capacity and nothing
 * else: no rung surcharge, no rarity multiplier. A bag is worth exactly what it
 * lets you carry.
 *
 * **Common is craft and everything from Uncommon up is magic.** That break is the
 * whole naming scheme. The three at the bottom are canvas, leather and ash, they
 * carry what a person can strap to their back and they weigh what those materials
 * weigh. The four above them are Pockets, and a Pocket is a pouch folded through
 * itself: the number in the name says how many times, and how many times says how
 * much is behind the seam. Twofold, Threefold, Fivefold, Ninefold.
 *
 * The two ladders run opposite ways on the third column. A craft bag gets heavier
 * as it gets bigger, because more room is more canvas. A Pocket gets *lighter*,
 * because the deeper it folds the less of it is actually here: a Ninefold holds
 * fifty kilos and rides on a belt loop at three hundred grams.
 *
 * ------------------------------------------------------------------- the tags
 * `Relic` is the codex's word for a piece that is magic without anybody having
 * worked it, and the belt already uses it: the Terra Cotta Disk and the Druidic
 * Tome both carry it. The four Pockets take the same word, the three craft bags
 * do not, and the browser gets one chip that sorts the shelf in half.
 *
 * They still carry no Magic Burden, and becoming magic did not change that. What
 * costs Burden is a *working*, laid at a forge or at a rest, and nothing here is
 * worked: a Pocket is folded, the way a Relic is found rather than made. The
 * Runed armor set settled the shape of that argument already, and both Relics on
 * the belt carry no Burden either.
 *
 * ------------------------------------------------------------------ the fields
 *   capacity — kilograms added to what the wearer may carry
 *   weight   — what the bag itself weighs, counted like everything else
 *   cost     — what it is worth in coin
 *
 * A bag's own weight counts against the capacity it grants, which is why the
 * craft three are a worse deal than their numbers first suggest: an Ash Frame is
 * 15 kg of room and 3 kg of frame. A Ninefold Pocket is 50 kg of room and a third
 * of one kilo of pouch, and that gap is the whole argument for the magic half.
 *
 * -------------------------------------------------------------------- the ids
 * Three ids were retired when the ladder was redrawn on 2026-08-28.
 * `porters-frame` is the Ash Frame now and Common rather than Uncommon, because
 * a bag with nothing magic about it cannot sit above the line that says magic
 * starts here. `quartermasters-pack` and `hollowed-satchel` are the Threefold and
 * the Fivefold. An id is what a saved character points at, so a sheet wearing one
 * of those three finds its bag slot empty and its capacity back down to Physique
 * alone. `canvas-satchel`, `leather-rucksack` and `ninefold-pocket` kept theirs.
 *
 * This file is data. It imports nothing.
 */

export const BAG_ITEMS = [
  /* ----- craft: what you can buy in any market town ----- *
   * Three Commons, and every one of them is somebody's day job rather than
   * anybody's discovery.
   */
  {
    id: 'canvas-satchel',
    name: 'Canvas Satchel',
    slots: ['bag'],
    tags: ['Common', 'Bag', 'Slung'],
    burden: 0,
    capacity: 5,
    weight: 0.4,
    cost: 100,
    blurb: 'Waxed canvas on one strap. It holds a day and not much more.',
  },
  {
    id: 'leather-rucksack',
    name: 'Leather Rucksack',
    slots: ['bag'],
    tags: ['Common', 'Bag', 'Worn'],
    burden: 0,
    capacity: 10,
    weight: 1.5,
    cost: 200,
    blurb: 'Two straps, a storm flap and a week of road in it.',
  },
  {
    id: 'ash-frame',
    name: 'Ash Frame',
    slots: ['bag'],
    tags: ['Common', 'Bag', 'Worn'],
    burden: 0,
    capacity: 15,
    weight: 3,
    cost: 300,
    blurb: 'A bent ash frame that puts the load on your hips. Nothing magic about it: it is just built right.',
    lore:
      'Dock work, mountain work, siege work. Anywhere a load has to go where a cart cannot, somebody is wearing one of these and complaining about it.\n\n' +
      'It is the heaviest thing on the shelf and the only unworked bag that makes a full load bearable. Porters say you feel the three kilos for the first hour and never again.',
  },

  /* ----- magic: the folded four ----- *
   * One family, and the number in the name is the ladder. Each fold puts more
   * of the pouch somewhere else, so each one holds more and weighs less than the
   * one below it, and each is further past the point where that is still a nice
   * trick rather than an unsettling one.
   */
  {
    id: 'twofold-pocket',
    name: 'Twofold Pocket',
    slots: ['bag'],
    tags: ['Uncommon', 'Bag', 'Relic', 'Slung'],
    burden: 0,
    capacity: 20,
    weight: 1.2,
    cost: 400,
    blurb: 'A belt pouch with a second pouch behind it, and no seam between the two.',
    lore:
      'The first rung of the work and the only one a living hand can still manage. A journeyman folds a pouch once, sews the mouth shut and sits over it for a night.\n\n' +
      'Two in three come out as pouches. The third comes out as nothing at all, which is most of what you are paying for.',
  },
  {
    id: 'threefold-pocket',
    name: 'Threefold Pocket',
    slots: ['bag'],
    tags: ['Rare', 'Bag', 'Relic', 'Slung'],
    burden: 0,
    capacity: 30,
    weight: 0.9,
    cost: 600,
    blurb: 'Folded three times. Reach past the second and the air changes.',
    lore:
      'Issued rather than sold, and the issuing stopped a long time ago. Quartermasters signed for them by number and accounted for them by name. A few of those ledgers survive, and the pockets in them are still being carried.\n\n' +
      'The third fold is where the work stops being a convenience. Anything left in overnight comes back cold.',
  },
  {
    id: 'fivefold-pocket',
    name: 'Fivefold Pocket',
    slots: ['bag'],
    tags: ['Epic', 'Bag', 'Relic', 'Slung'],
    burden: 0,
    capacity: 40,
    weight: 0.6,
    cost: 800,
    blurb: 'A plain pouch with a room behind the mouth. It weighs the same full as empty.',
    lore:
      'Nobody living folds one this far. What is past the fourth is not inside the pouch at all, which is why the strap never bites however much goes in.\n\n' +
      'The one rule its keepers pass on is the one everybody wants to test: do not climb in after something. Two people have. Neither came back out, and the pockets they were carrying were found closed.',
  },
  {
    id: 'ninefold-pocket',
    name: 'Ninefold Pocket',
    slots: ['bag'],
    tags: ['Legendary', 'Bag', 'Relic', 'Slung'],
    burden: 0,
    capacity: 50,
    weight: 0.3,
    cost: 1000,
    blurb: 'A pouch the size of two fists, folded through itself nine times.',
    lore:
      'You could lose it in a coat. Reach past the third fold and your arm is somewhere with its own cold air, and past the sixth there is a floor under your fingers that the pouch has no business having.\n\n' +
      'Nobody has ever reached the ninth. The people who study these things have stopped saying that as a challenge, because of what happened the last three times they said it as one.',
  },
];
