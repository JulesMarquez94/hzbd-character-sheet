/**
 * A chain of rows: a use, and the throws it set off.
 *
 * Split out of campaignLog.js and kept free of every import that talks to the
 * network. Everything here is a pure function of rows, which is what lets
 * scripts/check-log.mjs run it under Node: campaignLog.js reaches the Supabase
 * client, and the client reads `import.meta.env`, which only exists inside a
 * Vite build. A rule that cannot be checked is a rule that drifts.
 *
 * The reading half of this file is the part worth being careful with. See the
 * note above groupEvents for the two rules it obeys, and the checker for what
 * happens to the rows that do not fit them.
 */

import { rollWorking } from './dice.js';
/* ---------------------------------------------------------------- the chain
 * A use and the rolls it sets off are one thing at the table and several rows
 * here, so they are tied together by an id minted on the client before any of
 * them is written.
 *
 * Not the parent row's own id, for two reasons and the first is fatal on its
 * own:
 *
 *   One action is N rows. A character sitting at three campaigns writes the
 *   same use three times, so "the parent's id" is three different ids and a
 *   child would have to be told which one it belongs to per table. A chain is
 *   one string, and it is the same string on every table.
 *
 *   And a roll must not wait on a write. Reading an inserted row back means a
 *   round trip between pressing use and being allowed to throw, over a log
 *   that is explicitly allowed to fail. See postEvent: the points have already
 *   left the pool, and a table that cannot be reached must not stop the dice.
 *
 * The rows are therefore free to arrive in any order, or partly not at all. A
 * chain with no head on the page reads as loose rolls rather than as an error,
 * which is also what a chain split across a page boundary looks like.
 */

/** A new chain id. One per use, stamped on the use and on every roll under it. */
export function newChain() {
  return globalThis.crypto?.randomUUID?.() ?? `c${Date.now()}${Math.random().toString(36).slice(2)}`;
}

/** What each link in a chain is called, when it is not called what the player typed. */
const STEP_WORDS = {
  weapon: 'Weapon Attack Roll',
  attack: 'Attack Roll',
  attribute: 'Attribute Roll',
  skill: 'Skill Check',
  check: 'Roll',
  damage: 'Damage',
  healing: 'Healing',
  shield: 'Shield',
};

/**
 * One throw, as an event.
 *
 * Built from the settled result rather than from the spec that asked for it, so
 * the log cannot report a roll that did not happen. `detail` is the working and
 * the row prints the total and the verdict itself off `data`, which is the split
 * `rollWorking` exists for.
 *
 * Every die is written down. It costs a little room in the jsonb and it buys the
 * two things a log is for: a reader months later can see that the 27 was four
 * dice and a burst rather than a typo, and another player's client can put the
 * same faces on its own table. See phase 5.
 */
export function rollEvent(
  result,
  character,
  { chain = null, card = null, name = '', damage = [] } = {}
) {
  const step = result?.kind ?? 'attack';

  return {
    kind: 'roll',
    actor: character?.name ?? '',
    title: name || STEP_WORDS[step] || 'Roll',
    detail: rollWorking(result),
    data: {
      chain,
      step,
      card,
      portrait: character?.portrait_url ?? null,
      /* What kind of damage, for the summary line under the rolls: "Dealt 17
         Necrotic damage". The card's own types, already swapped for whatever an
         enchantment turned them into, because the summary has to name the damage
         that was actually dealt. */
      damage,
      shape: result?.shape ?? 'check',
      dice: result?.dice ?? [],
      flat: result?.flat ?? 0,
      total: result?.total ?? 0,
      dc: result?.dc ?? null,
      verdict: result?.verdict ?? null,
      /* Whether the table said what it was rather than the sheet working it out.
         Worth keeping: a verdict nobody could compute is a different kind of
         fact from one the DC decided. */
      called: Boolean(result?.calledByHand),
    },
  };
}

