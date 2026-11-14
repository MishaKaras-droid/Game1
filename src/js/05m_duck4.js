/* ============================================================ duck level 4: graphics evolution — city run, Boost, the living Dissertation
   Level 3 keeps its look. Level 4 turns on: real-time shadows, toon shading with ink outlines,
   a 3D city, a Boost gauge that burns while you smash through everything (Sonic-style). */
LEVEL_INFO[4].duck = { name: 'Город · эпоха Boost', boss: 'thesis', song: 'sky2' };
const LEVEL4_DUCK = [];
const TRACK_PLAN4 = [
  ['straight', 60], ['curve', 140, 0.8], ['hill', 110, 0.15], ['straight', 40], ['scurve', 170, 0.8], ['loop', 90], ['straight', 50],
  ['curve', 130, -1], ['hill', 120, 0.18], ['straight', 40], ['scurve', 170], ['loop', 90], ['curve', 140, 1], ['straight', 50],
  ['hill', 110, 0.15], ['curve', 130, -0.8], ['loop', 90], ['straight', 60], ['scurve', 170], ['straight', 80],
];
const BOSS4_AT = 1990;

/* ---------- the track: meme enemies, taxis, coffee lines */
function buildTrack4() {
  const Rn = mulberry(404), objs = [];
  const add = (o) => objs.push(Object.assign({ x: 0, h: 0, dead: false }, o));
  const cups = (d0, lane, n, gap, h, arc) => { for (let i = 0; i < n; i++) add({ type: 'cup', d: d0 + i * gap, x: laneX(lane), h: h + (arc ? Math.sin((i / Math.max(1, n - 1)) * Math.PI) * arc : 0) }); };
  let d = 60;
  const loopsDone = new Set();
  while (d < BOSS4_AT - 70) {
    const lr = planRanges().find(([a, b, ty]) => ty === 'loop' && d > a - 22 && d < b + 10);
    if (lr) { if (!loopsDone.has(lr[0])) { loopsDone.add(lr[0]); cups(lr[0] - 6, 1, Math.floor((lr[1] - lr[0] + 6) / 3), 3, 0.5); } d = lr[1] + 14; continue; }
    const pool = d < 220 ? ['capy', 'line', 'jump'] : d < 450 ? ['capy', 'floppa', 'roll', 'line', 'bonk'] : ['capy', 'floppa', 'bonk', 'car', 'traffic', 'dash', 'spring', 'roll', 'mix'];
    const pat = pool[Math.floor(Rn() * pool.length)], L = Math.floor(Rn() * 3), L2 = (L + 1 + Math.floor(Rn() * 2)) % 3, L3 = 3 - L - L2;
    switch (pat) {
      case 'line': cups(d, L, 9, 2.6, 0.5); add({ type: 'dash', d: d - 5, x: laneX(L) }); break;
      case 'jump': add({ type: 'cone', d, x: laneX(L) }); add({ type: 'barrier', d, x: laneX(L2) }); cups(d - 9, L3, 7, 3, 0.5, 0); break;
      case 'roll': add({ type: 'bar', d, x: laneX(L) }); add({ type: 'bar', d, x: laneX(L2) }); cups(d - 6, L, 5, 3, 0.35); break;
      case 'capy': add({ type: 'capy', d: d + 8, x: laneX(L), v: -3.5 }); cups(d - 6, L2, 6, 3, 0.5); break;
      case 'floppa': add({ type: 'floppa', d, x: laneX(L) }); if (Rn() < 0.5) add({ type: 'cone', d, x: laneX(L2) }); cups(d - 6, L3, 6, 3, 0.5); break;
      case 'bonk': add({ type: 'bonk', d, x: laneX(L), ph: Rn() * 3 }); add({ type: 'bonk', d: d + 10, x: laneX(L2), ph: Rn() * 3 }); cups(d - 6, L3, 6, 3, 0.5); break;
      case 'car': add({ type: 'car', d, x: laneX(L) }); add({ type: 'car', d: d + 7, x: laneX(L2) }); cups(d - 6, L3, 7, 3, 0.5); break;
      case 'traffic': for (let k = 0; k < 3; k++) add({ type: 'car', d: d + 6, x: laneX(k) }); add({ type: 'dash', d: d - 10, x: laneX(L) }); add({ type: 'spring', d: d - 4, x: laneX(L2) }); cups(d - 2, L2, 6, 3.2, 1.5, 4); break;
      case 'dash': add({ type: 'dash', d, x: laneX(L) }); cups(d + 4, L, 8, 3.5, 0.5); for (let k = 0; k < 3; k++) if (k !== L) add({ type: 'cone', d: d + 14, x: laneX(k) }); break;
      case 'spring': add({ type: 'spring', d, x: laneX(L) }); cups(d + 5, L, 8, 3.2, 1.5, 4.2); add({ type: 'car', d: d + 14, x: laneX(L) }); break;
      case 'mix': add({ type: 'floppa', d, x: laneX(L) }); add({ type: 'capy', d: d + 12, x: laneX(L2), v: -3 }); add({ type: 'bonk', d: d + 6, x: laneX(L3), ph: 1 }); break;
    }
    d += 34 - (d / BOSS4_AT) * 8 + Rn() * 10;
  }
  return objs.sort((a, b) => a.d - b.d);
}
function collide4(o, R) {
  const air = R.y, rolling = R.roll > 0 && R.y < 0.5;
  switch (o.type) {
    case 'capy': return air > 0.9;
    case 'floppa': if (air > 0.8) { runDestroy(o); R.vy = 12; return true; } return false;
    case 'bonk': return Math.abs(air - o.h) > 1.0;
    case 'car': return air > 1.6;
    case 'sheet': return air > 0.3;
    case 'pen': return rolling || air > 2.6;
    case 'cite': return Math.abs(air - o.h) > 1.0;
    case 'laser': return air > 0.7;
  }
  return undefined;
}

