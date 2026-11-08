/* ============================================================ duck level 3: flight, landing, Sonic-style run, shawarma boss */
LEVEL_INFO[3].duck = { name: 'Посадка и забег', boss: 'shawarma', song: 'sky2' };
const LEVEL3_DUCK = [
  [2.0, () => F.swarm(6, 0.3)],
  [4.5, () => F.line('grunt', 5, 0.7)],
  [7.0, () => F.carrier('power', 0.5)],
  [8.5, () => F.lance([0.3, 0.7])],
  [11.0, () => F.divers([0.25, 0.75])],
  [14.0, () => F.shooters([0.3, 0.7])],
  [17.0, () => F.health(0.5)],
  [18.0, () => F.heavy2()],
  [24.0, () => F.vee('grunt', 5, 0.5)],
  [27.0, () => F.swarm(8, 0.4)],
  [31.0, () => startLanding()],
];
// distances in metres; z = metres in front of the camera; the duck runs at z = PZ
const RUN = { PZ: 4.2, LANE: 2.1, HALF: 3.4, G: 36, JUMP: 13.5, SPRING: 21, BASE: 19.2, MAXS: 24.8, BOSS_AT: 1800, ZMAX: 95 };
const SURFACES = [[0, 'grass'], [520, 'sand'], [900, 'ice'], [1250, 'road']];
const SURF_NAME = { grass: ['ЗЕЛЁНЫЕ ХОЛМЫ', 'Беги по траве'], sand: ['ПЛЯЖ', 'Песок замедляет бег'], ice: ['КАТОК', 'Скользко! Дорожки меняются с заносом'], road: ['ГОРОД', 'Скоро шаверма…'] };
function surfaceAt(d) { let s = 'road'; for (const [d0, k] of SURFACES) if (d >= d0) s = k; return s; }
const laneX = (l) => (l - 1) * RUN.LANE;

function buildTrack() {
  const Rn = mulberry(77), objs = [];
  const add = (o) => objs.push(Object.assign({ x: 0, h: 0, dead: false }, o));
  const cups = (d0, lane, n, gap, h, arc) => { for (let i = 0; i < n; i++) add({ type: 'cup', d: d0 + i * gap, x: laneX(lane), h: h + (arc ? Math.sin((i / Math.max(1, n - 1)) * Math.PI) * arc : 0) }); };
  let d = 70;
  const loopsDone = new Set();
  while (d < RUN.BOSS_AT - 70) {
    // loops: no obstacles, just a ribbon of coffee around the loop
    const lr = planRanges().find(([a, b, ty]) => ty === 'loop' && d > a - 22 && d < b + 10);
    if (lr) { if (!loopsDone.has(lr[0])) { loopsDone.add(lr[0]); cups(lr[0] - 6, 1, Math.floor((lr[1] - lr[0] + 6) / 3), 3, 0.5); } d = lr[1] + 14; continue; }
    const pool = d < 250 ? ['jump', 'jump', 'free'] : d < 420 ? ['jump', 'roll', 'roll', 'free'] : ['jump', 'roll', 'lanes', 'enemy', 'enemy', 'spring', 'dash', 'combo', 'wall', 'hole'];
    const pat = pool[Math.floor(Rn() * pool.length)], L = Math.floor(Rn() * 3), L2 = (L + 1 + Math.floor(Rn() * 2)) % 3, L3 = 3 - L - L2;
    switch (pat) {
      case 'free': cups(d, L, 8, 2.6, 0.5); break;
      case 'jump': add({ type: Rn() < 0.5 ? 'barrier' : 'spikes', d, x: laneX(L) }); if (d > 150) add({ type: 'barrier', d, x: laneX(L2) }); cups(d - 9, L, 7, 3, 0.5, 2.3); break;
      case 'roll': add({ type: 'bar', d, x: laneX(L) }); if (Rn() < 0.6) add({ type: 'bar', d, x: laneX(L2) }); cups(d - 6, L, 5, 3, 0.35); break;
      case 'lanes': add({ type: 'cone', d, x: laneX(L) }); add({ type: 'cone', d: d + 6, x: laneX(L2) }); cups(d - 6, L3, 6, 3, 0.5); break;
      case 'enemy': add({ type: 'pigeon', d, x: laneX(L) }); add({ type: 'crow', d: d + 10, x: laneX(L2), h: 1.6 }); cups(d - 6, L3, 6, 3, 0.5); break;
      case 'spring': add({ type: 'spring', d, x: laneX(L) }); cups(d + 5, L, 8, 3.2, 1.5, 4.2); add({ type: 'barrier', d: d + 14, x: laneX(L) }); break;
      case 'dash': add({ type: 'dash', d, x: laneX(L) }); cups(d + 4, L, 8, 3.5, 0.5); break;
      case 'combo': add({ type: 'barrier', d, x: laneX(L) }); add({ type: 'bar', d, x: laneX(L2) }); cups(d - 4, L3, 5, 3, 0.5); break;
      case 'wall': for (let k = 0; k < 3; k++) add({ type: 'barrier', d, x: laneX(k) }); cups(d - 8, 1, 6, 3, 0.5, 2.2); break;
      case 'hole': add({ type: 'hole', d, x: laneX(L) }); add({ type: 'hole', d: d + 9, x: laneX(L2) }); cups(d - 8, L3, 6, 3, 0.5); break;
    }
    d += 36 - (d / RUN.BOSS_AT) * 8 + Rn() * 10;
  }
  return objs.sort((a, b) => a.d - b.d);
}

/* ---------- landing (still in the side view) */
function startLanding() {
  G.phase = 'land'; G.phaseT = 0; G.timers.length = 0;
  for (const e of G.enemies) killEnemy(e, true);
  for (const b of G.eb) { b.dead = true; puff(b.x, b.y); }
  G.pickups.length = 0;
  G.landFrom = { x: G.player.x, y: G.player.y };
  banner('ПОСАДКА!', 'Дальше — бегом!', 2.4);
  sfx('swoosh');
}
function updateLand() {
  const k = G.phaseT, p = G.player, a = G.landFrom, e = easeInOut(clamp(k / 1.6, 0, 1));
  p.x = lerp(a.x, W * 0.35, e); p.y = lerp(a.y, H - 70, e); p.tilt = Math.sin(e * Math.PI) * 0.4;
  if (k > 1.6 && !G.landDust) { G.landDust = true; burst(p.x, H - 30, 14, { type: 'smoke', col: 'rgba(230,220,200,A)', r: 6, r1: 22, smin: 40, smax: 160, lmin: 0.4, lmax: 0.7 }); sfx('pop'); G.shake = 6; }
  if (k >= 2.3) startRunner(false);
}
function drawLandGround(c) {
  if (G.phase !== 'land') return;
  const gh = 70 * easeOut(clamp(G.phaseT / 1.4, 0, 1));
  c.fillStyle = '#5aa04a'; c.fillRect(0, H - gh, W, gh + 2);
  c.fillStyle = '#b07a45'; c.fillRect(0, H - gh + 14, W, Math.max(0, gh - 30));
}
function drawLandFade(c) {
  if (G.phase !== 'land' || G.phaseT < 1.7) return;
  c.fillStyle = 'rgba(255,255,255,' + clamp((G.phaseT - 1.7) / 0.55, 0, 1).toFixed(3) + ')'; c.fillRect(0, 0, SW, SH);
}

