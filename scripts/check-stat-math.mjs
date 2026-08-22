/**
 * Stat-math round trip. Proves the one promise src/lib/statMath.js makes:
 * **every math line adds up to the number the sheet is showing above it.**
 *
 * That promise is the whole risk of the file. It mirrors `deriveStats`,
 * `shieldCapFor`, `attributeTotals`, `magicBurdenMax` and `minionDerived` term
 * for term, so the day one of those formulas changes and this does not, the
 * tooltips start quietly lying about where a number came from. A wrong
 * explanation is worse than no explanation, so the mirror is checked rather
 * than trusted.
 *
 *   node scripts/check-stat-math.mjs        report and exit 1 on any drift
 *   node scripts/check-stat-math.mjs --list print every line, then exit 0
 *
 * Each fixture below is a *kind* of source, not a character anybody would play:
 * gear, a full-set replacement, a lineage rider, five enchantments at once, a
 * raised point ceiling, a form's hide, a creature and a card running on the
 * tracker. Adding a new source of any stat means adding a sheet here that carries
 * it.
 *
 * Two notes on the fixtures, both learned the hard way:
 *
 * - `reapplyTotals` before `syncDerived`. The three attribute columns are the
 *   level ledger's and `syncDerived` does not touch them, so a fixture that only
 *   syncs derives its stats off three untouched 4s.
 * - Seven talent slots is the whole ladder. Four rank-3 sets need twelve, and
 *   `repairSlots` silently drops whatever does not fit, which reads here as a
 *   set's bonus mysteriously not appearing.
 */

import {
  BLANK_CHARACTER,
  karmaCap,
  liveCharacter,
  shieldCapFor,
  syncDerived,
} from '../src/lib/characterModel.js';
import {
  carriedWeight,
  carryCapacity,
  magicBurdenMax,
  magicBurdenUsed,
} from '../src/lib/items.js';
import { reapplyTotals } from '../src/lib/levelPicks.js';
import { minionState } from '../src/lib/minions.js';
import { mathLine, minionMath, statMath } from '../src/lib/statMath.js';

const LIST = process.argv.includes('--list');

/**
 * The level-1 spread, and the two points every odd level after hands out.
 *
 * Level 9 is deliberately written the *older* way, as a single `attribute`. That
 * shape is what every saved sheet holds and it reads back as one point taken and
 * one still open, so the ladder proves both readings add up rather than only the
 * new one. See "two, not one" in levelPicks.js.
 */
const LADDER = {
  1: { major: 'instinct', minor: 'physique' },
  3: { raised: ['instinct', 'mind'] },
  5: { raised: ['mind', 'physique'] },
  7: { raised: ['physique', 'instinct'] },
  9: { attribute: 'instinct' },
  11: { raised: ['mind', 'instinct'] },
};

