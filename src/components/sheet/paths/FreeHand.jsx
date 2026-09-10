import { useState } from 'react';
import LevelLedger from '../LevelLedger.jsx';
import LoreTab from '../LoreTab.jsx';
import { Gated } from '../parts.jsx';
import { CardStackProvider } from '../../CardStack.jsx';
import { openChoices } from '../../../lib/levelPicks.js';

/**
 * The free hand: making a character with every chooser open at once, in two
 * pages. The first of the four ways in, and the only one that existed before
 * there were four. See src/lib/creationPaths.js.
 *
 * The dashboard box asks for a name and a campaign, because those are the only
 * two things about a character that are not a choice with its own chooser.
 * Everything else is one, and every one of them already exists on the
 * Advancement tab, so this page is the level-1 block and nothing else: the same
 * panels, in the same order, writing to the same row.
 *
 * The second page is the lore, which is the part nobody can do for you and the
 * part most people want to do last.
 *
 * There is no draft and no submit. The row exists from the moment the dashboard
 * made it, every panel writes straight to it, and walking away halfway leaves a
 * half-made character rather than nothing at all. Finishing only means opening
 * the sheet.
 *
 * ---------------------------------------------------------- and it waits on you
 * Finishing *means* it, though. Jules, 2026-09-10: "When player need to make
 * choices, like spells, martial move, or other. Make sure they need to make
 * those change before the confirm/finish." Every chooser on the first step now
 * refuses to close on a question it left open, and this is the same law at the
 * page's own edge: the button out of here is shut while anything level 1 handed
 * over is unanswered, and it says how many.
 *
 * Not a trap. The header is above this page the whole way through, and leaving
 * by it is what it always was: a half-made character waiting in the vault.
 */
const STEPS = [
  { key: 'level1', title: 'The character', line: 'Everything level 1 hands you.' },
  { key: 'lore', title: 'Their story', line: 'The part the rules cannot roll for.' },
];

/** The only level this page makes, and the one its ledger is drawn at. */
const CREATION_LEVEL = 1;

export default function FreeHand({ character, patch, onDone, unit = 'metric' }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  /* What level 1 asked and nobody has answered: a set with no spells chosen, a
     lineage that has not settled its blood, a nameless draconic ally. Counted by
     the same `openChoices` the Advancement tab badges itself with, so the page
     and the tab can never disagree about whether a character is finished. */
  const waiting = openChoices(character, CREATION_LEVEL);

  return (
    <div className="tab-narrow creation">
      <div className="panel">
        <header className="creation-head">
          <span className="creation-eyebrow">New character</span>
          <h2 className="creation-title">{character.name || 'Unnamed Drifter'}</h2>
          <p className="creation-line">{current.line}</p>

          <ol className="creation-steps">
            {STEPS.map((entry, index) => (
              <li key={entry.key} className={`creation-step${index === step ? ' is-here' : ''}${index < step ? ' is-done' : ''}`}>
                <button type="button" onClick={() => setStep(index)}>
                  <span className="creation-step-n">{index + 1}</span>
                  <span className="creation-step-name">{entry.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </header>

        {step === 0 && (
          <>
            <div className="frame">
              <h3 className="frame-heading">Identity</h3>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="new-character-name">
                    Name
                  </label>
                  <input
                    className="form-input"
                    id="new-character-name"
                    value={character.name || ''}
                    onChange={(e) => patch({ name: e.target.value })}
                    onBlur={(e) => !e.target.value.trim() && patch({ name: 'Unnamed Drifter' })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="new-character-campaign">
                    Campaign
                  </label>
                  <input
                    className="form-input"
                    id="new-character-campaign"
                    value={character.campaign || ''}
                    placeholder="The Drowned Season"
                    onChange={(e) => patch({ campaign: e.target.value })}
                  />
                </div>
              </div>

              <p className="frame-foot">
                Both can be changed later, from the Advancement tab.
              </p>
            </div>

            <CardStackProvider character={character}>
              <LevelLedger character={character} level={1} patch={patch} unit={unit} />
            </CardStackProvider>
          </>
        )}
      </div>

      {step === 1 && <LoreTab character={character} patch={patch} />}

      <div className="creation-foot">
        {step > 0 && (
          <button type="button" className="btn btn-minimal btn-sm" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        <span className="spacer" />
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn-copper btn-sm" onClick={() => setStep(step + 1)}>
            Next: {STEPS[step + 1].title}
          </button>
        ) : (
          /* The one confirm this page has, and it waits on the first step. The
             reason names the step rather than the question, because the step rail
             above is one tap and the questions are already badged where they
             stand. */
          <Gated
            className="btn btn-copper btn-sm"
            why={
              waiting > 0
                ? `${
                    waiting === 1 ? 'One choice is' : `${waiting} choices are`
                  } still open on the first step. Answer ${
                    waiting === 1 ? 'it' : 'them'
                  } and this opens.`
                : null
            }
            onClick={onDone}
          >
            {waiting > 0 ? `${waiting} still open` : 'Open the sheet'}
          </Gated>
        )}
      </div>
    </div>
  );
}
