import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';

/**
 * Gate for the account pages: campaigns, account settings and the creation
 * screen of a database character. Sends signed-out visitors to /login and
 * remembers where they were headed so login can bounce them back. The
 * dashboard is not behind it any more: signed out, it is the characters kept
 * on this device. See src/lib/localCharacters.js.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading, isConfigured } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-veil">Loading…</div>;
  }

  if (!isConfigured) {
    return (
      <main className="container page">
        <div className="empty-state">
          <h2 style={{ marginBottom: '0.75rem' }}>Connection Required</h2>
          <p>
            This page needs a Supabase connection. Add <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code>, then restart the dev server.
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
