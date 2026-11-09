/* ============================================================ level 8 (carp): lake 67, mangrove river, the great anaconda */
LEVEL_INFO[8] = { duck: null, fish: { name: 'Это будет нелегко', boss: 'anaconda', song: 'sea3' } };
const LEVEL8_LEN = 76;
Object.assign(BOSS, { anaconda: { name: 'Большая анаконда · финальный босс', label: 'БОЛЬШАЯ АНАКОНДА', hp: 760, restX: 280, y: [140, 130], head: [-210, -60] } });
Object.assign(BOSS_HIT, { anaconda: [[-205, 0, 46], [-115, 0, 40], [-30, 0, 40], [55, 0, 38], [140, 0, 36]] });
const LEVEL8_FISH = [
  [2.0, () => F.line('grunt', 7, 0.3, 0.24)],
  [4.0, () => F.spears(3)],
  [5.5, () => F.crocs([0.7])],
  [7.5, () => F.snakes([0.3, 0.6])],
  [9.5, () => F.carrier('power', 0.5)],
  [10.5, () => F.redtails([0.25, 0.75])],
  [12.5, () => F.spears(4)],
  [14.0, () => F.arapaimas([0.5])],
  [16.0, () => F.health(0.4)],
  [17.0, () => { F.crocs([0.25, 0.75]); F.line('grunt', 6, 0.5, 0.22); }],
  [20.5, () => { F.snakes([0.2, 0.8]); F.spears(3); }],
  [23.0, () => { F.redtails([0.3, 0.7]); F.arapaimas([0.5]); }],
  [26.0, () => F.spears(5)],
  [27.5, () => F.carrier('charm', 0.4)],
  [29.0, () => F.crocs([0.2, 0.5, 0.8])],
  [32.0, () => { F.vee('grunt', 7, 0.5); F.snakes([0.25]); }],
  [34.5, () => { F.health(0.5); F.spears(4); }],
  [36.5, () => { F.arapaimas([0.3, 0.7]); F.redtails([0.5]); }],
  [39.5, () => { F.crocs([0.35, 0.65]); F.spears(3); }],
  [42.0, () => F.carrier('bomb', 0.5)],
  [44.0, () => startPortal('mangrove')],
  [49.0, () => F.snakes([0.3, 0.5, 0.7])],
  [51.5, () => F.line('grunt', 7, 0.4, 0.22)],
  [53.5, () => { F.redtails([0.2, 0.8]); F.spears(3); }],
  [56.0, () => F.health(0.5)],
  [57.0, () => { F.crocs([0.3, 0.7]); F.snakes([0.5]); }],
  [60.5, () => F.arapaimas([0.25, 0.75])],
  [63.0, () => { F.spears(4); F.line('grunt', 6, 0.6, 0.22); }],
  [65.5, () => F.carrier('power', 0.4)],
  [67.0, () => F.snakes([0.2, 0.4, 0.6, 0.8])],
  [70.0, () => { F.crocs([0.5]); F.redtails([0.3]); }],
  [72.5, () => { F.health(0.4); F.carrier('charm', 0.7); }],
];

