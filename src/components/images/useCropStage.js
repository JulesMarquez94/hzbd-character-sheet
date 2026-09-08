import { useEffect, useRef, useState } from 'react';
import { decodeSource, defaultCrops } from '../../lib/imageCrop.js';
import { loadCrops, loadMaster } from '../../lib/imageStore.js';

/**
 * Getting a picture as far as the crop editor, from either of the two doors.
 *
 * There are two: a file the player just chose, and a picture already on the
 * shelf whose framing is being moved. They arrive differently (one is decoded
 * from disk, the other downloaded first) and end up identical: a decoded source
 * plus three crops.
 *
 * Shared by the chooser and by the page at /pictures, which both offer both
 * doors. What it really exists for is the release: a decoded source holds a
 * bitmap and an object URL, and a component that forgets to hand those back
 * leaks a photograph's worth of memory every time somebody changes their mind.
 * One ref, one close(), one unmount effect, in one place.
 */
export function useCropStage() {
  const held = useRef(null);
  const [stage, setStage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => held.current?.release?.(), []);

  function close() {
    held.current?.release?.();
    held.current = null;
    setStage(null);
  }

  function hold(next) {
    held.current?.release?.();
    held.current = next.source;
    setStage(next);
  }

  /** A file off the player's disk. New picture, so it keeps its master. */
  async function openFile(file) {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      hold({ source: await decodeSource(file), crops: defaultCrops(), id: null, withMaster: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  /**
   * A picture already on the shelf. The kept master is the source, and the crops
   * come back off its receipt so the editor opens where it was left rather than
   * back at the default framing.
   */
  async function openReframe(userId, image) {
    setError('');
    setBusy(true);
    try {
      const [blob, crops] = await Promise.all([
        loadMaster(userId, image.id),
        loadCrops(userId, image.id),
      ]);
      hold({ source: await decodeSource(blob), crops, id: image.id, withMaster: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return { stage, busy, error, setError, openFile, openReframe, close };
}
