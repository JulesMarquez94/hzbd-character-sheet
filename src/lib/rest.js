/**
 * Resting: the other half of a fight.
 *
 * A rest is the only thing on the sheet that moves several pools at once and
 * ends several effects at once, so it is the one thing that most wants to say
 * exactly what it is about to do *before* it does it. Everything here builds a
 * plan — a list of lines a dialog can print, and the single patch that carries
 * them out — and nothing writes anything on its own.
 *
 * ------------------------------------------------------------------ the two
 *   Short Rest   5 Supplies. Half your Health back. Ends what lasts "until a
 *                short rest".
 *   Long Rest    10 Supplies. All your Health and all your Willpower back, and
 *                whatever Shield you were still carrying gone. Ends everything a
 *                short rest ends, and everything that lasts until a long one.
 *
 * A long rest ends what a short rest ends, and never the other way round: an
 * effect written "until your next Long Rest" survives a nap.
 *
 * ------------------------------------------------------------ what fills again
 * A rest also hands back whatever was waiting on one. A belt item that limits
 * itself names the rest that fills it — the Druidic Tome "has nothing more to say
 * until you have taken a Long Rest" — and that use comes back in the same patch
 * as the pools, because a card that says a rest fills it should not then need a
 * dot tapped back on by hand. Which rests fill what is the same law as which
 * rests end what, read off the same `ends` list. See `beltRest` in items.js.
 *
 * A *card* that limits itself the same way is filled the same way, off the same
 * list, in the same patch: a Celestial's SPROUT WINGS says "you must take a long
 * rest before you can use this ability again", and this button is the only thing
 * on the sheet that can honour the sentence. See `usesRest` in uses.js.
 *
 * -------------------------------------------------------------- the preparing
 * A rest is also when a caster decides what they are carrying tomorrow. A set
 * that chooses its own cards says on the card itself which rests may re-choose
 * them — a Mycomancer's spells are changed with the long rest's own action — so
 * the rest window offers the swap, and the swap rides in the rest's own patch.
 * Backing out of the rest backs out of the swap with it: nothing is written
 * until "Yes, rest" is pressed, which is the whole point of this file.
 *
 * ---------------------------------------------------------------- the labour
 * A long rest is also when work gets done. Several background skills are
 * actions taken *during* a long rest and paid for in Supplies — crafting a
 * potion, keeping vigil, foraging the ground around the camp. Those are listed
 * in the long rest's own window so they can be done there, which is the only
 * place they were ever going to be done.
 *
 * Their numbers are read off the designer's own card text rather than authored
 * a second time here, so a card that changes changes the button with it. The
 * verb beside each number is what says whether it leaves the crate or lands in
 * it ("expending 20 Supplies" against "gain 15 Supplies").
 *
 * ------------------------------------------------------------------ the still
 * And a long rest is when an Alchemist brews. That is the same shape as a labour
 * with one difference worth naming: it is the only long rest action whose output
 * is a **thing**. A labour moves the crate, an enchantment lays a rider, a
 * prepared hand rewrites a column, and ALCHEMY turns Supplies into flasks that
 * end up in the pack. Priced off the recipes themselves in alchemy.js, and
 * written into this rest's own patch so backing out unmakes them.
 *
 * ------------------------------------------------------------- the bookkeeping
 * Every supply movement is a ledger entry with its own reason, the same as one
 * typed into the crate by hand, because a rest that quietly drains ten supplies
 * is a rest nobody can account for afterwards. Overspending empties the crate
 * rather than going negative, exactly as the Supply ledger already does.
 */

import { brewAffordable, brewRows, brewedItems, normalizeBrews, restAlchemy } from './alchemy.js';
import {
  appendLedger,
  clamp,
  formatNumber,
  grantRows,
  levelForXp,
  newLedgerId,
} from './characterModel.js';
import { restHealth } from './grants.js';
import { TURN_SECONDS, normalizeEffects } from './combatTurn.js';
import { getBackgroundSkill, normalizeBackgroundSkills, getBackground } from './backgrounds.js';
import { characterSkillGrantSources, normalizeLevelPicks } from './levelPicks.js';
import { pickChanges, restSwaps } from './loadouts.js';
import { addMinion, dropMinion, minionRest } from './minions.js';
import {
  marrowNote,
  ossuary,
  raiseBody,
  raiseDraft,
  raiseLines,
  undeadOffers,
  undeadRaises,
} from './undead.js';
import { feralRest } from './feral.js';
import {
  changeCost,
  enchantChanges,
  enchanterState,
  layingCost,
} from './enchanting.js';
import { cardProse } from './cardText.js';
import { SUPPLIES_PER_BURDEN, getEnchantment } from './enchantments.js';
import { beltRest, characterGrantSources, getItem, heldItem, normalizePack } from './items.js';
import { normalizeForged } from './forged.js';
import {
  canMeditate,
  consecrate,
  faithRest,
  meditate,
  meditationGain,
  normalizeOath,
  oathState,
} from './oathbound.js';
import { pactState, reshapePactWeapon, writePactForm } from './pact.js';
import { reviveRunes } from './runes.js';
import {
  fadedScrolls,
  normalizeScribes,
  restScribing,
  scribeAffordable,
  scribeRows,
  scribedRecords,
  scribingWillpower,
  withoutScrolls,
} from './scribing.js';
import { usesRest } from './uses.js';

/** What each rest costs and what it gives back. */
export const RESTS = {
  short: {
    id: 'short',
    label: 'Short Rest',
    supplies: 5,
    // Ends only what says "short"; a long rest's effects sit through it.
    ends: ['short'],
    /* How long it takes. The rulebook's own table: "Time · 1 hour · 8 hours".
       It is here because a rest ends more than what names it — see `restEnds`. */
    hours: 1,
    blurb: 'An hour off your feet. Enough to bind a wound and eat.',
  },
  long: {
    id: 'long',
    label: 'Long Rest',
    supplies: 10,
    ends: ['short', 'long'],
    hours: 8,
    blurb: 'A full night. Everything comes back, and the work of the camp gets done.',
  },
};

export function getRest(kind) {
  return RESTS[kind] ?? null;
}

/**
 * Whether this rest is the end of one running effect.
 *
 * Two ways an effect ends at a rest, and until 2026-09-09 the sheet only knew
 * the first:
 *
 *   it names the rest    `until` is 'short' or 'long', and `ends` says which of
 *                        those this rest closes. A long rest ends what a short
 *                        one does and never the other way round.
 *   the rest outlasts it **the clock**. Jules: "when taking a short rest,
 *                        effects that are under 1 hour should clear. So for
 *                        example cloak of flame is 5 turns, a turn is 6 seconds.
 *                        Same thing with long rest which is 8 hours."
 *
 * The second is arithmetic and nothing else: a turn is six seconds (see
 * TURN_SECONDS), a Short Rest is an hour and a Long Rest eight, so anything
 * still counting turns is long finished by the time either of them is. CLOAK OF
 * FLAMES is five turns — half a minute — and sitting down for an hour with it
 * still burning was the sheet holding a row nobody could have been wearing.
 *
 * Written as the comparison rather than as "every turn count clears" so the two
 * rests stay different: a row counted in turns that somehow reached past an hour
 * would sit through a short rest and go on the long one, which is what the
 * numbers say and what a table would rule.
 *
 * A row with no count and no rest on it is open-ended — "until manually
 * removed" — and no rest touches it. That is the other half of the tracker's own
 * law and it is deliberately unchanged: a Grapple is not something you sleep
 * off.
 */
