import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import './Header.css';

/**
 * The whole site nav, put away behind one button.
 *
 * It is the phone's menu below 860px, where the site bar has no room for links.
 * On a character sheet it is the menu at *every* width, and it does not sit in the
 * site bar at all: the sheet carries a bar of its own — the tab row, the save
 * light, the units — and the site bar above it is not drawn, so this button rides
 * at the end of the sheet's bar instead, past the unit toggle.
 *
 * Which is why it is a component rather than markup inside the header. Two bars
 * open the same drawer, and in both it closes on an outside click or on Escape.
 */
export default function SiteMenu() {
  const { user, displayName, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate('/');
  }

  return (
    <div className="nav-burger-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`burger${open ? ' open' : ''}`}
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="nav-drawer" role="menu" onClick={() => setOpen(false)}>
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
              <NavLink to="/campaigns" className="dropdown-link">
                My Campaigns
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
  );
}
