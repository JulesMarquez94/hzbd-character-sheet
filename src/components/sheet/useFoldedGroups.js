import { useCallback, useState } from 'react';

/**
 * Which groups a player has folded away, remembered per character.
 *
 * Blocks 4 and 5 are the only two on the sheet that scroll, and folding is
 * what keeps that scroll short: once you know the basic actions by
 * heart, that group is a heading you close and forget. What is folded is a
 * reading preference rather than a fact about the character, so it lives in
 * localStorage beside the unit toggle rather than in a column on the row.
 * Nothing here can be lost that a tap does not restore.
 *
 * Keyed by character, because "I know my own basic actions" is not the same
 * statement about somebody else's sheet, and by scope, so the two blocks never
 * collide over a group id they happen to share.
 */

const KEY = 'hzbd-folded';

function readAll() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return stored && typeof stored === 'object' ? stored : {};
  } catch {
    // No storage, or something else wrote nonsense into the key. Neither is
    // worth a broken block: everything simply starts open.
    return {};
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Full, or blocked. The fold still works for this sitting.
  }
}

export default function useFoldedGroups(scope, characterId) {
  const slot = `${characterId ?? 'anon'}:${scope}`;
  const [folded, setFolded] = useState(() => new Set(readAll()[slot] ?? []));

  const toggle = useCallback(
    (id) => {
      setFolded((current) => {
        const next = new Set(current);
        if (!next.delete(id)) next.add(id);

        const all = readAll();
        // An empty list is the default, so it is dropped rather than stored —
        // otherwise every sheet ever opened leaves a key behind.
        if (next.size > 0) all[slot] = [...next];
        else delete all[slot];
        writeAll(all);

        return next;
      });
    },
    [slot]
  );

  return { isFolded: useCallback((id) => folded.has(id), [folded]), toggle };
}
