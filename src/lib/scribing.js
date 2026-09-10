/**
 * Scribing — the Spellquill's night at the desk, and what it costs.
 *
 * The seventh shape of spec in the codex and the second whose output is an item:
 *
 *   a hand      loadouts.js. Cards picked out of the codex and re-chosen.
 *   a library   loadouts.js again. Cards written in one at a time and kept.
 *   a Brew      brews.js. Ingredients composed at the moment of use.
 *   a working   enchanting.js. Supplies turned into a rider on an item.
 *   a potion    alchemy.js. Supplies turned into an item off a fixed shelf.
 *   a body      undead.js. Marrow and Supplies turned into a minion.
 *   a scroll    here. Supplies turned into an item **the scribe chooses the
 *               contents of**, which is the one thing none of the six above do.
 *
 * The nearest relative is alchemy and deliberately so: a Long Rest action, paid
 * for out of the crate, priced off the codex, landing in the pack. What is
 * different is that a potion is a row on a shelf of twenty four and a scroll is
 * one of a hundred and forty six spells with any of seven Power Words on it, so
 * the draft here holds a composed thing rather than a recipe id.
 *
 * ------------------------------------------------------------------ two halves
 * A Spellquill writes **two different kinds of leaf**, at two prices, in two
 * places, and almost nothing about them is shared but the shelf:
 *
 *   the scrolls    "You can craft 2 spell scrolls during a long rest without
 *                  hindering its effects." Paid for in Supplies, permanent, and
 *                  it is the Long Rest **action** — a rest buys one action and
 *                  this is what a Spellquill spends theirs on. The desk lives in
 *                  the rest window; see ScribeRest.jsx.
 *   the ephemeral  one leaf, thrown down where you stand, for 2 Action Points
 *                  and the spell's own rung in Willpower. A card you play like
 *                  any other card, off the quick bar, in the middle of a fight
 *                  if that is where you are. See EphemeralWindow.jsx.
 *
 * ------------------------------------------------- the fading half was rebuilt
 * **On 2026-09-10, and it used to be the opposite of what it is.** The sheet
 * reads "at the end of a long rest, you can prepare a number of Ephemeral Spell
 * Scrolls equal to half your Intelligence plus your rank", and it was built that
 * way on 2026-09-09: free, capped by an attribute, chosen in a chooser above the
 * rest window's action slot because it was not an action.
 *
 * Jules replaced it: "rework spellquill so that ephemeral scroll are created on
 * the fly. Not after a long rest. He has an ability that allow him to create
 * one. Creating an ephemeral scroll require 2 action points … Ephemeral spell
 * crafting also cost 1 willpower for novice 2 for adept and 3 for master."
 *
 * So the count is gone with the night. **The Willpower pool is the cap**, which
 * is what a price at the moment of use always is on this sheet, and a second
 * ceiling on top of it would be design nobody asked for. What is left of the old
 * build is the ink itself, and that half was already right.
 *
 * -------------------------------------------------------------- the ink fades
 * "Ephemeral Spell Scrolls are spell scrolls that expire at the start of your
 * next long rest." **This is wired**, where the Alchemist's IMPROVISED BREWING
 * is not, and the difference is the clock: improvised potions "expire at the end
 * of the day" and this site has no day, but it has Long Rests, and a Long Rest is
 * already a button. `fadedScrolls` is what the next night sweeps up, and it does
 * not care which of the two ways the leaf was written or whose pack it has
 * reached since.
 *
 * ----------------------------------------------------------- the Willpower
 * A Power Word costs Willpower, paid by the scribe at the moment of writing.
 *
 * For a leaf thrown down in the field that is a price like any other: it comes
 * off the pool, through the same use prompt every card is paid through, and the
 * window adds it to the rung's own before it asks.
 *
 * At the desk it is the dead-price problem the Alchemist's potions had, where a
 * cost paid inside a rest that refills the pool is a cost nobody pays. So it
 * comes off **the refill**: a Long Rest sets Willpower to its maximum (see
 * restPlan), so a night that spent nine on Power Words wakes at maximum less
 * nine. That is the sheet's own price in the sheet's own currency, and it is the
 * same reading the Necromancer's bodies already have — a night's work you are
 * still holding in the morning.
 *
 * ------------------------------------------------------------------- the leaf
 * This file reads the spell codex, the scroll codex, the talent codex and the
 * item shelves. rest.js imports it, so it must never import rest.js back, and
 * items.js does not know this file exists, which is what makes the one import
 * that way round safe.
 */

