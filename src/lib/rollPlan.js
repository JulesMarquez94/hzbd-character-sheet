import { attributeOf, cardProse, castStat, resolveValue } from './cardText.js';

/**
 * What a card is going to make you roll, read off the card.
 *
 * A card already says what it rolls. It has said so since the codex was typed:
 * `{roll}` is the check, and every `[[2d6 + 2*stat]]` is a handful of dice with
 * a number after it. So there is no new field on any card and no table of
 * exceptions here. The plan is the card's own text, in the order it is printed,
 * which is also the order it is read aloud at a table.
 *
 * That order matters more than it looks. "Make a {stat} Melee Attack {roll}
 * against an entity. On a hit, you deal [[1d6 + stat]] damage" is two links, and
 * the second one only happens because the first one landed. Printing order is
 * resolution order, so walking the text left to right is walking the chain.
 *
 * ------------------------------------------------------------ what is a link
 * Two kinds, and a third thing that looks like one and is not.
 *
 *   {roll}          a check. 2d6 plus what this character adds, against a DC.
 *   [[2d6 + stat]]  dice to roll, for damage or healing or a Shield.
 *   [[stat]]        **not a link.** "gain Shield equal to your Instinct" is a
 *                   number, not a throw. `resolveValue` says so itself: no
 *                   dice in it, nothing to roll. teeth-bite is the card that
 *                   has both in one sentence, and rolling the second would put
 *                   a die on the table for a value the card states outright.
 *
 * ------------------------------------------------------------- the first roll
 * Only the first `{roll}` becomes a check, and two cards in the codex have a
 * second one. That is deliberate rather than a limit worth removing: a chain
 * asks for its DC once, per Jules on 2026-08-30, so a card with two checks would
 * have to ask twice or guess that the second shares the first one's number.
 * Neither is obviously right, so the plan takes the one it is sure about. Both
 * cards are flagged in the checker.
 *
 * ----------------------------------------------------------- naming a throw
 * A throw is named for what it is *for*, which the card says in the word right
 * after the dice: "{damage} damage", "Health", "Shield". Read from the text
 * following the token rather than from the sentence around it, because a
 * sentence that deals damage and heals in one breath would otherwise call both
 * of them the same thing. Where the following word settles nothing the sentence
 * is asked, and where that settles nothing either the throw is just a Roll,
 * which is honest and costs nothing: the dice and the total are right either
 * way, and only the word above them was ever in question.
 */

/** A check or a value, wherever one appears in a card's text. */
const LINK = /\{roll(?::([a-zA-Z]+))?\}|\[\[([^\]]+)\]\]/g;

/** What the dice are for, when the words after them say. */
const AFTER = [
  [/^\s*(?:\{damage(?::[A-Za-z]+)?\}\s*)?damage\b/i, 'damage'],
  [/^\s*(?:\{damage(?::[A-Za-z]+)?\}\s*)?Health\b/i, 'healing'],
  [/^\s*Shield\b/i, 'shield'],
];

/**
 * A value the card lands more than once, and how many times.
 *
 * Eleven cards in the codex do this and they say it two ways, both of them in
 * the sentence the dice are in:
 *
 *   "the blade lands three times, each landing dealing [[1d6 + stat]] damage"
 *   "you deal [[1d4 + stat]] damage twice"
 *
 * Each landing is its own throw, per Jules on 2026-08-30, which matters for more
 * than tidiness: three separate d6 are not one d6 counted three times, and each
 * of them gets its own chance to explode.
 *
 * `twice` is guarded against "twice the number of Damage Dice rolled", which is
 * a multiplier on a count rather than a repeat. That phrasing is on the Poison
 * potion, in a different paragraph from its dice, so the sentence scope already
 * keeps it out. The guard is here because the sentence scope is the only thing
 * keeping it out, and a card drop could put the two in one sentence.
 */
const REPEATS = [
  [/\btwice\b(?!\s+the\b)/i, 2],
  [/\b(?:three times|thrice)\b/i, 3],
  [/\bfour times\b/i, 4],
  [/\bfive times\b/i, 5],
];

/**
 * The chain a use is about to raise, as specs `present` can take.
 *
 *   card       the card being played
 *   character  whose numbers it prints. A creature plays its own.
 *   modifiers  what the holder brings: the stat it casts off, Empower, Elevate,
 *              a lent bonus, and the advantage riding the swing. The same
 *              object AbilityCard prints the card with, so the dice that land
 *              are the dice the player was looking at when they pressed use.
 *   half       whether the card's second half was paid for. Eleven halves in
 *              the codex roll dice and none of them repeats the base card's,
 *              so a paid half is extra links rather than replacement ones.
 */
