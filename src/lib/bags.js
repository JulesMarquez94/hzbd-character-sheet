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
 * Six of them, and the ladder runs on two axes at once. The mundane three carry
 * what a person can strap to their back and weigh what canvas, leather and ash
 * weigh. The worked three carry more than they should and weigh less than they
 * look, which is the whole trick of them: a Ninefold Pocket holds eighty kilos
 * and rides on a belt loop.
 *
 * They carry no Magic Burden, on the codex's own law: what costs Burden is a
 * *working*, laid at a forge or at a rest, and nothing here is worked. The Runed
 * armor set settled that already. It shields a Shield's worth of Mind and weighs
 * nothing on the meter either.
 *
 * ------------------------------------------------------------------ the fields
 *   capacity — kilograms added to what the wearer may carry
 *   weight   — what the bag itself weighs, counted like everything else
 *   cost     — what it is worth in coin
 *
 * A bag's own weight counts against the capacity it grants, which is why the
 * mundane ones are a worse deal than their numbers first suggest: a Porter's
 * Frame is 22 kg of room and 3 kg of frame.
 *
 * This file is data. It imports nothing.
 */

export const BAG_ITEMS = [
  /* ----- what you can buy in any market town ----- */
  {
    id: 'canvas-satchel',
    name: 'Canvas Satchel',
    slots: ['bag'],
    tags: ['Common', 'Bag', 'Slung'],
    burden: 0,
    capacity: 5,
    weight: 0.4,
    cost: 40,
    blurb: 'Waxed canvas on one strap. It holds a day and not much more.',
  },
  {
    id: 'leather-rucksack',
    name: 'Leather Rucksack',
    slots: ['bag'],
    tags: ['Common', 'Bag', 'Worn'],
    burden: 0,
    capacity: 12,
    weight: 1.5,
    cost: 120,
    blurb: 'Two straps, a storm flap and a week of road in it.',
  },
  {
    id: 'porters-frame',
    name: "Porter's Frame",
    slots: ['bag'],
    tags: ['Uncommon', 'Bag', 'Worn'],
    burden: 0,
    capacity: 22,
    weight: 3,
    cost: 600,
    blurb: 'An ash frame that puts the load on your hips. Nothing magic about it: it is just built right.',
    lore:
      'Dock work, mountain work, siege work. Anywhere a load has to go where a cart cannot, somebody is wearing one of these and complaining about it.\n\n' +
      'The frame is the heaviest bag on any shelf and the only one that makes a full load bearable. Porters say you feel the three kilos for the first hour and never again.',
  },

  /* ----- and the worked ones ----- *
   * Bigger inside than out, and each one further past the point where that is
   * still a nice trick rather than an unsettling one.
   */
  {
    id: 'quartermasters-pack',
    name: "Quartermaster's Pack",
    slots: ['bag'],
    tags: ['Rare', 'Bag', 'Worn'],
    burden: 0,
    capacity: 35,
    weight: 2,
    cost: 2500,
    blurb: 'Nine outer pockets, each one deeper than the cloth it is sewn into.',
    lore:
      'Issued rather than sold, and the issuing stopped a long time ago. The pockets are the work: each is a hand deep from the outside and an arm deep from the inside.\n\n' +
      'Quartermasters were made to sign for them by number and to account for them by name. A few of those ledgers survive, and the packs in them are still being carried.',
  },
  {
    id: 'hollowed-satchel',
    name: 'Hollowed Satchel',
    slots: ['bag'],
    tags: ['Epic', 'Bag', 'Slung'],
    burden: 0,
    capacity: 55,
    weight: 1,
    cost: 7000,
    blurb: 'A plain shoulder bag with a room behind the flap. It weighs the same full as empty.',
    lore:
      'The hollowing is old work and nobody living does it. What is behind the flap is not inside the bag, which is why the strap never bites however much goes in.\n\n' +
      'The one rule its keepers pass on is the one everybody wants to test: do not climb in after something. Two people have. Neither came back out, and the satchels they were carrying were found closed.',
  },
  {
    id: 'ninefold-pocket',
    name: 'Ninefold Pocket',
    slots: ['bag'],
    tags: ['Legendary', 'Bag', 'Slung'],
    burden: 0,
    capacity: 80,
    weight: 0.5,
    cost: 15000,
    blurb: 'A pouch the size of two fists, folded through itself nine times.',
    lore:
      'It is a pouch. You could lose it in a coat. Reach past the third fold and your arm is somewhere with its own cold air, and past the sixth there is a floor under your fingers that the pouch has no business having.\n\n' +
      'Nobody has ever reached the ninth. The people who study these things have stopped saying that as a challenge, because of what happened the last three times they said it as one.',
  },
];
