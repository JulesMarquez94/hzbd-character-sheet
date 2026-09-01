import Modal from '../Modal.jsx';
import { CostOrb } from '../CostOrbs.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { cardAccent } from '../../lib/tagColors.js';
import { clauseThrow } from '../../lib/combatApply.js';
import { getCard } from '../../lib/weapons.js';

/**
 * The runner stopping at an enemy's turn boundary to say what is waiting on it.
 *
 * Jules, 2026-09-01: "When an entity starts a turn, it should prompt needed
 * rolls, same at end turn. Like renew or wall of fire." A player's own sheet
 * has done this since the tracker learned to read boundaries (TurnPrompt.jsx);
 * an enemy had nobody to stop, because pressing Next was one write and the
 * spore on the lich ticked in silence. Now Next stops here first, exactly as
 * the sheet's own button does: only when something is actually waiting, read
 * off the same turnTriggers, worded for the body it is about.
 *
 * One press can cross two boundaries — the turn being left ends as the next
 * one starts — so the prompt holds both, each under its own heading, and the
 * confirm is the same advance the press was always going to make.
 *
 * ------------------------------------------------------------------ the rolls
 * A clause that names dice gets a Roll button, which is the half the sheet's
 * prompt does not have yet: "the spore deals 2d6 + 8 damage" is a handful the
 * Game Master was rolling by hand and applying by hand. The button hands the
 * clause to the page (see `onThrow` in EncounterTab.jsx), the tray rolls it
 * over this window, and the apply window opens with the boundary's own body
 * already picked — a burning enemy takes its own burn — for the Game Master to
 * repoint if the card says otherwise.
 *
 * Nothing is paid and nothing ticks until the confirm: backing out leaves the
 * fight exactly where it stood, which matters at a Start more than anywhere,
 * because that press is the one that spends the counts.
 */
export default function FoeTurnPrompt({ boundary, onConfirm, onThrow, onClose }) {
  const stack = useCardStack();
  const sides = [boundary.leaving, boundary.coming].filter(
    (side) => side && side.triggers.any
  );

  return (
    <Modal
      title={`Turn ${boundary.round}: ${boundary.entry?.name ?? 'the next one'}`}
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Not yet
          </button>
          <button type="button" className="btn btn-copper btn-sm" onClick={onConfirm} autoFocus>
            {boundary.entry?.kind === 'member'
              ? `Call ${boundary.entry.name}'s turn`
              : `Start ${boundary.entry?.name ?? 'the'} turn`}
          </button>
        </>
      }
    >
      <div className="turn-prompt">
        <p className="turn-prompt-lead">
          Before the order moves, here is what is waiting on the boundary.
        </p>

        {sides.map((side) => (
          <div key={side.when === 'end' ? 'leaving' : 'coming'} className="foe-boundary">
            <span className="foe-boundary-head">
              {side.when === 'end'
                ? `Ending ${side.foe.title}'s turn`
                : `Starting ${side.foe.title}'s turn`}
            </span>

            {side.triggers.rows.map((row) => (
              <BoundaryRow
                key={row.id}
                row={row}
                onOpen={row.card ? () => stack?.openCard(row.card) : null}
                onThrow={(clause, spec) => onThrow(side.foe, row, clause, spec)}
              />
            ))}

            {side.triggers.ending.length > 0 && (
              <p className="turn-prompt-note turn-prompt-ending">
                <b>Runs out on this press:</b>{' '}
                {side.triggers.ending.map((row) => row.name).join(', ')}.
              </p>
            )}

            {side.triggers.clearing.length > 0 && (
              <p className="turn-prompt-note">
                <b>Swept off the block:</b>{' '}
                {side.triggers.clearing.map((row) => row.name).join(', ')}. Those ended last turn
                and have been read.
              </p>
            )}
          </div>
        ))}

        <p className="turn-prompt-foot">
          A roll lands on the log for the whole table, and the window that follows it is where
          the numbers land on bodies. The counts tick when the turn is called, not before.
        </p>
      </div>
    </Modal>
  );
}

/**
 * One running thing and what it does at this boundary, with a Roll beside every
 * clause that rolls anything. The row wears its card's colour the way the
 * sheet's own prompt rows do, so the reminder and the tracker row it came from
 * read as one thing.
 */
function BoundaryRow({ row, onOpen, onThrow }) {
  const accent = cardAccent(getCard(row.card)?.tags);

  return (
    <div className="turn-trigger" style={accent ? { '--fx-accent': accent } : undefined}>
      <div className="turn-trigger-head">
        <span className="turn-trigger-name">{row.name}</span>
        {row.from && <span className="turn-trigger-from">{row.from}</span>}

        {row.toll && (
          <span className="turn-trigger-toll" title="An Upkeep. Miss it and the effect ends.">
            {row.toll.ap > 0 && <CostOrb kind="ap" value={row.toll.ap} size={22} />}
            {row.toll.wp > 0 && <CostOrb kind="wp" value={row.toll.wp} size={22} />}
          </span>
        )}

        <span className="turn-trigger-turns">
          {row.turns === null ? 'open' : `${row.turns} left`}
        </span>
      </div>

      {row.clauses.map((clause) => {
        const spec = clauseThrow(clause);
        return (
          <div className="turn-trigger-line" key={clause}>
            <p className="turn-trigger-clause">{clause}</p>
            {spec && (
              <button
                type="button"
                className="turn-trigger-roll"
                onClick={() => onThrow(clause, spec)}
                title={`Roll ${spec.dice.join(' + ')}${spec.flat ? ` + ${spec.flat}` : ''} and land it`}
              >
                Roll it
              </button>
            )}
          </div>
        );
      })}

      {onOpen && (
        <button type="button" className="turn-trigger-read" onClick={onOpen}>
          Read the card
        </button>
      )}
    </div>
  );
}
