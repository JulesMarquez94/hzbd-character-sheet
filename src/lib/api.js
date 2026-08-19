import { requireSupabase } from './supabaseClient.js';
import { BLANK_CHARACTER } from './characterModel.js';

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
  const sb = requireSupabase();
  // maybeSingle, so a dead link reads as "not found" rather than a PostgREST
  // coercion error.
  const { data, error } = await sb.from('characters').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('No character exists at this link. It may have been deleted.');
  return data;
}

export async function createCharacter(userId, overrides = {}) {
  const sb = requireSupabase();
  const row = { ...BLANK_CHARACTER, ...overrides, user_id: userId };

  return withMissingColumnRetry(
    (payload) => sb.from('characters').insert(payload).select().single(),
    row
  );
}

export async function updateCharacter(id, patch) {
  const sb = requireSupabase();

  return withMissingColumnRetry(
    (payload) => sb.from('characters').update(payload).eq('id', id).select().single(),
    pickCharacterFields(patch)
  );
}

export async function deleteCharacter(id) {
  const sb = requireSupabase();
  const { error } = await sb.from('characters').delete().eq('id', id);
  if (error) throw error;
}
