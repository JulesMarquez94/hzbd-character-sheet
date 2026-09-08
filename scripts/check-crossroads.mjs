/**
 * The Crossroads pool, and the character a run of it makes.
 *
 * Forty questions written by hand, each option carrying points for things that
 * live in five other registries. Two things go wrong quietly with a pool like
 * that: an id that names nothing (a skill renamed, a weapon retired), and a set
 * that nothing scores, which can never be made at the Crossroads and nobody
 * would notice until a player asked why. So this reads every id against the
 * codex, and then walks the road a few thousand times with random answers and
 * counts who came out the other end.
 *
 *   node scripts/check-crossroads.mjs        report and exit 1 on any finding
 *   node scripts/check-crossroads.mjs --list print every case and the census
 *
 * The census at the foot is the part worth reading after a change to the pool:
 * how often each set, lineage and background wins, and how often each question
 * is asked. A set that wins one run in a thousand is not broken, but it is a
 * number the designer should see.
 */

import { ARMOR_DEFAULTS, QUESTIONS, STAGES, WEAPON_DEFAULTS } from '../src/lib/crossroadsPool.js';
import {
  CROSSROADS_LEVEL,
  RUN_LENGTH,
  answer,
  applyOutcome,
  armorStat,
  decide,
  lineageRaises,
  newRun,
  resolve,
  sentenceOf,
  setLeans,
  walk,
  weaponStat,
} from '../src/lib/crossroads.js';
import { ATTRIBUTE_KEYS } from '../src/lib/attributes.js';
import { TALENTS, getTalent, normalizeTalents } from '../src/lib/talents.js';
import { LINEAGES } from '../src/lib/lineages.js';
import { BACKGROUNDS, SKILLS, normalizeKit, skillPicks } from '../src/lib/backgrounds.js';
import { ARMOR_SETS, startingWeapons } from '../src/lib/items.js';
import { BLANK_CHARACTER, XP_TABLE } from '../src/lib/characterModel.js';
import { levelPicksState } from '../src/lib/levelPicks.js';

const LIST = process.argv.includes('--list');
const RUNS = 4000;
const MAX_OPTIONS = 4;
const findings = [];

function check(what, got, want) {
  const same = JSON.stringify(got) === JSON.stringify(want);
  if (LIST) console.log(`  ${same ? 'ok  ' : 'FAIL'} ${what}${same ? '' : `  got ${JSON.stringify(got)}`}`);
  if (!same) findings.push({ what, got, want });
}

function section(title) {
  if (LIST) console.log(`\n===== ${title} =====`);
}

/** The script's own dice, apart from the run's: which answer a random player gives. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WRITTEN = TALENTS.filter((talent) => !talent.stub);
const TALENT_IDS = new Set(TALENTS.map((talent) => talent.id));
const LINEAGE_IDS = new Set(LINEAGES.map((lineage) => lineage.id));
const BACKGROUND_IDS = new Set(BACKGROUNDS.map((background) => background.id));
const SKILL_IDS = new Set(SKILLS.map((skill) => skill.id));
const WEAPON_IDS = new Set(startingWeapons().map((weapon) => weapon.id));
const ARMOR_NAMES = new Set(Object.keys(ARMOR_SETS));
const GROUP_IDS = {
  attribute: new Set(ATTRIBUTE_KEYS),
  talent: TALENT_IDS,
  lineage: LINEAGE_IDS,
  background: BACKGROUND_IDS,
  skill: SKILL_IDS,
  weapon: WEAPON_IDS,
  armor: ARMOR_NAMES,
};

/* ------------------------------------------------------------------ the pool */

section('the stages');
{
  const ids = STAGES.map((stage) => stage.id);
  check('stage ids are unique', new Set(ids).size, ids.length);
  check('every stage draws at least one', STAGES.every((stage) => stage.draw >= 1), true);
  check('RUN_LENGTH is the sum of the draws', RUN_LENGTH, STAGES.reduce((n, s) => n + s.draw, 0));
}

