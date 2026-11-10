/* ============================================================ game rules */
// overall difficulty: enemy and boss health, enemy shot speed
const DIFF = 1.2;
const MAX_HP = 5, MAX_BOMBS = 5, MAX_POWER = 4, LEVEL_LEN = 100, MAX_CHARM = 6;
const DEBUG = { god: false, substeps: 1, bot: null };
const MODE = {
  duck: { hero: 'Утка Илона', heal: 'coffee', song: 'sky', level: 'Небо над городом', bossName: 'Бабка на самокате', bombText: 'СИДИ ТИХО!', fireInt: 0.12, bSpeed: 980, dmg: 1, br: 9 },
  fish: { hero: 'Карась Миша', heal: 'burger', song: 'sea', level: 'Тёплое море', bossName: 'Злая рыба', bombText: 'ЛОВИ ВОЛНУ!', fireInt: 0.14, bSpeed: 740, dmg: 1.15, br: 10 },
};
const KINDS = {
  grunt:   { hp: 2,  r: 17, score: 100,  speed: 190, move: 'line',    art: { duck: 'pigeon',  fish: 'piranha' } },
  weaver:  { hp: 2,  r: 16, score: 120,  speed: 160, move: 'sine',    art: { duck: 'plane',   fish: 'jelly' } },
  diver:   { hp: 4,  r: 19, score: 180,  speed: 150, move: 'dive',    art: { duck: 'crow',    fish: 'shark' } },
  shooter: { hp: 7,  r: 21, score: 250,  speed: 150, move: 'hover',   art: { duck: 'drone',   fish: 'puffer' } },
  heavy:   { hp: 60, r: 46, score: 1500, speed: 70,  move: 'heavy',   art: { duck: 'cloud',   fish: 'octo' } },
  carrier: { hp: 3,  r: 22, score: 200,  speed: 75,  move: 'carrier', art: { duck: 'balloon', fish: 'chest' } },
  special: { hp: 2,  r: 18, score: 200,  speed: 390, move: 'special', art: { duck: 'gull',    fish: 'hook' } },
  minion:  { hp: 2,  r: 16, score: 50,   speed: 240, move: 'line',    art: { duck: 'pigeon',  fish: 'piranha' } },
  zig:     { hp: 1,  r: 12, score: 60,   speed: 210, move: 'zig',     art: { duck: 'wasp',    fish: 'ray' } },
  lance:   { hp: 2,  r: 13, score: 150,  speed: 760, move: 'lance',   art: { duck: 'rocket',  fish: 'swordfish' } },
  heavy2:  { hp: 70, r: 44, score: 2000, speed: 70,  move: 'heavy',   art: { duck: 'blimp',   fish: 'angler' } },
};
// art that stays upright on screen when the world is turned (vertical flight)
const UPRIGHT = new Set(['drone', 'cloud', 'balloon', 'blimp', 'wasp']);
const LEVEL_INFO = {
  1: { duck: { name: 'Небо над городом', boss: 'granny', song: 'sky' }, fish: { name: 'Тёплое море', boss: 'pike', song: 'sea' } },
  2: { duck: { name: 'Вечер над городом и выше облаков', boss: 'car', song: 'sky2' }, fish: { name: 'Глубокие воды', boss: 'catfish', song: 'sea2' } },
  3: { duck: null, fish: { name: 'Газ! Туннели и тёмные глубины', boss: 'mega', song: 'sea3' } },
};
const BOSS = {
  granny:  { name: 'Бабка на самокате', label: 'БАБКА НА САМОКАТЕ', hp: 420, restX: 190, y: [150, 135], head: [-14, -92] },
  pike:    { name: 'Злая рыба', label: 'ЗЛАЯ РЫБА', hp: 420, restX: 200, y: [125, 115], head: [-100, -50] },
  car:     { name: 'Бешеная Mitsubishi', label: 'БЕШЕНАЯ MITSUBISHI', hp: 520, restX: 160, y: [150, 150], head: [-120, -50], scale: 0.8 },
  catfish: { name: 'Сом', label: 'СОМ', hp: 540, restX: 235, y: [130, 120], head: [-150, -40] },
};
const SHOTS = { 1: [[0, 0]], 2: [[0, -7], [0, 7]], 3: [[0, 0], [-0.12, -4], [0.12, 4]], 4: [[0, -7], [0, 7], [-0.17, -4], [0.17, 4]] };
const BOSS_HIT = {
  granny: [[-12, -62, 32], [4, 4, 46], [-4, 86, 42]], pike: [[-95, 0, 44], [0, 0, 52], [92, 0, 38]],
  car: [[-110, 0, 46], [10, -10, 62], [118, 4, 40]], catfish: [[-112, 4, 54], [10, 0, 60], [118, 0, 40]],
};
// boss art space -> world (the art is drawn upright on screen even when the world is turned)
function bp(b, ax, ay) { const s = BOSS[b.kind].scale || 1; ax *= s; ay *= s; return G.vert ? { x: b.x - ay, y: b.y + b.oy + ax } : { x: b.x + ax, y: b.y + b.oy + ay }; }
function bossCircles(b) { return BOSS_HIT[b.kind].map(([hx, hy, r]) => { const q = bp(b, hx, hy); return [q.x, q.y, r * (BOSS[b.kind].scale || 1)]; }); }
const toScreen = (x, y) => (G && G.vert ? { x: y, y: SH - x } : { x, y });

let G = null;
let state = 'loading';  // loading | menu | rotate | play | paused | over | win

function newGame(mode, level) {
  level = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].includes(level) ? level : 1;
  if (!LEVEL_INFO[level][mode]) level = 1;
  return {
    mode, M: MODE[mode], level, LI: LEVEL_INFO[level][mode], L: level === 11 ? LEVEL11_FISH : level === 10 ? LEVEL10_FISH : level === 9 ? LEVEL9_FISH : level === 8 ? LEVEL8_FISH : level === 7 ? LEVEL7_FISH : level === 6 ? LEVEL6_FISH : level === 5 ? LEVEL5_FISH : level === 4 ? LEVEL4_FISH : level === 3 ? (mode === 'duck' ? LEVEL3_DUCK : LEVEL3_FISH) : level === 2 ? (mode === 'duck' ? LEVEL2_DUCK : LEVEL2_FISH) : LEVEL, len: level === 11 ? LEVEL11_LEN : level === 10 ? LEVEL10_LEN : level === 9 ? LEVEL9_LEN : level === 8 ? LEVEL8_LEN : level === 7 ? LEVEL7_LEN : level === 6 ? LEVEL6_LEN : level === 5 ? LEVEL5_LEN : level === 4 ? LEVEL4_LEN : level === 3 ? (mode === 'duck' ? 999 : LEVEL3_LEN) : LEVEL_LEN, run: null,
    lvlDiff: mode === 'fish' && level === 11 ? 2.7 : mode === 'fish' && level === 10 ? 2.6 : mode === 'fish' && level === 9 ? 1.68 : mode === 'fish' && level === 8 ? 2.0 : mode === 'fish' && level === 7 ? 2.4 : mode === 'fish' && level === 6 ? 1.5 : mode === 'fish' && level === 5 ? 1.69 : mode === 'fish' && level === 4 ? 1.3 : 1,
    spearW: [], amazon: false, lake67: false, mangrove: false,
    eelUnlocked: false, eelCharge: 0, eelT: 0, eel: null, lake: false,
    crocUnlocked: false, crocCharge: 0, crocT: 0, crocA: null, rapids: false, rivers: false, cave: false,
    evOff: 0, spd: level >= 5 ? 1.45 : level >= 3 ? 1.3 : 1, aqua: null, aquaWall: null, megaCameo: null, bright: false, squidUnlocked: false, squidCharge: 0, squidT: 0, squid: null, lair: false, dark: false, portal: null, helper: null, outro: null, burstCd: 0,
    vert: false, turnK: 0, tunnel: null, slowT: 0, tickT: 0, charm: 0, charmT: 0, suck: null, heroSay: null, cameo: null,
    t: 0, bgT: 0, phase: 'intro', phaseT: 0, ev: 0,
    score: 0, hp: MAX_HP, bombs: 2, power: 1,
    player: { x: -90, y: H / 2, vy: 0, inv: 0, fireT: 0.3, tilt: 0, alive: true, deadT: 0, rot: 0, dvx: 0, dvy: 0 },
    pb: [], enemies: [], eb: [], pickups: [], parts: [], texts: [], banners: [], timers: [], warns: [],
    boss: null, bombFx: null, checkpoint: null, ended: false,
    shake: 0, flash: 0, flashColor: '#fff', lastHealT: 0, lastBombT: 0, hits: 0,
  };
}

/* ---------- helpers */
const later = (dt, fn) => G.timers.push({ t: dt, fn });
const heroHit = () => (G.mode === 'duck' ? { x: G.player.x, y: G.player.y - 3, r: 10 } : { x: G.player.x + 26, y: G.player.y, r: 12 });
const aimAt = (x, y) => { const h = heroHit(); return Math.atan2(h.y - y, h.x - x); };
function ebullet(x, y, ang, speed, o) {
  speed *= DIFF * (G && G.lvlDiff > 1 ? 1 + (G.lvlDiff - 1) * 0.5 : 1);
  G.eb.push(Object.assign({ x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r: 6, type: 'orb', col: '#ff2d55', age: 0, rot: rand(0, TAU), spin: 0 }, o));
}
function spread(x, y, n, step, speed, o, base) {
  if (base === undefined) base = aimAt(x, y);
  for (let i = 0; i < n; i++) ebullet(x, y, base + (i - (n - 1) / 2) * step, speed, o);
}
function ring(x, y, n, speed, o, off) { for (let i = 0; i < n; i++) ebullet(x, y, (off || 0) + (i / n) * TAU, speed, o); }
function banner(text, sub, life, style) {
  if (G.run && style === 'small') G.banners = G.banners.filter((b) => b.style !== 'small');
  G.banners.push({ text, sub, t: 0, life: life || 2.4, style: style || 'title' }); }
