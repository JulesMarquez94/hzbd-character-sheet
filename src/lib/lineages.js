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
 * Transcribed 2026-08-21 from two tabs, `General Rules - Lineage` and
 * `General Rules - Lineage Cards`, which replace the V4 "Hazebound - Character
 * Sheet V4 - LINEAGE" sheet the previous codex came from. Thirteen ancestries
 * and twenty-two card rows, against the V4 sheet's eighteen and twenty-seven.
 *
 * **The six beastkin lines are gone.** Featherborn, Furborn, Gillborn,
 * Muckborn, Scaleborn and Slickborn are not on the new tab. In their place is
 * one ancestry, Wildkin, which hands the player the pool those six used to
 * divide between them and asks for two of it. See WILDKIN_POOL below: it is the
 * first lineage on either sheet that asks you to choose a card rather than a
 * value inside one.
 *
 * V4 cards with no row on the new tab are gone with them: Bolster Blessing,
 * Dark Bargain, Produce Fire, Gravity Control, Stone Shape, Create Water,
 * Chromatic Resistance, Feral Instinct, Light Body, Poisonous, Resilience,
 * Quick Mind, Hardened Frame, Primal Instincts, Celestial Wings, Infernal
 * Wings, Fey Flight, Furnace Heart, Windborn Stride, Stoneskin, Rising Tide,
 * Draconic Hide, Undying and Feed. Several return under a new name and new
 * numbers, which is why none of the old ids survive.
 *
 * The V4 casting-attribute question is gone too. Every spell a lineage now
 * grants is cast with "your highest Attribute", so no lineage card asks which
 * attribute you cast it with, and the Wisdom and Fortitude options that
 * question used to offer are off the sheet.
 *
 * ---------------------------------------------------------------- the reads
 * The tabs are a working document and carry the designer's own typing. Each
 * correction is one word, recorded here rather than made quietly. This is the
 * same trade actions.js and the Duelist's four moves made.
 *
 *   Names       "Sharpsen" reads Sharp Sense, which is what the Wildkin pool
 *               and the picture both call it. "Venemous" reads Venomous,
 *               "Canibalism"/"Canibalisme" reads Cannibalism, "Undeath
 *               Resillience" reads Undeath Resilience, and "Wild Swiftness,"
 *               loses its trailing comma. The Skybound row asks for "Wing
 *               Grace" and the card tab prints WIND GRACE, so the card's own
 *               tab wins. The Draconic row asks for "Draconic Scale" and the
 *               card tab prints DRACONIC SCALES, likewise.
 *   Spelling    "YOu" is You, "eahc" each, "aiblity" ability, "befoer" and
 *               "befoe" before, "cna" can, "taka" take a, "agaisnt" against,
 *               "additonal" and "additonaly" additional and Additionally,
 *               "resitence" resistant, "advenatge" advantage, "cielings"
 *               ceilings, "fice sense" five senses, "breath" breathe, "ony"
 *               only, "half you maximum" half your maximum, "You breathes" You
 *               breathe, and "draconicdracon" draconic. INTELLIGENT's sentence
 *               ends on a hyphen; it is a full stop.
 *   Number      "this spell use" reads uses, "is increase by 1" increased by 1,
 *               "short rest no longer restore" short rests, "long rest ony let"
 *               long rests only let, and "a sleight of hands" a sleight of hand.
 *   Person      DRAGON BREATH is written off a monster's stat block: "in front
 *               of itself" reads in front of you, "the entities Reflex" the
 *               entity's Reflex, and "2 x Highest Attribute" 2 x your highest
 *               Attribute. Every other card on both tabs addresses the reader,
 *               and a player's card that calls them "it" is the odd one.
 *   Units       "1.5 meter (5 feet)" reads 1.5 meters (5 feet) and "a 6 meter
 *               (20 feet) cone" a 6-meter (20-foot) cone, which is how every
 *               distance in spells.js is already written.
 *   Terms       health reads Health, defense Defense, movement speed Movement
 *               Speed, decay Decay. Every one of these exists so a defined
 *               term lights, which is the trade the Duelist's moves made.
 *   Modular     INNATE X carries "(mdoular card were X is replace with the
 *               type of school in the anme)". That is a note to the builder
 *               rather than rules text, so it is dropped from the card and
 *               built instead: the six schools the lineage tab names each get
 *               their own card. See `innate` below.
 *   Built       DRAGON BREATH's "your draconic scale colour" is the colour
 *               DRACONIC SCALES asks you for, so it is a `{{Draconic Scales}}`
 *               link rather than prose: the reader taps through to the card
 *               that holds the answer instead of going to look for it. INNATE
 *               X's "a Novice X Spell" is a `{choice}` for the same reason,
 *               and its placeholder is those four words: unanswered the card
 *               still prints the cell, answered it prints the spell.
 *
 * ------------------------------------------------------- how this was proved
 * Every card's body was resolved back through its markers and compared to the
 * designer's cell with case and punctuation flattened, alongside its AP, its WP
 * and all thirteen blurbs. **64 of 82 comparisons match**, and all eighteen that
 * differ are the reads above: no body, cost or blurb differs for any other
 * reason. The six INNATE cards were each checked against the one modular row
 * they were built from.
 *
 * ------------------------------------------------------------- and the flags
 * Four things the sheet leaves open. None is guessed at here.
 *
 *   1. **LIVING FURNACE does not say what you regain.** "You regain 10 + 5 for
 *      each Willpower spent" names no pool. Health is the only one that fits
 *      the numbers, and it is still not what the cell says, so the card prints
 *      the sentence as written.
 *   2. **SPROUT WINGS is one card given to two ancestries, and its text names
 *      one of them.** Celestial and Infernal both take it and it reads
 *      "Celestial wings". V4 had two cards for this, CELESTIAL WINGS and
 *      INFERNAL WINGS; the new tab has one row and one picture. Left as
 *      printed.
 *   3. **Three cards still say "Fortitude", which V5 does not have.** FEY
 *      BLOOD, UNDEATH RESILIENCE and HEARTHY all read "per level in Fortitude
 *      and Physique". `deriveStats` computes Health as 10 per character level
 *      plus 10 per Physique, so the app already reads the first half as level.
 *      The wording is the designer's to update.
 *   4. **Innate Light and Innate Shadow name schools the codex has not got.**
 *      Fire, Wind, Water and Earth are all Elemental families with Novice
 *      spells already written. Light and Shadow are neither a school nor a
 *      family anywhere in spells.js, so those two cards promised a spell that
 *      could not be looked up, and a Celestial could never finish their level 1.
 *      Both schools now hold one stand-in spell apiece, UNWRITTEN LIGHT and
 *      UNWRITTEN SHADOW, which say on their own face that they are standing in.
 *      See the note over them at the foot of spells.js. The shelves are read off
 *      the codex, so writing the real spells is all it takes to replace them.
 *
 * Two more, smaller. SPROUT WINGS is tagged `Basic Action` on a tab of lineage
 * cards, and is treated as the Ability its 2 AP and 2 WP make it. LIVING
 * FURNACE is tagged `Passive` while carrying a cost, and is treated as an
 * Ability for the same reason; its Willpower column reads `x`, which no card
 * shape can hold, so the ceiling is printed in the body the way V4's FURNACE
 * HEART printed its own price.
 *
 * DRAGON BREATH and the six INNATE cards roll "your highest Attribute", which
 * is not one of the three a `[[…]]` marker can resolve, so both print their
 * formula as prose rather than a live number a Mind character would read wrong.
 *
 * ------------------------------------------------------ one id had to change
 * **DRAGON BREATH is `dragon-breath-lineage`, not `dragon-breath`.** The Draconic
 * Bond's Adept ability already held that id, and it is the same effect written for
 * the ally rather than for you: 2d4 and its Mind, in front of *itself*. This one is
 * 2d6 and your highest Attribute, so they are two cards and not one, and the older
 * keeps the id because an id is what a saved character points at. Same trade
 * RESILIENCE and CREATE WATER made, and see the note in weapons.js for why a
 * collision has to be caught rather than left: it does not throw, it loses a card.
 *
 * The printed *name* still collides, by design, the way CREATE WATER’s does. No
 * `{{Dragon Breath}}` link exists today, and one written now would resolve to the
 * ally's card, because that is the one the registry sees first.
 *
 * What a lineage card *says* and what the sheet *computes* are still two
 * different things, exactly as they were under V4: only the three attribute
 * grants below are declared, and Defense, Willpower, Health per level and
 * Movement Speed are printed and not yet wired. See data/README.md.
 *
 * --------------------------------------------------------------- card text
 * Card bodies use the same markers as every other card — see the header of
 * weapons.js. These are folded into the global registry by weapons.js, so every
 * link resolves and any of them can be dealt onto the pile.
 *
 * This file is a leaf: nothing it imports may reach weapons.js or items.js.
 * spells.js is one, which is why the Innate cards can read their own shelf here
 * rather than describing it and having somebody else resolve it. The registry in
 * weapons.js folds in both, so an Innate card's options are the same objects
 * every `{{link}}` and every `getCard` already hands back.
 */

