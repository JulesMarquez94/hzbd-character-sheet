import { useMemo, useState } from 'react';
import EffectPrompt from './EffectPrompt.jsx';
import EnchantWindow from './EnchantWindow.jsx';
import RestPrompt from './RestPrompt.jsx';
import RollArrow from '../RollArrow.jsx';
import TurnPrompt from './TurnPrompt.jsx';
import { cardAccent } from '../../lib/tagColors.js';
import { liveShift } from '../../lib/characterModel.js';
import { getCard } from '../../lib/weapons.js';
import { isEnchanter } from '../../lib/enchanting.js';
import { effectAdvantage } from '../../lib/moves.js';
import { riderLine } from '../../lib/riders.js';
import { RESTS, restPrice } from '../../lib/rest.js';
import { rollPlan } from '../../lib/rollPlan.js';
import { turnTriggers } from '../../lib/turnTriggers.js';
import { useCardStack } from '../../context/card-stack.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { useDiceTray } from '../../context/dice-tray.js';
import { restEvent, turnEvent } from '../../lib/campaignLog.js';
import {
  combatReactionGrant,
  combatShieldGrant,
  dropEffect,
  endCombat,
  endTurn,
  normalizeEffects,
  nudgeEffect,
  startCombat,
  startTurn,
  turnState,
} from '../../lib/combatTurn.js';

/**
 * The Character tab's sixth block: the turn, and what is running on you.
 *
 * The other five blocks describe the character. This one describes the moment.
 * At the table it is the block you touch most and read least: one big button
 * at the top that you hit twice a round, and under it the short list of things
 * that will run out if nobody counts them.
 *
 * ------------------------------------------------------------------ the button
 * It alternates, and it always says the move you are about to make rather than
 * the state you are in. Starting a turn brings your Action Points back and
 * takes a turn off everything running. Ending one spends nothing: it is the
 * state that makes the next Start mean something, and mid-round it is what
 * tells you the points on your sheet are not yours to spend yet.
 *
 * ------------------------------------------------------------------ the list
 * An effect that ran out is not deleted the moment it hits zero. It sits here
 * for the rest of the turn wearing "Ended", because a thing that vanishes is a
 * thing nobody noticed was over. The next Start clears it.
 *
 * Only the list scrolls. The button stays where your thumb left it however
 * many effects are stacked up, which is the whole reason the scroll is on the
 * list rather than on the block.
 */
