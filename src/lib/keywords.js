/**
 * The glossary — the words on a card that mean something exact.
 *
 * A printed card emphasises a lot of things: distances, conditions, the clause
 * that matters. On screen that emphasis was doing two jobs at once and doing
 * neither well, so they are now split:
 *
 *   **bold**   is emphasis. It says "this clause is the important one" and
 *              nothing more — quiet, uncoloured, the printed weight.
 *   a keyword  is a *defined term*. It wears its own colour and answers what it
 *              means when you point at it.
 *
 * Only the second is highlighted, which is what makes highlighting worth
 * anything: three coloured words on a card are read, thirty are wallpaper.
 *
 * A keyword is matched wherever it appears — inside bold or out — so Willpower
 * is violet every time it is printed, and never violet in one card and plain in
 * the next. The colours are the sheet's own: a resource keyword wears exactly
 * the colour its bar, orb or pip wears on the Character tab.
 *
 * ------------------------------------------------------------- writing cards
 * Because a keyword now carries its own explanation, a card must NOT spell one
 * out in parentheses. Write "you gain **advantage**", never "you gain advantage
 * (roll twice and take the higher)" — the reader points at the word. If a term
 * needs explaining and is not in this file, the fix is to add it here, not to
 * gloss it in the card body.
 *
 * `detail` is a sentence or two, written to be read in a tooltip while
 * something else is happening at the table. Not rules lawyering — the shape of
 * the thing.
 */

/**
 * `terms` are the printed forms, matched whole-word and case-insensitively, so
 * one entry covers "Long Rest" and "long rest". List plurals explicitly rather
 * than guessing at suffixes.
 */
