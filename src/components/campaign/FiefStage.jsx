import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { CAT, REACH, wallRun } from '../../lib/fief.js';
import { ALL, axial, hgt, hk, inmap, terr, world } from '../../lib/fiefIsland.js';
import { CR, footOf, ghostPieces, setBoxes, townPieces } from '../../lib/fiefLooks.js';

/**
 * The Fief's board: the island and the town on it, in KayKit miniatures.
 *
 * Fetched only when the Fief tab is opened, like the physics dice: three.js is
 * the heaviest thing this site can load, and a table that never founds a town
 * never pays for it. A browser that cannot draw it gets the panels alone, which
 * hold every order the board does.
 *
 * It decides nothing. The town arrives folded (src/lib/fief.js) and the board
 * draws exactly that, with every placement worked out by src/lib/fiefLooks.js.
 * A click hands the hex back up and the tab decides what it means.
 *
 * ------------------------------------------------------------ how it draws
 * The models come baked into one file (scripts/build-fief-kit.mjs), already in
 * their own space with every node transform applied, so there is no glTF loader
 * here. Every placement that reads the same atlas is merged into one mesh, so a
 * town of six hundred is four draw calls. It draws on demand: when the town, the
 * view, the hover or the selection changes, and never in a loop.
 */

const BASE = `${import.meta.env.BASE_URL}models/fief/`;
const ASPECT = 760 / 1200;
const DIR = new THREE.Vector3(1, 1.45, 1).normalize();
const TOP_SEA = -0.2;
const BG = '#1b1830';

/* --------------------------------------------------------------- the kit */

let KIT = null;

/** The kit, fetched once per visit and shared by every board that opens. */
function loadKit() {
  KIT ??= (async () => {
    const [index, bin] = await Promise.all([
      fetch(`${BASE}kit.json`).then((r) => {
        if (!r.ok) throw new Error(`kit.json ${r.status}`);
        return r.json();
      }),
      fetch(`${BASE}kit.bin`).then((r) => {
        if (!r.ok) throw new Error(`kit.bin ${r.status}`);
        return r.arrayBuffer();
      }),
    ]);
    const loader = new THREE.TextureLoader();
    const mats = {};
    await Promise.all(
      Object.entries(index.atlases).map(async ([id, file]) => {
        const tex = await loader.loadAsync(`${BASE}${file}`);
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        mats[id] = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 });
      })
    );
    const geo = {};
    const boxes = {};
    for (const [name, m] of Object.entries(index.models)) {
      geo[name] = {
        atlas: m.a,
        pos: new Float32Array(bin, m.p, m.v * 3),
        nor: new Int8Array(bin, m.n, m.v * 3),
        uv: m.uq ? new Uint16Array(bin, m.u, m.v * 2) : new Float32Array(bin, m.u, m.v * 2),
        uq: !!m.uq,
        idx: m.v < 65536 ? new Uint16Array(bin, m.x, m.i) : new Uint32Array(bin, m.x, m.i),
      };
      boxes[name] = m.box;
    }
    setBoxes(boxes);
    return { geo, mats };
  })();
  KIT.catch(() => {
    KIT = null;
  });
  return KIT;
}

/**
 * Placements merged into one geometry per atlas, or into one for a ghost.
 * A placement is [model, x, y, z, turn in sixths, stretch, scale].
 */
function mergeAll(kit, list, one = false, missing = null) {
  const by = {};
  for (const p of list) {
    const g = kit.geo[p[0]];
    if (!g) {
      missing?.add(p[0]);
      continue;
    }
    const a = one ? 'one' : g.atlas;
    (by[a] ??= []).push(p);
  }
  const out = {};
  for (const [a, places] of Object.entries(by)) out[a] = merge(kit, places);
  return out;
}

