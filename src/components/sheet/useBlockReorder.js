import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/*
 * Drag-to-reorder for the six Character-tab blocks.
 *
 * Pointer events rather than HTML5 drag-and-drop: the blocks have to move
 * under a finger as well as a mouse, and native DnD does not fire on touch.
 * The dragged block stays in the grid as a dimmed slot while a fixed-position
 * copy follows the pointer, so the grid never has to animate a gap open.
 */

/** How close to a scroll edge the pointer has to get before the page follows. */
const EDGE = 70;
/** Pixels per frame at the very edge, tapering to zero at EDGE away from it. */
const EDGE_SPEED = 16;

/** Nearest scrollable ancestor — the sheet canvas, in practice. */
function findScroller(node) {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    const overflow = getComputedStyle(el).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight) {
      return el;
    }
  }
  return document.scrollingElement;
}

/** `list` with the item at `from` lifted out and dropped back in at `to`. */
function move(list, from, to) {
  const next = list.slice();
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

/**
 * @param {number[]} order   the committed order
 * @param {(next: number[]) => void} onChange  called once, on drop
 * @param {boolean} disabled  viewers get no grips at all
 */
export default function useBlockReorder({ order, onChange, disabled = false }) {
  // The floating copy: which block, where the pointer is, and the grab offset.
  const [ghost, setGhost] = useState(null);
  // The order as it looks mid-drag. Null when nothing is being dragged.
  const [preview, setPreview] = useState(null);

  const cells = useRef(new Map());
  // Mutable twin of the drag state, so the window listeners never read a
  // stale closure and a pointermove doesn't have to wait for a render.
  const live = useRef(null);
  const scroller = useRef(null);

  const registerCell = useCallback((id, node) => {
    if (node) cells.current.set(id, node);
    else cells.current.delete(id);
  }, []);

  /** Drop the dragged block into whichever slot the pointer is inside. */
  const sortInto = useCallback((x, y) => {
    const drag = live.current;
    if (!drag) return;

    const target = drag.order.findIndex((id) => {
      const rect = cells.current.get(id)?.getBoundingClientRect();
      return rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
    if (target === -1) return;

    const from = drag.order.indexOf(drag.id);
    if (from === target) return;

    drag.order = move(drag.order, from, target);
    setPreview(drag.order);
  }, []);

  const startDrag = useCallback(
    (id) => (event) => {
      // Left button / touch / pen only, and never while something else drags.
      if (disabled || event.button !== 0 || live.current) return;

      const rect = cells.current.get(id)?.getBoundingClientRect();
      if (!rect) return;

      // Stops the browser from claiming the gesture as a scroll or a selection.
      event.preventDefault();
      try {
        // Keeps the grip as the event target even once the pointer leaves it.
        // Throws if the pointer is already gone, which is not worth a crash.
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } catch {
        /* the window listeners below carry the drag on their own */
      }

      live.current = {
        id,
        pointerId: event.pointerId,
        order: order.slice(),
        x: event.clientX,
        y: event.clientY,
      };
      scroller.current = findScroller(cells.current.get(id));

      setPreview(order.slice());
      setGhost({
        id,
        x: event.clientX,
        y: event.clientY,
        offX: event.clientX - rect.left,
        offY: event.clientY - rect.top,
        w: rect.width,
        h: rect.height,
      });
    },
    [disabled, order]
  );

  const dragging = ghost !== null;

  /* Layout effect on purpose: with a passive effect a quick tap's pointerup
     can fire before these listeners exist, stranding the ghost mid-air until
     the next unrelated click "drops" it. This subscribes before the browser
     is allowed to deliver that pointerup. */
  useLayoutEffect(() => {
    if (!dragging) return undefined;

    function stop(commit) {
      const drag = live.current;
      live.current = null;
      setGhost(null);
      setPreview(null);

      if (commit && drag && drag.order.some((id, i) => id !== order[i])) {
        onChange(drag.order);
      }
    }

    // Blocks near the top or bottom of a scrolled canvas are otherwise
    // unreachable — on a phone only one block is on screen at a time.
    function autoScroll() {
      const drag = live.current;
      const box = scroller.current;
      if (!drag || !box) return;

      const isPage = box === document.scrollingElement;
      const rect = isPage ? null : box.getBoundingClientRect();
      const top = isPage ? 0 : rect.top;
      const bottom = isPage ? window.innerHeight : rect.bottom;

      let dy = 0;
      if (drag.y < top + EDGE) dy = -EDGE_SPEED * Math.min(1, (top + EDGE - drag.y) / EDGE);
      else if (drag.y > bottom - EDGE) dy = EDGE_SPEED * Math.min(1, (drag.y - (bottom - EDGE)) / EDGE);
      if (dy === 0) return;

      box.scrollTop += dy;
      // The blocks moved under a still pointer, so re-test the slot.
      sortInto(drag.x, drag.y);
    }

    function onMove(event) {
      const drag = live.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      drag.x = event.clientX;
      drag.y = event.clientY;
      setGhost((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : prev));
      sortInto(event.clientX, event.clientY);
      autoScroll();
    }

    function onUp(event) {
      if (live.current && event.pointerId !== live.current.pointerId) return;
      stop(true);
    }

    function onCancel() {
      stop(false);
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') stop(false);
    }

    // Held still at the edge, the canvas has to keep coming to the pointer.
    let frame = requestAnimationFrame(function step() {
      autoScroll();
      frame = requestAnimationFrame(step);
    });

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dragging, onChange, order, sortInto]);

  /** Arrow keys on a focused grip step a block one slot either way. */
  const nudge = useCallback(
    (id) => (event) => {
      if (disabled) return;

      const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
      if (!step) return;

      const from = order.indexOf(id);
      if (from === -1) return;

      // Step over blocks a filter is hiding (they have no registered cell) —
      // swapping with an invisible neighbour looks like the key doing nothing.
      let to = from + step;
      while (to >= 0 && to < order.length && !cells.current.has(order[to])) to += step;
      if (to < 0 || to >= order.length) return;

      event.preventDefault();
      onChange(move(order, from, to));
    },
    [disabled, onChange, order]
  );

  return {
    /** What to render right now: the live preview during a drag, else the real order. */
    order: preview ?? order,
    ghost,
    dragId: ghost?.id ?? null,
    registerCell,
    gripProps: (id) => ({ onPointerDown: startDrag(id), onKeyDown: nudge(id) }),
  };
}
