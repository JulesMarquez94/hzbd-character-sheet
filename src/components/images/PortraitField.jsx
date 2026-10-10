import { useState } from 'react';
import { Link } from 'react-router-dom';
import ImagePicker from './ImagePicker.jsx';
import { useAuth } from '../../context/auth-context.js';
import { viewUrl } from '../../lib/imageViews.js';
import './images.css';

/**
 * The one field that puts a picture on something.
 *
 * It replaced seven copies of the same paste-a-link input: the character's
 * portrait, a minion's, a feral form's, a forged creature's, a forged item's and
 * a campaign's card in both of the places one is made. All seven asked for a URL
 * and none of them could crop it, which is why the same picture looked wrong in
 * at least one of the three frames it ended up in.
 *
 * `view` is the shape *this* frame shows. It changes nothing about what is
 * stored: every field stores the same canonical URL, and the frame it is drawn
 * in decides which of the three baked crops to ask for. See src/lib/imageViews.js.
 *
 * -------------------------------------------------------------- with no account
 * A character kept on a device has no account behind it and therefore nowhere to
 * put a picture. It says so, with the way in, rather than offering a field that
 * cannot work. A picture already on such a sheet still draws, and can still be
 * taken off.
 */
export default function PortraitField({
  label = 'Picture',
  view = 'portrait',
  value = null,
  onChange,
  readOnly = false,
  round = false,
  hint = null,
  id = null,
}) {
  const { user } = useAuth();
  const [picking, setPicking] = useState(false);
  const shown = viewUrl(value, view);

  return (
    <div className="pf-field">
      <span className="form-label" id={id ? `${id}-label` : undefined}>
        {label}
      </span>

      <div className="pf-row">
        <span
          className={`pf-frame is-${view}${round ? ' is-round' : ''}${shown ? '' : ' is-empty'}`}
        >
          {shown ? <img src={shown} alt="" /> : <span className="pf-empty">No picture</span>}
        </span>

        <div className="pf-side">
          {readOnly ? (
            <p className="form-hint">{shown ? 'A picture is set.' : 'No picture.'}</p>
          ) : user ? (
            <>
              <div className="pf-acts">
                <button type="button" className="btn btn-sm" onClick={() => setPicking(true)}>
                  {shown ? 'Change picture' : 'Choose a picture'}
                </button>
                {value && (
                  <button
                    type="button"
                    className="btn btn-minimal btn-sm"
                    onClick={() => onChange(null)}
                    title="Take the picture off. It stays on your shelf."
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="form-hint">
                {hint ?? 'Upload one and frame it for all three shapes. It stays on your shelf and can be used again.'}
              </p>
            </>
          ) : (
            <>
              {value && (
                <div className="pf-acts">
                  <button
                    type="button"
                    className="btn btn-minimal btn-sm"
                    onClick={() => onChange(null)}
                  >
                    Remove
                  </button>
                </div>
              )}
              <p className="form-hint">
                Pictures are kept with your account. <Link to="/login">Sign in</Link> to upload
                one, or <Link to="/register">make an account</Link>.
              </p>
            </>
          )}
        </div>
      </div>

      {picking && (
        <ImagePicker
          current={value}
          onClose={() => setPicking(false)}
          onPick={(url) => onChange(url)}
        />
      )}
    </div>
  );
}
