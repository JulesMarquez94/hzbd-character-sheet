/**
 * Handing a starting kit over, and taking it back.
 *
 * A background's kit stocks the sheet in one write: the armor set on the body,
 * the weapon in the hand, the odds and ends on the belt, the rest in the pack,
 * and the coins and Supplies in their ledgers. Both directions are plain
 * functions over the character row, and each returns a single patch so the
 * pack and both purses move together or not at all.
 *
 * These two lived inside BackgroundPick.jsx until 2026-09-08, when the
 * Crossroads became the second screen that hands a kit over. The outfitter asks
 * which armor and which weapon; the Crossroads reads the same two answers off a
 * count of points. Both end here, so a kit taken either way is one shape and is
 * handed back by one receipt.
 *
 * ------------------------------------------------------------ never displaces
 * A slot or a loop that is already holding something is left exactly as it is
 * and the kit's piece goes to the pack instead, which is what makes this safe to
 * run on a character who is already carrying gear.
 */

import {
  armorSetPieces,
  beltSlotCount,
  newCustomId,
  normalizeBelt,
  normalizeEquipment,
  normalizePack,
} from './items.js';
import { appendLedger, formatNumber, newLedgerId } from './characterModel.js';

/** The three armor slots in the order a kit fills them and a receipt lists them. */
export const ARMOR_ORDER = ['head', 'torso', 'legs'];
const HANDS = ['main_hand', 'off_hand'];

/**
 * The single patch that dresses a character and stocks the rest, and the record
 * of what went where.
 *
 * `background` is a codex entry (its `kit` carries the belt, the pack, the coins
 * and the Supplies), `armorSet` is a set name and `weapons` a list of weapon ids
 * as long as the kit allows. Nothing here checks that count: the outfitter and
 * the Crossroads both hand over exactly what the trade allows.
 */
export function buildKitPatch({ character, background, armorSet, weapons }) {
  const kit = background.kit;
  const equipment = normalizeEquipment(character.equipment);
  const belt = normalizeBelt(character.belt);
  const pack = normalizePack(character.pack);
  const loops = beltSlotCount(character);

  const granted = { equipment: {}, belt: [], pack: [] };

  /** Somewhere to put it, or the pack. */
  function wear(slot, id) {
    if (equipment[slot]) {
      pack.push(id);
      granted.pack.push(id);
      return;
    }
    equipment[slot] = id;
    granted.equipment[slot] = id;
  }

  const pieces = armorSetPieces(armorSet);
  for (const slot of ARMOR_ORDER) {
    if (pieces[slot]) wear(slot, pieces[slot]);
  }

  // First weapon to the main hand, a second to the off hand.
  for (const id of weapons) {
    const free = HANDS.find((hand) => !equipment[hand]);
    if (free) wear(free, id);
    else {
      pack.push(id);
      granted.pack.push(id);
    }
  }

  for (const id of kit.belt) {
    const loop = belt.findIndex((entry, index) => index < loops && !entry);
    if (loop === -1) {
      pack.push(id);
      granted.pack.push(id);
      continue;
    }
    belt[loop] = { id, used: 0 };
    granted.belt.push({ index: loop, id });
  }

  /* Written entries are minted with their own ids, so handing them back finds
     exactly the ones this kit added and never a duplicate someone else wrote.
     They are never anything the codex knows, so they can only go in the pack. */
  for (const entry of kit.pack) {
    const id = newCustomId();
    pack.push({ id, name: entry.name, note: entry.note });
    granted.pack.push(id);
  }

  const ts = new Date().toISOString();
  const note = `${background.name} starting kit`;
  const wealth = Math.max(0, Math.floor(Number(character.wealth) || 0)) + kit.coins;
  const supplies = Math.max(0, Math.floor(Number(character.supplies) || 0)) + kit.supplies;

  // A fresh row may have no ledger at all; both movements append onto whatever
  // is there, so it has to start as a list.
  let ledger = Array.isArray(character.ledger) ? character.ledger : [];
  if (kit.coins > 0) {
    ledger = appendLedger(
      { ledger },
      { id: newLedgerId(), ts, kind: 'wealth', delta: kit.coins, note, balance: wealth }
    );
  }
  if (kit.supplies > 0) {
    ledger = appendLedger(
      { ledger },
      { id: newLedgerId(), ts, kind: 'supplies', delta: kit.supplies, note, balance: supplies }
    );
  }

  return {
    equipment,
    belt,
    pack,
    wealth,
    supplies,
    ledger,
    background_kit: {
      background: background.id,
      armorSet,
      weapons: [...weapons],
      equipment: granted.equipment,
      belt: granted.belt,
      pack: granted.pack,
      coins: kit.coins,
      supplies: kit.supplies,
      ts,
    },
  };
}

