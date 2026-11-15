/* ============================================================ duck level 4, part 2: knife, parry, glide, coffee overdose, the open-book phase
   Controls: jump (hold = glide, press again in the air = double jump or homing attack), roll, lanes, knife (F / click / «Нож»). */

/* ---------- knife: slashes whatever is right in front of the duck, in her lane */
const SLASH_T = 0.3;
const KNIFE_OK = ['zombie', 'minion', 'trash', 'jbarrel', 'jtrash', 'jtires', 'capy', 'floppa', 'bonk', 'clock', 'books', 'stack', 'cone', 'barrier', 'sheet', 'cite', 'two', 'clip', 'edit', 'pen', 'pigeon', 'crow', 'pepper', 'puddle'];
function runKnife() {
  const R = G && G.run;
  if (!R || runCfg().evo < 2 || state !== 'play' || G.phase !== 'run' || R.end || !G.player.alive || R.phase === 'intro') return;
  if (R.knifeCd > 0) return;
  R.knifeCd = 0.3; R.slash = SLASH_T; sfx('knife'); sfx('swoosh');
  let hit = 0, last = null;
  for (let j = R.i; j < R.objs.length; j++) {
    const o = R.objs[j], dz = o.d - R.s;
    if (dz > 4.6) break;
    if (o.dead || o.reflect || dz < -0.8 || Math.abs(o.x - R.x) > 1.25) continue;
    if (o.fall !== undefined && o.ft < 0.5) continue;
    if (Math.abs((o.h || 0) - R.y) > 2.3) continue;
    if (o.parry) { runParry(o); hit++; continue; }
    const no = runCfg().knifeNo && runCfg().knifeNo[o.type];
    if (no) { if (!R.knifeMsgT || R.t - R.knifeMsgT > 0.6) { R.knifeMsgT = R.t; const q = runProj(o.x, (o.h || 0) + 1.6, o.d - R.s + RUN.PZ); floatText(q.sx, q.sy - 20, no, '#ffd8a8', 20); sfx('clink'); } continue; }
    if (KNIFE_OK.includes(o.type)) { last = runProj(o.x, (o.h || 0) + 1, o.d - R.s + RUN.PZ); runDestroy(o, last); addScore(50); hit++; }
  }
  if (hit) { G.shake = Math.max(G.shake, 6); G.hitStop = 0.07; sfx('clink'); if (last) floatText(last.sx, last.sy - 30, 'ХРЯСЬ!', '#fff', 26); }
  else { const a = runPlayerScreen(); floatText(a.sx + 40, a.sy - a.k * 1.6, 'вжух', '#e9d8ff', 18); }
}
// a pink projectile hit in time flies back into the boss
function runParry(o) {
  const R = G.run;
  o.reflect = true; o.parry = false; o.v = R.speed + 30; o.h = Math.max(o.h, 1.8);
  const q = runProj(o.x, o.h, o.d - R.s + RUN.PZ);
  floatText(q.sx, q.sy - 30, 'ОТБИТО!', '#ff8fc8', 28); addScore(300, q.sx, q.sy);
  burst(q.sx, q.sy, 12, { type: 'star', col: '#ff8fc8', smin: 80, smax: 280, lmin: 0.4, lmax: 0.8, rmin: 4, rmax: 9 });
  sfx('power'); G.shake = Math.max(G.shake, 7);
}
function thesisReflect(R) {
  const B = R.boss;
  for (const o of R.objs) {
    if (!o.reflect || o.dead) continue;
    if (!B || B.state === 'dead' || o.d - R.s > 120) { o.dead = true; continue; }
    if (o.d >= R.s + B.z - 1) {
      o.dead = true; o.smashed = 0.3;
      const q = runProj(B.x, B.h + 3, B.z + RUN.PZ);
      floatText(q.sx, q.sy - 50, 'ПОЛУЧИ СВОИ ПРАВКИ!', '#ffd43b', 24);
      runBossHit();
      if (B.state !== 'dead') shawSay(pick(['Это же правки научрука!', 'Ай, вернулось!', 'Мой же текст!']));
    }
  }
}