import { levelForXp } from './characterModel.js';
import {
  POWER_WORDS,
  SCROLL_BASE,
  getPowerWord,
  listAnd,
  normalizeScroll,
  powerWordsAt,
  scrollSpell,
  scrollSupplies,
  scrollTier,
  scrollTitle,
  scrollWillpower,
  SCROLL_SPELLS,
  wordCost,
} from './scrolls.js';
import { getTalent, normalizeTalents } from './talents.js';
import { isForgedId, newForgedId, normalizeForged } from './forged.js';
import { beltSlotCount, normalizeBelt, normalizePack } from './items.js';

/** The set this whole file is about. */
export const SPELLQUILL_ID = 'spellquill';

/** The spec a set carries when it can scribe, or null for every set that cannot. */
export function scribeOf(talent) {
  return talent?.scribe ?? null;
}

/**
 * Everything this character's rank lets them write, or null for anybody who is
 * not a Spellquill.
 *
 * The same shape `alchemistState` and `enchanterState` hand back, and for the
 * same reason: one call that answers "can they, and how much", so the rest
 * window, the Abilities tab and the pricing all read one set of numbers.
 */
export function spellquillState(character, talents = character?.talents) {
  const set = getTalent(SPELLQUILL_ID);
  const spec = scribeOf(set);
  if (!spec) return null;

  const entry = normalizeTalents(talents).find((row) => row.id === SPELLQUILL_ID);
  if (!entry || !entry.rank) return null;

  const rank = entry.rank;
  const tiers = spec.tiers?.[rank] ?? [];
  const level = levelForXp(character?.xp);
  const mind = Math.max(0, Math.floor(Number(character?.mind) || 0));

  return {
    set,
    spec,
    rank,
    tiers,
    /* ARCANE SCRIBE: "you can craft 2 spell scrolls during a long rest without
       hindering its effects." Scrolls a night, and no rank moves it. */
    perRest: spec.perRest?.[rank] ?? 0,
    /* IMPROVED SYNTAX opens the words, and ANALITIC SIGHT is what lets two of
       them onto one leaf. */
    words: powerWordsAt(rank),
    wordsPerScroll: spec.wordsPerScroll?.[rank] ?? 0,
    /* What one fading leaf costs to throw down: `{ ap }` off the spec, and the
       Willpower off whichever rung the spell turns out to sit on. Null for a set
       that writes no fading ink at all.

       A number here until 2026-09-10, and the number was how many the night
       prepared. See the note at the top of this file for what replaced it. */
    ephemeral: ephemeralSpec(spec),
    /* AUTHOR OF TRUTH: "you can choose to ignore the Willpower point cost … for
       an amount of Willpower equal to your Power." Old Power is the attribute
       plus the level, which is the conversion key's own reading. Printed on the
       card and played at the table; nothing here spends it. */
    forgiven: spec.forgiven?.[rank] ? mind + level : 0,
    shelf: scrollShelf(tiers),
    level,
    mind,
  };
}

/** True for a character who can write anything at all. */
export function isSpellquill(character) {
  return spellquillState(character) !== null;
}

/** The spells a list of open rungs reaches, in the codex's own printed order. */
export function scrollShelf(tiers = []) {
  const open = new Set(tiers);
  return SCROLL_SPELLS.filter((card) => open.has(scrollTier(card)));
}

/** Whether this rank has opened this spell at all. */
export function canScribe(state, card) {
  return Boolean(state && card && state.tiers.includes(scrollTier(card)));
}

