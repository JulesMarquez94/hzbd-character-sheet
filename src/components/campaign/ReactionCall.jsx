import { useEffect, useRef, useState } from 'react';
import { useCampaignLog } from '../../context/campaign-log.js';
import { useFight } from '../../context/fight.js';
import { subscribeToTable } from '../../lib/realtime.js';

/** The same six seconds the actor's dice are held for. See usePlayCard.js. */
const REACTION_WINDOW_MS = 6000;

/**
 * The other side of the reaction window: somebody acted, and you can answer.
 *
 * The actor's dice are held for six seconds (see `hold` in usePlayCard.js and
 * the countdown in DiceSurface.jsx). This is the knock on everyone else's
 * screen during those seconds: a corner banner naming who is doing what, shown
 * only to a reader who can actually do something about it — a player with
 * Reaction Points in a live fight, or the Game Master whose enemies have some.
 * Playing the reaction is the flow that already exists (any card, paid As a
 * Reaction); the banner is the moment to use it in.
 *
 * It reads the same use events the log block reads and acts on none of them:
 * no writes, no sounds, gone by itself when the window closes or on a tap.
 * `ignore` is how a reader skips their own side's casts — a player their own,
 * the Game Master the table's — because nobody reacts to themselves.
 */
export default function ReactionCall({ tables = null, ignore, ready, needFight = false, line = '' }) {
  const [call, setCall] = useState(null); // { key, actor, title }

  /* The sheet's own tables where none are handed in, so the sheet mounts this
     with no plumbing; the encounter view hands its one campaign in directly. */
  const { tables: seated } = useCampaignLog();
  const ids = (tables ?? seated ?? []).map((table) => table.id).sort().join(',');

  /* A player's window only exists inside a live fight; the Game Master's page
     gates on the run itself and passes `ready` accordingly. */
  const fight = useFight();
  const open = ready && (!needFight || Boolean(fight));

  /* Read through a ref so the channel stays on the ids alone: `ready` moves
     with every pool change and `ignore` is a fresh arrow per render. */
  const stateRef = useRef({ ignore, ready: open });
  useEffect(() => {
    stateRef.current = { ignore, ready: open };
  });

  useEffect(() => {
    if (!ids) return undefined;

    const drop = ids.split(',').map((campaignId) =>
      subscribeToTable({
        table: 'campaign_events',
        filter: `campaign_id=eq.${campaignId}`,
        onChange: (payload) => {
          if (payload.eventType !== 'INSERT') return;
          const row = payload.new;
          if (row?.kind !== 'use') return;

          const held = stateRef.current;
          if (!held.ready) return;
          if (held.ignore && held.ignore(row)) return;

          setCall({ key: row.id, actor: row.actor || 'Someone', title: row.title || 'something' });
        },
      })
    );

    return () => drop.forEach((off) => off());
  }, [ids]);

  /* The window closes itself: the banner lives exactly as long as the hold on
     the actor's dice, and a newer action replaces an older banner outright. */
  useEffect(() => {
    if (!call) return undefined;
    const id = setTimeout(() => setCall(null), REACTION_WINDOW_MS);
    return () => clearTimeout(id);
  }, [call]);

  if (!call) return null;

  return (
    <button
      type="button"
      className="reaction-call"
      onClick={() => setCall(null)}
      title="A reaction is played like any card: As a Reaction. This puts the notice away."
    >
      <span className="reaction-call-head">Reaction window</span>
      <span className="reaction-call-what">
        <b>{call.actor}</b> uses <b>{call.title}</b>
      </span>
      {line && <span className="reaction-call-line">{line}</span>}
    </button>
  );
}
