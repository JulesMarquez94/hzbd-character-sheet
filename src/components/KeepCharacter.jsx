import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import Modal from './Modal.jsx';

/**
 * The offer to keep a character that lives on this device.
 *
 * A device-only character (see src/lib/localCharacters.js) is a look at the
 * system with nothing asked for it, and this is where the ask is finally made.
 * It opens in three places: on the sheet when the creation screen hands over,
 * from the "On this device" badge and the Share button on that sheet, and from
 * the dashboard once somebody is signed in and the character is still sitting
 * outside their account.
 *
 * It says two different things depending on who is looking:
 *
 *   signed out   what the character cannot do while it lives here, and that a
 *                free account is what buys the rest. Two links out, both of
 *                which remember where to come back to.
 *   signed in    one button, which moves the row into the account. `onAdopt`
 *                is the caller's, because the sheet has edits to flush first
 *                and the dashboard has two lists to move a card between.
 *
 * `full` is the dashboard telling it the vault has no room, so the button can
 * be refused before the round trip rather than after. The sheet cannot know
 * that cheaply, so it leaves it unset and lets adoptCharacter refuse instead.
 */
export default function KeepCharacter({ character, onClose, onAdopt = null, full = false, from = null }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const name = character?.name || 'This character';
  const back = from ? { from } : undefined;

  async function keep() {
    if (!onAdopt) return;
    setBusy(true);
    setError('');
    try {
      await onAdopt();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <Modal
        title={`Keep ${name}`}
        onClose={onClose}
        footer={
          <>
            <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
              Not now
            </button>
            <Link to="/login" state={back} className="btn btn-sm">
              Log in
            </Link>
            <Link to="/register" state={back} className="btn btn-copper btn-sm">
              Create an account
            </Link>
          </>
        }
      >
        <p>
          <strong>{name}</strong> is saved in this browser, on this device. The link opens nowhere
          else and the character cannot sit at a table. Clearing the browser&rsquo;s data takes them
          with it.
        </p>
        <p className="form-hint" style={{ marginTop: '0.8rem' }}>
          Create a free account and save the character to it. The sheet gets a link anyone can
          read, follows you to any device and can join a campaign. Nothing you have made here is
          lost on the way: the character waits on this device until you save them.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title={`Save ${name} To Your Account`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose} disabled={busy}>
            Not now
          </button>
          <button
            type="button"
            className="btn btn-copper btn-sm"
            onClick={keep}
            disabled={busy || full || !onAdopt}
          >
            {busy ? 'Saving…' : 'Save to my account'}
          </button>
        </>
      }
    >
      <p>
        <strong>{name}</strong> is saved in this browser only. Saved to your account, the sheet gets
        a link anyone can read, follows you to any device and can sit at a table. The copy on this
        device is removed once the account has it.
      </p>
      {full && (
        <p className="form-error" style={{ marginTop: '0.9rem', marginBottom: 0 }}>
          Your vault is full. Delete a character there before saving this one.
        </p>
      )}
      {error && (
        <p className="form-error" style={{ marginTop: '0.9rem', marginBottom: 0 }}>
          {error}
        </p>
      )}
    </Modal>
  );
}
