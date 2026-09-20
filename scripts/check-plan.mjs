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

import { printedSwing, rollPlan } from '../src/lib/rollPlan.js';
import { CARDS, getCard } from '../src/lib/weapons.js';
import { attackModifiers, withClaims } from '../src/lib/moves.js';
import { lineageSwing } from '../src/lib/lineages.js';
import { sourceWords } from '../src/lib/attribution.js';

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
  check('the check first, then the damage', shape(plan), ['check:weapon+5', 'damage:1d6+5']);
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

section('a value inside a menu is an option, not a throw');
{
  /* STEAL lists four things you might have lifted and one of them restores
     [[2d6 + 2*stat]] Health. Rolling that during the attack puts a number on the
     table for an outcome the player has not picked and probably will not get.
     The only card in the codex shaped this way, which is why the rule is written
     rather than the card being named. */
  const steal = rollPlan(getCard('steal'), WHO);
  /* An Attack Roll rather than a Weapon Attack Roll: STEAL is tagged Trickster
     and Ability, not Weapon Attack, so it is not the codex's own weapon swing
     even though it rides one. The tag is the tell, not the prose. */
  check('the attack is still rolled', shape(steal), ['check:attack+5']);
  check('and the menu is left to the window', steal.filter((l) => l.shape === 'value').length, 0);

  /* A menu has no full stops between its entries, so the list reads as one
     sentence and the tell is a bare "N:" sitting before the dice. */
  const menu = rollPlan(
    { stat: 'instinct', body: 'Choose one: 1: Mend · Restores [[2d6]] Health. 2: Ward.' },
    WHO
  );
  check('any numbered list, not just that one', menu.length, 0);

  /* And prose that merely contains a colon is still prose. */
  const prose = rollPlan(
    { stat: 'instinct', body: 'The blade drinks deep: you deal [[2d6]] damage.' },
    WHO
  );
  check('a colon alone is not a menu', shape(prose), ['damage:2d6+0']);
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
    'check:weapon+5',
    'damage:1d6+5',
    'damage:1d6+5',
    'damage:1d6+5',
  ]);

  /* "twice" is read the same way and no card in the codex says it any more. The
     four Paired weapons did until 2026-09-03, when Jules ruled the pair is the
     die count rather than the landing — a Paired Heavy rolls 4d4 once instead of
     2d4 twice — so the reader is held against a card written here. Losing the
     assertion with the last card that tripped it would leave the branch live and
     untested for whichever card says it next. */
  const twice = rollPlan(
    { stat: 'instinct', body: 'On a hit, you deal [[1d4 + stat]] damage twice.' },
    WHO
  );
  check('"damage twice" is two throws', shape(twice), ['damage:1d4+5', 'damage:1d4+5']);

  const paired = rollPlan(getCard('paired-finesse-strike'), WHO);
  check('and a Paired weapon is now one throw of twice the dice', shape(paired), [
    'check:weapon+5',
    'damage:2d4+5',
  ]);

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

