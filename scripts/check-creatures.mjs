/**
 * The bestiary, proved. Covers the promises src/lib/creatures.js makes:
 * **every creature carries a whole printed page, its hit die averages the
 * Health beside it, and a Minion cannot be handed a Reaction Point.**
 *
 *   node scripts/check-creatures.mjs         report and exit 1 on any finding
 *   node scripts/check-creatures.mjs --list  print the bestiary and the census
 *
 * The risk this covers is the same one check-order.mjs covers for the wall: a
 * creature is a hand-written page of about twenty fields, and a field left off
 * one of them fails silently. A missing `sense` draws a blank line, a hit die
 * that does not match its Health is a lie printed under a bar nobody would
 * check, and a Minion given 3 Reaction Points draws a row of pips it must not
 * have. None of the three throws, and all three are wrong.
 *
 * The census at the foot is what is worth reading after a creature drop: three
 * of each rank is the shape Jules asked for, and a drop that quietly makes it
 * seven Minions and one Overlord is a drift no assertion could have predicted.
 */

import {
  CREATURES,
  CREATURE_CARDS,
  RANKS,
  bestiary,
  creatureCards,
  creatureMoves,
  creaturePassives,
  creatureStats,
  creatureWards,
  difficultyLine,
  getRank,
} from '../src/lib/creatures.js';
import { encounterState, foeActor, previewFoe } from '../src/lib/encounters.js';
import { getCard } from '../src/lib/weapons.js';

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

/* --------------------------------------------- every page is a whole page */

section('every creature carries every line the printed page has');

/* The template's own fields, in the template's own order. `difficulty` is on
   the page as an empty label and is deliberately allowed to be empty; every
   other one has to say something. */
const WORDS = ['name', 'type', 'proficiencies', 'sense', 'language', 'lore', 'hit_die'];
const NUMBERS = ['level', 'xp', 'speed_m', 'avoid', 'health_max', 'willpower_max'];
const ATTRS = ['physique', 'instinct', 'mind'];

for (const creature of CREATURES) {
  const who = creature.id ?? '(no id)';

  for (const field of WORDS) {
    const value = creature[field];
    if (typeof value !== 'string' || value.trim() === '') {
      note(who, `${field} is missing. Every creature prints one, even if the answer is "none".`);
    }
  }

  for (const field of [...NUMBERS, ...ATTRS]) {
    if (!Number.isFinite(Number(creature[field]))) {
      note(who, `${field} is not a number`);
    }
  }

  if (!RANKS.some((rank) => rank.id === creature.rank)) {
    note(who, `rank "${creature.rank}" is not one of the three`);
  }

  if (typeof creature.difficulty !== 'string') {
    note(who, 'difficulty must be a string, even the empty one the template prints');
  }
}

const ids = CREATURES.map((creature) => creature.id);
check('no two creatures share an id', ids.filter((id, at) => ids.indexOf(id) !== at), []);

/* ------------------------------------------- the hit die averages the Health */

section('every hit die averages the Health printed beside it');

/** The mean of NdM, which is what "HP: 8 (3d4)" claims about itself. */
function dieAverage(text) {
  const match = /^(\d+)d(\d+)$/.exec(String(text ?? ''));
  if (!match) return null;
  return Number(match[1]) * ((Number(match[2]) + 1) / 2);
}

for (const creature of CREATURES) {
  const mean = dieAverage(creature.hit_die);
  if (mean === null) {
    note(creature.id, `hit die "${creature.hit_die}" is not NdM`);
    continue;
  }

  /* Half a point of slack, and no more. The Blightgeist prints 8 Health against
     3d4, which means 7.5: the page rounds, it does not approximate. */
  const off = Math.abs(mean - creature.health_max);
  if (off > 0.5) {
    note(
      creature.id,
      `${creature.hit_die} averages ${mean} against a printed Health of ${creature.health_max}`
    );
  }
}

/* ------------------------------------------------------ the three rank rules */

section('a Minion cannot be handed a Reaction Point');

for (const creature of CREATURES) {
  const rank = getRank(creature);
  const stats = creatureStats(creature);

  if (!rank.reacts && stats.reaction_max !== 0) {
    note(creature.id, `is a ${rank.label} with ${stats.reaction_max} Reaction Points`);
  }
  if (rank.reacts && stats.reaction_max <= 0) {
    note(creature.id, `is a ${rank.label} and can react, but has no Reaction Points`);
  }
}

/* The rule stated as data has to survive a page that argues with it. The
   Blightgeist's own sheet prints RP: 3 and it is a Minion, which is exactly the
   case this forces to zero. */
{
  const forced = creatureStats({ rank: 'minion', reaction_max: 3, physique: 1, instinct: 1, mind: 1 });
  check('a printed Reaction Point on a Minion is forced to zero', forced.reaction_max, 0);
}

section('the ranks say what Jules said they say');
{
  const by = Object.fromEntries(RANKS.map((rank) => [rank.id, rank]));
  check('a Minion has no reactions', [by.minion.reaction, by.minion.reacts], [0, false]);
  check('a General runs on a player clock', [by.general.ap, by.general.reaction], [6, 6]);
  check('an Overlord acts on twelve', by.overlord.ap, 12);
  check('and gains three a player turn', by.overlord.perPlayerTurn, 3);
  check('nobody else gains any', [by.minion.perPlayerTurn, by.general.perPlayerTurn], [0, 0]);
}

/* --------------------------------------------------------------- the cards */

section('every card a creature names is a card, and reaches the codex');

