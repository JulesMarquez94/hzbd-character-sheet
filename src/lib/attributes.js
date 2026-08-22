/**
 * Attributes — the three numbers the rest of the sheet is built out of.
 *
 * Every attribute starts at 4, and advancement is the only thing that moves
 * them: level 1 hands out a +2 and a +1 on two different attributes, and every
 * odd level after that hands out a single +1. This file is the vocabulary —
 * what the three are, where they start, and what the boosts are worth. Which
 * one a character actually put them on is the level ledger's business, in
 * levelPicks.js, so this stays a leaf that anything may import.
 */

/** Where every attribute stands before advancement spends anything on it. */
export const ATTRIBUTE_BASE = 4;

/**
 * The three, in the order they are printed everywhere on the sheet. `info` is
 * the tooltip the Character tab shows on each tile — it lives here so the two
 * tabs can never drift apart on what an attribute is for, and `buys` is the
 * shorter line the chooser prints under a boost.
 */
export const ATTRIBUTES = [
  {
    key: 'physique',
    label: 'Physique',
    color: 'var(--attr-physique)',
    info: 'Strength and fitness. Raises Health and boosts damage from heavy weapons like two-handed maces.',
    buys: '10 Health a point, and the damage of anything heavy.',
  },
  {
    key: 'instinct',
    label: 'Instinct',
    color: 'var(--attr-instinct)',
    info: 'Awareness of your surroundings and spirit. Boosts weapons like pistols, and raises Movement Speed and Initiative.',
    buys: 'Defense, Initiative and Speed, and the damage of anything quick.',
  },
  {
    key: 'mind',
    label: 'Mind',
    color: 'var(--attr-mind)',
    info: 'Raw intelligence. Boosts spellcasting and magic weapons, and raises Magic Burden capacity and Willpower.',
    buys: '2 Willpower a point, and the damage of anything cast.',
  },
];

export const ATTRIBUTE_KEYS = ATTRIBUTES.map((attribute) => attribute.key);

/**
 * The two boosts level 1 hands out, biggest first. `slot` is what each is
 * stored under, so the panel, the chooser and the record all name them the
 * same way — and they must land on two *different* attributes, which is what
 * makes a finished level-1 spread read 6 / 5 / 4 and never 7 / 4 / 4.
 */
export const BOOSTS = [
  { slot: 'major', bonus: 2, label: 'The +2', note: 'one attribute, raised to 6' },
  { slot: 'minor', bonus: 1, label: 'The +1', note: 'a different one, raised to 5' },
];

export function getAttribute(key) {
  return ATTRIBUTES.find((attribute) => attribute.key === key) ?? null;
}

export function attributeLabel(key) {
  return getAttribute(key)?.label ?? '';
}

/** A blank set of three, every one at base. */
export function baseValues() {
  const values = {};
  for (const key of ATTRIBUTE_KEYS) values[key] = ATTRIBUTE_BASE;
  return values;
}

/* ------------------------------------------------------------ the highest
 * Some cards do not name an attribute, they name a rule: "this spell uses your
 * highest Attribute". Six lineage traits, three skills and a Dragon Breath say
 * it, and every spell those Innate cards hand over inherits it.
 *
 * `HIGHEST` is the word they carry instead of a key. It is not a fourth
 * attribute and nothing on a sheet ever holds a value for it: it is an
 * instruction, resolved against whoever is holding the card at the moment the
 * card is printed. See castStat in cardText.js, which is where that happens.
 */
export const HIGHEST = 'highest';

/**
 * Which of the three this character stands highest in, as a key.
 *
 * Read off the same numbers a card resolves its values against, so the
 * attribute named on the card and the number beside it can never disagree: on
 * the sheet those are the bent totals (see liveCharacter in characterModel.js),
 * with every worn and running bonus already in them.
 *
 * **A tie goes to the printed order**, Physique then Instinct then Mind. Two
 * attributes at 6 roll the same 6 whichever is named, so the tie decides a word
 * and not a number, and a 6/6/4 spread is common enough that leaving it to
 * chance would mean a card that changes its mind between renders.
 */
export function highestAttribute(values) {
  let best = ATTRIBUTE_KEYS[0];
  for (const key of ATTRIBUTE_KEYS) {
    if ((Number(values?.[key]) || 0) > (Number(values?.[best]) || 0)) best = key;
  }
  return best;
}
