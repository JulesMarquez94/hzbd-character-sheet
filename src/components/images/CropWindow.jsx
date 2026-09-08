import { useState } from 'react';
import Modal from '../Modal.jsx';
import ImageCrop from './ImageCrop.jsx';
import { saveImage } from '../../lib/imageStore.js';
import './images.css';

/**
 * The crop editor in a dialog, and the one call that writes it.
 *
 * Opened from the chooser and from the page at /pictures, which is why it is its
 * own file: both doors lead to the same three frames and the same Save, and a
 * second copy of this would be a second place for the framing to be written
 * slightly differently.
 *
 * `onSaved(record, wasNew)` is where the two callers part company. A new upload
 * is handed straight to the field that opened the chooser, because somebody who
 * has just framed a picture while looking at that field wanted it there. A
 * reframe changes nothing about what anything points at, so its caller only
 * reloads the shelf.
 */
export default function CropWindow({ userId, tier, stage, onClose, onSaved }) {
  const [crops, setCrops] = useState(stage.crops);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setError('');
    setBusy(true);
    try {
      const record = await saveImage({
        userId,
        tier,
        source: stage.source,
        crops,
        id: stage.id,
        withMaster: stage.withMaster,
      });
      onSaved(record, !stage.id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title={stage.id ? 'Reframe your picture' : 'Frame your picture'}
      onClose={busy ? () => {} : onClose}
      /* The default 560 rather than the roomy width, and it opens on top of the
         shelf rather than replacing it. What is in here is one frame, three
         thumbnails and a slider: about 420px of content, which at 900 is a
         third of a dialog of picture and two thirds of nothing. The shelf
         behind it is the one that earns the wider measure, because a shelf is
         something you browse. See the note at the top of Modal.jsx. */
      footer={
        <div className="img-foot">
          <button type="button" className="btn btn-minimal" onClick={onClose} disabled={busy}>
            Back
          </button>
          <button type="button" className="btn btn-copper" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : stage.id ? 'Save the framing' : 'Save and use it'}
          </button>
        </div>
      }
    >
      {error && <div className="form-error">{error}</div>}
      <p className="form-hint img-lead">
        The same picture is drawn in three shapes across the site: a tall card, a wide plate and a
        small face. Drag each one to where you want it, scroll or use the slider to zoom, and all
        three are saved together.
      </p>
      <ImageCrop source={stage.source} crops={crops} onChange={setCrops} disabled={busy} />
    </Modal>
  );
}
