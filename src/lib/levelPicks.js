/**
 * The level ledger — what each level of advancement hands out, and what this
 * character chose there.
 *
 * Every level gives something, and what it gives is decided by the level alone:
 *
 *   level 1  a talent set, a lineage, a background, and the +2 / +1 spread
 *   even     one talent choice — a new set at Rank 1, or the next rank of one held
 *   odd (3+) one attribute point, and one skill learned from the whole codex
 *
 * Talents are not in here: they have their own level-bound model in talents.js,
 * written before this file and left where it is. Everything *else* a level
 * hands out lives in one column, keyed by the level that granted it:
 *
 *   level_picks: {
 *     "1": { "major": "physique", "minor": "mind" },
 *     "3": { "attribute": "instinct", "skill": "apothecary" },
 *     "5": { "attribute": "mind" }
 *   }
 *
 * ------------------------------------------------------------------- values
 * `physique`, `instinct` and `mind` stay the source of truth for every number
 * the sheet derives, so every write here recomputes all three from the whole
 * record rather than adding to what is already stored. A point can never be
 * counted twice, and undoing level 5 cannot leave level 3's point behind.
 *
 * ------------------------------------------------------------------- no lock
 * Talent slots fill in order, because Rank 2 has to know which level bought
 * Rank 1. Nothing here has that problem: an attribute point is an attribute
 * point whenever it was taken, and a skill is only ever one you do not already
 * hold. So each level's picks stand alone, and can be made, changed or handed
 * back in any order.
 */

import { ATTRIBUTE_BASE, ATTRIBUTE_KEYS, attributeLabel, baseValues } from './attributes.js';
import {
  BACKGROUND_CARDS,
  getBackground,
  getBackgroundSkill,
  normalizeBackgroundSkills,
} from './backgrounds.js';
import { getLineage } from './lineages.js';
import { normalizeTalents, pruneTalents } from './talents.js';
import { MAX_LEVEL } from './characterModel.js';

/** What a level hands out. The one place the even / odd rule is written down. */
export function levelGrants(level) {
  const n = Math.max(1, Math.floor(Number(level) || 1));
  if (n === 1) return { talent: true, lineage: true, background: true, boosts: true };
  if (n % 2 === 0) return { talent: true };
  return { attribute: true, skill: true };
}

/** Every level this character has reached — the ledger, top to bottom. */
export function ledgerLevels(level) {
  const top = Math.min(MAX_LEVEL, Math.max(1, Math.floor(Number(level) || 1)));
  return Array.from({ length: top }, (_, index) => index + 1);
}

/** One line saying what the next level will ask for, or null at the cap. */
export function nextLevelPromise(level) {
  const next = Math.max(1, Math.floor(Number(level) || 1)) + 1;
  if (next > MAX_LEVEL) return null;

  return {
    level: next,
    says: levelGrants(next).talent
      ? 'another talent choice: a new set, or the next rank of one you hold'
      : 'an attribute point, and a new skill',
  };
}

/* ---------------------------------------------------------- reading the row */

const SKILL_IDS = new Set(BACKGROUND_CARDS.map((skill) => skill.id));

/**
 * A stored record is only ever a hint: it may be a string, hold levels that
 * grant nothing, name an attribute this build has never heard of, or a skill
 * the codex has since dropped. Whatever comes in, this returns entries a level
 * really grants, holding values that really exist.
 */
