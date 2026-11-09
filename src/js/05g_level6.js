/* ============================================================ level 6 (carp): dark deep, shawarma shop, sink, boss rush */
LEVEL_INFO[6] = { duck: null, fish: { name: 'Все боссы против тебя', boss: 'perch', song: 'sea3' } };
const LEVEL6_LEN = 98;
const RUSH = ['pike', 'catfish', 'mega', 'kraken', 'swordfish', 'perch'];
// earlier bosses come at 45% health; the perch is 50% stronger than the strongest of them
const RUSH_HP = 0.45;
Object.assign(BOSS, { perch: { name: 'Босс-окунь', label: 'БОСС-ОКУНЬ', hp: 555, restX: 230, y: [140, 130], head: [-120, -70] } });
Object.assign(BOSS_HIT, { perch: [[-100, 0, 52], [10, 0, 64], [120, 0, 40]] });
Object.assign(KINDS, {
  fork:     { hp: 3, r: 16, score: 120, speed: 160, move: 'dive', art: { duck: 'fork', fish: 'fork' } },
  knife:    { hp: 3, r: 14, score: 150, speed: 720, move: 'lance', art: { duck: 'knife', fish: 'knife' } },
  shawa:    { hp: 8, r: 24, score: 250, speed: 150, move: 'hover', art: { duck: 'shawa', fish: 'shawa' } },
  cucumber: { hp: 2, r: 14, score: 80, speed: 210, move: 'zig', art: { duck: 'cucumber', fish: 'cucumber' } },
});
Object.assign(F, {
  knives(ys, gap) { ys.forEach((yf, i) => later(i * (gap || 0.35), () => enemy('knife', W - 14, yf * H))); },
  forks(ys, gap) { ys.forEach((yf, i) => later(i * (gap || 0.5), () => enemy('fork', W + 40, yf * H))); },
  shawas(ys) { ys.forEach((yf, i) => later(i * 0.5, () => enemy('shawa', W + 40, yf * H, { tx: W - rand(110, 230) }))); },
  cucumbers(n, yf) { for (let i = 0; i < n; i++) later(i * 0.22, () => enemy('cucumber', W + 30, yf * H + rand(-40, 40))); },
});
const LEVEL6_FISH = [
  [2.0, () => F.line('grunt', 6, 0.3, 0.26)],
  [3.5, () => F.swarm(4, 0.7)],
  [5.5, () => F.lance([0.25, 0.75])],
  [7.0, () => F.carrier('power', 0.5)],
  [8.0, () => F.heavy2()],
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
  [48.5, () => { F.line('grunt', 5, 0.3); F.lance([0.7]); }],
  [50.5, () => F.carrier('charm', 0.5)],
  [52.5, () => startPortal('shop')],
  [57.0, () => F.knives([0.3, 0.7])],
  [58.5, () => F.cucumbers(6, 0.5)],
  [60.5, () => F.forks([0.2, 0.5, 0.8])],
  [63.0, () => F.shawas([0.3, 0.7])],
  [65.0, () => F.health(0.5)],
  [66.0, () => { F.knives([0.2, 0.5, 0.8], 0.3); F.cucumbers(5, 0.3); }],
  [69.0, () => F.forks([0.3, 0.7], 0.4)],
  [70.5, () => F.shawas([0.5])],
  [72.0, () => { F.cucumbers(6, 0.7); F.knives([0.25, 0.75]); }],
  [74.5, () => F.carrier('bomb', 0.4)],
  [77.5, () => startPortal('lake')],
  [82.0, () => F.perches([0.3, 0.7])],
  [84.0, () => F.crucians(7, 0.5)],
  [86.0, () => F.pikelets([0.25, 0.75])],
  [88.5, () => { F.perches([0.2, 0.5, 0.8]); F.health(0.4); }],
  [91.0, () => F.crucians(6, 0.3)],
  [93.0, () => { F.carrier('power', 0.6); F.health(0.3); }],
];

