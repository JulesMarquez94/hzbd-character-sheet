import { CAT } from './fief.js';
import { CUSTOM_MODELS } from './fiefPeople.js';
import { ALL, CLEARING, RIVER_EDGES, SQ3, WALL_RING, fitMask, hdist, hgt, hk, hsh, nb, seaEdges, terr, touches, unk, world } from './fiefIsland.js';

/**
 * What the Fief looks like: which KayKit model stands for every building at
 * every tier, and where each piece of the board goes. Pure arithmetic, so the
 * same list comes out on every screen and the kit bake can read it for the
 * models it has to pack (scripts/build-fief-kit.mjs).
 *
 * Every model is from KayKit by Kay Lousberg, CC0: the tiles and buildings from
 * the Medieval Hexagon Pack, the trees from the Forest Nature Pack, the
 * cemetery and the lamps from Halloween Bits and the goods from Resource Bits.
 * The licence ships beside the models in public/models/fief/.
 *
 * ------------------------------------------------------------ a placement
 * `[model, x, y, z, turn, stretch, scale]`: the model's name, where its origin
 * goes on the board, how many sixths of a turn it is given, how far it is
 * stretched upright and how far it is scaled. The board merges every placement
 * that shares an atlas into one mesh, so the whole town is four draw calls.
 *
 * The look grows with the tier the way the kit lets it: the kit's own building
 * for the trade, and more of that trade's goods on the free corners of the hex.
 * A corner is free when it faces neither a street nor away from the camera.
 */

const HAL = 0.2;
const RSB = 0.25;
const COLS = ['blue', 'red', 'green', 'yellow'];
export const CR = 2 / SQ3;

/** The size of a model, read off the kit, so a look can fit one to a hex. */
let BOX = {};
export function setBoxes(boxes) {
  BOX = boxes ?? {};
}

function fitS(m, w, lo = 0.8, hi = 2.0) {
  const b = BOX[m];
  if (!b) return 1;
  return Math.max(lo, Math.min(hi, w / Math.max(b[0], b[1])));
}
const main = (m, w, ox = 0, oz = 0) => [m, fitS(m, w), ox, oz];

