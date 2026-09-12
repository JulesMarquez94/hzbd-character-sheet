/**
 * The Walkthrough, held to the three things that can go quietly wrong with it.
 *
 * A lesson points at the rulebook by heading id, and a heading renamed in
 * docs/rulebook.md would leave a link landing on nothing. A step owns the kinds
 * of question it answers, and a kind nobody owns would be a question the rail
 * never ticks and the way out still waits on. And the bookmark the walk leaves
 * on the row has to read back as the step it was written for, whatever a
 * database or an older build hands back.
 *
 *   node scripts/check-walkthrough.mjs        report and exit 1 on any finding
 *   node scripts/check-walkthrough.mjs --list print every case, then exit 0
 *
 * The last section makes a whole level-1 character through the same functions
 * the panels write with, and asserts the walk calls it finished. That is the
 * one place this screen and the Advancement tab could disagree, and they read
 * the same list on purpose; this is the proof that they do.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  STEPS,
  WALKTHROUGH_LEVEL,
  WALKTHROUGH_PATH,
  levelOneState,
  normalizeCreation,
  progressOf,
  ruleHref,
  standing,
  stepIndex,
  stepsWaiting,
  storedStep,
  walkthroughProgress,
} from '../src/lib/walkthrough.js';
import { CREATION_PATHS } from '../src/lib/creationPaths.js';
import { BLANK_CHARACTER } from '../src/lib/characterModel.js';
import { BACKGROUNDS, skillPicks, takeSkill } from '../src/lib/backgrounds.js';
import { armorSetOptions, startingWeapons } from '../src/lib/items.js';
import { buildKitPatch } from '../src/lib/kit.js';
import { openChoices, setBoosts, setLineage } from '../src/lib/levelPicks.js';
import { LINEAGES, lineageCards, openPicks } from '../src/lib/lineages.js';
import { TALENTS, chooseAt } from '../src/lib/talents.js';

const LIST = process.argv.includes('--list');
const findings = [];

function check(what, got, want) {
  const same = JSON.stringify(got) === JSON.stringify(want);
  if (LIST) console.log(`  ${same ? 'ok  ' : 'FAIL'} ${what}${same ? '' : `  got ${JSON.stringify(got)}`}`);
  if (!same) findings.push({ what, got, want });
}

function section(title) {
  if (LIST) console.log(`\n===== ${title} =====`);
}

/* ------------------------------------------------------------- the rulebook */

/* The same slug rulebook.js cuts a heading down to, restated here rather than
   imported: rulebook.js reads the book through a `?raw` import, which is Vite's
   and not Node's. */
function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function sectionId(text) {
  const chapter = /^Chapter\s+(\S+)\s+·\s+(.+)$/.exec(text);
  if (chapter) return `chapter-${slug(chapter[1])}`;
  const appendix = /^Appendix\s+(\S+)\s+·\s+(.+)$/.exec(text);
  if (appendix) return `appendix-${slug(appendix[1])}`;
  return slug(text);
}

/** Every `##` section of the book, with the ids of the `###` rules under it. */
function readBook() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const source = readFileSync(resolve(root, 'docs/rulebook.md'), 'utf8').replace(/\r\n/g, '\n');
  const sections = new Map();
  let current = null;

  for (const line of source.split('\n')) {
    const opening = /^##\s+(.*)$/.exec(line);
    if (opening) {
      current = sectionId(opening[1].trim());
      sections.set(current, new Set());
      continue;
    }
    const rule = /^###\s+(.*)$/.exec(line);
    if (rule && current) sections.get(current).add(slug(rule[1].trim()));
  }
  return sections;
}

section('every lesson points at a heading the book has');
{
  const book = readBook();
  check('the book parsed into sections', book.size > 10, true);

  for (const step of STEPS) {
    check(`${step.key} has somewhere to send a reader`, step.rules.length > 0, true);
    for (const ref of step.rules) {
      const rules = book.get(ref.section);
      check(`${step.key}: section ${ref.section} exists`, Boolean(rules), true);
      if (ref.rule) {
        check(`${step.key}: ${ref.section} has ${ref.rule}`, Boolean(rules?.has(ref.rule)), true);
        check(`${step.key}: ${ref.label} lands on its heading`, ruleHref(ref), `/rules/rulebook#${ref.rule}`);
      } else {
        check(`${step.key}: ${ref.label} lands on its chapter`, ruleHref(ref), `/rules/rulebook#${ref.section}`);
      }
    }
  }

  /* The book describes this path, and says where. */
  check('the book has a rule for the Walkthrough', book.get('chapter-four')?.has('4-10-the-walkthrough'), true);
}

/* ----------------------------------------------------------------- the steps */

section('the steps');
{
  const keys = STEPS.map((step) => step.key);
  check('every key is its own', new Set(keys).size, keys.length);
  check('the walk ends on the sheet', STEPS.at(-1).key, 'sheet');
  check('an unknown key is the first step', stepIndex('no-such-step'), 0);
  check('a known key is its own place', stepIndex('lineage'), keys.indexOf('lineage'));

  const path = CREATION_PATHS.find((entry) => entry.key === WALKTHROUGH_PATH);
  check('the chooser offers this path', Boolean(path), true);
  check('and marks it built', path?.ready, true);
}

section('every question level 1 asks belongs to one step');
{
  const { asks } = levelOneState({ ...BLANK_CHARACTER });
  const kinds = [...new Set(asks.map((row) => row.kind))];
  check('a blank character is asked four things', kinds.sort(), ['background', 'boosts', 'lineage', 'talent']);

  for (const kind of kinds) {
    const owners = STEPS.filter((step) => step.asks.includes(kind));
    check(`${kind} is owned by exactly one step`, owners.length, 1);
  }
  check(
    'exactly one step also owns what a talent set leaves behind it',
    STEPS.filter((step) => step.talentAsks).map((step) => step.key),
    ['talent']
  );
}

