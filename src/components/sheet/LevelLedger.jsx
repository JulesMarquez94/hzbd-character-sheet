import { useState } from 'react';
import AttributeSpreadPick, { AttributePointPick } from './AttributePick.jsx';
import BackgroundPick from './BackgroundPick.jsx';
import LineagePick from './LineagePick.jsx';
import SkillPick from './SkillPick.jsx';
import TalentPick from './TalentBlock.jsx';
import { advancementState } from '../../lib/talents.js';
import { backgroundState } from '../../lib/backgrounds.js';
import { getSkill, levelGrants, levelPicksState, nextLevelPromise } from '../../lib/levelPicks.js';

/**
 * The ledger: one block per level the character has reached, oldest at the top,
 * and a new one appearing below the last every time they level.
 *
 * Every level hands out something, and what it hands out is decided by the
 * level alone. See levelGrants() in levelPicks.js, which is the only place that
 * rule is written:
 *
 *   level 1   a talent set, a lineage, a background and the +2 / +1 spread
 *   even      one talent choice
 *   odd (3+)  one attribute point, and one skill from the whole codex
 *
 * A level 12 character has twelve blocks, so a finished level folds itself away
 * and leaves a one line summary. The blocks are the tab: nothing here is spent
 * or tracked, and pools, derived numbers and the experience curve all belong to
 * the Character tab.
 */
export default function LevelLedger({ character, level, patch, readOnly = false, unit = 'metric' }) {
  const talents = advancementState(character.talents, level);
  const picks = levelPicksState(character, level);
  const next = nextLevelPromise(level);

  /* Nothing can be recorded above the current level any more: losing a level
     gives back what that level bought, at the moment the experience moves. See
     pruneToLevel() in levelPicks.js, and the repair on open in CharacterSheet. */

  return (
    <>
      {picks.levels.map((n) => (
        <LevelBlock
          key={n}
          level={n}
          character={character}
          talents={talents}
          picks={picks}
          patch={patch}
          readOnly={readOnly}
          unit={unit}
        />
      ))}

      {next && (
        <p className="level-next">
          Level <b>{next.level}</b> brings {next.says}.
        </p>
      )}
    </>
  );
}

/* -------------------------------------------------------------- one level */

const BLOCK_TITLES = { 1: 'Foundation' };

function titleFor(level, grants) {
  if (BLOCK_TITLES[level]) return BLOCK_TITLES[level];
  return grants.talent ? 'Talent Choice' : 'Attribute & Skill';
}

function LevelBlock({ level, character, talents, picks, patch, readOnly, unit }) {
  const grants = levelGrants(level);
  const slot = grants.talent ? talents.slots.find((entry) => entry.level === level) ?? null : null;
  const entry = picks.at(level);

  const isOpen = talents.openLevel === level;
  const background = grants.background ? backgroundState(character) : null;

  /* What this level asked for, and how much of it has been answered. One panel
     needs no step number; more than one is a sequence, and reads as one only if
     the panels are numbered. */
  const asked = [];
  if (grants.talent) asked.push(Boolean(slot?.filled));
  if (grants.lineage) asked.push(Boolean(String(character.lineage ?? '').trim()));
  if (grants.background) asked.push(Boolean(background.complete && background.taken));
  if (grants.boosts) asked.push(picks.spreadDone);
  if (grants.attribute) asked.push(Boolean(entry.attribute));
  if (grants.skill) asked.push(Boolean(entry.skill));

  const done = asked.filter(Boolean).length;
  const complete = done === asked.length;

  /* A level nobody has anything left to do at folds itself away. Twelve open
     blocks is a scroll; twelve headings is a ledger you can read. Opened by
     hand it stays open, so this is a starting position and not a rule. */
  const [shut, setShut] = useState(complete);

  const numbered = asked.length > 1;
  let step = 0;
  const nextStep = () => (numbered ? String((step += 1)) : null);

  const state = complete
    ? asked.length === 1
      ? 'Chosen'
      : 'Complete'
    : done === 0
      ? grants.talent && !grants.boosts && !isOpen
        ? `After level ${talents.openLevel}`
        : 'Waiting on you'
      : `${done} of ${asked.length} chosen`;

  return (
    <section
      className={`level-block${complete ? ' is-filled' : ' is-open'}${shut ? ' is-shut' : ''}`}
    >
      <button
        type="button"
        className="level-block-head"
        aria-expanded={!shut}
        onClick={() => setShut((was) => !was)}
      >
        <span className="level-block-badge">Level {level}</span>
        <span className="level-block-title">{titleFor(level, grants)}</span>
        <span className="level-block-state">{state}</span>
        <span className="level-block-chevron" aria-hidden="true" />
      </button>

      {shut ? (
        <p className="level-block-shut">{summarise({ grants, slot, character, picks, entry })}</p>
      ) : (
        <>
          {slot && (
            <TalentPick
              slot={slot}
              list={talents.talents}
              character={character}
              patch={patch}
              isOpen={isOpen}
              canUndo={!readOnly && talents.undoLevel === level}
              openAt={talents.openLevel}
              step={nextStep()}
              readOnly={readOnly}
            />
          )}

          {grants.lineage && (
            <LineagePick
              value={character.lineage}
              character={character}
              patch={patch}
              step={nextStep()}
              readOnly={readOnly}
            />
          )}

          {grants.background && (
            <BackgroundPick
              character={character}
              patch={patch}
              step={nextStep()}
              readOnly={readOnly}
            />
          )}

          {grants.boosts && (
            <AttributeSpreadPick
              character={character}
              state={picks}
              patch={patch}
              level={level}
              step={nextStep()}
              readOnly={readOnly}
              unit={unit}
            />
          )}

          {grants.attribute && (
            <AttributePointPick
              character={character}
              state={picks}
              level={level}
              patch={patch}
              step={nextStep()}
              readOnly={readOnly}
              unit={unit}
            />
          )}

          {grants.skill && (
            <SkillPick
              character={character}
              state={picks}
              level={level}
              patch={patch}
              step={nextStep()}
              readOnly={readOnly}
            />
          )}
        </>
      )}
    </section>
  );
}

/**
 * A folded level in one line: what it was spent on, in the order the panels
 * stand. Anything still unanswered is named as such, so a closed block is never
 * hiding a decision from you.
 */
function summarise({ grants, slot, character, picks, entry }) {
  const said = [];

  if (grants.talent) {
    said.push(slot?.filled ? `${slot.entry.name} rank ${slot.rank}` : 'no talent yet');
  }
  if (grants.lineage) {
    const lineage = String(character.lineage ?? '').trim();
    said.push(lineage || 'no lineage yet');
  }
  if (grants.background) {
    const background = String(character.background ?? '').trim();
    said.push(background || 'no background yet');
  }
  if (grants.boosts) {
    const boosts = picks.boosts;
    said.push(
      boosts
        ? `+2 ${label(boosts.major)}, +1 ${label(boosts.minor)}`
        : 'no attribute spread yet'
    );
  }
  if (grants.attribute) {
    said.push(entry.attribute ? `+1 ${label(entry.attribute)}` : 'no attribute point yet');
  }
  if (grants.skill) {
    said.push(entry.skill ? getSkill(entry.skill)?.name ?? entry.skill : 'no skill yet');
  }

  return said.join(' · ');
}

function label(key) {
  return key ? key[0].toUpperCase() + key.slice(1) : '';
}
