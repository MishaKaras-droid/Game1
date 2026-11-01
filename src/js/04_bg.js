/* ============================================================ backgrounds (parallax) */
const BG = { ver: -1, mode: '', lines: [], bubbles: [], plankton: [], weeds: [] };

function mulberry(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function layer(w, h, draw) {
  const px = Math.min(view.px, 1.5);
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w * px)); cv.height = Math.max(1, Math.ceil(h * px));
  const c = cv.getContext('2d'); c.scale(px, px);
  draw(c, w, h);
  return { cv, w, h };
}
function tileLayer(c, L, scroll, y, alpha) {
  if (!L || alpha <= 0.001) return;
  c.globalAlpha = alpha;
  for (let x = -wrap(scroll, 0, L.w); x < W; x += L.w) c.drawImage(L.cv, x, y, L.w + 1, L.h);
  c.globalAlpha = 1;
}

/* ---------- sky pieces */
function drawCity(c, w, h, sun) {
  const R = mulberry(7);
  const base = sun ? '#715f92' : '#a9c4e0', win = sun ? '#5f4f7e' : '#d3e3f2', lit = '#ffcf70';
  const items = [];
  let x = 0;
  while (x < w - 40) { const bw = 52 + R() * 78; items.push({ type: 'panel', x, bw, bh: 70 + R() * 125, seed: (R() * 1e9) | 0 }); x += bw + 4 + R() * 16; }
  items.splice(5, 0, { type: 'tower', x: w * 0.4 }); items.push({ type: 'church', x: w * 0.77 });
  for (const off of [-w, 0, w]) {
    for (const it of items) {
      const X = it.x + off;
      if (X > w + 10 || X < -160) continue;
      if (it.type === 'panel') {
        const r2 = mulberry(it.seed);
        c.fillStyle = base; c.fillRect(X, h - it.bh, it.bw, it.bh);
        c.fillRect(X + it.bw * 0.3, h - it.bh - 8, it.bw * 0.22, 8);
        const cols = Math.floor((it.bw - 8) / 10), rows = Math.floor((it.bh - 12) / 12);
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          c.fillStyle = sun && r2() < 0.33 ? lit : win;
          c.fillRect(X + 6 + i * 10, h - it.bh + 9 + j * 12, 5, 6);
        }
      } else if (it.type === 'tower') {
        c.fillStyle = base;
        P(c); c.moveTo(X - 16, h); c.lineTo(X - 4, h - 150); c.lineTo(X + 4, h - 150); c.lineTo(X + 16, h); c.closePath(); c.fill();
        c.fillRect(X - 3, h - 222, 6, 80); P(c); ell(c, X, h - 168, 12, 6); c.fill(); c.fillRect(X - 1, h - 230, 2, 10);
        if (sun) { c.fillStyle = '#ff5a5a'; P(c); circ(c, X, h - 230, 2); c.fill(); }
      } else {
        c.fillStyle = base;
        c.fillRect(X - 22, h - 52, 44, 52); c.fillRect(X - 7, h - 70, 14, 18);
        P(c); c.moveTo(X - 9, h - 70); c.bezierCurveTo(X - 16, h - 82, X - 2, h - 90, X, h - 98); c.bezierCurveTo(X + 2, h - 90, X + 16, h - 82, X + 9, h - 70); c.closePath();
        c.fillStyle = sun ? '#ffcf70' : '#d6b55c'; c.fill();
        c.fillStyle = base; c.fillRect(X - 1, h - 108, 2, 11); c.fillRect(X - 4, h - 104, 8, 2);
        c.fillStyle = win; c.fillRect(X - 4, h - 40, 8, 14);
      }
    }
  }
}
function drawRoofs(c, w, h, sun) {
  const R = mulberry(11);
  const house = sun ? '#43385f' : '#5d86a8', roof = sun ? '#30294d' : '#456b8b';
  const tree = sun ? '#2d3a40' : '#3f8a58', tree2 = sun ? '#34444a' : '#4fa36a', trunk = sun ? '#22262b' : '#2f5d40';
  const win = sun ? '#ffcf70' : '#a9c8e2';
  const items = [];
  let x = 0;
  while (x < w - 30) {
    if (R() < 0.62) { const bw = 70 + R() * 70; items.push({ t: 'house', x, bw, bh: 38 + R() * 46, pitched: R() < 0.6, seed: (R() * 1e9) | 0 }); x += bw + 6; }
    else { items.push({ t: 'tree', x: x + 20, r: 16 + R() * 12, seed: (R() * 1e9) | 0 }); x += 44 + R() * 20; }
  }
  for (const off of [-w, 0, w]) for (const it of items) {
    const X = it.x + off;
    if (X > w + 10 || X < -180) continue;
    if (it.t === 'house') {
      const r2 = mulberry(it.seed), top = h - it.bh;
      c.fillStyle = house; c.fillRect(X, top, it.bw, it.bh);
      c.fillStyle = roof;
      if (it.pitched) { P(c); c.moveTo(X - 6, top); c.lineTo(X + it.bw / 2, top - 26); c.lineTo(X + it.bw + 6, top); c.closePath(); c.fill(); c.fillRect(X + it.bw * 0.68, top - 26, 9, 18); }
      else { c.fillRect(X - 3, top - 5, it.bw + 6, 6); c.fillRect(X + 10, top - 16, 2, 12); c.fillRect(X + 4, top - 16, 14, 2); }
      const n = Math.max(1, Math.floor(it.bw / 26));
      for (let i = 0; i < n; i++) { c.fillStyle = sun && r2() < 0.45 ? '#ffcf70' : (sun ? '#2b2445' : win); c.fillRect(X + 9 + i * 26, top + 10, 10, 13); }
    } else {
      c.fillStyle = trunk; c.fillRect(X - 3, h - 30, 6, 30);
      c.fillStyle = tree; P(c); circ(c, X, h - 34 - it.r * 0.6, it.r); circ(c, X - it.r * 0.7, h - 30, it.r * 0.75); circ(c, X + it.r * 0.7, h - 30, it.r * 0.75); c.fill();
      c.fillStyle = tree2; P(c); circ(c, X - it.r * 0.25, h - 40 - it.r * 0.7, it.r * 0.45); c.fill();
    }
  }
}
function drawCloudSprite(c, w, h, k) {
  const R = mulberry(31 + k);
  const pf = [];
  for (let i = 0; i < 6; i++) pf.push([30 + i * 34 + R() * 10, 62 - Math.sin((i / 5) * Math.PI) * 26 + R() * 6, 22 + Math.sin((i / 5) * Math.PI) * 18 + R() * 6]);
  c.fillStyle = '#ffffff';
  P(c); for (const [x, y, r] of pf) circ(c, x, y, r); c.fill();
  c.fillRect(20, 62, 200, 24);
  P(c); circ(c, 20, 74, 12); circ(c, 222, 74, 12); c.fill();
  c.fillStyle = 'rgba(120,150,190,0.16)'; c.fillRect(12, 76, 224, 10);
}