const SHEETS = [
  {
    name: 'a fresh level 1, nothing laid on anybody',
    row: {},
  },
  {
    name: 'gear, a lineage, five workings, a form and a raised ceiling',
    row: {
      xp: 75000,
      lineage: 'Wildheart',
      level_picks: LADDER,
      trinkets: ['silver-ring'],
      shield: 40,
      equipment: {
        head: 'leather-helm',
        torso: 'leather-vest',
        legs: 'leather-pants',
        main_hand: null,
        off_hand: null,
      },
      talents: [
        {
          id: 'enchanter',
          rank: 3,
          taken: [1, 2, 4],
          worn: [
            'primal-sense',
            'vitality',
            'celerity',
            'arcane-battery',
            'resilience-enchantment',
          ],
          laid: { 'silver-ring': ['bodily-vigor'] },
        },
        { id: 'trickster', rank: 2, taken: [6, 8] },
        { id: 'feral-curse', rank: 2, taken: [10, 12] },
      ],
      feral: { 'feral-curse': { beast: 'wolf', name: 'The Wolf', on: true, dc: 8 } },
    },
  },
  {
    name: 'a Master Trickster with a creature on the board',
    row: {
      xp: 44000,
      level_picks: LADDER,
      talents: [
        { id: 'trickster', rank: 3, taken: [1, 2, 4] },
        { id: 'draconic-bond', rank: 3, taken: [6, 8, 10] },
      ],
      minions: { 'draconic-bond': { name: 'Cinder', scale: 'red' } },
    },
  },
  {
    name: 'a full Heavy Armor set and a Duelist holding a one-hander',
    row: {
      xp: 44000,
      level_picks: LADDER,
      equipment: {
        head: 'full-plate-helm',
        torso: 'full-plate-cuirass',
        legs: 'full-plate-pants',
        main_hand: 'one-handed',
        off_hand: null,
      },
      talents: [{ id: 'duelist', rank: 3, taken: [1, 2, 4] }],
    },
  },
  {
    name: 'a full Supreme Runed set, which replaces the Defense base',
    row: {
      xp: 44000,
      level_picks: LADDER,
      equipment: {
        head: 'supreme-runed-hood',
        torso: 'supreme-runed-robes',
        legs: 'supreme-runed-leggings',
        main_hand: null,
        off_hand: null,
      },
    },
  },
  {
    /* One working in two places. The same-source law says that is one point, so
       it must be one *term*: a line crediting Primal Sense twice for a point it
       granted once is the law broken where a reader can see it. */
    name: 'the same working on a person and on a ring',
    row: {
      xp: 7500,
      level_picks: LADDER,
      trinkets: ['silver-ring'],
      talents: [
        {
          id: 'enchanter',
          rank: 3,
          taken: [1, 2, 4],
          worn: ['primal-sense'],
          laid: { 'silver-ring': ['primal-sense'] },
        },
      ],
    },
    expect: (math, fail) => {
      const named = math.instinct.terms.filter((t) => t.label === 'Primal Sense');
      if (named.length !== 1) fail(`Primal Sense named ${named.length} times, want 1`);
      if (named[0]?.value !== 1) fail(`Primal Sense worth ${named[0]?.value}, want 1`);
    },
  },
  {
    /* The one thing on the sheet that takes a stat away. This ladder stands at a
       Physique of 7, so at 5 kg a point the ceiling is 40 kg with the satchel on,
       and the plate, the greatsword and one spare hauberk come to 46.9: over, and
       not yet the 52 that stops them. The sheet below is the same load with eight
       cuirasses in the pack, which is well past it. */
    name: 'a load past the carry ceiling, which halves Speed',
    row: {
      xp: 7500,
      level_picks: LADDER,
      equipment: {
        head: 'full-plate-helm',
        torso: 'full-plate-cuirass',
        legs: 'full-plate-pants',
        main_hand: 'two-handed',
        off_hand: null,
        bag: 'canvas-satchel',
      },
      pack: ['chainmail-hauberk'],
    },
    expect: (math, fail) => {
      const hit = math.speed_m.terms.find((t) => t.label === 'overloaded');
      if (!hit) fail('over the ceiling and the Speed line does not say so');
      if (hit && hit.value >= 0) fail(`overloaded is worth ${hit.value}, want a penalty`);
      /* Halved, not stopped. Without this the fixture below is the only one of
         the two doing any work: a load heavy enough to stop them dead also
         carries a negative `overloaded` term, so the assertion above passes on
         both and the line between them goes untested. */
      if (math.speed_m.total <= 0) fail('halved to a standstill, want a Speed left to move on');
    },
  },
  {
    name: 'a load 30% past it, which stops them moving at all',
    row: {
      xp: 7500,
      level_picks: LADDER,
      equipment: {
        head: 'full-plate-helm',
        torso: 'full-plate-cuirass',
        legs: 'full-plate-pants',
        main_hand: 'two-handed',
        off_hand: null,
        bag: 'canvas-satchel',
      },
      pack: Array.from({ length: 8 }, () => 'full-plate-cuirass'),
    },
    expect: (math, fail) => {
      if (math.speed_m.total !== 0) fail(`Speed is ${math.speed_m.total}, want 0`);
    },
  },
  {
    /* A working worth a point of Physique is worth five kilos of capacity, and
       the *ceiling Speed is judged against* has to know it. The attribute column
       is the level ledger's and carries no enchantment, so `deriveStats` has to
       weigh the load against its own bent Physique rather than against the
       number it was handed. This load sits between the two: 37.5 kg, over the 35
       a stored Physique of 7 allows and inside the 40 the worn one does. A sheet
       that read the column would halve a Speed that should not be halved. */
    name: 'a load under the bent Physique and over the stored one',
    row: {
      xp: 7500,
      level_picks: LADDER,
      equipment: {
        head: 'full-plate-helm',
        torso: 'full-plate-cuirass',
        legs: 'full-plate-pants',
        main_hand: 'two-handed',
        off_hand: null,
        bag: null,
      },
      pack: ['healing-potion', 'healing-potion', 'healing-potion', 'healing-potion'],
      talents: [{ id: 'enchanter', rank: 3, taken: [1, 2, 4], worn: ['bodily-vigor'] }],
    },
    expect: (math, fail) => {
      const hit = math.speed_m.terms.find((t) => t.label === 'overloaded');
      if (hit) fail(`Speed penalised by ${hit.value} on a load that is inside capacity`);
      if (math.carry_max.total !== 40) fail(`capacity is ${math.carry_max.total}, want 40`);
      if (math.carry_used.total !== 37.5) fail(`load is ${math.carry_used.total}, want 37.5`);
    },
  },
  {
    /* A card on the tracker, which is the third thing that bends a tile without
       storing it. Somebody else's Giant Growth: nothing was spent on this sheet
       and no source of theirs has heard of the spell. This ladder walks 8, so
       the doubling is worth 8 more and the line has to name it. */
    name: 'somebody else Giant Growth on you, which doubles the Speed',
    row: {
      xp: 7500,
      level_picks: LADDER,
      effects: [{ id: 'e1', name: 'Giant Growth', card: 'giant-growth', turns: 10 }],
    },
    expect: (math, fail) => {
      if (math.speed_m.total !== 16) fail(`Speed is ${math.speed_m.total}, want 16`);
      const hit = math.speed_m.terms.find((t) => t.label === 'Giant Growth');
      if (!hit) fail('the Speed doubled and the line does not say what doubled it');
      if (hit && hit.value !== 8) fail(`Giant Growth worth ${hit.value}, want 8`);
    },
  },
  {
    /* Two factors, which multiply rather than add: a doubling and a half again is
       threefold. Both terms are off the Speed as it stood when each was applied,
       which is the only way they can add up to the tile. And Barkskin's point of
       Defense, on the same sheet, because a rider that moved two different tiles
       at once is the case a single-tile fixture cannot catch. */
    name: 'a doubling, a half again and a point of Defense, all off the tracker',
    row: {
      xp: 7500,
      level_picks: LADDER,
      effects: [
        { id: 'e1', name: 'Giant Growth', card: 'giant-growth', turns: 10 },
        { id: 'e2', name: 'Hasted Brew', card: 'wisp-of-mist', turns: null },
        { id: 'e3', name: 'Barkskin', card: 'barkskin', turns: null },
      ],
    },
    expect: (math, fail) => {
      if (math.speed_m.total !== 24) fail(`Speed is ${math.speed_m.total}, want 24`);
      const grown = math.speed_m.terms.find((t) => t.label === 'Giant Growth');
      const hasted = math.speed_m.terms.find((t) => t.label === 'Hasted Brew');
      if (grown?.value !== 8) fail(`Giant Growth worth ${grown?.value}, want 8`);
      if (hasted?.value !== 8) fail(`Hasted Brew worth ${hasted?.value}, want 8`);

      const bark = math.avoid.terms.find((t) => t.label === 'Barkskin');
      if (!bark) fail('Barkskin raised the Defense and the line does not name it');
      if (bark && bark.value !== 1) fail(`Barkskin worth ${bark.value}, want 1`);
    },
  },
];

