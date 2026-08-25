import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import {
  ARMOR_SETS,
  OVERLOAD_STOP,
  carryState,
  forgedForSlot,
  heldItem,
  itemBurden,
  itemWeight,
  itemsForSlot,
  magicBurdenMax,
  magicBurdenUsed,
  placementOf,
  rarityColor,
} from '../../lib/items.js';
import { compareTags, sortItems } from '../../lib/cardOrder.js';
import { formatWeight } from '../../lib/characterModel.js';
import { getCard } from '../../lib/weapons.js';
import { useCardStack } from '../../context/card-stack.js';
import { useUnit } from '../../context/units.js';
import { ItemFoot, ItemIcon, ItemStats, ItemTags, ROW_ICON, StatText } from './itemParts.jsx';

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
        placeholder="Filter by tag"
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
 * What you are already carrying comes first, under its own heading, because
 * that is the question you actually walked in with: "have I got one of these?".
 * The whole codex is still here, one screen further down or one search away —
 * but nobody should have to read two hundred entries to find the boots already
 * in their pack.
 *
 * An item whose Magic Burden would push the wearer past capacity is shown,
 * but refuses to equip — the button itself says why.
 *
 * The belt does not live in the equipment map, so a loop hands its own
 * `current` in and names its buttons: you clip a potion on, you do not wear
 * it.
 *
 * ------------------------------------------------------------- a second one
 * Owning one of a thing was never a reason not to own two. Every row carries a
 * **+1** beside its main button that drops another copy straight into the
 * inventory — a second dagger, a third healing potion, the matching ring. It is
 * the codex, not a shop, so nothing is charged for; the ledger is where coin
 * moves.
 *
 * Equipping already took a carried copy from the pack rather than conjuring one,
 * which is exactly why this had to be its own button: "Equip" answers "wear the
 * one I have", and there was no way at all to say "get me another".
 *
 * It has to survive being clicked twice, which is why the shelf a row stands on
 * is settled when the window opens and left alone after. Read live off the pack,
 * the count moved the row out from under the pointer: a first +1 lifted the rope
 * off the codex shelf and into the inventory shelf above it, every row below slid
 * up by one, and the second click landed on whatever had taken the rope's place.
 * Three clicks bought three different things. Settled at open, the row holds
 * still and only its chip counts up.
 *
 * ---------------------------------------------------------------- the forge
 * `onForge` puts the way into the forge on the browser's own head, between the
 * title and the close — the codex is where you go looking for a thing, so it is
 * where "the thing I want is not in here" has to be answered.
 */
