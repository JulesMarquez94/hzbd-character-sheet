/**
 * Trinkets — the rings, chains and cloaks that hang off a character and do
 * nothing at all.
 *
 * Every other shelf in the codex is here because it *does* something: armor
 * moves Defense, a weapon teaches two cards, a belt item has a card and a
 * charge count. The twelve plain ones have no numbers, no cards and no rules
 * text, and that is the whole point of them.
 *
 * **And three that arrive already worked** — see "the named ones" at the bottom.
 * They are not an exception to the rule above so much as its proof: a Cloak of
 * Nightmare is a Traveller's Cloak somebody put something into, the way the
 * Deep Sea Trident is that for weapons. What they do lives entirely in their
 * `enchants`, the same field the forge writes, so nothing downstream had to be
 * taught that a codex trinket can be enchanted.
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
 *   slots    — `trinket`, and only ever that
 *   burden   — nothing. A trinket carries whatever is worked into it and no
 *              weight of its own; a *worked* one weighs what its enchants weigh
 *   weight   — kilograms, and zero for every piece of jewellery on the shelf.
 *              A ring weighs about five grams: nobody carrying a breastplate
 *              would notice it, so the sheet does not count it either. What is
 *              worn as cloth or leather does weigh
 *   cost     — coin. Rarity is a power tier here rather than a price tag, so
 *              this is the one field on the shelf that tells a gold ring from a
 *              copper one
 *   blurb    — what it looks like. There is no `effect`, because there is none
 *   enchants — only on the named ones: the workings the piece arrives wearing,
 *              in the exact shape the forge and `heldItem` already read
 */
