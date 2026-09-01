/**
 * How a tab remembers where its blocks are, held to the four rules that make
 * the arrangement survive a round trip.
 *
 * A layout is two stored things and nothing else: an order, which is the grid
 * read left to right with a `null` wherever the player left a hole, and a tray
 * map, which is the blocks pinned to the sides of the window instead. Every tab
 * with a grid stores its own pair (see BLANK_CHARACTER), and all of them are
 * repaired on read, because a stored layout is only ever a hint: it can be
 * missing, written by an older build, or hold ids for blocks that have since
 * been handed back.
 *
 * The four rules:
 *
 *   Every block is somewhere, exactly once. Known ids keep the place they were
 *   given, anything absent is appended in its factory position, and a block on
 *   a tray is not also in the grid.
 *
 *   A hole is a choice and it is kept. Blank space in the middle of a layout is
 *   the layout. A hole at the *end* is not: it is what is left when a block is
 *   moved off the end, and it is trimmed.
 *
 *   A tray slot is positional. `{ left: [null, x] }` is a bottom-left tray with
 *   nothing above it, and it has to stay that way, because on a phone the top
 *   and the bottom of a tray are two different handles.
 *
 *   A move is a trade. Whatever is at A and whatever is at B swap, and "nothing"
 *   is a legal thing to be at: that is what leaves the hole behind, and it is
 *   the same move whether either end is a grid cell or a tray slot.
 *
 * The trade lives in BlockArrange.jsx, in the component, so the arithmetic is
 * restated here against the same rules rather than imported. A drift between
 * the two shows up as a finding, which is the point.
 *
 *   node scripts/check-layout.mjs        report and exit 1 on any finding
 *   node scripts/check-layout.mjs --list print every case, then exit 0
 */

import {
  SHEET_BLOCK_IDS,
  TRAY_SIDES,
  TRAY_SLOTS,
  normalizeBlockOrder,
  normalizeGridColumns,
  normalizeSourceOrder,
  normalizeTrays,
  trayedIds,
  traysHold,
  trimGaps,
} from '../src/lib/characterModel.js';

const LIST = process.argv.includes('--list');
const findings = [];

function check(what, got, want) {
  const same = JSON.stringify(got) === JSON.stringify(want);
  if (LIST) console.log(`  ${same ? 'ok  ' : 'FAIL'} ${what}${same ? '' : `  got ${JSON.stringify(got)}`}`);
  if (!same) findings.push({ what, got, want });
}

function section(title) {
  if (LIST) console.log(`\n===== ${title} =====`);
}

/* ------------------------------------------------------------ the six blocks */

section('every block is somewhere, exactly once');
{
  check('a fresh sheet is the factory order', normalizeBlockOrder(null), [1, 2, 3, 4, 5, 6]);
  check('an arrangement is kept', normalizeBlockOrder([3, 1, 2, 6, 4, 5]), [3, 1, 2, 6, 4, 5]);
  check(
    'a half-written order is completed in factory positions',
    normalizeBlockOrder([4, 2]),
    [4, 2, 1, 3, 5, 6]
  );
  check('the same block twice is once', normalizeBlockOrder([2, 2, 2]), [2, 1, 3, 4, 5, 6]);
  check(
    'a block that no longer exists is dropped',
    normalizeBlockOrder([1, 'minion:gone', 2]),
    [1, 2, 3, 4, 5, 6]
  );
  check(
    'a creature that has arrived is appended, not inserted',
    normalizeBlockOrder([6, 5, 4, 3, 2, 1], ['minion:bond']),
    [6, 5, 4, 3, 2, 1, 'minion:bond']
  );
  check(
    'a stored string parses',
    normalizeBlockOrder('[2,1,3,4,5,6]'),
    [2, 1, 3, 4, 5, 6]
  );
  check('unreadable JSON is the factory order', normalizeBlockOrder('{oh no'), [1, 2, 3, 4, 5, 6]);
}

/* ------------------------------------------------------------------ the holes */

