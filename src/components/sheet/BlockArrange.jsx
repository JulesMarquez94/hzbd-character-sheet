import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import { PICK_ACCENTS } from './pickAccents.js';

/**
 * Arranging the six Character-tab blocks, from a list rather than on the tab.
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
 * So the arrangement is edited somewhere the whole of it fits: six short rows,
 * all visible at once, on any screen. Dragging one over another is a gesture
 * that lasts a moment instead of a journey.
 *
 * ------------------------------------------------------------ two ways in
 * Every row can be dragged, and every row also has a pair of step buttons.
 * That is not redundancy for its own sake: precise dragging is exactly the
 * thing that is hard on a small screen with a large finger, and "move this one
 * up" is a tap. The buttons are also what makes this usable from a keyboard,
 * where a drag has no meaning at all.
 *
 * Both commit immediately. There is no Save: the tab behind the modal reorders
 * as you go, so what you are choosing is always visible, and Done only closes.
 */

/** `list` with the item at `from` lifted out and dropped back in at `to`. */
function move(list, from, to) {
  const next = list.slice();
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

/**
 * @param order     the ids, in their stored order
 * @param describe  id -> `{ name, note }`, since a row cannot show the block
 * @param onChange  called with the new order, every time it changes
 */
export default function BlockArrange({
  order,
  describe,
  onChange,
  onClose,
  title = 'Arrange the blocks',
}) {
  /* The order as it looks mid-drag; null when nothing is being dragged. The
     committed order is the prop, so a drop that changes nothing costs no
     write. */
  const [preview, setPreview] = useState(null);
  const [heldId, setHeldId] = useState(null);

  const rows = useRef(new Map());
  /* Mutable twin of the drag, so a pointermove never reads a stale closure and
     never has to wait for a render to know where things are. */
  const live = useRef(null);

  const shown = preview ?? order;

  const registerRow = useCallback((id, node) => {
    if (node) rows.current.set(id, node);
    else rows.current.delete(id);
  }, []);

  /** Drop the held row into whichever row the pointer is inside. */
  const sortInto = useCallback((y) => {
    const drag = live.current;
    if (!drag) return;

    const target = drag.order.findIndex((id) => {
      const rect = rows.current.get(id)?.getBoundingClientRect();
      return rect && y >= rect.top && y <= rect.bottom;
    });
    if (target === -1) return;

    const from = drag.order.indexOf(drag.id);
    if (from === target) return;

    drag.order = move(drag.order, from, target);
    setPreview(drag.order);
  }, []);

  const startDrag = useCallback(
    (id) => (event) => {
      // The step buttons live inside the row and are taps, not grabs.
      if (event.target.closest('.arrange-step')) return;
      if (event.button !== 0 || live.current) return;

      // Stops the browser reading the gesture as a scroll or a text selection.
      event.preventDefault();
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } catch {
        /* the window listeners below carry the drag on their own */
      }

      live.current = { id, pointerId: event.pointerId, order: order.slice() };
      setHeldId(id);
      setPreview(order.slice());
    },
    [order]
  );

  /* Layout effect on purpose: with a passive effect a quick tap's pointerup can
     fire before these listeners exist, leaving a row held with nothing left to
     release it. */
  useLayoutEffect(() => {
    if (heldId === null) return undefined;

    function stop(commit) {
      const drag = live.current;
      live.current = null;
      setHeldId(null);
      setPreview(null);
      if (commit && drag && drag.order.some((id, i) => id !== order[i])) onChange(drag.order);
    }

    function onMove(event) {
      const drag = live.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      sortInto(event.clientY);
    }

    function onUp(event) {
      if (live.current && event.pointerId !== live.current.pointerId) return;
      stop(true);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', () => stop(false));

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [heldId, onChange, order, sortInto]);

  /** One step either way, for a tap or for a keyboard. */
  const step = useCallback(
    (id, delta) => {
      const from = order.indexOf(id);
      const to = from + delta;
      if (from === -1 || to < 0 || to >= order.length) return;
      onChange(move(order, from, to));
    },
    [onChange, order]
  );

  function onKeyDown(id) {
    return (event) => {
      const delta = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[event.key];
      if (!delta) return;
      event.preventDefault();
      step(id, delta);
    };
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        Drag a row, or step it with the arrows. The tab behind this reorders as you go, and the
        order is saved with the character.
      </p>

      <ol className={`arrange-list${heldId !== null ? ' is-dragging' : ''}`}>
        {shown.map((id, index) => {
          const block = describe(id) ?? { name: String(id), note: null };
          return (
            <li
              key={id}
              ref={(node) => registerRow(id, node)}
              className={`arrange-row${heldId === id ? ' is-held' : ''}`}
              onPointerDown={startDrag(id)}
            >
              <span className="arrange-grip" aria-hidden="true">
                <span className="grip-dots" />
              </span>

              <span className="arrange-slot">{index + 1}</span>

              <span className="arrange-body">
                <span className="arrange-name">{block.name}</span>
                {block.note && <span className="arrange-note">{block.note}</span>}
              </span>

              <span className="arrange-steps">
                <button
                  type="button"
                  className="arrange-step"
                  disabled={index === 0}
                  onClick={() => step(id, -1)}
                  onKeyDown={onKeyDown(id)}
                  aria-label={`Move ${block.name} up, from position ${index + 1} of ${shown.length}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="arrange-step"
                  disabled={index === shown.length - 1}
                  onClick={() => step(id, 1)}
                  onKeyDown={onKeyDown(id)}
                  aria-label={`Move ${block.name} down, from position ${index + 1} of ${shown.length}`}
                >
                  ↓
                </button>
              </span>
            </li>
          );
        })}
      </ol>
    </Modal>
  );
}
