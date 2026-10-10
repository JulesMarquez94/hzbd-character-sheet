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
 *
 * ------------------------------------------------------------------ no chains
 * A use *made as* a reaction never raises this. "Don't allow chains for
 * reaction" (Jules, 2026-09-01): the one reaction an action gets resolves and
 * then the action carries on, so there is no window on the window and nobody is
 * ever asked to answer an answer. The row says which it was — `mode` is set at
 * the moment of spending, never by the card — and that is the whole guard.
 */
export default function ReactionCall({
  tables = null,
  ignore,
  ready,
  needFight = false,
  line = '',
  onReact = null,
}) {
  const [call, setCall] = useState(null); // { key, actor, title, chain }

  /* The sheet's own tables where none are handed in, so the sheet mounts this
     with no plumbing; the encounter view hands its one campaign in directly. */
  const { tables: seated } = useCampaignLog();
  const ids = (tables ?? seated ?? []).map((table) => table.id).sort().join(',');

  /* A player's window only exists inside a live fight; the Game Master's page
     gates on the run itself and passes `ready` accordingly. A *running* fight:
     the context also stands up for an Initiative roll being asked for, and
     nobody reacts to a fight that has not started. */
  const fight = useFight();
  const open = ready && (!needFight || Boolean(fight?.live));

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

          /* One reaction slot, for now: the first reader to say yes takes it,
             and everybody else's question clears the moment their open lands.
             Jules, 2026-09-01. */
          if (row?.kind === 'react' && row.data?.move === 'open') {
            setCall((held) =>
              held && held.chain && held.chain === row.data?.chain ? null : held
            );
            return;
          }

          if (row?.kind !== 'use') return;
          /* No chains: a card played as a reaction is not something anybody
             gets to react to. See the note at the top. */
          if (row.data?.mode === 'reaction') return;

          const held = stateRef.current;
          if (!held.ready) return;
          if (held.ignore && held.ignore(row)) return;

          setCall({
            key: row.id,
            actor: row.actor || 'Someone',
            title: row.title || 'something',
            /* The reacted action's chain: what a hold is addressed to. Null
               for a use that rolls nothing, which has no gate to hold — the
               reaction still plays, it just pauses nothing. */
            chain: row.data?.chain ?? null,
            /* And which table it happened at, since a sheet may sit at several
               and the one reaction slot is claimed on the table it belongs to.
               See claimReaction. */
            campaign: campaignId,
          });
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

  /* The question, asked as one: "do you want to take a reaction to X doing X?"
     Saying yes is what pauses their roll — the window it opens posts the hold
     the moment it mounts — and the shelf it opens is where the reaction is
     chosen, with all the time the hold buys. Letting it pass costs nothing and
     the banner clears itself either way when the window closes. */
  return (
    <div className="reaction-call" role="alertdialog" aria-label="Reaction window">
      {/* The words in their own column, because the panel is half the screen
          wide since 2026-09-03 and at that width the two answers belong beside
          the question rather than under it. The wrapper is what makes that one
          rule of CSS instead of three. */}
      <span className="reaction-call-body">
        <span className="reaction-call-head">Reaction window</span>
        <span className="reaction-call-what">
          Do you want to take a reaction to <b>{call.actor}</b> using <b>{call.title}</b>?
        </span>
        {line && <span className="reaction-call-line">{line}</span>}
      </span>

      <span className="reaction-call-acts">
        {onReact && (
          <button
            type="button"
            className="btn btn-copper btn-sm"
            onClick={() => {
              onReact(call);
              setCall(null);
            }}
            title="Holds their roll while you choose what to take"
          >
            Take a reaction
          </button>
        )}
        <button
          type="button"
          className="btn btn-minimal btn-sm"
          onClick={() => setCall(null)}
        >
          Let it pass
        </button>
      </span>
    </div>
  );
}
