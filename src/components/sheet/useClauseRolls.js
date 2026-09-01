import { useState } from 'react';
import { useDiceTray } from '../../context/dice-tray.js';
import { characterDelta } from '../../lib/combatApply.js';

/**
 * The roll-and-take half of a boundary reminder, shared by the two surfaces
 * that print one: the Turn block's own prompt and the turn call's full-screen
 * cover. One hook so a clause rolls and lands the same way from both.
 *
 * A clause that names dice ("the spore deals 2d6 + 8 damage") is thrown on the
 * tray over the surface that raised it and lands on the table log like any
 * roll. What each throw came to is held here, keyed on the clause, along with
 * whether its number has been taken onto the sheet yet — held in the surface
 * rather than on the row, so closing it forgets: a total left over from the
 * last turn applied twice would be the sheet inventing a second hit.
 *
 * `takeIt` is the one labelled tap that puts a number on this sheet — "Regain
 * 9 Health", "Take 7" — through the sheet's own patch, Armor and Shield done
 * by combatApply.js and the ledger carrying the row's name. Deliberately a tap
 * and not automatic: whether a clause lands on you or on something you pointed
 * it at is a sentence the table reads better than a pattern does.
 *
 * `busy` is whether dice are on the table right now, for a caller whose own
 * keys must not fire under them: Enter on the turn call's cover ends the turn,
 * and Enter with a throw up should only ever be about the throw.
 */
export function useClauseRolls(character, patch) {
  const tray = useDiceTray();
  const [landed, setLanded] = useState({});
  const [busy, setBusy] = useState(false);

  async function throwClause(row, key, spec) {
    if (!tray) return;
    setBusy(true);
    try {
      const result = await tray.present({
        ...spec,
        shape: 'value',
        kind: spec.kind === 'roll' ? 'damage' : spec.kind,
        name: row.name,
        note: character?.name ?? '',
        log: true,
      });
      if (result) {
        setLanded((was) => ({ ...was, [key]: { total: result.total, kind: spec.kind } }));
      }
    } finally {
      setBusy(false);
    }
  }

  function takeIt(row, key) {
    const hit = landed[key];
    if (!hit || !patch) return;
    const body = characterDelta(character, {
      kind: hit.kind,
      amount: hit.total,
      note: row.name,
    });
    if (body) patch(body);
    setLanded((was) => ({ ...was, [key]: { ...hit, taken: true } }));
  }

  return { tray, landed, busy, throwClause, takeIt };
}
