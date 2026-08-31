/**
 * What can still be spent on a roll that has already landed.
 *
 * Karma and the cards like DRAGON'S FAVOR are decided *after* seeing the dice,
 * which makes them the one part of a roll where the sheet has to reason about a
 * result rather than produce one. Two things can go wrong and both are quiet:
 *
 *   an offer that cannot help. Jules was exact on 2026-08-31: Karma shows "only
 *   if karma would allow to roll a value that move it to a success or critical
 *   success, so if it 4 away". A button offering to spend a Karma on a roll five
 *   short is worse than no button, because it charges for nothing.
 *
 *   a total that stops adding up. An intervention appends a die or a number and
 *   the whole thing is judged again. Get that wrong and the sheet shows one
 *   number while the log keeps another.
 *
 *   node scripts/check-help.mjs        report and exit 1 on any finding
 *   node scripts/check-help.mjs --list print every case, then exit 0
 */

import { applyIntervention, gapToNextBand, interventionsFor } from '../src/lib/interventions.js';
import { CRIT_BAND, judge } from '../src/lib/dice.js';

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

/** A landed check, at whatever total and DC a case needs. */
const landed = (total, dc, over = {}) => ({
  shape: 'check',
  kind: 'attack',
  dice: [
    { id: 0, sides: 6, value: 3, role: 'base' },
    { id: 1, sides: 6, value: 3, role: 'base' },
  ],
  flat: total - 6,
  dc,
  total,
  verdict: judge(total, dc),
  ...over,
});

const rich = { karma: 3, willpower: 8 };
const ids = (offers) => offers.map((offer) => offer.id);

/* --------------------------------------------------------------- the gap */

section('how far short of the next band');
{
  check('four short of a success', gapToNextBand(8, 12), 4);
  check('one short', gapToNextBand(11, 12), 1);
  check('exactly on it, so the next band is the critical', gapToNextBand(12, 12), CRIT_BAND);
  check('one short of a critical', gapToNextBand(17, 12), 1);
  check('already critical, nothing above it', gapToNextBand(18, 12), null);
  check('no DC, no gap', gapToNextBand(12, null), null);
}

/* ------------------------------------------------------------- karma */

section('Karma is offered only where a d4 could reach');
{
  const at = (total) => ids(interventionsFor({ result: landed(total, 12), character: rich }));

  check('four short is the furthest a d4 reaches', at(8), ['karma']);
  check('one short', at(11), ['karma']);
  check('five short is out of reach, so nothing is offered', at(7), []);
  check('ten short, still nothing', at(2), []);
  /* A success can still be pushed to a critical, and the gap to it is measured
     the same way. Twelve against a DC of 12 is six short of the critical, which
     a d4 cannot reach. */
  check('a success six short of a critical is out of reach', at(12), []);
  check('a success two short of a critical', at(16), ['karma']);
  check('a critical success has nothing left to buy', at(18), []);
}

section('and only when there is a Karma to spend');
{
  check('no karma, no offer', ids(interventionsFor({ result: landed(11, 12), character: { karma: 0 } })), []);
  check('one karma is enough', ids(interventionsFor({ result: landed(11, 12), character: { karma: 1 } })), ['karma']);
}

section('nothing is offered on a roll that has no band');
{
  const damage = { shape: 'value', kind: 'damage', dice: [], flat: 8, dc: null, total: 17, verdict: null };
  check('a damage roll is not a check', ids(interventionsFor({ result: damage, character: rich })), []);
  check('and no result at all offers nothing', interventionsFor({ result: null, character: rich }), []);
}

/* ------------------------------------------------------- the cards */

section("a card is only offered to whoever holds it");
{
  const one = landed(11, 12);
  check(
    'holding it, one short',
    ids(interventionsFor({ result: one, character: rich, held: ['dragons-favor'] })),
    ['karma', 'dragons-favor']
  );
  check(
    'not holding it',
    ids(interventionsFor({ result: one, character: rich, held: [] })),
    ['karma']
  );
  /* "1 away" is exactly one. A card that only ever adds +1 has nothing to offer
     a roll that is two short, where a Karma d4 still might. */
  check(
    'two short is out of its reach but not out of Karma’s',
    ids(interventionsFor({ result: landed(10, 12), character: rich, held: ['dragons-favor'] })),
    ['karma']
  );
}

