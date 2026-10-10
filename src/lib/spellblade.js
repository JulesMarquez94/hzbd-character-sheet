/**
 * The bond: a weapon touched once, and every spell that then rides it in.
 *
 * The tenth shape of what a talent set can hand over, beside a fixed hand, a
 * `loadout`, a `brewing` spec, an `enchanting` one, a `minion`, the Trickster's
 * `tricks`, the Duelist's `martial`, the Feral Curse's `feral`, the Pact's
 * `pact` and the Runebearer's `runes`. The spells are an ordinary loadout,
 * chosen out of the codex and stored as picks the way a Mycomancer's hand is,
 * and everything that is *not* ordinary about them is in this file.
 *
 * Four things, and they are the whole set:
 *
 *   the bond     BOUND EDGE. A weapon you touch is yours until the next Long
 *                Rest: it swings off your Mind, its damage type becomes one of
 *                three elemental ones, and at Adept it is Empowered. All three
 *                land through `bladeRiders`, folded into `attackModifiers` in
 *                moves.js beside the Colossus's grip and the Pact's weapon.
 *   the ride     POINT OF IMPACT. A prepared spell may be added to an attack
 *                made with that weapon, in the attack's own use prompt, exactly
 *                the way a Martial Move is. Nothing waits on a tracker and
 *                nothing is paid for a swing that never happens.
 *   the price    the spell's own Willpower, plus 1 for every 2 Action Points it
 *                costs, less what a Master takes off. Its Action Points are
 *                never paid: the attack's were.
 *   no other way a Spellblade's spells are cast on a strike and on nothing
 *                else, so they are kept off the quick bar the way a Martial
 *                Move is. `ridesStrike` is what says so.
 *
 * Same split as minions.js, feral.js, pact.js and runes.js: the `blade` spec on
 * the set in talents.js says what THIS bond is made of, and this file knows what
 * a bond IS. talents.js stays a leaf.
 *
 * ------------------------------------------------------------------ storage
 * **No column of its own.** A bond is one row on the effects tracker carrying a
 * `blade` payload, which is the fifth mechanical rider a row can hold beside an
 * Ephemeral Enchantment, a Trickster's rider, a Martial Move and a condition.
 * The payload is two strings, the weapon and the damage type, and everything
 * else about the row is what the tracker already does: `until: 'long'` is what
 * ends it, `card` is what deals the card behind it, and dropping the row is what
 * releases the weapon. So this set needed no migration either.
 *
 * One consequence worth knowing: a bond can be taken off from the tracker like
 * any other row, and it should be. "Binding a weapon releases the one you had
 * bound before" is `bindPatch` doing exactly that, and a player who wants their
 * sword back without spending an evening drops the row.
 *
 * ------------------------------------------------------------------- imports
 * moves.js imports this file, so this file may not import moves.js, items.js or
 * characterModel.js (all three sit above it). It reads the `effects` and
 * `equipment` columns directly, with its own small repair, exactly as pact.js
 * reads the equipment map: what it needs from the item world comes through
 * forged.js, which is a leaf.
 */

import { sourceRow } from './attribution.js';
import { normalizeForged } from './forged.js';
import { heldPicks, loadoutModifiers, loadoutOf } from './loadouts.js';
import { WEAPONS, getCard } from './weapons.js';
import { getTalent, normalizeTalents } from './talents.js';

/* ------------------------------------------------------------ the spec reads */

/** The blade spec on a set, or null. Accepts an id or the talent itself. */
export function bladeOf(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return set?.blade ?? null;
}

/**
 * Every held set that binds a weapon: `[{ talent, spec, entry }]`.
 *
 * A set with a `blade` spec and no `loadout` would be a bond with nothing to
 * carry, so both are required and a set carrying one without the other is simply
 * not a blade set.
 */
