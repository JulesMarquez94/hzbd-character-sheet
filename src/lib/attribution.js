/**
 * Who is changing this card, and by how much.
 *
 * The sheet has always known how to *fold* a modifier in. A weapon's enchantment
 * Empowers the damage, a Duelist's DEXTEROUS lends an arrow for holding a Finesse
 * blade, a pact's rank Elevates the die, a spell's set boosts every card in the
 * book, something on the tracker changes what the blade is made of. All of it
 * lands on the printed card correctly and almost none of it said where it came
 * from.
 *
 * Jules, 2026-08-28, testing: "My finesse pact bound weapon as two adventage and
 * on the action view I dont see the source. It is also empowred and I dont see
 * the source below the action buttons. Everything that is modified need to be
 * seen but only what modifies it. So if my spells are empowerd because of talents
 * I should see on the side below the action buttons. No exceptions."
 *
 * ------------------------------------------------------------------- the ledger
 * So every fold now keeps a receipt, and this is the shape of one:
 *
 *   { from: 'Fire Infusion', gives: { empower: 1, damage: ['Fire'] } }
 *
 * `from` is the name a reader can go and look up: a card, an enchantment, a
 * talent set. Never a number and never a mechanism. `gives` is only what that one
 * source contributed, so two sources of advantage are two rows and the reader can
 * see which is which.
 *
 * The rows ride on the modifiers object as `sources`, beside the sums they were
 * built from. Nothing reads them to do arithmetic: the sums are still the truth
 * and this is the account of them, which is why a row that gives nothing is never
 * written.
 *
 * ----------------------------------------------------- the older, thinner fields
 * `advantageFrom` and `apCutFrom` came first, are plain lists of names, and are
 * left exactly as they are: the arrow badge and the cost orb both read them, and
 * both of those have room for a name and no room for a sentence. This is the
 * complete version for the one place that has room for all of it.
 *
 * This file imports nothing. It is reached from weapons.js, loadouts.js, moves.js
 * and the use prompt, and anything it pulled in would be pulled into all four.
 */

/** The keys a source can contribute, in the order a reader wants them. */
const GIVES = ['advantage', 'disadvantage', 'empower', 'elevate', 'bonus', 'apCut'];

/**
 * One receipt, or null when the source gave nothing.
 *
 * The null is the whole discipline of this file. A Duelist set that grants a
 * point of Defense for holding a Finesse weapon is not changing this attack, and a
 * row crediting it here would be the sheet pointing at a number that never moved.
 * "only what modifies it."
 */
export function sourceRow(from, gives) {
  if (!from) return null;

  const kept = {};
  for (const key of GIVES) {
    const amount = Math.floor(Number(gives?.[key]) || 0);
    if (amount !== 0) kept[key] = amount;
  }

  const damage = (gives?.damage ?? []).filter(Boolean);
  if (damage.length > 0) kept.damage = [...damage];

  // A cast attribute is not a number and still changes every roll on the card.
  if (gives?.stat) kept.stat = String(gives.stat);

  return Object.keys(kept).length > 0 ? { from: String(from), gives: kept } : null;
}

/**
 * Several lists of receipts as one, in the order they were handed in, with the
 * empties dropped.
 *
 * Not deduplicated. Two rows naming the same source are two contributions from
 * it, which is a thing that happens: a Colossus at Rank 3 gets an Elevate from
 * COLOSSAL FORCE and a die per move from PERFECT TECHNIQUE, and both are its.
 */
export function mergeSources(...lists) {
  return lists.flat().filter(Boolean);
}

/**
 * What one receipt says, in words.
 *
 * The same vocabulary the cards use, because the reader has just read a card:
 * Empowered, Elevated, Advantage. Never a plus sign in front of a number the
 * codex has a word for.
 */
export function sourceWords(gives) {
  const said = [];

  if (gives.advantage) said.push(times('Advantage', gives.advantage));
  if (gives.disadvantage) said.push(times('Disadvantage', gives.disadvantage));
  if (gives.empower) said.push(`Empowered by ${gives.empower}`);
  if (gives.elevate) said.push(`Elevated by ${gives.elevate}`);
  if (gives.bonus) said.push(`${gives.bonus > 0 ? '+' : ''}${gives.bonus} damage`);
  if (gives.apCut) said.push(`${gives.apCut} Action ${gives.apCut === 1 ? 'Point' : 'Points'} off`);
  if (gives.damage) said.push(`deals ${listAnd(gives.damage)}`);
  if (gives.stat) said.push(`rolled off ${capitalise(gives.stat)}`);

  return said.join(', ');
}

/** "Advantage", "Advantage x2". The badge counts d4s; this counts them the same way. */
function times(word, count) {
  return count > 1 ? `${word} x${count}` : word;
}

/** "Fire", "Fire and Decay". No Oxford comma. */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function capitalise(word) {
  const text = String(word);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
