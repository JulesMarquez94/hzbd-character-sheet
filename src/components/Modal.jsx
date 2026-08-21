import { useEffect, useRef } from 'react';
import { lockScroll } from '../lib/scrollLock.js';

/* Every open dialog, bottom to top. They all hear the same document keydown,
   so without this a chooser opened from inside another chooser would close
   both on one Escape. Mount order is stacking order; only the top one acts.
   (Cards go over dialogs too, but CardStack swallows Escape in the capture
   phase before any of these listeners run.) */
const openDialogs = [];

/**
 * Generic dialog shell — Escape closes, backdrop click closes, page scroll locks.
 *
 * `wide` is the roomy editor width; `size` names a wider one still ("page", for
 * a dialog that lays cards out at their real footprint).
 *
 * `accent` is the colour of whatever opened the dialog. A chooser is opened from
 * a choice that already has a colour — amber for talents, violet for lineage,
 * cyan for a background — and the dialog carries it so the reader never loses
 * track of which of the three they are inside.
 *
 * `action` rides in the header, between the title and the close, for the one
 * control that is *about* the dialog rather than in it. The codex browser's "make
 * an enchanted item" is the case it was added for: everything in the body answers
 * "which of these", and that button answers "none of these". At the foot it would
 * have read as the way out of the dialog, which it is not.
 */
export default function Modal({
  title,
  onClose,
  children,
  footer,
  action = null,
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

  const backdrop = useRef(null);

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

  /* Held for as long as the dialog is mounted, and nothing else. Named from the
     backdrop, because on the character sheet the box that scrolls is the tab
     the dialog was opened from and not the body — see scrollLock.js. */
  useEffect(() => lockScroll(backdrop.current), []);

  /**
   * Come out of a chooser where the choice was made.
   *
   * A dialog opened from a choice panel is a detour, and the page behind it is
   * long: twelve level blocks, each with up to four panels. Closing the dialog
   * used to leave you wherever the page happened to be, which after taking a
   * talent is not where you were — the panel has just grown a set, its cards
   * and whatever the set asks for next. So the panel that opened the dialog is
   * put back at the top of its scroller on the way out: choose a talent, and you
   * land looking at Talent Set.
   *
   * The panel is found once, on the way in, rather than off a node that is being
   * unmounted. A dialog opened from anywhere other than a choice panel finds
   * nothing and scrolls nothing, which is every dialog on the other tabs.
   */
  useEffect(() => {
    const panel = backdrop.current?.closest('.pick-block');
    if (!panel) return undefined;

    return () => {
      /* After the commit that closed the dialog, so the panel is its new height
         and the scroller has released its hold. */
      requestAnimationFrame(() => {
        if (panel.isConnected) panel.scrollIntoView({ block: 'start' });
      });
    };
  }, []);

  return (
    <div
      className="modal-backdrop"
      ref={backdrop}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`modal-window${size ? ` modal-window-${size}` : wide ? ' modal-window-wide' : ''}`}
        style={accent ? { '--pick-accent': accent } : undefined}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2>{title}</h2>
          {action && <span className="modal-header-action">{action}</span>}
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
