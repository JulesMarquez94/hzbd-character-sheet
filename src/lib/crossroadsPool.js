/**
 * The Crossroads: the situations a life is made of.
 *
 * The fourth way to make a character puts you in a moment and asks what you
 * do. A dog cornered behind the mill. A locked door with what you want behind
 * it. Someone bleeding in the street and nobody stopping. Every answer puts
 * points on the things a level-1 character is made of, and at the end the
 * points are counted and the drifter is waiting. See crossroads.js for the
 * counting; this file is only the questions.
 *
 * ------------------------------------------------------------------ provenance
 * **House-written on 2026-09-08, and rewritten the same day.** There is no
 * design sheet behind this pool. Jules gave the shape in chat and three scenes
 * as examples: someone hurt in the street (heal them, fetch the watch, rob
 * them and run), a locked door (bash it or pick it), and where you were born.
 * The first draft asked about the life directly, "where were you born, what
 * runs in the blood", and offered up to twelve answers. Jules threw that out:
 * "the question is to be situation", never more than four answers, and no
 * answer may read like a menu of what your blood is ("that type of element in
 * this person's blood, fire, storm, water, because that's just telling the
 * player"). Everything here is drafted to those three rules and every number
 * under it is the designer's to overrule, cut or rewrite.
 *
 * ------------------------------------------------------------------- the laws
 * Three, and scripts/check-crossroads.mjs holds every option to them.
 *
 * **A question is a scene, and it ends by asking what you do.** The stages
 * are the chapters of a life, childhood to the night you left, but nothing in
 * them is a form: a scene is asked, four things could be done, you say which.
 *
 * **Four answers at most.**
 *
 * **An answer leans one way.** Every option gives exactly one attribute, and
 * everything else it gives is built on that attribute: a talent set is either
 * shelved on it or on no attribute at all (the Draconic Bond, the Pact), a
 * Stalwart, Wildheart or Luminary point only rides an answer in its own
 * attribute, a weapon scales on it and an armor set is the one that suits it.
 * Putting your shoulder through the door is Physique and the Berserker and the
 * Colossus and a heavy blade, all at once, and nothing else. That is what makes
 * the count add up to somebody: a player who answers like a brawler ends up a
 * brawler, and never a Mind 6 holding a Guardian's shield.
 *
 * Backgrounds and skills are free of the law, since a Criminal may be built on
 * any attribute. The other ten lineages are free of it too, and are placed by
 * hand where the reaction fits the blood: diving into a flood is Tidebound,
 * pulling a bar from the coals bare-handed is Scorchbound, meeting a wolf's
 * eyes and holding them is Wildkin. None of them says so.
 *
 * -------------------------------------------------------------------- the shape
 *   id        stable; a run's answers are stored against it
 *   stage     which chapter of the life it belongs to
 *   asks      the scene, ending in the question
 *   text      a line under it, when the scene wants setting
 *   recall    how the backstory begins this sentence. `recall` + the option's
 *             `told` is one sentence of the lore page's backstory
 *   requires  optional. Tags an earlier answer must have set, any one of them.
 *             This is how a scene only happens because of what you did before:
 *             the watch comes for a thief, the academy writes to somebody who
 *             spoke a word they did not know, the man you put down comes back
 *   options   the choices, in the order they are offered. Four at most
 *
 * An option:
 *
 *   id        stable within its question
 *   label     the choice as the player reads it, imperative or plain
 *   told      the clause the backstory writes after `recall`
 *   tags      optional. What this answer makes true of the life, for `requires`
 *   gives     the points, grouped by what they land on:
 *               attribute   exactly one of physique, instinct or mind
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
 * time because what you did for a living is most of what a background is; a
 * night on the road hands out one or two because a single night says less about
 * a life than ten years did.
 *
 * ------------------------------------------------------------------- the voice
 * The reader is `you`, and the scene is asked of the character rather than of
 * the player. A label is what you did and never names a rule, a set or a
 * number: "roar and go through the middle one" is a Berserker's answer without
 * saying so, which is the whole point of asking it this way. docs/text-style.md
 * applies to every word here.
 */

/* ------------------------------------------------------------------ the stages */

export const STAGES = [
  { id: 'childhood', title: 'Childhood', draw: 1 },
  { id: 'home', title: 'Home', draw: 1 },
  { id: 'blood', title: 'Blood', draw: 2 },
  { id: 'youth', title: 'Youth', draw: 2 },
  { id: 'trade', title: 'Trade', draw: 1 },
  { id: 'road', title: 'The Road', draw: 4 },
  { id: 'leaving', title: 'Leaving', draw: 1 },
];

/* ------------------------------------------------------------ what fills a gap
 * The kit's armor and weapon are scored by answers like everything else, but a
 * run can end with nothing pointing at either. These are what the highest
 * attribute reaches for then, in order of preference, and they are data so the
 * designer can move them without reading the engine. Each weapon scales on the
 * attribute it is listed under; the checker holds them to that. */

