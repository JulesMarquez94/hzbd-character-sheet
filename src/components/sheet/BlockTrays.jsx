import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { TRAY_SIDES, TRAY_SLOTS, traysHold } from '../../lib/characterModel.js';

/**
 * The two side trays: the blocks you keep within reach.
 *
 * A tab is a grid you scroll. That is right for eighteen blocks and wrong for
 * the two or three you touch every turn: your quick bar is at the top of the
 * Character tab and the fight you are in is somewhere near the bottom, and a
 * turn spent scrolling between them is a turn spent scrolling. So either side
 * of the window has a tray, two slots apiece, pushed open by a handle on the
 * edge of the screen. What is on one does not move when the tab does, because
 * it is not on the tab: it is pinned to the window.
 *
 * Which blocks are on which tray is chosen in the arranger, where the rails are
 * drawn either side of the canvas exactly where they will be here. See
 * BlockArrange.jsx and normalizeTrays.
 *
 * ---------------------------------------------------------------- the desktop
 * A handle per side, and one tray open at a time on that side. Open, the tray
 * is a block wide and the canvas is pushed over to make room for it, rather
 * than the tray being laid over the top of blocks somebody is reading. Two
 * trays can stand open at once, one either side, which on a wide screen is four
 * blocks that never scroll.
 *
 * ----------------------------------------------------------------- the phone
 * There is no room beside anything at 360px, so the trays are quick access
 * instead. The four slots become four handles at the four corners of the screen
 * edges, top left and bottom left, top right and bottom right, and one of them
 * opens its block over the whole screen. Slide it off the way it came to put it
 * away, or press the close.
 *
 * Nothing here writes. A block in a tray is the same block it was in the grid,
 * with the same live values and the same buttons.
 */

/** Where the phone layout starts, the same place the tab bar folds into a
    burger. See RESPONSIVE at the foot of sheet.css. */
const PHONE = '(max-width: 820px)';

/** How far a slide has to travel before it counts as putting the block away. */
const SLIDE_OFF = 90;

/**
 * The narrowest window that can hold both trays open with a block still between
 * them: two trays, the gap either side of them, and a block. Under it, opening
 * one tray puts the other away, because two trays with the blocks squeezed out
 * from between them is not a tab any more.
 *
 * 1236 is the sum: a rail is 422 at its widest, which is a block, the panel's
 * padding, its border and the handle, plus the 15px scrollbar the panel grows
 * on a window too short for two blocks; the canvas keeps 16px past each of
 * them; and a block is 360. It was 1200, taken as a round number, and at 1200
 * exactly both trays would open and leave 324px between them for a 360px block,
 * which put 36px of that block under the right-hand tray.
 *
 * Read at the moment of the press rather than watched, so there is no listener
 * to keep in step. A window shrunk below this with both already open keeps them
 * both until the next press, which is a moment nobody is looking at the width.
 */
const BOTH_TRAYS = 1240;

/** Whether this is the phone layout, read off the same query the stylesheet
    asks. Subscribed rather than held in state: the media query is the outside
    world, and this is the hook for reading the outside world. */
/** One tray pulled or pushed, and the other put away when there is no room for
    both. See BOTH_TRAYS. */
function pull(was, side) {
  const other = side === 'left' ? 'right' : 'left';
  const next = { ...was, [side]: !was[side] };
  if (next[side] && window.innerWidth < BOTH_TRAYS) next[other] = false;
  return next;
}

function usePhone() {
  return useSyncExternalStore(
    (wake) => {
      const query = window.matchMedia?.(PHONE);
      if (!query) return () => {};
      query.addEventListener('change', wake);
      return () => query.removeEventListener('change', wake);
    },
    () => window.matchMedia?.(PHONE).matches ?? false
  );
}

/**
 * @param trays     `{ left, right }` of block ids, holes and all
 * @param render    id -> the block itself, the same node the grid would draw
 * @param describe  id -> `{ name, note }`, for the handle and the label
 */