/* ---------- Boost: tap to burn the gauge, smash everything, chain kills refill it */
function runBoostDrain() {
  const R = G.run;
  if (R.boostDrain) { R.boostDrain = false; return; }
  if (R.meter < 20) { if (!R.boostNag || R.t - R.boostNag > 1.5) { R.boostNag = R.t; floatText(SW / 2, SH * 0.7, 'Шкала BOOST почти пуста — собирай кофе!', '#bfe6ff', 18); sfx('click'); } return; }
  R.boostDrain = true; R.chain = 0;
  banner('BOOST!', '', 1, 'small'); sfx('power'); sfx('swoosh'); G.shake = 7;
}
function boostChain(R, q) {
  R.meter = Math.min(100, R.meter + 7); R.chain = (R.chain || 0) + 1;
  if (R.chain >= 2) floatText(q ? q.sx : SW / 2, q ? q.sy - 40 : SH * 0.4, 'BOOST ×' + R.chain, '#7ee7f2', 18 + Math.min(10, R.chain));
}

/* ---------- the living Dissertation */
const THESIS_LINES = {
  intro: 'Я — диссертация на 300 страниц!',
  tired: ['Уф… опечатка…', 'Скрепки разошлись…', 'Где мои сноски…'],
  back: ['Ещё 200 страниц!', 'Защита завтра!', 'Переделывай введение!'],
  hurt: ['Ай! Мой титульный лист!', 'Только не по оглавлению!', 'Моё научное значение!'],
  dead: 'Я… защищена…',
};
function thesisAttack(B) {
  const R = G.run, kind = ['sheet', 'pen', 'cite', 'laser'][(B.vol + B.round) % 4];
  const lanes = [0, 1, 2].sort(() => Math.random() - 0.5), n = B.hp <= 2 ? 2 : (Math.random() < 0.5 ? 1 : 2);
  B.mouth = 1;
  const d = R.s + B.z;
  if (kind === 'sheet') { shawSay(pick(['Листы рецензии!', 'Получай черновик!'])); for (let i = 0; i < n; i++) R.objs.push({ type: 'sheet', d: d - 2, x: laneX(lanes[i]), h: 0, fall: B.h + 3, ft: 0 }); }
  else if (kind === 'pen') { shawSay('Красная ручка научрука!'); for (let i = 0; i < n; i++) R.objs.push({ type: 'pen', d: d - 2, x: laneX(lanes[i]), h: 1.3, v: -10 }); }
  else if (kind === 'cite') { shawSay(pick(['Сноска на сноске!', 'Где список литературы?!'])); for (let i = 0; i < n + 1; i++) R.objs.push({ type: 'cite', d: d - 2 - i * 3, x: laneX(lanes[i % 3]), h: 0, ph: rand(0, 3) }); }
  else { shawSay('АНТИПЛАГИАТ! Оригинальность 12%!'); for (let i = 0; i < 2; i++) R.objs.push({ type: 'laser', d: d - 2, x: laneX(lanes[i]), h: 0, v: -9 }); }
  R.objs.sort((a, b) => a.d - b.d); R.i = 0;
  sfx('throw');
}

/* ---------- start cards and meme hints */
const MEME_HINT = {
  capy: ['КАПИБАРА', 'Идёт навстречу — перепрыгни или атакуй в прыжке'],
  floppa: ['ШЛЁПА', 'Большой кот! Обойди или прыгни ему на голову'],
  bonk: ['БОНК-ПЁС', 'Скачет с битой — лови момент'],
  car: ['ТАКСИ', 'Объезжай или пробей насквозь на BOOST'],
};
function tick4(R) {
  if (R.cards === undefined) R.cards = R.s > 100 ? 2 : 0;
  // the title card goes first; the control hints wait until it is gone
  if (R.cards === 0 && R.t > 0.1) { R.cards = 1; R.hints.jump = 1; banner('ГОРОД', 'Эволюция графики: тени · мультяшный свет · BOOST', 2.6, 'green'); sfx('power'); }
  if (R.cards === 1 && R.t > 2.9) { R.cards = 2; banner('ПРЫЖОК', isTouch ? 'Кнопка «Прыжок» справа внизу' : 'Стрелка вверх или Пробел', 2.4, 'small'); }
  if (R.cards < 2) return;
  if (!R.hints.boostE && R.s > 140 && R.phase === 'run') { R.hints.boostE = 1; banner('BOOST', isTouch ? 'Жми шкалу BOOST — утка сносит всё, пока шкала не пуста' : 'Shift — BOOST: сносишь всё, пока шкала не пуста', 2.8, 'small'); }
  for (let j = R.i; j < R.objs.length; j++) {
    const o = R.objs[j], dz = o.d - R.s; if (dz > 45) break;
    if (dz > 20 && MEME_HINT[o.type] && !R.hints['m_' + o.type]) { R.hints['m_' + o.type] = 1; banner(MEME_HINT[o.type][0], MEME_HINT[o.type][1], 2.4, 'small'); break; }
  }
}

