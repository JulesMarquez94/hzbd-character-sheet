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
export function subscribeToTable({ table, filter, onChange, onResync }) {
  if (!supabase) return () => {};

  let subscribedBefore = false;

  const channel = supabase
    .channel(`${table}:${filter}`)
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
