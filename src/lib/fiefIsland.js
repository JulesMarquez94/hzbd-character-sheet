/**
 * The Fief's islands: a hex board floating in empty space, and what lies on
 * every hex of it.
 *
 * Jules, 2026-10-18: "use the hexagon format from kaykit ... the terrain as
 * well", then "redo it with a kkit one". So the board is KayKit's own Medieval
 * Hexagon Pack, and the ground is laid out so every hex can be drawn with one of
 * its tiles.
 *
 * And the same day, after the first town was built: "generate a different
 * starting option for the town, so the different layouts ... so not every place
 * is flat ... six different starting locations ... one that has a river that
 * goes through the middle and see if you can make bridge happen". So there are
 * six islands, the Game Master picks one when the town is founded, and the
 * ground rises in terraces.
 *
 * ------------------------------------------------------------------ the grid
 * Pointy-top hexes in axial coordinates [q, r], the Keep at [0, 0]. A hex is 2
 * units across its flats, so the centre of [q, r] is at x = 2q + r, z = √3·r.
 * Neighbour i sits at i × 60 degrees: 0 east, 1 south-east, and on round. An
 * island is every hex within RADIUS of the Keep.
 *
 * ------------------------------------------------------------------ the land
 * Every island is worked out from the coordinates, so every screen at every
 * table lays the same island without a byte of it being stored. An island is a
 * shape (sea, heights, woods, a river, and how high the grass stands), and one
 * pipeline makes every shape drawable and playable:
 *
 *   the core      everything within two hexes of the Keep is flat grass, so the
 *                 first streets and the first farm always have room
 *   the shore     the kit draws a shore with sea on one to four edges in a row
 *                 and nothing else, so a shore it cannot draw is made sea
 *   the terraces  grass stands at 0, 0.5 or 1 and never steps more than half a
 *                 unit from a neighbour, which is what a street or a ramp can
 *                 climb. Water and the shore are at 0, so a bank is never more
 *                 than a step above its river and a bridge can always land
 *   the river     starts at the island's edge and ends in the sea or a lake, so
 *                 every river hex has two banks the kit can draw
 */

export const RADIUS = 10;
export const WALL_RING = 5;
export const SQ3 = Math.sqrt(3);
export const DIRS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
/** How far apart two neighbouring hexes may stand and still be walked between. */
export const STEP = 0.5;

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

