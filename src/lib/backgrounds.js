/**
 * Backgrounds and skills — what a character did before the adventure started,
 * and what that life taught them.
 *
 * A background is the one choice on the sheet that looks backwards. Lineage is
 * the blood you were born with and a Talent Set is what you are becoming; a
 * background is the life you already lived, and it pays out in three currencies
 * at once:
 *
 *   the skills  — what that life taught you. Each background offers a pool and
 *                 lets you learn one, two or three of them, and every one is a
 *                 card, printed and dealt exactly like a talent's or a weapon's,
 *                 because "spend 1 Willpower for advantage" is something you
 *                 look up mid-session and a paragraph about your youth is not.
 *   the kit     — a weapon, a full set of common armor, and the odds and ends
 *                 the trade leaves in your pockets. Taken once, at level 1.
 *   the purse   — the Coins and Supplies you show up with.
 *
 * ------------------------------------------------------------------- source
 * **The skills are the designer's, transcribed.** They arrived as
 * `data/General Rules - Skills.csv` on 2026-08-21: thirty-two rows with a Name,
 * a Tags cell, an AP and a WP column, a Main Effect and a Requirement. Every one
 * of them is below, in the sheet's own words, with its Tags cell as the card's
 * tags and its Requirement cell as `minLevel`. The reads are listed under "how
 * this was proved". Nothing here was invented: the eighteen skills this file
 * used to carry were a first pass written before the tab existed, and they are
 * gone.
 *
 * **The backgrounds are not.** There is no background tab yet. Jules named the
 * ten below on 2026-08-21 and set the arithmetic; which skills each one offers,
 * and what it leaves in your pockets, is drafted here to match and is his to
 * overrule.
 *
 * ---------------------------------------------------------------- the purse
 * One formula, and it is the whole balance of the codex:
 *
 *     Coins = (4 - skills) * 2000        Supplies = 70, for everybody
 *
 * So a background that teaches one skill shows up with 6000 Coins and one that
 * teaches three shows up with 2000. A poor life taught you more and left you
 * less, which is the trade the ten below are arranged along. `startingCoins` is
 * the one place it is written down, and the purse on every background is filled
 * in from it rather than typed beside it, so the two can never drift.
 *
 * ------------------------------------------------------------ the level gate
 * Five skills carry a Requirement, and a background cannot offer one: the life
 * you led before level 1 could not have taught you something you are not yet
 * able to learn. Heavy, Light and Spelled Armor Mastery and Innate Spell Adept
 * all read level 5, Innate Spell Master reads level 10, and all five are
 * learnable at the odd level that reaches them (see `skillOptionsAt` in
 * levelPicks.js). A pool holding one is a data error and says so at load.
 *
 * --------------------------------------------------------------- card text
 * Card bodies use the same markers as every other card — see the header of
 * weapons.js. These are folded into the global registry by weapons.js, so every
 * link resolves and any of them can be dealt onto the pile.
 *
 * Three skills ask a question the card cannot answer for you: Innate Spell
 * Novice, Adept and Master each let you choose a spell of that rank from any
 * school, and the spell you name is one you then *hold*. That is the same shape
 * the lineage cards' INNATE X uses, down to the `learns` flag, and it is asked
 * in the window that hands the skill over. See `innateSpell` below.
 *
 * This file is a leaf: nothing here may import weapons.js or items.js. The kit
 * names item ids as plain strings and the block resolves them.
 *
 * ------------------------------------------------------- how this was proved
 * Every body below was compared to its Main Effect cell with case and
 * punctuation flattened. **All 32 rows are accounted for**, and every difference
 * is one of these reads:
 *
 *   Spelling    "lrean premantenylu" reads learn permanently, "attrbiute" and
 *               "Attriubte" Attribute, "convice" convince, "intimiated"
 *               intimidate, "attemp" attempt, "hte" the, "ear" hear, "doen"
 *               done, "swaping" swapping, "youmake" you make, "yo utake" you
 *               take, "outdors" outdoors, "Higest" highest, "though" thought,
 *               "reduce" reduced, "increase or decrease" increased or
 *               decreased, "WIllpower" Willpower and "Inate" Innate.
 *   Grammar     "The cost your long and short rest are reduce" reads The cost
 *               of your Long and Short Rests is reduced, "the dice elevated by
 *               1" the dice are elevated by 1, "an ally make" an ally makes,
 *               "a Instinct saving throw" an Instinct saving throw, "to to
 *               gaining insight" to gain insight, "a skill check that have to
 *               do with" that has to do with, "the target Grit" the target's
 *               Grit, "without a doing a skill check" without doing a skill
 *               check, and "It use" It uses.
 *   Terms       health reads Health, supplies Supplies, willpower Willpower,
 *               armor Armor, movement speed Movement Speed, long rest Long Rest
 *               and short rest Short Rest. Every one of these exists so a
 *               defined term lights, which is the trade the lineage cards made.
 *   Units       "1.5m (5feet)" reads 1.5 meters (5 feet), which is how every
 *               other distance in the codex is written.
 *   Commas      Nine rows close a list of three with an Oxford comma, and two
 *               carry a stray space before a comma or a full stop. Both are
 *               house style, see docs/text-style.md.
 *   Modular     Innate Spell Novice, Adept and Master each promise "a spell
 *               from any school", which is a question rather than a spell, so
 *               it is a `{choice}` and its placeholder is those words. Same
 *               trade INNATE X makes in lineages.js.
 *   Built       Mastermind and Spell Eater both say "You can use this feature
 *               once, regaining it after a long rest. The number of uses
 *               increases to 2 at level 6." The sentence stays theirs and the
 *               rider is what the sheet counts, so `uses` is read off the level
 *               on those two. See uses.js.
 *   Dropped     Tailor's cell ends in two bracketed notes to the builder,
 *               asking for a Disguise Kit and for Bandages as consumable items.
 *               A note is not rules text, so it is not on the card. See flag 4.
 *
 * ------------------------------------------------------------- and the flags
 * Six things the tab leaves open. None is guessed at here.
 *
 *   1. **Arcane Marshal and Cartographer are the same card twice.** Both cells
 *      read "a skill check to read or draw a map, or to retrace a route you
 *      have walked once before, or find a location", word for word. Cartographer
 *      is a mapmaker and that is plainly its text; an Arcane Marshal is not, and
 *      the name says arcane law. Both are printed as written rather than one
 *      being rewritten to suit its name, so the duplication stays visible where
 *      it can be fixed. Arcane Marshal is offered by the Investigator and the
 *      Erudit, where its *name* belongs.
 *   2. **Unseen Spellwork asks for "a Cunning skill check", and Cunning is not
 *      an attribute.** The three are Physique, Instinct and Mind, and Cunning is
 *      the name of another skill on the same tab. Printed as written.
 *   3. **"You gain +2 to Armor" is a number the sheet does not yet add.** Heavy
 *      Armor Mastery, Light Armor Mastery and Spelled Armor Mastery each change
 *      a derived stat while a full set is worn, and none of the three is wired
 *      into `deriveStats`. All three are level 5, so nothing is missing from a
 *      level-1 sheet, and all three print what they promise.
 *
 *      The place to wire one exists now: a skill card may carry a `grants` map
 *      beside its prose, which is what FRUGAL's Supplies and QUICK DRAW's Action
 *      Point ride. See `skillGrantSources` below. These three are left alone
 *      because a set bonus is conditional on what is worn, and `grants` is a
 *      flat rider with nowhere to put the condition.
 *   4. **Tailor asks for two items that do not exist.** Its cell asks for a
 *      Disguise Kit ("advantage on skill checks to deceive for the day") and for
 *      Bandages as a one-use consumable. `bandage-roll` in utility.js is already
 *      close to the second. Neither is written here: an item is items.js's to
 *      hold, and the card names both in the designer's own words meanwhile.
 *   5. **Spell Eater's row carries a stray last cell.** It ends with "Amphibian,
 *      Scalley, Venemous, cold blooded, sharp sense, Hearthy, Wild Swiftness",
 *      which is the Wildkin pool off the lineage tab and has nothing to do with
 *      the skill. Dropped.
 *   6. **Two skills have no picture.** Empath and Seafarer are the only rows the
 *      2026-08-21 art drop does not cover, and there is one unnamed file in it
 *      (`Gemini_Generated_Image_w78nd7w78nd7w78n.jpg`) that may be either.
 *      Naming that file after the skill it was drawn for places it; guessing
 *      which of the two would put the wrong face on a card.
 */

