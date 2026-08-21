/**
 * The optional second half of a card, priced.
 *
 * Most spells in the codex carry one, and the designer's four names mean four
 * different things (the note at the top of spells.js is the source):
 *
 *   Overcast     spend more than the spell asks to make it do more
 *   Multicast    spend more to catch more targets with it
 *   Blood Tithe  pay in Health rather than Willpower
 *   Upkeep       a toll paid at every Turn Start to keep the spell running
 *
 * Until now all four were prose. The card printed them, the brief chipped the
 * name, and the player did the arithmetic at the table: "1 Action Point and 1
 * Willpower any number of times" is a price the sheet could read out and never
 * charged. This file reads it out, so the use prompt can offer the second half
 * as a thing you take and charge what taking it actually costs.
 *
 * ------------------------------------------------------- read, never restated
 * Every number here comes out of the card's own `sub_body`. Nothing is
 * transcribed a second time into a `sub_ap` field beside it, and that is the
 * whole design: a second copy of a price is a price that can disagree with the
 * card it is printed on, and the card is what the table reads. So the prose is
 * the source, and `npm run lint:halves` is the proof. It walks every card in
 * the codex carrying a `sub_name` and fails on any whose price this file cannot
 * find, so a card the parse cannot read is not quietly unpriced: it is a build
 * failure with the card's name in it.
 *
 * ------------------------------------------------------- on top, or instead
 * Overcast turned out to be two things wearing one name, and the difference
 * decides what the option costs:
 *
 *   on top   "When casting Barkskin, you may spend an additional 1 Action
 *            Point and 1 Willpower". A rider on this cast, so its price is
 *            added to the printed one.
 *   instead  "You can spend 2 Action Points and 4 Willpower to hurl the
 *            flame". A separate spend on a spell that is already up. The
 *            printed cost was paid on some earlier turn, so taking this pays
 *            the second half's price and nothing else.
 *
 * The tell is the opening clause. "When casting X" and "When X hits" happen
 * inside the cast. "While X is active", "You can spend", "Whenever you deal
 * damage" and "If you have any active Fire Seed" do not. Twelve of the
 * nineteen Overcasts are the second kind, so reading them all as riders would
 * have charged again for a cast paid for turns ago.
 *
 * One card in the codex says neither and cannot mean "later", so it carries
 * `sub_when: 'cast'` and says why on itself. That is the whole escape hatch:
 * a card may settle its own timing where its prose does not, the way a line of
 * copy may carry a `text-style-ok`. It is not a place to put a price.
 *
 * Upkeep is neither. It is not a choice made while casting, so it is never
 * offered as one: it comes back as a toll for the prompt to print, and
 * combatTurn.js goes on tracking it as the running effect it is.
 *
 * This file reads cards. It writes nothing and it changes no character.
 */

import { attributeOf, resolveValue } from './cardText.js';

/** The four names, and whether each is something you choose or something you owe. */
const HALVES = {
  Overcast: 'option',
  Multicast: 'option',
  'Blood Tithe': 'option',
  Upkeep: 'toll',
};

/* The price, anchored on the resource word rather than on the number, because
   the sentence around it is full of other numbers: CREATE WATER's second half
   opens "If there is at least 1 liter (0.25 gallons) of water within 9 meters
   (30 feet), you may spend 3 Action Points and 1 Willpower". */
const AP = /(\d+)\s+Action\s+Points?\b/i;
const WP = /(\d+)\s+Willpower\b/i;

/* What a tithe takes, as the cards write it: "Health equal to your {physique}
   [[physique]]", "a further Health equal to [[2*physique]]", and the starter
   deck's untokenised "Health equal to your Physique". */
const TITHE = /sacrifice\s+(?:a\s+further\s+)?Health\s+equal\s+to\s+(?:your\s+)?([^.]*)/i;
const LIVE = /\[\[([^\]]+)\]\]/;
const WORD = /([A-Za-z]+)/;

/* "any number of times" is how the codex says a step repeats. GIANT GROWTH says
   it as "3 Willpower for each additional entity you can touch", and every
   repeatable one restates it as "For each time you do" in its second paragraph.
   No one-shot says any of the three. */
const REPEATS = /any number of times|for each time you do|for each additional/i;

/* Inside the cast, or its own spend later. See the note above. `[^,]*` stops at
   the comma so CONTAINMENT SPHERE's "When a trapped entity attempts to break
   out of the sphere" cannot reach for a "hits" further down the sentence. */
