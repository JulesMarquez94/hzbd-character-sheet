import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import PickBlock from './PickBlock.jsx';
import TagFilter from './TagFilter.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useTagFilter } from './useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
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
 * codex. The only thing it will not offer is a skill you already hold, from
 * your background or from an earlier level, and it says which when it refuses.
 *
 * Skills are cards like everything else on this sheet, so they are chosen the
 * way cards are chosen: printed at their real size, read in full, then taken.
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

  return (
    <PickBlock kind="skill" step={step} title="New Skill" done={Boolean(chosenId)}>
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
            onOpen={() => stack?.openCard(skill)}
          />
        </div>
      ) : (
        <p className="pick-line">Nothing learned yet. This level&rsquo;s skill is unspent.</p>
      )}

      <div className="pick-tools">
        {!readOnly && (
          <button type="button" className="btn btn-pick btn-sm" onClick={() => setChoosing(true)}>
            {skill ? 'Change your skill' : 'Choose a Skill'}
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
          onTake={(id) => {
            patch(setLevelSkill(character, level, id));
            setChoosing(false);
          }}
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
 * the cards are already the right question: social, survival, lore, labour.
 */
function SkillChooser({ character, level, readOnly, onTake, onClose }) {
  const stack = useCardStack();
  const filter = useTagFilter(usedSkillTags(), { searchable: true });
  const options = skillOptionsAt(character, level);
  const visible = options.filter(
    (option) => filter.matches(option.skill.tags) && filter.text(option.skill.name, option.skill.body)
  );

  return (
    <Modal
      title={`Level ${level}: Learn a Skill`}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.skill}
      footer={
        <>
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
        {visible.map(({ skill, ok, held, reason }) => (
          <CardBrief
            key={skill.id}
            card={skill}
            character={character}
            held={held}
            onOpen={() => stack?.openCard(skill)}
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
        ))}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ parts */

