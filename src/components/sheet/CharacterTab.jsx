import { useCallback, useMemo, useState } from 'react';
import ActiveBlock from './ActiveBlock.jsx';
import LedgerModal from './LedgerModal.jsx';
import LoadoutBlock from './LoadoutBlock.jsx';
import PassiveBlock from './PassiveBlock.jsx';
import TurnBlock from './TurnBlock.jsx';
import { AttrTile, CoinIcon, CrateIcon, KarmaPill, PipRow, ResourceBar, SkullIcon, StatBox } from './parts.jsx';
import BlockArrange from './BlockArrange.jsx';
import { CardStackProvider } from '../CardStack.jsx';
import { ATTRIBUTES } from '../../lib/attributes.js';
import {
  formatNumber,
  healthState,
  initialsOf,
  metersToFeet,
  normalizeBlockOrder,
  shieldCapFor,
  xpProgress,
} from '../../lib/characterModel.js';
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
    info: 'How reactive you are to danger — dodging a spell that hurls a boulder at you, or any other sudden threat. Physique + Instinct.',
  },
  {
    key: 'grit',
    label: 'Grit',
    color: 'var(--stat-wp)',
    info: 'How well you withstand afflictions — resisting a poison, or shrugging off a mental attack. Instinct + Mind.',
  },
];

/** Every block is designed now; the list stays for whatever comes next. */
const PLACEHOLDERS = [];

/**
 * What each block is, in words. The arranger shows a list of rows rather than
 * the blocks themselves, so it needs a name for each one, and these are the
 * names the block comments above use.
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

  // Shield's cap isn't its own field — half of health_max, plus worn gear.
  const shieldMax = shieldCapFor(character);

  // Every lib treats the talents column as "only ever a hint" (it can arrive
  // as a JSON string); the tag row must read it through the same repair.
  const talents = normalizeTalents(character.talents);

  // Health is the one pool that runs past zero, and a second full bar of
  // damage past it is fatal.
  const hp = healthState(character.health, character.health_max);

  const order = useMemo(() => normalizeBlockOrder(character.block_order), [
    character.block_order,
  ]);
  const saveOrder = useCallback((next) => patch({ block_order: next }), [patch]);

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

        {/* ---------- XP ---------- */}
        <button
          type="button"
          className="meter meter-xp"
          onClick={() => setLedgerKind('xp')}
          title={readOnly ? 'View the experience log' : 'Open the experience ledger'}
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
          <span className="meter-foot">
            {xp.isMax
              ? 'Level cap reached'
              : `${formatNumber(xp.toNext)} XP to level ${xp.level + 1}`}
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
            title={readOnly ? 'View the wealth log' : 'Open the wealth ledger'}
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
            title={readOnly ? 'View the supply log' : 'Open the supply ledger'}
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
            <AttrTile key={key} label={label} color={color} info={info} value={character[key]} />
          ))}
        </div>
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
              <StatBox key={key} label={label} color={color} info={info} value={value} suffix={suffix} />
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
              value={Math.floor(Number(character[key]) || 0)}
            />
          ))}
        </div>

        {/* ---------- RESOURCES ---------- */}
        <div className="stat-category-label">Resources</div>

        <ResourceBar
          label={hp.dead ? 'Health — Dead' : 'Health'}
          current={hp.hp}
          max={hp.cap}
          color="var(--stat-health)"
          poison={hp.poison}
          onClick={() => setLedgerKind('health')}
          title={readOnly ? 'View the health log' : 'Open the health ledger'}
        />

        <ResourceBar
          label="Shield"
          current={character.shield}
          max={shieldMax}
          color="var(--stat-shield)"
          onClick={() => setLedgerKind('shield')}
          title={readOnly ? 'View the shield log' : 'Open the shield ledger'}
        />

        <ResourceBar
          label="Willpower"
          current={character.willpower}
          max={character.willpower_max}
          color="var(--stat-wp)"
          onClick={() => setLedgerKind('willpower')}
          title={readOnly ? 'View the willpower log' : 'Open the willpower ledger'}
        />

        <div className="pool-row">
          <div className="pool-head">
            <span className="pool-label">
              Action Points
              <span className="pool-count">
                {character.ap}/{character.ap_max}
              </span>
            </span>
          </div>
          <PipRow
            current={character.ap}
            max={character.ap_max}
            variant="ap"
            readOnly={readOnly}
            onChange={(v) => patch({ ap: v })}
          />
        </div>

        <div className="pool-row">
          <div className="pool-head">
            <span className="pool-label">
              Reaction Points
              <span className="pool-count">
                {character.reaction}/{character.reaction_max}
              </span>
            </span>
          </div>
          <PipRow
            current={character.reaction}
            max={character.reaction_max}
            variant="reaction"
            readOnly={readOnly}
            onChange={(v) => patch({ reaction: v })}
          />
        </div>

        <KarmaPill karma={character.karma} readOnly={readOnly} onChange={(v) => patch({ karma: v })} />
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
       The other half: traits, skills and the workings on your gear. Nothing
       here is ever played, so nothing here is ever spent — a tap reads it. */
    5: <PassiveBlock character={character} readOnly={readOnly} />,

    /* ============ BLOCK 6 — TURN & EFFECTS ============
       The only block about the moment rather than the character: whose turn it
       is, and what is still ticking. Starting a turn is the one thing on this
       tab that spends nothing and gives points back. */
    6: <TurnBlock character={character} patch={patch} readOnly={readOnly} />,

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
            className={`sheet-cell${PLACEHOLDERS.includes(id) ? ' cell-empty' : ''}`}
          >
            {blocks[id]}
          </section>
        ))}

        {arranging && (
          <BlockArrange
            order={order}
            describe={(id) => BLOCK_NAMES[id]}
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
