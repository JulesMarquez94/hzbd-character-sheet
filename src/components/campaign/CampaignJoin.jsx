import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/auth-context.js';
import { getCampaign, joinCampaign } from '../../lib/campaigns.js';
import { listTables } from '../../lib/campaignLog.js';
import { isLocalCharacter } from '../../lib/localCharacters.js';

/**
 * The campaign field, as a join code.
 *
 * The identity frame used to ask for the campaign's *name*, a line of free
 * text that linked the character to nothing. Jules, 2026-09-12: "instead of
 * campaign name you should have campaign code so character can be linked that
 * way to a campaign." So the field is the code now, and redeeming it is the
 * link itself: a `campaign_members` row, written through the same
 * `join_campaign` function the Campaigns page uses, so a code holder never
 * needs to read a table they are not yet at. The campaign's name is copied
 * into the old text column afterwards, so the dashboard card's chip still
 * says where the character plays.
 *
 * What it shows first is the truth: which tables the sheet already sits at,
 * read off `campaign_members` here rather than off the page's LogProvider,
 * because the creation screens stand outside that provider.
 *
 * A character kept on this device sits at no table and cannot: a campaign
 * seats database rows. The control says so instead of offering a field that
 * would refuse every code.
 */
export default function CampaignJoin({
  character,
  patch = null,
  readOnly = false,
  id = 'campaign-code',
}) {
  const { user } = useAuth();
  const local = isLocalCharacter(character);
  const characterId = character?.id ?? null;

  /* Null until read, so "at no table" is never said before the answer is in.
     Only a database character is ever read: a device character sits at no
     table, and that answer is derived below rather than stored, so the effect
     never has to set state itself. */
  const [tables, setTables] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  /* The last thing that happened, as `{ kind: 'ok' | 'error', text }`. */
  const [note, setNote] = useState(null);

  const read = useCallback(() => {
    if (local || !characterId) return undefined;
    listTables(characterId)
      .then(setTables)
      .catch(() => setTables([]));
    return undefined;
  }, [characterId, local]);

  useEffect(read, [read]);

  const known = local || !characterId ? [] : tables;

  const canJoin = !readOnly && !local && Boolean(user) && Boolean(characterId);

  async function join() {
    const typed = code.trim();
    if (!typed || busy || !canJoin) return;

    setBusy(true);
    setNote(null);
    try {
      const campaignId = await joinCampaign(typed, characterId);
      /* Now a member, so the row can be read: the name goes into the label the
         dashboard chip prints. A read that fails leaves the link standing. */
      const campaign = await getCampaign(campaignId).catch(() => null);
      if (campaign?.name && patch) patch({ campaign: campaign.name });
      setCode('');
      setNote({
        kind: 'ok',
        text: campaign?.name ? `Seated at ${campaign.name}.` : 'Seated at the table.',
      });
      read();
    } catch (err) {
      setNote({ kind: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const names = (known ?? []).map((table) => table.name).filter(Boolean);
  const seated =
    known === null
      ? 'Reading the tables…'
      : names.length === 0
        ? 'At no table yet.'
        : `Sits at ${listAnd(names)}.`;

  return (
    <div className="camp-join">
      <label className="form-label" htmlFor={id}>
        Campaign
      </label>
      <p className="camp-join-seated">{seated}</p>

      {canJoin && (
        <div className="camp-join-row">
          <input
            className="form-input camp-join-code"
            id={id}
            value={code}
            placeholder="KQ2M-8VXR"
            spellCheck="false"
            autoComplete="off"
            disabled={busy}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              join();
            }}
          />
          <button
            type="button"
            className="btn btn-minimal btn-sm"
            disabled={busy || !code.trim()}
            onClick={join}
          >
            {busy ? 'Joining…' : 'Join'}
          </button>
        </div>
      )}

      {local && (
        <p className="form-hint camp-join-note">
          Saved on this device only. Save the character to your account to seat it at a table.
        </p>
      )}
      {!local && !user && !readOnly && (
        <p className="form-hint camp-join-note">
          Sign in to seat this character at a table by its join code.
        </p>
      )}
      {note && (
        <p className={`${note.kind === 'error' ? 'form-error' : 'form-hint'} camp-join-note`}>
          {note.text}
        </p>
      )}
      {canJoin && !note && (
        <p className="form-hint camp-join-note">
          The join code is on the campaign&rsquo;s Details tab. Your Game Master has it.
        </p>
      )}
    </div>
  );
}

function listAnd(words) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
}
