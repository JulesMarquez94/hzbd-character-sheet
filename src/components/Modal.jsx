import { useEffect, useRef } from 'react';
import { lockScroll } from '../lib/scrollLock.js';

/* Every open dialog, bottom to top. They all hear the same document keydown,
   so without this a chooser opened from inside another chooser would close
   both on one Escape. Mount order is stacking order; only the top one acts.
   (Cards go over dialogs too, but CardStack swallows Escape in the capture
   phase before any of these listeners run.) */
const openDialogs = [];

/**
 * Generic dialog shell — Escape closes, backdrop click closes, body scroll locks.
 *
 * `wide` is the roomy editor width; `size` names a wider one still ("page", for
 * a dialog that lays cards out at their real footprint).
 *
 * `accent` is the colour of whatever opened the dialog. A chooser is opened from
 * a choice that already has a colour — amber for talents, violet for lineage,
 * cyan for a background — and the dialog carries it so the reader never loses
 * track of which of the three they are inside.
 */
export default function Modal({
  title,
  onClose,
  children,
  footer,
  wide = false,
  size = null,
  accent = null,
}) {
  /* `onClose` is usually a fresh arrow on every render. Reading it through a
     ref keeps the effect below on empty deps — re-running it would pop and
     re-push this dialog and scramble the stacking order. */
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const entry = {};
    openDialogs.push(entry);

    function onKeyDown(e) {
      if (e.key !== 'Escape') return;
      if (openDialogs[openDialogs.length - 1] !== entry) return;
      closeRef.current();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      const at = openDialogs.indexOf(entry);
      if (at >= 0) openDialogs.splice(at, 1);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  /* Held for as long as the dialog is mounted, and nothing else. */
  useEffect(() => lockScroll(), []);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`modal-window${size ? ` modal-window-${size}` : wide ? ' modal-window-wide' : ''}`}
        style={accent ? { '--pick-accent': accent } : undefined}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
