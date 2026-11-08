/* ============================================================ duck level 3: real 3D run (three.js)
   The run logic (distance s, lane x, height y) lives in 05c_runner.js. Here the track becomes a 3D
   ribbon with curves, banking, hills and loops; the camera rides behind the duck. */
const R3 = { ok: false, inited: false, live: new Set(), chunks: new Map(), tex: {}, geo: {}, mat: {} };
const TRACK_PLAN = [
  ['straight', 70], ['curve', 130, 1], ['straight', 40], ['hill', 110, 0.17], ['curve', 140, -1], ['straight', 50],
  ['loop', 90], ['straight', 60], ['scurve', 170], ['straight', 40], ['hill', 120, 0.2], ['straight', 30], ['loop', 90],
  ['curve', 130, 1], ['straight', 50], ['curve', 120, -1], ['hill', 110, 0.15], ['straight', 40], ['loop', 90], ['scurve', 170],
];
const TRACK_EXTRA = [['straight', 80], ['scurve', 180, 0.6], ['straight', 60], ['curve', 160, 0.7], ['straight', 60], ['curve', 160, -0.7]];
function planRanges() {
  if (planRanges.cache) return planRanges.cache;
  let d = 0; const out = [];
  for (const s of TRACK_PLAN) { out.push([d, d + s[1], s[0]]); d += s[1]; }
  return (planRanges.cache = out);
}
function segAt(d) { for (const [a, b, t] of planRanges()) if (d >= a && d < b) return t; return 'straight'; }

/* ---------- track centreline, one sample per metre, extended on demand */
function trackNew() {
  const V = THREE.Vector3;
  return { P: [], F: [], U: [], R: [], seg: [], plan: TRACK_PLAN.slice(), extra: 0, cur: null, i: 0,
    p: new V(0, 0, 0), f: new V(0, 0, -1), u: new V(0, 1, 0), r: new V(1, 0, 0) };
}
function trackStep(T) {
  if (!T.cur || T.i >= T.cur[1]) { T.cur = T.plan.length ? T.plan.shift() : TRACK_EXTRA[T.extra++ % TRACK_EXTRA.length]; T.i = 0; }
  const [type, len, k] = T.cur, u01 = T.i / len;
  let yaw = 0, pitch = 0, bank = 0, side = 0;
  if (type === 'curve') { yaw = (k * 1.2 * (Math.PI / 2) * Math.sin(Math.PI * u01)) / len; bank = k * 0.3 * Math.sin(Math.PI * u01); }
  else if (type === 'scurve') { const a = k || 1; yaw = (a * 0.6 * Math.PI * Math.sin(2 * Math.PI * u01)) / len; bank = a * 0.24 * Math.sin(2 * Math.PI * u01); }
  else if (type === 'hill') pitch = (k * 2 * Math.PI * Math.cos(2 * Math.PI * u01)) / len;
  else if (type === 'loop') { pitch = (2 * Math.PI) / len; side = 9 / len; }
  const { f, u, r } = T;
  if (pitch) { const c = Math.cos(pitch), s = Math.sin(pitch), f2 = f.clone().multiplyScalar(c).addScaledVector(u, s); u.multiplyScalar(c).addScaledVector(f, -s); f.copy(f2); }
  if (yaw) { const c = Math.cos(yaw), s = Math.sin(yaw), f2 = f.clone().multiplyScalar(c).addScaledVector(r, s); r.multiplyScalar(c).addScaledVector(f, -s); f.copy(f2); }
  f.normalize(); r.crossVectors(f, u).normalize(); u.crossVectors(r, f).normalize();
  const cb = Math.cos(bank), sb = Math.sin(bank);
  T.P.push(T.p.clone()); T.F.push(f.clone());
  T.U.push(u.clone().multiplyScalar(cb).addScaledVector(r, sb));
  T.R.push(r.clone().multiplyScalar(cb).addScaledVector(u, -sb));
  T.seg.push(type);
  T.p.addScaledVector(f, 1).addScaledVector(r, side);
  T.i++;
}
function trackEnsure(T, n) { while (T.P.length < n + 2) trackStep(T); }
function frameAt(d) {
  const T = R3.track; d = Math.max(0, d); trackEnsure(T, Math.ceil(d) + 1);
  const i = Math.floor(d), a = d - i;
  const L = (A) => A[i].clone().lerp(A[i + 1], a);
  return { p: L(T.P), f: L(T.F).normalize(), u: L(T.U).normalize(), r: L(T.R).normalize() };
}
function trackPoint(d, x, h) { const F = frameAt(d); return F.p.addScaledVector(F.r, x).addScaledVector(F.u, h); }
const _m4 = () => new THREE.Matrix4();
function orient(obj, F) { obj.quaternion.setFromRotationMatrix(_m4().makeBasis(F.r, F.u, F.f.clone().negate())); }

