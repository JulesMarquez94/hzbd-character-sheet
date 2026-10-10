/**
 * Tracker-rider round trip. Proves the promise src/lib/riders.js makes:
 * **a card on the tracker moves the number its own text names, and dropping the
 * row moves it back.**
 *
 *   node scripts/check-riders.mjs        report and exit 1 on any finding
 *   node scripts/check-riders.mjs --list print every rider, then exit 0
 *
 * The risk this covers is not arithmetic, it is *reachability*. The table in
 * riders.js is keyed by card id, and a typo in a key is a rider that silently
 * does nothing: the row lands, the card prints, the Speed does not move and
 * nothing anywhere says why. So every key is resolved against the codex, every
 * rider is walked from a stored effects row through to the number on the tile,
 * and the ones that bend a swing are walked to the printed attack instead.
 *
 * `check-stat-math.mjs` is the other half and they do not overlap: that one
 * proves the *line* under a tile adds up to the tile, this one proves the tile
 * moved at all.
 */

import { BLANK_CHARACTER, liveCharacter, syncDerived } from '../src/lib/characterModel.js';
import { trackableCards } from '../src/lib/combatTurn.js';
import { attackModifiers, effectAdvantage } from '../src/lib/moves.js';
import {
  asksOf,
  bendsAdded,
  bendsAgainst,
  bendsHeal,
  bendsSheet,
  bendsSwing,
  bendsTypes,
  EFFECT_RIDERS,
  riderOf,
  runningRiders,
} from '../src/lib/riders.js';
import { getCard } from '../src/lib/weapons.js';

const LIST = process.argv.includes('--list');

/** A weapon attack to print the riders against. Any of the two a sword teaches. */
const SWING = 'melee-light-strike';

/**
 * What a *measured* rider has to be laid on before it is worth anything.
 *
 * Almost every rider is a constant and a blank sheet proves it: lay the row, the
 * tile moves. BERSERKER'S RAGE is the one read against the character wearing it —
 * "additional Physique equal to your Berserker Rank" — so a blank sheet is a
 * Berserker Rank of nothing and the row correctly moves nothing at all. Testing
 * it on one would prove only that zero is zero.
 *
 * So a rider may name the columns its own sheet needs, and both sheets of the
 * pair get them: the point is that the row moved the tile, not that the set did.
 * An entry here is a rider whose number depends on its holder, and `measure` in
 * riders.js is the whole of what that means.
 */
const HOLDERS = {
  'berserkers-rage': { talents: [{ id: 'berserker', name: 'Berserker', rank: 3 }] },
};

/** A level-1 sheet with nothing on it but the row under test. */
function sheet(effects = [], holder = null) {
  const full = { ...BLANK_CHARACTER, ...(holder ?? {}), effects };
  const derived = syncDerived(full);
  return liveCharacter(derived ? { ...full, ...derived } : full);
}

/**
 * One row, as the tracker would have stored it, **answered**.
 *
 * A rider that asks a question is worth nothing until the question is answered,
 * which is the whole promise of `ask` and is itself checked below. So a fixture
 * row carries a plausible answer to each: a number for a number, the first
 * option for a choice, and a type for the picker. What the walk then proves is
 * that an *answered* row moves the tile, which is the thing that would otherwise
 * silently stop working.
 */
function row(cardId, turns = 5) {
  const card = getCard(cardId);
  const laid = { id: `t-${cardId}`, name: card?.name ?? cardId, card: cardId, turns };
  const asks = asksOf(laid);
  if (asks.length === 0) return laid;

  const values = {};
  for (const ask of asks) {
    values[ask.id] =
      ask.kind === 'choice' ? ask.options?.[0]?.id : ask.kind === 'types' ? ['Fire'] : 5;
  }
  return { ...laid, values };
}

/** The same row with nothing answered, for proving a question is worth asking. */
function unanswered(cardId, turns = 5) {
  const card = getCard(cardId);
  return { id: `t-${cardId}`, name: card?.name ?? cardId, card: cardId, turns };
}

const findings = [];
const note = (what, said) => findings.push(`  ${what}\n    ${said}`);

/* ------------------------------------------------- every key names a real card */

const plain = sheet();
const swing = getCard(SWING);
/* And the plain Skill Check, for the riders written about one. A basic action
   everybody has, which is exactly why it is the one to test a skill rider on. */
const check = getCard('skill-check');

