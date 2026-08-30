import { supabase } from './supabaseClient.js';

/**
 * Subscribe to row changes on one table, scoped by a PostgREST filter.
 *
 * `onResync` fires every time the channel reaches SUBSCRIBED *after* the first
 * time — i.e. after a reconnect. Websockets drop when a laptop sleeps or wifi
 * flaps, and messages sent during that gap are simply lost, so the reconnect is
 * the moment to refetch rather than sit on stale data.
 *
 * Returns an unsubscribe function (safe to call when Supabase isn't configured).
 */
/**
 * A number that makes each subscription's topic its own.
 *
 * `supabase.channel(topic)` **reuses** an existing channel with the same topic
 * rather than opening a second one, and `removeChannel` unsubscribes and tears
 * that shared channel down. So two callers watching the same rows used to get
 * one channel between them, and whichever unmounted first silently stopped the
 * other from receiving anything.
 *
 * That is not hypothetical: the table log and the dice tray both listen to
 * `campaign_events` for the same campaign, so leaving the Character tab took the
 * replays with it. A caller here is handed an unsubscribe function and is
 * entitled to believe it only unsubscribes them.
 */
let topics = 0;

export function subscribeToTable({ table, filter, onChange, onResync }) {
  if (!supabase) return () => {};

  let subscribedBefore = false;
  topics += 1;

  const channel = supabase
    .channel(`${table}:${filter}:${topics}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter }, onChange)
    .subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      if (subscribedBefore) onResync?.();
      subscribedBefore = true;
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
