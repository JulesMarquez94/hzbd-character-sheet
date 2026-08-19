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
  return /^\/characters\/[^/]+\/?$/.test(pathname);
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
              <NavLink to="/codex" className="nav-link">
                Codex
              </NavLink>
            </li>
            {user ? (
              <li>
                <NavLink to="/dashboard" className="nav-link">
                  Characters
                </NavLink>
              </li>
            ) : (
              <li>
                <span className="nav-link nav-link-locked" title="Sign in to open your character vault">
                  Characters <span className="lock-badge">Requires Auth</span>
                </span>
              </li>
            )}
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
                  <Link to="/account" className="dropdown-link" onClick={() => setMenuOpen(false)}>
                    Account Settings
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
      Supabase is not configured — copy <code>.env.example</code> to <code>.env.local</code>, add your
      project URL and anon key, then restart <code>npm run dev</code>.
    </div>
  );
}
