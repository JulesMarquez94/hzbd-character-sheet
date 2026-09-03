import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import PickBlock from './PickBlock.jsx';
import TagFilter from './TagFilter.jsx';
import { LearnSection } from './LineagePick.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useTagFilter } from './useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import { skillAnswer } from '../../lib/backgrounds.js';
import { castModifier } from '../../lib/cardText.js';
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
 * this one has not reached, and it leaves those off the wall rather than
 * printing them dead. How many went, and why, is a line under the lead.
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
  /* Which view of the chooser is up: the wall of skills, or the question the one
     you took left open. null is closed. */
  const [mode, setMode] = useState(null);
  const stack = useCardStack();

  const chosenId = state.at(level).skill ?? null;
  const skill = chosenId ? getSkill(chosenId) : null;
  const picked = skill ? skillAnswer(skill, character?.choices) : null;
  const modifiers = picked ? { choice: picked } : null;
  /* And what the spell it taught is cast with. Innate Spell X hands its spell
     over rolling off the highest Attribute, so the card behind the skill is
     dealt with that rather than the Mind the codex printed it for. */
  const taught = skill ? castModifier(skill.choice) : null;
  // A skill that promised a spell and has not named one is half a pick, and the
  // block says so the way the lineage block does.
  const open = Boolean(skill?.choice && !picked);

  return (
    <PickBlock
      kind="skill"
      step={step}
      title="New Skill"
      done={Boolean(chosenId) && !open}
      foldable
      summary={skill ? skill.name : 'No skill chosen yet.'}
    >
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
              modifiers={taught}
              onOpen={() => stack?.openCard(picked.card, taught)}
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
          <button
            type="button"
            className="btn btn-pick btn-sm"
            /* Straight to the question when there is one outstanding. "Answer
               what it left open" that opened a wall of thirty skills was the
               button lying about where it went. */
            onClick={() => setMode(open ? 'settle' : 'choose')}
          >
            {!skill ? 'Choose a Skill' : open ? 'Answer what it left open' : 'Change your skill'}
          </button>
        )}
        {readOnly && skill && (
          <button type="button" className="btn btn-minimal btn-sm" onClick={() => setMode('choose')}>
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

      {/* Keyed on the mode, so walking from the wall into the question remounts
          the window on the right view rather than scrolling to it. */}
      {mode && (
        <SkillChooser
          key={mode}
          settling={mode === 'settle'}
          character={character}
          level={level}
          readOnly={readOnly}
          /* Taking a skill that asks nothing closes the window, because the pick
             is finished. One that leaves a question open turns the window into
             that question: the shelf is the rest of the same decision, and a
             skill that promises a spell is not learned until the spell is named. */
          onTake={(id) => {
            patch(setLevelSkill(character, level, id));
            setMode(getSkill(id)?.choice ? 'settle' : null);
          }}
          onAnswer={(cardId, optionId) =>
            patch({ choices: { ...(character?.choices ?? {}), [cardId]: optionId } })
          }
          onBack={() => setMode('choose')}
          onSettle={() => setMode('settle')}
          onClose={() => setMode(null)}
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
 * Narrowed first by what the level can actually learn. A card marked "Needs
 * level 10" is not an offer, and a wall of them is a wall you scroll past, so
 * they come off and the count goes under the lead. A reader gets the whole
 * codex back, since reading a sheet is not choosing on it.
 *
 * Two views, and the second is the point of the flow. Innate Spell Novice
 * promises a spell and names none, so taking it turns this window into the shelf
 * that names one: the question *replaces* the wall rather than waiting at the
 * bottom of it, under thirty cards nobody scrolls back through, and Done stays
 * shut until it is answered. The lineage block settles its blood the same way.
 */
function SkillChooser({
  character,
  level,
  readOnly,
  settling = false,
  onTake,
  onAnswer,
  onBack,
  onSettle,
  onClose,
}) {
  const stack = useCardStack();
  const filter = useTagFilter(usedSkillTags(), { searchable: true });
  const options = skillOptionsAt(character, level);

  /* What this level can learn, and the one it already did. Everything else is
     counted rather than printed: a skill a later level opens is not a choice
     here, and neither is one already written down somewhere else on the sheet. */
  const offered = readOnly ? options : options.filter((option) => option.ok);
  const later = options.filter((option) => option.gate === 'level').length;
  const already = options.filter((option) => option.gate === 'held').length;

  const visible = offered.filter(
    (option) => filter.matches(option.skill.tags) && filter.text(option.skill.name, option.skill.body)
  );

  const mine = options.find((option) => option.held)?.skill ?? null;
  const asks = mine?.choice ? mine : null;
  const picked = asks ? skillAnswer(asks, character?.choices) : null;
  /* The question has the window when there is one to have it. A settle step with
     nothing outstanding would be an empty page, so it falls back to the wall. */
  const asking = settling && asks ? asks : null;
  const shut = asking && !picked ? `Name ${asking.choice.placeholder} to finish this skill` : null;

  return (
    <Modal
      title={asking ? `${asking.name}: What It Asks You` : `Level ${level}: Learn a Skill`}
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
          {asking && (
            <button type="button" className="btn btn-minimal btn-sm" onClick={onBack}>
              ← All skills
            </button>
          )}
          <button
            type="button"
            className="btn btn-take btn-sm"
            disabled={Boolean(shut)}
            title={shut ?? undefined}
            onClick={onClose}
          >
            Done
          </button>
        </>
      }
    >
      {asking ? (
        <>
          <p className="frame-foot" style={{ marginTop: 0 }}>
            <b>{asking.name}</b> is yours, and it is not finished. {asking.choice.prompt} Tap one
            and the skill rewrites itself around it. You can change it later, from the block or from
            here.
          </p>

          <LearnSection
            card={asking}
            picked={picked}
            character={character}
            art={asking.art_url ?? null}
            readOnly={readOnly}
            onPick={(optionId) => onAnswer(asking.id, optionId)}
          />
        </>
      ) : (
        <>
          <p className="frame-foot" style={{ marginTop: 0 }}>
            {readOnly
              ? 'Every skill in the codex, read as it is printed.'
              : 'Every skill this level can learn, not only the ones your background offered. One of them is yours.'}
          </p>

          {/* Where the rest of the codex went. Both counts answer the same
              question a bare wall leaves open, and they answer it differently:
              one is a level away, the other is already on this sheet. Nothing
              to answer for a reader: that wall is the whole codex already. */}
          {!readOnly && (later > 0 || already > 0) && (
            <p className="pick-line">
              {later > 0 &&
                `${later} more ${later === 1 ? 'skill is' : 'skills are'} held back for higher levels. `}
              {already > 0 &&
                `${already} ${already === 1 ? 'skill is' : 'skills are'} already yours, from your background or another level.`}
            </p>
          )}

          <TagFilter filter={filter} count={visible.length} noun="skill" placeholder="Search skills" />

          <div className="card-brief-wall">
            {visible.map(({ skill, held }) => {
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
                      onClick={() => (held ? onClose() : onTake(skill.id))}
                    >
                      {held ? 'Learned at this level' : 'Learn this skill'}
                    </button>
                  )}
                </CardBrief>
              );
            })}
          </div>

          {/* The one on the wall that is already yours and still owes an answer.
              One tap away rather than a scroll: the shelf itself is the settle view
              above, which is where taking a skill lands you. */}
          {asks && !picked && (
            <div className="pick-tools pick-tools-tight">
              <button type="button" className="btn btn-sub btn-sm" onClick={onSettle}>
                {asks.name} has not named {asks.choice.placeholder} yet. Answer it
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ parts */

