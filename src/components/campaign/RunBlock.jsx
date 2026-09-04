import TargetChip from '../TargetChip.jsx';

/**
 * The initiative and turn manager, as a block.
 *
 * Jules, 2026-09-01: "On the encounter page the user has the DM Log block
 * there and an initiative and turn manager block." The fight used to run from
 * a strip pinned over the enemy blocks; now that an encounter is its own page,
 * the fight is a block like everything else on the site — arranged beside the
 * log, the two things a Game Master reads between every press.
 *
 * The order is drawn in the target chips the rest of the fight uses, which is
 * the strip grown honest: each body's chip *is* its Health bar (the Shield
 * over it in blue, no numbers — see TargetChip.jsx), so the order now answers
 * "who is next" and "how are they standing" in one glance. Whoever is up is
 * lit, and the initiative each rolled sits in the chip's corner.
 *
 * **The Next button still says what it is waiting for.** On an enemy's turn it
 * is the Game Master's press; on a player's it is a courtesy they should not
 * normally need, because the player ending their own turn moves the table on
 * by itself. Same rule the strip kept, same reason: that is the whole
 * difference between a runner that works at a table and one that does not.
 *
 * ------------------------------------------------------------------ the ask
 * The roll button no longer rolls the players' dice. It asks them for their
 * own (Jules, 2026-09-04) and the block waits: the enemies have rolled, and
 * this is the list of who has answered and who has not. Two presses hold the
 * whole of that wait open — **start it** rolls for whoever is missing and
 * begins, and **call it off** drops the ask — because a fight must never be
 * stuck behind a laptop somebody shut. See askInitiative in encounters.js.
 */
export default function RunBlock({
  run,
  up,
  ready,
  roster,
  ask = null,
  onRoll,
  onStart,
  onUnroll,
  onNext,
  onEnd,
}) {
  const live = run.live;
  const waiting = up?.kind === 'member';

  if (!live && ask) return <AskBlock ask={ask} onStart={onStart} onUnroll={onUnroll} />;

  return (
    <div className="cell-scroll run-block">
      <div className="block-head">
        <span className="stat-category-label">Initiative &amp; Turns</span>
        <span className="block-count">
          {live ? `Round ${run.round}` : run.order.length > 0 ? 'Fight over' : 'No fight yet'}
        </span>
      </div>

      {run.order.length > 0 && (
        <div className={`run-order${live ? '' : ' is-done'}`}>
          {run.order.map((entry, at) => (
            <TargetChip
              key={`${entry.kind}:${entry.ref}`}
              body={chipFor(entry, roster)}
              up={live && at === run.at}
              init={entry.init}
              title={`${entry.name} rolled ${entry.init}`}
            />
          ))}
        </div>
      )}

      {!live ? (
        <>
          <button
            type="button"
            className="btn btn-primary run-roll"
            onClick={onRoll}
            disabled={!ready}
          >
            {run.order.length > 0 ? 'Roll a new fight' : 'Roll initiative'}
          </button>
          <p className="run-note">
            {ready
              ? 'The enemies roll here. Every player is asked for their own 2d6 + Initiative on their own sheet, and the fight starts the moment the last one lands.'
              : 'Add an enemy or link a character first.'}
          </p>
        </>
      ) : (
        <>
          <div className="run-acts">
            <button
              type="button"
              className={`btn btn-sm ${waiting ? 'btn-minimal' : 'btn-primary'}`}
              onClick={onNext}
              title={
                waiting
                  ? `${up.name} has not ended their turn. This moves on without them.`
                  : `${up?.name ?? 'This one'} is done. The next is up.`
              }
            >
              {waiting ? `Skip ${up.name}` : 'Next turn'}
            </button>

            <button type="button" className="btn btn-minimal btn-sm" onClick={onEnd}>
              End fight
            </button>
          </div>

          <p className="run-note">
            {waiting
              ? `${up.name}'s turn. Their End Turn moves the table on.`
              : `${up?.name ?? 'An enemy'}'s turn. Play its moves on its block, then press Next.`}
          </p>
        </>
      )}
    </div>
  );
}

/**
 * The wait, as the block reads while it is on.
 *
 * The enemies are rolled and out of sight — their numbers are the Game
 * Master's until the order lands — so what is on screen is the one thing this
 * moment is about: which players have thrown, and what they got.
 */
function AskBlock({ ask, onStart, onUnroll }) {
  const answered = ask.answered.length;
  const many = answered + ask.waiting.length;

  return (
    <div className="cell-scroll run-block">
      <div className="block-head">
        <span className="stat-category-label">Initiative &amp; Turns</span>
        <span className="block-count">
          {answered} of {many} rolled
        </span>
      </div>

      <ul className="run-wait">
        {ask.answered.map((seat) => (
          <li key={seat.ref} className="run-wait-row is-in">
            <span className="run-wait-name">{seat.name}</span>
            <span className="run-wait-init">{seat.init}</span>
          </li>
        ))}
        {ask.waiting.map((seat) => (
          <li key={seat.ref} className="run-wait-row">
            <span className="run-wait-name">{seat.name}</span>
            <span className="run-wait-init">rolling</span>
          </li>
        ))}
      </ul>

      <div className="run-acts">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onStart}
          title="Whoever has not rolled is rolled for here, and the fight starts"
        >
          Roll the rest and start
        </button>

        <button type="button" className="btn btn-minimal btn-sm" onClick={onUnroll}>
          Call it off
        </button>
      </div>

      <p className="run-note">
        {ask.waiting.length === 0
          ? 'Everybody has rolled. The order is on its way.'
          : `${ask.foes} ${ask.foes === 1 ? 'enemy has' : 'enemies have'} rolled. A panel on each sheet is asking for the rest, and the fight starts by itself when the last one lands.`}
      </p>
    </div>
  );
}

/**
 * The chip for one order entry: the live body where it is still standing, and
 * an honest husk where it is not — an enemy removed mid-fight, a character
 * unlinked — drawn down, because a body the fight cannot find is not fighting.
 */
function chipFor(entry, roster) {
  const body = (roster ?? []).find((held) => held.id === entry.ref);
  if (body) return body;

  return {
    id: entry.ref,
    kind: entry.kind,
    name: entry.name,
    tone: entry.rank ? `var(--rank-${entry.rank})` : undefined,
    health01: 0,
    shield01: 0,
    down: true,
  };
}