import { withArt } from './cardArt.js';
import { SPELLS } from './spells.js';

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

/* ------------------------------------------------------- the card two share
 * Celestial and Infernal both take SPROUT WINGS. It is one card, written once
 * and referenced, so the wording can never drift between them — and its banner
 * says "Lineage Trait" rather than naming either line. Flag 2 above is that the
 * wording itself names Celestial.
 */

const SPROUT_WINGS = {
  id: 'sprout-wings',
  name: 'Sprout Wings',
  kind: 'ability',
  tags: ['Lineage Trait', 'Ability'],
  ap: 2,
  wp: 2,
  /* "You must take a long rest before you can use this ability again." One use,
     and the long rest is what fills it. The sentence stays the designer's and
     the rider is what the sheet counts. See uses.js. */
  uses: 1,
  recharge: 'Long Rest',
  summary: 'Wings for an hour: fly at your Movement Speed, once a long rest.',
  body:
    'You can manifest Celestial wings for 1 hour.\n\n' +
    'While the wings last, you can fly at a speed equal to your Movement Speed.\n\n' +
    'You must take a long rest before you can use this ability again.',
};

/* ------------------------------------------------------------ INNATE X built
 * One row on the tab, six cards on the sheet. The row is marked modular and the
 * lineage tab names which school each ancestry gets, so the six are built from
 * the row rather than written six times: the body is the cell's, and the only
 * thing that moves is the word the cell called X.
 *
 * **Which spell is a question, and the card asks it.** "You permanently learn a
 * Novice Fire Spell" is a promise, and a promise is not a spell: until it is
 * answered a Scorchbound holds a card about a spell and no spell. So the
 * school's Novice shelf is the card's `choice`, asked in the window that hands
 * the lineage over, and the spell it names joins the hand as a card of its own.
 * The shelf is read off spells.js rather than listed here, so a spell written
 * tomorrow is on offer tomorrow.
 *
 * Light and Shadow are flag 4 above.
 */

