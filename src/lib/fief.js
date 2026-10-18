import {
  ALL,
  DEFAULT_ISLAND,
  DIRS,
  ISLAND_IDS,
  RADIUS,
  STEP,
  TERRAIN,
  hdist,
  hk,
  hsh,
  inmap,
  islandOf,
  nb,
  ring,
  touches,
  unk,
} from './fiefIsland.js';
import { keyPeopleOf, keyRoles, generatedTitle, LORE, QUARTERS, CUSTOM_MODELS } from './fiefPeople.js';

/**
 * The Fief: a town the whole table holds, on a hex island, grown one building
 * at a time on the campaign calendar.
 *
 * Settled in the Fief plan between 2026-10-15 and 2026-10-18 (the plan page is
 * the source of truth for every number here, and calls each one either Jules's
 * rule or a proposal for playtesting). In one paragraph: food feeds the people
 * and quality of life keeps them, and the town holds whichever is smaller. About
 * half of them work, and nobody is assigned: projects take their builders first
 * and the rest spread over the buildings by themselves. Working buildings fill
 * the stores, and the stores pay for the next building or the next tier. A tier
 * never passes the Keep's level.
 *
 * Jules, 2026-10-18: "none of the bonus should add health or willpower stat or
 * modify the character thing. It's more like the town itself is its own thing."
 * So nothing in this file ever reads or writes a sheet. The town gives through
 * its shops, its trade, its people and a rest under its roof, and each of those
 * is the sheet's own write (src/lib/fiefShop.js, src/lib/rest.js).
 *
 * ------------------------------------------------------------ who writes what
 * The same law as the rest of the campaign page: only a sheet writes itself, and
 * only the Game Master writes the campaign row. So the town is two records:
 *
 *   campaigns.fief    the Game Master's: the founding, the starting rules, the
 *                     events pinned ahead, and every card they rewrote.
 *   fief_orders       everybody's: one insert-only row per move. A building
 *                     ordered, a tier raised, a run of wall, goods traded.
 *
 * Nobody stores the town itself. `foldFief` replays the orders day by day from
 * the founding to today, and every screen at the table replays the same rows
 * into the same town. An order that cannot be paid for on its day (two players
 * spending the same wood at once) is refused inside the replay, so it is refused
 * the same way everywhere, and the town's log says so.
 *
 * ------------------------------------------------------------ a new town
 * Jules, 2026-10-18: "make sure there's an option for deleting a fif, so you
 * can delete it and recreate it." The book is insert-only and stays that way,
 * so a town is never deleted by emptying it. It is closed instead: `since` on
 * campaigns.fief is the last row of the book the old town was given, and the
 * replay reads nothing at or before it. Deleting the town leaves a fief with no
 * founding and that mark; founding again keeps the mark, so the new town starts
 * on an empty page while every old row is still there to be read.
 *
 * ------------------------------------------------------------------ the ids
 * A building is named after the order that raised it (`o<seq>`, and
 * `o<seq>.<n>` for each hex of a run of wall), never after a counter. A counter
 * would hand a different number to the same building the day a rule changed and
 * the replay finished things in a different order, and every card the Game
 * Master rewrote would jump to the wrong building. A key person is their
 * building's id and their place on it (`o12:0`), for the same reason.
 */

/* ------------------------------------------------------------ the catalogue */

export const RANKS = ['Novice', 'Adept', 'Master'];

/**
 * Every building, by type. Jules's list of 2026-10-18 with the Farm, the
 * Hunter's hut and the Tavern added the same day. `crew` is the hands at each
 * tier, `food` what each hand feeds, `yield` what each hand makes in a day,
 * `qol` the quality of life at each tier, `site` the ground it must touch.
 */
export const CAT = {
  keep: {
    name: 'Keep',
    tiers: ['Town Hall', 'Keep', 'Castle'],
    qol: [10, 20, 30],
    about: 'The heart of the town and the home of the party. Its level sets how many projects run at once, what the stores hold and the highest tier any other building may reach, and it gives the town its first quality of life.',
  },

  woodcutter: { name: 'Woodcutter', site: 'F', job: 'woodcutter', crew: [4, 8, 12], yield: { wood: 2 }, cost: { wood: 30 }, days: 1, about: 'Each woodcutter cuts 2 wood a day. It must touch the forest.' },
  fisher: { name: 'Fisher', site: 'W', job: 'fisher', crew: [3, 6, 9], food: 12, cost: { wood: 30 }, days: 1, about: 'Each fisher feeds 12. It must touch the sea or the river.' },
  farm: { name: 'Farm', job: 'farmer', crew: [6, 12, 18], food: 6, cost: { wood: 40 }, days: 2, about: 'A field of grain on open grass. Each farmer feeds 6.' },
  hunter: { name: "Hunter's hut", site: 'F', job: 'hunter', crew: [2, 4, 6], food: 8, cost: { wood: 30 }, days: 1, about: 'Each hunter feeds 8. It must touch the forest.' },
  quarry: { name: 'Quarry', site: 'H', job: 'stonecutter', crew: [4, 8, 12], yield: { stone: 2 }, cost: { wood: 60 }, days: 2, about: 'Each stonecutter cuts 2 stone a day. It must touch the high ground.' },
  mine: { name: 'Mine', site: 'H', job: 'miner', crew: [3, 6, 9], yield: { metal: 1 }, cost: { wood: 90, stone: 90 }, days: 4, about: 'Each miner brings up 1 metal a day. It must touch the high ground.' },

  docks: { name: 'Trade docks', site: 'S', job: 'dockhand', crew: [2, 4, 6], yield: { goods: 2 }, cost: { wood: 150, stone: 60 }, days: 5, trade: true, about: 'Ships call at the town. Each dockhand unloads 2 goods a day, and with one at work goods trade for wood, stone or metal one for one, or 5 for an empyrium. The Market needs it. It stands on the shore.' },

  market: { name: 'Market', shop: 'items', job: 'trader', crew: [1, 2, 3], cost: { wood: 120, stone: 90 }, days: 4, needs: 'docks', about: 'Where the party shops for everyday items. Its tier sets the shelves: novice items at tier 1, adept at tier 2 and master at tier 3. It needs a Trade docks in the town.' },
  armorsmith: { name: 'Armor smith', shop: 'arms', job: 'smith', crew: [1, 2, 3], cost: { wood: 60, stone: 90, metal: 40 }, days: 4, about: 'Where the party buys armor and weapons. Its tier sets the rank on sale: novice at tier 1, adept at tier 2 and master at tier 3.' },
  alchemist: { name: 'Alchemist', shop: 'potions', job: 'alchemist', crew: [1, 2, 3], cost: { wood: 90, stone: 60, metal: 20 }, days: 4, later: 'Potions bought here will cost 20% less.', about: 'Where the party buys potions, by the same three ranks. Potions bought here will cost 20% less, once that is built.' },
  enchanter: { name: 'Enchanter', shop: 'enchant', job: 'enchanter', crew: [1, 2, 3], cost: { wood: 90, stone: 120, metal: 60, empyrium: 10 }, days: 6, later: 'Enchantments commissioned here will cost 20% less.', about: 'Where the party commissions enchanted items, by the same three ranks. Commissions here will cost 20% less, once that is built.' },

  temple: { name: 'Temple', job: 'priest', crew: [2, 3, 4], qol: [10, 20, 30], cost: { wood: 60, stone: 150, metal: 20 }, days: 6, about: 'With a priest at work it raises quality of life by 10, by 20 at tier 2 and by 30 at tier 3.' },
  casern: { name: 'Casern', job: 'guard', crew: [4, 8, 12], qol: [5, 10, 15], guards: true, cost: { wood: 90, stone: 120, metal: 30 }, days: 5, about: "The guards' quarters. With guards posted it raises quality of life by 5, by 10 at tier 2 and by 15 at tier 3, and a raid takes only half." },
  tavern: { name: 'Tavern', job: 'innkeeper', crew: [2, 3, 4], cost: { wood: 120, stone: 60 }, days: 4, rest: true, about: 'Where the party eats and sleeps when it rests in the town. At tier 2 a rest here gives every character a Karma point; at tier 3 each also starts the next day with a Shield of five times their level.' },
  cemetery: { name: 'Cemetery', job: 'keeper', crew: [1, 2, 3], undead: [10, 15, 20], cost: { wood: 40, stone: 60 }, days: 3, about: "The town's dead are put to work. While a keeper tends it, every project costs 10% less, 15% at tier 2 and 20% at tier 3." },

  park: { name: 'Park', qol: [4, 8, 12], cost: { wood: 30 }, days: 2, about: 'Pines, lawns and benches. It raises quality of life by 4, by 8 at tier 2 and by 12 at tier 3.' },
  square: { name: 'Square', qol: [4, 8, 12], street: true, cost: { wood: 20, stone: 60 }, days: 2, about: 'A paved square with lamps and benches that counts as a street. It raises quality of life by 4, by 8 at tier 2 and by 12 at tier 3.' },
  fountain: { name: 'Fountain', qol: [6, 12, 18], cost: { stone: 90, metal: 10 }, days: 3, about: 'A stone basin where the street draws its water. It raises quality of life by 6, by 12 at tier 2 and by 18 at tier 3.' },

  wall: { name: 'Wall', line: true, perDay: 4, nolevel: true, cost: { stone: 10 }, days: 1, about: 'A stone wall laid as a straight run: 10 stone a hex and a day for every 4 hexes. Where it crosses a street it leaves a gate.' },
  tower: { name: 'Tower', nolevel: true, wallish: true, cost: { stone: 60, metal: 10 }, days: 3, about: 'A stone tower that counts as wall when the ring closes. Its lookouts spot hidden events 3 days early.' },
  custom: { name: 'Custom building', nolevel: true, custom: true, cost: {}, days: 0, about: 'A building the Game Master raised for the story. Its name, its text and its people belong to the Game Master.' },
};

