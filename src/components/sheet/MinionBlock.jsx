import { useMemo, useState } from 'react';
import UsePrompt from './UsePrompt.jsx';
import { MinionWindow } from './MinionPick.jsx';
import { BarChip } from './ActiveBlock.jsx';
import { AttrTile, GroupHead, PipRow, ResourceBar, SkullIcon, StatBox } from './parts.jsx';
import useFoldedGroups from './useFoldedGroups.js';
import { ATTRIBUTES } from '../../lib/attributes.js';
import { damageStyle } from '../../lib/cardText.js';
import { metersToFeet } from '../../lib/characterModel.js';
import { minionBar, spendUse } from '../../lib/combatBar.js';
import { minionActor, minionSpend, setMinionPool } from '../../lib/minions.js';

/**
 * The two blocks a creature gets on the Character tab, and they only exist when
 * there is a creature to draw.
 *
 * "Some talent set will give minion to control. When you select one you get a
 * new block add to your character page. This a two block wide that has a first
 * block which is Name, its attribute, then combat stat and the Defense. Then
 * Health and then Shield. Then we have a second one with the Action points,
 * Reaction points and below them we have a quick bar of the minion abilities.
 * ... This block can also be moved around, both the 1 and 2 block, in character
 * page."
 *
 * So: two blocks rather than one double-wide panel, each a hard 360x640 like
 * every other block, each with its own place in `block_order` and its own row in
 * the arranger. Side by side in their factory order they read as the two-wide
 * thing the note describes, and on a phone they are two screens like everything
 * else.
 *
 * ------------------------------------------------------------ the same tiles
 * Both blocks are drawn with the *character's* own parts — AttrTile, StatBox,
 * ResourceBar, PipRow, the quick bar's chip. That is not a shortcut, it is the
 * point: "all the stats are derived the same", so a Draconic Ally's Grit has to
 * look like a Grit. A reader glancing between block 2 and this one is comparing
 * the same numbers in the same boxes.
 *
 * -------------------------------------------------------------- who pays what
 * "The minion always uses his own action point and reaction point but uses the
 * character willpower." The use prompt is handed `minionActor`, which is the
 * creature wearing a character's shape with its bonded's Willpower in it, so the
 * prompt's own affordability check gets both halves right without knowing what a
 * minion is. `minionSpend` then splits the confirmed patch back apart: points to
 * the creature's row, Willpower to the character's, in one write.
 */

/* Armor is here and always zero. A creature wears no gear and there is nowhere
   on the sheet to give it any, so the tile could have been left off — but the
   three combat stats are the three combat stats, and a row of two where block 2
   has three is the kind of small difference that makes two stat blocks hard to
   read against each other. */
const TOP_LINE = [
  {
    key: 'initiative',
    label: 'Initiative',
    color: 'var(--stat-init)',
    info: 'Added to its roll when rolling for turn order in combat.',
  },
  {
    key: 'speed_m',
    label: 'Speed',
    color: 'var(--stat-speed)',
    info: 'How far it moves with the Move action.',
    kind: 'speed',
  },
  {
    key: 'defense',
    label: 'Armor',
    color: 'var(--stat-armor)',
    info: 'Flat damage reduction. Nothing for a creature: it wears no gear.',
  },
];

/* Defense is the one line that is not the character's own formula. The
   Developpement Notes: "the draconic ally has a Defense equal to its Grit." */
const DEFENSE_LINE = [
  {
    key: 'avoid',
    label: 'Defense',
    color: 'var(--focus-cyan)',
    info: 'How difficult it is to hit. A draconic ally’s is equal to its Grit.',
  },
  {
    key: 'reflex',
    label: 'Reflex',
    color: 'var(--stat-rp)',
    info: 'How reactive it is to danger. Physique + Instinct.',
  },
  {
    key: 'grit',
    label: 'Grit',
    color: 'var(--stat-wp)',
    info: 'How well it withstands afflictions. Instinct + Mind.',
  },
];

/* ============================================================ THE FIRST BLOCK */

/**
 * Who it is and what it is made of: the name, the three attributes, the combat
 * stats, the defenses, and the two pools that are its own to lose.
 */
