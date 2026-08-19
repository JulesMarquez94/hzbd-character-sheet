import { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { AuthContext } from './auth-context.js';
import { can, getTier, normalizeTier, showsArt } from '../lib/tiers.js';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  // When Supabase is missing there is nothing to wait for — never block the UI.
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id;

  // Pull the display name once we know who is signed in.
  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return;

    let active = true;
    supabase
      .from('profiles')
      .select('id, username, role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile(data ?? null);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo(() => {
    const user = session?.user ?? null;
    // Ignore a profile left over from a previous session instead of clearing it
    // from an effect.
    const activeProfile = profile && profile.id === user?.id ? profile : null;

    /* The account tier, from the one column that holds it. A signed-out
       visitor is `free`, which is right: they see the sheet and not the art.
       See src/lib/tiers.js for the ladder and what each rung carries. */
    const tier = normalizeTier(activeProfile?.role);

    return {
      session,
      user,
      profile: activeProfile,
      loading,
      isConfigured: isSupabaseConfigured,

      tier,
      tierInfo: getTier(tier),
      /* What this account may do. UI only: every capability that guards
         something real has a policy behind it, and the policy is what
         enforces it. */
      can: (capability) => can(tier, capability),
      /* Whether a picture is shown. Nothing calls this yet — the plates render
         as they always have. It is here so the card rework can turn the rule
         on in one place. Art a player put on their own sheet is always shown,
         whatever the tier. */
      showsArt: (source) => showsArt(tier, source),

      // Mirrors public.is_admin() in the database. This only hides UI — the
      // policies are what actually enforce it.
      isAdmin: tier === 'admin',
      // Falls back to the email handle until the profile row arrives.
      displayName:
        activeProfile?.username ||
        user?.user_metadata?.username ||
        user?.email?.split('@')[0] ||
        'traveller',

      async signUp({ email, password, username }) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        return { data, error };
      },

      async signIn({ email, password }) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
      },

      async signOut() {
        await supabase.auth.signOut();
      },

      async resetPassword(email) {
        /* The recovery link signs the user in; landing them on /login would
           just bounce them to the dashboard with the password still lost.
           Account Settings is where the change-password form lives.
           (The URL must be allowed under Supabase -> Authentication -> URL
           Configuration -> Redirect URLs.) */
        return supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/account`,
        });
      },
    };
  }, [session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