/** A row the sheet has brought into line with its own ledger, then bent. */
function shownSheet(row) {
  const full = { ...BLANK_CHARACTER, ...row };
  const totals = reapplyTotals(full);
  const withAttrs = totals ? { ...full, ...totals } : full;
  const derived = syncDerived(withAttrs);
  return liveCharacter(derived ? { ...withAttrs, ...derived } : withAttrs);
}

/** What each tile on the Character tab actually prints, keyed as statMath keys it. */
function faceOf(shown) {
  return {
    physique: shown.physique,
    instinct: shown.instinct,
    mind: shown.mind,
    initiative: Math.floor(shown.initiative),
    speed_m: Math.round((Number(shown.speed_m) || 0) * 100) / 100,
    defense: Math.floor(shown.defense),
    avoid: Math.floor(shown.avoid),
    reflex: Math.floor(shown.reflex),
    grit: Math.floor(shown.grit),
    health_max: shown.health_max,
    shield_cap: shieldCapFor(shown),
    willpower_max: shown.willpower_max,
    ap_max: shown.ap_max,
    reaction_max: shown.reaction_max,
    karma: karmaCap(shown),
    burden_max: magicBurdenMax(shown),
    burden_used: magicBurdenUsed(shown),
    carry_max: carryCapacity(shown),
    carry_used: carriedWeight(shown),
  };
}

