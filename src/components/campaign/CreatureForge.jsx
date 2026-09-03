import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import TagFilter from '../sheet/TagFilter.jsx';
import { useTagFilter } from '../sheet/useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import { ATTRIBUTES } from '../../lib/attributes.js';
import { compareTags } from '../../lib/cardOrder.js';
import { getCard } from '../../lib/weapons.js';
import {
  CREATURE_MAX_LEVEL,
  RANKS,
  clampCreatureLevel,
  creatureAttributes,
  creatureStats,
  difficultyLine,
  getRank,
} from '../../lib/creatures.js';
import {
  FORGED_CARDS_MAX,
  FORGED_DICE,
  FORGED_FIELDS,
  FORGED_KINDS,
  FORGED_LORE_MAX,
  FORGED_NAME_MAX,
  FORGED_SIZES,
  blankBody,
  createForgedCreature,
  deleteForgedCreature,
  forgeableCards,
  normalizeBody,
  updateForgedCreature,
} from '../../lib/customCreatures.js';
import { tagStyle } from '../../lib/tagColors.js';

/**
 * The forge: one creature, built by hand, from the same shape the codex uses.
 *
 * Jules, 2026-09-02: "I want you to create a tool in the bestiary that allow the
 * user to add a custom made entity... Make sure all the needed field as
 * adjustable, that you can see the which stat get increase as main."
 *
 * So every field a printed creature has is a control here, and nothing about a
 * forged creature is a second, simpler kind of enemy. What comes out of this is
 * a row in `custom_creatures`, and from the moment it lands it is a creature:
 * the Bestiary draws it with the same block, the encounter shelf offers it, and
 * `creatureStats` gives it its numbers.
 *
 * ------------------------------------------------------- the attribute panel
 * "Do note that there is an error everyone starts at 4 in all stats."
 *
 * That is the one part of this form that could not be a plain number box. A
 * creature does not *store* its attributes: it stores which one is its main and
 * which its second, and a flat `bonus` per attribute, and the curve does the
 * rest (base 4, the +2 and +1 at level 1, one more on each at every odd level
 * after). Type 8 into a box and the honest question is 8 *at what level*.
 *
 * So the panel prints the whole sum, column by column, and the editable cell is
 * the total at the level the creature is written at. Typing there solves back
 * for the bonus, which is the only field that is really the creature's own.
 * Nobody is stuck at 4 and nobody has to work out what a -3 means: the main stat
 * is marked, its climb is a column of its own, and the number it reaches at
 * level 12 is printed beside it.
 *
 * -------------------------------------------------------- what it can learn
 * "It should be able to learn any ability the player can use." The picker is the
 * whole card registry, less the basic actions every body on the board already
 * has. See `forgeableCards`.
 *
 * ---------------------------------------------------------------- the scopes
 * An admin can publish into the bestiary everybody reads; everybody else forges
 * onto their own shelf, against a slot count. Both halves are enforced in
 * supabase/schema.sql, and what this shows is only what it offers.
 */

/**
 * What a card costs, in a line rather than in orbs.
 *
 * The printed cost, read straight off the card. `cardCost` is the one that
 * reasons about discounts and it wants a character to reason against; a picker
 * has none, and the price a creature will pay is the printed one anyway.
 */
function priceOf(card) {
  const parts = [];
  const ap = Number(card?.ap_cost ?? card?.ap);
  const wp = Number(card?.wp_cost ?? card?.wp);
  if (Number.isFinite(ap) && ap > 0) parts.push(`${ap} AP`);
  if (Number.isFinite(wp) && wp > 0) parts.push(`${wp} WP`);
  return parts.length > 0 ? parts.join(' · ') : 'No cost';
}

/** The one line under a card's name on a shelf: what it gives you. The card's
    own summary, which is what every brief on the site prints. */
function gistOf(card) {
  return card?.summary || card?.type_line || (card?.tags ?? []).join(' · ');
}

/** A body straight off a hydrated creature: the stored fields and no provenance.
    A forged creature carries `id`, `row`, `scope` and resolved cards, none of
    which belong in the thing being edited. */
function bodyOf(creature) {
  return normalizeBody({
    ...creature,
    cards: (creature?.cards ?? []).map((card) => (typeof card === 'string' ? card : card.id)),
  });
}