export default function TurnBlock({ character, patch, readOnly = false }) {
  const [adding, setAdding] = useState(false);
  // Which rest is being considered ('short' | 'long'), or null.
  const [resting, setResting] = useState(null);
  /* Whether the Ephemeral Enchantment shelf is up, raised from the tracker's own
     add prompt. The same window the quick bar raises. */
  const [enchanting, setEnchanting] = useState(false);
  /* What the turn press found waiting on this boundary, held while the reminder
     is up. Null the rest of the time, which is nearly all of it. */
  const [reminder, setReminder] = useState(null);
  const stack = useCardStack();
  const tray = useDiceTray();
  /* The clock is the one thing on this block the whole table wants to see. A
     turn crossed between two casts is what makes a log read as a fight rather
     than as a list. See campaignLog.js. */
  const { log } = useCampaignLog();

  const turn = turnState(character);
  const effects = useMemo(() => normalizeEffects(character.effects), [character.effects]);

  const running = effects.filter((effect) => effect.turns !== 0).length;
  const ended = effects.length - running;

  /* What the rows below add up to on the *tiles*, which sit on other blocks —
     the sentence used to live next to the numbers it bent, and moved here so the
     tracker is the one block that talks about what is running. The tiles still
     show the bent number, and a hovered tile still prints its own arithmetic.
     Empty for anyone with nothing running, which is nearly everyone.

     Only the tiles. What is riding your *attacks* had a twin line here for a
     day and lost it ("the On your attack block is redundant. The tracker
     already tells you that", 2026-08-29): every riding row below already wears
     its arrow and prints what it does under its own name, so the sum was the
     list repeating itself one line up. The stats line survives because the
     numbers it accounts for are not on this block. */
  const shift = useMemo(() => liveShift(character), [character]);

  /**
   * The one button, pressed.
   *
   * Two of the three moves cross a turn boundary, and either of those stops for
   * a reminder when there is one to give. Entering a fight crosses nothing and
   * goes straight through, as does a boundary with nothing waiting on it, which
   * is what keeps the reminder from becoming the thing you dismiss twice a round
   * without reading. See turnTriggers.js.
   */
  function press() {
    const when = turn.move === 'turn' ? 'start' : turn.move === 'end' ? 'end' : null;
    const found = when ? turnTriggers(character, when) : null;

    if (found?.any) {
      setReminder(found);
      return;
    }

    patch(MOVES[turn.move](character));
    log(turnEvent(turn.move, character, turn));
  }

  /**
   * What a tracked row deals, rolled off the row itself.
   *
   * "You can click on the tracked effect like wall of fire to roll damage" —
   * the wall stands on your tracker because you cast it, and the moment
   * something walks into it is not a turn boundary, so the row is the only
   * place the roll can live. The card's own value links are thrown in printed
   * order, named after the row, onto the table log for everyone: landing the
   * number on an enemy is the Game Master's, from their own page.
   */
  function rollEffect(effect, links) {
    void (async () => {
      for (const link of links) {
        const result = await tray.present({
          ...link,
          name: effect.name,
          note: character?.name ?? '',
          log: true,
        });
        if (!result) return;
      }
    })();
  }

  /** The value links a row's card carries, or null for the rows that roll
      nothing. What decides whether the row wears a Roll button. */
  function throwable(effect) {
    if (!tray || readOnly) return null;
    const card = getCard(effect.card);
    if (!card) return null;
    const links = rollPlan(card, character).filter((link) => link.shape === 'value');
    return links.length > 0 ? links : null;
  }

  return (
    <div className="cell-scroll turn-block">
      {/* ---------- THE TWO RESTS ----------
          Above the turn, because a rest is what happens between fights and
          the turn manager is what happens inside one. Each names its own price
          on its face: the crate is the only thing either of them costs, and
          nobody should have to open the window to find that out. */}
      <div className="rest-row">
        {['short', 'long'].map((kind) => (
          <button
            type="button"
            key={kind}
            className={`rest-btn rest-btn-${kind}`}
            onClick={() => setResting(kind)}
            disabled={readOnly}
            title={`${RESTS[kind].label} · ${RESTS[kind].blurb}`}
          >
            <span className="rest-btn-label">{RESTS[kind].label}</span>
            {/* What it costs *this* character: Oz'em Pick takes 2 off both. */}
            <span className="rest-btn-cost">{restPrice(character, kind)} Supplies</span>
          </button>
        ))}
      </div>

      {/* ---------- THE TURN ---------- */}
      <div className="block-head">
        <span className="stat-category-label">Turn</span>
        {turn.started && (
          <button
            type="button"
            className="turn-reset"
            onClick={() => {
              patch(endCombat());
              log(turnEvent('reset', character, turn));
            }}
            disabled={readOnly}
            title="Set the count back to nothing. Whatever you are tracking stays."
          >
            End the fight
          </button>
        )}
      </div>

      <div className={`turn-state${turn.live ? ' is-live' : ''}`}>
        <span className="turn-n">{turn.started && turn.n > 0 ? turn.n : '—'}</span>
        <span className="turn-heading">{turn.heading}</span>
      </div>

      <button
        type="button"
        className={`turn-btn turn-btn-${turn.move}`}
        onClick={press}
        disabled={readOnly}
      >
        {turn.label}
      </button>

      <p className="turn-note">{turnNote(turn, character)}</p>

      {/* ---------- WHAT IS RUNNING ---------- */}
      <div className="block-head fx-head">
        <span className="stat-category-label">Temporary Effects</span>
        <span className="block-count">
          {running} running{ended > 0 ? `, ${ended} just ended` : ''}
        </span>
      </div>

      {/* The sum, above the list: the head says how many are running and this
          line says what that adds up to on the tiles. Pinned with the head
          rather than scrolling with the rows, because an accounting line that
          can scroll out of sight accounts for nothing. */}
      {shift.length > 0 && (
        <p className="attr-shift">
          <b>On your stats:</b> {shift.join(', ')}. Temporary, and not on your sheet.
        </p>
      )}

      {!readOnly && (
        <button type="button" className="fx-add" onClick={() => setAdding(true)}>
          + Track something
        </button>
      )}

      <div className="fx-list">
        {effects.length === 0 ? (
          <p className="pick-line fx-empty">
            Nothing running. Anything with a duration goes here: a spell you are keeping up, a
            condition you are under, a blessing somebody laid on you.
          </p>
        ) : (
          effects.map((effect) => {
            const links = throwable(effect);
            return (
              <EffectRow
                key={effect.id}
                effect={effect}
                readOnly={readOnly}
                onOpen={effect.card ? () => stack?.openCard(effect.card) : null}
                onNudge={(delta) => patch({ effects: nudgeEffect(effects, effect.id, delta) })}
                onDrop={() => patch({ effects: dropEffect(effects, effect.id) })}
                onRoll={links ? () => rollEffect(effect, links) : null}
              />
            );
          })
        )}
      </div>

      {adding && (
        <EffectPrompt
          character={character}
          onAdd={(entry) => patch(entry)}
          onClose={() => setAdding(false)}
          /* Offered only to a character who can actually lay one. */
          onEnchant={
            isEnchanter(character) && !readOnly
              ? () => {
                  setAdding(false);
                  setEnchanting(true);
                }
              : null
          }
        />
      )}

      {enchanting && (
        <EnchantWindow
          character={character}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setEnchanting(false)}
        />
      )}

      {resting && (
        <RestPrompt
          kind={resting}
          character={character}
          onRest={(body, taken) => {
            patch(body);
            log(
              restEvent(resting, character, {
                action: taken?.action ?? null,
                supplies: restPrice(character, resting),
              })
            );
          }}
          onClose={() => setResting(null)}
        />
      )}

      {/* Read off the move the button was showing when it was pressed rather
          than off `turn` now, so a reminder left open through somebody else's
          write still confirms the press it was raised for. */}
      {reminder && (
        <TurnPrompt
          triggers={reminder}
          character={character}
          patch={readOnly ? null : patch}
          onConfirm={() => {
            const move = reminder.when === 'start' ? 'turn' : 'end';
            patch(MOVES[move](character));
            log(turnEvent(move, character, turn));
            setReminder(null);
          }}
          onClose={() => setReminder(null)}
        />
      )}
    </div>
  );
}