section('a hole is a choice, and a trailing hole is not');
{
  check(
    'a hole in the middle is kept where it is',
    normalizeBlockOrder([1, 2, null, 3, 4, 5, 6]),
    [1, 2, null, 3, 4, 5, 6]
  );
  check(
    'two holes running are both kept',
    normalizeBlockOrder([1, null, null, 2, 3, 4, 5, 6]),
    [1, null, null, 2, 3, 4, 5, 6]
  );
  check(
    'a missing block lands after the hole rather than in it',
    normalizeBlockOrder([1, null, 3]),
    [1, null, 3, 2, 4, 5, 6]
  );
  check('every trailing hole is trimmed, not just the last', trimGaps([1, 2, null, null]), [1, 2]);
  check('a list of nothing but holes is nothing', trimGaps([null, null]), []);
  check('a list with no holes is handed straight back', trimGaps([1, 2]), [1, 2]);
  check(
    'the same block twice, with a hole between, is once and the hole stays',
    normalizeBlockOrder([2, null, 2, 1, 3, 4, 5, 6]),
    [2, null, 1, 3, 4, 5, 6]
  );

  /* The Abilities tab has no fixed roster, so its holes are checked on their
     own list. */
  check(
    'a source order keeps its holes',
    normalizeSourceOrder(['a', null, 'b'], ['a', 'b']),
    ['a', null, 'b']
  );
  check(
    'a source that has gone leaves no hole behind it',
    normalizeSourceOrder(['a', 'gone', 'b'], ['a', 'b']),
    ['a', 'b']
  );
}

/* ------------------------------------------------------------------ the trays */

section('a tray holds what it can, in the slot it was put in');
{
  const six = SHEET_BLOCK_IDS;

  check('nothing stored is two empty trays', normalizeTrays(null, six), { left: [], right: [] });
  check('an unreadable map is two empty trays', normalizeTrays('{oh no', six), {
    left: [],
    right: [],
  });
  check('a tray keeps what it holds', normalizeTrays({ left: [3], right: [5, 6] }, six), {
    left: [3],
    right: [5, 6],
  });
  check(
    `no more than ${TRAY_SLOTS} a side`,
    normalizeTrays({ left: [1, 2, 3, 4] }, six),
    { left: [1, 2], right: [] }
  );
  check(
    'a block that no longer exists comes off the tray',
    normalizeTrays({ left: ['minion:gone', 4] }, six),
    { left: [null, 4], right: [] }
  );
  check(
    'the same block on both trays is on the first',
    normalizeTrays({ left: [3], right: [3] }, six),
    { left: [3], right: [] }
  );
  check(
    'an empty top slot stays empty and the bottom stays the bottom',
    normalizeTrays({ left: [null, 2] }, six),
    { left: [null, 2], right: [] }
  );
  check('a trailing empty slot is trimmed', normalizeTrays({ left: [2, null] }, six), {
    left: [2],
    right: [],
  });
  check(
    'a number stored as a string is the number the tab spells',
    normalizeTrays({ left: ['4'] }, six),
    { left: [4], right: [] }
  );

  check('what is on the trays, holes ignored', trayedIds({ left: [null, 2], right: [5] }), [2, 5]);
  check('a tray with something on it', traysHold({ left: [3], right: [] }), true);
  check('a tray with only a hole on it holds nothing', traysHold({ left: [null] }), false);
  check('one side, asked for by name', traysHold({ left: [3], right: [] }, 'right'), false);
  check('and the other', traysHold({ left: [3], right: [] }, 'left'), true);
}

section('a block on a tray is not also in the grid');
{
  const trays = normalizeTrays({ left: [3], right: [6] }, SHEET_BLOCK_IDS);
  check(
    'the grid is every block but those two',
    normalizeBlockOrder([1, 2, 3, 4, 5, 6], [], trayedIds(trays)),
    [1, 2, 4, 5]
  );
  check(
    'and a block pulled onto a tray leaves its hole behind',
    normalizeBlockOrder([1, 2, null, 4, 5, null], [], trayedIds(trays)),
    [1, 2, null, 4, 5]
  );
  check(
    'a source order does the same',
    normalizeSourceOrder(['a', 'b', 'c'], ['a', 'b', 'c'], ['b']),
    ['a', 'c']
  );
}

/* ------------------------------------------------------------------ the trade */

