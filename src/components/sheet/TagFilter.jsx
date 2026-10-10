import { useMemo, useRef, useState } from 'react';
import { tagStyle } from '../../lib/tagColors.js';

/**
 * The row that narrows a wall of choices.
 *
 * One box, and you write in it. It used to print every tag the pool carried as
 * a chip, which on the Abilities tab is forty chips before a single card — a
 * list you read rather than a filter you use. Now the box narrows by what a
 * card *says* as you type, and offers the tags that match what you have typed
 * so far; taking one turns it into a chip that narrows by what a card *is*.
 * Nothing is listed a hundred chips wide. This is the same gesture the item
 * codex has always used (see the private filter in ItemBrowser.jsx).
 *
 * Enter takes the first suggestion, Backspace on an empty box gives the last
 * chip back, and a chip is dropped by clicking it.
 *
 * A chip naming a school or a family wears that school's colour, both as a
 * suggestion and once it is taken (see tagColors.js). It is the same colour the
 * cards under the row are chipped with, so "Ethereal" in the box and Ethereal on
 * a brief are visibly the same thing. Every other chip keeps the copper the row
 * has always used.
 *
 * The filter itself, what is picked and what matches, lives in useTagFilter.js
 * so a caller can work out what is visible before this has rendered.
 */
export default function TagFilter({
  filter,
  count,
  noun,
  // Most nouns this row counts take a plain s. "Ability" does not, so a caller
  // may hand its own plural in rather than get "15 abilitys".
  plural = `${noun}s`,
  placeholder = 'Search',
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const picked = filter.tags.filter((tag) => filter.picked.has(tag.id));

  /* What the half-typed word could still become. Anything already taken drops
     out, and an empty box offers nothing at all — being handed the whole list
     the moment you focus the box is the thing this replaced. */
  const matches = useMemo(() => {
    const query = filter.query.trim().toLowerCase();
    if (!query) return [];
    return filter.tags
      .filter((tag) => !filter.picked.has(tag.id) && tag.label.toLowerCase().includes(query))
      .slice(0, 8);
  }, [filter.tags, filter.picked, filter.query]);

  const showSuggestions = open && matches.length > 0;

  function add(tag) {
    filter.toggle(tag.id);
    filter.setQuery('');
    inputRef.current?.focus();
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' && matches.length > 0) {
      event.preventDefault();
      add(matches[0]);
      return;
    }
    // An empty box and a Backspace means the last chip, the way every other
    // token field behaves.
    if (event.key === 'Backspace' && filter.query === '' && picked.length > 0) {
      filter.toggle(picked[picked.length - 1].id);
      return;
    }
    if (event.key === 'Escape' && showSuggestions) {
      // The first Escape dismisses the suggestions; only the next one reaches
      // the dialog this row usually lives in.
      event.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div className="tag-filter-bar">
      <input
        ref={inputRef}
        className="form-input filter-search"
        type="text"
        value={filter.query}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => {
          filter.setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        /* Late enough that a click on a suggestion lands first. */
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />

      <span className="spacer" />

      <span className="tag-filter-count">
        {count} {count === 1 ? noun : plural}
      </span>

      {filter.active && (
        <button type="button" className="text-btn" onClick={filter.clear}>
          Clear
        </button>
      )}

      {showSuggestions && (
        <div className="tag-filter-line">
          <div className="tag-suggestions">
            {matches.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={`filter-chip${tagStyle(tag.label) ? ' is-toned' : ''}`}
                style={tagStyle(tag.label)}
                /* Keeps the box focused so the blur above never beats the click. */
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => add(tag)}
              >
                + {tag.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {picked.length > 0 && (
        <div className="tag-filter-line">
          <div className="filter-group">
            {picked.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={`filter-chip active${tagStyle(tag.label) ? ' is-toned' : ''}`}
                style={tagStyle(tag.label)}
                onClick={() => filter.toggle(tag.id)}
                title="Remove this filter"
              >
                {tag.label} ×
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
