/**
 * Second-half round trip. Proves the one promise src/lib/overcast.js makes:
 * **every card that prints an Overcast, a Multicast, a Blood Tithe or an Upkeep
 * has that half's price read off its own prose.**
 *
 * That promise is the whole risk of the file. Nothing anywhere carries a second
 * copy of what a second half costs, on purpose: a copy is a number that can
 * disagree with the card it is printed beside, and the card is what the table
 * reads. The cost of doing it that way is that a card reworded tomorrow can slip
 * out of the parse and lose its option in silence, with the prose still reading
 * perfectly well to a human. So the parse is checked rather than trusted.
 *
 *   node scripts/lint-halves.mjs         report and exit 1 on any card missed
 *   node scripts/lint-halves.mjs --list  print every half read, then exit 0
 *
 * `CARDS` is the whole registry and anything printable has to be in it, so a
 * card added to any codex file is covered here without this script being
 * touched. The starter deck rides along separately because it is seed data for
 * an empty Abilities tab rather than codex, and two of its four spells carry a
 * Blood Tithe written in plain words instead of tokens.
 *
 * A finding is one of three things:
 *
 *   unnamed   the card carries a second half under a name that is not one of
 *             the designer's four, so nothing will ever offer or track it
 *   unread    the card names a half and the parse found no price in it
 *   unpriced  a Blood Tithe that takes no Health off a sheet that has
 *             attributes, which means the attribute it names was not read
 */

import { CARDS } from '../src/lib/weapons.js';
import { STARTER_DECK } from '../src/lib/starterDeck.js';
import { costWords, halfPrice, secondHalf } from '../src/lib/overcast.js';

const LIST = process.argv.includes('--list');

/** The four the codex uses. Anything else on a card is a half nobody handles. */
const NAMES = ['Overcast', 'Multicast', 'Blood Tithe', 'Upkeep'];

/** Somebody to price a tithe against. Only the attributes matter here. */
const WHO = { physique: 4, instinct: 4, mind: 4, level: 4 };

const rows = [
  ...CARDS.map((card) => ({ card, where: 'codex' })),
  ...STARTER_DECK.map((card) => ({ card, where: 'starter deck' })),
].filter(({ card }) => card?.sub_name);

const findings = [];

for (const { card, where } of rows) {
  const name = card.sub_name;
  const half = secondHalf(card);
  const opening = String(card.sub_body ?? '').split('\n\n')[0];

  if (!NAMES.includes(name)) {
    findings.push({ card: card.name, where, says: `"${name}" is not one of the four names` });
    continue;
  }

  if (!half) {
    findings.push({ card: card.name, where, says: `${name}: no price found in "${opening}"` });
    continue;
  }

  const price = halfPrice(half, WHO, 1);

  if (name === 'Blood Tithe' && price.health === 0) {
    findings.push({
      card: card.name,
      where,
      says: `Blood Tithe: takes no Health off a sheet with attributes. "${opening}"`,
    });
    continue;
  }

  if (LIST) {
    const shape = half.kind === 'toll' ? 'toll' : half.instead ? 'instead' : 'on top';
    const often = half.each ? 'any number' : 'once';
    console.log(
      `  ${card.name.padEnd(22)} ${name.padEnd(12)} ${shape.padEnd(9)} ${often.padEnd(11)} ${costWords(price)}`
    );
  }
}

if (findings.length === 0) {
  console.log(`second halves: all ${rows.length} priced off their own prose`);
  process.exit(0);
}

console.log(
  `\nsecond halves: ${findings.length} of ${rows.length} ${findings.length === 1 ? 'card is' : 'cards are'} not priced\n`
);
for (const { card, where, says } of findings) console.log(`  ${card} (${where})\n    ${says}`);
process.exit(LIST ? 0 : 1);
