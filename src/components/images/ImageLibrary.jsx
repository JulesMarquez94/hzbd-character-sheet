import { useState } from 'react';
import { Link } from 'react-router-dom';
import { imageIdOf, viewUrl } from '../../lib/imageViews.js';
import './images.css';

/**
 * The shelf, drawn: every picture this account keeps, how full it is and the
 * three things that can be done to one.
 *
 * Presentational and nothing else. It is shown in two places (the page at
 * /pictures and the chooser that opens from a portrait frame) and neither of
 * them is allowed to have its own idea of what a picture is or what the ceiling
 * says, so both hand this the same shelf out of useImageShelf.
 *
 * `onPick` is the only difference between the two: with it, a tile is a button
 * that chooses. Without it, a tile is just a tile.
 *
 * ------------------------------------------------------------- the delete step
 * Deleting asks first, in the tile, rather than opening a dialog. The chooser is
 * itself a dialog and a dialog over a dialog is one Escape from losing both. It
 * also keeps the answer where the question is: the tile says what the picture is
 * being used by, and that sentence is the whole of what a person needs in order
 * to decide.
 */

function megabytes(bytes) {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb < 0.1 ? `${Math.round(bytes / 1024)} KB` : `${mb.toFixed(1)} MB`;
}

/** "Thalira", "Thalira and 2 more", or nothing at all. */
function usedLine(entries) {
  if (!entries?.length) return null;
  const [first, ...rest] = entries;
  if (!rest.length) return first.name;
  return `${first.name} and ${rest.length} more`;
}

/**
 * The tile's own copy of the address, with the picture's timestamp on it.
 *
 * A re-crop writes new files to the same addresses, so nothing anywhere is
 * pointing at a stale URL: it is pointing at a stale *cache*. Everywhere else on
 * the site that resolves itself in five minutes (see the note on cacheControl in
 * src/lib/imageStore.js), but not here. Somebody who has just dragged three
 * frames around has to see the result, so the shelf asks for the version it just
 * listed. Nothing stored ever carries this.
 */
function freshUrl(url, updated) {
  const stamp = Date.parse(updated ?? '') || 0;
  if (!url || !stamp) return url;
  return `${url}${url.includes('?') ? '&' : '?'}t=${stamp}`;
}

function Tile({ image, used, chosen, onPick, onEdit, onDelete, busy }) {
  const [asking, setAsking] = useState(false);
  const line = usedLine(used);
  const plate = freshUrl(viewUrl(image.url, 'portrait'), image.updated);

  return (
    <li className={`img-tile${chosen ? ' is-chosen' : ''}`}>
      {onPick ? (
        <button
          type="button"
          className="img-tile-plate"
          onClick={() => onPick(image)}
          disabled={busy}
          title={chosen ? 'Already on this frame' : 'Use this picture'}
        >
          <img src={plate} alt="" loading="lazy" />
          {chosen && <span className="img-tile-chosen">In use here</span>}
        </button>
      ) : (
        <span className="img-tile-plate">
          <img src={plate} alt="" loading="lazy" />
        </span>
      )}

      <span className="img-tile-foot">
        {line ? (
          <span className="img-tile-used" title={used.map((one) => one.name).join(', ')}>
            {used[0].href ? (
              <Link to={used[0].href} onClick={(event) => event.stopPropagation()}>
                {line}
              </Link>
            ) : (
              line
            )}
          </span>
        ) : (
          <span className="img-tile-used muted">Not used yet</span>
        )}
        <span className="img-tile-size">{megabytes(image.bytes)}</span>
      </span>

      {asking ? (
        <span className="img-tile-ask">
          <span className="img-tile-ask-line">
            {line ? `Delete it? ${line} loses the picture.` : 'Delete it?'}
          </span>
          <span className="img-tile-acts">
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={busy}
              onClick={() => {
                setAsking(false);
                onDelete(image);
              }}
            >
              Delete
            </button>
            <button
              type="button"
              className="btn btn-minimal btn-sm"
              disabled={busy}
              onClick={() => setAsking(false)}
            >
              Keep
            </button>
          </span>
        </span>
      ) : (
        <span className="img-tile-acts">
          {onPick && (
            <button
              type="button"
              className="btn btn-sm"
              disabled={busy}
              onClick={() => onPick(image)}
            >
              Use
            </button>
          )}
          <button
            type="button"
            className="btn btn-minimal btn-sm"
            disabled={busy || !image.canRecrop}
            title={
              image.canRecrop
                ? 'Move the three frames on this picture'
                : 'The original of this picture is gone, so its framing cannot be changed'
            }
            onClick={() => onEdit(image)}
          >
            Reframe
          </button>
          <button
            type="button"
            className="btn btn-minimal btn-sm"
            disabled={busy}
            onClick={() => setAsking(true)}
          >
            Delete
          </button>
        </span>
      )}
    </li>
  );
}

export default function ImageLibrary({
  images,
  usage,
  count,
  bytes,
  slots,
  loading,
  busy = false,
  current = null,
  onPick = null,
  onEdit,
  onDelete,
}) {
  const currentId = imageIdOf(current);
  const full = count >= slots;

  return (
    <div className="img-library">
      <div className="img-meter">
        <span className="img-meter-head">
          <span className="form-label">Pictures</span>
          <span className={`img-meter-count${full ? ' is-full' : ''}`}>
            {count} / {slots}
          </span>
        </span>
        <span className="img-bar">
          <span
            className={`img-bar-fill${full ? ' is-full' : ''}`}
            style={{ width: `${slots ? Math.min(100, (count / slots) * 100) : 0}%` }}
          />
        </span>
        <span className="img-meter-note">
          {megabytes(bytes)} kept.{' '}
          {full
            ? 'Every slot is full. Delete one to upload another.'
            : `Room for ${slots - count} more.`}
        </span>
      </div>

      {loading && <p className="form-hint">Reading your pictures…</p>}

      {!loading && images.length === 0 && (
        <p className="form-hint">
          Nothing here yet. Upload a picture and it can be used on any character, creature or
          campaign you own.
        </p>
      )}

      {images.length > 0 && (
        <ul className="img-grid">
          {images.map((image) => (
            <Tile
              key={image.id}
              image={image}
              used={usage?.get(image.id)}
              chosen={image.id === currentId}
              onPick={onPick}
              onEdit={onEdit}
              onDelete={onDelete}
              busy={busy}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