import { HIGHEST } from './attributes.js';
import { withArt } from './cardArt.js';
import { sortCards } from './cardOrder.js';
import { castModifier } from './cardText.js';
import { SPELLS } from './spells.js';

/** How many skills a background may hand out. Nothing outside this range. */
export const MIN_SKILL_PICKS = 1;
export const MAX_SKILL_PICKS = 3;

/**
 * What a background of that many skills walks in carrying.
 *
 * Jules's, 2026-08-21: "The starting money is calculated by 4 - the number of
 * skill the background give * 2000. So for example if noble has 1 Skill it get
 * 6000 coins. everyone stat iwht 70 supplies."
 *
 * One function rather than ten numbers, so the trade cannot drift: change the
 * picks and the purse follows it.
 */
export function startingCoins(picks) {
  const skills = Math.min(
    MAX_SKILL_PICKS,
    Math.max(MIN_SKILL_PICKS, Math.floor(Number(picks) || 0))
  );
  return (4 - skills) * 2000;
}

/** The crate everybody starts with, whatever they did before. */
export const STARTING_SUPPLIES = 70;

/* ---------------------------------------------------------------- the tags *
 * Two kinds, so a wall of backgrounds can be narrowed twice over: the world
 * the life was lived in, and what it left the character good at. A background
 * carries one sphere and as many boons as fit it.
 */
export const BACKGROUND_TAGS = [
  { id: 'underworld', label: 'Underworld', kind: 'sphere' },
  { id: 'trade', label: 'Trade', kind: 'sphere' },
  { id: 'martial', label: 'Martial', kind: 'sphere' },
  { id: 'court', label: 'Court', kind: 'sphere' },
  { id: 'wilds', label: 'Wilds', kind: 'sphere' },
  { id: 'scholarly', label: 'Scholarly', kind: 'sphere' },
  { id: 'stage', label: 'Stage', kind: 'sphere' },
  { id: 'law', label: 'Law', kind: 'sphere' },

  { id: 'coin', label: 'Coin', kind: 'boon' },
  { id: 'supplies', label: 'Supplies', kind: 'boon' },
  { id: 'social', label: 'Social', kind: 'boon' },
  { id: 'stealth', label: 'Stealth', kind: 'boon' },
  { id: 'lore', label: 'Lore', kind: 'boon' },
  { id: 'survival', label: 'Survival', kind: 'boon' },
  { id: 'craft', label: 'Craft', kind: 'boon' },
  { id: 'warfare', label: 'Warfare', kind: 'boon' },
  { id: 'insight', label: 'Insight', kind: 'boon' },
];

/* ------------------------------------------------------------- the skills *
 * Thirty-two rows, in the order the tab prints them.
 *
 * Fields on top of the shared card fields (see weapons.js):
 *   minLevel  — the Requirement cell, as a number. Absent means level 1.
 *   uses      — how many times before a rest, where the row says so. A number,
 *               or a function of level for the two rows that grow at level 6.
 *   recharge  — what fills those uses again, in the row's own words.
 *   choice    — the question the row leaves to the player. See `innateSpell`.
 *
 * AP and WP are blank in every row of the tab, so every card here costs
 * neither. A skill that spends Willpower spends it *conditionally*, inside its
 * own sentence, which is not the same thing as a card with a price.
 */

const SKILL = { kind: 'skill', ap: null, wp: null };

/**
 * The commonest row on the tab, thirteen times over: one domain, 1 Willpower,
 * advantage.
 *
 * Written once because the sentence is identical in all thirteen cells and the
 * only thing that moves is the domain. A skill that says anything else is
 * written out in full below.
 *
 * ------------------------------------------------------- and it is now wired
 * `grants.checkWp` and `grants.checkAdvantage` are the same rider FRUGAL and
 * QUICK DRAW carry, declared for the thirteen at once because the sentence is
 * the same thirteen times. What reads it is the SKILL CHECK basic action: its
 * prompt offers every one of these the holder actually has, and bringing one
 * charges the Willpower and adds the advantage die. See CheckPick.jsx.
 *
 * **Whether it applies is the player's answer and not the sheet's.** No column
 * anywhere says that this attempt is about a map, so ARCANE MARSHAL is offered
 * with its own domain printed under it and the player is the one who decides
 * whether they are reading one. That is the same judgement the table was making
 * out loud before any of this was wired.
 */
function insight({ id, name, tags = [], domain, summary }) {
  return {
    ...SKILL,
    id,
    name,
    tags: ['Skill', 'Passive', ...tags],
    summary,
    grants: { checkWp: 1, checkAdvantage: 1 },
    body:
      `Whenever you make a skill check ${domain}, you can spend 1 Willpower ` +
      'to make it with advantage.',
  };
}

/* ----- the thirteen domains ----- */

/* Flag 1: this cell is Cartographer's, word for word. Left as printed. */
const ARCANE_MARSHAL = insight({
  id: 'arcane-marshal',
  name: 'Arcane Marshal',
  tags: ['Lore'],
  summary: 'Advantage on reading a map, retracing a route or finding a location.',
  domain:
    'to read or draw a map, or to retrace a route you have walked once before, or find a location',
});

const CARTOGRAPHER = insight({
  id: 'cartographer',
  name: 'Cartographer',
  tags: ['Lore', 'Survival'],
  summary: 'Advantage on reading a map, retracing a route or finding a location.',
  domain:
    'to read or draw a map, or to retrace a route you have walked once before, or find a location',
});

const EMPATH = insight({
  id: 'empath',
  name: 'Empath',
  tags: ['Insight', 'Social'],
  summary: 'Advantage on reading what another entity feels or intends.',
  domain: 'to gain insight on the behavior, emotion or thought of **another entity**',
});

const CHARISMATIC = insight({
  id: 'charismatic',
  name: 'Charismatic',
  tags: ['Social'],
  summary: 'Advantage on convincing, lying to or intimidating people.',
  domain: 'to convince, lie or intimidate people',
});

const CUNNING = insight({
  id: 'cunning',
  name: 'Cunning',
  tags: ['Stealth'],
  summary: 'Advantage on stealth, stealing or tricking.',
  domain: 'to stealth, steal or trick',
});

