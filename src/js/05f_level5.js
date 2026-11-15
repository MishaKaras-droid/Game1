/* ============================================================ level 5 (carp): pipes, eel burrow, lake, swordfish */
LEVEL_INFO[5] = { duck: null, fish: { name: 'Удачи, брат', boss: 'swordfish', song: 'sea3' } };
const LEVEL5_LEN = 97;
Object.assign(BOSS, {
  eel: { name: 'Электрический угорь', label: 'ЭЛЕКТРИЧЕСКИЙ УГОРЬ', hp: 300, restX: 230, y: [120, 120], head: [-60, -40], mini: true },
  swordfish: { name: 'Рыба-меч', label: 'РЫБА-МЕЧ', hp: 792, restX: 270, y: [140, 130], head: [-150, -60] },
});
Object.assign(BOSS_HIT, {
  eel: [[-60, 0, 40], [10, 0, 26], [80, 0, 22], [150, 0, 18]],
  swordfish: [[-140, 0, 50], [-20, 0, 60], [100, 0, 50], [200, 0, 30], [-262, 0, 14]],
});
Object.assign(KINDS, {
  perch:   { hp: 4, r: 18, score: 130, speed: 170, move: 'sine', art: { duck: 'perch', fish: 'perch' } },
  crucian: { hp: 3, r: 17, score: 100, speed: 210, move: 'line', art: { duck: 'crucian', fish: 'crucian' } },
  pikelet: { hp: 6, r: 22, score: 200, speed: 150, move: 'dive', art: { duck: 'pikelet', fish: 'pikelet' } },
});
HELPERS.swordfish = ['mega', 'kraken'];
Object.assign(F, {
  perches(ys) { ys.forEach((yf, i) => later(i * 0.45, () => enemy('perch', W + 40, yf * H, { amp: 55, freq: 2.4, phase: i }))); },
  crucians(n, yf, gap) { for (let i = 0; i < n; i++) later(i * (gap || 0.32), () => enemy('crucian', W + 40, yf * H + Math.sin(i) * 20)); },
  pikelets(ys) { ys.forEach((yf, i) => later(i * 0.6, () => enemy('pikelet', W + 40, yf * H))); },
});

const LEVEL5_FISH = [
  [2.0, () => F.line('grunt', 6, 0.3, 0.26)],
  [3.5, () => F.swarm(4, 0.7)],
  [5.5, () => F.lance([0.25, 0.75])],
  [7.0, () => F.carrier('power', 0.5)],
  [8.5, () => F.sine('weaver', 8, 0.5, 0.3)],
  [11.0, () => F.shooters([0.25, 0.5, 0.75])],
  [13.0, () => F.health(0.5)],
  [15.5, () => startPipe()],
  [22.0, () => F.snails(4, 0.7)],
  [25.0, () => F.tpick(G.M.heal)],
  [26.5, () => F.snails(4, 0.6)],
  [30.0, () => F.snails(3, 0.6)],
  [35.5, () => F.rocks([-30])],
  [37.5, () => F.snails(2, 0.5)],
  [39.0, () => F.rocks([30])],
  [41.0, () => F.tpick(G.M.heal)],
  [42.5, () => F.rocks([0])],
  [44.0, () => F.snails(3, 0.5)],
  [46.0, () => F.rocks([-28])],
  [51.0, () => startEelLair()],
  [55.0, () => startLake()],
  [56.0, () => F.perches([0.3, 0.7])],
  [58.5, () => F.crucians(7, 0.5)],
  [61.0, () => F.pikelets([0.25, 0.75])],
  [63.5, () => F.perches([0.2, 0.5, 0.8])],
  [66.0, () => { F.crucians(6, 0.3); F.crucians(6, 0.7); }],
  [68.0, () => F.health(0.5)],
  [69.5, () => F.pikelets([0.3, 0.5, 0.7])],
  [72.0, () => { F.perches([0.25, 0.75]); F.crucians(5, 0.5); }],
  [75.0, () => F.carrier('charm', 0.4)],
  [77.0, () => F.pikelets([0.2, 0.8])],
  [79.5, () => F.perches([0.3, 0.5, 0.7])],
  [81.0, () => F.health(0.4)],
  [84.0, () => startPortal('dark')],
  [89.0, () => F.line('grunt', 6, 0.3, 0.25)],
  [91.0, () => F.lance([0.3, 0.7])],
  [93.0, () => { F.carrier('bomb', 0.5); F.health(0.3); }],
];

