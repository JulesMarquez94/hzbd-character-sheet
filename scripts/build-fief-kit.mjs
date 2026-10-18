/**
 * Bake the KayKit models the Fief draws into one file the board can load in a
 * single request.
 *
 * The packs are free and CC0, by Kay Lousberg, and are not committed: they sit
 * in the gitignored data/ drop folder like every other source drop (see
 * data/README.md). What ships is what this cuts from them into
 * public/models/fief/:
 *
 *   kit.json    an index: every model's atlas, its size and where its
 *               geometry sits in kit.bin
 *   kit.bin     every model's triangles with its node transforms baked in, so
 *               the board needs no glTF loader at all
 *   <atlas>.png the four packs' colour atlases, one each
 *   <ground>.jpg the watercolour the ground is painted with (below)
 *   LICENSE.txt the packs' own licence files
 *
 * Only the models src/lib/fiefLooks.js can ask for are packed (`everyModel`),
 * so a model added to a look is a model this has to be run again for, and the
 * board says which name it could not find.
 *
 * ------------------------------------------------------------ the green
 * The hex pack's ground reads its colour off one swatch of its atlas, a yellow
 * running down to olive, and on a board that yellow reads as straw. Jules,
 * 2026-10-18: "find a better texture for the ground uh, that looks better in
 * terms of grass". So every hex-pack model that samples that swatch (the tiles,
 * the hills, the mountains' grass and nothing else) is pointed at the atlas's
 * own green swatch instead, at the same place down its gradient. The wheat, the
 * roofs and the flags never read it and are untouched. `hex_grass_pale` is the
 * same tile pointed higher up the green, for the patches of a paler shade.
 *
 * ------------------------------------------------------------ the watercolour
 * The atlas paints a hex one smooth gradient, and a field of them still reads
 * as tiles. Jules, 2026-10-18, after the hunt for a better ground texture: the
 * Voxel Core Lab watercolour pack (CC0, by Jonas Voland), which sits in the
 * same data folder. Three of its sheets ship, cut from 1024 pixels to 512: the
 * grass, the water, and the dirt the streets and the beaches are painted with.
 * The board lays them over the tops of the tiles in world space, so the paint
 * runs on from hex to hex (`paintGround` in FiefStage.jsx). They are cut with
 * the edges wrapped round first, so a sheet that tiles still tiles.
 *
 *   node scripts/build-fief-kit.mjs [path/to/data]
 *
 * The data folder defaults to ./data, then to the sheet's old checkout beside
 * this one.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { everyModel } from '../src/lib/fiefLooks.js';

const OUT = 'public/models/fief';
const CANDIDATES = [process.argv[2], 'data', '../hzbd-character-sheet/data'].filter(Boolean);
const ROOT = CANDIDATES.find((dir) => fs.existsSync(path.join(dir, 'KayKit_Medieval_Hexagon_Pack_1.0_FREE')));
if (!ROOT) {
  console.error(`build-fief-kit: no KayKit packs in ${CANDIDATES.join(' or ')}`);
  process.exit(1);
}

/** The four packs, in the order a name is looked for. */
const PACKS = [
  { id: 'hex', pack: 'KayKit_Medieval_Hexagon_Pack_1.0_FREE', models: 'Assets/gltf', deep: true, atlas: 'Textures/hexagons_medieval.png' },
  { id: 'forest', pack: 'KayKit_Forest_Nature_Pack_1.0_FREE', models: 'Assets/gltf', atlas: 'Textures/forest_texture.png' },
  { id: 'halloween', pack: 'KayKit_HalloweenBits_1.0_FREE', models: 'Assets/gltf', atlas: 'Assets/textures/halloweenbits_texture.png' },
  { id: 'resource', pack: 'KayKit_ResourceBits_1.0_FREE', models: 'Assets/gltf', atlas: 'Textures/resource_bits_texture.png' },
];

function walk(dir, deep, out = new Map()) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (deep) walk(full, deep, out);
    } else if (entry.name.endsWith('.gltf')) {
      const stem = entry.name.slice(0, -5);
      if (!out.has(stem)) out.set(stem, full);
    }
  }
  return out;
}

const FOUND = PACKS.map((p) => ({ ...p, files: walk(path.join(ROOT, p.pack, p.models), !!p.deep) }));