const SURVIVALIST = insight({
  id: 'survivalist',
  name: 'Survivalist',
  tags: ['Survival'],
  summary: 'Advantage on foraging, tracking beasts or crossing wild ground.',
  domain: 'to forage, track beasts or navigate natural environmental hazards',
});

const SCHOLAR = insight({
  id: 'scholar',
  name: 'Scholar',
  tags: ['Lore'],
  summary: 'Advantage on lore, magical artifacts or arcane runes.',
  domain: 'to recall historical lore, identify magical artifacts or analyze arcane runes',
});

const OCCULTIST = insight({
  id: 'occultist',
  name: 'Occultist',
  tags: ['Lore'],
  summary: 'Advantage on dark rituals, eldritch runes and what walks behind them.',
  domain:
    'to identify dark rituals, decipher eldritch runes or recall lore regarding fiends and aberrations',
});

const PHYSICIAN = insight({
  id: 'physician',
  name: 'Physician',
  tags: ['Insight', 'Support'],
  summary: 'Advantage on diagnosing an ailment, an injury or a cause of death.',
  domain: 'to diagnose ailments, examine physical trauma or determine a cause of death',
});

const SEAFARER = insight({
  id: 'seafarer',
  name: 'Seafarer',
  tags: ['Survival'],
  summary: 'Advantage on handling a vessel, a tide or a rigging line.',
  domain: 'to pilot a vessel, predict ocean tides or tie complex nautical rigging',
});

const INQUISITOR = insight({
  id: 'inquisitor',
  name: 'Inquisitor',
  tags: ['Insight', 'Social'],
  summary: 'Advantage on interrogation, reading nerves or prising out a secret.',
  domain:
    'to interrogate captives, spot physical nervous tells or extract hidden secrets under pressure',
});

const TROUBADOUR = insight({
  id: 'troubadour',
  name: 'Troubadour',
  tags: ['Social'],
  summary: 'Advantage on playing, reciting or holding an audience.',
  domain:
    'to play musical instruments, recite oral legends or captivate an audience with a performance',
});

/* Streetwise is the thirteenth and the only one whose sentence does not start
   "to": its cell reads "a skill check that have to do with", so it is written
   out rather than forced through the builder above. */
/* The fourteenth domain, written out rather than through `insight` because its
   sentence is the one that differs ("that has to do with"). The mechanic is the
   same to the letter, so it carries the same rider. */
const STREETWISE = {
  ...SKILL,
  id: 'streetwise',
  name: 'Streetwise',
  tags: ['Skill', 'Passive', 'Stealth', 'Social'],
  summary: 'Advantage on the criminal world, tracking people down or intimidating.',
  grants: { checkWp: 1, checkAdvantage: 1 },
  body:
    'Whenever you make a skill check that has to do with the criminal world, tracking down ' +
    'people or intimidating, you can spend 1 Willpower to make it with advantage.',
};

/* ----- the labours: what a Long Rest buys ----- */

const APOTHECARY = {
  ...SKILL,
  id: 'apothecary',
  name: 'Apothecary',
  tags: ['Skill', 'Long Rest', 'Craft'],
  summary: 'Craft a Health Potion or a Poison out of Supplies on a Long Rest.',
  body:
    'Whenever you take a Long Rest, you can take this action to craft either a Health Potion ' +
    'by expending 20 Supplies, or a Poison by expending 40 Supplies.',
};

const SCAVENGER = {
  ...SKILL,
  id: 'scavenger',
  name: 'Scavenger',
  tags: ['Skill', 'Long Rest', 'Survival'],
  stat: HIGHEST,
  summary: 'Scavenge the ground around a camp for Supplies on a Long Rest.',
  body:
    'Whenever you take a Long Rest in the outdoors, you can take the scavenge action: you make ' +
    'a {stat} Roll {roll} and gain that much Supplies.',
};

const TAILOR = {
  ...SKILL,
  id: 'tailor',
  name: 'Tailor',
  tags: ['Skill', 'Passive', 'Long Rest', 'Craft'],
  summary: 'Sew a disguise or bandages on a Long Rest, and read anyone by their clothes.',
  body:
    'Whenever you take a Long Rest, you can spend 10 Supplies to create a disguise or Bandages.\n\n' +
    'Additionally, you can gain information about **a clothed entity** if you can spend at least ' +
    '**1 minute** looking at its garments without doing a skill check. This can include social ' +
    'status and standing, authenticity and provenance.',
};

/* ----- the rest of the tab ----- */

const FRUGAL = {
  ...SKILL,
  id: 'frugal',
  name: 'Frugal',
  tags: ['Skill', 'Passive', 'Supplies'],
  summary: 'Every rest costs 2 Supplies less.',
  /* And the rest button charges it. The same number twice on purpose: the
     sentence is what a reader looks up and the rider is what `restPrice` in
     rest.js takes off the price, and carrying both on one card is what stops
     them drifting. See `skillGrantSources` below. */
  grants: { restSupplies: 2 },
  body: 'The cost of your Long and Short Rests is reduced by 2 Supplies.',
};

const HAGGLER = {
  ...SKILL,
  id: 'haggler',
  name: 'Haggler',
  tags: ['Skill', 'Passive', 'Coin', 'Social'],
  stat: HIGHEST,
  summary: 'Talk a price 20% up or down for 2 Willpower.',
  body:
    'When buying or selling something, after you hear the price you can attempt to haggle.\n\n' +
    'You spend 2 Willpower and make a {stat} Roll {roll} against the target’s Grit. ' +
    'On a success the price is increased or decreased by 20%.',
};

const HEALER = {
  ...SKILL,
  id: 'healer',
  name: 'Healer',
  tags: ['Skill', 'Passive', 'Support'],
  summary: 'Your healing dice are elevated, and elevated twice over the unconscious.',
  body:
    'When rolling dice to restore Health to yourself or **an ally**, the dice are elevated by 1, ' +
    'or by 2 if the target is unconscious.',
};

const HEAVY_ARMOR_MASTERY = {
  ...SKILL,
  id: 'heavy-armor-mastery',
  name: 'Heavy Armor Mastery',
  tags: ['Skill', 'Passive', 'Warfare'],
  minLevel: 5,
  summary: 'Armor +2 in a full set of heavy armor.',
  body: 'When wearing a full set of heavy armor, you gain +2 to Armor.',
};

const LIGHT_ARMOR_MASTERY = {
  ...SKILL,
  id: 'light-armor-mastery',
  name: 'Light Armor Mastery',
  tags: ['Skill', 'Passive', 'Warfare'],
  minLevel: 5,
  summary: 'Movement Speed +1.5 meters in a full set of light armor.',
  body:
    'When wearing a full set of light armor, your Movement Speed is increased by ' +
    '**1.5 meters (5 feet)**.',
};

const SPELLED_ARMOR_MASTERY = {
  ...SKILL,
  id: 'spelled-armor-mastery',
  name: 'Spelled Armor Mastery',
  tags: ['Skill', 'Passive', 'Warfare'],
  minLevel: 5,
  summary: 'Willpower +4 in a full set of Spelled Armor.',
  body: 'When wearing a full set of Spelled Armor, your Willpower is increased by 4.',
};

/* Both of the next two grow at level 6, so `uses` is read off the level rather
   than written down once. The sentence stays the designer's and the rider is
   what the sheet counts. See uses.js. */
