import { useCallback, useEffect, useMemo, useState } from 'react';
import { FightContext } from '../../context/fight.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { FEED_PAGE, listEvents } from '../../lib/campaignLog.js';
import { subscribeToTable } from '../../lib/realtime.js';

/**
 * The fight, as this sheet is allowed to know it.
 *
 * Jules, 2026-09-01: "in a combat encounter I should see all enemies I can
 * target." A player cannot read the encounter row — that is a ruling, not a
 * gap: half of what is on it is the answer to "how much has the boss got
 * left" — so the fight reaches the sheet the way everything else does, over
 * the table log. The initiative event carries the whole order (kind, ref,
 * name, rank per body), and the fight-over event says it stopped. Between
 * those two rows, this sheet knows who is standing in the fight; it just does
 * not know how they are standing.
 *
 * So the roster it hands down is names without pools: a foe chip in its rank's
 * colour and a member chip in the party's cyan, none of them wearing a Health
 * bar, because a bar a player's client cannot read would have to be invented.
 * The chips draw a plain face for exactly that case — see TargetChip.jsx.
 *
 * ------------------------------------------------------------------ two reads
 * A fetch on mount, so a player who reloads mid-fight still has targets, and
 * the insert subscription after it, so a fight rolled while the sheet is open
 * arrives without one. The fetch scans one page of the feed for the newest
 * initiative and the newest fight-over and believes whichever is newer; a
 * fight older than a whole page of events is a fight this sheet reads as over,
 * which at sixty rows a page is the safe reading of any real table.
 *
 * One fight per campaign, newest wins, and a sheet at several tables merges
 * the rosters: a body is a body wherever it stands.
 */
export default function FightProvider({ characterId, children }) {
  const { tables } = useCampaignLog();
  // campaignId -> { seq, order } for the running fight, or nothing.
  const [fights, setFights] = useState({});

  const ids = tables.map((table) => table.id).sort().join(',');

  /** The newest word on whether campaign `id` has a fight running. */
  const settle = useCallback((campaignId, row) => {
    if (!row || row.kind !== 'turn') return;
    const move = row.data?.move;
    if (move !== 'initiative' && move !== 'fight-over') return;

    setFights((held) => {
      const seq = Number(row.seq) || 0;
      const known = held[campaignId];
      // Rows can arrive out of order across a refetch and the channel; the
      // count is the truth about which word came last.
      if (known && Number(known.seq) >= seq) return held;

      /* A fight over is remembered as over rather than forgotten, so an older
         initiative arriving late cannot restart one that ended. */
      const order =
        move === 'fight-over'
          ? null
          : (row.data?.order ?? []).filter(
              (entry) => entry && entry.ref && (entry.kind === 'foe' || entry.kind === 'member')
            );

      return { ...held, [campaignId]: { seq, order } };
    });
  }, []);

  useEffect(() => {
    if (!ids) return undefined;
    let alive = true;

    /* The backlog scan. Reading state off a fetch is safe where acting off one
       is not: nothing here spends, lays or applies — it only remembers who is
       in the fight. TurnCall stays channel-only for exactly the opposite
       reason. */
    for (const campaignId of ids.split(',')) {
      listEvents(campaignId, { limit: FEED_PAGE })
        .then((rows) => {
          if (!alive) return;
          const word = rows.find(
            (row) =>
              row.kind === 'turn' &&
              (row.data?.move === 'initiative' || row.data?.move === 'fight-over')
          );
          if (word) settle(campaignId, word);
        })
        .catch(() => {});
    }

    const drop = ids.split(',').map((campaignId) =>
      subscribeToTable({
        table: 'campaign_events',
        filter: `campaign_id=eq.${campaignId}`,
        onChange: (payload) => {
          if (payload.eventType !== 'INSERT') return;
          if (payload.new) settle(campaignId, payload.new);
        },
      })
    );

    return () => {
      alive = false;
      drop.forEach((off) => off());
    };
  }, [ids, settle]);

  const value = useMemo(() => {
    const roster = [];
    const seen = new Set();

    for (const fight of Object.values(fights)) {
      for (const entry of fight.order ?? []) {
        if (seen.has(entry.ref)) continue;
        seen.add(entry.ref);
        roster.push({
          id: entry.ref,
          kind: entry.kind,
          name: entry.name,
          self: entry.kind === 'member' && entry.ref === characterId,
          tone:
            entry.kind === 'member'
              ? 'var(--focus-cyan)'
              : entry.rank
                ? `var(--rank-${entry.rank})`
                : 'var(--copper)',
          /* What a player is not allowed to know is not invented: no pools, so
             the chip draws a plain face rather than a bar. */
          health01: null,
          shield01: 0,
          down: false,
        });
      }
    }

    return roster.length > 0 ? { live: true, roster } : null;
  }, [fights, characterId]);

  return <FightContext.Provider value={value}>{children}</FightContext.Provider>;
}
