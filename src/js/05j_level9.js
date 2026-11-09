/* ============================================================ level 9 (carp): Amazon rapids, crocodile burrow, vampire fish */
LEVEL_INFO[9] = { duck: null, fish: { name: 'Бурная Амазонка', boss: 'vampire', song: 'sea3' } };
const LEVEL9_LEN = 62;
Object.assign(BOSS, {
  crocboss: { name: 'Крокодил', label: 'КРОКОДИЛ', hp: 200, restX: 230, y: [120, 120], head: [-150, -50], mini: true },
  vampire: { name: 'Рыба-вампир', label: 'РЫБА-ВАМПИР', hp: 760, restX: 260, y: [140, 130], head: [-170, -60] },
});
Object.assign(BOSS_HIT, {
  crocboss: [[-120, 0, 40], [0, 0, 46], [100, 0, 34]],
  vampire: [[-170, 0, 44], [-60, 0, 50], [60, 0, 48], [160, 0, 30]],
});
Object.assign(KINDS, { vampling: { hp: 3, r: 15, score: 90, speed: 0, move: 'pup', art: { duck: 'vampling', fish: 'vampling' } } });
const LEVEL9_FISH = [
  [2.0, () => F.line('grunt', 7, 0.3, 0.22)],
  [4.0, () => F.redtails([0.6, 0.85])],
  [6.0, () => F.arapaimas([0.4])],
  [8.0, () => F.carrier('power', 0.5)],
  [9.5, () => { F.line('grunt', 6, 0.7, 0.22); F.redtails([0.2]); }],
  [12.0, () => F.arapaimas([0.25, 0.75])],
  [14.5, () => F.health(0.5)],
  [16.0, () => startSqueeze()],
  [20.5, () => F.rocks([-40])],
  [23.0, () => F.rocks([44])],
  [25.5, () => F.tline('grunt', 3, 0.6)],
  [27.5, () => F.rocks([0])],
  [30.0, () => F.rocks([-42])],
  [32.0, () => F.tpick(G.M.heal)],
  [34.0, () => F.rocks([40])],
  [36.5, () => F.rocks([-36])],
  [41.0, () => startMini('crocboss')],
  [44.5, () => { F.line('grunt', 7, 0.3, 0.22); F.redtails([0.7]); }],
  [47.0, () => F.arapaimas([0.3, 0.7])],
  [49.5, () => { F.redtails([0.2, 0.5, 0.8]); F.health(0.6); }],
  [52.0, () => F.carrier('bomb', 0.4)],
  [53.5, () => F.line('grunt', 8, 0.5, 0.2)],
  [56.5, () => startPortal('dark')],
];