const growsAtSix = (level) => (Math.floor(Number(level) || 1) >= 6 ? 2 : 1);

const MASTERMIND = {
  ...SKILL,
  id: 'mastermind',
  name: 'Mastermind',
  tags: ['Skill', 'Passive', 'Insight'],
  uses: growsAtSix,
  recharge: 'Long Rest',
  summary: 'Take a skill check as if every die rolled its highest, once a Long Rest.',
  body:
    'Instead of rolling, you can choose to treat a skill check as if all dice rolled their ' +
    'highest value.\n\n' +
    'You can use this feature once, regaining it after a Long Rest. The number of uses ' +
    'increases to 2 at level 6.',
};

const VIGILANT = {
  ...SKILL,
  id: 'vigilant',
  name: 'Vigilant',
  tags: ['Skill', 'Passive', 'Warfare'],
  summary: 'Punish anything that moves near you, and it may not get to move at all.',
  body:
    'Weapon attacks made as a reaction to a move action are made with advantage.\n\n' +
    'On a hit, the target must beat your Attack Roll with an {instinct} Roll or lose its ' +
    'Move action.',
};

const UNSEEN_SPELLWORK = {
  ...SKILL,
  id: 'unseen-spellwork',
  name: 'Unseen Spellwork',
  tags: ['Skill', 'Passive', 'Stealth'],
  summary: 'Cast without the target ever knowing it was you.',
  body:
    'When casting a spell, you can make a Cunning skill check against the target’s Grit. ' +
    'If you succeed, the target remains unaware that you cast the spell, regardless of its ' +
    'source requirements.\n\n' +
    'This check is made with advantage if you are not engaged in combat.',
};

const HELPFUL = {
  ...SKILL,
  id: 'helpful',
  name: 'Helpful',
  tags: ['Skill', 'Passive', 'Support', 'Social'],
  summary: 'Hand an ally advantage on their own check for 1 Willpower.',
  body: 'Whenever **an ally** makes a skill check, you can spend 1 Willpower to give them advantage.',
};

const SPELL_EATER = {
  ...SKILL,
  id: 'spell-eater',
  name: 'Spell Eater',
  tags: ['Skill', 'Passive', 'Warfare'],
  uses: growsAtSix,
  recharge: 'Long Rest',
  stat: HIGHEST,
  summary: 'Swallow a spell that hit you and heal on it, once a Long Rest.',
  body:
    'Whenever you take non-physical damage, you can attempt to consume the damage.\n\n' +
    'Make a {stat} Roll {roll}, reducing the damage taken by the result and healing an ' +
    'equal amount.\n\n' +
    'You can use this feature once, regaining it after a Long Rest. The number of uses ' +
    'increases to 2 at level 6.',
};

const SKILLED = {
  ...SKILL,
  id: 'skilled',
  name: 'Skilled',
  tags: ['Skill', 'Passive', 'Insight'],
  summary: 'Roll any skill check on 2d8 instead of 2d6 for 2 Willpower.',
  body: 'Whenever you make a skill check, you can spend 2 Willpower to use 2d8 instead of 2d6.',
};

const QUICK_DRAW = {
  ...SKILL,
  id: 'quick-draw',
  name: 'Quick Draw',
  tags: ['Skill', 'Passive', 'Warfare'],
  summary: 'Swapping weapon costs 1 less, and the swing after it has advantage.',
  /* The first half of it, declared. SWAP WEAPONS is a card like any other, so
     the cut rides it as `apCut` rides a spellbook's spells, and the Loadout
     block's button prints 1 with the 2 struck out beside it. The advantage on
     the swing after is the half nothing reads yet. See data/README.md. */
  grants: { swapAp: 1 },
  body:
    'The cost of swapping weapon is reduced by 1. The next attack after you swap is done with ' +
    'advantage.',
};

/* --------------------------------------------------------- INNATE SPELL built
 * Three rows, one shape. Each lets you choose a spell of its own rank from any
 * school and keep it for good, and which spell is a *question*: until it is
 * answered the character holds a card about a spell and no spell.
 *
 * So the rank's whole shelf is the card's `choice`, read off spells.js rather
 * than listed here, and `learns` is what says the answer is a card rather than a
 * word — the spell named joins the hand behind the skill that taught it (see
 * `skillCards` below). This is INNATE X's own shape in lineages.js, and the two
 * are deliberately identical: a player who has answered one has answered both.
 */

/**
 * Every spell of one rank, across every school, school by school.
 *
 * "From any school" is forty options at Novice, and the codex's own order walks
 * a school at a time but climbs the rungs inside each one, so filtering to a
 * rank left the schools interleaved. `sortCards` holds them together: all the
 * Primal, then Arcane, then Elemental, then Ethereal, and the families in order
 * under each. See src/lib/cardOrder.js.
 */
function spellsOfRank(rank) {
  return sortCards(SPELLS.filter((spell) => (spell.tags ?? []).includes(`${rank} Spell`)));
}

function innateSpell({ rank, minLevel }) {
  const shelf = spellsOfRank(rank);

  /* A rank with an empty shelf promises a spell that cannot be chosen, and the
     skill can never be settled. Said out loud rather than left for a player to
     find, the way lineages.js says it of a school. */
  if (import.meta.env?.DEV && shelf.length === 0) {
    console.error(
      `[hazebound] Innate Spell ${rank} offers no ${rank} spell, so the skill can never be ` +
        'settled. Write one, or stand a placeholder in for it the way Light and Shadow have.'
    );
  }

  return {
    ...SKILL,
    id: `innate-spell-${rank.toLowerCase()}`,
    name: `Innate Spell ${rank}`,
    tags: ['Skill', 'Passive', 'Spellcasting'],
    ...(minLevel ? { minLevel } : null),
    summary: `You learn one ${rank} spell from any school, cast with your highest Attribute.`,
    choice: {
      id: `innate-spell-${rank.toLowerCase()}-pick`,
      label: `${rank} Spell`,
      prompt: `Which ${rank} spell did you teach yourself?`,
      placeholder: `a ${rank} spell from any school`,
      learns: true,
      /* And what it is cast with. The spell is printed for Mind in the codex and
         this skill hands it over rolling off the highest Attribute instead, so
         the rider rides with it: same card, this character's numbers. INNATE X
         in lineages.js carries the identical line. */
      cast: HIGHEST,
      options: shelf.map((spell) => ({ id: spell.id, label: spell.name, card: spell })),
    },
    /* `{choice}` rather than the cell's own words, and the placeholder above is
       those words: unanswered the card still reads "a Novice spell from any
       school", and answered it names the spell. */
    body:
      'When learning this skill you can choose {choice} to learn permanently.\n\n' +
      'It uses your highest Attribute.',
  };
}

const INNATE_SPELL_NOVICE = innateSpell({ rank: 'Novice' });
const INNATE_SPELL_ADEPT = innateSpell({ rank: 'Adept', minLevel: 5 });
const INNATE_SPELL_MASTER = innateSpell({ rank: 'Master', minLevel: 10 });

/**
 * The tab, in the order it prints. Every skill in the game is here, whether or
 * not a background offers it: five are level-gated and are learned on the road
 * instead.
 */