section('every question is whole');
{
  const ids = QUESTIONS.map((question) => question.id);
  check('question ids are unique', new Set(ids).size, ids.length);

  const stageIds = new Set(STAGES.map((stage) => stage.id));
  const tagsByStage = new Map(STAGES.map((stage) => [stage.id, new Set()]));
  for (const question of QUESTIONS) {
    for (const option of question.options) {
      for (const tag of option.tags ?? []) tagsByStage.get(question.stage)?.add(tag);
    }
  }

  for (const question of QUESTIONS) {
    const where = question.id;
    check(`${where}: stage is known`, stageIds.has(question.stage), true);
    check(`${where}: asks something`, Boolean(question.asks?.trim()), true);
    check(`${where}: the scene ends by asking`, /\?$/.test(question.asks.trim()), true);
    check(`${where}: recalls something`, Boolean(question.recall?.trim()), true);
    check(`${where}: at least two options`, question.options.length >= 2, true);
    check(`${where}: at most ${MAX_OPTIONS} options`, question.options.length <= MAX_OPTIONS, true);

    const optionIds = question.options.map((option) => option.id);
    check(`${where}: option ids are unique`, new Set(optionIds).size, optionIds.length);

    for (const option of question.options) {
      const at = `${where}/${option.id}`;
      check(`${at}: has a label`, Boolean(option.label?.trim()), true);
      const sentence = sentenceOf({ question, option });
      check(`${at}: the story sentence ends`, /[.!?]$/.test(sentence), true);
      check(`${at}: the story sentence has no double space`, /\s\s/.test(sentence), false);
      check(`${at}: gives something`, Object.keys(option.gives ?? {}).length > 0, true);
    }

    /* A `requires` tag has to be one some earlier stage can set, or the question
       can never be asked and is dead weight in the pool. */
    if (question.requires) {
      const before = STAGES.slice(0, STAGES.findIndex((stage) => stage.id === question.stage));
      const reachable = new Set(before.flatMap((stage) => [...tagsByStage.get(stage.id)]));
      for (const tag of question.requires) {
        check(`${where}: requires "${tag}", which an earlier stage sets`, reachable.has(tag), true);
      }
    }
  }
}

section('every point lands on something real');
{
  for (const question of QUESTIONS) {
    for (const option of question.options) {
      for (const [group, points] of Object.entries(option.gives ?? {})) {
        const at = `${question.id}/${option.id}`;
        const known = GROUP_IDS[group];
        check(`${at}: "${group}" is a group`, Boolean(known), true);
        if (!known) continue;
        for (const [id, value] of Object.entries(points)) {
          check(`${at}: ${group} ${id} exists`, known.has(id), true);
          check(`${at}: ${group} ${id} is a positive whole number`, Number.isInteger(value) && value > 0, true);
        }
      }
    }
  }
}

section('every answer leans one way');
{
  for (const question of QUESTIONS) {
    for (const option of question.options) {
      const at = `${question.id}/${option.id}`;
      const gives = option.gives ?? {};
      const lanes = Object.keys(gives.attribute ?? {});
      check(`${at}: gives exactly one attribute`, lanes.length, 1);
      const lane = lanes[0];
      if (!lane) continue;
      check(`${at}: the attribute point is 1 or 2`, [1, 2].includes(gives.attribute[lane]), true);

      for (const id of Object.keys(gives.talent ?? {})) {
        const talent = getTalent(id);
        check(`${at}: ${id} is shelved on ${lane} or on nothing`, talent ? setLeans(talent, lane) : false, true);
      }
      for (const id of Object.keys(gives.lineage ?? {})) {
        const lineage = LINEAGES.find((one) => one.id === id);
        const raises = lineage ? lineageRaises(lineage) : [];
        check(`${at}: ${id} raises ${lane} or nothing`, raises.every((key) => key === lane), true);
      }
      for (const id of Object.keys(gives.weapon ?? {})) {
        const weapon = startingWeapons().find((one) => one.id === id);
        check(`${at}: ${id} scales on ${lane}`, weapon ? weaponStat(weapon) : null, lane);
      }
      for (const name of Object.keys(gives.armor ?? {})) {
        check(`${at}: ${name} suits ${lane}`, armorStat(name), lane);
      }
    }
  }
}

section('every stage can always be filled');
{
  for (const stage of STAGES) {
    const free = QUESTIONS.filter((question) => question.stage === stage.id && !question.requires).length;
    check(`${stage.id}: ${free} unconditional questions for a draw of ${stage.draw}`, free >= stage.draw, true);
  }
}

