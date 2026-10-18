import { BAG_ITEMS } from './bags.js';
import { ENCHANTMENTS } from './enchantments.js';
import { ITEMS, getItem, itemCost } from './items.js';
import { TRINKET_ITEMS } from './trinkets.js';
import { UTILITY_ITEMS } from './utility.js';
import { WEAPONS } from './weapons.js';
import { CAT, RANKS } from './fief.js';

/**
 * What the town's shops sell, and what a purchase carries to the buyer's sheet.
 *
 * Jules, 2026-10-18: "allow the dungeon master to create like a shop, and from
 * the shop they can they can click on the building and see what's available and
 * spend their coins over there." And of the discounts on his list: "the
 * discounts are only for things that are bought in the towns. Like that's
 * something we'll do later". So every price here is the codex's own, with
 * nothing taken off, and the two that will come off later are printed on the
 * Alchemist's and the Enchanter's cards as later.
 *
 * ------------------------------------------------------------ the shelves
 * A shop sells by rank, and its tier is how far up it reaches: novice at tier
 * 1, adept at 2, master at 3. The rank of a thing is read off the codex the same
 * way the plan's price list was built:
 *
 *   potions       the Alchemist. A potion's brewing tier, else its rarity
 *   enchantments  the Enchanter. The enchantment's own tier
 *   armor         the Armor smith. Rarity
 *   weapons       the Armor smith. Rarity
 *   everyday      the Market. Rarity, and a bag by its price
 *
 * Read live rather than copied, so a price changed in the codex is the price
 * on the shelf the next time the shelf is opened.
 *
 * Then whatever the Game Master stocked by hand, on any shop and on a custom
 * building they marked as one. Those carry a name, a price and a line, and
 * arrive in the pack as exactly that.
 *
 * ------------------------------------------------------------ an enchantment
 * A commission is not a thing that goes in a pack: an enchantment is laid on
 * an item, and laying it is the forge's work. So the Enchanter sells the
 * commission itself, as a written note the buyer carries, and the Game Master
 * honours it through the forge. Doing that inside the shop is for later, with
 * the 20% off.
 */

const BREW = { Novice: 0, Adept: 1, Master: 2 };

function rarity(item) {
  const tags = item.tags ?? [];
  if (tags.includes('Epic') || tags.includes('Legendary')) return 2;
  if (tags.includes('Rare') || tags.includes('Uncommon')) return 1;
  return 0;
}

const codexRow = (item, rank, kind) => ({
  id: `c:${item.id}`,
  name: item.name,
  price: itemCost(item),
  rank,
  kind,
  gift: { kind: 'codex', item: item.id },
});

let SHELVES = null;

/** Every shelf the codex fills, by kind and rank, cheapest first. Built once. */
function shelves() {
  if (SHELVES) return SHELVES;
  const out = { potions: [[], [], []], enchant: [[], [], []], armor: [[], [], []], weapons: [[], [], []], items: [[], [], []] };
  for (const item of UTILITY_ITEMS) {
    const tags = item.tags ?? [];
    if (tags.includes('Potion')) {
      if (tags.includes('Legendary')) continue;
      const r = item.brew && BREW[item.brew.tier] !== undefined ? BREW[item.brew.tier] : rarity(item);
      out.potions[r].push(codexRow(item, r, 'Potions'));
    } else if (!tags.includes('Relic') && !tags.includes('Scroll') && itemCost(item) > 0) {
      out.items[rarity(item)].push(codexRow(item, rarity(item), 'Everyday items'));
    }
  }
  for (const e of ENCHANTMENTS) {
    const r = BREW[e.tier];
    if (r === undefined) continue;
    out.enchant[r].push({
      id: `e:${e.id ?? e.name}`,
      name: e.name,
      price: Math.max(0, Math.floor(Number(e.cost) || 0)),
      rank: r,
      kind: 'Commissions',
      gift: { kind: 'custom', name: `Commission: ${e.name}`, note: `Paid for at the Enchanter. The Game Master lays ${e.name} on the item you choose.` },
    });
  }
  for (const item of ITEMS) {
    const tags = item.tags ?? [];
    if (tags.some((t) => /Armor/.test(t)) && !tags.includes('Weapon')) out.armor[rarity(item)].push(codexRow(item, rarity(item), 'Armor'));
  }
  for (const item of WEAPONS) {
    if (itemCost(item) > 0) out.weapons[rarity(item)].push(codexRow(item, rarity(item), 'Weapons'));
  }
  for (const item of BAG_ITEMS) {
    const p = itemCost(item);
    const r = p <= 300 ? 0 : p <= 600 ? 1 : 2;
    out.items[r].push(codexRow(item, r, 'Everyday items'));
  }
  for (const item of TRINKET_ITEMS) out.items[rarity(item)].push(codexRow(item, rarity(item), 'Everyday items'));
  for (const kind of Object.keys(out)) {
    out[kind] = out[kind].map((list) =>
      list
        .filter((row, i, all) => all.findIndex((other) => other.name === row.name) === i)
        .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name))
    );
  }
  SHELVES = out;
  return out;
}

const SHOP_SHELVES = {
  potions: ['potions'],
  enchant: ['enchant'],
  arms: ['armor', 'weapons'],
  items: ['items'],
};

/**
 * What a shop has on its shelves: the codex's own up to its tier, then what the
 * Game Master stocked. Each row carries the parcel a purchase hands the sheet.
 */
export function shelfOf(town, building) {
  if (!town || !building) return [];
  const c = CAT[building.type];
  const out = [];
  for (const kind of SHOP_SHELVES[c?.shop] ?? []) {
    shelves()[kind].forEach((rank, i) => {
      if (i < building.level) out.push(...rank);
    });
  }
  for (const it of town.fief.stock[building.id] ?? []) {
    out.push({ id: `s:${it.id}`, name: it.name, price: it.price, rank: null, kind: 'Stocked by the Game Master', note: it.note, gm: true, gift: { kind: 'custom', name: it.name, note: it.note } });
  }
  return out;
}

/** The rank names a shop of this tier sells, for its heading: "novice and adept". */
export function ranksOn(building) {
  return RANKS.slice(0, building?.level ?? 0).map((r) => r.toLowerCase());
}

/** A shelf row's item as the codex holds it, for its card, or null. */
export function rowItem(row) {
  return row?.gift?.kind === 'codex' ? getItem(row.gift.item) : null;
}
