import { useEffect, useRef, useState } from 'react';

/**
 * The stack, standing between an action and its dice.
 *
 * Jules, 2026-09-01: a reaction "pauses the roll of the reacted action.
 * Actions resolve in the order they are put on the stack... When the reaction
 * is over and we return to the player, he should see a popup that asks if the
 * reaction made this action fail. If it does fail, the resources are spent but
 * the action is not taken. If it targets multiple, the failed question is
 * asked about all of them."
 *
 * So the actor's chain no longer counts its window down on the roll button; it
 * runs through here first. The gate:
 *
 *   counts    six seconds, during which the whole table's banners are up and
 *             anyone with Reaction Points may step in.
 *   holds     the moment somebody opens a reaction, the count stops and the
 *             gate says who. It stays held until that reaction is taken or
 *             passed: the stack resolving before the action does. Movement
 *             never opens a hold (it resolves last), and a hung reactor can be
 *             carried past with the one quiet link at the foot.
 *   asks      if the reaction was actually taken, the fail question: did it
 *             undo this action? Per target when targets were picked, since a
 *             counterspell can save one body and not another, and one plain
 *             question when none were.
 *
 * ------------------------------------------------------------- one slot, once
 * "Don't allow more than 1 reaction per action. As soon as someone reacts, that
 * person takes his reaction. Once his reaction is done, then we continue with
 * the main action. Don't allow chains for reaction" (Jules, 2026-09-01).
 *
 * So this holds one reaction and not a stack of them. The first open takes the
 * slot and every later one is ignored, a taken reaction closes the window for
 * good rather than handing back whatever was left of the six seconds, and the
 * countdown does not have to run out first: the moment the one reaction has
 * resolved, the action carries on. Nobody may react to the reaction either,
 * which is enforced where the banners are raised rather than here.
 *
 * The gate never touches the spend. The price left the pools at the press, and
 * an action that fails here stays paid for, which is the ruling in the ask's
 * own words. It resolves with who survives, and the chain rolls on against
 * exactly them, or against nobody, and never rolls at all.
 *
 * It knows nothing about the network: the caller hands in `subscribe`, which
 * wires the table's react events to the two handlers for as long as the gate
 * stands. See usePlayCard.js.
 */