export function bladeSets(talents) {
  return normalizeTalents(talents)
    .map((entry) => {
      const talent = getTalent(entry.id);
      const spec = bladeOf(talent);
      return talent && spec && loadoutOf(talent) ? { talent, spec, entry } : null;
    })
    .filter(Boolean);
}

/** A rank's reading of a rank-indexed field, floored at zero. */
function atRank(list, rank) {
  return Math.max(0, Math.floor(Number(Array.isArray(list) ? list[rank] : 0) || 0));
}

/* --------------------------------------------------------------- the payload */

/**
 * The `blade` payload on one tracker row, cleaned, or null.
 *
 * Two strings and nothing else survives: an effects list is stored jsonb and a
 * row that could carry arbitrary shapes into the card renderer is a row that can
 * print anything. Same law `normalizeTrick` and `normalizeMove` are written to,
 * and combatTurn.js is what calls this on the way in.
 *
 *   `item`   the id in the weapon slot when the bond was made. A codex id or a
 *            forged one, which is what an equipment slot holds either way.
 *   `base`   the codex weapon that id resolves to, stored beside it so the
 *            attacks it teaches can be found without reaching for items.js. A
 *            codex weapon is its own base.
 *   `damage` one of the spec's three, checked against the codex's own table
 *            rather than against a list here, so a type the codex drops stops
 *            being bindable rather than printing a colour nothing knows.
 */
export function normalizeBlade(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const item = String(raw.item ?? '').slice(0, 60);
  const base = String(raw.base ?? '').slice(0, 60);
  const damage = String(raw.damage ?? '').slice(0, 20);
  if (!item || !damage) return null;

  /* The base has to still be a weapon in this build's codex. Without one there
     is no list of attacks for the bond to ride, so the row would grant a Mind
     swap on every swing the character makes. */
  const weapon = WEAPONS.find((row) => row.id === (base || item));
  if (!weapon) return null;

  return { item, base: weapon.id, damage };
}

/**
 * The codex weapon an equipped id resolves to, or null.
 *
 * A slot holds either a codex id or a forged one. Read without items.js, the way
 * pact.js reads the equipment map: a forged record names the base it was made
 * from, and a codex id is its own base.
 */
export function baseWeaponOf(character, id) {
  if (!id) return null;
  const direct = WEAPONS.find((row) => row.id === id);
  if (direct) return direct;

  const record = normalizeForged(character?.forged)[id];
  return record ? WEAPONS.find((row) => row.id === record.base) ?? null : null;
}

/** The equipment map, read gently and without items.js. Same reader pact.js keeps. */
function readEquipment(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  return source && typeof source === 'object' && !Array.isArray(source) ? source : {};
}

/**
 * The `effects` column, read rather than trusted.
 *
 * Deliberately not `normalizeEffects` from combatTurn.js: that file calls
 * `normalizeBlade` above, so importing it here would be a circle. All this needs
 * is the rows carrying a bond, so the repair is the payload's own and everything
 * else on the row is read as it lies. Same trade runes.js makes with `card_uses`.
 */
function bondRows(character) {
  let list = character?.effects;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = null;
    }
  }
  if (!Array.isArray(list)) return [];

  return list
    .map((raw) => {
      const blade = raw && typeof raw === 'object' ? normalizeBlade(raw.blade) : null;
      return blade ? { id: String(raw.id ?? ''), card: raw.card ?? null, blade } : null;
    })
    .filter(Boolean);
}

/* ----------------------------------------------------------------- the state */

/**
 * Every bond this character could hold, one per set, whether or not a weapon is
 * bound right now.
 *
 * The block draws off this and so does the swing, which is why an unbound set
 * still comes back: an empty block that says what binding would cost is the
 * thing a Spellblade opens the tab to read. `bond` is null until a weapon is
 * touched.
 *
 * `card_uses` is not in it and neither is a count. A bond is not spent, it is
 * replaced or dropped.
 */
