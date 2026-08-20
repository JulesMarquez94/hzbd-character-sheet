import { useEffect, useState } from 'react';
import Modal from '../Modal.jsx';
import {
  LEDGER_NOTE_MAX,
  MAX_LEVEL,
  XP_TABLE,
  appendLedger,
  clamp,
  formatNumber,
  levelForXp,
  newLedgerId,
  readLedger,
  shieldCapFor,
  xpForLevel,
} from '../../lib/characterModel.js';
import { pruneToLevel } from '../../lib/levelPicks.js';

const KINDS = {
  xp: {
    field: 'xp',
    title: 'Experience Ledger',
    noun: 'XP',
    unit: 'XP',
    color: 'var(--haze-glow)',
    placeholder: 'Cleared the drowned vault',
  },
  wealth: {
    field: 'wealth',
    title: 'Wealth Ledger',
    noun: 'coins',
    unit: '¢',
    color: 'var(--stat-coin)',
    placeholder: 'Sold the brass astrolabe',
  },
  // Supplies behave exactly like coins — a running total with no ceiling,
  // moved only by transaction. Spending more than the crate holds empties it
  // and logs the movement as capped, the same way an overspent purse does.
  supplies: {
    field: 'supplies',
    title: 'Supply Ledger',
    noun: 'supplies',
    unit: 'Supplies',
    color: 'var(--stat-supply)',
    placeholder: 'Restocked at the waystation',
  },
  health: {
    field: 'health',
    getMax: (c) => Number(c.health_max) || 0,
    // The only pool that goes below zero: a second full bar of damage past
    // zero is the floor, and reaching it kills the character.
    getMin: (c) => -(Number(c.health_max) || 0),
    title: 'Health Ledger',
    noun: 'health',
    unit: 'HP',
    color: 'var(--stat-health)',
    placeholder: 'Took a hit from the boiler golem',
  },
  shield: {
    field: 'shield',
    // Shield's cap isn't its own field — half of health_max, plus worn gear.
    getMax: (c) => shieldCapFor(c),
    title: 'Shield Ledger',
    noun: 'shield',
    unit: 'SP',
    color: 'var(--stat-shield)',
    placeholder: 'Shield spell absorbed the blast',
  },
  willpower: {
    field: 'willpower',
    getMax: (c) => Number(c.willpower_max) || 0,
    // Willpower is never overdrawn — spending more than is banked stops the
    // transaction with a warning instead of quietly clamping to zero.
    blockOverdraw: true,
    title: 'Willpower Ledger',
    noun: 'willpower',
    unit: 'WP',
    color: 'var(--stat-wp)',
    placeholder: 'Cast Blood Spear',
  },
};

