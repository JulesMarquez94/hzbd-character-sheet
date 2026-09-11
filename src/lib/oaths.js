/**
 * The Oaths: ten vows, their tenets, the two families each one opens and the
 * Aura each one raises.
 *
 * A leaf codex, the same shape weaves.js and martial.js keep: this file is the
 * *list*, oathbound.js is the system that reads a character against it, and
 * talents.js folds the ten Aura cards into the Oathbound's own cards so the
 * registry, the art and every {{link}} resolve against them like any other card.
 * It reaches one other leaf for the word `highest` and nothing else, and it has
 * to stay that way: talents.js imports it, and talents.js is a leaf.
 *
 * ------------------------------------------------------------------ the spec
 * Handed over in chat by the designer on 2026-09-11, in his own words: a set
 * where "you take a vow, and that vow binds you to having to follow certain
 * tenets. Each of these vows has three tenets", where the vow decides which two
 * sub-schools of magic you know in full, and where a Faith meter runs from -100
 * to 100 and bends whichever Attribute you stand highest in. The whole of what
 * he said, and the readings it left open, are in data/README.md under "The
 * Oathbound, 2026-09-11".
 *
 * ---------------------------------------------------------------- an Oath is
 *   id          what the column stores
 *   name        `Oath of Vindication`, and what the block prints
 *   principle   the one line the whole vow comes down to
 *   tenets      three of them, each a `keep` and the `break` that undoes it.
 *               The `break` is the half that made this worth writing: "if you
 *               pass someone that's clearly hurt and you could help them and
 *               you decide not to, then there will be a negative thing against
 *               your own tenets." A tenet with no stated breach is a tenet the
 *               table has to invent a breach for, every time.
 *   families    the two sub-schools it opens, as `{ school, family }`. Every
 *               spell in both, as the rungs open. See the Doctrine loadout.
 *   damage      the type its Aura and its Smite deal. One rider, laid on both
 *               cards by oathbound.js, so the ten Auras are ten cards and the
 *               one Smite is one.
 *   sanctum     what the Master's distorted Sanctuary looks like when it is
 *               this Oath that shaped it. Printed, never rolled.
 *   aura        the Aura card itself, minus everything ten cards share.
 *
 * ------------------------------------------------------------------ the Auras
 * "Here you'll have to be creative", which is the licence every word below was
 * written under. One of the ten is his: the Aura of Vindication, "whenever an
 * ally is hit by an enemy, that enemy also takes damage equal to your maximum
 * Attribute plus your Faith bonus". The other nine are built to sit beside it.
 *
 * Two things are true of all ten, and both are why they can share one shape:
 *
 *   **Every Aura's number is a live value with dice in it.** His was a bare
 *   `[[stat]]`, and a bare stat has nothing for a rank to grow: "when you level
 *   up, the strength of your aura is also increased" needs a die to Empower. So
 *   the base is `[[1d6 + stat]]` and UNWAVERING and ABSOLUTE CONVICTION each
 *   Empower it. The Faith bonus is inside the `stat`, because the Attribute the
 *   card is read against is the bent one. See `oathModifiers` in oathbound.js.
 *
 *   **Every Aura reaches every ally who can see you.** "The aura is a powerful
 *   and expensive ability that affects all your allies that can see you." No
 *   Aura names a range of its own.
 */

import { HIGHEST } from './attributes.js';

/* What every Aura costs to raise and to keep. One place, because ten cards
   printing the same three numbers is ten chances for one of them to drift. */
const AURA_AP = 3;
const AURA_WP = 4;
const AURA_UPKEEP = 2;

/** The opening line of all ten, which declares the thing rather than resolving it. */
const AURA_OPENING =
  'Your Oath burns around you and reaches **every ally who can see you**.';

/** And the toll, which is the same on all ten. */
const AURA_UPKEEP_BODY =
  `At your Turn Start, pay ${AURA_UPKEEP} Willpower to keep the Aura up. Miss the Upkeep and it ends.`;

/**
 * The ten, in the order the chooser walls them.
 *
 * Ordered by what the vow is *for* rather than alphabetically: the three that
 * answer for other people first, then the four that answer to a place or a
 * thing, then the three that answer to a rule. A wall of ten is read top to
 * bottom once and then by name forever.
 */
