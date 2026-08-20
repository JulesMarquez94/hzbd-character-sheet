/**
 * Trinkets — the rings, chains and cloaks that hang off a character and do
 * nothing at all.
 *
 * Every other shelf in the codex is here because it *does* something: armor
 * moves Defense, a weapon teaches two cards, a belt item has a card and a
 * charge count. These twelve have no numbers, no cards and no rules text, and
 * that is the whole point of them.
 *
 * ------------------------------------------------------------------ why they exist
 * An enchantment has to be laid on *something*. Before this shelf existed the
 * only things a character could carry were pieces they were already wearing for
 * their own sake, so every working competed with a breastplate for a slot. A
 * trinket is the empty vessel: you wear a silver ring because it will hold a
 * Primal Sense, not because a silver ring is worth wearing.
 *
 * So the codex list is deliberately mundane — a copper band, a wool cloak, a
 * locket. What makes one worth having is what somebody puts into it, and that is
 * the forge's business (see `src/lib/forged.js`), not this file's.
 *
 * ------------------------------------------------------------------ the slot
 * `trinket` is not in the equipment map. The map has one key per place and a
 * fixed set of them; trinkets have no ceiling — a character wearing nine rings
 * is wearing nine rings — so they live in their own `trinkets` column as a plain
 * list, the way the pack does. See `normalizeTrinkets` in items.js.
 *
 * Common on every row, because rarity on this sheet is a power tier rather than
 * a price tag: a gold ring is worth more coin than a copper one and neither of
 * them is worth more in a fight.
 *
 * This file is data. It imports nothing.
 */

/**
 * Item fields, same as every other shelf (see items.js):
 *   slots  — `trinket`, and only ever that
 *   burden — nothing. A trinket carries whatever is worked into it and no
 *            weight of its own
 *   blurb  — what it looks like. There is no `effect`, because there is none
 */
export const TRINKET_ITEMS = [
  /* ----- rings ----- */
  {
    id: 'copper-band',
    name: 'Copper Band',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Ring'],
    burden: 0,
    blurb: 'A plain band, gone green where it sits against the skin.',
  },
  {
    id: 'silver-ring',
    name: 'Silver Ring',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Ring'],
    burden: 0,
    blurb: 'Bright enough to signal with, and thin enough to lose.',
  },
  {
    id: 'gold-ring',
    name: 'Gold Ring',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Ring'],
    burden: 0,
    blurb: 'Heavy for its size. Soft enough to bite a mark into.',
  },
  {
    id: 'signet-ring',
    name: 'Signet Ring',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Ring'],
    burden: 0,
    blurb: 'A flat face cut with somebody else’s crest, worn smooth.',
  },

  /* ----- around the neck ----- */
  {
    id: 'silver-pendant',
    name: 'Silver Pendant',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Necklace'],
    burden: 0,
    blurb: 'A drop of silver on a chain fine enough to snap by hand.',
  },
  {
    id: 'gold-locket',
    name: 'Gold Locket',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Necklace'],
    burden: 0,
    blurb: 'It opens. Whether there is anything inside is the wearer’s business.',
  },
  {
    id: 'bone-charm',
    name: 'Bone Charm',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Necklace'],
    burden: 0,
    blurb: 'Three knuckle bones on a leather thong, drilled and strung.',
  },

  /* ----- worn ----- */
  {
    id: 'travellers-cloak',
    name: "Traveller's Cloak",
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Cloak'],
    burden: 0,
    blurb: 'Undyed wool, waxed at the shoulders, mended twice.',
  },
  {
    id: 'tooled-belt',
    name: 'Tooled Belt',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Belt'],
    burden: 0,
    blurb: 'Stamped leather and a brass buckle. Not the one your loops hang from.',
  },
  {
    id: 'copper-bracelet',
    name: 'Copper Bracelet',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Bracelet'],
    burden: 0,
    blurb: 'Twisted wire, closed by hand, adjusted by hand ever since.',
  },
  {
    id: 'iron-circlet',
    name: 'Iron Circlet',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Circlet'],
    burden: 0,
    blurb: 'An unadorned hoop of black iron. It sits above the brow.',
  },
  {
    id: 'bronze-brooch',
    name: 'Bronze Brooch',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Brooch'],
    burden: 0,
    blurb: 'A pin and a whorl. It holds a cloak shut and nothing else.',
  },
];