export default function BlockTrays({ trays, render, describe }) {
  const phone = usePhone();
  /* The rail elements, for measuring the push against. See the effect below. */
  const rails = useRef({});
  /* Which side is pushed open on a desktop. Both may be, one each side. */
  const [open, setOpen] = useState({ left: false, right: false });
  /* And which single block is over the whole screen on a phone: `{ side, at }`.
     One at a time, which is all there is room for. */
  const [shown, setShown] = useState(null);

  const named = useCallback(
    (id) => describe?.(id) ?? { name: String(id), note: null },
    [describe]
  );

  /* The push. A tray laid over the blocks would cover the one thing somebody is
     reading, so the canvas gives up the width instead: see `.tray-open-left` in
     sheet.css. The class goes on the body because the canvas is two components
     up from here and this is the only thing that needs to say so.

     And how much width, measured off the rail rather than written down twice.
     A rail is a block, the panel's padding either side of it, a border and the
     handle down its edge, and it grows another 15px the moment the panel has to
     scroll, which it does on any window too short for two blocks. The
     stylesheet's arithmetic came to 11px less than that, so the handle lay over
     the first block; now the blocks are pulled up against the tray, being right
     is the difference between a gap and an overlap. The observer is for the
     scrollbar coming and going under a window resize, which changes the rail
     without changing anything React knows about. */
  useEffect(() => {
    const held = [];
    const watching = [];
    for (const side of TRAY_SIDES) {
      const on = !phone && open[side] && traysHold(trays, side);
      if (!on) continue;
      held.push(`tray-open-${side}`);

      const rail = rails.current[side];
      if (!rail) continue;
      const measure = () =>
        document.body.style.setProperty(`--tray-${side}`, `${rail.getBoundingClientRect().width}px`);
      measure();
      const watch = new ResizeObserver(measure);
      watch.observe(rail);
      watching.push(watch);
    }
    document.body.classList.add(...held);

    return () => {
      for (const watch of watching) watch.disconnect();
      document.body.classList.remove(`tray-open-left`, `tray-open-right`);
      document.body.style.removeProperty('--tray-left');
      document.body.style.removeProperty('--tray-right');
    };
  }, [open, phone, trays]);

  /* A phone that grows into a desktop, or the other way, puts away whatever was
     open in the layout that no longer exists. Set during the render that hears
     about it rather than in an effect: React takes the new state before it
     paints, so nothing is ever drawn in the layout it does not belong to. */
  const [was, setWas] = useState(phone);
  if (was !== phone) {
    setWas(phone);
    setShown(null);
    setOpen({ left: false, right: false });
  }

  const sides = TRAY_SIDES.filter((side) => traysHold(trays, side));
  if (sides.length === 0) return null;

  if (phone) {
    return (
      <>
        <div className="tray-tabs" aria-label="Trays">
          {sides.map((side) =>
            Array.from({ length: TRAY_SLOTS }, (_, at) => {
              const id = trays[side]?.[at] ?? null;
              if (id === null || id === undefined) return null;
              return (
                <button
                  key={`${side}-${at}`}
                  type="button"
                  className={`tray-tab tray-tab-${side} tray-tab-${at === 0 ? 'top' : 'bottom'}`}
                  onClick={() => setShown({ side, at })}
                  aria-label={`Open ${named(id).name}`}
                  title={named(id).name}
                >
                  <span className="tray-tab-name">{named(id).name}</span>
                </button>
              );
            })
          )}
        </div>

        {shown && (
          <TraySheet
            name={named(trays[shown.side]?.[shown.at]).name}
            side={shown.side}
            onClose={() => setShown(null)}
          >
            {render(trays[shown.side][shown.at])}
          </TraySheet>
        )}
      </>
    );
  }

  return (
    <>
      {sides.map((side) => (
        <div
          key={side}
          ref={(node) => {
            rails.current[side] = node;
          }}
          className={`tray-rail tray-rail-${side}${open[side] ? ' is-open' : ''}`}
        >
          <button
            type="button"
            className="tray-handle"
            aria-expanded={open[side]}
            onClick={() => setOpen((was) => pull(was, side))}
            title={open[side] ? 'Push the tray back in' : 'Pull the tray open'}
          >
            <span className="tray-handle-arrow" aria-hidden="true">
              {(side === 'left') === Boolean(open[side]) ? '‹' : '›'}
            </span>
            <span className="tray-handle-name">
              {(trays[side] ?? [])
                .filter((id) => id !== null && id !== undefined)
                .map((id) => named(id).name)
                .join(' · ')}
            </span>
          </button>

          {open[side] && (
            <div className="tray-panel">
              {(trays[side] ?? []).map((id, at) =>
                id === null || id === undefined ? null : (
                  <section className="sheet-cell tray-cell" key={`${side}-${at}`}>
                    {render(id)}
                  </section>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

/**
 * One block over the whole phone screen, put away by sliding it off the side it
 * came from.
 *
 * The slide is the gesture the ask names, and it is worth the handling: a tray
 * is quick access, and quick access that costs a trip to a close button in the
 * corner is a drawer. The close is still there for anybody who would rather
 * press something, and for a pointer that cannot slide.
 *
 * `touch-action: pan-y` on the sheet is what makes both work at once: the
 * browser keeps the vertical scroll, which is the block's own, and the
 * horizontal is ours.
 */
function TraySheet({ name, side, children, onClose }) {
  const [slid, setSlid] = useState(0);
  const from = useRef(null);

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function down(event) {
    from.current = { x: event.clientX, y: event.clientY, tracking: false, travelled: 0 };
  }

  function move(event) {
    const start = from.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    /* Which gesture this is, decided once and then held: a finger that started
       down the page is scrolling the block and must not drag the sheet with it
       when it wanders sideways. */
    if (!start.tracking) {
      if (Math.abs(dx) < 12 || Math.abs(dx) <= Math.abs(dy)) return;
      start.tracking = true;
    }

    /* Only off the side it came from. Pulling it the other way does nothing,
       which is what the rubber band of a real drawer says.

       How far it has gone is kept on the gesture as well as in state. The state
       is what the sheet is drawn at, and a render can lag a fast flick or be
       batched away entirely; the ref is what "far enough" is judged on, and it
       is true the instant the finger moves. */
    start.travelled = side === 'left' ? Math.min(0, dx) : Math.max(0, dx);
    setSlid(start.travelled);
  }

  function up() {
    const gone = Math.abs(from.current?.travelled ?? 0) >= SLIDE_OFF;
    from.current = null;
    setSlid(0);
    if (gone) onClose();
  }

  return (
    <div className="tray-sheet-wrap" role="dialog" aria-modal="true" aria-label={name}>
      <div
        className={`tray-sheet tray-sheet-${side}`}
        style={slid ? { transform: `translateX(${slid}px)` } : undefined}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <div className="tray-sheet-head">
          <span className="tray-sheet-grip" aria-hidden="true" />
          <span className="tray-sheet-name">{name}</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="tray-sheet-body">{children}</div>

        <p className="tray-sheet-foot">Slide it off the side to put it away.</p>
      </div>
    </div>
  );
}
