import { useEffect, useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import { Gated } from './parts.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { useDiceTray } from '../../context/dice-tray.js';
import { ATTRIBUTES } from '../../lib/attributes.js';
import { enterFormBody } from '../../lib/combatBar.js';
import { isFailure } from '../../lib/dice.js';
import { canEnterForm, feralState, setFeralDifficulty } from '../../lib/feral.js';
import { rollPlan } from '../../lib/rollPlan.js';
import { getCard } from '../../lib/weapons.js';

/** As many unanswered occasions as one fight should be able to pile up. */
const QUEUE_MAX = 4;

/**
 * Whether there is any point asking about this form: a form you are not already
 * in, that is not a spent one still waiting to be shaken off, and that could
 * actually be entered. `canEnterForm` is what refuses the last of those, at 1
 * Health or less, where half of what is left rounds to nothing.
 */
function askable(character, form) {
  return !form.inForm && !form.over && canEnterForm(character, form).ok;
}

/** What a ledger row says happened, in the words the prompt leads with. */
function whyWords(row) {
  const amount = Math.abs(Math.floor(Number(row?.delta) || 0));
  const pool = row?.kind === 'willpower' ? 'Willpower' : 'Health';
  const verb = row?.kind === 'willpower' ? 'Spent' : 'Lost';
  return `${verb} ${amount} ${pool}`;
}

/**
 * The Feral Curse, asking.
 *
 * FERAL RAGE: "Whenever you lose Health or spend Willpower, you have a chance
 * to transform into your Feral Form. Each time, make an Instinct Roll with a
 * difficulty of 8. On a failure you transform. On a success the difficulty
 * increases by 1 for your next roll, and it resets to 8 on a transformation.
 * You can choose to willingly fail the roll."
 *
 * That was a card nobody played. The block on the Character tab held the
 * difficulty and offered the two presses that move it, and the roll itself was
 * left to the table for a reason that was true when it was written: the sheet
 * saw its own Health column change and never learned what changed it, so a
 * sheet that asked for this roll would have asked on every scratch and on every
 * repair. So it never asked, and in practice the curse only fired when somebody
 * at the table remembered it existed.
 *
 * Jules, 2026-09-03: "whenever the character spend willpower or take health
 * damage he should be prompt the control roll. He can choose to fail those if he
 * wants." So it asks now, and what made that possible is the ledger.
 *
 * ------------------------------------------------------------- which way it goes
 * **It is a control roll.** Jules, 2026-09-03: "with the feral curse you
 * transform when you fail not when you succeed." You throw it to hold the beast
 * in, and the beast comes out when you cannot.
 *
 * This prompt shipped the other way round earlier the same day, off the card as
 * transcribed, and the card is what had to move: its own two sentences read
 * "on a failure the difficulty increases" and "it resets to 8 on a
 * transformation", which under this reading are the same event twice and cancel.
 * The increase is on a *success*, which is also what the Developpement Notes
 * asked for before any of this was built. See talents.js and data/README.md.
 *
 * ------------------------------------------------------------------- the trigger
 * **A ledger row, and nothing else.** Every movement of Health on this sheet
 * already went through the ledger with a note saying what did it, and since
 * 2026-09-03 so does every Willpower spend — see `spendNote` in combatBar.js.
 * That is exactly the card's own two triggers, already written down, already
 * carrying the reason. So this watches the ledger for rows it has not seen
 * before and asks about the ones that spent something.
 *
 * Watching the two *columns* instead was the obvious alternative and it is the
 * wrong one. A pool column moves for reasons that are not events: a recomputed
 * ceiling clamps it, a realtime refresh from another tab rewrites it, a rest
 * fills it. The ledger only ever grows a row because something happened.
 *
 * A row that *gave* Health is not a trigger — the card says lose — so only a
 * negative delta asks. Both rows of one use ask once each, which is what "each
 * time" says: a card charging Willpower and a Blood Tithe is two things leaving
 * you at once.
 *
 * ------------------------------------------------------------------- the answers
 * Three, and the card is the reason for each:
 *
 *   roll it          the Instinct Roll against the difficulty the block holds.
 *                    Fail and the beast is out: the transformation runs through
 *                    `enterFormBody`, the same write the block's own Transform
 *                    button makes, so a form entered this way is identical to
 *                    one entered by hand and the difficulty resets to 8. Pass
 *                    and you held it in, and the difficulty climbs a step, so
 *                    the next one is harder to hold.
 *   willingly fail   the card's own last sentence, and under this reading it is
 *                    the way to give in on purpose: a failure is a
 *                    transformation whether it was thrown or chosen. Worth
 *                    noticing what the card does not offer: there is no way to
 *                    choose to *pass*. The beast can always be let out and never
 *                    reliably held in, which is the whole shape of the curse.
 *   not yet          the way out, and it moves nothing. A prompt that raised
 *                    the difficulty on an Escape keypress would be the sheet
 *                    making the choice the card gives the player.
 *
 * ------------------------------------------------------------------ when it stays quiet
 * It never asks where the answer could not be acted on: while you are already in
 * the form (you cannot transform into what you are), while a spent form is still
 * flagged and waiting to be shaken off, and at 1 Health or less, where
 * `canEnterForm` refuses because half of what is left rounds to nothing.
 *
 * It draws nothing at all for the overwhelming majority of characters, who hold
 * no set that grants a form. `feralState` returns an empty list for them on its
 * first two lines.
 */
export default function FeralCall({ character, patch }) {
  const tray = useDiceTray();
  const stack = useCardStack();
  /* The occasions still to answer, oldest first. A queue rather than one slot
     because the card says "each time", and rather than an unbounded one because
     a modal per row of a long fight is a sheet nobody can use: past the cap the
     oldest unanswered ones are dropped, and the difficulty they would have moved
     is still movable by hand on the block. */
  const [queue, setQueue] = useState([]);

  /* The freshest sheet, for the write that happens after the dice rather than
     before them. A roll takes as long as the player takes and more damage may
     have landed since the prompt opened, so the transformation is priced against
     the Health they have now. Same ref TurnCall and usePlayCard both hold. */
  const liveRef = useRef(character);
  useEffect(() => {
    liveRef.current = character;
  });

  /* Which ledger rows this sheet has already seen. Null until the first sight,
     because a sheet opening on a hundred rows of history is not a hundred things
     that just happened. Re-seeded from the column each pass, so it can never
     grow past the ledger it is tracking. */
  const seenRef = useRef(null);

  useEffect(() => {
    const rows = Array.isArray(character?.ledger) ? character.ledger : [];
    const ids = new Set(rows.map((row) => row?.id).filter(Boolean));

    if (seenRef.current === null) {
      seenRef.current = ids;
      return;
    }

    const fresh = rows.filter((row) => row?.id && !seenRef.current.has(row.id));
    seenRef.current = ids;
    if (fresh.length === 0) return;

    const spent = fresh.filter(
      (row) => (row.kind === 'health' || row.kind === 'willpower') && Number(row.delta) < 0
    );
    if (spent.length === 0) return;

    /* Asked per form, though no set but the Feral Curse grants one today and a
       character holding two would be answering two questions about one hit —
       which is what two curses would actually do. */
    const forms = feralState(character).filter((form) => askable(character, form));
    if (forms.length === 0) return;

    /* Oldest first, the order they happened in. The ledger is newest-first. */
    const asked = [...spent].reverse().flatMap((row) =>
      forms.map((form) => ({ id: form.id, why: whyWords(row) }))
    );

    setQueue((held) => [...held, ...asked].slice(-QUEUE_MAX));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.ledger]);

  /* The occasion to put in front of the reader, and the form it is about, both
     read off the sheet as it stands rather than remembered from the press: the
     difficulty may have moved on the block since, and a form entered by another
     route has nothing left to ask.

     An occasion whose form is no longer askable is *skipped* rather than pruned
     in an effect, because deleting something nobody was going to see is a render
     for nothing. Answering the one on screen clears everything skipped past with
     it. */
  const forms = feralState(character);
  const at = queue.findIndex((one) => {
    const row = forms.find((form) => form.id === one.id);
    return row ? askable(character, row) : false;
  });
  const head = at >= 0 ? queue[at] : null;
  const form = head ? forms.find((row) => row.id === head.id) : null;

  if (!head || !form) return null;

  const card = getCard(form.spec.rage?.card);
  const rolls = ATTRIBUTES.find((row) => row.key === form.talent.stat)?.label ?? 'Instinct';

  const next = () => setQueue((queued) => queued.slice(at + 1));

  /** Held it in: the roll passed, and holding it in makes the next one harder. */
  function held() {
    patch(setFeralDifficulty(liveRef.current, form, form.difficulty + form.step));
    next();
  }

  /**
   * Gave in: the roll failed, or was failed on purpose. The same write the
   * block's Transform button makes.
   *
   * And the queue goes with it, all of it: you cannot transform into what you
   * already are, the difficulty is back at the 8 the card resets it to, and
   * every occasion still waiting was a question about a change that has now
   * happened. Answering them one at a time afterwards would be asking whether
   * the beast is coming out while it is out.
   */
  function gaveIn() {
    const live = liveRef.current;
    /* Priced against the sheet as it is now, and refused if the wait has taken
       it somewhere a transformation cannot happen from. */
    const now = feralState(live).find((row) => row.id === form.id);
    if (!now || !canEnterForm(live, now).ok) return next();
    patch(enterFormBody(live, now, card?.name ?? 'Feral Rage'));
    return setQueue([]);
  }

  async function roll() {
    const link = card ? rollPlan(card, character).find((one) => one.shape === 'check') : null;
    if (!tray || !link) return;

    /* The difficulty is the block's, so the surface never asks for one: it opens
       saying what it is against, and the engine judges it. Same shape an aimed
       check takes. See armCheck in combatApply.js. */
    const result = await tray.present({
      ...link,
      name: card.name,
      note: character?.name ?? '',
      card: card.id,
      art: card.art_url ?? null,
      dc: form.difficulty,
      askDc: false,
      askVerdict: false,
      log: true,
    });

    // Closed without throwing. The question stands, and nothing has moved.
    if (!result) return;
    /* A control roll: the failure is the transformation. See the header. */
    if (isFailure(result.verdict)) gaveIn();
    else held();
  }

  return (
    <Modal
      title={card?.name ?? 'Feral Rage'}
      onClose={next}
      footer={
        <>
          <span className="pick-line">
            {queue.length - at > 1
              ? `${queue.length - at - 1} more to answer after this.`
              : 'Not yet leaves the difficulty exactly where it is.'}
          </span>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={next}>
            Not yet
          </button>
          <button
            type="button"
            className="btn btn-sub btn-sm"
            onClick={gaveIn}
            title={`The card's own last sentence: give in without throwing, and the difficulty goes back to ${form.base}`}
          >
            Willingly fail
          </button>
          {/* Refused rather than quietly inert where there is nothing to throw
              with: a sheet mounted outside the tray, or a codex that has lost
              the card this spec names. Both are impossible in the app and both
              would be a dead button if they happened. */}
          <Gated
            className="btn btn-copper btn-sm"
            why={
              tray && card ? null : 'There is no dice tray here, so this roll has to be made at the table.'
            }
            onClick={roll}
            autoFocus
          >
            Roll {rolls}
          </Gated>
        </>
      }
    >
      <p className="pick-line" style={{ marginTop: 0 }}>
        <b>{head.why}</b>, and the {form.chosen ? form.beast : 'beast'} in you felt it. Pass the
        roll and you held it in, and it is harder to hold the next time. Fail it and the beast is
        out: half the Health you have left buys twice as much Shield, and you are in your{' '}
        {form.spec.label} until it runs out.
      </p>

      <div className="feral-dc">
        <span className="feral-dc-value">{form.difficulty}</span>
        <span className="feral-dc-body">
          <span className="feral-dc-label">Difficulty</span>
          <span className="feral-dc-note">
            {form.difficulty > form.base
              ? `${form.difficulty - form.base} above the ${form.base} it starts at, and back to ${form.base} on a transformation.`
              : `The ${form.base} the card starts it at.`}
          </span>
        </span>
      </div>

      {card && (
        <button
          type="button"
          className="btn btn-minimal btn-sm feral-wide"
          onClick={() => stack?.openCard(card)}
          disabled={!stack}
        >
          Read {card.name}
        </button>
      )}
    </Modal>
  );
}
