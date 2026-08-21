import { useState } from 'react';
import EquipPrompt from './EquipPrompt.jsx';
import ItemBrowser from './ItemBrowser.jsx';
import TagFilter from './TagFilter.jsx';
import Modal from '../Modal.jsx';
import useFoldedGroups from './useFoldedGroups.js';
import { GroupHead } from './parts.jsx';
import { ItemIcon, ItemTags, ItemValues, SlotGlyph } from './itemParts.jsx';
import { useTagFilter } from './useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import {
  CATEGORY_ORDER,
  ITEMS,
  heldItem,
  isCustomEntry,
  itemCategory,
  packTags,
} from '../../lib/items.js';

/**
 * The Inventory tab's fourth block: everything carried and nothing equipped.
 *
 * It reads like the codex does — icon, name, tags, numbers — but shelved: a
 * heading per kind of thing, and alphabetical inside each. Duplicates stack
 * into one row with a count.
 *
 * A shelf folds. This is the third block on the sheet that scrolls, and folding
 * is what keeps that scroll short here for the same reason it does on the
 * Character tab: forty things across six kinds is a list you scroll past to
 * reach the one kind you came for. The heading is the control and it keeps its
 * count, so a folded Armor still says how many pieces are behind it. What is
 * folded is remembered per character, in localStorage. See useFoldedGroups.js.
 *
 * A filter opens every shelf while it is on. "Where is my rope?" is already the
 * question a fold answers the wrong way round: a match hidden behind a closed
 * heading is a search that found nothing.
 *
 * Above the shelves is the filter row the Abilities tab and the codex wear:
 * type to narrow by what a thing says, take a tag it offers to narrow by what
 * a thing is. It is the only block on this tab that carries one, and so the
 * only one whose head does not count — the filter row counts for it.
 *
 * Two things can be added. Anything the codex knows comes in through the same
 * browser every slot uses. Anything it does not — a folded note, a river
 * stone, a letter someone gave you — is written straight in: a name, a line
 * about what it is, and no rules at all.
 *
 * Three of a thing is that same browser and the +1 on its row, clicked three
 * times. That button takes a copy and leaves the codex standing, so the row's
 * own count ticks up where it is and the next click is the same click. "Add" is
 * the other half of the pair, for when one is all you came for: it takes one and
 * shuts the window.
 *
 * A row is a button. Tapping one asks where that piece goes: every slot on
 * the character it fits, what each of them is holding now, and the swap itself
 * if you pick an occupied one. See EquipPrompt.jsx.
 *
 * This is also the only place on the sheet where a thing can actually be
 * destroyed. Taking gear off anywhere else only sends it here.
 */