/* ---------- textures drawn on canvases */
function canvasTex(w, h, draw, rep) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  return t;
}
function r3Textures() {
  const T = R3.tex;
  T.stripe = canvasTex(64, 128, (c, w, h) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h / 2); c.fillStyle = '#d9d9d9'; c.fillRect(0, h / 2, w, h / 2);
    c.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 60; i++) c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(w / 3 - 1, 0, 2, h); c.fillRect((2 * w) / 3 - 1, 0, 2, h);
  }, true);
  T.checker = canvasTex(64, 64, (c, w, h) => {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = (x + y) % 2 ? '#8a5226' : '#b06a32'; c.fillRect(x * 16, y * 16, 16, 16); }
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, 0, w, 3);
  }, true);
  T.curb = canvasTex(32, 32, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h / 2); c.fillStyle = '#e63946'; c.fillRect(0, h / 2, w, h / 2); }, true);
  T.barrier = canvasTex(128, 32, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#e63946'; for (let x = -32; x < w; x += 32) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + 16, 0); c.lineTo(x + 32, 0); c.lineTo(x + 16, h); c.fill(); } });
  T.bar = canvasTex(128, 32, (c, w, h) => { c.fillStyle = '#ffd43b'; c.fillRect(0, 0, w, h); c.fillStyle = '#221d2e'; for (let x = -32; x < w; x += 32) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + 16, 0); c.lineTo(x + 32, 0); c.lineTo(x + 16, h); c.fill(); } });
  T.dash = canvasTex(64, 128, (c, w, h) => {
    c.fillStyle = '#2a6bff'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffe14d'; c.lineWidth = 9; c.lineJoin = 'round';
    for (let y = 18; y < h; y += 40) { c.beginPath(); c.moveTo(10, y + 18); c.lineTo(w / 2, y); c.lineTo(w - 10, y + 18); c.stroke(); }
  });
  T.ball = canvasTex(128, 64, (c, w, h) => {
    c.fillStyle = '#ffd43b'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e8a800'; c.lineWidth = 6;
    for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 24, h / 2, x, h); c.stroke(); }
  }, true);
  T.cloud = canvasTex(256, 128, (c) => { c.fillStyle = '#fff'; for (const [x, y, r] of [[60, 80, 40], [110, 60, 52], [165, 70, 44], [205, 88, 32], [130, 92, 40]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } });
  T.sky = canvasTex(4, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1f78d6'); g.addColorStop(0.45, '#58b2f2'); g.addColorStop(0.5, '#cfeeff'); g.addColorStop(1, '#bde4f5'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
}
function spriteTex(w, h, draw) { return canvasTex(w, h, draw); }

/* ---------- shared meshes */
function r3Shared() {
  const G3 = R3.geo, M = R3.mat, T = R3.tex;
  M.road = new THREE.MeshLambertMaterial({ map: T.stripe, vertexColors: true, side: THREE.DoubleSide });
  M.skirt = new THREE.MeshLambertMaterial({ map: T.checker, side: THREE.DoubleSide });
  M.curb = new THREE.MeshLambertMaterial({ map: T.curb, vertexColors: true, side: THREE.DoubleSide });
  M.wood = new THREE.MeshLambertMaterial({ color: '#8b5a2b' });
  M.wood2 = new THREE.MeshLambertMaterial({ color: '#a26a35', side: THREE.DoubleSide });
  M.trunk = new THREE.MeshLambertMaterial({ color: '#9b6b3a' });
  M.leaf = new THREE.MeshLambertMaterial({ color: '#2fa84f', side: THREE.DoubleSide });
  M.leaf2 = new THREE.MeshLambertMaterial({ color: '#45c45f', side: THREE.DoubleSide });
  M.grassTop = new THREE.MeshLambertMaterial({ color: '#5cc94a' });
  M.white = new THREE.MeshPhongMaterial({ color: '#fffaf0', shininess: 40 });
  M.sleeve = new THREE.MeshLambertMaterial({ color: '#b97a46' });
  M.lid = new THREE.MeshPhongMaterial({ color: '#5a3a2a', shininess: 60 });
  M.metal = new THREE.MeshPhongMaterial({ color: '#d5dae2', shininess: 90, specular: '#ffffff' });
  M.dark = new THREE.MeshLambertMaterial({ color: '#3d4352' });
  M.orange = new THREE.MeshLambertMaterial({ color: '#ff7a1a' });
  M.red = new THREE.MeshPhongMaterial({ color: '#e63946', emissive: '#5a0a10', shininess: 60 });
  M.yellow = new THREE.MeshLambertMaterial({ color: '#ffd43b' });
  M.hole = new THREE.MeshBasicMaterial({ color: '#1b1820', side: THREE.DoubleSide });
  M.barrier = new THREE.MeshLambertMaterial({ map: T.barrier });
  M.bar = new THREE.MeshLambertMaterial({ map: T.bar });
  M.dash = new THREE.MeshBasicMaterial({ map: T.dash, side: THREE.DoubleSide });
  M.sauce = new THREE.MeshPhongMaterial({ color: '#fffaf0', shininess: 80 });
  M.shadow = new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.25, depthWrite: false });
  G3.box = new THREE.BoxGeometry(1, 1, 1);
  G3.cupBody = new THREE.CylinderGeometry(0.26, 0.19, 0.58, 16);
  G3.sleeve = new THREE.CylinderGeometry(0.245, 0.215, 0.22, 16);
  G3.lid = new THREE.CylinderGeometry(0.29, 0.29, 0.09, 16);
  G3.lidTop = new THREE.CylinderGeometry(0.16, 0.2, 0.07, 16);
  G3.spike = new THREE.ConeGeometry(0.13, 0.55, 8);
  G3.cone = new THREE.ConeGeometry(0.28, 0.8, 14);
  G3.sphere = new THREE.SphereGeometry(1, 18, 12);
  G3.disc = new THREE.CircleGeometry(1, 24);
  G3.cyl = new THREE.CylinderGeometry(1, 1, 1, 14);
  G3.trunk = new THREE.CylinderGeometry(0.12, 0.2, 1, 7);
  G3.leaf = new THREE.ConeGeometry(0.5, 2.2, 4, 1, true);
}