export function MinionStatsBlock({ character, minion, patch, readOnly = false, unit = 'metric' }) {
  const [editing, setEditing] = useState(false);
  const { spec, stats } = minion;
  const tone = minion.scale ? damageStyle(minion.scale.damage) : null;

  const move = (pool, value) => {
    const body = setMinionPool(character, minion, pool, value);
    if (body) patch(body);
  };

  return (
    <div className="cell-scroll minion-block">
      <div className="block-head">
        <span className="stat-category-label">{spec.label}</span>
        <span className="block-count">Lvl {String(minion.level).padStart(2, '0')}</span>
      </div>

      <div className="minion-id">
        <span className="minion-plate">
          {minion.portrait_url ? (
            <img src={minion.portrait_url} alt="" />
          ) : (
            <span className="minion-plate-empty" aria-hidden="true" />
          )}
        </span>

        <span className="minion-id-body">
          <span className="minion-name">
            {minion.down && (
              <span className="dead-mark" title="Dead" aria-label="Dead">
                <SkullIcon />
              </span>
            )}
            {minion.named ? minion.name : `Unnamed ${spec.noun ?? 'ally'}`}
          </span>

          <span className="minion-tags">
            {minion.scale ? (
              <span
                className="minion-chip minion-chip-scale"
                style={tone ? { '--scale-tone': tone.color } : undefined}
              >
                {minion.scale.label} · {minion.scale.damage}
              </span>
            ) : (
              <span className="minion-chip is-open">No colour chosen</span>
            )}
            <span className="minion-chip">{minion.talent.name}</span>
          </span>
        </span>

        {!readOnly && (
          <button
            type="button"
            className="btn btn-minimal btn-sm minion-edit"
            onClick={() => setEditing(true)}
          >
            {minion.named ? 'Edit' : 'Name it'}
          </button>
        )}
      </div>

      {/* ---------- ATTRIBUTES ---------- */}
      <div className="stat-category-label">Attributes</div>
      <div className="attr-row">
        {ATTRIBUTES.map(({ key, label, color }) => (
          <AttrTile
            key={key}
            label={label}
            color={color}
            value={minion.attributes[key]}
            info={`Its own ${label}, derived from your level. It is always the level you are.`}
          />
        ))}
      </div>

      {/* ---------- COMBAT STATS ---------- */}
      <div className="stat-category-label">Combat Stats</div>
      <div className="attr-row">
        {TOP_LINE.map(({ key, label, color, info, kind }) => {
          const isSpeed = kind === 'speed';
          const isImperial = unit === 'imperial';
          const value = isSpeed
            ? isImperial
              ? metersToFeet(stats.speed_m)
              : Math.round((Number(stats.speed_m) || 0) * 10) / 10
            : Math.floor(Number(stats[key]) || 0);

          return (
            <StatBox
              key={key}
              label={label}
              color={color}
              info={info}
              value={value}
              suffix={isSpeed ? (isImperial ? 'ft' : 'm') : ''}
            />
          );
        })}
      </div>

      {/* ---------- DEFENSES ---------- */}
      <div className="stat-category-label">Defenses</div>
      <div className="attr-row">
        {DEFENSE_LINE.map(({ key, label, color, info }) => (
          <StatBox
            key={key}
            label={label}
            color={color}
            info={info}
            value={Math.floor(Number(stats[key]) || 0)}
          />
        ))}
      </div>

      {/* ---------- HEALTH AND SHIELD ----------
          The two pools the creature owns. A character's bars open a ledger,
          because every movement of theirs is worth a reason; a creature's is
          taken and given back mid-fight several times a turn, so it gets the
          steppers instead and no history. */}
      <div className="stat-category-label">Resources</div>

      <PoolRow
        label={minion.down ? 'Health — Dead' : 'Health'}
        current={minion.health}
        max={stats.health_max}
        color="var(--stat-health)"
        readOnly={readOnly}
        onChange={(value) => move('health', value)}
      />

      {/* "If its health reach 0 it instantly is shown as dead, it cannot go in
          negative." What that means for a *bonded* creature is on ONE AND THE
          SAME, and it is the one thing a reader seeing the skull needs told. */}
      {minion.down && spec.down && <p className="minion-down">{spec.down}</p>}

      <PoolRow
        label="Shield"
        current={minion.shield}
        max={stats.shield_cap}
        color="var(--stat-shield)"
        readOnly={readOnly}
        onChange={(value) => move('shield', value)}
      />

      {/* Willpower is not a pool of its own: it spends its bonded's. Said here
          rather than drawn as a fourth bar, which would be the same bar twice. */}
      <p className="minion-note">
        It spends your <b>Willpower</b>, and its own Action Points.
      </p>

      {editing && (
        <MinionWindow
          character={character}
          minion={minion}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

/**
 * A pool the creature owns, with the four steps that move it.
 *
 * Not a ledger. A character's Health is moved a handful of times a session and
 * every movement is worth a reason; a creature's is moved several times a turn
 * and none of them are. Four buttons rather than two, because dropping 22 Health
 * one tap at a time is not a thing anybody does twice.
 */
function PoolRow({ label, current, max, color, readOnly, onChange }) {
  return (
    <div className="minion-pool">
      <ResourceBar label={label} current={current} max={max} color={color} title={label} />

      {!readOnly && (
        <div className="minion-steps">
          {[-5, -1, 1, 5].map((delta) => (
            <button
              type="button"
              key={delta}
              className={`minion-step${delta > 0 ? ' is-up' : ''}`}
              onClick={() => onChange(current + delta)}
              aria-label={`${delta > 0 ? 'Add' : 'Take'} ${Math.abs(delta)} ${label}`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================== THE SECOND BLOCK */

/**
 * What it can do with its turn: its two point pools, and everything it plays.
 *
 * The quick bar is the character's own, built by `minionBar` out of the cards
 * the set tagged as the creature's, so a chip here behaves exactly like a chip
 * on block 4 — one tap opens the use, the card is printed under the two ways,
 * and Cancel costs nothing.
 */
export function MinionActionsBlock({ character, minion, patch, readOnly = false }) {
  const [request, setRequest] = useState(null);

  const groups = useMemo(() => minionBar(character, minion), [character, minion]);
  const total = groups.reduce((sum, group) => sum + group.moves.length, 0);
  const { isFolded, toggle } = useFoldedGroups('minion', character?.id);

  /* The creature as a character, which is what both the prompt's affordability
     check and the spend arithmetic want. Its Action Points, its bonded's
     Willpower. */
  const actor = minionActor(character, minion);
  const { stats } = minion;

  function confirmUse(mode, amount) {
    const body = spendUse(request, actor, mode, amount);
    const write = minionSpend(character, minion, body);
    if (Object.keys(write).length > 0) patch(write);
    setRequest(null);
  }

  const pool = (key, value) => {
    const body = setMinionPool(character, minion, key, value);
    if (body) patch(body);
  };

  return (
    <div className="cell-scroll active-block minion-block">
      <div className="block-head">
        <span className="stat-category-label">
          {minion.named ? minion.name : minion.spec.label} · Actions
        </span>
        <span className="block-count">
          {total} {total === 1 ? 'move' : 'moves'}
        </span>
      </div>

      <div className="pool-row">
        <div className="pool-head">
          <span className="pool-label">
            Action Points
            <span className="pool-count">
              {minion.ap}/{stats.ap_max}
            </span>
          </span>
        </div>
        <PipRow
          current={minion.ap}
          max={stats.ap_max}
          variant="ap"
          readOnly={readOnly}
          onChange={(value) => pool('ap', value)}
        />
      </div>

      <div className="pool-row">
        <div className="pool-head">
          <span className="pool-label">
            Reaction Points
            <span className="pool-count">
              {minion.reaction}/{stats.reaction_max}
            </span>
          </span>
        </div>
        <PipRow
          current={minion.reaction}
          max={stats.reaction_max}
          variant="reaction"
          readOnly={readOnly}
          onChange={(value) => pool('reaction', value)}
        />
      </div>

      {/* Down, it is not on the board at all, so nothing it knows can be
          played. The line says why rather than leaving a row of dead chips. */}
      {minion.down && (
        <p className="minion-down">{minion.spec.down ?? 'It is down and cannot act.'}</p>
      )}

      {groups.map((group) => {
        const folded = isFolded(group.id);

        return (
          <section className="bar-group" key={group.id}>
            <GroupHead
              label={group.label}
              note={group.note}
              count={group.moves.length}
              folded={folded}
              onToggle={() => toggle(group.id)}
            />

            {!folded && (
              <div className="bar-chips">
                {group.moves.map((move) => (
                  <BarChip
                    key={move.key}
                    move={move}
                    readOnly={readOnly || minion.down}
                    onUse={() =>
                      setRequest({
                        name: move.card?.name ?? move.name,
                        source: move.source,
                        ap: move.ap,
                        wp: move.wp,
                        variable: move.variable,
                        converts: move.converts,
                        opens: move.opens,
                        card: move.card,
                        modifiers: move.modifiers,
                        note: move.note,
                        extra: move.extra,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {total === 0 && (
        <p className="minion-note">
          Nothing to play yet. The cards it knows arrive with the set&rsquo;s ranks.
        </p>
      )}

      {request && (
        <UsePrompt
          request={request}
          character={actor}
          onCancel={() => setRequest(null)}
          onConfirm={confirmUse}
        />
      )}
    </div>
  );
}