export function restEnds(rest, effect) {
  if (!effect) return false;

  const ends = rest?.ends ?? [];
  if (effect.until && ends.includes(effect.until)) return true;

  if (effect.turns === null || effect.turns === undefined) return false;

  const turns = Math.max(0, Math.floor(Number(effect.turns) || 0));
  const hours = Math.max(0, Number(rest?.hours) || 0);
  return turns * TURN_SECONDS < hours * 3600;
}

/**
 * Everything that takes Supplies off a rest, named as well as counted.
 *
 * Two things do, and they come from opposite ends of the sheet:
 *
 *   OZ'EM PICK   "the cost in supplies of short and long rest are reduced by 2",
 *                the only enchantment that moves a rest rather than a stat.
 *   FRUGAL       "The cost of your Long and Short Rests is reduced by 2
 *                Supplies", a background skill.
 *
 * A working and a skill are **different sources, so the two stack**: a Frugal
 * Enchanter wearing a Pick rests for 6 rather than 10. The same-source law bites
 * inside each half and never across them, which is why each half is read by its
 * own file's own deduplicated reading — `characterGrantSources` in items.js for
 * the workings, `characterSkillGrantSources` in levelPicks.js for the skills.
 * Two rings carrying a Pick cut it once; a background and a pact both teaching
 * Frugal cut it once.
 *
 * Named rather than only summed, because the rest window prints the arithmetic
 * and "10 less 4" with nothing to attribute it to is a number the reader has to
 * go and reconstruct off two other tabs.
 */
export function restCut(character) {
  const rows = [...characterGrantSources(character), ...characterSkillGrantSources(character)]
    .map((row) => ({ name: row.name, amount: Math.floor(Number(row.restSupplies) || 0) }))
    .filter((row) => row.amount > 0);

  return {
    amount: rows.reduce((sum, row) => sum + row.amount, 0),
    names: rows.map((row) => row.name),
  };
}

/**
 * The one line under a Health row, naming the card when a card made it smaller.
 *
 * "All of it." and "Half your maximum back." are what every rest has always
 * said. The third answer is new and it is the only one that has to explain
 * itself: a Long Rest that mended half is a rest somebody will otherwise think
 * is broken, so it says which card did that.
 */
function restHealthDetail(gives, rows, kind) {
  if (gives === 'full') return 'All of it.';

  const named = rows
    .filter((row) => row?.restHealth?.[kind === 'long' ? 'long' : 'short'])
    .map((row) => row.name);

  return named.length > 0
    ? `Half your maximum back, which is ${named.join(' and ')}.`
    : 'Half your maximum back.';
}

/**
 * What a rest costs *this* character, which is not always what it costs.
 *
 * Floored at nothing, because a rest that paid you would be a strange kind of
 * rest.
 *
 * Everything that prices a rest goes through here: the plan, and the two
 * affordability checks that offer a chip dead rather than letting it fail at the
 * last button.
 */
export function restPrice(character, kind) {
  const rest = getRest(kind);
  if (!rest) return 0;
  return Math.max(0, rest.supplies - restCut(character).amount);
}

/* ------------------------------------------------------------- the labours */

/** "expending 20 Supplies" leaves the crate; "gain 15 Supplies" lands in it. */
const SPEND_WORDS = /expend|spend|pay|cost/gi;
const GAIN_WORDS = /gain|recover|receive|find/gi;

/**
 * Where a word last appears before a point in the text, or -1.
 *
 * The verb that governs a number is the nearest one *before* it, however far
 * back that is. A fixed window misses the second half of a sentence like the
 * Smith's "expending 30 Supplies to repair ... or 60 Supplies to reforge",
 * where the only verb is long behind the second number.
 */
function lastMatch(text, pattern) {
  let last = -1;
  pattern.lastIndex = 0;
  for (const found of text.matchAll(pattern)) last = found.index;
  return last;
}

/**
 * The supply movements a card names, in the order it names them.
 *
 * Read off the printed body, with the nearest verb before each number
 * deciding the direction. A card that names no number offers none, and the
 * dialog falls back to a free amount for it.
 */
export function labourOptions(card) {
  const whole = `${cardProse(card?.body)}\n${cardProse(card?.sub_body)}`;

  /* Only the paragraphs that speak of the rest itself. Field Medic names
     10 Supplies for its mid-combat stabilise a paragraph earlier, and that
     number must not come back as camp work. A card whose numbers sit outside
     such a paragraph still reads whole, so nothing new is silently dropped. */
  const restParts = whole.split(/\n{2,}/).filter((part) => /long rest/i.test(part));
  const text = restParts.length > 0 ? restParts.join('\n') : whole;

  const options = [];
  const seen = new Set();

  for (const match of text.matchAll(/(\d+)\s*(?:Supplies\b|(?=[.,]))/gi)) {
    const amount = Math.max(0, Math.floor(Number(match[1]) || 0));
    if (!amount || seen.has(amount)) continue;

    // Everything before the number, with the nearest verb winning.
    const lead = text.slice(0, match.index);
    const spend = lastMatch(lead, SPEND_WORDS);
    const gain = lastMatch(lead, GAIN_WORDS);
    if (spend === -1 && gain === -1) continue;

    seen.add(amount);
    options.push({ amount, gain: gain > spend });
  }

  return options;
}

/**
 * Everything this character can do during a long rest.
 *
 * A skill qualifies by saying so: it is tagged Long Rest, or its text names
 * taking a long rest as the moment it happens. Both, because the tab tags most
 * of them and describes all of them, and a skill that only describes it is
 * still a thing you can do.
 *
 * `Long Rest` is the designer's own word for it, off the Tags column of the
 * Skills tab, and `Labour` is what this file called the same thing before that
 * tab existed. Both are read, so a card tagged either way is offered.
 */
export function restLabours(character) {
  const background = getBackground(character?.background);
  const ids = [
    ...normalizeBackgroundSkills(background, character?.background_skills),
    ...Object.values(normalizeLevelPicks(character?.level_picks))
      .map((pick) => pick.skill)
      .filter(Boolean),
  ];

  const seen = new Set();
  const rows = [];

  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);

    const card = getBackgroundSkill(id);
    if (!card) continue;

    const text = `${cardProse(card.body)}\n${cardProse(card.sub_body)}`;
    const tags = card.tags ?? [];
    const isLabour =
      tags.includes('Long Rest') ||
      tags.includes('Labour') ||
      /take a long rest|taking a long rest/i.test(text);
    if (!isLabour) continue;

    rows.push({ card, options: labourOptions(card) });
  }

  return rows;
}

/* ----------------------------------------------------------------- the plan */