/* ---------- coffee overdose (fever): a full coffee gauge makes the duck huge, fiery and unstoppable */
const FEVER_T = 5;
function startFever() {
  const R = G.run; if (R.fever > 0) return;
  R.fever = FEVER_T; R.meter = 100; R.boost = 0; R.boostDrain = false;
  banner('КОФЕЙНЫЙ ПЕРЕДОЗ!', 'Неуязвима — сноси всё!', 1.6, 'red');
  sfx('power'); sfx('quack2'); G.shake = 10; G.flash = 0.35; G.flashColor = '#ffb347';
}
function runFeverBtn() {
  const R = G.run;
  if (R.fever > 0) return;
  if (R.meter >= 100) return startFever();
  if (!R.boostNag || R.t - R.boostNag > 1.5) { R.boostNag = R.t; floatText(SW / 2, SH * 0.7, 'Собирай кофе: полная шкала — «Кофейный передоз»!', '#ffd8a8', 18); sfx('click'); }
}
function feverSmash(o) {
  const R = G.run, q = runProj(o.x, (o.h || 0) + 1, o.d - R.s + RUN.PZ);
  runDestroy(o, q); R.coffee++; R.cupsTotal++; addScore(100);
  floatText(q.sx, q.sy - 24, '+☕', '#ffd27a', 24);
}
function updateFever(R, dt) {
  if (R.fever > 0) {
    R.fever -= dt; R.meter = Math.max(0, (100 * R.fever) / FEVER_T);
    if (R.fever <= 0) { R.fever = 0; R.meter = 0; R.inv = 1.2; }
  } else if (R.meter >= 100 && R.phase !== 'intro' && !R.end && G.player.alive) startFever();
}

/* ---------- control hints that unlock as you run */
function tick4b() {}

/* ---------- boss: the book opens, hit the «УТВЕРЖДЕНО» stamp with a jump attack, dodge the falling textbooks */
function thesisOpen(B) {
  const R = G.run;
  B.state = 'open'; B.t = 0; B.tLane = Math.floor(Math.random() * 3); B.tT = 1.7; B.dropT = 0.9; B.mouth = 1;
  shawSay(pick(['Открываю главу три!', 'Найди печать, если сможешь!', 'Прочти меня всю!']));
  sfx('charge');
  if (!R.hints.open) { R.hints.open = 1; banner('ДИССЕРТАЦИЯ РАСКРЫЛАСЬ!', 'Встань на дорожку печати, прыгни и нажми прыжок ещё раз', 3, 'small'); }
}
function thesisUpdOpen(B, dt) {
  const R = G.run;
  B.z = lerp(B.z, 13, Math.min(1, dt * 2)); B.h = lerp(B.h, 0.3, Math.min(1, dt * 3)); B.x = lerp(B.x, 0, Math.min(1, dt * 4));
  B.mouth = Math.max(0, B.mouth - dt * 2);
  B.tT -= dt;
  if (B.tT <= 0) { B.tLane = (B.tLane + 1 + Math.floor(Math.random() * 2)) % 3; B.tT = B.hp <= 2 ? 1.25 : 1.7; sfx('click'); }
  B.dropT -= dt;
  if (B.dropT <= 0) {
    B.dropT = B.hp <= 2 ? 0.6 : 0.8;
    const l = Math.random() < 0.3 ? B.tLane : Math.floor(Math.random() * 3);
    R.objs.push({ type: 'stack', d: R.s + 17, x: laneX(l), h: 0, fall: 10, ft: 0 });
    R.objs.sort((a, b) => a.d - b.d); R.i = 0;
  }
  if (B.t > 7.5) { B.state = 'enter'; B.t = 1.2; B.round++; shawSay(pick(runCfg().lines.back)); }
}