/* ---------- sea pieces */
function drawReef(c, w, h) {
  const R = mulberry(3);
  const pts = []; for (let x = 0; x <= w; x += 50) pts.push([x, h - 30 - R() * 80]);
  pts[pts.length - 1][1] = pts[0][1];
  for (const off of [-w, 0, w]) {
    c.fillStyle = '#0f5a77';
    P(c); c.moveTo(off, h);
    for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; c.quadraticCurveTo(off + x0 + 25, Math.min(y0, y1) - 20, off + x1, y1); }
    c.lineTo(off + w, h); c.closePath(); c.fill();
  }
  const R2 = mulberry(5);
  const corals = []; for (let i = 0; i < 9; i++) corals.push([R2() * w, 50 + R2() * 70, R2()]);
  for (const off of [-w, 0, w]) for (const [x, ch, k] of corals) {
    const X = x + off; if (X < -60 || X > w + 60) continue;
    c.strokeStyle = '#0c4c66'; c.lineCap = 'round';
    if (k < 0.5) {
      c.lineWidth = 7; P(c); c.moveTo(X, h - 40); c.lineTo(X, h - 40 - ch); c.moveTo(X, h - 40 - ch * 0.4); c.lineTo(X - 18, h - 40 - ch * 0.75); c.moveTo(X, h - 40 - ch * 0.55); c.lineTo(X + 16, h - 40 - ch * 0.9); c.stroke();
    } else {
      c.fillStyle = '#0c4c66'; P(c); ell(c, X, h - 40 - ch * 0.5, ch * 0.45, ch * 0.55); c.fill(); c.fillRect(X - 3, h - 44, 6, 10);
    }
  }
}
function drawSand(c, w, h) {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#e6c88f'); g.addColorStop(1, '#b8935b');
  c.fillStyle = g;
  P(c); c.moveTo(0, 22); for (let x = 0; x <= w; x += 20) c.lineTo(x, 22 + Math.sin((x / w) * TAU * 6) * 5 + Math.sin((x / w) * TAU * 11) * 2); c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill();
  const R = mulberry(9);
  for (let i = 0; i < 26; i++) { c.fillStyle = R() < 0.5 ? '#9c7c4c' : '#f3dcae'; P(c); ell(c, R() * w, 34 + R() * (h - 40), 2 + R() * 4, 1.5 + R() * 2.5); c.fill(); }
  for (let i = 0; i < 4; i++) {
    const x = 120 + i * 300 + R() * 80, y = 44 + R() * 16;
    if (i % 2) { P(c); starPath(c, x, y, 11, 5); fs(c, '#ff8a5c', 2, '#8a3f2a'); }
    else { P(c); c.moveTo(x - 10, y + 6); c.quadraticCurveTo(x, y - 14, x + 10, y + 6); c.closePath(); fs(c, '#ffd9e6', 2, '#a0627a'); line(c, [x, y + 5, x, y - 6], 1.2, '#a0627a'); line(c, [x - 4, y + 5, x - 3, y - 4], 1.2, '#a0627a'); line(c, [x + 4, y + 5, x + 3, y - 4], 1.2, '#a0627a'); }
  }
}

