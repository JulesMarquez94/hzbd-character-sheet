import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { mathLine } from '../../lib/statMath.js';

/** How close to the edge of the screen a bubble is allowed to sit. */
const EDGE = 8;

/**
 * Hover/focus tooltip bound to a whole element rather than a separate icon —
 * spread `tipProps` onto the tile and attach `ref`, render `tip` inside it.
 * Rendered `position: fixed` and placed from the tile's own bounding box, so
 * it escapes the block's `overflow: hidden` instead of getting clipped by it.
 *
 * `math` is the second half of the bubble: the sum behind the number, with every
 * source named, on one line under the words. See statMath.js. It is a separate
 * argument rather than more prose because the words say what a stat is *for* and
 * never change, while the sum is this character's own and changes every time
 * something is equipped, laid on or given in to — and because the line is set in
 * tabular figures and wants a rule above it.
 *
 * Either half alone is enough to open a bubble: a tile with a breakdown and no
 * explanation still has something to say, which is what lets a pool label carry
 * its ceiling's arithmetic without needing a sentence written for it first.
 */
export function useHoverTip(text, math = null) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, flip: false, nudge: 0 });
  const ref = useRef(null);
  const bubbleRef = useRef(null);

  function place() {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const flip = rect.top < 90; // not enough headroom above — drop it below instead
    setPos({
      top: flip ? rect.bottom + 8 : rect.top - 8,
      left: rect.left + rect.width / 2,
      flip,
      nudge: 0,
    });
  }

  /* Centred on the tile, a bubble wider than twice the tile's distance from the
     edge hangs off the screen — and the first attribute tile on a phone is 60px
     from it. So the bubble is measured once it exists and slid back inside, which
     is the only point either width is known: the tile's is read before the bubble
     renders, and the bubble's own depends on how long the math line came out.
     Layout effect and not an effect, so it never paints in the wrong place first.

     The deps are the placement rather than `pos` itself, so the nudge this writes
     cannot re-run it: a bubble is measured once per opening. */
  useLayoutEffect(() => {
    if (!open) return;
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (!rect) return;

    const room = window.innerWidth;
    let nudge = 0;
    if (rect.left < EDGE) nudge = EDGE - rect.left;
    else if (rect.right > room - EDGE) nudge = room - EDGE - rect.right;

    if (nudge) setPos((last) => ({ ...last, nudge: last.nudge + nudge }));
  }, [open, pos.left, pos.top]);

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

  const sum = mathLine(math);
  const has = Boolean(text || sum);

  const tipProps = has
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
    open && has ? (
      <span
        className={`info-tip-bubble${pos.flip ? ' flip' : ''}`}
        style={{ top: pos.top, left: pos.left + pos.nudge }}
        role="tooltip"
        ref={bubbleRef}
      >
        {text}
        {sum && <span className="info-tip-math">{sum}</span>}
      </span>
    ) : null;

  return { ref, tipProps, tip };
}