function floatText(x, y, text, col, size) { if (G.texts.length < 40) G.texts.push({ x, y, text, col: col || '#fff', t: 0, life: 1, size: size || 18 }); }
function addScore(n, x, y) { G.score += n; if (n >= 100 && x !== undefined) floatText(x, y - 10, '+' + n, '#fff6e5', n >= 1000 ? 22 : 16); }

function enemy(kind, x, y, o) {
  const K = KINDS[kind];
  const e = Object.assign({ kind, art: K.art[G.mode], x, y, hp: K.hp, r: K.r, score: K.score, speed: K.speed, move: K.move, age: 0, flash: 0, seed: rand(0, 10), rot: 0, charge: 0 }, o);
  if (kind === 'special' && G.mode === 'fish') { e.move = 'hook'; e.invuln = true; e.r = 12; e.harmless = false; }
  if (kind === 'carrier') e.harmless = true;
  if (kind === 'grunt' && (G.t > 45 || G.level === 2) && Math.random() < 0.35) e.shoots = true;
  if (G.mode === 'fish' && kind === 'zig') { e.hp = 4; e.r = 20; e.speed = 150; e.score = 150; }
  if (G.mode === 'fish' && kind === 'lance') { e.hp = 3; e.r = 16; }
  if (!e.invuln) e.hp = Math.round(e.hp * DIFF * G.lvlDiff * 10) / 10;
  if (G.level === 3 && e.speed && e.kind !== 'lance') e.speed *= 1.15;
  e.maxHp = e.hp; e.baseY = y;
  G.enemies.push(e);
  return e;
}
function pickup(type, x, y, o) {
  G.pickups.push(Object.assign({ type, x, y, baseY: y, vx: -115, vy: 0, age: 0, r: 20, float: true }, o));
}

/* ---------- level script */
const F = {
  line(kind, n, yf, gap, o) { for (let i = 0; i < n; i++) later(i * (gap || 0.42), () => enemy(kind, W + 40, yf * H, o)); },
  sine(kind, n, yf, gap, amp, freq, o) {
    for (let i = 0; i < n; i++) later(i * (gap || 0.36), () => enemy(kind, W + 40, yf * H, Object.assign({ amp: amp || 80, freq: freq || 2.6, phase: 0 }, o)));
  },
  vee(kind, n, yf, o) { const m = (n - 1) / 2; for (let i = 0; i < n; i++) enemy(kind, W + 40 + Math.abs(i - m) * 46, yf * H + (i - m) * 40, o); },
  divers(ys, gap) { ys.forEach((yf, i) => later(i * (gap === undefined ? 0.6 : gap), () => enemy('diver', W + 40, yf * H))); },
  shooters(ys, gap) { ys.forEach((yf, i) => later(i * (gap || 0.5), () => enemy('shooter', W + 40, yf * H, { tx: W - rand(110, 230) }))); },
  heavy() { enemy('heavy', W + 90, H * 0.45, { tx: W - 160 }); },
  carrier(drop, yf) {
    if (G.mode === 'duck') enemy('carrier', W + 40, yf * H, { drop, r: 30 });
    else enemy('carrier', rand(W * 0.55, W * 0.85), -40, { drop });
  },
  special(yf) {
    if (G.mode === 'duck') { G.warns.push({ y: yf * H, t: 1.1 }); later(1.1, () => enemy('special', -40, yf * H, { flip: true })); }
    else enemy('special', rand(W * 0.42, W * 0.78), -30, { ty: yf * H });
  },
  health(yf) { if (G.tunnel) return F.tpick(G.M.heal); pickup(G.M.heal, W + 30, yf * H); G.lastHealT = G.t; },
  swarm(n, yf) { for (let i = 0; i < n; i++) later(i * (G.mode === 'duck' ? 0.16 : 0.5), () => enemy('zig', W + 30, yf * H + rand(-30, 30))); },
  lance(ys, gap) { ys.forEach((yf, i) => later(i * (gap || 0.35), () => enemy('lance', W - 14, yf * H))); },
  heavy2() { enemy('heavy2', W + 100, H * 0.45, { tx: W - 170 }); },
  // inside the fish tunnel: follow the middle of the passage
  tline(kind, n, gap) { for (let i = 0; i < n; i++) later(i * (gap || 0.5), () => enemy(kind, W + 40, tunnelC(W + 40), { move: 'sine', amp: kind === 'weaver' ? 26 : 14, freq: 3, phase: i, follow: true, speed: 170 })); },
  tpick(type) { pickup(type, W + 30, tunnelC(W + 30), { follow: true, vx: -150 }); if (type === G.M.heal) G.lastHealT = G.t; },
};
const LEVEL = [
  [2.2, () => F.line('grunt', 5, 0.32)],
  [5.2, () => F.line('grunt', 5, 0.68)],
  [8.0, () => F.carrier('power', 0.45)],
  [9.5, () => F.sine('weaver', 6, 0.5)],
  [13.5, () => F.vee('grunt', 5, 0.5)],
  [16.5, () => F.health(0.3)],
  [17.5, () => F.divers([0.22, 0.5, 0.78])],
  [21.5, () => { F.line('grunt', 5, 0.22, 0.38); F.line('grunt', 5, 0.78, 0.38); }],
  [25.5, () => F.shooters([0.3, 0.7])],
  [29.0, () => F.special(0.5)],
  [30.5, () => F.carrier('power', 0.3)],
  [32.5, () => F.sine('weaver', 7, 0.35, 0.32, 70)],
  [34.0, () => F.sine('weaver', 7, 0.65, 0.32, 70, 2.6, { phase: Math.PI })],
  [37.5, () => F.health(0.7)],
  [39.5, () => F.heavy()],
  [44.0, () => F.line('grunt', 4, 0.15, 0.5)],
  [46.5, () => F.carrier('bomb', 0.78)],
  [49.0, () => F.line('grunt', 4, 0.85, 0.5)],
  [53.5, () => { F.vee('grunt', 5, 0.3); F.divers([0.75]); }],
  [56.5, () => F.shooters([0.2, 0.5, 0.8], 0.4)],
  [59.5, () => { F.special(0.3); F.health(0.62); }],
  [62.5, () => { F.sine('weaver', 6, 0.3, 0.34, 60); F.sine('weaver', 6, 0.7, 0.34, 60, 2.6, { phase: Math.PI }); }],
  [66.5, () => F.divers([0.2, 0.4, 0.6, 0.8], 0.45)],
  [69.5, () => F.carrier('power', 0.5)],
  [71.0, () => { F.vee('grunt', 5, 0.25); later(1.2, () => F.vee('grunt', 5, 0.75)); }],
  [75.0, () => { F.special(0.7); later(1.6, () => F.special(0.25)); }],
  [78.0, () => { F.shooters([0.25, 0.75]); F.line('grunt', 6, 0.5, 0.35); }],
  [81.5, () => F.health(0.4)],
  [83.0, () => { F.line('grunt', 6, 0.18, 0.3); F.line('grunt', 6, 0.82, 0.3); F.divers([0.5], 0); }],
  [87.0, () => { F.sine('weaver', 8, 0.5, 0.28, 110); F.shooters([0.2, 0.8]); }],
  [91.5, () => { F.divers([0.3, 0.7], 0.5); F.line('grunt', 4, 0.5, 0.4); }],
  [94.5, () => { F.carrier('bomb', 0.35); F.health(0.66); }],
];