function merge(kit, places) {
  let verts = 0;
  let tris = 0;
  for (const p of places) {
    verts += kit.geo[p[0]].pos.length / 3;
    tris += kit.geo[p[0]].idx.length;
  }
  const pos = new Float32Array(verts * 3);
  const nor = new Float32Array(verts * 3);
  const uv = new Float32Array(verts * 2);
  const idx = new Uint32Array(tris);
  let o = 0;
  let t = 0;
  for (const p of places) {
    const g = kit.geo[p[0]];
    const turn = (p[4] * Math.PI) / 3;
    const cs = Math.cos(turn);
    const sn = Math.sin(turn);
    const sc = p[6] || 1;
    const sy = (p[5] || 1) * sc;
    const n = g.pos.length / 3;
    for (let i = 0; i < g.idx.length; i += 1) idx[t + i] = g.idx[i] + o;
    t += g.idx.length;
    for (let i = 0; i < n; i += 1, o += 1) {
      const px = g.pos[i * 3];
      const py = g.pos[i * 3 + 1];
      const pz = g.pos[i * 3 + 2];
      const nx = g.nor[i * 3] / 127;
      const ny = g.nor[i * 3 + 1] / 127;
      const nz = g.nor[i * 3 + 2] / 127;
      pos[o * 3] = p[1] + (px * cs + pz * sn) * sc;
      pos[o * 3 + 1] = p[2] + py * sy;
      pos[o * 3 + 2] = p[3] + (-px * sn + pz * cs) * sc;
      nor[o * 3] = nx * cs + nz * sn;
      nor[o * 3 + 1] = ny;
      nor[o * 3 + 2] = -nx * sn + nz * cs;
      uv[o * 2] = g.uq ? g.uv[i * 2] / 65535 : g.uv[i * 2];
      uv[o * 2 + 1] = g.uq ? g.uv[i * 2 + 1] / 65535 : g.uv[i * 2 + 1];
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere();
  return geo;
}

/* ------------------------------------------------------------ plain hexes */

function vtx(cx, cz, v, rad, y) {
  const a = ((30 + 60 * v) * Math.PI) / 180;
  return [cx + Math.cos(a) * rad, y, cz + Math.sin(a) * rad];
}

/** Flat hexes and their sides, for the picking prisms and the overlay. */
function hexGeometry(cells, lift, rad, sides = null) {
  const p = [];
  const push = (...vs) => vs.forEach((v) => p.push(v[0], v[1], v[2]));
  for (const h of cells) {
    const [x, z] = world(h);
    const y0 = terrainTop(h);
    const top = y0 + (typeof lift === 'function' ? lift(h) : lift);
    for (let v = 0; v < 6; v += 1) push([x, top, z], vtx(x, z, v + 1, rad, top), vtx(x, z, v, rad, top));
    if (sides && top > y0 + 0.05) {
      for (let i = 0; i < 6; i += 1) {
        const a = vtx(x, z, i - 1, CR, top);
        const b = vtx(x, z, i, CR, top);
        push([b[0], y0, b[2]], [a[0], y0, a[2]], a, [b[0], y0, b[2]], a, b);
      }
    }
  }
  if (!p.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

const terrainTop = (h) => (terr(h) === 'S' ? TOP_SEA : hgt(h));

function outline(h, color, lift = 0.04) {
  const [x, z] = world(h);
  const y = terrainTop(h) + lift;
  const pts = [];
  for (let v = 0; v <= 6; v += 1) {
    const p = vtx(x, z, v, CR * 0.97, y);
    pts.push(new THREE.Vector3(p[0], p[1], p[2]));
  }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, depthTest: false }));
  line.renderOrder = 8;
  return line;
}

function hexes(cells, color, opacity) {
  const geo = hexGeometry(cells, 0.03, CR * 0.88);
  if (!geo) return null;
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
  mesh.renderOrder = 6;
  return mesh;
}

/* --------------------------------------------------------------- sprites */

function rounded(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function sprite(canvas, w, h, x, y, z) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(w, h, 1);
  sp.position.set(x, y, z);
  sp.renderOrder = 10;
  return sp;
}

/** The badge over a project: its progress, and the days it has left. */
function badge(p, left, x, top, z) {
  const cv = document.createElement('canvas');
  cv.width = 192;
  cv.height = 56;
  const g = cv.getContext('2d');
  rounded(g, 2, 6, 188, 44, 14);
  g.fillStyle = 'rgba(24,20,37,0.92)';
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = '#f3c04c';
  g.stroke();
  rounded(g, 14, 20, 104, 16, 8);
  g.fillStyle = '#3a3550';
  g.fill();
  if (p.started) {
    rounded(g, 14, 20, Math.max(16, (104 * p.done) / p.days), 16, 8);
    g.fillStyle = p.stalled ? '#e2574c' : '#7fd36a';
    g.fill();
  } else {
    g.fillStyle = '#b07a4a';
    for (let i = 0; i < 104; i += 18) g.fillRect(16 + i, 22, 8, 12);
  }
  g.fillStyle = '#ffffff';
  g.font = 'bold 26px Montserrat, Arial, sans-serif';
  g.textBaseline = 'middle';
  g.fillText(p.started ? `${left}d` : '...', 128, 29);
  return sprite(cv, 1.3, 0.38, x, top + 0.45, z);
}

/** Three dots over the selected building: its tier. */
function pips(level, x, top, z) {
  const cv = document.createElement('canvas');
  cv.width = 96;
  cv.height = 36;
  const g = cv.getContext('2d');
  rounded(g, 2, 2, 92, 32, 12);
  g.fillStyle = 'rgba(24,20,37,0.9)';
  g.fill();
  for (let i = 0; i < 3; i += 1) {
    g.beginPath();
    g.arc(22 + i * 26, 18, 8, 0, Math.PI * 2);
    g.fillStyle = i < level ? '#f3c04c' : '#4a4463';
    g.fill();
  }
  return sprite(cv, 0.66, 0.25, x, top + 0.3, z);
}

function dispose(group, scene) {
  if (!group) return;
  scene.remove(group);
  group.traverse((o) => {
    o.geometry?.dispose();
    if (o.userData.own) {
      o.material?.map?.dispose();
      o.material?.dispose();
    }
  });
}

const own = (o) => {
  if (o) o.traverse((x) => {
    x.userData.own = true;
  });
  return o;
};

/* ------------------------------------------------------------------ the view */

/** Where the camera looks and how far back it stands, for each of the three views. */
function frame(town, view) {
  if (view === 'island') return { at: [0.5, -2.5, 1.5], d: 112 };
  if (view === 'close') return { at: [0, 0, 1.0], d: 32 };
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  const keys = [...Object.keys(town.occ()), ...Object.keys(town.state.roads)];
  for (const k of keys) {
    const [x, z] = world(k.split(',').map(Number));
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    z0 = Math.min(z0, z);
    z1 = Math.max(z1, z);
  }
  if (!keys.length) return { at: [0, 0, 0], d: 40 };
  const span = Math.max(x1 - x0, z1 - z0) + 6;
  return { at: [(x0 + x1) / 2, -0.4, (z0 + z1) / 2 + 0.6], d: Math.max(34, Math.min(104, span * 2.55)) };
}

/** What has to change for the town's meshes to be built again. */
function signature(town) {
  const st = town.state;
  return JSON.stringify([
    st.buildings.map((b) => [b.id, b.type, b.q, b.r, b.level, b.ruined ? 1 : 0, b.type === 'custom' ? town.modelOf(b) : 0, town.upgradeOf(b.id) ? 1 : 0]),
    st.houses.map((q) => [q.q, q.r]),
    Object.keys(st.roads).sort(),
    st.projects.map((p) => [p.id, p.done, p.days, p.started ? 1 : 0, p.stalled ? 1 : 0]),
    st.day,
  ]);
}

/* ---------------------------------------------------------------- the board */

/**
 * `placing` is null, or `{ type, model, wallStart }` while a building, a run of
 * wall or a custom building is being put down. `selected` is the key the panel
 * has open. `onPick(hex, pointerType)` hands a click back, with null for a click
 * off the island.
 */
export default function FiefStage({ town, view = 'town', placing = null, selected = null, onPick, onHover, onFail, label }) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const rig = useRef(null);
  const [kit, setKit] = useState(null);
  const [hover, setHover] = useState(null);
  const [failed, setFailed] = useState(false);

  /* The renderer, the lights and the camera: once per board. */
  useEffect(() => {
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas.current, antialias: true });
    } catch (error) {
      /* No WebGL at all. Said after this render rather than inside it. */
      queueMicrotask(() => {
        setFailed(true);
        onFail?.(error);
      });
      return undefined;
    }
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    const camera = new THREE.PerspectiveCamera(24, 1 / ASPECT, 1, 400);
    /* The preview's lights were set in the old units. Since three r155 a light's
       intensity is physical, and the old look is the old number times pi. */
    scene.add(new THREE.HemisphereLight('#fff6e6', '#4a4262', 0.8 * Math.PI));
    const sun = new THREE.DirectionalLight('#fff2dc', 0.95 * Math.PI);
    sun.position.set(-26, 46, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(small ? 2048 : 4096, small ? 2048 : 4096);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.03;
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 130 });
    scene.add(sun);

    const state = { renderer, scene, camera, town: null, overlay: null, proxies: null, badges: null, heights: {}, sig: '', frame: null, queued: 0 };
    state.render = () => {
      if (state.queued) return;
      state.queued = requestAnimationFrame(() => {
        state.queued = 0;
        renderer.render(scene, camera);
      });
    };
    const fit = () => {
      const w = wrap.current?.clientWidth || 1200;
      const h = Math.max(280, Math.min(Math.round(w * ASPECT), Math.round(window.innerHeight * 0.72)));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      state.render();
    };
    state.fit = fit;
    const watch = new ResizeObserver(fit);
    watch.observe(wrap.current);
    fit();
    rig.current = state;

    let live = true;
    loadKit()
      .then((loaded) => {
        if (live) setKit(loaded);
      })
      .catch((error) => {
        console.warn('The Fief board could not load its models.', error);
        if (live) {
          setFailed(true);
          onFail?.(error);
        }
      });

    return () => {
      live = false;
      watch.disconnect();
      cancelAnimationFrame(state.queued);
      dispose(state.town, scene);
      dispose(state.overlay, scene);
      dispose(state.badges, scene);
      if (state.proxies) {
        state.proxies.geometry.dispose();
        state.proxies.material.dispose();
      }
      renderer.dispose();
      rig.current = null;
    };
    // The board is built once; the props below are read by the effects that follow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The town's meshes, rebuilt only when something on the board changed. */
  useEffect(() => {
    const R = rig.current;
    if (!R || !kit || !town) return;
    const sig = signature(town);
    if (sig !== R.sig) {
      R.sig = sig;
      const { list, heights } = townPieces(town);
      const missing = new Set();
      dispose(R.town, R.scene);
      R.town = new THREE.Group();
      for (const [atlas, geo] of Object.entries(mergeAll(kit, list, false, missing))) {
        const mesh = new THREE.Mesh(geo, kit.mats[atlas]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        R.town.add(mesh);
      }
      R.scene.add(R.town);
      if (missing.size) console.warn(`The Fief kit has no ${[...missing].join(', ')}. Run node scripts/build-fief-kit.mjs.`);
      R.heights = heights;

      if (R.proxies) {
        R.proxies.geometry.dispose();
        R.scene.remove(R.proxies);
      }
      R.proxies = new THREE.Mesh(hexGeometry(ALL, (h) => R.heights[hk(h)] || 0.02, CR * 0.999, true), new THREE.MeshBasicMaterial({ visible: false }));
      R.scene.add(R.proxies);

      dispose(R.badges, R.scene);
      R.badges = new THREE.Group();
      const when = town.schedule();
      for (const p of town.state.projects) {
        const c = p.cells ? p.cells[0] : [p.q, p.r];
        const [x, z] = world(c);
        R.badges.add(badge(p, (when[p.id]?.end ?? town.state.day) - town.state.day, x, hgt(c) + (R.heights[hk(c)] || 0.8), z));
      }
      R.scene.add(own(R.badges));
    }
    /* Aimed when the view is picked and on the first draw, never as the town
       grows: a camera that jumped every time somebody ordered a hut would be a
       camera nobody could point at anything. */
    if (R.aimed !== view) {
      R.aimed = view;
      const f = frame(town, view);
      const at = new THREE.Vector3(...f.at);
      R.camera.position.copy(at).addScaledVector(DIR, f.d);
      R.camera.lookAt(at);
      R.camera.updateMatrixWorld();
    }
    R.render();
  }, [kit, town, view]);

  /* Where the building being placed may go: worked out once per town and
     per thing being placed, not once per hex the mouse crosses. */
  const valid = useMemo(() => {
    const type = placing?.type;
    if (!town || !type) return [];
    const ok = (h) => (type === 'custom' ? !town.customWhy(h) : CAT[type].line ? (placing.wallStart ? lineEnds(town, placing.wallStart, h) : !town.wallWhy([h])) : !town.placeWhy(type, h));
    return ALL.filter(ok);
  }, [town, placing]);

  /* The overlay: where a building may go, its ghost, the hover and the selection. */
  useEffect(() => {
    const R = rig.current;
    if (!R || !kit || !town) return;
    dispose(R.overlay, R.scene);
    const g = new THREE.Group();
    const type = placing?.type ?? null;
    if (type) {
      const ok = (h) => valid.some((v) => v[0] === h[0] && v[1] === h[1]);
      /* Cyan rather than the preview's yellow: the kit's grass is a yellow
         green, and a yellow wash over it could not be seen at all. Over that
         grass the cyan reads as green, which is what the panel calls it. */
      const where = hexes(valid, '#00e5ff', 0.38);
      if (where) g.add(where);
      if (hover && inmap(hover)) {
        if (CAT[type]?.line) {
          const run = placing.wallStart ? wallRun(placing.wallStart, hover) : [hover];
          const m = hexes(run.filter(inmap), !town.wallWhy(run) ? '#7fd36a' : '#e2574c', 0.6);
          if (m) g.add(m);
        } else {
          const good = ok(hover);
          const geos = mergeAll(kit, ghostPieces(town, type, hover, placing.model), true);
          if (geos.one) {
            const ghost = new THREE.Mesh(geos.one, new THREE.MeshStandardMaterial({ color: good ? '#9be38a' : '#ef7d72', emissive: good ? '#1d4a12' : '#5a1410', transparent: true, opacity: 0.6, depthWrite: false, roughness: 0.8 }));
            ghost.renderOrder = 7;
            g.add(ghost);
          }
          g.add(outline(hover, good ? '#7fd36a' : '#e2574c'));
          if (good && type !== 'custom') {
            const path = town.streetPath(hover, REACH) ?? [];
            const m = path.length ? hexes(path, '#d9c3a0', 0.6) : null;
            if (m) g.add(m);
          }
        }
      }
    } else if (hover) {
      const f = footOf(town, keyFor(town, hover));
      if (f) g.add(outline(f.at, '#ffffff', 0.05));
    }
    const sel = footOf(town, selected);
    if (sel) {
      g.add(outline(sel.at, '#f3c04c', 0.05));
      const b = sel.building;
      if (b && !b.ruined && !CAT[b.type].nolevel) {
        const [x, z] = world(sel.at);
        g.add(pips(b.level, x, hgt(sel.at) + (R.heights[hk(sel.at)] || 1), z));
      }
    }
    R.overlay = own(g);
    R.scene.add(g);
    R.render();
  }, [kit, town, placing, valid, hover, selected]);

  /* Which hex is under the pointer, read off the picking prisms. */
  const ray = useRef(new THREE.Raycaster());
  function hexAt(e) {
    const R = rig.current;
    if (!R?.proxies) return null;
    const r = canvas.current.getBoundingClientRect();
    /* The camera's matrix is otherwise brought up to date by drawing a frame,
       and a frame waits for the browser to ask for one. A click must not. */
    R.camera.updateMatrixWorld();
    ray.current.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), R.camera);
    const hit = ray.current.intersectObject(R.proxies, false)[0];
    if (!hit) return null;
    let p = hit.point;
    if (hit.face && hit.face.normal.y < 0.5) p = p.clone().addScaledVector(ray.current.ray.direction, 0.02);
    const h = axial(p.x, p.z);
    return inmap(h) ? h : null;
  }

  const same = (a, b) => (a && b ? a[0] === b[0] && a[1] === b[1] : a === b);

  return (
    <div className="fief-stage" ref={wrap}>
      <canvas
        ref={canvas}
        className="fief-canvas"
        role="img"
        aria-label={label}
        onPointerMove={(e) => {
          const h = hexAt(e);
          if (!same(h, hover)) {
            setHover(h);
            onHover?.(h);
          }
        }}
        onPointerLeave={() => {
          setHover(null);
          onHover?.(null);
        }}
        onClick={(e) => {
          const h = hexAt(e);
          setHover(h);
          onPick?.(h, e.nativeEvent.pointerType || 'mouse');
        }}
      />
      {!kit && !failed && <div className="fief-loading">Laying out the island...</div>}
      {failed && <div className="fief-loading">This browser cannot draw the board. The panels beside it hold every order.</div>}
    </div>
  );
}

/** Whether a run from `from` can end on this hex. */
function lineEnds(town, from, h) {
  const run = wallRun(from, h);
  const e = run.at(-1);
  return e[0] === h[0] && e[1] === h[1] && !town.wallWhy(run);
}

function keyFor(town, h) {
  const k = hk(h);
  return town.occ()[k] ?? (town.state.roads[k] || terr(h) ? `hex:${k}` : null);
}