section('everything written can be scored');
{
  const scored = { talent: new Set(), lineage: new Set(), background: new Set(), attribute: new Set(), skill: new Set() };
  for (const question of QUESTIONS) {
    for (const option of question.options) {
      for (const group of Object.keys(scored)) {
        for (const id of Object.keys(option.gives?.[group] ?? {})) scored[group].add(id);
      }
    }
  }
  for (const talent of WRITTEN) check(`talent ${talent.id} is scored somewhere`, scored.talent.has(talent.id), true);
  for (const lineage of LINEAGES) check(`lineage ${lineage.id} is scored somewhere`, scored.lineage.has(lineage.id), true);
  for (const background of BACKGROUNDS) check(`background ${background.id} is scored somewhere`, scored.background.has(background.id), true);
  for (const key of ATTRIBUTE_KEYS) check(`attribute ${key} is scored somewhere`, scored.attribute.has(key), true);

  /* Skills are a softer promise: a pool skill nothing scores is filled in by pool
     order, which is a choice nobody made. Counted rather than failed. */
  const offered = new Set(BACKGROUNDS.flatMap((background) => background.skills.map((skill) => skill.id)));
  const unscored = [...offered].filter((id) => !scored.skill.has(id));
  if (LIST) console.log(`  info  ${offered.size - unscored.length} of ${offered.size} level-1 skills are scored${unscored.length ? `; unscored: ${unscored.join(', ')}` : ''}`);
}

section('the defaults are real');
{
  for (const [key, ids] of Object.entries(WEAPON_DEFAULTS)) {
    check(`weapon defaults name an attribute: ${key}`, ATTRIBUTE_KEYS.includes(key), true);
    for (const id of ids) {
      const weapon = startingWeapons().find((one) => one.id === id);
      check(`weapon default ${id} is a starting weapon`, Boolean(weapon), true);
      check(`weapon default ${id} scales on ${key}`, weapon ? weaponStat(weapon) : null, key);
    }
  }
  for (const [key, name] of Object.entries(ARMOR_DEFAULTS)) {
    check(`armor defaults name an attribute: ${key}`, ATTRIBUTE_KEYS.includes(key), true);
    check(`armor default ${name} is a set`, ARMOR_NAMES.has(name), true);
    check(`armor default ${name} reads back as ${key}`, armorStat(name), key);
  }
  check('every attribute has a weapon default', ATTRIBUTE_KEYS.every((key) => WEAPON_DEFAULTS[key]?.length > 0), true);
  check('every attribute has an armor default', ATTRIBUTE_KEYS.every((key) => ARMOR_DEFAULTS[key]), true);
}

/* ------------------------------------------------------------------- the walk */

/** A whole run answered at random, and the question ids in the order asked. */
function randomWalk(seed) {
  const dice = mulberry32(seed ^ 0x9e3779b9);
  let run = newRun(seed);
  const asked = [];
  for (let guard = 0; guard < RUN_LENGTH + 1; guard += 1) {
    const view = walk(run);
    if (view.done) break;
    asked.push(view.current.question.id);
    const options = view.current.question.options;
    run = answer(run, options[Math.floor(dice() * options.length)].id);
  }
  return { run, asked };
}

section('a run replays');
{
  let same = true;
  let honoured = true;
  let backable = true;
  for (let seed = 1; seed <= 50 && same && honoured && backable; seed += 1) {
    const first = walk(newRun(seed));
    const again = walk(newRun(seed));
    same = first.current?.question.id === again.current?.question.id;

    const { run, asked } = randomWalk(seed);
    const replayed = walk(run);
    honoured =
      replayed.done &&
      !replayed.trimmed &&
      replayed.steps.length === asked.length &&
      replayed.steps.every((step, index) => step.question.id === asked[index]);

    /* Stepping back lands on the question that was asked there, not a new draw. */
    const fewer = { ...run, answers: run.answers.slice(0, 5) };
    backable = walk(fewer).current?.question.id === asked[5];
  }
  check('the same seed asks the same first question', same, true);
  check('a finished run replays the questions it asked, in order', honoured, true);
  check('taking answers back lands on the question that was asked there', backable, true);
}

