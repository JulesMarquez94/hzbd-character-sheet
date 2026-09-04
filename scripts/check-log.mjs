/**
 * The table log's chain, held to the two rules that make it read.
 *
 * `campaign_events` is one flat, insert-only table read newest first. A use and
 * the throws it set off are one thing at the table and several rows in it, so
 * `groupEvents` gathers them back up. That gathering has to obey two rules which
 * pull in opposite directions and are easy to break by tidying:
 *
 *   A group sits where its **newest** row sits. A fight is read from the top, so
 *   a chain that has just been handed its damage roll is the thing that just
 *   happened. Anchor on the head instead and a live chain sinks down the feed
 *   while other people act.
 *
 *   A group reads **oldest first inside itself**. The feed runs backwards because
 *   you want the last thing first. A chain runs forwards because it is a
 *   sequence, and "Damage 17" above "Attack Roll 12, success" is the story told
 *   back to front.
 *
 *   **One action is one entry.** A chain gathers every row addressed to it and
 *   not only its throws: the verdicts, what landed, the row it laid and the
 *   whole reaction stack. None of those kinds may ever head a block, whatever
 *   order the page happens to hold them in.
 *
 * Everything else here is about rows that do not fit the happy shape, because
 * the log is allowed to lose writes (see postEvent) and is read a page at a
 * time. A throw whose head is one page down, a head whose throws never arrived
 * and a roll that never had a head all have to draw something sensible.
 *
 *   node scripts/check-log.mjs        report and exit 1 on any finding
 *   node scripts/check-log.mjs --list print every case, then exit 0
 */

import {
  REPLAY_WINDOW,
  bundleTurns,
  chainSummary,
  drawnEvents,
  groupEvents,
  newChain,
  noticeOf,
  resultFromRow,
  rollEvent,
  worthReplaying,
} from '../src/lib/logChain.js';
import { rollCheck, rollValue } from '../src/lib/dice.js';

const LIST = process.argv.includes('--list');
const findings = [];

function check(what, got, want) {
  const same = JSON.stringify(got) === JSON.stringify(want);
  if (LIST) console.log(`  ${same ? 'ok  ' : 'FAIL'} ${what}`);
  if (!same) findings.push({ what, got, want });
}

function section(title) {
  if (LIST) console.log(`\n===== ${title} =====`);
}

/**
 * A feed, written oldest first because that is the order things happen, and
 * handed back newest first because that is the order the table reads it. Writing
 * the fixtures the way a fight actually runs is the only way these cases stay
 * legible.
 */
function feed(...rows) {
  return rows.map((row, i) => ({ id: `e${i}`, seq: i + 1, ...row })).reverse();
}

const use = (chain, title) => ({ kind: 'use', title, data: { chain, card: null } });
const throw_ = (chain, title) => ({ kind: 'roll', title, data: { chain } });
/** A row written about an action rather than by it: a verdict, a delivery, a
    reaction. Never a head, whatever order it arrives in. See UNDER. */
const about = (kind, chain, title, data = {}) => ({ kind, title, data: { chain, ...data } });

/** What a group came out as, flattened for comparison. */
const shape = (groups) =>
  groups.map((g) => [g.head.title, ...g.trail.map((r) => `> ${r.title}`)].join(' '));

/* ------------------------------------------------------------- the happy shape */

section('a use and what it set rolling');
{
  const c = 'chain-1';
  const got = groupEvents(feed(use(c, 'Cleave'), throw_(c, 'Attack Roll'), throw_(c, 'Damage')));

  check('one block, not three rows', got.length, 1);
  check('headed by the use', got[0].head.title, 'Cleave');
  check('and the chain reads forwards under it', shape(got), ['Cleave > Attack Roll > Damage']);
  check('keyed on the chain', got[0].key, c);
}

section('a group sits where its newest row sits');
{
  const c = 'chain-1';
  /* Kaelen swings, somebody else takes a turn, then Kaelen rolls damage. The
     damage is the newest thing in the feed, so the whole block belongs above the
     turn even though its head is below it. */
  const got = groupEvents(
    feed(use(c, 'Cleave'), throw_(c, 'Attack Roll'), { kind: 'turn', title: 'Turn 4', data: {} }, throw_(c, 'Damage'))
  );

  check('the block outranks a row newer than its head', shape(got), [
    'Cleave > Attack Roll > Damage',
    'Turn 4',
  ]);
}

