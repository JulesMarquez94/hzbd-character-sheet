import { Link } from 'react-router-dom';
import {
  AttrTile,
  CoinIcon,
  CrateIcon,
  KarmaPill,
  PointPool,
  ResourceBar,
  SkullIcon,
  StatBox,
} from '../sheet/parts.jsx';
import { ATTRIBUTES } from '../../lib/attributes.js';
import {
  compactNumber,
  formatNumber,
  healthState,
  initialsOf,
  karmaCap,
  metersToFeet,
  shieldCapFor,
  xpProgress,
} from '../../lib/characterModel.js';

/**
 * One member of the party, at a glance: everything the Character tab spreads
 * over blocks 1 and 2, in a single cell that does not scroll.
 *
 * ------------------------------------------------------------- the compaction
 * Two blocks' worth of rows do not fit 640px at the sheet's own spacing, and
 * the answer is not a scrollbar: a party overview is read by glancing across
 * it, and a number you have to scroll to find is a number you will not check.
 * So the same readouts are laid out tighter, in three ways, and nothing is
 * dropped:
 *
 *   the rows lie down   Health, Shield, Willpower and the two point pools put
 *                       their label beside the bar rather than above it. One
 *                       label column for all five, so every track and every
 *                       pip row starts at the same place.
 *   the headings go     "Attributes", "Combat Stats" and "Defenses" were three
 *                       lines naming nine tiles that each name themselves. On
 *                       the sheet they separate blocks; here they would be a
 *                       third of the tile grid spent on words.
 *   the purse is a chip Experience is a thin bar and the two purses are two
 *                       chips, where the sheet gives each of the three a panel.
 *
 * What is *not* traded is which numbers these are. The tiles, the bars and the
 * pips are the sheet's own parts, off the sheet's own `liveCharacter` and
 * `statMath`, so a Grit here is the same Grit and a hovered tile prints the
 * same arithmetic. See src/pages/Campaigns.css for the measurements.
 *
 * Everything here is a readout. The sheet stays the only writer of its own
 * numbers, so no bar opens a ledger, no pip moves and the name is the way to
 * the sheet itself.
 *
 * `math` is worked out by the page beside `liveCharacter`, one pass per member
 * rather than one per render of this block.
 */

/* The nine tiles, in the sheet's own order. Same trap, same note: `avoid`
   prints as "Defense" (hard to hit) and `defense` prints as "Armor" (flat
   reduction), because the columns predate the relabel. */
const TOP_LINE = [
  {
    key: 'initiative',
    label: 'Initiative',
    color: 'var(--stat-init)',
    info: 'Added to their roll when rolling for turn order in combat.',
  },
  {
    key: 'speed_m',
    label: 'Speed',
    color: 'var(--stat-speed)',
    info: 'How far they move with the Move action, or how far they jump with the Jump action.',
    kind: 'speed',
  },
  {
    key: 'defense',
    label: 'Armor',
    color: 'var(--stat-armor)',
    info: 'Reduces incoming damage by a flat amount.',
  },
];

const DEFENSE_LINE = [
  {
    key: 'avoid',
    label: 'Defense',
    color: 'var(--focus-cyan)',
    info: 'How difficult they are to hit with an attack.',
  },
  {
    key: 'reflex',
    label: 'Reflex',
    color: 'var(--stat-rp)',
    info: 'How reactive they are to danger. Physique + Instinct.',
  },
  {
    key: 'grit',
    label: 'Grit',
    color: 'var(--stat-wp)',
    info: 'How well they withstand afflictions. Instinct + Mind.',
  },
];

const STILL = () => {};