const findings = [];

for (const sheet of SHEETS) {
  const shown = shownSheet(sheet.row);
  const math = statMath(shown);
  const fail = (says) => findings.push({ sheet: sheet.name, says });

  if (LIST) console.log(`\n===== ${sheet.name} =====`);

  for (const [key, value] of Object.entries(faceOf(shown))) {
    const sum = math[key];
    if (!sum) {
      fail(`${key}: no breakdown at all`);
      continue;
    }
    const line = mathLine(sum);
    if (LIST) console.log(`  ${key.padEnd(13)} ${String(value).padEnd(7)} ${line ?? '(no line)'}`);

    if (Math.abs(sum.total - Number(value)) > 0.001) {
      fail(`${key}: line comes to ${sum.total}, tile shows ${value}`);
    }
    /* On a sheet the app has just synced, every point has a name. An
       `unaccounted` term here means a source exists that statMath cannot see. */
    const ghost = sum.terms.find((t) => t.label === 'unaccounted');
    if (ghost) fail(`${key}: ${ghost.value} unaccounted for (${line})`);
  }

  for (const minion of minionState(shown)) {
    if (LIST) console.log(`  -- ${minion.title}`);
    for (const [key, sum] of Object.entries(minionMath(minion))) {
      const truth = minion.stats[key];
      if (LIST) {
        console.log(
          `     ${key.padEnd(13)} ${String(truth).padEnd(7)} ${mathLine(sum) ?? '(no line)'}`
        );
      }
      if (Math.abs(sum.total - Number(truth)) > 0.001) {
        fail(`${minion.title} ${key}: line comes to ${sum.total}, tile shows ${truth}`);
      }
    }
  }

  sheet.expect?.(math, fail);
}

/* And the one case `unaccounted` exists for: a row whose attribute columns
   disagree with the ledger stored beside them, opened by somebody who cannot
   write it, so nothing ever brings the two back together. The line must still
   add up to the tile, and it must say the difference is unexplained. */
{
  const drifted = liveCharacter({
    ...BLANK_CHARACTER,
    xp: 7500,
    physique: 9,
    level_picks: { 1: { major: 'instinct', minor: 'physique' } },
  });
  const math = statMath(drifted);

  if (LIST) console.log('\n===== a drifted row nobody may repair =====');
  for (const key of ['physique', 'instinct', 'mind']) {
    const sum = math[key];
    if (LIST) console.log(`  ${key.padEnd(9)} ${String(drifted[key]).padEnd(4)} ${mathLine(sum)}`);
    if (sum.total !== drifted[key]) {
      findings.push({ sheet: 'drifted row', says: `${key}: line comes to ${sum.total}, tile shows ${drifted[key]}` });
    }
  }
  if (!math.physique.terms.some((t) => t.label === 'unaccounted')) {
    findings.push({ sheet: 'drifted row', says: 'physique: 4 points unexplained and not flagged' });
  }
}

if (findings.length === 0) {
  console.log(`stat math: every line adds up across ${SHEETS.length} sheets`);
  process.exit(0);
}

console.log(`\nstat math: ${findings.length} ${findings.length === 1 ? 'line does' : 'lines do'} not add up\n`);
for (const { sheet, says } of findings) console.log(`  ${sheet}\n    ${says}`);
process.exit(LIST ? 0 : 1);
