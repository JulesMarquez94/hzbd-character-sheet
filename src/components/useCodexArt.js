import { useCallback, useSyncExternalStore } from 'react';
import { useAuth } from '../context/auth-context.js';
import { CODEX_SCHEME } from '../lib/codexArt.js';
import { getVersion, subscribe, urlFor } from '../lib/codexSigner.js';
import { viewUrl } from '../lib/imageViews.js';

/**
 * The one place that decides whether a picture from the codex is drawn, and
 * where it is drawn from.
 *
 * Card art is a friend capability: `free` and `premium` get the sheet with its
 * plates left empty, and `friend` and `admin` get the pictures. The ladder and
 * the rule live in src/lib/tiers.js; this is the hook that applies it at the
 * moment of drawing, so no component has to know what a tier is.
 *
 * Hand it a URL and it hands back either a URL or null. Every art surface on
 * the sheet already draws an empty plate when its URL is null — that is what
 * the `-empty` class on each of them is for — so gating is one call and no new
 * branch.
 *
 *     const codexArt = useCodexArt();
 *     const art = codexArt(card.art_url);
 *
 * -------------------------------------------------------------- the two homes
 * A codex picture is in one of two places, and its manifest entry says which.
 *
 *   `codex:cards/heal.full.webp`   the private bucket. AI generated placeholder
 *                                  art, made for one table. Signed on demand,
 *                                  and null until the signature comes back.
 *   `/cards/heal.webp?v=9497caa3`  the repository, served from the edge.
 *                                  Commissioned art, meant to be seen.
 *
 * The fork is the `codex:` prefix and nothing else, so the day an artist
 * replaces a placeholder, that one picture's manifest entry changes shape and
 * nothing here, or anywhere that calls this, is touched.
 *
 * **Null is the normal first answer for a bucket picture.** Signing is a round
 * trip; rendering is not. The plate draws empty, the signature lands, the
 * subscription below re-renders it with a URL. See src/lib/codexSigner.js.
 *
 * -------------------------------------------------------------- the exception
 * Art a player put on their own sheet is theirs and shows at every tier: a
 * portrait they uploaded, an image in their lore. Pass `'lore'` as the source
 * for those and the gate stands aside. Those are never bucket pictures, so they
 * take the second branch and are handed to viewUrl as they always were.
 *
 * ------------------------------------------------------------------ the shape
 * Everything this hook feeds is a 4:3 window: the card's own plate, the item
 * card, the brief. So a picture that was uploaded here is asked for its `plate`
 * crop on the way through, and one from anywhere else is handed back untouched.
 * That is why no art surface had to learn what a crop is. See viewUrl in
 * src/lib/imageViews.js.
 *
 * A bucket picture needs none of that: which cut it is was decided when the
 * manifest was written, so `cards/heal.thumb.webp` is already the small one and
 * `view` does not apply to it.
 */
export default function useCodexArt() {
  const { showsArt } = useAuth();

  /* Re-render this component whenever a signature lands. The snapshot is a
     counter, so a component that draws no bucket art subscribes and never
     hears anything worth re-rendering for. */
  useSyncExternalStore(subscribe, getVersion, getVersion);

  return useCallback(
    (url, source = 'codex', view = 'plate') => {
      if (!url || !showsArt(source)) return null;
      return typeof url === 'string' && url.startsWith(CODEX_SCHEME)
        ? urlFor(url.slice(CODEX_SCHEME.length))
        : viewUrl(url, view);
    },
    [showsArt]
  );
}
