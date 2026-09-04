import { useMemo, useState } from 'react';
import CardBrief from '../sheet/CardBrief.jsx';
import TagFilter from '../sheet/TagFilter.jsx';
import { useTagFilter } from '../sheet/useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import { cardHaystack } from '../../lib/abilitySources.js';
import { compareTags, sortCards } from '../../lib/cardOrder.js';
import { CARDS } from '../../lib/weapons.js';

/**
 * Every card in the game, said in a line, with the card itself one tap behind.
 *
 * The same two steps the sheet's own choosers are: a wall of summaries you
 * scan, and the whole of one dealt onto the stack when you pick it. It reads
 * the same `CARDS` registry the sheet does, so a card written this afternoon is
 * on this page this afternoon and nothing had to be copied here.
 *
 * ----------------------------------------------------------------- two rows
 * A kind first, then a tag or a word. Those are the two questions in the order
 * people ask them: "show me the spells", and then "the Ethereal ones" or "the
 * one with roots in it". Five hundred cards is not a wall you scroll, so the
 * kind row is doing most of the work and it is the row that opens preselected.
 *
 * `Everything` is offered because sometimes the question really is "what is
 * called Bramble anything", and the search box is the only way to ask it. It is
 * capped rather than refused: the first 150 draw and the rest wait behind a
 * button, so picking it never hands a phone five hundred pictures at once.
 */

/* The kinds worth their own button, in the order the sheet's overview reads
   them out. A kind the codex grows later still gets a button, at the end,
   labelled by its own name rather than quietly missing. */
const KIND_LABELS = {
  spell: 'Spells',
  talent: 'Talents',
  passive: 'Traits',
  skill: 'Skills',
  'martial-move': 'Martial Moves',
  ability: 'Abilities',
  /* The one card a belt item teaches. Named for the gear rather than left to
     the fallback, which called them "Items" beside a tab of the same name. */
  item: 'Gear Cards',
  ingredient: 'Ingredients',
  creature: 'Creature Cards',
};

const KIND_ORDER = Object.keys(KIND_LABELS);

const WALL_CAP = 150;

function label(kind) {
  if (KIND_LABELS[kind]) return KIND_LABELS[kind];
  const words = String(kind).replace(/-/g, ' ');
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}s`;
}

export default function CardShelf({ character }) {
  const stack = useCardStack();
  const [kind, setKind] = useState('spell');
  const [all, setAll] = useState(false);

  /* Sorted once. `sortCards` is the printed order: the rung, then the school,
     then the family. Every list on the site reads in it, and a codex that read
     in a different one from the sheet would be a second codex. */
  const codex = useMemo(() => sortCards(CARDS), []);

  const kinds = useMemo(() => {
    const tally = new Map();
    for (const card of codex) {
      const id = card.kind ?? 'ability';
      tally.set(id, (tally.get(id) ?? 0) + 1);
    }
    return [...tally.entries()]
      .map(([id, count]) => ({ id, count, label: label(id) }))
      .sort((a, b) => {
        const left = KIND_ORDER.indexOf(a.id);
        const right = KIND_ORDER.indexOf(b.id);
        if (left !== right) return (left < 0 ? KIND_ORDER.length : left) - (right < 0 ? KIND_ORDER.length : right);
        return a.label.localeCompare(b.label);
      });
  }, [codex]);

  const pool = useMemo(
    () => (kind ? codex.filter((card) => (card.kind ?? 'ability') === kind) : codex),
    [codex, kind]
  );

  /* The chips are the tags this shelf actually holds. Offering the whole
     codex's tags while the spells are showing would offer schools you cannot
     see and rungs nothing on screen climbs. */
  const tags = useMemo(() => {
    const seen = new Set();
    for (const card of pool) for (const tag of card.tags ?? []) seen.add(tag);
    return [...seen].sort(compareTags).map((tag) => ({ id: tag, label: tag, kind: 'card' }));
  }, [pool]);

  const filter = useTagFilter(tags, { searchable: true });

  const shown = useMemo(
    () => pool.filter((card) => filter.matches(card.tags) && filter.text(cardHaystack(card))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool, filter.picked, filter.query]
  );

  const capped = !all && shown.length > WALL_CAP;
  const wall = capped ? shown.slice(0, WALL_CAP) : shown;

  return (
    <>
      <div className="shelf-kinds">
        <button
          type="button"
          className={`shelf-kind${kind === null ? ' is-on' : ''}`}
          onClick={() => {
            setKind(null);
            setAll(false);
          }}
        >
          Everything
          <span className="shelf-kind-count">{codex.length}</span>
        </button>

        {kinds.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`shelf-kind${kind === entry.id ? ' is-on' : ''}`}
            onClick={() => {
              setKind(entry.id);
              setAll(false);
            }}
          >
            {entry.label}
            <span className="shelf-kind-count">{entry.count}</span>
          </button>
        ))}
      </div>

      <TagFilter
        filter={filter}
        count={shown.length}
        noun="card"
        placeholder="Search every card by name, tag or rules text"
      />

      {shown.length === 0 ? (
        <p className="shelf-empty">Nothing on this shelf answers that. Drop a chip or a word.</p>
      ) : (
        <>
          <div className="card-brief-wall">
            {wall.map((card) => (
              <CardBrief
                key={card.id}
                card={card}
                character={character}
                onOpen={() => stack?.openCard(card)}
              />
            ))}
          </div>

          {capped && (
            <p className="shelf-more">
              Showing the first {WALL_CAP} of {shown.length}. Narrow it with a kind, a chip or a
              word.{' '}
              <button type="button" className="link shelf-more-btn" onClick={() => setAll(true)}>
                Or draw them all
              </button>
            </p>
          )}
        </>
      )}
    </>
  );
}
