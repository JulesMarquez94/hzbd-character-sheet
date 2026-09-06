import { requireSupabase } from './supabaseClient.js';
import { BLANK_CHARACTER } from './characterModel.js';
import { characterSlots } from './tiers.js';
import {
  createLocalCharacter,
  deleteLocalCharacter,
  getLocalCharacter,
  isLocalId,
  updateLocalCharacter,
} from './localCharacters.js';

/** Columns the sheet writes back. Keeps updates from ever touching id/user_id. */
const CHARACTER_FIELDS = Object.keys(BLANK_CHARACTER);

function pickCharacterFields(patch) {
  const clean = {};
  for (const key of Object.keys(patch)) {
    if (CHARACTER_FIELDS.includes(key)) clean[key] = patch[key];
  }
  return clean;
}

/**
 * PostgREST rejects a whole write when one column is missing from its schema
 * cache — a database that predates a column, or one where the cache is stale
 * after a migration:
 *
 *   Could not find the 'background' column of 'characters' in the schema cache
 *
 * Rather than lose the entire save over one field, drop the named column and
 * try again. The warning points at the real fix: re-run supabase/schema.sql,
 * which now ends with `notify pgrst, 'reload schema'`.
 */
const MISSING_COLUMN = /Could not find the '([^']+)' column/i;

async function withMissingColumnRetry(run, row) {
  let payload = row;

  // One retry per droppable column, bounded by the column count.
  for (let attempt = 0; attempt <= Object.keys(row).length; attempt += 1) {
    const { data, error } = await run(payload);
    if (!error) return data;

    const column = MISSING_COLUMN.exec(error.message ?? '')?.[1];
    if (!column || !(column in payload)) throw error;

    console.warn(
      `[hazebound] The characters table has no '${column}' column, so it was left out of this write. ` +
        'Re-run supabase/schema.sql in the Supabase SQL editor to add it.'
    );

    payload = { ...payload };
    delete payload[column];
  }

  throw new Error('The characters table is missing too many columns. Re-run supabase/schema.sql.');
}

/* ---------------------------------------------------------------- characters */

/*
 * Two shelves, one door.
 *
 * A character lives in the database under the account that made it, or on this
 * device under a `local-` id when nobody was signed in to make it. The id says
 * which, so every function here that takes one branches on it and the pages
 * above never ask. See src/lib/localCharacters.js for what a device-only
 * character is and is not. The listing does not branch: an account's list is
 * the database's and the device's is `listLocalCharacters`, and the dashboard
 * shows both because they are two different shelves.
 */

/**
 * How many characters an account holds, which is a number per tier rather than
 * one number: three free and twenty-five paid. `characterSlots` in
 * src/lib/tiers.js is the table, `character_slots` in supabase/schema.sql is
 * the same table again behind a trigger, and the trigger is what enforces it.
 *
 * This used to be a bare 6 checked by the interface alone, which was honest
 * while the number was the same for everybody and stopped being honest the
 * moment one tier bought a bigger vault. The device's own ceiling is
 * LOCAL_CHARACTER_SLOTS in localCharacters.js and has nothing to do with a tier.
 */
export { characterSlots };

export async function listCharacters(userId) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('characters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCharacter(id) {
  if (isLocalId(id)) return getLocalCharacter(id);

  const sb = requireSupabase();
  // maybeSingle, so a dead link reads as "not found" rather than a PostgREST
  // coercion error.
  const { data, error } = await sb.from('characters').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('No character exists at this link. It may have been deleted.');
  return data;
}

/**
 * No account, no row: with nobody signed in the character is kept on this
 * device instead, and the same blank is what it starts from.
 */
export async function createCharacter(userId, overrides = {}) {
  if (!userId) return createLocalCharacter({ ...BLANK_CHARACTER, ...pickCharacterFields(overrides) });

  const sb = requireSupabase();
  const row = { ...BLANK_CHARACTER, ...overrides, user_id: userId };

  return withMissingColumnRetry(
    (payload) => sb.from('characters').insert(payload).select().single(),
    row
  );
}

export async function updateCharacter(id, patch) {
  if (isLocalId(id)) return updateLocalCharacter(id, pickCharacterFields(patch));

  const sb = requireSupabase();

  return withMissingColumnRetry(
    (payload) => sb.from('characters').update(payload).eq('id', id).select().single(),
    pickCharacterFields(patch)
  );
}

export async function deleteCharacter(id) {
  if (isLocalId(id)) return deleteLocalCharacter(id);

  const sb = requireSupabase();
  const { error } = await sb.from('characters').delete().eq('id', id);
  if (error) throw error;
}

/**
 * A character kept on this device, written into the account that is signed in.
 *
 * Everything the sheet stores comes across and nothing about where it was: the
 * id, the empty owner and the two clocks are the database's to stamp afresh.
 * The row is inserted first and the device copy removed only once it is, so a
 * write that fails leaves the character exactly where it was. Returns the new
 * row, whose id is the link that now works for everybody.
 *
 * The vault's ceiling is checked here rather than by each caller, because the
 * sheet offers this too and has no list of the account's characters to count.
 * `tier` is the account's rung, because the ceiling is no longer one number.
 * It defaults to the smallest vault there is: a caller that forgets to pass one
 * gets a refusal it can read rather than an overfilled vault, and the trigger in
 * the database would have refused it anyway.
 */
export async function adoptCharacter(localId, userId, tier = 'free') {
  if (!isLocalId(localId)) throw new Error('That character is already saved to an account.');
  if (!userId) throw new Error('Sign in first, so there is an account to save the character to.');

  const local = getLocalCharacter(localId);

  const slots = characterSlots(tier);
  const held = await listCharacters(userId);
  if (held.length >= slots) {
    throw new Error(
      `Your vault is full at ${slots} characters. Delete one there before saving this one.`
    );
  }

  const created = await createCharacter(userId, pickCharacterFields(local));
  deleteLocalCharacter(localId);
  return created;
}
