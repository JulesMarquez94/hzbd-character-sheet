/**
 * The roster placeholders, held to who may see them.
 *
 * Fourteen talent sets are a name and a shelf and nothing else (`stub: true` in
 * src/lib/talents.js). Since 2026-09-12 they draw on the chooser wall for a
 * friend or an admin and for nobody else, and this is the proof: the capability
 * sits where the ruling put it, `optionsAt` hides and shows on the flag the
 * chooser passes it, no tier can spend a level on one, and the two places the
 * rulebook prints the lists still print the right sets.
 *
 * The last section is the one most likely to fire. Rulebook 4.5 names every
 * written set and Appendix B names every unwritten one, both by hand, and both
 * were two sets out of date once already. The day a placeholder is replaced,
 * this is what says the book has to move with it.
 *
 *   node scripts/check-roster.mjs        report and exit 1 on any finding
 *   node scripts/check-roster.mjs --list print every case, then exit 0
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CAPABILITIES, TIERS, can } from '../src/lib/tiers.js';
import { TALENTS, chooseAt, optionsAt } from '../src/lib/talents.js';

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

const stubs = TALENTS.filter((talent) => talent.stub);
const written = TALENTS.filter((talent) => !talent.stub);
const names = (list) => list.map((talent) => talent.name).sort();

/* ------------------------------------------------------- who sees the roster */

section('who sees the roster');
{
  check('there are placeholders to hide', stubs.length > 0, true);
  check('the capability exists', typeof CAPABILITIES.roster, 'string');
  check('and sits on the same rung as the art', CAPABILITIES.roster, CAPABILITIES.art);
  check(
    'free and premium do not see it, friend and admin do',
    TIERS.map((tier) => can(tier.id, 'roster')),
    [false, false, true, true]
  );
}

/* ---------------------------------------------------------------- the wall */

section('the wall');
{
  const hidden = optionsAt([], 2);
  const reading = optionsAt([], 2, { all: true });
  const shown = optionsAt([], 2, { roster: true });
  const isStub = (option) => Boolean(option.talent.stub);

  check('by default no placeholder is on the wall', hidden.filter(isStub).length, 0);
  check('nor on the read-only wall', reading.filter(isStub).length, 0);
  check('every written set still is', names(hidden.map((option) => option.talent)), names(written));

  check('with the roster on, every placeholder stands on it', names(shown.filter(isStub).map((o) => o.talent)), names(stubs));
  check('each of them locked', shown.filter(isStub).every((option) => option.ok === false && option.rank === null), true);
  check('each saying why', new Set(shown.filter(isStub).map((option) => option.reason)).size, 1);
  check('and the written sets are unchanged by the flag', names(shown.filter((o) => !isStub(o)).map((o) => o.talent)), names(written));
  check('so the flag adds exactly the placeholders', shown.length - hidden.length, stubs.length);
}

/* ------------------------------------------------------ no tier can take one */

section('no tier can take one');
{
  for (const stub of stubs) {
    check(`${stub.name} cannot be taken`, chooseAt([], 1, stub.id), []);
  }
  check('while a written set can', chooseAt([], 1, written[0].id).length, 1);
}

/* --------------------------------------------------- the book names the lists */

/** "Thirty-four" and "Twenty" and "Fourteen" as numbers, so the book's counts can be read. */
function numberWord(word) {
  const units = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = { twenty: 20, thirty: 30, forty: 40, fifty: 50 };
  const parts = String(word).toLowerCase().split('-');
  if (parts.length === 1) return units.indexOf(parts[0]) >= 0 ? units.indexOf(parts[0]) : tens[parts[0]] ?? null;
  const [ten, unit] = parts;
  return tens[ten] != null && units.indexOf(unit) > 0 ? tens[ten] + units.indexOf(unit) : null;
}

/** A prose list, "A, B, C and D", as its names. */
function listed(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/,\s*|\s+and\s+/)
    .map((name) => name.trim())
    .filter(Boolean)
    .sort();
}

section('the book names the lists');
{
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const book = readFileSync(resolve(root, 'docs/rulebook.md'), 'utf8').replace(/\r\n/g, '\n');

  const named = /([A-Za-z-]+) talent sets are named\. \*\*([A-Za-z-]+) are written and can be taken\*\*:\s*([^.]+)\./.exec(book);
  check('4.5 counts the sets', Boolean(named), true);
  if (named) {
    check('4.5: the total is the codex', numberWord(named[1]), TALENTS.length);
    check('4.5: the written count is the codex', numberWord(named[2]), written.length);
    check('4.5: the written list is the codex, name for name', listed(named[3]), names(written));
  }

  const unwritten = /\*\*([A-Za-z-]+) talent sets are names without cards\*\*:\s*([^.]+)\./.exec(book);
  check('Appendix B counts the placeholders', Boolean(unwritten), true);
  if (unwritten) {
    check('Appendix B: the count is the codex', numberWord(unwritten[1]), stubs.length);
    check('Appendix B: the list is the codex, name for name', listed(unwritten[2]), names(stubs));
  }

  check('4.5 no longer says the rest are shown on the wall', /The rest are shown on the wall/.test(book), false);
}

/* ----------------------------------------------------------------- verdict */

if (findings.length > 0) {
  console.error(`\n${findings.length} finding${findings.length === 1 ? '' : 's'}:`);
  for (const finding of findings) {
    console.error(`  ${finding.what}\n    got  ${JSON.stringify(finding.got)}\n    want ${JSON.stringify(finding.want)}`);
  }
  process.exit(1);
}

console.log(LIST ? '\nall clear' : 'roster: all clear');
