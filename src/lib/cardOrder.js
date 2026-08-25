/**
 * The order a list of cards is printed in.
 *
 * Jules asked for it on 2026-08-25, of spells first and then of everything
 * else: "Novice, Adept then Master, and then inside that first main school and
 * secondary school." That is one law with three keys, and it is the reading
 * order of the card's own banner:
 *
 *   NOVICE SPELL · PRIMAL · FLORA
 *   └ the rung     └ the school   └ the family
 *
 * So a wall of spells climbs the ladder first, and inside each rung the schools
 * stay together, and inside each school the families do. Nothing here invents an
 * order: the ladder is the one a rank opens, the schools are in the order
 * spells.js names them at the top of that file, and the families are in the
 * order the codex shelves them.
 *
 * ------------------------------------------------------------------ the law
 * **The rung, then the shelf, then whatever order they arrived in.** The last
 * part is deliberate and it is why every sort here is stable: inside one family
 * the codex order *is* the designer's sheet order, and re-alphabetising it would
 * throw away a decision somebody made. A caller that wants names in alphabetical
 * order has to say so, and only the item lists do.
 *
 * -------------------------------------------------------------- the reading
 * A card's rung is a word on its banner, and every family in the codex puts it
 * somewhere different:
 *
 *   spell         ['Novice Spell', 'Primal', 'Flora']
 *   martial move  ['Martial Move', 'Novice']
 *   talent        ['Colossus', 'Master Talent', 'Passive']
 *   ingredient    ['Cauldron keeper', 'Novice Essence']
 *   enchantment   ['Novice Enchantment', 'Body']
 *
 * So the rung is looked for as the *first word of any tag* rather than at a
 * position on the banner, and what is left once it is taken out is the shelf:
 * ['Spell', 'Primal', 'Flora'], ['Martial Move'], ['Cauldron keeper', 'Essence'].
 * Cards of one family share the leading words and differ where it matters, which
 * is what lets one comparison serve the whole codex.
 *
 * An item's tags are a path too, and the same one: `Common · Trinket · Ring`,
 * `Uncommon · Consumable · Potion`. So `compareItems` walks it the same way and
 * differs in only two places, both written up on the function itself: the ladder
 * under it is rarity rather than the rungs, and the name breaks the last tie
 * because an item list is something you look a thing up in.
 *
 * What it must not do is decide which *shelf* an item stands on. That comes from
 * the slot it fits (`itemCategory` in items.js) and the inventory is cut into
 * those shelves already, so rarity sorts **inside** a category and never across
 * one. A sort that lifted every Legendary to the top would scatter the armor
 * through the bags.
 *
 * ------------------------------------------------------------------- a leaf
 * This file imports nothing. It is reached from loadouts.js, abilitySources.js,
 * martial.js and five components, so anything it pulled in would be pulled into
 * all of them. The ladders below are each written down somewhere else as well,
 * and `scripts/check-order.mjs` proves they agree rather than leaving two copies
 * to drift apart.
 */

/**
 * The ladder every ability climbs, in the order a rank opens it.
 *
 * Legendary and Unique are on it although no rank reaches either: a Legendary
 * spell exists (THEON PERFECT REPLICANTS) and a Unique one arrives on an item,
 * so both get printed somewhere and both need a place. They sit above Master
 * because that is where the codex puts them, not because anything can climb
 * there. See the header of spells.js.
 *
 * Also in martial.js as MOVE_TIERS and ingredients.js as INGREDIENT_TIERS, both
 * of which stop at Master because those two families do.
 */
export const RUNGS = ['Novice', 'Adept', 'Master', 'Legendary', 'Unique'];

/**
 * Item rarity: the same idea in the item codex's own words.
 *
 * The key order of RARITY_COLORS in items.js, which is where the colours live.
 */
export const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

/**
 * The ordered shelves, and **two words are ranked by the shelf that holds them
 * both**.
 *
 * One flat table could not do it. `Infusion` is an Ingredient part *and* an
 * enchantment kind, and the two lists put it in different places; a single index
 * would have to be wrong for one of them. Looking for the shelf that holds both
 * words is also the honest statement of what an order is: Flora comes before
 * Wild among the Primal families, and asking whether Flora comes before Body is
 * a question about nothing.
 *
 * Families are only ever compared inside one school, because the school is
 * compared first and a difference there returns before the family is reached.
 */
