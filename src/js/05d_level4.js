/* ============================================================ level 4 (carp): pipes, oceanarium, kraken */
LEVEL_INFO[4] = { duck: null, fish: { name: 'Ожидается каточка', boss: 'kraken', song: 'sea3' } };
const LEVEL4_LEN = 116;
Object.assign(BOSS, { kraken: { name: 'Кракен', label: 'КРАКЕН', hp: 820, restX: 240, y: [170, 150], head: [10, -150] } });
Object.assign(BOSS_HIT, { kraken: [[40, -60, 92], [-70, 50, 52], [-170, 70, 40]] });
Object.assign(KINDS, {
  snail:    { hp: 3, r: 17, score: 120, speed: 25, move: 'snail', art: { duck: 'snail', fish: 'snail' } },
  crab:     { hp: 5, r: 20, score: 150, speed: 130, move: 'crab', art: { duck: 'crab', fish: 'crab' } },
  seal:     { hp: 9, r: 24, score: 220, speed: 120, move: 'seal', art: { duck: 'seal', fish: 'seal' } },
  arapaima: { hp: 18, r: 30, score: 400, speed: 140, move: 'dive', art: { duck: 'arapaima', fish: 'arapaima' } },
  octling:  { hp: 2, r: 14, score: 60, speed: 170, move: 'zig', art: { duck: 'octling', fish: 'octling' } },
});
const TANKS = [
  null,
  { name: 'АКУЛЫ', tint: '#1f7fd0', floor: '#d9c08a' },
  { name: 'КРАБЫ', tint: '#1aa6a0', floor: '#e8cf96' },
  { name: 'ПИРАНЬИ', tint: '#4f7a3a', floor: '#6b5a3a' },
  { name: 'МОРСКИЕ КОТИКИ', tint: '#6fb6e6', floor: '#eef6fb' },
  { name: 'АРАПАЙМЫ', tint: '#6b6a2a', floor: '#5a4a30' },
];
Object.assign(F, {
  snails(n, gap) { for (let i = 0; i < n; i++) later(i * (gap || 0.9), () => enemy('snail', W + 40, H / 2, { side: i % 2 ? -1 : 1 })); },
  crabs(n) { for (let i = 0; i < n; i++) later(i * 0.7, () => enemy('crab', W + 30, H - 82, { jumpT: rand(1, 2.5) })); },
  seals(ys) { ys.forEach((yf, i) => later(i * 0.6, () => enemy('seal', W + 40, yf * H, { amp: 60, freq: 1.8, phase: i }))); },
  arapaimas(ys) { ys.forEach((yf, i) => later(i * 0.8, () => enemy('arapaima', W + 60, yf * H))); },
});

const LEVEL4_FISH = [
  [2.0, () => F.line('grunt', 6, 0.3, 0.3)],
  [4.0, () => F.swarm(3, 0.7)],
  [6.0, () => F.carrier('power', 0.5)],
  [8.0, () => F.sine('weaver', 7, 0.5)],
  [10.5, () => F.shooters([0.3, 0.7])],
  [13.0, () => F.health(0.5)],
  [15.5, () => startPipe()],
  [22.0, () => F.snails(3)],
  [25.0, () => F.tpick(G.M.heal)],
  [26.5, () => F.snails(4, 0.7)],
  [30.0, () => F.snails(2)],
  [35.5, () => F.rocks([-30])],
  [37.5, () => F.snails(2, 0.6)],
  [39.0, () => F.rocks([30])],
  [41.0, () => F.tpick(G.M.heal)],
  [42.5, () => F.rocks([0])],
  [44.0, () => F.snails(2, 0.6)],
  [46.0, () => F.rocks([-28])],
  [50.0, () => startTank(1)],
  [51.5, () => F.divers([0.25, 0.5, 0.75])],
  [54.5, () => F.divers([0.3, 0.7], 0.4)],
  [57.0, () => F.divers([0.2, 0.5, 0.8], 0.35)],
  [59.0, () => F.health(0.5)],
  [61.0, () => startTank(2)],
  [62.0, () => F.crabs(3)],
  [65.0, () => F.crabs(3)],
  [67.0, () => F.carrier('power', 0.4)],
  [68.5, () => F.crabs(4)],
  [72.0, () => startTank(3)],
  [73.0, () => F.line('grunt', 6, 0.3, 0.28)],
  [74.5, () => F.line('grunt', 6, 0.7, 0.28)],
  [76.5, () => F.vee('grunt', 7, 0.5)],
  [79.0, () => F.line('grunt', 8, 0.5, 0.22)],
  [81.0, () => F.health(0.4)],
  [83.0, () => startTank(4)],
  [84.0, () => F.seals([0.3, 0.7])],
  [87.5, () => F.seals([0.2, 0.5, 0.8])],
  [91.0, () => F.seals([0.4, 0.6])],
  [94.0, () => startTank(5)],
  [95.0, () => F.arapaimas([0.5])],
  [98.0, () => F.arapaimas([0.3, 0.7])],
  [101.5, () => F.arapaimas([0.25, 0.75])],
  [103.0, () => { F.health(0.5); F.carrier('charm', 0.3); }],
  [106.0, () => startPortal('ocean')],
  [111.0, () => F.line('grunt', 5, 0.3)],
  [112.5, () => F.carrier('bomb', 0.6)],
];

