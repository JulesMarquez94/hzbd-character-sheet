import { useEffect, useRef } from 'react';
import Modal from '../Modal.jsx';
import { useCampaignLog } from '../../context/campaign-log.js';
import { reactEvent } from '../../lib/campaignLog.js';
import { newChain } from '../../lib/logChain.js';

/**
 * The Game Master's side of the stack: holding a player's roll while an enemy
 * reacts.
 *
 * A player's reaction window is a shelf, because their cards are on their own
 * sheet. The Game Master's enemies are already laid out on this page as
 * blocks, so their window is only the hold itself: opening it stops the
 * player's countdown (`open` goes on the stack the moment it mounts), the
 * enemy's card is played off its block As a Reaction exactly as ever, and the
 * two buttons say how the hold lifts — taken, which earns the player their
 * fail question, or stood back, which does not. Closing the window without a
 * word is standing back, so a wandering Game Master cannot leave a player
 * held forever.
 */
export default function ReactionHold({ call, onClose }) {
  const { log } = useCampaignLog();

  const keyRef = useRef(newChain());
  const spokenRef = useRef(false);

  const said = (move) => {
    if (spokenRef.current || !call?.chain) return;
    spokenRef.current = true;
    log(reactEvent(move, { chain: call.chain, key: keyRef.current, by: 'The enemies' }));
  };

  useEffect(() => {
    if (call?.chain) {
      log(reactEvent('open', { chain: call.chain, key: keyRef.current, by: 'The enemies' }));
    }
    return () => said('pass');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      title={`React to ${call?.actor ?? 'the action'}`}
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button
            type="button"
            className="btn btn-minimal btn-sm"
            onClick={() => {
              said('pass');
              onClose();
            }}
          >
            Stand back
          </button>
          <button
            type="button"
            className="btn btn-copper btn-sm"
            onClick={() => {
              said('done');
              onClose();
            }}
          >
            Reaction taken · release the roll
          </button>
        </>
      }
    >
      <p className="react-window-lead">
        <b>{call?.actor ?? 'Someone'}</b> is using <b>{call?.title ?? 'something'}</b>, and their
        roll is held while this window is open.
      </p>
      <p className="pick-line">
        Play the enemy&rsquo;s card off its block below, paid As a Reaction, then release. A
        movement reaction resolves after the action and never holds the roll, so for one of
        those just stand back.
      </p>
    </Modal>
  );
}