/** Every building and tier. `main` is [model, scale, offset x, offset z]; `wares` stand on the free corners. */
export const KLOOK = {
  keep: (t) => {
    if (t === 1) return { main: main('building_tower_A_blue', 1.45), wares: [['flag_blue', 0.6]] };
    if (t === 2) return { main: ['building_castle_blue', 1.0, 0, 0], wares: [['flag_blue', 0.6], ['flag_red', 0.6]] };
    return { main: ['building_castle_blue', 1.12, 0, 0], wares: [['flag_blue', 0.6], ['flag_red', 0.6], ['flag_yellow', 0.6], ['building_tower_catapult_blue', 0.55]] };
  },
  house: (t, hh) => {
    const m = `${hh % 2 ? 'building_home_A_' : 'building_home_B_'}${COLS[(hh >> 3) % 4]}`;
    return { main: main(m, m.includes('home_A') ? 1.3 : 1.45), wares: [] };
  },
  woodcutter: (t) => {
    if (t === 1) return { main: ['tent', 1.5, -0.25, -0.25], wares: [['tree_single_A_cut', 1.3], ['Wood_Log_Stack', RSB]] };
    return {
      main: main('building_lumbermill_green', t === 2 ? 1.55 : 1.8),
      wares: t === 2 ? [['Wood_Log_Stack', RSB], ['tree_single_B_cut', 1.3]] : [['Wood_Log_Stack', RSB], ['Wood_Planks_Stack_Large', RSB], ['wheelbarrow', 1.2]],
    };
  },
  fisher: (t) => {
    if (t === 1) return { main: ['tent', 1.4, -0.2, -0.25], wares: [['barrel', 1.2], ['crate_A_small', 1.2]] };
    if (t === 2) return { main: main('building_home_A_blue', 1.2, -0.1, -0.1), wares: [['barrel', 1.2], ['Pallet_Wood_Covered_A', RSB], ['crate_A_big', 1.0]] };
    return { main: main('building_home_B_blue', 1.35, -0.1, -0.1), wares: [['Pallet_Wood_Covered_B', RSB], ['Fuel_A_Barrels', RSB], ['flag_blue', 0.5]] };
  },
  farm: (t) => ({
    main: ['building_grain', 1.0, 0, 0],
    wares: [[['sack', 1.2]], [['wheelbarrow', 1.2], ['sack', 1.2]], [['building_windmill_yellow', 0.45], ['wheelbarrow', 1.2], ['sack', 1.2]]][t - 1],
  }),
  hunter: (t) => {
    if (t === 1) return { main: ['tent', 1.3, -0.2, -0.2], wares: [['target', 1.0], ['Wood_Log_A', RSB]] };
    return {
      main: main('building_archeryrange_green', t === 2 ? 1.5 : 1.75),
      wares: t === 2 ? [['target', 1.0], ['barrel', 1.2]] : [['target', 1.0], ['bucket_arrows', 1.2], ['flag_green', 0.5]],
    };
  },
  tavern: (t) => ({
    main: main('building_tavern_red', [1.45, 1.65, 1.85][t - 1]),
    wares: [[['barrel', 1.2]], [['barrel', 1.2], ['crate_A_small', 1.2], ['sack', 1.2]], [['barrel', 1.2], ['Fuel_A_Barrels', RSB], ['flag_red', 0.5], ['crate_A_big', 1.0]]][t - 1],
  }),
  quarry: (t) => {
    if (t === 1) return { main: ['resource_stone', 1.3, 0, 0], wares: [['Stone_Chunks_Large', RSB], ['tent', 0.9]] };
    return {
      main: main('building_mine_blue', t === 2 ? 1.45 : 1.7),
      wares: t === 2 ? [['Stone_Bricks_Stack_Small', RSB], ['Stone_Chunks_Large', RSB]] : [['Stone_Bricks_Stack_Large', RSB], ['wheelbarrow', 1.2], ['Stone_Chunks_Large', RSB]],
    };
  },
  mine: (t) => ({
    main: main('building_mine_red', [1.45, 1.6, 1.8][t - 1]),
    wares: [[['Iron_Nuggets', 0.3]], [['Iron_Nuggets', 0.3], ['Iron_Bars_Stack_Small', 0.3]], [['Iron_Bars_Stack_Medium', 0.3], ['Gold_Nuggets', 0.3], ['wheelbarrow', 1.2]]][t - 1],
  }),
  docks: (t) => {
    if (t === 1) return { main: ['tent', 1.6, -0.2, -0.25], wares: [['Pallet_Wood_Covered_A', RSB], ['crate_A_big', 1.2], ['flag_yellow', 0.5]] };
    if (t === 2) return { main: main('building_home_B_yellow', 1.3, -0.1, -0.1), wares: [['Pallet_Wood_Covered_A', RSB], ['Fuel_A_Barrels', RSB], ['crate_long_A', 1.0]] };
    return { main: main('building_tavern_yellow', 1.55, -0.1, -0.1), wares: [['Pallet_Wood_Covered_B', RSB], ['crate_long_B', 1.0], ['flag_yellow', 0.5], ['Fuel_B_Barrels', RSB]] };
  },
  market: (t) => ({
    main: main('building_market_yellow', [1.45, 1.7, 1.95][t - 1]),
    wares: [[['Textiles_Stack_Small', RSB]], [['Textiles_Stack_Small', RSB], ['crate_A_small', 1.2], ['sack', 1.2]], [['Textiles_Stack_Large_Colored', RSB], ['crate_open', 1.1], ['sack', 1.2], ['flag_yellow', 0.5]]][t - 1],
  }),
  armorsmith: (t) => ({
    main: main('building_blacksmith_blue', [1.45, 1.6, 1.8][t - 1]),
    wares: [[['Iron_Bars_Stack_Small', 0.3]], [['weaponrack', 1.2], ['Iron_Bars_Stack_Small', 0.3]], [['weaponrack', 1.2], ['target', 1.0], ['Silver_Bars_Stack_Small', 0.3]]][t - 1],
  }),
  alchemist: (t) => {
    if (t === 1) return { main: main('building_home_A_green', 1.2, -0.12, -0.12), wares: [['bucket_water', 1.2], ['candle_triple', HAL * 1.4]] };
    if (t === 2) return { main: main('building_home_B_green', 1.35, -0.12, -0.12), wares: [['bucket_water', 1.2], ['candle_triple', HAL * 1.4], ['Fuel_C_Barrels', RSB]] };
    return { main: main('building_tavern_green', 1.6, -0.1, -0.1), wares: [['candle_triple', HAL * 1.4], ['plaque_candles', HAL * 1.2], ['Fuel_C_Barrels', RSB], ['bucket_water', 1.2]] };
  },
  enchanter: (t) => ({
    main: main('building_tower_B_green', [1.25, 1.45, 1.65][t - 1]),
    wares: [[['candle_triple', HAL * 1.4]], [['candle_triple', HAL * 1.4], ['shrine_candles', 0.25]], [['shrine_candles', 0.25], ['Gold_Bars_Stack_Small', 0.3], ['flag_green', 0.5]]][t - 1],
  }),
  temple: (t) => ({
    main: main('building_church_green', [1.4, 1.55, 1.7][t - 1]),
    wares: [
      [['lantern_standing', HAL * 1.3]],
      [['lantern_standing', HAL * 1.3], ['lantern_standing', HAL * 1.3], ['bench', HAL * 1.2]],
      [['lantern_standing', HAL * 1.3], ['lantern_standing', HAL * 1.3], ['bench', HAL * 1.2], ['flag_green', 0.5]],
    ][t - 1],
  }),
  casern: (t) => ({
    main: main('building_barracks_red', [1.5, 1.7, 1.85][t - 1]),
    wares: [[['weaponrack', 1.2]], [['weaponrack', 1.2], ['target', 1.0]], [['weaponrack', 1.2], ['target', 1.0], ['flag_red', 0.5], ['bucket_arrows', 1.2]]][t - 1],
  }),
  cemetery: (t) => ({ main: null, wares: [], cemetery: t }),
  park: (t) => {
    let at = [['tree_single_A', 1.3, -0.45, -0.3], ['tree_single_B', 1.2, 0.45, -0.05], ['bench', HAL * 1.2, -0.05, 0.5, 1.5]];
    if (t >= 2) at = at.concat([['lantern_standing', HAL * 1.3, 0.62, 0.55], ['bench', HAL * 1.2, 0.55, -0.6, 0.5], ['trees_A_small', 0.9, -0.55, 0.45]]);
    if (t >= 3) at = at.concat([['tree_pine_yellow_small', HAL, 0.1, -0.75], ['pumpkin_orange_small', HAL * 1.4, -0.75, -0.25], ['lantern_standing', HAL * 1.3, -0.75, 0.75]]);
    return { main: null, wares: [], at };
  },
  square: (t) => {
    let at = [['post_lantern', HAL, -0.62, -0.42, 2], ['post_lantern', HAL, 0.62, 0.42, -1], ['bench', HAL * 1.2, -0.55, 0.45, 0.5], ['bench', HAL * 1.2, 0.55, -0.45, 3.5]];
    if (t >= 2) at = at.concat([['flag_red', 0.7, 0, 0]]);
    if (t >= 3) at = at.concat([['tent', 0.8, 0.5, 0.05, 1], ['crate_open', 1.0, -0.15, 0.62], ['sack', 1.1, 0.05, -0.62]]);
    return { main: null, wares: [], at, tile: 'hex_road_L' };
  },
  fountain: (t) => ({
    main: main('building_well_blue', [0.95, 1.1, 1.25][t - 1]),
    wares: [[], [['bench', HAL * 1.2], ['bench', HAL * 1.2]], [['bench', HAL * 1.2], ['bench', HAL * 1.2], ['lantern_standing', HAL * 1.3], ['lantern_standing', HAL * 1.3]]][t - 1],
  }),
  tower: () => ({ main: main('building_tower_A_red', 1.35), wares: [] }),
  site: (t, hh, frac, queued) => ({
    main: queued ? main('building_dirt', 1.5) : main(frac < 0.34 ? 'building_stage_A' : frac < 0.67 ? 'building_stage_B' : 'building_stage_C', 1.5),
    wares: [['Wood_Planks_Stack_Small', RSB], ['Stone_Bricks_Stack_Small', RSB]],
  }),
  rubble: () => ({ main: main('building_destroyed', 1.45), wares: [['Wood_Log_A', RSB]] }),
};