const LEVEL2_DUCK = [
  [2.2, () => F.swarm(6, 0.3)],
  [4.5, () => F.line('grunt', 5, 0.7)],
  [7.0, () => F.carrier('power', 0.5)],
  [8.5, () => F.lance([0.3, 0.7])],
  [11.0, () => F.sine('weaver', 7, 0.4)],
  [14.0, () => F.divers([0.25, 0.75])],
  [16.0, () => F.carrier('slow', 0.42)],
  [17.0, () => { F.swarm(6, 0.75); later(0.8, () => F.swarm(6, 0.2)); }],
  [20.5, () => F.shooters([0.3, 0.7])],
  [23.0, () => F.health(0.5)],
  [24.5, () => F.heavy2()],
  [29.0, () => F.lance([0.2, 0.5, 0.8], 0.5)],
  [31.5, () => F.swarm(8, 0.5)],
  [34.0, () => F.special(0.6)],
  [36.0, () => F.carrier('bomb', 0.3)],
  [38.0, () => { F.vee('grunt', 5, 0.5); F.divers([0.2, 0.8]); }],
  [42.0, () => F.health(0.4)],
  [46.0, () => startTurn()],
  // ---- from here the duck flies upwards
  [50.5, () => F.line('grunt', 5, 0.3)],
  [52.5, () => F.line('grunt', 5, 0.7)],
  [55.0, () => F.swarm(7, 0.5)],
  [57.0, () => F.carrier('slow', 0.5)],
  [58.5, () => F.lance([0.25, 0.5, 0.75], 0.4)],
  [61.0, () => F.shooters([0.25, 0.75])],
  [64.0, () => F.health(0.5)],
  [65.0, () => F.sine('weaver', 7, 0.5, 0.36, 160)],
  [68.0, () => F.carrier('power', 0.4)],
  [69.0, () => F.heavy()],
  [74.0, () => F.divers([0.2, 0.5, 0.8])],
  [77.0, () => { F.swarm(8, 0.3); later(1, () => F.swarm(8, 0.7)); }],
  [80.0, () => F.carrier('bomb', 0.6)],
  [82.0, () => F.lance([0.15, 0.4, 0.6, 0.85], 0.3)],
  [85.0, () => F.health(0.5)],
  [86.0, () => F.shooters([0.2, 0.5, 0.8])],
  [90.0, () => F.special(0.5)],
  [92.0, () => { F.vee('grunt', 5, 0.35); later(1.2, () => F.vee('grunt', 5, 0.65)); }],
  [95.5, () => { F.carrier('slow', 0.5); F.health(0.3); }],
];
const LEVEL2_FISH = [
  [2.2, () => F.line('grunt', 5, 0.3)],
  [4.0, () => F.swarm(3, 0.65)],
  [6.5, () => F.carrier('charm', 0.45)],
  [8.0, () => F.line('grunt', 6, 0.7, 0.35)],
  [10.0, () => F.lance([0.3, 0.7])],
  [13.0, () => F.sine('weaver', 6, 0.4)],
  [15.0, () => F.shooters([0.25, 0.75])],
  [18.0, () => F.health(0.5)],
  [19.0, () => F.heavy2()],
  [24.0, () => F.swarm(4, 0.3)],
  [26.0, () => F.carrier('power', 0.6)],
  [27.5, () => F.divers([0.2, 0.5, 0.8])],
  [31.0, () => F.lance([0.2, 0.45, 0.7], 0.4)],
  [33.0, () => F.carrier('charm', 0.4)],
  [35.0, () => { F.special(0.5); F.line('grunt', 5, 0.25); }],
  [38.0, () => F.vee('grunt', 5, 0.5)],
  [40.0, () => F.health(0.45)],
  [42.5, () => F.carrier('bomb', 0.5)],
  [45.0, () => startTunnel()],
  [49.0, () => F.tline('grunt', 4, 0.6)],
  [52.0, () => F.tpick(G.M.heal)],
  [55.0, () => F.tline('weaver', 4, 0.7)],
  [59.0, () => F.tline('grunt', 5, 0.5)],
  [62.0, () => F.tpick('power')],
  [65.0, () => F.tline('zig', 2, 1.2)],
  [69.0, () => F.tpick('charm')],
  [77.0, () => { F.line('grunt', 5, 0.3); F.line('grunt', 5, 0.7); }],
  [79.0, () => F.carrier('charm', 0.5)],
  [80.5, () => F.shooters([0.2, 0.5, 0.8])],
  [83.0, () => F.lance([0.3, 0.6])],
  [85.0, () => F.health(0.5)],
  [86.0, () => F.heavy()],
  [91.0, () => F.swarm(4, 0.5)],
  [94.0, () => { F.carrier('bomb', 0.4); F.health(0.65); }],
];

/* ---------- duck level 2: the flight turns upwards */
function startTurn() {
  G.phase = 'turn'; G.phaseT = 0; G.timers.length = 0;
  for (const e of G.enemies) killEnemy(e, true);
  for (const b of G.eb) { b.dead = true; puff(b.x, b.y); }
  G.pickups.length = 0;
  G.turnFrom = { x: G.player.x, y: G.player.y };
  banner('ВВЕРХ!', 'Курс меняется — летим в небо', 2.8);
  sfx('swoosh'); sfx('wave');
}
function updateTurn() {
  const k = clamp(G.phaseT / 3.0, 0, 1), e = easeInOut(k), p = G.player, a = G.turnFrom;
  G.turnK = e;
  // swoop along a curve to the bottom-centre of the screen
  const T = { x: SW / 2, y: SH - 100 }, C = { x: SW * 0.62, y: SH * 0.25 };
  p.x = (1 - e) * (1 - e) * a.x + 2 * (1 - e) * e * C.x + e * e * T.x;
  p.y = (1 - e) * (1 - e) * a.y + 2 * (1 - e) * e * C.y + e * e * T.y;
  p.tilt = -Math.sin(e * Math.PI) * 0.7;
  if (Math.random() < 0.6) part({ type: 'spark', x: rand(0, SW), y: rand(0, SH), vx: -Math.cos(e * 1.57) * 700, vy: Math.sin(e * 1.57) * 700, r: 2, life: 0.25, col: 'rgba(255,255,255,0.85)' });
  if (k >= 1) {
    const sx = p.x, sy = p.y;
    G.vert = true; setWorld();
    p.x = SH - sy; p.y = sx; p.tilt = 0;
    G.parts.length = 0;
    G.phase = 'waves'; G.phaseT = 0;
  }
}

/* ---------- fish level 2: tunnel with spiked walls */
const TUN = { speed: 170, len: 4300 };
const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
// o: len, speed, squeeze (walls close in), amp (how much it winds), noRampIn (walls already around us), gBase, quiet
function startTunnel(o) {
  o = o || {};
  G.tunnel = { t0: G.t, u0: o.noRampIn ? -60 : W + 80, len: o.len || TUN.len, speed: o.speed || TUN.speed, squeeze: !!o.squeeze, sg: 150, amp: o.amp === undefined ? 1 : o.amp, noRampIn: !!o.noRampIn, gBase: o.gBase || 0, style: o.style || 'rock', safe: !!o.safe, ramp: o.ramp || 600, sqFrom: o.sqFrom || 0 };
  if (o.sg) G.tunnel.sg = o.sg;
  if (!o.quiet) { banner('ТУННЕЛЬ!', 'Не задевай шипы на стенах', 2.8); sfx('charge'); }
}
function tunScroll() { return (G.t - G.tunnel.t0) * G.tunnel.speed; }
function tunAt(x) {
  const T = G.tunnel; if (!T) return null;
  const v = tunScroll() + x - T.u0;
  if (v < 0 || v > T.len) return null;
  const r = Math.min(T.noRampIn ? 1 : smooth(v / T.ramp), smooth((T.len - v) / T.ramp));
  let base = T.squeeze && !T.sqFrom ? T.sg : T.gBase || 132 - 28 * (v / T.len);
  if (T.sqFrom) base = lerp(T.gBase, T.sg, smooth((v - T.sqFrom) / 300));
  return {
    c: H / 2 + r * T.amp * (Math.sin(v * 0.0032) * 95 + Math.sin(v * 0.0087 + 1) * 38),
    g: lerp(H / 2 + 70, base, r),
  };
}
function tunnelC(x) { const a = tunAt(x); return a ? a.c : H / 2; }

