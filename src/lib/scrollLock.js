/**
 * One lock on the page's scroll, however many things are holding it.
 *
 * A dialog and the card stack both need the page behind them to stop moving,
 * and both used to do it the obvious way: remember what `body.overflow` was,
 * set it to `hidden`, and put the old value back on the way out. That works
 * for one of them and quietly breaks for two.
 *
 *   the dialog opens        remembers '',       sets hidden
 *   a card opens over it    remembers 'hidden', sets hidden
 *   the dialog closes       puts back ''
 *   the card closes         puts back 'hidden'   <- and there it stays
 *
 * Nothing is open and the page will not scroll. It depends on the order things
 * are closed in, which is why it only happened sometimes, and it stuck until
 * the next full reload.
 *
 * The fix is that only the *first* lock touches the style and only the *last*
 * release puts it back. Everything in between just counts. Order stops
 * mattering, because no holder remembers a value of its own.
 *
 * ## The body is not always what scrolls
 *
 * Locking `<body>` is the whole job on a page that scrolls as a document, and
 * no job at all on the character sheet, where `body.sheet-fixed` is already
 * `overflow: hidden` and the scrolling happens in a box well inside it: the
 * tab's own `.tab-narrow`, one flex child down from the canvas. A dialog opened
 * from the Advancement tab locked a body that was never moving, and a wheel
 * over the backdrop chained straight past the dialog into the tab underneath.
 * You came out of the talent chooser somewhere else on the page than you went
 * in.
 *
 * So a holder names the element it opened over, and the lock walks up from
 * there and holds every box on the way to the body that is actually scrolled.
 * `lockScroll()` with nothing passed still locks the body alone, which is
 * correct for a dialog that is not inside a scroller of its own.
 */

/* What is being held still, and by how many holders. Keyed by element, so the
   body is simply one of the entries rather than a special case. */
const holds = new Map();

function hold(el) {
  const entry = holds.get(el);
  if (entry) {
    entry.count += 1;
    return;
  }
  holds.set(el, { count: 1, saved: el.style.overflow });
  el.style.overflow = 'hidden';
}

function release(el) {
  const entry = holds.get(el);
  if (!entry) return;
  entry.count -= 1;
  if (entry.count > 0) return;
  el.style.overflow = entry.saved;
  holds.delete(el);
}

/**
 * Every box between `from` and the body that scrolls right now.
 *
 * "Right now" matters: a box that is not overflowing has nothing to scroll and
 * passes a wheel on up to whatever does, so holding it would be work for
 * nothing — and `overflow: hidden` on a box with a visible scrollbar takes the
 * bar away and reflows 15px of width behind the dialog. The sheet's tab
 * scroller reserves its gutter, so holding *that* one moves nothing.
 */
function scrollersAbove(from) {
  const found = [];

  for (let el = from?.parentElement; el && el !== document.body; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY !== 'auto' && overflowY !== 'scroll') continue;
    if (el.scrollHeight <= el.clientHeight) continue;
    found.push(el);
  }
  return found;
}

/**
 * Hold the page still. Pass the element the dialog is drawn in, so the boxes it
 * sits inside are held too. Returns the release, so a React effect can hand it
 * straight back as its cleanup:
 *
 *   useEffect(() => lockScroll(backdropRef.current), []);
 *
 * Releasing twice is harmless; the second call is ignored rather than letting a
 * count drift below zero and freeing the lock early for everybody else.
 */
export function lockScroll(from = null) {
  const targets = [document.body, ...scrollersAbove(from)];
  targets.forEach(hold);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    targets.forEach(release);
  };
}