const UPGRADE_WARES = [['ladder', 1.2], ['Wood_Planks_Stack_Small', RSB]];

/* ------------------------------------------------------------------ the ground */

/** A hex corner, for the cemetery's fence posts. */
function vtx(cx, cz, v, rad, y) {
  const a = ((30 + 60 * v) * Math.PI) / 180;
  return [cx + Math.cos(a) * rad, y, cz + Math.sin(a) * rad];
}

/** Every hex a kit tile, its roads, river and coast picked by which neighbours it joins. */
function groundPieces(list, town, net, o) {
  const st = town.state;
  for (const h of ALL) {
    const k = hk(h);
    const w = world(h);
    const t = terr(h);
    const y = hgt(h);
    if (t === 'S') {
      list.push(['hex_water', w[0], 0, w[1], 0]);
      continue;
    }
    if (t === 'V') {
      const f = fitMask('river', RIVER_EDGES[k]);
      list.push([f ? `hex_river_${f[0]}` : 'hex_water', w[0], 0, w[1], f ? f[1] : 0]);
      continue;
    }
    if (t === 'C') {
      const f = fitMask('coast', seaEdges(h));
      list.push([`hex_coast_${f[0]}`, w[0], 0, w[1], f[1]]);
      continue;
    }
    const b = o[k] ? town.bById(o[k]) : null;
    const tile = b && !b.ruined && KLOOK[b.type] ? KLOOK[b.type](b.level, hsh(h)).tile : null;
    if (st.roads[k]) {
      const es = [];
      for (let i = 0; i < 6; i += 1) if (net[hk(nb(h, i))]) es.push(i);
      const f = es.length ? fitMask('road', es) : ['M', 0];
      list.push([`hex_road_${f[0]}`, w[0], 0, w[1], f[1]]);
      continue;
    }
    if (tile) {
      list.push([tile, w[0], 0, w[1], 0]);
      continue;
    }
    list.push(['hex_grass', w[0], y, w[1], 0]);
    if (y > 0) list.push(['hex_grass_bottom', w[0], y - 1, w[1], 0, y, 1]);
  }
}

