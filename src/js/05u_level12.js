/* ============================================================ level 12 (carp): China — a river with a visible surface,
   leaps out of the water, air prizes and blings, jump-only obstacles, the canal and the koi boss */
LEVEL_INFO[12] = { duck: null, fish: { name: 'Made in China', boss: 'koi', song: 'china' } };
const LEVEL12_LEN = 74;
const SURF = 170;                               // the water surface (world y); above it is air
const C12 = { top: SURF + 22, g: 1500, blingLife: 12, maxBlings: 6 };
Object.assign(BOSS, { koi: { name: 'Карп кои', label: 'КАРП КОИ', hp: 860, restX: 260, y: [SURF + 130, 120], head: [-150, -60] } });
Object.assign(BOSS_HIT, { koi: [[-150, 0, 46], [-40, 0, 58], [80, 0, 46], [180, 0, 28]] });
Object.assign(KINDS, {
  zu:     { hp: 4, r: 18, score: 160, speed: 175, move: 'sine', art: { duck: 'zu', fish: 'zu' } },
  fugu:   { hp: 5, r: 19, score: 300, speed: 95,  move: 'fugu', art: { duck: 'fugu', fish: 'fugu' } },
  zebra:  { hp: 9, r: 26, score: 320, speed: 150, move: 'dive', art: { duck: 'zebra', fish: 'zebra' } },
  koilet: { hp: 2, r: 15, score: 80,  speed: 230, move: 'sine', art: { duck: 'koilet', fish: 'koilet' } },
});
const wy = (f) => SURF + 34 + f * (H - SURF - 110);     // 0..1 -> a depth inside the river
Object.assign(F, {
  zus(n, f) { for (let i = 0; i < n; i++) later(i * 0.4, () => enemy('zu', W + 50, wy(clamp(f, 0.1, 0.85)), { amp: 44, freq: 2.4, phase: i * 0.7 })); },
  fugus(fs0) { fs0.forEach((f, i) => later(i * 0.5, () => enemy('fugu', W + 40, wy(f)))); },
  // a living wall of pufferfish from the surface to the bottom: the only way is over it
  fuguWall() {
    for (let k = 0; k < 6; k++) enemy('fugu', W + 50, SURF + 38 + k * 54, { speed: 150, wall: true });
    G.c12.hints.push({ x: W + 50, vx: -150 });
  },
  zebras(fs0) { fs0.forEach((f, i) => later(i * 0.7, () => enemy('zebra', W + 60, wy(f)))); },
  air(type, f) { pickup(type, W + 40, 62 + (f === undefined ? Math.random() : f) * 46, { air: true, vx: -150 }); },
  wall(kind) {
    const D = { bamboo: { w: 34, top: SURF - 30 }, net: { w: 26, top: SURF - 16 }, gate: { w: 60, top: SURF - 22 } }[kind];
    G.c12.walls.push({ kind, x: W + 90, w: D.w, top: D.top, vx: -210, hit: false, done: false });
  },
});
const LEVEL12_FISH = [
  [3.6, () => { banner('ПРЫЖОК ИЗ ВОДЫ', 'Разгонись вверх — и выпрыгивай!', 3.2, 'small'); F.air('burger', 0.5); }],
  [5.5, () => F.zus(4, 0.3)],
  [8.0, () => F.air('bling', 0.4)],
  [9.0, () => F.fugus([0.2, 0.7])],
  [11.5, () => F.zebras([0.5])],
  [13.5, () => { F.wall('bamboo'); banner('ЗАБОР!', 'Его можно только перепрыгнуть', 2.4, 'small'); }],
  [16.0, () => { F.zus(5, 0.6); F.air('bling', 0.6); }],
  [18.5, () => F.carrier('power', 0.5)],
  [20.0, () => F.fugus([0.1, 0.45, 0.8])],
  [22.5, () => F.zebras([0.25, 0.75])],
  [25.0, () => { F.wall('net'); F.air('burger', 0.3); }],
  [27.5, () => F.zus(6, 0.4)],
  [29.5, () => F.health(0.6)],
  [31.0, () => { F.fuguWall(); banner('СТЕНА ИЗ ФУГУ!', 'Не трогай — прыгай', 2.4, 'small'); }],
  [33.0, () => { F.air('bling', 0.3); later(0.7, () => F.air('bling', 0.8)); }],
  [37.0, () => { F.zebras([0.5]); F.zus(4, 0.75); }],
  [39.5, () => F.carrier('charm', 0.4)],
  [41.0, () => { F.wall('bamboo'); later(1.7, () => F.wall('bamboo')); }],
  [44.5, () => { F.fugus([0.3, 0.6]); F.zus(5, 0.2); }],
  [47.5, () => { F.zebras([0.2, 0.5, 0.8]); F.air('burger', 0.5); }],
  [51.0, () => { F.wall('net'); F.air('bling', 0.4); }],
  [53.5, () => { F.zus(6, 0.5); F.fugus([0.85]); }],
  [56.0, () => { F.carrier('power', 0.5); F.health(0.7); }],
  [58.5, () => startCanal()],
  [62.5, () => { F.zus(5, 0.35); F.zebras([0.7]); }],
  [65.5, () => { F.fuguWall(); F.air('bling', 0.5); }],
  [68.5, () => F.zebras([0.3, 0.7])],
  [71.0, () => { F.carrier('bomb', 0.5); F.health(0.7); }],
];
function initLevel12(toBoss) {
  G.china = true; G.canal = !!toBoss; G.canalK = toBoss ? 1 : 0;
  G.c12 = { walls: [], hints: [], blings: [], airT: 5 };
  G.player.air = false; G.player.avy = 0;
  G.squidUnlocked = true; G.eelUnlocked = true; G.crocUnlocked = true;
  G.squidCharge = G.eelCharge = G.crocCharge = toBoss ? 100 : 50;
}
function startCanal() {
  F.wall('gate'); G.canal = true;
  banner('ВРАТА ДРАКОНА', 'Перепрыгни — за ними канал', 2.8, 'green'); sfx('charge');
}

