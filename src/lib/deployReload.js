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
 * ------------------------------------------------------------ the cache
 * And a reload alone is not always enough. The host marks everything under
 * /assets/ as cached for a year, and that header rides on its HTML answer for a
 * missing file too, so a browser that asked for a script at the wrong moment
 * keeps the page in its place for a year and a plain reload never asks again.
 * So before reloading, the scripts the failed import needed are fetched again
 * past the cache, which writes the real file over the bad copy.
 *
 * Imported for its effect, first thing, by src/main.jsx.
 */

const RELOADED_AT = 'hzbd-reloaded-for-deploy';
const ONCE_MS = 30_000;

/** The scripts a failed import needed: any address the error names, and every preload on the page. */
function scriptsOf(error) {
  const urls = new Set();
  const named = /(https?:\/\/[^\s'"()]+?\.js)\b/.exec(String(error?.message ?? error ?? ''));
  if (named) urls.add(named[1]);
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) if (link.href) urls.add(link.href);
  return [...urls].filter((url) => url.startsWith(window.location.origin));
}

/** Fetch those scripts past the cache, so a bad copy is overwritten, then load the page again. */
export async function repairAndReload(error) {
  await Promise.all(scriptsOf(error).map((url) => fetch(url, { cache: 'reload' }).catch(() => {})));
  window.location.reload();
}

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
  repairAndReload(event.payload);
  return true;
}

if (typeof window !== 'undefined') window.addEventListener('vite:preloadError', reloadOnStaleDeploy);
