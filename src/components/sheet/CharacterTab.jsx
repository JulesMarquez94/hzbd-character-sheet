import { useCallback, useMemo, useState } from 'react';
import ActiveBlock from './ActiveBlock.jsx';
import FeralBlock from './FeralBlock.jsx';
import LedgerModal from './LedgerModal.jsx';
import LoadoutBlock from './LoadoutBlock.jsx';
import { MinionActionsBlock, MinionStatsBlock } from './MinionBlock.jsx';
import PassiveBlock from './PassiveBlock.jsx';
import TurnBlock from './TurnBlock.jsx';
import {
  AttrTile,
  BurdenMeter,
  CoinIcon,
  CrateIcon,
  KarmaPill,
  PointPool,
  ResourceBar,
  SkullIcon,
  StatBox,
} from './parts.jsx';
import BlockArrange from './BlockArrange.jsx';
import { CardStackProvider } from '../CardStack.jsx';
import { ATTRIBUTES } from '../../lib/attributes.js';
import {
  formatNumber,
  healthState,
  initialsOf,
  karmaCap,
  liveShift,
  metersToFeet,
  normalizeBlockOrder,
  shieldCapFor,
  xpProgress,
} from '../../lib/characterModel.js';
import { feralBlockIds, feralState } from '../../lib/feral.js';
import { minionBlockIds, minionState } from '../../lib/minions.js';
import { statMath } from '../../lib/statMath.js';
import { normalizeTalents } from '../../lib/talents.js';

/* The three tiles read from the shared codex — label, colour and tooltip alike
   — so this tab and the Advancement tab's chooser can never drift apart on what
   an attribute is for. They are set on the Advancement tab and only shown here. */
const ATTRIBUTE_TILES = ATTRIBUTES;

/*
 * `avoid` and `defense` are legacy column names that predate this relabel —
 * `avoid` is shown as "Defense" (hard to hit) and `defense` is shown as
 * "Armor" (flat reduction). Renaming the columns would need a DB migration,
 * so the mismatch stays and is called out here instead.
 *
 * All six of these are read-only here: they're derived from attributes, gear
 * and temporary effects rather than typed in directly.
 */
const TOP_LINE = [
  {
    key: 'initiative',
    label: 'Initiative',
    color: 'var(--stat-init)',
    info: 'Added to your roll when rolling for turn order in combat.',
  },
  {
    key: 'speed_m',
    label: 'Speed',
    color: 'var(--stat-speed)',
    info: 'How far you move with the Move action, or how far you jump with the Jump action.',
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
    info: 'How difficult you are to hit with an attack.',
  },
  {
    key: 'reflex',
    label: 'Reflex',
    color: 'var(--stat-rp)',
    info: 'How reactive you are to danger: dodging a spell that hurls a boulder at you, or any other sudden threat. Physique + Instinct.',
  },
  {
    key: 'grit',
    label: 'Grit',
    color: 'var(--stat-wp)',
    info: 'How well you withstand afflictions: resisting a poison, or shrugging off a mental attack. Instinct + Mind.',
  },
];

/*
 * Magic Burden is a readout here and nothing else: what fills it is equipped on
 * the Inventory tab and what caps it is set on Advancement. So the explanation
 * goes on hover the way every tile on this tab explains itself, which is also
 * what keeps the panel down to a head and a bar. Block 1 has no room for a foot.
 */
const BURDEN_INFO =
  'How much worked magic you can carry before it starts to weigh. Worn, held, on a trinket or clipped to your belt, it weighs the same wherever you carry it. Capacity is Level + Mind + 10.';

/** Every block is designed now; the list stays for whatever comes next. */
const PLACEHOLDERS = [];

/**
 * What each block is, in words. The arranger shows a list of rows rather than
 * the blocks themselves, so it needs a name for each one, and these are the
 * names the block comments above use.
 *
 * The six are every character's. A talent set that puts a creature on the board
 * adds two more that are not in this table, and one that turns its holder into
 * something adds a third, because all three of those are named after the thing
 * rather than after the block — see `describeBlock` below.
 */
