import { useEffect, useState } from 'react';

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
 *             gate says who. It stays held until every open reaction is taken
 *             or passed — the stack resolving before the action does. Movement
 *             never opens a hold (it resolves last), and a hung reactor can be
 *             carried past with the one quiet link at the foot.
 *   asks      if any reaction was actually taken, the fail question: did it
 *             undo this action? Per target when targets were picked — a
 *             counterspell can save one body and not another — and one plain
 *             question when none were.
 *
 * The gate never touches the spend. The price left the pools at the press, and
 * an action that fails here stays paid for, which is the ruling in the ask's
 * own words. It resolves with who survives, and the chain rolls on against
 * exactly them — or against nobody, and never rolls at all.
 *
 * It knows nothing about the network: the caller hands in `subscribe`, which
 * wires the table's react events to the three handlers for as long as the gate
 * stands. See usePlayCard.js.
 */
export default function ReactionGate({ job, onResolve }) {
  const { spec } = job;
  const targets = spec.targets ?? [];

  const [wait, setWait] = useState(() => Math.max(1, Math.floor(Number(spec.hold) || 6)));
  // key -> who, for every reaction currently being chosen.
  const [holds, setHolds] = useState({});
  // Whether any reaction was actually taken, which is what earns the question.
  const [acted, setActed] = useState(false);
  // Target ids the table ruled failed against.
  const [failed, setFailed] = useState([]);

  const holding = Object.keys(holds).length > 0;
  /* The window has closed with nobody holding it. With a taken reaction on the
     stack that is the question's cue; without one there is nothing to ask. */
  const closed = wait <= 0 && !holding;
  const asking = closed && acted;

  /* The countdown, paused while anybody holds the stack. */
  useEffect(() => {
    if (holding || wait <= 0) return undefined;
    const id = setInterval(() => setWait((left) => Math.max(0, left - 1)), 1000);
    return () => clearInterval(id);
  }, [holding, wait]);

  /* The table's word, wired for as long as the gate stands. */
  useEffect(() => {
    if (!spec.subscribe) return undefined;
    return spec.subscribe({
      onOpen: (key, who) =>
        setHolds((held) => ({ ...held, [key ?? who ?? 'someone']: who || 'Someone' })),
      onDone: (key, taken) => {
        if (taken) setActed(true);
        setHolds((held) => {
          const next = { ...held };
          delete next[key ?? ''];
          /* A done with a key the gate never saw still lifts something: the
             open may have raced the subscription by a breath. */
          if (key && !(key in held)) {
            const keys = Object.keys(next);
            if (keys.length > 0) delete next[keys[0]];
          }
          return next;
        });
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

  function toggleFailed(id) {
    setFailed((was) => (was.includes(id) ? was.filter((held) => held !== id) : [...was, id]));
  }

  function answer() {
    const survivors = targets.filter((entry) => !failed.includes(entry.id));
    onResolve({
      failed: targets.length > 0 ? survivors.length === 0 : false,
      targets: survivors,
      dropped: targets.filter((entry) => failed.includes(entry.id)),
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
                ? 'The stack is held. It resolves before this action does.'
                : `Reactions are open · the roll unlocks in ${wait}s`}
            </p>

            {holding && (
              <div className="react-gate-holds">
                {Object.entries(holds).map(([key, who]) => (
                  <span key={key} className="react-gate-hold">
                    {who} is reacting…
                  </span>
                ))}
              </div>
            )}

            {holding && (
              <button
                type="button"
                className="react-gate-override"
                onClick={() => setHolds({})}
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
                    const off = failed.includes(entry.id);
                    return (
                      <button
                        type="button"
                        key={entry.id}
                        className={`react-gate-target${off ? ' is-failed' : ''}`}
                        onClick={() => toggleFailed(entry.id)}
                        aria-pressed={off}
                      >
                        <span className="react-gate-target-name">{entry.name}</span>
                        <span className="react-gate-target-said">{off ? 'Fails' : 'Stands'}</span>
                      </button>
                    );
                  })}
                </div>

                <button type="button" className="btn btn-copper btn-sm" onClick={answer} autoFocus>
                  {failed.length === targets.length
                    ? 'It fails everywhere · nothing rolls'
                    : failed.length > 0
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
          The price is already paid either way. A movement reaction never holds this: it resolves
          after the action, which is its own rule.
        </p>
      </div>
    </div>
  );
}