const SKILL_CODEX = [
  APOTHECARY,
  ARCANE_MARSHAL,
  CARTOGRAPHER,
  FRUGAL,
  EMPATH,
  HAGGLER,
  HEALER,
  HEAVY_ARMOR_MASTERY,
  LIGHT_ARMOR_MASTERY,
  SPELLED_ARMOR_MASTERY,
  MASTERMIND,
  VIGILANT,
  UNSEEN_SPELLWORK,
  HELPFUL,
  SPELL_EATER,
  CHARISMATIC,
  SKILLED,
  STREETWISE,
  TAILOR,
  CUNNING,
  SCAVENGER,
  QUICK_DRAW,
  INNATE_SPELL_NOVICE,
  INNATE_SPELL_ADEPT,
  INNATE_SPELL_MASTER,
  SURVIVALIST,
  SCHOLAR,
  OCCULTIST,
  PHYSICIAN,
  SEAFARER,
  INQUISITOR,
  TROUBADOUR,
];

/* ------------------------------------------------------------- wearing the art
 * Dressed once, at module scope, on the one list every reader shares. A skill is
 * offered by several backgrounds and folded into the registry besides, and
 * `withArt` spreads: dressing anything downstream of here would give the picture
 * to one copy and leave the others bare. Same trade lineages.js makes, and the
 * reason `npm run art:cards` can place a skill picture at all.
 */
export const SKILLS = withArt(SKILL_CODEX);

const SKILL_BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill]));

/** The dressed card, by the constant above it. Throws rather than losing art. */
function dressed(card) {
  const worn = SKILL_BY_ID.get(card.id);
  if (!worn) throw new Error(`backgrounds.js: ${card.id} was never dressed`);
  return worn;
}

/** What level a skill can first be learned at. 1 unless its row says otherwise. */
export function skillLevel(skill) {
  return Math.max(1, Math.floor(Number(skill?.minLevel) || 1));
}

/* --------------------------------------------------------------- the codex
 *
 * Fields:
 *   picks     — how many skills this background lets you learn, 1 to 3
 *   skills    — the pool it offers them from
 *   kit       — what you walk in carrying:
 *                 weapons   how many Common weapons you choose
 *                 armor     always true, one full Common three-piece set
 *                 belt      codex item ids clipped to open belt loops
 *                 pack      written entries the item codex has no item for
 *               Coins and Supplies are not written here. They are filled in
 *               below from `startingCoins` and `STARTING_SUPPLIES`.
 *
 * The trade, laid out so it can be checked at a glance. Coins follow from the
 * skills and Supplies never move, so the only things left to tell the ten apart
 * are the pool, the weapon count and what is in your pockets:
 *
 *   CRIMINAL      3 skills · 2000 ¢ · 1 weapon  · 2 belt, 1 pack
 *   ERUDIT        3 skills · 2000 ¢ · 1 weapon  · 1 belt, 2 pack
 *   OUTLANDER     3 skills · 2000 ¢ · 1 weapon  · 2 belt, 1 pack
 *   ENTERTAINER   3 skills · 2000 ¢ · 1 weapon  · 1 belt, 2 pack
 *   MILITARY      2 skills · 4000 ¢ · 2 weapons · 1 belt, 1 pack
 *   MERCENARY     2 skills · 4000 ¢ · 2 weapons · 2 belt, 1 pack
 *   CRAFTSMAN     2 skills · 4000 ¢ · 1 weapon  · 1 belt, 2 pack
 *   INVESTIGATOR  2 skills · 4000 ¢ · 1 weapon  · 1 belt, 2 pack
 *   MERCHANT      1 skill  · 6000 ¢ · 1 weapon  · 1 belt, 2 pack
 *   ARISTOCRAT    1 skill  · 6000 ¢ · 1 weapon  · 1 belt, 2 pack
 *
 * Every pool offers six or seven and lets you keep one, two or three, so no two
 * characters out of the same trade have to look alike, and every one of the
 * twenty-seven skills learnable at level 1 is offered by somebody.
 */

