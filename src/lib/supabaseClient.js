import { createClient } from '@supabase/supabase-js';

/* Optional-chained, because outside Vite there is no `import.meta.env` at all
   and reading through it throws on the first line of the file. That happens
   whenever a checker in scripts/ walks a module that reaches this one, which is
   how the bestiary's own checker found it: check-creatures.mjs imports
   encounters.js, encounters.js talks to this table, and plain node crashed at
   import rather than degrading. The comment below was already the promise; this
   is it kept. `import.meta.env?.DEV` in weapons.js is the same idiom. */
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

/**
 * True only when both env vars are present. The whole app degrades gracefully
 * when they are missing (see <SupabaseNotice />) instead of crashing at import.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/** Throws a readable error instead of "cannot read property from null". */
export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env.local and add your project URL and anon key.'
    );
  }
  return supabase;
}
