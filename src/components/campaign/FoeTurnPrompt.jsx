import { useState } from 'react';
import Modal from '../Modal.jsx';
import { CostOrb } from '../CostOrbs.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { cardAccent } from '../../lib/tagColors.js';
import { clauseThrow } from '../../lib/combatApply.js';
import { costWords } from '../../lib/overcast.js';
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
export default function FoeTurnPrompt({ boundary, onConfirm, onThrow, onUpkeep = null, onClose }) {
  const stack = useCardStack();
  const sides = [boundary.leaving, boundary.coming].filter(
    (side) => side && side.triggers.any
  );

  /* Which Upkeeps have been answered while this prompt is up, so the question
     is asked once per press. Keyed on the row, exactly as the sheet's own
     prompt keeps it. */
  const [upkeep, setUpkeep] = useState({});

  function answer(foe, row, act) {
    if (!onUpkeep) return;
    onUpkeep(foe, row, act);
    setUpkeep((was) => ({ ...was, [row.id]: act === 'pay' ? 'paid' : 'dropped' }));
  }

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
        <p className="turn-prompt-lead">What happens before the order moves.</p>

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
                foe={side.foe}
                answered={upkeep[row.id] ?? null}
                onUpkeep={onUpkeep ? (act) => answer(side.foe, row, act) : null}
                onOpen={row.card ? () => stack?.openCard(row.card) : null}
                onThrow={(clause, spec) => onThrow(side.foe, row, clause, spec)}
              />
            ))}

            {side.triggers.ending.length > 0 && (
              <p className="turn-prompt-note turn-prompt-ending">
                <b>Ends now:</b> {side.triggers.ending.map((row) => row.name).join(', ')}.
              </p>
            )}

            {side.triggers.clearing.length > 0 && (
              <p className="turn-prompt-note">
                <b>Cleared:</b> {side.triggers.clearing.map((row) => row.name).join(', ')}. Ended
                last turn.
              </p>
            )}
          </div>
        ))}

        <p className="turn-prompt-foot">
          Roll it puts the dice on the log for the whole table and opens the window that lands the
          number. Nothing ticks until you confirm.
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
function BoundaryRow({ row, foe, answered = null, onUpkeep = null, onOpen, onThrow }) {
  const accent = cardAccent(getCard(row.card)?.tags);
  /* Whether the enemy's own pools can cover the toll, read off the snapshot the
     boundary was raised with. Refused rather than clamped when they cannot: a
     toll paid into the negative would be the sheet inventing points. */
  const affordable =
    row.toll &&
    (Number(foe?.ap) || 0) >= (row.toll.ap || 0) &&
    (Number(foe?.willpower) || 0) >= (row.toll.wp || 0);

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

      {/* The Upkeep's own question: keep it up out of the enemy's own pools, or
          let it go and the row comes off its tracker. */}
      {row.toll && onUpkeep && (
        <div className="turn-trigger-line turn-trigger-upkeep">
          {answered === 'paid' ? (
            <span className="turn-trigger-taken">Paid · it holds</span>
          ) : answered === 'dropped' ? (
            <span className="turn-trigger-taken">Let go · it ends here</span>
          ) : (
            <>
              <p className="turn-trigger-clause">Keep it up, or let it go?</p>
              <button
                type="button"
                className="turn-trigger-take"
                disabled={!affordable}
                onClick={() => onUpkeep('pay')}
                title={
                  affordable
                    ? `Paid out of ${foe?.title ?? 'its'} own pools. The effect keeps running.`
                    : 'Its pools cannot cover it. Let it go, or give it the points first.'
                }
              >
                Pay {costWords(row.toll)}
              </button>
              <button
                type="button"
                className="turn-trigger-drop"
                onClick={() => onUpkeep('drop')}
                title="The effect ends and its row comes off"
              >
                Let it go
              </button>
            </>
          )}
        </div>
      )}

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
                title={`Roll ${spec.dice.join(' + ')}${spec.flat ? ` + ${spec.flat}` : ''}, then pick who it lands on`}
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
