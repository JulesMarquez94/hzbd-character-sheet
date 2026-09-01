import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DiceTrayContext } from '../context/dice-tray.js';
import { useAuth } from '../context/auth-context.js';
import { previewOf, rollCheck, rollValue } from '../lib/dice.js';
import { applyIntervention, interventionsFor } from '../lib/interventions.js';
import { REPLAY_DEPTH } from '../lib/logChain.js';
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

/**
 * How long somebody else's landed roll stays on screen before it clears itself.
 *
 * Long enough to read a total and a verdict, short enough that a fight does not
 * become a slideshow. Nobody pressed anything to start it, so nobody should have
 * to press anything to end it.
 */
const WATCH_LINGER_MS = 2600;

/** Whether this reader has asked their machine to move things less. */
function prefersStill() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

export function DiceTrayProvider({ children }) {
  /* Whose sheet is open, when one is. The custom roll window reads its three
     attributes off this so a Skill Check can be thrown without the player
     copying a number off the page. Registered by the sheet through `hold`
     rather than passed down, because this provider sits above the router and
     has no idea a character exists. */
  const [sheet, setSheet] = useState(null);
  const character = sheet?.character ?? null;

  /* Which floor a roll lands on. Premium and above get the physics table, unless
     the reader has asked for less motion, in which case a tumbling die is
     exactly what they asked not to be shown. Everyone else gets the flat one,
     which shows the same faces and the same total: the tier buys the tumble and
     nothing else. See CAPABILITIES.physics in tiers.js. */
  const { can } = useAuth();
  const wantsSolid = can('physics') && !prefersStill();

  /**
   * The physics table, fetched only by the sheets that are going to use one.
   *
   * three.js and a physics engine are the heaviest thing this site can load, and
   * a free sheet, a signed-out visitor and a reader who asked for less motion
   * must never pay for them. Nothing eager imports it, so the chunk is fetched
   * the first time a sheet entitled to one is open.
   *
   * Imported by hand rather than through `lazy`, which would want a Suspense
   * boundary above it and would throw into the tray if the chunk never arrived.
   * Here a chunk that fails to load simply leaves this null, and null is already
   * the flat floor. The failure path and the fallback path are the same path.
   */
  const [stage, setStage] = useState(null);
  useEffect(() => {
    if (!wantsSolid) return undefined;

    let live = true;
    import('./DiceStage.jsx')
      .then((module) => {
        if (live) setStage(() => module.default);
      })
      .catch((error) => {
        console.warn('The physics table did not load. Rolling flat.', error);
      });

    return () => {
      live = false;
    };
  }, [wantsSolid]);
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState(false);
  const [pool, setPool] = useState([]);
  const [explode, setExplode] = useState(false);
  const [job, setJob] = useState(null);
  /* Somebody else's roll, waiting to be shown. A queue rather than a slot: two
     players acting at once is a fight, not an error, and the second one is worth
     watching too. Capped just below in `watch`, so it can never grow into a
     backlog somebody has to sit through. */
  const [queue, setQueue] = useState([]);
  /* The one being shown is simply the head of the queue, rather than a slot of
     its own that an effect shifts into. Two pieces of state that have to be
     moved between are two pieces of state that can disagree, and the shifting
     had to happen during a render to do it. */
  const watching = queue[0] ?? null;

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

  /**
   * Put somebody else's roll on the table.
   *
   * The dice were settled by the client that threw them and written into the
   * log, so this is a renderer being told what happened rather than a second
   * roll of the same name. Nothing here decides a number. See resultFromRow.
   */
  const watch = useCallback((replay) => {
    if (!replay?.result) return;
    setQueue((held) => {
      /* At the cap the new one is dropped rather than stacked behind the others.
         A fight where four people act at once must not put you behind a queue
         you cannot skip, and every dropped roll is still a row in the block
         underneath. */
      if (held.length >= REPLAY_DEPTH) return held;
      return [
        ...held,
        {
        key: replay.key,
        job: {
          id: `watch-${replay.key}`,
          spec: {
            shape: replay.result.shape,
            name: replay.name,
            note: replay.actor,
            watching: true,
            dc: replay.result.dc,
            flat: replay.result.flat,
            preview: [],
            askVerdict: false,
            askDc: false,
          },
          result: replay.result,
          /* Straight to the tumble. Nobody here is going to throw it: it was
             thrown a second ago on somebody else's screen. */
            phase: 'rolling',
          },
        },
      ];
    });
  }, []);

  /**
   * What the holder could still spend on the roll that just landed.
   *
   * Read fresh on every render rather than held in state, because it depends on
   * the sheet's own pools: a Karma spent is a Karma gone, and the second offer
   * has to know that. `spent` comes off the result itself, which is what stops
   * the same card being offered twice for one roll.
   */
  const offers = useMemo(() => {
    if (!job?.result || job.phase !== 'done') return [];
    return interventionsFor({
      result: job.result,
      character,
      held: sheet?.cards ?? [],
      spent: job.result.interventions ?? [],
    });
  }, [job, character, sheet]);

  /**
   * Spending one of them.
   *
   * The sheet is patched and the roll is re-judged in the same breath, and the
   * roll is *not* finished: the surface stays up showing the new total, which is
   * the whole point of an offer made after the dice have stopped. Whatever is
   * still worth offering is offered again.
   */
  function spend(offer) {
    if (!job?.result) return;
    sheet?.paySpend?.(offer.spends);

    const result = applyIntervention(job.result, offer);
    setJob({ ...job, result });
    /* Its own row under the same chain. The throw was written when it landed and
       the log is insert only, so a Karma spent afterwards is a second thing that
       happened rather than an edit to the first. The table reads "Attack Roll 15,
       failure" and then "Karma 18, success", which is what actually occurred. */
    tell(result, { ...job.spec, card: null, name: offer.source });
  }

  /** The head of the queue has landed. Let it be read, then move on. */
  const dismissWatch = useCallback(() => setQueue((held) => held.slice(1)), []);

  /* And it clears itself. Nobody pressed anything to start it, so nobody should
     have to press anything to end it. Tapping still dismisses it early. */
  useEffect(() => {
    if (watching?.job?.phase !== 'done') return undefined;
    const id = setTimeout(dismissWatch, WATCH_LINGER_MS);
    return () => clearTimeout(id);
  }, [watching, dismissWatch]);

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
        /* Your own dice take the table, and whatever was queued behind them is
           dropped rather than held. A replay is something to watch and a roll is
           something to do, and nobody should have to sit through somebody else's
           animation to take their turn. Every dropped one is still in the log. */
        setQueue([]);
        ticket.current += 1;
        const ready = normalize(spec);
        setJob({
          id: ticket.current,
          spec: ready,
          phase: ready.askDc ? 'dc' : 'ready',
          result: null,
        });
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
  /**
   * Tell the table about a throw.
   *
   * Called the moment the dice land, not when the player closes the surface.
   * Jules asked for it that way on 2026-08-31 and he is right: everyone else's
   * screen should show the roll as it happens, and a roller who sits looking at
   * their own result for twenty seconds should not be holding the table's view of
   * it hostage. The surface stays up afterwards for as long as they like.
   *
   * It follows that an intervention spent after the fact is its own write. See
   * `spend`: the first row is already out by then, and the log is insert only.
   */
  const tell = useCallback((result, spec) => {
    if (!result || !spec?.log) return;
    held.current?.logRoll?.(result, {
      chain: spec.chain ?? null,
      card: spec.card ?? null,
      /* A roll raised by a card is named after the kind of roll it is: the entry
         above it in the log already says which card, and repeating it there says
         nothing twice. A roll with no card above it keeps the name it was raised
         with — what the player typed, or the tracked effect that dealt it. */
      name: spec.card ? '' : spec.name,
      damage: spec.damage ?? [],
      /* Whose roll this was, for a holder that speaks for more than one body.
         A sheet ignores it — its character signs everything — but the encounter
         page rolls for every enemy in the fight, and the enemy that threw is
         written on the spec as its note. See DiceTable.jsx. */
      actor: spec.note ?? '',
    });
  }, []);

  /**
   * Hand the caller what happened and clear the surface.
   *
   * No longer writes anything: the throw was told to the table when it landed.
   * All this does is release the promise a chain is waiting on.
   */
  const finish = useCallback((result) => {
    const resolve = settle.current;
    settle.current = null;
    setJob(null);
    resolve?.(result ?? null);
  }, []);

/**
   * Whether a throw is still waiting on the table to say what it was.
   *
   * A roll with no DC is not finished news: the dice have stopped but nobody has
   * said whether that was a success. So it is not told until the call comes,
   * which is the difference between a log that reports and a log that speculates.
   */
  function awaitsCall(result, spec) {
    return Boolean(result && result.shape === 'check' && spec?.askVerdict && !result.verdict);
  }

  /**
   * The dice have come to rest.
   *
   * Guarded on the phase because there is more than one way to get here: the flat
   * roller's own timer, a physics table saying it is finished, and a player
   * tapping to skip. Two of those can fire for one throw when the physics table
   * fails mid-roll and the flat one takes over, and the table must hear about a
   * roll once.
   */
  function landed() {
    if (!job || job.phase === 'done') return;
    if (!awaitsCall(job.result, job.spec)) tell(job.result, job.spec);
    setJob({ ...job, phase: 'done' });
  }

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

  /**
   * The DC, answered or waved off.
   *
   * It lands on the spec rather than beside it, so that everything downstream
   * reads one number from one place: `rollCheck` judges against `spec.dc`, and
   * the surface prints it. An empty answer leaves it null, which is what raises
   * the four buttons once the dice land.
   */
  function setDc(value) {
    if (!job || job.phase !== 'dc') return;
    const dc = String(value ?? '').trim() === '' ? null : Math.trunc(Number(value));
    setJob({
      ...job,
      spec: { ...job.spec, dc: Number.isFinite(dc) ? dc : null },
      phase: 'ready',
    });
  }

  /* The table's own verdict, for a check thrown with no DC. It closes the roll
     as well as answering it: the four buttons are the last thing a roll is
     waiting on, so pressing one is finishing it. */
  function call(verdict) {
    if (!job?.result) return;
    /* And now it is news. A blind throw was held back when it landed precisely
       so that this row could carry the verdict rather than a second row having to
       correct the first. */
    const result = { ...job.result, verdict, calledByHand: true };
    tell(result, job.spec);
    finish(result);
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
    () => ({
      character,
      hold,
      present,
      watch,
      open: () => setOpen(true),
      close: () => setOpen(false),
    }),
    [character, hold, present, watch]
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

      {/* Somebody else's, when the table is free. Drawn by the same surface: it
          is the same dice showing the same faces, and the only difference is
          that this one plays itself. */}
      {!job && watching && (
        <DiceSurface
          key={`watch-${watching.key}`}
          job={watching.job}
          Stage={stage}
          onThrow={() => {}}
          onCall={() => {}}
          onDc={() => {}}
          onDone={() =>
            setQueue((held) =>
              held.length === 0
                ? held
                : [{ ...held[0], job: { ...held[0].job, phase: 'done' } }, ...held.slice(1)]
            )
          }
          onClose={dismissWatch}
        />
      )}

      {job && (
        <DiceSurface
          key={job.id}
          job={job}
          Stage={stage}
          onThrow={throwIt}
          onCall={call}
          onDone={landed}
          onDc={setDc}
          offers={offers}
          onSpend={spend}
          onClose={() => finish(job.result)}
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
    damage: spec.damage ?? [],
    askVerdict: spec.askVerdict ?? shape === 'check',
    /* The face on the surface's header: the card being played, as a plain URL
       so the tray never has to know the codex. Null draws the name alone. */
    art: spec.art ?? null,
    /* The reaction window: seconds the throw is held before it can be made,
       counted down on the surface. Zero for every roll outside a fight. */
    hold: Math.max(0, Math.floor(Number(spec.hold) || 0)),
    /* Whether the table hears about it. A scratch roll does not: it has no name
       to head a block with, and a feed full of unnamed d6 is a feed nobody
       reads. See the two modes at the top. */
    log: Boolean(spec.log),
    /* Whether the roll opens by asking what it is against. Only a check off a
       card does: the tray's own custom roll collected its DC in the window that
       set it up, and a damage roll has nothing to be against. */
    askDc: Boolean(spec.askDc),
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
