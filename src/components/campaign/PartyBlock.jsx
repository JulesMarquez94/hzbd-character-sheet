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
  formatNumber,
  healthState,
  initialsOf,
  karmaCap,
  metersToFeet,
  shieldCapFor,
  xpProgress,
} from '../../lib/characterModel.js';

/**
 * One member of the party, at a glance: the Character tab's blocks 1 and 2
 * folded into a single block for the campaign Overview.
 *
 * Everything here is a *readout*. The sheet stays the only writer of its own
 * numbers, so the bars have no ledgers behind them, the pips are still and the
 * name is the way to the sheet itself. What earns the block its place is that
 * it is drawn with the sheet's own parts, off the sheet's own maths: a Grit
 * here is the same Grit, in the same box, with the same arithmetic on hover.
 *
 * Takes the character as the sheet would *show* them, off `liveCharacter`, for
 * the same reason the tabs do: a worn enchantment's Instinct is Instinct.
 */

/* The six stat tiles, copied from CharacterTab.jsx so the two can be read
   against each other. Same trap, same note: `avoid` prints as "Defense" (hard
   to hit) and `defense` prints as "Armor" (flat reduction), because the columns
   predate the relabel. */
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

/**
 * `math` is the same hover arithmetic the sheet's own tiles carry, off
 * statMath, so a DM asking "why is their Defense 9" gets the sheet's own
 * answer. It is worked out by the page beside `liveCharacter`, one pass per
 * member rather than one per render of this block.
 */
export default function PartyBlock({ character, math = {}, unit = 'metric' }) {
  const xp = xpProgress(character.xp);
  const hp = healthState(character.health, character.health_max);
  const shieldMax = shieldCapFor(character);

  return (
    <div className="cell-scroll party-block">
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

        <span className="party-id-body">
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
        </span>
      </div>

      {/* ---------- XP ---------- */}
      <div className="meter">
        <span className="meter-head">
          <span className="meter-label">Experience</span>
          <span className="meter-value" style={{ color: 'var(--haze-glow)' }}>
            {xp.isMax
              ? `${formatNumber(xp.total)} XP`
              : `${formatNumber(xp.into)} / ${formatNumber(xp.span)}`}
          </span>
        </span>
        <span className="bar-track">
          <span className="bar-fill bar-fill-xp" style={{ width: `${xp.percent}%` }} />
        </span>
      </div>

      {/* ---------- COINS & SUPPLIES ---------- */}
      <div className="meter-pair">
        <div className="meter meter-tight">
          <span className="meter-label">
            <CoinIcon />
            Coins
          </span>
          <span className="meter-value" style={{ color: 'var(--stat-coin)' }}>
            {formatNumber(character.wealth)} ¢
          </span>
        </div>

        <div className="meter meter-tight">
          <span className="meter-label">
            <CrateIcon />
            Supplies
          </span>
          <span className="meter-value" style={{ color: 'var(--stat-supply)' }}>
            {formatNumber(character.supplies)}
          </span>
        </div>
      </div>

      {/* ---------- ATTRIBUTES ---------- */}
      <div className="stat-category-label">Attributes</div>
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

      {/* ---------- COMBAT STATS ---------- */}
      <div className="stat-category-label">Combat Stats</div>
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

      {/* ---------- AND THE DEFENSES, UNDER THE SAME HEADING ----------
          The minion block's trade, made for the minion block's reason: this
          cell holds what the character spreads over two, and a heading costs
          it the same height as three more tiles would. */}
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

      {/* ---------- RESOURCES ---------- */}
      <div className="stat-category-label">Resources</div>

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