/* ---------- the pipe: a wall with an opening, snails on the walls, then it narrows and squeezes */
function startPipe() {
  startTunnel({ len: 6200, speed: 220, style: 'pipe', safe: true, ramp: 140, gBase: 150, amp: 0, squeeze: true, sqFrom: 2550, sg: 128, quiet: true });
  banner('СТЕНА!', 'Заплывай в трубу', 2.6);
  sfx('charge');
}
function sqActive() {
  const T = G && G.tunnel;
  return !!(T && T.squeeze && (!T.sqFrom || tunScroll() + G.player.x - T.u0 > T.sqFrom));
}
MOVES.snail = (e, dt) => {
  const T = G.tunnel;
  e.x -= ((T ? T.speed : 200) + e.speed) * dt;
  const a = tunAt(e.x);
  e.y = a ? a.c + e.side * (a.g - 17) : e.y;
  e.fireT = (e.fireT === undefined ? rand(0.6, 1.4) : e.fireT) - dt;
  if (e.fireT <= 0 && e.x < W - 40 && e.x > heroHit().x + 60) { e.fireT = 1.8; ebullet(e.x - 10, e.y - e.side * 8, aimAt(e.x, e.y), 170, { col: '#9be15d', r: 7 }); sfx('bubble'); }
};
MOVES.crab = (e, dt) => {
  e.x -= e.speed * dt;
  e.jumpT -= dt;
  if (e.vy !== undefined && e.vy !== 0) { e.vy += 900 * dt; e.y += e.vy * dt; if (e.y >= H - 82) { e.y = H - 82; e.vy = 0; } }
  if (e.jumpT <= 0) {
    e.jumpT = rand(1.8, 2.6);
    if (Math.random() < 0.5) e.vy = -rand(420, 560);
    else spread(e.x, e.y - 14, 3, 0.18, 200, { col: '#ff7a5c', r: 6 });
  }
};
MOVES.seal = (e, dt) => {
  e.x -= (e.x > W * 0.62 ? e.speed : 30) * dt;
  e.y = e.baseY + Math.sin(e.age * e.freq + e.phase) * e.amp;
  e.rot = Math.cos(e.age * e.freq + e.phase) * 0.25;
  e.throwT = (e.throwT === undefined ? 1 : e.throwT) - dt;
  if (e.throwT <= 0 && e.x < W - 30) { e.throwT = 1.9; ebullet(e.x - 20, e.y - 20, aimAt(e.x, e.y) - 0.25, 230, { type: 'ball', r: 11, spin: 6, grav: 120 }); sfx('throw'); }
  if (e.age > 9) e.x -= 200 * dt;
};

