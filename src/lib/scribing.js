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
 * A Spellquill's night is **two separate things**, and the sheet is clear about
 * which is which:
 *
 *   the scrolls    "You can craft 2 spell scrolls during a long rest without
 *                  hindering its effects." Paid for in Supplies, permanent, and
 *                  it is the Long Rest **action** — a rest buys one action and
 *                  this is what a Spellquill spends theirs on.
 *   the ephemeral  "At the end of a long rest, you can prepare a number of
 *                  Ephemeral Spell Scrolls equal to half your Intelligence plus
 *                  your rank." Free, fading, and **not** an action: it happens
 *                  at the end of every Long Rest whatever else the night was
 *                  spent on.
 *
 * So they sit in two places in the rest window, exactly as a Runebearer's runes
 * do: the ephemeral chooser above the action slot, because it is not one, and
 * the scribing inside it. See RestPrompt.jsx.
 *
 * -------------------------------------------------------------- the ink fades
 * "Ephemeral Spell Scrolls are spell scrolls that expire at the start of your
 * next long rest." **This one is wired**, where the Alchemist's IMPROVISED
 * BREWING is not, and the difference is the clock: improvised potions "expire at
 * the end of the day" and this site has no day, but it has Long Rests, and a Long
 * Rest is already a button. `fadedScrolls` is what the next night sweeps up.
 *
 * ----------------------------------------------------------- the Willpower
 * A Power Word costs Willpower, paid by the scribe at the moment of writing, and
 * the writing happens inside a Long Rest — which is the same dead-price problem
 * the Alchemist's potions had, where a cost paid inside a rest that refills the
 * pool is a cost nobody pays.
 *
 * It is charged here, and it is real, because it comes off **the refill**: a
 * Long Rest sets Willpower to its maximum (see restPlan), so a night that spent
 * nine on Power Words wakes at maximum less nine. That is the sheet's own price
 * in the sheet's own currency, and it is the same reading the Necromancer's
 * bodies already have — a night's work you are still holding in the morning.
 *
 * ------------------------------------------------------------------- the leaf
 * This file reads the spell codex, the scroll codex and the talent codex. rest.js
 * imports it, so it must never import rest.js back.
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
  SCROLL_SPELLS,
} from './scrolls.js';
import { getTalent, normalizeTalents } from './talents.js';
import { isForgedId, newForgedId, normalizeForged } from './forged.js';

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
    /* EPHEMERAL SPELL SCROLLS: "half your Intelligence + your rank in
       Spellquill". Intelligence is Mind on this site, and the halving is floored
       on its own before the rank joins it, the way every other halved attribute
       in the codex is: half of 5 is 2, and 2 + 1 is 3. */
    ephemeral: spec.ephemeral ? Math.floor(mind / 2) + rank : 0,
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

/**
 * And the state a rest should offer for the fading ones, or null.
 *
 * A separate call because it is a separate permission and a separate place in
 * the window: this one is not an action and is offered on every Long Rest, so a
 * night spent raising the dead still prepares its scrolls.
 */
export function restEphemeral(character, kind, talents = character?.talents) {
  const state = spellquillState(character, talents);
  if (!state || kind !== 'long' || state.ephemeral <= 0) return null;
  return state.shelf.length > 0 ? state : null;
}

/* ---------------------------------------------------------------- the draft
 * What the rest window is holding while the player decides: a list of
 * `{ spell, words }`, one entry per scroll, repeats allowed. A list rather than
 * a map because two scrolls of the same spell with different words on them are
 * two different things, and the order is what the window prints back.
 *
 * The two halves keep two drafts, because they are counted against two different
 * numbers and cleared at two different times. `ephemeral` on an entry is not
 * part of the draft: it is which draft the entry is in.
 */

/**
 * A draft repaired against what this Spellquill can actually do: spells their
 * rank has not opened are dropped, words they have not learned come off, a
 * scroll wearing more words than the rank allows is trimmed, and the list is cut
 * to the number of scrolls the night allows.
 *
 * `perRest` for the paid draft and `ephemeral` for the fading one, which is the
 * only thing the second argument changes.
 *
 * Repaired rather than trusted for the same reason every other stored shape is:
 * a rank can go down as easily as up while a window is open, and a draft that
 * outlived the rank that allowed it would be priced into a rest nobody may take.
 */
export function normalizeScribes(value, state, { ephemeral = false } = {}) {
  if (!state) return [];

  const room = ephemeral ? state.ephemeral : state.perRest;
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
export function addScribe(draft, state, spellId, { ephemeral = false } = {}) {
  const held = normalizeScribes(draft, state, { ephemeral });
  const room = ephemeral ? state?.ephemeral ?? 0 : state?.perRest ?? 0;
  if (held.length >= room) return held;

  const spell = scrollSpell(spellId);
  if (!spell || !canScribe(state, spell)) return held;
  return [...held, { spell: spell.id, words: [] }];
}

/** One taken back off, by position, so two of the same spell are two rows. */
export function dropScribe(draft, state, index, { ephemeral = false } = {}) {
  const held = normalizeScribes(draft, state, { ephemeral });
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
export function toggleScribeWord(draft, state, index, wordId, { ephemeral = false } = {}) {
  const held = normalizeScribes(draft, state, { ephemeral });
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
 * What tonight's Power Words cost in Willpower, across both drafts.
 *
 * Both, because the sheet charges for a word "whenever you create Spell
 * Scrolls" and does not care which kind of leaf it went on. Taken off the
 * night's refill rather than out of the pool it started in. See restPlan.
 */
export function scribingWillpower(draft, ephemeralDraft, state) {
  const rows = [
    ...normalizeScribes(draft, state),
    ...normalizeScribes(ephemeralDraft, state, { ephemeral: true }),
  ];
  return rows.reduce(
    (total, entry) => total + entry.words.reduce((sum, id) => sum + (getPowerWord(id)?.wp ?? 0), 0),
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
export function scribeRows(draft, state, { ephemeral = false } = {}) {
  return normalizeScribes(draft, state, { ephemeral }).map((entry, index) => {
    const spell = scrollSpell(entry.spell);
    return {
      index,
      spell,
      words: entry.words.map((id) => getPowerWord(id)).filter(Boolean),
      tier: scrollTier(spell),
      supplies: ephemeral ? 0 : scrollSupplies(spell),
      willpower: entry.words.reduce((sum, id) => sum + (getPowerWord(id)?.wp ?? 0), 0),
      name: scrollTitle({ spell: entry.spell, ephemeral }),
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
 * Both drafts, because both end up in the pack; the only difference is the
 * `ephemeral` flag, and that flag is the whole of what the next Long Rest
 * sweeps up.
 */
export function scribedRecords(draft, ephemeralDraft, state) {
  const out = [];

  for (const entry of normalizeScribes(draft, state)) {
    out.push(scribeRecord(entry, false));
  }
  for (const entry of normalizeScribes(ephemeralDraft, state, { ephemeral: true })) {
    out.push(scribeRecord(entry, true));
  }
  return out;
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

/** "Scroll of Fireball and an Ephemeral Scroll of Mend", for a slot that has to say so. */
export function scribeSummary(draft, ephemeralDraft, state) {
  const said = [
    ...scribeRows(draft, state).map((row) => row.name),
    ...scribeRows(ephemeralDraft, state, { ephemeral: true }).map((row) => row.name),
  ];
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