/* ---------- 2D art: new enemies and boss projectiles */
function sprClock(c, t) {
  const sh = Math.sin(t * 40) * 3;
  c.save(); c.translate(sh, 0);
  for (const s of [-1, 1]) line(c, [s * 16, -14, s * 26, 0], 6);
  // ringing bells and the hammer between them
  for (const s of [-1, 1]) { P(c); c.arc(s * 28, -96, 17, Math.PI, 0); c.closePath(); fs(c, '#d5dae2', 3); }
  P(c); circ(c, 0, -104, 6); fs(c, '#8a8f9c', 2);
  for (const s of [-1, 1]) for (const r of [26, 36]) { P(c); c.arc(s * 30, -98, r, s < 0 ? Math.PI * 1.1 : Math.PI * 1.6, s < 0 ? Math.PI * 1.4 : Math.PI * 1.9); c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke(); }
  P(c); circ(c, 0, -56, 44); fs(c, '#e63946', 4);
  P(c); circ(c, 0, -56, 34); fs(c, '#fffaf0', 3);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; line(c, [Math.cos(a) * 28, -56 + Math.sin(a) * 28, Math.cos(a) * 32, -56 + Math.sin(a) * 32], 2); }
  eye(c, -13, -64, 8, 0, 0.12, -1.2, '#e63946'); eye(c, 13, -64, 8, 0, 0.12, 1.2, '#e63946');
  P(c); c.moveTo(-14, -40); for (let i = 0; i <= 6; i++) c.lineTo(-14 + i * (28 / 6), i % 2 ? -46 : -38); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  c.restore();
}
function sprBooks(c) {
  const books = [['#2a6bff', 'МАТАН', 92], ['#e63946', 'ФИЗИКА', 84], ['#3fa34d', 'ХИМИЯ', 96], ['#7e4fa0', 'СОПРОМАТ', 88]];
  let y = 0;
  books.forEach(([col, title, w], i) => {
    const h = 28, x = i % 2 ? 5 : -5;
    P(c); rr(c, x - w / 2, y - h, w, h, 4); fs(c, col, 3);
    P(c); c.rect(x + w / 2 - 12, y - h + 4, 9, h - 8); c.fillStyle = '#fffaf0'; c.fill();
    c.font = '900 12px ' + FONT_UI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(title, x - 6, y - h / 2 + 1);
    y -= h;
  });
  // angry eyes peeking over the top book
  eye(c, -14, y - 10, 9, 0, 0.15, -1.2, '#e63946'); eye(c, 14, y - 10, 9, 0, 0.15, 1.2, '#e63946');
}
function sprTwo(c) {
  P(c); rr(c, -34, -44, 68, 88, 8); fs(c, '#fffaf0', 4);
  for (let k = 0; k < 5; k++) line(c, [-24, -30 + k * 14, 24, -30 + k * 14], 1.4, '#a8c4ec');
  c.font = '72px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e63946'; c.fillText('2', 0, 4);
  P(c); circ(c, 0, 4, 34); c.lineWidth = 4; c.strokeStyle = '#e63946'; c.stroke();
}
function sprClip(c) {
  P(c);
  c.moveTo(-12, -16); c.lineTo(-12, -86); c.arc(0, -86, 12, Math.PI, 0); c.lineTo(12, -30); c.arc(2, -30, 10, 0, Math.PI); c.lineTo(-8, -76); c.arc(0, -76, 8, Math.PI, 0); c.lineTo(8, -40);
  c.lineWidth = 9; c.strokeStyle = INK; c.lineCap = 'round'; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#d5dae2'; c.stroke();
  eye(c, -6, -60, 6, 0, 0.1, -1.2, '#e63946'); eye(c, 10, -60, 6, 0, 0.1, 1.2, '#e63946');
}
function sprEdit(c) {
  P(c); rr(c, -42, -54, 84, 108, 6); fs(c, '#ffd6ea', 4, '#d63384');
  c.font = '17px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#c4141f'; c.fillText('ПРАВКИ', 0, -36);
  for (let k = 0; k < 4; k++) { line(c, [-30, -14 + k * 14, 30, -14 + k * 14], 1.5, '#8a8f9c'); line(c, [-28 + k * 9, -18 + k * 14, 8 + k * 6, -8 + k * 14], 3, '#e63946'); }
  P(c); c.arc(22, 36, 10, 0, TAU); c.lineWidth = 3; c.strokeStyle = '#e63946'; c.stroke();
}
Object.assign(SPR4, { clock: sprClock, books: sprBooks, stack: sprBooks, two: sprTwo, clip: sprClip, edit: sprEdit });

function drawThesisOpen(c, x, y, S, t, B) {
  c.save(); c.translate(x, y); const s = S / 200; c.scale(s, s);
  if (B.flash > 0 && Math.floor(B.flash * 20) % 2) c.globalAlpha = 0.6;
  // the spread: cover behind, two pages, lines of text
  P(c); rr(c, -106, -196, 212, 192, 10); fs(c, B.hp <= 2 ? '#7a1f2b' : '#1f3a6b', 4);
  for (const sd of [-1, 1]) {
    P(c); c.moveTo(0, -188); c.quadraticCurveTo(sd * 50, -198, sd * 100, -186); c.lineTo(sd * 100, -12); c.quadraticCurveTo(sd * 50, -22, 0, -10); c.closePath(); fs(c, '#fffaf0', 3);
    for (let k = 0; k < 11; k++) { const yy = -168 + k * 14; line(c, [sd * 12, yy, sd * (k % 3 === 2 ? 62 : 88), yy], 2, '#b8bfca'); }
  }
  line(c, [0, -190, 0, -10], 3, '#c9bfa8');
  // eyes on the top edge
  eye(c, -22, -204, 10, 0, 0.1, -1.2, '#c4141f'); eye(c, 22, -204, 10, 0, 0.1, 1.2, '#c4141f');
  // bookmark ribbon swaying
  P(c); c.moveTo(-4, -190); c.lineTo(-4 + Math.sin(t * 3) * 6, 10); c.lineTo(4 + Math.sin(t * 3) * 6, 2); c.lineTo(12 + Math.sin(t * 3) * 6, 10); c.lineTo(10, -190); c.closePath(); fs(c, '#e63946', 2);
  // the «УТВЕРЖДЕНО» stamp hops between the three lanes
  const sx = (B.tLane - 1) * 57, pulse = 1 + Math.sin(t * 10) * 0.06;
  c.save(); c.translate(sx, -112); c.scale(pulse, pulse); c.rotate(-0.2);
  P(c); circ(c, 0, 0, 30); c.fillStyle = 'rgba(255,240,240,0.9)'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#d62828'; c.stroke();
  P(c); circ(c, 0, 0, 23); c.lineWidth = 2; c.stroke();
  c.font = '900 8px ' + FONT_UI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#d62828'; c.fillText('УТВЕРЖДЕНО', 0, 1);
  c.restore();
  c.restore();
}

