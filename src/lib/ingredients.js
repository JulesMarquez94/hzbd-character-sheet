/**
 * The Cauldron Keeper's Ingredients.
 *
 * Transcribed from the designer's sheet ("Talent Set - Cauldron Keeper - Ability",
 * pulled 2026-08-19) exactly as it reads. Every `body` below is the sheet's own
 * Main Effect cell with nothing but markers inserted: `2d6 + 2 x Instinct` became
 * `[[2d6 + 2*stat]]` so the number resolves against the brewer, and a damage type
 * became `{damage:Cold}` so it prints in its own colour. Nothing was reworded.
 * A round-trip check that maps every marker back to the designer's written form
 * and compares it to their cell passes on all of them.
 *
 * ------------------------------------------------------------------ the three kinds
 * An Ingredient is one of three things, and BREW's own text is the rule:
 *
 *   "At least 1 Essence, exactly 1 Catalyst, and any number of Infusions."
 *
 *   essence    what the Brew does
 *   catalyst   who it reaches
 *   infusion   anything else stirred in
 *
 * A tier gates each one, exactly as a spell school's does: "You gain access to
 * Novice Ingredients at Rank 1, Adept Ingredients at Rank 2, and Master
 * Ingredients at Rank 3."
 *
 * -------------------------------------------------------------------- the costs
 * `ap` and `wp` are the sheet's own AP and WP columns. They are not the cost of
 * anything on their own: "You must pay the combined Action Point and Willpower
 * cost of all chosen Ingredients", so a Brew's cost is the sum of what went into
 * it. brews.js does that sum.
 *
 * **One deliberate divergence, on the designer's word (19 Aug 2026): every Catalyst
 * costs 1 Action Point more than the sheet prints.** A balance pass rather than a
 * transcription slip, so the round trip flags all six cells on purpose. Every Brew
 * needs exactly one Catalyst, which makes this a flat +1 on the floor price of
 * brewing at all: the cheapest Novice Brew was 2 Action Points and is now 3, less
 * whatever Quicksilver and Efficient Brewing take back off it.
 *
 * data/templates/cauldron-keeper-ingredients.csv holds the current state next to
 * the sheet's own numbers, so the change can be carried back to the workbook.
 *
 * ------------------------------------------------------------------ the choices
 * Three Ingredients ask the brewer to decide something as they go in, and their
 * own text is what says so ("the brewer chooses", "the brewer names"). That
 * decision belongs to the Brew rather than to the character, so it is stored on
 * the recipe and not in `character.choices`. See brews.js.
 *
 * This file is data only. It imports nothing but its own art.
 */

import { withArt } from './cardArt.js';

