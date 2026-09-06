import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import { supabase } from '../lib/supabaseClient.js';
import { openPortalUrl } from '../lib/premium.js';

export default function Account() {
  const { user, profile, displayName, tier, tierInfo } = useAuth();

  const [username, setUsername] = useState(profile?.username || displayName);

  // The profile row often arrives after the first render; without this the
  // field holds the signup-metadata fallback and "Save Name" would quietly
  // write that stale value back over the real one.
  const [seenProfileName, setSeenProfileName] = useState(profile?.username ?? null);
  if (profile?.username && profile.username !== seenProfileName) {
    setSeenProfileName(profile.username);
    setUsername(profile.username);
  }
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /* The subscription behind the tier, if there is one. Read-only and read-own:
     the policy on `subscriptions` grants a select and nothing else, so this can
     report what Stripe last said and can never change it. A `friend` account
     has no row here at all, which is the difference between a tier that was
     bought and one that was given. */
  const [subscription, setSubscription] = useState(null);
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    if (!supabase || !user?.id) return undefined;

    let active = true;
    supabase
      .from('subscriptions')
      .select('status, cancel_at_period_end, current_period_end')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setSubscription(data ?? null);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  async function openPortal() {
    setPortalBusy(true);
    setError('');
    try {
      window.location.assign(await openPortalUrl());
    } catch (err) {
      setError(err.message);
      setPortalBusy(false);
    }
  }

  async function saveUsername(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: username.trim() });

    setBusy(false);
    if (upsertError) setError(upsertError.message);
    else setMessage('Display name updated. It will refresh on your next visit.');
  }

  async function changePassword(e) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword('');
    setConfirm('');
    setMessage('Access key changed.');
  }

  return (
    <main className="container page" style={{ maxWidth: 640 }}>
      <h2 className="section-title">
        <span>Account Settings</span>
      </h2>

      {error && <div className="form-error">{error}</div>}
      {message && <div className="form-success">{message}</div>}

      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div className="frame">
          <h3 className="frame-heading">Identity</h3>
          <div className="form-group">
            <span className="form-label">Email</span>
            <p className="muted">{user.email}</p>
          </div>

          {/* What kind of account this is. Read-only on purpose: a tier is
              derived from a subscription by the webhook, or given by hand in
              the SQL editor, and the database refuses it any other way. */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Account</span>
            <p className="tier-line">
              <span className={`tier-badge tier-${tierInfo.id}`}>{tierInfo.label}</span>
              <span className="muted">{tierInfo.blurb}</span>
            </p>
            <SubscriptionLine
              tier={tier}
              subscription={subscription}
              busy={portalBusy}
              onManage={openPortal}
            />
          </div>
        </div>

        <form className="frame" style={{ marginTop: '1.1rem' }} onSubmit={saveUsername}>
          <h3 className="frame-heading">Display Name</h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="thalira_vane"
            />
          </div>
          <button className="btn btn-copper btn-sm" type="submit" disabled={busy}>
            Save Name
          </button>
        </form>
      </div>

      <div className="panel">
        <form className="frame" onSubmit={changePassword}>
          <h3 className="frame-heading">Change Access Key</h3>

          <div className="form-group">
            <label className="form-label" htmlFor="new-password">
              New Password
            </label>
            <input
              className="form-input"
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="confirm-new-password">
              Confirm New Password
            </label>
            <input
              className="form-input"
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button className="btn btn-copper btn-sm" type="submit" disabled={busy}>
            Update Key
          </button>
        </form>
      </div>
    </main>
  );
}

/**
 * What the tier costs and when it next renews, said under the badge.
 *
 * Four things it can say, and the fourth is the one worth building for: a
 * subscription that is `active` and already cancelled. Stripe keeps it running
 * to the end of the period that was paid for, so the account is genuinely
 * Premium and genuinely not renewing, and a page that only knew the tier would
 * promise a renewal that is not coming.
 *
 * Cancelling, changing a card and reading past invoices all happen on Stripe's
 * own portal rather than here. That is not laziness: the fewer pages of ours
 * that touch a payment, the fewer there are to get wrong, and a hosted portal
 * is a cancel button that cannot be made hard to find.
 */
function SubscriptionLine({ tier, subscription, busy, onManage }) {
  if (tier === 'admin') return null;

  if (tier === 'friend') {
    return (
      <p className="muted" style={{ marginTop: '0.6rem', fontSize: '0.88rem' }}>
        Given rather than bought. There is nothing to pay and nothing to cancel.
      </p>
    );
  }

  if (tier !== 'premium') {
    return (
      <p className="muted" style={{ marginTop: '0.6rem', fontSize: '0.88rem' }}>
        <Link to="/premium">See what Premium adds</Link>. Three characters and one campaign are
        yours either way.
      </p>
    );
  }

  const renews = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <p className="muted" style={{ margin: '0 0 0.6rem', fontSize: '0.88rem' }}>
        {subscription?.status === 'past_due' &&
          'The last payment did not go through. Stripe is trying again, and nothing has been taken away in the meantime. '}
        {subscription?.cancel_at_period_end
          ? `Cancelled. Premium runs until ${renews ?? 'the end of the period you have paid for'}.`
          : renews
            ? `Renews on ${renews}.`
            : 'Active.'}
      </p>
      <button type="button" className="btn btn-sm" onClick={onManage} disabled={busy}>
        {busy ? 'Opening…' : 'Manage Subscription'}
      </button>
    </div>
  );
}