/* ============================================================ 2D art: meme sprites (front view) */
function sprCapy(c, t) {
  P(c); ell(c, -22, -4, 12, 6); ell(c, 22, -4, 12, 6); c.fillStyle = '#4a3020'; c.fill();
  P(c); ell(c, 0, -40, 52, 40); fs(c, '#9a6a3e', 3);
  P(c); rr(c, -36, -112, 72, 66, 28); fs(c, '#a8774a', 3);
  for (const s of [-1, 1]) { P(c); circ(c, s * 30, -108, 9); fs(c, '#7a5230', 2.5); }
  P(c); rr(c, -26, -74, 52, 28, 13); fs(c, '#7a5230', 2.5);
  P(c); ell(c, -9, -62, 4, 3); ell(c, 9, -62, 4, 3); c.fillStyle = INK; c.fill();
  for (const s of [-1, 1]) { P(c); c.arc(s * 15, -88, 6, 0.15 * Math.PI, 0.85 * Math.PI); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); }
  const b = Math.sin(t * 3) * 2;
  P(c); circ(c, 0, -126 + b, 15); fs(c, '#ff9a1f', 3);
  P(c); ell(c, 6, -142 + b, 8, 4, -0.5); fs(c, '#3fa34d', 2);
  P(c); circ(c, -5, -130 + b, 3); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fill();
}
function sprFloppa(c, t) {
  P(c); ell(c, 0, -34, 46, 36); fs(c, '#c99a62', 3);
  P(c); ell(c, 0, -20, 28, 22); c.fillStyle = '#f2e2c4'; c.fill();
  const tw = Math.sin(t * 4) * 3;
  for (const s of [-1, 1]) {
    P(c); c.moveTo(s * 18, -112); c.lineTo(s * 40, -170 + tw * s); c.lineTo(s * 46, -100); c.closePath(); fs(c, '#c99a62', 3);
    line(c, [s * 40, -168 + tw * s, s * 44, -196 + tw * s], 4); P(c); c.moveTo(s * 26, -116); c.lineTo(s * 38, -150); c.lineTo(s * 40, -110); c.closePath(); c.fillStyle = '#3a2a22'; c.fill();
  }
  P(c); ell(c, 0, -96, 48, 40); fs(c, '#d4a46a', 3);
  P(c); ell(c, 0, -80, 26, 18); c.fillStyle = '#f6ead2'; c.fill();
  for (const s of [-1, 1]) { P(c); ell(c, s * 18, -104, 8, 6); fs(c, '#2b2a1e', 2); line(c, [s * 30, -118, s * 8, -112], 3.5); }
  P(c); c.moveTo(-6, -88); c.lineTo(6, -88); c.lineTo(0, -81); c.closePath(); c.fillStyle = '#3a2a22'; c.fill();
  P(c); c.moveTo(-10, -74); c.quadraticCurveTo(0, -78, 10, -74); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
  for (const s of [-1, 1]) for (const k of [-1, 1]) line(c, [s * 14, -80, s * 40, -84 + k * 6], 1.3, '#3a2a22');
}
function sprBonk(c, t) {
  const sw = Math.sin(t * 8);
  c.save(); c.translate(38, -70); c.rotate(-0.9 + sw * 0.6); tube(c, [0, 0, 0, -60], 9, '#b07a45'); c.restore();
  P(c); ell(c, 0, -30, 34, 30); fs(c, '#e2913a', 3);
  P(c); ell(c, 0, -22, 20, 20); c.fillStyle = '#fbeedd'; c.fill();
  for (const s of [-1, 1]) { P(c); c.moveTo(s * 14, -108); c.lineTo(s * 30, -138); c.lineTo(s * 38, -98); c.closePath(); fs(c, '#e2913a', 3); }
  P(c); ell(c, 0, -90, 40, 34); fs(c, '#e8963c', 3);
  P(c); ell(c, 0, -74, 26, 18); c.fillStyle = '#fbeedd'; c.fill();
  for (const s of [-1, 1]) { P(c); c.arc(s * 15, -94, 6, 1.15 * Math.PI, 1.85 * Math.PI); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); }
  P(c); ell(c, 0, -80, 6, 4); c.fillStyle = INK; c.fill();
  P(c); c.moveTo(-8, -70); c.quadraticCurveTo(0, -64, 8, -70); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
}
function sprCite(c) {
  P(c); rr(c, -34, -64, 68, 54, 12); fs(c, '#fffaf0', 4, '#c4141f');
  c.font = '34px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText('[1]', 0, -36);
}
const SPR4 = { capy: sprCapy, floppa: sprFloppa, bonk: sprBonk, cite: sprCite };
function drawRun2D4(c, o, base, k, t) {
  const f = SPR4[o.type]; if (!f) return;
  const q = runProj(o.x, o.h || 0, o.d - G.run.s + RUN.PZ);
  c.save(); c.translate(q.sx, q.sy); c.scale(k / 90, k / 90); f(c, t); c.restore();
}
function drawThesis(c, x, y, S, t, B) {
  c.save(); c.translate(x, y); const s = S / 200; c.scale(s, s);
  const angry = B.hp <= 2, tired = B.state === 'tired' || B.state === 'hurt', m = B.mouth || 0;
  if (B.flash > 0 && Math.floor(B.flash * 20) % 2) c.globalAlpha = 0.6;
  for (let i = 0; i < 4; i++) {
    const a = t * 1.6 + i * 1.57, px = Math.cos(a) * 92, py = -110 + Math.sin(a) * 36;
    c.save(); c.translate(px, py); c.rotate(a); P(c); c.rect(-14, -18, 28, 36); fs(c, '#fffaf0', 2);
    for (let k = 0; k < 4; k++) line(c, [-9, -10 + k * 7, 9, -10 + k * 7], 1.2, '#9aa3ad'); c.restore();
  }
  const wv = Math.sin(t * 5) * 14;
  tube(c, [-66, -110, -108, -128 + wv, -124, -160 + wv], 12, '#fffaf0');
  tube(c, [62, -110, 104, -128 - wv, 120, -160 - wv], 12, '#fffaf0');
  P(c); rr(c, -60, -194, 136, 190, 8); fs(c, '#f4ecd8', 3);
  for (let k = 0; k < 26; k++) line(c, [64, -186 + k * 7, 74, -186 + k * 7], 1, '#c9bfa8');
  P(c); rr(c, -72, -200, 134, 194, 10); fs(c, angry ? '#7a1f2b' : '#1f3a6b', 4);
  P(c); c.rect(-72, -196, 14, 186); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill();
  P(c); rr(c, -52, -188, 104, 170, 6); c.lineWidth = 2.5; c.strokeStyle = '#e8c24a'; c.stroke();
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e8c24a';
  c.font = '17px ' + FONT_DISPLAY; c.fillText('ДИССЕР-', 0, -168); c.fillText('ТАЦИЯ', 0, -150);
  c.font = '900 10px ' + FONT_UI; c.fillText('ТОМ 1 · 300 С.', 0, -133);
  if (tired) { for (const ex of [-24, 24]) { line(c, [ex - 9, -104, ex + 9, -86], 4.5, '#fffaf0'); line(c, [ex - 9, -86, ex + 9, -104], 4.5, '#fffaf0'); } }
  else {
    eye(c, -24, -95, 13, 0, 0.15, 0, '#c4141f'); eye(c, 24, -95, 13, 0, 0.15, 0, '#c4141f');
    line(c, [-42, -118 + (angry ? 4 : 0), -10, -110], 5, '#fffaf0'); line(c, [42, -118 + (angry ? 4 : 0), 10, -110], 5, '#fffaf0');
  }
  P(c); ell(c, 0, -52, 26, 6 + m * 16); fs(c, '#0d1a33', 3, '#fffaf0');
  if (m > 0.2) { c.fillStyle = '#fffaf0'; for (let k = -2; k <= 2; k++) { P(c); c.rect(k * 9 - 3, -52 - 6 - m * 8, 6, 8); c.fill(); } }
  P(c); c.moveTo(22, -6); c.lineTo(22, 26 + Math.sin(t * 6) * 4); c.lineTo(30, 18); c.lineTo(38, 26 + Math.sin(t * 6 + 1) * 4); c.lineTo(38, -6); c.closePath(); fs(c, '#c4141f', 2);
  if (B.state === 'tired') for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; P(c); starPath(c, Math.cos(a) * 60, -194 + Math.sin(a) * 8, 11, 4.5); fs(c, '#ffe14d', 2); }
  c.restore();
}
function drawEnd4(c, t) {
  const g = c.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#2a3a7a'); g.addColorStop(0.55, '#ff9e6a'); g.addColorStop(1, '#ffd8a8');
  c.fillStyle = g; c.fillRect(0, 0, SW, SH);
  const R = mulberry(77);
  for (let x = -20; x < SW; ) {
    const w = 60 + R() * 70, h = 90 + R() * 200; c.fillStyle = R() < 0.5 ? '#3d3a6b' : '#4a4880'; c.fillRect(x, SH - 90 - h, w, h);
    for (let wy = SH - 80 - h; wy < SH - 100; wy += 18) for (let wx = x + 8; wx < x + w - 10; wx += 16) { c.fillStyle = R() < 0.45 ? '#ffd27a' : '#2b2850'; c.fillRect(wx, wy, 8, 10); }
    x += w + 6;
  }
  for (let i = 0; i < 4; i++) {
    const p = ((t + i * 0.45) % 1.8) / 1.8, cx = SW * (0.15 + 0.22 * i), cy = SH * (0.18 + 0.1 * (i % 2)), col = ['#ffd43b', '#ff8fa3', '#7ee7f2', '#9dff6a'][i];
    c.globalAlpha = Math.max(0, 1 - p);
    for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; P(c); circ(c, cx + Math.cos(a) * p * 110, cy + Math.sin(a) * p * 110 + p * p * 30, 4); c.fillStyle = col; c.fill(); }
    c.globalAlpha = 1;
  }
  c.fillStyle = '#5a5f6b'; c.fillRect(0, SH - 90, SW, 90); c.fillStyle = '#c9ccd4'; c.fillRect(0, SH - 96, SW, 10);
  c.fillStyle = '#ffd43b'; for (let x = 20; x < SW; x += 90) c.fillRect(x, SH - 46, 46, 6);
  // the defeated dissertation lies on the street with a red stamp
  c.save(); c.translate(SW * 0.76, SH - 92); c.rotate(0.16); c.scale(0.62, 0.62);
  drawThesis(c, 0, 0, 200, 0, { hp: 0, state: 'tired', mouth: 0, flash: 0 }); c.restore();
  c.save(); c.translate(SW * 0.76, SH - 150); c.rotate(-0.28);
  P(c); rr(c, -96, -22, 192, 44, 8); c.fillStyle = 'rgba(255,250,240,0.85)'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#d62828'; c.stroke();
  c.font = '26px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#d62828'; c.fillText('ЗАЩИЩЕНО', 0, 2); c.restore();
  // Ilona the duck jumps for joy in a graduation cap
  const bob = Math.abs(Math.sin(t * 4)) * 46, dx = SW * 0.36, dy = SH - 200 - bob;
  drawDuckHero(c, dx, dy, t, { h: 210, flapSpeed: 16, tilt: Math.sin(t * 4) * 0.08 });
  c.save(); c.translate(dx + 4, dy - 92); c.rotate(-0.12 + Math.sin(t * 4) * 0.05);
  P(c); rr(c, -26, -4, 52, 20, 4); fs(c, '#1b1b22', 3);
  P(c); c.moveTo(-62, -6); c.lineTo(0, -26); c.lineTo(62, -6); c.lineTo(0, 12); c.closePath(); fs(c, '#22222b', 3);
  const ts = Math.sin(t * 6) * 6; line(c, [0, -8, 44, 2, 46 + ts * 0.3, 34], 2.5, '#ffd43b');
  P(c); rr(c, 40 + ts * 0.3, 32, 12, 16, 4); fs(c, '#ffd43b', 1.5);
  c.restore();
}

