// ====================================================================
// 證交所政策島：3D 引擎（場景、日夜、零件庫、模型）
// ====================================================================
let THREE, OrbitControls, CSS2DRenderer, CSS2DObject, RoundedBoxGeometry, BGU, SimplexNoise;

const R = 2.02, SPACING = 2.28, TOP = 0.65, WATER_Y = -0.18, WALK_R = 1.8;
const SQ3 = Math.sqrt(3);
const C = {
  coral: '#db6a41', ink: '#211d1d', cream: '#fff8f4', yellow: '#fcea8b', stone: '#c5b5a7', green: '#71806a',
  glass: '#86a8a6', wood: '#b48560', teal: '#3e7c8c', leaf1: '#9cc27a', leaf2: '#8db86f', leaf3: '#728f5f',
  pink: '#f2b5c6', aqua: '#58a6a6', blue: '#6f7fb5', wall: '#f4ebdd', eave: '#a34e34', win: '#a8c4c2',
  curb: '#e4d6c3', glow: '#ffc777', up: '#d65a4a', down: '#5f8f62', metal: '#9aa0a6', dark: '#3a3434'
};

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rngFor = seed => { const f = mulberry32(seed); return { random: f, f, r: (a, b) => a + (b - a) * f(), i: (a, b) => Math.floor(a + (b - a + 1) * f()), pick: arr => arr[Math.floor(f() * arr.length)] }; };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- 語言 ----------
let LANG = 'zh';
try { const q = new URLSearchParams(location.search).get('lang'); if (q) LANG = q === 'en' ? 'en' : 'zh'; } catch (e) { }
if (location.hash === '#en') LANG = 'en';
if (!/[?&]lang=|#en/.test(location.search + location.hash)) {
  try { const s = localStorage.getItem('twse-city-lang'); if (s === 'en' || s === 'zh') LANG = s; } catch (e) { }
}
const tr = (zh, en) => (LANG === 'en' && en) ? en : zh;
const nm = o => tr(o.name, o.en);
const factText = f => { const [zh, en] = f.split('|'); return tr(zh, en || zh); };

// ---------- 資料索引 ----------
const ISL = DATA.islands.map((d, i) => ({ ...d, idx: i }));
const ISLAND = {}; const ITEM = {}; const FLOW = {};
ISL.forEach(is => { ISLAND[is.id] = is; is.items.forEach((it, k) => { it.island = is; it.k = k; ITEM[it.id] = it; }); });
DATA.flows.forEach(f => FLOW[f.id] = f);
const CIRCLED = '①②③④⑤⑥⑦⑧⑨';

// ---------- 全域狀態 ----------
const S = {
  min: 510, paused: false, reduced: false, names: false, walkers: true, flows: false, bird: false, log: false,
  sel: null, seg: -1, time: 0, dirty: true, fly: null, mode: 'home', sideOpen: true, tab: 'topics', query: '', logFilter: 'all'
};
const isMobile = () => window.matchMedia('(max-width: 800px)').matches;

let renderer, scene, camera, controls, labelRenderer, glHost, center = null;
let sky, skyMat, hemi, sun, fill, waterMats = [], glowMat, solidMat, poolMat, mountainBands = [], clouds = [], boats = [];
let kitMeshes = [], smallMeshes = [], ownerIndex = new Map(), islandCaps = [];
let exchangeClock = null;

// ====================================================================
// 幾何零件
// ====================================================================
const GEO = {};
const GLOW_KINDS = new Set(['glowbox', 'glowsphere']);
function buildGeometries() {
  GEO.box = new THREE.BoxGeometry(1, 1, 1);
  GEO.rbox = new RoundedBoxGeometry(1, 1, 1, 2, 0.12);
  GEO.cyl = new THREE.CylinderGeometry(.5, .5, 1, 14);
  GEO.cone = new THREE.ConeGeometry(.5, 1, 14);
  GEO.sphere = new THREE.SphereGeometry(.5, 16, 12);
  GEO.ico = new THREE.IcosahedronGeometry(.5, 1);
  GEO.dome = new THREE.SphereGeometry(.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  GEO.torus = new THREE.TorusGeometry(.5, .12, 8, 24);
  const sh = new THREE.Shape(); sh.moveTo(-.5, -.5); sh.lineTo(.5, -.5); sh.lineTo(0, .5); sh.closePath();
  GEO.prism = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }).translate(0, 0, -.5);
  GEO.hip = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4);
  GEO.glowbox = GEO.box; GEO.glowsphere = new THREE.SphereGeometry(.5, 10, 8);
  for (const k in GEO) GEO[k].computeBoundingSphere();
}

// ====================================================================
// 建模 API：模型函式只呼叫 P()/B()…，由 SINK 決定變成 instance 還是一般 mesh
// ====================================================================
let SINK = null, FRAME = null, OWNER = null, SMALL = false;
let M4, QT, EU, V3a, V3b;
function initMath() { M4 = new THREE.Matrix4(); QT = new THREE.Quaternion(); EU = new THREE.Euler(); V3a = new THREE.Vector3(); V3b = new THREE.Vector3(); FRAME = new THREE.Matrix4(); }
function P(kind, x, y, z, sx, sy, sz, color, ry = 0, rx = 0, rz = 0) {
  EU.set(rx, ry, rz, 'YXZ'); QT.setFromEuler(EU); V3a.set(x, y, z); V3b.set(sx, sy, sz);
  M4.compose(V3a, QT, V3b).premultiply(FRAME);
  SINK.add(kind, M4, color, OWNER, SMALL);
}
const B = (x, y0, z, w, h, d, c, ry = 0) => P('box', x, y0 + h / 2, z, w, h, d, c, ry);
const RB = (x, y0, z, w, h, d, c, ry = 0) => P('rbox', x, y0 + h / 2, z, w, h, d, c, ry);
const CY = (x, y0, z, r, h, c, rx = 0, rz = 0) => P('cyl', x, y0 + h / 2, z, r * 2, h, r * 2, c, 0, rx, rz);
const CN = (x, y0, z, r, h, c) => P('cone', x, y0 + h / 2, z, r * 2, h, r * 2, c);
const SP = (x, y, z, r, c) => P('sphere', x, y, z, r * 2, r * 2, r * 2, c);
const IC = (x, y, z, r, c, sy = 1) => P('ico', x, y, z, r * 2, r * 2 * sy, r * 2, c);
const DM = (x, y0, z, r, c, sy = 1) => P('dome', x, y0, z, r * 2, r * 2 * sy, r * 2, c);
const HP = (x, y0, z, w, h, d, c, ry = 0) => P('hip', x, y0 + h / 2, z, w, h, d, c, ry);
const PR = (x, y0, z, w, h, d, c, ry = 0) => P('prism', x, y0 + h / 2, z, w, h, d, c, ry);
const GB = (x, y0, z, w, h, d, c = C.win, ry = 0) => P('glowbox', x, y0 + h / 2, z, w, h, d, c, ry);
const GS = (x, y, z, r, c = C.glow) => P('glowsphere', x, y, z, r * 2, r * 2, r * 2, c);
const TO = (x, y, z, r, c, ry = 0, rx = 0, tube = 1) => P('torus', x, y, z, r * 2, r * 2, r * 2 * tube, c, ry, rx);

// instance 收集器
class KitSink {
  constructor(seed) { this.groups = new Map(); this.rng = mulberry32(seed); this.kit = true; }
  add(kind, m, color, owner, small) {
    const key = kind + (small ? '|s' : '');
    let g = this.groups.get(key);
    if (!g) { g = { kind, small, list: [] }; this.groups.set(key, g); }
    const j = 1 + (this.rng() * 2 - 1) * 0.0072;
    const mm = m.clone(); mm.scale(new THREE.Vector3(j, j, j));
    g.list.push({ m: mm, c: new THREE.Color(color), owner });
  }
  build(parent) {
    for (const g of this.groups.values()) {
      const glow = GLOW_KINDS.has(g.kind);
      const mesh = new THREE.InstancedMesh(GEO[g.kind], glow ? glowMat : solidMat, g.list.length);
      mesh.userData.owners = [];
      mesh.userData.base = [];
      g.list.forEach((it, i) => {
        mesh.setMatrixAt(i, it.m); mesh.setColorAt(i, it.c);
        mesh.userData.owners.push(it.owner); mesh.userData.base.push(it.c);
        if (it.owner) { if (!ownerIndex.has(it.owner)) ownerIndex.set(it.owner, []); ownerIndex.get(it.owner).push([mesh, i]); }
      });
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = !glow || g.kind === 'glowbox'; mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      mesh.userData.kit = true;
      parent.add(mesh); kitMeshes.push(mesh); if (g.small) smallMeshes.push(mesh);
    }
  }
}
// 一般 mesh 收集器（縮圖用）
class MeshSink {
  constructor(group) { this.group = group; this.kit = false; this.mats = []; }
  add(kind, m, color) {
    const glow = GLOW_KINDS.has(kind);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: .78, metalness: 0, emissive: glow ? C.glow : '#000', emissiveIntensity: glow ? .35 : 0 });
    this.mats.push(mat);
    const mesh = new THREE.Mesh(GEO[kind], mat); mesh.matrixAutoUpdate = false; mesh.matrix.copy(m); this.group.add(mesh);
  }
}
function withFrame(mat, fn) { const prev = FRAME.clone(); FRAME.multiply(mat); fn(); FRAME.copy(prev); }
function localT(x, y, z, ry = 0, s = 1) { return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, s, s)); }