/* The watercolour pack, unzipped either flat or into a folder of its own name. */
const WATERCOLOUR = 'VoxelCoreLab_Watercolor_Terrain_Textures_1024px';
const PAINT = [path.join(ROOT, WATERCOLOUR, WATERCOLOUR), path.join(ROOT, WATERCOLOUR)].find((dir) => fs.existsSync(path.join(dir, 'LICENCE.txt')));
if (!PAINT) {
  console.error(`build-fief-kit: no ${WATERCOLOUR} in ${ROOT}`);
  process.exit(1);
}
/** Which sheet each ground is painted with. */
const GROUND = { grass: 'Grass_01', water: 'Water_01', dirt: 'Dirt_03' };
const SIDE = 512;

/** One sheet cut down to SIDE, wrapped round its edges first so the cut still tiles. */
async function cutSheet(file, out) {
  const { width } = await sharp(file).metadata();
  const pad = 32;
  const wrapped = await sharp(file).removeAlpha().extend({ top: pad, bottom: pad, left: pad, right: pad, extendWith: 'repeat' }).raw().toBuffer({ resolveWithObject: true });
  const scale = SIDE / width;
  const at = Math.round(pad * scale);
  await sharp(wrapped.data, { raw: wrapped.info })
    .resize(Math.round((width + 2 * pad) * scale), Math.round((width + 2 * pad) * scale), { kernel: 'lanczos3' })
    .extract({ left: at, top: at, width: SIDE, height: SIDE })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out);
}

/** Names the looks ask for that are a kit model read another way: the source and the shade. */
const VARIANTS = { hex_grass_pale: { from: 'hex_grass', shade: 'pale' } };

function find(name) {
  const variant = VARIANTS[name];
  const stem = variant ? variant.from : name;
  for (const p of FOUND) if (p.files.has(stem)) return { file: p.files.get(stem), atlas: p.id, shade: variant?.shade ?? 'green' };
  return null;
}

/* The yellow ground swatch, and the green one it is pointed at, in atlas UVs. */
const YELLOW = { u: [0, 0.125], v: [0.5, 0.75] };
const GREEN = { u: 0.5, v: 0.25, h: 0.25 };
const SHADES = { green: 1, pale: 0.5 };

function regreen(uv, shade) {
  const squeeze = SHADES[shade];
  for (let i = 0; i < uv.length; i += 2) {
    const u = uv[i];
    const v = uv[i + 1];
    if (u < YELLOW.u[0] || u >= YELLOW.u[1] || v < YELLOW.v[0] || v >= YELLOW.v[1]) continue;
    const down = (v - YELLOW.v[0]) / (YELLOW.v[1] - YELLOW.v[0]);
    uv[i] = GREEN.u + (u - YELLOW.u[0]);
    uv[i + 1] = GREEN.v + down * squeeze * GREEN.h;
  }
}

/* ---------------------------------------------------------- reading a glTF */

const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const READ = {
  5120: [1, (v, o) => v.getInt8(o), 127],
  5121: [1, (v, o) => v.getUint8(o), 255],
  5122: [2, (v, o) => v.getInt16(o, true), 32767],
  5123: [2, (v, o) => v.getUint16(o, true), 65535],
  5125: [4, (v, o) => v.getUint32(o, true), 4294967295],
  5126: [4, (v, o) => v.getFloat32(o, true), 1],
};

function accessor(gltf, bins, index) {
  const a = gltf.accessors[index];
  const bv = gltf.bufferViews[a.bufferView];
  const bin = bins[bv.buffer];
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const comps = COMPONENTS[a.type];
  const [size, get, max] = READ[a.componentType];
  const stride = bv.byteStride || comps * size;
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const out = new Float64Array(a.count * comps);
  for (let i = 0; i < a.count; i += 1) {
    for (let c = 0; c < comps; c += 1) {
      const v = get(view, base + i * stride + c * size);
      out[i * comps + c] = a.normalized ? Math.max(v / max, -1) : v;
    }
  }
  return { data: out, count: a.count, comps };
}

