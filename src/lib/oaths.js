/**
 * The Oaths: ten creeds, their tenets, the two families each one opens and the
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
 * Handed over in chat by the designer on 2026-09-11 and reworked the same day.
 * The whole of what he said, and the readings it left open, are in
 * data/README.md under "The Oathbound, 2026-09-11" and "The Oaths are creeds,
 * 2026-09-11".
 *
 * ------------------------------------------------- an Oath is a sub-talent set
 * "Imagine that Oathbound is like multiple talents inside of a single talent
 * set. It has sub talent sets, essentially." That sentence is why this file is
 * as long as it is. A vow is not a flavour chip on a set: it decides the three
 * rules you play under, the two sub-schools you know in full, what your Smite
 * deals and which Aura you raise. Choosing one is choosing a set, so each of the
 * ten carries what a set carries — a creed, a page of lore and three tenets a
 * player can actually hold in their head.
 *
 * ---------------------------------------------------------------- an Oath is
 *   id          what the column stores
 *   name        `Oath of Vindication`, and what the block prints
 *   creed       the one line the whole vow comes down to
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
 *               by oathbound.js, so the ten Auras are ten cards and Smite is one.
 *   sanctum     what the Master's distorted Sanctuary looks like when it is this
 *               Oath that shaped it. Printed, never rolled.
 *   aura        the Aura card itself, minus everything ten cards share.
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
 * the same sentence had to carry the example as well. The names went the same
 * way: an Oath of the Anvil is a job, and an Oath of Creation is a belief about
 * the world that a smith, an architect and a mother could all swear.
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
const AURA_OPENING = 'Your Oath burns around you and reaches **every ally who can see you**.';

/** And the toll, which is the same on all ten. */
const AURA_UPKEEP_BODY = `At your Turn Start, pay ${AURA_UPKEEP} Willpower to keep the Aura up. Miss the Upkeep and it ends.`;

/**
 * The ten, in the order the chooser walls them.
 *
 * Ordered by what the creed is *about* rather than alphabetically: the three
 * that are about other people first, then the three that are about the world,
 * then the four that are about you. A wall of ten is read top to bottom once and
 * then by name forever.
 */
