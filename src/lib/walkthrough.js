/**
 * The Walkthrough: making a character one choice at a time, with the rules
 * beside each one.
 *
 * The third of the four ways in (see creationPaths.js), and the one for a first
 * character. It asks the same four level-1 questions the free hand asks, in a
 * fixed order and one screen at a time, and every screen explains two things
 * before it asks: what the rule is, and how the panel that makes the choice
 * works. The panels are the level-1 block's own, so what somebody learns here
 * is the Advancement tab they will be handed at the end.
 *
 * ------------------------------------------------------------------ the order
 * Attributes first, then the talent set, then lineage, then background. That is
 * not the order the level-1 block prints them in (talent, lineage, background,
 * attributes), and it is deliberate: the three attributes are what every other
 * number is built from, so they are the first lesson, and the talent wall is
 * shelved by attribute, so a player who has placed their +2 already knows which
 * shelf to read first. The set decides what the character can do, the lineage
 * what they are, the background what they did. The story has no rules attached
 * and comes after the rules, and the last step reads the finished sheet back
 * before it opens.
 *
 * --------------------------------------------------------------- the progress
 * Jules, 2026-09-12: "if the player leave in the middle of it i save the
 * progress so they can continue later."
 *
 * Every choice is already written to the row the moment it is made; what was
 * not written anywhere was *where you were*. The Crossroads keeps its run in
 * sessionStorage, which survives a refresh and nothing else. This path keeps
 * its place on the row instead, in the `creation` column:
 *
 *     creation: { path: 'guided', step: 'talent', ts }
 *
 * so a walkthrough begun on a laptop can be picked up on a phone, and the
 * dashboard card can say which step it is on and offer to go back to it. The
 * record is a *state of the character*, half-made and here is where it stopped,
 * which is why it is on the row where the path itself (how you got here, and
 * not something the character is) rides in the URL. Finishing any way in clears
 * it: see `onDone` in CharacterSheet.jsx.
 *
 * The step is stored by key rather than by index, so a step added or moved
 * later does not send anybody back to the wrong screen. A key nothing here
 * recognises reads as the first step.
 *
 * ---------------------------------------------------------------- what is done
 * Nothing here decides whether a choice is made. `levelAsks` in levelPicks.js
 * is the one list of what level 1 asks and what has been answered, and each
 * step below names the kinds of row it owns. The rail, the summary and the way
 * out all read that list, so this screen can never disagree with the tab badge
 * about whether a character is finished.
 *
 * ---------------------------------------------------------------- the rulebook
 * Every step points at the rules it teaches, by section and heading id in
 * docs/rulebook.md. `rulebook.js` slugs a heading the same way the Rules page
 * does, so `1-1-the-roll` is where `/rules/rulebook#1-1-the-roll` lands.
 * scripts/check-walkthrough.mjs holds every reference to a heading that exists,
 * because a renamed heading would otherwise leave a link pointing at nothing.
 */

import { creationPath } from './creationPaths.js';
import { backgroundState } from './backgrounds.js';
import { levelAsks, levelPicksState } from './levelPicks.js';
import { advancementState } from './talents.js';

/** The key the chooser and the URL know this path by. See creationPaths.js. */
export const WALKTHROUGH_PATH = 'guided';

/** The only level this path makes, and the one its panels are drawn at. */
export const WALKTHROUGH_LEVEL = 1;

/**
 * The seven steps, in the order they are walked.
 *
 *   key        stored on the row as the place somebody stopped
 *   title      the pill on the rail and the heading in the summary
 *   line       the one line under the character's name while the step is up
 *   asks       which kinds of `levelAsks` row this step answers, by kind
 *   talentAsks whether the rows a talent set leaves behind it (a hand to deal,
 *              a creature to name) belong to this step as well
 *   optional   a step with nothing to answer, said on the rail
 *   rules      where in the rulebook the step's lessons are written out in full
 */