// 迷你人（靜態擺設用）
function miniPerson(x, z, c, ry = 0, s = 1) {
  withFrame(localT(x, 0, z, ry, s), () => {
    CY(0, 0, 0, .045, .12, C.dark); RB(0, .1, 0, .11, .14, .08, c); SP(0, .27, 0, .065, '#f3d2b5'); DM(0, .272, -.005, .068, '#3a2a24', .9);
  });
}

// ====================================================================
// 細項 archetype：單位空間（底面 ±0.5、高 0–1.5），回傳頂端高度
// ====================================================================
const MODELS = {
  house(r, it) {
    RB(0, 0, 0, .92, .08, .92, C.curb);
    B(0, .08, 0, .7, .5, .6, C.wall);
    B(0, .56, 0, .8, .05, .7, C.eave);
    HP(0, .6, 0, .84, .4, .74, C.coral);
    GB(-.17, .26, .301, .14, .16, .02); GB(.17, .26, .301, .14, .16, .02);
    GB(.351, .26, 0, .02, .16, .14);
    B(0, .08, .302, .13, .24, .02, C.wood);
    B(.2, .74, -.12, .08, .2, .08, C.eave);
    CY(-.34, .08, .34, .07, .08, C.stone); IC(-.34, .2, .34, .08, C.leaf2);
    return 1.0;
  },
  office(r, it) {
    RB(0, 0, 0, .94, .07, .94, C.curb);
    const floors = 4;
    B(0, .07, 0, .66, .2, .62, C.stone);
    for (let f = 0; f < floors; f++) {
      const y = .27 + f * .25;
      B(0, y, 0, .62, .25, .58, f % 2 ? C.wall : '#efe2d0');
      for (let k = -1; k <= 1; k++) { GB(k * .18, y + .06, .291, .12, .13, .02); GB(.311, y + .06, k * .17, .02, .13, .11); }
    }
    B(0, .27 + floors * .25, 0, .7, .05, .66, C.eave);
    B(.12, .32 + floors * .25, -.1, .2, .1, .2, C.stone);
    IC(-.18, .38 + floors * .25, .12, .1, C.leaf1); IC(-.04, .36 + floors * .25, .16, .07, C.leaf2);
    B(0, .07, .315, .2, .18, .02, C.glass);
    return 1.45;
  },
  exchange(r, it) {
    RB(0, 0, 0, 1, .06, .96, C.curb);
    B(0, .06, .05, .92, .05, .86, C.stone); B(0, .11, .03, .86, .05, .8, '#d6c8bb'); B(0, .16, 0, .8, .05, .74, C.cream);
    B(0, .21, -.08, .72, .5, .5, C.wall);
    for (let k = 0; k < 6; k++) CY(-.3 + k * .12, .21, .23, .032, .5, C.cream);
    B(0, .71, .02, .82, .07, .64, C.cream);
    PR(0, .78, .02, .84, .22, .66, C.coral);
    B(0, .2, .18, .14, .3, .02, C.wood);
    GB(-.2, .3, .171, .1, .18, .02); GB(.2, .3, .171, .1, .18, .02);
    B(0, .95, -.08, .3, .3, .22, C.wall); HP(0, 1.25, -.08, .34, .22, .26, C.eave);
    clockFace(0, 1.1, .035, .12);
    return 1.5;
  },
  hall(r, it) {
    RB(0, 0, 0, .96, .07, .9, C.curb);
    B(0, .07, -.04, .86, .46, .62, C.wall);
    B(0, .53, -.04, .92, .05, .68, C.eave);
    DM(0, .58, -.04, .3, C.teal, .7);
    B(0, .38, .275, .8, .14, .04, C.ink);
    for (let k = 0; k < 9; k++) GB(-.34 + k * .085, .405, .3, .06, .07, .02, k % 3 === 1 ? '#f0a58a' : C.yellow);
    for (let k = -1; k <= 1; k++) GB(k * .24, .14, .271, .14, .18, .02);
    B(0, .07, .32, .3, .02, .14, C.stone);
    return 1.0;
  },
  indexTower(r, it) {
    RB(0, 0, 0, .96, .07, .9, C.curb);
    B(0, .07, 0, .86, .05, .7, C.stone);
    const hs = [.32, .5, .4, .66, .58, .82, .74];
    let top = 0;
    hs.forEach((h, k) => {
      const x = -.36 + k * .12, upc = k === 0 || hs[k] > hs[k - 1];
      B(x, .12 + h * .2, 0, .022, h * .9, .022, C.dark);
      B(x, .12 + h * .32, 0, .085, h * .55, .085, upc ? C.up : C.down);
      top = Math.max(top, .12 + h * 1.1);
    });
    CY(.36, .12, -.22, .015, .95, C.dark); SP(.36, 1.12, -.22, .09, C.yellow);
    TO(.36, 1.12, -.22, .12, C.coral, 0, Math.PI / 2, .4);
    return 1.25;
  },
  gate(r, it) {
    RB(0, 0, 0, .96, .06, .96, C.curb);
    B(-.36, .06, -.1, .14, .7, .16, C.cream); B(.36, .06, -.1, .14, .7, .16, C.cream);
    TO(0, .66, -.1, .38, C.coral, 0, 0, .9);
    B(0, .76, -.1, .5, .12, .06, C.yellow);
    B(0, .06, .15, .26, .012, .7, '#b8322a');
    CY(-.22, .06, .3, .02, .3, C.wood); CY(.22, .06, .3, .02, .3, C.wood);
    B(0, .32, .3, .44, .035, .015, C.coral); SP(0, .335, .31, .04, C.coral);
    RB(.3, .06, .34, .16, .14, .12, C.wood);
    miniPerson(-.08, .38, C.ink, 0, .8);
    return 1.15;
  },
  greenhouse(r, it) {
    RB(0, 0, 0, .98, .07, .94, C.curb);
    B(0, .07, -.05, .76, .04, .64, C.wood);
    B(0, .11, -.05, .72, .36, .6, C.glass);
    PR(0, .47, -.05, .74, .26, .62, '#9ec3bf', Math.PI / 2);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { CN(-.22 + i * .22, .11, -.25 + j * .2, .04, .1, C.leaf1); }
    CY(.33, .07, .32, .05, .22, '#f3f0ea'); CN(.33, .29, .32, .05, .1, C.coral);
    B(.33, .07, .32, .14, .05, .02, C.coral); B(.33, .07, .32, .02, .05, .14, C.coral);
    CY(-.3, .07, .32, .06, .06, C.stone); CN(-.3, .13, .32, .03, .08, C.leaf2); IC(-.27, .2, .32, .03, C.leaf1, .5);
    return 1.0;
  },
  rocket(r, it) {
    RB(0, 0, 0, .9, .07, .9, C.curb);
    CY(0, .07, 0, .32, .06, C.stone);
    B(-.28, .13, -.1, .05, .7, .05, C.dark); B(-.2, .7, -.1, .2, .03, .03, C.dark);
    CY(0, .25, 0, .12, .62, '#f6f2ec'); CN(0, .87, 0, .12, .26, C.coral);
    SP(0, .62, .11, .045, C.teal);
    for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3; B(Math.sin(a) * .13, .2, Math.cos(a) * .13, .03, .2, .12, C.coral, a); }
    CN(0, .13, 0, .1, .12, C.yellow);
    CN(.32, .07, .26, .03, .1, C.leaf1); CN(.26, .07, .32, .025, .08, C.leaf2);
    return 1.15;
  },
  basket(r, it) {
    RB(0, 0, 0, .94, .07, .94, C.curb);
    CY(0, .07, 0, .38, .34, C.wood);
    for (let k = 0; k < 4; k++) B(0, .12 + k * .075, 0, .79, .012, .79, '#9a6e4c', k * .4);
    TO(0, .41, 0, .38, '#9a6e4c', 0, Math.PI / 2, .5);
    const cols = [C.coral, C.yellow, C.aqua, C.blue, C.pink, C.leaf1, C.teal, '#f0a58a'];
    let n = 0;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      if (Math.hypot(i, j) > 1.3) continue;
      const h = .1 + ((i * 7 + j * 13 + 20) % 5) * .03;
      RB(i * .19, .38, j * .19, .15, h, .15, cols[n++ % cols.length], (i + j) * .3);
    }
    TO(0, .45, 0, .32, C.wood, 0, 0, .35);
    return 1.0;
  },
  meeting(r, it) {
    RB(0, 0, 0, .96, .07, .9, C.curb);
    B(0, .07, -.32, .7, .5, .04, C.ink); GB(0, .14, -.296, .62, .38, .01, '#e9eef0');
    B(-.15, .28, -.29, .1, .12, .01, C.coral); B(.02, .22, -.29, .1, .18, .01, C.aqua); B(.18, .25, -.29, .1, .15, .01, C.yellow);
    B(0, .07, .08, .6, .03, .26, C.wood);
    CY(-.25, .07, .08, .02, .14, C.dark); CY(.25, .07, .08, .02, .14, C.dark);
    B(0, .21, .08, .6, .03, .26, C.wood);
    for (let k = -1; k <= 1; k++) { miniPerson(k * .2, .32, [C.blue, C.coral, C.green][k + 1], Math.PI, .85); }
    miniPerson(-.38, -.12, C.ink, Math.PI / 2, .9);
    return 1.0;
  },
  scale(r, it) {
    RB(0, 0, 0, .94, .07, .94, C.curb);
    B(0, .07, 0, .3, .1, .3, C.stone);
    CY(0, .17, 0, .04, .72, C.cream); SP(0, .92, 0, .06, C.yellow);
    B(0, .86, 0, .74, .035, .04, C.coral);
    [-1, 1].forEach(s => {
      B(s * .33, .62, 0, .008, .24, .008, C.dark);
      CY(s * .33, .6, 0, .13, .025, C.yellow);
    });
    for (let k = 0; k < 4; k++) RB(-.28, .07 + k * .06, .3, .26, .05, .19, k % 2 ? C.cream : '#efe6d6', k * .12);
    for (let k = 0; k < 3; k++) RB(.3, .07 + k * .06, .3, .22, .05, .17, k % 2 ? '#e8dcc6' : C.cream, -k * .15);
    return 1.05;
  },
  vault(r, it) {
    RB(0, 0, 0, .96, .07, .9, C.curb);
    B(0, .07, -.2, .86, .66, .3, C.stone);
    CY(0, .4, -.04, .27, .05, C.metal, Math.PI / 2);
    TO(0, .4, -.01, .27, C.dark, 0, 0, .6);
    for (let k = 0; k < 3; k++) P('box', 0, .4, .01, .4, .025, .02, C.dark, 0, 0, k * Math.PI / 3);
    CY(0, .4, .02, .05, .03, C.yellow, Math.PI / 2);
    [[-.3, .3, 4], [-.15, .36, 6], [.28, .3, 5], [.15, .38, 3]].forEach(([x, z, n]) => { for (let k = 0; k < n; k++) CY(x, .07 + k * .03, z, .06, .026, C.yellow); });
    return 1.0;
  },
  esg(r, it) {
    RB(0, 0, 0, .96, .07, .96, C.leaf3);
    for (let k = 0; k < 2; k++) { B(-.2, .07, -.25 + k * .22, .02, .1, .02, C.dark); P('box', -.2, .2, -.25 + k * .22, .44, .02, .18, C.teal, 0, -0.5); }
    CY(.3, .07, -.25, .018, .8, C.cream); SP(.3, .87, -.22, .035, C.cream);
    for (let k = 0; k < 3; k++) P('box', .3, .87, -.2, .04, .34, .012, C.cream, 0, 0, k * Math.PI * 2 / 3 + .3);
    for (let k = 0; k < 3; k++) { CY(-.3 + k * .14, .07, .3, .012, .08, C.wood); IC(-.3 + k * .14, .19, .3, .05, k % 2 ? C.leaf1 : C.leaf2); }
    RB(.25, .07, .25, .2, .2, .2, '#7fae6a'); IC(.25, .3, .25, .06, C.leaf1, .4);
    return 1.0;
  },
  carbon(r, it) {
    RB(0, 0, 0, .94, .07, .94, C.curb);
    const cubes = [[-.2, 0, -.15], [.12, 0, -.18], [-.05, 0, .16], [-.05, 1, -.04], [.26, 0, .2]];
    cubes.forEach(([x, l, z], k) => {
      RB(x, .07 + l * .24, z, .24, .24, .24, k % 2 ? '#86b36f' : C.leaf3, k * .4);
      IC(x, .07 + l * .24 + .25, z, .06, C.leaf1, .35);
    });
    CY(-.34, .07, .32, .015, .3, C.wood); B(-.34, .3, .32, .14, .1, .02, C.cream);
    return 0.9;
  },
  booth(r, it) {
    RB(0, 0, 0, .94, .07, .94, C.curb);
    B(-.2, .07, -.1, .34, .5, .34, C.cream); B(-.2, .57, -.1, .4, .05, .4, C.coral);
    GS(-.2, .7, -.1, .07, '#ff9a6a'); CY(-.2, .62, -.1, .02, .04, C.dark);
    B(-.2, .25, .075, .26, .12, .02, C.glass);
    withFrame(localT(.24, 0, .12, -.3), () => {
      RB(0, .2, 0, .34, .34, .08, C.teal);
      P('prism', 0, .14, 0, .34, .14, .08, C.teal, 0, 0, Math.PI);
      B(0, .3, .045, .05, .18, .01, C.cream); B(0, .37, .045, .14, .05, .01, C.cream);
      CY(0, .07, -.06, .02, .2, C.dark);
    });
    miniPerson(-.2, .3, C.yellow, 0, .85);
    return 0.95;
  },
  classroom(r, it) {
    RB(0, 0, 0, .96, .07, .9, C.curb);
    B(0, .07, -.34, .74, .44, .04, C.wood); B(0, .14, -.315, .66, .3, .01, '#3d5a4c');
    B(-.15, .3, -.307, .2, .01, .005, C.cream); B(.1, .24, -.307, .26, .01, .005, C.cream);
    for (let i = -1; i <= 1; i += 2) for (let j = 0; j < 2; j++) {
      B(i * .2, .07, -.04 + j * .26, .26, .02, .14, C.wood); B(i * .2, .07, -.04 + j * .26, .22, .1, .02, C.dark);
      B(i * .2, .17, -.04 + j * .26, .26, .02, .14, C.wood);
      miniPerson(i * .2, .06 + j * .26 + .09, [C.yellow, C.blue, C.coral, C.aqua][j * 2 + (i + 1) / 2], Math.PI, .7);
    }
    miniPerson(.36, -.2, C.green, Math.PI / 2 + .4, .9);
    return 0.95;
  },
  server(r, it) {
    RB(0, 0, 0, .96, .07, .92, C.curb);
    for (let k = 0; k < 3; k++) {
      const x = -.3 + k * .2;
      B(x, .07, -.12, .16, .62, .3, C.dark);
      for (let j = 0; j < 6; j++) { B(x, .14 + j * .09, .031, .13, .05, .01, '#4c4545'); GB(x + .045, .155 + j * .09, .037, .02, .02, .01, j % 3 === 0 ? '#9fe0a8' : C.glow); }
    }
    B(.32, .07, .1, .04, .38, .04, C.dark);
    B(.32, .3, .14, .34, .24, .03, C.ink, -.4);
    withFrame(localT(.32, 0, .14, -.4), () => {
      GB(0, .32, .017, .3, .2, .01, '#e9f1f0');
      for (let k = 0; k < 5; k++) B(-.11 + k * .055, .34, .024, .03, .04 + k * .025, .006, k % 2 ? C.aqua : C.coral);
    });
    return 1.0;
  },
  screen(r, it) {
    RB(0, 0, 0, .94, .07, .9, C.curb);
    B(0, .07, -.05, .1, .3, .08, C.dark); B(0, .07, -.05, .4, .03, .26, C.dark);
    B(0, .36, -.05, .82, .52, .05, C.ink);
    GB(0, .4, -.02, .74, .44, .01, '#eef3f2');
    const pts = [.1, .18, .14, .26, .22, .32, .28, .38];
    pts.forEach((h, k) => { if (k) { const x0 = -.3 + (k - 1) * .085, y0 = .45 + pts[k - 1] * .6, x1 = -.3 + k * .085, y1 = .45 + h * .6; const len = Math.hypot(x1 - x0, y1 - y0); P('box', (x0 + x1) / 2, (y0 + y1) / 2, -.008, len, .018, .01, C.coral, 0, 0, Math.atan2(y1 - y0, x1 - x0)); } });
    for (let k = 0; k < 6; k++) B(-.28 + k * .11, .43, -.008, .06, .04 + (k % 3) * .02, .006, C.aqua);
    miniPerson(.32, .3, C.blue, Math.PI + .5, .85);
    return 1.0;
  },
  podium(r, it) {
    RB(0, 0, 0, .94, .07, .9, C.curb);
    RB(0, .07, 0, .26, .34, .3, C.yellow); RB(-.27, .07, 0, .26, .24, .3, C.cream); RB(.27, .07, 0, .26, .16, .3, '#f0a58a');
    B(0, .25, .151, .06, .1, .01, C.ink); B(-.27, .19, .151, .1, .08, .01, C.ink); B(.27, .14, .151, .1, .06, .01, C.ink);
    CY(0, .41, 0, .03, .1, C.yellow); CY(0, .51, 0, .09, .12, '#e9c64a'); TO(0, .58, 0, .09, '#e9c64a', 0, Math.PI / 2, .5);
    miniPerson(-.27, 0, C.coral, 0, .75); withFrame(localT(.27, .16, 0, 0, .75), () => miniPerson(0, 0, C.aqua));
    return 0.85;
  },
  coin(r, it) {
    RB(0, 0, 0, .9, .07, .9, C.curb);
    B(0, .07, -.05, .2, .12, .14, C.stone);
    CY(0, .5, -.05, .34, .09, '#f0c94a', Math.PI / 2);
    TO(0, .5, -.05, .3, '#d9ad2c', 0, 0, .25);
    B(0, .5, .002, .06, .3, .01, '#d9ad2c'); B(0, .5, .002, .2, .05, .01, '#d9ad2c');
    [[-.3, .28, 5], [.3, .26, 3], [.2, .36, 7]].forEach(([x, z, n]) => { for (let k = 0; k < n; k++) CY(x, .07 + k * .03, z, .07, .026, '#f0c94a'); });
    return 1.0;
  },
  clock(r, it) {
    RB(0, 0, 0, .9, .07, .9, C.curb);
    B(0, .07, 0, .16, .4, .16, C.wood);
    CY(0, .7, 0, .3, .08, C.cream, Math.PI / 2);
    TO(0, .7, 0, .3, C.coral, 0, 0, .55);
    P('box', .07, .74, .05, .02, .18, .012, C.ink, 0, 0, -.8);
    P('box', 0, .78, .05, .02, .2, .012, C.ink, 0, 0, 0);
    SP(0, .7, .05, .025, C.ink);
    DM(-.18, .98, 0, .07, C.yellow); DM(.18, .98, 0, .07, C.yellow);
    CY(-.18, .94, 0, .015, .05, C.dark); CY(.18, .94, 0, .015, .05, C.dark);
    return 1.1;
  },
  book(r, it) {
    RB(0, 0, 0, .9, .07, .9, C.curb);
    B(0, .07, 0, .12, .18, .12, C.wood);
    P('box', -.19, .38, 0, .38, .03, .5, C.coral, 0, 0, .35);
    P('box', .19, .38, 0, .38, .03, .5, C.coral, 0, 0, -.35);
    P('box', -.18, .4, 0, .34, .035, .46, C.cream, 0, 0, .35);
    P('box', .18, .4, 0, .34, .035, .46, C.cream, 0, 0, -.35);
    for (let k = 0; k < 3; k++) { P('box', -.18, .43, -.12 + k * .1, .22, .006, .015, C.stone, 0, 0, .35); P('box', .18, .43, -.12 + k * .1, .22, .006, .015, C.stone, 0, 0, -.35); }
    [[C.blue, 0], [C.yellow, .3], [C.aqua, -.2]].forEach(([c, ry], k) => B(.3, .07 + k * .06, .32, .22, .055, .16, c, ry));
    return 0.85;
  },
  globe(r, it) {
    RB(0, 0, 0, .9, .07, .9, C.curb);
    CY(0, .07, 0, .16, .05, C.wood); CY(0, .12, 0, .025, .2, C.wood);
    SP(0, .58, 0, .27, '#7db4c9');
    IC(.1, .66, .16, .1, C.leaf1, .6); IC(-.14, .52, .18, .09, C.leaf2, .6); IC(.04, .44, -.2, .1, C.leaf1, .6); IC(-.08, .74, -.12, .08, C.leaf2, .6);
    IC(.16, .56, .19, .03, C.coral);
    TO(0, .58, 0, .31, C.yellow, 0, 0, .25);
    RB(.32, .07, .3, .16, .2, .1, '#8a5a3c'); B(.32, .27, .3, .07, .03, .02, C.dark);
    return 1.0;
  },
  magnifier(r, it) {
    RB(0, 0, 0, .9, .07, .9, C.curb);
    for (let k = 0; k < 3; k++) B(-.12, .07 + k * .025, .1, .44, .02, .3, k % 2 ? C.cream : '#efe6d6', k * .1);
    withFrame(localT(.05, .55, 0, -.4), () => {
      TO(0, 0, 0, .25, C.ink, 0, 0, 1.1);
      CY(0, 0, 0, .23, .02, '#bfe0de', Math.PI / 2);
      P('cyl', .25, -.25, 0, .07, .3, .07, C.wood, 0, 0, Math.PI / 4);
    });
    return 1.0;
  }
};
// 交易所大鐘：kit 模式登記成動態物件，縮圖模式畫成靜態
function clockFace(x, y, z, r) {
  if (SINK.kit) { exchangeClock = { matrix: FRAME.clone().multiply(localT(x, y, z)), r }; }
  else { CY(x, y, z, r, .03, C.cream, Math.PI / 2); TO(x, y, z + .01, r, C.coral, 0, 0, .5); }
}

