import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import Modal from '../components/Modal.jsx';
import {
  characterIdFromLink,
  createCampaign,
  addMember,
  deleteCampaign,
  joinCampaign,
  listCampaigns,
} from '../lib/campaigns.js';
import { getCharacter, listCharacters } from '../lib/api.js';
import { initialsOf, levelForXp } from '../lib/characterModel.js';
import { campaignSlots } from '../lib/tiers.js';
import './Campaigns.css';

/**
 * The Campaigns page: every table this account sits at, split by which chair.
 *
 * Campaigns you run are yours to open, edit and delete, and how many you may
 * run is the account tier's ceiling (campaignSlots, enforced again by the
 * database). Campaigns you play in arrived through a join code and are read
 * through the same card, minus the delete.
 */

function MemberChip({ character }) {
  return (
    <span className="camp-member-chip">
      <span className="camp-member-face">
        {character.portrait_url ? (
          <img src={character.portrait_url} alt="" />
        ) : (
          <span className="camp-member-initials">{initialsOf(character.name)}</span>
        )}
      </span>
      <span className="camp-member-name">{character.name}</span>
      <span className="camp-member-level">Lvl {levelForXp(character.xp)}</span>
    </span>
  );
}

/**
 * The whole card opens the campaign, the way a character card opens the sheet:
 * a link laid over the card, with the delete button and the name painted above
 * it. See Dashboard.jsx for why it is a link rather than an onClick.
 */
