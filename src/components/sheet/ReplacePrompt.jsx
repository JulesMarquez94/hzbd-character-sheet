import Modal from '../Modal.jsx';
import { ItemIcon, ItemTags } from './itemParts.jsx';

/**
 * The one question a swap has to ask: the slot is already full, so where does
 * the piece coming off go — into the pack, or nowhere at all?
 *
 * Raised by `useEquipSlots`, which is what every block on the Inventory tab
 * equips through.
 */
export default function ReplacePrompt({ slotLabel, outgoing, incoming, onKeep, onDiscard, onCancel }) {
  return (
    <Modal
      title={`Replace — ${slotLabel}`}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn btn-danger btn-sm" onClick={onDiscard}>
            Discard It
          </button>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-copper btn-sm" onClick={onKeep}>
            Send to Inventory
          </button>
        </>
      }
    >
      <div className="replace-prompt">
        <p className="replace-lead">
          <strong>{slotLabel}</strong> is already holding something. Say what happens to it before{' '}
          <strong>{incoming.name}</strong> takes its place.
        </p>

        <div className="replace-row">
          {outgoing && (
            <div className="replace-side">
              <span className="replace-side-label">Coming Off</span>
              <div className="replace-item">
                <ItemIcon item={outgoing} />
                <div className="replace-item-body">
                  <span className="replace-item-name">{outgoing.name}</span>
                  <ItemTags item={outgoing} />
                </div>
              </div>
            </div>
          )}

          <div className="replace-side">
            <span className="replace-side-label">Going On</span>
            <div className="replace-item">
              <ItemIcon item={incoming} />
              <div className="replace-item-body">
                <span className="replace-item-name">{incoming.name}</span>
                <ItemTags item={incoming} />
              </div>
            </div>
          </div>
        </div>

        <p className="replace-note">
          Discarding is permanent — the piece leaves the character sheet entirely.
        </p>
      </div>
    </Modal>
  );
}
