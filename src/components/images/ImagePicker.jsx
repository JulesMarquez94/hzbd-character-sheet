import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../Modal.jsx';
import CropWindow from './CropWindow.jsx';
import ImageLibrary from './ImageLibrary.jsx';
import { useCropStage } from './useCropStage.js';
import { useImageShelf } from './useImageShelf.js';
import { ACCEPT } from '../../lib/imageViews.js';
import { deleteImage } from '../../lib/imageStore.js';
import './images.css';

/**
 * Choosing a picture: the shelf, and the way onto it.
 *
 * Opened from every portrait frame on the site, and it is the same dialog every
 * time, because a picture belongs to the account rather than to the thing it is
 * on. One upload can be a character's portrait, a campaign's card and a
 * creature's plate at once, and none of those three knows about the others.
 *
 * The crop editor is a dialog of its own on top of this one (see CropWindow),
 * which is what lets Back mean "back to the shelf" rather than "lose the file
 * you just chose".
 */
export default function ImagePicker({ onClose, onPick, current = null }) {
  const shelf = useImageShelf();
  const crop = useCropStage();
  const fileRef = useRef(null);

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function onFile(event) {
    const file = event.target.files?.[0];
    /* The same file twice running is a real thing somebody does after deleting
       it by mistake, and an unchanged input value fires no event. */
    event.target.value = '';
    if (!file) return;

    setError('');
    if (shelf.room <= 0) {
      setError(
        `Every one of your ${shelf.slots} picture slots is full. Delete one to add another.`
      );
      return;
    }
    crop.openFile(file);
  }

  async function onDelete(image) {
    setError('');
    setBusy(true);
    try {
      await deleteImage(shelf.userId, image.id);
      await shelf.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const working = busy || crop.busy;
  const shown = error || crop.error || shelf.error;

  return (
    <>
      <Modal
        title="Your pictures"
        onClose={onClose}
        wide
        action={
          shelf.userId ? (
            <button
              type="button"
              className="btn btn-copper btn-sm"
              disabled={working || shelf.room <= 0}
              onClick={() => fileRef.current?.click()}
              title={shelf.room <= 0 ? 'Every picture slot is full' : 'Upload a picture'}
            >
              {crop.busy ? 'Reading…' : 'Upload a picture'}
            </button>
          ) : null
        }
        footer={
          <div className="img-foot">
            <Link className="btn btn-minimal" to="/pictures" onClick={onClose}>
              Manage pictures
            </Link>
            <button type="button" className="btn btn-minimal" onClick={onClose}>
              Close
            </button>
          </div>
        }
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={onFile}
          aria-hidden="true"
          tabIndex={-1}
        />

        {shown && <div className="form-error">{shown}</div>}

        {shelf.userId ? (
          <ImageLibrary
            images={shelf.images}
            usage={shelf.usage}
            count={shelf.count}
            bytes={shelf.bytes}
            slots={shelf.slots}
            loading={shelf.loading}
            busy={working}
            current={current}
            onPick={(image) => {
              onPick(image.url);
              onClose();
            }}
            onEdit={(image) => crop.openReframe(shelf.userId, image)}
            onDelete={onDelete}
          />
        ) : (
          <p className="form-hint">
            Pictures are kept with your account. <Link to="/login">Sign in</Link> to upload one.
          </p>
        )}
      </Modal>

      {crop.stage && (
        <CropWindow
          userId={shelf.userId}
          tier={shelf.tier}
          stage={crop.stage}
          onClose={crop.close}
          onSaved={(record, wasNew) => {
            crop.close();
            if (wasNew) {
              onPick(record.url);
              onClose();
              return;
            }
            shelf.reload();
          }}
        />
      )}
    </>
  );
}
