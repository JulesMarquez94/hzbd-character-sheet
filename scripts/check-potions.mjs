/**
 * Potion-sheet round trip. Proves the one promise the potion shelf makes:
 * **the designer's potion sheet is what the cards and the flasks say.**
 *
 *   node scripts/check-potions.mjs        report and exit 1 on any drift
 *   node scripts/check-potions.mjs --list print every row, then exit 0
 *
 * `data/Potions/Equipment, Enchantments and Items - Items - Potions.csv` landed on
 * 2026-08-27 with twenty four rows and twenty four pictures, and it replaced every
 * potion the codex had. Its Name, Tags, AP and WP columns are transcribed into
 * `SHEET` below, and every one of them fixes something no line of the app derives:
 *
 *   AP    the drinker's cost, typed on the card
 *   WP    **the brewer's price**, which is not charged to the drinker at all and
 *         is instead the only input to both of the flask's prices
 *   Tags  the rung, which is a chip on the card and the rarity on the item and
 *         the tier on the recipe: three fields that have to agree
 *
 * ------------------------------------------------------------------ the prices
 * Jules set the coin rate in chat on the day of the drop: "a potion cost 100 x
 * Willpower cost in coins. Adpet add 1000 to that and Master add 2000". The
 * Supplies rate is the one alchemy.js has carried since 2026-08-24.
 *
 *     coin     = 100 x WP, + 1000 at Adept, + 2000 at Master
 *     Supplies = 10 x WP, at every rung
 *
 * Both are typed out flask by flask in utility.js rather than computed, the same
 * way a weapon's damage is typed card by card, and for the same reason: a number a
 * designer can reprice must not be a number the code insists on. So this is the
 * other half of that trade. Nothing derives the prices and this proves them.
 *
 * Life Tree Tea is the one row outside the rule and it is outside it on the
 * sheet's own say-so: its WP cell is empty, so there is no number to multiply.
 * Jules priced it at 8000 directly and it carries no `brew`, because ALCHEMY's
 * ladder stops at Master and nothing opens a Legendary tier.
 *
 * What this does not check is prose. The bodies were transcribed with corrections
 * and cuts, each one recorded at its card in utility.js and in data/README.md, and
 * `npm run lint:text` and `npm run lint:cards` are the other halves.
 */

import { ITEMS, getItem } from '../src/lib/items.js';
import { getCard } from '../src/lib/weapons.js';
import { cardRung } from '../src/lib/cardOrder.js';

const LIST = process.argv.includes('--list');

/** What a rung adds to the coin price, off Jules's own sentence. */
const SURCHARGE = { Novice: 0, Adept: 1000, Master: 2000 };

/** The rarity a rung is printed as on the flask. Epic is skipped: four rungs. */
const RARITY = { Novice: 'Common', Adept: 'Uncommon', Master: 'Rare', Legendary: 'Legendary' };

/**
 * The sheet, row by row, in its own order: `id: [rung, AP, WP]`.
 *
 * `WP` is null for the one row whose cell is empty. When the designer reprices a
 * row it changes here, and the run says which flask disagrees.
 */
const SHEET = {
  /* ---- Novice ---- */
  'healing-potion': ['Novice', 2, 2],
  poison: ['Novice', 2, 2],
  'luck-potion': ['Novice', 2, 4],
  'growth-elixir': ['Novice', 2, 4],
  'power-draught': ['Novice', 2, 4],
  'life-draught': ['Novice', 2, 3],
  'defense-draught': ['Novice', 2, 6],
  'explosive-concoction': ['Novice', 2, 4],

  /* ---- Adept ---- */
  'potion-of-disguise': ['Adept', 2, 2],
  'brightscale-draught': ['Adept', 2, 6],
  'skinstone-draught': ['Adept', 2, 6],
  'seafarers-elixir': ['Adept', 2, 2],
  'love-potion': ['Adept', 2, 2],
  'vulnerability-potion': ['Adept', 2, 4],
  'elixir-of-chaos': ['Adept', 2, 4],
  'shrink-elixir': ['Adept', 2, 4],

  /* ---- Master ---- */
  'draught-of-cleansing': ['Master', 2, 6],
  'etherealness-potion': ['Master', 2, 6],
  'elixir-of-slime': ['Master', 2, 10],
  'potion-of-flying': ['Master', 2, 8],
  'elixir-of-time': ['Master', 2, 20],
  'titansbane-poison': ['Master', 3, 8],
  'bottled-lightning': ['Master', 3, 12],

  /* ---- Legendary ---- */
  'life-tree-tea': ['Legendary', 6, null],
};