const BACKGROUND_CODEX = [
  {
    id: 'criminal',
    name: 'Criminal',
    tagline: 'You learned the city from underneath it.',
    art: '/backgrounds/criminal.jpg',
    tags: ['underworld', 'stealth', 'social'],
    blurb:
      'You made your living on the wrong side of a door. Maybe you ran with a crew, maybe you worked alone and slept badly for it, but either way you know which windows are never latched and which watchmen are already paid.\n\n' +
      'The trade leaves marks. You count the exits before you sit down, you price everything you look at, and you have more friends than a respectable person should, none of whom will admit to knowing you.',
    picks: 3,
    skills: [CUNNING, STREETWISE, QUICK_DRAW, UNSEEN_SPELLWORK, HAGGLER, VIGILANT],
    kit: {
      weapons: 1,
      armor: true,
      belt: ['thiefs-picks', 'smoke-vial'],
      pack: [
        {
          name: 'Forged Papers',
          note: 'A travel writ in someone else’s name. Good enough for a bored gate guard.',
        },
      ],
    },
  },

  {
    id: 'erudit',
    name: 'Erudit',
    tagline: 'Three things you know, and nothing at all in your pockets.',
    art: '/backgrounds/erudit.jpg',
    tags: ['scholarly', 'lore'],
    blurb:
      'An academy, a private library, a master who took you on and then died. You came up through books, and it shows: you have read about far more of the world than you have walked through.\n\n' +
      'You left with the only thing an education reliably produces. A great deal of knowledge, and no money whatsoever.',
    picks: 3,
    skills: [
      SCHOLAR,
      OCCULTIST,
      CARTOGRAPHER,
      ARCANE_MARSHAL,
      SKILLED,
      INNATE_SPELL_NOVICE,
      PHYSICIAN,
    ],
    kit: {
      weapons: 1,
      armor: true,
      belt: ['storm-lantern'],
      pack: [
        {
          name: 'Field Journal',
          note: 'Half filled, cross-referenced and indexed in a hand only you can read.',
        },
        {
          name: 'Letter of Standing',
          note: 'Your master’s hand, vouching for you. The seal is genuine and the master is dead.',
        },
      ],
    },
  },

  {
    id: 'military',
    name: 'Military',
    tagline: 'You were paid to stand in a line and not run.',
    art: '/backgrounds/military.jpg',
    tags: ['martial', 'warfare', 'coin'],
    blurb:
      'A regiment, a levy, a city garrison. You carried a weapon on somebody else’s order and you were good enough at it to still be here. You know how a camp is run, how a siege is dug and how long men will hold before they break.\n\n' +
      'What the army really taught you is redundancy: never carry one of anything you would die without. You still march with a spare.',
    picks: 2,
    skills: [VIGILANT, QUICK_DRAW, HEALER, FRUGAL, CARTOGRAPHER, MASTERMIND],
    kit: {
      // One of the two backgrounds that arms both hands. Nothing is traded for
      // it: the purse follows the skills, and the skills are what the life
      // taught, so a second weapon is the life itself showing.
      weapons: 2,
      armor: true,
      belt: ['bandage-roll'],
      pack: [
        {
          name: 'Campaign Kit',
          note: 'Mess tin, whetstone, oilcloth and a folded shelter half. Everything a march needs and nothing it does not.',
        },
      ],
    },
  },

  {
    id: 'outlander',
    name: 'Outlander',
    tagline: 'No town claims you, and the road has never run out.',
    art: '/backgrounds/outlander.jpg',
    tags: ['wilds', 'survival', 'supplies'],
    blurb:
      'You have been moving for as long as it matters. Outrider, trapper, pilgrim, exile. The name changes and the life does not. You have slept under more skies than roofs.\n\n' +
      'The wilds do not forgive carelessness, so you stopped being careless. You carry everything you need, and you know how to replace all of it.',
    picks: 3,
    skills: [SURVIVALIST, SCAVENGER, CARTOGRAPHER, APOTHECARY, FRUGAL, HEALER],
    kit: {
      weapons: 1,
      armor: true,
      belt: ['storm-lantern', 'grappling-hook'],
      pack: [
        {
          name: 'Bedroll and Snares',
          note: 'Oiled canvas, a bundle of wire and a bag of iron pegs. It has never once been dry.',
        },
      ],
    },
  },

  {
    id: 'craftsman',
    name: 'Craftsman',
    tagline: 'A trade, a guild mark and hands that know the work.',
    art: '/backgrounds/craftsman.jpg',
    tags: ['trade', 'craft', 'supplies'],
    blurb:
      'You served your years and came out the other side with a craft: smith, alchemist, glazier, binder, it hardly matters which. What matters is that you can look at a made thing and see how it was made.\n\n' +
      'Guild work pays steadily and teaches patience, and you left carrying both: a full pack, a good name in one town and the quiet certainty that most problems are a materials problem.',
    picks: 2,
    skills: [TAILOR, APOTHECARY, FRUGAL, HAGGLER, SKILLED, QUICK_DRAW],
    kit: {
      weapons: 1,
      armor: true,
      belt: ['storm-lantern'],
      pack: [
        {
          name: 'Artisan’s Tools',
          note: 'The roll of your trade: files, pliers, a good glass and the one tool you made yourself.',
        },
        {
          name: 'Guild Ledger',
          note: 'Your record of work owed and owing. A guild hall anywhere will honour the mark on the cover.',
        },
      ],
    },
  },

  {
    id: 'entertainer',
    name: 'Entertainer',
    tagline: 'A full room, an empty purse and somewhere else to be tomorrow.',
    art: '/backgrounds/entertainer.jpg',
    tags: ['stage', 'social'],
    blurb:
      'Taprooms, fairgrounds, a patron’s hall for one glorious season. You sang, played, tumbled, told it funnier than it happened. You have held a room of drunk strangers and you have been run out of two towns.\n\n' +
      'The work teaches you to read a crowd in the first ten seconds and to leave before the mood turns. Both have kept you alive more than once.',
    picks: 3,
    skills: [TROUBADOUR, CHARISMATIC, EMPATH, CUNNING, HELPFUL, SKILLED],
    kit: {
      weapons: 1,
      armor: true,
      belt: ['smoke-vial'],
      pack: [
        {
          name: 'Your Instrument',
          note: 'Repaired twice, tuned by ear and worth far more to you than to anyone buying.',
        },
        {
          name: 'Costume Trunk',
          note: 'Three characters’ worth of clothes, a wig and a jar of stage paint.',
        },
      ],
    },
  },

  {
    id: 'merchant',
    name: 'Merchant',
    tagline: 'You know what everything costs, and what it is worth.',
    art: '/backgrounds/merchant.jpg',
    tags: ['trade', 'coin', 'social'],
    blurb:
      'A stall, a caravan, a family firm with a name over the door. You bought low somewhere and sold high somewhere else, and you did it often enough to be carrying a float rather than a debt.\n\n' +
      'Trade is the study of what people want and what they will admit to wanting. You have never once needed a weapon to get a door opened.',
    picks: 1,
    skills: [HAGGLER, FRUGAL, CHARISMATIC, EMPATH, SEAFARER, SCHOLAR],
    kit: {
      weapons: 1,
      armor: true,
      belt: ['terra-cotta-disk'],
      pack: [
        {
          name: 'Ledger of Debts',
          note: 'Who owes you, who you owe and the three names in the back you have not decided about.',
        },
        {
          name: 'Merchant’s Seal',
          note: 'Your mark, pressed into the wax of every crate you ever shipped.',
        },
      ],
    },
  },

  {
    id: 'aristocrat',
    name: 'Aristocrat',
    tagline: 'A name that opens doors, and the debts that come with it.',
    art: '/backgrounds/aristocrat.jpg',
    tags: ['court', 'coin', 'social'],
    blurb:
      'You were born to a house with land, or money, or at minimum a very old grievance. You were taught to dance, to ride, to read a room and never once to cook.\n\n' +
      'Whether you left in disgrace or on an errand, the name travels with you. It buys credit in places coin cannot, and it costs you something every time somebody recognises it.',
    picks: 1,
    skills: [CHARISMATIC, EMPATH, MASTERMIND, SCHOLAR, TROUBADOUR, INNATE_SPELL_NOVICE],
    kit: {
      weapons: 1,
      armor: true,
      /* Was the Aether Draught until 2026-08-27, when the potion drop replaced
         the whole shelf and took the stand-in with it. The Luck Potion is the
         nearest thing the new sheet has for a house name: an hour of advantage on
         every skill check is what "it buys credit in places coin cannot" is, and
         it is a Novice row like every other kit item. */
      belt: ['luck-potion'],
      pack: [
        {
          name: 'Signet Ring',
          note: 'Your house’s seal, cut in silver. Pressed into wax it is worth far more than the ring.',
        },
        {
          name: 'Letter of Writ',
          note: 'A sealed introduction from your house, addressed to no one in particular. You will know when to spend it.',
        },
      ],
    },
  },

  {
    id: 'investigator',
    name: 'Investigator',
    tagline: 'Somebody was lying, and you were the one who had to find out.',
    art: '/backgrounds/investigator.jpg',
    tags: ['law', 'insight', 'lore'],
    blurb:
      'A watch house, a magistrate’s office, a private practice above a chandler’s shop. You took statements, walked over the same ground four times and noticed the thing everybody else had stepped past.\n\n' +
      'The work is mostly patience and a little cruelty. You have learned when a silence is guilt and when it is only fear, and you can no longer stop doing it to people you like.',
    picks: 2,
    skills: [INQUISITOR, ARCANE_MARSHAL, EMPATH, PHYSICIAN, CUNNING, VIGILANT, OCCULTIST],
    kit: {
      weapons: 1,
      armor: true,
      belt: ['thiefs-picks'],
      pack: [
        {
          name: 'Case File',
          note: 'The one that never closed. You have read it so often you no longer see the words.',
        },
        {
          name: 'Writ of Inquiry',
          note: 'It compels nobody and impresses most people, which is very nearly the same thing.',
        },
      ],
    },
  },

  {
    id: 'mercenary',
    name: 'Mercenary',
    tagline: 'You have never once fought for free.',
    art: '/backgrounds/mercenary.jpg',
    tags: ['martial', 'warfare', 'survival'],
    blurb:
      'A free company, a caravan guard, whichever side was hiring that season. You have fought under four banners and believed in none of them, and the contract has always mattered more than the cause.\n\n' +
      'It is honest work, in its way. You are paid, you do the thing, you are paid again. What you have instead of loyalty is a reputation, and you guard it like coin.',
    picks: 2,
    skills: [VIGILANT, QUICK_DRAW, SCAVENGER, STREETWISE, HEALER, SPELL_EATER],
    kit: {
      weapons: 2,
      armor: true,
      belt: ['healing-potion', 'bandage-roll'],
      pack: [
        {
          name: 'Company Contract',
          note: 'Terms, rates and the clause about what your body is worth to whoever ships it home.',
        },
      ],
    },
  },
];