export const TRINKET_ITEMS = [
  /* ----- rings ----- */
  {
    id: 'copper-band',
    name: 'Copper Band',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Ring'],
    burden: 0,
    weight: 0,
    cost: 20,
    blurb: 'A plain band, gone green where it sits against the skin.',
  },
  {
    id: 'silver-ring',
    name: 'Silver Ring',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Ring'],
    burden: 0,
    weight: 0,
    cost: 150,
    blurb: 'Bright enough to signal with, and thin enough to lose.',
  },
  {
    id: 'gold-ring',
    name: 'Gold Ring',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Ring'],
    burden: 0,
    weight: 0,
    cost: 800,
    blurb: 'Heavy for its size. Soft enough to bite a mark into.',
  },
  {
    id: 'signet-ring',
    name: 'Signet Ring',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Ring'],
    burden: 0,
    weight: 0,
    cost: 400,
    blurb: 'A flat face cut with somebody else’s crest, worn smooth.',
  },

  /* ----- around the neck ----- */
  {
    id: 'silver-pendant',
    name: 'Silver Pendant',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Necklace'],
    burden: 0,
    weight: 0,
    cost: 200,
    blurb: 'A drop of silver on a chain fine enough to snap by hand.',
  },
  {
    id: 'gold-locket',
    name: 'Gold Locket',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Necklace'],
    burden: 0,
    weight: 0.1,
    cost: 1200,
    blurb: 'It opens. Whether there is anything inside is the wearer’s business.',
  },
  {
    id: 'bone-charm',
    name: 'Bone Charm',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Necklace'],
    burden: 0,
    weight: 0,
    cost: 30,
    blurb: 'Three knuckle bones on a leather thong, drilled and strung.',
  },

  /* ----- worn ----- */
  {
    id: 'travellers-cloak',
    name: "Traveller's Cloak",
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Cloak'],
    burden: 0,
    weight: 1.2,
    cost: 150,
    blurb: 'Undyed wool, waxed at the shoulders, mended twice.',
  },
  {
    id: 'tooled-belt',
    name: 'Tooled Belt',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Belt'],
    burden: 0,
    weight: 0.4,
    cost: 120,
    blurb: 'Stamped leather and a brass buckle. Not the one your loops hang from.',
  },
  {
    id: 'copper-bracelet',
    name: 'Copper Bracelet',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Bracelet'],
    burden: 0,
    weight: 0,
    cost: 30,
    blurb: 'Twisted wire, closed by hand, adjusted by hand ever since.',
  },
  {
    id: 'iron-circlet',
    name: 'Iron Circlet',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Circlet'],
    burden: 0,
    weight: 0.2,
    cost: 80,
    blurb: 'An unadorned hoop of black iron. It sits above the brow.',
  },
  {
    id: 'bronze-brooch',
    name: 'Bronze Brooch',
    slots: ['trinket'],
    tags: ['Common', 'Trinket', 'Brooch'],
    burden: 0,
    weight: 0,
    cost: 60,
    blurb: 'A pin and a whorl. It holds a cloak shut and nothing else.',
  },

  /* ----- the named ones -----
   * The first two were handed over in chat on 2026-08-20 as card renders, the
   * way the Deep Sea Trident was, and First Place followed on 2026-08-27 as a
   * sentence. Each carries its workings on `enchants`, so the Magic Burden
   * meter, the Abilities tab and the recap read them without a line of new
   * code. Rarity is house-picked, since no card prints one: the cloak holds a
   * Unique spell like the trident (Epic), and the two rings hold one working
   * apiece (Rare).
   */
  {
    /* The cursed cloak. Three workings and the codex names them separately: a
       Unique Imbuement holding NIGHTMARE WALL (spells.js), NIGHTMARE'S CURSE
       (enchantments.js), which is the price of wearing it, and UNBURDENED.
       Taking the cloak off takes the wall and the curse with it, because both
       are the cloak's and not the wearer's.

       **It weighed its Imbuement's 9 until 2026-08-27**, when Jules ruled it
       carries none: "Cloak of nightmare should have no burden." The curse
       already weighed nothing on its own account — see its comment — and
       UNBURDENED is what takes the Imbuement down with it. A cloak that charges
       its wearer a curse and a full Unique Imbuement was being paid for twice. */
    id: 'cloak-of-nightmare',
    name: 'Cloak of Nightmare',
    slots: ['trinket'],
    tags: ['Epic', 'Trinket', 'Cloak'],
    burden: 0,
    weight: 1.4,
    cost: 150,
    blurb: 'A deep violet cloak that swallows lamplight, stitched through with slow green fire.',
    enchants: [
      { id: 'unique-imbuement', spell: 'nightmare-wall' },
      { id: 'nightmares-curse' },
      { id: 'unburdened' },
    ],
    enchantText:
      'Three workings share this cloth: a {{Unique Imbuement}} holding {{Nightmare Wall}}, {{Nightmare’s Curse}} woven into the lining, and {{Unburdened}}, which is why none of it weighs on whoever wears it.',
    lore:
      'Nobody weaves like this any more, and its keepers have stopped claiming anyone ever did. The cloth holds a piece of somewhere lightless, and wearing it means carrying that somewhere with you.\n\n' +
      'Every owner ends up with the same habits: walls of night thrown up at the first sign of trouble, and a lamp burned all night over a bed checked twice.',
  },
  {
    /* The ring. One working, SHROUDING (enchantments.js), and Jules's own spec
       for it was "a special enchantment that cost no burden" — so this was the
       first enchanted piece in the codex that weighs nothing on its wearer. It
       does it the older way, with a working that costs nothing itself; the
       trident and the cloak do it with UNBURDENED, which takes real numbers
       down to nothing. Both land on the same 0 and neither is worth reworking
       into the other. */
    id: 'ring-of-shrouding',
    name: 'Ring of Shrouding',
    slots: ['trinket'],
    tags: ['Rare', 'Trinket', 'Ring'],
    burden: 0,
    weight: 0,
    cost: 5000,
    blurb: 'Crafted from a dark, light-absorbing material that veils the wearer from magical detection.',
    enchants: [{ id: 'shrouding' }],
    enchantText: 'One working sits in the dark of the stone: {{Shrouding}}, and it weighs nothing on whoever wears it.',
    lore:
      'Made for somebody who had reason to believe they were being watched, and made well enough that history does not record whether they were right.\n\n' +
      'The stone drinks lamplight the way the cloth of certain cloaks does. When it warms to a dull red, the wearer has learned exactly one thing: someone, somewhere, is looking.',
  },
  {
    /* Jules's, handed over whole in chat on 2026-08-27: "Create a Ring called
       First Place: that increases your Willpower by +2, 'A rare token given by
       the Liche of bones to those that have impressed them. Beside its slight
       magical properties, it might impress the right persons.' 4 burden."

       The sentence in quotes is theirs and is the `lore` below, with one edit:
       Liche of Bones is capitalised as the title it reads like. Nothing else in
       the codex names them yet.

       The +2 is ACCOLADE (enchantments.js) rather than a field on the ring,
       because an item's numbers only reach its wearer through `enchants` — see
       `characterGrants` in items.js. Its 4 is the designer's own burden, and the
       ring's own stays 0 the way every trinket's does. Rare because one working
       is what the Ring of Shrouding is rated on, and because the designer's own
       sentence calls it rare.

       Coin is a gold ring's 800 plus what the working adds at 1000 a point, so
       the tile reads 4800. A trophy is worth its metal and its magic, and the
       part that "might impress the right persons" is the table's to price. */
    id: 'first-place',
    name: 'First Place',
    slots: ['trinket'],
    tags: ['Rare', 'Trinket', 'Ring'],
    burden: 0,
    weight: 0,
    cost: 800,
    blurb: 'A band of pale polished bone, stamped once across the face with a numeral.',
    enchants: [{ id: 'accolade' }],
    enchantText: 'One working is set into the bone: {{Accolade}}, and it is the smaller half of what the ring is for.',
    lore:
      'A rare token given by the Liche of Bones to those that have impressed them. Beside its slight magical properties, it might impress the right persons.\n\n' +
      'Nobody has established what the contest was, how many entered or what second place received. Everyone shown one has assumed they were meant to be impressed, which is most of the ring working as intended.',
  },
];