function ensureBg(mode) {
  if (BG.ver === view.version && BG.mode === mode) return;
  BG.ver = view.version; BG.mode = mode;
  if (mode === 'duck') {
    BG.cityDay = layer(1400, 230, (c, w, h) => drawCity(c, w, h, false));
    BG.citySun = layer(1400, 230, (c, w, h) => drawCity(c, w, h, true));
    BG.roofDay = layer(1100, 120, (c, w, h) => drawRoofs(c, w, h, false));
    BG.roofSun = layer(1100, 120, (c, w, h) => drawRoofs(c, w, h, true));
    BG.clouds = [0, 1, 2].map((i) => layer(250, 100, (c, w, h) => drawCloudSprite(c, w, h, i)));
    if (!BG.cl) { BG.cl = []; for (let i = 0; i < 7; i++) BG.cl.push({ x: rand(0, 1700), y: rand(20, 250), s: rand(0.55, 1.15), k: i % 3, sp: rand(10, 22) }); }
    if (!BG.lines.length) for (let i = 0; i < 9; i++) BG.lines.push({ x: rand(0, 1200), y: rand(20, 520), len: rand(40, 110), sp: rand(500, 900) });
    if (!BG.stars) { BG.stars = []; for (let i = 0; i < 90; i++) BG.stars.push({ x: rand(0, 1), y: rand(0, 1), r: rand(0.6, 2), sp: rand(6, 40), tw: rand(0, 6) }); }
    if (!BG.vlines) { BG.vlines = []; for (let i = 0; i < 12; i++) BG.vlines.push({ x: rand(0, 1170), y: rand(0, 540), len: rand(50, 130), sp: rand(600, 1000) }); }
  } else {
    BG.reef = layer(1300, 200, drawReef);
    BG.sand = layer(1200, 80, drawSand);
    if (!BG.bubbles.length) for (let i = 0; i < 16; i++) BG.bubbles.push({ x: rand(0, 1200), y: rand(0, 540), r: rand(2, 6), sp: rand(30, 70), ph: rand(0, 6) });
    if (!BG.plankton.length) for (let i = 0; i < 40; i++) BG.plankton.push({ x: rand(0, 1200), y: rand(0, 520), r: rand(0.8, 2), sp: rand(8, 30) });
    if (!BG.glows) { BG.glows = []; for (let i = 0; i < 26; i++) BG.glows.push({ x: rand(0, 1200), y: rand(30, 500), r: rand(1.5, 3.5), sp: rand(10, 35), ph: rand(0, 6) }); }
    if (!BG.weeds.length) for (let i = 0; i < 9; i++) BG.weeds.push({ x: i * 170 + rand(0, 90), h: rand(60, 150), ph: rand(0, 6), n: randi(2, 3), col: pick(['#2f9e5b', '#3fb36c', '#2a8a62']) });
  }
}

function updateBg(dt) {
  if (BG.mode === 'duck') {
    if (BG.vlines) for (const l of BG.vlines) { l.y += l.sp * dt; if (l.y > SH + l.len) { l.y = -l.len - rand(0, 200); l.x = rand(0, SW); } }
    for (const l of BG.lines) { l.x -= l.sp * dt; if (l.x < -l.len) { l.x = W + rand(0, 300); l.y = rand(20, 520); } }
  } else {
    for (const b of BG.bubbles) { b.y -= b.sp * dt; b.x -= 20 * dt; if (b.y < -10) { b.y = H + rand(0, 60); b.x = rand(0, W + 100); } if (b.x < -10) b.x += W + 20; }
    if (BG.glows) for (const g of BG.glows) { g.x -= g.sp * dt; if (g.x < -6) { g.x = SW + 6; g.y = rand(30, 500); } }
    for (const p of BG.plankton) { p.x -= p.sp * dt; if (p.x < -4) { p.x = W + 4; p.y = rand(0, 520); } }
  }
}