export default function PartyBlock({ character, math = {}, unit = 'metric' }) {
  const xp = xpProgress(character.xp);
  const hp = healthState(character.health, character.health_max);
  const shieldMax = shieldCapFor(character);

  return (
    <div className="party-block">
      {/* ---------- WHO ---------- */}
      <div className="party-id">
        <Link
          to={`/characters/${character.id}`}
          className="party-portrait"
          title={`Open ${character.name}'s sheet`}
        >
          {character.portrait_url ? (
            <img src={character.portrait_url} alt="" />
          ) : (
            <span className="party-initials">{initialsOf(character.name)}</span>
          )}
        </Link>

        <span className="party-name">
          {hp.dead && (
            <span className="dead-mark" title="Dead" aria-label="Dead">
              <SkullIcon />
            </span>
          )}
          <Link to={`/characters/${character.id}`}>{character.name}</Link>
        </span>

        <span className="party-level">
          Lvl {String(xp.level).padStart(2, '0')}
          {xp.isMax && <span className="id-level-cap">MAX</span>}
        </span>
      </div>

      {/* ---------- EXPERIENCE ----------
          A bar and its numbers on one line. The sheet gives this a panel of
          its own because the ledger opens off it; nothing opens off this one. */}
      <div className="party-xp">
        <span className="party-strip-label">XP</span>
        <span className="bar-track">
          <span className="bar-fill bar-fill-xp" style={{ width: `${xp.percent}%` }} />
        </span>
        <span className="party-xp-num" style={{ color: 'var(--haze-glow)' }}>
          {xp.isMax
            ? `${compactNumber(xp.total)}`
            : `${compactNumber(xp.into)} / ${compactNumber(xp.span)}`}
        </span>
      </div>

      {/* ---------- COINS & SUPPLIES ---------- */}
      <div className="party-purses">
        <span className="party-purse">
          <CoinIcon />
          <span className="party-strip-label">Coins</span>
          <span className="party-purse-num" style={{ color: 'var(--stat-coin)' }}>
            {formatNumber(character.wealth)} ¢
          </span>
        </span>

        <span className="party-purse">
          <CrateIcon />
          <span className="party-strip-label">Supplies</span>
          <span className="party-purse-num" style={{ color: 'var(--stat-supply)' }}>
            {formatNumber(character.supplies)}
          </span>
        </span>
      </div>

      {/* ---------- THE NINE TILES ----------
          Attributes, then combat stats, then defenses, in the sheet's own
          order and colours. Each tile names itself, so the three headings that
          separate them on the sheet are not repeated here. */}
      <div className="attr-row">
        {ATTRIBUTES.map(({ key, label, color, info }) => (
          <AttrTile
            key={key}
            label={label}
            color={color}
            info={info}
            math={math[key]}
            value={character[key]}
          />
        ))}
      </div>

      <div className="attr-row">
        {TOP_LINE.map(({ key, label, color, info, kind }) => {
          const isSpeed = kind === 'speed';
          const isImperial = unit === 'imperial';
          const value = isSpeed
            ? isImperial
              ? metersToFeet(character.speed_m)
              : Math.round((Number(character.speed_m) || 0) * 10) / 10
            : Math.floor(Number(character[key]) || 0);

          return (
            <StatBox
              key={key}
              label={label}
              color={color}
              info={info}
              math={math[key]}
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
            info={info}
            math={math[key]}
            value={Math.floor(Number(character[key]) || 0)}
          />
        ))}
      </div>

      {/* ---------- THE FIVE POOLS AND KARMA ----------
          Each label sits beside its bar rather than above it, in one shared
          column, so all five tracks begin at the same place. */}
      <ResourceBar
        label={hp.dead ? 'Health · Dead' : 'Health'}
        current={hp.hp}
        max={hp.cap}
        color="var(--stat-health)"
        poison={hp.poison}
        math={math.health_max}
      />

      <ResourceBar
        label="Shield"
        current={character.shield}
        max={shieldMax}
        color="var(--stat-shield)"
        math={math.shield_cap}
      />

      <ResourceBar
        label="Willpower"
        current={character.willpower}
        max={character.willpower_max}
        color="var(--stat-wp)"
        math={math.willpower_max}
      />

      <PointPool
        label="Action Points"
        current={character.ap}
        max={character.ap_max}
        variant="ap"
        readOnly
        math={math.ap_max}
        onChange={STILL}
      />

      <PointPool
        label="Reaction Points"
        current={character.reaction}
        max={character.reaction_max}
        variant="reaction"
        readOnly
        math={math.reaction_max}
        onChange={STILL}
      />

      <KarmaPill
        karma={character.karma}
        max={karmaCap(character)}
        readOnly
        math={math.karma}
        onChange={STILL}
      />
    </div>
  );
}
