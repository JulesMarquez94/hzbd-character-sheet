/**
 * The Oaths: five creeds, their tenets, the two families each one opens and the
 * Aura each one raises.
 *
 * A leaf codex, the same shape weaves.js and martial.js keep: this file is the
 * *list*, oathbound.js is the system that reads a character against it, and
 * talents.js folds the five Aura cards into the Oathbound's own cards so the
 * registry, the art and every {{link}} resolve against them like any other card.
 * It reaches one other leaf for the word `highest` and nothing else, and it has
 * to stay that way: talents.js imports it, and talents.js is a leaf.
 *
 * ------------------------------------------------------------------ the spec
 * Handed over in chat by the designer on 2026-09-11 and reworked twice since.
 * The whole of what he said, and the readings it left open, are in
 * data/README.md under "The Oathbound, 2026-09-11", "The Oaths are creeds,
 * 2026-09-11" and "Five Oaths, and a night spent in meditation, 2026-09-12".
 *
 * --------------------------------------------------------- where the power is
 * "Shape the Oathbound lore-wise that they gain power from belief. This can be
 * belief in a principle or belief associated with a deity or powerful being. But
 * by swearing on something to live on, they gain, and the stronger this
 * conviction the stronger they are" (Jules, 2026-09-12).
 *
 * **Nothing grants an Oathbound anything.** There is no patron on the other end
 * of the bargain, which is exactly what separates this set from the Pact of
 * Ordenance: a pact is a debt owed to somebody, and an Oath is a conviction held
 * by you. What the magic answers to is how hard you hold it, which is what the
 * Faith bar measures and what the bend on your best Attribute pays out.
 *
 * A god may be involved and often is. Swearing Mercy to a healing deity and
 * swearing it to nothing at all are the same Oath at the same strength, and the
 * difference is what the character says out loud when asked. `swornTo` on each
 * row is the menu of what people actually swear these on, and it deliberately
 * mixes deities, institutions, people and the bare principle in one line.
 *
 * ------------------------------------------------- an Oath is a sub-talent set
 * "Imagine that Oathbound is like multiple talents inside of a single talent
 * set. It has sub talent sets, essentially." That sentence is why this file is
 * as long as it is. A vow is not a flavour chip on a set: it decides the three
 * rules you play under, the two sub-schools you know in full, what your Smite
 * deals and which Aura you raise. Choosing one is choosing a set, so each of the
 * five carries what a set carries — a creed, a page of lore and three tenets a
 * player can actually hold in their head.
 *
 * ---------------------------------------------------------------- an Oath is
 *   id          what the column stores
 *   name        `Oath of Vindication`, and what the block prints
 *   creed       the one line the whole vow comes down to
 *   swornTo     what people swear this one on, deities and principles together
 *   lore        what it means, who swears it and what it looks like at a table.
 *               Read on the Oath's own page, nowhere else.
 *   tenets      three, each `{ name, keep, break, example }`:
 *                 name     two or three words, for the block's own narrow column
 *                 keep     the **principle**, written wide on purpose
 *                 break    the shape of a breach, also wide
 *                 example  one concrete instance, so wide does not mean vague
 *   families    the two sub-schools it opens, as `{ school, family }`. Every
 *               spell in both, as the rungs open. See the Doctrine loadout.
 *   damage      the type its Aura and its Smite deal. One rider, laid on Smite
 *               by oathbound.js, so the five Auras are five cards and Smite is one.
 *   sanctum     what the Master's distorted Sanctuary looks like when it is this
 *               Oath that shaped it. Printed, never rolled.
 *   aura        the Aura card itself, minus everything five cards share.
 *
 * ------------------------------------------------------------ five, not ten
 * Ten was the first count and it was the designer's own ("at least ten
 * different ones"). It came back down to five on 2026-09-12: Vindication, Mercy,
 * Protection, Decay and Renewal. The Wild, Defiance, Constancy, Creation and
 * Trust are gone, and with them Wild, Storm, Lightning, Water, Time, Magma,
 * Spacial and two of the Earth and Shadow slots.
 *
 * Nothing about the code cared. `families: 'oath'` means the pool is whatever
 * the vow names, so removing a vow removes a pool; `heldOathCards` drops every
 * Aura but the one sworn, so removing four Auras removes four cards from the
 * registry and nothing else. A sheet holding a dropped vow reads as unsworn,
 * which `getOath` already answers for.
 *
 * ------------------------------------------------------------- wide, not vague
 * "The Oaths and the tenets need to be less action specific. They just need to
 * be more of an overall creed ... they need to be more generic, so players have
 * real leeway to play around them. Having examples is good."
 *
 * So a tenet is a **principle plus an instance**, and the two are different
 * fields rather than one sentence trying to be both. The first draft wrote
 * tenets as procedures ("name the crime out loud before you answer it"), which
 * is a rule a table has to obey rather than a creed a character believes, and
 * the same sentence had to carry the example as well.
 *
 * ------------------------------------------------------------------ the Auras
 * "Here you'll have to be creative", which is the licence every word below was
 * written under. One of the five is his: the Aura of Vindication, "whenever an
 * ally is hit by an enemy, that enemy also takes damage equal to your maximum
 * Attribute plus your Faith bonus". The other four are built to sit beside it.
 *
 * Three things are true of all five, and they are why the five share one shape:
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
 *
 *   **No Aura fires at your own Turn Start.** "Some effect triggers make no
 *   sense as it would only happen next turn. Make the Aura trigger either be on
 *   other entities' Turn Start or your Turn End" (Jules, 2026-09-12). An Aura is
 *   raised on your turn for 3 Action Points, so a clause that waits for your
 *   *next* Turn Start buys nothing for a whole round. So a timed Aura fires at
 *   **the Turn Start of whoever it is about**, which is inside the same round,
 *   or at **your Turn End**, which is the same turn you paid for it. A reactive
 *   Aura has no timing to get wrong.
 */

