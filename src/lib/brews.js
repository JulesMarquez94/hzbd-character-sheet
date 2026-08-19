/**
 * Special Brew — the Cauldron Keeper's own kind of choice.
 *
 * Most talent sets teach a fixed hand. A Mycomancer picks their hand out of a
 * school (see loadouts.js). A Cauldron Keeper does neither: they *compose* what
 * they hold. A Brew is a Base and one or more Reagents, and the card it makes
 * does not exist in any codex until this character mixes it.
 *
 * So this file is the third shape a talent's choice can take, and the only one
 * that has to *write* a card rather than look one up:
 *
 *   loadouts.js   picks ids out of CARDS
 *   brews.js      builds a card out of parts
 *
 * ------------------------------------------------------------------ the parts
 *   a Base      how the Brew leaves the Cauldron: poured, hurled or breathed.
 *               It sets the Action Point cost, who it reaches, and what each
 *               Reagent costs in Willpower once it is in there.
 *   a Reagent   what the Brew actually does. One clause each, and a second dose
 *               of the same Reagent makes that clause stronger rather than
 *               adding a new one.
 *
 * ------------------------------------------------------------------ the scale
 * Three things grow with the Keeper's Rank, and nothing else does:
 *
 *   how many Brews the Cauldron holds ready      3, 4, 5
 *   how many Reagents fit in one Brew            1, 2, 3
 *   which Reagent tiers are open                 Novice, +Adept, +Master
 *
 * Everything else scales the way every card in this codex scales: off the
 * character's own attribute, through tokens. A Reagent's clause is written as
 * token text (`[[2d6 + 2*stat]]`, `{damage:Decay}`) and resolved against the
 * holder at render time, exactly like a printed card, never as a number baked
 * in here. Doses multiply the *dice*, so two Rot Caps read `2d6 + 2*stat`.
 *
 * ------------------------------------------------------------ the calibration
 * The Reagent numbers are not invented from nothing. They are set against the
 * Novice spells that cost the same:
 *
 *   Bramble Whip  2 AP · 1 WP           ->  1d6 + 2*stat damage   = Flask + Rot Cap
 *   Renew         2 AP · 2 WP           ->  1d6 + stat Health     = Heartroot
 *   Barkskin      overcast, 1 AP · 1 WP ->  1d6 + stat Shield     = Bonemeal
 *
 * So one dose is worth about what one Willpower buys elsewhere in the codex,
 * and a Master Reagent is worth two.
 *
 * ------------------------------------------------------------------ the storage
 * Recipes live on the talent entry as `brews`, beside a Mycomancer's `picks`,
 * for the same reason: handing the set back takes its Brews with it. The array
 * is positional and holds `null` for an empty bottle, the way the utility belt
 * holds an empty loop, so a Brew's card id (`brew-2`) stays put while the
 * bottle beside it is emptied and refilled.
 *
 * This file reads the character and writes recipes. It knows nothing about the
 * card registry, so nothing here can drag weapons.js in.
 */

import { getTalent, normalizeTalents, setTalentBrews } from './talents.js';

/* ---------------------------------------------------------------- the bases */

/**
 * How the Brew leaves the Cauldron.
 *
 * `wpPer` is the Willpower one Reagent costs in this vessel, and it is where an
 * area Brew is paid for: a cloud that takes hold of everything you choose in it
 * is worth twice a flask thrown at one target, and the Action Point cost alone
 * was never going to say so.
 *
 * `lead` is the card's opening, written in the same tokens a printed card is.
 * It has to end by establishing who "they" are, because every Reagent clause
 * after it says "they".
 */
export const BREW_BASES = [
  {
    id: 'draught',
    name: 'Draught',
    ap: 1,
    wpPer: 1,
    reach: 'One entity within reach, or yourself',
    summary: 'Poured out for one pair of hands. The cheapest way to move a Brew.',
    lead:
      'You tip the Cauldron into a waiting hand, or drink it down yourself.\n\n' +
      'One entity within reach takes the draught.',
  },
  {
    id: 'flask',
    name: 'Flask',
    ap: 2,
    wpPer: 1,
    reach: 'One entity you can see within 12 meters',
    summary: 'Bottled and thrown. Needs a hit, and reaches across the room.',
    lead:
      'You bottle the Brew as it boils and hurl it at an entity you can see within 12 meters (40 feet).\n\n' +
      'Make a {stat} Ranged Attack {roll}. On a hit the flask breaks over them.',
  },
  {
    id: 'vapor',
    name: 'Vapor',
    ap: 3,
    wpPer: 2,
    reach: 'Everyone you choose in a 4 meter radius',
    summary: 'A cloud that spares whoever you want spared. Twice the Willpower.',
    lead:
      'You stoke the Cauldron until it belches vapor in a 4 meter (15 foot) radius, centered on a point you can see within 9 meters (30 feet).\n\n' +
      'Every entity you choose inside the cloud breathes it in.',
  },
];

