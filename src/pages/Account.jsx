import { useState } from 'react';
import { useAuth } from '../context/auth-context.js';
import { supabase } from '../lib/supabaseClient.js';

export default function Account() {
  const { user, profile, displayName, tierInfo } = useAuth();

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

          {/* What kind of account this is. Read-only on purpose: a tier is set
              by an admin, and the database refuses it any other way. */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Account</span>
            <p className="tier-line">
              <span className={`tier-badge tier-${tierInfo.id}`}>{tierInfo.label}</span>
              <span className="muted">{tierInfo.blurb}</span>
            </p>
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