/**
 * The Novice shelf of one school word, in the codex's own order.
 *
 * One word, matched against the whole banner rather than against a position on
 * it, because the six schools a lineage names do not all sit in the same place:
 * Fire, Wind, Water and Earth are families under Elemental and read third,
 * while Light and Shadow are schools of their own and read second.
 */
function noviceSpells(school) {
  return SPELLS.filter((spell) => {
    const tags = spell.tags ?? [];
    return tags.some((tag) => tag.startsWith('Novice')) && tags.includes(school);
  });
}

function innate(school) {
  const shelf = noviceSpells(school);

  /* A school with an empty shelf promises a spell that cannot be chosen, and the
     lineage that hands the card out can never be finished. Said out loud rather
     than left for a player to find, the way weapons.js says a clashing id. */
  if (import.meta.env?.DEV && shelf.length === 0) {
    console.error(
      `[hazebound] Innate ${school} offers no Novice spell, so the lineage holding it can never be settled. ` +
        'Write one, or stand a placeholder in for it the way Light and Shadow have.'
    );
  }

  return {
    id: `innate-${school.toLowerCase()}`,
    name: `Innate ${school}`,
    kind: 'passive',
    tags: ['Lineage Trait', 'Passive'],
    ap: null,
    wp: null,
    summary: `You learn a Novice ${school} Spell, cast with your highest Attribute.`,
    /* Which spell is the card's own question, and the school's Novice shelf is
       the answer to it. `learns` is what says the answer is a card rather than a
       word: the spell chosen here is one the character then holds, and
       lineageCards below is where it joins the hand. */
    choice: {
      id: `innate-${school.toLowerCase()}-spell`,
      label: `Novice ${school} Spell`,
      prompt: `Which Novice ${school} Spell does your blood know?`,
      placeholder: `a Novice ${school} Spell`,
      learns: true,
      options: shelf.map((spell) => ({ id: spell.id, label: spell.name, card: spell })),
    },
    /* `{choice}` rather than the cell's own words, and the placeholder above is
       those words: unanswered, the card still reads "You permanently learn a
       Novice Fire Spell", and answered it names the spell. The same trade
       DRACONIC SCALES makes with its colour. */
    body:
      `You permanently learn {choice}.\n\n` +
      'This spell uses your highest Attribute.',
  };
}

