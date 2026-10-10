/**
 * The weave: magic held in whatever you are holding, and let go on the hit.
 *
 * The eleventh shape of what a talent set can hand over, beside a fixed hand, a
 * `loadout`, a `brewing` spec, an `enchanting` one, a `minion`, the Trickster's
 * `tricks`, the Duelist's `martial`, the Feral Curse's `feral`, the Pact's
 * `pact`, the Runebearer's `runes` and the Spellblade's `blade`. The weaves are
 * an ordinary loadout, chosen out of the codex and stored as picks the way a
 * Mycomancer's hand is, and everything that is *not* ordinary about them is in
 * this file.
 *
 * ------------------------------------------------------------------ four things
 *   the empowerment  WOVEN STEEL and TAUT WEAVE. Every weapon a Weaver holds is
 *                    a magic weapon, and from Adept its damage is Empowered.
 *                    Folded into `attackModifiers` in moves.js beside the
 *                    Colossus's grip, the Pact's weapon and the Spellblade's
 *                    bond.
 *   the release      UNRAVEL. A learned weave may be added to any Weapon Attack,
 *                    in the attack's own use prompt, exactly the way a Martial
 *                    Move is. Nothing waits on a tracker and nothing is paid for
 *                    a swing that never happens.
 *   the price        the weave's own printed Willpower, less what a Master takes
 *                    off. No surcharge and no rate: a weave costs no Action
 *                    Points to begin with, so there is nothing to convert.
 *   no other way     a Weaver's weaves are released through a hit and nothing
 *                    else, so they are kept off the quick bar the way a Martial
 *                    Move is. `ridesHit` is what says so.
 *
 * Same split minions.js, feral.js, pact.js, runes.js and spellblade.js keep: the
 * `weave` spec on the set in talents.js says what THIS set's weaving is made of,
 * and this file knows what a weave IS. talents.js stays a leaf.
 *
 * -------------------------------------------------------- nothing is stored
 * **No column of its own and no tracker row either**, which makes this the
 * cheapest of the eleven shapes to have added. A Spellblade's bond had to be
 * remembered because it names one weapon and lasts until a rest; a Weaver names
 * no weapon at all. Every weapon they hold is woven, always, for as long as they
 * hold the set — so there is nothing to write down, nothing to migrate and
 * nothing to end at a rest. What a weave *does* is resolved inside the swing
 * that released it and is over before the dialog closes.
 *
 * That is also why `weaveRiders` below is not narrowed to a weapon the way
 * `bladeRiders` and `pactWeaponRiders` are: a stowed bow opened from the
 * Inventory tab really is Empowered in a Weaver's hands, because picking it up is
 * all it would take. The card says "any weapon you hold" and this is that
 * sentence with no exception bolted onto it.
 *
 * ------------------------------------------------------------------- imports
 * moves.js imports this file, so this file may not import moves.js, items.js or
 * characterModel.js (all three sit above it). It needs nothing from the item
 * world at all, which is the other saving of naming no weapon.
 */

import { sourceRow } from './attribution.js';
import { heldPicks, loadoutModifiers, loadoutOf } from './loadouts.js';
import { getCard } from './weapons.js';
import { getTalent, normalizeTalents } from './talents.js';
import { isWeaponAttack } from './tricks.js';

/* ------------------------------------------------------------ the spec reads */

/** The weave spec on a set, or null. Accepts an id or the talent itself. */
export function weaveOf(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return set?.weave ?? null;
}

/**
 * Every held set that weaves: `[{ talent, spec, entry }]`.
 *
 * A set with a `weave` spec and no `loadout` would be a release with nothing to
 * release, so both are required and a set carrying one without the other is
 * simply not a weaving set. Same pairing `bladeSets` requires.
 */
export function weaveSets(talents) {
  return normalizeTalents(talents)
    .map((entry) => {
      const talent = getTalent(entry.id);
      const spec = weaveOf(talent);
      return talent && spec && loadoutOf(talent) ? { talent, spec, entry } : null;
    })
    .filter(Boolean);
}

/** A rank's reading of a rank-indexed field, floored at zero. */
function atRank(list, rank) {
  return Math.max(0, Math.floor(Number(Array.isArray(list) ? list[rank] : 0) || 0));
}

/* ----------------------------------------------------------------- the state */

/**
 * Every weaving this character holds, one per set.
 *
 * Nothing here is read off a column, because nothing is stored: a rank and a
 * spec are the whole of it. The three numbers a rank decides are resolved once
 * so the block, the prompt and the card all read the same ones, which is the one
 * thing `bladeState` is really for as well.
 */
export function weaveState(character) {
  return weaveSets(character?.talents).map(({ talent, spec, entry }) => {
    const rank = Math.max(0, Math.floor(Number(entry.rank) || 0));

    return {
      id: talent.id,
      talent,
      spec,
      rank,
      pool: loadoutOf(talent),
      /* TAUT WEAVE, UNRAVEL and DOUBLE WEAVE, in that order. */
      empower: atRank(spec.empower, rank),
      weaves: atRank(spec.weaves, rank),
      cut: atRank(spec.cut, rank),
    };
  });
}

/* ---------------------------------------------------------------- the swing */

