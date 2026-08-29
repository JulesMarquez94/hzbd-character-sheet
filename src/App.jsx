import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Header from './components/Header.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';

// The sheet and its codex are most of the bundle. Loading them on demand keeps
// the public pages light: a visitor on the landing page never downloads them.
const Codex = lazy(() => import('./pages/Codex.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const CharacterSheet = lazy(() => import('./pages/CharacterSheet.jsx'));
const Account = lazy(() => import('./pages/Account.jsx'));
const Campaigns = lazy(() => import('./pages/Campaigns.jsx'));
const CampaignPage = lazy(() => import('./pages/CampaignPage.jsx'));

/**
 * The router keeps one mounted element across `/characters/A` ->
 * `/characters/B`, which would leave A's sheet — pending autosaves, fold
 * state, the lot — live under B's URL while B loads, and let a stray click
 * write A's numbers onto B's row. Keying by id remounts the sheet fresh for
 * every character.
 */
function SheetRoute(props) {
  const { id } = useParams();
  return <CharacterSheet key={id} {...props} />;
}

/** Keyed by id for the same reason the sheet is: a campaign's pending saves
    must never survive into another campaign's URL. */
function CampaignRoute() {
  const { id } = useParams();
  return <CampaignPage key={id} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />

        <Suspense fallback={<div className="loading-veil">Unrolling the sheet…</div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Signup />} />
            <Route path="/codex" element={<Codex />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* Public: anyone with the link can read a sheet. Editing is gated
                inside the component (and by RLS). */}
            <Route path="/characters/:id" element={<SheetRoute />} />
            {/* The same sheet with the tabs off: level-1 choices, then lore. */}
            <Route
              path="/characters/:id/new"
              element={
                <ProtectedRoute>
                  <SheetRoute creating />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns"
              element={
                <ProtectedRoute>
                  <Campaigns />
                </ProtectedRoute>
              }
            />
            {/* Readable by the campaign's table only — RLS decides, the page
                just reports. Behind the login gate because a signed-out reader
                could never be on the table. */}
            <Route
              path="/campaigns/:id"
              element={
                <ProtectedRoute>
                  <CampaignRoute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