/* ---------- bosses swim up from the deep: "тебе конец" */
const CAMEO6 = ['pike', 'catfish', 'mega', 'kraken', 'swordfish'];
function updateLevel6(dt) {
  if (G.level !== 6) return;
  if (G.cam6) { G.cam6.t += dt; G.cam6.x -= 90 * dt; if (G.cam6.t > 6) G.cam6 = null; }
  if (G.deep && G.phase === 'waves' && !G.tunnel && !G.cam6) {
    G.cam6Cd = (G.cam6Cd === undefined ? 2 : G.cam6Cd) - dt;
    if (G.cam6Cd <= 0) { G.cam6Cd = rand(5, 7); G.cam6N = (G.cam6N || 0) + 1; G.cam6 = { kind: CAMEO6[(G.cam6N - 1) % CAMEO6.length], x: rand(W * 0.5, W * 0.75), y: rand(140, H - 140), t: 0 }; sfx('drone'); }
  }
}
const CAMEO_ART = { pike: (c, t) => drawPike(c, { mouth: 0.7 }, t), catfish: (c, t) => drawCatfish(c, { mouth: 0.6 }, t), mega: (c, t) => drawMega(c, { mouth: 0.8 }, t), kraken: (c, t) => drawKraken(c, { mouth: 0.6 }, t), swordfish: (c, t) => drawSwordBoss(c, {}, t) };
function drawL6Bg(c, t) {
  const m = G.cam6; if (!m) return;
  const grow = easeOut(clamp(m.t / 1.4, 0, 1)), out = clamp((m.t - 4.8) / 1.2, 0, 1);
  c.save(); c.globalAlpha = (0.1 + 0.28 * grow) * (1 - out);
  c.translate(m.x, m.y); const s = lerp(0.12, 0.5, grow); c.scale(s, s);
  CAMEO_ART[m.kind](c, t); c.restore();
}
function drawL6Speech(c) {
  const m = G.cam6; if (!m || m.t < 1.0 || m.t > 4.5) return;
  const q = toScreen(m.x - 60, m.y - 40);
  speechAt(c, 'ТЕБЕ КОНЕЦ', q.x, q.y, 4.5 - m.t, 3.5, -1);
}

/* ---------- boss rush */
function rushNext() {
  const R = G.rush;
  R.i++;
  const kind = R.list[R.i];
  G.boss = null; G.eb.length = 0;
  banner(kind === 'perch' ? 'И ГЛАВНЫЙ!' : 'СЛЕДУЮЩИЙ!', BOSS[kind].name + (kind === 'perch' ? ' · сильнее всех' : ''), 2.4, kind === 'perch' ? 'warn' : 'title');
  sfx('siren');
  spawnBoss(kind);
}

/* ---------- perch boss */
const PEA = {
  *spines(b) {
    say(b, pick(['Колючки!', 'Получай плавником!']));
    for (let v = 0; v < (b.phase2 ? 4 : 3); v++) { const q = bp(b, -20, -60); spread(q.x, q.y, 9, 0.16, 250, { type: 'spike', r: 6 }); sfx('throw'); yield* wait(0.42); }
  },
  *walls(b) {
    say(b, 'Стенка на стенку!');
    for (let v = 0; v < (b.phase2 ? 3 : 2); v++) {
      const gap = rand(110, H - 110);
      for (let y = 30; y < H - 20; y += 34) if (Math.abs(y - gap) > 62) ebullet(b.x - 120, y, Math.PI, 230, { col: '#ff7a1a', r: 7 });
      sfx('hit'); yield* wait(0.9);
    }
  },
  *school(b) {
    say(b, 'Окуни, ко мне!');
    for (let k = 0; k < (b.phase2 ? 6 : 4); k++) { later(k * 0.2, () => enemy('perch', W + 40, H * (0.15 + k * 0.14), { amp: 40, freq: 2.6, phase: k })); }
    yield* wait(1.2);
  },
  *dash(b) {
    say(b, 'Окунь-таран!');
    yield* moveTo(b, b.x, clamp(heroHit().y, 140, H - 130), 0.45);
    yield* dash(b, 1050);
  },
  *rings(b) {
    say(b, 'Полосатая буря!');
    for (let k = 0; k < (b.phase2 ? 4 : 3); k++) { const q = bp(b, -60, 0); ring(q.x, q.y, 16, 190, { col: k % 2 ? '#ff7a1a' : '#9be15d', r: 7 }, k * 0.2); sfx('bubble'); yield* wait(0.45); }
  },
};
function* perchBrain(b) {
  yield* moveTo(b, W - 230, H * 0.5, 2.2);
  b.vul = true;
  say(b, 'Я главный в этом озере!');
  yield* wait(1.0);
  const list = ['spines', 'dash', 'walls', 'school', 'rings'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(210, 250), bossY(b), b.phase2 ? 0.55 : 0.8);
    yield* PEA[list[i++ % list.length]](b);
    yield* wait((b.phase2 ? 0.45 : 0.8) / (G.lvlDiff * 1.5));
  }
}