/* ---------- crocodile mini-boss and ally */
function* crocBossBrain(b) {
  yield* moveTo(b, W - 230, H * 0.5, 2.2);
  b.vul = true;
  say(b, 'Кто лезет в мою нору, боец?!');
  yield* wait(1.2);
  const list = ['spout', 'snap', 'tail', 'babies'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(210, 250), bossY(b), b.phase2 ? 0.7 : 1.0);
    yield* GTA[list[i++ % list.length]](b);
    yield* wait(b.phase2 ? 0.45 : 0.8);
  }
}
function useCroc() {
  if (state !== 'play' || !G || !G.crocUnlocked || G.crocT > 0 || G.crocCharge < 100 || !G.player.alive) return;
  G.crocT = 20; G.crocCharge = 0;
  G.crocA = { x: G.player.x - 40, y: G.player.y + 90, st: 'follow', cd: 0.3, tx: 0, ty: 0, tgt: null, chomp: 0 };
  banner('КРОКОДИЛ, КУСЬ!', '', 1.4, 'small'); sfx('charm');
}
function updateCrocAlly(dt) {
  if (!(G.crocT > 0)) return;
  G.crocT -= dt;
  const a = G.crocA, p = G.player;
  a.chomp = Math.max(0, a.chomp - dt * 3);
  if (a.st === 'follow') {
    a.x = lerp(a.x, p.x + 10, Math.min(1, dt * 4)); a.y = lerp(a.y, p.y + (p.y > H / 2 ? -85 : 85), Math.min(1, dt * 4));
    a.cd -= dt;
    if (a.cd <= 0) {
      let best = 330 * 330, tgt = null;
      for (const e of G.enemies) { if (e.dead || e.invuln || e.ally || e.harmless || e.x > W) continue; const d = d2(e.x, e.y, a.x, a.y); if (d < best) { best = d; tgt = e; } }
      if (tgt) { a.st = 'lunge'; a.tgt = tgt; a.tx = tgt.x; a.ty = tgt.y; sfx('swoosh'); }
      else {
        const B = G.boss;
        if (B && B.vul && !B.dead && !BOSS[B.kind].mini) {
          let bc = null, bd = 520 * 520;
          for (const [cx, cy] of bossCircles(B)) { const d = d2(cx, cy, a.x, a.y); if (d < bd) { bd = d; bc = [cx, cy]; } }
          if (bc) { a.st = 'lunge'; a.tgt = 'boss'; a.tx = bc[0]; a.ty = bc[1]; sfx('swoosh'); }
        }
      }
      a.cd = 0.25;
    }
  } else if (a.st === 'lunge') {
    if (a.tgt && a.tgt !== 'boss' && !a.tgt.dead) { a.tx = a.tgt.x; a.ty = a.tgt.y; }
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy) || 1, sp = 900 * dt;
    if (d <= sp + 20) {
      a.chomp = 1; sfx('chomp');
      if (a.tgt === 'boss') { damageBoss(9); hitSpark(a.tx, a.ty); } else if (a.tgt && !a.tgt.dead) damageEnemy(a.tgt, 16);
      a.st = 'follow'; a.cd = 0.45; a.tgt = null;
    } else { a.x += (dx / d) * sp; a.y += (dy / d) * sp; }
  }
  if (G.crocT <= 0) { G.crocT = 0; G.crocA = null; }
}
function drawCrocAlly(c, t) {
  const a = G.crocA; if (!a) return;
  glow(c, a.x, a.y, 60, 'rgba(120,255,120,A)', G.crocT < 3 && Math.floor(t * 8) % 2 ? 0.15 : 0.4);
  c.save(); c.translate(a.x, a.y); c.scale(-1.4, 1.4); ART.croc(c, { charge: a.chomp, seed: 1 }, t); c.restore();
}
function drawCrocBoss(c, b, t) {
  c.save(); c.scale(3.2, 3.2); ART.croc(c, { charge: b.mouth || 0, seed: 2 }, t); c.restore();
  if (b.friendly) { P(c); heartPath(c, -40, -70, 12); fs(c, '#ff4d8d', 3); }
}