/** The three moves the one button walks through, keyed the way turnState names them. */
const MOVES = { combat: startCombat, turn: startTurn, end: endTurn };

/**
 * Who gave the Shield.
 *
 * One piece is named, because a note that says which item did it is worth having.
 * Several are not: a full Runed set is three pieces adding up, and naming all
 * three inside a sentence that is already a list of three reads as neither.
 */
function grantSource(grant) {
  return grant.items.length === 1 ? `your ${grant.items[0].name}` : 'your gear';
}

/**
 * What the button is about to do, said before it does it.
 *
 * Entering a fight is the only move that hands anything over, so it is the one
 * that names what: the points, and whatever your gear gives at the bell.
 */
function turnNote(turn, character) {
  if (turn.move === 'end') return 'Nothing is spent by ending a turn. It only closes it.';

  if (turn.move === 'turn') {
    return `Starting brings your Action Points back to ${character.ap_max} and takes a turn off everything below.`;
  }

  // Read from the same math as the button, so with enough Shield already up
  // the note stops promising a grant that would not happen.
  const grant = combatShieldGrant(character);
  /* PREPARED is the one thing that comes to the bell with reactions in hand, so
     the note says the number the pool will actually hold rather than the zero
     every other character starts on. */
  const braced = combatReactionGrant(character);
  const parts = [
    `Action Points to ${character.ap_max}`,
    `Reaction Points to ${braced ? braced.next : 0}`,
    ...(grant ? [`Shield to ${grant.next} from ${grantSource(grant)}`] : []),
  ];

  // "A, B and C" — no comma before the and, per the house voice.
  const list =
    parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0];

  return `${list}. Then wait for the order to reach you.`;
}

