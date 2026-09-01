/**
 * The bestiary, proved. Covers the promises src/lib/creatures.js makes:
 * **the Blightgeist reproduces its own printed page from the curve, a primary
 * attribute reaches 12 at level 12, a hit die averages the Health beside it at
 * every level, and a Minion cannot be handed a Reaction Point.**
 *
 *   node scripts/check-creatures.mjs         report and exit 1 on any finding
 *   node scripts/check-creatures.mjs --list  print the bestiary and the census
 *
 * The risk this covers changed shape when the creatures learned to scale. A
 * creature used to be twenty printed numbers, and the risk was one of them being
 * missing. It is now a *shape* plus a handful of coefficients, and the risk is
 * that the shape is subtly wrong somewhere nobody looks: at level 12, or at
 * level 1, or on the one creature that was transcribed rather than invented.
 *
 * So the first section is the one that matters most. The Blightgeist's page is
 * the only ground truth in the whole file, and the curve has to hand it back.
 */

import {
  CREATURES,
  CREATURE_CARDS,
  CREATURE_MAX_LEVEL,
  RANKS,
  bestiary,
  clampCreatureLevel,
  creatureAttributes,
  creatureCards,
  creatureMoves,
  creaturePassives,
  creatureStats,
  creatureWards,
  difficultyLine,
  getCreature,
  getRank,
  hitDie,
} from '../src/lib/creatures.js';
import { encounterState, foeActor, previewFoe, setFoeLevel } from '../src/lib/encounters.js';
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

/* ============================================ the one page that is ground truth */

section('the Blightgeist reproduces its own printed page at level 1');
{
  /* Every number on data/Source Temp/Hazebound/Creatures/Creature -
     Blightgeist.jpg, except the RP the Minion rule overrides. Nothing below is
     stored on the creature any more: all of it comes out of the curve, the two
     conversions and the Defense bonus, so this is the check that says the shape
     is right rather than that somebody typed the numbers in. */
  const page = {
    physique: 2,
    instinct: 2,
    mind: 5,
    avoid: 8,
    health_max: 8,
    hit_die: '3d4',
    willpower_max: 8,
    ap_max: 6,
    // The page prints 3. A Minion cannot take reactions, and the rule wins.
    reaction_max: 0,
    speed_m: 3,
    initiative: 3,
  };

  const geist = getCreature('blightgeist');
  const stats = creatureStats(geist, 1);

  for (const [line, want] of Object.entries(page)) {
    const got = line in stats.attributes ? stats.attributes[line] : stats[line];
    check(`the page's ${line}`, got, want);
  }

  check('and the Difficulty line it heads with', difficultyLine(geist, 1), 'Minion - Level 1 - 10 XP');
}

/* ================================================================== the curve */

section('the curve is the character\'s own');
{
  /* A character starts at 4, takes +2 and +1 at level 1, and +1 on two
     attributes at every odd level after. Read against a creature with no bonus
     at all, that is exactly what should come out. */
  const plain = { primary: 'mind', secondary: 'instinct', bonus: {} };

  check('at level 1: base 4, +2 and +1', creatureAttributes(plain, 1), {
    physique: 4,
    instinct: 5,
    mind: 6,
  });
  check('level 2 grants nothing', creatureAttributes(plain, 2), creatureAttributes(plain, 1));
  check('level 3 grants one to each', creatureAttributes(plain, 3), {
    physique: 4,
    instinct: 6,
    mind: 7,
  });
  check('and by 12 the primary is at 11', creatureAttributes(plain, 12).mind, 11);
  check('the third attribute never moves', creatureAttributes(plain, 12).physique, 4);

  /* Which is the whole reason `bonus` exists on the primary: it is the step from
     a character's ceiling to the twelve Jules asked for. */
  const capped = { ...plain, bonus: { mind: 1 } };
  check('a +1 bonus carries the primary to 12 at level 12', creatureAttributes(capped, 12).mind, 12);

  check('nothing falls below 1, however deep the bonus', creatureAttributes(
    { primary: 'mind', secondary: 'instinct', bonus: { physique: -9 } },
    1
  ).physique, 1);

  check('a level below 1 reads as 1', creatureAttributes(plain, 0), creatureAttributes(plain, 1));
  check('and a level above the cap reads as the cap', creatureAttributes(plain, 40), creatureAttributes(plain, 12));
  check('the cap is twelve', [clampCreatureLevel(99), CREATURE_MAX_LEVEL], [12, 12]);
}

section('most of the bestiary reaches 12 at level 12');
{
  const capped = CREATURES.filter(
    (creature) => creatureStats(creature, 12).attributes[creature.primary] >= 12
  );
  /* "most enemy should have a strong stat that reach 12 the max at the same time
     they hit level 12", so more than half of them, and every General and every
     Overlord. A Minion topping out lower is the point of being a Minion. */
  check('more than half of them do', capped.length * 2 > CREATURES.length, true);

  for (const creature of CREATURES) {
    if (creature.rank === 'minion') continue;
    const top = creatureStats(creature, 12).attributes[creature.primary];
    if (top < 12) note(creature.id, `is a ${creature.rank} whose ${creature.primary} tops out at ${top}`);
  }
}

/* ------------------------------------------- the hit die averages the Health */

section('every hit die averages the Health beside it, at every level');