export const STEPS = [
  {
    key: 'begin',
    title: 'How it works',
    line: 'The roll, the cards and what they cost.',
    asks: [],
    rules: [
      { section: 'chapter-one', rule: '1-1-the-roll', label: '1.1 The roll' },
      {
        section: 'chapter-one',
        rule: '1-2-the-three-kinds-of-roll',
        label: '1.2 The three kinds of roll',
      },
      {
        section: 'chapter-two',
        rule: '2-5-action-points-and-reaction-points',
        label: '2.5 Action Points and Reaction Points',
      },
    ],
  },
  {
    key: 'attributes',
    title: 'Attributes',
    line: 'Three numbers everything else is built from.',
    asks: ['boosts'],
    rules: [
      { section: 'chapter-two', rule: '2-1-the-three-attributes', label: '2.1 The three attributes' },
      {
        section: 'chapter-two',
        rule: '2-2-what-the-attributes-buy',
        label: '2.2 What the attributes buy',
      },
      { section: 'chapter-four', rule: '4-6-attributes', label: '4.6 Attributes' },
    ],
  },
  {
    key: 'talent',
    title: 'Talent set',
    line: 'What your character can do.',
    asks: ['talent'],
    talentAsks: true,
    rules: [
      { section: 'chapter-four', rule: '4-5-talent-set', label: '4.5 Talent set' },
      { section: 'chapter-three', rule: '3-3-talent-ranks', label: '3.3 Talent ranks' },
      { section: 'chapter-three', rule: '3-2-what-a-level-grants', label: '3.2 What a level grants' },
    ],
  },
  {
    key: 'lineage',
    title: 'Lineage',
    line: 'The blood your character comes from.',
    asks: ['lineage'],
    rules: [{ section: 'chapter-four', rule: '4-3-lineage', label: '4.3 Lineage' }],
  },
  {
    key: 'background',
    title: 'Background',
    line: 'The life before this one, and what it left you.',
    asks: ['background'],
    rules: [
      { section: 'chapter-four', rule: '4-4-background', label: '4.4 Background' },
      { section: 'chapter-seven', rule: '7-7-supplies', label: '7.7 Supplies' },
      { section: 'chapter-seven', rule: '7-6-money', label: '7.6 Money' },
    ],
  },
  {
    key: 'story',
    title: 'Their story',
    line: 'The part the rules cannot roll for.',
    asks: [],
    optional: true,
    rules: [{ section: 'chapter-four', rule: '4-7-their-story', label: '4.7 Their story' }],
  },
  {
    key: 'sheet',
    title: 'Your sheet',
    line: 'Where everything you chose now lives.',
    asks: [],
    rules: [
      { section: 'chapter-four', rule: '4-8-ready-to-play', label: '4.8 Ready to play' },
      { section: 'chapter-eight', rule: null, label: 'Chapter Eight · Rest and Downtime' },
    ],
  },
];

/** Where a step stands in the walk. An unknown key is the first step. */
export function stepIndex(key) {
  const at = STEPS.findIndex((step) => step.key === key);
  return at === -1 ? 0 : at;
}

/** The address of one rulebook reference, on the Rules page. */
export function ruleHref(ref) {
  return `/rules/rulebook#${ref.rule ?? ref.section}`;
}

/* ------------------------------------------------------------- the progress */

/**
 * A stored progress record, held to its shape.
 *
 * The column is jsonb and may arrive as a string, as nothing, or as whatever an
 * older build wrote. Anything that is not an object naming a path reads as no
 * record, which is a character nobody is mid-way through making.
 */
export function normalizeCreation(value) {
  let record = value;
  if (typeof record === 'string') {
    try {
      record = JSON.parse(record);
    } catch {
      record = null;
    }
  }
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  if (typeof record.path !== 'string' || !record.path) return null;

  return {
    path: record.path,
    step: typeof record.step === 'string' ? record.step : null,
    ts: typeof record.ts === 'string' ? record.ts : null,
  };
}

/** The record that says somebody is on this step of this path. */
export function progressOf(key) {
  return { path: WALKTHROUGH_PATH, step: STEPS[stepIndex(key)].key, ts: new Date().toISOString() };
}

/** The step key this path last stored on a row, or null when it stored none. */
export function storedStep(character) {
  const record = normalizeCreation(character?.creation);
  return record?.path === WALKTHROUGH_PATH ? record.step : null;
}

/**
 * Where a character stands in an unfinished walkthrough, for the dashboard card
 * that offers to go back to it. Null for everybody who is not mid-way through
 * one, which is nearly everybody.
 */
export function standing(character) {
  const record = normalizeCreation(character?.creation);
  if (!record || record.path !== WALKTHROUGH_PATH) return null;

  const index = stepIndex(record.step);
  return {
    path: WALKTHROUGH_PATH,
    title: creationPath(WALKTHROUGH_PATH).title,
    key: STEPS[index].key,
    step: STEPS[index],
    index,
    total: STEPS.length,
  };
}

/* ------------------------------------------------------------ what is done */

/**
 * Everything the level-1 panels are drawn from, read once for the whole screen:
 * the talent slots, the level ledger and the background, and the list of what
 * level 1 asks. The same three the level block on the Advancement tab derives
 * before it draws its panels. See LevelLedger.jsx.
 */
export function levelOneState(character) {
  const talents = advancementState(character?.talents, WALKTHROUGH_LEVEL);
  const picks = levelPicksState(character, WALKTHROUGH_LEVEL);
  const background = backgroundState(character);
  const asks = levelAsks(character, WALKTHROUGH_LEVEL, { talents, picks, background });
  return { talents, picks, background, asks };
}

/**
 * Each step against what level 1 asks: the rows it owns, how many of them are
 * still open, and whether it is finished. A step that owns no row is never done
 * and never open; it is a lesson, and the rail draws it without a mark.
 *
 * `state` is `levelOneState`'s, handed in so a screen that already derived it
 * does not derive it twice.
 */
export function walkthroughProgress(character, state = null) {
  const { asks } = state ?? levelOneState(character);

  return STEPS.map((step) => {
    const rows = asks.filter(
      (row) => step.asks.includes(row.kind) || (step.talentAsks && Boolean(row.talent))
    );
    const open = rows.filter((row) => !row.answered).length;
    return {
      step,
      rows,
      open,
      asked: rows.length > 0,
      done: rows.length > 0 && open === 0,
    };
  });
}

/**
 * The steps still waiting on an answer, oldest first, for the way out to name
 * and the summary to point back at.
 */
export function stepsWaiting(character, state = null) {
  return walkthroughProgress(character, state).filter((entry) => entry.open > 0);
}
