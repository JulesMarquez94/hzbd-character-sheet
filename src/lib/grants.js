/**
 * The rider a card carries, and the one way three codexes add it up.
 *
 * ------------------------------------------------------------------ the shape
 * A card that names a number this sheet holds carries it as `grants`, beside the
 * prose that says the same thing, so the two cannot drift:
 *
 *     grants: { speed: 1.5 }        WIND GRACE, and WILD SWIFTNESS beside it
 *     grants: { defense: 1 }        MINERAL SKIN, and SCALEY beside it
 *     grants: { willpowerMax: 4 }   INNER TIDE
 *     grants: { healthPerLevel: 7 } FEY BLOOD
 *
 * Three kinds of card carry one — a lineage card in lineages.js, a talent card
 * in talents.js and a background skill in backgrounds.js — and each hands back
 * `{ name, ...grants }` rows named after the card, because a tile that says
 * `+1.5 Wind Grace` has told the reader where to go and look and one that says
 * `+1.5 Skybound` has not. The rows are deliberately the shape `grantTerms` in
 * statMath.js already draws an *enchantment* with, so every source prints alike.
 *
 * The four kinds are different sources by the stacking law, so they add: a point
 * from your blood, a point from your training, a point from a skill and a point
 * from a ring are four points. The same-source law bites inside each half and
 * never across them. See the note in enchanting.js.
 *
 * -------------------------------------------------------------- the two odd ones
 * `flat` in characterModel.js adds a field by name, so a field nothing reads is
 * harmless and a new one is a word where the sum happens. Two fields are not
 * lumps and must never be summed:
 *
 *   healthPerLevel  a *rate*. Three cards say "you gain N Health per level in
 *                   Fortitude and Physique instead of 10", and two of them do
 *                   not make 27. Read off the rows by `healthRate`.
 *   restHealth      not a number at all. UNDEATH RESILIENCE's second clause is
 *                   what a rest gives back. Read off the rows by `restHealth`.
 *
 * A leaf, and it has to stay one: nothing in here may import anything.
 */

/** Fields that are real riders but must not be added together. See above. */
export const NOT_SUMMED = new Set(['healthPerLevel']);

/**
 * The flat half of a pile of grant rows, summed per field.
 *
 * Anything that is not a finite number is skipped rather than coerced, so a
 * `restHealth` object or a `checkWhen` sentence sitting in the same map never
 * lands on a stat line as a declared zero.
 */
export function sumGrants(rows) {
  const total = {};

  for (const row of rows ?? []) {
    for (const [field, value] of Object.entries(row ?? {})) {
      if (field === 'name' || NOT_SUMMED.has(field)) continue;
      const number = Number(value);
      if (!Number.isFinite(number)) continue;
      total[field] = (total[field] ?? 0) + number;
    }
  }
  return total;
}

/** Ten Health a level and ten a Physique, which is what everybody starts from. */
export const HEALTH_PER_LEVEL = 10;

/**
 * How much Health a level and a Physique are worth to this character.
 *
 * Three cards replace the 10 rather than adding to it: UNDEATH RESILIENCE's 15,
 * HEARTHY's 12 and FEY BLOOD's 7. Nobody can hold two today — each is the only
 * one on its ancestry, and HEARTHY is alone in the Wildkin pool — but two
 * sentences both reading "instead of 10" would be a contradiction rather than a
 * sum, so this composes them as *differences from 10*: 15 and 7 together would
 * be 12, which is the one answer that needs no arbitrary winner and degenerates
 * to the printed number whenever only one is held.
 *
 * Floored at zero, because a rate that went negative would buy a character
 * Health for being weaker.
 */
export function healthRate(rows) {
  let rate = HEALTH_PER_LEVEL;

  for (const row of rows ?? []) {
    const named = Number(row?.healthPerLevel);
    if (!Number.isFinite(named)) continue;
    rate += named - HEALTH_PER_LEVEL;
  }
  return Math.max(0, rate);
}

/** The rows that actually moved the rate, named, for the tile's breakdown. */
export function healthRateSources(rows) {
  return (rows ?? []).filter((row) => {
    const named = Number(row?.healthPerLevel);
    return Number.isFinite(named) && named !== HEALTH_PER_LEVEL;
  });
}

/**
 * What a rest gives this character back, as `{ short, long }`.
 *
 * `'full'`, `'half'` and `'none'` are the three answers, and everybody gets
 * `{ short: 'half', long: 'full' }` until a card says otherwise. UNDEATH
 * RESILIENCE is the only card that does: "Short Rests no longer restore Health,
 * and Long Rests only let you regain half your maximum Health."
 *
 * The stingier of two answers wins, so a second card can only ever take more
 * away. Nothing in the codex heals a rest *better* yet, and if something ever
 * does it wants its own field rather than this one loosened.
 */
export const REST_HEALTH = { short: 'half', long: 'full' };

const REST_RANK = { none: 0, half: 1, full: 2 };

export function restHealth(rows) {
  const held = { ...REST_HEALTH };

  for (const row of rows ?? []) {
    for (const kind of ['short', 'long']) {
      const said = row?.restHealth?.[kind];
      if (!(said in REST_RANK)) continue;
      if (REST_RANK[said] < REST_RANK[held[kind]]) held[kind] = said;
    }
  }
  return held;
}
