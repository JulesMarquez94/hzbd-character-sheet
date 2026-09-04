/**
 * The combat manager, proved. Covers the promises targeting.js and
 * combatApply.js make and the two encounter writers built on them: **a card's
 * target count is read off its own text and a Multicast raises it, the
 * arithmetic of a landing is Armor per hit then Shield then Health, a resolved
 * boundary clause hands its dice back, and a delivery laid twice lands once.**
 *
 *   node scripts/check-combat.mjs         report and exit 1 on any finding
 *   node scripts/check-combat.mjs --list  print every check and the census
 *
 * The cards named below are real rows in the codex, picked because each is the
 * canonical printing of one shape: BRAMBLE WHIP is "an entity" with a Multicast,
 * STRANGLING ROOTS is "up to 3", ENTANGLING ROOTS is an area, RENEW is the
 * heal-over-time whose Turn Start clause the prompts must find and roll, and
 * PARASITIC SPORE is the Turn End damage with an Upkeep. A rename in the codex
 * fails here by name rather than quietly unwiring a fight.
 */

import { targetPlan } from '../src/lib/targeting.js';
import {
  aimHits,
  aimOutcomes,
  applyPlan,
  armCheck,
  characterDelta,
  clauseAim,
  clauseThrow,
  deltaWords,
  landHit,
  struck,
} from '../src/lib/combatApply.js';
import {
  applyToFoes,
  askInitiative,
  closeInitiative,
  encounterState,
  foeActor,
  foldInitiative,
  initiativeAsk,
  layOnFoes,
  normalizeRun,
  rollInitiative,
} from '../src/lib/encounters.js';
import { initiativeCallEvent } from '../src/lib/campaignLog.js';
import { castPlan, conjuredBody, spendUse } from '../src/lib/combatBar.js';
import { layEffect, normalizeEffects } from '../src/lib/combatTurn.js';
import { MARTIAL_MOVES, getMartialMove } from '../src/lib/martial.js';
import { aimingMoves } from '../src/lib/moves.js';
import { effectLine, runningRiders } from '../src/lib/riders.js';
import { rollPlan } from '../src/lib/rollPlan.js';
import {
  STATUSES,
  healedEffects,
  inflictedStatuses,
  movedEffects,
  runningNames,
} from '../src/lib/statuses.js';
import { turnTriggers } from '../src/lib/turnTriggers.js';
import { CARDS, getCard } from '../src/lib/weapons.js';
import { getKeyword } from '../src/lib/keywords.js';
import { addConjured } from '../src/lib/encounters.js';

const LIST = process.argv.includes('--list');
const findings = [];
const note = (what, said) => findings.push(`  ${what}\n    ${said}`);