/* ---------- leaving the water */
function c12Splash(x, power) {
  ringFx(x, SURF, 6, 46 * power, '#ffffff', 0.4);
  for (let i = 0; i < 12 * power; i++) part({ type: 'dot', x: x + rand(-18, 18), y: SURF, vx: rand(-150, 150), vy: rand(-380, -120), g: 1100, r: rand(2, 4.5), life: rand(0.45, 0.8), col: '#e6fbff' });
  sfx('splash');
}
function c12Surface(p) {
  if (p.y >= C12.top) return;
  if (p.vy < -260 && G.phase !== 'intro') {      // came up fast enough: fly out
    p.air = true; p.avy = -clamp(-p.vy * 1.15, 540, 700);
    c12Splash(p.x + 20, 1);
  } else p.y = C12.top;
}
function c12Air(p, dt) {
  let ax = 0;
  if (keys.ArrowLeft || keys.KeyA) ax -= 1;
  if (keys.ArrowRight || keys.KeyD) ax += 1;
  const ddx = input.dx; input.dx = 0; input.dy = 0;
  if (DEBUG.bot) ax = DEBUG.bot(G, W, H).ax || 0;
  p.x += ax * 340 * G.spd * dt + ddx;
  if (input.mouse.on && !ax && !DEBUG.bot) p.x += clamp(input.mouse.x - p.x, -700 * dt, 700 * dt);
  p.x = clamp(p.x, 84, W * 0.72);
  p.avy += C12.g * dt; p.y += p.avy * dt;
  if (p.y < 26) { p.y = 26; p.avy = Math.max(p.avy, 0); }
  if (p.avy > 0 && p.y >= C12.top) { p.air = false; p.y = C12.top; p.vy = 0; c12Splash(p.x + 20, 0.8); }
}
function collectBling(k) {
  const S = G.c12;
  if (S.blings.length >= C12.maxBlings) S.blings.shift();
  S.blings.push({ a: rand(0, TAU), t: C12.blingLife });
  S.blings.forEach((b, i) => { b.a = S.blings[0].a + (i / S.blings.length) * TAU; });
  floatText(k.x, k.y - 16, 'БЛИНГ!', '#ff7ae0', 22); addScore(100); sfx('charm');
}
function blingPos(b) { const p = G.player; return { x: p.x + 14 + Math.cos(b.a) * 56, y: p.y + Math.sin(b.a) * 44 }; }

function updateLevel12(dt, rdt) {
  if (!G.china) return;
  const S = G.c12, p = G.player, h = heroHit();
  G.canalK = clamp(G.canalK + (G.canal ? 1 : -1) * dt * 0.5, 0, 1);
  // fences, nets and the dragon gate: from the bottom to above the surface
  for (const w of S.walls) {
    w.x += w.vx * dt;
    if (p.alive && !w.hit && Math.abs(h.x - w.x) < w.w / 2 + h.r && h.y + h.r > w.top) {
      w.hit = true; hurtPlayer(); floatText(h.x, h.y - 30, w.kind === 'net' ? 'СЕТЬ!' : 'БУМ!', '#ffd0d0', 20);
    }
    if (!w.done && w.x + w.w / 2 < h.x - h.r) {
      w.done = true;
      if (!w.hit && p.alive) { addScore(w.kind === 'gate' ? 1000 : 300, h.x, h.y - 20); floatText(h.x, h.y - 44, w.kind === 'gate' ? 'ВРАТА ДРАКОНА!' : 'ПЕРЕПРЫГНУЛ!', '#ffe14d', 22); sfx('power'); }
      if (w.kind === 'gate') banner('КАНАЛ', 'Здесь живёт карп кои…', 2.6);
    }
    for (const s of G.pb) if (!s.dead && Math.abs(s.x - w.x) < w.w / 2 + 6 && s.y > w.top) { s.dead = true; hitSpark(s.x, s.y); }
  }
  S.walls = S.walls.filter((w) => w.x > -160);
  for (const q of S.hints) q.x += q.vx * dt;
  S.hints = S.hints.filter((q) => q.x > h.x);
  // nothing the enemies shoot leaves the water, and they stay under it themselves
  for (const b of G.eb) if (!b.dead && b.y < SURF + 5) { b.dead = true; part({ type: 'dot', x: b.x, y: SURF, vx: rand(-40, 40), vy: -140, g: 700, r: 3, life: 0.4, col: '#e6fbff' }); }
  for (const e of G.enemies) {
    if (e.kind === 'carrier' || e.ally) continue;
    const top = SURF + e.r * 0.7;
    if (e.y < top) { e.y = top; if (e.vy < 0) e.vy = Math.abs(e.vy) * 0.3; }
  }
  // blings circle the carp: they burst enemy shots and bite whoever comes close
  for (const b of S.blings) {
    b.t -= rdt; b.a += rdt * 3.4;
    const q = blingPos(b);
    for (const x of G.eb) if (!x.dead && d2(x.x, x.y, q.x, q.y) < (x.r + 14) ** 2) { x.dead = true; puff(x.x, x.y); hitSpark(q.x, q.y); }
    for (const e of G.enemies) {
      if (e.dead || e.ally || e.harmless) continue;
      e.blT = (e.blT || 0) - rdt;
      if (e.blT <= 0 && d2(e.x, e.y, q.x, q.y) < (e.r + 14) ** 2) { e.blT = 0.3; damageEnemy(e, 6); hitSpark(q.x, q.y); }
    }
    const B = G.boss;
    if (B && B.vul && !B.dead) {
      B.blT = (B.blT || 0) - rdt;
      if (B.blT <= 0) for (const [cx, cy, cr] of bossCircles(B)) if (d2(q.x, q.y, cx, cy) < (cr + 14) ** 2) { B.blT = 0.25; damageBoss(3); hitSpark(q.x, q.y); break; }
    }
  }
  S.blings = S.blings.filter((b) => b.t > 0);
  // during the boss fight blings keep drifting over the canal
  if (G.phase === 'boss') { S.airT -= dt; if (S.airT <= 0) { S.airT = 9; F.air('bling'); } }
}
MOVES.fugu = function (e, dt) {
  e.x -= e.speed * dt;
  e.y = e.baseY + Math.sin(e.age * 1.5 + e.seed) * (e.wall ? 3 : 10);
  e.puffT = (e.puffT || 0) - dt;
  const h = heroHit();
  if (d2(e.x, e.y, h.x, h.y) < 170 * 170) e.puffT = Math.max(e.puffT, 0.5);
  e.puff = lerp(e.puff || 0, e.puffT > 0 ? 1 : 0, Math.min(1, dt * 9));
  e.r = 19 + 19 * e.puff;
};
// bubbles only make a pufferfish swell; a bling, a superstrike or a friend can pop it
function fuguShield(e, dmg) {
  if (e.kind !== 'fugu' || e.ally || dmg >= 5) return false;
  e.puffT = 2.2; e.flash = 0.06;
  return true;
}