/** The land's own dress: mountains and hills on the heights, the woods, a lone tree or rock in the grass. */
function sceneryPieces(list, town, o) {
  const st = town.state;
  const nearClearing = (h) => CLEARING.some((c) => hdist(h, unk(c)) <= 2);
  for (const h of ALL) {
    const k = hk(h);
    const t = terr(h);
    const w = world(h);
    const hh = hsh(h);
    const y = hgt(h);
    const k0 = hh % 6;
    if (o[k] || st.roads[k]) continue;
    if (t === 'H') {
      let pick = ['mountain_A_grass_trees', 'mountain_B_grass', 'mountain_C_grass_trees', 'hills_A_trees', 'mountain_B_grass_trees', 'hills_C_trees'][hh % 6];
      if (hdist(h, [0, 0]) <= 7 && hh % 2) pick = ['hills_B_trees', 'hill_single_A', 'hills_C'][hh % 3];
      list.push([pick, w[0], y, w[1], k0]);
    } else if (t === 'F') {
      if (nearClearing(h) || hh % 7 === 0) {
        const near = nearClearing(h);
        [['tree_pine_orange_large', -0.4, -0.25, 0.15], ['tree_pine_yellow_medium', 0.4, 0.05, 0.17], [near ? 'tree_dead_large' : 'tree_pine_orange_medium', 0, 0.55, near ? HAL : 0.16]].forEach((p) =>
          list.push([p[0], w[0] + p[1], y, w[1] + p[2], k0, 1, p[3]])
        );
      } else {
        list.push([['trees_A_large', 'trees_B_large', 'trees_A_medium', 'trees_B_medium'][hh % 4], w[0], y, w[1], k0, 1, 1.1]);
      }
    } else if (!t && hdist(h, [0, 0]) > WALL_RING && hh % 3 === 0) {
      const nearHigh = touches(h, (n) => terr(n) === 'H');
      if (nearHigh || hh % 2) list.push([hh % 4 ? 'tree_dead_large' : 'tree_dead_medium', w[0] + 0.2, y, w[1] - 0.1, k0, 1, HAL]);
      else list.push([['tree_single_A', 'tree_single_B', 'rock_single_A', 'trees_A_small'][hh % 4], w[0], y, w[1], k0, 1, 1.3]);
    }
  }
}

/* ------------------------------------------------------------------ the buildings */

/** The turn that faces a building to its street, or a fisher to its water. */
export function kFacing(h, net, type) {
  if (type === 'fisher' || type === 'docks') {
    for (const e of [1, 0, 5, 2, 4, 3]) {
      const t = terr(nb(h, e));
      if (t === 'S' || t === 'V') return (((1 - e) % 6) + 6) % 6;
    }
  }
  for (const e of [1, 2, 0, 3, 5, 4]) if (net[hk(nb(h, e))]) return (((1 - e) % 6) + 6) % 6;
  return 0;
}

