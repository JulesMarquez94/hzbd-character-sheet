import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import CreationPathPick from '../components/CreationPathPick.jsx';
import KeepCharacter from '../components/KeepCharacter.jsx';
import Modal from '../components/Modal.jsx';
import PremiumNote from '../components/PremiumNote.jsx';
import { CHARACTER_SLOTS } from '../lib/tiers.js';
import { SkullIcon } from '../components/sheet/parts.jsx';
import {
  adoptCharacter,
  characterSlots,
  createCharacter,
  deleteCharacter,
  listCharacters,
} from '../lib/api.js';
import { creationPath } from '../lib/creationPaths.js';
import {
  LOCAL_CHARACTER_SLOTS,
  isLocalCharacter,
  isLocalId,
  listLocalCharacters,
} from '../lib/localCharacters.js';
import {
  compactNumber,
  formatNumber,
  initialsOf,
  isDead,
  xpProgress,
} from '../lib/characterModel.js';
import './Dashboard.css';

function TalentTag({ talent }) {
  const rank = Math.max(0, Math.min(3, Number(talent.rank) || 0));
  return (
    <span className="tag tag-talent">
      {talent.name}
      <span className="rank-pips" aria-label={`Rank ${rank} of 3`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`pip${i < rank ? ' filled' : ''}`} />
        ))}
      </span>
    </span>
  );
}

/**
 * The whole card opens the sheet, not just the portrait and the name. A link
 * laid over the card does it rather than an onClick, so the sheet still opens
 * in a new tab on a middle click and still reads as a link to a screen reader.
 * The delete button sits above it and is the one thing that is not the link.
 *
 * `onKeep` is handed in for a character kept on this device while somebody is
 * signed in: the one card that has a second thing to do, which is to move into
 * the account. The button paints over the link the way the name does.
 */
