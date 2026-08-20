/**
 * Lineages — your ancestry, and the one thing about a character that is chosen
 * once and never again.
 *
 * A lineage is not a track like a Talent: it has no ranks and no later choices.
 * You pick one at level 1 and it colours everything after.
 *
 * A lineage is written in two halves, and they are kept apart on purpose:
 *
 *   the lore   — where the line comes from and what it did to the body. Prose,
 *                read once, while you are deciding.
 *   the cards  — what it actually gives you. Every effect is a card, printed
 *                and dealt exactly like a weapon's or a talent's, because at
 *                the table "+1 Defense" is something you look up mid-fight and
 *                a paragraph about ancestry is not.
 *
 * ------------------------------------------------------------------- source
 * Transcribed from "Hazebound - Character Sheet V4 - LINEAGE". That sheet
 * predates the current three-attribute system, so a few cards still name things
 * V5 no longer has — Fortitude, Wisdom, Cunning — and six name spells the codex
 * has not been given yet. Those are left exactly as printed rather than guessed
 * at: the wording is the designer's to update, and a silent re-interpretation
 * would be far worse than a visible one.
 *
 * --------------------------------------------------------------- card text
 * Card bodies use the same markers as every other card — see the header of
 * weapons.js. These are folded into the global registry by weapons.js, so every
 * link resolves and any of them can be dealt onto the pile.
 *
 * This file is a leaf: nothing here may import weapons.js or items.js.
 */

/** The families a lineage belongs to, and what it is good at. */
export const LINEAGE_TAGS = [
  { id: 'planar', label: 'Planar', kind: 'origin' },
  { id: 'beastkin', label: 'Beastkin', kind: 'origin' },
  { id: 'elemental', label: 'Elemental', kind: 'origin' },
  { id: 'fey', label: 'Fey', kind: 'origin' },
  { id: 'cursed', label: 'Cursed', kind: 'origin' },
  { id: 'folk', label: 'Folk', kind: 'origin' },

  { id: 'spellcasting', label: 'Spellcasting', kind: 'boon' },
  { id: 'flight', label: 'Flight', kind: 'boon' },
  { id: 'movement', label: 'Movement', kind: 'boon' },
  { id: 'resilience', label: 'Resilience', kind: 'boon' },
  { id: 'aquatic', label: 'Aquatic', kind: 'boon' },
  { id: 'attribute', label: 'Attribute', kind: 'boon' },
];

/* ---------------------------------------------------- traits several share
 * A handful of ancestries hand out the same trait. It is one card, written
 * once and referenced, so the wording can never drift between them — and its
 * banner says "Lineage Trait" rather than naming any one line.
 */

const SHARED = { kind: 'passive', tags: ['Lineage Trait', 'Passive'], ap: null, wp: null };

const SHARPSENSE = {
  ...SHARED,
  id: 'sharpsense',
  name: 'Sharpsense',
  summary: 'Advantage on any skill check that uses one of your five senses.',
  body: 'You gain advantage on skill checks that use one of your five senses.',
};

const FERAL_INSTINCT = {
  ...SHARED,
  id: 'feral-instinct',
  name: 'Feral Instinct',
  summary: 'Once a combat, react twice to the same action.',
  body:
    'Once per combat, you can react twice to the same action.\n\nThis increases to twice per combat at level 10.',
};

const POISONOUS = {
  ...SHARED,
  id: 'poisonous',
  name: 'Poisonous',
  summary: 'Sharp weapons deal 1 extra damage per die rolled.',
  body:
    'Your body produces a poisonous secretion that increases the damage you deal with sharp weapons by 1 per damage die rolled.\n\nThis increases to 2 at level 10.',
};

const COLD_BLOODED = {
  ...SHARED,
  id: 'cold-blooded',
  name: 'Cold Blooded',
  summary: 'Advantage on Cunning.',
  body: 'You have an advantage in Cunning.',
};

const AMPHIBIAN = {
  ...SHARED,
  id: 'amphibian',
  name: 'Amphibian',
  summary: 'Breathe underwater, and keep full speed while swimming.',
  body: 'You can breathe underwater, and retain your full speed while swimming.',
};

