import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import { getCharacter, updateCharacter } from '../lib/api.js';
import {
  levelForXp,
  liveCharacter,
  normalizeGridColumns,
  syncDerived,
} from '../lib/characterModel.js';
import { openChoices, pruneToLevel } from '../lib/levelPicks.js';
import { subscribeToTable } from '../lib/realtime.js';
import { UnitContext } from '../context/units.js';
import SiteMenu from '../components/SiteMenu.jsx';
import CharacterTab from '../components/sheet/CharacterTab.jsx';
import AbilitiesTab from '../components/sheet/AbilitiesTab.jsx';
import InventoryTab from '../components/sheet/InventoryTab.jsx';
import LoreTab from '../components/sheet/LoreTab.jsx';
import AdvancementTab from '../components/sheet/AdvancementTab.jsx';
import CreationWizard from '../components/sheet/CreationWizard.jsx';
import '../components/sheet/sheet.css';

const TABS = ['Character', 'Abilities', 'Inventory', 'Lore', 'Advancement'];

/* Which column holds the canvas width of each tab that has a grid. Lore and
   Advancement are not grids, so they are not in the table and fall back to the
   three columns everything on the site was drawn for. */
const GRID_COLUMNS = {
  Character: 'block_columns',
  Abilities: 'ability_columns',
  Inventory: 'inventory_columns',
};

/* The two ways a distance can be written, and what each one writes it in. The
   note is there because the switch is nowhere near the numbers it changes:
   opening the menu should say what it is about to do to them. */
const UNITS = [
  { id: 'metric', label: 'Metric', note: 'Metres' },
  { id: 'imperial', label: 'Imperial', note: 'Feet' },
];

/** localStorage can throw where site data is blocked; a preference is not
    worth a white screen. */
function readStoredUnit() {
  try {
    return localStorage.getItem('hzbd-unit') || 'metric';
  } catch {
    return 'metric';
  }
}

/**
 * `creating` is the same sheet with the tabs taken off: a row made a moment ago
 * on the dashboard, walked through its level-1 choices and then its lore. It is
 * this component rather than a page of its own so that loading, autosave and
 * the permission rules are the ones already written here.
 */