/**
 * The ten as everything else sees them: pointing at the dressed cards, and with
 * the purse filled in from the formula rather than written down beside it.
 */
export const BACKGROUNDS = BACKGROUND_CODEX.map((background) => ({
  ...background,
  skills: background.skills.map(dressed),
  kit: {
    ...background.kit,
    coins: startingCoins(background.picks),
    supplies: STARTING_SUPPLIES,
  },
}));

/* A pool holding a level-gated skill would offer at level 1 something nobody can
   learn until level 5, and the block would hand it over. Said out loud rather
   than quietly filtered: a pool is data, and this is a data error. */
if (import.meta.env?.DEV) {
  for (const background of BACKGROUNDS) {
    const early = background.skills.filter((skill) => skillLevel(skill) > 1);
    if (early.length > 0) {
      console.error(
        `[hazebound] ${background.name} offers ${early
          .map((skill) => `${skill.name} (level ${skillLevel(skill)})`)
          .join(', ')}, which cannot be learned at level 1. Take it out of the pool.`
      );
    }
    if (background.skills.length < background.picks) {
      console.error(
        `[hazebound] ${background.name} lets you learn ${background.picks} skills out of a pool ` +
          `of ${background.skills.length}, so it can never be finished.`
      );
    }
  }
}

/* ------------------------------------------------------------------ lookups */

/**
 * Every skill card, each exactly once — the shared ones sit in several pools and
 * must not be registered twice. weapons.js folds this into the global card
 * registry, so a skill can be dealt onto the pile and linked to like any other
 * card.
 *
 * Every skill in the codex is here, including the five no background offers: a
 * level-gated skill is still a card, and a card outside the registry is one no
 * link can resolve and no pile can deal.
 */
export const BACKGROUND_CARDS = SKILLS;

const BACKGROUND_BY_ID = new Map(BACKGROUNDS.map((b) => [b.id, b]));
const BACKGROUND_BY_NAME = new Map(BACKGROUNDS.map((b) => [b.name.toLowerCase(), b]));

/** By id or by name — the character row stores the plain name, as lineage does. */
export function getBackground(key) {
  if (!key) return null;
  const wanted = String(key).trim();
  return BACKGROUND_BY_ID.get(wanted) ?? BACKGROUND_BY_NAME.get(wanted.toLowerCase()) ?? null;
}

export function getBackgroundSkill(id) {
  return id ? SKILL_BY_ID.get(id) ?? null : null;
}

/** A background's tags as objects, in the order the tag table declares them. */
export function backgroundTags(background) {
  const held = new Set(background?.tags ?? []);
  return BACKGROUND_TAGS.filter((tag) => held.has(tag.id));
}

/** Only the tags something in the codex actually uses — the filter's whole list. */
export function usedBackgroundTags() {
  const used = new Set(BACKGROUNDS.flatMap((background) => background.tags));
  return BACKGROUND_TAGS.filter((tag) => used.has(tag.id));
}

/** How many skills a background hands out, held inside the allowed range. */
export function skillPicks(background) {
  const picks = Math.floor(Number(background?.picks) || MIN_SKILL_PICKS);
  return Math.min(MAX_SKILL_PICKS, Math.max(MIN_SKILL_PICKS, picks));
}

/* ------------------------------------------------------- the skills' own asks
 * Three skills leave a question behind them, and the answer is a card. Read the
 * same way a lineage's is: out of the `choices` bag, keyed by the card that
 * asked. See lineages.js, whose INNATE X these mirror.
 */

/** What this character answered on a card that asks, or null while it is open. */
export function skillAnswer(skill, choices) {
  if (!skill?.choice) return null;
  return skill.choice.options.find((option) => option.id === choices?.[skill.id]) ?? null;
}

/** The card an answered skill hands over, or null while the question is open. */
export function learnedFromSkill(skill, choices) {
  if (!skill?.choice?.learns) return null;
  return skillAnswer(skill, choices)?.card ?? null;
}

/** Whether every question a list of skills asks has been answered. */
export function skillsSettled(skills, choices) {
  return skills.every((skill) => !skill?.choice || skillAnswer(skill, choices));
}

/**
 * The cards a set of skills actually puts on the sheet, each with what the skill
 * that taught it does to it.
 *
 * The skills themselves, and behind each one that taught a spell, the spell.
 * "You can choose a Novice spell from any school" is a promise until the spell
 * itself is on the sheet: this is where it becomes something the character can
 * read, deal and cast rather than a sentence about a choice they made once.
 *
 * A `{ card, modifiers }` row rather than a bare card, the same shape the
 * Abilities tab prints and the same one `lineageCards` hands back. An answered
 * skill prints its answer, and a spell taught by INNATE SPELL X is cast with the
 * highest Attribute rather than the Mind it was printed for. Both belong to the
 * source rather than to the card, so both are settled here.
 */
export function skillCards(skills, choices) {
  return skills.flatMap((skill) => {
    const answer = skillAnswer(skill, choices);
    const mine = { card: skill, modifiers: answer ? { choice: answer } : null };
    const learned = learnedFromSkill(skill, choices);
    return learned ? [mine, { card: learned, modifiers: castModifier(skill.choice) }] : [mine];
  });
}

/* ------------------------------------------------------ what a skill does
 * A skill card has always said its piece in prose and left the sheet to print
 * it and nothing else. FRUGAL read "reduced by 2 Supplies" and the rest button
 * still charged 10; QUICK DRAW read "reduced by 1" and the swap still charged
 * 2. `grants` is that sentence written as a number, carried on the card that
 * prints it, so the two can never drift apart.
 *
 * The same rider a lineage card carries and read the same way, deliberately:
 * see `lineageGrantSources` in lineages.js. Two fields are declared today.
 *
 *   restSupplies  what comes off the price of a rest, both kinds. FRUGAL.
 *   swapAp        what comes off SWAP WEAPONS. QUICK DRAW.
 *
 * This file is a leaf and cannot see a character, so the reader is handed a
 * list of ids. `characterSkillGrantSources` in levelPicks.js is the composed
 * reading, and it is the one every consumer wants: a skill can arrive from a
 * background, from an odd level or from a pact, and only that file can see all
 * three.
 */

/** The same list with each id once, in the order it was first met. */
function dedupeIds(ids) {
  return [...new Set((Array.isArray(ids) ? ids : [...(ids ?? [])]).map(String).filter(Boolean))];
}

/**
 * What a set of skills does to the sheet's own numbers, one row per skill that
 * does anything, named after the skill.
 *
 * Named after the card rather than the background, because the card is the thing
 * a reader can go and look at: a rest that cost 8 instead of 10 says "Frugal",
 * not "Merchant". The rows come back in the shape `grantTerms` in statMath.js
 * already draws an enchantment with, so anything that has to explain a number
 * can hand them straight to it.
 *
 * Deduplicated on the way in for the same reason `grantsFrom` in enchanting.js
 * is: one skill is one source however many places offered it, and a background
 * and a pact both teaching Frugal is one skill and one cut. The choosers already
 * refuse the second, so this is the belt to that pair of braces.
 *
 * Rows rather than a sum, because every consumer so far has a second question to
 * answer: a rest that cost 8 instead of 10 has to say what cut it, and so does a
 * swap that cost 1 instead of 2. Whoever is reading knows which field it wants
 * and sums that one. Wiring the next rider is a `grants` on the card and one
 * short reduction where the number is spent: the three Armor Masteries' "+2 to
 * Armor" is the next one, and is still printed only. See data/README.md.
 */
