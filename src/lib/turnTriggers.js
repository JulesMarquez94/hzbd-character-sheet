/**
 * What the things running on you owe at a turn boundary.
 *
 * The tracker has always counted turns. Counting is not the same as
 * *remembering*: a spore that deals damage at every Turn End, a spell that
 * wants 2 Willpower at every Turn Start or it stops, a mark that fires when the
 * target's turn comes round. All of that is printed on the card, the card is
 * one tap away on the row, and at a table nobody taps it. So the two presses
 * that move the turn stop and say what is about to happen first.
 *
 * ---------------------------------------------------------- read, never stored
 * Nothing here is a field on a card. The codex writes these boundaries in its
 * own words and writes them consistently, which is what makes them findable:
 *
 *   At your Turn Start, pay 2 Willpower to keep the spore in place.
 *   At your Turn End, the spore deals 2d6 + 8 damage to the target.
 *   ... and then again at each of your Turn Starts.
 *   ... taking 2d6 + 8 damage at each of its Turn Starts.
 *
 * So this reads the printed text, the same way `effectDuration` reads a duration
 * out of it. A card that says neither word has nothing to remind anybody of and
 * never reaches the prompt.
 *
 * ------------------------------------------------------ until is not a trigger
 * **The one thing that had to be told apart.** "rooted until its next Turn End"
 * names the same boundary and means the opposite thing: it is a duration, the
 * tracker is already counting it, and a reminder firing every turn to say a root
 * ends eventually is noise on top of a number that already says so. So a
 * boundary with `until` in front of it is skipped, and the count on the row is
 * left to do its job.
 *
 * -------------------------------------------------------------- what comes back
 * Whole sentences, resolved for the character holding the row, because the
 * reminder is read while something else is happening and "2d6 + 8" is worth more
 * than "[[2d6 + 2*stat]]". A toll rides along when the card's Upkeep half is the
 * thing that matched, since what it costs is the whole question at a Turn Start.
 *
 * Plus the two things the press itself does, which are printed nowhere: what
 * runs out on this tick, and what gets swept off the block.
 *
 * This file reads cards and an effects list. It writes nothing.
 */

import { cardGist } from './cardText.js';
import { getCard } from './weapons.js';
import { brokenRows, normalizeEffects } from './combatTurn.js';
import { secondHalf } from './overcast.js';
import { statusOf } from './statuses.js';

/**
 * The boundary, as the codex writes it.
 *
 * Two spellings each, and both are in the codex today. `Turn Start` is the
 * keyword form and the one most cards use; "the start of each of your turns" is
 * the longhand a handful of older cards kept. The plural matters: "at each of
 * its Turn Starts" is the commonest phrasing of a recurring one.
 *
 * **The keyword half is case-sensitive and the longhand half is not**, which is
 * the one thing keeping ELIXIR OF TIME off the Turn Start list: "At your Turn
 * End, time rewinds and your turn starts again" contains the letters of the
 * keyword and means a sentence. A keyword is capitalised everywhere the codex
 * prints one, so the capitals are the difference between the word and the word
 * being used.
 */