/* ---------- the eel's burrow and the lake */
function startEelLair() {
  G.flash = 0.5; G.flashColor = '#0a1020';
  later(0.01, () => startMini('eel'));
}
function startLake() { G.lake = true; banner('ОЗЕРО', 'Здесь живут окуни, караси и щуки', 2.6); sfx('wave'); }
function drawLake(c, t) {
  if (!G.lake || G.dark) return;
  c.save();
  c.globalAlpha = 0.3; c.fillStyle = '#3d7a2f'; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
  c.fillStyle = '#5a4a2a'; P(c); c.moveTo(0, H - 44); for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, H - 44 + Math.sin(x * 0.04 + 1) * 5); c.lineTo(W + 20, H); c.lineTo(0, H); c.closePath(); c.fill();
  const off = (t * 55) % 150;
  for (let x = -off; x < W + 150; x += 150) for (let j = 0; j < 3; j++) {
    const bx = x + j * 13, sw = Math.sin(t * 1.4 + x * 0.01 + j) * 10, top = H - 170 - j * 26;
    tube(c, [bx, H - 44, bx + sw * 0.5, (H - 44 + top) / 2, bx + sw, top], 3, j % 2 ? '#4f8a2f' : '#6aa63a');
    if (j !== 1) { P(c); ell(c, bx + sw, top - 10, 5, 13); fs(c, '#7a4a22', 2); }
  }
  const off2 = (t * 30) % 210;
  for (let x = -off2; x < W + 210; x += 210) { P(c); c.moveTo(x, 16); c.arc(x, 16, 30, 0.3, TAU - 0.3); c.closePath(); c.fillStyle = '#4fae3a'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2f6f24'; c.stroke(); if ((x | 0) % 2) { P(c); circ(c, x + 10, 8, 6); c.fillStyle = '#ffd0e6'; c.fill(); } }
  c.restore();
}

