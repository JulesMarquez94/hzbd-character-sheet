import { SHAPES, dieTitle } from '../lib/dieShapes.js';
import './Die.css';

/**
 * One die, drawn as its own silhouette.
 *
 * A physical die is recognised by its shape before anything else, which is the
 * whole reason a table can be read at a glance. So a d4 is a triangle and a d6
 * is a square, and neither has to be labelled.
 *
 * Shared by the two places dice are shown, which are not the same place at all:
 * the roller draws them 66 pixels wide and tumbling, and the table log draws
 * them at 26 in a row inside an entry. Same component, one `size`, because a die
 * that read differently in the log from the way it read when it was thrown would
 * be the log disagreeing with the roll.
 *
 * ------------------------------------------------------------------ the colour
 * Carried by the outline, which is why the shape is a polygon rather than a box
 * with `clip-path`: a clip cuts the border off along with the corners, and the
 * border is the only thing saying whether this was advantage (green),
 * disadvantage (red), a burst (amber) or a Karma bought after the fact.
 */

/**
 * `face` of null is a die that has not been thrown yet, drawn as a dashed
 * outline of the shape it will land as.
 *
 * `caption` is the little "d6" under it. On at the roller's size, off in the log,
 * where a row of eight dice has no room for eight labels and the shapes are
 * doing the work anyway.
 */
export default function Die({
  die,
  face,
  size = 66,
  rolling = false,
  hot = false,
  caption = true,
}) {
  const role = die.role === 'explosion' ? 'burst' : die.role;
  /* A d100, and anything else the tray grows later, is a circle. Better an
     honest round blank than a square pretending to be a shape it is not. */
  const shape = SHAPES[die.sides] ?? null;

  return (
    <span
      className={`die is-${role}${rolling ? ' is-rolling' : ''}${hot ? ' is-hot' : ''}${
        face === null ? ' is-waiting' : ''
      }`}
      style={{ '--die-size': `${size}px` }}
      title={dieTitle(die)}
    >
      <svg className="die-shape" viewBox="0 0 100 100" aria-hidden="true">
        {shape ? <polygon points={shape.points} /> : <circle cx="50" cy="50" r="45" />}
      </svg>
      <span
        className="die-face"
        /* Centred on the shape, then nudged down where the silhouette narrows
           upward: see `drop` in SHAPES. The translate carries the -50% that puts
           it on the middle in the first place. */
        style={{ transform: `translate(-50%, calc(-50% + ${shape?.drop ?? 0}%))` }}
      >
        {face === null ? '' : face}
      </span>
      {caption && <span className="die-sides">d{die.sides}</span>}
    </span>
  );
}