/* ---------- oceanarium */
function startTank(i) {
  G.aqua = { i, t: 0 };
  G.aquaWall = { x: W + 60 };
  banner('АКВАРИУМ ' + i, TANKS[i].name, 2.4);
  if (i === 1) later(0.1, () => floatText(W / 2, 130, 'ОКЕАНАРИУМ', '#7ee7f2', 26));
  sfx('wave');
}
function updateLevel4(dt) {
  const B0 = G.boss;
  if (B0 && B0.kind === 'kraken' && B0.vlash && B0.vlash.phase === 'hit') { const h = heroHit(); if (Math.abs(h.x - B0.vlash.x) < 30) hurtPlayer(); }
  if (G.level !== 4) return;
  const T = G.tunnel;
  if (T && T.sqFrom && !T.sqHint && sqActive()) { T.sqHint = true; banner('УЗКАЯ ТРУБА!', isTouch ? 'Жми по экрану — пузыри раздвинут стены' : 'Кликай или жми Пробел — пузыри раздвинут стены', 3); sfx('charge'); }
  if (G.aqua) G.aqua.t += dt;
  if (G.aquaWall) { G.aquaWall.x -= 300 * dt; if (G.aquaWall.x < -120) G.aquaWall = null; }
  if (G.megaCameo) { G.megaCameo.t += dt; G.megaCameo.x -= 260 * dt; }
}

/* ---------- kraken */
const KA = {
  *octlings(b) {
    say(b, pick(['Детки, на абордаж!', 'Осьминожки, в атаку!']));
    b.mouth = 1;
    for (let k = 0; k < (b.phase2 ? 6 : 4); k++) { const q = bp(b, -40, 70); enemy('octling', q.x, q.y + rand(-40, 40)); sfx('bubble'); yield* wait(0.3); }
    b.mouth = 0; yield* wait(0.6);
  },
  *lash(b) { yield* QA.lash(b); },
  *vgrab(b) {
    say(b, pick(['Получай по плавникам!', 'Щупальцем сверху!']));
    for (let k = 0; k < (b.phase2 ? 2 : 1); k++) {
      b.vlash = { x: clamp(heroHit().x, 60, W * 0.7), top: Math.random() < 0.5, phase: 'warn' }; sfx('charge');
      yield* wait(0.75);
      b.vlash.phase = 'hit'; sfx('swoosh'); G.shake = Math.max(G.shake, 8);
      yield* wait(0.45);
      b.vlash = null; yield* wait(0.2);
    }
  },
  *whirl(b) {
    say(b, 'Водоворот! На абордаж!');
    b.mouth = 1; sfx('suck');
    for (let t = 0; t < 2.6;) {
      const dt = yield; t += dt;
      const m = bp(b, -40, 30); G.suck = { x: m.x, y: m.y, t: 0.15 };
      if (Math.random() < 0.6) { const x = m.x - rand(150, 500), y = m.y + rand(-170, 170), d = Math.hypot(m.x - x, m.y - y); part({ type: 'dot', x, y, vx: ((m.x - x) / d) * 420, vy: ((m.y - y) / d) * 420, r: rand(1.5, 3), life: d / 420, col: 'rgba(190,255,190,0.8)' }); }
      if (b.phase2 && Math.random() < dt * 2) ebullet(m.x, m.y, aimAt(m.x, m.y) + rand(-0.7, 0.7), 160, { type: 'ink', r: 8 });
    }
    b.mouth = 0;
  },
  *ink(b) { yield* QA.ink(b); },
};
function* krakenBrain(b) {
  yield* moveTo(b, W - 240, H * 0.5, 2.6);
  b.vul = true;
  say(b, 'НА АБОРДАЖ!');
  yield* wait(1.3);
  const list = ['octlings', 'vgrab', 'lash', 'whirl', 'ink'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(220, 260), bossY(b), b.phase2 ? 0.7 : 1.0);
    yield* KA[list[i++ % list.length]](b);
    if (Math.random() < 0.35) say(b, pick(['На абордаж!', 'Получай по плавникам!']));
    yield* wait((b.phase2 ? 0.45 : 0.8) / G.lvlDiff);
  }
}