export default function CharacterSheet({ creating = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Character');
  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const [unit, setUnit] = useState(readStoredUnit);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [copied, setCopied] = useState(false);
  const [unitMenuOpen, setUnitMenuOpen] = useState(false);
  const tabMenuRef = useRef(null);
  const unitMenuRef = useRef(null);

  // Pending edits are batched so dragging a pip doesn't fire a write per frame.
  const pendingRef = useRef({});
  const timerRef = useRef(null);
  // Writes leave one at a time: two in flight on a slow link could arrive
  // reversed and leave the row on the older value.
  const flightRef = useRef(Promise.resolve());
  // Lets the load effect schedule a flush without depending on `flush` itself,
  // which would re-fetch the character every time the callback is rebuilt.
  const flushRef = useRef(() => {});

  /* The session object is replaced on every token refresh, which happens on a
     timer. Keying the load on the id keeps an hourly refresh from re-fetching
     the row and overwriting edits that have not flushed yet. */
  const userId = user?.id;

  useEffect(() => {
    // Wait for the session restore: fetching with `user` still null would run
    // the load twice and skip the owner-only repairs on the first pass.
    if (authLoading) return undefined;

    let active = true;

    getCharacter(id)
      .then((data) => {
        if (!active) return;

        // A row saved before the current derived-stat rules — or one whose
        // attributes moved elsewhere — is brought back in line on open. Only
        // the owner or an admin may write it, so a viewer just reads the row
        // as stored.
        const editable = Boolean(userId && (userId === data.user_id || isAdmin));

        /* A row still holding choices above the level it now stands at:
           experience lost before this rule existed, or a level typed straight
           into the database. What the level bought goes with the level, and it
           goes first, because the attributes it hands back are what the derived
           numbers are then computed from. */
        const cut = editable ? pruneToLevel(data, levelForXp(data.xp)) : null;
        const pruned = cut ? { ...data, ...cut.patch } : data;

        const derived = editable ? syncDerived(pruned) : null;
        const corrections =
          cut || derived ? { ...(cut?.patch ?? {}), ...(derived ?? {}) } : null;

        setCharacter(corrections ? { ...data, ...corrections } : data);
        setError('');

        if (corrections) {
          pendingRef.current = { ...pendingRef.current, ...corrections };
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => flushRef.current(), 700);
        }
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id, userId, isAdmin, authLoading]);

  useEffect(() => {
    try {
      localStorage.setItem('hzbd-unit', unit);
    } catch {
      // Blocked storage just means the preference does not survive a reload.
    }
  }, [unit]);

  // The sheet owns the whole viewport: six blocks that hold their size instead
  // of pushing the page into a scroll.
  useEffect(() => {
    document.body.classList.add('sheet-fixed');
    return () => document.body.classList.remove('sheet-fixed');
  }, []);

  // Close the mobile tab drawer on an outside click or Escape.
  useEffect(() => {
    if (!tabMenuOpen) return undefined;

    function onPointerDown(e) {
      if (tabMenuRef.current && !tabMenuRef.current.contains(e.target)) setTabMenuOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setTabMenuOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [tabMenuOpen]);

  /* And the same for the units menu. The site's one dropdown idiom, written a
     fourth time rather than shared: see SiteMenu.jsx and Header.jsx, which is
     where the other two live. */
  useEffect(() => {
    if (!unitMenuOpen) return undefined;

    function onPointerDown(e) {
      if (unitMenuRef.current && !unitMenuRef.current.contains(e.target)) setUnitMenuOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setUnitMenuOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [unitMenuOpen]);

  const flush = useCallback(async () => {
    const patch = pendingRef.current;
    pendingRef.current = {};
    if (Object.keys(patch).length === 0) return;

    setSaveState('saving');
    const write = flightRef.current.then(() => updateCharacter(id, patch));
    flightRef.current = write.catch(() => {});
    try {
      await write;
      setSaveState('saved');
      setError('');
    } catch (err) {
      // Put the failed fields back so the next flush retries them. Anything
      // edited while the write was in flight wins over the failed value.
      pendingRef.current = { ...patch, ...pendingRef.current };
      setSaveState('error');
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  // Owner or admin. RLS enforces the same rule server-side; this only decides
  // which controls are rendered.
  const canEdit = Boolean(character && user && (user.id === character.user_id || isAdmin));

  /** Optimistic local update + debounced persistence. No-op for viewers. */
  const patch = useCallback(
    (partial) => {
      if (!canEdit || !character) return;

      // Health max, Defense, Initiative, Speed and the rest are owned by the
      // attribute maths rather than typed in, so raising Physique on the
      // Advancement tab carries its consequences in the very same write.
      const corrections = syncDerived({ ...character, ...partial });
      const full = corrections ? { ...partial, ...corrections } : partial;

      setCharacter((prev) => (prev ? { ...prev, ...full } : prev));
      pendingRef.current = { ...pendingRef.current, ...full };

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 700);
    },
    [flush, canEdit, character]
  );

  // Never lose the last keystrokes when navigating away.
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      if (Object.keys(pendingRef.current).length > 0) flush();
    };
  }, [flush]);

  // Live updates, viewers only. Editors stay authoritative over their own
  // screen — applying remote rows mid-edit is what would overwrite text
  // someone is still typing.
  useEffect(() => {
    if (canEdit) return undefined;

    // A reconnect refetch races the change events; never let an older row
    // land on top of a newer one.
    const applyIfNewer = (row) =>
      setCharacter((prev) =>
        prev?.updated_at && row?.updated_at && String(row.updated_at) < String(prev.updated_at)
          ? prev
          : row
      );

    return subscribeToTable({
      table: 'characters',
      filter: `id=eq.${id}`,
      onChange: (payload) => {
        if (payload.eventType === 'DELETE') return;
        applyIfNewer(payload.new);
      },
      onResync: () => {
        getCharacter(id)
          .then(applyIfNewer)
          .catch(() => {});
      },
    });
  }, [id, canEdit]);

  /* Choices the character has reached but not spent — a talent set, a skill, an
     attribute point, a question a lineage card asked. The Advancement tab is the
     only place any of them can be made, and it is also the tab nobody opens
     unless something sends them there, so the count rides on the tab itself. A
     reader who cannot edit is told nothing: it would be a nag about somebody
     else's character.

     Derived up here rather than below with the rest of the labels, because a
     hook cannot live after the early returns. */
  const waiting = useMemo(
    () => (canEdit && character ? openChoices(character, levelForXp(character.xp)) : 0),
    [canEdit, character]
  );

  /* The character as the sheet should be *read*, which is not always the row as
     it is stored: an Enchanter's enchantments raise an attribute, and everything
     that attribute buys, without any of it being written down. See liveCharacter.

     Handed to the three tabs that print numbers and cards. **Not** to Advancement,
     which is where the attribute columns are decided and which must go on seeing
     what the ledger actually bought. Writing is unaffected either way: `patch`
     closes over the stored row, never this one. */
  const shown = useMemo(() => liveCharacter(character), [character]);

  if (loading) return <div className="loading-veil">Unrolling the sheet…</div>;

  if (error && !character) {
    return (
      <main className="container page">
        <div className="empty-state">
          <h2 style={{ marginBottom: '0.75rem' }}>Sheet Unavailable</h2>
          <p>{error}</p>
          <Link to="/dashboard" className="btn btn-minimal btn-sm" style={{ marginTop: '1.5rem' }}>
            Back to Vault
          </Link>
        </div>
      </main>
    );
  }

  const saveLabel = {
    idle: '',
    saving: 'Saving…',
    saved: 'All changes saved',
    error: 'Save failed',
  }[saveState];

  /* The same news as a sentence, for the tooltip and the phone. */
  const waitingSays =
    waiting === 1 ? 'One choice is waiting on you' : `${waiting} choices are waiting on you`;

  /* Someone following the creation link to a sheet that is not theirs gets the
     sheet, not a set of choosers that would refuse to write anything. */
  if (creating && canEdit) {
    return (
      <UnitContext.Provider value={unit}>
      <div className="sheet">
        <main className="sheet-canvas">
          {error && <div className="form-error">{error}</div>}
          <CreationWizard
            character={character}
            patch={patch}
            unit={unit}
            onDone={async () => {
              /* The sheet route remounts this component and refetches the row,
                 so the last edits must be on the server before we go — a
                 fire-and-forget flush can lose the race against that fetch. */
              clearTimeout(timerRef.current);
              await flush();
              navigate(`/characters/${id}`);
            }}
          />
        </main>
      </div>
      </UnitContext.Provider>
    );
  }

  /* How many columns the tab on screen lays its blocks out in. It is set up
     here rather than inside the tab because more than the grid is measured
     against it: the canvas the grid sits in, the bar of tabs above that, and
     every overview line that has to begin and end on a block edge. A tab with
     no grid leaves it at three, which is what all of those were before any of
     it was a choice. See normalizeGridColumns, and `--sheet-fit` in sheet.css
     for the clamp that keeps a nine-column canvas off a phone.

     The attribute is the same number again, for the one rule that cannot be
     written as arithmetic: a row-wide block has nothing to span when the canvas
     is a single column. */
  const canvasColumns = normalizeGridColumns(character[GRID_COLUMNS[tab]]);

  return (
    <UnitContext.Provider value={unit}>
    <div className="sheet" style={{ '--sheet-cols': canvasColumns }} data-columns={canvasColumns}>
      <div className="sheet-tabbar">
        <div className="sheet-tabbar-inner">
          <nav className="sheet-tabs">
            {TABS.map((name) => (
              <button
                key={name}
                type="button"
                className={`sheet-tab${tab === name ? ' active' : ''}`}
                onClick={() => setTab(name)}
              >
                {name}
                {name === 'Advancement' && waiting > 0 && (
                  <span className="tab-badge" title={waitingSays}>
                    {waiting}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Below 820px the tab row and its controls collapse into this. */}
          <div className="sheet-burger-wrap" ref={tabMenuRef}>
            <button
              type="button"
              className={`sheet-burger${tabMenuOpen ? ' open' : ''}`}
              aria-expanded={tabMenuOpen}
              onClick={() => setTabMenuOpen((open) => !open)}
              title={waiting > 0 ? waitingSays : undefined}
            >
              <span className="sheet-burger-label">{tab}</span>
              {/* Folded away, the badge on the Advancement row goes with it, so
                  the closed burger carries the dot instead. */}
              {waiting > 0 && tab !== 'Advancement' && (
                <span className="tab-dot" aria-label={waitingSays} />
              )}
              <span className="burger" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>

            {tabMenuOpen && (
              <div className="sheet-drawer" role="menu">
                {TABS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`dropdown-link${tab === name ? ' active' : ''}`}
                    onClick={() => {
                      setTab(name);
                      setTabMenuOpen(false);
                    }}
                  >
                    {name}
                    {name === 'Advancement' && waiting > 0 && (
                      <span className="tab-badge" title={waitingSays}>
                        {waiting}
                      </span>
                    )}
                  </button>
                ))}

                <div className="dropdown-divider" />

                <button
                  type="button"
                  className="dropdown-link"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                >
                  {copied ? 'Link copied' : 'Share sheet'}
                </button>

                <button
                  type="button"
                  className="dropdown-link"
                  onClick={() => setUnit(unit === 'metric' ? 'imperial' : 'metric')}
                >
                  Units: {unit === 'metric' ? 'Metric' : 'Imperial'}
                </button>
              </div>
            )}
          </div>

          <div className="sheet-tabbar-right">
            {!canEdit && (
              <span className="view-badge live" title="Viewing live · changes appear without reloading">
                <span className="live-dot" />
                Live View
              </span>
            )}
            {isAdmin && character.user_id !== user?.id && (
              <span className="admin-badge">Admin Edit</span>
            )}
            {/* The light and nothing else. "All changes saved" spelled out was
                twenty characters of bar spent saying what a green dot says on
                its own, and the bar has four other things to fit. The sentence
                is still here — it is the tooltip and the label a screen reader
                reads — and a failure never rests on the colour alone: the same
                catch that turns this red writes the error across the top of the
                canvas below. */}
            {canEdit && saveLabel && (
              <span
                className={`save-indicator save-${saveState}`}
                role="img"
                aria-label={saveLabel}
                title={saveLabel}
              >
                <span className="save-dot" />
              </span>
            )}

            <button
              type="button"
              className="btn btn-minimal btn-sm"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
            >
              {copied ? 'Link copied' : 'Share'}
            </button>

            {/* Units, behind one button. Both words used to stand on the bar
                side by side, which is a hundred and fifty pixels spent on a
                choice made once and then never again — and the bar is the one
                strip on the sheet with five things competing for it. Closed, it
                says which one is on; open, it is the site's own dropdown, the
                same one the account menu and the nav wear. */}
            <div className="unit-menu-wrap" ref={unitMenuRef}>
              <button
                type="button"
                className={`unit-menu${unitMenuOpen ? ' active' : ''}`}
                aria-haspopup="menu"
                aria-expanded={unitMenuOpen}
                title="Which units movement is written in"
                onClick={() => setUnitMenuOpen((open) => !open)}
              >
                <span className="unit-menu-label">
                  {unit === 'metric' ? 'Metric' : 'Imperial'}
                </span>
                <span className="chevron">▾</span>
              </button>

              {unitMenuOpen && (
                <div className="unit-drawer" role="menu">
                  {UNITS.map(({ id, label, note }) => (
                    <button
                      key={id}
                      type="button"
                      className={`dropdown-link${unit === id ? ' active' : ''}`}
                      onClick={() => {
                        setUnit(id);
                        setUnitMenuOpen(false);
                      }}
                    >
                      {label}
                      <span className="unit-drawer-note">{note}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* The site nav, which has no bar of its own here: a sheet gets this
                bar and nothing above it, so the way off the sheet is the last
                thing on it. See SiteMenu.jsx and standsDownFor in Header.jsx. */}
            <SiteMenu />
          </div>
        </div>
      </div>

      <main className="sheet-canvas">
        {error && <div className="form-error">{error}</div>}

        {tab === 'Character' && (
          <CharacterTab character={shown} patch={patch} readOnly={!canEdit} unit={unit} />
        )}
        {tab === 'Abilities' && (
          <AbilitiesTab character={shown} patch={patch} readOnly={!canEdit} />
        )}
        {tab === 'Inventory' && (
          <InventoryTab character={shown} patch={patch} readOnly={!canEdit} />
        )}
        {tab === 'Lore' && <LoreTab character={character} patch={patch} readOnly={!canEdit} />}
        {tab === 'Advancement' && (
          <AdvancementTab character={character} patch={patch} readOnly={!canEdit} unit={unit} />
        )}
      </main>
    </div>
    </UnitContext.Provider>
  );
}
