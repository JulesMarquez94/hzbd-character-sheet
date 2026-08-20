/**
 * Forged items — a piece of gear the player made, rather than one the codex
 * shipped.
 *
 * This is the **item instance** the Developpement Notes have been waiting on,
 * and the thing three of their asks all needed. `laid` in enchanting.js is keyed
 * by item *id*, so two longswords were one longsword: naming one, carrying two
 * of the same ring with different work in them, and handing one to another
 * player by code were all impossible for the same reason — there was nothing
 * with an identity of its own to point at.
 *
 * A forged item has one. Its id is minted when it is made and it is the id that
 * goes in the pack, in an equipment slot, on a belt loop or on a trinket, so
 * everything downstream keeps pointing at ids and nothing had to learn a second
 * shape.
 *
 * ------------------------------------------------------------------- the record
 *   base   the codex item it is made from. The whole of what it *is* — slots,
 *          tags, defense, armor, the cards it teaches — comes from here and is
 *          never copied, so a piece the designer reprices is repriced in every
 *          ring anybody ever made out of it.
 *   ench   the workings put into it, as `{ id, spell }` — exactly the shape a
 *          codex item's own `enchants` uses, because that is the field the whole
 *          sheet already reads (`itemEnchantments`, `itemModifiers`, the Magic
 *          Burden meter, the spells the Abilities tab lists).
 *   name   what the player calls it, or null for the base's own name.
 *   art    a picture the player pointed at, or null for the base's own.
 *
 * Nothing mechanical is stored. A record is a *reference* plus two labels, which
 * is what makes the share code short and what stops a saved item drifting away
 * from the codex it was made from.
 *
 * -------------------------------------------------------------------- the code
 * `shareCode` writes the record out as one pasteable token and `readCode` reads
 * it back. It carries no instance id: pasting a code makes a **new** item to the
 * same design, which is the only honest reading — two players cannot be holding
 * the same ring.
 *
 * A checksum rides along so a code that lost a character in a chat window is
 * refused rather than quietly making a different item.
 *
 * --------------------------------------------------------------------- the leaf
 * This file may import the enchantment codex, which is itself a leaf. It may
 * **not** import items.js, which imports this one: the base item is handed in
 * rather than looked up. See `heldItem` in items.js, the one place a forged id
 * is resolved.
 */

import { getEnchantment } from './enchantments.js';

/**
 * The prefix that tells a forged id from a codex id at a glance, and the reason
 * no codex id may begin with it. Same law as the pack's `custom-`.
 */
const FORGED_PREFIX = 'forged-';

/** What a name may run to. Long enough for "Ring of the Drowned Chorus". */
export const FORGED_NAME_MAX = 60;

export function isForgedId(id) {
  return String(id ?? '').startsWith(FORGED_PREFIX);
}

export function newForgedId() {
  const seed = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12);
  return `${FORGED_PREFIX}${seed}`;
}

/* ----------------------------------------------------------------- the storage
 * The column is a map from instance id to record rather than a list, because
 * every read of it is a lookup by id: an equipment slot holds `forged-a1b2` and
 * has to become an item in one step.
 *
 * Repaired rather than trusted, the same way `laid` and the pack are. A record
 * with no base is dropped — it would resolve to nothing and there would be no
 * way to see it, let alone throw it away. An enchantment the codex no longer
 * knows is dropped from the list rather than taking the item with it.
 */
export function normalizeForged(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {};

  const out = {};
  for (const [key, raw] of Object.entries(source)) {
    const id = String(key ?? '');
    if (!isForgedId(id) || !raw || typeof raw !== 'object') continue;

    const base = String(raw.base ?? '');
    if (!base) continue;

    out[id] = {
      id,
      base,
      ench: normalizeEnch(raw.ench),
      name: cleanName(raw.name),
      art: cleanArt(raw.art),
    };
  }
  return out;
}

/**
 * The workings on one forged item, deduplicated by enchantment and checked
 * against the codex.
 *
 * Deduplicated because of the stacking law: an effect does not stack with itself
 * from the same source. Two Primal Senses in one ring would be one Primal Sense
 * however they were summed, so the second is not stored at all — the player is
 * refused at the forge rather than left holding a ring that charges Magic Burden
 * twice for one point of Instinct.
 */
function normalizeEnch(value) {
  const list = Array.isArray(value) ? value : [];
  const seen = new Set();
  const out = [];

  for (const raw of list) {
    const id = String(typeof raw === 'string' ? raw : raw?.id ?? '');
    if (!id || seen.has(id) || !getEnchantment(id)) continue;
    seen.add(id);

    const spell = typeof raw?.spell === 'string' ? raw.spell.trim() : '';
    out.push(spell ? { id, spell } : { id });
  }
  return out;
}

function cleanName(value) {
  const clean = String(value ?? '').trim().slice(0, FORGED_NAME_MAX);
  return clean || null;
}

/**
 * A picture is a URL and nothing else — the same field a portrait uses, and for
 * the same reason: nothing on this site uploads a file. Only http(s), so a
 * record can never carry a `javascript:` or a `data:` payload into an img tag,
 * and a pasted code is a stranger's data.
 */
