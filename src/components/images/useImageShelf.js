import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/auth-context.js';
import { listImages, usageIndex } from '../../lib/imageStore.js';
import { imageSlots } from '../../lib/tiers.js';

/**
 * What this account has uploaded, for whoever is showing it.
 *
 * One hook rather than two loaders, because the shelf is shown in two places
 * that must never disagree about how full it is: the page at /pictures and the
 * chooser that opens from every portrait frame on the site. Both read this.
 *
 * `withUsage` is the extra three queries that answer "where is this one being
 * used". The page asks for it, because that is the question somebody about to
 * delete a picture is actually asking. The chooser asks for it too, so the
 * pictures already on a sheet are recognisable at a glance rather than after a
 * mistake.
 *
 * ---------------------------------------------------------------- the sequence
 * Every load carries a number, and an answer whose number is stale is dropped.
 * Two things make that happen for real: a reload fired by a delete while the
 * first listing is still in the air, and the account arriving after the first
 * render, which is the normal case on a cold load. Without it the older answer
 * lands last and the grid shows a shelf that is one delete out of date.
 *
 * Nothing here sets state in the effect body either. The listing's own promise
 * does, which is the pattern every other loader on the site uses, and it keeps
 * the first render from cascading.
 */
export function useImageShelf({ withUsage = true } = {}) {
  const { user, tier } = useAuth();
  const userId = user?.id ?? null;

  const [shelf, setShelf] = useState({ images: [], count: 0, bytes: 0 });
  const [usage, setUsage] = useState(() => new Map());
  const [settling, setSettling] = useState(true);
  const [error, setError] = useState('');

  const run = useRef(0);

  const load = useCallback(() => {
    const mine = (run.current += 1);
    const mineStill = () => run.current === mine;
    if (!userId) return Promise.resolve();

    return listImages(userId)
      .then(async (next) => {
        if (!mineStill()) return;
        setShelf(next);
        setError('');
        if (!withUsage) return;
        /* Second, and allowed to fail on its own. A shelf that will not list is
           worth an error; a usage scan that will not run only costs the labels
           under the pictures. */
        try {
          const used = await usageIndex(userId);
          if (mineStill()) setUsage(used);
        } catch {
          if (mineStill()) setUsage(new Map());
        }
      })
      .catch((err) => {
        if (mineStill()) setError(err.message || 'Your pictures could not be listed.');
      })
      .finally(() => {
        if (mineStill()) setSettling(false);
      });
  }, [userId, withUsage]);

  useEffect(() => {
    load();
  }, [load]);

  const slots = imageSlots(tier);

  return {
    userId,
    tier,
    images: shelf.images,
    count: shelf.count,
    bytes: shelf.bytes,
    slots,
    room: Math.max(0, slots - shelf.count),
    usage,
    /* Derived rather than stored, so that signed out is never "still reading":
       there is nothing to read and no answer coming. */
    loading: settling && Boolean(userId),
    error,
    setError,
    reload: load,
  };
}