const LIGHT_BODY = {
  ...SHARED,
  id: 'light-body',
  name: 'Light Body',
  summary: 'Movement Speed +2.',
  body: 'Your Movement Speed increases by +2.',
};

const RESILIENCE = {
  ...SHARED,
  id: 'resilience',
  name: 'Resilience',
  summary: '6 health per point of Fortitude and Physique instead of 5.',
  body: 'You gain 6 health per point in Fortitude and {physique} instead of 5.',
};

/**
 * Several ancestries hand you a spell and leave the casting attribute to you.
 * It is the same question every time, so it is written once.
 *
 * Note this is V4 wording: Wisdom and Fortitude are attributes the current
 * system no longer has, and are left here exactly as the sheet printed them.
 */
const CASTING_ABILITY = {
  id: 'casting-ability',
  label: 'Casting attribute',
  prompt: 'Which attribute do you cast this with?',
  placeholder: 'your casting attribute',
  options: [
    { id: 'wisdom', label: 'Wisdom' },
    { id: 'mind', label: 'Mind' },
    { id: 'fortitude', label: 'Fortitude' },
  ],
};

/** Draconic only: the dragon your blood came from, and what it makes you shrug off. */
const SCALE_COLOUR = {
  id: 'scale-colour',
  label: 'Scale colour',
  prompt: 'Which dragon does your blood come from?',
  placeholder: 'your scale colour',
  options: [
    { id: 'red', label: 'Fire', detail: 'Red scales', damage: 'Fire' },
    { id: 'white', label: 'Cold', detail: 'White scales', damage: 'Cold' },
    { id: 'blue', label: 'Lightning', detail: 'Blue scales', damage: 'Lightning' },
    { id: 'black', label: 'Decay', detail: 'Black scales', damage: 'Decay' },
    { id: 'purple', label: 'Psychic', detail: 'Purple scales', damage: 'Psychic' },
    { id: 'yellow', label: 'Sacred', detail: 'Yellow scales', damage: 'Sacred' },
  ],
};

/** Shorthand for a card only one ancestry hands out. */
function own(lineage, card) {
  return {
    kind: 'passive',
    ap: null,
    wp: null,
    ...card,
    tags: ['Lineage', lineage, card.kind === 'ability' ? 'Ability' : 'Passive'],
  };
}

/* ------------------------------------------------------------- the lineages */