/** "Bramble Whip and Rot Touch", "one, two and three". No Oxford comma. */
function listOut(words) {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** What an enchantment is called, for a line that names one. */
function enchantName(id) {
  return getEnchantment(id)?.name ?? String(id);
}

/**
 * What the thing being enchanted is called. An id the codex no longer knows still
 * gets a line rather than a blank, because the Supplies were spent either way.
 */
function itemName(character, id) {
  return heldItem(character, id)?.name ?? String(id);
}

/**
 * Everything an Enchanter can do while the fire burns down: how many enchantments
 * their own person may carry, what is on it, and what they have laid on what.
 *
 * Null for everyone who is not one, which is what the window checks.
 */
export function restEnchanting(character, kind) {
  if (kind !== 'long') return null;
  return enchanterState(character);
}

/* --------------------------------------------------------- the one action
 *
 * A rest buys **one** action, and the Status & Terms tab is where that comes
 * from: "successfully completing a Long Rest fully restores your Health and
 * Willpower, and allows you to perform 1 Long Rest Action." Jules put it plainly
 * on 2026-08-20: "you can only do 1 action per long rest, so if I m enchanting a
 * new weapon I cannot do another one".
 *
 * The window used to offer four different things at once, in four sections, each
 * enforcing its own limit and none of them enforcing that one: a night could
 * craft a potion, lay two enchantments, change what was worn *and* re-prepare a
 * whole hand. So the sections are gone and there is a **slot**. This is what the
 * slot may be filled with.
 *
 * One list, one shape, whatever the action actually is — the same trick
 * abilitySources.js plays with a "source". A new kind of long rest action is a
 * new branch here and a new step in the window, and nothing else has to learn
 * what it is. Eight kinds so far:
 *
 *   `labour`   a background skill worked during a rest
 *   `enchant`  ENCHANTING, and what it lays on what
 *   `worn`     WIELDER OF WONDER, and what is on the Enchanter's own person
 *   `alchemy`  ALCHEMY, and the flasks it fills out of the crate
 *   `prepare`  a set with a `loadout` that swaps or researches on this rest
 *   `pact`     THE PACT, and the shape its weapon takes tomorrow
 *   `raise`    the OSSUARY, and the body that stands up out of it
 *   `scribe`   SCRIBING, and the leaves the desk turns out for the night
 *   `sanctuary` CONSECRATION, and the ground a night makes yours
 *   `meditate`  MEDITATION, and the Faith a night sitting with a vow gives back
 *
 * Rulebook 8.1 lists the same set in the players' own words, so a kind added
 * here is a bullet there.
 */

/**
 * Every action this character could spend this rest on.
 *
 * `talents` is the window's own draft rather than the row, so a shelf reopened
 * after a choice shows the choice. `kind` decides what is offered at all: nothing
 * below names a short rest, so a short rest gets an empty list and the window
 * shows no slot.
 */
export function restActions(character, kind, talents = character?.talents) {
  const held = { ...character, talents };
  const rows = [];

  /* ---- the work of the camp ----
     Background skills that are done *during* a rest, with the numbers parsed off
     the designer's own card text. One row per card; a card that offers two
     amounts asks which in its own step. */
  if (kind === 'long') {
    for (const { card, options } of restLabours(character)) {
      rows.push({
        id: `labour:${card.id}`,
        kind: 'labour',
        label: card.name,
        from: 'The work of the camp',
        note: card.summary ?? null,
        card,
        options,
      });
    }
  }

  /* ---- the Enchanter's evening ----
     Two of their three cards happen here, and they are two *actions* now rather
     than two rows of one section: laying a working costs the crate and changing
     what you wear costs nothing, and a night buys one of them. */
  const enchanter = restEnchanting(held, kind);
  if (enchanter) {
    const cap =
      enchanter.perItem === 1 ? 'one enchantment an item' : `up to ${enchanter.perItem} an item`;

    rows.push({
      id: 'enchant',
      kind: 'enchant',
      label: 'Enchant an item',
      from: 'Enchanting',
      note: `${enchanter.spec.supplyRate} Supplies a point of Magic Burden, and ${cap}.`,
      state: enchanter,
    });

    if (enchanter.wornMax > 0) {
      rows.push({
        id: 'worn',
        kind: 'worn',
        label: 'Change what you wear',
        from: 'Wielder of Wonder',
        note: `${enchanter.worn.length} of ${enchanter.wornMax} on your own person, and no Supplies to change them.`,
        state: enchanter,
      });
    }
  }

  /* ---- the Alchemist's still ----
     ALCHEMY: "whenever you take a long rest you can use your long rest action to
     brew two of them and still benefit from the rest." One row whatever the
     rank, because the rank only changes how many and how much. */
  const alchemy = restAlchemy(held, kind);
  if (alchemy) {
    const flasks = alchemy.batch > 1 ? `, ${alchemy.batch} flasks apiece` : '';
    rows.push({
      id: 'alchemy',
      kind: 'alchemy',
      label: `Brew ${plural(alchemy.spec.noun, alchemy.perRest)}`,
      from: `${alchemy.set.name} · ${alchemy.spec.label}`,
      note: `${alchemy.perRest} a night${flasks}, off a shelf of ${alchemy.shelf.length}. The components come out of the crate.`,
      state: alchemy,
    });
  }

  /* ---- the Spellquill's desk ----
     ARCANE SCRIBE: "whenever you take a Long Rest you can use your Long Rest
     action to write two of them and still benefit from the rest." One row
     whatever the rank, because the rank only changes which rungs are open and
     how many words fit on a leaf.

     Its sibling, the fading scrolls, is deliberately **not** here and is not in
     this window at all any more: EPHEMERAL SPELL SCROLLS is a card you play, off
     the quick bar, for Action Points and Willpower. A night has nothing to do
     with it. See scribing.js and EphemeralWindow.jsx. */
  const desk = restScribing(held, kind);
  if (desk) {
    const words =
      desk.wordsPerScroll > 0
        ? `, ${desk.wordsPerScroll} Power ${desk.wordsPerScroll === 1 ? 'Word' : 'Words'} a leaf`
        : '';
    rows.push({
      id: 'scribe',
      kind: 'scribe',
      label: `Write ${plural(desk.spec.noun, desk.perRest)}`,
      from: `${desk.set.name} · ${desk.spec.label}`,
      note: `${desk.perRest} a night${words}, off a shelf of ${desk.shelf.length}. The Quartz comes out of the crate.`,
      state: desk,
    });
  }

  /* ---- what a set re-prepares, and what a set researches ----
     The permission is the granting card's: a Mycomancer's FUNGAL INVOCATION says
     the swap costs the long rest's action, which is exactly what this list is.

     Two shapes through one row, because a rest offers one slot either way. A hand
     is re-chosen whole and the row says "change"; a library takes exactly one new
     card and the row says "research", which is ARCANE RESEARCH's own verb. The
     difference the chooser actually enforces is the allowance riding on `state`
     (see `restSwaps` in loadouts.js), so the step downstream needs no branch of
     its own. */
  /* The character's own column is handed in beside the draft, because a library's
     allowance is measured off what the night *started* with. Without it the rest
     window granted one more spell for every spell it had already granted. See
     restSwaps in loadouts.js. */
  /* The character rides in as the attributes a ceiling might be read against.
     One pool has one: a Runebearer's slate is half their Physique plus 4 a rank,
     so a rest window that measured it without them would offer a night's rune
     against a capacity four short of the real one. See capacityAt in
     loadouts.js. */
  for (const { talent, state, mode } of restSwaps(
    talents,
    kind,
    levelForXp(character?.xp),
    character?.talents,
    character
  )) {
    rows.push({
      id: `prepare:${talent.id}`,
      kind: 'prepare',
      mode,
      label:
        mode === 'research'
          ? `${state.spec.verb ?? 'Research'} a ${state.spec.noun}`
          : `Change your ${plural(state.spec.noun, state.known)}`,
      from: `${talent.name} · ${state.spec.label}`,
      note: researchNote(state, mode) ?? prepareNote(state),
      talent,
      state,
    });
  }

  /* ---- and what shape the pact's weapon wakes up in ----
     PACT-BOUND WEAPON: "Whenever you take a Long Rest, you can use your Long
     Rest action to reshape it into another form." The permission is the spec's
     `reshape` list, the same rest-keyed shape a loadout's `swap` carries, and
     it is only offered once the pact has a weapon to reshape. */
  for (const pact of pactState(held)) {
    if (!pact.weapon || !(pact.spec.reshape ?? []).includes(kind)) continue;
    rows.push({
      id: `pact:${pact.id}`,
      kind: 'pact',
      label: 'Reshape your pact-bound weapon',
      from: `${pact.talent.name} · ${pact.spec.weaponLabel}`,
      note: `It is a ${getItem(pact.weapon.base)?.name ?? pact.weapon.base} tonight. Any form in the codex, and the workings ride along.`,
      state: pact,
    });
  }

  /* ---- and what stood up in the night ----
     RAISE THE DEAD: "Whenever you take a Long Rest, you can use your Long Rest
     action to raise one undead over a fresh corpse." One a night, which is the
     designer's own limit ("only one undead at a time can be done") and is
     exactly what this slot already is: a rest buys one action, so the limit
     needed nothing of its own.

     Offered even with an Ossuary too full to take anything, because opening the
     menu is how a Necromancer reads their Marrow, and the note is what says how
     much is left. The step refuses each kind with its own reason. See
     undead.js. */
  for (const { state, offers } of undeadRaises(character, kind)) {
    rows.push({
      id: `raise:${state.id}`,
      kind: 'raise',
      label: state.spec.raising ?? `Raise ${plural(state.spec.noun, 1)}`,
      from: `${state.talent.name} · ${state.spec.label}`,
      note: marrowNote(state, offers),
      state,
      offers,
    });
  }

  /* ---- and the night spent sitting with a vow ----
     MEDITATION: "an ability which is to meditate during a Long Rest. It allows
     them to regain 10 Faith." One row per vow sworn, and none at all for an
     Oathbound who has not sworn one: there is nothing to sit with. The night
     still costs its own Faith, so the row says what it really nets. See
     oathbound.js. */
  for (const vow of oathState(held)) {
    if (kind !== 'long' || !canMeditate(vow)) continue;
    const gain = meditationGain(vow.spec);
    rows.push({
      id: `meditate:${vow.id}`,
      kind: 'meditate',
      label: vow.spec.meditate?.label ?? 'Meditate',
      from: `${vow.talent.name} · ${vow.oath.name}`,
      note: `${gain} ${vow.label} back, against the ${vow.decay} the night costs. A quiet week still climbs.`,
      state: vow,
    });
  }

  /* ---- and the ground a night consecrates ----
     CONSECRATION: "you can use your Long Rest action to consecrate the ground
     you rested on, up to the size of a single room." One at a time, which the
     slot already enforces, and consecrating a second place lets the first one
     go. Offered from the rank that opens it and at no short rest, because
     nothing about the card names one. See oathbound.js. */
  for (const vow of oathState(held)) {
    if (kind !== 'long' || !vow.sworn || !vow.consecrates) continue;
    const ground = vow.spec.sanctuary?.label ?? 'Sanctuary';
    rows.push({
      id: `sanctuary:${vow.id}`,
      kind: 'sanctuary',
      label: `Consecrate your ${ground}`,
      from: `${vow.talent.name} · ${vow.oath.name}`,
      note: vow.consecrated
        ? `${vow.sanctuary.name ?? 'Ground you already hold'} is yours tonight. Consecrating somewhere else lets it go.`
        : `One room, and everything you do inside it is rolled with advantage.`,
      state: vow,
    });
  }

  return rows;
}

/** "spell" / "spells". */
function plural(noun, count) {
  return count === 1 ? noun : `${noun}s`;
}

/** What a prepared hand is holding tonight, or what it is still short of. */
function prepareNote(state) {
  if (state.picks.length > 0) {
    return state.picks.map((pick) => pick.card?.name ?? pick.id).join(' · ');
  }
  return `Nothing prepared. This set knows ${state.known}.`;
}

/**
 * What tonight's research is about to do, which is the one line that decides
 * whether the player is adding or trading.
 *
 * A book with room says how much room. A full one says so plainly, because "your
 * spellbook holds 11" and "the next one costs you one you already have" are
 * different pieces of news and the second is the one worth reading twice. Null
 * for a hand, which has its own note.
 */
function researchNote(state, mode) {
  if (mode !== 'research') return null;

  /* The word for what the pool is holding, off the spec. An Arcanist's spells
     are written down and a Runebearer's runes are cut into them, and a rest
     window that said the second in the first's voice would read as somebody
     else's set. */
  const kept = state.spec.kept ?? 'written down';
  const held = state.picks.length;
  if (state.full) {
    return `Full at ${state.capacity}. Tonight's ${state.spec.noun} replaces one already there.`;
  }
  return `${held} of ${state.capacity} ${kept}. Tonight adds one more.`;
}


/**
 * Tonight's raising, read off the window's draft, or null for every night that
 * is not spending its action on one.
 *
 * The draft is `{ set, kind, name, portrait_url, corpse, spells, moves }`, which
 * is what the step collects. Everything about whether it is *allowed* is
 * undead.js's, asked here rather than trusted: a draft that names a kind above
 * the rank, or one the Ossuary cannot pay for, or one with a question still open,
 * is no raising at all and the rest goes ahead without it.
 *
 * `over` is the body this one is being raised out of, when its keeper chose their
 * own remains as the corpse. It leaves the column in the same patch.
 */
export function raisePlan(character, kind, raised) {
  if (!raised?.set || !raised?.kind) return null;

  const state = ossuary(character, raised.set);
  if (!state || !(state.spec.rests ?? ['long']).includes(kind)) return null;

  const offer = undeadOffers(state).find((row) => row.kind.id === raised.kind);
  if (!offer) return null;

  const draft = raiseDraft(state, offer, raised);
  if (!draft.ready) return null;

  const name = String(raised.name ?? '').trim().slice(0, 60);

  return {
    state,
    draft,
    name,
    portrait_url: raised.portrait_url ?? null,
    /* Which of their own the new body comes out of, or null. Settled by
       `raiseDraft`, which holds it to a body this Ossuary actually has and
       refuses the whole raising without one: a stale id off an earlier draft
       must never delete somebody else's creature, and it must not buy a free
       corpse either. */
    over: draft.corpse === 'remains' ? draft.over : null,
  };
}

/**
 * Whether one more thing could be laid, given that the rest itself is paid for
 * first and that everything already chosen in this window is paid for too. The
 * same law `labourAffordable` reads by: the choice you could never pay for is
 * offered dead rather than left to fail at the last button.
 */
export function layingAffordable(character, kind, prepared, enchantment) {
  const held = Math.max(0, Math.floor(Number(character?.supplies) || 0));
  const already = changeCost(enchantChanges(character?.talents, prepared ?? character?.talents));
  return held - restPrice(character, kind) - already - layingCost(enchantment) >= 0;
}

/**
 * What a rest is about to do, said in lines, and the one patch that does it.
 *
 * `labours` is what the player chose to do during it: `[{ card, amount, gain }]`,
 * already priced. They ride in the same patch and the same ledger as the rest
 * itself, so one rest is one write however much work was done in it.
 *
 * `prepared` is the whole `talents` value as the player has just re-prepared it
 * in the window — the hands a choosing set carries out of the camp. It rides in
 * the same patch for the same reason, so a rest that is cancelled or refused
 * leaves yesterday's spells exactly where they were.
 *
 * `brews` is what an Alchemist put in the still tonight: a list of recipe ids,
 * one per brew. It is the only long rest action whose output is a *thing* rather
 * than a rider or a hand, so it is the only one that writes the pack — and it
 * writes it in this same patch, so a rest backed out of leaves the components in
 * the crate and the flasks unmade.
 *
 * `revived` is the runes a Runebearer chose to bring back on a Short Rest, as
 * card ids. Chosen in the window rather than worked out here, because RECHARGED
 * is a budget spent against a list and every other thing a rest gives back is
 * automatic. See runes.js.
 *
 * `free` is a rest nobody paid for, and there is exactly one: LIFE TREE TEA
 * "gives you the benefit of a Long Rest. It costs no Supplies and it does not
 * spend your Long Rest action." The crate is untouched and no cost line is
 * printed, because a line saying 0 Supplies came out of the crate is a line about
 * nothing. Everything else a night does happens exactly as it does at a campfire.
 * See useTriggers.js.
 */
export function restPlan(
  character,
  kind,
  labours = [],
  prepared = null,
  brews = [],
  reshaped = null,
  {
    free = false,
    revived = [],
    raised = null,
    scribes = [],
    consecrated = null,
    meditated = null,
  } = {}
) {
  const rest = getRest(kind);
  if (!rest) return null;

  const lines = [];
  const patch = {};
  let ledger = character?.ledger;

  /* ---- supplies: the rest itself, then each piece of work ---- */
  let supplies = Math.max(0, Math.floor(Number(character?.supplies) || 0));

  /* Nothing here empties the crate to make itself fit. A rest you cannot pay
     for does not happen, so the balance is allowed to go negative while the
     plan is being built and the whole thing is refused if it ever does. */
  const held = supplies;
  let short = 0;

  const move = (delta, note) => {
    supplies += delta;
    if (supplies < 0) {
      short = Math.max(short, -supplies);
      return delta;
    }

    ledger = appendLedger(
      { ...character, ledger },
      {
        id: newLedgerId(),
        ts: new Date().toISOString(),
        kind: 'supplies',
        delta,
        note,
        balance: supplies,
      }
    );
    return delta;
  };

  const price = free ? 0 : restPrice(character, kind);
  const discount = restCut(character);
  const cut = rest.supplies - price;

  // A rest nobody paid for takes nothing out of the crate and says nothing
  // about it. See `free` in the note above.
  if (!free) {
    move(-price, rest.label);
    lines.push({
      key: 'cost',
      label: `${price} Supplies`,
      /* And what cut it, by name. A Pick is worked into something and a Frugal
         upbringing is on the Advancement tab, so neither is anywhere the reader
         can see from here. See restCut above. */
      detail:
        supplies < 0
          ? `The crate holds ${formatNumber(held)}. You cannot pay for this rest.`
          : cut > 0
            ? `Out of the crate. ${rest.supplies} less ${cut}, which is ${listOut(discount.names)}.`
            : 'Out of the crate.',
      tone: supplies >= 0 ? 'cost' : 'warn',
    });
  }

  for (const labour of labours) {
    const delta = labour.gain ? labour.amount : -labour.amount;
    const before = supplies;
    move(delta, labour.card.name);
    lines.push({
      key: `labour-${labour.card.id}-${labour.amount}`,
      label: `${labour.card.name}: ${delta > 0 ? '+' : ''}${delta} Supplies`,
      detail:
        supplies >= 0
          ? labour.gain
            ? 'Into the crate.'
            : 'Out of the crate.'
          : `Only ${formatNumber(Math.max(0, before))} left. This is beyond the crate.`,
      tone: supplies >= 0 ? (labour.gain ? 'gain' : 'cost') : 'warn',
    });
  }

  /* ---- what came off the still ----
     One line a recipe rather than one a flask: "Healing Draught x2: 20 Supplies"
     is what the crate actually pays and three identical rows is not. The count
     printed is the count of *flasks*, because that is what ends up in the pack.

     Priced off the character rather than off the draft for the same reason the
     rest itself is: nothing tonight can change the rank that opened the shelf. */
  const still = restAlchemy(character, kind);
  const brewing = normalizeBrews(brews, still);

  for (const row of brewRows(brewing, still)) {
    const before = supplies;
    move(-row.supplies, `${row.name}${row.brews > 1 ? ` x${row.brews}` : ''} brewed`);

    lines.push({
      key: `brewed-${row.id}`,
      label: `${row.name}${row.made > 1 ? ` x${row.made}` : ''}: ${row.supplies} Supplies`,
      detail:
        supplies >= 0
          ? still.batch > 1
            ? `Components out of the crate, at ${row.price} a brew. Your still fills ${still.batch} flasks off each one.`
            : 'Components out of the crate. The flask goes in your pack.'
          : `Only ${formatNumber(Math.max(0, before))} left. This is beyond the crate.`,
      tone: supplies >= 0 ? 'cost' : 'warn',
    });
  }

  /* ---- and what came off the desk ----
     One line a *leaf* rather than one a spell, which is the opposite of the
     still above and is right for the opposite reason: two Healing Draughts are
     interchangeable and two scrolls of Fireball with different words on them are
     not.

     Priced off the character rather than off the draft for the same reason the
     rest itself is: nothing tonight can change the rank that opened the shelf.

     The fading leaves had their own lines here until 2026-09-10. They are not
     written at a rest any more, so a night has nothing to say about them beyond
     sweeping up yesterday's. See scribing.js. */
  const desk = restScribing(character, kind);
  const scribing = normalizeScribes(scribes, desk);

  for (const row of scribeRows(scribing, desk)) {
    const before = supplies;
    move(-row.supplies, `${row.name} written`);

    lines.push({
      key: `scribed-${row.index}-${row.spell.id}`,
      label: `${row.name}: ${row.supplies} Supplies`,
      detail:
        supplies >= 0
          ? row.words.length > 0
            ? `${row.tier} Quartz out of the crate, and ${listOut(row.words.map((word) => word.name))} worked into the syntax.`
            : `${row.tier} Quartz out of the crate. The leaf goes in your pack.`
          : `Only ${formatNumber(Math.max(0, before))} left. This is beyond the crate.`,
      tone: supplies >= 0 ? 'cost' : 'warn',
    });
  }

  /* ---- and the corpse, if one had to be built ----
     "If he doesn't have a fresh corpse, making an undead costs a hundred
     Supplies." The largest single thing a rest can spend, so it is a line of its
     own with the reason on it rather than a hundred Supplies quietly missing from
     the crate. Priced here, among the supply movements, so a rest that cannot
     cover it is refused with everything else. The body itself is written further
     down, once the crate has agreed to it. See undead.js. */
  const raising = raisePlan(character, kind, raised);
  if (raising?.draft.supplies > 0) {
    const before = supplies;
    move(-raising.draft.supplies, `A corpse built for ${raising.name}`);

    lines.push({
      key: 'raise-supplies',
      label: `A corpse to work on: ${raising.draft.supplies} Supplies`,
      detail:
        supplies >= 0
          ? 'Out of the crate. There was no fresh body, so one is made.'
          : `Only ${formatNumber(Math.max(0, before))} left. This is beyond the crate.`,
      tone: supplies >= 0 ? 'cost' : 'warn',
    });
  }

  /* ---- what was laid while the fire burned down ----
     ENCHANTING is a Long Rest action ("whenever you take a Long Rest, you can use
     your Long Rest actions to enchant") and WIELDER OF WONDER is a Long Rest
     choice ("you can change it during a Long Rest"), so both belong here rather
     than on a control somewhere else on the sheet. Both write into the same
     `prepared` draft the spell swaps write into, which is why this reads it as a
     diff: one talents value, one patch, one ledger, and backing out of the rest
     backs out of the work. */
  if (prepared) {
    const changes = enchantChanges(character?.talents, prepared);

    for (const row of changes.laidAdded) {
      const enchantment = getEnchantment(row.id);
      const price = layingCost(enchantment);
      const before = supplies;
      move(-price, `${enchantment.name} laid on ${itemName(character, row.itemId)}`);

      lines.push({
        key: `laid-${row.itemId}-${row.id}`,
        label: `${enchantment.name}: ${price} Supplies`,
        detail:
          supplies >= 0
            ? `Worked into ${itemName(character, row.itemId)}, at ${SUPPLIES_PER_BURDEN} a point of Magic Burden.`
            : `Only ${formatNumber(Math.max(0, before))} left. This is beyond the crate.`,
        tone: supplies >= 0 ? 'cost' : 'warn',
      });
    }

    /* Taking one back off returns nothing: the supplies went into the work. */
    for (const row of changes.laidDropped) {
      lines.push({
        key: `stripped-${row.itemId}-${row.id}`,
        label: `${getEnchantment(row.id)?.name ?? row.id} stripped`,
        detail: `Off ${itemName(character, row.itemId)}. The Supplies it cost do not come back.`,
        tone: 'end',
      });
    }

    if (changes.wornAdded.length > 0 || changes.wornDropped.length > 0) {
      const said = [];
      if (changes.wornDropped.length > 0) {
        said.push(`${listOut(changes.wornDropped.map(enchantName))} taken off`);
      }
      if (changes.wornAdded.length > 0) {
        said.push(`${listOut(changes.wornAdded.map(enchantName))} put on`);
      }

      lines.push({
        key: 'worn',
        label: `On your own person: ${changes.wornAdded.length + changes.wornDropped.length} changed`,
        detail: `${said.join(', ')}. No Supplies: the card names none for changing what you wear.`,
        tone: 'gain',
      });
    }
  }

  const affordable = short === 0;

  // A refused rest writes nothing at all. The lines above still describe what
  // it *would* have done, which is what the window needs in order to say why.
  if (affordable) {
    patch.supplies = supplies;
    patch.ledger = ledger;
  }

  /* Everything below only happens if the crate covered it. A rest nobody can
     pay for restores nothing and ends nothing: it did not happen. */
  if (!affordable) {
    return { rest, lines, patch: {}, supplies: held, affordable, short };
  }

  /* ---- and what is in the pack that was not there last night ----
     The flasks themselves, appended rather than replacing, because the pack is
     the flat list of what is carried and two Healing Draughts are two entries in
     it. They land in the pack and not on the belt: a loop is a place you have
     chosen to put something, and choosing is what the Inventory tab is for. */
  const made = brewedItems(brewing, still);
  if (made.length > 0) {
    patch.pack = [...normalizePack(character?.pack), ...made];
  }

  /* ---- and what the ink did overnight ----
     Two writes in one place, because they are two halves of one clock and the
     order between them is load-bearing: **last night's fading scrolls go first,
     then tonight's are laid down.** A leaf written on one night and a leaf that
     expired on it must never be the same leaf, and sweeping after writing would
     take tonight's with it.

     "Ephemeral Spell Scrolls … expire at the start of your next long rest", so
     the sweep is every Long Rest, whatever the night was spent on and whether or
     not the character is still a Spellquill — a set handed back does not leave
     its fading scrolls behind forever. It reaches the pack, the belt, the
     trinkets and the worn slots, because a scroll can be clipped on. See
     `withoutScrolls`.

     The records themselves come off the forged shelf in the same patch, so
     nothing is left pointing at nothing. */
  const gone = kind === 'long' ? fadedScrolls(character) : [];
  const swept = gone.length > 0 ? withoutScrolls(character, gone) : null;
  if (swept) {
    Object.assign(patch, swept);
    /* The pack the brews were appended to is the one before the sweep, so it is
       rebuilt on top of the swept one rather than left holding an expired id. */
    if (made.length > 0) patch.pack = [...normalizePack(patch.pack), ...made];

    lines.push({
      key: 'faded-gone',
      label: `${gone.length} Ephemeral ${gone.length === 1 ? 'scroll' : 'scrolls'} fade`,
      detail: 'The ink was never meant to last the night. Nothing is left of them.',
      tone: 'end',
    });
  }

  const written = scribedRecords(scribing, desk);
  if (written.length > 0 || swept) {
    const shelf = { ...normalizeForged(character?.forged) };
    for (const id of gone) delete shelf[id];
    for (const record of written) shelf[record.id] = record;
    patch.forged = shelf;
  }
  if (written.length > 0) {
    /* Into the pack and not onto the belt, exactly as a flask is: a loop is a
       place you have chosen to put something, and choosing is what the Inventory
       tab is for. */
    patch.pack = [...normalizePack(patch.pack ?? character?.pack), ...written.map((row) => row.id)];
  }

  /* ---- health ----
     A Long Rest gives all of it back and a Short Rest half your maximum, for
     everybody except an Undead. UNDEATH RESILIENCE is the only card in the codex
     that makes a rest *worse*: "Short Rests no longer restore Health, and Long
     Rests only let you regain half your maximum Health." Read off the cards they
     hold rather than off the ancestry, so a card taken away takes its clause with
     it, and named on the line so a rest that mended half of what it used to says
     which card did that. See restHealth in grants.js. */
  const healthMax = Math.max(0, Math.floor(Number(character?.health_max) || 0));
  const health = Math.floor(Number(character?.health) || 0);
  const rows = grantRows(character);
  const gives = restHealth(rows)[kind === 'long' ? 'long' : 'short'];
  const half = clamp(health + Math.floor(healthMax / 2), health, healthMax);
  const backTo = gives === 'full' ? healthMax : gives === 'half' ? half : health;

  if (backTo !== health) {
    patch.health = backTo;
    lines.push({
      key: 'health',
      label: `Health ${health} to ${backTo}`,
      detail: restHealthDetail(gives, rows, kind),
      tone: 'gain',
    });
  }

  /* ---- whatever else is on the board with you ----
     A creature a talent set put there is restored by whichever rest its spec
     names, and for a draconic ally that is the long one: ONE AND THE SAME says
     an ally that would die "retreats into your shadow and is unable to reemerge
     until you take a Long Rest", so this is the only thing on the sheet that
     brings it back. Health full and Action Points full, the same two the rest
     gives its bonded, and the window prints a line per creature so nobody has
     to notice it happened.

     A creature's own tracker is ended by the same rest that ends its bonded's,
     so which durations this rest closes goes down with the call — the creature
     has no rest of its own to take. */
  const creatures = minionRest(character, kind, (effect) => restEnds(rest, effect));
  if (creatures) {
    Object.assign(patch, creatures.patch);
    lines.push(...creatures.lines);
  }

  /* ---- and what shape you are in ----
     FERAL FORM: "You remain in your Feral Form until all Shield is gone or you
     take a Short Rest." So a rest is one of the two things that takes the hide
     off, and it takes the Shield with it, exactly as the button on the block
     does — the Shield *was* the form. Which duration a form belongs to is on its
     own spec, and `rest.ends` is the same list the tracker above is closed
     against, so a long rest ends a short-rest form and never the other way
     round. See feral.js. */
  const shapes = feralRest(character, kind, rest.ends);
  if (shapes) {
    Object.assign(patch, shapes.patch);
    lines.push(...shapes.lines);
  }

  /* ---- shield: gone by morning ----
     Shield is not a pool you own, it is soak somebody put on you: a working, a
     ward, a hide, a lodging you paid for at the start of the day. None of that
     is still standing eight hours later, so a long rest takes whatever is left
     of it down to nothing.

     A short rest leaves it. An hour off your feet binds a wound, and the ward is
     still up when you stand.

     Read after the hide comes off above, and only when that did not already
     empty the pool: FERAL FORM's Shield *was* the form, `feralRest` says so in
     its own line, and "the hide comes off, and 9 Shield with it" followed by
     "Shield 9 to 0" is the same sentence twice. */
  if (kind === 'long' && patch.shield === undefined) {
    const shield = Math.max(0, Math.floor(Number(character?.shield) || 0));
    if (shield > 0) {
      patch.shield = 0;
      lines.push({
        key: 'shield',
        label: `Shield ${shield} to 0`,
        detail: 'Nothing you were soaking with lasts the night.',
        tone: 'end',
      });
    }
  }

  /* ---- willpower: a long rest only, which is what the glossary says ---- */
  if (kind === 'long') {
    const wpMax = Math.max(0, Math.floor(Number(character?.willpower_max) || 0));
    const wp = Math.floor(Number(character?.willpower) || 0);

    /* And what the night's writing kept back. A Power Word is paid for by the
       scribe at the moment of writing, and the writing happens inside the very
       rest that refills the pool — which would make it a price nobody pays. So
       it comes off **the refill**: a night that spent nine on Power Words wakes
       at maximum less nine.

       That is the sheet's own price in the sheet's own currency, and it is the
       reading the Necromancer's bodies already have.

       The desk's words only. A word worked into a fading leaf is charged where
       that leaf is written, which is out in the field and out of the pool, so it
       has already been paid for by the time this button is pressed. See
       scribing.js. */
    const ink = scribingWillpower(scribing, desk);
    const back = Math.max(0, wpMax - ink);

    if (wp !== back) {
      patch.willpower = back;
      lines.push({
        key: 'willpower',
        label: `Willpower ${wp} to ${back}`,
        detail:
          ink > 0
            ? `Willpower comes back on a long rest, less the ${ink} the Power Words took to write.`
            : 'Willpower comes back on a long rest.',
        tone: ink > 0 ? 'cost' : 'gain',
      });
    }
  }

  /* ---- and what is back on your belt ----
     An item that limits itself names what fills it again: the Druidic Tome "has
     nothing more to say until you have taken a Long Rest", the Terra Cotta Disk
     "stays cold until its bearer has slept". Both of those are this button, so
     the use comes back with the pools above rather than being tapped back on by
     hand afterwards.

     `rest.ends` is the same list the effects below are closed against, so a long
     rest fills a short-rest item and a short rest leaves a long-rest one cold.
     See `beltRest` in items.js. */
  const belt = beltRest(character, rest.ends);
  if (belt) {
    Object.assign(patch, belt.patch);
    lines.push(...belt.lines);
  }

  /* ---- and what you can do again ----
     The same law one row down. A card that says you must rest before using it
     again has spent a use, and the rest it names is what gives it back: SPROUT
     WINGS, LIVING FURNACE, CANNIBALISM, and the two enchantments that fire once
     when you go down. Read against the same `ends` list as everything above, so a
     long rest fills a short-rest card and a short rest leaves a long-rest one
     spent. See uses.js. */
  const again = usesRest(character, rest.ends);
  if (again) {
    Object.assign(patch, again.patch);
    lines.push(...again.lines);
  }

  /* ---- and the runes a Runebearer chose to light again ----
     RECHARGED: "you can bring back up to 4 of your fired runes." A budget spent
     against a list, so unlike everything above it this one is a *choice* and
     arrives from the window rather than being worked out here. What arrives is
     the runes' own keys, since a slate may hold the same spell twice.

     Read off whatever the line above already wrote rather than off the
     character, because both write the same column: on a Long Rest `usesRest`
     has just emptied it and there is nothing left to bring back, and on a Short
     Rest it has cleared the short-rest cards and left the runes exactly where
     they were. Either way this is the second edit of one map and not a second
     map. See runes.js. */
  const lit = reviveRunes({ ...character, card_uses: patch.card_uses ?? character?.card_uses }, revived);
  if (lit) {
    Object.assign(patch, lit.patch);
    lines.push(...lit.lines);
  }

  /* ---- what was re-prepared while the fire burned down ---- */
  if (prepared) {
    const changes = pickChanges(character?.talents, prepared);

    /* One draft, two kinds of change written into it. The column is written when
       *either* moved: a rest where the only work was laying an enchantment still
       has to save the enchantment. The lines for that half were printed further
       up, with the Supplies they cost. */
    if (changes.length > 0 || enchantChanges(character?.talents, prepared).any) {
      patch.talents = prepared;
    }

    if (changes.length > 0) {
      for (const change of changes) {
        const said = [];
        if (change.dropped.length > 0) said.push(`${listOut(change.dropped)} put down`);
        if (change.learned.length > 0) said.push(`${listOut(change.learned)} taken up`);
        const moved = Math.max(change.dropped.length, change.learned.length);

        lines.push({
          key: `prepared-${change.talent.id}`,
          label: `${change.spec.label}: ${moved} changed`,
          detail: `${said.join(', ')}.`,
          tone: 'gain',
        });
      }
    }
  }

  /* ---- and what shape the entity's weapon wakes up in ----
     `reshaped` is the weapon id the window's step chose, or null for a night
     the slot was spent elsewhere. No Supplies move: the card prices the change
     at the night's one action and nothing else. The record and the pact row
     move in this same patch, so a rest backed out of leaves the blade as it
     was. */
  if (reshaped) {
    for (const pact of pactState(character)) {
      if (!pact.weapon || !(pact.spec.reshape ?? []).includes(kind)) continue;
      const weapon = getItem(reshaped);
      if (!weapon || weapon.id === pact.weapon.base) continue;

      const record = reshapePactWeapon(pact, weapon);
      if (!record) continue;

      /* Merged onto whatever the shelf is *in this patch* rather than onto the
         character's own, because a night can touch it twice: a Spellquill's
         fading scrolls are not the Long Rest action, so the same rest can sweep
         a scroll, write two more and reshape a blade. Read from the character
         here and the last writer would win and the others would vanish. */
      patch.forged = { ...(patch.forged ?? normalizeForged(character?.forged)), [record.id]: record };
      Object.assign(patch, writePactForm(character, pact, weapon));
      lines.push({
        key: `pact-${pact.id}`,
        label: `${pact.spec.weaponLabel} reshaped`,
        detail: `Into a ${weapon.name}. Its workings ride along, and it keeps its place in your hand.`,
        tone: 'gain',
      });

      // One slot, one action: the first pact with a weapon takes the night.
      break;
    }
  }

  /* ---- and what stood up over the fire ----
     The body, written last of the choices because it is the only one that adds a
     row rather than changing one, and because two of its three lines are about
     what the row *costs*: the Marrow is spent by the row existing and the
     Willpower comes off the maximum on the very next render. Neither is written
     anywhere. See "no column of its own" in undead.js.

     A body raised out of its own remains takes the wreck with it. That is what
     DEEPER GRAVES buys, and it is why the two writes are one: raising over a
     corpse that is still on your sheet has to clear it, or the Marrow it was
     holding is never given back. */
  if (raising) {
    const { state, draft, name, portrait_url, over } = raising;

    if (over) Object.assign(patch, dropMinion({ ...character, minions: patch.minions ?? character?.minions }, over) ?? {});

    const { patch: body } = addMinion(
      { ...character, minions: patch.minions ?? character?.minions },
      state.id,
      draft.kind.id,
      raiseBody(draft, { name, portrait_url })
    );
    Object.assign(patch, body);
    lines.push(...raiseLines(state, draft, name));
  }

  /* ---- and what the night cost your vow ----
     THE OATH: "taking a Long Rest always gives you minus five to that score."
     Always, and that is the word: nothing about the night earns it back and
     nothing about the night can refuse it. Keeping a vow is a thing you do
     between rests. See faithRest in oathbound.js. */
  const faith = faithRest(character, kind);
  if (faith) {
    Object.assign(patch, faith.patch);
    lines.push(...faith.lines);
  }

  /* ---- and what sitting with the vow gave back ----
     Written after the night's own toll and onto the column that toll just wrote,
     so a meditating night reads as two lines and one net: "Faith 40 to 35" and
     then "Faith 35 to 45". Both are real and both are worth seeing. */
  if (meditated) {
    for (const vow of oathState(character)) {
      if (vow.id !== meditated || !canMeditate(vow)) continue;
      const written = meditate({ ...character, oath: patch.oath ?? character?.oath }, vow);
      if (!written) continue;

      const before = normalizeOath(patch.oath ?? character?.oath)[vow.id]?.faith ?? vow.faith;
      const after = normalizeOath(written.oath)[vow.id]?.faith ?? before;

      Object.assign(patch, written);
      lines.push({
        key: `meditate-${vow.id}`,
        label: `${vow.label} ${before} to ${after}`,
        detail: `A night sitting with ${vow.oath.name}, going back over what you have done.`,
        tone: 'gain',
      });
      break;
    }
  }

  /* ---- and the ground the night made yours ----
     `consecrated` is what the window's step named the place, or null for a
     night the slot went elsewhere. No Supplies move: the card prices it at the
     night's one action and nothing else. Written onto whatever the Faith above
     already put in this patch rather than onto the character's own column, so
     one night can both lose 5 Faith and consecrate a room. */
  if (consecrated) {
    for (const vow of oathState(character)) {
      if (vow.id !== consecrated.set || !vow.consecrates) continue;
      const written = consecrate({ ...character, oath: patch.oath ?? character?.oath }, vow, consecrated);
      if (!written) continue;

      Object.assign(patch, written);
      lines.push({
        key: `sanctuary-${vow.id}`,
        label: `${vow.spec.sanctuary?.label ?? 'Sanctuary'} consecrated`,
        detail: vow.greater
          ? `${consecrated.name}. It is a space of its own now, and holding it costs ${vow.spec.sanctuary?.willpower ?? 0} of your maximum Willpower.`
          : `${consecrated.name}. Everything you do inside it is rolled with advantage.`,
        tone: 'gain',
      });
      break;
    }
  }

  /* ---- what the rest ends ----
     Two ways one ends, and `restEnds` is both of them: the row names this rest,
     or this rest is simply longer than the row had left. See it for the whole of
     why the second one exists. */
  const effects = normalizeEffects(character?.effects);
  const ending = effects.filter((effect) => restEnds(rest, effect));

  if (ending.length > 0) {
    patch.effects = effects.filter((effect) => !ending.includes(effect));
    lines.push({
      key: 'ends',
      label: `${ending.length} ${ending.length === 1 ? 'effect ends' : 'effects end'}`,
      detail: ending.map((effect) => effect.name).join(', '),
      tone: 'end',
    });
  }

  /* And what sits through it. Only what this rest could not reach and a long one
     can: a row counted in turns is over either way, so it is never listed here
     as something a long rest is still owed. */
  const kept = effects.filter(
    (effect) => !ending.includes(effect) && kind === 'short' && restEnds(RESTS.long, effect)
  );
  if (kept.length > 0) {
    lines.push({
      key: 'kept',
      label: `${kept.length} ${kept.length === 1 ? 'effect sits' : 'effects sit'} through it`,
      detail: `${kept.map((effect) => effect.name).join(', ')}. Only a long rest ends those.`,
      tone: 'keep',
    });
  }

  return { rest, lines, patch, supplies, affordable, short };
}

/**
 * Whether one piece of camp work is within reach, given that the rest itself
 * is paid for first. The chip that would overdraw the crate is offered dead
 * rather than left to fail at the last button.
 */
export function labourAffordable(character, kind, option) {
  if (option.gain) return true;
  const held = Math.max(0, Math.floor(Number(character?.supplies) || 0));
  return held - restPrice(character, kind) - option.amount >= 0;
}

/**
 * And whether one more flask could go in the still, with the rest itself and
 * everything already in the still paid for first.
 *
 * The third of the same shape, and the one place the price of a rest crosses into
 * alchemy.js — which may not import this file, so the number goes down with the
 * call rather than being looked up there.
 */
export function brewingAffordable(character, kind, brews, state, item) {
  return brewAffordable(character, restPrice(character, kind), brews, state, item);
}

/**
 * And whether one more leaf could go on the desk, with the rest itself and
 * everything already on it paid for first.
 *
 * The fourth of the same shape, and the second place the price of a rest crosses
 * into a file that may not import this one. See `brewingAffordable`.
 */
export function scribingAffordable(character, kind, draft, state, card) {
  return scribeAffordable(character, restPrice(character, kind), draft, state, card);
}