section('a head whose throws have not arrived');
{
  const c = 'chain-1';
  const got = groupEvents(feed(use(c, 'Cleave')));
  check('draws as a plain row', shape(got), ['Cleave']);
  check('with nothing under it', got[0].rolls.length, 0);
  check('and no trail either', got[0].trail.length, 0);
}

/* ------------------------------------------------------- one action, one entry
 * "Same an attack should not be 3 entries in the log", Jules, 2026-09-02. An
 * aimed swing writes the use, its throws, the verdict read against each body,
 * the damage delivered and whatever the reaction stack said. All of it is one
 * thing that happened, so all of it hangs on the one chain.
 */

section('an aimed attack, whole');
{
  const c = 'chain-1';
  const got = groupEvents(
    feed(
      use(c, 'Flurry'),
      throw_(c, 'Attack Roll'),
      about('verdict', c, 'Hit 2.Fenrat, missed 3.Fenrat'),
      throw_(c, 'Damage'),
      about('apply', c, '14 Fire damage'),
      about('effect', c, 'Withering Mark')
    )
  );

  check('is one entry and not five', got.length, 1);
  check('headed by the use', got[0].head.title, 'Flurry');
  check('everything it set off reads forwards under it', shape(got), [
    'Flurry > Attack Roll > Hit 2.Fenrat, missed 3.Fenrat > Damage > 14 Fire damage > Withering Mark',
  ]);
  /* The summary and the verdict band only ever ask about dice, so the throws are
     handed back on their own as well. */
  check('the throws are still their own list', got[0].rolls.map((r) => r.title), [
    'Attack Roll',
    'Damage',
  ]);
}

section('reacting is part of the action it answered');
{
  /* "In the log reacting should be part of the action block not its own",
     2026-09-02. Kaelen steps into Lark's cast: the hold, the take, and the
     action failing all ride Lark's chain. */
  const c = 'chain-1';
  const got = groupEvents(
    feed(
      use(c, 'Fireball'),
      about('react', c, 'Reacting', { move: 'open', key: 'k1' }),
      about('react', c, 'Reaction taken', { move: 'done', key: 'k1' }),
      about('react', c, 'Fireball fails against 2.Fenrat', { move: 'failed' })
    )
  );

  check('one entry, the reaction inside it', got.length, 1);
  /* The open is dropped once its own outcome is in: "took a reaction" says
     everything "is reacting" was going to. See settled. */
  check('and the announcement gives way to the outcome', shape(got), [
    'Fireball > Reaction taken > Fireball fails against 2.Fenrat',
  ]);
}

section('a reaction still being chosen');
{
  const c = 'chain-1';
  const got = groupEvents(feed(use(c, 'Fireball'), about('react', c, 'Reacting', { move: 'open', key: 'k1' })));
  check('is the row a held action most needs to show', shape(got), ['Fireball > Reacting']);
}

section('the call for initiative gathers the rolls it asked for');
{
  /* "Make it so it prompt a roll for player with initiative and not just
     automatic" (Jules, 2026-09-04). The Game Master's press is one row and
     every player's throw hangs on it, so a fight starting is one entry in the
     feed with the whole table's dice inside it rather than five loose rolls. */
  const call = 'call-1';
  /* Written out rather than built by `initiativeCallEvent`, because this file
     imports nothing that reaches the network. Its own shape is pinned in
     check-combat.mjs; what is pinned here is that a `turn` row carrying a
     chain heads a block. */
  const head = {
    kind: 'turn',
    actor: 'The table',
    title: 'Roll for initiative',
    data: { move: 'init-call', call, chain: call },
  };

  const got = groupEvents(feed(head, throw_(call, 'Initiative'), throw_(call, 'Initiative')));
  check('one entry, both throws under it', shape(got), [
    'Roll for initiative > Initiative > Initiative',
  ]);
  check('and the throws are its own list', got[0].rolls.length, 2);
  check('a turn row with a chain may head a block', got[0].head.kind, 'turn');
}