export default function PackBlock({
  character,
  equipment,
  belt,
  beltSlots,
  pack,
  trinkets,
  equip,
  clipToBelt,
  wearTrinket,
  addToPack,
  addCustomToPack,
  updateCustomInPack,
  discardFromPack,
  onForge,
  readOnly = false,
}) {
  const [browsing, setBrowsing] = useState(false);
  const [editing, setEditing] = useState(null); // { id?, name, note }
  const [discarding, setDiscarding] = useState(null); // { index, name }
  const [equipping, setEquipping] = useState(null); // { item, carried }
  const stack = useCardStack();

  /* The same filter the Abilities tab and the codex use: a box that narrows
     by what a thing says, offering the tags it finds as you type, and a chip
     for each one taken. Rarity is its own group, so Common and Rare widen
     while Common and Head Gear narrow. */
  const filter = useTagFilter(packTags(character, pack), { searchable: true });
  const { isFolded, toggle } = useFoldedGroups('pack', character?.id);

  const shelves = shelvePack(character, pack, filter);
  const carried = pack.length;
  const shown = shelves.reduce((total, shelf) => total + shelf.count, 0);

  return (
    <div className="cell-scroll pack-block">
      {/* The head every block on this tab wears, and the two ways something
          gets added. The count is the filter row's, just below: the other three
          blocks count against a ceiling, a pack has none. */}
      <div className="block-head pack-head">
        <span className="stat-category-label">Inventory</span>

        {!readOnly && (
          <span className="pack-actions">
            <button type="button" className="btn btn-minimal btn-sm" onClick={() => setBrowsing(true)}>
              + Item
            </button>
            <button
              type="button"
              className="btn btn-minimal btn-sm"
              onClick={() => setEditing({ name: '', note: '' })}
            >
              + Something Else
            </button>
          </span>
        )}
      </div>

      <TagFilter
        filter={filter}
        count={shown}
        noun="thing"
        placeholder="Search your inventory"
      />
      <div className="pack-list">
        {shelves.length === 0 && (
          <p className="browser-empty">
            {carried === 0
              ? 'You are carrying nothing.'
              : `Nothing you carry matches that. Clear the filter to see all ${carried} again.`}
          </p>
        )}

        {shelves.map(({ category, id, count, rows }) => {
          const folded = !filter.active && isFolded(id);

          return (
            <section className="pack-shelf" key={category}>
              <GroupHead
                className="pack-shelf-head"
                label={category}
                count={count}
                folded={folded}
                onToggle={() => toggle(id)}
              />

              {!folded && rows.map((row) =>
                row.custom ? (
                  <div className="pack-row pack-row-custom" key={row.key}>
                    <span className="equip-glyph">
                      <SlotGlyph slot="note" />
                    </span>

                    <button
                      type="button"
                      className="pack-row-body pack-row-edit"
                      disabled={readOnly}
                      onClick={() => setEditing({ ...row.entry })}
                      title={readOnly ? row.entry.name : `Edit ${row.entry.name}`}
                    >
                      <span className="pack-row-head">
                        <span className="pack-row-name">{row.entry.name}</span>
                      </span>
                      {row.entry.note && <span className="pack-note">{row.entry.note}</span>}
                    </button>

                    {!readOnly && (
                      <DiscardButton
                        name={row.entry.name}
                        onClick={() => setDiscarding({ index: row.indices[0], name: row.entry.name })}
                      />
                    )}
                  </div>
                ) : (
                  <div className="pack-row" key={row.key}>
                    <ItemIcon item={row.item} />

                    <button
                      type="button"
                      className="pack-row-body pack-row-equip"
                      disabled={readOnly}
                      onClick={() =>
                        setEquipping({ item: row.item, carried: row.indices.length })
                      }
                      title={readOnly ? row.item.name : `Where does ${row.item.name} go?`}
                    >
                      <span className="pack-row-head">
                        <span className="pack-row-name">{row.item.name}</span>
                        {row.indices.length > 1 && (
                          <span className="pack-count-chip">×{row.indices.length}</span>
                        )}
                      </span>
                      <ItemTags item={row.item} />
                      <ItemValues item={row.item} />
                    </button>

                    <span className="slot-tools pack-row-tools">
                      <button
                        type="button"
                        className="item-info-btn"
                        onClick={() => stack?.openItem(row.item)}
                        title={`${row.item.name} · details and lore`}
                        aria-label={`${row.item.name} details`}
                      >
                        i
                      </button>

                      {!readOnly && (
                        <DiscardButton
                          name={row.item.name}
                          // The last one added is the one thrown away.
                          onClick={() =>
                            setDiscarding({
                              index: row.indices[row.indices.length - 1],
                              name: row.item.name,
                            })
                          }
                        />
                      )}
                    </span>
                  </div>
                )
              )}
            </section>
          );
        })}
      </div>

      {browsing && (
        <ItemBrowser
          slot={{ key: 'pack', label: 'Inventory' }}
          items={ITEMS}
          current={null}
          equipLabel="Add"
          equipTitle="Adds it and closes the codex. The +1 beside it adds one and leaves it open."
          checkBurden={false}
          character={character}
          equipment={equipment}
          pack={pack}
          onEquip={(slotKey, item) => {
            addToPack(item);
            setBrowsing(false);
          }}
          /* The +1 belongs in this browser too. It was kept out while it looked
             like a second "Add" sitting a row apart from the first, but the two
             do different jobs: "Add" takes one and shuts the codex, which is
             right when you came for a thing and now have it, and the +1 takes one
             and leaves the codex open, which is the only way to walk out with
             three torches without searching for torches three times. */
          onAdd={addToPack}
          onForge={onForge}
          onClose={() => setBrowsing(false)}
          readOnly={readOnly}
        />
      )}

      {equipping && (
        <EquipPrompt
          item={equipping.item}
          carried={equipping.carried}
          character={character}
          equipment={equipment}
          belt={belt}
          beltSlots={beltSlots}
          trinkets={trinkets}
          onEquip={(slotKey, item) => {
            equip(slotKey, item);
            setEquipping(null);
          }}
          onClip={(index, item) => {
            clipToBelt(index, item);
            setEquipping(null);
          }}
          onWear={(item) => {
            wearTrinket(item);
            setEquipping(null);
          }}
          /* The item's own page is dealt on top of the prompt rather than in
             place of it, so closing the card leaves you where you were. */
          onDetails={() => stack?.openItem(equipping.item)}
          onClose={() => setEquipping(null)}
        />
      )}

      {editing && (
        <CustomItemForm
          entry={editing}
          onSave={(fields) => {
            if (editing.id) updateCustomInPack(editing.id, fields);
            else addCustomToPack(fields);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {discarding && (
        <Modal
          title="Throw It Away"
          onClose={() => setDiscarding(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  discardFromPack(discarding.index);
                  setDiscarding(null);
                }}
              >
                Discard It
              </button>
              <span className="spacer" />
              <button
                type="button"
                className="btn btn-minimal btn-sm"
                onClick={() => setDiscarding(null)}
              >
                Cancel
              </button>
            </>
          }
        >
          <p className="replace-lead">
            <strong>{discarding.name}</strong> leaves the character sheet entirely. There is no
            getting it back.
          </p>
        </Modal>
      )}
    </div>
  );
}

function DiscardButton({ name, onClick }) {
  return (
    <button
      type="button"
      className="item-info-btn slot-discard-btn"
      onClick={onClick}
      title={`Throw ${name} away · for good`}
      aria-label={`Discard ${name}`}
    >
      ×
    </button>
  );
}

/** Name and a line about what it is. Nothing here does anything at the table. */
function CustomItemForm({ entry, onSave, onClose }) {
  const [name, setName] = useState(entry.name ?? '');
  const [note, setNote] = useState(entry.note ?? '');

  const clean = name.trim();

  return (
    <Modal
      title={entry.id ? 'Edit: Something You Carry' : 'Something You Carry'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-copper btn-sm"
            disabled={!clean}
            onClick={() => onSave({ name: clean, note })}
          >
            {entry.id ? 'Save' : 'Add to Inventory'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label" htmlFor="custom-item-name">
          What it is
        </label>
        <input
          id="custom-item-name"
          className="form-input"
          value={name}
          maxLength={60}
          placeholder="A folded note"
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="custom-item-note">
          What it says, or why you kept it
        </label>
        <textarea
          id="custom-item-note"
          className="form-textarea"
          value={note}
          maxLength={400}
          placeholder="Half a name and an address by the docks, in someone else's hand."
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <p className="form-hint">
        Nothing here has rules. It is yours to carry and the table's to make something of.
      </p>
    </Modal>
  );
}

/**
 * The pack as shelves: one per kind of thing, in the codex's own order, with
 * identical items stacked into a single row. Every row keeps the pack indices
 * it came from, so discarding takes exactly one of them.
 *
 * A shelf carries an id to fold by and a count of what is on it. The count is
 * things rather than rows: five potions on one row is five things you carry,
 * and it is the same number the filter row above the shelves totals.
 *
 * The filter narrows twice over, the way it does on the Abilities tab: a chip
 * asks what a thing *is* and the box asks what it says. A written-in thing
 * carries no tags, so a chip sets it aside and only the box can find it.
 */
function shelvePack(character, pack, filter) {
  const rows = new Map();

  pack.forEach((entry, index) => {
    const custom = isCustomEntry(entry);
    // `heldItem`, so a piece the player made shelves under its own name and its
    // own kind rather than being skipped as an id the codex has never heard of.
    const item = custom ? entry : heldItem(character, entry);
    // An id the codex no longer knows is skipped rather than shown as a blank.
    if (!item) return;
    if (!filter.matches(item.tags)) return;
    if (!filter.text(item.name, (item.tags ?? []).join(' '), custom ? item.note : '')) return;

    // Customs never stack: two notes are two different notes.
    const key = custom ? entry.id : entry;
    const row = rows.get(key);
    if (row) row.indices.push(index);
    else rows.set(key, { key, custom, item, entry, indices: [index], category: itemCategory(item) });
  });

  const shelves = [];
  for (const category of CATEGORY_ORDER) {
    const shelf = [...rows.values()]
      .filter((row) => row.category === category)
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
    if (shelf.length === 0) continue;

    shelves.push({
      category,
      id: shelfId(category),
      count: shelf.reduce((sum, row) => sum + row.indices.length, 0),
      rows: shelf,
    });
  }
  return shelves;
}

/**
 * A category as the key a fold is remembered under: its name, slugged.
 *
 * Slugged rather than taken as it stands because a stored id is joined on spaces
 * when defaults are read back, and two of these names carry one. `Notes &
 * Oddments` is `notes-oddments`, and stays that whatever the printed name is
 * later reworded to.
 */
function shelfId(category) {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