/* ---------- the koi */
const KOI_COLS = ['#ff5a3c', '#ffd43b', '#5cc94a', '#4dabf7', '#c77dff', '#ff8fc0', '#fffaf0'];
const KOA = {
  *balls(b) {
    say(b, pick(['Лови разноцветные шарики!', 'Шарики! Все цвета радуги!']));
    for (let v = 0; v < (b.phase2 ? 4 : 3); v++) {
      b.mouth = 1; const q = bp(b, -205, 8), n = b.phase2 ? 7 : 5, base = aimAt(q.x, q.y);
      for (let i = 0; i < n; i++) ebullet(q.x, q.y, base + (i - (n - 1) / 2) * 0.18, 240, { col: KOI_COLS[(i + v) % KOI_COLS.length], r: 8 });
      sfx('bubble'); yield* wait(0.3); b.mouth = 0.2; yield* wait(0.25);
    }
    b.mouth = 0;
  },
  *summon(b) {
    say(b, pick(['Карпики, ко мне!', 'Малыши, плывите сюда!']));
    for (let k = 0; k < (b.phase2 ? 6 : 4); k++) { later(k * 0.22, () => enemy('koilet', W + 40, wy(0.1 + ((k * 0.37) % 0.8)), { amp: 30, freq: 3, phase: k, seed: k })); }
    yield* wait(1.4);
  },
  *rainbow(b) {
    say(b, 'Радужный водоворот!');
    let a = rand(0, TAU);
    for (let k = 0; k < (b.phase2 ? 34 : 26); k++) {
      const q = bp(b, -60, 0);
      ebullet(q.x, q.y, a, 190, { col: KOI_COLS[k % KOI_COLS.length], r: 7 }); ebullet(q.x, q.y, a + Math.PI, 190, { col: KOI_COLS[(k + 3) % KOI_COLS.length], r: 7 });
      a += 0.36; yield* wait(0.09);
    }
    yield* wait(0.4);
  },
  // a solid column of balls from the surface to the bottom: jump over it
  *wall(b) {
    say(b, pick(['Стена шариков! Попробуй перепрыгни!', 'От этой стены не уплыть!']));
    for (let v = 0; v < (b.phase2 ? 2 : 1); v++) {
      b.mouth = 1; sfx('charge'); yield* wait(0.5);
      const x = b.x - 200; let i = 0;
      for (let y = SURF + 14; y < H - 36; y += 26) ebullet(x, y, Math.PI, 105, { col: KOI_COLS[i++ % KOI_COLS.length], r: 9 });
      G.c12.hints.push({ x, vx: -105 * DIFF * (1 + (G.lvlDiff - 1) * 0.5) });
      sfx('throw'); b.mouth = 0; yield* wait(1.7);
    }
  },
  // the koi itself leaps out of the water and flops back with a ring of balls
  *leap(b) {
    say(b, 'Прыжок через Врата Дракона!');
    b.telegraphUp = 0.6; sfx('charge'); yield* wait(0.6); b.telegraphUp = 0;
    const y0 = b.y, x0 = b.x, x1 = clamp(heroHit().x + 260, W * 0.45, W - 220);
    c12Splash(b.x - 60, 1.6);
    for (let t = 0; t < 1.05;) { t += yield; const k = Math.min(1, t / 1.05); b.y = y0 - Math.sin(k * Math.PI) * (y0 - (SURF - 110)); b.x = lerp(x0, x1, k); b.leapK = k; }
    b.leapK = 0; b.y = y0; c12Splash(b.x - 60, 1.8); G.shake = Math.max(G.shake, 10);
    for (let k = 0; k < (b.phase2 ? 2 : 1); k++) {
      const q = bp(b, -40, 0), n = 16; for (let i = 0; i < n; i++) ebullet(q.x, q.y, (i / n) * TAU + k * 0.2, 185, { col: KOI_COLS[i % KOI_COLS.length], r: 7 });
      sfx('bubble'); yield* wait(0.45);
    }
  },
  *ram(b) {
    say(b, pick(['С дороги, карась!', 'Сейчас боднусь!']));
    yield* moveTo(b, b.x, clamp(heroHit().y, SURF + 100, H - 110), 0.5);
    b.mouth = 1; yield* dash(b, 1000);
  },
};
function* koiBrain(b) {
  yield* moveTo(b, W - 260, SURF + 190, 2.6);
  b.vul = true;
  say(b, 'Ни хао, карась! Это мой канал!');
  yield* wait(1.2);
  const list = ['balls', 'summon', 'wall', 'rainbow', 'leap', 'summon', 'ram', 'wall'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(240, 280), bossY(b), b.phase2 ? 0.7 : 1.0);
    yield* KOA[list[i++ % list.length]](b);
    yield* wait((b.phase2 ? 0.45 : 0.8) / G.lvlDiff);
  }
}
OUTRO.koi = { a: null, b: null, lines: ['Карп кои очень разъярён!', 'Угадайте, кого он', 'призовёт на помощь…'], end: 'diver' };