section('a body conjured by a cast is part of the cast');
{
  /* "If something is created like with hard light ... it should appear" (Jules,
     2026-09-04). The summon row rides the cast's chain, so the wall is a line
     in the Hard Light entry and not an entry beside it; the row that takes it
     off the table again has no cast above it and stands alone. */
  const c = 'chain-1';
  const got = groupEvents(
    feed(
      use(c, 'Hard Light'),
      about('summon', c, 'Hard Light', { move: 'conjure', key: 'w1' }),
      { kind: 'summon', title: 'Hard Light', data: { chain: null, move: 'gone', key: 'w1' } }
    )
  );
  check('the summon rides its cast, and the removal stands alone', shape(got), [
    'Hard Light',
    'Hard Light > Hard Light',
  ]);
}

section('a delivery with no use above it');
{
  /* A wall of fire rolled off its own tracker row on the encounter page. There
     is no use to file it under and it carries no chain, so it is the entry. */
  const got = groupEvents(feed(about('apply', null, '9 Fire damage')));
  check('stands on its own', shape(got), ['9 Fire damage']);
  check('and heads its own group', got[0].head.kind, 'apply');
}

/* ----------------------------------------------------------- the awkward shapes */

section('a roll that never had a head');
{
  /* A custom roll off the tray. It is the block, rather than being filed under
     one, which is why the name field exists. */
  const got = groupEvents(feed({ kind: 'roll', title: 'Climb the cliff', data: { chain: null } }));
  check('stands on its own', shape(got), ['Climb the cliff']);
  check('and is keyed on its own id', got[0].key, 'e0');
}

section('a throw whose head is a page further down');
{
  /* Paging on seq can cut a chain in half. The rest of the chain still has to
     draw: refusing to render until you press Older would be a worse answer than
     a throw standing on its own. */
  const c = 'chain-1';
  const got = groupEvents(feed(throw_(c, 'Attack Roll'), throw_(c, 'Damage')));
  check('every orphan draws', shape(got), ['Damage', 'Attack Roll']);
  check('newest first, like the feed it came from', got.length, 2);
}

section('and a reaction whose action is a page further down');
{
  /* The same cut, through a chain's other kind of row. It must not promote
     itself to head of a block and swallow the throws of the half that is on
     this page: nothing under a chain is ever a head. */
  const c = 'chain-1';
  const got = groupEvents(
    feed(about('react', c, 'Reaction taken', { move: 'done', key: 'k1' }), throw_(c, 'Damage'))
  );
  check('both draw, neither heads the other', shape(got), ['Damage', 'Reaction taken']);
  check('and neither carries a trail', got.every((g) => g.trail.length === 0), true);
}

section('two chains at once');
{
  /* Two players acting in the same round. The rows interleave in the feed and
     must not interleave in the blocks. */
  const a = 'chain-a';
  const b = 'chain-b';
  const got = groupEvents(
    feed(
      use(a, 'Fireball'),
      use(b, 'Cleave'),
      throw_(a, 'Attack Roll'),
      throw_(b, 'Attack Roll'),
      throw_(a, 'Damage'),
      throw_(b, 'Damage')
    )
  );

  check('two blocks', got.length, 2);
  check('neither one borrows the other rows', shape(got), [
    'Cleave > Attack Roll > Damage',
    'Fireball > Attack Roll > Damage',
  ]);
}

section('rows that were never part of any of this');
{
  const got = groupEvents(
    feed(
      { kind: 'turn', title: 'Turn 1', data: {} },
      { kind: 'rest', title: 'Short Rest', data: {} },
      { kind: 'use', title: 'Bandage', data: { chain: null } }
    )
  );
  check('come back untouched and in order', shape(got), ['Bandage', 'Short Rest', 'Turn 1']);
  check('and carry no rolls', got.every((g) => g.rolls.length === 0), true);
}

section('nothing at all');
{
  check('an empty feed groups to nothing', groupEvents([]), []);
  check('and so does a missing one', groupEvents(undefined), []);
}

/* ------------------------------------------------------------- reading a fight
 * A turn and the things done during it are one bundle, and the two rules added
 * on 2026-09-03: a turn ending is not drawn, and a turn opened twice by two
 * different people is one seam. See drawnEvents and bundleTurns.
 */

/** A bundle list flattened: the seam's title and actor, then what is under it. */
const seams = (bundles) =>
  bundles.map((b) => ({
    turn: b.turn ? `${b.turn.title} · ${b.turn.actor}` : null,
    under: b.groups.map((g) => g.head.title),
  }));

/** The block's own reading, in one call: drawn, chained, bundled, turned round. */
const readFeed = (rows) =>
  seams(
    bundleTurns(groupEvents(drawnEvents(rows)))
      .reverse()
      .map((b) => ({ ...b, groups: [...b.groups].reverse() }))
  );

