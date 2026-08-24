/**
 * Alchemy — the Alchemist's still, and what a night at it costs.
 *
 * A potion is not a card this set hands over and it is not an effect it
 * composes. It is a **thing that ends up in the pack**, brewed at the fire and
 * carried away, and that is the one shape the codex did not have a spec for yet:
 *
 *   a hand      loadouts.js. Cards picked out of the codex and re-chosen.
 *   a library   loadouts.js again. Cards written in one at a time and kept.
 *   a Brew      brews.js. Ingredients composed at the moment of use and stored
 *               nowhere, because it "takes effect immediately".
 *   a working   enchanting.js. Supplies turned into a rider on an item.
 *   a potion    here. Supplies turned into an item.
 *
 * The nearest relative is enchanting, and deliberately so: both are a Long Rest
 * action, both are paid for out of the crate and both are priced off the codex
 * rather than off a number typed into the window. The difference is only what
 * the Supplies become.
 *
 * ------------------------------------------------------------------ the price
 * ALCHEMY says a potion needs "the required components", and ALCHEMICAL
 * INGREDIENTS says what a component is worth: "when a recipe asks for 1000
 * coins' worth of Fire ingredients, this could be 100 spicy peppers or a dragon
 * flower". The old sheet priced that in coin. Jules asked for it in Supplies,
 * which is what a rest is paid in on this site and what every other labour at
 * the fire already costs.
 *
 * The old table printed no component price per potion. What it did print, for
 * every row, is a Willpower cost, and that column is the designer's own ordering
 * of the seven: 2 for the Healing Draught and the Love Potion, 3 for the Flame
 * Burst Flask and the three attribute potions, 4 for the Growth Elixir. So the
 * shape of the price is his and only the scale is this file's:
 *
 *     Supplies = 10 x the Willpower the old table printed
 *
 * The scale is not free either. The APOTHECARY background skill already crafts a
 * healing potion at a Long Rest "by expending 20 Supplies", and the Healing
 * Draught's own 2 Willpower times ten is exactly 20. Two sources that were
 * written years apart agree on the cheapest row in the table, which is what
 * fixed the rate rather than a number somebody liked the look of.
 *
 * The numbers themselves live on the items (`brew.supplies` in utility.js), the
 * way an enchantment's `supplies` lives on the enchantment: a row the designer
 * reprices stays repriced, and nothing here recomputes it.
 *
 * ------------------------------------------------------- and the Willpower
 * Which leaves the old table's Willpower with nothing to do, and it is **not
 * charged**. Brewing on this site happens inside a long rest, and a long rest
 * ends by filling Willpower to its maximum: a Willpower price paid in the middle
 * of one is a price nobody ever pays. ALCHEMY's own words are that you brew
 * "while still benefiting from a long rest", which says the same thing from the
 * other side. Flagged in data/README.md as a ruling for the designer.
 *
 * ------------------------------------------------------------------- the leaf
 * This file reads the item codex and the talent codex and nothing else. rest.js
 * imports it, so it must never import rest.js back.
 */

import { ITEMS, getItem } from './items.js';
import { getTalent, normalizeTalents } from './talents.js';

/** The set this whole file is about. */
export const ALCHEMIST_ID = 'alchemist';

/**
 * What one point of the old table's Willpower is worth in Supplies.
 *
 * Not read at runtime: every price is written out on its own item. It is here
 * because it is the working behind all seven of them, and a rate with no name is
 * a rate the next potion gets wrong.
 */
export const SUPPLIES_PER_WILLPOWER = 10;

/** The spec a set carries when it can brew, or null for every set that cannot. */
export function alchemyOf(talent) {
  return talent?.alchemy ?? null;
}

/**
 * Everything this character's rank lets them do at the still, or null for
 * anybody who is not an Alchemist.
 *
 * The same shape `enchanterState` hands back and for the same reason: one call
 * that answers "can they, and how much", so the rest window, the Abilities tab
 * and the pricing all read one set of numbers.
 */
export function alchemistState(character, talents = character?.talents) {
  const set = getTalent(ALCHEMIST_ID);
  const spec = alchemyOf(set);
  if (!spec) return null;

  const entry = normalizeTalents(talents).find((row) => row.id === ALCHEMIST_ID);
  if (!entry || !entry.rank) return null;

  const rank = entry.rank;
  const tiers = spec.tiers?.[rank] ?? [];

  return {
    set,
    spec,
    rank,
    tiers,
    /* ALCHEMY: "brew two of them". REFINED REAGENTS at Rank 2: "three rather
       than two". How many brews a night, never how many flasks. */
    perRest: spec.perRest?.[rank] ?? 0,
    /* REFINED REAGENTS: "every potion you brew costs 10 fewer Supplies, to a
       minimum of 10." */
    discount: spec.discount?.[rank] ?? 0,
    floor: Math.max(0, Math.floor(Number(spec.floor) || 0)),
    /* TWIN DISTILLATION at Rank 3: "every potion you brew comes out of the still
       twice." One brew, two flasks. */
    batch: spec.batch?.[rank] ?? 1,
    shelf: recipeShelf(tiers),
  };
}

