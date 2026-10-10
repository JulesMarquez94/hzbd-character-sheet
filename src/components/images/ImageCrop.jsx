import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { VIEWS, getView } from '../../lib/imageViews.js';
import { defaultCrop, frameGeometry, panCrop, zoomCrop, zoomMax } from '../../lib/imageCrop.js';
import './images.css';

/**
 * Where the picture sits in each of the three frames, dragged rather than typed.
 *
 * One picture, three shapes, and the player decides all three: a tall card, a
 * wide plate and a face the size of a fingernail. The three are shown at once as
 * live thumbnails down the side, and the one being worked on is shown large. So
 * pulling the face down to the eyes does not quietly ruin the dashboard card,
 * because the dashboard card is right there while you do it.
 *
 * ------------------------------------------------------------------ the surface
 * Drag to move, and every way a person might expect to zoom: the wheel over the
 * frame, the slider under it, plus the arrow keys and +/- once it has focus. The
 * frame is what takes the focus rather than the picture, because the picture is
 * the thing being moved inside it.
 *
 * A crop can never see past the edge of the picture. That is not enforced here,
 * it is enforced in src/lib/imageCrop.js by every read of a crop going through
 * the clamp, which is why a drag that runs off the end simply stops instead of
 * pulling a band of empty into frame.
 */

/** The stage's own measure. The frame is the largest rectangle of the view's
    shape that fits inside it, so all three views get the same footprint on the
    page and nothing moves when you switch between them. */
const STAGE_MAX = 320;
const STAGE_TALL = 1.2;

const THUMB = { portrait: 45, plate: 84, face: 62 };

/** One frame with the picture placed in it. The whole of what a crop looks like,
    used at 320px for the stage and at 45 for a thumbnail. */
function CropFrame({ source, view, crop, width, round = false, className = '' }) {
  const geometry = frameGeometry(source, view, crop, width);
  const height = Math.round(width / (view.w / view.h));

  return (
    <span
      className={`crop-frame${round ? ' is-round' : ''}${className ? ` ${className}` : ''}`}
      style={{ width, height }}
    >
      <img
        src={source.url}
        alt=""
        draggable={false}
        style={{
          width: geometry.width,
          height: geometry.height,
          left: geometry.left,
          top: geometry.top,
        }}
      />
    </span>
  );
}

export default function ImageCrop({ source, crops, onChange, disabled = false }) {
  const [activeId, setActiveId] = useState(VIEWS[0].id);
  const view = getView(activeId);
  const crop = crops[view.id] ?? defaultCrop();

  /* The stage is measured rather than assumed: 320 on a desktop, whatever the
     dialog leaves on a phone. The geometry is in pixels, so a guess here is a
     crop that does not match the frame it was dragged in. */
  const stageRef = useRef(null);
  const [stageW, setStageW] = useState(STAGE_MAX);
  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    const measure = () => setStageW(Math.max(150, Math.min(STAGE_MAX, node.clientWidth)));
    measure();
    if (typeof ResizeObserver !== 'function') return undefined;
    const watch = new ResizeObserver(measure);
    watch.observe(node);
    return () => watch.disconnect();
  }, []);

  const ratio = view.w / view.h;
  const frameW = Math.round(Math.min(stageW, stageW * STAGE_TALL * ratio));
  const top = zoomMax(source, view);

  const write = useCallback(
    (next) => onChange({ ...crops, [view.id]: next }),
    [crops, onChange, view.id]
  );

  /* ---------------------------------------------------------------- dragging */
  const dragFrom = useRef(null);
  const frameRef = useRef(null);

  function onPointerDown(event) {
    if (disabled) return;
    dragFrom.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!dragFrom.current) return;
    const dx = event.clientX - dragFrom.current.x;
    const dy = event.clientY - dragFrom.current.y;
    if (!dx && !dy) return;
    dragFrom.current = { x: event.clientX, y: event.clientY };
    write(panCrop(source, view, crop, dx, dy, frameW));
  }

  function endDrag() {
    dragFrom.current = null;
  }

  /* The wheel, on a listener of our own. React's own onWheel is passive, so
     preventDefault inside it is ignored and the dialog scrolls out from under
     the frame while you are zooming into it. */
  useEffect(() => {
    const node = frameRef.current;
    if (!node || disabled) return undefined;

    function onWheel(event) {
      event.preventDefault();
      const step = event.deltaY < 0 ? 1.08 : 1 / 1.08;
      write(zoomCrop(source, view, crop, (Number(crop.zoom) || 1) * step));
    }

    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [crop, disabled, source, view, write]);

  function onKeyDown(event) {
    if (disabled) return;
    const nudge = event.shiftKey ? 24 : 6;
    const moves = {
      ArrowLeft: [nudge, 0],
      ArrowRight: [-nudge, 0],
      ArrowUp: [0, nudge],
      ArrowDown: [0, -nudge],
    };
    if (moves[event.key]) {
      event.preventDefault();
      const [dx, dy] = moves[event.key];
      write(panCrop(source, view, crop, dx, dy, frameW));
      return;
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      write(zoomCrop(source, view, crop, (Number(crop.zoom) || 1) * 1.12));
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      write(zoomCrop(source, view, crop, (Number(crop.zoom) || 1) / 1.12));
    }
  }

  return (
    <div className="crop-editor">
      {/* The three shapes at once, and the switch between them. */}
      <div className="crop-views" role="tablist" aria-label="The three shapes">
        {VIEWS.map((one) => (
          <button
            key={one.id}
            type="button"
            role="tab"
            aria-selected={one.id === view.id}
            className={`crop-view${one.id === view.id ? ' is-active' : ''}`}
            onClick={() => setActiveId(one.id)}
          >
            <CropFrame
              source={source}
              view={one}
              crop={crops[one.id] ?? defaultCrop()}
              width={THUMB[one.id] ?? 60}
              round={one.round}
            />
            <span className="crop-view-name">{one.label}</span>
          </button>
        ))}
      </div>

      <div className="crop-stage" ref={stageRef}>
        <div
          className="crop-hold"
          ref={frameRef}
          tabIndex={disabled ? -1 : 0}
          aria-label={`${view.label}: drag to move, scroll to zoom`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onKeyDown={onKeyDown}
        >
          <CropFrame
            source={source}
            view={view}
            crop={crop}
            width={frameW}
            round={view.round}
            className="crop-big"
          />
        </div>

        <p className="crop-where">{view.where}</p>

        <div className="crop-zoom">
          <label className="crop-zoom-label" htmlFor="crop-zoom">
            Zoom
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={Math.max(1.01, top)}
            step={0.01}
            disabled={disabled || top <= 1}
            value={Math.min(Number(crop.zoom) || 1, top)}
            onChange={(event) => write(zoomCrop(source, view, crop, Number(event.target.value)))}
          />
          <button
            type="button"
            className="btn btn-minimal btn-sm"
            disabled={disabled}
            onClick={() => write(defaultCrop())}
          >
            Reset
          </button>
        </div>

        {top <= 1 && (
          <p className="form-hint">
            This picture is too small to zoom into any further without inventing pixels.
          </p>
        )}
      </div>
    </div>
  );
}
