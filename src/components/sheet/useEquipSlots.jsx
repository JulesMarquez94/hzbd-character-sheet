import { useState } from 'react';
import ReplacePrompt from './ReplacePrompt.jsx';
import {
  BELT_MAX,
  EQUIPMENT_SLOTS,
  WEAPON_SLOTS,
  beltEntry,
  beltSlotCount,
  heldItem,
  isCustomEntry,
  isUsedUp,
  newCustomId,
  normalizeBelt,
  normalizeEquipment,
  normalizePack,
  normalizeTrinkets,
  placementOf,
  pruneForged,
} from '../../lib/items.js';
import { normalizeForged } from '../../lib/forged.js';
import { pactWeaponId } from '../../lib/pact.js';

/** The two hands, as keys. Read once rather than mapped at every call. */
const WEAPON_KEYS = WEAPON_SLOTS.map((slot) => slot.key);

/**
 * Equipping, for every block on the Inventory tab.
 *
 * Filling an empty slot is silent. Filling an occupied one is not: whatever
 * was in it has to go somewhere, so the swap stops and asks — into the pack,
 * or gone for good. Nothing is thrown away without being asked for. The one
 * exception is a consumable with nothing left in it: a drunk potion has
 * already been thrown away, so it makes room without a question.
 *
 * The equipment map, the belt, the trinkets and the pack are written in a single
 * patch, so the Character tab's Armor, Defense and Shield cap move in the same
 * save.
 *
 * ------------------------------------------------------------------ the forge
 * A forged item is a thing this player made, and its record lives on their own
 * row (see forged.js). Two writers here know about it and nothing else has to:
 * `forge` puts a new record in the registry and the item in the pack, and every
 * discard prunes the registry afterwards. An id is an id everywhere else.
 */
