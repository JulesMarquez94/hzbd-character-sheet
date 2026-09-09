/**
 * The Crossroads: a run of questions, the points they leave and the character
 * they add up to.
 *
 * The fourth way to make a character. You are put in eight moments of the
 * life you led, across seven stages, and asked what you do in each; every
 * answer puts points on the things a character is made of. When the last one is
 * answered the points are counted and the drifter is made at level 2, with both
 * talent choices spent. The questions are in crossroadsPool.js; this is the
 * walk and the arithmetic.
 *
 * ------------------------------------------------------------------- the run
 * A run is two things and nothing else: a seed and the answers so far.
 *
 *   { seed: 2716057, answers: [{ question: 'birth-where', option: 'port' }, …] }
 *
 * Everything on screen is derived from that by `walk`, which replays the draw
 * from the seed and stops at the first question without an answer. The same
 * seed with the same answers always asks the same questions, so a run survives
 * a refresh as two small values in sessionStorage, and stepping back is one
 * answer off the end of the list. No question order is ever stored, because
 * none needs to be.
 *
 * ------------------------------------------------------------------ the draw
 * Each stage asks `draw` questions from its pool. The pool at each step is
 * every question of the stage not yet asked whose `requires` (if any) an earlier
 * answer has satisfied. One is drawn at random, weighted toward whatever the run
 * has not yet given a chance to: a question that offers a talent set, lineage or
 * background no earlier question offered is more likely to be drawn than one
 * that repeats ground already covered. This is the pool rotating on purpose,
 * so that a set nobody has been asked about yet is not shut out of the count by
 * the luck of the draw.
 *
 * ----------------------------------------------------------------- the count
 * Points are summed per id. Ties break on which id was scored **earliest** in
 * the run, because the earliest answers are childhood and blood and those are
 * the deepest roots, and then on the codex's own order. Written talent sets
 * only: a roster placeholder can gather points and never wins.
 *
 * ------------------------------------------------------------ it has to add up
 * Jules, 2026-09-08: "it shouldn't be possible for you to get something like a
 * Duelist and Guardian, which are marked as Instinct and Physique, and to have
 * Mind as the highest stat. There should be a certain amount of logic."
 *
 * Two halves. The pool's half is that every answer leans one way (see the laws
 * at the top of crossroadsPool.js), so the points a player puts down agree with
 * themselves. This file's half is the rule the count keeps whatever the points
 * say: **nothing is ever built on the attribute you left lowest.**
 *
 *   The three attributes rank by points: the +2, the +1 and the one left at 4.
 *   The two talent sets are shelved on the +2 or the +1, or on no attribute at
 *     all (the Draconic Bond and the Pact stand beside anything). The set at
 *     level 1 is the strongest of those shelved on the +2, when any such set
 *     scored; the set at level 2 is the strongest of the rest.
 *   A lineage whose card raises an attribute never raises the lowest one.
 *   The kit's weapon scales on the +2 or the +1, and its armor is the set that
 *     suits one of them.
 *
 * So a Mind 6 may hold an Arcanist and a Guardian, since the Guardian stands on
 * the Physique 5 beside it, and can never hold a Duelist while Instinct sits at
 * 4. `decide` below is the whole of that rule, and scripts/check-crossroads.mjs
 * feeds it exactly the count Jules described and expects it refused.
 *
 * Where nothing was scored at all, the count falls back on the highest
 * attribute: a set that leans on it, a lineage that raises it, the armor and
 * weapon crossroadsPool.js lists for it. A run of eight answers never gets
 * that far in practice, and the fallback is there so the outcome is always a
 * whole character.
 *
 * -------------------------------------------------------------- what it makes
 * Level 2. The strongest set at level 1 and the second at level 2, both at
 * Novice. The +2 on the highest attribute and the +1 on the next. The strongest
 * lineage and background, the background's skills in the order the answers
 * leaned, and the outfitter's armor and weapon from the same count. The answers
 * are told as a short story on the lore page, a paragraph for each chapter of
 * the life and a last one for who you became (crossroadsStory.js). Everything
 * is written through the same functions the level-1 panels write with, so a
 * Crossroads character is a character like any other and every choice can be
 * changed afterwards from the Advancement tab.
 */