const BASE_BY_ID = new Map(BREW_BASES.map((base) => [base.id, base]));

export function getBase(id) {
  return id ? BASE_BY_ID.get(id) ?? null : null;
}

/* -------------------------------------------------------------- the reagents */

/**
 * What a Brew is made of. One clause each, and `line(doses)` writes that clause
 * for however many doses of it went in.
 *
 * A function rather than a template with a number dropped into it, because
 * doses do not all scale the same way and pretending they do would be a lie in
 * the data: Rot Cap rolls more dice, Aqua Fortis eats more Armor, Nightshade
 * lasts longer, and Ashglass rolls more dice while knocking you down exactly
 * once however much of it you drank.
 *
 * `tier` is read against the set's own tier table, so it is the same word the
 * spell codex uses and a rank opens Reagents the way it opens spells.
 */
export const REAGENTS = [
  /* ------------------------------------------------------------- Novice ---- */
  {
    id: 'heartroot',
    name: 'Heartroot',
    tier: 'Novice',
    effect: 'Health back',
    summary: 'Bitter red root. Closes what is open.',
    line: (n) => `Heartroot: they regain [[${n}d6 + stat]] in Health.`,
  },
  {
    id: 'bonemeal',
    name: 'Bonemeal',
    tier: 'Novice',
    effect: 'a Shield',
    summary: 'Ground bone and lime. Sets hard over the skin.',
    line: (n) => `Bonemeal: they gain [[${n}d6 + stat]] in Shield.`,
  },
  {
    id: 'rot-cap',
    name: 'Rot Cap',
    tier: 'Novice',
    effect: 'Decay damage',
    damage: 'Decay',
    summary: 'A fungus that hurries everything it touches toward the ground.',
    line: (n) => `Rot Cap: they take [[${n}d6 + 2*stat]] in {damage:Decay} damage.`,
  },
  {
    id: 'emberbloom',
    name: 'Emberbloom',
    tier: 'Novice',
    effect: 'Fire damage',
    damage: 'Fire',
    summary: 'A flower that kept the summer it grew in. Catches on contact.',
    line: (n) => `Emberbloom: they take [[${n}d6 + 2*stat]] in {damage:Fire} damage.`,
  },

  /* -------------------------------------------------------------- Adept ---- */
  {
    id: 'aqua-fortis',
    name: 'Aqua Fortis',
    tier: 'Adept',
    effect: 'Armor melted',
    summary: 'The strong water. Eats plate faster than it eats the body inside it.',
    line: (n) => `Aqua Fortis: their Armor is reduced by ${2 * n} until the end of the fight.`,
  },
  {
    id: 'nightshade',
    name: 'Nightshade',
    tier: 'Adept',
    effect: 'poisoned',
    /* No `damage` on purpose. The chip beside a card's cost means "this deals
       that type", and Nightshade deals none: it leaves the target poisoned, and
       what that costs them is the status's business. */
    summary: 'Distilled from the berry. Works its way in and stays there.',
    line: (n) => `Nightshade: they become poisoned for ${3 * n} turns.`,
  },
  {
    id: 'quicksilver',
    name: 'Quicksilver',
    tier: 'Adept',
    effect: 'quicker on their feet',
    summary: 'Living metal. Whoever holds it cannot stand still.',
    line: (n) => `Quicksilver: their Movement Speed is increased by ${2 * n} for 3 turns.`,
  },

  /* ------------------------------------------------------------- Master ---- */
  {
    id: 'ashglass',
    name: 'Ashglass',
    tier: 'Master',
    /* No "and" in a label: these are joined into one line by the Brew's own
       summary, and "Force damage and a knock-down and Armor melted" is what an
       "and" in here reads as. */
    effect: 'Force damage with a knock-down',
    damage: 'Force',
    summary: 'Glass blown from a fire that was put out badly. Goes off on impact.',
    line: (n) =>
      `Ashglass: they take [[${2 * n}d6 + 2*stat]] in {damage:Force} damage and are knocked prone.`,
  },
  {
    id: 'aether-salt',
    name: 'Aether Salt',
    tier: 'Master',
    effect: 'Willpower back',
    summary: 'Scraped off the inside of the Cauldron. Tastes of a storm.',
    line: (n) => `Aether Salt: they regain [[${n}d4]] Willpower.`,
  },
];

