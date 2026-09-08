/**
 * Where the picture sits inside each frame, and the canvas work that bakes it.
 *
 * Two halves, both pure of anything to do with accounts or storage: the maths
 * the editor drags around, and the encoder that turns the result into the four
 * files described in src/lib/imageViews.js.
 *
 * ------------------------------------------------------------------ the model
 * A crop is three numbers and never a rectangle in pixels:
 *
 *   zoom   1 is "the frame is filled and nothing is thrown away that does not
 *          have to be". Above 1 is closer in. Never below.
 *   x, y   where the middle of the frame lands on the picture, as a fraction of
 *          it. 0.5, 0.5 is dead centre.
 *
 * Fractions rather than pixels because the same three numbers have to mean the
 * same framing on the original a phone camera made, on the 1280px master kept
 * afterwards, and in a 216px preview on screen. A rectangle in pixels means a
 * different picture in each of those.
 *
 * The clamp is the other half of it: a crop can never see past the edge of the
 * picture, so `x` and `y` are held inside whatever margin the current zoom
 * leaves. That is what stops a drag from pulling a band of empty into a frame,
 * and it is why every read of a crop goes through cropRect() rather than
 * trusting the stored numbers.
 *
 * -------------------------------------------------------------- the top bias
 * A default crop is anchored at the **top**, not the middle. Faces are at the
 * top of pictures of people, and this is the same rule the CSS has always
 * followed with `object-position: 50% 0`: what a crop gives up is the boots.
 * The player can drag it anywhere; this is only where it starts.
 */
import { MASTER_EDGE, OBJECT_BYTES_MAX, SOURCE_BYTES_MAX, SOURCE_PIXELS_MAX, VIEWS } from './imageViews.js';

function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

/* ------------------------------------------------------------------ the maths */

/** What one crop looks like before anybody touches it. */
export function defaultCrop() {
  return { zoom: 1, x: 0.5, y: 0 };
}

/** A full set, one per view. */
export function defaultCrops() {
  return Object.fromEntries(VIEWS.map((view) => [view.id, defaultCrop()]));
}

/**
 * A crop set read back off meta.json, repaired rather than trusted.
 *
 * Storage is a file a browser wrote and a browser can be made to write
 * anything, so a missing view, a string where a number belongs and a zoom of
 * `Infinity` all have to come out as a usable crop instead of a blank frame.
 */
export function normalizeCrops(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) return defaultCrops();

  const out = {};
  for (const view of VIEWS) {
    const raw = source[view.id];
    const fallback = defaultCrop();
    if (!raw || typeof raw !== 'object') {
      out[view.id] = fallback;
      continue;
    }
    const number = (input, or) => (Number.isFinite(Number(input)) ? Number(input) : or);
    out[view.id] = {
      zoom: Math.max(1, number(raw.zoom, fallback.zoom)),
      x: clamp(number(raw.x, fallback.x), 0, 1),
      y: clamp(number(raw.y, fallback.y), 0, 1),
    };
  }
  return out;
}

/**
 * The biggest rectangle of the frame's shape that fits inside the picture. This
 * is what zoom 1 means, and everything else is measured against it.
 */
export function coverWindow(source, view) {
  const ratio = view.w / view.h;
  const own = source.width / source.height;
  return own > ratio
    ? { w: source.height * ratio, h: source.height }
    : { w: source.width, h: source.width / ratio };
}

/**
 * How far in the editor lets you go.
 *
 * Not a taste decision: past the point where the crop is smaller than half the
 * file being written, the extra pixels are the browser's invention rather than
 * the photograph's. A small picture therefore gets no zoom at all, which is
 * honest, and a large one gets a lot.
 */
export function zoomMax(source, view) {
  const base = coverWindow(source, view);
  return Math.max(1, Math.min(6, base.w / (view.w / 2)));
}

