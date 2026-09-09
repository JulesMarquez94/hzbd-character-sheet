/**
 * The Crossroads: the situations a life is made of.
 *
 * The fourth way to make a character puts you in a moment, tells you where you
 * are standing and what you can see, and asks what you do. Then it offers you
 * four ways of doing it, each a concrete means: the picks in your pocket, the
 * vial on your belt, the word you know, the strength in your arms. Every answer
 * puts points on the things a level-1 character is made of, and at the end the
 * points are counted and the drifter is waiting. See crossroads.js for the
 * counting; this file is only the questions.
 *
 * ------------------------------------------------------------------ provenance
 * **House-written on 2026-09-08, and rewritten twice the same day.** There is
 * no design sheet behind this pool. Jules gave the shape in chat and three
 * scenes as examples, the last of them in full:
 *
 *   "You are standing in front of a locked gate. You can see that on the other
 *    side is the treasure chest. How do you proceed to open the lock? a, use
 *    your lockpicks to pick the lock; b, use a vial of acid which you pour on
 *    the bars and then pass through; c, cast the powerful spell that allows
 *    your hand to melt metals; d, use your strength to pull away the grid and
 *    step in."
 *
 * The first draft asked about the life directly ("where were you born, what
 * runs in the blood") and offered up to twelve answers. The second asked scenes
 * in a line and answered them in a line. Both were thrown out: "the question is
 * to be situation", "you are exposing a scenario", never more than four
 * answers, each of them a way of acting that "explains to the players, which is
 * your character in this situation, what do you do", and no answer that reads
 * like a menu of what your blood is. Everything here is drafted to those rules
 * and every number under it is the designer's to overrule, cut or rewrite.
 *
 * ------------------------------------------------------------------- the laws
 * Four, and scripts/check-crossroads.mjs holds every question and option to them.
 *
 * **A question exposes a scene, then asks.** `scene` is two to four sentences
 * that put you there: where you stand, what you can see, what is at stake, who
 * else is present. `asks` is the question that closes it. The stages are the
 * chapters of a life, childhood to the night you left, but nothing in them is a
 * form and nothing asks about the life in the abstract.
 *
 * **Four answers at most.**
 *
 * **An answer is a way of acting.** It names the means and what happens when
 * you use it: not "pick the lock" but the picks, the quarter of an hour, the
 * turn. A reader should be able to see the character doing it.
 *
 * **An answer leans one way.** Every option gives exactly one attribute, and
 * everything else it gives is built on that attribute: a talent set is either
 * shelved on it or on no attribute at all (the Draconic Bond, the Pact), a
 * Stalwart, Wildheart or Luminary point only rides an answer in its own
 * attribute, a weapon scales on it and an armor set is the one that suits it.
 * Tearing the gate out of the stone is Physique and the Berserker and the
 * Colossus and a heavy blade, all at once, and nothing else. That is what makes
 * the count add up to somebody: a player who answers like a brawler ends up a
 * brawler, and never a Mind 6 holding a Guardian's shield.
 *
 * Backgrounds and skills are free of the last law, since a Criminal may be
 * built on any attribute. The other ten lineages are free of it too, and are
 * placed by hand where the way of acting fits the blood: diving into a flood
 * and not feeling the cold is Tidebound, pulling a bar from the coals
 * bare-handed is Scorchbound, meeting a wolf's eyes and holding them is Wildkin.
 * None of them says so.
 *
 * -------------------------------------------------------------------- the shape
 *   id        stable; a run's answers are stored against it
 *   stage     which chapter of the life it belongs to
 *   scene     the situation, two to four sentences, printed as a paragraph
 *   asks      the question that closes it, printed as the heading
 *   recall    how the backstory begins this sentence. `recall` + the option's
 *             `told` is one sentence of the lore page's backstory
 *   requires  optional. Tags an earlier answer must have set, any one of them.
 *             This is how a scene only happens because of what you did before:
 *             the watch comes for a thief, the academy writes to somebody who
 *             spoke a word they did not know, the man you put down comes back
 *   options   the ways of acting, in the order they are offered. Four at most
 *
 * An option:
 *
 *   id        stable within its question
 *   label     the way of acting, as the player reads it
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
 * The reader is `you`, and the scene is told to the character rather than to the
 * player. An answer is what you do and how, and it never names a rule, a set or
 * a number: "roar, drag your blade out and go straight through the man in the
 * middle" is a Berserker's answer without saying so, which is the whole point of
 * asking it this way. docs/text-style.md applies to every word here.
 */

/* ------------------------------------------------------------------ the stages */