for (const [id, rider] of Object.entries(EFFECT_RIDERS)) {
  const card = getCard(id);
  if (!card) {
    note(id, 'no card in the codex has this id, so the rider can never be laid');
    continue;
  }
  if (card.id !== id) {
    note(id, `resolves to ${card.id}, so the key is a printed name and not an id`);
  }

  if (!rider.line) note(id, 'carries no line, so nothing can say what it does');

  /* Four channels now, and a rider is worth having if it reaches any of them:
     the sheet's tiles, this body's swing, what lands on this body by damage
     type, and what somebody swinging *at* it gets. A card whose whole rule is
     conditional reaches none of them until a box is ticked, and its claims are
     what say so. See riders.js. */
  const claims = rider.claims ?? [];
  const reaches =
    bendsSheet(rider) ||
    bendsSwing(rider) ||
    bendsTypes(rider) ||
    bendsAgainst(rider) ||
    bendsAdded(rider) ||
    bendsHeal(rider) ||
    claims.length > 0;
  if (!reaches) {
    note(id, 'moves neither a tile nor a swing, so it is a note and not a rider');
  }

  /* A question has to be worth asking, and an unanswered one has to be worth
     nothing. Both halves matter: a rider that bent a tile before anybody typed
     a number would be inventing one, and a question whose answer changes nothing
     is a dialog nobody should ever see. */
  for (const ask of rider.ask ?? []) {
    if (!ask.id) note(id, 'has a question with no id, so nothing can answer it');
    if (!ask.label) note(id, `question ${ask.id} carries no label, so the box asks nothing`);
    if (ask.kind === 'choice' && (ask.options ?? []).length < 2) {
      note(id, `question ${ask.id} is a choice between fewer than two things`);
    }
  }
  if ((rider.ask ?? []).length > 0) {
    const open = sheet([unanswered(id, 5)], HOLDERS[id] ?? null);
    const said = sheet([row(id, 5)], HOLDERS[id] ?? null);
    const moved =
      open.health_max !== said.health_max ||
      open.speed_m !== said.speed_m ||
      open.physique !== said.physique ||
      JSON.stringify(runningRiders([unanswered(id, 5)])) !==
        JSON.stringify(runningRiders([row(id, 5)]));
    if (!moved) note(id, 'asks a question whose answer changes nothing');
  }

  /* Every claim has to be answerable and has to be worth answering. A box with
     no condition on it is a question the player cannot read, and one that bends
     nothing is a question not worth asking. */
  for (const claim of claims) {
    if (!claim.id) note(id, 'has a claim with no id, so nothing can tick it');
    if (!claim.when) note(id, `claim ${claim.id} carries no condition, so the box asks nothing`);
    if (!bendsSwing(claim) && !bendsSheet(claim) && !bendsAgainst(claim) && !bendsTypes(claim)) {
      note(id, `claim ${claim.id} bends nothing, so ticking it would do nothing`);
    }
  }

  /* A claim only counts when its own key is ticked, which is the whole promise
     of the mechanism: an untouched box changes nothing at all. */
  if (claims.length > 0) {
    const laid = [row(id, 5)];
    const shut = runningRiders(laid);
    const open = runningRiders(laid, { claimed: claims.map((claim) => `${id}:${claim.id}`) });
    const same =
      shut.advantage === open.advantage &&
      shut.disadvantage === open.disadvantage &&
      shut.empower === open.empower &&
      shut.elevate === open.elevate &&
      shut.against.disadvantage === open.against.disadvantage &&
      shut.resist.join() === open.resist.join();
    if (same) note(id, 'its claims change nothing when they are ticked');
  }

  /* A rider on a card the picker never offers is a rider nobody can reach. The
     card's own text is one way in and the rider itself is the other, which is
     what lets an Ingredient that never says how long it runs still be offered.
     Either will do. Neither is a rider nobody will ever find. */
  const offer = trackableCards(BLANK_CHARACTER, { codex: true }).find(
    (entry) => entry.card.id === id
  );
  if (!offer) note(id, 'the picker does not offer it, so the rider can never be laid');
  else if (!offer.label) note(id, 'is offered with no duration at all, so the dial says nothing');

  /* Both sheets of the pair wear whatever a measured rider needs, so the only
     difference between them is the row itself. See HOLDERS above. */
  const holder = HOLDERS[id] ?? null;
  const bare = holder ? sheet([], holder) : plain;
  const bent = sheet([row(id, 5)], holder);

  if (bendsSheet(rider)) {
    const moved =
      bent.speed_m !== bare.speed_m ||
      bent.avoid !== bare.avoid ||
      bent.defense !== bare.defense ||
      bent.health_max !== bare.health_max ||
      bent.willpower_max !== bare.willpower_max ||
      bent.physique !== bare.physique ||
      bent.instinct !== bare.instinct ||
      bent.mind !== bare.mind;
    if (!moved) note(id, 'claims to move a tile and no tile moved');
  }

  /* Which card to walk the swing through. A rider narrowed to the skill check
     has nothing to say about a sword, which is the whole point of `only`: LUCK
     POTION is advantage on skill checks, so walking it through a Strike would
     prove the opposite of what it promises. Each is walked through the card it
     is written about, and both have to move. */
  if (bendsSwing(rider)) {
    const on = rider.only === 'skill' ? check : swing;
    const before = attackModifiers(bare, on, { damage: ['Sharp'], empower: 0 });
    const after = attackModifiers(bent, on, { damage: ['Sharp'], empower: 0 });
    const same =
      (before.empower ?? 0) === (after.empower ?? 0) &&
      (before.elevate ?? 0) === (after.elevate ?? 0) &&
      (before.advantage ?? 0) === (after.advantage ?? 0) &&
      (before.disadvantage ?? 0) === (after.disadvantage ?? 0) &&
      (before.damage ?? []).join() === (after.damage ?? []).join();
    if (same) note(id, `claims to bend a ${on.name} and the printed card did not move`);

    /* And the narrowing itself: a rider that named a kind of roll must leave
       every other kind alone, or `only` is a word on a card doing nothing. */
    if (rider.only) {
      const other = rider.only === 'skill' ? swing : check;
      const away = attackModifiers(bent, other, { damage: ['Sharp'], empower: 0 });
      const flat = attackModifiers(bare, other, { damage: ['Sharp'], empower: 0 });
      if ((away.advantage ?? 0) !== (flat.advantage ?? 0) ||
          (away.disadvantage ?? 0) !== (flat.disadvantage ?? 0)) {
        note(id, `is written for a ${rider.only} roll and bent a ${other.name} as well`);
      }
    }
  }

  /* Off again. The whole reason a rider is read rather than stored: the row
     comes off and the sheet is the sheet it was. */
  const back = sheet([], holder);
  for (const key of ['speed_m', 'avoid', 'defense', 'health_max', 'willpower_max']) {
    if (back[key] !== bare[key]) note(id, `${key} did not come back off with the row`);
  }

  if (LIST) console.log(`${id.padEnd(16)} ${rider.line}`);
}

