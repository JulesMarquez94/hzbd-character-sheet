/**
 * Handing something over — an item from one player's pack into another's.
 *
 * "add a feature so players can send items to each other in the campaign",
 * Jules, 2026-09-09.
 *
 * ------------------------------------------------------------------- the law
 * **A sheet is the only writer of its own numbers.** RLS says so, every page on
 * this site says so, and it is why the encounter runner announces a turn instead
 * of pushing one (see the note over `askInitiative` in campaignLog.js). So there
 * is no such thing here as putting a ring into somebody's pack: the sender takes
 * it off their own sheet, the table is told, and the **recipient's own sheet**
 * is what writes it in.
 *
 * That makes a handover a conversation rather than a write, and it is the same
 * conversation the reaction stack already has — four moves, all on one `chain`,
 * which is the offer's own client-minted id:
 *
 *   offer      the sender has taken it off their sheet and is holding it out to
 *              one named character at one table. The item rides in `data.gift`.
 *   taken      the recipient wrote it onto their own sheet. Written by them.
 *   declined   the recipient said no. Written by them.
 *   returned   the sender put it back in their own pack. Written by them.
 *
 * ------------------------------------------------------------------- in the post
 * Between `offer` and its answer the thing belongs to **nobody**: it is off the
 * sender's sheet and not yet on anybody else's, and the log row is the only place
 * it exists. That is deliberate. The alternative is leaving it on the sender's
 * sheet until the offer is answered, and then two people can spend it — the
 * sender uses the potion while the offer is open, and the recipient takes a
 * second one.
 *
 * The risk it buys instead is an offer nobody answers, and that is what
 * `returnable` is for: the sender's own client settles a decline by putting the
 * thing back, and until it has, the offer is a row the sender can still see and
 * still recover. `settled` is what stops a recovered offer being recovered twice.
 *
 * ------------------------------------------------------------------ what travels
 * `data.gift` is one of three shapes and nothing else:
 *
 *   { kind: 'codex',  item: 'longsword' }        a piece the codex ships
 *   { kind: 'forged', record: { … } }            a thing somebody made
 *   { kind: 'custom', name, note }               "a folded note", written in
 *
 * A forged record travels whole, its instance id included, because **this is a
 * move rather than a copy**: the same ring leaves one pack and arrives in
 * another, which is exactly what a share code refuses to be (see `shareCode`).
 * That difference is also why a scroll in fading ink may be given and may not be
 * coded: giving it moves it, and nothing is duplicated.
 *
 * Two things are stripped on the way out. A `pact` flag, because somebody else's
 * bargain is not transferable and the trimmed record is an ordinary weapon; and
 * the record is re-read through `normalizeForged` on arrival, so a payload from a
 * newer build cannot put a shape this one does not understand onto a sheet.
 *
 * ------------------------------------------------------------------- the leaf
 * This file reads the item codex and the forged shelf. It writes nothing and
 * talks to nothing: the events are built in campaignLog.js and the patches are
 * applied by whichever sheet owns them.
 */

import { isForgedId, normalizeForged } from './forged.js';
import { getItem, isCustomEntry, newCustomId, normalizeBelt, normalizePack, normalizeTrinkets } from './items.js';
import { scrollTitle } from './scrolls.js';

/** The event kind every move rides on. New, so nothing else has to change. */
export const GIVE = 'give';

/* --------------------------------------------------------------- the parcel */

/**
 * One thing in a pack as the parcel that could be handed over, or null for
 * something that may not be.
 *
 * Two refusals, and both are about a thing that is not really the holder's to
 * give: a **pact-bound weapon**, which is an entity's bargain rather than an
 * item, and anything the codex cannot resolve at all.
 */
export function parcelOf(character, entry) {
  if (isCustomEntry(entry)) {
    return { kind: 'custom', name: String(entry.name ?? 'Something'), note: String(entry.note ?? '') };
  }

  const id = typeof entry === 'string' ? entry : String(entry?.id ?? '');
  if (!id) return null;

  if (isForgedId(id)) {
    const record = normalizeForged(character?.forged)[id];
    if (!record) return null;
    if (record.pact) return null;

    // The bargain's flag comes off: what arrives is an ordinary made item.
    const { pact, ...rest } = record;
    void pact;
    return { kind: 'forged', record: rest };
  }

  return getItem(id) ? { kind: 'codex', item: id } : null;
}