export const OATHS = [
  {
    id: 'vindication',
    name: 'Oath of Vindication',
    principle: 'What was done in the dark is answered for in the light.',
    tenets: [
      {
        keep: 'Name the crime out loud before you answer it, so the guilty know what they are paying for.',
        break: 'Strike at someone without first saying what they did.',
      },
      {
        keep: 'Take the answer out of the one who did it and out of nobody else.',
        break: 'Make a household, a village or a company pay for one person’s work.',
      },
      {
        keep: 'Stop when the debt is paid.',
        break: 'Keep going once the guilty are beaten, or take payment twice for one crime.',
      },
    ],
    families: [
      { school: 'Ethereal', family: 'Light' },
      { school: 'Elemental', family: 'Fire' },
    ],
    damage: 'Sacred',
    sanctum: 'a court of white stone, roofless, with one chair and no dock',
    aura: {
      id: 'aura-of-vindication',
      name: 'Aura of Vindication',
      summary: 'Every blow landed on an ally is answered out of the one who landed it.',
      effect:
        'Whenever an ally in the Aura is hit by an attack, the attacker takes [[1d6 + stat]] {damage} damage.',
    },
  },
  {
    id: 'succor',
    name: 'Oath of Succor',
    principle: 'Nobody bleeds within reach of you.',
    tenets: [
      {
        keep: 'Tend the hurt you come across, whoever they turn out to be.',
        break: 'Walk past somebody you could have helped.',
      },
      {
        keep: 'Ask nothing for it.',
        break: 'Set a price on care, or take payment for it afterwards.',
      },
      {
        keep: 'Stand between the wounded and whatever is still coming for them.',
        break: 'Leave somebody you have treated where the danger can reach them again.',
      },
    ],
    families: [
      { school: 'Primal', family: 'Life' },
      { school: 'Ethereal', family: 'Light' },
    ],
    damage: 'Sacred',
    sanctum: 'a long warm hall of beds, water always on the boil, every door unlatched',
    aura: {
      id: 'aura-of-succor',
      name: 'Aura of Succor',
      summary: 'A tide of light at your Turn Start, mending everyone standing in it.',
      effect:
        'At your Turn Start, every ally in the Aura restores [[1d6 + stat]] Health.',
    },
  },
  {
    id: 'bulwark',
    name: 'Oath of the Bulwark',
    principle: 'You are the wall, and a wall never goes first.',
    tenets: [
      {
        keep: 'Never throw the first blow.',
        break: 'Open a fight, by word or by hand.',
      },
      {
        keep: 'Put the people behind you somewhere safe before you think about winning.',
        break: 'Chase an enemy while anybody you are covering is still in the open.',
      },
      {
        keep: 'Hold the ground you said you would hold.',
        break: 'Give up a place you promised to keep while you can still stand on it.',
      },
    ],
    families: [
      { school: 'Elemental', family: 'Earth' },
      { school: 'Primal', family: 'Flora' },
    ],
    damage: 'Blunt',
    sanctum: 'a round keep of packed earth and root, one gate, arrow slits facing out',
    aura: {
      id: 'aura-of-the-bulwark',
      name: 'Aura of the Bulwark',
      summary: 'Stone and root close over your allies at your Turn Start.',
      effect:
        'At your Turn Start, every ally in the Aura gains [[1d6 + stat]] Shield.',
    },
  },
  {
    id: 'untamed',
    name: 'Oath of the Untamed',
    principle: 'The wild was here first and answers to nobody.',
    tenets: [
      {
        keep: 'Kill only what you will use, and use all of it.',
        break: 'Take a life for sport, for a trophy or for a bounty.',
      },
      {
        keep: 'Break a cage wherever you find one.',
        break: 'Leave a penned or chained beast where it is, or put one in a cage yourself.',
      },
      {
        keep: 'Leave nothing behind you that will not rot.',
        break: 'Burn, fell or poison more ground than the night actually needed.',
      },
    ],
    families: [
      { school: 'Primal', family: 'Wild' },
      { school: 'Primal', family: 'Flora' },
    ],
    damage: 'Sharp',
    sanctum: 'a clearing that was not there yesterday, thorn walled, with one animal track in and out',
    aura: {
      id: 'aura-of-the-untamed',
      name: 'Aura of the Untamed',
      summary: 'Thorn and tooth answer anything that closes on your allies.',
      effect:
        'Whenever an enemy moves into the Aura or ends its turn there, it takes [[1d6 + stat]] {damage} damage.',
    },
  },
  {
    id: 'tempest',
    name: 'Oath of the Tempest',
    principle: 'Nobody is owed a crown. The storm does not ask who you are.',
    tenets: [
      {
        keep: 'Defy anybody who rules by fear.',
        break: 'Bow, kneel or hold your tongue in front of a tyrant.',
      },
      {
        keep: 'Give what you take back to the people it was taken from.',
        break: 'Keep a tyrant’s money, land or title for yourself.',
      },
      {
        keep: 'Never become the thing you pulled down.',
        break: 'Give an order you would have refused to obey.',
      },
    ],
    families: [
      { school: 'Elemental', family: 'Storm' },
      { school: 'Elemental', family: 'Lightning' },
    ],
    damage: 'Lightning',
    sanctum: 'an open hill under standing cloud, no roof, no throne, the air already humming',
    aura: {
      id: 'aura-of-the-tempest',
      name: 'Aura of the Tempest',
      summary: 'A charge that jumps to whoever raised a hand to your allies.',
      effect:
        'Whenever an ally in the Aura is hit by an attack, the attacker takes [[1d6 + stat]] {damage} damage and its Movement Speed is halved until its next Turn End.',
    },
  },
  {
    id: 'last-rite',
    name: 'Oath of the Last Rite',
    principle: 'The dead are owed their rest, and it is yours to give them.',
    tenets: [
      {
        keep: 'Bury or burn every body you leave behind, and say the name if you know it.',
        break: 'Leave the dead in the open, or walk away from remains you could have seen to.',
      },
      {
        keep: 'Put down anything that will not stay down.',
        break: 'Let a risen thing walk on because it was useful to you.',
      },
      {
        keep: 'Take no more life than the work in front of you needs.',
        break: 'Kill something that had already stopped fighting.',
      },
    ],
    families: [
      { school: 'Primal', family: 'Death' },
      { school: 'Ethereal', family: 'Shadow' },
    ],
    damage: 'Necrotic',
    sanctum: 'a low vault of named stones, one lamp and room enough for everybody still owed a rite',
    aura: {
      id: 'aura-of-the-last-rite',
      name: 'Aura of the Last Rite',
      summary: 'Everything hostile standing in it is quietly being finished.',
      effect:
        'At your Turn End, every enemy in the Aura takes [[1d6 + stat]] {damage} damage and cannot restore Health until its next Turn End.',
    },
  },
  {
    id: 'ferry',
    name: 'Oath of the Ferry',
    principle: 'Everybody gets across, and every debt is carried to the far bank.',
    tenets: [
      {
        keep: 'Take anybody who asks to the other side, whoever they turn out to be.',
        break: 'Refuse passage to somebody who asked you for it.',
      },
      {
        keep: 'Keep every promise on the day you said you would keep it.',
        break: 'Let a promise go past the hour you set for it.',
      },
      {
        keep: 'Carry what you are handed and open none of it.',
        break: 'Read, spend or pass on something entrusted to you.',
      },
    ],
    families: [
      { school: 'Elemental', family: 'Water' },
      { school: 'Ethereal', family: 'Time' },
    ],
    damage: 'Frost',
    sanctum: 'a stone jetty on still black water, a moored boat and the far bank always in sight',
    aura: {
      id: 'aura-of-the-ferry',
      name: 'Aura of the Ferry',
      summary: 'The debt of a blow is carried off your ally and onto you.',
      effect:
        'Whenever an ally in the Aura takes damage, you may take [[1d6 + stat]] of it onto yourself instead. It cannot be prevented.',
    },
  },
  {
    id: 'anvil',
    name: 'Oath of the Anvil',
    principle: 'You answer for everything that leaves your hands.',
    tenets: [
      {
        keep: 'Put your mark on your work and stand behind it.',
        break: 'Disown a thing you made, or sell one unmarked.',
      },
      {
        keep: 'Mend what can be mended rather than replacing it.',
        break: 'Break or throw away something still worth repairing.',
      },
      {
        keep: 'Finish what you started before you begin the next thing.',
        break: 'Abandon a piece of work, a debt or a task half done.',
      },
    ],
    families: [
      { school: 'Elemental', family: 'Magma' },
      { school: 'Elemental', family: 'Earth' },
    ],
    damage: 'Fire',
    sanctum: 'a forge hall cut into rock, one anvil, the fire banked and never out',
    aura: {
      id: 'aura-of-the-anvil',
      name: 'Aura of the Anvil',
      summary: 'Your allies’ weapons come out of the fire hot.',
      effect:
        'Weapon Attacks made by an ally in the Aura deal an extra [[1d6 + stat]] {damage} damage.',
    },
  },
  {
    id: 'threshold',
    name: 'Oath of the Threshold',
    principle: 'A door you were trusted with stays shut.',
    tenets: [
      {
        keep: 'Keep what you were told in confidence.',
        break: 'Repeat, sell or trade a secret given to you.',
      },
      {
        keep: 'Ask before you cross, and take no ground you were not offered.',
        break: 'Enter a home, a vault or a mind uninvited.',
      },
      {
        keep: 'Shut behind you whatever you opened.',
        break: 'Leave a way in standing that you were the one to make.',
      },
    ],
    families: [
      { school: 'Ethereal', family: 'Spacial' },
      { school: 'Ethereal', family: 'Shadow' },
    ],
    damage: 'Force',
    sanctum: 'an antechamber of grey doors, every one locked and one of them yours',
    aura: {
      id: 'aura-of-the-threshold',
      name: 'Aura of the Threshold',
      summary: 'The ground refuses anything that tries to come through it.',
      effect:
        'An enemy entering the Aura takes [[1d6 + stat]] {damage} damage and its Movement Speed is halved until its next Turn End.',
    },
  },
  {
    id: 'fallow',
    name: 'Oath of the Fallow',
    principle: 'Nothing is taken that is not put back.',
    tenets: [
      {
        keep: 'Put back into the ground as much as you take out of it.',
        break: 'Strip a field, a seam or a herd and move on.',
      },
      {
        keep: 'Feed whoever is hungry in front of you before you eat.',
        break: 'Eat while somebody beside you goes without.',
      },
      {
        keep: 'Leave every place able to feed the next people through it.',
        break: 'Salt, poison or burn out ground that somebody else has to live on.',
      },
    ],
    families: [
      { school: 'Elemental', family: 'Mud' },
      { school: 'Primal', family: 'Life' },
    ],
    damage: 'Decay',
    sanctum: 'a walled garden in its third season, beds turned, a well and grain enough for strangers',
    aura: {
      id: 'aura-of-the-fallow',
      name: 'Aura of the Fallow',
      summary: 'What your enemies lose in it goes into your allies.',
      effect:
        'At your Turn End, one enemy in the Aura takes [[1d6 + stat]] {damage} damage and an ally in the Aura restores the same amount of Health.',
    },
  },
];

