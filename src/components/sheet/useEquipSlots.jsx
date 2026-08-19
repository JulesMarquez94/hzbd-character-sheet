import { useState } from 'react';
import ReplacePrompt from './ReplacePrompt.jsx';
import {
  BELT_MAX,
  EQUIPMENT_SLOTS,
  beltEntry,
  beltSlotCount,
  getItem,
  isCustomEntry,
  isUsedUp,
  newCustomId,
  normalizeBelt,
  normalizeEquipment,
  normalizePack,
} from '../../lib/items.js';

/**
 * Equipping, for every block on the Inventory tab.
 *
 * Filling an empty slot is silent. Filling an occupied one is not: whatever
 * was in it has to go somewhere, so the swap stops and asks — into the pack,
 * or gone for good. Nothing is thrown away without being asked for. The one
 * exception is a consumable with nothing left in it: a drunk potion has
 * already been thrown away, so it makes room without a question.
 *
 * The equipment map, the belt and the pack are written in a single patch, so
 * the Character tab's Armor, Defense and Shield cap move in the same save.
 */
export function useEquipSlots(character, patch) {
  const equipment = normalizeEquipment(character.equipment);
  const pack = normalizePack(character.pack);
  const belt = normalizeBelt(character.belt);
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

  /** `keepOld` decides the fate of whatever the slot was holding. */
  function commitSlot(slotKey, item, keepOld) {
    const nextPack = takeFromPack(item);

    const previous = equipment[slotKey];
    if (previous && keepOld) nextPack.push(previous);

    patch({ equipment: { ...equipment, [slotKey]: item?.id ?? null }, pack: nextPack });
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

    patch({ belt: nextBelt, pack: nextPack });
  }

  function equip(slotKey, item) {
    if (!item) return;
    if (equipment[slotKey] && equipment[slotKey] !== item.id) {
      setPending({ target: { kind: 'slot', key: slotKey }, item });
      return;
    }
    commitSlot(slotKey, item, true);
  }

  /** Taking something off always sends it to the pack — nothing is lost. */
  function unequip(slotKey) {
    if (!equipment[slotKey]) return;
    commitSlot(slotKey, null, true);
  }

  function clipToBelt(index, item) {
    if (!item || index < 0 || index >= BELT_MAX) return;

    const previous = belt[index];
    // Clipping on what is already there just puts a fresh one in the loop.
    // The one it replaces still follows the removal law: back to the pack
    // unless it is spent — dropping it silently would destroy an item.
    if (previous?.id === item.id) {
      commitBelt(index, item, !isUsedUp(previous));
      return;
    }
    if (previous && !isUsedUp(previous)) {
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

  /* ------------------------------------------------------------- the pack */

  /** Something acquired between sessions, straight into the inventory. */
  function addToPack(item) {
    if (!item) return;
    patch({ pack: [...pack, item.id] });
  }

  /** A thing the codex has never heard of: a name, a note, nothing else. */
  function addCustomToPack({ name, note }) {
    const clean = String(name || '').trim();
    if (!clean) return;
    patch({ pack: [...pack, { id: newCustomId(), name: clean, note: String(note || '').trim() }] });
  }

  function updateCustomInPack(id, { name, note }) {
    const clean = String(name || '').trim();
    if (!clean) return;
    patch({
      pack: pack.map((entry) =>
        isCustomEntry(entry) && entry.id === id
          ? { ...entry, name: clean, note: String(note || '').trim() }
          : entry
      ),
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
    patch({ pack: next });
  }

  /** Ticking a belt item's charges off — and back on, for a misplaced tap. */
  function setBeltUsed(index, used) {
    const state = beltEntry(belt[index]);
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
      outgoing={outgoingItem(pending.target, equipment, belt)}
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
    equip,
    unequip,
    clipToBelt,
    unclipBelt,
    discardBelt,
    setBeltUsed,
    addToPack,
    addCustomToPack,
    updateCustomInPack,
    discardFromPack,
    replacePrompt,
  };
}

function targetLabel(target) {
  if (target.kind === 'belt') return `Belt Slot ${target.index + 1}`;
  return EQUIPMENT_SLOTS.find((slot) => slot.key === target.key)?.label ?? 'Slot';
}

function outgoingItem(target, equipment, belt) {
  return getItem(target.kind === 'belt' ? belt[target.index]?.id : equipment[target.key]);
}
