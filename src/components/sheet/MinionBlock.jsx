import { useMemo, useState } from 'react';
import EffectPrompt from './EffectPrompt.jsx';
import UsePrompt from './UsePrompt.jsx';
import { MinionWindow } from './MinionPick.jsx';
import { BarChip } from './ActiveBlock.jsx';
import { EffectRow } from './TurnBlock.jsx';
import { AttrTile, GroupHead, PipRow, ResourceBar, SkullIcon, StatBox } from './parts.jsx';
import useFoldedGroups from './useFoldedGroups.js';
import { useCardStack } from '../../context/card-stack.js';
import { ATTRIBUTES } from '../../lib/attributes.js';
import { damageStyle } from '../../lib/cardText.js';
import { metersToFeet } from '../../lib/characterModel.js';
import { minionBar, spendUse } from '../../lib/combatBar.js';
import { dropEffect, normalizeEffects, nudgeEffect } from '../../lib/combatTurn.js';
import { minionActor, minionSpend, setMinionEffects, setMinionPool } from '../../lib/minions.js';

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
 *
 * ------------------------------------------------------- what it does not get
 * No turn manager and no rests. There is one clock at the table and it is the
 * character's: "during your turn, you also control your draconic ally", so the
 * creature has no turn of its own to start and nothing of its own to sleep off.
 * Its Action Points come back on its bonded's Start Turn and its Health on their
 * Long Rest, both from block 6's buttons (see refillMinions and minionRest).
 *
 * It does get a tracker, because being Frightened is a thing that happens to a
 * dragon and not to its bonded, and it counts down on the same press.
 *
 * ------------------------------------------------------------- and no scroll
 * Neither block scrolls. The first one is a fixed list of tiles and fits; the
 * second holds two lists that have no natural length — everything it can play,
 * and everything running on it — so each of those gets the height left over and
 * scrolls inside itself. Which means the pools, the heads and the add button
 * never move, and nothing on either block is hidden below a fold.
 */

/* The six tiles, in block 2's own order, under one heading instead of its two.
   Block 2 can afford "Combat Stats" and "Defenses" as separate headings; this
   block holds what the character spreads over blocks 1 and 2 and cannot, and a
   heading costs it the same height as three more tiles would. The tiles
   themselves are unmoved — same six, same places, same colours — because that
   is the part a reader compares between the two blocks.

   Armor is among them and always zero. A creature wears no gear and there is
   nowhere on the sheet to give it any, so the tile could have been left off —
   but a row of two where block 2 has three is the kind of small difference that
   makes two stat blocks hard to read against each other. */
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
      {/* The way back into the naming window is up here, on the block's own
          head, and not beside the plate. Beside the plate it was a 52px button
          taking width off the row it shares with the name and the chips, which
          pushed both of them into wrapping and made the row taller than the
          picture in it. Up here it costs nothing: the head is one line either
          way, and block 6 already puts its own small action on one. */}
      <div className="block-head">
        <span className="stat-category-label">{spec.label}</span>
        <span className="spacer" />
        <span className="block-count">Lvl {String(minion.level).padStart(2, '0')}</span>
        {!readOnly && (
          <button
            type="button"
            className="minion-edit"
            onClick={() => setEditing(true)}
            title={minion.named ? `Change ${minion.name}` : `Name your ${spec.noun ?? 'ally'}`}
          >
            {minion.named ? 'Edit' : 'Name it'}
          </button>
        )}
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

            {/* "If its health reach 0 it instantly is shown as dead, it cannot
                go in negative." What that means for a *bonded* creature is on
                ONE AND THE SAME, and it is said here as a chip rather than a
                paragraph: the plate beside it is the tallest thing in this row,
                so a chip costs the block no height at all, and the sentence
                itself is printed in full on the second block, where a row of
                dead chips would otherwise need explaining. */}
            {minion.down && (
              <span className="minion-chip is-down" title={spec.down ?? undefined}>
                Dead
              </span>
            )}
          </span>
        </span>
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

      {/* ---------- AND THE DEFENSES, UNDER THE SAME HEADING ---------- */}
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
          The two pools the creature owns, in the character's own bars — same
          box, same padding, same readout inside the track, because "all the
          stats are derived the same" and a Health is a Health.

          What is added under each is the four steps. A character's bar opens a
          ledger, because every movement of theirs is worth a reason; a
          creature's is taken and given back several times a turn and none of
          those is worth an entry, so it gets buttons instead of a history. */}
      <div className="stat-category-label">Resources</div>

      <PoolRow
        label={minion.down ? 'Health — Dead' : 'Health'}
        current={minion.health}
        max={stats.health_max}
        color="var(--stat-health)"
        readOnly={readOnly}
        onChange={(value) => move('health', value)}
      />

      <PoolRow
        label="Shield"
        current={minion.shield}
        max={stats.shield_cap}
        color="var(--stat-shield)"
        readOnly={readOnly}
        onChange={(value) => move('shield', value)}
      />

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

