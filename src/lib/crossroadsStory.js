/**
 * The Crossroads, told as a story.
 *
 * A run of twelve answers used to be written into the backstory as twelve
 * sentences, one after another, which reads as a trace of what was clicked.
 * Jules, 2026-09-08: "instead of directly narrating the trace of players as
 * made, for each of the seven sections it takes all the choices and makes a
 * little summary like a narration, something that makes more like a short
 * story." So this is a narrator. It writes one paragraph for each chapter of
 * the life that was asked about, and a last one for who came out the other end.
 *
 * ---------------------------------------------------------------- a paragraph
 * Each chapter's paragraph is built from four things:
 *
 *   an opening    a line that starts the chapter, chosen from a couple of
 *                 variants so two stories do not start every paragraph alike
 *   the beats     what you did, one sentence an answer, from the question's
 *                 `recall` and the answer's `told`. The second beat onward is
 *                 led in with a connective, so four road answers read as a run
 *                 of events rather than a list
 *   a closing     the summary Jules asked for: what that chapter says about the
 *                 person. Childhood, Home, Youth and The Road close on the way
 *                 the chapter's answers leant (Physique, Instinct, Mind or a mix
 *                 of them). Blood closes on the lineage the whole run made,
 *                 Trade on the background and Leaving on the talent set taken
 *                 at level 1, so the paragraph names in its own words the thing
 *                 the count decided
 *   who you became  the last paragraph, composed from the lineage, the
 *                 background, the highest attribute and the two sets, each with
 *                 a phrase of its own here
 *
 * Every closing exists for every value it can be keyed on, and the checker
 * holds this file to that: a lineage, a background or a written set with no
 * sentence here would be a paragraph that ended without its point.
 *
 * ------------------------------------------------------------------- the voice
 * Past tense, addressed to the character as `you`, and it never names a rule,
 * a level or a number. A set or an ancestry is named only in the closing
 * sentences, and then as the thing it is in the world ("the tide in your
 * blood", "a Duelist's patience for the proper hour") rather than as a choice
 * on a sheet. docs/text-style.md applies to every word here, and to the
 * sentences these fragments compose into.
 */

import { STAGES } from './crossroadsPool.js';

/* --------------------------------------------------------------- the beats */

const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

/** One sentence of the story, from a step's question and its answer. */
export function sentenceOf(step) {
  const told = step.option.told ?? lowerFirst(step.option.label);
  return `${step.question.recall} ${told}`.trim();
}

/* Leads for the second beat onward. Each has to read before a recall that has
   had its first letter lowered: "Later, at a river too wide to jump, you". */
const JOINS = ['Later, ', 'And once, ', 'Another time, ', 'Not long after, '];

/* ---------------------------------------------------------------- the frames */

export const STAGE_FRAMES = {
  childhood: {
    opens: [
      'Nobody who knew you as a child is surprised by what you became.',
      'The first thing anyone remembers of you is small, and all of you is already in it.',
    ],
    closes: {
      physique: 'Even then, you met the world with your body first and worked out the rest afterwards.',
      instinct: 'Even then, you were the one who saw the gap before anyone else did and went through it.',
      mind: 'Even then, you were the one who stopped to understand a thing before you touched it.',
      mixed: 'Even then, nobody could say what you would do next, only that you would do something.',
    },
  },
  home: {
    opens: [
      'Home was a small place with large troubles, and you were not a child in it for long.',
      'Whatever else home taught you, it taught you that nobody else was coming.',
    ],
    closes: {
      physique: 'The family learned early that if something had to be stood in front of, you would be the one standing in front of it.',
      instinct: 'The family learned early that you noticed things, and that you were not always where they had left you.',
      mind: 'The family learned early to hand you the problems that needed thinking through, and to stop asking how you had solved them.',
      mixed: 'The family never quite knew what to make of you, and in the end stopped trying.',
    },
  },
  blood: {
    opens: [
      'There were moments when something in you showed, and you learned young not to explain them.',
      'Twice at least, the blood did the deciding before you could.',
    ],
    /* Closed on the lineage the run made. See LINEAGE_CLOSES. */
    closes: null,
  },
  youth: {
    opens: [
      'You grew up the way everyone does, one bad decision at a time.',
      'Then you were old enough to get into real trouble, and you did.',
    ],
    closes: {
      physique: 'By then the pattern was set: when something stood in your way, you went through it.',
      instinct: 'By then the pattern was set: you were quick, you were quiet and you were rarely where you were expected.',
      mind: 'By then the pattern was set: you looked, you understood and only then did you move.',
      mixed: 'By then people had stopped trying to predict you, which suited you.',
    },
  },
  trade: {
    opens: [
      'Then there was work, and the work made you.',
      'Grown, you needed a living. The living you found says most of what needs saying.',
    ],
    /* Closed on the background the run made. See BACKGROUND_CLOSES. */
    closes: null,
  },
  road: {
    opens: [
      'The road tested you more than once.',
      'Out on the road the tests came without warning, and did not wait for an answer.',
    ],
    closes: {
      physique: 'Every time the road asked, you answered with your feet planted and your hands ready.',
      instinct: 'Every time the road asked, you were already moving before the question was finished.',
      mind: 'Every time the road asked, you thought first, and it was the thinking that got you through.',
      mixed: 'The road asked in four different voices, and you did not answer in the same one twice. You were never only one thing.',
    },
  },
  leaving: {
    opens: ['Then came the last night.', 'Every life has a night it ends on, and yours had this one.'],
    /* Closed on the set taken at level 1. See TALENT_CLOSES. */
    closes: null,
  },
};