/* -------------------------------------------------------------- the bookmark */

section('the bookmark reads back as the step it was written for');
{
  const record = progressOf('talent');
  check('a record names the path', record.path, WALKTHROUGH_PATH);
  check('and the step', record.step, 'talent');
  check('and when', typeof record.ts, 'string');

  const held = { ...BLANK_CHARACTER, creation: record };
  check('the row reads it back', storedStep(held), 'talent');

  const where = standing(held);
  check('the card reads the step', where?.key, 'talent');
  check('and its place', where?.index, stepIndex('talent'));
  check('and how many there are', where?.total, STEPS.length);
  check('and the title the chooser uses', where?.title, 'Walkthrough');

  check('a stringified column reads the same', storedStep({ creation: JSON.stringify(record) }), 'talent');
  check('a step the walk has forgotten reads as the first', standing({ creation: progressOf('gone') })?.index, 0);
  check('a step nobody wrote reads as the first', standing({ creation: { path: WALKTHROUGH_PATH } })?.index, 0);

  check('no record is no walk', standing({ ...BLANK_CHARACTER }), null);
  check('a finished character carries none', standing({ creation: null }), null);
  check("another path's record is not this walk", standing({ creation: { path: 'crossroads', step: 3 } }), null);
  check('garbage reads as no record', normalizeCreation('{not json'), null);
  check('a list reads as no record', normalizeCreation([1, 2]), null);
  check('a record with no path reads as none', normalizeCreation({ step: 'talent' }), null);
}

/* ------------------------------------------------------- a whole character */

/** The first thing on a shelf that asks nothing more once taken. */
function quietTalent() {
  return TALENTS.find(
    (talent) =>
      !talent.stub &&
      !talent.loadout &&
      !talent.minion &&
      !talent.feral &&
      !talent.pact &&
      !talent.oath &&
      !talent.enchanting &&
      !talent.brewing
  );
}

function quietLineage() {
  return LINEAGES.find(
    (lineage) =>
      !lineage.pool &&
      openPicks(lineage, {}) === 0 &&
      lineageCards(lineage, {}).every(({ card }) => !card.choice)
  );
}

function quietBackground() {
  return BACKGROUNDS.find(
    (background) => background.skills.filter((skill) => !skill.choice).length >= skillPicks(background)
  );
}

section('a blank character has every step still to do');
{
  const blank = { ...BLANK_CHARACTER };
  const progress = walkthroughProgress(blank);
  check('seven steps', progress.length, STEPS.length);
  check('none is done', progress.filter((entry) => entry.done).map((entry) => entry.step.key), []);
  check(
    'the four that ask are open',
    progress.filter((entry) => entry.open > 0).map((entry) => entry.step.key),
    ['attributes', 'talent', 'lineage', 'background']
  );
  check(
    'the lessons ask nothing',
    progress.filter((entry) => !entry.asked).map((entry) => entry.step.key),
    ['begin', 'story', 'sheet']
  );
  check('waiting names the same four', stepsWaiting(blank).length, 4);
  check('and the tab badge agrees', openChoices(blank, WALKTHROUGH_LEVEL), 4);
}

section('and a made one has none');
{
  const talent = quietTalent();
  const lineage = quietLineage();
  const background = quietBackground();
  check('a set that asks nothing more exists', Boolean(talent), true);
  check('a lineage that asks nothing exists', Boolean(lineage), true);
  check('a background whose skills ask nothing exists', Boolean(background), true);

  let made = { ...BLANK_CHARACTER, name: 'Fixture' };
  made = { ...made, ...setBoosts(made, 'physique', 'mind') };
  made = { ...made, talents: chooseAt(made.talents, WALKTHROUGH_LEVEL, talent.id) };
  made = { ...made, ...setLineage(made, lineage.name) };

  let skills = [];
  for (const skill of background.skills.filter((row) => !row.choice)) {
    if (skills.length >= skillPicks(background)) break;
    skills = takeSkill(background, skills, skill.id);
  }
  made = { ...made, background: background.name, background_skills: skills };

  /* Halfway: the trade is chosen and taught, the kit is not yet taken. The
     background step is the one still open, and it says so. */
  const half = walkthroughProgress(made);
  check(
    'with the kit untaken only the background waits',
    half.filter((entry) => entry.open > 0).map((entry) => entry.step.key),
    ['background']
  );

  const armorSet = armorSetOptions()[0].name;
  const weapons = startingWeapons()
    .slice(0, background.kit.weapons)
    .map((weapon) => weapon.id);
  made = { ...made, ...buildKitPatch({ character: made, background, armorSet, weapons }) };

  const progress = walkthroughProgress(made);
  check(
    'every step that asks is done',
    progress.filter((entry) => entry.asked && !entry.done).map((entry) => entry.step.key),
    []
  );
  check('nothing waits', stepsWaiting(made).length, 0);
  check('and the tab badge agrees', openChoices(made, WALKTHROUGH_LEVEL), 0);
  check('the spread landed', [made.physique, made.instinct, made.mind], [6, 4, 5]);
}

/* --------------------------------------------------------------- verdict */

if (findings.length > 0) {
  console.error(`\n${findings.length} finding${findings.length === 1 ? '' : 's'}:`);
  for (const finding of findings) {
    console.error(`  ${finding.what}\n    got  ${JSON.stringify(finding.got)}\n    want ${JSON.stringify(finding.want)}`);
  }
  process.exit(1);
}

console.log(LIST ? '\nall clear' : 'walkthrough: all clear');