/* ---------- electric eel: mini-boss, then ally */
const EA = {
  *zap(b) {
    say(b, pick(['Разряд!', 'Двести двадцать вольт, брат!']));
    b.lash = { y: clamp(heroHit().y, 70, H - 70), phase: 'warn' }; sfx('charge');
    yield* wait(0.8);
    b.lash.phase = 'hit'; sfx('boom'); G.flash = 0.22; G.flashColor = '#bff6ff';
    yield* wait(0.4);
    b.lash = null; yield* wait(0.3);
  },
  *orbs(b) {
    say(b, 'Шаровые молнии!');
    for (let k = 0; k < (b.phase2 ? 3 : 2); k++) { const q = bp(b, -60, 0); ring(q.x, q.y, 12, 175, { col: '#ffe14d', r: 7 }, rand(0, 1)); sfx('bubble'); yield* wait(0.5); }
  },
  *sparks(b) {
    say(b, 'Искры!');
    for (let v = 0; v < 3; v++) { const q = bp(b, -70, 0); spread(q.x, q.y, b.phase2 ? 7 : 5, 0.17, 250, { col: '#9ff0ff', r: 6 }); sfx('hit'); yield* wait(0.42); }
  },
  *dash(b) {
    say(b, 'Угорь-экспресс!');
    yield* moveTo(b, b.x, clamp(heroHit().y, 120, H - 120), 0.5);
    yield* dash(b, 950);
  },
};
function* eelBrain(b) {
  yield* moveTo(b, W - 230, H * 0.5, 2.2);
  b.vul = true;
  say(b, 'Кто лезет в мою норку, брат?!');
  yield* wait(1.2);
  const list = ['zap', 'orbs', 'sparks', 'dash'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(200, 250), bossY(b), b.phase2 ? 0.7 : 1.0);
    yield* EA[list[i++ % list.length]](b);
    yield* wait(b.phase2 ? 0.45 : 0.8);
  }
}
function useEel() {
  if (state !== 'play' || !G || !G.eelUnlocked || G.eelT > 0 || G.eelCharge < 100 || !G.player.alive) return;
  G.eelT = 20; G.eelCharge = 0;
  G.eel = { x: G.player.x - 60, y: G.player.y + 80, strikeT: 0, bolts: [] };
  banner('УГОРЬ, РАЗРЯД!', '', 1.4, 'small'); sfx('charm');
}
function boltPts(x0, y0, x1, y1) {
  const pts = [x0, y0], n = 7;
  for (let i = 1; i < n; i++) pts.push(lerp(x0, x1, i / n) + rand(-14, 14), lerp(y0, y1, i / n) + rand(-14, 14));
  pts.push(x1, y1);
  return pts;
}
function updateEel(dt) {
  if (!(G.eelT > 0)) return;
  G.eelT -= dt;
  const s = G.eel, p = G.player;
  s.x = lerp(s.x, p.x - 50, Math.min(1, dt * 4)); s.y = lerp(s.y, p.y + (p.y > H / 2 ? -70 : 70), Math.min(1, dt * 4));
  for (const bl of s.bolts) bl.t -= dt;
  s.bolts = s.bolts.filter((bl) => bl.t > 0);
  s.strikeT -= dt;
  if (s.strikeT <= 0) {
    const hx = s.x + 40, hy = s.y;
    const near = G.enemies.filter((e) => !e.dead && !e.invuln && !e.ally && !e.harmless && e.x < W && d2(e.x, e.y, hx, hy) < 340 * 340)
      .sort((a, b) => d2(a.x, a.y, hx, hy) - d2(b.x, b.y, hx, hy)).slice(0, 3);
    if (near.length) {
      let px = hx, py = hy;
      for (const e of near) { s.bolts.push({ pts: boltPts(px, py, e.x, e.y), t: 0.2 }); damageEnemy(e, 10); px = e.x; py = e.y; }
      s.strikeT = 0.45; sfx('hit');
    } else {
      const B = G.boss;
      if (B && B.vul && !B.dead && B.kind !== 'eel') {
        let bc = null, bd = 560 * 560;
        for (const [cx, cy] of bossCircles(B)) { const d = d2(cx, cy, hx, hy); if (d < bd) { bd = d; bc = [cx, cy]; } }
        if (bc) { s.bolts.push({ pts: boltPts(hx, hy, bc[0], bc[1]), t: 0.22 }); damageBoss(6); hitSpark(bc[0], bc[1]); s.strikeT = 0.5; sfx('hit'); }
      }
    }
  }
  if (G.eelT <= 0) { G.eelT = 0; G.eel = null; }
}

/* ---------- swordfish boss; the megalodon and the kraken attack from the depth */
const SWA = {
  *minis(b) {
    say(b, 'Карась, лови меч!');
    const h = heroHit();
    for (let k = 0; k < (b.phase2 ? 6 : 4); k++) { enemy('lance', b.x - 160, k === 0 ? clamp(h.y, 60, H - 60) : rand(60, H - 60)); yield* wait(0.32); }
    yield* wait(0.6);
  },
  *thrust(b) {
    say(b, pick(['Карась, лови меч!', 'Пронзу насквозь!']));
    yield* moveTo(b, b.x, clamp(heroHit().y, 150, H - 140), 0.55);
    yield* dash(b, 1050);
  },
  *slash(b) {
    say(b, 'Вжух!');
    for (let v = 0; v < (b.phase2 ? 3 : 2); v++) { const q = bp(b, -260, 0); spread(q.x, q.y, 9, 0.13, 260, { type: 'spike', r: 6 }); sfx('swoosh'); yield* wait(0.5); }
  },
  *spin(b) {
    say(b, 'Меч-вертушка!');
    let a = rand(0, TAU);
    for (let k = 0; k < 18; k++) { const q = bp(b, -40, 0); ebullet(q.x, q.y, a, 200, { type: 'spike', r: 6 }); ebullet(q.x, q.y, a + Math.PI, 200, { type: 'spike', r: 6 }); a += 0.4; yield* wait(0.1); }
    yield* wait(0.3);
  },
};
function* swordBrain(b) {
  yield* moveTo(b, W - 270, H * 0.5, 2.6);
  b.vul = true;
  say(b, 'Карась, лови меч!');
  yield* wait(1.3);
  const list = ['minis', 'slash', 'thrust', 'spin'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(250, 290), bossY(b), b.phase2 ? 0.7 : 1.0);
    yield* SWA[list[i++ % list.length]](b);
    if (Math.random() < 0.35) say(b, 'Карась, лови меч!');
    yield* wait((b.phase2 ? 0.45 : 0.8) / (G.lvlDiff * 1.2));
  }
}