/** The hex corners free for wares, nearest the camera first. */
function cornersFor(h, net) {
  const roadE = [];
  for (let i = 0; i < 6; i += 1) if (net[hk(nb(h, i))]) roadE.push(i);
  const out = [];
  for (let c = 0; c < 6; c += 1) {
    const a = c * 60 + 30;
    if (roadE.some((e) => {
      const d = Math.abs(a - e * 60) % 360;
      return Math.min(d, 360 - d) < 40;
    })) continue;
    out.push([Math.cos((a * Math.PI) / 180) + Math.sin((a * Math.PI) / 180), a]);
  }
  out.sort((p, q) => q[0] - p[0]);
  return out.length ? out.map((p) => p[1]) : [30, 90, 330];
}

function cemeteryPieces(list, h, t, net) {
  const [x, z] = world(h);
  const hh = hsh(h);
  let gate = -1;
  for (const e of [1, 2, 0, 3, 5, 4]) {
    if (net[hk(nb(h, e))]) {
      gate = e;
      break;
    }
  }
  for (let e = 0; e < 6; e += 1) {
    const a = (e * Math.PI) / 3;
    list.push([e === gate ? 'arch_gate' : 'fence', x + Math.cos(a) * 0.98, 0, z + Math.sin(a) * 0.98, -(e + 1.5), e === gate ? 1 : 0.85, 0.25]);
  }
  for (let v = 0; v < 6; v += 1) {
    const p = vtx(x, z, v, 1.13, 0);
    list.push(['fence_pillar', p[0], 0, p[2], 0, 0.9, 0.25]);
  }
  const rows = t >= 2
    ? [[-0.55, 0.45], [0.0, 0.5], [0.55, 0.35], [-0.5, -0.05], [0.45, -0.15]]
    : [[-0.55, -0.45], [0.0, -0.55], [0.55, -0.4], [-0.6, 0.15], [-0.05, 0.05], [0.55, 0.2], [-0.35, 0.65], [0.25, 0.65]];
  rows.forEach((r, i) => {
    const m = ['grave_A', 'gravestone', 'grave_B', 'gravemarker_A', 'gravestone', 'grave_A', 'gravemarker_B', 'grave_B'][(hh + i) % 8];
    list.push([m, x + r[0], 0, z + r[1], 1.5 + (((hh >> i) % 3) - 1) * 0.05, 1, m.includes('marker') ? HAL * 1.3 : HAL]);
  });
  list.push(['post_lantern', x - 0.35, 0, z - 0.2 + (t >= 2 ? 0.6 : 0), 1.5, 1, HAL]);
  if (t >= 2) {
    list.push(['crypt', x + 0.05, 0, z - 0.45, (((1 - (gate < 0 ? 1 : gate)) % 6) + 6) % 6, 1, 0.13]);
    list.push(['coffin', x + 0.62, 0, z + 0.05, 0.3, 1, HAL]);
  } else {
    list.push(['coffin', x + 0.65, 0, z + 0.5, 0.3, 1, HAL]);
  }
  if (t >= 3) {
    list.push(['shrine_candles', x - 0.62, 0, z - 0.42, 0, 1, 0.22]);
    list.push(['tree_dead_large_decorated', x - 0.7, 0, z + 0.2, hh % 6, 1, HAL]);
    list.push(['lantern_standing', x + 0.75, 0, z - 0.6, 0, 1, HAL * 1.3]);
  }
}

/** One building's pieces: the main model turned to the street, wares on the free corners. */
export function placeLook(list, type, level, h, net, { extraWares = null, frac = 0, queued = false, hh = hsh(h) } = {}) {
  const [x, z] = world(h);
  const y = hgt(h);
  const L = type === 'site' ? KLOOK.site(level, hh, frac, queued) : KLOOK[type](level, hh);
  if (L.cemetery) return cemeteryPieces(list, h, L.cemetery, net);
  const k = kFacing(h, net, type);
  if (L.main) list.push([L.main[0], x + L.main[2], y, z + L.main[3], k, 1, L.main[1]]);
  for (const p of L.at ?? []) list.push([p[0], x + p[2], y, z + p[3], p[4] !== undefined ? p[4] : hh % 6, 1, p[1]]);
  const wares = [...(L.wares ?? []), ...(extraWares ?? [])];
  const corners = cornersFor(h, net);
  wares.forEach((p, j) => {
    const a = (corners[j % corners.length] * Math.PI) / 180;
    const r0 = j >= corners.length ? 0.55 : 0.8;
    list.push([p[0], x + Math.cos(a) * r0, y, z + Math.sin(a) * r0, (hh % 6) + j * 0.7, 1, p[1]]);
  });
  return undefined;
}

