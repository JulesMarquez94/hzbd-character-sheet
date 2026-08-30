/**
 * What every card in the codex is going to make you roll.
 *
 * `rollPlan` reads a chain off a card's printed text: `{roll}` is the check and
 * every `[[2d6 + stat]]` is a handful of dice. Nothing was added to any card to
 * make that work, which is the whole point and also the whole risk. The plan is
 * a parser pointed at 338 bodies written by hand over months, so this runs it at
 * all of them and holds the answers to what the cards actually say.
 *
 *   node scripts/check-plan.mjs        report and exit 1 on any finding
 *   node scripts/check-plan.mjs --list print every case and the census
 *
 * The census at the foot is the part worth reading after a card drop. A new
 * batch of spells that rolls nothing, or a jump in throws named "Roll" because
 * nobody could tell what they were for, is a drift this file will show and no
 * assertion could have predicted.
 */

import { rollPlan } from '../src/lib/rollPlan.js';
import { CARDS, getCard } from '../src/lib/weapons.js';

const LIST = process.argv.includes('--list');
const findings = [];

/** A character with three attributes and nothing else interesting about them. */
const WHO = { physique: 6, instinct: 5, mind: 4, level: 3, speed_m: 5, name: 'Fixture' };

function check(what, got, want) {
  const same = JSON.stringify(got) === JSON.stringify(want);
  if (LIST) console.log(`  ${same ? 'ok  ' : 'FAIL'} ${what}${same ? '' : `  got ${JSON.stringify(got)}`}`);
  if (!same) findings.push({ what, got, want });
}

function section(title) {
  if (LIST) console.log(`\n===== ${title} =====`);
}

/** A plan flattened to the shape of each link, for comparison. */
const shape = (plan) =>
  plan.map((link) =>
    link.shape === 'check' ? `check:${link.kind}+${link.flat}` : `${link.kind}:${link.dice.join('+')}+${link.flat}`
  );

/* ------------------------------------------------------- the ordinary swing */

section('a weapon attack is a check and then its damage');
{
  const card = getCard('finesse-strike');
  check('the card is still there', Boolean(card), true);

  const plan = rollPlan(card, WHO);
  check('two links', plan.length, 2);
  check('the check first, then the damage', shape(plan), ['check:attack+5', 'damage:1d6+5']);
  check('the check asks for a DC', plan[0].askDc, true);
  check('and can be judged', plan[0].askVerdict, true);
  check('the damage asks for neither', [plan[1].askDc, plan[1].askVerdict], [undefined, false]);
}

section('the holder brings Empower and Elevate with them');
{
  const card = getCard('finesse-strike');
  const plan = rollPlan(card, WHO, { empower: 1, elevate: 1, advantage: 2, disadvantage: 1 });
  check('one more die, one size up', shape(plan)[1], 'damage:2d8+5');
  check('and the swing carries its advantage', [plan[0].advantage, plan[0].disadvantage], [2, 1]);
}

section('a card cast off another attribute');
{
  /* A Mycomancer's prepared spells are printed for Mind and cast with Instinct.
     The check and the damage both have to move, or the card prints one number
     and rolls another. */
  const card = getCard('finesse-strike');
  const asMind = rollPlan(card, WHO, { stat: 'mind' });
  check('the check adds the stat it was told', asMind[0].flat, 4);
  check('and so does the damage', asMind[1].flat, 4);
}

/* --------------------------------------------------- what is not a roll */

section('a stated number is not a throw');
{
  /* teeth-bite: "[[2d6 + 2*stat]] as damage and gain Shield equal to [[stat]]".
     The second value has no dice in it. It is a number the card states, and a
     die on the table for it would be the roller inventing one. */
  const card = getCard('teeth-bite');
  if (!card) {
    findings.push({ what: 'teeth-bite is still in the codex', got: false, want: true });
  } else {
    const plan = rollPlan(card, WHO);
    check('only the dice are rolled', plan.filter((l) => l.shape === 'value').length, 1);
    check('and the Shield is left alone', shape(plan).includes('shield:+5'), false);
  }
}

section('a card that rolls nothing plans nothing');
{
  const plan = rollPlan({ body: 'You stand up. Nothing about this is a roll.' }, WHO);
  check('no links', plan, []);
  check('a card with no body at all', rollPlan({}, WHO), []);
  check('and no card at all', rollPlan(null, WHO), []);
}

/* ------------------------------------------------------- a value landed twice */

section('a value the card lands more than once is thrown more than once');
{
  /* Three d6 are not one d6 read three times: each landing rolls its own dice
     and gets its own chance to explode. Jules, 2026-08-30. */
  const flurry = rollPlan(getCard('finesse-flurry'), WHO);
  check('the check, then a landing each', shape(flurry), [
    'check:attack+5',
    'damage:1d6+5',
    'damage:1d6+5',
    'damage:1d6+5',
  ]);

  const paired = rollPlan(getCard('paired-finesse-strike'), WHO);
  check('"damage twice" is two throws', paired.filter((l) => l.shape === 'value').length, 2);

  const once = rollPlan(getCard('finesse-strike'), WHO);
  check('and a card that says nothing lands once', once.filter((l) => l.shape === 'value').length, 1);
}