/**
 * The patch that gives a kit back, and a line saying what actually moved.
 *
 * Only what is still where the kit put it comes back: a slot the kit filled and
 * nobody has changed since, a loop still holding the flask it clipped there, an
 * id still sitting in the pack. Gear swapped out, a potion drunk, a note thrown
 * away: all left alone. The purse is the exception, since coins and supplies
 * are fungible, so the amounts issued are simply subtracted and neither is
 * dragged below zero to make the sum work.
 *
 * `kit` is the receipt as `normalizeKit` in backgrounds.js hands it back.
 */
export function buildReturnPatch({ character, kit }) {
  const wanted = [...kit.pack];
  const pack = normalizePack(character.pack).filter((entry) => {
    const id = typeof entry === 'string' ? entry : entry.id;
    const at = wanted.indexOf(id);
    if (at === -1) return true;
    wanted.splice(at, 1);
    return false;
  });

  // A slot is only stripped when it still holds the very piece the kit put
  // there. Anything worn since is somebody's decision, not the kit's.
  const equipment = normalizeEquipment(character.equipment);
  let stripped = 0;
  for (const [slot, id] of Object.entries(kit.equipment ?? {})) {
    if (equipment[slot] === id) {
      equipment[slot] = null;
      stripped += 1;
    }
  }

  const belt = normalizeBelt(character.belt);
  let unclipped = 0;
  for (const { index, id } of kit.belt ?? []) {
    if (belt[index]?.id === id) {
      belt[index] = null;
      unclipped += 1;
    }
  }

  const issued = kit.pack.length + Object.keys(kit.equipment ?? {}).length + (kit.belt ?? []).length;
  const returned = kit.pack.length - wanted.length + stripped + unclipped;

  const ts = new Date().toISOString();
  const note = 'Starting kit handed back';
  const wealthBefore = Math.max(0, Math.floor(Number(character.wealth) || 0));
  const suppliesBefore = Math.max(0, Math.floor(Number(character.supplies) || 0));
  const wealth = Math.max(0, wealthBefore - kit.coins);
  const supplies = Math.max(0, suppliesBefore - kit.supplies);

  let ledger = Array.isArray(character.ledger) ? character.ledger : [];
  if (wealth !== wealthBefore) {
    ledger = appendLedger(
      { ledger },
      { id: newLedgerId(), ts, kind: 'wealth', delta: wealth - wealthBefore, note, balance: wealth }
    );
  }
  if (supplies !== suppliesBefore) {
    ledger = appendLedger(
      { ledger },
      {
        id: newLedgerId(),
        ts,
        kind: 'supplies',
        delta: supplies - suppliesBefore,
        note,
        balance: supplies,
      }
    );
  }

  const gone = issued - returned;
  return {
    patch: { equipment, belt, pack, wealth, supplies, ledger, background_kit: null },
    summary:
      `Kit handed back. ${returned} of ${issued} pieces returned, ` +
      `${formatNumber(wealthBefore - wealth)} ¢ and ${formatNumber(
        suppliesBefore - supplies
      )} Supplies taken back.` +
      (gone > 0
        ? ` ${gone} had already moved on and ${gone === 1 ? 'was' : 'were'} left alone.`
        : ''),
  };
}
