
// ====================================================================
// 小人、協作線、badge
// ====================================================================
const ROLE_LOOK = {
  clerk:     { shirt: '#ece4d6', pants: '#3a3434', hair: '#2b2220', acc: [['box', 'body', [0, .155, 0], [.104, .09, .1], C.coral], ['box', 'body', [.022, .175, .052], [.024, .032, .006], C.cream]] },
  analyst:   { shirt: '#6f7fb5', pants: '#3b3f52', hair: '#3a2a24', acc: [['torus', 'head', [-.026, .283, .068], [.034, .034, .02], C.ink], ['torus', 'head', [.026, .283, .068], [.034, .034, .02], C.ink], ['box', 'armL', [0, -.085, .035], [.07, .05, .008], C.ink, [-1.1, 0, 0]]] },
  cfo:       { shirt: '#3b4a6b', pants: '#2a2f3d', hair: '#2b2220', acc: [['box', 'body', [0, .172, .049], [.016, .055, .006], C.coral], ['box', 'armR', [0, -.11, 0], [.026, .065, .085], '#7a4a32']] },
  ir:        { shirt: '#f2b5c6', pants: '#4a4048', hair: '#5a3a2a', acc: [['box', 'armL', [0, -.075, .035], [.065, .085, .014], C.coral, [-.9, 0, 0]]] },
  esg:       { shirt: '#9cc27a', pants: '#4a5a40', hair: '#3a2a24', acc: [['dome', 'head', [0, .288, 0], [.158, .13, .158], C.green], ['box', 'head', [0, .29, .07], [.12, .012, .04], C.green]] },
  settle:    { shirt: '#3e7c8c', pants: '#2f3b40', hair: '#2b2220', acc: [['box', 'armR', [0, -.11, .01], [.075, .07, .07], C.metal]] },
  engineer:  { shirt: '#58a6a6', pants: '#33383d', hair: '#1f1a18', acc: [['torus', 'head', [0, .29, 0], [.17, .17, .07], C.ink], ['box', 'armL', [0, -.085, .04], [.085, .01, .065], '#cfd3d6', [-1.2, 0, 0]]] },
  founder:   { shirt: '#db6a41', pants: '#3a3434', hair: '#2b2220', acc: [['dome', 'body', [0, .225, -.035], [.11, .09, .09], '#c95a34'], ['box', 'body', [0, .15, .05], [.05, .035, .006], '#c95a34']] },
  retiree:   { shirt: '#c5b5a7', pants: '#5a5048', hair: '#d8d4ce', acc: [['cyl', 'armR', [0, -.12, .02], [.013, .2, .013], C.wood]] },
  student:   { shirt: '#fff8f4', pants: '#3e4a6b', hair: '#2b2220', acc: [['dome', 'head', [0, .3, 0], [.152, .085, .152], C.yellow], ['box', 'head', [0, .3, .07], [.1, .01, .05], C.yellow]] },
  volunteer: { shirt: '#fcea8b', pants: '#4a4040', hair: '#3a2a24', acc: [['cyl', 'armL', [0, -.025, 0], [.034, .022, .034], C.coral]] },
  foreigner: { shirt: '#86a8a6', pants: '#3a3f44', hair: '#c49a5a', acc: [['box', 'body', [.1, .065, -.03], [.05, .11, .13], C.blue], ['box', 'body', [.1, .135, -.03], [.012, .03, .04], C.ink]] }
};
const SKINS = ['#f3d2b5', '#e8bf9c', '#d9a77f', '#f6dcc4'];
let WALKERS = [], PEOPLE = null, FLOWLINES = [], BADGE_TEX = {}, LEADS = {};

function iconTexture(kind) {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill();
    g.strokeStyle = C.coral; g.lineWidth = 9; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.stroke();
    g.strokeStyle = C.ink; g.fillStyle = C.ink; g.lineWidth = 6; g.lineCap = g.lineJoin = 'round';
    const L = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
    switch (kind) {
      case 'doc': L([[44, 32], [74, 32], [86, 44], [86, 96], [44, 96], [44, 32]]); L([[54, 58], [76, 58]]); L([[54, 72], [76, 72]]); L([[54, 84], [68, 84]]); break;
      case 'leaf': g.beginPath(); g.moveTo(40, 90); g.quadraticCurveTo(38, 38, 90, 36); g.quadraticCurveTo(92, 88, 40, 90); g.stroke(); L([[42, 88], [74, 54]]); break;
      case 'receipt': L([[44, 30], [84, 30], [84, 98], [76, 92], [68, 98], [60, 92], [52, 98], [44, 92], [44, 30]]); L([[54, 50], [74, 50]]); L([[54, 64], [74, 64]]); L([[54, 78], [66, 78]]); break;
      case 'list': [44, 64, 84].forEach(y => { g.beginPath(); g.arc(42, y, 4, 0, 7); g.fill(); L([[54, y], [88, y]]); }); break;
      case 'form': L([[42, 30], [86, 30], [86, 98], [42, 98], [42, 30]]); L([[50, 46], [78, 46]]); L([[50, 82], [60, 90], [80, 68]]); break;
      case 'slides': L([[34, 38], [94, 38], [94, 80], [34, 80], [34, 38]]); L([[64, 80], [64, 96]]); L([[50, 96], [78, 96]]); L([[46, 70], [60, 58], [70, 64], [84, 48]]); break;
      case 'shield': L([[64, 30], [90, 40], [88, 70], [64, 96], [40, 70], [38, 40], [64, 30]]); L([[64, 48], [64, 70]]); g.beginPath(); g.arc(64, 80, 3.5, 0, 7); g.fill(); break;
      case 'drive': L([[36, 44], [92, 44], [92, 84], [36, 84], [36, 44]]); L([[36, 68], [92, 68]]); g.beginPath(); g.arc(80, 76, 4, 0, 7); g.fill(); break;
      case 'globe': g.beginPath(); g.arc(64, 64, 30, 0, 7); g.stroke(); g.beginPath(); g.ellipse(64, 64, 13, 30, 0, 0, 7); g.stroke(); L([[34, 64], [94, 64]]); break;
      default: L([[40, 36], [64, 44], [88, 36], [88, 90], [64, 98], [40, 90], [40, 36]]); L([[64, 44], [64, 98]]);
    }
  }, false);
}