function cleanArt(value) {
  const clean = String(value ?? '').trim();
  if (!clean || !/^https?:\/\//i.test(clean)) return null;
  return clean.slice(0, 500);
}

/** A fresh record from what the forge window collected. */
export function forgeRecord({ base, ench, name, art }) {
  const id = String(base ?? '');
  if (!id) return null;

  return {
    id: newForgedId(),
    base: id,
    ench: normalizeEnch(ench),
    name: cleanName(name),
    art: cleanArt(art),
  };
}

/** The record behind one id, or null for a codex id and for anything unknown. */
export function forgedRecord(character, id) {
  if (!isForgedId(id)) return null;
  return normalizeForged(character?.forged)[String(id)] ?? null;
}

/**
 * The record made into an item, given the codex piece it was made from.
 *
 * The base is handed in because this file may not reach the codex. `heldItem` in
 * items.js is the one caller, and the one place a forged id becomes an item.
 *
 * ---------------------------------------------------------------- what changes
 * The id, so the sheet points at this ring rather than at every silver ring; the
 * name and the picture where the player set them; and `enchants`, which gains
 * what was worked in. Everything else is the base's, untouched.
 *
 * `Enchanted` joins the tags when there is anything in it, so the browser's tag
 * filter can find worked pieces and the chips say what the row is at a glance.
 *
 * `artOwn` marks a picture the *player* pointed at rather than one the codex
 * shipped. Codex art is a paid capability and a player's own is not (see
 * useCodexArt.js), so the two have to be told apart at the moment of drawing.
 */
export function forgedItem(record, base) {
  if (!record || !base) return null;

  const worked = record.ench.length > 0;
  const tags = worked && !base.tags.includes('Enchanted') ? [...base.tags, 'Enchanted'] : base.tags;

  return {
    ...base,
    id: record.id,
    forged: record.base,
    name: record.name ?? base.name,
    tags,
    enchants: [...(base.enchants ?? []), ...record.ench],
    art_url: record.art ?? base.art_url ?? null,
    art_thumb: record.art ?? base.art_thumb ?? null,
    artOwn: Boolean(record.art),
  };
}

/* -------------------------------------------------------------------- the code
 * One token, pasteable into a chat window and back out again.
 *
 *   HZBD1.<payload>.<check>
 *
 * `payload` is the record as JSON, base64url so it survives a URL, a Discord
 * message and a spreadsheet cell. `check` is a hash of the payload in base 36 —
 * four or five characters, and the whole reason it is here is that a truncated
 * paste must fail loudly. Without it a code that lost its last character would
 * still decode, into a different item, and nobody would find out until the table
 * argued about a damage type.
 *
 * The keys are one letter each because this is read by a machine and carried by
 * a human: a two-working ring is about ninety characters, and it is a name and a
 * picture that actually make one long.
 */
const CODE_TAG = 'HZBD1';

export function shareCode(record) {
  if (!record?.base) return '';

  const payload = toBase64Url(
    JSON.stringify({
      b: record.base,
      e: (record.ench ?? []).map((entry) => (entry.spell ? [entry.id, entry.spell] : [entry.id])),
      ...(record.name ? { n: record.name } : {}),
      ...(record.art ? { a: record.art } : {}),
    })
  );

  return `${CODE_TAG}.${payload}.${checksum(payload)}`;
}

/**
 * A pasted code as a record, or a reason it is not one.
 *
 * Hands back `{ record }` or `{ error }` rather than throwing or returning null,
 * because every one of these is something the window has to *say*: a code from a
 * newer build, a code that lost a character, a code for a piece this codex does
 * not have. "That code is not valid" is the one message that helps nobody.
 *
 * The base is not checked here — this file cannot see the codex. The window
 * resolves it and says so when the piece is unknown.
 */
export function readCode(text) {
  const clean = String(text ?? '').trim();
  if (!clean) return { error: 'Paste a code first.' };

  const parts = clean.split('.');
  if (parts.length !== 3 || parts[0] !== CODE_TAG) {
    return { error: 'That is not an item code. One begins with HZBD1.' };
  }

  const [, payload, check] = parts;
  if (checksum(payload) !== check) {
    return { error: 'That code is damaged — a character is missing or changed. Copy it again.' };
  }

  let parsed;
  try {
    parsed = JSON.parse(fromBase64Url(payload));
  } catch {
    return { error: 'That code could not be read.' };
  }

  const base = String(parsed?.b ?? '');
  if (!base) return { error: 'That code names no item.' };

  const carried = (Array.isArray(parsed.e) ? parsed.e : []).map((entry) =>
    Array.isArray(entry) ? { id: entry[0], spell: entry[1] } : { id: entry }
  );
  const ench = normalizeEnch(carried);

  return {
    record: { base, ench, name: cleanName(parsed.n), art: cleanArt(parsed.a) },
    /* What the codex threw away on the way in, so the window can say "that code
       carried a working this build does not know" rather than silently handing
       over a plainer ring than the sender is holding. */
    dropped: Math.max(0, carried.length - ench.length),
  };
}

/* Base64url by hand, because `btoa` speaks bytes and a name may not be ASCII —
   an accented name through btoa alone throws. */
function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code) {
  const padded = code.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (ch) => ch.charCodeAt(0)));
}

/** FNV-1a, base 36. Not a signature — nobody is being kept out, only corrected. */
function checksum(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}