/* ---------- enemy behaviour */
function shooterFire(e) {
  if (e.kind === 'shawa') { spread(e.x - 14, e.y - 10, 5, 0.2, 200, { col: pick(['#fffaf0', '#e63946']), r: 7 }); sfx('throw'); return; }
  if (G.mode === 'duck') { spread(e.x - 14, e.y - 1, 3, 0.16, 235, { col: '#ff2d55', r: 6 }); sfx('hit'); }
  else ring(e.x, e.y, 8, 175, { type: 'spike', r: 5 }, rand(0, 1));
}
function heavyFire(e) {
  e.pat = (e.pat || 0) + 1;
  if (e.kind === 'heavy2') {
    if (G.mode === 'duck') {
      if (e.pat % 2) spread(e.x - 40, e.y, 5, 0.2, 210, { col: '#ff2d55', r: 6 });
      else for (let k = 0; k < 6; k++) later(k * 0.12, () => { if (!e.dead) { const q = { x: e.x + rand(-40, 40), y: e.y + 36 }; ebullet(q.x, q.y, aimAt(q.x, q.y) + rand(-0.3, 0.3), 120, { type: 'bombDrop', r: 8, burstT: 1.1 }); } });
    } else {
      if (e.pat % 2) { const lx = e.x - 62, ly = e.y - 60; spread(lx, ly, 9, 0.16, 190, { type: 'light', r: 6 }); }
      else for (let k = 0; k < 3; k++) later(k * 0.25, () => { if (!e.dead) spread(e.x - 40, e.y + 10, 3, 0.12, 260, { type: 'light', r: 6 }); });
    }
    return;
  }
  if (G.mode === 'duck') {
    if (e.pat % 2) spread(e.x - 30, e.y + 20, 7, 0.17, 205, { type: 'drop', r: 6 });
    else for (let k = 0; k < 12; k++) later(k * 0.07, () => { if (!e.dead) ebullet(e.x + rand(-50, 40), e.y + 34, Math.PI * 0.64 + rand(-0.08, 0.08), 235, { type: 'drop', r: 6 }); });
  } else {
    if (e.pat % 2) spread(e.x - 20, e.y + 10, 5, 0.22, 195, { type: 'ink', r: 8 });
    else ring(e.x, e.y + 10, 12, 165, { type: 'ink', r: 8 }, rand(0, 1));
  }
}
const MOVES = {
  line(e, dt) {
    e.x -= e.speed * dt;
    if (e.shoots && !e.fired && e.x < W * 0.78) { e.fired = true; ebullet(e.x - 12, e.y, aimAt(e.x - 12, e.y), 215, { col: G.mode === 'duck' ? '#ff2d55' : '#ff6a3d', r: 6 }); }
  },
  sine(e, dt) { e.x -= e.speed * dt; e.y = e.baseY + Math.sin(e.age * e.freq + e.phase) * e.amp; },
  dive(e, dt) {
    if (!e.st) { e.st = 'in'; e.tx = W - rand(150, 280); }
    if (e.st === 'in') {
      e.x = lerp(e.x, e.tx, 1 - Math.exp(-3.2 * dt));
      if (Math.abs(e.x - e.tx) < 8) { e.st = 'aim'; e.t0 = 0.55; }
    } else if (e.st === 'aim') {
      e.t0 -= dt; e.shiver = true;
      const a = aimAt(e.x, e.y); e.rot = clamp(a - Math.PI * Math.sign(a || 1), -0.7, 0.7);
      if (e.t0 <= 0) { e.st = 'go'; e.shiver = false; e.vx = Math.cos(a) * 440; e.vy = Math.sin(a) * 440; sfx('swoosh'); }
    } else { e.x += e.vx * dt; e.y += e.vy * dt; }
  },
  hover(e, dt) {
    if (!e.st) { e.st = 'in'; e.shots = 3; e.shootT = 0.7; }
    e.y = e.baseY + Math.sin(e.age * 2) * 10;
    if (e.st === 'in') { e.x = lerp(e.x, e.tx, 1 - Math.exp(-2.6 * dt)); if (Math.abs(e.x - e.tx) < 6) e.st = 'shoot'; }
    else if (e.st === 'shoot') {
      e.shootT -= dt; e.charge = clamp(1 - e.shootT / 0.5, 0, 1);
      if (e.shootT <= 0) { shooterFire(e); e.shots--; e.shootT = 1.3; e.charge = 0; if (e.shots <= 0) e.st = 'out'; }
    } else { e.x += 170 * dt; e.baseY += (e.baseY < H / 2 ? -1 : 1) * 50 * dt; e.charge = 0; }
  },
  heavy(e, dt) {
    if (!e.st) { e.st = 'in'; e.atkT = 1.4; e.life = 14; }
    e.y = e.baseY + Math.sin(e.age * 0.9) * 75;
    if (e.st === 'in') { e.x = lerp(e.x, e.tx, 1 - Math.exp(-1.7 * dt)); if (Math.abs(e.x - e.tx) < 10) e.st = 'fight'; }
    else if (e.st === 'fight') { e.life -= dt; e.atkT -= dt; if (e.atkT <= 0) { heavyFire(e); e.atkT = 1.7; } if (e.life <= 0) e.st = 'out'; }
    else e.x += 100 * dt;
  },
  carrier(e, dt) {
    if (G.mode === 'duck') { e.x -= e.speed * dt; e.y = e.baseY + Math.sin(e.age * 1.6) * 18; }
    else { e.x -= 30 * dt; if (e.y < H - 70) e.y += 60 * dt; else { e.y = H - 70; e.x -= 25 * dt; } }
  },
  special(e, dt) { e.x += e.speed * dt; e.y = e.baseY + Math.sin(e.age * 3) * 18; },
  zig(e, dt) {
    e.x -= e.speed * dt;
    const h = heroHit();
    e.y += clamp(h.y - e.y, -90, 90) * 0.9 * dt + Math.cos(e.age * 8 + e.seed) * 130 * dt;
  },
  lance(e, dt) {
    if (!e.st) { e.st = 'warn'; e.wt = 0.9; sfx('charge'); }
    if (e.st === 'warn') { e.wt -= dt; e.shiver = true; if (e.wt <= 0) { e.st = 'go'; e.shiver = false; sfx('swoosh'); } }
    else e.x -= e.speed * dt;
  },
  ally(e, dt) {
    e.allyT -= dt;
    if (e.allyT <= 0) { e.x += 260 * dt; e.flip = true; return; }
    let tgt = null, best = 1e12;
    for (const o of G.enemies) {
      if (o === e || o.dead || o.ally || o.invuln || o.harmless || o.x > W + 10) continue;
      const d = d2(o.x, o.y, e.x, e.y); if (d < best) { best = d; tgt = o; }
    }
    const B = G.boss && G.boss.vul && !G.boss.dead ? G.boss : null;
    let tx, ty;
    if (tgt) { tx = tgt.x; ty = tgt.y; }
    else if (B) { const q = bp(B, 0, 0); tx = q.x; ty = q.y; }
    else { tx = G.player.x + 90; ty = G.player.y - 60 + Math.sin(e.age * 2) * 20; }
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1, sp = tgt || B ? 300 : Math.min(260, d * 3);
    e.x += (dx / d) * sp * dt; e.y += (dy / d) * sp * dt;
    e.flip = dx > 0;
    e.fireT = (e.fireT || 0) - dt;
    if ((tgt || B) && e.fireT <= 0) { e.fireT = 0.7; const a = Math.atan2(dy, dx); G.pb.push({ x: e.x, y: e.y, vx: Math.cos(a) * 600, vy: Math.sin(a) * 600, ang: a, r: 9, dmg: 1, age: 0, wob: 0, friendly: true }); }
    if (tgt && d < e.r + tgt.r) { damageEnemy(tgt, 8); e.hp -= 3; hitSpark(e.x, e.y); if (e.hp <= 0) killEnemy(e, true); }
    else if (!tgt && B) for (const [cx, cy, cr] of bossCircles(B)) if (d2(e.x, e.y, cx, cy) < (cr + e.r) ** 2) { damageBoss(14); killEnemy(e, true); break; }
  },

  hook(e, dt) {
    if (!e.st) e.st = 'down';
    e.x -= 40 * dt;
    if (e.st === 'down') { e.y += 175 * dt; if (e.y >= e.ty) { e.y = e.ty; e.st = 'wait'; e.wt = 1.9; } }
    else if (e.st === 'wait') { e.wt -= dt; e.y = e.ty + Math.sin(e.age * 4) * 6; if (e.wt <= 0) e.st = 'up'; }
    else { e.y -= 250 * dt; if (e.y < -70) e.dead = true; }
  },
};

/* ---------- damage */
function damageEnemy(e, dmg) {
  if (e.invuln || e.dead) return;
  e.hp -= dmg; e.flash = 0.09;
  if (e.hp <= 0) killEnemy(e); else sfx('hit');
}
function killEnemy(e, quiet) {
  if (e.dead) return;
  e.dead = true;
  explode(e);
  if (quiet) return;
  addScore(e.score, e.x, e.y);
  if (G.squidUnlocked && !(G.squidT > 0)) G.squidCharge = Math.min(100, G.squidCharge + 6);
  if (G.eelUnlocked && !(G.eelT > 0)) G.eelCharge = Math.min(100, G.eelCharge + 5);
  if (G.crocUnlocked && !(G.crocT > 0)) G.crocCharge = Math.min(100, G.crocCharge + 5);
  if (e.kind === 'carrier' && e.drop) pickup(e.drop, e.x, e.y + (G.mode === 'duck' ? 28 : -30), { float: false, vx: -40, vy: -120 });
  if (e.kind === 'heavy' || e.kind === 'heavy2') {
    pickup(G.power < MAX_POWER ? 'power' : 'bomb', e.x, e.y, { float: false, vx: -50, vy: -140 });
    G.shake = Math.max(G.shake, 12); sfx('boom');
  } else sfx(G.mode === 'fish' ? 'popWater' : 'pop');
}
function hurtPlayer() {
  const p = G.player;
  if (p.inv > 0 || !p.alive || G.phase === 'bossDead' || DEBUG.god) return;
  G.hp--; G.hits++; p.inv = 1.8;
  G.shake = Math.max(G.shake, 10); G.flash = 0.3; G.flashColor = '#ff3d5a';
  sfx('hurt'); if (G.mode === 'duck') sfx('quack');
  const h = heroHit();
  if (G.mode === 'duck') burst(h.x, h.y, 10, { type: 'feather', col: '#ffe066', smin: 60, smax: 200, lmin: 0.8, lmax: 1.4, rmin: 4, rmax: 6 });
  else burst(h.x, h.y, 12, { type: 'bubble', col: '#e6fbff', smin: 40, smax: 180, lmin: 0.6, lmax: 1.1, rmin: 3, rmax: 7 });
  for (const b of G.eb) if (d2(b.x, b.y, h.x, h.y) < 100 * 100) { b.dead = true; puff(b.x, b.y); }
  if (G.hp <= 0) killPlayer();
}
function killPlayer() {
  const p = G.player;
  p.alive = false; p.deadT = 0; p.dvx = -60; p.dvy = -260;
  G.phase = 'dead'; G.phaseT = 0;
  const h = heroHit();
  burst(h.x, h.y, 26, { type: 'dot', col: G.mode === 'duck' ? '#ffd43b' : '#bfe9ff', smin: 80, smax: 360, lmin: 0.4, lmax: 0.9, rmin: 3, rmax: 6 });
  ringFx(h.x, h.y, 20, 140, '#fff', 0.5);
  sfx('boom'); if (G.mode === 'duck') sfx('quack2');
  Sound.music(null);
}

