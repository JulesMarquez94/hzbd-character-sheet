import { useEffect, useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import { Gated } from './parts.jsx';
import { ItemIcon, ItemTags } from './itemParts.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { giveEvent, postEvent } from '../../lib/campaignLog.js';
import { listMembers } from '../../lib/campaigns.js';
import { giftTargets, giveFromPack, parcelName, parcelRefusal } from '../../lib/handover.js';
import { normalizePack } from '../../lib/items.js';
import { viewUrl, isVaultImage } from '../../lib/imageViews.js';
import { newChain } from '../../lib/logChain.js';

/**
 * Handing something to somebody at your table.
 *
 * ---------------------------------------------------------------- what it does
 * Two writes, in this order, and the order is the whole of the safety:
 *
 *   1. the thing comes off **this** sheet. The pack entry goes, and a made
 *      thing's record goes with it.
 *   2. the table is told, with the thing itself in the row.
 *
 * Nothing writes to the other player's sheet, because nothing may: their client
 * sees the offer, a panel stands up on their screen, and **they** write it in.
 * See handover.js for why the thing spends that gap belonging to nobody, and
 * HandoverCall.jsx for the other end of it.
 *
 * If the offer is refused it comes back on its own: the sender's own client is
 * watching for the decline and puts it back in the pack. If it is never answered
 * at all, the offer sits in the log where the sender can still see it, which is
 * the honest state of an outstretched hand.
 *
 * ------------------------------------------------------------------- the party
 * Read off the campaign's own roster rather than off anything on this sheet,
 * because who is at a table is a thing the campaign knows. A sheet at two tables
 * asks which one first; a sheet at one skips that question, since a party of one
 * table is not a choice.
 *
 * A device-only character sits at no table at all and never opens this window:
 * `tables` is empty and the button that raises it is not drawn. That is what
 * "cannot sit at a table" means here, the same as everywhere else on the sheet.
 */
export default function GiveWindow({ character, index, item, patch, onClose }) {
  const { tables } = useCampaignLog();

  /* Which table, once there is more than one. Settled at open for a sheet with
     a single table, so the common case is one question and not two. */
  const [tableId, setTableId] = useState(tables.length === 1 ? tables[0].id : null);
  /* The roster, tagged with the table it belongs to, so "still reading" is a
     comparison rather than a state this effect has to clear on its way in.
     Clearing it synchronously is the cascading-render the hooks rule refuses,
     and there is nothing to clear if the answer carries its own question. */
  const [roster, setRoster] = useState(null); // { tableId, rows } | { tableId, error }
  const answer = roster?.tableId === tableId ? roster : null;
  const error = answer?.error ?? '';
  /* Who it is being held out to, and whether the writing has started. Two
     states rather than one: the press is instant and the round trip is not, and
     the button must not look pressable while it is in the air. */
  const [to, setTo] = useState(null);
  const [sending, setSending] = useState(false);

  const table = tables.find((row) => row.id === tableId) ?? null;
  /* Read through `normalizePack`, and **not** off the raw column. `index` came
     from the pack block, which counts the normalized list; the stored column may
     be a JSON string or carry nulls from an older save, so indexing it directly
     lined the refusal up against the wrong entry — or, for a stored string,
     against a single character of it. That reads as "there is nothing here this
     build knows how to hand over" and leaves the button dead with no way to find
     out why. `giveFromPack` normalizes too, so this is now the same entry the
     write will act on. */
  const entry = normalizePack(character?.pack)[index];
  const refusal = parcelRefusal(character, entry);

  useEffect(() => {
    if (!tableId) return undefined;

    let alive = true;
    listMembers(tableId)
      .then((rows) => alive && setRoster({ tableId, rows }))
      .catch(
        () =>
          alive &&
          setRoster({ tableId, error: 'That table would not hand over its roster. Try again.' })
      );

    return () => {
      alive = false;
    };
  }, [tableId]);

  const party = useMemo(
    () => giftTargets(answer?.rows ?? [], character?.id),
    [answer, character?.id]
  );
  const chosen = party.find((row) => row.id === to) ?? null;

  async function hand() {
    if (!chosen || !table || sending) return;
    setSending(true);

    const leaving = giveFromPack(character, index);
    if (!leaving) {
      setRoster({
        tableId,
        error: 'This is not yours to give any more. Close this and look at your pack again.',
      });
      setSending(false);
      return;
    }

    /* **The row goes first, and the pack only empties if it landed.**
       Everywhere else on this site the log is an account of a write that already
       happened, so `postEvent` swallows its own failure — the points have gone
       and an unreachable log must not turn a use that happened into an error.
       Here the row *is* the delivery. A sender who took the ring off their own
       sheet and then lost the insert would have lost the ring, with nothing
       anywhere pointing at it.

       The other order has a cost too, and it is the smaller one: between the row
       landing and the patch there is an instant where the offer is live and the
       thing is still in the pack. The recipient's answer is what closes that,
       and a decline is settled by `alreadyHome`, which refuses to put back a
       thing this sheet never stopped holding. */
    const landed = await postEvent([table], {
      ...giveEvent(character, {
        chain: newChain(),
        to: chosen.id,
        toName: chosen.name,
        gift: leaving.gift,
        name: parcelName(leaving.gift),
      }),
      characterId: character.id,
    });

    if (!landed) {
      setRoster({
        tableId,
        error:
          'The table did not hear that. Nothing has left your pack. Check your connection and try again.',
      });
      setSending(false);
      return;
    }

    patch(leaving.patch);
    onClose();
  }

  return (
    <Modal
      title={`Hand over ${item?.name ?? 'it'}`}
      onClose={onClose}
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Cancel
          </button>
          <Gated
            className="btn btn-copper btn-sm"
            why={
              refusal ??
              (!table
                ? 'Choose which table first.'
                : !chosen
                  ? 'Choose who you are handing it to.'
                  : sending
                    ? 'Going.'
                    : null)
            }
            onClick={hand}
          >
            {sending ? 'Handing it over' : chosen ? `Hand it to ${chosen.name}` : 'Hand it over'}
          </Gated>
        </>
      }
    >
      <div className="equip-prompt">
        <div className="equip-prompt-head">
          <ItemIcon item={item} size={52} />
          <div className="equip-prompt-title">
            <span className="equip-prompt-name">{item?.name}</span>
            {item && <ItemTags item={item} />}
          </div>
        </div>

        {refusal ? (
          <p className="rest-refused" role="alert">
            {refusal}
          </p>
        ) : (
          <p className="pick-line">
            It leaves your pack now and lands in theirs when they take it. Until they answer it is
            in neither, and if they say no it comes back to you on its own.
          </p>
        )}

        {/* ---------- WHICH TABLE ----------
            Only asked when there is more than one. A party is a table, and a
            sheet at one table has no question to answer here. */}
        {tables.length > 1 && (
          <>
            <span className="stat-category-label">Which table</span>
            <span className="brew-decision-options">
              {tables.map((row) => (
                <button
                  type="button"
                  key={row.id}
                  className={`brew-chip${tableId === row.id ? ' is-on' : ''}`}
                  onClick={() => {
                    setTableId(row.id);
                    setTo(null);
                  }}
                >
                  {row.name}
                </button>
              ))}
            </span>
          </>
        )}

        {/* ---------- WHO ---------- */}
        <span className="stat-category-label">
          Who gets it
          {table && tables.length > 1 ? <span className="rest-labour-rule">{table.name}</span> : null}
        </span>

        {!table ? (
          <p className="pick-line">Pick a table above and its party appears here.</p>
        ) : error ? (
          <p className="pick-line log-empty">{error}</p>
        ) : !answer ? (
          <p className="pick-line log-empty">Reading the party…</p>
        ) : party.length === 0 ? (
          <p className="pick-line">
            Nobody else sits at this table yet. A gift needs somebody to give it to.
          </p>
        ) : (
          <div className="equip-target-list">
            {party.map((row) => (
              <button
                type="button"
                key={row.id}
                className={`equip-target give-target${to === row.id ? ' is-on' : ''}`}
                onClick={() => setTo(row.id)}
              >
                {row.portrait ? (
                  <span className={`log-face${isVaultImage(row.portrait) ? ' is-cropped' : ''}`}>
                    <img src={viewUrl(row.portrait, 'face')} alt="" loading="lazy" />
                  </span>
                ) : (
                  <span className="log-face is-blank" aria-hidden="true">
                    {initialsOf(row.name)}
                  </span>
                )}

                <span className="equip-target-body">
                  <span className="equip-slot-label">{row.name}</span>
                  <span className="equip-target-empty">
                    {to === row.id ? 'Chosen' : 'At this table'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function initialsOf(name) {
  return String(name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
