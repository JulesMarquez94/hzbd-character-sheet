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
  updateCharacter,
} from '../lib/api.js';
import { getCampaign, joinCampaign } from '../lib/campaigns.js';
import { attributeLabel } from '../lib/attributes.js';
import { creationPath } from '../lib/creationPaths.js';
import {
  RING_CHOICES,
  STARTING_LEVEL_MIN,
  clampStartingLevel,
  grantsRing,
  startingGrants,
  startingLevels,
  startingPatch,
} from '../lib/startingLevel.js';
import { standing } from '../lib/walkthrough.js';
import {
  LOCAL_CHARACTER_SLOTS,
  isLocalCharacter,
  isLocalId,
  listLocalCharacters,
} from '../lib/localCharacters.js';
import {
  BLANK_CHARACTER,
  compactNumber,
  formatNumber,
  initialsOf,
  isDead,
  xpProgress,
} from '../lib/characterModel.js';
import './Dashboard.css';
import { viewUrl } from '../lib/imageViews.js';

/* What the enlist box asks for, empty. The level and the ring only matter to
   the Free Hand, which is the way in for a character above level 1. */
const EMPTY_DRAFT = { name: '', code: '', level: STARTING_LEVEL_MIN, ring: '' };

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
 *
 * `onResume` is the other second thing a card can have to do. A character left
 * part-way through the Walkthrough carries the step it stopped at on its row
 * (see src/lib/walkthrough.js), and the card says so and offers the way back.
 * The link across the card still opens the sheet, because a half-made character
 * is a whole sheet with some choices waiting on its Advancement tab.
 */
