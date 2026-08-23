import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import {
  GRID_COLUMN_MAX,
  GRID_COLUMN_MIN,
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
 * -------------------------------------------------------------- three inputs
 * Drag a block with a mouse. Tap a block and then tap the one it should trade
 * places with, on anything. Move the focused block with the arrow keys.
 *
 * A finger never drags. A touch drag has to take the gesture away from the
 * browser with `touch-action: none`, and the canvas is the thing you scroll
 * when the arrangement is taller than the dialog, which one column of six
 * blocks on a phone is. Tap and then tap costs nothing on a small screen, and
 * it is the same path the keyboard takes, so the awkward gesture is the one
 * nobody has to use.
 *
 * Landing on another block is a *trade*, not an insert. "Put the Loadout top
 * right" should move two blocks, where an insert shuffles everything in
 * between, and every arrangement is still reachable because any order is some
 * sequence of swaps. Landing past the last block sends it to the end, which is
 * the only thing an empty cell can mean while blocks flow in reading order.
 *
 * Both commit immediately. There is no Save: the tab behind the dialog
 * rearranges as you go, so what you are choosing is always visible, and Done
 * only closes.
 */

const COLUMN_CHOICES = Array.from(
  { length: GRID_COLUMN_MAX - GRID_COLUMN_MIN + 1 },
  (_, step) => GRID_COLUMN_MIN + step,
);

/** `list` with the blocks at `a` and `b` in each other's places. */
function swap(list, a, b) {
  if (a === b) return list;
  const next = list.slice();
  next[a] = list[b];
  next[b] = list[a];
  return next;
}

/** `list` with the block at `from` lifted out and put back at the end. */
function sendLast(list, from) {
  const next = list.slice();
  next.push(next.splice(from, 1)[0]);
  return next;
}

/** Where a block dropped on cell `cell` ends up. */
function place(list, from, cell) {
  if (from === -1 || cell === -1) return list;
  return cell >= list.length ? sendLast(list, from) : swap(list, from, cell);
}

function same(a, b) {
  return a.length === b.length && a.every((id, at) => id === b[at]);
}

function within(node, x, y) {
  const rect = node?.getBoundingClientRect();
  return Boolean(rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
}

/**
 * @param order     the ids, in their stored order
 * @param describe  id -> `{ name, note }`, since a tile is too small for a block
 * @param onChange  called with the new order, every time it changes
 * @param columns   how many columns the tab is set to, 1 to 9
 * @param onColumns called with a new count; the chooser is hidden without it
 */
export default function BlockArrange({
  order,
  describe,
  onChange,
  columns = null,
  onColumns = null,
  onClose,
  title = 'Arrange the blocks',
}) {
  const cols = normalizeGridColumns(columns);

  /* The order as it looks mid-drag; null when nothing is being dragged. The
     committed order is the prop, so a drop that changes nothing costs no
     write. */
  const [preview, setPreview] = useState(null);
  /* A pointer is down on this tile, which is what puts the window listeners up.
     `dragId` is the same tile once it has actually moved: a press that never
     moves is a tap, and taps are the other way in. */
  const [pressId, setPressId] = useState(null);
  const [dragId, setDragId] = useState(null);
  /* Tapped, and waiting for the block it should trade places with. */
  const [armedId, setArmedId] = useState(null);

  const tiles = useRef(new Map());
  const blanks = useRef(new Map());
  /* Mutable twin of the drag, so a pointermove never reads a stale closure and
     never has to wait for a render to know where things are. */
  const live = useRef(null);
  /* Set by a drag that moved, read and cleared by the click that follows it, so
     letting go over a block is not also a tap on that block. */
  const dragged = useRef(false);

  const shown = preview ?? order;
  const rows = Math.max(1, Math.ceil(shown.length / cols));
  const empties = rows * cols - shown.length;

  const named = useCallback((id) => describe(id) ?? { name: String(id), note: null }, [describe]);

  const holdTile = useCallback((id, node) => {
    if (node) tiles.current.set(id, node);
    else tiles.current.delete(id);
  }, []);

  const holdBlank = useCallback((at, node) => {
    if (node) blanks.current.set(at, node);
    else blanks.current.delete(at);
  }, []);

  /** Which cell of the canvas the pointer is inside, counting the empty ones at
      the end of the last row. -1 between the tiles or outside them. */
  const cellAt = useCallback((list, x, y) => {
    for (let at = 0; at < list.length; at += 1) {
      if (within(tiles.current.get(list[at]), x, y)) return at;
    }
    for (const [at, node] of blanks.current) {
      if (within(node, x, y)) return list.length + at;
    }
    return -1;
  }, []);

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
      base: order.slice(),
      shown: order.slice(),
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

    function stop(commit) {
      const drag = live.current;
      live.current = null;
      setPressId(null);
      setDragId(null);
      setPreview(null);
      if (!drag) return;
      dragged.current = drag.moved;
      if (commit && drag.moved && !same(drag.shown, order)) onChange(drag.shown);
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
         committed order with a single trade in it. */
      const cell = cellAt(drag.shown, event.clientX, event.clientY);
      if (cell === -1) return;
      const next = place(drag.base, drag.base.indexOf(drag.id), cell);
      if (same(next, drag.shown)) return;
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
  }, [cellAt, onChange, order, pressId]);

  /** A tap, a click or Enter: pick a block up, then put it down on the one it
      should trade places with. The whole of the touch and keyboard path. */
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

    const from = order.indexOf(armedId);
    const to = order.indexOf(id);
    if (from === -1 || to === -1) return;
    onChange(swap(order, from, to));
  };

  /** One cell in any direction, for a keyboard. Left and right are the slot
      before and after, so the end of a row and the start of the next are
      neighbours the way they are when you read them. */
  const onKeyDown = (id) => (event) => {
    const step = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -cols,
      ArrowDown: cols,
    }[event.key];
    if (!step) return;
    event.preventDefault();
    /* Moving a block with the arrows is the other way of doing what holding it
       was going to do, so it puts down anything being held. */
    setArmedId(null);

    const from = order.indexOf(id);
    const to = from + step;
    if (from === -1 || to < 0 || to >= order.length) return;
    onChange(swap(order, from, to));
  };

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
          go. The arrow keys move whichever block has focus. The tab behind this rearranges as you
          go, and the arrangement is saved with the character.
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

        <div className={`mini-canvas${dragId !== null ? ' is-dragging' : ''}`}>
          {shown.map((id, at) => {
            const block = named(id);
            return (
              <button
                key={id}
                type="button"
                ref={(node) => holdTile(id, node)}
                className={`mini-tile${dragId === id ? ' is-held' : ''}${
                  armedId === id ? ' is-armed' : ''
                }`}
                onPointerDown={startDrag(id)}
                onClick={tap(id)}
                onKeyDown={onKeyDown(id)}
                title={block.note ? `${block.name} · ${block.note}` : block.name}
                aria-label={`${block.name} · slot ${at + 1} of ${shown.length}`}
              >
                <span className="mini-slot">{at + 1}</span>
                <span className="mini-name">{block.name}</span>
              </button>
            );
          })}

          {/* The rest of the last row. Scenery, except that a block dropped on
              one of them goes to the end, which is the only place it could go. */}
          {Array.from({ length: empties }, (_, at) => (
            <div
              key={`empty-${at}`}
              ref={(node) => holdBlank(at, node)}
              className="mini-empty"
              aria-hidden="true"
            />
          ))}
        </div>

        <p className="mini-foot">
          {armedId === null
            ? 'The tab takes as many of these columns as the window is wide enough for.'
            : `Holding ${named(armedId).name}. Tap the block it should trade places with.`}
        </p>
      </div>
    </Modal>
  );
}