/** Why this thing cannot be handed over, or null when it can. */
export function parcelRefusal(character, entry) {
  if (parcelOf(character, entry)) return null;

  const id = typeof entry === 'string' ? entry : String(entry?.id ?? '');
  const record = isForgedId(id) ? normalizeForged(character?.forged)[id] : null;

  if (record?.pact) {
    return 'A pact-bound weapon is not yours to give. It is the entity’s, and it goes where you go.';
  }
  return 'There is nothing here this build knows how to hand over.';
}

/**
 * What a parcel is called, for the offer's own line.
 *
 * A made thing may have no name of its own, and what it falls back to is the
 * base's — except for a scroll, whose base is called "Spell Scroll" and whose
 * whole identity is the spell on it. "Kest is holding out Spell Scroll" is the
 * one line here that would tell the reader nothing, so the scroll's own title is
 * read the way the item itself reads it. See `scrollTitle`.
 */
export function parcelName(gift) {
  if (gift?.kind === 'custom') return gift.name || 'Something';
  if (gift?.kind === 'forged') {
    const record = gift.record;
    if (record?.name) return record.name;
    if (record?.scroll) return scrollTitle(record.scroll);
    return getItem(record?.base)?.name ?? 'Something made';
  }
  return getItem(gift?.item)?.name ?? 'Something';
}

/**
 * A parcel repaired against this build, or null for one it cannot honour.
 *
 * Every payload read off the log goes through here before it touches a sheet. A
 * row is written by another player's client and is data, never instruction: an
 * item id this codex does not have, a record shape from a newer build and a
 * `pact` flag somebody hand-wrote into a payload are all refused rather than
 * trusted.
 */
export function readParcel(gift) {
  if (!gift || typeof gift !== 'object') return null;

  if (gift.kind === 'custom') {
    const name = String(gift.name ?? '').trim().slice(0, 80);
    return name ? { kind: 'custom', name, note: String(gift.note ?? '').trim().slice(0, 500) } : null;
  }

  if (gift.kind === 'forged') {
    const raw = gift.record;
    if (!raw?.id || !isForgedId(raw.id)) return null;
    /* Re-read through the shelf's own repair, which is the one place a record
       shape is decided, and it drops everything it does not know — the pact
       flag among it, since `normalizeForged` only keeps one it is given and this
       one is stripped first. */
    const { pact, ...rest } = raw;
    void pact;
    const kept = normalizeForged({ [raw.id]: rest })[raw.id];
    return kept && getItem(kept.base) ? { kind: 'forged', record: kept } : null;
  }

  const id = String(gift.item ?? '');
  return getItem(id) ? { kind: 'codex', item: id } : null;
}

/* ----------------------------------------------------------- leaving a sheet */

/**
 * The patch that takes one thing out of the sender's pack, by position.
 *
 * By position and not by id, because a pack is a flat list and three healing
 * potions are three entries in it: giving one away must take one, not all of
 * them. A forged record goes off the shelf with it — the thing and its identity
 * travel together, and leaving the record behind would grow the column forever.
 *
 * Only ever the pack. Something worn, wielded or clipped on has to be taken off
 * first, which is a decision the sender makes in the block that holds it rather
 * than a side effect of a gift.
 */
export function giveFromPack(character, index) {
  const pack = normalizePack(character?.pack);
  if (index < 0 || index >= pack.length) return null;

  const entry = pack[index];
  const gift = parcelOf(character, entry);
  if (!gift) return null;

  const patch = { pack: pack.filter((_, at) => at !== index) };

  if (gift.kind === 'forged') {
    const shelf = { ...normalizeForged(character?.forged) };
    delete shelf[gift.record.id];
    patch.forged = shelf;
  }

  return { gift, patch };
}

/* --------------------------------------------------------- arriving on a sheet */

/**
 * The patch that puts a parcel into this sheet's pack.
 *
 * Into the pack, never into a slot, for the reason a brewed flask lands there
 * too: a loop is a place you have chosen to put something, and choosing is what
 * the Inventory tab is for.
 *
 * A forged record keeps the id it arrived with. Ids are minted from a UUID, so
 * two sheets colliding on one is not a thing that happens, and keeping it is
 * what makes this a move: the ring in your pack is the ring that was in theirs.
 * The one guard is the sheet that already holds that id, which is the sender
 * taking their own offer back — the record is rewritten rather than doubled.
 */