function buildPeopleAndFlows() {
  const rng = rngFor(31337);
  const camFrontK = 3; // 島前緣（+z）頂點
  DATA.flows.forEach((f, fi) => {
    const a = ISLAND[f.from].idx, b = ISLAND[f.to].idx;
    const pts = dijkstra(nodeId(a, camFrontK), nodeId(b, camFrontK));
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const path = { pts, cum, len: cum[cum.length - 1] };
    f.path = path;
    // 協作線
    const lifted = pts.map(p => p.clone().add(new THREE.Vector3(0, .05, 0)));
    const curve = new THREE.CatmullRomCurve3(lifted, false, 'centripetal', .2);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uLen: { value: path.len }, uStyle: { value: f.status === 'official' ? 0 : f.status === 'thematic' ? 1 : 2 }, uColor: { value: new THREE.Color(C.coral) }, uOpacity: { value: .82 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform float uTime; uniform float uLen; uniform float uStyle; uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
        void main(){ float u = vUv.x*uLen*5. - uTime*1.4; float f = fract(u);
          if (uStyle > .5 && uStyle < 1.5 && f > .6) discard;
          if (uStyle > 1.5 && f > .3) discard;
          vec3 c = uColor*(.86 + .14*smoothstep(0., 1., f));
          gl_FragColor = vec4(c, uOpacity);
          #include <colorspace_fragment>
        }`
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(40, Math.round(path.len * 14)), .035, 6, false), mat);
    tube.visible = false; tube.userData.flow = f.id; tube.renderOrder = 3; scene.add(tube);
    FLOWLINES.push(tube);
    // 小人
    if (!BADGE_TEX[f.icon]) BADGE_TEX[f.icon] = iconTexture(f.icon);
    const n = rng.i(4, Math.min(14, 4 + Math.round(path.len / 1.6)));
    for (let k = 0; k < n; k++) {
      const role = f.roles[k % f.roles.length];
      const bike = k > 0 && rng.f() < .15;
      WALKERS.push({
        flow: f, role, bike, lead: k === 0, s: k === 0 ? 0 : rng.f() * path.len, dir: rng.f() < .5 ? 1 : -1, pause: k === 0 ? .5 : 0,
        speed: bike ? rng.r(.62, .7) : rng.r(.32, .4), phase: rng.f(), side: (rng.f() < .5 ? 1 : -1) * rng.r(.03, .07),
        skin: rng.pick(SKINS), pos: new THREE.Vector3(), yaw: 0
      });
    }
  });
  WALKERS.forEach(w => { if (w.lead) w.dir = 1; });
  buildPeopleMeshes();
}

function buildPeopleMeshes() {
  const N = WALKERS.length;
  const mat = new THREE.MeshStandardMaterial({ roughness: .78, metalness: 0 });
  const mk = (geo, count, shadow = true) => { const m = new THREE.InstancedMesh(geo, mat, count); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.castShadow = shadow; m.frustumCulled = false; scene.add(m); return m; };
  const body = mk(new THREE.CapsuleGeometry(.048, .04, 4, 10), N);
  const head = mk(new THREE.SphereGeometry(.072, 16, 12), N);
  const hair = mk(new THREE.SphereGeometry(.075, 16, 8, 0, Math.PI * 2, 0, Math.PI * .55), N);
  const legs = mk(GEO.box, N * 2), arms = mk(GEO.box, N * 2);
  const eyes = mk(new THREE.SphereGeometry(.011, 6, 4), N * 2, false);
  const shadowMat = new THREE.MeshBasicMaterial({ color: '#3a2a20', transparent: true, opacity: .22, depthWrite: false });
  const shadows = new THREE.InstancedMesh(new THREE.CircleGeometry(.085, 16).rotateX(-Math.PI / 2), shadowMat, N); shadows.frustumCulled = false; shadows.renderOrder = 1; scene.add(shadows);
  // 配件：依角色建立零件清單
  const accCount = { box: 0, dome: 0, cyl: 0, torus: 0 };
  WALKERS.forEach(w => {
    const look = ROLE_LOOK[w.role];
    w.acc = look.acc.map(([kind, attach, p, s, c, rot]) => ({ kind, attach, m: new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rot || [0, 0, 0]))), new THREE.Vector3(...s)), c, idx: accCount[kind]++ }));
    if (w.bike) {
      const bk = [['torus', 'bike', [0, .05, .085], [.1, .1, .06], C.ink, [0, Math.PI / 2, 0]], ['torus', 'bike', [0, .05, -.085], [.1, .1, .06], C.ink, [0, Math.PI / 2, 0]],
        ['box', 'bike', [0, .09, 0], [.015, .015, .17], C.coral], ['box', 'bike', [0, .1, -.04], [.04, .015, .05], C.ink], ['box', 'bike', [0, .14, .07], [.1, .012, .012], C.ink]];
      bk.forEach(([kind, attach, p, s, c, rot]) => w.acc.push({ kind, attach, m: new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rot || [0, 0, 0]))), new THREE.Vector3(...s)), c, idx: accCount[kind]++ }));
    }
  });
  const acc = {}; for (const k in accCount) acc[k] = mk(GEO[k], Math.max(1, accCount[k]));
  const col = new THREE.Color();
  WALKERS.forEach((w, i) => {
    const look = ROLE_LOOK[w.role];
    body.setColorAt(i, col.set(look.shirt)); head.setColorAt(i, col.set(w.skin)); hair.setColorAt(i, col.set(look.hair));
    legs.setColorAt(i * 2, col.set(look.pants)); legs.setColorAt(i * 2 + 1, col);
    arms.setColorAt(i * 2, col.set(look.shirt)); arms.setColorAt(i * 2 + 1, col);
    eyes.setColorAt(i * 2, col.set(C.ink)); eyes.setColorAt(i * 2 + 1, col);
    w.acc.forEach(a => acc[a.kind].setColorAt(a.idx, col.set(a.c)));
    // badge 與名牌
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: BADGE_TEX[w.flow.icon], depthWrite: false }));
    sp.scale.set(.13, .13, 1); sp.visible = false; sp.userData.walker = i; scene.add(sp); w.badge = sp;
    const div = document.createElement('div'); div.className = 'bubble'; w.bubbleEl = div;
    const ob = new CSS2DObject(div); ob.visible = false; scene.add(ob); w.bubble = ob;
  });
  [body, head, hair, legs, arms, eyes, ...Object.values(acc)].forEach(m => { if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  body.userData.people = head.userData.people = true;
  PEOPLE = { body, head, hair, legs, arms, eyes, shadows, acc, all: [body, head, hair, legs, arms, eyes, shadows, ...Object.values(acc)] };
  updateBubbleText();
}
function updateBubbleText() { WALKERS.forEach(w => { w.bubbleEl.textContent = tr('正在搬 ' + w.flow.cargo, 'Carrying ' + w.flow.cargoEn); }); }

// 這些暫存物件在 three 載入後才建立（initApp）
let _root, _piv, _part, _tmpM, _v, _v2, _qq, _ee, CORAL, YELLOW, HOME_DIR, ray, ndc;
function initApp() {
  _root = new THREE.Matrix4(); _piv = new THREE.Matrix4(); _part = new THREE.Matrix4(); _tmpM = new THREE.Matrix4();
  _v = new THREE.Vector3(); _v2 = new THREE.Vector3(); _qq = new THREE.Quaternion(); _ee = new THREE.Euler();
  CORAL = new THREE.Color(C.coral); YELLOW = new THREE.Color(C.yellow);
  HOME_DIR = new THREE.Vector3(.24, .33, .87).normalize();
  ray = new THREE.Raycaster(); ndc = new THREE.Vector2();
}
function samplePath(path, s, out, tan) {
  const { pts, cum } = path; s = clamp(s, 0, path.len);
  let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
  const t = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
  out.lerpVectors(pts[i - 1], pts[i], t); tan.subVectors(pts[i], pts[i - 1]).normalize();
}
function composeTo(out, parent, x, y, z, rx, ry, rz, sx, sy, sz) {
  _ee.set(rx, ry, rz); _qq.setFromEuler(_ee); _v.set(x, y, z); _v2.set(sx, sy, sz);
  out.compose(_v, _qq, _v2); return out.premultiply(parent);
}
function updateWalkers(dt, animate) {
  if (!PEOPLE) return;
  const camD = camera.position.distanceTo(controls.target);
  const scl = clamp(camD / 20, 1, 1.45);
  const tan = new THREE.Vector3();
  const showBadge = S.walkers && camD < 16, showNames = S.walkers && S.names;
  WALKERS.forEach((w, i) => {
    const L = w.flow.path.len;
    if (animate) {
      if (w.pause > 0) {
        w.pause -= dt;
        if (w.pause <= 0 && w.lead && w.s <= 0) logEvent('depart', w);
      } else {
        w.s += w.dir * w.speed * dt;
        if (w.s >= L) { w.s = L; w.dir = -1; w.pause = 1.4; if (w.lead) logEvent('handoff', w); }
        else if (w.s <= 0) { w.s = 0; w.dir = 1; w.pause = 1.4; if (w.lead) logEvent('arrive', w); }
      }
    }
    samplePath(w.flow.path, w.s, w.pos, tan);
    const sgn = w.dir;
    w.pos.x += -tan.z * w.side * sgn; w.pos.z += tan.x * w.side * sgn;
    if (w.pause <= 0) w.yaw = Math.atan2(tan.x * sgn, tan.z * sgn);
    const moving = w.pause <= 0 && !S.paused && !S.reduced;
    const ph = S.time * 9 + w.phase * 20;
    const sw = moving ? Math.sin(ph) : 0;
    const bob = moving && !w.bike ? Math.abs(Math.sin(ph)) * .012 : 0;
    const lift = w.bike ? .07 : 0;
    _ee.set(0, w.yaw, 0); _qq.setFromEuler(_ee);
    const s = S.walkers ? scl : 0.00001;
    _root.compose(w.pos, _qq, _v2.set(s, s, s));
    const P_ = PEOPLE;
    // 身體、頭
    composeTo(_part, _root, 0, .155 + bob + lift, 0, 0, 0, 0, 1, 1, 1); P_.body.setMatrixAt(i, _part);
    composeTo(_part, _root, 0, .278 + bob + lift, 0, 0, 0, 0, 1, 1, 1); P_.head.setMatrixAt(i, _part);
    composeTo(_part, _root, 0, .282 + bob + lift, -.006, -.15, 0, 0, 1, 1, 1); P_.hair.setMatrixAt(i, _part);
    for (let e = 0; e < 2; e++) { composeTo(_part, _root, e ? .026 : -.026, .282 + bob + lift, .066, 0, 0, 0, 1, 1, 1); P_.eyes.setMatrixAt(i * 2 + e, _part); }
    // 腿
    for (let e = 0; e < 2; e++) {
      const legSw = w.bike ? (e ? .9 : .4) + (moving ? Math.sin(ph * .7 + e * Math.PI) * .3 : 0) : (e ? sw : -sw) * .55;
      composeTo(_piv, _root, e ? .024 : -.024, .09 + bob + lift, 0, -legSw * (w.bike ? 1 : 1), 0, 0, 1, 1, 1);
      composeTo(_part, _piv, 0, -.045, 0, 0, 0, 0, .034, .09, .04); P_.legs.setMatrixAt(i * 2 + e, _part);
    }
    // 手臂與手上配件
    const armM = [null, null];
    for (let e = 0; e < 2; e++) {
      const aSw = w.bike ? -.9 : (e ? -sw : sw) * .45;
      composeTo(_piv, _root, e ? .064 : -.064, .2 + bob + lift, 0, aSw, 0, e ? -.08 : .08, 1, 1, 1);
      armM[e] = _piv.clone();
      composeTo(_part, _piv, 0, -.04, 0, 0, 0, 0, .026, .085, .03); P_.arms.setMatrixAt(i * 2 + e, _part);
    }
    w.acc.forEach(a => {
      let parent;
      if (a.attach === 'armR') parent = armM[0]; else if (a.attach === 'armL') parent = armM[1];
      else if (a.attach === 'bike') parent = _root;
      else { parent = _tmpM.copy(_root).multiply(_part.makeTranslation(0, bob + lift, 0)); }
      _part.multiplyMatrices(parent, a.m); P_.acc[a.kind].setMatrixAt(a.idx, _part);
    });
    _part.compose(_v.set(w.pos.x, w.pos.y - .006, w.pos.z), _qq.identity(), _v2.set(s, 1, s)); P_.shadows.setMatrixAt(i, _part);
    // badge
    w.badge.visible = showBadge;
    if (showBadge) { w.badge.position.set(w.pos.x, w.pos.y + (.43 + lift) * scl, w.pos.z); w.badge.scale.setScalar(.13 * scl); }
    const near = showNames && camera.position.distanceTo(w.pos) < 14;
    w.bubble.visible = near; if (near) w.bubble.position.set(w.pos.x, w.pos.y + .38 * scl, w.pos.z);
  });
  PEOPLE.all.forEach(m => m.instanceMatrix.needsUpdate = true);
}

// ====================================================================
// 日誌
// ====================================================================
const LOG = [];
function hhmm(min) { min = ((Math.floor(min) % 1440) + 1440) % 1440; return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); }
function logEvent(type, w) { LOG.unshift({ type, flow: w.flow.id, role: w.role, t: hhmm(S.min) }); if (LOG.length > 60) LOG.pop(); if (S.log) renderLog(); }
function logText(e) {
  const f = FLOW[e.flow], role = DATA.roles[e.role], from = ISLAND[f.from], to = ISLAND[f.to];
  const r = nm(role), cg = tr(f.cargo, f.cargoEn);
  if (e.type === 'depart') return tr(`${r}帶著${cg}從${from.name}島出發`, `${r} leaves ${from.en} with the ${cg}`);
  if (e.type === 'handoff') return tr(`${r}把${cg}交給${to.name}島`, `${r} hands the ${cg} to ${to.en}`);
  return tr(`${r}回到${from.name}島`, `${r} is back at ${from.en}`);
}

// ====================================================================
// 標籤
// ====================================================================
let ISLAND_LABELS = [], PINS = [], PIN_LINES = [];
function buildLabels() {
  ISL.forEach(is => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ilabel';
    b.innerHTML = `<span class="num">${String(is.no).padStart(2, '0')}</span><span class="txt"></span>`;
    b.addEventListener('click', e => { e.stopPropagation(); selectIsland(is.id); });
    const o = new CSS2DObject(b); o.position.set(is.pos.x, TOP - .02, is.pos.z + R * .9); scene.add(o);
    ISLAND_LABELS.push({ o, el: b, is, state: 'full', kind: 'island' });
    is.items.forEach((it, k) => {
      const p = document.createElement('button'); p.type = 'button'; p.className = 'pin'; p.textContent = CIRCLED[k];
      p.addEventListener('click', e => { e.stopPropagation(); selectItem(it.id); });
      const top = ITEM_TOPS[it.id]; const po = new CSS2DObject(p); po.position.set(top.x, top.y + .34, top.z); po.visible = false; scene.add(po);
      PINS.push({ o: po, el: p, it, state: 'full', kind: 'pin' });
      const g = new THREE.BufferGeometry().setFromPoints([top.clone().add(new THREE.Vector3(0, .02, 0)), new THREE.Vector3(top.x, top.y + .26, top.z)]);
      const ln = new THREE.Line(g, new THREE.LineBasicMaterial({ color: C.coral, depthTest: false, transparent: true })); ln.renderOrder = 20; ln.visible = false; scene.add(ln);
      PIN_LINES.push({ ln, it });
    });
  });
  updateLabelText();
}
function updateLabelText() {
  ISLAND_LABELS.forEach(L => { L.el.querySelector('.txt').textContent = nm(L.is); L.el.setAttribute('aria-label', nm(L.is)); L.wFull = 0; });
  PINS.forEach(p => p.el.setAttribute('aria-label', nm(p.it)));
}
let PANEL_RECTS = [], panelsDirty = true;
function panelRects() {
  if (!panelsDirty) return PANEL_RECTS;
  panelsDirty = false;
  PANEL_RECTS = ['brand', 'tools', 'card', 'side', 'hud', 'log', 'legend', 'hudBtn'].map(id => document.getElementById(id)).filter(el => el && !el.hidden && el.offsetParent !== null && getComputedStyle(el).display !== 'none').map(el => el.getBoundingClientRect());
  return PANEL_RECTS;
}
const RANK = { full: 0, num: 1, hide: 2 };
function layoutLabels() {
  const w = glHost.clientWidth, h = glHost.clientHeight;
  const placed = panelRects().map(r => ({ l: r.left, r: r.right, t: r.top, b: r.bottom }));
  const hit = (a) => a.l < 4 || a.r > w - 4 || a.t < 4 || a.b > h - 4 || placed.some(b => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t);
  const sel = S.sel;
  const selIsland = sel && (sel.kind === 'island' ? sel.id : sel.kind === 'item' ? ITEM[sel.id].island.id : null);
  const list = [];
  PINS.forEach(p => { if (p.o.visible) list.push(p); });
  ISLAND_LABELS.forEach(L => list.push(L));
  list.forEach(L => { L.o.getWorldPosition(_v).project(camera); L.sx = (_v.x * .5 + .5) * w; L.sy = (-_v.y * .5 + .5) * h; L.depth = _v.z; });
  list.sort((a, b) => (b.kind === 'pin') - (a.kind === 'pin') || ((b.is && b.is.id === selIsland) - (a.is && a.is.id === selIsland)) || a.depth - b.depth);
  for (const L of list) {
    if (L.kind === 'island' && !L.wFull) { const n = L.el.querySelector('.num'), t = L.el.querySelector('.txt'); L.wNum = n.offsetWidth + 14; L.wFull = L.wNum + t.scrollWidth + 8; L.h = L.el.offsetHeight || 28; }
    const opts = L.kind === 'pin' ? [['full', 26]] : [['full', L.wFull], ['num', L.wNum]];
    const hh = L.kind === 'pin' ? 26 : L.h;
    let st = 'hide';
    if (L.depth < 1) for (const [cand, ww] of opts) {
      const pad = RANK[cand] < RANK[L.state] ? 8 : 0;
      const r = { l: L.sx - ww / 2 - pad, r: L.sx + ww / 2 + pad, t: L.sy - hh / 2 - pad, b: L.sy + hh / 2 + pad };
      if (!hit(r)) { st = cand; placed.push({ l: L.sx - ww / 2, r: L.sx + ww / 2, t: L.sy - hh / 2, b: L.sy + hh / 2 }); break; }
    }
    if (st !== L.state) { L.el.classList.toggle('c-num', st === 'num'); L.el.classList.toggle('c-hide', st === 'hide'); L.state = st; }
  }
}

// ====================================================================
// 高亮
// ====================================================================
function currentSeg() { const dc = DATA.dayCycle; let s = dc.length - 1; for (let i = 0; i < dc.length; i++) if (S.min >= dc[i].min) s = i; return s; }
function relatedIslands() { const sel = S.sel; if (!sel) return new Set(); if (sel.kind === 'island') return new Set([sel.id]); if (sel.kind === 'item') return new Set([ITEM[sel.id].island.id]); const f = sel.kind === 'flow' ? FLOW[sel.id] : WALKERS[sel.id].flow; return new Set([f.from, f.to]); }
function recolor() {
  const sel = S.sel, selItems = new Set();
  if (sel && sel.kind === 'island') ISLAND[sel.id].items.forEach(it => selItems.add(it.id));
  if (sel && sel.kind === 'item') selItems.add(sel.id);
  const lit = new Set(DATA.dayCycle[S.seg] ? DATA.dayCycle[S.seg].items : []);
  const col = new THREE.Color();
  for (const [owner, list] of ownerIndex) {
    if (!owner.startsWith('item:')) continue;
    const id = owner.slice(5);
    const mode = selItems.has(id) ? 1 : lit.has(id) ? 2 : 0;
    for (const [mesh, i] of list) {
      col.copy(mesh.userData.base[i]); if (mode === 1) col.lerp(CORAL, .22); else if (mode === 2) col.lerp(YELLOW, .22);
      mesh.setColorAt(i, col);
    }
  }
  kitMeshes.forEach(m => { if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  // 標籤狀態
  const rel = relatedIslands();
  const litIsl = new Set([...lit].map(id => ITEM[id] && ITEM[id].island.id));
  ISLAND_LABELS.forEach(L => { L.el.classList.toggle('sel', rel.has(L.is.id) && sel && (sel.kind === 'island' || sel.kind === 'item')); L.el.classList.toggle('dim', !!sel && !rel.has(L.is.id)); L.el.classList.toggle('lit', litIsl.has(L.is.id)); });
  const pinIsland = sel && (sel.kind === 'island' ? sel.id : sel.kind === 'item' ? ITEM[sel.id].island.id : null);
  PINS.forEach(p => { p.o.visible = p.it.island.id === pinIsland; p.el.classList.toggle('sel', sel && sel.kind === 'item' && sel.id === p.it.id); });
  PIN_LINES.forEach(p => p.ln.visible = p.it.island.id === pinIsland);
  S.dirty = true;
}
function relatedFlows() {
  const sel = S.sel, out = new Set(); if (!sel) return out;
  if (sel.kind === 'flow') out.add(sel.id);
  else if (sel.kind === 'walker') out.add(WALKERS[sel.id].flow.id);
  else { const isl = sel.kind === 'island' ? sel.id : ITEM[sel.id].island.id; DATA.flows.forEach(f => { if (f.from === isl || f.to === isl) out.add(f.id); }); }
  return out;
}
function updateFlowVisibility() {
  const rel = relatedFlows(); let any = false;
  FLOWLINES.forEach(t => { t.visible = S.flows || rel.has(t.userData.flow); t.material.uniforms.uOpacity.value = (rel.size && !rel.has(t.userData.flow)) ? .35 : .82; any = any || t.visible; });
  document.getElementById('legend').hidden = !any; panelsDirty = true; S.dirty = true;
}

// ====================================================================
// 相機
// ====================================================================
const DEG = Math.PI / 180;
function homeDistance() { const a = glHost.clientWidth / Math.max(1, glHost.clientHeight); return a > 1.25 ? 28.5 : a > .8 ? 38 : 56; }
// 桌面版左側有卡片時，把主角移到卡片與清單之間的空白處（上限 1.5）
function viewShift(dist) {
  if (isMobile() || $('card').hidden) return 0;
  const W = glHost.clientWidth, H = glHost.clientHeight;
  const l = $('card').getBoundingClientRect().right, r = S.sideOpen ? $('side').getBoundingClientRect().left : W;
  const px = (l + r) / 2 - W / 2, perPx = 2 * Math.tan(camera.fov * DEG / 2) * dist / H;
  return clamp(px * perPx, -1.5, 1.5);
}
function flyTo(target, pos) {
  const sh = viewShift(target.distanceTo(pos));
  if (sh) {
    const right = new THREE.Vector3().subVectors(target, pos).cross(camera.up).normalize();
    target = target.clone().addScaledVector(right, -sh); pos = pos.clone().addScaledVector(right, -sh);
  }
  if (S.reduced) { camera.position.copy(pos); controls.target.copy(target); controls.update(); S.fly = null; S.dirty = true; return; }
  S.fly = { t: 0, p0: camera.position.clone(), q0: controls.target.clone(), p1: pos, q1: target };
  controls.enabled = false;
}
const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function stepFly(dt) {
  const f = S.fly; if (!f) return;
  f.t = Math.min(1, f.t + dt / .8); const e = easeIO(f.t);
  camera.position.lerpVectors(f.p0, f.p1, e); controls.target.lerpVectors(f.q0, f.q1, e);
  if (f.t >= 1) { S.fly = null; controls.enabled = true; }
  S.dirty = true;
}
function setBird(on) {
  S.bird = on; controls.minPolarAngle = on ? 0 : 25 * DEG; pressToggle('bird', on);
  if (on) { S.mode = 'bird'; flyTo(center.clone(), center.clone().add(new THREE.Vector3(.01, 42, 6))); }
}
function goHome() {
  if (S.bird) setBird(false);
  S.mode = 'home';
  flyTo(center.clone(), center.clone().addScaledVector(HOME_DIR, homeDistance()));
}
// 直式螢幕水平視角窄，飛行距離按長寬比拉遠
const aspectK = () => clamp(1.25 / (glHost.clientWidth / Math.max(1, glHost.clientHeight)), 1, 2.2);
function flyIsland(id) { const p = ISLAND[id].pos; const t = new THREE.Vector3(p.x, TOP, p.z); flyTo(t, t.clone().add(new THREE.Vector3(2.75, 5.3, 6.2).multiplyScalar(aspectK()))); }
function flyItem(id) { const t = ITEM_CENTER[id].clone(); flyTo(t, t.clone().add(new THREE.Vector3(1.6, 2.5, 3.2).multiplyScalar(aspectK()))); }
function flyFlow(f) {
  const a = ISLAND[f.from].pos, b = ISLAND[f.to].pos, mid = a.clone().add(b).multiplyScalar(.5); mid.y = TOP;
  const d = a.distanceTo(b); flyTo(mid, mid.clone().add(new THREE.Vector3(2.75, 5.3, 6.2).multiplyScalar(clamp(d / 5, 1, 2.2))));
}

// ====================================================================
// 選取
// ====================================================================
function select(sel, flyFn) {
  if (S.bird) setBird(false);
  S.sel = sel; S.mode = sel.kind;
  recolor(); updateFlowVisibility(); openCard(); flyFn(); renderSideActive();
}
function selectIsland(id) { select({ kind: 'island', id }, () => flyIsland(id)); }
function selectItem(id) { select({ kind: 'item', id }, () => flyItem(id)); }
function selectFlow(id) { select({ kind: 'flow', id }, () => flyFlow(FLOW[id])); }
function selectWalker(i) { const w = WALKERS[i]; select({ kind: 'walker', id: i }, () => { const t = w.pos.clone(); flyTo(t, t.clone().add(new THREE.Vector3(1.2, 1.8, 2.4))); }); }
function clearSelection() { if (!S.sel) return; S.sel = null; recolor(); updateFlowVisibility(); closeCard(); renderSideActive(); }

// ====================================================================
// 縮圖（160² 離屏渲染）
// ====================================================================
const THUMBS = {}; let thumbR = null, thumbScene = null, thumbCam = null;
function thumbnail(it) {
  if (THUMBS[it.id]) return THUMBS[it.id];
  try {
    if (!thumbR) {
      thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      thumbR.setPixelRatio(2); thumbR.setSize(160, 160, false);
      thumbR.outputColorSpace = THREE.SRGBColorSpace; thumbR.toneMapping = THREE.ACESFilmicToneMapping;
      thumbScene = new THREE.Scene();
      thumbScene.add(new THREE.HemisphereLight(0xeef6fa, 0x8f8270, 1.5));
      const d = new THREE.DirectionalLight(0xfff1de, 2.6); d.position.set(2, 4, 3); thumbScene.add(d);
      thumbCam = new THREE.PerspectiveCamera(30, 1, .1, 50);
    }
    const g = new THREE.Group(); const sink = new MeshSink(g);
    const prev = SINK; SINK = sink; FRAME.identity(); OWNER = null;
    (MODELS[it.model] || MODELS.house)(rngFor(5), it);
    SINK = prev;
    thumbScene.add(g); g.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()).length();
    thumbCam.position.copy(c).add(new THREE.Vector3(1.1, .9, 1.6).normalize().multiplyScalar(size * 1.75)); thumbCam.lookAt(c);
    thumbR.render(thumbScene, thumbCam);
    THUMBS[it.id] = thumbR.domElement.toDataURL('image/png');
    thumbScene.remove(g); sink.mats.forEach(m => m.dispose());
  } catch (e) { THUMBS[it.id] = ''; }
  return THUMBS[it.id];
}

// ====================================================================
// 介面
// ====================================================================
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STATUS = { live: ['已上線', 'Live'], progress: ['推動中', 'In progress'], plan: ['規劃中', 'Planned'] };
const FSTATUS = { official: ['已實施', 'In force'], thematic: ['推動中', 'In progress'], pending: ['研議／規劃中', 'Under study'] };
const st = (k) => tr(...STATUS[k]);
const disclaimer = () => `<p class="disc">${tr('非官方示範，資料以證交所官網公告為準。', 'Unofficial demo. Figures follow TWSE announcements.')} <a href="${tr(DATA.city.site, DATA.city.siteEn)}" target="_blank" rel="noopener">${tr('證交所官網', 'TWSE website')} ↗</a></p>`;

function bigNumbers(it) {
  const out = [];
  for (const f of it.facts) {
    const zh = f.split('|')[0]; if (/待查證|示意/.test(zh)) continue;
    const txt = factText(f);
    let m = txt.match(/\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}/) || txt.match(/T\+\d/) || txt.match(/\d+(?:[.,]\d+)?\s*(?:%|秒|seconds?|名|股|share)/) || txt.match(/\b\d{1,2}:\d{2}\b/) || txt.match(/(?:19|20)\d{2}|\d{3}\s*年/);
    if (m) out.push({ n: m[0].replace(/\s+/g, ''), cap: txt });
    if (out.length >= 3) break;
  }
  return out;
}
function openCard() {
  const card = $('card'), body = $('cardBody'), sel = S.sel; if (!sel) return;
  let h = '';
  if (sel.kind === 'island') {
    const is = ISLAND[sel.id];
    const flows = DATA.flows.filter(f => f.from === is.id || f.to === is.id);
    const lit = new Set(DATA.dayCycle[S.seg] ? DATA.dayCycle[S.seg].items : []);
    h = `<div class="cardhead"><div class="ibadge" style="background:${is.color}">${is.no}</div><div><div class="eyebrow">${tr('政策主題', 'Policy topic')} ${String(is.no).padStart(2, '0')}</div><h2>${esc(nm(is))}</h2></div></div>
      <p>${esc(tr(is.summary, is.summaryEn))}</p>
      <div><div class="eyebrow">${tr('細項', 'Items')} · ${is.items.length}</div>
      <ul class="itemlist">${is.items.map((it, k) => `<li><button class="rowbtn${lit.has(it.id) ? ' lit' : ''}" type="button" data-item="${it.id}"><span class="n">${CIRCLED[k]}</span><span class="t">${esc(nm(it))}</span><span class="status ${it.status}">${st(it.status)}</span></button></li>`).join('')}</ul></div>
      ${flows.length ? `<div><div class="eyebrow">${tr('協作', 'Links')}</div><div class="chips" style="margin-top:8px">${flows.map(f => `<button class="chip" type="button" data-flow="${f.id}"><i class="swatch ${f.status}"></i>${esc(nm(ISLAND[f.from]))} → ${esc(nm(ISLAND[f.to]))}</button>`).join('')}</div></div>` : ''}
      ${disclaimer()}`;
  } else if (sel.kind === 'item') {
    const it = ITEM[sel.id], is = it.island, nums = bigNumbers(it), src = thumbnail(it);
    const stepIdx = { live: 0, progress: 1, plan: 2 }[it.status];
    h = `<div><div class="eyebrow">${tr('細項', 'Item')} ${CIRCLED[it.k]} · <button class="chip cream" type="button" data-island="${is.id}" style="padding:2px 9px;min-height:24px">${esc(nm(is))}</button></div><h2>${esc(nm(it))}</h2></div>
      ${src ? `<img class="thumb" src="${src}" alt="${esc(nm(it))}" width="160" height="160">` : ''}
      <p>${esc(tr(it.desc, it.descEn))}</p>
      ${nums.length ? `<div class="tiles">${nums.map(n => `<div class="tile"><b>${esc(n.n)}</b><span>${esc(n.cap)}</span></div>`).join('')}</div>` : ''}
      <div><div class="eyebrow">${tr('重點', 'Key facts')}</div><ul class="facts" style="margin-top:8px">${it.facts.map(f => { const t = factText(f); return `<li${/待查證|to be verified/.test(t) ? ' class="tbc"' : ''}>${esc(t)}</li>`; }).join('')}</ul></div>
      <div><div class="eyebrow" style="margin-bottom:8px">${tr('時程', 'Status')}</div><div class="timeline">${['live', 'progress', 'plan'].map((k, i) => `<div class="${i === stepIdx ? 'on' : ''}">${st(k)}</div>`).join('')}</div></div>
      <a class="btn linkbtn" href="${esc(it.url)}" target="_blank" rel="noopener">${tr('前往官網', 'Open on TWSE site')} ↗</a>
      ${disclaimer()}`;
  } else {
    const f = sel.kind === 'flow' ? FLOW[sel.id] : WALKERS[sel.id].flow;
    const w = sel.kind === 'walker' ? WALKERS[sel.id] : null;
    h = `<div><div class="eyebrow">${w ? tr('搬運中的小人', 'Courier') : tr('協作線', 'Collaboration link')}</div><h2>${w ? esc(nm(DATA.roles[w.role])) : esc(tr(f.cargo, f.cargoEn))}</h2></div>
      <div class="flowpath"><button class="chip" type="button" data-island="${f.from}">${esc(nm(ISLAND[f.from]))}</button><span aria-hidden="true">→</span><button class="chip" type="button" data-island="${f.to}">${esc(nm(ISLAND[f.to]))}</button></div>
      <dl class="kv"><dt>${tr('搬運物', 'Carrying')}</dt><dd>${esc(tr(f.cargo, f.cargoEn))}</dd>
        <dt>${tr('走路的角色', 'Who walks')}</dt><dd>${f.roles.map(r => esc(nm(DATA.roles[r]))).join('、')}</dd>
        <dt>${tr('制度狀態', 'Status')}</dt><dd><i class="swatch ${f.status}"></i> ${tr(...FSTATUS[f.status])}</dd>
        ${w ? `<dt>${tr('方向', 'Heading')}</dt><dd>${w.dir > 0 ? esc(tr('前往 ' + ISLAND[f.to].name, 'to ' + ISLAND[f.to].en)) : esc(tr('返回 ' + ISLAND[f.from].name, 'back to ' + ISLAND[f.from].en))}</dd>` : ''}</dl>
      <p class="disc">${tr('協作線是示意：表達兩個主題之間文件與資訊的流向，不代表正式作業流程。', 'Links are illustrative: they show how documents and information move between topics, not formal procedures.')}</p>
      ${disclaimer()}`;
  }
  body.innerHTML = h; body.scrollTop = 0;
  const wasHidden = card.hidden; card.hidden = false; panelsDirty = true; S.dirty = true;
  if (wasHidden && isMobile()) card.style.height = '';
}
function closeCard() { $('card').hidden = true; panelsDirty = true; S.dirty = true; }

function renderSide() {
  const list = $('sideList'), q = S.query.trim().toLowerCase();
  const lit = new Set(DATA.dayCycle[S.seg] ? DATA.dayCycle[S.seg].items : []);
  const match = (...s) => !q || s.some(x => x && x.toLowerCase().includes(q));
  let h = '';
  if (S.tab === 'topics') {
    ISL.forEach(is => {
      const items = is.items.map((it, k) => ({ it, k })).filter(({ it }) => match(it.name, it.en, it.desc, it.descEn) || match(is.name, is.en));
      if (!items.length) return;
      h += `<details${q ? ' open' : ''} data-isl="${is.id}"><summary><span class="no">${String(is.no).padStart(2, '0')}</span><span class="dot" style="background:${is.color}"></span><span>${esc(nm(is))}</span><span class="cnt">${items.length}</span></summary>
        <ul class="itemlist">${items.map(({ it, k }) => `<li><button class="rowbtn${lit.has(it.id) ? ' lit' : ''}" type="button" data-item="${it.id}"><span class="n">${CIRCLED[k]}</span><span class="t">${esc(nm(it))}</span></button></li>`).join('')}</ul></details>`;
    });
  } else {
    const fl = DATA.flows.filter(f => match(f.cargo, f.cargoEn, ISLAND[f.from].name, ISLAND[f.to].name, ISLAND[f.from].en, ISLAND[f.to].en));
    h = `<ul class="itemlist">${fl.map(f => `<li><button class="rowbtn" type="button" data-flow="${f.id}"><i class="swatch ${f.status}" style="width:26px;flex:none"></i><span class="t">${esc(nm(ISLAND[f.from]))} → ${esc(nm(ISLAND[f.to]))}<br><span class="disc">${esc(tr(f.cargo, f.cargoEn))} · ${f.roles.map(r => esc(nm(DATA.roles[r]))).join('、')}</span></span></button></li>`).join('')}</ul>`;
  }
  list.innerHTML = h || `<p class="empty">${tr('找不到符合的項目，換個關鍵字試試。', 'Nothing matches. Try another keyword.')}</p>`;
  renderSideActive();
}
function renderSideActive() {
  const sel = S.sel;
  $('sideList').querySelectorAll('[data-item]').forEach(b => b.setAttribute('aria-current', sel && sel.kind === 'item' && sel.id === b.dataset.item ? 'true' : 'false'));
  if (sel && (sel.kind === 'island' || sel.kind === 'item')) {
    const isl = sel.kind === 'island' ? sel.id : ITEM[sel.id].island.id;
    const d = $('sideList').querySelector(`details[data-isl="${isl}"]`); if (d) d.open = true;
  }
}
function renderLog() {
  const f = S.logFilter;
  const items = LOG.filter(e => f === 'all' || e.flow === f).slice(0, 30);
  $('logList').innerHTML = items.length ? items.map(e => `<li class="${e.type}"><time>${e.t}</time><span>${esc(logText(e))}</span></li>`).join('') : `<li><time>--:--</time><span>${tr('等待小人到站…', 'Waiting for couriers to arrive…')}</span></li>`;
}
function renderLogFilter() {
  $('logFilter').innerHTML = `<option value="all">${tr('全部協作線', 'All links')}</option>` + DATA.flows.map(f => `<option value="${f.id}">${esc(nm(ISLAND[f.from]))} → ${esc(nm(ISLAND[f.to]))}</option>`).join('');
  $('logFilter').value = S.logFilter;
}
function updateHud() {
  $('clockTime').textContent = hhmm(S.min);
  const seg = DATA.dayCycle[S.seg];
  $('segName').textContent = seg ? tr(seg.name, seg.en) : '';
  $('segName').title = seg ? tr(seg.note, seg.noteEn) : '';
}
function pressToggle(k, on) { const b = document.querySelector(`#toggles [data-k="${k}"]`); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
function applyStaticLang() {
  document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-Hant-TW';
  document.querySelectorAll('[data-en]').forEach(el => { if (el.dataset.zh === undefined) el.dataset.zh = el.textContent; el.textContent = LANG === 'en' ? el.dataset.en : el.dataset.zh; });
  document.querySelectorAll('[data-en-ph]').forEach(el => { if (el.dataset.zhPh === undefined) el.dataset.zhPh = el.placeholder; el.placeholder = LANG === 'en' ? el.dataset.enPh : el.dataset.zhPh; });
  $('btnLang').textContent = LANG === 'en' ? '中' : 'EN';
  $('btnLang').setAttribute('aria-label', LANG === 'en' ? '切換為中文' : 'Switch to English');
  $('siteLink').href = tr(DATA.city.site, DATA.city.siteEn);
  document.title = tr('證交所政策島', 'TWSE Policy Isles');
}
function setLang(l) {
  LANG = l; try { localStorage.setItem('twse-city-lang', l); } catch (e) { }
  applyStaticLang(); updateLabelText(); updateBubbleText(); renderSide(); renderLogFilter(); renderLog(); updateHud(); if (S.sel) openCard();
  panelsDirty = true; S.dirty = true;
}

// 手機 bottom sheet
function makeSheet(el) {
  const handle = el.querySelector('.handle'); let y0 = 0, h0 = 0, drag = false;
  handle.addEventListener('pointerdown', e => { if (!isMobile()) return; drag = true; y0 = e.clientY; h0 = el.getBoundingClientRect().height; handle.setPointerCapture(e.pointerId); });
  handle.addEventListener('pointermove', e => { if (!drag) return; const H = $('app').clientHeight; el.style.height = clamp(h0 + (y0 - e.clientY), 60, H) + 'px'; panelsDirty = true; S.dirty = true; });
  handle.addEventListener('pointerup', e => {
    if (!drag) return; drag = false; const H = $('app').clientHeight, h = el.getBoundingClientRect().height;
    if (h > H * .8) el.style.height = '100%';
    else if (h < H * .16) { el.style.height = ''; if (el.id === 'card') clearSelection(); else setSide(false); }
    panelsDirty = true; S.dirty = true;
  });
}
function applyLayout() {
  const m = isMobile();
  ['side', 'card'].forEach(id => $(id).classList.toggle('sheet', m));
  if (!m) { $('side').style.height = ''; $('card').style.height = ''; }
  panelsDirty = true; S.dirty = true;
}
function setSide(open) {
  S.sideOpen = open; $('side').hidden = !open; $('btnList').setAttribute('aria-pressed', open ? 'true' : 'false');
  document.body.classList.toggle('side-open', open); if (open && isMobile()) $('side').style.height = '';
  panelsDirty = true; S.dirty = true;
}

function setTime(min, swing = true) {
  const prev = S.min;
  S.min = ((min % 1440) + 1440) % 1440;
  if (swing && exchangeClock) { for (const m of [540, 810]) { if (crossed(prev, S.min, m)) exchangeClock.swing = 1; } }
  applyTime(S.min);
  const seg = currentSeg(); if (seg !== S.seg) { S.seg = seg; recolor(); renderSideLit(); if (S.sel && S.sel.kind === 'island') openCard(); }
  updateHud(); S.dirty = true;
}
function crossed(a, b, m) { if (a === b) return a === m; if (b >= a) return a < m && m <= b; return a < m || m <= b; }
function renderSideLit() { const lit = new Set(DATA.dayCycle[S.seg] ? DATA.dayCycle[S.seg].items : []); document.querySelectorAll('.rowbtn[data-item]').forEach(b => b.classList.toggle('lit', lit.has(b.dataset.item))); }

function bindUI() {
  $('btnHome').addEventListener('click', () => { clearSelection(); goHome(); });
  $('btnList').addEventListener('click', () => setSide(!S.sideOpen));
  $('btnHelp').addEventListener('click', () => { $('help').hidden = false; $('helpOk').focus(); });
  $('helpOk').addEventListener('click', () => { $('help').hidden = true; try { localStorage.setItem('twse-city-help-v1', '1'); } catch (e) { } });
  $('btnLang').addEventListener('click', () => setLang(LANG === 'en' ? 'zh' : 'en'));
  $('cardClose').addEventListener('click', clearSelection);
  $('search').addEventListener('input', e => { S.query = e.target.value; renderSide(); });
  $('tabTopics').addEventListener('click', () => { S.tab = 'topics'; $('tabTopics').setAttribute('aria-pressed', 'true'); $('tabFlows').setAttribute('aria-pressed', 'false'); renderSide(); });
  $('tabFlows').addEventListener('click', () => { S.tab = 'flows'; $('tabFlows').setAttribute('aria-pressed', 'true'); $('tabTopics').setAttribute('aria-pressed', 'false'); renderSide(); });
  $('logFilter').addEventListener('change', e => { S.logFilter = e.target.value; renderLog(); });
  const delegate = e => {
    const t = e.target.closest('[data-item],[data-flow],[data-island]'); if (!t) return;
    if (t.dataset.item) selectItem(t.dataset.item); else if (t.dataset.flow) selectFlow(t.dataset.flow); else selectIsland(t.dataset.island);
    if (isMobile() && t.closest('#side')) setSide(false);
  };
  $('sideList').addEventListener('click', delegate); $('cardBody').addEventListener('click', delegate);
  document.querySelectorAll('#timeBtns [data-min]').forEach(b => b.addEventListener('click', () => setTime(+b.dataset.min)));
  document.querySelectorAll('#toggles [data-k]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.k;
    if (k === 'bird') { if (S.bird) { setBird(false); goHome(); } else { clearSelection(); setBird(true); } return; }
    S[k] = !S[k]; pressToggle(k, S[k]);
    if (k === 'flows') updateFlowVisibility();
    if (k === 'log') { $('log').hidden = !S.log; if (S.log) renderLog(); panelsDirty = true; }
    S.dirty = true;
  }));
  $('hudBtn').addEventListener('click', () => { const o = !$('hud').classList.contains('open'); $('hud').classList.toggle('open', o); $('hudBtn').setAttribute('aria-expanded', o ? 'true' : 'false'); panelsDirty = true; S.dirty = true; });
  makeSheet($('side')); makeSheet($('card'));
  window.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,select,textarea')) return;
    if (e.key === 'Escape') { if (!$('help').hidden) { $('help').hidden = true; return; } clearSelection(); return; }
    const k = { ArrowLeft: [-.12, 0], ArrowRight: [.12, 0], ArrowUp: [0, -.08], ArrowDown: [0, .08] }[e.key];
    if (!k) return; e.preventDefault(); S.fly = null; controls.enabled = true;
    const off = camera.position.clone().sub(controls.target), sp = new THREE.Spherical().setFromVector3(off);
    sp.theta += k[0]; sp.phi = clamp(sp.phi + k[1], controls.minPolarAngle, controls.maxPolarAngle);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sp)); S.dirty = true;
  });
  // 點擊：移動 ≤ 6px 才 raycast
  const el = renderer.domElement; let down = null;
  el.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; if (S.fly) { S.fly = null; controls.enabled = true; } });
  el.addEventListener('pointerup', e => { if (!down || e.button !== 0) { down = null; return; } const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null; if (moved <= 6) pick(e); });
}
function pick(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const targets = [...kitMeshes.filter(m => m.visible), ...islandCaps, ...FLOWLINES.filter(t => t.visible)];
  if (S.walkers) { PEOPLE.body.computeBoundingSphere(); PEOPLE.head.computeBoundingSphere(); targets.push(PEOPLE.body, PEOPLE.head); }
  const hits = ray.intersectObjects(targets, false);
  for (const h of hits) {
    const o = h.object;
    if (o.userData.people) { selectWalker(h.instanceId); return; }
    if (o.userData.flow) { selectFlow(o.userData.flow); return; }
    if (o.userData.kit) {
      const ow = o.userData.owners[h.instanceId]; if (!ow) continue;
      if (ow.startsWith('item:')) { selectItem(ow.slice(5)); return; }
      if (ow.startsWith('island:')) { selectIsland(ow.slice(7)); return; }
    }
    if (o.userData.cap) { let best = null, bd = 1e9; ISL.forEach(is => { const d = Math.hypot(is.pos.x - h.point.x, is.pos.z - h.point.z); if (d < bd) { bd = d; best = is; } }); if (best) selectIsland(best.id); return; }
  }
  clearSelection();
}

