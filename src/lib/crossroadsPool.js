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
 * **Forty more, 2026-09-09.** Jules: "expand on the crossraods. Add more
 * varation, like 40 more." Fifty-one questions became ninety-one, weighted
 * toward the stages that were asked most often with the fewest scenes behind
 * them: childhood, home and trade each had four questions and a draw of one, so
 * one run in four opened on the same dog behind the mill. They now hold ten
 * apiece. Nothing in the engine or the stages moved, and a run is still eight
 * questions. The numbers under the new answers were then tuned twice against
 * the census, because the first draft of them put the Trickster in a run in
 * three and the Spellblade in one in seventy. See data/README.md for both
 * tables.
 *
 * **The points spread, 2026-09-10.** Jules: "avoid having thing give mutlipe
 * points to 1, and have them spread out on more options. The goals is to have
 * cross over. add 20 more secnarios." Every number outside the attribute is now
 * a 1, and every answer names more things (see the fifth law below). Ninety-one
 * questions became a hundred and thirteen, four more in each of the five stages
 * that were thinnest against their own draw. The twenty new scenes were sited
 * where the count had nobody: a fair, a causeway, a swarm and a troupe are
 * where the Entertainer lives, a mill rope and a ball of red thread are where
 * the Weaver does. Nothing in the engine or the stages moved.
 *
 * ------------------------------------------------------------------- the laws
 * Five, and scripts/check-crossroads.mjs holds every question and option to them.
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
 * **A point is a single point.** Outside the attribute, nothing is ever weighed
 * twice by one answer. Where an answer used to put two on a set it now names
 * two sets that the same act points at, so a thing wins a count by being what
 * several answers had in common rather than by one answer choosing it. That is
 * the crossover: tearing the gate out is a point for the Berserker and a point
 * for the Colossus, and which of them you end up holding is decided by the
 * other seven answers. The attribute is the one exception, and it is not a
 * spread: an answer gives exactly one attribute, at 1 or 2 depending on how
 * hard it leans.
 *
 * The consequence is worth knowing before touching a number. **How often a
 * thing wins is very nearly how many answers name it**, so the pool is balanced
 * by counting homes rather than by weighing them, and two sets that always
 * appear together are one set as far as the count is concerned. That is how the
 * Spellblade came to be scored in twelve answers and never once alone, and to
 * be held in one run in two hundred. Run `lint:crossroads --list` after any
 * change and read the census at the foot of it.
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
 * A point is a point wherever it lands, and every one of them outside the
 * attribute is a 1. What an answer says about a life is said by how many things
 * it names and which, not by how heavily it names them: a night on the road
 * names two or three because a single night says less than ten years did, and
 * a trade names four or five because what you did for a living is most of what
 * a background is.
 *
 * ------------------------------------------------------------------- the voice
 * The reader is `you`, and the scene is told to the character rather than to the
 * player. An answer is what you do and how, and it never names a rule, a set or
 * a number: "roar, drag your blade out and go straight through the man in the
 * middle" is a Berserker's answer without saying so, which is the whole point of
 * asking it this way. docs/text-style.md applies to every word here.
 *
 * The one reader who is shown the numbers is an admin, on hover, and only so
 * that the pool can be held to its own laws from the screen rather than from a
 * checker. See `weightsOf` in crossroads.js and `Weights` in Crossroads.jsx.
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
          talent: { guardian: 1, colossus: 1 },
          background: { military: 1 },
          skill: { helpful: 1, vigilant: 1 },
        },
      },
      {
        id: 'whistle',
        label: 'Crouch, hold out a hand and whistle low. Dogs have always come to you, and this one comes.',
        told: 'crouched, held out a hand and whistled low, and the dog came to you.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, 'draconic-bond': 1, beastbond: 1 },
          lineage: { wildkin: 1 },
          background: { entertainer: 1 },
          skill: { survivalist: 1, empath: 1 },
        },
      },
      {
        id: 'story',
        label: 'Tell them, loudly and in detail, about the boy two valleys over who stoned a dog and what came for him that night. You make most of it up as you go.',
        told: 'told them, loudly and in detail, about the boy who stoned a dog and what came for him that night, and made most of it up.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1 },
          lineage: { infernal: 1 },
          background: { entertainer: 1, aristocrat: 1 },
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
          talent: { berserker: 1, brawler: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { 'quick-draw': 1, streetwise: 1 },
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
          lineage: { scorchbound: 1 },
          background: { military: 1 },
          skill: { helpful: 1, survivalist: 1 },
        },
      },
      {
        id: 'back',
        label: 'Run round to the back wall where the boards are rotten, kick two of them loose and coax the calf out through the gap with your voice.',
        told: 'ran round to the back wall, kicked two rotten boards loose and coaxed the calf out through the gap.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'feral-curse': 1, 'draconic-bond': 1 },
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
          talent: { alchemist: 1 },
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
          talent: { arcanist: 1, 'elemental-aspect': 1 },
          lineage: { scorchbound: 1 },
          background: { erudit: 1 },
          skill: { scholar: 1, vigilant: 1 },
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
          talent: { trickster: 1 },
          background: { criminal: 1, entertainer: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'promise',
        label: 'Wait for him to turn round, put your copper on the board and offer him the other two by the winter fair, on your word. You mean it, and he can see that you mean it.',
        told: 'put your copper on the board and offered the rest by the winter fair, on your word.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1 },
          lineage: { celestial: 1 },
          background: { merchant: 1, aristocrat: 1, entertainer: 1 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'crates',
        label: 'Offer to carry his crates and stack his stall until the market closes, and take the knife as your wage. It is a long day, and the crates are heavy.',
        told: 'carried his crates and stacked his stall until the market closed, and took the knife as your wage.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, runebearer: 1 },
          lineage: { stalwart: 1 },
          background: { craftsman: 1 },
          skill: { frugal: 1, helpful: 1 },
        },
      },
      {
        id: 'make',
        label: 'Put the copper back in your pocket and look hard at how the knife is made: the rivets, the grind of the edge, the fit of the bone. You will make one yourself at the forge at home, and it will be better.',
        told: 'looked hard at how the knife was made and went home to make a better one at the forge.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 1, spellblade: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, scholar: 1 },
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
          talent: { berserker: 1, brawler: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'listen',
        label: 'Sit down on the step, stay perfectly still and let your eyes and ears learn the dark. In a while you can make out the shelves, the barrels and the grey line of light under the door.',
        told: 'sat still on the step until your eyes and ears had learned the dark.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, wilder: 1, mycomancer: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { vigilant: 1, survivalist: 1 },
        },
      },
      {
        id: 'walls',
        label: 'Work your way along the wall with your hands, counting the shelves, the jars and the courses of stone, until you have the whole room mapped in your head and can walk it blind.',
        told: 'worked your way along the walls by hand until you had the whole room mapped and could walk it blind.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1 },
          background: { investigator: 1 },
          skill: { skilled: 1, cartographer: 1 },
        },
      },
      {
        id: 'speak',
        label: 'Speak into the dark to whatever you can feel is down there with you. Ask it to show you the door. Something answers.',
        told: 'spoke into the dark to whatever was down there with you, and something answered.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1, necromancer: 1 },
          lineage: { infernal: 1 },
          background: { investigator: 1 },
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
          talent: { guardian: 1, colossus: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
        },
      },
      {
        id: 'talk',
        label: 'Invite him in, pour him the last of the cider and talk to him about the harvest, the roads and the price of grain until, without quite noticing, he has agreed to take half the debt at midwinter.',
        told: 'invited him in, poured him the last of the cider and talked him down to half the debt at midwinter.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { celestial: 1 },
          background: { merchant: 1, aristocrat: 1, entertainer: 1 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'follow',
        label: 'Tell him your father is out and shut the door. Then go out the back and follow him through the village at a distance, to see where he lives and where he keeps his ledger.',
        told: 'shut the door on him, went out the back and followed him home to see where he kept his ledger.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'feral-curse': 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
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
          background: { investigator: 1, aristocrat: 1 },
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
          talent: { guardian: 1, runebearer: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { survivalist: 1, healer: 1 },
        },
      },
      {
        id: 'gather',
        label: 'Go down to the stream and gather the willow bark, the feverfew and the moss your grandmother used, boil them the way she did and get the tea into your sister a spoon at a time.',
        told: 'gathered willow bark and feverfew by the stream, boiled them the way your grandmother did and spooned the tea into her.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, wilder: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { apothecary: 1, healer: 1 },
        },
      },
      {
        id: 'read',
        label: 'Take the physician’s almanac down from the shelf and read every page on fevers by candlelight until you find hers, and the treatment written under it.',
        told: 'read the physician’s almanac by candlelight until you found her fever and its treatment.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1 },
          background: { erudit: 1, aristocrat: 1 },
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
          talent: { pactbound: 1, necromancer: 1 },
          lineage: { celestial: 1 },
          skill: { healer: 1, empath: 1 },
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
          talent: { berserker: 1, brawler: 1, 'dragon-aspect': 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { 'quick-draw': 1, streetwise: 1 },
        },
      },
      {
        id: 'song',
        label: 'Stand up on the bench and start the harvest song at the top of your voice. The table joins in on the second line, and by the chorus nobody remembers what he was saying.',
        told: 'stood on the bench and started the harvest song, and by the chorus nobody remembered what he had been saying.',
        gives: {
          attribute: { instinct: 1 },
          talent: { virtuoso: 1 },
          lineage: { celestial: 1 },
          background: { entertainer: 1, aristocrat: 1 },
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
          talent: { tactician: 1 },
          background: { investigator: 1, entertainer: 1 },
          skill: { inquisitor: 1, empath: 1 },
        },
      },
      {
        id: 'cup',
        label: 'Refill his cup yourself, with a pinch of the valerian from your mother’s shelf stirred in. He is asleep with his head on the table inside a minute.',
        told: 'refilled his cup with a pinch of valerian stirred in, and he was asleep on the table inside a minute.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, trickster: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
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
          talent: { colossus: 1, runebearer: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, frugal: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'book',
        label: 'The book from the chest under the stairs, the one written in a hand that nobody in the house can read. You have looked at it every night for a year.',
        told: 'the book from under the stairs that nobody in the house could read.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1 },
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
          talent: { 'draconic-bond': 1, beastbond: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, helpful: 1 },
        },
      },
      {
        id: 'nothing',
        label: 'Nothing. You walk beside the cart with your hands free and your eyes on the hedgerows, and you are the first to see the men waiting at the ford.',
        told: 'nothing, and walked beside the cart with your hands free and your eyes on the hedgerows.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, wilder: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1 },
          skill: { vigilant: 1, survivalist: 1 },
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
          talent: { duelist: 1, 'flowing-fist': 1 },
          lineage: { skybound: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, vigilant: 1 },
        },
      },
      {
        id: 'stones',
        label: 'Go down to where the path fell and haul the stones back up, one at a time, until you have built enough of it again to walk across.',
        told: 'hauled the fallen stones back up one at a time and built the path again.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, runebearer: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1 },
          skill: { survivalist: 1, skilled: 1 },
        },
      },
      {
        id: 'read',
        label: 'Sit down and study the face for an hour, reading the fault lines and the water stains, until you have worked out the one route that will hold and the three that look easier and will not.',
        told: 'studied the face for an hour and worked out the one route that would hold.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1 },
          background: { investigator: 1 },
          skill: { cartographer: 1, scholar: 1 },
        },
      },
      {
        id: 'step',
        label: 'Step off the edge. You have never told anyone why you are so sure the wind will hold you, and it holds you.',
        told: 'stepped off the edge, and the wind held you, as you had always known it would.',
        tags: ['did:magic'],
        gives: {
          attribute: { instinct: 1 },
          lineage: { skybound: 1 },
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
          talent: { wilder: 1, 'feral-curse': 1 },
          lineage: { tidebound: 1 },
          background: { outlander: 1 },
          skill: { seafarer: 1, survivalist: 1 },
        },
      },
      {
        id: 'bank',
        label: 'Run the bank downstream faster than the water, wade in up to your chest where the river shallows over the gravel and catch the child as the current brings it to you.',
        told: 'ran the bank ahead of the current, waded in where it shallowed and caught the child as it came.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, colossus: 1 },
          lineage: { tidebound: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, seafarer: 1 },
        },
      },
      {
        id: 'rope',
        label: 'Grab the ferry rope off the post, loop it round your waist, throw the weighted end past the child and haul. Two people in the water is two people drowned.',
        told: 'looped the ferry rope round your waist, threw the weighted end past the child and hauled.',
        gives: {
          attribute: { mind: 1 },
          talent: { weaver: 1 },
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
          talent: { arcanist: 1, 'elemental-aspect': 1 },
          lineage: { tidebound: 1 },
          background: { erudit: 1 },
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
          talent: { colossus: 1, runebearer: 1 },
          lineage: { scorchbound: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, frugal: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'bare',
        label: 'Reach into the coals and pull the bar out with your bare hand to look at it. It is a moment before you notice you are holding it, and another before you think to let go.',
        told: 'pulled the glowing bar out of the coals with your bare hand, and only noticed afterwards.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1, painseeker: 1, hemoturgy: 1 },
          lineage: { scorchbound: 1, draconic: 1 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'study',
        label: 'Touch nothing. Study the colour of the steel, the quench trough and the way the tools are laid out in order of use, until you understand how the whole thing works and how you would do it better.',
        told: 'touched nothing, and studied the steel, the quench and the tools until you understood the whole of it.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1, spellblade: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, scholar: 1 },
        },
      },
      {
        id: 'chisel',
        label: 'Take the good chisel off the bench, the one with the ash handle, put it inside your coat and be out of the yard before his door opens.',
        told: 'took the good chisel off the bench and were out of the yard before his door opened.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
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
          talent: { berserker: 1, 'dragon-aspect': 1, 'draconic-bond': 1 },
          lineage: { draconic: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, survivalist: 1 },
        },
      },
      {
        id: 'eyes',
        label: 'Walk out to the edge of the light, crouch and meet the lead wolf’s eyes, and hold them. It knows you, or it knows what you are, and after a long moment it turns away.',
        told: 'walked to the edge of the light and held the lead wolf’s eyes until it turned away.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, 'draconic-bond': 1, beastbond: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, vigilant: 1 },
        },
      },
      {
        id: 'shield',
        label: 'Take the shield off the cart, put your back to the horses and stand between them and the dark, and let the wolves come to you if they are coming.',
        told: 'took the shield off the cart and stood between the horses and the dark.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, oathbound: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1 },
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
          talent: { alchemist: 1, enchanter: 1 },
          background: { erudit: 1 },
          skill: { apothecary: 1, scavenger: 1 },
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
          talent: { berserker: 1, painseeker: 1 },
          lineage: { undead: 1 },
          background: { mercenary: 1 },
          skill: { survivalist: 1, healer: 1 },
        },
      },
      {
        id: 'still',
        label: 'Lie still in the mud until the laughing has moved off down the road. Then get up and follow them, at a distance, until you know where every one of them sleeps.',
        told: 'lay still until they had gone, then followed them at a distance until you knew where they slept.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, 'feral-curse': 1 },
          lineage: { undead: 1 },
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
          talent: { alchemist: 1, thaumaturge: 1 },
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
          talent: { pactbound: 1, necromancer: 1 },
          lineage: { infernal: 1 },
          skill: { occultist: 1, empath: 1 },
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
          talent: { berserker: 1, brawler: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { 'quick-draw': 1, streetwise: 1 },
          weapon: { 'melee-light': 1 },
        },
      },
      {
        id: 'hour',
        label: 'Name the hour, tomorrow at dawn, and the place, and tell him to bring a second. Then go home and spend the evening with a whetstone. It will be done properly.',
        told: 'named the hour and the place and told him to bring a second, and it was done properly.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, 'weapon-master': 1 },
          lineage: { celestial: 1 },
          background: { aristocrat: 1, entertainer: 1 },
          skill: { 'quick-draw': 1, vigilant: 1 },
          weapon: { 'finesse-weapon': 1 },
        },
      },
      {
        id: 'laugh',
        label: 'Laugh, agree cheerfully with every word he has said about you and buy him a cup of cider from the stall. The crowd is laughing with you before he works out what has happened.',
        told: 'laughed, agreed with every word and bought him a cider, and the crowd was laughing with you before he understood.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { celestial: 1 },
          background: { entertainer: 1, merchant: 1 },
          skill: { charismatic: 1, empath: 1 },
        },
      },
      {
        id: 'walk',
        label: 'Turn round and walk away, with the whole square watching. There will be a night when he is alone on the mill road, and you already know which one.',
        told: 'walked away with the whole square watching, and waited for a night when he was alone.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1 },
          lineage: { infernal: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, vigilant: 1 },
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
          talent: { berserker: 1, brawler: 1 },
          lineage: { stonebound: 1 },
          background: { mercenary: 1 },
          skill: { scavenger: 1 },
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
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, skilled: 1 },
          weapon: { 'finesse-weapon': 1 },
        },
      },
      {
        id: 'acid',
        label: 'Take the vial of acid from your belt and pour it over the hinge pins, then wait with your sleeve over your face against the fumes until the metal is soft enough to lever the gate off.',
        told: 'poured the vial of acid over the hinge pins and levered the gate off when the metal had gone soft.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1, enchanter: 1 },
          background: { craftsman: 1 },
          skill: { apothecary: 1, skilled: 1 },
        },
      },
      {
        id: 'spell',
        label: 'Speak the words that let your hand pass through iron as if it were water, reach through the lock plate and turn the bolt from the other side.',
        told: 'spoke the words that let your hand pass through iron and turned the bolt from the other side.',
        gives: {
          attribute: { mind: 2 },
          talent: { thaumaturge: 1, spellblade: 1 },
          background: { erudit: 1 },
          skill: { 'innate-spell-novice': 1, occultist: 1 },
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
          talent: { alchemist: 1, thaumaturge: 1 },
          lineage: { celestial: 1 },
          background: { erudit: 1 },
          skill: { healer: 1, physician: 1 },
        },
      },
      {
        id: 'carry',
        label: 'Get him over your shoulder and carry him the three streets to the watch house yourself. Waiting for the watch to come to him would take longer than he has.',
        told: 'got him over your shoulder and carried him three streets to the watch house.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, painseeker: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { helpful: 1, healer: 1 },
        },
      },
      {
        id: 'pockets',
        label: 'Kneel beside him as if to help, check his pulse with one hand and his purse with the other, and be three streets away with the purse before anyone looks twice.',
        told: 'knelt as if to help, took his purse while you checked his pulse and were gone before anyone looked twice.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { infernal: 1 },
          background: { criminal: 1 },
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
          background: { investigator: 1 },
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
          talent: { arcanist: 1, enchanter: 1 },
          background: { erudit: 1, aristocrat: 1 },
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
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, merchant: 1 },
          skill: { cunning: 1, haggler: 1 },
        },
      },
      {
        id: 'lock',
        label: 'Leave the books alone. In the morning, sell him the lock off your own bag for three times what it cost you. Then sell him a strongbox to put it on.',
        told: 'left the books alone and sold him a lock in the morning at three times its cost.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, entertainer: 1 },
          skill: { haggler: 1, skilled: 1 },
        },
      },
      {
        id: 'door',
        label: 'Drag a chair to the foot of the stairs and sit in it with your back to the trunk until he comes down. Somebody in this inn should.',
        told: 'sat with your back to the trunk until he came down in the morning.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, oathbound: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
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
          talent: { 'draconic-bond': 1, beastbond: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, healer: 1 },
        },
      },
      {
        id: 'end',
        label: 'End it with one clean blow of the hatchet, quickly, before it suffers any longer. Take the meat and the pelt so that none of it is wasted.',
        told: 'ended it with one clean blow of the hatchet and took the meat and the pelt.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1, painseeker: 1, 'weapon-master': 1 },
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
          talent: { alchemist: 1, enchanter: 1 },
          background: { erudit: 1 },
          skill: { apothecary: 1, physician: 1 },
        },
      },
      {
        id: 'bind',
        label: 'Drop your coat over its head, bind the jaws with a bootlace before it can get free of the cloth, then free the leg and pack the wound with the moss the old trapper showed you.',
        told: 'dropped your coat over its head, bound the jaws with a bootlace and packed the wound with moss.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, wilder: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
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
          talent: { duelist: 1, 'flowing-fist': 1 },
          lineage: { skybound: 1 },
          background: { criminal: 1, entertainer: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'warrant',
        label: 'Open the door, ask to see the warrant and read it slowly in front of them. It names the wrong street, and you point that out.',
        told: 'opened the door, read the warrant slowly and pointed out that it named the wrong street.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1 },
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
          talent: { berserker: 1, brawler: 1 },
          lineage: { undead: 1 },
          background: { mercenary: 1 },
          skill: { vigilant: 1, streetwise: 1 },
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
          skill: { haggler: 1, streetwise: 1 },
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
          talent: { arcanist: 1, enchanter: 1 },
          lineage: { celestial: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'burn',
        label: 'Put the letter in the fire and watch the grey wax run. Nothing that has watched you from a distance for years means you any good, and you leave the district that week.',
        told: 'put the letter in the fire and left the district that week.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'feral-curse': 1, mycomancer: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { vigilant: 1, survivalist: 1 },
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
          background: { merchant: 1, aristocrat: 1 },
          skill: { haggler: 1, scholar: 1 },
        },
      },
      {
        id: 'nail',
        label: 'Walk to the academy, nail the letter to its front door with your own knife and stand beside it in the rain until somebody comes out to explain.',
        told: 'nailed the letter to the academy’s door with your knife and stood beside it until somebody came out to explain.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, berserker: 1 },
          lineage: { draconic: 1 },
          background: { military: 1 },
          skill: { vigilant: 1 },
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
          talent: { runebearer: 1, painseeker: 1 },
          lineage: { stonebound: 1 },
          background: { mercenary: 1 },
          skill: { survivalist: 1, healer: 1 },
        },
      },
      {
        id: 'watch',
        label: 'Give up your place in the queue and watch from the corner instead, for as long as they will have you there. By the third man you know the order the lines go on and which of them the word is said over.',
        told: 'gave up your place and watched from the corner until you knew the order the lines went on.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, spellblade: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'wrist',
        label: 'Hold out one hand and ask for something small on the inside of the wrist, where a sleeve covers it. You are out in a quarter of an hour and nobody on the street is any the wiser.',
        told: 'took something small on the inside of your wrist where a sleeve covers it, and were out in a quarter of an hour.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, entertainer: 1 },
          skill: { streetwise: 1, cunning: 1 },
        },
      },
      {
        id: 'price',
        label: 'Ask what the word costs on its own, without the rune. They laugh, and then they see that you are serious, and the price they name is most of what you have on you.',
        told: 'asked what the word cost on its own, and paid most of what you had for it.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1, spellblade: 1 },
          lineage: { infernal: 1 },
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
          talent: { spellblade: 1, weaver: 1 },
          background: { mercenary: 1 },
          skill: { occultist: 1, 'quick-draw': 1 },
        },
      },
      {
        id: 'book',
        label: 'Take the mornings. The blade is a thing anybody can be taught and the other half is not, and you would rather have the half that takes a lifetime.',
        told: 'took the mornings, because the blade is a thing anybody can be taught and the other half is not.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, enchanter: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'blade',
        label: 'Take the afternoons, and ask him to stop going easy. By spring you can put him on his back twice in five, which he says is two more than he expected and one fewer than he wanted.',
        told: 'took the afternoons and asked him to stop going easy, until you could put him on his back twice in five.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, 'weapon-master': 1, 'flowing-fist': 1 },
          lineage: { wildheart: 1 },
          background: { military: 1, mercenary: 1 },
          skill: { vigilant: 1, 'quick-draw': 1 },
        },
      },
      {
        id: 'coat',
        label: 'Ask him instead where a man learns to be two things at once, and who paid for it. He does not answer, and the not-answering is the most interesting thing that happens to you all year.',
        told: 'asked him where a man learns to be two things at once and who paid for it, and read everything in the not-answering.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1 },
          lineage: { fey: 1 },
          background: { investigator: 1, entertainer: 1 },
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
          talent: { guardian: 1, quartermaster: 1 },
          lineage: { scorchbound: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
        },
      },
      {
        id: 'calm',
        label: 'Watch the crowd rather than the fire. One man is watching it far too calmly, and you follow him home afterwards and learn his name.',
        told: 'watched the crowd rather than the fire, and followed the one man who was watching too calmly.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { luminary: 1 },
          background: { investigator: 1 },
          skill: { inquisitor: 1, cunning: 1 },
        },
      },
      {
        id: 'salvage',
        label: 'Find the owner and buy the salvage rights off him for ready money while the roof is still falling in. The iron alone in there is worth ten times what you pay.',
        told: 'bought the salvage rights off the owner for ready money while the roof was still falling in.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, aristocrat: 1 },
          skill: { haggler: 1, frugal: 1 },
        },
      },
      {
        id: 'keep',
        label: 'Go in through the loading door at the back while everyone is watching the front, and carry out whatever is not yet burning. Bolts of cloth mostly, and one small chest.',
        told: 'went in through the loading door while everyone watched the front and carried out what was not yet burning.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { scorchbound: 1 },
          background: { criminal: 1 },
          skill: { streetwise: 1, scavenger: 1 },
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
          talent: { colossus: 1, runebearer: 1, weaver: 1 },
          lineage: { stalwart: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, tailor: 1 },
        },
      },
      {
        id: 'price',
        label: 'Name a price for the fixing before you touch anything, and when the lord shouts at you, double it. He pays.',
        told: 'named a price before you touched anything, and doubled it when he shouted.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1 },
          skill: { haggler: 1, frugal: 1 },
        },
      },
      {
        id: 'house',
        label: 'Address him by his house and his father’s name, and ask after his mother’s health. The shouting stops, and he offers you the seat beside him into town.',
        told: 'addressed him by his house and his father’s name, and the shouting stopped.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1 },
          lineage: { celestial: 1 },
          background: { aristocrat: 1, entertainer: 1 },
          skill: { charismatic: 1, empath: 1 },
        },
      },
      {
        id: 'lift',
        label: 'Take hold of the back of the carriage and lift it clear of the ground while the coachman sets the wheel. It is quicker than the jack, and he does not stop staring for a mile.',
        told: 'lifted the back of the carriage clear of the ground while the coachman set the wheel.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, totemic: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1 },
          skill: { helpful: 1, skilled: 1 },
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
          lineage: { celestial: 1 },
          background: { entertainer: 1, merchant: 1 },
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
          talent: { berserker: 1, painseeker: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { charismatic: 1, vigilant: 1 },
        },
      },
      {
        id: 'almanac',
        label: 'Take the almanac out of your pack and read them the weather for the week and the prices at the next three markets, which is what a room full of drovers actually wants to know.',
        told: 'read them the almanac’s weather and the prices at the next three markets.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1, merchant: 1 },
          skill: { scholar: 1, cartographer: 1 },
        },
      },
      {
        id: 'road',
        label: 'Finish your drink, pick up your pack and slip out the back into the dark. You were only ever passing through, and the road is quieter than a room.',
        told: 'slipped out the back into the dark, because the road was quieter than the room.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, 'feral-curse': 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, cunning: 1 },
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
          talent: { alchemist: 1, necromancer: 1 },
          lineage: { luminary: 1 },
          background: { investigator: 1 },
          skill: { inquisitor: 1, physician: 1 },
        },
      },
      {
        id: 'search',
        label: 'Take the purse, go through his coat for papers and walk away whistling. He has no more use for any of it.',
        told: 'took the purse, went through his coat for papers and walked away whistling.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { undead: 1 },
          background: { criminal: 1 },
          skill: { streetwise: 1, scavenger: 1 },
        },
      },
      {
        id: 'carry',
        label: 'Lift him out of the wet, carry him round to the guildhall steps and sit with him there until the porter comes to open up. Nobody should lie in an alley.',
        told: 'carried him round to the guildhall steps and sat with him until the porter came.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, runebearer: 1 },
          lineage: { celestial: 1 },
          background: { craftsman: 1 },
          skill: { helpful: 1, healer: 1 },
        },
      },
      {
        id: 'seal',
        label: 'Send the potboy running to the magistrate with a note under your family’s seal. A dead man in an alley is nothing. A dead man reported by your house is a matter.',
        told: 'sent word to the magistrate under your family’s seal, so that it would be a matter.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1, necromancer: 1 },
          lineage: { luminary: 1 },
          background: { aristocrat: 1, merchant: 1, entertainer: 1 },
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
          talent: { trickster: 1, 'feral-curse': 1 },
          lineage: { undead: 1 },
          background: { criminal: 1, merchant: 1 },
          skill: { cunning: 1, vigilant: 1 },
        },
      },
      {
        id: 'roar',
        label: 'Roar, drag your blade out and go straight through the man in the middle before he has finished his sentence. The other two are running by the time he hits the ground.',
        told: 'roared and went straight through the man in the middle, and the other two ran.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, brawler: 1, 'dragon-aspect': 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { 'quick-draw': 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'guard',
        label: 'Put your back to the milestone, get the shield up and your feet set, and let them come to you one at a time, because on this road they cannot come any other way.',
        told: 'put your back to the milestone, got the shield up and let them come one at a time.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, oathbound: 1 },
          lineage: { stonebound: 1 },
          background: { military: 1 },
          skill: { vigilant: 1 },
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
          talent: { arcanist: 1, thaumaturge: 1, 'elemental-aspect': 1 },
          lineage: { celestial: 1 },
          background: { erudit: 1 },
          skill: { 'unseen-spellwork': 1, 'innate-spell-novice': 1 },
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
          talent: { berserker: 1, brawler: 1, painseeker: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { 'quick-draw': 1, streetwise: 1 },
          weapon: { 'melee-light': 1 },
        },
      },
      {
        id: 'outside',
        label: 'Stand up, name him and invite him outside to settle it properly, with a witness each and first blood. He goes a little pale. He comes.',
        told: 'stood up, named him and invited him outside to settle it with first blood.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, 'weapon-master': 1 },
          lineage: { celestial: 1 },
          background: { aristocrat: 1, entertainer: 1 },
          skill: { 'quick-draw': 1, vigilant: 1 },
          weapon: { 'finesse-weapon': 1 },
        },
      },
      {
        id: 'drink',
        label: 'Laugh, call for two cups and sit down opposite him. Inside a quarter of an hour you know who is paying him to pick this fight, and he does not know that he told you.',
        told: 'laughed, bought him a cup and found out who was paying him inside a quarter of an hour.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { luminary: 1 },
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
          talent: { 'cauldron-keeper': 1, trickster: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
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
          talent: { berserker: 1, painseeker: 1 },
          lineage: { tidebound: 1 },
          background: { outlander: 1 },
          skill: { seafarer: 1, survivalist: 1 },
        },
      },
      {
        id: 'tree',
        label: 'Take the axe to the tallest alder on the bank, fell it across the narrows and walk over on the trunk.',
        told: 'felled the tallest alder across the narrows and walked over on the trunk.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 1, runebearer: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1 },
          skill: { survivalist: 1, skilled: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'ford',
        label: 'Read the water. Smooth brown water is deep and white water over gravel is not. A mile upstream you find the ford the drovers use.',
        told: 'read the water and found the drovers’ ford a mile upstream.',
        gives: {
          attribute: { instinct: 1 },
          talent: { wilder: 1, 'feral-curse': 1 },
          lineage: { wildheart: 1, tidebound: 1 },
          background: { investigator: 1 },
          skill: { cartographer: 1, survivalist: 1 },
        },
      },
      {
        id: 'spell',
        label: 'Kneel at the water’s edge and speak the words that pull the cold out of the air. A bridge of ice creaks across the river, and it holds just long enough.',
        told: 'spoke the words that pulled the cold out of the air, and crossed on a bridge of ice that held just long enough.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, 'elemental-aspect': 1 },
          lineage: { tidebound: 1 },
          background: { erudit: 1 },
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
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { entertainer: 1 },
          skill: { cunning: 1, charismatic: 1 },
        },
      },
      {
        id: 'truth',
        label: 'Tell the truth, all of it, in plain words. Let the magistrate do what he will with it. You have never learned to do anything else with your hand on a book.',
        told: 'told the truth, all of it, in plain words and let the magistrate do what he would.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, oathbound: 1 },
          lineage: { celestial: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
        },
      },
      {
        id: 'deflect',
        label: 'Answer a slightly different question, at length, about the ninth bell and who else was on the bridge road, until the magistrate is asking you about the bridge road and has forgotten what he first asked.',
        told: 'answered a different question at length, until the magistrate had forgotten what he first asked.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1, spellquill: 1 },
          lineage: { infernal: 1 },
          background: { aristocrat: 1, investigator: 1, entertainer: 1 },
          skill: { mastermind: 1, empath: 1 },
        },
      },
      {
        id: 'nothing',
        label: 'Say nothing at all. Stand there with your hand on the book while he asks it four more times, and let the silence do the work until he gives up.',
        told: 'said nothing at all while he asked it four more times, until he gave up.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 1, runebearer: 1 },
          lineage: { stonebound: 1 },
          background: { mercenary: 1 },
          skill: { vigilant: 1 },
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
          talent: { tactician: 1 },
          lineage: { luminary: 1 },
          background: { merchant: 1, aristocrat: 1, entertainer: 1 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'take',
        label: 'Knock over the tray of buckles at the end of the stall, and while he is on his knees picking them up, take the awl and walk on.',
        told: 'knocked over his tray of buckles and took the awl while he was picking them up.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, merchant: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'make',
        label: 'Walk away, buy a nail from the smith for a copper and spend the evening at the inn fire grinding and tempering it into an awl that is better than his.',
        told: 'bought a nail for a copper and spent the evening grinding and tempering it into a better awl.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 1, spellblade: 1 },
          lineage: { scorchbound: 1 },
          background: { craftsman: 1, merchant: 1 },
          skill: { skilled: 1, frugal: 1 },
        },
      },
      {
        id: 'without',
        label: 'Put your broken one back in your pocket and walk on. You have mended harness with a thorn before, and you will do it again.',
        told: 'kept your broken one and walked on, and mended the harness with a thorn.',
        gives: {
          attribute: { physique: 1 },
          talent: { runebearer: 1, quartermaster: 1, weaver: 1 },
          lineage: { undead: 1 },
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
          talent: { thaumaturge: 1, spellblade: 1 },
          lineage: { celestial: 1 },
          background: { erudit: 1 },
          skill: { 'innate-spell-novice': 1, occultist: 1 },
          weapon: { 'fire-wand': 1 },
        },
      },
      {
        id: 'apart',
        label: 'Take it apart that night with your knife, the pale wood, the silver wire in the core and the stone at the tip, to see how it was made. Then put it back together better.',
        told: 'took it apart that night to see how it was made, and put it back together better.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 1, spellblade: 1 },
          lineage: { luminary: 1 },
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
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { merchant: 1, entertainer: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
      {
        id: 'snap',
        label: 'Snap it over your knee and throw the halves into the ditch. Nothing good follows a dead mage’s things, and you would rather trust your own two hands.',
        told: 'snapped it over your knee and threw the halves in the ditch.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1, runebearer: 1, brawler: 1 },
          lineage: { undead: 1 },
          background: { mercenary: 1 },
          skill: { 'spell-eater': 1, vigilant: 1 },
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
          talent: { duelist: 1, 'flowing-fist': 1 },
          lineage: { skybound: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, survivalist: 1 },
        },
      },
      {
        id: 'knock',
        label: 'Beat on the gate with the flat of your hand, then with a stone. Keep on until the watchman opens it to make you stop, which he does.',
        told: 'beat on the gate with a stone until the watchman opened it to make you stop.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, berserker: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'bribe',
        label: 'Go back to the grille, slide two silver through it and talk about how cold the night is. The postern opens a minute later. It is what the watch is for.',
        told: 'slid two silver through the grille, and the postern opened a minute later.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
      {
        id: 'hedge',
        label: 'Walk back down the road to the hedge you passed, get in under it out of the wind and sleep until the gate opens. You have slept in worse.',
        told: 'slept under a hedge out of the wind until the gate opened.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'feral-curse': 1, mycomancer: 1 },
          lineage: { wildheart: 1, wildkin: 1 },
          background: { outlander: 1 },
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
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, merchant: 1, entertainer: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'owner',
        label: 'Look for the owner. The seal on the purse is a merchant’s. You ask after it at the next three inns. By nightfall you have handed it back to a woman who cries when she sees it.',
        told: 'asked at three inns after the seal on the purse and handed it back to a woman who cried.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, spellquill: 1 },
          lineage: { celestial: 1 },
          background: { investigator: 1, merchant: 1 },
          skill: { helpful: 1, inquisitor: 1 },
        },
      },
      {
        id: 'split',
        label: 'Count it out on the stile into equal shares, one for you and one for each of the two people walking with you. Shares keep friends, and friends keep you alive.',
        told: 'counted it into equal shares on the stile, one for each of you.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, quartermaster: 1 },
          lineage: { wildheart: 1 },
          background: { mercenary: 1, entertainer: 1 },
          skill: { charismatic: 1, frugal: 1 },
        },
      },
      {
        id: 'bait',
        label: 'Put it back exactly where it lay and walk on. A purse of gold in the grass by an empty road is bait, and you would rather not meet whoever set it.',
        told: 'put it back exactly where it lay, because gold like that is bait.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, runebearer: 1, oathbound: 1 },
          lineage: { stonebound: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, frugal: 1 },
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
          talent: { 'cauldron-keeper': 1, wilder: 1 },
          lineage: { wildheart: 1, wildkin: 1 },
          background: { outlander: 1 },
          skill: { apothecary: 1, healer: 1 },
        },
      },
      {
        id: 'nurse',
        label: 'Go from house to house with water, cold cloths and a steady voice, and sit with the worst of them through the nights. You do not sleep for four days.',
        told: 'went from house to house with water and cold cloths, and did not sleep for four days.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1, thaumaturge: 1, necromancer: 1 },
          lineage: { celestial: 1 },
          background: { investigator: 1 },
          skill: { healer: 1, physician: 1 },
        },
      },
      {
        id: 'water',
        label: 'Ask which houses are sick and which are not, and chalk the answers on the back of a door until the pattern shows you which well is the cause. You have it boarded over by morning.',
        told: 'worked out from which houses were sick which well was the cause, and had it boarded over by morning.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1 },
          lineage: { luminary: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { scholar: 1, physician: 1 },
        },
      },
      {
        id: 'line',
        label: 'Take a post on the road at the eastern end and hold the line. Nobody goes out and nobody comes in, however much they beg, until the headman says the fever has passed.',
        told: 'held the line on the eastern road until the fever had passed.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, oathbound: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
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
          talent: { guardian: 1, runebearer: 1, 'weapon-master': 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, frugal: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'perimeter',
        label: 'Leave the fire and walk the edge of the camp in the dark, slowly, stopping often to listen. Something is always out there, and tonight you want to know what.',
        told: 'walking the edge of the camp in the dark, stopping to listen.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, wilder: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, vigilant: 1 },
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
          background: { erudit: 1, investigator: 1, aristocrat: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'creature',
        label: 'Sit with the creature that travels with you, its head on your knee. Say nothing at all until the moon goes down. It watches the dark for both of you.',
        told: 'sitting with the creature that travels with you until the moon went down.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'draconic-bond': 1, 'feral-curse': 1, beastbond: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { empath: 1, survivalist: 1 },
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
          talent: { tactician: 1 },
          lineage: { celestial: 1 },
          background: { merchant: 1, aristocrat: 1, entertainer: 1 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'lift',
        label: 'Take him under the arms, lift him off his feet and set him down gently on the other side of the road, then walk across.',
        told: 'lifted him off his feet, set him down on the other side of the road and walked across.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, brawler: 1 },
          lineage: { stalwart: 1 },
          background: { mercenary: 1 },
          skill: { helpful: 1 },
        },
      },
      {
        id: 'wade',
        label: 'Nod and walk back the way you came until the bend hides you. Then wade the river under the bridge while he is still working out the arithmetic.',
        told: 'walked back to the bend and waded the river under the bridge.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, wilder: 1 },
          lineage: { tidebound: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, survivalist: 1 },
        },
      },
      {
        id: 'flask',
        label: 'Offer him a drink from your flask against the cold. The brew in it is your own, and he will not remember you passing, or much else about the afternoon.',
        told: 'offered him a drink from your flask, and he did not remember you passing.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, trickster: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
          skill: { apothecary: 1, cunning: 1 },
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
          talent: { guardian: 1, oathbound: 1 },
          lineage: { celestial: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
        },
      },
      {
        id: 'wrist',
        label: 'Take his wrist as he reaches for the child and hold it. Look at him without a word until he decides to be somewhere else.',
        told: 'took his wrist as he reached, and looked at him until he decided to be somewhere else.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, 'feral-curse': 1, 'flowing-fist': 1 },
          lineage: { wildkin: 1 },
          background: { mercenary: 1, investigator: 1 },
          skill: { vigilant: 1, 'quick-draw': 1 },
        },
      },
      {
        id: 'call',
        label: 'Lift the child onto a barrel and call its description across the whole market in a voice that carries to the far stalls. Crowds find mothers, and the man melts into this one.',
        told: 'lifted the child onto a barrel and called its description across the market until the mother came.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1 },
          lineage: { celestial: 1 },
          background: { entertainer: 1, aristocrat: 1 },
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
          lineage: { undead: 1 },
          background: { investigator: 1 },
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
          talent: { colossus: 1, painseeker: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1 },
          skill: { helpful: 1, survivalist: 1 },
        },
      },
      {
        id: 'baby',
        label: 'Put the baby inside your coat against your chest and walk into the wind to the next farm, two miles in the dark. You know the way without seeing it.',
        told: 'put the baby inside your coat and walked two miles into the wind to the next farm.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'feral-curse': 1, wilder: 1, 'draconic-bond': 1 },
          lineage: { skybound: 1 },
          background: { military: 1 },
          skill: { survivalist: 1, cartographer: 1 },
        },
      },
      {
        id: 'fire',
        label: 'Get everyone down into the cellar and make a fire out of wet wood, a handful of the powder from your pouch and nothing else, and have them warm inside the quarter hour.',
        told: 'got everyone into the cellar and made a fire out of wet wood and a handful of your powder.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1, 'elemental-aspect': 1 },
          lineage: { scorchbound: 1 },
          background: { craftsman: 1 },
          skill: { survivalist: 1, skilled: 1 },
        },
      },
      {
        id: 'speak',
        label: 'Stand in the middle of the yard with your face to the wind and speak to the storm, the way you did once before. It listens, a little. The wind drops enough to work in.',
        told: 'stood in the yard and spoke to the storm, and it listened a little.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, 'elemental-aspect': 1 },
          lineage: { skybound: 1 },
          background: { erudit: 1 },
          skill: { 'innate-spell-novice': 1, occultist: 1 },
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
          talent: { berserker: 1, brawler: 1, painseeker: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { 'quick-draw': 1, streetwise: 1 },
        },
      },
      {
        id: 'table',
        label: 'Turn the table over between them and the rest of the room, so that whatever happens next happens to you and not to the people behind you.',
        told: 'turned the table over between them and the room.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, oathbound: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'window',
        label: 'Be out through the window behind you before he has finished pointing. You have paid for the drink, and the alley is dark.',
        told: 'were out through the window behind you before he had finished pointing.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, 'flowing-fist': 1 },
          lineage: { skybound: 1 },
          background: { criminal: 1, entertainer: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'drink',
        label: 'Call for five cups, wave them over to your table and ask after his mother, by name, because you remember it. It is very hard to hit a man who remembers your mother’s name.',
        told: 'bought all five of them a drink and asked after his mother by name.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { celestial: 1 },
          background: { merchant: 1, entertainer: 1 },
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
          talent: { runebearer: 1, hemoturgy: 1, painseeker: 1 },
          lineage: { undead: 1 },
          background: { mercenary: 1 },
          skill: { healer: 1, physician: 1 },
        },
      },
      {
        id: 'vial',
        label: 'Get the small green bottle off your belt, tip half of it into the wound and the other half into him. It burns going in and he screams the yard down, and then the bleeding slows.',
        told: 'tipped half a green bottle into the wound and the other half into the man, and the bleeding slowed.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1, thaumaturge: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { apothecary: 1, physician: 1 },
        },
      },
      {
        id: 'axle',
        label: 'Get your shoulder under the axle and stand up with it, and keep standing while two of them drag him clear. Nobody thinks to count how long you hold it.',
        told: 'got your shoulder under the axle and stood up with it until they had dragged him clear.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, totemic: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1 },
          skill: { helpful: 1, healer: 1 },
        },
      },
      {
        id: 'strap',
        label: 'Cut a strap off the harness, get it round the thigh above the wound and twist it down with the handle of your knife until the bleeding stops. It takes you eleven seconds.',
        told: 'cut a strap off the harness and twisted a tourniquet down on the leg with your knife handle.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, 'flowing-fist': 1, weaver: 1 },
          lineage: { wildheart: 1 },
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
          talent: { spellblade: 1, weaver: 1 },
          lineage: { luminary: 1 },
          background: { mercenary: 1 },
          skill: { vigilant: 1, occultist: 1 },
        },
      },
      {
        id: 'far',
        label: 'Get distance. Back off past the wagon, get the width of the yard between you and it, and put everything you have into the space it has to cross to reach you.',
        told: 'backed off past the wagon and filled the ground it had to cross to reach you.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, 'elemental-aspect': 1, thaumaturge: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { occultist: 1, 'unseen-spellwork': 1 },
        },
      },
      {
        id: 'lantern',
        label: 'Go for the lantern instead. Thirty paces back, up onto the wagon and swing it round so the whole tail of the caravan is lit, and let the six people with spears do what six people with spears are for.',
        told: 'went thirty paces back for the lantern and lit the whole tail of the caravan for the people with spears.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, quartermaster: 1 },
          lineage: { scorchbound: 1 },
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
          talent: { mycomancer: 1, wilder: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
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
          talent: { guardian: 1, painseeker: 1 },
          lineage: { scorchbound: 1 },
          background: { military: 1 },
          skill: { helpful: 1, healer: 1 },
        },
      },
      {
        id: 'lit',
        label: 'Keep walking, and do not look round. You lit it, and the flask that did it is empty in your pocket.',
        told: 'kept walking without looking round. You lit it.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1 },
          lineage: { scorchbound: 1 },
          background: { criminal: 1 },
          skill: { apothecary: 1, cunning: 1 },
        },
      },
      {
        id: 'watch',
        label: 'Stand in the road and watch until the roof falls in and the walls go. You needed to see it end, and then you go.',
        told: 'stood in the road and watched until the walls went, and then left.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1, runebearer: 1, painseeker: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { vigilant: 1 },
        },
      },
      {
        id: 'run',
        label: 'Run, with the hound at your heel and nothing in your hands, down the lane and over the fields, and do not stop until dawn.',
        told: 'ran with the hound at your heel and did not stop until dawn.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'draconic-bond': 1, 'feral-curse': 1, wilder: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1, criminal: 1 },
          skill: { survivalist: 1, cunning: 1 },
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
          talent: { colossus: 1, berserker: 1, 'weapon-master': 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { frugal: 1 },
          weapon: { 'melee-great': 1 },
        },
      },
      {
        id: 'blades',
        label: 'The blade from under the bed and its twin from the chest, one in each hand. Not one thing more.',
        told: 'the blade from under the bed and its twin from the chest, and nothing more.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, 'weapon-master': 1, 'flowing-fist': 1 },
          lineage: { wildheart: 1 },
          background: { mercenary: 1, criminal: 1 },
          skill: { 'quick-draw': 1 },
          weapon: { 'paired-finesse': 1 },
        },
      },
      {
        id: 'book',
        label: 'The book you were never supposed to have, from under the loose board by the window, wrapped in your spare shirt.',
        told: 'the book you were never supposed to have, wrapped in your spare shirt.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, spellquill: 1 },
          lineage: { celestial: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { occultist: 1, scholar: 1 },
          weapon: { 'psychic-tome': 1 },
        },
      },
      {
        id: 'shield',
        label: 'The shield from the wall, with a name painted on the inside of it that is not yours yet.',
        told: 'the shield from the wall, with a name inside it that was not yours yet.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, runebearer: 1, oathbound: 1 },
          lineage: { celestial: 1 },
          background: { military: 1 },
          skill: { vigilant: 1 },
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
          talent: { 'cauldron-keeper': 1, wilder: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1 },
          skill: { apothecary: 1, scavenger: 1 },
        },
      },
      {
        id: 'pistol',
        label: 'The pistol from the drawer, the lantern and the folded list of names you have been keeping since the winter.',
        told: 'the pistol, the lantern and the list of names.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, sharpshooter: 1 },
          lineage: { wildheart: 1, undead: 1 },
          background: { investigator: 1 },
          skill: { vigilant: 1, inquisitor: 1 },
          weapon: { 'flintlock-pistol': 1 },
        },
      },
      {
        id: 'contract',
        label: 'The contract from the bottom of the chest, the one signed in something that was not ink, in a hand that was not quite yours.',
        told: 'the contract signed in something that was not ink.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1, necromancer: 1 },
          lineage: { infernal: 1, undead: 1 },
          background: { aristocrat: 1 },
          skill: { occultist: 1 },
        },
      },
      {
        id: 'nothing',
        label: 'Nothing. You pull the straps tight over what is already there and go. Your two hands and the anger have always been enough.',
        told: 'nothing at all, because your hands and the anger had always been enough.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, brawler: 1, painseeker: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1, criminal: 1 },
          skill: { frugal: 1 },
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
          talent: { guardian: 1, oathbound: 1 },
          lineage: { stonebound: 1 },
          background: { military: 1 },
          skill: { vigilant: 1 },
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
          talent: { berserker: 1, brawler: 1, 'dragon-aspect': 1 },
          lineage: { draconic: 1, undead: 1 },
          background: { mercenary: 1, criminal: 1 },
          skill: { 'quick-draw': 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'behind',
        label: 'Before it starts. While they were looking at where you had been standing, you were already behind them. Then it was over.',
        told: 'before it started, because you were already behind them.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, 'flowing-fist': 1 },
          lineage: { skybound: 1 },
          background: { criminal: 1, entertainer: 1 },
          skill: { cunning: 1, 'quick-draw': 1 },
        },
      },
      {
        id: 'fire',
        label: 'With the far end of the alley on fire, the two of them running from it, and you having touched neither of them.',
        told: 'with the alley on fire and you having touched neither of them.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, 'elemental-aspect': 1 },
          lineage: { scorchbound: 1 },
          background: { erudit: 1, criminal: 1 },
          skill: { 'unseen-spellwork': 1, occultist: 1 },
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
          talent: { mycomancer: 1, 'feral-curse': 1, 'draconic-bond': 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, scavenger: 1 },
        },
      },
      {
        id: 'city',
        label: 'To the city. There is work there for someone who can make things, and a bench and a fire to make them at.',
        told: 'the city road, where there was work for someone who could make things.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1, spellblade: 1 },
          lineage: { luminary: 1 },
          background: { craftsman: 1, merchant: 1 },
          skill: { skilled: 1, haggler: 1 },
        },
      },
      {
        id: 'pass',
        label: 'Up into the pass. Whatever is on the other side of the mountain, you can carry what you need to get there on your own back.',
        told: 'the pass, carrying what you needed on your own back.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 1, runebearer: 1 },
          lineage: { stonebound: 1 },
          background: { mercenary: 1 },
          skill: { survivalist: 1, frugal: 1 },
        },
      },
      {
        id: 'sea',
        label: 'Down to the coast, and the first ship that will take a hand. You have never once been afraid of deep water.',
        told: 'the coast road and the first ship that would take a hand.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, wilder: 1 },
          lineage: { tidebound: 1 },
          background: { merchant: 1 },
          skill: { seafarer: 1, cartographer: 1 },
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
          talent: { necromancer: 1 },
          lineage: { undead: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { occultist: 1, empath: 1 },
        },
      },
      {
        id: 'hands',
        label: 'Say nothing and lift. Two a trip and forty by Friday, and the only thing you decide all week is where your hands go so that nothing comes apart on the way.',
        told: 'said nothing and lifted, two a trip and forty by Friday.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, runebearer: 1 },
          lineage: { undead: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, helpful: 1 },
        },
      },
      {
        id: 'why',
        label: 'Start opening them instead. You want to know why it took the miller in a night and left his wife, and by the end of the week you have a fair guess and a smell you cannot wash out.',
        told: 'started opening them instead, to find out why it took the miller in a night and left his wife.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1, necromancer: 1 },
          lineage: { undead: 1 },
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
          talent: { mycomancer: 1, wilder: 1 },
          lineage: { fey: 1 },
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
          talent: { necromancer: 1, spellquill: 1 },
          lineage: { infernal: 1 },
          background: { erudit: 1, investigator: 1, aristocrat: 1 },
          skill: { mastermind: 1, occultist: 1 },
        },
      },
      {
        id: 'foreman',
        label: 'Take the foreman apart in front of his own crew, sober him up in the trough and put the work back on its feet by making the whole village afraid of you instead of the thaw.',
        told: 'took the foreman apart in front of his crew and put the work back on its feet.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, brawler: 1 },
          lineage: { draconic: 1 },
          background: { military: 1 },
          skill: { charismatic: 1, vigilant: 1 },
        },
      },
      {
        id: 'stone',
        label: 'Look at what they have actually built and find the four places it is wrong. Fixing those saves them the nine men, and the foreman never forgives you for it.',
        told: 'found the four places the bridge was wrong, which saved them the nine men and cost you the foreman.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 1 },
          lineage: { stonebound: 1 },
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
          talent: { pactbound: 1, virtuoso: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1 },
          skill: { haggler: 1, cunning: 1 },
        },
      },
    ],
  },

  {
    /* The Spellquill's own scene, added 2026-09-09 with the set. The pool scores
       plenty of people who *learn* magic and nobody who copies it: every Mind
       answer in it is somebody reading for themselves, and this set is somebody
       writing for other people. So the scene is a scriptorium with one page in it
       that is not a prayer, and the answers are the four things a child does with
       a page nobody has noticed. */
    id: 'youth-scriptorium',
    stage: 'youth',
    scene:
      'The abbey pays in bread for a copyist with a steady hand, and yours is steady. Forty prayers a week, and then a page turns up in the pile that is not a prayer at all: it is instructions, and the last line of it is a thing that will happen if the words are said in the right order.',
    asks: 'What do you do?',
    recall: 'In the abbey scriptorium, over the page that was not a prayer, you',
    options: [
      {
        id: 'copy',
        label: 'Copy it. You never do learn it, but you can see the shape of how it works. By the third copy you have made one that a carter who cannot read at all says out loud, and it happens anyway.',
        told: 'copied the page until a carter who could not read said it out loud and it happened anyway.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1, enchanter: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'learn',
        label: 'Learn it, properly, the way it is meant to be learned. It takes eleven weeks and at the end of them the page is nothing you need, because the whole of it is in your head.',
        told: 'spent eleven weeks learning it properly, until the page was nothing you needed.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, thaumaturge: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'sell',
        label: 'Find out what it is worth. Two men in the town will pay for it and one of them will pay more if the other never hears it existed, and that is the arithmetic you actually enjoy.',
        told: 'found out what the page was worth, and which of the two buyers would pay more for the other never hearing of it.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, entertainer: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
      {
        id: 'burn',
        label: 'Put it in the brazier. You have read the last line twice and you would rather be the only person who ever did.',
        told: 'read the last line twice and then put the page in the brazier.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, berserker: 1 },
          lineage: { scorchbound: 1 },
          background: { military: 1 },
          skill: { vigilant: 1 },
        },
      },
    ],
  },

  {
    /* The second half of the pair, on the road for the reason the Necromancer's
       and the Runebearer's are: the first scene is where somebody finds out what
       they can do, and the road is where somebody else needs it done. This one is
       the whole set in a sentence — the person who has to cast the spell is not
       the person who knows it. */
    id: 'road-illiterate-guard',
    stage: 'road',
    scene:
      'The caravan’s hired guard is worth every coin of her wage and cannot read a word. Something is following the wagons at a distance that has not closed for two nights, and the one thing in the whole train that would answer it is a working nobody aboard can hold in their head.',
    asks: 'What do you do?',
    recall: 'On the caravan the thing followed for two nights, you',
    options: [
      {
        id: 'write',
        label: 'Sit up with a lamp and put the working on parchment in a hand she can sound out. She reads it off the leaf on the third night without understanding one word of it, and the thing does not come back.',
        told: 'put the working on parchment in a hand the guard could sound out, and she read it off the leaf on the third night.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1, arcanist: 1 },
          lineage: { luminary: 1 },
          background: { merchant: 1 },
          skill: { scholar: 1, mastermind: 1 },
        },
      },
      {
        id: 'stand',
        label: 'Stand the third watch yourself and let it close. Whatever it is, it has been deciding for two nights, and you would rather it decided while you were awake and facing it.',
        told: 'stood the third watch yourself and let the thing close while you were facing it.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, berserker: 1, oathbound: 1 },
          lineage: { undead: 1 },
          background: { mercenary: 1 },
          skill: { vigilant: 1, helpful: 1 },
        },
      },
      {
        id: 'teach',
        label: 'Teach her the letters. It takes the whole crossing and she is furious with you for most of it, and by the far side she can read her own name and a contract.',
        told: 'taught the guard her letters across the whole crossing, over her objections.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1, enchanter: 1 },
          lineage: { celestial: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { charismatic: 1, scholar: 1 },
        },
      },
      {
        id: 'track',
        label: 'Go out and find out what it is. Two nights at a steady distance is a thing making up its mind, and you would rather meet it on ground you picked than on the one it did.',
        told: 'went out to find out what had been keeping its distance for two nights.',
        gives: {
          attribute: { instinct: 2 },
          talent: { mycomancer: 1, 'feral-curse': 1 },
          lineage: { wildheart: 1, wildkin: 1 },
          background: { investigator: 1 },
          skill: { inquisitor: 1, survivalist: 1 },
        },
      },
    ],
  },
  /* ==================================================== childhood, second drop
     Six more, added 2026-09-09. Childhood had four scenes and a draw of one, so
     one run in four opened on the same dog behind the mill. See the census note
     in data/README.md. */
  {
    id: 'child-ice',
    stage: 'childhood',
    scene:
      'The pond has been frozen a fortnight and the miller’s boy has gone through it, forty feet out from the bank. He is holding the edge with both arms and the ice is going grey around him. There are four of you on the bank and you are the oldest by a year.',
    asks: 'What do you do?',
    recall: 'On the grey ice the winter the miller’s boy went through, you',
    options: [
      {
        id: 'rail',
        label: 'Pull a rail off the fence, break the ice all the way in to him and haul him out through the water instead of over it.',
        told: 'broke the ice in to him with a fence rail and hauled him out through the water.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, runebearer: 1, weaver: 1 },
          lineage: { tidebound: 1 },
          background: { military: 1 },
          skill: { helpful: 1, survivalist: 1 },
        },
      },
      {
        id: 'flat',
        label: 'Go out flat on your belly with your arms and legs spread, sliding, until you have a hand on his collar and can be pulled back by the ankles.',
        told: 'went out flat on your belly until you had a hand on his collar.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, 'flowing-fist': 1 },
          lineage: { wildheart: 1 },
          background: { entertainer: 1 },
          skill: { survivalist: 1, helpful: 1 },
        },
      },
      {
        id: 'door',
        label: 'Send the lightest of the four out on the barn door with a rope on it, and stand on the bank working out the angle and the count.',
        told: 'sent the lightest of you out on the barn door with a rope, and worked the angle from the bank.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 1 },
          background: { military: 1 },
          skill: { mastermind: 1, helpful: 1 },
        },
      },
      {
        id: 'swim',
        label: 'Go in on purpose off the open bank and swim to him under the edge of the ice. The cold does not reach you the way it reaches other people.',
        told: 'went into the open water on purpose and swam to him under the edge of the ice.',
        gives: {
          attribute: { instinct: 1 },
          talent: { wilder: 1, 'feral-curse': 1 },
          lineage: { tidebound: 1 },
          background: { outlander: 1 },
          skill: { seafarer: 1, survivalist: 1 },
        },
      },
    ],
  },

  {
    id: 'child-tithe',
    stage: 'childhood',
    scene:
      'The tithe-man has the family’s grain out in the yard and a tally stick in his hand, and he is counting eleven sacks where you know there are nine. Your father is standing with his hat off, saying nothing. The tithe-man has a boy with him and a mule, and neither of them is looking at the sacks.',
    asks: 'What do you do?',
    recall: 'In the yard the year the tithe-man counted eleven sacks of nine, you',
    options: [
      {
        id: 'count',
        label: 'Say the number out loud in front of the boy, broken down sack by sack, the way you have been doing it in your head since he started.',
        told: 'said the true number out loud, sack by sack, in front of the tithe-man’s own boy.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1 },
          background: { investigator: 1, merchant: 1, entertainer: 1 },
          skill: { mastermind: 1, inquisitor: 1 },
        },
      },
      {
        id: 'sacks',
        label: 'Move two sacks behind the cart while the boy is busy with the mule, so that the count he writes down is the count you want written.',
        told: 'moved two sacks behind the cart, so the count he wrote down was the one you wanted.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, merchant: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'stick',
        label: 'Put your hand on the tally stick and keep it there. You are nine years old and he has to decide, in front of your father, what he is going to do about that.',
        told: 'put your hand on the tally stick and made him decide, in front of your father, what to do about it.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, colossus: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, frugal: 1 },
        },
      },
      {
        id: 'temple',
        label: 'Ask him, in a small voice, what happens to a man who miscounts for the temple. Let the boy and the mule and your father all hear a child ask it.',
        told: 'asked him in a small voice what happens to a man who miscounts for the temple.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1 },
          lineage: { infernal: 1 },
          background: { aristocrat: 1, entertainer: 1 },
          skill: { charismatic: 1, empath: 1 },
        },
      },
    ],
  },

  {
    id: 'child-bell',
    stage: 'childhood',
    scene:
      'You are up the chapel tower because it is the one place nobody looks for you, and from the window there is smoke on the ridge road, moving. It is not a hearth fire and it is not a charcoal burner. The bell rope is by your hand and nobody has told you to pull it.',
    asks: 'What do you do?',
    recall: 'Up the chapel tower, with smoke moving on the ridge road, you',
    options: [
      {
        id: 'pull',
        label: 'Pull it with both hands and keep pulling until the rope has taken the skin off your palms and the whole valley is awake and out of doors.',
        told: 'pulled the bell rope until it took the skin off your palms and the whole valley was out of doors.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, runebearer: 1, weaver: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
        },
      },
      {
        id: 'count',
        label: 'Count the smoke first. Riders make one kind of dust and a burning steading makes another, and you would rather ring the right bell than the loud one.',
        told: 'counted the smoke first, because you would rather ring the right bell than the loud one.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { inquisitor: 1, cartographer: 1 },
        },
      },
      {
        id: 'ridge',
        label: 'Go out the tower window and down the ridge to look at it yourself, and be back before anybody has noticed the bell was not rung.',
        told: 'went out the tower window to look at the smoke yourself, and were back before anybody missed the bell.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, wilder: 1 },
          lineage: { skybound: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, cunning: 1 },
        },
      },
      {
        id: 'word',
        label: 'Say the word scratched inside the bell housing, which you found two summers ago and have been waiting for a reason to use. The bell rings itself.',
        told: 'said the word scratched inside the bell housing, and the bell rang itself.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1, weaver: 1, spellblade: 1 },
          lineage: { celestial: 1 },
          background: { erudit: 1 },
          skill: { occultist: 1, 'innate-spell-novice': 1 },
        },
      },
    ],
  },

  {
    id: 'child-lamb',
    stage: 'childhood',
    scene:
      'The ewe has thrown a lamb wrong and the lamb is alive and will not be by morning. Your grandmother has put the knife down on the straw beside you and gone back to the house, which is how she says things. The barn is cold and the ewe will not stop.',
    asks: 'What do you do?',
    recall: 'In the cold barn the night the ewe threw wrong, you',
    options: [
      {
        id: 'knife',
        label: 'Use the knife. It takes you two tries and you never tell anybody about the first one.',
        told: 'used the knife, and never told anybody it took two tries.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1, painseeker: 1 },
          lineage: { undead: 1 },
          background: { mercenary: 1 },
          skill: { survivalist: 1, scavenger: 1 },
        },
      },
      {
        id: 'coat',
        label: 'Get the lamb inside your coat against your skin and hold it there all night. It lives, and the ewe knows you now.',
        told: 'held the lamb inside your coat all night until it lived, and the ewe knew you afterwards.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, 'draconic-bond': 1, beastbond: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, helpful: 1 },
        },
      },
      {
        id: 'milk',
        label: 'Warm milk, a goose quill and honey off the shelf, and feed it a spoon at a time until first light. Three of the four things you try are your own idea.',
        told: 'fed it warm milk through a goose quill until first light, and three of the four things you tried were your own idea.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1, thaumaturge: 1 },
          background: { craftsman: 1 },
          skill: { apothecary: 1, physician: 1 },
        },
      },
      {
        id: 'words',
        label: 'Sit with it and say the words your grandmother says over the dying, all of them, in the right order, though nobody has ever taught you them.',
        told: 'said the words your grandmother says over the dying, in the right order, though nobody had taught you them.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { necromancer: 1 },
          lineage: { undead: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { occultist: 1, healer: 1 },
        },
      },
    ],
  },

  {
    id: 'child-skull',
    stage: 'childhood',
    scene:
      'The plough has turned up a skull in the top field, small and brown and not a sheep’s. That field has been ploughed every spring of your life. Your father has already decided to say nothing about it to anybody and has gone to fetch a sack.',
    asks: 'What do you do?',
    recall: 'Over the skull the plough turned up in the top field, you',
    options: [
      {
        id: 'ask',
        label: 'Ask it who it was. Not out loud, and not expecting anything, and you are still standing there when something in the field answers.',
        told: 'asked it who it was, and were still standing there when something in the field answered.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 2 },
          talent: { necromancer: 1 },
          lineage: { undead: 1 },
          background: { investigator: 1 },
          skill: { occultist: 1, inquisitor: 1 },
        },
      },
      {
        id: 'dig',
        label: 'Dig where the plough found it, all afternoon, until you have the rest of them laid out straight and put a stone over it with a mark cut into the stone.',
        told: 'dug up the rest of them and laid them straight under a stone with a mark cut into it.',
        gives: {
          attribute: { physique: 2 },
          talent: { runebearer: 1, colossus: 1 },
          lineage: { stonebound: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, helpful: 1 },
        },
      },
      {
        id: 'sell',
        label: 'Say nothing and take it. There is a man in the market town who buys curiosities and does not ask which field they came out of.',
        told: 'took it to the man in the market town who buys curiosities and does not ask which field they came from.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, merchant: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
      {
        id: 'almshouse',
        label: 'Get the shape of it into your head, then walk to the almshouse and ask the oldest person there what happened in that field, and keep asking until somebody tells you.',
        told: 'walked to the almshouse and kept asking what had happened in that field until somebody told you.',
        gives: {
          attribute: { mind: 1 },
          talent: { necromancer: 1 },
          background: { investigator: 1 },
          skill: { inquisitor: 1, scholar: 1 },
        },
      },
    ],
  },

  {
    id: 'child-slate',
    stage: 'childhood',
    scene:
      'The schoolmaster pays a farthing a page to whoever will copy his letters out fair, and his hand shakes now, so it is you. Forty pages by Sunday. Halfway down the stack there is a page in a different hand altogether, and it is a list of names with money written beside them.',
    asks: 'What do you do?',
    recall: 'Copying the schoolmaster’s letters at a farthing a page, you',
    options: [
      {
        id: 'twice',
        label: 'Copy it fair with the rest, and copy it twice, and keep the second one. A page in your own hand is a page anybody can read, including you, in ten years.',
        told: 'copied the page twice and kept the second one, because a page in your own hand is one anybody can read.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, mastermind: 1 },
        },
      },
      {
        id: 'hand',
        label: 'Learn the other hand. By Sunday you can write a line in it that the schoolmaster himself would swear he had not written.',
        told: 'learned the other hand well enough to write a line the schoolmaster would swear he had not written.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, entertainer: 1 },
          skill: { cunning: 1, skilled: 1 },
        },
      },
      {
        id: 'name',
        label: 'Take the page to the name at the top of it and find out what he will pay for the schoolmaster not to have it.',
        told: 'took the page to the name at the top of it and found out what he would pay for it.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
      {
        id: 'forty',
        label: 'Finish the forty pages, take your farthings and say nothing at all about the one in the middle. Your hand aches for two days afterwards.',
        told: 'finished all forty pages and said nothing about the one in the middle, and your hand ached for two days.',
        gives: {
          attribute: { physique: 2 },
          talent: { runebearer: 1, guardian: 1 },
          lineage: { stalwart: 1 },
          background: { craftsman: 1 },
          skill: { frugal: 1, skilled: 1 },
        },
      },
    ],
  },

  /* ========================================================= home, second drop
     Six more. Home had four and a draw of one, the same problem childhood had. */
  {
    id: 'home-winter',
    stage: 'home',
    scene:
      'It is the third week of a bad winter and the woodpile is down to two days. Your mother has counted it twice and stopped counting. The forest behind the house belongs to a man who has hanged people for less than a cord of wood.',
    asks: 'What do you do?',
    recall: 'The bad winter the woodpile came down to two days, you',
    options: [
      {
        id: 'axe',
        label: 'Go up at first light with the axe and come back at dusk with more than you can carry. Twice a day, then again the next day.',
        told: 'went up with the axe at first light and came back at dusk with more than you could carry.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, berserker: 1 },
          lineage: { stalwart: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, frugal: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'deadfall',
        label: 'Take the deadfall only, at night, in three small loads by three different paths, so that nothing on the ground says anybody was ever up there.',
        told: 'took the deadfall at night by three different paths, so nothing on the ground said you had been there.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, wilder: 1, mycomancer: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, survivalist: 1 },
        },
      },
      {
        id: 'hearth',
        label: 'Rebuild the hearth instead. You have watched the smoke go up that chimney all your life and you are fairly sure you know where the heat has been going.',
        told: 'rebuilt the hearth instead, because you had worked out where the heat had been going.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 1, alchemist: 1 },
          lineage: { scorchbound: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, frugal: 1 },
        },
      },
      {
        id: 'work',
        label: 'Go and ask the man for work. He has a woodlot and no sons, and by the end of the winter you know his dogs by name and they know yours.',
        told: 'went and asked the man for work, and by the end of the winter his dogs knew your name.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'draconic-bond': 1, wilder: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { charismatic: 1, helpful: 1 },
        },
      },
    ],
  },

  {
    id: 'home-brother',
    stage: 'home',
    scene:
      'Your brother has taken the priest’s silver spoon and hidden it under the loose board in the room the two of you sleep in. The priest has been to the house twice. Your brother is younger than you and has told you, in the dark, that he will say it was you.',
    asks: 'What do you do?',
    recall: 'Over the priest’s spoon under your brother’s loose board, you',
    options: [
      {
        id: 'take',
        label: 'Take it. Let him say what he likes, and stand in front of the priest saying nothing at all, and take what comes with your hands at your sides.',
        told: 'took the blame with your hands at your sides and let your brother say what he liked.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, runebearer: 1, oathbound: 1 },
          lineage: { celestial: 1 },
          background: { military: 1 },
          skill: { helpful: 1, vigilant: 1 },
        },
      },
      {
        id: 'back',
        label: 'Put it back where the priest will find it himself, in a place that makes both of you look innocent and the housekeeper look careless.',
        told: 'put the spoon back where the priest would find it himself and the housekeeper would be blamed.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, investigator: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'want',
        label: 'Work out what your brother actually wants, get it for him another way and then tell him what you know and what it will cost him to keep you quiet.',
        told: 'found out what your brother really wanted, got it for him another way and named your price for silence.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1 },
          lineage: { infernal: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { mastermind: 1, empath: 1 },
        },
      },
      {
        id: 'yard',
        label: 'Take your brother out to the yard and settle it there, and then go to the priest together with the spoon and a bruise each.',
        told: 'settled it with your brother in the yard, and went to the priest together with the spoon and a bruise each.',
        tags: ['did:violence'],
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, brawler: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { 'quick-draw': 1, helpful: 1 },
        },
      },
    ],
  },

  {
    id: 'home-match',
    stage: 'home',
    scene:
      'There is a man in the front room with your father and a contract on the table, and the contract is a marriage. He is thirty and he has a mill. You are fifteen and you have been listening at the door for a quarter of an hour.',
    asks: 'What do you do?',
    recall: 'The afternoon they put a marriage contract on the table, you',
    options: [
      {
        id: 'read',
        label: 'Go in and read the contract. There are four things wrong with it, you point at each of them in front of both men and the second one ends the afternoon.',
        told: 'went in, read the contract and pointed at the four things wrong with it in front of both men.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          background: { aristocrat: 1 },
          skill: { scholar: 1, mastermind: 1 },
        },
      },
      {
        id: 'gone',
        label: 'Be gone by the time they open the door. There is a cart leaving for the market town at dawn and you know the driver well enough.',
        told: 'were gone before they opened the door, on the dawn cart to the market town.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, wilder: 1 },
          lineage: { fey: 1 },
          background: { outlander: 1 },
          skill: { cunning: 1, survivalist: 1 },
        },
      },
      {
        id: 'agree',
        label: 'Go in and agree to it, and spend the next hour finding out exactly what the mill is worth and which of the two men needs this more.',
        told: 'agreed to it, and spent the hour finding out what the mill was worth and which man needed it more.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, aristocrat: 1, entertainer: 1 },
          skill: { haggler: 1, empath: 1 },
        },
      },
      {
        id: 'fire',
        label: 'Open the door, put the contract in the fire and stand in front of the fire. Nobody in that room is going to move you off it.',
        told: 'put the contract in the fire and stood in front of the fire, and nobody in the room moved you off it.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, berserker: 1 },
          lineage: { scorchbound: 1, draconic: 1 },
          background: { military: 1 },
          skill: { vigilant: 1 },
        },
      },
    ],
  },

  {
    id: 'home-well',
    stage: 'home',
    scene:
      'The village well has gone bad, two children are sick and somebody has remembered that your family’s land lies uphill of it. There are eleven people at your gate and the one doing the talking is the smith. Your mother has bolted the door and put her back against it.',
    asks: 'What do you do?',
    recall: 'The day eleven of the village came to the gate about the well, you',
    options: [
      {
        id: 'spring',
        label: 'Go out and take them up to the well. Show them the dead sheep in the upper spring that nobody has looked at, and make the smith look at it first.',
        told: 'took them up to the well and made the smith look at the dead sheep in the upper spring.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1 },
          background: { investigator: 1 },
          skill: { inquisitor: 1, physician: 1 },
        },
      },
      {
        id: 'gate',
        label: 'Go out and stand in the gateway. Eleven is not so many when the first two of them have to get past you, and the smith knows it.',
        told: 'stood in the gateway, because eleven is not so many when the first two have to get past you.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, painseeker: 1 },
          lineage: { stonebound: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
        },
      },
      {
        id: 'children',
        label: 'Go over the back wall and get the two sick children out to your grandmother, who has never once been wrong about a fever, before anybody at the gate has finished shouting.',
        told: 'got the two sick children over the back wall to your grandmother before the shouting at the gate had finished.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'cauldron-keeper': 1, trickster: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1 },
          skill: { healer: 1, apothecary: 1 },
        },
      },
      {
        id: 'boil',
        label: 'Boil it. Every drop the village drinks for a fortnight, in your mother’s copper, over a fire you keep alight yourself for fourteen days.',
        told: 'boiled every drop the village drank for a fortnight over a fire you kept alight yourself.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, runebearer: 1 },
          lineage: { scorchbound: 1 },
          background: { craftsman: 1 },
          skill: { helpful: 1, frugal: 1 },
        },
      },
    ],
  },

  {
    id: 'home-levy',
    stage: 'home',
    scene:
      'The levy has come through and it takes one from every house that has more than one. There are three of you and your brother is lame. The sergeant is writing names at the table and your mother has not said anything for a full minute.',
    asks: 'What do you do?',
    recall: 'The morning the levy came for one body from every house, you',
    options: [
      {
        id: 'own',
        label: 'Say your own name before anybody else can. You are the biggest thing in that house and the only argument that matters is standing up.',
        told: 'said your own name before anybody else could.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, oathbound: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
        },
      },
      {
        id: 'warrant',
        label: 'Read the warrant over his shoulder. It says one able body a house and it does not say which house, and there is a cousin two fields over who would go for money.',
        told: 'read the warrant over his shoulder and found the cousin two fields over who would go for money.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { mastermind: 1, inquisitor: 1 },
        },
      },
      {
        id: 'hedge',
        label: 'Be somewhere else. You are out of the window and into the hedge before he reaches the second name, and you sleep in the wood for nine days.',
        told: 'were out the window before he reached the second name, and slept in the wood for nine days.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, wilder: 1, 'cauldron-keeper': 1, mycomancer: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, survivalist: 1 },
        },
      },
      {
        id: 'trade',
        label: 'Offer him something better. You know where the deserters are camped and he has been looking for a fortnight, and one of those facts is worth the other.',
        told: 'traded him the deserters’ camp, which he had been looking for a fortnight.',
        gives: {
          attribute: { instinct: 1 },
          talent: { pactbound: 1 },
          lineage: { infernal: 1 },
          background: { criminal: 1, merchant: 1, entertainer: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
    ],
  },

  {
    id: 'home-loom',
    stage: 'home',
    scene:
      'Your father has been dead a month and the workshop is yours or it is nobody’s. There is a half-finished commission on the bench, a book of his patterns and a man coming on Thursday for the piece. You have watched this work all your life and never once been allowed to do it.',
    asks: 'What do you do?',
    recall: 'The month after your father died, over his half-finished commission, you',
    options: [
      {
        id: 'finish',
        label: 'Finish it. Twelve hours a day until Thursday with your father’s tools, and the man takes it without a word about whose hands were on it.',
        told: 'finished it in twelve-hour days, and the man took it without a word about whose hands had been on it.',
        gives: {
          attribute: { physique: 2 },
          talent: { runebearer: 1, weaver: 1 },
          lineage: { stalwart: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, tailor: 1 },
        },
      },
      {
        id: 'pattern',
        label: 'Read the pattern book first, every page of it, then finish the piece better than the pattern says. The man notices and comes back in the spring.',
        told: 'read every page of his pattern book and then finished the piece better than the pattern said.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 1, alchemist: 1, weaver: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, scholar: 1 },
        },
      },
      {
        id: 'sell',
        label: 'Sell the tools, the pattern book and the commission, in that order, to three different people before Thursday.',
        told: 'sold the tools, the book and the commission to three different people before Thursday.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { merchant: 1, entertainer: 1 },
          skill: { haggler: 1, cunning: 1 },
        },
      },
      {
        id: 'mark',
        label: 'Cut your father’s mark into the underside of the piece and finish it in his hand rather than your own, and let the man believe what he likes.',
        told: 'cut your father’s mark into the underside and finished the piece in his hand rather than your own.',
        tags: ['did:theft'],
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1, weaver: 1, spellblade: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
          skill: { skilled: 1, cunning: 1 },
        },
      },
    ],
  },

  /* ======================================================== blood, second drop
     Five more. The blood chapter is where an ancestry shows, so every scene
     here is one an ordinary body does not walk out of. */
  {
    id: 'blood-lightning',
    stage: 'blood',
    scene:
      'The storm catches you on the open hill with the flock and there is nowhere to be. The air goes wrong, your hair lifts off your neck and the ewe six feet away drops where she stands. You are still on your feet and the rain has not touched you yet.',
    asks: 'What do you do?',
    recall: 'On the open hill the day the storm dropped a ewe six feet from you, you',
    options: [
      {
        id: 'up',
        label: 'Stand up into it. You have never once been afraid of a high place or a hard wind, and the storm goes over you and takes nothing.',
        told: 'stood up into the storm, and it went over you and took nothing.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, wilder: 1 },
          lineage: { skybound: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, vigilant: 1 },
        },
      },
      {
        id: 'flock',
        label: 'Get the flock off the hill. Two under each arm and the rest driven, four trips, and you are the last thing standing up there for an hour.',
        told: 'got the whole flock off the hill in four trips, two under each arm.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, totemic: 1, 'draconic-bond': 1 },
          lineage: { skybound: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, helpful: 1 },
        },
      },
      {
        id: 'iron',
        label: 'Put every piece of iron you have on the ground twelve feet away, lie flat in the wet and count the gaps between the light and the sound until they get longer.',
        told: 'put your iron on the ground twelve feet off and lay flat, counting the gaps until they got longer.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, alchemist: 1 },
          background: { erudit: 1 },
          skill: { scholar: 1, cartographer: 1 },
        },
      },
      {
        id: 'answer',
        label: 'Answer it. You do not decide to, and afterwards you can find the shape it left on your palm with your thumb in the dark.',
        told: 'answered the storm without deciding to, and carried the shape it left on your palm afterwards.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, 'elemental-aspect': 1 },
          lineage: { skybound: 1 },
          background: { erudit: 1 },
          skill: { 'innate-spell-novice': 1, occultist: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-fever',
    stage: 'blood',
    scene:
      'The sweating sickness has taken nine houses in the row and both your parents are in one of them. You have been in and out of that room for eleven days, sleeping on the floor of it and drinking out of the same cup. You have not been ill for an hour.',
    asks: 'What do you do?',
    recall: 'Through eleven days of the sweating sickness that never touched you, you',
    options: [
      {
        id: 'carry',
        label: 'Keep going. Carry water, carry the dead out, carry the priest home when he can no longer walk and be the last one standing in the row.',
        told: 'carried water and carried the dead, and were the last one standing in the row.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, painseeker: 1 },
          lineage: { undead: 1 },
          background: { military: 1 },
          skill: { helpful: 1, healer: 1 },
        },
      },
      {
        id: 'why',
        label: 'Find out why not you. The same cup, the same room, the same air and eleven days, and there is an answer in that and you mean to have it.',
        told: 'set out to find why the same cup and the same air had not touched you.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1 },
          background: { investigator: 1 },
          skill: { physician: 1, apothecary: 1 },
        },
      },
      {
        id: 'brew',
        label: 'Go out to the woods and come back with what your grandmother used to bring back, and brew it in the yard for the whole row.',
        told: 'brewed what your grandmother used to bring out of the woods, in the yard, for the whole row.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'cauldron-keeper': 1, wilder: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { apothecary: 1, healer: 1 },
        },
      },
      {
        id: 'sit',
        label: 'Sit with the ones nobody else will sit with, and be the one who says the last words, because you have found out that you can and that it costs you nothing.',
        told: 'sat with the ones nobody else would sit with and said the last words over them.',
        gives: {
          attribute: { mind: 1 },
          talent: { necromancer: 1 },
          lineage: { undead: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { occultist: 1, empath: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-glass',
    stage: 'blood',
    scene:
      'The house has one good window and you have been looking into it since you were small, because the room reflected in it is not always the room behind you. Tonight there is somebody standing in the reflected doorway. There is nobody standing in the real one.',
    asks: 'What do you do?',
    recall: 'The night the window showed somebody in a doorway that was empty, you',
    options: [
      {
        id: 'watch',
        label: 'Watch it. All night if it takes all night, without moving. Write down in the morning what it did and in what order.',
        told: 'watched it all night without moving, and wrote down in the morning what it had done and in what order.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1 },
          background: { erudit: 1 },
          skill: { occultist: 1, scholar: 1 },
        },
      },
      {
        id: 'stand',
        label: 'Go and stand in the doorway yourself, the real one, to see which of the two of you the window decides to show.',
        told: 'stood in the real doorway to see which of the two of you the window would show.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1 },
          lineage: { celestial: 1 },
          background: { investigator: 1 },
          skill: { vigilant: 1, cunning: 1 },
        },
      },
      {
        id: 'break',
        label: 'Break the window. It costs you a winter of cold and a beating, and you have never once regretted it.',
        told: 'broke the window, and paid for it with a winter of cold and a beating you never regretted.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, brawler: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { streetwise: 1 },
        },
      },
      {
        id: 'speak',
        label: 'Speak to it. Not in your own language, because the one that comes out of you is not, and it answers you in the same.',
        told: 'spoke to it in a language that was not yours, and it answered you in the same.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1, necromancer: 1 },
          lineage: { infernal: 1 },
          skill: { occultist: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-salt',
    stage: 'blood',
    scene:
      'The boat has gone over a mile out and the other three are in the water with you. The cold takes the oldest of them in about four minutes and you can feel it doing it. It is not doing it to you.',
    asks: 'What do you do?',
    recall: 'A mile out, in the water the cold could not get into, you',
    options: [
      {
        id: 'hull',
        label: 'Get all three of them up onto the hull and stay in the water yourself, holding it steady, for the two hours it takes the tide to put you on the sand.',
        told: 'held the hull steady from the water for two hours while the tide carried all four of you in.',
        gives: {
          attribute: { instinct: 2 },
          talent: { wilder: 1, 'cauldron-keeper': 1 },
          lineage: { tidebound: 1 },
          background: { outlander: 1 },
          skill: { seafarer: 1, helpful: 1 },
        },
      },
      {
        id: 'point',
        label: 'Swim for the point with the youngest of them on your back. It is half a mile, you do not stop, and you do not look back at the other two.',
        told: 'swam half a mile to the point with the youngest on your back, and did not look back at the other two.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, berserker: 1 },
          lineage: { tidebound: 1 },
          background: { mercenary: 1 },
          skill: { seafarer: 1, survivalist: 1 },
        },
      },
      {
        id: 'sail',
        label: 'Cut the sail free and get it under all four of you, because a wet sail full of air is a boat for as long as anybody needs one.',
        told: 'cut the sail free and got it under all four of you, because a wet sail full of air is a boat.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 1, weaver: 1 },
          background: { craftsman: 1, merchant: 1 },
          skill: { seafarer: 1, skilled: 1 },
        },
      },
      {
        id: 'ask',
        label: 'Ask the water. You have been doing it since you were four, quietly, and it has never once said no to you.',
        told: 'asked the water, the way you had since you were four, and it did not say no.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, 'elemental-aspect': 1 },
          lineage: { tidebound: 1 },
          skill: { 'innate-spell-novice': 1, seafarer: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-stone',
    stage: 'blood',
    scene:
      'The quarry face has come down on the shift below yours and there are men under it. The foreman has said the word he says when there is no getting them out. You are fourteen and you are on the rope, and somewhere under thirty tons of it something is still knocking.',
    asks: 'What do you do?',
    recall: 'On the rope the day the quarry face came down, you',
    options: [
      {
        id: 'hands',
        label: 'Go down and start moving it with your hands. Nobody counts the hours, and by the end of it you have shifted stone two men could not, and one of them is alive.',
        told: 'went down and moved stone two men could not, until one of them came out alive.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, runebearer: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1 },
          skill: { survivalist: 1, helpful: 1 },
        },
      },
      {
        id: 'face',
        label: 'Look at the face before anybody touches it. There is one block holding the rest, it can be taken out from the side, and you can say which one it is.',
        told: 'read the face before anybody touched it and named the one block holding the rest.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1 },
          skill: { cartographer: 1, scholar: 1 },
        },
      },
      {
        id: 'gap',
        label: 'Go in through the gap nobody else can fit through, on your belly, with a line tied to your ankle, to find out which of the knocking is worth digging for.',
        told: 'went in on your belly through the gap nobody else could fit, to find which knocking was worth digging for.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, wilder: 1, mycomancer: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, cunning: 1 },
        },
      },
      {
        id: 'palm',
        label: 'Put your hand flat on the face and wait. The knocking comes up through the stone into your palm, and after a while you know exactly where they are.',
        told: 'put your hand flat on the face until the knocking came up through the stone and told you where they were.',
        gives: {
          attribute: { physique: 1 },
          talent: { runebearer: 1, totemic: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1 },
          skill: { vigilant: 1 },
        },
      },
    ],
  },

  /* ======================================================= youth, second drop
     Five more, for the stage that already had the most and is asked once. */
  {
    id: 'youth-cards',
    stage: 'youth',
    scene:
      'You are eleven silver down at a table in a room over a tannery, and the man across from you has been dealing off the bottom for an hour. Two of the four other players know it. Nobody has said anything, because the man has friends by the door.',
    asks: 'What do you do?',
    recall: 'Eleven silver down in the room over the tannery, you',
    options: [
      {
        id: 'bottom',
        label: 'Deal off the bottom yourself. He is watching your face and not your hands, and by midnight you are eight up and he still does not know how.',
        told: 'dealt off the bottom yourself, and were eight up by midnight without his working out how.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, 'flowing-fist': 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, entertainer: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'say',
        label: 'Say it. Out loud, with the count of every hand he has taken. Let the other four do the arithmetic in front of him.',
        told: 'said it out loud with the count of every hand he had taken, and let the table do the arithmetic.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1 },
          background: { aristocrat: 1, entertainer: 1 },
          skill: { mastermind: 1, charismatic: 1 },
        },
      },
      {
        id: 'table',
        label: 'Turn the table over. There are three of them and one of you, it takes a while, and you leave with your eleven silver and somebody else’s coat.',
        told: 'turned the table over, and left with your eleven silver and somebody else’s coat.',
        tags: ['did:violence'],
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, brawler: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { streetwise: 1, 'quick-draw': 1 },
        },
      },
      {
        id: 'follow',
        label: 'Lose the rest of it slowly and cheerfully, and then follow him home. What he does with it afterwards is worth more than eleven silver.',
        told: 'lost the rest cheerfully and followed him home, because what he did with it was worth more than the money.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1 },
          lineage: { wildheart: 1 },
          background: { investigator: 1 },
          skill: { cunning: 1, inquisitor: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-ship',
    stage: 'youth',
    scene:
      'You went into a dockside inn for the bread and you have woken up on a deck with a headache and no coast in sight. The mate has your name on his list in a hand that is not yours. Four days out, and the man in the hammock beside you has been on this ship nine years.',
    asks: 'What do you do?',
    recall: 'On the ship you woke up on four days out from the dock, you',
    options: [
      {
        id: 'work',
        label: 'Work. Harder than anybody, for nine weeks, until the bosun would rather have you willing than have you flogged and come off that ship with a wage and a trade.',
        told: 'worked harder than anybody for nine weeks, and came off that ship with a wage and a trade.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, runebearer: 1, weaver: 1 },
          lineage: { tidebound: 1 },
          background: { mercenary: 1 },
          skill: { seafarer: 1, frugal: 1 },
        },
      },
      {
        id: 'learn',
        label: 'Learn the ship. Every hatch, every watch and every man’s habits, and go over the side into a harbour boat on the ninth night without a sound.',
        told: 'learned every hatch and every watch, and went over the side into a harbour boat on the ninth night.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1 },
          lineage: { tidebound: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, seafarer: 1 },
        },
      },
      {
        id: 'charts',
        label: 'Learn the navigation. The mate cannot do it sober and the master is sixty, and by the second month the charts are yours and nobody mentions the list again.',
        told: 'learned the navigation, and by the second month the charts were yours and nobody mentioned the list again.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 1 },
          background: { erudit: 1, merchant: 1 },
          skill: { cartographer: 1, scholar: 1 },
        },
      },
      {
        id: 'hold',
        label: 'Find out what is in the hold. Nine years is a long time to keep a crew, the hatch aft is nailed rather than locked, and whatever is behind it has been fed.',
        told: 'found out what was behind the nailed hatch aft, and what had been feeding it.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, 'draconic-bond': 1 },
          lineage: { wildheart: 1 },
          background: { investigator: 1 },
          skill: { inquisitor: 1, streetwise: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-mine',
    stage: 'youth',
    scene:
      'The seam has closed forty feet in and you are on the right side of it. There are five men on the wrong side and the timber crew is saying six hours. You can hear one of them through the fall and he can hear you.',
    asks: 'What do you do?',
    recall: 'The day the seam closed on five men with you on the right side of it, you',
    options: [
      {
        id: 'dig',
        label: 'Start digging and do not stop when the crew tells you to. Four hours, no shoring, and you are the reason two of the five come out at all.',
        told: 'dug for four hours without shoring, and were the reason two of the five came out.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, painseeker: 1 },
          lineage: { stonebound: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, helpful: 1 },
        },
      },
      {
        id: 'talk',
        label: 'Talk to him through the fall. Get the shape of what is behind it out of him foot by foot, and hand the crew a map of a place none of them can see.',
        told: 'talked him through the fall foot by foot, and handed the crew a map of a place none of them could see.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { cartographer: 1, mastermind: 1 },
        },
      },
      {
        id: 'round',
        label: 'Go round. There is an old working above this one that everybody says is flooded, and you have been up in it twice and it is not.',
        told: 'went round through the old working above, which everybody said was flooded and was not.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, mycomancer: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, cunning: 1 },
        },
      },
      {
        id: 'air',
        label: 'Get them air. A leather hose, a bellows off the smith, and six hours becomes a thing five men can live through, and you build it in twenty minutes.',
        told: 'built them air out of a leather hose and the smith’s bellows in twenty minutes.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 1, alchemist: 1, weaver: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, helpful: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-pit',
    stage: 'youth',
    scene:
      'The fighting pit behind the horse fair pays a silver to stand up for three rounds and two silver to win, and you have watched it every market day for a year. The man taking names has looked at you twice. The one who won last week has a bad hand and everybody in the crowd knows it.',
    asks: 'What do you do?',
    recall: 'At the fighting pit behind the horse fair, you',
    options: [
      {
        id: 'hand',
        label: 'Give your name and take the bad hand. Nothing you do in there is hard and everything in it is exact, and you are out in four minutes with two silver.',
        told: 'took the man with the bad hand, and were out in four minutes with two silver.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, 'flowing-fist': 1, 'weapon-master': 1 },
          lineage: { wildheart: 1 },
          background: { mercenary: 1, entertainer: 1 },
          skill: { 'quick-draw': 1, vigilant: 1 },
          weapon: { 'fist-weapon': 1 },
        },
      },
      {
        id: 'biggest',
        label: 'Give your name and take the biggest man there instead. You lose the first round badly and then you do not lose again, and the crowd remembers your face for a year.',
        told: 'took the biggest man there, lost the first round badly and did not lose again.',
        tags: ['did:violence'],
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, painseeker: 1, brawler: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { 'quick-draw': 1, streetwise: 1 },
          weapon: { 'melee-light': 1 },
        },
      },
      {
        id: 'book',
        label: 'Take the book instead. You have watched a year of these and you know which of them fall in the second round, and by dusk you have made nine silver without being hit.',
        told: 'took the book instead, and made nine silver by dusk without being hit once.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, aristocrat: 1 },
          skill: { mastermind: 1, haggler: 1 },
        },
      },
      {
        id: 'odds',
        label: 'Fight, and lose on purpose twice, and then win the third time at eleven to one against with everything you own riding on yourself.',
        told: 'lost twice on purpose and then won at eleven to one with everything you owned on yourself.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, entertainer: 1 },
          skill: { cunning: 1, charismatic: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-garden',
    stage: 'youth',
    scene:
      'The abbey’s physic garden is walled and locked, the brother who keeps it is dying, and there is nobody else in that house who knows what half of it is for. You have been over that wall since you were nine. He knows, and has never once said so.',
    asks: 'What do you do?',
    recall: 'Over the wall of the abbey’s physic garden, the year the brother was dying, you',
    options: [
      {
        id: 'sit',
        label: 'Go in by the wall as usual and sit with him in the garden until he has told you all of it, bed by bed, over five weeks.',
        told: 'sat with him in the garden for five weeks until he had told you all of it, bed by bed.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'cauldron-keeper': 1, mycomancer: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { apothecary: 1, healer: 1 },
        },
      },
      {
        id: 'copy',
        label: 'Copy the book. Every page of the garden book in a fair hand, twice, so that when he is gone the house still has it and so do you.',
        told: 'copied every page of the garden book twice, so that the house kept it and so did you.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1, alchemist: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1 },
          skill: { scholar: 1, apothecary: 1 },
        },
      },
      {
        id: 'cuttings',
        label: 'Take cuttings. A little of everything, rooted in a cold frame two miles off. In three years there is a second garden and it is yours.',
        told: 'took cuttings of everything, and in three years there was a second garden and it was yours.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { mycomancer: 1, wilder: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
          skill: { survivalist: 1, scavenger: 1 },
        },
      },
      {
        id: 'dig',
        label: 'Dig it over for him. He cannot lift a spade and the whole of it is going to seed, and you are there every morning for a month before anybody thinks to ask why.',
        told: 'dug the garden over for him every morning for a month before anybody thought to ask why.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, runebearer: 1 },
          lineage: { stalwart: 1 },
          background: { craftsman: 1 },
          skill: { helpful: 1, frugal: 1 },
        },
      },
    ],
  },

  /* ======================================================== trade, second drop
     Six more. What you did for a living is most of what a background is, so
     these hand out three at a time like the four that were here already. */
  {
    id: 'trade-caravan',
    stage: 'trade',
    scene:
      'The caravan master is four days from the pass and has lost two people to the fever, and he is hiring at the last inn before the climb. There are nine of you in the yard and he needs three. He has been looking at the yard for ten minutes without saying anything.',
    asks: 'What do you do?',
    recall: 'In the inn yard below the pass, where the caravan master needed three of nine, you',
    options: [
      {
        id: 'lift',
        label: 'Pick up the heaviest thing in the yard, put it on the wagon he is standing next to, then look at him.',
        told: 'put the heaviest thing in the yard on his wagon, and then looked at him.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, quartermaster: 1 },
          lineage: { stalwart: 1 },
          background: { mercenary: 1 },
          skill: { vigilant: 1, helpful: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'wheels',
        label: 'Tell him, in that order, what is wrong with his wheels, his mules and his two remaining guards, and where the pass will get him if he does not fix them.',
        told: 'told him what was wrong with his wheels, his mules and his guards, and where the pass would get him.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, wilder: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1 },
          skill: { cartographer: 1, survivalist: 1 },
        },
      },
      {
        id: 'manifest',
        label: 'Read his manifest upside down off the table while he talks, work out what he is actually carrying and offer him the one thing that cargo needs.',
        told: 'read his manifest upside down off the table and offered him the one thing his cargo needed.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { merchant: 1, investigator: 1 },
          skill: { haggler: 1, mastermind: 1 },
        },
      },
      {
        id: 'aboard',
        label: 'Be on the wagon when it leaves. He can find out he hired you somewhere up the road, where it is too late to be particular about it.',
        told: 'were on the wagon when it left, and let him find out he had hired you somewhere up the road.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
    ],
  },

  {
    id: 'trade-ward',
    stage: 'trade',
    scene:
      'The sisters at the fever house will take anybody who can stand the smell, and they pay in a bed and two meals. There are forty beds and four of them. The one who shows you round has been awake since the night before last.',
    asks: 'Which work do you take?',
    recall: 'At the fever house with forty beds and four sisters, you',
    options: [
      {
        id: 'hopeless',
        label: 'Take the ones nobody expects to live, and go through everything the house has, one thing at a time, until you find out what actually works on them.',
        told: 'took the ones nobody expected to live and worked through everything the house had until you found what helped.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1, thaumaturge: 1 },
          lineage: { luminary: 1 },
          background: { investigator: 1 },
          skill: { physician: 1, apothecary: 1 },
        },
      },
      {
        id: 'brewing',
        label: 'Take the brewing. Their store is empty, everything in it can be got within a day’s walk of the door, and you know where all of it grows.',
        told: 'took the brewing, and filled their empty store from a day’s walk around the door.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'cauldron-keeper': 1, wilder: 1 },
          lineage: { wildheart: 1, wildkin: 1 },
          background: { outlander: 1 },
          skill: { apothecary: 1, healer: 1 },
        },
      },
      {
        id: 'carrying',
        label: 'Take the lifting and the carrying and the dead. Forty beds turn over twice a week and somebody has to be the one who does not flinch at it.',
        told: 'took the lifting and the carrying and the dead, twice a week, without flinching at it.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, painseeker: 1 },
          lineage: { undead: 1 },
          background: { military: 1 },
          skill: { helpful: 1, vigilant: 1 },
        },
      },
      {
        id: 'register',
        label: 'Take the register. Names, dates, what they came in with and what they went out as, and in a year you have the only account of the sickness anybody has written.',
        told: 'took the register, and in a year had the only written account of the sickness anybody had.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1, necromancer: 1 },
          lineage: { undead: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
    ],
  },

  {
    id: 'trade-court',
    stage: 'trade',
    scene:
      'The magistrate’s clerk has died and the court sits on Monday. There are eleven cases, forty pages of writ and a queue at the door. The magistrate cannot read his own hand and has stopped pretending otherwise.',
    asks: 'What do you take on?',
    recall: 'At the magistrate’s court the week his clerk died, you',
    options: [
      {
        id: 'desk',
        label: 'Take the desk. By Monday the forty pages are fair, the eleven cases are in an order that makes sense and the magistrate says in open court that he does not know how he managed before.',
        told: 'took the desk, and by Monday the writs were fair and the magistrate said so in open court.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1 },
          lineage: { luminary: 1 },
          background: { aristocrat: 1 },
          skill: { scholar: 1, mastermind: 1 },
        },
      },
      {
        id: 'queue',
        label: 'Take the queue. Eleven cases at the door means eleven people who will each pay to be heard on Monday rather than in the spring.',
        told: 'took the queue, where eleven people each paid to be heard on Monday rather than in the spring.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, entertainer: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
      {
        id: 'lies',
        label: 'Read all eleven and find the two that are lies. One of them is the magistrate’s own cousin and you put it in front of him anyway.',
        told: 'read all eleven and put the two that were lies in front of him, one of them his own cousin’s.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, spellquill: 1 },
          lineage: { luminary: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { inquisitor: 1, empath: 1 },
        },
      },
      {
        id: 'door',
        label: 'Take the door. Forty people, one narrow stair and a magistrate who is going to need somebody standing between him and the fourth case.',
        told: 'took the door, and stood between the magistrate and the fourth case.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, oathbound: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
    ],
  },

  {
    id: 'trade-ledger',
    stage: 'trade',
    scene:
      'The counting house on the quay wants somebody who can hold a column in their head, and it pays better than anything else on that street. The man interviewing you has a ledger open and one finger on a line. The line is wrong and he does not know it yet.',
    asks: 'What do you do?',
    recall: 'In the counting house on the quay, over a line the man had his finger on, you',
    options: [
      {
        id: 'line',
        label: 'Tell him which line, and what it should say, and what the difference has cost him every month since the spring.',
        told: 'told him which line was wrong and what it had cost him every month since the spring.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { merchant: 1, aristocrat: 1 },
          skill: { haggler: 1, mastermind: 1 },
        },
      },
      {
        id: 'quiet',
        label: 'Say nothing about the line. Take the work, find out who has been feeding it and decide later which of the two of them you would rather be owed by.',
        told: 'said nothing about the line, took the work and found out who had been feeding it.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1 },
          lineage: { infernal: 1 },
          background: { criminal: 1, investigator: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'six',
        label: 'Ask to see the six ledgers behind that one. By the end of the afternoon you can name the clerk, the ship and the month, and you have never had a better afternoon.',
        told: 'asked for the six ledgers behind it, and by evening could name the clerk, the ship and the month.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, spellquill: 1 },
          lineage: { luminary: 1 },
          background: { investigator: 1 },
          skill: { inquisitor: 1, scholar: 1 },
        },
      },
      {
        id: 'quay',
        label: 'Take the work on the quay instead. The counting house is four flights up and everything it counts comes off a ship on somebody’s back, and you would rather be the back.',
        told: 'took the work on the quay instead, and carried what the counting house only counted.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 1, runebearer: 1, quartermaster: 1 },
          lineage: { tidebound: 1 },
          background: { mercenary: 1 },
          skill: { frugal: 1, seafarer: 1 },
        },
      },
    ],
  },

  {
    id: 'trade-company',
    stage: 'trade',
    scene:
      'The free company is taking names in the market square and paying a month up front. Their sergeant has one eye and a list, and the man in the queue in front of you is fifteen. Everybody in the square knows where the company is going and what happened to the last one that went there.',
    asks: 'What do you do?',
    recall: 'In the square where the free company was taking names, you',
    options: [
      {
        id: 'boy',
        label: 'Sign, and then go back down the queue and tell the fifteen-year-old to go home, and stand there until he does.',
        told: 'signed, and then stood over the fifteen-year-old in the queue until he went home.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, oathbound: 1 },
          lineage: { stalwart: 1 },
          background: { mercenary: 1 },
          skill: { vigilant: 1, helpful: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'blade',
        label: 'Sign, and spend the month up front on your own blade rather than their issue, because the issue is most of what happened to the last company.',
        told: 'signed, and spent the month up front on your own blade rather than their issue.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, sharpshooter: 1, 'weapon-master': 1 },
          lineage: { wildheart: 1 },
          background: { mercenary: 1 },
          skill: { 'quick-draw': 1, frugal: 1 },
          weapon: { 'paired-finesse': 1 },
        },
      },
      {
        id: 'clerk',
        label: 'Sign as their clerk. A company that cannot count its own powder is a company that loses, and by the second month you are the one saying where it goes.',
        told: 'signed as their clerk, and by the second month you were the one saying where the powder went.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, quartermaster: 1 },
          lineage: { luminary: 1 },
          background: { military: 1, merchant: 1 },
          skill: { mastermind: 1, cartographer: 1 },
        },
      },
      {
        id: 'behind',
        label: 'Do not sign. Follow them out at two days’ distance instead, because what a company leaves behind it on that road is going to be worth picking up.',
        told: 'followed the company out at two days’ distance, for what it left behind on the road.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, mycomancer: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1 },
          skill: { scavenger: 1, survivalist: 1 },
        },
      },
    ],
  },

  {
    id: 'trade-hall',
    stage: 'trade',
    scene:
      'The guild will not have you and the great house will, as something between a tutor and a curiosity. The letter is on the table and your mother has read it four times. Whatever else it is, it is a room in a house with eleven hundred books in it.',
    asks: 'What do you do?',
    recall: 'When the guild refused you and the great house did not, you',
    options: [
      {
        id: 'read',
        label: 'Go, and read all eleven hundred. It takes nine years, and at the end of them there is nothing in that house you do not know, including what the family did in the war.',
        told: 'went, and read all eleven hundred books, including everything the family had done in the war.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'curiosity',
        label: 'Go, and be the thing they think you are, and be so good at it that by the second winter the whole county wants you at their table instead.',
        told: 'went, and were such a curiosity that by the second winter the whole county wanted you at table.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1, celestial: 1 },
          background: { entertainer: 1, aristocrat: 1 },
          skill: { troubadour: 1, charismatic: 1 },
        },
      },
      {
        id: 'marry',
        label: 'Go, and marry into it. The letter is an opening and eleven hundred books is a dowry, and you have read enough of them to know how these houses fall.',
        told: 'went, and married into it, having read enough of their own books to know how such houses fall.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1, spellquill: 1 },
          lineage: { infernal: 1 },
          background: { aristocrat: 1, merchant: 1 },
          skill: { charismatic: 1, empath: 1 },
        },
      },
      {
        id: 'quarry',
        label: 'Do not go. Take the guild’s refusal to the quarry instead, where nobody asks whose son you are and be the best hand on the face inside two years.',
        told: 'took the guild’s refusal to the quarry, and were the best hand on the face inside two years.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, runebearer: 1, painseeker: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, frugal: 1 },
        },
      },
    ],
  },

  /* ========================================================= road, second drop
     Six more for the stage that is asked twice. */
  {
    id: 'road-ferry',
    stage: 'road',
    scene:
      'The river is up and the ferryman will not cross. There are eleven of you on the near bank and a fair in the town on the far one, and he has taken the oars out of the boat and gone into his hut. Two of the eleven have goods that will not keep.',
    asks: 'What do you do?',
    recall: 'On the near bank the day the ferryman would not cross, you',
    options: [
      {
        id: 'pole',
        label: 'Take the boat over yourself, twice, standing, with the pole. It is harder than he said it was and you do it anyway.',
        told: 'took the boat over twice yourself, standing, with the pole.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, painseeker: 1, weaver: 1 },
          lineage: { stonebound: 1, tidebound: 1 },
          background: { mercenary: 1 },
          skill: { seafarer: 1, survivalist: 1 },
        },
      },
      {
        id: 'shallows',
        label: 'Go upstream to the shallows nobody uses because of the stones, and be in the town with your own load before the ferryman has finished his dinner.',
        told: 'went up to the stony shallows nobody uses, and were in the town before the ferryman finished his dinner.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, wilder: 1 },
          lineage: { wildheart: 1, tidebound: 1 },
          background: { merchant: 1 },
          skill: { cartographer: 1, survivalist: 1 },
        },
      },
      {
        id: 'water',
        label: 'Look at the river. It has two more hours of rising in it and then four of falling, and you tell the eleven when it will cross and you are right to the quarter hour.',
        told: 'read the river and told the eleven the hour it would cross, and were right to the quarter.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, alchemist: 1 },
          lineage: { tidebound: 1 },
          background: { investigator: 1 },
          skill: { cartographer: 1, scholar: 1 },
        },
      },
      {
        id: 'freeze',
        label: 'Freeze it. Not the whole river, only the width of the boat and only for as long as the eleven need, and afterwards nobody on that bank will look at you.',
        told: 'froze the width of the boat for as long as the eleven needed, and nobody on that bank would look at you.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, 'elemental-aspect': 1 },
          lineage: { tidebound: 1 },
          background: { erudit: 1 },
          skill: { 'innate-spell-novice': 1 },
          weapon: { 'frost-wand': 1 },
        },
      },
    ],
  },

  {
    id: 'road-shrine',
    stage: 'road',
    scene:
      'There is a shrine at the fork with a bowl on it and something in the bowl, and the road you want goes past it. The last four travellers have left the bowl alone. There is a smell coming off the shrine that is not incense, and the trees behind it have no birds in them.',
    asks: 'What do you do?',
    recall: 'At the shrine on the fork where the trees had no birds in them, you',
    options: [
      {
        id: 'base',
        label: 'Read the shrine. There is a name cut into the base of it under the moss, and it is not the name of anything that was ever worshipped by choice.',
        told: 'read the name cut into the base of the shrine, which was not one anything was worshipped by choice.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, necromancer: 1 },
          lineage: { undead: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { occultist: 1, scholar: 1 },
        },
      },
      {
        id: 'ditch',
        label: 'Put the shrine in the ditch. It takes both arms and a while, the smell gets worse before it stops, and the birds are back by morning.',
        told: 'put the shrine in the ditch, and the birds were back by morning.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, berserker: 1 },
          lineage: { scorchbound: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
        },
      },
      {
        id: 'round',
        label: 'Leave the bowl and take the long way round through the trees, quietly, to be past the fork before whatever the bowl is for has noticed anybody came.',
        told: 'went the long way round through the trees, and were past the fork before anything noticed you had come.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, wilder: 1, mycomancer: 1 },
          lineage: { wildheart: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, survivalist: 1 },
        },
      },
      {
        id: 'add',
        label: 'Add to the bowl. Whatever is owed there you would rather be a creditor than a stranger, and you say so out loud in a form of words you did not learn from anybody.',
        told: 'added to the bowl, and said so out loud in a form of words you had not learned from anybody.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1, necromancer: 1 },
          lineage: { undead: 1 },
          background: { investigator: 1 },
          skill: { occultist: 1, empath: 1 },
        },
      },
    ],
  },

  {
    id: 'road-pass',
    stage: 'road',
    scene:
      'The pass closes in a day and the party ahead of you is not going to make it, because one of them has a leg and the rest have four days of food between eleven. You have the pass in front of you and the weather behind. Their leader has come back down the trail to ask you for nothing in particular.',
    asks: 'What do you do?',
    recall: 'A day before the pass closed, with eleven people on the trail below it, you',
    options: [
      {
        id: 'leg',
        label: 'Carry the leg. Eleven days of somebody else’s weight over a pass that is closing, and you put him down on the far side and go on.',
        told: 'carried the man with the leg over the closing pass, put him down on the far side and went on.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, painseeker: 1 },
          lineage: { stonebound: 1 },
          background: { mercenary: 1 },
          skill: { helpful: 1, survivalist: 1 },
        },
      },
      {
        id: 'split',
        label: 'Split the party. Six over now with the food and five into the shepherd’s hut with the fire, and say it plainly enough that they actually do it.',
        told: 'split the party, six over the pass and five into the shepherd’s hut, and said it plainly enough that they did it.',
        gives: {
          attribute: { mind: 2 },
          talent: { quartermaster: 1, spellquill: 1 },
          lineage: { luminary: 1 },
          background: { aristocrat: 1 },
          skill: { mastermind: 1, cartographer: 1 },
        },
      },
      {
        id: 'feed',
        label: 'Feed them. Eleven people is nine snares, a frozen hillside and two hours, and you have done it in worse country than this.',
        told: 'fed all eleven off a frozen hillside in two hours, having done it in worse country.',
        gives: {
          attribute: { instinct: 2 },
          talent: { mycomancer: 1, wilder: 1 },
          lineage: { wildheart: 1, wildkin: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, scavenger: 1 },
        },
      },
      {
        id: 'ahead',
        label: 'Go over alone tonight and send help up from the far valley in the morning. It is the only answer in which somebody who can actually help them hears in time.',
        told: 'went over alone that night and sent help up from the far valley in the morning.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, 'feral-curse': 1 },
          lineage: { skybound: 1 },
          background: { mercenary: 1 },
          skill: { cunning: 1, survivalist: 1 },
        },
      },
    ],
  },

  {
    id: 'road-robbers',
    stage: 'road',
    scene:
      'The barrow on the heath has been opened from the side and there are three men down in the hole with a lantern, and a fourth on the top with a crossbow watching the road. What they have taken out is stacked on a cloth. One piece of it is still moving.',
    asks: 'What do you do?',
    recall: 'At the barrow on the heath that was opened from the side, you',
    options: [
      {
        id: 'moving',
        label: 'Take the piece that is moving. It is a blade, the three in the hole have no idea what it is and the one on the top cannot see the cloth.',
        told: 'took the blade that was still moving, which none of the four of them understood.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellblade: 1, necromancer: 1 },
          lineage: { undead: 1 },
          background: { investigator: 1 },
          skill: { occultist: 1, cunning: 1 },
        },
      },
      {
        id: 'hole',
        label: 'Go and put them back in the hole. The crossbow gets one shot and you are on top of the barrow before he has the crank turned.',
        told: 'put all four of them back in the hole, and were on top of the barrow before the crossbow was cranked.',
        tags: ['did:violence'],
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, painseeker: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1 },
          skill: { 'quick-draw': 1, vigilant: 1 },
          weapon: { 'melee-great': 1 },
        },
      },
      {
        id: 'tell',
        label: 'Tell them what they have dug into. Not to save them, because it is already too late for the man with the lantern, and you would rather be the one standing outside.',
        told: 'told them what they had dug into, too late for the man with the lantern.',
        gives: {
          attribute: { mind: 1 },
          talent: { necromancer: 1, arcanist: 1 },
          lineage: { undead: 1 },
          background: { investigator: 1 },
          skill: { inquisitor: 1, occultist: 1 },
        },
      },
      {
        id: 'morning',
        label: 'Wait for the barrow to finish with them and take what is left in the morning. It costs you a cold night and nothing else at all.',
        told: 'waited for the barrow to finish with them and took what was left in the morning.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, mycomancer: 1 },
          lineage: { undead: 1 },
          background: { criminal: 1 },
          skill: { scavenger: 1, vigilant: 1 },
        },
      },
    ],
  },

  {
    id: 'road-press',
    stage: 'road',
    scene:
      'There is a press gang in the taproom and the door behind you has a man against it. Six of them, and they are not looking for volunteers. The innkeeper has taken his money off the bar and gone into the back.',
    asks: 'What do you do?',
    recall: 'In the taproom with a press gang in it and a man on the door, you',
    options: [
      {
        id: 'door',
        label: 'Go through the man on the door. He is the smallest of the six because they always put the smallest on the door, and that is the last mistake they make tonight.',
        told: 'went through the smallest of the six, who was the one they had put on the door.',
        tags: ['did:violence'],
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, brawler: 1 },
          lineage: { draconic: 1 },
          background: { mercenary: 1, criminal: 1 },
          skill: { 'quick-draw': 1, streetwise: 1 },
          weapon: { 'melee-light': 1 },
        },
      },
      {
        id: 'coat',
        label: 'Be somebody else. There is a sea officer’s coat on the peg, and by the time they get to you it is you asking them for their warrant.',
        told: 'put on the sea officer’s coat off the peg, and asked them for their warrant instead.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, 'flowing-fist': 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, entertainer: 1 },
          skill: { cunning: 1, charismatic: 1 },
        },
      },
      {
        id: 'hilt',
        label: 'Put a hand on the hilt at your belt and say the other half of it under your breath, and let all six of them watch what the blade does about that.',
        told: 'put a hand on the hilt and said the other half of it under your breath, in front of all six of them.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 2 },
          talent: { spellblade: 1, weaver: 1 },
          lineage: { infernal: 1 },
          background: { mercenary: 1 },
          skill: { occultist: 1, 'quick-draw': 1 },
        },
      },
      {
        id: 'shilling',
        label: 'Take the shilling and be over the side in the first harbour. A fortnight of their food and a fortnight’s pay is not the worst trade you have made.',
        told: 'took the shilling and were over the side in the first harbour.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, 'cauldron-keeper': 1 },
          lineage: { tidebound: 1 },
          background: { criminal: 1 },
          skill: { seafarer: 1, frugal: 1 },
        },
      },
    ],
  },

  {
    id: 'road-hound',
    stage: 'road',
    scene:
      'Something has been following the wagons since the third night, keeping to the treeline, and this morning it is sitting in the road ahead of you. It is thin and enormous and not a dog. The drovers have stopped and one of them has a bow up.',
    asks: 'What do you do?',
    recall: 'The morning the thing that had followed the wagons sat down in the road, you',
    options: [
      {
        id: 'hand',
        label: 'Walk up to it. You put out a hand at the last of it, it decides and after that it walks where you walk for eleven years.',
        told: 'walked up and put out a hand, and it walked where you walked for eleven years afterwards.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'draconic-bond': 1, 'feral-curse': 1, beastbond: 1 },
          lineage: { wildkin: 1 },
          background: { entertainer: 1 },
          skill: { survivalist: 1, empath: 1 },
        },
      },
      {
        id: 'bow',
        label: 'Get in front of the bow and then in front of the thing, and let it work out for itself which of the two of you is in its road.',
        told: 'got in front of the bow and then in front of the thing, and let it decide which of you was in the road.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, berserker: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
        },
      },
      {
        id: 'what',
        label: 'Find out what it is first. Thin, enormous, three nights of following and no kill, and every one of those facts says something about what it wants.',
        told: 'worked out what it was from three nights of following and no kill.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, alchemist: 1 },
          lineage: { luminary: 1 },
          background: { investigator: 1 },
          skill: { inquisitor: 1, scholar: 1 },
        },
      },
      {
        id: 'feed',
        label: 'Feed it. Whatever has followed a wagon train for three nights without taking a beast is hungry for something else, and you would rather find out cheaply.',
        told: 'fed it, because whatever follows a wagon train for three nights without taking a beast wants something else.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, wilder: 1, 'draconic-bond': 1 },
          lineage: { wildheart: 1, wildkin: 1 },
          background: { outlander: 1 },
          skill: { apothecary: 1, survivalist: 1 },
        },
      },
    ],
  },

  /* ====================================================== leaving, second drop
     Six more for the last night, which had five. */
  {
    id: 'leaving-door',
    stage: 'leaving',
    scene:
      'Your pack is by the door and your mother is standing in front of the door. She has not raised her voice and she is not going to move, and everything she is saying about the road is true. It is an hour before the carrier goes.',
    asks: 'What do you do?',
    recall: 'On the last night, with your mother standing in front of the door, you',
    options: [
      {
        id: 'lift',
        label: 'Pick her up, gently, put her down to one side and go. She is still standing in the road when the carrier turns the corner.',
        told: 'picked her up gently, put her to one side and went, and she was still in the road at the corner.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, totemic: 1 },
          lineage: { stalwart: 1 },
          background: { craftsman: 1 },
          skill: { helpful: 1, frugal: 1 },
        },
      },
      {
        id: 'answer',
        label: 'Answer all of it. Every objection in order, out loud, until there is nothing left standing between you and the door, and then go through it having won.',
        told: 'answered every objection in order until there was nothing left between you and the door.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, spellquill: 1 },
          lineage: { luminary: 1 },
          background: { aristocrat: 1, entertainer: 1 },
          skill: { mastermind: 1, charismatic: 1 },
        },
      },
      {
        id: 'window',
        label: 'Go out the window. The pack is already outside underneath it, because you have known for a week how this hour was going to go.',
        told: 'went out the window to the pack you had left under it a week before.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1 },
          lineage: { wildheart: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'promise',
        label: 'Promise her something, in the form of words you use for the kind of promise that keeps itself. Then go, and carry it.',
        told: 'promised her something in the form of words that keeps itself, and then went and carried it.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1, necromancer: 1 },
          lineage: { celestial: 1 },
          background: { aristocrat: 1 },
          skill: { occultist: 1, empath: 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-name',
    stage: 'leaving',
    scene:
      'The clerk at the gate writes down everybody who goes out on the north road, and he has the pen in his hand and is waiting. There is nothing behind you worth being followed by. Nobody on the road ahead has ever heard of you.',
    asks: 'What do you say?',
    recall: 'At the gate on the north road, with the clerk’s pen waiting, you',
    options: [
      {
        id: 'made',
        label: 'Give him a name you have made up, spelled the way a family with land spells it, then watch him sit up a little straighter as he writes it down.',
        told: 'gave him a made-up name spelled the way a family with land spells it, and watched him sit up straighter.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, entertainer: 1 },
          skill: { cunning: 1, charismatic: 1 },
        },
      },
      {
        id: 'own',
        label: 'Give him your own. It is the only thing your father left you and you are not going to be the one who puts it down.',
        told: 'gave him your own name, because it was the only thing your father left you.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, runebearer: 1, oathbound: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, frugal: 1 },
        },
      },
      {
        id: 'write',
        label: 'Write it yourself. He is glad of the help, and it goes into the book in a hand nobody at that gate can match, which is a thing worth having in a book.',
        told: 'wrote it into the book yourself, in a hand nobody at that gate could match.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, mastermind: 1 },
        },
      },
      {
        id: 'owed',
        label: 'Give him the name of the thing you owe. It is going to be written next to yours eventually and you would rather be the one who put it there.',
        told: 'gave him the name of the thing you owe, rather than wait for it to be written next to yours.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1, necromancer: 1 },
          lineage: { infernal: 1, undead: 1 },
          background: { investigator: 1 },
          skill: { occultist: 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-debt',
    stage: 'leaving',
    scene:
      'You owe eleven silver in this town and you are leaving in the morning, and the man you owe it to has a daughter who has been kind to you. Eleven silver is what the road costs. He has not asked for it in a month.',
    asks: 'What do you do?',
    recall: 'With eleven silver owed in that town and the road costing exactly that, you',
    options: [
      {
        id: 'work',
        label: 'Work it off tonight. Whatever there is in his yard that needs a back, and you are on the road at noon instead of dawn and you owe nobody anything.',
        told: 'worked it off in his yard through the night, and went at noon owing nobody anything.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, runebearer: 1 },
          lineage: { stalwart: 1 },
          background: { craftsman: 1 },
          skill: { frugal: 1, helpful: 1 },
        },
      },
      {
        id: 'owed',
        label: 'Leave before dawn and leave it owed. You have carried worse than eleven silver and you have never once gone back for any of it.',
        told: 'left before dawn and left it owed, the way you had left worse than eleven silver.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, wilder: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'better',
        label: 'Leave him something better than eleven silver. What you know about the man who supplies him is worth four times that, and he finds it out on Thursday.',
        told: 'left him what you knew about his supplier, which was worth four times eleven silver.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, investigator: 1 },
          skill: { mastermind: 1, haggler: 1 },
        },
      },
      {
        id: 'sign',
        label: 'Sign for it. Properly, in a form that holds. Put the leaf in his hand so he can read what he is owed and by whom and for how long.',
        told: 'signed for it in a form that holds, and put the leaf in his hand.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1 },
          lineage: { celestial: 1 },
          background: { aristocrat: 1, merchant: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-horse',
    stage: 'leaving',
    scene:
      'There is a horse in the stable that is not yours and will not be missed until Thursday, and the road you are taking is four days on foot and one and a half on that. The stable boy is asleep. You have put your hand on the bolt once already and taken it off again.',
    asks: 'What do you do?',
    recall: 'Over the bolt of a stable door on the last night, you',
    options: [
      {
        id: 'take',
        label: 'Take it, and put it in a field at the far end with the bridle on the gate, so the man gets it back a week later in better condition than he kept it.',
        told: 'took the horse and left it in a field at the far end, in better condition than the man kept it.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'walk',
        label: 'Walk. Four days is four days, and you have not once in your life taken a thing you would afterwards have to explain.',
        told: 'walked the four days, never having taken a thing you would afterwards have to explain.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, runebearer: 1, oathbound: 1 },
          lineage: { stalwart: 1, undead: 1 },
          background: { military: 1 },
          skill: { frugal: 1, survivalist: 1 },
        },
      },
      {
        id: 'talk',
        label: 'Talk to the horse. It comes out of the box for you and follows you down the lane, and no bolt is drawn and nothing is stolen exactly, and it never goes home.',
        told: 'talked the horse out of its box, and it followed you down the lane and never went home.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'draconic-bond': 1, 'feral-curse': 1, beastbond: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1, entertainer: 1 },
          skill: { survivalist: 1, empath: 1 },
        },
      },
      {
        id: 'buy',
        label: 'Buy it. Wake the boy, name a price that is under the horse and over his loyalty, and be four days ahead by Thursday with a bill of sale in your boot.',
        told: 'woke the boy and bought it at a price under the horse and over his loyalty.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1, spellquill: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, aristocrat: 1, entertainer: 1 },
          skill: { haggler: 1, mastermind: 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-letter',
    stage: 'leaving',
    scene:
      'There is an hour before the carrier and there is paper in the house. Everybody who is going to wonder where you went is asleep upstairs. Whatever you leave on this table is the last thing any of them ever hear from you.',
    asks: 'What do you leave?',
    recall: 'On the table, in the hour before the carrier, you left',
    options: [
      {
        id: 'pages',
        label: 'Write it all. Four pages, where you have gone and why and what is to be done about the roof, in a hand every one of them can read.',
        told: 'four pages in a hand all of them could read, down to what was to be done about the roof.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, helpful: 1 },
        },
      },
      {
        id: 'axe',
        label: 'Leave the axe. Sharpened, on the table, where the letter would have been, because there is nothing you could write that says it better.',
        told: 'the axe, sharpened, where the letter would have been.',
        gives: {
          attribute: { physique: 2 },
          talent: { runebearer: 1, colossus: 1 },
          lineage: { stalwart: 1, stonebound: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, frugal: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'nothing',
        label: 'Leave nothing at all. A page is a thing somebody can follow, and you are not going to be followed by anybody, including the people you love.',
        told: 'nothing at all, because a page is a thing somebody can follow.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, 'feral-curse': 1 },
          lineage: { wildheart: 1, undead: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, vigilant: 1 },
        },
      },
      {
        id: 'line',
        label: 'Leave one line, in the form you were taught, so that whoever reads it out loud is standing in a room that is safe for as long as they need it to be.',
        told: 'one line in the form you were taught, so that whoever read it out loud stood in a safe room.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1, thaumaturge: 1 },
          lineage: { celestial: 1 },
          background: { erudit: 1 },
          skill: { occultist: 1, 'innate-spell-novice': 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-grave',
    stage: 'leaving',
    scene:
      'The carrier goes at dawn and there is one grave in this town you are not going to see again. It is an hour’s walk out and back and you have the hour. There is frost on everything and nobody knows you are awake.',
    asks: 'What do you do?',
    recall: 'In the frost before dawn, over the one grave you were leaving behind, you',
    options: [
      {
        id: 'say',
        label: 'Go, and say the whole thing out loud, all of it, in the order it happened. Something in that churchyard is listening and you have known it since you were nine.',
        told: 'said the whole thing out loud in the order it happened, to something in the churchyard that was listening.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 2 },
          talent: { necromancer: 1, spellquill: 1 },
          lineage: { undead: 1 },
          background: { erudit: 1, investigator: 1, aristocrat: 1 },
          skill: { occultist: 1, empath: 1 },
        },
      },
      {
        id: 'stone',
        label: 'Go, and put the stone straight. It has been leaning four years, you are the only one who was ever going to do it, and it takes the hour and both hands.',
        told: 'put the leaning stone straight, which took the hour and both hands.',
        gives: {
          attribute: { physique: 2 },
          talent: { runebearer: 1, colossus: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1 },
          skill: { helpful: 1, skilled: 1 },
        },
      },
      {
        id: 'road',
        label: 'Do not go. You have said everything you are going to say, and you would rather spend the hour making sure nobody sees which road you take.',
        told: 'did not go, and spent the hour making sure nobody saw which road you took.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, wilder: 1 },
          lineage: { wildheart: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, vigilant: 1 },
        },
      },
      {
        id: 'earth',
        label: 'Go, and take something off the grave with you. A handful of the earth in a twist of cloth, because you are not leaving all of them behind and never intended to.',
        told: 'took a handful of the earth off it in a twist of cloth, because you never intended to leave all of them.',
        gives: {
          attribute: { mind: 1 },
          talent: { necromancer: 1 },
          lineage: { undead: 1 },
          background: { investigator: 1 },
          skill: { occultist: 1, survivalist: 1 },
        },
      },
    ],
  },
  {
    /* The Weaver's pair, first half, and it is a scene about a broom on purpose.
       Every other magic set in this pool is taught with a book, a staff, a rune
       or a knife, and the one thing this set says that none of the others do is
       that the implement never mattered. So the scene takes the weapon away and
       asks what is left. */
    id: 'youth-broom',
    stage: 'youth',
    scene:
      'The woman who agrees to teach you keeps no staff, no book and no wand, which is the first thing about her that anybody warns you about. On the first morning she takes the practice sword out of your hands, puts a yard broom in them instead and says it will do. When you ask what it will do, she says that is the question and leaves you in the yard with it until dark.',
    asks: 'What do you do?',
    recall: 'The year your teacher took the sword away and left you a broom, you',
    options: [
      {
        id: 'thread',
        label: 'Stop trying to make the broom into a sword. Run what you have down the handle instead and let go of it on the moment the end of it lands, and by dark there is a fence post in the yard with a hole through it.',
        told: 'stopped making the broom a sword and ran something down the handle instead, and put a hole through a fence post with it.',
        gives: {
          attribute: { instinct: 2 },
          talent: { weaver: 1 },
          lineage: { fey: 1 },
          background: { craftsman: 1, entertainer: 1 },
          skill: { occultist: 1, skilled: 1 },
        },
      },
      {
        id: 'sword',
        label: 'Go and find the practice sword where she put it, and be in the yard with it before she is up. If the lesson is that the tool does not matter, you can learn it later with a proper edge in your hand.',
        told: 'went and got the sword back before she was up, and learned whatever the lesson was with a proper edge in your hand.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, 'weapon-master': 1 },
          lineage: { stalwart: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, 'quick-draw': 1 },
        },
      },
      {
        id: 'ask',
        label: 'Put the broom down and go through her shelves instead, on the reasoning that somebody who owns no staff has written down why. There is nothing on the shelves, which turns out to be the answer as well.',
        told: 'put the broom down and went through her shelves, and found the emptiness of them was the answer as well.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'sweep',
        label: 'Sweep the yard. It is a broom and she did not say it was anything else. By dark the yard is clean and you have thought of four things she might have meant.',
        told: 'swept the yard, because it was a broom and she had not said otherwise.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { luminary: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, helpful: 1 },
        },
      },
    ],
  },

  {
    /* The second half, and on the road rather than in the youth for the reason
       the Spellblade's second is: the yard is where you are told the implement
       does not matter and the road is where somebody takes every implement you
       have. The scene leaves a cook pot and a length of chain on the ground and
       asks which of them is a weapon. */
    id: 'road-chain',
    stage: 'road',
    scene:
      'The bandits came through the camp before first light and took the packs, the mules and every blade anybody had. What is left in the ashes is a cook pot, four feet of cart chain and a tent pole broken in the middle. Two of them are still up on the ridge in the grey, sitting down, waiting to see what the camp does about it.',
    asks: 'What do you do?',
    recall: 'The morning the bandits left you a cook pot and a length of chain, you',
    options: [
      {
        id: 'chain',
        label: 'Pick up the cart chain, run the whole of the night down the length of it and walk up the ridge with it swinging. It is not a weapon and it does not have to be, because what comes off the end of it when it lands was never in the iron.',
        told: 'walked up the ridge with four feet of cart chain and something running down it that had never been in the iron.',
        gives: {
          attribute: { physique: 2 },
          talent: { weaver: 1, runebearer: 1 },
          lineage: { stalwart: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, occultist: 1 },
        },
      },
      {
        id: 'track',
        label: 'Let the two on the ridge have their morning. Go the other way, cut the trail of the mules a mile down the valley and be somewhere they are not expecting anybody by the afternoon.',
        told: 'let the two on the ridge keep their morning and cut the trail of the mules a mile down the valley.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, wilder: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1, criminal: 1 },
          skill: { survivalist: 1, cunning: 1 },
        },
      },
      {
        id: 'stand',
        label: 'Put the broken pole across the gap in the rocks and stand behind it, so whatever comes down off that ridge has to come through one man to get at the rest of the camp.',
        told: 'put the broken pole across the gap and stood behind it, so the ridge had to come through you first.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, oathbound: 1, weaver: 1 },
          lineage: { stonebound: 1 },
          background: { military: 1 },
          skill: { vigilant: 1, helpful: 1 },
        },
      },
      {
        id: 'talk',
        label: 'Fill the cook pot, put it on the fire and wave the two of them down off the ridge to eat. Men who have taken everything you own are men with something to sell, and you have all morning.',
        told: 'put the pot on the fire and waved the two of them down off the ridge to eat, because men who have taken everything have something to sell.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { celestial: 1 },
          background: { merchant: 1, entertainer: 1 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
    ],
  },
  /* ===================================================== childhood, third drop
     Four more, added 2026-09-10 with the drop that spread the points. Every new
     scene here is sited where the count was thin: a fair, a causeway, a dead
     pine and a swarm hand the Entertainer, the tide, the sky and the brewer's
     shelf somewhere to be scored. See data/README.md. */
  {
    id: 'child-fair',
    stage: 'childhood',
    scene:
      'The fair has come to the green and the players have lost their smallest actor to a fever. The man in the painted coat is up on the cart looking over the children at the front, and the part is four lines and a fall off a ladder. He points at you.',
    asks: 'What do you do?',
    recall: 'At the fair, when the players were a child short, you',
    options: [
      {
        id: 'climb',
        label: 'Climb up on the cart and learn the four lines in the time it takes them to paint your face. You take the fall twice, because the first one got a laugh.',
        told: 'climbed up on the cart, learned the four lines while they painted your face and took the fall twice.',
        gives: {
          attribute: { instinct: 2 },
          talent: { virtuoso: 1 },
          lineage: { fey: 1 },
          background: { entertainer: 1, merchant: 1 },
          skill: { troubadour: 1, charismatic: 1 },
        },
      },
      {
        id: 'terms',
        label: 'Ask what the part pays before you climb anything, and settle it in front of the crowd, who are enjoying this more than the play.',
        told: 'asked what the part paid before you climbed anything, and settled it in front of the crowd.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { luminary: 1 },
          background: { merchant: 1, aristocrat: 1 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'ladder',
        label: 'Say yes to the fall and nothing else. You have come off higher things than that ladder and you would rather not say four lines to anybody.',
        told: 'said yes to the fall and nothing else, because you had come off higher things than that ladder.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 1, painseeker: 1 },
          lineage: { stalwart: 1 },
          background: { entertainer: 1 },
          skill: { helpful: 1, vigilant: 1 },
        },
      },
      {
        id: 'mend',
        label: 'Go round behind the cart to the sick boy instead, with the flask off your mother’s shelf and the leaves you keep in your pocket.',
        told: 'went round behind the cart to the sick boy instead, with your mother’s flask and the leaves in your pocket.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, wilder: 1 },
          lineage: { wildheart: 1 },
          background: { entertainer: 1 },
          skill: { apothecary: 1, healer: 1 },
        },
      },
    ],
  },

  {
    id: 'child-tide',
    stage: 'childhood',
    scene:
      'The tide has come in over the causeway faster than anybody expected and the pony cart is stuck halfway across with the whole morning’s fish in it. The water is at the axles and rising. The men on the shore are arguing about whose cart it is.',
    asks: 'What do you do?',
    recall: 'When the tide caught the fish cart on the causeway, you',
    options: [
      {
        id: 'wade',
        label: 'Wade out to the axles, put your shoulder against the wheel and walk the whole cart off the causeway a foot at a time.',
        told: 'waded out to the axles and walked the whole cart off the causeway a foot at a time.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, quartermaster: 1 },
          lineage: { tidebound: 1 },
          background: { outlander: 1 },
          skill: { seafarer: 1, helpful: 1 },
        },
      },
      {
        id: 'swim',
        label: 'Go into the channel where it is over your head, get a hand in the pony’s bridle and swim its head round until it will follow you.',
        told: 'swam out into the channel and turned the pony’s head until it would follow you.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, wilder: 1, 'draconic-bond': 1 },
          lineage: { tidebound: 1, wildkin: 1 },
          background: { outlander: 1 },
          skill: { seafarer: 1, survivalist: 1 },
        },
      },
      {
        id: 'sell',
        label: 'Stay on the shore and tell the arguing men what a cart of fish is worth at noon and what it will be worth at dusk. One of them stops arguing.',
        told: 'told the arguing men what the fish was worth at noon and what it would be worth at dusk.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, pactbound: 1 },
          lineage: { tidebound: 1 },
          background: { merchant: 1, aristocrat: 1 },
          skill: { haggler: 1, frugal: 1 },
        },
      },
      {
        id: 'read',
        label: 'Watch the water on the stones instead and say how long the causeway has left. You are right to the minute, and one of the men remembers it for years.',
        told: 'watched the water on the stones and said how long the causeway had left, and you were right to the minute.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, alchemist: 1, 'elemental-aspect': 1 },
          lineage: { tidebound: 1, skybound: 1 },
          background: { erudit: 1, merchant: 1 },
          skill: { cartographer: 1, seafarer: 1 },
        },
      },
    ],
  },

  {
    id: 'child-kite',
    stage: 'childhood',
    scene:
      'The wind off the ridge has taken your brother’s kite up over the quarry and dropped it in the top of the one dead pine. He is seven and he is crying. The tree is forty feet of dead branch and nothing has climbed it in years.',
    asks: 'What do you do?',
    recall: 'When the kite went into the dead pine above the quarry, you',
    options: [
      {
        id: 'up',
        label: 'Go up it. Forty feet of dead branch, each one tested with a hand before you put weight on it, then down again with the kite in your teeth.',
        told: 'went up forty feet of dead branch and came down again with the kite in your teeth.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, 'flowing-fist': 1 },
          lineage: { skybound: 1, wildkin: 1 },
          background: { outlander: 1, entertainer: 1 },
          skill: { survivalist: 1, vigilant: 1 },
        },
      },
      {
        id: 'fell',
        label: 'Fetch the axe and put the whole tree on the ground. It is dead, it was going to come down on somebody eventually, and the kite is in one piece.',
        told: 'fetched the axe and put the whole dead tree on the ground, and the kite came down in one piece.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, berserker: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1, military: 1 },
          skill: { survivalist: 1, skilled: 1 },
        },
      },
      {
        id: 'line',
        label: 'Tie a stone to a line, throw it over the branch and run what you have down the line until the branch decides to let go of the kite.',
        told: 'threw a line over the branch and ran what you had down it until the branch let go of the kite.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 2 },
          talent: { weaver: 1, enchanter: 1 },
          lineage: { skybound: 1 },
          background: { craftsman: 1 },
          skill: { occultist: 1, skilled: 1 },
        },
      },
      {
        id: 'new',
        label: 'Leave it up there and make him a better one by dark, out of the good ash and your own shirt, which flies higher than the first one ever did.',
        told: 'left it up there and made him a better kite by dark, which flew higher than the first one ever did.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 1, alchemist: 1 },
          lineage: { skybound: 1 },
          background: { craftsman: 1, entertainer: 1 },
          skill: { skilled: 1, helpful: 1 },
        },
      },
    ],
  },

  {
    id: 'child-hive',
    stage: 'childhood',
    scene:
      'The bees have swarmed and hung themselves in a black beard off the low branch of the apple tree, twenty feet from the kitchen door. It has been there since noon. Nobody in the house will go out for the washing and your mother has given up asking them to.',
    asks: 'What do you do?',
    recall: 'When the swarm hung in the apple tree all afternoon, you',
    options: [
      {
        id: 'hands',
        label: 'Walk up to it bare-armed and take it down by hand, into the basket, in one piece. You are stung twice and you do not hurry either time.',
        told: 'walked up to the swarm bare-armed and took it down into the basket in one piece.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, 'draconic-bond': 1, mycomancer: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1, entertainer: 1 },
          skill: { survivalist: 1, helpful: 1 },
        },
      },
      {
        id: 'smoke',
        label: 'Light a smoulder of damp straw under it, work the smoke up into the beard with your hat and box the whole swarm while it is sleepy.',
        told: 'smoked the swarm sleepy with damp straw and boxed the whole of it.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, wilder: 1 },
          lineage: { wildheart: 1, scorchbound: 1 },
          background: { craftsman: 1 },
          skill: { apothecary: 1, skilled: 1 },
        },
      },
      {
        id: 'honey',
        label: 'Work out what a hive is worth over ten years, then walk to the neighbour who keeps bees and sell him a swarm he can see from his own gate.',
        told: 'worked out what a hive was worth over ten years and sold the swarm to the neighbour who kept bees.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, pactbound: 1 },
          lineage: { luminary: 1 },
          background: { merchant: 1, aristocrat: 1 },
          skill: { haggler: 1, mastermind: 1 },
        },
      },
      {
        id: 'branch',
        label: 'Take the branch off at the trunk with one cut and carry the whole thing, bees and all, out to the far hedge on your shoulder.',
        told: 'took the branch off at the trunk and carried the whole thing, bees and all, out to the far hedge.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, berserker: 1, painseeker: 1 },
          lineage: { draconic: 1 },
          background: { craftsman: 1 },
          skill: { helpful: 1, survivalist: 1 },
        },
      },
    ],
  },

  /* ========================================================== home, third drop
     Four more: a jammed wheel, a rider at the door, a sword off the wall and a
     night before a burial. */
  {
    id: 'home-mill',
    stage: 'home',
    scene:
      'The mill wheel has jammed on a drowned branch and the whole village’s flour is behind it. The miller is up to his chest in the race trying to get a rope on the thing and he is losing the light. Your father sent you down an hour ago to watch and learn.',
    asks: 'What do you do?',
    recall: 'When the mill wheel jammed on the drowned branch, you',
    options: [
      {
        id: 'rope',
        label: 'Go into the race beside him and take the other end of the rope. It takes both of you until dark and you are the one still pulling at the end of it.',
        told: 'went into the race beside him and were the one still pulling on the rope at dark.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, runebearer: 1, weaver: 1 },
          lineage: { tidebound: 1 },
          background: { craftsman: 1 },
          skill: { helpful: 1, seafarer: 1 },
        },
      },
      {
        id: 'run',
        label: 'Get a hand on the rope, run what you know down the length of it and let go of it where the rope meets the branch. The branch comes apart under the water.',
        told: 'ran what you knew down the length of the rope and let go of it at the branch, and the branch came apart.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 2 },
          talent: { weaver: 1, arcanist: 1 },
          lineage: { tidebound: 1 },
          background: { craftsman: 1 },
          skill: { occultist: 1, skilled: 1 },
        },
      },
      {
        id: 'wheel',
        label: 'Stop the wheel a different way. The sluice above, the gate on the far side and a count of forty, and the race is dry enough to walk into.',
        told: 'stopped the wheel with the sluice, the gate and a count of forty, and walked into a dry race.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 1, alchemist: 1 },
          lineage: { luminary: 1 },
          background: { craftsman: 1, merchant: 1 },
          skill: { skilled: 1, mastermind: 1 },
        },
      },
      {
        id: 'price',
        label: 'Let it jam. Be on the road to the market town before anybody else has thought about what a fortnight without flour does to the price of bread.',
        told: 'let it jam and were on the road to the market town before anybody thought about the price of bread.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { merchant: 1, criminal: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
    ],
  },

  {
    id: 'home-guest',
    stage: 'home',
    scene:
      'A rider in your lord’s colours has come to the door out of the rain and is to be fed and put up. The house has one chicken, four chairs and a dirt floor. Your mother has gone very quiet, and everyone is waiting to see how the evening is going to be done.',
    asks: 'What do you do?',
    recall: 'The night the lord’s rider was put up at your house, you',
    options: [
      {
        id: 'table',
        label: 'Lay the table as though the house had always done this, sit him at the head of it and talk to him steadily through the whole meal so that nobody else has to.',
        told: 'laid the table as though the house had always done this and talked to him through the whole meal.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, spellquill: 1 },
          lineage: { celestial: 1 },
          background: { aristocrat: 1, entertainer: 1 },
          skill: { charismatic: 1, empath: 1 },
        },
      },
      {
        id: 'sing',
        label: 'Sing for him afterwards. Everything you know, in order, until the rain stops and he has forgotten what the floor is made of.',
        told: 'sang for him afterwards, everything you knew, until he had forgotten what the floor was made of.',
        gives: {
          attribute: { instinct: 1 },
          talent: { virtuoso: 1 },
          lineage: { fey: 1 },
          background: { entertainer: 1, aristocrat: 1 },
          skill: { troubadour: 1, charismatic: 1 },
        },
      },
      {
        id: 'horse',
        label: 'Take his horse instead. Rub it down, walk it dry and stay out in the stable with it the whole evening, which suits both of you.',
        told: 'took his horse instead and stayed out in the stable with it the whole evening.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'draconic-bond': 1, 'feral-curse': 1, beastbond: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1, military: 1 },
          skill: { survivalist: 1, helpful: 1 },
        },
      },
      {
        id: 'chicken',
        label: 'Go back out into the rain and come home with something better than the chicken. It takes you two hours in the dark and nobody asks where it came from.',
        told: 'went back out into the rain and came home with something better than the chicken.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1, painseeker: 1 },
          lineage: { stalwart: 1, draconic: 1 },
          background: { outlander: 1, mercenary: 1 },
          skill: { survivalist: 1, scavenger: 1 },
        },
      },
    ],
  },

  {
    id: 'home-blade',
    stage: 'home',
    scene:
      'Your father’s sword has come off the wall for the first time in your life, because there are men on the road and the village has been told to arm. It is old and the edge is long gone. He has put it in your hands rather than his own and gone back out to the yard.',
    asks: 'What do you do with it?',
    recall: 'The night your father put his old sword in your hands, you',
    options: [
      {
        id: 'edge',
        label: 'Sit up with the stone and the oil and put an edge back on it. It takes until the small hours and by morning it will cut the hair off your arm.',
        told: 'sat up with the stone and the oil until the old sword would cut the hair off your arm.',
        gives: {
          attribute: { physique: 2 },
          talent: { runebearer: 1, 'weapon-master': 1 },
          lineage: { scorchbound: 1 },
          background: { craftsman: 1, military: 1 },
          skill: { skilled: 1, vigilant: 1 },
          weapon: { 'melee-heavy': 1 },
        },
      },
      {
        id: 'word',
        label: 'Say the word nobody taught you over it just once and feel the steel take it the way dry ground takes rain. You do not tell your father about that part.',
        told: 'said the word nobody taught you over the steel and felt it take.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 2 },
          talent: { spellblade: 1, enchanter: 1 },
          lineage: { scorchbound: 1 },
          background: { military: 1, erudit: 1 },
          skill: { occultist: 1, 'quick-draw': 1 },
        },
      },
      {
        id: 'sell',
        label: 'Walk it into the town before dawn and come back with two of something newer, and the difference in your pocket, and an argument to have later.',
        told: 'walked it into town before dawn and came back with two of something newer and the difference in your pocket.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, pactbound: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, aristocrat: 1 },
          skill: { haggler: 1, frugal: 1 },
        },
      },
      {
        id: 'hand',
        label: 'Put it back on the table and take the knife you already know instead. A blade you cannot move quickly is a blade somebody else takes off you.',
        told: 'put it back on the table and took the knife you already knew instead.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, 'flowing-fist': 1 },
          lineage: { wildheart: 1 },
          background: { criminal: 1, mercenary: 1 },
          skill: { 'quick-draw': 1, cunning: 1 },
          weapon: { 'finesse-weapon': 1 },
        },
      },
    ],
  },

  {
    id: 'home-funeral',
    stage: 'home',
    scene:
      'Your grandmother is laid out in the front room and the house is full of people who did not come while she was alive. There is one night before the burial. Somebody has to sit up with her, and nobody has said who.',
    asks: 'What do you do?',
    recall: 'On the night before your grandmother was buried, you',
    options: [
      {
        id: 'sit',
        label: 'Sit up with her the whole night and say back to her, out loud, every single thing she ever said to you. Somewhere near dawn it stops feeling like talking to nobody.',
        told: 'sat up with her all night saying back every single thing she had said to you.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 2 },
          talent: { necromancer: 1, pactbound: 1 },
          lineage: { undead: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { occultist: 1, empath: 1 },
        },
      },
      {
        id: 'room',
        label: 'Work the other room instead. Fill cups, sit down beside people and find out by midnight which of them came for the house and which for the field behind it.',
        told: 'worked the other room and knew by midnight which of them had come for the house and which for the field.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, spellquill: 1 },
          lineage: { luminary: 1 },
          background: { aristocrat: 1, investigator: 1 },
          skill: { inquisitor: 1, empath: 1 },
        },
      },
      {
        id: 'tell',
        label: 'Stand up in front of all of them and tell the story of her, the whole of it, including the parts the family leaves out, until the ones who did not come are crying.',
        told: 'stood up and told the whole story of her, including the parts the family leaves out.',
        gives: {
          attribute: { instinct: 1 },
          talent: { virtuoso: 1 },
          lineage: { fey: 1 },
          background: { entertainer: 1, aristocrat: 1 },
          skill: { troubadour: 1, empath: 1 },
        },
      },
      {
        id: 'dig',
        label: 'Go out with the spade and dig the grave yourself rather than pay the man who does it. It takes most of the night and the sides are straight.',
        told: 'went out with the spade and dug the grave yourself, and the sides were straight.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, runebearer: 1, painseeker: 1 },
          lineage: { stonebound: 1, undead: 1 },
          background: { craftsman: 1 },
          skill: { frugal: 1, survivalist: 1 },
        },
      },
    ],
  },

  /* ========================================================= blood, third drop
     Four more: a stack that broke in the night, a hawk that would not look away,
     an orchard gone grey and a ring of red gold. */
  {
    id: 'blood-ember',
    stage: 'blood',
    scene:
      'The charcoal burners’ stack has broken open in the night and the wind has walked the fire into the standing timber. You are downwind of it with a shovel and no help nearer than the village. The burners’ boy is somewhere between you and the burn.',
    asks: 'What do you do?',
    recall: 'The night the charcoal stack broke open, you',
    options: [
      {
        id: 'break',
        label: 'Cut a break across the wind. Two hundred yards of it with a shovel and a billhook, alone, and the fire comes up to it at dawn and stops.',
        told: 'cut two hundred yards of firebreak across the wind alone, and the fire came up to it and stopped.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, berserker: 1 },
          lineage: { scorchbound: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, helpful: 1 },
        },
      },
      {
        id: 'walk',
        label: 'Walk into the burn for the boy. The heat does not do to you what it is doing to the trees, and you come out the far side carrying him.',
        told: 'walked into the burn for the boy and came out the far side carrying him.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1, painseeker: 1 },
          lineage: { scorchbound: 1, draconic: 1 },
          background: { mercenary: 1, military: 1 },
          skill: { healer: 1, helpful: 1 },
        },
      },
      {
        id: 'wind',
        label: 'Read the wind before you move at all. Where it is now, where it turns at first light and which side of the fire will be safe to stand on in an hour.',
        told: 'read the wind before you moved, and knew which side of the fire would be safe to stand on by dawn.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, 'elemental-aspect': 1 },
          lineage: { skybound: 1, scorchbound: 1 },
          background: { erudit: 1 },
          skill: { cartographer: 1, survivalist: 1 },
        },
      },
      {
        id: 'smother',
        label: 'Smother it the way the burners do, armful by armful of green stuff off the wet ground, until the edge of it is only smoke.',
        told: 'smothered the edge of it with armfuls of green stuff off the wet ground until it was only smoke.',
        gives: {
          attribute: { instinct: 1 },
          talent: { mycomancer: 1, wilder: 1 },
          lineage: { wildheart: 1, scorchbound: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, apothecary: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-hawk',
    stage: 'blood',
    scene:
      'There is a hawk on the fence post at the top of the field and it has not moved while you crossed the whole field towards it. Nobody else working the field can see it. It is looking at you the way a person looks at you.',
    asks: 'What do you do?',
    recall: 'When the hawk on the fence post would not look away, you',
    options: [
      {
        id: 'hand',
        label: 'Put out your arm and wait. It comes onto your wrist much heavier than you expected and stays there while you walk the length of the field.',
        told: 'put out your arm, and it came onto your wrist and stayed there the length of the field.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'draconic-bond': 1, 'feral-curse': 1, beastbond: 1 },
          lineage: { skybound: 1, wildkin: 1 },
          background: { outlander: 1, entertainer: 1 },
          skill: { survivalist: 1, empath: 1 },
        },
      },
      {
        id: 'still',
        label: 'Stand still and look back at it until one of the two of you gives way, which takes a quarter of an hour and is not you.',
        told: 'stood and looked back at it for a quarter of an hour, until it was the hawk that gave way.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, wilder: 1 },
          lineage: { skybound: 1 },
          background: { outlander: 1, mercenary: 1 },
          skill: { vigilant: 1, survivalist: 1 },
        },
      },
      {
        id: 'name',
        label: 'Say out loud what you think it actually is, using the name for it. Then watch what happens in its face when you get the name right.',
        told: 'said out loud what you thought it was and watched its face when you got the name right.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1, necromancer: 1 },
          lineage: { skybound: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { occultist: 1, inquisitor: 1 },
        },
      },
      {
        id: 'stone',
        label: 'Put a stone through it. A thing that watches you across a whole field is a thing that was sent, and you would rather send something back.',
        told: 'put a stone through it, because a thing that watches you across a field has been sent.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1, brawler: 1, painseeker: 1 },
          lineage: { draconic: 1, undead: 1 },
          background: { mercenary: 1, criminal: 1 },
          skill: { vigilant: 1, scavenger: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-orchard',
    stage: 'blood',
    scene:
      'Every tree in the orchard has gone over to a grey bloom in a single week and the fruit is coming off soft and black. The old men have said to burn the lot before it crosses the lane. You have been out there since first light with your hands in it.',
    asks: 'What do you do?',
    recall: 'The week the grey bloom took the whole orchard, you',
    options: [
      {
        id: 'learn',
        label: 'Stay out there with it until you know what it is, what it feeds on and what it will not touch. By the fourth day you can tell which tree it takes next.',
        told: 'stayed out in the orchard until you could tell which tree the bloom would take next.',
        gives: {
          attribute: { instinct: 2 },
          talent: { mycomancer: 1, wilder: 1 },
          lineage: { wildheart: 1, wildkin: 1 },
          background: { outlander: 1 },
          skill: { apothecary: 1, survivalist: 1 },
        },
      },
      {
        id: 'burn',
        label: 'Burn the lot. Tree by tree, down to the roots, with the wind at your back and the torch in your own hand, and the lane never catches.',
        told: 'burned the orchard down to the roots, tree by tree, with the torch in your own hand.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, painseeker: 1 },
          lineage: { scorchbound: 1 },
          background: { military: 1, mercenary: 1 },
          skill: { survivalist: 1, helpful: 1 },
        },
      },
      {
        id: 'jar',
        label: 'Take a jar of it back to the bench and spend a fortnight finding out what kills it, what only slows it and what feeds it instead.',
        told: 'took a jar of it to the bench and spent a fortnight finding out what killed it and what fed it.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1, thaumaturge: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { apothecary: 1, physician: 1 },
        },
      },
      {
        id: 'graft',
        label: 'Save the four trees that are still clean. Cuttings off all four, wrapped and carried two miles, and in three years there is an orchard again somewhere else.',
        told: 'took cuttings off the four clean trees and carried them two miles, and in three years there was an orchard again.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 1, alchemist: 1 },
          lineage: { celestial: 1 },
          background: { craftsman: 1, merchant: 1 },
          skill: { skilled: 1, frugal: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-coin',
    stage: 'blood',
    scene:
      'The pedlar has spread his tray on the churchyard wall and there is one thing on it you cannot look away from: a ring of red gold with a scale pattern cut into the band. You have never in your life wanted anything the way you want this. You are eleven and you have nothing to trade.',
    asks: 'What do you do?',
    recall: 'When the pedlar’s red gold ring would not let you go, you',
    options: [
      {
        id: 'take',
        label: 'Take it while he is counting somebody else’s coppers, and be at the far end of the churchyard before he has finished counting them.',
        told: 'took it while he was counting somebody else’s coppers and was gone before he finished.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { draconic: 1 },
          background: { criminal: 1, merchant: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'earn',
        label: 'Come back to him every day for a month with something worth a little of it: a rabbit, a load of kindling, a morning’s work, until the ring is yours.',
        told: 'came back to the pedlar every day for a month with something worth a little of it, until the ring was yours.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, runebearer: 1 },
          lineage: { draconic: 1 },
          background: { craftsman: 1, military: 1 },
          skill: { frugal: 1, helpful: 1 },
        },
      },
      {
        id: 'ask',
        label: 'Ask him where it came from. Then ask again, and again, past the answer he gives everybody, until he puts the tray away and will not look at you.',
        told: 'asked him where it came from until he put the tray away and would not look at you.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, necromancer: 1 },
          lineage: { draconic: 1 },
          background: { investigator: 1, erudit: 1 },
          skill: { inquisitor: 1, occultist: 1 },
        },
      },
      {
        id: 'warm',
        label: 'Put one finger on it and know, before he has said a word about it, that the metal is warm and has no business being warm on a wall in November.',
        told: 'put one finger on it and knew the metal was warm, which it had no business being.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, spellblade: 1 },
          lineage: { draconic: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { occultist: 1, 'innate-spell-novice': 1 },
        },
      },
    ],
  },

  /* ========================================================= trade, third drop
     Four more: a wintering troupe, a house on the square, a counting house on
     the bridge and an armourer's free bench. */
  {
    id: 'trade-troupe',
    stage: 'trade',
    scene:
      'The troupe that came through in the spring is back, two players and a wagon short, wintering in the yard behind the inn. The woman who runs them has watched you work that room three nights running. This morning she asked what you are still doing in this town.',
    asks: 'What do you take on?',
    recall: 'When the troupe asked what you were still doing in that town, you',
    options: [
      {
        id: 'boards',
        label: 'Take the boards. By the spring you have four parts, a voice that reaches the back of a market square and a name in two counties.',
        told: 'took the boards, and by spring you had four parts and a name in two counties.',
        gives: {
          attribute: { instinct: 2 },
          talent: { virtuoso: 1 },
          lineage: { fey: 1 },
          background: { entertainer: 1, merchant: 1 },
          skill: { troubadour: 1, charismatic: 1 },
          weapon: { 'enchanted-instrument': 1 },
        },
      },
      {
        id: 'books',
        label: 'Take the books. A troupe that cannot count its own gate is a troupe that starves in March, and by March they are not starving.',
        told: 'took the books, because a troupe that cannot count its own gate starves in March.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, pactbound: 1 },
          lineage: { luminary: 1 },
          background: { merchant: 1, aristocrat: 1 },
          skill: { mastermind: 1, haggler: 1 },
        },
      },
      {
        id: 'wagon',
        label: 'Take the wagon, the horses and everything in the show that has to be lifted, put up before dark and taken down again by lamplight.',
        told: 'took the wagon, the horses and everything in the show that had to be lifted.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, guardian: 1, quartermaster: 1 },
          lineage: { stalwart: 1 },
          background: { craftsman: 1, entertainer: 1 },
          skill: { helpful: 1, skilled: 1 },
        },
      },
      {
        id: 'paint',
        label: 'Take the paint, the wire and the flash powder: everything that makes a stage do the things a stage is not supposed to be able to do.',
        told: 'took the paint, the wire and the flash powder, and made the stage do what a stage should not.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1, 'elemental-aspect': 1 },
          lineage: { scorchbound: 1 },
          background: { craftsman: 1, entertainer: 1 },
          skill: { skilled: 1, apothecary: 1 },
        },
      },
    ],
  },

  {
    id: 'trade-house',
    stage: 'trade',
    scene:
      'The house on the square has taken you on for the season. On the third morning the steward puts a ring of keys in your hand and says the family will be down at eleven. Nobody has yet told you which of the eleven people in this house you actually work for.',
    asks: 'What do you do first?',
    recall: 'When the steward handed you the keys of the house on the square, you',
    options: [
      {
        id: 'learn',
        label: 'Learn all eleven of them by the end of the week: what each one wants, what each one is afraid of and which two of them are not speaking.',
        told: 'learned all eleven of them by the end of the week, down to which two were not speaking.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1, pactbound: 1 },
          lineage: { luminary: 1 },
          background: { aristocrat: 1, investigator: 1 },
          skill: { empath: 1, mastermind: 1 },
        },
      },
      {
        id: 'keys',
        label: 'Learn the keys instead. Which doors the ring opens, which it does not, and what is behind the two doors nobody on that ring can get into.',
        told: 'learned the keys instead, and what was behind the two doors the ring would not open.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, investigator: 1 },
          skill: { cunning: 1, vigilant: 1 },
        },
      },
      {
        id: 'work',
        label: 'Do the work that is in front of you and be the one thing in that house that nobody upstairs ever has to think about, for the whole season.',
        told: 'did the work in front of you and were the one thing in that house nobody upstairs had to think about.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, runebearer: 1, oathbound: 1 },
          lineage: { stalwart: 1 },
          background: { craftsman: 1, military: 1 },
          skill: { helpful: 1, frugal: 1 },
        },
      },
      {
        id: 'kitchen',
        label: 'Go down to the kitchen, where the cook has been thirty years and has the whole house in her head, and make yourself useful over a pot.',
        told: 'went down to the kitchen, where the cook had thirty years of the house in her head.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, trickster: 1 },
          lineage: { wildheart: 1 },
          background: { entertainer: 1, aristocrat: 1 },
          skill: { apothecary: 1, empath: 1 },
        },
      },
    ],
  },

  {
    id: 'trade-bank',
    stage: 'trade',
    scene:
      'The counting house on the bridge will lend to anybody with a name, and you have spent two years making one. The man across the table has your figures in front of him and a decision to make. There are four people in the queue behind you listening to all of it.',
    asks: 'What do you do?',
    recall: 'When the counting house on the bridge weighed your name, you',
    options: [
      {
        id: 'figures',
        label: 'Let the figures do it. Every column of them, out loud, in order, until the only honest thing left for him to do is sign.',
        told: 'let the figures do it, out loud and in order, until the only honest thing left was to sign.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { merchant: 1, erudit: 1 },
          skill: { mastermind: 1, haggler: 1 },
        },
      },
      {
        id: 'name',
        label: 'Spend the name instead. Let him work out, with four people listening, exactly what refusing you in public is going to cost him by Friday.',
        told: 'spent the name instead, and let him work out what refusing you in public would cost him.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1 },
          lineage: { infernal: 1 },
          background: { aristocrat: 1, merchant: 1 },
          skill: { charismatic: 1, haggler: 1 },
        },
      },
      {
        id: 'walk',
        label: 'Stand up, thank him for his afternoon and walk out past the four in the queue. He sends a boy after you before you are off the bridge.',
        told: 'thanked him and walked out, and he sent a boy after you before you were off the bridge.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { merchant: 1, entertainer: 1 },
          skill: { cunning: 1, charismatic: 1 },
        },
      },
      {
        id: 'guard',
        label: 'Take the other work the house is offering instead: the strongroom, the night, the door and a bed in the room behind it.',
        told: 'took the other work the house was offering: the strongroom, the night and the door.',
        gives: {
          attribute: { physique: 1 },
          talent: { guardian: 1, oathbound: 1 },
          lineage: { stalwart: 1 },
          background: { mercenary: 1, military: 1 },
          skill: { vigilant: 1, frugal: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
    ],
  },

  {
    id: 'trade-smith',
    stage: 'trade',
    scene:
      'The armourer on the lower street has more orders than hands and one bench free. He puts three things on it in front of you: a blade with no edge left, a mail shirt with a hole through the back of it and a customer who has been waiting an hour.',
    asks: 'Which do you take?',
    recall: 'When the armourer put three things on his free bench, you',
    options: [
      {
        id: 'blade',
        label: 'Take the blade, and put rather more into the finishing of it than an edge. The man who collects it never does work out why it never needs sharpening.',
        told: 'took the blade and put rather more into the finishing of it than an edge.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 2 },
          talent: { spellblade: 1, enchanter: 1 },
          lineage: { scorchbound: 1 },
          background: { craftsman: 1, mercenary: 1 },
          skill: { skilled: 1, occultist: 1 },
        },
      },
      {
        id: 'mail',
        label: 'Take the mail shirt. Two hundred rings drawn, cut, closed and riveted by hand, four hours of it, and the repair is stronger than the shirt.',
        told: 'took the mail shirt and closed two hundred rings by hand until the repair was stronger than the shirt.',
        gives: {
          attribute: { physique: 2 },
          talent: { runebearer: 1, colossus: 1 },
          lineage: { stonebound: 1, stalwart: 1 },
          background: { craftsman: 1, military: 1 },
          skill: { skilled: 1, frugal: 1 },
          armor: { 'Heavy Armor': 1 },
        },
      },
      {
        id: 'customer',
        label: 'Take the customer, who has been standing there an hour and is worth more to that shop than either of the other two things on the bench.',
        told: 'took the customer, who was worth more to the shop than either thing on the bench.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, spellquill: 1 },
          lineage: { celestial: 1 },
          background: { merchant: 1, aristocrat: 1 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'bench',
        label: 'Take the bench itself. By the end of the month the orders come to you first and the armourer is working down a list in your hand.',
        told: 'took the bench itself, and by the end of the month the armourer was working down a list in your hand.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { merchant: 1, criminal: 1 },
          skill: { cunning: 1, skilled: 1 },
        },
      },
    ],
  },

  /* ======================================================= leaving, third drop
     Four more for the last morning: a company swearing men in, a coaster short a
     hand, a fair filling the square and a shelf over a banked fire. */
  {
    id: 'leaving-oath',
    stage: 'leaving',
    scene:
      'There is a company forming in the square at dawn and they are swearing the men in one at a time, on a book, in front of everybody. Your pack is on your back and the carrier goes in four hours. The sergeant has now seen you standing there twice.',
    asks: 'What do you do?',
    recall: 'On the morning the company swore men in on the square, you',
    options: [
      {
        id: 'swear',
        label: 'Go and stand in the line and swear it, all of it, with your hand on the book and your name said loudly enough for the back of the square.',
        told: 'stood in the line and swore it with your hand on the book, loudly enough for the back of the square.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, runebearer: 1, oathbound: 1 },
          lineage: { stalwart: 1 },
          background: { military: 1, mercenary: 1 },
          skill: { vigilant: 1, helpful: 1 },
        },
      },
      {
        id: 'read',
        label: 'Ask to read the book first, and then read the whole of it, slowly, in front of the queue, because a thing you swear to is a thing you have read.',
        told: 'asked to read the book first, and read the whole of it in front of the queue.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, inquisitor: 1 },
        },
      },
      {
        id: 'carrier',
        label: 'Take the carrier. You are past the end of the square before the sergeant has finished with the man in front of him.',
        told: 'took the carrier, and were past the end of the square before the sergeant looked up.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, wilder: 1 },
          lineage: { wildheart: 1 },
          background: { criminal: 1 },
          skill: { cunning: 1, survivalist: 1 },
        },
      },
      {
        id: 'sell',
        label: 'Sell them the four hours instead: a name for their book that is not quite yours, and a horse they are going to need by noon.',
        told: 'sold them a name for their book that was not quite yours, and a horse they needed by noon.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, criminal: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-tide',
    stage: 'leaving',
    scene:
      'The tide turns at four and the coaster in the harbour is one hand short. The master will take you as far as the next port and no further. The alternative is eleven days of road in the wrong season, and you have to say now.',
    asks: 'What do you do?',
    recall: 'On the turning tide, with the coaster a hand short, you',
    options: [
      {
        id: 'ship',
        label: 'Take the berth. You are up the side with your pack before he has finished saying what the work is, and you are good at it by the second day.',
        told: 'took the berth, and were good at it by the second day.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, wilder: 1 },
          lineage: { tidebound: 1, skybound: 1 },
          background: { merchant: 1 },
          skill: { seafarer: 1, cartographer: 1 },
        },
      },
      {
        id: 'cargo',
        label: 'Take the berth and then take an interest in the cargo, so that by the next port you own a share of what is in the hold and he owes you for it.',
        told: 'took the berth and an interest in the cargo, and owned a share of the hold by the next port.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, pactbound: 1 },
          lineage: { tidebound: 1 },
          background: { merchant: 1, aristocrat: 1 },
          skill: { haggler: 1, mastermind: 1 },
        },
      },
      {
        id: 'road',
        label: 'Take the eleven days. Wrong season, wrong boots and nobody to answer to, and you walk into the next town owing no man an hour of your life.',
        told: 'took the eleven days of road instead, and walked into the next town owing nobody an hour.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, runebearer: 1, painseeker: 1 },
          lineage: { stonebound: 1, stalwart: 1 },
          background: { outlander: 1, mercenary: 1 },
          skill: { survivalist: 1, frugal: 1 },
        },
      },
      {
        id: 'weather',
        label: 'Go and stand on the harbour wall and read the sky for a quarter of an hour before you answer either way. What it says decides it.',
        told: 'stood on the harbour wall and read the sky for a quarter of an hour, and let that decide it.',
        tags: ['did:magic'],
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, 'elemental-aspect': 1 },
          lineage: { skybound: 1, tidebound: 1 },
          background: { erudit: 1, merchant: 1 },
          skill: { cartographer: 1, seafarer: 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-crowd',
    stage: 'leaving',
    scene:
      'There is a fair on the morning you go and the square is packed wall to wall. Whatever you do in the next hour, four hundred people are going to watch you do it. One of them has been asking after you by name since yesterday.',
    asks: 'What do you do?',
    recall: 'On the morning you left, with the fair filling the square, you',
    options: [
      {
        id: 'stage',
        label: 'Get up on the mounting block and give them one last song, then go out of the square while they are still shouting for another.',
        told: 'gave them one last song off the mounting block and went while they were still shouting.',
        gives: {
          attribute: { instinct: 2 },
          talent: { virtuoso: 1 },
          lineage: { celestial: 1 },
          background: { entertainer: 1, aristocrat: 1 },
          skill: { troubadour: 1, charismatic: 1 },
          weapon: { 'enchanted-instrument': 1 },
        },
      },
      {
        id: 'crowd',
        label: 'Go into the crowd and be four hundred other people all the way across it, and come out of the far side as somebody nobody was asking after.',
        told: 'went into the crowd and came out the far side as somebody nobody was asking after.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, 'flowing-fist': 1, virtuoso: 1 },
          lineage: { fey: 1, skybound: 1 },
          background: { criminal: 1, entertainer: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'through',
        label: 'Walk down the middle of it at your own pace looking at nobody, and let four hundred people work out for themselves how to get out of the way.',
        told: 'walked down the middle of it at your own pace and let the square work out how to move.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, guardian: 1 },
          lineage: { draconic: 1, stalwart: 1 },
          background: { mercenary: 1, military: 1 },
          skill: { vigilant: 1, helpful: 1 },
        },
      },
      {
        id: 'find',
        label: 'Find the one who has been asking after you before they find you, and be the one who opens the conversation, in a place of your choosing.',
        told: 'found the one who had been asking after you first, and opened the conversation yourself.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, pactbound: 1 },
          lineage: { infernal: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { inquisitor: 1, empath: 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-hearth',
    stage: 'leaving',
    scene:
      'The fire is banked for the last time and the shelf over it is your mother’s: forty jars, a copper pot and forty years of knowing what is in each one. She is asleep in the next room. The carrier goes in an hour.',
    asks: 'What do you take off the shelf?',
    recall: 'From your mother’s shelf, in the last hour, you took',
    options: [
      {
        id: 'pot',
        label: 'The copper pot, and as many of the jars as will go in the pack without breaking, wrapped one at a time in everything you own.',
        told: 'the copper pot and as many jars as would go in the pack, wrapped in everything you owned.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, wilder: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1, craftsman: 1 },
          skill: { apothecary: 1, frugal: 1 },
        },
      },
      {
        id: 'book',
        label: 'The one thing on that shelf that is not a jar: her book, forty years of it, in a hand you can only just read.',
        told: 'her book, forty years of it, in a hand you could only just read.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1, alchemist: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1, craftsman: 1 },
          skill: { scholar: 1, apothecary: 1 },
        },
      },
      {
        id: 'thread',
        label: 'The ball of red thread from the back of the shelf, the one she never once let you touch, and you still do not know why you took that.',
        told: 'the ball of red thread she never let you touch, and you still do not know why.',
        gives: {
          attribute: { physique: 1 },
          talent: { weaver: 1, runebearer: 1, totemic: 1 },
          lineage: { stalwart: 1 },
          background: { craftsman: 1, entertainer: 1 },
          skill: { tailor: 1, skilled: 1 },
        },
      },
      {
        id: 'nothing',
        label: 'Nothing off the shelf at all. You write out the forty labels in a fair hand for whoever comes after and leave the list under the pot.',
        told: 'nothing at all, and left forty labels written out in a fair hand under the pot.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1 },
          lineage: { celestial: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, helpful: 1 },
        },
      },
    ],
  },
];
