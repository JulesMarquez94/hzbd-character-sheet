/**
 * Spell scrolls — a spell somebody else wrote down, and what it costs to write.
 *
 * "When used, spell scrolls allow the user to cast the spell inscribed in the
 * scroll without having to know it. The scroll is destroyed in the process."
 * That is the whole of it, and it is the first thing in this codex that is an
 * **item carrying a card the item does not own**. Every other piece of gear
 * teaches a fixed list: a Druidic Tome teaches DRUIDIC TOME and always will. A
 * scroll teaches whatever was written on it, which is any one of the 146 spells
 * on the shelf.
 *
 * ------------------------------------------------------------ where one lives
 * On the **forged shelf**, as a `scroll` field on the item instance, beside the
 * `ench` list and the `pact` flag (see forged.js). Not a column of its own, for
 * the reason the forged record exists at all: a scroll needs an identity — two
 * Fireball scrolls in one pack are two scrolls, one of them Unseen and one of
 * them not — and that is exactly what a forged id is. It comes with the pruning,
 * the placement law and the share code already written.
 *
 * So a scroll is a forged record whose base is SCROLL_BASE:
 *
 *     { id: 'forged-…', base: 'spell-scroll', scroll: { spell, words, ephemeral } }
 *
 * `scrollItem` is what turns that into the item the sheet draws, and items.js
 * calls it in the one funnel where a forged id becomes an item.
 *
 * ------------------------------------------------------------------ the price
 * The sheet prices a scroll in **coin**, which is the only thing in the pile
 * that does: "Novice: 500 Coins worth of Arcane Quartz", up to 2000 at Master.
 * Jules asked for Supplies ("craft spell scroll in long rest using supplies"),
 * which is what a rest is paid in on this site and what every other labour at
 * the fire already costs.
 *
 * The rate is not invented. The potion shelf carries both currencies off one
 * column — `coin = 100 x Willpower` and `Supplies = 10 x Willpower` (utility.js)
 * — so ten coins is one Supply everywhere the codex prices the same thing twice,
 * and a Healing Potion is 200 coins and 20 Supplies to prove it. The scroll
 * table divided by ten is 50, 150 and 200.
 *
 * `coins` is kept beside `supplies` on every rung, because the sheet's own
 * number is the one a table will quote when a scroll is bought rather than
 * written, and it is what the item's `cost` is.
 *
 * --------------------------------------------------------------- the ladder
 * **The sheet's four rungs are three here.** It names Novice, Apprentice, Adept
 * and Master; this codex has Novice, Adept and Master and nothing has ever been
 * tagged Apprentice. The same normalisation the Runebearer had on 2026-09-08
 * ("the old pages reach Adept at Rank 3 and Master at Rank 5, which is slower
 * than every other set on the wall"), so Apprentice is dropped rather than
 * opened onto an empty shelf, and the three prices that survive are the sheet's
 * own. Flagged in data/README.md.
 *
 * Legendary and Unique are off the ladder and stay off it, exactly as they are
 * for every pool: `scrollTier` reads the three rungs and nothing else, so a
 * Unique Imbuement's spell can never be scribed.
 *
 * ------------------------------------------------------------- the leaf
 * This file reads the spell codex and nothing else. items.js and forged.js both
 * end up importing it, so it may import neither.
 */

import { SPELLS } from './spells.js';

/** The blank leaf every written scroll is made from. See utility.js. */
export const SCROLL_BASE = 'spell-scroll';

/** What a scribe may call one, before it falls back to "Scroll of X". */
export const SCROLL_NAME_MAX = 60;

/**
 * The three rungs a scroll can be written at, with what the parchment and the
 * Arcane Quartz come to.
 *
 * `coins` is the sheet's; `supplies` is that divided by ten. See the note above.
 *
 * `wp` is the third price and it is not the same kind of thing as the other two.
 * The Quartz is what a **permanent** leaf costs out of the crate; the Willpower
 * is what a **fading** one costs out of the scribe, and it is Jules's own number
 * rather than anything on the PDF: "Ephemeral spell crafting also cost 1
 * willpower for novice 2 for adept and 3 for master" (2026-09-10). It is on the
 * rung with the other two because a rung is where every price of a scroll lives,
 * which is what keeps scribing.js from carrying a table of its own.
 */
export const SCROLL_TIERS = [
  { tier: 'Novice', coins: 500, supplies: 50, wp: 1 },
  { tier: 'Adept', coins: 1500, supplies: 150, wp: 2 },
  { tier: 'Master', coins: 2000, supplies: 200, wp: 3 },
];

const TIER_BY_NAME = new Map(SCROLL_TIERS.map((row) => [row.tier, row]));

/**
 * The rung a spell sits on, or null for one no scroll may carry.
 *
 * The same read `tierOf` does in loadouts.js and for the same reason: a spell's
 * banner is its tier, its school and its family, and the tier is the first tag.
 * Legendary and Unique fall off here rather than being refused by name — there
 * is no rung for them, so there is no price, so there is no scroll.
 */
