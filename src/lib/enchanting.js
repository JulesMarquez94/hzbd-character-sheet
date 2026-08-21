/**
 * Enchanting: what an Enchanter has laid, and what it does to the sheet.
 *
 * A talent set can leave something to the player in four shapes now. Most teach a
 * fixed hand. A Mycomancer *picks* cards out of a school (loadouts.js). A Cauldron
 * Keeper *composes* one out of Ingredients at the moment of using it (brews.js).
 * An Enchanter *lays* enchantments, and this is where they are recorded and added
 * up.
 *
 * ------------------------------------------------------------------ the three
 * The set's own three cards are the whole rule, and there is one shape of storage
 * for each:
 *
 *   WIELDER OF WONDER      "Enchantments apply to your person. Choose one when
 *                          becoming an enchanter, you can change it during a Long
 *                          Rest. The amount of such enchantments you can have is
 *                          equal to your rank in enchanter. These do not count
 *                          toward your Magic Burden."
 *                          -> `worn: ['primal-sense']` on the talent entry.
 *
 *   ENCHANTING             "Whenever you take a Long Rest, you can use your Long
 *                          Rest actions to enchant. Enchanting an item costs you
 *                          an amount of supplies equal to 70 times the Magic
 *                          Burden value of the enchantment."
 *                          -> `laid: { longsword: ['fire-infusion'] }`, same entry.
 *
 *   EPHEMERAL ENCHANTMENT  "You temporarily enchant an item you can touch for the
 *                          next 1 hour ... costs an amount of Willpower equal to
 *                          the enchantment's Magic Burden. This does not count
 *                          toward the wielder's Magic Burden."
 *                          -> an entry in `effects`, carrying `ench`.
 *
 * **Everything the Enchanter records lives on its own talent entry**, next to the
 * `picks` a Mycomancer keeps there, and for the same reason: handing the set back
 * takes its work with it, and no column had to be added to do it.
 *
 * ---------------------------------------------------------------- permanence
 * The split between the first two and the third is the whole reason this file
 * hands back two different things.
 *
 *   worn and laid   are permanent. They are gear: `deriveStats` reads them, so
 *                   `syncDerived` bakes them into the stored columns exactly the
 *                   way a worn breastplate is baked in. Only `laid` costs Magic
 *                   Burden, and the *thing* carries it: a body slot is free, by
 *                   its own card.
 *   ephemeral       is an hour long. It bends what the sheet *shows* and never
 *                   what the sheet *stores*, because a stored bonus is one that
 *                   has no way of ever coming back off. Its own card says it
 *                   costs no Magic Burden.
 *
 * So **nothing this file can see weighs on the Magic Burden meter.** What is laid
 * on a thing is counted by `itemBurden` where the thing is, and the other two are
 * free by their own cards. That is why no total here carries a burden any more.
 *
 * ------------------------------------------------------------------- the leaf
 * This file imports the enchantment codex and the talent codex and nothing else.
 * It may not import characterModel.js, which imports *it* so that deriveStats can
 * see what is worn.
 */

import { ENCHANTMENTS, getEnchantment, enchantBurden, enchantSupplies } from './enchantments.js';
import { getTalent, normalizeTalents, serializeTalents } from './talents.js';

/** The set that does the laying. One id, in one place. */
export const ENCHANTER_ID = 'enchanter';

/* ------------------------------------------------------------------- the set */

/**
 * What this character's Enchanter is, or null for everyone who is not one.
 *
 * `spec` is the set's own `enchanting` block (talents.js), `rank` is what they
 * hold, and `worn`/`laid` are what they have already done with it.
 */
export function enchanterState(character) {
  const set = getTalent(ENCHANTER_ID);
  const spec = set?.enchanting;
  if (!spec) return null;

  const entry = normalizeTalents(character?.talents).find((row) => row.id === ENCHANTER_ID);
  if (!entry || !entry.rank) return null;

  const rank = entry.rank;

  return {
    set,
    spec,
    rank,
    tiers: spec.tiers?.[rank] ?? [],
    /* WIELDER OF WONDER: "equal to your rank in enchanter". */
    wornMax: spec.worn?.[rank] ?? 0,
    /* ENCHANTING: "an item can hold one enchantment at a time", until LAYERED
       ENCHANTMENT at Rank 3 makes it two. */
    perItem: spec.perItem?.[rank] ?? 1,
    worn: normalizeWorn(entry.worn),
    laid: normalizeLaid(entry.laid),
  };
}