/* ---------- the run */
function startRunner(atBoss) {
  const R = {
    s: 0, speed: atBoss ? RUN.BASE : 8, x: 0, vx: 0, lane: 1, y: 0, vy: 0, roll: 0, slam: false, boost: 0, inv: 0,
    coffee: 0, cupsTotal: 0, meter: 40, objs: buildTrack(), i: 0, phase: 'intro', t: 0,
    camH: 9, hor: SH * 0.1, camX: 0, curve: 0, fade: 1, hints: {}, streak: null, target: null, boss: null, end: null, surf: 'road',
  };
  if (atBoss) { R.s = RUN.BOSS_AT - 25; R.objs = []; R.hints = { jump: 1, roll: 1, lane: 1, homing: 1, boost: 1, grass: 1, sand: 1, ice: 1, road: 1 }; }
  R.surf = surfaceAt(R.s);
  R.three = r3Init();
  G.run = R; G.phase = 'run'; G.phaseT = 0;
  if (R.three) r3Reset();
  G.enemies.length = 0; G.eb.length = 0; G.pickups.length = 0; G.parts.length = 0; G.banners.length = 0;
  G.player.inv = 0; G.player.alive = true;
  if (!atBoss) Sound.music('sky2');
}
function runProj(x, h, z) { return G.run && G.run.three && R3.camera ? runProj3(x, h, z) : runProj2D(x, h, z); }
function runProj2D(x, h, z) {
  const R = G.run, k = (SH * 0.9) / z, dz = z - RUN.PZ;
  return { sx: SW / 2 + (x - R.camX + R.curve * dz * dz) * k, sy: R.hor + (R.camH - h) * k, k };
}
function runPlayerScreen() { const R = G.run; return runProj(R.x, R.y, RUN.PZ); }
function runJump() {
  const R = G.run; if (!R || G.phase !== 'run' || R.phase === 'end' || !G.player.alive) return;
  if (R.target && (R.y > 0.25 || R.target.boss)) return runHoming();
  if (R.y <= 0.01 && R.vy <= 0) { R.vy = RUN.JUMP; R.y = 0.01; R.roll = 0; sfx('swoosh'); }
}
function runRoll() {
  const R = G.run; if (!R || G.phase !== 'run' || !G.player.alive) return;
  if (R.y > 0.05) { R.vy = -30; R.slam = true; } else R.roll = 0.75;
  sfx('throw');
}
function runLane(dir) {
  const R = G.run; if (!R || G.phase !== 'run' || !G.player.alive) return;
  const n = clamp(R.lane + dir, 0, 2);
  if (n === R.lane) { G.shake = Math.max(G.shake, 3); return; }
  R.lane = n; sfx('click');
}
function runBoost() {
  const R = G.run; if (!R || R.boost > 0 || !G.player.alive || R.end || R.phase === 'intro') return;
  if (R.meter < 100) { if (!R.boostNag || R.t - R.boostNag > 1.5) { R.boostNag = R.t; floatText(SW / 2, SH * 0.7, 'Шкала «Рывок» ещё не полная — собирай кофе!', '#ffe9a0', 18); sfx('click'); } return; }
  R.boost = 4; R.meter = 0; banner('РЫВОК!', '', 1.2, 'small'); sfx('power'); sfx('quack'); sfx('swoosh'); G.shake = 6;
}
function runBomb() {
  const R = G.run;
  for (const o of R.objs) if (!o.dead && o.d > R.s - 1 && o.d < R.s + 45 && o.type !== 'cup' && o.type !== 'spring' && o.type !== 'dash') { o.dead = true; o.smashed = 0.5; }
}
function runHoming() {
  const R = G.run, T = R.target; if (!T) return;
  const a = runPlayerScreen();
  if (T.boss) {
    const B = R.boss, q = runProj(B.x, B.h + 2.2, B.z + RUN.PZ);
    R.streak = { x0: a.sx, y0: a.sy - a.k * 0.6, x1: q.sx, y1: q.sy, t: 0.25 };
    runBossHit();
  } else {
    const q = runProj(T.x, T.h + 0.4, T.d - R.s + RUN.PZ);
    R.streak = { x0: a.sx, y0: a.sy - a.k * 0.6, x1: q.sx, y1: q.sy, t: 0.25 };
    R.lane = Math.round(T.x / RUN.LANE) + 1;
    runDestroy(T, q);
  }
  R.vy = 12; R.y = Math.max(R.y, 0.4); R.target = null;
  sfx('swoosh');
}
function runDestroy(o, q) {
  o.dead = true; o.smashed = 0.5;
  q = q || runProj(o.x, o.h + 0.3, o.d - G.run.s + RUN.PZ);
  const enemyHit = o.type === 'pigeon' || o.type === 'crow';
  addScore(enemyHit ? 150 : 50, q.sx, q.sy);
  burst(q.sx, q.sy, 10, enemyHit ? { type: 'feather', col: o.type === 'crow' ? '#3a3646' : '#a7b0bf', smin: 60, smax: 220, lmin: 0.6, lmax: 1.1, rmin: 5, rmax: 9 } : { type: 'chunk', col: '#e63946', g: 500, smin: 80, smax: 260, lmin: 0.5, lmax: 0.9, rmin: 4, rmax: 8 });
  sfx('pop');
}
function runHit() {
  const R = G.run;
  if (R.inv > 0 || R.boost > 0 || !G.player.alive || DEBUG.god) return;
  const a = runPlayerScreen();
  G.shake = 10; sfx('hurt'); sfx('quack');
  if (R.coffee > 0) {
    // like Sonic's rings: you drop your coffee instead of losing a heart
    for (let i = 0; i < Math.min(12, R.coffee); i++) { const ang = rand(Math.PI * 1.1, Math.PI * 1.9); part({ type: 'cup', x: a.sx, y: a.sy - a.k * 0.5, vx: Math.cos(ang) * rand(120, 320), vy: Math.sin(ang) * rand(200, 420), g: 700, r: a.k * 0.22, life: 1.1 }); }
    floatText(a.sx, a.sy - a.k * 1.3, 'Кофе рассыпан!', '#ffd0a0', 20);
    R.coffee = 0; R.inv = 1.5;
    return;
  }
  G.hp--; G.hits++; R.inv = 1.8; G.flash = 0.3; G.flashColor = '#ff3d5a';
  burst(a.sx, a.sy - a.k * 0.5, 10, { type: 'feather', col: '#ffe066', smin: 60, smax: 200, lmin: 0.8, lmax: 1.3, rmin: 5, rmax: 8 });
  if (G.hp <= 0) {
    G.player.alive = false; G.phase = 'dead'; G.phaseT = 0; sfx('boom'); sfx('quack2'); Sound.music(null);
  }
}
function runCollide(o) {
  const R = G.run;
  switch (o.type) {
    case 'cup':
      if (Math.abs(o.h - R.y) < 1.4) {
        o.dead = true; R.coffee++; R.cupsTotal++; R.meter = Math.min(100, R.meter + 4); addScore(10);
        const q = runProj(o.x, o.h, RUN.PZ + 0.3); burst(q.sx, q.sy, 4, { type: 'star', col: '#ffe066', smin: 40, smax: 120, lmin: 0.3, lmax: 0.5, rmin: 4, rmax: 6 });
        sfx('heal');
        if (R.cupsTotal % 30 === 0 && G.hp < MAX_HP) { G.hp++; floatText(q.sx, q.sy - 40, '+1 ♥', '#ff8fa3', 24); }
      }
      return;
    case 'spring': if (!o.used && R.y < 0.4) { o.used = true; R.vy = RUN.SPRING; R.y = 0.05; R.roll = 0; sfx('power'); } return;
    case 'dash': if (!o.used && R.y < 0.4) { o.used = true; R.boost = Math.max(R.boost, 1.6); sfx('swoosh'); } return;
  }
  if (o.hitDone) return;
  if (R.boost > 0) { runDestroy(o); return; }
  const air = R.y, rolling = R.roll > 0 && R.y < 0.5;
  let ok = false;
  switch (o.type) {
    case 'barrier': case 'cone': ok = air > 0.95; break;
    case 'spikes': ok = air > 0.6; break;
    case 'hole': case 'puddle': ok = air > 0.3; break;
    case 'pepper': ok = Math.abs(air - o.h) > 1.0; break;
    case 'bar': case 'red': ok = rolling || air > 2.6; break;
    case 'pigeon': if (air > 0.4 || rolling) { runDestroy(o); if (air > 0.4) R.vy = 11; return; } break;
    case 'crow': if (rolling) ok = true; else if (air > 0.8) { runDestroy(o); R.vy = 11; return; } break;
  }
  if (!ok) { o.hitDone = true; runHit(); }
}