// ====================================================================
// 街道家具與樹
// ====================================================================
function bigTree(kind, x, z, s, rng) {
  withFrame(localT(x, TOP, z, rng.r(0, 6), s), () => {
    switch (kind) {
      case 'pine': CY(0, 0, 0, .05, .2, C.wood); CN(0, .15, 0, .3, .4, C.leaf3); CN(0, .38, 0, .24, .34, '#7d9a66'); CN(0, .58, 0, .16, .3, C.leaf2); break;
      case 'sakura': CY(0, 0, 0, .05, .34, C.wood); IC(0, .52, 0, .26, C.pink); IC(.16, .44, .06, .16, '#f6c7d3'); IC(-.14, .46, -.06, .17, '#eea7ba'); break;
      case 'fruit': CY(0, 0, 0, .05, .3, C.wood); IC(0, .5, 0, .27, C.leaf2); for (let k = 0; k < 5; k++) { const a = k * 1.3; SP(Math.cos(a) * .22, .45 + (k % 2) * .1, Math.sin(a) * .22, .035, '#f0a03c'); } break;
      case 'palm': for (let k = 0; k < 4; k++) CY(k * .02, k * .14, 0, .045 - k * .005, .15, k % 2 ? C.wood : '#9c7150'); for (let k = 0; k < 6; k++) P('box', .07 + Math.cos(k) * .14, .6, Math.sin(k) * .14, .3, .02, .08, C.leaf1, -k, 0, -.35); break;
      case 'willow': CY(0, 0, 0, .05, .3, C.wood); DM(0, .26, 0, .3, '#9cb978', 1.4); for (let k = 0; k < 6; k++) { const a = k * 1.05; P('ico', Math.cos(a) * .24, .35, Math.sin(a) * .24, .12, .36, .12, C.leaf2); } break;
      default: CY(0, 0, 0, .05, .26, C.wood); SP(0, .48, 0, .26, C.leaf1); SP(.12, .4, .1, .14, C.leaf2);
    }
  });
}
function streetFurniture(is, cx, cz, rng) {
  // 路燈：步道內側的六個頂點方向
  SMALL = true;
  for (let k = 0; k < 6; k++) {
    const a = (30 + 60 * k) * Math.PI / 180, rr = 1.52;
    const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
    withFrame(localT(x, TOP, z), () => { CY(0, 0, 0, .018, .34, '#4a4040'); B(0, .34, 0, .07, .015, .07, '#4a4040'); GS(0, .38, 0, .035); });
    LAMPS.push([x, z]);
  }
  // 盆栽、灌木、花：邊中點附近
  for (let k = 0; k < 6; k++) {
    const a = (60 * k + 18) * Math.PI / 180, rr = 1.46;
    const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
    withFrame(localT(x, TOP, z, rng.r(0, 6)), () => {
      const t = k % 3;
      if (t === 0) { CY(0, 0, 0, .06, .07, C.stone); IC(0, .12, 0, .07, C.leaf2); }
      else if (t === 1) { IC(0, .05, 0, .09, C.leaf1, .8); IC(.07, .04, .03, .06, C.leaf2, .8); }
      else { for (let f = 0; f < 4; f++) SP(Math.cos(f * 1.6) * .06, .03, Math.sin(f * 1.6) * .06, .025, [C.pink, C.yellow, '#f0a58a', '#fff'][f]); IC(0, .02, 0, .05, C.leaf2, .5); }
    });
  }
  SMALL = false;
}

