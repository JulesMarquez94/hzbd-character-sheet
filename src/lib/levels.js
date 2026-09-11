/**
 * The climb: how many levels there are, what each one costs in lifetime XP, and
 * the three readings every bar and badge on the site takes off an XP total.
 *
 * ------------------------------------------------------- why this is its own file
 * It lived in characterModel.js until 2026-09-11 and is re-exported from there, so
 * nothing that reads it had to change. What moved it was a knot: `levelPicks.js`
 * needed `MAX_LEVEL` to normalize a stored ledger, and `deriveStats` in
 * characterModel.js needed `heldSkillIds` out of levelPicks.js to read what a
 * skill grants. Two files each wanting one thing from the other is a cycle, and
 * the smaller half of it is this — a table and five pure functions that know
 * nothing about a character beyond the number in its `xp` column.
 *
 * A leaf, and it has to stay one: nothing in here may import anything.
 */

/** No character climbs past this. */
export const MAX_LEVEL = 12;

/**
 * What a level hands out. The one place the even / odd rule is written down.
 *
 * It lived in levelPicks.js, which still re-exports it: what moved it here is
 * that `heldSkillIds` in backgrounds.js has to know which levels sold a skill,
 * and backgrounds.js may not reach up into the ledger. A rule about what a
 * *level* gives you is a fact about levels, so this is where it belongs.
 */
export function levelGrants(level) {
  const n = Math.max(1, Math.floor(Number(level) || 1));
  if (n === 1) return { talent: true, lineage: true, background: true, boosts: true };
  if (n % 2 === 0) return { talent: true };
  return { attribute: true, skill: true };
}

/**
 * Cumulative XP needed to *reach* each level — `xp` on a character is the
 * lifetime total, never a per-level counter that resets.
 *
 * Every step costs more than the one before it: the climb from 11 to 12 is
 * worth seventeen level-1s, so late levels stay an event rather than a
 * formality.
 */
export const XP_TABLE = [
  null, // no level 0
  0,      // 1
  1000,   // 2   +1,000
  2500,   // 3   +1,500
  4500,   // 4   +2,000
  7500,   // 5   +3,000
  11500,  // 6   +4,000
  17000,  // 7   +5,500
  24000,  // 8   +7,000
  33000,  // 9   +9,000
  44000,  // 10  +11,000
  58000,  // 11  +14,000
  75000,  // 12  +17,000
];

export function clampLevel(level) {
  return Math.min(MAX_LEVEL, Math.max(1, Math.floor(Number(level) || 1)));
}

/** The level a lifetime XP total buys, capped at the table's last row. */
export function levelForXp(xp) {
  const total = Math.max(0, Number(xp) || 0);
  let level = 1;
  for (let n = 2; n <= MAX_LEVEL; n += 1) {
    if (total < XP_TABLE[n]) break;
    level = n;
  }
  return level;
}

/**
 * Cumulative XP that opens the *next* level. At the cap it returns the level-12
 * threshold, so `xp_max` always holds a real number for the progress bars.
 */
export function xpForLevel(level) {
  const n = clampLevel(level);
  return n >= MAX_LEVEL ? XP_TABLE[MAX_LEVEL] : XP_TABLE[n + 1];
}

/** Everything the bars and badges need from a lifetime XP total. */
export function xpProgress(xp) {
  const total = Math.max(0, Number(xp) || 0);
  const level = levelForXp(total);
  const isMax = level >= MAX_LEVEL;
  const floor = XP_TABLE[level];
  const ceil = isMax ? XP_TABLE[MAX_LEVEL] : XP_TABLE[level + 1];
  const span = Math.max(1, ceil - floor);

  return {
    level,
    isMax,
    floor,
    ceil,
    total,
    into: total - floor,
    span,
    toNext: isMax ? 0 : Math.max(0, ceil - total),
    percent: isMax ? 100 : Math.min(100, ((total - floor) / span) * 100),
  };
}