section(`${RUNS} walks`);
{
  const wins = { talent: new Map(), lineage: new Map(), background: new Map(), major: new Map() };
  const askedCount = new Map();
  let shape = null;
  let lengths = new Set();

  for (let seed = 1; seed <= RUNS; seed += 1) {
    const { run, asked } = randomWalk(seed);
    lengths.add(asked.length);
    for (const id of asked) askedCount.set(id, (askedCount.get(id) ?? 0) + 1);

    const outcome = resolve(run);
    for (const talent of outcome.talents) wins.talent.set(talent.id, (wins.talent.get(talent.id) ?? 0) + 1);
    wins.lineage.set(outcome.lineage.id, (wins.lineage.get(outcome.lineage.id) ?? 0) + 1);
    wins.background.set(outcome.background.id, (wins.background.get(outcome.background.id) ?? 0) + 1);
    wins.major.set(outcome.major, (wins.major.get(outcome.major) ?? 0) + 1);

    if (shape) continue;
    const problems = [];
    if (outcome.talents.length !== 2) problems.push(`talents ${outcome.talents.length}`);
    if (outcome.talents[0]?.id === outcome.talents[1]?.id) problems.push('same set twice');
    if (outcome.talents.some((talent) => talent.stub)) problems.push('a placeholder won');
    if (outcome.major === outcome.minor) problems.push('major is minor');
    if (outcome.skills.length !== skillPicks(outcome.background)) problems.push(`skills ${outcome.skills.length}`);
    if (!outcome.skills.every((skill) => outcome.background.skills.includes(skill))) problems.push('a skill outside the pool');
    if (outcome.weapons.length !== outcome.background.kit.weapons) problems.push(`weapons ${outcome.weapons.length}`);
    if (new Set(outcome.weapons.map((weapon) => weapon.id)).size !== outcome.weapons.length) problems.push('a weapon twice');
    if (!ARMOR_NAMES.has(outcome.armorSet)) problems.push(`armor ${outcome.armorSet}`);
    if (outcome.story.length !== 3) problems.push(`story paragraphs ${outcome.story.length}`);

    /* And nothing built on the attribute left lowest. */
    const stands = (talent) => setLeans(talent, outcome.major) || setLeans(talent, outcome.minor);
    if (!outcome.talents.every(stands)) problems.push('a set on the lowest attribute');
    if (lineageRaises(outcome.lineage).includes(outcome.least)) problems.push('a lineage raising the lowest attribute');
    if (!outcome.weapons.every((weapon) => [null, outcome.major, outcome.minor].includes(weaponStat(weapon)))) problems.push('a weapon on the lowest attribute');
    if (![outcome.major, outcome.minor].includes(armorStat(outcome.armorSet))) problems.push('armor for the lowest attribute');
    if (problems.length) shape = `seed ${seed}: ${problems.join(', ')}`;
  }

  check('every run asks the whole road', [...lengths], [RUN_LENGTH]);
  check('every outcome is a whole character', shape, null);

  for (const talent of WRITTEN) check(`${talent.name} wins at least once`, (wins.talent.get(talent.id) ?? 0) > 0, true);
  for (const lineage of LINEAGES) check(`${lineage.name} wins at least once`, (wins.lineage.get(lineage.id) ?? 0) > 0, true);
  for (const background of BACKGROUNDS) check(`${background.name} wins at least once`, (wins.background.get(background.id) ?? 0) > 0, true);
  for (const key of ATTRIBUTE_KEYS) check(`${key} takes the +2 at least once`, (wins.major.get(key) ?? 0) > 0, true);

  const neverAsked = QUESTIONS.filter((question) => !askedCount.has(question.id)).map((question) => question.id);
  check('every question is asked in some run', neverAsked, []);

  if (LIST) {
    const pct = (n, of = RUNS) => `${((100 * n) / of).toFixed(1)}%`;
    const table = (title, rows) => {
      console.log(`\n  ${title}`);
      for (const [name, n] of rows) console.log(`    ${name.padEnd(20)} ${String(n).padStart(5)}  ${pct(n)}`);
    };
    table('talent sets held (two a run)', WRITTEN.map((t) => [t.name, wins.talent.get(t.id) ?? 0]).sort((a, b) => b[1] - a[1]));
    table('lineages', LINEAGES.map((l) => [l.name, wins.lineage.get(l.id) ?? 0]).sort((a, b) => b[1] - a[1]));
    table('backgrounds', BACKGROUNDS.map((b) => [b.name, wins.background.get(b.id) ?? 0]).sort((a, b) => b[1] - a[1]));
    table('the +2', ATTRIBUTE_KEYS.map((k) => [k, wins.major.get(k) ?? 0]));
    console.log('\n  how often each question is asked');
    for (const stage of STAGES) {
      const rows = QUESTIONS.filter((q) => q.stage === stage.id).map((q) => [q.id, askedCount.get(q.id) ?? 0]);
      for (const [id, n] of rows) console.log(`    ${id.padEnd(20)} ${String(n).padStart(5)}  ${pct(n)}`);
    }
  }
}

