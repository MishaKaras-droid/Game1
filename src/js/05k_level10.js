/* ============================================================ level 10 (carp): Russian rivers, cave, red salmon */
LEVEL_INFO[10] = { duck: null, fish: { name: 'Русские реки', boss: 'salmon', song: 'sea3' } };
const LEVEL10_LEN = 64;
Object.assign(BOSS, { salmon: { name: 'Красный лосось', label: 'КРАСНЫЙ ЛОСОСЬ', hp: 900, restX: 250, y: [140, 130], head: [-170, -60] } });
Object.assign(BOSS_HIT, { salmon: [[-160, 0, 46], [-50, 0, 54], [70, 0, 48], [170, 0, 30]] });
Object.assign(KINDS, {
  crayfish: { hp: 5, r: 20, score: 150, speed: 120, move: 'crab', art: { duck: 'crayfish', fish: 'crayfish' } },
  herring:  { hp: 2, r: 13, score: 70, speed: 270, move: 'line', art: { duck: 'herring', fish: 'herring' } },
  smallcat: { hp: 8, r: 24, score: 220, speed: 140, move: 'dive', art: { duck: 'smallcat', fish: 'smallcat' } },
});
Object.assign(F, {
  crayfish(n) { for (let i = 0; i < n; i++) later(i * 0.7, () => enemy('crayfish', W + 30, H - 82, { jumpT: rand(1, 2.5) })); },
  herrings(n, yf) { for (let i = 0; i < n; i++) later(i * 0.12, () => enemy('herring', W + 30, yf * H + Math.sin(i * 1.3) * 34, { shoots: Math.random() < 0.4 })); },
  smallcats(ys) { ys.forEach((yf, i) => later(i * 0.6, () => enemy('smallcat', W + 60, yf * H))); },
});
const LEVEL10_FISH = [
  [2.0, () => F.herrings(10, 0.35)],
  [4.0, () => F.pikelets([0.7])],
  [5.5, () => F.crayfish(3)],
  [7.5, () => F.carrier('power', 0.5)],
  [8.5, () => F.herrings(10, 0.65)],
  [10.5, () => F.smallcats([0.3])],
  [12.5, () => { F.pikelets([0.25, 0.75]); F.crayfish(2); }],
  [15.0, () => F.health(0.5)],
  [16.0, () => { F.herrings(12, 0.5); F.smallcats([0.8]); }],
  [19.0, () => { F.crayfish(3); F.pikelets([0.4]); }],
  [22.0, () => startCave()],
  [26.0, () => F.tline('grunt', 3, 0.6)],
  [29.0, () => F.tpick(G.M.heal)],
  [31.0, () => F.tline('weaver', 3, 0.7)],
  [34.0, () => F.tline('grunt', 4, 0.5)],
  [37.0, () => F.tpick('power')],
  [41.5, () => { F.herrings(12, 0.3); F.crayfish(2); }],
  [43.5, () => F.smallcats([0.3, 0.7])],
  [46.0, () => { F.pikelets([0.2, 0.5, 0.8]); F.health(0.6); }],
  [49.0, () => F.herrings(14, 0.6)],
  [51.0, () => F.carrier('charm', 0.4)],
  [52.5, () => { F.crayfish(4); F.smallcats([0.5]); }],
  [56.0, () => { F.pikelets([0.3, 0.7]); F.herrings(10, 0.5); }],
  [59.0, () => { F.carrier('bomb', 0.5); F.health(0.3); }],
];
function startCave() {
  startTunnel({ len: 2600, speed: 220, amp: 0.8, quiet: true });
  banner('ПЕЩЕРА', 'Не задевай стены', 2.6);
  sfx('drone');
}

/* ---------- red salmon */
const SLA = {
  *pikes(b) {
    say(b, pick(['Щучки, ко мне!', 'Щурята, вперёд!']));
    for (let k = 0; k < (b.phase2 ? 4 : 3); k++) { const q = bp(b, -180, 10); enemy('pikelet', q.x, clamp(q.y + rand(-80, 80), 60, H - 60)); sfx('bubble'); yield* wait(0.4); }
    yield* wait(0.6);
  },
  *roe(b) {
    say(b, pick(['Красная икра!', 'Лови икринки!']));
    for (let v = 0; v < (b.phase2 ? 4 : 3); v++) { b.mouth = 0.8; const q = bp(b, -200, 10); spread(q.x, q.y, b.phase2 ? 7 : 5, 0.17, 245, { col: '#ff5a3c', r: 7 }); sfx('bubble'); yield* wait(0.3); b.mouth = 0.1; yield* wait(0.2); }
    b.mouth = 0;
  },
  *leap(b) {
    say(b, 'Против течения!');
    yield* moveTo(b, b.x, clamp(heroHit().y, 140, H - 130), 0.5);
    b.mouth = 1; yield* dash(b, 1020);
  },
  *spawn(b) {
    say(b, 'Нерестовый дождь!');
    for (let k = 0; k < (b.phase2 ? 18 : 12); k++) { ebullet(rand(W * 0.05, W * 0.8), -20, Math.PI / 2 + rand(-0.15, 0.15), rand(180, 240), { col: '#ff7a5c', r: 7 }); yield* wait(0.12); }
    yield* wait(0.4);
  },
  *ring(b) {
    say(b, 'Красная волна!');
    for (let k = 0; k < (b.phase2 ? 3 : 2); k++) { const q = bp(b, -60, 0); ring(q.x, q.y, 16, 185, { col: '#ff5a3c', r: 7 }, k * 0.2); sfx('bubble'); yield* wait(0.5); }
  },
};
function* salmonBrain(b) {
  yield* moveTo(b, W - 250, H * 0.5, 2.6);
  b.vul = true;
  say(b, 'Это моя река, карась!');
  yield* wait(1.2);
  const list = ['roe', 'pikes', 'leap', 'spawn', 'pikes', 'ring'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(230, 270), bossY(b), b.phase2 ? 0.7 : 1.0);
    yield* SLA[list[i++ % list.length]](b);
    yield* wait((b.phase2 ? 0.45 : 0.8) / G.lvlDiff);
  }
}
function updateLevel10() {
  if (G.level !== 10) return;
  G.cave = !!(G.tunnel && tunAt(W * 0.5));
}

