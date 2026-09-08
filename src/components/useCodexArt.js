import { useCallback } from 'react';
import { useAuth } from '../context/auth-context.js';
import { viewUrl } from '../lib/imageViews.js';

/**
 * The one place that decides whether a picture from the codex is drawn.
 *
 * Card art is a paid capability: `free` accounts get the sheet with its plates
 * left empty, and `premium` upward get the pictures. The ladder and the rule
 * live in src/lib/tiers.js; this is the hook that applies it at the moment of
 * drawing, so no component has to know what a tier is.
 *
 * Hand it a URL and it hands back either the URL or null. Every art surface on
 * the sheet already draws an empty plate when its URL is null — that is what
 * the `-empty` class on each of them is for — so gating is one call and no new
 * branch.
 *
 *     const codexArt = useCodexArt();
 *     const art = codexArt(card.art_url);
 *
 * **The exception** is art a player put on their own sheet: a portrait they
 * uploaded, an image in their lore. That is theirs and shows at every tier.
 * Pass `'lore'` as the source for those and the gate stands aside.
 *
 * ------------------------------------------------------------------ the shape
 * Everything this hook feeds is a 4:3 window: the card's own plate, the item
 * card, the brief. So a picture that was uploaded here is asked for its `plate`
 * crop on the way through, and one from anywhere else is handed back untouched.
 * That is why no art surface had to learn what a crop is. See viewUrl in
 * src/lib/imageViews.js.
 */
export default function useCodexArt() {
  const { showsArt } = useAuth();
  return useCallback(
    (url, source = 'codex', view = 'plate') => (url && showsArt(source) ? viewUrl(url, view) : null),
    [showsArt]
  );
}