/* -------------------------------------------------------------- the refusal */

/** A tally written by hand, in the shape `tally` hands back. */
function count(spec) {
  const scores = {};
  for (const group of ['attribute', 'talent', 'lineage', 'background', 'skill', 'weapon', 'armor']) {
    scores[group] = new Map();
  }
  for (const [group, points] of Object.entries(spec)) {
    for (const [id, score] of Object.entries(points)) scores[group].set(id, { score, first: 0 });
  }
  return scores;
}

const ids = (list) => list.map((item) => item.id);

section('the count refuses a contradiction');
{
  /* Jules's own example: a Guardian and a Duelist out-scoring everything while
     Mind carries the most points. The Guardian stands on the Physique that is
     left lowest, so it is refused; the Duelist stands on the Instinct 5 and
     stays; the Arcanist, the only Mind set that scored, takes level 1. */
  const jules = decide(count({
    attribute: { mind: 9, instinct: 4, physique: 3 },
    talent: { guardian: 7, duelist: 6, arcanist: 2 },
  }));
  check('Mind takes the +2', [jules.major, jules.minor, jules.least], ['mind', 'instinct', 'physique']);
  check('the Arcanist leads and the Duelist follows; the Guardian is refused', ids(jules.talents), ['arcanist', 'duelist']);

  /* The same count with Physique second: now the Guardian stays and the Duelist
     is the one on the lowest attribute. */
  const flipped = decide(count({
    attribute: { mind: 9, physique: 4, instinct: 3 },
    talent: { guardian: 7, duelist: 6, arcanist: 2 },
  }));
  check('with Physique second the Guardian stays and the Duelist goes', ids(flipped.talents), ['arcanist', 'guardian']);

  /* No set on the +2 scored at all: the strongest set that fits leads, and
     nothing on the lowest attribute is reached for. */
  const noLead = decide(count({
    attribute: { mind: 5, physique: 4, instinct: 1 },
    talent: { guardian: 5, berserker: 2, duelist: 4 },
  }));
  check('without a Mind set the Guardian leads on the Physique beside it', ids(noLead.talents), ['guardian', 'berserker']);

  /* A set shelved on no attribute stands beside anything, and the second set
     still comes from the two highest. */
  const bond = decide(count({
    attribute: { instinct: 6, mind: 2, physique: 1 },
    talent: { 'draconic-bond': 5 },
  }));
  check('the Draconic Bond leads', bond.talents[0].id, 'draconic-bond');
  check('and the second set is not built on Physique', setLeans(bond.talents[1], 'instinct') || setLeans(bond.talents[1], 'mind'), true);

  /* A lineage that raises the lowest attribute is refused however many points
     it gathered. */
  const stalwart = decide(count({
    attribute: { mind: 6, instinct: 3, physique: 1 },
    lineage: { stalwart: 9, luminary: 1 },
  }));
  check('Stalwart cannot raise a Physique left at 4', stalwart.lineage.id, 'luminary');

  /* A weapon that scales on the lowest attribute is refused; so is its armor. */
  const arms = decide(count({
    attribute: { physique: 6, mind: 3, instinct: 1 },
    weapon: { 'finesse-weapon': 9 },
    armor: { 'Light Armor': 9 },
  }));
  check('a finesse blade is refused to an Instinct of 4', weaponStat(arms.weapons[0]), 'physique');
  check('and Light Armor with it', arms.armorSet, 'Heavy Armor');

  /* An empty count still makes a whole character. */
  const blank = decide(count({}));
  check('an empty count has two sets', blank.talents.length, 2);
  check('and a lineage, a background, a weapon and an armor set', [
    Boolean(blank.lineage), Boolean(blank.background), blank.weapons.length >= 1, Boolean(blank.armorSet),
  ], [true, true, true, true]);
}

/* ------------------------------------------------------------------ the patch */

