import { useEffect, useMemo, useRef, useState } from 'react';
import AttributeSpreadPick from '../AttributePick.jsx';
import BackgroundPick from '../BackgroundPick.jsx';
import LineagePick from '../LineagePick.jsx';
import LoreTab from '../LoreTab.jsx';
import PickBlock from '../PickBlock.jsx';
import TalentPick from '../TalentBlock.jsx';
import { Gated } from '../parts.jsx';
import { CardStackProvider } from '../../CardStack.jsx';
import useCodexArt from '../../useCodexArt.js';
import { ATTRIBUTES, ATTRIBUTE_BASE, attributeLabel } from '../../../lib/attributes.js';
import { formatNumber } from '../../../lib/characterModel.js';
import { creationPath } from '../../../lib/creationPaths.js';
import { getItem } from '../../../lib/items.js';
import { openChoices } from '../../../lib/levelPicks.js';
import { getLineage } from '../../../lib/lineages.js';
import { rankInfo } from '../../../lib/talents.js';
import {
  STEPS,
  WALKTHROUGH_LEVEL,
  WALKTHROUGH_PATH,
  levelOneState,
  progressOf,
  stepIndex,
  storedStep,
  walkthroughProgress,
} from '../../../lib/walkthrough.js';
import {
  AttributesLesson,
  BackgroundLesson,
  LineageLesson,
  SheetLesson,
  StoryLesson,
  TalentLesson,
} from './WalkthroughLessons.jsx';

/** The lesson for each step, by the step's key. See WalkthroughLessons.jsx. */
const LESSONS = {
  attributes: AttributesLesson,
  talent: TalentLesson,
  lineage: LineageLesson,
  background: BackgroundLesson,
  story: StoryLesson,
  sheet: SheetLesson,
};

/**
 * The Walkthrough: making a character one choice at a time, with the rules
 * beside each one.
 *
 * The third of the four ways in, and the one for a first character. Jules,
 * 2026-09-12: "help someone create a character while explaining the system ...
 * it takes step by step each element of the character creation. Explain the
 * rules and explain how the block work."
 *
 * Six steps, one screen each. Every screen is two columns: the lesson on one
 * side, which says what the rule is, recommends a choice and says how the panel
 * beside it works, and the panel itself on the other. **The panels are the level-1 block's own**, the
 * same AttributeSpreadPick, TalentPick, LineagePick and BackgroundPick the
 * Advancement tab draws and the free hand opens all at once, so what somebody
 * learns to use here is exactly the tab they are handed at the end. Nothing
 * about a choice is decided in this file. See src/lib/walkthrough.js for the
 * steps, the order and the reasoning behind it.
 *
 * ------------------------------------------------------------ it remembers
 * Every choice writes straight to the row, the way every path's does. This
 * path also writes *where you are*: the step's key goes into the `creation`
 * column whenever it changes, so closing the tab, changing device or coming
 * back a week later reopens the walk on the screen it was left at, and the
 * dashboard card can say so and offer the way back. Finishing clears it (see
 * `onDone` in CharacterSheet.jsx), and `finishing` keeps this screen from
 * writing it straight back while the last flush is on its way out.
 *
 * ------------------------------------------------------------- not a trap
 * The rail goes anywhere in any order and nothing is locked behind the step
 * before it. The one gate is the way out: the sheet will not open while a
 * level-1 question is unanswered, which is the same law the free hand and the
 * Crossroads keep, and the last step names the steps still waiting and sends
 * you back to them. The site header stays above this screen the whole way
 * through, so leaving is what it always was: a half-made character in the
 * vault, now with a bookmark in it.
 */