/**
 * Whether this set scribes on this rest, off its own `scribe` list.
 *
 * The same permission `brewsAtRest` and `swapsAtRest` read, and the same reason
 * it is a list rather than a flag: the card names which rest it happens on, and
 * a short one names none of them.
 */
export function scribesAtRest(spec, kind) {
  return Array.isArray(spec?.at) && spec.at.includes(kind);
}

/**
 * The state a *rest* should offer for the paid scrolls, or null.
 *
 * Null for a Short Rest, for anybody who is not a Spellquill, and for a rank
 * whose shelf is empty — the same three refusals `restAlchemy` makes.
 */
export function restScribing(character, kind, talents = character?.talents) {
  const state = spellquillState(character, talents);
  if (!state || !scribesAtRest(state.spec, kind)) return null;
  return state.perRest > 0 && state.shelf.length > 0 ? state : null;
}

/* ------------------------------------------------------- the fading leaf
 *
 * EPHEMERAL SPELL SCROLLS, as a card you play rather than a night you spend.
 * Everything below this line is about one leaf, thrown down where you stand, and
 * none of it touches the rest window.
 */

/** The `{ ap }` a set charges for a fading leaf, or null for one that writes none. */
function ephemeralSpec(spec) {
  const row = spec?.ephemeral;
  if (!row) return null;
  return { ap: Math.max(0, Math.floor(Number(row.ap) || 0)) };
}

/**
 * What this character can write on the spot, or null for everybody who cannot.
 *
 * The same `spellquillState` the desk reads, refused for the two things that
 * would make the window useless: a set that writes no fading ink, and a rank
 * whose shelf is empty. No rest is involved and none is asked about, which is
 * the whole of what changed on 2026-09-10.
 */
export function ephemeralState(character, talents = character?.talents) {
  const state = spellquillState(character, talents);
  if (!state || !state.ephemeral) return null;
  return state.shelf.length > 0 ? state : null;
}

/**
 * What one fading leaf costs, given what is going on it.
 *
 * Two Action Points off the card, the rung's own Willpower off the spell, and a
 * Power Word's Willpower on top of both. `ink` is the words' share on its own,
 * so the window can print the working rather than one total nobody can check.
 *
 * A spell this rank has not opened prices at nothing, because it is not a leaf
 * this character can write and the window will not offer it.
 */
export function ephemeralCost(state, spell, words = []) {
  const card = scrollSpell(spell?.id ?? spell);
  if (!state || !canScribe(state, card)) return { ap: 0, wp: 0, rung: 0, ink: 0 };

  const rung = scrollWillpower(card);
  const ink = wordCost(words);

  return { ap: state.ephemeral?.ap ?? 0, wp: rung + ink, rung, ink };
}

/**
 * The words that will actually go on it: the ones this rank knows, deduplicated,
 * and no more of them than one leaf takes.
 *
 * The same repair `normalizeScribes` makes on a draft row, for the same reason
 * and against the same two numbers. A window is not a saved shape, but a rank
 * can go down while one is open, and a leaf wearing a word its writer has since
 * handed back would be a scroll nobody could have written.
 */
export function ephemeralWords(state, words = []) {
  const allowed = new Set((state?.words ?? []).map((word) => word.id));
  const seen = new Set();
  const kept = [];

  for (const raw of Array.isArray(words) ? words : []) {
    const id = String(raw ?? '');
    if (!allowed.has(id) || seen.has(id)) continue;
    if (kept.length >= (state?.wordsPerScroll ?? 0)) break;
    seen.add(id);
    kept.push(id);
  }
  return kept;
}

/**
 * The forged record a written leaf becomes, ready for the `forged` column, or
 * null for anything this character could not have written.
 *
 * The same record `scribeRecord` mints for the desk, flagged as fading, which is
 * what puts it in front of the next Long Rest's broom. It is called after its
 * spell and there is nowhere to call it anything else: naming a leaf is a
 * flourish for something you are going to keep.
 */
export function ephemeralRecord(state, spell, words = []) {
  const card = scrollSpell(spell?.id ?? spell);
  if (!state || !canScribe(state, card)) return null;
  return scribeRecord({ spell: card.id, words: ephemeralWords(state, words) }, true);
}