/* ---------- player */
function fire() {
  const p = G.player, M = G.M;
  const mx = p.x + (G.mode === 'duck' ? 35 : 80), my = p.y + (G.mode === 'duck' ? 5 : 8);
  const sp = G.mode === 'duck' ? 1 : 1.6;
  for (const [a, oy] of SHOTS[G.power]) G.pb.push({ x: mx, y: my + oy * sp, vx: Math.cos(a) * M.bSpeed, vy: Math.sin(a) * M.bSpeed, ang: a, r: M.br, dmg: M.dmg, age: 0, wob: rand(0, 6) });
  if (G.charm > 0 && G.charmT <= 0) {
    G.charm--; G.charmT = 0.9;
    G.pb.push({ x: mx, y: my, vx: 560, vy: 0, ang: 0, r: 13, dmg: 0, age: 0, wob: 0, charm: true });
    sfx('charm');
  }
  sfx(G.mode === 'duck' ? 'knife' : 'bubble');
}
function charmEnemy(e) {
  e.ally = true; e.harmless = true; e.move = 'ally'; e.allyT = 12; e.hp = Math.max(e.hp, 6);
  e.shiver = false; e.rot = 0; e.charge = 0; e.st = null; e.flip = true; e.follow = false;
  floatText(e.x, e.y - 30, 'ДРУГ!', '#ff8fc0', 22);
  burst(e.x, e.y, 8, { type: 'star', col: '#ff8fc0', smin: 40, smax: 140, lmin: 0.5, lmax: 0.9, rmin: 4, rmax: 6 });
  sfx('heal');
}
function useBomb() {
  if (G && G.run) {
    if (state !== 'play' || G.bombs <= 0 || !G.player.alive || G.run.end) return;
    G.bombs--; updateBombBtn(); runBomb();
    banner(G.M.bombText, '', 1.5, 'sign'); sfx('bomb'); sfx('quack2'); G.flash = 0.4; G.flashColor = '#fff';
    return;
  }
  if (G && sqActive()) { doBurst(); return; }
  if (state !== 'play' || !G || G.bombs <= 0 || !G.player.alive || G.phase === 'intro' || G.phase === 'bossDead' || G.bombFx) return;
  G.bombs--; updateBombBtn();
  const p = G.player;
  G.bombFx = { t: 0, dur: G.mode === 'duck' ? 1.1 : 1.5, x: p.x, y: p.y, r: 0, front: -150, hit: new Set(), hitBoss: false };
  p.inv = Math.max(p.inv, 2.3);
  G.flash = 0.5; G.flashColor = '#fff'; G.shake = Math.max(G.shake, 14);
  banner(G.M.bombText, '', 1.5, G.mode === 'duck' ? 'sign' : 'wave');
  if (G.mode === 'duck') { sfx('bomb'); sfx('quack2'); } else { sfx('wave'); sfx('bomb'); }
}
function updateBomb(dt) {
  const fx = G.bombFx; if (!fx) return;
  fx.t += dt;
  const k = fx.t / fx.dur;
  let inside;
  if (G.mode === 'duck') {
    fx.r = easeOut(Math.min(1, k * 1.25)) * Math.hypot(W, H);
    const r2 = fx.r * fx.r;
    inside = (x, y) => d2(x, y, fx.x, fx.y) < r2;
  } else {
    fx.front = lerp(-150, W + 220, easeInOut(k));
    inside = (x) => x < fx.front;
  }
  for (const b of G.eb) if (!b.dead && inside(b.x, b.y)) { b.dead = true; puff(b.x, b.y); }
  for (const e of G.enemies) if (!e.ally && !fx.hit.has(e) && e.x < W + 20 && inside(e.x, e.y)) { fx.hit.add(e); damageEnemy(e, 30); }
  const B = G.boss;
  if (B && !fx.hitBoss && B.vul && !B.dead) { const q = bp(B, 0, 0); if (inside(q.x, q.y)) { fx.hitBoss = true; damageBoss(40); } }
  if (fx.t >= fx.dur) G.bombFx = null;
}
function updatePlayer(dt) {
  const p = G.player;
  if (!p.alive) { p.deadT += dt; p.x += p.dvx * dt; p.y += p.dvy * dt; p.dvy += 520 * dt; p.rot += 7 * dt; return; }
  p.inv = Math.max(0, p.inv - dt);
  const py = p.y;
  if (G.phase === 'turn') { updateTurn(); return; }
  if (G.phase === 'portal') { updatePortal(); return; }
  if (G.phase === 'land') { updateLand(); return; }
  if (G.phase === 'intro') {
    p.x = lerp(-90, W * 0.2, easeOut(G.phaseT / 1.4)); p.y = H / 2; input.dx = input.dy = 0;
  } else {
    let ax = 0, ay = 0;
    if (keys.ArrowLeft || keys.KeyA) ax -= 1;
    if (keys.ArrowRight || keys.KeyD) ax += 1;
    if (keys.ArrowUp || keys.KeyW) ay -= 1;
    if (keys.ArrowDown || keys.KeyS) ay += 1;
    let ddx = input.dx, ddy = input.dy; input.dx = 0; input.dy = 0;
    if (G.vert) { const t1 = ax; ax = -ay; ay = t1; const t2 = ddx; ddx = -ddy; ddy = t2; }  // screen -> turned world
    if (DEBUG.bot) { const m = DEBUG.bot(G, W, H); ax = m.ax; ay = m.ay; }
    if (ax || ay) { const l = Math.max(1, Math.hypot(ax, ay)); const sp = 340 * G.spd; p.x += (ax / l) * sp * dt; p.y += (ay / l) * sp * dt; }
    p.x += ddx; p.y += ddy;
    // the catfish sucks the carp towards its mouth
    const B0 = G.boss;
    if (G.suck) {
      const m = G.suck, h = heroHit(), dx = m.x - h.x, dy = m.y - h.y, d = Math.hypot(dx, dy) || 1;
      const f = 235 * clamp(1.25 - d / 900, 0.4, 1);
      p.x += (dx / d) * f * dt; p.y += (dy / d) * f * dt;
    }
    const B = G.mode === 'duck' ? [52, W * 0.74, 48, H - 44] : [84, W * 0.72, 50, H - 56];
    p.x = clamp(p.x, B[0], B[1]); p.y = clamp(p.y, B[2], B[3]);
    if (G.tunnel) for (const ox of [26, -42]) {
      const a = tunAt(p.x + ox); if (!a) continue;
      const top = a.c - a.g + 13, bot = a.c + a.g - 13, r = 11;
      if (p.y - r < top || p.y + r > bot) { if (!G.tunnel.safe) hurtPlayer(); p.y = clamp(p.y, top + r + 3, bot - r - 3); }
    }
  }
  p.vy = lerp(p.vy, (p.y - py) / Math.max(dt, 1e-3), Math.min(1, dt * 10));
  p.tilt = clamp(p.vy * 0.0009, -0.3, 0.3);
  p.fireT -= dt; G.charmT -= dt;
  if (p.fireT <= 0 && G.phase !== 'intro' && G.phase !== 'bossDead' && G.phase !== 'outro' && G.phase !== 'miniDead') { fire(); p.fireT = G.M.fireInt; }
}

