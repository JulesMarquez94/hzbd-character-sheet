/**
 * Enchantments — what an Enchanter lays, and what a laid item carries.
 *
 * Transcribed from the designer's sheet ("Equipment, Enchantments and Items -
 * Enchantments"), last pulled **2026-08-20: twenty-three rows across all three
 * tiers**, where the 2026-08-19 pull had thirteen and every one of them Novice.
 * Every `effect` below is that row's own Main Effect cell byte for byte. The
 * `body` is the printed card, which is the one thing here that is written rather
 * than transcribed: the sheet's cell is often a single clause ("1 Instinct.") and
 * a card needs a sentence. A round trip checks the `effect` strings, the tags and
 * the burdens, never the bodies.
 *
 * **Two rows here are not off that sheet**, and both are marked where they sit:
 * PREPARED, which Jules handed over in as many words on 2026-08-20, and UNIQUE
 * IMBUEMENT, which is what a Unique spell needs in order to reach an item at all.
 * A round trip against the sheet skips them rather than failing on them.
 *
 * **The tiers are real now**, which is what the Enchanter's ranks 2 and 3 were
 * waiting on: ENCHANTING opens Novice at Rank 1, Adept at 2 and Master at 3, and
 * until this pull there was nothing on the other two shelves to open.
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
 *   reactionAtCombat flat Reaction Points handed over when combat starts. The
 *                 one rider that fills a pool the bell otherwise empties.
 *   damageType    replaces the damage type of the weapon it is laid on.
 *   empower       steps every damage die that weapon rolls up a category.
 *   willpowerMax  flat points of maximum Willpower.
 *   speed         flat metres of Movement Speed.
 *   armor         flat points of Armor, counted wherever Armor is read.
 *   restSupplies  what it takes *off* the price of a rest, both kinds.
 *   spell         true when the enchantment carries a spell rather than a number.
 *                 `spellTier` is the tier it may bind. What spell is chosen when
 *                 it is laid, not here.
 *   light         it can be turned on, and does nothing else.
 *
 * A field that is absent is a rider the enchantment does not carry. Nothing here
 * is computed: `cost` and `supplies` are written out per row rather than derived
 * from `burden`, so a row the designer reprices stays that price.
 *
 * This file is data and its own art, and cardArt.js is the only thing it imports —
 * itself a leaf that imports nothing, so this stays reachable without the codex
 * coming with it. An enchantment could not carry a picture at all until the
 * one-off drop on 2026-08-20 brought one; `art_url` is null for every row that
 * still has none.
 */

import { withArt } from './cardArt.js';

/** What an Enchanter pays in Supplies for every point of Magic Burden. */
export const SUPPLIES_PER_BURDEN = 70;

/** What a shop charges in coin for the same, which is a different economy. */
export const COIN_PER_BURDEN = 750;