/** Which of this character's open belt loops are empty, by index. */
export function freeLoops(character) {
  const belt = normalizeBelt(character?.belt);
  return belt
    .slice(0, beltSlotCount(character))
    .map((entry, index) => (entry ? -1 : index))
    .filter((index) => index >= 0);
}

/**
 * The sheet with one written leaf on it: the record on the forged shelf, and the
 * leaf itself either in the pack or clipped to a belt loop.
 *
 * The mirror of `withoutScrolls`, one screen down, and the one place that decides
 * where a leaf thrown down in the field lands.
 *
 * **A loop is offered, which is the one thing this differs from the desk on.** A
 * night's writing goes into the pack, because a loop is a place you have chosen
 * to put something and the Inventory tab is where choosing happens. A leaf
 * written in the middle of a fight is one you meant to read, and a scroll can
 * only be read off a loop, so the window offers a free loop first and the pack
 * second: Jules's "the user can then choose to cast it if he can", with the
 * three-tab walk taken out of it.
 *
 * `loop` is a belt index, or null for the pack. A loop that has filled up or
 * closed since the window opened falls back to the pack rather than overwriting
 * whatever is in it, which is the same refusal every other placement makes.
 */
export function withLeaf(character, record, loop = null) {
  if (!record?.id) return null;

  const patch = { forged: { ...normalizeForged(character?.forged), [record.id]: record } };

  const belt = normalizeBelt(character?.belt);
  const at = Number.isInteger(loop) ? loop : -1;

  if (at >= 0 && at < beltSlotCount(character) && !belt[at]) {
    const next = [...belt];
    next[at] = { id: record.id, used: 0 };
    patch.belt = next;
    return patch;
  }

  patch.pack = [...normalizePack(character?.pack), record.id];
  return patch;
}

/* ---------------------------------------------------------------- the draft
 * What the rest window is holding while the player decides: a list of
 * `{ spell, words }`, one entry per scroll, repeats allowed. A list rather than
 * a map because two scrolls of the same spell with different words on them are
 * two different things, and the order is what the window prints back.
 *
 * **One draft, since 2026-09-10.** There were two, for the two halves of a
 * night; the fading half is a card you play now and has nothing to hold a draft
 * for, so everything below is the desk's and only the desk's.
 */

/**
 * A draft repaired against what this Spellquill can actually do: spells their
 * rank has not opened are dropped, words they have not learned come off, a
 * scroll wearing more words than the rank allows is trimmed, and the list is cut
 * to the number of scrolls the night allows.
 *
 * Repaired rather than trusted for the same reason every other stored shape is:
 * a rank can go down as easily as up while a window is open, and a draft that
 * outlived the rank that allowed it would be priced into a rest nobody may take.
 */
export function normalizeScribes(value, state) {
  if (!state) return [];

  const room = state.perRest;
  const allowed = new Set(state.words.map((word) => word.id));

  const kept = [];
  for (const raw of Array.isArray(value) ? value : []) {
    const spell = scrollSpell(raw?.spell);
    if (!spell || !canScribe(state, spell)) continue;

    const seen = new Set();
    const words = [];
    for (const id of Array.isArray(raw.words) ? raw.words : []) {
      const key = String(id ?? '');
      if (!allowed.has(key) || seen.has(key)) continue;
      if (words.length >= state.wordsPerScroll) break;
      seen.add(key);
      words.push(key);
    }

    kept.push({ spell: spell.id, words });
    if (kept.length >= room) break;
  }
  return kept;
}

/** One more leaf on the desk, or the draft back untouched when it is full. */
export function addScribe(draft, state, spellId) {
  const held = normalizeScribes(draft, state);
  if (held.length >= (state?.perRest ?? 0)) return held;

  const spell = scrollSpell(spellId);
  if (!spell || !canScribe(state, spell)) return held;
  return [...held, { spell: spell.id, words: [] }];
}

