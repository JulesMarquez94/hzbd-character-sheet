import { useMemo } from 'react';
import useFoldedGroups from './useFoldedGroups.js';
import { GroupHead } from './parts.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { passiveRecap, recapCount } from '../../lib/combatBar.js';
import { cardGist } from '../../lib/cardText.js';

/**
 * The Character tab's fifth block: the recap.
 *
 * The half of a sheet nobody remembers they have. Nothing here is played and
 * nothing here is spent: a trait is simply true of you, a skill is a thing you
 * are good at when the table asks for a roll, and a working on your armour is
 * doing its job whether or not you thought about it this turn.
 *
 * Block 4 is what you do. This is what you *are*, and the two together hold
 * every card the character has, each printed exactly once.
 *
 * -------------------------------------------------------------- how it reads
 * Grouped by what a thing is rather than by who gave it, because the Abilities
 * tab already files everything by provenance and answering the same question
 * twice wastes the only 360 pixels this block has. Provenance is not lost: it
 * rides at the end of each row, so "Sharpsense · Draconic" still says where it
 * came from.
 *
 * Every row carries one line of what it actually gives you, which is the whole
 * reason to look at this block at all. That line is the card's authored
 * `summary` where there is one and `cardGist` where there is not, exactly as a
 * brief resolves it. A tap deals the real card onto the stack.
 */
export default function PassiveBlock({ character, readOnly = false }) {
  const stack = useCardStack();

  const groups = useMemo(() => passiveRecap(character), [character]);
  const total = recapCount(groups);
  const { isFolded, toggle } = useFoldedGroups('recap', character?.id);

  return (
    <div className="cell-scroll passive-block">
      <div className="block-head">
        <span className="stat-category-label">Always On</span>
        <span className="block-count">
          {total} {total === 1 ? 'thing' : 'things'}
        </span>
      </div>

      {total === 0 ? (
        <p className="pick-line recap-empty">
          Nothing standing yet. Your lineage, your background and your talent sets are chosen on the
          Advancement tab, and every trait and skill they hand you is recapped here.
        </p>
      ) : (
        groups.map((group) => {
          const folded = isFolded(group.id);

          return (
            <section className="recap-group" key={group.id}>
              <GroupHead
                label={group.label}
                note={group.note}
                count={group.rows.length}
                folded={folded}
                onToggle={() => toggle(group.id)}
              />

              {!folded &&
                group.rows.map((row) => (
                  <Row
                    key={row.key}
                    row={row}
                    character={character}
                    onOpen={() => stack?.openCard(row.card, row.modifiers)}
                  />
                ))}
            </section>
          );
        })
      )}

      {readOnly && <span className="recap-foot">Someone else&rsquo;s sheet. Nothing here is yours to spend anyway.</span>}
    </div>
  );
}

/**
 * One standing thing on one line and a half: its name with where it came from,
 * and what it does said once.
 *
 * The whole row is the button, unlike block 4's chips, because there is only
 * one thing to do with a passive and that is read it.
 */
function Row({ row, character, onOpen }) {
  const { card, modifiers } = row;
  const line = card.summary ?? cardGist(card, { character, modifiers });

  return (
    <button
      type="button"
      className={`recap-row ac-kind-${card.kind ?? 'passive'}`}
      onClick={onOpen}
      title={`${card.name} · read the card`}
    >
      <span className="recap-row-head">
        <span className="recap-row-name">{card.name}</span>
        {row.from && <span className="recap-row-from">{row.from}</span>}
      </span>
      {line && <span className="recap-row-line">{line}</span>}
    </button>
  );
}