import { ATTRIBUTE_KEYS, getAttribute } from './attributes.js';
import { TALENTS, chooseAt } from './talents.js';
import { LINEAGES } from './lineages.js';
import { BACKGROUNDS, normalizeKit, skillPicks } from './backgrounds.js';
import { ARMOR_SETS, startingWeapons } from './items.js';
import { getCard } from './weapons.js';
import { XP_TABLE, appendLedger, newLedgerId, xpForLevel } from './characterModel.js';
import { setBoosts, setLineage } from './levelPicks.js';
import { buildKitPatch, buildReturnPatch } from './kit.js';
import { ARMOR_DEFAULTS, QUESTIONS, STAGES, WEAPON_DEFAULTS } from './crossroadsPool.js';
import { narrate, sentenceOf } from './crossroadsStory.js';

export { sentenceOf };

/** How many questions a whole run asks, when no stage runs short. */
export const RUN_LENGTH = STAGES.reduce((total, stage) => total + stage.draw, 0);

/** The level a Crossroads character is made at, and what the ledger is stamped with. */
export const CROSSROADS_LEVEL = 2;
export const CROSSROADS_NOTE = 'Made at the Crossroads';

/* ------------------------------------------------------------------- the dice */

/**
 * A small seeded generator (mulberry32), so a run replays from its seed. The
 * dice tray's own randomness is not used here on purpose: this is not a roll
 * anybody sees, and a run has to come back the same after a refresh.
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed() {
  const bytes = globalThis.crypto?.getRandomValues?.(new Uint32Array(1));
  return bytes ? bytes[0] >>> 0 : Math.floor(Math.random() * 4294967296) >>> 0;
}

/** A fresh run: a seed and no answers. */
export function newRun(seed = randomSeed()) {
  return { seed: seed >>> 0, answers: [] };
}

/* ------------------------------------------------------------------- the walk */

const WRITTEN = new Set(TALENTS.filter((talent) => !talent.stub).map((talent) => talent.id));

/**
 * What a question gives a chance to: every written set, lineage and background
 * any of its options scores. The draw leans toward questions that widen this.
 */
function offered(question) {
  const ids = new Set();
  for (const option of question.options) {
    const gives = option.gives ?? {};
    for (const id of Object.keys(gives.talent ?? {})) if (WRITTEN.has(id)) ids.add(`talent:${id}`);
    for (const id of Object.keys(gives.lineage ?? {})) ids.add(`lineage:${id}`);
    for (const id of Object.keys(gives.background ?? {})) ids.add(`background:${id}`);
  }
  return ids;
}

function gain(question, covered) {
  let n = 0;
  for (const id of offered(question)) if (!covered.has(id)) n += 1;
  return n;
}

/** The questions a stage may still ask, given what has been asked and answered. */
function eligible(stageId, asked, tags) {
  return QUESTIONS.filter(
    (question) =>
      question.stage === stageId &&
      !asked.has(question.id) &&
      (!question.requires || question.requires.some((tag) => tags.has(tag)))
  );
}