/** What the blood chapter says, once the run has decided whose blood it was. */
export const LINEAGE_CLOSES = {
  celestial: 'That was the light in you, though nobody in the family would have called it that.',
  infernal: 'That was the old bargain in you, still being paid in a currency nobody named.',
  fey: 'That was the glade in your blood, which has never once cared what was sensible.',
  scorchbound: 'That was the fire in you, which has never learned to fear the heat of anything.',
  skybound: 'That was the wind in you, which has never once been afraid of a height.',
  tidebound: 'That was the tide in your blood, which has never yet met a water it feared.',
  stonebound: 'That was the stone in you, which does not move when it is pushed.',
  draconic: 'That was the dragon in your blood, and it was not the last time it spoke for you.',
  stalwart: 'That was the hard country in your blood, which bred you to outlast things.',
  wildheart: 'That was the wild in you, which has always moved half a second ahead of your thoughts.',
  luminary: 'That was the long line of readers behind you, thinking with your hands.',
  undead: 'That was the curse in you, which keeps you standing when you should be lying down.',
  wildkin: 'That was the beast in your blood, and it has known you longer than you have known it.',
};

/** What the trade chapter says, once the run has decided what the trade was. */
export const BACKGROUND_CLOSES = {
  criminal: 'It was a thief’s answer, and it was a thief the trade made of you.',
  erudit: 'It was a scholar’s answer, and books were the trade that had you.',
  military: 'It was a soldier’s answer, and the regiment was the trade that had you.',
  outlander: 'It was a wanderer’s answer, and the road itself was the trade that had you.',
  craftsman: 'It was a maker’s answer, and the bench was the trade that had you.',
  entertainer: 'It was a performer’s answer, and the full room was the trade that had you.',
  merchant: 'It was a trader’s answer, and the ledger was the trade that had you.',
  aristocrat: 'It was an answer with a family name behind it, and the name was the trade that had you.',
  investigator: 'It was an answer that noticed things, and noticing was the trade that had you.',
  mercenary: 'It was a hired sword’s answer, and the contract was the trade that had you.',
};

/** What the leaving chapter says, once the run has decided what you left as. */
export const TALENT_CLOSES = {
  guardian: 'You have been standing between people and the dark ever since.',
  berserker: 'The anger came with you. It always has.',
  colossus: 'Whatever was too heavy for the doorway, you carried it out anyway, and you have carried it since.',
  trickster: 'Nobody saw you go, which is how you have preferred it since.',
  duelist: 'You left the way you do everything, properly and with a blade within reach.',
  'feral-curse': 'Something in you ran that night on more than two legs, and it has never quite come back.',
  mycomancer: 'The trees had been saying your name for years. That night you finally answered.',
  'cauldron-keeper': 'The cauldron came with you, and the herbs, and the jar of something that moved. Everything else could burn.',
  enchanter: 'You took with you the one thing you had made better than you found it, and the wish to do it again.',
  alchemist: 'The vials on your belt were full when you left, and you have kept them that way.',
  arcanist: 'You had the first words by then, and the road was where you meant to learn the rest.',
  'draconic-bond': 'The creature would not stay behind, and you did not ask it to.',
  pactbound: 'The debt came with you. It always does.',
};

/* ----------------------------------------------------------- who you became */

/** The trade as a noun for the last paragraph: "a Skybound thief". */
export const BACKGROUND_NOUNS = {
  criminal: 'thief',
  erudit: 'scholar',
  military: 'soldier',
  outlander: 'wanderer',
  craftsman: 'maker',
  entertainer: 'performer',
  merchant: 'trader',
  aristocrat: 'noble',
  investigator: 'finder of liars',
  mercenary: 'sword for hire',
};

/** The highest attribute, as the thing people see. None of these may begin
    with "with": the phrase after it does. */
export const ATTRIBUTE_PHRASES = {
  physique: 'built for the work of the arms',
  instinct: 'quick of hand and quicker of eye',
  mind: 'a head full of questions and most of the answers',
};

