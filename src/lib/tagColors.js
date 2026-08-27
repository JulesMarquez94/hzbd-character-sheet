/**
 * The colour a tag is printed in.
 *
 * Jules asked for it on 2026-08-25: "each school and sub school should have a
 * color, they can be close to each other." A wall of spells is read school by
 * school, and until now every chip on it was the same grey, so the only way to
 * tell an Ethereal card from an Elemental one at a glance was to read the word.
 *
 * ------------------------------------------------------------------- the law
 * **The school owns a hue and a family is a shade of it.** So the school is what
 * you see first and the family what you see second, which is the order the banner
 * itself reads in:
 *
 *   NOVICE SPELL · ETHEREAL · SPACIAL
 *   └ the card's accent  └ sky   └ a blue inside that sky
 *
 * Every family sits inside about thirty degrees of its school's hue and separates
 * from its siblings on lightness and saturation instead. The one thing that bends
 * it is written into it rather than around it: **where the codex already knows
 * what colour a family is, that colour is what its shade leans to.** Fire, Water,
 * Lightning, Blood and Death each answer to a damage or stat token; Light and
 * Shadow are their own names. Seven leans, all marked at the tokens in index.css.
 *
 * --------------------------------------------------------------- a leaf, again
 * This file imports nothing, for cardOrder.js's reason: it is reached from the
 * card brief and from the filter row, so anything it pulled in would be pulled
 * into both. The values are all `var(--...)`, so the tokens stay the one place a
 * colour is written down and this stays the one place a *word* is matched to one.
 *
 * ------------------------------------------------------------- what is not here
 * The rung is not coloured. `Novice Spell` and its two siblings take the card's
 * own accent, the same violet the printed card is capped with, because what a
 * card *is* is a different question from what school it belongs to and the brief
 * already answers it (see `is-kind` in CardBrief.jsx).
 *
 * Nothing that is not a school or a family is coloured either. A martial move's
 * `Martial Move`, a talent's `Passive`, an item's `Uncommon`: all still grey, and
 * `tagColor` gives back null for every one of them so the caller can leave the
 * chip alone rather than having to know which words are in here.
 */

/** The six schools, in the order cardOrder.js shelves them. */
export const SCHOOL_COLORS = {
  Primal: 'var(--school-primal)',
  Nature: 'var(--school-nature)',
  Arcane: 'var(--school-arcane)',
  Elemental: 'var(--school-elemental)',
  Ethereal: 'var(--school-ethereal)',
  Nightmare: 'var(--school-nightmare)',
};

/**
 * The families, school by school and in each school's own shelf order.
 *
 * One flat table rather than one per school, because a family name is unique
 * across the codex and a caller with a bare tag has no school to look it up
 * under. `check-order.mjs` is what keeps that true: a family word that turned up
 * on two schools' shelves would be a finding there long before it was a wrong
 * colour here.
 */
export const FAMILY_COLORS = {
  // Primal
  Flora: 'var(--family-flora)',
  Wild: 'var(--family-wild)',
  Life: 'var(--family-life)',
  Blood: 'var(--family-blood)',
  Death: 'var(--family-death)',

  // Arcane
  Energy: 'var(--family-energy)',

  // Elemental
  Fire: 'var(--family-fire)',
  Water: 'var(--family-water)',
  Wind: 'var(--family-wind)',
  Lightning: 'var(--family-lightning)',
  Magma: 'var(--family-magma)',
  Earth: 'var(--family-earth)',
  Storm: 'var(--family-storm)',

  // Ethereal
  Light: 'var(--family-light)',
  Shadow: 'var(--family-shadow)',
  Time: 'var(--family-time)',
  Spacial: 'var(--family-spacial)',
};

/**
 * The colour for one tag, or null for a word this does not colour.
 *
 * Schools are looked up before families, which costs nothing today and is the
 * right way round: a word that ever became both would be a school first, since
 * the school is the one that groups a wall.
 */
export function tagColor(tag) {
  const word = String(tag ?? '').trim();
  return SCHOOL_COLORS[word] ?? FAMILY_COLORS[word] ?? null;
}

/**
 * The same as an inline style, or undefined so a caller can spread it and get
 * nothing. `damageStyle` in cardText.js is the shape this follows.
 *
 * `color` alone: the chip's border and ground are mixed off `currentColor` in the
 * stylesheet, so one property lights the whole chip and the CSS keeps deciding
 * how strongly.
 */
export function tagStyle(tag) {
  const color = tagColor(tag);
  return color ? { color } : undefined;
}
