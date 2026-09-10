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
 * **Simpler, shorter, and an answer that looks after you first, 2026-09-10.**
 * Jules: "Have the question and answer more simple and easy to read and
 * shorter. Have more choices that can be amoral." Every scene is now two or
 * three plain sentences and every answer one line of eight to twenty words,
 * the same means named and the flourish cut: the pool went from 48 words a
 * scene and 30 an answer to 29 and 16, and the backstory's beats shortened
 * with the `told` clauses. And every scene has at least one way of acting
 * that looks after the character before anyone else, about half of them two:
 * take the purse, walk on, sell what you know, let it burn. Some seventy
 * answers were rewritten to be that. Each kept its attribute lane, and where the act
 * changed, the sets, trade and skills under it changed to what the act shows,
 * with one rule learned the hard way: an amoral answer is not a Criminal's
 * answer. A fraud is a merchant's, a desertion a mercenary's, a cold
 * experiment an erudit's, and only a theft or a con puts a point on the
 * Criminal, or the trade wins a quarter of every run. Nothing in the engine
 * or the stages moved.
 *
 * ------------------------------------------------------------------- the laws
 * Five, and scripts/check-crossroads.mjs holds every question and option to them.
 *
 * **A question exposes a scene, then asks.** `scene` is two or three short
 * sentences that put you there: where you stand, what you can see and what is
 * at stake. `asks` is the question that closes it. The stages are the
 * chapters of a life, childhood to the night you left, but nothing in them is a
 * form and nothing asks about the life in the abstract.
 *
 * **Four answers at most.**
 *
 * **An answer is a way of acting.** It names the means and what happens when
 * you use it, in one plain line of eight to twenty words: not "pick the lock"
 * but the picks and the quarter of an hour. A reader should be able to see the
 * character doing it.
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
 *   scene     the situation, two or three short sentences, printed as a paragraph
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
 *   label     the way of acting, as the player reads it: one line, 8 to 20 words
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
      'You are six. The older boys have a stray dog cornered in the mill yard, and the biggest of them has picked up a stone.',
    asks: 'What do you do?',
    recall: 'At six, with a dog cornered behind the mill, you',
    options: [
      {
        id: 'stand',
        label: 'Walk over and stand between the dog and the stone.',
        told: 'stood between the dog and the stone.',
        gives: {
          attribute: { physique: 2 },
          talent: { guardian: 1, colossus: 1 },
          background: { military: 1 },
          skill: { helpful: 1, vigilant: 1 },
        },
      },
      {
        id: 'whistle',
        label: 'Crouch, hold out a hand and whistle the dog over to you.',
        told: 'whistled the dog over to you.',
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
        label: 'Scare them off with a made-up story about what happens to boys who stone dogs.',
        told: 'scared them off with a made-up story.',
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
        label: 'Pick up a stone of your own and throw it hard at the biggest boy.',
        told: 'threw a stone of your own at the biggest boy.',
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
      'The barn is on fire and the calf is still inside. Every grown-up is at the well, and you are the only one near the door.',
    asks: 'What do you do?',
    recall: 'When the barn burned, you',
    options: [
      {
        id: 'in',
        label: 'Pull your shirt over your mouth, go in low and drag the calf out.',
        told: 'went in under the smoke and dragged the calf out.',
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
        label: 'Run round the back, kick the rotten boards loose and call the calf out.',
        told: 'kicked the back boards loose and called the calf out.',
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
        label: 'Go through the empty house while everyone is at the well, and take what you like.',
        told: 'went through the empty house while everyone was at the well.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { scorchbound: 1 },
          background: { criminal: 1 },
          skill: { streetwise: 1, scavenger: 1 },
        },
      },
      {
        id: 'roof',
        label: 'Stand back and watch how the fire moves. You have never seen one this close.',
        told: 'stood back and watched how the fire moved.',
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
      'You are eight, at the market, with one copper. The knife you want costs three, and the stallholder has his back turned.',
    asks: 'What do you do?',
    recall: 'At eight, with a coin that was not enough, you',
    options: [
      {
        id: 'take',
        label: 'Slide the knife into your sleeve and walk away at an ordinary pace.',
        told: 'slid the knife into your sleeve and walked away.',
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
        label: 'Promise him the other two coppers by the winter fair, knowing you will never pay.',
        told: 'promised him the rest by the winter fair, and never paid.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1, tactician: 1 },
          lineage: { celestial: 1 },
          background: { merchant: 1, entertainer: 1 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'crates',
        label: 'Offer to carry his crates all day and take the knife as your wage.',
        told: 'carried his crates all day and took the knife as your wage.',
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
        label: 'Look hard at how the knife is made and go home to make a better one.',
        told: 'studied how the knife was made and made a better one at home.',
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
      'The cellar door has shut behind you and your candle has gone out. Nobody in the house heard the latch drop.',
    asks: 'What do you do?',
    recall: 'Shut in the dark cellar, you',
    options: [
      {
        id: 'shoulder',
        label: 'Find the door by feel and drive your shoulder into it until the latch breaks.',
        told: 'shouldered the door until the latch broke.',
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
        label: 'Sit still on the step and let your eyes get used to the dark.',
        told: 'sat still until your eyes learned the dark.',
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
        label: 'Feel your way along the walls until you know the whole room by heart.',
        told: 'mapped the whole room with your hands.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1 },
          background: { investigator: 1 },
          skill: { skilled: 1, cartographer: 1 },
        },
      },
      {
        id: 'speak',
        label: 'Speak to whatever is down there with you and ask it to show you the door.',
        told: 'spoke to whatever was down there, and something answered.',
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
      'You are twelve. A man in a good coat is on the step asking for your father, who owes him money and is away until tomorrow.',
    asks: 'What do you do?',
    recall: 'When the debt collector came and your father was out, you',
    options: [
      {
        id: 'doorway',
        label: 'Fill the doorway and tell him to come back when your father is home.',
        told: 'filled the doorway and told him to come back tomorrow.',
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
        label: 'Invite him in, pour him the last of the cider and talk him down to half the debt.',
        told: 'talked him down to half the debt over the last of the cider.',
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
        label: 'Shut the door, then follow him home to see where he keeps his ledger.',
        told: 'followed him home to see where he kept his ledger.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'feral-curse': 1 },
          lineage: { fey: 1 },
          background: { investigator: 1 },
          skill: { streetwise: 1, vigilant: 1 },
        },
      },
      {
        id: 'ask',
        label: 'Offer him what you know about where your father keeps his money, for a cut.',
        told: 'sold him what you knew about your father’s money, for a cut.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, enchanter: 1 },
          lineage: { stonebound: 1 },
          background: { merchant: 1, investigator: 1 },
          skill: { haggler: 1, frugal: 1 },
        },
      },
    ],
  },

  {
    id: 'home-sick',
    stage: 'home',
    scene:
      'Your sister has had a fever for three days and the village healer has given up. The nearest physician is two days’ walk away.',
    asks: 'What do you do?',
    recall: 'When your sister’s fever would not break, you',
    options: [
      {
        id: 'go',
        label: 'Take your father’s boots and run for the physician, two days there and back.',
        told: 'ran two days for the physician and brought him back.',
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
        label: 'Gather willow bark and feverfew by the stream and boil them the way your grandmother did.',
        told: 'boiled willow bark and feverfew the way your grandmother did.',
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
        label: 'Read the physician’s almanac by candlelight until you find her fever and its cure.',
        told: 'read the almanac by candlelight until you found her fever.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { physician: 1, scholar: 1 },
        },
      },
      {
        id: 'promise',
        label: 'Sit by her bed and promise anything to anyone listening, if she lives.',
        told: 'promised anything to anyone listening, and the fever broke.',
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
      'At the harvest feast your drunk uncle starts, loudly, on the story about your mother that the family never tells. Heads are turning.',
    asks: 'What do you do?',
    recall: 'When your drunk uncle started the story nobody tells, you',
    options: [
      {
        id: 'back',
        label: 'Walk round the table and put him on his back in the yard with one blow.',
        told: 'put him on his back in the yard with one blow.',
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
        label: 'Stand on the bench and start the harvest song until nobody remembers what he was saying.',
        told: 'started the harvest song until nobody remembered what he had said.',
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
        label: 'Let him finish. You want to hear the rest, and later you can use it.',
        told: 'let him finish, and kept the rest for later use.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, spellquill: 1 },
          lineage: { infernal: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { inquisitor: 1, cunning: 1 },
        },
      },
      {
        id: 'cup',
        label: 'Refill his cup with a pinch of your mother’s valerian in it. He is asleep in a minute.',
        told: 'put valerian in his cup, and he was asleep in a minute.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, virtuoso: 1 },
          lineage: { wildheart: 1 },
          background: { entertainer: 1 },
          skill: { apothecary: 1, cunning: 1 },
        },
      },
    ],
  },

  {
    id: 'home-leave',
    stage: 'home',
    scene:
      'Your family is leaving the valley for good. The cart is full, and your father says there is room for one more thing of yours.',
    asks: 'What do you take?',
    recall: 'When the family left the valley, you took',
    options: [
      {
        id: 'hammer',
        label: 'Your father’s long-handled hammer from the forge, carried on your shoulder the whole way.',
        told: 'your father’s long-handled hammer, carried on your shoulder the whole way.',
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
        label: 'The book from under the stairs that nobody in the house can read.',
        told: 'the book from under the stairs that nobody could read.',
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
        label: 'The hound. It is not a thing and it does not fit, and nobody manages to say no.',
        told: 'the hound, which was not a thing and did not fit.',
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
        label: 'Nothing of yours. You take the neighbour’s good knife off his bench on the way out.',
        told: 'nothing of yours, and the neighbour’s good knife off his bench.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, 'flowing-fist': 1 },
          lineage: { wildheart: 1 },
          background: { criminal: 1, outlander: 1 },
          skill: { cunning: 1, 'quick-draw': 1 },
        },
      },
    ],
  },

  /* ================================================================== blood */
  {
    id: 'blood-cliff',
    stage: 'blood',
    scene:
      'The cliff path has washed away, leaving thirty feet of wet rock between you and where it starts again. The sea is below, and the last village is a day behind you.',
    asks: 'How do you get across?',
    recall: 'With the cliff path gone, you',
    options: [
      {
        id: 'climb',
        label: 'Climb the wet rock hand over hand, never once thinking about the drop.',
        told: 'climbed the wet rock hand over hand.',
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
        label: 'Haul the fallen stones back up one at a time and rebuild the path.',
        told: 'hauled the stones back up and rebuilt the path.',
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
        label: 'Wait for the next traveller to try it first, and watch which holds take his weight.',
        told: 'waited for the next traveller to try it first.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, arcanist: 1 },
          background: { investigator: 1 },
          skill: { cartographer: 1, cunning: 1 },
        },
      },
      {
        id: 'step',
        label: 'Step off the edge. You have always known the wind would hold you.',
        told: 'stepped off the edge, and the wind held you.',
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
      'The river is in flood and a child has gone in off the landing stage. The mother is screaming, and nobody else is moving.',
    asks: 'What do you do?',
    recall: 'When the child went into the flood, you',
    options: [
      {
        id: 'dive',
        label: 'Dive in. The cold and the current never take hold of you the way they take others.',
        told: 'dived in, and the cold and the current never took hold of you.',
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
        label: 'Run the bank ahead of the current and wade in where the river shallows.',
        told: 'ran the bank ahead of the current and caught the child in the shallows.',
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
        label: 'Stay on the bank. Two in the water is two drowned, and it is not your child.',
        told: 'stayed on the bank, because two in the water is two drowned.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, weaver: 1 },
          background: { investigator: 1, erudit: 1 },
          skill: { mastermind: 1, survivalist: 1 },
        },
      },
      {
        id: 'word',
        label: 'Reach out and speak a word you did not know you knew. The river slows around the child.',
        told: 'spoke a word you did not know, and the river slowed around the child.',
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
      'The smith has gone up to his dinner and left the forge lit, with a bar glowing in the coals. You are alone with it for an hour.',
    asks: 'What do you do?',
    recall: 'Alone in the smith’s open forge, you',
    options: [
      {
        id: 'hammer',
        label: 'Take the bar to the anvil and pick up the hammer. Your arm knows the rhythm already.',
        told: 'took the bar to the anvil, and your arm knew the rhythm already.',
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
        label: 'Pull the glowing bar out of the coals with your bare hand to look at it.',
        told: 'pulled the glowing bar out with your bare hand.',
        gives: {
          attribute: { physique: 1 },
          talent: { berserker: 1, painseeker: 1, hemoturgy: 1 },
          lineage: { scorchbound: 1, draconic: 1 },
          background: { mercenary: 1 },
        },
      },
      {
        id: 'study',
        label: 'Touch nothing. Study the steel, the quench and the tools until you understand it all.',
        told: 'touched nothing and studied the whole of it.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1, spellblade: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, scholar: 1 },
        },
      },
      {
        id: 'chisel',
        label: 'Take the good chisel off the bench and be gone before his door opens.',
        told: 'took the good chisel and were gone before his door opened.',
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
      'Three days from the nearest town, the fire has burned low. Three pairs of eyes are at the edge of the light, and the horses are screaming.',
    asks: 'What do you do?',
    recall: 'With wolves at the edge of the firelight, you',
    options: [
      {
        id: 'roar',
        label: 'Snatch a burning brand, stand to your full height and roar at them.',
        told: 'snatched a brand and roared, and the lead wolf thought again.',
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
        label: 'Walk out to the edge of the light and hold the lead wolf’s eyes until it turns away.',
        told: 'held the lead wolf’s eyes until it turned away.',
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
        label: 'Take up the shield and stand between the horses and the dark.',
        told: 'stood between the horses and the dark with the shield.',
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
        label: 'Cut the worst horse loose and drive it at them. Wolves with a kill do not follow.',
        told: 'cut the worst horse loose and drove it at them.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, alchemist: 1 },
          background: { military: 1, outlander: 1 },
          skill: { survivalist: 1, scavenger: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-grave',
    stage: 'blood',
    scene:
      'You wake face down in a ditch with a wound that should have killed you. Your purse and boots are gone, and the men who did it are laughing up the road.',
    asks: 'What do you do?',
    recall: 'Waking in the ditch where they left you for dead, you',
    options: [
      {
        id: 'up',
        label: 'Get up. It hurts less than it should, and you walk four miles barefoot to the inn.',
        told: 'got up and walked four miles barefoot to the inn.',
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
        label: 'Lie still until they move off, then follow them until you know where each one sleeps.',
        told: 'followed them until you knew where each one slept.',
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
        label: 'Pack the wound with moss, bind it with your shirt and count your pulse till morning.',
        told: 'packed the wound with moss and counted your pulse till morning.',
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
        label: 'Promise anything that will listen whatever it wants, in return for the morning.',
        told: 'promised anything that would listen whatever it wanted.',
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
      'The miller’s son has called you out in the square on market day. He is bigger than you, and the whole village has stopped to watch.',
    asks: 'What do you do?',
    recall: 'Called out in front of everyone, you',
    options: [
      {
        id: 'first',
        label: 'Hit him now, before he finishes talking. Keep hitting until he stays down.',
        told: 'hit him before he finished talking and kept hitting until he stayed down.',
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
        label: 'Name the hour and the place, tell him to bring a second and go home to your whetstone.',
        told: 'named the hour and the place and went home to your whetstone.',
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
        label: 'Laugh, agree with everything he says and buy him a cider. The crowd laughs with you.',
        told: 'laughed, agreed with everything and bought him a cider.',
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
        label: 'Walk away with the square watching. You know which night he walks the mill road alone.',
        told: 'walked away, and waited for a night he was alone on the mill road.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, 'feral-curse': 1 },
          lineage: { infernal: 1 },
          background: { mercenary: 1 },
          skill: { vigilant: 1, survivalist: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-lock',
    stage: 'youth',
    scene:
      'You are standing in front of a locked iron gate in a cellar. Through the bars you can see the strongbox you came for, and nobody is coming down before morning.',
    asks: 'How do you get through?',
    recall: 'Faced with a locked gate, you',
    options: [
      {
        id: 'shoulder',
        label: 'Take the bars in both hands, set your feet and pull until the grid comes out of the stone.',
        told: 'pulled the grid out of the stone with your hands.',
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
        label: 'Work the lock with your picks. It takes a quarter of an hour, and then it turns.',
        told: 'worked the lock with your picks for a quarter of an hour.',
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
        label: 'Pour the vial of acid over the hinge pins and lever the gate off when they soften.',
        told: 'poured acid on the hinge pins and levered the gate off.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1, enchanter: 1 },
          background: { craftsman: 1 },
          skill: { apothecary: 1, skilled: 1 },
        },
      },
      {
        id: 'spell',
        label: 'Speak the words that let your hand pass through iron and turn the bolt from the other side.',
        told: 'passed your hand through the iron and turned the bolt from inside.',
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
      'A man is bleeding in the gutter of the high street with a knife wound in his thigh. The crowd is stepping round him, and you are the only one who has stopped.',
    asks: 'What do you do?',
    recall: 'When a man lay bleeding in the street, you',
    options: [
      {
        id: 'flask',
        label: 'Tie off the leg with your belt and pour the healing draught from your flask down his throat.',
        told: 'tied off the leg and gave him the draught from your flask.',
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
        label: 'Get him over your shoulder and carry him three streets to the watch house.',
        told: 'carried him three streets to the watch house.',
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
        label: 'Kneel as if to help, take his purse while you check his pulse and be gone.',
        told: 'took his purse while you checked his pulse, and were gone.',
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
        label: 'Follow the blood to the man who did it, and find out what he will pay for your silence.',
        told: 'followed the blood to the man who did it and named a price for your silence.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, 'feral-curse': 1 },
          lineage: { undead: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { inquisitor: 1, haggler: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-book',
    stage: 'youth',
    scene:
      'A travelling scholar is snoring upstairs and his trunk is open in the taproom, a dozen books showing. You are the last one awake.',
    asks: 'What do you do?',
    recall: 'With the scholar’s trunk open and the scholar asleep, you',
    options: [
      {
        id: 'read',
        label: 'Read by the embers until dawn, then put every book back exactly as it lay.',
        told: 'read until dawn and put every book back exactly as it lay.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, enchanter: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'clasp',
        label: 'Take the small one with the brass clasp. He has eleven others.',
        told: 'took the small book with the brass clasp.',
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
        label: 'Leave the books, and in the morning sell him a lock for three times what it cost you.',
        told: 'sold him a lock in the morning at three times its cost.',
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
        label: 'Drag a chair to the stairs and sit with your back to the trunk until he comes down.',
        told: 'sat with your back to the trunk until he came down.',
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
      'A wildcat is caught in a poacher’s snare at the edge of the wood, the wire deep in its leg. It will take the hand off anyone who comes close.',
    asks: 'What do you do?',
    recall: 'Finding a wounded beast in a snare, you',
    options: [
      {
        id: 'talk',
        label: 'Kneel at the edge of its reach and talk low and steady until it lets you cut the wire.',
        told: 'talked to it low and steady until it let you cut the wire.',
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
        label: 'Kill it with one clean blow of the hatchet and take the meat and the pelt.',
        told: 'killed it with one blow and took the meat and the pelt.',
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
        label: 'Blow sleeping dust in its face, and carry it to the man who buys live cats for the pit.',
        told: 'put it to sleep with dust and sold it live to the pit.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1, tactician: 1 },
          background: { entertainer: 1, craftsman: 1 },
          skill: { apothecary: 1, haggler: 1 },
        },
      },
      {
        id: 'bind',
        label: 'Drop your coat over its head, bind the jaws and pack the wound with moss.',
        told: 'dropped your coat over its head and packed the wound with moss.',
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
      'There is a fist on the door and a voice saying the watch, open up. They have a good description of you from the market.',
    asks: 'What do you do?',
    recall: 'When the watch came to the door with a warrant, you',
    options: [
      {
        id: 'roofs',
        label: 'Go out the back window, across three roofs and down the ivy at the end of the row.',
        told: 'went out the window and across three roofs.',
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
        label: 'Open the door, read the warrant slowly and point out that it names the wrong street.',
        told: 'read the warrant slowly and pointed out it named the wrong street.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { inquisitor: 1, mastermind: 1 },
        },
      },
      {
        id: 'doorway',
        label: 'Open the door, fill it and tell them they are welcome to try.',
        told: 'filled the doorway and told them they were welcome to try.',
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
        label: 'Open the door and sell them the name of the man who paid you.',
        told: 'sold them the name of the man who had paid you.',
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
      'A rider who will not say who sent him brings a letter sealed in grey wax. The academy has been watching you since the day it happened, and a place is open.',
    asks: 'What do you do?',
    recall: 'When the academy’s letter came, you',
    options: [
      {
        id: 'go',
        label: 'Pack that night and go. Whatever they saw in you, they have a name for it.',
        told: 'packed that night and went to hear what they called it.',
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
        label: 'Burn the letter and leave the district that week. Nothing that watches you means you well.',
        told: 'burned the letter and left the district that week.',
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
        label: 'Write back asking what the place pays and what being watched is worth, and name a figure.',
        told: 'wrote back and named a price for the place and another for the watching.',
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
        label: 'Nail the letter to the academy’s door with your knife and wait for someone to come out.',
        told: 'nailed the letter to the academy’s door and waited.',
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
      'The old soldier behind the tannery will work a rune into your skin for coin, and say a word over it. Whatever goes on you tonight is there for life.',
    asks: 'What do you do?',
    recall: 'In the back room of the tannery, you',
    options: [
      {
        id: 'shoulder',
        label: 'Strip to the waist and take the whole shoulder, four hours without a sound.',
        told: 'took the whole shoulder, four hours without a sound.',
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
        label: 'Give up your place and watch from the corner until you know the order the lines go on.',
        told: 'watched from the corner until you knew how the lines went on.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, spellblade: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'wrist',
        label: 'Take something small on the inside of the wrist, where a sleeve hides it.',
        told: 'took something small on the wrist, where a sleeve hides it.',
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
        label: 'Wait until he is drunk, and take the word off him for nothing.',
        told: 'waited until he was drunk and took the word off him for nothing.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1, spellblade: 1 },
          lineage: { infernal: 1 },
          background: { criminal: 1, merchant: 1 },
          skill: { streetwise: 1, occultist: 1 },
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
      'Your summer tutor is two people in one coat. Mornings are spells and declensions, afternoons he knocks you down with a practice blade. He has a year left in him and asks what it is for.',
    asks: 'What do you do?',
    recall: 'When the tutor asked what your last year with him was for, you',
    options: [
      {
        id: 'both',
        label: 'Ask for both at once, and learn to hold a syllable in your teeth until the edge lands.',
        told: 'asked for both at once, and learned to hold a word until the edge landed.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellblade: 1, weaver: 1 },
          background: { mercenary: 1 },
          skill: { occultist: 1, 'quick-draw': 1 },
        },
      },
      {
        id: 'book',
        label: 'Take the mornings. Anyone can learn a blade, and the other half takes a lifetime.',
        told: 'took the mornings, because the other half takes a lifetime.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, enchanter: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'blade',
        label: 'Take the afternoons and tell him to stop going easy on you.',
        told: 'took the afternoons and told him to stop going easy.',
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
        label: 'Find out who is really paying him, and what they would pay you to report on him.',
        told: 'found out who was paying him, and what they would pay you to report on him.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1 },
          lineage: { fey: 1 },
          background: { investigator: 1, entertainer: 1 },
          skill: { inquisitor: 1, empath: 1 },
        },
      },
    ],
  },

  /* ================================================================== trade */
  {
    id: 'trade-fire',
    stage: 'trade',
    scene:
      'The warehouse on the quay is burning from the roof down and half the town has come to watch. The owner stands in the street with his hands in his hair.',
    asks: 'What do you do?',
    recall: 'When the warehouse on the quay burned, you',
    options: [
      {
        id: 'crews',
        label: 'Start shouting orders. Get the dock crews into a bucket line and the pumps working.',
        told: 'got the dock crews into a bucket line and kept them at it till dawn.',
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
        label: 'Watch the crowd, not the fire. One man is far too calm, and you follow him home.',
        told: 'followed the one man who was watching too calmly.',
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
        label: 'Buy the salvage rights off the owner for ready money while the roof is still falling in.',
        told: 'bought the salvage rights while the roof was still falling in.',
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
        label: 'Go in the back door while everyone watches the front and carry out what is not burning yet.',
        told: 'carried out what was not burning yet, through the back door.',
        tags: ['did:theft'],
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
      'A lord’s carriage has broken an axle in the mud a mile from town. The lord is shouting at his coachman in the rain, and you are the only other person on the road.',
    asks: 'What do you do?',
    recall: 'When the lord’s carriage broke its axle, you',
    options: [
      {
        id: 'fix',
        label: 'Splint the axle with a fence rail and harness leather and have it rolling in an hour.',
        told: 'splinted the axle and had it rolling in an hour.',
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
        label: 'Name a price before you touch anything, and when he shouts, double it.',
        told: 'named a price, and doubled it when he shouted.',
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
        label: 'Flatter him by his house and his father’s name, and be in his pay by the time you reach town.',
        told: 'flattered him by his house and his father’s name, and were in his pay by town.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1, tactician: 1 },
          lineage: { celestial: 1 },
          background: { aristocrat: 1, entertainer: 1 },
          skill: { charismatic: 1, cunning: 1 },
        },
      },
      {
        id: 'lift',
        label: 'Lift the back of the carriage clear of the ground while the coachman sets the wheel.',
        told: 'lifted the carriage while the coachman set the wheel.',
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
      'The inn’s singer has not turned up and the room is full of drovers with money and nothing to listen to. The landlord’s eyes keep stopping on you.',
    asks: 'What do you do?',
    recall: 'With the singer missing and the room full, you',
    options: [
      {
        id: 'stage',
        label: 'Get up on the barrel and give them your mother’s songs, then the ones the drovers know.',
        told: 'got up on the barrel and sang your mother’s songs.',
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
        label: 'Tell them a true story from the war and pull up your shirt to show the scar.',
        told: 'told them a war story and showed the scar to prove it.',
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
        label: 'Read them the week’s weather and the prices at the next three markets out of your almanac.',
        told: 'read them the almanac’s weather and the market prices.',
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
        label: 'Work the drovers’ pockets while the room watches the landlord. Thirty men with money is thirty purses.',
        told: 'worked the drovers’ pockets while the room watched the landlord.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, entertainer: 1 },
          skill: { streetwise: 1, cunning: 1 },
        },
      },
    ],
  },

  {
    id: 'trade-body',
    stage: 'trade',
    scene:
      'There is a dead man face down in the alley behind the guildhall, an hour before dawn. His coat is good and his purse is still on his belt.',
    asks: 'What do you do?',
    recall: 'Finding the body behind the guildhall, you',
    options: [
      {
        id: 'read',
        label: 'Read the scene without touching anything, and know how he died before the watch arrives.',
        told: 'read the scene and knew how he died before the watch came.',
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
        label: 'Take the purse, go through his coat for papers and walk away whistling.',
        told: 'took the purse and the papers and walked away whistling.',
        tags: ['did:theft'],
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
        label: 'Carry him to the guildhall steps and sit with him until the porter comes.',
        told: 'carried him to the guildhall steps and sat with him.',
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
        label: 'Send word to the magistrate under your family’s seal, so the matter is yours.',
        told: 'reported it under your family’s seal, so the matter was yours.',
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
      'Dusk on the marsh road, with fog coming off the water. Three men step out of it with knives held low, and the one in the middle says the purse.',
    asks: 'What do you do?',
    recall: 'When three knives came out of the fog, you',
    options: [
      {
        id: 'purse',
        label: 'Hand over the purse without a word. It is your companion’s, and he is asleep at the inn.',
        told: 'handed over the purse, which was your companion’s anyway.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'feral-curse': 1, duelist: 1 },
          lineage: { undead: 1 },
          background: { merchant: 1, investigator: 1 },
          skill: { vigilant: 1, frugal: 1 },
        },
      },
      {
        id: 'roar',
        label: 'Roar, drag your blade out and go straight through the man in the middle.',
        told: 'went straight through the man in the middle, and the other two ran.',
        tags: ['did:violence'],
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
        label: 'Put your back to the milestone, get the shield up and let them come one at a time.',
        told: 'put your back to the milestone and let them come one at a time.',
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
        label: 'Raise your hand and speak the word. The light puts the middle one on his back.',
        told: 'spoke the word, and the light put the middle one on his back.',
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
      'A stranger at the next table has been talking about you, and now the whole taproom can hear it. The room goes quiet, and his hand is near his knife.',
    asks: 'What do you do?',
    recall: 'Insulted in a quiet taproom, you',
    options: [
      {
        id: 'fist',
        label: 'Cross the floor and hit him in the mouth before he finishes the sentence.',
        told: 'hit him in the mouth before he finished the sentence.',
        tags: ['did:violence'],
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
        label: 'Stand up, name him and invite him outside, first blood, with a witness each.',
        told: 'invited him outside to settle it with first blood.',
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
        label: 'Laugh, buy him a cup and find out who is paying him. Then offer to do the job for less.',
        told: 'found out who was paying him and offered to do the job for less.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, pactbound: 1 },
          lineage: { stonebound: 1 },
          background: { investigator: 1, mercenary: 1 },
          skill: { charismatic: 1, mastermind: 1 },
        },
      },
      {
        id: 'cup',
        label: 'Buy him a drink with a few drops from your small bottle in it. He is ill for two days.',
        told: 'put a few drops from your small bottle in his drink.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, wilder: 1 },
          lineage: { undead: 1 },
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
      'The road ends at a river swollen with snowmelt, forty yards across and fast. There is no bridge and no ferry, and you need the far bank by nightfall.',
    asks: 'How do you cross?',
    recall: 'At a river too wide to jump, you',
    options: [
      {
        id: 'swim',
        label: 'Tie your pack on your back and swim, angling downstream with the current.',
        told: 'swam it, and the current carried you three hundred yards.',
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
        label: 'Fell the tallest alder across the narrows and walk over on the trunk.',
        told: 'felled an alder across the narrows and walked over.',
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
        label: 'Wait at the bank for a traveller with a horse, and take the horse across while he sleeps.',
        told: 'took a sleeping traveller’s horse across the river.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, 'feral-curse': 1 },
          lineage: { wildheart: 1 },
          background: { criminal: 1, outlander: 1 },
          skill: { cunning: 1, survivalist: 1 },
        },
      },
      {
        id: 'spell',
        label: 'Speak the words that pull the cold from the air and cross on a bridge of ice.',
        told: 'crossed on a bridge of ice that held just long enough.',
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
      'You stand before the magistrate with your hand on the book. He asks where you were last night, and you were somewhere you should not have been.',
    asks: 'What do you say?',
    recall: 'Asked under oath where you had been, you',
    options: [
      {
        id: 'lie',
        label: 'Lie, in detail and with feeling, about a cousin’s sickbed. The clerk stops writing to listen.',
        told: 'lied in detail about a cousin’s sickbed.',
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
        label: 'Tell the truth, all of it, in plain words. Let him do what he will.',
        told: 'told the truth, all of it, in plain words.',
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
        label: 'Answer a different question at length, until he has forgotten what he first asked.',
        told: 'answered a different question until he forgot what he had asked.',
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
        label: 'Say nothing at all, and let the silence do the work until he gives up.',
        told: 'said nothing at all until he gave up.',
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
      'The tinker has the one thing you need, a good steel awl. He wants three times what it is worth, and he has seen the broken one in your hand.',
    asks: 'What do you do?',
    recall: 'Faced with a price three times too high, you',
    options: [
      {
        id: 'haggle',
        label: 'Pay his price in coin you clipped yourself. He will not find out until the next town.',
        told: 'paid his price in coin you had clipped yourself.',
        tags: ['did:theft'],
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { merchant: 1, criminal: 1 },
          skill: { haggler: 1, cunning: 1 },
        },
      },
      {
        id: 'take',
        label: 'Knock over his tray of buckles and take the awl while he is on his knees.',
        told: 'took the awl while he was picking up his buckles.',
        tags: ['did:theft'],
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
        label: 'Buy a nail from the smith for a copper and grind it into a better awl by the fire.',
        told: 'ground a copper nail into a better awl.',
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
        label: 'Keep your broken one and walk on. You have mended harness with a thorn before.',
        told: 'kept your broken one and mended the harness with a thorn.',
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
      'A dead mage lies in the road with a crossbow bolt in his chest. A wand of pale wood lies in the mud by his hand. It is still warm, and it hums.',
    asks: 'What do you do with it?',
    recall: 'Finding a dead mage’s wand in the mud, you',
    options: [
      {
        id: 'learn',
        label: 'Keep it. By morning you know the first word it wants said to it.',
        told: 'kept it, and by morning knew the first word it wanted.',
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
        label: 'Take it apart with your knife to see how it was made, then put it back together better.',
        told: 'took it apart to see how it was made, and rebuilt it better.',
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
        label: 'Strip the body too, boots and purse and all. Sell the lot in the next town.',
        told: 'stripped the body and sold the lot in the next town.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, virtuoso: 1 },
          lineage: { fey: 1 },
          background: { merchant: 1, criminal: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
      {
        id: 'snap',
        label: 'Snap it over your knee. Nothing good follows a dead mage’s things.',
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
      'The town wall is twelve feet of stone between you and the bed you paid for, and the gate shut at sundown. The watchman has told you to come back at dawn.',
    asks: 'How do you get in?',
    recall: 'With the gate shut for the night, you',
    options: [
      {
        id: 'climb',
        label: 'Climb the wall where the buttress meets the old tower, twelve feet in the dark.',
        told: 'climbed the wall where the buttress met the tower.',
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
        label: 'Beat on the gate with a stone until the watchman opens it to make you stop.',
        told: 'beat on the gate until the watchman opened it to make you stop.',
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
        label: 'Slide two silver through the grille and talk about the cold. The postern opens.',
        told: 'slid two silver through the grille, and the postern opened.',
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
        label: 'Sleep under the hedge down the road until the gate opens. You have slept in worse.',
        told: 'slept under a hedge until the gate opened.',
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
      'There is a heavy purse in the long grass by the stile, with more gold in it than you have ever held. The road is empty both ways.',
    asks: 'What do you do?',
    recall: 'Finding a purse of gold that was not yours, you',
    options: [
      {
        id: 'keep',
        label: 'Put it inside your shirt and keep walking, a little faster than before.',
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
        label: 'Ask after the seal, find the owner and sell it back to her for a finder’s fee of half.',
        told: 'found the owner and sold the purse back to her for half.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, spellquill: 1 },
          lineage: { infernal: 1 },
          background: { aristocrat: 1, investigator: 1 },
          skill: { haggler: 1, inquisitor: 1 },
        },
      },
      {
        id: 'split',
        label: 'Count it into equal shares on the stile, one for each of you walking together.',
        told: 'counted it into equal shares on the stile.',
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
        label: 'Put it back exactly where it lay. Gold in the grass by an empty road is bait.',
        told: 'put it back where it lay, because gold like that is bait.',
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
      'The village you walked into at noon has a fever in it, and the headman has closed the road at both ends. Half the houses have a sick child, and the healer died last week.',
    asks: 'What do you do?',
    recall: 'Shut in a village with a fever, you',
    options: [
      {
        id: 'brew',
        label: 'Gather feverfew, willow and lichen from the hedgerows and have a cauldron going by dark.',
        told: 'had a cauldron of feverfew and willow going by dark.',
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
        label: 'Nurse the ones with money. Cold cloths and a steady voice, at a silver a night.',
        told: 'nursed the ones who could pay, at a silver a night.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1, thaumaturge: 1, necromancer: 1 },
          lineage: { draconic: 1 },
          background: { merchant: 1, investigator: 1 },
          skill: { healer: 1, haggler: 1 },
        },
      },
      {
        id: 'water',
        label: 'Chalk which houses are sick on a door until the pattern shows you which well it is.',
        told: 'worked out which well it was and had it boarded over.',
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
        label: 'Go over the headman’s fence at night and be ten miles away by dawn, fever or no fever.',
        told: 'went over the fence at night and were ten miles away by dawn.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 1, painseeker: 1 },
          lineage: { stalwart: 1 },
          background: { outlander: 1, military: 1 },
          skill: { survivalist: 1, frugal: 1 },
        },
      },
    ],
  },

  {
    id: 'road-camp',
    stage: 'road',
    scene:
      'The third night on the road. The fire is down to a glow and the other two are asleep, and the watch is yours until the moon sets.',
    asks: 'How do you spend the hours?',
    recall: 'On the road, with the others asleep, you spent the night hours',
    options: [
      {
        id: 'sharpen',
        label: 'Go over every blade, buckle and strap with the whetstone and the oil, then do it again.',
        told: 'going over every blade and strap twice with the whetstone.',
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
        label: 'Walk the edge of the camp in the dark, stopping often to listen.',
        told: 'walking the edge of the camp in the dark, listening.',
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
        label: 'Go quietly through the other two’s packs by the firelight and read their letters.',
        told: 'going through the other two’s packs and reading their letters.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1, arcanist: 1 },
          lineage: { undead: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { inquisitor: 1, mastermind: 1 },
        },
      },
      {
        id: 'creature',
        label: 'Sit with the creature that travels with you, head on your knee. Say nothing until the moon sets.',
        told: 'sitting with the creature that travels with you.',
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
      'The only bridge for ten miles has a toll, and the man collecting it is the size of a door. He looks you over, doubles the toll and puts his hand out.',
    asks: 'How do you get across?',
    recall: 'At the bridge where the toll had doubled, you',
    options: [
      {
        id: 'pay',
        label: 'Pay double, smile and ask after his knees. You are across before he thinks of triple.',
        told: 'paid double and were across before he thought of triple.',
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
        label: 'Lift him off his feet, set him down on the other side of the road and walk across.',
        told: 'lifted him off his feet, set him aside and walked across.',
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
        label: 'Walk back to the bend and wade the river under the bridge while he is still counting.',
        told: 'waded the river under the bridge.',
        gives: {
          attribute: { instinct: 1 },
          talent: { trickster: 1, wilder: 1 },
          lineage: { tidebound: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, frugal: 1 },
        },
      },
      {
        id: 'flask',
        label: 'Offer him a drink from your flask. He will not remember you passing, or much else.',
        told: 'gave him a drink from your flask, and he did not remember you passing.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, wilder: 1 },
          lineage: { tidebound: 1 },
          background: { craftsman: 1 },
          skill: { apothecary: 1, haggler: 1 },
        },
      },
    ],
  },

  {
    id: 'road-child',
    stage: 'road',
    scene:
      'A small child is crying alone in the market crowd. A man you do not like the look of is walking towards it too quickly.',
    asks: 'What do you do?',
    recall: 'Seeing a man close on a lost child in the market, you',
    options: [
      {
        id: 'between',
        label: 'Step into his path and stand between him and the child.',
        told: 'stepped between him and the child.',
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
        label: 'Take his wrist as he reaches for the child and hold it until he decides to leave.',
        told: 'took his wrist and held it until he decided to leave.',
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
        label: 'Lift the child onto a barrel and call its description across the whole market.',
        told: 'called the child’s description across the market until the mother came.',
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
        label: 'Do nothing. It is not your child, and you have somewhere to be.',
        told: 'did nothing, because it was not your child.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { undead: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { cunning: 1, frugal: 1 },
        },
      },
    ],
  },

  {
    id: 'road-storm',
    stage: 'road',
    scene:
      'The storm has taken the roof off the inn. The family are out in the yard in the rain with a baby, and the wind is still rising.',
    asks: 'What do you do?',
    recall: 'When the storm took the roof off the inn, you',
    options: [
      {
        id: 'beam',
        label: 'Take the dry room in the stable for yourself. Their roof is their problem.',
        told: 'took the dry room in the stable and left them to their roof.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, painseeker: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1, outlander: 1 },
          skill: { survivalist: 1, frugal: 1 },
        },
      },
      {
        id: 'baby',
        label: 'Put the baby inside your coat and walk two miles into the wind to the next farm.',
        told: 'carried the baby two miles into the wind to the next farm.',
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
        label: 'Get everyone into the cellar and make a fire out of wet wood and a pinch of your powder.',
        told: 'made a fire in the cellar out of wet wood and your powder.',
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
        label: 'Stand in the yard and speak to the storm the way you did once before. It listens, a little.',
        told: 'spoke to the storm, and it listened a little.',
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
      'The man you put on his back years ago is in the taproom doorway with four friends. He has recognised you, and he is pointing.',
    asks: 'What do you do?',
    recall: 'When the man you once put down found you with four friends, you',
    options: [
      {
        id: 'again',
        label: 'Get up and do it again, and this time make sure of it.',
        told: 'got up and did it again, and made sure of it.',
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
        label: 'Turn the table over between them and the rest of the room.',
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
        label: 'Point at the stranger beside you and say that is him, then be out the window.',
        told: 'pointed at the stranger beside you and were out the window.',
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
        label: 'Call for five cups, wave them over and ask after his mother by name.',
        told: 'bought all five a drink and asked after his mother by name.',
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
      'A cart has gone over on the bend and a drover is under the wheel with his leg opened to the bone. There is no surgeon within a day, and everyone is looking at somebody else.',
    asks: 'What do you do?',
    recall: 'With a drover bleeding out under a cart wheel, you',
    options: [
      {
        id: 'hands',
        label: 'Kneel in the blood and hold both hands on the leg until the mark on your arm goes cold.',
        told: 'held both hands on the leg until the mark on your arm went cold.',
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
        label: 'Tip half the green bottle into the wound and the other half into him.',
        told: 'tipped half a green bottle into the wound and half into him.',
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
        label: 'Get your shoulder under the axle and stand up with it while they drag him clear.',
        told: 'lifted the axle while they dragged him clear.',
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
        label: 'Walk on. A leg like that is a dead man, and a dead man is a day’s delay.',
        told: 'walked on, because a leg like that is a dead man.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, 'feral-curse': 1 },
          lineage: { wildheart: 1 },
          background: { mercenary: 1, outlander: 1 },
          skill: { survivalist: 1, cunning: 1 },
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
      'Something has followed the caravan for three nights, and on the fourth it comes straight through the two guards at the tail. The lantern is thirty paces behind you.',
    asks: 'What do you do?',
    recall: 'The night the thing took the tail of the caravan, you',
    options: [
      {
        id: 'meet',
        label: 'Walk into it with the axe and the one word you know, both landing in the same place.',
        told: 'walked into it with a word and an axe landing together.',
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
        label: 'Get distance. Put the width of the yard between you and fill the ground it has to cross.',
        told: 'backed off and filled the ground it had to cross.',
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
        label: 'Go for the lantern and light the whole tail so the people with spears can do their work.',
        told: 'lit the whole tail of the caravan for the people with spears.',
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
        label: 'Cut the mules loose and run. Whatever it is, it is eating guards, not you.',
        told: 'cut the mules loose and ran while it ate the guards.',
        gives: {
          attribute: { instinct: 1 },
          talent: { mycomancer: 1, wilder: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, scavenger: 1 },
        },
      },
    ],
  },

  /* ================================================================ leaving */
  {
    id: 'leaving-night',
    stage: 'leaving',
    scene:
      'It is the night you leave. Behind you the house is burning and the street is coming out in nightshirts, and someone is still inside.',
    asks: 'What do you do?',
    recall: 'The night you left, with the house burning behind you, you',
    options: [
      {
        id: 'back',
        label: 'Go back in through the smoke for the one who is still inside.',
        told: 'went back in through the smoke for the one still inside.',
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
        label: 'Keep walking. You lit it, and the flask that did it is empty in your pocket.',
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
        label: 'Stand in the road and watch until the walls go. Then go.',
        told: 'watched until the walls went, and then left.',
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
        label: 'Run with the hound at your heel and nothing in your hands, and do not stop until dawn.',
        told: 'ran with the hound at your heel until dawn.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'draconic-bond': 1, 'feral-curse': 1, wilder: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1, military: 1 },
          skill: { survivalist: 1, vigilant: 1 },
        },
      },
    ],
  },

  {
    id: 'leaving-carry',
    stage: 'leaving',
    scene:
      'You have one hand free and the cart is already moving. Whatever you do not pick up in ten seconds stays here for good.',
    asks: 'What do you take?',
    recall: 'Out of the life you left, you carried',
    options: [
      {
        id: 'great',
        label: 'Your grandfather’s weapon from over the door, too big for the doorway. You get it out sideways.',
        told: 'the weapon from over the door, which you got out sideways.',
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
        label: 'The blade from under the bed, its twin from the chest and the household purse off the hook.',
        told: 'the two blades and the household purse off the hook.',
        tags: ['did:theft'],
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
        label: 'The book you were never supposed to have, wrapped in your spare shirt.',
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
        label: 'The shield from the wall, with a name painted inside it that is not yours yet.',
        told: 'the shield from the wall, with a name inside it not yet yours.',
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
      'Your pack is on your back and there is room for one more thing. Someone is calling your name from the road, and they will not call twice.',
    asks: 'What goes in?',
    recall: 'Into the pack, with someone calling from the road, went',
    options: [
      {
        id: 'cauldron',
        label: 'The small cauldron, the herbs from the beam and the jar of something that moves.',
        told: 'the small cauldron, the herbs and the jar of something that moved.',
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
        label: 'The pistol from the drawer, the lantern and the list of names you have kept since winter.',
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
        label: 'The contract from the chest, signed in something that was not ink.',
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
        label: 'Nothing. Your two hands and the anger have always been enough.',
        told: 'nothing at all, because your hands and the anger were enough.',
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
      'Your first real fight after you leave. A dead-end alley behind the coaching inn, two men who followed you out and no way past them but through.',
    asks: 'How does it end?',
    recall: 'Your first real fight on the road ended',
    options: [
      {
        id: 'wall',
        label: 'With your back to the wall and the shield up until they tire. Neither gets past you.',
        told: 'with your back to the wall and the shield up, and neither past you.',
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
        label: 'With both of them on the cobbles and no memory at all of the middle part.',
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
        label: 'Before it starts, with your knife in the first one’s back and his purse in your hand.',
        told: 'before it started, with a knife in the first one’s back and his purse in your hand.',
        tags: ['did:violence', 'did:theft'],
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
        label: 'With the far end of the alley on fire and both of them running from it.',
        told: 'with the alley on fire and neither of them touched.',
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
      'The road forks at the milestone: left to the city, right into the forest, straight on to the coast and the pass behind you. Nobody is waiting on any of them.',
    asks: 'Which way do you go?',
    recall: 'At the milestone where the road forked, you took',
    options: [
      {
        id: 'wild',
        label: 'Into the forest. Something under the trees has said your name since you were a child.',
        told: 'the forest road, where something had said your name since childhood.',
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
        label: 'To the city, where there is money to be made off people who do not know you yet.',
        told: 'the city road, where there was money to be made off strangers.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1, spellblade: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, entertainer: 1 },
          skill: { haggler: 1, charismatic: 1 },
        },
      },
      {
        id: 'pass',
        label: 'Up into the pass. You can carry what you need on your own back.',
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
        label: 'Down to the coast and the first ship that will take a hand.',
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
      'It is the second plague summer and only children and the very old are left to carry the dead. They put you on the cart. Forty in the barrow by the end of the week.',
    asks: 'What do you do?',
    recall: 'On the plague cart the summer you were a child, you',
    options: [
      {
        id: 'names',
        label: 'Learn every name and say them over the barrow at the end, in the order they came.',
        told: 'learned all forty names and said them over the barrow.',
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
        label: 'Say nothing and lift. Two a trip, forty by Friday.',
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
        label: 'Open a few of them to find out why it took the miller in a night and left his wife.',
        told: 'opened a few of them to find out why it took some and not others.',
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
        label: 'Get off the cart on the second morning and live off the gardens of the dead.',
        told: 'got off the cart and lived off the gardens of the dead.',
        gives: {
          attribute: { instinct: 2 },
          talent: { mycomancer: 1, wilder: 1, 'cauldron-keeper': 1 },
          lineage: { undead: 1 },
          background: { outlander: 1 },
          skill: { scavenger: 1, survivalist: 1 },
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
      'The bridge crew is nine men short of finishing before the thaw, and the nine are in the churchyard. The foreman is drunk at noon.',
    asks: 'What do you do?',
    recall: 'At the bridge that was nine men short of the thaw, you',
    options: [
      {
        id: 'nine',
        label: 'Go and get the nine. They work all night and never complain about the cold.',
        told: 'got the nine out of the churchyard to work the nights.',
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
        label: 'Sober the foreman up in the trough in front of his crew and put the work back on its feet.',
        told: 'sobered the foreman in the trough and put the work back on its feet.',
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
        label: 'Find the four places the bridge is wrong. Fixing those saves the nine men.',
        told: 'found the four places the bridge was wrong.',
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
        label: 'Wait. A village that will lose everything by the thaw will pay anything by the thaw.',
        told: 'waited for the thaw to raise the price.',
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
      'The abbey pays in bread for a steady copying hand. One day a page turns up in the pile that is not a prayer but instructions, and the last line is a thing that will happen.',
    asks: 'What do you do?',
    recall: 'In the abbey scriptorium, over the page that was not a prayer, you',
    options: [
      {
        id: 'copy',
        label: 'Copy it, and slip the copy into the prior’s prayers to see what happens when he reads it aloud.',
        told: 'slipped a copy into the prior’s prayers to see what would happen.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1, enchanter: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'learn',
        label: 'Learn it properly. It takes eleven weeks, and then you no longer need the page.',
        told: 'spent eleven weeks learning it until you no longer needed the page.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, thaumaturge: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, occultist: 1 },
        },
      },
      {
        id: 'sell',
        label: 'Find the two men in town who will pay for it, and sell it to the one who pays more.',
        told: 'sold the page to the one of two buyers who paid more.',
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
        label: 'Put it in the brazier. You would rather be the only one who ever read the last line.',
        told: 'read the last line twice and put the page in the brazier.',
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
      'The caravan’s guard is worth her wage and cannot read a word. Something has followed the wagons for two nights, and the one working that would answer it is written down.',
    asks: 'What do you do?',
    recall: 'On the caravan the thing followed for two nights, you',
    options: [
      {
        id: 'write',
        label: 'Write it out, hand it to her and sleep. If it does not work, it was her reading.',
        told: 'wrote the working out, handed it to the guard and slept.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1, arcanist: 1 },
          lineage: { luminary: 1 },
          background: { mercenary: 1 },
          skill: { scholar: 1, cunning: 1 },
        },
      },
      {
        id: 'stand',
        label: 'Stand the third watch yourself and let it come while you are awake and facing it.',
        told: 'stood the third watch and let the thing come while you faced it.',
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
        label: 'Teach her the letters. It takes the whole crossing and she hates you for most of it.',
        told: 'taught the guard her letters across the whole crossing.',
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
        label: 'Slip away in the dark. Whatever follows wagons wants wagons, and you are one traveller on foot.',
        told: 'slipped away in the dark and left the wagons to it.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, 'feral-curse': 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1, mercenary: 1 },
          skill: { survivalist: 1, frugal: 1 },
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
      'The miller’s boy has gone through the pond ice, forty feet out. There are four of you on the bank and you are the oldest.',
    asks: 'What do you do?',
    recall: 'The winter the miller’s boy went through the ice, you',
    options: [
      {
        id: 'rail',
        label: 'Pull a rail off the fence, break the ice out to him and haul him through the water.',
        told: 'broke the ice out to him with a fence rail and hauled him in.',
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
        label: 'Slide out flat on your belly until you can grab his collar.',
        told: 'slid out on your belly and grabbed his collar.',
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
        label: 'Send the smallest of the four out on the barn door with a rope, and stay dry on the bank.',
        told: 'sent the smallest of you out on the barn door and stayed dry.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 1, tactician: 1 },
          background: { military: 1, aristocrat: 1 },
          skill: { mastermind: 1, cunning: 1 },
        },
      },
      {
        id: 'swim',
        label: 'Go in off the open bank and swim to him under the ice. The cold never bothers you.',
        told: 'swam to him under the ice, and the cold did not touch you.',
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
      'The tithe-man is counting eleven sacks of your family’s grain where there are nine. Your father stands with his hat off and says nothing.',
    asks: 'What do you do?',
    recall: 'The year the tithe-man counted eleven sacks of nine, you',
    options: [
      {
        id: 'count',
        label: 'Say the true number out loud, sack by sack, in front of his own boy.',
        told: 'said the true number out loud, sack by sack.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1 },
          background: { investigator: 1, merchant: 1, entertainer: 1 },
          skill: { mastermind: 1, inquisitor: 1 },
        },
      },
      {
        id: 'sacks',
        label: 'Move two sacks behind the cart while his boy is busy with the mule.',
        told: 'moved two sacks behind the cart while the boy was busy.',
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
        label: 'Put your hand on his tally stick and keep it there until he decides.',
        told: 'put your hand on the tally stick and kept it there.',
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
        label: 'Tell him quietly that you will keep his secret for a share of the two extra sacks.',
        told: 'offered to keep his secret for a share of the two sacks.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1 },
          lineage: { infernal: 1 },
          background: { aristocrat: 1, investigator: 1 },
          skill: { haggler: 1, mastermind: 1 },
        },
      },
    ],
  },

  {
    id: 'child-bell',
    stage: 'childhood',
    scene:
      'You are up the chapel tower where nobody looks for you. There is smoke moving on the ridge road, and the bell rope is by your hand.',
    asks: 'What do you do?',
    recall: 'Up the chapel tower, with smoke moving on the ridge road, you',
    options: [
      {
        id: 'pull',
        label: 'Pull the rope with both hands until the whole valley is awake.',
        told: 'rang the bell until the whole valley was awake.',
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
        label: 'Watch the smoke first and work out what it is before you ring anything.',
        told: 'watched the smoke first, to ring the right bell.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { inquisitor: 1, cartographer: 1 },
        },
      },
      {
        id: 'ridge',
        label: 'Say nothing and climb down. Whatever is coming, you would rather be gone before it gets here.',
        told: 'climbed down and were gone before it arrived.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, wilder: 1 },
          lineage: { skybound: 1 },
          background: { outlander: 1, entertainer: 1 },
          skill: { survivalist: 1, vigilant: 1 },
        },
      },
      {
        id: 'word',
        label: 'Say the word scratched inside the bell and let it ring itself.',
        told: 'said the word scratched inside the bell, and it rang itself.',
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
      'The lamb was born wrong and will not live till morning. Your grandmother has left the knife on the straw beside you and gone inside.',
    asks: 'What do you do?',
    recall: 'The night the ewe threw wrong, you',
    options: [
      {
        id: 'knife',
        label: 'Use the knife. It takes you two tries, and you tell nobody about the first.',
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
        label: 'Hold the lamb inside your coat against your skin all night until it lives.',
        told: 'held the lamb inside your coat all night until it lived.',
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
        label: 'Let it die, and open it up afterwards to see what went wrong inside.',
        told: 'let it die and opened it up to see what had gone wrong.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1, necromancer: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { physician: 1, apothecary: 1 },
        },
      },
      {
        id: 'words',
        label: 'Say the words your grandmother says over the dying, though nobody taught you them.',
        told: 'said the words your grandmother says over the dying.',
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
      'The plough has turned up a small skull in the top field. Your father has gone for a sack and means to say nothing.',
    asks: 'What do you do?',
    recall: 'Over the skull the plough turned up, you',
    options: [
      {
        id: 'ask',
        label: 'Ask it who it was, not out loud. Wait to see if anything answers.',
        told: 'asked it who it was, and something in the field answered.',
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
        label: 'Dig up the rest of the bones and bury them under a marked stone.',
        told: 'dug up the rest and buried them under a marked stone.',
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
        label: 'Say nothing, take it and sell it to the man in town who buys curiosities.',
        told: 'sold it to the man in town who buys curiosities.',
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
        label: 'Go to the almshouse and keep asking the old people what happened in that field.',
        told: 'kept asking at the almshouse until somebody told you.',
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
      'You copy the schoolmaster’s letters for a farthing a page. Halfway down the pile is a list of names with money beside them, in a different hand.',
    asks: 'What do you do?',
    recall: 'Copying the schoolmaster’s letters at a farthing a page, you',
    options: [
      {
        id: 'twice',
        label: 'Copy the list twice and keep the second copy for yourself.',
        told: 'copied the list twice and kept one.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, mastermind: 1 },
        },
      },
      {
        id: 'hand',
        label: 'Learn the other hand until you can write a line the schoolmaster would swear was his.',
        told: 'learned the other hand well enough to pass for the schoolmaster.',
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
        label: 'Take the page to the first name on it and ask what he will pay for it.',
        told: 'sold the page to the first name on it.',
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
        label: 'Finish the forty pages, take your farthings and say nothing about the list.',
        told: 'finished the forty pages and said nothing about the list.',
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
      'It is the third week of a bad winter and the woodpile is down to two days. The forest behind the house belongs to a man who hangs people for less.',
    asks: 'What do you do?',
    recall: 'The winter the woodpile came down to two days, you',
    options: [
      {
        id: 'axe',
        label: 'Take the axe up at first light and cut his wood in the open, twice a day.',
        told: 'cut his wood in the open with the axe, twice a day.',
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
        label: 'Take the deadfall at night, in small loads by different paths, so nothing shows.',
        told: 'took the deadfall at night by three different paths.',
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
        label: 'Rebuild the hearth instead. You have worked out where the heat has been going.',
        told: 'rebuilt the hearth, because you knew where the heat was going.',
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
        label: 'Tell the man which of your neighbours have been taking his wood, and take the reward in logs.',
        told: 'told the man which neighbours had been taking his wood, for a reward in logs.',
        gives: {
          attribute: { instinct: 1 },
          talent: { virtuoso: 1, wilder: 1 },
          lineage: { infernal: 1 },
          background: { military: 1, investigator: 1 },
          skill: { streetwise: 1, frugal: 1 },
        },
      },
    ],
  },

  {
    id: 'home-brother',
    stage: 'home',
    scene:
      'Your brother has hidden the priest’s silver spoon under a loose board in your room. He says that if it comes out, he will say it was you.',
    asks: 'What do you do?',
    recall: 'Over the priest’s spoon under your brother’s loose board, you',
    options: [
      {
        id: 'take',
        label: 'Take the blame, stand in front of the priest and say nothing at all.',
        told: 'took the blame and said nothing at all.',
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
        label: 'Put the spoon back where the housekeeper will be blamed for it.',
        told: 'put the spoon where the housekeeper would be blamed.',
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
        label: 'Find out what your brother wants, get it for him and name your price for your silence.',
        told: 'named your price for your silence.',
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
        label: 'Settle it with your brother in the yard, then go to the priest together with the spoon.',
        told: 'settled it in the yard and went to the priest with the spoon.',
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
      'There is a man in the front room with your father and a marriage contract on the table. He is thirty and has a mill. You are fifteen.',
    asks: 'What do you do?',
    recall: 'The afternoon they put a marriage contract on the table, you',
    options: [
      {
        id: 'read',
        label: 'Go in, read the contract and point out the four things wrong with it.',
        told: 'read the contract and pointed out the four things wrong with it.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          background: { aristocrat: 1 },
          skill: { scholar: 1, mastermind: 1 },
        },
      },
      {
        id: 'gone',
        label: 'Be gone before they open the door, on the dawn cart to the market town.',
        told: 'were gone on the dawn cart before they opened the door.',
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
        label: 'Agree, and spend the hour working out what the mill is worth and how soon it could be yours.',
        told: 'agreed, and worked out how soon the mill could be yours.',
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
        label: 'Put the contract in the fire and stand in front of the fire.',
        told: 'put the contract in the fire and stood in front of it.',
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
      'The well has gone bad and two children are sick, and your family’s land lies uphill of it. Eleven villagers are at your gate and the smith is doing the talking.',
    asks: 'What do you do?',
    recall: 'The day eleven of the village came to the gate about the well, you',
    options: [
      {
        id: 'spring',
        label: 'Take them up to the spring and show them the dead sheep nobody has looked at.',
        told: 'showed them the dead sheep in the upper spring.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1 },
          background: { investigator: 1 },
          skill: { inquisitor: 1, physician: 1 },
        },
      },
      {
        id: 'gate',
        label: 'Stand in the gateway. Eleven is not many when the first two have to get past you.',
        told: 'stood in the gateway and let them work out who came first.',
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
        label: 'Go over the back wall and be gone. Whoever they blame, it will not be you.',
        told: 'went over the back wall and left them to it.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1, 'feral-curse': 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1, investigator: 1 },
          skill: { survivalist: 1, streetwise: 1 },
        },
      },
      {
        id: 'boil',
        label: 'Boil every drop the village drinks for a fortnight, over a fire you keep alight yourself.',
        told: 'boiled every drop the village drank for a fortnight.',
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
      'The levy takes one from every house with more than one. There are three of you and your brother is lame, and the sergeant is writing names.',
    asks: 'What do you do?',
    recall: 'The morning the levy came for one from every house, you',
    options: [
      {
        id: 'own',
        label: 'Say your own name before anybody else in the house can.',
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
        label: 'Read the warrant and point him at the cousin two fields over who will go for money.',
        told: 'pointed the sergeant at a cousin who would go for money.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { mastermind: 1, inquisitor: 1 },
        },
      },
      {
        id: 'hedge',
        label: 'Be out of the window and into the hedge before he reaches the second name.',
        told: 'went out the window before he reached the second name.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, wilder: 1, 'cauldron-keeper': 1, mycomancer: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, scavenger: 1 },
        },
      },
      {
        id: 'trade',
        label: 'Sell him the deserters’ camp instead. He has been looking for it for a fortnight.',
        told: 'sold him the deserters’ camp instead.',
        gives: {
          attribute: { instinct: 1 },
          talent: { pactbound: 1 },
          lineage: { infernal: 1 },
          background: { merchant: 1, entertainer: 1, military: 1 },
          skill: { haggler: 1, streetwise: 1 },
        },
      },
    ],
  },

  {
    id: 'home-loom',
    stage: 'home',
    scene:
      'Your father has been dead a month and his workshop is yours or nobody’s. A half-finished commission sits on the bench, and the customer comes on Thursday.',
    asks: 'What do you do?',
    recall: 'The month after your father died, over his half-finished commission, you',
    options: [
      {
        id: 'finish',
        label: 'Finish it yourself with his tools, twelve hours a day until Thursday.',
        told: 'finished it yourself, twelve hours a day until Thursday.',
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
        label: 'Read his pattern book first, then finish the piece better than the pattern says.',
        told: 'read his pattern book and finished the piece better than it said.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 1, alchemist: 1, weaver: 1 },
          background: { craftsman: 1 },
          skill: { skilled: 1, scholar: 1 },
        },
      },
      {
        id: 'sell',
        label: 'Sell the tools, the pattern book and the commission to three different people before Thursday.',
        told: 'sold the tools, the book and the commission before Thursday.',
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
        label: 'Cut your father’s mark into it and let the man believe it is his work.',
        told: 'cut your father’s mark into it and let the man believe what he liked.',
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
      'The storm catches you on the open hill with the flock. Your hair lifts off your neck, and the ewe six feet away drops dead where she stands.',
    asks: 'What do you do?',
    recall: 'On the hill the day the storm dropped a ewe beside you, you',
    options: [
      {
        id: 'up',
        label: 'Stand up into it. You have never been afraid of a high place or a hard wind.',
        told: 'stood up into the storm, and it took nothing from you.',
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
        label: 'Butcher the dead ewe on the spot and carry the meat home. Lightning is a fair price for mutton.',
        told: 'butchered the dead ewe and carried the meat home.',
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, painseeker: 1 },
          lineage: { skybound: 1 },
          background: { outlander: 1, craftsman: 1 },
          skill: { survivalist: 1, scavenger: 1 },
        },
      },
      {
        id: 'iron',
        label: 'Lay your iron twelve feet away and lie flat, counting the gaps between flash and thunder.',
        told: 'lay flat with your iron twelve feet off, counting the gaps.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, alchemist: 1 },
          background: { erudit: 1 },
          skill: { scholar: 1, cartographer: 1 },
        },
      },
      {
        id: 'answer',
        label: 'Answer it. Afterwards you can feel the shape it left on your palm.',
        told: 'answered the storm, and carried the shape it left on your palm.',
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
      'The sweating sickness has taken nine houses in the row, your parents’ among them. You have slept on that floor for eleven days and not been ill for an hour.',
    asks: 'What do you do?',
    recall: 'Through eleven days of the sweating sickness that never touched you, you',
    options: [
      {
        id: 'carry',
        label: 'Keep going. Carry water, carry out the dead and be the last one standing in the row.',
        told: 'carried water and carried the dead, and were the last one standing.',
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
        label: 'Find out why not you. Same cup, same room and same air, and there is an answer in that.',
        told: 'set out to find why it had not touched you.',
        gives: {
          attribute: { mind: 2 },
          talent: { alchemist: 1 },
          background: { investigator: 1 },
          skill: { physician: 1, apothecary: 1 },
        },
      },
      {
        id: 'brew',
        label: 'Go to the woods for what your grandmother used and brew it in the yard for the row.',
        told: 'brewed what your grandmother used, in the yard, for the whole row.',
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
        label: 'Go through the empty houses, coolly, for anything worth keeping. The dead are past needing it.',
        told: 'went through the empty houses for anything worth keeping.',
        tags: ['did:theft'],
        gives: {
          attribute: { mind: 1 },
          talent: { necromancer: 1 },
          lineage: { undead: 1 },
          background: { criminal: 1, investigator: 1 },
          skill: { scavenger: 1, occultist: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-glass',
    stage: 'blood',
    scene:
      'The room reflected in the good window is not always the room behind you. Tonight somebody is standing in the reflected doorway, and the real one is empty.',
    asks: 'What do you do?',
    recall: 'The night the window showed somebody in an empty doorway, you',
    options: [
      {
        id: 'watch',
        label: 'Ask it what it will pay you to be let through.',
        told: 'asked it what it would pay to be let through.',
        gives: {
          attribute: { mind: 1 },
          talent: { pactbound: 1, arcanist: 1 },
          lineage: { infernal: 1 },
          background: { erudit: 1 },
          skill: { occultist: 1, haggler: 1 },
        },
      },
      {
        id: 'stand',
        label: 'Go and stand in the real doorway to see which of you the window shows.',
        told: 'stood in the real doorway to see which of you the window showed.',
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
        label: 'Break the window. It costs you a winter of cold and a beating.',
        told: 'broke the window and paid for it with a cold winter and a beating.',
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
        label: 'Speak to it in a language that is not yours, and it answers you in the same.',
        told: 'spoke to it in a language that was not yours, and it answered.',
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
      'The boat has gone over a mile out and the other three are in the water with you. The cold is killing the oldest of them, and it is not touching you.',
    asks: 'What do you do?',
    recall: 'A mile out, in the water the cold could not get into, you',
    options: [
      {
        id: 'hull',
        label: 'Get all three onto the hull and hold it steady from the water for two hours.',
        told: 'held the hull steady from the water for two hours.',
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
        label: 'Swim for the point alone. Half a mile, and you do not look back at the other three.',
        told: 'swam for the point alone and did not look back.',
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
        label: 'Cut the sail loose and get it under all four of you. It floats.',
        told: 'cut the sail loose and got it under all four of you.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 1, weaver: 1 },
          background: { craftsman: 1, merchant: 1 },
          skill: { seafarer: 1, skilled: 1 },
        },
      },
      {
        id: 'ask',
        label: 'Ask the water, the way you have since you were four. It has never said no.',
        told: 'asked the water, and it did not say no.',
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
      'The quarry face has come down on the shift below yours and men are under it. The foreman says there is no getting them out, but something under the stone is still knocking.',
    asks: 'What do you do?',
    recall: 'On the rope the day the quarry face came down, you',
    options: [
      {
        id: 'hands',
        label: 'Go down and move stone with your hands until one of them comes out alive.',
        told: 'moved stone with your hands until one of them came out alive.',
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
        label: 'Read the face first and name the one block holding the rest up.',
        told: 'named the one block holding the rest of the face up.',
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
        label: 'Go in on your belly through the gap nobody else fits, with a line on your ankle.',
        told: 'went in through the gap nobody else fit, on your belly.',
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
        label: 'Go back up the rope. Dead men’s wages are paid to the ones who are still working.',
        told: 'went back up the rope, because the wages go to the living.',
        gives: {
          attribute: { physique: 1 },
          talent: { colossus: 1, painseeker: 1 },
          lineage: { stonebound: 1 },
          background: { craftsman: 1, military: 1 },
          skill: { frugal: 1, vigilant: 1 },
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
      'You are eleven silver down at a table over a tannery, and the dealer has been cheating for an hour. Nobody says anything, because his friends are by the door.',
    asks: 'What do you do?',
    recall: 'Eleven silver down in the room over the tannery, you',
    options: [
      {
        id: 'bottom',
        label: 'Deal off the bottom yourself. He watches faces and not hands, and by midnight you are eight up.',
        told: 'dealt off the bottom yourself and were eight up by midnight.',
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
        label: 'Say it out loud with the count of every hand he has taken, and let the table do the sum.',
        told: 'said it out loud with the count of every hand he had taken.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1 },
          background: { aristocrat: 1, entertainer: 1 },
          skill: { mastermind: 1, charismatic: 1 },
        },
      },
      {
        id: 'table',
        label: 'Turn the table over and leave with your eleven silver and somebody else’s coat.',
        told: 'turned the table over and left with your silver and somebody else’s coat.',
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
        label: 'Lose the rest cheerfully and follow him home. What he does with it is worth more.',
        told: 'lost the rest and followed him home.',
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
      'You went into a dockside inn for bread and woke on a deck with no coast in sight. The mate has your name on his list in a hand that is not yours.',
    asks: 'What do you do?',
    recall: 'On the ship you woke up on four days out, you',
    options: [
      {
        id: 'work',
        label: 'Work harder than anybody for nine weeks and come off the ship with a wage and a trade.',
        told: 'worked harder than anybody and came off with a wage and a trade.',
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
        label: 'Learn every hatch and every watch, and go over the side on the ninth night.',
        told: 'learned every watch and went over the side on the ninth night.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1 },
          lineage: { tidebound: 1 },
          background: { military: 1 },
          skill: { seafarer: 1, vigilant: 1 },
        },
      },
      {
        id: 'charts',
        label: 'Learn the navigation. The mate cannot do it sober, and by the second month the charts are yours.',
        told: 'learned the navigation, and by the second month the charts were yours.',
        gives: {
          attribute: { mind: 2 },
          talent: { enchanter: 1 },
          background: { erudit: 1, merchant: 1 },
          skill: { cartographer: 1, scholar: 1 },
        },
      },
      {
        id: 'hold',
        label: 'Find out what is in the nailed hatch aft, and what the master would pay to keep it quiet.',
        told: 'found what was in the nailed hatch, and what the master would pay for quiet.',
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, duelist: 1 },
          lineage: { wildheart: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { inquisitor: 1, haggler: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-mine',
    stage: 'youth',
    scene:
      'The seam has closed forty feet in, with five men on the wrong side of it. The timber crew says six hours, and you can hear one of them through the fall.',
    asks: 'What do you do?',
    recall: 'The day the seam closed on five men, you',
    options: [
      {
        id: 'dig',
        label: 'Dig without shoring, and do not stop when the crew tells you to.',
        told: 'dug without shoring until two of the five came out.',
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
        label: 'Talk to him through the fall and map what is behind it for the crew, foot by foot.',
        told: 'mapped what was behind the fall from his voice, foot by foot.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { cartographer: 1, mastermind: 1 },
        },
      },
      {
        id: 'round',
        label: 'Go round through the old working above, which everybody says is flooded and is not.',
        told: 'went round through the old working everybody said was flooded.',
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
        label: 'Take the crew’s six hours at their word and go up. Five men’s wages are about to come free.',
        told: 'went up, because five men’s wages were about to come free.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, weaver: 1 },
          background: { craftsman: 1, erudit: 1 },
          skill: { mastermind: 1, frugal: 1 },
        },
      },
    ],
  },

  {
    id: 'youth-pit',
    stage: 'youth',
    scene:
      'The fighting pit behind the horse fair pays a silver to last three rounds and two to win. Last week’s winner has a bad hand, and everybody knows it.',
    asks: 'What do you do?',
    recall: 'At the fighting pit behind the horse fair, you',
    options: [
      {
        id: 'hand',
        label: 'Take the man with the bad hand and be out in four minutes with two silver.',
        told: 'took the man with the bad hand and won in four minutes.',
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
        label: 'Take the biggest man there. You lose the first round badly and then you do not lose again.',
        told: 'took the biggest man there and did not lose after the first round.',
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
        label: 'Take the book instead. You know who falls in the second round, and by dusk you have nine silver.',
        told: 'took the book instead and made nine silver by dusk.',
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
        label: 'Lose twice on purpose, then win the third at eleven to one with everything you own on yourself.',
        told: 'lost twice on purpose and won at eleven to one.',
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
      'The abbey’s physic garden is walled and locked, and the brother who keeps it is dying. You have been over that wall since you were nine, and he knows.',
    asks: 'What do you do?',
    recall: 'Over the wall of the abbey’s physic garden, the year the brother was dying, you',
    options: [
      {
        id: 'sit',
        label: 'Sit with him, and learn which beds are poison, because that is worth more than the rest.',
        told: 'sat with him and learned which beds were poison.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'cauldron-keeper': 1, mycomancer: 1 },
          lineage: { wildkin: 1 },
          background: { outlander: 1, erudit: 1 },
          skill: { apothecary: 1, scholar: 1 },
        },
      },
      {
        id: 'copy',
        label: 'Copy every page of the garden book twice, one for the house and one for you.',
        told: 'copied the garden book twice, one for the house and one for you.',
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
        label: 'Take cuttings of everything and root them two miles off. In three years the garden is yours.',
        told: 'took cuttings of everything, and in three years had a garden of your own.',
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
        label: 'Dig it over for him every morning for a month, because he cannot lift a spade.',
        told: 'dug the garden over for him every morning for a month.',
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
      'The caravan master has lost two people to fever and is hiring three of the nine in the inn yard. He has looked at the yard for ten minutes without a word.',
    asks: 'What do you do?',
    recall: 'In the inn yard below the pass, where the caravan master needed three of nine, you',
    options: [
      {
        id: 'lift',
        label: 'Pick up the heaviest thing in the yard, put it on his wagon and look at him.',
        told: 'put the heaviest thing in the yard on his wagon.',
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
        label: 'Tell him what is wrong with his wheels, his mules and his guards, in that order.',
        told: 'told him what was wrong with his wheels, his mules and his guards.',
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
        label: 'Read his manifest upside down while he talks and offer him the one thing that cargo needs.',
        told: 'read his manifest upside down and offered what the cargo needed.',
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
        label: 'Be on the wagon when it leaves. He can find out he hired you up the road.',
        told: 'were on the wagon when it left, hired or not.',
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
      'The fever house pays in a bed and two meals for anyone who can stand the smell. There are forty beds and four sisters, and the one showing you round has not slept in two days.',
    asks: 'Which work do you take?',
    recall: 'At the fever house with forty beds and four sisters, you',
    options: [
      {
        id: 'hopeless',
        label: 'Take the ones nobody expects to live. Nobody minds what you try on them.',
        told: 'took the hopeless ones, because nobody minded what you tried on them.',
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
        label: 'Take the brewing. Their store is empty and you know where everything grows.',
        told: 'took the brewing and filled their empty store.',
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
        label: 'Take the lifting, the carrying and the dead, twice a week, without flinching.',
        told: 'took the lifting and the dead, without flinching.',
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
        label: 'Take the register, and note which of the dying have nobody coming for their things.',
        told: 'took the register, and noted which of the dying had nobody coming.',
        gives: {
          attribute: { mind: 1 },
          talent: { spellquill: 1, necromancer: 1 },
          lineage: { undead: 1 },
          background: { investigator: 1, erudit: 1 },
          skill: { scholar: 1, inquisitor: 1 },
        },
      },
    ],
  },

  {
    id: 'trade-court',
    stage: 'trade',
    scene:
      'The magistrate’s clerk has died and the court sits on Monday. Eleven cases, forty pages of writ, a queue at the door and a magistrate who cannot read his own hand.',
    asks: 'What do you take on?',
    recall: 'At the magistrate’s court the week his clerk died, you',
    options: [
      {
        id: 'desk',
        label: 'Take the desk. By Monday the forty pages are fair and the cases are in order.',
        told: 'took the desk, and by Monday the writs were fair.',
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
        label: 'Take the queue. Eleven people will each pay to be heard on Monday rather than in spring.',
        told: 'took the queue, and eleven people paid to be heard on Monday.',
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
        label: 'Read all eleven, find the two that are lies and sell the liars a quiet word before Monday.',
        told: 'found the two lies and sold the liars a quiet word before Monday.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, spellquill: 1 },
          lineage: { luminary: 1 },
          background: { investigator: 1, aristocrat: 1 },
          skill: { inquisitor: 1, haggler: 1 },
        },
      },
      {
        id: 'door',
        label: 'Take the door, and stand between the magistrate and the fourth case.',
        told: 'took the door and stood between the magistrate and the fourth case.',
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
      'The counting house on the quay wants somebody who can hold a column in their head. The man interviewing you has his finger on a line, and the line is wrong.',
    asks: 'What do you do?',
    recall: 'In the counting house on the quay, over a line the man had his finger on, you',
    options: [
      {
        id: 'line',
        label: 'Tell him which line is wrong and what it has cost him every month since spring.',
        told: 'told him which line was wrong and what it had cost him.',
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
        label: 'Say nothing, take the work and find out who has been feeding that line.',
        told: 'said nothing, took the work and found who was feeding the line.',
        gives: {
          attribute: { instinct: 2 },
          talent: { trickster: 1 },
          lineage: { infernal: 1 },
          background: { investigator: 1, erudit: 1 },
          skill: { streetwise: 1, mastermind: 1 },
        },
      },
      {
        id: 'six',
        label: 'Ask for the six ledgers behind it, and by evening know enough to bleed the clerk for years.',
        told: 'asked for the six ledgers, and by evening knew enough to bleed the clerk for years.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, spellquill: 1 },
          lineage: { luminary: 1 },
          background: { investigator: 1, criminal: 1 },
          skill: { inquisitor: 1, cunning: 1 },
        },
      },
      {
        id: 'quay',
        label: 'Take the work on the quay instead, carrying what the counting house only counts.',
        told: 'took the work on the quay instead.',
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
      'The free company is taking names in the square and paying a month up front. The man in front of you is fifteen, and everybody knows what happened to the last company.',
    asks: 'What do you do?',
    recall: 'In the square where the free company was taking names, you',
    options: [
      {
        id: 'boy',
        label: 'Sign, then go back down the queue and stand over the fifteen-year-old until he goes home.',
        told: 'signed, and stood over the fifteen-year-old until he went home.',
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
        label: 'Sign, take the month up front and be gone before the company marches.',
        told: 'took the month up front and were gone before the company marched.',
        gives: {
          attribute: { instinct: 2 },
          talent: { duelist: 1, sharpshooter: 1 },
          lineage: { wildheart: 1 },
          background: { mercenary: 1, military: 1 },
          skill: { 'quick-draw': 1, frugal: 1 },
          weapon: { 'paired-finesse': 1 },
        },
      },
      {
        id: 'clerk',
        label: 'Sign as their clerk. A company that cannot count its own powder loses.',
        told: 'signed as their clerk, and by the second month said where the powder went.',
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
        label: 'Do not sign. Follow them at two days’ distance for what they leave behind on the road.',
        told: 'followed the company at two days’ distance for what it left behind.',
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
      'The guild will not have you, and the great house will, as something between a tutor and a curiosity. It is a room in a house with eleven hundred books.',
    asks: 'What do you do?',
    recall: 'When the guild refused you and the great house did not, you',
    options: [
      {
        id: 'read',
        label: 'Go, read what the family did in the war and keep the pages that would ruin them.',
        told: 'read what the family did in the war and kept the pages that would ruin them.',
        gives: {
          attribute: { mind: 2 },
          talent: { arcanist: 1, tactician: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1, aristocrat: 1 },
          skill: { scholar: 1, mastermind: 1 },
        },
      },
      {
        id: 'curiosity',
        label: 'Go, and be so good at being their curiosity that the whole county wants you at table.',
        told: 'went, and were such a curiosity the whole county wanted you at table.',
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
        label: 'Go, and marry into it. Eleven hundred books is a dowry, and you know how these houses fall.',
        told: 'went, and married into it.',
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
        label: 'Do not go. Take the refusal to the quarry, where nobody asks whose child you are.',
        told: 'took the guild’s refusal to the quarry instead.',
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
      'The river is up and the ferryman will not cross. Eleven of you are on the near bank with a fair on the far one, and he has taken the oars into his hut.',
    asks: 'What do you do?',
    recall: 'On the near bank the day the ferryman would not cross, you',
    options: [
      {
        id: 'pole',
        label: 'Take the oars out of his hut while he sleeps and charge the eleven a copper each to cross.',
        told: 'took his oars while he slept and charged the eleven a copper each.',
        tags: ['did:theft'],
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, weaver: 1 },
          lineage: { tidebound: 1 },
          background: { mercenary: 1, merchant: 1 },
          skill: { seafarer: 1, haggler: 1 },
        },
      },
      {
        id: 'shallows',
        label: 'Go up to the stony shallows nobody uses and be in the town before he finishes his dinner.',
        told: 'crossed at the stony shallows and were in town before he finished dinner.',
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
        label: 'Read the river and tell the eleven the hour it will be safe to cross.',
        told: 'read the river and named the hour it would cross.',
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
        label: 'Freeze it, only the width of the boat and only as long as the eleven need.',
        told: 'froze the width of the boat for as long as the eleven needed.',
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
      'A shrine at the fork has a bowl on it with something inside, and the last four travellers left it alone. The trees behind it have no birds.',
    asks: 'What do you do?',
    recall: 'At the shrine on the fork where the trees had no birds, you',
    options: [
      {
        id: 'base',
        label: 'Take what is in the bowl. The last four were fools to leave it.',
        told: 'took what was in the bowl.',
        tags: ['did:theft'],
        gives: {
          attribute: { mind: 1 },
          talent: { necromancer: 1, arcanist: 1 },
          lineage: { undead: 1 },
          background: { criminal: 1, investigator: 1 },
          skill: { occultist: 1, scavenger: 1 },
        },
      },
      {
        id: 'ditch',
        label: 'Put the whole shrine in the ditch. The birds are back by morning.',
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
        label: 'Go the long way round through the trees, quietly, before anything notices you came.',
        told: 'went the long way round before anything noticed you.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, wilder: 1, mycomancer: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1 },
          skill: { survivalist: 1, vigilant: 1 },
        },
      },
      {
        id: 'add',
        label: 'Add to the bowl and say so out loud. Better a creditor than a stranger.',
        told: 'added to the bowl, and said so out loud.',
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
      'The pass closes tomorrow and the party ahead will not make it. One of them has a bad leg, and eleven of them share four days of food.',
    asks: 'What do you do?',
    recall: 'A day before the pass closed, with eleven people on the trail below it, you',
    options: [
      {
        id: 'leg',
        label: 'Carry the man with the bad leg over the pass and put him down on the far side.',
        told: 'carried the man with the bad leg over the pass.',
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
        label: 'Split the party: six over now with the food, five into the shepherd’s hut.',
        told: 'split the party, six over the pass and five into the hut.',
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
        label: 'Feed all eleven off a frozen hillside in two hours. You have done it in worse country.',
        told: 'fed all eleven off a frozen hillside in two hours.',
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
        label: 'Go over alone tonight with your own food. Eleven is not your problem, and the pass is.',
        told: 'went over alone that night with your own food.',
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
      'Three men are down in an opened barrow with a lantern, and a fourth watches the road with a crossbow. What they have taken out is stacked on a cloth, and one piece is moving.',
    asks: 'What do you do?',
    recall: 'At the barrow on the heath that was opened from the side, you',
    options: [
      {
        id: 'moving',
        label: 'Take the piece that is moving. It is a blade, and none of the four knows what it is.',
        told: 'took the blade that was still moving.',
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
        label: 'Put them back in the hole. The crossbow gets one shot before you are on him.',
        told: 'put all four of them back in the hole.',
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
        label: 'Tell them what they have dug into, too late for the man with the lantern.',
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
        label: 'Wait for the barrow to finish with them and take what is left in the morning.',
        told: 'waited for the barrow to finish with them and took what was left.',
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
      'Six of a press gang are in the taproom and one of them has the door. They are not looking for volunteers, and the innkeeper has gone into the back.',
    asks: 'What do you do?',
    recall: 'In the taproom with a press gang in it and a man on the door, you',
    options: [
      {
        id: 'door',
        label: 'Go through the man on the door. He is the smallest, which is why they put him there.',
        told: 'went through the smallest of the six, who had the door.',
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
        label: 'Put on the officer’s coat from the peg, and point them at the two farm boys in the corner instead.',
        told: 'put on the officer’s coat and pointed them at the farm boys in the corner.',
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
        label: 'Put a hand on the hilt and say the other half of it under your breath.',
        told: 'put a hand on the hilt and said the other half of it.',
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
        label: 'Take the shilling and go over the side in the first harbour.',
        told: 'took the shilling and went over the side in the first harbour.',
        gives: {
          attribute: { instinct: 1 },
          talent: { duelist: 1, 'cauldron-keeper': 1 },
          lineage: { tidebound: 1 },
          background: { mercenary: 1 },
          skill: { seafarer: 1, frugal: 1 },
        },
      },
    ],
  },

  {
    id: 'road-hound',
    stage: 'road',
    scene:
      'Something has followed the wagons since the third night, and this morning it is sitting in the road ahead. It is thin and enormous and not a dog.',
    asks: 'What do you do?',
    recall: 'The morning the thing that had followed the wagons sat down in the road, you',
    options: [
      {
        id: 'hand',
        label: 'Walk up and put out a hand. It decides, and after that it walks where you walk.',
        told: 'put out a hand, and it walked where you walked for eleven years.',
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
        label: 'Get in front of the bow and then in front of the thing, and let it choose.',
        told: 'got in front of the bow and then in front of the thing.',
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
        label: 'Work out what it is, and what a man in the next town would pay for it alive.',
        told: 'worked out what it was and what a buyer would pay for it alive.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, alchemist: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { haggler: 1, inquisitor: 1 },
        },
      },
      {
        id: 'feed',
        label: 'Feed it. Whatever follows wagons for three nights without a kill wants something else.',
        told: 'fed it, because it wanted something other than the mules.',
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
      'Your pack is by the door and your mother is standing in front of it. She has not raised her voice, and everything she says about the road is true.',
    asks: 'What do you do?',
    recall: 'On the last night, with your mother standing in front of the door, you',
    options: [
      {
        id: 'lift',
        label: 'Pick her up gently, put her down to one side and go.',
        told: 'picked her up gently, put her to one side and went.',
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
        label: 'Answer every objection in order until nothing is left between you and the door.',
        told: 'answered every objection until nothing was left between you and the door.',
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
        label: 'Go out the window, with the housekeeping money from the jar. She will manage.',
        told: 'went out the window with the housekeeping money.',
        tags: ['did:theft'],
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
        label: 'Promise her something in the form of words that keeps itself, then go and carry it.',
        told: 'promised her something in the form of words that keeps itself.',
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
      'The clerk at the north gate writes down everybody who goes out, and his pen is waiting. Nobody on the road ahead has ever heard of you.',
    asks: 'What do you say?',
    recall: 'At the gate on the north road, with the clerk’s pen waiting, you',
    options: [
      {
        id: 'made',
        label: 'Give him a made-up name spelled the way a family with land spells it.',
        told: 'gave him a made-up name spelled like a family with land.',
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
        label: 'Give him your own. It is the only thing your father left you.',
        told: 'gave him your own name, the only thing your father left you.',
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
        label: 'Write it yourself, and scratch out the entry two lines up while the book is open.',
        told: 'wrote it yourself, and scratched out an entry two lines up while the book was open.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1, tactician: 1 },
          lineage: { luminary: 1 },
          background: { criminal: 1, erudit: 1 },
          skill: { scholar: 1, cunning: 1 },
        },
      },
      {
        id: 'owed',
        label: 'Give him the name of the thing you owe. It will be written next to yours eventually.',
        told: 'gave him the name of the thing you owe.',
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
      'You owe eleven silver in this town, to a man whose daughter has been kind to you. Eleven silver is what the road costs, and you leave in the morning.',
    asks: 'What do you do?',
    recall: 'With eleven silver owed in that town and the road costing exactly that, you',
    options: [
      {
        id: 'work',
        label: 'Work it off tonight in his yard and leave at noon owing nobody anything.',
        told: 'worked it off in his yard through the night.',
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
        label: 'Leave before dawn and leave it owed. You have never gone back for anything.',
        told: 'left before dawn and left it owed.',
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
        label: 'Ask the daughter for it. She has been kind to you, and she will be kind about this too.',
        told: 'asked the daughter for it, knowing she would be kind about it too.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, pactbound: 1 },
          lineage: { celestial: 1 },
          background: { aristocrat: 1, entertainer: 1 },
          skill: { charismatic: 1, empath: 1 },
        },
      },
      {
        id: 'sign',
        label: 'Sign for it properly, in a form that holds. Put the leaf in his hand.',
        told: 'signed for it in a form that holds.',
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
      'There is a horse in the stable that is not yours and will not be missed until Thursday. Four days on foot, or a day and a half on that.',
    asks: 'What do you do?',
    recall: 'Over the bolt of a stable door on the last night, you',
    options: [
      {
        id: 'take',
        label: 'Take it, and leave it in a field at the far end in better condition than he kept it.',
        told: 'took the horse and left it in a field at the far end.',
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
        label: 'Walk. Four days is four days, and you have never taken a thing you would have to explain.',
        told: 'walked the four days.',
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
        label: 'Talk the horse out of its box. It follows you down the lane, and nothing is stolen exactly.',
        told: 'talked the horse out of its box, and it followed you.',
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
        label: 'Wake the boy and buy it at a price under the horse and over his loyalty.',
        told: 'woke the boy and bought it at a price over his loyalty.',
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
      'There is an hour before the carrier and paper in the house. Everyone who will wonder where you went is asleep upstairs.',
    asks: 'What do you leave?',
    recall: 'On the table, in the hour before the carrier, you left',
    options: [
      {
        id: 'pages',
        label: 'A bill. Four pages of what they owe you for eighteen years, and where to send it.',
        told: 'a bill for eighteen years, and where to send it.',
        gives: {
          attribute: { mind: 2 },
          talent: { spellquill: 1, tactician: 1 },
          lineage: { luminary: 1 },
          background: { aristocrat: 1, merchant: 1 },
          skill: { scholar: 1, haggler: 1 },
        },
      },
      {
        id: 'axe',
        label: 'The axe, sharpened, on the table where the letter would have been.',
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
        label: 'Nothing at all. A page is a thing somebody can follow.',
        told: 'nothing at all, because a page can be followed.',
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
        label: 'One line in the form you were taught, so whoever reads it aloud stands in a safe room.',
        told: 'one line in the form you were taught, that made the room safe.',
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
      'The carrier goes at dawn and there is one grave in this town you will not see again. It is an hour’s walk out and back, and you have the hour.',
    asks: 'What do you do?',
    recall: 'In the frost before dawn, over the one grave you were leaving behind, you',
    options: [
      {
        id: 'say',
        label: 'Go and say the whole thing out loud, in order. Something in that churchyard is listening.',
        told: 'said the whole thing out loud to something in the churchyard that listened.',
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
        label: 'Go and put the leaning stone straight. It takes the hour and both hands.',
        told: 'put the leaning stone straight.',
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
        label: 'Do not go. Spend the hour making sure nobody sees which road you take.',
        told: 'did not go, and spent the hour covering which road you took.',
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
        label: 'Go, and take the silver ring off the hand you buried it on. It is doing nothing down there.',
        told: 'dug up the ring you had buried with them, because it was doing nothing down there.',
        tags: ['did:theft'],
        gives: {
          attribute: { mind: 1 },
          talent: { necromancer: 1 },
          lineage: { undead: 1 },
          background: { criminal: 1, investigator: 1 },
          skill: { occultist: 1, scavenger: 1 },
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
      'The woman who agrees to teach you keeps no staff, no book and no wand. On the first morning she swaps your practice sword for a yard broom and leaves you with it until dark.',
    asks: 'What do you do?',
    recall: 'The year your teacher took the sword away and left you a broom, you',
    options: [
      {
        id: 'thread',
        label: 'Stop trying to make it a sword. Run what you have down the handle and let go when it lands.',
        told: 'ran something down the handle and put a hole through a fence post.',
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
        label: 'Find the sword where she put it and be in the yard with it before she is up.',
        told: 'got the sword back before she was up.',
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
        label: 'Put the broom down and go through her shelves for the reason. There is nothing on them.',
        told: 'went through her shelves and found the emptiness was the answer.',
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
        label: 'Sweep the yard, then charge her for the sweeping. A day of your work is a day of your work.',
        told: 'swept the yard and then charged her for it.',
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1 },
          lineage: { luminary: 1 },
          background: { merchant: 1, craftsman: 1 },
          skill: { haggler: 1, skilled: 1 },
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
      'Bandits took the packs, the mules and every blade before first light. You are left with a cook pot, four feet of chain and a broken tent pole. Two of them are watching from the ridge.',
    asks: 'What do you do?',
    recall: 'The morning the bandits left you a cook pot and a length of chain, you',
    options: [
      {
        id: 'chain',
        label: 'Run the night down the length of the chain and walk up the ridge with it swinging.',
        told: 'walked up the ridge with the chain and something running down it.',
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
        label: 'Leave the camp to the bandits and the others to themselves. Follow the mules’ trail alone.',
        told: 'left the camp to its luck and followed the mules’ trail alone.',
        gives: {
          attribute: { instinct: 2 },
          talent: { 'feral-curse': 1, wilder: 1 },
          lineage: { wildheart: 1 },
          background: { outlander: 1, military: 1 },
          skill: { survivalist: 1, cartographer: 1 },
        },
      },
      {
        id: 'stand',
        label: 'Put the broken pole across the gap in the rocks and stand behind it.',
        told: 'put the broken pole across the gap and stood behind it.',
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
        label: 'Cook, and wave the two of them down off the ridge to eat. Thieves always have something to sell.',
        told: 'waved the two of them down off the ridge to eat and trade.',
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
      'The players at the fair have lost their smallest actor to a fever. The man in the painted coat points at you: four lines and a fall off a ladder.',
    asks: 'What do you do?',
    recall: 'At the fair, when the players were a child short, you',
    options: [
      {
        id: 'climb',
        label: 'Climb up, learn the four lines while they paint your face and take the fall twice.',
        told: 'learned the lines while they painted your face and took the fall twice.',
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
        label: 'Ask what the part pays, and when he names it, tell him the sick boy was paid double.',
        told: 'talked the pay up in front of the crowd before you climbed anything.',
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
        label: 'Take the fall and nothing else. You would rather not say four lines to anybody.',
        told: 'took the fall and said no lines.',
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
        label: 'Go round behind the cart to the sick boy with your mother’s flask and your leaves.',
        told: 'went to the sick boy behind the cart with your mother’s flask.',
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
      'The tide has caught the fish cart on the causeway and the water is at the axles. The men on the shore are arguing about whose cart it is.',
    asks: 'What do you do?',
    recall: 'When the tide caught the fish cart on the causeway, you',
    options: [
      {
        id: 'wade',
        label: 'Wade out, put your shoulder to the wheel and walk the cart off a foot at a time.',
        told: 'waded out and walked the cart off the causeway a foot at a time.',
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
        label: 'Swim out to the pony, take its bridle and turn its head for the shore.',
        told: 'swam to the pony and turned its head for the shore.',
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
        label: 'Buy the whole cart off the arguing men for a copper while it is still sinking.',
        told: 'bought the sinking cart off the arguing men for a copper.',
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
        label: 'Watch the water on the stones and tell them how long the causeway has left.',
        told: 'read the water and said how long the causeway had left.',
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
      'Your little brother’s kite is stuck in the top of the dead pine above the quarry. He is seven and crying, and the tree is forty feet of rotten branch.',
    asks: 'What do you do?',
    recall: 'When the kite went into the dead pine above the quarry, you',
    options: [
      {
        id: 'up',
        label: 'Climb it, testing every dead branch with a hand before you trust it.',
        told: 'climbed the dead pine and came down with the kite.',
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
        label: 'Fetch the axe and put the whole tree on the ground.',
        told: 'put the whole dead tree on the ground with the axe.',
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
        label: 'Throw a weighted line over the branch and run what you know down it until the branch lets go.',
        told: 'ran what you knew down a line, and the branch let go.',
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
        label: 'Make him a new one out of the good ash, and charge him his supper for it.',
        told: 'made him a new kite and charged him his supper for it.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 1, tactician: 1 },
          lineage: { skybound: 1 },
          background: { craftsman: 1, entertainer: 1 },
          skill: { skilled: 1, haggler: 1 },
        },
      },
    ],
  },

  {
    id: 'child-hive',
    stage: 'childhood',
    scene:
      'The bees have swarmed onto the low branch of the apple tree, twenty feet from the kitchen door. Nobody in the house will go out for the washing.',
    asks: 'What do you do?',
    recall: 'When the swarm hung in the apple tree all afternoon, you',
    options: [
      {
        id: 'hands',
        label: 'Walk up bare-armed and take the swarm down into a basket by hand.',
        told: 'took the swarm down bare-armed into a basket.',
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
        label: 'Smoke it sleepy with damp straw and box the whole swarm.',
        told: 'smoked the swarm sleepy and boxed it.',
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
        label: 'Sell the swarm to the neighbour who keeps bees before your mother thinks to claim it.',
        told: 'sold the swarm to the neighbour before your mother could claim it.',
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
        label: 'Cut the branch off at the trunk and carry it, bees and all, to the far hedge.',
        told: 'carried the branch, bees and all, out to the far hedge.',
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
      'The mill wheel has jammed on a drowned branch and the village’s flour is behind it. The miller is chest-deep in the race, losing the light.',
    asks: 'What do you do?',
    recall: 'When the mill wheel jammed on the drowned branch, you',
    options: [
      {
        id: 'rope',
        label: 'Go into the race beside him and pull on the rope until dark.',
        told: 'went into the race beside him and pulled until dark.',
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
        label: 'Put your hand on the rope and run what you know down it. The branch comes apart.',
        told: 'ran what you knew down the rope, and the branch came apart.',
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
        label: 'Shut the sluice above, open the far gate and walk into a dry race.',
        told: 'shut the sluice and walked into a dry race.',
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
        label: 'Let it jam. Be in the market town buying flour before the price of bread moves.',
        told: 'let it jam and bought flour before the price of bread moved.',
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
      'A rider in the lord’s colours has come out of the rain to be fed and put up. The house has one chicken, four chairs and a dirt floor.',
    asks: 'What do you do?',
    recall: 'The night the lord’s rider was put up at your house, you',
    options: [
      {
        id: 'table',
        label: 'Lay the table as if the house did this every night and talk him through the meal.',
        told: 'laid the table as if the house did this every night.',
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
        label: 'Sing for him afterwards until he has forgotten what the floor is made of.',
        told: 'sang for him until he forgot what the floor was made of.',
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
        label: 'See to his horse, and go through his saddlebags while you are out there.',
        told: 'saw to his horse and went through his saddlebags.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { 'feral-curse': 1, 'draconic-bond': 1 },
          lineage: { fey: 1 },
          background: { criminal: 1, outlander: 1 },
          skill: { cunning: 1, streetwise: 1 },
        },
      },
      {
        id: 'chicken',
        label: 'Go out in the rain and come back with something better than the chicken. Nobody asks where from.',
        told: 'came back out of the rain with something better than the chicken.',
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
      'There are men on the road and the village has been told to arm. Your father takes his old sword off the wall and puts it in your hands.',
    asks: 'What do you do with it?',
    recall: 'The night your father put his old sword in your hands, you',
    options: [
      {
        id: 'edge',
        label: 'Sit up all night with the stone and the oil until it will cut hair.',
        told: 'sat up all night until the old sword would cut hair.',
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
        label: 'Say the word nobody taught you over the steel and feel it take.',
        told: 'said the word nobody taught you over the steel.',
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
        label: 'Sell it in town before dawn and come back with two cheaper blades and the difference.',
        told: 'sold it before dawn and came back with two cheaper blades and the difference.',
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
        label: 'Put it down and take the knife you already know. A slow blade gets taken off you.',
        told: 'put it down and took the knife you already knew.',
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
      'Your grandmother is laid out in the front room, and the house is full of people who never came while she lived. Somebody has to sit up with her tonight.',
    asks: 'What do you do?',
    recall: 'On the night before your grandmother was buried, you',
    options: [
      {
        id: 'sit',
        label: 'Sit up with her all night and say back everything she ever said to you.',
        told: 'sat up with her all night saying back everything she said to you.',
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
        label: 'Work the other room and learn by midnight who has come for the house and who for the field.',
        told: 'learned by midnight who had come for the house and who for the field.',
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
        label: 'Stand up and tell the whole story of her, including the parts the family leaves out.',
        told: 'told the whole story of her, including the parts the family leaves out.',
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
        label: 'Carry her good chest out to the cart while the house is busy downstairs. It is yours now.',
        told: 'carried her good chest out to the cart while the house was busy.',
        tags: ['did:theft'],
        gives: {
          attribute: { physique: 2 },
          talent: { colossus: 1, painseeker: 1 },
          lineage: { undead: 1 },
          background: { craftsman: 1, criminal: 1 },
          skill: { frugal: 1, scavenger: 1 },
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
      'The charcoal stack has broken open in the night and the wind has walked the fire into the timber. The burners’ boy is somewhere between you and the burn.',
    asks: 'What do you do?',
    recall: 'The night the charcoal stack broke open, you',
    options: [
      {
        id: 'break',
        label: 'Cut a firebreak across the wind, alone, with a shovel and a billhook.',
        told: 'cut a firebreak across the wind alone.',
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
        label: 'Walk into the burn for the boy. The heat does not touch you the way it touches the trees.',
        told: 'walked into the burn for the boy and came out carrying him.',
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
        label: 'Read the wind, and go the other way. The boy is the burners’ boy, not yours.',
        told: 'read the wind and went the other way.',
        gives: {
          attribute: { mind: 1 },
          talent: { arcanist: 1, 'elemental-aspect': 1 },
          lineage: { skybound: 1, scorchbound: 1 },
          background: { erudit: 1, investigator: 1 },
          skill: { cartographer: 1, survivalist: 1 },
        },
      },
      {
        id: 'smother',
        label: 'Smother the edge with armfuls of wet green stuff until it is only smoke.',
        told: 'smothered the edge with wet green stuff until it was only smoke.',
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
      'A hawk on the fence post has watched you cross the whole field. Nobody else can see it, and it looks at you the way a person does.',
    asks: 'What do you do?',
    recall: 'When the hawk on the fence post would not look away, you',
    options: [
      {
        id: 'hand',
        label: 'Put out your arm and wait. It comes onto your wrist, heavier than you expected.',
        told: 'put out your arm, and it came onto your wrist.',
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
        label: 'Net it and sell it. A hawk that lets you walk up to it is worth a month’s wages.',
        told: 'netted it and sold it for a month’s wages.',
        gives: {
          attribute: { instinct: 1 },
          talent: { wilder: 1, 'draconic-bond': 1 },
          lineage: { skybound: 1 },
          background: { merchant: 1, aristocrat: 1 },
          skill: { haggler: 1, survivalist: 1 },
        },
      },
      {
        id: 'name',
        label: 'Say out loud what you think it really is, and watch its face when you get it right.',
        told: 'said out loud what it really was, and watched its face.',
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
        label: 'Put a stone through it. A thing that watches you like that was sent.',
        told: 'put a stone through it, because a thing that watches like that was sent.',
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
      'A grey bloom has taken every tree in the orchard in a week. The old men say burn the lot before it crosses the lane.',
    asks: 'What do you do?',
    recall: 'The week the grey bloom took the whole orchard, you',
    options: [
      {
        id: 'learn',
        label: 'Stay out in it until you know what it feeds on and which tree it takes next.',
        told: 'stayed in the orchard until you knew which tree it would take next.',
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
        label: 'Burn the lot yourself, tree by tree, down to the roots, torch in hand.',
        told: 'burned the orchard down to the roots with your own torch.',
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
        label: 'Take a jar of it to the bench and spend a fortnight learning what kills it.',
        told: 'spent a fortnight at the bench learning what killed it.',
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
        label: 'Sell cuttings from the four clean trees to the next valley, and say nothing about the bloom.',
        told: 'sold cuttings to the next valley and said nothing about the bloom.',
        gives: {
          attribute: { mind: 1 },
          talent: { enchanter: 1, tactician: 1 },
          lineage: { luminary: 1 },
          background: { craftsman: 1, erudit: 1 },
          skill: { haggler: 1, cunning: 1 },
        },
      },
    ],
  },

  {
    id: 'blood-coin',
    stage: 'blood',
    scene:
      'The pedlar has spread his tray on the churchyard wall. There is a ring of red gold on it with a scale pattern, and you are eleven with nothing to trade.',
    asks: 'What do you do?',
    recall: 'When the pedlar’s red gold ring would not let you go, you',
    options: [
      {
        id: 'take',
        label: 'Take it while he is counting somebody else’s coppers and be gone before he finishes.',
        told: 'took it while he counted somebody else’s coppers.',
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
        label: 'Come back every day for a month with something worth a little of it, until it is yours.',
        told: 'came back every day for a month until the ring was yours.',
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
        label: 'Ask him where it came from, and keep asking until he puts the tray away.',
        told: 'asked where it came from until he put the tray away.',
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
        label: 'Touch it with one finger and know that the metal is warm, and should not be.',
        told: 'touched it and knew the metal was warm, which it should not have been.',
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
      'The troupe from the spring is back, two players short, wintering behind the inn. The woman who runs them asked this morning what you are still doing in this town.',
    asks: 'What do you take on?',
    recall: 'When the troupe asked what you were still doing in that town, you',
    options: [
      {
        id: 'boards',
        label: 'Take the boards. By spring you have four parts and a name in two counties.',
        told: 'took the boards, and by spring had a name in two counties.',
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
        label: 'Take the books, and skim the gate. A troupe that cannot count will never notice.',
        told: 'took the books and skimmed the gate.',
        tags: ['did:theft'],
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { merchant: 1, criminal: 1 },
          skill: { mastermind: 1, cunning: 1 },
        },
      },
      {
        id: 'wagon',
        label: 'Take the wagon, the horses and everything that has to be lifted before dark.',
        told: 'took the wagon, the horses and everything that had to be lifted.',
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
        label: 'Take the paint, the wire and the flash powder that make a stage do impossible things.',
        told: 'took the paint, the wire and the flash powder.',
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
      'The house on the square has taken you on for the season. On the third morning the steward hands you the keys and says the family will be down at eleven.',
    asks: 'What do you do first?',
    recall: 'When the steward handed you the keys of the house on the square, you',
    options: [
      {
        id: 'learn',
        label: 'Learn all eleven of them by the end of the week, especially what each would pay to keep quiet.',
        told: 'learned all eleven of them, and what each would pay to keep quiet.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1, pactbound: 1 },
          lineage: { infernal: 1 },
          background: { aristocrat: 1, investigator: 1 },
          skill: { empath: 1, mastermind: 1 },
        },
      },
      {
        id: 'keys',
        label: 'Learn the keys. Which doors the ring opens, and what is behind the two it does not.',
        told: 'learned the keys, and what was behind the two doors they did not open.',
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
        label: 'Do the work in front of you and be the one thing upstairs never has to think about.',
        told: 'did the work and were the one thing upstairs never thought about.',
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
        label: 'Go down to the kitchen, where the cook has thirty years of the house in her head.',
        told: 'went down to the kitchen, where the cook had the house in her head.',
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
      'The counting house on the bridge lends to anybody with a name, and you have spent two years making one. Four people in the queue behind you are listening.',
    asks: 'What do you do?',
    recall: 'When the counting house on the bridge weighed your name, you',
    options: [
      {
        id: 'figures',
        label: 'Let the figures do it. Two of the columns are invented, and he will never check.',
        told: 'let the figures do it, two columns of them invented.',
        gives: {
          attribute: { mind: 2 },
          talent: { tactician: 1, enchanter: 1 },
          lineage: { luminary: 1 },
          background: { merchant: 1, criminal: 1 },
          skill: { mastermind: 1, cunning: 1 },
        },
      },
      {
        id: 'name',
        label: 'Spend the name. Let him work out, with four people listening, what refusing you will cost him.',
        told: 'let him work out what refusing you in public would cost him.',
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
        label: 'Thank him and walk out. He sends a boy after you before you are off the bridge.',
        told: 'walked out, and he sent a boy after you before you were off the bridge.',
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
        label: 'Take the other work the house offers: the strongroom, the night and the door.',
        told: 'took the strongroom, the night and the door instead.',
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
      'The armourer has more orders than hands and one bench free. He puts three things on it: a blade with no edge, a mail shirt with a hole in the back and a customer who has waited an hour.',
    asks: 'Which do you take?',
    recall: 'When the armourer put three things on his free bench, you',
    options: [
      {
        id: 'blade',
        label: 'Take the blade, and put more into the finishing than an edge. It never needs sharpening again.',
        told: 'took the blade and put more into it than an edge.',
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
        label: 'Take the mail shirt. Two hundred rings closed by hand, and the repair is stronger than the shirt.',
        told: 'closed two hundred rings by hand until the repair was stronger than the shirt.',
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
        label: 'Take the customer, sell him the shop’s best blade at twice the price and keep the difference.',
        told: 'sold the customer the best blade at twice the price and kept the difference.',
        tags: ['did:theft'],
        gives: {
          attribute: { mind: 1 },
          talent: { tactician: 1, enchanter: 1 },
          lineage: { scorchbound: 1 },
          background: { merchant: 1, craftsman: 1 },
          skill: { haggler: 1, skilled: 1 },
        },
      },
      {
        id: 'bench',
        label: 'Take the bench itself. By the end of the month the orders come to you first.',
        told: 'took the bench itself, and by the end of the month the orders came to you.',
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
      'A company is forming in the square at dawn, swearing men in one at a time on a book. The carrier goes in four hours, and the sergeant has seen you twice.',
    asks: 'What do you do?',
    recall: 'On the morning the company swore men in on the square, you',
    options: [
      {
        id: 'swear',
        label: 'Swear it, take the bounty and be on the carrier with it before the ink is dry.',
        told: 'swore it, took the bounty and were on the carrier before the ink dried.',
        gives: {
          attribute: { physique: 2 },
          talent: { berserker: 1, painseeker: 1 },
          lineage: { stalwart: 1 },
          background: { mercenary: 1, military: 1 },
          skill: { frugal: 1, streetwise: 1 },
        },
      },
      {
        id: 'read',
        label: 'Ask to read the book first, and read the whole of it in front of the queue.',
        told: 'read the whole book first, in front of the queue.',
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
        label: 'Take the carrier and be past the square before the sergeant looks up.',
        told: 'took the carrier before the sergeant looked up.',
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
        label: 'Sell them a name that is not quite yours, and a horse they will need by noon.',
        told: 'sold them a false name and a horse they needed by noon.',
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
      'The tide turns at four and the coaster in the harbour is one hand short, as far as the next port. The other way is eleven days of road in the wrong season.',
    asks: 'What do you do?',
    recall: 'On the turning tide, with the coaster a hand short, you',
    options: [
      {
        id: 'ship',
        label: 'Take the berth. You are up the side before he finishes saying what the work is.',
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
        label: 'Take the berth, then take an interest in the cargo until you own a share of the hold.',
        told: 'took the berth and a share of the hold by the next port.',
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
        label: 'Take the eleven days. Wrong season, wrong boots and nobody to answer to.',
        told: 'took the eleven days of road, owing nobody an hour.',
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
        label: 'Read the sky from the harbour wall for a quarter of an hour, and let that decide.',
        told: 'read the sky from the harbour wall and let that decide.',
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
      'There is a fair on the morning you go and the square is packed. Four hundred people will watch whatever you do, and one of them has been asking for you by name.',
    asks: 'What do you do?',
    recall: 'On the morning you left, with the fair filling the square, you',
    options: [
      {
        id: 'stage',
        label: 'Get up on the mounting block and give them one last song, then go while they shout for more.',
        told: 'gave them one last song and went while they shouted for more.',
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
        label: 'Work the crowd on your way through it. Four hundred people is four hundred purses.',
        told: 'worked the crowd on your way through it.',
        tags: ['did:theft'],
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
        label: 'Walk down the middle at your own pace and let four hundred people get out of the way.',
        told: 'walked down the middle and let the square get out of your way.',
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
        label: 'Find the one asking after you before they find you, and open the conversation yourself.',
        told: 'found the one asking after you first.',
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
      'The fire is banked for the last time. The shelf over it is your mother’s: forty jars, a copper pot and forty years of knowing what is in each one. She is asleep.',
    asks: 'What do you take off the shelf?',
    recall: 'From your mother’s shelf, in the last hour, you took',
    options: [
      {
        id: 'pot',
        label: 'The copper pot, the jars and the coin she keeps in the fortieth one.',
        told: 'the copper pot, the jars and the coin from the fortieth one.',
        tags: ['did:theft'],
        gives: {
          attribute: { instinct: 1 },
          talent: { 'cauldron-keeper': 1, trickster: 1 },
          lineage: { wildheart: 1 },
          background: { criminal: 1, outlander: 1 },
          skill: { apothecary: 1, cunning: 1 },
        },
      },
      {
        id: 'book',
        label: 'Her book, to sell. Forty years of receipts is worth a year on the road to the right apothecary.',
        told: 'her book, to sell to the right apothecary.',
        gives: {
          attribute: { mind: 1 },
          talent: { alchemist: 1, tactician: 1 },
          lineage: { luminary: 1 },
          background: { erudit: 1, craftsman: 1 },
          skill: { haggler: 1, scholar: 1 },
        },
      },
      {
        id: 'thread',
        label: 'The ball of red thread she never let you touch. You still do not know why.',
        told: 'the ball of red thread she never let you touch.',
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
        label: 'Nothing. You write out forty labels for whoever comes after and leave them under the pot.',
        told: 'nothing at all, and left forty labels written out under the pot.',
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