/* ---------- 2D overlay on the 3D view: fever glow, knife arc, parry cues, the stamp target */
function overlay4(c, t) {
  const R = G.run, B = R.boss;
  drawBoostOverlay(c, t);
  if (R.fever > 0) {
    const g = c.createRadialGradient(SW / 2, SH / 2, SH * 0.3, SW / 2, SH / 2, SW * 0.72), a = 0.3 + Math.sin(t * 18) * 0.06;
    g.addColorStop(0, 'rgba(255,140,40,0)'); g.addColorStop(1, 'rgba(255,90,20,' + a.toFixed(3) + ')');
    c.fillStyle = g; c.fillRect(0, 0, SW, SH);
    if (R.fever < 1.5 && Math.floor(t * 6) % 2) { c.font = '22px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle'; otext(c, 'ПЕРЕДОЗ ЗАКАНЧИВАЕТСЯ!', SW / 2, SH * 0.2, '#ffd27a', 5); }
  }
  if (R.slash > 0 && !R3E.slashFx) {
    const a = runPlayerScreen(), k = a.k * (R.fever > 0 ? 1.8 : 1), e = 1 - R.slash / SLASH_T;
    c.save(); c.globalAlpha = Math.min(1, R.slash / 0.15); c.lineCap = 'round';
    P(c); c.arc(a.sx, a.sy - k * 0.9, k * 1.35, -Math.PI * (0.95 - e * 0.25), -Math.PI * (0.15 + (1 - e) * 0.2)); c.lineWidth = Math.max(6, k * 0.22); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.stroke();
    c.lineWidth = Math.max(2, k * 0.07); c.strokeStyle = '#c9a8ff'; c.stroke();
    c.restore();
  }
  // pink projectiles: ring them, and shout when they are in knife reach
  for (let j = R.i; j < R.objs.length; j++) {
    const o = R.objs[j], dz = o.d - R.s; if (dz > 40) break;
    if (!o.parry || o.dead || dz < -0.5) continue;
    const q = runProj3(o.x, o.h, dz + RUN.PZ); if (q.sx < -100) continue;
    const near = dz < 4.6 && Math.abs(o.x - R.x) < 1.25;
    c.save(); c.globalAlpha = near ? 1 : 0.6; P(c); circ(c, q.sx, q.sy, Math.max(16, q.k * 0.9) * (1 + Math.sin(t * 16) * 0.1)); c.lineWidth = near ? 5 : 3; c.strokeStyle = '#ff5fb4'; c.stroke(); c.restore();
    if (near) { c.font = '26px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle'; otext(c, isTouch ? 'НОЖ!' : 'F!', q.sx, q.sy - Math.max(30, q.k * 1.4), '#ff8fc8', 6); }
  }
  if (B && B.state === 'open') {
    const q = runProj3(laneX(B.tLane), B.h + 4.5, B.z + RUN.PZ);
    if (q.sx > -100) {
      drawReticle(c, q.sx, q.sy, Math.max(26, q.k * 1.3), t);
      c.font = '24px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle';
      const msg = R.lane !== B.tLane ? (R.lane < B.tLane ? 'ПЕЧАТЬ ПРАВЕЕ ▸' : '◂ ПЕЧАТЬ ЛЕВЕЕ') : R.y > 0.25 ? 'ЖМИ ПРЫЖОК ЕЩЁ РАЗ!' : 'ПРЫГАЙ!';
      if (Math.floor(t * 4) % 2 || R.lane === B.tLane) otext(c, msg, q.sx, q.sy - Math.max(50, q.k * 2.4), '#ffe14d', 6);
    }
  }
}