const INNATE_LIGHT = innate('Light');
const INNATE_SHADOW = innate('Shadow');
const INNATE_FIRE = innate('Fire');
const INNATE_WIND = innate('Wind');
const INNATE_WATER = innate('Water');
const INNATE_EARTH = innate('Earth');

/* --------------------------------------------------------- the Wildkin pool
 * Eight traits, of which a Wildkin keeps two. These are cards like any other:
 * they are in the registry, they can be dealt, and the two a character kept are
 * the two that print on their sheet. See WILDKIN_POOL and lineageCards below.
 */

const AMPHIBIAN = own('Wildkin', {
  id: 'amphibian',
  name: 'Amphibian',
  summary: 'Breathe underwater, swim at full speed and shrug off Cold.',
  body:
    'You can breathe underwater and your Movement Speed is not halved while swimming.\n\n' +
    'Additionally you are resistant to {damage:Cold} damage.',
});

const SCALEY = own('Wildkin', {
  id: 'scaley',
  name: 'Scaley',
  summary: 'Defense +1.',
  body: 'Your Defense is increased by 1.',
});

const VENOMOUS = own('Wildkin', {
  id: 'venomous',
  name: 'Venomous',
  summary: 'Your weapon attacks deal an extra 1d4 Decay.',
  body: 'Your weapon attack deals an additional [[1d4]] {damage:Decay} damage.',
});

const COLD_BLOODED = own('Wildkin', {
  id: 'cold-blooded',
  name: 'Cold Blooded',
  kind: 'ability',
  wp: 1,
  summary: 'Advantage on a stealth or sleight of hand check.',
  body:
    'Whenever you make a skill check related to stealth, or a sleight of hand, ' +
    'you can use this to give yourself advantage.',
});

const SHARP_SENSE = own('Wildkin', {
  id: 'sharp-sense',
  name: 'Sharp Sense',
  kind: 'ability',
  wp: 1,
  summary: 'Advantage on a check that uses one of your five senses.',
  body:
    'Whenever you make a skill check that uses one of your five senses, ' +
    'you can use this to give yourself advantage.',
});

const HEARTHY = own('Wildkin', {
  id: 'hearthy',
  name: 'Hearthy',
  summary: '12 Health per level instead of 10.',
  body: 'You gain 12 Health per level in Fortitude and {physique} instead of 10.',
});

const WILD_SWIFTNESS = own('Wildkin', {
  id: 'wild-swiftness',
  name: 'Wild Swiftness',
  summary: 'Movement Speed +1.5 meters.',
  body: 'Your Movement Speed is permanently increased by 1.5 meters (5 feet).',
});

const STICKY = own('Wildkin', {
  id: 'sticky',
  name: 'Sticky',
  summary: 'You can walk on walls and ceilings.',
  body: 'You can walk on walls and ceilings.',
});

/**
 * What a Wildkin is asked, and the only pool on either tab.
 *
 * Every other ancestry hands its cards over as printed. Wildkin hands over the
 * pool and asks for two of it, which is the whole of what the lineage tab says
 * about it: "the player creates his own Wildkin based on his animalistic trait,
 * so he chooses 2 traits that define his character".
 *
 * It is a pool rather than a `choice` on a card because it is not a value
 * inside a card, it is *which cards you have*. A `choice` rewrites one card's
 * text; this decides what is on the sheet at all.
 *
 * The tab lists the eight below. A stray cell on the card tab lists the same
 * pool without STICKY; the lineage tab's list is the longer of the two and the
 * one that reads as deliberate, so it is the pool.
 */