export const LINEAGES = [
  {
    id: 'celestial',
    name: 'Celestial',
    tagline: 'An ancestor’s pact with celestial beings, still shining through.',
    // No art yet — the chooser prints an empty plate for it either way.
    art: null,
    tags: ['planar', 'flight', 'spellcasting'],
    blurb:
      'At some point, your ancestor made a pact with celestial beings, forever altering themselves and their descendants. These changes can manifest in various ways. You could have a radiant aura that glows softly, eyes that shine like stars or skin with a slight, otherworldly luminescence. Some might have hair that seems to shimmer like spun gold or silver, skin marked with faint, glowing runes.',
    cards: [
      own('Celestial', {
        id: 'celestial-wings',
        name: 'Celestial Wings',
        summary: 'Wings once a long rest: an hour of flight at your Movement Speed.',
        kind: 'ability',
        ap: 2,
        body:
          'Once after a long rest, you can manifest Celestial wings for 1 hour.\n\nWhile the wings last, you can fly at a speed equal to your Movement Speed.',
      }),
      own('Celestial', {
        id: 'bolster-blessing',
        name: 'Bolster Blessing',
        summary: 'You learn Bolster, and its first multicast is free each long rest.',
        body:
          'You learn the Bolster spell.\n\nYour first multicast is free for you and one additional ally after a long rest. You can multicast to one more ally, but must pay the price for each above the first.\n\nThis increases to the first three allies at level 10.',
      }),
    ],
  },

  {
    id: 'draconic',
    name: 'Draconic',
    tagline: 'Dragon blood in the veins, and scales to prove it.',
    art: null,
    tags: ['planar', 'resilience'],
    blurb:
      'Your ancestors got draconic blood mixed in their veins through rituals or other means, forever altering themselves and their descendants. These changes can manifest in various ways. Your body is covered in scales that match the color of the dragon the blood came from, as well as having potential other draconic features ranging from reptilian eyes to dragon-shaped facial features.',
    cards: [
      own('Draconic', {
        id: 'draconic-hide',
        name: 'Draconic Hide',
        summary: 'Defense +1.',
        body: 'Your Defense increases by +1.',
      }),
      own('Draconic', {
        id: 'chromatic-resistance',
        name: 'Chromatic Resistance',
        summary: 'Resistance to one damage type, named by the colour of your scales.',
        choice: SCALE_COLOUR,
        body:
          'You gain resistance to {choice} damage.\n\nYour scales say which: red is {damage:Fire}, white {damage:Cold}, blue {damage:Lightning}, black {damage:Decay}, purple {damage:Psychic} and yellow {damage:Sacred}.',
      }),
    ],
  },

  {
    id: 'featherborn',
    name: 'Featherborn',
    tagline: 'Winged stock: light bones, keen eyes, quick reactions.',
    art: null,
    tags: ['beastkin', 'movement'],
    blurb:
      'The evolution that guided your lineage has taken an extraordinary path, maintaining characteristics of winged beings not usually found in other races. Your appearance can range widely. Some may retain minor traits such as feathers, keen eyesight and light bones, while others display more striking features like beaks.',
    cards: [LIGHT_BODY, SHARPSENSE, FERAL_INSTINCT],
  },

  {
    id: 'fey',
    name: 'Fey',
    tagline: 'Born of enchanted glades: small, winged and always aloft.',
    art: null,
    tags: ['fey', 'flight'],
    blurb:
      'From living in the heart of enchanted forests and ancient glades, your ancestors have established a deep connection with the realm of the fey. This mystical bond has significantly altered your appearance. You have a smaller stature, delicate wings reminiscent of butterflies or dragonflies. Some might have hair adorned with tiny flowers or leaves, or skin that glows faintly in the dark.',
    cards: [
      own('Fey', {
        id: 'fey-flight',
        name: 'Fey Flight',
        summary: 'Permanent flight, paid for with 3 health per point instead of 5.',
        body:
          'You permanently gain the ability to fly.\n\nHowever, you gain 3 health per level in Fortitude and {physique} instead of 5.',
      }),
    ],
  },

  {
    id: 'furborn',
    name: 'Furborn',
    tagline: 'Fur-covered stock: hardy, sharp-nosed and quick to answer.',
    art: null,
    tags: ['beastkin', 'resilience'],
    blurb:
      'The evolution that shaped your lineage has followed a distinctive course, preserving traits of fur-covered creatures not commonly seen in other races. Your appearance can vary significantly. Some may exhibit subtle features such as fur, rounded ears and a heightened sense of smell, while others possess more pronounced characteristics like animalistic facial structures, claws and enhanced physical attributes.',
    cards: [RESILIENCE, SHARPSENSE, FERAL_INSTINCT],
  },

  {
    id: 'gillborn',
    name: 'Gillborn',
    tagline: 'Aquatic stock: poisonous, cold-blooded, at home underwater.',
    art: null,
    tags: ['beastkin', 'aquatic'],
    blurb:
      'The evolution that shaped your lineage has followed a remarkable course, preserving traits of aquatic creatures not commonly seen in other races. Your appearance can vary widely. Some may retain subtle features such as smooth, scaled skin, fins and gills, while others exhibit more pronounced characteristics like a fish-shaped head, webbed limbs and an aquatic-adapted body structure.',
    cards: [POISONOUS, FERAL_INSTINCT, COLD_BLOODED, AMPHIBIAN],
  },

  {
    id: 'infernal',
    name: 'Infernal',
    tagline: 'An ancestor’s bargain with infernal entities, still being paid.',
    art: null,
    tags: ['planar', 'flight', 'spellcasting'],
    blurb:
      'At some point, your ancestor made a deal with infernal entities, forever changing themselves and their descendants. These changes can manifest in various ways. You could have horns of varying shapes and sizes, unusual skin colors like deep red, ash gray or even black. Others could have tails, pointed ears or hair that seems to smolder like embers.',
    cards: [
      own('Infernal', {
        id: 'infernal-wings',
        name: 'Infernal Wings',
        summary: 'Wings once a long rest: an hour of flight at your Movement Speed.',
        kind: 'ability',
        ap: 2,
        body:
          'Once after a long rest, you can manifest Infernal wings for 1 hour.\n\nWhile the wings last, you can fly at a speed equal to your Movement Speed.',
      }),
      own('Infernal', {
        id: 'dark-bargain',
        name: 'Dark Bargain',
        summary: 'You learn Dark Bargain, and its first two overcasts are free each long rest.',
        choice: CASTING_ABILITY,
        body:
          'You learn the Dark Bargain spell, cast with {choice}.\n\nYour first two overcasts of this spell are free after a long rest; this increases to the first four at level 10.',
      }),
    ],
  },

  {
    id: 'luminary',
    name: 'Luminary',
    /* A card that says "your Mind increases by +1" has to actually raise it.
       Declared here as well as printed on the card, because the sheet cannot
       read prose: levelPicks.js adds these on top of base, the level-1 spread
       and every odd level's point. */
    attributes: { mind: 1 },
    tagline: 'A line that prized learning, and bred quicker minds for it.',
    art: null,
    tags: ['folk', 'attribute'],
    blurb:
      'Hailing from a lineage that prioritizes education, the Luminary lineage boasts individuals with quicker minds than most. These ancestors valued knowledge and intellectual growth, passing down a legacy of sharp wit and keen intellect.',
    cards: [
      own('Luminary', {
        id: 'quick-mind',
        name: 'Quick Mind',
        summary: 'Mind +1.',
        body: 'Your {mind} increases by +1.',
      }),
    ],
  },

  {
    id: 'muckborn',
    name: 'Muckborn',
    tagline: 'Exoskeletal stock: climbs walls, and should not be bitten.',
    art: null,
    tags: ['beastkin'],
    blurb:
      'The evolution that influenced your lineage has taken an unusual route, maintaining traits of exoskeleton-bearing beings not typically observed in other races. Your appearance can vary extensively. Some may exhibit minor features such as a segmented body, multiple limbs and exoskeletal elements, while others display more prominent characteristics like antennae, chitinous shells and an adaptable, flexible form.',
    cards: [
      own('Muckborn', {
        id: 'sticky',
        name: 'Sticky',
        summary: 'You can walk on walls and ceilings.',
        body: 'You can walk on walls and ceilings.',
      }),
      COLD_BLOODED,
      POISONOUS,
    ],
  },

  {
    id: 'scaleborn',
    name: 'Scaleborn',
    tagline: 'Reptilian stock: tough, venomous and slow to anger.',
    art: null,
    tags: ['beastkin', 'resilience'],
    blurb:
      'The evolution that directed your lineage has carved a unique path, preserving features of scaled creatures not often seen in other races. Your appearance can vary greatly. Some may retain subtle traits such as scales, slit pupils and a cold-blooded nature, while others possess more pronounced characteristics like reptilian head shapes, tails and a robust, scaly physique.',
    cards: [RESILIENCE, POISONOUS, COLD_BLOODED],
  },

  {
    id: 'scorchbound',
    name: 'Scorchbound',
    tagline: 'Raised beside the fire, and carrying some of it.',
    art: null,
    tags: ['elemental', 'spellcasting'],
    blurb:
      'From living in proximity to a volcano or other natural source of heat, your ancestors have established a deep connection with the element of fire. This elemental bond has significantly altered your appearance. You could have ashen skin, red eyes, fiery hair or even glowing ember-like freckles. Some might have hair that flickers like flames or eyes that smolder with an inner heat.',
    cards: [
      own('Scorchbound', {
        id: 'furnace-heart',
        name: 'Furnace Heart',
        summary: 'Once a round, burn health for 2 Reaction Points.',
        body:
          'Once per round, you can burn health equal to 5 + your level to gain 2 Reaction Points.',
      }),
      own('Scorchbound', {
        id: 'produce-fire',
        name: 'Produce Fire',
        summary: 'You learn Produce Fire, and its first overcast is free each long rest.',
        choice: CASTING_ABILITY,
        body:
          'You learn the Produce Fire spell, cast with {choice}.\n\nYour first overcast of this spell is free after a long rest; this increases to the first two at level 10.',
      }),
    ],
  },

  {
    id: 'skybound',
    name: 'Skybound',
    tagline: 'Open plains and high peaks. The wind never quite let go.',
    art: null,
    tags: ['elemental', 'movement', 'spellcasting'],
    blurb:
      'From living in open plains or atop high mountains, your ancestors have established a deep connection with the element of wind. This elemental bond has significantly altered your appearance. You could have light, almost translucent skin, hair that flows like the wind, piercing sky-blue eyes or even skin that seems to be in constant motion. Some might have eyes that change color with the weather or hair that whispers like the breeze.',
    cards: [
      own('Skybound', {
        id: 'windborn-stride',
        name: 'Windborn Stride',
        summary: 'Movement Speed +2.',
        body: 'Your Movement Speed is increased by +2.',
      }),
      own('Skybound', {
        id: 'wind-grace',
        name: 'Wind Grace',
        summary: 'Once a turn, your next Move Action costs no Action Points.',
        kind: 'ability',
        wp: 1,
        body: 'Once per turn, you can make your next Move Action cost no Action Points.',
      }),
      own('Skybound', {
        id: 'gravity-control',
        name: 'Gravity Control',
        summary: 'You learn Gravity Control, and its first two castings are free each long rest.',
        choice: CASTING_ABILITY,
        body:
          'You learn the Gravity Control spell, cast with {choice}.\n\nYour first two castings of this spell are free after a long rest; this increases to the first four at level 10.',
      }),
    ],
  },

  {
    id: 'slickborn',
    name: 'Slickborn',
    tagline: 'Amphibian stock: quick, slick and hard to hold.',
    art: null,
    tags: ['beastkin', 'aquatic', 'movement'],
    blurb:
      'The evolution that shaped your lineage has taken a unique path, preserving animalistic characteristics not typically found in other races. As descendants of amphibians, your appearance can vary widely. Some may retain subtle traits such as slick skin, large eyes and gills, while others exhibit more pronounced features like a frog-shaped head and distinct morphologies.',
    cards: [LIGHT_BODY, POISONOUS, COLD_BLOODED, AMPHIBIAN],
  },

  {
    id: 'stalwart',
    name: 'Stalwart',
    attributes: { physique: 1 },
    tagline: 'Bred by harsh country into something harder than most.',
    art: null,
    tags: ['folk', 'attribute'],
    blurb:
      'Descended from ancestors who thrived in harsh environments, the Stalwart lineage embodies physical resilience. Their bodies, tested by the elements, result in individuals more physically imposing than typical for their race.',
    cards: [
      own('Stalwart', {
        id: 'hardened-frame',
        name: 'Hardened Frame',
        summary: 'Physique +1.',
        body: 'Your {physique} increases by +1.',
      }),
    ],
  },

  {
    id: 'stonebound',
    name: 'Stonebound',
    tagline: 'Deep forest and deeper mountain. The earth answers you.',
    art: null,
    tags: ['elemental', 'spellcasting'],
    blurb:
      'From living in the depths of forests or within the mountains, your ancestors have established a deep connection with the element of earth. This elemental bond has significantly altered your appearance. You could have rugged, stone-like skin, mossy hair, eyes that shimmer like precious gems or even hair resembling gemstones. Some might have bark-like skin patterns or eyes that sparkle like crystals.',
    cards: [
      own('Stonebound', {
        id: 'stoneskin',
        name: 'Stoneskin',
        summary: 'Defense +1.',
        body: 'Your Defense increases by +1.',
      }),
      own('Stonebound', {
        id: 'stone-shape',
        name: 'Stone Shape',
        summary: 'You learn Stone Shape, and its first overcast is free each long rest.',
        choice: CASTING_ABILITY,
        body:
          'You learn the Stone Shape spell, cast with {choice}.\n\nYour first overcast of this spell is free after a long rest; this increases to the first two at level 10.',
      }),
    ],
  },

  {
    id: 'tidebound',
    name: 'Tidebound',
    tagline: 'Raised by water, and never entirely out of it.',
    art: null,
    tags: ['elemental', 'spellcasting'],
    blurb:
      'From living near oceans, rivers or other natural sources of water, your ancestors have established a deep connection with the element of water. This elemental bond has significantly altered your appearance. You could have smooth, blue-tinged skin, flowing hair that moves like water, deep sea-green eyes or even hair resembling seaweed. Some might have skin that shimmers or eyes that change color like the ocean.',
    cards: [
      own('Tidebound', {
        id: 'rising-tide',
        name: 'Rising Tide',
        summary: 'Willpower +1 at every odd level.',
        body: 'Your Willpower increases by +1 at every odd level.',
      }),
      own('Tidebound', {
        id: 'create-water',
        name: 'Create Water',
        summary: 'You learn Create Water, and its first two overcasts are free each long rest.',
        choice: CASTING_ABILITY,
        body:
          'You learn the Create Water spell, cast with {choice}.\n\nYour first two overcasts of this spell are free after a long rest; this increases to the first four at level 10.',
      }),
    ],
  },

  {
    id: 'undead',
    name: 'Undead',
    tagline: 'Cursed with undeath: very hard to kill, and slow to mend.',
    art: null,
    tags: ['cursed', 'resilience'],
    blurb:
      'Regardless of your lineage’s origins, it has been cursed with undeath, bestowing upon you remarkable resilience but at the expense of a slow metabolism. This curse has left its mark on your appearance, which can range from pale skin and a malnourished look to a skeletal visage. The curse of undeath has made you unnaturally hard to kill but has also altered your physical appearance.',
    cards: [
      own('Undead', {
        id: 'undying',
        name: 'Undying',
        summary: '8 health per point instead of 5, but reaching 0 kills you outright.',
        body:
          'You gain 8 health per point in Fortitude and {physique} instead of 5.\n\nHowever, if your health reaches 0, you instantly die.\n\nLong rests restore only a quarter of your health, and short rests restore none.', // text-style-ok: joins two clauses
      }),
      own('Undead', {
        id: 'corpse-feed',
        name: 'Feed',
        summary: 'Once a short rest, feed on a fresh corpse to regain a quarter of your health.',
        kind: 'ability',
        ap: 6,
        body:
          'You feed on a fresh corpse, regaining a quarter of your health.\n\nThis can be used once per short rest.',
      }),
    ],
  },

  {
    id: 'wildheart',
    name: 'Wildheart',
    attributes: { instinct: 1 },
    tagline: 'A simple life close to nature, and the instincts it leaves.',
    art: null,
    tags: ['folk', 'attribute'],
    blurb:
      'Your ancestors lived a simple life close to nature, allowing you to retain a deep connection to the primal part of yourself. This lineage grants you good instincts and sharp reflexes, honed by generations of living in harmony with the wild.',
    cards: [
      own('Wildheart', {
        id: 'primal-instincts',
        name: 'Primal Instincts',
        summary: 'Instinct +1.',
        body: 'Your {instinct} increases by +1.',
      }),
    ],
  },
];