export function bladeState(character) {
  const rows = bondRows(character);

  return bladeSets(character?.talents).map(({ talent, spec, entry }) => {
    const rank = Math.max(0, Math.floor(Number(entry.rank) || 0));
    const pool = loadoutOf(talent);

    /* The row this set laid, matched on the card it was laid from. A sheet with
       two blade sets on it would keep two bonds, one weapon each, which is what
       the same-source law gives: two cards are two sources. */
    const card = talent.cards.find((one) => one.opens === 'blade') ?? null;
    const row = rows.find((one) => one.card === card?.id) ?? null;

    const weapon = row ? WEAPONS.find((one) => one.id === row.blade.base) ?? null : null;
    /* And what it is actually called, which for a forged instance is the name its
       maker gave it rather than the codex form underneath. Read off the forge
       record and never off items.js, which sits above this file: a piece with no
       name of its own falls back to the base's, which is still true and still
       readable. */
    const named = row
      ? normalizeForged(character?.forged)[row.blade.item]?.name ?? weapon?.name ?? row.blade.item
      : null;

    return {
      id: talent.id,
      talent,
      spec,
      rank,
      pool,
      /* What is bound, or null. `drawn` is whether it is the thing in the hand
         right now, because a bond survives being stowed and a stowed weapon makes
         no attacks for it to ride. */
      bond: row
        ? {
            row: row.id,
            item: row.blade.item,
            base: row.blade.base,
            damage: row.blade.damage,
            weapon,
            name: named,
            drawn: readEquipment(character?.equipment).main_hand === row.blade.item,
          }
        : null,
      /* The three numbers a rank decides, resolved once so the block, the prompt
         and the card all read the same ones. */
      empower: atRank(spec.empower, rank),
      spells: atRank(spec.spells, rank),
      cut: atRank(spec.cut, rank),
      types: Array.isArray(spec.types) ? spec.types : [],
    };
  });
}

/** One block per set that binds, for the Character tab's arrangement. */
export function bladeBlockIds(character) {
  return bladeState(character).map((state) => `blade:${state.id}`);
}

/* ------------------------------------------------------------- the binding */

/**
 * The patch that binds a weapon, as `{ effects }`.
 *
 * "Binding a weapon releases the one you had bound before" is the filter: this
 * set's own row goes, whatever it held, and the new one goes on top. Newest at
 * the top is the tracker's own order and the reason is the tracker's own: the
 * thing you just did is the thing you are checking.
 *
 * The row is written the way `addEffect` writes one, and not through it, because
 * that function lives in combatTurn.js. The fields are the same fields; a row
 * that came through here and one that came through there are the same row.
 */
export function bindPatch(character, state, { item, damage, name = null }) {
  const base = baseWeaponOf(character, item);
  const blade = normalizeBlade({ item, base: base?.id, damage });
  if (!blade) return null;

  const card = state.talent.cards.find((one) => one.opens === 'blade') ?? null;
  const held = readEffects(character).filter((row) => !isOurBond(row, card));

  return {
    effects: [
      {
        id: newBondId(),
        /* The weapon's own name, so the row on the tracker reads as the thing it
           is doing rather than as the card that did it. A row saying "Bound Edge"
           four times over would be four rows nobody can tell apart. */
        name: `${name ?? base?.name ?? 'Bound weapon'} · ${damage}`,
        card: card?.id ?? null,
        note: '',
        turns: null,
        /* The one field that ends it, and the one the card prints. See
           `effectDuration` in combatTurn.js: the card says **until your next Long
           Rest** and this is that sentence as data. */
        until: 'long',
        from: state.talent.name,
        ench: null,
        spell: null,
        trick: null,
        move: null,
        status: null,
        stirred: false,
        blade,
      },
      ...held,
    ],
  };
}

/** The patch that gives the weapon back, as `{ effects }`, or null if none is bound. */
export function releasePatch(character, state) {
  const card = state.talent.cards.find((one) => one.opens === 'blade') ?? null;
  const held = readEffects(character);
  const kept = held.filter((row) => !isOurBond(row, card));
  return kept.length === held.length ? null : { effects: kept };
}