const opens = (move, title, actor, data = {}) => ({
  kind: 'turn',
  actor,
  title,
  data: { move, ...data },
});

section('a turn ending is a seam and not a block');
{
  const got = readFeed(
    feed(
      opens('turn', 'Turn 1', 'Kaelen'),
      use(null, 'Strike'),
      { kind: 'turn', actor: 'Kaelen', title: 'Ended turn 1', data: { move: 'end' } },
      opens('turn', 'Turn 2', 'Kaelen'),
      use(null, 'Hide'),
      { kind: 'turn', actor: 'Kaelen', title: 'Ended turn 2', data: { move: 'ended' } }
    )
  );

  check('neither spelling is drawn', got, [
    { turn: 'Turn 1 · Kaelen', under: ['Strike'] },
    { turn: 'Turn 2 · Kaelen', under: ['Hide'] },
  ]);
  check(
    'and the rows are still in the feed',
    drawnEvents([{ kind: 'use', title: 'Strike', data: {} }]).length,
    1
  );
}

section('a turn opened twice is one seam');
{
  /* The runner calls it, the player's own client starts it. Both open a turn,
     and until this they drew two: an empty one and the one with the entries. */
  const got = readFeed(
    feed(
      opens('your-turn', 'Turn 3', 'Kaelen', { round: 3, side: 'member' }),
      opens('turn', 'Turn 3', 'Kaelen', { count: 3 }),
      use(null, 'Strike'),
      use(null, 'Hide')
    )
  );

  check('one seam, and the call heads it', got, [
    { turn: 'Turn 3 · Kaelen', under: ['Strike', 'Hide'] },
  ]);
}

section('what happened between the call and the press');
{
  const got = readFeed(
    feed(
      opens('your-turn', 'Turn 3', 'Kaelen', { round: 3 }),
      { kind: 'roll', actor: 'Kaelen', title: 'Save', data: { chain: null } },
      opens('turn', 'Turn 3', 'Kaelen', { count: 3 }),
      use(null, 'Strike')
    )
  );

  check('joins the entries, oldest first', got, [
    { turn: 'Turn 3 · Kaelen', under: ['Save', 'Strike'] },
  ]);
}

section('turns that are not the same turn');
{
  const two = readFeed(
    feed(
      opens('your-turn', 'Turn 3', 'Kaelen', { round: 3 }),
      opens('your-turn', 'Turn 3', 'Fenrat', { round: 3 })
    )
  );
  check('two calls in a row stay two seams', two.length, 2);

  const presses = readFeed(
    feed(opens('turn', 'Turn 1', 'Kaelen'), opens('turn', 'Turn 2', 'Kaelen'))
  );
  check('and so do two presses', presses.length, 2);

  const other = readFeed(
    feed(opens('turn', 'Turn 3', 'Kaelen'), opens('your-turn', 'Turn 4', 'Fenrat', { round: 4 }))
  );
  check('a call naming somebody else absorbs nothing', other.length, 2);

  const solo = readFeed(feed(opens('turn', 'Turn 1', 'Kaelen'), use(null, 'Strike')));
  check('a sheet at no table still gets its seam', solo, [
    { turn: 'Turn 1 · Kaelen', under: ['Strike'] },
  ]);
}

/* ------------------------------------------------------------------ the knock
 * What the pop-up over the page says, and what it stays quiet about. See
 * noticeOf, and LogCall.jsx which holds one notice per key.
 */

