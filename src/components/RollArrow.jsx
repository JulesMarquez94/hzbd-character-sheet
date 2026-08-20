/**
 * What is happening to a roll, as one badge: a green arrow up with the number of
 * d4s in it, or a red arrow down.
 *
 * Asked for outright in the Duelist's Developpement Notes, on DEXTEROUS:
 *
 *   "When soemthing give oyu permnanet adventage like this it should dispaly on
 *    the card adventage should be a an arrow up witn an umber in it( green
 *    arrow). In case it happes later disvage its the same so ability that are
 *    itne tracker would do th same as well."
 *
 * So it draws on two things: a card whose holder has advantage on it (an attack
 * made with a one-handed weapon by a Duelist, an attack a Martial Move is riding),
 * and a row on the effects tracker that is granting it.
 *
 * ------------------------------------------------------------------- the number
 * A number and not a tick, because Advantage stacks: the glossary says each
 * instance adds another d4, so two sources are worth 2 and the badge says 2.
 *
 * And it nets, because the same entry says Advantage and Disadvantage "cancel
 * each other out on a 1-to-1 basis". Two advantage against one disadvantage is one
 * arrow up; one against one is nothing at all, and nothing at all is what this
 * draws — a badge that said "1 up, 1 down" would be asking the reader to apply a
 * rule the sheet already knows.
 *
 * ------------------------------------------------------------------- the colour
 * The same two colours the words wear in card text (see keywords.js): the green
 * of what heals for advantage, the red of Health for disadvantage. A reader who
 * has pointed at the word once already knows what the arrow means.
 */

import './RollArrow.css';

/** The arrow itself. One triangle, turned over for the other direction. */
function Triangle() {
  return (
    <svg className="roll-arrow-shape" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5 22 20.5 H2 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function RollArrow({ advantage = 0, disadvantage = 0, from = [], size = 34 }) {
  const net =
    Math.max(0, Math.floor(Number(advantage) || 0)) -
    Math.max(0, Math.floor(Number(disadvantage) || 0));
  if (net === 0) return null;

  const up = net > 0;
  const count = Math.abs(net);
  const word = up ? 'advantage' : 'disadvantage';
  /* Whatever is lending it, named. A 3 with no explanation is a number the reader
     has to go and reconstruct off three different blocks. */
  const said = from.length > 0 ? ` — from ${listAnd(from)}` : '';

  return (
    <span
      className={`roll-arrow${up ? '' : ' is-down'}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        '--ra-color': up ? 'var(--def-healing)' : 'var(--stat-health)',
      }}
      title={`${count} ${count === 1 ? 'd4' : 'd4s'} of ${word} on this roll${said}`}
      aria-label={`${count} ${word}`}
    >
      <Triangle />
      <span className="roll-arrow-n">{count}</span>
    </span>
  );
}

/** "Duelist", "Duelist and Wing Clip", "Duelist, Wing Clip and Reckless". */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
