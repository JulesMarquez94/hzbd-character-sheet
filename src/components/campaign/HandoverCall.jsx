import { useCallback, useEffect, useRef, useState } from 'react';
import { useCampaignLog } from '../../context/campaign-log.js';
import { ItemIcon } from '../sheet/itemParts.jsx';
import {
  giftDeclinedEvent,
  giftReturnedEvent,
  giftTakenEvent,
  listGiveWords,
  postEvent,
} from '../../lib/campaignLog.js';
import {
  alreadyHome,
  offersToMe,
  parcelName,
  readParcel,
  returnable,
  takeIntoPack,
} from '../../lib/handover.js';
import { getItem, heldItem } from '../../lib/items.js';
import { subscribeToTable } from '../../lib/realtime.js';

/**
 * Somebody at your table is holding something out to you.
 *
 * The other end of GiveWindow.jsx, and the reason a gift works at all: **nobody
 * may write to your sheet but you.** The sender took the thing off their own
 * pack and told the table; this is the panel that stands up on yours, and
 * pressing Take is your own client writing it into your own inventory.
 *
 * ------------------------------------------------------------------- two jobs
 * One component, because they are two halves of one conversation and share
 * every line of plumbing — the same channel, the same fetch, the same reading of
 * the same four moves:
 *
 *   to you      an offer you have not answered. A panel, and two buttons.
 *   from you    an offer you made that came back refused and is not yet back in
 *               your pack. **No panel**: it settles itself, silently, because
 *               there is no decision left in it. You offered, they said no, the
 *               thing is yours again, and being asked to press a button to
 *               accept your own ring back would be the interface apologising for
 *               its own protocol.
 *
 * The return is the one write here that happens without being pressed, so it is
 * guarded twice: `alreadyHome` refuses to put back a thing the sheet is already
 * holding, and the `returned` row it writes is what stops the next read seeing
 * work to do. Two tabs open on one sheet settle it once between them.
 *
 * ------------------------------------------------------------ a fetch and a channel
 * Both, the same shape FightProvider has. The channel is how an offer arrives
 * while the sheet is open; the fetch is how one arrives while it was shut. An
 * offer is a question rather than an act, so reading it off a fetch is safe —
 * and so is a return, because a chain that has already been settled carries the
 * row that says so.
 *
 * Renders nothing at all for a sheet at no table, which is every device-only
 * character and every sheet nobody has seated.
 */