let LAMPS = [];
let ITEM_TOPS = {};   // itemId -> Vector3（模型頂端世界座標）
let ITEM_CENTER = {}; // itemId -> Vector3

// 細項格子配置
function layoutIsland(is, cx, cz) {
  const n = is.items.length - 1;
  const cell = clamp(0.62 - (n - 2) * 0.04, 0.46, 0.62);
  const cand = [];
  for (let row = -4; row <= 4; row++) for (let col = -4; col <= 4; col++) {
    const x = (col + (row & 1 ? .5 : 0)) * cell, z = row * cell * .92;
    if (Math.hypot(x, z) > 1.36 - cell * .45) continue;
    if (Math.abs(x) < .58 + cell * .5 && z < 0 + cell * .5 && z > -1.2) continue; // 主建物區
    cand.push({ x, z, d: Math.hypot(x, z - .55) + Math.abs(x) * .05 });
  }
  cand.sort((a, b) => a.d - b.d);
  const out = [{ x: 0, z: -.58, s: 1.15 }];
  for (let i = 0; i < n; i++) { const c = cand[i] || { x: 0, z: .8 }; out.push({ x: c.x, z: c.z, s: cell * .9 }); }
  return out.map(o => ({ x: cx + o.x, z: cz + o.z, s: o.s }));
}