/* ------------------------------------------------------------- the summary
 *
 * What a whole entry came to, in one sentence, under the rolls that got there.
 *
 * A chain is a sequence of numbers and a reader scanning a fight wants the
 * answer, not the arithmetic: "Dealt 17 Necrotic damage" is the thing somebody
 * shouts across the table, and the dice above it are the receipt. Jules asked
 * for a line on every outcome including a miss, which is the version that never
 * leaves a reader wondering whether the block is still loading.
 */

/** What each kind of value roll was worth, as a noun. */
const WORTH = {
  damage: 'damage',
  healing: 'Health',
  shield: 'Shield',
  roll: '',
};

/**
 * How a critical reads, per verb.
 *
 * "Critical attack with Flurry" rather than "Critically attacked with Flurry",
 * because the first is what somebody says out loud. The verbs are the three
 * `verbFor` produces in campaignLog.js and no others.
 */
const CRIT_NOUN = {
  'attacked with': 'attack',
  cast: 'cast',
  used: 'use',
};

/** "attacked with" as "Attacked with". */
function opened(verb) {
  return verb ? verb[0].toUpperCase() + verb.slice(1) : 'Played';
}

/**
 * The line under the rolls, or null when there is nothing to summarise.
 *
 * One sentence naming what was played and what it came to: "Attacked with Flurry
 * for 25 Necrotic damage." On Jules's instruction of 2026-08-31 it says the card
 * as well as the number, because the summary is the line somebody reads out and
 * "Dealt 25 damage" on its own leaves out the half that makes it a story.
 *
 * A critical rewrites the opening rather than adding a word to it: "Critical
 * attack with Flurry for 25 Necrotic damage."
 *
 * Read off the throws for the numbers and off the head for the name, because the
 * head knows what was played and only the throws know what came of it.
 */
export function chainSummary(rolls = [], head = null) {
  if (rolls.length === 0) return null;

  const checks = rolls.filter((row) => row.data?.shape === 'check');
  const values = rolls.filter((row) => row.data?.shape === 'value');

  /* A miss ends a chain, so a check that failed and nothing after it is the
     whole story. See usePlayCard: the damage was never rolled.

     Only an *attack* misses. A Skill Check that fell short did not miss anything,
     and "Missed." under a failed attempt to climb a cliff is the summary saying
     something the roll never said. The band on the entry already reads FAILURE,
     so there is nothing left for a line to add and it stays quiet. */
  const failed = checks.filter(
    (row) => row.data?.verdict === 'failure' || row.data?.verdict === 'critical-failure'
  );
  if (failed.length > 0 && values.length === 0) {
    if (!failed.some((row) => (row.data?.step ?? 'attack') === 'attack')) return null;
    return failed.some((row) => row.data?.verdict === 'critical-failure')
      ? 'Missed badly.'
      : 'Missed.';
  }

  if (values.length === 0) {
    /* A check that landed and asked for nothing else. Its own row already prints
       the total and the verdict, so there is nothing a summary could add. */
    return null;
  }

  /* Every value throw of the same kind added up, because three landings of a
     Flurry are one number at the table. Kept in the order they were thrown so a
     card that damages and heals reads in the order the card does. */
  const totals = new Map();
  for (const row of values) {
    const kind = row.data?.step ?? 'damage';
    const was = totals.get(kind) ?? { total: 0, types: new Set() };
    was.total += Number(row.data?.total) || 0;
    for (const type of row.data?.damage ?? []) was.types.add(type);
    totals.set(kind, was);
  }

  const said = [...totals].map(([kind, sum]) => {
    /* "Fire or Cold" the way the card prints a choice of types, and nothing at
       all where the card never named one. */
    const type = [...sum.types].join(' or ');
    return [sum.total, type, WORTH[kind] ?? WORTH.damage].filter(Boolean).join(' ');
  });

  const worth = `for ${listAnd(said)}`;
  const verb = head?.data?.verb ?? '';
  const what = head?.title ?? '';

  /* A throw with no use above it: a roll off the tray. It has no card to name, so
     the sentence has nothing to open with and the numbers stand alone. */
  if (!what) return `Rolled ${listAnd(said)}.`;

  const crit = checks.some((row) => row.data?.verdict === 'critical-success');
  if (crit) return `Critical ${CRIT_NOUN[verb] ?? 'use'} with ${what} ${worth}.`;

  return `${opened(verb)} ${what} ${worth}.`;
}