/* ---------- world chunks (100 m each) */
const SURF3 = {
  grass: { road: '#74cf4f', shoulder: '#4fae3a', curb: '#ffffff', fence: true },
  sand: { road: '#f2dca6', shoulder: '#ead08f', curb: '#f6e7c3', fence: false },
  ice: { road: '#cfeeff', shoulder: '#f4fbff', curb: '#9fd4f2', fence: true },
  road: { road: '#7d838f', shoulder: '#b9bec8', curb: '#ffffff', fence: true },
};
function ribbon(rows, mat) {
  // rows: [[ [x,y,z], ... ], ...] same length; colors optional per row
  const nr = rows.length, nc = rows[0].pts.length, pos = [], uv = [], col = [], idx = [];
  for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) {
    const v = rows[i].pts[j]; pos.push(v.x, v.y, v.z); uv.push(rows[i].us ? rows[i].us[j] : j / (nc - 1), rows[i].v);
    const c = rows[i].col || [1, 1, 1]; col.push(c[0], c[1], c[2]);
  }
  for (let i = 0; i < nr - 1; i++) for (let j = 0; j < nc - 1; j++) { const a = i * nc + j, b = a + 1, c2 = a + nc, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
const rgb = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
function palm(group, base, up, rnd) {
  const h = 3.2 + rnd() * 1.8, lean = (rnd() - 0.5) * 0.4;
  const trunk = new THREE.Mesh(R3.geo.trunk, R3.mat.trunk);
  trunk.scale.set(1, h, 1); trunk.position.copy(base).addScaledVector(up, h / 2); trunk.rotation.z = lean; group.add(trunk);
  const top = base.clone().addScaledVector(up, h).add(new THREE.Vector3(-Math.sin(lean) * h * 0.5, 0, 0));
  for (let i = 0; i < 6; i++) {
    const lf = new THREE.Mesh(R3.geo.leaf, i % 2 ? R3.mat.leaf : R3.mat.leaf2);
    lf.position.copy(top); lf.rotation.set(Math.PI / 2 - 0.5, (i / 6) * TAU, 0, 'YXZ'); lf.scale.set(0.9, 1, 0.25);
    lf.translateY(1.0); group.add(lf);
  }
}
function buildChunk(ci) {
  const T = R3.track, d0 = ci * 100, d1 = d0 + 100;
  trackEnsure(T, d1 + 2);
  const g = new THREE.Group(), H = RUN.HALF, rows = { road: [], curbL: [], curbR: [], shL: [], shR: [], skL: [], skR: [], railL: [], railR: [], railL2: [], railR2: [] };
  const rnd = mulberry(1000 + ci);
  for (let d = d0; d <= d1; d++) {
    const P = T.P[d], R = T.R[d], U = T.U[d], seg = T.seg[d], sf = SURF3[surfaceAt(d)], v = d / 8;
    const loop = seg === 'loop', sw = loop ? 0 : 7, at = (x, h) => P.clone().addScaledVector(R, x).addScaledVector(U, h);
    rows.road.push({ pts: [at(-H, 0), at(0, 0), at(H, 0)], us: [0, 0.5, 1], v, col: rgb(sf.road) });
    rows.curbL.push({ pts: [at(-H - 0.45, 0.06), at(-H, 0.06)], v: d / 2, col: rgb(sf.curb) });
    rows.curbR.push({ pts: [at(H, 0.06), at(H + 0.45, 0.06)], v: d / 2, col: rgb(sf.curb) });
    const sh = rgb(sf.shoulder);
    rows.shL.push({ pts: [at(-H - sw - 0.45, -0.25), at(-H - 0.45, -0.02)], v, col: sh });
    rows.shR.push({ pts: [at(H + 0.45, -0.02), at(H + 0.45 + sw, -0.25)], v, col: sh });
    rows.skL.push({ pts: [at(-H - sw - 0.45, -0.25), at(-H - sw - 0.45, -1.6)], us: [0, 1], v: d / 3 });
    rows.skR.push({ pts: [at(H + sw + 0.45, -0.25), at(H + sw + 0.45, -1.6)], us: [0, 1], v: d / 3 });
    for (const [key, x, h0, h1] of [['railL', -H - 0.55, 0.55, 0.72], ['railR', H + 0.55, 0.55, 0.72], ['railL2', -H - 0.55, 0.9, 1.05], ['railR2', H + 0.55, 0.9, 1.05]]) rows[key].push({ pts: [at(x, h0), at(x, h1)], v });
    // fence posts, palms, pillars
    if (sf.fence && d % 4 === 0) for (const s of [-1, 1]) { const post = new THREE.Mesh(R3.geo.box, R3.mat.wood); post.scale.set(0.16, 1.2, 0.16); post.position.copy(at(s * (H + 0.55), 0.55)); orient(post, { r: R, u: U, f: T.F[d] }); g.add(post); }
    if (!loop && d % 13 === 0 && rnd() < 0.8 && Math.abs(U.y) > 0.85) { const s = rnd() < 0.5 ? -1 : 1; palm(g, at(s * (H + 2 + rnd() * 4), -0.2), U, rnd); }
    if (!loop && d % 30 === 15 && P.y > -4) for (const s of [-1, 1]) { const base = at(s * (H + sw * 0.6), -1.6), hgt = base.y + 7.5; if (hgt > 0.5) { const pil = new THREE.Mesh(R3.geo.cyl, R3.mat.skirt); pil.scale.set(1.1, hgt, 1.1); pil.position.set(base.x, base.y - hgt / 2, base.z); g.add(pil); } }
  }
  g.add(ribbon(rows.road, R3.mat.road));
  for (const k of ['curbL', 'curbR']) g.add(ribbon(rows[k], R3.mat.curb));
  for (const k of ['shL', 'shR']) g.add(ribbon(rows[k], R3.mat.road));
  for (const k of ['skL', 'skR']) g.add(ribbon(rows[k], R3.mat.skirt));
  for (const k of ['railL', 'railR', 'railL2', 'railR2']) { const m = ribbon(rows[k], R3.mat.wood2); g.add(m); }
  // a distant checkered island with palms
  for (let k = 0; k < 2; k++) {
    const d = d0 + 20 + rnd() * 60, P = T.P[Math.floor(d)], R = T.R[Math.floor(d)].clone(); R.y = 0; R.normalize();
    const side = rnd() < 0.5 ? -1 : 1, off = 60 + rnd() * 90, r = 10 + rnd() * 16, h = 8 + rnd() * 22;
    const pos = P.clone().addScaledVector(R, side * off); pos.y = -7 + h / 2;
    const isl = new THREE.Mesh(R3.geo.cyl, R3.mat.skirt); isl.scale.set(r, h, r); isl.position.copy(pos); g.add(isl);
    const top = new THREE.Mesh(R3.geo.cyl, R3.mat.grassTop); top.scale.set(r * 1.05, 1.2, r * 1.05); top.position.set(pos.x, -7 + h + 0.5, pos.z); g.add(top);
    for (let q = 0; q < 2; q++) palm(g, new THREE.Vector3(pos.x + (rnd() - 0.5) * r, -7 + h + 1, pos.z + (rnd() - 0.5) * r), new THREE.Vector3(0, 1, 0), rnd);
  }
  return g;
}
function syncChunks(s) {
  const want = new Set();
  for (let ci = Math.max(0, Math.floor(s / 100) - 1); ci <= Math.floor(s / 100) + 2; ci++) want.add(ci);
  for (const [ci, grp] of R3.chunks) if (!want.has(ci)) {
    R3.scene.remove(grp);
    grp.traverse((o) => { if (o.geometry && !Object.values(R3.geo).includes(o.geometry)) o.geometry.dispose(); });
    R3.chunks.delete(ci);
  }
  for (const ci of want) if (!R3.chunks.has(ci)) { const grp = buildChunk(ci); R3.chunks.set(ci, grp); R3.scene.add(grp); }
}

/* ---------- the duck, seen from behind */
function buildDuck() {
  const M = R3.mat, G3 = R3.geo, duck = new THREE.Group(), body = new THREE.Group();
  const mat = (c) => new THREE.MeshPhongMaterial({ color: c, shininess: 25 });
  const yel = mat('#f6d64a'), yel2 = mat('#ecc93c'), hair = mat('#e6bf72'), hairDark = mat('#c99a4a'), orange = mat('#ff7a1a');
  const sph = (m, sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(G3.sphere, m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); body.add(o); return o; };
  sph(yel, 0.42, 0.44, 0.4, 0, 0.5, 0);
  sph(yel, 0.16, 0.12, 0.14, 0, 0.66, 0.36);
  sph(yel, 0.3, 0.3, 0.3, 0, 1.06, 0);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.33, 22, 14, 0, TAU, 0, 1.55), hair); cap.position.set(0, 1.1, 0.03); body.add(cap);
  for (let i = -2; i <= 2; i++) { const st = new THREE.Mesh(G3.box, hairDark); st.scale.set(0.015, 0.3, 0.02); st.position.set(i * 0.11, 0.98, 0.33 - Math.abs(i) * 0.04); st.rotation.y = i * 0.32; body.add(st); }
  const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.38, 0.34, 22, 1, true, -Math.PI / 2 - 0.5, Math.PI + 1.0), new THREE.MeshPhongMaterial({ color: '#e6bf72', side: THREE.DoubleSide })); bob.position.set(0, 0.95, 0.03); body.add(bob);
  const wings = [];
  for (const s of [-1, 1]) { const w = new THREE.Group(); const m = new THREE.Mesh(G3.sphere, yel2); m.scale.set(0.3, 0.1, 0.2); m.position.set(s * 0.25, 0, 0); w.add(m); w.position.set(s * 0.36, 0.62, 0); body.add(w); wings.push(w); }
  const feet = [];
  for (const s of [-1, 1]) { const f = new THREE.Mesh(G3.box, orange); f.scale.set(0.16, 0.07, 0.32); f.position.set(s * 0.16, 0.04, -0.06); body.add(f); feet.push(f); }
  const blade = new THREE.Mesh(G3.box, M.metal); blade.scale.set(0.05, 0.1, 0.48); blade.position.set(0.48, 0.55, -0.32); body.add(blade);
  const handle = new THREE.Mesh(G3.box, new THREE.MeshLambertMaterial({ color: '#7e4fa0' })); handle.scale.set(0.07, 0.1, 0.18); handle.position.set(0.48, 0.55, -0.02); body.add(handle);
  duck.add(body);
  const ball = new THREE.Group();
  const bm = new THREE.Mesh(G3.sphere, new THREE.MeshPhongMaterial({ map: R3.tex.ball, shininess: 60 })); bm.scale.setScalar(0.5); ball.add(bm);
  const aura = new THREE.Mesh(G3.sphere, new THREE.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); aura.scale.setScalar(0.85); ball.add(aura);
  ball.position.y = 0.5; duck.add(ball);
  const shadow = new THREE.Mesh(G3.disc, M.shadow); shadow.rotation.x = -Math.PI / 2; shadow.scale.setScalar(0.5);
  R3.duck = { root: duck, body, wings, feet, ball, ballMesh: bm, aura, shadow };
  R3.scene.add(duck); R3.scene.add(shadow);
}