/** The one row Jules priced by hand, because its Willpower cell is empty. */
const PRICED_BY_HAND = { 'life-tree-tea': 8000 };

const problems = [];
const fail = (id, said) => problems.push(`${id}: ${said}`);

for (const [id, [rung, ap, wp]] of Object.entries(SHEET)) {
  const item = getItem(id);
  const card = getCard(id);

  if (!item) {
    fail(id, 'no flask on the shelf by that id');
    continue;
  }
  if (!card) {
    fail(id, 'no card by that id');
    continue;
  }

  /* ---- the card ---- */
  if (card.ap !== ap) fail(id, `card costs ${card.ap} Action Points, the sheet says ${ap}`);
  if (card.wp !== null) {
    fail(id, `card charges ${card.wp} Willpower; the sheet's Willpower is the brewer's price`);
  }
  if (cardRung(card) !== rung) fail(id, `card reads ${cardRung(card)}, the sheet says ${rung}`);

  /* ---- the flask ---- */
  const tags = item.tags ?? [];
  if (!tags.includes(RARITY[rung])) {
    fail(id, `flask is ${tags.join(' · ')}, and ${rung} is ${RARITY[rung]}`);
  }
  if (!tags.includes('Potion')) fail(id, 'flask is not tagged Potion');

  const byHand = PRICED_BY_HAND[id];
  if (byHand !== undefined) {
    if (wp !== null) fail(id, 'priced by hand here but the sheet has a Willpower for it');
    if (item.cost !== byHand) fail(id, `costs ${item.cost} coins, priced by hand at ${byHand}`);
    if (item.brew) fail(id, 'carries a brew price, and its Willpower cell is empty');
    continue;
  }

  if (wp === null) {
    fail(id, 'the sheet has no Willpower for it and nothing prices it by hand');
    continue;
  }

  const coin = 100 * wp + SURCHARGE[rung];
  if (item.cost !== coin) fail(id, `costs ${item.cost} coins, the rule says ${coin}`);

  if (!item.brew) {
    fail(id, 'no brew price, and the sheet gives it a Willpower');
    continue;
  }
  if (item.brew.tier !== rung) fail(id, `brews at ${item.brew.tier}, the sheet says ${rung}`);
  if (item.brew.supplies !== 10 * wp) {
    fail(id, `brews for ${item.brew.supplies} Supplies, the rule says ${10 * wp}`);
  }
}

/* Nothing on the shelf calls itself a potion that the sheet has never heard of.
   The sheet is the whole codex of them, which is what the drop was: a
   replacement rather than an addition. */
for (const item of ITEMS) {
  if (!item.tags?.includes('Potion')) continue;
  if (!SHEET[item.id]) problems.push(`${item.id}: a Potion on the shelf that is not on the sheet`);
}

if (LIST) {
  console.log('id                        rung        AP   WP    coin   Supplies');
  for (const [id, [rung, ap, wp]] of Object.entries(SHEET)) {
    const item = getItem(id);
    console.log(
      `${id.padEnd(25)} ${rung.padEnd(11)} ${String(ap).padStart(2)} ${String(wp ?? '—').padStart(4)} ${String(
        item?.cost ?? '?'
      ).padStart(7)} ${String(item?.brew?.supplies ?? '—').padStart(8)}`
    );
  }
}

if (problems.length) {
  console.log(`\npotions: ${problems.length} finding(s)\n`);
  for (const said of problems) console.log(`  ${said}`);
  process.exit(LIST ? 0 : 1);
}

console.log(
  `\npotions: all ${Object.keys(SHEET).length} rows match the sheet, and both prices come off its Willpower column`
);