/** How many enchantments one item may hold, for this character's rank. */
export function perItemMax(character) {
  return enchanterState(character)?.perItem ?? 1;
}

/** True for a character who can lay anything at all. */
export function isEnchanter(character) {
  return enchanterState(character) !== null;
}

/* ---------------------------------------------------------------- the storage
 * Both shapes are repaired rather than trusted. A stored id the codex no longer
 * knows is dropped, the way a talent's `picks` drop an unknown spell: a row that
 * points at nothing would otherwise grant a rider nobody can read or remove.
 */

/** The enchantments on the Enchanter's own person, deduplicated, codex-checked. */
export function normalizeWorn(value) {
  const list = Array.isArray(value) ? value : [];
  const seen = new Set();
  const out = [];

  for (const raw of list) {
    const id = String(raw ?? '');
    if (!id || seen.has(id) || !getEnchantment(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * What has been laid on what, as `{ [itemId]: [enchantId, ...] }`.
 *
 * **Keyed by item id, and that is now enough.** A *forged* id is an instance (see
 * forged.js), so laying Fire Infusion on one silver ring lands on that ring and
 * nowhere else. Two of the same **codex** piece are still one piece to this
 * record — laying on "longsword" lays it on the longsword — which is the honest
 * reading of a map keyed by id, and is what the forge is for when a player wants
 * two blades with different work in them.
 *
 * Naming a piece and sharing one by code were the other two Developpement Notes
 * asks that needed the instance. Both are in, and neither touched this file.
 */
export function normalizeLaid(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const out = {};

  for (const [itemId, list] of Object.entries(source)) {
    const key = String(itemId ?? '');
    if (!key) continue;

    const ids = normalizeWorn(Array.isArray(list) ? list : [list]);
    if (ids.length > 0) out[key] = ids;
  }
  return out;
}

/* ------------------------------------------------------------------- writing
 * Every writer hands back a *serialized* talents value, the way setTalentPicks
 * does: what goes in the column is the record, not the normalizer's scaffolding.
 * A stored `custom: false` on every row is noise that the next read throws away
 * anyway.
 */

/** The whole `talents` value with the Enchanter's body slots replaced. */
export function setWorn(talents, ids) {
  return serializeTalents(
    normalizeTalents(talents).map((row) =>
      row.id === ENCHANTER_ID ? { ...row, worn: normalizeWorn(ids) } : row
    )
  );
}

/**
 * The whole `talents` value with one more enchantment laid on one item.
 *
 * Refuses past the per-item cap as well as at the UI, because the shelf is not
 * the only way in: a rest window reopened on an item that already holds its
 * limit would otherwise write a third working nobody could read a rule for.
 */
export function layOn(talents, itemId, enchantId) {
  const key = String(itemId ?? '');
  if (!key || !getEnchantment(enchantId)) return serializeTalents(normalizeTalents(talents));

  const cap = perItemMax({ talents });

  return serializeTalents(normalizeTalents(talents).map((row) => {
    if (row.id !== ENCHANTER_ID) return row;
    const laid = normalizeLaid(row.laid);
    const held = laid[key] ?? [];
    if (held.includes(enchantId) || held.length >= cap) return row;
    return { ...row, laid: { ...laid, [key]: [...held, enchantId] } };
  }));
}

/** And with one taken back off. An item left with nothing loses its key. */
export function stripFrom(talents, itemId, enchantId) {
  const key = String(itemId ?? '');

  return serializeTalents(normalizeTalents(talents).map((row) => {
    if (row.id !== ENCHANTER_ID) return row;

    const laid = normalizeLaid(row.laid);
    const held = (laid[key] ?? []).filter((id) => id !== enchantId);
    const next = { ...laid };
    if (held.length > 0) next[key] = held;
    else delete next[key];

    return { ...row, laid: next };
  }));
}

/* --------------------------------------------------------------- the changes
 * What a Long Rest window has decided, as a diff against the row it started
 * from. The window holds one `talents` draft and both the body slots and the
 * laying write into it, so the rest itself only has to ask what moved — the same
 * shape `pickChanges` hands it for a Mycomancer's spells, and for the same
 * reason: nothing is written until "Yes, rest" is pressed, so backing out of the
 * rest backs out of the work.
 */

/** Everything the Enchanter's record gained or lost between two talents values. */
export function enchantChanges(before, after) {
  const was = readRecord(before);
  const now = readRecord(after);

  const wornAdded = now.worn.filter((id) => !was.worn.includes(id));
  const wornDropped = was.worn.filter((id) => !now.worn.includes(id));

  const laidAdded = [];
  const laidDropped = [];

  for (const [itemId, ids] of Object.entries(now.laid)) {
    for (const id of ids) {
      if (!(was.laid[itemId] ?? []).includes(id)) laidAdded.push({ itemId, id });
    }
  }
  for (const [itemId, ids] of Object.entries(was.laid)) {
    for (const id of ids) {
      if (!(now.laid[itemId] ?? []).includes(id)) laidDropped.push({ itemId, id });
    }
  }

  return {
    wornAdded,
    wornDropped,
    laidAdded,
    laidDropped,
    any:
      wornAdded.length > 0 ||
      wornDropped.length > 0 ||
      laidAdded.length > 0 ||
      laidDropped.length > 0,
  };
}

function readRecord(talents) {
  const entry = normalizeTalents(talents).find((row) => row.id === ENCHANTER_ID);
  return {
    worn: normalizeWorn(entry?.worn),
    laid: normalizeLaid(entry?.laid),
  };
}

/**
 * What the crate owes for a set of changes: 70 Supplies a point of Magic Burden,
 * for everything newly laid on an item.
 *
 * **Only for what is laid on a thing.** ENCHANTING is the card that names a price
 * and it names it for enchanting *an item*. WIELDER OF WONDER says the enchanter's
 * body carries enchantments and that they may be changed on a Long Rest, and names
 * no cost at all, which reads the way a Mycomancer's spell swap reads: a
 * re-choosing rather than a making. Flagged for the designer in data/README.md — if
 * the body is meant to cost supplies too, this is the one function to change.
 */
export function changeCost(changes) {
  return (changes?.laidAdded ?? []).reduce(
    (total, row) => total + layingCost(getEnchantment(row.id)),
    0
  );
}

/* ------------------------------------------------------------------ the cost */

/**
 * What an Ephemeral Enchantment costs, which is the card's own two numbers:
 * its printed Action Points, and "an amount of Willpower equal to the
 * enchantment's Magic Burden".
 *
 * The Action Points are read off the card rather than written here, so the
 * transcription stays the only place that number lives.
 */
export function ephemeralCost(enchantment) {
  const card = getTalent(ENCHANTER_ID)?.cards?.find((row) => row.id === 'ephemeral-enchantment');
  return {
    ap: Math.max(0, Math.floor(Number(card?.ap) || 0)),
    wp: enchantBurden(enchantment),
  };
}

/** What laying one permanently costs the crate: 70 Supplies a point of burden. */
export function layingCost(enchantment) {
  return enchantSupplies(enchantment);
}

/* -------------------------------------------------------------- the ephemeral
 * An hour is not a number of turns and is not a rest, so the tracker holds it as
 * an open-ended effect with its own note. The one thing that matters mechanically
 * is `ench`: the id of what was laid, which is how the rider is found again.
 * Storing the id rather than the rider itself is the same law `card` follows —
 * the codex is the truth, so an enchantment the designer repriced is repriced
 * everywhere at once.
 */

/** The effect record an Ephemeral Enchantment writes. */
export function ephemeralEffect(enchantment, { spell = null, target = null } = {}) {
  if (!enchantment) return null;

  const on = target ? ` on ${target}` : '';
  const carried = spell ? `, carrying ${spell}` : '';

  return {
    name: enchantment.name,
    card: enchantment.id,
    ench: enchantment.id,
    spell: spell ?? null,
    note: `Ephemeral${on}. One hour${carried}.`,
    /* Not counted in turns: an hour outlasts every fight the tracker counts, and
       a turn count that ran out mid-hour would be a lie. Not ended by a rest
       either, because the card names an hour and not a rest. The player ends it,
       which is what the × on the row is for. */
    turns: null,
    until: null,
    from: 'Ephemeral Enchantment',
  };
}

/** Every running ephemeral enchantment, as `{ effect, enchantment }`. */
export function runningEnchants(effects) {
  const list = Array.isArray(effects) ? effects : safeParse(effects);

  return list
    .filter((row) => row && typeof row === 'object' && row.ench)
    .map((row) => ({ effect: row, enchantment: getEnchantment(row.ench) }))
    .filter((row) => row.enchantment);
}

function safeParse(value) {
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ the sums */

/** The same list with each id once, in the order it was first met. */
function dedupe(ids) {
  return [...new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean))];
}

/** A blank set of grants, so every caller reads the same shape. */
function noGrants() {
  return {
    attributes: { physique: 0, instinct: 0, mind: 0 },
    healthMax: 0,
    willpowerMax: 0,
    speed: 0,
    armor: 0,
    /* What comes *off* the price of a rest. Oz'em Pick is the only thing on the
       sheet that moves a rest rather than a stat. */
    restSupplies: 0,
    /* Printed rather than computed. Barrier grants "2d6 in Shield", which is a
       roll the table makes; the sheet says so and does not invent a number. */
    shieldRolls: [],
    /* What the bell hands over in Reaction Points. A flat number rather than a
       roll, and PREPARED is the only thing that grants one. */
    reactionAtCombat: 0,
    spells: [],
    any: false,
  };
}

/**
 * Everything a list of enchantment ids adds up to.
 *
 * ------------------------------------------------------------ the same-source law
 * **An effect does not stack with itself.** "Unless they say otherwise, effects do
 * not stack from the same source", and one enchantment is one source however many
 * things it is written into: Primal Sense on two rings is a single point of
 * Instinct, and Primal Sense on a ring and again on the Enchanter's own person is
 * still a single point. A point from a lineage and a point from a ring are two
 * different sources and do stack — nothing here can see a lineage, which is
 * exactly why the rule can be applied wholesale at this one point.
 *
 * So the list is deduplicated on the way in, and every caller hands its ids in
 * *with* their duplicates so this is the only place that has to know the rule.
 *
 * **What a working weighs is not summed here and never was the same sum.** Where
 * the same enchantment is on two rings the player is charged Magic Burden for
 * both, because burden is what a thing weighs rather than what it does. That is
 * `itemBurden`'s to count, on the item, and nothing laid on a person weighs at
 * all — see the note at the top of this file.
 */
export function grantsFrom(ids) {
  const total = noGrants();

  for (const id of dedupe(ids)) {
    const entry = getEnchantment(id);
    if (!entry) continue;

    total.any = true;

    for (const [key, value] of Object.entries(entry.attributes ?? {})) {
      if (key in total.attributes) total.attributes[key] += Math.floor(Number(value) || 0);
    }
    total.healthMax += Math.floor(Number(entry.healthMax) || 0);
    total.willpowerMax += Math.floor(Number(entry.willpowerMax) || 0);
    total.speed += Number(entry.speed) || 0;
    total.armor += Math.floor(Number(entry.armor) || 0);
    total.restSupplies += Math.floor(Number(entry.restSupplies) || 0);
    total.reactionAtCombat += Math.floor(Number(entry.reactionAtCombat) || 0);
    if (entry.shieldAtCombat) total.shieldRolls.push({ id: entry.id, name: entry.name, roll: entry.shieldAtCombat });
  }

  return total;
}

/**
 * The same list, deduplicated by the same law, handed back as the enchantments
 * themselves rather than as a sum.
 *
 * `grantsFrom` above answers "how much", which is what the stat columns need. A
 * tile that shows a number has a second question to answer — *which working lent
 * it* — and a total cannot say. So this is the sum's own reading of the list,
 * sharing its `dedupe` rather than repeating it: two rings carrying Primal Sense
 * are one row here for the same reason they are one point there, and a math line
 * built off this can never credit a source the stat did not actually take.
 *
 * Every id that resolves comes back, riders or none. Whoever is naming sources
 * knows which rider it is looking for, and an enchantment carrying nothing it
 * cares about is one it simply does not print.
 */
export function grantRows(ids) {
  return dedupe(ids).map((id) => getEnchantment(id)).filter(Boolean);
}

/**
 * Every enchantment standing on this character, from all three places one can
 * sit, as rows. The naming counterpart of `allGrants`.
 *
 * Worn on their own person, worked into what they carry and running on them for
 * the hour, in that order, with the hour-long half last because it is the half
 * that will be gone. The `dedupe` inside `grantRows` is what makes the same-source
 * law bite across the three: an hour of borrowed Primal Sense on somebody already
 * wearing one is not a second row any more than it is a second point.
 *
 * `gear` is handed in for the reason `allGrants` needs it handed in: this file is
 * a leaf and has no idea what a codex item is. Call `characterGrantSources` in
 * items.js, which is the composed reading.
 */
export function grantSources(character, gear = []) {
  return grantRows([
    ...wornIds(character?.talents),
    ...gear,
    ...runningEnchants(character?.effects).map((row) => row.enchantment.id),
  ]);
}

/** The enchantments on the Enchanter's own person, by id. */
export function wornIds(talents) {
  const entry = normalizeTalents(talents).find((row) => row.id === ENCHANTER_ID);
  return entry ? normalizeWorn(entry.worn) : [];
}

/* The body slots used to have a reading of their own here, `wornGrants`, and it
   existed for one caller: the Magic Burden meter, which had to see them apart
   from the gear so an enchanted ring was not charged twice. They weigh nothing
   now (see the top of this file), the meter asks nothing of this file, and the
   body slots are only ever read folded in with the gear by `allGrants`. */

/**
 * What is on them for the next hour.
 *
 * `already` is what is *permanently* on them, so the same-source law can bite
 * across the two halves as well as inside each: an hour of borrowed Primal Sense
 * on somebody who is already wearing one is an hour of nothing.
 */
export function ephemeralGrants(effects, already = []) {
  const standing = new Set(already.map(String));
  const running = runningEnchants(effects).filter((row) => !standing.has(row.enchantment.id));
  const total = grantsFrom(running.map((row) => row.enchantment.id));

  total.spells = running.map((row) => row.effect.spell).filter(Boolean);
  return total;
}

/**
 * All three together, for anything that wants the whole picture at once.
 *
 * `gear` is the enchantment ids worked into what the character is wearing — the
 * third place a working can come from, and the one this file cannot see for
 * itself: it is a leaf and has no idea what a codex item is, let alone what is
 * equipped. So items.js collects them and hands them in. Call `characterGrants`
 * there rather than this directly; it is the composed reading and it is what
 * every consumer wants.
 *
 * `worn` on the way out means **permanent** — the body slots and the gear
 * together — because that is the half `deriveStats` bakes into stored columns and
 * the half a rest cannot take back off. `ephemeral` is the hour-long half, minus
 * anything the permanent half already carries.
 */
export function allGrants(character, gear = []) {
  const permanent = [...wornIds(character?.talents), ...gear];
  const worn = grantsFrom(permanent);
  const ephemeral = ephemeralGrants(character?.effects, permanent);

  return {
    attributes: {
      physique: worn.attributes.physique + ephemeral.attributes.physique,
      instinct: worn.attributes.instinct + ephemeral.attributes.instinct,
      mind: worn.attributes.mind + ephemeral.attributes.mind,
    },
    healthMax: worn.healthMax + ephemeral.healthMax,
    willpowerMax: worn.willpowerMax + ephemeral.willpowerMax,
    speed: worn.speed + ephemeral.speed,
    armor: worn.armor + ephemeral.armor,
    restSupplies: worn.restSupplies + ephemeral.restSupplies,
    reactionAtCombat: worn.reactionAtCombat + ephemeral.reactionAtCombat,
    shieldRolls: [...worn.shieldRolls, ...ephemeral.shieldRolls],
    spells: ephemeral.spells,
    /* No burden. Nothing in here weighs: what is laid on a thing is counted by
       `itemBurden` where the thing is, and the body slots and the hour-long half
       are free by their own cards. See magicBurdenUsed. */
    any: worn.any || ephemeral.any,
    worn,
    ephemeral,
  };
}

/**
 * The enchantments on this character's own person that change how a weapon hits.
 *
 * WIELDER OF WONDER puts an enchantment on the Enchanter rather than on a thing:
 * "Enchantments apply to your person." A Fire Infusion is an enchantment, so an
 * Enchanter wearing one is an Enchanter whose weapons deal Fire — the working is on
 * the hands rather than the blade, and it moves from weapon to weapon with them.
 *
 * Both kinds count: what is worn is permanent and what is ephemeral lasts the hour.
 * Only the ones that actually carry a weapon rider come back, so nothing here has
 * to be filtered again downstream.
 */
export function damageEnchants(character) {
  const state = enchanterState(character);
  const worn = state ? state.worn.map(getEnchantment) : [];
  const running = runningEnchants(character?.effects).map((row) => row.enchantment);

  return [...worn, ...running].filter(
    (entry) => entry && (entry.damageType || entry.empower)
  );
}

/**
 * What comes off the price of a rest, both kinds.
 *
 * OZ'EM PICK: "the cost in supplies of short and long rest are reduced by 2." The
 * only enchantment on the sheet that moves a rest rather than a stat, and the
 * reduction is read from both what is worn and what is running, because an hour of
 * borrowed frugality is still frugality — and from a Pick worked into a ring,
 * which is why the gear ids have to come in. rest.js hands them over through
 * `characterGrants`; this signature is kept so nothing else had to move.
 *
 * Floored where it is spent, in rest.js, rather than here: this reports what the
 * enchantments say, and a rest that would cost less than nothing costs nothing.
 */
export function restSupplyCut(character, gear = []) {
  return allGrants(character, gear).restSupplies;
}

/* ------------------------------------------------------------------ the shelf
 * What a rank may lay from, and why each of the rest is refused. The same shape
 * loadoutOptions and ingredientOptions hand their pickers, so the shelf reads the
 * way every other pool on the sheet reads.
 */

/*
 * A `unique` enchantment is dropped rather than refused. Every other row a rank
 * cannot reach comes back marked "Adept needs a higher rank", which is true and
 * useful; a Unique Imbuement is not waiting on a rank and never will be, so
 * offering it dead would be a promise the shelf cannot keep. It comes on the
 * item and nowhere else.
 */
export function enchantOptions(character, { held = [], room = Infinity } = {}) {
  const state = enchanterState(character);
  if (!state) return [];

  const taken = new Set(held);

  return ENCHANTMENTS.filter((entry) => !entry.unique).map((entry) => {
    const row = { enchantment: entry, held: taken.has(entry.id) };

    if (!state.tiers.includes(entry.tier)) {
      return { ...row, ok: false, reason: `${entry.tier} needs a higher rank` };
    }
    if (row.held) return { ...row, ok: false, reason: 'On you already' };
    if (taken.size >= room) {
      return { ...row, ok: false, reason: room === 1 ? 'One at this rank' : `${room} is the most` };
    }
    return { ...row, ok: true };
  });
}

/** What laying one more on your own person would leave you room for. */
export function wornRoom(character) {
  const state = enchanterState(character);
  if (!state) return 0;
  return Math.max(0, state.wornMax - state.worn.length);
}

/** And what one item has left. Zero means it is full at this rank. */
export function itemRoom(character, itemId) {
  const state = enchanterState(character);
  if (!state) return 0;
  return Math.max(0, state.perItem - (state.laid[String(itemId ?? '')] ?? []).length);
}

/** Everything laid on one item, as codex records. */
export function laidOn(character, itemId) {
  const state = enchanterState(character);
  if (!state) return [];
  return (state.laid[String(itemId ?? '')] ?? []).map(getEnchantment).filter(Boolean);
}

/**
 * The `enchants` entries an item carries because this character laid them, in the
 * shape `itemEnchantments` already reads. Merged into an item's own by
 * `heldItem` in items.js, so everything downstream — the weapon block, the cards
 * an item teaches, the Magic Burden meter — sees laid work without being taught
 * what an Enchanter is.
 */
export function laidEntries(character, itemId) {
  return laidOn(character, itemId).map((entry) => ({ id: entry.id }));
}

/** Every item this character has laid anything on, by id. */
export function laidItemIds(character) {
  const state = enchanterState(character);
  return state ? Object.keys(state.laid) : [];
}