function drawSky(c, t, p) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix('#3f97ea', '#4a4a8f', p));
  g.addColorStop(0.55, mix('#8fd0ff', '#f0906a', p));
  g.addColorStop(1, mix('#dcf3ff', '#ffd59a', p));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const sx = W * 0.8, sy = lerp(H * 0.16, H * 0.6, p);
  glow(c, sx, sy, 150, 'rgba(255,246,210,A)', 0.75);
  P(c); circ(c, sx, sy, 34); c.fillStyle = mix('#fff8cc', '#ffb04d', p); c.fill();
  for (const cl of BG.cl) {
    const L = BG.clouds[cl.k], x = wrap(cl.x - t * cl.sp, -300, W + 200);
    c.globalAlpha = 0.85 - p * 0.25;
    c.drawImage(L.cv, x, cl.y, L.w * cl.s, L.h * cl.s);
  }
  c.globalAlpha = 1;
  tileLayer(c, BG.cityDay, t * 22, H - 262, 1);
  tileLayer(c, BG.citySun, t * 22, H - 262, p);
  tileLayer(c, BG.roofDay, t * 65, H - 120, 1);
  tileLayer(c, BG.roofSun, t * 65, H - 120, p);
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; c.lineCap = 'round';
  P(c); for (const l of BG.lines) { c.moveTo(l.x, l.y); c.lineTo(l.x + l.len, l.y); } c.stroke();
}

function drawSea(c, t, p) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix('#40c6d8', '#1b7a9c', p));
  g.addColorStop(0.6, mix('#1a7fae', '#0d3f73', p));
  g.addColorStop(1, mix('#0d3f73', '#071c3d', p));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // light rays from the surface
  for (let i = 0; i < 5; i++) {
    const x = wrap(i * 270 - t * 10, -200, W + 150), sw = Math.sin(t * 0.5 + i * 1.7) * 30;
    const rg = c.createLinearGradient(0, 0, 0, H * 0.9);
    rg.addColorStop(0, 'rgba(255,255,255,0.14)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = rg;
    P(c); c.moveTo(x - 24, 0); c.lineTo(x + 36, 0); c.lineTo(x + 150 + sw, H * 0.9); c.lineTo(x + 30 + sw, H * 0.9); c.closePath(); c.fill();
  }
  tileLayer(c, BG.reef, t * 20, H - 230, 0.85);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  P(c); for (const q of BG.plankton) circ(c, q.x, q.y, q.r); c.fill();
  tileLayer(c, BG.sand, t * 55, H - 62, 1);
  // swaying seaweed
  for (const wd of BG.weeds) {
    const X = wrap(wd.x - t * 55, -120, 1530 - 120);
    if (X > W + 60) continue;
    for (let k = 0; k < wd.n; k++) {
      const bx = X + k * 9, hh = wd.h * (1 - k * 0.18), sw = Math.sin(t * 1.6 + wd.ph + k) * 14;
      P(c); c.moveTo(bx - 4, H - 36); c.bezierCurveTo(bx - 4 + sw * 0.4, H - 36 - hh * 0.4, bx - 6 + sw, H - 36 - hh * 0.7, bx + sw, H - 36 - hh);
      c.bezierCurveTo(bx + 6 + sw, H - 36 - hh * 0.7, bx + 4 + sw * 0.4, H - 36 - hh * 0.4, bx + 4, H - 36); c.closePath();
      c.fillStyle = wd.col; c.fill();
    }
  }
  for (const b of BG.bubbles) {
    const x = b.x + Math.sin(t * 2 + b.ph) * 4;
    P(c); circ(c, x, b.y, b.r); c.strokeStyle = 'rgba(220,250,255,0.55)'; c.lineWidth = 1.4; c.stroke();
  }
  // water surface
  c.fillStyle = 'rgba(210,250,255,0.28)';
  P(c); c.moveTo(0, 0); for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, 9 + Math.sin(x * 0.03 + t * 2.2) * 4); c.lineTo(W + 20, 0); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2;
  P(c); for (let x = 0; x <= W + 20; x += 20) { const y = 9 + Math.sin(x * 0.03 + t * 2.2) * 4; if (x === 0) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
  if (p > 0) { c.fillStyle = 'rgba(2,10,32,' + (0.3 * p).toFixed(3) + ')'; c.fillRect(0, 0, W, H); }
}

