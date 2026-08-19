import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import './auth.css';

export default function Signup() {
  const { signUp, user, isConfigured } = useAuth();

  const [form, setForm] = useState({
    username: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    if (form.username.trim().length < 3) return 'Username must be at least 3 characters.';
    if (form.email.trim() !== form.confirmEmail.trim()) return 'Email addresses do not match.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!form.terms) return 'You must accept the Terms of Service to continue.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError('');
    setBusy(true);

    const { data, error: signUpError } = await signUp({
      email: form.email.trim(),
      password: form.password,
      username: form.username.trim(),
    });

    setBusy(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // With email confirmation on, there is no session yet — show the check-inbox state.
    if (!data.session) {
      setSentTo(form.email.trim());
    }
  }

  if (sentTo) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <img src="/Hazebound-icon.png" alt="" className="auth-logo" />
            <h1>Confirm Your Email</h1>
            <p>Verification Link Sent</p>
          </div>

          <div className="confirm-state">
            <div className="confirm-badge">✓</div>
            <p>
              We have sent a verification email to
              <br />
              <span className="confirm-email">{sentTo}</span>
            </p>
            <p className="muted">
              Click the link in that email to activate your account, then return here to log in.
            </p>
          </div>

          <div className="auth-footer">
            Back to{' '}
            <Link className="link" to="/login">
              Log In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/Hazebound-icon.png" alt="" className="auth-logo" />
          <h1>Hazebound</h1>
          <p>Create Your Account</p>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              className="form-input"
              id="username"
              type="text"
              autoComplete="nickname"
              placeholder="Choose a username"
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">
              Email Address
            </label>
            <input
              className="form-input"
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-email">
              Confirm Email Address
            </label>
            <input
              className="form-input"
              id="confirm-email"
              type="email"
              placeholder="Re-enter email address"
              value={form.confirmEmail}
              onChange={(e) => update('confirmEmail', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">
              Password
            </label>
            <input
              className="form-input"
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              className="form-input"
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              required
            />
          </div>

          <label className="terms-row">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => update('terms', e.target.checked)}
            />
            <span>
              I agree to the <a className="link" href="#terms">Terms of Service</a> and{' '}
              <a className="link" href="#privacy">Privacy Policy</a>.
            </span>
          </label>

          <button className="btn btn-copper btn-block" type="submit" disabled={busy || !isConfigured}>
            {busy ? 'Enlisting…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link className="link" to="/login">
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