/* ---------- vampire fish */
const VA = {
  *babies(b) {
    say(b, pick(['Детки, кусь!', 'Мои вампирчики, вперёд!']));
    b.mouth = 1;
    for (let k = 0; k < (b.phase2 ? 5 : 3); k++) { const q = bp(b, -200, 10); enemy('vampling', q.x, q.y + rand(-40, 40)); sfx('bubble'); yield* wait(0.32); }
    b.mouth = 0; yield* wait(0.5);
  },
  *black(b) {
    say(b, pick(['Чёрные метки!', 'Ловите кружочки!']));
    for (let v = 0; v < (b.phase2 ? 4 : 3); v++) { b.mouth = 0.8; const q = bp(b, -200, 10); spread(q.x, q.y, b.phase2 ? 7 : 5, 0.17, 240, { type: 'blackorb', r: 8 }); sfx('throw'); yield* wait(0.3); b.mouth = 0.1; yield* wait(0.2); }
    b.mouth = 0;
  },
  *fangs(b) {
    say(b, 'Клыками по жабрам!');
    yield* moveTo(b, b.x, clamp(heroHit().y, 140, H - 130), 0.5);
    b.mouth = 1; yield* dash(b, 1020);
  },
  *ring(b) {
    say(b, 'Чёрная буря!');
    for (let k = 0; k < (b.phase2 ? 3 : 2); k++) { const q = bp(b, -60, 0); ring(q.x, q.y, 16, 180, { type: 'blackorb', r: 8 }, k * 0.2); sfx('bubble'); yield* wait(0.5); }
  },
  *drain(b) {
    say(b, 'Иди сюда, я голоден!');
    b.mouth = 1; sfx('suck');
    for (let t = 0; t < 2.4;) { const dt = yield; t += dt; const m = bp(b, -200, 10); G.suck = { x: m.x, y: m.y, t: 0.15 }; if (b.phase2 && Math.random() < dt * 2) ebullet(m.x, m.y, aimAt(m.x, m.y) + rand(-0.6, 0.6), 160, { type: 'blackorb', r: 8 }); }
    b.mouth = 0;
  },
};
function* vampireBrain(b) {
  yield* moveTo(b, W - 260, H * 0.5, 2.6);
  b.vul = true;
  say(b, 'Свежая кровь пожаловала!');
  yield* wait(1.2);
  const list = ['black', 'babies', 'fangs', 'ring', 'drain'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(240, 280), bossY(b), b.phase2 ? 0.7 : 1.0);
    yield* VA[list[i++ % list.length]](b);
    yield* wait((b.phase2 ? 0.45 : 0.8) / G.lvlDiff);
  }
}

