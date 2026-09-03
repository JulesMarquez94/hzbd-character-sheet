import { useMemo, useState } from 'react';
import { FeralWindow } from './FeralPick.jsx';
import { Gated, ResourceBar } from './parts.jsx';
import { ATTRIBUTES } from '../../lib/attributes.js';
import { shieldCapFor } from '../../lib/characterModel.js';
import { enterFormBody, leaveFormBody } from '../../lib/combatBar.js';
import { canEnterForm, enterForm, setFeralDifficulty, settleForm } from '../../lib/feral.js';
import { statMath } from '../../lib/statMath.js';

/**
 * The Feral Form block: the one a talent set adds when it can turn you into
 * something.
 *
 * Straight off the Developpement Notes, which are the whole brief:
 *
 *   "The feral curse add a new block, which is the feral form block. When
 *    creating it you have select an animal type, you can insert an image link for
 *    your feral form and you select your starter martial moves. The feral form
 *    blcok o nthe caracter sheet as Image with name of the beast. A tracker that
 *    show you the DC you are at, a button that you can click to increment the DC
 *    as you succed your roll and a transform button that make the proper changes
 *    to your hcaracter as you transform such as lossing health gaining shield.
 *    The effect detasnfrom when you loose al shield or there is a butto to end
 *    trnasformation that also remove all shield."
 *
 * ---------------------------------------------------------------- one block
 * A creature needed two blocks because it has a stat block *and* a turn to
 * spend. A form has neither: its stats are the character's own, bent, and it
 * spends the character's points. What it needs is the picture, the difficulty,
 * the clock and three presses, and all of that fits one 360x640 cell.
 *
 * The starter Martial Moves the note asks for are not here, and on purpose:
 * they are a `loadout`, so they are chosen in the same panel every other picked
 * hand on this sheet is chosen in — on the Abilities tab, and on the set's own
 * block on the Advancement tab. A second chooser built for one set would be the
 * one place the sheet asked for a hand differently.
 *
 * ------------------------------------------------------------------ the clock
 * The Shield bar here is a *readout* and not a control. It is the same pool
 * block 2 draws and moves through the ledger; what this block adds is the one
 * sentence that makes it matter, which is that the form ends when it empties. So
 * it is drawn without the click that opens the ledger.
 *
 * -------------------------------------------------------- and the difficulty
 * "On a failure the difficulty increases by 1 for your next roll. It resets to 8
 * on a transformation." The roll itself is never asked for here, for the reason
 * every other die on this sheet is the table's: the sheet is told that Health
 * moved and never what moved it, so a sheet that asked for a Feral Rage roll
 * would ask on every scratch. It holds the number and offers the presses.
 *
 * The note asks for a button that increments the difficulty "as you succed your
 * roll", and the card says the increase is on a *failure*. The card wins, and the
 * button is labelled in the card's own terms. Flagged in data/README.md.
 */