/** The Build list, in the order it is shown. */
export const GROUPS = [
  { name: 'Food', types: ['farm', 'fisher', 'hunter'] },
  { name: 'Resources', types: ['woodcutter', 'quarry', 'mine'] },
  { name: 'Trade', types: ['docks'] },
  { name: 'Shops', types: ['market', 'armorsmith', 'alchemist', 'enchanter'] },
  { name: 'The town', types: ['tavern', 'temple', 'casern', 'cemetery'] },
  { name: 'Comfort', types: ['park', 'square', 'fountain'] },
  { name: 'Walls', types: ['wall', 'tower'] },
];

export const BUILDABLE = GROUPS.flatMap((group) => group.types);

/** What the Keep's next level costs. Tuned so the Castle is 90 days away at best. */
export const KEEP_UP = {
  2: { cost: { wood: 600, stone: 400 }, days: 12 },
  3: { cost: { wood: 1500, stone: 1500, metal: 400, empyrium: 80 }, days: 24 },
};

/** What the stores hold of each material at each Keep level. Empyrium a fifth. */
export const STORE = [600, 1500, 3000];

export const RES = ['wood', 'stone', 'metal', 'empyrium', 'goods'];

/** How far a new building may stand from the street network. */
export const REACH = 4;

/**
 * The town as it is founded: a Town Hall, its first streets, a field and the
 * handful who came with the grant. Jules, 2026-10-18: "they want the village to
 * start smaller with only like about 10 people."
 */
export const FOUNDING = {
  pop: 10,
  stock: { wood: 60, stone: 20, metal: 0, empyrium: 0, goods: 5 },
  farm: [1, 3],
};

/** The Game Master's dials, with what each may be set to. */
export const DEFAULT_RULES = {
  arrive: 10,
  work: 50,
  builders: 6,
  perHouse: 20,
  perQol: 10,
  goods: { wood: 1, stone: 1, metal: 1, empyrium: 5 },
};

export const RULE_LIMITS = {
  arrive: [0, 100],
  work: [10, 90],
  builders: [1, 20],
  perHouse: [5, 100],
  perQol: [1, 50],
};

/** What a player may order, and what only the Game Master may. */
export const PLAYER_KINDS = ['build', 'upgrade', 'rebuild', 'cancel', 'wall', 'trade', 'buy'];
export const GM_KINDS = ['destroy', 'award', 'custom', 'rules'];
export const ORDER_KINDS = [...PLAYER_KINDS, ...GM_KINDS];

/* ---------------------------------------------------------------- the limits */

export const NAME_MAX = 60;
export const LORE_MAX = 800;
export const EVENTS_MAX = 60;
export const EXTRAS_MAX = 120;
export const STOCK_MAX = 60;
export const PRICE_MAX = 1_000_000;
const AMOUNT_MAX = 100_000;
const DAY_MAX = 1_000_000;
const URL_MAX = 1000;

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const words = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const wholeNumber = (value, lo, hi, fallback) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};
const picture = (value) => (typeof value === 'string' && value.length <= URL_MAX && /^(https:\/\/|\/)/.test(value) ? value : null);
const isHex = (value) => Array.isArray(value) && value.length === 2 && value.every(Number.isInteger) && inmap(value);

/* -------------------------------------------------------------- the stored half */

export function normalizeRules(raw, base = DEFAULT_RULES) {
  const src = isRecord(raw) ? raw : {};
  const out = { goods: { ...base.goods } };
  for (const [key, [lo, hi]] of Object.entries(RULE_LIMITS)) {
    out[key] = wholeNumber(src[key], lo, hi, base[key]);
  }
  for (const res of Object.keys(out.goods)) {
    out.goods[res] = wholeNumber(src.goods?.[res], 1, 100, base.goods[res]);
  }
  return out;
}

/**
 * One event the Game Master pinned ahead: goods or a material up or down on its
 * day, or people arriving with nothing. A raid is stopped by a closed ring of
 * wall and halved by guards at the Casern. A hidden one is the Game Master's
 * alone until the day it lands, or three days before it when a tower stands.
 */
function normalizeEvent(raw) {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id) return null;
  const people = wholeNumber(raw.people, 0, 1000, 0);
  return {
    id: raw.id,
    day: wholeNumber(raw.day, 1, DAY_MAX, 1),
    title: words(raw.title, NAME_MAX) || 'Something happens',
    res: RES.includes(raw.res) ? raw.res : 'goods',
    amt: people ? 0 : wholeNumber(raw.amt, -AMOUNT_MAX, AMOUNT_MAX, 0),
    people,
    hidden: raw.hidden === true,
    raid: raw.raid === true && !people,
  };
}

/** A card the Game Master rewrote, for a building or a custom building. */
function normalizeCard(raw) {
  if (!isRecord(raw)) return null;
  const card = {};
  if (typeof raw.title === 'string') card.title = words(raw.title, NAME_MAX);
  if (typeof raw.lore === 'string') card.lore = words(raw.lore, LORE_MAX);
  if (raw.img !== undefined) card.img = picture(raw.img);
  if (typeof raw.model === 'string' && CUSTOM_MODELS.some(([id]) => id === raw.model)) card.model = raw.model;
  if (typeof raw.shop === 'boolean') card.shop = raw.shop;
  return Object.keys(card).length ? card : null;
}

/** A rewrite of a generated key person. */
function normalizePersonEdit(raw) {
  if (!isRecord(raw)) return null;
  const edit = {};
  if (typeof raw.name === 'string' && raw.name.trim()) edit.name = words(raw.name, NAME_MAX);
  if (typeof raw.role === 'string' && raw.role.trim()) edit.role = words(raw.role, NAME_MAX);
  if (typeof raw.note === 'string') edit.note = words(raw.note, LORE_MAX);
  if (raw.img !== undefined) edit.img = picture(raw.img);
  if (typeof raw.bid === 'string' || raw.bid === null) edit.bid = raw.bid || null;
  if (raw.gone === true) edit.gone = true;
  return Object.keys(edit).length ? edit : null;
}

