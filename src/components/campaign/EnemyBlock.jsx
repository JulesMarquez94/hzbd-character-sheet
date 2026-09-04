import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import UsePrompt from '../sheet/UsePrompt.jsx';
import { BarChip } from '../sheet/ActiveBlock.jsx';
import { EffectRow } from '../sheet/TurnBlock.jsx';
import {
  AttrTile,
  GroupHead,
  PointPool,
  ResourceBar,
  SkullIcon,
  StatBox,
} from '../sheet/parts.jsx';
import useFoldedGroups from '../sheet/useFoldedGroups.js';
import { usePlayCard } from '../sheet/usePlayCard.js';
import { useCardStack } from '../../context/card-stack.js';
import { ATTRIBUTES } from '../../lib/attributes.js';
import { metersToFeet } from '../../lib/characterModel.js';
import { castPlan, foeBar } from '../../lib/combatBar.js';
import { CREATURE_MAX_LEVEL, difficultyLine } from '../../lib/creatures.js';
import { dropEffect, normalizeEffects, nudgeEffect } from '../../lib/combatTurn.js';
import { newChain } from '../../lib/logChain.js';
import { rollPlan } from '../../lib/rollPlan.js';
import { getCard } from '../../lib/weapons.js';
import {
  breakWard,
  foeActor,
  foeModifiers,
  foeOwns,
  foeSpend,
  setFoeEffects,
  setFoeLevel,
  setFoePool,
  stepFoePool,
} from '../../lib/encounters.js';

/**
 * One enemy, as the two blocks a creature gets, inside one block twice as wide.
 *
 * Jules, 2026-08-31: "They are just like the draconic ally, a two block but in
 * this case nestled inside a main double block for redabelity."
 *
 * So the layout is the minion's and the framing is not. A bonded creature's two
 * blocks are two cells with their own places in the arrangement, because they
 * belong to a character who might want them apart. An enemy's two are one cell:
 * a Game Master reads an enemy as one thing, and the pools they are moving have
 * to be beside the Health they are moving them against. The panes inside are the
 * same two panes, in the same order, drawn with the same tiles.
 *
 * ---------------------------------------------------------------- the i button
 * "There have a i button that opens up lore about the creature." One button on
 * the block head, and behind it the paragraph at the foot of the printed page.
 * A dialog rather than a tooltip: the Blightgeist's is two lines and a
 * Thornmother's is a paragraph, and neither belongs in a hover bubble that
 * disappears when you move to read it.
 *
 * ------------------------------------------------------------- who pays what
 * Everything, itself. An enemy has its own Willpower, which is the one line that
 * separates it from a bonded minion: `foeActor` dresses it as a character so the
 * prompt's affordability check reads its own three pools, and `foeSpend` writes
 * the whole answer back to its own row on the encounter.
 *
 * ---------------------------------------------------------- and no scrolling
 * The block itself never scrolls, the way every block on the site does not. The
 * left pane is a fixed list of tiles and fits. The right pane holds three lists
 * with no natural length, so those share the leftover height and scroll inside
 * themselves: the pools, the heads and the buttons never move.
 */

/* The same three tiles block 2 draws, in block 2's own order. Same trap and same
   note as everywhere else on the site: `avoid` prints as "Defense" (how hard it
   is to hit) and `defense` prints as "Armor" (flat reduction), because the
   columns predate the relabel. DEF on the printed creature page is the first of
   the two. */
const TOP_LINE = [
  {
    key: 'initiative',
    label: 'Initiative',
    color: 'var(--stat-init)',
    info: 'Added to its roll when rolling for turn order. Its Instinct plus its level.',
  },
  {
    key: 'speed_m',
    label: 'Speed',
    color: 'var(--stat-speed)',
    info: 'How far it moves with the Move action. Printed on its page.',
    kind: 'speed',
  },
  {
    key: 'defense',
    label: 'Armor',
    color: 'var(--stat-armor)',
    /* And which family it is, when it is wearing one. Heavy is the family whose
       Armor is also Defense, so the two tiles have to be readable together. */
    info: (stats) =>
      stats.armor && stats.armor.id !== 'none'
        ? `Flat damage reduction, applied after a hit lands. ${stats.armor.label} armor: ${stats.armor.active}`
        : 'Flat damage reduction, applied after a hit lands.',
  },
];

