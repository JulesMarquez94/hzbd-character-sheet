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
  groupEvents,
  newChain,
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

/** What a group came out as, flattened for comparison. */
const shape = (groups) =>
  groups.map((g) => [g.head.title, ...g.rolls.map((r) => `> ${r.title}`)].join(' '));

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

  /* Nothing to compare against: a viewer with no character of their own still
     watches the table roll. */
  check('a reader with no character watches anyway', worthReplaying(row(), { mine: null, now }), true);
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