// ====================================================================
// 主迴圈
// ====================================================================
let lastT = 0;
function tick(dt) {
  const animate = !S.paused && !S.reduced;
  if (animate) {
    S.time += dt;
    setTime(S.min + dt * 10);
    waterMats.forEach(m => m.uniforms.uTime.value = S.time);
    FLOWLINES.forEach(t => t.material.uniforms.uTime.value = S.time);
    updateClouds(dt); updateBoats(dt);
    S.dirty = true;
  }
  stepFly(dt);
  if (exchangeClock && exchangeClock.swing > 0) {
    if (S.reduced) exchangeClock.swing = 0;
    else { exchangeClock.swing = Math.max(0, exchangeClock.swing - dt / 2.4); const s = exchangeClock.swing; exchangeClock.pivot.rotation.z = Math.sin((1 - s) * Math.PI * 7) * .28 * s; S.dirty = true; }
    if (exchangeClock.swing === 0) exchangeClock.pivot.rotation.z = 0;
  }
  if (controls.update()) S.dirty = true;
  if (S.dirty) {
    updateWalkers(dt, animate);
    const d = camera.position.distanceTo(controls.target);
    smallMeshes.forEach(m => m.visible = d < 26);
    PEOPLE.all.forEach(m => m.visible = S.walkers);
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    layoutLabels();
    S.dirty = false;
  }
}
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.08, Math.max(0, (now - (lastT || now)) / 1000)); lastT = now;
  tick(dt);
}