section('a row as the line a pop-up shows');
{
  const say = (row) => noticeOf({ id: 'e1', actor: 'Kaelen', ...row });

  check(
    'a cast says the verb the row was written with',
    say({ kind: 'use', title: 'Fireball', data: { verb: 'cast', chain: 'c1' } })?.line,
    'cast Fireball'
  );
  check(
    'a swing says it swung',
    say({ kind: 'use', title: 'Cleave', data: { verb: 'attacked with' } })?.line,
    'attacked with Cleave'
  );
  check('a rest reads as one', say({ kind: 'rest', title: 'Long Rest', data: {} })?.line, 'took a Long Rest');
  check(
    'a body put on the table says it was conjured',
    say({ kind: 'summon', title: 'Hard Light', data: { move: 'conjure', chain: 'c1' } })?.line,
    'conjured Hard Light'
  );
  check(
    'and taken off it says so',
    say({ kind: 'summon', title: 'Hard Light', data: { move: 'gone' } })?.line,
    'took off the table Hard Light'
  );
  check(
    'a delivery says what it dealt',
    say({ kind: 'apply', title: '14 Fire damage', data: { verb: 'dealt' } })?.line,
    'dealt 14 Fire damage'
  );
  check(
    'the stack speaks for itself',
    say({ kind: 'react', title: 'Reaction taken', data: { move: 'done', chain: 'c1' } })?.line,
    'Reaction taken'
  );

  /* One notice per action, not one per row: the key is the chain wherever the
     row has one, so four rows off one swing land in one pop-up. */
  check(
    'every row of an action shares its key',
    [
      say({ kind: 'use', title: 'Flurry', data: { chain: 'c1', verb: 'attacked with' } })?.key,
      say({ kind: 'verdict', title: 'Hit 2.Fenrat', data: { chain: 'c1' } })?.key,
      say({ kind: 'apply', title: '14 Fire damage', data: { chain: 'c1' } })?.key,
    ],
    ['c1', 'c1', 'c1']
  );
  check(
    'and a row with no action of its own is keyed on itself',
    say({ kind: 'rest', title: 'Long Rest', data: {} })?.key,
    'e1'
  );

  /* Two kinds stay quiet, and both because the reader is already being shown
     the thing: the dice are landing on their own table, and the sheet's own
     covers take the whole screen. */
  check('a throw is not announced twice', say({ kind: 'roll', title: 'Damage', data: { chain: 'c1' } }), null);
  check(
    'nor is the turn call that covers the screen',
    say({ kind: 'turn', title: 'Turn 3', data: { move: 'your-turn' } }),
    null
  );
  check(
    'nor the bell',
    say({ kind: 'turn', title: 'Initiative', data: { move: 'initiative' } }),
    null
  );
  check(
    'nor the call for an Initiative roll, which is its own panel',
    say({ kind: 'turn', title: 'Roll for initiative', data: { move: 'init-call' } }),
    null
  );
  check('a turn ending is worth saying', say({ kind: 'turn', title: 'Ended turn 3', data: { move: 'ended' } })?.line, 'Ended turn 3');
  check('and nothing at all is nothing', noticeOf(null), null);
}

/* ------------------------------------------------------------------ the row */

section('what a throw writes down');
{
  const result = rollCheck({
    flat: 4,
    dc: 12,
    kind: 'attack',
    random: scriptedFaces([[5, 6], [3, 6]]),
  });
  const row = rollEvent(result, { name: 'Kaelen' }, { chain: 'chain-1', card: 'cleave' });

  check('is a roll', row.kind, 'roll');
  check('signed by whoever threw it', row.actor, 'Kaelen');
  check('named after the step', row.title, 'Attack Roll');
  check('shows its working and not its answer', row.detail, '2d6 + 4 · 5, 3');
  check('carries the chain', row.data.chain, 'chain-1');
  check('and the card it opens', row.data.card, 'cleave');
  check('the total is on the row, for the line that scans', row.data.total, 12);
  check('so is the verdict', row.data.verdict, 'success');
  check('and every die, so it can be read back or replayed', row.data.dice.length, 2);
  check('not called by hand, because a DC decided it', row.data.called, false);
}

section('a throw the table had to call');
{
  const result = rollCheck({ flat: 4, random: scriptedFaces([[5, 6], [3, 6]]) });
  const row = rollEvent({ ...result, verdict: 'success', calledByHand: true }, { name: 'Kaelen' });
  check('says the table called it', row.data.called, true);
  check('and keeps the verdict it was given', row.data.verdict, 'success');
  check('with no DC to show for it', row.data.dc, null);
}

section('a damage roll');
{
  const result = rollValue({
    dice: ['1d6'],
    flat: 8,
    kind: 'damage',
    random: scriptedFaces([[6, 6], [3, 8]]),
  });
  const row = rollEvent(result, { name: 'Kaelen' }, { chain: 'chain-1' });

  check('is named for what it is', row.title, 'Damage');
  check('and never claims a verdict', row.data.verdict, null);
  check('the burst is in the working', row.detail, '1d6 + 8 · 6 · burst d8: 3');
  check('and both dice are written down', row.data.dice.length, 2);
}

