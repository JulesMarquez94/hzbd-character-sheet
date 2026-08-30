/**
 * The dice engine, held to the rulings it was built from.
 *
 * src/lib/dice.js is the only place in the app that decides a number, and every
 * screen at a table is going to be shown whatever it decided. There is no
 * second opinion anywhere and no way for a player to notice a wrong band, so the
 * rules are pinned here rather than trusted.
 *
 *   node scripts/check-dice.mjs        report and exit 1 on any finding
 *   node scripts/check-dice.mjs --list print every case, then exit 0
 *
 * Every ruling below is Jules's, given on 2026-08-30 while the roller was being
 * specified. Each one is a case, and a case that stops matching means the engine
 * moved away from the game rather than the other way round.
 *
 *   a Roll is 2d6           and a check never explodes, whatever it shows
 *   the four bands          6 under, under, equal or over, 6 over
 *   no DC, no verdict       the table calls it instead
 *   advantage cancels       1-to-1, and only the survivors are rolled
 *   damage explodes         on its own maximum, one category up the ladder
 *   the ladder caps         so a maxed d12 explodes into another d12
 *   explosions chain        for as long as each new die keeps maxing
 *   a critical maximises    the damage roll after it, which sets it all off
 *
 * ------------------------------------------------------------------- scripted
 * The engine takes its randomness as an argument so this file can hand it a
 * script. `scripted([[5, 6], [3, 6]])` means "the next d6 shows 5, the one after
 * shows 3", written as the value and the die it is meant for. The die count is
 * not passed to `random`, so a pair naming the wrong die does not throw: it
 * produces a different number, and the assertion on that number is what catches
 * it. Cases are written to assert on faces as well as totals for that reason.
 */

import {
  CRIT_BAND,
  judge,
  netSwing,
  parseDie,
  previewOf,
  rollCheck,
  rollLine,
  rollNotation,
  rollValue,
  signOf,
} from '../src/lib/dice.js';

const LIST = process.argv.includes('--list');
const findings = [];

/**
 * A `random` that produces exactly the faces asked for.
 *
 * `(value - 0.5) / faces` lands in the middle of the value's own slice, so
 * `1 + floor(r * faces)` is the value and no rounding sits near an edge. Runs
 * off the end deliberately rather than looping: a case that rolls more dice than
 * it scripted has found something, and a silent wrap would hide it.
 */
function scripted(pairs) {
  let i = 0;
  return () => {
    const pair = pairs[i];
    i += 1;
    if (!pair) throw new Error(`the script ran out after ${pairs.length} dice`);
    const [value, faces] = pair;
    return (value - 0.5) / faces;
  };
}

/** A `random` that always shows the maximum, for the liveness case. */
const alwaysMax = () => 0.9999999;

