import { useCallback, useMemo, useState } from 'react';
import AbilityBlock from './AbilityBlock.jsx';
import TagFilter from './TagFilter.jsx';
import BlockArrange from './BlockArrange.jsx';
import BlockTrays from './BlockTrays.jsx';
import { useTagFilter } from './useTagFilter.js';
import { CardStackProvider } from '../CardStack.jsx';
import {
  abilityOverview,
  abilitySources,
  cardHaystack,
  filterSources,
  heldCardTags,
} from '../../lib/abilitySources.js';
import {
  normalizeGridColumns,
  normalizeSourceOrder,
  normalizeTrays,
  trayedIds,
  trimGaps,
} from '../../lib/characterModel.js';

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

  /* Which sources were pinned to a tray rather than left on the grid. Read
     against every source the character has rather than against the filtered
     ones: a tray is not the tab, so narrowing the page never empties it. See
     BlockTrays.jsx. */
  const trays = useMemo(
    () => normalizeTrays(character?.ability_trays, sources.map((source) => source.id)),
    [character?.ability_trays, sources]
  );
  const saveTrays = useCallback((next) => patch?.({ ability_trays: next }), [patch]);

  /* The stored arrangement covers every source the character has, whether the
     filter is showing it or not, so narrowing the page and then moving a block
     can never drop a source out of the order. */
  const savedOrder = useMemo(
    () =>
      normalizeSourceOrder(
        character?.ability_order,
        sources.map((source) => source.id),
        trayedIds(trays)
      ),
    [character?.ability_order, sources, trays]
  );
  const saveOrder = useCallback((next) => patch?.({ ability_order: next }), [patch]);

  /* And how wide the grid they are laid out on is, this tab's own. See
     normalizeGridColumns. */
  const columns = normalizeGridColumns(character?.ability_columns);
  const saveColumns = useCallback((next) => patch?.({ ability_columns: next }), [patch]);

  /* Arranged from a list in a modal rather than by dragging the blocks where
     they sit — see the note at the top of BlockArrange.jsx. The list holds every
     source, including any the filter is hiding, so narrowing the page no longer
     narrows what can be moved. */
  const [arranging, setArranging] = useState(false);
  const order = savedOrder;

  const shown = useMemo(() => new Map(visible.map((source) => [source.id, source])), [visible]);
  /* Holes survive the filter, because a hole is a thing somebody arranged. What
     does not survive is a hole the filter *made* at the end of the layout, which
     nobody asked for. */
  const laidOut = trimGaps(order.filter((id) => id === null || shown.has(id)));

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

  /* A block on a tray is drawn off every source rather than off the filtered
     ones: the filter narrows the tab, and a tray is not the tab. */
  const trayed = (id) => (
    <AbilityBlock
      source={sources.find((source) => source.id === id)}
      character={character}
      patch={patch}
      readOnly={readOnly}
    />
  );

  const describe = (id) => {
    const source = sources.find((entry) => entry.id === id);
    return source ? { name: source.title, note: source.note } : null;
  };

  return (
    <CardStackProvider character={character}>
      <div className="abilities-tab">
        {/* The arrange button rides the end of the overview line rather than
            taking a row of its own beneath it — see the note over
            .sheet-arrange-bar in sheet.css. */}
        <Overview
          overview={overview}
          sources={sources.length}
          onArrange={sources.length > 1 && !readOnly && patch ? () => setArranging(true) : null}
        />

        {arranging && (
          <BlockArrange
            title="Arrange your ability blocks"
            order={order}
            columns={columns}
            onColumns={saveColumns}
            trays={trays}
            onTrays={patch ? saveTrays : null}
            describe={describe}
            onChange={saveOrder}
            onClose={() => setArranging(false)}
          />
        )}

        {/* Pinned to the window rather than laid on the tab. See BlockTrays. */}
        <BlockTrays trays={trays} render={trayed} describe={describe} />

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

            <div className="sheet-grid-6">
              {laidOut.map((id, at) =>
                id === null ? (
                  <div key={`gap-${at}`} className="cell-gap" aria-hidden="true" />
                ) : (
                  <section key={id} className={`sheet-cell src-${shown.get(id).kind}`}>
                    {block(id)}
                  </section>
                )
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
 *
 * The line ends with that number and with the arrange button, grouped: one
 * right-hand end to the header rather than two, at one width rather than two.
 */
function Overview({ overview, sources, onArrange }) {
  const counted = overview.total > 0;
  const end = overview.passive > 0 || Boolean(onArrange);

  if (!counted && !end) return null;

  return (
    <div className="abilities-overview">
      {counted && (
        <>
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
        </>
      )}

      {end && (
        <span className="overview-end">
          {overview.passive > 0 && (
            <span className="abilities-passive" title="Always true of you. Nothing to spend, ever.">
              {overview.passive} always on
            </span>
          )}

          {onArrange && (
            <button type="button" className="btn btn-minimal btn-sm" onClick={onArrange}>
              Arrange blocks
            </button>
          )}
        </span>
      )}
    </div>
  );
}
