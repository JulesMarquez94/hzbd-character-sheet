import TargetChip from '../TargetChip.jsx';
import { useFight } from '../../context/fight.js';

/**
 * The initiative tracker, on a linked character's own sheet.
 *
 * Jules, 2026-09-01: "The initiative tracker did not appear on the Linked
 * Characters character sheet as a block." So here it is: one block per
 * campaign the sheet sits at, grown and arranged exactly like that campaign's
 * log block, drawing the same order the Game Master's Initiative & Turns block
 * draws — read off the table log rather than off the encounter row, because
 * the row is the Game Master's alone (see FightProvider.jsx).
 *
 * It is a reading, not a control. The chips are plain faces — a player is not
 * allowed to know anybody's pools, so no bar is painted — with each body's
 * rolled initiative in its corner and whoever the runner last called lit. The
 * one line under them says whose turn it is, and says "yours" in so many words
 * when it is: this block is where a player glances between other people's
 * turns, and the cover already shouts when their own arrives.
 *
 * With no fight running it says so and stays small. The block exists whenever
 * the membership does, exactly like the log block beside it, so the
 * arrangement never reshuffles because a fight started.
 */
export default function FightBlock({ campaignId, title = '', characterName = '' }) {
  const fight = useFight()?.fights?.find((entry) => entry.id === campaignId) ?? null;

  return (
    <div className="cell-scroll run-block">
      <div className="block-head">
        <span className="stat-category-label">Initiative &amp; Turns</span>
        <span className="block-count">{fight ? `Round ${fight.round}` : 'No fight'}</span>
      </div>

      {title && <p className="log-note">{title}</p>}

      {!fight ? (
        <p className="pick-line fx-empty">
          Nothing is being fought here right now. When the Game Master rolls initiative, the
          order lands on this block as it lands on theirs.
        </p>
      ) : (
        <>
          <div className="run-order">
            {fight.order.map((entry) => (
              <TargetChip
                key={`${entry.kind}:${entry.ref}`}
                body={{
                  id: entry.ref,
                  kind: entry.kind,
                  name: entry.name,
                  tone:
                    entry.kind === 'member'
                      ? 'var(--focus-cyan)'
                      : entry.rank
                        ? `var(--rank-${entry.rank})`
                        : 'var(--copper)',
                  health01: null,
                  shield01: 0,
                  down: false,
                }}
                up={Boolean(fight.upName) && entry.name === fight.upName}
                init={entry.init}
                title={`${entry.name} rolled ${entry.init}`}
              />
            ))}
          </div>

          <p className="run-note">
            {!fight.upName
              ? 'The order is rolled. The first call is on its way.'
              : fight.upName === characterName
                ? 'It is your turn. Your End Turn is what moves the table on.'
                : `${fight.upName} is up. Your turn will cover the screen when the order reaches you.`}
          </p>
        </>
      )}
    </div>
  );
}