/** Somebody the Game Master added, from a template or of their own. */
function normalizeExtra(raw) {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id) return null;
  return {
    id: raw.id,
    bid: typeof raw.bid === 'string' && raw.bid ? raw.bid : null,
    role: words(raw.role, NAME_MAX) || 'Townsfolk',
    name: words(raw.name, NAME_MAX) || 'A stranger',
    note: words(raw.note, LORE_MAX),
    img: picture(raw.img),
    custom: true,
  };
}

/** An item the Game Master put on a shop's shelf. */
function normalizeStockItem(raw) {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id) return null;
  const name = words(raw.name, NAME_MAX);
  if (!name) return null;
  return { id: raw.id, name, price: wholeNumber(raw.price, 0, PRICE_MAX, 0), note: words(raw.note, LORE_MAX) };
}

function recordOf(raw, normalize) {
  const out = {};
  if (!isRecord(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    const held = normalize(value);
    if (held) out[key] = held;
  }
  return out;
}

/**
 * The campaign row's `fief`, repaired on read like every stored layout. An
 * empty object is a campaign with no town yet: `founded` is null.
 */
export function normalizeFief(value) {
  const raw = isRecord(value) ? value : {};
  const founded = Number.isInteger(raw.founded) && raw.founded >= 1 ? raw.founded : null;
  const stock = {};
  if (isRecord(raw.stock)) {
    for (const [bid, list] of Object.entries(raw.stock)) {
      if (!Array.isArray(list)) continue;
      const held = list.map(normalizeStockItem).filter(Boolean).slice(0, STOCK_MAX);
      if (held.length) stock[bid] = held;
    }
  }
  return {
    v: 1,
    name: words(raw.name, NAME_MAX) || 'Ashford',
    founded,
    /* Which of the six islands the town stands on, picked at the founding and
       never changed after: every building in the book stands on its ground. */
    island: ISLAND_IDS.includes(raw.island) ? raw.island : DEFAULT_ISLAND,
    /* The last row of the book an earlier town was given. The replay starts after it. */
    since: wholeNumber(raw.since, 0, Number.MAX_SAFE_INTEGER, 0),
    rules: normalizeRules(raw.rules),
    events: (Array.isArray(raw.events) ? raw.events : []).map(normalizeEvent).filter(Boolean).slice(0, EVENTS_MAX),
    cards: recordOf(raw.cards, normalizeCard),
    people: recordOf(raw.people, normalizePersonEdit),
    extras: (Array.isArray(raw.extras) ? raw.extras : []).map(normalizeExtra).filter(Boolean).slice(0, EXTRAS_MAX),
    stock,
  };
}

/** The founding, as the Game Master writes it. */
export function foundFief(name, day, island = DEFAULT_ISLAND, rules = DEFAULT_RULES, since = 0) {
  return normalizeFief({ name, founded: day, island, rules, since });
}

/**
 * The town taken down: no founding, and the book closed at `lastSeq`, the last
 * row it holds, so whatever is founded next starts after it. Everything the
 * Game Master wrote on the old town (its cards, people, events and shelves)
 * goes with it.
 */
export function unfoundFief(fiefValue, lastSeq = 0) {
  const held = normalizeFief(fiefValue);
  return normalizeFief({ since: Math.max(held.since, wholeNumber(lastSeq, 0, Number.MAX_SAFE_INTEGER, 0)) });
}

/** A row off the order book, held to what the replay can read. Null if unreadable. */
export function normalizeOrder(row) {
  if (!isRecord(row) || !ORDER_KINDS.includes(row.kind)) return null;
  const seq = Number(row.seq);
  if (!Number.isFinite(seq)) return null;
  return {
    id: typeof row.id === 'string' ? row.id : `seq${seq}`,
    seq,
    day: wholeNumber(row.day, 1, DAY_MAX, 1),
    kind: row.kind,
    actor: words(row.actor, NAME_MAX),
    character_id: typeof row.character_id === 'string' && row.character_id ? row.character_id : null,
    data: isRecord(row.data) ? row.data : {},
  };
}

/* ------------------------------------------------------------------ the words */

export function listJoin(list) {
  return list.length < 2 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;
}

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many || `${one}s`}`;
}

export function num(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function keepName(level) {
  return CAT.keep.tiers[Math.min(3, Math.max(1, level)) - 1];
}

/** The ground a building wants, in words: "beside the forest". */
export function siteWords(type) {
  const c = CAT[type];
  if (type === 'docks') return 'on the shore';
  if (type === 'fisher') return 'beside the water';
  return c?.site ? `beside the ${TERRAIN[c.site].name.toLowerCase().replace('the ', '')}` : '';
}

/** "120 wood and 90 stone". */
export function costWords(cost) {
  return listJoin(Object.entries(cost ?? {}).map(([res, n]) => `${num(n)} ${res}`)) || 'nothing';
}

/** What it costs to raise a building to a tier, or the Keep to a level. */
export function upCost(type, to) {
  if (type === 'keep') return KEEP_UP[to];
  const c = CAT[type];
  const m = 2 ** (to - 1);
  const cost = {};
  for (const [res, n] of Object.entries(c.cost)) cost[res] = n * m;
  return { cost, days: c.days + 2 * (to - 1) };
}

/** A straight run of wall from one hex towards another, along a hex line. */
export function wallRun(a, b) {
  let best = null;
  for (let i = 0; i < 6; i += 1) {
    const d = DIRS[i];
    const kmax = hdist(a, b) + 1;
    for (let n = 0; n <= kmax; n += 1) {
      const c = [a[0] + d[0] * n, a[1] + d[1] * n];
      const e = hdist(c, b);
      if (!best || e < best.e || (e === best.e && n < best.n)) best = { e, n, i };
    }
  }
  const cells = [];
  for (let j = 0; j <= best.n; j += 1) cells.push([a[0] + DIRS[best.i][0] * j, a[1] + DIRS[best.i][1] * j]);
  return cells;
}

/* ------------------------------------------------------------------ the town */

/**
 * A town at its founding, with every rule as a function over its state. The
 * replay drives it with `apply` and `passDay`; the tab reads it with the rest.
 * Nothing outside ever writes `state`.
 */
export function createTown(fiefValue) {
  const fief = normalizeFief(fiefValue);
  const isl = islandOf(fief.island);
  const terr = isl.terr;
  const siteOK = isl.siteOK;
  const st = {
    name: fief.name,
    founded: fief.founded ?? 1,
    day: fief.founded ?? 1,
    pop: FOUNDING.pop,
    stock: { ...FOUNDING.stock },
    roads: {},
    /* The streets that cross a river, by the axis they cross it on. A bridge is
       a street too, and lives in `roads` as well. */
    bridges: {},
    buildings: [],
    houses: [],
    projects: [],
    log: [],
    bought: [],
    rules: fief.rules,
    events: fief.events,
  };

  /* Where things stand is read many times a day and changes a few times a
     month, so it is worked out once per change rather than once per question. */
  let version = 0;
  let occAt = -1;
  let occMap = {};
  let netAt = -1;
  let netMap = {};
  const changed = () => {
    version += 1;
  };

  const byId = (list, id) => list.find((x) => x.id === id) ?? null;
  const bById = (id) => byId(st.buildings, id);
  const pById = (id) => byId(st.projects, id);
  const upgradeOf = (bid) => st.projects.find((p) => p.upgradeOf === bid) ?? null;
  const keep = () => bById('keep');
  const isWall = (b) => b.type === 'wall' || b.type === 'tower';
  const standing = (type) => st.buildings.some((b) => b.type === type && !b.ruined);

  /** Who stands on each hex: a building, a house or a project. */
  function occ() {
    if (occAt === version) return occMap;
    const g = {};
    for (const b of st.buildings) g[hk([b.q, b.r])] = b.id;
    for (const p of st.projects) {
      if (p.upgradeOf) continue;
      for (const c of p.cells ?? [[p.q, p.r]]) g[hk(c)] = p.id;
    }
    for (const q of st.houses) g[hk([q.q, q.r])] = q.id;
    occMap = g;
    occAt = version;
    return g;
  }

  /** The street network: every street, the Keep and every square. */
  function streetSet() {
    if (netAt === version) return netMap;
    const s = { ...st.roads };
    for (const b of st.buildings) {
      if (!b.ruined && (b.type === 'keep' || CAT[b.type].street)) s[hk([b.q, b.r])] = 1;
    }
    netMap = s;
    netAt = version;
    return s;
  }

  /* -------------------------------------------------------------- hands */

  const hasSite = (b) => {
    const c = CAT[b.type];
    return !c.site || touches([b.q, b.r], (n) => siteOK(c.site, n));
  };
  const crewCap = (b) => {
    const c = CAT[b.type];
    return b.ruined || !c.crew || !hasSite(b) ? 0 : c.crew[b.level - 1] || 0;
  };
  const workers = () => Math.floor((st.pop * st.rules.work) / 100);
  const running = () => st.projects.filter((p) => p.started);
  const projectSlots = () => keep().level;

  /**
   * Nobody is assigned. Jules, 2026-10-18: "the assignment things shouldn't be
   * a thing". The hands go out by themselves, in this order:
   *
   *   the food      enough to feed everybody here and a little more, the
   *                 hands that feed most going first. A town that sent its
   *                 farmers to the woods would starve and empty, and fewer
   *                 people would mean fewer farmers again, all the way down.
   *   the builders  up to six to a project, never more than half the hands.
   *                 A project short of them goes slower rather than stopping.
   *   the rest      spread over every place still short of hands, all at the
   *                 same share.
   */
  function staffing() {
    const all = workers();
    let free = all;
    const out = { builders: {}, crew: {}, idle: 0, building: 0, working: 0, jobs: 0, share: 1 };
    const caps = new Map();
    for (const b of st.buildings) {
      const cap = crewCap(b);
      if (!cap) continue;
      caps.set(b.id, cap);
      out.jobs += cap;
    }

    const want = st.pop * 1.1 + 2;
    const feeders = st.buildings
      .filter((b) => caps.has(b.id) && CAT[b.type].food)
      .sort((x, y) => CAT[y.type].food - CAT[x.type].food || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
    let fed = 0;
    for (const b of feeders) {
      if (fed >= want || free <= 0) break;
      const per = CAT[b.type].food;
      const n = Math.min(caps.get(b.id), free, Math.ceil((want - fed) / per));
      out.crew[b.id] = n;
      free -= n;
      fed += n * per;
    }

    let room = Math.floor(all / 2);
    for (const p of running()) {
      const g = Math.min(st.rules.builders, free, room);
      out.builders[p.id] = g;
      free -= g;
      room -= g;
      out.building += g;
    }

    let short = 0;
    for (const [id, cap] of caps) short += cap - (out.crew[id] || 0);
    out.share = short ? Math.min(1, free / short) : 1;
    for (const [id, cap] of caps) {
      const rest = cap - (out.crew[id] || 0);
      if (rest > 0) out.crew[id] = (out.crew[id] || 0) + rest * out.share;
    }
    for (const n of Object.values(out.crew)) out.working += n;
    out.working = Math.round(out.working);
    out.idle = Math.max(0, all - out.building - out.working);
    return out;
  }

  /** Open: standing, and with hands at work if it takes any. */
  const on = (b, S) => !b.ruined && (!CAT[b.type].crew || (S.crew[b.id] || 0) > 0);
  const staffedOf = (type, S) => st.buildings.filter((b) => b.type === type && on(b, S));

  function foodCap(S = staffing()) {
    let f = 0;
    for (const b of st.buildings) if (CAT[b.type].food) f += (S.crew[b.id] || 0) * CAT[b.type].food;
    return Math.floor(f + 1e-6);
  }

  /** Quality of life: the Keep's own share, then every open comfort. */
  function qolParts(S = staffing()) {
    const parts = [{ id: 'keep', name: keepName(keep().level), v: CAT.keep.qol[keep().level - 1] }];
    for (const b of st.buildings) {
      const c = CAT[b.type];
      if (b.type === 'keep' || !c.qol || !on(b, S)) continue;
      parts.push({ id: b.id, name: c.name, v: c.qol[b.level - 1] });
    }
    return parts;
  }
  const qolScore = (S) => qolParts(S).reduce((a, p) => a + p.v, 0);
  const comfortCap = (S) => qolScore(S) * st.rules.perQol;
  /** Food feeds them and quality of life keeps them: the smaller of the two. */
  const holds = (S = staffing()) => Math.min(foodCap(S), comfortCap(S));

  function storeCap() {
    const c = STORE[keep().level - 1];
    return { wood: c, stone: c, metal: c, goods: c, empyrium: Math.floor(c / 5) };
  }

  function production(S = staffing()) {
    const y = { wood: 0, stone: 0, metal: 0, empyrium: 0, goods: 0 };
    for (const b of st.buildings) {
      const c = CAT[b.type];
      const n = S.crew[b.id] || 0;
      if (n && c.yield) for (const [res, per] of Object.entries(c.yield)) y[res] += n * per;
    }
    for (const res of RES) y[res] = Math.floor(y[res] + 1e-6);
    return y;
  }

  /** The best tended cemetery's cut off every price. */
  function undeadCut(S = staffing()) {
    let best = 0;
    for (const b of staffedOf('cemetery', S)) best = Math.max(best, CAT.cemetery.undead[b.level - 1]);
    return best;
  }
  function cut(cost, S) {
    const f = undeadCut(S);
    const out = {};
    for (const [res, n] of Object.entries(cost ?? {})) out[res] = Math.ceil((n * (100 - f)) / 100);
    return out;
  }

  const lookout = () => st.buildings.some((b) => b.type === 'tower' && !b.ruined);

  /** The best open Tavern, which decides what a rest in the town gives. */
  function tavernTier(S = staffing()) {
    let t = 0;
    for (const b of st.buildings) if (b.type === 'tavern' && on(b, S)) t = Math.max(t, b.level);
    return t;
  }

  /* ------------------------------------------------------------ the streets */

  const passable = (h, o) => inmap(h) && !o[hk(h)] && !terr(h);
  /** Whether two neighbours are near enough in height to walk between: one terrace at most. */
  const stepOK = (a, b) => Math.abs(isl.level(a) - isl.level(b)) <= STEP;

  /**
   * Whether a hex touches the street network: a street beside it on its own
   * terrace or one step off it, or a bridge it stands at the end of. A bridge
   * is only reached along its own line, never from the riverbank beside it.
   */
  function netTouch(h, net = streetSet()) {
    for (let i = 0; i < 6; i += 1) {
      const n = nb(h, i);
      const k = hk(n);
      if (!net[k]) continue;
      const axis = st.bridges[k];
      if (axis !== undefined ? axis === i % 3 : stepOK(h, n)) return true;
    }
    return false;
  }

  /** Which edges of a street hex join the network, which is the tile drawn on it. */
  function roadEdges(h) {
    const k = hk(h);
    if (st.bridges[k] !== undefined) return [st.bridges[k], st.bridges[k] + 3];
    const net = streetSet();
    const out = [];
    for (let i = 0; i < 6; i += 1) {
      const n = nb(h, i);
      const nk = hk(n);
      if (!net[nk]) continue;
      const axis = st.bridges[nk];
      if (axis !== undefined ? axis === i % 3 : stepOK(h, n)) out.push(i);
    }
    return out;
  }

  /**
   * Streets lay themselves: the shortest way from a new building to the street
   * network, over free grass, a terrace at a time, and over a river on a bridge
   * where the river runs straight. [] when it already touches one, null when no
   * way is short enough. A bridge hex comes back as [q, r, axis].
   */
  function streetPath(h, limit = 99, o = occ()) {
    const net = streetSet();
    if (netTouch(h, net)) return [];
    const start = hk(h);
    const prev = {};
    const via = {};
    const seen = { [start]: 1 };
    const finish = (end) => {
      const path = [];
      for (let c = end; c !== start; c = prev[c]) path.push(via[c] === undefined ? unk(c) : [...unk(c), via[c]]);
      return path;
    };
    let front = [h];
    for (let d = 0; d < limit && front.length; d += 1) {
      const next = [];
      for (const at of front) {
        const ak = hk(at);
        for (let i = 0; i < 6; i += 1) {
          const n = nb(at, i);
          const k = hk(n);
          if (seen[k]) continue;
          if (passable(n, o) && stepOK(at, n)) {
            seen[k] = 1;
            prev[k] = ak;
            if (netTouch(n, net)) return finish(k);
            next.push(n);
            continue;
          }
          /* A bridge: straight across a river hex onto the far bank. */
          if (terr(n) !== 'V' || o[k] || net[k] || isl.level(at) > STEP) continue;
          const axis = isl.riverAxis(n);
          if (axis < 0 || axis === i % 3) continue;
          const m = nb(n, i);
          const mk = hk(m);
          if (seen[mk] || !inmap(m) || isl.level(m) > STEP) continue;
          if (net[mk] && st.bridges[mk] === undefined) {
            seen[k] = 1;
            prev[k] = ak;
            via[k] = i % 3;
            return finish(k);
          }
          if (!passable(m, o)) continue;
          seen[k] = 1;
          seen[mk] = 1;
          prev[k] = ak;
          via[k] = i % 3;
          prev[mk] = k;
          if (netTouch(m, net)) return finish(mk);
          next.push(m);
        }
      }
      front = next;
    }
    return null;
  }

  function layStreet(path) {
    for (const h of path ?? []) {
      const k = hk(h);
      st.roads[k] = 1;
      if (h.length > 2) st.bridges[k] = h[2];
    }
    changed();
  }

  /** "A street of 3 hexes and a bridge were laid to it." */
  function streetWords(path) {
    if (!path?.length) return '';
    const spans = path.filter((h) => h.length > 2).length;
    const land = path.length - spans;
    const bits = [];
    if (land) bits.push(`a street of ${plural(land, 'hex', 'hexes')}`);
    if (spans) bits.push(spans === 1 ? 'a bridge' : `${spans} bridges`);
    const said = listJoin(bits);
    const verb = bits.length > 1 || spans > 1 ? 'were' : 'was';
    return ` ${said[0].toUpperCase()}${said.slice(1)} ${verb} laid to it.`;
  }

  /** Why a building cannot go on a hex, or null when it can. */
  function placeWhy(type, h) {
    const c = CAT[type];
    if (!c || c.custom || c.line) return 'That is not something to place.';
    if (!isHex(h)) return 'That is off the island.';
    const o = occ();
    const k = hk(h);
    const t = terr(h);
    if (o[k]) return 'Something already stands there.';
    if (st.roads[k]) return 'That is a street. Build beside it.';
    if (t === 'S' || t === 'V') return 'Nothing is built on the water.';
    if (t === 'H') return 'That is high ground. Build at its foot.';
    if (t === 'F') return 'That is forest. Build beside it.';
    if (t === 'C' && type !== 'fisher' && type !== 'docks') return 'The shore is kept for fishers and the Trade docks.';
    if (type === 'farm' && touches(h, (n) => terr(n) === 'S')) return `A field wants open grass, away from ${isl.names.S.name.toLowerCase()}.`;
    if (c.site && !touches(h, (n) => siteOK(c.site, n))) {
      const ground = c.site === 'W' ? `${isl.names.S.name.toLowerCase()} or the river` : `the ${isl.names[c.site].name.replace('The ', '').toLowerCase()}`;
      return `A ${c.name} must touch ${ground}.`;
    }
    if (c.needs && !standing(c.needs)) return `The ${c.name} needs a ${CAT[c.needs].name} in the town first.`;
    if (streetPath(h, REACH, o) === null) return `Too far out. A street must reach it within ${REACH} hexes of the town.`;
    return null;
  }

  /** A custom building goes on any free dry land. It is the Game Master's. */
  function customWhy(h) {
    if (!isHex(h)) return 'That is off the island.';
    if (occ()[hk(h)] || st.roads[hk(h)]) return 'Something already stands there.';
    const t = terr(h);
    if (t && t !== 'C') return 'A custom building goes on dry free land.';
    return null;
  }

  function wallWhy(cells) {
    const o = occ();
    const net = streetSet();
    let near = false;
    for (const h of cells) {
      const k = hk(h);
      const t = terr(h);
      if (!inmap(h)) return 'That runs off the island.';
      if (o[k]) return 'Something already stands on that run.';
      if (t === 'S' || t === 'V') return 'A wall cannot cross the water.';
      if (t === 'H' || t === 'F') return 'A wall cannot climb the high ground or cut the forest.';
      if (t === 'C') return 'A wall cannot stand on the shore.';
      if (net[k] && !st.roads[k]) return 'A wall cannot cross a square or the Keep.';
      if (touches(h, (n) => !!o[hk(n)] || net[hk(n)])) near = true;
    }
    return near ? null : 'Too far out. A run must touch the town.';
  }

  /** Whether the walls close a ring round the Keep, and what lies inside. */
  function perimeter() {
    const wall = {};
    const out = {};
    const stack = [...ring(RADIUS)];
    for (const b of st.buildings) if (isWall(b) && !b.ruined) wall[hk([b.q, b.r])] = 1;
    while (stack.length) {
      const h = stack.pop();
      const k = hk(h);
      if (out[k] || wall[k] || !inmap(h)) continue;
      out[k] = 1;
      for (let i = 0; i < 6; i += 1) stack.push(nb(h, i));
    }
    let inside = 0;
    for (const h of ALL) {
      const k = hk(h);
      if (!out[k] && !wall[k]) inside += 1;
    }
    return { closed: !out['0,0'], inside, walls: Object.keys(wall).length };
  }

  /* ------------------------------------------------------------- the houses */

  /** The free hex beside a street nearest the Keep, where the next house goes. */
  function houseHex(o) {
    const net = streetSet();
    let best = null;
    let bd = Infinity;
    for (const h of ALL) {
      const k = hk(h);
      if (!passable(h, o) || st.roads[k]) continue;
      if (!netTouch(h, net)) continue;
      const d = hdist(h, [0, 0]) + (hsh(h) % 100) / 1000 + (terr(h) === 'C' ? 3 : 0);
      if (d < bd) {
        bd = d;
        best = h;
      }
    }
    return best;
  }

  /** Houses grow by themselves, a hex at a time, whenever the town needs room. */
  function ensureHouses() {
    const need = Math.ceil(st.pop / st.rules.perHouse);
    const grown = [];
    while (st.houses.length < need) {
      const h = houseHex(occ());
      if (!h) break;
      const house = { id: `h${hk(h)}`, q: h[0], r: h[1], name: QUARTERS[st.houses.length % QUARTERS.length] };
      st.houses.push(house);
      changed();
      grown.push(house.name);
    }
    return grown;
  }

  function housePop(house) {
    const i = st.houses.indexOf(house);
    const n = st.houses.length;
    return i < 0 ? 0 : Math.floor(st.pop / n) + (i < st.pop % n ? 1 : 0);
  }

  /* ----------------------------------------------------------- the projects */

  function shortOf(cost) {
    const miss = [];
    for (const [res, n] of Object.entries(cost)) if (st.stock[res] < n) miss.push(`${n - st.stock[res]} ${res}`);
    return miss.length ? `Short ${listJoin(miss)}` : null;
  }
  function pay(cost, f) {
    for (const [res, n] of Object.entries(cost ?? {})) st.stock[res] += Math.floor(n * f);
  }

  function rebuildCost(b) {
    const u = b.level > 1 ? upCost(b.type, b.level) : { cost: CAT[b.type].cost || {}, days: CAT[b.type].days || 1 };
    const cost = {};
    for (const [res, n] of Object.entries(u.cost)) cost[res] = Math.ceil(n / 2);
    return { cost, days: Math.max(1, Math.ceil(u.days / 2)) };
  }

  function tierWhy(b) {
    if (!b) return 'There is nothing there.';
    if (b.ruined) return 'It is rubble. Rebuild it first.';
    if (b.type === 'keep') return b.level >= 3 ? 'The Castle is the last level.' : null;
    if (CAT[b.type].nolevel) return 'It does not upgrade.';
    if (b.level >= 3) return 'Tier 3 is the highest.';
    if (b.level + 1 > keep().level) return `Tier ${b.level + 1} needs the ${keepName(b.level + 1)}.`;
    return null;
  }

  function projName(p) {
    if (p.cells) return `${CAT[p.type].name}, ${plural(p.cells.length, 'hex', 'hexes')}`;
    const base = p.type === 'keep' ? keepName(p.to ?? 1) : CAT[p.type].name;
    if (p.rebuild) return `${base} (rebuild)`;
    if (p.upgradeOf && p.type !== 'keep') return `${base} (tier ${p.to})`;
    return base;
  }

  /* The order being applied, so every line it writes carries the order's
     place in the book and the tab can say what became of the one it placed. */
  let applying = null;
  function addLog(text, kind = 'day') {
    st.log.push(applying === null ? { day: st.day, text, kind } : { day: st.day, text, kind, seq: applying });
  }

  function tryStart() {
    for (const p of st.projects) {
      if (!p.started && running().length < projectSlots()) p.started = true;
    }
  }

  /** When each project should finish, with the queue worked out behind the running ones. */
  function schedule(extra) {
    const out = {};
    const frees = [];
    const S = staffing();
    for (const p of running()) {
      /* At the pace the builders it has today can keep. */
      const rate = Math.min(1, (S.builders[p.id] || 0) / st.rules.builders);
      const e = st.day + Math.ceil((p.days - p.done) / Math.max(rate, 0.1) - 1e-9);
      out[p.id] = { start: st.day - Math.floor(p.done), end: e, slow: rate < 1 };
      frees.push(e);
    }
    while (frees.length < projectSlots()) frees.push(st.day);
    const queue = st.projects.filter((p) => !p.started);
    if (extra) queue.push(extra);
    for (const p of queue) {
      frees.sort((a, b) => a - b);
      const s0 = Math.max(frees.shift(), st.day);
      out[p.id] = { start: s0, end: s0 + p.days, est: true };
      frees.push(s0 + p.days);
    }
    return out;
  }

  function newProject(fields) {
    const p = { done: 0, started: false, stalled: false, ordered: st.day, ...fields };
    st.projects.push(p);
    changed();
    tryStart();
    return p;
  }

  const begins = (p) => (p.started ? 'Builders begin today.' : 'It waits in line.');

  function orderBuild(id, who, type, h) {
    const why = placeWhy(type, h);
    if (why) return { err: why };
    const cost = cut(CAT[type].cost);
    const short = shortOf(cost);
    if (short) return { err: `${short}.` };
    const path = streetPath(h, REACH);
    pay(cost, -1);
    layStreet(path ?? []);
    const p = newProject({ id, type, q: h[0], r: h[1], days: CAT[type].days, by: who, paid: cost });
    const street = streetWords(path);
    addLog(`${who} ordered a ${CAT[type].name}.${street} ${begins(p)}`, 'order');
    return { ok: p };
  }

  function orderWall(id, who, cells) {
    const why = wallWhy(cells);
    if (why) return { err: why };
    const cost = cut({ stone: CAT.wall.cost.stone * cells.length });
    const short = shortOf(cost);
    if (short) return { err: `${short}.` };
    pay(cost, -1);
    const days = Math.max(1, Math.ceil(cells.length / CAT.wall.perDay));
    const p = newProject({ id, type: 'wall', cells, q: cells[0][0], r: cells[0][1], days, by: who, paid: cost });
    const gates = cells.filter((c) => st.roads[hk(c)]).length;
    addLog(`${who} ordered a run of wall, ${plural(cells.length, 'hex', 'hexes')}${gates ? ` with ${plural(gates, 'gate')}` : ''}. ${begins(p)}`, 'order');
    return { ok: p };
  }

  function orderUpgrade(id, who, bid) {
    const b = bById(bid);
    const why = tierWhy(b);
    if (why) return { err: why };
    if (upgradeOf(bid)) return { err: 'It is already being raised.' };
    const u = upCost(b.type, b.level + 1);
    const cost = cut(u.cost);
    const short = shortOf(cost);
    if (short) return { err: `${short}.` };
    pay(cost, -1);
    const p = newProject({ id, type: b.type, q: b.q, r: b.r, days: u.days, by: who, upgradeOf: b.id, to: b.level + 1, paid: cost });
    const what = b.type === 'keep' ? `${keepName(b.level)} raised to ${keepName(p.to)}` : `${titleOf(b)} to tier ${p.to}`;
    addLog(`${who} ordered the ${what}. ${begins(p)}`, 'order');
    return { ok: p };
  }

  function orderRebuild(id, who, bid) {
    const b = bById(bid);
    if (!b || !b.ruined) return { err: 'There is no rubble there to rebuild.' };
    if (upgradeOf(bid)) return { err: 'It is already being rebuilt.' };
    const rc = rebuildCost(b);
    const cost = cut(rc.cost);
    const short = shortOf(cost);
    if (short) return { err: `${short}.` };
    pay(cost, -1);
    const p = newProject({ id, type: b.type, q: b.q, r: b.r, days: rc.days, by: who, upgradeOf: b.id, to: b.level, rebuild: true, paid: cost });
    addLog(`${who} ordered the ${CAT[b.type].name} rebuilt. ${begins(p)}`, 'order');
    return { ok: p };
  }

  /** Before the first day's work, everything back; after it, half. */
  function cancel(who, pid) {
    const p = pById(pid);
    if (!p) return { err: 'That project is already finished or gone.' };
    const half = p.done > 0;
    pay(p.paid, half ? 0.5 : 1);
    st.projects.splice(st.projects.indexOf(p), 1);
    changed();
    tryStart();
    addLog(`${who} cancelled the ${projName(p)} and got ${half ? 'half' : 'it all'} back.`, 'order');
    return { ok: p };
  }

  function destroy(bid) {
    const b = bById(bid);
    if (!b || b.type === 'keep') return { err: 'The Keep cannot be destroyed.' };
    if (b.ruined) return { err: 'It is already rubble.' };
    const up = upgradeOf(bid);
    if (up) st.projects.splice(st.projects.indexOf(up), 1);
    if (b.type === 'custom') {
      st.buildings.splice(st.buildings.indexOf(b), 1);
      changed();
      addLog(`The Game Master took down ${titleOf(b)}.`, 'gm');
      return { ok: b };
    }
    b.ruined = true;
    changed();
    addLog(`The Game Master destroyed ${titleOf(b)}. Rubble is left.`, 'gm');
    return { ok: b };
  }

  function placeCustom(id, h, data) {
    const why = customWhy(h);
    if (why) return { err: why };
    const b = newBuilding('custom', h, 1, id, 'The Game Master');
    b.custom = {
      title: words(data.title, NAME_MAX) || 'A new building',
      lore: words(data.lore, LORE_MAX) || LORE.custom,
      model: CUSTOM_MODELS.some(([m]) => m === data.model) ? data.model : CUSTOM_MODELS[0][0],
      shop: data.shop === true,
    };
    addLog(`The Game Master raised ${titleOf(b)}.`, 'gm');
    return { ok: b };
  }

  /** The Game Master's gift: tribute, loot, a caravan. Into the stores up to what they hold. */
  function award(data) {
    const cap = storeCap();
    const bits = [];
    for (const res of RES) {
      const n = wholeNumber(data[res], -AMOUNT_MAX, AMOUNT_MAX, 0);
      if (!n) continue;
      const before = st.stock[res];
      st.stock[res] = Math.max(0, Math.min(cap[res], before + n));
      if (st.stock[res] !== before) bits.push(`${st.stock[res] > before ? '+' : ''}${st.stock[res] - before} ${res}`);
    }
    const people = wholeNumber(data.people, 0, 1000, 0);
    if (people) {
      st.pop += people;
      bits.push(`${people} people`);
    }
    if (!bits.length) return { err: 'It gave nothing the stores could take.' };
    const why = words(data.note, NAME_MAX);
    addLog(`The Game Master gave the town ${listJoin(bits)}${why ? `: ${why}` : ''}.`, 'gm');
    return { ok: bits };
  }

  function setRules(data) {
    st.rules = normalizeRules(data, st.rules);
    addLog('The Game Master changed the rules of the town.', 'gm');
    return { ok: st.rules };
  }

  function convert(who, res, n) {
    if (!['wood', 'stone', 'metal', 'empyrium'].includes(res)) return { err: 'Goods do not trade for that.' };
    if (!staffedOf('docks', staffing()).length) return { err: 'The Trade docks need a dockhand at work.' };
    const rate = st.rules.goods[res];
    const cap = storeCap();
    let done = 0;
    for (let i = 0; i < n; i += 1) {
      if (st.stock.goods < rate || st.stock[res] >= cap[res]) break;
      st.stock.goods -= rate;
      st.stock[res] += 1;
      done += 1;
    }
    if (!done) return { err: st.stock.goods < rate ? 'Not enough goods.' : `The stores are full of ${res}.` };
    addLog(`${who} traded ${done * rate} goods for ${done} ${res}.`, 'order');
    return { ok: done };
  }

  /** A purchase is the buyer's own sheet's write. The town only keeps the receipt. */
  function bought(who, characterId, data) {
    const b = bById(data.building);
    const name = words(data.name, NAME_MAX);
    const price = wholeNumber(data.price, 0, PRICE_MAX, 0);
    if (!name) return { err: 'Nothing was named.' };
    const where = b ? titleOf(b) : 'the town';
    st.bought.push({ who, characterId, name, price, from: where, bid: b?.id ?? null, day: st.day });
    addLog(`${who} bought ${name} for ${num(price)} coins at ${where}.`, 'buy');
    return { ok: name };
  }

  /* ------------------------------------------------------------ the buildings */

  function newBuilding(type, h, level, id, by) {
    const b = { id, type, q: h[0], r: h[1], level: level || 1, ruined: false, by: by || '', day: st.day };
    st.buildings.push(b);
    changed();
    return b;
  }

  function complete(p) {
    st.projects.splice(st.projects.indexOf(p), 1);
    changed();
    const wasClosed = perimeter().closed;
    const tail = () => (!wasClosed && perimeter().closed ? ` The ring is closed: ${st.name} has a perimeter.` : '');
    if (p.cells) {
      p.cells.forEach((c, i) => newBuilding(p.type, c, 1, `${p.id}.${i}`, p.by));
      return `The wall is finished, ${plural(p.cells.length, 'hex', 'hexes')}.${tail()}`;
    }
    if (p.upgradeOf) {
      const b = bById(p.upgradeOf);
      if (!b) return '';
      const before = keyRoles(b.type, b.level).length;
      b.level = p.to;
      b.ruined = false;
      changed();
      const met = peopleOf(b.id)
        .filter((person) => !person.custom)
        .slice(before)
        .map((person) => `${person.name}, the ${person.role.toLowerCase()}`);
      return `The ${projName(p)} is finished.${met.length ? ` ${listJoin(met)} arrived.` : ''}`;
    }
    const b = newBuilding(p.type, [p.q, p.r], 1, p.id, p.by);
    const lead = peopleOf(b.id)[0];
    return `The ${CAT[p.type].name} is finished${lead ? `, and ${lead.name} runs it` : ''}.${CAT[p.type].wallish ? tail() : ''}`;
  }

  /* ------------------------------------------------------------- one day */

  /** The day passing: the stores fill, the builders work, events land, people come and go. */
  function passDay() {
    st.day += 1;
    const S = staffing();
    const cap = storeCap();
    const y = production(S);
    const bits = [];
    for (const res of RES) {
      if (!y[res]) continue;
      const before = st.stock[res];
      st.stock[res] = Math.min(cap[res], before + y[res]);
      if (st.stock[res] > before) bits.push(`+${st.stock[res] - before} ${res}`);
    }
    let text = bits.length ? `${bits.join(', ')}.` : 'Nothing was made.';

    for (const p of [...st.projects]) {
      if (!p.started) continue;
      const rate = Math.min(1, (S.builders[p.id] || 0) / st.rules.builders);
      if (rate > 0) {
        p.done = Math.min(p.days, Math.round((p.done + rate) * 10000) / 10000);
        p.stalled = false;
        if (p.done >= p.days) text += ` ${complete(p)}`;
      } else {
        p.stalled = true;
        text += ` The ${projName(p)} stalled for want of builders.`;
      }
    }
    tryStart();

    for (const e of st.events) {
      if (e.day !== st.day) continue;
      if (e.people) {
        st.pop += e.people;
        text += ` ${e.title}: ${e.people} people arrived with nothing.`;
        continue;
      }
      let amt = e.amt;
      const walled = amt < 0 && e.raid && perimeter().closed;
      const guarded = !walled && amt < 0 && staffedOf('casern', staffing()).length > 0;
      if (walled) amt = 0;
      else if (guarded) amt = Math.ceil(amt / 2);
      const cap2 = storeCap();
      st.stock[e.res] = Math.max(0, Math.min(cap2[e.res], st.stock[e.res] + amt));
      const said = walled ? 'the walls held and nothing was taken' : `${amt > 0 ? '+' : ''}${amt} ${e.res}${guarded ? ', the guards saved half' : ''}`;
      text += ` ${e.title}: ${said}.`;
    }

    const S2 = staffing();
    const food = foodCap(S2);
    const room = holds(S2);
    if (st.pop > room) {
      text += ` ${st.pop - room} left for want of ${food < comfortCap(S2) ? 'food' : 'a better life'}.`;
      st.pop = room;
    } else if (st.pop < room) {
      const gap = room - st.pop;
      const came = Math.min(gap, Math.max(2, Math.ceil((gap * st.rules.arrive) / 100)));
      st.pop += came;
      text += ` ${came} arrived (${st.pop} of ${room}).`;
    }
    const grown = ensureHouses();
    if (grown.length) text += ` New houses went up: ${listJoin(grown)}.`;
    addLog(text, 'day');
    return text;
  }

  /* ------------------------------------------------------------ the orders */

  const KIND_WORDS = {
    build: (d) => `${CAT[d.type]?.name ?? 'building'}`,
    upgrade: () => 'upgrade',
    rebuild: () => 'rebuild',
    cancel: () => 'cancellation',
    wall: () => 'run of wall',
    trade: () => 'trade',
    buy: (d) => `purchase of ${words(d.name, NAME_MAX) || 'something'}`,
  };

  /**
   * One row of the order book, applied on its day. A refusal is logged with the
   * reason, because every screen at the table refuses it at the same moment and
   * the player who ordered it should be able to read why.
   */
  function apply(order) {
    const o = normalizeOrder(order);
    if (!o) return { err: 'Unreadable.' };
    const gm = !o.character_id;
    const who = o.actor || (gm ? 'The Game Master' : 'Somebody');
    const d = o.data;
    const id = `o${o.seq}`;
    applying = o.seq;
    try {
      return applyOne(o, gm, who, d, id);
    } finally {
      applying = null;
    }
  }

  function applyOne(o, gm, who, d, id) {
    if (GM_KINDS.includes(o.kind) && !gm) return refuse(who, o, 'Only the Game Master can do that.');

    let res;
    switch (o.kind) {
      case 'build':
        res = BUILDABLE.includes(d.type) && !CAT[d.type].line ? orderBuild(id, who, d.type, d.at) : { err: 'That is not something to build.' };
        break;
      case 'wall':
        res = isHex(d.from) && isHex(d.to) ? orderWall(id, who, wallRun(d.from, d.to)) : { err: 'That run is off the island.' };
        break;
      case 'upgrade':
        res = orderUpgrade(`u${o.seq}`, who, d.building);
        break;
      case 'rebuild':
        res = orderRebuild(`r${o.seq}`, who, d.building);
        break;
      case 'cancel':
        res = cancel(who, d.project);
        break;
      case 'trade':
        res = convert(who, d.res, wholeNumber(d.n, 1, 1000, 1));
        break;
      case 'buy':
        res = bought(who, o.character_id, d);
        break;
      case 'destroy':
        res = destroy(d.building);
        break;
      case 'custom':
        res = placeCustom(id, d.at, d);
        break;
      case 'award':
        res = award(d);
        break;
      case 'rules':
        res = setRules(d.rules);
        break;
      default:
        res = { err: 'Unknown.' };
    }
    if (res.err) return refuse(who, o, res.err);
    return res;
  }

  function refuse(who, o, why) {
    const what = KIND_WORDS[o.kind]?.(o.data) ?? o.kind;
    addLog(`${who}'s ${what} could not go ahead: ${why}`, 'refused');
    return { err: why };
  }

  /* --------------------------------------------------------- people and cards */

  /** A building's card: the Game Master's rewrite over what was generated. */
  function cardOf(b) {
    return (b && fief.cards[b.id]) ?? {};
  }

  function titleOf(b) {
    if (!b) return '';
    const card = cardOf(b);
    if (card.title) return card.title;
    if (b.type === 'custom') return b.custom?.title || CAT.custom.name;
    if (b.type === 'keep') return b.level >= 3 ? `Castle ${st.name}` : `${st.name} ${keepName(b.level)}`;
    if (b.type === 'wall') return 'The Town Wall';
    return generatedTitle(b, st.name, keyPeopleOf(b).map(personView)[0]) || CAT[b.type].name;
  }

  function loreOf(b) {
    const card = cardOf(b);
    if (typeof card.lore === 'string' && card.lore) return card.lore;
    if (b?.type === 'custom') return b.custom?.lore || LORE.custom;
    return LORE[b?.type] || '';
  }

  const pictureOf = (b) => cardOf(b).img ?? null;
  const modelOf = (b) => cardOf(b).model ?? b?.custom?.model ?? CUSTOM_MODELS[0][0];

  function personView(p) {
    const edit = fief.people[p.id];
    return edit ? { ...p, ...edit, bid: edit.bid !== undefined ? edit.bid : p.bid } : p;
  }

  /**
   * Everybody with a name: the key people of every standing building, then the
   * Game Master's own. A key person the Game Master moved keeps their place in
   * the town; one they removed is gone until the building is built again.
   */
  function people() {
    const out = [];
    for (const b of st.buildings) {
      if (b.type === 'wall' || b.type === 'custom') continue;
      for (const p of keyPeopleOf(b)) {
        const seen = personView(p);
        if (!seen.gone) out.push(seen);
      }
    }
    for (const x of fief.extras) {
      const seen = personView(x);
      if (!seen.gone) out.push(seen);
    }
    return out;
  }

  const peopleOf = (bid) => people().filter((p) => p.bid === bid);
  const personById = (pid) => people().find((p) => p.id === pid) ?? null;

  /** A shop the party can buy from: a catalogue shop, or a custom building marked one. */
  function isShop(b) {
    if (!b || b.ruined) return false;
    if (b.type === 'custom') return cardOf(b).shop ?? b.custom?.shop ?? false;
    return !!CAT[b.type].shop;
  }
  function shopOpen(b, S = staffing()) {
    if (!isShop(b)) return false;
    return b.type === 'custom' ? true : (S.crew[b.id] || 0) > 0;
  }

  /* ------------------------------------------------------------- founding */

  function placeFree(type, h, o) {
    const c = CAT[type];
    const k = hk(h);
    const t = terr(h);
    if (o[k] || st.roads[k] || t === 'S' || t === 'V' || t === 'H' || t === 'F') return false;
    if (t === 'C' && type !== 'fisher' && type !== 'docks') return false;
    if (type === 'farm' && touches(h, (n) => terr(n) === 'S')) return false;
    if (c.site && !touches(h, (n) => siteOK(c.site, n))) return false;
    return streetPath(h, 30, o) !== null;
  }

  /** The free hex nearest a target where a building could stand. */
  function nearestFree(type, target) {
    const o = occ();
    let best = null;
    let bd = Infinity;
    for (const h of ALL) {
      if (!placeFree(type, h, o)) continue;
      const d = hdist(h, target) + (hsh(h) % 97) / 1000;
      if (d < bd) {
        bd = d;
        best = h;
      }
    }
    return best;
  }

  st.buildings.push({ id: 'keep', type: 'keep', q: 0, r: 0, level: 1, ruined: false, by: '', day: st.day });
  layStreet(ring(1).filter((h) => !terr(h)));
  const farmAt = nearestFree('farm', FOUNDING.farm);
  if (farmAt) {
    layStreet(streetPath(farmAt, 30) ?? []);
    newBuilding('farm', farmAt, 1, 'f1', '');
  }
  ensureHouses();
  addLog(`The party raised the Town Hall and laid its first streets. ${st.name} is founded.`, 'gm');

  return {
    state: st,
    fief,
    island: isl,
    netTouch,
    roadEdges,
    apply,
    passDay,
    // what stands where
    occ,
    streetSet,
    bById,
    pById,
    upgradeOf,
    keep,
    isWall,
    standing,
    // hands, food and life
    staffing,
    workers,
    running,
    projectSlots,
    crewCap,
    hasSite,
    on,
    foodCap,
    qolParts,
    qolScore,
    comfortCap,
    holds,
    storeCap,
    production,
    undeadCut,
    cut,
    lookout,
    tavernTier,
    // placing and ordering
    placeWhy,
    customWhy,
    wallWhy,
    streetPath,
    perimeter,
    housePop,
    shortOf,
    rebuildCost,
    tierWhy,
    projName,
    schedule,
    nearestFree,
    // cards
    titleOf,
    loreOf,
    pictureOf,
    modelOf,
    people,
    peopleOf,
    personById,
    isShop,
    shopOpen,
  };
}