/* ============================================================ level 4 art */
Object.assign(ART, {
  snail(c, e, t) {
    if (e.side < 0) c.scale(1, -1);
    const s = Math.sin(t * 4 + e.seed) * 2;
    P(c); c.moveTo(-26, 14); c.quadraticCurveTo(-30, 0, -20, -2); c.lineTo(20, 6); c.quadraticCurveTo(26, 14, 18, 16); c.closePath(); fs(c, '#c7b28a', 2.5);
    tube(c, [-20, 0, -28, -16 + s], 2, '#c7b28a'); tube(c, [-14, 0, -18, -18 - s], 2, '#c7b28a');
    P(c); circ(c, -28, -17 + s, 3); fs(c, INK, 0); P(c); circ(c, -18, -19 - s, 3); fs(c, INK, 0);
    P(c); circ(c, 4, -6, 15); fs(c, '#b5652f', 3);
    P(c); c.arc(4, -6, 10, 0, Math.PI * 1.6); c.lineWidth = 3; c.strokeStyle = '#7a3d18'; c.stroke();
    P(c); c.arc(4, -6, 5, Math.PI, Math.PI * 2.6); c.stroke();
  },
  crab(c, e, t) {
    const w = Math.sin(t * 12 + e.seed);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) tube(c, [s * (6 + k * 6), 6, s * (16 + k * 7), 14 + w * s * 2, s * (20 + k * 7), 22], 2.2, '#d9472b');
    for (const s of [-1, 1]) { tube(c, [s * 14, -4, s * 24, -16], 3, '#d9472b'); P(c); ell(c, s * 28, -22, 9, 7, s * 0.5); fs(c, '#ff6a4a', 2.5); line(c, [s * 28, -22, s * 36, -28 + w * 3], 2.5); }
    P(c); ell(c, 0, 0, 22, 14); fs(c, '#ff6a4a', 3);
    tube(c, [-6, -10, -8, -20], 2, '#d9472b'); tube(c, [6, -10, 8, -20], 2, '#d9472b');
    eye(c, -8, -22, 4, -0.2, 0.1, 1.2); eye(c, 8, -22, 4, -0.2, 0.1, -1.2);
  },
  seal(c, e, t) {
    const f = Math.sin(t * 8 + e.seed);
    P(c); c.moveTo(24, 0); c.lineTo(42, -10 + f * 4); c.lineTo(40, 10 + f * 4); c.closePath(); fs(c, '#4a4f5c', 2.5);
    P(c); ell(c, 0, 0, 28, 15); fs(c, '#5d6475', 3);
    P(c); ell(c, 2, 6, 20, 7); c.fillStyle = '#7c8496'; c.fill();
    P(c); circ(c, -24, -6, 12); fs(c, '#5d6475', 3);
    P(c); ell(c, -34, -2, 6, 4); fs(c, '#6f7788', 2);
    P(c); circ(c, -38, -4, 2); c.fillStyle = INK; c.fill();
    for (const k of [-1, 1]) line(c, [-36, -1, -46, -1 + k * 4], 1.2);
    eye(c, -26, -10, 3.4, -0.3, 0.1, 1);
    P(c); ell(c, -4, 14, 9, 4, 0.5 + f * 0.2); fs(c, '#4a4f5c', 2);
  },
  arapaima(c, e, t) {
    const w = Math.sin(t * 6 + e.seed);
    c.save(); c.translate(54, 0); c.rotate(w * 0.2);
    P(c); c.moveTo(0, -6); c.quadraticCurveTo(22, -24, 30, -2); c.quadraticCurveTo(22, 22, 0, 6); c.closePath(); fs(c, '#c0392b', 3); c.restore();
    P(c); c.moveTo(-60, 2); c.quadraticCurveTo(-50, -20, -10, -20); c.quadraticCurveTo(40, -18, 58, -4); c.lineTo(58, 6); c.quadraticCurveTo(40, 18, -10, 18); c.quadraticCurveTo(-50, 18, -60, 2); c.closePath();
    fs(c, '#6b7a4a', 3);
    c.save(); P(c); c.rect(10, -30, 50, 60); c.clip(); P(c); c.moveTo(-60, 2); c.quadraticCurveTo(-50, -20, -10, -20); c.quadraticCurveTo(40, -18, 58, -4); c.lineTo(58, 6); c.quadraticCurveTo(40, 18, -10, 18); c.quadraticCurveTo(-50, 18, -60, 2); c.closePath(); c.fillStyle = 'rgba(200,50,40,0.55)'; c.fill(); c.restore();
    c.fillStyle = 'rgba(40,50,25,0.35)'; for (let k = 0; k < 6; k++) { P(c); ell(c, -30 + k * 13, -4, 5, 7); c.fill(); }
    P(c); c.moveTo(20, -16); c.lineTo(48, -16); c.lineTo(52, -6); c.closePath(); fs(c, '#4f5a35', 2);
    P(c); c.moveTo(-58, 4); c.lineTo(-46, 6); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    eye(c, -46, -6, 4, -0.3, 0.1, 1.3);
  },
  octling(c, e, t) {
    for (let i = 0; i < 4; i++) { const x0 = -9 + i * 6; tube(c, [x0, 4, x0 + Math.sin(t * 8 + i) * 4, 13, x0 + 2, 20], 2.5, '#4fbf5f'); }
    P(c); ell(c, 0, -4, 13, 12); fs(c, '#5fd36f', 2.5);
    eye(c, -5, -4, 3.4, -0.2, 0.1, 1.1); eye(c, 5, -4, 3.4, -0.2, 0.1, -1.1);
  },
});
// a tapered tentacle along a curling spine, suckers on the underside
function tentacle(c, x0, y0, ang, len, w0, ph, col, curl) {
  const N = 16, pts = [];
  let x = x0, y = y0, a = ang;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    pts.push([x, y, Math.max(1.5, w0 * Math.pow(1 - u, 0.9)), a]);
    a += (Math.sin(ph + u * 4) * 0.12 + curl * u * u * 0.5);
    x += Math.cos(a) * len / N; y += Math.sin(a) * len / N;
  }
  P(c);
  pts.forEach(([px, py, w, aa], i) => { const nx = -Math.sin(aa), ny = Math.cos(aa); if (i) c.lineTo(px + nx * w / 2, py + ny * w / 2); else c.moveTo(px + nx * w / 2, py + ny * w / 2); });
  for (let i = pts.length - 1; i >= 0; i--) { const [px, py, w, aa] = pts[i]; c.lineTo(px + Math.sin(aa) * w / 2, py - Math.cos(aa) * w / 2); }
  c.closePath(); fs(c, col, 3);
  c.fillStyle = '#c9f2b0';
  for (let i = 2; i < N - 1; i += 2) { const [px, py, w, aa] = pts[i]; P(c); circ(c, px - Math.sin(aa) * w * 0.28, py + Math.cos(aa) * w * 0.28, Math.max(1.5, w * 0.13)); c.fill(); }
}
function drawKraken(c, b, t) {
  const angry = b.phase2, skin = angry ? '#3fae4a' : '#3d9a52', dark = angry ? '#2a7a34' : '#2b7040', m = b.mouth || 0;
  // back tentacles fan out down and to the left
  for (let i = 0; i < 6; i++) {
    const ang = Math.PI * (0.55 + i * 0.09);
    tentacle(c, 10 + i * 18, 30, ang, 190 + (i % 3) * 30, 34, t * 2.4 + i * 1.3, i % 2 ? dark : skin, i % 2 ? -1 : 1);
  }
  // mantle (head)
  P(c); c.moveTo(-50, 30); c.bezierCurveTo(-90, -120, 60, -230, 150, -110); c.bezierCurveTo(190, -50, 140, 40, 90, 50); c.quadraticCurveTo(20, 70, -50, 30); c.closePath();
  fs(c, skin, 4.5);
  c.fillStyle = dark; for (const [x, y, r] of [[60, -140, 12], [100, -90, 9], [20, -100, 8], [120, -40, 7], [-10, -40, 6]]) { P(c); circ(c, x, y, r); c.fill(); }
  P(c); ell(c, 30, -170, 40, 14, -0.5); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fill();
  P(c); ell(c, -40, 34, 14 + m * 10, 8 + m * 14); fs(c, '#2b1a14', 3);
  for (const [ex, ey, r] of [[-20, -30, 20], [40, -40, 16]]) {
    P(c); circ(c, ex, ey, r); fs(c, '#ffe14d', 3.5);
    P(c); ell(c, ex - 3, ey, r * 0.18, r * 0.75); c.fillStyle = INK; c.fill();
    line(c, [ex - r * 1.2, ey - r * (angry ? 1.4 : 1.2), ex + r * 0.9, ey - r * 0.9], 5);
  }
  // two front tentacles reaching towards the carp
  tentacle(c, -30, 46, Math.PI * 0.95, 230, 30, t * 3, skin, 1.4);
  tentacle(c, 20, 52, Math.PI * 0.8, 210, 28, t * 3 + 2, skin, -1.2);
}
function drawVLash(c, b, t) {
  const L = b.vlash; if (!L) return;
  if (L.phase === 'warn') { c.save(); c.globalAlpha = 0.35 + 0.3 * Math.sin(t * 30); c.strokeStyle = '#ff3d5a'; c.setLineDash([16, 10]); c.lineWidth = 6; P(c); c.moveTo(L.x, 0); c.lineTo(L.x, H); c.stroke(); c.restore(); return; }
  const pts = []; for (let y = -20; y <= H + 20; y += 30) pts.push(L.x + Math.sin(y * 0.05 + t * 20) * 6, L.top ? y : H - y);
  tube(c, pts, 22, '#3d9a52');
  c.fillStyle = '#c9f2b0'; for (let y = 10; y < H; y += 34) { P(c); circ(c, L.x + 7, L.top ? y : H - y, 4); c.fill(); }
}
function drawAquarium(c, t) {
  const A = G.aqua; if (!A || G.dark) return;
  const T = TANKS[A.i];
  c.save();
  c.globalAlpha = 0.3; c.fillStyle = T.tint; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
  // gravel and decor
  c.fillStyle = T.floor; P(c); c.moveTo(0, H - 46); for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, H - 46 + Math.sin(x * 0.05) * 3); c.lineTo(W + 20, H); c.lineTo(0, H); c.closePath(); c.fill();
  const off = (t * 60) % 120;
  for (let x = -off; x < W + 120; x += 120) {
    c.fillStyle = 'rgba(0,0,0,0.12)'; P(c); circ(c, x + 20, H - 30, 6); circ(c, x + 70, H - 22, 5); circ(c, x + 100, H - 36, 4); c.fill();
  }
  const dx = W - ((t * 40) % (W + 300));
  if (A.i === 1) { P(c); c.rect(dx, H - 140, 70, 96); c.rect(dx - 10, H - 160, 22, 30); c.rect(dx + 58, H - 160, 22, 30); fs(c, '#b5a07a', 3); P(c); c.rect(dx + 24, H - 90, 22, 46); c.fillStyle = '#3a2f22'; c.fill(); }
  if (A.i === 3 || A.i === 5) { tube(c, [dx, H - 46, dx + 40, H - 110, dx + 120, H - 130, dx + 160, H - 90], 12, '#6b4a2b'); }
  if (A.i === 4) { P(c); c.moveTo(dx, H - 46); c.lineTo(dx + 50, H - 120); c.lineTo(dx + 110, H - 46); c.closePath(); fs(c, '#f4fbff', 3); }
  // glass reflections and the rim on top
  c.fillStyle = 'rgba(255,255,255,0.06)';
  for (const x of [W * 0.15, W * 0.55, W * 0.82]) { P(c); c.moveTo(x, 0); c.lineTo(x + 60, 0); c.lineTo(x - 140, H); c.lineTo(x - 200, H); c.closePath(); c.fill(); }
  P(c); c.rect(0, 0, W, 16); fs(c, '#8a95a5', 0);
  c.font = '900 13px ' + FONT_UI; c.textAlign = 'center'; c.textBaseline = 'middle';
  const label = 'АКВАРИУМ ' + A.i + ' · ' + T.name, lw = c.measureText(label).width + 28;
  P(c); rr(c, W - 82 - lw, 22, lw, 26, 6); fs(c, '#fff6e5', 2.5);
  c.fillStyle = INK; c.fillText(label, W - 82 - lw / 2, 36);
  c.restore();
}
function drawAquaWall(c) {
  const Wl = G.aquaWall; if (!Wl) return;
  c.save();
  c.fillStyle = 'rgba(200,235,255,0.35)'; c.fillRect(Wl.x - 16, 0, 32, H);
  c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(Wl.x - 10, 0, 4, H);
  P(c); c.rect(Wl.x - 22, 0, 8, H); c.rect(Wl.x + 14, 0, 8, H); fs(c, '#8a95a5', 2);
  for (let y = 30; y < H; y += 60) { P(c); circ(c, Wl.x - 18, y, 2.5); circ(c, Wl.x + 18, y, 2.5); c.fillStyle = INK; c.fill(); }
  c.restore();
}
function drawMegaCameo(c, t) {
  const m = G.megaCameo; if (!m) return;
  c.save(); c.translate(m.x, m.y + Math.sin(t * 3) * 8); c.scale(0.42, 0.42);
  drawMega(c, { mouth: 0.4 + Math.sin(t * 8) * 0.4 }, t); c.restore();
}
function drawL4World(c, t) {
  if (G.boss && G.boss.vlash && G.level !== 4) drawVLash(c, G.boss, t);
  if (G.level !== 4) return;
  drawAquaWall(c);
  drawMegaCameo(c, t);
  if (G.boss && G.boss.vlash) drawVLash(c, G.boss, t);
}
function drawL4Speech(c) {
  const m = G.megaCameo;
  if (m && m.t > 0.4 && m.t < 3.2) { const q = toScreen(m.x, m.y); speechAt(c, 'Кракен, на помощь! ДОН-ДОН!', q.x - 60, q.y - 30, 3.2 - m.t, 2.8, -1); }
}
// pipe-style walls for drawTunnel
function drawPipeWalls(c, top, bot) {
  P(c); top.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); for (let i = bot.length - 1; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]); c.closePath();
  c.fillStyle = 'rgba(6,14,26,0.42)'; c.fill();
  const metal = c.createLinearGradient(0, 0, 0, H); metal.addColorStop(0, '#3c4654'); metal.addColorStop(0.5, '#7d8a9c'); metal.addColorStop(1, '#3c4654');
  c.fillStyle = metal;
  P(c); c.moveTo(-24, -70); for (const [x, y] of top) c.lineTo(x, y); c.lineTo(W + 24, -70); c.closePath(); c.fill();
  P(c); c.moveTo(-24, H + 70); for (const [x, y] of bot) c.lineTo(x, y); c.lineTo(W + 24, H + 70); c.closePath(); c.fill();
  c.lineWidth = 6; c.strokeStyle = '#b8c3d1';
  P(c); top.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  P(c); bot.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  const s = tunScroll(), step = 90;
  for (let u = Math.ceil((s - 40) / step) * step; u < s + W + 40; u += step) {
    const x = u - s, a = tunAt(x);
    if (!a || a.g > H / 2 + 20) continue;
    for (const [y0, y1] of [[0, a.c - a.g], [a.c + a.g, H]]) { P(c); c.rect(x - 6, y0, 12, y1 - y0); c.fillStyle = 'rgba(30,36,46,0.35)'; c.fill(); }
    P(c); circ(c, x, a.c - a.g - 9, 3); circ(c, x, a.c + a.g + 9, 3); c.fillStyle = '#dfe6ee'; c.fill();
  }
}

