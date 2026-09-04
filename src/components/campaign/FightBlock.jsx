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
export default function FightBlock({ campaignId, title = '', characterId = null }) {
  const held = useFight();
  const fight = held?.fights?.find((entry) => entry.id === campaignId) ?? null;
  /* And the moment before the order exists: the table has asked for an
     Initiative roll and the panel is standing somewhere on this screen. The
     block says so rather than saying no fight is running, which is true and
     useless. */
  const ask = held?.asking?.find((entry) => entry.id === campaignId) ?? null;
  /* The pools the curtain lets through: with "show enemy health" on, an enemy
     chip here carries its bar exactly as the Game Master's does. And what is
     running on each seated character, off their own public sheet, so a hidden
     Trickster reads as hidden on every chip that shows them. */
  const pools = held?.pools ?? {};
  const worn = held?.worn ?? {};
  const mine = Boolean(characterId) && fight?.upCharacter === characterId;

  return (
    <div className="cell-scroll run-block">
      <div className="block-head">
        <span className="stat-category-label">Initiative &amp; Turns</span>
        <span className="block-count">
          {fight ? `Round ${fight.round}` : ask ? 'Rolling' : 'No fight'}
        </span>
      </div>

      {title && <p className="log-note">{title}</p>}

      {!fight ? (
        <p className="pick-line fx-empty">
          {ask
            ? 'A fight is starting and the table has asked for your Initiative. Roll it from the panel at the side of the screen, and the order lands here.'
            : 'No fight running. When the Game Master rolls initiative, the order lands here as it lands on theirs.'}
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
                  effects: entry.kind === 'member' ? (worn[entry.ref] ?? []) : [],
                  ...(pools[entry.ref] ?? {}),
                }}
                up={
                  entry.kind === 'member' && fight.upCharacter
                    ? entry.ref === fight.upCharacter
                    : Boolean(fight.upName) && entry.name === fight.upName
                }
                init={entry.init}
                title={`${entry.name} rolled ${entry.init}`}
              />
            ))}
          </div>

          <p className="run-note">
            {!fight.upName
              ? 'The order is rolled. The first call is on its way.'
              : mine
                ? 'It is your turn. Start it from the panel or your Turn block. Your End Turn moves the table on.'
                : `${fight.upName} is up. A panel at the side of the screen calls your turn when the order reaches you.`}
          </p>
        </>
      )}
    </div>
  );
}
