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
  attack: 'Attack Roll',
  attribute: 'Attribute Roll',
  skill: 'Skill Check',
  damage: 'Damage',
  healing: 'Healing',
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
export function rollEvent(result, character, { chain = null, card = null, name = '' } = {}) {
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