/** Whether one raw row is this set's bond. */
function isOurBond(row, card) {
  return Boolean(row && typeof row === 'object' && row.blade && card && row.card === card.id);
}

/** The `effects` column as a plain array, for the two patches above to rebuild. */
function readEffects(character) {
  let list = character?.effects;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = null;
    }
  }
  return Array.isArray(list) ? list.filter((row) => row && typeof row === 'object') : [];
}

/**
 * An effect id, minted the way `newEffectId` mints one.
 *
 * Written out rather than imported, because combatTurn.js calls `normalizeBlade`
 * above and reaching back into it here would be a circle. Same two branches and
 * the same shapes: a real uuid where the platform has one, and a stamp with some
 * noise on the end where it does not.
 */
function newBondId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
}

/* ---------------------------------------------------------------- the swing */

/**
 * What swinging a bound weapon is worth, folded into `attackModifiers` in
 * moves.js beside the pact's weapon and the Colossus's grip.
 *
 * Tied to the card the way `pactWeaponRiders` is, and for the same reason: the
 * Inventory tab opens a stowed weapon's own attacks through the same fold, and
 * those are not bound. Only the cards the bound weapon teaches carry the riders,
 * and only while it is actually drawn.
 *
 * Three things ride, and each is one clause of one card:
 *
 *   `stat`     BOUND EDGE, "its attacks use your {mind} in place of the
 *              Attribute they print". The same seam the pact's highest-Attribute
 *              rule uses: `modifiers.stat` wins over the card's own everywhere.
 *   `damage`   BOUND EDGE, the type chosen at the binding. A list, because
 *              `attackModifiers` merges it with whatever the blade already deals
 *              and with a KINDLE WEAPON standing on top of it.
 *   `empower`  RESONANT EDGE, at Adept and after.
 */
export function bladeRiders(character, card) {
  for (const state of bladeState(character)) {
    const bond = state.bond;
    if (!bond || !bond.drawn) continue;
    if (card && !(bond.weapon?.abilities ?? []).includes(card.id)) continue;

    const stat = state.spec.cast ?? null;
    const empower = state.empower;

    return {
      stat,
      damage: bond.damage ? [bond.damage] : [],
      empower,
      from: state.talent.name,
      /* Itemised for the list under the pay button, because a swing whose
         attribute, damage type and dice all moved at once is the swing most in
         need of saying who moved them. Two rows and not one: the binding is what
         changed the first two and a different card changed the third. */
      sources: [
        sourceRow(state.spec.from ?? state.talent.name, {
          stat,
          damage: bond.damage ? [bond.damage] : [],
        }),
        sourceRow('Resonant Edge', { empower }),
      ].filter(Boolean),
    };
  }
  return null;
}

/**
 * What one spell costs to carry in on a swing, in Willpower.
 *
 * POINT OF IMPACT: "paying its Willpower and 1 more for every 2 Action Points it
 * costs", less TWINNED STRIKE's point at Master. The spell's own Action Points
 * are never paid, which is the whole trade the set is built on: the attack has
 * already bought the action, and the surcharge is what the spell's own cost is
 * converted into.
 *
 * Rounded **up**, off the rate rather than off a half, which is the same
 * arithmetic and the same argument `moveWillpower`'s `'ap'` scale makes in
 * martial.js: the rung matters and the parity does not, so a 3 Action Point spell
 * costs what a 4 does. Floored at nothing, so the Master's cut can make a Novice
 * spell free and never a credit.
 *
 * `printed` is what the spell prints, for the orb that shows the old number
 * struck through beside the new one wherever the two differ.
 */