export const STAGES = [
  { id: 'childhood', title: 'Childhood', draw: 1 },
  { id: 'home', title: 'Home', draw: 1 },
  { id: 'blood', title: 'Blood', draw: 1 },
  { id: 'youth', title: 'Youth', draw: 1 },
  { id: 'trade', title: 'Trade', draw: 1 },
  { id: 'road', title: 'The Road', draw: 2 },
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
  /* ============================================================== childhood */
  {
    id: 'child-dog',
    stage: 'childhood',
    scene:
      'You are six years old, and the mill yard is empty except for the older children. They have a stray dog cornered against the wall, all ribs and fear, and the biggest of them has picked up a stone. He is looking at you to see what you will do.',
    asks: 'What do you do?',
    recall: 'At six, with a dog cornered behind the mill, you',
    options: [
      {
        id: 'stand',
        label: 'Walk across the yard and put yourself between the dog and the stone. If he throws it, he throws it at you.',
        told: 'walked across the yard and put yourself between the dog and the stone.',
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
        label: 'Crouch, hold out a hand and whistle low. Dogs have always come to you, and this one comes.',
        told: 'crouched, held out a hand and whistled low, and the dog came to you.',
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
        label: 'Tell them, loudly and in detail, about the boy two valleys over who stoned a dog and what came for him that night. You make most of it up as you go.',
        told: 'told them, loudly and in detail, about the boy who stoned a dog and what came for him that night, and made most of it up.',
        gives: {
          attribute: { mind: 1 },
          lineage: { infernal: 1 },
          background: { entertainer: 2 },
          skill: { troubadour: 1, charismatic: 1 },
        },
      },
      {
        id: 'stone',
        label: 'Pick up a stone of your own and throw it, hard, at the boy holding his.',
        told: 'picked up a stone of your own and threw it, hard, at the boy holding his.',
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
    scene:
      'The barn is burning. Smoke is pouring from under the eaves, the calf is bawling inside and every grown-up on the farm is at the well, fifty yards away, filling buckets. You are the only one near the door.',
    asks: 'What do you do?',
    recall: 'When the barn burned, you',
    options: [
      {
        id: 'in',
        label: 'Pull your shirt up over your mouth and go in low under the smoke. You have the calf by the neck and out before the roof beam catches.',
        told: 'pulled your shirt over your mouth, went in low under the smoke and dragged the calf out by the neck.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, berserker: 1 },
          lineage: { scorchbound: 2 },
          background: { military: 1 },
        },
      },
      {
        id: 'back',
        label: 'Run round to the back wall where the boards are rotten, kick two of them loose and coax the calf out through the gap with your voice.',
        told: 'ran round to the back wall, kicked two rotten boards loose and coaxed the calf out through the gap.',
        gives: {
          attribute: { instinct: 1 },
          lineage: { wildkin: 1 },
          background: { craftsman: 1 },
          skill: { survivalist: 1, cunning: 1 },
        },
      },
      {
        id: 'well',
        label: 'Run to the well and take charge of the buckets. Two people filling and two carrying put more water on a fire than six people running about.',
        told: 'ran to the well and took charge of the buckets, two filling and two carrying.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          background: { military: 1, aristocrat: 1 },
          skill: { mastermind: 1, helpful: 1 },
        },
      },
      {
        id: 'roof',
        label: 'Stand back and watch how the fire moves through the timbers. You see that the roof will fall within the minute, and you shout for everyone to get clear before it does.',
        told: 'watched how the fire moved through the timbers, saw the roof was about to fall and shouted everyone clear before it did.',
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
    scene:
      'You are eight, at the autumn market, with a single copper in your fist. The thing you want, a knife with a bone handle, costs three. The stallholder has turned to serve a farmer, and his back is to you.',
    asks: 'What do you do?',
    recall: 'At eight, with a coin that was not enough, you',
    options: [
      {
        id: 'take',
        label: 'Slide the knife off the board and into your sleeve while his back is turned, then walk away at an ordinary pace. Running is what gets you caught.',
        told: 'slid the knife into your sleeve while his back was turned and walked away at an ordinary pace.',
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
        label: 'Wait for him to turn round, put your copper on the board and offer him the other two by the winter fair, on your word. You mean it, and he can see that you mean it.',
        told: 'put your copper on the board and offered the rest by the winter fair, on your word.',
        gives: {
          attribute: { mind: 1 },
          lineage: { celestial: 1 },
          background: { merchant: 2, aristocrat: 2 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'crates',
        label: 'Offer to carry his crates and stack his stall until the market closes, and take the knife as your wage. It is a long day, and the crates are heavy.',
        told: 'carried his crates and stacked his stall until the market closed, and took the knife as your wage.',
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
        label: 'Put the copper back in your pocket and look hard at how the knife is made: the rivets, the grind of the edge, the fit of the bone. You will make one yourself at the forge at home, and it will be better.',
        told: 'looked hard at how the knife was made and went home to make a better one at the forge.',
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
    scene:
      'The cellar door has swung shut behind you and the latch has dropped. Your candle went out in the draught. It is completely dark, the stairs are somewhere behind you and nobody in the house heard the door.',
    asks: 'What do you do?',
    recall: 'Shut in the dark cellar, you',
    options: [
      {
        id: 'shoulder',
        label: 'Find the door by feel, set your shoulder against it and drive at it, again and again, until the latch tears out of the wood.',
        told: 'found the door by feel and shouldered it, again and again, until the latch tore out of the wood.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, colossus: 1 },
          lineage: { stalwart: 1 },
        },
      },
      {
        id: 'listen',
        label: 'Sit down on the step, stay perfectly still and let your eyes and ears learn the dark. In a while you can make out the shelves, the barrels and the grey line of light under the door.',
        told: 'sat still on the step until your eyes and ears had learned the dark.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 2, trickster: 1 },
          lineage: { wildkin: 1, wildheart: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'walls',
        label: 'Work your way along the wall with your hands, counting the shelves, the jars and the courses of stone, until you have the whole room mapped in your head and can walk it blind.',
        told: 'worked your way along the walls by hand until you had the whole room mapped and could walk it blind.',
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
        label: 'Speak into the dark to whatever you can feel is down there with you. Ask it to show you the door. Something answers.',
        told: 'spoke into the dark to whatever was down there with you, and something answered.',
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

  /* =================================================================== home */
  {
    id: 'home-debt',
    stage: 'home',
    scene:
      'You are twelve. A man in a good coat is at the door asking for your father, who owes him money and who is three villages away until tomorrow. Your mother is at the market. The man has not moved off the step, and does not look as if he intends to.',
    asks: 'What do you do?',
    recall: 'When the debt collector came and your father was out, you',
    options: [
      {
        id: 'doorway',
        label: 'Fill the doorway as best you can, tell him there is no man in the house to speak to and that he can come back when there is. Then stand there until he goes.',
        told: 'filled the doorway, told him to come back when there was a man in the house and stood there until he went.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 2 },
          background: { military: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'talk',
        label: 'Invite him in, pour him the last of the cider and talk to him about the harvest, the roads and the price of grain until, without quite noticing, he has agreed to take half the debt at midwinter.',
        told: 'invited him in, poured him the last of the cider and talked him down to half the debt at midwinter.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 2, aristocrat: 1 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'follow',
        label: 'Tell him your father is out and shut the door. Then go out the back and follow him through the village at a distance, to see where he lives and where he keeps his ledger.',
        told: 'shut the door on him, went out the back and followed him home to see where he kept his ledger.',
        gives: {
          attribute: { instinct: 1 },
          background: { criminal: 2, investigator: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'ask',
        label: 'Ask him, politely, what the debt is really for. A man in a coat like that is not sent for a farmer’s few coins, and you watch his face while he answers.',
        told: 'asked him what the debt was really for, and watched his face while he answered.',
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
    scene:
      'Your sister has had a fever for three days. The village healer has tried her poultices and shaken her head, and the nearest physician is in the market town, two days’ walk each way. Your sister is getting worse by the hour.',
    asks: 'What do you do?',
    recall: 'When your sister’s fever would not break, you',
    options: [
      {
        id: 'go',
        label: 'Fill a waterskin, take your father’s boots and go for the physician. You run the first day and walk the second, and you bring him back in three.',
        told: 'took your father’s boots and went for the physician, running the first day and walking the second.',
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
        label: 'Go down to the stream and gather the willow bark, the feverfew and the moss your grandmother used, boil them the way she did and get the tea into your sister a spoon at a time.',
        told: 'gathered willow bark and feverfew by the stream, boiled them the way your grandmother did and spooned the tea into her.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 2, mycomancer: 2 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'read',
        label: 'Take the physician’s almanac down from the shelf and read every page on fevers by candlelight until you find hers, and the treatment written under it.',
        told: 'read the physician’s almanac by candlelight until you found her fever and its treatment.',
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
        label: 'Sit by her bed through the nights with her hand in yours and promise anything, to anyone who might be listening, if she lives. On the third night the fever breaks.',
        told: 'sat by her through the nights and promised anything to anyone listening, and on the third night the fever broke.',
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
    scene:
      'The harvest feast, the whole village at the long tables. Your uncle is drunk, and he has started, loudly, on the story about your mother that the family does not tell. Heads are turning. Your mother has gone white.',
    asks: 'What do you do?',
    recall: 'When your drunk uncle started the story nobody tells, you',
    options: [
      {
        id: 'back',
        label: 'Get up, walk round the table and put him on his back in the yard with one blow, before he reaches the end of the sentence.',
        told: 'walked round the table and put him on his back in the yard with one blow.',
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
        label: 'Stand up on the bench and start the harvest song at the top of your voice. The table joins in on the second line, and by the chorus nobody remembers what he was saying.',
        told: 'stood on the bench and started the harvest song, and by the chorus nobody remembered what he had been saying.',
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
        label: 'Let him finish. Then, when the table has moved on, sit down beside him and ask him quietly for the parts he left out.',
        told: 'let him finish, then sat beside him and asked quietly for the parts he had left out.',
        gives: {
          attribute: { mind: 1 },
          background: { investigator: 1, erudit: 1 },
          skill: { inquisitor: 1, empath: 1 },
        },
      },
      {
        id: 'cup',
        label: 'Refill his cup yourself, with a pinch of the valerian from your mother’s shelf stirred in. He is asleep with his head on the table inside a minute.',
        told: 'refilled his cup with a pinch of valerian stirred in, and he was asleep on the table inside a minute.',
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
    scene:
      'Your family is leaving the valley for good. The cart is loaded to the rails, your mother is counting the children, and your father says there is room for one more thing of yours, and only one. Everything else stays.',
    asks: 'What do you take?',
    recall: 'When the family left the valley, you took',
    options: [
      {
        id: 'hammer',
        label: 'Your father’s long-handled hammer from the forge. It is heavier than you are, and you carry it on your shoulder the whole way rather than give up the space in the cart.',
        told: 'your father’s long-handled hammer, heavier than you were. You carried it on your shoulder the whole way.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 2 },
          background: { craftsman: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'book',
        label: 'The book from the chest under the stairs, the one written in a hand that nobody in the house can read. You have looked at it every night for a year.',
        told: 'the book from under the stairs that nobody in the house could read.',
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
        label: 'The hound. It is not a thing and it does not fit, and you lift it into the cart anyway, and nobody quite manages to say no.',
        told: 'the hound, which was not a thing and did not fit, and nobody managed to say no.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'draconic-bond': 3, 'feral-curse': 1 },
          lineage: { wildkin: 1 },
        },
      },
      {
        id: 'nothing',
        label: 'Nothing. You walk beside the cart with your hands free and your eyes on the hedgerows, and you are the first to see the men waiting at the ford.',
        told: 'nothing, and walked beside the cart with your hands free and your eyes on the hedgerows.',
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

  /* ================================================================== blood */
  {
    id: 'blood-cliff',
    stage: 'blood',
    scene:
      'The path along the cliff is gone, washed out by a week of rain, and there is a thirty-foot face of wet rock between you and where it starts again. Below you is the sea. Behind you is a day’s walk back to the last village.',
    asks: 'How do you get across?',
    recall: 'With the cliff path gone, you',
    options: [
      {
        id: 'climb',
        label: 'Climb it. You go up the wet rock hand over hand, your fingers finding the holds before your eyes do. The drop under you never once enters your mind.',
        told: 'climbed the wet rock hand over hand, your fingers finding the holds before your eyes did.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1 },
          lineage: { skybound: 3, wildkin: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'stones',
        label: 'Go down to where the path fell and haul the stones back up, one at a time, until you have built enough of it again to walk across.',
        told: 'hauled the fallen stones back up one at a time and built the path again.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, guardian: 1 },
          lineage: { stonebound: 3 },
          background: { craftsman: 1 },
        },
      },
      {
        id: 'read',
        label: 'Sit down and study the face for an hour, reading the fault lines and the water stains, until you have worked out the one route that will hold and the three that look easier and will not.',
        told: 'studied the face for an hour and worked out the one route that would hold.',
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
        label: 'Step off the edge. You have never told anyone why you are so sure the wind will hold you, and it holds you.',
        told: 'stepped off the edge, and the wind held you, as you had always known it would.',
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
    scene:
      'The ferry is on the far bank and the river is in flood, brown and fast. A child has gone in off the landing stage and is already ten yards out, going under and coming up. The mother is screaming. Nobody else is moving.',
    asks: 'What do you do?',
    recall: 'When the child went into the flood, you',
    options: [
      {
        id: 'dive',
        label: 'Dive in after the child. The cold and the current never take hold of you the way they take hold of other people, and you have the child by the collar before the bend.',
        told: 'dived in, and the cold and the current never took hold of you, and you had the child before the bend.',
        gives: {
          attribute: { instinct: 1 },
          lineage: { tidebound: 3 },
          skill: { seafarer: 1 },
        },
      },
      {
        id: 'bank',
        label: 'Run the bank downstream faster than the water, wade in up to your chest where the river shallows over the gravel and catch the child as the current brings it to you.',
        told: 'ran the bank ahead of the current, waded in where it shallowed and caught the child as it came.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 2 },
          background: { military: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'rope',
        label: 'Grab the ferry rope off the post, loop it round your waist, throw the weighted end past the child and haul. Two people in the water is two people drowned.',
        told: 'looped the ferry rope round your waist, threw the weighted end past the child and hauled.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          background: { military: 1 },
          skill: { mastermind: 1, survivalist: 1 },
        },
      },
      {
        id: 'word',
        label: 'Stretch out your hand towards the water and speak a word you did not know you knew. The river slows around the child, just for a moment, and a moment is long enough.',
        told: 'spoke a word you did not know you knew, and the river slowed around the child for just long enough.',
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
    scene:
      'The smith has gone up to the house for his dinner and left the forge lit, a bar of iron glowing in the coals and the door standing open. You are alone with it, and nobody will be back for an hour.',
    asks: 'What do you do?',
    recall: 'Alone in the smith’s open forge, you',
    options: [
      {
        id: 'hammer',
        label: 'Take the bar out with the tongs, lay it on the anvil and pick up the hammer. Your arm falls into the rhythm before you have decided anything, and by the time he is back it is a blade.',
        told: 'took the bar to the anvil and picked up the hammer, and your arm fell into the rhythm before you had decided anything.',
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
        label: 'Reach into the coals and pull the bar out with your bare hand to look at it. It is a moment before you notice you are holding it, and another before you think to let go.',
        told: 'pulled the glowing bar out of the coals with your bare hand, and only noticed afterwards.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1 },
          lineage: { scorchbound: 3, draconic: 1, undead: 1 },
        },
      },
      {
        id: 'study',
        label: 'Touch nothing. Study the colour of the steel, the quench trough and the way the tools are laid out in order of use, until you understand how the whole thing works and how you would do it better.',
        told: 'touched nothing, and studied the steel, the quench and the tools until you understood the whole of it.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 3, alchemist: 1 },
          background: { craftsman: 2 },
          skill: { skilled: 1 },
        },
      },
      {
        id: 'chisel',
        label: 'Take the good chisel off the bench, the one with the ash handle, put it inside your coat and be out of the yard before his door opens.',
        told: 'took the good chisel off the bench and were out of the yard before his door opened.',
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
    scene:
      'Night, three days from the nearest town. The fire has burned low, and there are three pairs of eyes at the edge of the light, low to the ground and moving. The horses have smelled them and are screaming on the picket line.',
    asks: 'What do you do?',
    recall: 'With wolves at the edge of the firelight, you',
    options: [
      {
        id: 'roar',
        label: 'Snatch a burning brand out of the fire, stand up to your full height and roar at them. Something in your voice makes the lead wolf flatten its ears and think again.',
        told: 'snatched a brand from the fire, stood to your full height and roared, and something in your voice made the lead wolf think again.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 2 },
          lineage: { draconic: 3 },
          background: { military: 1 },
        },
      },
      {
        id: 'eyes',
        label: 'Walk out to the edge of the light, crouch and meet the lead wolf’s eyes, and hold them. It knows you, or it knows what you are, and after a long moment it turns away.',
        told: 'walked to the edge of the light and held the lead wolf’s eyes until it turned away.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 3, 'draconic-bond': 1 },
          lineage: { wildkin: 2 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'shield',
        label: 'Take the shield off the cart, put your back to the horses and stand between them and the dark, and let the wolves come to you if they are coming.',
        told: 'took the shield off the cart and stood between the horses and the dark.',
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
        label: 'Throw a pinch of the flash powder from your pouch into the fire. The white flare sends them running, and while they are running you are out in the dark gathering the herbs you were short of.',
        told: 'threw flash powder into the fire, and the flare sent them running.',
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
    scene:
      'You wake face down in a ditch, in the rain, with a wound in your side that should have finished you. Your purse is gone and so are your boots. You can hear the men who did it laughing a hundred yards up the road.',
    asks: 'What do you do?',
    recall: 'Waking in the ditch where they left you for dead, you',
    options: [
      {
        id: 'up',
        label: 'Get up. It hurts a great deal less than it should, and you walk the four miles to the next inn in your bare feet with your hand pressed to your side.',
        told: 'got up, and it hurt less than it should have, and you walked four miles to the inn in your bare feet.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1 },
          lineage: { undead: 3 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'still',
        label: 'Lie still in the mud until the laughing has moved off down the road. Then get up and follow them, at a distance, until you know where every one of them sleeps.',
        told: 'lay still until they had gone, then followed them at a distance until you knew where they slept.',
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
        label: 'Pack the wound with the moss from the ditch bank, tear your shirt into a bandage and bind it tight, then lie still and count your pulse until morning so that you know whether you are dying.',
        told: 'packed the wound with moss, bound it with your shirt and counted your pulse until morning.',
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
        label: 'Lie in the ditch and make a promise, out loud, to anything that will hear it: whatever it wants, in return for the morning. Something hears it.',
        told: 'made a promise, out loud, to anything that would hear it, and something did.',
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

  /* ================================================================== youth */
  {
    id: 'youth-duel',
    stage: 'youth',
    scene:
      'The miller’s son has called you out in front of the whole village, in the square, on market day. He is bigger than you and he has been waiting for this. Everyone has stopped to watch, and nobody is going to stop it.',
    asks: 'What do you do?',
    recall: 'Called out in front of everyone, you',
    options: [
      {
        id: 'first',
        label: 'Hit him now, before he has finished talking. Keep hitting him until he stays down.',
        told: 'hit him before he had finished talking and kept hitting him until he stayed down.',
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
        label: 'Name the hour, tomorrow at dawn, and the place, and tell him to bring a second. Then go home and spend the evening with a whetstone. It will be done properly.',
        told: 'named the hour and the place and told him to bring a second, and it was done properly.',
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
        label: 'Laugh, agree cheerfully with every word he has said about you and buy him a cup of cider from the stall. The crowd is laughing with you before he works out what has happened.',
        told: 'laughed, agreed with every word and bought him a cider, and the crowd was laughing with you before he understood.',
        gives: {
          attribute: { mind: 1 },
          background: { entertainer: 2, merchant: 1 },
          skill: { charismatic: 1, empath: 1 },
        },
      },
      {
        id: 'walk',
        label: 'Turn round and walk away, with the whole square watching. There will be a night when he is alone on the mill road, and you already know which one.',
        told: 'walked away with the whole square watching, and waited for a night when he was alone.',
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
    scene:
      'You are standing in front of a locked iron gate in a cellar corridor. Through the bars you can see the strongbox you came for, sitting on a table ten feet away. The gate is old, the lock is older, and nobody is coming down here before morning.',
    asks: 'How do you get through?',
    recall: 'Faced with a locked gate, you',
    options: [
      {
        id: 'shoulder',
        label: 'Take hold of the bars with both hands, set your feet against the wall and pull, again and again, until the grid comes out of the stone.',
        told: 'took hold of the bars and pulled until the grid came out of the stone.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, colossus: 1, brawler: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'pick',
        label: 'Take out your lockpicks and work the lock by feel. It is old and stiff and it takes a quarter of an hour, and then it turns.',
        told: 'worked the lock with your picks for a quarter of an hour, and then it turned.',
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
        id: 'acid',
        label: 'Take the vial of acid from your belt and pour it over the hinge pins, then wait with your sleeve over your face against the fumes until the metal is soft enough to lever the gate off.',
        told: 'poured the vial of acid over the hinge pins and levered the gate off when the metal had gone soft.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 2 },
          background: { craftsman: 1 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'spell',
        label: 'Speak the words that let your hand pass through iron as if it were water, reach through the lock plate and turn the bolt from the other side.',
        told: 'spoke the words that let your hand pass through iron and turned the bolt from the other side.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 2, enchanter: 1 },
          skill: { 'innate-spell-novice': 1 },
        },
      },
    ],
  },

  {
    id: 'youth-hurt',
    stage: 'youth',
    scene:
      'A man is lying in the gutter of the high street with a knife wound in his thigh, bleeding onto the cobbles, and the crowd is stepping round him. Whoever did it is gone. You are the only one who has stopped.',
    asks: 'What do you do?',
    recall: 'When someone lay bleeding in the street, you',
    options: [
      {
        id: 'flask',
        label: 'Kneel, tie off the leg above the wound with your belt and pour the healing draught from your flask down his throat. The bleeding slows while you watch.',
        told: 'tied off the leg with your belt and poured the healing draught from your flask down his throat.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 2 },
          lineage: { celestial: 1 },
          skill: { healer: 1, physician: 1 },
        },
      },
      {
        id: 'carry',
        label: 'Get him over your shoulder and carry him the three streets to the watch house yourself. Waiting for the watch to come to him would take longer than he has.',
        told: 'got him over your shoulder and carried him three streets to the watch house.',
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
        label: 'Kneel beside him as if to help, check his pulse with one hand and his purse with the other, and be three streets away with the purse before anyone looks twice.',
        told: 'knelt as if to help, took his purse while you checked his pulse and were gone before anyone looked twice.',
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
        label: 'Look at the blood on the cobbles and which way the drops fall, and go after the man who did it. He is not far, he is not running and he is not expecting anyone.',
        told: 'read which way the blood drops fell and went after the man who did it.',
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
    scene:
      'A travelling scholar is snoring upstairs in the inn, and his trunk is in the corner of the taproom where he left it, the lid unlocked and a dozen books showing. The fire is down to embers and you are the last one awake.',
    asks: 'What do you do?',
    recall: 'With the scholar’s trunk unlocked and the scholar asleep, you',
    options: [
      {
        id: 'read',
        label: 'Sit down by the embers and read, one book after another, until the window greys. Then put every one back exactly as it lay, spine out, in the order you found them.',
        told: 'read by the embers until dawn and put every book back exactly as it had lain.',
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
        label: 'Take the small one with the brass clasp, the one that looks valuable and light, and put it in your pack. He has eleven others.',
        told: 'took the small book with the brass clasp and left him the eleven others.',
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
        label: 'Leave the books alone. In the morning, sell him the lock off your own bag for three times what it cost you. Then sell him a strongbox to put it on.',
        told: 'left the books alone and sold him a lock in the morning at three times its cost.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 2, craftsman: 1 },
          skill: { haggler: 1 },
        },
      },
      {
        id: 'door',
        label: 'Drag a chair to the foot of the stairs and sit in it with your back to the trunk until he comes down. Somebody in this inn should.',
        told: 'sat with your back to the trunk until he came down in the morning.',
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
    scene:
      'There is a wildcat in a poacher’s snare at the edge of the wood, the wire deep in its hind leg, and it has torn the ground bare around it. It is hurt and exhausted, and it will take the hand off anyone who comes within reach.',
    asks: 'What do you do?',
    recall: 'Finding a wounded beast in a snare, you',
    options: [
      {
        id: 'talk',
        label: 'Get down on your knees at the edge of its reach and talk to it, low and steady, for as long as it takes. When it stops hissing, you cut the wire.',
        told: 'knelt at the edge of its reach and talked to it, low and steady, until it let you cut the wire.',
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
        label: 'End it with one clean blow of the hatchet, quickly, before it suffers any longer. Take the meat and the pelt so that none of it is wasted.',
        told: 'ended it with one clean blow of the hatchet and took the meat and the pelt.',
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
        label: 'Blow a pinch of the sleeping dust from your pouch into its face from arm’s length and wait for its head to drop. Then work the wire out of the leg and dress the wound.',
        told: 'blew sleeping dust into its face, waited for its head to drop and worked the wire out of the leg.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 2 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'bind',
        label: 'Drop your coat over its head, bind the jaws with a bootlace before it can get free of the cloth, then free the leg and pack the wound with the moss the old trapper showed you.',
        told: 'dropped your coat over its head, bound the jaws with a bootlace and packed the wound with moss.',
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
    scene:
      'There is a fist on the door and a voice behind it saying the watch, open up. Through the shutter you can see two of them in the street, with a third at the back. They have a description of you from the market, and it is a good one.',
    asks: 'What do you do?',
    recall: 'When the watch came to the door with a warrant, you',
    options: [
      {
        id: 'roofs',
        label: 'Go out the back window onto the wash-house roof, across two more and down the ivy at the end of the row. The watch never looks up.',
        told: 'went out the window, across three roofs and down the ivy at the end of the row.',
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
        label: 'Open the door, ask to see the warrant and read it slowly in front of them. It names the wrong street, and you point that out.',
        told: 'opened the door, read the warrant slowly and pointed out that it named the wrong street.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { inquisitor: 1, mastermind: 1 },
        },
      },
      {
        id: 'doorway',
        label: 'Open the door, fill it and tell them they are welcome to try. The one at the front looks at your shoulders and decides to come back with more men.',
        told: 'opened the door, filled it and told them they were welcome to try.',
        gives: {
          attribute: { physique: 2 },
          talent: { brawler: 1, colossus: 1, berserker: 1 },
          lineage: { stalwart: 1, undead: 1 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'bargain',
        label: 'Open the door and start talking prices. Everything they came for is for sale, and the name of the man who paid you to take it is the most valuable thing you own.',
        told: 'opened the door and sold them the name of the man who had paid you.',
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
    scene:
      'A letter arrives for you, by a rider who will not say who sent him, sealed in grey wax with a mark you have never seen. Inside, in a fine hand, it says that the academy has been watching you since the day the thing happened, and that a place is open.',
    asks: 'What do you do?',
    recall: 'When the academy’s letter came, you',
    options: [
      {
        id: 'go',
        label: 'Pack that night and go to the academy. Whatever they saw in you, they have a name for it, and you want to hear it said.',
        told: 'packed that night and went to the academy to hear what they had seen in you called by its name.',
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
        label: 'Put the letter in the fire and watch the grey wax run. Nothing that has watched you from a distance for years means you any good, and you leave the district that week.',
        told: 'put the letter in the fire and left the district that week.',
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
        label: 'Write back, in your best hand, asking what the place pays and what being watched is worth, and name a figure for both.',
        told: 'wrote back and named a price for the place and another for having been watched.',
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
        label: 'Walk to the academy, nail the letter to its front door with your own knife and stand beside it in the rain until somebody comes out to explain.',
        told: 'nailed the letter to the academy’s door with your knife and stood beside it until somebody came out to explain.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1 },
          background: { military: 1 },
        },
      },
    ],
  },

  {
    /* The Runebearer's own scene, added 2026-09-08 with the set. A Physique
       caster had nowhere to be scored: every answer that leans on the body in
       this pool is a shoulder against a door, and a set whose magic is written on
       the arm needed a moment where the body is the instrument rather than the
       lever.

       `youth-rune` rather than `youth-needle`, renamed 2026-09-09 with the rest of
       the set: the scene never says what the work is done with, and neither should
       its id. Safe to move because no run has ever been saved against it. */
    id: 'youth-rune',
    stage: 'youth',
    scene:
      'The old soldier who works out of the back of the tannery does this for coin: a rune worked into the skin of anybody who will sit still long enough, and a word said over the work at the end. Whatever goes on you tonight is on you for the rest of your life. There are two men ahead of you in the queue and one of them has stopped pretending it does not hurt.',
    asks: 'What do you do?',
    recall: 'In the back room of the tannery, with two men ahead of you in the queue, you',
    options: [
      {
        id: 'shoulder',
        label: 'Strip to the waist and ask for the whole of the shoulder, and down the arm from there. It takes four hours and you make no sound in any of them. When it is finished there is a mark on your arm that warms when you close your fist.',
        told: 'stripped to the waist and sat four hours without a sound, then walked out with a mark on your arm that warmed when you closed your fist.',
        gives: {
          attribute: { physique: 2 },
          talent: { runebearer: 3 },
          lineage: { stonebound: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'watch',
        label: 'Give up your place in the queue and watch from the corner instead, for as long as they will have you there. By the third man you know the order the lines go on and which of them the word is said over.',
        told: 'gave up your place and watched from the corner until you knew the order the lines went on.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 2, enchanter: 1 },
          background: { erudit: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'wrist',
        label: 'Hold out one hand and ask for something small on the inside of the wrist, where a sleeve covers it. You are out in a quarter of an hour and nobody on the street is any the wiser.',
        told: 'took something small on the inside of your wrist where a sleeve covers it, and were out in a quarter of an hour.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 2 },
          background: { criminal: 1 },
          skill: { streetwise: 1, cunning: 1 },
        },
      },
      {
        id: 'price',
        label: 'Ask what the word costs on its own, without the rune. They laugh, and then they see that you are serious, and the price they name is most of what you have on you.',
        told: 'asked what the word cost on its own, and paid most of what you had for it.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 2 },
          background: { merchant: 1 },
          skill: { haggler: 1, occultist: 1 },
        },
      },
    ],
  },

  {
    /* The Spellblade's own scene, added 2026-09-09 with the set. A Mind caster
       who has to be inside the fight had nowhere to be scored: every answer in
       this pool that leans on Mind is somebody standing back and reading, and
       the whole point of this set is the reading arriving on the end of a
       swing. So the scene puts a book and a blade in the same room and asks
       which one you pick up. */
    id: 'youth-hilt',
    stage: 'youth',
    scene:
      'The tutor your family hired for the summer turns out to be two people in one coat. Mornings are declensions and the four schools and what a spell actually is. Afternoons he takes off the coat, hands you a practice blade and knocks you down until supper. At the end of the season he says you have a year of him left in you and asks what you want it spent on.',
    asks: 'What do you do?',
    recall: 'When the tutor asked what your last year with him was for, you',
    options: [
      {
        id: 'both',
        label: 'Tell him both, and that you want them at the same time. He thinks about it for a long minute, then teaches you to hold the first syllable in your teeth while your arms are busy and to let go of it on the moment the edge lands.',
        told: 'asked for both at once, and learned to hold a syllable in your teeth until the edge landed.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellblade: 3 },
          lineage: { luminary: 1 },
          skill: { occultist: 1 },
        },
      },
      {
        id: 'book',
        label: 'Take the mornings. The blade is a thing anybody can be taught and the other half is not, and you would rather have the half that takes a lifetime.',
        told: 'took the mornings, because the blade is a thing anybody can be taught and the other half is not.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 2, enchanter: 1 },
          background: { erudit: 1 },
          skill: { scholar: 1 },
        },
      },
      {
        id: 'blade',
        label: 'Take the afternoons, and ask him to stop going easy. By spring you can put him on his back twice in five, which he says is two more than he expected and one fewer than he wanted.',
        told: 'took the afternoons and asked him to stop going easy, until you could put him on his back twice in five.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 3 },
          background: { military: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'coat',
        label: 'Ask him instead where a man learns to be two things at once, and who paid for it. He does not answer, and the not-answering is the most interesting thing that happens to you all year.',
        told: 'asked him where a man learns to be two things at once and who paid for it, and read everything in the not-answering.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 2 },
          background: { investigator: 1 },
          skill: { inquisitor: 1, cunning: 1 },
        },
      },
    ],
  },

  /* ================================================================== trade */
  {
    id: 'trade-fire',
    stage: 'trade',
    scene:
      'The big warehouse on the quay is burning from the roof down, the wind is off the water and half the town has come down to watch it go. The owner is standing in the street with his hands in his hair. Nobody has organised anything.',
    asks: 'What do you do?',
    recall: 'When the warehouse on the quay burned, you',
    options: [
      {
        id: 'crews',
        label: 'Start shouting orders. You get the dock crews into a bucket line, the pumps unshipped and two men on the roof of the next building with wet sacks, and you keep them at it until dawn.',
        told: 'got the dock crews into a bucket line and the pumps working, and kept them at it until dawn.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1 },
          background: { military: 3 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'calm',
        label: 'Watch the crowd rather than the fire. One man is watching it far too calmly, and you follow him home afterwards and learn his name.',
        told: 'watched the crowd rather than the fire, and followed the one man who was watching too calmly.',
        gives: {
          attribute: { mind: 1 },
          background: { investigator: 3 },
          skill: { inquisitor: 1, cunning: 1 },
        },
      },
      {
        id: 'salvage',
        label: 'Find the owner and buy the salvage rights off him for ready money while the roof is still falling in. The iron alone in there is worth ten times what you pay.',
        told: 'bought the salvage rights off the owner for ready money while the roof was still falling in.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 3 },
          skill: { haggler: 1 },
        },
      },
      {
        id: 'keep',
        label: 'Go in through the loading door at the back while everyone is watching the front, and carry out whatever is not yet burning. Bolts of cloth mostly, and one small chest.',
        told: 'went in through the loading door while everyone watched the front and carried out what was not yet burning.',
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
    scene:
      'A lord’s carriage has broken an axle in the mud a mile outside town. The coachman is under it, the lord is standing in the road shouting at him, and the rain is starting. You are the only other person on the road.',
    asks: 'What do you do?',
    recall: 'When the lord’s carriage broke its axle, you',
    options: [
      {
        id: 'fix',
        label: 'Get under the carriage with the coachman, splint the axle with a fence rail and a length of harness leather and have it rolling inside the hour. It holds all the way to town.',
        told: 'splinted the axle with a fence rail and harness leather and had it rolling inside the hour.',
        gives: {
          attribute: { physique: 1 },
          background: { craftsman: 3 },
          skill: { skilled: 1, tailor: 1 },
        },
      },
      {
        id: 'price',
        label: 'Name a price for the fixing before you touch anything, and when the lord shouts at you, double it. He pays.',
        told: 'named a price before you touched anything, and doubled it when he shouted.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 2, mercenary: 1 },
          skill: { haggler: 1 },
        },
      },
      {
        id: 'house',
        label: 'Address him by his house and his father’s name, and ask after his mother’s health. The shouting stops, and he offers you the seat beside him into town.',
        told: 'addressed him by his house and his father’s name, and the shouting stopped.',
        gives: {
          attribute: { mind: 1 },
          background: { aristocrat: 3 },
          skill: { charismatic: 1 },
        },
      },
      {
        id: 'lift',
        label: 'Take hold of the back of the carriage and lift it clear of the ground while the coachman sets the wheel. It is quicker than the jack, and he does not stop staring for a mile.',
        told: 'lifted the back of the carriage clear of the ground while the coachman set the wheel.',
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
    scene:
      'The inn’s singer has not turned up and the room is full: thirty drovers with money in their pockets and nothing to listen to. The landlord has looked round the room twice, and both times his eyes have stopped on you.',
    asks: 'What do you do?',
    recall: 'With the singer missing and the room full, you',
    options: [
      {
        id: 'stage',
        label: 'Get up on the barrel by the fire and give them the songs your mother sang, then the ones the drovers know. You have never once been able to resist a full room.',
        told: 'got up on the barrel and sang them your mother’s songs, then the ones the drovers knew.',
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
        label: 'Stand up and tell them a true story from the war, the one about the bridge. At the end, pull your shirt up and show them the scar that proves it.',
        told: 'told them a true story from the war and showed them the scar that proved it.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1 },
          background: { mercenary: 2, military: 1 },
          skill: { charismatic: 1 },
        },
      },
      {
        id: 'almanac',
        label: 'Take the almanac out of your pack and read them the weather for the week and the prices at the next three markets, which is what a room full of drovers actually wants to know.',
        told: 'read them the almanac’s weather and the prices at the next three markets.',
        gives: {
          attribute: { mind: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 3 },
          skill: { scholar: 1 },
        },
      },
      {
        id: 'road',
        label: 'Finish your drink, pick up your pack and slip out the back into the dark. You were only ever passing through, and the road is quieter than a room.',
        told: 'slipped out the back into the dark, because the road was quieter than the room.',
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
    scene:
      'There is a dead man in the alley behind the guildhall, face down in the wet, and you are the one who has found him. It is an hour before dawn. His coat is good and his purse is still on his belt.',
    asks: 'What do you do?',
    recall: 'Finding the body behind the guildhall, you',
    options: [
      {
        id: 'read',
        label: 'Crouch and read the scene without touching anything: the mud on his boots, the skin under his nails, the way he fell. By the time the watch arrives you can tell them how he died and where he was standing when it happened.',
        told: 'read the scene without touching anything, and knew how he died before the watch arrived.',
        gives: {
          attribute: { mind: 2 },
          lineage: { luminary: 1 },
          background: { investigator: 3 },
          skill: { inquisitor: 1, physician: 1 },
        },
      },
      {
        id: 'search',
        label: 'Take the purse, go through his coat for papers and walk away whistling. He has no more use for any of it.',
        told: 'took the purse, went through his coat for papers and walked away whistling.',
        gives: {
          attribute: { instinct: 1 },
          background: { criminal: 3 },
          skill: { streetwise: 1 },
        },
      },
      {
        id: 'carry',
        label: 'Lift him out of the wet, carry him round to the guildhall steps and sit with him there until the porter comes to open up. Nobody should lie in an alley.',
        told: 'carried him round to the guildhall steps and sat with him until the porter came.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 2 },
          lineage: { celestial: 1 },
          background: { craftsman: 2, military: 1 },
        },
      },
      {
        id: 'seal',
        label: 'Send the potboy running to the magistrate with a note under your family’s seal. A dead man in an alley is nothing. A dead man reported by your house is a matter.',
        told: 'sent word to the magistrate under your family’s seal, so that it would be a matter.',
        gives: {
          attribute: { mind: 1 },
          background: { aristocrat: 3 },
          skill: { charismatic: 1, mastermind: 1 },
        },
      },
    ],
  },

  /* =================================================================== road */
  {
    id: 'road-ambush',
    stage: 'road',
    scene:
      'Dusk on the marsh road, with fog coming up off the water. Three men step out of it in front of you with knives held low. The one in the middle says the purse, and says it like a man who has said it before.',
    asks: 'What do you do?',
    recall: 'When three knives came out of the fog, you',
    options: [
      {
        id: 'purse',
        label: 'Untie the purse and hand it over without a word, watching their faces. It is lighter than a funeral, and you will know all three of them again.',
        told: 'handed over the purse without a word and memorised all three faces.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'roar',
        label: 'Roar, drag your blade out and go straight through the man in the middle before he has finished his sentence. The other two are running by the time he hits the ground.',
        told: 'roared and went straight through the man in the middle, and the other two ran.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 3 },
          lineage: { draconic: 2 },
          weapon: { 'melee-heavy': 1, 'melee-great': 1 },
        },
      },
      {
        id: 'guard',
        label: 'Put your back to the milestone, get the shield up and your feet set, and let them come to you one at a time, because on this road they cannot come any other way.',
        told: 'put your back to the milestone, got the shield up and let them come one at a time.',
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
        label: 'Raise your hand and speak the word you learned. The light that comes off your fingers puts the middle one on his back in the mud and the other two on their knees.',
        told: 'spoke the word you had learned, and the light put the middle one on his back.',
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
    scene:
      'A stranger at the next table has been talking about you for a while, and now he says it loudly enough for the whole taproom to hear. The room goes quiet. He is smiling, and his hand is near his knife.',
    asks: 'What do you do?',
    recall: 'Insulted in a quiet taproom, you',
    options: [
      {
        id: 'fist',
        label: 'Cross the floor and hit him in the mouth before he has finished the sentence, then hit him again on the way down.',
        told: 'crossed the floor and hit him in the mouth before he had finished the sentence.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 2, brawler: 1 },
          background: { mercenary: 2 },
          weapon: { 'melee-light': 1 },
        },
      },
      {
        id: 'outside',
        label: 'Stand up, name him and invite him outside to settle it properly, with a witness each and first blood. He goes a little pale. He comes.',
        told: 'stood up, named him and invited him outside to settle it with first blood.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 3 },
          background: { aristocrat: 1 },
          weapon: { 'finesse-weapon': 1 },
        },
      },
      {
        id: 'drink',
        label: 'Laugh, call for two cups and sit down opposite him. Inside a quarter of an hour you know who is paying him to pick this fight, and he does not know that he told you.',
        told: 'laughed, bought him a cup and found out who was paying him inside a quarter of an hour.',
        gives: {
          attribute: { mind: 1 },
          background: { investigator: 1, entertainer: 1 },
          skill: { charismatic: 1, inquisitor: 1 },
        },
      },
      {
        id: 'cup',
        label: 'Smile and buy him a drink. On the way past the bar, see to it that a few drops from the small bottle on your belt go into it. He is very ill for two days.',
        told: 'bought him a drink with a few drops from your small bottle in it, and he was very ill for two days.',
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
    scene:
      'The road ends at a river swollen with snowmelt, forty yards across and running fast enough to roll stones along the bottom. There is no bridge and no ferry, and the far bank is where you need to be by nightfall.',
    asks: 'How do you cross?',
    recall: 'At a river too wide to jump, you',
    options: [
      {
        id: 'swim',
        label: 'Strip, tie your pack to your back and swim it, angling downstream into the current. It carries you three hundred yards before you touch the other side.',
        told: 'tied your pack on your back and swam it, and the current carried you three hundred yards before you touched bottom.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1 },
          lineage: { tidebound: 3 },
          skill: { seafarer: 1 },
        },
      },
      {
        id: 'tree',
        label: 'Take the axe to the tallest alder on the bank, fell it across the narrows and walk over on the trunk.',
        told: 'felled the tallest alder across the narrows and walked over on the trunk.',
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
        label: 'Read the water. Smooth brown water is deep and white water over gravel is not. A mile upstream you find the ford the drovers use.',
        told: 'read the water and found the drovers’ ford a mile upstream.',
        gives: {
          attribute: { instinct: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 2 },
          skill: { cartographer: 1, survivalist: 1 },
        },
      },
      {
        id: 'spell',
        label: 'Kneel at the water’s edge and speak the words that pull the cold out of the air. A bridge of ice creaks across the river, and it holds just long enough.',
        told: 'spoke the words that pulled the cold out of the air, and crossed on a bridge of ice that held just long enough.',
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
    scene:
      'You are standing before the magistrate with your hand on the book, and he is asking where you were last night between the ninth bell and midnight. You were somewhere you should not have been, doing something you should not have done, and the clerk is writing down every word.',
    asks: 'What do you say?',
    recall: 'Asked under oath where you had been, you',
    options: [
      {
        id: 'lie',
        label: 'Lie, in detail and with feeling. You were at your cousin’s sickbed, and you describe the room, the candle and the cousin so well that the clerk stops writing to listen.',
        told: 'lied in detail, about a cousin’s sickbed, so well that the clerk stopped writing to listen.',
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
        label: 'Tell the truth, all of it, in plain words. Let the magistrate do what he will with it. You have never learned to do anything else with your hand on a book.',
        told: 'told the truth, all of it, in plain words and let the magistrate do what he would.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1 },
          lineage: { celestial: 1 },
          background: { military: 1 },
        },
      },
      {
        id: 'deflect',
        label: 'Answer a slightly different question, at length, about the ninth bell and who else was on the bridge road, until the magistrate is asking you about the bridge road and has forgotten what he first asked.',
        told: 'answered a different question at length, until the magistrate had forgotten what he first asked.',
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
        label: 'Say nothing at all. Stand there with your hand on the book while he asks it four more times, and let the silence do the work until he gives up.',
        told: 'said nothing at all while he asked it four more times, until he gave up.',
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
    scene:
      'The tinker’s stall has the one thing you need, a good steel awl, and he wants three silver for it, which is three times what it is worth. He knows you need it. He has seen the broken one in your hand.',
    asks: 'What do you do?',
    recall: 'Faced with a price three times too high, you',
    options: [
      {
        id: 'haggle',
        label: 'Haggle. You start at half a silver and talk about the weather, the road and his mother’s health for as long as it takes, until he is so tired of your voice that he takes one silver to be rid of you.',
        told: 'haggled him down to one silver, mostly by talking until he was tired of your voice.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 2 },
          skill: { haggler: 2 },
        },
      },
      {
        id: 'take',
        label: 'Knock over the tray of buckles at the end of the stall, and while he is on his knees picking them up, take the awl and walk on.',
        told: 'knocked over his tray of buckles and took the awl while he was picking them up.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 2 },
          background: { criminal: 2 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'make',
        label: 'Walk away, buy a nail from the smith for a copper and spend the evening at the inn fire grinding and tempering it into an awl that is better than his.',
        told: 'bought a nail for a copper and spent the evening grinding and tempering it into a better awl.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 3, alchemist: 1 },
          background: { craftsman: 2 },
          skill: { skilled: 1 },
        },
      },
      {
        id: 'without',
        label: 'Put your broken one back in your pocket and walk on. You have mended harness with a thorn before, and you will do it again.',
        told: 'kept your broken one and walked on, and mended the harness with a thorn.',
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
    scene:
      'There is a dead man in the road with a mage’s grey robe on him and a crossbow bolt in his chest, and a wand of pale wood lying in the mud beside his open hand. It is still warm when you pick it up, and it hums.',
    asks: 'What do you do with it?',
    recall: 'Finding a dead mage’s wand in the mud, you',
    options: [
      {
        id: 'learn',
        label: 'Keep it. That night by the fire you hold it and listen to the hum, and by morning you know the first word it wants said to it. Something taught you how to listen to these.',
        told: 'kept it, and by morning you knew the first word it wanted said to it.',
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
        label: 'Take it apart that night with your knife, the pale wood, the silver wire in the core and the stone at the tip, to see how it was made. Then put it back together better.',
        told: 'took it apart that night to see how it was made, and put it back together better.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 3 },
          background: { craftsman: 1 },
          skill: { skilled: 1, 'arcane-marshal': 1 },
        },
      },
      {
        id: 'sell',
        label: 'Wrap it in a cloth and sell it in the next town to the apothecary, who knows a man, for more silver than you have seen in a year.',
        told: 'wrapped it in a cloth and sold it in the next town for more silver than you had seen in a year.',
        gives: {
          attribute: { instinct: 1 },
          background: { merchant: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
      {
        id: 'snap',
        label: 'Snap it over your knee and throw the halves into the ditch. Nothing good follows a dead mage’s things, and you would rather trust your own two hands.',
        told: 'snapped it over your knee and threw the halves in the ditch.',
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
    scene:
      'The town wall is twelve feet of stone between you and the bed you have paid for, and the gate has been shut since sundown. The watchman in the gatehouse has told you through the grille to come back at dawn, and has gone back to his supper.',
    asks: 'How do you get in?',
    recall: 'With the gate shut for the night, you',
    options: [
      {
        id: 'climb',
        label: 'Go along the wall to the place where the buttress meets the old tower, and climb it, twelve feet in the dark, the way you have climbed better walls than this one.',
        told: 'climbed the wall where the buttress met the old tower.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1 },
          lineage: { skybound: 2, fey: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'knock',
        label: 'Beat on the gate with the flat of your hand, then with a stone. Keep on until the watchman opens it to make you stop, which he does.',
        told: 'beat on the gate with a stone until the watchman opened it to make you stop.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, berserker: 1 },
          background: { military: 1 },
        },
      },
      {
        id: 'bribe',
        label: 'Go back to the grille, slide two silver through it and talk about how cold the night is. The postern opens a minute later. It is what the watch is for.',
        told: 'slid two silver through the grille, and the postern opened a minute later.',
        gives: {
          attribute: { mind: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, criminal: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
      {
        id: 'hedge',
        label: 'Walk back down the road to the hedge you passed, get in under it out of the wind and sleep until the gate opens. You have slept in worse.',
        told: 'slept under a hedge out of the wind until the gate opened.',
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
    scene:
      'There is a heavy purse lying in the long grass by the stile. When you open it there is more gold in it than you have held in your life. The road is empty in both directions. Nobody saw you pick it up.',
    asks: 'What do you do?',
    recall: 'Finding a purse of gold that was not yours, you',
    options: [
      {
        id: 'keep',
        label: 'Put it inside your shirt and keep walking, a little faster than before. Nobody saw.',
        told: 'put the purse inside your shirt and kept walking.',
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
        label: 'Look for the owner. The seal on the purse is a merchant’s. You ask after it at the next three inns. By nightfall you have handed it back to a woman who cries when she sees it.',
        told: 'asked at three inns after the seal on the purse and handed it back to a woman who cried.',
        gives: {
          attribute: { mind: 1 },
          lineage: { celestial: 2 },
          background: { investigator: 1 },
          skill: { helpful: 1, inquisitor: 1 },
        },
      },
      {
        id: 'split',
        label: 'Count it out on the stile into equal shares, one for you and one for each of the two people walking with you. Shares keep friends, and friends keep you alive.',
        told: 'counted it into equal shares on the stile, one for each of you.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1 },
          background: { mercenary: 1, entertainer: 1 },
          skill: { charismatic: 1 },
        },
      },
      {
        id: 'bait',
        label: 'Put it back exactly where it lay and walk on. A purse of gold in the grass by an empty road is bait, and you would rather not meet whoever set it.',
        told: 'put it back exactly where it lay, because gold like that is bait.',
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
    scene:
      'The village you walked into at noon has a fever in it, and by evening the headman has closed the road at both ends. Nobody leaves until it passes. Half the houses have a sick child in them, and the healer died last week.',
    asks: 'What do you do?',
    recall: 'Shut in a village with a fever, you',
    options: [
      {
        id: 'brew',
        label: 'Go out to the hedgerows and the stream with a sack and gather what grows: feverfew, willow and the grey lichen off the oaks. You have a cauldron going in the headman’s kitchen by dark and the first doses out by midnight.',
        told: 'gathered feverfew, willow and lichen from the hedgerows and had a cauldron going by dark.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 3, mycomancer: 2 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'nurse',
        label: 'Go from house to house with water, cold cloths and a steady voice, and sit with the worst of them through the nights. You do not sleep for four days.',
        told: 'went from house to house with water and cold cloths, and did not sleep for four days.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1 },
          lineage: { celestial: 2 },
          skill: { healer: 2, physician: 1 },
        },
      },
      {
        id: 'water',
        label: 'Ask which houses are sick and which are not, and chalk the answers on the back of a door until the pattern shows you which well is the cause. You have it boarded over by morning.',
        told: 'worked out from which houses were sick which well was the cause, and had it boarded over by morning.',
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
        label: 'Take a post on the road at the eastern end and hold the line. Nobody goes out and nobody comes in, however much they beg, until the headman says the fever has passed.',
        told: 'held the line on the eastern road until the fever had passed.',
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
    scene:
      'Night, the third on the road. The fire is down to a red glow and the other two are asleep under their cloaks. The watch is yours until the moon sets, and there is nothing to do but keep it.',
    asks: 'How do you spend the hours?',
    recall: 'On the road, with the others asleep, you spent the night hours',
    options: [
      {
        id: 'sharpen',
        label: 'Take out the whetstone and the oil and go over everything: the blade, the buckles, the straps of the shield, every stitch of the harness. Then do it again.',
        told: 'going over every blade, buckle and strap twice with the whetstone and the oil.',
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
        label: 'Leave the fire and walk the edge of the camp in the dark, slowly, stopping often to listen. Something is always out there, and tonight you want to know what.',
        told: 'walking the edge of the camp in the dark, stopping to listen.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 3, duelist: 1 },
          lineage: { wildkin: 1, wildheart: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'read',
        label: 'Build the fire up a little, take the book out of its oilcloth and read until the light gives out, with your back to a tree and one ear on the dark.',
        told: 'building the fire up and reading until the light gave out.',
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
        label: 'Sit with the creature that travels with you, its head on your knee. Say nothing at all until the moon goes down. It watches the dark for both of you.',
        told: 'sitting with the creature that travels with you until the moon went down.',
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
    scene:
      'The only bridge for ten miles has a toll, and the man collecting it is the size of a door. He looks you up and down, decides the toll is double for you and puts his hand out.',
    asks: 'How do you get across?',
    recall: 'At the bridge where the toll had doubled, you',
    options: [
      {
        id: 'pay',
        label: 'Pay him double, smile, ask after his knees in this weather and be across before he has thought of asking for triple.',
        told: 'paid him double, asked after his knees and were across before he thought of triple.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 1, aristocrat: 2 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'lift',
        label: 'Take him under the arms, lift him off his feet and set him down gently on the other side of the road, then walk across.',
        told: 'lifted him off his feet, set him down on the other side of the road and walked across.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 3, brawler: 1 },
        },
      },
      {
        id: 'wade',
        label: 'Nod and walk back the way you came until the bend hides you. Then wade the river under the bridge while he is still working out the arithmetic.',
        told: 'walked back to the bend and waded the river under the bridge.',
        gives: {
          attribute: { instinct: 1 },
          lineage: { tidebound: 2 },
          skill: { cunning: 1, survivalist: 1 },
        },
      },
      {
        id: 'flask',
        label: 'Offer him a drink from your flask against the cold. The brew in it is your own, and he will not remember you passing, or much else about the afternoon.',
        told: 'offered him a drink from your flask, and he did not remember you passing.',
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
    scene:
      'A small child is standing alone in the market crowd, crying for its mother. A man you do not like the look of is walking towards it too quickly, with his eyes on the child and not on the crowd.',
    asks: 'What do you do?',
    recall: 'Seeing a man close on a lost child in the market, you',
    options: [
      {
        id: 'between',
        label: 'Step into his path and stand there, between him and the child, and let him understand that whatever he wants he can want it through you.',
        told: 'stepped into his path and stood between him and the child.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 3 },
          lineage: { celestial: 1 },
          background: { military: 1 },
        },
      },
      {
        id: 'wrist',
        label: 'Take his wrist as he reaches for the child and hold it. Look at him without a word until he decides to be somewhere else.',
        told: 'took his wrist as he reached, and looked at him until he decided to be somewhere else.',
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
        label: 'Lift the child onto a barrel and call its description across the whole market in a voice that carries to the far stalls. Crowds find mothers, and the man melts into this one.',
        told: 'lifted the child onto a barrel and called its description across the market until the mother came.',
        gives: {
          attribute: { mind: 1 },
          lineage: { celestial: 1 },
          background: { entertainer: 2, aristocrat: 1 },
          skill: { charismatic: 1, helpful: 1 },
        },
      },
      {
        id: 'watch',
        label: 'Do nothing yet. Watch the man, note his face and his coat, and when the mother appears and he turns away, follow him. He is not the father, and you want to know where he goes.',
        told: 'watched the man, and followed him when the mother came, to see where he went.',
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
    scene:
      'The storm has taken the roof off the inn. The family who keep it are out in the yard in the rain with a baby, the thatch in the mud around them and the wind still rising.',
    asks: 'What do you do?',
    recall: 'When the storm took the roof off the inn, you',
    options: [
      {
        id: 'beam',
        label: 'Get under the main beam where it has come off the wall and hold it up on your shoulders while they get the thatch back over it. It takes all night, so you hold it all night.',
        told: 'held the main beam up on your shoulders all night while they got the thatch back over it.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 2, guardian: 1 },
          lineage: { stonebound: 2 },
          background: { craftsman: 1 },
        },
      },
      {
        id: 'baby',
        label: 'Put the baby inside your coat against your chest and walk into the wind to the next farm, two miles in the dark. You know the way without seeing it.',
        told: 'put the baby inside your coat and walked two miles into the wind to the next farm.',
        gives: {
          attribute: { instinct: 1 },
          lineage: { skybound: 3 },
          background: { outlander: 1 },
          skill: { survivalist: 1, cartographer: 1 },
        },
      },
      {
        id: 'fire',
        label: 'Get everyone down into the cellar and make a fire out of wet wood, a handful of the powder from your pouch and nothing else, and have them warm inside the quarter hour.',
        told: 'got everyone into the cellar and made a fire out of wet wood and a handful of your powder.',
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
        label: 'Stand in the middle of the yard with your face to the wind and speak to the storm, the way you did once before. It listens, a little. The wind drops enough to work in.',
        told: 'stood in the yard and spoke to the storm, and it listened a little.',
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
    scene:
      'The man you put on his back years ago is standing in the taproom doorway, and he has brought four friends. He has recognised you. He is pointing.',
    asks: 'What do you do?',
    recall: 'When the man you once put down found you with four friends, you',
    options: [
      {
        id: 'again',
        label: 'Get up and do it again, and this time make sure of it. Then turn round to see whether the four friends still want any part of this.',
        told: 'got up and did it again, and this time made sure of it.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 2, brawler: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'table',
        label: 'Turn the table over between them and the rest of the room, so that whatever happens next happens to you and not to the people behind you.',
        told: 'turned the table over between them and the room.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 2 },
          background: { military: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'window',
        label: 'Be out through the window behind you before he has finished pointing. You have paid for the drink, and the alley is dark.',
        told: 'were out through the window behind you before he had finished pointing.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 2 },
          lineage: { fey: 1 },
          skill: { cunning: 1 },
        },
      },
      {
        id: 'drink',
        label: 'Call for five cups, wave them over to your table and ask after his mother, by name, because you remember it. It is very hard to hit a man who remembers your mother’s name.',
        told: 'bought all five of them a drink and asked after his mother by name.',
        gives: {
          attribute: { mind: 1 },
          background: { merchant: 1, entertainer: 2 },
          skill: { charismatic: 1, empath: 1 },
        },
      },
    ],
  },

  {
    /* The second half of the Runebearer's pair, and deliberately on the road
       rather than in the youth: a mark is cut once and then spent, over and
       over, on whatever the road puts in front of it. */
    id: 'road-bleeding',
    stage: 'road',
    scene:
      'A cart has gone over on the bend and one of the drovers is under the wheel with his leg opened to the bone. The blood is coming faster than anybody can pack it and there is no surgeon within a day of here. The ring of people standing round him are all looking at somebody else.',
    asks: 'What do you do?',
    recall: 'On the road, with a drover bleeding out under a cart wheel, you',
    options: [
      {
        id: 'hands',
        label: 'Kneel in it, put both hands flat on the leg and hold them there. The mark on your forearm goes cold, the bleeding stops, and you are grey to the lips for an hour afterwards.',
        told: 'knelt in the blood and held both hands on the leg until the mark on your forearm went cold and the bleeding stopped.',
        gives: {
          attribute: { physique: 2 },
          talent: { runebearer: 3 },
          lineage: { stalwart: 1 },
          skill: { healer: 1 },
        },
      },
      {
        id: 'vial',
        label: 'Get the small green bottle off your belt, tip half of it into the wound and the other half into him. It burns going in and he screams the yard down, and then the bleeding slows.',
        told: 'tipped half a green bottle into the wound and the other half into the man, and the bleeding slowed.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 2 },
          background: { erudit: 1 },
          skill: { apothecary: 1, physician: 1 },
        },
      },
      {
        id: 'axle',
        label: 'Get your shoulder under the axle and stand up with it, and keep standing while two of them drag him clear. Nobody thinks to count how long you hold it.',
        told: 'got your shoulder under the axle and stood up with it until they had dragged him clear.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 2, guardian: 1 },
          lineage: { stonebound: 1 },
        },
      },
      {
        id: 'strap',
        label: 'Cut a strap off the harness, get it round the thigh above the wound and twist it down with the handle of your knife until the bleeding stops. It takes you eleven seconds.',
        told: 'cut a strap off the harness and twisted a tourniquet down on the leg with your knife handle.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, trickster: 1 },
          background: { military: 1 },
          skill: { physician: 1, vigilant: 1 },
        },
      },
    ],
  },

  {
    /* The second half of the Spellblade's pair, and on the road rather than in
       the youth for the reason the Runebearer's second is: the tutor taught you
       the trick and the road is where you find out it only works at arm's
       length. Every answer here is somebody solving one problem at one distance,
       which is the question the whole set is an answer to. */
    id: 'road-lantern',
    stage: 'road',
    scene:
      'Something has been following the caravan for three nights and it only comes close on the fourth. It is fast, it is low to the ground, and it goes straight through the two guards at the tail. The nearest lantern is thirty paces behind you and everything that matters is going to happen inside the next four seconds.',
    asks: 'What do you do?',
    recall: 'The night the thing took the tail of the caravan, you',
    options: [
      {
        id: 'meet',
        label: 'Walk into it. Get a hand on the axe at your belt, say the one word you know all the way through and put both of them into the same place at the same time. What comes off the blade is not steel and it goes into the thing rather than across the yard.',
        told: 'walked into it with a word and an axe going into the same place at the same moment.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellblade: 3 },
          lineage: { luminary: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'far',
        label: 'Get distance. Back off past the wagon, get the width of the yard between you and it, and put everything you have into the space it has to cross to reach you.',
        told: 'backed off past the wagon and filled the ground it had to cross to reach you.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 3 },
          background: { erudit: 1 },
          skill: { occultist: 1 },
        },
      },
      {
        id: 'lantern',
        label: 'Go for the lantern instead. Thirty paces back, up onto the wagon and swing it round so the whole tail of the caravan is lit, and let the six people with spears do what six people with spears are for.',
        told: 'went thirty paces back for the lantern and lit the whole tail of the caravan for the people with spears.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 2 },
          background: { military: 1 },
          skill: { helpful: 1, vigilant: 1 },
        },
      },
      {
        id: 'bait',
        label: 'Cut the traces on the last mule and drive it back down the road past the thing. Whatever it is, it goes after the loud warm thing running away rather than the quiet cold one standing still.',
        told: 'cut a mule loose and drove it back down the road, and the thing went after the loud warm one.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 2 },
          background: { outlander: 1 },
          skill: { survivalist: 1, cunning: 1 },
        },
      },
    ],
  },

  /* ================================================================ leaving */
  {
    id: 'leaving-night',
    stage: 'leaving',
    scene:
      'It is the night you leave the life you had. Behind you the house is burning, the roof already gone. The whole street is coming out of doors in their nightshirts. Someone is still inside.',
    asks: 'What do you do?',
    recall: 'The night you left, with the house burning behind you, you',
    options: [
      {
        id: 'back',
        label: 'Turn round and go back in through the front door, into the smoke, for the one who is still inside. Come out with them.',
        told: 'went back in through the smoke for the one who was still inside.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 3 },
          lineage: { scorchbound: 1, celestial: 1 },
          background: { military: 1 },
        },
      },
      {
        id: 'lit',
        label: 'Keep walking, and do not look round. You lit it, and the flask that did it is empty in your pocket.',
        told: 'kept walking without looking round. You lit it.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1, pactbound: 1 },
          lineage: { infernal: 2 },
        },
      },
      {
        id: 'watch',
        label: 'Stand in the road and watch until the roof falls in and the walls go. You needed to see it end, and then you go.',
        told: 'stood in the road and watched until the walls went, and then left.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 2 },
          lineage: { draconic: 1, undead: 2 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'run',
        label: 'Run, with the hound at your heel and nothing in your hands, down the lane and over the fields, and do not stop until dawn.',
        told: 'ran with the hound at your heel and did not stop until dawn.',
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
    scene:
      'You have one hand free and the cart is already moving out of the yard. Whatever you do not pick up in the next ten seconds stays here for good.',
    asks: 'What do you take?',
    recall: 'Out of the life you left, you carried',
    options: [
      {
        id: 'great',
        label: 'The weapon from over the door, the one that was your grandfather’s and is too big for the doorway. You get it out by turning it sideways.',
        told: 'the weapon from over the door, too big for the doorway. You got it out sideways.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 3 },
          weapon: { 'melee-great': 1, 'long-bow': 1 },
        },
      },
      {
        id: 'blades',
        label: 'The blade from under the bed and its twin from the chest, one in each hand. Not one thing more.',
        told: 'the blade from under the bed and its twin from the chest, and nothing more.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 3 },
          skill: { 'quick-draw': 1 },
          weapon: { 'paired-finesse': 1, 'finesse-weapon': 1 },
        },
      },
      {
        id: 'book',
        label: 'The book you were never supposed to have, from under the loose board by the window, wrapped in your spare shirt.',
        told: 'the book you were never supposed to have, wrapped in your spare shirt.',
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
        label: 'The shield from the wall, with a name painted on the inside of it that is not yours yet.',
        told: 'the shield from the wall, with a name inside it that was not yours yet.',
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
    scene:
      'Your pack is on your back and there is room in the top of it for one more thing. Someone is calling your name from the road, and they will not call twice.',
    asks: 'What goes in?',
    recall: 'Into the pack, with someone calling from the road, went',
    options: [
      {
        id: 'cauldron',
        label: 'The small cauldron from the hearth, the bundle of dried herbs from the beam and the stoppered jar of something that moves when you tilt it.',
        told: 'the small cauldron, the bundle of herbs from the beam and the jar of something that moved.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 3 },
          skill: { apothecary: 1 },
        },
      },
      {
        id: 'pistol',
        label: 'The pistol from the drawer, the lantern and the folded list of names you have been keeping since the winter.',
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
        label: 'The contract from the bottom of the chest, the one signed in something that was not ink, in a hand that was not quite yours.',
        told: 'the contract signed in something that was not ink.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 3 },
          lineage: { infernal: 1 },
        },
      },
      {
        id: 'nothing',
        label: 'Nothing. You pull the straps tight over what is already there and go. Your two hands and the anger have always been enough.',
        told: 'nothing at all, because your hands and the anger had always been enough.',
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
    scene:
      'The first real fight after you leave. A dead-end alley behind the coaching inn, two men who followed you out of the taproom and no way past them but through them.',
    asks: 'How does it end?',
    recall: 'Your first real fight on the road ended',
    options: [
      {
        id: 'wall',
        label: 'With your back against the alley wall and the shield up, taking everything they have to give until they tire. Neither of them ever gets past you.',
        told: 'with your back to the wall and the shield up, and neither of them past you.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 3 },
          weapon: { 'melee-light-shield': 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'over',
        label: 'With both of them on the cobbles and you standing over them breathing hard, and no memory at all of the middle part.',
        told: 'with both of them on the cobbles and no memory of the middle.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 3 },
          lineage: { draconic: 2 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'behind',
        label: 'Before it starts. While they were looking at where you had been standing, you were already behind them. Then it was over.',
        told: 'before it started, because you were already behind them.',
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
        label: 'With the far end of the alley on fire, the two of them running from it, and you having touched neither of them.',
        told: 'with the alley on fire and you having touched neither of them.',
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
    scene:
      'The road forks at the milestone under a grey sky: left to the city, right into the forest, straight on to the coast and the mountain pass behind you. Nobody is waiting for you on any of them, and nobody is coming after you.',
    asks: 'Which way do you go?',
    recall: 'At the milestone where the road forked, you took',
    options: [
      {
        id: 'wild',
        label: 'Into the forest. Something under the trees has been saying your name since you were a child, and it is time you found out what.',
        told: 'the forest road, where something had been saying your name since you were a child.',
        gives: {
          attribute: { instinct: 1 },
          talent: { mycomancer: 3, 'feral-curse': 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 2 },
        },
      },
      {
        id: 'city',
        label: 'To the city. There is work there for someone who can make things, and a bench and a fire to make them at.',
        told: 'the city road, where there was work for someone who could make things.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 3, alchemist: 1 },
          background: { craftsman: 1, merchant: 1 },
        },
      },
      {
        id: 'pass',
        label: 'Up into the pass. Whatever is on the other side of the mountain, you can carry what you need to get there on your own back.',
        told: 'the pass, carrying what you needed on your own back.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 1, guardian: 1 },
          lineage: { stonebound: 2 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'sea',
        label: 'Down to the coast, and the first ship that will take a hand. You have never once been afraid of deep water.',
        told: 'the coast road and the first ship that would take a hand.',
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

  {
    /* The Necromancer's own scene, added 2026-09-09 with the set. The pool had
       nowhere to score somebody who is easy around a body: every Mind answer in
       it is a person reading, and this set is a person *working*. So the scene is
       a plague year and a barrow full of people who need moving, and the answers
       are the four ways a child can be around that. */
    id: 'youth-barrow',
    stage: 'youth',
    scene:
      'It is the second plague summer and there is nobody left to carry the dead but children and the very old. They put you on the cart with a man who has done it before and stopped talking about it. Forty in the barrow by the end of the week, and none of them have anybody left to say a word over them.',
    asks: 'What do you do?',
    recall: 'On the plague cart the summer you were a child, you',
    options: [
      {
        id: 'names',
        label: 'Learn every one of their names and say them over the barrow at the end, in the order they came. The old man watches you do it on the fourth night and tells you to stop, because things that are named keep listening.',
        told: 'learned all forty names and said them over the barrow, until the old man told you that things which are named keep listening.',
        gives: {
          attribute: { mind: 2 },
          talent: { necromancer: 3 },
          lineage: { undead: 1 },
          skill: { occultist: 1 },
        },
      },
      {
        id: 'hands',
        label: 'Say nothing and lift. Two a trip and forty by Friday, and the only thing you decide all week is where your hands go so that nothing comes apart on the way.',
        told: 'said nothing and lifted, two a trip and forty by Friday.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 2, guardian: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1 },
        },
      },
      {
        id: 'why',
        label: 'Start opening them instead. You want to know why it took the miller in a night and left his wife, and by the end of the week you have a fair guess and a smell you cannot wash out.',
        told: 'started opening them instead, to find out why it took the miller in a night and left his wife.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 2, arcanist: 1 },
          background: { investigator: 1 },
          skill: { physician: 1, apothecary: 1 },
        },
      },
      {
        id: 'run',
        label: 'Get off the cart on the second morning and do not come back. There is fruit going soft in three gardens whose owners are in the barrow, and somebody is going to eat it.',
        told: 'got off the cart on the second morning and lived off three gardens whose owners were in the barrow.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 2 },
          background: { criminal: 1 },
          skill: { scavenger: 1, streetwise: 1 },
        },
      },
    ],
  },

  {
    /* The second half of the Necromancer's pair, on the road for the same reason
       the Runebearer's is: the first scene is where somebody finds out they are
       comfortable with this, and the road is where it is a tool somebody reaches
       for in front of witnesses. */
    id: 'road-shorthanded',
    stage: 'road',
    scene:
      'The bridge crew is nine men short of finishing before the thaw and the nine are in the churchyard, which is where the last winter put them. The foreman is drunk in the middle of the day and the village has begun to talk about what happens to all of them if the bridge is not up.',
    asks: 'What do you do?',
    recall: 'At the bridge that was nine men short of the thaw, you',
    options: [
      {
        id: 'nine',
        label: 'Go and get the nine. They work through the night and they do not complain about the cold, and by the third night nobody from the village will come down to the water while you are standing there.',
        told: 'went and got the nine out of the churchyard, and by the third night nobody would come down to the water while you stood there.',
        gives: {
          attribute: { mind: 2 },
          talent: { necromancer: 3 },
          lineage: { infernal: 1 },
          skill: { mastermind: 1 },
        },
      },
      {
        id: 'foreman',
        label: 'Take the foreman apart in front of his own crew, sober him up in the trough and put the work back on its feet by making the whole village afraid of you instead of the thaw.',
        told: 'took the foreman apart in front of his crew and put the work back on its feet.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 2, berserker: 1 },
          background: { military: 1 },
          skill: { charismatic: 1 },
        },
      },
      {
        id: 'stone',
        label: 'Look at what they have actually built and find the four places it is wrong. Fixing those saves them the nine men, and the foreman never forgives you for it.',
        told: 'found the four places the bridge was wrong, which saved them the nine men and cost you the foreman.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 2, arcanist: 1 },
          background: { craftsman: 1 },
          skill: { scholar: 1, cartographer: 1 },
        },
      },
      {
        id: 'price',
        label: 'Wait. A village that is going to lose everything by the thaw will pay anything by the thaw, and you would rather be paid than thanked.',
        told: 'waited for the thaw to raise the price, because you would rather be paid than thanked.',
        gives: {
          attribute: { instinct: 2 },
          talent: { pactbound: 2, trickster: 1 },
          background: { merchant: 1 },
          skill: { haggler: 1, cunning: 1 },
        },
      },
    ],
  },
];