const REAGENT_BY_ID = new Map(REAGENTS.map((reagent) => [reagent.id, reagent]));

export function getReagent(id) {
  return id ? REAGENT_BY_ID.get(id) ?? null : null;
}

/* ------------------------------------------------------------------ the spec */

/** The brewing spec a set carries, or null for every set that does not brew. */
export function brewingOf(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return set?.brewing ?? null;
}

/** How many Brews the Cauldron keeps ready at a rank. */
export function bottlesAt(spec, rank) {
  return spec?.bottles?.[rank] ?? 0;
}

/** How many Reagents fit in one Brew at a rank. */
export function dosesAt(spec, rank) {
  return spec?.doses?.[rank] ?? 0;
}

/** Which Reagent tiers a rank may draw on. */
export function tiersAt(spec, rank) {
  return spec?.tiers?.[rank] ?? [];
}

/** The tiers a rank opens that the rank below it could not reach. */
export function openedAt(spec, rank) {
  const below = tiersAt(spec, rank - 1);
  return tiersAt(spec, rank).filter((tier) => !below.includes(tier));
}

/* --------------------------------------------------------------- the recipes */

/** No rank reaches past this, so nothing stored may either. */
const MAX_DOSES = 3;

/** The most bottles any rank holds, for a normalize with no rank to hand. */
export const MAX_BOTTLES = 5;

/** A hand-written Brew name. Long enough to be a name, short enough for a chip. */
export const BREW_NAME_MAX = 28;

/** One stored recipe, or null when the bottle is empty. */
function recipe(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const base = getBase(raw.base);
  const reagents = (Array.isArray(raw.reagents) ? raw.reagents : [])
    .filter((id) => getReagent(id))
    .slice(0, MAX_DOSES);

  /* A bottle with no vessel, or nothing in it, is an empty bottle whatever else
     the row says. Unknown Reagent ids are dropped rather than kept: unlike a
     spell id there is no card behind one to show the player instead. */
  if (!base || reagents.length === 0) return null;

  const name = String(raw.name ?? '').trim().slice(0, BREW_NAME_MAX);
  return { base: base.id, reagents, ...(name ? { name } : {}) };
}

/**
 * A stored `brews` value is only ever a hint. Whatever comes in, this hands
 * back a positional array of recipes and nulls, at least as long as the rack.
 *
 * Rank is deliberately *not* enforced, in either direction. A rank given back
 * can leave a bottle holding more Reagents than it should *and* leave Brews
 * standing past the end of a rack that has shrunk, and neither is poured away
 * here: brewState marks them and the bench offers to pour them out. Cutting the
 * array to the rank would have been one line and would have destroyed the fifth
 * Brew of every Keeper who ever lost a level.
 *
 * Trailing empties are cut before the rack is measured, so a rack that shrank
 * while its last bottles were empty has lost nothing and reads at its new size.
 */
export function normalizeBrews(value, bottles = MAX_BOTTLES) {
  let list = value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = null;
    }
  }

  const stored = (Array.isArray(list) ? list : []).slice(0, MAX_BOTTLES).map(recipe);
  while (stored.length > 0 && !stored[stored.length - 1]) stored.pop();

  const room = Math.max(Math.max(0, Math.floor(Number(bottles) || 0)), stored.length);
  const rack = [...stored];
  while (rack.length < room) rack.push(null);
  return rack;
}

/** What one character's talent entry holds, legal or not. */
export function heldBrews(talents, talentId) {
  const entry = normalizeTalents(talents).find((row) => row.id === talentId);
  return entry?.brews ?? [];
}

/* ------------------------------------------------------------ writing a brew */

/**
 * Bottle a recipe into one slot. A draft with no vessel or nothing in it empties
 * the bottle instead, which is what makes "Pour it out" the same one write.
 */
export function setBrewAt(talents, talentId, slot, draft) {
  // A set that does not brew has no rack, so there is no bottle to write into.
  const spec = brewingOf(talentId);
  if (!spec) return talents;

  const entry = normalizeTalents(talents).find((row) => row.id === talentId);
  if (!entry) return talents;

  const bottles = bottlesAt(spec, entry.rank);
  const rack = normalizeBrews(entry.brews, bottles);

  const at = Math.floor(Number(slot));
  if (!(at >= 0 && at < rack.length)) return talents;

  const clean = recipe(draft);
  /* A bottle standing past the end of the rack can only be poured out. Mixing
     into one would be writing down a Brew the rank cannot hold. */
  if (clean && at >= bottles) return talents;

  const next = [...rack];
  next[at] = clean;
  return setTalentBrews(talents, talentId, next);
}

