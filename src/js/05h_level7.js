/* ============================================================ level 7 (carp): the Amazon, lake 67, black alligator */
LEVEL_INFO[7] = { duck: null, fish: { name: 'Амазонка', boss: 'gator', song: 'sea3' } };
const LEVEL7_LEN = 76;
Object.assign(BOSS, { gator: { name: 'Чёрный аллигатор', label: 'ЧЁРНЫЙ АЛЛИГАТОР', hp: 760, restX: 250, y: [130, 120], head: [-190, -50] } });
Object.assign(BOSS_HIT, { gator: [[-180, 0, 40], [-70, 0, 50], [50, 0, 50], [170, 0, 32]] });
Object.assign(KINDS, {
  snake:   { hp: 4, r: 16, score: 140, speed: 170, move: 'sine', art: { duck: 'snake', fish: 'snake' } },
  redtail: { hp: 6, r: 22, score: 180, speed: 150, move: 'dive', art: { duck: 'redtail', fish: 'redtail' } },
  croc:    { hp: 11, r: 26, score: 300, speed: 120, move: 'croc', art: { duck: 'croc', fish: 'croc' } },
});
Object.assign(F, {
  snakes(ys) { ys.forEach((yf, i) => later(i * 0.5, () => enemy('snake', W + 50, yf * H, { amp: 60, freq: 3.2, phase: i }))); },
  redtails(ys) { ys.forEach((yf, i) => later(i * 0.55, () => enemy('redtail', W + 50, yf * H))); },
  crocs(ys) { ys.forEach((yf, i) => later(i * 0.8, () => enemy('croc', W + 70, yf * H))); },
  // spears fall from above, each warned by a red marker first
  spears(n) { n = Math.round(n * 1.5); for (let i = 0; i < n; i++) later(i * 0.35, () => { const h = heroHit(); G.spearW.push({ x: i === 0 ? clamp(h.x + rand(-30, 30), 40, W - 40) : rand(60, W - 60), t: 0.8 }); sfx('charge'); }); },
});
const LEVEL7_FISH = [
  [2.0, () => F.line('grunt', 6, 0.3, 0.25)],
  [4.0, () => F.spears(3)],
  [5.5, () => F.snakes([0.3, 0.7])],
  [8.0, () => F.redtails([0.25, 0.75])],
  [10.0, () => F.carrier('power', 0.5)],
  [11.0, () => F.arapaimas([0.5])],
  [13.0, () => F.spears(4)],
  [15.0, () => F.health(0.5)],
  [16.0, () => { F.line('grunt', 7, 0.5, 0.22); F.snakes([0.2]); }],
  [19.0, () => { F.redtails([0.4, 0.8]); F.spears(3); }],
  [22.0, () => { F.arapaimas([0.3, 0.7]); F.snakes([0.5]); }],
  [25.0, () => F.spears(5)],
  [27.0, () => F.carrier('charm', 0.4)],
  [28.5, () => F.vee('grunt', 7, 0.5)],
  [31.0, () => F.redtails([0.2, 0.5, 0.8])],
  [33.0, () => { F.health(0.4); F.spears(4); }],
  [35.0, () => { F.snakes([0.3, 0.6, 0.85]); F.arapaimas([0.5]); }],
  [38.0, () => { F.line('grunt', 6, 0.25, 0.22); F.line('grunt', 6, 0.75, 0.22); }],
  [40.0, () => F.spears(6)],
  [42.0, () => F.carrier('bomb', 0.5)],
  [44.0, () => startPortal('lake67')],
  [49.0, () => F.crocs([0.35, 0.75])],
  [52.0, () => { F.crocs([0.2]); F.health(0.6); }],
  [55.0, () => F.crocs([0.3, 0.55, 0.8])],
  [58.5, () => { F.crocs([0.5]); F.line('grunt', 6, 0.25, 0.25); }],
  [61.0, () => F.carrier('power', 0.4)],
  [63.5, () => F.crocs([0.25, 0.5, 0.75])],
  [67.0, () => F.carrier('charm', 0.6)],
  [69.5, () => F.crocs([0.3, 0.7])],
  [72.0, () => F.health(0.5)],
];
MOVES.croc = (e, dt) => {
  e.x -= (e.x > W * 0.7 ? e.speed : e.speed * 0.6) * dt;
  e.y = e.baseY + Math.sin(e.age * 1.4 + e.seed) * 14;
  e.snapT = (e.snapT === undefined ? rand(1, 2) : e.snapT) - dt;
  e.charge = Math.max(0, (e.charge || 0) - dt * 3);
  if (e.snapT <= 0 && e.x < W - 40) {
    e.snapT = rand(1.8, 2.6); e.charge = 1;
    const h = heroHit();
    if (Math.abs(h.y - e.y) < 160 && h.x < e.x) { e.x -= 70; sfx('swoosh'); }
    spread(e.x - 30, e.y, 3, 0.2, 210, { col: '#7ccf4f', r: 7 });
  }
};
function updateLevel7(dt) {
  if (G.level !== 7) return;
  for (const s of G.spearW) {
    s.t -= dt;
    if (s.t <= 0 && !s.done) { s.done = true; ebullet(s.x, -40, Math.PI / 2, 300, { type: 'spear', r: 9, spin: 0 }); sfx('throw'); }
  }
  G.spearW = G.spearW.filter((s) => !s.done);
}