/* ---------- shawarma boss: dodge its sauce, hit it when it gets dizzy */
function startRunBoss() {
  const R = G.run;
  R.phase = 'boss';
  R.boss = { hp: 5, max: 5, state: 'enter', t: 0, z: 70, x: 0, h: 0, round: 0, vol: 0, mouth: 0, flash: 0, speech: null, atkT: 0 };
  G.checkpoint = { score: G.score, power: G.power };
  R.objs = R.objs.filter((o) => o.d > R.s - 10); R.i = 0;
  banner('ВНИМАНИЕ!', 'Злая шаверма', 3.0, 'warn');
  sfx('siren'); Sound.music('boss');
}
function shawSay(text) { G.run.boss.speech = { text, t: 2.3 }; sfx('babble'); }
function updateRunBoss(dt) {
  const R = G.run, B = R.boss; if (!B) return;
  B.t += dt; B.flash = Math.max(0, B.flash - dt);
  if (B.speech) { B.speech.t -= dt; if (B.speech.t <= 0) B.speech = null; }
  B.x = Math.sin(B.t * 0.9) * 1.4 * (B.state === 'tired' ? 0.2 : 1);
  if (B.state === 'enter') {
    B.z = lerp(B.z, 28, Math.min(1, dt * 1.5)); B.h = lerp(B.h, 0.6, Math.min(1, dt * 2));
    if (B.t > 2.6) { B.state = 'attack'; B.t = 0; B.vol = 0; B.atkT = 0.6; if (B.round === 0) shawSay('Я шаверма с двойным соусом!'); }
  } else if (B.state === 'attack') {
    B.z = lerp(B.z, 28, Math.min(1, dt * 2)); B.h = 0.6 + Math.sin(B.t * 3) * 0.2;
    B.atkT -= dt; B.mouth = Math.max(0, B.mouth - dt * 2);
    if (B.atkT <= 0) {
      const vols = B.hp <= 2 ? 5 : 4;
      if (B.vol >= vols) { B.state = 'tired'; B.t = 0; shawSay(pick(['Уф… устала…', 'Лаваш… порвался…'])); sfx('charge'); }
      else { shawAttack(B); B.vol++; B.atkT = B.hp <= 2 ? 1.05 : 1.35; }
    }
  } else if (B.state === 'tired') {
    B.z = lerp(B.z, 9, Math.min(1, dt * 2.5)); B.h = lerp(B.h, 0.1, Math.min(1, dt * 3));
    if (B.t > 2.8) { B.state = 'enter'; B.t = 1.2; B.round++; shawSay(pick(['Ха! Медленно!', 'Не догонишь!'])); }
  } else if (B.state === 'hurt') {
    B.z = lerp(B.z, 30, Math.min(1, dt * 2)); B.h = lerp(B.h, 2.5, Math.min(1, dt * 3));
    if (B.t > 1.3) { B.state = 'enter'; B.t = 1.4; B.round++; }
  } else if (B.state === 'dead') {
    B.z += dt * 6; B.h += dt * 2;
    if (B.t > 2.2 && !R.end) runFinish();
  }
}
function shawAttack(B) {
  const R = G.run, kind = ['white', 'pepper', 'red', 'white'][(B.vol + B.round) % 4];
  const lanes = [0, 1, 2].sort(() => Math.random() - 0.5), n = B.hp <= 2 ? 2 : (Math.random() < 0.5 ? 1 : 2);
  B.mouth = 1;
  const d = R.s + B.z;
  if (kind === 'white') {
    if (B.vol % 2 === 0) shawSay('Белый соус — в лицо!');
    for (let i = 0; i < n; i++) R.objs.push({ type: 'puddle', d: d - 2, x: laneX(lanes[i]), h: 0, fall: B.h + 2.5, ft: 0 });
  } else if (kind === 'pepper') {
    shawSay('Острый халапеньо!');
    for (let i = 0; i < n + 1; i++) R.objs.push({ type: 'pepper', d: d - 2 - i * 3, x: laneX(lanes[i % 3]), h: 0, ph: rand(0, 3) });
  } else {
    shawSay('Красный соус!');
    for (let i = 0; i < n; i++) R.objs.push({ type: 'red', d: d - 2, x: laneX(lanes[i]), h: 1.3, v: -10 });
  }
  R.objs.sort((a, b) => a.d - b.d); R.i = 0;
  sfx('throw');
}
function runBossHit() {
  const R = G.run, B = R.boss;
  B.hp--; B.flash = 0.3; B.state = B.hp <= 0 ? 'dead' : 'hurt'; B.t = 0; B.vol = 0;
  G.shake = 12; sfx('boom');
  const q = runProj(B.x, B.h + 2.5, B.z + RUN.PZ);
  burst(q.sx, q.sy, 18, { type: 'dot', col: pick(['#fff', '#e63946', '#5cc94a']), smin: 100, smax: 380, lmin: 0.4, lmax: 0.8, rmin: 4, rmax: 9 });
  addScore(1000, q.sx, q.sy);
  if (B.hp <= 0) { shawSay('Я… всего лишь… лаваш…'); addScore(10000, q.sx, q.sy - 40); Sound.music(null); R.splats = []; for (let i = 0; i < 7; i++) R.splats.push({ x: rand(0.1, 0.9) * SW, y: rand(0.1, 0.8) * SH, r: rand(30, 70), col: pick(['#fffaf0', '#e63946', '#fffaf0']), t: 0 }); }
  else shawSay(pick(['Ай! Мой лаваш!', 'Ой, соус потёк!', 'Ну всё, утка!']));
}
function runFinish() {
  const R = G.run;
  R.end = { t: 0 }; R.phase = 'end';
  sfx('win');
}