/** One question out of the pool, weighted toward what the run has not covered. */
function draw(pool, covered, rng) {
  const weights = pool.map((question) => 1 + 2 * gain(question, covered));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = rng() * total;
  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i];
    if (roll < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * The run replayed: every question asked so far, with its answer where one has
 * been given, stopping at the first without one.
 *
 *   steps     [{ index, stage, question, option }] in the order asked. `option`
 *             is null on the one still waiting
 *   current   the step waiting for an answer, or null when the run is done
 *   done      every stage has asked its share and every question is answered
 *   answered  how many answers stand
 *   trimmed   an answer named a question this replay did not draw, so the pool
 *             has changed under a stored run. Everything from there on is
 *             ignored and the caller should cut `answers` to `answered`
 */
export function walk(run) {
  const rng = mulberry32(run?.seed ?? 0);
  const answers = Array.isArray(run?.answers) ? run.answers : [];
  const asked = new Set();
  const tags = new Set();
  const covered = new Set();
  const steps = [];
  let trimmed = false;
  let waiting = false;

  for (const stage of STAGES) {
    if (waiting) break;
    for (let k = 0; k < stage.draw; k += 1) {
      const pool = eligible(stage.id, asked, tags);
      // A stage with nothing left to ask is a shorter stage this run, not an error.
      if (pool.length === 0) break;

      const question = draw(pool, covered, rng);
      asked.add(question.id);
      for (const id of offered(question)) covered.add(id);

      const given = answers[steps.length];
      const option =
        given && given.question === question.id
          ? question.options.find((one) => one.id === given.option) ?? null
          : null;

      steps.push({ index: steps.length, stage, question, option });

      if (!option) {
        if (given) trimmed = true;
        waiting = true;
        break;
      }
      for (const tag of option.tags ?? []) tags.add(tag);
    }
  }

  const current = waiting ? steps[steps.length - 1] : null;
  return {
    steps,
    current,
    done: !waiting,
    answered: steps.filter((step) => step.option).length,
    total: RUN_LENGTH,
    trimmed,
  };
}

/** The run with the waiting question answered. Anything else is left alone. */
export function answer(run, optionId) {
  const view = walk(run);
  if (!view.current) return run;
  const { question } = view.current;
  if (!question.options.some((option) => option.id === optionId)) return run;
  return {
    ...run,
    answers: [...run.answers.slice(0, view.answered), { question: question.id, option: optionId }],
  };
}

/** The run with its last answer taken back. */
export function back(run) {
  return { ...run, answers: run.answers.slice(0, -1) };
}

/** The run cut to the answers a replay still honours. See `trimmed` on walk. */
export function repair(run) {
  const view = walk(run);
  return view.trimmed ? { ...run, answers: run.answers.slice(0, view.answered) } : run;
}

/* ------------------------------------------------------------------ the count */

const GROUPS = ['attribute', 'talent', 'lineage', 'background', 'skill', 'weapon', 'armor'];

/**
 * Every point the answers so far have put down, per group, as
 * `Map<id, { score, first }>` where `first` is the index of the step that first
 * scored the id.
 */
export function tally(run) {
  const scores = {};
  for (const group of GROUPS) scores[group] = new Map();

  for (const step of walk(run).steps) {
    if (!step.option) continue;
    for (const group of GROUPS) {
      for (const [id, raw] of Object.entries(step.option.gives?.[group] ?? {})) {
        const points = Math.max(0, Math.floor(Number(raw) || 0));
        if (!points) continue;
        const row = scores[group].get(id) ?? { score: 0, first: step.index };
        row.score += points;
        scores[group].set(id, row);
      }
    }
  }
  return scores;
}

/**
 * A registry's entries in the order the count puts them: most points first,
 * earliest-scored first among equals, then whatever `prefer` says (a number,
 * higher first), then the registry's own order.
 */
function rank(items, bucket, keyOf = (item) => item.id, prefer = () => 0) {
  return items
    .map((item, index) => {
      const row = bucket.get(keyOf(item)) ?? { score: 0, first: Infinity };
      return { item, index, score: row.score, first: row.first, prefer: prefer(item) };
    })
    .sort(
      (a, b) => b.score - a.score || a.first - b.first || b.prefer - a.prefer || a.index - b.index
    )
    .map((row) => row.item);
}

/* ------------------------------------------------------------- what leans where
 * The vocabulary the coherence rule is written in, exported so the checker can
 * hold the pool to the same words.
 */

const isAttribute = (stat) => ATTRIBUTE_KEYS.includes(stat);

/** Whether a set can stand beside an attribute: shelved on it, or on none. */
export function setLeans(talent, key) {
  return !isAttribute(talent?.stat) || talent.stat === key;
}

/** The attributes an ancestry's cards raise, as keys. Empty for most of them. */
export function lineageRaises(lineage) {
  return ATTRIBUTE_KEYS.filter((key) => Math.floor(Number(lineage?.attributes?.[key]) || 0) > 0);
}

/**
 * The attribute a weapon scales on, read off its first card rather than off a
 * table of its own: a Fist Weapon strikes with Instinct and a Long Bow draws on
 * Physique because the codex says so, and the Crossroads has no business saying
 * otherwise. Null for a weapon whose card names none.
 */
export function weaponStat(weapon) {
  const stat = getCard(weapon?.abilities?.[0])?.stat;
  return isAttribute(stat) ? stat : null;
}

/** The attribute an armor set suits, which is the one whose default it is. */
export function armorStat(setName) {
  return Object.keys(ARMOR_DEFAULTS).find((key) => ARMOR_DEFAULTS[key] === setName) ?? null;
}

/**
 * The character a tally adds up to, under the rule that nothing is built on the
 * attribute left lowest. Whole even on an empty tally, by the fallbacks
 * described at the top of the file. `resolve` hands it a run's own count; the
 * checker hands it counts written by hand.
 *
 *   major, minor   attribute keys for the +2 and the +1
 *   least          the one left at 4
 *   attributes     the three, best first
 *   talents        two written sets, the level-1 set first
 *   lineage, background
 *   skills         the background's skills the count kept, as many as it teaches
 *   weapons        as many as the background's kit arms
 *   armorSet       a set name
 *   story          the life as a short story, one paragraph a chapter and a
 *                  last one for who you became, as `{ stage, title, text }`.
 *                  See crossroadsStory.js
 *   scores         the tally, for anything that wants to say why
 */
export function decide(scores, steps = []) {
  const points = (group, id) => scores[group]?.get(id)?.score ?? 0;

  const attributes = rank(ATTRIBUTE_KEYS.map(getAttribute), scores.attribute, (a) => a.key);
  const [major, minor, least] = attributes.map((attribute) => attribute.key);

  /* Sets shelved on the +2 or the +1, or on nothing. The level-1 set is the
     strongest of those that stand on the +2 and actually scored; failing any,
     the strongest that fits at all. The level-2 set is the strongest of the
     rest. Nothing shelved on the lowest attribute is ever in the running. */
  const fitting = TALENTS.filter(
    (talent) => !talent.stub && (setLeans(talent, major) || setLeans(talent, minor))
  );
  const ordered = rank(fitting, scores.talent, (talent) => talent.id, (talent) =>
    setLeans(talent, major) ? 1 : 0
  );
  const leading = ordered.filter((talent) => setLeans(talent, major) && points('talent', talent.id) > 0);
  const first = leading[0] ?? ordered[0];
  const second = ordered.find((talent) => talent.id !== first.id);
  const talents = [first, second].filter(Boolean);

  /* An ancestry whose card raises an attribute may not raise the lowest one, and
     one that raises the +2 is the first reached for when the answers named none. */
  const lineage = rank(
    LINEAGES.filter((one) => !lineageRaises(one).includes(least)),
    scores.lineage,
    (one) => one.id,
    (one) => (lineageRaises(one).includes(major) ? 2 : lineageRaises(one).includes(minor) ? 1 : 0)
  )[0];

  const background = rank(BACKGROUNDS, scores.background)[0];
  const skills = rank(background.skills, scores.skill).slice(0, skillPicks(background));

  /* A weapon that scales on the +2 or the +1. Among those, what the level-1 set
     trains on comes first, off its own `martial` spec, so a Duelist made by the
     count holds a finesse blade; then the +2's own weapons; then the defaults. */
  const wants = []
    .concat(first?.martial?.weapon ?? [])
    .map((tag) => String(tag).toLowerCase());
  const defaults = WEAPON_DEFAULTS[major] ?? [];
  const arms = startingWeapons().filter((weapon) => {
    const stat = weaponStat(weapon);
    return !stat || stat === major || stat === minor;
  });
  const weapons = rank(
    arms,
    scores.weapon,
    (weapon) => weapon.id,
    (weapon) => {
      const family = (weapon.tags ?? []).some((tag) => wants.includes(String(tag).toLowerCase()));
      const at = defaults.indexOf(weapon.id);
      return (family ? 20 : 0) + (weaponStat(weapon) === major ? 10 : 0) + (at === -1 ? 0 : defaults.length - at);
    }
  ).slice(0, Math.max(1, Math.floor(Number(background.kit?.weapons) || 1)));

  /* And the armor that suits the +2 or the +1, the +2's first. */
  const armorSet = rank(
    Object.keys(ARMOR_SETS).filter((name) => [major, minor].includes(armorStat(name) ?? major)),
    scores.armor,
    (name) => name,
    (name) => (armorStat(name) === major ? 1 : 0)
  )[0];

  const outcome = {
    major,
    minor,
    least,
    attributes,
    talents,
    lineage,
    background,
    skills,
    weapons,
    armorSet,
    scores,
    steps,
  };

  /* Told last, because the chapters close on what the count decided: the
     blood on the lineage, the trade on the background, the leaving on the set
     at level 1. See crossroadsStory.js. */
  return { ...outcome, story: narrate(steps, outcome) };
}

/** The character a run's answers add up to. See `decide`. */
export function resolve(run) {
  return decide(tally(run), walk(run).steps);
}

/** The story as the lore page stores it: the paragraphs, a blank line between. */
export function storyText(story) {
  return story.map((paragraph) => paragraph.text).join('\n\n');
}

/* ---------------------------------------------------------------- the writing */

/**
 * The single patch that makes the character the outcome describes, written
 * with the same functions the level-1 panels write with.
 *
 * A kit already on the row is handed back first, so a run taken twice does not
 * double the purse, and the talent list starts empty rather than adding to
 * whatever stood there: the Crossroads decides level 1 and level 2 whole. The
 * backstory is written only where none has been, because a paragraph somebody
 * typed is theirs.
 */
export function applyOutcome(character, outcome) {
  let next = { ...character };
  const patch = {};
  const merge = (part) => {
    if (!part) return;
    Object.assign(patch, part);
    next = { ...next, ...part };
  };

  const held = normalizeKit(character?.background_kit);
  if (held) merge(buildReturnPatch({ character: next, kit: held }).patch);

  const [first, second] = outcome.talents;
  merge({ talents: chooseAt(chooseAt([], 1, first.id), 2, second?.id) });

  merge(setBoosts(next, outcome.major, outcome.minor));
  merge(setLineage(next, outcome.lineage.name));

  merge({
    background: outcome.background.name,
    background_skills: outcome.skills.map((skill) => skill.id),
  });
  merge(
    buildKitPatch({
      character: next,
      background: outcome.background,
      armorSet: outcome.armorSet,
      weapons: outcome.weapons.map((weapon) => weapon.id),
    })
  );

  /* Level 2, as experience: the ledger is the record of every level a sheet
     has, so the level the Crossroads hands out goes through it too. A row that
     already stands higher is left where it is. */
  const before = Math.max(0, Math.floor(Number(next.xp) || 0));
  const xp = Math.max(before, XP_TABLE[CROSSROADS_LEVEL]);
  const level = Math.max(CROSSROADS_LEVEL, Math.floor(Number(next.level) || 1));
  const stamp = { xp, level, xp_max: xpForLevel(level) };
  if (xp !== before) {
    stamp.ledger = appendLedger(
      { ledger: next.ledger },
      {
        id: newLedgerId(),
        ts: new Date().toISOString(),
        kind: 'xp',
        delta: xp - before,
        note: CROSSROADS_NOTE,
        balance: xp,
      }
    );
  }
  merge(stamp);

  const lore = next.lore && typeof next.lore === 'object' ? next.lore : {};
  if (!String(lore.backstory ?? '').trim() && outcome.story.length > 0) {
    merge({ lore: { ...lore, backstory: storyText(outcome.story) } });
  }

  return patch;
}

/* ---------------------------------------------------------------- remembering
 * A run in progress lives in sessionStorage, keyed by the character it is for,
 * so a refresh lands on the same question rather than on a fresh start. It is
 * the tab's own memory and nothing more: the sheet is not written until the
 * outcome is taken, and taking it forgets the run.
 */

const STORE_KEY = 'hzbd-crossroads:';

export function loadRun(characterId) {
  try {
    const raw = sessionStorage.getItem(STORE_KEY + characterId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Number.isInteger(parsed?.seed) || !Array.isArray(parsed?.answers)) return null;
    return {
      seed: parsed.seed >>> 0,
      answers: parsed.answers.filter(
        (entry) => entry && typeof entry.question === 'string' && typeof entry.option === 'string'
      ),
    };
  } catch {
    return null;
  }
}

export function saveRun(characterId, run) {
  try {
    sessionStorage.setItem(STORE_KEY + characterId, JSON.stringify(run));
  } catch {
    // Blocked storage only means a refresh starts the run again.
  }
}

export function forgetRun(characterId) {
  try {
    sessionStorage.removeItem(STORE_KEY + characterId);
  } catch {
    // Nothing to forget.
  }
}