// ====================================================================
// 貼圖
// ====================================================================
function canvasTex(w, h, draw, repeat = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } t.anisotropy = 4; return t;
}
function groundTexture(kind, rng) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f7efe4'; g.fillRect(0, 0, w, h);
    if (kind === 'brick') {
      for (let y = 0; y < 16; y++) for (let x = -1; x < 9; x++) {
        const ox = (y & 1) * 16; const v = 236 + Math.floor(rng.f() * 14);
        g.fillStyle = `rgb(${v + 6},${v - 4},${v - 16})`; g.fillRect(x * 32 + ox + 1, y * 16 + 1, 30, 14);
      }
    } else if (kind === 'speck') {
      for (let i = 0; i < 900; i++) { const v = 205 + Math.floor(rng.f() * 40); g.fillStyle = `rgba(${v},${v - 12},${v - 26},.55)`; const s = 1 + rng.f() * 3; g.beginPath(); g.arc(rng.f() * w, rng.f() * h, s, 0, 7); g.fill(); }
    } else {
      g.strokeStyle = 'rgba(205,185,160,.35)'; g.lineWidth = 9;
      for (let i = -8; i < 16; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 256, 256); g.stroke(); }
    }
  });
}
function bandTexture() {
  return canvasTex(512, 32, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#cfc7c0';
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, 6); g.lineTo(x + 32, h); g.fill(); }
    g.fillStyle = '#e8e2dc'; g.fillRect(0, 0, w, 5);
  });
}

// ====================================================================
// 場景
// ====================================================================
function axial(q, r) { return new THREE.Vector3(SQ3 * SPACING * (q + r / 2), 0, 1.5 * SPACING * r); }
function hexRot(geo) { return geo.rotateZ(Math.PI / 6).rotateX(-Math.PI / 2); }