function CharacterCard({ character, onDelete, onKeep = null }) {
  const xp = xpProgress(character.xp);
  const dead = isDead(character);
  const local = isLocalCharacter(character);

  return (
    <div className="char-card">
      <Link
        to={`/characters/${character.id}`}
        className="char-card-open"
        aria-label={`Open ${character.name}`}
      />

      <Link to={`/characters/${character.id}`} className="char-portrait">
        {character.portrait_url ? (
          <img src={character.portrait_url} alt="" />
        ) : (
          <span className="portrait-initials">{initialsOf(character.name)}</span>
        )}
      </Link>

      <div className="char-content">
        <div>
          <div className="char-meta-top">
            <h3 className="char-name">
              {dead && (
                <span className="dead-mark" title="Dead" aria-label="Dead">
                  <SkullIcon />
                </span>
              )}
              <Link to={`/characters/${character.id}`}>{character.name}</Link>
            </h3>
            <span className="tag tag-level">LVL {xp.level}</span>
          </div>

          <div className="char-tags">
            {local && (
              <span className="tag tag-muted" title="Saved in this browser only, not in an account">
                This device
              </span>
            )}
            {character.lineage && <span className="tag tag-lineage">{character.lineage}</span>}
            {(character.talents || []).map((talent, idx) => (
              <TalentTag key={`${talent.name}-${idx}`} talent={talent} />
            ))}
          </div>
        </div>

        <div className="char-mini-frame">
          <div className="mini-row">
            <span className="mini-label">XP Pool</span>
            <span className="mini-value" style={{ color: 'var(--focus-cyan)' }}>
              {xp.isMax ? compactNumber(xp.total) : `${compactNumber(xp.into)} / ${compactNumber(xp.span)}`}
            </span>
          </div>
          <div className="xp-track">
            <div className="xp-fill" style={{ width: `${xp.percent}%` }} />
          </div>
        </div>

        <div className="char-mini-frame">
          <div className="mini-row">
            <span className="mini-label">Wealth Balance</span>
            <span className="mini-value" style={{ color: 'var(--stat-coin)' }}>
              {formatNumber(character.wealth)} ¢
            </span>
          </div>
        </div>

        <div className="char-footer">
          {character.blurb && <p className="char-blurb">{character.blurb}</p>}
          {character.campaign && (
            <div className="campaign-chip">
              <span className="campaign-label">Campaign</span>
              <span className="campaign-sep">|</span>
              <span className="campaign-name">{character.campaign}</span>
            </div>
          )}
          {onKeep && (
            <button
              type="button"
              className="btn btn-copper btn-sm char-keep"
              onClick={() => onKeep(character)}
            >
              Save to my account
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        className="btn-delete"
        onClick={() => onDelete(character)}
        aria-label={`Delete ${character.name}`}
      >
        ×
      </button>
    </div>
  );
}

/**
 * What a visitor with no account is told, once, at the top of the page: what
 * they are about to make, where it will live and what it will not be able to
 * do. The two links out carry the way back here.
 */
function DeviceNotice() {
  return (
    <aside className="device-notice">
      <p>
        <b>No account needed to start.</b> A character made here is saved in this browser, on this
        device. It opens on the full sheet and plays exactly as a saved one does.
      </p>
      <p>
        The link opens in no other browser, it cannot sit at a table and clearing this
        browser&rsquo;s data takes it with it. When you want to keep one, create a free account and
        save it there. Everything you have made comes with it.
      </p>
      <div className="device-notice-actions">
        <Link to="/register" state={{ from: '/dashboard' }} className="btn btn-copper btn-sm">
          Create an account
        </Link>
        <Link to="/login" state={{ from: '/dashboard' }} className="btn btn-minimal btn-sm">
          Log in
        </Link>
      </div>
    </aside>
  );
}

export default function Dashboard() {
  const { user, displayName, tier, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  /* The account's shelf, as `{ userId, rows }`: a fetch for one account can
     never be read as another's, and "still loading" is the absence of a fetch
     for the account signed in now rather than a flag set from inside the
     effect that fetches. */
  const [vault, setVault] = useState(null);
  /* The shelf on this device, read once on the way in. Synchronous, because
     localStorage is: there is no loading state to show for it. */
  const [local, setLocal] = useState(() => listLocalCharacters());
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  /* The device character whose move into the account is being offered. */
  const [keeping, setKeeping] = useState(null);
  const [draft, setDraft] = useState({ name: '', campaign: '' });
  /* Which way in they took, and the enlist box's two panes in one value: null
     is the pane that asks, a key is the pane that asks for a name. Nothing is
     written until a path has been taken, so reading what the unbuilt three will
     be and backing out costs nothing and leaves no half-made row behind. */
  const [pathKey, setPathKey] = useState(null);

  const path = pathKey ? creationPath(pathKey) : null;
  const userId = user?.id;

  useEffect(() => {
    /* Wait for the session restore. Deciding "signed out" a moment before the
       stored session arrives would draw the device shelf at somebody who has
       a vault. Signed out there is nothing to fetch: the device shelf was read
       on the way in. */
    if (authLoading || !userId) return undefined;

    let active = true;

    listCharacters(userId)
      .then((rows) => {
        if (!active) return;
        setVault({ userId, rows });
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        /* An empty shelf under the error, rather than the veil for ever. */
        setVault({ userId, rows: [] });
        setError(err.message);
      });

    return () => {
      active = false;
    };
  }, [userId, authLoading]);

  /* Signed out there is no vault at all, whatever a stale fetch may hold. */
  const characters = userId && vault?.userId === userId ? vault.rows : [];
  const loading = authLoading || (Boolean(userId) && vault?.userId !== userId);

  /** One row taken off the account's shelf, after a delete. */
  function dropFromVault(id) {
    setVault((prev) => (prev ? { ...prev, rows: prev.rows.filter((c) => c.id !== id) } : prev));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError('Give your character a name.');
      return;
    }

    try {
      /* A name and a campaign are all this box asks for. Everything else a
         character is made of is a level-1 choice with its own chooser, so the
         row is created blank and the creation pages ask for the rest. With
         nobody signed in the row is kept on this device: see api.js. */
      const created = await createCharacter(userId ?? null, {
        name: draft.name.trim(),
        campaign: draft.campaign.trim(),
      });

      setCreating(false);
      /* The path rides in the URL rather than on the row: it is how you got
         here, not something the character is. See src/lib/creationPaths.js. */
      navigate(`/characters/${created.id}/new?path=${path.key}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    try {
      await deleteCharacter(pendingDelete.id);
      if (isLocalId(pendingDelete.id)) {
        setLocal((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      } else {
        dropFromVault(pendingDelete.id);
      }
      setPendingDelete(null);
    } catch (err) {
      setError(err.message);
      setPendingDelete(null);
    }
  }

  /** The move across, from the card's button. KeepCharacter shows the failure. */
  async function handleKeep() {
    const kept = await adoptCharacter(keeping.id, userId, tier);
    setLocal((prev) => prev.filter((c) => c.id !== keeping.id));
    setVault((prev) => (prev ? { ...prev, rows: [...prev.rows, kept] } : prev));
    setKeeping(null);
  }

  /* Whose shelf the grid shows: the account's when there is one, the device's
     when there is not. Signed in, the device's is a second section below. */
  const mine = user ? characters : local;
  /* The account's ceiling is its tier's; the device's is its own and has
     nothing to do with a tier. See characterSlots in src/lib/tiers.js. */
  const vaultSlots = characterSlots(tier);
  const slots = user ? vaultSlots : LOCAL_CHARACTER_SLOTS;
  const atLimit = mine.length >= slots;
  const vaultFull = characters.length >= vaultSlots;

  return (
    <main className="container container-wide page">
      <h2 className="section-title">
        <span>{user ? <>{displayName}&rsquo;s Characters</> : 'Characters On This Device'}</span>
        <span className="tag tag-muted">
          Character Slots: <span style={{ color: 'var(--copper)', marginLeft: 4 }}>{mine.length}</span>{' '}
          / {slots}
        </span>
      </h2>

      {!authLoading && !user && <DeviceNotice />}

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="loading-veil">Loading your characters…</div>
      ) : (
        <div className="char-grid">
          {mine.map((character) => (
            <CharacterCard key={character.id} character={character} onDelete={setPendingDelete} />
          ))}

          {!atLimit && (
            <button
              type="button"
              className="create-card"
              onClick={() => {
                setPathKey(null);
                setCreating(true);
              }}
            >
              <span className="create-icon">+</span>
              <span className="create-text">Create Character</span>
            </button>
          )}
        </div>
      )}

      {!loading && user && atLimit && (
        <PremiumNote>
          You are using all {slots} of your character slots. Delete one to make room, or keep{' '}
          {CHARACTER_SLOTS.premium} at once.
        </PremiumNote>
      )}

      {!loading && mine.length === 0 && (
        <p className="muted center" style={{ marginTop: '2rem' }}>
          {user
            ? 'No characters yet. Make your first one to begin.'
            : 'Nothing here yet. Make a character and it is saved in this browser until you keep it.'}
        </p>
      )}

      {/* Characters made in this browser before this account signed in. They
          are not the account's until saved to it, so they stand apart from
          the account's own, each with the one button that moves it across. */}
      {user && local.length > 0 && (
        <section className="device-section">
          <h2 className="section-title">
            <span>On This Device</span>
            <span className="tag tag-muted">Not in your account</span>
          </h2>
          <p className="device-lead">
            Made in this browser and saved nowhere else. Save one to your account to keep it, share
            its sheet and sit it at a table. Until then it cannot join a campaign, and clearing the
            browser&rsquo;s data takes it with it.
          </p>
          <div className="char-grid">
            {local.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onDelete={setPendingDelete}
                onKeep={setKeeping}
              />
            ))}
          </div>
        </section>
      )}

      {/* Two panes, and `path` is which one you are on: choose a way in, then
          name them. The cards are first because three of the four are not built
          yet, and finding that out after filling in a form would be worse than
          finding it out before. */}
      {creating && (
        <Modal
          title={path ? 'Name Your Character' : 'Make a Character'}
          onClose={() => setCreating(false)}
          /* Four cards want the roomy measure. A two-field form does not: the
             same form spread over 900px reads worse than it does at 560. */
          wide={!path}
          footer={
            path ? (
              <>
                <button
                  type="button"
                  className="btn btn-minimal btn-sm"
                  onClick={() => setPathKey(null)}
                >
                  Back
                </button>
                <button type="submit" form="create-character" className="btn btn-copper btn-sm">
                  Create
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-minimal btn-sm" onClick={() => setCreating(false)}>
                Cancel
              </button>
            )
          }
        >
          {path ? (
            <form id="create-character" onSubmit={handleCreate}>
              <div className="path-taken" style={{ '--path-accent': path.accent }}>
                <span className="path-taken-label">Path</span>
                <span className="path-taken-name">{path.title}</span>
                <button
                  type="button"
                  className="btn btn-minimal btn-sm"
                  onClick={() => setPathKey(null)}
                >
                  Change
                </button>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-name">
                  Character Name
                </label>
                <input
                  className="form-input"
                  id="new-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Thalira Vane"
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-campaign">
                  Campaign
                </label>
                <input
                  className="form-input"
                  id="new-campaign"
                  value={draft.campaign}
                  onChange={(e) => setDraft({ ...draft, campaign: e.target.value })}
                  placeholder="The Glass Spires"
                />
              </div>

              <p className="form-hint">
                That is all this box needs. Your lineage, background, talent set and attributes are
                level-1 choices with their own choosers, and {path.title} is where you make them.
                {!user && ' The character is saved in this browser until you make an account to keep it.'}
              </p>
            </form>
          ) : (
            <>
              <p className="form-hint path-lead">
                Four ways in, all of them ending on the same sheet. Take whichever suits how you
                like to make a character.
              </p>

              <CreationPathPick onPick={setPathKey} />

              <p className="form-hint path-foot">
                Only the free hand is built today. The other three are on their way.
              </p>
            </>
          )}
        </Modal>
      )}

      {pendingDelete && (
        <Modal
          title="Delete Character"
          onClose={() => setPendingDelete(null)}
          footer={
            <>
              <button type="button" className="btn btn-minimal btn-sm" onClick={() => setPendingDelete(null)}>
                Keep
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
                Delete Permanently
              </button>
            </>
          }
        >
          <p>
            Delete <strong>{pendingDelete.name}</strong>? Their abilities, inventory and lore go with them.
            This cannot be undone.
          </p>
        </Modal>
      )}

      {keeping && (
        <KeepCharacter
          character={keeping}
          onClose={() => setKeeping(null)}
          onAdopt={handleKeep}
          full={vaultFull}
          from="/dashboard"
        />
      )}
    </main>
  );
}