/**
 * The crop as a rectangle on the picture, in its own pixels, clamped so it is
 * always wholly inside it. `cx`/`cy` come back out because the clamp may have
 * moved them and the editor's slider has to show where they actually landed.
 */
export function cropRect(source, view, crop) {
  const base = coverWindow(source, view);
  const zoom = clamp(Number(crop?.zoom) || 1, 1, zoomMax(source, view));
  const w = base.w / zoom;
  const h = base.h / zoom;

  const halfX = w / 2 / source.width;
  const halfY = h / 2 / source.height;
  const cx = clamp(Number.isFinite(Number(crop?.x)) ? Number(crop.x) : 0.5, halfX, 1 - halfX);
  const cy = clamp(Number.isFinite(Number(crop?.y)) ? Number(crop.y) : 0, halfY, 1 - halfY);

  return { x: cx * source.width - w / 2, y: cy * source.height - h / 2, w, h, zoom, cx, cy };
}

/** The stored form of whatever the editor is currently showing. */
export function normalizeCrop(source, view, crop) {
  const rect = cropRect(source, view, crop);
  return { zoom: rect.zoom, x: rect.cx, y: rect.cy };
}

/**
 * Where to put the picture inside a frame `frameW` wide, in CSS pixels.
 *
 * The frame is a box with `overflow: hidden` and the picture is one absolutely
 * positioned image inside it, drawn at whatever size makes the crop's rectangle
 * exactly fill the box. No transforms: a transform and a clamp disagree about
 * what "left" means the moment the picture is also the drag surface.
 */
export function frameGeometry(source, view, crop, frameW) {
  const rect = cropRect(source, view, crop);
  const k = frameW / rect.w;
  return {
    scale: k,
    width: source.width * k,
    height: source.height * k,
    left: -rect.x * k,
    top: -rect.y * k,
  };
}

/** A drag, in CSS pixels of the preview, as the crop it lands on. */
export function panCrop(source, view, crop, dx, dy, frameW) {
  const rect = cropRect(source, view, crop);
  const k = frameW / rect.w;
  return normalizeCrop(source, view, {
    zoom: rect.zoom,
    x: rect.cx - dx / (k * source.width),
    y: rect.cy - dy / (k * source.height),
  });
}

/** A zoom, held to what the picture can actually pay for, keeping the middle of
    the frame on the same part of the picture. */
export function zoomCrop(source, view, crop, zoom) {
  const rect = cropRect(source, view, crop);
  return normalizeCrop(source, view, { zoom, x: rect.cx, y: rect.cy });
}

/* ----------------------------------------------------------------- the intake */

/**
 * Read a file the player chose, and hand back everything both halves need: a
 * URL the editor can put in an `<img>`, the size, and a decoded bitmap the
 * encoder draws from.
 *
 * `imageOrientation: 'from-image'` matters more than it looks. A photograph off
 * a phone carries its rotation in EXIF rather than in its pixels, an `<img>`
 * applies it and a bare `createImageBitmap` does not. Without this the editor
 * would show an upright portrait and write a picture lying on its side.
 */
export async function decodeSource(file) {
  if (!file) throw new Error('No picture was chosen.');
  if (file.size > SOURCE_BYTES_MAX) {
    throw new Error(
      `That file is ${megabytes(file.size)} MB. Pictures have to be under ${megabytes(SOURCE_BYTES_MAX)} MB.`
    );
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    /* Either the option is not understood or the file is not a picture. The
       plain call tells the two apart: if this works, it was the option. */
    bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) throw new Error('That file could not be read as a picture.');
  }

  if (bitmap.width * bitmap.height > SOURCE_PIXELS_MAX) {
    bitmap.close?.();
    throw new Error('That picture has too many pixels for a browser to work on. Scale it down first.');
  }

  return {
    bitmap,
    width: bitmap.width,
    height: bitmap.height,
    url: URL.createObjectURL(file),
    release() {
      bitmap.close?.();
      URL.revokeObjectURL(this.url);
    },
  };
}

