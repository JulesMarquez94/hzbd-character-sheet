import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DiceTrayContext } from '../context/dice-tray.js';
import { previewOf, rollCheck, rollValue } from '../lib/dice.js';
import CustomRoll from './CustomRoll.jsx';
import DiceSurface from './DiceSurface.jsx';
import './DiceTray.css';

/**
 * The tray: a button in the corner of every page, and the surface a roll lands
 * on.
 *
 * Mounted once, above the router, because a roll is not a thing that belongs to
 * the character sheet. You roll on the campaign page while somebody else is
 * taking their turn, you roll on the codex while arguing about a card, and the
 * table is watching either way.
 *
 * ------------------------------------------------------------------ two modes
 * A *scratch roll* is tapping d6 twice and throwing them. It has no name and no
 * DC, it is not judged and it does not reach the log. It is the dice you keep
 * beside the keyboard.
 *
 * A *custom roll* is named, so it can be read by somebody who was not watching.
 * That is the whole reason Jules asked for the name field: the name is what the
 * log block is called. It takes a DC if the table has said one, and it is judged
 * into the four bands either by the number or, when nobody knows the number, by
 * the table pressing one of four buttons.
 *
 * ---------------------------------------------------------------- `present`
 * The one function anything outside this file uses. It puts a roll on the
 * surface, waits for the player to throw it and resolves with the settled
 * result, which is what makes a chain of rolls read as a sequence:
 *
 *   const check = await tray.present({ shape: 'check', dc, flat, ... });
 *   if (hits) await tray.present({ shape: 'value', maximize: check.crit, ... });
 *
 * The promise resolves when the roll is *finished*, which for an unjudged check
 * means after the table has called it. A caller awaiting it is therefore holding
 * a result nobody can still change, which is the only kind worth writing to a
 * log. It resolves with null if the player closed the surface without throwing,
 * so a chain can stop rather than invent a number for a roll that never
 * happened.
 *
 * ------------------------------------------------------------------- the log
 * A finished roll writes itself to every table the sheet sits at, from `finish`
 * and nowhere else, so that all three ways a roll can end write the same row.
 * `spec.chain` is what ties it to the use that raised it: a chain of rows drawn
 * as one block with its throws under it. See newChain and groupEvents in
 * campaignLog.js.
 *
 * Only a roll made on your own sheet reaches a table, because that is the only
 * place a character and a log provider are both in scope. See DiceSheet.
 */

/** The dice a scratch roll can reach for. The game's own ladder, and two more. */
const SCRATCH = [4, 6, 8, 10, 12, 20, 100];

