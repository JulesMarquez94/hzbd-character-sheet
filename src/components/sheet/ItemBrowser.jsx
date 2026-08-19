import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import {
  ARMOR_SETS,
  getItem,
  itemBurden,
  itemsForSlot,
  magicBurdenMax,
  magicBurdenUsed,
} from '../../lib/items.js';
import { getCard } from '../../lib/weapons.js';
import { useCardStack } from '../../context/card-stack.js';
import { ItemIcon, ItemTags, ItemValues, StatText } from './itemParts.jsx';

/**
 * Tag filtering that survives a long tag list: type to find a tag and click
 * it to add, click an added tag to drop it. Nothing is listed a hundred chips
 * wide — only what you are already filtering by, and what your search finds.
 */
function TagFilter({ tags, active, onToggle }) {
  const [tagQuery, setTagQuery] = useState('');

  const query = tagQuery.trim().toLowerCase();
  const matches = query
    ? tags.filter((tag) => !active.includes(tag) && tag.toLowerCase().includes(query)).slice(0, 8)
    : [];

  return (
    <div className="tag-filter">
      <input
        className="form-input"
        type="search"
        placeholder="Filter by tag…"
        value={tagQuery}
        onChange={(e) => setTagQuery(e.target.value)}
        aria-label="Search tags"
      />

      {query && (
        <div className="tag-suggestions">
          {matches.length === 0 ? (
            <span className="tag-suggest-empty">No tag matches “{tagQuery}”.</span>
          ) : (
            matches.map((tag) => (
              <button
                key={tag}
                type="button"
                className="filter-chip"
                onClick={() => {
                  onToggle(tag);
                  setTagQuery('');
                }}
              >
                + {tag}
              </button>
            ))
          )}
        </div>
      )}

      {active.length > 0 && (
        <div className="filter-group">
          {active.map((tag) => (
            <button
              key={tag}
              type="button"
              className="filter-chip active"
              onClick={() => onToggle(tag)}
              title="Remove this filter"
            >
              {tag} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The codex browser for one slot: everything compatible with it, searchable by
 * name and filterable by tag. Equipping from here swaps with whatever is
 * already there (the old piece drops into the pack); a piece already in the
 * pack is taken from it instead of conjured.
 *
 * An item whose Magic Burden would push the wearer past capacity is shown,
 * but refuses to equip — the button itself says why.
 *
 * The belt does not live in the equipment map, so a loop hands its own
 * `current` in and names its buttons: you clip a potion on, you do not wear
 * it.
 */
export default function ItemBrowser({
  slot,
  character,
  equipment,
  pack,
  belt = [],
  items,
  current: currentOverride,
  equipLabel = 'Equip',
  equippedLabel = 'Worn',
  checkBurden = true,
  onEquip,
  onUnequip,
  onClose,
  readOnly,
}) {
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const stack = useCardStack();

  const compatible = useMemo(() => items ?? itemsForSlot(slot.key), [items, slot.key]);
  const current = currentOverride !== undefined ? currentOverride : getItem(equipment[slot.key]);

  // Every tag carried by an item this slot accepts, in first-seen order.
  const allTags = useMemo(() => {
    const tags = [];
    for (const item of compatible) {
      for (const tag of item.tags) if (!tags.includes(tag)) tags.push(tag);
    }
    return tags;
  }, [compatible]);

  const filtered = compatible.filter((item) => {
    if (query && !item.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return activeTags.every((tag) => item.tags.includes(tag));
  });

  // Swapping frees the worn piece's burden before the new piece's is added.
  const burdenMax = magicBurdenMax(character);
  const burdenUsed = magicBurdenUsed(equipment, belt);
  const burdenFreed = itemBurden(current);

  const packCount = (id) => pack.filter((packId) => packId === id).length;

  function toggleTag(tag) {
    setActiveTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));
  }

  return (
    <Modal title={`${slot.label} — Codex`} onClose={onClose}>
      <div className="item-browser">
        {current && (
          <div className="browser-current">
            <ItemIcon item={current} />
            <div className="browser-current-body">
              <span className="browser-current-label">Equipped</span>
              <span className="browser-current-name">{current.name}</span>
            </div>
            {!readOnly && (
              <button type="button" className="btn btn-minimal btn-sm" onClick={() => onUnequip(slot.key)}>
                Send to Inventory
              </button>
            )}
          </div>
        )}

        <input
          className="form-input"
          type="search"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search items by name"
        />

        <TagFilter tags={allTags} active={activeTags} onToggle={toggleTag} />

        <div className="browser-list">
          {filtered.length === 0 && (
            <p className="browser-empty">
              {compatible.length === 0
                ? 'The codex holds nothing for this slot yet.'
                : 'Nothing matches that search.'}
            </p>
          )}

          {filtered.map((item) => {
            const equipped = current?.id === item.id;
            const projected = burdenUsed - burdenFreed + itemBurden(item);
            // Burden is what you carry *on* you — a thing in your pack is
            // just weight, so the inventory never blocks on it.
            const blocked = checkBurden && projected > burdenMax;
            const inPack = packCount(item.id);

            // A belt item's one card is the item itself, so its name is only
            // worth printing when it differs — a weapon's two always do.
            const teaches = (item.abilities ?? [])
              .map((id) => getCard(id)?.name)
              .filter((name) => name && name !== item.name);

            return (
              <div key={item.id} className={`browser-item${equipped ? ' equipped' : ''}`}>
                <ItemIcon item={item} />

                <div className="browser-item-body">
                  <div className="browser-item-head">
                    <span className="browser-item-name">{item.name}</span>
                    {inPack > 0 && (
                      <span className="pack-chip" title="Carried in your pack — equipping takes it from there">
                        In Pack{inPack > 1 ? ` ×${inPack}` : ''}
                      </span>
                    )}
                  </div>
                  <ItemTags item={item} />
                  <ItemValues item={item} />
                  {item.blurb && <p className="browser-item-effect">{item.blurb}</p>}
                  {item.effect && (
                    <p className="browser-item-effect">
                      <StatText text={item.effect} />
                    </p>
                  )}
                  {/* A weapon is worth what it teaches — name both cards up front. */}
                  {teaches.length > 0 && (
                    <p className="browser-item-teaches">
                      <span className="setbonus-label">Teaches</span> {teaches.join(' · ')}
                    </p>
                  )}
                  {item.set && ARMOR_SETS[item.set] && (
                    <p className="browser-item-setbonus">
                      <span className="setbonus-label">Set Bonus</span>{' '}
                      <StatText text={ARMOR_SETS[item.set].bonus} />
                    </p>
                  )}
                </div>

                <div className="browser-item-action">
                  <button
                    type="button"
                    className="item-info-btn"
                    onClick={() => stack?.openItem(item)}
                    title={`${item.name} — details and lore`}
                    aria-label={`${item.name} details`}
                  >
                    i
                  </button>

                  {!readOnly &&
                    (equipped ? (
                      <span className="browser-equipped-mark">{equippedLabel}</span>
                    ) : blocked ? (
                      <button
                        type="button"
                        className="btn btn-sm browser-blocked"
                        disabled
                        title={`Would carry ${projected} Magic Burden — your capacity is ${burdenMax}.`}
                      >
                        Over Burden
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-copper btn-sm"
                        onClick={() => onEquip(slot.key, item)}
                      >
                        {equipLabel}
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
