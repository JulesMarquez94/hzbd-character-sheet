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