/** A type line cut into its two halves, for the two controls that write it. */
function splitType(type) {
  const words = String(type ?? '').trim().split(' ');
  const size = FORGED_SIZES.includes(words[0]) ? words[0] : 'Medium';
  const kind = (FORGED_SIZES.includes(words[0]) ? words.slice(1) : words).join(' ');
  return { size, kind: kind || 'Beast' };
}

export default function CreatureForge({
  creature = null,
  canPublish = false,
  userId,
  onSaved,
  onDeleted,
  onClose,
}) {
  const [body, setBody] = useState(() => (creature ? bodyOf(creature) : blankBody()));
  const [scope, setScope] = useState(() => (creature?.scope === 'codex' ? 'codex' : 'personal'));
  const [picking, setPicking] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  const rank = getRank(body.rank);
  const type = splitType(body.type);

  /* Both readouts, worked out on every keystroke. The written level is what the
     page says it is; level 12 is where the curve puts it, and it is printed
     beside the other because a creature built at level 3 that turns out to be a
     14 Physique at the top is a thing to find out here rather than mid-fight. */
  const now = creatureStats(body, body.level);
  const top = creatureStats(body, CREATURE_MAX_LEVEL);

  /* What each attribute would be with no bonus at all: base 4, plus the level 1
     grant, plus the odd-level climbs. The editable total is solved against this,
     so the reader types the number they want and the bonus follows. */
  const curve = creatureAttributes({ ...body, bonus: {} }, body.level);

  function set(patch) {
    setNote(null);
    setBody((held) => ({ ...held, ...patch }));
  }

  /** A nested coefficient: `health.perLevel` and its five siblings. */
  function setIn(group, key, value) {
    setNote(null);
    setBody((held) => ({ ...held, [group]: { ...held[group], [key]: value } }));
  }

  /**
   * The rank, and the two pools that come with it.
   *
   * A rank is not only a label: it sets the clock (six Action Points, or an
   * Overlord's twelve) and whether reactions are possible at all. Anybody who
   * has not moved those off the rank's own numbers gets the new rank's, and
   * anybody who has typed their own keeps them. A Minion's Reaction Points are
   * forced to zero by `creatureStats` whatever is stored, so the field goes
   * quiet rather than lying about what it will do.
   */
  function setRank(next) {
    const was = getRank(body.rank);
    set({
      rank: next.id,
      ap_max: body.ap_max === was.ap ? next.ap : body.ap_max,
      reaction_max: body.reaction_max === was.reaction ? next.reaction : body.reaction_max,
    });
  }

  /**
   * Which attribute it is built on.
   *
   * The two can never be the same one: the curve hands the +2 and the +1 to two
   * different attributes, exactly as a character's level 1 does, and a creature
   * naming one twice would silently lose the +1. So picking a main that is
   * already the second swaps them rather than refusing the click.
   */
  function setMain(key) {
    set({ primary: key, secondary: body.secondary === key ? body.primary : body.secondary });
  }

  function setSecond(key) {
    set({ secondary: key, primary: body.primary === key ? body.secondary : body.primary });
  }

  /** The total this attribute should read at the written level, solved back into
      the one number that is really the creature's own. */
  function setAttribute(key, value) {
    const want = Number(value);
    if (!Number.isFinite(want)) return;
    setNote(null);
    setBody((held) => ({
      ...held,
      bonus: { ...held.bonus, [key]: Math.round(want) - curve[key] },
    }));
  }

  function dropCard(id) {
    set({ cards: body.cards.filter((held) => held !== id) });
  }

  async function save() {
    const named = body.name.trim();
    if (!named) {
      setNote({ tone: 'error', text: 'Give it a name first.' });
      return;
    }

    setBusy(true);
    setNote(null);
    try {
      const row = creature
        ? await updateForgedCreature(creature.row, body, canPublish ? scope : null)
        : await createForgedCreature(userId, body, canPublish ? scope : 'personal');
      onSaved(row);
    } catch (err) {
      setNote({ tone: 'error', text: err.message });
      setBusy(false);
    }
  }

  async function drop() {
    setBusy(true);
    try {
      await deleteForgedCreature(creature.row);
      onDeleted(creature);
    } catch (err) {
      setNote({ tone: 'error', text: err.message });
      setBusy(false);
      setDropping(false);
    }
  }

  return (
    <Modal
      title={creature ? `Edit: ${creature.name}` : 'Forge a creature'}
      onClose={onClose}
      size="page"
      accent="var(--rank-general)"
      footer={
        <>
          {note && (
            <span className={`pick-line${note.tone === 'error' ? ' forge-error' : ''}`}>{note.text}</span>
          )}
          {!note && (
            <span className="pick-line">
              {difficultyLine(body, body.level)} · {body.type}
            </span>
          )}
          <span className="spacer" />

          {creature && (
            <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => setDropping(true)}>
              Remove
            </button>
          )}
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-copper btn-sm"
            disabled={busy || !body.name.trim()}
            onClick={save}
          >
            {creature ? 'Save' : 'Forge it'}
          </button>
        </>
      }
    >
      {/* Six panels in two columns, and the order is the grid's rather than the
          reading order you might expect: what it is, then the page it will
          print, because the readout is what you watch while you tune the rest.
          The attribute sum spans both columns (its table is seven wide), so it
          has to sit on a row of its own or the grid leaves a hole beside it. */}
      <div className="forge-grid">
        {/* ---------------------------------------------------- WHAT IT IS */}
        <section className="camp-panel forge-panel">
          <h3 className="camp-panel-title">What it is</h3>

          <div className="form-group">
            <label className="form-label" htmlFor="forge-name">
              Name
            </label>
            <input
              className="form-input"
              id="forge-name"
              value={body.name}
              maxLength={FORGED_NAME_MAX}
              placeholder="Bogwood Revenant"
              onChange={(event) => set({ name: event.target.value })}
            />
          </div>

          <div className="forge-row">
            <div className="form-group">
              <label className="form-label" htmlFor="forge-size">
                Size
              </label>
              <select
                className="form-input"
                id="forge-size"
                value={type.size}
                onChange={(event) => set({ type: `${event.target.value} ${type.kind}` })}
              >
                {FORGED_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="forge-kind">
                Kind
              </label>
              <input
                className="form-input"
                id="forge-kind"
                list="forge-kinds"
                value={type.kind}
                onChange={(event) => set({ type: `${type.size} ${event.target.value}` })}
              />
              <datalist id="forge-kinds">
                {FORGED_KINDS.map((kind) => (
                  <option key={kind} value={kind} />
                ))}
              </datalist>
            </div>
          </div>

          {/* The rank, as the three it is. A rank is what sets the two point
              pools and the one rule about them, so it reads as a choice between
              three kinds of enemy rather than as a dropdown of words. */}
          <div className="form-group">
            <span className="form-label">Rank</span>
            <div className="foe-filter">
              {RANKS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`foe-filter-btn${body.rank === entry.id ? ' is-on' : ''}`}
                  style={{ '--rank-tone': entry.color }}
                  onClick={() => setRank(entry)}
                  title={entry.blurb}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <p className="forge-hint">{rank.blurb}</p>
          </div>

          <div className="forge-row">
            <Nudge
              label="Written at level"
              value={body.level}
              min={1}
              max={CREATURE_MAX_LEVEL}
              step={1}
              dp={0}
              onChange={(value) => set({ level: clampCreatureLevel(value) })}
              hint="Only a default. An encounter sets its own."
            />
            <Nudge
              label={FORGED_FIELDS.xp.label}
              value={body.xp}
              {...FORGED_FIELDS.xp}
              onChange={(value) => set({ xp: value })}
              hint={`${now.xp} XP at level ${body.level}.`}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="forge-art">
              Picture
            </label>
            <input
              className="form-input"
              id="forge-art"
              value={body.portrait_url ?? ''}
              placeholder="https://… a link to an image"
              onChange={(event) => set({ portrait_url: event.target.value || null })}
            />
          </div>
        </section>

        {/* ---------------------------------------------------- THE READOUT */}
        <section className="camp-panel forge-panel forge-readout">
          <h3 className="camp-panel-title">The page it will print</h3>

          <div className="forge-sheet">
            <span className="forge-sheet-name">{body.name.trim() || 'Unnamed Creature'}</span>
            <span className="forge-sheet-line">
              {body.type} · {difficultyLine(body, body.level)}
            </span>
          </div>

          <div className="forge-scroll">
            <table className="forge-numbers">
              <thead>
                <tr>
                  <th scope="col">&nbsp;</th>
                  <th scope="col">At {body.level}</th>
                  <th scope="col">At 12</th>
                </tr>
              </thead>
              <tbody>
                <Line label="Defense" a={now.avoid} b={top.avoid} />
                <Line label="Armor" a={now.defense} b={top.defense} />
                <Line label="Health" a={`${now.health_max} (${now.hit_die})`} b={`${top.health_max} (${top.hit_die})`} />
                <Line label="Shield cap" a={now.shield_cap} b={top.shield_cap} />
                <Line label="Willpower" a={now.willpower_max} b={top.willpower_max} />
                <Line label="Action Points" a={now.ap_max} b={top.ap_max} />
                <Line label="Reaction Points" a={now.reaction_max} b={top.reaction_max} />
                <Line label="Initiative" a={`+${now.initiative}`} b={`+${top.initiative}`} />
                <Line label="Reflex" a={now.reflex} b={top.reflex} />
                <Line label="Grit" a={now.grit} b={top.grit} />
                <Line label="Speed" a={`${now.speed_m} m`} b={`${top.speed_m} m`} />
                <Line label="XP" a={now.xp} b={top.xp} />
              </tbody>
            </table>
          </div>

          {/* Publishing, for the one tier that can. A radio pair rather than a
              checkbox: "mine" and "everybody's" are two answers to one question,
              and a checkbox called "shared" would leave the other unnamed. */}
          {canPublish && (
            <div className="form-group forge-scope">
              <span className="form-label">Whose shelf</span>
              {[
                ['personal', 'Mine', 'On your own shelf, against your own slots.'],
                ['codex', 'Everybody’s', 'Published into the bestiary every account reads.'],
              ].map(([id, label, blurb]) => (
                <label key={id} className={`forge-scope-row${scope === id ? ' is-on' : ''}`}>
                  <input
                    type="radio"
                    name="forge-scope"
                    checked={scope === id}
                    onChange={() => setScope(id)}
                  />
                  <span>
                    <b>{label}</b>
                    <span className="forge-hint">{blurb}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>
        {/* ------------------------------------------------ THE ATTRIBUTES */}
        <section className="camp-panel forge-panel forge-panel-wide">
          <h3 className="camp-panel-title">The three attributes</h3>

          <p className="forge-hint">
            Every body on the board starts each attribute at <b>4</b>. Its main takes a{' '}
            <b>+2</b> at level 1 and one more at every odd level after, its second takes a{' '}
            <b>+1</b> on the same clock, and the third never moves. The only number that is this
            creature&rsquo;s own is the last column, and you set it by typing what it should read{' '}
            <b>now</b>.
          </p>

          {/* Seven columns, and on a phone they do not fit. The table scrolls
              inside its own box rather than pushing the dialog sideways, which
              is the rule every wide thing on the site keeps. */}
          <div className="forge-scroll">
            <table className="forge-attrs">
              <thead>
                <tr>
                  <th scope="col">Attribute</th>
                  <th scope="col">Base</th>
                  <th scope="col">Grant</th>
                  <th scope="col">Climb</th>
                  <th scope="col">Its own</th>
                  <th scope="col">At {body.level}</th>
                  <th scope="col">At 12</th>
                </tr>
              </thead>
              <tbody>
                {ATTRIBUTES.map(({ key, label, color }) => {
                  const isMain = body.primary === key;
                  const isSecond = body.secondary === key;
                  /* The level 1 grant and the odd-level climbs, told apart so the
                     two halves of "which stat gets increased as main" are both
                     visible: the +2 is why it starts higher, the climb is why it
                     ends higher. */
                  const grant = isMain ? 2 : isSecond ? 1 : 0;
                  const climb = curve[key] - 4 - grant;
                  const own = body.bonus[key] ?? 0;

                  return (
                    <tr key={key} className={isMain ? 'is-main' : isSecond ? 'is-second' : ''}>
                      <th scope="row" style={{ color }}>
                        {label}
                        {isMain && <span className="forge-mark">main</span>}
                        {isSecond && <span className="forge-mark is-second">second</span>}
                      </th>
                      <td>4</td>
                      <td>{grant > 0 ? `+${grant}` : '—'}</td>
                      <td>{climb > 0 ? `+${climb}` : '—'}</td>
                      <td className={own === 0 ? 'is-flat' : own > 0 ? 'is-up' : 'is-down'}>
                        {own > 0 ? `+${own}` : own === 0 ? '—' : own}
                      </td>
                      <td>
                        <input
                          className="form-input forge-cell"
                          type="number"
                          value={now.attributes[key]}
                          aria-label={`${label} at level ${body.level}`}
                          onChange={(event) => setAttribute(key, event.target.value)}
                        />
                      </td>
                      <td className="forge-top">{top.attributes[key]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="forge-row">
            <div className="form-group">
              <label className="form-label" htmlFor="forge-main">
                Main attribute
              </label>
              <select
                className="form-input"
                id="forge-main"
                value={body.primary}
                onChange={(event) => setMain(event.target.value)}
              >
                {ATTRIBUTES.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="forge-second">
                Second
              </label>
              <select
                className="form-input"
                id="forge-second"
                value={body.secondary}
                onChange={(event) => setSecond(event.target.value)}
              >
                {ATTRIBUTES.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="forge-hint">
            A main with <b>+1</b> of its own reaches <b>12</b> at level 12, which is the ceiling a
            character without a lineage never quite touches. More than that is a deliberate monster.
          </p>
        </section>

        {/* -------------------------------------------- WHAT IT CAN TAKE */}
        <section className="camp-panel forge-panel">
          <h3 className="camp-panel-title">What it can take</h3>

          <div className="forge-row">
            <Nudge
              label={FORGED_FIELDS['health.perLevel'].label}
              value={body.health.perLevel}
              {...FORGED_FIELDS['health.perLevel']}
              onChange={(value) => setIn('health', 'perLevel', value)}
            />
            <Nudge
              label={FORGED_FIELDS['health.perPhysique'].label}
              value={body.health.perPhysique}
              {...FORGED_FIELDS['health.perPhysique']}
              onChange={(value) => setIn('health', 'perPhysique', value)}
            />
          </div>
          <p className="forge-hint">
            <b>
              {now.health_max} Health ({now.hit_die})
            </b>{' '}
            at level {body.level}, and <b>{top.health_max}</b> at 12. A character is 10 a level and
            10 a Physique. The hit die count is worked out to average the Health beside it.
          </p>

          <div className="form-group">
            <span className="form-label">Hit die</span>
            <div className="foe-filter">
              {FORGED_DICE.map((faces) => (
                <button
                  key={faces}
                  type="button"
                  className={`foe-filter-btn${body.die === faces ? ' is-on' : ''}`}
                  onClick={() => set({ die: faces })}
                >
                  d{faces}
                </button>
              ))}
            </div>
          </div>

          <div className="forge-row">
            <Nudge
              label={FORGED_FIELDS['willpower.perLevel'].label}
              value={body.willpower.perLevel}
              {...FORGED_FIELDS['willpower.perLevel']}
              onChange={(value) => setIn('willpower', 'perLevel', value)}
            />
            <Nudge
              label={FORGED_FIELDS['willpower.perMind'].label}
              value={body.willpower.perMind}
              {...FORGED_FIELDS['willpower.perMind']}
              onChange={(value) => setIn('willpower', 'perMind', value)}
            />
            <Nudge
              label={FORGED_FIELDS['willpower.flat'].label}
              value={body.willpower.flat}
              {...FORGED_FIELDS['willpower.flat']}
              onChange={(value) => setIn('willpower', 'flat', value)}
            />
          </div>
          <p className="forge-hint">
            <b>{now.willpower_max} Willpower</b> at level {body.level}, and <b>{top.willpower_max}</b>{' '}
            at 12. A character is 2, 2 and a flat 10. Nothing it knows can be cast at zero.
          </p>

          <div className="forge-row">
            <Nudge
              label={FORGED_FIELDS.avoid_bonus.label}
              value={body.avoid_bonus}
              {...FORGED_FIELDS.avoid_bonus}
              onChange={(value) => set({ avoid_bonus: value })}
              hint={`Defense ${now.avoid}: how hard it is to hit.`}
            />
            <Nudge
              label={FORGED_FIELDS.armor.label}
              value={body.armor}
              {...FORGED_FIELDS.armor}
              onChange={(value) => set({ armor: value })}
              hint="Flat reduction, after a hit lands."
            />
            <Nudge
              label={FORGED_FIELDS.speed_m.label}
              value={body.speed_m}
              {...FORGED_FIELDS.speed_m}
              onChange={(value) => set({ speed_m: value })}
              hint="Printed, not scaled."
            />
          </div>

          <div className="forge-row">
            <Nudge
              label={FORGED_FIELDS.ap_max.label}
              value={body.ap_max}
              {...FORGED_FIELDS.ap_max}
              onChange={(value) => set({ ap_max: value })}
              hint={`The rank's own is ${rank.ap}.`}
            />
            <Nudge
              label={FORGED_FIELDS.reaction_max.label}
              value={body.reaction_max}
              {...FORGED_FIELDS.reaction_max}
              disabled={!rank.reacts}
              onChange={(value) => set({ reaction_max: value })}
              hint={
                rank.reacts
                  ? `The rank's own is ${rank.reaction}.`
                  : 'A Minion cannot take reactions and can never be given any.'
              }
            />
          </div>
        </section>

        {/* ------------------------------------------------ WHAT IT KNOWS */}
        <section className="camp-panel forge-panel">
          <h3 className="camp-panel-title">What it knows</h3>

          <p className="forge-hint">
            Anything a character can play, and anything off another creature&rsquo;s page. A card
            that costs nothing lands in its passives and a card with a price lands on its bar. The
            basic actions are already on every bar, so they are not offered here.
          </p>

          {body.cards.length === 0 && <p className="forge-empty">Nothing yet. It will still move, hide and shove.</p>}

          {body.cards.length > 0 && (
            <ul className="forge-cards">
              {body.cards.map((id) => (
                <ForgeCardRow key={id} id={id} onDrop={() => dropCard(id)} />
              ))}
            </ul>
          )}

          <button
            type="button"
            className="btn btn-minimal btn-sm"
            disabled={body.cards.length >= FORGED_CARDS_MAX}
            onClick={() => setPicking(true)}
          >
            {body.cards.length >= FORGED_CARDS_MAX
              ? `Full at ${FORGED_CARDS_MAX} cards`
              : 'Teach it something'}
          </button>
        </section>

        {/* ------------------------------------------------------- THE LORE */}
        <section className="camp-panel forge-panel forge-panel-wide">
          <h3 className="camp-panel-title">Lore</h3>
          <p className="forge-hint">
            The paragraph behind the <b>i</b> on its block. What it is, and why the party is about
            to meet one.
          </p>
          <textarea
            className="form-input forge-lore"
            value={body.lore}
            maxLength={FORGED_LORE_MAX}
            rows={5}
            placeholder="It was a stand of bogwood once, and it has not forgiven the road."
            onChange={(event) => set({ lore: event.target.value })}
          />
        </section>

      </div>

      {picking && (
        <CardShelf
          held={body.cards}
          room={FORGED_CARDS_MAX - body.cards.length}
          onTake={(id) => set({ cards: [...body.cards, id] })}
          onDrop={dropCard}
          onClose={() => setPicking(false)}
        />
      )}

      {dropping && (
        <Modal
          title={`Remove: ${creature?.name ?? 'this creature'}`}
          onClose={() => setDropping(false)}
          footer={
            <>
              <button type="button" className="btn btn-minimal btn-sm" onClick={() => setDropping(false)}>
                Keep it
              </button>
              <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={drop}>
                Remove
              </button>
            </>
          }
        >
          <p className="pick-lead">
            It leaves the shelf for good, and its slot comes back. Any encounter holding one loses
            that enemy the next time it is opened.
          </p>
        </Modal>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ the parts */

/** One row of the readout: what it is called, and what it is at both levels. */
function Line({ label, a, b }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{a}</td>
      <td className="forge-top">{b}</td>
    </tr>
  );
}

/**
 * A number with two steps beside it.
 *
 * Typed as well as nudged, because a Willpower flat of 40 is four presses of the
 * wrong control. The box is left alone while it is being typed in and cleaned on
 * the way out, so a half-typed "1." is not rewritten to 1 under the cursor.
 */
function Nudge({ label, value, min, max, step = 1, dp = 0, hint = null, disabled = false, onChange }) {
  const [typed, setTyped] = useState(null);
  const factor = 10 ** dp;
  const hold = (n) => Math.min(max, Math.max(min, Math.round(n * factor) / factor));

  return (
    <div className={`form-group forge-nudge${disabled ? ' is-off' : ''}`}>
      <span className="form-label">{label}</span>
      <span className="forge-nudge-row">
        <button
          type="button"
          className="foe-level-step"
          disabled={disabled || value <= min}
          onClick={() => onChange(hold(value - step))}
          aria-label={`${label}, less`}
        >
          &minus;
        </button>
        <input
          className="form-input forge-cell"
          type="number"
          value={typed ?? value}
          disabled={disabled}
          aria-label={label}
          onChange={(event) => setTyped(event.target.value)}
          onBlur={() => {
            if (typed !== null) {
              const n = Number(typed);
              if (Number.isFinite(n)) onChange(hold(n));
              setTyped(null);
            }
          }}
        />
        <button
          type="button"
          className="foe-level-step"
          disabled={disabled || value >= max}
          onClick={() => onChange(hold(value + step))}
          aria-label={`${label}, more`}
        >
          +
        </button>
      </span>
      {hint && <span className="forge-hint">{hint}</span>}
    </div>
  );
}

/** One card the creature holds, with the way to take it back off. */
function ForgeCardRow({ id, onDrop }) {
  const stack = useCardStack();
  const card = getCard(id);
  if (!card) return null;

  return (
    <li className="forge-card-row">
      <button
        type="button"
        className="forge-card-open"
        onClick={() => stack?.openCard(card)}
        title="Open the card"
      >
        <span className="forge-card-name">{card.name}</span>
        <span className="forge-card-line">
          {priceOf(card)} · {gistOf(card)}
        </span>
      </button>
      <button type="button" className="foe-drop" onClick={onDrop} title={`Take ${card.name} back off`}>
        Drop
      </button>
    </li>
  );
}

/**
 * The whole registry, as a shelf you browse.
 *
 * A shelf rather than a wall of card faces, and the width rule says so: nearly
 * five hundred cards at their real footprint is a scroll nobody finishes. The
 * rows are searchable by what a card says and chippable by what it is, which is
 * the same filter the Abilities tab uses, and a row opens the card itself on the
 * stack for anybody who wants to read one before teaching it.
 *
 * Only the first `SHELF_PAGE` matches are drawn. The honest alternative is
 * rendering all of them, and a picker that takes a second to answer a keystroke
 * is a picker people stop typing into.
 */
const SHELF_PAGE = 60;

function CardShelf({ held, room, onTake, onDrop, onClose }) {
  const stack = useCardStack();
  const cards = useMemo(() => forgeableCards(), []);

  const tags = useMemo(() => {
    const seen = new Map();
    for (const card of cards) {
      for (const tag of card.tags ?? []) {
        if (!seen.has(tag)) seen.set(tag, { id: tag, label: tag, kind: 'tag' });
      }
    }
    return [...seen.values()].sort((a, b) => compareTags(a.label, b.label));
  }, [cards]);

  const filter = useTagFilter(tags, { searchable: true });

  const found = cards.filter(
    (card) =>
      filter.matches(card.tags) &&
      filter.text(card.name, card.summary, (card.tags ?? []).join(' '), (card.damage ?? []).join(' '))
  );
  const shown = found.slice(0, SHELF_PAGE);

  return (
    <Modal
      title="Teach it something"
      onClose={onClose}
      size="page"
      footer={
        <span className="pick-line">
          {room > 0 ? `Room for ${room} more.` : 'It knows as much as one creature may.'}
        </span>
      }
    >
      <TagFilter filter={filter} count={found.length} noun="card" placeholder="Search every card" />

      <div className="foe-shelf">
        {shown.map((card) => {
          const has = held.includes(card.id);

          return (
            <div key={card.id} className={`foe-shelf-row${has ? ' is-held' : ''}`}>
              <span className="foe-shelf-body">
                <span className="foe-shelf-name">
                  <button type="button" className="forge-card-open" onClick={() => stack?.openCard(card)}>
                    {card.name}
                  </button>
                  {has && <span className="foe-shelf-have">it knows this</span>}
                </span>
                <span className="foe-shelf-line">
                  {priceOf(card)} · {gistOf(card)}
                </span>
                <span className="foe-shelf-line forge-chips">
                  {(card.tags ?? []).slice(0, 4).map((tag) => (
                    <span key={tag} className="foe-chip" style={tagStyle(tag)}>
                      {tag}
                    </span>
                  ))}
                </span>
              </span>

              <span className="foe-shelf-adds">
                {has ? (
                  <button type="button" className="foe-drop" onClick={() => onDrop(card.id)}>
                    Drop
                  </button>
                ) : (
                  <button
                    type="button"
                    className="minion-step is-up"
                    disabled={room <= 0}
                    onClick={() => onTake(card.id)}
                    title={`Teach it ${card.name}`}
                  >
                    Learn
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {found.length > shown.length && (
        <p className="forge-hint">
          {found.length - shown.length} more match. Narrow the search to reach them.
        </p>
      )}
      {found.length === 0 && <p className="forge-empty">Nothing in the codex answers that.</p>}
    </Modal>
  );
}
