/**
 * Enchantments — what an Enchanter lays, and what a laid item carries.
 *
 * Transcribed from the designer's sheet ("Equipment, Enchantments and Items -
 * Enchantments", pulled 2026-08-19). Thirteen rows, all of them Novice, and every
 * `effect` below is that row's own Main Effect cell byte for byte. The `body` is
 * the printed card, which is the one thing here that is written rather than
 * transcribed: the sheet's cell is a single clause ("1 Instinct.") and a card
 * needs a sentence. A round trip checks the `effect` strings, not the bodies.
 *
 * These used to live in weapons.js, four of the thirteen of them, because the
 * only thing that carried an enchantment was a codex item that came pre-laid.
 * They are a leaf of their own now because the Enchanter needs the whole shelf
 * and needs it without pulling the card registry in behind it. weapons.js still
 * re-exports `ENCHANTMENTS` and still folds them into `CARDS`, so nothing
 * downstream had to change.
 *
 * ---------------------------------------------------------------- the numbers
 *   burden   Magic Burden the wielder carries while it is on them. The sheet's
 *            own column. Capacity is Level + Mind + 10 (`magicBurdenMax`).
 *   cost     price in coin, at 750 a point of burden. Not on the sheet: it is
 *            what the codex has always priced them at, kept so the four that
 *            were already here keep their price tags.
 *   supplies what it costs an Enchanter to lay, at **70 a point of burden**.
 *            ENCHANTING's own sentence, confirmed by the designer 19 Aug 2026.
 *
 * ------------------------------------------------------------------ the riders
 * **Mechanics as data, never read out of the prose.** An enchantment that says
 * "1 Instinct" has to actually move Instinct on the sheet, and the sheet cannot
 * find that out by reading the sentence. So every mechanical consequence is a
 * field, and `enchanting.js` is the one place that adds them up:
 *
 *   attributes    { instinct: 1 } — raises the attribute, and everything derived
 *                 from it: Defense, Initiative, Speed, Reflex, Grit, the numbers
 *                 printed on every card that rolls it.
 *   healthMax     flat points of maximum Health.
 *   shieldAtCombat a dice expression rolled into Shield when combat starts.
 *   damageType    replaces the damage type of the weapon it is laid on.
 *   empower       steps every damage die that weapon rolls up a category.
 *   spell         true when the enchantment carries a spell rather than a number.
 *                 What spell is chosen when it is laid, not here.
 *   light         it can be turned on, and does nothing else.
 *
 * A field that is absent is a rider the enchantment does not carry. Nothing here
 * is computed: `cost` and `supplies` are written out per row rather than derived
 * from `burden`, so a row the designer reprices stays that price.
 *
 * This file is data only. It imports nothing.
 */

/** What an Enchanter pays in Supplies for every point of Magic Burden. */
export const SUPPLIES_PER_BURDEN = 70;

/** What a shop charges in coin for the same, which is a different economy. */
export const COIN_PER_BURDEN = 750;