section('a move is a trade, and nothing is a legal thing to trade with');
{
  /* The same arithmetic BlockArrange runs, restated. `read`, `write` and
     `trade` are the component's; a drift between the two is a finding. */
  const gridAt = (at) => ({ where: 'grid', at });
  const trayAt = (side, at) => ({ where: 'tray', side, at });

  const read = (layout, spot) =>
    spot.where === 'grid'
      ? layout.order[spot.at] ?? null
      : layout.trays[spot.side]?.[spot.at] ?? null;

  function write(layout, spot, id) {
    if (spot.where === 'grid') {
      const order = layout.order.slice();
      while (order.length <= spot.at) order.push(null);
      order[spot.at] = id;
      return { ...layout, order };
    }
    const side = (layout.trays[spot.side] ?? []).slice();
    while (side.length <= spot.at) side.push(null);
    side[spot.at] = id;
    return { ...layout, trays: { ...layout.trays, [spot.side]: side } };
  }

  function tidy(layout) {
    const trays = {};
    for (const side of TRAY_SIDES) trays[side] = trimGaps(layout.trays[side] ?? []);
    return { order: trimGaps(layout.order), trays };
  }

  const trade = (layout, a, b) => tidy(write(write(layout, a, read(layout, b)), b, read(layout, a)));

  const bare = { order: [1, 2, 3, 4], trays: { left: [], right: [] } };

  check('two blocks swap', trade(bare, gridAt(0), gridAt(3)).order, [4, 2, 3, 1]);
  check(
    'a block onto a hole leaves a hole where it was',
    trade({ ...bare, order: [1, null, 3] }, gridAt(0), gridAt(1)).order,
    [null, 1, 3]
  );
  check(
    'a block past the end lands there and the list grows to reach',
    trade(bare, gridAt(0), gridAt(6)).order,
    [null, 2, 3, 4, null, null, 1]
  );
  check(
    'a block off the end leaves no trailing hole',
    trade(bare, gridAt(3), gridAt(0)).order,
    [4, 2, 3, 1]
  );
  check(
    'a block onto an empty tray slot leaves the grid',
    trade(bare, gridAt(1), trayAt('left', 0)),
    { order: [1, null, 3, 4], trays: { left: [2], right: [] } }
  );
  check(
    'and onto the bottom slot with nothing above it',
    trade(bare, gridAt(1), trayAt('left', 1)),
    { order: [1, null, 3, 4], trays: { left: [null, 2], right: [] } }
  );
  check(
    'a block onto a full tray slot sends the sitting one back to the cell it came from',
    trade(
      { order: [1, 2, 3], trays: { left: [9], right: [] } },
      gridAt(0),
      trayAt('left', 0)
    ),
    { order: [9, 2, 3], trays: { left: [1], right: [] } }
  );
  check(
    'a block off a tray and into a hole',
    trade(
      { order: [1, null, 3], trays: { left: [9], right: [] } },
      trayAt('left', 0),
      gridAt(1)
    ),
    { order: [1, 9, 3], trays: { left: [], right: [] } }
  );
  check(
    'one tray to the other',
    trade({ order: [1], trays: { left: [9], right: [] } }, trayAt('left', 0), trayAt('right', 1)),
    { order: [1], trays: { left: [], right: [null, 9] } }
  );
  check('a trade with itself changes nothing', trade(bare, gridAt(2), gridAt(2)).order, [1, 2, 3, 4]);

  /* And the round trip, which is the whole point: what the arranger writes is
     what the tab reads back. */
  const moved = trade(
    { order: [1, 2, 3, 4, 5, 6], trays: { left: [], right: [] } },
    gridAt(1),
    trayAt('right', 0)
  );
  const trays = normalizeTrays(moved.trays, SHEET_BLOCK_IDS);
  check(
    'what the arranger wrote is what the tab reads',
    { order: normalizeBlockOrder(moved.order, [], trayedIds(trays)), trays },
    { order: [1, null, 3, 4, 5, 6], trays: { left: [], right: [2] } }
  );
}

/* ---------------------------------------------------------------- the columns */

section('a column count is a ceiling between one and nine');
{
  check('nothing stored is three', normalizeGridColumns(undefined), 3);
  check('a zero is not a strip, it is the default', normalizeGridColumns(0), 3);
  check('a count is kept', normalizeGridColumns(5), 5);
  check('past nine is nine', normalizeGridColumns(40), 9);
  check('a string counts', normalizeGridColumns('2'), 2);
}

/* --------------------------------------------------------------------- report */

if (LIST) console.log('');
if (findings.length > 0) {
  console.error(`layout: ${findings.length} finding${findings.length === 1 ? '' : 's'}\n`);
  for (const finding of findings) {
    console.error(`  ${finding.what}`);
    console.error(`    got  ${JSON.stringify(finding.got)}`);
    console.error(`    want ${JSON.stringify(finding.want)}`);
  }
  process.exit(1);
}

console.log(
  `layout: orders, holes and trays all round-trip, across ${SHEET_BLOCK_IDS.length} fixed blocks and ${
    TRAY_SIDES.length * TRAY_SLOTS
  } tray slots`
);