const BLOCK_NAMES = {
  1: { name: 'Identity & Attributes', note: 'Name, lineage, background, the three attributes' },
  2: { name: 'Combat Profile', note: 'Defense, Armor, Reflex, Grit, Initiative, Speed' },
  3: { name: 'Loadout', note: 'What you are holding, and what it lets you do' },
  4: { name: 'Quick Bar', note: 'Everything you can spend points on, in reaching order' },
  5: { name: 'Always On', note: 'The passives you never have to play' },
  6: { name: 'Turn & Effects', note: 'The clock, and what is currently on you' },
};

/**
 * Block 1 is a readout, not a form. Name, lineage, background and the three
 * attributes are set on the Advancement tab or moved by gear and temporary
 * effects — the only things you change from here are XP, coins and supplies,
 * and all three go through a ledger so every movement carries a reason.
 *
 * The blocks themselves are the player's to arrange, from the Arrange blocks
 * button above the grid rather than by dragging them where they sit. The order
 * is stored on the character, so it follows the sheet rather than the browser
 * it was set in. See BlockArrange.jsx for why it is a list and not a drag.
 */
export default function CharacterTab({ character, readOnly = false, patch, unit = 'metric' }) {
  // Which ledger is open: 'xp', 'wealth', 'supplies', 'health', 'shield',
  // 'willpower', or null.
  const [ledgerKind, setLedgerKind] = useState(null);

  // XP is the lifetime total; the table decides what level that buys.
  const xp = xpProgress(character.xp);

  // Shield's cap isn't its own field: a share of health_max plus worn gear, and
  // the share is the whole of it for a Feral Cursed. See shieldCapFor.
  const shieldMax = shieldCapFor(character);

  // Every lib treats the talents column as "only ever a hint" (it can arrive
  // as a JSON string); the tag row must read it through the same repair.
  const talents = normalizeTalents(character.talents);

  // Health is the one pool that runs past zero, and a second full bar of
  // damage past it is fatal.
  const hp = healthState(character.health, character.health_max);

  /* What is on this character for the hour and not on their row. This tab is
     handed the *bent* character (see liveCharacter), so the tiles below already
     show the raised number; this is the sentence that accounts for it. Empty for
     everyone with nothing running, which is nearly everyone. */
  const shift = useMemo(() => liveShift(character), [character]);

  /* And where every number on the tab came from, so a hovered tile can print its
     own arithmetic with each source named. Worked out once for the whole tab
     rather than inside each tile: the enchantments standing on this character,
     what is worn and the level ledger are one read each here and a dozen reads
     each if every tile asks for itself. See statMath.js. */
  const math = useMemo(() => statMath(character), [character]);

  /* The creatures on the board, if any. Two blocks each, and both of them
     movable like the six: "this block can also be moved around, both the 1 and
     2 block, in character page". They arrive when the set is taken and leave
     when it is handed back, so the stored arrangement is matched against what
     actually exists rather than assumed to be six numbers. */
  const minions = useMemo(() => minionState(character), [character]);

  /* And the shapes they can turn into. One block each rather than two: a form
     has no stat block of its own and no turn of its own to spend, so what it
     needs is a picture, a difficulty and three presses. See feral.js. */
  const forms = useMemo(() => feralState(character), [character]);

  const grown = useMemo(
    () => [...minionBlockIds(character), ...feralBlockIds(character)],
    [character]
  );

  const order = useMemo(() => normalizeBlockOrder(character.block_order, grown), [
    character.block_order,
    grown,
  ]);
  const saveOrder = useCallback((next) => patch({ block_order: next }), [patch]);

  /* A row in the arranger. The six have fixed names; a creature's two are named
     after the creature, so an arrangement holding them can still be read at a
     glance. */
  const describeBlock = useCallback(
    (id) => {
      if (BLOCK_NAMES[id]) return BLOCK_NAMES[id];

      const shape = /^feral:(.+)$/.exec(String(id));
      if (shape) {
        const form = forms.find((row) => row.id === shape[1]);
        return form
          ? {
              name: form.title,
              note: `${form.talent.name}: the beast, the difficulty and the change`,
            }
          : { name: String(id), note: null };
      }

      const match = /^minion:([^:]+)(?::(bar))?$/.exec(String(id));
      const minion = match ? minions.find((row) => row.id === match[1]) : null;
      if (!minion) return { name: String(id), note: null };

      return match[2]
        ? {
            name: `${minion.title} · Actions`,
            note: 'Its Action Points, its Reaction Points and its Quick Bar',
          }
        : {
            name: minion.title,
            note: `${minion.spec.label}: attributes, defenses, Health and Shield`,
          };
    },
    [minions, forms]
  );

  /* Arranging happens in a modal rather than on the tab itself. Dragging a
     block where it sits could not work on a phone, where one block fills the
     screen and moving it three places meant a long wait on auto-scroll — and
     the grip that started the drag had to take the touch gesture away from the
     browser, which is half of why this tab was hard to scroll. See the note at
     the top of BlockArrange.jsx. */
  const [arranging, setArranging] = useState(false);

  /* The contents of each block, keyed by the id the order refers to. Only the
     arrangement moves — a block is the same block wherever it lands. */
  const blocks = {
    /* ============ BLOCK 1 — IDENTITY & ATTRIBUTES ============ */
    1: (
      <div className="cell-scroll">
        <div className="id-head">
          <span className="id-name">
            {hp.dead && (
              <span className="dead-mark" title="Dead" aria-label="Dead">
                <SkullIcon />
              </span>
            )}
            {character.name}
          </span>
          <span className="id-level">
            Lvl {String(xp.level).padStart(2, '0')}
            {xp.isMax && <span className="id-level-cap">MAX</span>}
          </span>
        </div>

        <div className="id-portrait">
          {character.portrait_url ? (
            <img src={character.portrait_url} alt="" />
          ) : (
            <span className="id-initials">{initialsOf(character.name)}</span>
          )}
        </div>

        {/* ---------- MAGIC BURDEN ---------- */}
        <BurdenMeter character={character} info={BURDEN_INFO} math={math.burden_used} />

        {/* ---------- XP ---------- */}
        <button
          type="button"
          className="meter meter-xp"
          onClick={() => setLedgerKind('xp')}
          title={readOnly ? 'View the Experience log' : 'Open the Experience ledger'}
        >
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
        </button>

        {/* ---------- COINS & SUPPLIES ----------
            Two purses of the same kind, side by side: what you spend on people,
            and what you spend on the road. Neither has a ceiling and neither is
            typed in — the ledger behind each is the only way it moves. */}
        <div className="meter-pair">
          <button
            type="button"
            className="meter meter-tight"
            onClick={() => setLedgerKind('wealth')}
            title={readOnly ? 'View the Wealth log' : 'Open the Wealth ledger'}
          >
            <span className="meter-label">
              <CoinIcon />
              Coins
            </span>
            <span className="meter-value" style={{ color: 'var(--stat-coin)' }}>
              {formatNumber(character.wealth)} ¢
            </span>
          </button>

          <button
            type="button"
            className="meter meter-tight"
            onClick={() => setLedgerKind('supplies')}
            title={readOnly ? 'View the Supply log' : 'Open the Supply ledger'}
          >
            <span className="meter-label">
              <CrateIcon />
              Supplies
            </span>
            <span className="meter-value" style={{ color: 'var(--stat-supply)' }}>
              {formatNumber(character.supplies)}
            </span>
          </button>
        </div>

        {/* ---------- TAGS ---------- */}
        {(character.lineage || character.background || talents.length > 0) && (
          <div className="id-tags">
            {character.lineage && <span className="tag tag-lineage">{character.lineage}</span>}
            {character.background && (
              <span className="tag tag-background">{character.background}</span>
            )}
            {talents.map((talent, idx) => (
              <span className="tag tag-talent" key={`${talent.name}-${idx}`}>
                {talent.name}
              </span>
            ))}
          </div>
        )}

        {/* ---------- ATTRIBUTES ---------- */}
        <div className="stat-category-label">Attributes</div>
        <div className="attr-row">
          {ATTRIBUTE_TILES.map(({ key, label, color, info }) => (
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

        {/* An Ephemeral Enchantment raises an attribute for an hour and is not
            written on the row, so these three tiles are showing a number the
            Advancement tab does not agree with. Said out loud, because a stat
            nobody can account for is worse than a stat that is merely bent. */}
        {shift.length > 0 && (
          <p className="attr-shift">
            <b>Running:</b> {shift.join(', ')}. On you for the hour, and not on your sheet.
          </p>
        )}
      </div>
    ),

    /* ============ BLOCK 2 — COMBAT PROFILE ============ */
    2: (
      <div className="cell-scroll combat-block">
        {/* ---------- COMBAT STATS ---------- */}
        <div className="stat-category-label">Combat Stats</div>
        <div className="attr-row">
          {TOP_LINE.map(({ key, label, color, info, kind }) => {
            const isSpeed = kind === 'speed';
            const isImperial = unit === 'imperial';
            // Every value here rounds down except Speed, which keeps its
            // precise decimal.
            const value = isSpeed
              ? isImperial
                ? metersToFeet(character.speed_m)
                : Math.round((Number(character.speed_m) || 0) * 10) / 10
              : Math.floor(Number(character[key]) || 0);
            const suffix = isSpeed ? (isImperial ? 'ft' : 'm') : '';

            return (
              <StatBox
                key={key}
                label={label}
                color={color}
                info={info}
                math={math[key]}
                value={value}
                suffix={suffix}
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
              math={math[key]}
              value={Math.floor(Number(character[key]) || 0)}
            />
          ))}
        </div>

        {/* ---------- RESOURCES ---------- */}
        <div className="stat-category-label">Resources</div>

        {/* Each bar's hover carries its *ceiling's* arithmetic. What is in a bar
            right now is whatever the last hit left there and is nobody's sum; the
            number it is read against is bought by a level, an attribute and
            whatever is worked into what you wear. */}
        <ResourceBar
          label={hp.dead ? 'Health · Dead' : 'Health'}
          current={hp.hp}
          max={hp.cap}
          color="var(--stat-health)"
          poison={hp.poison}
          onClick={() => setLedgerKind('health')}
          title={readOnly ? 'View the Health log' : 'Open the Health ledger'}
          math={math.health_max}
        />

        <ResourceBar
          label="Shield"
          current={character.shield}
          max={shieldMax}
          color="var(--stat-shield)"
          onClick={() => setLedgerKind('shield')}
          title={readOnly ? 'View the Shield log' : 'Open the Shield ledger'}
          math={math.shield_cap}
        />

        <ResourceBar
          label="Willpower"
          current={character.willpower}
          max={character.willpower_max}
          color="var(--stat-wp)"
          onClick={() => setLedgerKind('willpower')}
          title={readOnly ? 'View the Willpower log' : 'Open the Willpower ledger'}
          math={math.willpower_max}
        />

        <PointPool
          label="Action Points"
          current={character.ap}
          max={character.ap_max}
          variant="ap"
          readOnly={readOnly}
          math={math.ap_max}
          onChange={(v) => patch({ ap: v })}
        />

        <PointPool
          label="Reaction Points"
          current={character.reaction}
          max={character.reaction_max}
          variant="reaction"
          readOnly={readOnly}
          math={math.reaction_max}
          onChange={(v) => patch({ reaction: v })}
        />

        <KarmaPill
          karma={character.karma}
          max={karmaCap(character)}
          readOnly={readOnly}
          math={math.karma}
          onChange={(v) => patch({ karma: v })}
        />
      </div>
    ),

    /* ============ BLOCK 3 — LOADOUT ============ */
    3: <LoadoutBlock character={character} patch={patch} readOnly={readOnly} />,

    /* ============ BLOCK 4 — QUICK BAR ============
       Everything playable, in one place, at hotbar size: the weapon, the belt,
       what you know, and the basic actions everybody has. Block 3 is where
       a loadout is read; this is where a turn is spent. */
    4: <ActiveBlock character={character} patch={patch} readOnly={readOnly} />,

    /* ============ BLOCK 5 — ALWAYS ON ============
       The other half: traits, skills and the workings on your gear. A tap reads
       a row, and almost nothing here is ever spent. The exception is a working
       that fires once and needs a rest before it fires again, which is why this
       block takes `patch` at all: the firing is the table's to notice, and the
       mark it leaves is the character's. */
    5: <PassiveBlock character={character} patch={patch} readOnly={readOnly} />,

    /* ============ BLOCK 6 — TURN & EFFECTS ============
       The only block about the moment rather than the character: whose turn it
       is, and what is still ticking. Starting a turn is the one thing on this
       tab that spends nothing and gives points back. */
    6: <TurnBlock character={character} patch={patch} readOnly={readOnly} />,

    /* ============ A CREATURE'S TWO ============
       Only there when a set has put one on the board. Same 360x640, same place
       in the order, and the stats block first because that is the order the
       Developpement Notes describe them in. */
    ...Object.fromEntries(
      minions.flatMap((minion) => [
        [
          `minion:${minion.id}`,
          <MinionStatsBlock
            character={character}
            minion={minion}
            patch={patch}
            readOnly={readOnly}
            unit={unit}
          />,
        ],
        [
          `minion:${minion.id}:bar`,
          <MinionActionsBlock
            character={character}
            minion={minion}
            patch={patch}
            readOnly={readOnly}
          />,
        ],
      ])
    ),

    /* ============ A FORM'S ONE ============
       Only there when a set can turn this character into something. Same
       360x640 and the same place in the order as any other block. */
    ...Object.fromEntries(
      forms.map((form) => [
        `feral:${form.id}`,
        <FeralBlock character={character} form={form} patch={patch} readOnly={readOnly} />,
      ])
    ),

    ...Object.fromEntries(
      PLACEHOLDERS.map((n) => [
        n,
        <div className="cell-blank">
          <span className="cell-placeholder">Block {n}</span>
        </div>,
      ])
    ),
  };

  /* Block 3 deals cards for what you are holding, so the pile lives over the
     whole tab — a card opened from a block sits in front of every block. */
  return (
    <CardStackProvider character={character}>
      {!readOnly && (
        <div className="sheet-arrange-bar">
          <button
            type="button"
            className="btn btn-minimal btn-sm"
            onClick={() => setArranging(true)}
          >
            Arrange blocks
          </button>
        </div>
      )}

      <div className="sheet-grid-6">
        {order.map((id) => (
          <section
            key={id}
            className={`sheet-cell${PLACEHOLDERS.includes(id) ? ' cell-empty' : ''}${
              String(id).startsWith('minion:') ? ' cell-minion' : ''
            }${String(id).startsWith('feral:') ? ' cell-feral' : ''}`}
          >
            {blocks[id]}
          </section>
        ))}

        {arranging && (
          <BlockArrange
            order={order}
            describe={describeBlock}
            onChange={saveOrder}
            onClose={() => setArranging(false)}
          />
        )}

        {ledgerKind && (
          <LedgerModal
            kind={ledgerKind}
            character={character}
            patch={patch}
            readOnly={readOnly}
            onClose={() => setLedgerKind(null)}
          />
        )}
      </div>
    </CardStackProvider>
  );
}