function check(what, got, want) {
  const same = JSON.stringify(got) === JSON.stringify(want);
  if (LIST) console.log(`  ${same ? 'ok  ' : 'FAIL'} ${what}${same ? '' : `  got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
  if (!same) findings.push({ what, got, want });
}

function section(title) {
  if (LIST) console.log(`\n===== ${title} =====`);
}

/** Every die's faces in order, so a case can assert on the ladder it climbed. */
const ladderOf = (result) => result.dice.map((one) => one.sides);
const rolesOf = (result) => result.dice.map((one) => one.role);
const valuesOf = (result) => result.dice.map((one) => one.value);

/* ----------------------------------------------------------- a Roll is 2d6 */

section('a Roll is 2d6, and it never explodes');
{
  const boxcars = rollCheck({ random: scripted([[6, 6], [6, 6]]) });
  check('two dice and no more', boxcars.dice.length, 2);
  check('both are d6', ladderOf(boxcars), [6, 6]);
  check('double six is twelve, not a burst', boxcars.total, 12);

  const withFlat = rollCheck({ flat: 4, random: scripted([[5, 6], [3, 6]]) });
  check('the flat is added once', withFlat.total, 12);
  check('the notation reads back', rollNotation(withFlat), '2d6 + 4');
}

/* ------------------------------------------------------------ the four bands */

section('the four bands, at every boundary');
{
  /* One case per boundary, either side of it. The dice are pinned at 1 and 1 so
     the flat is the only thing moving, which makes each line say what it means:
     a total, a DC and the word the table hears. */
  const at = (total, dc) =>
    rollCheck({ flat: total - 2, dc, random: scripted([[1, 6], [1, 6]]) }).verdict;

  check('7 under is a critical failure', at(5, 12), 'critical-failure');
  check('6 under is a critical failure', at(6, 12), 'critical-failure');
  check('5 under is a plain failure', at(7, 12), 'failure');
  check('1 under is a plain failure', at(11, 12), 'failure');
  check('equal is a success', at(12, 12), 'success');
  check('5 over is a plain success', at(17, 12), 'success');
  check('6 over is a critical success', at(18, 12), 'critical-success');
  check('7 over is a critical success', at(19, 12), 'critical-success');

  check('the band is six', CRIT_BAND, 6);
  check('judge agrees with the roll', judge(18, 12), 'critical-success');
}

section('no DC, no verdict');
{
  const blind = rollCheck({ flat: 4, random: scripted([[5, 6], [3, 6]]) });
  check('a roll with no DC is not judged', blind.verdict, null);
  check('and it keeps its total', blind.total, 12);
  check('an empty field is not a zero', judge(5, ''), null);
  check('nor is a missing one', judge(5, undefined), null);
  check('but a zero DC is a real DC', judge(5, 0), 'success');
}

/* -------------------------------------------------------- advantage cancels */

section('advantage and disadvantage cancel 1-to-1');
{
  check('two up against one down is one up', netSwing(2, 1), { advantage: 1, disadvantage: 0 });
  check('one against one is nothing', netSwing(1, 1), { advantage: 0, disadvantage: 0 });
  check('one up against three down is two down', netSwing(1, 3), { advantage: 0, disadvantage: 2 });

  const cancelled = rollCheck({ advantage: 1, disadvantage: 1, random: scripted([[4, 6], [2, 6]]) });
  check('a cancelled pair rolls no d4 at all', cancelled.dice.length, 2);

  const up = rollCheck({
    advantage: 2,
    disadvantage: 1,
    flat: 3,
    random: scripted([[4, 6], [2, 6], [3, 4]]),
  });
  check('one green d4 survives', rolesOf(up), ['base', 'base', 'advantage']);
  check('and it is a d4', ladderOf(up), [6, 6, 4]);
  check('advantage adds', up.total, 12);

  const down = rollCheck({
    disadvantage: 2,
    flat: 5,
    random: scripted([[3, 6], [4, 6], [4, 4], [1, 4]]),
  });
  check('two red d4s', rolesOf(down), ['base', 'base', 'disadvantage', 'disadvantage']);
  check('disadvantage subtracts', down.total, 7);
  check('a red die still shows what it rolled', valuesOf(down), [3, 4, 4, 1]);
  check('the notation says it subtracts', rollNotation(down), '2d6 - 2d4 + 5');
  check('disadvantage is the only sign', [signOf('disadvantage'), signOf('advantage')], [-1, 1]);
}

/* ------------------------------------------------------------- explosions */

section('a damage die explodes one category up');
{
  const six = rollValue({ dice: ['1d6'], random: scripted([[6, 6], [3, 8]]) });
  check('a maxed d6 throws a d8', ladderOf(six), [6, 8]);
  check('the burst is added', six.total, 9);
  check('and it says what threw it', six.dice[1].from, 0);
  check('the burst is marked as one', rolesOf(six), ['base', 'explosion']);

  const eight = rollValue({ dice: ['1d8'], random: scripted([[8, 8], [4, 10]]) });
  check('a maxed d8 throws a d10', ladderOf(eight), [8, 10]);

  const ten = rollValue({ dice: ['1d10'], random: scripted([[10, 10], [5, 12]]) });
  check('a maxed d10 throws a d12', ladderOf(ten), [10, 12]);

  const twelve = rollValue({ dice: ['1d12'], random: scripted([[12, 12], [7, 12]]) });
  check('the ladder caps, so a maxed d12 throws another d12', ladderOf(twelve), [12, 12]);
  check('and the cap still adds up', twelve.total, 19);

  const quiet = rollValue({ dice: ['2d6'], flat: 8, random: scripted([[4, 6], [5, 6]]) });
  check('a die under its maximum throws nothing', quiet.dice.length, 2);
  check('and the printed total is the printed total', quiet.total, 17);
}

section('explosions chain while each new die keeps maxing');
{
  const chain = rollValue({
    dice: ['1d6'],
    random: scripted([[6, 6], [8, 8], [10, 10], [12, 12], [3, 12]]),
  });
  check('every rung is climbed', ladderOf(chain), [6, 8, 10, 12, 12]);
  check('the chain ends when a die comes up short', chain.dice.length, 5);
  check('and the whole chain is in the total', chain.total, 39);
  check('each burst names the die before it', chain.dice.map((one) => one.from), [null, 0, 1, 2, 3]);
}

section('a runaway chain still ends');
{
  /* Not a rule, a liveness guard: a `random` that never comes up short would
     otherwise hang the tab rather than fail. See EXPLOSION_LIMIT. */
  const runaway = rollValue({ dice: ['1d6'], random: alwaysMax });
  check('the limit holds', runaway.dice.length, 21);
  check('and every die past the cap is a d12', ladderOf(runaway).slice(4), Array(17).fill(12));
}

section('a scratch roll does not explode');
{
  /* The tray offers plain dice in the corner of the screen and has not been told
     they are damage. A 6 that quietly grew into a d8 there would be the roller
     inventing a rule, so bursting is a flag and the tray turns it off. */
  const scratch = rollValue({ dice: ['2d6'], explode: false, random: scripted([[6, 6], [6, 6]]) });
  check('two sixes stay two sixes', valuesOf(scratch), [6, 6]);
  check('and come to twelve', scratch.total, 12);
  check('damage still bursts by default', rollValue({
    dice: ['1d6'],
    random: scripted([[6, 6], [2, 8]]),
  }).dice.length, 2);
}

section('what a roll is about to throw, before it throws it');
{
  check('a check is 2d6', previewOf({ shape: 'check' }), [{ count: 2, faces: 6, role: 'base' }]);
  check('with the surviving d4s on it', previewOf({ shape: 'check', advantage: 3, disadvantage: 1 }), [
    { count: 2, faces: 6, role: 'base' },
    { count: 2, faces: 4, role: 'advantage' },
  ]);
  check('and red ones when they win', previewOf({ shape: 'check', disadvantage: 2 }), [
    { count: 2, faces: 6, role: 'base' },
    { count: 2, faces: 4, role: 'disadvantage' },
  ]);
  check('a value is whatever the card prints', previewOf({ shape: 'value', dice: ['2d6', '1d8'] }), [
    { count: 2, faces: 6, role: 'base' },
    { count: 1, faces: 8, role: 'base' },
  ]);
  /* A preview is a plan and an explosion is a consequence, so no preview can
     ever contain one. Nothing to assert but the absence, which is the point. */
  check('and never contains a burst', previewOf({ shape: 'value', dice: ['1d6'] }).length, 1);
}

/* --------------------------------------------------- a critical maximises */

section('a critical success maximises the damage after it, and it all explodes');
{
  /* A burst is appended straight after the die that threw it rather than at the
     end, so a renderer can grow it out of that die. The order below is that
     interleaving, and asserting on it is the point of the case. */
  const crit = rollValue({
    dice: ['2d6'],
    flat: 8,
    maximize: true,
    random: scripted([[3, 8], [5, 8]]),
  });
  check('each printed die lands on six', valuesOf(crit), [6, 3, 6, 5]);
  check('so both of them burst', ladderOf(crit), [6, 8, 6, 8]);
  check('a burst follows the die that threw it', rolesOf(crit), [
    'base',
    'explosion',
    'base',
    'explosion',
  ]);
  check('and each one says which', crit.dice.map((one) => one.from), [null, 0, null, 2]);
  check('a maximised die spends no randomness of its own', crit.total, 28);
}

/* ------------------------------------------------------------ the round trip */

section('a total is always the sum of what is on the table');
{
  /* Nothing scripted. Five hundred real rolls of every shape, checked against
     the one promise the whole file makes: the number the table is shown is the
     dice the table is looking at. */
  let drifted = 0;
  for (let i = 0; i < 500; i += 1) {
    const flat = i % 11;
    const one =
      i % 2 === 0
        ? rollCheck({ flat, advantage: i % 3, disadvantage: i % 4, dc: 12 })
        : rollValue({ dice: ['2d6', '1d8'], flat, maximize: i % 7 === 0 });
    const sum = one.dice.reduce((total, die) => total + signOf(die.role) * die.value, one.flat);
    if (sum !== one.total) drifted += 1;
  }
  check('five hundred rolls, none of them drifted', drifted, 0);
}

/* ---------------------------------------------------------------- notation */

section('the notation and the line read back');
{
  check('a printed die parses', parseDie('2d6'), { count: 2, faces: 6 });
  check('a bare die is one die', parseDie('d8'), { count: 1, faces: 8 });
  check('prose is not a die', parseDie('stat'), null);

  const line = rollCheck({ flat: 4, dc: 12, random: scripted([[5, 6], [3, 6]]) });
  check('a check reads as one line', rollLine(line), '2d6 + 4 · 5, 3 · 12 · Success');

  const burst = rollValue({ dice: ['1d6'], flat: 2, random: scripted([[6, 6], [3, 8]]) });
  check('a burst is named in the line', rollLine(burst), '1d6 + 2 · 6 · burst d8: 3 · 11');
  check('and never in the notation', rollNotation(burst), '1d6 + 2');
}

/* ------------------------------------------------------------------ report */

if (findings.length === 0) {
  console.log('dice: every ruling holds');
  process.exit(0);
}

console.log(`\ndice: ${findings.length} ${findings.length === 1 ? 'ruling does' : 'rulings do'} not hold\n`);
for (const { what, got, want } of findings) {
  console.log(`  ${what}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`);
}
process.exit(LIST ? 0 : 1);