section('and only what the character can actually pay for');
{
  /* Karma checked its own pool from the start. A card did not, so DRAGON'S FAVOR
     was offered to a character with no Willpower left, and taking it would have
     charged nothing and granted the +1 anyway. Both go through one test now. */
  const broke = { karma: 0, willpower: 0 };
  const one = landed(11, 12);

  check(
    'no Karma and no Willpower is no offers',
    ids(interventionsFor({ result: one, character: broke, held: ['dragons-favor'] })),
    []
  );
  check(
    'Willpower but no Karma offers only the card',
    ids(interventionsFor({ result: one, character: { karma: 0, willpower: 2 }, held: ['dragons-favor'] })),
    ['dragons-favor']
  );
  check(
    'Karma but no Willpower offers only the Karma',
    ids(interventionsFor({ result: one, character: { karma: 1, willpower: 0 }, held: ['dragons-favor'] })),
    ['karma']
  );
}

section('nothing is offered twice for one roll');
{
  const spentAlready = landed(11, 12, { interventions: ['karma'] });
  check(
    'a Karma already spent is not offered again',
    ids(interventionsFor({ result: spentAlready, character: rich, spent: ['karma'] })),
    []
  );
}

section('with no DC the table calls it first, then everything is offered');
{
  /* The sheet cannot measure a gap it was never given, so it stops pretending.
     Jules's ruling: offer them after the table has called it. */
  const blind = landed(11, null, { verdict: null });
  check('unjudged, nothing is offered yet', ids(interventionsFor({ result: blind, character: rich })), []);
  check(
    'once the table calls it, both are',
    ids(interventionsFor({ result: blind, character: rich, held: ['dragons-favor'], verdict: 'failure' })),
    ['karma', 'dragons-favor']
  );
  check(
    'and the gap is honestly unknown',
    interventionsFor({ result: blind, character: rich, verdict: 'failure' })[0].gap,
    null
  );
}

/* --------------------------------------------------------- spending one */

section('spending Karma adds a d4 and re-judges the roll');
{
  const before = landed(11, 12);
  const offer = interventionsFor({ result: before, character: rich })[0];
  /* (3 - 0.5) / 4 puts the d4 on a 3, the same scripted-random trick the other
     checkers use. */
  const after = applyIntervention(before, offer, () => (3 - 0.5) / 4);

  check('the d4 is on the table', after.dice.length, 3);
  check('marked as Karma, not as advantage', after.dice[2].role, 'karma');
  check('and it says what bought it', after.dice[2].source, 'Karma');
  check('the total moved by the die', after.total, 14);
  check('a failure became a success', [before.verdict, after.verdict], ['failure', 'success']);
  check('and the spend is on the record', after.interventions, ['karma']);
  check('the flat did not move', after.flat, before.flat);
}

section('spending a card adds its number and re-judges');
{
  const before = landed(11, 12);
  const offer = interventionsFor({ result: before, character: rich, held: ['dragons-favor'] })[1];
  const after = applyIntervention(before, offer);

  check('no die is added', after.dice.length, 2);
  check('the flat carries it', after.flat, before.flat + 1);
  check('one short became a success', after.total, 12);
  check('judged again from the total', after.verdict, 'success');
}

section('a Karma spent on a blind roll goes back to the table');
{
  /* They called a band off the old total and the total has just changed. Keeping
     the old answer would be answering a different question. */
  const before = landed(11, null, { verdict: 'failure', calledByHand: true });
  const offer = interventionsFor({ result: before, character: rich, verdict: 'failure' })[0];
  const after = applyIntervention(before, offer, () => (2 - 0.5) / 4);

  check('the total moved', after.total, 13);
  check('the verdict is open again', after.verdict, null);
  check('and it is no longer a called one', after.calledByHand, false);
}

section('a second Karma stacks on the first');
{
  let result = landed(8, 12);
  for (let i = 0; i < 2; i += 1) {
    const offer = interventionsFor({
      result,
      character: rich,
      spent: result.interventions ?? [],
    })[0];
    if (!offer) break;
    result = applyIntervention(result, offer, () => (2 - 0.5) / 4);
  }
  /* Once per roll, so the second pass finds nothing to offer and the total moves
     exactly once. */
  check('only one Karma lands', result.dice.filter((one) => one.role === 'karma').length, 1);
  check('and the total moved once', result.total, 10);
}

/* ------------------------------------------------------------------ report */

if (findings.length === 0) {
  console.log('after the roll: every offer is one that could help');
  process.exit(0);
}

console.log(`\nafter the roll: ${findings.length} ${findings.length === 1 ? 'case does' : 'cases do'} not hold\n`);
for (const { what, got, want } of findings) {
  console.log(`  ${what}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`);
}
process.exit(LIST ? 0 : 1);