/** One taken back off, by position, so two of the same spell are two rows. */
export function dropScribe(draft, state, index) {
  const held = normalizeScribes(draft, state);
  if (index < 0 || index >= held.length) return held;
  return held.filter((_, at) => at !== index);
}

/**
 * A Power Word on or off one leaf, by position.
 *
 * A toggle rather than an add, because a word goes onto a scroll once: two
 * Mighties is one Mighty, which is the stacking law and is what
 * `normalizeScroll` would strip anyway. A leaf already wearing its allowance
 * refuses a new word rather than pushing the oldest off — the player takes one
 * off, which is how every other budget on this sheet reads.
 */
export function toggleScribeWord(draft, state, index, wordId) {
  const held = normalizeScribes(draft, state);
  if (index < 0 || index >= held.length) return held;
  if (!getPowerWord(wordId) || !state?.words.some((word) => word.id === wordId)) return held;

  return held.map((entry, at) => {
    if (at !== index) return entry;
    if (entry.words.includes(wordId)) {
      return { ...entry, words: entry.words.filter((id) => id !== wordId) };
    }
    if (entry.words.length >= state.wordsPerScroll) return entry;
    return { ...entry, words: [...entry.words, wordId] };
  });
}

/** What tonight's scribing costs out of the crate, all of it. */
export function scribingCost(draft, state) {
  return normalizeScribes(draft, state).reduce(
    (total, entry) => total + scrollSupplies(scrollSpell(entry.spell)),
    0
  );
}

/**
 * What tonight's Power Words cost in Willpower.
 *
 * The desk's alone, since 2026-09-10: a fading leaf is paid for at the moment it
 * is written, out of the pool, through the same use prompt every other card is
 * paid through, so there is no second draft for this to add up. Taken off the
 * night's refill rather than out of the pool it started in. See restPlan.
 */
export function scribingWillpower(draft, state) {
  return normalizeScribes(draft, state).reduce(
    (total, entry) => total + wordCost(entry.words),
    0
  );
}

/**
 * Tonight's desk, said in rows: one per leaf, with what it holds and what it
 * costs.
 *
 * One row a *leaf* rather than one a spell, which is the opposite of `brewRows`
 * and is right for the same reason it is wrong there: two Healing Draughts are
 * interchangeable and two scrolls of Fireball with different words on them are
 * not. The window prints these back in the order they were written.
 */
export function scribeRows(draft, state) {
  return normalizeScribes(draft, state).map((entry, index) => {
    const spell = scrollSpell(entry.spell);
    return {
      index,
      spell,
      words: entry.words.map((id) => getPowerWord(id)).filter(Boolean),
      tier: scrollTier(spell),
      supplies: scrollSupplies(spell),
      willpower: wordCost(entry.words),
      name: scrollTitle({ spell: entry.spell }),
    };
  });
}

/**
 * Whether one more scroll of this spell is within reach, given that the rest
 * itself is paid for first and everything already on the desk is paid for too.
 *
 * The same law `brewAffordable` and `layingAffordable` read by: a choice you
 * could never pay for is offered dead rather than left to fail at the last
 * button. `restCost` is handed in rather than looked up, because this file may
 * not import rest.js.
 */
export function scribeAffordable(character, restCost, draft, state, card) {
  const held = Math.max(0, Math.floor(Number(character?.supplies) || 0));
  const already = scribingCost(draft, state);
  return held - restCost - already - scrollSupplies(card) >= 0;
}

/* --------------------------------------------------------------- the writing */

/**
 * The forged records a night's work produces, ready for the `forged` column.
 *
 * Permanent, every one of them. The fading ones used to come out of here too and
 * are written one at a time now, at the moment they are thrown down: see
 * `ephemeralRecord`, which mints exactly the same shape with the flag set.
 */
export function scribedRecords(draft, state) {
  return normalizeScribes(draft, state).map((entry) => scribeRecord(entry, false));
}

/** One leaf as the record that goes on the shelf. */
function scribeRecord(entry, ephemeral) {
  const scroll = normalizeScroll({ spell: entry.spell, words: entry.words, ephemeral });
  if (!scroll) return null;

  return { id: newForgedId(), base: SCROLL_BASE, ench: [], name: null, art: null, scroll };
}

