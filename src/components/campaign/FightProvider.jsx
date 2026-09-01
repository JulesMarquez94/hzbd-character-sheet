import { useCallback, useEffect, useMemo, useState } from 'react';
import { FightContext } from '../../context/fight.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { listFightWords } from '../../lib/campaignLog.js';
import { encounterState, listEncounters } from '../../lib/encounters.js';
import { subscribeToTable } from '../../lib/realtime.js';

/**
 * The fight, as this sheet is allowed to know it.
 *
 * Jules, 2026-09-01: "in a combat encounter I should see all enemies I can
 * target." A player cannot read the encounter row — that is a ruling, not a
 * gap: half of what is on it is the answer to "how much has the boss got
 * left" — so the fight reaches the sheet the way everything else does, over
 * the table log. Three moves carry the whole of it: the initiative event is
 * the order (kind, ref, name, rank and the three defenses per body), the turn
 * calls say who is up, and the fight-over event says it stopped.
 *
 * What crosses is deliberately less than the Game Master sees. Names, sides
 * and defenses; never pools. So the roster it hands down draws plain chips —
 * `health01: null` is "not allowed to know", and TargetChip paints no bar for
 * it — while the defenses are what arm an aimed check with its own DC (see
 * usePlayCard.js).
 *
 * ------------------------------------------------------------------ two reads
 * A fetch on mount and the insert channel after it, so a player who reloads
 * mid-fight still has the fight and one rolled while the sheet is open arrives
 * without a reload. The fetch asks for the fight's own moves *by name*
 * (listFightWords) rather than scanning the feed: a long evening buries an
 * initiative under sixty rows of casts and throws, and a fight the sheet
 * cannot find is a picker that never appears — which is exactly how it first
 * shipped broken.
 *
 * Rows are settled by `seq`, whichever way they arrive: a late row can never
 * restart a finished fight, and a turn call older than its own initiative is
 * ignored. One fight per campaign, and a sheet at several tables holds them
 * all.
 */
