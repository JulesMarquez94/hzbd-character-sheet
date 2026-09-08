/**
 * The Crossroads: the questions a life is made of.
 *
 * The fourth way to make a character asks you about the one you are making
 * rather than handing you the choosers. Where were you born, who raised you,
 * what did you do when three knives came out of the fog. Every answer puts
 * points on the things a level-1 character is made of, and at the end the points
 * are counted and the drifter is waiting. See crossroads.js for the counting;
 * this file is only the questions.
 *
 * ------------------------------------------------------------------ provenance
 * **House-written on 2026-09-08.** There is no design sheet behind this pool.
 * Jules gave the shape in chat and three questions as examples: born in a city
 * or the countryside, someone hurt in the street, a locked door bashed or picked.
 * Everything else here, every question, every option and every number under it,
 * was drafted around those three and is the designer's to overrule, cut or
 * rewrite. The scores are a first balance and nothing more.
 *
 * -------------------------------------------------------------------- the shape
 * A run walks the STAGES in order and asks `draw` questions from each stage's
 * pool, chosen at random and leaning toward whatever the run has not yet given
 * a chance to. So no two runs ask quite the same things, and a question may sit
 * unasked for many runs before its turn comes.
 *
 *   id        stable; a run's answers are stored against it
 *   stage     which chapter of the life it belongs to
 *   asks      the question, as a heading
 *   text      a line under it, when the question wants setting
 *   recall    how the backstory begins this sentence. `recall` + the option's
 *             `told` is one sentence of the lore page's backstory
 *   requires  optional. Tags an earlier answer must have set, any one of them.
 *             This is how a question only appears because of what came before:
 *             a city childhood is asked of a city birth and nobody else
 *   options   the choices, in the order they are offered
 *
 * An option:
 *
 *   id        stable within its question
 *   label     the choice as the player reads it
 *   told      the clause the backstory writes after `recall`. Left out when the
 *             label already reads as one with its first letter lowered
 *   tags      optional. What this answer makes true of the life, for `requires`
 *   gives     the points, grouped by what they land on:
 *               attribute   physique, instinct or mind
 *               talent      a set's id. A roster placeholder may be scored
 *                           and is never chosen; when its cards land it starts
 *                           winning with no change here
 *               lineage     an ancestry's id
 *               background  a trade's id
 *               skill       a skill's id. Counted only inside the background
 *                           that wins, against its own pool
 *               weapon      a Common weapon's id, for the kit
 *               armor       a set name: Light, Heavy or Magic Armor
 *
 * A point is a point wherever it lands. The trade stage hands out three at a
 * time because what you did for a living is most of what a background is; the
 * road hands out one or two because a single night says less about a life than
 * ten years did.
 *
 * ------------------------------------------------------------------- the voice
 * The reader is `you`, and the questions are asked of the character rather than
 * of the player. A label is what you did, in the imperative or the plain past,
 * and it never names a rule, a set or a number: "roar and go through the middle
 * one" is a Berserker's answer without saying so, which is the whole point of
 * asking it this way. docs/text-style.md applies to every word here.
 */

/* ------------------------------------------------------------------ the stages */

export const STAGES = [
  { id: 'birth', title: 'Birth', draw: 1 },
  { id: 'family', title: 'Family', draw: 1 },
  { id: 'blood', title: 'Blood', draw: 2 },
  { id: 'youth', title: 'Youth', draw: 2 },
  { id: 'trade', title: 'Trade', draw: 1 },
  { id: 'road', title: 'The Road', draw: 4 },
  { id: 'leaving', title: 'Leaving', draw: 1 },
];

/* ------------------------------------------------------------ what fills a gap
 * The kit's armor and weapon are scored by answers like everything else, but a
 * run can end with nothing pointing at either. These are what an attribute
 * reaches for then, in order of preference, and they are data so that the
 * designer can move them without reading the engine. */

export const WEAPON_DEFAULTS = {
  physique: ['melee-heavy', 'melee-great', 'polearm'],
  instinct: ['finesse-weapon', 'short-bow', 'flintlock-pistol'],
  mind: ['fire-wand', 'psychic-tome', 'sharp-staff'],
};

export const ARMOR_DEFAULTS = {
  physique: 'Heavy Armor',
  instinct: 'Light Armor',
  mind: 'Magic Armor',
};

/* --------------------------------------------------------------- the questions */

