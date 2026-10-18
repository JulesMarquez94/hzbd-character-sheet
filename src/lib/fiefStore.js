import { requireSupabase } from './supabaseClient.js';

/**
 * The Fief's order book, read and written. The town itself is never stored:
 * every screen reads the book and folds it (see foldFief in fief.js), so this
 * file is the whole of what the town says to the database.
 *
 * Insert only. The schema has no update or delete policy on fief_orders, and a
 * trigger stamps who wrote each row from the session (claim_fief_actor), so a
 * row here can be trusted to be from whoever it says, and nothing else about
 * it can be. The fold refuses what is not allowed.
 */

const PAGE = 1000;

/** Every order a town was given, oldest first. Paged, because a long campaign outgrows one read. */
export async function listOrders(campaignId) {
  const sb = requireSupabase();
  const out = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('fief_orders')
      .select('id, seq, day, kind, actor, character_id, data, created_at')
      .eq('campaign_id', campaignId)
      .order('seq', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

/**
 * One move on the town. `characterId` is the sheet that ordered it, or null for
 * the Game Master's own hand, which the trigger only lets the Game Master write.
 */
export async function placeOrder(campaignId, { kind, day, data = {}, actor = '', characterId = null }) {
  const sb = requireSupabase();
  const { data: row, error } = await sb
    .from('fief_orders')
    .insert({ campaign_id: campaignId, character_id: characterId, kind, day, actor, data })
    .select('id, seq, day, kind, actor, character_id, data, created_at')
    .single();
  if (error) throw error;
  return row;
}
