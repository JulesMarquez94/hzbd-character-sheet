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
export function worthReplaying(row, { mine = null, table = false, now = Date.now() } = {}) {
  if (row?.kind !== 'roll') return false;
  if (!Array.isArray(row?.data?.dice) || row.data.dice.length === 0) return false;

  /* `mine` is a list, because a player may have two sheets at one table and a
     Game Master watching the campaign page has none. One id is allowed as a
     shorthand for a list of one. */
  const ours = [].concat(mine ?? []).filter(Boolean);
  if (ours.includes(row.character_id)) return false;

  /* A roll with no character on it is the table's own — an enemy's dice, thrown
     by the Game Master. On the Game Master's screen those are *theirs*: they
     just watched them land, and a replay a second later would be the tray
     stuttering. Everyone else watches them like anybody's. */
  if (table && !row.character_id) return false;

  const at = new Date(row?.created_at ?? '').getTime();
  // A row with no readable stamp is treated as live: it just arrived down a
  // channel that only carries new rows.
  if (Number.isNaN(at)) return true;
  return now - at <= REPLAY_WINDOW * 1000;
}

/* ------------------------------------------------------------ reading a chain
 *
 * The feed is flat, insert only and newest first. A chain has to read as one
 * block with everything it set off under it, so the rows are gathered back up
 * here.
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
 *
 * ------------------------------------------------------- one action, one entry
 * "Same an attack should not be 3 entries in the log", and "reacting should be
 * part of the action block not its own" (Jules, 2026-09-02). Both were the same
 * bug: a throw was the only row a chain gathered, so every *other* row an
 * action writes stood on its own. One swing at two goblins was the use, then
 * the verdicts, then the damage delivered, then whatever the reaction stack had
 * to say: five entries for one thing somebody did.
 *
 * So a chain gathers every row addressed to it, whatever kind it is, and the
 * kinds below are the ones that are never a head. They are all rows written
 * *about* an action that is already in the log:
 *
 *   roll     a throw the use raised
 *   verdict  the one total, judged per body it was aimed at
 *   apply    what landed on them
 *   effect   the row it laid on their trackers
 *   react    the stack: who stepped in, what came of it, and the action failing
 *   summon   the body it put on the table
 *
 * A row of one of these kinds whose head is not on the page still draws on its
 * own, exactly as an orphan throw always has. See the note on `groupEvents`.
 */
const UNDER = new Set(['roll', 'verdict', 'apply', 'effect', 'react', 'summon']);

/**
 * The feed as `[{ key, head, trail, rolls }]`, newest group first.
 *
 * `trail` is everything the action set off, oldest first, in the order the
 * table saw it: throws and the rows about them interleaved, because "missed
 * 3.Fenrat" belongs between the attack roll and the damage and nowhere else.
 * `rolls` is the throws out of that trail, for the summary and the verdict band,
 * which only ever ask about dice.
 *
 * A row that is not part of a chain comes back as its own group with an empty
 * trail, so the caller renders one list and never asks which sort of row it is
 * holding. A row whose head is not on this page comes back the same way: the
 * head is older, so it is one page down, and a roll that refused to draw until
 * you pressed Older would be a worse answer than a roll standing on its own.
 */
export function groupEvents(events) {
  const list = events ?? [];

  /* A head is any row that carries a chain and is not one of the kinds written
     under one. Today that is the use; a rest or a turn could grow a chain
     without changing this. */
  const heads = new Map();
  for (const row of list) {
    const chain = row?.data?.chain;
    if (chain && !UNDER.has(row.kind) && !heads.has(chain)) heads.set(chain, row);
  }

  const trails = new Map();
  for (const row of list) {
    const chain = row?.data?.chain;
    if (!chain || !UNDER.has(row.kind) || !heads.has(chain)) continue;
    if (!trails.has(chain)) trails.set(chain, []);
    trails.get(chain).push(row);
  }
  // The feed handed them over newest first. A chain reads the other way.
  for (const rows of trails.values()) rows.reverse();

  const out = [];
  const seen = new Set();
  for (const row of list) {
    const chain = row?.data?.chain;
    if (!chain || !heads.has(chain)) {
      out.push({ key: row.id, head: row, trail: [], rolls: [] });
      continue;
    }
    if (seen.has(chain)) continue;
    seen.add(chain);

    const trail = settled(trails.get(chain) ?? []);
    out.push({
      key: chain,
      head: heads.get(chain),
      trail,
      rolls: trail.filter((entry) => entry.kind === 'roll'),
    });
  }

  return out;
}

/**
 * A trail with the announcements its own outcomes have already answered
 * dropped.
 *
 * One case so far, and it is the reaction stack: a reader stepping in writes
 * `open` the moment their window mounts, and then `done` or `pass` when it
 * settles. Both are real events at different moments and both stay in the
 * table's history. Inside one block they are one thing said twice, and the
 * second one says it better: "Kaelen took a reaction" needs no "Kaelen is
 * reacting" above it.
 *
 * Only the resolved ones are dropped. A reaction still being chosen is exactly
 * the row a reader watching a held action wants to see.
 */