/* ---------- black alligator */
const GTA = {
  *snap(b) {
    say(b, pick(['Щёлк-щёлк!', 'Сейчас перекушу!']));
    yield* moveTo(b, b.x, clamp(heroHit().y, 130, H - 120), 0.5);
    b.mouth = 1; yield* dash(b, 1000);
  },
  *spout(b) {
    say(b, 'Болотный фонтан!');
    for (let v = 0; v < (b.phase2 ? 4 : 3); v++) { b.mouth = 0.8; const q = bp(b, -230, 0); spread(q.x, q.y, b.phase2 ? 7 : 5, 0.18, 250, { col: '#7ccf4f', r: 7 }); sfx('bubble'); yield* wait(0.3); b.mouth = 0.2; yield* wait(0.2); }
    b.mouth = 0;
  },
  *babies(b) {
    say(b, 'Крокодильчики, вперёд!');
    for (let k = 0; k < (b.phase2 ? 3 : 2); k++) { enemy('croc', W + 70, rand(110, H - 110), { hp: 6 }); yield* wait(0.5); }
    yield* wait(0.6);
  },
  *roll(b) {
    say(b, 'Смертельный кувырок!');
    for (let k = 0; k < (b.phase2 ? 3 : 2); k++) { b.spin = 1; const q = bp(b, 0, 0); ring(q.x, q.y, 18, 185, { type: 'spike', r: 6 }, k * 0.17); sfx('swoosh'); yield* wait(0.5); }
    b.spin = 0;
  },
  *tail(b) {
    say(b, 'Хвостом по жабрам!');
    b.lash = { y: clamp(heroHit().y, 70, H - 70), phase: 'warn' }; sfx('charge');
    yield* wait(0.8);
    b.lash.phase = 'hit'; sfx('swoosh'); G.shake = Math.max(G.shake, 7);
    yield* wait(0.45);
    b.lash = null; yield* wait(0.3);
  },
};
function* gatorBrain(b) {
  yield* moveTo(b, W - 250, H * 0.5, 2.6);
  b.vul = true;
  say(b, 'Добро пожаловать в моё озеро!');
  yield* wait(1.2);
  const list = ['spout', 'snap', 'babies', 'tail', 'roll'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(230, 270), bossY(b), b.phase2 ? 0.7 : 1.0);
    yield* GTA[list[i++ % list.length]](b);
    yield* wait((b.phase2 ? 0.45 : 0.8) / G.lvlDiff);
  }
}