export const ENCHANTMENTS = [
  /* ------------------------------------------------------------ the body ----
   * The five that change what the wielder *is* rather than what their weapon
   * does. These are the ones WIELDER OF WONDER is for, and the ones an
   * Ephemeral Enchantment is nearly always spent on.
   */

  {
    id: 'vitality',
    name: 'Vitality',
    kind: 'passive',
    tags: ['Novice Enchantment', 'Body'],
    tier: 'Novice',
    burden: 4,
    cost: 3000,
    supplies: 280,
    healthMax: 20,
    effect: '20 maximum Health.',
    body:
      'The wielder carries 20 more maximum Health than they otherwise would.\n\n' +
      'It is capacity rather than healing: the points are there to be filled, and a wielder at full Health when this is laid on them is no longer at full Health.',
  },

  {
    id: 'barrier',
    name: 'Barrier',
    kind: 'passive',
    tags: ['Novice Enchantment', 'Body'],
    tier: 'Novice',
    burden: 4,
    cost: 3000,
    supplies: 280,
    shieldAtCombat: '2d6',
    effect: 'Gain 2d6 in Shield at combat start.',
    body:
      'When the wielder enters combat, they start it with [[2d6]] in Shield.\n\n' +
      'It stacks with everything else that grants Shield at the start of a fight, and is held to the same cap.',
  },

  {
    id: 'mental-focus',
    name: 'Mental Focus',
    kind: 'passive',
    tags: ['Novice Enchantment', 'Body'],
    tier: 'Novice',
    burden: 4,
    cost: 3000,
    supplies: 280,
    attributes: { mind: 1 },
    effect: '1 Mind.',
    body:
      'The wielder has 1 more {mind} than they otherwise would.\n\n' +
      'Everything Mind buys moves with it: Willpower, Magic Burden capacity and the damage of anything cast.',
  },

  {
    id: 'primal-sense',
    name: 'Primal Sense',
    kind: 'passive',
    tags: ['Novice Enchantment', 'Body'],
    tier: 'Novice',
    burden: 4,
    cost: 3000,
    supplies: 280,
    attributes: { instinct: 1 },
    effect: '1 Instinct.',
    body:
      'The wielder has 1 more {instinct} than they otherwise would.\n\n' +
      'Everything Instinct buys moves with it: Defense, Initiative, Movement Speed, Reflex, Grit and the damage of anything quick.',
  },

  {
    id: 'bodily-vigor',
    name: 'Bodily Vigor',
    kind: 'passive',
    tags: ['Novice Enchantment', 'Body'],
    tier: 'Novice',
    burden: 4,
    cost: 3000,
    supplies: 280,
    attributes: { physique: 1 },
    effect: '1 Physique.',
    body:
      'The wielder has 1 more {physique} than they otherwise would.\n\n' +
      'Everything Physique buys moves with it: maximum Health, Reflex and the damage of anything heavy.',
  },

  /* ----------------------------------------------------------- the weapon ----
   * The six Infusions. Identical but for the damage type, which is why they are
   * written out of one shape rather than each in its own words.
   */

  ...[
    ['fire-infusion', 'Fire Infusion', 'Fire'],
    ['cold-infusion', 'Cold Infusion', 'Cold'],
    ['lightning-infusion', 'Lightning Infusion', 'Lightning'],
    ['psychic-infusion', 'Psychic Infusion', 'Psychic'],
    ['sacred-infusion', 'Sacred Infusion', 'Sacred'],
    ['decay-infusion', 'Decay Infusion', 'Decay'],
  ].map(([id, name, type]) => ({
    id,
    name,
    kind: 'passive',
    tags: ['Novice Enchantment', 'Infusion'],
    tier: 'Novice',
    burden: 4,
    cost: 3000,
    supplies: 280,
    damageType: type,
    empower: 1,
    effect: `Weapon damage type becomes ${type} and its damage is Empowered by 1.`,
    body:
      `The weapon this enchantment is laid upon deals {damage:${type}} damage in place of its own damage type.\n\n` +
      'Its damage is Empowered by 1: every damage die it rolls steps up a category — a d6 becomes a d8 — and no die may pass a d12.',
  })),

  /* ------------------------------------------------------------- the rest ----
   * One that only makes light, and one that carries a spell.
   */

  {
    id: 'luminescence',
    name: 'Luminescence',
    kind: 'passive',
    tags: ['Novice Enchantment', 'Utility'],
    tier: 'Novice',
    /* The cheapest thing on the sheet, and the only one under 4. */
    burden: 2,
    cost: 1500,
    supplies: 140,
    light: true,
    effect: 'Can be turned on or off to illuminate a 15 meters (50 feet) area.',
    body:
      'The item can be turned on or off at will.\n\n' +
      'While lit, it illuminates an area of 15 meters (50 feet) around it.',
  },

  {
    id: 'novice-imbuement',
    name: 'Novice Imbuement',
    kind: 'passive',
    tags: ['Novice Enchantment', 'Imbuement'],
    tier: 'Novice',
    /* **The sheet says 4 and the codex said 3.** The sheet is newer and it is the
       sheet's own column, so 4 it is. This raises what a Novice Imbuement costs
       to lay (280 Supplies rather than 210) and what it weighs on the wielder.
       The one item that came pre-laid with it, grave-lantern-blade, weighs a
       point more than it did. Flagged in data/README.md. */
    burden: 4,
    cost: 3000,
    supplies: 280,
    spell: true,
    /* Which spell is chosen at the moment it is laid, so the tier it may reach is
       data rather than a word in the sentence. */
    spellTier: 'Novice',
    effect:
      'Enchant an item with a NOVICE spell, allowing the wielder to cast this spell 1 time until they take a Long Rest.',
    body:
      'A single Novice Spell is bound into the item.\n\n' +
      'Whoever wields it may cast that spell once, paying its costs as normal, whether or not they can cast spells of their own.\n\n' +
      'The casting returns after a Long Rest.',
  },
];

const BY_ID = new Map(ENCHANTMENTS.map((entry) => [entry.id, entry]));
const BY_NAME = new Map(ENCHANTMENTS.map((entry) => [entry.name.toLowerCase(), entry]));

export function getEnchantment(key) {
  if (!key) return null;
  return BY_ID.get(key) ?? BY_NAME.get(String(key).toLowerCase()) ?? null;
}

/** Every enchantment of the tiers a rank has opened, in codex order. */
export function enchantmentsAt(tiers) {
  const open = Array.isArray(tiers) ? tiers : [];
  return ENCHANTMENTS.filter((entry) => open.includes(entry.tier));
}

/**
 * What laying one costs an Enchanter in Supplies.
 *
 * The row's own `supplies` where it has one, and 70 a point of burden where it
 * does not, which is ENCHANTING's own sentence and the fallback that keeps a
 * newly added enchantment priced without a second edit.
 */
export function enchantSupplies(enchantment) {
  const own = Number(enchantment?.supplies);
  if (Number.isFinite(own) && own >= 0) return Math.floor(own);
  return Math.max(0, Math.floor(Number(enchantment?.burden) || 0)) * SUPPLIES_PER_BURDEN;
}

/** What an enchantment weighs on whoever carries it. */
export function enchantBurden(enchantment) {
  return Math.max(0, Math.floor(Number(enchantment?.burden) || 0));
}

/**
 * The one line an enchantment is chosen by, in a picker that is showing thirteen
 * of them. The sheet's own Main Effect cell, which is already one clause long.
 */
export function enchantSummary(enchantment) {
  return enchantment?.effect ?? '';
}

/** Which of the three an enchantment is for, so a picker can group the shelf. */
export const ENCHANT_KINDS = [
  { id: 'Body', label: 'On a body', plural: 'On a body', note: 'What the wielder is' },
  { id: 'Infusion', label: 'On a weapon', plural: 'On a weapon', note: 'What the weapon does' },
  { id: 'Utility', label: 'Utility', plural: 'Utility', note: 'Neither, and useful' },
  { id: 'Imbuement', label: 'A carried spell', plural: 'Carried spells', note: 'One casting, bound in' },
];

/** The kind tag an enchantment carries, which is the second word on its banner. */
export function enchantKind(enchantment) {
  const tags = enchantment?.tags ?? [];
  return ENCHANT_KINDS.find((kind) => tags.includes(kind.id))?.id ?? 'Utility';
}
