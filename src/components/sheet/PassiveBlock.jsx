import { useMemo } from 'react';
import useFoldedGroups from './useFoldedGroups.js';
import { GroupHead } from './parts.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { passiveRecap, recapCount } from '../../lib/combatBar.js';
import { cardGist } from '../../lib/cardText.js';
import { cardUse, cycleCardUse } from '../../lib/uses.js';

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
 * rides at the end of each row, so "Sharp Sense · Wildkin" still says where it
 * came from.
 *
 * Every row carries one line of what it actually gives you, which is the whole
 * reason to look at this block at all. That line is the card's authored
 * `summary` where there is one and `cardGist` where there is not, exactly as a
 * brief resolves it. A tap deals the real card onto the stack.
 *
 * ------------------------------------------------------- the one thing that runs out
 * Almost nothing here is ever spent, and then there are two enchantments that
 * are. Defibrillation and Death Defiance both fire once when you go down and both
 * need a long rest before they fire again. The firing is the table's to notice:
 * nothing on this sheet knows that a character went down. But whether it has
 * fired *since your last long rest* is a fact about the character, and a fact
 * about the character has to be written on it, or the rest has nothing to hand
 * back.
 *
 * So a row whose card carries a `uses` rider grows a mark on its right, and that
 * is the only thing on this block that writes anything. Everything else is still
 * a read. See uses.js.
 */
export default function PassiveBlock({ character, patch, readOnly = false }) {
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
                    patch={patch}
                    readOnly={readOnly}
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
 * one thing to do with a passive and that is read it. Unless it runs out, in
 * which case there are two, and the read keeps the row while the mark takes a
 * corner of it.
 */
function Row({ row, character, patch, readOnly, onOpen }) {
  const { card, modifiers } = row;
  const line = card.summary ?? cardGist(card, { character, modifiers });
  const use = cardUse(character, card);

  const read = (
    <button
      type="button"
      className={`recap-row ac-kind-${card.kind ?? 'passive'}${use?.spent ? ' is-spent' : ''}`}
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

  if (!use) return read;

  return (
    <div className="recap-limited">
      {read}
      <UseMark card={card} use={use} character={character} patch={patch} readOnly={readOnly} />
    </div>
  );
}

/**
 * How much of a standing card is left, and the tap that spends it.
 *
 * A separate button from the row rather than a corner of it, because a button
 * inside a button is not a thing, and because these two do different jobs: the
 * row reads the card and this writes on the character. It carries what is left as
 * a number for a card that allows more than one, and the word Spent for one with
 * nothing left, which is the same pair the quick bar's chips already print.
 */
function UseMark({ card, use, character, patch, readOnly }) {
  function mark() {
    const body = cycleCardUse(character, card);
    if (body) patch(body);
  }

  return (
    <button
      type="button"
      className={`recap-mark${use.spent ? ' is-spent' : ''}`}
      onClick={mark}
      disabled={readOnly || !patch}
      title={
        use.spent
          ? use.recharge
            ? `${card.name} has fired. A ${use.recharge} brings it back, and a tap gives it back now.`
            : `${card.name} has fired, and nothing brings it back.`
          : `${use.remaining} of ${use.max} left. Tap when it fires.`
      }
      aria-label={`${card.name}: ${use.spent ? 'spent' : `${use.remaining} of ${use.max} left`}`}
    >
      {use.spent ? 'Spent' : `${use.remaining} left`}
    </button>
  );
}