export function scrollTier(card) {
  for (const tag of card?.tags ?? []) {
    const match = /^(Novice|Adept|Master)\b/.exec(tag);
    if (match && TIER_BY_NAME.has(match[1])) return match[1];
  }
  return null;
}

/** What a scroll of this spell costs out of the crate, or 0 for an unscribable one. */
export function scrollSupplies(card) {
  return TIER_BY_NAME.get(scrollTier(card))?.supplies ?? 0;
}

/** And in coin, which is what the item is worth to a shop. */
export function scrollCoins(card) {
  return TIER_BY_NAME.get(scrollTier(card))?.coins ?? 0;
}

/**
 * And what a fading leaf of it costs the scribe, in Willpower.
 *
 * Nothing but EPHEMERAL SPELL SCROLLS reads this. A permanent scroll is paid for
 * in Supplies and a found one is paid for by whoever lost it, so the rung's
 * Willpower is the price of writing one out of your own head on the spot. Zero
 * for a spell no scroll may carry, which is the same nothing every other price
 * on this file returns for one.
 */
export function scrollWillpower(card) {
  return TIER_BY_NAME.get(scrollTier(card))?.wp ?? 0;
}

/**
 * Every spell a scroll could ever hold, in the codex's own printed order.
 *
 * Gated by the rung alone, which is the Runebearer's ruling read across: "any
 * spell in the codex", school and family no object. A scroll is a piece of
 * parchment rather than a talent, and the thing that makes it a Spellquill's is
 * the writing, not the school.
 */
export const SCROLL_SPELLS = SPELLS.filter((card) => scrollTier(card) !== null);

const SPELL_BY_ID = new Map(SCROLL_SPELLS.map((card) => [card.id, card]));

/** One scribable spell by id, or null for anything off the shelf. */
export function scrollSpell(id) {
  return SPELL_BY_ID.get(String(id ?? '')) ?? null;
}

/* ------------------------------------------------------------- power words
 *
 * "Whenever you create Spell Scrolls, you can choose to pay the indicated
 * Willpower Cost to add a Power Word, altering the spell effects."
 *
 * Seven of them, transcribed off the sheet's own two tables with their costs and
 * their text unchanged. The `rank` is which rung of the set teaches the word,
 * folded from the sheet's five to this site's three: its Rank 2 and Rank 3 both
 * land on Rank 2, the way the tier ladder folds.
 *
 * ------------------------------------------------------------- what is wired
 * **The Willpower is charged and the effect is prose.** A word's cost is real —
 * it comes off the night's refill, so a Spellquill who spends five on Repeat
 * wakes with five less to spend (see restPlan) — and what the word then *does*
 * is played at the table off the scroll's own face.
 *
 * That is the honest split rather than a shortcut. Four of the seven bend a
 * spell in a direction the sheet has a rider for (`Empowered`, an advantage
 * arrow, an Action Point discount) and three do not: Unseen turns on a contest
 * nobody has rolled yet, Repeat is a second cast at the end of a turn, and
 * Altered rewrites a damage type the printed card names inside its own sentence.
 * A card that says three of its seven options work and four are decoration would
 * be worse than one that prints all seven and is read out loud, which is how
 * SPELLBOOK's free hand and IMPROVISED BREWING already work. Flagged.
 */
export const POWER_WORDS = [
  {
    id: 'unseen',
    name: 'Unseen',
    rank: 2,
    wp: 1,
    body:
      'Creatures are unable to determine the source of the spell if the user succeeds in a Stealth check contest against the creature’s Perception.',
  },
  {
    id: 'repeat',
    name: 'Repeat',
    rank: 2,
    wp: 5,
    body:
      'The spell scroll will cast the spell again at the end of your turn, and you can choose a new target for the second cast.',
  },
  {
    id: 'altered',
    name: 'Altered',
    rank: 2,
    wp: 1,
    body: 'For spells that deal damage, you can change the damage type to one of your choice.',
  },
  {
    id: 'enduring',
    name: 'Enduring',
    rank: 2,
    wp: 2,
    body: 'If the spell has a duration, it is increased by 50% (rounded down).',
  },
  {
    id: 'assured',
    name: 'Assured',
    rank: 2,
    wp: 2,
    body:
      'If the spell requires an attack roll, it is made with advantage, and saving throws against it are made with disadvantage.', // text-style-ok: the sheet's own two clauses, transcribed
  },
  {
    id: 'swift',
    name: 'Swift',
    rank: 2,
    wp: 4,
    body: 'The spell costs 3 fewer Action Points to cast, to a minimum of 1.',
  },
  {
    id: 'mighty',
    name: 'Mighty',
    rank: 2,
    wp: 2,
    body:
      'If the spell requires you to roll dice to deal damage or restore health, you use the maximum value of the dice instead of rolling them.',
  },
];

const WORD_BY_ID = new Map(POWER_WORDS.map((word) => [word.id, word]));

