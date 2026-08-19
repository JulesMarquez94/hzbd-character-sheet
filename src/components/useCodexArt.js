import { useCallback } from 'react';
import { useAuth } from '../context/auth-context.js';

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
 */
export default function useCodexArt() {
  const { showsArt } = useAuth();
  return useCallback((url, source = 'codex') => (url && showsArt(source) ? url : null), [showsArt]);
}