export const OATHS = [
  /* ============================================== what you owe other people */
  {
    id: 'vindication',
    name: 'Oath of Vindication',
    creed: 'Wrong is answered for, and you are the answer.',
    lore:
      'An Oathbound of Vindication is the one who comes after. They do not prevent, they rarely arrive in time and they are not asked to forgive. What they do is make sure that a thing which was done does not simply stand.\n\n' +
      'A few of them carry a commission and a seal. Most are somebody who watched something happen in a village nobody wrote down, and could not put it back out of their mind. The Oath does not tell you what counts as wrong. It tells you that once you have decided, you act, you say why, and you take it out of the one who earned it and nobody else.\n\n' +
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
      summary: 'A tide of light at your Turn Start, mending everyone standing in it.',
      effect: 'At your Turn Start, every ally in the Aura restores [[1d6 + stat]] Health.',
    },
  },
  {
    id: 'protection',
    name: 'Oath of Protection',
    creed: 'You stand in front, and nothing gets past you.',
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
      summary: 'Stone and root close over your allies at your Turn Start.',
      effect: 'At your Turn Start, every ally in the Aura gains [[1d6 + stat]] Shield.',
    },
  },

  /* ================================================ what you owe the world */
  {
    id: 'wild',
    name: 'Oath of the Wild',
    creed: 'The living world belongs to nobody.',
    lore:
      'Not a nature lover’s Oath. Its holders eat meat, fell trees and light fires, and would look at you strangely for expecting otherwise.\n\n' +
      'What they refuse is ownership itself: the idea that a river, a herd or a stand of oak can belong to a person the way a cup does. They turn up wherever somebody has drawn a line around something that was there first, and they are poachers by the law’s reckoning and wardens by their own.\n\n' +
      'It is the Oath most likely to put its holder on the wrong side of a perfectly reasonable landowner, and the one whose holders tend to end up living a long way from anywhere.',
    tenets: [
      {
        name: 'Take what you use',
        keep: 'A life taken is a life spent. Spend it on something, and spend all of it.',
        break: 'Killing for sport, for a trophy, for a bounty or to make a point.',
        example: 'You shoot the stag, saw the antlers off and leave the rest for the crows.',
      },
      {
        name: 'Open what is penned',
        keep: 'Nothing living is property. Where you find a cage, you have found work.',
        break: 'Walking past something caged, chained or broken to harness, or putting something in a cage yourself.',
        example: 'The menagerie is paying you well, so you say nothing about the bear.',
      },
      {
        name: 'Leave it growing',
        keep: 'What you pass through should still be there next season.',
        break: 'Burning, felling, poisoning or emptying more than the need in front of you.',
        example: 'You fire the whole hillside to flush out three men.',
      },
    ],
    families: [
      { school: 'Primal', family: 'Wild' },
      { school: 'Primal', family: 'Flora' },
    ],
    damage: 'Sharp',
    sanctum: 'a clearing that was not there yesterday, thorn walled, one animal track in and out',
    aura: {
      id: 'aura-of-the-wild',
      name: 'Aura of the Wild',
      summary: 'Thorn and tooth answer anything that closes on your allies.',
      effect:
        'Whenever an enemy moves into the Aura or ends its turn there, it takes [[1d6 + stat]] {damage} damage.',
    },
  },
  {
    id: 'renewal',
    name: 'Oath of Renewal',
    creed: 'Nothing is taken that is not put back.',
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
  {
    id: 'decay',
    name: 'Oath of Decay',
    creed: 'Everything ends, and ending is not a failure.',
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
      summary: 'Everything hostile standing in it is quietly being finished.',
      effect:
        'At your Turn End, every enemy in the Aura takes [[1d6 + stat]] {damage} damage and cannot restore Health until its next Turn End.',
    },
  },

  /* ================================================= what you owe yourself */
  {
    id: 'defiance',
    name: 'Oath of Defiance',
    creed: 'Nobody rules by fear where you can reach.',
    lore:
      'Defiance is an Oath about power rather than about cruelty. Its holders do not greatly care whether a tyrant is kind. They care that nobody can say no to them.\n\n' +
      'Agitators, deserters, the awkward one at the back of the hall who asks the question everybody was thinking. It is the Oath most likely to get its holder hanged, and it is deliberately impractical: a Defiance who has learned when to keep quiet has usually stopped being one.\n\n' +
      'The third tenet is the one that eventually catches them. Almost nobody who spends twenty years pulling down warlords ends the twenty years without an army.',
    tenets: [
      {
        name: 'Do not bow',
        keep: 'Fear is the whole machine. Refusing to show it is the one thing you can always do, and it costs nothing but everything.',
        break: 'Kneeling, flattering or holding your tongue to stay safe in front of power.',
        example: 'The baron asks who spoke. You look at the floor.',
      },
      {
        name: 'Give it back',
        keep: 'What you pull down is not yours to keep. It goes back to the people it was taken from.',
        break: 'Keeping a tyrant’s money, land, title or authority for yourself.',
        example: 'The warlord is dead, the fort is empty and well provisioned, and you move in.',
      },
      {
        name: 'Do not become it',
        keep: 'The moment people do what you say because they are afraid of you, you are the thing you came to pull down.',
        break: 'Giving an order you would have refused, or making somebody obey out of fear.',
        example: 'You take hostages so the village will cooperate. For their own good.',
      },
    ],
    families: [
      { school: 'Elemental', family: 'Storm' },
      { school: 'Elemental', family: 'Lightning' },
    ],
    damage: 'Lightning',
    sanctum: 'an open hill under standing cloud, no roof, no throne, the air already humming',
    aura: {
      id: 'aura-of-defiance',
      name: 'Aura of Defiance',
      summary: 'A charge that jumps to whoever raised a hand to your allies.',
      effect:
        'Whenever an ally in the Aura is hit by an attack, the attacker takes [[1d6 + stat]] {damage} damage and its Movement Speed is halved until its next Turn End.',
    },
  },
  {
    id: 'constancy',
    name: 'Oath of Constancy',
    creed: 'What you said yesterday is still true today.',
    lore:
      'The least dramatic Oath on the list and the one other people lean on hardest. Envoys, ferrymen, witnesses, anybody whose entire value is that they will do the thing they said on the day they said it.\n\n' +
      'It is an Oath about time more than about honesty. A promise costs nothing to make and everything to keep six months later in the rain, with better offers on the table and nobody watching. Constancy is the difference, and the difference is almost always inconvenient.\n\n' +
      'Its holders tend to be quiet, slightly boring people whose word is worth more than most contracts, and who have usually lost something considerable to keep one.',
    tenets: [
      {
        name: 'Keep your word',
        keep: 'On the day, in the terms, whatever it has come to cost since you gave it.',
        break: 'Letting a promise lapse, quietly renegotiating it or deciding it no longer applies.',
        example: 'You said you would be there by the new moon. The weather turned, so you did not go.',
      },
      {
        name: 'Carry what is given',
        keep: 'What is put into your hands arrives the way it left. You are the road, not a party to it.',
        break: 'Opening, spending, reading or passing on something entrusted to you.',
        example: 'The sealed letter is about you, so you read it.',
      },
      {
        name: 'Refuse nobody',
        keep: 'If you are the way through, you are the way through for everyone who asks.',
        break: 'Deciding who deserves the crossing, the shelter or the help you are able to give.',
        example: 'You will take the family across. Not the man travelling with them.',
      },
    ],
    families: [
      { school: 'Elemental', family: 'Water' },
      { school: 'Ethereal', family: 'Time' },
    ],
    damage: 'Frost',
    sanctum: 'a stone jetty on still black water, a moored boat and the far bank always in sight',
    aura: {
      id: 'aura-of-constancy',
      name: 'Aura of Constancy',
      summary: 'A blow meant for an ally is carried off them and onto you.',
      effect:
        'Whenever an ally in the Aura takes damage, you may take [[1d6 + stat]] of it onto yourself instead. It cannot be prevented.',
    },
  },
  {
    id: 'creation',
    name: 'Oath of Creation',
    creed: 'You answer for everything that leaves your hands.',
    lore:
      'Sworn by makers, and by very few of them, because it is expensive in a way that only becomes clear years later: it says that a thing you made is yours forever, wherever it ends up and whatever it is eventually used for.\n\n' +
      'Smiths and shipwrights and architects, mostly, but the Oath is not about craft. A teacher and a mother can swear it and mean exactly the same thing. What it asks is that you put your mark on the work, go and find out what the work did, and do not look away from the answer.\n\n' +
      'Oathbound of Creation are the only ones on this list who routinely travel a very long way to apologise.',
    tenets: [
      {
        name: 'Sign your work',
        keep: 'What you make carries your mark, and you stand behind it wherever it goes and whatever it becomes.',
        break: 'Disowning a thing you made, working unmarked to avoid the consequence or denying it was yours.',
        example: 'The gate you built failed and killed four people. You were never here.',
      },
      {
        name: 'Mend before replacing',
        keep: 'A thing that can be repaired is a thing you repair. New is not a reason.',
        break: 'Breaking, discarding or writing off something still worth saving because starting again is easier.',
        example: 'The bridge needs three days’ work, so you burn it and tell them to use the ford.',
      },
      {
        name: 'Finish it',
        keep: 'An unfinished thing is a promise still standing out in the open.',
        break: 'Abandoning a work, a debt or an undertaking part way through.',
        example: 'You leave the tunnel half cut and take the better offer up the valley.',
      },
    ],
    families: [
      { school: 'Elemental', family: 'Magma' },
      { school: 'Elemental', family: 'Earth' },
    ],
    damage: 'Fire',
    sanctum: 'a forge hall cut into rock, one anvil, the fire banked and never out',
    aura: {
      id: 'aura-of-creation',
      name: 'Aura of Creation',
      summary: 'Your allies’ weapons come out of the fire hot.',
      effect:
        'Weapon Attacks made by an ally in the Aura deal an extra [[1d6 + stat]] {damage} damage.',
    },
  },
  {
    id: 'trust',
    name: 'Oath of Trust',
    creed: 'What you are trusted with stays where it was put.',
    lore:
      'The doorkeeper’s Oath. Confessors, couriers, locksmiths, stewards: the people who know where everything is and say nothing about any of it.\n\n' +
      'It is not secrecy for its own sake. What the Oath draws is the line around a person: their home, their confidence, their mind. What it asks is that you are never the one who steps over it. That includes the times when stepping over it would obviously help, which is the whole difficulty.\n\n' +
      'An Oathbound of Trust is the person a party leaves in the room with the strongbox, and the reason they sometimes lose a fight they could have won by reading one letter.',
    tenets: [
      {
        name: 'Keep confidence',
        keep: 'A thing told to you is not a thing you have. It is a thing you are holding for somebody else.',
        break: 'Repeating, selling, trading or letting slip what was said to you in trust.',
        example: 'The information is worth a great deal and the man who told you is already dead, so you sell it.',
      },
      {
        name: 'Cross nothing uninvited',
        keep: 'A home, a vault, a mind, a body. You are asked in, or you stay outside.',
        break: 'Entering, reading or taking where you were not invited.',
        example: 'The door is unlocked and nobody is home, so you have a look around.',
      },
      {
        name: 'Close what you opened',
        keep: 'Every way in you make is a way in for whoever comes after you.',
        break: 'Leaving a breach, a key, a passage or a secret standing behind you.',
        example: 'You leave the wards down, because you might need to come back.',
      },
    ],
    families: [
      { school: 'Ethereal', family: 'Spacial' },
      { school: 'Ethereal', family: 'Shadow' },
    ],
    damage: 'Force',
    sanctum: 'an antechamber of grey doors, every one locked and one of them yours',
    aura: {
      id: 'aura-of-trust',
      name: 'Aura of Trust',
      summary: 'The ground refuses anything that tries to come through it.',
      effect:
        'An enemy entering the Aura takes [[1d6 + stat]] {damage} damage and its Movement Speed is halved until its next Turn End.',
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
