import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import {
  GRID_COLUMN_MAX,
  GRID_COLUMN_MIN,
  TRAY_SIDES,
  TRAY_SLOTS,
  normalizeGridColumns,
} from '../../lib/characterModel.js';
import { PICK_ACCENTS } from './pickAccents.js';

/**
 * Arranging a tab's blocks, on a small picture of the tab rather than on the
 * tab itself.
 *
 * ------------------------------------------------------------------- why
 * The blocks used to be dragged where they sit, by a grip along the top edge
 * of each one. That worked with a mouse and did not work on a phone, for a
 * reason no amount of touch handling fixes: at 360px only one block is on
 * screen at a time, so dragging block 6 above block 1 meant holding a finger
 * at the top edge and waiting for four screens of auto-scroll to go by. The
 * grip also had to claim the touch gesture to stop the browser reading it as a
 * scroll, which is half of why the tab was hard to scroll at all.
 *
 * So the arrangement is edited somewhere the whole of it fits, on any screen.
 * That was a list of six rows, and it is now the thing the list was standing in
 * for: the grid itself, drawn small, every block in its place with its name on
 * it. A row can only say "sixth". A canvas says "bottom left", which is what is
 * actually being chosen.
 *
 * ---------------------------------------------------------------- the canvas
 * How many columns that grid has is the player's too, one to nine, and it is
 * stored per tab beside that tab's order. It is a ceiling rather than a
 * promise: the tab takes as many columns as the window is wide enough for, so
 * nine is nine on a wall and one on a phone. See `--sheet-fit` in sheet.css,
 * which is the only place the width is known. The arranger always draws the
 * count that was chosen, because that is the thing being edited.
 *
 * **The canvas never scrolls.** Whatever the count, every row of it is drawn
 * inside the height the dialog can give, tiles shrinking to suit. A picture you
 * have to scroll is not a picture of a layout: the whole reason the list became
 * a canvas was to see the shape of the tab at once, and half a shape is a list
 * again with extra steps. See `--mini-h` in sheet.css for the budget.
 *
 * ------------------------------------------------------------- blank space
 * An empty cell is a real part of an arrangement, not the leftover at the end
 * of the last row. Move a block and it leaves a hole where it was, and the hole
 * stays: a tab can be two blocks, a gap and a third, and it will still be that
 * tomorrow. The order is stored with a `null` in the hole (see
 * normalizeBlockOrder) and there is always one spare cell past the last block,
 * so there is always somewhere to make a gap.
 *
 * ------------------------------------------------------------------ the trays
 * Down each side of the canvas is a rail of two slots: the left tray and the
 * right tray, drawn where they will actually be. A block moved onto one leaves
 * the grid and is pinned to the edge of the window instead, where it does not
 * scroll with the tab. Moving it back is the same gesture the other way. See
 * BlockTrays.jsx for what the tray then is.
 *
 * -------------------------------------------------------------- three inputs
 * Drag a block with a mouse. Tap a block and then tap where it should go, on
 * anything. Move the focused block with the arrow keys.
 *
 * A finger never drags. A touch drag has to take the gesture away from the
 * browser with `touch-action: none`, and tap and then tap costs nothing on a
 * small screen, so the awkward gesture is the one nobody has to use.
 *
 * Landing on another block is a *trade*, not an insert. "Put the Loadout top
 * right" should move two blocks, where an insert shuffles everything in
 * between, and every arrangement is still reachable because any order is some
 * sequence of swaps. Landing on an empty cell or an empty tray slot is the same
 * trade against nothing, which is what leaves the hole behind.
 *
 * Both commit immediately. There is no Save: the tab behind the dialog
 * rearranges as you go, so what you are choosing is always visible, and Done
 * only closes.
 */

const COLUMN_CHOICES = Array.from(
  { length: GRID_COLUMN_MAX - GRID_COLUMN_MIN + 1 },
  (_, step) => GRID_COLUMN_MIN + step,
);

/* ------------------------------------------------------------- the addresses

   Every place a block can sit, in one shape, so one trade covers all of them:
   a cell of the grid, or a slot of a tray. `key` is what the drag hit test and
   React's lists are keyed on. */

const gridAt = (at) => ({ where: 'grid', at });
const trayAt = (side, at) => ({ where: 'tray', side, at });
const addressKey = (spot) => (spot.where === 'grid' ? `g:${spot.at}` : `t:${spot.side}:${spot.at}`);
const sameSpot = (a, b) => Boolean(a && b) && addressKey(a) === addressKey(b);

