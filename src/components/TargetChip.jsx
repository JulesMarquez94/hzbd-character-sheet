import Face from './Face.jsx';
import { SkullIcon } from './sheet/parts.jsx';

/**
 * One body in a fight, as a unit frame: a round face, the name in the side's
 * colour, and its Health as a bar beside the face.
 *
 * Jules, 2026-09-01: "The preview to target should show a fixed size text
 * block (like the ones in the encounter trackers). The name is in the color of
 * the type. The background is an actual reflection of the health bar, if there
 * is shield it overlaps in blue in transparent. It does not show the number."
 *
 * And 2026-10-10: the preview uses the same round picture the log does, with
 * the Health bar next to it, "something that look a bit more like a World of
 * Warcraft health bar", and every part of it readable. So the bar moved out
 * from behind the name onto a track of its own under it, with the Shield laid
 * over the same track in translucent blue, and the face is the log's own
 * (`Face.jsx`, initials where there is no picture). Still no number: a frame is
 * read at a glance from across a table, and the blocks are where numbers live.
 *
 * One component wherever a body is pointed at — the turn manager's order, the
 * target row on a use, the apply window — because "which chip is Kaelen" must
 * have the same answer everywhere.
 *
 * `body` is a combatant row (see combatRoster in EncounterTab.jsx):
 *   { id, kind: 'member' | 'foe', name, tone, portrait, health01, shield01, down, effects }
 *
 * `effects` is what is running on them, by name, and it is the one thing the
 * frame says in words: "If someone has skulk then everyone on the table should
 * see it" (Jules, 2026-09-04). A body carrying something grows a third line
 * naming it, two names and a count, with every name in the tooltip.
 *
 * Everything else is the moment: `on` for a picked target, `up` for whoever the
 * order is standing on, `init` for the strip that shows the roll. With no
 * `onToggle` it is a reading, not a control.
 */
export default function TargetChip({
  body,
  on = false,
  up = false,
  disabled = false,
  init = null,
  onToggle = null,
  title = null,
}) {
  const tone = body.kind === 'member' ? 'var(--focus-cyan)' : (body.tone ?? 'var(--copper)');
  const running = (body.effects ?? []).filter((one) => typeof one === 'string' && one);
  /* A null pool is a pool this reader is not allowed to know — a player
     pointing at an enemy behind the curtain. The track is still drawn, so a row
     of frames lines up, but hatched and empty rather than invented: an empty
     bar would say "down" and a full one would say "untouched", and both would
     be guesses. */
  const known = body.health01 !== null && body.health01 !== undefined;
  const picture = body.portrait ?? null;
  const className = [
    'tgt-chip',
    `tgt-${body.kind}`,
    on ? 'is-on' : '',
    up ? 'is-up' : '',
    body.down ? 'is-down' : '',
    body.conjured ? 'is-conjured' : '',
    running.length > 0 ? 'has-fx' : '',
  ]
    .filter(Boolean)
    .join(' ');

  /* The names, two and a count, so a frame stays a frame. The tooltip has all of them. */
  const shown = running.slice(0, 2).join(' · ') + (running.length > 2 ? ` +${running.length - 2}` : '');
  const said = [
    body.name,
    known ? null : 'Health hidden',
    body.down ? 'down' : null,
    running.length > 0 ? running.join(', ') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const inside = (
    <>
      {/* The log's own face, which asks for the `face` crop itself. */}
      <Face name={body.name} src={picture} className="tgt-face" />

      <span className="tgt-main">
        <span className="tgt-top">
          <span className="tgt-name">
            {body.down && (
              <span className="tgt-down" title="Down" aria-label="Down">
                <SkullIcon />
              </span>
            )}
            {body.name}
          </span>
          {init !== null && <span className="tgt-init">{init}</span>}
        </span>

        {/* The bar. Width is the pool, colour is the pool's own, and the
            Shield lies over the same track the way it lies over the same
            Health. */}
        <span className={`tgt-bar${known ? '' : ' is-hidden'}`} aria-hidden="true">
          {known && <span className="tgt-fill" style={{ width: pct(body.health01) }} />}
          {known && body.shield01 > 0 && (
            <span className="tgt-shield" style={{ width: pct(body.shield01) }} />
          )}
        </span>

        {/* What is running on them, in words, under the bar. */}
        {running.length > 0 && <span className="tgt-fx">{shown}</span>}
      </span>
    </>
  );

  if (!onToggle) {
    return (
      <span className={className} style={{ '--tgt-tone': tone }} title={title ?? said}>
        {inside}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={{ '--tgt-tone': tone }}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={on}
      title={title ?? (on ? `${said} · picked` : said)}
    >
      {inside}
    </button>
  );
}

function pct(share) {
  const n = Number(share);
  if (!Number.isFinite(n)) return '100%';
  return `${Math.min(100, Math.max(0, n * 100))}%`;
}