/* ============================================================ level 5 art */
Object.assign(ART, {
  perch(c, e, t) {
    const w = Math.sin(t * 10 + e.seed);
    c.save(); c.translate(20, 0); c.rotate(w * 0.25); P(c); c.moveTo(0, 0); c.lineTo(14, -11); c.lineTo(11, 0); c.lineTo(14, 11); c.closePath(); fs(c, '#e8622c', 2.5); c.restore();
    P(c); c.moveTo(-10, -10); c.lineTo(-4, -22); c.lineTo(2, -12); c.lineTo(8, -22); c.lineTo(14, -10); c.closePath(); fs(c, '#6b7a2a', 2);
    P(c); ell(c, 0, 0, 22, 12); fs(c, '#8fa83a', 3);
    c.save(); P(c); ell(c, 0, 0, 20.5, 10.5); c.clip(); c.fillStyle = '#3d4a1e'; for (let x = -12; x <= 12; x += 8) c.fillRect(x, -12, 4, 18); P(c); c.rect(-22, 4, 44, 10); c.fillStyle = '#e9e2a8'; c.fill(); c.restore();
    P(c); c.moveTo(-2, 8); c.lineTo(4, 16); c.lineTo(8, 8); c.closePath(); fs(c, '#e8622c', 2);
    eye(c, -13, -3, 3.6, -0.3, 0.1, 1.2, '#c0392b');
  },
  crucian(c, e, t) {
    const w = Math.sin(t * 9 + e.seed);
    c.save(); c.translate(16, 0); c.rotate(w * 0.25); P(c); c.moveTo(0, 0); c.lineTo(12, -11); c.lineTo(9, 0); c.lineTo(12, 11); c.closePath(); fs(c, '#d9a43a', 2.5); c.restore();
    P(c); c.moveTo(-8, -14); c.quadraticCurveTo(4, -24, 14, -10); c.closePath(); fs(c, '#d9a43a', 2);
    P(c); ell(c, 0, 0, 18, 15); fs(c, '#f2c14e', 3);
    c.strokeStyle = 'rgba(150,100,20,0.4)'; c.lineWidth = 1.2;
    for (let x = -8; x <= 10; x += 6) for (let y = -8; y <= 8; y += 6) { P(c); c.arc(x, y, 3, Math.PI * 0.2, Math.PI * 0.8); c.stroke(); }
    eye(c, -10, -4, 3.5, -0.3, 0.1, 1.1);
    P(c); c.moveTo(-17, 3); c.lineTo(-12, 4); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
  },
  pikelet(c, e, t) { c.scale(0.3, 0.3); drawPike(c, { mouth: 0.3 + Math.sin(t * 8 + e.seed) * 0.3 }, t); },
});
function drawEel(c, b, t) {
  const angry = b.phase2 && !b.friendly, skin = angry ? '#5a6b2a' : '#4a5a2a';
  const pts = [];
  for (let i = 0; i <= 16; i++) { const x = -30 + i * 22; pts.push([x, Math.sin(t * 5 - i * 0.6) * (6 + i * 1.5)]); }
  for (let i = pts.length - 1; i > 0; i--) {
    const w = lerp(34, 10, i / pts.length);
    line(c, [pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]], w + 5, INK);
  }
  for (let i = pts.length - 1; i > 0; i--) {
    const w = lerp(34, 10, i / pts.length);
    line(c, [pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]], w, skin);
    if (i % 2) { P(c); circ(c, pts[i][0], pts[i][1] - w * 0.15, w * 0.15); c.fillStyle = '#e8d94a'; c.fill(); }
  }
  const tl = pts[pts.length - 1]; P(c); c.moveTo(tl[0], tl[1]); c.lineTo(tl[0] + 26, tl[1] - 14); c.lineTo(tl[0] + 26, tl[1] + 14); c.closePath(); fs(c, skin, 2.5);
  if (Math.sin(t * 13) > 0.2) {
    c.save(); c.shadowColor = '#7ef'; c.shadowBlur = 12;
    for (let k = 0; k < 3; k++) { const a = pts[3 + k * 4]; line(c, [a[0], a[1] - 18, a[0] + 6, a[1] - 30, a[0] - 4, a[1] - 38, a[0] + 4, a[1] - 50], 2.5, '#bff6ff'); }
    c.restore();
  }
  P(c); ell(c, -55, 0, 46, 36); fs(c, skin, 4);
  if (IMG.eelFace) {
    photoFace(c, IMG.eelFace, -60, -2, 31);
    P(c); circ(c, -60, -2, 31); c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
    if (!b.friendly) { line(c, [-86, -26, -66, -18], 4.5); line(c, [-34, -26, -54, -18], 4.5); }
  } else {
    eye(c, -76, -10, 9, -0.2, 0.1, b.friendly ? 0 : 1.3, '#15121c', 0.6);
    eye(c, -48, -12, 8, -0.2, 0.1, b.friendly ? 0 : -1.3, '#15121c', 0.6);
    P(c); c.moveTo(-88, 14); c.quadraticCurveTo(-62, 28, -36, 12); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#fff'; for (let k = 0; k < 5; k++) { P(c); c.moveTo(-82 + k * 9, 16 + k * 1.2); c.lineTo(-78 + k * 9, 23); c.lineTo(-74 + k * 9, 17 + k * 1.2); c.closePath(); c.fill(); }
  }
}
function drawSwordBoss(c, b, t) {
  const angry = b.phase2, skin = angry ? '#2c4f8a' : '#2f5f9e', fin = angry ? '#6a3fb0' : '#5a3f9e', w = Math.sin(t * 4.5);
  c.save(); c.translate(200, 0); c.rotate(w * 0.12);
  P(c); c.moveTo(0, -8); c.quadraticCurveTo(40, -40, 70, -80); c.lineTo(46, 0); c.lineTo(70, 80); c.quadraticCurveTo(40, 40, 0, 8); c.closePath(); fs(c, fin, 4); c.restore();
  P(c); c.moveTo(-120, -40); c.quadraticCurveTo(-90, -200, 30, -190); c.quadraticCurveTo(110, -150, 120, -46); c.closePath(); fs(c, fin, 4);
  c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2; for (let x = -90; x < 110; x += 26) { P(c); c.moveTo(x, -46); c.lineTo(x + 10, -170 + Math.abs(x) * 0.3); c.stroke(); }
  const body = () => { P(c); c.moveTo(-180, 6); c.quadraticCurveTo(-170, -50, -80, -58); c.quadraticCurveTo(80, -66, 200, -14); c.lineTo(212, 0); c.lineTo(200, 14); c.quadraticCurveTo(80, 60, -80, 56); c.quadraticCurveTo(-170, 52, -180, 6); c.closePath(); };
  body(); fs(c, skin, 4.5);
  c.save(); body(); c.clip(); P(c); ell(c, -10, 50, 220, 30); c.fillStyle = '#d7e6f5'; c.fill(); c.restore();
  const g = c.createLinearGradient(0, -12, 0, 12); g.addColorStop(0, '#f4f7fb'); g.addColorStop(0.5, '#9aa6b8'); g.addColorStop(1, '#5a6578');
  P(c); c.moveTo(-176, -10); c.lineTo(-345, 0); c.lineTo(-176, 12); c.closePath(); c.fillStyle = g; c.fill(); c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
  P(c); c.moveTo(-40, 30); c.lineTo(-10, 86 + w * 5); c.lineTo(20, 36); c.closePath(); fs(c, fin, 3.5);
  P(c); c.moveTo(-170, 18); c.quadraticCurveTo(-150, 26, -128, 20); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  P(c); circ(c, -138, -14, 13); fs(c, '#ffe14d', 3);
  P(c); ell(c, -140, -14, 3.5, 10); c.fillStyle = INK; c.fill();
  line(c, [-160, -36, -120, -26], 6);
}
function drawLightningLash(c, b, t) {
  const L = b.lash, pts = [];
  for (let x = b.x - 60; x >= -20; x -= 24) pts.push(x, L.y + rand(-10, 10));
  c.save(); c.shadowColor = '#7ef'; c.shadowBlur = 18;
  line(c, pts, 14, 'rgba(120,230,255,0.45)'); line(c, pts, 5, '#fff8a0');
  c.restore();
}
function drawEelAlly(c, t) {
  const s = G.eel; if (!s) return;
  c.save(); c.shadowColor = '#7ef'; c.shadowBlur = 14;
  for (const bl of s.bolts) { c.globalAlpha = Math.min(1, bl.t / 0.12); line(c, bl.pts, 7, 'rgba(120,230,255,0.6)'); line(c, bl.pts, 2.5, '#fff8a0'); }
  c.restore();
  glow(c, s.x, s.y, 60, 'rgba(150,240,255,A)', G.eelT < 3 && Math.floor(t * 8) % 2 ? 0.15 : 0.4);
  c.save(); c.translate(s.x, s.y); c.scale(-0.34, 0.34); drawEel(c, { friendly: true }, t); c.restore();
}
// kraken helper: a tentacle crashes down/up through the carp's column
function drawKrakenHelper(c, k, t) {
  drawVLash(c, { vlash: { x: k.x, top: k.top, phase: k.t < 0.9 ? 'warn' : 'hit' } }, t);
}
// red ending of level 5
function drawRedEnd(c, k) {
  const a = clamp((k - 8.6) / 2.2, 0, 1);
  const g = c.createRadialGradient(SW / 2, SH / 2, lerp(SW, 0, a) * 0.5, SW / 2, SH / 2, Math.hypot(SW, SH) / 2);
  g.addColorStop(0, 'rgba(140,0,12,0)'); g.addColorStop(1, 'rgba(170,0,18,0.95)');
  c.fillStyle = g; c.fillRect(0, 0, SW, SH);
  c.fillStyle = 'rgba(120,0,12,' + (a * 0.8).toFixed(3) + ')'; c.fillRect(0, 0, SW, SH);
  const R = mulberry(9);
  c.fillStyle = '#8a0012';
  for (let i = 0; i < 22; i++) {
    const x = R() * SW, len = a * SH * (0.2 + R() * 0.7), wdt = 6 + R() * 14;
    P(c); c.moveTo(x - wdt / 2, 0); c.lineTo(x - wdt / 2, len); c.arc(x, len, wdt / 2, Math.PI, 0, true); c.lineTo(x + wdt / 2, 0); c.closePath(); c.fill();
  }
  if (k > 9.4) {
    const s = clamp((k - 9.4) / 0.6, 0, 1);
    c.save(); c.globalAlpha = s; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'italic 700 72px "Old Standard TT", Georgia, "Times New Roman", serif';
    c.shadowColor = '#ff2030'; c.shadowBlur = 30;
    c.fillStyle = '#ffe0e0'; c.fillText('ТЕБЕ КОНЕЦ.', SW / 2 + rand(-2, 2), SH * 0.5 + rand(-2, 2));
    c.restore();
  }
}