function updateRunner(dt) {
  const R = G.run;
  G.t += dt; G.phaseT += dt; G.bgT += dt;
  G.shake = Math.max(0, G.shake - dt * 28); G.flash = Math.max(0, G.flash - dt * 2.2);
  updateParts(dt);
  R.t += dt; R.fade = Math.max(0, R.fade - dt * 1.4);
  if (R.streak) { R.streak.t -= dt; if (R.streak.t <= 0) R.streak = null; }
  if (R.splats) for (const s of R.splats) s.t += dt;
  if (R.end) { R.end.t += dt; R.speed = lerp(R.speed, 0, Math.min(1, dt * 2)); if (G.heroSay) { G.heroSay.t -= dt; if (G.heroSay.t <= 0) G.heroSay = null; } if (R.end.t > 1.0 && !R.end.said) { R.end.said = true; G.heroSay = { text: 'Шаверма побеждена! Теперь можно и пообедать.', t: 3.6 }; sfx('quack2'); } if (R.end.t > 5.2) onWin(); return; }
  if (G.phase === 'dead') { R.speed = lerp(R.speed, 0, Math.min(1, dt * 3)); R.s += R.speed * dt; if (G.phaseT > 2.2) onGameOver(); return; }
  // camera swoops down behind the duck at the start
  if (R.phase === 'intro') {
    const e = easeInOut(clamp(R.t / 1.5, 0, 1));
    R.camH = lerp(9, 2.2, e); R.hor = lerp(SH * 0.1, SH * 0.36, e);
    if (R.t >= 1.5) R.phase = R.boss ? 'boss' : 'run';
  }
  const surf = surfaceAt(R.s);
  if (surf !== R.surf) { R.surf = surf; if (!R.hints[surf] && R.s > 50) { R.hints[surf] = 1; banner(SURF_NAME[surf][0], SURF_NAME[surf][1], 2.2, 'small'); } }
  let target = Math.min(RUN.MAXS, RUN.BASE + R.s * 0.004);
  if (surf === 'sand') target *= 0.78;
  if (R.boost > 0) target *= 1.8;
  if (R.phase === 'run' || R.phase === 'boss') { if (!(R.boost > 0)) R.meter = Math.min(100, R.meter + 2.2 * dt); if (R.meter >= 100 && !R.hints.boost) { R.hints.boost = 1; banner('РЫВОК ГОТОВ!', isTouch ? 'Жми полоску «Рывок» слева внизу' : 'Жми Shift или полоску «Рывок»', 2.4, 'small'); } }
  R.speed = lerp(R.speed, target, Math.min(1, dt * 2.5));
  R.s += R.speed * dt;
  R.curve = Math.sin(R.s / 230) * 0.0026 + Math.sin(R.s / 97) * 0.0009;
  // lanes: ice makes the duck slide
  const tx = laneX(R.lane);
  if (surf === 'ice') { R.vx += (tx - R.x) * 32 * dt; R.vx *= 1 - 2.4 * dt; R.x += R.vx * dt; }
  else { R.x = lerp(R.x, tx, Math.min(1, dt * 14)); R.vx = 0; }
  R.camX = lerp(R.camX, R.x * 0.6, Math.min(1, dt * 6));
  if (R.y > 0 || R.vy > 0) {
    R.vy -= RUN.G * dt; R.y += R.vy * dt;
    if (R.y <= 0) { R.y = 0; R.vy = 0; if (R.slam) { R.roll = 0.6; R.slam = false; } const a = runPlayerScreen(); burst(a.sx, a.sy, 5, { type: 'smoke', col: surf === 'ice' ? 'rgba(220,240,255,A)' : 'rgba(230,215,190,A)', r: 4, r1: 14, smin: 30, smax: 90, lmin: 0.3, lmax: 0.5 }); }
  }
  R.roll = Math.max(0, R.roll - dt); R.boost = Math.max(0, R.boost - dt); R.inv = Math.max(0, R.inv - dt);
  if (surf === 'sand' && Math.random() < dt * 12 && R.y === 0) { const a = runPlayerScreen(); part({ type: 'smoke', x: a.sx + rand(-20, 20), y: a.sy, r: 3, r1: 12, col: 'rgba(240,220,170,A)', life: 0.4, vx: rand(-40, 40), vy: rand(-40, 0) }); }
  // hints for the controls
  const hint = (key, at, title, sub) => { if (!R.hints[key] && R.s > at) { R.hints[key] = 1; banner(title, sub, 2.6, 'small'); } };
  if (R.phase === 'run') {
    hint('jump', 25, 'ПРЫЖОК', isTouch ? 'Кнопка «Прыжок» справа внизу' : 'Стрелка вверх или Пробел');
    hint('roll', 255, 'КУВЫРОК', isTouch ? 'Свайп вниз — проскочи под планкой' : 'Стрелка вниз — проскочи под планкой');
    hint('lane', 425, 'ДОРОЖКИ', isTouch ? 'Свайп влево или вправо' : 'Стрелки влево и вправо');
    hint('homing', 560, 'АТАКА В ПРЫЖКЕ', isTouch ? 'В прыжке нажми «Прыжок» ещё раз — утка бросится на врага' : 'В прыжке нажми ещё раз — утка бросится на врага');
  }
  // moving boss projectiles and falling sauce
  for (const o of R.objs) {
    if (o.dead) continue;
    if (o.v) o.d += o.v * dt;
    if (o.fall !== undefined && o.ft < 1) o.ft = Math.min(1, o.ft + dt * 2.2);
    if (o.type === 'pepper') { o.ph += dt * 5; o.h = Math.abs(Math.sin(o.ph)) * 1.9; }
  }
  if (R.boss) { R.objs.sort((a, b) => a.d - b.d); R.i = 0; }
  // collisions near the duck
  while (R.i < R.objs.length && R.objs[R.i].d < R.s - 6) R.i++;
  for (let j = R.i; j < R.objs.length; j++) {
    const o = R.objs[j];
    if (o.d > R.s + 2) break;
    if (o.dead || Math.abs(o.d - R.s) > 0.9 || Math.abs(o.x - R.x) > 1.0) continue;
    if (o.fall !== undefined && o.ft < 1) continue;
    runCollide(o);
  }
  // homing target: nearest enemy ahead while in the air, or the dizzy boss
  R.target = null;
  if (R.boss && R.boss.state === 'tired') R.target = { boss: true };
  else if (R.y > 0.25) {
    for (let j = R.i; j < R.objs.length; j++) {
      const o = R.objs[j], dz = o.d - R.s;
      if (dz > 16) break;
      if (dz > 2.5 && !o.dead && (o.type === 'pigeon' || o.type === 'crow')) { R.target = o; break; }
    }
  }
  if (R.phase === 'run' && R.s >= RUN.BOSS_AT) startRunBoss();
  if (R.boss) updateRunBoss(dt);
}