export function getPowerWord(id) {
  return WORD_BY_ID.get(String(id ?? '')) ?? null;
}

/** The words a rank has taught, in the sheet's own order. */
export function powerWordsAt(rank) {
  const held = Math.max(0, Math.floor(Number(rank) || 0));
  return POWER_WORDS.filter((word) => word.rank <= held);
}

/** What a list of word ids costs in Willpower. */
export function wordCost(words = []) {
  return words.reduce((total, id) => total + (getPowerWord(id)?.wp ?? 0), 0);
}

/* ------------------------------------------------------------- the record */

/**
 * The `scroll` half of a forged record, repaired against the codex.
 *
 * Null for every record that is not a scroll, which is what keeps this off the
 * rings and the pact weapons. Repaired rather than trusted for the same reason
 * every stored shape is: a spell the build no longer knows, a word that was
 * renamed and a duplicate word are all things a saved sheet can be holding.
 *
 * Words are deduplicated because the stacking law says so: two Mighties on one
 * scroll is one Mighty and two Willpower for nothing.
 */
export function normalizeScroll(value) {
  if (!value || typeof value !== 'object') return null;

  const spell = scrollSpell(value.spell);
  if (!spell) return null;

  const seen = new Set();
  const words = [];
  for (const raw of Array.isArray(value.words) ? value.words : []) {
    const id = String(typeof raw === 'string' ? raw : raw?.id ?? '');
    if (!id || seen.has(id) || !getPowerWord(id)) continue;
    seen.add(id);
    words.push(id);
  }

  return { spell: spell.id, words, ephemeral: Boolean(value.ephemeral) };
}

/** True for a forged record that is a written scroll. */
export function isScrollRecord(record) {
  return record?.base === SCROLL_BASE && Boolean(normalizeScroll(record.scroll));
}

/** What a scroll is called when nobody named it: "Scroll of Fireball". */
export function scrollTitle(scroll) {
  const spell = scrollSpell(scroll?.spell);
  if (!spell) return 'Spell Scroll';
  return scroll?.ephemeral ? `Ephemeral Scroll of ${spell.name}` : `Scroll of ${spell.name}`;
}

/**
 * A written scroll as the item the sheet draws.
 *
 * Called from `forgedFor` in items.js, on the item `forgedItem` has already
 * built, so everything a forged record normally changes has changed already and
 * this only adds what makes it a scroll.
 *
 * ---------------------------------------------------------------- what changes
 *   abilities   **the spell it holds**, in place of the base's own rules card.
 *               The spell is the reason to open the row, and a scroll that
 *               listed SPELL SCROLL beside it would put the instructions on the
 *               belt loop instead of the spell.
 *   name        "Scroll of Fireball", unless the scribe named it something.
 *   tags        the spell's rung, so the pack shelves and the tag filter can
 *               find every Master scroll in a bag, and `Ephemeral` where it is
 *               one — the sheet's own "easily identifiable as Ephemeral".
 *   cost        what the rung is worth in coin. A blank leaf is 20 and a Master
 *               scroll is 2000, and the difference is the Quartz. **A fading one
 *               is worth nothing**: there is no Quartz in it and the card says
 *               no merchant will take one.
 *   art         the spell's own plate. A scroll of Fireball is drawn as
 *               Fireball, which is the picture a player is looking for on a
 *               belt loop, and `artOwn` stays false because that plate is the
 *               codex's rather than the player's. See useCodexArt.js.
 */
export function scrollItem(item, record) {
  const scroll = normalizeScroll(record?.scroll);
  if (!item || !scroll) return item;

  const spell = scrollSpell(scroll.spell);
  const tier = scrollTier(spell);

  const tags = [...item.tags];
  if (tier && !tags.includes(`${tier} Scroll`)) tags.push(`${tier} Scroll`);
  if (scroll.ephemeral && !tags.includes('Ephemeral')) tags.push('Ephemeral');

  return {
    ...item,
    scroll,
    name: record.name ?? scrollTitle(scroll),
    tags,
    abilities: [spell.id],
    cost: scroll.ephemeral ? 0 : scrollCoins(spell) || item.cost,
    ...(record.art
      ? {}
      : { art_url: spell.art_url ?? null, art_thumb: spell.art_thumb ?? null, artOwn: false }),
  };
}

/**
 * What one scroll says on the row under its name: the rung, and the words on it.
 *
 * "Novice · Unseen and Repeat". Printed wherever a scroll is listed rather than
 * opened, which is the pack shelf, the still-warm rest plan and the party's
 * handover offer.
 */
export function scrollLine(scroll) {
  const spell = scrollSpell(scroll?.spell);
  if (!spell) return '';

  const said = [scrollTier(spell)];
  if (scroll.ephemeral) said.push('Ephemeral');

  const words = (scroll.words ?? []).map((id) => getPowerWord(id)?.name).filter(Boolean);
  if (words.length > 0) said.push(listAnd(words));

  return said.filter(Boolean).join(' · ');
}

/** "one, two and three". No Oxford comma. */
export function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