export default function Walkthrough({ character, patch, onDone, unit = 'metric' }) {
  const path = creationPath(WALKTHROUGH_PATH);

  /* Where the row says this walk stopped, and where the screen is. The screen
     opens on the stored step, and a stored step nothing recognises reads as the
     first one. */
  const stored = storedStep(character);
  const [at, setAt] = useState(() => stepIndex(stored));
  const step = STEPS[at];

  /* True from the moment the way out is pressed. The sheet clears the progress
     record on its way to the tabs, and without this flag the effect below would
     see "stored is not the current step" and write it straight back. */
  const finishing = useRef(false);

  useEffect(() => {
    if (finishing.current || stored === step.key) return;
    patch({ creation: progressOf(step.key) });
  }, [stored, step.key, patch]);

  /* One reading of what level 1 asks, shared by the rail, the panel on this step
     and the summary on the last one. See levelOneState. */
  const state = useMemo(() => levelOneState(character), [character]);
  const progress = useMemo(() => walkthroughProgress(character, state), [character, state]);

  /* Counted by the same `openChoices` the Advancement tab badges itself with, so
     this screen and that tab can never disagree about whether a character is
     finished. */
  const waiting = openChoices(character, WALKTHROUGH_LEVEL);
  const owed = progress.filter((entry) => entry.open > 0);

  /* Each step opens at the top of the canvas. The sheet's canvas is the box that
     scrolls, so the screen scrolls itself into view rather than the window. Not
     on the first paint, which is already at the top. */
  const rootRef = useRef(null);
  const painted = useRef(false);
  useEffect(() => {
    if (!painted.current) {
      painted.current = true;
      return;
    }
    rootRef.current?.scrollIntoView({ block: 'start' });
  }, [at]);

  /** Move the walk, by index or by step key. */
  function go(target) {
    const index = typeof target === 'number' ? target : stepIndex(target);
    setAt(Math.min(STEPS.length - 1, Math.max(0, index)));
  }

  function finish() {
    finishing.current = true;
    onDone();
  }

  const Lesson = LESSONS[step.key];
  const last = at === STEPS.length - 1;

  return (
    <CardStackProvider character={character}>
      <div
        className="tab-narrow creation walkthrough"
        style={{ '--path-accent': path.accent }}
        ref={rootRef}
      >
        <div className="panel">
          <header className="creation-head wt-head">
            <span className="creation-eyebrow">New character · {path.title}</span>
            <h2 className="creation-title">{character.name || 'Unnamed Drifter'}</h2>
            <p className="creation-line">{step.line}</p>

            <StepRail at={at} progress={progress} onGo={go} />
          </header>
        </div>

        <div className="wt-body">
          <aside className="wt-lesson" aria-label={`${step.title}: the rules`}>
            <span className="wt-lesson-eyebrow">
              Step {at + 1} of {STEPS.length}
              {step.optional ? ' · Optional' : ''}
            </span>
            <h3 className="wt-lesson-title">{step.title}</h3>
            <Lesson character={character} state={state} progress={progress} step={step} go={go} unit={unit} />
          </aside>

          <div className="wt-work">
            <Work
              step={step}
              character={character}
              patch={patch}
              state={state}
              progress={progress}
              go={go}
              unit={unit}
            />
          </div>
        </div>

        <div className="creation-foot">
          <button
            type="button"
            className="btn btn-minimal btn-sm"
            disabled={at === 0}
            onClick={() => go(at - 1)}
          >
            Back
          </button>
          <span className="wt-where">
            {at + 1} / {STEPS.length}
          </span>
          <span className="spacer" />
          {last ? (
            /* The one gate this screen has, and it wears the same reason the free
               hand's does, said by step rather than by question: the rail above is
               one tap and the last lesson lists the same steps with a button each. */
            <Gated
              className="btn btn-copper btn-sm"
              why={
                waiting > 0
                  ? `${waiting === 1 ? 'One choice is' : `${waiting} choices are`} still open, on ${listAnd(
                      owed.map((entry) => entry.step.title)
                    )}. Answer ${waiting === 1 ? 'it' : 'them'} and this opens.`
                  : null
              }
              onClick={finish}
            >
              {waiting > 0 ? `${waiting} still open` : 'Open the sheet'}
            </Gated>
          ) : (
            <button type="button" className="btn btn-copper btn-sm" onClick={() => go(at + 1)}>
              Next: {STEPS[at + 1].title}
            </button>
          )}
        </div>
      </div>
    </CardStackProvider>
  );
}

/* ------------------------------------------------------------------ the rail */

/**
 * The seven steps as pills, every one of them a button. A step that asks
 * something wears a tick once it is answered; a step that only teaches wears
 * its number and nothing else, because there is nothing about it to finish.
 */