/**
 * One thing running, on two lines: what it is and how long it has, then what
 * it does.
 *
 * The turn count is the loud part, because it is the only part that changes
 * without anybody touching it. An effect that came off a card opens that card;
 * one written in by hand shows the note it was written with, since a condition
 * the codex has never heard of still has to say what it does.
 *
 * Exported, because a creature has a tracker of its own on its own block and a
 * row there has to be this row: same count, same nudges, same card behind it.
 * See MinionBlock.jsx, which is where BarChip goes too.
 */
export function EffectRow({ effect, readOnly, onOpen, onNudge, onDrop, onRoll = null, bends = true }) {
  const over = effect.turns === 0;
  const open = effect.turns === null;
  /* What this row is doing to a roll, when it is doing anything: a Martial Move
     waiting on the next swing wears the same arrow the card does, which is the
     last clause of the note that asked for the arrow at all. An expired row is
     doing nothing, so it loses the badge while it sits here saying "Ended". */
  const arrow = over ? null : effectAdvantage(effect);
  /* And what it is doing to the *sheet*, for the rows that do anything to it.
     GIANT GROWTH has already doubled the Speed tile by the time this row is
     drawn, and the row is the only place that can say which one did it. Off the
     same table the doubling came from, so the words and the arithmetic cannot
     drift apart. Dropped along with the arrow once the row has ended.

     `bends` is false on a creature's tracker: a rider is read off the character's
     own effects column, so a line here promising a doubled Speed would be
     describing something that did not happen. See MinionBlock.jsx. */
  const does = over || !bends ? null : riderLine(effect.card);
  /* And what school it came out of, as a colour. "tracker should use tag
     coloring like spell school", 2026-08-28: a block with six things running on
     it is read by scanning, and until now every row on it was the same cyan
     whether it was a Fire spell, a Shadow spell or a note about being grappled.
     The rule down the left edge is the family's shade of its school's hue, off
     the same table the chips on a card's banner use, so a row and its card are
     visibly the same thing. A row with no school keeps the block's own cyan.
     See cardAccent in tagColors.js. */
  const accent = cardAccent(getCard(effect.card)?.tags);

  return (
    <div
      className={`fx-row${over ? ' is-over' : ''}${accent ? ' has-accent' : ''}`}
      style={accent ? { '--fx-accent': accent } : undefined}
    >
      <div className="fx-row-top">
        <span className={`fx-turns${open ? ' is-open' : ''}${over ? ' is-over' : ''}`}>
          {over ? 'Ended' : open ? '∞' : effect.turns}
        </span>

        <span className="fx-name-box">
          <span className="fx-name">{effect.name}</span>
          {effect.from && <span className="fx-from">{effect.from}</span>}
        </span>

        {arrow && <RollArrow {...arrow} size={20} />}

        {/* What the row deals, rolled off the row: a wall of fire clicked the
            moment something walks into it. Only on a row whose card rolls a
            value, and never on one that has ended. See rollPlan. */}
        {onRoll && !over && !readOnly && (
          <button
            type="button"
            className="fx-step fx-roll"
            onClick={onRoll}
            aria-label={`Roll what ${effect.name} deals`}
            title="Roll what this deals"
          >
            Roll
          </button>
        )}

        {!readOnly && (
          <span className="fx-tools">
            <button
              type="button"
              className="fx-step"
              onClick={() => onNudge(-1)}
              disabled={open || effect.turns === 0}
              aria-label={`${effect.name}, one turn fewer`}
              title="One turn fewer"
            >
              &minus;
            </button>
            <button
              type="button"
              className="fx-step"
              onClick={() => onNudge(1)}
              aria-label={`${effect.name}, one turn more`}
              title={open ? 'Give it a count of 1' : 'One turn more'}
            >
              +
            </button>
            <button
              type="button"
              className="fx-step fx-drop"
              onClick={onDrop}
              aria-label={`Stop tracking ${effect.name}`}
              title="Stop tracking this"
            >
              &times;
            </button>
          </span>
        )}
      </div>

      {does && <span className="fx-does">{does}</span>}

      {onOpen ? (
        <button type="button" className="fx-read" onClick={onOpen}>
          {effect.note || 'Read the card'}
        </button>
      ) : (
        effect.note && <span className="fx-note">{effect.note}</span>
      )}
    </div>
  );
}