export const OATH_IDS = OATHS.map((oath) => oath.id);

const OATH_BY_ID = new Map(OATHS.map((oath) => [oath.id, oath]));

/** One Oath by id, or null for a column holding a word this build has dropped. */
export function getOath(id) {
  if (!id) return null;
  return OATH_BY_ID.get(String(id)) ?? null;
}

/** "Light and Fire", which is how a wall says what an Oath opens. */
export function oathFamilyLine(oath) {
  const names = (oath?.families ?? []).map((row) => row.family);
  if (names.length === 0) return '';
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * The ten Aura cards, built out of the ten rows.
 *
 * Every field the ten share is written once above and spread here, so an Aura in
 * the codex differs from its nine siblings in exactly the three things that are
 * really different about it: what it is called, what it does and what it deals.
 *
 * `oath` is the card's own back-reference, and it is the whole of how the sheet
 * knows which of the ten a character actually holds: `heldOathCards` in
 * oathbound.js keeps the one whose `oath` matches the vow and drops the other
 * nine. Nothing else in the codex carries that field, and nothing else needs to.
 *
 * The printed `damage` is the Oath's own, so a card read in the codex with no
 * character behind it still says what it deals. The same type arrives again as a
 * rider when a character is holding it, which costs nothing and keeps the two
 * from ever disagreeing.
 */
export const OATH_AURAS = OATHS.map((oath) => ({
  id: oath.aura.id,
  oath: oath.id,
  rank: 1,
  name: oath.aura.name,
  summary: oath.aura.summary,
  kind: 'talent',
  tags: ['Oathbound', 'Novice Talent', 'Aura'],
  ap: AURA_AP,
  wp: AURA_WP,
  stat: HIGHEST,
  damage: [oath.damage],
  body: `${AURA_OPENING}\n\n${oath.aura.effect}`,
  sub_name: 'Upkeep',
  sub_body: AURA_UPKEEP_BODY,
}));

/** What the Upkeep costs, for the block and the rest window to print. */
export const AURA_UPKEEP_WILLPOWER = AURA_UPKEEP;
