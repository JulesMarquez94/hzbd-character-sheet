import { useMemo, useState } from 'react';
import { ItemFoot, ItemIcon, ItemStats, ItemTags, ROW_ICON, StatText } from '../sheet/itemParts.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { compareTags, sortItems } from '../../lib/cardOrder.js';
import { ARMOR_SETS, CATEGORY_ORDER, ITEMS, itemCategory, rarityColor } from '../../lib/items.js';
import { getCard } from '../../lib/weapons.js';

/**
 * Everything a character can own, read rather than bought.
 *
 * The same rows the sheet's own codex browser draws, with the buttons that
 * equip taken off: this is a shelf you read, not a shop. The whole of one is
 * still a click behind, on the card stack, which is where its lore, its
 * workings and the cards it teaches are.
 *
 * Rows rather than cards, because an item is a line of numbers. What a
 * longsword costs, what it weighs and what it teaches are three answers you
 * read down a column, and a wall of 92-pixel plates cannot be read down a
 * column at all.
 */

const SEARCH_HINT = 'Search by name, tag or what it does';

/** Everything the search box may look inside on an item. */
function haystack(item) {
  return [item.name, item.blurb, item.effect, item.set, ...(item.tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export default function ItemShelf() {
  const stack = useCardStack();
  const [category, setCategory] = useState('Armor');
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState([]);
  const [tagQuery, setTagQuery] = useState('');

  const codex = useMemo(() => sortItems(ITEMS), []);

  const categories = useMemo(() => {
    const tally = new Map();
    for (const item of codex) {
      const name = itemCategory(item);
      tally.set(name, (tally.get(name) ?? 0) + 1);
    }
    return CATEGORY_ORDER.filter((name) => tally.has(name)).map((name) => ({
      id: name,
      count: tally.get(name),
    }));
  }, [codex]);

  const pool = useMemo(
    () => (category ? codex.filter((item) => itemCategory(item) === category) : codex),
    [codex, category]
  );

  /* The chips this shelf actually holds. Offering the whole codex's tags while
     the armor is showing would offer a Reload nothing on screen has. */
  const shelfTags = useMemo(() => {
    const seen = new Set();
    for (const item of pool) for (const tag of item.tags ?? []) seen.add(tag);
    return [...seen].sort(compareTags);
  }, [pool]);

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = pool.filter((item) => {
    if (!tags.every((tag) => (item.tags ?? []).includes(tag))) return false;
    if (words.length === 0) return true;
    const hay = haystack(item);
    return words.every((word) => hay.includes(word));
  });

  const typed = tagQuery.trim().toLowerCase();
  const suggestions = typed
    ? shelfTags.filter((tag) => !tags.includes(tag) && tag.toLowerCase().includes(typed)).slice(0, 8)
    : [];

  function toggle(tag) {
    setTags((held) => (held.includes(tag) ? held.filter((one) => one !== tag) : [...held, tag]));
  }

  /* A shelf is switched by a different question from the one the chips answer,
     so switching one drops the other rather than carrying a Head Gear chip onto
     the weapon rack where it matches nothing. */
  function pick(next) {
    setCategory(next);
    setTags([]);
    setTagQuery('');
  }

  return (
    <>
      <div className="shelf-kinds">
        <button
          type="button"
          className={`shelf-kind${category === null ? ' is-on' : ''}`}
          onClick={() => pick(null)}
        >
          Everything
          <span className="shelf-kind-count">{codex.length}</span>
        </button>

        {categories.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`shelf-kind${category === entry.id ? ' is-on' : ''}`}
            onClick={() => pick(entry.id)}
          >
            {entry.id}
            <span className="shelf-kind-count">{entry.count}</span>
          </button>
        ))}
      </div>

      <div className="shelf-find">
        <input
          className="form-input"
          type="search"
          placeholder={SEARCH_HINT}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={SEARCH_HINT}
        />

        <div className="tag-filter">
          <input
            className="form-input"
            type="search"
            placeholder="Filter by tag"
            value={tagQuery}
            onChange={(event) => setTagQuery(event.target.value)}
            aria-label="Search item tags"
          />

          {typed && (
            <div className="tag-suggestions">
              {suggestions.length === 0 ? (
                <span className="tag-suggest-empty">No tag matches that.</span>
              ) : (
                suggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="filter-chip"
                    onClick={() => {
                      toggle(tag);
                      setTagQuery('');
                    }}
                  >
                    + {tag}
                  </button>
                ))
              )}
            </div>
          )}

          {tags.length > 0 && (
            <div className="filter-group">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="filter-chip active"
                  onClick={() => toggle(tag)}
                  title="Drop this filter"
                >
                  {tag} ×
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="shelf-count">
        {shown.length} {shown.length === 1 ? 'item' : 'items'}
      </p>

      {shown.length === 0 ? (
        <p className="shelf-empty">Nothing on this shelf answers that. Drop a chip or a word.</p>
      ) : (
        <div className="shelf-rows">
          {shown.map((item) => {
            /* A belt item's one card is the item itself, so its name is only
               worth printing when it differs. A weapon's two always do. */
            const teaches = (item.abilities ?? [])
              .map((id) => getCard(id)?.name)
              .filter((name) => name && name !== item.name);

            return (
              <div
                key={item.id}
                className="item-row"
                style={{ borderLeftColor: rarityColor(item) }}
              >
                <div className="item-row-body">
                  <span className="item-row-top">
                    <ItemIcon item={item} size={ROW_ICON} />
                    <span className="item-row-ident">
                      <span className="item-row-line">
                        <span className="item-row-name">{item.name}</span>
                      </span>
                      <ItemTags item={item} />
                    </span>
                  </span>

                  <ItemStats item={item} />

                  {item.blurb && <p className="item-row-text">{item.blurb}</p>}
                  {item.effect && (
                    <p className="item-row-text">
                      <StatText text={item.effect} />
                    </p>
                  )}
                  {teaches.length > 0 && (
                    <p className="item-row-text browser-teaches">
                      <span className="setbonus-label">Teaches</span> {teaches.join(' · ')}
                    </p>
                  )}
                  {item.set && ARMOR_SETS[item.set] && (
                    <p className="item-row-text browser-setbonus">
                      <span className="setbonus-label">Set Bonus</span>{' '}
                      <StatText text={ARMOR_SETS[item.set].bonus} />
                    </p>
                  )}
                </div>

                <ItemFoot item={item}>
                  <button
                    type="button"
                    className="btn btn-minimal btn-sm"
                    onClick={() => stack?.openItem(item)}
                    title={`${item.name} · details and lore`}
                  >
                    Read it
                  </button>
                </ItemFoot>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