/* ---------- anaconda */
const ANA_SAY = ['Ядом по плавникам!', 'Кусь-кусь!'];
const ANA = {
  *snakes(b) {
    say(b, 'Змейки, кусь его!');
    b.mouth = 1;
    for (let k = 0; k < (b.phase2 ? 5 : 3); k++) { const q = bp(b, -235, 10); enemy('snake', q.x, q.y + rand(-30, 30), { amp: 50, freq: 3.4, phase: k, hp: 4 }); sfx('hiss'); yield* wait(0.32); }
    b.mouth = 0; yield* wait(0.5);
  },
  *balls(b) {
    say(b, pick(['Получай шарики!', 'Кусь-кусь!']));
    for (let v = 0; v < (b.phase2 ? 4 : 3); v++) { b.mouth = 0.7; const q = bp(b, -235, 10); spread(q.x, q.y, b.phase2 ? 7 : 5, 0.17, 245, { col: '#7cff4f', r: 7 }); sfx('bubble'); yield* wait(0.3); b.mouth = 0.1; yield* wait(0.2); }
    b.mouth = 0;
  },
  *venom(b) {
    say(b, 'Ядом по плавникам!');
    for (let k = 0; k < (b.phase2 ? 3 : 2); k++) { b.mouth = 1; const q = bp(b, -235, 10); ebullet(q.x, q.y, aimAt(q.x, q.y) + rand(-0.15, 0.15), 170, { col: '#9dff3a', r: 12, burstT: 1.0, burstCol: '#7cff4f' }); sfx('throw'); yield* wait(0.55); }
    b.mouth = 0; yield* wait(0.5);
  },
  *bite(b) {
    say(b, 'Кусь-кусь!');
    yield* moveTo(b, b.x, clamp(heroHit().y, 140, H - 130), 0.5);
    b.mouth = 1; yield* dash(b, 1000);
  },
  *coil(b) {
    say(b, 'Кольца анаконды!');
    for (let k = 0; k < (b.phase2 ? 3 : 2); k++) { const q = bp(b, -60, 0); ring(q.x, q.y, 18, 180, { col: '#7cff4f', r: 7 }, k * 0.17); sfx('hiss'); yield* wait(0.5); }
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
function* anacondaBrain(b) {
  yield* moveTo(b, W - 280, H * 0.5, 2.8);
  b.vul = true;
  say(b, 'Ш-ш-ш… Кусь-кусь!');
  yield* wait(1.2);
  const list = ['balls', 'snakes', 'bite', 'venom', 'coil', 'tail'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(260, 300), bossY(b), b.phase2 ? 0.7 : 1.0);
    yield* ANA[list[i++ % list.length]](b);
    if (Math.random() < 0.45) say(b, pick(ANA_SAY));
    yield* wait((b.phase2 ? 0.45 : 0.8) / G.lvlDiff);
  }
}

/* ============================================================ art */
function drawAnaconda(c, b, t) {
  const m = b.mouth || 0, angry = b.phase2, skin = angry ? '#5a8a2a' : '#4a7a2a', spot = '#1f3a14';
  // body: a thick wave trailing to the right, off screen
  const pts = [];
  for (let i = 0; i <= 22; i++) { const x = -190 + i * 26, k = Math.min(1, i / 6); pts.push(x, Math.sin(t * 2.6 - i * 0.55) * 26 * k); }
  line(c, pts, 74, INK); line(c, pts, 66, skin);
  c.fillStyle = spot;
  for (let i = 4; i < pts.length; i += 4) { P(c); ell(c, pts[i], pts[i + 1] - 10, 14, 9); c.fill(); P(c); ell(c, pts[i] + 13, pts[i + 1] + 14, 10, 6); c.fill(); }
  const bel = pts.slice(); line(c, bel.map((v, j) => (j % 2 ? v + 22 : v)), 12, 'rgba(230,220,150,0.5)');
  // head
  const hx = -205, hy = pts[1];
  c.save(); c.translate(hx, hy);
  // lower jaw
  c.save(); c.translate(6, 10); c.rotate(-m * 0.45);
  P(c); c.moveTo(0, -4); c.quadraticCurveTo(-40, 0, -64, -2); c.quadraticCurveTo(-60, 14, -30, 18); c.quadraticCurveTo(0, 16, 14, 6); c.closePath(); fs(c, '#d6c98a', 3);
  c.fillStyle = '#fff'; for (const fx of [-56, -40]) { P(c); c.moveTo(fx, -2); c.lineTo(fx + 4, -12); c.lineTo(fx + 8, -2); c.closePath(); c.fill(); }
  c.restore();
  if (m > 0.05) { P(c); c.moveTo(6, 6); c.lineTo(-58, 2); c.lineTo(-56, 6 + m * 26); c.lineTo(6, 20); c.closePath(); c.fillStyle = '#7a1f2b'; c.fill(); }
  P(c); c.moveTo(44, -40); c.quadraticCurveTo(-10, -58, -62, -20); c.quadraticCurveTo(-74, -4, -62, 6); c.quadraticCurveTo(-10, 22, 44, 26); c.quadraticCurveTo(60, -7, 44, -40); c.closePath(); c.fillStyle = skin; c.fill(); c.lineWidth = 4; c.strokeStyle = INK;
  P(c); c.moveTo(44, -40); c.quadraticCurveTo(-10, -58, -62, -20); c.quadraticCurveTo(-74, -4, -62, 6); c.quadraticCurveTo(-10, 22, 44, 26); c.stroke();
  if (!IMG.anacondaFace) { c.fillStyle = spot; for (const [sx, sy] of [[-6, -26], [18, -10], [-30, -14]]) { P(c); ell(c, sx, sy, 9, 6); c.fill(); } }
  c.fillStyle = '#fff'; for (const fx of [-58, -44]) { P(c); c.moveTo(fx, 4); c.lineTo(fx + 4, 14); c.lineTo(fx + 8, 4); c.closePath(); c.fill(); }
  P(c); circ(c, -58, -10, 2.5); c.fillStyle = INK; c.fill();
  if (IMG.anacondaFace) {
    photoFace(c, IMG.anacondaFace, -14, -12, 28);
    P(c); circ(c, -14, -12, 28); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
    line(c, [-38, -36, -20, -30], 5); line(c, [10, -36, -8, -30], 5);
  } else {
    P(c); ell(c, -26, -20, 11, 9); fs(c, angry ? '#ff3d3d' : '#ffd43b', 3);
    P(c); ell(c, -26, -20, 2.6, 8); c.fillStyle = '#000'; c.fill();
    line(c, [-42, -32, -14, -30], 5);
  }
  if (Math.sin(t * 9) > 0.3) { line(c, [-66, 4, -96, 4], 3.5, '#e63946'); line(c, [-96, 4, -106, -4], 3, '#e63946'); line(c, [-96, 4, -106, 12], 3, '#e63946'); }
  c.restore();
}
function drawMangrove(c, t) {
  if (!G.mangrove) return;
  c.save();
  c.fillStyle = 'rgba(70,60,20,0.32)'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#3a2e1a'; P(c); c.moveTo(0, H - 36); for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, H - 36 + Math.sin(x * 0.05) * 5); c.lineTo(W + 20, H); c.lineTo(0, H); c.closePath(); c.fill();
  const off = (t * 60) % 220;
  c.globalAlpha = 0.6;
  for (let x = -off; x < W + 220; x += 220) {
    // arching prop roots coming down from the trees above
    for (let j = 0; j < 4; j++) {
      const x0 = x + j * 34, x1 = x0 + 60 + j * 10, top = -20, mid = 90 + j * 30, end = H - 36;
      P(c); c.moveTo(x0, top); c.bezierCurveTo(x0 - 30, mid, x1 - 40, mid + 60, x1, end);
      c.lineWidth = 11 - j * 1.5; c.strokeStyle = '#2a1e10'; c.stroke(); c.lineWidth = 7 - j; c.strokeStyle = '#6b4a2a'; c.stroke();
    }
    c.fillStyle = '#2f6f24'; for (let j = 0; j < 5; j++) { P(c); ell(c, x + j * 40, 8 + (j % 2) * 8, 26, 12, (j - 2) * 0.3); c.fill(); }
  }
  c.restore();
}
// ending hint: something with long fangs and a red eye in the dark
function drawVampireEnd(c, k) {
  const pass = clamp((k - 8.7) / 1.5, 0, 1);
  if (pass > 0 && pass < 1) {
    const vis = Math.sin(pass * Math.PI), x = lerp(SW + 200, -300, pass), y = SH * 0.78;
    c.save(); c.globalAlpha = 0.5 * vis;
    P(c); ell(c, x, y, 220, 34); c.fillStyle = '#100608'; c.fill();
    P(c); c.moveTo(x + 200, y); c.lineTo(x + 280, y - 40); c.lineTo(x + 268, y); c.lineTo(x + 280, y + 40); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(160,60,70,0.35)'; c.lineWidth = 2; P(c); c.moveTo(x - 200, y - 6); c.quadraticCurveTo(x, y - 30, x + 200, y - 6); c.stroke();
    c.restore();
  }
  // two long fangs glint and a red eye blinks once
  const e = clamp((k - 10.0) / 0.8, 0, 1), open = Math.sin(e * Math.PI);
  if (open > 0.01) {
    const ex = SW * 0.78, ey = SH * 0.64;
    glow(c, ex, ey, 44, 'rgba(255,40,50,A)', 0.4 * open);
    P(c); ell(c, ex, ey, 13, 10 * open + 0.5); c.fillStyle = '#c4141f'; c.fill();
    P(c); circ(c, ex, ey, 3 * open + 0.2); c.fillStyle = '#000'; c.fill();
    c.save(); c.globalAlpha = open;
    for (const fx of [ex - 52, ex - 30]) { P(c); c.moveTo(fx - 4, ey + 18); c.lineTo(fx, ey + 18 + 46); c.lineTo(fx + 4, ey + 18); c.closePath(); c.fillStyle = '#f4f0e8'; c.fill(); }
    P(c); c.moveTo(ex - 50, ey + 30); c.lineTo(ex - 49, ey + 52); c.lineWidth = 1.5; c.strokeStyle = '#fff'; c.stroke();
    c.restore();
    if (e > 0.5) { const dy = (e - 0.5) * 2 * 60; P(c); c.moveTo(ex - 30, ey + 64 + dy); c.quadraticCurveTo(ex - 36, ey + 76 + dy, ex - 30, ey + 80 + dy); c.quadraticCurveTo(ex - 24, ey + 76 + dy, ex - 30, ey + 64 + dy); c.fillStyle = '#b0101c'; c.fill(); }
  }
}