/* ============================================================ art */
Object.assign(ART, {
  knife(c, e, t) {
    P(c); rr(c, 12, -5, 26, 10, 4); fs(c, '#3a2a22', 2.5);
    P(c); c.rect(8, -6, 6, 12); fs(c, '#c9ced6', 2);
    P(c); c.moveTo(8, -6); c.lineTo(-28, -3); c.quadraticCurveTo(-36, 2, -30, 6); c.lineTo(8, 6); c.closePath(); fs(c, '#e3e8ef', 2.5);
    line(c, [-24, 2, 4, 3], 1.5, '#fff');
    eye(c, -6, -1, 3, -0.3, 0.1, 1.2);
  },
  fork(c, e, t) {
    P(c); rr(c, 6, -4, 34, 8, 4); fs(c, '#c9ced6', 2.5);
    P(c); c.moveTo(6, -9); c.lineTo(-6, -9); c.lineTo(-6, 9); c.lineTo(6, 9); c.closePath(); fs(c, '#d5dae2', 2.5);
    for (const y of [-7.5, -2.5, 2.5, 7.5]) { P(c); c.rect(-30, y - 1.4, 26, 2.8); fs(c, '#d5dae2', 1.5); }
    eye(c, 0, -3, 2.6, -0.3, 0.1, 1.2);
  },
  cucumber(c, e, t) {
    c.rotate(t * 4 + e.seed);
    P(c); circ(c, 0, 0, 14); fs(c, '#2f7a2a', 2.5);
    P(c); circ(c, 0, 0, 11); c.fillStyle = '#b8e07a'; c.fill();
    P(c); circ(c, 0, 0, 6.5); c.fillStyle = '#d8f2a6'; c.fill();
    c.fillStyle = '#f4f9e0'; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; P(c); ell(c, Math.cos(a) * 4, Math.sin(a) * 4, 1.6, 1, a); c.fill(); }
  },
  shawa(c, e, t) { drawShawarma(c, 0, 30, 62, t, { hp: 5, state: 'attack', mouth: e.charge || 0, flash: 0 }); },
});
function drawPerchBoss(c, b, t) {
  const angry = b.phase2, w = Math.sin(t * 5);
  c.save(); c.translate(150, 0); c.rotate(w * 0.12);
  P(c); c.moveTo(0, -10); c.lineTo(60, -62); c.lineTo(46, 0); c.lineTo(60, 62); c.lineTo(0, 10); c.closePath(); fs(c, '#e8622c', 4); c.restore();
  // spiky dorsal fins
  P(c); c.moveTo(-90, -62); for (let k = 0; k < 7; k++) { c.lineTo(-80 + k * 22, -118 + (k % 2) * 6); c.lineTo(-70 + k * 22, -66); } c.lineTo(80, -50); c.closePath(); fs(c, '#6b7a2a', 3.5);
  P(c); c.moveTo(70, -48); c.quadraticCurveTo(110, -92, 140, -30); c.closePath(); fs(c, '#7a8a32', 3);
  const body = () => { P(c); c.moveTo(-175, 6); c.quadraticCurveTo(-165, -60, -60, -70); c.quadraticCurveTo(80, -76, 155, -12); c.lineTo(160, 12); c.quadraticCurveTo(80, 76, -60, 70); c.quadraticCurveTo(-165, 66, -175, 6); c.closePath(); };
  body(); fs(c, angry ? '#a3b83a' : '#8fa83a', 4.5);
  c.save(); body(); c.clip();
  c.fillStyle = 'rgba(40,52,20,0.75)'; for (let x = -100; x <= 120; x += 44) { P(c); c.moveTo(x, -80); c.lineTo(x + 24, -80); c.lineTo(x + 12, 40); c.lineTo(x - 6, 40); c.closePath(); c.fill(); }
  P(c); ell(c, -10, 62, 190, 30); c.fillStyle = '#e9e2a8'; c.fill(); c.restore();
  P(c); c.moveTo(-40, 50); c.lineTo(-20, 104 + w * 4); c.lineTo(10, 54); c.closePath(); fs(c, '#e8622c', 3.5);
  P(c); c.moveTo(60, 50); c.lineTo(84, 92 - w * 4); c.lineTo(104, 46); c.closePath(); fs(c, '#e8622c', 3.5);
  // crown: the boss of the lake
  P(c); c.moveTo(-150, -66); c.lineTo(-146, -96); c.lineTo(-130, -78); c.lineTo(-118, -102); c.lineTo(-106, -78); c.lineTo(-90, -96); c.lineTo(-86, -64); c.closePath(); fs(c, '#ffd43b', 3);
  P(c); circ(c, -118, -88, 4); c.fillStyle = '#e63946'; c.fill();
  // mouth and eye
  P(c); c.moveTo(-176, 8); c.quadraticCurveTo(-150, 28, -122, 14); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
  c.fillStyle = '#fff'; for (let k = 0; k < 5; k++) { P(c); c.moveTo(-170 + k * 9, 12 + k * 1.5); c.lineTo(-166 + k * 9, 20 + k * 1.2); c.lineTo(-162 + k * 9, 13 + k * 1.5); c.closePath(); c.fill(); }
  P(c); circ(c, -128, -22, 16); fs(c, '#fff', 3.5);
  P(c); circ(c, -132, -20, 8); c.fillStyle = angry ? '#e63946' : '#c0392b'; c.fill();
  P(c); circ(c, -134, -23, 3); c.fillStyle = '#fff'; c.fill();
  line(c, [-156, -48, -108, -36], 7);
  P(c); c.moveTo(-90, -46); c.quadraticCurveTo(-70, 0, -90, 46); c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
}
function drawShop(c, t) {
  if (!G.shop) return;
  c.save();
  c.fillStyle = 'rgba(40,70,80,0.35)'; c.fillRect(0, 0, W, H);
  const off = (t * 40) % 48;
  c.strokeStyle = 'rgba(220,240,240,0.18)'; c.lineWidth = 2;
  for (let x = -off; x < W + 48; x += 48) { P(c); c.moveTo(x, 0); c.lineTo(x, H * 0.62); c.stroke(); }
  for (let y = 0; y < H * 0.62; y += 32) { P(c); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  // counter
  P(c); c.rect(0, H - 120, W, 120); c.fillStyle = '#6b4a2f'; c.fill();
  P(c); c.rect(0, H - 128, W, 12); fs(c, '#b8c3d1', 2);
  const o2 = (t * 55) % 360;
  for (let x = -o2; x < W + 360; x += 360) {
    // doner spit
    line(c, [x + 120, H - 300, x + 120, H - 128], 5, '#9aa3ad');
    P(c); c.moveTo(x + 92, H - 280); c.lineTo(x + 148, H - 280); c.lineTo(x + 138, H - 150); c.lineTo(x + 102, H - 150); c.closePath(); fs(c, '#a0582a', 3);
    c.strokeStyle = 'rgba(60,25,10,0.5)'; for (let y = H - 270; y < H - 155; y += 14) { P(c); c.moveTo(x + 96, y); c.lineTo(x + 144, y + 4); c.stroke(); }
    // menu board
    P(c); rr(c, x + 200, 70, 130, 70, 8); fs(c, '#221d2e', 3, '#ffd43b');
    c.font = '20px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffd43b'; c.fillText('ШАУРМА', x + 265, 94);
    c.font = '900 14px ' + FONT_UI; c.fillStyle = '#fff6e5'; c.fillText('250 ₽', x + 265, 120);
    // floating stool
    const by = H - 200 + Math.sin(t * 1.3 + x) * 10;
    line(c, [x + 280, by, x + 270, by + 50], 4, '#9aa3ad'); line(c, [x + 300, by, x + 310, by + 50], 4, '#9aa3ad');
    P(c); ell(c, x + 290, by, 26, 8); fs(c, '#e63946', 2.5);
  }
  c.restore();
}

// ending: the Amazon jungle grows in from the edges
function drawJungleEnd(c, k) {
  const a = easeOut(clamp((k - 8.6) / 2.0, 0, 1)), R = mulberry(21);
  for (let i = 0; i < 26; i++) {
    const side = i % 4, u = R(), len = (60 + R() * 140) * a, ang = R() * 1.2 - 0.6;
    let x, y, dir;
    if (side === 0) { x = u * SW; y = SH; dir = -Math.PI / 2; } else if (side === 1) { x = u * SW; y = 0; dir = Math.PI / 2; } else if (side === 2) { x = 0; y = u * SH; dir = 0; } else { x = SW; y = u * SH; dir = Math.PI; }
    c.save(); c.translate(x, y); c.rotate(dir + ang);
    P(c); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.28, len, 0); c.quadraticCurveTo(len * 0.5, len * 0.28, 0, 0); c.closePath();
    c.fillStyle = i % 3 ? '#1f6b2a' : '#2f8a3a'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#0d3a14'; c.stroke();
    line(c, [0, 0, len * 0.9, 0], 1.5, '#5fbf5f');
    c.restore();
  }
}