export function skillGrantSources(ids) {
  return dedupeIds(ids)
    .map(getBackgroundSkill)
    .filter((skill) => skill?.grants)
    .map((skill) => ({ name: skill.name, ...skill.grants }));
}

/**
 * Whether a skill speaks about a skill check the holder is the one making.
 *
 * Read off the prose, because the prose is where the codex says it: fourteen
 * cells say "whenever you make a skill check", and a fifteenth arriving in a
 * drop should turn up in the prompt without anybody remembering a list here.
 *
 * The two exclusions are the point of matching a phrase rather than the words:
 * HELPFUL is "whenever **an ally** makes a skill check", which is not this
 * check, and TAILOR reads a stranger's clothes "without doing a skill check",
 * which is the absence of one. Neither belongs in a picker of what to bring.
 */
const MAKES_A_CHECK = /\byou make a skill check\b|\btreat a skill check\b/i;

/**
 * The held skills that have something to say about a skill check.
 *
 * What the SKILL CHECK basic action offers when it is played: every one of these
 * is a card the holder can *bring* to the attempt.
 *
 * `wp` and `advantage` come off `grants`, so a row that says it and is not
 * wired yet comes back with both at zero. The prompt shows those as what they
 * are: a named line saying the card speaks to this and the sheet cannot spend
 * it for you. Two do today, and both because their mechanic is not a die added
 * to the roll: SKILLED swaps the check's own 2d6 for 2d8, and MASTERMIND
 * maximises them once a Long Rest. Both are flagged in data/README.md.
 * Offering them as dead toggles would be worse than naming them.
 */
export function checkSkills(ids) {
  return dedupeIds(ids)
    .map(getBackgroundSkill)
    .filter((skill) => skill && MAKES_A_CHECK.test(skill.body ?? ''))
    .map((skill) => ({
      id: skill.id,
      name: skill.name,
      /* The domain, in the card's own words. Which is the whole question the
         player is answering by ticking it. */
      summary: skill.summary ?? '',
      wp: Math.max(0, Math.floor(Number(skill.grants?.checkWp) || 0)),
      advantage: Math.max(0, Math.floor(Number(skill.grants?.checkAdvantage) || 0)),
    }));
}

/* --------------------------------------------------------- reading the row */

/**
 * A stored skill list is only ever a hint. It may hold ids the codex has since
 * dropped, ids belonging to a background the character no longer has,
 * duplicates, or more picks than the background allows. Whatever comes in,
 * this returns ids that background really offers, each once, capped at its
 * pick count.
 */
export function normalizeBackgroundSkills(background, value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!Array.isArray(source) || !background) return [];

  const offered = new Set(background.skills.map((skill) => skill.id));
  const kept = [];
  for (const raw of source) {
    const id = typeof raw === 'string' ? raw : String(raw?.id ?? '');
    if (offered.has(id) && !kept.includes(id)) kept.push(id);
  }
  return kept.slice(0, skillPicks(background));
}

/**
 * A stored kit record, repaired. `null` means the kit has not been taken —
 * which is also how a malformed record is treated, since a record that cannot
 * be read cannot be handed back either.
 */
export function normalizeKit(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!source || typeof source !== 'object') return null;

  const equipment = {};
  if (source.equipment && typeof source.equipment === 'object') {
    for (const [slot, id] of Object.entries(source.equipment)) {
      if (typeof id === 'string' && id) equipment[slot] = id;
    }
  }

  return {
    background: typeof source.background === 'string' ? source.background : '',
    armorSet: typeof source.armorSet === 'string' ? source.armorSet : '',
    weapons: (Array.isArray(source.weapons) ? source.weapons : []).filter(
      (id) => typeof id === 'string'
    ),
    // The three places a kit can put something, each recorded as it was handed
    // over: which slots it filled, which belt loops it clipped, and every id it
    // dropped in the pack — codex ids and minted `custom-` ones alike. This is
    // the whole receipt: handing back undoes exactly these and leaves anything
    // that has since moved on. A kit taken before slots were filled has only a
    // pack, and still hands back correctly.
    equipment,
    belt: (Array.isArray(source.belt) ? source.belt : [])
      .map((entry) => ({
        index: Math.floor(Number(entry?.index)),
        id: typeof entry?.id === 'string' ? entry.id : '',
      }))
      .filter((entry) => entry.id && Number.isFinite(entry.index) && entry.index >= 0),
    pack: (Array.isArray(source.pack) ? source.pack : []).filter((id) => typeof id === 'string'),
    coins: Math.max(0, Math.floor(Number(source.coins) || 0)),
    supplies: Math.max(0, Math.floor(Number(source.supplies) || 0)),
    ts: typeof source.ts === 'string' ? source.ts : '',
  };
}

/**
 * Everything the Advancement tab's background block needs, read off the
 * character row in one pass.
 *
 * `written` is what the row actually says. A name the codex does not know is
 * kept and shown as written rather than cleared — a table is free to invent
 * its own background, exactly as it may invent its own lineage.
 *
 * `complete` counts the follow-up questions too. A character who learned Innate
 * Spell Novice and never said which spell is holding a card with a blank in the
 * middle of its sentence, and the block badges that the way an unanswered
 * lineage card does.
 */
export function backgroundState(character) {
  const written = String(character?.background ?? '').trim();
  const background = getBackground(written);

  const skillIds = normalizeBackgroundSkills(background, character?.background_skills);
  const picks = background ? skillPicks(background) : 0;
  const kit = normalizeKit(character?.background_kit);
  const choices = character?.choices ?? {};
  const skills = skillIds.map(getBackgroundSkill).filter(Boolean);
  const asks = skills.filter((skill) => skill.choice);
  const open = asks.filter((skill) => !skillAnswer(skill, choices));

  return {
    written,
    background,
    skillIds,
    skills,
    picks,
    remaining: Math.max(0, picks - skillIds.length),
    /* What the skills put on the sheet: themselves, and any spell they taught,
       each as a { card, modifiers } row. */
    cards: skillCards(skills, choices),
    asks,
    unanswered: open.length,
    complete: Boolean(background) && skillIds.length >= picks && open.length === 0,
    kit,
    taken: Boolean(kit),
  };
}

/* ----------------------------------------------------- writing the skill list
 * Both take the stored list and hand back the next one, so the block only ever
 * has to `patch({ background_skills: … })`. Neither mutates its input.
 */

/** Keep a skill, if that background offers it and a pick is still open. */
export function takeSkill(background, chosen, skillId) {
  const list = normalizeBackgroundSkills(background, chosen);
  if (list.includes(skillId)) return list;
  if (list.length >= skillPicks(background)) return list;
  if (!background?.skills.some((skill) => skill.id === skillId)) return list;
  return [...list, skillId];
}

/** Give a skill back. */
export function dropSkill(background, chosen, skillId) {
  return normalizeBackgroundSkills(background, chosen).filter((id) => id !== skillId);
}