/** A set as the thing it is in the world, to follow "with". */
export const TALENT_PHRASES = {
  guardian: 'a Guardian’s habit of standing between people and the dark',
  berserker: 'a Berserker’s anger kept just under the skin',
  colossus: 'a Colossus’s reach and the weight to use it',
  trickster: 'a Trickster’s fingers and a way of not being where anyone looked',
  duelist: 'a Duelist’s patience for the proper hour',
  'feral-curse': 'the Feral Curse turning under the skin',
  mycomancer: 'a Mycomancer’s ear for what the trees say',
  'cauldron-keeper': 'a Cauldron Keeper’s herbs and jars',
  enchanter: 'an Enchanter’s eye for how a thing is made',
  alchemist: 'an Alchemist’s vials on the belt',
  arcanist: 'an Arcanist’s first words in the mouth',
  'draconic-bond': 'a creature at heel that would not be left behind',
  pactbound: 'a debt signed in something that was not ink',
};

const BECAME_OPENS = ['That is how', 'So it was that'];

/* ------------------------------------------------------------- composition */

/** A small, stable number from a run's question ids, for picking variants. */
function hashOf(steps) {
  let n = 0;
  for (const step of steps) {
    for (const char of step.question.id) n = (n * 31 + char.charCodeAt(0)) >>> 0;
  }
  return n;
}

/** The way a chapter's answers leant: one attribute, or 'mixed' on a tie. */
export function laneOf(steps) {
  const points = new Map();
  for (const step of steps) {
    for (const [key, n] of Object.entries(step.option?.gives?.attribute ?? {})) {
      points.set(key, (points.get(key) ?? 0) + (Number(n) || 0));
    }
  }
  const ranked = [...points.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return 'mixed';
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return 'mixed';
  return ranked[0][0];
}

/** "a" or "an", by the first letter of what follows. */
export function article(word) {
  return /^[aeiou]/i.test(String(word).trim()) ? 'an' : 'a';
}

/** Two phrases after "with", joined the way the style guide allows: a comma
    before the and only when one of the two carries an and of its own. */
function pair(first, second) {
  if (!second) return first;
  const nested = first.includes(' and ') || second.includes(' and ');
  return nested ? `${first}, and ${second}` : `${first} and ${second}`;
}

function closeFor(stageId, taken, outcome) {
  if (stageId === 'blood') {
    return LINEAGE_CLOSES[outcome.lineage?.id] ?? 'That was the blood showing, whatever the blood is.';
  }
  if (stageId === 'trade') {
    return BACKGROUND_CLOSES[outcome.background?.id] ?? 'It was the answer of the trade that had you.';
  }
  if (stageId === 'leaving') {
    return TALENT_CLOSES[outcome.talents?.[0]?.id] ?? 'The rest is the road.';
  }
  const frame = STAGE_FRAMES[stageId];
  return frame?.closes?.[laneOf(taken)] ?? frame?.closes?.mixed ?? '';
}

/** The last paragraph: the person the count made, said as a person. */
export function became(outcome, hash = 0) {
  const open = BECAME_OPENS[hash % BECAME_OPENS.length];
  const lineage = outcome.lineage?.name ?? 'drifter';
  const noun = BACKGROUND_NOUNS[outcome.background?.id] ?? 'drifter';
  const who = `${lineage} ${noun}`;
  const look = ATTRIBUTE_PHRASES[outcome.major] ?? 'ready for whatever came';
  const [first, second] = outcome.talents ?? [];
  const phrase = (talent) =>
    talent ? TALENT_PHRASES[talent.id] ?? `the beginnings of the ${talent.name}’s art` : null;
  const carried = first ? `, with ${pair(phrase(first), phrase(second))}` : '';
  return `${open} ${article(who)} ${who} came to the road: ${look}${carried}.`;
}

/**
 * The whole story: one paragraph a chapter answered, in the chapters' order,
 * and the last one for who you became. Each is `{ stage, title, text }`.
 */
export function narrate(steps, outcome) {
  const answered = steps.filter((step) => step.option);
  const hash = hashOf(answered);
  const paragraphs = [];

  for (const stage of STAGES) {
    const taken = answered.filter((step) => step.stage.id === stage.id);
    if (taken.length === 0) continue;

    const frame = STAGE_FRAMES[stage.id];
    const opens = frame?.opens ?? [];
    const open = opens.length ? opens[(hash + paragraphs.length) % opens.length] : '';

    const beats = taken.map((step, index) => {
      const sentence = sentenceOf(step);
      if (index === 0) return sentence;
      const lead = JOINS[(hash + index) % JOINS.length];
      return `${lead}${lowerFirst(sentence)}`;
    });

    const close = closeFor(stage.id, taken, outcome);
    paragraphs.push({
      stage: stage.id,
      title: stage.title,
      text: [open, ...beats, close].filter(Boolean).join(' '),
    });
  }

  paragraphs.push({ stage: 'became', title: 'Who you became', text: became(outcome, hash) });
  return paragraphs;
}