export const KEYWORDS = [
  /* ---------------------------------------------------------- what you spend */
  {
    id: 'willpower',
    terms: ['Willpower'],
    color: 'var(--stat-wp)',
    detail:
      'Your reserve of nerve and focus. Spent to power abilities and to bend rolls in your favour. Comes back on a Long Rest.',
  },
  {
    id: 'action-point',
    terms: ['Action Points', 'Action Point'],
    color: 'var(--stat-ap)',
    detail:
      'What a turn is made of. Every action costs some, and you get six back at the start of each of your turns.',
  },
  {
    id: 'reaction-point',
    terms: ['Reaction Points', 'Reaction Point'],
    color: 'var(--stat-rp)',
    detail:
      'Earned during a round and spent outside your own turn. A reaction can be paid from these instead of your Action Points.',
  },
  {
    id: 'reaction',
    terms: ['reaction'],
    color: 'var(--stat-rp)',
    detail:
      'Something you do on somebody else’s turn, in answer to what they did. Costs the same as it would on your turn — you just pay it from a different pool.',
  },
  {
    id: 'karma',
    terms: ['Karma'],
    color: 'var(--stat-karma)',
    detail: 'Spend 1 after seeing a die result to add 1d4 to it.',
  },
  {
    id: 'supplies',
    terms: ['Supplies'],
    color: 'var(--stat-supply)',
    detail:
      'The crate you travel on — rations, powder, reagents, rope. Spent on the road and on anything crafted during a rest.',
  },
  {
    id: 'coins',
    terms: ['Coins'],
    color: 'var(--stat-coin)',
    detail: 'Money. What you spend on people rather than on the road.',
  },

  /* ------------------------------------------------------ what keeps you up */
  {
    id: 'health',
    terms: ['Health'],
    color: 'var(--stat-health)',
    detail:
      'How much you have left. Past zero you are bleeding out, and a second full bar of damage kills you outright.',
  },
  {
    id: 'shield',
    terms: ['Shield'],
    color: 'var(--stat-shield)',
    detail:
      'Damage soaked before it reaches Health. Caps at half your maximum Health, and whatever it cannot absorb carries straight through.',
  },
  {
    id: 'bleeding-out',
    terms: ['bleeding out'],
    color: 'var(--stat-health)',
    detail:
      'At 0 Health or below. You are still on the table, and a second full bar of damage is death.',
  },

  /* ------------------------------------------------------ the six defences */
  {
    id: 'defense',
    terms: ['Defense'],
    color: 'var(--focus-cyan)',
    detail: 'How hard you are to hit. Every attack is rolled against it.',
  },
  {
    id: 'armor',
    terms: ['Armor'],
    color: 'var(--stat-armor)',
    detail: 'Flat damage reduction, taken off every hit that lands. It comes from gear alone.',
  },
  {
    id: 'reflex',
    terms: ['Reflex'],
    color: 'var(--stat-rp)',
    detail:
      'How fast you answer sudden danger — diving clear of a blast. Physique + Instinct.',
  },
  {
    id: 'grit',
    terms: ['Grit'],
    color: 'var(--stat-wp)',
    detail:
      'How well you withstand what gets inside you — poison, fear, a mental attack. Instinct + Mind.',
  },
  {
    id: 'initiative',
    terms: ['Initiative'],
    color: 'var(--stat-init)',
    detail: 'Added to your roll for turn order when a fight starts.',
  },
  {
    id: 'movement-speed',
    terms: ['Movement Speed'],
    color: 'var(--stat-speed)',
    detail: 'How far one Move action carries you, and how far you jump.',
  },

  /* ------------------------------------------------- what happens to a roll */
  {
    id: 'advantage',
    terms: ['advantage'],
    color: 'var(--def-healing)',
    detail: 'Roll the die twice and keep the higher result.',
  },
  {
    id: 'disadvantage',
    terms: ['disadvantage'],
    color: 'var(--stat-health)',
    detail: 'Roll the die twice and keep the lower result.',
  },
  {
    id: 'reroll',
    terms: ['reroll'],
    color: 'var(--copper)',
    detail: 'Roll the same check again and take the new result, whether it is better or worse.',
  },
  {
    id: 'skill-check',
    terms: ['skill check', 'skill checks'],
    color: 'var(--copper)',
    detail:
      'A roll against a difficulty the table sets, for anything that is not an attack. You add the attribute it calls on.',
  },
  {
    id: 'contested-roll',
    terms: ['contested rolls', 'contested roll'],
    color: 'var(--copper)',
    detail: 'Both sides roll and the higher result wins.',
  },
  {
    id: 'empowered',
    terms: ['Empowered'],
    color: 'var(--level-amber)',
    detail:
      'Every damage die steps up a category — a d6 becomes a d8. No die may pass a d12.',
  },
  {
    id: 'critical',
    terms: ['critical'],
    color: 'var(--level-amber)',
    detail: 'A natural 20 on the die. It lands however high the target’s Defense is.',
  },

  /* --------------------------------------------------------- what you swing */
  {
    id: 'melee-attack',
    terms: ['Melee Attack'],
    color: 'var(--dmg-sharp)',
    detail: 'An attack made within reach, rolled against the target’s Defense.',
  },
  {
    id: 'ranged-attack',
    terms: ['Ranged Attack'],
    color: 'var(--dmg-sharp)',
    detail: 'An attack made at distance, rolled against the target’s Defense.',
  },
  {
    id: 'weapon-attack',
    terms: ['weapon attack', 'weapon attacks'],
    color: 'var(--dmg-sharp)',
    detail: 'Either of the two attacks the weapon in your hands teaches you.',
  },
  {
    id: 'martial-move',
    terms: ['Martial Moves', 'Martial Move'],
    color: 'var(--level-amber)',
    detail:
      'A trained manoeuvre bought with a talent, used alongside a weapon attack rather than instead of one.',
  },

  /* ------------------------------------------------------------ the clock */
  {
    id: 'long-rest',
    terms: ['Long Rest'],
    color: 'var(--copper)',
    detail:
      'A full night stopped. Pools come back, and anything crafted or tended is done across it.',
  },
  {
    id: 'short-rest',
    terms: ['Short Rest'],
    color: 'var(--copper)',
    detail: 'A breather in the field — enough to catch some of what you have spent, not all of it.',
  },

  /* ------------------------------------------------------------ the world */
  {
    id: 'entity',
    terms: ['entity', 'entities'],
    color: 'var(--text-silver)',
    detail: 'Anything that can be targeted — a person, a beast, a construct, a thing that is awake.',
  },
  {
    id: 'magic-burden',
    terms: ['Magic Burden'],
    color: 'var(--haze-glow)',
    detail:
      'How much worked magic you can carry before it starts to weigh. Capacity is Level + Mind + 10.',
  },

  /* ------------------------------------------------------------- statuses
   * The game has barely any yet. When it gets them they go here — one entry
   * each — and every card that names one lights up without being rewritten.
   */
  {
    id: 'marked',
    terms: ['marked'],
    color: 'var(--dmg-psychic)',
    detail: 'Singled out. Whoever marked it knows where it is and hits it more easily.',
  },
];

/* ------------------------------------------------------------ the matcher */

/**
 * One alternation over every printed form, longest first so that "Reaction
 * Point" is never eaten by "reaction", and "skill checks" never by "skill
 * check". Word-anchored, so "advantage" cannot fire inside "disadvantage".
 */
const ENTRIES = KEYWORDS.flatMap((keyword) =>
  keyword.terms.map((term) => ({ term, keyword }))
).sort((a, b) => b.term.length - a.term.length);

const BY_TERM = new Map(ENTRIES.map(({ term, keyword }) => [term.toLowerCase(), keyword]));

/**
 * Every printed form is plain letters and spaces, so none of them needs regex
 * escaping — keep it that way. A keyword is a word.
 */
const SOURCE = `\\b(${ENTRIES.map(({ term }) => term).join("|")})\\b`;

/** A fresh regex each call — a shared one carries `lastIndex` between splits. */
export function keywordPattern() {
  return new RegExp(SOURCE, 'gi');
}

/** The keyword a matched run of text names, or null when it names none. */
export function getKeyword(text) {
  return BY_TERM.get(String(text ?? '').toLowerCase()) ?? null;
}