export function normalizeLevelPicks(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!source || typeof source !== 'object') return {};

  const clean = {};
  for (const [rawLevel, rawEntry] of Object.entries(source)) {
    const level = Math.floor(Number(rawLevel) || 0);
    if (!Number.isFinite(level) || level < 1 || level > MAX_LEVEL) continue;
    if (!rawEntry || typeof rawEntry !== 'object') continue;

    const grants = levelGrants(level);
    const entry = {};

    if (grants.boosts) {
      const { major, minor } = rawEntry;
      // Both or neither: half a spread is not a spread, and the two may never
      // land on the same attribute.
      if (ATTRIBUTE_KEYS.includes(major) && ATTRIBUTE_KEYS.includes(minor) && major !== minor) {
        entry.major = major;
        entry.minor = minor;
      }
    }
    if (grants.attribute && ATTRIBUTE_KEYS.includes(rawEntry.attribute)) {
      entry.attribute = rawEntry.attribute;
    }
    if (grants.skill && SKILL_IDS.has(rawEntry.skill)) {
      entry.skill = rawEntry.skill;
    }

    if (Object.keys(entry).length > 0) clean[level] = entry;
  }
  return clean;
}

/**
 * The level-1 spread read back out of the three columns, for a row that holds
 * no record of one — a sheet saved against a database where the `level_picks`
 * migration has not been run, or one written by hand. Only an exact 6 / 5 / 4
 * counts: anything else is somebody's own arithmetic, and guessing at it would
 * put a choice on the page that nobody made.
 */
function inferBoosts(character) {
  const values = {};
  for (const key of ATTRIBUTE_KEYS) values[key] = Math.floor(Number(character?.[key]) || 0);

  const major = ATTRIBUTE_KEYS.find((key) => values[key] === ATTRIBUTE_BASE + 2);
  const minor = ATTRIBUTE_KEYS.find((key) => values[key] === ATTRIBUTE_BASE + 1);
  if (!major || !minor) return null;

  const rest = ATTRIBUTE_KEYS.filter((key) => key !== major && key !== minor);
  if (!rest.every((key) => values[key] === ATTRIBUTE_BASE)) return null;
  return { major, minor };
}

/**
 * Everything that moves an attribute, added up: base, the level-1 spread, a
 * point for every odd level taken, and whatever your blood carries.
 *
 * A lineage that says "your Instinct increases by +1" declares it in
 * lineages.js as well as printing it, and it lands here. It is folded into the
 * totals rather than added to the columns once, so changing ancestry takes its
 * bonus away again and no arithmetic is ever done twice.
 */
export function attributeTotals(picks, lineage = null) {
  const values = baseValues();

  for (const [level, entry] of Object.entries(picks)) {
    if (levelGrants(level).boosts && entry.major && entry.minor) {
      values[entry.major] += 2;
      values[entry.minor] += 1;
    }
    if (entry.attribute) values[entry.attribute] += 1;
  }

  for (const [key, bonus] of Object.entries(lineageBonuses(lineage))) {
    values[key] += bonus;
  }
  return values;
}

/** What an ancestry adds, as a plain map. Empty for the ones that add nothing. */
export function lineageBonuses(lineage) {
  const declared = getLineage(lineage)?.attributes ?? {};
  const bonuses = {};

  for (const key of ATTRIBUTE_KEYS) {
    const bonus = Math.floor(Number(declared[key]) || 0);
    if (bonus) bonuses[key] = bonus;
  }
  return bonuses;
}

/** Every skill this character holds, background and learned alike, by id. */
export function heldSkillIds(character) {
  const picks = normalizeLevelPicks(character?.level_picks);
  const background = getBackground(character?.background);

  return new Set([
    ...normalizeBackgroundSkills(background, character?.background_skills),
    ...Object.values(picks)
      .map((entry) => entry.skill)
      .filter(Boolean),
  ]);
}

/**
 * The whole ledger as the tab needs it: the record, what it adds up to, and
 * where it disagrees with the row it is stored on.
 */