export function useEquipSlots(character, patch) {
  const equipment = normalizeEquipment(character.equipment);
  const pack = normalizePack(character.pack);
  const belt = normalizeBelt(character.belt);
  const trinkets = normalizeTrinkets(character.trinkets);
  const beltSlots = beltSlotCount(character);

  // { target, item } while a swap is waiting on the player's answer.
  const [pending, setPending] = useState(null);

  /** A piece already in the pack is taken from it rather than conjured. */
  function takeFromPack(item) {
    const next = [...pack];
    const index = item ? next.indexOf(item.id) : -1;
    if (index >= 0) next.splice(index, 1);
    return next;
  }

  /**
   * Every write goes out through here, and it is the one place the forge
   * registry is tidied.
   *
   * A forged record is the identity of one thing, so it has to die with that
   * thing: throwing a named ring away and leaving its record behind would grow
   * the column forever and leave a Long Rest offering to enchant a ring nobody
   * owns. `pruneForged` is asked of the sheet *as this write will leave it*,
   * which is the only useful moment to ask, and hands back null when there is
   * nothing to tidy — so the common write never carries the column at all.
   */
  function write(body) {
    const forged = pruneForged(character, body);
    patch(forged ? { ...body, forged } : body);
  }

  /**
   * A made piece is one *thing*, and one thing is in one place.
   *
   * A codex id may repeat as often as the player owns copies. A forged id is an
   * instance, so the same id worn and held at once would be two rows secretly
   * sharing a record — and taking one off would take the other with it. The
   * browser and the equip prompt both mark such a row rather than offering it,
   * and this is the same rule at the writer, because the shelf is not the only
   * way in.
   *
   * Refused rather than moved. Moving it would be the friendlier answer and a
   * much longer one — every commit path would have to lift the id out of three
   * other columns first — and "take it off, then put it on" is the same thing a
   * hand does with a ring.
   *
   * `holding` is whatever the place being written already holds, so putting a
   * piece back where it already is stays the no-op it always was.
   */
  function placedElsewhere(item, holding = null) {
    if (!item?.forged || holding === item.id) return false;
    return placementOf(character, item.id) !== null;
  }

  /** `keepOld` decides the fate of whatever the slot was holding. */
  function commitSlot(slotKey, item, keepOld) {
    const nextPack = takeFromPack(item);

    const previous = equipment[slotKey];
    if (previous && keepOld) nextPack.push(previous);

    write({ equipment: { ...equipment, [slotKey]: item?.id ?? null }, pack: nextPack });
  }

  /**
   * The same trade for a belt loop. The pack holds bare ids, so anything sent
   * back to it goes whole — a half-drunk flask is a full one again once it is
   * off the belt, which is the price of keeping the pack a simple list.
   */
  function commitBelt(index, item, keepOld) {
    const nextPack = takeFromPack(item);

    const previous = belt[index];
    if (previous && keepOld) nextPack.push(previous.id);

    const nextBelt = [...belt];
    nextBelt[index] = item ? { id: item.id, used: 0 } : null;

    write({ belt: nextBelt, pack: nextPack });
  }

  /* The Pact of Ordenance's weapon, while its set is held. PACT-BOUND WEAPON:
     it cannot be lost or stolen, so the hand it is in is not a slot you can
     empty. Equipping another weapon over it lands in the other hand instead of
     asking, and nothing here can take it off. Reshaping it is a Long Rest
     action, not an equip.

     The pin follows the weapon rather than naming the Primary slot, because
     which hand it is in is the Loadout block's swap to change: a pact weapon
     stowed for the bow is still a pact weapon, and it still cannot be dropped.
     What the pact holds for good is *a* weapon slot, which is the designer's
     own "the pact bound weapon permanently takes a slot in the weapon selection
     screen". See LoadoutBlock.jsx. */
  const pactId = pactWeaponId(character);
  const pactSlot = pactId ? (WEAPON_KEYS.find((key) => equipment[key] === pactId) ?? null) : null;

  function equip(slotKey, item) {
    if (!item) return;
    if (pactSlot && slotKey === pactSlot) {
      /* The other hand, found rather than named, so a third weapon slot would
         not silently make this the wrong one. Nothing happens at all if there
         is no other hand to send it to, which is the safe end of the trade. */
      const free = WEAPON_KEYS.find((key) => key !== pactSlot);
      if (free) equip(free, item);
      return;
    }
    if (placedElsewhere(item, equipment[slotKey])) return;
    if (equipment[slotKey] && equipment[slotKey] !== item.id) {
      setPending({ target: { kind: 'slot', key: slotKey }, item });
      return;
    }
    commitSlot(slotKey, item, true);
  }

  /** Taking something off always sends it to the pack — nothing is lost. */
  function unequip(slotKey) {
    if (!equipment[slotKey]) return;
    if (pactSlot && slotKey === pactSlot) return;
    commitSlot(slotKey, null, true);
  }

  function clipToBelt(index, item) {
    if (!item || index < 0 || index >= BELT_MAX) return;
    if (placedElsewhere(item, belt[index]?.id)) return;

    const previous = belt[index];
    // Clipping on what is already there just puts a fresh one in the loop.
    // The one it replaces still follows the removal law: back to the pack
    // unless it is spent — dropping it silently would destroy an item.
    if (previous?.id === item.id) {
      commitBelt(index, item, !isUsedUp(character, previous));
      return;
    }
    if (previous && !isUsedUp(character, previous)) {
      setPending({ target: { kind: 'belt', index }, item });
      return;
    }
    commitBelt(index, item, false);
  }

  /** Off the belt and into the pack. */
  function unclipBelt(index) {
    if (!belt[index]) return;
    commitBelt(index, null, true);
  }

  /** A spent consumable has nothing left to send anywhere. */
  function discardBelt(index) {
    if (!belt[index]) return;
    commitBelt(index, null, false);
  }

  /* --------------------------------------------------------------- trinkets */

  /**
   * A ring goes on the end of the list. There is no slot to fill and therefore
   * nothing to displace, which is why this is the one place on the tab where
   * putting something on never asks a question: the replace prompt exists
   * because a slot can only hold one thing, and this is a list.
   *
   * Wearing two of the same ring is allowed — you own two rings — and the
   * stacking law is what stops the second one doing anything. It is refused at
   * the forge instead, where it would cost Magic Burden for nothing.
   */
  function wearTrinket(item) {
    if (!item || placedElsewhere(item)) return;
    write({ trinkets: [...trinkets, item.id], pack: takeFromPack(item) });
  }

  /** Off, and into the pack. The removal law, same as every other block's. */
  function removeTrinket(index) {
    if (index < 0 || index >= trinkets.length) return;

    const next = [...trinkets];
    const [gone] = next.splice(index, 1);
    write({ trinkets: next, pack: [...pack, gone] });
  }

  /**
   * One ring off and another on, in a single write.
   *
   * It has to be one write. Calling `removeTrinket` and then `wearTrinket` would
   * be two patches built from the same stale render: the second would put the
   * new ring on a list that still held the old one, and the removed ring would
   * be lost out of the pack the first patch had just put it in.
   */
  function swapTrinket(index, item) {
    if (!item) return;
    if (index < 0 || index >= trinkets.length) {
      wearTrinket(item);
      return;
    }
    // Already on you somewhere else, and there is only one of it.
    if (placedElsewhere(item, trinkets[index])) return;

    const next = [...trinkets];
    const [gone] = next.splice(index, 1, item.id);
    write({ trinkets: next, pack: [...takeFromPack(item), gone] });
  }

  /* ------------------------------------------------------------- the pack */

  /** Something acquired between sessions, straight into the inventory. */
  function addToPack(item) {
    if (!item) return;
    write({ pack: [...pack, item.id] });
  }

  /** A thing the codex has never heard of: a name, a note, nothing else. */
  function addCustomToPack({ name, note }) {
    const clean = String(name || '').trim();
    if (!clean) return;
    write({ pack: [...pack, { id: newCustomId(), name: clean, note: String(note || '').trim() }] });
  }

  function updateCustomInPack(id, { name, note }) {
    const clean = String(name || '').trim();
    if (!clean) return;
    write({
      pack: pack.map((entry) =>
        isCustomEntry(entry) && entry.id === id
          ? { ...entry, name: clean, note: String(note || '').trim() }
          : entry
      ),
    });
  }

  /**
   * Something made at the forge, into the registry and into the pack.
   *
   * The registry and the pack move in one write, because a record nothing points
   * at is pruned by the very next one — splitting them would make the item
   * vanish between two saves.
   *
   * It lands in the pack rather than on the character. Making a ring is not
   * putting it on, and the pack is where the tab's one "where does this go?"
   * question is asked.
   */
  function forgeItem(record) {
    if (!record?.id) return;
    patch({
      forged: { ...normalizeForged(character.forged), [record.id]: record },
      pack: [...pack, record.id],
    });
  }

  /**
   * The one place a thing can actually leave the sheet. Everywhere else
   * "remove" only means "put it in the inventory".
   */
  function discardFromPack(index) {
    if (index < 0 || index >= pack.length) return;
    const next = [...pack];
    next.splice(index, 1);
    write({ pack: next });
  }

  /** Ticking a belt item's charges off — and back on, for a misplaced tap. */
  function setBeltUsed(index, used) {
    const state = beltEntry(character, belt[index]);
    if (!state?.charges) return;

    const nextBelt = [...belt];
    nextBelt[index] = { id: state.item.id, used: Math.min(state.charges, Math.max(0, used)) };
    patch({ belt: nextBelt });
  }

  function resolvePending(keepOld) {
    if (pending) {
      const { target, item } = pending;
      if (target.kind === 'belt') commitBelt(target.index, item, keepOld);
      else commitSlot(target.key, item, keepOld);
    }
    setPending(null);
  }

  const replacePrompt = pending ? (
    <ReplacePrompt
      slotLabel={targetLabel(pending.target)}
      outgoing={outgoingItem(character, pending.target, equipment, belt)}
      incoming={pending.item}
      onKeep={() => resolvePending(true)}
      onDiscard={() => resolvePending(false)}
      onCancel={() => setPending(null)}
    />
  ) : null;

  return {
    equipment,
    pack,
    belt,
    beltSlots,
    trinkets,
    equip,
    unequip,
    clipToBelt,
    unclipBelt,
    discardBelt,
    setBeltUsed,
    wearTrinket,
    removeTrinket,
    swapTrinket,
    addToPack,
    addCustomToPack,
    updateCustomInPack,
    forgeItem,
    discardFromPack,
    replacePrompt,
  };
}

function targetLabel(target) {
  if (target.kind === 'belt') return `Belt Loop ${target.index + 1}`;
  return EQUIPMENT_SLOTS.find((slot) => slot.key === target.key)?.label ?? 'Slot';
}

/* `heldItem`, so the piece coming off is named even when it is one the player
   made — `getItem` on a forged id is null, and the prompt would have asked where
   to put "undefined". */
function outgoingItem(character, target, equipment, belt) {
  return heldItem(character, target.kind === 'belt' ? belt[target.index]?.id : equipment[target.key]);
}