section('a custom roll off the tray keeps its own name');
{
  const result = rollCheck({ flat: 3, dc: 10, random: scriptedFaces([[6, 6], [4, 6]]) });
  const row = rollEvent(result, { name: 'Kaelen' }, { name: 'Climb the cliff' });
  check('titled what the player typed', row.title, 'Climb the cliff');
  check('and filed under no chain', row.data.chain, null);
}

section('a chain id is its own');
{
  const ids = new Set([newChain(), newChain(), newChain()]);
  check('three chains are three ids', ids.size, 3);
  check('and none of them is empty', [...ids].every((id) => typeof id === 'string' && id.length > 8), true);
}

/* ------------------------------------------------------------------ the summary */

section('what an entry came to, in one sentence');
{
  const throwRow = (step, total, over = {}) => ({
    kind: 'roll',
    title: step,
    data: { shape: 'value', step, total, damage: [], ...over },
  });
  const checkRow = (verdict, total = 12, step = 'attack') => ({
    kind: 'roll',
    title: 'Attack Roll',
    data: { shape: 'check', step, total, verdict },
  });
  /* The head is where the name and the verb come from. Jules, 2026-08-31: the
     summary says what was played as well as what it came to, because "Dealt 25
     damage" leaves out the half that makes it a story. */
  const head = (title, verb) => ({ kind: 'use', title, data: { verb } });

  check(
    'the card, the verb and the damage with its type',
    chainSummary(
      [checkRow('success'), throwRow('damage', 17, { damage: ['Necrotic'] })],
      head('Flurry', 'attacked with')
    ),
    'Attacked with Flurry for 17 Necrotic damage.'
  );
  check(
    'a spell reads as a cast',
    chainSummary([throwRow('healing', 12)], head('Renew', 'cast')),
    'Cast Renew for 12 Health.'
  );
  check(
    'and a Shield is what it is',
    chainSummary([throwRow('shield', 8)], head('Ward', 'cast')),
    'Cast Ward for 8 Shield.'
  );

  /* A critical rewrites the opening rather than adding a word to it. */
  check(
    'a critical says so first',
    chainSummary(
      [checkRow('critical-success'), throwRow('damage', 18, { damage: ['Sharp'] })],
      head('Flurry', 'attacked with')
    ),
    'Critical attack with Flurry for 18 Sharp damage.'
  );

  /* Three landings of a Flurry are one number at the table, even though they are
     three throws in the log. */
  check(
    'landings add up',
    chainSummary(
      [
        checkRow('success'),
        throwRow('damage', 6, { damage: ['Sharp'] }),
        throwRow('damage', 7, { damage: ['Sharp'] }),
        throwRow('damage', 5, { damage: ['Sharp'] }),
      ],
      head('Flurry', 'attacked with')
    ),
    'Attacked with Flurry for 18 Sharp damage.'
  );

  check(
    'a card that damages and heals says both',
    chainSummary(
      [throwRow('damage', 9, { damage: ['Fire'] }), throwRow('healing', 4)],
      head('Emberpact', 'cast')
    ),
    'Cast Emberpact for 9 Fire damage and 4 Health.'
  );

  /* A throw with no use above it: a roll off the tray. Nothing to open the
     sentence with, so the numbers stand alone. */
  check(
    'a roll off the tray has no card to name',
    chainSummary([throwRow('damage', 11)]),
    'Rolled 11 damage.'
  );

  /* A miss ends a chain, so the check is the whole story. Jules asked for a line
     on every outcome, including this one. */
  check('a miss says so', chainSummary([checkRow('failure', 7)], head('Cleave', 'attacked with')), 'Missed.');
  check(
    'and a bad one says that',
    chainSummary([checkRow('critical-failure', 3)], head('Cleave', 'attacked with')),
    'Missed badly.'
  );

  /* Only an attack misses. "Missed." under a failed attempt to climb a cliff is
     the summary saying something the roll never said, and the entry's own band
     already reads FAILURE. */
  check(
    'a failed Skill Check did not miss anything',
    chainSummary([checkRow('failure', 7, 'skill')], head('Climb', 'used')),
    null
  );

  /* A check that landed and asked for nothing else. Its own row already prints
     the total and the verdict, so a summary would only repeat it. */
  check(
    'a check with nothing after it needs no summary',
    chainSummary([checkRow('success')], head('Shove', 'used')),
    null
  );
  check('and an entry with no throws at all has none', chainSummary([]), null);

  check(
    'two types read as the choice the card offers',
    chainSummary([throwRow('damage', 11, { damage: ['Fire', 'Cold'] })], head('Bolt', 'cast')),
    'Cast Bolt for 11 Fire or Cold damage.'
  );
}