export const INGREDIENTS = withArt([
  /* =========================================================== ESSENCE ====
   * What the Brew does. Every Brew needs at least one, and a Master Keeper with
   * Improved Recipes may carry two so long as they are not the same one.
   */

  /* FOUR-LEAF CLOVER, split in two on the designer's word (19 Aug 2026). It was
     one Essence that asked the brewer for a state, Lucky or Unlucky, and it is now
     the two Ingredients that state named. Nothing was reworded to do it: each
     keeps the sheet's own sentence for its own half, byte for byte, and the line
     of flavour above it is his with one word turned over.

     Two Essences rather than one, so Improved Recipes can carry both at once and
     the choice is made by reaching for a shelf rather than by answering a question
     after the Ingredient is already in. The old `four-leaf-clover` id goes with no
     character to strip: a Brew "takes effect immediately" and is stored nowhere,
     so no saved sheet has ever pointed at an Ingredient.

     Neither carries art yet, on purpose. */
  {
    id: 'lucky-clover',
    name: 'Lucky Clover',
    part: 'essence',
    tier: 'Novice',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Novice Essence'],
    ap: 1,
    wp: 1,
    stat: 'instinct',
    summary: 'Advantage on the next roll.',
    body:
      'You drop a rare, lucky plant into the brew.\n\n' +
      'Entities affected by a Lucky Brew gain Advantage on their next Skill Check or Attack Roll.',
  },

  {
    id: 'unlucky-clover',
    name: 'Unlucky Clover',
    part: 'essence',
    tier: 'Novice',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Novice Essence'],
    ap: 1,
    wp: 1,
    stat: 'instinct',
    summary: 'Disadvantage on the next roll.',
    body:
      'You drop a rare, unlucky plant into the brew.\n\n' +
      'Entities affected by an Unlucky Brew gain Disadvantage on their next Skill Check or Attack Roll.',
  },

  {
    id: 'healthy-leaves',
    name: 'Healthy Leaves',
    part: 'essence',
    tier: 'Novice',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Novice Essence'],
    ap: 1,
    wp: 1,
    stat: 'instinct',
    summary: 'Health back.',
    body:
      'You drop a vibrant, life-giving leaf into the brew.\n\n' +
      'A target entity affected by the Brew regains [[2d6 + 2*stat]] in Health.',
  },

  /* The one place this file departs from the sheet, and on the designer's own
     say-so: the Ability sheet files this as a "Novice Infusion", which Jules
     corrected to an Essence on 19 Aug 2026. Fire damage *is* what the Brew
     does, so it belongs with the Essences. The sheet still says Infusion, so a
     round-trip check will flag it — this comment is why. */
  {
    id: 'volcanic-shard',
    name: 'Volcanic Shard',
    part: 'essence',
    tier: 'Novice',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Novice Essence'],
    ap: 2,
    wp: 1,
    stat: 'instinct',
    damage: ['Fire'],
    summary: 'Fire damage.',
    body:
      'You drop a fire-infused ingredient in the brew.\n\n' +
      'Entities affected by the Brew take [[3d6 + 3*stat]] in {damage:Fire} damage.',
  },

  {
    id: 'draconic-scale',
    name: 'Draconic Scale',
    part: 'essence',
    tier: 'Adept',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Adept Essence'],
    ap: 2,
    wp: 2,
    stat: 'instinct',
    summary: 'Resistance to a damage type you pick, until a Short Rest.',
    choice: {
      label: 'The damage type resisted',
      options: [
        { id: 'fire', label: 'Fire' },
        { id: 'cold', label: 'Cold' },
        { id: 'lightning', label: 'Lightning' },
        { id: 'blunt', label: 'Blunt' },
        { id: 'force', label: 'Force' },
        { id: 'sharp', label: 'Sharp' },
        { id: 'decay', label: 'Decay' },
        { id: 'psychic', label: 'Psychic' },
        { id: 'sacred', label: 'Sacred' },
      ],
    },
    body:
      'You drop a shimmering, hardened scale into the brew.\n\n' +
      'The brewer chooses one of the following damage types: Fire, Cold, Lightning, Blunt, Force, Sharp, Decay, Psychic or Sacred.\n\n' +
      'An entity affected by the Brew gains resistance to the chosen damage type until they take a Short Rest.',
  },

  {
    id: 'ice-shard',
    name: 'Ice Shard',
    part: 'essence',
    tier: 'Adept',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Adept Essence'],
    ap: 2,
    wp: 1,
    stat: 'instinct',
    damage: ['Cold'],
    summary: 'Cold damage, and the next step out costs more.',
    body:
      'You drop a shard of perpetual ice into the brew.\n\n' +
      'Entities affected by the Brew take [[2d6 + 2*stat]] in {damage:Cold} damage.\n\n' +
      'The cost of the entity\'s next Move action is increased by 1 Action Point.',
  },

  {
    id: 'wisp-of-mist',
    name: 'Wisp of Mist',
    part: 'essence',
    tier: 'Adept',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Adept Essence'],
    ap: 2,
    wp: 3,
    stat: 'instinct',
    summary: 'Half again the Movement Speed, and it holds while sneaking.',
    body:
      'You drop a swirling fragment of ethereal vapor into the brew.\n\n' +
      'Entities affected by the Brew have their Movement Speed increased by 50%.\n\n' +
      'Affected entities can travel at this speed while making Stealth checks.',
  },

  {
    id: 'amber-shard',
    name: 'Amber Shard',
    part: 'essence',
    tier: 'Master',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Master Essence'],
    ap: 2,
    wp: 4,
    stat: 'instinct',
    summary: 'Stunned until their next Turn End.',
    body:
      'You drop a glowing, heat-pulsing shard into the brew.\n\n' +
      'Entities affected by the Brew become Stunned until their next Turn End.',
  },

  {
    id: 'skillseed-nut',
    name: 'Skillseed Nut',
    part: 'essence',
    tier: 'Master',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Master Essence'],
    ap: 2,
    wp: 4,
    stat: 'instinct',
    summary: 'Advantage at one named skill until a Long Rest.',
    choice: { label: 'The skill named', free: true, placeholder: 'Stealth, Diplomacy, hot dog eating' },
    body:
      'You drop a dense, brain-shaped nut into the brew.\n\n' +
      'The brewer names a specific skill (such as Stealth, Carpentry, Investigation, hot dog eating or Diplomacy).\n\n' +
      'Entities affected by the Brew have Advantage in the named skill.\n\n' +
      'This effect lasts until the target takes a Long Rest.',
  },

  {
    id: 'toxic-toad',
    name: 'Toxic Toad',
    part: 'essence',
    tier: 'Master',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Master Essence'],
    ap: 2,
    wp: 2,
    stat: 'instinct',
    damage: ['Poison'],
    summary: 'Poison damage, and leaves them poisoned.',
    body:
      'You drop a bloated, neon-colored frog into the brew.\n\n' +
      'An entity affected by the Brew takes [[2d6 + 2*stat]] in {damage:Poison} damage.\n\n' +
      'The entity is also Poisoned.',
  },

  /* ========================================================== CATALYST ====
   * Who the Brew reaches. Exactly one per Brew, always: without a Catalyst there
   * is nothing for the Essence to happen to.
   */

  {
    id: 'eye-of-the-seeker',
    name: 'Eye of the Seeker',
    part: 'catalyst',
    tier: 'Novice',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Novice Catalyst'],
    ap: 2,
    wp: 1,
    stat: 'instinct',
    summary: 'Aims the Brew at one target you can see within 9 meters.',
    body:
      'You drop a preserved, lidless eye into the brew to sharpen its focus.\n\n' +
      'Your Brew affects a single target you can see within 9 meters (30 feet).',
  },

  {
    id: 'puffball-mushroom',
    name: 'Puffball Mushroom',
    part: 'catalyst',
    tier: 'Novice',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Novice Catalyst'],
    ap: 2,
    wp: 3,
    stat: 'instinct',
    summary: 'Bubbles the Brew out over everything within 6 meters.',
    body:
      'You drop a Puffball mushroom in the brew, making the smoke bubble out of the cauldron.\n\n' +
      'Your Brew affects all entities within 6 meters (20 feet).',
  },

  {
    id: 'sampled-catalyst',
    name: 'Sampled Catalyst',
    part: 'catalyst',
    tier: 'Adept',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Adept Catalyst'],
    ap: 2,
    wp: 2,
    stat: 'instinct',
    summary: 'A piece of somebody carries the Brew to them at any distance.',
    body:
      'You drop a piece of a specific entity (such as hair, skin or blood) into the cauldron.\n\n' +
      'The Brew affects that specific entity regardless of the distance between you and the target.\n\n' +
      'The target must be on the same plane of existence as the brewer for the effect to take hold.',
  },

  {
    id: 'sticky-resin',
    name: 'Sticky Resin',
    part: 'catalyst',
    tier: 'Adept',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Adept Catalyst'],
    ap: 2,
    wp: 1,
    stat: 'instinct',
    summary: 'Coats a weapon, and the next hit with it delivers the Brew.',
    body:
      'You stir sticky resin into the brew to make it coat.\n\n' +
      'The Brew imbues a weapon you can touch with its properties.\n\n' +
      'The next Weapon Attack or Special Weapon Attack made with that weapon applies the Brew\'s effects to the target on a hit.',
  },

  {
    id: 'lightning-in-a-bottle',
    name: 'Lightning in a Bottle',
    part: 'catalyst',
    tier: 'Master',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Master Catalyst'],
    ap: 3,
    wp: 5,
    stat: 'instinct',
    summary: 'A storm cloud that keeps applying the Brew for 5 turns.',
    body:
      'You drop a captured bolt of pure energy into the brew, causing it to evaporate into a dark storm cloud.\n\n' +
      'The cloud appears at a point you can see within 30 meters (100 feet).\n\n' +
      'The storm covers a 15-meter (50-foot) radius area and lasts for 5 turns.\n\n' +
      'An entity is affected by the Brew\'s effects when the cloud is placed, the first time it enters the area and at each of its Turn Starts while inside of it.',
  },

  {
    id: 'sacred-chalk',
    name: 'Sacred Chalk',
    part: 'catalyst',
    tier: 'Master',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Master Catalyst'],
    ap: 2,
    wp: 1,
    stat: 'instinct',
    summary: 'A glyph that waits on the ground until somebody walks into it.',
    body:
      'You grind a piece of sacred chalk into the cauldron, binding the brew to the ground.\n\n' +
      'You create a 3-meter (10-foot) radius glyph at a point you can see within 9 meters (30 feet).\n\n' +
      'An entity that enters the glyph triggers the Brew\'s effects.\n\n' +
      'The glyph lasts until it is triggered, removed by the brewer or a new glyph is created by the brewer.',
  },

  /* ========================================================== INFUSION ====
   * Anything else stirred in. A Brew may take any number of them, and they are
   * the only Ingredients that change the Brew itself rather than its target.
   */

  {
    id: 'quicksilver',
    name: 'Quicksilver',
    part: 'infusion',
    tier: 'Novice',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Novice Infusion'],
    ap: 0,
    wp: 1,
    stat: 'instinct',
    summary: 'Takes an Action Point off the Brew.',
    body:
      'You add a shimmering, fast-moving liquid to the brew to streamline its potency.\n\n' +
      'When this infusion is added to the Brew, reduce the Action Point cost of the Brew by 1.',
  },

  {
    id: 'purifying-crystal',
    name: 'Purifying Crystal',
    part: 'infusion',
    tier: 'Adept',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Adept Infusion'],
    ap: 0,
    wp: 2,
    stat: 'instinct',
    summary: 'The Brew spares one side: only allies, or only enemies.',
    choice: {
      label: 'Who it spares',
      options: [
        { id: 'allies', label: 'Only allies' },
        { id: 'enemies', label: 'Only enemies' },
      ],
    },
    body:
      'You drop a translucent, glowing crystal into the cauldron to filter the brew\'s intent.\n\n' +
      'When this infusion is added to the Brew, the brewer chooses whether the Brew\'s effects apply only to allies or only to enemies.',
  },

  {
    id: 'mana-crystal',
    name: 'Mana Crystal',
    part: 'infusion',
    tier: 'Master',
    kind: 'ingredient',
    tags: ['Cauldron keeper', 'Master Infusion'],
    ap: 0,
    wp: 3,
    stat: 'instinct',
    summary: 'An extra die and a bigger die on everything the Brew does.',
    body:
      'You drop a fragment of unstable willpower to fuel the mixture.\n\n' +
      'The Brew\'s effects are Empowered and Elevated.',
  },
]);

/* ------------------------------------------------------------------ lookups */

const BY_ID = new Map(INGREDIENTS.map((row) => [row.id, row]));

export function getIngredient(id) {
  return id ? BY_ID.get(id) ?? null : null;
}

/** The three kinds, in the order BREW names them. */
export const INGREDIENT_PARTS = [
  {
    id: 'essence',
    label: 'Essence',
    plural: 'Essences',
    /* "At least 1 Essence" is a floor, and Improved Recipes raises the ceiling to
       two at Master. The ceiling lives on the talent spec, not here. */
    rule: 'At least one, and never two of the same',
  },
  { id: 'catalyst', label: 'Catalyst', plural: 'Catalysts', rule: 'Exactly one' },
  { id: 'infusion', label: 'Infusion', plural: 'Infusions', rule: 'Any number' },
];

/** The tiers, in the order the ranks open them. */
export const INGREDIENT_TIERS = ['Novice', 'Adept', 'Master'];

export function ingredientsOfPart(part) {
  return INGREDIENTS.filter((row) => row.part === part);
}
