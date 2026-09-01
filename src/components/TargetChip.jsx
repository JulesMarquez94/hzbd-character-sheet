import { SkullIcon } from './sheet/parts.jsx';

/**
 * One body in a fight, at chip size: who they are, what side they are on, and
 * how they are standing — with not one number on it.
 *
 * Jules, 2026-09-01: "The preview to target should show a fixed size text
 * block (like the ones in the encounter trackers). The name is in the color of
 * the type. The background is an actual reflection of the health bar, if there
 * is shield it overlaps in blue in transparent. It does not show the number."
 *
 * So the chip is the turn strip's chip grown a state: fixed footprint so a row
 * of twelve reads as a row, the name wearing the side's colour (party cyan, an
 * enemy its rank), and the background *is* the Health bar — a fill as wide as
 * the Health that is left, with the Shield laid over it in translucent blue.
 * The numbers stay off it on purpose: a chip is read at a glance from across a
 * table, and the blocks below are where numbers live.
 *
 * One component wherever a body is pointed at — the turn manager's order, the
 * target row on a use, the apply window — because "which chip is Kaelen" must
 * have the same answer everywhere.
 *
 * `body` is a combatant row (see combatRoster in EncounterTab.jsx):
 *   { id, kind: 'member' | 'foe', name, tone, health01, shield01, down }
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
  const className = [
    'tgt-chip',
    `tgt-${body.kind}`,
    on ? 'is-on' : '',
    up ? 'is-up' : '',
    body.down ? 'is-down' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const inside = (
    <>
      {/* The bar, behind the words. Width is the pool, colour is the pool's
          own, and the Shield lies over the same track the way it lies over the
          same Health. A null pool is a pool this reader is not allowed to know
          — a player pointing at an enemy — and it is drawn as nothing rather
          than invented: an empty bar would say "down" and a full one would say
          "untouched", and both would be guesses. */}
      {body.health01 !== null && body.health01 !== undefined && (
        <span className="tgt-fill" style={{ width: pct(body.health01) }} aria-hidden="true" />
      )}
      {body.shield01 > 0 && (
        <span className="tgt-shield" style={{ width: pct(body.shield01) }} aria-hidden="true" />
      )}

      <span className="tgt-name">
        {body.down && (
          <span className="tgt-down" title="Down" aria-label="Down">
            <SkullIcon />
          </span>
        )}
        {body.name}
      </span>

      {init !== null && <span className="tgt-init">{init}</span>}
    </>
  );

  if (!onToggle) {
    return (
      <span className={className} style={{ '--tgt-tone': tone }} title={title ?? body.name}>
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
      title={title ?? (on ? `${body.name} · picked` : body.name)}
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
