/**
 * Card text round trip. Proves the promises docs/card-text.md makes:
 * **every card fits its printed box at readable size, and the system sentences
 * are spelled one way.**
 *
 *   node scripts/lint-cards.mjs         report and exit 1 on any finding
 *   node scripts/lint-cards.mjs --list  print every card over the 450 target
 *
 * The budget is the one measured against the real renderer on 2026-08-26
 * (409 cards, docs/card-text.md section 1): a card's load is its prose
 * characters plus 30 for each paragraph break plus 100 for an optional second
 * half. At 480 or less it prints at full size. Past 600 it falls under 0.9
 * fit, which is fine print, so 600 fails the build.
 *
 * The wording checks are the mechanical half of the doc's section 4 to 6:
 * the spellings that used to drift ("18 Meter", "in {damage} damage",
 * "If you do so", a half naming its own card, a lowercase "long rest").
 * Anything subtler than a spelling stays a human's call and is not here.
 */

import { CARDS } from '../src/lib/weapons.js';
import { STARTER_DECK } from '../src/lib/starterDeck.js';
import { cardProse } from '../src/lib/cardText.js';

const LIST = process.argv.includes('--list');

/** The measured budget. See docs/card-text.md, section 1. */
const BREAK_COST = 30;
const HALF_COST = 100;
const TARGET = 480;
const CEILING = 600;

const findings = [];
const note = (card, said) => findings.push(`  ${card}\n    ${said}`);

/** Prose characters plus what the layout itself costs. */
function loadOf(card) {
  const text = String(card.body ?? '') + (card.sub_body ? '\n\n' + card.sub_body : '');
  const breaks = text.split(/\n\s*\n/).length - 1;
  const prose = cardProse(card.body ?? '').length + cardProse(card.sub_body ?? '').length;
  return prose + BREAK_COST * breaks + (card.sub_name ? HALF_COST : 0);
}

/* One row per spelling the codex settled. Matched against body and sub_body,
   markers left on: none of these spellings hides inside a token. */
const SPELLINGS = [
  [/\d+(?:\.\d+)?\s+Meters?\s*\(/, 'measurements are lowercase: "9 meters (30 feet)"'],
  [/\bFeet\)|\bFoot\)/, 'measurements are lowercase: "(30 feet)", "(20-foot)"'],
  [/ in \{damage/, 'damage is dealt plain: "deal X {damage} damage", never "in"'],
  [/ as \{damage/, 'damage is dealt plain: "deal X {damage} damage", never "as"'],
  [/ in Health\b/, 'Health is restored plain: "restore X Health", never "in Health"'],
  [/ in Shield\b/, 'Shield is gained plain: "gain X Shield", never "in Shield"'],
  [/If you do so/, 'a one-shot half resolves with "If you do,"'],
  [/\blong rests?\b|\blong Rests?\b|\bLong rests?\b/, 'the rest is a proper noun: "Long Rest"'],
  [/\bshort rests?\b|\bshort Rests?\b|\bShort rests?\b/, 'the rest is a proper noun: "Short Rest"'],
];

const rows = [
  ...CARDS.map((card) => ({ card, where: 'codex' })),
  ...STARTER_DECK.map((card) => ({ card, where: 'starter deck' })),
];

const over = [];

for (const { card, where } of rows) {
  const name = `${card.name} (${where})`;
  const load = loadOf(card);
  if (load > CEILING) {
    note(name, `load ${load} is past the ${CEILING} ceiling: this card prints as fine print`);
  } else if (load > TARGET) {
    over.push({ name, load });
  }

  for (const [field, text] of [['body', card.body], ['sub_body', card.sub_body]]) {
    if (!text) continue;

    for (const [pattern, said] of SPELLINGS) {
      const hit = pattern.exec(text);
      if (hit) note(name, `${field} says "${hit[0]}", and ${said}`);
    }

    /* A single newline renders as a space and reads as an accident in the
       source: a break is a blank line or nothing. */
    if (/[^\n]\n[^\n]/.test(text)) {
      note(name, `${field} holds a lone \\n: a paragraph break is a blank line`);
    }

    /* The article is baked into the body, so it has to match the card's own
       stat: "an {stat}" is Instinct's, "a {stat}" is everyone else's. */
    const stat = card.stat;
    if (stat === 'instinct' && /\ba \{stat\}/.test(text)) {
      note(name, `${field} says "a {stat}" and the card casts off Instinct: "an {stat}"`);
    }
    if ((stat === 'physique' || stat === 'mind') && /\ban \{stat\}/.test(text)) {
      note(name, `${field} says "an {stat}" and the card casts off ${stat}: "a {stat}"`);
    }
  }

  /* A second half never names its own card: the reader is holding it. */
  if (card.sub_body) {
    const opens = new RegExp(`^\\s*(?:When casting|While) ${escapeRegExp(card.name)}\\b`, 'i');
    if (opens.test(cardProse(card.sub_body))) {
      note(name, 'the second half opens by naming its own card: say "this spell"');
    }
  }
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ------------------------------------------------------------------ report */

if (LIST) {
  for (const { name, load } of over.sort((a, b) => b.load - a.load)) {
    console.log(`  ${String(load).padStart(4)}  ${name}`);
  }
  console.log(`\n${over.length} cards over the ${TARGET} target (ceiling ${CEILING}).`);
}

if (findings.length > 0) {
  console.error(`card text: ${findings.length} finding${findings.length === 1 ? '' : 's'}\n`);
  console.error(findings.join('\n\n'));
  process.exit(1);
}

console.log(
  `card text: ${rows.length} cards inside the ${CEILING} ceiling and spelled one way` +
    (over.length > 0 ? `, ${over.length} over the ${TARGET} target (--list to see them)` : '')
);
