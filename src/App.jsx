import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { DiceTrayProvider } from './components/DiceTray.jsx';
import Header from './components/Header.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { isLocalId } from './lib/localCharacters.js';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';

// The sheet and the rules are most of the bundle. Loading them on demand keeps
// the public pages light: a visitor on the landing page never downloads them.
// The rules page is public and reads the whole codex, so it is the one lazy
// route a signed-out visitor is most likely to take.
const Rules = lazy(() => import('./pages/Rules.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const CharacterSheet = lazy(() => import('./pages/CharacterSheet.jsx'));
const Account = lazy(() => import('./pages/Account.jsx'));
const Premium = lazy(() => import('./pages/Premium.jsx'));
const Campaigns = lazy(() => import('./pages/Campaigns.jsx'));
const CampaignPage = lazy(() => import('./pages/CampaignPage.jsx'));
const Legal = lazy(() => import('./pages/Legal.jsx'));

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

/**
 * The creation screen, behind the login gate for a database row and open for
 * a device-only one. A character kept on this device belongs to whoever is
 * holding the device, so asking them to sign in first would be asking for the
 * one thing the feature exists to postpone. See src/lib/localCharacters.js.
 */
function NewSheetRoute() {
  const { id } = useParams();
  if (isLocalId(id)) return <CharacterSheet key={id} creating />;
  return (
    <ProtectedRoute>
      <CharacterSheet key={id} creating />
    </ProtectedRoute>
  );
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
        {/* Above the router, because a roll does not belong to the character
            sheet. You roll on the campaign page while somebody else is taking
            their turn, and on the codex in the middle of an argument. */}
        <DiceTrayProvider>
        <Header />

        <Suspense fallback={<div className="loading-veil">Unrolling the sheet…</div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Signup />} />
            {/* The rules, and the shelf you are on in the URL: `/rules/cards`
                is a link into the card codex rather than into the top of a
                page. */}
            <Route path="/rules" element={<Rules />} />
            <Route path="/rules/:section" element={<Rules />} />
            {/* Where the rules used to live. Links to it are out in the world
                and there is nothing at the old address any more. */}
            <Route path="/codex" element={<Navigate to="/rules" replace />} />

            {/* The shop window, and open to everybody on purpose: somebody has
                to be able to read what a subscription buys before deciding
                whether to make an account. Stripe sends the player back here
                after a checkout, with the session on the query string. */}
            <Route path="/premium" element={<Premium />} />

            {/* The three documents behind the money. Public, uncached by any
                auth check, and reachable from the footer of every page that
                sells anything — Stripe and the card networks both require a
                cardholder to be able to read them before and after paying. */}
            <Route path="/terms" element={<Legal page="terms" />} />
            <Route path="/privacy" element={<Legal page="privacy" />} />
            <Route path="/refunds" element={<Legal page="refunds" />} />

            {/* Open to everybody. Signed in it is your account's characters;
                signed out it is the ones kept on this device, and the way to
                make one without an account. The page tells the two apart. */}
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Public: anyone with the link can read a sheet. Editing is gated
                inside the component (and by RLS). */}
            <Route path="/characters/:id" element={<SheetRoute />} />
            {/* The same sheet with the tabs off: level-1 choices, then lore. */}
            <Route path="/characters/:id/new" element={<NewSheetRoute />} />
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
        </DiceTrayProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