function check(what, got, want) {
  const same = JSON.stringify(got) === JSON.stringify(want);
  if (LIST) console.log(`  ${same ? 'ok  ' : 'FAIL'} ${what}${same ? '' : `  got ${JSON.stringify(got)}`}`);
  if (!same) note(what, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

function section(title) {
  if (LIST) console.log(`\n===== ${title} =====`);
}

/** A card the checker is built on, fetched by name so a rename fails loudly. */
function card(id) {
  const found = getCard(id);
  if (!found) note(`the codex still holds ${id}`, 'got nothing. A check below is now checking air.');
  return found ?? {};
}

/* =============================================================== the targets */

section('a target count is the card’s own text');
{
  check('BRAMBLE WHIP lands on an entity', targetPlan(card('bramble-whip')), { some: true, count: 1 });
  check('STRANGLING ROOTS reaches up to 3', targetPlan(card('strangling-roots')), {
    some: true,
    count: 3,
  });
  check('ENTANGLING ROOTS is an area, uncounted', targetPlan(card('entangling-roots')), {
    some: true,
    count: null,
  });
  check('MOVE reaches nobody', targetPlan(card('move')), { some: false, count: 0 });
}

section('the second half moves the count only once it is taken');
{
  check('an untaken Multicast adds nothing', targetPlan(card('bramble-whip'), { times: 0 }), {
    some: true,
    count: 1,
  });
  check('a Multicast taken twice catches two more', targetPlan(card('bramble-whip'), { times: 2 }), {
    some: true,
    count: 3,
  });
  check(
    'GIANT GROWTH’s per-entity Multicast reads the same way',
    targetPlan(card('giant-growth'), { times: 1 }),
    { some: true, count: 2 }
  );
  check(
    'RENEW’s taken Overcast reaches every affected entity',
    targetPlan(card('renew'), { times: 1 }),
    { some: true, count: null }
  );
}

section('a rider rewrites the swing’s reach');
{
  /* A Martial Move added to a swing can rewrite who it lands on: SWEEP's "made
     against every entity within your reach" turned a one-target Strike into a
     room, found by Jules swinging one on 2026-09-01. SWEEP left the codex in the
     redesign of 2026-09-02 and the reading did not, because the day one comes
     back the picker has to know.

     **Which riders are read is data, not prose.** `aims` on the card says so, and
     `aimingMoves` is the filter every caller passes its chosen moves through. That
     is the whole guard against COORDINATED ATTACK, whose "an ally within reach of
     the target" names somebody who *acts*: a prose reader counts it as a target,
     and a target chip picked there would deliver the swing's damage to a friend. */
  const aiming = { id: 'test-sweep', name: 'Sweep', aims: true, body: 'Your next Weapon Attack is made against **every entity** within your reach.' };
  check(
    'a swing with an aiming move on it is uncapped',
    targetPlan(card('bramble-whip'), { riders: aimingMoves([aiming]) }),
    { some: true, count: null }
  );
  check(
    'and with nothing added it stays one',
    targetPlan(card('bramble-whip'), { riders: [] }),
    { some: true, count: 1 }
  );

  /* COORDINATED ATTACK is the card the flag exists for. Its own text reads as one
     target and it is not one, so the filter must drop it and the plan must not
     move. */
  const ally = getMartialMove('coordinated-attack');
  check('the codex still holds COORDINATED ATTACK', Boolean(ally), true);
  check('and it does not claim to aim', aimingMoves([ally]).length, 0);
  check(
    'so a swing carrying it reaches exactly one body',
    targetPlan(card('bramble-whip'), { riders: aimingMoves([ally]) }),
    { some: true, count: 1 }
  );

  /* And nothing in the codex aims today, which is the state the flag was
     introduced in. A move that grows one has to be a deliberate act. */
  check('no move in the codex aims yet', aimingMoves(MARTIAL_MOVES).length, 0);
}

section('the census: how much of the codex reaches other bodies');
{
  let some = 0;
  let counted = 0;
  let open = 0;
  for (const row of CARDS) {
    const plan = targetPlan(row);
    if (!plan.some) continue;
    some += 1;
    if (plan.count === null) open += 1;
    else counted += 1;
  }
  if (LIST) {
    console.log(`  ${some} of ${CARDS.length} cards reach other bodies`);
    console.log(`  ${counted} carry a count and ${open} are uncounted areas`);
  }
  check('a healthy share of the codex is targetable at all', some > 100, true);
}

/* ============================================================ the arithmetic */

section('a landing is Armor first, then Shield, then Health');
{
  check('Armor comes off the hit', landHit({ shield: 0, armor: 2 }, 7), {
    soaked: 0,
    dealt: 5,
    through: 5,
  });
  check('the Shield soaks what is left', landHit({ shield: 3, armor: 2 }, 7), {
    soaked: 3,
    dealt: 2,
    through: 5,
  });
  check('Armor cannot heal', landHit({ shield: 0, armor: 9 }, 4), {
    soaked: 0,
    dealt: 0,
    through: 0,
  });

  /* Three landings of 6 against Armor 2 are 12 through, not 16: Armor is per
     hit, which is the whole reason landings stay separate. */
  check('Armor is per landing', struck({ shield: 0, health: 30, armor: 2 }, [6, 6, 6]), {
    shield: 0,
    health: 18,
    soaked: 0,
    dealt: 12,
  });
  check('an enemy floors at nothing', struck({ shield: 2, health: 5, armor: 0 }, [20]).health, 0);
  check(
    'a character runs past zero to their own floor',
    characterDelta(
      { shield: 0, health: 4, health_max: 50, defense: 0, ledger: [] },
      { kind: 'damage', amount: 999, note: 'the test' }
    ).health,
    -50
  );
}

section('what a chain adds up to, one row per kind');
{
  const rows = applyPlan([
    { kind: 'damage', total: 6, damage: ['Fire'] },
    { kind: 'damage', total: 4, damage: ['Fire'] },
    { kind: 'healing', total: 5, damage: [] },
    { kind: 'roll', total: 9, damage: [] },
  ]);
  check('damage keeps its landings apart', rows[0], {
    kind: 'damage',
    total: 10,
    landings: [6, 4],
    types: ['Fire'],
  });
  check('healing rides along and a bare roll lands on nobody', rows.length, 2);
  check('and it says itself', deltaWords(rows[0]), '10 Fire damage');
}

section('a delivery applied to a character goes through its own pools');
{
  const before = { shield: 3, health: 20, health_max: 50, defense: 2, ledger: [] };
  const body = characterDelta(before, {
    kind: 'damage',
    landings: [7],
    note: '2.Fenrat: Blightbolt',
    types: ['Necrotic'],
  });
  check('the Shield takes its share', body.shield, 0);
  check('Health takes the rest', body.health, 18);
  /* The source *and* the effect, which is the whole of what Jules asked the row
     to carry on 2026-09-03. The number is the row's own delta. */
  check(
    'and the ledger says who and what',
    body.ledger[0].note,
    '2.Fenrat: Blightbolt · Necrotic damage'
  );
  check(
    'healing says so too, so a sign is not the only clue',
    characterDelta(before, { kind: 'healing', amount: 6, note: 'Nyx: Mending Word' }).ledger[0].note,
    'Nyx: Mending Word · healing'
  );
  check('healing caps at the ceiling', characterDelta(before, { kind: 'healing', amount: 99, note: '' }).health, 50);
  check(
    'a change that moves nothing writes nothing',
    characterDelta({ ...before, health: 50 }, { kind: 'healing', amount: 5, note: '' }),
    null
  );
}

/* ============================================== what a spend writes down */

/**
 * A Willpower spend leaves a word behind, and it names the card and where the
 * card came from. Jules, 2026-09-03: "the cost in willpower need to be logged
 * with the source and effect."
 *
 * The two shapes of source are both here, because they read differently: a chip
 * whose source already opens with the card's name must not say it twice, and the
 * hand group's source names the *weapon* and so has to keep both halves.
 */
section('a Willpower spend writes its own ledger row');
{
  const holder = { ap: 6, willpower: 12, health: 40, health_max: 40, ledger: [] };

  const cast = spendUse(
    { name: 'Fireball', source: 'Fireball · Arcanist', ap: 2, wp: 4, card: null },
    holder,
    'action',
    2
  );
  check('the pool moves', cast.willpower, 8);
  check('one row, on the Willpower ledger', cast.ledger.length, 1);
  check('signed by the card and its source', cast.ledger[0].note, 'Fireball · Arcanist');
  check('as a spend', [cast.ledger[0].kind, cast.ledger[0].delta, cast.ledger[0].balance], [
    'willpower',
    -4,
    8,
  ]);

  const swing = spendUse(
    { name: 'Cleave', source: 'Longsword · in hand', ap: 2, wp: 2, card: null },
    holder,
    'action',
    2
  );
  check('a swing keeps both halves', swing.ledger[0].note, 'Cleave · Longsword · in hand');

  check(
    'a use that costs no Willpower writes nothing',
    spendUse({ name: 'Move', source: 'Move · a basic action', ap: 1, wp: 0, card: null }, holder, 'action', 1)
      .ledger,
    undefined
  );

  /* Waved through means waved through: not a point, and not a row saying a point
     went. See `free` in spendUse. */
  check(
    'and a waved-through use writes nothing either',
    spendUse(
      { name: 'Fireball', source: 'Fireball · Arcanist', ap: 2, wp: 4, card: null },
      holder,
      'action',
      2,
      { free: true }
    ).ledger,
    undefined
  );

  /* Both pools in one write, because a use that costs both is one use. */
  const tithed = spendUse(
    { name: 'Blood Spear', source: 'Blood Spear · Arcanist', ap: 1, wp: 3, card: null },
    holder,
    'action',
    1,
    { price: { ap: 1, wp: 3, health: 5 } }
  );
  check('two rows, one write', tithed.ledger.length, 2);
  check(
    'Willpower first, then the tithe',
    tithed.ledger.map((row) => row.kind),
    ['health', 'willpower']
  );
}

/* ======================================================= the encounter writers */

section('a rolled result lands on enemies in one write');
{
  const enc = {
    foes: [
      { key: 'a', creature: 'blightgeist', shield: 2 },
      { key: 'b', creature: 'blightgeist' },
    ],
  };
  const hit = applyToFoes(enc, [
    { key: 'a', kind: 'damage', landings: [6] },
    { key: 'b', kind: 'damage', landings: [6] },
  ]);
  const after = encounterState({ ...enc, ...hit });
  /* The Blightgeist wears no armor, so 6 lands whole: 2 into the Shield on the
     first and the rest through, all of it through on the second. */
  check('the shielded one soaks first', [after[0].shield, after[0].health], [0, 4]);
  check('the bare one takes it all', after[1].health, 2);
  check('a heal caps at the page’s own ceiling', encounterState({
    ...enc,
    ...applyToFoes({ ...enc, ...hit }, [{ key: 'b', kind: 'healing', landings: [99] }]),
  })[1].health, 8);
}

section('an effect lays on targets, and lands once however often it arrives');
{
  const enc = { foes: [{ key: 'a', creature: 'blightgeist' }, { key: 'b', creature: 'blightgeist' }] };
  const entry = { name: 'Renew', card: 'renew', turns: 2, until: null, from: '1.Blightgeist' };

  const once = layOnFoes(enc, ['a', 'b'], entry, { lay: layEffect });
  const twice = layOnFoes({ ...enc, ...once }, ['a'], entry, { lay: layEffect });
  const state = encounterState({ ...enc, ...twice });

  check('both targets carry the row', [state[0].effects.length, state[1].effects.length], [1, 1]);
  check('relaid is refreshed, never doubled', state[0].effects.length, 1);
  check('and the row says who laid it', state[0].effects[0].from, '1.Blightgeist');
}

/* ================================================================== the order */

section('the roll that starts a fight waits on whoever won it');
{
  const enc = { foes: [{ key: 'a', creature: 'blightgeist' }] };
  const seat = {
    character_id: 'kaelen-id',
    name: 'Kaelen',
    initiative: 99,
    avoid: 15,
    reflex: 12,
    grit: 11,
  };

  /* A fixed die: everybody rolls the same faces, so the seat's Initiative of 99
     is what puts the player first. */
  const rolled = rollInitiative(enc, [seat], { random: () => 0.5 });

  check('the player is first', rolled.run.order[0].ref, 'kaelen-id');
  /* The bug this pins down: the fight used to start with `awaiting` empty, so
     the winner's own End Turn moved nothing until the Game Master pressed
     something. Found by Lark winning initiative. */
  check('and the runner is already waiting on them', rolled.run.awaiting, 'kaelen-id');

  check('a body in the order carries what a roll against it is judged by', rolled.run.order[0].defenses, {
    avoid: 15,
    reflex: 12,
    grit: 11,
  });
  check(
    'and the stored run keeps it through a reload',
    normalizeRun(rolled.run).order[0].defenses,
    { avoid: 15, reflex: 12, grit: 11 }
  );
  check(
    'an enemy carries its own three',
    normalizeRun(rolled.run).order[1].defenses.avoid > 0,
    true
  );
}

/* --------------------------------------------------------- the players' dice
 * "Make it so it prompt a roll for player with initiative and not just
 * automatic" (Jules, 2026-09-04). The press asks, each player answers with
 * their own throw off the table log, and the last answer starts the fight.
 * Everything below is about the ask being impossible to get stuck in.
 */

section('initiative is asked for, not taken');
{
  const enc = { foes: [{ key: 'a', creature: 'blightgeist' }] };
  const seat = {
    character_id: 'kaelen-id',
    name: 'Kaelen',
    initiative: 9,
    avoid: 15,
    reflex: 12,
    grit: 11,
  };
  const half = { random: () => 0.5 };

  const asked = { ...enc, ...askInitiative(enc, [seat], { ...half, call: 'call-1' }) };
  const run = normalizeRun(asked.run);

  check('the fight is not live yet', [run.live, run.order.length], [false, 0]);
  check('the enemies have rolled all the same', run.pending.foes.length, 1);
  check('and the player is being waited on', initiativeAsk(asked).waiting[0].name, 'Kaelen');
  check('with nothing to start on', initiativeAsk(asked).ready, false);

  /* The event that carries the ask. Its `chain` is the call, which is what
     makes a player's throw land in this entry and in this fight. */
  const said = initiativeCallEvent(initiativeAsk(asked).waiting, {
    encounter: 'enc-1',
    call: 'call-1',
  });
  check('the ask is addressed with its own call', [said.data.move, said.data.chain], [
    'init-call',
    'call-1',
  ]);
  check('and names who is rolling', said.detail, 'Kaelen to roll');

  /* The answer: a total this file did not decide, off the player's own row. */
  const folded = { ...asked, ...foldInitiative(asked, { call: 'call-1', ref: 'kaelen-id', init: 21, tie: 9 }) };
  check('their own total is what is kept', initiativeAsk(folded).answered[0].init, 21);
  check('and the ask is ready to close', initiativeAsk(folded).ready, true);

  check(
    'an answer to some other call is refused',
    foldInitiative(folded, { call: 'call-2', ref: 'kaelen-id', init: 30 }),
    null
  );
  /* A panel that came back after a reload must not be a re-roll. The first
     answer stands and both throws are still in the log. */
  check(
    'and a second answer for one body is refused',
    foldInitiative(folded, { call: 'call-1', ref: 'kaelen-id', init: 30 }),
    null
  );

  const started = closeInitiative(folded, half);
  check('the order is the player first on 21', started.run.order[0].init, 21);
  check('the runner waits on them at once', started.run.awaiting, 'kaelen-id');
  check('their defenses came through the ask', started.run.order[0].defenses, {
    avoid: 15,
    reflex: 12,
    grit: 11,
  });
  check('and nothing is left pending', normalizeRun(started.run).pending, null);
}

section('an ask nobody answers still starts a fight');
{
  const enc = { foes: [{ key: 'a', creature: 'blightgeist' }] };
  const seat = { character_id: 'lark-id', name: 'Lark', initiative: 99 };
  const half = { random: () => 0.5 };

  const asked = { ...enc, ...askInitiative(enc, [seat], { ...half, call: 'call-1' }) };
  /* The escape hatch: a shut laptop, a player in the kitchen. Whoever never
     threw is rolled for, on the Initiative their sheet had when the ask went
     out, which is why 99 still wins. */
  const started = closeInitiative(asked, half);
  check('whoever is missing is rolled for', started.run.order[0].ref, 'lark-id');
  check('on the number their sheet had', started.run.order[0].init > 99, true);

  /* And the ask survives a write: the whole block has to come back off the
     stored row, or a Game Master who reloads mid-ask loses the fight. */
  const reloaded = { ...enc, run: JSON.parse(JSON.stringify(asked.run)) };
  check('an ask read back off the row is the same ask', initiativeAsk(reloaded).waiting[0].ref, 'lark-id');
  check('and holds the enemies it already rolled', normalizeRun(reloaded.run).pending.foes.length, 1);
}

section('a table with nobody seated is not kept waiting');
{
  const enc = { foes: [{ key: 'a', creature: 'blightgeist' }] };
  const rolled = askInitiative(enc, [], { random: () => 0.5, call: 'call-1' });
  check('the press rolls the enemies and starts', rolled.run.live, true);
  check('with nothing pending', rolled.run.pending, null);
}

section('a check knows which of the target’s numbers it is against');
{
  const who = { instinct: 6, physique: 4, mind: 5 };
  const checkOf = (id) => rollPlan(card(id), who).find((link) => link.shape === 'check');

  check('an attack is against Defense', checkOf('bramble-whip')?.against, 'avoid');
  check('“against the Reflex of” is against Reflex', checkOf('strangling-roots')?.against, 'reflex');
  check(
    '“against the Grit of” is against Grit',
    checkOf('sleeping-spores')?.against,
    'grit'
  );
}

section('an aimed check carries what it is judged by');
{
  const link = { shape: 'check', against: 'avoid', askDc: true, askVerdict: true };
  const a = { id: 'a', kind: 'foe', name: 'A', defenses: { avoid: 15, reflex: 12, grit: 11 } };
  const b = { id: 'b', kind: 'member', name: 'B', defenses: { avoid: 17, reflex: 14, grit: 15 } };

  const one = armCheck(link, [a]);
  check('one number arms the dc and never asks', [one.dc, one.askDc], [15, false]);

  const many = armCheck(link, [a, b]);
  check(
    'differing numbers judge per body instead',
    [many.dc, many.askDc, many.askVerdict, many.judged?.length],
    [null, false, false, 2]
  );

  check(
    'a target with no numbers keeps the question',
    armCheck(link, [{ id: 'x', kind: 'foe', name: 'X', defenses: null }]).askDc,
    true
  );

  const outcomes = aimOutcomes(16, many.judged);
  check('one total, judged against each', outcomes.map((entry) => entry.verdict), [
    'success',
    'failure',
  ]);
  check('the hits are exactly who it caught', aimHits(outcomes).map((entry) => entry.id), ['a']);
  check(
    'six over somebody is a critical against them alone',
    aimOutcomes(21, many.judged).map((entry) => entry.verdict),
    ['critical-success', 'success']
  );
}

/* ============================================================== the boundaries */

section('a boundary clause hands its dice back, resolved');
{
  /* RENEW on an enemy: the prompts read the clause with the numbers already
     worked out for the body holding the row, and the Roll button needs the
     handful the sentence names. */
  const enc = {
    foes: [
      {
        key: 'a',
        creature: 'blightgeist',
        effects: [{ id: 'fx1', name: 'Renew', card: 'renew', turns: 2 }],
      },
    ],
  };
  const foe = encounterState(enc)[0];
  const triggers = turnTriggers(foeActor(foe), 'start');

  check('the Turn Start clause is found on the enemy', triggers.rows.length, 1);

  const clause = triggers.rows[0]?.clauses?.[0] ?? '';
  const spec = clauseThrow(clause);
  check('its dice come back as a throw', spec?.dice, ['1d6']);
  check('with the resolved flat on it', spec?.flat > 0, true);
  check('read as the healing it is', spec?.kind, 'healing');

  check('a clause with no dice offers no throw', clauseThrow('You are rooted until it ends.'), null);
  check(
    'a clause about the holder aims at the holder',
    clauseAim('At your Turn Start, regain 1d6 + 4 Health.'),
    'self'
  );
  check(
    'a clause pointing at a target does not',
    clauseAim('At your Turn End, the spore deals 2d6 + 8 damage to the target.'),
    'other'
  );
}

/* ============================================================ the conditions
 *
 * Jules, 2026-09-04: "if I use renew it applies the effect to the target. Or
 * snake it create the poison status." What a card inflicts is read off its
 * prose by statuses.js, and every reading below is a real card picked because
 * it is the canonical printing of one shape: SNAKE! is "the target is
 * poisoned", ENTANGLING ROOTS is a condition with the card's own clock, SHOVE
 * leaves the knock-down to a choice, SEEDLING SPIRITS *removes* three and
 * inflicts none, and STONEFLESH refuses one. A card rewritten in the codex
 * fails here by name.
 */

section('every condition is a glossary word');
{
  for (const [id, status] of Object.entries(STATUSES)) {
    check(`${id} is lit in the glossary`, Boolean(getKeyword(id)), true);
    check(`${id} says what it does`, Boolean(status.line), true);
  }
}

section('a card inflicts what its own sentence says');
{
  const ids = (card, options) => inflictedStatuses(card, options).map((hit) => `${hit.id}${hit.optional ? '?' : ''}`);

  check('SNAKE! poisons', ids(card('snake')), ['poisoned']);
  check('FORCE INEBRIATION poisons on a success', ids(card('force-inebriation')), ['poisoned']);
  check('ENTANGLING ROOTS roots', ids(card('entangling-roots')), ['rooted']);
  check('IMPALING GROVE roots and knocks prone, both certain', ids(card('impaling-grove')), ['rooted', 'prone']);
  check('SHOVE leaves the knock-down to a choice', ids(card('shove')), ['prone?']);
  check('DRIVE BACK does too', ids(card('drive-back')), ['prone?']);
  check('MAGMA CHAINS stuns now and roots later', ids(card('magma-chains')), ['stunned', 'rooted?']);
  check('DROWNING EARTH sinks one stage at a time', ids(card('drowning-earth')), ['rooted', 'constrained?']);
  check('REND bleeds and WOUND wounds', [ids(card('rend')), ids(card('wound'))], [['bleed'], ['wound']]);
  check('GRAPPLE grapples', ids(card('grapple')), ['grappled']);
  check('DEVOURING BLOSSOM swallows into a grapple', ids(card('devouring-blossom')), ['grappled']);

  /* The half inflicts only once it is taken. */
  check('BLIGHT POLLEN diseases only with the tithe', [ids(card('blight-pollen')), ids(card('blight-pollen'), { half: true })], [[], ['diseased']]);
  check('CLOAK OF FLAMES burns only when it flares', [ids(card('cloak-of-flames')), ids(card('cloak-of-flames'), { half: true })], [[], ['burn']]);

  /* And the word used any other way inflicts nothing. */
  check('SEEDLING SPIRITS sheds and inflicts nothing', ids(card('seedling-spirits')), []);
  check('CAUTERIZE removes and inflicts nothing', ids(card('cauterize')), []);
  check('STONEFLESH refuses to be knocked prone', ids(card('stoneflesh')), []);
  check('TREMOR SENSE ignores blinded', ids(card('tremor-sense')), []);
  check('BIRD VIEW incapacitates its caster, not a target', ids(card('bird-view')), []);
  check('AMBUSH names conditions as preconditions', ids(card('ambush')), []);
  check('NIGHTMARE’S CURSE cannot fall asleep', ids(card('nightmares-curse')), []);
}

section('a condition lands with its clock, and where the card says');
{
  const who = { name: 'Lark', instinct: 6, physique: 4, mind: 5 };
  const plan = (id, options = {}) => {
    const c = card(id);
    return castPlan({ name: c.name, card: c, source: 'test' }, who, { plan: rollPlan(c, who), ...options });
  };

  const snake = plan('snake');
  check('SNAKE! lays Poisoned until a Long Rest, off the glossary', snake.laid.map((row) => [row.status, row.turns, row.until]), [['poisoned', null, 'long']]);
  check('and names the card that did it', snake.laid[0].card, 'snake');

  const roots = plan('entangling-roots');
  check('ENTANGLING ROOTS roots for the ten turns its sentence says', roots.laid.map((row) => [row.status, row.turns]), [['rooted', 10]]);
  check('and keeps the vines on the caster', roots.landsOn, 'caster');

  check('CHRONO LOCK stuns until the next turn', plan('chrono-lock').laid.map((row) => [row.status, row.turns]), [['stunned', 1]]);
  check('SLAG SHOT burns until a Short Rest', plan('slag-shot').laid.map((row) => [row.status, row.until]), [['burn', 'short']]);

  /* Where the card's own row goes when bodies are picked. */
  check('RENEW rides to the target', plan('renew').landsOn, 'targets');
  check('GIANT GROWTH rides to the target', plan('giant-growth').landsOn, 'targets');
  check('PARASITIC SPORE is the caster’s toll and the target’s affliction', plan('parasitic-spore').landsOn, 'both');
  check('THORN RAMPART stays with its caster', plan('thorn-rampart').landsOn, 'caster');
  check('HIDE stays on the hider', plan('hide').landsOn, 'caster');
  check('a potion stays on the drinker', plan('titansbane-poison').landsOn, 'caster');

  /* An optional condition lands only when the prompt ticks it. */
  check('SHOVE lays nothing unticked', plan('shove').laid.length, 0);
  check('and Prone when ticked', plan('shove', { statuses: ['prone'] }).laid.map((row) => row.status), ['prone']);

  /* A Bleed counts its stacks off the dice the swing throws. */
  const strike = card('finesse-strike');
  const swing = castPlan({ name: 'Strike', card: strike, source: 'test' }, who, {
    riders: [card('rend')],
    plan: rollPlan(strike, who, { empower: 1 }),
  });
  check('REND on an Empowered Strike is two stacks of Bleed', swing.laid.map((row) => row.status), ['bleed', 'bleed']);
}

section('a condition is one row, and Bleed is many');
{
  const poison = { name: 'Poisoned', card: 'snake', status: 'poisoned', turns: null, until: 'long', from: 'Lark' };
  const again = { ...poison, card: 'toxic-toad', from: 'Nyx' };
  const bleed = { name: 'Bleed', card: 'rend', status: 'bleed', turns: null, until: null, from: 'Lark' };

  const list = layEffect(layEffect(layEffect(layEffect([], poison), again), bleed), bleed);
  check('two poisonings are one Poisoned', list.filter((row) => row.status === 'poisoned').length, 1);
  check('refreshed by the second', list.find((row) => row.status === 'poisoned').from, 'Nyx');
  check('two Bleeds are two stacks', list.filter((row) => row.status === 'bleed').length, 2);
  check('the status survives the store', normalizeEffects(JSON.stringify(list)).map((row) => row.status), ['bleed', 'bleed', 'poisoned']);

  /* A card that lays its own row and a condition is two rows. */
  const vines = layEffect(layEffect([], { name: 'Entangling Roots', card: 'entangling-roots', turns: 10 }), { name: 'Rooted', card: 'entangling-roots', status: 'rooted', turns: 10 });
  check('a card row and its condition do not collapse', vines.length, 2);
}

section('a condition moves the numbers and says so');
{
  const list = [
    { id: 'a', name: 'Poisoned', status: 'poisoned', turns: null },
    { id: 'b', name: 'Diseased', status: 'diseased', turns: null },
    { id: 'c', name: 'Poisoned', status: 'poisoned', turns: null },
  ];
  const total = runningRiders(list);
  check('Poisoned is Disadvantage, once however often', total.disadvantage, 1);
  check('Diseased is a point off each attribute', total.attributes, { physique: -1, instinct: -1, mind: -1 });
  check('and each row says what it does', effectLine(list[0]), STATUSES.poisoned.line);
  check('a card row still reads its rider', effectLine({ card: 'giant-growth' }), 'Movement Speed doubled, and your damage Empowered by 1');
  check('a body wears its running names', runningNames([...list, { name: 'Ended', status: 'prone', turns: 0 }]), ['Poisoned', 'Diseased', 'Poisoned']);
}

section('healing and moving clear what the glossary says they clear');
{
  const list = [
    { id: 'a', name: 'Poisoned', status: 'poisoned', turns: null },
    { id: 'b', name: 'Bleed', status: 'bleed', turns: null },
    { id: 'c', name: 'Bleed', status: 'bleed', turns: null },
    { id: 'd', name: 'Prone', status: 'prone', turns: null },
    { id: 'e', name: 'Renew', card: 'renew', turns: 2 },
  ];
  check('a heal washes Poisoned and one stack of Bleed', healedEffects(list).map((row) => row.name), ['Bleed', 'Prone', 'Renew']);
  check('a Move stands you up', movedEffects(list).map((row) => row.name), ['Poisoned', 'Bleed', 'Bleed', 'Renew']);
  check('and neither touches a list with nothing to clear', [healedEffects([list[4]]), movedEffects([list[4]])], [null, null]);

  /* Through the delivery arithmetic, on a sheet. */
  const healed = characterDelta(
    { shield: 0, health: 10, health_max: 40, defense: 0, ledger: [], effects: list },
    { kind: 'healing', amount: 5, note: 'Nyx: Mending Word' }
  );
  check('a delivered heal clears them on the sheet', healed.effects.map((row) => row.name), ['Bleed', 'Prone', 'Renew']);

  /* And the Move, through the spend. */
  const stood = spendUse(
    { name: 'Move', source: 'Move · a basic action', ap: 1, wp: 0, card: card('move') },
    { ap: 6, willpower: 4, health: 10, health_max: 40, effects: [list[3]], ledger: [] },
    'action',
    1
  );
  check('paying for a Move takes Prone off', stood.effects, []);
}

section('a condition row reads the target’s boundary and not the caster’s');
{
  const who = { name: 'Goblin', instinct: 4, physique: 4, mind: 3 };
  const swallowed = turnTriggers(
    { ...who, effects: [{ id: 'g', name: 'Grappled', card: 'devouring-blossom', status: 'grappled', turns: null }] },
    'start'
  );
  check('the swallowed one takes its damage at its own Turn Start', swallowed.rows.length, 1);
  check('and only that clause', swallowed.rows[0].clauses.length, 1);

  const snapping = turnTriggers(
    { ...who, effects: [{ id: 'g', name: 'Grappled', card: 'devouring-blossom', status: 'grappled', turns: null }] },
    'end'
  );
  check('the flower snapping is the caster’s Turn End, not the goblin’s', snapping.any, false);

  const bleeding = turnTriggers({ ...who, effects: [{ id: 'b', name: 'Bleed', status: 'bleed', turns: null }] }, 'start');
  check('a stack of Bleed says what it does at a Turn Start', bleeding.rows[0]?.clauses, ['Takes 1d6 damage at its Turn Start.']);
  check('and hands back dice to roll', clauseThrow(bleeding.rows[0]?.clauses[0])?.dice, ['1d6']);
}

/* ================================================================ the conjured
 *
 * "If something is created like with hard light in the target it should
 * appear, become a target with proper health." The body is read off the card
 * for the caster, put in the pile under the caster's key and struck like any
 * enemy.
 */

section('a spell that makes a body says how much Health it has');
{
  const who = { name: 'Lark', instinct: 6, physique: 4, mind: 5 };
  const wall = conjuredBody(card('hard-light'), who);
  check('HARD LIGHT is ten times the caster’s Mind', [wall?.health_max, wall?.avoid], [50, 10]);
  check('and is named after the card', [wall?.name, wall?.card], ['Hard Light', 'hard-light']);
  check('DEVOURING BLOSSOM is a body too', conjuredBody(card('devouring-blossom'), who)?.health_max, 50);
  check('GUARDIAN ANGEL has Health and no Defense', [conjuredBody(card('guardian-angel'), who)?.health_max, conjuredBody(card('guardian-angel'), who)?.avoid], [100, 0]);
  check('a sacrifice is a cost and not a body', conjuredBody(card('gore-armor'), who), null);
  check('and a spell with no body makes none', conjuredBody(card('renew'), who), null);

  const enc = addConjured({ foes: [{ key: 'a', creature: 'blightgeist' }] }, wall, 'wall0001');
  const made = encounterState(enc).find((foe) => foe.key === 'wall0001');
  check('it stands in the pile under its own name', [made?.title, made?.stats.health_max, made?.stats.avoid], ['Hard Light', 50, 10]);
  check('wearing the Conjured rank and knowing no moves', [made?.rank.id, made?.moves.length], ['conjured', 0]);
  check('twice under one key lands once', addConjured(enc, wall, 'wall0001'), null);

  const struckWall = encounterState({ ...enc, ...applyToFoes(enc, [{ key: 'wall0001', kind: 'damage', landings: [30] }]) }).find((foe) => foe.key === 'wall0001');
  check('and it takes damage like any body', struckWall?.health, 20);

  const rolled = rollInitiative(enc, [], { random: () => 0.5 });
  check('but takes no turn of its own', rolled.run.order.map((entry) => entry.ref), ['a']);
}

/* ------------------------------------------------------------------ the exit */

if (findings.length > 0) {
  console.error(`\ncombat manager: ${findings.length} ${findings.length === 1 ? 'finding' : 'findings'}\n`);
  for (const finding of findings) console.error(finding + '\n');
  process.exit(1);
}

console.log('combat manager: targets counted, landings soaked, boundaries rolled');
