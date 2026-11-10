/* ============================================================ level 11 (carp): rivers, whirlpool, lake 228, crayfish boss */
LEVEL_INFO[11] = { duck: null, fish: { name: 'Озеро 228', boss: 'crayboss', song: 'sea3' } };
const LEVEL11_LEN = 66;
Object.assign(BOSS, { crayboss: { name: 'Красный рак', label: 'КРАСНЫЙ РАК', hp: 780, restX: 260, y: [150, 150], head: [-150, -70] } });
Object.assign(BOSS_HIT, { crayboss: [[-150, -55, 40], [-150, 55, 40], [-20, 0, 54], [110, 0, 44], [200, 0, 30]] });
const LEVEL11_FISH = [
  [2.0, () => F.herrings(10, 0.35)],
  [4.0, () => F.pikelets([0.7])],
  [5.5, () => F.crayfish(3)],
  [7.5, () => F.carrier('power', 0.5)],
  [8.5, () => F.herrings(12, 0.65)],
  [10.5, () => F.smallcats([0.3, 0.7])],
  [13.0, () => { F.pikelets([0.25, 0.75]); F.crayfish(2); }],
  [15.5, () => F.health(0.5)],
  [16.5, () => { F.herrings(12, 0.5); F.smallcats([0.8]); }],
  [19.5, () => { F.crayfish(3); F.pikelets([0.4]); }],
  [22.0, () => F.carrier('charm', 0.4)],
  [23.5, () => F.herrings(14, 0.3)],
  [26.0, () => startPortal('lake228')],
  [31.0, () => F.perches([0.3, 0.7])],
  [33.5, () => { F.crayfish(3); F.crucians(6, 0.5); }],
  [36.0, () => F.pikelets([0.25, 0.75])],
  [38.5, () => { F.perches([0.2, 0.5, 0.8]); F.health(0.5); }],
  [41.0, () => F.crucians(8, 0.35)],
  [43.0, () => { F.crayfish(4); F.smallcats([0.5]); }],
  [46.0, () => F.carrier('power', 0.4)],
  [47.5, () => { F.perches([0.3, 0.7]); F.pikelets([0.5]); }],
  [50.5, () => F.crucians(8, 0.65)],
  [53.0, () => { F.crayfish(3); F.perches([0.25, 0.75]); }],
  [56.0, () => { F.health(0.5); F.carrier('charm', 0.3); }],
  [58.0, () => { F.pikelets([0.2, 0.5, 0.8]); F.crucians(6, 0.4); }],
  [61.5, () => { F.carrier('bomb', 0.5); F.health(0.3); }],
];

/* ---------- red crayfish boss */
const CRA = {
  *perches(b) {
    say(b, pick(['Окуни, ко мне!', 'Полосатые, в атаку!']));
    for (let k = 0; k < (b.phase2 ? 5 : 3); k++) { later(k * 0.25, () => enemy('perch', W + 40, H * (0.18 + k * 0.16), { amp: 45, freq: 2.6, phase: k })); }
    yield* wait(1.3);
  },
  *pinch(b) {
    say(b, pick(['Ущипну!', 'Клешнёй тебя!']));
    yield* moveTo(b, b.x, clamp(heroHit().y, 150, H - 150), 0.5);
    b.mouth = 1; yield* dash(b, 1000);
  },
  *shells(b) {
    say(b, 'Панцирная шрапнель!');
    for (let v = 0; v < (b.phase2 ? 4 : 3); v++) { for (const s of [-1, 1]) { const q = bp(b, -190, s * 55); spread(q.x, q.y, 3, 0.2, 240, { col: '#e8452c', r: 7 }); } sfx('throw'); yield* wait(0.45); }
  },
  *scissor(b) {
    say(b, 'Клешни-ножницы!');
    for (let k = 0; k < (b.phase2 ? 2 : 1); k++) {
      const y = clamp(heroHit().y, 70, H - 70);
      b.lash = { y: y - 46, phase: 'warn' }; b.lash2 = { y: y + 46, phase: 'warn' }; sfx('charge');
      yield* wait(0.75);
      b.lash.phase = 'hit'; b.lash2.phase = 'hit'; sfx('clink'); G.shake = Math.max(G.shake, 7);
      // the claws close towards the middle line
      for (let t = 0; t < 0.45;) { const dt = yield; t += dt; b.lash.y = lerp(y - 46, y - 10, t / 0.45); b.lash2.y = lerp(y + 46, y + 10, t / 0.45); }
      b.lash = null; b.lash2 = null; yield* wait(0.3);
    }
  },
  *ring(b) {
    say(b, 'Рачий вихрь!');
    for (let k = 0; k < (b.phase2 ? 3 : 2); k++) { const q = bp(b, -40, 0); ring(q.x, q.y, 16, 185, { col: '#e8452c', r: 7 }, k * 0.2); sfx('bubble'); yield* wait(0.5); }
  },
};
function* crayBrain(b) {
  yield* moveTo(b, W - 260, H * 0.5, 2.6);
  b.vul = true;
  say(b, 'Щёлк-щёлк! Добро пожаловать в озеро 228!');
  yield* wait(1.2);
  const list = ['shells', 'perches', 'pinch', 'scissor', 'ring'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(240, 280), bossY(b), b.phase2 ? 0.7 : 1.0);
    yield* CRA[list[i++ % list.length]](b);
    yield* wait((b.phase2 ? 0.45 : 0.8) / G.lvlDiff);
  }
}
function updateLevel11() {
  const B = G.boss;
  if (B && B.kind === 'crayboss' && B.lash2 && B.lash2.phase === 'hit') { const h = heroHit(); if (Math.abs(h.y - B.lash2.y) < 22 && h.x < B.x) hurtPlayer(); }
}