function formatStamp(ts) {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Transaction window for the two running totals. Every change is a signed entry
 * with a short reason attached, so the balance is always explainable — and the
 * balance itself is never editable by hand, only by transaction.
 */
export default function LedgerModal({ kind, character, patch, onClose, readOnly = false }) {
  const config = KINDS[kind];
  const balance = Number(character[config.field]) || 0;

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [alert, setAlert] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [levelWanted, setLevelWanted] = useState('');

  // The alert sits on top of the ledger, so it swallows Escape on the way down
  // rather than letting the whole modal close behind it.
  useEffect(() => {
    if (!alert) return undefined;

    function onKeyDown(e) {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setAlert('');
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [alert]);

  const entries = readLedger(character, kind);

  const maxValue = config.getMax ? config.getMax(character) : null;
  // Everything bottoms out at 0 except health, which can be driven negative.
  const minValue = config.getMin ? config.getMin(character) : 0;

  /**
   * Damage doesn't stop at an empty shield. Whatever the shield can't soak
   * carries straight into health, so 40 through a 30-point shield leaves the
   * shield at 0 and health 10 lower — logged as two entries, one per pool.
   */
  function spillIntoHealth(magnitude) {
    const soaked = Math.max(0, balance);
    const overflow = magnitude - soaked;

    const healthBefore = Number(character.health) || 0;
    const healthFloor = -(Number(character.health_max) || 0);
    const healthAfter = Math.max(healthFloor, healthBefore - overflow);
    const healthDelta = healthAfter - healthBefore;

    if (soaked === 0 && healthDelta === 0) {
      setError('Shield is empty and health is already at the floor.');
      setFlash('');
      return;
    }

    const reason = note.trim().slice(0, LEDGER_NOTE_MAX);
    const ts = new Date().toISOString();

    let ledger = character.ledger;
    if (soaked > 0) {
      ledger = appendLedger(character, {
        id: newLedgerId(),
        ts,
        kind: 'shield',
        delta: -soaked,
        note: reason,
        balance: 0,
      });
    }
    if (healthDelta !== 0) {
      ledger = appendLedger(
        { ledger },
        {
          id: newLedgerId(),
          ts,
          kind: 'health',
          delta: healthDelta,
          note: reason ? `${reason} · past shield`.slice(0, LEDGER_NOTE_MAX) : 'Damage past shield',
          balance: healthAfter,
        }
      );
    }

    patch({ shield: 0, health: healthAfter, ledger });

    setAmount('');
    setNote('');
    setError('');

    const spilled = Math.abs(healthDelta);
    const dead = healthFloor < 0 && healthAfter <= healthFloor;
    setFlash(
      `−${formatNumber(soaked)} SP logged · ${
        spilled ? `−${formatNumber(spilled)} HP through the shield` : 'health already at the floor'
      }${dead ? ' · dead.' : ''}`
    );
  }

  function apply(sign) {
    const magnitude = Math.floor(Math.abs(Number(amount)));

    if (!magnitude) {
      setError('Enter an amount above zero.');
      setFlash('');
      return;
    }

    // Some pools can't be overdrawn at all — spending more than is banked is a
    // mistake at the table, so nothing is logged until the number is fixed.
    if (sign < 0 && config.blockOverdraw && magnitude > balance) {
      setAlert(
        `You only have ${formatNumber(balance)} ${config.unit}, so spending ${formatNumber(
          magnitude
        )} ${config.unit} is not possible.`
      );
      setError('');
      setFlash('');
      return;
    }

    // Shield is the opposite: what it can't absorb rolls into health.
    if (sign < 0 && kind === 'shield' && magnitude > balance) {
      spillIntoHealth(magnitude);
      return;
    }

    // Both ends are hard stops — overshooting either just clamps instead of
    // erroring, the way spending more healing than you're missing quietly caps
    // at full.
    const rawNext = balance + sign * magnitude;
    const next = maxValue !== null ? clamp(rawNext, minValue, maxValue) : Math.max(minValue, rawNext);
    const delta = next - balance;

    if (delta === 0) {
      setError(
        sign > 0
          ? `Already at the ${formatNumber(maxValue)} ${config.unit} cap.`
          : `Already at ${formatNumber(minValue)} ${config.unit}.`
      );
      setFlash('');
      return;
    }

    const partial = {
      [config.field]: next,
      ledger: appendLedger(character, {
        id: newLedgerId(),
        ts: new Date().toISOString(),
        kind,
        delta,
        note: note.trim().slice(0, LEDGER_NOTE_MAX),
        balance: next,
      }),
    };

    // XP owns the level. Crossing a row of the table promotes (or demotes) on
    // the spot rather than waiting for someone to press a button.
    let levelNote = '';
    if (kind === 'xp') {
      const wasLevel = levelForXp(balance);
      const nowLevel = levelForXp(next);
      partial.level = nowLevel;
      partial.xp_max = xpForLevel(nowLevel);

      if (nowLevel > wasLevel) levelNote = `. Advanced to level ${nowLevel}.`;
      else if (nowLevel < wasLevel) {
        // A level lost takes what it bought with it.
        const cut = pruneToLevel(character, nowLevel);
        if (cut) Object.assign(partial, cut.patch);
        levelNote = `. Dropped back to level ${nowLevel}.${cut ? ` ${cut.summary}` : ''}`;
      }
    }

    patch(partial);

    setAmount('');
    setNote('');
    setError('');
    const capped = Math.abs(delta) !== magnitude;
    setFlash(
      `${delta > 0 ? '+' : '−'}${formatNumber(Math.abs(delta))} ${config.unit} logged${
        capped ? ' (capped)' : ''
      }${levelNote}`
    );
  }

  /**
   * Jump straight to a level. XP owns the level, so the only honest way to sit
   * at level 7 is to hold level 7's experience: this works out the difference
   * and logs it as an ordinary entry, so the history still adds up to the
   * balance. A table that hands out levels rather than XP can run the whole
   * campaign from this box.
   */
  function applyLevel() {
    const wanted = Math.floor(Number(levelWanted));

    if (!wanted || wanted < 1 || wanted > MAX_LEVEL) {
      setError(`Enter a level between 1 and ${MAX_LEVEL}.`);
      setFlash('');
      return;
    }

    const target = XP_TABLE[wanted];
    const delta = target - balance;

    if (delta === 0) {
      setError(`Already level ${wanted}, on exactly ${formatNumber(target)} XP.`);
      setFlash('');
      return;
    }

    const reason = note.trim().slice(0, LEDGER_NOTE_MAX) || `Set to level ${wanted}`;

    // Going down gives back everything the levels above bought.
    const cut = wanted < levelForXp(balance) ? pruneToLevel(character, wanted) : null;

    patch({
      xp: target,
      level: wanted,
      xp_max: xpForLevel(wanted),
      ...(cut ? cut.patch : {}),
      ledger: appendLedger(character, {
        id: newLedgerId(),
        ts: new Date().toISOString(),
        kind: 'xp',
        delta,
        note: reason,
        balance: target,
      }),
    });

    setLevelWanted('');
    setAmount('');
    setNote('');
    setError('');
    setFlash(
      `Level ${wanted}, on ${formatNumber(target)} XP. ${
        delta > 0 ? '+' : '−'
      }${formatNumber(Math.abs(delta))} XP logged.${cut ? ` ${cut.summary}` : ''}`
    );
  }

  return (
    <Modal title={config.title} onClose={onClose}>
      <div className="ledger">
        <div className="ledger-balance">
          <span className="ledger-balance-label">Current Balance</span>
          <span className="ledger-balance-value" style={{ color: config.color }}>
            {formatNumber(balance)}
            {maxValue !== null ? ` / ${formatNumber(maxValue)}` : ''} {config.unit}
          </span>
        </div>

        {kind === 'health' && (
          <p className="frame-foot">
            {balance <= -maxValue
              ? 'Dead: a full bar of damage past zero.'
              : balance < 0
                ? `Bleeding out. ${formatNumber(balance - minValue)} HP left before death at ${formatNumber(minValue)}.`
                : `Health is the only pool that can go negative. It bottoms out at ${formatNumber(minValue)} HP, which is death.`}
          </p>
        )}

        {!readOnly && (
          <div className="ledger-form">
            <div className="ledger-inputs">
              <label className="ledger-field ledger-field-amount">
                <span className="ledger-field-label">Amount</span>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={amount}
                  placeholder="0"
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && apply(1)}
                />
              </label>

              <label className="ledger-field">
                <span className="ledger-field-label">
                  Reason
                  <span className="ledger-counter">
                    {note.length}/{LEDGER_NOTE_MAX}
                  </span>
                </span>
                <input
                  className="form-input"
                  type="text"
                  maxLength={LEDGER_NOTE_MAX}
                  value={note}
                  placeholder={config.placeholder}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && apply(1)}
                />
              </label>
            </div>

            <div className="ledger-actions">
              <button type="button" className="ledger-btn ledger-btn-add" onClick={() => apply(1)}>
                + Add
              </button>
              <button
                type="button"
                className="ledger-btn ledger-btn-sub"
                onClick={() => apply(-1)}
              >
                − Subtract
              </button>
            </div>

            {error && <p className="ledger-error">{error}</p>}
            {!error && flash && <p className="ledger-flash">{flash}</p>}
          </div>
        )}

        {alert && (
          <div
            className="ledger-alert-backdrop"
            onMouseDown={(e) => e.target === e.currentTarget && setAlert('')}
          >
            <div className="ledger-alert" role="alertdialog" aria-modal="true">
              <h3 className="ledger-alert-title">Not enough {config.noun}</h3>
              <p className="ledger-alert-body">{alert}</p>
              <button
                type="button"
                className="btn btn-copper btn-sm"
                onClick={() => setAlert('')}
                autoFocus
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {kind === 'xp' && !readOnly && (
          <div className="ledger-level-set">
            <span className="ledger-field-label">Or set the level directly</span>
            <div className="ledger-level-row">
              <input
                className="form-input"
                type="number"
                min="1"
                max={MAX_LEVEL}
                step="1"
                inputMode="numeric"
                value={levelWanted}
                placeholder={String(levelForXp(balance))}
                onChange={(e) => setLevelWanted(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyLevel()}
              />
              <button type="button" className="ledger-btn ledger-btn-level" onClick={applyLevel}>
                Set level
              </button>
            </div>
            <p className="ledger-level-note">
              Moves XP to exactly what that level costs, and logs the difference. Anything typed in
              Reason is used as the entry.
            </p>
          </div>
        )}

        {kind === 'xp' && (
          <div className="ledger-table-block">
            <button
              type="button"
              className="text-btn"
              onClick={() => setShowTable((open) => !open)}
            >
              {showTable ? 'Hide' : 'Show'} level table
            </button>

            {showTable && (
              <div className="xp-table">
                {XP_TABLE.slice(1).map((threshold, index) => {
                  const level = index + 1;
                  const reached = balance >= threshold;
                  const current = levelForXp(balance) === level;
                  return (
                    <div
                      key={level}
                      className={`xp-row${reached ? ' reached' : ''}${current ? ' current' : ''}`}
                    >
                      <span className="xp-row-level">
                        {level === MAX_LEVEL ? `LVL ${level} · CAP` : `LVL ${level}`}
                      </span>
                      <span className="xp-row-total">{formatNumber(threshold)} XP</span>
                      <span className="xp-row-step">
                        {level === 1 ? '—' : `+${formatNumber(threshold - XP_TABLE[level - 1])}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="ledger-log">
          <h4 className="ledger-log-heading">History</h4>

          {entries.length === 0 ? (
            <p className="frame-foot">
              Nothing logged yet. Every change to {config.noun} lands here with its reason.
            </p>
          ) : (
            <ul className="ledger-entries">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className={`ledger-entry ${entry.delta >= 0 ? 'positive' : 'negative'}`}
                >
                  <span className="ledger-delta">
                    {entry.delta >= 0 ? '+' : '−'}
                    {formatNumber(Math.abs(entry.delta))}
                  </span>
                  <span className="ledger-entry-body">
                    <span className="ledger-note">{entry.note || 'No reason given'}</span>
                    <span className="ledger-meta">
                      {formatStamp(entry.ts)} · balance {formatNumber(entry.balance)} {config.unit}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