/* ============================================================ art */
function koiPatches(c, spots, col) { c.fillStyle = col; for (const [x, y, rx, ry] of spots) { P(c); ell(c, x, y, rx, ry, 0.2); c.fill(); } }
Object.assign(ART, {
  // Zu cristatus, the scalloped ribbonfish: a silver ribbon with a tall red crest
  zu(c, e, t) {
    const w = Math.sin(t * 9 + e.seed);
    // red crest and the fin along the back
    P(c); c.moveTo(-20, -8); c.quadraticCurveTo(-30, -34, -14, -40 + w * 2); c.quadraticCurveTo(-12, -22, -6, -11); c.closePath(); fs(c, '#e63946', 2);
    P(c); c.moveTo(-8, -10); for (let x = -8; x <= 34; x += 7) c.lineTo(x + 3, -15 + (x + 8) * 0.19 + (x % 2 ? 0 : -2)); c.lineTo(36, -2); c.closePath(); fs(c, '#ff6b6b', 1.6);
    tube(c, [-16, 8, -22, 22 + w * 3], 1.6, '#e63946');
    // body tapers to a thin tail with a little fan turned up
    P(c); c.moveTo(-27, 0); c.quadraticCurveTo(-24, -12, -8, -11); c.quadraticCurveTo(20, -8, 40, -1 + w * 2); c.quadraticCurveTo(18, 6, -8, 11); c.quadraticCurveTo(-24, 11, -27, 0); c.closePath(); fs(c, '#d7dee8', 2.5);
    c.save(); c.clip(); c.fillStyle = 'rgba(60,70,95,0.55)'; for (const x of [-6, 4, 13, 21, 28]) c.fillRect(x, -12, 3.5, 24); c.restore();
    c.save(); c.translate(40, -1 + w * 2); c.rotate(-0.7 + w * 0.2); P(c); c.moveTo(0, 0); c.lineTo(12, -5); c.lineTo(12, 5); c.closePath(); fs(c, '#e63946', 1.6); c.restore();
    eye(c, -17, -2, 4.6, -0.25, 0.05, 0.9);
    line(c, [-27, 3, -22, 4], 1.6);
  },
  fugu(c, e, t) {
    const k = e.puff || 0, s = 1 + k, w = Math.sin(t * 12 + e.seed);
    c.scale(s, s);
    if (k > 0.15) { c.strokeStyle = INK; c.lineWidth = 1.4; for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; P(c); c.moveTo(Math.cos(a) * 17, Math.sin(a) * 16); c.lineTo(Math.cos(a) * (17 + 6 * k), Math.sin(a) * (16 + 6 * k)); c.stroke(); } }
    c.save(); c.translate(17, 0); c.rotate(w * 0.3); P(c); c.moveTo(0, 0); c.lineTo(9, -6); c.lineTo(9, 6); c.closePath(); fs(c, '#b89a4a', 1.8); c.restore();
    P(c); ell(c, 2, -15, 5, 3 + w, 0.3); fs(c, '#b89a4a', 1.6); P(c); ell(c, 4, 13, 5, 3 - w, -0.3); fs(c, '#b89a4a', 1.6);
    P(c); ell(c, 0, 0, 18, 16); fs(c, '#d9b85a', 2.4);
    c.save(); P(c); ell(c, 0, 0, 17, 15); c.clip();
    P(c); ell(c, 0, 12, 22, 12); c.fillStyle = '#fbf6e6'; c.fill();
    c.fillStyle = '#6b4a22'; for (const [x, y, r] of [[-4, -9, 2.6], [5, -10, 2.2], [11, -4, 1.9], [-11, -5, 1.8], [2, -3, 1.6]]) { P(c); circ(c, x, y, r); c.fill(); }
    c.restore();
    eye(c, -9, -4, 4.2, -0.2, 0.1, k > 0.4 ? 1.3 : 0);
    P(c); ell(c, -17, 3, 2.6, 2 + k); fs(c, '#e8837a', 1.4);
    // skull mark: do not touch
    if (k > 0.5) { c.globalAlpha = (k - 0.5) * 2; c.font = '900 9px ' + FONT_UI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#7a1f1f'; c.fillText('☠', 4, 6); c.globalAlpha = 1; }
  },
  // zebra shark: sandy, dotted, with a tail as long as the body
  zebra(c, e, t) {
    const w = Math.sin(t * 8 + e.seed);
    c.save(); c.translate(26, 0); c.rotate(w * 0.16); P(c); c.moveTo(0, -5); c.quadraticCurveTo(30, -12, 56, -16); c.quadraticCurveTo(48, -4, 30, 2); c.lineTo(0, 5); c.closePath(); fs(c, '#c9a35c', 2.4); c.restore();
    P(c); c.moveTo(-6, -12); c.lineTo(4, -26); c.lineTo(14, -11); c.closePath(); fs(c, '#b8914a', 2.2);
    P(c); c.moveTo(-14, 8); c.lineTo(-6, 24); c.lineTo(4, 9); c.closePath(); fs(c, '#b8914a', 2.2);
    P(c); c.moveTo(-40, 2); c.quadraticCurveTo(-36, -13, -10, -14); c.quadraticCurveTo(18, -12, 32, -3); c.quadraticCurveTo(18, 10, -10, 12); c.quadraticCurveTo(-34, 12, -40, 2); c.closePath(); fs(c, '#dcc07a', 2.8);
    c.save(); c.clip();
    P(c); ell(c, -6, 13, 34, 7); c.fillStyle = '#f6edd2'; c.fill();
    c.fillStyle = '#4a3418'; for (const [x, y] of [[-28, -4], [-20, -8], [-12, -3], [-4, -8], [4, -3], [12, -7], [20, -3], [-22, 2], [-8, 3], [8, 2], [26, -1]]) { P(c); circ(c, x, y, 1.9); c.fill(); }
    c.restore();
    line(c, [-22, 0, -22, 6], 1.3); line(c, [-18, 0, -18, 6], 1.3); line(c, [-14, 0, -14, 6], 1.3);
    eye(c, -30, -4, 3.4, -0.3, 0.1, 1.2);
    line(c, [-39, 5, -31, 7], 1.8);
  },
  koilet(c, e, t) {
    const w = Math.sin(t * 13 + e.seed), v = Math.floor(e.seed) % 3;
    c.save(); c.translate(15, 0); c.rotate(w * 0.3); P(c); c.moveTo(0, 0); c.quadraticCurveTo(12, -12, 16, -9); c.lineTo(10, 0); c.lineTo(16, 9); c.quadraticCurveTo(12, 12, 0, 0); c.closePath(); fs(c, '#fff3e6', 2); c.restore();
    P(c); c.moveTo(-6, -8); c.lineTo(2, -15); c.lineTo(8, -8); c.closePath(); fs(c, '#fff3e6', 1.8);
    P(c); ell(c, 0, 0, 18, 9); fs(c, v === 2 ? '#ffd166' : '#fffaf0', 2.4);
    c.save(); P(c); ell(c, 0, 0, 17, 8); c.clip();
    koiPatches(c, v === 1 ? [[-8, -3, 7, 5], [8, 2, 6, 4]] : [[-10, -4, 6, 4], [2, 1, 7, 5], [13, -3, 4, 3]], v === 1 ? '#22202b' : '#f2542d');
    c.restore();
    eye(c, -11, -2, 2.8, -0.3, 0.1, 1);
    line(c, [-17, 3, -21, 7], 1.2);
  },
});
function drawKoiBoss(c, b, t) {
  const m = b.mouth || 0, w = Math.sin(t * 4.2), angry = b.phase2;
  const white = angry ? '#fff1c9' : '#fffaf0', red = angry ? '#e02020' : '#f2542d', fin = angry ? 'rgba(255,200,90,0.92)' : 'rgba(255,240,228,0.92)';
  if (b.telegraphUp > 0) { c.save(); c.globalAlpha = 0.5 + 0.4 * Math.sin(t * 30); line(c, [-40, -90, -40, -150], 7, '#ff3d5a'); P(c); c.moveTo(-58, -140); c.lineTo(-40, -172); c.lineTo(-22, -140); c.closePath(); c.fillStyle = '#ff3d5a'; c.fill(); c.restore(); }
  if (b.leapK > 0) c.rotate(lerp(-0.6, 0.6, b.leapK));
  // long veil tail
  c.save(); c.translate(176, 0); c.rotate(w * 0.14);
  P(c); c.moveTo(0, -12); c.bezierCurveTo(40, -50, 80, -96, 128, -84 + w * 8); c.quadraticCurveTo(92, -40, 76, 0); c.quadraticCurveTo(92, 40, 128, 84 - w * 8); c.bezierCurveTo(80, 96, 40, 50, 0, 12); c.closePath(); fs(c, fin, 4);
  c.strokeStyle = 'rgba(214,120,90,0.6)'; c.lineWidth = 2; for (const a of [-0.55, -0.3, 0.3, 0.55]) { P(c); c.moveTo(8, a * 14); c.quadraticCurveTo(60, a * 110, 104, a * 136); c.stroke(); }
  c.restore();
  // dorsal sail and belly fins
  P(c); c.moveTo(-70, -52); c.bezierCurveTo(-40, -118, 40, -112, 104, -40); c.closePath(); fs(c, fin, 3.5);
  P(c); c.moveTo(-50, 46); c.quadraticCurveTo(-30, 108 + w * 5, 10, 92); c.quadraticCurveTo(-4, 66, 6, 50); c.closePath(); fs(c, fin, 3.5);
  P(c); c.moveTo(70, 40); c.quadraticCurveTo(84, 78 - w * 4, 112, 66); c.quadraticCurveTo(100, 46, 104, 30); c.closePath(); fs(c, fin, 3);
  // lower jaw
  c.save(); c.translate(-176, 18); c.rotate(m * 0.32);
  P(c); c.moveTo(4, -6); c.lineTo(-34, -4); c.quadraticCurveTo(-46, 4, -30, 14); c.lineTo(8, 16); c.closePath(); fs(c, white, 3.5); c.restore();
  const body = () => { P(c); c.moveTo(-218, 0); c.bezierCurveTo(-208, -50, -120, -68, -30, -64); c.bezierCurveTo(70, -60, 150, -34, 190, -12); c.lineTo(190, 14); c.bezierCurveTo(140, 44, 40, 66, -60, 62); c.bezierCurveTo(-150, 58, -206, 40, -218, 0); c.closePath(); };
  body(); fs(c, white, 4.5);
  c.save(); body(); c.clip();
  koiPatches(c, [[-150, -40, 52, 30], [-30, -44, 60, 30], [70, -20, 48, 28], [-80, 34, 34, 16], [150, -4, 30, 18]], red);
  koiPatches(c, [[-10, -26, 16, 9], [96, -34, 14, 8], [-112, 6, 12, 7], [40, 30, 14, 8]], '#22202b');
  c.strokeStyle = 'rgba(120,90,70,0.28)'; c.lineWidth = 2;
  for (let x = -110; x < 170; x += 26) for (let y = -44; y <= 44; y += 22) { P(c); c.arc(x + ((y / 22) % 2 ? 13 : 0), y, 12, -1.1, 1.1); c.stroke(); }
  if (angry) { c.fillStyle = 'rgba(255,196,60,0.22)'; c.fillRect(-230, -80, 440, 160); }
  c.restore();
  // gill cover, whiskers, pectoral fin
  P(c); c.moveTo(-124, -46); c.quadraticCurveTo(-98, 0, -124, 44); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  P(c); c.moveTo(-100, 14); c.quadraticCurveTo(-70, 60 + w * 6, -30, 46); c.quadraticCurveTo(-56, 30, -62, 10); c.closePath(); fs(c, fin, 3);
  for (const s of [0, 1]) tube(c, [-204, 14 + s * 6, -226, 30 + s * 10 + w * 4, -236 - s * 6, 52 + s * 8 + w * 7], 2.4, '#f2a65a');
  // eye
  P(c); circ(c, -172, -16, 14); fs(c, '#fff', 3);
  P(c); circ(c, -175, -15, 7); c.fillStyle = angry ? '#e02020' : INK; c.fill();
  P(c); circ(c, -177, -18, 2.4); c.fillStyle = '#fff'; c.fill();
  line(c, [-194, -40, -154, -30], 5.5);
  // red sun mark on the forehead
  P(c); circ(c, -196, -6, 8); c.fillStyle = red; c.fill();
}