export default function HandoverCall({ character, patch, canEdit = false }) {
  const { tables } = useCampaignLog();
  /* campaignId -> the offers this sheet has been handed, newest first. Held per
     table because a sheet may sit at several and an answer is written at the
     table the offer was made at. */
  const [held, setHeld] = useState({});
  /* Which offer is being answered, so a double press cannot write twice. */
  const [busy, setBusy] = useState(null);
  /* Chains this session has already settled a return for. The `returned` row is
     the durable guard; this is the one that holds between the write and the row
     coming back down the channel. */
  const settled = useRef(new Set());

  const characterId = character?.id ?? null;
  const ids = tables.map((table) => table.id).sort().join(',');

  /* Read through a ref so the channel below stays on the ids alone: the
     character moves with every pool change and `patch` is a fresh arrow per
     render, and neither should tear a subscription down. */
  const live = useRef({ character, patch, canEdit });
  useEffect(() => {
    live.current = { character, patch, canEdit };
  });

  /**
   * Put back a thing nobody took.
   *
   * The whole of the sender's half. Guarded on the sheet as it is *now* rather
   * than on the row, because the row is somebody else's account of what
   * happened and the sheet is the truth: an offer whose ring is already in the
   * pack writes the closing row and nothing else.
   */
  const settle = useCallback(async (campaignId, offer) => {
    const { character: mine, patch: write, canEdit: mayWrite } = live.current;
    if (!mayWrite || !write || settled.current.has(offer.chain)) return;
    settled.current.add(offer.chain);

    const name = parcelName(offer.gift);

    if (!alreadyHome(mine, offer.gift)) {
      const back = takeIntoPack(mine, offer.gift);
      if (!back) return;
      write(back.patch);
    }

    await postEvent([{ id: campaignId }], {
      ...giftReturnedEvent(mine, { chain: offer.chain, name }),
      characterId: mine.id,
    });
  }, []);

  /** One table's offers, read from the top. */
  const read = useCallback(
    (campaignId) => {
      if (!characterId) return;

      listGiveWords(campaignId)
        .then((rows) => {
          setHeld((was) => ({ ...was, [campaignId]: offersToMe(rows, characterId) }));
          /* And whatever came back refused while nobody was looking. Settled
             here rather than in a render, so the write is a consequence of the
             read that found it and not of a paint. */
          for (const offer of returnable(rows, characterId)) settle(campaignId, offer);
        })
        // A table whose log cannot be read is a table with no offers on it.
        .catch(() => setHeld((was) => ({ ...was, [campaignId]: [] })));
    },
    [characterId, settle]
  );

  useEffect(() => {
    if (!ids || !characterId) return undefined;

    const list = ids.split(',');
    list.forEach(read);

    const drop = list.map((campaignId) =>
      subscribeToTable({
        table: 'campaign_events',
        filter: `campaign_id=eq.${campaignId}`,
        onChange: (payload) => {
          if (payload.eventType !== 'INSERT') return;
          if (payload.new?.kind !== 'give') return;
          /* Re-read rather than fold the row in by hand. A handover is four
             moves on one chain and what the panel shows is a function of all of
             them; folding one at a time is where the second copy of that
             arithmetic would live. */
          read(campaignId);
        },
        onResync: () => read(campaignId),
      })
    );

    return () => drop.forEach((off) => off());
  }, [ids, characterId, read]);

  /* The oldest unanswered offer at the first table that has one. One question
     at a time, the way the reaction window asks one: two panels over each other
     is two decisions nobody can read. */
  const waiting = tables
    .flatMap((table) => (held[table.id] ?? []).map((offer) => ({ ...offer, campaign: table.id })))
    .at(-1);

  if (!canEdit || !waiting) return null;

  const parcel = readParcel(waiting.gift);
  const name = parcelName(waiting.gift);
  const item = itemFor(character, parcel);
  const sender = waiting.row?.actor || 'Someone';

  async function answer(take) {
    if (busy === waiting.chain) return;
    setBusy(waiting.chain);

    if (take) {
      const arriving = takeIntoPack(character, waiting.gift);
      /* A payload this build cannot honour is declined rather than dropped, so
         the sender gets their thing back instead of losing it to a version
         mismatch. */
      if (arriving) patch(arriving.patch);

      await postEvent([{ id: waiting.campaign }], {
        ...(arriving
          ? giftTakenEvent(character, { chain: waiting.chain, name, from: sender })
          : giftDeclinedEvent(character, { chain: waiting.chain, name })),
        characterId: character.id,
      });
    } else {
      await postEvent([{ id: waiting.campaign }], {
        ...giftDeclinedEvent(character, { chain: waiting.chain, name }),
        characterId: character.id,
      });
    }

    setBusy(null);
    read(waiting.campaign);
  }

  return (
    <div className="reaction-call give-call" role="alertdialog" aria-label="Somebody is handing you something">
      {item && (
        <span className="give-call-icon">
          <ItemIcon item={item} size={44} />
        </span>
      )}

      <span className="reaction-call-body">
        <span className="reaction-call-head">Handed to you</span>
        <span className="reaction-call-what">
          <b>{sender}</b> is holding out <b>{name}</b>.
        </span>
        <span className="reaction-call-line">
          {parcel
            ? 'Take it and it goes into your inventory. Say no and it goes back to them.'
            : 'This sheet does not know what that is. Saying no hands it straight back, which is the safe answer.'}
        </span>
      </span>

      <span className="reaction-call-acts">
        <button
          type="button"
          className="btn btn-copper btn-sm"
          onClick={() => answer(true)}
          disabled={busy === waiting.chain || !parcel}
          title={parcel ? `Take ${name}` : 'Nothing here this build can put in a pack'}
        >
          {busy === waiting.chain ? 'Taking it' : 'Take it'}
        </button>
        <button
          type="button"
          className="btn btn-minimal btn-sm"
          onClick={() => answer(false)}
          disabled={busy === waiting.chain}
        >
          No thanks
        </button>
      </span>
    </div>
  );
}

/**
 * The parcel as something with an icon, or null for a written-in note.
 *
 * A forged record is resolved against the **sender's** design rather than
 * against this sheet, which it cannot be — the record has not arrived yet — so
 * the base is what draws. That is honest: the icon says "a ring", and what is
 * worked into it is on the row once it is yours.
 */
function itemFor(character, parcel) {
  if (parcel?.kind === 'codex') return heldItem(character, parcel.item) ?? getItem(parcel.item);
  if (parcel?.kind === 'forged') return getItem(parcel.record.base);
  return null;
}