const WATER_VS = `
varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
#include <fog_vertex>
}`;
const WATER_FS = `
uniform vec3 uShallow; uniform vec3 uDeep; uniform vec3 uCenter; uniform float uTime; uniform float uNight; uniform float uSide;
varying vec3 vW;
#include <common>
#include <fog_pars_fragment>
void main(){
  vec2 p = vW.xz; float d = length(p - uCenter.xz);
  float w1 = sin(p.x*.55 + uTime*.6) * sin(p.y*.48 - uTime*.45);
  float w2 = sin((p.x + p.y)*.9 - uTime*.8) * .5;
  float k = smoothstep(8., 46., d);
  vec3 c = mix(uShallow, uDeep, clamp(k + (w1 + w2)*.05, 0., 1.));
  float gl = pow(max(0., sin(p.x*3.1 + uTime*1.3) * sin(p.y*2.7 - uTime*1.1)), 16.) * .18 * (1. - uNight*.8) * (1. - k*.6);
  c += gl;
  if (uSide > .5) { float t = smoothstep(-.9, .6, vW.y); c = mix(uDeep*.9, uShallow*1.06, t); }
  gl_FragColor = vec4(c, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;
function waterMaterial(side) {
  const m = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uShallow: { value: new THREE.Color('#a4d4da') }, uDeep: { value: new THREE.Color('#6fa9b8') }, uCenter: { value: new THREE.Vector3() },
      uTime: { value: 0 }, uNight: { value: 0 }, uSide: { value: side ? 1 : 0 }
    }]),
    vertexShader: WATER_VS, fragmentShader: WATER_FS, fog: true
  });
  waterMats.push(m); return m;
}

function buildWorld() {
  const rng = rngFor(20260101);
  // 島中心
  ISL.forEach(is => { is.pos = axial(is.q, is.r); });
  center = ISL.reduce((a, is) => a.add(is.pos), new THREE.Vector3()).divideScalar(ISL.length);
  center.y = TOP;

  // 天空
  skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSun: { value: new THREE.Color() }, uNight: { value: 0 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSun; uniform float uNight; varying vec3 vDir;
      float h3(vec3 p){ p = fract(p*.3183099 + .1); p *= 17.; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }
      void main(){ vec3 d = normalize(vDir); vec3 c = mix(uHorizon, uTop, smoothstep(-.02, .55, d.y));
        float s = max(dot(d, normalize(uSunDir)), 0.); c += uSun*pow(s, 18.)*.35*(1. - uNight*.75);
        if (uNight > .01 && d.y > .02) { float h = h3(floor(d*180.)); if (h > .9965) c += vec3(.9, .92, 1.)*uNight*smoothstep(.02, .25, d.y)*(.5 + .5*(h - .9965)/.0035); }
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`
  });
  sky = new THREE.Mesh(new THREE.SphereGeometry(170, 32, 16), skyMat); sky.position.copy(center); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
  scene.fog = new THREE.Fog(0xf4eee3, 42, 150);

  // 光
  hemi = new THREE.HemisphereLight(0xeef6fa, 0x8f8270, 1.3); scene.add(hemi);
  sun = new THREE.DirectionalLight(0xfff1de, 2.8); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 22, bottom: -22, near: 1, far: 90 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.045; sun.shadow.radius = 3;
  sun.target.position.copy(center); scene.add(sun, sun.target);
  fill = new THREE.DirectionalLight(0xbfd6ff, .35); fill.position.set(center.x - 20, 14, center.z - 18); fill.target.position.copy(center); scene.add(fill, fill.target);

  // 水
  const wm = waterMaterial(false); wm.uniforms.uCenter.value.copy(center);
  const water = new THREE.Mesh(new THREE.CircleGeometry(160, 64).rotateX(-Math.PI / 2), wm);
  water.position.set(center.x, WATER_Y, center.z); water.receiveShadow = false; water.userData.water = true; scene.add(water);

  // 材質
  solidMat = new THREE.MeshStandardMaterial({ roughness: .78, metalness: 0 });
  glowMat = new THREE.MeshStandardMaterial({ roughness: .6, metalness: 0, emissive: new THREE.Color(C.glow), emissiveIntensity: 0 });

  // 島體
  const capGeos = { brick: [], speck: [], stripe: [] };
  const walls = [], bands = [], curbs = [], walks = [], shallow = [], foam = [];
  const tint = ['#f8e7d6', '#eef0e2', '#f6e3e3', '#eaf0e0', '#f9f0d6', '#e9e9f2', '#f7e6e8', '#e4eddf', '#e3eeef', '#f8efd8', '#f6e5dc', '#e3efee'];
  const colorize = (geo, hex) => { const c = new THREE.Color(hex); const n = geo.attributes.position.count; const a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; };
  ISL.forEach((is, i) => {
    const { x, z } = is.pos;
    const cap = hexRot(new THREE.CircleGeometry(R - .05, 6)).translate(x, TOP, z);
    const uv = cap.attributes.uv, pos = cap.attributes.position;
    for (let k = 0; k < pos.count; k++) uv.setXY(k, pos.getX(k) / 2.2, pos.getZ(k) / 2.2);
    capGeos[is.ground].push(colorize(cap, tint[i % tint.length]));
    const wallH = TOP - .16 - (WATER_Y - .7);
    walls.push(new THREE.CylinderGeometry(R, R, wallH, 6, 1, true).translate(x, (TOP - .16 + WATER_Y - .7) / 2, z));
    const band = new THREE.CylinderGeometry(R + .004, R + .004, .16, 6, 1, true).translate(x, TOP - .08, z);
    const buv = band.attributes.uv; for (let k = 0; k < buv.count; k++) buv.setX(k, buv.getX(k) * 12);
    bands.push(colorize(band, is.color));
    curbs.push(hexRot(new THREE.RingGeometry(R - .09, R, 6, 1)).translate(x, TOP + .004, z));
    walks.push(hexRot(new THREE.RingGeometry(WALK_R - .14, WALK_R + .14, 6, 1)).translate(x, TOP + .006, z));
    shallow.push(hexRot(new THREE.RingGeometry(R, R + .7, 6, 1)).translate(x, WATER_Y + .006, z));
    foam.push(hexRot(new THREE.RingGeometry(R, R + .16, 6, 1)).translate(x, WATER_Y + .012, z));
  });
  for (const k in capGeos) {
    if (!capGeos[k].length) continue;
    const mat = new THREE.MeshStandardMaterial({ map: groundTexture(k, rng), roughness: .92, vertexColors: true });
    const m = new THREE.Mesh(BGU.mergeGeometries(capGeos[k]), mat); m.receiveShadow = true; m.userData.cap = true; scene.add(m); islandCaps.push(m);
  }
  const off = (mat, f) => { mat.polygonOffset = true; mat.polygonOffsetFactor = f; mat.polygonOffsetUnits = f; return mat; };
  const wallMesh = new THREE.Mesh(BGU.mergeGeometries(walls), waterMaterial(true)); scene.add(wallMesh);
  const bandMesh = new THREE.Mesh(BGU.mergeGeometries(bands), new THREE.MeshStandardMaterial({ map: bandTexture(), vertexColors: true, roughness: .85 })); bandMesh.receiveShadow = true; scene.add(bandMesh);
  const curbMesh = new THREE.Mesh(BGU.mergeGeometries(curbs), off(new THREE.MeshStandardMaterial({ color: C.curb, roughness: .9 }), -2)); curbMesh.receiveShadow = true; scene.add(curbMesh);
  const walkMat = off(new THREE.MeshStandardMaterial({ color: '#ecc9ae', roughness: .9, map: groundTexture('brick', rng) }), -3);
  const wg = BGU.mergeGeometries(walks); const wuv = wg.attributes.uv, wpos = wg.attributes.position;
  for (let k = 0; k < wpos.count; k++) wuv.setXY(k, wpos.getX(k) / 1.1, wpos.getZ(k) / 1.1);
  const walkMesh = new THREE.Mesh(wg, walkMat); walkMesh.receiveShadow = true; scene.add(walkMesh);
  scene.add(new THREE.Mesh(BGU.mergeGeometries(shallow), off(new THREE.MeshBasicMaterial({ color: '#d4f0ea', transparent: true, opacity: .35, depthWrite: false }), -1)));
  scene.add(new THREE.Mesh(BGU.mergeGeometries(foam), off(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55, depthWrite: false }), -2)));

  // 零件庫：建物、橋、家具
  const kit = new KitSink(77);
  SINK = kit;
  ISL.forEach(is => {
    const { x, z } = is.pos;
    const slots = layoutIsland(is, x, z);
    is.items.forEach((it, k) => {
      const sl = slots[k];
      const ry = k === 0 ? 0 : rng.r(-.35, .35);
      OWNER = 'item:' + it.id;
      FRAME.identity().multiply(localT(sl.x, TOP, sl.z, ry, sl.s));
      const top = (MODELS[it.model] || MODELS.house)(rng, it);
      ITEM_TOPS[it.id] = new THREE.Vector3(sl.x, TOP + top * sl.s, sl.z);
      ITEM_CENTER[it.id] = new THREE.Vector3(sl.x, TOP + top * sl.s * .45, sl.z);
      it.slot = sl;
    });
    FRAME.identity(); OWNER = 'island:' + is.id;
    streetFurniture(is, x, z, rng);
    // 大樹：外圈 4–6 棵
    const nt = rng.i(4, 6);
    for (let k = 0; k < nt; k++) {
      const a = (60 * k + 40 + rng.r(-6, 6)) * Math.PI / 180 + (k >= 6 ? .5 : 0);
      bigTree(is.tree, x + Math.cos(a) * 1.4, z + Math.sin(a) * 1.4, rng.r(.75, 1.05), rng);
    }
    // 長椅
    SMALL = true;
    for (let k = 0; k < 2; k++) {
      const a = (60 * k * 2 + 150 + rng.r(-8, 8)) * Math.PI / 180;
      withFrame(localT(x + Math.cos(a) * 1.22, TOP, z + Math.sin(a) * 1.22, -a + Math.PI / 2), () => {
        B(0, .07, 0, .26, .025, .08, C.wood); B(0, .1, -.035, .26, .07, .015, C.wood); B(-.11, 0, 0, .02, .07, .07, C.dark); B(.11, 0, 0, .02, .07, .07, C.dark);
      });
    }
    // 島緣串燈
    for (let e = 0; e < 6; e++) {
      const a0 = (30 + 60 * e) * Math.PI / 180, a1 = (90 + 60 * e) * Math.PI / 180;
      for (let s = 0; s < 7; s++) {
        const t = (s + .5) / 7, rr = R - .045;
        const px = x + lerp(Math.cos(a0), Math.cos(a1), t) * rr, pz = z + lerp(Math.sin(a0), Math.sin(a1), t) * rr;
        GS(px, TOP + .05, pz, .018, s % 2 ? C.glow : '#ffe3b0');
      }
    }
    SMALL = false;
  });
  OWNER = null; FRAME.identity();

  // 橋與路網
  buildGraph(rng);

  // 遠處小島、燈塔
  [[-17, -6, 1.2], [19, 4, 1.0], [-9, 15, .8], [14, -15, 1.1], [24, -6, .7]].forEach(([dx, dz, s], k) => {
    const x = center.x + dx, z = center.z + dz;
    IC(x, WATER_Y - .1, z, 1.1 * s, '#c8b98f', .35); IC(x + .3 * s, WATER_Y + .15, z - .2, .55 * s, C.leaf2, .7);
    if (k === 1 || k === 3) { withFrame(localT(x - .2, WATER_Y + .15, z + .2, 0, s), () => { for (let j = 0; j < 4; j++) CY(0, j * .3, 0, .16 - j * .015, .3, j % 2 ? C.coral : '#fbf5ee'); B(0, 1.2, 0, .26, .03, .26, C.dark); GS(0, 1.33, 0, .1); CN(0, 1.42, 0, .14, .2, C.coral); }); }
  });
  kit.build(scene);
  SINK = null;

  // 交易所動態大鐘
  if (exchangeClock) buildExchangeClock();

  // 光池（加法混合，夜晚才亮）
  poolMat = new THREE.MeshBasicMaterial({ color: C.glow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const poolTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }, false);
  poolMat.map = poolTex;
  const spots = LAMPS.map(([x, z]) => [x, z, .55]);
  ISL.forEach(is => { const sl = is.items[0].slot; spots.push([sl.x, sl.z + .62, .9]); });
  const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), poolMat, spots.length);
  spots.forEach(([x, z, s], i) => { M4.compose(V3a.set(x, TOP + .012, z), QT.identity(), V3b.set(s * 2, 1, s * 2)); pools.setMatrixAt(i, M4); });
  pools.renderOrder = 2; scene.add(pools);
}

function buildExchangeClock() {
  const g = new THREE.Group();
  const r = exchangeClock.r;
  const face = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .03, 24).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: C.cream, roughness: .7 }));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, .02, 8, 28), new THREE.MeshStandardMaterial({ color: C.coral, roughness: .7 }));
  rim.position.z = .012;
  const handMat = new THREE.MeshStandardMaterial({ color: C.ink });
  const hh = new THREE.Mesh(new THREE.BoxGeometry(.018, r * .55, .01).translate(0, r * .27, 0), handMat);
  const mh = new THREE.Mesh(new THREE.BoxGeometry(.012, r * .85, .01).translate(0, r * .42, 0), handMat);
  hh.position.z = mh.position.z = .022;
  const pivot = new THREE.Group(); // 擺動支點在上方
  [face, rim, hh, mh].forEach(o => { o.position.y -= r * 1.1; pivot.add(o); });
  pivot.position.y = r * 1.1;
  g.add(pivot);
  exchangeClock.matrix.decompose(g.position, g.quaternion, g.scale);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  scene.add(g);
  Object.assign(exchangeClock, { group: g, pivot, hh, mh, swing: 0 });
}