/** The address back off the element that wears it. See `spotAt`. */
function readAddress(key = '') {
  if (key.startsWith('g:')) return gridAt(Number(key.slice(2)));
  const [, side, at] = key.split(':');
  return TRAY_SIDES.includes(side) ? trayAt(side, Number(at)) : null;
}

/**
 * Which drop target the pointer is over.
 *
 * Asked of the document rather than of a map of measured boxes. Every target
 * carries its own address in `data-spot`, so the browser's own hit test is the
 * answer and there is nothing to keep in step with the render: a canvas that
 * has just redrawn itself mid-drag cannot be measured against where its cells
 * used to be.
 */
function spotAt(x, y) {
  const node = document.elementFromPoint(x, y)?.closest('[data-spot]');
  return node ? readAddress(node.dataset.spot) : null;
}

/** What is sitting at `spot`, or null for an empty cell or slot. */
function read(layout, spot) {
  if (spot.where === 'grid') return layout.order[spot.at] ?? null;
  return layout.trays[spot.side]?.[spot.at] ?? null;
}

/** `layout` with `id` (or nothing) put at `spot`, growing the list to reach. */
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

/** The holes at the end of a list, which are a row of nothing, taken off. */
function trim(list) {
  const next = list.slice();
  while (next.length > 0 && next[next.length - 1] === null) next.pop();
  return next;
}

function tidy(layout) {
  const trays = {};
  for (const side of TRAY_SIDES) trays[side] = trim(layout.trays[side] ?? []);
  return { order: trim(layout.order), trays };
}

/** The one move there is: whatever is at `a` and whatever is at `b` swap. */
function trade(layout, a, b) {
  if (!a || !b || sameSpot(a, b)) return layout;
  const held = read(layout, a);
  const there = read(layout, b);
  return tidy(write(write(layout, a, there), b, held));
}

/** Where a block is right now, grid or tray, or null if it has gone. */
function find(layout, id) {
  const at = layout.order.findIndex((held) => held === id);
  if (at >= 0) return gridAt(at);
  for (const side of TRAY_SIDES) {
    const slot = (layout.trays[side] ?? []).findIndex((held) => held === id);
    if (slot >= 0) return trayAt(side, slot);
  }
  return null;
}

function same(a, b) {
  return a.length === b.length && a.every((id, at) => id === b[at]);
}

function sameLayout(a, b) {
  return (
    same(a.order, b.order) && TRAY_SIDES.every((side) => same(a.trays[side] ?? [], b.trays[side] ?? []))
  );
}

/**
 * @param order     the ids, in their stored order, `null` for a blank cell
 * @param describe  id -> `{ name, note }`, since a tile is too small for a block
 * @param onChange  called with the new order, every time it changes
 * @param columns   how many columns the tab is set to, 1 to 9
 * @param onColumns called with a new count; the chooser is hidden without it
 * @param trays     `{ left, right }` of pinned ids; the rails are hidden without
 *                  `onTrays`
 * @param onTrays   called with the new tray map, every time it changes
 */
