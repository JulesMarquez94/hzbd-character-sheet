import { viewUrl, isVaultImage } from '../lib/imageViews.js';

/**
 * Whose entry this is, as a face.
 *
 * The portrait was copied into the row when it was written, for the same reason
 * the name was: a character can be redrawn or deleted and the log still has to
 * read. With no portrait it falls back to initials, which is also what every row
 * written before the log carried one will show.
 *
 * The picture is wrapped rather than being the frame itself, because a picture
 * that was never cropped for this frame has to crop harder than `object-fit`
 * can on its own: see `.log-face` for what the two boxes do.
 *
 * An uploaded picture is asked for its `face` crop, which is already a face and
 * was framed by its owner in a preview of this very circle, so the frame is told
 * not to zoom it again. Only a link to somebody else's host and a row written
 * before the uploader existed still get the old treatment, which is exactly what
 * it was built for: a standing figure inside a 32px circle.
 *
 * Its own file since 2026-10-10, when the target frames took the same round
 * picture (Jules: "uses the same setup as with images that's used in the log").
 * `className` adds to `log-face` rather than replacing it, so a frame that wants
 * another size keeps the crop rules and only changes the measure.
 */
export default function Face({ name, src, className = '' }) {
  const initials = String(name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  const extra = className ? ` ${className}` : '';

  if (src) {
    return (
      <span className={`log-face${isVaultImage(src) ? ' is-cropped' : ''}${extra}`}>
        <img src={viewUrl(src, 'face')} alt="" loading="lazy" />
      </span>
    );
  }
  return (
    <span className={`log-face is-blank${extra}`} aria-hidden="true">
      {initials}
    </span>
  );
}
