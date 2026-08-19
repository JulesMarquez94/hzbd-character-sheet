import { useEffect, useRef, useState } from 'react';

/**
 * Hover/focus tooltip bound to a whole element rather than a separate icon —
 * spread `tipProps` onto the tile and attach `ref`, render `tip` inside it.
 * Rendered `position: fixed` and placed from the tile's own bounding box, so
 * it escapes the block's `overflow: hidden` instead of getting clipped by it.
 */
export function useHoverTip(text) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, flip: false });
  const ref = useRef(null);

  function place() {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const flip = rect.top < 90; // not enough headroom above — drop it below instead
    setPos({
      top: flip ? rect.bottom + 8 : rect.top - 8,
      left: rect.left + rect.width / 2,
      flip,
    });
  }

  /* The bubble is fixed-position and placed once, so a block scrolling under
     it would leave it floating over the wrong row. Close it instead. Capture
     phase, because the scroll comes from an inner `cell-scroll`, not window. */
  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const tipProps = text
    ? {
        tabIndex: 0,
        onMouseEnter: () => {
          place();
          setOpen(true);
        },
        onMouseLeave: () => setOpen(false),
        onFocus: () => {
          place();
          setOpen(true);
        },
        onBlur: () => setOpen(false),
      }
    : {};

  const tip =
    open && text ? (
      <span
        className={`info-tip-bubble${pos.flip ? ' flip' : ''}`}
        style={{ top: pos.top, left: pos.left }}
        role="tooltip"
      >
        {text}
      </span>
    ) : null;

  return { ref, tipProps, tip };
}