/* ------------------------------------------------------------- the three laws */

/* An ended row is doing nothing. It sits on the block for the rest of the turn
   wearing "Ended" so it is not missed, and a thing that has expired is not still
   doubling a Speed. */
const ended = sheet([row('giant-growth', 0)]);
if (ended.speed_m !== plain.speed_m) {
  note('an ended row', `Speed is ${ended.speed_m} and the row ran out, want ${plain.speed_m}`);
}

/* The same card twice is one source. */
const twice = sheet([row('giant-growth', 5), { ...row('giant-growth', 5), id: 'second' }]);
const once = sheet([row('giant-growth', 5)]);
if (twice.speed_m !== once.speed_m) {
  note('the same card twice', `Speed is ${twice.speed_m} and one of it is ${once.speed_m}`);
}

/* Two different cards are two sources, and two factors multiply. */
const both = sheet([row('giant-growth', 5), row('wisp-of-mist', 5)]);
if (both.speed_m !== plain.speed_m * 3) {
  note(
    'a doubling and a half again',
    `Speed is ${both.speed_m}, want ${plain.speed_m * 3} off a base of ${plain.speed_m}`
  );
}

/* A row bending a roll draws its own arrow, in the right direction. */
const lucky = effectAdvantage(row('lucky-clover'));
if (lucky?.advantage !== 1) note('a Lucky Brew row', 'draws no arrow up');
const unlucky = effectAdvantage(row('unlucky-clover'));
if (unlucky?.disadvantage !== 1) note('an Unlucky Brew row', 'draws no arrow down');

/* And the whole point of the codex shelf: a card this character has never held
   is reachable, and lands with its rider. */
const offered = trackableCards(BLANK_CHARACTER, { codex: true });
const growth = offered.find((entry) => entry.card.id === 'giant-growth');
if (!growth) {
  note('the codex shelf', 'does not offer Giant Growth, so nobody can track what was cast on them');
} else {
  if (growth.mine) note('the codex shelf', 'offers Giant Growth as one of theirs');
  if (growth.turns !== 10) note('the codex shelf', `offers Giant Growth at ${growth.turns} turns, want 10`);
  if (!riderOf(growth.card.id)) note('the codex shelf', 'offers Giant Growth with no rider behind it');
}

const mine = trackableCards(BLANK_CHARACTER);
if (mine.some((entry) => entry.card.id === 'giant-growth')) {
  note('a level 1 with no sources', 'is offered Giant Growth as one of their own');
}

/* --------------------------------------------------------------------- report */

const count = Object.keys(EFFECT_RIDERS).length;

if (findings.length > 0) {
  console.error(`\nriders: ${findings.length} ${findings.length === 1 ? 'finding' : 'findings'}\n`);
  console.error(findings.join('\n'));
  process.exit(LIST ? 0 : 1);
}

console.log(`riders: all ${count} reach the sheet and come back off`);
