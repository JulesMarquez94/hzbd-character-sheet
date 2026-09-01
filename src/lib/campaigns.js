import { requireSupabase } from './supabaseClient.js';

/**
 * Campaigns: the table a party sits at.
 *
 * One row per campaign, owned outright by the DM who made it, and one
 * campaign_members row per character sitting at it. The membership row is the
 * whole of the link: `characters` itself carries nothing, so a character can
 * sit at more than one table and leaving one touches nothing on the sheet.
 *
 * Two ways in, deliberately different:
 *
 *   by link   the DM pastes a character's sheet link. An ordinary insert,
 *             allowed by policy because they run the campaign.
 *   by code   a player redeems the campaign's join code for one of their own
 *             characters, through the join_campaign definer function, so a
 *             code holder never needs to be able to read a campaign they are
 *             not yet in.
 *
 * Either way the row's user_id is written by a trigger from the character's
 * real owner, never trusted from the client. See supabase/schema.sql.
 */

/** Columns the app writes back. Keeps updates from ever touching id/dm_user_id. */
const CAMPAIGN_FIELDS = [
  'name',
  'description',
  'thumbnail_url',
  'code',
  'overview_order',
  'overview_columns',
  'overview_trays',
];

function pickCampaignFields(patch) {
  const clean = {};
  for (const key of Object.keys(patch)) {
    if (CAMPAIGN_FIELDS.includes(key)) clean[key] = patch[key];
  }
  return clean;
}

/* ------------------------------------------------------------- the join code */

/**
 * No 0, O, 1, I or L: a code is read out loud across a table, and the letters
 * that survive are the ones that cannot be misheard as each other on a phone
 * screen in a dim room.
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Eight characters, split for reading: `KQ2M-8VXR`. */
export function makeJoinCode() {
  const draws = new Uint32Array(8);
  crypto.getRandomValues(draws);
  const picks = Array.from(draws, (n) => CODE_ALPHABET[n % CODE_ALPHABET.length]);
  return `${picks.slice(0, 4).join('')}-${picks.slice(4).join('')}`;
}

/* --------------------------------------------------------- reading the link */

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/**
 * The character id inside whatever was pasted: a full sheet link, a relative
 * path, or the bare id itself. Null when nothing in the text is one.
 */
export function characterIdFromLink(text) {
  const raw = String(text ?? '').trim();
  const inLink = new RegExp(`characters/(${UUID})`, 'i').exec(raw);
  if (inLink) return inLink[1].toLowerCase();
  const bare = new RegExp(`^(${UUID})$`, 'i').exec(raw);
  return bare ? bare[1].toLowerCase() : null;
}

/* -------------------------------------------------------------- campaigns */

/* The card on the Campaigns page needs a name, a face and a level per linked
   character, and nothing else off the sheet. */
const CARD_MEMBERS = 'campaign_members ( id, character_id, user_id, characters ( id, name, portrait_url, xp ) )';

/**
 * Every campaign this account sees, split by which chair they sit in:
 * `running` is theirs to edit, `joined` is a table they play at.
 */
export async function listCampaigns(userId) {
  const sb = requireSupabase();

  const { data: running, error } = await sb
    .from('campaigns')
    .select(`*, ${CARD_MEMBERS}`)
    .eq('dm_user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const { data: seats, error: seatError } = await sb
    .from('campaign_members')
    .select('campaign_id')
    .eq('user_id', userId);
  if (seatError) throw seatError;

  const ids = [...new Set((seats ?? []).map((seat) => seat.campaign_id))];
  let joined = [];
  if (ids.length > 0) {
    const { data, error: joinedError } = await sb
      .from('campaigns')
      .select(`*, ${CARD_MEMBERS}`)
      .in('id', ids)
      .neq('dm_user_id', userId)
      .order('created_at', { ascending: true });
    if (joinedError) throw joinedError;
    joined = data ?? [];
  }

  return { running: running ?? [], joined };
}

export async function getCampaign(id) {
  const sb = requireSupabase();
  // maybeSingle, so a dead link reads as "not found" rather than a PostgREST
  // coercion error.
  const { data, error } = await sb.from('campaigns').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error('No campaign exists at this link. It may have been deleted, or you may not be at its table.');
  }
  return data;
}

export async function createCampaign(userId, overrides = {}) {
  const sb = requireSupabase();

  /* The code is minted here rather than in the database. A collision on eight
     characters of thirty-one is lottery odds, but it costs one line to survive:
     mint again and retry. */
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row = {
      ...pickCampaignFields(overrides),
      code: makeJoinCode(),
      dm_user_id: userId,
    };
    const { data, error } = await sb.from('campaigns').insert(row).select().single();
    if (!error) return data;
    const collided = error.code === '23505' && /code/i.test(error.message ?? '');
    if (!collided) throw error;
  }
  throw new Error('Could not mint a join code. Try again.');
}

export async function updateCampaign(id, patch) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('campaigns')
    .update(pickCampaignFields(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCampaign(id) {
  const sb = requireSupabase();
  const { error } = await sb.from('campaigns').delete().eq('id', id);
  if (error) throw error;
}

/* ---------------------------------------------------------------- members */

/**
 * The roster with each member's whole sheet on it, because the Overview blocks
 * print the same numbers the sheet does and need everything the sheet needs.
 */
export async function listMembers(campaignId) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('campaign_members')
    .select('*, characters ( * )')
    .eq('campaign_id', campaignId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  // A membership whose character was deleted resolves to null; nothing to draw.
  return (data ?? []).filter((row) => row.characters);
}

/** The DM linking a character by its sheet link. */
export async function addMember(campaignId, characterId) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('campaign_members')
    .insert({ campaign_id: campaignId, character_id: characterId })
    .select('*, characters ( * )')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('That character already sits at this table.');
    throw error;
  }
  return data;
}

export async function removeMember(memberId) {
  const sb = requireSupabase();
  const { error } = await sb.from('campaign_members').delete().eq('id', memberId);
  if (error) throw error;
}

/** A player redeeming the code for one of their own characters. */
export async function joinCampaign(code, characterId) {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc('join_campaign', {
    join_code: code,
    sheet_id: characterId,
  });
  if (error) throw error;
  return data; // the campaign id, for navigating straight to it
}