/* ---------- boss */
function* wait(s) { while (s > 0) s -= yield; }
function* moveTo(b, x, y, dur) {
  const sx = b.x, sy = b.y;
  let t = 0;
  while (t < dur) { t += yield; const k = easeInOut(t / dur); b.x = lerp(sx, x, k); b.y = lerp(sy, y, k); }
}
function say(b, text) { b.speech = { text, t: 2.3 }; sfx(b.kind === 'granny' ? 'babble' : b.kind === 'car' ? 'honk' : b.kind === 'mega' ? 'don' : b.kind === 'anaconda' ? 'hiss' : 'blub'); }
const bossY = (b) => rand(BOSS[b.kind].y[0], H - BOSS[b.kind].y[1]);
function* dash(b, speed) {
  b.telegraph = 0.85; sfx('charge');
  yield* wait(0.85);
  b.dash = true; sfx('swoosh');
  while (b.x > -280) { const dt = yield; b.x -= speed * dt; }
  b.x = W + 280; b.y = bossY(b);
  b.dash = false; b.mouth = 0;
  yield* moveTo(b, W - BOSS[b.kind].restX, b.y, 1.1);
}
const GA = {
  *pies(b) {
    say(b, pick(['Поешь пирожок!', 'С капустой, горяченькие!', 'Худая какая! На, кушай!']));
    for (let v = 0; v < (b.phase2 ? 4 : 3); v++) {
      spread(b.x - 70, b.y + b.oy - 40, b.phase2 ? 5 : 3, 0.24, 240, { type: 'pie', r: 10, spin: rand(-8, 8) });
      sfx('throw');
      yield* wait(0.6);
    }
  },
  *bag(b) {
    say(b, pick(['Авоськой тебя!', 'Вот я тебе!']));
    for (let t = 0; t < 0.5; t += yield) b.swing = -0.9 * (t / 0.5);
    for (let k = 0; k < (b.phase2 ? 2 : 1); k++) {
      for (let j = 0; j < 9; j++) ebullet(b.x - 82, b.y + b.oy, Math.PI * (0.62 + j * 0.095) + k * 0.05, 210 + k * 35, { type: j % 2 ? 'carrot' : 'tomato', r: 7, spin: rand(-6, 6) });
      sfx('throw'); b.swing = 0.7;
      yield* wait(0.35);
      b.swing = -0.5;
    }
    for (let t = 0; t < 0.4; t += yield) b.swing = lerp(0.5, 0, t / 0.4);
    b.swing = 0;
  },
  *slippers(b) {
    say(b, pick(['Тапком её!', 'Сейчас как тапком!']));
    for (let k = 0; k < (b.phase2 ? 3 : 2); k++) {
      const x = b.x - 50, y = b.y + b.oy - 20;
      ebullet(x, y, aimAt(x, y) + rand(-0.6, 0.6), 190, { type: 'slipper', r: 11, hp: 2, homing: 1.8, life: 4.5, spin: 9 });
      sfx('throw');
      yield* wait(0.45);
    }
    yield* wait(0.6);
  },
  *charge(b) {
    say(b, pick(['А ну стой!', 'Посторонись, молодёжь!']));
    yield* moveTo(b, b.x, clamp(heroHit().y + 20, 150, H - 135), 0.55);
    yield* dash(b, 980);
  },
  *rain(b) {
    say(b, 'Пироги с неба!');
    for (let k = 0; k < 16; k++) { ebullet(rand(W * 0.05, W * 0.78), -20, Math.PI / 2 + rand(-0.15, 0.15), rand(170, 230), { type: 'pie', r: 10, spin: rand(-6, 6) }); yield* wait(0.13); }
    yield* wait(0.5);
  },
};
const PA = {
  *spread(b) {
    say(b, pick(['Буль-буль-буль!', 'Получай, карасик!']));
    for (let v = 0; v < (b.phase2 ? 4 : 3); v++) {
      b.mouth = 1;
      spread(b.x - 135, b.y + b.oy + 14, b.phase2 ? 7 : 5, 0.2, 235, { col: '#ff6a3d', r: 7 });
      sfx('bubble');
      yield* wait(0.25); b.mouth = 0.3; yield* wait(0.35);
    }
    b.mouth = 0;
  },
  *bite(b) {
    say(b, pick(['Сейчас как укушу!', 'Ам-ам!']));
    yield* moveTo(b, b.x, clamp(heroHit().y, 125, H - 115), 0.55);
    b.mouth = 1;
    yield* dash(b, 900);
  },
  *summon(b) {
    say(b, 'Пираньи, ко мне!');
    for (let k = 0; k < 5; k++) later(k * 0.15, () => enemy('minion', W + 40, H * (0.15 + k * 0.17)));
    yield* wait(1.3);
  },
  *ring(b) {
    say(b, pick(['Пузырьковая буря!', 'Буль-буль!']));
    for (let k = 0; k < (b.phase2 ? 3 : 2); k++) { b.mouth = 0.8; ring(b.x - 60, b.y + b.oy, 14, 185, { col: '#ff6a3d', r: 7 }, rand(0, 1)); sfx('bubble'); yield* wait(0.55); b.mouth = 0; }
    yield* wait(0.3);
  },
  *spiral(b) {
    say(b, 'Водоворот!');
    let a = rand(0, TAU);
    for (let k = 0; k < 30; k++) { ebullet(b.x - 60, b.y + b.oy, a, 195, { col: '#ff6a3d', r: 7 }); ebullet(b.x - 60, b.y + b.oy, a + Math.PI, 195, { col: '#ffb13d', r: 7 }); a += 0.34; yield* wait(0.09); }
    yield* wait(0.4);
  },
};
const CA = {
  *exhaust(b) {
    say(b, pick(['Выхлопом тебя!', 'Нюхни бензинчику!']));
    for (let v = 0; v < (b.phase2 ? 4 : 3); v++) {
      b.exh = 1.5; const q = bp(b, 170, 30);
      spread(q.x, q.y, 6, 0.2, 150, { type: 'smoke', r: 12 });
      sfx('throw'); yield* wait(0.5); b.exh = 0;
      yield* wait(0.15);
    }
  },
  *highbeam(b) {
    say(b, 'Дальний свет!');
    b.lights = 0.8; yield* wait(0.8);
    for (let v = 0; v < (b.phase2 ? 4 : 3); v++) { const q = bp(b, -150, -6); spread(q.x, q.y, 3, 0.1, 400, { type: 'light', r: 6 }); sfx('hit'); b.lights = 0.25; yield* wait(0.28); }
  },
  *tires(b) {
    say(b, 'Лови резину!');
    for (let k = 0; k < (b.phase2 ? 4 : 3); k++) { const q = bp(b, rand(-100, 100), 30); ebullet(q.x, q.y, aimAt(q.x, q.y) + rand(-0.5, 0.5), 175, { type: 'tire', r: 13, hp: 3, homing: 1.3, life: 5, spin: 10 }); sfx('throw'); yield* wait(0.4); }
    yield* wait(0.5);
  },
  *ram(b) {
    say(b, pick(['Тормоза отказали!', 'Би-би, разойдись!']));
    yield* moveTo(b, b.x, clamp(heroHit().y, 180, H - 180), 0.55);
    yield* dash(b, 960);
  },
  *honk(b) {
    say(b, 'БИ-БИ-И-ИП!'); sfx('honk');
    for (let k = 0; k < 2; k++) { const q = bp(b, -40, 0); ring(q.x, q.y, 16, 175, { type: 'note', r: 8, col: k ? '#7ee7f2' : '#ffd43b' }, k * 0.2); yield* wait(0.5); }
    yield* wait(0.3);
  },
};
const SA = {
  *suck(b) {
    say(b, pick(['Иди-ка сюда, карасик!', 'Ам! Сейчас проглочу!']));
    for (let t = 0; t < 0.5; t += yield) b.mouth = t / 0.5;
    b.mouth = 1; b.sucking = true; sfx('suck');
    for (let t = 0; t < (b.phase2 ? 3.2 : 2.6);) {
      const dt = yield; t += dt;
      const sp = bp(b, -165, 12); G.suck = { x: sp.x, y: sp.y, t: 0.15 };
      if (Math.random() < 0.6) { const m = bp(b, -165, 12), x = m.x - rand(150, 520), y = m.y + rand(-170, 170), d = Math.hypot(m.x - x, m.y - y); part({ type: 'dot', x, y, vx: ((m.x - x) / d) * 420, vy: ((m.y - y) / d) * 420, r: rand(1.5, 3), life: d / 420, col: 'rgba(230,250,255,0.8)' }); }
      if (b.phase2 && Math.random() < dt * 2.5) { const q = bp(b, -165, 12); ebullet(q.x, q.y, aimAt(q.x, q.y) + rand(-0.8, 0.8), 150, { type: 'mud', r: 8 }); }
    }
    b.sucking = false; G.suck = null;
    say(b, 'Тьфу!');
    const q = bp(b, -165, 12); spread(q.x, q.y, 9, 0.16, 220, { col: '#c9e86b', r: 7 }); sfx('bubble');
    for (let t = 0; t < 0.4; t += yield) b.mouth = 1 - t / 0.4;
    b.mouth = 0;
  },
  *whisker(b) {
    say(b, 'Усами по усам!');
    for (let v = 0; v < 3; v++) { b.mouth = 0.5; const q = bp(b, -200, 10); spread(q.x, q.y, b.phase2 ? 7 : 5, 0.15, 255, { col: '#c9e86b', r: 7 }); sfx('bubble'); yield* wait(0.45); b.mouth = 0.1; }
    b.mouth = 0;
  },
  *mud(b) {
    say(b, 'Грязевая ванна!');
    const q = bp(b, -150, 20);
    spread(q.x, q.y, 5, 0.32, 140, { type: 'mud', r: 13, burstT: 1.1 });
    sfx('throw'); yield* wait(1.4);
  },
  *belly(b) {
    say(b, 'Пузом тебя!');
    yield* moveTo(b, b.x, clamp(heroHit().y, 130, H - 120), 0.55);
    b.mouth = 0.6; yield* dash(b, 820);
  },
  *summon(b) {
    say(b, 'Сомята, в атаку!');
    for (let k = 0; k < 5; k++) later(k * 0.15, () => enemy('minion', W + 40, H * (0.15 + k * 0.17)));
    yield* wait(1.2);
  },
};
function* carBrain(b) {
  yield* moveTo(b, W - 175, H * 0.5, 2.4);
  b.vul = true;
  say(b, 'Бип-бип! С дороги, утка!');
  yield* wait(1.3);
  const list = ['exhaust', 'highbeam', 'tires', 'ram'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(160, 200), bossY(b), b.phase2 ? 0.7 : 1.0);
    let a = list[i++ % list.length];
    if (b.phase2 && i % 3 === 0) a = 'honk';
    yield* CA[a](b);
    yield* wait(b.phase2 ? 0.45 : 0.8);
  }
}
function* catfishBrain(b) {
  yield* moveTo(b, W - 235, H * 0.5, 2.6);
  b.vul = true;
  say(b, 'Кто тут обидел мою щуку?!');
  yield* wait(1.3);
  const list = ['whisker', 'suck', 'mud', 'belly'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(220, 260), bossY(b), b.phase2 ? 0.7 : 1.0);
    let a = list[i++ % list.length];
    if (b.phase2 && i % 3 === 0) a = 'summon';
    yield* SA[a](b);
    yield* wait(b.phase2 ? 0.45 : 0.8);
  }
}