/* ---------- the carp's straw hat (drawn over the head, in head space) */
function drawChinaHat(c, hw, hh) {
  c.save(); c.translate(-hw * 0.02, -hh * 0.36); c.rotate(-0.1);
  const r = hw * 0.74, up = hh * 0.52;
  tube(c, [-r * 0.5, 2, -r * 0.2, hh * 0.56, 0, hh * 0.62], 1.2, '#b23a2a');
  P(c); c.moveTo(-r, 4); c.quadraticCurveTo(-r * 0.3, -up * 0.75, 0, -up); c.quadraticCurveTo(r * 0.3, -up * 0.75, r, 4); c.quadraticCurveTo(0, 15, -r, 4); c.closePath(); fs(c, '#e8c66a', 2.6);
  c.save(); c.clip(); c.strokeStyle = 'rgba(130,90,30,0.55)'; c.lineWidth = 1.2;
  for (const k of [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75]) { P(c); c.moveTo(0, -up); c.lineTo(r * k, 12); c.stroke(); }
  for (const k of [0.4, 0.7]) { P(c); c.moveTo(-r * k, 4 - up * (1 - k) * 0.95); c.quadraticCurveTo(0, 12 - up * (1 - k) * 1.1 + 8 * k, r * k, 4 - up * (1 - k) * 0.95); c.stroke(); }
  c.restore();
  P(c); circ(c, 0, -up, 2.6); fs(c, '#b23a2a', 1.4);
  c.restore();
}

/* ---------- pickups in the air and the blings */
function drawBling(c, x, y, t, s) {
  c.save(); c.translate(x, y); const k = (s || 1) * (1 + Math.sin(t * 8) * 0.08); c.scale(k, k); c.rotate(Math.sin(t * 3) * 0.2);
  P(c); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU - Math.PI / 2, r = i % 2 ? 5.5 : 17; if (i) c.lineTo(Math.cos(a) * r, Math.sin(a) * r); else c.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  c.closePath(); fs(c, '#ff4fd8', 2.6);
  P(c); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU - Math.PI / 2, r = i % 2 ? 2.6 : 9; if (i) c.lineTo(Math.cos(a) * r, Math.sin(a) * r); else c.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  c.closePath(); c.fillStyle = '#ffd6f6'; c.fill();
  P(c); starPath(c, 11, -11, 4.5, 1.8, 4); c.fillStyle = '#fff'; c.fill();
  c.restore();
}
// a prize in the air hangs under a little red lantern
function drawAirLantern(c, k, t) {
  c.save(); c.translate(k.x, k.y - 44 + Math.sin(t * 3 + k.age) * 1.5);
  line(c, [0, 12, 0, 26], 1.6, '#7a4a22');
  P(c); ell(c, 0, 0, 13, 11); fs(c, '#e63946', 2.2);
  c.strokeStyle = 'rgba(255,210,90,0.9)'; c.lineWidth = 1.3; for (const q of [-6, 0, 6]) { P(c); c.moveTo(q, -10); c.quadraticCurveTo(q * 1.5, 0, q, 10); c.stroke(); }
  P(c); c.rect(-6, -14, 12, 4); fs(c, '#ffcf4a', 1.6); P(c); c.rect(-5, 10, 10, 3); fs(c, '#ffcf4a', 1.6);
  c.restore();
}
function drawC12Blings(c, t) {
  if (!G.china) return;
  for (const b of G.c12.blings) {
    if (b.t < 2 && Math.floor(b.t * 10) % 2) continue;
    const q = blingPos(b);
    glow(c, q.x, q.y, 26, 'rgba(255,110,220,A)', 0.5);
    drawBling(c, q.x, q.y, t + b.a, 0.8);
  }
}