const DEFENSE_LINE = [
  {
    key: 'avoid',
    label: 'Defense',
    color: 'var(--focus-cyan)',
    /* What Defense is made of depends on what the creature is wearing, so this
       one tile asks the stats rather than printing a fixed sentence. A Light
       armored creature reads off its Reflex and a Magic one off its Grit, the
       same three rules a character's full set keeps: see CREATURE_ARMOR. */
    info: (stats) =>
      `How difficult it is to hit. ${stats.armor?.active ?? 'Defense is its Instinct.'}`,
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

/* The basic actions arrive folded, for the reason a creature's bar folds them:
   an enemy plays the two or three cards its page printed and the eleven moves
   every body on the board has, and the second set is the one nobody looks up. */
const CLOSED_ON_ARRIVAL = ['basic'];

/**
 * `encounter` is deliberately not a prop. Every writer is handed the encounter
 * by `patch` itself, as the row the write is about to be applied to, so a block
 * holding its own copy could only ever be a stale second opinion. See the note
 * on `rowsRef` in EncounterTab.jsx.
 */
/**
 * `combat` is the fight around this enemy, when there is one: the roster of
 * everybody standing (see combatRoster in EncounterTab.jsx) and the three ways
 * a use reaches past this block — laying an effect on targets, landing rolled
 * numbers on them, rolling what a tracked effect deals. Absent on the Bestiary
 * tab, where a creature is a page and not a combatant, and every path below
 * then behaves exactly as it did.
 */
export default function EnemyBlock({
  foe,
  patch,
  readOnly = false,
  unit = 'metric',
  onRemove = null,
  onEdit = null,
  combat = null,
}) {
  const [lore, setLore] = useState(false);

  return (
    <div className="foe-block">
      <FoeStats
        foe={foe}
        patch={patch}
        readOnly={readOnly}
        unit={unit}
        onLore={() => setLore(true)}
        onRemove={onRemove}
        onEdit={onEdit}
      />
      <FoeActions foe={foe} patch={patch} readOnly={readOnly} combat={combat} />

      {lore && <LoreWindow foe={foe} onClose={() => setLore(false)} />}
    </div>
  );
}

/* ============================================================== THE LEFT PANE */

/**
 * Who it is and what it is made of: the name, the type line, the difficulty
 * line off the printed page, the three attributes, the combat stats, the
 * defenses, and the two pools it loses when it is hit.
 */
function FoeStats({ foe, patch, readOnly, unit, onLore, onRemove, onEdit }) {
  const { creature, rank, stats } = foe;

  /* Handed to `patch` as a function of the encounter rather than as a body,
     because every writer in encounters.js rebuilds the whole `foes` list off
     the encounter it is given. Two presses in one React batch would otherwise
     both build from the render's copy and one of the two would be lost. And a
     step is a delta rather than a destination, for the same reason: see
     `stepFoePool`. */
  const step = (pool, delta) => patch((row) => stepFoePool(row, foe, pool, delta));
  const onLevel = (delta) => patch((row) => setFoeLevel(row, foe.key, delta, { by: true }));

  return (
    <div className="cell-scroll foe-pane foe-pane-stats">
      <div className="block-head">
        <span className="stat-category-label">{creature.type}</span>
        <span className="spacer" />

        {/* The lore button. Small, on the head, beside the one other thing the
            head carries, because the block below it is a wall of numbers and
            this is the only word in it. */}
        <button
          type="button"
          className="foe-info"
          onClick={onLore}
          title={`What is a ${creature.name}?`}
          aria-label={`Lore: ${creature.name}`}
        >
          i
        </button>

        {/* Rewriting the *page*, which is a different act from touching this
            instance of it and so is not gated on `readOnly`. The bestiary draws
            every block read only and still offers this on a creature the reader
            forged: nothing on the block can be pressed, and the creature behind
            it can be rebuilt. Only a forged creature is ever handed one; a
            printed page is the codex's. See BestiaryTab. */}
        {onEdit && (
          <button
            type="button"
            className="foe-drop"
            onClick={onEdit}
            title={`Rebuild ${creature.name}`}
          >
            Edit
          </button>
        )}

        {!readOnly && onRemove && (
          <button
            type="button"
            className="foe-drop"
            onClick={onRemove}
            title={`Take ${foe.title} off the table`}
          >
            Remove
          </button>
        )}
      </div>

      <div className="foe-id">
        <span className="foe-plate" style={{ '--rank-tone': rank.color }}>
          {creature.portrait_url ? (
            <img src={creature.portrait_url} alt="" />
          ) : (
            <span className="foe-plate-empty" aria-hidden="true" />
          )}
        </span>

        <span className="foe-id-body">
          <span className="foe-name">
            {foe.down && (
              <span className="dead-mark" title="Down" aria-label="Down">
                <SkullIcon />
              </span>
            )}
            {foe.title}
          </span>

          <span className="foe-tags">
            <span className="foe-chip foe-chip-rank" style={{ '--rank-tone': rank.color }}>
              {rank.label}
            </span>

            {/* Where it came from, when it did not come from the codex. Two
                words rather than one, because "forged" alone would not say
                whether the reader is looking at their own page or at one an
                admin published to everybody. */}
            {creature.forged && (
              <span
                className="foe-chip foe-chip-forged"
                title={
                  creature.scope === 'codex'
                    ? 'Forged and published to the shared bestiary.'
                    : 'Forged on this account. It is on nobody else\u2019s shelf.'
                }
              >
                {creature.scope === 'codex' ? 'Published' : 'Forged'}
              </span>
            )}

            {/* The level, and the way to change it. "All enemies should have a
                level scale option", 2026-08-31: the same Blightgeist is level 1
                in the crypt and level 9 in the vault, so the level belongs to
                this enemy and not to the page it came off. Two steps rather than
                a dial, because a Game Master nudges it while building and never
                jumps from 2 to 11.

                It says out loud when it has been moved off the level its page
                was written at, so nobody reads a scaled block as the printed
                one. */}
            <span className={`foe-chip foe-level${foe.scaled ? ' is-scaled' : ''}`}>
              {!readOnly && (
                <button
                  type="button"
                  className="foe-level-step"
                  onClick={() => onLevel(-1)}
                  disabled={foe.level <= 1}
                  aria-label="A level lower"
                >
                  −
                </button>
              )}
              <span title={difficultyLine(creature, foe.level)}>
                Lvl {String(foe.level).padStart(2, '0')} · {stats.xp} XP
              </span>
              {!readOnly && (
                <button
                  type="button"
                  className="foe-level-step"
                  onClick={() => onLevel(1)}
                  disabled={foe.level >= CREATURE_MAX_LEVEL}
                  aria-label="A level higher"
                >
                  +
                </button>
              )}
            </span>

            {foe.down && (
              <span className="foe-chip is-down" title="At 0 Health. It cannot play anything.">
                Down
              </span>
            )}
          </span>
        </span>
      </div>

      {/* ---------- THE NINE TILES ----------
          Attributes, then combat stats, then defenses, in the sheet's own order
          and colours, and with none of the three headings that separate them on
          the sheet. Measured: the pane came out 44px over its 636 with them,
          which is the exact height of two heading lines, and every one of those
          nine tiles already names itself. The party block on the Overview made
          the same trade for the same reason and it is the precedent this
          follows. See PartyBlock.jsx.

          What the headings were doing structurally is done by the seam over
          Resources, which is kept because the three bars under it are a
          different kind of thing from a tile. */}
      <div className="attr-row">
        {ATTRIBUTES.map(({ key, label, color }) => (
          <AttrTile
            key={key}
            label={label}
            color={color}
            /* Off the level rather than off the page: a creature carries no
               attributes of its own any more, only the shape that produces them.
               See creatureAttributes in creatures.js. */
            value={foe.attributes[key]}
            info={
              creature.primary === key
                ? `Its ${label}, and the one it is built on. It climbs to 12 by level 12.`
                : `Its ${label} at level ${foe.level}.`
            }
          />
        ))}
      </div>

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
              info={typeof info === 'function' ? info(stats) : info}
              value={value}
              suffix={isSpeed ? (isImperial ? 'ft' : 'm') : ''}
            />
          );
        })}
      </div>

      <div className="attr-row">
        {DEFENSE_LINE.map(({ key, label, color, info }) => (
          <StatBox
            key={key}
            label={label}
            color={color}
            info={typeof info === 'function' ? info(stats) : info}
            value={Math.floor(Number(stats[key]) || 0)}
          />
        ))}
      </div>

      {/* ---------- THE THREE POOLS ----------
          Health, Shield and Willpower, with the four steps under each rather
          than a ledger: an enemy's Health is moved several times a turn and none
          of those movements is worth a reason.

          Willpower is here rather than beside the two point pools it used to sit
          with (Jules, 2026-08-31: "move the willpower to the first block"). It
          reads better for it: this pane is what an enemy *has* and the other is
          what it can *do*, and Willpower is a pool that gets spent down over a
          fight exactly the way Health is, not a bar that refills every turn.

          The "Resources" heading over them is gone too, and for the reason the
          two stat headings went: measured, the pane came out 25 over its 636
          with Willpower added, which is a heading line, and all three bars name
          themselves inside their own track. What the heading was doing is done
          by the seam, which costs a pixel. */}
      <div className="foe-seam" aria-hidden="true" />

      <FoePool
        label={foe.down ? 'Health · Down' : 'Health'}
        title={`${stats.health_max} at level ${foe.level}. Health is not rolled.`}
        current={foe.health}
        max={stats.health_max}
        color="var(--stat-health)"
        readOnly={readOnly}
        onStep={(delta) => step('health', delta)}
      />

      <FoePool
        label="Shield"
        current={foe.shield}
        max={stats.shield_cap}
        color="var(--stat-shield)"
        readOnly={readOnly}
        onStep={(delta) => step('shield', delta)}
      />

      {/* Its own, which is the one line that separates an enemy from a bonded
          minion: a minion spends its bonded's. */}
      <FoePool
        label="Willpower"
        title={`${stats.willpower_max} at level ${foe.level}. Its own: an enemy borrows nothing.`}
        current={foe.willpower}
        max={stats.willpower_max}
        color="var(--stat-wp)"
        readOnly={readOnly || stats.willpower_max === 0}
        onStep={(delta) => step('willpower', delta)}
      />
    </div>
  );
}