function* grannyBrain(b) {
  yield* moveTo(b, W - 180, H * 0.5, 2.4);
  b.vul = true;
  say(b, 'Это кто тут летает без шапки?!');
  yield* wait(1.3);
  const list = ['pies', 'bag', 'slippers', 'charge'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(160, 220), rand(150, H - 135), b.phase2 ? 0.7 : 1.0);
    let a = list[i++ % list.length];
    if (b.phase2 && i % 3 === 0) a = 'rain';
    yield* GA[a](b);
    yield* wait(b.phase2 ? 0.45 : 0.8);
  }
}
function* pikeBrain(b) {
  yield* moveTo(b, W - 200, H * 0.5, 2.4);
  b.vul = true;
  say(b, 'Кто посмел плавать в моём море?!');
  yield* wait(1.3);
  const list = ['spread', 'bite', 'summon', 'ring'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(200, 260), rand(125, H - 115), b.phase2 ? 0.7 : 1.0);
    let a = list[i++ % list.length];
    if (b.phase2 && i % 3 === 0) a = 'spiral';
    yield* PA[a](b);
    yield* wait(b.phase2 ? 0.45 : 0.8);
  }
}
function startWarning() {
  G.phase = 'warn'; G.phaseT = 0; G.timers.length = 0;
  G.checkpoint = { score: G.score, power: Math.max(G.power, 3) };
  if (G.LI.boss === 'perch') { G.rush = { list: RUSH.slice(), i: 0 }; banner('ВСЕ БОССЫ ПРОТИВ ТЕБЯ!', 'Щука, Сом, Мегалодон, Кракен, Рыба-меч… и Окунь', 3.0, 'warn'); }
  else banner('ВНИМАНИЕ!', BOSS[G.LI.boss].name, 3.0, 'warn');
  if (G.LI.boss === 'catfish') G.cameo = { x: W + 120, y: 120, t: 0 };
  if (G.LI.boss === 'kraken') G.megaCameo = { x: W + 160, y: 150, t: 0 };
  sfx('siren'); Sound.music(null);
}
function spawnBoss(kindOpt) {
  const kind = kindOpt || (G.rush ? G.rush.list[G.rush.i] : G.LI.boss);
  G.phase = BOSS[kind].mini ? 'mini' : 'boss'; G.phaseT = 0;
  G.cameo = null;
  const b = { kind, x: W + 280, y: H / 2, oy: 0, hp: Math.round(BOSS[kind].hp * DIFF * G.lvlDiff * (G.rush && kind !== 'perch' ? RUSH_HP : 1)), maxHp: Math.round(BOSS[kind].hp * DIFF * G.lvlDiff * (G.rush && kind !== 'perch' ? RUSH_HP : 1)), nose: 0, lights: 0, exh: 0, sucking: false, flash: 0, phase2: false, vul: false, mouth: 0, swing: 0, speech: null, t: 0, dash: false, telegraph: 0, dead: false, deadT: 0, rot: 0, shown: 0 };
  b.brain = { granny: grannyBrain, pike: pikeBrain, car: carBrain, catfish: catfishBrain, squid: squidBrain, mega: megaBrain, kraken: krakenBrain, eel: eelBrain, swordfish: swordBrain, perch: perchBrain, gator: gatorBrain, anaconda: anacondaBrain, crocboss: crocBossBrain, vampire: vampireBrain, salmon: salmonBrain, crayboss: crayBrain }[kind](b);
  b.brain.next();
  G.boss = b;
  G.lastHealT = G.t; G.lastBombT = G.t;
  Sound.music(kind === 'mega' ? 'boss3' : 'boss');
}
function damageBoss(dmg) {
  const b = G.boss;
  if (!b || !b.vul || b.dead) return;
  b.hp -= dmg; b.flash = 0.05; sfx('bossHit');
  if (G.squidUnlocked && !(G.squidT > 0)) G.squidCharge = Math.min(100, G.squidCharge + 0.25);
  if (G.eelUnlocked && !(G.eelT > 0)) G.eelCharge = Math.min(100, G.eelCharge + 0.2);
  if (G.crocUnlocked && !(G.crocT > 0)) G.crocCharge = Math.min(100, G.crocCharge + 0.2);
  if (!b.phase2 && b.hp < b.maxHp * 0.5) {
    b.phase2 = true; G.shake = Math.max(G.shake, 8);
    say(b, { granny: 'Ах так?! Ну держись!', pike: 'Ты меня разозлил!', car: 'Включаю турбо!', catfish: 'Ну всё, карасик, держись!', squid: 'Восемь рук против одного!', mega: 'ДОН-ДОН-ДОН!!!', kraken: 'Ну всё, карась! На абордаж!', eel: 'Вот это напряжение!', swordfish: 'Сейчас я тебя нашинкую!', perch: 'Ты меня разозлил, карасишка!', gator: 'Теперь я по-настоящему голоден!', anaconda: 'Ядом по плавникам! Кусь-кусь-кусь!', crocboss: 'Ну всё, щёлк-щёлк!', vampire: 'Теперь я голоден по-настоящему!', salmon: 'Ну всё, карась, держись!', crayboss: 'Щёлк-щёлк! Сейчас ущипну по-настоящему!' }[b.kind]);
  }
  if (b.hp <= 0) bossDie();
}
function bossDie() {
  const b = G.boss;
  if (BOSS[b.kind].mini) return miniDie(b);
  b.dead = true; b.hp = 0; b.deadT = 0; b.vul = false; b.dash = false; b.telegraph = 0;
  G.phase = 'bossDead'; G.phaseT = 0;
  for (const x of G.eb) { x.dead = true; puff(x.x, x.y); }
  for (const e of G.enemies) killEnemy(e, true);
  b.sucking = false; G.suck = null;
  say(b, { granny: 'Ой-ой-ой! Внукам пожалуюсь!', pike: 'Буль… я ещё вернусь…', car: 'Пш-ш-ш… заглохла…', catfish: 'Ой, усы мои, усы…', mega: 'Дон… дон…', kraken: 'Мои детки… мои щупальца…', swordfish: 'Мой меч… треснул…', perch: 'Не может быть… я же самый сильный…', gator: 'Ш-ш-ш… ты ещё пожалеешь…', anaconda: 'Ш-ш-ш… не может быть…', vampire: 'Мои клыки… мои детки…', salmon: 'Уплываю… на нерест…', crayboss: 'Мои клешни… покраснели от стыда…' }[b.kind]);
  b.lash2 = null;
  b.vlash = null; b.lash = null;
  if (b.kind === 'car') later(1.0, () => { G.heroSay = { text: 'Я твою выхлопную трубу шатала!', t: 3.4 }; sfx('quack2'); });
  addScore(10000, b.x, b.y - 60);
  sfx('boom'); G.shake = 18; G.flash = 0.5; G.flashColor = '#fff';
  Sound.music(null);
}
function updateBoss(dt) {
  const b = G.boss; if (!b) return;
  b.t += dt; b.flash = Math.max(0, b.flash - dt); b.telegraph = Math.max(0, b.telegraph - dt);
  b.shown = Math.min(1, b.shown + dt * 0.6);
  if (b.speech) { b.speech.t -= dt; if (b.speech.t <= 0) b.speech = null; }
  if (b.dead) {
    b.deadT += dt;
    if (b.kind === 'squid' || b.kind === 'eel' || b.kind === 'crocboss') { if (b.deadT > 1.6) b.x += 280 * dt; return; }
    if (b.deadT < 2.2 && Math.random() < dt * 9) { const x = b.x + rand(-90, 90), y = b.y + b.oy + rand(-90, 80); explodeAt(x, y, G.mode === 'duck' ? '#ffb347' : '#9fe8ff'); sfx('pop'); G.shake = Math.max(G.shake, 6); }
    if (b.kind === 'granny') { if (b.deadT > 1.2) { b.rot += dt * 7; b.x += 200 * dt; b.y -= 260 * dt; } }
    else if (b.kind === 'car') { if (b.deadT > 1.2) { b.rot += dt * 3; b.x -= 160 * dt; } if (Math.random() < dt * 6) { const q = bp(b, 160, 20); part({ type: 'smoke', x: q.x, y: q.y, r: 10, r1: 30, col: 'rgba(70,70,80,A)', life: 0.8 }); } }
    else { b.rot = Math.min(Math.PI, b.rot + dt * 2.2); if (b.deadT > 1.2) b.y -= 90 * dt; }
    return;
  }
  b.oy = b.dash || b.telegraph > 0 ? 0 : Math.sin(b.t * 1.7) * 14;
  b.nose = lerp(b.nose, b.dash && G.vert ? 1 : 0, Math.min(1, dt * 8));
  b.lights = Math.max(0, b.lights - dt);
  b.brain.next(dt);
  if (b.vul || b.dash) {
    const h = heroHit();
    for (const [cx, cy, cr] of bossCircles(b)) if (d2(h.x, h.y, cx, cy) < (cr * 0.85 + h.r) ** 2) { hurtPlayer(); break; }
  }
  if (b.lash && b.lash.phase === 'hit') { const h = heroHit(); if (Math.abs(h.y - b.lash.y) < 24 && h.x < b.x) hurtPlayer(); }
}

