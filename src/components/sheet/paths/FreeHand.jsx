import { useState } from 'react';
import CampaignJoin from '../../campaign/CampaignJoin.jsx';
import LevelLedger from '../LevelLedger.jsx';
import LoreTab from '../LoreTab.jsx';
import { Gated } from '../parts.jsx';
import { CardStackProvider } from '../../CardStack.jsx';
import { levelForXp } from '../../../lib/characterModel.js';
import { creationPath } from '../../../lib/creationPaths.js';
import { openChoices } from '../../../lib/levelPicks.js';
import {
  madeAtLevel,
  startingGrants,
  startingPotions,
  startingRing,
} from '../../../lib/startingLevel.js';

/**
 * The free hand: making a character with every chooser open at once, in two
 * pages. The only way in that existed before there were four, and since
 * 2026-09-12 the way in for a character who starts **above level 1**. Jules:
 * "change the freehand pick to be made when you are creating character above
 * level 1." See src/lib/creationPaths.js.
 *
 * The dashboard box asks for a name, the level to start at and, for an
 * account, a campaign's join code, because those are the only things about a
 * character that are not a choice with its own chooser. Everything else is
 * one, and every one of them already exists on the Advancement tab, so this
 * page is the level ledger drawn at the character's own level and nothing
 * else: the same panels, in the same order, writing to the same row. A start
 * at level 6 is six blocks. A start at level 1, which only a URL reaches now,
 * is the one block it always was.
 *
 * What the level handed over besides its choices (the coins, the potions, the
 * ring and the tier the kit will come at) is printed in a frame of its own,
 * read off the ledger's "Made at level N" note rather than off a column. See
 * src/lib/startingLevel.js.
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
 * page's own edge: the button out of here is shut while anything the levels
 * handed over is unanswered, and it says how many.
 *
 * Not a trap. The header is above this page the whole way through, and leaving
 * by it is what it always was: a half-made character waiting in the vault.
 */
const STEPS = [
  { key: 'levels', title: 'The character' },
  { key: 'lore', title: 'Their story', line: 'The part the rules cannot roll for.' },
];

export default function FreeHand({ character, patch, onDone, unit = 'metric' }) {
  const path = creationPath('freeform');
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  /* The level the ledger is drawn at: the character's own, which a start above
     level 1 put at the threshold before this page ever opened. */
  const level = levelForXp(character.xp);

  /* What the levels asked and nobody has answered: a set with no spells chosen,
     a lineage that has not settled its blood, a nameless draconic ally, a skill
     not yet learned at level 3. Counted by the same `openChoices` the
     Advancement tab badges itself with, so the page and the tab can never
     disagree about whether a character is finished. */
  const waiting = openChoices(character, level);

  /* What the start handed over, for a character made above level 1. */
  const made = madeAtLevel(character);
  const ring = startingRing(character);
  const grants = made ? startingGrants(made, ring?.key ?? null) : [];
  const potions = made ? startingPotions(made) : 0;

  const line =
    step === 0
      ? level > 1
        ? `Everything levels 1 to ${level} hand you.`
        : 'Everything level 1 hands you.'
      : current.line;

  return (
    <div className="tab-narrow creation">
      <div className="panel">
        <header className="creation-head">
          <span className="creation-eyebrow">
            New character · {path.title}
            {level > 1 ? ` · Level ${level}` : ''}
          </span>
          <h2 className="creation-title">{character.name || 'Unnamed Drifter'}</h2>
          <p className="creation-line">{line}</p>

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

                {/* The campaign is a join code, and redeeming it is the link to
                    the table. See CampaignJoin.jsx. */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <CampaignJoin character={character} patch={patch} id="new-character-campaign" />
                </div>
              </div>

              <p className="frame-foot">
                The name can be changed later, from the Advancement tab, and a table can be joined
                from there too.
              </p>
            </div>

            {made && (
              <div className="frame">
                <h3 className="frame-heading">Made at level {made}</h3>
                <ul className="start-grants">
                  {grants.map((row) => (
                    <li key={row.id}>
                      <b>{row.label}</b>
                      <span>{row.detail}</span>
                    </li>
                  ))}
                </ul>
                <p className="frame-foot">
                  {`The coins are in your ledger${potions > 0 ? ' and the potions in your pack' : ''}${
                    ring ? ', and the ring is already on' : ''
                  }. The armor arrives with your background's kit, in the level 1 block below.`}
                </p>
              </div>
            )}

            <CardStackProvider character={character}>
              <LevelLedger character={character} level={level} patch={patch} unit={unit} />
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