/** True for a character who can brew anything at all. */
export function isAlchemist(character) {
  return alchemistState(character) !== null;
}

/**
 * Whether this set brews on this rest, off its own `brew` list.
 *
 * The same permission `swapsAtRest` and `researchesAtRest` read in loadouts.js,
 * and the same reason it is a list rather than a flag: the card names which rest
 * it happens on, and a short one names none of them.
 */
export function brewsAtRest(spec, kind) {
  return Array.isArray(spec?.brew) && spec.brew.includes(kind);
}

/**
 * The state a *rest* should offer, or null.
 *
 * Null for a short rest, for anybody who is not an Alchemist, and for a rank
 * whose shelf is empty. That last one matters the day an Adept tier exists and
 * a rank opens nothing new: a row in the rest window that only asks to be tapped
 * and then apologises is the shape `restSwaps` refuses too.
 */
export function restAlchemy(character, kind, talents = character?.talents) {
  const state = alchemistState(character, talents);
  if (!state || !brewsAtRest(state.spec, kind)) return null;
  return state.perRest > 0 && state.shelf.length > 0 ? state : null;
}

/* ----------------------------------------------------------------- the shelf */

/**
 * Every recipe in the codex, in the order the shelf reads them: cheapest first,
 * and by name inside a price.
 *
 * A recipe is any item carrying a `brew` spec, which today is the seven potions
 * off the old Novice table (utility.js). Nothing here knows they are potions:
 * the day a recipe is something else, it is on the shelf already.
 */
export const RECIPES = ITEMS.filter((item) => item?.brew).sort(
  (a, b) => a.brew.supplies - b.brew.supplies || a.name.localeCompare(b.name)
);

/** The recipes a list of open tiers reaches. */
export function recipeShelf(tiers = []) {
  const open = new Set(tiers);
  return RECIPES.filter((item) => open.has(item.brew.tier));
}

/**
 * What one flask costs this Alchemist tonight, after whatever their rank takes
 * off and never below the floor their own card prints.
 */
export function brewPrice(item, state) {
  const listed = Math.max(0, Math.floor(Number(item?.brew?.supplies) || 0));
  if (!state) return listed;
  return Math.max(state.floor, listed - state.discount);
}

/** Whether this rank has opened this recipe at all. */
export function canBrew(state, item) {
  return Boolean(state && item?.brew && state.tiers.includes(item.brew.tier));
}

/**
 * The components IMPROVISED BREWING asks for, in words.
 *
 * `X` is any one of the four and `Fire|Wind` is either of two, which is the one
 * recipe that folds two rows of the old table together. Printed on the recipe
 * shelf and nowhere else: it is a rule only an Alchemist reads, and it has no
 * business on a flask a stranger is holding.
 */
export function elementLine(item) {
  const parts = item?.brew?.elements ?? [];
  if (parts.length === 0) return null;
  return parts.map((part) => (part === 'X' ? 'any' : part.split('|').join(' or '))).join(' · ');
}

/* ---------------------------------------------------------------- the draft
 * What the rest window is holding while the player decides: a plain list of
 * recipe ids, one entry per brew, repeats allowed. It is a list rather than a
 * count map because the order is what the window prints back and "two Healing
 * Draughts and a Growth Elixir" is read in the order they were chosen.
 */

/**
 * A draft repaired against what this Alchemist can actually do: recipes their
 * rank has not opened are dropped, and the list is cut to the number of brews
 * the night allows.
 *
 * Repaired rather than trusted for the same reason every other stored shape is:
 * a rank can go down as easily as up while a window is open, and a draft that
 * outlived the rank that allowed it would be priced into a rest nobody may take.
 */
export function normalizeBrews(value, state) {
  if (!state) return [];
  const list = Array.isArray(value) ? value : [];

  const kept = [];
  for (const raw of list) {
    const id = typeof raw === 'string' ? raw : '';
    const item = getItem(id);
    if (!item || !canBrew(state, item)) continue;
    kept.push(id);
    if (kept.length >= state.perRest) break;
  }
  return kept;
}

/** One more added to the draft, or the draft back untouched when it is full. */
export function addBrew(brews, state, id) {
  const held = normalizeBrews(brews, state);
  if (!state || held.length >= state.perRest) return held;
  const item = getItem(id);
  if (!item || !canBrew(state, item)) return held;
  return [...held, id];
}

