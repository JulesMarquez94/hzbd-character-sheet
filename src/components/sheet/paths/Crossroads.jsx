import { useEffect, useMemo, useState } from 'react';
import PickBlock from '../PickBlock.jsx';
import useCodexArt from '../../useCodexArt.js';
import { useAuth } from '../../../context/auth-context.js';
import { ATTRIBUTES, ATTRIBUTE_BASE, attributeLabel } from '../../../lib/attributes.js';
import { attributeTotals, lineageBonuses } from '../../../lib/levelPicks.js';
import { creationPath } from '../../../lib/creationPaths.js';
import { STAGES } from '../../../lib/crossroadsPool.js';
import {
  CROSSROADS_LEVEL,
  answer,
  applyOutcome,
  back,
  forgetRun,
  loadRun,
  newRun,
  repair,
  resolve,
  saveRun,
  walk,
  weightsOf,
} from '../../../lib/crossroads.js';
import { formatNumber } from '../../../lib/characterModel.js';
import { getItem } from '../../../lib/items.js';
import { openPicks } from '../../../lib/lineages.js';
import { loadoutOf } from '../../../lib/loadouts.js';
import { minionOf } from '../../../lib/minions.js';
import { feralOf } from '../../../lib/feral.js';
import { pactOf } from '../../../lib/pact.js';
import { enchantingOf, rankInfo } from '../../../lib/talents.js';

/**
 * The Crossroads: making a character by answering for them.
 *
 * The fourth of the four ways in, and the one for anybody who would rather be
 * asked about a life than shown a wall of choosers. Eight questions in seven
 * stages, one at a time, each a fork with a handful of answers. Nothing is
 * written to the row while you answer; the points land in the run, and the run
 * is two small values in this tab's own storage so a refresh does not lose it.
 * See src/lib/crossroads.js for the walk, the count and the patch.
 *
 * When the last question is answered the screen turns into the reveal: who the
 * answers add up to, laid out in the same panels the level-1 block uses and in
 * the same colours, so what you are looking at is recognisably the Advancement
 * tab you are about to be handed. Taking it writes the whole character in one
 * patch and opens the sheet. Walking it again draws a new run.
 *
 * `patch` and `onDone` are the sheet's, the same ones the free hand writes and
 * finishes with. The screen never writes anything of its own.
 */