export const QUESTIONS = [
  /* ================================================================== birth */
  {
    id: 'birth-where',
    stage: 'birth',
    asks: 'Where were you born?',
    text: 'Start at the beginning. Before the road, and before the name you go by now, there was a place.',
    recall: 'You were born',
    options: [
      {
        id: 'city',
        label: 'In a city, under smoke and bells.',
        tags: ['born:city'],
        gives: {
          attribute: { instinct: 1 },
          background: { criminal: 1, merchant: 1, investigator: 1 },
          skill: { streetwise: 1 },
        },
      },
      {
        id: 'country',
        label: 'On a farm, a long walk from anywhere.',
        tags: ['born:country'],
        gives: {
          attribute: { physique: 1 },
          background: { outlander: 1, craftsman: 1 },
          lineage: { stalwart: 1, wildheart: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'port',
        label: 'In a port town that smelled of tar and fish.',
        tags: ['born:port'],
        gives: {
          attribute: { instinct: 1 },
          background: { merchant: 1, criminal: 1 },
          lineage: { tidebound: 2 },
          skill: { seafarer: 1 },
        },
      },
      {
        id: 'mountain',
        label: 'In the mountains, where winter comes early.',
        tags: ['born:mountain'],
        gives: {
          attribute: { physique: 1 },
          lineage: { stonebound: 3, stalwart: 1, skybound: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'ash',
        label: 'Beside a volcano, in a village of ash and heat.',
        tags: ['born:ash'],
        gives: {
          attribute: { physique: 1 },
          lineage: { scorchbound: 2 },
          background: { craftsman: 1 },
        },
      },
      {
        id: 'forest',
        label: 'Deep in a forest the maps leave blank.',
        tags: ['born:forest'],
        gives: {
          attribute: { instinct: 1 },
          lineage: { fey: 1, wildkin: 1, wildheart: 1 },
          background: { outlander: 1 },
          talent: { mycomancer: 2 },
        },
      },
    ],
  },

  {
    id: 'birth-hour',
    stage: 'birth',
    asks: 'What was said about the night you were born?',
    recall: 'Of the night you were born, it was said that',
    options: [
      {
        id: 'storm',
        label: 'A storm broke the moment you drew breath.',
        gives: {
          lineage: { skybound: 2, tidebound: 1 },
          attribute: { instinct: 1 },
          talent: { arcanist: 1 },
        },
      },
      {
        id: 'lamps',
        label: 'The midwife swore the lamps burned brighter.',
        gives: {
          lineage: { celestial: 2, luminary: 1 },
          attribute: { mind: 1 },
          talent: { enchanter: 1 },
        },
      },
      {
        id: 'walls',
        label: 'Something in the walls scratched all night, then stopped.',
        gives: {
          lineage: { infernal: 2, undead: 1 },
          attribute: { mind: 1 },
          talent: { pactbound: 1 },
        },
      },
      {
        id: 'nothing',
        label: 'Nothing at all. You were born, you cried, the world went on.',
        gives: {
          lineage: { stalwart: 1, wildheart: 1, luminary: 1 },
          attribute: { physique: 1 },
          background: { craftsman: 1, military: 1 },
        },
      },
      {
        id: 'cat',
        label: 'The household cat would not leave your cradle.',
        gives: {
          lineage: { wildkin: 2, fey: 1 },
          attribute: { instinct: 1 },
          talent: { 'feral-curse': 1, beastbond: 1 },
        },
      },
    ],
  },

  {
    id: 'birth-name',
    stage: 'birth',
    asks: 'Who named you?',
    recall: 'You were named by',
    options: [
      {
        id: 'mother',
        label: 'Your mother, after her own mother.',
        gives: {
          attribute: { physique: 1 },
          background: { craftsman: 1, outlander: 1 },
          lineage: { stalwart: 1 },
          skill: { frugal: 1 },
        },
      },
      {
        id: 'priest',
        label: 'A priest, from a book nobody else could read.',
        gives: {
          attribute: { mind: 1 },
          lineage: { celestial: 1, luminary: 1 },
          background: { erudit: 1 },
          skill: { scholar: 1 },
        },
      },
      {
        id: 'crew',
        label: 'The crew of the ship you were born on.',
        gives: {
          background: { merchant: 1, mercenary: 1 },
          lineage: { tidebound: 1 },
          skill: { seafarer: 1 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'nobody',
        label: 'Nobody. You chose it yourself, later.',
        told: 'nobody at all. You chose the name yourself, later.',
        gives: {
          background: { criminal: 1, entertainer: 1, outlander: 1 },
          attribute: { instinct: 1 },
          talent: { trickster: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'steward',
        label: 'The house steward, who wrote it in the family register.',
        gives: {
          background: { aristocrat: 2 },
          skill: { charismatic: 1 },
          attribute: { mind: 1 },
        },
      },
    ],
  },

  {
    id: 'birth-first',
    stage: 'birth',
    asks: 'What is the first thing you remember?',
    recall: 'The first thing you remember is',
    options: [
      {
        id: 'tool',
        label: 'The weight of a tool put in your hands too early.',
        gives: {
          attribute: { physique: 1 },
          background: { craftsman: 2 },
          skill: { skilled: 1 },
          talent: { colossus: 1 },
        },
      },
      {
        id: 'horse',
        label: 'Being lifted onto a horse in a courtyard full of banners.',
        gives: {
          background: { aristocrat: 1, military: 1 },
          attribute: { instinct: 1 },
          skill: { mastermind: 1 },
        },
      },
      {
        id: 'hiding',
        label: 'Hiding, and being good at it.',
        gives: {
          attribute: { instinct: 2 },
          background: { criminal: 1 },
          skill: { cunning: 1, streetwise: 1 },
          talent: { trickster: 1 },
        },
      },
      {
        id: 'book',
        label: 'A book with pictures of things that did not exist. Or did not, then.',
        gives: {
          attribute: { mind: 2 },
          background: { erudit: 1 },
          skill: { scholar: 1, occultist: 1 },
          talent: { arcanist: 1 },
        },
      },
      {
        id: 'water',
        label: 'Water closing over your head, and not being afraid.',
        gives: {
          lineage: { tidebound: 2 },
          attribute: { instinct: 1 },
          skill: { seafarer: 1 },
          background: { outlander: 1 },
        },
      },
    ],
  },

  /* ================================================================= family */
  {
    id: 'family-raised',
    stage: 'family',
    asks: 'Who raised you?',
    recall: 'You were raised by',
    options: [
      {
        id: 'parents',
        label: 'Both parents, in a house that was never quiet.',
        gives: {
          attribute: { physique: 1 },
          background: { craftsman: 1, merchant: 1 },
          lineage: { stalwart: 1 },
          skill: { helpful: 1 },
        },
      },
      {
        id: 'grandmother',
        label: 'A grandmother who knew every plant by name.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 2, alchemist: 1 },
          skill: { apothecary: 1 },
          background: { outlander: 1 },
          lineage: { wildheart: 1 },
        },
      },
      {
        id: 'regiment',
        label: 'A regiment. Your father’s, then yours.',
        gives: {
          background: { military: 3 },
          attribute: { physique: 2 },
          talent: { guardian: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'streets',
        label: 'The streets, and a gang of children like you.',
        gives: {
          background: { criminal: 2, entertainer: 1 },
          attribute: { instinct: 1 },
          talent: { trickster: 1 },
          skill: { streetwise: 1 },
        },
      },
      {
        id: 'tutor',
        label: 'A tutor, in a house where you were seen and not heard.',
        gives: {
          background: { aristocrat: 2, erudit: 1 },
          attribute: { mind: 1 },
          skill: { scholar: 1, charismatic: 1 },
        },
      },
      {
        id: 'monastery',
        label: 'Nobody you would call family. A monastery took you in.',
        gives: {
          attribute: { mind: 1 },
          background: { erudit: 1, investigator: 1 },
          lineage: { celestial: 1 },
          skill: { occultist: 1 },
          talent: { arcanist: 1 },
        },
      },
    ],
  },

  {
    id: 'family-trade',
    stage: 'family',
    asks: 'What did the people who raised you do for a living?',
    recall: 'The people who raised you',
    options: [
      {
        id: 'shop',
        label: 'Kept a shop and counted every coin twice.',
        gives: {
          background: { merchant: 2 },
          skill: { haggler: 1, frugal: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'iron',
        label: 'Worked iron until their hands were iron.',
        gives: {
          background: { craftsman: 2 },
          attribute: { physique: 2 },
          skill: { skilled: 1 },
          talent: { colossus: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'swords',
        label: 'Sold their swords to whoever was buying.',
        gives: {
          background: { mercenary: 2 },
          attribute: { physique: 2 },
          skill: { 'quick-draw': 1 },
          talent: { berserker: 1 },
        },
      },
      {
        id: 'sang',
        label: 'Sang for their supper in every town between two rivers.',
        gives: {
          background: { entertainer: 2 },
          attribute: { instinct: 1 },
          skill: { troubadour: 1, charismatic: 1 },
          weapon: { 'enchanted-instrument': 1 },
        },
      },
      {
        id: 'hunted',
        label: 'Hunted and trapped, and sold what they did not eat.',
        gives: {
          background: { outlander: 2 },
          attribute: { instinct: 1 },
          skill: { survivalist: 1 },
          weapon: { 'short-bow': 1, bow: 1 },
        },
      },
      {
        id: 'land',
        label: 'Owned land, and other people worked it.',
        gives: {
          background: { aristocrat: 2 },
          attribute: { mind: 1 },
          skill: { charismatic: 1, mastermind: 1 },
        },
      },
    ],
  },

  {
    id: 'family-taught',
    stage: 'family',
    asks: 'What is the one thing they made sure you learned?',
    recall: 'The one thing they made sure you learned was',
    options: [
      {
        id: 'blow',
        label: 'How to take a blow and stay standing.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, berserker: 1 },
          background: { military: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'room',
        label: 'How to read a room before you open your mouth.',
        gives: {
          attribute: { instinct: 1, mind: 1 },
          skill: { empath: 1, charismatic: 1 },
          background: { entertainer: 1, aristocrat: 1, investigator: 1 },
        },
      },
      {
        id: 'read',
        label: 'How to read, full stop. Everything else followed.',
        gives: {
          attribute: { mind: 2 },
          background: { erudit: 1 },
          skill: { scholar: 1 },
          talent: { arcanist: 1, enchanter: 1 },
        },
      },
      {
        id: 'mend',
        label: 'How to mend what is broken rather than throw it away.',
        gives: {
          background: { craftsman: 1, outlander: 1 },
          skill: { tailor: 1, scavenger: 1 },
          talent: { enchanter: 1, alchemist: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'lie',
        label: 'How to lie well and run faster.',
        gives: {
          attribute: { instinct: 2 },
          background: { criminal: 1 },
          skill: { cunning: 1 },
          talent: { trickster: 1 },
        },
      },
      {
        id: 'animal',
        label: 'How to keep an animal calm with your hands and your voice.',
        gives: {
          attribute: { instinct: 1 },
          lineage: { wildkin: 1, wildheart: 2 },
          talent: { 'draconic-bond': 2, 'feral-curse': 1 },
          skill: { survivalist: 1 },
        },
      },
    ],
  },

  {
    id: 'family-secret',
    stage: 'family',
    asks: 'Every family keeps something quiet. What was yours?',
    recall: 'What your family kept quiet was',
    options: [
      {
        id: 'bargain',
        label: 'An ancestor’s bargain, and a debt still being paid.',
        gives: {
          lineage: { infernal: 2 },
          talent: { pactbound: 2 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'dragon',
        label: 'A grandfather who was, by every account, a dragon.',
        gives: {
          lineage: { draconic: 3 },
          talent: { 'dragon-aspect': 1, 'draconic-bond': 1 },
          attribute: { physique: 1 },
        },
      },
      {
        id: 'stolen',
        label: 'That the family fortune was stolen, twice.',
        gives: {
          background: { criminal: 1, aristocrat: 1, merchant: 1 },
          skill: { cunning: 1 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'died',
        label: 'That one of you did not die when they should have.',
        gives: {
          lineage: { undead: 3 },
          attribute: { mind: 1 },
          talent: { alchemist: 1 },
        },
      },
      {
        id: 'woods',
        label: 'That the woods behind the house were not entirely empty.',
        gives: {
          lineage: { fey: 2, wildkin: 1 },
          talent: { mycomancer: 2 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'nothing',
        label: 'Nothing. You checked. That was its own disappointment.',
        told: 'nothing. You checked, and that was its own disappointment.',
        gives: {
          lineage: { luminary: 1, stalwart: 1 },
          background: { investigator: 1 },
          skill: { inquisitor: 1 },
          attribute: { mind: 1 },
        },
      },
    ],
  },

  /* ================================================================== blood */
  {
    id: 'blood-marks',
    stage: 'blood',
    asks: 'What did people notice about you before you could speak?',
    recall: 'Before you could speak, people noticed',
    options: [
      {
        id: 'light',
        label: 'Faint light under the skin, like a lamp behind cloth.',
        gives: { lineage: { celestial: 3 }, attribute: { mind: 1 } },
      },
      {
        id: 'horns',
        label: 'Horns, small and hard, that the midwife tried not to mention.',
        gives: { lineage: { infernal: 3 }, attribute: { mind: 1 } },
      },
      {
        id: 'wings',
        label: 'Wings like a dragonfly’s, and a frame too light for them.',
        gives: { lineage: { fey: 3 }, attribute: { instinct: 1 } },
      },
      {
        id: 'scales',
        label: 'Scales, in a colour that ran in the family.',
        gives: { lineage: { draconic: 3 }, attribute: { physique: 1 } },
      },
      {
        id: 'ears',
        label: 'Ears, or a tail, or eyes that caught the light like a cat’s.',
        gives: { lineage: { wildkin: 3 }, attribute: { instinct: 1 } },
      },
      {
        id: 'nothing',
        label: 'Nothing. You looked like everyone else, and you still do.',
        gives: {
          lineage: { stalwart: 1, wildheart: 1, luminary: 1 },
          attribute: { physique: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-element',
    stage: 'blood',
    asks: 'Which of the four did your family swear ran in the blood?',
    recall: 'Your family swore that',
    options: [
      {
        id: 'fire',
        label: 'Fire. Nobody in your house has ever been cold.',
        told: 'fire ran in the blood. Nobody in your house has ever been cold.',
        gives: {
          lineage: { scorchbound: 3 },
          attribute: { physique: 1 },
          weapon: { 'fire-wand': 1 },
        },
      },
      {
        id: 'wind',
        label: 'Wind. You were always the fastest, and the first up any hill.',
        told: 'wind ran in the blood. You were always the fastest, and the first up any hill.',
        gives: { lineage: { skybound: 3 }, attribute: { instinct: 1 } },
      },
      {
        id: 'water',
        label: 'Water. You could hold your breath longer than was reasonable.',
        told: 'water ran in the blood. You could hold your breath longer than was reasonable.',
        gives: {
          lineage: { tidebound: 3 },
          attribute: { instinct: 1 },
          skill: { seafarer: 1 },
        },
      },
      {
        id: 'stone',
        label: 'Stone. You do not bruise easily, and you do not move when pushed.',
        told: 'stone ran in the blood. You do not bruise easily, and you do not move when pushed.',
        gives: {
          lineage: { stonebound: 3 },
          attribute: { physique: 1 },
          talent: { guardian: 1 },
        },
      },
      {
        id: 'none',
        label: 'None of them. The blood was only blood.',
        told: 'none of the four ran in the blood. The blood was only blood.',
        gives: {
          lineage: { stalwart: 1, luminary: 1, wildheart: 1, undead: 1 },
          attribute: { mind: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-body',
    stage: 'blood',
    asks: 'How does your body answer when you ask too much of it?',
    recall: 'Asked for too much, your body',
    options: [
      {
        id: 'more',
        label: 'It gives more. It always has, and it frightens people.',
        told: 'gives more. It always has, and it frightens people.',
        gives: {
          lineage: { stalwart: 2 },
          attribute: { physique: 2 },
          talent: { berserker: 1, colossus: 1 },
        },
      },
      {
        id: 'moves',
        label: 'It moves before you have decided to. You catch up later.',
        told: 'moves before you have decided to. You catch up later.',
        gives: {
          lineage: { wildheart: 3 },
          attribute: { instinct: 2 },
          talent: { duelist: 1, trickster: 1 },
        },
      },
      {
        id: 'waits',
        label: 'It waits while the mind finishes. Then it does exactly what it was told.',
        told: 'waits while the mind finishes, then does exactly what it was told.',
        gives: {
          lineage: { luminary: 2 },
          attribute: { mind: 2 },
          talent: { arcanist: 1, enchanter: 1 },
        },
      },
      {
        id: 'tireless',
        label: 'It does not tire, and it does not heal. Not properly.',
        told: 'does not tire, and does not heal. Not properly.',
        gives: { lineage: { undead: 3 }, attribute: { physique: 1 } },
      },
      {
        id: 'changes',
        label: 'It changes. Teeth, nails, the set of the shoulders. Then it changes back.',
        told: 'changes. Teeth, nails, the set of the shoulders. Then it changes back.',
        gives: {
          lineage: { wildkin: 2 },
          talent: { 'feral-curse': 2 },
          attribute: { instinct: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-dream',
    stage: 'blood',
    asks: 'What do you dream about, more often than you would like?',
    recall: 'More often than you would like, you dream of',
    options: [
      {
        id: 'light',
        label: 'Falling upward, into a light that knows your name.',
        gives: {
          lineage: { celestial: 2, skybound: 1 },
          attribute: { mind: 1 },
          talent: { arcanist: 1 },
        },
      },
      {
        id: 'contract',
        label: 'A contract you cannot read, with your signature already on it.',
        gives: {
          lineage: { infernal: 2 },
          talent: { pactbound: 2 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'legs',
        label: 'Running on four legs through country you have never seen.',
        gives: {
          lineage: { wildkin: 2, wildheart: 2 },
          talent: { 'feral-curse': 2 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'sea',
        label: 'The bottom of the sea, and being at home there.',
        gives: { lineage: { tidebound: 2 }, attribute: { instinct: 1 } },
      },
      {
        id: 'fire',
        label: 'Fire that does not burn you, and a voice inside it.',
        gives: { lineage: { scorchbound: 2, draconic: 1 }, attribute: { physique: 1 } },
      },
      {
        id: 'nothing',
        label: 'Nothing. You sleep like the dead.',
        gives: { lineage: { undead: 1, stalwart: 1 }, attribute: { physique: 1 } },
      },
    ],
  },

  {
    id: 'blood-old',
    stage: 'blood',
    asks: 'Which of your ancestors do people still tell stories about?',
    recall: 'The ancestor people still tell stories about is',
    options: [
      {
        id: 'pact',
        label: 'The one who made a pact, and the one who paid for it.',
        gives: {
          lineage: { infernal: 2, celestial: 1 },
          talent: { pactbound: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'pass',
        label: 'The one who stood in the mountain pass alone, and held it.',
        gives: {
          lineage: { stalwart: 2, stonebound: 2 },
          talent: { guardian: 2 },
          attribute: { physique: 1 },
          weapon: { 'melee-heavy-shield': 1 },
        },
      },
      {
        id: 'birds',
        label: 'The one who could talk to birds, or said she could.',
        gives: {
          lineage: { wildkin: 1, fey: 1, skybound: 1 },
          talent: { 'draconic-bond': 1, mycomancer: 2 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'book',
        label: 'The one who wrote the book the academy still teaches from.',
        gives: {
          lineage: { luminary: 2 },
          background: { erudit: 1 },
          talent: { arcanist: 1, enchanter: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'grave',
        label: 'The one who came back from the grave to finish an argument.',
        gives: {
          lineage: { undead: 2 },
          attribute: { mind: 1 },
          talent: { alchemist: 1 },
        },
      },
    ],
  },

  /* ================================================================== youth */
  {
    id: 'youth-trouble',
    stage: 'youth',
    asks: 'What kind of trouble were you in, as a child?',
    recall: 'As a child, the trouble you were in was',
    options: [
      {
        id: 'fights',
        label: 'Fights. You started some and finished most.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 2, brawler: 1 },
          background: { military: 1, mercenary: 1 },
          weapon: { 'fist-weapon': 1 },
        },
      },
      {
        id: 'theft',
        label: 'Theft. Small things, then less small things.',
        gives: {
          attribute: { instinct: 2 },
          background: { criminal: 2 },
          talent: { trickster: 2 },
          skill: { cunning: 1 },
          weapon: { 'finesse-weapon': 1 },
        },
      },
      {
        id: 'questions',
        label: 'Questions. You would not stop asking them.',
        gives: {
          attribute: { mind: 2 },
          background: { erudit: 1, investigator: 1 },
          skill: { scholar: 1, inquisitor: 1 },
          talent: { arcanist: 1 },
        },
      },
      {
        id: 'wandering',
        label: 'Wandering. You were always found somewhere you should not have been.',
        gives: {
          attribute: { instinct: 1 },
          background: { outlander: 2 },
          skill: { cartographer: 1, survivalist: 1 },
          talent: { mycomancer: 2 },
        },
      },
      {
        id: 'experiments',
        label: 'Experiments. Things that smoked, dissolved or exploded.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 2, 'cauldron-keeper': 1 },
          background: { craftsman: 1 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'none',
        label: 'None. You were the one who kept the others out of it.',
        told: 'none at all. You were the one who kept the others out of it.',
        gives: {
          attribute: { physique: 1, mind: 1 },
          talent: { guardian: 2 },
          skill: { helpful: 1 },
          background: { military: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-friend',
    stage: 'youth',
    asks: 'Who was your closest companion, growing up?',
    recall: 'Growing up, your closest companion was',
    options: [
      {
        id: 'beast',
        label: 'A dog, a hawk or something stranger that chose you.',
        gives: {
          talent: { 'draconic-bond': 2, beastbond: 1, 'feral-curse': 1 },
          attribute: { instinct: 1 },
          lineage: { wildkin: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'book',
        label: 'A book. Several books, the same ones, over and over.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, enchanter: 1 },
          background: { erudit: 1 },
          skill: { scholar: 1 },
        },
      },
      {
        id: 'gang',
        label: 'A gang. You were loyal to them and they were mostly loyal to you.',
        gives: {
          background: { criminal: 2, mercenary: 1 },
          attribute: { instinct: 1 },
          skill: { streetwise: 1 },
          talent: { trickster: 1 },
        },
      },
      {
        id: 'sword',
        label: 'Your sword. You named it, and you were not embarrassed.',
        gives: {
          talent: { duelist: 2, colossus: 1 },
          attribute: { physique: 1, instinct: 1 },
          background: { military: 1 },
          weapon: { 'finesse-weapon': 1, 'melee-heavy': 1 },
        },
      },
      {
        id: 'cauldron',
        label: 'A cauldron your grandmother left you, and the garden that fed it.',
        gives: {
          talent: { 'cauldron-keeper': 2, alchemist: 1 },
          attribute: { instinct: 1 },
          skill: { apothecary: 1 },
          background: { outlander: 1 },
        },
      },
      {
        id: 'nobody',
        label: 'Nobody. You were fine. You are still fine.',
        told: 'nobody. You were fine, and you are still fine.',
        gives: {
          attribute: { physique: 1 },
          lineage: { undead: 1 },
          talent: { berserker: 1 },
          background: { investigator: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-fear',
    stage: 'youth',
    asks: 'What were you afraid of, and what did you do about it?',
    recall: 'You were afraid of',
    options: [
      {
        id: 'dark',
        label: 'The dark. You learned to move through it until it was yours.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, 'feral-curse': 1 },
          background: { criminal: 1 },
          skill: { cunning: 1 },
          lineage: { infernal: 1 },
        },
      },
      {
        id: 'small',
        label: 'Being small. You got bigger, on purpose, for years.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 2, berserker: 1 },
          armor: { 'Heavy Armor': 1 },
          weapon: { 'melee-great': 1 },
        },
      },
      {
        id: 'stupid',
        label: 'Being stupid. You read until the fear was somebody else’s.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, enchanter: 1, alchemist: 1 },
          background: { erudit: 1 },
          skill: { scholar: 1 },
        },
      },
      {
        id: 'losing',
        label: 'Losing people. You learned to stand between them and the thing.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 3 },
          skill: { healer: 1 },
          background: { military: 1 },
          weapon: { 'melee-light-shield': 1 },
        },
      },
      {
        id: 'seen',
        label: 'Being seen. You learned to make people look where you wanted.',
        gives: {
          attribute: { instinct: 1 },
          background: { entertainer: 1, criminal: 1 },
          skill: { charismatic: 1, cunning: 1 },
          talent: { trickster: 1 },
        },
      },
      {
        id: 'nameless',
        label: 'Nothing you could name. It followed you anyway.',
        gives: {
          talent: { pactbound: 1 },
          lineage: { infernal: 1 },
          attribute: { mind: 1 },
          background: { investigator: 1 },
          skill: { occultist: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-gift',
    stage: 'youth',
    asks: 'What could you do that the other children could not?',
    recall: 'What you could do that the other children could not was',
    options: [
      {
        id: 'vanish',
        label: 'Make a coin vanish, then a purse, then yourself.',
        gives: {
          talent: { trickster: 3 },
          attribute: { instinct: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'lift',
        label: 'Lift what took two of them to move.',
        gives: {
          talent: { colossus: 2, berserker: 1 },
          attribute: { physique: 2 },
          background: { craftsman: 1 },
          weapon: { 'melee-great': 1 },
        },
      },
      {
        id: 'talk',
        label: 'Talk an adult out of a punishment with a straight face.',
        gives: {
          attribute: { instinct: 1, mind: 1 },
          skill: { charismatic: 1, empath: 1 },
          background: { entertainer: 1, aristocrat: 1, merchant: 1 },
        },
      },
      {
        id: 'candle',
        label: 'Make a candle light without touching it.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 2, enchanter: 1 },
          skill: { 'innate-spell-novice': 1 },
          lineage: { celestial: 1, scorchbound: 1 },
        },
      },
      {
        id: 'wall',
        label: 'Hold a shield wall of one against three.',
        gives: {
          talent: { guardian: 3 },
          attribute: { physique: 1 },
          background: { military: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'brew',
        label: 'Brew something from weeds that actually worked.',
        gives: {
          talent: { 'cauldron-keeper': 2, alchemist: 2 },
          attribute: { instinct: 1 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'target',
        label: 'Hit a target the others could not see.',
        gives: {
          attribute: { instinct: 2 },
          talent: { sharpshooter: 1, duelist: 1 },
          weapon: { 'short-bow': 1, 'flintlock-pistol': 1 },
          skill: { vigilant: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-lesson',
    stage: 'youth',
    asks: 'What did the world teach you first, and hardest?',
    recall: 'The world taught you first, and hardest,',
    options: [
      {
        id: 'door',
        label: 'That a locked door is a suggestion.',
        gives: {
          talent: { trickster: 1 },
          background: { criminal: 2 },
          attribute: { instinct: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'strong',
        label: 'That the strong take, unless someone stands in the way.',
        gives: {
          talent: { guardian: 2, berserker: 1 },
          attribute: { physique: 2 },
          background: { military: 1, mercenary: 1 },
        },
      },
      {
        id: 'price',
        label: 'That everything has a price, and most prices are negotiable.',
        gives: {
          background: { merchant: 2, aristocrat: 1 },
          skill: { haggler: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'books',
        label: 'That the old books were right about more than anyone admits.',
        gives: {
          background: { erudit: 2 },
          talent: { arcanist: 1, enchanter: 1 },
          attribute: { mind: 1 },
          skill: { occultist: 1 },
        },
      },
      {
        id: 'wild',
        label: 'That the wild does not care whether you live.',
        gives: {
          background: { outlander: 2 },
          attribute: { instinct: 1 },
          skill: { survivalist: 1 },
          talent: { 'feral-curse': 1, mycomancer: 2 },
        },
      },
      {
        id: 'crowd',
        label: 'That a crowd will believe anything said with enough confidence.',
        gives: {
          background: { entertainer: 2 },
          attribute: { instinct: 1 },
          skill: { troubadour: 1, charismatic: 1 },
          talent: { trickster: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-city',
    stage: 'youth',
    requires: ['born:city', 'born:port'],
    asks: 'The city raised you as much as anyone did. Which part of it?',
    recall: 'The part of the city that raised you was',
    options: [
      {
        id: 'docks',
        label: 'The docks, where everything arrives and half of it goes missing.',
        gives: {
          background: { criminal: 1, merchant: 1 },
          attribute: { instinct: 1 },
          skill: { streetwise: 1 },
          lineage: { tidebound: 1 },
        },
      },
      {
        id: 'market',
        label: 'The market, where you learned the price of everything.',
        gives: {
          background: { merchant: 2 },
          skill: { haggler: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'rooftops',
        label: 'The rooftops, which nobody else seemed to know were there.',
        gives: {
          talent: { trickster: 2 },
          background: { criminal: 1 },
          attribute: { instinct: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'university',
        label: 'The university quarter, where you were not enrolled and read anyway.',
        gives: {
          background: { erudit: 2 },
          attribute: { mind: 1 },
          skill: { scholar: 1 },
          talent: { arcanist: 1 },
        },
      },
      {
        id: 'garrison',
        label: 'The garrison, where a sergeant let you carry water and then a spear.',
        gives: {
          background: { military: 2 },
          attribute: { physique: 1 },
          talent: { guardian: 1 },
          weapon: { polearm: 1 },
        },
      },
      {
        id: 'theatre',
        label: 'The theatre district, front row when you could pay and backstage when you could not.',
        gives: {
          background: { entertainer: 2 },
          attribute: { instinct: 1 },
          skill: { troubadour: 1 },
        },
      },
      {
        id: 'watch',
        label: 'The watch house, where you learned what a lie sounds like.',
        gives: {
          background: { investigator: 2 },
          attribute: { mind: 1 },
          skill: { inquisitor: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-country',
    stage: 'youth',
    requires: ['born:country', 'born:mountain', 'born:forest', 'born:ash'],
    asks: 'Far from any town, how did you fill the days?',
    recall: 'Far from any town, you filled the days',
    options: [
      {
        id: 'hunting',
        label: 'Hunting, and getting good enough at it to feed the house.',
        gives: {
          background: { outlander: 2 },
          attribute: { instinct: 1 },
          skill: { survivalist: 1 },
          weapon: { bow: 1, 'short-bow': 1 },
        },
      },
      {
        id: 'working',
        label: 'Working the forge, the mill or the field until dark.',
        gives: {
          background: { craftsman: 2 },
          attribute: { physique: 2 },
          skill: { skilled: 1 },
          talent: { colossus: 1 },
        },
      },
      {
        id: 'gathering',
        label: 'Gathering what grew, and learning which of it would kill you.',
        gives: {
          talent: { 'cauldron-keeper': 2, alchemist: 1 },
          skill: { apothecary: 1 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'animals',
        label: 'With the animals, who liked you better than people did.',
        gives: {
          talent: { 'draconic-bond': 1, 'feral-curse': 1 },
          lineage: { wildkin: 1, wildheart: 2 },
          attribute: { instinct: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'reading',
        label: 'Reading the one shelf of books until the bindings gave out.',
        gives: {
          background: { erudit: 1 },
          lineage: { luminary: 1 },
          attribute: { mind: 2 },
          skill: { scholar: 1 },
          talent: { arcanist: 1 },
        },
      },
      {
        id: 'flock',
        label: 'Guarding the flock against whatever came down from the hills.',
        gives: {
          talent: { guardian: 2 },
          attribute: { physique: 1 },
          background: { military: 1 },
          skill: { vigilant: 1 },
          weapon: { polearm: 1 },
        },
      },
    ],
  },

  /* ================================================================== trade */
  {
    id: 'trade-living',
    stage: 'trade',
    asks: 'By the time you were grown, how did you make your living?',
    recall: 'By the time you were grown, you made your living',
    options: [
      {
        id: 'criminal',
        label: 'On the wrong side of other people’s doors.',
        gives: {
          background: { criminal: 3 },
          attribute: { instinct: 1 },
          skill: { cunning: 1 },
          talent: { trickster: 1 },
          weapon: { 'finesse-weapon': 1 },
        },
      },
      {
        id: 'erudit',
        label: 'In a library, an academy or somebody’s private study.',
        gives: {
          background: { erudit: 3 },
          attribute: { mind: 1 },
          skill: { scholar: 1 },
          talent: { arcanist: 1 },
        },
      },
      {
        id: 'military',
        label: 'In a regiment, under a banner that was not yours.',
        gives: {
          background: { military: 3 },
          attribute: { physique: 2 },
          skill: { vigilant: 1 },
          talent: { guardian: 1 },
          weapon: { polearm: 1 },
        },
      },
      {
        id: 'outlander',
        label: 'On the road, the river or the ridge, wherever the work was.',
        gives: {
          background: { outlander: 3 },
          attribute: { instinct: 1 },
          skill: { survivalist: 1 },
          weapon: { bow: 1 },
        },
      },
      {
        id: 'craftsman',
        label: 'At a bench, with a guild mark to show for it.',
        gives: {
          background: { craftsman: 3 },
          attribute: { physique: 1 },
          skill: { skilled: 1 },
          talent: { enchanter: 1 },
        },
      },
      {
        id: 'entertainer',
        label: 'On a stage, or the nearest thing to one.',
        gives: {
          background: { entertainer: 3 },
          attribute: { instinct: 1 },
          skill: { troubadour: 1 },
          weapon: { 'enchanted-instrument': 1 },
        },
      },
      {
        id: 'merchant',
        label: 'Buying low in one town and selling high in the next.',
        gives: {
          background: { merchant: 3 },
          attribute: { mind: 1 },
          skill: { haggler: 1 },
        },
      },
      {
        id: 'aristocrat',
        label: 'You did not. Your name did it for you.',
        told: 'by your name, which did the work for you.',
        gives: {
          background: { aristocrat: 3 },
          attribute: { instinct: 1 },
          skill: { charismatic: 1 },
        },
      },
      {
        id: 'investigator',
        label: 'Finding out who was lying, for whoever paid.',
        gives: {
          background: { investigator: 3 },
          attribute: { mind: 1 },
          skill: { inquisitor: 1 },
        },
      },
      {
        id: 'mercenary',
        label: 'Fighting for whichever side was hiring.',
        gives: {
          background: { mercenary: 3 },
          attribute: { physique: 2 },
          skill: { 'quick-draw': 1 },
          talent: { berserker: 1 },
        },
      },
    ],
  },

  {
    id: 'trade-master',
    stage: 'trade',
    asks: 'Who taught you your trade?',
    recall: 'Your trade was taught to you by',
    options: [
      {
        id: 'fence',
        label: 'A fence who took a cut of everything and taught you why.',
        gives: {
          background: { criminal: 3 },
          skill: { haggler: 1, streetwise: 1 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'master',
        label: 'A master who died before you finished, leaving you the books.',
        gives: {
          background: { erudit: 3 },
          skill: { scholar: 1 },
          attribute: { mind: 1 },
          talent: { arcanist: 1 },
        },
      },
      {
        id: 'sergeant',
        label: 'A sergeant who never once said your name.',
        gives: {
          background: { military: 3 },
          skill: { vigilant: 1 },
          attribute: { physique: 2 },
        },
      },
      {
        id: 'walker',
        label: 'A woman who had walked every road on the map and a few off it.',
        gives: {
          background: { outlander: 3 },
          skill: { cartographer: 1 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'guild',
        label: 'A guild, in the slow, exacting, seven-year way guilds do it.',
        gives: {
          background: { craftsman: 3 },
          skill: { skilled: 1 },
          attribute: { physique: 1 },
          talent: { enchanter: 1 },
        },
      },
      {
        id: 'troupe',
        label: 'A troupe that adopted you and never asked where you came from.',
        gives: {
          background: { entertainer: 3 },
          skill: { troubadour: 1 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'house',
        label: 'A merchant house that started you at the ledgers.',
        gives: {
          background: { merchant: 3 },
          skill: { frugal: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'tutors',
        label: 'Tutors, riding masters and a dancing instructor you despised.',
        gives: {
          background: { aristocrat: 3 },
          skill: { charismatic: 1 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'clerk',
        label: 'A magistrate’s clerk who taught you to read a silence.',
        gives: {
          background: { investigator: 3 },
          skill: { inquisitor: 1, empath: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'company',
        label: 'A free company. You learned by not dying.',
        gives: {
          background: { mercenary: 3 },
          skill: { 'quick-draw': 1 },
          attribute: { physique: 2 },
        },
      },
    ],
  },

  {
    id: 'trade-proud',
    stage: 'trade',
    asks: 'What piece of work are you proudest of?',
    recall: 'The piece of work you are proudest of is',
    options: [
      {
        id: 'vault',
        label: 'A vault nobody has yet noticed is empty.',
        gives: {
          background: { criminal: 3 },
          talent: { trickster: 1 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'treatise',
        label: 'A treatise three people have read. All three argued.',
        gives: {
          background: { erudit: 3 },
          attribute: { mind: 1 },
          skill: { scholar: 1 },
        },
      },
      {
        id: 'line',
        label: 'A line that held when the one beside it broke.',
        gives: {
          background: { military: 2, mercenary: 1 },
          talent: { guardian: 2 },
          attribute: { physique: 2 },
        },
      },
      {
        id: 'pass',
        label: 'A pass crossed in winter that the locals said could not be.',
        gives: {
          background: { outlander: 3 },
          attribute: { instinct: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'blade',
        label: 'A blade you made that is still in use, by someone who does not know your name.',
        gives: {
          background: { craftsman: 3 },
          attribute: { physique: 1 },
          skill: { skilled: 1 },
          talent: { enchanter: 1 },
        },
      },
      {
        id: 'room',
        label: 'A room of two hundred, silent, waiting for the last verse.',
        gives: {
          background: { entertainer: 3 },
          attribute: { instinct: 1 },
          skill: { troubadour: 1 },
        },
      },
      {
        id: 'deal',
        label: 'A deal that made both sides think they had won.',
        gives: {
          background: { merchant: 3 },
          skill: { haggler: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'marriage',
        label: 'A marriage you arranged and a war you prevented by it.',
        gives: {
          background: { aristocrat: 3 },
          skill: { mastermind: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'button',
        label: 'A murderer found because of a single wrong button.',
        gives: {
          background: { investigator: 3 },
          attribute: { mind: 1 },
          skill: { inquisitor: 1 },
        },
      },
      {
        id: 'contract',
        label: 'A contract fulfilled to the letter, and not a word more.',
        gives: {
          background: { mercenary: 3 },
          attribute: { physique: 2 },
          skill: { vigilant: 1 },
        },
      },
    ],
  },

  /* =================================================================== road */
  {
    id: 'road-door',
    stage: 'road',
    asks: 'A locked door, and what you want is on the other side. Nobody is coming to open it.',
    recall: 'Faced with a locked door, you',
    options: [
      {
        id: 'shoulder',
        label: 'Put your shoulder through it.',
        told: 'put your shoulder through it.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, colossus: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'pick',
        label: 'Pick the lock. You have the tools, and the patience.',
        told: 'picked the lock, with tools you happened to have and patience you did not know you had.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1 },
          weapon: { 'finesse-weapon': 1 },
        },
      },
      {
        id: 'study',
        label: 'Study the lock, the hinges and the frame. There is always a flaw.',
        told: 'studied the lock, the hinges and the frame until you found the flaw.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, enchanter: 1 },
          skill: { skilled: 1 },
          background: { investigator: 1 },
        },
      },
      {
        id: 'wait',
        label: 'Wait. Someone always comes, and then the door is their problem.',
        told: 'waited for someone to come and make the door their problem.',
        gives: {
          attribute: { instinct: 1, mind: 1 },
          skill: { empath: 1, vigilant: 1 },
          talent: { duelist: 1 },
          background: { investigator: 1 },
        },
      },
      {
        id: 'burn',
        label: 'Burn it. Doors are made of wood for a reason.',
        told: 'burned it. Doors are made of wood for a reason.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, alchemist: 1 },
          lineage: { scorchbound: 1 },
          weapon: { 'fire-wand': 1 },
        },
      },
    ],
  },

  {
    id: 'road-hurt',
    stage: 'road',
    asks: 'Someone is hurt in the street. Bleeding, and nobody is stopping.',
    recall: 'When someone lay bleeding in the street, you',
    options: [
      {
        id: 'kneel',
        label: 'Kneel and stop the bleeding. You know how.',
        told: 'knelt and stopped the bleeding, because you knew how.',
        gives: {
          skill: { healer: 1, physician: 1 },
          attribute: { mind: 1 },
          talent: { alchemist: 1, 'cauldron-keeper': 1 },
          background: { outlander: 1 },
        },
      },
      {
        id: 'carry',
        label: 'Carry them to help. It is faster than waiting for it.',
        told: 'carried them to help, since it was faster than waiting for it.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, colossus: 1 },
          skill: { helpful: 1 },
        },
      },
      {
        id: 'find',
        label: 'Find who did it. They are not far.',
        told: 'went after whoever did it. They were not far.',
        gives: {
          attribute: { instinct: 1 },
          skill: { inquisitor: 1, vigilant: 1 },
          background: { investigator: 1 },
          talent: { duelist: 1 },
        },
      },
      {
        id: 'pockets',
        label: 'Check their pockets while you check their pulse.',
        told: 'checked their pockets while you checked their pulse.',
        gives: {
          attribute: { instinct: 1 },
          background: { criminal: 1 },
          talent: { trickster: 1 },
          skill: { streetwise: 1 },
        },
      },
      {
        id: 'walk',
        label: 'Keep walking. It is a trap, or it is not your business, and either way.',
        told: 'kept walking. It was a trap, or it was none of your business, and either way.',
        gives: {
          attribute: { mind: 1 },
          background: { mercenary: 1 },
          talent: { berserker: 1 },
          skill: { cunning: 1 },
        },
      },
    ],
  },

  {
    id: 'road-ambush',
    stage: 'road',
    asks: 'Three of them step out of the fog. They want your purse, and they have knives.',
    recall: 'When three knives came out of the fog, you',
    options: [
      {
        id: 'purse',
        label: 'Give them the purse. It is lighter than a funeral.',
        told: 'handed over the purse. It was lighter than a funeral.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 1 },
          skill: { haggler: 1 },
          talent: { trickster: 1 },
        },
      },
      {
        id: 'draw',
        label: 'Draw first. You have never lost a fight you started.',
        told: 'drew first. You have never lost a fight you started.',
        gives: {
          attribute: { physique: 1, instinct: 1 },
          talent: { duelist: 2 },
          weapon: { 'finesse-weapon': 1, 'paired-finesse': 1 },
          skill: { 'quick-draw': 1 },
        },
      },
      {
        id: 'roar',
        label: 'Roar and go through the middle one. The other two will run.',
        told: 'roared and went through the middle one, and the other two ran.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 3 },
          weapon: { 'melee-heavy': 1, 'melee-great': 1 },
        },
      },
      {
        id: 'guard',
        label: 'Plant your feet, raise your guard and let them come to you.',
        told: 'planted your feet, raised your guard and let them come to you.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 2 },
          armor: { 'Heavy Armor': 1 },
          weapon: { 'finesse-shield': 1 },
        },
      },
      {
        id: 'word',
        label: 'Speak the word you learned and let the light do the rest.',
        told: 'spoke the word you had learned and let the light do the rest.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 2 },
          weapon: { 'lightning-wand': 1 },
          lineage: { celestial: 1 },
        },
      },
      {
        id: 'vial',
        label: 'Throw the vial. The fog gets thicker, and you are elsewhere.',
        told: 'threw the vial. The fog got thicker, and you were elsewhere.',
        gives: {
          attribute: { instinct: 1 },
          talent: { alchemist: 2, trickster: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'change',
        label: 'Change. Let them see what they have cornered.',
        told: 'changed, and let them see what they had cornered.',
        gives: {
          talent: { 'feral-curse': 3 },
          attribute: { instinct: 1 },
          lineage: { wildkin: 1 },
        },
      },
    ],
  },

  {
    id: 'road-beast',
    stage: 'road',
    asks: 'A wounded beast is caught in a snare, and it will bite anything that comes near.',
    recall: 'Finding a wounded beast in a snare, you',
    options: [
      {
        id: 'talk',
        label: 'Talk to it, low and steady, and cut it loose.',
        told: 'talked to it, low and steady, and cut it loose.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'draconic-bond': 2, 'feral-curse': 1, beastbond: 1 },
          skill: { survivalist: 1 },
          lineage: { wildkin: 1 },
        },
      },
      {
        id: 'misery',
        label: 'Put it out of its misery. Cleanly.',
        told: 'put it out of its misery, cleanly.',
        gives: {
          attribute: { physique: 1 },
          background: { mercenary: 1 },
          talent: { berserker: 1 },
          weapon: { bow: 1 },
        },
      },
      {
        id: 'sedate',
        label: 'Sedate it with something from your bag, then work.',
        told: 'sedated it with something from your bag, then went to work.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 2, 'cauldron-keeper': 1 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'leave',
        label: 'Leave it. The snare belongs to someone, and so does the beast.',
        told: 'left it. The snare belonged to someone, and so did the beast.',
        gives: {
          attribute: { mind: 1 },
          background: { investigator: 1, merchant: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'bind',
        label: 'Bind the wound first, then the jaws. You have done this before.',
        told: 'bound the wound first and the jaws second. You had done it before.',
        gives: {
          skill: { healer: 1 },
          attribute: { instinct: 1 },
          background: { outlander: 1 },
          talent: { mycomancer: 2 },
        },
      },
    ],
  },

  {
    id: 'road-camp',
    stage: 'road',
    asks: 'Night on the road, and the fire needs tending. What do you do with the hours?',
    recall: 'On the road, you spent the night hours',
    options: [
      {
        id: 'sharpen',
        label: 'Sharpen, oil and check every buckle twice.',
        told: 'sharpening, oiling and checking every buckle twice.',
        gives: {
          attribute: { physique: 1 },
          background: { military: 1, mercenary: 1 },
          skill: { vigilant: 1 },
          talent: { duelist: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'read',
        label: 'Read by the light until the light gives out.',
        told: 'reading by the fire until the light gave out.',
        gives: {
          attribute: { mind: 2 },
          background: { erudit: 1 },
          talent: { arcanist: 1 },
          skill: { scholar: 1 },
        },
      },
      {
        id: 'perimeter',
        label: 'Walk the perimeter. Something is always out there.',
        told: 'walking the perimeter. Something is always out there.',
        gives: {
          attribute: { instinct: 2 },
          background: { outlander: 1 },
          skill: { survivalist: 1, vigilant: 1 },
          talent: { 'feral-curse': 1 },
        },
      },
      {
        id: 'boil',
        label: 'Boil, steep and bottle. The fire is a tool.',
        told: 'boiling, steeping and bottling. A fire is a tool.',
        gives: {
          talent: { 'cauldron-keeper': 2, alchemist: 1 },
          skill: { apothecary: 1 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'play',
        label: 'Play something. Whoever is listening in the dark can listen too.',
        told: 'playing something, for whoever was listening in the dark.',
        gives: {
          background: { entertainer: 1 },
          skill: { troubadour: 1 },
          attribute: { instinct: 1 },
          weapon: { 'enchanted-instrument': 1 },
        },
      },
      {
        id: 'beast',
        label: 'Sit with the beast that travels with you and say nothing.',
        told: 'sitting with the beast that travels with you, saying nothing.',
        gives: {
          talent: { 'draconic-bond': 2 },
          attribute: { instinct: 1 },
          lineage: { wildkin: 1 },
        },
      },
      {
        id: 'runes',
        label: 'Trace the runes on your gear again. They fade if you do not.',
        told: 'tracing the runes on your gear again, because they fade if you do not.',
        gives: {
          talent: { enchanter: 3 },
          attribute: { mind: 1 },
          armor: { 'Magic Armor': 1 },
        },
      },
    ],
  },

  {
    id: 'road-river',
    stage: 'road',
    asks: 'The path ends at a river too wide to jump and too fast to swim.',
    recall: 'At a river too wide to jump, you',
    options: [
      {
        id: 'swim',
        label: 'Swim it anyway.',
        told: 'swam it anyway.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1 },
          lineage: { tidebound: 1 },
          skill: { seafarer: 1 },
        },
      },
      {
        id: 'tree',
        label: 'Find a tree, fell it and make a bridge.',
        told: 'felled a tree and made a bridge of it.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1 },
          skill: { survivalist: 1 },
          background: { outlander: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'ford',
        label: 'Read the water. There is a ford, and you will find it.',
        told: 'read the water until you found the ford.',
        gives: {
          attribute: { instinct: 1, mind: 1 },
          skill: { cartographer: 1, survivalist: 1 },
          background: { outlander: 1 },
        },
      },
      {
        id: 'spell',
        label: 'Freeze it, burn it, part it. There is a spell for this.',
        told: 'froze it, burned it or parted it. There is a spell for this.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 2 },
          weapon: { 'frost-wand': 1 },
          lineage: { tidebound: 1 },
        },
      },
      {
        id: 'ferry',
        label: 'Pay the ferryman on the far bank. There is always a ferryman.',
        told: 'paid the ferryman on the far bank. There is always a ferryman.',
        gives: {
          background: { merchant: 1, aristocrat: 1 },
          skill: { haggler: 1, charismatic: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'around',
        label: 'Go around. You are in no hurry.',
        told: 'went around. You were in no hurry.',
        gives: {
          attribute: { instinct: 1 },
          background: { outlander: 1 },
          skill: { frugal: 1 },
          talent: { guardian: 1 },
        },
      },
    ],
  },

  {
    id: 'road-oath',
    stage: 'road',
    asks: 'A magistrate asks you, under oath, where you were last night. You were somewhere you should not have been.',
    recall: 'Asked under oath where you had been, you',
    options: [
      {
        id: 'lie',
        label: 'Lie, beautifully. It is a gift.',
        told: 'lied, beautifully. It is a gift.',
        gives: {
          attribute: { instinct: 1 },
          skill: { charismatic: 1, cunning: 1 },
          talent: { trickster: 1 },
          background: { entertainer: 1, criminal: 1 },
        },
      },
      {
        id: 'truth',
        label: 'Tell the truth. Let them do what they will.',
        told: 'told the truth and let them do what they would.',
        gives: {
          attribute: { mind: 1 },
          talent: { guardian: 1 },
          lineage: { celestial: 1 },
          background: { investigator: 1 },
        },
      },
      {
        id: 'deflect',
        label: 'Answer a different question and make them think it was theirs.',
        told: 'answered a different question and made them think it was theirs.',
        gives: {
          attribute: { mind: 2 },
          skill: { mastermind: 1, empath: 1 },
          background: { aristocrat: 1, investigator: 1 },
        },
      },
      {
        id: 'silence',
        label: 'Say nothing. Stand there until they tire of you.',
        told: 'said nothing, and stood there until they tired of you.',
        gives: {
          attribute: { physique: 1 },
          lineage: { stalwart: 1 },
          talent: { berserker: 1, colossus: 1 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'ask',
        label: 'Ask, politely, what they think they know.',
        told: 'asked, politely, what they thought they knew.',
        gives: {
          attribute: { mind: 1 },
          skill: { inquisitor: 1 },
          background: { investigator: 2 },
        },
      },
    ],
  },

  {
    id: 'road-market',
    stage: 'road',
    asks: 'A market stall has the one thing you need, at three times what it is worth.',
    recall: 'Faced with a price three times too high, you',
    options: [
      {
        id: 'haggle',
        label: 'Haggle until the stallholder is tired of hearing your voice.',
        told: 'haggled until the stallholder was tired of hearing your voice.',
        gives: {
          background: { merchant: 2 },
          skill: { haggler: 2 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'pay',
        label: 'Pay. Time is worth more than coin.',
        told: 'paid. Time is worth more than coin.',
        gives: {
          background: { aristocrat: 1 },
          skill: { charismatic: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'take',
        label: 'Take it when the stallholder looks away.',
        told: 'took it when the stallholder looked away.',
        gives: {
          background: { criminal: 2 },
          talent: { trickster: 2 },
          attribute: { instinct: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'make',
        label: 'Make one yourself. It cannot be that hard.',
        told: 'made one yourself. It could not be that hard.',
        gives: {
          background: { craftsman: 2 },
          talent: { enchanter: 1, alchemist: 1 },
          skill: { skilled: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'without',
        label: 'Do without. You have done without before.',
        told: 'did without. You have done without before.',
        gives: {
          background: { outlander: 1 },
          skill: { frugal: 1, scavenger: 1 },
          attribute: { physique: 1 },
          lineage: { stalwart: 1 },
        },
      },
      {
        id: 'song',
        label: 'Offer a song, a story or a trick in place of coin.',
        told: 'offered a song, a story or a trick in place of coin.',
        gives: {
          background: { entertainer: 2 },
          skill: { troubadour: 1 },
          attribute: { instinct: 1 },
        },
      },
    ],
  },

  {
    id: 'road-taproom',
    stage: 'road',
    asks: 'A stranger insults you in a taproom, loudly, and the room goes quiet.',
    recall: 'Insulted in a quiet taproom, you',
    options: [
      {
        id: 'fist',
        label: 'Answer with a fist before the sentence is finished.',
        told: 'answered with a fist before the sentence was finished.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 2, brawler: 1 },
          weapon: { 'fist-weapon': 1 },
        },
      },
      {
        id: 'outside',
        label: 'Invite them outside. Formally. With witnesses.',
        told: 'invited them outside. Formally, with witnesses.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 3 },
          weapon: { 'finesse-weapon': 1 },
          background: { aristocrat: 1 },
        },
      },
      {
        id: 'drink',
        label: 'Laugh, buy them a drink and find out who sent them.',
        told: 'laughed, bought them a drink and found out who had sent them.',
        gives: {
          attribute: { instinct: 1, mind: 1 },
          skill: { charismatic: 1, inquisitor: 1 },
          background: { investigator: 1, entertainer: 1 },
        },
      },
      {
        id: 'pass',
        label: 'Let it pass. Their words weigh nothing.',
        told: 'let it pass. Their words weighed nothing.',
        gives: {
          attribute: { mind: 1 },
          talent: { guardian: 1 },
          lineage: { stalwart: 1 },
          skill: { empath: 1 },
        },
      },
      {
        id: 'poison',
        label: 'Make sure something unfortunate happens to their drink.',
        told: 'made sure something unfortunate happened to their drink.',
        gives: {
          talent: { alchemist: 1, trickster: 1 },
          skill: { cunning: 1 },
          attribute: { instinct: 1 },
          background: { criminal: 1 },
        },
      },
    ],
  },

  {
    id: 'road-wand',
    stage: 'road',
    asks: 'A wand lies in the mud where a mage fell. It is still warm.',
    recall: 'Finding a dead mage’s wand in the mud, you',
    options: [
      {
        id: 'learn',
        label: 'Take it. Learn it. Something taught you how to listen to these.',
        told: 'took it and learned it. Something had taught you how to listen to these.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 2 },
          weapon: { 'fire-wand': 1, 'lightning-wand': 1 },
          skill: { 'innate-spell-novice': 1 },
        },
      },
      {
        id: 'apart',
        label: 'Take it apart to see how it was made.',
        told: 'took it apart to see how it was made.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 2 },
          background: { craftsman: 1 },
          skill: { skilled: 1 },
        },
      },
      {
        id: 'sell',
        label: 'Sell it. Somebody will pay a great deal.',
        told: 'sold it. Somebody paid a great deal.',
        gives: {
          background: { merchant: 1, criminal: 1 },
          skill: { haggler: 1 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'leave',
        label: 'Leave it. Nothing good follows a dead mage’s things.',
        told: 'left it. Nothing good follows a dead mage’s things.',
        gives: {
          attribute: { instinct: 1 },
          background: { outlander: 1 },
          skill: { occultist: 1 },
        },
      },
      {
        id: 'return',
        label: 'Give it to whoever comes looking. They will come.',
        told: 'held it for whoever came looking, because somebody always does.',
        gives: {
          attribute: { mind: 1 },
          talent: { guardian: 1 },
          skill: { helpful: 1 },
          background: { aristocrat: 1 },
        },
      },
      {
        id: 'pull',
        label: 'Feel it pull at something under your skin, and answer.',
        told: 'felt it pull at something under your skin, and answered.',
        gives: {
          talent: { pactbound: 2 },
          lineage: { infernal: 1, celestial: 1 },
          attribute: { mind: 1 },
        },
      },
    ],
  },

  {
    id: 'road-wall',
    stage: 'road',
    asks: 'The town wall is between you and where you must be, and the gate is shut for the night.',
    recall: 'With the gate shut for the night, you',
    options: [
      {
        id: 'climb',
        label: 'Climb it. Walls are for other people.',
        told: 'climbed the wall. Walls are for other people.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'knock',
        label: 'Knock. Loudly. Until someone opens it to make you stop.',
        told: 'knocked, loudly, until someone opened it to make you stop.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, colossus: 1 },
          background: { military: 1 },
        },
      },
      {
        id: 'bribe',
        label: 'Bribe the watch. It is what the watch is for.',
        told: 'bribed the watch. It is what the watch is for.',
        gives: {
          background: { merchant: 1, criminal: 1 },
          skill: { haggler: 1, streetwise: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'drain',
        label: 'Find the drain. There is always a drain.',
        told: 'found the drain. There is always a drain.',
        gives: {
          attribute: { mind: 1, instinct: 1 },
          background: { investigator: 1 },
          skill: { cartographer: 1 },
          talent: { mycomancer: 2 },
        },
      },
      {
        id: 'hedge',
        label: 'Wait for dawn under a hedge. You have slept in worse.',
        told: 'slept under a hedge until dawn. You have slept in worse.',
        gives: {
          background: { outlander: 2 },
          skill: { survivalist: 1, frugal: 1 },
          attribute: { physique: 1 },
        },
      },
      {
        id: 'wings',
        label: 'Grow wings, or something like them, and go over.',
        told: 'went over, on wings or something like them.',
        gives: {
          lineage: { fey: 2, celestial: 1, infernal: 1, skybound: 1 },
          attribute: { instinct: 1 },
        },
      },
    ],
  },

  {
    id: 'road-purse',
    stage: 'road',
    asks: 'You find a purse of gold that is plainly not yours. Nobody saw.',
    recall: 'Finding a purse of gold that was not yours, you',
    options: [
      {
        id: 'keep',
        label: 'Keep it. Nobody saw.',
        told: 'kept it. Nobody saw.',
        gives: {
          background: { criminal: 2 },
          skill: { cunning: 1 },
          attribute: { instinct: 1 },
          talent: { trickster: 1 },
        },
      },
      {
        id: 'owner',
        label: 'Find the owner. It will take all day and you will do it anyway.',
        told: 'found the owner. It took all day and you did it anyway.',
        gives: {
          talent: { guardian: 1 },
          skill: { helpful: 1, inquisitor: 1 },
          background: { investigator: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'spend',
        label: 'Spend it before it can be missed, on something that lasts.',
        told: 'spent it before it could be missed, on something that lasts.',
        gives: {
          background: { merchant: 1, craftsman: 1 },
          skill: { haggler: 1 },
          talent: { enchanter: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'split',
        label: 'Split it with whoever is with you. Shares keep friends.',
        told: 'split it with whoever was with you. Shares keep friends.',
        gives: {
          background: { mercenary: 1, entertainer: 1 },
          skill: { charismatic: 1 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'bait',
        label: 'Leave it where it lies. Gold like that is bait.',
        told: 'left it where it lay. Gold like that is bait.',
        gives: {
          background: { outlander: 1 },
          skill: { vigilant: 1 },
          attribute: { instinct: 1 },
          lineage: { stalwart: 1 },
        },
      },
    ],
  },

  {
    id: 'road-fever',
    stage: 'road',
    asks: 'The village has a fever, and the road out is closed until it passes.',
    recall: 'Shut in a village with a fever, you',
    options: [
      {
        id: 'brew',
        label: 'Brew what they need from what grows here.',
        told: 'brewed what they needed from what grew there.',
        gives: {
          talent: { 'cauldron-keeper': 3, alchemist: 1 },
          skill: { apothecary: 1 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'nurse',
        label: 'Nurse them. Sleep can wait.',
        told: 'nursed them. Sleep could wait.',
        gives: {
          skill: { healer: 2, physician: 1 },
          talent: { guardian: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'water',
        label: 'Find where the water went bad.',
        told: 'found where the water had gone bad.',
        gives: {
          attribute: { mind: 2 },
          background: { investigator: 1 },
          skill: { scholar: 1, physician: 1 },
          talent: { alchemist: 1 },
        },
      },
      {
        id: 'leave',
        label: 'Leave anyway. Closed roads are a suggestion.',
        told: 'left anyway. A closed road is a suggestion.',
        gives: {
          attribute: { instinct: 1 },
          background: { outlander: 1, criminal: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'line',
        label: 'Hold the quarantine line. Nobody goes out, nobody comes in.',
        told: 'held the quarantine line. Nobody out, nobody in.',
        gives: {
          attribute: { physique: 1 },
          background: { military: 1 },
          talent: { guardian: 1 },
          skill: { vigilant: 1 },
        },
      },
    ],
  },

  /* ================================================================ leaving */
  {
    id: 'leaving-why',
    stage: 'leaving',
    asks: 'Why did you leave the life you had?',
    recall: 'You left the life you had because',
    options: [
      {
        id: 'ended',
        label: 'It ended. A fire, a war, a debt called in.',
        told: 'it ended. A fire, a war, a debt called in.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1 },
          background: { mercenary: 1, military: 1 },
          lineage: { undead: 1 },
        },
      },
      {
        id: 'protect',
        label: 'Someone needed protecting, and the only way was away.',
        told: 'someone needed protecting, and the only way was away.',
        gives: {
          talent: { guardian: 2 },
          skill: { helpful: 1 },
          attribute: { physique: 2 },
        },
      },
      {
        id: 'caught',
        label: 'You were caught. Leaving was the alternative to hanging.',
        told: 'you were caught, and leaving was the alternative to hanging.',
        gives: {
          background: { criminal: 1 },
          talent: { trickster: 1 },
          attribute: { instinct: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'called',
        label: 'You were called. You still do not know by what.',
        told: 'you were called, and you still do not know by what.',
        gives: {
          talent: { pactbound: 2, arcanist: 1 },
          lineage: { celestial: 1, infernal: 1 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'books',
        label: 'The books ran out. There was nothing left to learn there.',
        told: 'the books ran out. There was nothing left to learn there.',
        gives: {
          background: { erudit: 1 },
          talent: { arcanist: 1, enchanter: 1 },
          attribute: { mind: 2 },
        },
      },
      {
        id: 'wild',
        label: 'The wild called, and the beast in you answered.',
        told: 'the wild called, and the beast in you answered.',
        gives: {
          talent: { 'feral-curse': 2, mycomancer: 2, 'draconic-bond': 1 },
          attribute: { instinct: 1 },
          lineage: { wildkin: 1 },
        },
      },
      {
        id: 'hill',
        label: 'Nothing dramatic. You wanted to see what was over the hill.',
        told: 'you wanted to see what was over the hill. Nothing more dramatic than that.',
        gives: {
          background: { outlander: 1, entertainer: 1, merchant: 1 },
          attribute: { instinct: 1 },
          skill: { cartographer: 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-carry',
    stage: 'leaving',
    asks: 'What did you take with you, the night you left?',
    recall: 'The night you left, you took',
    options: [
      {
        id: 'great',
        label: 'A weapon too big for the doorway.',
        gives: {
          talent: { colossus: 3 },
          attribute: { physique: 2 },
          weapon: { 'melee-great': 1, 'great-polearm': 1 },
        },
      },
      {
        id: 'blades',
        label: 'A blade, a second blade and no sentiment.',
        gives: {
          talent: { duelist: 2 },
          attribute: { instinct: 1 },
          weapon: { 'paired-finesse': 1, 'finesse-weapon': 1 },
        },
      },
      {
        id: 'shield',
        label: 'A shield with a name on it that was not yours yet.',
        gives: {
          talent: { guardian: 3 },
          attribute: { physique: 2 },
          weapon: { 'melee-light-shield': 1, 'melee-heavy-shield': 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'book',
        label: 'A book you were not supposed to have.',
        gives: {
          talent: { arcanist: 2, enchanter: 1 },
          attribute: { mind: 1 },
          weapon: { 'psychic-tome': 1, 'sacred-tome': 1 },
          skill: { occultist: 1 },
        },
      },
      {
        id: 'cauldron',
        label: 'A cauldron, a bundle of herbs and a jar of something that moved.',
        gives: {
          talent: { 'cauldron-keeper': 2, alchemist: 2 },
          attribute: { instinct: 1 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'bow',
        label: 'A bow, a good knife and the last of the dried meat.',
        gives: {
          background: { outlander: 1 },
          attribute: { instinct: 1 },
          weapon: { bow: 1, 'long-bow': 1 },
          skill: { survivalist: 1 },
          talent: { sharpshooter: 1 },
        },
      },
      {
        id: 'creature',
        label: 'A creature that would not stay behind.',
        gives: {
          talent: { 'draconic-bond': 3 },
          attribute: { instinct: 1 },
          lineage: { wildkin: 1 },
        },
      },
      {
        id: 'pistol',
        label: 'A pistol, a lantern and a list of names.',
        gives: {
          background: { investigator: 1, mercenary: 1 },
          attribute: { instinct: 1 },
          weapon: { 'flintlock-pistol': 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'picks',
        label: 'A set of lockpicks and someone else’s coat.',
        gives: {
          talent: { trickster: 2 },
          background: { criminal: 1 },
          attribute: { instinct: 1 },
          weapon: { 'finesse-weapon': 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'hands',
        label: 'Nothing but your hands, and the anger.',
        gives: {
          talent: { berserker: 3 },
          attribute: { physique: 2 },
          weapon: { 'fist-weapon': 1 },
        },
      },
      {
        id: 'staff',
        label: 'A staff cut from a tree that spoke to you once.',
        gives: {
          talent: { mycomancer: 3 },
          attribute: { instinct: 1 },
          weapon: { 'sharp-staff': 1, 'force-staff': 1 },
          lineage: { fey: 1 },
        },
      },
      {
        id: 'contract',
        label: 'A contract, signed in something that was not ink.',
        gives: {
          talent: { pactbound: 3 },
          attribute: { mind: 1 },
          lineage: { infernal: 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-fight',
    stage: 'leaving',
    asks: 'Think of the first real fight you were in. How did it go?',
    recall: 'In your first real fight,',
    options: [
      {
        id: 'door',
        label: 'You held the door and nobody got past.',
        gives: {
          talent: { guardian: 3 },
          attribute: { physique: 2 },
          armor: { 'Heavy Armor': 1 },
          weapon: { 'finesse-shield': 1 },
        },
      },
      {
        id: 'temper',
        label: 'You lost your temper and, afterwards, some memory of it.',
        gives: {
          talent: { berserker: 3 },
          attribute: { physique: 2 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'quicker',
        label: 'You were quicker than them, and that was the whole of it.',
        gives: {
          talent: { duelist: 3 },
          attribute: { instinct: 1 },
          weapon: { 'finesse-weapon': 1 },
        },
      },
      {
        id: 'behind',
        label: 'You were not where they looked. You were behind them, and then it was over.',
        gives: {
          talent: { trickster: 3 },
          attribute: { instinct: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'fire',
        label: 'You did not touch anyone. The fire did.',
        gives: {
          talent: { arcanist: 3 },
          attribute: { mind: 1 },
          weapon: { 'fire-wand': 1 },
        },
      },
      {
        id: 'brewed',
        label: 'Something you had brewed did the work before the first blow.',
        gives: {
          talent: { alchemist: 2, 'cauldron-keeper': 2 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'brought',
        label: 'You brought something to the fight that was not you.',
        gives: {
          talent: { 'draconic-bond': 2, mycomancer: 2 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'notyou',
        label: 'You do not remember being yourself.',
        gives: {
          talent: { 'feral-curse': 3 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'lifted',
        label: 'You lifted something no one should lift, and swung it.',
        gives: {
          talent: { colossus: 3 },
          attribute: { physique: 2 },
          weapon: { 'melee-great': 1 },
        },
      },
      {
        id: 'blade',
        label: 'Your blade knew what to do before you did, and asked for something after.',
        gives: {
          talent: { pactbound: 3 },
          attribute: { mind: 1 },
        },
      },
      {
        id: 'armor',
        label: 'The armor you had worked on for a month held, exactly as you said it would.',
        gives: {
          talent: { enchanter: 3 },
          attribute: { mind: 1 },
          armor: { 'Magic Armor': 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-look',
    stage: 'leaving',
    asks: 'When people look at you now, what do they see first?',
    recall: 'When people look at you now, they see first',
    options: [
      {
        id: 'size',
        label: 'The size of you.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, berserker: 1 },
          lineage: { stalwart: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'stand',
        label: 'The way you stand: between them and the door.',
        gives: {
          talent: { guardian: 2 },
          attribute: { physique: 2 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'eyes',
        label: 'The eyes. They move too much, or not at all.',
        told: 'the eyes, which move too much or not at all.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, duelist: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'ink',
        label: 'The ink on your fingers and the book under your arm.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, enchanter: 1 },
          background: { erudit: 1 },
        },
      },
      {
        id: 'smell',
        label: 'The smell of herbs, smoke and something sharp.',
        gives: {
          talent: { 'cauldron-keeper': 1, alchemist: 1 },
          attribute: { instinct: 1 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'companion',
        label: 'Whatever it is that travels with you.',
        gives: {
          talent: { 'draconic-bond': 2 },
          attribute: { instinct: 1 },
        },
      },
      {
        id: 'wrong',
        label: 'Something wrong, just under the surface, that they cannot name.',
        gives: {
          talent: { 'feral-curse': 1, pactbound: 1 },
          lineage: { undead: 1, infernal: 1 },
          attribute: { instinct: 1 },
        },
      },
    ],
  },
];