/** A pool the enemy owns, with the four steps that move it. Not a ledger: see
    the note on the same row in MinionBlock.jsx. The steps hand back a delta and
    never a destination, because the number on screen may already be one press
    out of date. */
function FoePool({ label, title, current, max, color, readOnly, onStep }) {
  return (
    <div className="minion-pool">
      <ResourceBar label={label} current={current} max={max} color={color} title={title ?? label} />

      {!readOnly && (
        <div className="minion-steps">
          {[-5, -1, 1, 5].map((delta) => (
            <button
              type="button"
              key={delta}
              className={`minion-step${delta > 0 ? ' is-up' : ''}`}
              onClick={() => onStep(delta)}
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

/* ============================================================= THE RIGHT PANE */

/**
 * What it can do with its turn, what is simply true of it, and what is being
 * done to it.
 *
 * Three pools rather than two, because an enemy spends its own Willpower. And
 * the Reaction row is drawn even for a Minion, empty and out of nought, rather
 * than left off: a row that is missing reads as an oversight, and a row that
 * reads "0 / 0" beside a line saying why is the rule stated where it applies.
 */
function FoeActions({ foe, patch, readOnly, combat = null }) {
  const [request, setRequest] = useState(null);
  const stack = useCardStack();
  const { rank, stats } = foe;

  const actor = useMemo(() => foeActor(foe), [foe]);

  /**
   * The spend, folded onto this enemy's row.
   *
   * `usePlayCard` builds a patch against a *character* and hands it here.
   * Everything it wrote belongs to the enemy, and `foeSpend` is what puts it on
   * the enemy's row rather than on the encounter as a whole. Wrapped as a
   * function of the current encounter for the reason the pool steps are: the
   * row on screen may be a press out of date.
   */
  const play = usePlayCard({
    character: actor,
    patch: (body) => patch((row) => foeSpend(row, foe, body)),
  });

  const groups = useMemo(() => foeBar({ ...foe, actor }), [foe, actor]);
  const total = groups.reduce((sum, group) => sum + group.moves.length, 0);
  const { isFolded, toggle } = useFoldedGroups('foe', foe.creature.id, CLOSED_ON_ARRIVAL);

  const effects = useMemo(() => normalizeEffects(foe.effects), [foe.effects]);
  const running = effects.filter((effect) => effect.turns !== 0).length;

  /* Whether a tap on a chip can spend anything. False on the Bestiary tab and
     false for a body at 0 Health, and in both cases the tap reads the card
     instead. See the chips below. */
  const canPlay = !readOnly && !foe.down;

  /* The pip rows set a pool outright rather than stepping it, because a pip is
     a place and not a movement: tapping the fourth pip means four. */
  const pool = (key, value) => patch((row) => setFoePool(row, foe, key, value));

  /* Curried, so `patch(writeEffects(list))` reads as one call: what the list
     becomes is decided by combatTurn.js against the rows this block already
     holds, and where it lands is decided against the newest encounter. */
  const writeEffects = (list) => (row) => setFoeEffects(row, foe.key, list);

  function confirmUse(mode, amount, options = {}) {
    const targets = options?.targets ?? [];

    /* This use's own id, minted here rather than inside `play` because this
       block writes rows against it too: the effect it lays and the numbers the
       apply window lands both belong in the action's block and not beside it.
       See UNDER in logChain.js. */
    const chain = newChain();

    /* What this cast leaves on the bodies it was aimed at: the card's own row
       when the plan says it lands on them, and every condition it inflicts,
       signed by this enemy. "When an ability is cast that affects an entity
       with an effect, this effect needs to populate on the target trackers." A
       cast standing behind a check waits for the verdict and lands on whoever
       was actually hit, which is what "On a hit" means; one with no check to
       pass lays now. The caster's own copy is kept or stripped by the hook,
       off the same plan. See castPlan in combatBar.js. */
    const half = Boolean(options?.price);
    const links = rollPlan(request.card, actor, request.modifiers, { half });
    const casting = castPlan(request, actor, {
      half,
      riders: options?.riders ?? [],
      statuses: options?.statuses ?? [],
      plan: links,
    });
    const aimed = targets.length > 0;
    const toLay = aimed
      ? [...(casting.landsOn !== 'caster' && casting.own ? [casting.own] : []), ...casting.laid].map(
          (row) => ({ ...row, from: foe.title })
        )
      : [];
    const checky = aimed && links.some((link) => link.shape === 'check');

    /* Paid, logged and rolled under the enemy's own name, because that is who
       acted. The whole spend lands on its own row: nothing is borrowed and
       nothing crosses to a sheet. See foeSpend, and `play` above. */
    play(request, mode, amount, options, {
      actor,
      chain,
      /* And once the dice stop, the whole answer goes to the page: what landed,
         who the check judged hit and missed, and the rows still waiting on the
         verdict. Only for an aimed use — one with nobody picked rolls onto the
         table and is landed by hand, exactly as it always was. */
      ...(aimed && combat?.onResults
        ? {
            onSettled: (thrown, meta = {}) =>
              combat.onResults({
                foe,
                request,
                /* The survivors, when the reaction gate dropped anybody: the
                   window and the deliveries land on who is left. */
                targets: meta.targets ?? targets,
                thrown,
                outcomes: meta.outcomes ?? null,
                hit: meta.hit ?? null,
                casts: checky ? toLay : [],
                chain,
              }),
          }
        : {}),
    });

    if (!checky) for (const row of toLay) combat?.layEffect?.(foe, targets, row, chain);
    /* And the body it put on the table, written by the page that has the pen. */
    if (casting.conjured) combat?.conjure?.(foe, casting.conjured, chain);
    setRequest(null);
  }

  /**
   * What a tracked effect deals, rolled off its row.
   *
   * "In the case of effects that create elementals that last and need rolls,
   * when the conditions are triggered you can click on the tracked effect like
   * wall of fire to roll damage and select a target to apply it." The row's
   * card says what it rolls — the same value links a use would have thrown —
   * so the button appears exactly where the card carries dice and nowhere
   * else. What happens after the throw is the page's (see rollEffect in
   * EncounterTab.jsx): the apply window, with nobody preselected, because a
   * wall burns whoever walked into it and only the table knows who that was.
   */
  function throwable(effect) {
    if (!combat?.rollEffect || foe.down) return null;
    const card = getCard(effect.card);
    if (!card) return null;
    /* Its best attribute only when the row is its *own* card. A tracker on an
       enemy holds delivered rows too, and a player's Wall of Fire is the
       player's spell however long it burns here. See foeOwns in encounters.js. */
    const modifiers = foeOwns(foe, card.id) ? foeModifiers(actor) : { actor };
    const links = rollPlan(card, actor, modifiers).filter((link) => link.shape === 'value');
    return links.length > 0 ? links : null;
  }

  return (
    <div className="cell-scroll active-block foe-pane foe-pane-actions">
      <div className="block-head">
        <span className="stat-category-label">Actions</span>
        <span className="block-count">
          {total} {total === 1 ? 'move' : 'moves'}
        </span>
      </div>

      <PointPool
        label="Action Points"
        current={foe.ap}
        max={stats.ap_max}
        variant="ap"
        readOnly={readOnly}
        onChange={(value) => pool('ap', value)}
      />

      <PointPool
        label="Reaction Points"
        current={foe.reaction}
        max={stats.reaction_max}
        variant="reaction"
        readOnly={readOnly || !rank.reacts}
        onChange={(value) => pool('reaction', value)}
      />

      {/* Willpower is not here. It moved to the pane on the left, beside Health
          and Shield, because that pane is what an enemy *has* and this one is
          what it can *do*. Jules, 2026-08-31. */}

      {/* The rank's one rule, printed where it bites rather than left for
          somebody to remember. Every rank has one and every one of them is about
          these two pools. */}
      <p className="foe-rule">{rank.blurb}</p>

      {foe.down && (
        <p className="minion-down">
          {foe.conjured
            ? 'Destroyed. Remove it when the table is done with it.'
            : 'Down at 0 Health. It cannot play anything.'}
        </p>
      )}

      {/* A body a spell made has no moves of its own: what it does is on the
          card that made it, and its caster does it on their turn. */}
      {foe.conjured && !foe.down && (
        <p className="foe-rule">
          Made by {foe.conjured.owner || 'a spell'}
          {foe.conjured.card ? ` with ${getCard(foe.conjured.card)?.name ?? 'a card'}` : ''}. What
          it does is on that card. Aim at it like any body; it falls at 0 Health.
        </p>
      )}

      <div className="foe-lists">
        {/* ---------- WHAT IT CAN PLAY ---------- */}
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
                  {group.moves.map((entry) => (
                    <BarChip
                      key={entry.key}
                      move={entry}
                      /* Never disabled, because a chip that cannot be played is
                         still a card that can be read. Jules, 2026-08-31: "I
                         should be able to preview the abilities." On the
                         Bestiary tab there was no way to read a creature's card
                         at all, and on a live block a Game Master reading what a
                         Blightbolt does should not have to spend the Action
                         Points to find out.

                         So the tap does the most it is allowed to do: it opens
                         the use where a use is possible, and deals the card
                         where it is not. Either way the card is on the screen a
                         tap later, because the prompt prints it too. */
                      readOnly={false}
                      onUse={() =>
                        canPlay
                          ? setRequest({
                              name: entry.card?.name ?? entry.name,
                              source: entry.source,
                              ap: entry.ap,
                              wp: entry.wp,
                              variable: entry.variable,
                              converts: entry.converts,
                              opens: entry.opens,
                              card: entry.card,
                              modifiers: entry.modifiers,
                              note: entry.note,
                              extra: entry.extra,
                            })
                          : stack?.openCard(entry.card, entry.modifiers)
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {/* ---------- WHAT IS SIMPLY TRUE OF IT ----------
            Its passives, and the switch on the ones whose condition is a thing
            on the table. See the ward note in creatures.js. */}
        {foe.passives.length > 0 && (
          <section className="bar-group">
            <GroupHead
              label="Passives"
              note="Always on"
              count={foe.passives.length}
              folded={isFolded('passives')}
              onToggle={() => toggle('passives')}
            />

            {!isFolded('passives') && <div className="foe-passives">
              {foe.passives.map((card) => (
                <PassiveRow
                  key={card.id}
                  card={card}
                  broken={foe.broken.has(card.id)}
                  readOnly={readOnly}
                  /* Read with the same rider its action chips carry, so a
                     passive prints the attribute the creature would actually
                     roll. See foeModifiers in encounters.js. */
                  onOpen={() => stack?.openCard(card, foeModifiers(actor))}
                  onToggle={(next) => patch((row) => breakWard(row, foe, card.id, next))}
                />
              ))}
            </div>}
          </section>
        )}

        {/* ---------- WHAT IS RUNNING ON IT ---------- */}
        <section className="bar-group">
          <GroupHead
            label="Temporary Effects"
            note={running > 0 ? `${running} running` : 'Nothing running'}
            count={effects.length}
            folded={isFolded('effects')}
            onToggle={() => toggle('effects')}
          />

          {!isFolded('effects') &&
            (effects.length === 0 ? (
              <p className="pick-line fx-empty">
                Nothing running on it. A card that lasts lays its row here, and a condition it is
                hit with lands here too.
              </p>
            ) : (
              <div className="fx-list">
                {effects.map((effect) => {
                  const links = throwable(effect);
                  return (
                    <EffectRow
                      key={effect.id}
                      effect={effect}
                      readOnly={readOnly}
                      onOpen={effect.card ? () => stack?.openCard(effect.card) : null}
                      onNudge={(delta) => patch(writeEffects(nudgeEffect(effects, effect.id, delta)))}
                      onDrop={() => patch(writeEffects(dropEffect(effects, effect.id)))}
                      /* A wall of fire on the tracker rolls its own damage from
                         its own row. See throwable above. */
                      onRoll={links ? () => combat.rollEffect(foe, effect, links) : null}
                      /* An enemy's stats are printed and no rider reaches them, so
                         a row here does not claim to have moved one. Same call as
                         a creature's tracker. See riders.js. */
                      bends={false}
                    />
                  );
                })}
              </div>
            ))}
        </section>
      </div>

      {request && (
        <UsePrompt
          request={request}
          character={actor}
          onCancel={() => setRequest(null)}
          onConfirm={confirmUse}
          /* Everybody in the fight, so a card that reaches other bodies offers
             them before the pay buttons. Absent on the Bestiary, where there is
             nobody to reach. */
          combat={combat ? { roster: combat.roster, self: foe.key } : null}
        />
      )}
    </div>
  );
}

/**
 * One passive, and the switch on the ones that answer to the room.
 *
 * An ordinary passive is a row you tap to read. A ward is the same row with a
 * button on it, because "until a pillar is destroyed" is a thing the Game Master
 * knows and the sheet never can. Broken, it is struck through and stays on the
 * block: what the ward *was* is still worth reading, and the party may well put
 * it back.
 */
function PassiveRow({ card, broken, readOnly, onOpen, onToggle }) {
  const ward = Boolean(card.ward);

  return (
    <div className={`foe-passive${ward ? ' is-ward' : ''}${broken ? ' is-broken' : ''}`}>
      <button type="button" className="foe-passive-name" onClick={onOpen} title="Read the card">
        {card.name}
      </button>

      {ward && (
        <>
          <span className="foe-passive-while">{broken ? 'Broken' : card.ward}</span>
          {!readOnly && (
            <button
              type="button"
              className="foe-ward-btn"
              onClick={() => onToggle(!broken)}
              title={
                broken
                  ? `Put ${card.name} back up`
                  : `${card.name} is broken: ${card.while ?? 'it no longer holds'}`
              }
            >
              {broken ? 'Restore' : 'Break'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ================================================================== THE LORE */

/** The paragraph at the foot of the printed page, and the rest of its heading. */
function LoreWindow({ foe, onClose }) {
  const { creature, rank } = foe;

  return (
    <Modal title={creature.name} onClose={onClose} accent={rank.color}>
      <p className="foe-lore-head">
        {creature.type} · {difficultyLine(creature, foe.level)}
      </p>

      {creature.lore ? (
        <p className="foe-lore">{creature.lore}</p>
      ) : (
        <p className="pick-line">Nothing has been written about this one yet.</p>
      )}

      <p className="foe-lore-rank">
        <b>{rank.label}.</b> {rank.blurb}
      </p>
    </Modal>
  );
}