/* ============================================================ art */
Object.assign(ART, {
  snake(c, e, t) {
    const pts = [];
    for (let i = 0; i <= 8; i++) pts.push(-14 + i * 7, Math.sin(t * 8 + e.seed - i * 0.9) * 7);
    tube(c, pts, 9, '#4f9a3a');
    for (let i = 2; i < pts.length; i += 4) { P(c); circ(c, pts[i], pts[i + 1], 2.2); c.fillStyle = '#e8d94a'; c.fill(); }
    P(c); ell(c, -20, pts[1], 10, 7); fs(c, '#4f9a3a', 2.5);
    eye(c, -23, pts[1] - 2, 2.6, -0.3, 0.1, 1.2, '#c0392b');
    line(c, [-30, pts[1] + 1, -38, pts[1] + 1, -41, pts[1] - 2], 1.5, '#e63946'); line(c, [-38, pts[1] + 1, -41, pts[1] + 4], 1.5, '#e63946');
  },
  redtail(c, e, t) {
    const w = Math.sin(t * 9 + e.seed);
    c.save(); c.translate(26, 0); c.rotate(w * 0.25); P(c); c.moveTo(0, -4); c.lineTo(18, -16); c.lineTo(14, 0); c.lineTo(18, 16); c.lineTo(0, 4); c.closePath(); fs(c, '#e63946', 2.5); c.restore();
    P(c); c.moveTo(-6, -13); c.lineTo(4, -24); c.lineTo(10, -12); c.closePath(); fs(c, '#4a4f5c', 2);
    P(c); ell(c, 0, 0, 30, 14); fs(c, '#5d6475', 3);
    P(c); ell(c, 4, 7, 22, 6); c.fillStyle = '#f2efe0'; c.fill();
    for (const k of [-1, 1]) tube(c, [-26, 3, -40, 8 + k * 6, -46, 16 + k * 8], 1.6, '#3a3e48');
    eye(c, -18, -4, 3.5, -0.3, 0.1, 1.2);
  },
  croc(c, e, t) {
    const m = e.charge || 0, w = Math.sin(t * 4 + e.seed);
    c.save(); c.translate(30, 1); c.rotate(w * 0.15); P(c); c.moveTo(0, -11); c.quadraticCurveTo(34, -7, 52, 0); c.quadraticCurveTo(34, 8, 0, 11); c.closePath(); fs(c, '#3f8a2f', 2.5); c.restore();
    for (const lx of [-14, 22]) { P(c); c.moveTo(lx, 8); c.lineTo(lx - 4, 20 + w * 2); c.lineTo(lx + 6, 20 - w * 2); c.closePath(); fs(c, '#3f8a2f', 2); }
    P(c); ell(c, 2, 0, 34, 16); fs(c, '#4fae3a', 3);
    P(c); ell(c, 2, 7, 26, 6); c.fillStyle = '#c9e08a'; c.fill();
    c.fillStyle = '#2f7a2a'; for (let x = -20; x <= 24; x += 9) { P(c); c.moveTo(x - 3, -10); c.lineTo(x, -16); c.lineTo(x + 3, -10); c.closePath(); c.fill(); }
    c.save(); c.translate(-26, 0); c.rotate(-m * 0.35); P(c); c.moveTo(0, -6); c.lineTo(-32, -4); c.lineTo(-32, 0); c.lineTo(0, 2); c.closePath(); fs(c, '#4fae3a', 2.5); c.restore();
    P(c); c.moveTo(-26, 2); c.lineTo(-58, 2); c.lineTo(-56, 8); c.lineTo(-26, 9); c.closePath(); fs(c, '#4fae3a', 2.5);
    c.fillStyle = '#fff'; for (let k = 0; k < 5; k++) { P(c); c.moveTo(-54 + k * 6, 2); c.lineTo(-51 + k * 6, -2); c.lineTo(-48 + k * 6, 2); c.closePath(); c.fill(); }
    eye(c, -24, -8, 3.6, -0.3, 0.1, 1.3, '#e8d94a');
  },
});
function drawGator(c, b, t) {
  const m = b.mouth || 0, w = Math.sin(t * 3.5), angry = b.phase2, skin = '#1f2124', back = '#2e3136', belly = '#4a4d52';
  if (b.spin) c.rotate(t * 14);
  // tail
  const tail = []; for (let i = 0; i <= 8; i++) tail.push(150 + i * 22, Math.sin(t * 4 - i * 0.6) * (4 + i * 2.5));
  tube(c, tail, 30, skin);
  for (let i = 2; i < tail.length; i += 2) { P(c); c.moveTo(tail[i] - 6, tail[i + 1] - 14); c.lineTo(tail[i], tail[i + 1] - 26); c.lineTo(tail[i] + 6, tail[i + 1] - 14); c.closePath(); fs(c, back, 2); }
  // legs
  for (const [lx, ph] of [[-80, 0], [80, 1.5]]) { P(c); c.moveTo(lx - 14, 30); c.lineTo(lx - 24 + Math.sin(t * 5 + ph) * 8, 66); c.lineTo(lx + 10, 66); c.lineTo(lx + 14, 30); c.closePath(); fs(c, skin, 3); for (let k = 0; k < 3; k++) line(c, [lx - 20 + k * 10 + Math.sin(t * 5 + ph) * 8, 66, lx - 24 + k * 10 + Math.sin(t * 5 + ph) * 8, 74], 3, '#fff'); }
  // lower jaw
  c.save(); c.translate(-150, 12); c.rotate(-m * 0.38);
  P(c); c.moveTo(0, -4); c.lineTo(-125, -6); c.quadraticCurveTo(-134, 6, -118, 14); c.lineTo(0, 24); c.closePath(); fs(c, belly, 3.5);
  c.fillStyle = '#fff'; for (let k = 0; k < 9; k++) { P(c); c.moveTo(-120 + k * 13, -5); c.lineTo(-114 + k * 13, -17); c.lineTo(-108 + k * 13, -5); c.closePath(); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke(); }
  c.restore();
  if (m > 0.05) { P(c); c.moveTo(-150, 6); c.lineTo(-272, 4); c.lineTo(-272, 4 + m * 46); c.lineTo(-150, 30); c.closePath(); c.fillStyle = '#8a1f2b'; c.fill(); }
  // body and head
  const body = () => { P(c); c.moveTo(-276, 4); c.quadraticCurveTo(-270, -20, -200, -30); c.lineTo(-150, -44); c.quadraticCurveTo(0, -62, 160, -26); c.lineTo(170, 26); c.quadraticCurveTo(0, 50, -150, 34); c.lineTo(-276, 12); c.closePath(); };
  body(); fs(c, skin, 4.5);
  c.save(); body(); c.clip(); P(c); ell(c, -40, 44, 220, 22); c.fillStyle = belly; c.fill(); c.restore();
  for (let x = -120; x < 150; x += 26) { P(c); c.moveTo(x - 8, -44 + Math.abs(x) * 0.08); c.lineTo(x, -60 + Math.abs(x) * 0.1); c.lineTo(x + 8, -44 + Math.abs(x) * 0.08); c.closePath(); fs(c, back, 2); }
  c.fillStyle = '#fff'; for (let k = 0; k < 9; k++) { P(c); c.moveTo(-270 + k * 13, 8); c.lineTo(-264 + k * 13, 22); c.lineTo(-258 + k * 13, 8); c.closePath(); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke(); }
  P(c); circ(c, -262, -4, 4); c.fillStyle = '#000'; c.fill();
  P(c); ell(c, -186, -38, 18, 14); fs(c, skin, 3.5);
  P(c); ell(c, -188, -40, 11, 9); c.fillStyle = angry ? '#ff3d3d' : '#ffd43b'; c.fill();
  P(c); ell(c, -188, -40, 2.6, 8); c.fillStyle = '#000'; c.fill();
  line(c, [-206, -54, -170, -46], 5);
}
function drawSpearW(c, t) {
  for (const s of G.spearW) {
    c.save(); c.globalAlpha = 0.4 + 0.3 * Math.sin(t * 30); c.strokeStyle = '#ff3d5a'; c.setLineDash([12, 10]); c.lineWidth = 4;
    P(c); c.moveTo(s.x, 0); c.lineTo(s.x, H); c.stroke(); c.restore();
    P(c); c.moveTo(s.x - 14, 8); c.lineTo(s.x + 14, 8); c.lineTo(s.x, 28); c.closePath(); fs(c, '#ff3d5a', 3);
  }
}
function drawAmazon(c, t) {
  if (!G.amazon && !G.lake67) return;
  c.save();
  c.fillStyle = G.lake67 ? 'rgba(70,170,50,0.4)' : 'rgba(40,110,40,0.38)'; c.fillRect(0, 0, W, H);
  c.fillStyle = G.lake67 ? '#4a5a2a' : '#4a3a22';
  P(c); c.moveTo(0, H - 40); for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, H - 40 + Math.sin(x * 0.03) * 6); c.lineTo(W + 20, H); c.lineTo(0, H); c.closePath(); c.fill();
  const off = (t * 50) % 170;
  if (G.amazon) {
    // roots and vines hanging from the riverbank
    for (let x = -off; x < W + 170; x += 170) {
      for (let j = 0; j < 3; j++) { const sw = Math.sin(t * 1.2 + x * 0.01 + j) * 8, len = 90 + ((x + j * 37) % 70); tube(c, [x + j * 18, -5, x + j * 18 + sw * 0.5, len * 0.5, x + j * 18 + sw, len], 4, j % 2 ? '#3a2a18' : '#4f8a2f'); P(c); ell(c, x + j * 18 + sw, len, 7, 4, 0.5); c.fillStyle = '#5fbf4a'; c.fill(); }
    }
  } else {
    for (let x = -off; x < W + 170; x += 170) { P(c); c.moveTo(x, 14); c.arc(x, 14, 34, 0.3, TAU - 0.3); c.closePath(); c.fillStyle = '#5fbf3a'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2f6f24'; c.stroke(); }
    const sx = W - ((t * 40) % (W + 400)) + 200;
    line(c, [sx, H - 40, sx, H - 170], 8, '#6b4a2a');
    P(c); rr(c, sx - 95, H - 230, 190, 64, 8); fs(c, '#8a5a2b', 3);
    c.font = '22px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff6e5'; c.fillText('ОЗЕРО 67', sx, H - 198);
  }
  c.restore();
}
// ending hint: something huge and scaly slides through the dark; only a glint of an eye
function drawAnacondaEnd(c, k) {
  const pass = clamp((k - 8.7) / 1.6, 0, 1);
  if (pass > 0 && pass < 1) {
    const vis = Math.sin(pass * Math.PI);
    c.save(); c.globalAlpha = 0.55 * vis;
    const pts = [], shift = lerp(SW * 0.9, -SW * 0.9, pass);
    for (let x = -80; x <= SW + 80; x += 20) pts.push(x, SH * 0.78 + Math.sin((x - shift) * 0.01) * 34);
    line(c, pts, 110, '#070b07'); line(c, pts, 96, '#0d150d');
    // faint scale glints only
    c.strokeStyle = 'rgba(120,150,90,0.35)'; c.lineWidth = 1.5;
    for (let i = 0; i < pts.length; i += 2) {
      const x = pts[i] + ((shift * 0.6) % 20), y = pts[i + 1];
      P(c); c.arc(x, y - 18, 7, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      P(c); c.arc(x + 10, y + 10, 7, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    }
    c.restore();
  }
  // an eye opens for a moment somewhere in the dark, and closes
  const e = clamp((k - 10.1) / 0.6, 0, 1), open = Math.sin(e * Math.PI);
  if (open > 0.01) {
    const ex = SW * 0.8, ey = SH * 0.66;
    glow(c, ex, ey, 46, 'rgba(255,210,60,A)', 0.35 * open);
    P(c); ell(c, ex, ey, 16, 11 * open + 0.5); c.fillStyle = '#e8c23a'; c.fill();
    P(c); ell(c, ex, ey, 2.4, 10 * open + 0.5); c.fillStyle = '#000'; c.fill();
  }
}