export const ENCHANTMENTS = withArt([
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
    /* **The body used to describe the wrong rule.** It said Empowered "steps up a
       category — a d6 becomes a d8", which is *Elevate*: the Status & Terms tab
       defines Empowered as one more die of the same kind (2d6 becomes 3d6), and
       `empowerCount` in cardText.js has done exactly that since that pull. Six
       cards were telling the player the opposite of what the sheet then rolled.
       The `effect` cell above is the designer's own and is untouched — it says
       "Empowered by 1", which is right. */
    body:
      `The weapon this enchantment is laid upon deals {damage:${type}} damage in place of its own damage type.\n\n` +
      'Its damage is Empowered by 1: it rolls one more damage die of the kind it already rolls, so 2d6 becomes 3d6.',
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
    /* **The 2026-08-20 drop took the frequency out.** The cell used to end "1 time
       until they take a Long Rest" and now stops at "cast this spell", and the two
       new Imbuements read the same way, so the removal is consistent across all
       three rather than a slip on one. Transcribed as written: nothing here limits
       the casting any more, and the card no longer promises one. **This is a real
       change in what an Imbuement is worth** and it is flagged in data/README.md,
       because a burden-4 enchantment granting a spell without limit is a different
       thing from one granting a single casting. */
    effect: 'Enchant an item with a NOVICE spell, allowing the wielder to cast this spell.',
    body:
      'A single Novice Spell is bound into the item.\n\n' +
      'Whoever wields it may cast that spell, paying its costs as normal, whether or not they can cast spells of their own.',
  },

  /* ------------------------------------------------------------- the adept ----
   * Six that open at Enchanter Rank 2. Four of them carry a rider, and two are
   * printed rules the table plays: nothing on this sheet tracks "has triggered
   * since your last long rest", and nothing on it knows what a wall is.
   */

  {
    id: 'celerity',
    name: 'Celerity',
    kind: 'passive',
    tags: ['Adept Enchantment', 'Body'],
    tier: 'Adept',
    burden: 4,
    cost: 3000,
    supplies: 280,
    speed: 2,
    /* The sheet's cell, which is the one that carries no full stop. */
    effect: '2 Speed',
    body:
      'The wielder moves 2 further than they otherwise would.\n\n' +
      'It is added to their Movement Speed, so everything measured in that distance moves with it.',
  },

  {
    id: 'arcane-battery',
    name: 'Arcane Battery',
    kind: 'passive',
    tags: ['Adept Enchantment', 'Body'],
    tier: 'Adept',
    burden: 6,
    cost: 4500,
    supplies: 420,
    willpowerMax: 8,
    effect: 'Willpower is increase by 8.',
    body:
      'The wielder carries 8 more maximum Willpower than they otherwise would.\n\n' +
      'It is capacity rather than restoration: the points are there to be filled, and a rest is what fills them.',
  },

  {
    /* **Not `resilience`.** A lineage trait already holds that id and that printed
       name (lineages.js: "6 health per point of Fortitude and Physique instead of
       5"), and an id is what a saved character points at, so the older one keeps
       it. The registry folds lineage cards in *after* enchantments, so leaving
       both on one id silently lost this card out of `getCard` — a tracker row
       written for the enchantment would have opened the lineage trait instead.

       **The printed names still collide**, because the sheet says RESILIENCE and
       renaming the designer's card is not this file's call. Flagged in
       data/README.md: a table with both will see two cards called Resilience. */
    id: 'resilience-enchantment',
    name: 'Resilience',
    kind: 'passive',
    tags: ['Adept Enchantment', 'Body'],
    tier: 'Adept',
    burden: 6,
    cost: 4500,
    supplies: 420,
    armor: 3,
    /* The sheet writes " 3 armor" with a leading space. Kept trimmed: the round
       trip compares whitespace-normalised, and a leading space is not a design. */
    effect: '3 armor',
    body:
      'The wielder has 3 more Armor than they otherwise would.\n\n' +
      'It counts as Armor wherever Armor is read, so a full set of Heavy Armor turns half of it into Defense along with the rest.',
  },

  {
    id: 'defibrillation',
    name: 'Defibrillation',
    kind: 'passive',
    tags: ['Adept Enchantment', 'Body'],
    tier: 'Adept',
    burden: 6,
    cost: 4500,
    supplies: 420,
    /* No rider, and not for want of trying: nothing on this sheet knows that a
       character *went down*, and nothing tracks "has triggered since your last
       long rest". Both halves are the table's to play, which is how every other
       printed conditional on this sheet works. */
    effect:
      'When you go down, you stabilize to 0 health points instead of going into negative. Once this effect has triggered you need to take a long rest before you can use it again.',
    body:
      'When the wielder would drop below 0 Health, they stop at 0 instead of bleeding out.\n\n' +
      'Once it has fired it is spent, and comes back after a Long Rest.',
  },

  {
    /* **Not off the sheet.** Jules handed this one over in chat on 2026-08-20,
       word for word, with its burden: "PREPARED: You start each combat with 3
       reaction points. 4 burden." Priced from the two rates the rest of the shelf
       is priced from — 750 a point in coin, 70 a point in Supplies — which is
       what Celerity, the other burden-4 Adept, already charges.

       It is the only thing in the game that arrives at the bell with Reaction
       Points already in hand. Every other route to one earns it inside the round:
       ANTICIPATE converts Action Points, and the Avian lineage burns Health. See
       `reactionAtCombat` in combatTurn.js for the pool it actually fills. */
    id: 'prepared',
    name: 'Prepared',
    kind: 'passive',
    tags: ['Adept Enchantment', 'Body'],
    tier: 'Adept',
    burden: 4,
    cost: 3000,
    supplies: 280,
    reactionAtCombat: 3,
    effect: 'You start each combat with 3 reaction points.',
    body:
      'The wielder comes to the bell already braced.\n\n' +
      'Starting a fight hands them 3 Reaction Points, where everyone else begins a fight with none and earns theirs inside the round.',
  },

  {
    id: 'crawler',
    name: 'Crawler',
    kind: 'passive',
    tags: ['Adept Enchantment', 'Utility'],
    tier: 'Adept',
    burden: 6,
    cost: 4500,
    supplies: 420,
    effect: 'You can walk on walls and ceilings.',
    body:
      'The wielder walks on walls and ceilings as easily as on the ground.\n\n' +
      'Their Movement Speed is unchanged by the surface they are on.',
  },

  {
    id: 'adept-imbuement',
    name: 'Adept Imbuement',
    kind: 'passive',
    tags: ['Adept Enchantment', 'Imbuement'],
    tier: 'Adept',
    burden: 6,
    cost: 4500,
    supplies: 420,
    spell: true,
    spellTier: 'Adept',
    effect: 'Enchant an item with a ADEPT spell, allowing the wielder to cast this spell.',
    body:
      'A single Adept Spell is bound into the item.\n\n' +
      'Whoever wields it may cast that spell, paying its costs as normal, whether or not they can cast spells of their own.',
  },

  /* ------------------------------------------------------------ the master ----
   * Four at Rank 3, and the two heaviest things on the sheet sit here with the
   * cheapest: OZ'EM PICK weighs 2 where SOAR weighs 12.
   */

  {
    id: 'death-defiance',
    name: 'Death Defiance',
    kind: 'passive',
    tags: ['Master Enchantment', 'Body'],
    tier: 'Master',
    burden: 8,
    cost: 6000,
    supplies: 560,
    /* Printed, for the same two reasons as Defibrillation. */
    effect:
      'When you go down, you spring back up to 1 Health instead. Once the effect has triggered you need to take a long rest before you can use it again.',
    body:
      'When the wielder would drop below 0 Health, they come back up on 1 instead.\n\n' +
      'Once it has fired it is spent, and comes back after a Long Rest.',
  },

  {
    id: 'ozem-pick',
    name: "Oz'em Pick",
    kind: 'passive',
    tags: ['Master Enchantment', 'Utility'],
    tier: 'Master',
    burden: 2,
    cost: 1500,
    supplies: 140,
    /* The one rider that moves a *rest* rather than a stat. Both rests, because
       the cell names both, and floored at nothing by rest.js rather than here. */
    restSupplies: 2,
    effect:
      'You need less to sustain yourself, the cost in supplies of short and long rest are reduced by 2.',
    body:
      'The wielder needs less to keep going.\n\n' +
      'A Short Rest and a Long Rest each cost 2 fewer Supplies out of the crate.',
  },

  {
    id: 'soar',
    name: 'Soar',
    kind: 'passive',
    tags: ['Master Enchantment', 'Utility'],
    tier: 'Master',
    burden: 12,
    cost: 9000,
    supplies: 840,
    /* The heaviest thing on the sheet: 12 of a capacity that starts at Level +
       Mind + 10, so a level 8 with Mind 6 spends half their whole allowance on it. */
    effect: 'You gain the ability to fly at a speed equal to your move speed.',
    body:
      'The wielder can fly.\n\n' +
      'They move through the air at their own Movement Speed, which is the same distance they cover on the ground.',
  },

  {
    id: 'master-imbuement',
    name: 'Master Imbuement',
    kind: 'passive',
    tags: ['Master Enchantment', 'Imbuement'],
    tier: 'Master',
    burden: 9,
    cost: 6750,
    supplies: 630,
    spell: true,
    spellTier: 'Master',
    effect: 'Enchant an item with a MASTER spell, allowing the wielder to cast this spell.',
    body:
      'A single Master Spell is bound into the item.\n\n' +
      'Whoever wields it may cast that spell, paying its costs as normal, whether or not they can cast spells of their own.',
  },

  /* ------------------------------------------------------------ the unique ----
   * One, and no rank opens it.
   *
   * A Unique Spell is not on any school's shelf — it exists on one item and
   * nowhere else (Deep Sea Accretion, on the Deep Sea Trident, is the first).
   * Something still has to be the working that binds it, because an item-carried
   * spell reaches the Abilities tab through its `enchants` entry and through
   * nothing else (see gearSource in abilitySources.js).
   *
   * So this is that working, and `unique` is what keeps it off the Enchanter's
   * shelf: no rank lists a Unique tier, and `enchantOptions` drops the row
   * outright rather than refusing it as "needs a higher rank", which is the one
   * thing a higher rank will never fix.
   */

  {
    id: 'unique-imbuement',
    name: 'Unique Imbuement',
    kind: 'passive',
    tags: ['Unique Enchantment', 'Imbuement'],
    tier: 'Unique',
    /* No Enchanter lays this. It comes on the item. */
    unique: true,
    /* Level with Master Imbuement, which is the top of the ladder, and priced at
       the shelf's own two rates. Unique is not a rank above Master: burden on this
       sheet tracks what a working is *worth*, and a Unique spell is rarer than a
       Master one rather than stronger. Deep Sea Accretion, the first of them, sits
       around Adept for power.

       Jules's to reprice. Sitting it above Master instead would put the Deep Sea
       Trident past what a level-1 character can carry at all (capacity is Level +
       Mind + 10), which is a real decision and not one to make by feel. */
    burden: 9,
    cost: 6750,
    supplies: 630,
    spell: true,
    spellTier: 'Unique',
    effect: 'Enchant an item with a UNIQUE spell, allowing the wielder to cast this spell.',
    body:
      'A single Unique Spell is bound into the item, and there is nowhere else that spell can be found.\n\n' +
      'Whoever wields it may cast that spell, paying its costs as normal, whether or not they can cast spells of their own.',
  },
]);

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
