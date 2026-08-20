import { useCallback, useMemo, useState } from 'react';

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
 *
 * ------------------------------------------------------------- the defaults
 * `closed` names the groups that start folded. A creature's block is why: it
 * holds the four cards its set printed *and* the eleven basic actions every
 * body on the board has, and eleven chips nobody ever looks up would push the
 * block into a scroll the moment it opened. So that one group arrives shut, and
 * one tap opens it for good.
 *
 * Which means what is stored can no longer be "the folded ones" — a group that
 * starts shut and was opened has to be remembered as *open*, or every reload
 * would shut it again. So a slot holds a map of the groups whose state differs
 * from its default, and a state that matches the default is dropped from it.
 * Nothing accumulates: a sheet read and left alone leaves no key behind, and an
 * older build's plain list of folded ids still reads correctly.
 */

const KEY = 'hzbd-folded';

function readAll() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return stored && typeof stored === 'object' ? stored : {};
  } catch {
    // No storage, or something else wrote nonsense into the key. Neither is
    // worth a broken block: everything simply starts at its default.
    return {};
  }
}

/**
 * One slot as a map of id to folded-or-not.
 *
 * An array is what every build before the defaults wrote: a plain list of the
 * groups that were folded. Read as "each of these is folded", which is what it
 * meant.
 */
function readSlot(all, slot) {
  const stored = all[slot];
  if (Array.isArray(stored)) return Object.fromEntries(stored.map((id) => [id, true]));
  return stored && typeof stored === 'object' ? { ...stored } : {};
}

function writeAll(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Full, or blocked. The fold still works for this sitting.
  }
}

export default function useFoldedGroups(scope, characterId, closed = []) {
  const slot = `${characterId ?? 'anon'}:${scope}`;
  const [state, setState] = useState(() => readSlot(readAll(), slot));

  /* Callers pass a fresh array every render, so the set is rebuilt off its
     contents rather than its identity — otherwise both callbacks below would be
     new on every render, and every chip drawn from them with it. A space is a
     safe joint: a group id is a slug or a `minion:<id>` and never holds one. */
  const names = closed.join(' ');
  const shut = useMemo(() => new Set(names ? names.split(' ') : []), [names]);

  const isFolded = useCallback((id) => state[id] ?? shut.has(id), [state, shut]);

  const toggle = useCallback(
    (id) => {
      const byDefault = shut.has(id);

      setState((current) => {
        const next = { ...current, [id]: !(current[id] ?? byDefault) };
        // Back to how it arrived is nothing to remember.
        if (next[id] === byDefault) delete next[id];

        const all = readAll();
        if (Object.keys(next).length > 0) all[slot] = next;
        else delete all[slot];
        writeAll(all);

        return next;
      });
    },
    [slot, shut]
  );

  return { isFolded, toggle };
}
