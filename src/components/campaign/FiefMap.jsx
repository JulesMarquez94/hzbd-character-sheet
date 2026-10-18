import { useEffect, useRef } from 'react';
import { ALL, SQ3, islandOf, world } from '../../lib/fiefIsland.js';

/**
 * A small flat map of one island, drawn hex by hex, for choosing where a town
 * is founded. No three.js: the founding screen is shown before the board has
 * been fetched, and a map this size reads better flat anyway.
 *
 * Turned and tilted the way the board's camera looks at the island, from the
 * south-east, so the river that runs across the map runs across the board.
 */

/* A point on the board, as the camera sees it: across, and down the screen. */
const TILT = 0.62;
const view = (x, z) => [(x - z) / Math.SQRT2, ((x + z) / Math.SQRT2) * TILT];

const COLOURS = {
  S: '#2b78c2',
  V: '#46a3e6',
  C: '#d9c094',
  F: '#2f6f3a',
  H: '#8a8d94',
};
const GRASS = ['#78ad4c', '#8fbf5c', '#a6cd70'];

function hexPath(g, x0, z0, r, scale, ox, oy) {
  g.beginPath();
  for (let v = 0; v < 6; v += 1) {
    const a = ((30 + 60 * v) * Math.PI) / 180;
    const [sx, sy] = view(x0 + Math.cos(a) * r, z0 + Math.sin(a) * r);
    const px = ox + sx * scale;
    const py = oy + sy * scale;
    if (v === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
}

export default function FiefMap({ island, width = 240, label }) {
  const canvas = useRef(null);
  const height = Math.round(width * 0.66);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const isl = islandOf(island);
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    cv.width = width * ratio;
    cv.height = height * ratio;
    const g = cv.getContext('2d');
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    g.clearRect(0, 0, width, height);
    const scale = width / 46;
    const r = (2 / SQ3) * 0.98;
    const ox = width / 2;
    const oy = height / 2;
    /* Back to front, so a raised hex is drawn over the one behind it. */
    const order = [...ALL].sort((a, b) => world(a)[0] + world(a)[1] - (world(b)[0] + world(b)[1]));
    for (const h of order) {
      const [x, z] = world(h);
      const t = isl.terr(h);
      let fill = COLOURS[t];
      if (!fill) fill = GRASS[Math.round(isl.level(h) * 2)] ?? GRASS[0];
      if (t === 'H' && isl.hgt(h) > 1.2) fill = '#a3a6ad';
      hexPath(g, x, z, r, scale, ox, oy - (t === 'S' ? 0 : isl.hgt(h)) * scale * 1.1);
      g.fillStyle = fill;
      g.fill();
    }
    /* The Keep, where every town starts. */
    hexPath(g, 0, 0, r, scale, ox, oy);
    g.fillStyle = '#f3c04c';
    g.fill();
  }, [island, width, height]);

  return <canvas ref={canvas} className="fief-map" style={{ width, height }} role="img" aria-label={label} />;
}