/* ============================================================ art */
Object.assign(ART, {
  crayfish(c, e, t) {
    const w = Math.sin(t * 10 + e.seed);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) tube(c, [-4 + k * 8, s * 6, -2 + k * 8, s * 16 + w * s * 2], 2, '#8a3a22');
    // tail segments to the right
    for (let k = 0; k < 4; k++) { P(c); ell(c, 16 + k * 8, 0, 7 - k * 0.6, 8 - k * 0.8); fs(c, '#b5462a', 2); }
    P(c); c.moveTo(44, 0); c.lineTo(54, -9); c.lineTo(54, 9); c.closePath(); fs(c, '#b5462a', 2);
    P(c); ell(c, -2, 0, 16, 10); fs(c, '#c4532f', 2.5);
    // claws reaching forward
    for (const s of [-1, 1]) {
      tube(c, [-14, s * 5, -26, s * 12], 3, '#b5462a');
      c.save(); c.translate(-34, s * 14); c.rotate(s * (0.2 + Math.max(0, w) * 0.4));
      P(c); ell(c, 0, 0, 10, 6); fs(c, '#d9582f', 2.5);
      P(c); c.moveTo(-6, -2); c.lineTo(-16, -6); c.lineTo(-8, 1); c.closePath(); fs(c, '#d9582f', 2);
      c.restore();
    }
    tube(c, [-16, -3, -40, -20 + w * 4, -54, -26], 1.2, '#8a3a22'); tube(c, [-16, 3, -40, -14 - w * 4, -56, -12], 1.2, '#8a3a22');
    eye(c, -16, -6, 2.4, -0.2, 0.1, 1.2);
  },
  herring(c, e, t) {
    const w = Math.sin(t * 14 + e.seed);
    c.save(); c.translate(14, 0); c.rotate(w * 0.3); P(c); c.moveTo(0, 0); c.lineTo(10, -8); c.lineTo(7, 0); c.lineTo(10, 8); c.closePath(); fs(c, '#6f8fb0', 2); c.restore();
    P(c); ell(c, 0, 0, 16, 6.5); fs(c, '#c9d6e4', 2.5);
    c.save(); P(c); ell(c, 0, 0, 15, 5.5); c.clip(); c.fillStyle = '#4f6f96'; c.fillRect(-16, -7, 32, 5); c.restore();
    eye(c, -10, -1, 2.4, -0.3, 0.1, 0);
  },
  smallcat(c, e, t) { c.scale(0.24, 0.24); drawCatfish(c, { mouth: 0.3 + Math.sin(t * 6 + e.seed) * 0.2 }, t); },
});
function drawSalmon(c, b, t) {
  const m = b.mouth || 0, w = Math.sin(t * 4.5), angry = b.phase2;
  const back = angry ? '#7a1420' : '#8a2a2a', side = angry ? '#e8333d' : '#d9433a', belly = '#f2d7c8';
  c.save(); c.translate(180, 0); c.rotate(w * 0.13);
  P(c); c.moveTo(0, -10); c.quadraticCurveTo(30, -30, 56, -60); c.lineTo(42, 0); c.lineTo(56, 60); c.quadraticCurveTo(30, 30, 0, 10); c.closePath(); fs(c, back, 4); c.restore();
  P(c); c.moveTo(-40, -50); c.lineTo(-10, -96); c.lineTo(30, -54); c.closePath(); fs(c, back, 3.5);
  P(c); c.moveTo(110, -36); c.lineTo(126, -58); c.lineTo(140, -30); c.closePath(); fs(c, back, 3);
  // hooked lower jaw of a spawning male
  c.save(); c.translate(-150, 16); c.rotate(m * 0.3);
  P(c); c.moveTo(0, -4); c.lineTo(-58, -6); c.quadraticCurveTo(-74, -10, -72, -24); c.quadraticCurveTo(-60, 6, -50, 12); c.lineTo(0, 20); c.closePath(); fs(c, belly, 3.5);
  c.fillStyle = '#fff'; for (let k = 0; k < 5; k++) { P(c); c.moveTo(-50 + k * 10, -4); c.lineTo(-46 + k * 10, -12); c.lineTo(-42 + k * 10, -4); c.closePath(); c.fill(); }
  c.restore();
  const body = () => { P(c); c.moveTo(-214, 2); c.quadraticCurveTo(-200, -44, -140, -54); c.quadraticCurveTo(0, -70, 186, -18); c.lineTo(190, 18); c.quadraticCurveTo(0, 60, -150, 44); c.lineTo(-206, 12); c.closePath(); };
  body(); fs(c, side, 4.5);
  c.save(); body(); c.clip();
  P(c); ell(c, 0, -52, 230, 28); c.fillStyle = back; c.fill();
  P(c); ell(c, -10, 52, 220, 24); c.fillStyle = belly; c.fill();
  c.fillStyle = 'rgba(40,10,10,0.55)'; for (const [x, y] of [[-60, -40], [-20, -46], [20, -38], [60, -44], [100, -34], [-40, -28], [40, -26], [140, -26]]) { P(c); circ(c, x, y, 4); c.fill(); }
  c.restore();
  // hooked snout
  P(c); c.moveTo(-214, 2); c.quadraticCurveTo(-232, -6, -224, 14); c.quadraticCurveTo(-214, 10, -206, 12); c.closePath(); fs(c, back, 3);
  P(c); c.moveTo(-120, -44); c.quadraticCurveTo(-100, 0, -120, 40); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  P(c); c.moveTo(-40, 40); c.lineTo(-12, 92 + w * 4); c.lineTo(16, 44); c.closePath(); fs(c, back, 3.5);
  P(c); circ(c, -174, -16, 12); fs(c, '#ffd43b', 3);
  P(c); circ(c, -176, -16, 6); c.fillStyle = INK; c.fill();
  P(c); circ(c, -178, -18, 2); c.fillStyle = '#fff'; c.fill();
  line(c, [-194, -36, -158, -28], 5);
}
function drawRivers(c, t) {
  if (!G.rivers || G.dark) return;
  c.save();
  c.fillStyle = G.cave ? 'rgba(6,10,24,0.55)' : 'rgba(30,80,170,0.32)'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#4a4a52'; P(c); c.moveTo(0, H - 34); for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, H - 34 + Math.sin(x * 0.07 + 2) * 6); c.lineTo(W + 20, H); c.lineTo(0, H); c.closePath(); c.fill();
  const off = (t * 60) % 160;
  c.fillStyle = '#6b6f7a';
  for (let x = -off; x < W + 160; x += 160) { P(c); ell(c, x + 30, H - 36, 26, 14); ell(c, x + 90, H - 30, 18, 10); c.fill(); }
  if (!G.cave) {
    c.strokeStyle = 'rgba(230,245,255,0.45)'; c.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const y = ((i * 89) % (H - 60)) + 20, len = 60 + (i % 5) * 30, x = W - ((t * (460 + (i % 4) * 90) + i * 197) % (W + len + 100));
      c.lineWidth = 2 + (i % 3); P(c); c.moveTo(x, y); c.quadraticCurveTo(x + len * 0.5, y - 6, x + len, y); c.stroke();
    }
    c.fillStyle = 'rgba(255,255,255,0.55)';
    for (let x = -off; x < W + 160; x += 160) { P(c); circ(c, x + 40, 10, 8); circ(c, x + 56, 6, 6); circ(c, x + 110, 12, 9); c.fill(); }
  }
  c.restore();
}
// ending hint: a huge claw slowly opens in the dark and snaps shut, red glint along its edge
function drawCrayfishEnd(c, k) {
  const e = clamp((k - 8.8) / 2.2, 0, 1); if (e <= 0) return;
  const vis = Math.sin(Math.min(1, e * 1.2) * Math.PI * 0.5) * (1 - clamp((e - 0.85) / 0.15, 0, 1));
  const open = e < 0.6 ? easeInOut(e / 0.6) : 1 - easeOut((e - 0.6) / 0.08);
  const x = SW * 0.78, y = SH * 0.76;
  c.save(); c.globalAlpha = 0.6 * vis; c.translate(x, y); c.rotate(-0.35);
  for (const s of [-1, 1]) {
    c.save(); c.rotate(s * open * 0.45);
    P(c); c.moveTo(0, 0); c.quadraticCurveTo(-60, s * -46, -150, s * -14); c.quadraticCurveTo(-90, s * -8, 0, s * 10); c.closePath();
    c.fillStyle = '#0d0505'; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(210,50,40,0.7)'; c.stroke();
    c.restore();
  }
  P(c); ell(c, 40, 0, 50, 26); c.fillStyle = '#0d0505'; c.fill();
  c.restore();
  if (open < 0.05 && e > 0.66 && e < 0.72) { c.fillStyle = 'rgba(255,60,40,0.18)'; c.fillRect(0, 0, SW, SH); }
}