/* ---------- objects on the track */
function makeObj(o) {
  const G3 = R3.geo, M = R3.mat, g = new THREE.Group(), add = (geo, mat, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m; };
  switch (o.type) {
    case 'cup': { const s = new THREE.Group(); const a = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; s.add(m); }; a(G3.cupBody, M.white, 0); a(G3.sleeve, M.sleeve, -0.02); a(G3.lid, M.lid, 0.32); a(G3.lidTop, M.lid, 0.39); s.scale.setScalar(1.1); g.add(s); g.userData.spin = s; break; }
    case 'barrier': add(G3.box, M.wood, 0.14, 0.95, 0.14, -0.7, 0.47, 0); add(G3.box, M.wood, 0.14, 0.95, 0.14, 0.7, 0.47, 0); add(G3.box, M.barrier, 1.8, 0.32, 0.12, 0, 0.82, 0); break;
    case 'spikes': add(G3.box, M.dark, 1.8, 0.12, 0.7, 0, 0.06, 0); for (let i = 0; i < 5; i++) add(G3.spike, M.metal, 1, 1, 1, -0.7 + i * 0.35, 0.38, 0); break;
    case 'cone': add(G3.cone, M.orange, 1, 1, 1, 0, 0.42, 0); add(G3.box, M.orange, 0.7, 0.06, 0.7, 0, 0.03, 0); add(G3.cyl, M.white, 0.2, 0.12, 0.2, 0, 0.5, 0); break;
    case 'bar': add(G3.box, M.dark, 0.12, 1.5, 0.12, -0.95, 0.75, 0); add(G3.box, M.dark, 0.12, 1.5, 0.12, 0.95, 0.75, 0); add(G3.box, M.bar, 2.0, 0.34, 0.14, 0, 1.25, 0); break;
    case 'hole': { const m = add(G3.box, M.hole, 1.8, 0.02, 2.0, 0, 0.02, 0); m.renderOrder = 1; break; }
    case 'dash': { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), M.dash); m.rotation.x = -Math.PI / 2; m.position.y = 0.04; g.add(m); break; }
    case 'spring': add(G3.cyl, M.yellow, 0.5, 0.1, 0.5, 0, 0.05, 0); add(G3.cyl, M.metal, 0.3, 0.4, 0.3, 0, 0.3, 0); add(G3.cyl, M.red, 0.5, 0.12, 0.5, 0, 0.56, 0); break;
    case 'puddle': { const m = add(G3.disc, M.sauce, 0.95, 0.6, 1, 0, 0.03, 0); m.rotation.x = -Math.PI / 2; const drop = add(G3.sphere, M.sauce, 0.28, 0.28, 0.28, 0, 2, 0); g.userData.drop = drop; g.userData.pool = m; break; }
    case 'red': add(G3.sphere, M.red, 0.33, 0.33, 0.33, 0, 0, 0); break;
    case 'pigeon': case 'crow': case 'pepper': {
      const key = o.type, tex = R3.tex['spr_' + key] || (R3.tex['spr_' + key] = spriteTex(160, 160, (c) => {
        c.translate(80, 84);
        if (key === 'pepper') { c.scale(2.2, 2.2); drawJalapeno(c); } else { c.scale(2.2, 2.2); ART[key](c, { seed: 1 }, 0.35); }
      }));
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex })); sp.scale.set(key === 'pepper' ? 1.1 : 1.6, key === 'pepper' ? 1.1 : 1.6, 1); sp.position.y = 0.5; g.add(sp); g.userData.sprite = sp;
      break;
    }
  }
  return g;
}
function placeObj(o) {
  const m = o.mesh, F = frameAt(o.d);
  let h = o.type === 'cup' || o.type === 'pigeon' || o.type === 'crow' || o.type === 'pepper' ? o.h : o.type === 'red' ? o.h : 0;
  m.position.copy(F.p).addScaledVector(F.r, o.x).addScaledVector(F.u, h);
  orient(m, F);
}
function r3SyncObjects(dt, t) {
  const R = G.run;
  for (const o of R3.live) {
    const gone = o.d < R.s - 8 || (o.dead && !(o.smashed > 0)) || !R.objs.includes(o);
    if (gone) { R3.scene.remove(o.mesh); o.mesh = null; R3.live.delete(o); }
  }
  for (let j = R.i; j < R.objs.length; j++) {
    const o = R.objs[j]; if (o.d - R.s > 140) break;
    if (o.dead && !(o.smashed > 0)) continue;
    if (!o.mesh) { o.mesh = makeObj(o); R3.scene.add(o.mesh); R3.live.add(o); placeObj(o); }
    const m = o.mesh;
    if (o.v || o.type === 'pepper' || o.type === 'puddle') placeObj(o);
    if (m.userData.spin) m.userData.spin.rotation.y = t * 3 + o.d;
    if (o.type === 'puddle') { const done = !(o.fall !== undefined && o.ft < 1); m.userData.pool.visible = done; m.userData.drop.visible = !done; if (!done) m.userData.drop.position.y = lerp(o.fall, 0, o.ft); }
    if (o.smashed > 0) { o.smashed -= dt; m.scale.setScalar(Math.max(0.01, o.smashed * 2)); m.position.addScaledVector(frameAt(o.d).u, dt * 6); }
  }
}