/* ============================================================ 3D: city, toon shading, shadows, Boost trail */
const R3E = { inited: false };
function r3EvoInit() {
  if (R3E.inited) return; R3E.inited = true;
  const tones = new Uint8Array([70, 150, 255]);
  const gm = new THREE.DataTexture(tones, 3, 1, THREE.LuminanceFormat); gm.minFilter = gm.magFilter = THREE.NearestFilter; gm.generateMipmaps = false; gm.needsUpdate = true;
  R3E.grad = gm; R3E.cache = new Map();
  R3E.outline = new THREE.MeshBasicMaterial({ color: '#1b1626', side: THREE.BackSide });
  R3E.skyTex = canvasTex(4, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2d58c8'); g.addColorStop(0.42, '#7da2f0'); g.addColorStop(0.5, '#ffc59a'); g.addColorStop(1, '#ffe0bf'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const win = (lit, base) => canvasTex(64, 64, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    for (let y = 6; y < h; y += 16) for (let x = 6; x < w; x += 16) { c.fillStyle = Math.random() < lit ? '#ffe7a3' : '#2b3a5a'; c.fillRect(x, y, 8, 10); }
  }, true);
  R3E.bld = [];
  for (const base of ['#e6dccb', '#c9d6e8', '#f2c6a8', '#b8c9b2', '#d8c4e6']) for (const [rx, ry, hh] of [[3, 3, 12], [3, 6, 24], [3, 10, 40]]) {
    const tx = win(0.35, base); tx.repeat.set(rx, ry);
    R3E.bld.push({ mat: new THREE.MeshLambertMaterial({ map: tx }), h: hh });
  }
  R3E.roof = new THREE.MeshLambertMaterial({ color: '#6b6f7a' });
  R3E.lampMat = new THREE.MeshBasicMaterial({ color: '#fff3c4' });
  R3E.tail = new THREE.MeshBasicMaterial({ color: '#ff3040' });
  R3E.concrete = new THREE.MeshLambertMaterial({ color: '#b9bec8', side: THREE.DoubleSide });
  R3E.rail = new THREE.MeshLambertMaterial({ color: '#c9ced6', side: THREE.DoubleSide });
  R3E.post = new THREE.MeshLambertMaterial({ color: '#7d838f' });
  R3E.lampGlow = new THREE.SpriteMaterial({ map: canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,240,190,1)'); g.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  R3E.far = new THREE.MeshBasicMaterial({ color: '#8c93c8', fog: true });
  R3E.ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshLambertMaterial({ color: '#8a8f9c' }));
  R3E.ground.rotation.x = -Math.PI / 2; R3E.ground.position.y = -7; R3E.ground.receiveShadow = true; R3E.ground.visible = false; R3.scene.add(R3E.ground);
  R3E.signs = ['КОФЕ С СОБОЙ', 'ГОРОД УТОК', 'ДИССЕРТАЦИИ НА ЗАКАЗ', 'ШАВЕРМА 24/7', 'BOOST!'].map((txt, i) => new THREE.MeshBasicMaterial({ map: canvasTex(256, 96, (c, w, h) => {
    c.fillStyle = ['#ff7a1a', '#2a6bff', '#7e4fa0', '#e63946', '#1f9e5b'][i]; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#fff'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12);
    c.fillStyle = '#fff'; c.font = '900 ' + (txt.length > 14 ? 22 : 34) + 'px Nunito, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, w / 2, h / 2 + 2);
  }), side: THREE.DoubleSide }));
  R3E.trailMat = new THREE.SpriteMaterial({ map: R3E.lampGlow.map, color: '#8fe8ff', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  R3E.trail = [];
  for (let i = 0; i < 16; i++) { const s = new THREE.Sprite(R3E.trailMat.clone()); s.visible = false; R3.scene.add(s); R3E.trail.push(s); }
  R3E.trailI = 0;
}
// replace lit materials with toon ones; meshes cast and receive shadows; optional ink outline
function r3Toonify(obj, outline) {
  obj.traverse((m) => {
    if (!m.isMesh || m.userData.isOutline) return;
    const mat = m.material;
    if (mat && (mat.isMeshLambertMaterial || mat.isMeshPhongMaterial)) {
      let tm = R3E.cache.get(mat.uuid);
      if (!tm) { tm = new THREE.MeshToonMaterial({ color: mat.color, map: mat.map || null, gradientMap: R3E.grad, vertexColors: mat.vertexColors, side: mat.side, emissive: mat.emissive || new THREE.Color(0) }); R3E.cache.set(mat.uuid, tm); }
      m.material = tm;
    }
    m.castShadow = !m.material.isMeshBasicMaterial; m.receiveShadow = true;
    if (outline && !m.material.transparent) { const o = new THREE.Mesh(m.geometry, R3E.outline); o.scale.setScalar(1.08); o.userData.isOutline = true; o.castShadow = false; m.add(o); }
  });
}
function r3EvoSetup(on) {
  R3.evoOn = on;
  const r = R3.renderer;
  if (on) r3EvoInit();
  r.shadowMap.enabled = on && !R3E.noShadow; r.shadowMap.type = isTouch ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  R3E.slow = 0; R3E.fast = 0;
  R3.sun.castShadow = on && !R3E.noShadow;
  if (on) {
    const sz = isTouch ? 1024 : 2048; R3.sun.shadow.mapSize.set(sz, sz);
    const sc = R3.sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 90; sc.updateProjectionMatrix();
    R3.sun.shadow.bias = -0.0006; R3.sun.intensity = 1.0; R3.hemi.intensity = 0.62;
    if (!R3.sun.target.parent) R3.scene.add(R3.sun.target);
  } else { R3.sun.intensity = 0.75; R3.hemi.intensity = 0.85; R3.sun.position.set(-0.5, 1, 0.6); R3.sun.target.position.set(0, 0, 0); }
  R3.sky.material.map = on ? R3E.skyTex : R3.tex.sky; R3.sky.material.needsUpdate = true;
  R3.scene.fog.color.set(on ? '#ffd2b0' : '#cfeeff'); R3.scene.fog.near = on ? 60 : 70; R3.scene.fog.far = on ? 260 : 300;
  R3.water.visible = !on; if (R3E.ground) R3E.ground.visible = on;
  for (const m of Object.values(R3.mat)) m.needsUpdate = true;
  R3.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
  for (const s of R3E.trail || []) s.visible = false;
}
function buildCityChunk(ci) {
  const T = R3.track, d0 = ci * 100, d1 = d0 + 100;
  trackEnsure(T, d1 + 2);
  const g = new THREE.Group(), H = RUN.HALF, rows = { road: [], curbL: [], curbR: [], shL: [], shR: [], skL: [], skR: [], railL: [], railR: [] };
  const rnd = mulberry(2000 + ci), road = rgb('#5d6371'), side = rgb('#c3c7cf'), curb = rgb('#ffd43b');
  const flatR = (R) => { const v = R.clone(); v.y = 0; return v.lengthSq() > 1e-6 ? v.normalize() : new THREE.Vector3(1, 0, 0); };
  for (let d = d0; d <= d1; d++) {
    const P = T.P[d], R = T.R[d], U = T.U[d], seg = T.seg[d], v = d / 8;
    const loop = seg === 'loop', sw = loop ? 0 : 4, at = (x, h) => P.clone().addScaledVector(R, x).addScaledVector(U, h);
    rows.road.push({ pts: [at(-H, 0), at(0, 0), at(H, 0)], us: [0, 0.5, 1], v, col: road });
    rows.curbL.push({ pts: [at(-H - 0.45, 0.08), at(-H, 0.08)], v: d / 2, col: curb });
    rows.curbR.push({ pts: [at(H, 0.08), at(H + 0.45, 0.08)], v: d / 2, col: curb });
    rows.shL.push({ pts: [at(-H - sw - 0.45, 0.02), at(-H - 0.45, 0.02)], v, col: side });
    rows.shR.push({ pts: [at(H + 0.45, 0.02), at(H + 0.45 + sw, 0.02)], v, col: side });
    rows.skL.push({ pts: [at(-H - sw - 0.45, 0.02), at(-H - sw - 0.45, -1.4)], us: [0, 1], v: d / 3 });
    rows.skR.push({ pts: [at(H + sw + 0.45, 0.02), at(H + sw + 0.45, -1.4)], us: [0, 1], v: d / 3 });
    rows.railL.push({ pts: [at(-H - sw - 0.3, 0.7), at(-H - sw - 0.3, 0.95)], v });
    rows.railR.push({ pts: [at(H + sw + 0.3, 0.7), at(H + sw + 0.3, 0.95)], v });
    const flat = !loop && Math.abs(U.y) > 0.85;
    if (d % 6 === 0) for (const s of [-1, 1]) { const p = new THREE.Mesh(R3.geo.box, R3E.post); p.scale.set(0.12, 1.0, 0.12); p.position.copy(at(s * (H + sw + 0.3), 0.45)); orient(p, { r: R, u: U, f: T.F[d] }); g.add(p); }
    if (flat && d % 24 === 12) for (const s of [-1, 1]) {
      const base = at(s * (H + sw - 0.4), 0), pole = new THREE.Mesh(R3.geo.cyl, R3E.post); pole.scale.set(0.09, 4.2, 0.09); pole.position.copy(base).addScaledVector(U, 2.1); g.add(pole);
      const head = base.clone().addScaledVector(U, 4.2).addScaledVector(R, -s * 0.7), lamp = new THREE.Mesh(R3.geo.sphere, R3E.lampMat); lamp.scale.setScalar(0.2); lamp.position.copy(head); g.add(lamp);
      const gl = new THREE.Sprite(R3E.lampGlow); gl.scale.set(2.2, 2.2, 1); gl.position.copy(head); g.add(gl);
    }
    if (flat && d % 10 === 5) for (const s of [-1, 1]) {
      if (rnd() < 0.15) continue;
      const fr = flatR(R), off = H + sw + 4 + rnd() * 5, b = R3E.bld[Math.floor(rnd() * R3E.bld.length)], hh = b.h * (0.75 + rnd() * 0.5), w = 7 + rnd() * 4;
      const pos = P.clone().addScaledVector(fr, s * (off + w / 2)); const m = new THREE.Mesh(R3.geo.box, b.mat); m.scale.set(w, hh, 8);
      m.position.set(pos.x, -7 + hh / 2, pos.z); m.rotation.y = Math.atan2(fr.x, fr.z); g.add(m);
      const roof = new THREE.Mesh(R3.geo.box, R3E.roof); roof.scale.set(w + 0.6, 0.6, 8.6); roof.position.set(pos.x, -7 + hh + 0.3, pos.z); roof.rotation.y = m.rotation.y; g.add(roof);
    }
    if (!loop && d % 30 === 15 && P.y > -4) for (const s of [-1, 1]) { const base = at(s * (H + 1), -1.4), hgt = base.y + 7.5; if (hgt > 0.5) { const pil = new THREE.Mesh(R3.geo.cyl, R3E.concrete); pil.scale.set(0.9, hgt, 0.9); pil.position.set(base.x, base.y - hgt / 2, base.z); g.add(pil); } }
    if (flat && d % 50 === 25) {
      const s = rnd() < 0.5 ? -1 : 1, base = at(s * (H + sw + 1.5), 0);
      for (const k of [-1.4, 1.4]) { const pl = new THREE.Mesh(R3.geo.cyl, R3E.post); pl.scale.set(0.1, 5, 0.1); pl.position.copy(base).addScaledVector(T.F[d], k).addScaledVector(U, 2.5); g.add(pl); }
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.6), R3E.signs[Math.floor(rnd() * R3E.signs.length)]);
      sign.position.copy(base).addScaledVector(U, 5.4); orient(sign, { r: T.F[d].clone().negate(), u: U, f: R.clone().multiplyScalar(s) }); sign.rotateY(s > 0 ? Math.PI / 2 : -Math.PI / 2); g.add(sign);
    }
  }
  g.add(ribbon(rows.road, R3.mat.road));
  for (const k of ['curbL', 'curbR']) g.add(ribbon(rows[k], R3.mat.road));
  for (const k of ['shL', 'shR']) g.add(ribbon(rows[k], R3.mat.road));
  for (const k of ['skL', 'skR']) g.add(ribbon(rows[k], R3E.concrete));
  for (const k of ['railL', 'railR']) g.add(ribbon(rows[k], R3E.rail));
  // distant skyline
  for (let k = 0; k < 4; k++) {
    const d = d0 + rnd() * 100, P = T.P[Math.floor(d)], fr = flatR(T.R[Math.floor(d)]), s = rnd() < 0.5 ? -1 : 1, hh = 30 + rnd() * 60;
    const pos = P.clone().addScaledVector(fr, s * (70 + rnd() * 80)); const m = new THREE.Mesh(R3.geo.box, R3E.far); m.scale.set(14 + rnd() * 10, hh, 14); m.position.set(pos.x, -7 + hh / 2, pos.z); g.add(m);
  }
  r3Toonify(g, false);
  // the scenery only receives shadows: casting is kept for the duck and the obstacles (cheap and readable)
  g.traverse((m) => { if (m.isMesh) { m.castShadow = false; if (m.material === R3E.far) m.receiveShadow = false; } });
  return g;
}
function makeObj4(o, g, add) {
  const G3 = R3.geo, M = R3.mat;
  const shadowDisc = (r) => { const d = new THREE.Mesh(G3.disc, M.shadow); d.rotation.x = -Math.PI / 2; d.scale.setScalar(r); d.position.y = 0.03; d.userData.isOutline = true; g.add(d); };
  switch (o.type) {
    case 'capy': case 'floppa': case 'bonk': case 'cite': {
      const key = o.type, tex = R3.tex['spr4_' + key] || (R3.tex['spr4_' + key] = spriteTex(220, 240, (c) => { c.translate(110, 230); SPR4[key](c, 0.3); }));
      const sz = key === 'floppa' ? 2.4 : key === 'cite' ? 1.3 : 2.0;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex })); sp.center.set(0.5, 0.04); sp.scale.set(sz * 220 / 240, sz, 1); g.add(sp); g.userData.sprite = sp;
      shadowDisc(key === 'floppa' ? 0.9 : 0.7);
      break;
    }
    case 'car': {
      const body = new THREE.MeshPhongMaterial({ color: '#ffcf33', shininess: 60 }), glass = new THREE.MeshPhongMaterial({ color: '#7fb6e6', shininess: 90 });
      add(G3.box, body, 1.7, 0.6, 3.4, 0, 0.55, 0); add(G3.box, body, 1.4, 0.55, 1.8, 0, 1.1, 0.2); add(G3.box, glass, 1.42, 0.38, 1.6, 0, 1.12, 0.2);
            for (const sx of [-0.8, 0.8]) for (const sz of [-1.1, 1.1]) { const w = add(G3.cyl, M.dark, 0.38, 0.28, 0.38, sx, 0.32, sz); w.rotation.z = Math.PI / 2; }
      for (const sx of [-0.6, 0.6]) add(G3.box, R3E.tail, 0.3, 0.14, 0.05, sx, 0.68, 1.71);
      add(G3.box, M.white, 0.5, 0.18, 0.4, 0, 1.47, 0.2);
      break;
    }
    case 'sheet': {
      const mat = new THREE.MeshLambertMaterial({ color: '#fffaf0', side: THREE.DoubleSide });
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), mat); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.05; g.add(pool);
      const drop = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.3), mat); drop.position.y = 2; g.add(drop);
      g.userData.upd = (oo, t) => { const done = !(oo.fall !== undefined && oo.ft < 1); pool.visible = done; drop.visible = !done; if (!done) { drop.position.y = lerp(oo.fall, 0, oo.ft); drop.rotation.z = t * 6; drop.rotation.x = Math.sin(t * 5) * 0.8; } };
      break;
    }
    case 'pen': {
      const red = new THREE.MeshPhongMaterial({ color: '#d62828', shininess: 70 });
      const b = add(G3.cyl, red, 0.16, 1.6, 0.16, 0, 0, 0); b.rotation.x = Math.PI / 2;
      const tip = add(G3.cone, M.metal, 0.5, 0.5, 0.5, 0, 0, 0.95); tip.rotation.x = Math.PI / 2;
      add(G3.cyl, M.white, 0.17, 0.2, 0.17, 0, 0, -0.7).rotation.x = Math.PI / 2;
      break;
    }
    case 'laser': {
      for (const sx of [-0.9, 0.9]) add(G3.box, M.dark, 0.18, 0.9, 0.18, sx, 0.45, 0);
      const beam = add(G3.box, new THREE.MeshBasicMaterial({ color: '#ff2d3d' }), 1.8, 0.1, 0.1, 0, 0.45, 0); beam.userData.isOutline = true;
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: R3E.lampGlow.map, color: '#ff3040', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); gl.scale.set(3, 0.9, 1); gl.position.y = 0.45; g.add(gl);
      break;
    }
  }
}
function r3EvoFrame(dt, t, F) {
  const R = G.run, D = R3.duck, p = D.root.position;
  // weak device: if frames stay slow for a few seconds, drop the real-time shadows once
  if (!R3E.noShadow && !DEBUG.noAdapt && dt > 0) { if (dt > 1 / 32) R3E.slow += dt; else R3E.fast += dt; if (R3E.fast > 6) R3E.slow = Math.max(0, R3E.slow - dt); if (R3E.slow > 3) { R3E.noShadow = true; r3EvoSetup(true); } }
  R3.sun.position.copy(p).add(new THREE.Vector3(-12, 26, 14)); R3.sun.target.position.copy(p); R3.sun.target.updateMatrixWorld();
  // Boost: glowing afterimages trail behind the energy ball
  if (R.boost > 0) {
    const s = R3E.trail[R3E.trailI++ % R3E.trail.length];
    s.visible = true; s.position.copy(p).addScaledVector(F.u, 0.5); s.userData.life = 0.22; s.scale.setScalar(1.0);
  }
  for (const s of R3E.trail) if (s.visible) { s.userData.life -= dt; s.material.opacity = Math.max(0, s.userData.life / 0.22) * 0.6; s.scale.multiplyScalar(1 - dt * 1.5); if (s.userData.life <= 0) s.visible = false; }
  D.aura.material.color.set(R.boost > 0 ? '#8fe8ff' : '#ffe066');
}
function drawBoostOverlay(c, t) {
  const R = G.run; if (!(R.boost > 0)) return;
  const g = c.createRadialGradient(SW / 2, SH / 2, SH * 0.35, SW / 2, SH / 2, SW * 0.7);
  g.addColorStop(0, 'rgba(120,220,255,0)'); g.addColorStop(1, 'rgba(120,220,255,' + (0.35 + Math.sin(t * 20) * 0.05).toFixed(3) + ')');
  c.fillStyle = g; c.fillRect(0, 0, SW, SH);
}

/* ---------- the run config for level 4 */
const RUN_CFG4 = {
  evo: 2, bossAt: BOSS4_AT, surfaces: [[0, 'city']], build: buildTrack4, plan: () => TRACK_PLAN4,
  bossName: 'Ожившая диссертация', bossLabel: 'ОЖИВШАЯ ДИССЕРТАЦИЯ', voice: 'babble', lines: THESIS_LINES, attack: thesisAttack,
  drawBoss: drawThesis, bossScale: 8, drawEnd: drawEnd4, endSay: 'Ура! Защитилась! Теперь я кандидат утиных наук!', deathFx: 'paper',
  targets: ['pigeon', 'crow', 'capy', 'floppa', 'bonk'], collide: collide4, tick: tick4,
  floatTypes: ['bonk', 'cite', 'pen'], moveTypes: ['bonk', 'cite', 'capy', 'pen', 'laser', 'sheet'], bounce: ['bonk', 'cite'], draw2D: drawRun2D4,
};