/* Column-major 4x4, the way glTF writes them. */
function compose(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
  const [x, y, z, w] = q;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
  return [
    (1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
    (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
    (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1,
  ];
}
function mul(a, b) {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c += 1) for (let r = 0; r < 4; r += 1) for (let k = 0; k < 4; k += 1) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
}
/** The normal matrix: the inverse transpose of the upper 3x3. */
function normalMatrix(m) {
  const [a, b, c, d, e, f, g, h, i] = [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C || 1;
  // inverse of [[a d g],[b e h],[c f i]] (columns), transposed
  return [
    A / det, B / det, C / det,
    -(b * i - c * h) / det, (a * i - c * g) / det, -(a * h - b * g) / det,
    (b * f - c * e) / det, -(a * f - c * d) / det, (a * e - b * d) / det,
  ];
}

/** One model as indexed triangles in its own space, every node transform baked in. */
function readModel(file) {
  const gltf = JSON.parse(fs.readFileSync(file, 'utf8'));
  const bins = gltf.buffers.map((b) => fs.readFileSync(path.join(path.dirname(file), decodeURIComponent(b.uri))));
  const pos = [];
  const nor = [];
  const uv = [];
  const idx = [];
  const visit = (ni, parent) => {
    const node = gltf.nodes[ni];
    const local = node.matrix ?? compose(node.translation, node.rotation, node.scale);
    const world = mul(parent, local);
    if (node.mesh !== undefined) {
      const nm = normalMatrix(world);
      for (const prim of gltf.meshes[node.mesh].primitives) {
        if ((prim.mode ?? 4) !== 4) continue;
        const P = accessor(gltf, bins, prim.attributes.POSITION);
        const N = prim.attributes.NORMAL !== undefined ? accessor(gltf, bins, prim.attributes.NORMAL) : null;
        const U = prim.attributes.TEXCOORD_0 !== undefined ? accessor(gltf, bins, prim.attributes.TEXCOORD_0) : null;
        const base = pos.length / 3;
        for (let i = 0; i < P.count; i += 1) {
          const x = P.data[i * 3], y = P.data[i * 3 + 1], z = P.data[i * 3 + 2];
          pos.push(world[0] * x + world[4] * y + world[8] * z + world[12], world[1] * x + world[5] * y + world[9] * z + world[13], world[2] * x + world[6] * y + world[10] * z + world[14]);
          if (N) {
            const a = N.data[i * 3], b = N.data[i * 3 + 1], c = N.data[i * 3 + 2];
            const nx = nm[0] * a + nm[3] * b + nm[6] * c;
            const ny = nm[1] * a + nm[4] * b + nm[7] * c;
            const nz = nm[2] * a + nm[5] * b + nm[8] * c;
            const len = Math.hypot(nx, ny, nz) || 1;
            nor.push(nx / len, ny / len, nz / len);
          } else nor.push(0, 1, 0);
          uv.push(U ? U.data[i * 2] : 0, U ? U.data[i * 2 + 1] : 0);
        }
        if (prim.indices !== undefined) {
          const I = accessor(gltf, bins, prim.indices);
          for (let i = 0; i < I.count; i += 1) idx.push(base + I.data[i]);
        } else for (let i = 0; i < P.count; i += 1) idx.push(base + i);
      }
    }
    for (const child of node.children ?? []) visit(child, world);
  };
  const identity = compose();
  for (const root of gltf.scenes[gltf.scene ?? 0].nodes) visit(root, identity);
  return { pos, nor, uv, idx };
}

/* ---------------------------------------------------------------- the bake */

const names = everyModel();
const missing = [];
const index = {};
const chunks = [];
let offset = 0;

/**
 * Every block starts on a four-byte line, so the board can view it in place.
 * A block already packed is pointed at rather than packed again: the kit's
 * colour variants share their shape and differ only in where they read the
 * atlas, so a red tavern costs only its colours once the blue one is in.
 */
const packed = new Map();
function push(typed) {
  const bytes = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
  const key = `${typed.constructor.name}:${createHash('sha1').update(bytes).digest('hex')}`;
  if (packed.has(key)) return packed.get(key);
  const at = offset;
  packed.set(key, at);
  chunks.push(bytes);
  offset += bytes.length;
  const pad = (4 - (offset % 4)) % 4;
  if (pad) {
    chunks.push(Buffer.alloc(pad));
    offset += pad;
  }
  return at;
}

for (const name of names) {
  const hit = find(name);
  if (!hit) {
    missing.push(name);
    continue;
  }
  const m = readModel(hit.file);
  if (hit.atlas === 'hex') regreen(m.uv, hit.shade);
  const verts = m.pos.length / 3;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < verts; i += 1) {
    for (let k = 0; k < 3; k += 1) {
      lo[k] = Math.min(lo[k], m.pos[i * 3 + k]);
      hi[k] = Math.max(hi[k], m.pos[i * 3 + k]);
    }
  }
  const uvInside = m.uv.every((v) => v >= 0 && v <= 1);
  index[name] = {
    a: hit.atlas,
    v: verts,
    i: m.idx.length,
    p: push(new Float32Array(m.pos)),
    n: push(Int8Array.from(m.nor, (v) => Math.round(v * 127))),
    u: uvInside ? push(Uint16Array.from(m.uv, (v) => Math.round(v * 65535))) : push(new Float32Array(m.uv)),
    uq: uvInside ? 1 : 0,
    x: verts < 65536 ? push(Uint16Array.from(m.idx)) : push(Uint32Array.from(m.idx)),
    box: [+(hi[0] - lo[0]).toFixed(3), +(hi[2] - lo[2]).toFixed(3), +(hi[1] - lo[1]).toFixed(3)],
  };
}

fs.mkdirSync(OUT, { recursive: true });
const atlases = {};
for (const p of PACKS) {
  const file = `${p.id}.png`;
  fs.copyFileSync(path.join(ROOT, p.pack, p.atlas), path.join(OUT, file));
  atlases[p.id] = file;
}
const ground = {};
for (const [id, sheet] of Object.entries(GROUND)) {
  ground[id] = `${id}.jpg`;
  await cutSheet(path.join(PAINT, `${sheet}.png`), path.join(OUT, ground[id]));
}
const binBytes = Buffer.concat(chunks);
const jsonText = `${JSON.stringify({ v: 1, bytes: offset, atlases, ground, models: index })}\n`;
fs.writeFileSync(path.join(OUT, 'kit.bin'), binBytes);
fs.writeFileSync(path.join(OUT, 'kit.json'), jsonText);

/* The kit's own fingerprint, for the board to ask for these files by. The names
   never change, so without it a cache anywhere between here and a player can
   hand them last week's index with this week's geometry, and the geometry is
   read at offsets the old index never wrote. A changed kit is a changed URL.
   See art-url versioning for the same rule on the card art. */
const fingerprint = createHash('sha1');
fingerprint.update(binBytes);
fingerprint.update(jsonText);
for (const p of PACKS) fingerprint.update(fs.readFileSync(path.join(OUT, `${p.id}.png`)));
for (const file of Object.values(ground)) fingerprint.update(fs.readFileSync(path.join(OUT, file)));
const version = fingerprint.digest('hex').slice(0, 12);
fs.writeFileSync(
  'src/lib/fiefKitVersion.js',
  `/* Written by scripts/build-fief-kit.mjs. Do not edit: run the bake again. */\n/** The fingerprint of public/models/fief, asked for by the board as ?v= so a cached kit can never be half old. */\nexport const KIT_VERSION = '${version}';\n`
);
fs.writeFileSync(
  path.join(OUT, 'LICENSE.txt'),
  `The models and atlases in this folder are cut from four KayKit packs by Kay Lousberg (www.kaylousberg.com), released under CC0. Each pack's own licence follows.\n\n${PACKS.map((p) => fs.readFileSync(path.join(ROOT, p.pack, 'License.txt'), 'utf8').trim()).join('\n\n----------------------------------------------------------------------\n\n')}\n\n----------------------------------------------------------------------\n\nThe ground sheets (${Object.values(ground).join(', ')}) are cut from ${Object.values(GROUND).join(', ')} of the Watercolor Terrain Textures pack by Jonas Voland of Voxel Core Lab, released under CC0. Its own licence follows.\n\n${fs.readFileSync(path.join(PAINT, 'LICENCE.txt'), 'utf8').trim()}\n`
);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const sheets = Object.values(ground).reduce((n, file) => n + fs.statSync(path.join(OUT, file)).size, 0);
console.log(`build-fief-kit: ${Object.keys(index).length} models, ${kb(offset)} of geometry, ${kb(sheets)} of ground sheets, from ${ROOT}`);
if (missing.length) {
  console.error(`build-fief-kit: ${missing.length} names found in no pack: ${missing.join(', ')}`);
  process.exit(1);
}