/** A custom building: the model the Game Master picked, turned to the street. */
export function customLook(list, model, h, net) {
  const [x, z] = world(h);
  list.push([model, x, hgt(h), z, kFacing(h, net, 'custom'), 1, fitS(model, 1.45)]);
}

/** Walls join whatever wall stands beside them, and leave a gate where a street runs through. */
function wallPieces(list, h, wallAt, gate) {
  const [x, z] = world(h);
  let m = [];
  for (let i = 0; i < 6; i += 1) if (wallAt[hk(nb(h, i))]) m.push(i);
  if (m.length === 1) m.push((m[0] + 3) % 6);
  if (!m.length) m = [0, 3];
  let left = [...m];
  while (left.length) {
    const e = left[0];
    let pair = null;
    for (const d of [3, 2, 4, 1, 5]) {
      const o2 = (e + d) % 6;
      if (left.includes(o2)) {
        pair = [e, o2];
        break;
      }
    }
    if (!pair) pair = [e, (e + 3) % 6];
    const f = fitMask('wall', pair);
    const name = f[0] === 'straight' ? (gate ? 'wall_straight_gate' : 'wall_straight') : f[0] === 'corner_A' ? (gate ? 'wall_corner_A_gate' : 'wall_corner_A_outside') : 'wall_corner_B_outside';
    list.push([name, x, 0, z, f[1], 1.4, 1]);
    left = left.filter((v) => !pair.includes(v));
  }
}

/** Lamp posts down every other street, the arm over the road. */
function lampPieces(list, town, net, o) {
  for (const k of Object.keys(town.state.roads).sort()) {
    const h = unk(k);
    const [x, z] = world(h);
    if (o[k] || (h[0] * 31 + h[1] * 17) % 2 || hdist(h, [0, 0]) < 2) continue;
    const avoid = [];
    for (let i = 0; i < 6; i += 1) if (net[hk(nb(h, i))] || o[hk(nb(h, i))]) avoid.push(i);
    const e = [1, 0, 2, 5, 3, 4].find((v) => !avoid.includes(v));
    if (e === undefined) continue;
    const a = (e * Math.PI) / 3;
    list.push(['post_lantern', x + Math.cos(a) * 0.72, 0, z + Math.sin(a) * 0.72, -1.5 - e, 1, HAL]);
  }
}

/**
 * The whole board for a folded town: every placement, and how tall the thing
 * on each hex is, so the board can pick a hex by what stands on it.
 */
export function townPieces(town) {
  const st = town.state;
  const list = [];
  const heights = {};
  const o = town.occ();
  const net = town.streetSet();
  const wallAt = {};
  for (const b of st.buildings) if (town.isWall(b) && !b.ruined) wallAt[hk([b.q, b.r])] = 1;

  groundPieces(list, town, net, o);
  for (const b of st.buildings) {
    const h = [b.q, b.r];
    const k = hk(h);
    if (b.ruined) {
      placeLook(list, 'rubble', 1, h, net);
      heights[k] = 0.5;
      continue;
    }
    if (b.type === 'wall') {
      wallPieces(list, h, wallAt, !!st.roads[k]);
      heights[k] = 0.9;
      continue;
    }
    if (b.type === 'custom') {
      customLook(list, town.modelOf(b), h, net);
      heights[k] = 1.4;
      continue;
    }
    placeLook(list, b.type, b.level, h, net, { extraWares: town.upgradeOf(b.id) ? UPGRADE_WARES : null });
    const c = CAT[b.type];
    heights[k] = ['keep', 'temple', 'enchanter', 'tower'].includes(b.type) ? 2.0 : c.qol && !c.crew ? 0.6 : 1.3;
  }
  for (const q of st.houses) {
    const h = [q.q, q.r];
    placeLook(list, 'house', 1, h, net);
    heights[hk(h)] = 1.3;
  }
  for (const p of st.projects) {
    if (p.upgradeOf) continue;
    const frac = p.started ? p.done / p.days : 0;
    for (const c of p.cells ?? [[p.q, p.r]]) {
      const [x, z] = world(c);
      if (p.cells) list.push(['Wood_Planks_Stack_Small', x - 0.25, 0, z, 1, 1, RSB], ['ladder', x + 0.3, 0, z + 0.2, 0.5, 1, 1.0]);
      else placeLook(list, 'site', 1, c, net, { frac, queued: !p.started });
      heights[hk(c)] = 0.8;
    }
  }
  lampPieces(list, town, net, o);
  sceneryPieces(list, town, o);
  return { list, heights };
}