section('a multiplier is not a repeat');
{
  /* The Poison potion says "damage equal to twice the number of Damage Dice
     rolled", which is a multiplier on a count. Its dice are in another paragraph
     so the sentence scope already keeps them apart, and the guard is what keeps
     them apart if a card drop ever puts the two in one sentence. */
  const poison = rollPlan(getCard('poison'), WHO);
  check('the potion throws once', poison.filter((l) => l.shape === 'value').length, 1);

  const same = rollPlan(
    { stat: 'instinct', body: 'Deal [[2d6]] damage equal to twice the number of Damage Dice.' },
    WHO
  );
  check('even said in one breath', same.length, 1);
}

/* ------------------------------------------------------------ the second half */

section('a paid second half rolls too');
{
  const card = {
    stat: 'instinct',
    body: 'Deal [[1d6 + stat]] damage.',
    sub_body: 'You may spend 2 more Action Points. If you do, deal a further [[2d6]] damage.',
  };
  check('unpaid, the half is not rolled', shape(rollPlan(card, WHO)), ['damage:1d6+5']);
  check('paid, it is', shape(rollPlan(card, WHO, null, { half: true })), [
    'damage:1d6+5',
    'damage:2d6+0',
  ]);
}

/* ------------------------------------------------------------ naming a throw */

section('a throw is named for what it is for');
{
  const named = (body) => rollPlan({ stat: 'instinct', body }, WHO)[0]?.kind;
  check('damage', named('you deal [[1d6 + stat]] {damage} damage.'), 'damage');
  check('bare damage', named('dealing [[2d6]] damage to it.'), 'damage');
  check('healing', named('it restores [[1d6 + stat]] Health.'), 'healing');
  check('shield', named('the target gains an additional [[1d6 + stat]] Shield.'), 'shield');
  /* Bandage Roll says what it is for in front of the dice rather than after
     them, which is the whole reason the sentence is asked as well as the word. */
  check('healing named before the dice', named('healing [[1d6 + level]] on them.'), 'healing');
  /* Nothing after the dice and nothing in the sentence. The dice and the total
     are still right; only the word above them was ever in question. */
  check('and a throw nobody can name', named('Roll [[2d6]] and consult the table.'), 'roll');
}

section('a check knows whether it was an attack');
{
  const kind = (body) => rollPlan({ stat: 'instinct', body }, WHO)[0]?.kind;
  check('an Attack Roll', kind('Make a {stat} Melee Attack {roll} against an entity.'), 'attack');
  check('a plain Roll', kind('Make a {stat} Roll {roll} against its Reflex.'), 'check');
}

section('only the first check asks for a DC');
{
  /* Two cards in the codex have a second {roll}. A chain asks its DC once, so
     the plan takes the one it is sure about rather than asking twice or
     assuming the second shares the first one's number. */
  const plan = rollPlan(
    { stat: 'instinct', body: 'Make an Attack {roll}. Then make another {roll} against it.' },
    WHO
  );
  check('one check, not two', plan.filter((l) => l.shape === 'check').length, 1);
}

/* ------------------------------------------------------------ the whole codex */

section('every card in the codex plans without falling over');
{
  const census = { cards: 0, checks: 0, values: 0, unnamed: 0, plans: 0 };
  const broke = [];

  for (const card of CARDS) {
    census.cards += 1;
    let plan;
    try {
      plan = rollPlan(card, WHO, { empower: 1, elevate: 1, advantage: 1 }, { half: true });
    } catch (error) {
      broke.push(`${card.id}: ${error.message}`);
      continue;
    }

    if (plan.length > 0) census.plans += 1;
    for (const link of plan) {
      if (link.shape === 'check') {
        census.checks += 1;
        if (!Number.isFinite(link.flat)) broke.push(`${card.id}: check has no number`);
      } else {
        census.values += 1;
        if (link.kind === 'roll') census.unnamed += 1;
        if (link.dice.length === 0) broke.push(`${card.id}: a value link with no dice`);
        if (!Number.isFinite(link.flat)) broke.push(`${card.id}: value has no number`);
      }
    }
  }

  check('nothing threw and nothing came back malformed', broke.slice(0, 5), []);

  if (LIST) {
    console.log(`\n  ${census.cards} cards, ${census.plans} of which roll something`);
    console.log(`  ${census.checks} checks and ${census.values} value throws`);
    console.log(`  ${census.unnamed} throws could not be named and read as "Roll"`);
  }

  /* A guard rather than an exact count, so a card drop does not fail this file
     for existing. If the codex ever stops rolling, or half the throws stop
     being nameable, something upstream has changed shape. */
  check('the codex still rolls', census.plans > 100, true);
  check('and most throws can still be named', census.unnamed < census.values / 4, true);
}

/* ------------------------------------------------------------------ report */

if (findings.length === 0) {
  console.log('roll plans: every card says what it rolls');
  process.exit(0);
}

console.log(`\nroll plans: ${findings.length} ${findings.length === 1 ? 'case does' : 'cases do'} not hold\n`);
for (const { what, got, want } of findings) {
  console.log(`  ${what}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`);
}
process.exit(LIST ? 0 : 1);