/* ---------- level 2 skies */
function drawStars(c, t, a, scrollY) {
  for (const s of BG.stars) {
    const y = wrap(s.y * SH + (scrollY ? t * s.sp : 0), -4, SH + 4);
    c.globalAlpha = a * (0.55 + 0.45 * Math.sin(t * 2 + s.tw));
    c.fillStyle = '#fff'; c.fillRect(s.x * SW, y, s.r, s.r);
  }
  c.globalAlpha = 1;
}
// evening city, getting dark; the city falls away while the flight turns upwards
function drawSkyEvening(c, t, k, turn) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix('#4a4a8f', '#141a3d', k));
  g.addColorStop(0.55, mix('#f0906a', '#5a3f7a', k));
  g.addColorStop(1, mix('#ffd59a', '#e0805e', k));
  c.fillStyle = g; c.fillRect(-200, -200, W + 400, H + 400);
  drawStars(c, t, k, false);
  const mx = W * 0.82, my = lerp(110, 80, k);
  glow(c, mx, my, 90, 'rgba(255,250,230,A)', 0.35 * k);
  P(c); circ(c, mx, my, 26); c.fillStyle = 'rgba(255,248,225,' + (0.3 + 0.7 * k).toFixed(2) + ')'; c.fill();
  for (const cl of BG.cl) {
    const L = BG.clouds[cl.k], x = wrap(cl.x - t * cl.sp, -300, W + 200);
    c.globalAlpha = 0.55 - k * 0.25; c.drawImage(L.cv, x, cl.y, L.w * cl.s, L.h * cl.s);
  }
  c.globalAlpha = 1;
  const drop = easeInOut(turn) * 330;
  tileLayer(c, BG.citySun, t * 22, H - 262 + drop, 1);
  tileLayer(c, BG.roofSun, t * 65, H - 120 + drop * 1.6, 1);
  c.fillStyle = 'rgba(20,16,50,' + (0.35 * k).toFixed(3) + ')'; c.fillRect(-200, H - 270 + drop, W + 400, 300);
  const a = turn * Math.PI / 2;
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; c.lineCap = 'round';
  P(c);
  for (const l of BG.lines) {
    const cx = l.x + l.len / 2, dx = Math.cos(a) * l.len / 2, dy = Math.sin(a) * l.len / 2;
    c.moveTo(cx - dx, l.y - dy); c.lineTo(cx + dx, l.y + dy);
  }
  c.stroke();
}
// flying upwards: night sky, stars and clouds streaming down
function drawSkyUp(c, t, alpha) {
  c.save(); c.globalAlpha = alpha;
  const g = c.createLinearGradient(0, 0, 0, SH);
  g.addColorStop(0, '#070b26'); g.addColorStop(0.6, '#18215a'); g.addColorStop(1, '#3b3a7a');
  c.fillStyle = g; c.fillRect(0, 0, SW, SH);
  c.restore();
  drawStars(c, t, alpha, true);
  c.save(); c.globalAlpha = alpha;
  P(c); circ(c, SW * 0.82, 90, 30); c.fillStyle = '#fff8e1'; c.fill();
  P(c); circ(c, SW * 0.82 + 10, 84, 26); c.fillStyle = '#18215a'; c.fill();
  for (const cl of BG.cl) {
    const L = BG.clouds[cl.k], y = wrap(cl.y * 2 + t * cl.sp * 9, -160, SH + 60), x = wrap(cl.x * 0.7, -100, SW);
    c.globalAlpha = alpha * 0.13; c.drawImage(L.cv, x, y, L.w * cl.s * 1.3, L.h * cl.s * 1.3);
  }
  c.globalAlpha = alpha;
  c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 2; c.lineCap = 'round';
  P(c); for (const l of BG.vlines) { c.moveTo(l.x, l.y); c.lineTo(l.x, l.y + l.len); } c.stroke();
  c.restore();
}
function drawDeepGlow(c, t) {
  c.fillStyle = 'rgba(2,8,28,0.18)'; c.fillRect(0, 0, W, H);
  for (const g of BG.glows) {
    const a = 0.5 + 0.5 * Math.sin(t * 3 + g.ph);
    glow(c, g.x, g.y, g.r * 5, 'rgba(120,255,230,A)', 0.35 * a);
    P(c); circ(c, g.x, g.y, g.r); c.fillStyle = 'rgba(190,255,240,' + (0.5 + 0.5 * a).toFixed(2) + ')'; c.fill();
  }
}
