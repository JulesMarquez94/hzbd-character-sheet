/**
 * The Fief's island: a hex board floating in empty space, and what lies on
 * every hex of it.
 *
 * Jules, 2026-10-18: "use the hexagon format from kaykit ... the terrain as
 * well", and then, after the Village pack was tried and set aside, "redo it
 * with a kkit one". So the board is KayKit's own Medieval Hexagon Pack, and the
 * ground here is laid out so every hex can be drawn with one of its tiles.
 *
 * ------------------------------------------------------------------ the grid
 * Pointy-top hexes in axial coordinates [q, r], the Keep at [0, 0]. A hex is 2
 * units across its flats, so the centre of [q, r] is at x = 2q + r, z = √3·r.
 * Neighbour i sits at i × 60 degrees: 0 east, 1 south-east, and on round. The
 * island is every hex within RADIUS of the Keep.
 *
 * ------------------------------------------------------------------ the land
 * One island for now, read off the same curves the previews used: the sea to
 * the east, high ground at the back, woods on the west, a river running down to
 * the sea and a clearing at the edge of the woods. Everything is worked out from
 * the coordinates, so every screen at every table lays the same island without
 * a byte of it being stored. A second island is a second set of curves.
 *
 * The kit draws a shore with sea on one, two, three or four edges in a row and
 * nothing else, so a shore it cannot draw is made sea instead. The board and the
 * rules then always agree about where the water is.
 */

export const RADIUS = 10;
export const WALL_RING = 5;
export const SQ3 = Math.sqrt(3);
export const DIRS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];

export const hk = (h) => `${h[0]},${h[1]}`;
export const unk = (k) => k.split(',').map(Number);
export const nb = (h, i) => {
  const d = DIRS[((i % 6) + 6) % 6];
  return [h[0] + d[0], h[1] + d[1]];
};
export const hdist = (a, b) => {
  const dq = a[0] - b[0];
  const dr = a[1] - b[1];
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
};
export const inmap = (h) => hdist(h, [0, 0]) <= RADIUS;
export const world = (h) => [2 * h[0] + h[1], SQ3 * h[1]];
export const touches = (h, test) => DIRS.some((_, i) => test(nb(h, i)));

/** The board as seen from the south-east, the way the camera looks at it. */
const screen = (h) => {
  const w = world(h);
  return [(w[0] - w[1]) / Math.SQRT2, (w[0] + w[1]) / Math.SQRT2];
};

/** A number per hex for the looks: which roof, which tree, which name. */
export const hsh = (h) => ((h[0] * 92821 + h[1] * 68917) & 0xffffff) >>> 0;

export function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** The hexes exactly `rad` steps from `c`, walked round from the north. */
export function ring(rad, c = [0, 0]) {
  if (!rad) return [c];
  const out = [];
  let h = [c[0] + DIRS[4][0] * rad, c[1] + DIRS[4][1] * rad];
  for (let i = 0; i < 6; i += 1) {
    for (let j = 0; j < rad; j += 1) {
      out.push(h);
      h = nb(h, i);
    }
  }
  return out;
}

/** The hex under a point on the board. */
export function axial(x, z) {
  const r = z / SQ3;
  const q = (x - r) / 2;
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return [rq, rr];
}

export const ALL = [];
for (let q = -RADIUS; q <= RADIUS; q += 1) {
  for (let r = -RADIUS; r <= RADIUS; r += 1) if (inmap([q, r])) ALL.push([q, r]);
}

/**
 * Which hex edges each kit tile joins, read off the tiles themselves by
 * sampling their geometry (the hexprobe of 2026-10-18). A tile turned k sixths
 * joins edge i - k. The walls are KayKit's straight piece and its two corners,
 * the wide one at 120 degrees and the sharp one at 60.
 */
export const FAM = {
  road: { A: [0, 3], B: [3, 5], C: [3, 4], D: [1, 3, 5], E: [0, 3, 5], F: [0, 1, 3], G: [2, 3, 4], H: [0, 2, 3, 4], I: [1, 2, 4, 5], J: [0, 1, 2, 3], K: [1, 2, 3, 4, 5], L: [0, 1, 2, 3, 4, 5], M: [3] },
  river: { A: [0, 3], B: [3, 5], C: [3, 4], D: [1, 3, 5], E: [0, 3, 5], F: [0, 1, 3], G: [2, 3, 4], H: [0, 2, 3, 4], I: [1, 2, 4, 5], J: [0, 1, 2, 3], K: [1, 2, 3, 4, 5], L: [0, 1, 2, 3, 4, 5] },
  coast: { A: [1], B: [1, 2], C: [0, 1, 2], D: [5, 0, 1, 2] },
  wall: { straight: [0, 3], corner_A: [3, 5], corner_B: [3, 4] },
};

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/** The tile of a family and the turn that joins exactly these edges, or null. */
export function fitMask(fam, mask) {
  for (const [name, base] of Object.entries(FAM[fam])) {
    for (let k = 0; k < 6; k += 1) {
      if (sameSet(base.map((b) => (((b - k) % 6) + 6) % 6), mask)) return [name, k];
    }
  }
  return null;
}

