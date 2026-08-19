/**
 * What a card costs to use: one filled orb per resource with the number in
 * it, in that resource's own colour — gold for Action Points, violet for
 * Willpower. The same orbs are printed on the card and listed beside the
 * ability on the sheet, so a cost reads the same wherever you meet it.
 */

/* The same colours the pools wear on the Character tab, lit the same way.
   Reaction Points are never printed on a card — a card costs Action Points,
   and only the moment you spend it decides whether you paid out of the other
   pool — so the orange orb is raised by the sheet, not by the codex. */
const RESOURCES = {
  ap: { label: 'Action Points', color: 'var(--stat-ap)' },
  rp: { label: 'Reaction Points', color: 'var(--stat-rp)' },
  wp: { label: 'Willpower', color: 'var(--stat-wp)' },
};

function has(value) {
  return value !== null && value !== undefined && value !== '';
}

export function CostOrb({ kind, value, size = 34 }) {
  const resource = RESOURCES[kind];

  return (
    <span
      className="cost-orb"
      style={{
        width: size,
        height: size,
        /* Darker under the number, the resource's own colour at the rim —
           so a white numeral reads even on the bright Action Point gold. */
        background: `radial-gradient(circle at 50% 50%,
          color-mix(in srgb, ${resource.color} 45%, #000) 0%,
          color-mix(in srgb, ${resource.color} 78%, #000) 52%,
          ${resource.color} 78%)`,
        boxShadow: `0 0 8px ${resource.color}`,
        fontSize: size * 0.54,
      }}
      title={`${value} ${resource.label}`}
    >
      {value}
    </span>
  );
}

export default function CostOrbs({ ap, wp, size = 34, className = 'cost-orbs' }) {
  if (!has(ap) && !has(wp)) return null;

  return (
    <span className={className}>
      {has(ap) && <CostOrb kind="ap" value={ap} size={size} />}
      {has(wp) && <CostOrb kind="wp" value={wp} size={size} />}
    </span>
  );
}
