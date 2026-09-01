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
  applyPlan,
  characterDelta,
  clauseAim,
  clauseThrow,
  deltaWords,
  landHit,
  struck,
} from '../src/lib/combatApply.js';
import {
  applyToFoes,
  encounterState,
  foeActor,
  layOnFoes,
  normalizeRun,
  rollInitiative,
} from '../src/lib/encounters.js';
import { layEffect } from '../src/lib/combatTurn.js';
import { rollPlan } from '../src/lib/rollPlan.js';
import { turnTriggers } from '../src/lib/turnTriggers.js';
import { CARDS, getCard } from '../src/lib/weapons.js';

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
  });
  check('the Shield takes its share', body.shield, 0);
  check('Health takes the rest', body.health, 18);
  check('and the ledger says who', body.ledger[0].note, '2.Fenrat: Blightbolt');
  check('healing caps at the ceiling', characterDelta(before, { kind: 'healing', amount: 99, note: '' }).health, 50);
  check(
    'a change that moves nothing writes nothing',
    characterDelta({ ...before, health: 50 }, { kind: 'healing', amount: 5, note: '' }),
    null
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

/* ------------------------------------------------------------------ the exit */

if (findings.length > 0) {
  console.error(`\ncombat manager: ${findings.length} ${findings.length === 1 ? 'finding' : 'findings'}\n`);
  for (const finding of findings) console.error(finding + '\n');
  process.exit(1);
}

console.log('combat manager: targets counted, landings soaked, boundaries rolled');