/* ------------------------------------------------------------------ the land */
export const CLEARING = ['-6,1', '-6,2', '-7,2', '-6,3', '-7,3', '-7,4'];
const TERR = {};
const HEIGHT = {};
export const RIVER = [];

export const seaEdges = (h) => DIRS.map((_, i) => i).filter((i) => TERR[hk(nb(h, i))] === 'S');

ALL.forEach((h) => {
  const s = screen(h);
  if (s[0] > 11.5 - 1.6 * Math.sin(s[1] / 5)) TERR[hk(h)] = 'S';
});
ALL.forEach((h) => {
  const s = screen(h);
  const k = hk(h);
  if (!TERR[k] && s[1] < -12.5 + 2.5 * Math.cos(s[0] / 4)) TERR[k] = 'H';
});
ALL.forEach((h) => {
  const s = screen(h);
  const k = hk(h);
  if (!TERR[k] && s[0] < -7.5 && hdist(h, [0, 0]) > WALL_RING && !CLEARING.includes(k)) TERR[k] = 'F';
});
{
  let h = [5, -10];
  RIVER.push(h);
  [1, 1, 0, 1, 1, 1, 0, 1, 1].forEach((m) => {
    h = nb(h, m);
    RIVER.push(h);
  });
  RIVER.forEach((v) => {
    TERR[hk(v)] = 'V';
  });
}
for (let changed = true; changed; ) {
  changed = false;
  ALL.forEach((h) => {
    const k = hk(h);
    if (TERR[k]) return;
    const m = seaEdges(h);
    if (m.length && !fitMask('coast', m)) {
      TERR[k] = 'S';
      changed = true;
    }
  });
}
ALL.forEach((h) => {
  const k = hk(h);
  if (!TERR[k] && seaEdges(h).length) TERR[k] = 'C';
});
ALL.forEach((h) => {
  const k = hk(h);
  if (TERR[k] !== 'H') return;
  const s = screen(h);
  HEIGHT[k] = (s[1] > -15.5 ? 0.5 : 1.0) + ((((h[0] * 7 + h[1] * 3) % 5) + 5) % 5 === 0 ? 0.5 : 0);
});

/** '' grass, 'S' sea, 'C' shore, 'V' river, 'F' woods, 'H' heights, 'X' off the island. */
export const terr = (h) => (inmap(h) ? TERR[hk(h)] || '' : 'X');
export const hgt = (h) => HEIGHT[hk(h)] || 0;

export const TERRAIN = {
  S: { name: 'The sea', about: 'Fishers and the Trade docks must touch it.' },
  H: { name: 'High ground', about: 'Rock and ore. The Quarry and the Mine are cut at its foot.' },
  F: { name: 'Forest', about: 'Woodcutters and hunters must touch it.' },
  V: { name: 'The river', about: 'Fishers work its banks. Nothing is built on it and no street crosses it.' },
  C: { name: 'Shingle', about: 'The shore, where the Trade docks and the fishers face the sea.' },
  W: { name: 'The water', about: 'The sea or the river.' },
};

/** Does a hex count as a building's site? 'W' is any water, sea or river. */
export function siteOK(site, h) {
  const t = terr(h);
  return site === 'W' ? t === 'S' || t === 'V' : t === site;
}

/** Which edges the river leaves each of its hexes by, down to the sea. */
export const RIVER_EDGES = (() => {
  const dirTo = (a, b) => DIRS.findIndex((_, i) => hk(nb(a, i)) === hk(b));
  const out = {};
  RIVER.forEach((h, j) => {
    const es = [];
    if (j > 0) es.push(dirTo(h, RIVER[j - 1]));
    if (j < RIVER.length - 1) es.push(dirTo(h, RIVER[j + 1]));
    if (j === RIVER.length - 1) {
      const sea = DIRS.findIndex((_, i) => terr(nb(h, i)) === 'S');
      if (sea >= 0) es.push(sea);
    }
    if (j === 0) {
      const off = DIRS.findIndex((_, i) => !inmap(nb(h, i)) && [0, 1, 5].includes((((i - 4) % 6) + 6) % 6));
      if (off >= 0) es.push(off);
    }
    out[hk(h)] = es;
  });
  return out;
})();