export function takeIntoPack(character, gift) {
  const parcel = readParcel(gift);
  if (!parcel) return null;

  const pack = normalizePack(character?.pack);

  if (parcel.kind === 'custom') {
    return {
      patch: { pack: [...pack, { id: newCustomId(), name: parcel.name, note: parcel.note }] },
      name: parcel.name,
    };
  }

  if (parcel.kind === 'forged') {
    const shelf = { ...normalizeForged(character?.forged) };
    shelf[parcel.record.id] = parcel.record;
    const held = pack.some((entry) => entry === parcel.record.id);

    return {
      patch: {
        forged: shelf,
        ...(held ? {} : { pack: [...pack, parcel.record.id] }),
      },
      name: parcelName(parcel),
    };
  }

  return { patch: { pack: [...pack, parcel.item] }, name: parcelName(parcel) };
}

/* ---------------------------------------------------------------- the roster */

/**
 * Who a sheet may hand something to at one table: everybody seated but itself.
 *
 * Off the campaign's own roster rather than off anything on this sheet, because
 * a party is a thing the campaign knows and a sheet does not. `listMembers` is
 * readable by every seated member, which is exactly the reach this needs.
 */
export function giftTargets(members = [], selfId) {
  return members
    .filter((row) => row.characters && row.character_id !== selfId)
    .map((row) => ({
      id: row.character_id,
      name: row.characters.name || 'Someone',
      portrait: row.characters.portrait_url ?? null,
    }));
}

/* ------------------------------------------------------------ reading the log */

/**
 * Every offer at this table that is still waiting on an answer, newest first.
 *
 * Read off the feed rather than held in memory, which is what makes an offer
 * survive a reload on either side: a player who shuts the laptop between the
 * offer and the answer still has the offer when they open it.
 *
 * `settled` is the whole of the arithmetic. An offer is answered by a `taken` or
 * a `declined` on its own chain, and a decline is finished by a `returned` — so
 * a chain carrying nothing but an offer is live, and a chain carrying a decline
 * and no return is a thing the sender still has to take back. Same shape
 * `settled` uses for the reaction stack in logChain.js.
 */
export function openOffers(events = []) {
  const answered = new Set();
  const returned = new Set();
  const offers = [];

  for (const row of events) {
    if (row?.kind !== GIVE) continue;
    const chain = row.data?.chain ?? '';
    if (!chain) continue;

    const move = row.data?.move;
    if (move === 'offer') offers.push(row);
    else if (move === 'taken' || move === 'declined') answered.add(chain);
    if (move === 'returned') returned.add(chain);
    if (move === 'taken') returned.add(chain);
  }

  return offers.map((row) => ({
    row,
    chain: row.data.chain,
    to: row.data.to ?? null,
    from: row.character_id ?? null,
    gift: row.data.gift ?? null,
    answered: answered.has(row.data.chain),
    settled: returned.has(row.data.chain),
  }));
}

/** The offers this character is being held out, and has not answered. */
export function offersToMe(events, characterId) {
  return openOffers(events).filter((offer) => offer.to === characterId && !offer.answered);
}

/**
 * And the offers this character made that came back refused, and are still not
 * back in their pack.
 *
 * The sender's own client is what settles these, because it is the only one that
 * may write to the sender's sheet. It reads them on mount as well as off the
 * channel, so an offer declined while the laptop was shut is recovered the next
 * time the sheet is opened rather than lost.
 */
export function returnable(events, characterId) {
  return openOffers(events).filter(
    (offer) => offer.from === characterId && offer.answered && !offer.settled
  );
}

/**
 * Whether this sheet is holding the thing an offer names.
 *
 * The guard against a double return: a sender whose two tabs both settle the
 * same decline would put the ring back twice, and a `returned` row that lost its
 * race would leave the second tab thinking there was still work to do. So the
 * write is skipped when the thing is already home, whatever the log says.
 *
 * **Only a made thing can answer this**, and that is a limit rather than an
 * oversight: a codex item has no identity, so "do I hold a healing potion" does
 * not tell you whether *this* potion came back. A codex gift that somehow ended
 * up offered and still held — the browser dying between the row landing and the
 * pack's autosave — comes home as a second copy rather than not at all. A
 * duplicate is the recoverable failure and a loss is not, which is the same
 * trade `GiveWindow` makes when it posts the row before it empties the pack.
 */
export function alreadyHome(character, gift) {
  const parcel = readParcel(gift);
  if (parcel?.kind !== 'forged') return false;

  const id = parcel.record.id;
  return (
    Boolean(normalizeForged(character?.forged)[id]) ||
    normalizePack(character?.pack).some((entry) => entry === id) ||
    normalizeBelt(character?.belt).some((entry) => entry?.id === id) ||
    normalizeTrinkets(character?.trinkets).includes(id)
  );
}