section('the patch makes a level 2 character');
{
  let problem = null;
  for (let seed = 1; seed <= 300 && !problem; seed += 1) {
    const { run } = randomWalk(seed);
    const outcome = resolve(run);
    const blank = { ...BLANK_CHARACTER, id: `local-${seed}` };
    const patch = applyOutcome(blank, outcome);
    const made = { ...blank, ...patch };
    const problems = [];

    const talents = normalizeTalents(made.talents);
    if (talents.length !== 2) problems.push(`talent rows ${talents.length}`);
    if (talents[0]?.id !== outcome.talents[0].id || JSON.stringify(talents[0]?.taken) !== '[1]') problems.push('level 1 talent');
    if (talents[1]?.id !== outcome.talents[1].id || JSON.stringify(talents[1]?.taken) !== '[2]') problems.push('level 2 talent');

    const picks = levelPicksState(made, CROSSROADS_LEVEL);
    if (picks.boosts?.major !== outcome.major || picks.boosts?.minor !== outcome.minor) problems.push('the spread');
    if (picks.drift.length) problems.push(`attribute drift ${picks.drift.join(',')}`);
    if (made.lineage !== outcome.lineage.name) problems.push('lineage');
    if (made.background !== outcome.background.name) problems.push('background');
    if (JSON.stringify(made.background_skills) !== JSON.stringify(outcome.skills.map((s) => s.id))) problems.push('skills');

    const kit = normalizeKit(made.background_kit);
    if (!kit || kit.armorSet !== outcome.armorSet) problems.push('kit armor');
    if (JSON.stringify(kit?.weapons) !== JSON.stringify(outcome.weapons.map((w) => w.id))) problems.push('kit weapons');
    if (made.equipment?.main_hand !== outcome.weapons[0].id) problems.push('main hand');
    if (outcome.weapons[1] && made.equipment?.off_hand !== outcome.weapons[1].id) problems.push('off hand');
    if (!made.equipment?.head || !made.equipment?.torso || !made.equipment?.legs) problems.push('armor worn');
    if (made.wealth !== outcome.background.kit.coins) problems.push(`wealth ${made.wealth}`);
    if (made.supplies !== outcome.background.kit.supplies) problems.push(`supplies ${made.supplies}`);

    if (made.xp !== XP_TABLE[CROSSROADS_LEVEL]) problems.push(`xp ${made.xp}`);
    if (made.level !== CROSSROADS_LEVEL) problems.push(`level ${made.level}`);
    if (!made.ledger?.some((row) => row.kind === 'xp' && row.delta === XP_TABLE[CROSSROADS_LEVEL])) problems.push('xp ledger');
    if (!String(made.lore?.backstory ?? '').trim()) problems.push('backstory');
    if (made.lore?.backstory !== outcome.story.join('\n\n')) problems.push('backstory text');

    if (problems.length) problem = `seed ${seed}: ${problems.join(', ')}`;
  }
  check('three hundred patches, each a whole level 2 character', problem, null);
}

section('a second take does not double anything');
{
  const { run } = randomWalk(7);
  const outcome = resolve(run);
  const blank = { ...BLANK_CHARACTER, id: 'local-7' };
  const once = { ...blank, ...applyOutcome(blank, outcome) };

  const { run: other } = randomWalk(8);
  const again = resolve(other);
  const twice = { ...once, ...applyOutcome(once, again) };

  check('the purse is the second kit alone', twice.wealth, again.background.kit.coins);
  check('the supplies are the second kit alone', twice.supplies, again.background.kit.supplies);
  check('two talent rows, not four', normalizeTalents(twice.talents).length, 2);
  check('the experience is not stamped twice', twice.xp, XP_TABLE[CROSSROADS_LEVEL]);
  check('the first backstory is kept', twice.lore.backstory, once.lore.backstory);
  check('the first kit is off the body', Object.values(twice.equipment).filter(Boolean).length <= 5, true);
}

/* ----------------------------------------------------------------- the verdict */

if (findings.length) {
  console.error(`\n${findings.length} finding${findings.length === 1 ? '' : 's'} in the Crossroads:\n`);
  for (const finding of findings.slice(0, 40)) {
    console.error(`  ${finding.what}\n    got  ${JSON.stringify(finding.got)}\n    want ${JSON.stringify(finding.want)}`);
  }
  if (findings.length > 40) console.error(`  … and ${findings.length - 40} more`);
  process.exit(1);
}

console.log(
  `Crossroads: ${QUESTIONS.length} questions in ${STAGES.length} stages, ${RUN_LENGTH} asked a run, ${RUNS} walks, every written set, lineage and background reachable.`
);