/* ------------------------------------------------------------------ lookups */

/**
 * Every lineage card, flat and deduplicated — a shared trait is one object
 * referenced by several ancestries, so the registry must not list it twice.
 */
export const LINEAGE_CARDS = [
  ...new Map(LINEAGES.flatMap((lineage) => lineage.cards).map((card) => [card.id, card])).values(),
];

const BY_ID = new Map(LINEAGES.map((lineage) => [lineage.id, lineage]));
const BY_NAME = new Map(LINEAGES.map((lineage) => [lineage.name.toLowerCase(), lineage]));

/**
 * A lineage by id or printed name.
 *
 * The character row stores a plain name in its `lineage` text column — it
 * predates this codex and a table is free to write its own — so a lookup that
 * misses is not an error. It just means this one was written in by hand.
 */
export function getLineage(key) {
  if (!key) return null;
  const word = String(key).trim().toLowerCase();
  if (!word) return null;
  return BY_ID.get(word) ?? BY_NAME.get(word) ?? null;
}

/** Tag descriptors for the ids a lineage lists, in the codex's own order. */
export function lineageTags(lineage) {
  const ids = new Set(lineage?.tags ?? []);
  return LINEAGE_TAGS.filter((tag) => ids.has(tag.id));
}

/** Only the tags some lineage actually uses, so the filter row stays honest. */
export function usedLineageTags() {
  const ids = new Set(LINEAGES.flatMap((lineage) => lineage.tags ?? []));
  return LINEAGE_TAGS.filter((tag) => ids.has(tag.id));
}