/** One taken back out, by position, so two of the same recipe are two rows. */
export function dropBrew(brews, state, index) {
  const held = normalizeBrews(brews, state);
  if (index < 0 || index >= held.length) return held;
  return held.filter((_, at) => at !== index);
}

/** What tonight's brewing costs out of the crate, all of it. */
export function brewingCost(brews, state) {
  return normalizeBrews(brews, state).reduce(
    (total, id) => total + brewPrice(getItem(id), state),
    0
  );
}

/**
 * The flasks a draft actually produces, as item ids ready for the pack.
 *
 * `batch` is where one brew becomes two flasks, which is TWIN DISTILLATION and
 * the only thing on this track that makes more than it was asked for.
 */
export function brewedItems(brews, state) {
  if (!state) return [];
  const out = [];
  for (const id of normalizeBrews(brews, state)) {
    for (let made = 0; made < Math.max(1, state.batch); made += 1) out.push(id);
  }
  return out;
}

/**
 * What tonight's brewing is, said in rows: one per recipe, with how many of it
 * and what the whole line costs.
 *
 * Gathered rather than listed flat, because "Healing Draught x2, 40 Supplies" is
 * what the plan wants to print and three identical lines is not.
 */
export function brewRows(brews, state) {
  const rows = [];
  for (const id of normalizeBrews(brews, state)) {
    const found = rows.find((row) => row.id === id);
    if (found) {
      found.brews += 1;
      continue;
    }
    const item = getItem(id);
    rows.push({ id, item, name: item?.name ?? id, price: brewPrice(item, state), brews: 1 });
  }

  const batch = Math.max(1, state?.batch ?? 1);
  for (const row of rows) {
    row.supplies = row.price * row.brews;
    row.made = row.brews * batch;
  }
  return rows;
}

/**
 * Whether one more of this recipe is within reach, given that the rest itself is
 * paid for first and that everything already in the draft is paid for too.
 *
 * The same law `labourAffordable` and `layingAffordable` read by: the choice you
 * could never pay for is offered dead rather than left to fail at the last
 * button. `restCost` is handed in rather than looked up, because this file may
 * not import rest.js.
 */
export function brewAffordable(character, restCost, brews, state, item) {
  const held = Math.max(0, Math.floor(Number(character?.supplies) || 0));
  const already = brewingCost(brews, state);
  return held - restCost - already - brewPrice(item, state) >= 0;
}

/* ------------------------------------------------------------- the preview */

/** The tiers a rank opens that the rank below it could not reach. */
function openedAt(spec, rank) {
  const now = spec?.tiers?.[rank] ?? [];
  const before = spec?.tiers?.[rank - 1] ?? [];
  return now.filter((tier) => !before.includes(tier));
}

/**
 * What a rank of this set buys, for the presentation page of somebody who has
 * not taken it yet.
 *
 * The same shape `brewPreview` and `rankPreview` hand their own notes, so the
 * page prints one more without learning what an Alchemist is.
 *
 * It says one thing those two never have to: **a rank can open a tier the codex
 * has nothing on**. ALCHEMY's ladder is transcribed off "all Novice Potions" and
 * the only potion table in the pile is the Novice one, so Ranks 2 and 3 open
 * Adept and Master and there is nothing on either shelf yet. A note that quietly
 * printed "+0 Adept Potions" would read as a rank that does nothing, which is
 * false: it does exactly what it says and the codex has not caught up.
 */
export function alchemyPreview(talent, rank) {
  const spec = alchemyOf(talent);
  if (!spec) return null;

  const tiers = spec.tiers?.[rank] ?? [];
  const opened = openedAt(spec, rank);

  return {
    spec,
    tiers,
    opened,
    perRest: spec.perRest?.[rank] ?? 0,
    /* How many more brews than the rank below, which is what the reader is
       choosing. Zero at Rank 1, where the whole thing is new. */
    more: (spec.perRest?.[rank] ?? 0) - (spec.perRest?.[rank - 1] ?? 0),
    discount: spec.discount?.[rank] ?? 0,
    batch: spec.batch?.[rank] ?? 1,
    count: recipeShelf(opened).length,
    reach: recipeShelf(tiers).length,
  };
}

/** "two Healing Draughts and a Growth Elixir", for a slot that has to say so. */
export function brewSummary(brews, state) {
  const rows = brewRows(brews, state);
  if (rows.length === 0) return null;

  const said = rows.map((row) => (row.made > 1 ? `${row.name} x${row.made}` : row.name));
  if (said.length === 1) return said[0];
  return `${said.slice(0, -1).join(', ')} and ${said[said.length - 1]}`;
}
