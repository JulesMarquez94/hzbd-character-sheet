import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../Modal.jsx';
import { characterIdFromLink, makeJoinCode } from '../../lib/campaigns.js';
import { initialsOf, levelForXp } from '../../lib/characterModel.js';

/**
 * The Details tab: everything a campaign *is*, editable by the DM who runs it.
 *
 * Name, description and thumbnail write through the same debounced patch the
 * sheet's tabs use, so typing here feels like typing there. The join code and
 * the roster live here too: the code because handing it out is a detail of
 * running the table, and the roster because linking and unlinking characters
 * is editing the campaign.
 *
 * A player at the table reads the same page with the pen taken away. The one
 * thing they can still do is leave: their character is theirs to withdraw.
 */
export default function CampaignDetails({
  campaign,
  members,
  patch,
  canEdit,
  userId,
  onAdd,
  onRemove,
}) {
  const [link, setLink] = useState('');
  const [note, setNote] = useState(null); // { tone: 'error' | 'ok', text }
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(null); // the member row up for removal

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(campaign.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNote({ tone: 'error', text: 'Could not reach the clipboard. Select the code and copy by hand.' });
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    const characterId = characterIdFromLink(link);
    if (!characterId) {
      setNote({ tone: 'error', text: 'That is not a sheet link. Paste the address of the character sheet itself.' });
      return;
    }

    setBusy(true);
    setNote(null);
    try {
      const added = await onAdd(characterId);
      setLink('');
      setNote({ tone: 'ok', text: `${added.characters.name} sits at the table now.` });
    } catch (err) {
      setNote({ tone: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    const member = leaving;
    setLeaving(null);
    try {
      await onRemove(member);
    } catch (err) {
      setNote({ tone: 'error', text: err.message });
    }
  }

  return (
    <div className="camp-details">
      {/* ---------- WHAT IT IS ---------- */}
      <section className="camp-panel">
        <h3 className="camp-panel-title">The Campaign</h3>

        {canEdit ? (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="camp-name">
                Name
              </label>
              <input
                className="form-input"
                id="camp-name"
                value={campaign.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="The Glass Spires"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="camp-desc">
                Description
              </label>
              <textarea
                className="form-input camp-desc-input"
                id="camp-desc"
                value={campaign.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="A sentence for the card on your Campaigns page."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="camp-thumb">
                Thumbnail
              </label>
              <input
                className="form-input"
                id="camp-thumb"
                value={campaign.thumbnail_url ?? ''}
                onChange={(e) => patch({ thumbnail_url: e.target.value || null })}
                placeholder="https://… a link to an image"
              />
              <p className="form-hint">
                A plain link to a picture, the way portraits work. It becomes the face of the
                campaign's card.
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="camp-read-name">{campaign.name}</p>
            {campaign.description && <p className="camp-read-desc">{campaign.description}</p>}
          </>
        )}

        {campaign.thumbnail_url && (
          <div className="camp-thumb-preview">
            <img src={campaign.thumbnail_url} alt="" />
          </div>
        )}
      </section>

      {/* ---------- THE CODE ---------- */}
      {canEdit && (
        <section className="camp-panel">
          <h3 className="camp-panel-title">The Join Code</h3>
          <p className="form-hint">
            Hand this to your players. On their Campaigns page it links a character of their own
            to this table.
          </p>
          <div className="camp-code-row">
            <code className="camp-code">{campaign.code}</code>
            <button type="button" className="btn btn-minimal btn-sm" onClick={copyCode}>
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              className="btn btn-minimal btn-sm"
              onClick={() => patch({ code: makeJoinCode() })}
              title="Retire this code and mint a fresh one"
            >
              New code
            </button>
          </div>
          <p className="form-hint">
            A new code retires the old one. Nobody already at the table is unlinked.
          </p>
        </section>
      )}

      {/* ---------- THE PARTY ---------- */}
      <section className="camp-panel">
        <h3 className="camp-panel-title">The Party</h3>

        {members.length === 0 && (
          <p className="form-hint">No characters are linked yet.</p>
        )}

        {members.length > 0 && (
          <ul className="camp-roster">
            {members.map((member) => {
              const who = member.characters;
              const mine = member.user_id === userId;
              return (
                <li key={member.id} className="camp-roster-row">
                  <span className="camp-roster-face">
                    {who.portrait_url ? (
                      <img src={who.portrait_url} alt="" />
                    ) : (
                      <span className="camp-roster-initials">{initialsOf(who.name)}</span>
                    )}
                  </span>
                  <Link to={`/characters/${who.id}`} className="camp-roster-name">
                    {who.name}
                  </Link>
                  <span className="camp-roster-level">Lvl {levelForXp(who.xp)}</span>
                  {mine && <span className="camp-roster-mine">Yours</span>}
                  <span className="spacer" />
                  {(canEdit || mine) && (
                    <button
                      type="button"
                      className="btn btn-minimal btn-sm"
                      onClick={() => setLeaving(member)}
                    >
                      {canEdit && !mine ? 'Remove' : 'Leave'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {canEdit && (
          <form className="camp-add-row" onSubmit={handleAdd}>
            <input
              className="form-input"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste a character's sheet link"
              aria-label="Character sheet link"
            />
            <button type="submit" className="btn btn-copper btn-sm" disabled={busy || !link.trim()}>
              Link character
            </button>
          </form>
        )}

        {canEdit && (
          <p className="form-hint">
            The sheet link is the page's address. Every sheet has a Share button that copies it.
          </p>
        )}

        {note && (
          <p className={note.tone === 'error' ? 'form-error' : 'camp-note-ok'}>{note.text}</p>
        )}
      </section>

      {leaving && (
        <Modal
          title={canEdit && leaving.user_id !== userId ? 'Remove Character' : 'Leave Campaign'}
          onClose={() => setLeaving(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-minimal btn-sm"
                onClick={() => setLeaving(null)}
              >
                Keep
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={handleRemove}>
                Unlink
              </button>
            </>
          }
        >
          <p>
            Unlink <strong>{leaving.characters.name}</strong> from {campaign.name}? The sheet
            itself is untouched, and the join code links them back any time.
          </p>
        </Modal>
      )}
    </div>
  );
}