/** Pour one bottle out. */
export function emptyBrewAt(talents, talentId, slot) {
  return setBrewAt(talents, talentId, slot, null);
}

/* ------------------------------------------------------- composing the card */

/** The doses in a recipe, grouped in the order they were first added. */
export function dosesOf(reagents) {
  const order = [];
  const count = new Map();
  for (const id of reagents ?? []) {
    if (!getReagent(id)) continue;
    if (!count.has(id)) order.push(id);
    count.set(id, (count.get(id) ?? 0) + 1);
  }
  return order.map((id) => ({ reagent: getReagent(id), doses: count.get(id) }));
}

/** "Rot Cap and Nightshade", the way the codex lists things. No Oxford comma. */
function listAnd(words) {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/**
 * What a Brew is called when nobody has named it.
 *
 * Its Reagents and its vessel, which is exactly what one bottle has that the
 * one beside it does not: "Rot Cap Flask", "Heartroot and Bonemeal Draught". A
 * player who wants it called Mother's Ruin says so, and that name is stored on
 * the recipe.
 */
export function brewName(draft) {
  const parts = dosesOf(draft?.reagents);
  const base = getBase(draft?.base);
  if (parts.length === 0 || !base) return 'Empty Bottle';
  return `${listAnd(parts.map((part) => part.reagent.name))} ${base.name}`;
}

/** The rank at which every Brew starts printing its Overbrew half. */
export const OVERBREW_RANK = 3;

/**
 * A recipe as a card, printed for whoever holds it.
 *
 * Written in the same tokens every card in this codex is written in, so its
 * numbers are resolved against the character by the same renderer, and a Keeper
 * who raises their Instinct sees every bottle on the rack get stronger without
 * touching one of them.
 *
 * At Rank 3 the card grows a second half. Overbrew is a passive the Keeper
 * takes, and a rider that fires on every Brew belongs printed on the Brew
 * rather than remembered off another card.
 */
export function brewCard(draft, { slot = 0, rank = 1 } = {}) {
  const clean = recipe(draft);
  if (!clean) return null;

  const base = getBase(clean.base);
  const parts = dosesOf(clean.reagents);
  const damage = [...new Set(parts.map((part) => part.reagent.damage).filter(Boolean))];

  return {
    /* Positional, and stable while the bottle beside it changes. It is what the
       quick bar and a held effect both key on. */
    id: `brew-${slot + 1}`,
    name: clean.name || brewName(clean),
    kind: 'brew',
    tags: ['Brew', base.name],
    ap: base.ap,
    wp: base.wpPer * clean.reagents.length,
    stat: 'instinct',
    ...(damage.length > 0 ? { damage } : {}),
    summary: `${base.reach}. ${listAnd(parts.map((part) => part.reagent.effect))}.`,
    body: [base.lead, ...parts.map((part) => part.reagent.line(part.doses))].join('\n\n'),
    ...(rank >= OVERBREW_RANK
      ? {
          sub_name: 'Overbrew',
          sub_body:
            'When you use this Brew you may spend 2 additional Action Points and 2 additional Willpower.\n\n' +
            'If you do, every Reagent in it rolls twice its dice.',
        }
      : {}),
  };
}

/* ----------------------------------------------------------------- the shelf */

/**
 * Every Reagent measured against the Brew being mixed: what may go in, how much
 * of it is already in there, and for the rest the one line saying why not.
 *
 * Two refusals, and they read differently at the table. A closed tier is a rank
 * away. A full Brew is a dose you have to take back out first.
 */
export function reagentOptions({ spec, rank, draft }) {
  const tiers = tiersAt(spec, rank);
  const capacity = dosesAt(spec, rank);
  const doses = dosesOf(draft?.reagents);
  const filled = (draft?.reagents ?? []).length;

  return REAGENTS.map((reagent) => {
    const held = doses.find((part) => part.reagent.id === reagent.id)?.doses ?? 0;
    const row = { reagent, tier: reagent.tier, held };

    if (tiers.length > 0 && !tiers.includes(reagent.tier)) {
      return { ...row, ok: false, reason: `${reagent.tier} needs a higher rank` };
    }
    if (filled >= capacity) {
      return { ...row, ok: false, reason: 'This Brew is full' };
    }
    return { ...row, ok: true };
  });
}

/** The shelf cut into its tiers, in the order the ranks open them. */
export function reagentsByTier(options) {
  const order = ['Novice', 'Adept', 'Master'];
  const groups = new Map();
  for (const option of options) {
    const key = option.tier ?? 'Unfiled';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(option);
  }
  return [...groups]
    .sort(([a], [b]) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi);
    })
    .map(([label, list]) => ({ label, options: list }));
}