function CampaignCard({ campaign, onDelete }) {
  const members = (campaign.campaign_members ?? []).filter((member) => member.characters);

  return (
    <div className="camp-card">
      <Link
        to={`/campaigns/${campaign.id}`}
        className="camp-card-open"
        aria-label={`Open ${campaign.name}`}
      />

      <div className="camp-thumb">
        {campaign.thumbnail_url ? (
          <img src={campaign.thumbnail_url} alt="" />
        ) : (
          <span className="camp-thumb-initials">{initialsOf(campaign.name)}</span>
        )}
      </div>

      <div className="camp-body">
        <h3 className="camp-name">
          <Link to={`/campaigns/${campaign.id}`}>{campaign.name}</Link>
        </h3>
        {campaign.description && <p className="camp-blurb">{campaign.description}</p>}

        <div className="camp-party-strip">
          {members.length === 0 ? (
            <span className="camp-strip-empty">No characters linked yet</span>
          ) : (
            members.map((member) => <MemberChip key={member.id} character={member.characters} />)
          )}
        </div>
      </div>

      {onDelete && (
        <button
          type="button"
          className="btn-delete"
          onClick={() => onDelete(campaign)}
          aria-label={`Delete ${campaign.name}`}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function Campaigns() {
  const { user, displayName, tier } = useAuth();
  const navigate = useNavigate();

  const [running, setRunning] = useState([]);
  const [joined, setJoined] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    let active = true;

    listCampaigns(user.id)
      .then(({ running: run, joined: play }) => {
        if (!active) return;
        setRunning(run);
        setJoined(play);
        setError('');
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [user.id]);

  async function handleDelete() {
    try {
      await deleteCampaign(pendingDelete.id);
      setRunning((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setError(err.message);
      setPendingDelete(null);
    }
  }

  const slots = campaignSlots(tier);
  const atLimit = running.length >= slots;

  return (
    <main className="container container-wide page">
      <h2 className="section-title">
        <span>{displayName}&rsquo;s Campaigns</span>
        <span className="tag tag-muted">
          Campaign Slots:{' '}
          <span style={{ color: 'var(--copper)', marginLeft: 4 }}>{running.length}</span> / {slots}
        </span>
      </h2>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="loading-veil">Consulting the ledger…</div>
      ) : (
        <>
          <div className="camp-grid">
            {running.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} onDelete={setPendingDelete} />
            ))}

            {!atLimit && (
              <button type="button" className="create-card" onClick={() => setCreating(true)}>
                <span className="create-icon">+</span>
                <span className="create-text">Create Campaign</span>
              </button>
            )}
          </div>

          <h2 className="section-title camp-section-gap">
            <span>Campaigns You Play In</span>
          </h2>

          <div className="camp-grid">
            {joined.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}

            <button type="button" className="create-card" onClick={() => setJoining(true)}>
              <span className="create-icon">⌘</span>
              <span className="create-text">Join With a Code</span>
            </button>
          </div>
        </>
      )}

      {creating && (
        <CreateCampaign
          userId={user.id}
          onClose={() => setCreating(false)}
          onCreated={(campaign) => navigate(`/campaigns/${campaign.id}`)}
        />
      )}

      {joining && (
        <JoinCampaign
          userId={user.id}
          onClose={() => setJoining(false)}
          onJoined={(campaignId) => navigate(`/campaigns/${campaignId}`)}
        />
      )}

      {pendingDelete && (
        <Modal
          title="Delete Campaign"
          onClose={() => setPendingDelete(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-minimal btn-sm"
                onClick={() => setPendingDelete(null)}
              >
                Keep
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
                Delete Permanently
              </button>
            </>
          }
        >
          <p>
            Delete <strong>{pendingDelete.name}</strong>? The table is disbanded and its join code
            dies with it. The characters themselves are untouched.
          </p>
        </Modal>
      )}
    </main>
  );
}

/**
 * Creating a campaign: a name, a sentence, a picture, and whichever characters
 * you already have links for. Only the name is required. Everything here can
 * be changed later on the campaign's Details tab, and players can link
 * themselves with the join code minted on create.
 */
function CreateCampaign({ userId, onClose, onCreated }) {
  const [draft, setDraft] = useState({ name: '', description: '', thumbnail_url: '' });
  const [link, setLink] = useState('');
  const [picked, setPicked] = useState([]); // [{ id, name, level }]
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function addLink() {
    const characterId = characterIdFromLink(link);
    if (!characterId) {
      setNote('That is not a sheet link. Paste the address of the character sheet itself.');
      return;
    }
    if (picked.some((row) => row.id === characterId)) {
      setNote('That character is already on the list.');
      return;
    }

    setBusy(true);
    setNote('');
    try {
      const found = await getCharacter(characterId);
      setPicked((prev) => [
        ...prev,
        { id: found.id, name: found.name, level: levelForXp(found.xp) },
      ]);
      setLink('');
    } catch (err) {
      setNote(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!draft.name.trim()) {
      setNote('Give your campaign a name.');
      return;
    }

    setBusy(true);
    setNote('');
    try {
      const created = await createCampaign(userId, {
        name: draft.name.trim(),
        description: draft.description.trim(),
        thumbnail_url: draft.thumbnail_url.trim() || null,
      });

      /* Best effort, one by one: a character deleted since it was picked
         should not strand the campaign that was just made. Whatever fails can
         be re-linked from the Details tab. */
      for (const row of picked) {
        try {
          await addMember(created.id, row.id);
        } catch {
          /* re-linkable from Details */
        }
      }

      onCreated(created);
    } catch (err) {
      setNote(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Create a Campaign"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="create-campaign" className="btn btn-copper btn-sm" disabled={busy}>
            Create
          </button>
        </>
      }
    >
      <form id="create-campaign" onSubmit={handleCreate}>
        <div className="form-group">
          <label className="form-label" htmlFor="new-camp-name">
            Campaign Name
          </label>
          <input
            className="form-input"
            id="new-camp-name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="The Glass Spires"
            autoFocus
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="new-camp-desc">
            Description
          </label>
          <textarea
            className="form-input camp-desc-input"
            id="new-camp-desc"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="A sentence for the card on this page."
            rows={2}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="new-camp-thumb">
            Thumbnail
          </label>
          <input
            className="form-input"
            id="new-camp-thumb"
            value={draft.thumbnail_url}
            onChange={(e) => setDraft({ ...draft, thumbnail_url: e.target.value })}
            placeholder="https://… a link to an image"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="new-camp-link">
            Player Characters
          </label>
          <div className="camp-add-row">
            <input
              className="form-input"
              id="new-camp-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste a character's sheet link"
            />
            <button
              type="button"
              className="btn btn-minimal btn-sm"
              onClick={addLink}
              disabled={busy || !link.trim()}
            >
              Add
            </button>
          </div>

          {picked.length > 0 && (
            <ul className="camp-picked">
              {picked.map((row) => (
                <li key={row.id} className="camp-picked-row">
                  <span className="camp-picked-name">{row.name}</span>
                  <span className="camp-picked-level">Lvl {row.level}</span>
                  <span className="spacer" />
                  <button
                    type="button"
                    className="btn btn-minimal btn-sm"
                    onClick={() => setPicked((prev) => prev.filter((r) => r.id !== row.id))}
                  >
                    Drop
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="form-hint">
            Optional. A join code is minted with the campaign, and anyone you hand it to can link
            their own character without a link changing hands.
          </p>
        </div>

        {note && <p className="form-error">{note}</p>}
      </form>
    </Modal>
  );
}

/**
 * Joining: the code a DM handed over, spent on one of your own characters.
 */
function JoinCampaign({ userId, onClose, onJoined }) {
  const [characters, setCharacters] = useState(null); // null until loaded
  const [code, setCode] = useState('');
  const [characterId, setCharacterId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    listCharacters(userId)
      .then((rows) => {
        if (!active) return;
        setCharacters(rows);
        if (rows.length === 1) setCharacterId(rows[0].id);
      })
      .catch((err) => active && setNote(err.message));
    return () => {
      active = false;
    };
  }, [userId]);

  async function handleJoin(e) {
    e.preventDefault();
    if (!code.trim() || !characterId) return;

    setBusy(true);
    setNote('');
    try {
      const campaignId = await joinCampaign(code, characterId);
      onJoined(campaignId);
    } catch (err) {
      setNote(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Join a Campaign"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="join-campaign"
            className="btn btn-copper btn-sm"
            disabled={busy || !code.trim() || !characterId}
          >
            Join
          </button>
        </>
      }
    >
      <form id="join-campaign" onSubmit={handleJoin}>
        <div className="form-group">
          <label className="form-label" htmlFor="join-code">
            Join Code
          </label>
          <input
            className="form-input camp-code-input"
            id="join-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="KQ2M-8VXR"
            autoFocus
            required
          />
          <p className="form-hint">The DM finds it on their campaign's Details tab.</p>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="join-character">
            Your Character
          </label>
          {characters && characters.length === 0 ? (
            <p className="form-hint">
              You have no characters yet. <Link to="/dashboard">Enlist one</Link> first, then come
              back with the code.
            </p>
          ) : (
            <select
              className="form-input"
              id="join-character"
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              required
            >
              <option value="" disabled>
                {characters ? 'Pick who sits down' : 'Consulting the ledger…'}
              </option>
              {(characters ?? []).map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name} · Lvl {levelForXp(row.xp)}
                </option>
              ))}
            </select>
          )}
        </div>

        {note && <p className="form-error">{note}</p>}
      </form>
    </Modal>
  );
}
