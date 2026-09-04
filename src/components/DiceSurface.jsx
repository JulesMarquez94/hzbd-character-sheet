import { useEffect, useRef, useState } from 'react';
import { VERDICTS, rollNotation, verdictLabel } from '../lib/dice.js';
import Die from './Die.jsx';

/**
 * The flat roller: dice on a surface, without the physics.
 *
 * This is what a free sheet gets, and it is not a consolation prize. It is the
 * reference renderer. The numbers were settled before it mounted (see dice.js),
 * so everything here is presentation: which faces to show, in what order, and
 * how long to take about it. The physics roller that lands in phase 6 replaces
 * this component and nothing else, because there is nothing else to replace.
 *
 * It is also the fallback three other ways. A reader who has asked their machine
 * for less motion gets it instead of the tumble, a machine that fails to fetch
 * the 3D chunk falls back to it, and a player who taps to skip is watching it
 * from the moment they tap.
 *
 * ------------------------------------------------------------------ the beats
 * A roll has four, and they are what makes it read as a throw rather than as a
 * number appearing:
 *
 *   dc        what is it against? Only for a check raised off a card, and only
 *             once per chain. The dice are already on the table behind the
 *             question, so it is asked about a roll you can see.
 *   ready     the dice are on the surface and have not been thrown. Press the
 *             button or tap the panel. Jules asked for this beat by name, and
 *             it is the one that makes the roll *yours*.
 *
 * The surface is a panel standing at the right of the screen since 2026-09-04,
 * not a cover ("a rectangle that pop on the right side center vertically. So
 * it does not take over everything"). The sheet behind it stays readable and
 * pressable while a roll is up; see the note in DiceTray.css.
 *   rolling   they tumble. The faces flicker through values that mean nothing.
 *   settling  they land. Then every die that exploded blooms out of the die that
 *             threw it, one at a time, so the cascade is legible rather than
 *             arriving as eight dice at once.
 *
 * Skipping cuts to the end of whichever beat you are in. It cannot skip the
 * first: an unthrown roll has nothing to skip to, and cutting past the throw
 * would take the roll away from the player.
 *
 * ------------------------------------------------------------------ the glow
 * A die showing its own maximum is about to explode, so it glows, and the die it
 * throws blooms in glowing and cools. That is the whole animation Jules asked
 * for, and it is worth the trouble: an exploding die is the one moment in this
 * game where a number gets bigger for a reason the player did not choose, and it
 * should look like something happened.
 */

/** How long the dice tumble before they land. */
const TUMBLE_MS = 750;

/** And how long between one burst blooming and the next. */
const BLOOM_MS = 420;

/** How fast the faces flicker while they are in the air. */
const FLICKER_MS = 70;

/**
 * A face to show while a die is in the air.
 *
 * Deliberately not random. The dice have already been decided and a second
 * source of randomness in the renderer is a second thing that can disagree with
 * the log, so the flicker is a function of the frame and the die: it looks like
 * noise and it is the same noise on every screen.
 */
function flickerFace(die, tick) {
  return 1 + ((tick * 7 + die.id * 13) % die.sides);
}

/** Whether the reader has asked their machine to move things less. */
function prefersStill() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