export const WEAPON_DEFAULTS = {
  physique: ['melee-heavy', 'melee-great', 'melee-light-shield'],
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
  /* ============================================================ childhood */
  {
    id: 'child-dog',
    stage: 'childhood',
    asks: 'You are six. The other children have cornered a stray dog behind the mill, and one of them has picked up a stone. What do you do?',
    recall: 'At six, with a dog cornered behind the mill, you',
    options: [
      {
        id: 'stand',
        label: 'Stand in front of the dog and take the stone yourself.',
        told: 'stood in front of the dog and took the stone yourself.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 2 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { helpful: 1 },
        },
      },
      {
        id: 'whistle',
        label: 'Whistle, low. The dog comes to you instead of running.',
        told: 'whistled low, and the dog came to you instead of running.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, 'draconic-bond': 2 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'story',
        label: 'Tell them, loudly and with conviction, what became of the last boy who stoned a dog.',
        told: 'told them, loudly and with conviction, what became of the last boy who stoned a dog.',
        gives: {
          attribute: { mind: 1 },
          lineage: { infernal: 1 },
          background: { entertainer: 2 },
          skill: { troubadour: 1, charismatic: 1 },
        },
      },
      {
        id: 'stone',
        label: 'Throw a stone of your own, at the one holding the stone.',
        told: 'threw a stone of your own, at the one holding the stone.',
        tags: ['did:violence'],
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 2, brawler: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
        },
      },
    ],
  },

  {
    id: 'child-fire',
    stage: 'childhood',
    asks: 'The barn is on fire and the calf is still inside. The grown-ups are all at the well. What do you do?',
    recall: 'When the barn burned, you',
    options: [
      {
        id: 'in',
        label: 'Go in through the smoke, low and fast, and come out with the calf.',
        told: 'went in through the smoke, low and fast, and came out with the calf.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, berserker: 1 },
          lineage: { scorchbound: 2 },
          background: { military: 1 },
        },
      },
      {
        id: 'back',
        label: 'Slip round the back where the boards are rotten and coax the calf out through the gap.',
        told: 'slipped round the back where the boards were rotten and coaxed the calf out through the gap.',
        gives: {
          attribute: { instinct: 1 },
          lineage: { wildkin: 1 },
          background: { craftsman: 1 },
          skill: { survivalist: 1, cunning: 1 },
        },
      },
      {
        id: 'well',
        label: 'Run for the well and get the bucket line moving before anyone thinks to.',
        told: 'ran for the well and had the bucket line moving before anyone thought to.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          background: { military: 1, aristocrat: 1 },
          skill: { mastermind: 1, helpful: 1 },
        },
      },
      {
        id: 'roof',
        label: 'Watch how the fire moves, and understand before anyone else that the roof is about to come down.',
        told: 'watched how the fire moved, and understood before anyone else that the roof was about to come down.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, alchemist: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 2 },
          skill: { scholar: 1 },
        },
      },
    ],
  },

  {
    id: 'child-market',
    stage: 'childhood',
    asks: 'You are eight, at the market, with a coin that is not enough for the thing you want. The stallholder has turned away. What do you do?',
    recall: 'At eight, with a coin that was not enough, you',
    options: [
      {
        id: 'take',
        label: 'Take it and walk. Not run.',
        told: 'took the thing and walked, not ran.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 2 },
          lineage: { fey: 1 },
          background: { criminal: 2 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'promise',
        label: 'Offer the coin and a promise, and mean the promise.',
        told: 'offered the coin and a promise, and meant the promise.',
        gives: {
          attribute: { mind: 1 },
          lineage: { celestial: 1 },
          background: { merchant: 2, aristocrat: 2 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'crates',
        label: 'Offer to carry crates for the rest of the day, until the coin is enough.',
        told: 'offered to carry crates until the coin was enough, and carried them.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, colossus: 1 },
          lineage: { stalwart: 1 },
          background: { craftsman: 1, military: 1 },
          skill: { frugal: 1, helpful: 1 },
        },
      },
      {
        id: 'make',
        label: 'Put the coin away. You will make one yourself, and it will be better.',
        told: 'put the coin away, made one yourself, and it was better.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 3, alchemist: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1 },
        },
      },
    ],
  },

  {
    id: 'child-dark',
    stage: 'childhood',
    asks: 'The cellar door has shut behind you and the candle has gone out. Nobody heard. What do you do?',
    recall: 'Shut in the dark cellar, you',
    options: [
      {
        id: 'shoulder',
        label: 'Shoulder the door until the latch gives.',
        told: 'shouldered the door until the latch gave.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, colossus: 1 },
          lineage: { stalwart: 1 },
        },
      },
      {
        id: 'listen',
        label: 'Sit still. Listen. Let your eyes learn the dark.',
        told: 'sat still, listened and let your eyes learn the dark.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 2, trickster: 1 },
          lineage: { wildkin: 1, wildheart: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'walls',
        label: 'Feel along the walls for the shelf, the jars and the way the stones are laid, until you know the room.',
        told: 'felt along the walls for the shelf, the jars and the way the stones were laid, until you knew the room.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { investigator: 1 },
          skill: { skilled: 1 },
        },
      },
      {
        id: 'speak',
        label: 'Speak into the dark, to whatever is in there with you. It answers.',
        told: 'spoke into the dark, to whatever was in there with you, and it answered.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 2 },
          lineage: { infernal: 1 },
          skill: { occultist: 1 },
        },
      },
    ],
  },

  /* ================================================================= home */
  {
    id: 'home-debt',
    stage: 'home',
    asks: 'A man comes to the door for a debt your father cannot pay, and your father is not home. You are twelve. What do you do?',
    recall: 'When the debt collector came and your father was out, you',
    options: [
      {
        id: 'doorway',
        label: 'Stand in the doorway and tell him to come back when there is a man in the house to speak to.',
        told: 'stood in the doorway and told him to come back when there was a man in the house to speak to.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 2 },
          background: { military: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'talk',
        label: 'Invite him in, pour what there is to pour and talk the debt down by half before he notices.',
        told: 'invited him in, poured what there was to pour and talked the debt down by half before he noticed.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 2, aristocrat: 1 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'follow',
        label: 'Follow him home afterwards and learn where he keeps his ledger.',
        told: 'followed him home afterwards and learned where he kept his ledger.',
        gives: {
          attribute: { instinct: 1 },
          background: { criminal: 2, investigator: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'ask',
        label: 'Ask him what the debt is really for. Nobody sends a man like this for money.',
        told: 'asked him what the debt was really for, because nobody sends a man like that for money.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { infernal: 1 },
          background: { investigator: 2 },
          skill: { inquisitor: 1, empath: 1 },
        },
      },
    ],
  },

  {
    id: 'home-sick',
    stage: 'home',
    asks: 'Your sister has a fever the village healer cannot break, and the nearest physician is two days away. What do you do?',
    recall: 'When your sister’s fever would not break, you',
    options: [
      {
        id: 'go',
        label: 'Go. Two days there and two back, and you run the first of them.',
        told: 'went for the physician, two days there and two back, and ran the first of them.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'gather',
        label: 'Gather what grows by the stream, boil it the way your grandmother did and pray you remember right.',
        told: 'gathered what grew by the stream, boiled it the way your grandmother did and prayed you remembered right.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 2, mycomancer: 2 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'read',
        label: 'Read every page of the almanac on the shelf until you find the fever.',
        told: 'read every page of the almanac on the shelf until you found the fever.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1, arcanist: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 2 },
          skill: { physician: 1, scholar: 1 },
        },
      },
      {
        id: 'promise',
        label: 'Sit with her through the nights, holding on. Promise anything to anyone listening.',
        told: 'sat with her through the nights, holding on, promising anything to anyone listening.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1 },
          lineage: { celestial: 1, infernal: 1 },
          skill: { healer: 1 },
        },
      },
    ],
  },

  {
    id: 'home-feast',
    stage: 'home',
    asks: 'The harvest feast. Your uncle, drunk, has started on the story about your mother that nobody tells. What do you do?',
    recall: 'When your drunk uncle started the story nobody tells, you',
    options: [
      {
        id: 'back',
        label: 'Put him on his back in the yard before he finishes the sentence.',
        told: 'put him on his back in the yard before he finished the sentence.',
        tags: ['did:violence'],
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 2, brawler: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'song',
        label: 'Start a song, loud enough that the table joins in and the story is lost.',
        told: 'started a song, loud enough that the table joined in and the story was lost.',
        gives: {
          attribute: { instinct: 1 },
          talent: { virtuoso: 1 },
          lineage: { fey: 1 },
          background: { entertainer: 3 },
          skill: { troubadour: 1, charismatic: 1 },
          weapon: { 'enchanted-instrument': 1 },
        },
      },
      {
        id: 'ask',
        label: 'Let him finish. Then ask, quietly, for the parts he left out.',
        told: 'let him finish, then asked, quietly, for the parts he left out.',
        gives: {
          attribute: { mind: 1 },
          background: { investigator: 1, erudit: 1 },
          skill: { inquisitor: 1, empath: 1 },
        },
      },
      {
        id: 'cup',
        label: 'Refill his cup with something that will have him asleep inside a minute.',
        told: 'refilled his cup with something that had him asleep inside a minute.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 2, trickster: 1 },
          skill: { apothecary: 1, cunning: 1 },
        },
      },
    ],
  },

  {
    id: 'home-leave',
    stage: 'home',
    asks: 'Your family is leaving the valley for good, the cart is full and there is room for one more thing of yours. What do you take?',
    recall: 'When the family left the valley, you took',
    options: [
      {
        id: 'hammer',
        label: 'Your father’s hammer. It is heavier than you, and you carry it anyway.',
        told: 'your father’s hammer. It was heavier than you and you carried it anyway.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 2 },
          background: { craftsman: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'book',
        label: 'The book nobody else could read.',
        told: 'the book nobody else could read.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 2, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1 },
          skill: { scholar: 1, occultist: 1 },
          weapon: { 'psychic-tome': 1 },
        },
      },
      {
        id: 'hound',
        label: 'The hound. Nobody agreed to that, and nobody stopped you.',
        told: 'the hound. Nobody agreed to that, and nobody stopped you.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'draconic-bond': 3, 'feral-curse': 1 },
          lineage: { wildkin: 1 },
        },
      },
      {
        id: 'nothing',
        label: 'Nothing. You walk beside the cart with your hands free and your eyes on the road.',
        told: 'nothing, and walked beside the cart with your hands free and your eyes on the road.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1 },
          skill: { vigilant: 1 },
        },
      },
    ],
  },

  /* ================================================================ blood */
  {
    id: 'blood-cliff',
    stage: 'blood',
    asks: 'The rain has taken the path along the cliff. The only way on is the rock face. What do you do?',
    recall: 'With the cliff path gone, you',
    options: [
      {
        id: 'climb',
        label: 'Climb it. Your hands find holds before your eyes do, and the height means nothing.',
        told: 'climbed. Your hands found holds before your eyes did, and the height meant nothing.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1 },
          lineage: { skybound: 3, wildkin: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'stones',
        label: 'Find the fallen stones, lift them back and build the path again.',
        told: 'found the fallen stones, lifted them back and built the path again.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, guardian: 1 },
          lineage: { stonebound: 3 },
          background: { craftsman: 1 },
        },
      },
      {
        id: 'read',
        label: 'Read the face for its fault lines and pick the one route a careless climber would not.',
        told: 'read the face for its fault lines and picked the one route a careless climber would not.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { luminary: 1 },
          background: { investigator: 1 },
          skill: { cartographer: 1 },
        },
      },
      {
        id: 'step',
        label: 'Step off the edge, and trust the wind, or whatever it is, to hold you.',
        told: 'stepped off the edge and trusted the wind, or whatever it was, to hold you.',
        tags: ['did:magic'],
        gives: {
          attribute: { instinct: 1 },
          lineage: { fey: 2, skybound: 1, celestial: 1, infernal: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-river',
    stage: 'blood',
    asks: 'The ferry is gone, the river is in flood and the child who fell in is already ten yards out. What do you do?',
    recall: 'When the child went into the flood, you',
    options: [
      {
        id: 'dive',
        label: 'Dive. The cold does not reach you the way it should, and you have the child before the bend.',
        told: 'dived. The cold never reached you the way it should have, and you had the child before the bend.',
        gives: {
          attribute: { instinct: 1 },
          lineage: { tidebound: 3 },
          skill: { seafarer: 1 },
        },
      },
      {
        id: 'bank',
        label: 'Run the bank ahead of them, wade in where it shallows and catch them as they come.',
        told: 'ran the bank ahead of them, waded in where it shallowed and caught them as they came.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 2 },
          background: { military: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'rope',
        label: 'Throw the rope, anchor yourself and haul. It is the only way two people come out.',
        told: 'threw the rope, anchored yourself and hauled, because that is the only way two people come out.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          background: { military: 1 },
          skill: { mastermind: 1, survivalist: 1 },
        },
      },
      {
        id: 'word',
        label: 'Speak a word you did not know you knew, and the water slows.',
        told: 'spoke a word you did not know you knew, and the water slowed.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 2 },
          lineage: { tidebound: 1, celestial: 1 },
          skill: { 'innate-spell-novice': 1 },
          weapon: { 'frost-wand': 1 },
        },
      },
    ],
  },

  {
    id: 'blood-forge',
    stage: 'blood',
    asks: 'The smith has stepped out and left the forge lit, the bar in the coals and the door open. What do you do?',
    recall: 'Alone in the smith’s open forge, you',
    options: [
      {
        id: 'hammer',
        label: 'Take up the hammer. Your arm knows the rhythm before you have thought about it.',
        told: 'took up the hammer, and your arm knew the rhythm before you had thought about it.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 2, berserker: 1 },
          lineage: { scorchbound: 1 },
          background: { craftsman: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'bare',
        label: 'Pull the bar from the coals with your bare hand, and only notice afterwards.',
        told: 'pulled the bar from the coals with your bare hand, and only noticed afterwards.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1 },
          lineage: { scorchbound: 3, draconic: 1, undead: 1 },
        },
      },
      {
        id: 'study',
        label: 'Study the quench, the colour of the steel and the way the tools are laid. You will do this better.',
        told: 'studied the quench, the colour of the steel and the way the tools were laid. You would do this better.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 3, alchemist: 1 },
          background: { craftsman: 2 },
          skill: { skilled: 1 },
        },
      },
      {
        id: 'chisel',
        label: 'Pocket the good chisel and be gone before he is back.',
        told: 'pocketed the good chisel and were gone before he was back.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 2 },
          lineage: { fey: 1 },
          background: { criminal: 2 },
          skill: { cunning: 1, streetwise: 1 },
          weapon: { 'finesse-weapon': 1 },
        },
      },
    ],
  },

  {
    id: 'blood-wolves',
    stage: 'blood',
    asks: 'Three wolves at the edge of the firelight. The horses are screaming. What do you do?',
    recall: 'With wolves at the edge of the firelight, you',
    options: [
      {
        id: 'roar',
        label: 'Stand up with the burning brand and roar back. Something in your voice makes them think again.',
        told: 'stood up with the burning brand and roared back, and something in your voice made them think again.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 2 },
          lineage: { draconic: 3 },
          background: { military: 1 },
        },
      },
      {
        id: 'eyes',
        label: 'Meet the lead wolf’s eyes and hold them. It knows you, or knows what you are.',
        told: 'met the lead wolf’s eyes and held them. It knew you, or knew what you were.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 3, 'draconic-bond': 1 },
          lineage: { wildkin: 2 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'shield',
        label: 'Get between the wolves and the horses with the shield off the cart, and let them come.',
        told: 'got between the wolves and the horses with the shield off the cart, and let them come.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 3 },
          background: { military: 1 },
          weapon: { 'melee-light-shield': 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'powder',
        label: 'Throw the powder from your pouch into the fire. The flash sends them off, and you into the dark for more.',
        told: 'threw the powder from your pouch into the fire. The flash sent them off, and you into the dark for more.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 2 },
          skill: { apothecary: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-grave',
    stage: 'blood',
    asks: 'You wake in the ditch where they left you for dead, with the wound that should have finished you. What do you do?',
    recall: 'Waking in the ditch where they left you for dead, you',
    options: [
      {
        id: 'up',
        label: 'Get up. It hurts less than it should, and you have somewhere to be.',
        told: 'got up. It hurt less than it should have, and you had somewhere to be.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1 },
          lineage: { undead: 3 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'still',
        label: 'Lie still until the ones who did it are gone. Then follow them home.',
        told: 'lay still until the ones who did it were gone, then followed them home.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, duelist: 1 },
          lineage: { wildheart: 1 },
          background: { investigator: 1 },
          skill: { cunning: 1, vigilant: 1 },
        },
      },
      {
        id: 'bind',
        label: 'Pack the wound with what you can reach, bind it with your shirt and count your pulse until morning.',
        told: 'packed the wound with what you could reach, bound it with your shirt and counted your pulse until morning.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1 },
          lineage: { celestial: 1 },
          background: { erudit: 1 },
          skill: { physician: 1, healer: 1 },
        },
      },
      {
        id: 'promise',
        label: 'Make a promise to whatever is listening. Something listens.',
        told: 'made a promise to whatever was listening, and something listened.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 3 },
          lineage: { infernal: 2 },
          skill: { occultist: 1 },
        },
      },
    ],
  },

  /* ================================================================ youth */
  {
    id: 'youth-duel',
    stage: 'youth',
    asks: 'The miller’s son has called you out in front of everyone, and everyone is waiting. What do you do?',
    recall: 'Called out in front of everyone, you',
    options: [
      {
        id: 'first',
        label: 'Hit him first, before the waiting is over.',
        told: 'hit him first, before the waiting was over.',
        tags: ['did:violence'],
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 2, brawler: 1 },
          background: { mercenary: 2 },
          weapon: { 'melee-light': 1 },
        },
      },
      {
        id: 'hour',
        label: 'Name the hour and the place, and bring a second. It will be done properly.',
        told: 'named the hour and the place and brought a second. It was done properly.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 3 },
          background: { aristocrat: 1 },
          skill: { 'quick-draw': 1 },
          weapon: { 'finesse-weapon': 1 },
        },
      },
      {
        id: 'laugh',
        label: 'Laugh, agree with every word he said and buy him a drink. The crowd turns before he does.',
        told: 'laughed, agreed with every word he said and bought him a drink, and the crowd turned before he did.',
        gives: {
          attribute: { mind: 1 },
          background: { entertainer: 2, merchant: 1 },
          skill: { charismatic: 1, empath: 1 },
        },
      },
      {
        id: 'walk',
        label: 'Walk away. There will be a night when he is alone.',
        told: 'walked away. There would be a night when he was alone.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 2 },
          skill: { cunning: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-lock',
    stage: 'youth',
    asks: 'A locked door with what you want behind it. Nobody is coming to open it and nobody is watching. What do you do?',
    recall: 'Faced with a locked door, you',
    options: [
      {
        id: 'shoulder',
        label: 'Put your shoulder through it.',
        told: 'put your shoulder through it.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, colossus: 1, brawler: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'pick',
        label: 'Pick the lock. You have the tools, and the patience.',
        told: 'picked the lock. You had the tools, and the patience.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 2 },
          background: { criminal: 2 },
          skill: { cunning: 1 },
          weapon: { 'finesse-weapon': 1 },
        },
      },
      {
        id: 'study',
        label: 'Study the hinges, the frame and the lock plate. There is always a flaw, and you find it.',
        told: 'studied the hinges, the frame and the lock plate until you found the flaw. There is always a flaw.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 1, arcanist: 1 },
          background: { investigator: 1 },
          skill: { skilled: 1 },
        },
      },
      {
        id: 'wait',
        label: 'Wait. Someone always comes, and then the door is their problem.',
        told: 'waited. Someone always comes, and then the door is their problem.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1 },
          background: { investigator: 1 },
          skill: { empath: 1, vigilant: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-hurt',
    stage: 'youth',
    asks: 'Someone is hurt in the street, bleeding, and nobody is stopping. What do you do?',
    recall: 'When someone lay bleeding in the street, you',
    options: [
      {
        id: 'flask',
        label: 'Kneel, stop the bleeding and pour what is in your flask down their throat.',
        told: 'knelt, stopped the bleeding and poured what was in your flask down their throat.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 2 },
          lineage: { celestial: 1 },
          skill: { healer: 1, physician: 1 },
        },
      },
      {
        id: 'carry',
        label: 'Lift them and carry them to the watch house yourself. It is faster.',
        told: 'lifted them and carried them to the watch house yourself. It was faster.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 2, colossus: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { helpful: 1 },
        },
      },
      {
        id: 'pockets',
        label: 'Check their pockets while you check their pulse, and be gone.',
        told: 'checked their pockets while you checked their pulse, and were gone.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 2 },
          background: { criminal: 2 },
          skill: { streetwise: 1, cunning: 1 },
        },
      },
      {
        id: 'find',
        label: 'Find who did it. They are not far, and they are not expecting you.',
        told: 'went after whoever did it. They were not far, and they were not expecting you.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, 'feral-curse': 1 },
          lineage: { wildkin: 1 },
          background: { investigator: 1, mercenary: 1 },
          skill: { vigilant: 1, inquisitor: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-book',
    stage: 'youth',
    asks: 'The travelling scholar has left his trunk of books unlocked in the taproom while he sleeps. What do you do?',
    recall: 'With the scholar’s trunk unlocked and the scholar asleep, you',
    options: [
      {
        id: 'read',
        label: 'Read until dawn, and put every book back exactly where it was.',
        told: 'read until dawn, and put every book back exactly where it had been.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 2, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 3 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'clasp',
        label: 'Take the one with the brass clasp. He has more books than he needs.',
        told: 'took the one with the brass clasp. He had more books than he needed.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'lock',
        label: 'Sell him a lock in the morning, and a strongbox for the lock.',
        told: 'sold him a lock in the morning, and a strongbox for the lock.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 2, craftsman: 1 },
          skill: { haggler: 1 },
        },
      },
      {
        id: 'door',
        label: 'Sit outside his door with your back to it until he wakes. Someone should.',
        told: 'sat outside his door with your back to it until he woke. Someone should.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 2 },
          background: { military: 1 },
          skill: { vigilant: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-beast',
    stage: 'youth',
    asks: 'A wounded beast is caught in a snare, and it will bite anything that comes near. What do you do?',
    recall: 'Finding a wounded beast in a snare, you',
    options: [
      {
        id: 'talk',
        label: 'Talk to it, low and steady, and cut it loose.',
        told: 'talked to it, low and steady, and cut it loose.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'draconic-bond': 3, 'feral-curse': 2 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'end',
        label: 'End it cleanly. Take the meat and the pelt.',
        told: 'ended it cleanly and took the meat and the pelt.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1 },
          background: { mercenary: 1 },
          skill: { survivalist: 1, scavenger: 1 },
          weapon: { 'melee-light': 1 },
        },
      },
      {
        id: 'dust',
        label: 'Blow the sleeping dust from your pouch into its face, then work on the leg.',
        told: 'blew the sleeping dust from your pouch into its face, then worked on the leg.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 2 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'bind',
        label: 'Bind its jaws first and the leg second, the way the old trapper showed you.',
        told: 'bound its jaws first and the leg second, the way the old trapper showed you.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 2, mycomancer: 3 },
          background: { outlander: 2 },
          skill: { healer: 1, survivalist: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-watch',
    stage: 'youth',
    requires: ['did:theft'],
    asks: 'The watch has your description and a warrant, and they are at the door. What do you do?',
    recall: 'When the watch came to the door with a warrant, you',
    options: [
      {
        id: 'roofs',
        label: 'Out the window and across the roofs. They never look up.',
        told: 'went out the window and across the roofs. They never look up.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 2 },
          lineage: { fey: 1, skybound: 1 },
          background: { criminal: 2 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'warrant',
        label: 'Open the door and ask to see the warrant. Then find the flaw in it.',
        told: 'opened the door, asked to see the warrant and found the flaw in it.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { inquisitor: 1, mastermind: 1 },
        },
      },
      {
        id: 'doorway',
        label: 'Stand in the doorway and let them try.',
        told: 'stood in the doorway and let them try.',
        gives: {
          attribute: { physique: 2 },
          talent: { brawler: 1, colossus: 1, berserker: 1 },
          lineage: { stalwart: 1, undead: 1 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'bargain',
        label: 'Bargain. Everything they want is for sale, including the man who hired you.',
        told: 'bargained. Everything they wanted was for sale, including the man who hired you.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1 },
          skill: { haggler: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-letter',
    stage: 'youth',
    requires: ['did:magic'],
    asks: 'A letter comes, sealed with a mark you do not know, from an academy you never wrote to. It says they have been watching. What do you do?',
    recall: 'When the academy’s letter came, you',
    options: [
      {
        id: 'go',
        label: 'Go. Whatever they saw, you want to know its name.',
        told: 'went. Whatever they had seen, you wanted to know its name.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 2, enchanter: 1 },
          lineage: { luminary: 1, celestial: 1 },
          background: { erudit: 2 },
          skill: { scholar: 1 },
        },
      },
      {
        id: 'burn',
        label: 'Burn it. Nothing that watches you from a distance means you well.',
        told: 'burned it. Nothing that watches you from a distance means you well.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'feral-curse': 2, mycomancer: 2 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'price',
        label: 'Write back and name a price for being watched.',
        told: 'wrote back and named a price for being watched.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1 },
          skill: { haggler: 1 },
        },
      },
      {
        id: 'nail',
        label: 'Nail it to the academy’s own door and stand there until someone explains.',
        told: 'nailed it to the academy’s own door and stood there until someone explained.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1 },
          background: { military: 1 },
        },
      },
    ],
  },

  /* ================================================================ trade */
  {
    id: 'trade-fire',
    stage: 'trade',
    asks: 'The warehouse on the quay is burning, and half the town has come to watch. What do you do?',
    recall: 'When the warehouse on the quay burned, you',
    options: [
      {
        id: 'crews',
        label: 'Get the crews into a line and the pumps working. Someone has to give the orders.',
        told: 'got the crews into a line and the pumps working. Someone had to give the orders.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1 },
          background: { military: 3 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'calm',
        label: 'Note who is watching too calmly, and follow him afterwards.',
        told: 'noted who was watching too calmly, and followed him afterwards.',
        gives: {
          attribute: { mind: 1 },
          background: { investigator: 3 },
          skill: { inquisitor: 1, cunning: 1 },
        },
      },
      {
        id: 'salvage',
        label: 'Buy the salvage rights from the owner while it is still burning.',
        told: 'bought the salvage rights from the owner while it was still burning.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 3 },
          skill: { haggler: 1 },
        },
      },
      {
        id: 'keep',
        label: 'Go in for whatever is not yet burning, and keep it.',
        told: 'went in for whatever was not yet burning, and kept it.',
        gives: {
          attribute: { instinct: 1 },
          background: { criminal: 3 },
          skill: { streetwise: 1 },
        },
      },
    ],
  },

  {
    id: 'trade-noble',
    stage: 'trade',
    asks: 'A lord’s carriage has broken an axle on the road, and the lord is shouting. What do you do?',
    recall: 'When the lord’s carriage broke its axle, you',
    options: [
      {
        id: 'fix',
        label: 'Fix the axle. It takes an hour, and you do it better than the man who built it.',
        told: 'fixed the axle. It took an hour, and you did it better than the man who built it.',
        gives: {
          attribute: { physique: 1 },
          background: { craftsman: 3 },
          skill: { skilled: 1, tailor: 1 },
        },
      },
      {
        id: 'price',
        label: 'Name a price for the fixing, and double it when he shouts again.',
        told: 'named a price for the fixing, and doubled it when he shouted again.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 2, mercenary: 1 },
          skill: { haggler: 1 },
        },
      },
      {
        id: 'house',
        label: 'Address him by his house and his father’s name, and watch the shouting stop.',
        told: 'addressed him by his house and his father’s name, and watched the shouting stop.',
        gives: {
          attribute: { mind: 1 },
          background: { aristocrat: 3 },
          skill: { charismatic: 1 },
        },
      },
      {
        id: 'lift',
        label: 'Lift the carriage while the wheel is set. It is quicker than a jack.',
        told: 'lifted the carriage while the wheel was set. It was quicker than a jack.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 2 },
          lineage: { stalwart: 1 },
          background: { craftsman: 1, mercenary: 1 },
        },
      },
    ],
  },

  {
    id: 'trade-stage',
    stage: 'trade',
    asks: 'The tavern’s singer has not turned up, the room is full and the landlord is looking at you. What do you do?',
    recall: 'With the singer missing and the room full, you',
    options: [
      {
        id: 'stage',
        label: 'Take the stage. You have never once been able to resist a full room.',
        told: 'took the stage. You have never once been able to resist a full room.',
        gives: {
          attribute: { instinct: 1 },
          talent: { virtuoso: 1 },
          lineage: { fey: 1 },
          background: { entertainer: 3 },
          skill: { troubadour: 1, charismatic: 1 },
          weapon: { 'enchanted-instrument': 1 },
        },
      },
      {
        id: 'scar',
        label: 'Tell them a true story from the last war, and show them the scar.',
        told: 'told them a true story from the last war, and showed them the scar.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1 },
          background: { mercenary: 2, military: 1 },
          skill: { charismatic: 1 },
        },
      },
      {
        id: 'almanac',
        label: 'Read them the almanac’s weather for the week, which is what a room actually wants to know.',
        told: 'read them the almanac’s weather for the week, which is what a room actually wants to know.',
        gives: {
          attribute: { mind: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 3 },
          skill: { scholar: 1 },
        },
      },
      {
        id: 'road',
        label: 'Slip out the back. You were only ever passing through, and the road is quieter.',
        told: 'slipped out the back. You were only ever passing through, and the road was quieter.',
        gives: {
          attribute: { instinct: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 3 },
          skill: { survivalist: 1 },
        },
      },
    ],
  },

  {
    id: 'trade-body',
    stage: 'trade',
    asks: 'There is a body in the alley behind the guildhall, and you found it. What do you do?',
    recall: 'Finding the body behind the guildhall, you',
    options: [
      {
        id: 'read',
        label: 'Read the scene: the boots, the hands, the way he fell. You know how he died before the watch arrives.',
        told: 'read the scene, the boots, the hands and the way he fell, and knew how he died before the watch arrived.',
        gives: {
          attribute: { mind: 2 },
          lineage: { luminary: 1 },
          background: { investigator: 3 },
          skill: { inquisitor: 1, physician: 1 },
        },
      },
      {
        id: 'search',
        label: 'Search him for coin and papers, then walk away whistling.',
        told: 'searched him for coin and papers, then walked away whistling.',
        gives: {
          attribute: { instinct: 1 },
          background: { criminal: 3 },
          skill: { streetwise: 1 },
        },
      },
      {
        id: 'carry',
        label: 'Carry him to the guildhall steps and wait with him until someone comes.',
        told: 'carried him to the guildhall steps and waited with him until someone came.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 2 },
          lineage: { celestial: 1 },
          background: { craftsman: 2, military: 1 },
        },
      },
      {
        id: 'seal',
        label: 'Send word to the magistrate under your family’s seal, so it is taken seriously.',
        told: 'sent word to the magistrate under your family’s seal, so that it would be taken seriously.',
        gives: {
          attribute: { mind: 1 },
          background: { aristocrat: 3 },
          skill: { charismatic: 1, mastermind: 1 },
        },
      },
    ],
  },

  /* ================================================================= road */
  {
    id: 'road-ambush',
    stage: 'road',
    asks: 'Three of them step out of the fog with knives. They want the purse. What do you do?',
    recall: 'When three knives came out of the fog, you',
    options: [
      {
        id: 'purse',
        label: 'Give them the purse. It is lighter than a funeral, and you will find them later.',
        told: 'handed over the purse. It was lighter than a funeral, and you would find them later.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'roar',
        label: 'Roar and go through the middle one. The other two will run.',
        told: 'roared and went through the middle one, and the other two ran.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 3 },
          lineage: { draconic: 2 },
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
          lineage: { stonebound: 2 },
          weapon: { 'melee-light-shield': 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'word',
        label: 'Speak the word you learned and let the light do the rest.',
        told: 'spoke the word you had learned and let the light do the rest.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 2 },
          lineage: { celestial: 1 },
          skill: { 'unseen-spellwork': 1 },
          weapon: { 'lightning-wand': 1 },
        },
      },
    ],
  },

  {
    id: 'road-duel',
    stage: 'road',
    asks: 'A stranger insults you in a taproom, loudly, and the room goes quiet. What do you do?',
    recall: 'Insulted in a quiet taproom, you',
    options: [
      {
        id: 'fist',
        label: 'Answer with a fist before the sentence is finished.',
        told: 'answered with a fist before the sentence was finished.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 2, brawler: 1 },
          background: { mercenary: 2 },
          weapon: { 'melee-light': 1 },
        },
      },
      {
        id: 'outside',
        label: 'Invite them outside. Formally, with witnesses.',
        told: 'invited them outside. Formally, with witnesses.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 3 },
          background: { aristocrat: 1 },
          weapon: { 'finesse-weapon': 1 },
        },
      },
      {
        id: 'drink',
        label: 'Laugh, buy them a drink and find out who sent them.',
        told: 'laughed, bought them a drink and found out who had sent them.',
        gives: {
          attribute: { mind: 1 },
          background: { investigator: 1, entertainer: 1 },
          skill: { charismatic: 1, inquisitor: 1 },
        },
      },
      {
        id: 'cup',
        label: 'Make sure something unfortunate happens to their drink.',
        told: 'made sure something unfortunate happened to their drink.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 2 },
          lineage: { fey: 1 },
          skill: { apothecary: 1, cunning: 1 },
        },
      },
    ],
  },

  {
    id: 'road-river',
    stage: 'road',
    asks: 'The path ends at a river too wide to jump and too fast to swim. What do you do?',
    recall: 'At a river too wide to jump, you',
    options: [
      {
        id: 'swim',
        label: 'Swim it anyway.',
        told: 'swam it anyway.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1 },
          lineage: { tidebound: 3 },
          skill: { seafarer: 1 },
        },
      },
      {
        id: 'tree',
        label: 'Fell a tree and make a bridge of it.',
        told: 'felled a tree and made a bridge of it.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 2 },
          lineage: { stonebound: 1 },
          skill: { survivalist: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'ford',
        label: 'Read the water for the ford, and find it a mile upstream.',
        told: 'read the water for the ford and found it a mile upstream.',
        gives: {
          attribute: { instinct: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 2 },
          skill: { cartographer: 1, survivalist: 1 },
        },
      },
      {
        id: 'spell',
        label: 'Freeze it, burn it or part it. There is a spell for this.',
        told: 'froze it, burned it or parted it. There is a spell for this.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 2 },
          skill: { 'innate-spell-novice': 1 },
          weapon: { 'frost-wand': 1 },
        },
      },
    ],
  },

  {
    id: 'road-oath',
    stage: 'road',
    asks: 'A magistrate asks you, under oath, where you were last night. You were somewhere you should not have been. What do you do?',
    recall: 'Asked under oath where you had been, you',
    options: [
      {
        id: 'lie',
        label: 'Lie, beautifully. It is a gift.',
        told: 'lied, beautifully. It is a gift.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 2 },
          lineage: { fey: 1 },
          background: { entertainer: 1, criminal: 1 },
          skill: { cunning: 1, charismatic: 1 },
        },
      },
      {
        id: 'truth',
        label: 'Tell the truth, and let them do what they will.',
        told: 'told the truth and let them do what they would.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1 },
          lineage: { celestial: 1 },
          background: { military: 1 },
        },
      },
      {
        id: 'deflect',
        label: 'Answer a different question and make them think it was theirs.',
        told: 'answered a different question and made them think it was theirs.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1 },
          lineage: { infernal: 1 },
          background: { aristocrat: 1, investigator: 1 },
          skill: { mastermind: 1, empath: 1 },
        },
      },
      {
        id: 'nothing',
        label: 'Say nothing. Stand there until they tire of you.',
        told: 'said nothing, and stood there until they tired of you.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 1 },
          lineage: { stonebound: 2, undead: 2 },
          background: { mercenary: 1 },
        },
      },
    ],
  },

  {
    id: 'road-market',
    stage: 'road',
    asks: 'A market stall has the one thing you need, at three times what it is worth. What do you do?',
    recall: 'Faced with a price three times too high, you',
    options: [
      {
        id: 'haggle',
        label: 'Haggle until the stallholder is tired of hearing your voice.',
        told: 'haggled until the stallholder was tired of hearing your voice.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 2 },
          skill: { haggler: 2 },
        },
      },
      {
        id: 'take',
        label: 'Take it when the stallholder looks away.',
        told: 'took it when the stallholder looked away.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 2 },
          background: { criminal: 2 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'make',
        label: 'Make one yourself. It cannot be that hard.',
        told: 'made one yourself. It could not be that hard.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 3, alchemist: 1 },
          background: { craftsman: 2 },
          skill: { skilled: 1 },
        },
      },
      {
        id: 'without',
        label: 'Do without. You have done without before.',
        told: 'did without. You have done without before.',
        gives: {
          attribute: { physique: 1 },
          lineage: { stalwart: 1, undead: 1 },
          background: { outlander: 1 },
          skill: { frugal: 1, scavenger: 1 },
        },
      },
    ],
  },

  {
    id: 'road-wand',
    stage: 'road',
    asks: 'A wand lies in the mud where a mage fell. It is still warm. What do you do?',
    recall: 'Finding a dead mage’s wand in the mud, you',
    options: [
      {
        id: 'learn',
        label: 'Take it. Learn it. Something taught you how to listen to these.',
        told: 'took it and learned it. Something had taught you how to listen to these.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 2 },
          lineage: { celestial: 1 },
          skill: { 'innate-spell-novice': 1 },
          weapon: { 'fire-wand': 1, 'lightning-wand': 1 },
        },
      },
      {
        id: 'apart',
        label: 'Take it apart to see how it was made.',
        told: 'took it apart to see how it was made.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 3 },
          background: { craftsman: 1 },
          skill: { skilled: 1, 'arcane-marshal': 1 },
        },
      },
      {
        id: 'sell',
        label: 'Sell it. Somebody will pay a great deal.',
        told: 'sold it. Somebody paid a great deal.',
        gives: {
          attribute: { instinct: 1 },
          background: { merchant: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
      {
        id: 'snap',
        label: 'Snap it. Nothing good follows a dead mage’s things, and you trust your own hands.',
        told: 'snapped it. Nothing good follows a dead mage’s things, and you trust your own hands.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1 },
          lineage: { stalwart: 1 },
          skill: { 'spell-eater': 1 },
        },
      },
    ],
  },

  {
    id: 'road-wall',
    stage: 'road',
    asks: 'The town wall is between you and where you must be, and the gate is shut for the night. What do you do?',
    recall: 'With the gate shut for the night, you',
    options: [
      {
        id: 'climb',
        label: 'Climb it. Walls are for other people.',
        told: 'climbed the wall. Walls are for other people.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1 },
          lineage: { skybound: 2, fey: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'knock',
        label: 'Knock, loudly, until someone opens it to make you stop.',
        told: 'knocked, loudly, until someone opened it to make you stop.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, berserker: 1 },
          background: { military: 1 },
        },
      },
      {
        id: 'bribe',
        label: 'Bribe the watch. It is what the watch is for.',
        told: 'bribed the watch. It is what the watch is for.',
        gives: {
          attribute: { mind: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, criminal: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
      {
        id: 'hedge',
        label: 'Wait for dawn under a hedge. You have slept in worse.',
        told: 'slept under a hedge until dawn. You have slept in worse.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'feral-curse': 1, mycomancer: 2 },
          background: { outlander: 2 },
          skill: { survivalist: 1, frugal: 1 },
        },
      },
    ],
  },

  {
    id: 'road-purse',
    stage: 'road',
    asks: 'You find a purse of gold that is plainly not yours. Nobody saw. What do you do?',
    recall: 'Finding a purse of gold that was not yours, you',
    options: [
      {
        id: 'keep',
        label: 'Keep it. Nobody saw.',
        told: 'kept it. Nobody saw.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1 },
          lineage: { fey: 1 },
          background: { criminal: 2 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'owner',
        label: 'Find the owner. It will take all day and you will do it anyway.',
        told: 'found the owner. It took all day and you did it anyway.',
        gives: {
          attribute: { mind: 1 },
          lineage: { celestial: 2 },
          background: { investigator: 1 },
          skill: { helpful: 1, inquisitor: 1 },
        },
      },
      {
        id: 'split',
        label: 'Split it with whoever is with you. Shares keep friends.',
        told: 'split it with whoever was with you. Shares keep friends.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1 },
          background: { mercenary: 1, entertainer: 1 },
          skill: { charismatic: 1 },
        },
      },
      {
        id: 'bait',
        label: 'Leave it where it lies. Gold like that is bait.',
        told: 'left it where it lay. Gold like that is bait.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1 },
          lineage: { stonebound: 1 },
          skill: { vigilant: 1 },
        },
      },
    ],
  },

  {
    id: 'road-fever',
    stage: 'road',
    asks: 'The village has a fever, and the road out is closed until it passes. What do you do?',
    recall: 'Shut in a village with a fever, you',
    options: [
      {
        id: 'brew',
        label: 'Brew what they need from what grows here.',
        told: 'brewed what they needed from what grew there.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 3, mycomancer: 2 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'nurse',
        label: 'Nurse them. Sleep can wait.',
        told: 'nursed them. Sleep could wait.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1 },
          lineage: { celestial: 2 },
          skill: { healer: 2, physician: 1 },
        },
      },
      {
        id: 'water',
        label: 'Find where the water went bad.',
        told: 'found where the water had gone bad.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1, arcanist: 1 },
          lineage: { luminary: 1 },
          background: { investigator: 1 },
          skill: { scholar: 1, physician: 1 },
        },
      },
      {
        id: 'line',
        label: 'Hold the quarantine line. Nobody goes out, nobody comes in.',
        told: 'held the quarantine line. Nobody out, nobody in.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 2 },
          background: { military: 1 },
          skill: { vigilant: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
    ],
  },

  {
    id: 'road-camp',
    stage: 'road',
    asks: 'Night on the road, the fire needs tending and the others are asleep. What do you do with the hours?',
    recall: 'On the road, with the others asleep, you spent the night hours',
    options: [
      {
        id: 'sharpen',
        label: 'Sharpen, oil and check every buckle twice.',
        told: 'sharpening, oiling and checking every buckle twice.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1 },
          background: { military: 1, mercenary: 1 },
          skill: { vigilant: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'perimeter',
        label: 'Walk the perimeter. Something is always out there.',
        told: 'walking the perimeter. Something is always out there.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 3, duelist: 1 },
          lineage: { wildkin: 1, wildheart: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'read',
        label: 'Read by the fire until the light gives out.',
        told: 'reading by the fire until the light gave out.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 2 },
          skill: { scholar: 1 },
        },
      },
      {
        id: 'creature',
        label: 'Sit with the creature that travels with you, and say nothing.',
        told: 'sitting with the creature that travels with you, saying nothing.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'draconic-bond': 3 },
          lineage: { wildkin: 1 },
        },
      },
    ],
  },

  {
    id: 'road-bridge',
    stage: 'road',
    asks: 'A bridge with a toll. The man the size of a door collecting it has decided you owe double. What do you do?',
    recall: 'At the bridge where the toll had doubled, you',
    options: [
      {
        id: 'pay',
        label: 'Pay double, smile and be across before he can think of triple.',
        told: 'paid double, smiled and were across before he could think of triple.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 1, aristocrat: 2 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'lift',
        label: 'Pick him up and set him down on the other side of the road.',
        told: 'picked him up and set him down on the other side of the road.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 3, brawler: 1 },
        },
      },
      {
        id: 'wade',
        label: 'Wade the river under the bridge while he is still explaining the arithmetic.',
        told: 'waded the river under the bridge while he was still explaining the arithmetic.',
        gives: {
          attribute: { instinct: 1 },
          lineage: { tidebound: 2 },
          skill: { cunning: 1, survivalist: 1 },
        },
      },
      {
        id: 'flask',
        label: 'Offer him a drink from your flask. He will not remember you passing.',
        told: 'offered him a drink from your flask. He did not remember you passing.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 3 },
          lineage: { fey: 1 },
          skill: { apothecary: 1 },
        },
      },
    ],
  },

  {
    id: 'road-child',
    stage: 'road',
    asks: 'A lost child is crying in the market crowd. A man is walking towards it too quickly. What do you do?',
    recall: 'Seeing a man close on a lost child in the market, you',
    options: [
      {
        id: 'between',
        label: 'Get between them. Whatever he wants, he can want it through you.',
        told: 'got between them. Whatever he wanted, he could want it through you.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 3 },
          lineage: { celestial: 1 },
          background: { military: 1 },
        },
      },
      {
        id: 'wrist',
        label: 'Take the man’s wrist as he reaches, and look at him until he leaves.',
        told: 'took the man’s wrist as he reached, and looked at him until he left.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 2, 'feral-curse': 1 },
          lineage: { wildkin: 1 },
          background: { mercenary: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'call',
        label: 'Call the child’s description across the whole market in a voice that carries. Crowds find mothers.',
        told: 'called the child’s description across the whole market in a voice that carried. Crowds find mothers.',
        gives: {
          attribute: { mind: 1 },
          lineage: { celestial: 1 },
          background: { entertainer: 2, aristocrat: 1 },
          skill: { charismatic: 1, helpful: 1 },
        },
      },
      {
        id: 'watch',
        label: 'Watch the man. He is not the father, and you want to know where he goes.',
        told: 'watched the man. He was not the father, and you wanted to know where he went.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          background: { investigator: 2 },
          skill: { inquisitor: 1, cunning: 1 },
        },
      },
    ],
  },

  {
    id: 'road-storm',
    stage: 'road',
    asks: 'The storm has taken the roof off the inn, and the family is out in it with a baby. What do you do?',
    recall: 'When the storm took the roof off the inn, you',
    options: [
      {
        id: 'beam',
        label: 'Hold the beam up while they get the thatch back over it. All night, if it takes all night.',
        told: 'held the beam up while they got the thatch back over it. All night, since it took all night.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 2, guardian: 1 },
          lineage: { stonebound: 2 },
          background: { craftsman: 1 },
        },
      },
      {
        id: 'baby',
        label: 'Put the baby inside your coat and walk into the wind for the next farm. You know the way in the dark.',
        told: 'put the baby inside your coat and walked into the wind for the next farm. You knew the way in the dark.',
        gives: {
          attribute: { instinct: 1 },
          lineage: { skybound: 3 },
          background: { outlander: 1 },
          skill: { survivalist: 1, cartographer: 1 },
        },
      },
      {
        id: 'fire',
        label: 'Get a fire going in the cellar from wet wood and nothing, and warm them.',
        told: 'got a fire going in the cellar from wet wood and nothing, and warmed them.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 2 },
          lineage: { scorchbound: 1 },
          background: { craftsman: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'speak',
        label: 'Stand in the rain and speak to the storm. It listens, a little.',
        told: 'stood in the rain and spoke to the storm, and it listened, a little.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, pactbound: 1 },
          lineage: { skybound: 1, celestial: 1 },
          skill: { 'innate-spell-novice': 1 },
        },
      },
    ],
  },

  {
    id: 'road-reputation',
    stage: 'road',
    requires: ['did:violence'],
    asks: 'The man you put down years ago is in the taproom doorway with four friends, and he has recognised you. What do you do?',
    recall: 'When the man you once put down found you with four friends, you',
    options: [
      {
        id: 'again',
        label: 'Do it again, and this time make sure of it.',
        told: 'did it again, and this time made sure of it.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 2, brawler: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'table',
        label: 'Put the table between him and the room, so that whatever happens, happens to you.',
        told: 'put the table between him and the room, so that whatever happened, happened to you.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 2 },
          background: { military: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'window',
        label: 'Be out of the window before he has finished pointing.',
        told: 'were out of the window before he had finished pointing.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 2 },
          lineage: { fey: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'drink',
        label: 'Buy all five of them a drink and ask after his mother, whose name you remember.',
        told: 'bought all five of them a drink and asked after his mother, whose name you remembered.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 1, entertainer: 2 },
          skill: { charismatic: 1, empath: 1 },
        },
      },
    ],
  },

  /* ============================================================== leaving */
  {
    id: 'leaving-night',
    stage: 'leaving',
    asks: 'The night you leave the life you had, the house is burning behind you. What do you do?',
    recall: 'The night you left, with the house burning behind you, you',
    options: [
      {
        id: 'back',
        label: 'Go back in for the one who is still inside.',
        told: 'went back in for the one who was still inside.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 3 },
          lineage: { scorchbound: 1, celestial: 1 },
          background: { military: 1 },
        },
      },
      {
        id: 'lit',
        label: 'Keep walking. You lit it.',
        told: 'kept walking. You lit it.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1, pactbound: 1 },
          lineage: { infernal: 2 },
        },
      },
      {
        id: 'watch',
        label: 'Stand and watch until the roof falls, then go. You needed to see it end.',
        told: 'stood and watched until the roof fell, then went. You needed to see it end.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 2 },
          lineage: { draconic: 1, undead: 2 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'run',
        label: 'Run, with the hound at your heel. Do not look back.',
        told: 'ran with the hound at your heel and did not look back.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'draconic-bond': 2, 'feral-curse': 2 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-carry',
    stage: 'leaving',
    asks: 'You can carry one thing out of the life you are leaving, and the cart is already moving. What do you take?',
    recall: 'Out of the life you left, you carried',
    options: [
      {
        id: 'great',
        label: 'The weapon that is too big for the doorway.',
        told: 'the weapon that was too big for the doorway.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 3 },
          weapon: { 'melee-great': 1, 'long-bow': 1 },
        },
      },
      {
        id: 'blades',
        label: 'The blade, and the second blade.',
        told: 'the blade, and the second blade.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 3 },
          skill: { 'quick-draw': 1 },
          weapon: { 'paired-finesse': 1, 'finesse-weapon': 1 },
        },
      },
      {
        id: 'book',
        label: 'The book you were never supposed to have.',
        told: 'the book you were never supposed to have.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 2, enchanter: 1 },
          background: { erudit: 2 },
          skill: { occultist: 1 },
          weapon: { 'psychic-tome': 1, 'sacred-tome': 1 },
        },
      },
      {
        id: 'shield',
        label: 'The shield with a name on it that is not yours yet.',
        told: 'the shield with a name on it that was not yours yet.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 3 },
          weapon: { 'melee-light-shield': 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-pack',
    stage: 'leaving',
    asks: 'There is room in the pack for one more thing, and someone is calling your name from the road. What goes in?',
    recall: 'Into the pack, with someone calling from the road, went',
    options: [
      {
        id: 'cauldron',
        label: 'The cauldron, the herbs and the jar of something that moves.',
        told: 'the cauldron, the herbs and the jar of something that moved.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 3 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'pistol',
        label: 'The pistol, the lantern and the list of names.',
        told: 'the pistol, the lantern and the list of names.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, sharpshooter: 1 },
          background: { investigator: 1, mercenary: 1 },
          skill: { vigilant: 1 },
          weapon: { 'flintlock-pistol': 1 },
        },
      },
      {
        id: 'contract',
        label: 'The contract, signed in something that was not ink.',
        told: 'the contract, signed in something that was not ink.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 3 },
          lineage: { infernal: 1 },
        },
      },
      {
        id: 'nothing',
        label: 'Nothing. Your hands, and the anger, are enough.',
        told: 'nothing at all. Your hands and the anger were enough.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 3 },
          lineage: { draconic: 1 },
          weapon: { 'melee-light': 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-fight',
    stage: 'leaving',
    asks: 'The first real fight after you leave: an alley, two men and no way round. How does it end?',
    recall: 'Your first real fight on the road ended',
    options: [
      {
        id: 'wall',
        label: 'With your back to the wall and neither of them past you.',
        told: 'with your back to the wall and neither of them past you.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 3 },
          weapon: { 'melee-light-shield': 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'over',
        label: 'With you standing over them and no memory of the middle.',
        told: 'with you standing over them and no memory of the middle.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 3 },
          lineage: { draconic: 2 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'behind',
        label: 'Before it starts. You were behind them, and then it was over.',
        told: 'before it started. You were behind them, and then it was over.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 3 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'fire',
        label: 'With the alley on fire and you not having touched anyone.',
        told: 'with the alley on fire and you not having touched anyone.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 3 },
          lineage: { scorchbound: 1 },
          weapon: { 'fire-wand': 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-road',
    stage: 'leaving',
    asks: 'The road forks at the milestone: the city, the wild, the sea and the mountain pass. Nobody is waiting for you on any of them. Which do you take?',
    recall: 'At the milestone where the road forked, you took',
    options: [
      {
        id: 'wild',
        label: 'The wild. The trees already know your name.',
        told: 'the wild. The trees already knew your name.',
        gives: {
          attribute: { instinct: 1 },
          talent: { mycomancer: 3, 'feral-curse': 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 2 },
        },
      },
      {
        id: 'city',
        label: 'The city. There is work there for someone who can make things.',
        told: 'the city. There was work there for someone who could make things.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 3, alchemist: 1 },
          background: { craftsman: 1, merchant: 1 },
        },
      },
      {
        id: 'pass',
        label: 'The pass. Whatever is up there, you can carry it.',
        told: 'the pass. Whatever was up there, you could carry it.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 1, guardian: 1 },
          lineage: { stonebound: 2 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'sea',
        label: 'The sea. You have never once been afraid of deep water.',
        told: 'the sea. You have never once been afraid of deep water.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1 },
          lineage: { tidebound: 3 },
          background: { merchant: 1, outlander: 1 },
          skill: { seafarer: 1 },
        },
      },
    ],
  },
];
