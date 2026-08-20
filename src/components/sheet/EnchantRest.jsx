import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import WornEnchants, { EnchantShelf } from './WornEnchants.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useCardStack } from '../../context/card-stack.js';
import {
  CATEGORY_ORDER,
  getItem,
  isCustomEntry,
  itemCategory,
  normalizeBelt,
  normalizeEquipment,
  normalizePack,
} from '../../lib/items.js';
import { laidOn, layOn, layingCost, stripFrom } from '../../lib/enchanting.js';
import { layingAffordable } from '../../lib/rest.js';

/**
 * The Enchanter's half of a Long Rest.
 *
 * Both of their slow cards happen here and nowhere else, which is why this is a
 * section of the rest window rather than a control on the sheet:
 *
 *   WIELDER OF WONDER  "Choose one when becoming an enchanter, you can change it
 *                      during a Long Rest. The amount of such enchantments you can
 *                      have is equal to your rank in enchanter."
 *   ENCHANTING         "Whenever you take a Long Rest, you can use your Long Rest
 *                      actions to enchant. Enchanting an item costs you an amount
 *                      of supplies equal to 70 times the Magic Burden value of the
 *                      enchantment."
 *
 * ------------------------------------------------------------------- two rows
 * So there are two things to do and they are drawn as the two they are. **On your
 * own person** is WornEnchants, the same row the Advancement tab shows when the
 * rank is bought — one component, because it is one rule read at two moments.
 * **On what you carry** is a list of what has already been worked, and one way in
 * to work something else.
 *
 * ------------------------------------------------------------- nothing is written
 * Every choice here writes into the window's own `talents` draft and nothing else.
 * The rest window prices it, prints it as a line among everything else the rest
 * does, and only "Yes, rest" commits any of it — so a rest backed out of is an
 * evening's work not done, with the Supplies still in the crate.
 */
export default function EnchantRest({ character, talents, onDraft, kind, readOnly = false }) {
  /* Which item is being worked on, or null. */
  const [onItem, setOnItem] = useState(null);
  /* Whether the item chooser is up. */
  const [choosing, setChoosing] = useState(false);

  const stack = useCardStack();

  /* What the character is carrying that could take a working: everything worn,
     on the belt, or in the pack. A written note is not a thing you can enchant. */
  const carried = useMemo(() => carriedItems(character), [character]);
  const worked = useMemo(
    () => carried.filter((item) => laidOn({ talents }, item.id).length > 0),
    [carried, talents]
  );

  return (
    <>
      <span className="fx-label">
        What you enchant
        <span className="rest-labour-rule">Yours to change until you rest</span>
      </span>

      {/* ---------- ON YOUR OWN PERSON ---------- */}
      <WornEnchants
        character={character}
        talents={talents}
        onChange={onDraft}
        readOnly={readOnly}
        tone="rest"
      />

      {/* ---------- ON WHAT YOU CARRY ---------- */}
      <div className="ench-rest-head">
        <span className="ench-rest-title">On what you carry</span>
        <span className="ench-rest-note">
          {layingCost({ burden: 1 })} Supplies a point of Magic Burden
        </span>
      </div>

      <div className="rest-labours">
        {worked.map((item) => (
          <div className="rest-labour is-prepare" key={item.id}>
            <button
              type="button"
              className="rest-labour-head"
              onClick={() => setOnItem(item)}
              title={`Work on ${item.name}`}
            >
              <span className="rest-labour-name">{item.name}</span>
              <span className="rest-labour-line">
                {laidOn({ talents }, item.id)
                  .map((entry) => entry.name)
                  .join(' · ')}
              </span>
            </button>

            <span className="rest-labour-opts">
              {laidOn({ talents }, item.id).map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  className="rest-opt"
                  disabled={readOnly}
                  title={`Strip ${entry.name} off ${item.name}. The Supplies do not come back.`}
                  onClick={() => onDraft(stripFrom(talents, item.id, entry.id))}
                >
                  Strip {entry.name}
                </button>
              ))}
              <button
                type="button"
                className="rest-opt is-gain"
                disabled={readOnly}
                onClick={() => setOnItem(item)}
              >
                Lay another
              </button>
            </span>
          </div>
        ))}

        <button
          type="button"
          className="brew-slot brew-slot-add ench-rest-add"
          disabled={readOnly || carried.length === 0}
          onClick={() => setChoosing(true)}
          title={
            carried.length === 0
              ? 'Nothing you are carrying can take a working.'
              : 'Choose something to enchant'
          }
        >
          <span className="brew-slot-plus" aria-hidden="true">
            +
          </span>
          <span className="brew-slot-add-label">
            {carried.length === 0 ? 'Nothing to enchant' : 'Enchant something'}
          </span>
        </button>
      </div>

      {/* ---------- the item chooser ---------- */}
      {choosing && (
        <ItemChoice
          items={carried}
          talents={talents}
          onClose={() => setChoosing(false)}
          onPick={(item) => {
            setChoosing(false);
            setOnItem(item);
          }}
        />
      )}

      {/* ---------- the shelf, for a thing ---------- */}
      {onItem && (
        <EnchantShelf
          title={`On ${onItem.name}`}
          rule={`Permanent, and paid for out of the crate at ${layingCost({ burden: 1 })} Supplies a point of Magic Burden.`}
          character={character}
          held={laidOn({ talents }, onItem.id).map((entry) => entry.id)}
          room={Infinity}
          priced
          afford={(enchantment) => layingAffordable(character, kind, talents, enchantment)}
          onClose={() => setOnItem(null)}
          onPick={(enchantment) => {
            onDraft(layOn(talents, onItem.id, enchantment.id));
            setOnItem(null);
          }}
          onRead={(card) => stack?.openCard(card)}
        />
      )}
    </>
  );
}

