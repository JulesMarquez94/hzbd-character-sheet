import { useState } from 'react';
import { codeRefusal, shareCode } from '../../lib/forged.js';

/**
 * A made item's code, and one button that puts it on the clipboard.
 *
 * The code *is* the item: base, workings, name and picture, and no instance id —
 * so whoever pastes it gets their own copy of the same design rather than a claim
 * on this one. See forged.js.
 *
 * It is shown rather than hidden behind a "reveal", because the commonest thing
 * anybody does with it is read it out loud or select it by hand. The button is
 * the convenience, not the only way in: `navigator.clipboard` is refused outright
 * on an insecure origin and by some browsers without a user gesture, so a copy
 * that fails says so and leaves the text there to select.
 *
 * ------------------------------------------------------- and the thing with none
 * Some things cannot travel, and this says so in words rather than drawing
 * nothing: a scroll in fading ink is the one so far, and an empty space where
 * every other item has a code is the shape of bug a reader blames on the
 * browser. See `codeRefusal`.
 */
export default function ShareCode({ record, label = 'Its code' }) {
  const [said, setSaid] = useState(null);
  const code = shareCode(record);
  const why = code ? null : codeRefusal(record);

  if (!code) {
    return why ? (
      <div className="forge-code">
        <span className="forge-code-head">
          <span className="fx-label">{label}</span>
        </span>
        <span className="ench-target-note">{why}</span>
      </div>
    ) : null;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setSaid('Copied.');
    } catch {
      setSaid('Could not reach the clipboard. Select it and copy by hand.');
    }
  }

  return (
    <div className="forge-code">
      <span className="forge-code-head">
        <span className="fx-label">{label}</span>
        <button type="button" className="btn btn-minimal btn-sm" onClick={copy}>
          Copy
        </button>
      </span>
      <code className="forge-code-value">{code}</code>
      <span className="ench-target-note">
        {said ?? 'Hand this to anybody and they get the same item, workings and all.'}
      </span>
    </div>
  );
}