/* ---------- boss sprite (redrawn each frame from the 2D art) */
function r3Boss(t) {
  const R = G.run, B = R.boss;
  if (!B) { if (R3.boss) R3.boss.visible = false; return; }
  if (!R3.boss) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 512;
    R3.bossCv = cv; R3.bossTex = new THREE.CanvasTexture(cv);
    R3.boss = new THREE.Sprite(new THREE.SpriteMaterial({ map: R3.bossTex })); R3.boss.center.set(0.5, 0.02); R3.boss.scale.set(6, 6, 1);
    R3.scene.add(R3.boss);
  }
  const c = R3.bossCv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 512, 512);
  drawShawarma(c, 256, 500, 470, t, B); R3.bossTex.needsUpdate = true;
  R3.boss.visible = true;
  R3.boss.position.copy(trackPoint(R.s + B.z, B.x, B.h));
}

/* ---------- setup, per-frame update, projection */
function r3Init() {
  if (R3.inited) return R3.ok;
  R3.inited = true;
  if (typeof THREE === 'undefined') return (R3.ok = false);
  try {
    const cv = document.createElement('canvas'); cv.id = 'game3d';
    cv.style.position = 'absolute'; cv.style.display = 'none';
    stage.insertBefore(cv, canvas);
    R3.renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !isTouch, powerPreference: 'high-performance' });
    R3.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.25 : 1.5));
    R3.scene = new THREE.Scene();
    R3.scene.fog = new THREE.Fog('#cfeeff', 70, 300);
    R3.camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 900);
    R3.scene.add(new THREE.HemisphereLight('#e8f6ff', '#4f7a3a', 0.85));
    const sun = new THREE.DirectionalLight('#ffffff', 0.75); sun.position.set(-0.5, 1, 0.6); R3.scene.add(sun);
    r3Textures(); r3Shared();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 24, 16), new THREE.MeshBasicMaterial({ map: R3.tex.sky, side: THREE.BackSide, fog: false, depthWrite: false }));
    R3.sky = sky; R3.scene.add(sky);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshPhongMaterial({ color: '#2aa6d6', shininess: 90, specular: '#cfefff' }));
    water.rotation.x = -Math.PI / 2; water.position.y = -7; R3.water = water; R3.scene.add(water);
    R3.clouds = [];
    for (let i = 0; i < 14; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: R3.tex.cloud, fog: false, transparent: true, opacity: 0.95 })); const a = (i / 14) * TAU; sp.userData = { a, r: 380 + (i % 3) * 60, y: 70 + (i % 4) * 22 }; sp.scale.set(120, 60, 1); R3.clouds.push(sp); R3.scene.add(sp); }
    onResize.push(r3Resize); r3Resize();
    R3.ok = true;
  } catch (e) { console.warn('3D unavailable', e); R3.ok = false; }
  return R3.ok;
}
function r3Resize() {
  if (!R3.renderer) return;
  const cv = R3.renderer.domElement;
  cv.style.left = view.left + 'px'; cv.style.top = view.top + 'px';
  R3.renderer.setSize(view.cssW, view.cssH, true);
  R3.camera.aspect = SW / SH; R3.camera.updateProjectionMatrix();
}
function r3Reset() {
  for (const [, grp] of R3.chunks) { R3.scene.remove(grp); grp.traverse((o) => { if (o.geometry && !Object.values(R3.geo).includes(o.geometry)) o.geometry.dispose(); }); }
  R3.chunks.clear();
  for (const o of R3.live) { R3.scene.remove(o.mesh); o.mesh = null; }
  R3.live.clear();
  if (R3.duck) { R3.scene.remove(R3.duck.root); R3.scene.remove(R3.duck.shadow); }
  if (R3.boss) R3.boss.visible = false;
  R3.track = trackNew();
  buildDuck();
}
function r3Show(on) {
  if (!R3.renderer || R3.shown === on) return;
  R3.shown = on;
  R3.renderer.domElement.style.display = on ? 'block' : 'none';
  canvas.style.background = on ? 'transparent' : '';
}
function r3Frame(t) {
  const R = G.run, D = R3.duck, cam = R3.camera, dt = Math.min(0.05, Math.max(0, t - (R3.lastT || t))); R3.lastT = t;
  syncChunks(R.s);
  // duck
  const F = frameAt(R.s);
  D.root.position.copy(F.p).addScaledVector(F.r, R.x).addScaledVector(F.u, R.y);
  orient(D.root, F);
  const spin = R.boost > 0 || R.roll > 0 || R.slam;
  D.body.visible = !spin; D.ball.visible = spin;
  D.aura.visible = R.boost > 0;
  if (spin) { D.ballMesh.rotation.x -= dt * (R.boost > 0 ? 30 : 20); D.aura.scale.setScalar(0.85 + Math.sin(t * 30) * 0.06); }
  const air = R.y > 0.01, run = air ? 0 : Math.sin(t * (14 + R.speed * 0.25));
  D.feet[0].position.z = -0.06 + run * 0.18; D.feet[1].position.z = -0.06 - run * 0.18;
  D.feet[0].position.y = 0.04 + Math.max(0, run) * 0.12; D.feet[1].position.y = 0.04 + Math.max(0, -run) * 0.12;
  const flap = air ? Math.sin(t * 22) * 0.8 : run * 0.2;
  D.wings[0].rotation.z = 0.35 + flap; D.wings[1].rotation.z = -0.35 - flap;
  D.body.position.y = air ? 0 : Math.abs(run) * 0.05;
  D.root.visible = !(R.inv > 0 && Math.floor(R.inv * 14) % 2 === 0) && (G.player.alive || G.phaseT < 1.2);
  D.shadow.position.copy(F.p).addScaledVector(F.r, R.x).addScaledVector(F.u, 0.03);
  D.shadow.quaternion.copy(D.root.quaternion); D.shadow.rotateX(-Math.PI / 2);
  D.shadow.scale.setScalar(0.5 / (1 + R.y * 0.25));
  // camera behind the duck, following the road's up vector (it rolls through loops)
  const intro = R.phase === 'intro' ? easeInOut(clamp(R.t / 1.5, 0, 1)) : 1;
  const back = lerp(18, 6.6, intro), upH = lerp(14, 2.9, intro);
  const C = frameAt(R.s - back), L = frameAt(R.s + 7);
  R3.camUp = (R3.camUp || C.u.clone()).lerp(C.u, Math.min(1, dt * 6)).normalize();
  cam.position.copy(C.p).addScaledVector(C.r, R.camX * 0.85).addScaledVector(C.u, upH);
  cam.up.copy(R3.camUp);
  cam.lookAt(L.p.clone().addScaledVector(L.r, R.camX * 0.5).addScaledVector(L.u, 1.2));
  const fov = R.boost > 0 ? 80 : 62;
  if (Math.abs(cam.fov - fov) > 0.1) { cam.fov = lerp(cam.fov, fov, Math.min(1, dt * 5)); cam.updateProjectionMatrix(); }
  if (G.shake > 0.3 && !reducedMotion) cam.position.add(new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(G.shake * 0.012));
  R3.sky.position.copy(cam.position);
  R3.water.position.x = cam.position.x; R3.water.position.z = cam.position.z;
  for (const c of R3.clouds) { const u = c.userData; c.position.set(cam.position.x + Math.cos(u.a) * u.r, u.y, cam.position.z + Math.sin(u.a) * u.r); }
  r3SyncObjects(dt, t);
  r3Boss(t);
  R3.renderer.render(R3.scene, cam);
}
function runProj3(x, h, z) {
  const R = G.run, cam = R3.camera;
  const w = trackPoint(R.s + z - RUN.PZ, x, h), dist = w.distanceTo(cam.position), v = w.clone().project(cam);
  if (v.z > 1 || v.z < -1) return { sx: -9999, sy: -9999, k: 1 };
  return { sx: ((v.x + 1) / 2) * SW, sy: ((1 - v.y) / 2) * SH, k: SH / (2 * Math.tan((cam.fov * Math.PI) / 360) * Math.max(0.5, dist)) };
}