for (const creature of CREATURES) {
  for (const id of creature.cards ?? []) {
    if (!getCard(id)) note(creature.id, `names a card "${id}" that getCard cannot find`);
  }

  const held = creatureCards(creature);
  if (held.length !== (creature.cards ?? []).length) {
    note(creature.id, `names ${(creature.cards ?? []).length} cards and resolves ${held.length}`);
  }
  if (creatureMoves(creature).length === 0) {
    note(creature.id, 'has nothing it can play. Every creature gets at least one move.');
  }
}

/* A ward is a passive and never a move: it is switched at the table rather than
   paid for, so one carrying a price would draw a chip nobody should be able to
   tap. */
for (const card of CREATURE_CARDS) {
  if (card.ward && card.kind !== 'passive') {
    note(card.id, 'carries a ward and is not a passive');
  }
  if (card.ward && !card.while) {
    note(card.id, 'carries a ward with no `while` sentence for the row to print');
  }
  if (card.kind === 'passive' && (card.ap || card.wp)) {
    note(card.id, 'is a passive with a price on it');
  }
  if (!(card.tags ?? []).includes('Creature')) {
    note(card.id, 'is a creature card and is not tagged Creature');
  }
}

section('the wards are the environmental passives and nothing else');
{
  const warded = CREATURES.filter((creature) => creatureWards(creature).length > 0);
  check('some creatures carry one', warded.length > 0, true);
  check(
    'and every one of them is a passive on that creature',
    warded.every((creature) =>
      creatureWards(creature).every((card) => creaturePassives(creature).includes(card))
    ),
    true
  );

  /* "All of them can have passive that are environmental based", Jules, and
     "all" is the word this holds the codex to. The lich is the example he gave
     and every Overlord carries one, but a ward is not an Overlord's privilege:
     at least one other rank has to have one, or the next reader will take the
     example for the rule. */
  const ranks = new Set(warded.map((creature) => creature.rank));
  check('and a ward is not an Overlord privilege', ranks.size > 1, true);
}

/* ------------------------------------------------------- an instance of one */

section('a creature dressed as an enemy reads like a character');

for (const creature of CREATURES) {
  const foe = previewFoe(creature);
  if (!foe) {
    note(creature.id, 'cannot be laid down as an enemy at all');
    continue;
  }

  /* Absent is full. Nothing is written for a preview, so every pool has to come
     back at its ceiling except the two that start empty. */
  check(`${creature.id}: arrives at full Health`, foe.health, foe.stats.health_max);
  check(`${creature.id}: and full Action Points`, foe.ap, foe.stats.ap_max);
  check(`${creature.id}: and full Willpower`, foe.willpower, foe.stats.willpower_max);
  check(`${creature.id}: with no Shield and no Reactions`, [foe.shield, foe.reaction], [0, 0]);

  const actor = foeActor(foe);
  if (!Number.isFinite(actor.willpower_max)) note(creature.id, 'has no Willpower ceiling as an actor');
  if (actor.name !== foe.title) note(creature.id, 'signs its actions with the wrong name');
}

section('several of one creature are told apart, and one is not numbered');
{
  const many = encounterState({
    foes: [
      { key: 'a', creature: 'blightgeist' },
      { key: 'b', creature: 'blightgeist' },
      { key: 'c', creature: 'vaultkeeper-lich' },
    ],
  });
  check('the pair are numbered', [many[0].title, many[1].title], ['Blightgeist 1', 'Blightgeist 2']);
  check('the lone one is not', many[2].title, 'Vaultkeeper Lich');
}

/* --------------------------------------------------------------- the shelf */

section('the bestiary comes out in rank order');
{
  const order = bestiary().map((creature) => RANKS.findIndex((rank) => rank.id === creature.rank));
  check('rank never goes backwards', order.every((at, n) => n === 0 || at >= order[n - 1]), true);

  const filtered = bestiary('overlord');
  check('and a filtered shelf holds one rank', [...new Set(filtered.map((c) => c.rank))], ['overlord']);
}

section('the difficulty line is the printed one');
check(
  'the Blightgeist heads its page the way its sheet does',
  difficultyLine(CREATURES.find((creature) => creature.id === 'blightgeist')),
  'Minion - Level 1 - 10 XP'
);

/* ------------------------------------------------------------------ census */

section('three of each');
{
  const counts = new Map();
  for (const creature of CREATURES) counts.set(creature.rank, (counts.get(creature.rank) ?? 0) + 1);

  for (const rank of RANKS) {
    const count = counts.get(rank.id) ?? 0;
    if (LIST) console.log(`  ${rank.label.padEnd(9)} ${count}`);
    /* A guard rather than an exact count, so a creature drop does not fail this
       file for existing. What it catches is a rank left behind: a bestiary that
       grows to forty Minions and still has one Overlord is a bestiary nobody
       can build an Overlord fight from. */
    if (count === 0) note(rank.label, 'has no creatures in the bestiary at all');
  }

  if (LIST) {
    console.log(`\n  ${CREATURES.length} creatures, ${CREATURE_CARDS.length} cards between them`);
    for (const creature of bestiary()) {
      const stats = creatureStats(creature);
      console.log(
        `  ${creature.name.padEnd(20)} ${difficultyLine(creature).padEnd(28)} ` +
          `DEF ${String(stats.avoid).padStart(2)} · HP ${String(stats.health_max).padStart(3)} ` +
          `(${creature.hit_die}) · AP ${stats.ap_max} RP ${stats.reaction_max} WP ${stats.willpower_max}`
      );
    }
  }
}

/* ------------------------------------------------------------------ report */

if (findings.length === 0) {
  console.log(
    `bestiary: ${CREATURES.length} creatures, every page whole and every hit die honest`
  );
  process.exit(0);
}

console.log(`\nbestiary: ${findings.length} ${findings.length === 1 ? 'finding' : 'findings'}\n`);
for (const finding of findings) console.log(finding);
process.exit(LIST ? 0 : 1);
