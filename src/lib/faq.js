/**
 * The questions people actually ask, and the honest answers.
 *
 * It is data rather than markup because two pages render it: the accordion at
 * the bottom of the landing page and the whole document at /faq. One copy of
 * the words means the front page can never promise something the FAQ denies.
 *
 * ------------------------------------------------------------------- the voice
 * These answers are the only place on the site that says "I". Everywhere else
 * the reader is `you` and the app never speaks about itself (see
 * docs/text-style.md), but a question like "who makes this" has one truthful
 * answer and it is a person. The legal pages say "we" because a company is the
 * party to a contract. This page is not a contract.
 *
 * ------------------------------------------------------------------- the art
 * The art answer is the one to keep truthful as things change. There *is* art
 * in public/cards, and `CAPABILITIES.art` in src/lib/tiers.js currently shows
 * it to `friend` and above only, which is to say almost nobody. When the codex
 * is finished and that gate moves, this answer has to move with it.
 */

/** Where feedback goes. Also the only support channel worth naming. */
export const DISCORD_INVITE = 'https://discord.gg/GQY2Ym8vDd';

/**
 * `q` is the question as somebody would ask it. `a` is an array of paragraphs
 * rather than one string, so both renderers break them the same way.
 *
 * Order is by what a first-time reader wants first, not by what is most
 * interesting to write. What it is, then how to try it, then the two questions
 * about money and pictures that people are too polite to ask.
 */
export const FAQ = [
  {
    id: 'what',
    q: 'What is Hazebound?',
    a: [
      'A tabletop roleplaying game, and this site is the character sheet for it. Every roll is two six-sided dice plus one of your three attributes, compared to a difficulty. Every ability is a card that says what it costs, how far it reaches and what it does, with your own numbers already worked into it.',
      'The whole rulebook is on this site and free to read. So is the sheet.',
    ],
  },
  {
    id: 'account',
    q: 'Do I need an account to try it?',
    a: [
      'No. Open the Characters page and make one. It is saved in your own browser, it opens on the full sheet and it plays exactly as a saved character does.',
      'What it cannot do is follow you to another device or sit at a table, because nothing about it ever leaves your browser. A free account gives it both of those, and everything you have already made comes across with it.',
    ],
  },
  {
    id: 'art',
    q: 'Is the game illustrated?',
    a: [
      'Not properly, not yet. There is art on the cards, but it is a stand-in until the real thing is drawn, and that is why it is switched off for almost every account. A subscription does not turn it on either. I am not willing to sell pictures that are not finished.',
      'Commissioning an artist to draw the game properly is what all of this is pointed at.',
    ],
  },
  {
    id: 'money',
    q: 'What does the subscription pay for?',
    a: [
      'The database and the host, first. Both send a bill every month and the site goes dark if it is not paid.',
      'After that, the time to keep building: the parts of the system that are not finished and the tools a Game Master still does not have. Past that it goes towards an artist, which is the one job on the list I cannot do myself.',
      'That is the whole of it. There is no advertising here and nothing about you is sold to anybody.',
    ],
  },
  {
    id: 'book',
    q: 'Will there be a book?',
    a: [
      'That is where this is going, once the system is complete enough to be worth printing. A book with the art in it, and beside it a set of printable cards and character sheets drawn to use as little ink as possible, so a table that would rather play on paper can.',
      'No date on it. It happens when the rules stop moving.',
    ],
  },
  {
    id: 'playtest',
    q: 'Is the game finished?',
    a: [
      'No, and the front page says so. Hazebound is in open playtest: rules change between sessions, and a change to a rule can change what your sheet works out. Nothing you have made is ever deleted for it, but a number on it can move.',
      'That is the trade for playing it now. What you find is what fixes it.',
    ],
  },
  {
    id: 'who',
    q: 'Who makes this?',
    a: [
      'I do. Hazebound started in person in 2022, at a real table with my own players, and it has been rebuilt more times than I want to count since. When the group moved online the sheet had to move with it, and that is what this site is.',
      'I write it myself, with Claude helping on the code. It is a passion project rather than a company, and it is nobody\u2019s day job.',
    ],
  },
  {
    id: 'feedback',
    q: 'Where do I send feedback?',
    a: [
      'The Discord, linked below. It is the fastest way to reach me, and a card that reads wrong or a rule that fell apart at your table is exactly what I want to hear about.',
      'Play it, break it and tell me what happened.',
    ],
  },
];