export default function BlockArrange({
  order,
  describe,
  onChange,
  columns = null,
  onColumns = null,
  trays = null,
  onTrays = null,
  onClose,
  title = 'Arrange the blocks',
}) {
  const cols = normalizeGridColumns(columns);
  const railed = Boolean(onTrays);

  /* The two halves of the arrangement, held as one thing while it is being
     edited: a block moved onto a tray leaves the grid in the same breath, and
     two states would draw one of those a frame before the other. */
  const committed = {
    order,
    trays: { left: trays?.left ?? [], right: trays?.right ?? [] },
  };

  /* The layout as it looks mid-drag; null when nothing is being dragged. The
     committed one is the prop, so a drop that changes nothing costs no write. */
  const [preview, setPreview] = useState(null);
  /* A pointer is down on this tile, which is what puts the window listeners up.
     `dragId` is the same tile once it has actually moved: a press that never
     moves is a tap, and taps are the other way in. */
  const [pressId, setPressId] = useState(null);
  const [dragId, setDragId] = useState(null);
  /* Tapped, and waiting for somewhere to go. */
  const [armedId, setArmedId] = useState(null);

  /* Mutable twin of the drag, so a pointermove never reads a stale closure and
     never has to wait for a render to know where things are. */
  const live = useRef(null);
  /* Set by a drag that moved, read and cleared by the click that follows it, so
     letting go over a block is not also a tap on that block. */
  const dragged = useRef(false);

  const shown = preview ?? committed;

  /* One spare cell past the last block, always, rounded up to whole rows. The
     spare is what makes blank space reachable: with every cell full there would
     be nowhere to move a block *to* in order to leave a gap behind it. */
  const rows = Math.max(1, Math.ceil((shown.order.length + 1) / cols));
  const cells = rows * cols;

  const named = useCallback((id) => describe(id) ?? { name: String(id), note: null }, [describe]);

  /** Save the layout, both halves, writing only the half that moved. */
  const commit = useCallback(
    (next) => {
      if (!same(next.order, order)) onChange(next.order);
      if (!onTrays) return;
      const was = { left: trays?.left ?? [], right: trays?.right ?? [] };
      if (TRAY_SIDES.some((side) => !same(next.trays[side] ?? [], was[side]))) onTrays(next.trays);
    },
    [order, onChange, onTrays, trays]
  );

  const startDrag = (id) => (event) => {
    dragged.current = false;
    if (event.pointerType === 'touch') return;
    if (event.button !== 0 || live.current) return;

    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      /* the window listeners below carry the drag on their own */
    }

    live.current = {
      id,
      pointerId: event.pointerId,
      base: committed,
      shown: committed,
      at: { x: event.clientX, y: event.clientY },
      moved: false,
    };
    setPressId(id);
  };

  /* Layout effect on purpose: with a passive effect a quick click's pointerup
     can fire before these listeners exist, leaving a tile held with nothing
     left to release it. */
  useLayoutEffect(() => {
    if (pressId === null) return undefined;

    function stop(commitIt) {
      const drag = live.current;
      live.current = null;
      setPressId(null);
      setDragId(null);
      setPreview(null);
      if (!drag) return;
      dragged.current = drag.moved;
      if (commitIt && drag.moved && !sameLayout(drag.shown, drag.base)) commit(drag.shown);
    }

    function onMove(event) {
      const drag = live.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      if (!drag.moved) {
        const far = Math.abs(event.clientX - drag.at.x) + Math.abs(event.clientY - drag.at.y) >= 5;
        if (!far) return;
        drag.moved = true;
        setDragId(drag.id);
        setArmedId(null);
      }

      /* Read against the arrangement on screen and worked out against the one
         that was there before the drag, so the canvas only ever shows the
         committed layout with a single trade in it. */
      const spot = spotAt(event.clientX, event.clientY);
      if (!spot) return;
      const from = find(drag.base, drag.id);
      const next = trade(drag.base, from, spot);
      if (sameLayout(next, drag.shown)) return;
      drag.shown = next;
      setPreview(next);
    }

    function onUp(event) {
      if (live.current && event.pointerId !== live.current.pointerId) return;
      stop(true);
    }

    function onCancel(event) {
      if (live.current && event.pointerId !== live.current.pointerId) return;
      stop(false);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [commit, pressId]);

  /** A tap, a click or Enter on a *block*: pick it up, or put the held one on
      it. The whole of the touch and keyboard path. */
  const tap = (id) => () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    if (armedId === null) {
      setArmedId(id);
      return;
    }
    setArmedId(null);
    if (armedId === id) return;
    drop(find(committed, id));
  };

  /** And on an empty cell or tray slot, which only ever receives. */
  const drop = (spot) => {
    const from = find(committed, armedId);
    setArmedId(null);
    if (!from || !spot) return;
    const next = trade(committed, from, spot);
    if (!sameLayout(next, committed)) commit(next);
  };

  /** One cell in any direction, for a keyboard. Left and right are the slot
      before and after, so the end of a row and the start of the next are
      neighbours the way they are when you read them. A block on a tray is off
      the grid and moves by tapping, which is the same two taps a mouse makes. */
  const onKeyDown = (id) => (event) => {
    const step = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -cols,
      ArrowDown: cols,
    }[event.key];
    if (!step) return;
    const from = find(committed, id);
    if (from?.where !== 'grid') return;
    event.preventDefault();
    /* Moving a block with the arrows is the other way of doing what holding it
       was going to do, so it puts down anything being held. */
    setArmedId(null);

    const to = from.at + step;
    if (to < 0 || to >= cells) return;
    const next = trade(committed, from, gridAt(to));
    if (!sameLayout(next, committed)) commit(next);
  };

  const tile = (id, label) => {
    const block = named(id);
    return (
      <>
        <span className="mini-slot">{label}</span>
        <span className="mini-name">{block.name}</span>
      </>
    );
  };

  /** A tray rail: two slots, drawn where the tray itself will be. */
  const rail = (side) => (
    <div className={`mini-rail mini-rail-${side}`}>
      <span className="mini-rail-label">{side === 'left' ? 'Left tray' : 'Right tray'}</span>
      {Array.from({ length: TRAY_SLOTS }, (_, at) => {
        const spot = trayAt(side, at);
        const id = read(shown, spot);
        const seat = at === 0 ? 'top' : 'bottom';

        if (id === null || id === undefined) {
          return (
            <button
              key={addressKey(spot)}
              type="button"
              data-spot={addressKey(spot)}
              className={`mini-tray-slot${armedId !== null ? ' is-open' : ''}`}
              tabIndex={armedId === null ? -1 : 0}
              onClick={() => drop(spot)}
              aria-label={`${side} tray, ${seat} slot, empty`}
              title="An empty tray slot"
            >
              <span className="mini-tray-seat">{seat}</span>
            </button>
          );
        }

        return (
          <button
            key={addressKey(spot)}
            type="button"
            data-spot={addressKey(spot)}
            className={`mini-tile is-trayed${dragId === id ? ' is-held' : ''}${
              armedId === id ? ' is-armed' : ''
            }`}
            onPointerDown={startDrag(id)}
            onClick={tap(id)}
            title={`${named(id).name} · ${side} tray`}
            aria-label={`${named(id).name} · ${side} tray, ${seat} slot`}
          >
            {tile(id, seat)}
          </button>
        );
      })}
    </div>
  );

  return (
    <Modal
      title={title}
      onClose={onClose}
      accent={PICK_ACCENTS.talent}
      size="page"
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <div className="mini-arrange" style={{ '--mini-cols': cols, '--mini-rows': rows }}>
        <p className="frame-foot" style={{ marginTop: 0 }}>
          Drag a block onto another and the two trade places. Or tap one, then tap where it should
          go. An empty cell takes a block and leaves a hole where it was, so blank space is yours to
          arrange too.
          {railed
            ? ' The rails down either side are the trays: a block put on one is pinned to the edge of the window and never scrolls away.'
            : ''}
        </p>

        {onColumns && (
          <div className="mini-cols">
            <span className="mini-cols-label">Columns</span>
            <span className="mini-cols-chips">
              {COLUMN_CHOICES.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`mini-col${count === cols ? ' is-on' : ''}`}
                  aria-pressed={count === cols}
                  onClick={() => onColumns(count)}
                >
                  {count}
                </button>
              ))}
            </span>
          </div>
        )}

        <div className={`mini-stage${dragId !== null ? ' is-dragging' : ''}`}>
          {railed && rail('left')}

          <div className="mini-canvas">
            {Array.from({ length: cells }, (_, at) => {
              const spot = gridAt(at);
              const id = shown.order[at] ?? null;

              /* A hole, and every cell past the last block. Scenery until
                 something is being moved, and a place to put it once one is. */
              if (id === null) {
                return (
                  <button
                    key={addressKey(spot)}
                    type="button"
                    data-spot={addressKey(spot)}
                    className={`mini-empty${armedId !== null ? ' is-open' : ''}`}
                    tabIndex={armedId === null ? -1 : 0}
                    onClick={() => drop(spot)}
                    aria-label={`Empty · slot ${at + 1}`}
                    title="Empty"
                  />
                );
              }

              return (
                <button
                  key={id}
                  type="button"
                  data-spot={addressKey(spot)}
                  className={`mini-tile${dragId === id ? ' is-held' : ''}${
                    armedId === id ? ' is-armed' : ''
                  }`}
                  onPointerDown={startDrag(id)}
                  onClick={tap(id)}
                  onKeyDown={onKeyDown(id)}
                  title={named(id).note ? `${named(id).name} · ${named(id).note}` : named(id).name}
                  aria-label={`${named(id).name} · slot ${at + 1} of ${cells}`}
                >
                  {tile(id, at + 1)}
                </button>
              );
            })}
          </div>

          {railed && rail('right')}
        </div>

        <p className="mini-foot">
          {armedId === null
            ? 'The tab takes as many of these columns as the window is wide enough for.'
            : `Holding ${named(armedId).name}. Tap where it should go.`}
        </p>
      </div>
    </Modal>
  );
}