const BOUNDARY = {
  start: /Turn\s+Starts?\b|\b(?:start|beginning)\s+of\s+[\w' ]{0,30}?\bturns?\b/,
  end: /Turn\s+Ends?\b|\bend\s+of\s+[\w' ]{0,30}?\bturns?\b/,
};

/**
 * The same two, for a row somebody typed in by hand.
 *
 * Nobody writing "grappled, save at the start of my turn" into the note box is
 * following the codex's capitalisation, and they should not have to: the rule
 * above is about how the codex spells its own keywords, and this is not the
 * codex. So the note is read loosely and the card is read strictly.
 */
const WRITTEN = {
  start: new RegExp(BOUNDARY.start.source, 'i'),
  end: new RegExp(BOUNDARY.end.source, 'i'),
};

/** A duration wearing a boundary's clothes. See the note above. */
const DURATION = /\b(?:until|through)\b[\w' ]*$/i;

/** A boundary that is the caster's and not the holder's: "At your Turn End". */
const CASTERS = /\byour\s+Turn\s+(?:Start|End)s?\b/i;

/** How far back a boundary looks for the word that would disqualify it. */
const LOOKBACK = 30;

/** Where one sentence ends and the next begins, without splitting "1.5 meters". */
const BREAK = /([.!?])\s+(?=[A-Z"'([])/;

/**
 * Everything one boundary is about to set off, ready for the prompt.
 *
 * `when` is 'start' or 'end'. A Turn Start is the heavier of the two: it is the
 * one that ticks, so it also carries what expires and what gets swept.
 */
export function turnTriggers(character, when) {
  const effects = normalizeEffects(character?.effects);
  const rows = [];

  for (const effect of effects) {
    /* A row that has run out is sitting on the block to be noticed, not doing
       anything. It owes nothing at either boundary. */
    if (effect.turns === 0) continue;

    const found = effectTriggers(effect, character, when);
    if (found) rows.push(found);
  }

  /* And what the press itself does, which only Start does. A counted row loses a
     turn, so a row on 1 is a row that ends here, and the rows already showing
     "Ended" are swept the moment the next turn begins. Neither is printed on any
     card, and both are the kind of thing worth saying before it happens rather
     than after. */
  const ending = when === 'start' ? effects.filter((effect) => effect.turns === 1) : [];
  const clearing = when === 'start' ? effects.filter((effect) => effect.turns === 0) : [];

  /* And the one thing the *end* of a turn does. A row its card says acting
     breaks, that has been acted through, comes off on this press. Same argument
     as the two above: it is not printed on any card as a thing that happens now,
     and being told you are about to be found is worth more than finding the row
     gone afterwards. See `brokenRows` in combatTurn.js. */
  const breaking = when === 'end' ? brokenRows(effects) : [];

  return {
    when,
    rows,
    ending,
    clearing,
    breaking,
    any: rows.length > 0 || ending.length > 0 || clearing.length > 0 || breaking.length > 0,
  };
}

/**
 * One row's business at this boundary, or null when it has none.
 *
 * Three texts are read, in the order a player would read them: the card's main
 * body, its second half, then whatever was typed into the row by hand. The
 * hand-written note is in there because a condition the codex has never heard of
 * still gets tracked, and "at the start of my turn, save against this" is exactly
 * the sort of thing somebody types into one.
 */
function effectTriggers(effect, character, when) {
  const card = getCard(effect.card);
  /* A condition row sits on the body the card was aimed at, so the card's
     "your" is somebody else: "At your Turn End, it snaps" is the caster's
     boundary and not the swallowed one's. The clauses about the holder ("at
     its Turn Start", "at each of their Turn Starts") are the ones kept, and the
     Upkeep half is dropped outright, because a toll is only ever the caster's
     to pay. See statuses.js. */
  const status = statusOf(effect.status);
  const theirs = (lines) => (status ? lines.filter((line) => !CASTERS.test(line)) : lines);
  const body = card ? theirs(matches(cardGist(card, { character }), when)) : [];
  /* The second half, which is where every Upkeep lives. Resolved the same way
     the main body is, so a toll written as a live number reads as one. */
  const half = card && !status ? matches(cardGist(card, { character, part: 'sub' }), when) : [];
  /* And what the condition itself does at a boundary, in the glossary's words:
     a stack of Bleed has no card sentence of its own to read. */
  const said = status?.at ? matches(status.at, when) : [];
  const written = matches(effect.note, when, WRITTEN);

  const clauses = [...body, ...half, ...said, ...written];
  if (clauses.length === 0) return null;

  return {
    id: effect.id,
    name: effect.name,
    from: effect.from,
    card: effect.card,
    status: effect.status ?? null,
    turns: effect.turns,
    clauses,
    /* The price rides along only when the half is what matched. Every Upkeep in
       the codex but one is paid at a Turn Start, and that one is paid at a rest:
       reading the boundary off its own prose is what keeps it off this list,
       rather than a rule written here about which card it is. */
    toll: half.length > 0 ? tollOf(card) : null,
  };
}

/** What an Upkeep asks for, or null for a half that is not one. */
function tollOf(card) {
  const half = secondHalf(card);
  if (half?.kind !== 'toll') return null;
  return half.ap > 0 || half.wp > 0 ? { ap: half.ap, wp: half.wp } : null;
}

/**
 * The sentences in one block of text that name this boundary and mean it.
 *
 * Whole sentences rather than the matched phrase, because "At your Turn Start"
 * on its own is not a reminder of anything. What follows it is the reminder.
 */
function matches(text, when, table = BOUNDARY) {
  const pattern = table[when];
  if (!pattern) return [];

  return sentences(text).filter((line) => {
    const hit = pattern.exec(line);
    if (!hit) return false;

    /* See the note at the top: a boundary with `until` in front of it is a
       duration the row's own count is already keeping. */
    const before = line.slice(Math.max(0, hit.index - LOOKBACK), hit.index);
    return !DURATION.test(before);
  });
}

/**
 * One block of text as sentences.
 *
 * Split on the punctuation *and* a following capital, which is what keeps "1.5
 * meters (5 feet)" and "2.5 cm (1 inch)" in one piece. Walked rather than done
 * with a lookbehind, so the pattern reads the same wherever it runs.
 */
function sentences(text) {
  const out = [];

  for (const paragraph of String(text ?? '').split(/\n+/)) {
    let rest = paragraph;
    let hit = BREAK.exec(rest);

    while (hit) {
      out.push(rest.slice(0, hit.index + 1));
      rest = rest.slice(hit.index + hit[0].length);
      hit = BREAK.exec(rest);
    }

    out.push(rest);
  }

  return out.map((line) => line.trim()).filter(Boolean);
}