function StepRail({ at, progress, onGo }) {
  return (
    <ol className="creation-steps wt-steps" aria-label="The steps of the walkthrough">
      {progress.map((entry, index) => (
        <li
          key={entry.step.key}
          className={`creation-step${index === at ? ' is-here' : ''}${entry.done ? ' is-done' : ''}`}
        >
          <button
            type="button"
            onClick={() => onGo(index)}
            aria-current={index === at ? 'step' : undefined}
            title={
              entry.done
                ? `${entry.step.title}: answered`
                : entry.open > 0
                  ? `${entry.step.title}: ${entry.open === 1 ? 'one question' : `${entry.open} questions`} still open`
                  : entry.step.title
            }
          >
            <span className="creation-step-n">{entry.done ? '✓' : index + 1}</span>
            <span className="creation-step-name">{entry.step.title}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ the work */

/**
 * The panel a step asks its question in. Every one of the four choices is the
 * level-1 block's own panel, drawn with the same arguments LevelLedger.jsx hands
 * it, and `foldable={false}` on all four: on the Advancement tab a finished panel
 * folds itself away to keep a twelve-level ledger readable, and here it is the
 * only thing in its column and the lesson beside it is still talking about the
 * cards it printed.
 */
function Work({ step, character, patch, state, progress, go, unit }) {
  switch (step.key) {
    case 'attributes':
      return (
        <AttributeSpreadPick
          character={character}
          state={state.picks}
          patch={patch}
          level={WALKTHROUGH_LEVEL}
          unit={unit}
          foldable={false}
        />
      );

    case 'talent': {
      const { talents, asks } = state;
      const slot = talents.slots.find((entry) => entry.level === WALKTHROUGH_LEVEL) ?? null;
      /* Whether the set still owes a question it granted: a hand of spells, a
         creature's name, a shape, a bargain, a vow. Read the way LevelLedger reads
         it, so the panel's chip and the rail's tick agree. */
      const owing = asks.some((row) => row.kind !== 'talent' && row.talent && !row.answered);
      if (!slot) return null;
      return (
        <TalentPick
          slot={slot}
          list={talents.talents}
          character={character}
          patch={patch}
          isOpen={talents.openLevel === WALKTHROUGH_LEVEL}
          undoAlso={talents.filledLevels.filter((filled) => filled > WALKTHROUGH_LEVEL)}
          openAt={talents.openLevel}
          owing={owing}
          foldable={false}
        />
      );
    }

    case 'lineage':
      return (
        <LineagePick value={character.lineage} character={character} patch={patch} foldable={false} />
      );

    case 'background':
      return <BackgroundPick character={character} patch={patch} foldable={false} />;

    case 'story':
      return <LoreTab character={character} patch={patch} />;

    case 'sheet':
      return <Summary character={character} state={state} progress={progress} go={go} />;

    default:
      return null;
  }
}

/* --------------------------------------------------------------- the summary */

/**
 * The character read back, before the sheet opens: the four choices as the
 * panels they were made in, each folded to what it holds and each with the way
 * back to its step. Drawn in the level-1 block's own colours, so the summary
 * reads as the Advancement tab it is about to become.
 */
function Summary({ character, state, progress, go }) {
  const by = Object.fromEntries(progress.map((entry) => [entry.step.key, entry]));
  const { talents, picks, background } = state;
  const slot = talents.slots.find((entry) => entry.level === WALKTHROUGH_LEVEL) ?? null;
  const lineage = getLineage(character.lineage);
  const writtenLineage = String(character.lineage ?? '').trim();
  const novice = rankInfo(1)?.title ?? 'Novice';
  const { boosts, totals } = picks;
  const kit = background.kit;

  const stateOf = (entry, chosen) =>
    !chosen ? 'Waiting on you' : entry.done ? 'Chosen' : 'Half done';

  return (
    <>
      <PickBlock
        kind="attribute"
        title="Attributes"
        state={boosts ? `+2 ${attributeLabel(boosts.major)} · +1 ${attributeLabel(boosts.minor)}` : 'Waiting on you'}
        done={by.attributes.done}
      >
        <div className="attr-spread">
          {ATTRIBUTES.map((attribute) => {
            const bonus = totals[attribute.key] - ATTRIBUTE_BASE;
            return (
              <div
                key={attribute.key}
                className={`attr-spread-tile${bonus ? ' is-boosted' : ''}`}
                style={{ '--attr-color': attribute.color }}
              >
                <span className="attr-spread-label">{attribute.label}</span>
                <span className="attr-spread-value">{totals[attribute.key]}</span>
                <span className="attr-spread-foot">
                  {bonus ? `${ATTRIBUTE_BASE} + ${bonus}` : 'base'}
                </span>
              </div>
            );
          })}
        </div>
        <Change done={by.attributes.done} onClick={() => go('attributes')} />
      </PickBlock>

      <PickBlock kind="talent" title="Talent set" state={stateOf(by.talent, slot?.filled)} done={by.talent.done}>
        {slot?.filled ? (
          <Face
            art={slot.talent?.art}
            name={slot.entry.name}
            tag={`Rank ${slot.rank} · ${novice}`}
            line={slot.talent?.tagline}
          />
        ) : (
          <p className="pick-line">No set chosen yet.</p>
        )}
        {slot?.filled && by.talent.open > 0 && (
          <p className="pick-line">
            {slot.entry.name} still asks you something. Go back to the step and answer it.
          </p>
        )}
        <Change done={by.talent.done} onClick={() => go('talent')} />
      </PickBlock>

      <PickBlock kind="lineage" title="Lineage" state={stateOf(by.lineage, writtenLineage)} done={by.lineage.done}>
        {lineage ? (
          <Face art={lineage.art} name={lineage.name} line={lineage.tagline} />
        ) : writtenLineage ? (
          <Face name={writtenLineage} line="Written in by hand." />
        ) : (
          <p className="pick-line">No lineage chosen yet.</p>
        )}
        {lineage && by.lineage.open > 0 && (
          <p className="pick-line">{lineage.name} leaves a question open. Go back and answer it.</p>
        )}
        <Change done={by.lineage.done} onClick={() => go('lineage')} />
      </PickBlock>

      <PickBlock
        kind="background"
        title="Background"
        state={stateOf(by.background, background.written)}
        done={by.background.done}
      >
        {background.background ? (
          <>
            <Face
              art={background.background.art}
              name={background.background.name}
              line={background.background.tagline}
            />
            {background.skills.length > 0 && (
              <div className="xr-chips">
                {background.skills.map((skill) => (
                  <span key={skill.id} className="tag tag-muted">
                    {skill.name}
                  </span>
                ))}
              </div>
            )}
            {background.taken && kit ? (
              <ul className="xr-kit">
                <li>
                  <b>Worn:</b> {kit.armorSet}.
                </li>
                <li>
                  <b>In hand:</b> {kit.weapons.map((id) => getItem(id)?.name ?? id).join(' and ')}.
                </li>
                <li>
                  <b>The purse:</b> {formatNumber(kit.coins)} ¢ and {formatNumber(kit.supplies)}{' '}
                  Supplies.
                </li>
              </ul>
            ) : (
              <p className="pick-line">The starting kit has not been taken yet.</p>
            )}
          </>
        ) : background.written ? (
          <Face name={background.written} line="Written in by hand." />
        ) : (
          <p className="pick-line">No background chosen yet.</p>
        )}
        <Change done={by.background.done} onClick={() => go('background')} />
      </PickBlock>
    </>
  );
}

/** The way back to a step from its summary, named for what is left to do there. */
function Change({ done, onClick }) {
  return (
    <div className="pick-tools pick-tools-tight">
      <button type="button" className="btn btn-sub btn-sm" onClick={onClick}>
        {done ? 'Change' : 'Go to the step'}
      </button>
    </div>
  );
}

/** A plate, a name and a line: the shape a chosen ancestry takes on the tab. */
function Face({ art = null, name, line = null, tag = null }) {
  const url = useCodexArt()(art);

  return (
    <div className="pick-face">
      {url ? (
        <span className="pick-art" style={{ backgroundImage: `url(${url})` }} aria-hidden="true" />
      ) : (
        <span className="pick-art pick-art-empty" aria-hidden="true" />
      )}
      <div className="pick-face-body">
        <span className="pick-value">{name}</span>
        {tag && <span className="xr-face-tag">{tag}</span>}
        {line && <p className="pick-line">{line}</p>}
      </div>
    </div>
  );
}

/** "Attributes", "Attributes and Lineage", "Attributes, Lineage and Background". */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