export const SHELVES = [
  /* The schools, in the order the header of spells.js names them. Nature has no
     spell in the codex yet and keeps its place, so the day one is written it
     lands where the designer already put the word. */
  ['Primal', 'Nature', 'Arcane', 'Elemental', 'Ethereal', 'Nightmare'],

  // The families under each school, in the order spells.js shelves them.
  ['Flora', 'Wild', 'Life', 'Blood'],
  ['Energy'],
  ['Fire', 'Water', 'Wind', 'Lightning', 'Magma', 'Earth'],
  ['Light', 'Shadow', 'Time'],

  /* The Ingredient parts, in the order BREW names them. Also INGREDIENT_PARTS in
     ingredients.js, where it is a configuration rule rather than a presentation
     one. */
  ['Essence', 'Catalyst', 'Infusion'],

  /* The enchantment kinds, in the order ENCHANT_KINDS lists them in
     enchantments.js. Curse is not one of the four: it is a tag two Unique
     enchantments carry, and it goes last because a curse is nobody's choice. */
  ['Body', 'Infusion', 'Utility', 'Imbuement', 'Curse'],

  /* Armor down the body, which is ARMOR_SLOTS' own order in items.js and the
     order the armor block on the Inventory tab already draws. The only item
     shelf written down here, because it is the only one the alphabet gets wrong:
     Head, Leg, Torso is a body assembled in the dark. */
  ['Head Gear', 'Torso Gear', 'Leg Gear'],
];

/**
 * **A word nobody shelved does not move a card.** This is the rule that keeps
 * the law from doing more than it was asked to.
 *
 * `Passive` and `Ability` are the case it was written for. A talent set's rank
 * grants both and neither is on a shelf, so the alphabetical fallback would have
 * quietly pulled every Ability above every Passive and re-ordered a section the
 * designer laid out. There is no reason a passive reads before an ability or
 * after it, and inventing one to break a tie is exactly the thing this codebase
 * does not do. So two unshelved words compare equal and the codex order stands.
 *
 * `compareWords` is the other half of the pair and does fall through to the
 * alphabet, because a section *heading* is a bare word with no arrival order
 * behind it to fall back on.
 */
function compareShelved(a, b) {
  if (a === b) return 0;

  // Missing sorts first: a spell that names no family leads its school's families.
  const gone = (word) => word === undefined || word === null || word === '';
  if (gone(a) || gone(b)) return gone(a) ? -1 : 1;

  if (RUNGS.includes(a) && RUNGS.includes(b)) return RUNGS.indexOf(a) - RUNGS.indexOf(b);
  if (RARITIES.includes(a) && RARITIES.includes(b)) return RARITIES.indexOf(a) - RARITIES.indexOf(b);

  const shelf = SHELVES.find((row) => row.includes(a) && row.includes(b));
  return shelf ? shelf.indexOf(a) - shelf.indexOf(b) : 0;
}

/* ------------------------------------------------------------- the reading */

/**
 * The rung a card names, wherever on its banner the word sits, or null for the
 * lineage traits, skills and basic actions that climb no ladder at all.
 *
 * The first word of a tag rather than the whole tag, because half the codex
 * writes the rung as `Novice Spell` and the other half as a bare `Novice`.
 */
export function cardRung(card) {
  for (const tag of card?.tags ?? []) {
    const word = String(tag).trim().split(/\s+/)[0];
    if (RUNGS.includes(word)) return word;
  }
  return null;
}

/**
 * The shelf a card stands on: its tags in printed order with the rung taken out
 * of them.
 *
 * `Novice Spell` leaves `Spell` rather than nothing, because the noun is part of
 * the path: it is what keeps a Novice Essence and a Novice Catalyst apart once
 * the word Novice has been used to place them both on the same rung.
 */
export function cardShelf(card) {
  const rung = cardRung(card);
  const shelf = [];

  for (const tag of card?.tags ?? []) {
    const text = String(tag).trim();
    if (!rung) {
      shelf.push(text);
      continue;
    }
    if (text === rung) continue;
    if (text.startsWith(`${rung} `)) {
      shelf.push(text.slice(rung.length + 1).trim());
      continue;
    }
    shelf.push(text);
  }

  return shelf;
}

/** The rarity an item names, defaulting to Common the way `itemRarity` does. */
export function itemRung(item) {
  return (item?.tags ?? []).map(String).find((tag) => RARITIES.includes(tag)) ?? 'Common';
}

/* --------------------------------------------------------- the comparisons */

/** How far up a ladder a word sits. A word that is on none of it sits at the end. */
function rungAt(word, ladder) {
  const at = ladder.indexOf(word);
  return at === -1 ? ladder.length : at;
}

/**
 * Two words off a banner, ranked.
 *
 * Exported because a section heading is one of these on its own: a wall cut into
 * Novice, Adept and Master, or into Primal and Elemental, has to stack its
 * headings in the same order its cards are in, and a heading is a bare word with
 * no card behind it.
 *
 * A word nobody has shelved falls to alphabetical rather than to the arrival
 * order, because two unshelved words have no arrival order between them: they
 * are being compared as labels. `scripts/check-order.mjs` is what keeps the
 * codex's own words off that path.
 */
export function compareWords(a, b) {
  const shelved = compareShelved(a, b);
  if (shelved !== 0) return shelved;
  return String(a ?? '').localeCompare(String(b ?? ''));
}