/* ============================================================ art */
function drawCrayBoss(c, b, t) {
  c.save(); c.scale(4.6, 4.6); ART.crayfish(c, { seed: 3 }, t * (b.dash ? 2 : 1)); c.restore();
  const angry = b.phase2;
  // big angry eyes on stalks
  for (const s of [-1, 1]) { tube(c, [-60, s * 14, -82, s * 30], 4, '#8a3a22'); P(c); circ(c, -84, s * 32, 11); fs(c, '#fff', 3); P(c); circ(c, -88, s * 32, 5.5); c.fillStyle = angry ? '#e63946' : INK; c.fill(); }
  line(c, [-100, -46, -70, -36], 5); line(c, [-100, 46, -70, 36], 5);
}
function drawClawLash(c, b, t) {
  for (const L of [b.lash, b.lash2]) {
    if (!L) continue;
    if (L.phase === 'warn') { c.save(); c.globalAlpha = 0.35 + 0.3 * Math.sin(t * 30); c.strokeStyle = '#ff3d5a'; c.setLineDash([16, 10]); c.lineWidth = 6; P(c); c.moveTo(0, L.y); c.lineTo(b.x - 80, L.y); c.stroke(); c.restore(); continue; }
    tube(c, [b.x - 100, L.y, -20, L.y], 16, '#c4532f');
    c.fillStyle = '#e8794f'; for (let x = b.x - 120; x > 0; x -= 40) { P(c); ell(c, x, L.y, 10, 6); c.fill(); }
  }
}
// ending hint: a pale fish with orange-red patches glides through the dark, long fins trailing
function drawKoiEnd(c, k) {
  const e = clamp((k - 8.8) / 2.4, 0, 1); if (e <= 0 || e >= 1) return;
  const vis = Math.sin(e * Math.PI), x = lerp(-200, SW + 200, e), y = SH * 0.78 + Math.sin(e * 9) * 10;
  c.save(); c.globalAlpha = 0.17 * vis; c.translate(x, y); c.scale(-1, 1);
  const sw = Math.sin(k * 6) * 0.25;
  c.save(); c.translate(60, 0); c.rotate(sw);
  P(c); c.moveTo(0, 0); c.quadraticCurveTo(50, -40, 90, -30); c.quadraticCurveTo(60, 0, 90, 30); c.quadraticCurveTo(50, 40, 0, 0); c.closePath(); c.fillStyle = 'rgba(240,235,225,0.8)'; c.fill(); c.restore();
  P(c); ell(c, 0, 0, 70, 26); c.fillStyle = '#efe8dc'; c.fill();
  c.fillStyle = '#e8562c'; for (const [px, py, r] of [[-30, -8, 14], [10, 6, 12], [36, -10, 10]]) { P(c); ell(c, px, py, r, r * 0.7); c.fill(); }
  c.fillStyle = '#ffcf4a'; P(c); ell(c, -50, -4, 6, 4); c.fill();
  c.restore();
  // a faint ripple where it passed
  const rk = clamp((e - 0.5) / 0.5, 0, 1);
  if (rk > 0) { P(c); ell(c, SW * 0.5, SH * 0.78, 40 + rk * 160, 10 + rk * 30); c.lineWidth = 2; c.strokeStyle = 'rgba(255,190,120,' + (0.3 * (1 - rk)).toFixed(2) + ')'; c.stroke(); }
}