/** Which thing is being worked on. Everything carried, on its own shelf. */
function ItemChoice({ items, talents, onClose, onPick }) {
  const shelves = CATEGORY_ORDER.map((category) => ({
    category,
    rows: items.filter((item) => itemCategory(item) === category),
  })).filter((shelf) => shelf.rows.length > 0);

  return (
    <Modal title="Enchant what?" onClose={onClose} wide accent={PICK_ACCENTS.talent}>
      <p className="frame-foot" style={{ marginTop: 0 }}>
        Anything you are carrying: worn, in hand, on the belt or in the pack.
      </p>

      {shelves.map(({ category, rows }) => (
        <section className="brew-step" key={category}>
          <div className="brew-step-head">
            <span className="brew-step-label">{category}</span>
            <span className="brew-step-note">{rows.length}</span>
          </div>

          <div className="brew-slots">
            {rows.map((item) => {
              const on = laidOn({ talents }, item.id);
              return (
                <button
                  type="button"
                  className="brew-slot brew-slot-add ench-item-pick"
                  key={item.id}
                  onClick={() => onPick(item)}
                >
                  <span className="brew-slot-add-label">{item.name}</span>
                  {on.length > 0 && (
                    <span className="brew-slot-meta">{on.map((e) => e.name).join(' · ')}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </Modal>
  );
}

/* ------------------------------------------------------------------ helpers */

/**
 * Everything this character carries that could take a working: what is worn, what
 * is in hand, what is clipped to the belt and what is in the pack.
 *
 * A written note is left out. Those are "a scrap of paper with a note on it, a
 * stone worth keeping" with nothing mechanical about them, and an enchantment laid
 * on one would have nothing to attach to.
 */
function carriedItems(character) {
  const equipment = normalizeEquipment(character?.equipment);
  const ids = [
    ...Object.values(equipment),
    ...normalizeBelt(character?.belt).map((entry) => entry?.id),
    ...normalizePack(character?.pack).filter((entry) => !isCustomEntry(entry)),
  ];

  const seen = new Set();
  const items = [];

  for (const raw of ids) {
    const id = typeof raw === 'string' ? raw : raw?.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const item = getItem(id);
    if (item) items.push(item);
  }

  return items;
}