/** The board as seen from the south-east, the way the camera looks at it: x across, y up the screen. */
export const screen = (h) => {
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

/** Smooth value noise in [0, 1), for terraces and woods that do not look ruled. */
export function noise(x, y, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const at = (a, b) => (hash(a + seed * 131, b - seed * 71) % 1000) / 1000;
  const s = (t) => t * t * (3 - 2 * t);
  const a = at(xi, yi);
  const b = at(xi + 1, yi);
  const c = at(xi, yi + 1);
  const d = at(xi + 1, yi + 1);
  return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
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
 * the wide one at 120 degrees and the sharp one at 60. A river crossing is water
 * on {0, 3} with a road on {1, 4} (A) or {2, 5} (B), and its bridge sits on it.
 */
export const FAM = {
  road: { A: [0, 3], B: [3, 5], C: [3, 4], D: [1, 3, 5], E: [0, 3, 5], F: [0, 1, 3], G: [2, 3, 4], H: [0, 2, 3, 4], I: [1, 2, 4, 5], J: [0, 1, 2, 3], K: [1, 2, 3, 4, 5], L: [0, 1, 2, 3, 4, 5], M: [3] },
  river: { A: [0, 3], B: [3, 5], C: [3, 4], D: [1, 3, 5], E: [0, 3, 5], F: [0, 1, 3], G: [2, 3, 4], H: [0, 2, 3, 4], I: [1, 2, 4, 5], J: [0, 1, 2, 3], K: [1, 2, 3, 4, 5], L: [0, 1, 2, 3, 4, 5] },
  coast: { A: [1], B: [1, 2], C: [0, 1, 2], D: [5, 0, 1, 2] },
  wall: { straight: [0, 3], corner_A: [3, 5], corner_B: [3, 4] },
};
const CROSSING = { A: { water: [0, 3], road: [1, 4] }, B: { water: [0, 3], road: [2, 5] } };

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const turned = (base, k) => base.map((b) => (((b - k) % 6) + 6) % 6);

/** The tile of a family and the turn that joins exactly these edges, or null. */
export function fitMask(fam, mask) {
  for (const [name, base] of Object.entries(FAM[fam])) {
    for (let k = 0; k < 6; k += 1) if (sameSet(turned(base, k), mask)) return [name, k];
  }
  return null;
}

/** The crossing tile and turn for a straight river with a road across it on `axis`, or null. */
export function fitCrossing(water, axis) {
  const road = [axis, axis + 3];
  for (const [name, tile] of Object.entries(CROSSING)) {
    for (let k = 0; k < 6; k += 1) if (sameSet(turned(tile.water, k), water) && sameSet(turned(tile.road, k), road)) return [name, k];
  }
  return null;
}

export const TERRAIN = {
  S: { name: 'The sea', about: 'Fishers and the Trade docks must touch it.' },
  H: { name: 'High ground', about: 'Rock and ore. The Quarry and the Mine are cut at its foot.' },
  F: { name: 'Forest', about: 'Woodcutters and hunters must touch it.' },
  V: { name: 'The river', about: 'Fishers work its banks. A street crosses it on a bridge where it runs straight.' },
  C: { name: 'Shingle', about: 'The shore, where the Trade docks and the fishers face the water.' },
  W: { name: 'The water', about: 'The sea or the river.' },
};

/* ------------------------------------------------------------------ the shapes */

/**
 * Each shape is handed a pen: `set(h, 'S' | 'H' | 'F')` for the sea, the heights
 * and the woods, `level(h, 0 | 0.5 | 1)` for how high the grass and the woods
 * stand, and `flow(from, to)` for a river from the island's edge to a body of
 * water. The pipeline below then makes it drawable.
 */
const SHAPES = {
  /* The first island: the sea to the east, heights at the back, woods on the
     west, a river down to the sea and a clearing at the edge of the woods. */
  seaward: (pen) => {
    for (const h of ALL) {
      const [sx, sy] = screen(h);
      if (sx > 11.5 - 1.6 * Math.sin(sy / 5)) pen.set(h, 'S');
      else if (sy < -12.5 + 2.5 * Math.cos(sx / 4)) pen.set(h, 'H');
      else if (sx < -7.5 && hdist(h, [0, 0]) > WALL_RING && !pen.clearing.includes(hk(h))) pen.set(h, 'F');
      const [x, z] = world(h);
      const n = noise(x / 6, z / 6, 1);
      if (hdist(h, [0, 0]) >= 5 && sx < 6) pen.level(h, n > 0.72 ? 1 : n > 0.5 ? 0.5 : 0);
    }
    pen.path([5, -10], [1, 1, 0, 1, 1, 1, 0, 1, 1]);
  },

  /* A river straight through the middle, so the town spans two banks and its
     streets cross on bridges. A bay to the south, woods on the west bank, the
     heights to the north and a rising east bank. */
  rivercross: (pen) => {
    for (const h of ALL) {
      const [sx, sy] = screen(h);
      const [x, z] = world(h);
      if (z > 11.6 + 1.8 * Math.sin(x / 5)) pen.set(h, 'S');
      else if (sy < -13 + 2 * Math.cos(sx / 3)) pen.set(h, 'H');
      else if (x < -9 + 2 * noise(z / 4, 0, 2) && hdist(h, [0, 0]) > 4) pen.set(h, 'F');
      if (hdist(h, [0, 0]) >= 4 && x > 9) pen.level(h, x > 14 ? 1 : 0.5);
      if (hdist(h, [0, 0]) >= 5 && x < -4 && noise(x / 5, z / 5, 4) > 0.55) pen.level(h, 0.5);
    }
    pen.path([5, -10], [2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1]);
  },

  /* A high valley: heights on three sides, terraces climbing to them, a lake in
     the south-east and a stream running down into it. */
  highland: (pen) => {
    const lake = [4, 3];
    for (const h of ALL) {
      const d = hdist(h, [0, 0]);
      const [sx, sy] = screen(h);
      const [x, z] = world(h);
      if (hdist(h, lake) <= 2 || (hdist(h, lake) <= 3 && noise(x / 3, z / 3, 7) > 0.6)) pen.set(h, 'S');
      else if (d >= 8 && !(sx > 3 && sy > 3)) pen.set(h, 'H');
      else if (d >= 4 && noise(x / 5, z / 5, 3) > 0.64) pen.set(h, 'F');
      const n = noise(x / 7, z / 7, 9) * 0.6;
      pen.level(h, d <= 3 ? 0 : d + n <= 5.2 ? 0.5 : 1);
    }
    pen.flow([-3, -7], lake);
  },

  /* A point of land between two seas, the mainland to the north with its woods
     and heights, and a ridge running down the spine to the tip. */
  peninsula: (pen) => {
    for (const h of ALL) {
      const [sx, sy] = screen(h);
      if (sy > -7 && Math.abs(sx) > 7.5 + 1.2 * Math.sin(sy / 3) + Math.max(0, -sy) * 0.15) pen.set(h, 'S');
      else if (sy < -13.5 || (sx > 5 && sy < -9)) pen.set(h, 'H');
      /* The woods stop short of the heights, so the quarry and the mine have a foot to stand on. */
      else if (sy < -8 && sy > -12 && sx < 1) pen.set(h, 'F');
      if (hdist(h, [0, 0]) >= 4 && Math.abs(sx) < 3 && sy > 5) pen.level(h, sy > 10 ? 1 : 0.5);
      if (sy < -6 && sx < 0) pen.level(h, 0.5);
    }
    pen.flow([-8, -2], [-9, 7]);
  },

  /* Deep woods round a clearing, a stream winding through them to a bay in the
     east, and a rocky outcrop in the north. */
  deepwood: (pen) => {
    for (const h of ALL) {
      const d = hdist(h, [0, 0]);
      const [sx, sy] = screen(h);
      const [x, z] = world(h);
      if (sx > 12.3 && Math.abs(sy) < 7) pen.set(h, 'S');
      else if (hdist(h, [-2, -6]) <= 1 || sy < -14.5) pen.set(h, 'H');
      /* A clearing round the outcrop, so the quarry and the mine can stand at its foot. */
      else if (hdist(h, [-2, -6]) <= 3) continue;
      else if (d >= 5 && noise(x / 4, z / 4, 5) > 0.28) pen.set(h, 'F');
      if (d >= 3) {
        const n = noise(x / 5, z / 5, 11);
        pen.level(h, n > 0.68 ? 1 : n > 0.42 ? 0.5 : 0);
      }
    }
    pen.flow([-10, 4], [9, -3]);
  },

  /* A lake north of the town fed by a river from the north-east, heights to the
     west, woods to the south-east and the land rising to the south. */
  lakeside: (pen) => {
    const lake = [-1, -5];
    for (const h of ALL) {
      const [sx, sy] = screen(h);
      const [x, z] = world(h);
      if (hdist(h, lake) <= 2 || (hdist(h, lake) <= 3 && noise(x / 3, z / 3, 8) > 0.55)) pen.set(h, 'S');
      else if (x < -12 + 2 * noise(z / 4, 1, 6)) pen.set(h, 'H');
      else if (sx > 7 && hdist(h, [0, 0]) >= 5) pen.set(h, 'F');
      if (sy > 6) pen.level(h, sy > 11 ? 1 : 0.5);
    }
    pen.flow([6, -10], lake);
  },
};

/** The six islands a town can be founded on, in the order the founding offers them. */
export const ISLANDS = [
  { id: 'seaward', name: 'Seaward', water: 'The sea', about: 'The sea to the east, heights at the back, woods to the west and a river running down to the shore.' },
  { id: 'rivercross', name: 'Two Banks', water: 'The sea', about: 'A river straight through the middle, so the town grows on both banks and its streets cross on bridges. A bay to the south.' },
  { id: 'highland', name: 'The High Valley', water: 'The lake', about: 'Heights on three sides, terraces climbing to them and a mountain lake with a stream running down into it.' },
  { id: 'peninsula', name: 'The Point', water: 'The sea', about: 'A point of land between two seas, with the mainland woods and heights to the north and a ridge down the spine.' },
  { id: 'deepwood', name: 'The Deep Wood', water: 'The sea', about: 'Deep woods round a clearing, a stream winding through them to a bay and a rocky outcrop in the north.' },
  { id: 'lakeside', name: 'Lakeside', water: 'The lake', about: 'A lake north of the town fed by a river, heights to the west, woods to the south-east and the land rising south.' },
];
export const ISLAND_IDS = ISLANDS.map((i) => i.id);
export const DEFAULT_ISLAND = 'seaward';

/* ------------------------------------------------------------------ the pipeline */

function build(spec) {
  const T = {};
  const LV = {};
  const clearing = spec.id === 'seaward' ? ['-6,1', '-6,2', '-7,2', '-6,3', '-7,3', '-7,4'] : [];
  const rivers = [];
  const core = (h) => hdist(h, [0, 0]) <= 2;
  const seaAt = (h) => T[hk(h)] === 'S';

  const pen = {
    clearing,
    set: (h, t) => {
      if (inmap(h)) T[hk(h)] = t;
    },
    level: (h, v) => {
      if (inmap(h)) LV[hk(h)] = v;
    },
    /** A river laid hex by hex from its source, by the directions it turns. */
    path: (start, moves) => {
      let h = start;
      const p = [h];
      for (const m of moves) {
        h = nb(h, m);
        if (!inmap(h)) break;
        p.push(h);
      }
      rivers.push(p);
    },
    /** A river from an edge hex to a body of water, by the shortest way round the town. */
    flow: (start, goal) => {
      const p = [start];
      const seen = new Set([hk(start)]);
      let h = start;
      for (let step = 0; step < 40; step += 1) {
        if (touches(h, (n) => seaAt(n))) break;
        let best = null;
        for (let i = 0; i < 6; i += 1) {
          const n = nb(h, i);
          if (!inmap(n) || core(n) || seen.has(hk(n)) || hdist(n, [0, 0]) <= 3) continue;
          if (p.some((o, j) => j < p.length - 1 && hdist(o, n) <= 1)) continue;
          const score = hdist(n, goal) + (hash(n[0] + 7, n[1] + step) % 100) / 250;
          if (!best || score < best.score) best = { n, score };
        }
        if (!best) break;
        h = best.n;
        seen.add(hk(h));
        p.push(h);
      }
      rivers.push(p);
    },
  };
  spec.shape(pen);

  /* The core is flat grass, whatever the shape drew there. */
  for (const h of ALL) {
    if (!core(h)) continue;
    delete T[hk(h)];
    LV[hk(h)] = 0;
  }
  /* Rivers last, so nothing drawn over them hides one. */
  for (const p of rivers) for (const h of p) if (!core(h) && T[hk(h)] !== 'S') T[hk(h)] = 'V';

  /* The shore: anything touching the sea that the kit cannot draw as a shore is sea. */
  const seaEdges = (h) => DIRS.map((_, i) => i).filter((i) => T[hk(nb(h, i))] === 'S');
  for (let changed = true; changed; ) {
    changed = false;
    for (const h of ALL) {
      const k = hk(h);
      if (T[k] === 'S' || T[k] === 'V' || core(h)) continue;
      const m = seaEdges(h);
      if (m.length && !fitMask('coast', m)) {
        T[k] = 'S';
        changed = true;
      }
    }
  }
  for (const h of ALL) {
    const k = hk(h);
    if (T[k] !== 'S' && T[k] !== 'V' && seaEdges(h).length) T[k] = 'C';
  }

  /* The terraces: water and the shore at 0, everything else no more than a step above its lowest neighbour. */
  const level = {};
  const flat = (t) => t === 'S' || t === 'V' || t === 'C';
  for (const h of ALL) {
    const k = hk(h);
    level[k] = flat(T[k]) ? 0 : Math.max(0, Math.min(1, Math.round((LV[k] ?? 0) * 2) / 2));
  }
  for (let changed = true; changed; ) {
    changed = false;
    for (const h of ALL) {
      const k = hk(h);
      if (T[k] === 'H' || flat(T[k])) continue;
      let low = Infinity;
      for (let i = 0; i < 6; i += 1) {
        const n = nb(h, i);
        if (!inmap(n) || T[hk(n)] === 'H') continue;
        low = Math.min(low, level[hk(n)]);
      }
      if (low !== Infinity && level[k] > low + STEP) {
        level[k] = low + STEP;
        changed = true;
      }
    }
  }
  /* The heights stand on whatever is round them, and higher inside. */
  const height = {};
  for (const h of ALL) {
    const k = hk(h);
    if (T[k] !== 'H') continue;
    let edge = false;
    let around = 0;
    for (let i = 0; i < 6; i += 1) {
      const n = nb(h, i);
      if (!inmap(n)) continue;
      if (T[hk(n)] !== 'H') {
        edge = true;
        around = Math.max(around, level[hk(n)]);
      }
    }
    height[k] = Math.max(0.5, around + 0.5) + (edge ? 0 : 0.5) + ((((h[0] * 7 + h[1] * 3) % 5) + 5) % 5 === 0 ? 0.5 : 0);
  }

  /* Which edges each river hex leaves by: up to its source, down to the water. */
  const riverEdges = {};
  const dirTo = (a, b) => DIRS.findIndex((_, i) => hk(nb(a, i)) === hk(b));
  for (const p of rivers) {
    const kept = p.filter((h) => T[hk(h)] === 'V');
    kept.forEach((h, j) => {
      const es = new Set(riverEdges[hk(h)] ?? []);
      const prev = kept[j - 1];
      const next = kept[j + 1];
      if (prev && hdist(prev, h) === 1) es.add(dirTo(h, prev));
      if (next && hdist(next, h) === 1) es.add(dirTo(h, next));
      if (j === 0) {
        const off = DIRS.findIndex((_, i) => !inmap(nb(h, i)));
        if (off >= 0) es.add(off);
      }
      if (j === kept.length - 1) {
        const sea = DIRS.findIndex((_, i) => T[hk(nb(h, i))] === 'S');
        if (sea >= 0) es.add(sea);
      }
      riverEdges[hk(h)] = [...es];
    });
  }

  const names = { ...Object.fromEntries(Object.entries(TERRAIN).map(([k, v]) => [k, { ...v }])) };
  names.S.name = spec.water;
  if (spec.water === 'The lake') names.S.about = 'Fishers and the Trade docks must touch it. Boats come up to its quay.';

  const terr = (h) => (inmap(h) ? T[hk(h)] || '' : 'X');
  const island = {
    id: spec.id,
    name: spec.name,
    about: spec.about,
    names,
    clearing,
    riverEdges,
    terr,
    /** How high the ground stands: the grass and the woods on their terrace, the heights on their hills. */
    hgt: (h) => height[hk(h)] ?? level[hk(h)] ?? 0,
    /** The terrace a building or a street stands on. Water and the shore are 0. */
    level: (h) => level[hk(h)] ?? 0,
    seaEdges: (h) => DIRS.map((_, i) => i).filter((i) => terr(nb(h, i)) === 'S'),
    siteOK: (site, h) => {
      const t = terr(h);
      return site === 'W' ? t === 'S' || t === 'V' : t === site;
    },
    /** The axis a river hex runs straight along (0, 1 or 2), or -1 where it bends. */
    riverAxis: (h) => {
      const es = riverEdges[hk(h)];
      if (!es || es.length !== 2) return -1;
      return (es[0] + 3) % 6 === es[1] ? es[0] % 3 : -1;
    },
  };
  return island;
}

const BUILT = new Map();

/** An island by its id, built once and kept. An unknown id is the first island. */
export function islandOf(id) {
  const spec = SHAPES[id] ? ISLANDS.find((i) => i.id === id) : ISLANDS[0];
  if (!BUILT.has(spec.id)) BUILT.set(spec.id, build({ ...spec, shape: SHAPES[spec.id] }));
  return BUILT.get(spec.id);
}