/* ---------- things in the river: fences, nets, the gate, jump hints */
function drawJumpHint(c, x, t, label) {
  const y = SURF - 58 + Math.sin(t * 9) * 5, cx = clamp(x, 90, W - 90);
  c.save(); c.translate(cx, y);
  P(c); c.moveTo(-34, 30); c.quadraticCurveTo(-30, -6, 6, -8); c.lineWidth = 9; c.strokeStyle = INK; c.lineCap = 'round'; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#ffe14d'; c.stroke();
  P(c); c.moveTo(2, -20); c.lineTo(24, -8); c.lineTo(2, 4); c.closePath(); fs(c, '#ffe14d', 2.5);
  c.font = '900 17px ' + FONT_UI; c.textAlign = 'center'; c.textBaseline = 'middle'; otext(c, label || 'ПРЫГАЙ!', 0, -38, '#ffe14d', 5);
  c.restore();
}
function drawC12World(c, t) {
  if (!G.china) return;
  const h = heroHit();
  for (const w of G.c12.walls) {
    const x = w.x, top = w.top, bot = H - 30;
    if (w.kind === 'bamboo') {
      for (const dx of [-12, 0, 12]) {
        const ty = top + Math.abs(dx) * 0.5;
        P(c); c.moveTo(x + dx - 5, bot); c.lineTo(x + dx - 5, ty + 8); c.lineTo(x + dx, ty); c.lineTo(x + dx + 5, ty + 8); c.lineTo(x + dx + 5, bot); c.closePath(); fs(c, dx ? '#8fbf4f' : '#a5cf5f', 2.2);
        c.strokeStyle = 'rgba(40,70,20,0.7)'; c.lineWidth = 1.6; for (let y = ty + 26; y < bot; y += 34) { P(c); c.moveTo(x + dx - 5, y); c.lineTo(x + dx + 5, y); c.stroke(); }
      }
      for (const y of [top + 22, SURF + 110, SURF + 230]) { P(c); rr(c, x - 20, y, 40, 7, 3); fs(c, '#c9a35c', 1.8); }
    } else if (w.kind === 'net') {
      c.save(); P(c); c.rect(x - 13, SURF - 2, 26, bot - SURF + 2); c.clip();
      c.strokeStyle = 'rgba(240,232,205,0.85)'; c.lineWidth = 1.5;
      for (let y = SURF - 30; y < bot + 30; y += 14) { P(c); c.moveTo(x - 13, y); c.lineTo(x + 13, y + 26); c.moveTo(x + 13, y); c.lineTo(x - 13, y + 26); c.stroke(); }
      c.restore();
      line(c, [x - 13, SURF - 2, x - 13, bot], 2.4, '#efe6cf'); line(c, [x + 13, SURF - 2, x + 13, bot], 2.4, '#efe6cf');
      for (const dx of [-13, 0, 13]) { P(c); circ(c, x + dx, top + 8 + Math.sin(t * 4 + dx) * 2, 8); fs(c, dx ? '#e63946' : '#fffaf0', 2.2); }
      P(c); rr(c, x - 16, bot - 6, 32, 9, 4); fs(c, '#6b6f7a', 2);
    } else {
      // dragon gate: red pillars and a tiled roof over a stone weir with water pouring across
      for (const s of [-1, 1]) { P(c); c.rect(x + s * 74 - 7, 34, 14, SURF - 30); fs(c, '#c0392b', 2.4); P(c); c.rect(x + s * 74 - 10, SURF - 14, 20, 12); fs(c, '#8a8f99', 2); }
      P(c); c.rect(x - 92, 44, 184, 12); fs(c, '#c0392b', 2.4);
      P(c); c.moveTo(-112 + x, 34); c.quadraticCurveTo(x - 96, 26, x - 86, 12); c.lineTo(x + 86, 12); c.quadraticCurveTo(x + 96, 26, x + 112, 34); c.quadraticCurveTo(x, 22, x - 112, 34); c.closePath(); fs(c, '#2f6f5e', 2.6);
      P(c); rr(c, x - 34, 24, 68, 18, 4); fs(c, '#22202b', 2); c.font = '900 12px ' + FONT_UI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffd43b'; c.fillText('龍 門', x, 33.5);
      P(c); c.rect(x - 30, top, 60, bot - top + 6); fs(c, '#7f8792', 3);
      c.strokeStyle = 'rgba(40,46,58,0.55)'; c.lineWidth = 1.6;
      for (let y = top + 22, r = 0; y < bot; y += 22, r++) { P(c); c.moveTo(x - 30, y); c.lineTo(x + 30, y); for (let q = -30 + (r % 2 ? 15 : 0); q < 30; q += 30) { c.moveTo(x + q, y); c.lineTo(x + q, y - 22); } c.stroke(); }
      c.fillStyle = 'rgba(235,252,255,0.75)'; for (let i = 0; i < 5; i++) { const fx = x - 26 + i * 13; P(c); rr(c, fx - 4, top - 5 + Math.sin(t * 9 + i) * 2, 9, 30 + ((t * 60 + i * 17) % 22), 4); c.fill(); }
    }
    if (!w.done && x > h.x + 40 && x < W + 60) drawJumpHint(c, x, t);
  }
  for (const q of G.c12.hints) if (q.x < W + 60) drawJumpHint(c, q.x, t);
}