/* ---------- 3D extras each frame: fever size and flames, knife arc in the world, camera lift */
function frame4b(dt, t, F) {
  const R = G.run, D = R3.duck, p = D.root.position;
  const fv = R.fever > 0 ? 1 : 0;
  R3.feverK = lerp(R3.feverK || 0, fv, Math.min(1, dt * 4));
  const fk = R3.feverK;
  D.root.scale.setScalar(1 + fk * 0.4);   // bigger and fiery, but the road stays visible
  const pulse = 0.75 + Math.sin(t * 14) * 0.25;
  if (DUCK3.parts) DUCK3.parts.mat.emissive.setRGB(fk * 0.75 * pulse, fk * 0.28 * pulse, 0);
  if (R3E.duckInk) R3E.duckInk.color.setRGB(0.13 + fk * 0.87, 0.11 + fk * 0.14 * pulse, 0.15 * (1 - fk));
  if (!R3E.feverAura) { R3E.feverAura = new THREE.Sprite(new THREE.SpriteMaterial({ map: R3E.lampGlow.map, color: '#ff6a00', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); R3.scene.add(R3E.feverAura); }
  R3E.feverAura.visible = fk > 0.05;
  if (R3E.feverAura.visible) { R3E.feverAura.position.copy(p).addScaledVector(F.u, 1.6 * (1 + fk * 1.2)); R3E.feverAura.scale.setScalar(6.5 * fk * (0.9 + pulse * 0.2)); R3E.feverAura.material.opacity = 0.7 * fk; }
  if (fv) {
    for (let k = 0; k < 4; k++) {
      const s = R3E.trail[R3E.trailI++ % R3E.trail.length];
      s.visible = true; s.userData.life = 0.3; s.material.color.set(Math.random() < 0.5 ? '#ff7a1a' : '#ffd43b');
      s.position.copy(p).addScaledVector(F.u, 0.6 + Math.random() * 3.6).addScaledVector(F.r, (Math.random() - 0.5) * 3).addScaledVector(F.f, -0.4);
      s.scale.setScalar(1.6 + Math.random() * 1.4);
    }
  } else if (!(R.boost > 0)) for (const s of R3E.trail) if (!s.visible) s.material.color.set('#8fe8ff');
  slashFrame(R, D, F);
}
function slashFrame(R, D, F) {
  if (!R3E.slashFx) {
    const grp = new THREE.Group(), arm = new THREE.Group();
    const steel = new THREE.MeshBasicMaterial({ color: '#f4f7fb' }), edge = new THREE.MeshBasicMaterial({ color: '#9fb3c8' });
    const ink = new THREE.MeshBasicMaterial({ color: '#221d2e', side: THREE.BackSide });
    const part = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); arm.add(m); const o = new THREE.Mesh(geo, ink); o.scale.setScalar(1.18); m.add(o); return m; };
    // a big, readable kitchen knife: wide blade standing on edge, purple handle
    part(new THREE.BoxGeometry(0.07, 0.42, 1.5), steel, 0, 0, -1.15);
    part(new THREE.BoxGeometry(0.075, 0.1, 1.45), edge, 0, 0.17, -1.12);
    const tip = part(new THREE.ConeGeometry(0.21, 0.5, 4), steel, 0, -0.02, -2.1); tip.rotation.x = -Math.PI / 2; tip.scale.set(0.35, 1, 1);
    part(new THREE.BoxGeometry(0.16, 0.24, 0.55), new THREE.MeshBasicMaterial({ color: '#7e4fa0' }), 0, -0.02, -0.12);
    const trail = new THREE.Mesh(new THREE.RingGeometry(0.7, 2.5, 40, 1, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#b98cff', transparent: true, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    trail.rotation.x = -Math.PI / 2;
    grp.add(arm); grp.add(trail); grp.visible = false; R3.scene.add(grp);
    R3E.slashFx = { grp, arm, trail };
  }
  const X = R3E.slashFx;
  X.grp.visible = R.slash > 0 && G.player.alive;
  if (!X.grp.visible) return;
  const e = 1 - R.slash / SLASH_T, sc = D.root.scale.x;
  X.grp.position.copy(D.root.position).addScaledVector(F.u, 0.95 * sc);
  orient(X.grp, F); X.grp.rotateX(0.55); X.grp.scale.setScalar(sc);
  // the blade swings from the right side, across the front, to the left
  X.arm.rotation.y = lerp(-1.6, 1.6, easeOut(Math.min(1, e * 1.25)));
  X.arm.rotation.z = -0.25;
  X.trail.material.opacity = Math.max(0, 0.5 * (1 - e));
  X.trail.scale.setScalar(1 + e * 0.25);
}
