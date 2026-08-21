import { useHoverTip } from './useHoverTip.jsx';

/** Block 1's larger, read-only Physique/Instinct/Mind tile. */
export function AttrTile({ label, value, color, info }) {
  const { ref, tipProps, tip } = useHoverTip(info);

  return (
    <div className="attr-tile" style={{ borderTopColor: color }} ref={ref} {...tipProps}>
      <span className="attr-label">{label}</span>
      <span className="attr-value" style={{ color }}>
        {value}
      </span>
      {tip}
    </div>
  );
}

/**
 * One of the three attribute / stat tiles. Hovering or focusing the tile
 * itself (not a separate icon) reveals `info`, when given. Read-only by
 * design: everything shown in one is derived, never typed in.
 */
export function StatBox({ label, value, color, suffix = '', info }) {
  const { ref, tipProps, tip } = useHoverTip(info);

  return (
    <div className="stat-box" style={{ borderTopColor: color }} ref={ref} {...tipProps}>
      <span className="stat-box-label">{label}</span>
      <span className="stat-box-value" style={{ color }}>
        {value}
        {suffix}
      </span>
      {tip}
    </div>
  );
}

/** Clickable dot row for Action / Reaction points. */
export function PipRow({ current, max, onChange, variant, readOnly = false }) {
  return (
    <div className="pip-row" data-variant={variant}>
      {Array.from({ length: Math.max(0, max) }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`res-pip${i < current ? ' active' : ''}${readOnly ? ' res-pip-static' : ''}`}
          disabled={readOnly}
          // Clicking the last filled pip empties it — matches how players tick down.
          onClick={() => onChange(current === i + 1 ? i : i + 1)}
          aria-label={`Set to ${i + 1}`}
        />
      ))}
    </div>
  );
}

/** Minus / plus pair used beside every pool. */
export function StepButtons({ onStep, variant, readOnly = false }) {
  if (readOnly) return null;

  return (
    <div className="step-buttons" data-variant={variant}>
      <button type="button" className="step-btn" onClick={() => onStep(-1)} aria-label="Decrease">
        −
      </button>
      <button type="button" className="step-btn" onClick={() => onStep(1)} aria-label="Increase">
        +
      </button>
    </div>
  );
}

/**
 * Video-game-style resource bar — fill behind the "current / max" readout,
 * which sits inside the bar rather than above it.
 *
 * The track is tinted with `color` so the drained part of the bar still reads
 * as the resource it belongs to. Pass `poison` (a 0–100 percentage) for Health,
 * the one pool that runs past zero: it refills the emptied bar in poison green,
 * and a full green bar means dead.
 */
export function ResourceBar({ label, current, max, color, onClick, title, poison = 0 }) {
  const cap = Math.max(0, Number(max) || 0);
  const value = Number(current) || 0;
  const pct = cap > 0 ? Math.min(100, Math.max(0, (value / cap) * 100)) : 0;

  return (
    <button type="button" className="meter" onClick={onClick} title={title}>
      <span className="meter-label">{label}</span>
      <span
        className="mana-track"
        style={{ background: `color-mix(in srgb, ${color} 22%, var(--bg-black))` }}
      >
        <span
          className="mana-fill"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
        {poison > 0 && (
          <span className="mana-fill mana-fill-poison" style={{ width: `${Math.min(100, poison)}%` }} />
        )}
        <span className="mana-text">
          {value} / {cap}
        </span>
      </span>
    </button>
  );
}

/** Marks a character whose health has hit −health_max. */
export function SkullIcon() {
  return (
    <svg
      className="skull-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.5c-4.7 0-8 3.2-8 7.6 0 2.6 1.2 4.7 3 5.9V19a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 17 19v-3c1.8-1.2 3-3.3 3-5.9 0-4.4-3.3-7.6-8-7.6Z" />
      <circle cx="8.8" cy="10.2" r="2" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="10.2" r="2" fill="currentColor" stroke="none" />
      <path d="M12 13.4 10.9 15.4h2.2L12 13.4Z" fill="currentColor" stroke="none" />
      <path d="M9.6 17.2v3.3M12 17.2v3.3M14.4 17.2v3.3" />
    </svg>
  );
}

/* ---------- the two purses ----------
   Coins and Supplies are the same kind of thing — a running total moved only
   by transaction — so they are drawn as a matched pair and told apart by their
   glyph: a struck coin, and the crate everything else travels in. */

/** Coins: a struck coin, edge on. */
export function CoinIcon() {
  return (
    <svg
      className="meter-glyph"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.6" />
      <path d="M12 3.5v3.9M12 16.6v3.9M3.5 12h3.9M16.6 12h3.9" />
    </svg>
  );
}

/** Supplies: a banded crate, lid on. */
export function CrateIcon() {
  return (
    <svg
      className="meter-glyph"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.2" y="5.4" width="17.6" height="13.2" rx="1.4" />
      <path d="M3.2 9.4h17.6M3.2 14.6h17.6" />
      <path d="M8.6 9.4v5.2M15.4 9.4v5.2" />
    </svg>
  );
}


const KARMA_INFO =
  'Spend 1 Karma after seeing a die result to add 1d4 to it. You may hold one per level.';

/**
 * Karma counter. The ceiling is the character's own level, so the pill reads
 * current of max the way the pools above it do, and `+` goes dead at the cap
 * instead of counting past it. `max` is `karmaCap` off characterModel.
 *
 * The stored number is what is shown, never a clamped one: on an editable sheet
 * syncDerived has already pulled it back into range, and on a shared one a held
 * 5 of 3 is the row being honest about itself.
 */
export function KarmaPill({ karma, max, onChange, readOnly = false }) {
  const { ref, tipProps, tip } = useHoverTip(KARMA_INFO);
  const cap = Math.max(0, Math.floor(Number(max) || 0));
  const held = Math.floor(Number(karma) || 0);

  return (
    <div className="karma-pill" ref={ref} {...tipProps}>
      <span className="karma-label">Karma</span>
      <div className="karma-controls">
        <button
          type="button"
          className="karma-btn"
          disabled={readOnly || held <= 0}
          onClick={() => onChange(Math.max(0, held - 1))}
          aria-label="Decrease Karma"
        >
          −
        </button>
        <span className="karma-value" aria-label={`${held} of ${cap} Karma`}>
          {held}
          <span className="karma-cap">/{cap}</span>
        </span>
        <button
          type="button"
          className="karma-btn"
          disabled={readOnly || held >= cap}
          onClick={() => onChange(Math.min(cap, held + 1))}
          aria-label="Increase Karma"
        >
          +
        </button>
      </div>
      {tip}
    </div>
  );
}

/**
 * The heading over one group in blocks 4 and 5, and the whole of the fold.
 *
 * The heading *is* the control: there is no separate chevron target, because a
 * heading with a 12px button beside it is a 12px button on a phone. The count
 * on the right is what makes a folded group still worth reading — "Standard
 * Actions · 11" says what is in there without opening it.
 */
export function GroupHead({ label, note, count, folded, onToggle }) {
  return (
    <button
      type="button"
      className={`bar-group-head${folded ? ' is-folded' : ''}`}
      onClick={onToggle}
      aria-expanded={!folded}
      title={folded ? `Open ${label}` : `Fold ${label} away`}
    >
      <span className="bar-group-chevron" aria-hidden="true" />
      <span className="bar-group-label">{label}</span>
      {note && <span className="bar-group-note">{note}</span>}
      <span className="bar-group-count">{count}</span>
    </button>
  );
}