/* ---------- background: sky, misty hills, pagodas and blossoming sakura, the river below */
function chinaRoof(c, x, y, hw, hh, col) {
  P(c); c.moveTo(x - hw - 8, y + 3); c.quadraticCurveTo(x - hw + 2, y - 1, x - hw * 0.55, y - hh); c.lineTo(x + hw * 0.55, y - hh); c.quadraticCurveTo(x + hw - 2, y - 1, x + hw + 8, y + 3);
  c.quadraticCurveTo(x, y - 4, x - hw - 8, y + 3); c.closePath(); c.fillStyle = col; c.fill();
}
function chinaPagoda(c, x, base, s, tiers) {
  let y = base;
  for (let i = 0; i < tiers; i++) {
    const hw = (26 - i * 3.6) * s, bh = 17 * s;
    c.fillStyle = '#b8402f'; c.fillRect(x - hw * 0.72, y - bh, hw * 1.44, bh);
    c.fillStyle = '#f4e3b8'; for (const q of [-0.4, 0, 0.4]) c.fillRect(x + q * hw - 2 * s, y - bh * 0.7, 4 * s, bh * 0.45);
    y -= bh; chinaRoof(c, x, y, hw, 8 * s, '#33485c'); y -= 8 * s;
  }
  c.fillStyle = '#e0b040'; c.fillRect(x - 1.5 * s, y - 14 * s, 3 * s, 14 * s); P(c); circ(c, x, y - 15 * s, 3 * s); c.fill();
}
function chinaHouse(c, x, base, s, lanterns, t) {
  const hw = 46 * s, bh = 30 * s;
  c.fillStyle = '#f1e2c0'; c.fillRect(x - hw * 0.82, base - bh, hw * 1.64, bh);
  c.fillStyle = '#b8402f'; for (const q of [-0.8, -0.4, 0, 0.4, 0.8]) c.fillRect(x + q * hw - 2.5 * s, base - bh, 5 * s, bh);
  c.fillStyle = '#5b3a24'; c.fillRect(x - 7 * s, base - bh * 0.72, 14 * s, bh * 0.72);
  chinaRoof(c, x, base - bh, hw, 20 * s, '#2f6f5e');
  c.fillStyle = '#e0b040'; c.fillRect(x - hw * 0.55, base - bh - 22 * s, hw * 1.1, 3 * s);
  if (lanterns) for (const q of [-0.6, 0.6]) { const lx = x + q * hw, ly = base - bh + 9 * s + Math.sin(t * 2 + lx) * 1.5; c.fillStyle = '#e63946'; P(c); ell(c, lx, ly, 4.5 * s, 5.5 * s); c.fill(); c.fillStyle = '#ffcf4a'; c.fillRect(lx - 2 * s, ly - 7 * s, 4 * s, 2 * s); }
}
function chinaSakura(c, x, base, s, seed) {
  c.strokeStyle = '#5b3a2a'; c.lineCap = 'round';
  c.lineWidth = 6 * s; P(c); c.moveTo(x, base); c.quadraticCurveTo(x - 6 * s, base - 26 * s, x + 4 * s, base - 46 * s); c.stroke();
  c.lineWidth = 3.4 * s; P(c); c.moveTo(x - 1 * s, base - 28 * s); c.quadraticCurveTo(x - 20 * s, base - 40 * s, x - 28 * s, base - 54 * s); c.moveTo(x + 2 * s, base - 36 * s); c.quadraticCurveTo(x + 20 * s, base - 44 * s, x + 30 * s, base - 58 * s); c.stroke();
  const R = mulberry(seed);
  for (let i = 0; i < 13; i++) { const bx = x + (R() - 0.5) * 84 * s, by = base - (44 + R() * 40) * s, r = (10 + R() * 9) * s; c.fillStyle = ['#ffb7d5', '#ff9ec4', '#ffd1e3', '#fbc4dc'][i % 4]; P(c); circ(c, bx, by, r); c.fill(); }
}
const CHINA_SCENE = [[60, 'pagoda', 1.25, 5], [210, 'tree', 1.1], [330, 'house', 1], [470, 'tree', 0.9], [560, 'tree', 1.25], [700, 'pagoda', 0.95, 3], [820, 'house', 1.15], [960, 'tree', 1.05], [1090, 'pagoda', 1.4, 6], [1250, 'tree', 1.2], [1370, 'house', 0.9], [1500, 'tree', 1]];
function drawChina(c, t) {
  const ck = G.canalK || 0, shore = SURF - 8;
  let g = c.createLinearGradient(0, 0, 0, SURF);
  g.addColorStop(0, '#8fd0ee'); g.addColorStop(0.7, '#fde6d6'); g.addColorStop(1, '#ffeede');
  c.fillStyle = g; c.fillRect(0, 0, W, SURF + 4);
  glow(c, W * 0.8, 46, 80, 'rgba(255,150,120,A)', 0.4); P(c); circ(c, W * 0.8, 46, 24); c.fillStyle = '#ff7a66'; c.fill();
  // misty karst hills
  for (const [sp, col, hgt, f] of [[7, '#b9cfe0', 104, 0.011], [13, '#9dbccb', 78, 0.017]]) {
    c.fillStyle = col; P(c); c.moveTo(0, SURF);
    for (let x = 0; x <= W + 16; x += 16) { const u = (x + t * sp) * f; c.lineTo(x, SURF - 26 - hgt * Math.pow(Math.abs(Math.sin(u) * Math.sin(u * 0.37 + 1)), 0.7)); }
    c.lineTo(W + 16, SURF); c.closePath(); c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, SURF - 52, W, 46);
  // the bank with buildings and trees
  const L = 1620, off = (t * 34) % L;
  c.fillStyle = '#86b86a'; P(c); c.moveTo(0, SURF); for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, shore - 4 + Math.sin((x + off) * 0.02) * 3); c.lineTo(W + 20, SURF); c.closePath(); c.fill();
  for (const [ix, type, s, n] of CHINA_SCENE) {
    for (let x = ix - off; x < W + 140; x += L) {
      if (x < -140) continue;
      if (type === 'pagoda') chinaPagoda(c, x, shore - 2, s, n);
      else if (type === 'house') chinaHouse(c, x, shore - 2, s, ck > 0.5, t);
      else chinaSakura(c, x, shore, s, Math.round(ix));
    }
  }
  // canal: a stone embankment with lanterns and humpback bridges behind it
  if (ck > 0) {
    c.save(); c.globalAlpha = ck;
    const o2 = (t * 46) % 520;
    for (let x = 260 - o2; x < W + 260; x += 520) {
      P(c); c.moveTo(x - 110, SURF - 30); c.quadraticCurveTo(x, SURF - 92, x + 110, SURF - 30); c.lineTo(x + 110, SURF - 18); c.quadraticCurveTo(x, SURF - 72, x - 110, SURF - 18); c.closePath(); c.fillStyle = '#a9b0ba'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#6b7280'; c.stroke();
      c.strokeStyle = '#c0392b'; c.lineWidth = 2.5; P(c); c.moveTo(x - 104, SURF - 38); c.quadraticCurveTo(x, SURF - 102, x + 104, SURF - 38); c.stroke();
    }
    c.fillStyle = '#8d949f'; c.fillRect(0, SURF - 32, W, 34);
    c.strokeStyle = 'rgba(50,56,68,0.5)'; c.lineWidth = 1.4; const o3 = (t * 46) % 44;
    P(c); for (const y of [SURF - 32, SURF - 21, SURF - 10]) { c.moveTo(0, y); c.lineTo(W, y); } for (let x = -o3; x < W + 44; x += 44) { c.moveTo(x, SURF - 32); c.lineTo(x, SURF - 21); c.moveTo(x + 22, SURF - 21); c.lineTo(x + 22, SURF - 10); c.moveTo(x, SURF - 10); c.lineTo(x, SURF); } c.stroke();
    const o4 = (t * 46) % 130;
    for (let x = -o4; x < W + 130; x += 130) { const ly = SURF - 46 + Math.sin(t * 2.4 + x * 0.05) * 2; line(c, [x, SURF - 32, x, ly - 8], 1.5, '#5b3a24'); P(c); ell(c, x, ly, 7, 8.5); c.fillStyle = '#e63946'; c.fill(); c.fillStyle = '#ffcf4a'; c.fillRect(x - 3, ly - 11, 6, 3); c.fillRect(x - 3, ly + 8, 6, 3); }
    c.restore();
  }
  // the river
  g = c.createLinearGradient(0, SURF, 0, H);
  g.addColorStop(0, '#49c7b4'); g.addColorStop(0.5, '#1f8a96'); g.addColorStop(1, '#0d4a60');
  c.fillStyle = g; c.fillRect(0, SURF, W, H - SURF);
  for (let i = 0; i < 5; i++) {
    const x = wrap(i * 270 - t * 12, -200, W + 150), sw = Math.sin(t * 0.5 + i * 1.7) * 30;
    const rg = c.createLinearGradient(0, SURF, 0, H * 0.95); rg.addColorStop(0, 'rgba(255,255,255,0.16)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = rg; P(c); c.moveTo(x - 24, SURF); c.lineTo(x + 36, SURF); c.lineTo(x + 130 + sw, H * 0.95); c.lineTo(x + 30 + sw, H * 0.95); c.closePath(); c.fill();
  }
  // bottom: pebbles and reeds (cut stone slabs in the canal)
  const ob = (t * 60) % 180;
  c.fillStyle = ck > 0.5 ? '#59616e' : '#6b5a3c'; P(c); c.moveTo(0, H - 34); for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, H - 34 + Math.sin((x + ob) * 0.05) * (ck > 0.5 ? 1 : 5)); c.lineTo(W + 20, H); c.lineTo(0, H); c.closePath(); c.fill();
  for (let x = -ob; x < W + 180; x += 180) {
    c.fillStyle = ck > 0.5 ? '#7b8492' : '#8d7a55'; P(c); ell(c, x + 30, H - 34, 24, 11); ell(c, x + 96, H - 28, 16, 8); c.fill();
    for (let j = 0; j < 3; j++) { const bx = x + 130 + j * 11, sw = Math.sin(t * 1.5 + x * 0.01 + j) * 9, top = H - 120 - j * 22; line(c, [bx, H - 34, bx + sw * 0.5, (H - 34 + top) / 2, bx + sw, top], 4, j % 2 ? '#2f8f5a' : '#3fae6a'); }
  }
  // the surface: ripples, lotus leaves, petals on the water
  c.fillStyle = 'rgba(225,252,250,0.5)'; P(c); c.moveTo(0, SURF - 3);
  for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, SURF + 4 + Math.sin(x * 0.03 + t * 2.4) * 4); c.lineTo(W + 20, SURF - 3); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2.5;
  P(c); for (let x = 0; x <= W + 20; x += 20) { const y = SURF + 4 + Math.sin(x * 0.03 + t * 2.4) * 4; if (x) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke();
  const ol = (t * 60) % 330;
  for (let x = 120 - ol; x < W + 330; x += 330) {
    const y = SURF + 3 + Math.sin(x * 0.03 + t * 2.4) * 2;
    P(c); c.moveTo(x, y); c.ellipse(x, y, 24, 6, 0, 0.35, TAU - 0.35); c.closePath(); c.fillStyle = '#4fae5a'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#2f6f3a'; c.stroke();
    if (Math.round((x + ol) / 330) % 2) { c.fillStyle = '#ff9ec4'; for (const a of [-0.7, 0, 0.7]) { P(c); ell(c, x + 30 + Math.sin(a) * 7, y - 6 - Math.cos(a) * 3, 4, 8, a); c.fill(); } c.fillStyle = '#ffe14d'; P(c); circ(c, x + 30, y - 3, 2.6); c.fill(); }
  }
  // falling petals
  for (let i = 0; i < 16; i++) {
    const fall = (i * 53 + t * (16 + (i % 4) * 5)) % (SURF + 30), x = wrap(i * 97 - t * 40 + Math.sin(t * 1.3 + i) * 18, -20, W + 20);
    c.fillStyle = i % 2 ? '#ffc2dc' : '#ffe0ee'; P(c); ell(c, x, Math.min(fall, SURF + 3), 4.5, 2.2, fall < SURF ? t * 2 + i : 0); c.fill();
  }
}
function drawChinaStamp(c, b) {
  c.font = '54px ' + FONT_DISPLAY;
  const w = c.measureText(b.text).width + 80;
  P(c); rr(c, -w / 2 + 7, -52, w, 124, 14); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fill();
  P(c); rr(c, -w / 2, -60, w, 124, 14); fs(c, '#c8102e', 6);
  P(c); rr(c, -w / 2 + 10, -50, w - 20, 104, 9); c.lineWidth = 3; c.strokeStyle = '#ffd43b'; c.stroke();
  otext(c, b.text, 0, -12, '#ffd43b', 8);
  if (b.sub) { c.font = '900 22px ' + FONT_UI; c.fillStyle = '#fff6e5'; c.fillText(b.sub, 0, 36); }
}