export function strikePrice(state, card) {
  const printed = Math.max(0, Math.floor(Number(card?.wp_cost ?? card?.wp) || 0));
  const ap = Math.max(0, Math.floor(Number(card?.ap_cost ?? card?.ap) || 0));
  const rate = Math.max(1, Math.floor(Number(state?.spec?.rate) || 2));

  const surcharge = Math.ceil(ap / rate);
  return {
    wp: Math.max(0, printed + surcharge - state.cut),
    printed,
    surcharge,
    cut: state.cut,
  };
}

/**
 * The spells that may ride *this* card, right now, in the order they were
 * learned.
 *
 * Three questions, and they are the three the card asks:
 *
 *   is a weapon bound at all       BOUND EDGE has to have been spent
 *   is this that weapon's attack   POINT OF IMPACT says "your bound weapon", and
 *                                  a stowed one makes no attacks
 *   is the spell legal to hold     a rank lost or a codex that dropped a card
 *                                  can leave a pick that is no longer legal, and
 *                                  an illegal pick is shown on the block and
 *                                  never offered on a swing
 *
 * Empty for every card that is not a bound weapon's attack and for everybody who
 * holds no blade set, so the prompt can ask this of every use and draw nothing
 * almost every time. Same contract `offeredMoves` keeps.
 */
export function offeredSpells(character, card) {
  const rows = [];

  for (const state of bladeState(character)) {
    const bond = state.bond;
    if (!bond || !bond.drawn || state.spells < 1) continue;
    if (!(bond.weapon?.abilities ?? []).includes(card?.id)) continue;

    const modifiers = loadoutModifiers(state.pool, state.rank);
    for (const id of heldPicks(character?.talents, state.talent.id)) {
      const spell = getCard(id);
      if (!spell) continue;
      rows.push({ id, card: spell, state, modifiers, price: strikePrice(state, spell) });
    }
  }

  return rows;
}

/** How many spells may ride one swing, across every blade set this character holds. */
export function strikeAllowance(character) {
  return bladeState(character).reduce((most, state) => Math.max(most, state.spells), 0);
}

/**
 * What the chosen spells add to the price of the swing, in Willpower.
 *
 * One number, because a ridden spell costs nothing else: its Action Points were
 * the attack's and it lays no charge. Same shape `moveCost` hands back and for
 * the same caller.
 */
export function strikeCost(rows = []) {
  return rows.reduce((sum, row) => sum + Math.max(0, Number(row?.price?.wp) || 0), 0);
}

/**
 * The picks, clamped to what a swing may carry, by their place in the list.
 *
 * By place and not by card id, exactly as the Martial Moves are: two blade sets
 * could prepare the same spell and both were paid for, so two rows can wear one
 * id and ticking either has to tick exactly one. Clamped on read rather than
 * trimmed by an effect, so a rank lost while the dialog is open quietly releases
 * the second spell without a state write racing the render.
 */
export function clampSpells(list, offered, allowed) {
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
 * Whether this card is a spell somebody on this sheet may only cast on a strike.
 *
 * **A Spellblade's spells are not something you play.** They are cast through the
 * bound weapon and no other way (see the readings in talents.js), so a chip on
 * the quick bar would be a way to spend Willpower on nothing. The Abilities tab
 * is where the hand is read and the attack's own prompt is where it is used,
 * which is exactly what became true of a Martial Move on 2026-09-02.
 *
 * Asked of the character and not of the card, because the card is an ordinary
 * spell out of the codex: a Mycomancer who happens to know Fireball still casts
 * Fireball. What is refused is the copy that came out of *this* pool, and a
 * character holding both keeps the chip, because they have a way to cast it that
 * does not need a sword.
 */
export function ridesStrike(character, card, sourceId) {
  if (!card || card.kind !== 'spell') return false;

  for (const state of bladeState(character)) {
    if (sourceId && sourceId !== `loadout:${state.talent.id}`) continue;
    if (heldPicks(character?.talents, state.talent.id).includes(card.id)) return true;
  }
  return false;
}