/** The see-through building that follows the mouse while placing. */
export function ghostPieces(town, type, h, model) {
  const list = [];
  const net = town.streetSet();
  if (type === 'custom') customLook(list, model, h, net);
  else placeLook(list, type, 1, h, net);
  return list;
}

/**
 * Every model a town could ever ask for, for the kit bake. Read off the looks
 * at every tier and every house colour, plus the tiles picked by mask.
 */
export function everyModel() {
  const names = new Set(['hex_water', 'hex_grass', 'hex_grass_bottom', 'post_lantern', 'Wood_Planks_Stack_Small', 'ladder', 'arch_gate', 'fence', 'fence_pillar', 'crypt', 'coffin', 'shrine_candles', 'tree_dead_large_decorated', 'lantern_standing']);
  for (const c of 'ABCDEFGHIJKLM') names.add(`hex_road_${c}`);
  for (const c of 'ABCDEFGHIJKL') names.add(`hex_river_${c}`);
  for (const c of 'ABCD') names.add(`hex_coast_${c}`);
  for (const w of ['wall_straight', 'wall_straight_gate', 'wall_corner_A_outside', 'wall_corner_A_gate', 'wall_corner_B_outside']) names.add(w);
  for (const g of ['grave_A', 'grave_B', 'gravestone', 'gravemarker_A', 'gravemarker_B']) names.add(g);
  const add = (L) => {
    if (L.main) names.add(L.main[0]);
    if (L.tile) names.add(L.tile);
    for (const p of [...(L.wares ?? []), ...(L.at ?? [])]) names.add(p[0]);
  };
  for (const [type, look] of Object.entries(KLOOK)) {
    if (type === 'site') {
      for (const frac of [0, 0.5, 0.9]) add(look(1, 0, frac, false));
      add(look(1, 0, 0, true));
      continue;
    }
    for (let t = 1; t <= 3; t += 1) for (let hh = 0; hh < 32; hh += 1) add(look(t, hh));
  }
  for (const p of UPGRADE_WARES) names.add(p[0]);
  for (const m of [
    'mountain_A_grass_trees', 'mountain_B_grass', 'mountain_C_grass_trees', 'hills_A_trees', 'mountain_B_grass_trees', 'hills_C_trees', 'hills_B_trees', 'hill_single_A', 'hills_C',
    'tree_pine_orange_large', 'tree_pine_yellow_medium', 'tree_dead_large', 'tree_pine_orange_medium', 'trees_A_large', 'trees_B_large', 'trees_A_medium', 'trees_B_medium',
    'tree_dead_medium', 'tree_single_A', 'tree_single_B', 'rock_single_A', 'trees_A_small',
  ]) names.add(m);
  for (const [m] of CUSTOM_MODELS) names.add(m);
  return [...names].sort();
}

/* ------------------------------------------------------------------ picking */

/**
 * What a click on a hex selects: whatever stands there, a street or a kind of
 * ground, as a key the panels can open. Null for open grass.
 */
export function keyAt(town, h) {
  if (!h) return null;
  const k = hk(h);
  const o = town.occ()[k];
  if (o) return o;
  return town.state.roads[k] || terr(h) ? `hex:${k}` : null;
}

/** The hex a key stands on, and the building it is, for the outline and the tier pips. */
export function footOf(town, key) {
  if (!key) return null;
  const st = town.state;
  const p = town.pById(key);
  const b = town.bById(p?.upgradeOf ?? key);
  if (b) return { at: [b.q, b.r], building: b };
  const house = st.houses.find((q) => q.id === key);
  if (house) return { at: [house.q, house.r], building: null };
  if (p) return { at: p.cells ? p.cells[0] : [p.q, p.r], building: null };
  if (key.startsWith('hex:')) return { at: unk(key.slice(4)), building: null };
  return null;
}