/**
 * What holding a weapon as a Weaver is worth, folded into `attackModifiers` in
 * moves.js beside the pact's weapon, the Colossus's grip and the bond.
 *
 * One thing rides, and it is one clause of one card: TAUT WEAVE's Empowered die
 * from Adept onward. WOVEN STEEL's "magic weapon" rides nothing, because there
 * is no magic-weapon flag in this codex and inventing one to satisfy one card
 * would be a rule with one holder — the same reading BOUND EDGE's identical
 * phrase already took. The words stay on the card and the table reads them.
 *
 * Not narrowed to a card or to a hand, unlike every other rider folded beside
 * it. See "nothing is stored" above: the set names no weapon, so every weapon
 * attack a Weaver could ever make carries this, and a stowed weapon printing it
 * is the truth rather than a leak.
 *
 * Null for everybody who holds no weaving set and for every rank below Adept, so
 * the fold above can ask this of every card and get nothing almost every time.
 */
export function weaveRiders(character, card) {
  if (card && !isWeaponAttack(card)) return null;

  for (const state of weaveState(character)) {
    if (state.empower < 1) continue;

    return {
      empower: state.empower,
      from: state.talent.name,
      /* Itemised for the list under the pay button, named after the card that
         moved the number rather than after the set, which is what every other
         rider's source row does: the card is what a reader can look up. */
      sources: [sourceRow(state.spec.from ?? state.talent.name, { empower: state.empower })].filter(
        Boolean
      ),
    };
  }
  return null;
}

/**
 * What one weave costs to release on a swing, in Willpower.
 *
 * Its printed number, less DOUBLE WEAVE's point at Master. There is no
 * surcharge and no rate: a weave is written with `ap: null` because the attack
 * bought the action, so unlike a carried spell there is nothing to convert. See
 * "the price" in weaves.js.
 *
 * Floored at nothing, so the Master's cut can make a Novice weave free and never
 * a credit. No floor at 1, for the reason the Spellblade's cut has none: a
 * Novice effect costing nothing at Master is the rung doing what the rung is
 * for.
 *
 * `printed` is what the card prints, for the orb that shows the old number
 * struck through beside the new one wherever the two differ.
 */
export function weavePrice(state, card) {
  const printed = Math.max(0, Math.floor(Number(card?.wp_cost ?? card?.wp) || 0));
  const cut = Math.max(0, Math.floor(Number(state?.cut) || 0));

  return { wp: Math.max(0, printed - cut), printed, cut };
}

/**
 * The weaves that may be released on *this* card, right now, in the order they
 * were learned.
 *
 * Two questions, where the Spellblade's list asks three:
 *
 *   is this a Weapon Attack   UNRAVEL says "a Weapon Attack", which is the
 *                             broad reading of the glossary: either of the two
 *                             attacks the weapon in your hands teaches. No
 *                             weapon is named and no rank narrows it, which is
 *                             the whole difference between this set and the
 *                             Spellblade.
 *   is the weave held         a rank lost or a codex that dropped a card can
 *                             leave a pick behind, and `getCard` returning
 *                             nothing is what drops it here.
 *
 * Empty for every card that is not a weapon attack and for everybody who holds
 * no weaving set, so the prompt can ask this of every use and draw nothing almost
 * every time. Same contract `offeredMoves` and `offeredSpells` keep.
 */
export function offeredWeaves(character, card) {
  if (!isWeaponAttack(card)) return [];

  const rows = [];
  for (const state of weaveState(character)) {
    if (state.weaves < 1) continue;

    const modifiers = loadoutModifiers(state.pool, state.rank);
    for (const id of heldPicks(character?.talents, state.talent.id)) {
      const weave = getCard(id);
      if (!weave) continue;
      rows.push({ id, card: weave, state, modifiers, price: weavePrice(state, weave) });
    }
  }

  return rows;
}

/** How many weaves may be released on one swing, across every weaving set held. */
export function weaveAllowance(character) {
  return weaveState(character).reduce((most, state) => Math.max(most, state.weaves), 0);
}

/**
 * What the released weaves add to the price of the swing, in Willpower.
 *
 * One number, because a released weave costs nothing else: it has no Action
 * Points of its own and it lays no charge. Same shape `moveCost` and
 * `strikeCost` hand back, and the same caller.
 */
export function weaveCost(rows = []) {
  return rows.reduce((sum, row) => sum + Math.max(0, Number(row?.price?.wp) || 0), 0);
}

/**
 * The picks, clamped to what a swing may release, by their place in the list.
 *
 * By place and not by card id, exactly as the Martial Moves and the bound spells
 * are: two weaving sets could learn the same weave and both were paid for, so
 * two rows can wear one id and ticking either has to tick exactly one. Clamped on
 * read rather than trimmed by an effect, so a rank lost while the dialog is open
 * quietly releases the second weave without a state write racing the render.
 */
export function clampWeaves(list, offered, allowed) {
  const room = Math.max(0, Math.floor(Number(allowed) || 0));
  const seen = [];
  for (const at of list ?? []) {
    if (!offered?.[at] || seen.includes(at)) continue;
    if (seen.length >= room) break;
    seen.push(at);
  }
  return seen;
}

/**
 * Whether this card is a weave, and therefore not something you play.
 *
 * A weave is released through a hit and no other way, so a chip on the quick bar
 * would be a way to spend Willpower on nothing. The Abilities tab is where the
 * hand is read and the attack's own prompt is where one is used, which is exactly
 * what became true of a Martial Move on 2026-09-02 and of a bound spell on
 * 2026-09-09.
 *
 * Asked of the card alone, where `ridesStrike` has to be asked of the character:
 * a bound spell is an ordinary spell that somebody else can cast the ordinary
 * way, and a weave is not a card anybody can hold by any other route. There is
 * nothing to except, so there is no character to ask about.
 */
export function ridesHit(card) {
  return card?.kind === 'weave';
}