/* The basic actions arrive folded. A creature plays the four cards its set
   printed and the eleven moves every body on the board has, and the second set
   is the one nobody ever has to look up — open on arrival it would be six rows
   of chips between the pools and the tracker. One tap opens it for good. */
const CLOSED_ON_ARRIVAL = ['basic'];

/**
 * What it can do with its turn, and what is being done to it.
 *
 * The quick bar is the character's own, built by `minionBar` out of the cards
 * the set tagged as the creature's plus the basic actions everybody has, so a
 * chip here behaves exactly like a chip on block 4 — one tap opens the use, the
 * card is printed under the two ways, and Cancel costs nothing.
 *
 * The tracker below it is block 6's, minus the clock. A creature has no turn of
 * its own to start and no rest of its own to take, so neither button is here;
 * what it does have is its own list of what is running, on its own row, counted
 * down by its bonded's Start Turn.
 */
export function MinionActionsBlock({ character, minion, patch, readOnly = false }) {
  const [request, setRequest] = useState(null);
  const [adding, setAdding] = useState(false);
  const stack = useCardStack();

  const groups = useMemo(() => minionBar(character, minion), [character, minion]);
  const total = groups.reduce((sum, group) => sum + group.moves.length, 0);
  const { isFolded, toggle } = useFoldedGroups('minion', character?.id, CLOSED_ON_ARRIVAL);

  /* Its own tracker, repaired by the file that owns what an effect is. The row
     stores them as written; nothing below has a private idea of the shape. */
  const effects = useMemo(() => normalizeEffects(minion.effects), [minion.effects]);
  const running = effects.filter((effect) => effect.turns !== 0).length;
  const ended = effects.length - running;

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

  const writeEffects = (list) => setMinionEffects(character, minion.id, list);

  return (
    <div className="cell-scroll active-block minion-block minion-actions">
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

      {/* Willpower is not a pool of its own: it spends its bonded's. Said here,
          under the two pools that *are* its own, rather than drawn as a third
          bar that would be the same bar twice. */}
      <p className="minion-note">
        It spends your <b>Willpower</b>, and its own Action Points.
      </p>

      {/* Down, it is not on the board at all, so nothing it knows can be
          played. The line says why rather than leaving a row of dead chips. */}
      {minion.down && (
        <p className="minion-down">{minion.spec.down ?? 'It is down and cannot act.'}</p>
      )}

      {/* ---------- WHAT IT CAN PLAY ----------
          Its own share of the block's leftover height, and it scrolls inside
          itself rather than pushing the tracker off the bottom. */}
      <div className="minion-bar">
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
      </div>

      {/* ---------- WHAT IS RUNNING ON IT ----------
          Its own tracker and not its bonded's: a Frightened dragon is not a
          frightened drifter, and ONE AND THE SAME is the only line that crosses
          between the two. No turn button and no rests above it — there is one
          clock at this table and it is the character's. */}
      <div className="block-head fx-head">
        <span className="stat-category-label">Temporary Effects</span>
        <span className="block-count">
          {running} running{ended > 0 ? `, ${ended} just ended` : ''}
        </span>
      </div>

      {!readOnly && (
        <button type="button" className="fx-add" onClick={() => setAdding(true)}>
          + Track something on it
        </button>
      )}

      <div className="fx-list">
        {effects.length === 0 ? (
          <p className="pick-line fx-empty">
            Nothing running on it. Counted down when you start your turn and ended by your
            rests.
          </p>
        ) : (
          effects.map((effect) => (
            <EffectRow
              key={effect.id}
              effect={effect}
              readOnly={readOnly}
              onOpen={effect.card ? () => stack?.openCard(effect.card) : null}
              onNudge={(delta) => patch(writeEffects(nudgeEffect(effects, effect.id, delta)))}
              onDrop={() => patch(writeEffects(dropEffect(effects, effect.id)))}
            />
          ))
        )}
      </div>

      {adding && (
        <EffectPrompt
          character={character}
          onAdd={(body) => patch(body)}
          onClose={() => setAdding(false)}
          /* Whose tracker this lands on. The offers are still read off the
             character, because the cards are the pair's; where the row goes is
             the creature's row. */
          holder={{ name: minion.title, effects: minion.effects, write: writeEffects }}
        />
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