export default function DiceSurface({
  job,
  onThrow,
  onCall,
  onDone,
  onClose,
  onDc,
  onSpend = null,
  offers = [],
  Stage = null,
}) {
  const { spec, result, phase } = job;

  /* A physics table, when the tier and the machine both allow one. It replaces
     the floor and nothing else, and it owns the timing while it is up: dice
     falling take as long as they take, so the tumble below stands down and waits
     to be told they landed. See DiceStage.jsx.

     Dropped the moment it says it could not manage, which puts the flat floor
     back mid-roll with the same faces on it. Nothing about the roll changes. */
  const [staged, setStaged] = useState(Boolean(Stage));
  /* Only from the throw onward. Before that the dice are waiting rather than
     falling, and a physics table has nothing to show: the dashed placeholders
     say "these are about to be thrown" better than an empty green field would. */
  const solid = Boolean(Stage && staged && (phase === 'rolling' || phase === 'done'));

  const [dc, setDc] = useState('');
  const [tick, setTick] = useState(0);
  /* How many of the bursts have bloomed. Bases are never staged: they land
     together, the way dice actually do. */
  const [bloomed, setBloomed] = useState(0);
  const timers = useRef([]);

  const bursts = (result?.dice ?? []).filter((one) => one.role === 'explosion');
  const landed = phase === 'done';
  /* Somebody else's roll, replayed off the log. It plays itself and clears
     itself, so it carries none of the controls: there is nothing here for a
     watcher to decide. Tapping still dismisses it. */
  const watching = Boolean(spec.watching);

  /* Every timer this component started, dropped in one place. A surface that is
     unmounted mid-tumble (the player closed it, or a chain moved on) must not
     leave an interval writing into a component that has gone. */
  function clearTimers() {
    for (const id of timers.current) clearTimeout(id);
    timers.current = [];
  }
  useEffect(() => clearTimers, []);

  /* The tumble, and the blooms after it. One effect, because they are one
     sequence: the blooms are scheduled off the moment the dice land.

     A reader who has asked for less motion takes the same path with every
     duration at zero, rather than a branch of its own. One code path means the
     still version cannot drift away from the moving one, and every timer still
     goes through `timers` so it is still cancellable. */
  useEffect(() => {
    if (phase !== 'rolling' || solid) return undefined;

    const still = prefersStill();
    const tumble = still ? 0 : TUMBLE_MS;
    const bloom = still ? 0 : BLOOM_MS;
    const flicker = still ? null : setInterval(() => setTick((t) => t + 1), FLICKER_MS);

    const land = setTimeout(() => {
      if (flicker) clearInterval(flicker);
      for (let i = 0; i < bursts.length; i += 1) {
        timers.current.push(setTimeout(() => setBloomed(i + 1), bloom * (i + 1)));
      }
      timers.current.push(setTimeout(onDone, bloom * bursts.length + (still ? 0 : 120)));
    }, tumble);
    timers.current.push(land);

    return () => {
      if (flicker) clearInterval(flicker);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, solid]);

  /**
   * Cut to the end. Everything is already decided, so this shows it.
   *
   * Skipping a physics roll takes the table away with it. There is no way to
   * fast-forward a falling die, and the honest end of the animation is the faces
   * it was always going to show, which the flat floor draws immediately.
   */
  function skip() {
    if (phase !== 'rolling') return;
    clearTimers();
    setStaged(false);
    setBloomed(bursts.length);
    onDone();
  }

  /* Escape is the way out of every beat, which is the same instinct at each of
     them: get me out of this.

     Including the two before the throw, which had no way out at all. The price
     is already paid by the time a card raises dice, so abandoning is allowed and
     `present` resolves null for it: the chain stops and the log keeps whatever
     was thrown. Until this, that documented path could not be reached from the
     interface, and a player who did not want to roll was stuck on the surface.

     A roll waiting on the table's verdict is the one exception. It is not asking
     whether to continue, it is asking what happened, and the four buttons are
     the only honest answers. */
  useEffect(() => {
    function onKey(event) {
      if (event.key !== 'Escape') return;
      if (phase === 'dc' || phase === 'ready') onClose();
      else if (phase === 'rolling') skip();
      else if (phase === 'done' && !needsCall) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  /* The table has to call it: a check was made, the roll landed and nobody told
     the sheet what it was up against. Four buttons and no default, because a
     guessed verdict written into the log is worse than an unanswered one. */
  const needsCall =
    landed && result?.shape === 'check' && spec.askVerdict && result.verdict === null;

  const visible = (result?.dice ?? []).filter((one) => {
    if (one.role !== 'explosion') return true;
    return bursts.indexOf(one) < bloomed;
  });

  return (
    <div
      className={`dice-surface is-${phase}${watching ? ' is-watching' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={spec.name || 'Dice'}
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        /* A roll waiting on its DC is waiting on an answer, so a stray tap does
           nothing. Everything else on the surface is a tap away from its next
           beat. */
        if (phase === 'dc') return;
        if (phase === 'ready') onThrow();
        else if (phase === 'rolling') skip();
        else if (!needsCall) onClose();
      }}
    >
      <div className="dice-stage">
        {/* The action, as a plate: the card's own face beside its name, so a
            roll reads as the thing being done rather than as loose arithmetic.
            A roll with no card behind it keeps the plate and drops the art. */}
        <div className={`dice-head${spec.art ? ' has-art' : ''}`}>
          {spec.art && <img className="dice-head-art" src={spec.art} alt="" loading="lazy" />}
          <span className="dice-head-body">
            {watching && <span className="dice-whose">{spec.note || 'Someone'} rolled</span>}
            <span className="dice-head-name">{spec.name || 'A roll'}</span>
            {!watching && spec.note && <span className="dice-note">{spec.note}</span>}
          </span>
        </div>

        <p className="dice-asked">
          {result ? rollNotation(result) : askedFor(spec)}
          {phase !== 'dc' && spec.dc !== null && spec.dc !== undefined && (
            <span className="dice-dc">against {spec.dc}</span>
          )}
        </p>

        {/* ---------- THE DC ----------
            Asked once, after the price is paid and before the dice are thrown,
            exactly as Jules laid the flow out. It sits on the surface rather
            than in a window of its own so the dice are already on the table
            behind it: you are answering a question about a roll you can see,
            and the answer is the last thing between you and throwing it.

            Blank is a real answer and the button says so. A crit is 6 over the
            DC, so a roller that has not been told the number genuinely cannot
            judge the throw, and pretending otherwise is the one thing it must
            never do. */}
        {phase === 'dc' && (
          <div className="dice-ask">
            <label className="dice-ask-label" htmlFor="dice-dc">
              What is it against?
            </label>
            <input
              id="dice-dc"
              type="number"
              className="dice-input dice-ask-input"
              value={dc}
              autoFocus
              onChange={(event) => setDc(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && onDc(dc)}
              placeholder="The DC"
            />
            <span className="dice-ask-row">
              <button type="button" className="btn btn-minimal btn-sm" onClick={() => onDc('')}>
                Nobody knows
              </button>
              <button type="button" className="btn btn-copper btn-sm" onClick={() => onDc(dc)}>
                {dc === '' ? 'Roll it blind' : `Against ${dc}`}
              </button>
            </span>
          </div>
        )}

        <div className={`dice-floor${solid ? ' is-solid' : ''}`}>
          {solid && (
            <Stage
              dice={result?.dice ?? []}
              onLanded={onDone}
              /* A table that cannot be built is not a roll that cannot be seen.
                 The flat floor takes over with the same numbers on it. */
              onFail={() => setStaged(false)}
            />
          )}

          {/* Two rows on the flat floor: the dice that were asked for, then a
              thin seam, then whatever burst out of them. What was rolled and
              what the roll *did* read as two different lines, because they are. */}
          {!solid && (
            <>
              <div className="dice-row">
                {visible
                  .filter((die) => die.role !== 'explosion')
                  .map((die) => (
                    <Die
                      key={die.id}
                      die={die}
                      face={phase === 'rolling' ? flickerFace(die, tick) : die.value}
                      rolling={phase === 'rolling'}
                      /* A die on its own maximum is why the next one exists, so
                         it stays lit rather than glowing once and cooling. */
                      hot={
                        phase !== 'rolling' && die.value === die.sides && result.shape === 'value'
                      }
                    />
                  ))}
                {(phase === 'ready' || phase === 'dc') &&
                  plannedDice(spec).map((die, i) => (
                    <Die key={`ready-${i}`} die={die} face={null} rolling={false} hot={false} />
                  ))}
              </div>

              {visible.some((die) => die.role === 'explosion') && (
                <>
                  <div className="dice-burst-seam" aria-hidden="true" />
                  <div className="dice-row dice-row-burst">
                    {visible
                      .filter((die) => die.role === 'explosion')
                      .map((die) => (
                        <Die
                          key={die.id}
                          die={die}
                          face={phase === 'rolling' ? flickerFace(die, tick) : die.value}
                          rolling={phase === 'rolling'}
                          hot={phase !== 'rolling' && die.value === die.sides}
                        />
                      ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {landed && (
          <p className="dice-total">
            {result.flat !== 0 && <span className="dice-flat">{signed(result.flat)}</span>}
            <span className="dice-sum">{result.total}</span>
          </p>
        )}

        {landed && result.verdict && (
          <p className={`dice-verdict is-${result.verdict}`}>{verdictLabel(result.verdict)}</p>
        )}

        {/* ---------- WHAT CAN STILL BE DONE ----------
            A roll in this game is not over when the dice stop. Karma buys a
            second look and so do some cards, and both are decisions made after
            seeing the result. Only offered when they could change the band: an
            offer to spend a Karma on a roll it cannot rescue is worse than no
            offer. Each one names what is paying for it, on hover and in the
            line under it. See interventions.js. */}
        {landed && !needsCall && offers.length > 0 && onSpend && (
          <div className="dice-help">
            <span className="dice-help-ask">
              {offers[0].gap === null
                ? 'You can still spend something on this'
                : `${offers[0].gap} short of the next band`}
            </span>
            <span className="dice-help-row">
              {offers.map((offer) => (
                <button
                  type="button"
                  key={offer.id}
                  className="dice-help-opt"
                  style={{ '--dice-tone': offer.tone }}
                  title={`${offer.source} · ${offer.detail}`}
                  onClick={() => onSpend(offer)}
                >
                  {offer.label}
                  <span className="dice-help-from">
                    {offer.cost}
                    {offer.source !== offer.label && ` · ${offer.source}`}
                  </span>
                </button>
              ))}
            </span>
          </div>
        )}

        {needsCall && (
          <div className="dice-call">
            <span className="dice-call-ask">No DC was given. What was it?</span>
            <span className="dice-call-row">
              {VERDICTS.map((verdict) => (
                <button
                  type="button"
                  key={verdict.id}
                  className="dice-call-opt"
                  style={{ '--dice-tone': verdict.tone }}
                  onClick={() => onCall(verdict.id)}
                >
                  {verdict.label}
                </button>
              ))}
            </span>
          </div>
        )}

        <div className="dice-tools">
          {!watching && phase === 'ready' && (
            <button type="button" className="btn btn-copper" onClick={onThrow}>
              Roll
            </button>
          )}
          {phase === 'rolling' && (
            <button type="button" className="btn btn-minimal btn-sm" onClick={skip}>
              Skip
            </button>
          )}
          {!watching && landed && !needsCall && (
            <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
              Done
            </button>
          )}
        </div>

        <p className="dice-hint">
          {watching
            ? 'Someone else at the table. It clears itself.'
            : phase === 'dc'
            ? 'Leave it blank and the table calls the result · Escape to walk away'
            : phase === 'ready'
              ? 'Tap the panel to roll · Escape to walk away'
              : phase === 'rolling'
                ? 'Tap to skip'
                : needsCall
                  ? 'Pick the one the table called'
                  : 'Tap the panel to clear it'}
        </p>
      </div>
    </div>
  );
}

/** One die, face up. `face` of null is a die that has not been thrown yet. */
/** "+4" and "-2", for a modifier sitting beside a total. */
function signed(flat) {
  return flat < 0 ? `${flat}` : `+${flat}`;
}

/**
 * The dice a spec is *about* to roll, so the surface has something to show
 * before anything is thrown. Shapes only: they carry no values and they are
 * replaced the moment the roll lands.
 */
function plannedDice(spec) {
  const out = [];
  let id = 0;
  for (const term of spec.preview ?? []) {
    for (let i = 0; i < term.count; i += 1) {
      out.push({ id: id++, sides: term.faces, value: 0, role: term.role ?? 'base', from: null });
    }
  }
  return out;
}

/**
 * "2d6 + 4", off the preview, before there is a result to read it off.
 *
 * Built the same way `rollNotation` builds it from a landed roll, down to the
 * bare number for the modifier. Pushing a signed "+4" instead reads as "+ +4"
 * once the terms are joined, and collapsing that back eats the space.
 */
function askedFor(spec) {
  const terms = (spec.preview ?? []).map(
    (term) => `${term.role === 'disadvantage' ? '- ' : ''}${term.count}d${term.faces}`
  );
  const flat = Number(spec.flat) || 0;
  if (flat !== 0) terms.push(flat < 0 ? `- ${Math.abs(flat)}` : String(flat));
  return terms.join(' + ').replace(/\+ - /g, '- ');
}
