import { useState } from 'react';
import { compareTags } from '../../lib/cardOrder.js';

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

/**
 * Every tag the pool carries, as the filter row wants them.
 *
 * Minus the ones every card in it carries. A chip that selects the whole pool
 * narrows nothing, and there is always at least one: a Mycomancer's pool is all
 * Primal, and a Duelist's is fourteen cards all tagged Martial Move. The pool has
 * to hold more than one card for the test to mean anything, and a pool whose every
 * tag is universal keeps them all rather than showing a filter row with nothing
 * in it.
 */
export function poolTags(options) {
  const tally = new Map();
  for (const option of options) {
    for (const tag of new Set(option.card.tags ?? [])) {
      tally.set(tag, (tally.get(tag) ?? 0) + 1);
    }
  }

  // Novice, Adept, Master and then the schools, never the alphabet. See cardOrder.js.
  const all = [...tally.keys()].sort(compareTags);
  const narrowing = options.length > 1 ? all.filter((tag) => tally.get(tag) < options.length) : all;

  return (narrowing.length > 0 ? narrowing : all).map((tag) => ({
    id: tag,
    label: tag,
    kind: 'card',
  }));
}