/* ------------------------------------------------------------------ the replay */

/**
 * The town on `today`, replayed from its founding. Orders are applied on their
 * own day, in the order the book took them, before that day passes. An order
 * from a day still to come (the calendar was set back) waits for its day.
 *
 * Null when the campaign has no town yet.
 */
export function foldFief(fiefValue, orders = [], today = 1) {
  const fief = normalizeFief(fiefValue);
  if (fief.founded === null) return null;
  const town = createTown(fief);
  const end = Math.max(fief.founded, Math.floor(Number(today) || fief.founded));

  const book = new Map();
  const held = orders
    .map(normalizeOrder)
    .filter((o) => o && o.seq > fief.since)
    .sort((a, b) => a.seq - b.seq);
  for (const o of held) {
    const day = Math.max(fief.founded, o.day);
    if (day > end) continue;
    if (!book.has(day)) book.set(day, []);
    book.get(day).push(o);
  }

  for (let day = fief.founded; ; day += 1) {
    for (const o of book.get(day) ?? []) town.apply(o);
    if (day >= end) break;
    town.passDay();
  }
  return town;
}

/* --------------------------------------------------------------- the rest */

/* What a rest in the town gives lives in its own small file, so the calendar
   and the rest can read it without carrying the town. See fiefRest.js. */
export { townRest, townRestWords, townGiftWords } from './fiefRest.js';
