import Modal from '../Modal.jsx';
import { CostOrb } from '../CostOrbs.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { cardAccent } from '../../lib/tagColors.js';
import { costWords } from '../../lib/overcast.js';
import { getCard } from '../../lib/weapons.js';

/**
 * What the turn is about to set off, said before it sets it off.
 *
 * The turn buttons used to be the two least interesting controls on the sheet:
 * one press brought the points back and took a turn off the list, and everything
 * the list was *for* stayed printed on cards nobody opened mid-fight. A spore
 * that deals damage at every Turn End is a thing the table forgets four rounds
 * running and then argues about.
 *
 * So the press stops here first, whenever there is anything to stop for. What is
 * printed is what the running cards say about this boundary, in their own words
 * with this character's numbers already worked out, plus the two things the
 * press itself is about to do. See turnTriggers.js, which is where a boundary is
 * found.
 *
 * ------------------------------------------------------------ never in the way
 * **It only opens when it has something to say.** A turn with nothing running,
 * or with nothing running that names this boundary, goes straight through on one
 * press exactly as it always did. That is the whole reason a reminder is
 * tolerable at a table: it is rare, and when it appears it is because something
 * actually happens.
 *
 * The confirm is the same press again and it is focused, so the walk is press,
 * read, press. Backing out leaves the turn exactly where it was, which matters
 * more at a Turn Start than anywhere else on the sheet: that press is the one
 * that spends the count.
 *
 * ------------------------------------------------------------------- the tolls
 * An Upkeep is the one reminder with a price on it, so it is drawn as one. What
 * it costs is read off the card's own second half rather than restated here, and
 * nothing is deducted: missing an Upkeep is a real choice ("Miss the Upkeep and
 * the spell ends"), and a sheet that quietly paid it would be making that choice
 * for the player. The row says what is owed. The player pays it with the pools on
 * block 2, or lets the spell go and drops the row.
 */
export default function TurnPrompt({ triggers, character, onConfirm, onClose }) {
  const stack = useCardStack();
  const start = triggers.when === 'start';
  /* Everything owed at this boundary, added up. The rows say what each spell
     wants; this says whether the night can pay for all of them, which is the
     question you actually have with three spells up. */
  const owed = tollTotal(triggers.rows);

  return (
    <Modal
      title={start ? 'Starting your turn' : 'Ending your turn'}
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Not yet
          </button>
          <button type="button" className="btn btn-copper btn-sm" onClick={onConfirm} autoFocus>
            {start ? 'Start Turn' : 'End Turn'}
          </button>
        </>
      }
    >
      <div className="turn-prompt">
        <p className="turn-prompt-lead">
          {start
            ? 'Before the count moves, here is what is waiting on it.'
            : 'Before you close the turn, here is what happens at the bottom of it.'}
        </p>

        {triggers.rows.length > 0 && (
          <div className="turn-prompt-rows">
            {triggers.rows.map((row) => (
              <TriggerRow
                key={row.id}
                row={row}
                onOpen={row.card ? () => stack?.openCard(row.card) : null}
              />
            ))}
          </div>
        )}

        {/* What every Upkeep on the block adds up to, against what is in the
            pool it comes out of. Nothing is deducted: missing one is a real
            choice, and the sheet does not get to make it. */}
        {owed && (
          <p className="turn-prompt-note turn-prompt-owed">
            <b>Upkeep owed:</b> {costWords(owed)}. You have{' '}
            {owed.wp > 0 ? `${Number(character?.willpower) || 0} Willpower` : ''}
            {owed.wp > 0 && owed.ap > 0 ? ' and ' : ''}
            {owed.ap > 0 ? `${Number(character?.ap) || 0} Action Points` : ''}. Pay it on block 2,
            or let the spell go and drop its row.
          </p>
        )}

        {/* And the two things no card prints, under the things they do. A turn
            running out is the tracker's own arithmetic, and it is the half of a
            Turn Start people notice only once it has already happened. */}
        {triggers.ending.length > 0 && (
          <p className="turn-prompt-note turn-prompt-ending">
            <b>Runs out on this press:</b> {triggers.ending.map((row) => row.name).join(', ')}. Each
            one stays on the block wearing "Ended" until the turn after.
          </p>
        )}

        {triggers.clearing.length > 0 && (
          <p className="turn-prompt-note">
            <b>Swept off the block:</b> {triggers.clearing.map((row) => row.name).join(', ')}. Those
            ended last turn and have been read.
          </p>
        )}

        <p className="turn-prompt-foot">
          Nothing here is paid or applied for you. The sheet counts the turns and
          names what they set off. What lands, and on whom, is the table's.
        </p>
      </div>
    </Modal>
  );
}

/** Every Upkeep on the block added up, or null when nothing is owed. */
function tollTotal(rows) {
  const total = rows.reduce(
    (sum, row) => ({ ap: sum.ap + (row.toll?.ap ?? 0), wp: sum.wp + (row.toll?.wp ?? 0) }),
    { ap: 0, wp: 0 }
  );

  return total.ap > 0 || total.wp > 0 ? total : null;
}

/**
 * One running thing and what it does at this boundary.
 *
 * It wears its card's own colour down the left edge, the same shade the row on
 * the block wears, so a reminder can be matched to the row that raised it
 * without reading either name. See cardAccent in tagColors.js.
 */
function TriggerRow({ row, onOpen }) {
  const accent = cardAccent(getCard(row.card)?.tags);

  return (
    <div
      className="turn-trigger"
      style={accent ? { '--fx-accent': accent } : undefined}
    >
      <div className="turn-trigger-head">
        <span className="turn-trigger-name">{row.name}</span>
        {row.from && <span className="turn-trigger-from">{row.from}</span>}

        {/* What it is owed, drawn the way every other cost on the sheet is. */}
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

      {row.clauses.map((clause) => (
        <p className="turn-trigger-clause" key={clause}>
          {clause}
        </p>
      ))}

      {onOpen && (
        <button type="button" className="turn-trigger-read" onClick={onOpen}>
          Read the card
        </button>
      )}
    </div>
  );
}
