import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import CropWindow from '../components/images/CropWindow.jsx';
import ImageLibrary from '../components/images/ImageLibrary.jsx';
import PremiumNote from '../components/PremiumNote.jsx';
import { useCropStage } from '../components/images/useCropStage.js';
import { useImageShelf } from '../components/images/useImageShelf.js';
import { ACCEPT, IMAGE_BYTES_TYPICAL } from '../lib/imageViews.js';
import { deleteImage } from '../lib/imageStore.js';
import '../components/images/images.css';

/**
 * Every picture this account keeps, and the room it has left.
 *
 * The chooser that opens from a portrait frame shows the same shelf, and for a
 * moment this page did not exist because of that. It has to: a shelf reached
 * only from inside a dialog on a character sheet is a shelf you cannot tidy
 * without opening a character, and the one question it answers here that it
 * cannot answer there is "what is all this, and what is it costing me".
 *
 * Both are built out of the same three parts (useImageShelf, ImageLibrary,
 * CropWindow) so that the count, the bar and the delete cannot mean two
 * different things in two places.
 */
export default function Pictures() {
  const shelf = useImageShelf();
  const crop = useCropStage();
  const fileRef = useRef(null);

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    if (shelf.room <= 0) {
      setError(`Every one of your ${shelf.slots} picture slots is full. Delete one to add another.`);
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
  const roughly = Math.round((shelf.slots * IMAGE_BYTES_TYPICAL) / (1024 * 1024));

  return (
    <main className="container page" style={{ maxWidth: 900 }}>
      <h2 className="section-title">
        <span>Your Pictures</span>
      </h2>

      <div className="panel pics-page">
        <div className="frame">
          <h3 className="frame-heading">The Shelf</h3>
          <p className="form-hint">
            One upload is one picture, whatever shape it started as. It is kept in three: a tall
            card for your dashboard, a wide plate for the character sheet and the cards, and a
            small face for the log and the party bar. You decide where each of the three sits.
          </p>
          <p className="form-hint">
            A picture on this shelf can be used on any character, minion, feral form, forged item,
            creature or campaign you own, as many times as you like. Using the same one twice
            costs nothing.
          </p>

          {shown && <div className="form-error">{shown}</div>}

          <div className="pics-head">
            <button
              type="button"
              className="btn btn-copper"
              disabled={working || !shelf.userId || shelf.room <= 0}
              onClick={() => fileRef.current?.click()}
              title={shelf.room <= 0 ? 'Every picture slot is full' : 'Upload a picture'}
            >
              {crop.busy ? 'Reading…' : 'Upload a picture'}
            </button>
            <span className="form-hint">
              PNG, JPEG, WebP, AVIF or GIF. Whatever you upload is converted and capped, so your
              shelf is about {roughly} MB at its fullest.
            </span>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={onFile}
            aria-hidden="true"
            tabIndex={-1}
          />

          <ImageLibrary
            images={shelf.images}
            usage={shelf.usage}
            count={shelf.count}
            bytes={shelf.bytes}
            slots={shelf.slots}
            loading={shelf.loading}
            busy={working}
            onEdit={(image) => crop.openReframe(shelf.userId, image)}
            onDelete={onDelete}
          />

          {shelf.room <= 0 && (
            <PremiumNote>
              {`Your ${shelf.slots} picture slots are full.`}
            </PremiumNote>
          )}
        </div>

        <div className="frame">
          <h3 className="frame-heading">What Delete Means</h3>
          <p className="form-hint">
            Deleting a picture removes the file. Anything of yours that was using it goes back to
            showing its initials, which is what it showed before you chose one. Nothing else on
            the sheet changes.
          </p>
          <p className="form-hint">
            The label under each picture is where it is used on your own account. If you have
            handed the link to somebody else, or put it in a campaign log, this page cannot see
            that and cannot promise it still works.
          </p>
          <p className="form-hint">
            Reframing is not a new picture. It moves the three frames on the one you already have,
            at the same address, so no slot is spent and nothing has to be chosen again. A page
            somebody already had open can take a few minutes to catch up.
          </p>
        </div>
      </div>

      <p className="form-hint" style={{ marginTop: '1rem' }}>
        Back to <Link to="/dashboard">your characters</Link> or{' '}
        <Link to="/account">account settings</Link>.
      </p>

      {crop.stage && (
        <CropWindow
          userId={shelf.userId}
          tier={shelf.tier}
          stage={crop.stage}
          onClose={crop.close}
          onSaved={() => {
            crop.close();
            shelf.reload();
          }}
        />
      )}
    </main>
  );
}