export default function FeralBlock({ character, form, patch, readOnly = false }) {
  const [editing, setEditing] = useState(false);

  const { spec } = form;
  const cap = shieldCapFor(character);
  /* Where that cap came from, for the bar's hover. Worked out once: the map is
     the whole tab's and this block reads one entry out of it. */
  const capMath = useMemo(() => statMath(character).shield_cap, [character]);
  const can = canEnterForm(character, form);
  /* What transforming would cost, worked out before it is pressed rather than
     reported after: "you lose half your current Health" is not a sum anybody
     should be doing in their head while it happens. */
  const preview = enterForm(character, form, { cap });
  const rolls = ATTRIBUTES.find((row) => row.key === form.talent.stat)?.label ?? 'Instinct';
  const restWord = spec.ends === 'long' ? 'Long Rest' : 'Short Rest';

  return (
    <div className="cell-scroll feral-block">
      <div className="block-head">
        <span className="stat-category-label">{spec.label}</span>
        <span className="spacer" />
        <span className={`block-count${form.inForm ? ' is-feral' : ''}`}>
          {form.inForm ? 'In form' : form.over ? 'Spent' : 'Held in'}
        </span>
        {!readOnly && (
          <button
            type="button"
            className="minion-edit"
            onClick={() => setEditing(true)}
            title={form.named ? `Change ${form.name}` : 'Name your form and choose your beast'}
          >
            {form.named && form.chosen ? 'Edit' : 'Name it'}
          </button>
        )}
      </div>

      {/* ---------- WHAT IT IS ----------
          "The feral form block on the character sheet as Image with name of the
          beast." The plate and the name, in the same shapes a creature's block
          uses, because a picture of a thing you turn into and a picture of a
          thing standing beside you are the same 72px square. */}
      <div className="minion-id">
        <span className="minion-plate">
          {form.portrait_url ? (
            <img src={form.portrait_url} alt="" />
          ) : (
            <span className="minion-plate-empty" aria-hidden="true" />
          )}
        </span>

        <span className="minion-id-body">
          <span className="minion-name">{form.named ? form.name : `Unnamed ${spec.noun}`}</span>

          <span className="minion-tags">
            {form.chosen ? (
              <span className="minion-chip feral-chip-beast">{form.beast}</span>
            ) : (
              <span className="minion-chip is-open">No beast chosen</span>
            )}
            <span className="minion-chip">{form.talent.name}</span>
            {form.inForm && <span className="minion-chip is-feral">Transformed</span>}
          </span>
        </span>
      </div>

      {/* ---------- THE CLOCK ----------
          Only while it is running, or while a spent one is still flagged. There
          is nothing to say about a Shield pool to somebody not wearing one:
          block 2 already draws that bar, and this block's claim on it is only
          the sentence about what emptying it does. */}
      {(form.inForm || form.over) && (
        <>
          <div className="stat-category-label">The hide</div>
          {/* The ceiling's own arithmetic on hover, because this is the block
              where it matters most: BESTIAL SENSE is what makes the pool the
              whole of maximum Health rather than half, and this is the bar that
              whole is holding the form up. */}
          <ResourceBar
            label="Shield"
            current={form.shield}
            max={cap}
            color="var(--stat-shield)"
            title="The form ends when this is gone"
            math={capMath}
          />
          <p className="feral-line">
            {form.inForm
              ? `The form ends when this empties, or on a ${restWord}.`
              : 'The Shield is gone, so the form is over. Shake it off below.'}
          </p>
        </>
      )}

      {/* ---------- THE DIFFICULTY ---------- */}
      <div className="stat-category-label">Feral Rage</div>
      <div className="feral-dc">
        <span className="feral-dc-value">{form.difficulty}</span>
        <span className="feral-dc-body">
          <span className="feral-dc-label">Difficulty</span>
          <span className="feral-dc-note">
            {form.difficulty > form.base
              ? `${form.difficulty - form.base} above the ${form.base} it starts at.`
              : `Lose Health or spend Willpower, and roll ${rolls} against it.`}
          </span>
        </span>
      </div>

      {!readOnly && (
        <div className="feral-tools">
          <button
            type="button"
            className="btn btn-sub btn-sm"
            onClick={() => patch(setFeralDifficulty(character, form, form.difficulty + form.step))}
            title="On a failure the difficulty increases by 1 for your next roll"
          >
            Held it in, +{form.step}
          </button>
          <button
            type="button"
            className="btn btn-minimal btn-sm"
            disabled={form.difficulty <= form.base}
            onClick={() => patch(setFeralDifficulty(character, form, form.base))}
            title={`Back to the ${form.base} the card starts it at`}
          >
            Back to {form.base}
          </button>
        </div>
      )}

      {/* ---------- THE TRANSFORMATION ----------
          One press either way, and each one says what it is about to cost before
          it costs it. Transforming resets the difficulty too, because that is
          FERAL RAGE's own next sentence and every way into the form goes through
          `enterForm`, so there is nowhere for it to be forgotten. */}
      <div className="stat-category-label">The change</div>

      {form.inForm ? (
        <>
          <ul className="feral-does">
            <li>Advantage on every attack roll.</li>
            {spec.empower && (
              <li>
                {spec.empower.label ?? spec.empower.weapon} attacks are Empowered by{' '}
                {spec.empower.amount}.
              </li>
            )}
            {form.armorShare > 0 && <li>Armor up by half your {rolls}.</li>}
            {spec.locks?.items && !form.opened?.items && <li>No items, on the belt or off it.</li>}
            {spec.locks?.foreign && !form.opened?.foreign && (
              <li>No abilities or spells but this set&rsquo;s.</li>
            )}
            {form.opened?.foreign && <li>Your own abilities and spells still work.</li>}
          </ul>

          {!readOnly && (
            <button
              type="button"
              className="btn btn-minimal btn-sm feral-wide"
              onClick={() => patch(leaveFormBody(character, form))}
              title={
                form.shield > 0
                  ? `Ending it throws away ${form.shield} Shield`
                  : 'Ending it clears the form'
              }
            >
              End the form{form.shield > 0 ? `, and ${form.shield} Shield` : ''}
            </button>
          )}
        </>
      ) : (
        <>
          <p className="feral-line">
            {can.ok
              ? `${preview.spend} Health for ${preview.granted} Shield` +
                (preview.clipped > 0
                  ? `. Twice the price is ${preview.owed}, and the cap at ${cap} takes ${preview.clipped} of it.`
                  : ', which is twice what it cost.')
              : can.reason}
          </p>

          {!readOnly &&
            (form.over ? (
              <button
                type="button"
                className="btn btn-sub btn-sm feral-wide"
                onClick={() => patch(settleForm(character, form))}
                title="Clear the flag. The form was already over when the Shield ran out."
              >
                Shake it off
              </button>
            ) : (
              <Gated
                className="btn btn-sub btn-sm feral-wide feral-transform"
                why={can.ok ? null : can.reason ?? 'You cannot turn right now.'}
                title="The Feral Rage roll passed. Apply it."
                onClick={() => patch(enterFormBody(character, form, 'Feral Rage'))}
              >
                Transform
              </Gated>
            ))}

          {/* At Rank 1 the beast cannot be *called*, only rolled for: FERAL RAGE
              lets a Feral Cursed choose to fail and never to pass. So a rank that
              has CALL THE BEAST is told where to find it rather than given a
              second button here that charges nothing. */}
          {form.willing && !form.over && (
            <p className="feral-line feral-line-quiet">
              Or play Call the Beast off your Quick Bar to force it with no roll.
            </p>
          )}
        </>
      )}

      {editing && (
        <FeralWindow
          character={character}
          form={form}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

/* The two writes a transformation makes are not here. They are in combatBar.js
   beside `spendUse`, because there are two ways into the form — this block's
   Transform button and CALL THE BEAST on the quick bar — and a form entered one
   way has to be identical to one entered the other. See `enterFormBody` there. */