export function rollPlan(card, character, modifiers = null, { half = false } = {}) {
  const mods = modifiers ?? {};
  const who = mods.actor ?? character;
  const stat = castStat(mods.stat ?? card?.stat ?? 'instinct', who);
  const sums = {
    empower: Number(mods.empower) || 0,
    elevate: Number(mods.elevate) || 0,
    bonus: Number(mods.bonus) || 0,
  };
  /* What kind of damage, for the line the log prints under the rolls: "Dealt 17
     Necrotic damage". An Infusion replaces the card's printed type outright, so
     the holder's is read first, exactly as AbilityCard prints it. */
  const damage = mods.damage?.length ? mods.damage : (card?.damage ?? []);

  const links = [];
  const texts = [card?.body, half ? card?.sub_body : null];

  for (const raw of texts) {
    if (!raw) continue;
    /* Markers off first. A bold run may wrap a live value, so "**[[2d6]]**
       damage" would otherwise be asked what follows it and be told "** damage".
       See cardProse in cardText.js. */
    const text = cardProse(raw);

    LINK.lastIndex = 0;
    let match;
    while ((match = LINK.exec(text))) {
      const [whole, named, expression] = match;
      const after = text.slice(match.index + whole.length);

      if (expression === undefined) {
        // Already have the one check this chain will ask a DC for.
        if (links.some((link) => link.shape === 'check')) continue;

        const attribute = attributeOf(named ?? 'stat', stat);
        if (!attribute) continue;

        links.push({
          shape: 'check',
          kind: sentenceAround(text, match.index).includes('attack') ? 'attack' : 'check',
          flat: resolveValue(attribute.key, who, stat, sums).flat,
          advantage: Number(mods.advantage) || 0,
          disadvantage: Number(mods.disadvantage) || 0,
          /* The one question the sheet cannot answer for itself. A critical is 6
             over the DC, so without the number there is no verdict to give. */
          askDc: true,
          askVerdict: true,
        });
        continue;
      }

      const resolved = resolveValue(expression, who, stat, sums);
      // A value with no dice in it is a number the card states, not a throw.
      if (resolved.dice.length === 0) continue;

      const sentence = sentenceAround(text, match.index);
      /* And a value inside a menu is an option, not something that happened.
         STEAL lists four things you might have lifted, one of which restores
         [[2d6 + 2*stat]] Health, and rolling that during the attack would put a
         number on the table for an outcome the player has not picked and will
         probably not get. It is the only card in the codex shaped this way, and
         the rule is here rather than an exception for it by name. */
      if (isMenuEntry(text, match.index)) continue;
      const kind = purposeOf(after, sentence);
      const link = {
        shape: 'value',
        kind,
        dice: resolved.dice,
        flat: resolved.flat,
        parts: resolved.parts,
        askVerdict: false,
        // Only damage has a type. Healing and a Shield are what they are.
        damage: kind === 'damage' ? damage : [],
      };

      /* A landing each, rather than one throw counted twice. Three d6 are not
         one d6 read three times, and each landing explodes on its own. */
      for (let i = 0; i < repeatsOf(sentence); i += 1) links.push({ ...link });
    }
  }

  return links;
}

/** Whether a card is going to ask for anything at all when it is played. */
export function rollsAnything(card, character, modifiers = null, options = {}) {
  return rollPlan(card, character, modifiers, options).length > 0;
}

/* --------------------------------------------------------------- the reading */

/**
 * Whether a value is an entry in a numbered list of options.
 *
 * "…whose value is below the number you rolled: 1: Healing Tonic · Restores
 * [[2d6 + 2*stat]] Health. 2: Poison · …". A menu has no full stops between its
 * entries, so the whole list reads as one sentence and the test is what sits
 * between the sentence starting and the dice: a bare "N:" is a list, not prose.
 */
function isMenuEntry(text, at) {
  const from = Math.max(text.lastIndexOf('.', at) + 1, text.lastIndexOf('\n', at) + 1);
  return /\b\d+\s*:\s*\S/.test(text.slice(from, at));
}

/** How many times the card lands this value. One unless its sentence says more. */
function repeatsOf(sentence) {
  for (const [pattern, times] of REPEATS) {
    if (pattern.test(sentence)) return times;
  }
  return 1;
}

/** What the dice are for: the word after them, then the sentence, then nothing. */
function purposeOf(after, sentence) {
  for (const [pattern, kind] of AFTER) {
    if (pattern.test(after)) return kind;
  }
  if (/\bdamage\b/i.test(sentence)) return 'damage';
  /* "healing [[1d6 + level]]" puts the word in front of the dice, which is why
     the sentence is asked at all: Bandage Roll is the one card in the codex that
     says what it is for before saying how much. */
  if (/\bhealing\b|\bheals?\b|\bHealth\b/i.test(sentence)) return 'healing';
  return 'roll';
}

/**
 * The sentence a token sits in, lowercased, for the two questions the word after
 * it cannot settle: whether a Roll is an Attack Roll, and what a bare handful of
 * dice is for.
 */
function sentenceAround(text, at) {
  const from = Math.max(
    text.lastIndexOf('.', at) + 1,
    text.lastIndexOf('\n', at) + 1
  );
  const dot = text.indexOf('.', at);
  return text.slice(from, dot < 0 ? text.length : dot + 1).toLowerCase();
}
