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
 */

let held = 0;
let saved = '';

/**
 * Hold the page still. Returns the release, so a React effect can hand it
 * straight back as its cleanup:
 *
 *   useEffect(() => lockScroll(), []);
 *
 * Releasing twice is harmless; the second call is ignored rather than letting
 * the count drift below zero and freeing the lock early for everybody else.
 */
export function lockScroll() {
  if (held === 0) {
    saved = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  held += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    held -= 1;
    if (held === 0) document.body.style.overflow = saved;
  };
}