/** The mean of NdM, which is what "HP: 8 (3d4)" claims about itself. */
function dieAverage(text) {
  const match = /^(\d+)d(\d+)$/.exec(String(text ?? ''));
  if (!match) return null;
  return Number(match[1]) * ((Number(match[2]) + 1) / 2);
}

for (const creature of CREATURES) {
  for (let level = 1; level <= CREATURE_MAX_LEVEL; level += 1) {
    const stats = creatureStats(creature, level);
    const mean = dieAverage(stats.hit_die);

    if (mean === null) {
      note(creature.id, `hit die "${stats.hit_die}" at level ${level} is not NdM`);
      break;
    }

    /* Not a fixed tolerance: a d12 creature cannot land closer than six and a
       half of anything. What is actually promised is that the *count* is the
       closest one there is, so both neighbours are checked. */
    const step = (Number(creature.die) + 1) / 2;
    const off = Math.abs(mean - stats.health_max);
    if (off > step / 2 + 0.001) {
      note(
        creature.id,
        `${stats.hit_die} averages ${mean} against ${stats.health_max} Health at level ${level}, and a nearer count exists`
      );
      break;
    }
  }
}

check('a d4 creature with 8 Health prints 3d4', hitDie(8, 4), '3d4');
check('and one with 1 Health still prints a die', hitDie(1, 12), '1d12');

/* ------------------------------------------------------ the three rank rules */

section('a Minion cannot be handed a Reaction Point');

for (const creature of CREATURES) {
  const rank = getRank(creature);
  const stats = creatureStats(creature, creature.level);

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
  const forced = creatureStats({ rank: 'minion', reaction_max: 3, primary: 'mind' }, 1);
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

/* ---------------------------------------------------- a page with no numbers */

section('nothing that scales is stored as a number on a creature');
{
  /* The whole point of the rewrite: a creature carries a shape, not a stat
     block. A stray `health_max` or `mind` left on one would be a number that
     silently stopped tracking the level. */
  const banned = ['physique', 'instinct', 'mind', 'health_max', 'willpower_max', 'avoid', 'grit', 'reflex'];
  for (const creature of CREATURES) {
    for (const field of banned) {
      if (field in creature) note(creature.id, `still carries a hard \`${field}\`, which no longer scales`);
    }
    for (const field of ['primary', 'secondary', 'die', 'health', 'willpower']) {
      if (creature[field] === undefined) note(creature.id, `has no \`${field}\``);
    }
    if (!['physique', 'instinct', 'mind'].includes(creature.primary)) {
      note(creature.id, `primary "${creature.primary}" is not an attribute`);
    }
  }
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
  for (const key of ['physique', 'instinct', 'mind']) {
    if (actor[key] !== foe.attributes[key]) {
      note(creature.id, `plays its cards off the wrong ${key}`);
    }
  }
}

section('an enemy scales where it stands');
{
  const enc = { foes: [{ key: 'a', creature: 'blightgeist', level: 1 }] };
  const one = encounterState(enc)[0];
  check('level 1 is the page', [one.health_max ?? one.stats.health_max, one.attributes.mind], [8, 5]);
  check('and it knows it is unscaled', one.scaled, false);

  const up = { ...enc, ...setFoeLevel(enc, 'a', 9) };
  const nine = encounterState(up)[0];
  check('level 9 is a bigger Blightgeist', nine.stats.health_max > one.stats.health_max, true);
  check('and it says it has been moved', nine.scaled, true);
  check('every pool comes back full at the new level', [nine.health, nine.ap, nine.willpower], [
    nine.stats.health_max,
    nine.stats.ap_max,
    nine.stats.willpower_max,
  ]);
  check('a Minion still has no reactions at level 9', nine.stats.reaction_max, 0);
  check('setting the level it already holds writes nothing', setFoeLevel(up, 'a', 9), null);
  check('and a level past the cap clamps', encounterState({ ...enc, ...setFoeLevel(enc, 'a', 99) })[0].level, 12);
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
  /* The number rides in front, where a scanning eye finds it. Jules,
     2026-09-01: "they get named 1.Fenrat 2.Fenrat". */
  check('the pair are numbered', [many[0].title, many[1].title], ['1.Blightgeist', '2.Blightgeist']);
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
      for (const level of [creature.level, 12]) {
        const s = creatureStats(creature, level);
        const a = s.attributes;
        console.log(
          `  ${(level === creature.level ? creature.name : '').padEnd(20)}` +
            `L${String(level).padStart(2)} ` +
            `P${String(a.physique).padStart(2)} I${String(a.instinct).padStart(2)} M${String(a.mind).padStart(2)} · ` +
            `DEF ${String(s.avoid).padStart(2)} · AR ${String(s.defense).padStart(2)} · ` +
            `HP ${String(s.health_max).padStart(3)} (${s.hit_die.padEnd(6)}) · ` +
            `WP ${String(s.willpower_max).padStart(2)} · AP ${s.ap_max} RP ${String(s.reaction_max).padStart(2)}`
        );
      }
    }
  }
}

/* ------------------------------------------------------------------ report */

if (findings.length === 0) {
  console.log(
    `bestiary: ${CREATURES.length} creatures scale 1 to ${CREATURE_MAX_LEVEL}, and the Blightgeist still prints its own page`
  );
  process.exit(0);
}

console.log(`\nbestiary: ${findings.length} ${findings.length === 1 ? 'finding' : 'findings'}\n`);
for (const finding of findings) console.log(finding);
process.exit(LIST ? 0 : 1);
