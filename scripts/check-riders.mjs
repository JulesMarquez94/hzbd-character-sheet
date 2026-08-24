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
import { bendsSheet, bendsSwing, EFFECT_RIDERS, riderOf } from '../src/lib/riders.js';
import { getCard } from '../src/lib/weapons.js';

const LIST = process.argv.includes('--list');

/** A weapon attack to print the riders against. Any of the two a sword teaches. */
const SWING = 'melee-light-strike';

/** A level-1 sheet with nothing on it but the row under test. */
function sheet(effects = []) {
  const full = { ...BLANK_CHARACTER, effects };
  const derived = syncDerived(full);
  return liveCharacter(derived ? { ...full, ...derived } : full);
}

/** One row, as the tracker would have stored it. */
function row(cardId, turns = 5) {
  const card = getCard(cardId);
  return { id: `t-${cardId}`, name: card?.name ?? cardId, card: cardId, turns };
}

const findings = [];
const note = (what, said) => findings.push(`  ${what}\n    ${said}`);

/* ------------------------------------------------- every key names a real card */

const plain = sheet();
const swing = getCard(SWING);

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

  if (!bendsSheet(rider) && !bendsSwing(rider)) {
    note(id, 'moves neither a tile nor a swing, so it is a note and not a rider');
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

  const bent = sheet([row(id, 5)]);

  if (bendsSheet(rider)) {
    const moved =
      bent.speed_m !== plain.speed_m ||
      bent.avoid !== plain.avoid ||
      bent.defense !== plain.defense ||
      bent.health_max !== plain.health_max ||
      bent.willpower_max !== plain.willpower_max ||
      bent.physique !== plain.physique ||
      bent.instinct !== plain.instinct ||
      bent.mind !== plain.mind;
    if (!moved) note(id, 'claims to move a tile and no tile moved');
  }

  if (bendsSwing(rider)) {
    const before = attackModifiers(plain, swing, { damage: ['Sharp'], empower: 0 });
    const after = attackModifiers(bent, swing, { damage: ['Sharp'], empower: 0 });
    const same =
      (before.empower ?? 0) === (after.empower ?? 0) &&
      (before.elevate ?? 0) === (after.elevate ?? 0) &&
      (before.advantage ?? 0) === (after.advantage ?? 0) &&
      (before.disadvantage ?? 0) === (after.disadvantage ?? 0) &&
      (before.damage ?? []).join() === (after.damage ?? []).join();
    if (same) note(id, 'claims to bend a swing and the printed attack did not move');
  }

  /* Off again. The whole reason a rider is read rather than stored: the row
     comes off and the sheet is the sheet it was. */
  const back = sheet([]);
  for (const key of ['speed_m', 'avoid', 'defense', 'health_max', 'willpower_max']) {
    if (back[key] !== plain[key]) note(id, `${key} did not come back off with the row`);
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