function settled(trail) {
  const answered = new Set(
    trail
      .filter(
        (row) =>
          row.kind === 'react' && (row.data?.move === 'done' || row.data?.move === 'pass')
      )
      .map((row) => row.data?.key ?? '')
  );
  if (answered.size === 0) return trail;

  return trail.filter(
    (row) =>
      !(row.kind === 'react' && row.data?.move === 'open' && answered.has(row.data?.key ?? ''))
  );
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
 * The two moves that say a turn is over, which the block does not draw.
 *
 * "there should be no End turn block, instead just the [separation] line between
 * turn[s]", Jules, 2026-09-03. The seam over the next turn already says the last
 * one finished, and a block saying "Ended turn 3" above it was the same fact a
 * second time, at the size of an entry, in the middle of a fight.
 *
 * Two spellings because two things write one: `end` off the Turn block on a
 * sheet at no table, `ended` off the same button on a seated one, which is the
 * row the runner listens for to advance the fight. **Both keep being written.**
 * The log is an account of what happened and one of these rows is load-bearing
 * to the encounter runner (see EncounterTab.jsx); what changed is only that the
 * feed stops drawing them.
 */
const OVER = new Set(['end', 'ended']);

/**
 * The feed as the block draws it: every row that says something a reader cannot
 * get from the seams.
 *
 * Applied before either gathering, so nothing downstream has to know about it
 * and `bundleCount` counts what is actually on the screen.
 */
export function drawnEvents(events) {
  return (events ?? []).filter((row) => !(row?.kind === 'turn' && OVER.has(row?.data?.move)));
}

/**
 * Whether this opener is the same turn as the bundle below it, already opened.
 *
 * "there is [a bug] were turn x name appear ta[w]ice in a row", Jules,
 * 2026-09-03. An announced turn is written twice by design and by two different
 * people: the Game Master's runner calls it (`your-turn`, on the table's own
 * name), and then the player's client starts its own turn through its own patch
 * and writes that (`turn`, on the player's). Both open a turn, so the feed drew
 * two seams for one turn — an empty one and the one holding the entries.
 *
 * They are one turn, so they get one seam. The signature is exact: the newer row
 * is the *sheet's* press, the older is the *runner's* call, and they name the
 * same actor. Two calls in a row stay two seams, and so do two presses.
 *
 * The call is what survives as the head. It carries the run's own round and the
 * side the actor is on, which is what colours the seam, and the press carries
 * neither.
 */
function opensTheSame(bundle, head) {
  return (
    head?.data?.move === 'your-turn' &&
    bundle?.turn?.data?.move === 'turn' &&
    Boolean(head.actor) &&
    bundle.turn.actor === head.actor
  );
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
      /* One turn opened twice is one bundle. The call takes over the head of the
         bundle the press already opened, and whatever sat between the two — a
         throw made off the turn call's own cover — joins the entries under it,
         older than them, which is where it happened. See `opensTheSame`. */
      const last = out.at(-1);
      if (opensTheSame(last, group.head)) {
        out[out.length - 1] = {
          key: group.key,
          turn: group.head,
          groups: [...last.groups, ...held],
        };
      } else {
        out.push({ key: group.key, turn: group.head, groups: held });
      }
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
  return (bundle?.groups ?? []).reduce((sum, group) => sum + 1 + (group.trail?.length ?? 0), 0);
}

/* ------------------------------------------------------------- the knock
 *
 * "When a new entry happen, like with the reaction, there should be a pop up
 * showing." Jules, 2026-09-02.
 *
 * The log block is a block: it is on one tab of one page, and a player reading
 * their Inventory while somebody counterspells them finds out about it later.
 * So a row that lands is also announced over whatever you are looking at.
 *
 * What the pop-up says is decided here rather than in the component, for the
 * two reasons everything in this file is here: it is a pure reading of a row,
 * so the checker can hold it to its wording under Node, and the component that
 * draws it then imports nothing that reaches the codex.
 *
 * ------------------------------------------------------------- one per action
 * A notice is keyed on the **chain**, not the row. An attack writes a use, its
 * throws, a verdict and a delivery, and four pop-ups for one swing would be the
 * noise this whole day's work is about removing. The caller holds one notice
 * per key and lets the later lines land in it, which is the same law the block
 * underneath obeys: one action, one entry. See groupEvents.
 */

/** The fight's moves that already speak for themselves on a player's sheet, in
    a panel of their own. A pop-up beside one is the same news twice. */
const PANELLED = new Set(['init-call', 'initiative', 'your-turn']);

/** What each kind of row is worth saying, as the verb in front of the title. */
const KNOCK = {
  use: (row) => row.data?.verb ?? 'used',
  rest: () => 'took a',
  effect: () => 'laid',
  apply: (row) => row.data?.verb ?? 'dealt',
  summon: (row) => (row.data?.move === 'gone' ? 'took off the table' : 'conjured'),
};

/**
 * One row as the line a pop-up shows, or null for a row not worth interrupting
 * anybody with.
 *
 * `{ key, actor, portrait, line, kind }`. Two kinds are silent:
 *
 *   a throw    the dice are already coming: `worthReplaying` puts somebody
 *              else's roll on your own table, faces and all, and a banner
 *              saying so over the top of it is the same news twice.
 *   the sheet's own panels   the call for an Initiative roll, the bell that
 *              follows it and a turn call each stand in a panel at the side of
 *              the sheet they name. See TurnCall.jsx.
 *
 * Everything else speaks, because everything else is somebody at the table
 * doing something to somebody.
 */
export function noticeOf(row) {
  if (!row?.kind || row.kind === 'roll') return null;
  if (row.kind === 'turn' && PANELLED.has(row.data?.move)) return null;

  const verb = KNOCK[row.kind]?.(row) ?? '';

  return {
    /* The action it belongs to where it has one, so the reaction to a Fireball
       lands in the Fireball's own notice rather than beside it. */
    key: row.data?.chain ?? row.id ?? row.title ?? '',
    actor: row.actor ?? '',
    portrait: row.data?.portrait ?? null,
    kind: row.kind,
    line: [verb, row.title ?? ''].filter(Boolean).join(' '),
  };
}