export function levelPicksState(character, level) {
  const picks = { ...normalizeLevelPicks(character?.level_picks) };

  // A row whose spread was never recorded, but whose values still say what it
  // was. Read once, here, so every reader downstream sees one answer.
  if (!picks[1]) {
    const inferred = inferBoosts(character);
    if (inferred) picks[1] = inferred;
  }

  const levels = ledgerLevels(level);
  const totals = attributeTotals(picks, character?.lineage);

  const values = {};
  for (const key of ATTRIBUTE_KEYS) values[key] = Math.floor(Number(character?.[key]) || 0);

  return {
    picks,
    levels,
    values,
    totals,
    boosts: picks[1] ?? null,
    spreadDone: Boolean(picks[1]),
    lineage: lineageBonuses(character?.lineage),
    held: heldSkillIds(character),

    /** What was chosen at one level — always an object, never undefined. */
    at(n) {
      return picks[n] ?? {};
    },

    /** Levels holding picks above where the character now stands. */
    beyond: Object.keys(picks)
      .map(Number)
      .filter((n) => !levels.includes(n))
      .sort((a, b) => a - b),

    /**
     * The row disagreeing with its own ledger — an attribute raised from
     * outside advancement, or a save that landed on the columns but not on the
     * record (a database still missing `level_picks`).
     */
    drift: ATTRIBUTE_KEYS.filter((key) => values[key] !== totals[key]),
  };
}

/* ----------------------------------------------- writing the ledger down *
 * Every one of these takes the character and hands back a whole patch, so a
 * block only ever has to `patch(...)` — and the three columns are always
 * rebuilt from the record they are stored beside.
 */

function writePicks(picks, character) {
  return { ...attributeTotals(picks, character?.lineage), level_picks: picks };
}

function currentPicks(character) {
  return { ...levelPicksState(character, MAX_LEVEL).picks };
}

/** Level 1: the +2 and the +1, which must land on two different attributes. */
export function setBoosts(character, major, minor) {
  if (!ATTRIBUTE_KEYS.includes(major) || !ATTRIBUTE_KEYS.includes(minor)) return null;
  if (major === minor) return null;

  const picks = currentPicks(character);
  picks[1] = { ...picks[1], major, minor };
  return writePicks(picks, character);
}

/** An odd level's single point. */
export function setLevelAttribute(character, level, key) {
  if (!levelGrants(level).attribute || !ATTRIBUTE_KEYS.includes(key)) return null;

  const picks = currentPicks(character);
  picks[level] = { ...picks[level], attribute: key };
  return writePicks(picks, character);
}

/** An odd level's skill — anything in the codex the character does not hold. */
export function setLevelSkill(character, level, skillId) {
  if (!levelGrants(level).skill || !SKILL_IDS.has(skillId)) return null;

  const picks = currentPicks(character);

  // Learning one that is already held somewhere else is a move, not a
  // duplicate: it leaves the level that held it before.
  for (const [at, entry] of Object.entries(picks)) {
    if (entry.skill === skillId && Number(at) !== Number(level)) {
      const without = { ...entry };
      delete without.skill;
      if (Object.keys(without).length === 0) delete picks[at];
      else picks[at] = without;
    }
  }

  picks[level] = { ...picks[level], skill: skillId };
  return writePicks(picks, character);
}

/** Hand one pick back. `what` is 'boosts', 'attribute' or 'skill'. */
export function clearLevelPick(character, level, what) {
  const picks = currentPicks(character);
  const entry = { ...picks[level] };

  if (what === 'boosts') {
    delete entry.major;
    delete entry.minor;
  } else {
    delete entry[what];
  }

  if (Object.keys(entry).length === 0) delete picks[level];
  else picks[level] = entry;

  return writePicks(picks, character);
}

/** Put the three columns back on what the ledger says they should be. */
export function reapplyTotals(character) {
  return writePicks(currentPicks(character), character);
}

/* ------------------------------------------------------- losing a level *
 * Levels can go down as well as up: a table takes experience back, or someone
 * fixes a total that was typed in wrong. What that level bought goes with it.
 *
 * This is deliberately the *opposite* of the tab's first rule, which kept
 * choices made above the current level and asked you to undo them by hand. The
 * sheet now simply gives them back, because a level 3 character holding a
 * level 5 skill is a sheet that lies about itself, and the ledger says plainly
 * what was taken.
 */