export default function ItemBrowser({
  slot,
  character,
  equipment,
  pack,
  items,
  current: currentOverride,
  equipLabel = 'Equip',
  equipTitle = '',
  equippedLabel = 'Worn',
  checkBurden = true,
  /* True where the main button makes a new one rather than taking the one you
     already carry: the inventory's own browser, where "Add" is the whole point.
     It only ever decides what the weight warning says. */
  conjures = false,
  onEquip,
  onUnequip,
  onAdd = null,
  onForge = null,
  onClose,
  readOnly,
}) {
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const stack = useCardStack();
  const unit = useUnit();

  /* The codex for this slot, and whatever this character has *made* for it. A
     forged piece is on the sheet rather than in the codex, so without the second
     half the ring somebody had just made was the one thing this window could not
     offer them. Theirs come first: they are the answer to "have I got one". */
  const compatible = useMemo(
    () => [...forgedForSlot(character, slot.key), ...(items ?? itemsForSlot(slot.key))],
    [character, items, slot.key]
  );
  /* `heldItem`, so a slot holding something the player made names it rather than
     drawing a blank where the codex has no such id. */
  const current =
    currentOverride !== undefined ? currentOverride : heldItem(character, equipment[slot.key]);

  // Every tag carried by an item this slot accepts, in first-seen order.
  const allTags = useMemo(() => {
    const tags = [];
    for (const item of compatible) {
      for (const tag of item.tags) if (!tags.includes(tag)) tags.push(tag);
    }
    // Rarity up its ladder rather than in whichever order the codex happened to
    // hand it over, the same as every other chip row. See cardOrder.js.
    return tags.sort(compareTags);
  }, [compatible]);

  /* Sorted, and it can be sorted flat because this window is one slot's: every
     piece in it is armor, or every piece is a weapon, so the category grouping
     the codex order was carrying here is grouping of one. What is left to order
     by is rarity and then the name, which is `compareItems`. */
  const filtered = sortItems(
    compatible.filter((item) => {
      if (query && !item.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return activeTags.every((tag) => item.tags.includes(tag));
    })
  );

  // Swapping frees the worn piece's burden before the new piece's is added.
  const burdenMax = magicBurdenMax(character);
  const burdenUsed = magicBurdenUsed(character);
  const burdenFreed = itemBurden(current);

  /* And the same question for weight, which is answered the opposite way.
     Burden refuses: a piece that would put the wearer past capacity cannot be
     equipped at all. Weight only warns. Being overloaded is a *condition*, and
     its price is already written into Speed, so nothing here stops a player
     picking a thing up: it says what it will cost and lets them decide.

     Two things make the projection less obvious than the burden one above it.
     Equipping a piece you already carry moves no weight at all (it was in the
     pack and now it is on you) and swapping puts the old piece in the pack, so
     it is *conjuring* a new one out of the codex that costs anything. And a bag
     changes the ceiling rather than the total, so its capacity has to be traded
     against the one coming off. */
  const carry = carryState(character);
  const capacityFreed = Number(current?.capacity) || 0;

  const packCount = (id) => pack.filter((packId) => packId === id).length;

  /* Which shelf a row stands on, decided once when the window opens. The pack
     moving underneath it is not allowed to move the row, which is what makes the
     +1 usable more than once — see the note on the header.

     The chip on the row and the +1's own hint stay live, because the count is
     what you are doing right now, while the shelf is the answer to the question
     you walked in with. */
  const [carriedAtOpen] = useState(() => new Set(pack));
  const wasCarried = (item) => !item.forged && carriedAtOpen.has(item.id);

  /* Three lists, one above the other, and all three narrowed by the same search
     so a tag or a name moves the lot together and none of them can quietly hide
     a match.

     The made ones are their own group rather than being folded into the pack,
     because "Everything else in the codex" is a lie about a ring somebody made
     last night, and a forged piece may equally be *worn* — in which case it is
     not in the pack either. What it always is, is theirs. */
  const made = filtered.filter((item) => item.forged);
  const carried = filtered.filter((item) => wasCarried(item));
  const elsewhere = filtered.filter((item) => !item.forged && !wasCarried(item));
  const carriesAny = compatible.some((item) => wasCarried(item));
  const madeAny = compatible.some((item) => item.forged);
  const searching = Boolean(query.trim()) || activeTags.length > 0;

  const groups = [
    madeAny && {
      id: 'made',
      label: 'Made by you',
      items: made,
      empty: 'Nothing you made matches that.',
    },
    /* Only when there is something on it, the way the made shelf already works.
       Empty, it used to carry the line "Nothing in your inventory goes here",
       which the first +1 turns into a flat contradiction: the new rope stays on
       the codex shelf with its chip reading In Pack ×1, and an empty shelf above
       it says you have none. Gone, it says the same thing and cannot be wrong. */
    carriesAny && {
      id: 'carried',
      label: 'In your inventory',
      items: carried,
      empty: 'Nothing you are carrying matches that.',
    },
    {
      id: 'codex',
      label: carriesAny || madeAny ? 'Everything else in the codex' : 'The codex',
      items: elsewhere,
      empty: searching ? 'Nothing else matches that.' : 'The codex holds nothing else for this slot.',
    },
  ].filter(Boolean);

  function toggleTag(tag) {
    setActiveTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));
  }

  /**
   * Where the load would stand with this piece taken, and whether that is worse
   * than where it stands now.
   *
   * `gained` is false when the piece is one already in the pack and the button
   * would only move it, which is most of what this window does. `worse` is what
   * decides whether the row says anything at all: a rucksack taken while already
   * overloaded improves matters, and a window that warned about it would be
   * warning about the fix.
   */
  function loadAfter(item, gained) {
    const used = carry.used + (gained ? itemWeight(item) : 0);
    const max = Math.max(0, carry.max - capacityFreed + (Number(item.capacity) || 0));
    const stopAt = Math.round(max * OVERLOAD_STOP * 100) / 100;

    const state = max > 0 && used >= stopAt ? 'stuck' : used > max ? 'over' : 'clear';
    const rank = { clear: 0, over: 1, stuck: 2 };

    return {
      used,
      max,
      state,
      /* Worse than now, either by crossing a line or by piling more on past one
         already crossed. */
      worse: rank[state] > rank[carry.state] || (state !== 'clear' && used > carry.used),
    };
  }

  return (
    <Modal
      title={`${slot.label} · Codex`}
      onClose={onClose}
      /* The three-block measure. This is a shelf and not a question: two hundred
         entries read three abreast instead of one, and the row you are reading is
         the width it will be once it is on your sheet. It comes back down to one
         column on its own as the window shrinks, so a phone is unchanged. */
      size="page"
      /* On the head rather than at the foot, because it is a different question
         from the one the list answers: everything below is "which of these", and
         this is "none of these". The Modal puts it between the title and the
         close for exactly that reason. */
      action={
        !readOnly && onForge ? (
          <button type="button" className="btn btn-minimal btn-sm" onClick={onForge}>
            + Make an Enchanted Item
          </button>
        ) : null
      }
    >
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

        {/* Where they already stand, said once, so a row's own chip only has to
            say that it makes things worse. Never a refusal: it is a line of
            weather, not a locked door. */}
        {carry.state !== 'clear' && (
          <p className={`browser-load browser-load-${carry.state}`}>
            <b>
              {formatWeight(carry.used, unit)} of {formatWeight(carry.max, unit)}
            </b>{' '}
            {carry.state === 'stuck'
              ? 'is more than 30% over your capacity, so you cannot move at all. You may still take more.'
              : 'is over your capacity, so your Speed is halved. You may still take more.'}
          </p>
        )}

        {/* The two ways of narrowing one shelf, so they share a row wherever
            there is a row to share. Stacked they were two boxes down the middle
            of a three-block window with nothing beside either of them. */}
        <div className="browser-find">
          <input
            className="form-input"
            type="search"
            placeholder="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search items by name"
          />

          <TagFilter tags={allTags} active={activeTags} onToggle={toggleTag} />
        </div>

        <div className="browser-list">
          {compatible.length === 0 ? (
            <p className="browser-empty">The codex holds nothing for this slot yet.</p>
          ) : (
            groups.map((group) => (
              <div className={`browser-group browser-group-${group.id}`} key={group.id}>
                <div className="browser-group-head">
                  <span className="browser-group-label">{group.label}</span>
                  <span className="browser-group-note">
                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {group.items.length === 0 ? (
                  <p className="browser-group-empty">{group.empty}</p>
                ) : (
                  group.items.map((item) => {
                    const equipped = current?.id === item.id;
                    /* A made piece is one *thing*, so it cannot be in two places
                       at once — see placementOf. Where it already is, the row says
                       so instead of offering to put it on twice. */
                    const alreadyOn = equipped || !item.forged ? null : placementOf(character, item.id);
                    const projected = burdenUsed - burdenFreed + itemBurden(item);
                    /* Burden is what you carry *on* you — a thing in your pack is
                       just weight, so the inventory never blocks on it.

                       Over capacity **and worse than now**. A sheet that is
                       already past its capacity (an older save, a Mind that came
                       down) could otherwise equip nothing at all, including the
                       things that would carry no Burden: every bag in the codex
                       was refused with "Would carry 23 Magic Burden", which was
                       true of the sheet and nothing to do with the bag. Anything
                       that adds to the load is refused exactly as before. */
                    const blocked =
                      checkBurden && projected > burdenMax && projected > burdenUsed;
                    const inPack = packCount(item.id);
                    /* What taking this one would do to the load. Nothing blocks
                       on it; the row wears the answer and the button still works. */
                    const load = loadAfter(item, conjures || inPack === 0);

                    // A belt item's one card is the item itself, so its name is only
                    // worth printing when it differs — a weapon's two always do.
                    const teaches = (item.abilities ?? [])
                      .map((id) => getCard(id)?.name)
                      .filter((name) => name && name !== item.name);

                    return (
                      <div
                        key={item.id}
                        className={`item-row${equipped ? ' equipped' : ''}`}
                        style={{ borderLeftColor: rarityColor(item) }}
                      >
                        <div className="item-row-body">
                          <span className="item-row-top">
                            <ItemIcon item={item} size={ROW_ICON} />
                            <span className="item-row-ident">
                              <span className="item-row-line">
                                <span className="item-row-name">{item.name}</span>
                                {inPack > 0 && (
                                  <span className="pack-chip" title="Carried in your pack · equipping takes it from there">
                                    In Pack{inPack > 1 ? ` ×${inPack}` : ''}
                                  </span>
                                )}
                                {/* The warning, and only ever a warning. The button
                                    beside it works either way. */}
                                {load.worse && (
                                  <span
                                    className={`load-chip load-chip-${load.state}`}
                                    title={`You would be carrying ${formatWeight(
                                      load.used,
                                      unit
                                    )} of ${formatWeight(load.max, unit)}. ${
                                      load.state === 'stuck'
                                        ? 'That is 30% over, so you would not be able to move.'
                                        : 'Over your capacity your Speed is halved.'
                                    }`}
                                  >
                                    {load.state === 'stuck' ? 'Cannot move' : 'Overloaded'}
                                  </span>
                                )}
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
                          {/* A weapon is worth what it teaches — name both cards up front. */}
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
                            className="item-info-btn"
                            onClick={() => stack?.openItem(item)}
                            title={`${item.name} · details and lore`}
                            aria-label={`${item.name} details`}
                          >
                            i
                          </button>

                          {/* Owning one is not a reason not to own two. This is
                              the only way to say "get me another": the main
                              button takes the copy already in the pack.

                              Never on a made piece. Its id is an *instance*, so
                              a second pack entry pointing at it would be two
                              rows that are secretly one ring. A second of those
                              is made by pasting its code again, which mints a
                              new instance — and the code is on the row's own
                              card and on its equip prompt. */}
                          {!readOnly && onAdd && !item.forged && (
                            <button
                              type="button"
                              className="item-info-btn browser-add-btn"
                              onClick={() => onAdd(item)}
                              title={
                                inPack > 0
                                  ? `Get another ${item.name} · you would have ${inPack + 1}`
                                  : `Get a ${item.name}, into your inventory`
                              }
                              aria-label={`Add another ${item.name} to your inventory`}
                            >
                              +1
                            </button>
                          )}

                          {!readOnly &&
                            (equipped ? (
                              <span className="browser-equipped-mark">{equippedLabel}</span>
                            ) : alreadyOn ? (
                              <button
                                type="button"
                                className="btn btn-sm browser-blocked"
                                disabled
                                title={`${item.name} is already on you, in ${alreadyOn}. Take it off first. There is only one of it.`}
                              >
                                On you
                              </button>
                            ) : blocked ? (
                              <button
                                type="button"
                                className="btn btn-sm browser-blocked"
                                disabled
                                title={`Would carry ${projected} Magic Burden. Your capacity is ${burdenMax}.`}
                              >
                                Over Burden
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-copper btn-sm"
                                title={equipTitle || undefined}
                                onClick={() => onEquip(slot.key, item)}
                              >
                                {equipLabel}
                              </button>
                            ))}
                        </ItemFoot>
                      </div>
                    );
                  })
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
