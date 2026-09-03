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
 *
 * ------------------------------------------------------ and what a card is worth
 * Two readers sit under the tag tables and both answer for a whole card rather
 * than for a word: `cardAccent`, which is a card's school, and `barAccent`, which
 * falls back to `KIND_COLORS` when there is no school. The second is the quick
 * bar's, and it is why this file now holds a table that is not about tags at all.
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
  Mud: 'var(--family-mud)',

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

/**
 * What a card is, when it belongs to no school.
 *
 * Jules, 2026-09-03: "in the quick bar give the block the color of their spell
 * like wild, fire ect. Give a color to other effect so they can be [read] better
 * at a glance." The first half is `cardAccent`, which already existed for the
 * tracker; this is the second.
 *
 * A quick bar is forty chips in one 360px block and it is the one place on the
 * sheet where every kind of thing a character can do stands in one column. Until
 * now four colours covered all of it and two of the four were the fallback: every
 * weapon attack, every basic action, the swap and a lineage's active traits were
 * all the same copper, so the row you reach for in a fight looked exactly like
 * the row that says you can climb a wall.
 *
 * The colours are not new. Each one is what that thing already wears elsewhere
 * on the sheet, which is the whole point of a colour meaning something:
 *
 *   ability        copper, which is what an ability box on a weapon wears
 *   basic action   slate, off the Armor token — the plainest colour on the
 *                  sheet, for the twelve rows that never change and are never
 *                  the interesting choice
 *   spell          violet, for a spell with no school of its own to lend it
 *   passive        lilac, a shade of that violet: a trait is magic you did not
 *                  cast
 *   talent         amber, which is what a talent card is capped with
 *   martial-move   amber too, for the reason it shares the card's: a move is a
 *                  trained manoeuvre bought with a talent (see AbilityCard.css)
 *   skill          cyan, the focus colour a skill card already takes
 *   item / brew    green, what you carry and spend
 *   ingredient     supply brown, because that is what an ingredient is
 *   form           the Instinct red a Feral Cursed's own block wears
 *
 * A kind not in here keeps the copper the stylesheet already gives it.
 */
export const KIND_COLORS = {
  ability: 'var(--copper)',
  'basic-action': 'var(--stat-armor)',
  spell: 'var(--haze-glow)',
  passive: 'var(--haze-lilac)',
  talent: 'var(--level-amber)',
  'martial-move': 'var(--level-amber)',
  skill: 'var(--focus-cyan)',
  item: 'var(--def-healing)',
  brew: 'var(--def-healing)',
  ingredient: 'var(--stat-supply)',
  form: 'var(--attr-instinct)',
};

/**
 * The colour one chip on a quick bar wears: its school if it has one, what kind
 * of thing it is if it does not, and null if neither answers.
 *
 * The school first, because that is the half Jules asked for and it is the finer
 * answer: a Wild spell and a Fire spell are both spells and the wall is read by
 * family. The kind is the fallback for everything with no school at all, which is
 * two thirds of the bar.
 *
 * **A Basic Action is a kind of its own here and nowhere else.** The codex has one
 * `kind` for a weapon's swing and for the Move action, because they are the same
 * shape of card — and on this one block that costs the reader the distinction
 * they most need. So the tag decides, which is the codex's own answer: every one
 * of the twelve carries `Basic Action` and nothing else does.
 *
 * Null rather than a default, so a caller can spread it and get nothing: the
 * stylesheet's own `ac-kind-*` class is the fallback and must stay the fallback.
 * See BarChip in ActiveBlock.jsx.
 */
export function barAccent(card) {
  const school = cardAccent(card?.tags);
  if (school) return school;

  const basic = (card?.tags ?? []).some((tag) => String(tag).trim() === 'Basic Action');
  return KIND_COLORS[basic ? 'basic-action' : String(card?.kind ?? '')] ?? null;
}

/**
 * One colour for a whole card, off its banner, or null for a card that belongs
 * to no school.
 *
 * A chip gets to wear the school and the family both, because it is a word and
 * there are two words. A tracker row gets one 2-pixel rule down its left edge,
 * so it has to choose, and **the family wins**: it is the narrower of the two
 * and it is a shade of its school's hue anyway, so a column of rows still sorts
 * into schools by eye and separates inside them. See the law at the top.
 *
 * Null for everything that is not a spell. A martial move, a potion, a lineage
 * trait and a hand-written condition all keep the block's own cyan, which is
 * what makes the coloured rows read as spells rather than as decoration.
 */
export function cardAccent(tags) {
  const words = Array.isArray(tags) ? tags : [];

  for (const word of words) {
    const family = FAMILY_COLORS[String(word).trim()];
    if (family) return family;
  }

  for (const word of words) {
    const school = SCHOOL_COLORS[String(word).trim()];
    if (school) return school;
  }

  return null;
}
