import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import './auth.css';

export default function Login() {
  const { signIn, resetPassword, user, isConfigured, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // While the stored session restores, showing the form would only flash it
  // at someone about to be redirected.
  if (loading) return null;

  if (user) {
    return <Navigate to={location.state?.from || '/dashboard'} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);

    const { error: signInError } = await signIn({ email: email.trim(), password });

    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate(location.state?.from || '/dashboard', { replace: true });
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address first, then press "Lost Key?".');
      return;
    }
    setError('');
    const { error: resetError } = await resetPassword(email.trim());
    if (resetError) setError(resetError.message);
    else setNotice(`Recovery link sent to ${email.trim()}.`);
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/Hazebound-icon.png" alt="" className="auth-logo" />
          <h1>Hazebound</h1>
          <p>Aetheric Engine Portal</p>
        </div>

        {error && <div className="form-error">{error}</div>}
        {notice && <div className="form-success">{notice}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Account Email
            </label>
            <input
              className="form-input"
              type="email"
              id="email"
              autoComplete="username"
              placeholder="thalira@aethernet.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Secure Access Key
            </label>
            <input
              className="form-input"
              type="password"
              id="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-options">
            <button type="button" className="link link-button" onClick={handleForgotPassword}>
              Lost Key?
            </button>
          </div>

          <button className="btn btn-copper btn-block" type="submit" disabled={busy || !isConfigured}>
            {busy ? 'Initializing…' : 'Initialize Link'}
          </button>
        </form>

        <div className="auth-footer">
          New to the Haze?{' '}
          <Link className="link" to="/register">
            Enlist a Character
          </Link>
        </div>
      </div>
    </main>
  );
}