/** The same, for a master already in storage, so a picture can be re-cropped
    without asking the player to find the original again. */
export async function decodeBlob(blob) {
  return decodeSource(blob);
}

function megabytes(bytes) {
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}

/* ---------------------------------------------------------------- the encoder */

function makeCanvas(width, height) {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function toWebp(canvas, quality) {
  const blob = canvas.convertToBlob
    ? await canvas.convertToBlob({ type: 'image/webp', quality })
    : await new Promise((resolve, reject) => {
        canvas.toBlob(
          (made) => (made ? resolve(made) : reject(new Error('This browser could not encode the picture.'))),
          'image/webp',
          quality
        );
      });

  /* A browser with no WebP encoder does not fail, it quietly hands back a PNG.
     Storage only takes WebP, so catching it here turns a confusing rejection
     into a sentence. */
  if (blob.type !== 'image/webp') {
    throw new Error('This browser cannot make WebP pictures. Try Chrome, Firefox or Safari.');
  }
  return blob;
}

/**
 * Draw part of the source into a canvas of exactly `outW` x `outH`.
 *
 * In two steps when the reduction is steep. `drawImage` filters well over a 2x
 * reduction and badly over an 8x one: a 4000px photograph taken straight down to
 * a 512px face comes out crunchy, because the browser samples rather than
 * averages. One intermediate at twice the output fixes it, and twice the output
 * is a bounded amount of memory however large the original was.
 */
function renderCrop(source, rect, outW, outH) {
  let from = source.bitmap;
  let box = rect;

  if (rect.w > outW * 2) {
    const midW = Math.max(1, Math.round(outW * 2));
    const midH = Math.max(1, Math.round(outH * 2));
    const mid = makeCanvas(midW, midH);
    const midCtx = mid.getContext('2d');
    midCtx.imageSmoothingEnabled = true;
    midCtx.imageSmoothingQuality = 'high';
    midCtx.drawImage(source.bitmap, rect.x, rect.y, rect.w, rect.h, 0, 0, midW, midH);
    from = mid;
    box = { x: 0, y: 0, w: midW, h: midH };
  }

  const canvas = makeCanvas(outW, outH);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(from, box.x, box.y, box.w, box.h, 0, 0, outW, outH);
  return canvas;
}

/**
 * The quality ladder.
 *
 * One object may not pass OBJECT_BYTES_MAX, which the bucket enforces and this
 * has to respect. 0.82 is under it for anything a camera makes; the two steps
 * below exist for the pathological case (noise, grain, a photograph of a
 * forest) and are still better than a refusal.
 */
const QUALITY = [0.82, 0.7, 0.58];

async function encodeUnderCap(canvas) {
  let last = null;
  for (const quality of QUALITY) {
    last = await toWebp(canvas, quality);
    if (last.size <= OBJECT_BYTES_MAX) return last;
  }
  if (last && last.size > OBJECT_BYTES_MAX) {
    throw new Error('That picture will not compress small enough. Try a smaller or simpler one.');
  }
  return last;
}

/** One baked crop, ready to upload. */
export async function encodeView(source, view, crop) {
  const rect = cropRect(source, view, crop);
  return encodeUnderCap(renderCrop(source, rect, view.w, view.h));
}

/**
 * The master: the whole picture, no crop, longest edge capped.
 *
 * Nothing ever draws this. It is kept so the three crops can be moved later
 * without the player having to find the file again, which is the difference
 * between an upload being a decision and being a commitment.
 */
export async function encodeMaster(source) {
  const edge = Math.max(source.width, source.height);
  const scale = edge > MASTER_EDGE ? MASTER_EDGE / edge : 1;
  const outW = Math.max(1, Math.round(source.width * scale));
  const outH = Math.max(1, Math.round(source.height * scale));
  const rect = { x: 0, y: 0, w: source.width, h: source.height };
  return encodeUnderCap(renderCrop(source, rect, outW, outH));
}