/**
 * The law itself: the rung, then the school, then the family, then nothing.
 *
 * Returning 0 rather than falling through to the name is the whole of the
 * stability promise. Feed it to a stable sort (every engine's is, since ES2019)
 * and cards that agree on all three keys come out in the order they went in.
 */
export function compareCards(a, b) {
  const rung = rungAt(cardRung(a), RUNGS) - rungAt(cardRung(b), RUNGS);
  if (rung !== 0) return rung;

  const left = cardShelf(a);
  const right = cardShelf(b);
  const depth = Math.max(left.length, right.length);

  for (let at = 0; at < depth; at += 1) {
    const step = compareShelved(left[at], right[at]);
    if (step !== 0) return step;
  }

  return 0;
}

/**
 * Two whole tags, as a filter row stacks its chips.
 *
 * A chip row is the same list flattened: the rungs it can filter to, the schools,
 * the families, and whatever else the cards under it happen to carry. It read
 * alphabetically everywhere, which put Adept Spell above Novice Spell and buried
 * Common between Epic and Legendary. So a chip is ranked as though it were a card
 * carrying that one tag, which is the law again and not a second rule.
 *
 * The one thing it adds is a rule for **words off different shelves**, which a
 * card never has to answer: Primal and Flora are never compared as cards, because
 * by the time a family is reached the school has already decided. A row of chips
 * has them side by side, so the shelf they sit on breaks the tie and SHELVES is
 * in that order deliberately: the schools, then the families under them, then the
 * lists that belong to one window.
 */
export function compareTags(a, b) {
  /* Two rarities are ranked as rarities before anything else looks at them.
     `Legendary` is a word on both ladders, and read as a card it is a rung: the
     rung reading put Legendary above Common in the pack's chip row, which is the
     one place the two ladders are ever asked the same question. */
  if (RARITIES.includes(a) && RARITIES.includes(b)) return RARITIES.indexOf(a) - RARITIES.indexOf(b);

  const law = compareCards({ tags: [a] }, { tags: [b] });
  if (law !== 0) return law;

  const shelfOf = (word) => SHELVES.findIndex((row) => row.includes(word));
  const left = shelfOf(a);
  const right = shelfOf(b);
  if (left !== right) {
    // An unshelved word is nobody's, and goes after every word that is somebody's.
    if (left === -1 || right === -1) return left === -1 ? 1 : -1;
    return left - right;
  }

  return String(a ?? '').localeCompare(String(b ?? ''));
}

/**
 * An item, which is the same law with the other ladder under it: the rarity,
 * then what the thing is, then what kind of that thing, then the name.
 *
 *   Common · Trinket · Ring
 *   Common · Weapon · Melee · One-Handed · Finesse
 *   Uncommon · Consumable · Potion
 *
 * That is a path exactly like a spell's banner, so it is walked exactly like
 * one. It reads through `compareWords` rather than the card reading, and the two
 * differences are both deliberate:
 *
 * **The alphabet breaks a tie here.** A word off the shelves leaves two cards in
 * codex order, because inside a spell family that order is the designer's. There
 * is no such order inside `Trinket`: the rings and the necklaces are interleaved
 * as they were written, so sorting the sub-kinds alphabetically is what actually
 * puts the rings together. Grouped by a neutral rule beats not grouped at all.
 *
 * **The name is the last word.** An item list is something you look a thing up
 * in. A card wall is something you choose from.
 */
export function compareItems(a, b) {
  const rarity = compareWords(itemRung(a), itemRung(b));
  if (rarity !== 0) return rarity;

  const left = (a?.tags ?? []).filter((tag) => !RARITIES.includes(tag));
  const right = (b?.tags ?? []).filter((tag) => !RARITIES.includes(tag));
  const depth = Math.max(left.length, right.length);

  for (let at = 0; at < depth; at += 1) {
    const step = compareWords(left[at], right[at]);
    if (step !== 0) return step;
  }

  return String(a?.name ?? '').localeCompare(String(b?.name ?? ''));
}

/* ------------------------------------------------------------- the sorting */

/** A list of cards, in the law's order. Never in place: the caller's array is theirs. */
export function sortCards(cards) {
  return [...(cards ?? [])].sort(compareCards);
}

/**
 * The same, for the `{ card, ... }` rows most of the sheet actually carries: a
 * source's section, a pool option, a prepared pick.
 *
 * `pick` is how to get the card out of a row and defaults to the field they all
 * use. A row whose card is missing (a stored pick this build's codex has never
 * heard of) compares as an empty card and lands at the front, which is where a
 * thing needing attention belongs.
 */
export function sortCardRows(rows, pick = (row) => row?.card) {
  return [...(rows ?? [])].sort((a, b) => compareCards(pick(a) ?? {}, pick(b) ?? {}));
}

/** A list of items, by rarity then name. */
export function sortItems(items) {
  return [...(items ?? [])].sort(compareItems);
}