/* ---------- per-frame update */
function updateShots(dt) {
  const B = G.boss;
  for (const s of G.pb) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.age += dt;
    if (s.x > W + 40 || s.y < -30 || s.y > H + 30) { s.dead = true; continue; }
    if (s.x < -40) { s.dead = true; continue; }
    for (const e of G.enemies) {
      if (e.dead || e.invuln || e.ally || e.x > W + 6) continue;
      const rr2 = e.r + s.r;
      if (d2(s.x, s.y, e.x, e.y) < rr2 * rr2) {
        s.dead = true; hitSpark(s.x, s.y);
        if (s.charm) { if (e.kind !== 'carrier') charmEnemy(e); else damageEnemy(e, 3); } else damageEnemy(e, s.dmg);
        break;
      }
    }
    if (s.dead) continue;
    if (B && B.vul && !B.dead) {
      for (const [cx, cy, cr] of bossCircles(B)) {
        if (d2(s.x, s.y, cx, cy) < (cr + s.r) ** 2) { damageBoss(s.charm ? 10 : s.dmg); s.dead = true; hitSpark(s.x, s.y); break; }
      }
      if (s.dead) continue;
    }
    for (const b of G.eb) {
      if (!b.hp || b.dead) continue;
      if (d2(s.x, s.y, b.x, b.y) < (b.r + s.r) ** 2) { b.hp -= s.dmg; s.dead = true; hitSpark(s.x, s.y); if (b.hp <= 0) { b.dead = true; puff(b.x, b.y); addScore(50); sfx('pop'); } break; }
    }
  }
  G.pb = G.pb.filter((s) => !s.dead);
}
function updateEnemies(dt) {
  const p = G.player, h = heroHit();
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.age += dt; e.flash = Math.max(0, e.flash - dt);
    if (e.follow && G.tunnel) e.baseY = tunnelC(e.x);
    MOVES[e.move](e, dt);
    if (p.alive && !e.harmless && p.inv <= 0 && d2(e.x, e.y, h.x, h.y) < (e.r * 0.8 + h.r) ** 2) {
      hurtPlayer();
      if (!e.invuln && e.kind !== 'heavy' && e.kind !== 'heavy2') damageEnemy(e, 3);
    }
    if (e.x < -130 || e.x > W + 300 || e.y > H + 140 || (e.y < -160 && e.move !== 'hook')) e.dead = true;
  }
  G.enemies = G.enemies.filter((e) => !e.dead);
}
function updateEnemyShots(dt) {
  const p = G.player, h = heroHit();
  for (const b of G.eb) {
    if (b.dead) continue;
    b.age += dt;
    if (b.homing) {
      const want = Math.atan2(h.y - b.y, h.x - b.x), cur = Math.atan2(b.vy, b.vx);
      let da = want - cur; da = Math.atan2(Math.sin(da), Math.cos(da));
      const na = cur + clamp(da, -b.homing * dt, b.homing * dt), sp = Math.hypot(b.vx, b.vy);
      b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
    }
    if (b.grav) b.vy += b.grav * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.spin) b.rot += b.spin * dt;
    if (b.burstT && b.age > b.burstT) { b.dead = true; puff(b.x, b.y); ring(b.x, b.y, 6, 160, { type: b.type === 'mud' ? 'mud' : 'orb', r: 6, col: b.burstCol || '#ff6a3d' }, rand(0, 1)); continue; }
    if ((b.life && b.age > b.life) || b.x < -50 || b.x > W + 80 || b.y < -80 || b.y > H + 50) { b.dead = true; continue; }
    if (p.alive && p.inv <= 0 && d2(b.x, b.y, h.x, h.y) < (b.r * 0.75 + h.r) ** 2) { b.dead = true; hurtPlayer(); }
  }
  G.eb = G.eb.filter((b) => !b.dead);
}
function collect(k) {
  k.dead = true;
  const isHeal = k.type === 'coffee' || k.type === 'burger';
  if (isHeal) {
    if (G.hp < MAX_HP) { G.hp++; floatText(k.x, k.y - 16, '+1 ♥', '#ff8fa3', 22); } else addScore(500, k.x, k.y);
    sfx(k.type === 'coffee' ? 'slurp' : 'chomp'); sfx('heal');
  } else if (k.type === 'power') {
    if (G.power < MAX_POWER) { G.power++; floatText(k.x, k.y - 16, G.power === MAX_POWER ? 'МАКС. СИЛА!' : 'СИЛА +1', '#7ee7f2', 22); } else addScore(1000, k.x, k.y);
    sfx('power');
  } else if (k.type === 'bomb') {
    if (G.bombs < MAX_BOMBS) { G.bombs++; updateBombBtn(); floatText(k.x, k.y - 16, 'СУПЕРУДАР +1', '#ffb347', 20); } else addScore(1000, k.x, k.y);
    sfx('bombGet');
  }
  else if (k.type === 'slow') {
    G.slowT = 7; sfx('slowOn'); floatText(k.x, k.y - 16, 'ЗАМЕДЛЕНИЕ!', '#9fd8ff', 22);
  } else if (k.type === 'charm') {
    G.charm = Math.min(MAX_CHARM, G.charm + 3); G.charmT = 0.3; sfx('charm'); floatText(k.x, k.y - 16, 'ДРУЖБА ×3', '#ff8fc0', 22);
    banner('СЕРДЦЕ ДРУЖБЫ', 'Подстрели врага — он станет другом', 2.2, 'small');
  }
  ringFx(k.x, k.y, 10, 60, isHeal ? '#ff8fa3' : '#fff', 0.35);
}
function updatePickups(dt) {
  const p = G.player, h = heroHit();
  for (const k of G.pickups) {
    k.age += dt;
    if (k.follow && G.tunnel) k.baseY = tunnelC(k.x);
    if (k.float) { k.x += k.vx * dt; k.y = k.baseY + Math.sin(k.age * 2.4) * 14; }
    else { k.vx = lerp(k.vx, -70, Math.min(1, dt * 1.5)); k.vy = lerp(k.vy, 0, Math.min(1, dt * 2.5)); k.x += k.vx * dt; k.y += k.vy * dt; }
    k.y = clamp(k.y, 30, H - 40);
    if (p.alive) {
      const dx = h.x - k.x, dy = h.y - k.y, dd = Math.hypot(dx, dy) || 1;
      if (dd < 110) { const pull = 280 * dt; k.x += (dx / dd) * pull; k.y += (dy / dd) * pull; k.baseY += (dy / dd) * pull; }
      if (dd < k.r + 24) collect(k);
    }
    if (k.x < -50) k.dead = true;
  }
  G.pickups = G.pickups.filter((k) => !k.dead);
}

function update(rdt) {
  setWorld();
  if (G.run) { updateRunner(rdt); return; }
  // slow-motion bonus: the world slows down, the duck does not
  if (G.slowT > 0) { G.slowT -= rdt; G.tickT -= rdt; if (G.tickT <= 0) { G.tickT = 0.5; sfx('tick'); } }
  const dt = G.slowT > 0 ? rdt * 0.4 : rdt;
  G.t += dt; G.phaseT += dt; G.bgT += dt * G.spd;
  if (G.phase === 'mini' || G.phase === 'miniDead' || G.phase === 'portal') G.evOff += dt;  // level script waits
  if (G.suck) { G.suck.t -= rdt; if (G.suck.t <= 0) G.suck = null; }
  G.burstCd -= rdt;
  for (let i = G.timers.length - 1; i >= 0; i--) { const tm = G.timers[i]; tm.t -= dt; if (tm.t <= 0) { G.timers.splice(i, 1); tm.fn(); } }
  if (G.heroSay) { G.heroSay.t -= rdt; if (G.heroSay.t <= 0) G.heroSay = null; }
  if (G.cameo) { G.cameo.t += dt; G.cameo.x -= 230 * dt; }
  if (G.tunnel && tunScroll() > G.tunnel.u0 + G.tunnel.len + 80) G.tunnel = null;
  switch (G.phase) {
    case 'intro': if (G.phaseT >= 1.4) { G.phase = 'waves'; G.phaseT = 0; } break;
    case 'turn': break;
    case 'waves':
      while (G.ev < G.L.length && G.L[G.ev][0] <= G.t - G.evOff && G.phase === 'waves') G.L[G.ev++][1]();
      if (G.phase === 'waves' && G.t - G.evOff >= G.len) startWarning();
      break;
    case 'warn': if (G.phaseT >= 3.2) spawnBoss(); break;
    case 'bossDead':
      if (G.rush && G.boss && G.rush.i < G.rush.list.length - 1) { if (G.phaseT >= 2.6) { G.phase = 'boss'; G.phaseT = 0; rushNext(); } }
      else if (G.boss && OUTRO[G.boss.kind]) { if (G.phaseT >= 2.6) { G.phase = 'outro'; G.phaseT = 0; G.outro = { t: 0, s: 0, kind: G.boss.kind }; } }
      else if (G.phaseT >= 4.4) onWin();
      break;
    case 'miniDead': if (G.phaseT >= 3.2) endMini(); break;
    case 'outro': updateOutro(rdt); break;
    case 'dead': if (G.phaseT >= 2.2) onGameOver(); break;
  }
  if ((G.phase === 'waves' || G.phase === 'boss' || G.phase === 'mini') && !(G.tunnel && tunAt(W * 0.5))) {
    const healOnScreen = G.pickups.some((k) => k.type === G.M.heal);
    if (!healOnScreen && ((G.hp <= 2 && G.t - G.lastHealT > 12) || (G.phase === 'boss' && G.hp < MAX_HP && G.t - G.lastHealT > 22))) F.health(rand(0.25, 0.75));
    if (G.phase === 'boss' && G.bombs === 0 && G.t - G.lastBombT > 24) { pickup('bomb', W + 30, rand(0.25, 0.75) * H); G.lastBombT = G.t; }
  }
  for (const w of G.warns) w.t -= dt;
  G.warns = G.warns.filter((w) => w.t > 0);
  updatePlayer(rdt);
  updateShots(rdt);
  updateEnemies(dt);
  updateBoss(dt);
  updateSqueeze(dt);
  updateLevel4(dt);
  updateLevel6(dt);
  updateLevel7(dt);
  updateLevel10();
  updateLevel11();
  updateSquid(rdt);
  updateEel(rdt);
  updateCrocAlly(rdt);
  updateHelpers(dt);
  updateEnemyShots(dt);
  updatePickups(rdt);
  updateBomb(rdt);
  updateParts(rdt);
  updateBg(dt);
  G.shake = Math.max(0, G.shake - rdt * 28);
  G.flash = Math.max(0, G.flash - rdt * 2.2);
}
