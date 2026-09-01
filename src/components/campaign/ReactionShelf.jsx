import { useEffect, useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import UsePrompt from '../sheet/UsePrompt.jsx';
import { BarChip } from '../sheet/ActiveBlock.jsx';
import { usePlayCard } from '../sheet/usePlayCard.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { foeBar, castEffect } from '../../lib/combatBar.js';
import { claimReaction, reactEvent } from '../../lib/campaignLog.js';
import { newChain } from '../../lib/logChain.js';
import { rollPlan } from '../../lib/rollPlan.js';
import { foeActor, foeSpend } from '../../lib/encounters.js';

/**
 * The Game Master's reaction window: every move the enemies with Reaction
 * Points can take, on one shelf.
 *
 * It used to be a hold with instructions — "play it off its block" — which is
 * not a window that shows you your actions, and Jules said so. Now it is the
 * player window's twin: opening it holds the actor's roll, each ready enemy
 * lays its own moves out as chips, the pick walks into the ordinary prompt
 * locked to As a Reaction, and the hold lifts when the reaction's own dice
 * settle — not when the button is pressed, because the stack resolves in
 * order. Closing without acting stands back and costs nothing, and a movement
 * pick releases the roll at once, since movement resolves last.
 *
 * The spend lands on the reacting enemy's own row through `foeSpend`, exactly
 * as its block would have written it, and an aimed reaction runs through the
 * same targeting, judging and apply window an aimed use does.
 */
export default function ReactionShelf({ call, foes, patch, combat = null, onClose }) {
  const { log } = useCampaignLog();
  // { foe, actor, request } while the prompt is up.
  const [picked, setPicked] = useState(null);
  /* A player at the table claimed the action's one reaction in the same breath.
     The shelf says so and offers nothing. See claimReaction. */
  const [lost, setLost] = useState(false);

  const ready = (foes ?? []).filter((foe) => !foe.down && foe.reaction > 0);

  /* Who pays: routed by ref, because one hook serves whichever enemy is picked
     and the write must land on that one's row. */
  const writeRef = useRef(null);
  const play = usePlayCard({ character: null, patch: (body) => writeRef.current?.(body) });

  const keyRef = useRef(newChain());
  const spokenRef = useRef(false);
  const pendingRef = useRef(false);

  const said = (move) => {
    if (spokenRef.current || !call?.chain) return;
    spokenRef.current = true;
    log(reactEvent(move, { chain: call.chain, key: keyRef.current, by: 'The enemies' }));
  };

  /* The open is a claim on the action's one reaction: it goes in, and the
     table's own count says whether this page has it or whether a player pressed
     a breath earlier. See claimReaction. */
  useEffect(() => {
    if (!call?.chain) return undefined;

    let alive = true;
    claimReaction(call.campaign, reactEvent('open', {
      chain: call.chain,
      key: keyRef.current,
      by: 'The enemies',
    }))
      .then((won) => alive && !won && setLost(true))
      .catch(() => {});

    return () => {
      alive = false;
      if (!pendingRef.current) said('pass');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(foe, actor, entry) {
    /* Movement resolves last and never holds the stack. */
    if ((entry.card?.tags ?? []).includes('Movement')) said('pass');

    setPicked({
      foe,
      actor,
      request: {
        name: entry.card?.name ?? entry.name,
        source: entry.source,
        ap: entry.ap,
        wp: entry.wp,
        variable: entry.variable,
        converts: entry.converts,
        opens: entry.opens,
        card: entry.card,
        modifiers: entry.modifiers,
        note: entry.note,
        extra: entry.extra,
      },
    });
  }

  function confirm(mode, amount, options = {}) {
    const { foe, actor, request } = picked;
    const targets = options?.targets ?? [];

    /* The same landing an enemy's block gives an aimed use: the effect rides to
       whoever was picked and the rolled numbers go to the apply window. See
       EnemyBlock.jsx, whose confirm this mirrors. */
    const cast = targets.length > 0 ? castEffect(request) : null;
    const checky =
      targets.length > 0 &&
      rollPlan(request.card, actor, request.modifiers, { half: Boolean(options?.price) }).some(
        (link) => link.shape === 'check'
      );

    writeRef.current = (body) => patch((row) => foeSpend(row, foe, body));
    pendingRef.current = true;

    play(request, mode, amount, options, {
      actor,
      afterSettled: () => said('done'),
      ...(cast
        ? {
            write: (body) => {
              const rest = { ...body };
              delete rest.effects;
              return rest;
            },
          }
        : {}),
      ...(targets.length > 0 && combat?.onResults
        ? {
            onSettled: (thrown, meta = {}) =>
              combat.onResults({
                foe,
                request,
                targets: meta.targets ?? targets,
                thrown,
                outcomes: meta.outcomes ?? null,
                hit: meta.hit ?? null,
                cast: checky ? cast : null,
              }),
          }
        : {}),
    });

    if (cast && !checky) combat?.layEffect?.(foe, targets, cast);
    onClose();
  }

  return (
    <Modal
      title={`React to ${call?.actor ?? 'the action'}`}
      onClose={onClose}
      size="page"
      footer={
        <>
          <span className="pick-line">
            {lost
              ? 'The reaction went to somebody at the table. Nothing here is holding anything.'
              : 'The roll is held while this is open. Closing it releases the roll and takes nothing.'}
          </span>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Stand back
          </button>
        </>
      }
    >
      {lost ? (
        <p className="react-window-lead">
          A player claimed it first. An action gets one reaction, and this one is already answered,
          so there is nothing to take here and nothing has been spent.
        </p>
      ) : (
        <p className="react-window-lead">
          <b>{call?.actor ?? 'Someone'}</b> is using <b>{call?.title ?? 'something'}</b>. Whatever
          an enemy takes resolves first, and it is the only reaction this action gets. A movement
          resolves last, and picking one releases the roll at once.
        </p>
      )}

      {lost ? null : ready.length === 0 ? (
        <p className="pick-line">Nothing here has a Reaction Point left to spend.</p>
      ) : (
        <div className="react-window-bar">
          {ready.map((foe) => {
            const actor = foeActor(foe);
            const groups = foeBar({ ...foe, actor });
            return (
              <section className="bar-group" key={foe.key}>
                <div className="block-head">
                  <span className="stat-category-label">{foe.title}</span>
                  <span className="block-count">
                    {foe.reaction} of {foe.stats.reaction_max} Reaction Points
                  </span>
                </div>
                {groups.map((group) => (
                  <div className="bar-chips" key={group.id}>
                    {group.moves.map((entry) => (
                      <BarChip
                        key={entry.key}
                        move={entry}
                        readOnly={false}
                        onUse={() => pick(foe, actor, entry)}
                      />
                    ))}
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}

      {picked && (
        <UsePrompt
          request={picked.request}
          character={picked.actor}
          reaction
          combat={combat ? { roster: combat.roster, self: picked.foe.key } : null}
          onCancel={() => setPicked(null)}
          onConfirm={confirm}
        />
      )}
    </Modal>
  );
}