export default function Crossroads({ character, patch, onDone }) {
  const path = creationPath('crossroads');

  /* Picked up where a refresh left it, and cut back to what the pool still
     honours if a question it named has since changed. */
  const [run, setRun] = useState(() => repair(loadRun(character.id) ?? newRun()));
  const [taking, setTaking] = useState(false);

  const view = useMemo(() => walk(run), [run]);
  const outcome = useMemo(() => (view.done ? resolve(run) : null), [run, view.done]);

  useEffect(() => {
    saveRun(character.id, run);
  }, [character.id, run]);

  function take() {
    if (!outcome || taking) return;
    setTaking(true);
    /* One write, then out. The sheet's onDone flushes what is pending before it
       navigates, so the character is on the row before the row is reopened. */
    patch(applyOutcome(character, outcome));
    forgetRun(character.id);
    onDone();
  }

  return (
    <div className="tab-narrow creation crossroads" style={{ '--path-accent': path.accent }}>
      <div className="panel">
        <header className="creation-head">
          <span className="creation-eyebrow">New character · {path.title}</span>
          <h2 className="creation-title">{character.name || 'Unnamed Drifter'}</h2>
          <p className="creation-line">
            {view.done ? 'Every question answered. This is who you became.' : path.line}
          </p>
          <StageRail view={view} />
        </header>

        {view.done && outcome ? (
          <Reveal outcome={outcome} />
        ) : view.current ? (
          <Question
            step={view.current}
            view={view}
            onPick={(optionId) => setRun((held) => answer(held, optionId))}
          />
        ) : null}
      </div>

      <div className="creation-foot">
        <button
          type="button"
          className="btn btn-minimal btn-sm"
          disabled={view.answered === 0 || taking}
          onClick={() => setRun((held) => back(held))}
        >
          Back
        </button>
        <span className="spacer" />
        <button
          type="button"
          className="btn btn-minimal btn-sm"
          disabled={taking}
          onClick={() => setRun(newRun())}
        >
          {view.done ? 'Walk it again' : 'Start over'}
        </button>
        {view.done && outcome && (
          <button type="button" className="btn btn-copper btn-sm" disabled={taking} onClick={take}>
            {taking ? 'Making them…' : 'Take this character'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- the stages */

/**
 * The seven stages as a rail, so the run reads as a life with a shape rather
 * than as a count. The stage being asked wears the path's colour; the ones
 * behind it are lit; the ones ahead are not yet.
 */
function StageRail({ view }) {
  const hereId = view.current?.stage.id ?? null;
  const hereAt = hereId ? STAGES.findIndex((stage) => stage.id === hereId) : STAGES.length;

  return (
    <ol className="xr-stages" aria-label="The seven stages of the road">
      {STAGES.map((stage, index) => (
        <li
          key={stage.id}
          className={`xr-stage${index < hereAt ? ' is-done' : index === hereAt ? ' is-here' : ''}`}
          aria-current={index === hereAt ? 'step' : undefined}
        >
          <span className="xr-stage-n">{index + 1}</span>
          <span>{stage.title}</span>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------- one question */

function Question({ step, view, onPick }) {
  const { stage, question } = step;
  /* An admin sees what each answer scores. Nobody else does, and the check is
     UI only: there is nothing behind it to protect, since the whole pool is in
     the bundle already. See `Weights`. */
  const { isAdmin } = useAuth();

  return (
    <section className="xr-question" aria-live="polite">
      <span className="xr-where">
        {stage.title} · Question {view.answered + 1} of {view.total}
      </span>
      {/* The scene first, as prose, and the question it closes on as the
          heading under it. Read top to bottom that is where you are, then what
          is being asked of you, then the four ways you might act. */}
      {question.scene && <p className="xr-scene">{question.scene}</p>}
      <h3 className="xr-asks">{question.asks}</h3>

      <ul className={`xr-options${isAdmin ? ' is-admin' : ''}`}>
        {question.options.map((option) => (
          <li key={option.id}>
            <button type="button" className="xr-option" onClick={() => onPick(option.id)}>
              <span className="xr-option-label">{option.label}</span>
              <span className="xr-option-go" aria-hidden="true">
                &rsaquo;
              </span>
            </button>
            {isAdmin && <Weights option={option} />}
          </li>
        ))}
      </ul>

      {view.answered === 0 && (
        <p className="xr-note">
          Answer as they would, not as you would. Nothing is written to the sheet until the last
          question, and no two walks ask quite the same things.
        </p>
      )}
      {isAdmin && (
        <p className="xr-note xr-note-admin">
          Admin: hover an answer, or tab to it, to see what it puts points on. Nobody else is shown
          this.
        </p>
      )}
    </section>
  );
}

/**
 * What an answer scores, for an admin who is holding the pool to its own laws.
 *
 * Drawn under the answer it belongs to and only while that answer is hovered or
 * focused, so tabbing through the four of them reads them out in turn. The
 * shelf beside each set, ancestry, weapon and armor set is the thing worth
 * checking: every answer leans one way, and this is where a point on the wrong
 * shelf would show. `weightsOf` in src/lib/crossroads.js resolves the ids, so
 * nothing here can print one.
 */
function Weights({ option }) {
  const { groups, tags } = useMemo(() => weightsOf(option), [option]);
  if (groups.length === 0 && tags.length === 0) return null;

  return (
    <div className="xr-weights" role="note">
      {groups.map((group) => (
        <div key={group.group} className="xr-weight-row">
          <span className="xr-weight-group">{group.label}</span>
          <span className="xr-weight-rows">
            {group.rows.map((row) => (
              <span key={row.id} className="xr-weight">
                <b>+{row.points}</b> {row.name}
                {row.note && <i>{row.note}</i>}
              </span>
            ))}
          </span>
        </div>
      ))}
      {tags.length > 0 && (
        <div className="xr-weight-row">
          <span className="xr-weight-group">Makes true</span>
          <span className="xr-weight-rows">
            {tags.map((tag) => (
              <span key={tag} className="xr-weight xr-weight-tag">
                {tag}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- the reveal */

/** Whether a set will ask something more once it is held: a hand to choose, a
    creature to name, a shape to take, a pact to seal, a working to lay. */
function asksMore(talent) {
  return Boolean(
    loadoutOf(talent.id) ||
      minionOf(talent.id) ||
      feralOf(talent.id) ||
      pactOf(talent.id) ||
      (enchantingOf(talent.id)?.worn?.[1] ?? 0) > 0
  );
}

/** Whether an ancestry leaves a question behind it: a pool to pick from, or a
    card with a choice in the middle of its sentence. */
function lineageAsks(lineage) {
  return openPicks(lineage, {}) > 0 || lineage.cards.some((card) => card.choice);
}

function Reveal({ outcome }) {
  const { talents, lineage, background, skills, weapons, armorSet, major, minor, story } = outcome;
  const totals = attributeTotals({ 1: { major, minor } }, lineage.name);
  const bloodline = Object.entries(lineageBonuses(lineage.name)).map(
    ([key, bonus]) => `+${bonus} ${attributeLabel(key)}`
  );
  const asking = talents.filter(asksMore);
  const kit = background.kit;
  const novice = rankInfo(1)?.title ?? 'Novice';

  return (
    <>
      <p className="xr-lead">
        Level {CROSSROADS_LEVEL} from the start, with both talent choices spent and{' '}
        {formatNumber(1000)} experience in the ledger. Take them as they stand, or walk the road
        again. Everything below can be changed later from the Advancement tab.
      </p>

      <PickBlock kind="talent" step="1" title="Talent sets" state="Level 1 and level 2" done>
        {talents.map((talent, index) => (
          <Face
            key={talent.id}
            art={talent.art}
            name={talent.name}
            tag={`Level ${index + 1} · Rank 1 · ${novice}`}
            line={talent.tagline}
          />
        ))}
        {asking.length > 0 && (
          <p className="pick-line">
            {asking.map((talent) => talent.name).join(' and ')}{' '}
            {asking.length === 1 ? 'asks' : 'ask'} you something more once the sheet opens, on the
            Advancement tab.
          </p>
        )}
      </PickBlock>

      <PickBlock kind="lineage" step="2" title="Lineage" done>
        <Face art={lineage.art} name={lineage.name} line={lineage.tagline} />
        {lineageAsks(lineage) && (
          <p className="pick-line">{lineage.name} leaves a question for you on the Advancement tab.</p>
        )}
      </PickBlock>

      <PickBlock kind="background" step="3" title="Background" done>
        <Face art={background.art} name={background.name} line={background.tagline} />
        <div className="xr-chips">
          {skills.map((skill) => (
            <span key={skill.id} className="tag tag-muted">
              {skill.name}
            </span>
          ))}
        </div>
        <ul className="xr-kit">
          <li>
            <b>Worn:</b> {armorSet}, all three pieces.
          </li>
          <li>
            <b>In hand:</b> {weapons.map((weapon) => weapon.name).join(' and ')}.
          </li>
          {kit.belt.length > 0 && (
            <li>
              <b>On the belt:</b> {kit.belt.map((id) => getItem(id)?.name ?? id).join(', ')}.
            </li>
          )}
          {kit.pack.length > 0 && (
            <li>
              <b>In the pack:</b> {kit.pack.map((entry) => entry.name).join(', ')}.
            </li>
          )}
          <li>
            <b>The purse:</b> {formatNumber(kit.coins)} ¢ and {formatNumber(kit.supplies)} Supplies.
          </li>
        </ul>
      </PickBlock>

      <PickBlock
        kind="attribute"
        step="4"
        title="Attributes"
        state={`+2 ${attributeLabel(major)} · +1 ${attributeLabel(minor)}`}
        done
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
        {bloodline.length > 0 && (
          <p className="pick-line">Your lineage carries {bloodline.join(' and ')} on top of the spread.</p>
        )}
      </PickBlock>

      <PickBlock kind="lore" step="5" title="Their story" state="Written" done>
        <div className="xr-story">
          {story.map((paragraph) => (
            <div key={paragraph.stage} className="xr-story-part">
              <span className="xr-story-title">{paragraph.title}</span>
              <p>{paragraph.text}</p>
            </div>
          ))}
        </div>
        <p className="pick-line">
          Written into the backstory on their lore page, where every word of it is yours to change.
        </p>
      </PickBlock>
    </>
  );
}

/** A plate, a name and a line: the shape a chosen ancestry already takes on the
    Advancement tab, so the reveal reads as the tab it is about to become. */
function Face({ art, name, line, tag = null }) {
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
