import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import SiteMenu from './SiteMenu.jsx';
import './Header.css';

/**
 * The site bar, which reads the same on every page but two.
 *
 * A character sheet carries its own bar — the tab row, the save light, the share
 * button, the units — and two full bars stacked on top of each other ate the
 * height the sheet's blocks need. So on a sheet this bar is not drawn at all: the
 * burger moves into the sheet's own bar, at the end past the unit toggle, and the
 * wordmark goes with the bar it lived in. Nothing is dropped, only moved.
 *
 * The creation wizard shares that URL and has no bar of its own, so it keeps this
 * one, folded to the wordmark and the burger.
 */
function standsDownFor(pathname) {
  // A campaign page carries the same bar a sheet does, so this one stands
  // down there too.
  return /^\/characters\/[^/]+\/?$/.test(pathname) || /^\/campaigns\/[^/]+\/?$/.test(pathname);
}

/** Folded: the wordmark and the burger, and nothing else. */
function foldsToBurger(pathname) {
  return pathname.startsWith('/characters/');
}

export default function Header() {
  const { user, displayName, signOut, isConfigured } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Close the account dropdown on any outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    navigate('/');
  }

  /* On a sheet this bar stands down. The missing-env banner is the one thing it
     still has to say, because without those keys the sheet under it loads
     nothing and the reason is worth reading. */
  if (standsDownFor(pathname)) {
    return isConfigured ? null : (
      <header className="site-header">
        <ConfigWarning />
      </header>
    );
  }

  const folded = foldsToBurger(pathname);

  return (
    <header className={`site-header${folded ? ' is-folded' : ''}`}>
      <nav className="nav-container">
        <Link to="/" className="nav-brand">
          <img src="/Hazebound-icon.png" alt="" className="nav-logo" />
          <span className="nav-wordmark">Hazebound</span>
        </Link>

        <div className="nav-actions">
          <ul className="nav-links">
            <li>
              <NavLink to="/" className="nav-link" end>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/rules" className="nav-link">
                Rules
              </NavLink>
            </li>
            {/* Characters is a real link signed out as well: the page is the
                characters kept on this device, and the way to make one before
                there is an account. Campaigns stays an account's thing, because
                a table can only seat a saved character. */}
            <li>
              <NavLink to="/dashboard" className="nav-link">
                Characters
              </NavLink>
            </li>
            {user && (
              <li>
                <NavLink to="/campaigns" className="nav-link">
                  Campaigns
                </NavLink>
              </li>
            )}
            {/* Shown to everybody, including accounts that already have it:
                the page is where a subscription is managed as well as where it
                is bought, and a link that disappears once you pay is a link
                people write in asking about. */}
            <li>
              <NavLink to="/premium" className="nav-link">
                Premium
              </NavLink>
            </li>
          </ul>

          {user ? (
            <div className="account-menu" ref={menuRef}>
              <button
                type="button"
                className={`account-badge${menuOpen ? ' active' : ''}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="account-dot" />
                <span className="account-name">{displayName}</span>
                <span className="chevron">▾</span>
              </button>

              {menuOpen && (
                <div className="account-dropdown" role="menu">
                  <Link to="/dashboard" className="dropdown-link" onClick={() => setMenuOpen(false)}>
                    My Characters
                  </Link>
                  <Link to="/campaigns" className="dropdown-link" onClick={() => setMenuOpen(false)}>
                    My Campaigns
                  </Link>
                  <Link to="/account" className="dropdown-link" onClick={() => setMenuOpen(false)}>
                    Account Settings
                  </Link>
                  <Link to="/premium" className="dropdown-link" onClick={() => setMenuOpen(false)}>
                    Premium
                  </Link>
                  <div className="dropdown-divider" />
                  <button type="button" className="dropdown-link logout" onClick={handleSignOut}>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-sm btn-copper">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Everything above collapses into this below 860px — and at every width
            on the creation wizard, which is a sheet without a bar. */}
        <SiteMenu />
      </nav>

      {!isConfigured && <ConfigWarning />}
    </header>
  );
}

/** Said on every page, because nothing on any of them will load without it. */
function ConfigWarning() {
  return (
    <div className="config-warning">
      Supabase is not configured. Copy <code>.env.example</code> to <code>.env.local</code>, add your
      project URL and anon key, then restart <code>npm run dev</code>.
    </div>
  );
}