/**
 * Every fading scroll this character is holding, as forged ids.
 *
 * "Ephemeral Spell Scrolls … expire at the start of your next long rest." So
 * this is what a Long Rest sweeps, and it is read off the shelf rather than off
 * the pack: a fading scroll clipped to a belt loop, worn as a trinket or sitting
 * in the bag is the same scroll and goes the same way.
 *
 * Everything downstream is `pruneForged`'s job, which already takes a record off
 * the shelf the moment nothing on the sheet is holding it.
 */
export function fadedScrolls(character) {
  const shelf = normalizeForged(character?.forged);
  return Object.values(shelf)
    .filter((record) => record.scroll?.ephemeral)
    .map((record) => record.id);
}

/**
 * A pack, a belt, a trinket list and an equipment map with a set of ids taken
 * out of them.
 *
 * The sweep has to reach every place a scroll can be, because the sheet lets one
 * be clipped on and a fading scroll on a belt loop must not survive the night
 * that a fading scroll in the bag did not. `pruneForged` then takes the records
 * themselves, so nothing is left pointing at nothing.
 */
export function withoutScrolls(character, ids = []) {
  const gone = new Set(ids.filter((id) => isForgedId(id)));
  if (gone.size === 0) return null;

  const patch = {};

  const pack = Array.isArray(character?.pack) ? character.pack : [];
  const keptPack = pack.filter((entry) => !gone.has(typeof entry === 'string' ? entry : entry?.id));
  if (keptPack.length !== pack.length) patch.pack = keptPack;

  const belt = Array.isArray(character?.belt) ? character.belt : [];
  if (belt.some((entry) => gone.has(entry?.id))) {
    patch.belt = belt.map((entry) => (gone.has(entry?.id) ? null : entry));
  }

  const trinkets = Array.isArray(character?.trinkets) ? character.trinkets : [];
  const keptTrinkets = trinkets.filter((id) => !gone.has(id));
  if (keptTrinkets.length !== trinkets.length) patch.trinkets = keptTrinkets;

  const worn = character?.equipment && typeof character.equipment === 'object' ? character.equipment : null;
  if (worn && Object.values(worn).some((id) => gone.has(id))) {
    patch.equipment = Object.fromEntries(
      Object.entries(worn).map(([slot, id]) => [slot, gone.has(id) ? null : id])
    );
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

/* ------------------------------------------------------------------ the said */

/** "Scroll of Fireball and Scroll of Mend", for a slot that has to say so. */
export function scribeSummary(draft, state) {
  const said = scribeRows(draft, state).map((row) => row.name);
  return said.length > 0 ? listAnd(said) : null;
}

/* ------------------------------------------------------------- the preview */

/** The rungs a rank opens that the rank below it could not reach. */
function openedAt(spec, rank) {
  const now = spec?.tiers?.[rank] ?? [];
  const before = spec?.tiers?.[rank - 1] ?? [];
  return now.filter((tier) => !before.includes(tier));
}

/**
 * What a rank of this set buys, for the presentation page of somebody who has
 * not taken it yet.
 *
 * The same shape `alchemyPreview` and `rankPreview` hand their own notes, so the
 * page prints one more without learning what a Spellquill is.
 */
export function scribePreview(talent, rank) {
  const spec = scribeOf(talent);
  if (!spec) return null;

  const tiers = spec.tiers?.[rank] ?? [];
  const opened = openedAt(spec, rank);
  const words = powerWordsAt(rank);
  const before = powerWordsAt(rank - 1);

  return {
    spec,
    tiers,
    opened,
    perRest: spec.perRest?.[rank] ?? 0,
    wordsPerScroll: spec.wordsPerScroll?.[rank] ?? 0,
    /* How many more words than the rank below, which is what the reader is
       choosing between. */
    words: words.length - before.length,
    held: words.length,
    all: POWER_WORDS.length,
    count: scrollShelf(opened).length,
    reach: scrollShelf(tiers).length,
  };
}