const AT_CAST = /^\s*When\s+(?:casting\b|[^,]*\bhits\b)/i;

/**
 * What a card's second half is and what it costs, or null when the card has
 * none the sheet can price.
 *
 *   name     the designer's word for it, spelled as the card spells it
 *   kind     'option' for something you take, 'toll' for Upkeep
 *   ap/wp    what one step of it costs
 *   health   what one step takes off you, as a live expression ('2*physique')
 *   each     whether it may be taken any number of times
 *   instead  whether it is paid in place of the printed cost rather than on top
 */
export function secondHalf(card) {
  const name = card?.sub_name;
  const kind = HALVES[name];
  if (!kind) return null;

  const text = String(card?.sub_body ?? '');
  if (!text) return null;

  /* The price is always in the opening paragraph. The ones after it are what
     the spend buys, and they carry numbers of their own: GLACIAL ACCRETION's
     second paragraph deals damage "for each Ice Spike consumed". */
  const opening = text.split('\n\n')[0];

  const ap = Number(AP.exec(opening)?.[1]) || 0;
  const wp = Number(WP.exec(opening)?.[1]) || 0;
  const health = tithe(opening);

  // Nothing to charge is nothing to offer.
  if (ap === 0 && wp === 0 && !health) return null;

  /* The card's own ruling first, its opening clause second. See the note above:
     `sub_when` exists for the one half whose prose settles nothing. */
  const when = card.sub_when ?? (AT_CAST.test(opening) ? 'cast' : 'later');

  return {
    name,
    kind,
    ap,
    wp,
    health,
    each: kind === 'option' && REPEATS.test(text),
    instead: kind === 'option' && when !== 'cast',
  };
}

/** The attribute a Blood Tithe is paid in, as an expression `resolveValue` can do. */
function tithe(opening) {
  const clause = TITHE.exec(opening)?.[1];
  if (!clause) return null;

  // The authored token first: "[[2*physique]]" carries the multiplier with it.
  const live = LIVE.exec(clause)?.[1];
  if (live) return live.trim();

  /* And the starter deck's plain words second, checked against the attribute
     list so a sentence that happens to match the shape but names no attribute
     comes back as no price rather than as a price of nothing. */
  const word = WORD.exec(clause)?.[1]?.toLowerCase();
  return word && attributeOf(word, 'physique')?.key === word ? word : null;
}

/**
 * What taking it `times` times costs this character, in the three currencies a
 * card can ask for. A half that cannot be repeated is taken once or not at all,
 * however far the count is pushed.
 */
export function halfPrice(half, character, times = 1, stat = 'instinct') {
  const asked = Math.max(0, Math.floor(Number(times) || 0));
  const steps = half?.each ? asked : Math.min(1, asked);
  if (!half || steps === 0) return { ap: 0, wp: 0, health: 0 };

  return {
    ap: half.ap * steps,
    wp: half.wp * steps,
    health: half.health ? resolveValue(half.health, character, stat).flat * steps : 0,
  };
}

/**
 * How many times the pools as they stand could pay for, on top of a base cost
 * already committed. A hint and not a cap: the prompt lets you dial past it,
 * exactly as it lets you tap a way you cannot afford, because being told what
 * came up short is the point of asking.
 */
export function halfRoom(half, character, base, stat = 'instinct') {
  if (!half?.each) return 0;

  const step = halfPrice(half, character, 1, stat);
  const pools = [
    room(character?.ap, base?.ap, step.ap),
    room(character?.willpower, base?.wp, step.wp),
    room(character?.health, base?.health, step.health),
  ].filter((count) => count !== null);

  return pools.length > 0 ? Math.max(0, Math.min(...pools)) : 0;
}

/** How many steps one pool has left in it, or null when this step does not touch it. */
function room(pool, spent, step) {
  if (!step) return null;
  return Math.floor(Math.max(0, (Number(pool) || 0) - (Number(spent) || 0)) / step);
}

/** A price in words, for the readers who never see the orbs. */
export function costWords({ ap = 0, wp = 0, health = 0 } = {}) {
  const parts = [];
  if (ap > 0) parts.push(`${ap} Action ${ap === 1 ? 'Point' : 'Points'}`);
  if (wp > 0) parts.push(`${wp} Willpower`);
  if (health > 0) parts.push(`${health} Health`);
  if (parts.length === 0) return 'nothing';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