section('a check is named after the kind of roll it is');
{
  /* Named after the roll and not after the card, on Jules's instruction of
     2026-08-31: the entry above it in the log already says which card, so a row
     reading "Flurry" under an entry reading "Flurry" says nothing twice. */
  const kind = (card) => rollPlan({ stat: 'instinct', ...card }, WHO)[0]?.kind;
  check(
    'a weapon swing is a Weapon Attack Roll',
    kind({ tags: ['Melee', 'Weapon Attack'], body: 'Make a {stat} Melee Attack {roll}.' }),
    'weapon'
  );
  check(
    'anything else that attacks is an Attack Roll',
    kind({ body: 'Make a {stat} Attack {roll} against an entity.' }),
    'attack'
  );
  check(
    'and a contested roll is just a Roll',
    kind({ body: 'Make a {stat} Roll {roll} against its Reflex.' }),
    'check'
  );
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

/* --------------------------------------------------- a throw off no card at all */

/**
 * VENOMOUS, the one thing in the codex that adds a throw the card never printed.
 *
 * A Wildkin who kept it deals "an additional 1d4 Decay damage" with every weapon
 * attack, and no weapon card anywhere is going to have that sentence on it. So
 * the rider rides on the modifiers as `added` and the plan appends it, which
 * makes this the only link in the file that is not read out of a body.
 *
 * Walked the whole way rather than handed a made-up modifiers object: from the
 * pool pick, through `lineageSwing` and `attackModifiers`, to the dice. A rider
 * that fell off anywhere along that line would be a card that prints a promise
 * and rolls nothing, which is the failure this section exists to catch.
 */
section('a rider may add a whole throw the card never printed');
{
  const kept = (...ids) => ({ ...WHO, lineage: 'wildkin', choices: { 'wildkin-traits': ids } });
  const venomous = kept('venomous', 'scaley');
  const without = kept('sticky', 'scaley');

  check('the kept card is read off the pool', lineageSwing(venomous.lineage, venomous.choices), [
    { from: 'Venomous', card: 'venomous', dice: '1d4', damage: 'Decay' },
  ]);
  check('and a Wildkin who kept something else reads nothing', lineageSwing(without.lineage, without.choices), []);
  check('and neither does another ancestry', lineageSwing('human', {}), []);

  const swing = getCard('melee-light-strike');
  const special = getCard('melee-light-swift-strike');
  const spell = getCard('bramble-whip');

  const mods = attackModifiers(venomous, swing, {});
  check('the swing carries it', mods.added, [{ dice: '1d4', damage: 'Decay', from: 'Venomous' }]);
  /* Every weapon, whatever its tag and whichever of its two attacks: the venom is
     in the Wildkin rather than in the blade. */
  check('a special weapon attack too', attackModifiers(venomous, special, {}).added, [
    { dice: '1d4', damage: 'Decay', from: 'Venomous' },
  ]);
  check('a spell does not', attackModifiers(venomous, spell, {}).added, undefined);
  check('and a Wildkin without it gets no field at all', attackModifiers(without, swing, {}).added, undefined);

  /* "only what modifies it": the card is named under the pay button and the row
     opens it. See attribution.js. */
  check(
    'and it is credited, in the card’s own words',
    (mods.sources ?? []).map((row) => `${row.from}: ${sourceWords(row.gives)}`),
    ['Venomous: adds 1d4 Decay damage']
  );
  check('and the row opens the card', (mods.sources ?? [])[0]?.card, 'venomous');

  /* Last in the chain, so it lands after the check the swing has to pass: venom
     on a miss is venom on nothing. */
  check('the venom is thrown after the swing and its own damage', shape(rollPlan(swing, venomous, mods)), [
    'check:weapon+6',
    'damage:2d6+6',
    'damage:1d4+0',
  ]);
  check('and it is Decay whatever the blade deals', rollPlan(swing, venomous, mods).at(-1).damage, ['Decay']);
  check('and it names the card asking for it', rollPlan(swing, venomous, mods).at(-1).from, 'Venomous');
  check('nothing is appended without it', shape(rollPlan(swing, without, attackModifiers(without, swing, {}))), [
    'check:weapon+6',
    'damage:2d6+6',
  ]);

  /* Empowered adds a die of the kind already rolling and Elevate grows that die.
     Both are written against the dice the *card* rolls, and this handful is not
     the card's: a Fire Infusion on the blade has nothing to say about the venom
     in the hand holding it. */
  const worked = attackModifiers(venomous, swing, { empower: 1, elevate: 1 });
  check('Empower and Elevate grow the blade and leave the venom alone', shape(rollPlan(swing, venomous, worked)), [
    'check:weapon+6',
    'damage:3d8+6',
    'damage:1d4+0',
  ]);

  /* One dose an attack, not one a landing. The card says "your weapon attack".
     A Finesse weapon, so the swing and its landings roll off Instinct and the
     venom off nothing at all: 1d4 is 1d4 in anybody's hands. */
  const flurry = getCard('finesse-flurry');
  const three = rollPlan(flurry, venomous, attackModifiers(venomous, flurry, {}));
  check('a Flurry of three landings is still one dose', shape(three), [
    'check:weapon+5',
    'damage:1d6+5',
    'damage:1d6+5',
    'damage:1d6+5',
    'damage:1d4+0',
  ]);
}

/* ------------------------------------------- what a card says about its own roll
 *
 * New on 2026-09-19, and the plainest bug the sweep found: an Aimed Shot reads
 * "Make an {stat} Ranged Attack {roll} **with disadvantage**" and rolled with no
 * penalty at all, because nothing anywhere read that sentence. Seventeen cards
 * say something about their own roll and every one of them was ignored.
 */

section('a card that bends its own roll is read');
{
  const shot = rollPlan(getCard('bow-aimed-shot'), WHO);
  check('an Aimed Shot rolls with its printed disadvantage', shot[0].disadvantage, 1);
  check('and no advantage it never claimed', shot[0].advantage, 0);

  const smite = rollPlan(getCard('smite'), WHO);
  check('a Smite rolls with its printed advantage', smite[0].advantage, 1);

  const plain = rollPlan(getCard('melee-light-strike'), WHO);
  check('a card that says nothing rolls flat', [plain[0].advantage, plain[0].disadvantage], [0, 0]);

  /* The holder's own arrows are added to the card's rather than replaced by
     them, and the dice cancel the pair. A Bolstered Aimed Shot is one of each. */
  const both = rollPlan(getCard('bow-aimed-shot'), WHO, { advantage: 1 });
  check('the holder and the card both count', [both[0].advantage, both[0].disadvantage], [1, 1]);
}

section('a conditional clause on a card is offered, not applied');
{
  const rend = printedSwing(getCard('ashmaw-rend'));
  check('a prone clause is not rolled', [rend.advantage, rend.disadvantage], [0, 0]);
  check('it is a claim instead', rend.claims.length, 1);
  check('carrying the card’s own words', rend.claims[0].when, 'if it is prone');
  check(
    'and the dice stay flat until it is ticked',
    rollPlan(getCard('ashmaw-rend'), WHO)[0].advantage,
    0
  );

  /* And ticked, through the same fold the use prompt makes. */
  const card = getCard('ashmaw-rend');
  const ticked = withClaims({ advantage: 0 }, WHO, card, [`card:${card.id}:printed-1`]);
  check('ticked, it lends its die', ticked.advantage, 1);
  check('and says so on the receipt', ticked.sources?.[0]?.from, 'Rend');
}

section('a running effect reaches every roll a card asks for');
{
  /* The gap Jules named: "if a character is bolstered he should have advantage
     to all roll". A tracker rider used to reach a weapon attack and a card that
     rolled damage, and stopped there, so a Bolstered Skill Check was flat. */
  const halo = { ...WHO, effects: [{ id: 'h', name: 'Bolster', card: 'bolster', turns: 10 }] };
  const on = (id) => rollPlan(getCard(id), halo, attackModifiers(halo, getCard(id), null));

  check('a Bolstered weapon attack', on('melee-light-strike')[0].advantage, 1);
  check('a Bolstered Skill Check', on('skill-check')[0].advantage, 1);
  check('a Bolstered spell that only shields', attackModifiers(halo, getCard('barrier-spell'), null).advantage, 1);

  /* And the narrowing: a potion written about skill checks is not a die on a
     sword. Both halves matter, which is why both are here. */
  const luck = { ...WHO, effects: [{ id: 'l', name: 'Luck Potion', card: 'luck-potion', turns: 60 }] };
  const lucky = (id) => rollPlan(getCard(id), luck, attackModifiers(luck, getCard(id), null));
  check('a Luck Potion on a Skill Check', lucky('skill-check')[0].advantage, 1);
  check('and nothing on a sword', lucky('melee-light-strike')[0].advantage, 0);
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