export function DiceTrayProvider({ children }) {
  /* Whose sheet is open, when one is. The custom roll window reads its three
     attributes off this so a Skill Check can be thrown without the player
     copying a number off the page. Registered by the sheet through `hold`
     rather than passed down, because this provider sits above the router and
     has no idea a character exists. */
  const [sheet, setSheet] = useState(null);
  const character = sheet?.character ?? null;
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState(false);
  const [pool, setPool] = useState([]);
  const [explode, setExplode] = useState(false);
  const [job, setJob] = useState(null);

  /* The promise `present` handed out, kept off the render state: resolving is
     not a render and a resolver living in state would be copied by every
     setJob. */
  const settle = useRef(null);

  /* One per roll, and only ever used to key the surface. A surface holds how far
     a cascade has bloomed, so two rolls in a row have to be two components: the
     second one reusing the first one's instance would open with the first one's
     bursts already shown. */
  const ticket = useRef(0);

  /* Whose sheet, and the way to tell that sheet's tables what happened. Both
     arrive together because both come from the same place, and a log with no
     character to name as the actor would write rows signed by nobody. */
  const hold = useCallback((next) => setSheet(next ?? null), []);

  /* Read through a ref so `finish` stays stable while the sheet's numbers move,
     which on a live character is constantly. Synced in an effect rather than
     assigned during render, the same shape Modal.jsx uses for its `onClose`. */
  const held = useRef(null);
  useEffect(() => {
    held.current = sheet;
  }, [sheet]);

  const present = useCallback(
    (spec) =>
      new Promise((resolve) => {
        /* A roll raised while another is still on the surface would strand the
           first one's caller waiting forever. There is only one surface, so the
           older roll is closed out as unthrown. */
        settle.current?.(null);
        settle.current = resolve;

        setOpen(false);
        setAsking(false);
        ticket.current += 1;
        setJob({ id: ticket.current, spec: normalize(spec), phase: 'ready', result: null });
      }),
    []
  );

  /**
   * Hand the caller what happened, tell the table, and clear the surface.
   *
   * The log write goes here rather than at the call site so that every way a
   * roll can finish writes the same row: thrown and judged by its DC, thrown and
   * called by the table, or thrown from a chain four blocks away. A roll that
   * was never thrown has no result and writes nothing, which is right: it did
   * not happen.
   *
   * `spec.log` is what asks for the row, so a scratch roll in the corner of the
   * screen stays private and a named one does not.
   */
  const finish = useCallback((result, spec) => {
    const resolve = settle.current;
    settle.current = null;
    setJob(null);

    if (result && spec?.log) {
      held.current?.logRoll?.(result, {
        chain: spec.chain ?? null,
        card: spec.card ?? null,
        name: spec.shape === 'check' ? spec.name : '',
      });
    }

    resolve?.(result ?? null);
  }, []);

  /**
   * The throw itself.
   *
   * Read off `job` rather than through a `setJob` updater on purpose. An updater
   * has to be pure and this one would not be: it rolls dice, and React is free
   * to call it twice. Under StrictMode that is two rolls where the player made
   * one, and the one they watched is whichever React kept.
   */
  function throwIt() {
    if (!job || job.phase !== 'ready') return;
    const result = job.spec.shape === 'check' ? rollCheck(job.spec) : rollValue(job.spec);
    setJob({ ...job, result, phase: 'rolling' });
  }

  /* The table's own verdict, for a check thrown with no DC. It closes the roll
     as well as answering it: the four buttons are the last thing a roll is
     waiting on, so pressing one is finishing it. */
  function call(verdict) {
    if (!job?.result) return;
    finish({ ...job.result, verdict, calledByHand: true }, job.spec);
  }

  function scratch() {
    if (pool.length === 0) return;
    present({
      shape: 'value',
      name: 'Dice',
      dice: group(pool),
      explode,
      askVerdict: false,
    });
    setPool([]);
  }

  const value = useMemo(
    () => ({ character, hold, present, open: () => setOpen(true), close: () => setOpen(false) }),
    [character, hold, present]
  );

  return (
    <DiceTrayContext.Provider value={value}>
      {children}

      {/* The button. Bottom left, over everything, on every page. */}
      <button
        type="button"
        className={`dice-fab${open ? ' is-open' : ''}`}
        onClick={() => setOpen((was) => !was)}
        aria-label={open ? 'Close the dice tray' : 'Open the dice tray'}
        aria-expanded={open}
      >
        <DieMark />
      </button>

      {open && (
        <div className="dice-tray">
          <div className="dice-tray-head">
            <span className="stat-category-label">Dice</span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="dice-tray-ladder">
            {SCRATCH.map((faces) => (
              <button
                type="button"
                key={faces}
                className="dice-pick"
                onClick={() => setPool((held) => [...held, faces])}
              >
                d{faces}
              </button>
            ))}
          </div>

          <p className="dice-tray-pool">
            {pool.length === 0 ? (
              <span className="dice-tray-empty">Tap a die to build a roll</span>
            ) : (
              group(pool).join(' + ')
            )}
          </p>

          <label className="dice-tray-check">
            <input
              type="checkbox"
              checked={explode}
              onChange={() => setExplode((was) => !was)}
            />
            <span>
              Explode on a maximum. Off unless you are rolling damage or healing, because
              nothing else does.
            </span>
          </label>

          <div className="dice-tray-tools">
            <button
              type="button"
              className="btn btn-minimal btn-sm"
              onClick={() => setPool([])}
              disabled={pool.length === 0}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-copper btn-sm"
              onClick={scratch}
              disabled={pool.length === 0}
            >
              Roll
            </button>
          </div>

          <button
            type="button"
            className="dice-tray-custom"
            onClick={() => {
              setAsking(true);
              setOpen(false);
            }}
          >
            Make a custom roll
            <span className="dice-tray-custom-line">
              Name it, add what you are good at and give it a DC. This one the table can read.
            </span>
          </button>
        </div>
      )}

      {asking && (
        <CustomRoll
          character={character}
          onClose={() => setAsking(false)}
          onRoll={(spec) => {
            setAsking(false);
            present(spec);
          }}
        />
      )}

      {job && (
        <DiceSurface
          key={job.id}
          job={job}
          onThrow={throwIt}
          onCall={call}
          onDone={() => setJob((held) => (held ? { ...held, phase: 'done' } : held))}
          onClose={() => finish(job.result, job.spec)}
        />
      )}
    </DiceTrayContext.Provider>
  );
}

/* -------------------------------------------------------------- the plumbing */

/**
 * A spec with every field the surface reads, whatever the caller passed.
 *
 * `askVerdict` is the one worth naming: a check raises the four buttons when it
 * lands without a DC, and a damage roll never does. Nothing about damage is a
 * success or a failure.
 */
function normalize(spec) {
  const shape = spec.shape === 'check' ? 'check' : 'value';
  const full = {
    shape,
    name: spec.name ?? '',
    note: spec.note ?? '',
    kind: spec.kind ?? (shape === 'check' ? 'attack' : 'damage'),
    flat: Number(spec.flat) || 0,
    dc: spec.dc === '' || spec.dc === undefined ? null : spec.dc,
    advantage: spec.advantage ?? 0,
    disadvantage: spec.disadvantage ?? 0,
    dice: spec.dice ?? [],
    maximize: Boolean(spec.maximize),
    explode: spec.explode !== false,
    parts: spec.parts ?? [],
    askVerdict: spec.askVerdict ?? shape === 'check',
    /* Whether the table hears about it. A scratch roll does not: it has no name
       to head a block with, and a feed full of unnamed d6 is a feed nobody
       reads. See the two modes at the top. */
    log: Boolean(spec.log),
    chain: spec.chain ?? null,
    card: spec.card ?? null,
  };
  return { ...full, preview: previewOf(full) };
}

/** [6, 6, 4] as ['2d6', '1d4'], in the order the dice were tapped. */
function group(pool) {
  const counted = new Map();
  for (const faces of pool) counted.set(faces, (counted.get(faces) ?? 0) + 1);
  return [...counted].map(([faces, count]) => `${count}d${faces}`);
}

/** The mark on the button. A die, drawn rather than typed. */
function DieMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="dice-fab-mark">
      <rect x="3" y="3" width="18" height="18" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="8.5" r="1.7" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}
