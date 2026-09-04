import { metersToFeet } from '../../lib/characterModel.js';
import { creatureMoves, creatureStats, getRank } from '../../lib/creatures.js';

/**
 * A creature said in a line rather than drawn as the enemy it would be.
 *
 * Jules, 2026-09-04: "the bestiary should be a menu with summary version of the
 * enemies. The block should show when you click on it. Summary should be the
 * same size as like spell summary."
 *
 * So the bestiary is now the same two steps a school of spells is: a wall of
 * summaries you scan, and the whole of one a tap away. Nine creatures fit on a
 * screen as blocks; thirty do not, and a stat block is 736x640 apiece.
 *
 * ------------------------------------------------------- it *is* a card brief
 * The class names below are `card-brief-*` and that is deliberate, not laziness.
 * "The same size as like spell summary" is a measurement, and the only way to
 * keep two things the same size for longer than a month is to have them read the
 * same rule: the plate is 92px wide because CardBrief's is, the summary clamps
 * at two lines because CardBrief's does, and the wall flows at 275px because
 * `.card-brief-wall` says so. A creature brief that had its own numbers would
 * drift the first time a card brief was tuned.
 *
 * What a creature has and a card does not is four small additions, and those are
 * `foe-brief-*` in Campaigns.css:
 *
 *   the level     in the corner the cost orbs hold. A card's cost and a
 *                 creature's level are the same question ("how big is this?"),
 *                 and CardBrief puts the cost there so a column of them can be
 *                 read straight down without reading the names. Same here.
 *   the rank tone the brief's whole accent, set as `--ac-accent` off the rank,
 *                 so the top edge, the empty plate's haze, the kind chip and
 *                 the open label all read Minion teal or Overlord red. It is the
 *                 rule the block already keeps ("the top edge is the danger").
 *   the portrait  a plain URL off the creature, drawn as the plate's background
 *                 rather than an `<img>`, because that is the window CardBrief
 *                 cut and the plate has to stay that window.
 *   the numbers   see below.
 *
 * ------------------------------------------------------------ what it prints
 * The printed page's own head line, in the page's own order:
 *
 *   LONG CREATURE NAME     Difficulty: Minion - Level 1 - 10 XP
 *   Creature Type Details  Speed 3m(10f) / INI +3
 *      DEF: 8   HP: 8 (3d4)
 *
 * which comes out as the rank and the type as chips, the level in the corner,
 * and DEF, HP, WP, Speed and the XP on the summary line. Nothing is invented and
 * nothing is chosen: a brief is a transcription of the top of the page, and the
 * rest of the page is the block behind it.
 *
 * The numbers are the creature **at the level its own page was written at**, the
 * same level `previewFoe` opens the block at. A creature scales (see
 * creatures.js) and an encounter picks its own level, but a shelf that is asked
 * "what is a Blightgeist" has to answer with the Blightgeist.
 *
 * `children` is hung under the brief for whatever the shelf wants, which here is
 * the Edit button on a creature the reader forged. The face is a button, so an
 * action cannot live inside it.
 */
export default function CreatureBrief({ creature, unit = 'metric', onOpen, children = null }) {
  const rank = getRank(creature);
  const stats = creatureStats(creature);

  /* Both halves of the speed, the way every other speed on the site is drawn:
     rounded to a tenth in metres, converted whole in feet. */
  const imperial = unit === 'imperial';
  const speed = imperial
    ? `${metersToFeet(stats.speed_m)}ft`
    : `${Math.round((Number(stats.speed_m) || 0) * 10) / 10}m`;

  /* What it does, counted rather than listed. A creature plays two or three
     cards and the chips for them are on the block; the count is what says
     whether opening this one is worth the tap. */
  const moves = creatureMoves(creature).length;

  return (
    <div className="card-brief foe-brief" style={{ '--ac-accent': rank.color }}>
      <button
        type="button"
        className="card-brief-face"
        onClick={onOpen}
        title={`Open the ${creature.name} block`}
      >
        <span className="card-brief-head">
          <span
            className={`card-brief-art${creature.portrait_url ? '' : ' card-brief-art-empty'}`}
            style={
              creature.portrait_url
                ? { backgroundImage: `url("${creature.portrait_url}")` }
                : undefined
            }
          />

          <span className="card-brief-title">
            <span className="card-brief-name-row">
              <span className="card-brief-name">{creature.name}</span>
              <span className="foe-brief-level" title={`Written at level ${stats.level}`}>
                Lvl {String(stats.level).padStart(2, '0')}
              </span>
            </span>

            <span className="card-brief-chips">
              {/* What it is, leading its own row and wearing the accent, exactly
                  as a card's kind chip does. */}
              <span className="card-brief-chip is-kind">{rank.label}</span>
              {creature.type && <span className="card-brief-chip">{creature.type}</span>}

              {/* Which half of the bestiary it came off. The same two words the
                  block wears as a chip and the encounter shelf prints beside the
                  name: a Game Master with six creatures of their own has to tell
                  them from the printed ones, and the name alone does not say. */}
              {creature.forged && (
                <span
                  className="card-brief-chip is-open"
                  title={
                    creature.scope === 'codex'
                      ? 'Forged and published to the shared bestiary.'
                      : 'Forged on this account. It is on nobody else’s shelf.'
                  }
                >
                  {creature.scope === 'codex' ? 'Published' : 'Forged'}
                </span>
              )}
            </span>
          </span>
        </span>

        <span className="card-brief-summary foe-brief-stats">
          DEF {stats.avoid} · HP {stats.health_max} · WP {stats.willpower_max} · {speed} ·{' '}
          {stats.xp} XP
        </span>

        <span className="card-brief-open">
          Read the block
          {moves > 0 && <span className="foe-brief-moves">{moves} to play</span>}
        </span>
      </button>

      {children}
    </div>
  );
}