export default function ReactionGate({ job, onResolve }) {
  const { spec } = job;
  const targets = spec.targets ?? [];

  const [wait, setWait] = useState(() => Math.max(1, Math.floor(Number(spec.hold) || 6)));
  /* The one slot: `{ key, who }` while somebody is choosing their reaction, and
     null the rest of the time. */
  const [hold, setHold] = useState(null);
  // Whether the reaction was actually taken, which is what earns the question.
  const [acted, setActed] = useState(false);
  /* And whether the window is spent: the one reaction has resolved, so there is
     nothing left to wait for however much of the six seconds is unspent. */
  const [spent, setSpent] = useState(false);
  /* The table's word per target: 'stands' or 'fails'. Two choices rather than
     a toggle, and every target must be answered before the confirm wakes —
     an unanswered body is not a body that stands by default. */
  const [answers, setAnswers] = useState({});

  /* Read by the subscription, which is wired once and must not see a stale
     copy of either: whose word the gate is waiting on, and whether the slot has
     already been used up. */
  const heldRef = useRef(null);
  const spentRef = useRef(false);

  const holding = Boolean(hold);
  /* The window is over: it either ran out or was used, and nobody is mid-choice.
     With a taken reaction behind it that is the question's cue; without one
     there is nothing to ask. */
  const closed = (wait <= 0 || spent) && !holding;
  const asking = closed && acted;

  /* The countdown, paused while the one reactor holds the stack. */
  useEffect(() => {
    if (holding || spent || wait <= 0) return undefined;
    const id = setInterval(() => setWait((left) => Math.max(0, left - 1)), 1000);
    return () => clearInterval(id);
  }, [holding, spent, wait]);

  /* The table's word, wired for as long as the gate stands. */
  useEffect(() => {
    if (!spec.subscribe) return undefined;
    return spec.subscribe({
      onOpen: (key, who) => {
        /* One slot. Somebody has it, or somebody has already spent it, and a
           second open against the same action is not a thing that happens. */
        if (heldRef.current || spentRef.current) return;
        heldRef.current = key ?? who ?? 'someone';
        setHold({ key: heldRef.current, who: who || 'Someone' });
      },
      onDone: (key, taken) => {
        /* Somebody else's word about somebody else's reaction: the loser of a
           photo finish standing back down. It lifts nothing. */
        if (heldRef.current && key && heldRef.current !== key) return;
        heldRef.current = null;
        setHold(null);
        if (!taken) return;
        /* Taken and resolved. The action carries on now rather than sitting out
           the rest of a countdown nobody can use. */
        spentRef.current = true;
        setActed(true);
        setSpent(true);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Straight through when nobody reacted: no question is owed, and the chain
     was only ever waiting on the window. The tray guards a double resolve. */
  useEffect(() => {
    if (closed && !acted) onResolve({ failed: false, targets });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closed, acted]);

  function say(id, word) {
    setAnswers((was) => ({ ...was, [id]: word }));
  }

  const answered = targets.every((entry) => answers[entry.id]);

  function answer() {
    if (!answered) return;
    const survivors = targets.filter((entry) => answers[entry.id] !== 'fails');
    onResolve({
      failed: targets.length > 0 ? survivors.length === 0 : false,
      targets: survivors,
      dropped: targets.filter((entry) => answers[entry.id] === 'fails'),
    });
  }

  return (
    <div className="react-gate" role="dialog" aria-modal="true" aria-label="Reactions">
      <div className="react-gate-body">
        <div className={`dice-head${spec.art ? ' has-art' : ''}`}>
          {spec.art && <img className="dice-head-art" src={spec.art} alt="" loading="lazy" />}
          <span className="dice-head-body">
            <span className="dice-head-name">{spec.name || 'An action'}</span>
            {spec.note && <span className="dice-note">{spec.note}</span>}
          </span>
        </div>

        {!asking ? (
          <>
            <p className="react-gate-line">
              {holding
                ? 'A reaction is declared: this action cannot resolve yet.'
                : `Reactions are open · the roll unlocks in ${wait}s`}
            </p>

            {holding && (
              <div className="react-gate-holds">
                <span className="react-gate-hold">Waiting on {hold.who} to react…</span>
                <span className="react-gate-only">
                  One reaction to an action. Nobody else can step in now.
                </span>
              </div>
            )}

            {holding && (
              <button
                type="button"
                className="react-gate-override"
                onClick={() => {
                  heldRef.current = null;
                  setHold(null);
                }}
                title="For a reactor who walked away mid-hold. Whatever they already took still counts."
              >
                The table released it · carry on
              </button>
            )}
          </>
        ) : (
          <div className="react-gate-ask">
            <p className="react-gate-line">
              {targets.length > 0
                ? 'A reaction resolved first. Did it make this action fail, and against whom?'
                : 'A reaction resolved first. Did it make this action fail?'}
            </p>

            {targets.length > 0 ? (
              <>
                <div className="react-gate-targets">
                  {targets.map((entry) => {
                    const word = answers[entry.id] ?? null;
                    return (
                      <div
                        key={entry.id}
                        className={`react-gate-target${word === 'fails' ? ' is-failed' : ''}`}
                      >
                        <span className="react-gate-target-name">{entry.name}</span>
                        <span className="react-gate-target-says">
                          <button
                            type="button"
                            className={`react-gate-say is-stands${word === 'stands' ? ' is-on' : ''}`}
                            onClick={() => say(entry.id, 'stands')}
                            aria-pressed={word === 'stands'}
                          >
                            Stands
                          </button>
                          <button
                            type="button"
                            className={`react-gate-say is-fails${word === 'fails' ? ' is-on' : ''}`}
                            onClick={() => say(entry.id, 'fails')}
                            aria-pressed={word === 'fails'}
                          >
                            Fails
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="btn btn-copper btn-sm"
                  onClick={answer}
                  disabled={!answered}
                  title={answered ? undefined : 'Answer for every target first'}
                >
                  {!answered
                    ? 'Answer for every target'
                    : targets.every((entry) => answers[entry.id] === 'fails')
                      ? 'It fails everywhere · nothing rolls'
                      : targets.some((entry) => answers[entry.id] === 'fails')
                        ? 'Roll against the rest'
                        : 'It stands · roll it'}
                </button>
              </>
            ) : (
              <div className="react-gate-verdicts">
                <button
                  type="button"
                  className="btn btn-minimal btn-sm"
                  onClick={() => onResolve({ failed: true, targets: [], dropped: [] })}
                >
                  It fails · the cost stays spent
                </button>
                <button
                  type="button"
                  className="btn btn-copper btn-sm"
                  onClick={() => onResolve({ failed: false, targets: [], dropped: [] })}
                  autoFocus
                >
                  It stands · roll it
                </button>
              </div>
            )}
          </div>
        )}

        <p className="react-gate-hint">
          One reaction to an action, and it resolves before the action does. The price is already
          paid either way. A movement reaction never holds this: it resolves after the action, which
          is its own rule.
        </p>
      </div>
    </div>
  );
}