// ending hint: a torch beam sweeps the dark, bubbles rise in a column, a shape in flippers swims across
function drawDiverEnd(c, k) {
  const e = clamp((k - 8.7) / 2.3, 0, 1); if (e <= 0 || e >= 1) return;
  const vis = Math.sin(e * Math.PI), x = lerp(SW + 160, -220, e), y = SH * 0.78 + Math.sin(e * 7) * 8;
  c.save();
  // torch beam
  c.globalAlpha = 0.16 * vis; const a = 2.75 + Math.sin(k * 2.2) * 0.22;
  P(c); c.moveTo(x - 74, y + 4); c.lineTo(x - 74 + Math.cos(a - 0.2) * 520, y + 4 + Math.sin(a - 0.2) * 520); c.lineTo(x - 74 + Math.cos(a + 0.2) * 520, y + 4 + Math.sin(a + 0.2) * 520); c.closePath(); c.fillStyle = '#fff3b0'; c.fill();
  // the silhouette: mask, air tank, flippers
  c.globalAlpha = 0.6 * vis; c.fillStyle = '#0d2029'; c.strokeStyle = 'rgba(130,210,230,0.6)'; c.lineWidth = 2;
  const kick = Math.sin(k * 9) * 0.35;
  P(c); ell(c, x, y, 62, 17); c.fill(); c.stroke();
  P(c); rr(c, x - 22, y - 30, 58, 15, 7); c.fill(); c.stroke();
  P(c); circ(c, x - 66, y - 3, 17); c.fill(); c.stroke();
  for (const s of [-1, 1]) { c.save(); c.translate(x + 58, y + s * 5); c.rotate(s * kick); P(c); c.moveTo(0, -4); c.lineTo(46, -5); c.lineTo(96, -17); c.lineTo(96, 17); c.lineTo(46, 5); c.lineTo(0, 4); c.closePath(); c.fill(); c.stroke(); c.restore(); }
  c.globalAlpha = 0.8 * vis; P(c); rr(c, x - 82, y - 11, 19, 14, 4); c.fillStyle = 'rgba(150,230,255,0.55)'; c.fill();
  // bubbles from the regulator
  c.globalAlpha = 0.55 * vis; c.strokeStyle = 'rgba(200,245,255,0.9)'; c.lineWidth = 1.6;
  for (let i = 0; i < 12; i++) { const u = (k * 0.9 + i * 0.137) % 1; P(c); circ(c, x - 60 + i * 9 + Math.sin(u * 9 + i) * 7, y - 20 - u * 190, 2.5 + (i % 4) * 1.6); c.stroke(); }
  c.restore();
}