export default function FightProvider({ characterId, children }) {
  const { tables } = useCampaignLog();
  // campaignId -> { seq, order, up: { name, round, seq } | null }
  const [fights, setFights] = useState({});
  /* The pools a shared encounter lets this reader see:
     campaignId -> encounterId -> foe key -> { health01, shield01, down }.
     Empty for everything the Game Master has not opened — the read policy is
     the curtain, and this only holds what came back. */
  const [shared, setShared] = useState({});

  const ids = tables.map((table) => table.id).sort().join(',');

  /** One encounter's foes as chip pools, off the same reading the blocks use. */
  const poolsOf = (row) => {
    const map = {};
    for (const foe of encounterState(row)) {
      map[foe.key] = {
        health01: foe.stats.health_max > 0 ? foe.health / foe.stats.health_max : 0,
        shield01: foe.stats.health_max > 0 ? foe.shield / foe.stats.health_max : 0,
        down: foe.down,
      };
    }
    return map;
  };

  /**
   * Whatever encounters this reader may read, wholesale. For a player that is
   * exactly the shared ones — the policy filters, not this — and refetching
   * wholesale is what clears a curtain that just closed: a row that stops
   * being readable sends no realtime word of its own.
   */
  const readShared = useCallback((campaignId) => {
    listEncounters(campaignId)
      .then((rows) => {
        setShared((held) => ({
          ...held,
          [campaignId]: Object.fromEntries(rows.map((row) => [row.id, poolsOf(row)])),
        }));
      })
      .catch(() => {});
  }, []);

  /** One row's word about the fight, folded in wherever it belongs. */
  const settle = useCallback((campaignId, row) => {
    if (!row || row.kind !== 'turn') return;
    const move = row.data?.move;
    if (move !== 'initiative' && move !== 'fight-over' && move !== 'your-turn') return;

    setFights((held) => {
      const seq = Number(row.seq) || 0;
      const known = held[campaignId] ?? null;

      if (move === 'your-turn') {
        /* Who is up, on the fight that is actually running: a call older than
           the standing order belongs to some earlier fight and says nothing
           about this one. The character id rides along for a player's turn, so
           a sheet can know "this is me" without matching names. */
        if (!known?.order || seq <= Number(known.seq)) return held;
        if (known.up && Number(known.up.seq) >= seq) return held;
        return {
          ...held,
          [campaignId]: {
            ...known,
            up: {
              name: String(row.actor ?? ''),
              character: row.data?.character ?? null,
              round: Math.max(1, Math.floor(Number(row.data?.round) || 1)),
              seq,
            },
          },
        };
      }

      // Rows can arrive out of order across a refetch and the channel; the
      // count is the truth about which word came last.
      if (known && Number(known.seq) >= seq) return held;

      /* A fight over is remembered as over rather than forgotten, so an older
         initiative arriving late cannot restart one that ended. A fresh
         initiative clears whoever was up in the fight before it. */
      const order =
        move === 'fight-over'
          ? null
          : (row.data?.order ?? []).filter(
              (entry) => entry && entry.ref && (entry.kind === 'foe' || entry.kind === 'member')
            );

      return { ...held, [campaignId]: { seq, order, up: null } };
    });
  }, []);

  useEffect(() => {
    if (!ids) return undefined;
    let alive = true;

    /* The backlog, asked for by name. Reading state off a fetch is safe where
       acting off one is not: nothing here spends, lays or applies — it only
       remembers who is in the fight. TurnCall stays channel-only for exactly
       the opposite reason. Settled oldest first so the seq guards see the rows
       the way time did. */
    for (const campaignId of ids.split(',')) {
      listFightWords(campaignId)
        .then((rows) => {
          if (!alive) return;
          for (const row of [...rows].reverse()) settle(campaignId, row);
        })
        .catch(() => {});
    }

    const drop = ids.split(',').flatMap((campaignId) => [
      subscribeToTable({
        table: 'campaign_events',
        filter: `campaign_id=eq.${campaignId}`,
        onChange: (payload) => {
          if (payload.eventType !== 'INSERT') return;
          const row = payload.new;
          if (!row) return;
          settle(campaignId, row);
          /* The curtain moved. Opening arrives on the encounters channel by
             itself; closing does not, so the announcement is what triggers the
             refetch that comes back without the hidden row. */
          if (row.kind === 'turn' && row.data?.move === 'share') readShared(campaignId);
        },
      }),
      /* A shared encounter's own row, live: every Health step the Game Master
         makes lands on the chips as it lands on their block. Only rows this
         reader may read ever arrive, which for a player is the shared ones. */
      subscribeToTable({
        table: 'encounters',
        filter: `campaign_id=eq.${campaignId}`,
        onChange: (payload) => {
          if (payload.eventType === 'DELETE') {
            readShared(campaignId);
            return;
          }
          const row = payload.new;
          if (!row?.id) return;
          setShared((held) => ({
            ...held,
            [campaignId]: { ...(held[campaignId] ?? {}), [row.id]: poolsOf(row) },
          }));
        },
        onResync: () => readShared(campaignId),
      }),
    ]);

    /* And the first read of the curtain's state, beside the fight's. */
    for (const campaignId of ids.split(',')) readShared(campaignId);

    return () => {
      alive = false;
      drop.forEach((off) => off());
    };
  }, [ids, settle, readShared]);

  const value = useMemo(() => {
    const roster = [];
    const seen = new Set();
    const running = [];

    /* Every pool the curtain lets through, flattened: foe keys are minted
       random per encounter, so one map serves every chip. */
    const pools = {};
    for (const perCampaign of Object.values(shared)) {
      for (const perEncounter of Object.values(perCampaign)) {
        Object.assign(pools, perEncounter);
      }
    }

    for (const [campaignId, fight] of Object.entries(fights)) {
      if (!fight.order || fight.order.length === 0) continue;

      running.push({
        id: campaignId,
        name: tables.find((table) => table.id === campaignId)?.name ?? '',
        order: fight.order,
        round: fight.up?.round ?? 1,
        upName: fight.up?.name ?? null,
        upCharacter: fight.up?.character ?? null,
      });

      for (const entry of fight.order) {
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
             the chip draws a plain face — unless the Game Master opened the
             curtain, and then the bar is the encounter row's own. The defenses
             cross either way; they are what a roll against this body is judged
             by. */
          health01: null,
          shield01: 0,
          down: false,
          ...(pools[entry.ref] ?? {}),
          defenses: entry.defenses ?? null,
        });
      }
    }

    return running.length > 0 ? { live: true, roster, fights: running, pools } : null;
  }, [fights, shared, tables, characterId]);

  return <FightContext.Provider value={value}>{children}</FightContext.Provider>;
}