function resize() {
  const w = glHost.clientWidth, h = glHost.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); labelRenderer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  if (S.mode === 'home' && !S.fly) { camera.position.copy(center).addScaledVector(HOME_DIR, homeDistance()); controls.target.copy(center); controls.update(); }
  applyLayout(); panelsDirty = true; ISLAND_LABELS.forEach(L => L.wFull = 0); S.dirty = true;
}

function showError(msg) {
  const box = $('loadErr'); box.hidden = false;
  box.textContent = tr('無法載入 3D 場景：', 'The 3D scene could not load: ') + msg + tr('。請確認瀏覽器支援 WebGL，並允許載入 cdn.jsdelivr.net 的程式庫後重新整理。', '. Check that WebGL is enabled and cdn.jsdelivr.net is reachable, then reload.');
  $('loadMsg').textContent = tr('載入失敗', 'Loading failed');
}

async function boot() {
  applyStaticLang();
  try {
    const [three, oc, css2d, rbg, bgu, sn] = await Promise.all([
      import('three'), import('three/addons/controls/OrbitControls.js'), import('three/addons/renderers/CSS2DRenderer.js'),
      import('three/addons/geometries/RoundedBoxGeometry.js'), import('three/addons/utils/BufferGeometryUtils.js'), import('three/addons/math/SimplexNoise.js')
    ]);
    THREE = three; OrbitControls = oc.OrbitControls; CSS2DRenderer = css2d.CSS2DRenderer; CSS2DObject = css2d.CSS2DObject;
    RoundedBoxGeometry = rbg.RoundedBoxGeometry; BGU = bgu; SimplexNoise = sn.SimplexNoise;
  } catch (e) { showError(tr('程式庫下載失敗', 'library download failed')); return; }
  try {
    initMath(); initApp();
    glHost = $('gl');
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error(tr('此瀏覽器未啟用 WebGL', 'WebGL is not available'));
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.4 : 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
    glHost.appendChild(renderer.domElement);
    labelRenderer = new CSS2DRenderer({ element: $('labels') });
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, .3, 320);
    buildGeometries();
    buildWorld();
    buildBackdrop();
    buildPeopleAndFlows();
    buildLabels();
    controls = new OrbitControls(camera, renderer.domElement);
    // 右鍵（觸控為雙指）沿地面平移；目標點限制在城市周圍，避免拖到看不見城市
    Object.assign(controls, { enableDamping: true, dampingFactor: .07, enablePan: true, screenSpacePanning: false, panSpeed: .9, minPolarAngle: 25 * DEG, maxPolarAngle: 70 * DEG, minDistance: 3, maxDistance: 70 });
    controls.addEventListener('start', () => { if (S.mode === 'home') S.mode = 'free'; });
    controls.addEventListener('change', () => {
      const dx = controls.target.x - center.x, dz = controls.target.z - center.z, d = Math.hypot(dx, dz), max = 16;
      if (d > max) {
        const k = max / d, nx = center.x + dx * k, nz = center.z + dz * k;
        camera.position.x += nx - controls.target.x; camera.position.z += nz - controls.target.z;
        controls.target.x = nx; controls.target.z = nz;
      }
      S.dirty = true;
    });
    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(HOME_DIR, 40);
    // reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    S.reduced = mq.matches;
    mq.addEventListener('change', e => { S.reduced = e.matches; FLOWLINES.forEach(t => t.material.uniforms.uTime.value = 0); S.dirty = true; });
    window.matchMedia('(max-width: 800px)').addEventListener('change', () => { applyLayout(); if (isMobile()) setSide(false); });
    bindUI(); applyLayout();
    if (isMobile()) setSide(false); else setSide(true);
    renderLogFilter(); renderLog();
    S.seg = currentSeg(); setTime(S.min, false); recolor(); renderSide();
    new ResizeObserver(resize).observe(glHost); resize();
    goHome(); if (S.reduced) { camera.position.copy(center).addScaledVector(HOME_DIR, homeDistance()); }
    tick(0);
    $('loader').classList.add('done'); setTimeout(() => { $('loader').hidden = true; }, 600);
    let seen = false; try { seen = localStorage.getItem('twse-city-help-v1') === '1'; } catch (e) { }
    if (!seen) $('help').hidden = false;
    window.__city = { S, step: (n = 1, dt = 1 / 30) => { for (let i = 0; i < n; i++) tick(dt); }, selectIsland, selectItem, selectFlow, selectWalker, setTime, goHome, target: () => controls.target.toArray().map(v => +v.toFixed(2)), info: () => ({ draws: renderer.info.render.calls, tris: renderer.info.render.triangles, walkers: WALKERS.length, kit: kitMeshes.length }) };
    requestAnimationFrame(loop);
  } catch (e) { console.error(e); showError(e && e.message ? e.message : String(e)); }
}
boot();
