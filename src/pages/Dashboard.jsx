import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import Modal from '../components/Modal.jsx';
import { SkullIcon } from '../components/sheet/parts.jsx';
import { createCharacter, deleteCharacter, listCharacters } from '../lib/api.js';
import {
  compactNumber,
  formatNumber,
  initialsOf,
  isDead,
  xpProgress,
} from '../lib/characterModel.js';
import './Dashboard.css';

const CHARACTER_SLOTS = 6;

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
 */
function CharacterCard({ character, onDelete }) {
  const xp = xpProgress(character.xp);
  const dead = isDead(character);

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

export default function Dashboard() {
  const { user, displayName } = useAuth();
  const navigate = useNavigate();

  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [draft, setDraft] = useState({ name: '', campaign: '' });

  useEffect(() => {
    let active = true;

    listCharacters(user.id)
      .then((rows) => {
        if (!active) return;
        setCharacters(rows);
        setError('');
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [user.id]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError('Give your character a name.');
      return;
    }

    try {
      /* A name and a campaign are all this box asks for. Everything else a
         character is made of is a level-1 choice with its own chooser, so the
         row is created blank and the creation pages ask for the rest. */
      const created = await createCharacter(user.id, {
        name: draft.name.trim(),
        campaign: draft.campaign.trim(),
      });

      setCreating(false);
      navigate(`/characters/${created.id}/new`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    try {
      await deleteCharacter(pendingDelete.id);
      setCharacters((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setError(err.message);
      setPendingDelete(null);
    }
  }

  const atLimit = characters.length >= CHARACTER_SLOTS;

  return (
    <main className="container container-wide page">
      <h2 className="section-title">
        <span>{displayName}&rsquo;s Characters</span>
        <span className="tag tag-muted">
          Character Slots: <span style={{ color: 'var(--copper)', marginLeft: 4 }}>{characters.length}</span>{' '}
          / {CHARACTER_SLOTS}
        </span>
      </h2>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="loading-veil">Consulting the ledger…</div>
      ) : (
        <div className="char-grid">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} onDelete={setPendingDelete} />
          ))}

          {!atLimit && (
            <button type="button" className="create-card" onClick={() => setCreating(true)}>
              <span className="create-icon">+</span>
              <span className="create-text">Create Character</span>
            </button>
          )}
        </div>
      )}

      {!loading && characters.length === 0 && (
        <p className="muted center" style={{ marginTop: '2rem' }}>
          Your vault is empty. Enlist your first drifter to begin.
        </p>
      )}

      {creating && (
        <Modal
          title="Enlist a Character"
          onClose={() => setCreating(false)}
          footer={
            <>
              <button type="button" className="btn btn-minimal btn-sm" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button type="submit" form="create-character" className="btn btn-copper btn-sm">
                Create
              </button>
            </>
          }
        >
          <form id="create-character" onSubmit={handleCreate}>
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
              level-1 choices with their own choosers, and the next two pages walk you through them.
            </p>
          </form>
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
    </main>
  );
}