/* --------------------------------------------------------------- the whole rack */

/** One bottle on the rack, said the way the bench prints it. */
function bottle(stored, { spec, rank, slot, bottles }) {
  const parts = dosesOf(stored?.reagents);
  const capacity = dosesAt(spec, rank);
  const tiers = tiersAt(spec, rank);

  /* A bottle can fall out of legality without anybody touching it: a rank given
     back shrinks how deep a Brew may go, and a sheet can arrive from a build
     whose ranks this one has not reached. Both are said on the bottle, and
     neither is poured away. */
  const over = Math.max(0, (stored?.reagents?.length ?? 0) - capacity);
  const closed = parts
    .filter((part) => tiers.length > 0 && !tiers.includes(part.reagent.tier))
    .map((part) => part.reagent);

  // Standing past the end of a rack that has shrunk. Nothing about the Brew is
  // wrong; there is simply no longer a bottle for it.
  const beyond = slot >= bottles;

  return {
    slot,
    recipe: stored,
    card: brewCard(stored, { slot, rank }),
    parts,
    base: getBase(stored?.base),
    filled: Boolean(stored),
    over,
    closed,
    beyond,
    ok: Boolean(stored) && over === 0 && closed.length === 0 && !beyond,
  };
}

/**
 * Everything the bench needs about one Keeper's Cauldron: the rack, how deep a
 * Brew may go, which tiers are open, and how much of the rack stands empty.
 */
export function brewState(talents, talent) {
  const spec = brewingOf(talent);
  if (!spec) return null;

  const id = talent.id ?? talent;
  const entry = normalizeTalents(talents).find((row) => row.id === id);
  const rank = entry?.rank ?? 0;
  const bottles = bottlesAt(spec, rank);

  const rack = normalizeBrews(entry?.brews, bottles).map((stored, slot) =>
    bottle(stored, { spec, rank, slot, bottles })
  );
  const mixed = rack.filter((row) => row.filled);

  return {
    spec,
    rank,
    rack,
    /* What the rank holds, and what is actually standing on the rack. They are
       the same number until a rank is given back. */
    bottles,
    racked: rack.length,
    capacity: dosesAt(spec, rank),
    tiers: tiersAt(spec, rank),
    mixed: mixed.length,
    // Only the bottles that can still be mixed into. A bottle past the end of
    // the rack is not an opening, it is an overflow.
    empty: rack.filter((row) => !row.filled && !row.beyond).length,
    /* Held Brews this rank can no longer legally hold. Shown, never poured. */
    illegal: mixed.filter((row) => !row.ok).length,
    cards: mixed.map((row) => row.card),
  };
}

/**
 * The set whose bench a card opens.
 *
 * A card can carry `opens: 'brews'` (Quick Stir does) and the block that took
 * the payment then has to know *whose* Cauldron to raise. It is answered off the
 * codex rather than written on the card: the set that taught the card is the set
 * that owns the bench, and the character has to actually hold it.
 */
export function benchFor(talents, cardId) {
  if (!cardId) return null;

  for (const held of normalizeTalents(talents)) {
    const set = getTalent(held.id);
    if (!set?.brewing) continue;
    if (!(set.cards ?? []).some((card) => card.id === cardId)) continue;
    return set;
  }
  return null;
}

/**
 * What a rank of the Cauldron opens, for the presentation page that has not
 * taken it yet. The same shape rankPreview hands the loadout note, so the page
 * can print either without knowing which kind of set it is reading.
 */
export function brewPreview(talent, rank) {
  const spec = brewingOf(talent);
  if (!spec) return null;

  const bottles = bottlesAt(spec, rank);
  const capacity = dosesAt(spec, rank);
  const opened = openedAt(spec, rank);
  const tiers = tiersAt(spec, rank);

  return {
    spec,
    bottles,
    gained: Math.max(0, bottles - bottlesAt(spec, rank - 1)),
    capacity,
    deeper: capacity > dosesAt(spec, rank - 1),
    tiers,
    opened,
    /* What the rank adds to the shelf, which is what the note counts. */
    count: REAGENTS.filter((reagent) => opened.includes(reagent.tier)).length,
    reach: REAGENTS.filter((reagent) => tiers.includes(reagent.tier)).length,
  };
}