/* ---------- drawing the run */
const SURF_COL = {
  road: { side: ['#5aa04a', '#4f9442'], road: ['#6b6f7a', '#62666f'], edge: ['#e63946', '#fff'], line: '#fff' },
  grass: { side: ['#62b356', '#58a64c'], road: ['#b07a45', '#a06d3c'], edge: ['#6b4423', '#7d5230'], line: '#5a3a1e' },
  sand: { side: ['#f0dba8', '#e8d095'], road: ['#e8cf96', '#dcc185'], edge: ['#c9a66b', '#d7b77c'], line: '#c9a66b' },
  ice: { side: ['#f4fbff', '#e6f2fb'], road: ['#d9f1ff', '#c4e6fa'], edge: ['#7ec8f0', '#fff'], line: '#8fcff2' },
};
function drawRunSky(c, t) {
  const R = G.run, k = clamp(R.s / RUN.BOSS_AT, 0, 1);
  const g = c.createLinearGradient(0, 0, 0, R.hor + 10);
  g.addColorStop(0, mix('#3f97ea', '#4a4a8f', k)); g.addColorStop(1, mix('#cdeeff', '#ffbf8a', k));
  c.fillStyle = g; c.fillRect(0, 0, SW, R.hor + 12);
  const sx = SW * 0.72 - R.curve * 9000, sy = R.hor - 70 + k * 40;
  glow(c, sx, sy, 120, 'rgba(255,245,210,A)', 0.7);
  P(c); circ(c, sx, sy, 28); c.fillStyle = mix('#fff8cc', '#ffb04d', k); c.fill();
  for (const cl of BG.cl) {
    const L = BG.clouds[cl.k], x = wrap(cl.x - t * 6 - R.curve * 9000, -300, SW + 200);
    c.globalAlpha = 0.75; c.drawImage(L.cv, x, cl.y * 0.45, L.w * cl.s * 0.8, L.h * cl.s * 0.8);
  }
  c.globalAlpha = 1;
  const L = BG.cityDay;
  if (L) { const off = R.s * 0.6 + R.curve * 12000, h = 90, w = (L.w * h) / L.h; for (let x = -wrap(off, 0, w); x < SW; x += w) c.drawImage(L.cv, x, R.hor - h + 4, w + 1, h); }
}
function drawRunRoad(c) {
  const R = G.run, N = 70, zmin = 2.25, zmax = RUN.ZMAX;
  let prev = null;
  for (let i = N; i >= 0; i--) {
    const z = zmin * Math.pow(zmax / zmin, i / N);
    const L = runProj(-RUN.HALF, 0, z), Rr = runProj(RUN.HALF, 0, z);
    const cur = { y: L.sy, l: L.sx, r: Rr.sx, k: L.k, d: R.s + z - RUN.PZ };
    if (prev) {
      const sc = SURF_COL[surfaceAt(cur.d)], par = Math.floor(cur.d / 4) % 2;
      c.fillStyle = sc.side[par]; c.fillRect(0, prev.y, SW, cur.y - prev.y + 1);
      if (sc === SURF_COL.sand) { c.fillStyle = par ? '#3fb5d6' : '#37a8c9'; c.fillRect(cur.r + (cur.r - cur.l) * 0.15, prev.y, SW, cur.y - prev.y + 1); }
      const quad = (a0, a1, col) => { P(c); c.moveTo(lerp(prev.l, prev.r, a0), prev.y); c.lineTo(lerp(prev.l, prev.r, a1), prev.y); c.lineTo(lerp(cur.l, cur.r, a1), cur.y); c.lineTo(lerp(cur.l, cur.r, a0), cur.y); c.closePath(); c.fillStyle = col; c.fill(); };
      quad(0, 1, sc.road[par]);
      quad(-0.05, 0.02, sc.edge[par]); quad(0.98, 1.05, sc.edge[par]);
      if (par === 0 || sc !== SURF_COL.road) { quad(0.327, 0.34, sc.line); quad(0.66, 0.673, sc.line); }
      if (sc === SURF_COL.grass && Math.floor(cur.d) % 2 === 0) quad(0, 1, 'rgba(60,30,10,0.12)');
    }
    prev = cur;
  }
}
function drawRunObj(c, o, t) {
  const R = G.run, z = o.d - R.s + RUN.PZ;
  if (z < 1.2 || z > RUN.ZMAX) return;
  const base = runProj(o.x, 0, z), k = base.k;
  const ground = (x0, x1, d0, d1, col, stroke) => {
    const a = runProj(x0, 0, d0 - R.s + RUN.PZ), b = runProj(x1, 0, d0 - R.s + RUN.PZ), cc = runProj(x1, 0, Math.max(1.3, d1 - R.s + RUN.PZ)), dd = runProj(x0, 0, Math.max(1.3, d1 - R.s + RUN.PZ));
    P(c); c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); c.lineTo(cc.sx, cc.sy); c.lineTo(dd.sx, dd.sy); c.closePath(); fs(c, col, stroke ? 2 : 0);
  };
  if (o.dead) {
    if (!o.smashed || o.smashed <= 0) return;
    o.smashed -= 1 / 60; c.globalAlpha = Math.max(0, o.smashed * 2);
  }
  const at = (h) => runProj(o.x, h, z);
  c.save();
  switch (o.type) {
    case 'cup': { const q = at(o.h + 0.25); drawCoffee(c, q.sx, q.sy, t + o.d, (0.55 * k) / 48); break; }
    case 'barrier': {
      const w = 0.8 * k, top = at(0.95).sy;
      for (const s of [-1, 1]) { P(c); c.rect(base.sx + s * w * 0.8 - k * 0.07, top, k * 0.14, base.sy - top); fs(c, '#6b4423', Math.max(1, k * 0.02)); }
      P(c); rr(c, base.sx - w, top, w * 2, k * 0.3, k * 0.05); fs(c, '#fff', Math.max(1, k * 0.025));
      c.save(); c.clip(); c.fillStyle = '#e63946'; for (let i = -6; i < 6; i++) { P(c); c.moveTo(base.sx + i * k * 0.3, top); c.lineTo(base.sx + i * k * 0.3 + k * 0.15, top); c.lineTo(base.sx + i * k * 0.3 - k * 0.05, top + k * 0.3); c.lineTo(base.sx + i * k * 0.3 - k * 0.2, top + k * 0.3); c.closePath(); c.fill(); } c.restore();
      break;
    }
    case 'spikes': {
      const w = 0.85 * k, hh = 0.55 * k;
      P(c); c.rect(base.sx - w, base.sy - k * 0.1, w * 2, k * 0.1); fs(c, '#5c6577', 1);
      for (let i = 0; i < 6; i++) { const x = base.sx - w + (i + 0.5) * (w * 2 / 6); P(c); c.moveTo(x - w / 7, base.sy - k * 0.08); c.lineTo(x, base.sy - hh); c.lineTo(x + w / 7, base.sy - k * 0.08); c.closePath(); fs(c, '#d5dae2', Math.max(1, k * 0.02)); }
      break;
    }
    case 'cone': {
      const hh = 0.75 * k, w = 0.28 * k;
      P(c); c.moveTo(base.sx - w, base.sy); c.lineTo(base.sx, base.sy - hh); c.lineTo(base.sx + w, base.sy); c.closePath(); fs(c, '#ff7a1a', Math.max(1, k * 0.02));
      P(c); c.rect(base.sx - w * 0.55, base.sy - hh * 0.55, w * 1.1, hh * 0.15); c.fillStyle = '#fff'; c.fill();
      P(c); rr(c, base.sx - w * 1.3, base.sy - k * 0.06, w * 2.6, k * 0.08, k * 0.03); fs(c, '#ff7a1a', 1);
      break;
    }
    case 'hole': ground(o.x - 0.9, o.x + 0.9, o.d - 1.0, o.d + 1.0, '#1b1820', true); break;
    case 'dash': {
      ground(o.x - 0.8, o.x + 0.8, o.d - 1.2, o.d + 1.2, '#2a6bff', true);
      for (let i = 0; i < 3; i++) { const a = runProj(o.x - 0.5, 0, o.d - 0.9 + i * 0.7 - R.s + RUN.PZ), b = runProj(o.x, 0, o.d - 0.5 + i * 0.7 - R.s + RUN.PZ), cc = runProj(o.x + 0.5, 0, o.d - 0.9 + i * 0.7 - R.s + RUN.PZ); line(c, [a.sx, a.sy, b.sx, b.sy, cc.sx, cc.sy], Math.max(2, k * 0.08), '#ffe14d'); }
      break;
    }
    case 'spring': {
      const top = at(0.55).sy, w = 0.45 * k;
      for (let i = 0; i < 4; i++) { const y = base.sy - (base.sy - top) * (i + 0.5) / 4; line(c, [base.sx - w * 0.6, y + k * 0.04, base.sx + w * 0.6, y - k * 0.04], Math.max(2, k * 0.07), '#c0c6cf'); }
      P(c); rr(c, base.sx - w, top - k * 0.1, w * 2, k * 0.14, k * 0.04); fs(c, '#e63946', Math.max(1, k * 0.025));
      P(c); rr(c, base.sx - w, base.sy - k * 0.08, w * 2, k * 0.1, k * 0.03); fs(c, '#ffd43b', 1);
      break;
    }
    case 'bar': {
      const w = 0.95 * k, y0 = at(1.05).sy, y1 = at(1.4).sy;
      for (const s of [-1, 1]) { P(c); c.rect(base.sx + s * w - k * 0.06, y1, k * 0.12, base.sy - y1); fs(c, '#3d4352', 1); }
      P(c); c.rect(base.sx - w, y1, w * 2, y0 - y1); fs(c, '#ffd43b', Math.max(1, k * 0.025));
      c.save(); c.clip(); c.fillStyle = INK; for (let i = -8; i < 8; i++) { P(c); c.moveTo(base.sx + i * k * 0.25, y1); c.lineTo(base.sx + i * k * 0.25 + k * 0.12, y1); c.lineTo(base.sx + i * k * 0.25 + k * 0.12 - (y0 - y1), y0); c.lineTo(base.sx + i * k * 0.25 - (y0 - y1), y0); c.closePath(); c.fill(); } c.restore();
      break;
    }
    case 'pigeon': case 'crow': {
      const q = at(o.h + 0.35), s = (0.9 * k) / 60;
      P(c); ell(c, base.sx, base.sy, k * 0.35, k * 0.08); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fill();
      c.translate(q.sx, q.sy); c.scale(s, s);
      ART[o.type](c, { seed: o.d }, t);
      if (R.target === o) { c.setTransform(view.px, 0, 0, view.px, 0, 0); drawReticle(c, q.sx, q.sy, k * 0.6, t); }
      break;
    }
    case 'puddle': {
      if (o.ft < 1) { const q = at(lerp(o.fall, 0, o.ft)); P(c); circ(c, q.sx, q.sy, k * 0.3); fs(c, '#fffaf0', 2); break; }
      const a = runProj(o.x, 0, z);
      P(c); ell(c, a.sx, a.sy, k * 0.95, k * 0.22); fs(c, '#fffaf0', Math.max(1, k * 0.02));
      P(c); ell(c, a.sx - k * 0.3, a.sy - k * 0.05, k * 0.25, k * 0.06); c.fillStyle = 'rgba(200,200,190,0.6)'; c.fill();
      break;
    }
    case 'pepper': {
      const q = at(o.h + 0.3), s = k * 0.012;
      P(c); ell(c, base.sx, base.sy, k * 0.25, k * 0.06); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill();
      c.translate(q.sx, q.sy); c.scale(s, s); c.rotate(o.ph * 0.6);
      drawJalapeno(c);
      break;
    }
    case 'red': {
      const q = at(o.h);
      for (let i = 1; i < 5; i++) { const b = runProj(o.x, o.h, z + i * 0.8); P(c); circ(c, b.sx, b.sy, k * 0.25 * (1 - i * 0.15)); c.fillStyle = 'rgba(230,57,70,0.4)'; c.fill(); }
      P(c); circ(c, q.sx, q.sy, k * 0.32); fs(c, '#e63946', Math.max(1, k * 0.03));
      P(c); circ(c, q.sx - k * 0.1, q.sy - k * 0.1, k * 0.08); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill();
      break;
    }
  }
  c.restore();
}
function drawReticle(c, x, y, r, t) {
  c.save(); c.translate(x, y); c.rotate(t * 3);
  c.strokeStyle = '#ff3d5a'; c.lineWidth = 3;
  P(c); circ(c, 0, 0, r); c.stroke();
  for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); line(c, [r * 0.6, 0, r * 1.25, 0], 3, '#ff3d5a'); }
  c.restore();
}
function drawJalapeno(c) {
  P(c); c.moveTo(-26, -6); c.quadraticCurveTo(0, -18, 26, -4); c.quadraticCurveTo(34, 2, 24, 8); c.quadraticCurveTo(0, 10, -26, 6); c.closePath(); fs(c, '#3fa34d', 3);
  P(c); ell(c, -8, -6, 12, 3); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fill();
  tube(c, [-26, 0, -34, -6, -36, -14], 2.5, '#5c7a2e');
  eye(c, 8, -2, 4, -0.2, 0.1, 1.2, '#e63946');
}
function drawDeco(c, t) {
  const R = G.run;
  const step = 14, first = Math.ceil((R.s - 2) / step) * step;
  for (let d = first + Math.floor(RUN.ZMAX / step) * step; d >= first; d -= step) {
    const z = d - R.s + RUN.PZ; if (z < 1.6 || z > RUN.ZMAX) continue;
    const surf = surfaceAt(d);
    for (const side of [-1, 1]) {
      const x = side * (RUN.HALF + 2.2 + ((d * 7) % 5) * 0.4), q = runProj(x, 0, z), k = q.k;
      if (surf === 'sand' && side > 0) continue;
      if (surf === 'road') {
        line(c, [q.sx, q.sy, q.sx, q.sy - 3.4 * k, q.sx - side * 0.5 * k, q.sy - 3.4 * k], Math.max(1, k * 0.09), '#3d4352');
        P(c); circ(c, q.sx - side * 0.55 * k, q.sy - 3.3 * k, k * 0.15); c.fillStyle = '#ffe9a0'; c.fill();
      } else if (surf === 'grass' || surf === 'sand') {
        line(c, [q.sx, q.sy, q.sx + side * 0.3 * k, q.sy - 3 * k], Math.max(1.5, k * 0.18), '#8a5a2b');
        c.fillStyle = surf === 'sand' ? '#3fa34d' : '#4fa36a';
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.55; P(c); ell(c, q.sx + side * 0.3 * k + Math.cos(a) * k * 0.7, q.sy - 3 * k + Math.sin(a) * k * 0.45, k * 0.75, k * 0.18, a); c.fill(); }
      } else {
        P(c); c.moveTo(q.sx - k * 0.8, q.sy); c.lineTo(q.sx, q.sy - 3 * k); c.lineTo(q.sx + k * 0.8, q.sy); c.closePath(); c.fillStyle = '#2f7a5a'; c.fill();
        P(c); c.moveTo(q.sx - k * 0.4, q.sy - 1.6 * k); c.lineTo(q.sx, q.sy - 3 * k); c.lineTo(q.sx + k * 0.4, q.sy - 1.6 * k); c.closePath(); c.fillStyle = '#f4fbff'; c.fill();
      }
    }
  }
}
// the duck seen from behind: blonde bob instead of a face
function drawDuckBack(c, t) {
  const R = G.run, a = runPlayerScreen(), g = runProj(R.x, 0, RUN.PZ), k = a.k;
  P(c); ell(c, g.sx, g.sy, k * 0.42 * (1 - Math.min(0.5, R.y * 0.12)), k * 0.1); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill();
  if (R.inv > 0 && Math.floor(R.inv * 14) % 2 === 0) c.globalAlpha = 0.4;
  if (R.boost > 0) { glow(c, a.sx, a.sy - k * 0.5, k * 1.1, 'rgba(255,220,90,A)', 0.6); for (let i = 0; i < 5; i++) line(c, [a.sx + rand(-k, k), a.sy - rand(0, k), a.sx + rand(-k, k) * 1.4, a.sy + k * 0.8], 2, 'rgba(255,255,255,0.6)'); }
  c.save(); c.translate(a.sx, a.sy);
  const rolling = R.roll > 0 || R.slam || R.boost > 0;
  if (rolling) {
    const r = k * 0.42; c.translate(0, -r);
    P(c); circ(c, 0, 0, r); fs(c, '#f6d64a', Math.max(2, k * 0.04));
    c.rotate(-t * 22);
    for (let i = 0; i < 3; i++) { c.rotate((Math.PI * 2) / 3); P(c); c.arc(0, 0, r * 0.65, 0, 1.2); c.lineWidth = k * 0.05; c.strokeStyle = '#d8b26a'; c.stroke(); }
    c.restore(); c.globalAlpha = 1; return;
  }
  const run = R.y > 0.01 ? 0 : Math.sin(t * 22), lw = Math.max(2, k * 0.035);
  // feet
  for (const s of [-1, 1]) { P(c); ell(c, s * k * 0.16, -k * 0.03 - Math.max(0, run * s) * k * 0.12, k * 0.12, k * 0.06); fs(c, '#ff7a1a', lw * 0.8); }
  // wings
  const flap = R.y > 0.01 ? Math.sin(t * 18) * 0.6 : run * 0.25;
  for (const s of [-1, 1]) {
    c.save(); c.translate(s * k * 0.36, -k * 0.55); c.rotate(s * (0.5 + flap));
    P(c); ell(c, s * k * 0.12, 0, k * 0.2, k * 0.1); fs(c, '#ecc93c', lw); c.restore();
  }
  // body and tail
  P(c); ell(c, 0, -k * 0.45, k * 0.4, k * 0.42); fs(c, '#f6d64a', lw);
  P(c); c.moveTo(-k * 0.14, -k * 0.2); c.lineTo(0, -k * 0.02); c.lineTo(k * 0.14, -k * 0.2); c.closePath(); fs(c, '#ffe58a', lw * 0.8);
  // knife peeking out on the right
  c.save(); c.translate(k * 0.42, -k * 0.5); c.rotate(-0.5);
  P(c); c.moveTo(0, -k * 0.03); c.lineTo(k * 0.3, -k * 0.05); c.lineTo(k * 0.34, 0); c.lineTo(0, k * 0.04); c.closePath(); fs(c, '#d5dae2', lw * 0.7);
  P(c); c.rect(-k * 0.12, -k * 0.03, k * 0.12, k * 0.06); fs(c, '#7e4fa0', lw * 0.7); c.restore();
  // head with Ilona's blonde bob seen from behind
  P(c); circ(c, 0, -k * 0.95, k * 0.26); fs(c, '#f6d64a', lw);
  P(c); c.moveTo(-k * 0.3, -k * 0.78); c.quadraticCurveTo(-k * 0.34, -k * 1.28, 0, -k * 1.24); c.quadraticCurveTo(k * 0.34, -k * 1.28, k * 0.3, -k * 0.78);
  c.quadraticCurveTo(k * 0.2, -k * 0.7, k * 0.1, -k * 0.76); c.quadraticCurveTo(0, -k * 0.7, -k * 0.1, -k * 0.76); c.quadraticCurveTo(-k * 0.2, -k * 0.7, -k * 0.3, -k * 0.78); c.closePath();
  fs(c, '#d8b26a', lw);
  for (const s of [-0.12, 0.02, 0.15]) line(c, [s * k, -k * 1.18, s * k * 1.4, -k * 0.84], Math.max(1, k * 0.015), '#f0d690');
  c.restore(); c.globalAlpha = 1;
}
function drawShawarma(c, x, y, S, t, B) {
  c.save(); c.translate(x, y); const s = S / 200; c.scale(s, s);
  const angry = B.hp <= 2, m = B.mouth || 0, tired = B.state === 'tired' || B.state === 'hurt';
  if (B.flash > 0 && Math.floor(B.flash * 20) % 2) c.globalAlpha = 0.6;
  tube(c, [-24, -14, -34, 0], 9, '#e9c38a'); tube(c, [24, -14, 34, 0], 9, '#e9c38a');
  const wave = Math.sin(t * 6) * 10;
  tube(c, [-52, -100, -84, -116 + wave, -96, -140 + wave], 8, '#e9c38a'); tube(c, [52, -100, 84, -116 - wave, 96, -140 - wave], 8, '#e9c38a');
  P(c); c.moveTo(-36, -10); c.lineTo(-66, -152); c.quadraticCurveTo(0, -172, 66, -152); c.lineTo(36, -10); c.quadraticCurveTo(0, 4, -36, -10); c.closePath();
  fs(c, angry ? '#e8b170' : '#f0cc8f', 4);
  c.fillStyle = 'rgba(150,90,30,0.35)'; for (const [px, py, r] of [[-30, -120, 6], [22, -40, 5], [36, -110, 4], [-12, -70, 5], [8, -136, 4]]) { P(c); circ(c, px, py, r); c.fill(); }
  line(c, [-50, -60, 40, -128], 2.5, 'rgba(120,70,20,0.5)'); line(c, [-40, -20, 30, -70], 2.5, 'rgba(120,70,20,0.5)');
  // filling poking out of the top
  P(c); ell(c, 0, -154, 62, 16); fs(c, '#6b3b23', 3);
  for (const [px, py, r, col] of [[-36, -164, 12, '#8a4b2a'], [-14, -170, 11, '#e63946'], [10, -168, 12, '#5cc94a'], [34, -162, 11, '#8a4b2a'], [-2, -158, 10, '#f2efe0'], [22, -176, 8, '#e63946']]) { P(c); circ(c, px, py, r); fs(c, col, 2); }
  // sauce drips
  for (const [px, col, len] of [[-40, '#fffaf0', 30], [30, '#e63946', 24], [-6, '#fffaf0', 20]]) { P(c); c.moveTo(px - 6, -150); c.lineTo(px - 6, -150 + len); c.arc(px, -150 + len, 6, Math.PI, 0, true); c.lineTo(px + 6, -150); c.closePath(); fs(c, col, 1.5); }
  // face
  if (tired) { for (const ex of [-20, 20]) { line(c, [ex - 7, -104, ex + 7, -90], 4); line(c, [ex - 7, -90, ex + 7, -104], 4); } }
  else { eye(c, -20, -96, 10, 0, 0.15, -1.3, '#e63946'); eye(c, 20, -96, 10, 0, 0.15, 1.3, '#e63946'); }
  P(c); ell(c, 0, -60, 16, 5 + m * 14); fs(c, '#4a1018', 3);
  if (m > 0.2) { P(c); ell(c, 0, -56 + m * 4, 9, 3 + m * 5); c.fillStyle = '#e06070'; c.fill(); }
  if (B.state === 'tired') for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; P(c); starPath(c, Math.cos(a) * 50, -190 + Math.sin(a) * 12, 10, 4); fs(c, '#ffe14d', 2); }
  c.restore();
}
function drawRunBoss(c, t) {
  const R = G.run, B = R.boss; if (!B) return;
  const z = B.z + RUN.PZ, base = runProj(B.x, 0, z), q = runProj(B.x, B.h, z);
  P(c); ell(c, base.sx, base.sy, base.k * 1.6, base.k * 0.35); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill();
  drawShawarma(c, q.sx, q.sy, base.k * 6.5, t, B);
  if (B.state === 'tired') {
    drawReticle(c, q.sx, q.sy - base.k * 3, base.k * 1.6, t);
    c.font = '30px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle';
    if (Math.floor(t * 4) % 2) otext(c, isTouch ? 'ЖМИ!' : 'ЖМИ ПРОБЕЛ!', q.sx, q.sy - base.k * 7.4, '#ffe14d', 7);
  }
  if (B.speech) speechAt(c, B.speech.text, q.sx - base.k * 1.5, q.sy - base.k * 6, B.speech.t, 2.3, -1);
}
function drawRunHud(c, t) {
  const R = G.run;
  c.textBaseline = 'middle';
  drawCoffee(c, 28, 112, t, 0.55);
  c.font = '22px ' + FONT_DISPLAY; c.textAlign = 'left'; otext(c, '× ' + R.coffee, 46, 114, '#fff6e5', 5);
  if (R.boss) {
    const bw = Math.min(380, SW * 0.4), bx = SW / 2 - bw / 2, by = 60;
    c.font = '900 13px ' + FONT_UI; c.textAlign = 'center'; otext(c, 'ЗЛАЯ ШАВЕРМА', SW / 2, 52, '#ffd43b', 4);
    for (let i = 0; i < R.boss.max; i++) { const w = (bw - (R.boss.max - 1) * 6) / R.boss.max; P(c); rr(c, bx + i * (w + 6), by, w, 14, 7); fs(c, i < R.boss.hp ? '#ff3d5a' : 'rgba(34,29,46,0.6)', 3); }
  }
}
function drawSplats(c) {
  const R = G.run; if (!R.splats) return;
  for (const s of R.splats) {
    const a = clamp(Math.min(s.t * 6, (3.4 - s.t) * 1.5), 0, 1); if (a <= 0) continue;
    c.globalAlpha = a; c.fillStyle = s.col;
    P(c); for (let i = 0; i < 9; i++) { const ang = (i / 9) * TAU; circ(c, s.x + Math.cos(ang) * s.r * 0.7, s.y + Math.sin(ang) * s.r * 0.7, s.r * 0.45); } circ(c, s.x, s.y, s.r * 0.8); c.fill();
    P(c); c.rect(s.x - s.r * 0.15, s.y, s.r * 0.3, s.r * 0.6 + s.t * 60); c.fill();
  }
  c.globalAlpha = 1;
}
function drawRunEnd(c, t) {
  const R = G.run, E = R.end; if (!E) return;
  const k = E.t;
  if (k < 0.8) { c.fillStyle = 'rgba(255,255,255,' + clamp(k / 0.8, 0, 1).toFixed(3) + ')'; c.fillRect(0, 0, SW, SH); return; }
  // back to the side view: now we see Ilona's face again
  const g = c.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#5aa9ef'); g.addColorStop(0.7, '#cdeeff'); g.addColorStop(1, '#cdeeff');
  c.fillStyle = g; c.fillRect(0, 0, SW, SH);
  c.fillStyle = '#5aa04a'; c.fillRect(0, SH - 90, SW, 90); c.fillStyle = '#b07a45'; c.fillRect(0, SH - 70, SW, 40);
  c.save(); c.translate(SW * 0.72, SH - 70); c.rotate(1.35); c.scale(0.9, 0.9);
  drawShawarma(c, 0, 0, 150, 0, { hp: 0, state: 'tired', mouth: 0, flash: 0 }); c.restore();
  const bob = Math.abs(Math.sin(t * 4)) * 14;
  drawDuckHero(c, SW * 0.36, SH - 190 - bob, t, { h: 210, flapSpeed: 10 });
  for (let i = 0; i < 14; i++) { const x = ((i * 137 + t * 90) % SW), y = ((i * 71 + t * 120) % SH); P(c); starPath(c, x, y, 6, 2.5); c.fillStyle = ['#ffd43b', '#ff8fa3', '#7ee7f2'][i % 3]; c.fill(); }
  c.font = '54px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle'; otext(c, 'ПОБЕДА!', SW / 2, 70, '#ffd43b', 10);
  if (G.heroSay) speechAt(c, G.heroSay.text, SW * 0.36 + 70, SH - 330, G.heroSay.t, 3.6, 1);
  if (k < 1.4) { c.fillStyle = 'rgba(255,255,255,' + clamp(1 - (k - 0.8) / 0.6, 0, 1).toFixed(3) + ')'; c.fillRect(0, 0, SW, SH); }
}
function renderRunner(c) {
  if (G.run.three) return renderRunner3D(c);
  const R = G.run, t = G.bgT;
  c.save();
  if (G.shake > 0.3 && !reducedMotion) c.translate(rand(-1, 1) * G.shake, rand(-1, 1) * G.shake);
  drawRunSky(c, t);
  drawRunRoad(c);
  drawDeco(c, t);
  // objects far to near, then the boss and the duck
  const far = [];
  for (let j = R.i; j < R.objs.length; j++) { const o = R.objs[j]; if (o.d - R.s + RUN.PZ > RUN.ZMAX) break; far.push(o); }
  for (let j = far.length - 1; j >= 0; j--) { if (far[j].d - R.s < 0.4) continue; drawRunObj(c, far[j], t); }
  drawRunBoss(c, t);
  for (let j = far.length - 1; j >= 0; j--) { if (far[j].d - R.s >= 0.4) continue; drawRunObj(c, far[j], t); }
  if (G.player.alive || G.phaseT < 1.2) drawDuckBack(c, t);
  if (R.streak) { const s = R.streak; c.globalAlpha = s.t / 0.25; line(c, [s.x0, s.y0, s.x1, s.y1], 14, '#ffe14d'); line(c, [s.x0, s.y0, s.x1, s.y1], 6, '#fff'); c.globalAlpha = 1; }
  drawParts(c);
  c.restore();
  drawTexts(c);
  drawSplats(c);
  if (!R.end) { drawHUD(c, t); drawRunHud(c, t); drawBanners(c, t); }
  if (G.flash > 0) { c.globalAlpha = Math.min(0.55, G.flash); c.fillStyle = G.flashColor; c.fillRect(0, 0, SW, SH); c.globalAlpha = 1; }
  if (R.fade > 0) { c.fillStyle = 'rgba(255,255,255,' + R.fade.toFixed(3) + ')'; c.fillRect(0, 0, SW, SH); }
  drawRunEnd(c, t);
}
// keyboard and touch for the run
function runnerKey(code) {
  if (code === 'ArrowLeft' || code === 'KeyA') runLane(-1);
  else if (code === 'ArrowRight' || code === 'KeyD') runLane(1);
  else if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') runJump();
  else if (code === 'ArrowDown' || code === 'KeyS') runRoll();
  else if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyQ' || code === 'KeyC') runBoost();
  else if (code === 'KeyX' || code === 'KeyB' || code === 'Enter') useBomb();
  else return false;
  return true;
}