/* ---------- endings shared with level 3 */
const OUTRO = {
  mega: { a: 'ТЫ ПРОСТО БОСС,', b: 'ТЫ ПРОСТО НАЧАЛЬНИК!', lines: ['Теперь угадайте,', 'кого вызовет на помощь', 'Мегалодон?'], end: 'tentacle' },
  salmon: { a: null, b: null, lines: ['СЛЕДУЮЩИЙ БОСС', 'УЩИПНЕТ', 'ТЕБЯ'], colors: ['#0b0b0b', '#3fbf3f', '#0b0b0b'], end: 'crayfish' },
  vampire: { a: null, b: null, lines: ['ТЫ СПРАВИЛСЯ, БОЕЦ!', 'ТЫ ОТПРАВЛЯЕШЬСЯ', 'В РУССКИЕ РЕКИ. УДАЧИ!'], colors: ['#ff5a5a', '#8dff6a', '#ff5a5a'], end: 'salmon' },
  anaconda: { a: null, b: null, lines: ['Следующий босс', 'тебе', 'не по плавникам…'], end: 'vampire' },
  gator: { a: null, b: null, lines: ['Как думаете,', 'кто следующий', 'БОСС?'], end: 'snake' },
  perch: { a: 'ВСЕ БОССЫ ПОВЕРЖЕНЫ!', b: 'ТЫ НАСТОЯЩИЙ БОЕЦ!', lines: ['Больше они не помешают…', 'А ты, боец,', 'отправляешься в Амазонку.'], end: 'jungle' },
  swordfish: { a: 'ДА КАК ТАК?', b: 'КАК ТЫ СМОГ?!', lines: ['Я думал, ты не справишься…', 'Как так?..', 'ТЕБЕ КОНЕЦ.'], end: 'red' },
  kraken: { a: 'ТЫ БОЛЬШОЙ МОЛОДЕЦ,', b: 'НО В СЛЕДУЮЩИЙ РАЗ ТЕБЕ НЕ ПОВЕЗЁТ!', lines: ['Зря ты тронул', 'моих детей…', 'Тебе несдобровать.'], end: 'sword' },
};
// the swordfish's bill pierces the darkness, the screen cracks, an eye lights up
function drawSwordEnd(c, k) {
  const thrust = easeOut(clamp((k - 8.6) / 0.22, 0, 1)), back = easeInOut(clamp((k - 10.3) / 0.5, 0, 1));
  const tipX = lerp(SW + 40, SW * 0.18, thrust) + back * SW, y = SH * 0.8;
  if (k > 8.82) {
    c.save(); c.strokeStyle = 'rgba(230,240,255,0.85)'; c.lineWidth = 2;
    const R = mulberry(5);
    for (let i = 0; i < 9; i++) {
      let x = SW * 0.18 + R() * SW * 0.25, yy = y + (R() - 0.5) * 20, a = (R() - 0.5) * Math.PI * 1.6 + (R() < 0.5 ? Math.PI : 0);
      P(c); c.moveTo(x, yy);
      for (let j = 0; j < 5; j++) { x += Math.cos(a) * (30 + R() * 40); yy += Math.sin(a) * (30 + R() * 40); a += (R() - 0.5) * 1.2; c.lineTo(x, yy); }
      c.stroke();
    }
    c.restore();
  }
  if (thrust > 0 && back < 1) {
    // eye and dorsal sail of the swordfish hiding in the dark
    const eyeA = clamp((k - 9.1) / 0.5, 0, 1) * (1 - back);
    if (eyeA > 0) {
      c.save(); c.globalAlpha = eyeA;
      const ex = tipX + SW * 0.62, ey = y - 18;
      glow(c, ex, ey, 70, 'rgba(255,220,80,A)', 0.6);
      P(c); ell(c, ex, ey, 26, 22); c.fillStyle = '#ffd43b'; c.fill();
      P(c); ell(c, ex, ey, 5, 19); c.fillStyle = '#000'; c.fill();
      P(c); c.moveTo(ex - 60, y - 70); c.quadraticCurveTo(ex + 40, y - 300, ex + 260, y - 120); c.lineTo(ex + 240, y - 60); c.closePath();
      c.fillStyle = 'rgba(40,70,120,0.55)'; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(150,190,255,0.6)'; c.stroke();
      c.restore();
    }
    // the bill
    const g = c.createLinearGradient(0, y - 14, 0, y + 14); g.addColorStop(0, '#f4f7fb'); g.addColorStop(0.5, '#9aa6b8'); g.addColorStop(1, '#5a6578');
    P(c); c.moveTo(tipX, y); c.lineTo(tipX + 40, y - 9); c.lineTo(SW + 60, y - 22); c.lineTo(SW + 60, y + 22); c.lineTo(tipX + 40, y + 9); c.closePath();
    c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = '#1b2230'; c.stroke();
    if (k < 8.95) { c.fillStyle = 'rgba(255,255,255,' + (0.6 * (1 - (k - 8.6) / 0.35)).toFixed(3) + ')'; c.fillRect(0, 0, SW, SH); }
  }
}