import { HIGHEST } from './attributes.js';

/* What every Aura costs to raise and to keep. One place, because five cards
   printing the same three numbers is five chances for one of them to drift. */
const AURA_AP = 3;
const AURA_WP = 4;
const AURA_UPKEEP = 2;

/** The opening line of all five, which declares the thing rather than resolving it. */
const AURA_OPENING = 'Your Oath burns around you and reaches **every ally who can see you**.';

/** And the toll, which is the same on all five. */
const AURA_UPKEEP_BODY = `At your Turn Start, pay ${AURA_UPKEEP} Willpower to keep the Aura up. Miss the Upkeep and it ends.`;

/**
 * The five, in the order the chooser walls them, which is the order the designer
 * named them in.
 */
export const OATHS = [
  {
    id: 'vindication',
    name: 'Oath of Vindication',
    creed: 'Wrong is answered for, and you are the answer.',
    swornTo:
      'a god of scales, a court that stopped sitting, a murdered name, or nothing at all but the certainty that somebody has to',
    lore:
      'An Oathbound of Vindication is the one who comes after. They do not prevent, they rarely arrive in time and they are not asked to forgive. What they do is make sure that a thing which was done does not simply stand.\n\n' +
      'A few of them carry a commission and a seal, and a few more carry a god. Most are somebody who watched something happen in a village nobody wrote down, and could not put it back out of their mind. The Oath does not tell you what counts as wrong. It tells you that once you have decided, you act, you say why, and you take it out of the one who earned it and nobody else.\n\n' +
      'They are hard company on a long road. A Vindication that has kept its Faith is the most dangerous thing at most tables, and one that has lost it is somebody looking for a reason.',
    tenets: [
      {
        name: 'Answer it',
        keep: 'Wrong that goes unanswered in front of you is wrong you have agreed to. When you see it, you act on it.',
        break: 'Letting something stand because it was inconvenient, dangerous or none of your business.',
        example: 'You watch a steward turn a family out into the snow, and ride on because you are expected somewhere.',
      },
      {
        name: 'Name it first',
        keep: 'The guilty are told what they are answering for, and so is everybody watching. Judgement done quietly is not judgement.',
        break: 'Punishing, sentencing or striking without ever saying what it was for.',
        example: 'You kill the man in his sleep rather than wake him and tell him whose brother you are.',
      },
      {
        name: 'Only the guilty',
        keep: 'A debt belongs to the one who made it. It does not spread to a household, a trade, a company or a bloodline.',
        break: 'Making people answer for somebody standing near them.',
        example: 'You fire the barracks with the conscripts still inside to be sure of the captain.',
      },
    ],
    families: [
      { school: 'Ethereal', family: 'Light' },
      { school: 'Elemental', family: 'Fire' },
    ],
    damage: 'Fire',
    sanctum: 'a court of white stone, roofless, with one chair in it and no dock',
    aura: {
      id: 'aura-of-vindication',
      name: 'Aura of Vindication',
      summary: 'Every blow landed on an ally is answered out of the one who landed it.',
      effect:
        'Whenever an ally in the Aura is hit by an attack, the attacker takes [[1d6 + stat]] {damage} damage.',
    },
  },
  {
    id: 'mercy',
    name: 'Oath of Mercy',
    creed: 'Suffering you can reach is suffering you end.',
    swornTo:
      'a healing god, a hospital order, a person you could not save or the bare fact that it hurts and you can stop it',
    lore:
      'Mercy is not kindness and it is certainly not pacifism. An Oathbound of Mercy will cut a throat to stop a scream, and does so more often than the songs allow.\n\n' +
      'What the Oath forbids is the thing everybody does a dozen times a day without noticing: deciding that the person bleeding in front of them is somebody else’s problem. Field surgeons, plague-house keepers, the ones who go back out for the wounded while the shooting is still going on. Almost all of them are tired in a way that does not come off.\n\n' +
      'It is the easiest Oath to swear and the hardest to keep on a bad week, because it never stops asking and it never asks for anything large.',
    tenets: [
      {
        name: 'Tend what is hurt',
        keep: 'Whoever is suffering where you can reach them is your business, whatever they have done and whichever side they were on an hour ago.',
        break: 'Walking past, or deciding whose pain counts.',
        example: 'The bandit who shot at you is bleeding out in the ditch. You leave him there.',
      },
      {
        name: 'Ask nothing back',
        keep: 'Care is not a trade. It is not leverage, it is not payment for a name and it is not a debt the other person now owes you.',
        break: 'Pricing help, bargaining with it or holding it back to get something.',
        example: 'You will bind the merchant’s leg once she tells you which way the caravan went.',
      },
      {
        name: 'Never deepen it',
        keep: 'You do not make suffering to serve an end, however good the end looks from here.',
        break: 'Hurting one person to move another: torture, hostages, an example made of somebody.',
        example: 'You break the runner’s fingers so the gang will come to the table.',
      },
    ],
    families: [
      { school: 'Primal', family: 'Life' },
      { school: 'Ethereal', family: 'Light' },
    ],
    damage: 'Sacred',
    sanctum: 'a long warm hall of beds, water always on the boil, every door unlatched',
    aura: {
      id: 'aura-of-mercy',
      name: 'Aura of Mercy',
      summary: 'Light closes over your allies as each of them comes to act.',
      effect:
        'At the Turn Start of **each ally in the Aura**, it restores [[1d6 + stat]] Health.',
    },
  },
  {
    id: 'protection',
    name: 'Oath of Protection',
    creed: 'You stand in front, and nothing gets past you.',
    swornTo:
      'a war god who never opens first, a house, a child, a wall you were posted to or one promise made once and never withdrawn',
    lore:
      'The first Oath anybody thinks of, and the hardest to keep, because it is the one that asks you to be patient while something terrible is happening.\n\n' +
      'An Oathbound of Protection does not open. They wait, they take the blow that was meant for somebody else, and they hold a doorway for exactly as long as there is anybody left behind it. Guards and escorts, mostly, but also the parent who put themselves between a door and a room, which is the same Oath with no armour on.\n\n' +
      'Other Oaths argue about who deserves what. This one does not: the question is only ever who is behind you.',
    tenets: [
      {
        name: 'Never strike first',
        keep: 'Violence you began is violence you own. You are here to end a fight, not to start one.',
        break: 'Opening a fight, by hand or by mouth.',
        example: 'You draw on the toll collectors because you did not like the way they asked.',
      },
      {
        name: 'They come first',
        keep: 'The people behind you matter more than the field, the prize or the last enemy standing. Getting them out is the whole job.',
        break: 'Taking the win while somebody in your care is still exposed.',
        example: 'You run down the fleeing archer while the wagon you were escorting is still in the open.',
      },
      {
        name: 'Hold what you said',
        keep: 'A promise of protection is a place you stand until you cannot stand there any more.',
        break: 'Leaving a post, a person or a place you undertook to keep while you can still hold it.',
        example: 'The bridge is lost anyway, so you go before the last of them are across.',
      },
    ],
    families: [
      { school: 'Elemental', family: 'Earth' },
      { school: 'Primal', family: 'Flora' },
    ],
    damage: 'Blunt',
    sanctum: 'a round keep of packed earth and root, one gate, every slit facing outward',
    aura: {
      id: 'aura-of-protection',
      name: 'Aura of Protection',
      summary: 'Stone and root close over each ally as they come to act.',
      effect: 'At the Turn Start of **each ally in the Aura**, it gains [[1d6 + stat]] Shield.',
    },
  },
  {
    id: 'decay',
    name: 'Oath of Decay',
    creed: 'Everything ends, and ending is not a failure.',
    swornTo:
      'a god who closes doors, an undertakers’ guild, the plague that took your town, or nothing but the arithmetic of it',
    lore:
      'The most misread Oath on the list. An Oathbound of Decay is not a killer and is not morbid. What they hold is that things are supposed to stop, and that very nearly every horror they have had to deal with was something that refused to.\n\n' +
      'So they finish what will not finish, they bury what is owed a burial, and they will not help anything cheat the end, however sympathetic it is and however much it is offering. Undertakers, plague-burners, the ones sent after whatever is in the barrow.\n\n' +
      'They are gentler at a deathbed than any other Oath and completely immovable about what happens afterwards.',
    tenets: [
      {
        name: 'Let it end',
        keep: 'Nothing is owed an extension, and it is certainly not owed yours.',
        break: 'Prolonging, preserving or reviving something whose time is done, for any reason at all.',
        example: 'You keep the dying lord breathing another week because his signature is worth a great deal.',
      },
      {
        name: 'Put down the unending',
        keep: 'A thing that has refused the end is a debt somebody has to settle, and you are somebody.',
        break: 'Leaving a risen or unnaturally sustained thing alone because it is useful, familiar or frightening.',
        example: 'The lich pays well and asks very little, so you take the contract.',
      },
      {
        name: 'The dead are owed',
        keep: 'A body is owed a burial, a burning or at the very least its name said out loud.',
        break: 'Leaving the dead where they fell, or using remains as a tool.',
        example: 'You leave the caravan in the road because stopping would cost you half a day.',
      },
    ],
    families: [
      { school: 'Primal', family: 'Death' },
      { school: 'Ethereal', family: 'Shadow' },
    ],
    damage: 'Necrotic',
    sanctum: 'a low vault of named stones, one lamp and room for everybody still owed a rite',
    aura: {
      id: 'aura-of-decay',
      name: 'Aura of Decay',
      summary: 'Everything hostile in it is quietly being finished, a turn at a time.',
      effect:
        'At the Turn Start of **each enemy in the Aura**, it takes [[1d6 + stat]] {damage} damage.',
    },
  },
  {
    id: 'renewal',
    name: 'Oath of Renewal',
    creed: 'Nothing is taken that is not put back.',
    swornTo:
      'a harvest god, a village that fed you once, the land itself or a ledger you keep in your own head and show nobody',
    lore:
      'Renewal is an Oath about accounts rather than about growing things, and its holders are as often quartermasters as gardeners.\n\n' +
      'What they hold is that everything you use came from somewhere and is owed back: ground, stock, goodwill, people. Leaving a place worse than you found it is theft with extra steps, and the fact that the theft is spread thin over a hundred strangers does not make it smaller.\n\n' +
      'They are welcome everywhere once. Whether they are welcome the second time is the whole test of the Oath, and most towns remember.',
    tenets: [
      {
        name: 'Put it back',
        keep: 'Whatever you draw on, you return to. If you cannot return it in kind, you return something.',
        break: 'Stripping a thing and moving on.',
        example: 'You clear the village’s winter stores buying supplies, pay fairly and ride out at dawn.',
      },
      {
        name: 'Feed what is hungry',
        keep: 'What you are holding is not entirely yours while somebody in front of you has nothing.',
        break: 'Eating, hoarding or keeping while somebody beside you goes without.',
        example: 'You have three days of rations and the family on the road gets a nod.',
      },
      {
        name: 'Leave it able',
        keep: 'A place you have passed through should still be able to carry whoever comes next.',
        break: 'Salting, burning, poisoning or exhausting ground that somebody has to live on.',
        example: 'You foul the well so the enemy cannot use it. The village uses it too.',
      },
    ],
    families: [
      { school: 'Elemental', family: 'Mud' },
      { school: 'Primal', family: 'Life' },
    ],
    damage: 'Decay',
    sanctum: 'a walled garden in its third season, beds turned, a well and grain enough for strangers',
    aura: {
      id: 'aura-of-renewal',
      name: 'Aura of Renewal',
      summary: 'What your enemies lose in it goes straight into your allies.',
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
  return names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * The five Aura cards, built out of the five rows.
 *
 * Every field the five share is written once above and spread here, so an Aura in
 * the codex differs from its four siblings in exactly the three things that are
 * really different about it: what it is called, what it does and what it deals.
 *
 * `oath` is the card's own back-reference, and it is the whole of how the sheet
 * knows which of the five a character actually holds: `heldOathCards` in
 * oathbound.js keeps the one whose `oath` matches the vow and drops the other
 * four. Nothing else in the codex carries that field, and nothing else needs to.
 *
 * The printed `damage` is the Oath's own, so a card read in the codex with no
 * character behind it still says what it deals.
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