// ====================================================================
// 路網：每島 12 節點，橋連相鄰島
// ====================================================================
const GRAPH = { nodes: [], adj: [] };
function nodeId(islandIdx, k) { return islandIdx * 12 + k; }
function buildGraph(rng) {
  ISL.forEach(is => {
    for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6, rr = k % 2 ? WALK_R : WALK_R * SQ3 / 2;
      GRAPH.nodes.push(new THREE.Vector3(is.pos.x + Math.cos(a) * rr, TOP + .012, is.pos.z + Math.sin(a) * rr));
      GRAPH.adj.push([]);
    }
  });
  const link = (a, b, pts) => {
    const len = pts ? pts.reduce((s, p, i) => i ? s + p.distanceTo(pts[i - 1]) : 0, 0) : GRAPH.nodes[a].distanceTo(GRAPH.nodes[b]);
    GRAPH.adj[a].push({ to: b, len, pts }); GRAPH.adj[b].push({ to: a, len, pts: pts ? pts.slice().reverse() : null });
  };
  ISL.forEach((is, i) => { for (let k = 0; k < 12; k++) link(nodeId(i, k), nodeId(i, (k + 1) % 12)); });
  const dirs = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]]; // 對應角度 0,60,120,180,240,300
  const key = (q, r) => q + ',' + r; const byQR = {}; ISL.forEach((is, i) => byQR[key(is.q, is.r)] = i);
  BRIDGES.length = 0;
  ISL.forEach((is, i) => {
    dirs.forEach(([dq, dr], d) => {
      const j = byQR[key(is.q + dq, is.r + dr)];
      if (j === undefined || j < i) return;
      const a = nodeId(i, d * 2), b = nodeId(j, (d * 2 + 6) % 12);
      const A = GRAPH.nodes[a], Bn = GRAPH.nodes[b];
      const arch = rng.r(.04, .1);
      const pts = [];
      for (let s = 0; s <= 8; s++) { const t = s / 8; pts.push(new THREE.Vector3(lerp(A.x, Bn.x, t), TOP + .012 + Math.sin(t * Math.PI) * arch + .02, lerp(A.z, Bn.z, t))); }
      link(a, b, pts);
      // 甲板 9 片
      const ang = Math.atan2(Bn.z - A.z, Bn.x - A.x), len = A.distanceTo(Bn);
      const ext = .5; // 往島內延伸一點，蓋住步道與路緣
      for (let s = 0; s < 9; s++) {
        const t = (s + .5) / 9, tt = -ext / len + t * (1 + 2 * ext / len);
        const x = lerp(A.x, Bn.x, tt), z = lerp(A.z, Bn.z, tt);
        const y = TOP + Math.sin(clamp(tt, 0, 1) * Math.PI) * arch + .005;
        P('box', x, y, z, (len + ext * 2) / 9 * .92, .045, .36, s % 2 ? C.wood : '#c4946c', -ang);
        if (s % 2 === 0 && tt > 0 && tt < 1) {
          const nx = -Math.sin(ang) * .17, nz = Math.cos(ang) * .17;
          P('box', x + nx, y + .07, z + nz, .02, .12, .02, '#8a5a3c', -ang); P('box', x - nx, y + .07, z - nz, .02, .12, .02, '#8a5a3c', -ang);
        }
      }
      [-1, 1].forEach(sg => { for (let s = 0; s < 8; s++) { const t0 = s / 8, t1 = (s + 1) / 8; const y0 = TOP + Math.sin(t0 * Math.PI) * arch + .13, y1 = TOP + Math.sin(t1 * Math.PI) * arch + .13; const nx = -Math.sin(ang) * .17 * sg, nz = Math.cos(ang) * .17 * sg; P('box', lerp(A.x, Bn.x, (t0 + t1) / 2) + nx, (y0 + y1) / 2, lerp(A.z, Bn.z, (t0 + t1) / 2) + nz, len / 8, .018, .018, '#8a5a3c', -ang, 0, Math.atan2(y1 - y0, len / 8)); } });
      BRIDGES.push([i, j]);
    });
  });
}
const BRIDGES = [];
function dijkstra(src, dst) {
  const n = GRAPH.nodes.length, dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), prevE = new Array(n).fill(null), done = new Array(n).fill(false);
  dist[src] = 0;
  for (; ;) {
    let u = -1, best = Infinity; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
    if (u < 0 || u === dst) break; done[u] = true;
    for (const e of GRAPH.adj[u]) { const nd = dist[u] + e.len; if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = u; prevE[e.to] = e; } }
  }
  const pts = [GRAPH.nodes[dst].clone()]; let v = dst;
  while (v !== src && prev[v] >= 0) { const e = prevE[v]; if (e.pts) { for (let k = e.pts.length - 2; k >= 1; k--) pts.push(e.pts[k].clone()); } pts.push(GRAPH.nodes[prev[v]].clone()); v = prev[v]; }
  return pts.reverse();
}