const WILDKIN_POOL = {
  id: 'wildkin-traits',
  label: 'Animalistic traits',
  prompt: 'Which two traits define your Wildkin?',
  picks: 2,
  options: [
    AMPHIBIAN,
    SCALEY,
    VENOMOUS,
    COLD_BLOODED,
    SHARP_SENSE,
    HEARTHY,
    WILD_SWIFTNESS,
    STICKY,
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

/* ------------------------------------------------------------- the lineages */

/**
 * The codex as authored. Nothing outside this file reads it: LINEAGES below is
 * the same thirteen with every card wearing its picture.
 */
const LINEAGE_CODEX = [
  {
    id: 'celestial',
    name: 'Celestial',
    tagline: 'An ancestor’s pact with celestial beings, still shining through.',
    art: '/lineages/celestial.jpg',
    tags: ['planar', 'flight', 'spellcasting'],
    blurb:
      'At some point, your ancestor made a pact with celestial beings, forever altering themselves and their descendants. These changes can manifest in various ways. You could have a radiant aura that glows softly, eyes that shine like stars, or skin with a slight, otherworldly luminescence. Some might have hair that seems to shimmer like spun gold or silver, skin marked with faint, glowing runes.', // text-style-ok: the designer's blurb, transcribed
    cards: [SPROUT_WINGS, INNATE_LIGHT],
  },

  {
    id: 'infernal',
    name: 'Infernal',
    tagline: 'An ancestor’s bargain with infernal entities, still being paid.',
    art: '/lineages/infernal.jpg',
    tags: ['planar', 'flight', 'spellcasting'],
    blurb:
      'At some point, your ancestor made a deal with infernal entities, forever changing themselves and their descendants. These changes can manifest in various ways. You could have horns of varying shapes and sizes, unusual skin colors like deep red, ash gray, or even black. Others could have tails, pointed ears, or hair that seems to smolder like embers.', // text-style-ok: the designer's blurb, transcribed
    cards: [SPROUT_WINGS, INNATE_SHADOW],
  },

  {
    id: 'fey',
    name: 'Fey',
    tagline: 'Born of enchanted glades: small, winged and always aloft.',
    art: '/lineages/fey.jpg',
    tags: ['fey', 'flight'],
    blurb:
      'From living in the heart of enchanted forests and ancient glades, your ancestors have established a deep connection with the realm of the fey. This mystical bond has significantly altered your appearance. You have a smaller stature, delicate wings reminiscent of butterflies or dragonflies. Some might have hair adorned with tiny flowers or leaves, or skin that glows faintly in the dark.',
    cards: [
      own('Fey', {
        id: 'fey-blood',
        name: 'Fey Blood',
        summary: 'Permanent flight, paid for with 7 Health per level instead of 10.',
        body:
          'You permanently gain the ability to fly.\n\n' +
          'However, you gain 7 Health per level in Fortitude and {physique} instead of 10.',
      }),
    ],
  },

  {
    id: 'scorchbound',
    name: 'Scorchbound',
    tagline: 'Raised beside the fire, and carrying some of it.',
    art: '/lineages/scorchbound.jpg',
    tags: ['elemental', 'spellcasting'],
    blurb:
      'From living in proximity to a volcano or other natural source of heat, your ancestors have established a deep connection with the element of fire. This elemental bond has significantly altered your appearance. You could have ashen skin, red eyes, fiery hair, or even glowing ember-like freckles. Some might have hair that flickers like flames or eyes that smolder with an inner heat.', // text-style-ok: the designer's blurb, transcribed
    cards: [
      own('Scorchbound', {
        id: 'living-furnace',
        name: 'Living Furnace',
        kind: 'ability',
        ap: 2,
        /* "Once this ability is used you need to take a long rest before you can
           do it again." One use, filled by the long rest. See uses.js. */
        uses: 1,
        recharge: 'Long Rest',
        summary: 'Spend up to your level in Willpower to regain 10, plus 5 for each point.',
        body:
          'You let fire rage in your core. Spend up to your level in Willpower.\n\n' +
          'You regain 10 + 5 for each Willpower spent.\n\n' +
          'Once this ability is used you need to take a long rest before you can do it again.',
      }),
      INNATE_FIRE,
    ],
  },

  {
    id: 'skybound',
    name: 'Skybound',
    tagline: 'Open plains and high peaks. The wind never quite let go.',
    art: '/lineages/skybound.jpg',
    tags: ['elemental', 'movement', 'spellcasting'],
    blurb:
      'From living in open plains or atop high mountains, your ancestors have established a deep connection with the element of wind. This elemental bond has significantly altered your appearance. You could have light, almost translucent skin, hair that flows like the wind, piercing sky-blue eyes, or even skin that seems to be in constant motion. Some might have eyes that change color with the weather or hair that whispers like the breeze.', // text-style-ok: the designer's blurb, transcribed
    cards: [
      own('Skybound', {
        id: 'wind-grace',
        name: 'Wind Grace',
        summary: 'Movement Speed +1.5 meters.',
        body: 'Your Movement Speed is permanently increased by 1.5 meters (5 feet).',
      }),
      INNATE_WIND,
    ],
  },

  {
    id: 'tidebound',
    name: 'Tidebound',
    tagline: 'Raised by water, and never entirely out of it.',
    art: '/lineages/tidebound.jpg',
    tags: ['elemental', 'spellcasting'],
    blurb:
      'From living near oceans, rivers, or other natural sources of water, your ancestors have established a deep connection with the element of water. This elemental bond has significantly altered your appearance. You could have smooth, blue-tinged skin, flowing hair that moves like water, deep sea-green eyes, or even hair resembling seaweed. Some might have skin that shimmers or eyes that change color like the ocean.', // text-style-ok: the designer's blurb, transcribed
    cards: [
      own('Tidebound', {
        id: 'inner-tide',
        name: 'Inner Tide',
        summary: 'Willpower +4.',
        body: 'Your Willpower is increased by 4.',
      }),
      INNATE_WATER,
    ],
  },

  {
    id: 'stonebound',
    name: 'Stonebound',
    tagline: 'Deep forest and deeper mountain. The earth answers you.',
    art: '/lineages/stonebound.jpg',
    tags: ['elemental', 'resilience', 'spellcasting'],
    blurb:
      'From living in the depths of forests or within the mountains, your ancestors have established a deep connection with the element of earth. This elemental bond has significantly altered your appearance. You could have rugged, stone-like skin, mossy hair, eyes that shimmer like precious gems, or even hair resembling gemstones. Some might have bark-like skin patterns or eyes that sparkle like crystals.', // text-style-ok: the designer's blurb, transcribed
    cards: [
      own('Stonebound', {
        id: 'mineral-skin',
        name: 'Mineral Skin',
        summary: 'Defense +1.',
        body: 'Your Defense is increased by 1.',
      }),
      INNATE_EARTH,
    ],
  },

  {
    id: 'draconic',
    name: 'Draconic',
    tagline: 'Dragon blood in the veins, and scales to prove it.',
    art: '/lineages/draconic.jpg',
    tags: ['planar', 'resilience'],
    blurb:
      'Your ancestors got draconic blood mixed in their veins through rituals or other means, forever altering themselves and their descendants. These changes can manifest in various ways. Your body is covered in scales that match the color of the dragon the blood came from, as well as having potential other draconic features ranging from reptilian eyes to dragon-shaped facial features.',
    cards: [
      own('Draconic', {
        id: 'draconic-scales',
        name: 'Draconic Scales',
        summary: 'Resistance to one damage type, named by the colour of your scales.',
        choice: SCALE_COLOUR,
        body:
          'You gain resistance to {choice} damage.\n\n' +
          'Your scales say which: red is {damage:Fire}, white {damage:Cold}, blue {damage:Lightning}, black {damage:Decay}, purple {damage:Psychic} and yellow {damage:Sacred}.',
      }),
      own('Draconic', {
        /* Not `dragon-breath`: the Draconic Bond's Adept ability already holds
           that id, and this card is the same effect rewritten for the player
           rather than the ally. See "one id had to change" in the header. */
        id: 'dragon-breath-lineage',
        name: 'Dragon Breath',
        kind: 'ability',
        ap: 4,
        wp: 2,
        summary: 'A 6-meter cone: 2d6 + twice your highest Attribute, in your scale colour.',
        body:
          'You breathe a torrent of magical energy in front of you, affecting all in a 6-meter (20-foot) cone.\n\n' +
          'You make a highest Attribute roll against the entity’s Reflex.\n\n' +
          'On a success, it deals 2d6 + 2 x your highest Attribute damage in your {{Draconic Scales}} colour.',
      }),
    ],
  },

  {
    id: 'stalwart',
    name: 'Stalwart',
    /* A card that says "your Physique is increased by 1" has to actually raise
       it. Declared here as well as printed on the card, because the sheet cannot
       read prose: levelPicks.js adds these on top of base, the level-1 spread
       and every odd level's point. */
    attributes: { physique: 1 },
    tagline: 'Bred by harsh country into something harder than most.',
    art: '/lineages/stalwart.jpg',
    tags: ['folk', 'attribute'],
    blurb:
      'Descended from ancestors who thrived in harsh environments, the Stalwart lineage embodies physical resilience. Their bodies, tested by the elements, result in individuals more physically imposing than typical for their race.',
    cards: [
      own('Stalwart', {
        id: 'strong',
        name: 'Strong',
        summary: 'Physique +1.',
        body: 'Your {physique} is increased by 1.',
      }),
    ],
  },

  {
    id: 'wildheart',
    name: 'Wildheart',
    attributes: { instinct: 1 },
    tagline: 'A simple life close to nature, and the instincts it leaves.',
    art: '/lineages/wildheart.jpg',
    tags: ['folk', 'attribute'],
    blurb:
      'Your ancestors lived a simple life close to nature, allowing you to retain a deep connection to the primal part of yourself. This lineage grants you good instincts and sharp reflexes, honed by generations of living in harmony with the wild.',
    cards: [
      own('Wildheart', {
        id: 'instinctual',
        name: 'Instinctual',
        summary: 'Instinct +1.',
        body: 'Your {instinct} is increased by 1.',
      }),
    ],
  },

  {
    id: 'luminary',
    name: 'Luminary',
    attributes: { mind: 1 },
    tagline: 'A line that prized learning, and bred quicker minds for it.',
    art: '/lineages/luminary.jpg',
    tags: ['folk', 'attribute'],
    blurb:
      'Hailing from a lineage that prioritizes education, the Luminary lineage boasts individuals with quicker minds than most. These ancestors valued knowledge and intellectual growth, passing down a legacy of sharp wit and keen intellect.',
    cards: [
      own('Luminary', {
        id: 'intelligent',
        name: 'Intelligent',
        summary: 'Mind +1.',
        body: 'Your {mind} is increased by 1.',
      }),
    ],
  },

  {
    id: 'undead',
    name: 'Undead',
    tagline: 'Cursed with undeath: very hard to kill, and slow to mend.',
    art: '/lineages/undead.jpg',
    tags: ['cursed', 'resilience'],
    blurb:
      'Regardless of your lineage’s origins, it has been cursed with undeath, bestowing upon you remarkable resilience but at the expense of a slow metabolism. This curse has left its mark on your appearance, which can range from pale skin and a malnourished look to a skeletal visage. The curse of undeath has made you unnaturally hard to kill but has also altered your physical appearance.',
    cards: [
      own('Undead', {
        id: 'undeath-resilience',
        name: 'Undeath Resilience',
        summary: '15 Health per level instead of 10, and rests barely mend you.',
        body:
          'You gain 15 Health per level in Fortitude and {physique} instead of 10.\n\n' +
          'However short rests no longer restore Health, and long rests only let you regain half your maximum Health.', // text-style-ok: joins two clauses
      }),
      own('Undead', {
        id: 'cannibalism',
        name: 'Cannibalism',
        kind: 'ability',
        ap: 6,
        wp: 6,
        /* "Once used you need to take a long rest before you can use it again."
           One use, filled by the long rest. See uses.js. */
        uses: 1,
        recharge: 'Long Rest',
        summary: 'Feast on a fresh corpse for half your maximum Health, once a long rest.',
        body:
          'You can feast on a fresh organic dead body to regain half your maximum Health.\n\n' +
          'Once used you need to take a long rest before you can use it again.',
      }),
    ],
  },

  {
    id: 'wildkin',
    name: 'Wildkin',
    tagline: 'A primal bond with the beasts, and two traits of your choosing.',
    art: '/lineages/wildkin.jpg',
    tags: ['beastkin'],
    blurb:
      'At some point, your ancestors forged a primal bond with the beasts of the wild, forever altering themselves and their descendants. These changes can manifest in various ways. You could have prominent traits like animal ears, a sleek tail, sharp claws, or patches of soft fur, feathers, or fine scales. Some might have striking feline, avian, or reptilian eyes, elongated fangs, or hair that resembles a wild mane or feathered crest.', // text-style-ok: the designer's blurb, transcribed
    /* The only ancestry that hands over a pool instead of a hand. `cards` stays
       empty: what a Wildkin holds is the two they kept, which lineageCards
       reads back out of the character. */
    pool: WILDKIN_POOL,
    cards: [],
  },
];

/* ------------------------------------------------------------- wearing the art

   The one step between the codex above and every reader of it, and the reason
   `npm run art:cards` can finally place a lineage picture at all.

   It has to happen *once*, on objects everybody shares. A lineage hands the same
   card out twice — on `lineage.cards` and again, flattened, in the registry — and
   until 2026-08-21 this file wrapped neither: `withArt` spreads, so dressing the
   flattened copy would have given the picture to `getCard` and left the sheet's
   own card bare. That is what pull-card-art.mjs meant by "better reported than
   half-placed", and why every lineage file was skipped.

   So the dressing is done first, on one deduplicated list, and both the registry
   and the thirteen ancestries are rebuilt to point at *those* objects. A card two
   ancestries share is still one object, which is what keeps their wording from
   drifting, and a pool's eight are dressed with the rest: a Wildkin's kept two
   are cards like any other and their briefs draw the same plate. */

const DRESSED = new Map(
  withArt([
    ...new Map(
      LINEAGE_CODEX.flatMap((lineage) => [
        ...lineage.cards,
        ...(lineage.pool?.options ?? []),
      ]).map((card) => [card.id, card])
    ).values(),
  ]).map((card) => [card.id, card])
);

/** The dressed card for one authored card. Throws rather than losing a picture. */
function dressed(card) {
  const worn = DRESSED.get(card.id);
  if (!worn) throw new Error('lineages.js: ' + card.id + ' was never dressed');
  return worn;
}

/** The thirteen ancestries as everything else sees them. */
export const LINEAGES = LINEAGE_CODEX.map((lineage) => ({
  ...lineage,
  cards: lineage.cards.map(dressed),
  ...(lineage.pool
    ? { pool: { ...lineage.pool, options: lineage.pool.options.map(dressed) } }
    : null),
}));

/* ------------------------------------------------------------------ lookups */

/**
 * Every lineage card, flat and deduplicated — a shared card is one object
 * referenced by two ancestries, so the registry must not list it twice.
 *
 * A pool's options are cards in their own right and belong here whether or not
 * anybody picked them, or a Wildkin's two would be the only cards on the sheet
 * that no link could resolve and no pile could deal.
 */
export const LINEAGE_CARDS = [...DRESSED.values()];

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

/**
 * Which cards of a pool this character kept, in the pool's own order.
 *
 * Stored in the `choices` bag under the pool's id, as a list of card ids. That
 * bag is already "what this lineage left to you", and a list in it needs no new
 * column: every other reader looks up `choices[card.id]`, and a pool's id is not
 * a card's.
 */
export function poolPicks(lineage, choices) {
  const pool = lineage?.pool;
  if (!pool) return [];
  const kept = new Set(
    (Array.isArray(choices?.[pool.id]) ? choices[pool.id] : []).map((id) => String(id))
  );
  return pool.options.filter((card) => kept.has(card.id)).slice(0, pool.picks);
}

/**
 * The spell an answered card hands over, or null while the question is open.
 *
 * Only the Innate cards hand one over, and only once they have been answered.
 * A card whose choice is a word rather than a card answers nothing here.
 */
export function learnedFrom(card, choices) {
  if (!card?.choice?.learns) return null;
  const answer = choices?.[card.id];
  return card.choice.options.find((option) => option.id === answer)?.card ?? null;
}

/**
 * The cards this character actually holds from their ancestry.
 *
 * The same as `lineage.cards` for twelve of the thirteen. A Wildkin's hand is
 * the two they took out of the pool, so every surface that prints "what your
 * blood carries" goes through here rather than reading `cards` directly.
 *
 * And a card that teaches a spell hands the spell over as a card of its own,
 * right behind the one that taught it. "You permanently learn a Novice Fire
 * Spell" is a promise until the spell itself is on the sheet: this is where a
 * Scorchbound's Cloak of Flames becomes something they can read, deal and cast
 * rather than a sentence about a spell they chose once.
 */
export function lineageCards(lineage, choices) {
  if (!lineage) return [];
  const held = lineage.pool ? poolPicks(lineage, choices) : lineage.cards;
  return held.flatMap((card) => {
    const learned = learnedFrom(card, choices);
    return learned ? [card, learned] : [card];
  });
}

/** How many of a pool's picks are still outstanding. Zero when there is no pool. */
export function openPicks(lineage, choices) {
  if (!lineage?.pool) return 0;
  return Math.max(0, lineage.pool.picks - poolPicks(lineage, choices).length);
}

/**
 * Keep or drop one of a pool's cards, and hand back the whole list.
 *
 * Taking a third when two are already kept drops the one kept longest, so a
 * pick never has to be cleared before it can be changed.
 */
export function togglePoolPick(lineage, choices, cardId) {
  const pool = lineage?.pool;
  if (!pool) return [];
  const held = (Array.isArray(choices?.[pool.id]) ? choices[pool.id] : []).map((id) => String(id));
  const known = held.filter((id) => pool.options.some((card) => card.id === id));
  if (known.includes(cardId)) return known.filter((id) => id !== cardId);
  return [...known, cardId].slice(-pool.picks);
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
