import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import PickBlock from './PickBlock.jsx';
import TagFilter from './TagFilter.jsx';
import { LearnPicker } from './LineagePick.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useTagFilter } from './useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import { skillAnswer } from '../../lib/backgrounds.js';
import {
  clearLevelPick,
  getSkill,
  setLevelSkill,
  skillOptionsAt,
  usedSkillTags,
} from '../../lib/levelPicks.js';

/**
 * The skill an odd level teaches you.
 *
 * A background hands out skills from its own small pool — the life you led only
 * taught you what that life knew. Levelling is different: what you learn at
 * level 5 is whatever you went and learned, so this chooser opens the *whole*
 * codex. What it will not offer is a skill you already hold, from your
 * background or from an earlier level, or one whose own row asks for a level
 * this one has not reached, and it says which when it refuses.
 *
 * Skills are cards like everything else on this sheet, so they are chosen the
 * way cards are chosen: printed at their real size, read in full, then taken.
 *
 * And a skill can leave a question behind it. Innate Spell Adept promises a
 * spell and names none, so the rank's whole shelf opens under the pool in this
 * same window, exactly as it does in the background block.
 */
export default function SkillPick({
  character,
  state,
  level,
  patch,
  step = null,
  readOnly = false,
}) {
  const [choosing, setChoosing] = useState(false);
  const stack = useCardStack();

  const chosenId = state.at(level).skill ?? null;
  const skill = chosenId ? getSkill(chosenId) : null;
  const picked = skill ? skillAnswer(skill, character?.choices) : null;
  const modifiers = picked ? { choice: picked } : null;
  // A skill that promised a spell and has not named one is half a pick, and the
  // block says so the way the lineage block does.
  const open = Boolean(skill?.choice && !picked);

  return (
    <PickBlock kind="skill" step={step} title="New Skill" done={Boolean(chosenId) && !open}>
      <p className="pick-lead">
        Level {level} also teaches you something. One <b>skill</b>, and unlike the ones your
        background gave you it may come from anywhere in the codex. Every trade&rsquo;s pool is open
        to you now.
      </p>

      {skill ? (
        <div className="talent-rung-cards">
          <CardBrief
            card={skill}
            character={character}
            modifiers={modifiers}
            onOpen={() => stack?.openCard(skill, modifiers)}
          />
          {picked?.card && (
            <CardBrief
              card={picked.card}
              character={character}
              onOpen={() => stack?.openCard(picked.card)}
            />
          )}
          {open && (
            <p className="pick-line">
              {skill.name} has not named {skill.choice.placeholder} yet.
            </p>
          )}
        </div>
      ) : (
        <p className="pick-line">Nothing learned yet. This level&rsquo;s skill is unspent.</p>
      )}

      <div className="pick-tools">
        {!readOnly && (
          <button type="button" className="btn btn-pick btn-sm" onClick={() => setChoosing(true)}>
            {!skill ? 'Choose a Skill' : open ? 'Answer what it left open' : 'Change your skill'}
          </button>
        )}
        {readOnly && skill && (
          <button type="button" className="btn btn-minimal btn-sm" onClick={() => setChoosing(true)}>
            Read it
          </button>
        )}
        {!readOnly && skill && (
          <>
            <span className="spacer" />
            <button
              type="button"
              className="btn btn-minimal btn-sm talent-drop"
              onClick={() => patch(clearLevelPick(character, level, 'skill'))}
            >
              Unlearn it
            </button>
          </>
        )}
      </div>

      {choosing && (
        <SkillChooser
          character={character}
          level={level}
          readOnly={readOnly}
          /* Taking a skill that asks nothing closes the window, because the pick
             is finished. One that leaves a question open stays, because the shelf
             it opens is the rest of the same decision. */
          onTake={(id) => {
            patch(setLevelSkill(character, level, id));
            if (!getSkill(id)?.choice) setChoosing(false);
          }}
          onAnswer={(cardId, optionId) =>
            patch({ choices: { ...(character?.choices ?? {}), [cardId]: optionId } })
          }
          onClose={() => setChoosing(false)}
        />
      )}
    </PickBlock>
  );
}

/* --------------------------------------------------------------- chooser */

/**
 * The whole codex as a wall of cards, narrowed by what a skill is *for* —
 * thirty-odd of them is far too many to read straight through, and the tags on
 * the cards are already the right question: social, survival, lore, craft.
 *
 * Under the wall, the question the skill you took left open, if it left one.
 */
function SkillChooser({ character, level, readOnly, onTake, onAnswer, onClose }) {
  const stack = useCardStack();
  const filter = useTagFilter(usedSkillTags(), { searchable: true });
  const options = skillOptionsAt(character, level);
  const visible = options.filter(
    (option) => filter.matches(option.skill.tags) && filter.text(option.skill.name, option.skill.body)
  );

  const mine = options.find((option) => option.held)?.skill ?? null;
  const asks = mine?.choice ? mine : null;
  const picked = asks ? skillAnswer(asks, character?.choices) : null;

  return (
    <Modal
      title={`Level ${level}: Learn a Skill`}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.skill}
      footer={
        <>
          {asks && (
            <span className={`pick-count${picked ? '' : ' is-open'}`}>
              {picked ? `${picked.label}, yours` : `${asks.choice.label} not named`}
            </span>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        {readOnly
          ? 'Every skill in the codex, read as it is printed.'
          : 'Every skill in the codex, not only the ones your background offered. One of them is yours at this level, and the ones you already hold say so.'}
      </p>

      <TagFilter filter={filter} count={visible.length} noun="skill" placeholder="Search skills" />

      <div className="card-brief-wall">
        {visible.map(({ skill, ok, held, reason }) => {
          const answer = held ? skillAnswer(skill, character?.choices) : null;
          const modifiers = answer ? { choice: answer } : null;

          return (
            <CardBrief
              key={skill.id}
              card={skill}
              character={character}
              held={held}
              modifiers={modifiers}
              onOpen={() => stack?.openCard(skill, modifiers)}
            >
              {!readOnly && (
                <button
                  type="button"
                  className={`btn btn-sm card-brief-btn ${held ? 'btn-minimal talent-drop' : 'btn-take'}`}
                  disabled={!ok}
                  title={ok ? undefined : reason}
                  onClick={() => (held ? onClose() : onTake(skill.id))}
                >
                  {held ? 'Learned at this level' : ok ? 'Learn this skill' : reason}
                </button>
              )}
            </CardBrief>
          );
        })}
      </div>

      {asks && (
        <section className="talent-page-rank">
          <div className="talent-page-rank-head">
            <span className="talent-page-rank-label">
              {asks.name} · {asks.choice.label}
            </span>
            <span className="talent-page-rank-note">
              {picked ? `${picked.label}, yours` : 'Nothing learned yet'}
            </span>
          </div>
          <p className="talent-page-aside">{asks.choice.prompt}</p>
          <LearnPicker
            card={asks}
            picked={picked}
            character={character}
            art={asks.art_url ?? null}
            readOnly={readOnly}
            onPick={(optionId) => onAnswer(asks.id, optionId)}
          />
        </section>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ parts */