/* ---------- 2D overlay on top of the 3D view */
function drawSpeedLines(c, t) {
  const R = G.run; if (!(R.boost > 0)) return;
  c.save(); c.globalAlpha = Math.min(1, R.boost) * 0.7; c.strokeStyle = '#fff'; c.lineCap = 'round';
  const cx = SW / 2, cy = SH * 0.5, rnd = mulberry(Math.floor(t * 20));
  for (let i = 0; i < 26; i++) { const a = rnd() * TAU, r0 = 180 + rnd() * 200, r1 = r0 + 90 + rnd() * 160; c.lineWidth = 1.5 + rnd() * 3; c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.7); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.7); c.stroke(); }
  c.restore();
}
function renderRunner3D(c) {
  const R = G.run, t = G.bgT;
  if (R.end && R.end.t > 0.8) { r3Show(false); c.setTransform(view.px, 0, 0, view.px, 0, 0); drawRunEnd(c, t); return; }
  r3Show(true);
  r3Frame(t);
  c.setTransform(view.px, 0, 0, view.px, 0, 0);
  c.clearRect(0, 0, SW, SH);
  drawSpeedLines(c, t);
  if (R.target && !R.target.boss) { const o = R.target, q = runProj3(o.x, o.h + 0.5, o.d - R.s + RUN.PZ); drawReticle(c, q.sx, q.sy, Math.max(14, q.k * 0.7), t); }
  const B = R.boss;
  if (B) {
    const q = runProj3(B.x, B.h + 3, B.z + RUN.PZ);
    if (B.state === 'tired') {
      drawReticle(c, q.sx, q.sy, Math.max(30, q.k * 1.6), t);
      c.font = '30px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (Math.floor(t * 4) % 2) otext(c, isTouch ? 'ЖМИ «ПРЫЖОК»!' : 'ЖМИ ПРОБЕЛ!', q.sx, q.sy - Math.max(70, q.k * 4), '#ffe14d', 7);
    }
    if (B.speech) speechAt(c, B.speech.text, q.sx - 40, q.sy - Math.max(40, q.k * 3), B.speech.t, 2.3, -1);
  }
  if (R.streak) { const s = R.streak; c.globalAlpha = s.t / 0.25; line(c, [s.x0, s.y0, s.x1, s.y1], 14, '#ffe14d'); line(c, [s.x0, s.y0, s.x1, s.y1], 6, '#fff'); c.globalAlpha = 1; }
  drawParts(c);
  drawTexts(c);
  drawSplats(c);
  if (!R.end) { drawHUD(c, t); drawRunHud(c, t); drawBanners(c, t); }
  if (G.flash > 0) { c.globalAlpha = Math.min(0.55, G.flash); c.fillStyle = G.flashColor; c.fillRect(0, 0, SW, SH); c.globalAlpha = 1; }
  if (R.fade > 0) { c.fillStyle = 'rgba(255,255,255,' + R.fade.toFixed(3) + ')'; c.fillRect(0, 0, SW, SH); }
  if (R.end) drawRunEnd(c, t);
}