function CharacterCard({ character, onDelete, onKeep = null, onResume = null }) {
  const xp = xpProgress(character.xp);
  const dead = isDead(character);
  const local = isLocalCharacter(character);
  const resume = standing(character);

  return (
    <div className="char-card">
      <Link
        to={`/characters/${character.id}`}
        className="char-card-open"
        aria-label={`Open ${character.name}`}
      />

      <Link to={`/characters/${character.id}`} className="char-portrait">
        {character.portrait_url ? (
          <img src={viewUrl(character.portrait_url, 'portrait')} alt="" />
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
            {resume && (
              <span
                className="tag tag-muted"
                title={`Part-way through the ${resume.title}, on step ${resume.index + 1} of ${resume.total}: ${resume.step.title}`}
              >
                {resume.title} · {resume.index + 1} of {resume.total}
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
          {resume && onResume && (
            <button
              type="button"
              className="btn btn-copper btn-sm char-keep char-resume"
              onClick={() => onResume(character, resume)}
              title={`Back to step ${resume.index + 1}: ${resume.step.title}`}
            >
              Continue the {resume.title}
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
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  /* What went wrong inside the enlist box, shown inside it: the page's own
     error line is behind the dialog while the box is up. */
  const [boxError, setBoxError] = useState('');
  /* Which way in they took, and the enlist box's two panes in one value: null
     is the pane that asks, a key is the pane that asks for a name. Nothing is
     written until a path has been taken, so reading what the unbuilt three will
     be and backing out costs nothing and leaves no half-made row behind. */
  const [pathKey, setPathKey] = useState(null);

  const path = pathKey ? creationPath(pathKey) : null;
  /* The level the Free Hand starts at. Every other path makes a level 1. */
  const level = path?.asksLevel ? clampStartingLevel(draft.level) : 1;
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
    const name = draft.name.trim();
    if (!name) {
      setBoxError('Give your character a name.');
      return;
    }
    /* The ring is the one grant that is a choice, and the level that hands it
       over does not go through without it. */
    if (path.asksLevel && grantsRing(level) && !draft.ring) {
      setBoxError('Choose the ring: Physique, Instinct or Mind.');
      return;
    }
    const code = user ? draft.code.trim() : '';

    try {
      /* A name, a way in and, for the Free Hand, a level: that is all this box
         asks for. Everything else a character is made of is a choice with its
         own chooser on the creation pages. A start above level 1 writes what
         the levels hand over onto the blank before the row exists (see
         src/lib/startingLevel.js). With nobody signed in the row is kept on
         this device: see api.js. */
      const start = path.asksLevel ? startingPatch(BLANK_CHARACTER, level, { ring: draft.ring }) : {};
      const created = await createCharacter(userId ?? null, { ...start, name });

      /* The campaign is a join code, and redeeming it is the link. A code
         nothing answers to takes the row back with it: a character made on a
         mistyped code would be a character at no table, which is not what was
         asked for, and the box stays open for a second try. The campaign's
         name goes into the old text column afterwards, for the card's chip. */
      if (code) {
        try {
          const campaignId = await joinCampaign(code, created.id);
          const campaign = await getCampaign(campaignId).catch(() => null);
          if (campaign?.name) {
            await updateCharacter(created.id, { campaign: campaign.name }).catch(() => {});
          }
        } catch (err) {
          await deleteCharacter(created.id).catch(() => {});
          setBoxError(
            `${err.message} Nothing was created. Check the code and try again, or leave it blank and join from the sheet later.`
          );
          return;
        }
      }

      setCreating(false);
      /* The path rides in the URL rather than on the row: it is how you got
         here, not something the character is. See src/lib/creationPaths.js. */
      navigate(`/characters/${created.id}/new?path=${path.key}`);
    } catch (err) {
      setBoxError(err.message);
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

  /** Back into an unfinished Walkthrough, at the step its card says it stopped
      on. The path rides in the URL as it does for a fresh row; the step is read
      off the row by the screen itself. */
  function handleResume(character, where) {
    navigate(`/characters/${character.id}/new?path=${where.path}`);
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
            <CharacterCard
              key={character.id}
              character={character}
              onDelete={setPendingDelete}
              onResume={handleResume}
            />
          ))}

          {!atLimit && (
            <button
              type="button"
              className="create-card"
              onClick={() => {
                setPathKey(null);
                setDraft(EMPTY_DRAFT);
                setBoxError('');
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
                onResume={handleResume}
              />
            ))}
          </div>
        </section>
      )}

      {/* Two panes, and `path` is which one you are on: choose a way in, then
          name them. The cards are first because one of the four is not built
          yet, and finding that out after filling in a form would be worse than
          finding it out before. */}
      {creating && (
        <Modal
          title={path ? 'Name Your Character' : 'Make a Character'}
          onClose={() => setCreating(false)}
          /* Four cards want the roomy measure. A short form does not: the same
             form spread over 900px reads worse than it does at 560. */
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

              {/* The Free Hand is the way in for a character above level 1, so
                  it asks which level here, where the name is asked, and prints
                  what the level hands over under the answer. The ring is the
                  one grant that is a choice, so it is asked the moment the
                  level reaches it. See src/lib/startingLevel.js. */}
              {path.asksLevel && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-level">
                        Starting Level
                      </label>
                      <select
                        className="form-select"
                        id="new-level"
                        value={level}
                        onChange={(e) => setDraft({ ...draft, level: Number(e.target.value) })}
                      >
                        {startingLevels().map((n) => (
                          <option key={n} value={n}>
                            Level {n}
                          </option>
                        ))}
                      </select>
                    </div>

                    {grantsRing(level) && (
                      <div className="form-group">
                        <label className="form-label" htmlFor="new-ring">
                          Enchanted Ring
                        </label>
                        <select
                          className="form-select"
                          id="new-ring"
                          value={draft.ring}
                          onChange={(e) => setDraft({ ...draft, ring: e.target.value })}
                          required
                        >
                          <option value="">Physique, Instinct or Mind</option>
                          {RING_CHOICES.map((choice) => (
                            <option key={choice.key} value={choice.key}>
                              {choice.name} · 1 {attributeLabel(choice.key)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <ul className="start-grants">
                    {startingGrants(level, draft.ring).map((row) => (
                      <li key={row.id}>
                        <b>{row.label}</b>
                        <span>{row.detail}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* The campaign is a join code, and redeeming it is the link: see
                  CampaignJoin.jsx for the same field on the sheet. Only for an
                  account, because a campaign seats database rows and a character
                  kept on this device is not one. */}
              {user && (
                <div className="form-group">
                  <label className="form-label" htmlFor="new-code">
                    Campaign Code
                  </label>
                  <input
                    className="form-input enlist-code"
                    id="new-code"
                    value={draft.code}
                    onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                    placeholder="KQ2M-8VXR"
                    spellCheck="false"
                    autoComplete="off"
                  />
                  <p className="form-hint">
                    Optional. The join code your Game Master hands out seats the character at
                    their table from the start. It can also be entered later, from the
                    Advancement tab.
                  </p>
                </div>
              )}

              {boxError && <p className="form-error">{boxError}</p>}

              <p className="form-hint">
                That is all this box needs.{' '}
                {path.asksLevel
                  ? `Every choice from level 1 to level ${level} has its own chooser, and ${path.title} opens all of them at once.`
                  : `Your lineage, background, talent set and attributes are level 1 choices with their own choosers, and ${path.title} is where you make them.`}
                {!user && ' The character is saved in this browser until you make an account to keep it.'}
              </p>
            </form>
          ) : (
            <>
              <p className="form-hint path-lead">
                Four ways in, all of them ending on the same sheet. The Walkthrough is the place
                to start.
              </p>

              <CreationPathPick onPick={setPathKey} />

              <p className="form-hint path-foot">
                Three of the four are built: the Walkthrough, the Crossroads and the Free Hand,
                which makes a character above level 1. Ready-Made is on its way.
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
