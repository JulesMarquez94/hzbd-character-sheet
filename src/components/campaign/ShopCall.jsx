import { useCallback, useEffect, useRef } from 'react';
import { useCampaignLog } from '../../context/campaign-log.js';
import { listShopWords, postEvent, shopPaidEvent, shopRefusedEvent } from '../../lib/campaignLog.js';
import { normalizeCalendar } from '../../lib/calendar.js';
import { appendLedger, formatNumber, newLedgerId } from '../../lib/characterModel.js';
import { placeOrder } from '../../lib/fiefStore.js';
import { parcelName, readParcel, takeIntoPack } from '../../lib/handover.js';
import { subscribeToTable } from '../../lib/realtime.js';

/**
 * The sheet's half of a purchase in the party's town.
 *
 * A player picks a thing off a shop's shelf on the campaign page's Fief tab, and
 * that page may not write their sheet: nobody writes a sheet but the sheet. So
 * the shop writes the choice to the table log (`shopBuyEvent`), and this, on the
 * buyer's own sheet, pays for it: the coins out of the purse with a line in the
 * ledger, the thing into the pack, a `paid` row on the same chain, and the
 * receipt into the town's own book so the town's log says who bought what.
 *
 * Nothing to press. The decision was made at the shop, the way a refused gift
 * goes home without a button: there is nothing left in it to decide. A purse
 * that cannot cover it writes `refused` and moves nothing.
 *
 * ------------------------------------------------------------ one at a time
 * Purchases are paid in the order they were made and never two at once, so two
 * bought in the same breath are both taken off the purse rather than the second
 * one landing on the purse as it was before the first. The `paid` row is the
 * durable guard against paying twice; `settled` holds between the write and the
 * row coming back down the channel.
 *
 * Renders nothing. A sheet nobody can edit settles nothing, and a sheet at no
 * table hears nothing.
 */
export default function ShopCall({ character, patch, canEdit = false }) {
  const { tables } = useCampaignLog();
  const characterId = character?.id ?? null;
  const ids = tables.map((table) => table.id).sort().join(',');

  const live = useRef({ character, patch, canEdit, tables });
  useEffect(() => {
    live.current = { character, patch, canEdit, tables };
  });
  const settled = useRef(new Set());
  const line = useRef(Promise.resolve());

  const pay = useCallback(async (campaignId, buy) => {
    const { character: mine, patch: write, canEdit: mayWrite, tables: seats } = live.current;
    if (!mayWrite || !write || !mine) return;

    const data = buy.data ?? {};
    const name = parcelName(data.gift) || data.name || 'Something';
    const price = Math.max(0, Math.floor(Number(data.price) || 0));
    const purse = Math.max(0, Math.floor(Number(mine.wealth) || 0));
    const shop = data.shop || 'the town';
    const table = [{ id: campaignId }];

    if (!readParcel(data.gift)) {
      await postEvent(table, { ...shopRefusedEvent(mine, { chain: data.chain, name, why: 'This sheet cannot read what was bought.' }), characterId: mine.id });
      return;
    }
    if (purse < price) {
      await postEvent(table, {
        ...shopRefusedEvent(mine, { chain: data.chain, name, why: `The purse holds ${formatNumber(purse)}, ${formatNumber(price - purse)} short.` }),
        characterId: mine.id,
      });
      return;
    }

    const arriving = takeIntoPack(mine, data.gift);
    const wealth = purse - price;
    const ledger = price > 0
      ? appendLedger(mine, { id: newLedgerId(), ts: new Date().toISOString(), kind: 'wealth', delta: -price, note: `${name} · ${shop}`, balance: wealth })
      : mine.ledger;
    write({ ...arriving.patch, wealth, ledger });

    await postEvent(table, { ...shopPaidEvent(mine, { chain: data.chain, name, price, shop }), characterId: mine.id });

    /* And the receipt in the town's own book. A receipt that fails to land is a
       line missing from the town's log, never a purchase undone, so it is
       allowed to fail quietly. */
    const day = normalizeCalendar(seats.find((seat) => seat.id === campaignId)?.calendar).day;
    placeOrder(campaignId, { kind: 'buy', day, actor: mine.name ?? '', characterId: mine.id, data: { building: data.building, name, price } }).catch((error) =>
      console.warn('The town did not take the receipt.', error)
    );
  }, []);

  /** Everything this sheet was asked to pay for at one table and has not answered. */
  const read = useCallback(
    (campaignId) => {
      if (!characterId) return;
      listShopWords(campaignId)
        .then((rows) => {
          const answered = new Set(rows.filter((row) => row.data?.move !== 'buy').map((row) => row.data?.chain));
          const open = rows
            .filter((row) => row.data?.move === 'buy' && row.character_id === characterId && !answered.has(row.data?.chain))
            .sort((a, b) => a.seq - b.seq);
          for (const buy of open) {
            const chain = buy.data?.chain;
            if (!chain || settled.current.has(chain)) continue;
            settled.current.add(chain);
            line.current = line.current.then(() => pay(campaignId, buy)).catch((error) => console.warn('A purchase was not settled.', error));
          }
        })
        .catch(() => {});
    },
    [characterId, pay]
  );

  useEffect(() => {
    if (!ids || !characterId || !canEdit) return undefined;
    const list = ids.split(',');
    list.forEach(read);
    const drop = list.map((campaignId) =>
      subscribeToTable({
        table: 'campaign_events',
        filter: `campaign_id=eq.${campaignId}`,
        onChange: (payload) => {
          if (payload.eventType !== 'INSERT') return;
          if (payload.new?.kind !== 'shop' || payload.new?.data?.move !== 'buy') return;
          if (payload.new?.character_id !== characterId) return;
          read(campaignId);
        },
        onResync: () => read(campaignId),
      })
    );
    return () => drop.forEach((off) => off());
  }, [ids, characterId, canEdit, read]);

  return null;
}
