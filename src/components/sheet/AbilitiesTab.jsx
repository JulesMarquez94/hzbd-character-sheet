import { useCallback, useMemo } from 'react';
import AbilityBlock from './AbilityBlock.jsx';
import TagFilter from './TagFilter.jsx';
import useBlockReorder from './useBlockReorder.js';
import { useTagFilter } from './useTagFilter.js';
import { CardStackProvider } from '../CardStack.jsx';
import {
  abilityOverview,
  abilitySources,
  cardHaystack,
  filterSources,
  heldCardTags,
} from '../../lib/abilitySources.js';
import { normalizeSourceOrder } from '../../lib/characterModel.js';

/**
 * The Abilities tab: everything this character can do, filed under whoever
 * gave it to them.
 *
 * The Character tab is where abilities are *spent* and the Advancement tab is
 * where they are *bought*. This is the third thing, the one a player actually
 * needs mid-session: the whole of what they know, in summary, in one place.
 * Every card here is a brief you tap to read the card itself.
 *
 * One block per source, and a source is one thing that gave you something: your
 * lineage, your background, the levels you have lived through, each talent set
 * you hold, the gear you have on. The block is titled with the source, never
 * with the kind of card inside it, because "where did I get this" is the
 * question a sheet cannot otherwise answer. Inside a block the cards sit under
 * the rank, level or item that handed them over.
 *
 * The blocks are the player's to arrange, exactly as the Character tab's are,
 * and the arrangement is stored on the character so it follows the sheet rather
 * than the browser it was set in. A source that appears later, a set taken at
 * level 6, lands at the end rather than disturbing what is already placed.
 *
 * Above them, the filter: chips for what a card is, a box for what it says.
 * Both narrow the cards *inside* the blocks, and a block left holding nothing
 * steps aside until the filter is cleared. That way a search for "poison" is a
 * page of the poison you have, still grouped by where it came from, rather than
 * a page of mostly-empty rectangles.
 */
export default function AbilitiesTab({ character, patch, readOnly = false }) {
  const sources = useMemo(() => abilitySources(character), [character]);
  const overview = useMemo(() => abilityOverview(sources), [sources]);
  const tags = useMemo(() => heldCardTags(sources), [sources]);

  const filter = useTagFilter(tags, { searchable: true });

  /* Chips narrow by what a card is, the box by what it says, and a card has to
     satisfy both. Everything a card carries is searchable, tags and rules text
     included, because the half-remembered word is as often in the body as in
     the name. */
  const visible = useMemo(
    () =>
      filterSources(sources, (card) => filter.matches(card.tags) && filter.text(cardHaystack(card)), {
        active: filter.active,
      }),
    [sources, filter]
  );

  /* The stored arrangement covers every source the character has, whether the
     filter is showing it or not, so narrowing the page and then moving a block
     can never drop a source out of the order. */
  const savedOrder = useMemo(
    () => normalizeSourceOrder(character?.ability_order, sources.map((source) => source.id)),
    [character?.ability_order, sources]
  );
  const saveOrder = useCallback((next) => patch?.({ ability_order: next }), [patch]);

  const { order, ghost, dragId, registerCell, gripProps } = useBlockReorder({
    order: savedOrder,
    onChange: saveOrder,
    disabled: readOnly || !patch,
  });

  const shown = useMemo(() => new Map(visible.map((source) => [source.id, source])), [visible]);
  const laidOut = order.filter((id) => shown.has(id));

  const hidden = sources.length - visible.length;
  const shownCards = visible.reduce(
    (total, source) =>
      total + source.sections.reduce((sum, part) => sum + part.cards.length, 0),
    0
  );

  const block = (id) => (
    <AbilityBlock
      source={shown.get(id)}
      character={character}
      patch={patch}
      readOnly={readOnly}
    />
  );

  return (
    <CardStackProvider character={character}>
      <div className="abilities-tab">
        <Overview overview={overview} sources={sources.length} />

        {sources.length > 0 && (
          <TagFilter
            filter={filter}
            count={shownCards}
            noun="ability"
            plural="abilities"
            placeholder="Search your abilities"
          />
        )}

        {sources.length === 0 ? (
          <p className="pick-line abilities-empty">
            Nothing yet. Your lineage, your background and your first talent set are chosen on the
            Advancement tab, and everything they hand you appears here.
          </p>
        ) : laidOut.length === 0 ? (
          <p className="pick-line abilities-empty">
            Nothing you hold matches that. Clear the filter to see all {overview.total} again.
          </p>
        ) : (
          <>
            {hidden > 0 && (
              <p className="abilities-hidden">
                {hidden} {hidden === 1 ? 'block has' : 'blocks have'} nothing that matches, so{' '}
                {hidden === 1 ? 'it is' : 'they are'} set aside while the filter is on.
              </p>
            )}

            <div className={`sheet-grid-6${dragId ? ' is-reordering' : ''}`}>
              {laidOut.map((id, index) => (
                <section
                  key={id}
                  ref={(node) => registerCell(id, node)}
                  className={`sheet-cell src-${shown.get(id).kind}${
                    dragId === id ? ' is-dragging' : ''
                  }`}
                >
                  {!readOnly && patch && (
                    <button
                      type="button"
                      className="cell-grip"
                      title="Drag to move this block — or focus it and use the arrow keys"
                      aria-label={`${shown.get(id).title}, block ${index + 1} of ${
                        laidOut.length
                      }. Drag, or press the arrow keys, to move it.`}
                      {...gripProps(id)}
                    >
                      <span className="grip-dots" aria-hidden="true" />
                    </button>
                  )}
                  {block(id)}
                </section>
              ))}

              {/* The copy under the pointer. The block itself stays put as the
                  empty slot it came from, so nothing has to animate away. */}
              {ghost && shown.has(ghost.id) && (
                <div
                  className={`sheet-cell cell-ghost src-${shown.get(ghost.id).kind}`}
                  style={{
                    left: `${ghost.x - ghost.offX}px`,
                    top: `${ghost.y - ghost.offY}px`,
                    width: `${ghost.w}px`,
                    height: `${ghost.h}px`,
                  }}
                  aria-hidden="true"
                  inert
                >
                  <span className="cell-grip">
                    <span className="grip-dots" />
                  </span>
                  {block(ghost.id)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </CardStackProvider>
  );
}

/**
 * What the tab says about itself before you have read a single card.
 *
 * Counted by what a card *is* rather than by where it came from: the blocks
 * below already answer "where from", and the question this answers is the other
 * one. Passives get their own number because they are the half of a sheet
 * nobody remembers they have.
 */
function Overview({ overview, sources }) {
  if (overview.total === 0) return null;

  return (
    <div className="abilities-overview">
      <span className="abilities-total">
        <span className="abilities-total-n">{overview.total}</span>
        <span className="abilities-total-label">
          {overview.total === 1 ? 'ability' : 'abilities'} from {sources}{' '}
          {sources === 1 ? 'source' : 'sources'}
        </span>
      </span>

      <span className="abilities-kinds">
        {overview.kinds.map((kind) => (
          <span className={`abilities-kind ac-kind-${kind.id}`} key={kind.id}>
            <b>{kind.count}</b> {kind.count === 1 ? kind.label : kind.plural}
          </span>
        ))}
      </span>

      {overview.passive > 0 && (
        <span className="abilities-passive" title="Always true of you. Nothing to spend, ever.">
          {overview.passive} always on
        </span>
      )}
    </div>
  );
}
