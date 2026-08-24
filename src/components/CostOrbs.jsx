/**
 * What a card costs to use: one filled orb per resource with the number in
 * it, in that resource's own colour — gold for Action Points, violet for
 * Willpower. The same orbs are printed on the card and listed beside the
 * ability on the sheet, so a cost reads the same wherever you meet it.
 */

/* The same colours the pools wear on the Character tab, lit the same way.
   Reaction Points are never printed on a card — a card costs Action Points,
   and only the moment you spend it decides whether you paid out of the other
   pool — so the orange orb is raised by the sheet, not by the codex.

   Health is the same kind of orb for the same kind of reason. No card prints a
   Health cost either: a Blood Tithe is an offer in the card's second half, and
   only the moment you take it turns "Health equal to your Physique" into the
   number the prompt is about to charge. See UsePrompt.jsx. */
const RESOURCES = {
  ap: { label: 'Action Points', color: 'var(--stat-ap)' },
  rp: { label: 'Reaction Points', color: 'var(--stat-rp)' },
  wp: { label: 'Willpower', color: 'var(--stat-wp)' },
  hp: { label: 'Health', color: 'var(--stat-health)' },
};

function has(value) {
  return value !== null && value !== undefined && value !== '';
}

/**
 * One orb, and optionally what it used to say.
 *
 * `was` is the cost the card was printed with, given only when something the
 * holder carries has cut it: an Arcanist at Rank 3 casts everything in their book
 * for one Action Point less. The old number is struck through beside the orb
 * rather than replaced silently, because a card printing 3 next to a button
 * charging 2 reads as a bug at the exact moment somebody is deciding whether to
 * pay. See cardCost in cardText.js.
 *
 * `from` is what is lending the cut, named the way an advantage arrow names its
 * source. A number that dropped for no stated reason is a number the reader has to
 * go and reconstruct off another block.
 */
export function CostOrb({ kind, value, size = 34, was = null, from = [] }) {
  const resource = RESOURCES[kind];
  const cut = has(was) && was !== value;
  const said = from.length > 0 ? ` by ${listAnd(from)}` : '';

  const orb = (
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
      title={
        cut
          ? `${value} ${resource.label}, cut from ${was}${said}`
          : `${value} ${resource.label}`
      }
    >
      {value}
    </span>
  );

  if (!cut) return orb;

  return (
    <span className="cost-orb-cut" style={{ '--orb-cut': resource.color }}>
      {/* Never smaller than legible. These orbs are drawn at 38 on a card and at
          20 on a row of the Character tab, and half of 20 is a numeral nobody
          reads. */}
      <span className="cost-orb-was" style={{ fontSize: Math.max(12, size * 0.52) }}>
        {was}
      </span>
      {orb}
    </span>
  );
}

export default function CostOrbs({ ap, wp, size = 34, className = 'cost-orbs', apWas = null, cutFrom = [] }) {
  if (!has(ap) && !has(wp)) return null;

  return (
    <span className={className}>
      {has(ap) && <CostOrb kind="ap" value={ap} size={size} was={apWas} from={cutFrom} />}
      {has(wp) && <CostOrb kind="wp" value={wp} size={size} />}
    </span>
  );
}

/** "Perfect Casting", "Perfect Casting and Overload". */
function listAnd(words) {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
