import { LineageChooser } from './LineagePick.jsx';
import { SkillChooser } from './BackgroundPick.jsx';
import { LoadoutChooser } from './LoadoutPick.jsx';
import { MinionWindow } from './MinionPick.jsx';
import { FeralWindow } from './FeralPick.jsx';
import { PactWindow } from './PactPick.jsx';
import OathWindow from './OathPick.jsx';
import { backgroundState, dropSkill, skillAnswer, takeSkill } from '../../lib/backgrounds.js';
import { getLineage, togglePoolPick } from '../../lib/lineages.js';
import { loadoutState, toggleLoadoutPick } from '../../lib/loadouts.js';
import { minionState } from '../../lib/minions.js';
import { feralState } from '../../lib/feral.js';
import { pactState } from '../../lib/pact.js';
import { oathState } from '../../lib/oathbound.js';
import { getTalent, setTalentPicks } from '../../lib/talents.js';
import { levelForXp } from '../../lib/characterModel.js';

/**
 * One open question, as the window that asks it.
 *
 * `openAsks` in levelPicks.js says what a character still owes and what kind of
 * thing each one is. This turns one of those rows into the dialog that answers
 * it, so a caller holding the list can put the questions in front of somebody
 * one after another without knowing anything about spells, bargains or beasts.
 *
 * Every window here is the one the Advancement tab already opens from its own
 * block, wired the way that block wires it. Nothing about a choice is decided
 * here: this is a switchboard, and the day a set asks a new kind of question the
 * row appears in `levelAsks` and the case belongs in the table below.
 *
 * Jules, 2026-09-10: "I want that the player has prompts that appear. Because
 * now you have to choose your spell. Now you have to choose your lineage, and
 * some have to deal with you in a sequence. So essentially you open a menu where
 * you can select those things, and it doesn't take you to another page."
 *
 * Returns null for a row it has no window for, which is the honest answer and
 * not a blank dialog. A caller that gates a way out on the list has to handle
 * that: see `askable` in askKinds.js, and the way Crossroads.jsx counts with
 * it.
 */

export default function AskWindow({ ask, character, patch, onClose }) {
  const talent = ask?.talent ? getTalent(ask.talent) : null;
  const choices = character?.choices ?? {};

  if (ask?.kind === 'lineage') {
    return (
      <LineageChooser
        settling
        current={getLineage(character?.lineage)}
        character={character}
        onTake={() => {}}
        onAnswer={(cardId, optionId) => patch({ choices: { ...choices, [cardId]: optionId } })}
        onTakeTrait={(target, cardId) =>
          patch({ choices: { ...choices, [target.pool.id]: togglePoolPick(target, choices, cardId) } })
        }
        onClose={onClose}
      />
    );
  }

  if (ask?.kind === 'loadout' && talent) {
    /* The same three arguments the set's own panel reads it with: the level,
       because half a library's ceiling is made of it, the capacity cap because
       this is an edit and not a night, and the attributes for the one ceiling
       that reads one. See LoadoutSection. */
    const state = loadoutState(character?.talents, talent, {
      level: levelForXp(character?.xp),
      capped: 'capacity',
      attributes: character,
    });
    if (!state) return null;
    return (
      <LoadoutChooser
        talent={talent}
        character={character}
        state={state}
        readOnly={false}
        onToggle={(cardId, how) =>
          patch({
            talents: toggleLoadoutPick(character?.talents, talent.id, cardId, state.known, how),
          })
        }
        onClear={() => patch({ talents: setTalentPicks(character?.talents, talent.id, []) })}
        onClose={onClose}
      />
    );
  }

  if (ask?.kind === 'minion' && talent) {
    const minion = minionState(character).find((row) => row.id === talent.id);
    if (!minion) return null;
    return (
      <MinionWindow character={character} minion={minion} patch={patch} onClose={onClose} />
    );
  }

  if (ask?.kind === 'feral' && talent) {
    const form = feralState(character).find((row) => row.id === talent.id);
    if (!form) return null;
    return <FeralWindow character={character} form={form} patch={patch} onClose={onClose} />;
  }

  if (ask?.kind === 'pact' && talent) {
    const state = pactState(character).find((row) => row.id === talent.id);
    if (!state) return null;
    return <PactWindow character={character} state={state} patch={patch} onClose={onClose} />;
  }

  if (ask?.kind === 'oath' && talent) {
    const row = oathState(character).find((one) => one.id === talent.id);
    if (!row) return null;
    return <OathWindow character={character} row={row} patch={patch} onClose={onClose} />;
  }

  if (ask?.kind === 'background') {
    /* A trade is open here for one of two reasons: it is short of the skills it
       teaches, or one it teaches promises a spell and has not named it. The same
       window answers both, and it opens on the question rather than on the wall
       when there is one waiting. */
    const state = backgroundState(character);
    if (!state?.background) return null;
    const owing = state.asks.find((skill) => !skillAnswer(skill, choices)) ?? null;
    return (
      <SkillChooser
        state={state}
        character={character}
        readOnly={false}
        startOn={owing?.id ?? null}
        onTake={(id) =>
          patch({ background_skills: takeSkill(state.background, state.skillIds, id) })
        }
        onDrop={(id) =>
          patch({ background_skills: dropSkill(state.background, state.skillIds, id) })
        }
        onAnswer={(cardId, optionId) => patch({ choices: { ...choices, [cardId]: optionId } })}
        onClose={onClose}
      />
    );
  }

  return null;
}