/* ============================================================ art */
ART.vampling = (c, e, t) => { c.scale(0.38, 0.38); drawVampire(c, { mouth: 0.3 }, t); };
function drawVampire(c, b, t) {
  const m = b.mouth || 0, w = Math.sin(t * 4), angry = b.phase2;
  const back = angry ? '#3a2a48' : '#2f3a52', side = '#b8c3d1';
  c.save(); c.translate(170, 0); c.rotate(w * 0.12);
  P(c); c.moveTo(0, -10); c.lineTo(50, -58); c.lineTo(36, 0); c.lineTo(50, 58); c.lineTo(0, 10); c.closePath(); fs(c, back, 4); c.restore();
  P(c); c.moveTo(30, -44); c.lineTo(70, -84); c.lineTo(96, -38); c.closePath(); fs(c, back, 3);
  P(c); c.moveTo(60, 40); c.lineTo(86, 74 + w * 4); c.lineTo(104, 36); c.closePath(); fs(c, '#c0392b', 3);
  // lower jaw with two huge fangs
  c.save(); c.translate(-150, 18); c.rotate(m * 0.35);
  c.fillStyle = '#fffaf0'; for (let k = 0; k < 6; k++) { const fx = -70 + k * 11; P(c); c.moveTo(fx - 4, -6); c.lineTo(fx, -17); c.lineTo(fx + 4, -6); c.closePath(); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke(); }
  P(c); c.moveTo(0, -6); c.lineTo(-74, -10); c.quadraticCurveTo(-80, 4, -66, 12); c.lineTo(0, 22); c.closePath(); fs(c, '#d7dee8', 3.5);
  c.restore();
  if (m > 0.05) { P(c); c.moveTo(-150, 10); c.lineTo(-222, 6); c.lineTo(-222, 6 + m * 30); c.lineTo(-150, 28); c.closePath(); c.fillStyle = '#5a0a14'; c.fill(); }
  const body = () => { P(c); c.moveTo(-224, 4); c.quadraticCurveTo(-210, -36, -150, -48); c.quadraticCurveTo(0, -64, 172, -18); c.lineTo(176, 18); c.quadraticCurveTo(0, 56, -150, 40); c.lineTo(-224, 12); c.closePath(); };
  body(); fs(c, side, 4.5);
  c.save(); body(); c.clip(); P(c); ell(c, 0, -46, 230, 30); c.fillStyle = back; c.fill(); c.restore();
  P(c); c.moveTo(-120, -40); c.quadraticCurveTo(-100, 0, -120, 36); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  c.fillStyle = '#fffaf0'; for (let k = 0; k < 6; k++) { const fx = -218 + k * 11; P(c); c.moveTo(fx - 4, 8); c.lineTo(fx, 19); c.lineTo(fx + 4, 8); c.closePath(); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke(); }
  for (const fx of [-210, -186]) { P(c); c.moveTo(fx - 7, 8); c.lineTo(fx, 54 + m * 12); c.lineTo(fx + 7, 8); c.closePath(); fs(c, '#fffaf0', 3); line(c, [fx - 2, 14, fx - 1, 40], 1.5, '#fff'); }
  P(c); circ(c, -176, -12, 13); fs(c, '#fff', 3);
  P(c); circ(c, -178, -12, 7); c.fillStyle = '#c4141f'; c.fill();
  P(c); circ(c, -180, -14, 2.5); c.fillStyle = '#fff'; c.fill();
  line(c, [-196, -34, -160, -26], 5);
}
function drawRapids(c, t) {
  if (!G.rapids || G.dark) return;
  c.save();
  c.fillStyle = 'rgba(50,110,40,0.36)'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#3a2e1a'; P(c); c.moveTo(0, H - 34); for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, H - 34 + Math.sin(x * 0.06 + t) * 5); c.lineTo(W + 20, H); c.lineTo(0, H); c.closePath(); c.fill();
  // fast foam streaks of the current
  c.strokeStyle = 'rgba(235,255,235,0.45)'; c.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const y = ((i * 97) % (H - 60)) + 20, len = 60 + (i % 5) * 30, x = W - ((t * (420 + (i % 4) * 90) + i * 211) % (W + len + 100));
    c.lineWidth = 2 + (i % 3); P(c); c.moveTo(x, y); c.quadraticCurveTo(x + len * 0.5, y - 6, x + len, y); c.stroke();
  }
  const off = (t * 70) % 200;
  c.fillStyle = 'rgba(255,255,255,0.55)';
  for (let x = -off; x < W + 200; x += 200) { P(c); circ(c, x + 40, 10, 8); circ(c, x + 56, 6, 6); circ(c, x + 120, 12, 9); c.fill(); }
  c.restore();
}
// ending hint: something leaps upstream in the dark, a flash of pink-orange scales and a splash
function drawSalmonEnd(c, k) {
  const e = clamp((k - 9.0) / 1.3, 0, 1);
  if (e > 0 && e < 1) {
    const x = lerp(SW * 0.95, SW * 0.55, e), y = SH * 0.9 - Math.sin(e * Math.PI) * SH * 0.18, rot = lerp(-0.7, 0.7, e), vis = Math.sin(e * Math.PI);
    c.save(); c.globalAlpha = 0.45 * vis; c.translate(x, y); c.rotate(rot);
    P(c); ell(c, 0, 0, 60, 18); c.fillStyle = '#1a0d0c'; c.fill();
    P(c); c.moveTo(56, 0); c.lineTo(84, -18); c.lineTo(78, 0); c.lineTo(84, 18); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,150,120,0.6)'; c.lineWidth = 2; P(c); c.moveTo(-50, 4); c.quadraticCurveTo(0, 12, 50, 4); c.stroke();
    c.restore();
  }
  if (k > 9.0) for (let i = 0; i < 12; i++) {
    const s = clamp((k - 9.0 - (i % 2) * 1.2) / 1.0, 0, 1); if (s <= 0 || s >= 1) continue;
    const bx = (i % 2 ? SW * 0.55 : SW * 0.95) + Math.cos(i) * 30 * s, by = SH * 0.86 - Math.sin(s * Math.PI) * (30 + (i % 3) * 14);
    P(c); circ(c, bx, by, 3); c.fillStyle = 'rgba(200,230,255,' + (0.6 * (1 - s)).toFixed(2) + ')'; c.fill();
  }
}
