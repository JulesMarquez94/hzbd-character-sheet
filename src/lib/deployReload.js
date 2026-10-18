/**
 * A page left open across a deploy still asks for its split files by the names
 * the old build gave them, and the new deploy has none of those names. The
 * host answers a missing file with the app's own HTML page, so the import fails
 * and whatever it was for never arrives: a page, the physics dice, the Fief's
 * board. Jules met it on 2026-10-18 as a town with no map.
 *
 * Vite says so with `vite:preloadError`, and the fix is the one its docs give:
 * load the page again, which fetches the new build and the new names. Once
 * only. If the reload a moment ago did not help, the failure is something else
 * and is let through to whatever was waiting on it, which says so itself.
 *
 * Imported for its effect, first thing, by src/main.jsx.
 */

const RELOADED_AT = 'hzbd-reloaded-for-deploy';
const ONCE_MS = 30_000;

export function reloadOnStaleDeploy(event) {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT)) || 0;
    if (Date.now() - last < ONCE_MS) return false;
    sessionStorage.setItem(RELOADED_AT, String(Date.now()));
  } catch {
    /* Site data blocked, so "once" cannot be remembered and a reload could
       loop. Let the failure through instead. */
    return false;
  }
  event.preventDefault();
  window.location.reload();
  return true;
}

if (typeof window !== 'undefined') window.addEventListener('vite:preloadError', reloadOnStaleDeploy);