/** What one level handed out, said in words. Empty when it granted nothing. */
function spentAt(picks, talents, level) {
  const said = [];
  const entry = picks[level];

  const rank = talents.find((row) => row.taken.includes(level));
  if (rank) said.push(`${rank.name} rank ${rank.taken.indexOf(level) + 1}`);

  if (entry?.major && entry?.minor) said.push('the attribute spread');
  if (entry?.attribute) said.push(`+1 ${attributeLabel(entry.attribute)}`);
  if (entry?.skill) said.push(getBackgroundSkill(entry.skill)?.name ?? entry.skill);

  return said;
}

/**
 * The patch that takes a character back down to `level`, or null when there is
 * nothing above it to take. `summary` is one sentence naming what went, for the
 * ledger to print beside the experience that paid for it.
 */
export function pruneToLevel(character, level) {
  const top = Math.min(MAX_LEVEL, Math.max(1, Math.floor(Number(level) || 1)));

  const picks = currentPicks(character);
  const talents = normalizeTalents(character?.talents);

  const lost = Object.keys(picks)
    .map(Number)
    .concat(talents.flatMap((row) => row.taken))
    .filter((n) => n > top)
    .sort((a, b) => a - b);

  if (lost.length === 0) return null;

  const said = [...new Set(lost)].flatMap((n) => spentAt(picks, talents, n));
  for (const n of lost) delete picks[n];

  return {
    patch: {
      ...writePicks(picks, character),
      talents: pruneTalents(character?.talents, top),
    },
    levels: [...new Set(lost)],
    summary: said.length
      ? `Given back with the level: ${said.join(', ')}.`
      : 'Nothing had been chosen above that level.',
  };
}

/**
 * Taking an ancestry, or giving it back. Lineage is the one choice outside this
 * ledger that moves an attribute, so it is written here: the name and the three
 * columns land in the same patch and can never disagree.
 */
export function setLineage(character, name) {
  const picks = currentPicks(character);
  return { lineage: name, ...attributeTotals(picks, name) };
}

/* -------------------------------------------------------- the skill pool */

/** Every skill in the codex, by name — the wall an odd level opens. */
export function allSkills() {
  return [...BACKGROUND_CARDS].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The whole pool measured against one level: what may be learned there, and —
 * when it may not — the one line the card should say instead.
 */
export function skillOptionsAt(character, level) {
  const picks = normalizeLevelPicks(character?.level_picks);
  const mine = picks[level]?.skill ?? null;
  const background = getBackground(character?.background);
  const fromBackground = new Set(
    normalizeBackgroundSkills(background, character?.background_skills)
  );

  const elsewhere = new Map();
  for (const [at, entry] of Object.entries(picks)) {
    if (entry.skill && Number(at) !== Number(level)) elsewhere.set(entry.skill, Number(at));
  }

  return allSkills().map((skill) => {
    if (skill.id === mine) return { skill, ok: true, held: true };
    if (fromBackground.has(skill.id)) {
      return { skill, ok: false, held: false, reason: 'Your background already taught you this' };
    }
    if (elsewhere.has(skill.id)) {
      return {
        skill,
        ok: false,
        held: false,
        reason: `Already learned at level ${elsewhere.get(skill.id)}`,
      };
    }
    return { skill, ok: true, held: false };
  });
}

/** The tags a wall of skills can be narrowed by — the labels the cards carry. */
export function usedSkillTags() {
  const seen = new Set();
  for (const skill of BACKGROUND_CARDS) {
    for (const tag of skill.tags ?? []) {
      if (tag !== 'Background Skill') seen.add(tag);
    }
  }
  return [...seen].sort().map((tag) => ({ id: tag, label: tag, kind: 'skill' }));
}

export { getBackgroundSkill as getSkill };
