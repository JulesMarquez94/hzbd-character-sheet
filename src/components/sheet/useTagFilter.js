import { useState } from 'react';

/**
 * The row of chips that narrows a wall of choices.
 *
 * Chips are grouped by kind — the attribute a talent leans on, the family an
 * ancestry belongs to. Picking more than one *within* a group widens the
 * result: "Martial or Support" is the question people actually ask. Picking
 * across groups narrows it, so "Instinct" plus "Martial" means both.
 *
 * The hook owns the whole filter, matcher included, so a caller can work out
 * what is visible before the chip row has rendered.
 */
export function useTagFilter(tags, { searchable = false } = {}) {
  const [picked, setPicked] = useState(() => new Set());
  const [query, setQuery] = useState('');

  const byKind = new Map();
  for (const tag of tags) {
    if (!picked.has(tag.id)) continue;
    byKind.set(tag.kind, [...(byKind.get(tag.kind) ?? []), tag.id]);
  }

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  return {
    tags,
    picked,
    query,
    setQuery,
    searchable,
    // Counted against the *current* tags, not the raw picked set: a chip whose
    // last carrier was discarded no longer filters, so it must not leave a
    // lone "Clear" button behind either.
    active: byKind.size > 0 || words.length > 0,

    toggle(id) {
      setPicked((prev) => {
        const next = new Set(prev);
        if (!next.delete(id)) next.add(id);
        return next;
      });
    },

    clear() {
      setPicked(new Set());
      setQuery('');
    },

    /** True when the entry carries at least one picked id from every group. */
    matches(entryTags) {
      if (picked.size === 0) return true;
      const has = new Set(entryTags ?? []);
      return [...byKind.values()].every((ids) => ids.some((id) => has.has(id)));
    },

    /**
     * True when every word typed appears somewhere in the fields given. Chips
     * narrow by what a card *is*; this narrows by what it says, which is the
     * only way to find a card whose name you half remember. Every word has to
     * hit, so two words narrow rather than widen.
     */
    text(...fields) {
      if (words.length === 0) return true;
      const hay = fields.filter(Boolean).join(' ').toLowerCase();
      return words.every((word) => hay.includes(word));
    },
  };
}