/** "a, b and c". No Oxford comma, the way every list on the sheet is written. */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/* ----------------------------------------------------------------- replaying
 *
 * Every die that was thrown is written into the row (see rollEvent), which is
 * what lets somebody else's roll land on somebody else's screen showing the same
 * faces. The dice were decided once, by the client that threw them, and every
 * other client is a renderer being told what happened. That is the whole reason
 * dice.js settles a result before anything draws it.
 *
 * So a replay needs no physics agreement, no shared seed and no server. It needs
 * a row.
 */

/**
 * A log row read back as a result the surface can draw.
 *
 * The same shape `rollCheck` and `rollValue` hand back, because it is the same
 * thing: `rollEvent` wrote every field out and this reads them in. Nothing is
 * recomputed. A replay that added up the dice itself could disagree with the
 * total the thrower was shown, and two players reading different numbers off the
 * same roll is the one failure this whole design exists to prevent.
 */
export function resultFromRow(row) {
  const data = row?.data;
  if (!data || !Array.isArray(data.dice)) return null;

  return {
    shape: data.shape ?? 'check',
    kind: data.step ?? 'attack',
    dice: data.dice,
    flat: Number(data.flat) || 0,
    dc: data.dc ?? null,
    total: Number(data.total) || 0,
    verdict: data.verdict ?? null,
    calledByHand: Boolean(data.called),
    parts: [],
  };
}

/** How long after a roll was written it is still worth watching, in seconds. */
export const REPLAY_WINDOW = 25;

/**
 * And how many can be waiting to play before the rest are dropped to the log.
 *
 * Applied by the tray, which is where the queue is. This file only knows about
 * one row at a time.
 */
export const REPLAY_DEPTH = 3;

/**
 * Whether a row that just arrived should be put on the table, or only read.
 *
 * Three ways a roll is not worth replaying, and all three are about respecting
 * whoever is sitting there:
 *
 *   it is yours       you have already watched these dice. Seeing them again a
 *                     second later, from the round trip, would be the sheet
 *                     stuttering rather than the table sharing.
 *   it is stale       a laptop that has been shut for an hour reconnects and the
 *                     channel catches up. Those rolls are history and belong in
 *                     the feed, not in an animation over the page.
 *
 * The queue being full is the third way, and it is not decided here: this file
 * sees one row and the tray holds the queue. See REPLAY_DEPTH.
 *
 * Nothing here hides a roll. Every row still lands in the block underneath. This
 * only decides what is worth interrupting somebody to show them.
 */
export function worthReplaying(row, { mine = null, now = Date.now() } = {}) {
  if (row?.kind !== 'roll') return false;
  if (!Array.isArray(row?.data?.dice) || row.data.dice.length === 0) return false;

  /* `mine` is a list, because a player may have two sheets at one table and a
     Game Master watching the campaign page has none. One id is allowed as a
     shorthand for a list of one. */
  const ours = [].concat(mine ?? []).filter(Boolean);
  if (ours.includes(row.character_id)) return false;

  const at = new Date(row?.created_at ?? '').getTime();
  // A row with no readable stamp is treated as live: it just arrived down a
  // channel that only carries new rows.
  if (Number.isNaN(at)) return true;
  return now - at <= REPLAY_WINDOW * 1000;
}

/* ------------------------------------------------------------ reading a chain
 *
 * The feed is flat, insert only and newest first. A chain has to read as one
 * block with its throws under it, so the rows are gathered back up here.
 *
 * Two rules, both of which look odd written down and are obvious on screen:
 *
 *   A group sits where its **newest** row sits. A fight is read from the top,
 *   and a chain that has just been given its damage roll is the thing that just
 *   happened. Anchoring on the head would let a live chain sink down the feed
 *   as other people acted.
 *
 *   A group reads **oldest first inside itself**. The feed runs backwards
 *   because you want the last thing first; a chain runs forwards because it is
 *   a sequence, and "damage 17" above "attack 12, success" is the story told
 *   back to front.
 */