/* ------------------------------------------------------------------ replaying */

section('a roll read back off the row is the roll that was thrown');
{
  /* The one promise the replay makes: nothing is recomputed. Two players reading
     different numbers off the same roll is the failure this whole design exists
     to prevent, so the row is copied and never re-added. */
  const thrown = rollValue({
    dice: ['1d6'],
    flat: 8,
    kind: 'damage',
    random: scriptedFaces([[6, 6], [3, 8]]),
  });
  const back = resultFromRow(rollEvent(thrown, { name: 'Kaelen' }, { chain: 'c1' }));

  check('the same dice', back.dice, thrown.dice);
  check('the same total', back.total, thrown.total);
  check('the same shape and kind', [back.shape, back.kind], [thrown.shape, thrown.kind]);

  const judged = rollCheck({ flat: 4, dc: 12, random: scriptedFaces([[5, 6], [3, 6]]) });
  const readBack = resultFromRow(rollEvent(judged, { name: 'Kaelen' }));
  check('and the same verdict', readBack.verdict, judged.verdict);
  check('and the DC it was against', readBack.dc, 12);

  check('a row with no dice reads back as nothing', resultFromRow({ data: {} }), null);
  check('and so does no row at all', resultFromRow(null), null);
}

section('what is worth interrupting somebody to show them');
{
  const now = Date.UTC(2026, 7, 30, 12, 0, 0);
  const row = (over = {}) => ({
    kind: 'roll',
    character_id: 'them',
    created_at: new Date(now - 2000).toISOString(),
    data: { dice: [{ id: 0, sides: 6, value: 4, role: 'base' }] },
    ...over,
  });

  check('somebody else, a moment ago', worthReplaying(row(), { mine: 'me', now }), true);
  check('your own is not replayed at you', worthReplaying(row({ character_id: 'me' }), { mine: 'me', now }), false);
  check('a use is not a throw', worthReplaying(row({ kind: 'use' }), { mine: 'me', now }), false);
  check('a throw with no dice cannot be drawn', worthReplaying(row({ data: { dice: [] } }), { mine: 'me', now }), false);

  /* A laptop shut all evening reconnects and the channel catches up. Those rolls
     are history: they belong in the feed, not in an animation over the page. */
  const old = row({ created_at: new Date(now - 60 * 60 * 1000).toISOString() });
  check('an hour late is history', worthReplaying(old, { mine: 'me', now }), false);
  const edge = row({ created_at: new Date(now - REPLAY_WINDOW * 1000 + 500).toISOString() });
  check('just inside the window still plays', worthReplaying(edge, { mine: 'me', now }), true);

  /* Nothing to compare against: a Game Master watching the campaign page has no
     character at the table, and gets to watch everything. */
  check('a reader with no character watches anyway', worthReplaying(row(), { mine: null, now }), true);
  check('and an empty list is the same thing', worthReplaying(row(), { mine: [], now }), true);

  /* A player may have two sheets at one table, so `mine` is a list. It used to
     be one id, which meant a second character of your own replayed its dice back
     at you a second after you threw them. */
  const two = { mine: ['me', 'my-other'], now };
  check('one id still works as a list of one', worthReplaying(row({ character_id: 'me' }), { mine: 'me', now }), false);
  check('neither of your own is replayed at you', worthReplaying(row({ character_id: 'my-other' }), two), false);
  check('and somebody else still is', worthReplaying(row({ character_id: 'them' }), two), true);
}

/* ------------------------------------------------------------------ report */

/** The same scripted `random` check-dice.mjs uses. See the note there. */
function scriptedFaces(pairs) {
  let i = 0;
  return () => {
    const pair = pairs[i];
    i += 1;
    if (!pair) throw new Error('the script ran out');
    return (pair[0] - 0.5) / pair[1];
  };
}

if (findings.length === 0) {
  console.log('table log: every chain reads');
  process.exit(0);
}

console.log(`\ntable log: ${findings.length} ${findings.length === 1 ? 'case does' : 'cases do'} not hold\n`);
for (const { what, got, want } of findings) {
  console.log(`  ${what}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`);
}
process.exit(LIST ? 0 : 1);
