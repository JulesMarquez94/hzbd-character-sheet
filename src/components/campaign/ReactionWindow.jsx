import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import UsePrompt from '../sheet/UsePrompt.jsx';
import { BarChip } from '../sheet/ActiveBlock.jsx';
import { usePlayCard } from '../sheet/usePlayCard.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { quickBar } from '../../lib/combatBar.js';
import { claimReaction, reactEvent } from '../../lib/campaignLog.js';
import { newChain } from '../../lib/logChain.js';

/**
 * The reaction, chosen: what the banner opens into.
 *
 * "If a reaction is clicked on, it opens a window to choose the action they
 * want to take, and pauses the roll of the reacted action" (Jules,
 * 2026-09-01). So opening this window is itself the hold — an `open` row goes
 * on the stack the moment it mounts, and the actor's gate stops counting and
 * says who. What closes the hold is what happens here:
 *
 *   a card confirmed   `done`. The reaction is on the stack ahead of the
 *                      action, the actor gets the fail question when every
 *                      hold lifts, and this reader's own dice roll as any
 *                      use's do.
 *   a movement picked  `pass`, the moment it is picked. Movement is the one
 *                      exception — it resolves *after* the action — so it
 *                      releases the roll immediately and plays out as an
 *                      ordinary use.
 *   the window closed  `pass`. Stepping back out is allowed and costs
 *                      nothing, and the actor is not left held by a reader
 *                      who changed their mind.
 *
 * The shelf is the character's own quick bar, unfiltered: what a reaction may
 * be is the table's question, and the prompt each chip opens still offers both
 * ways and still refuses what the pools cannot pay. Nothing here invents a
 * second way to play a card.
 *
 * ------------------------------------------------------------ one, and only one
 * An action gets one reaction. Every other reader's banner clears the moment
 * this window's open lands, which settles it whenever somebody is a second
 * ahead. The other case is two people pressing in the same breath, and that is
 * settled by the claim: the log's own sequence decides which of the two has it,
 * and the one who lost is told so here rather than spending a Reaction Point on
 * an action that has already been answered. See claimReaction.
 */
export default function ReactionWindow({ call, character, patch, onClose }) {
  const { log } = useCampaignLog();
  const [request, setRequest] = useState(null);
  /* Somebody else got the slot. The window stays up to say so and does nothing
     else: no chips, no spend. */
  const [lost, setLost] = useState(false);

  const play = usePlayCard({ character, patch });

  /* This one reaction's name on the stack, whether it has spoken its last word
     already, and whether a confirmed use is still rolling — the window closes
     at confirm, but the hold lifts only when the reaction actually resolves:
     "it needs to wait for the reaction action to happen first" (Jules,
     2026-09-01), so `done` is posted by the chain settling, not by the press. */
  const keyRef = useRef(newChain());
  const spokenRef = useRef(false);
  const pendingRef = useRef(false);

  const said = (move) => {
    if (spokenRef.current || !call?.chain) return;
    spokenRef.current = true;
    log(reactEvent(move, { chain: call.chain, key: keyRef.current, by: character?.name ?? '' }));
  };

  /* The hold itself, once, on mount — and the release on the way out for a
     reader who leaves without acting. A confirmed use holds past the close:
     its own settle is what speaks.

     The open is a *claim*: it goes in and the table's own count says whether
     this reader has the action's one reaction. Losing it holds nothing, and the
     pass on the way out is a word about a slot the gate never gave us, which
     the gate ignores by key. */
  useEffect(() => {
    if (!call?.chain) return undefined;

    let alive = true;
    claimReaction(call.campaign, {
      ...reactEvent('open', { chain: call.chain, key: keyRef.current, by: character?.name ?? '' }),
      characterId: character?.id ?? null,
    })
      .then((won) => alive && !won && setLost(true))
      .catch(() => {});

    return () => {
      alive = false;
      if (!pendingRef.current) said('pass');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => quickBar(character), [character]);

  function pick(entry) {
    /* Movement resolves last, which means it never holds the stack: the roll
       is released the moment it is picked, and the Move plays out as an
       ordinary use. */
    if ((entry.card?.tags ?? []).includes('Movement')) said('pass');

    setRequest({
      name: entry.card?.name ?? entry.name,
      source: entry.source,
      ap: entry.ap,
      wp: entry.wp,
      apWas: entry.apWas,
      apCutFrom: entry.apCutFrom,
      variable: entry.variable,
      converts: entry.converts,
      opens: entry.opens,
      card: entry.card,
      modifiers: entry.modifiers,
      note: entry.note,
      extra: entry.extra,
      ammo: entry.ammo,
      ammoMax: entry.ammoMax,
      ammoLeft: entry.ammoLeft,
    });
  }

  function confirm(mode, amount, options) {
    /* The hold survives the window closing: it lifts when the reaction's own
       dice settle, which is the stack resolving in order. */
    pendingRef.current = true;
    play(request, mode, amount, options, { afterSettled: () => said('done') });
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
              ? 'The reaction is somebody else’s. Nothing here is holding anything.'
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
          Somebody else got there first. An action gets one reaction, and this one is already
          answered, so there is nothing to take here and nothing has been spent.
        </p>
      ) : (
        <p className="react-window-lead">
          <b>{call?.actor ?? 'Someone'}</b> is using <b>{call?.title ?? 'something'}</b>. Whatever
          you take resolves first, and it is the only reaction this action gets. A movement
          resolves last, and picking one releases the roll at once.
        </p>
      )}

      {!lost && (
        <div className="react-window-bar">
          {groups.map((group) => (
            <section className="bar-group" key={group.id}>
              <div className="block-head">
                <span className="stat-category-label">{group.label}</span>
                {group.note && <span className="block-count">{group.note}</span>}
              </div>
              <div className="bar-chips">
                {group.moves.map((entry) => (
                  <BarChip key={entry.key} move={entry} readOnly={false} onUse={() => pick(entry)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {request && (
        <UsePrompt
          request={request}
          character={character}
          reaction
          onCancel={() => setRequest(null)}
          onConfirm={confirm}
        />
      )}
    </Modal>
  );
}
