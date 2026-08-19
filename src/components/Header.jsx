import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import './Header.css';

export default function Header() {
  const { user, displayName, signOut, isConfigured } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef(null);
  const navRef = useRef(null);
  const navigate = useNavigate();

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

  // Same treatment for the mobile burger drawer.
  useEffect(() => {
    if (!navOpen) return;

    function onPointerDown(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setNavOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setNavOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [navOpen]);

  async function handleSignOut() {
    setMenuOpen(false);
    setNavOpen(false);
    await signOut();
    navigate('/');
  }

  return (
    <header className="site-header">
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

        {/* Everything above collapses into this below 860px. */}
        <div className="nav-burger-wrap" ref={navRef}>
          <button
            type="button"
            className={`burger${navOpen ? ' open' : ''}`}
            aria-label="Menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          {navOpen && (
            <div className="nav-drawer" role="menu" onClick={() => setNavOpen(false)}>
              {user && (
                <div className="drawer-identity">
                  <span className="account-dot" />
                  {displayName}
                </div>
              )}

              <NavLink to="/" className="dropdown-link" end>
                Home
              </NavLink>
              <NavLink to="/codex" className="dropdown-link">
                Codex
              </NavLink>

              {user ? (
                <>
                  <NavLink to="/dashboard" className="dropdown-link">
                    My Characters
                  </NavLink>
                  <NavLink to="/account" className="dropdown-link">
                    Account Settings
                  </NavLink>
                  <div className="dropdown-divider" />
                  <button type="button" className="dropdown-link logout" onClick={handleSignOut}>
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <div className="dropdown-divider" />
                  <Link to="/login" className="dropdown-link">
                    Log In
                  </Link>
                  <Link to="/register" className="dropdown-link accent">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {!isConfigured && (
        <div className="config-warning">
          Supabase is not configured — copy <code>.env.example</code> to <code>.env.local</code>, add your
          project URL and anon key, then restart <code>npm run dev</code>.
        </div>
      )}
    </header>
  );
}