// ====================================================================
// 遠景：盆地地形、背景樹、遠山、雲、帆船
// ====================================================================
function buildBackdrop() {
  const rng = rngFor(424242);
  const noise = new SimplexNoise({ random: mulberry32(9001) });
  const fbm = (x, z) => { let s = 0, a = 1, f = 1; for (let o = 0; o < 4; o++) { s += noise.noise(x * f, z * f) * a; a *= .5; f *= 2.03; } return s; };
  const camDir = new THREE.Vector2(.24, .87).normalize();
  const H = (x, z) => {
    const dx = x - center.x, dz = z - center.z, r = Math.hypot(dx, dz) || 1;
    let h = -1.7 + smooth(16, 50, r) * 12.5 + fbm(x * .045, z * .045) * 3.6 * smooth(12, 34, r);
    const face = (dx * camDir.x + dz * camDir.y) / r;
    if (h > 0) h *= 1 - .82 * smooth(-.15, .7, face);
    if (h > .3) h = lerp(h, Math.round(h / .55) * .55, .6);
    return h;
  };
  const geo = new THREE.PlaneGeometry(170, 170, 160, 160).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  const stops = [[-0.15, '#8fb3ad'], [.35, '#d9c9a3'], [2.2, '#aec493'], [4.6, '#a3b986'], [8.2, '#6f8a62'], [99, '#b2a38d']].map(([h, c]) => [h, new THREE.Color(c)]);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + center.x, z = pos.getZ(i) + center.z, h = H(x, z);
    pos.setY(i, h);
    let k = 0; while (h > stops[k][0]) k++;
    tmp.copy(stops[k][1]); tmp.offsetHSL(0, 0, (fbm(x * .3, z * .3)) * .025);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  terrain.position.set(center.x, 0, center.z); scene.add(terrain);

  // 背景樹
  const con = BGU.mergeGeometries([new THREE.ConeGeometry(.5, .8, 6).translate(0, .7, 0), new THREE.ConeGeometry(.4, .7, 6).translate(0, 1.05, 0), new THREE.ConeGeometry(.28, .6, 6).translate(0, 1.38, 0), new THREE.CylinderGeometry(.08, .1, .4, 5).translate(0, .2, 0)]);
  const bl = []; const r2 = mulberry32(55);
  for (let k = 0; k < 4; k++) { const g = new THREE.IcosahedronGeometry(.42 - k * .05, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (1 + (r2() - .5) * .2), p.getY(i) * (1 + (r2() - .5) * .2), p.getZ(i) * (1 + (r2() - .5) * .2)); g.translate((r2() - .5) * .5, .7 + k * .18, (r2() - .5) * .5); bl.push(g); }
  bl.push(new THREE.CylinderGeometry(.07, .09, .6, 5).translate(0, .3, 0).toNonIndexed());
  bl.forEach(g => g.deleteAttribute('uv'));
  const brd = BGU.mergeGeometries(bl);
  const N = isMobile() ? 1100 : 3200;
  const treeMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 });
  const conM = new THREE.InstancedMesh(con, treeMat, N), brdM = new THREE.InstancedMesh(brd, treeMat, N);
  let nc = 0, nb = 0; const greens = ['#5f7d55', '#6f8a62', '#7f9a68', '#58744f', '#8aa36f'];
  for (let i = 0; i < N * 3 && (nc < N || nb < N); i++) {
    const a = rng.f() * Math.PI * 2, rr = 16 + rng.f() * 36;
    const x = center.x + Math.cos(a) * rr, z = center.z + Math.sin(a) * rr, h = H(x, z);
    if (h < .3 || h > 10) continue;
    const s = rng.r(.55, 1.25) * (1 + rr / 80);
    M4.compose(V3a.set(x, h - .05, z), QT.setFromEuler(EU.set(0, rng.f() * 6, 0)), V3b.set(s, s * rng.r(.85, 1.2), s));
    tmp.set(rng.pick(greens)).offsetHSL(0, 0, rng.r(-.04, .04));
    if (h > 4.5 ? rng.f() < .75 : rng.f() < .3) { if (nc < N) { conM.setMatrixAt(nc, M4); conM.setColorAt(nc, tmp); nc++; } }
    else if (nb < N) { brdM.setMatrixAt(nb, M4); brdM.setColorAt(nb, tmp); nb++; }
  }
  conM.count = nc; brdM.count = nb; scene.add(conM, brdM);

  // 三圈遠山剪影
  [[96, 11, '#8fa79a', .3], [118, 15, '#9db1b2', .5], [142, 20, '#b3c0c6', .7]].forEach(([rad, hh, c, mixK], bi) => {
    const segs = 180, vs = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const a = i / segs * Math.PI * 2, x = Math.cos(a) * rad, z = Math.sin(a) * rad;
      const face = (Math.cos(a) * camDir.x + Math.sin(a) * camDir.y);
      const top = (hh * (.55 + .45 * (noise.noise(Math.cos(a) * 2.2 + bi * 7, Math.sin(a) * 2.2) * .5 + .5)) + noise.noise(a * 6, bi) * 1.6) * (1 - .6 * smooth(.2, .9, face));
      vs.push(x, -2, z, x, Math.max(1, top), z);
      if (i < segs) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(vs, 3)); g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: c, fog: false, side: THREE.DoubleSide }));
    m.position.set(center.x, WATER_Y, center.z); m.userData = { base: new THREE.Color(c), k: mixK }; m.renderOrder = -5; scene.add(m); mountainBands.push(m);
  });

  // 雲：三種外形 × instanced
  const cloudGeos = [0, 1, 2].map(v => { const r3 = mulberry32(300 + v); const parts = []; const n = 4 + v; for (let k = 0; k < n; k++) parts.push(new THREE.IcosahedronGeometry(.9 + r3() * .8, 1).translate((k - n / 2) * 1.1 + r3() * .4, r3() * .5, (r3() - .5) * 1.2)); return BGU.mergeGeometries(parts); });
  const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true, emissive: '#ffffff', emissiveIntensity: .08 });
  const cms = cloudGeos.map(g => { const m = new THREE.InstancedMesh(g, cloudMat, 4); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; scene.add(m); return m; });
  for (let i = 0; i < 12; i++) clouds.push({ mesh: cms[i % 3], idx: Math.floor(i / 3), x: center.x + rng.r(-70, 70), y: rng.r(15, 23), z: center.z + rng.r(-60, 20), s: rng.r(.9, 1.7), v: rng.r(.25, .55) });
  updateClouds(0);

  // 帆船
  const hullGeo = new THREE.BoxGeometry(.9, .18, .32).translate(0, .05, 0), sailGeo = GEO.prism;
  for (let k = 0; k < 4; k++) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(hullGeo, new THREE.MeshStandardMaterial({ color: k % 2 ? C.wood : '#fbf5ee', roughness: .8 }));
    const sail = new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({ color: k % 2 ? C.cream : C.coral, roughness: .8 }));
    sail.scale.set(.5, .7, .04); sail.position.set(.05, .5, 0);
    g.add(hull, sail); scene.add(g);
    boats.push({ g, rad: rng.r(11.5, 19), a: rng.f() * 6.28, v: rng.r(.012, .025) * (k % 2 ? 1 : -1), bob: rng.f() * 6 });
  }
  updateBoats(0);
}
function updateClouds(dt) {
  const d = new THREE.Object3D();
  clouds.forEach(c => { c.x += c.v * dt; if (c.x > center.x + 75) c.x = center.x - 75; d.position.set(c.x, c.y, c.z); d.scale.set(c.s, c.s * .55, c.s); d.updateMatrix(); c.mesh.setMatrixAt(c.idx, d.matrix); c.mesh.instanceMatrix.needsUpdate = true; });
}
function updateBoats(dt) {
  boats.forEach(b => { b.a += b.v * dt; const x = center.x + Math.cos(b.a) * b.rad, z = center.z + Math.sin(b.a) * b.rad * .8; b.g.position.set(x, WATER_Y + Math.sin(S.time * 1.4 + b.bob) * .02, z); b.g.rotation.y = -b.a + (b.v > 0 ? -Math.PI / 2 : Math.PI / 2); });
}

// ====================================================================
// 日夜
// ====================================================================
const KF = [
  [0, '1e2c58', '3f4f80', 'b4c2ff', 1.15, '94a2d8', '64566a', 1.85, 1, '5a88b2'],
  [300, '26365f', '4c5688', 'b8c4ff', 1.0, '96a4da', '66586c', 1.85, 1, '5c8ab4'],
  [360, '7f8fc4', 'f6c3a6', 'ffb48a', 1.3, 'f3c6b5', '6b5a5a', 1.1, .55, '8fb7c4'],
  [450, 'a9d1ea', 'fbe6d3', 'ffe2c4', 2.4, 'eaf2f6', '8a7a68', 1.25, 0, '9fcfd6'],
  [720, '9fd0ec', 'f4eee3', 'fff1de', 2.9, 'eef6fa', '8f8270', 1.35, 0, 'a9d8db'],
  [960, 'a6cfe6', 'f8e7d2', 'ffe3c0', 2.5, 'f1efe8', '8a7a66', 1.25, 0, '9fcbd2'],
  [1065, '8b8fc4', 'f7b98f', 'ff9f6a', 1.8, 'f6d2bc', '7d6660', 1.2, .3, '93a9bd'],
  [1140, '5a5e9e', 'd99aa6', 'ff9a7a', 1.3, 'c0b2e0', '655868', 1.35, .75, '6a7cab'],
  [1260, '22325f', '445488', 'c0ccff', 1.2, '98a8dc', '685a6e', 1.9, 1, '5a88b2'],
  [1440, '1e2c58', '3f4f80', 'b4c2ff', 1.15, '94a2d8', '64566a', 1.85, 1, '5a88b2']
].map(r => ({ m: r[0], top: new_c(r[1]), hor: new_c(r[2]), sun: new_c(r[3]), sunI: r[4], hs: new_c(r[5]), hg: new_c(r[6]), hI: r[7], night: r[8], water: new_c(r[9]) }));
function new_c(h) { return { hex: '#' + h }; }
let KFC = null, NIGHT = 0;
function applyTime(min) {
  if (!KFC) KFC = KF.map(k => ({ ...k, top: new THREE.Color(k.top.hex), hor: new THREE.Color(k.hor.hex), sun: new THREE.Color(k.sun.hex), hs: new THREE.Color(k.hs.hex), hg: new THREE.Color(k.hg.hex), water: new THREE.Color(k.water.hex) }));
  min = ((min % 1440) + 1440) % 1440;
  let i = 0; while (i < KFC.length - 2 && KFC[i + 1].m <= min) i++;
  const a = KFC[i], b = KFC[i + 1], t = (min - a.m) / (b.m - a.m);
  const L = (k) => a[k].clone().lerp(b[k], t);
  const hor = L('hor');
  skyMat.uniforms.uTop.value.copy(L('top')); skyMat.uniforms.uHorizon.value.copy(hor); skyMat.uniforms.uSun.value.copy(L('sun'));
  scene.fog.color.copy(hor);
  sun.color.copy(L('sun')); sun.intensity = lerp(a.sunI, b.sunI, t);
  hemi.color.copy(L('hs')); hemi.groundColor.copy(L('hg')); hemi.intensity = lerp(a.hI, b.hI, t);
  NIGHT = lerp(a.night, b.night, t);
  const w = L('water');
  waterMats.forEach(m => { m.uniforms.uShallow.value.copy(w); m.uniforms.uDeep.value.copy(w).multiplyScalar(.72); m.uniforms.uNight.value = NIGHT; });
  skyMat.uniforms.uNight.value = NIGHT;
  glowMat.emissiveIntensity = NIGHT * 3.2;
  if (poolMat) poolMat.opacity = NIGHT * .42;
  mountainBands.forEach(m => m.material.color.copy(m.userData.base).lerp(hor, m.userData.k).multiplyScalar(1 - NIGHT * .35));
  // 太陽方位（量化到 10 分鐘）
  const qm = Math.floor(min / 10) * 10;
  const tt = clamp((qm - 360) / 720, 0, 1), az = Math.PI * (.15 + .7 * tt), el = .35 + Math.sin(tt * Math.PI) * .75;
  const dir = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), .55 * Math.cos(el) + .35).normalize();
  sun.position.copy(center).addScaledVector(dir, 40); skyMat.uniforms.uSunDir.value.copy(dir);
  // 鐘面
  if (exchangeClock) { exchangeClock.mh.rotation.z = -(min % 60) / 60 * Math.PI * 2; exchangeClock.hh.rotation.z = -((min / 60) % 12) / 12 * Math.PI * 2; }
}