/**
 * The feed as `[{ key, head, rolls }]`, newest group first.
 *
 * A row that is not part of a chain comes back as its own group with no rolls,
 * so the caller renders one list and never asks which sort of row it is holding.
 * A throw whose head is not on this page comes back the same way: the head is
 * older, so it is one page down, and a roll that refused to draw until you
 * pressed Older would be a worse answer than a roll standing on its own.
 */
export function groupEvents(events) {
  const list = events ?? [];

  /* A head is any row that carries a chain and is not itself a throw. Today that
     is the use; a rest or a turn could grow one without changing this. */
  const heads = new Map();
  for (const row of list) {
    const chain = row?.data?.chain;
    if (chain && row.kind !== 'roll' && !heads.has(chain)) heads.set(chain, row);
  }

  const throws = new Map();
  for (const row of list) {
    const chain = row?.data?.chain;
    if (!chain || row.kind !== 'roll' || !heads.has(chain)) continue;
    if (!throws.has(chain)) throws.set(chain, []);
    throws.get(chain).push(row);
  }
  // The feed handed them over newest first. A chain reads the other way.
  for (const rows of throws.values()) rows.reverse();

  const out = [];
  const seen = new Set();
  for (const row of list) {
    const chain = row?.data?.chain;
    if (!chain || !heads.has(chain)) {
      out.push({ key: row.id, head: row, rolls: [] });
      continue;
    }
    if (seen.has(chain)) continue;
    seen.add(chain);
    out.push({ key: chain, head: heads.get(chain), rolls: throws.get(chain) ?? [] });
  }

  return out;
}

/* --------------------------------------------------------- reading a fight
 *
 * "In the log when we have turns all actions under 1 turn are bundled under it
 * in a X name turn 1 block", Jules, 2026-08-31.
 *
 * A fight is a sequence of turns and every turn has a handful of things in it.
 * Flat, that reads as forty rows nobody can find anything in; bundled, it reads
 * as the fight: Turn 4, Kaelen, and the three things Kaelen did.
 *
 * This is the second gathering, over the top of `groupEvents`: chains first
 * (a use and its throws), then turns (a turn and its uses).
 */

/** Whether a row opens a turn: the runner's own call, or the sheet's Turn
    button. Ending one does not open the next, and neither does entering combat:
    those are rows *inside* whatever turn is running. */
function opensTurn(event) {
  if (event?.kind !== 'turn') return false;
  const move = event?.data?.move;
  return move === 'your-turn' || move === 'turn';
}

/**
 * The feed as `[{ key, turn, groups }]`, newest bundle first.
 *
 * `turn` is the row that opened it, or null for the bundle at the tail: rows
 * that happened before any turn on this page, which is everything on a table
 * that is not in a fight and the top of the very first page of one that is.
 * A caller draws that bundle bare, with no head over it.
 *
 * The feed arrives newest first. A turn is opened by its row and everything
 * *newer* than that row belongs to it, so walking the list forwards accumulates
 * the contents and the turn row that closes a bundle is the one that heads it.
 *
 * Inside a bundle the groups keep the feed's own order, which the block reverses
 * along with everything else: the block reads oldest at the top.
 */
export function bundleTurns(groups) {
  const out = [];
  let held = [];

  for (const group of groups ?? []) {
    if (opensTurn(group.head) && group.rolls.length === 0) {
      out.push({ key: group.key, turn: group.head, groups: held });
      held = [];
      continue;
    }
    held.push(group);
  }

  /* Whatever is left happened before the oldest turn on this page. It gets a
     bundle with no head rather than being dropped, because a table that is not
     in a fight is *all* tail and must still read. */
  if (held.length > 0) out.push({ key: 'loose', turn: null, groups: held });

  return out;
}

/** How many rows a bundle holds, its own head included. What the fold prints. */
export function bundleCount(bundle) {
  return (bundle?.groups ?? []).reduce((sum, group) => sum + 1 + group.rolls.length, 0);
}
