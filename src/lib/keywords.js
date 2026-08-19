/**
 * The glossary — the words on a card that mean something exact.
 *
 * Exactly three things on a card are allowed to stand out from the prose, and
 * this file holds the third:
 *
 *   an attribute    Mind, Instinct, Physique, in that attribute's colour
 *   a damage type   Sharp, Decay, Force, in its own
 *   a keyword       a *defined term*. It wears its colour and answers what it
 *                   means when you point at it.
 *
 * Nothing else. The card bodies used to carry `**bold**` for emphasis as well
 * — distances, durations, the clause that mattered — and that emphasis was
 * removed from the codex outright, because a card with thirty emphasised
 * phrases has nothing emphasised at all. The renderer still understands the
 * marker, for cards a player types into their own Abilities tab, but no card
 * in this codex uses it. If you are tempted to bold something, either it is a
 * defined term and belongs in this file, or it is prose and belongs plain.
 *
 * A keyword is matched wherever it appears, so Willpower is violet every time
 * it is printed and never violet in one card and plain in the next. The
 * colours are the sheet's own: a resource keyword wears exactly the colour its
 * bar, orb or pip wears on the Character tab.
 *
 * ------------------------------------------------------------- writing cards
 * Because a keyword carries its own explanation, a card must NOT spell one out
 * in parentheses. Write "you gain advantage", never "you gain advantage (roll
 * twice and take the higher)" — the reader points at the word. If a term needs
 * explaining and is not in this file, the fix is to add it here, not to gloss
 * it in the card body.
 *
 * A term is lit wherever it appears, which cuts both ways: a card must not use
 * a defined word to mean an ordinary one. "Something critical" lit the
 * natural-20 rule, "give up the initiative" lit turn order, and a card naming
 * itself lit Armor inside Gore Armor and touch inside Vampiric Touch. All four
 * were reworded rather than exempted, because an exemption would have to be
 * remembered every time and a rewording never does.
 *
 * `detail` is a sentence or two, written to be read in a tooltip while
 * something else is happening at the table. Not rules lawyering — the shape of
 * the thing.
 *
 * `provisional: true` marks a term whose wording here is a best reading of what
 * the cards using it imply, rather than something transcribed from a rules
 * sheet. Every status carries it: the designer's General Rules workbook has a
 * Basic Abilities tab and no statuses tab yet, so these are placeholders that
 * read sensibly and are waiting to be corrected. Nothing renders differently
 * for it; it is a list of what still needs the designer's word.
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
  {
    id: 'poisoned',
    terms: ['poisoned'],
    color: 'var(--dmg-decay)',
    provisional: true,
    detail: 'Sickened by something in the blood. What it costs you is the designer’s to set.',
  },
  {
    id: 'rooted',
    terms: ['rooted'],
    color: 'var(--dmg-decay)',
    provisional: true,
    detail:
      'Held to the ground. You can still act and still attack, but you cannot move from where you stand.',
  },
  {
    id: 'asleep',
    terms: ['asleep'],
    color: 'var(--dmg-psychic)',
    detail:
      'Out cold, and unaware. Any damage wakes you, and so does an entity spending an action to shake you.',
  },
  {
    id: 'prone',
    terms: ['prone'],
    color: 'var(--stat-health)',
    provisional: true,
    detail: 'On the floor. Getting back up is the first thing your next turn pays for.',
  },
  {
    id: 'grappled',
    terms: ['grappled'],
    color: 'var(--stat-health)',
    provisional: true,
    detail: 'Held by somebody. You cannot move away while the grip lasts.',
  },
  {
    id: 'stunned',
    terms: ['stunned'],
    color: 'var(--dmg-lightning)',
    provisional: true,
    detail: 'Reeling. You take no actions until it passes.',
  },
  {
    id: 'incapacitated',
    terms: ['incapacitated'],
    color: 'var(--stat-health)',
    provisional: true,
    detail: 'Present but unable to act. You take no actions and no reactions.',
  },
  {
    id: 'unconscious',
    terms: ['unconscious'],
    color: 'var(--stat-health)',
    provisional: true,
    detail: 'Down and unaware. You act at all only once somebody brings you round.',
  },
  {
    id: 'dying',
    terms: ['dying'],
    color: 'var(--stat-health)',
    detail:
      'Below 0 Health and going. Stabilize stops it, and a second full bar of damage ends it.',
  },

  /* ------------------------------------------------------------- distances
   * The two ranges the cards name instead of a number. Everything else prints
   * its metres, so these are the only two a reader has to be told.
   */
  {
    id: 'touch',
    terms: ['touch'],
    color: 'var(--focus-cyan)',
    detail:
      'Close enough to put a hand on. The shortest range there is: you have to be right beside what you are targeting.',
  },
  {
    id: 'reach',
    terms: ['reach'],
    color: 'var(--focus-cyan)',
    detail:
      'As far as you can strike without moving your feet. Yours unless the thing in your hands says otherwise.',
  },
  {
    id: 'line-of-sight',
    terms: ['line of sight'],
    color: 'var(--focus-cyan)',
    detail: 'An unbroken view of the target. Total cover breaks it, and so does darkness.',
  },
  {
    id: 'total-cover',
    terms: ['total cover'],
    color: 'var(--focus-cyan)',
    detail: 'Something solid entirely between you and it. Nothing that needs to see it can reach it.',
  },

  /* ---------------------------------------------------------- when it happens
   * The two moments a card can hang an effect on. Both are named on cards that
   * tick, and neither means "some time during your turn".
   */
  {
    id: 'turn-start',
    terms: ['Turn Start'],
    color: 'var(--stat-ap)',
    detail:
      'The moment your turn opens, before you have spent anything. Upkeeps are paid here and effects that tick, tick here.',
  },
  {
    id: 'turn-end',
    terms: ['Turn End'],
    color: 'var(--stat-ap)',
    detail: 'The moment your turn closes, after everything you chose to do with it.',
  },

  /* -------------------------------------------------------------- the riders
   * The optional second half a card can carry. The names are the designer's
   * and they mean four different things, which is exactly why they are terms.
   */
  {
    id: 'overcast',
    terms: ['Overcast'],
    color: 'var(--haze-glow)',
    detail: 'Spend more than the spell asks to make it do more. Always optional, always your call.',
  },
  {
    id: 'multicast',
    terms: ['Multicast'],
    color: 'var(--haze-glow)',
    detail: 'Spend more than the spell asks to catch more targets with it.',
  },
  {
    id: 'upkeep',
    terms: ['Upkeep'],
    color: 'var(--haze-glow)',
    detail:
      'A toll paid at every Turn Start to keep a spell running. Miss one and the spell ends there.',
  },
  {
    id: 'blood-tithe',
    terms: ['Blood Tithe'],
    color: 'var(--stat-health)',
    detail:
      'A price paid in Health rather than Willpower, and always in Physique whatever you cast with.',
  },
  {
    id: 'elevated',
    terms: ['elevates', 'elevated', 'elevate'],
    color: 'var(--level-amber)',
    provisional: true,
    detail: 'Cast as though the spell were a step stronger than it is.',
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
