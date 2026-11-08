/* ============================================================ level 3 (carp): gas, squeezing tunnel, squid, portal, megalodon */
const LEVEL3_LEN = 103;
Object.assign(BOSS, {
  squid: { name: 'Кальмар', label: 'КАЛЬМАР', hp: 260, restX: 200, y: [120, 120], head: [-40, -50], mini: true },
  mega: { name: 'Мегалодон', label: 'МЕГАЛОДОН', hp: 760, restX: 260, y: [140, 130], head: [-170, -60] },
});
Object.assign(BOSS_HIT, {
  squid: [[-50, 0, 42], [50, 0, 44], [120, 0, 26]],
  mega: [[-170, 5, 58], [-50, 0, 70], [80, 0, 58], [180, 0, 34]],
});
Object.assign(KINDS, {
  rock: { hp: 1, r: 19, score: 0, speed: 0, move: 'rock', art: { duck: 'urchin', fish: 'urchin' } },
  pup:  { hp: 2, r: 15, score: 80, speed: 0, move: 'pup', art: { duck: 'pup', fish: 'pup' } },
});
F.rocks = (offs) => { for (const off of offs) enemy('rock', W + 40, tunnelC(W + 40) + off, { follow: true, off, invuln: true }); };

const LEVEL3_FISH = [
  [2.0, () => F.line('grunt', 6, 0.3, 0.3)],
  [3.5, () => F.swarm(3, 0.7)],
  [5.5, () => F.lance([0.25, 0.75])],
  [7.0, () => F.carrier('power', 0.5)],
  [8.5, () => F.sine('weaver', 7, 0.5)],
  [11.0, () => F.divers([0.2, 0.5, 0.8])],
  [13.0, () => F.shooters([0.3, 0.7])],
  [15.5, () => F.health(0.4)],
  [16.5, () => F.line('grunt', 6, 0.7, 0.3)],
  [19.0, () => startTunnel({ len: 2400, speed: 230 })],
  [23.0, () => F.tline('grunt', 4, 0.5)],
  [27.0, () => F.tpick('power')],
  [29.0, () => F.tline('weaver', 3, 0.7)],
  [35.0, () => { F.line('grunt', 5, 0.3); F.carrier('charm', 0.65); }],
  [37.0, () => startTunnel({ len: 2200, speed: 230 })],
  [41.0, () => F.tline('zig', 2, 1.0)],
  [44.0, () => F.tpick(G.M.heal)],
  [47.0, () => F.tline('grunt', 5, 0.45)],
  [53.0, () => startSqueeze()],
  [57.5, () => F.rocks([-42])],
  [60.0, () => F.rocks([46])],
  [62.5, () => F.tline('grunt', 3, 0.6)],
  [64.5, () => F.rocks([0])],
  [67.0, () => F.rocks([-44])],
  [69.0, () => F.tpick(G.M.heal)],
  [71.0, () => F.rocks([44])],
  [73.5, () => F.rocks([-40])],
  [80.0, () => startMini()],
  [84.0, () => { F.line('grunt', 6, 0.3, 0.3); F.line('grunt', 6, 0.7, 0.3); }],
  [86.5, () => F.shooters([0.25, 0.75])],
  [89.0, () => F.lance([0.2, 0.5, 0.8], 0.4)],
  [91.0, () => { F.carrier('bomb', 0.4); F.health(0.6); }],
  [93.0, () => F.heavy2()],
  [99.0, () => startPortal()],
];

/* ---------- squeezing tunnel: tap to blow bubbles that push the walls apart */
function startSqueeze() {
  startTunnel({ len: 4300, speed: 200, squeeze: true, amp: 0.55, quiet: true });
  banner('СТЕНЫ СЖИМАЮТСЯ!', isTouch ? 'Жми по экрану — пузыри раздвинут стены' : 'Кликай или жми Пробел — пузыри раздвинут стены', 3.4);
  sfx('charge');
}
function doBurst() {
  const T = G && G.tunnel;
  if (!T || !T.squeeze || !G.player.alive || state !== 'play' || G.burstCd > 0) return;
  G.burstCd = 0.1;
  T.sg = Math.min(165, T.sg + 24);
  const h = heroHit();
  for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; part({ type: 'bubble', x: h.x, y: h.y, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, r: rand(4, 8), life: 0.45, col: '#e6fbff' }); }
  ringFx(h.x, h.y, 10, 130, '#e6fbff', 0.35);
  for (const e of G.enemies) if (!e.invuln && !e.ally && d2(e.x, e.y, h.x, h.y) < 130 * 130) damageEnemy(e, 1.5);
  sfx('bubble');
}
function updateSqueeze(dt) {
  const T = G.tunnel;
  if (!T || !T.squeeze || !tunAt(W * 0.3)) return;
  T.sg -= 17 * dt;
  if (T.sg < 56) {
    T.sg = 95; G.shake = Math.max(G.shake, 10);
    if (G.player.alive && G.player.inv <= 0) floatText(G.player.x, G.player.y - 40, 'ЗАЖАЛО!', '#ff8fa3', 22);
    hurtPlayer();
  }
}
MOVES.rock = (e, dt) => { const T = G.tunnel; e.x -= (T ? T.speed : 200) * dt; e.y = e.baseY + e.off + Math.sin(e.age * 2 + e.seed) * 5; e.rot += dt; };
MOVES.pup = (e, dt) => {
  if (!e.st) { e.st = 'aim'; e.t0 = 0.4; }
  if (e.st === 'aim') {
    e.t0 -= dt; e.x -= 60 * dt; e.shiver = true;
    const a = aimAt(e.x, e.y); e.rot = clamp(a - Math.PI * Math.sign(a || 1), -0.7, 0.7);
    if (e.t0 <= 0) { e.st = 'go'; e.shiver = false; e.vx = Math.cos(a) * 470; e.vy = Math.sin(a) * 470; sfx('swoosh'); }
  } else { e.x += e.vx * dt; e.y += e.vy * dt; }
};

/* ---------- mini-boss: the squid in its burrow, then it joins the carp */
function startMini() {
  G.timers.length = 0; G.lair = true;
  for (const b of G.eb) { b.dead = true; puff(b.x, b.y); }
  banner('НОРКА КАЛЬМАРА', 'Мини-босс!', 2.6);
  sfx('siren');
  spawnBoss('squid');
}
function miniDie(b) {
  b.dead = true; b.hp = 0; b.deadT = 0; b.vul = false; b.dash = false; b.telegraph = 0; b.lash = null;
  G.phase = 'miniDead'; G.phaseT = 0;
  for (const x of G.eb) { x.dead = true; puff(x.x, x.y); }
  say(b, 'Ладно, сдаюсь! Теперь я за тебя!');
  addScore(3000, b.x, b.y - 60);
  burst(b.x, b.y, 16, { type: 'star', col: '#ff8fc0', smin: 60, smax: 220, lmin: 0.6, lmax: 1.1, rmin: 4, rmax: 7 });
  sfx('charm');
  Sound.music(G.LI.song);
}
function endMini() {
  G.boss = null; G.lair = false; G.phase = 'waves'; G.phaseT = 0;
  G.squidUnlocked = true; G.squidCharge = 100;
  banner('КАЛЬМАР ТЕПЕРЬ ТВОЙ ДРУГ!', isTouch ? 'Копи силу и зови его кнопкой «Кальмар»' : 'Копи силу и зови его кнопкой «Кальмар» или клавишей Q', 3.4);
  startTunnel({ len: 900, speed: 230, noRampIn: true, gBase: 200, amp: 0.3, quiet: true });
}
const QA = {
  *ink(b) {
    say(b, pick(['Чернилами тебя!', 'Клякса!']));
    for (let k = 0; k < (b.phase2 ? 3 : 2); k++) { const q = bp(b, -40, 0); ring(q.x, q.y, 12, 170, { type: 'ink', r: 8 }, rand(0, 1)); sfx('bubble'); yield* wait(0.55); }
  },
  *spray(b) {
    say(b, 'Брызги!');
    for (let k = 0; k < 3; k++) { const q = bp(b, -60, 10); spread(q.x, q.y, b.phase2 ? 7 : 5, 0.18, 230, { type: 'ink', r: 7 }); sfx('throw'); yield* wait(0.45); }
  },
  *lash(b) {
    say(b, 'Щупальцем по жабрам!');
    b.lash = { y: clamp(heroHit().y, 70, H - 70), phase: 'warn' }; sfx('charge');
    yield* wait(0.8);
    b.lash.phase = 'hit'; sfx('swoosh'); G.shake = Math.max(G.shake, 6);
    yield* wait(0.45);
    b.lash = null; yield* wait(0.3);
  },
  *jet(b) {
    say(b, 'Реактивный рывок!');
    yield* moveTo(b, b.x, clamp(heroHit().y, 120, H - 120), 0.5);
    yield* dash(b, 930);
  },
};
function* squidBrain(b) {
  yield* moveTo(b, W - 200, H * 0.5, 2.2);
  b.vul = true;
  say(b, 'Кто лезет в мою норку?!');
  yield* wait(1.2);
  const list = ['ink', 'lash', 'spray', 'jet'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(180, 230), bossY(b), b.phase2 ? 0.7 : 1.0);
    yield* QA[list[i++ % list.length]](b);
    yield* wait(b.phase2 ? 0.45 : 0.8);
  }
}

/* ---------- squid helper (super ability charged like an X-ray meter) */
function useSquid() {
  if (state !== 'play' || !G || !G.squidUnlocked || G.squidT > 0 || G.squidCharge < 100 || !G.player.alive) return;
  G.squidT = 20; G.squidCharge = 0;
  G.squid = { x: G.player.x - 40, y: G.player.y - 90, strikeT: 0, strike: null };
  banner('КАЛЬМАР, ФАС!', '', 1.4, 'small'); sfx('charm');
}
function updateSquid(dt) {
  if (!(G.squidT > 0)) return;
  G.squidT -= dt;
  const s = G.squid, p = G.player, h = heroHit();
  const tx = p.x + 30, ty = p.y + (p.y > H / 2 ? -88 : 88);
  s.x = lerp(s.x, tx, Math.min(1, dt * 4)); s.y = lerp(s.y, ty, Math.min(1, dt * 4));
  s.strikeT -= dt;
  if (s.strike) { s.strike.t -= dt; if (s.strike.t <= 0) s.strike = null; }
  if (s.strikeT <= 0) {
    let best = 270 * 270, tgt = null;
    for (const e of G.enemies) {
      if (e.dead || e.invuln || e.ally || e.harmless || e.x > W) continue;
      const d = d2(e.x, e.y, h.x, h.y); if (d < best) { best = d; tgt = e; }
    }
    if (tgt) { s.strike = { x: tgt.x, y: tgt.y, t: 0.22 }; damageEnemy(tgt, 14); s.strikeT = 0.3; sfx('swoosh'); }
    else {
      const B = G.boss;
      if (B && B.vul && !B.dead && !BOSS[B.kind].mini) {
        let bc = null, bd = 480 * 480;
        for (const [cx, cy] of bossCircles(B)) { const d = d2(cx, cy, s.x, s.y); if (d < bd) { bd = d; bc = [cx, cy]; } }
        if (bc) { s.strike = { x: bc[0], y: bc[1], t: 0.22 }; damageBoss(7); s.strikeT = 0.45; sfx('swoosh'); hitSpark(bc[0], bc[1]); }
      }
    }
  }
  if (G.squidT <= 0) { G.squidT = 0; G.squid = null; }
}

/* ---------- green portal to the dark depths */
function startPortal() {
  G.phase = 'portal'; G.phaseT = 0; G.timers.length = 0;
  for (const e of G.enemies) killEnemy(e, true);
  for (const b of G.eb) { b.dead = true; puff(b.x, b.y); }
  G.pickups.length = 0; G.tunnel = null;
  G.portal = { x: W * 0.74, y: H / 2, from: { x: G.player.x, y: G.player.y } };
  banner('ПОРТАЛ!', 'Держись, карась!', 2.2);
  sfx('suck');
}
function updatePortal() {
  const k = G.phaseT, p = G.player, P0 = G.portal;
  if (!P0) { G.phase = 'waves'; return; }
  if (k < 2.4) {
    const e = easeInOut(clamp((k - 0.5) / 1.9, 0, 1));
    p.x = lerp(P0.from.x, P0.x, e); p.y = lerp(P0.from.y, P0.y, e);
    p.sc = 1 - e * 0.95; p.spin = e * 12;
    if (Math.random() < 0.7) { const a = rand(0, TAU), r = rand(140, 260); part({ type: 'dot', x: P0.x + Math.cos(a) * r, y: P0.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 2.5, vy: -Math.sin(a) * r * 2.5, r: rand(2, 4), life: 0.4, col: '#9dff6a' }); }
  } else if (!P0.done) {
    P0.done = true; G.dark = true; G.flash = 0.9; G.flashColor = '#7CFF4F'; sfx('bomb');
    p.x = W * 0.2; p.y = H / 2;
  }
  if (k >= 2.4) { const e = clamp((k - 2.4) / 0.8, 0, 1); p.sc = Math.max(0.05, e); p.spin = (1 - e) * 8; }
  if (k >= 3.4) { p.sc = 1; p.spin = 0; G.portal = null; G.phase = 'waves'; G.phaseT = 0; }
}

/* ---------- final boss: megalodon; the pike and the catfish attack from the depth */
const MA = {
  *pups(b) {
    say(b, 'Акулята, фас!');
    b.mouth = 1;
    for (let k = 0; k < (b.phase2 ? 6 : 4); k++) { const q = bp(b, -215, 20); enemy('pup', q.x, q.y + rand(-30, 30)); sfx('bubble'); yield* wait(0.35); }
    b.mouth = 0.2; yield* wait(0.7); b.mouth = 0;
  },
  *teeth(b) {
    say(b, pick(['Дон-дон.', 'Зубастый привет!']));
    for (let v = 0; v < 3; v++) { b.mouth = 0.8; const q = bp(b, -220, 15); spread(q.x, q.y, b.phase2 ? 9 : 7, 0.14, 245, { type: 'spike', r: 6 }); sfx('throw'); yield* wait(0.25); b.mouth = 0.2; yield* wait(0.2); }
    b.mouth = 0;
  },
  *bite(b) {
    say(b, 'ДОН-ДОН!');
    yield* moveTo(b, b.x, clamp(heroHit().y, 150, H - 140), 0.6);
    b.mouth = 1; yield* dash(b, 980);
  },
  *roar(b) {
    say(b, 'ДОН-ДОН!!');
    for (let k = 0; k < 2; k++) { b.mouth = 1; const q = bp(b, -120, 0); ring(q.x, q.y, 18, 175, { col: '#7ee7f2', r: 7 }, k * 0.17); yield* wait(0.5); }
    b.mouth = 0; yield* wait(0.3);
  },
};
function* megaBrain(b) {
  yield* moveTo(b, W - 260, H * 0.5, 2.8);
  b.vul = true;
  say(b, 'ДОН-ДОН!');
  yield* wait(1.3);
  const list = ['pups', 'teeth', 'bite', 'roar'];
  let i = 0;
  for (;;) {
    yield* moveTo(b, W - rand(240, 280), bossY(b), b.phase2 ? 0.7 : 1.0);
    let a = list[i++ % list.length];
    if (b.phase2 && i % 3 === 0) a = 'pups';
    yield* MA[a](b);
    yield* wait(b.phase2 ? 0.45 : 0.8);
  }
}
function updateHelpers(dt) {
  const B = G.boss;
  if (G.LI.boss !== 'mega' || !B || B.kind !== 'mega' || B.dead || G.phase !== 'boss' || !B.vul) { G.helper = null; return; }
  G.helperCd = (G.helperCd === undefined ? 6 : G.helperCd) - dt;
  if (!G.helper && G.helperCd <= 0) {
    G.helperCd = rand(7, 9); G.helperN = (G.helperN || 0) + 1;
    const h = heroHit();
    if (G.helperN % 2) G.helper = { kind: 'pike', t: 0, tx: h.x, ty: h.y };
    else { const top = h.y > H / 2; G.helper = { kind: 'catfish', t: 0, x: clamp(h.x + 260, 300, W * 0.6), y: top ? 95 : H - 80 }; }
    sfx('charge');
  }
  const k = G.helper; if (!k) return;
  k.t += dt;
  const h = heroHit();
  if (k.kind === 'pike') {
    if (k.t < 0.65) { k.tx = lerp(k.tx, h.x, Math.min(1, dt * 6)); k.ty = lerp(k.ty, h.y, Math.min(1, dt * 6)); }
    if (k.t >= 1.0 && !k.bit) { k.bit = true; sfx('swoosh'); G.shake = Math.max(G.shake, 6); if (d2(h.x, h.y, k.tx, k.ty) < 64 * 64) hurtPlayer(); ringFx(k.tx, k.ty, 10, 70, '#ff3d5a', 0.3); }
    if (k.t > 1.7) G.helper = null;
  } else {
    const mx = k.x - 165 * 0.5, my = k.y + 6;
    k.sucking = k.t > 0.7 && k.t < 2.9;
    if (k.sucking) {
      G.suck = { x: mx, y: my, t: 0.15 };
      if (d2(h.x, h.y, mx, my) < 55 * 55) hurtPlayer();
      if (Math.random() < 0.5) { const x = mx - rand(120, 420), y = my + rand(-150, 150), d = Math.hypot(mx - x, my - y); part({ type: 'dot', x, y, vx: ((mx - x) / d) * 420, vy: ((my - y) / d) * 420, r: rand(1.5, 3), life: d / 420, col: 'rgba(230,250,255,0.8)' }); }
    }
    if (k.t > 3.5) G.helper = null;
  }
}

/* ---------- ending: "you're the boss", iris out, eldritch question, tentacle */
function updateOutro(dt) {
  const o = G.outro; o.t += dt;
  if (o.t > 3.8 && o.s < 1) { o.s = 1; sfx('drone'); }
  if (o.t > 8.6 && o.s < 2) { o.s = 2; sfx('squelch'); G.shake = 14; }
  if (o.t >= 12.4) onWin();
}

/* ============================================================ level 3 art */
Object.assign(ART, {
  urchin(c, e, t) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU, L = 30 + (i % 2) * 6;
      tube(c, [Math.cos(a) * 12, Math.sin(a) * 12, Math.cos(a) * L, Math.sin(a) * L], 2, '#d9c8f0');
    }
    P(c); circ(c, 0, 0, 17); fs(c, '#3d2b52', 3);
    P(c); circ(c, -5, -5, 5); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fill();
  },
  pup(c, e, t) { c.scale(0.68, 0.68); ART.shark(c, e, t); },
});
function drawSquid(c, b, t) {
  const angry = b.phase2, body = angry ? '#ff3d6e' : '#e0558f', dark = angry ? '#c2203f' : '#b23c72';
  for (let i = 0; i < 8; i++) {
    const y0 = -16 + i * 4.6, ph = t * 5 + i * 0.8;
    tube(c, [-40, y0, -90, y0 * 1.6 + Math.sin(ph) * 10, -130, y0 * 2.2 + Math.sin(ph + 1) * 14, -160 - (i % 2) * 14, y0 * 2.6 + Math.sin(ph + 2) * 16], 7 - (i % 3), body);
  }
  for (const s of [-1, 1]) {
    const pts = [-40, s * 8, -120, s * 24 + Math.sin(t * 3 + s) * 10, -190, s * 40 + Math.sin(t * 3 + 1 + s) * 16];
    tube(c, pts, 4, body);
    P(c); ell(c, pts[4] - 8, pts[5], 13, 8); fs(c, body, 2.5);
  }
  P(c); c.moveTo(108, -8); c.lineTo(152, -42); c.lineTo(160, 0); c.lineTo(152, 42); c.lineTo(108, 8); c.closePath(); fs(c, dark, 3);
  P(c); c.moveTo(-24, -32); c.quadraticCurveTo(60, -48, 132, -10); c.quadraticCurveTo(144, 0, 132, 10); c.quadraticCurveTo(60, 48, -24, 32); c.closePath(); fs(c, body, 3.5);
  c.fillStyle = 'rgba(120,20,60,0.35)';
  for (const [x, y, r] of [[20, -18, 5], [50, 10, 6], [80, -10, 4], [100, 8, 3.5], [36, 22, 4]]) { P(c); circ(c, x, y, r); c.fill(); }
  P(c); ell(c, -34, 0, 36, 34); fs(c, body, 3.5);
  if (IMG.squidFace) {
    photoFace(c, IMG.squidFace, -36, 0, 31);
    P(c); circ(c, -36, 0, 31); c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
    if (!b.friendly) { line(c, [-60, -22, -42, -14], 4.5); line(c, [-12, -22, -30, -14], 4.5); }
  } else {
    eye(c, -42, -10, 11, -0.35, 0.15, b.friendly ? 0 : 1.2, '#15121c', 0.6);
    eye(c, -24, 12, 7, -0.35, 0.15, b.friendly ? 0 : 1.2, '#15121c', 0.6);
  }
}
function drawMega(c, b, t) {
  const m = b.mouth || 0, w = Math.sin(t * 3.5), angry = b.phase2;
  const skin = angry ? '#6f5a68' : '#5d6f85', fin = angry ? '#584656' : '#4a5a6e';
  c.save(); c.translate(200, 0); c.rotate(w * 0.12);
  P(c); c.moveTo(0, -12); c.lineTo(70, -90); c.lineTo(52, -6); c.lineTo(62, 70); c.lineTo(0, 14); c.closePath(); fs(c, fin, 4); c.restore();
  P(c); c.moveTo(-40, -70); c.lineTo(10, -150); c.lineTo(50, -66); c.closePath(); fs(c, fin, 4);
  P(c); c.moveTo(110, -46); c.lineTo(130, -80); c.lineTo(146, -40); c.closePath(); fs(c, fin, 3);
  // lower jaw (opens) and mouth
  if (m > 0.05) { P(c); c.moveTo(-120, 20); c.lineTo(-250, 14); c.lineTo(-250, 14 + m * 60); c.lineTo(-120, 44); c.closePath(); c.fillStyle = '#5a0f1c'; c.fill(); }
  c.save(); c.translate(-120, 26); c.rotate(-m * 0.38);
  P(c); c.moveTo(0, -4); c.lineTo(-128, -10); c.quadraticCurveTo(-136, 8, -118, 18); c.lineTo(10, 38); c.closePath(); fs(c, '#dfe6ee', 3.5);
  c.fillStyle = '#fff';
  for (let k = 0; k < 9; k++) { P(c); c.moveTo(-122 + k * 13, -8); c.lineTo(-116 + k * 13, -24); c.lineTo(-110 + k * 13, -8); c.closePath(); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke(); }
  c.restore();
  const body = () => { P(c); c.moveTo(-255, 14); c.quadraticCurveTo(-240, -40, -150, -68); c.quadraticCurveTo(0, -96, 150, -50); c.lineTo(205, -12); c.lineTo(205, 12); c.quadraticCurveTo(120, 56, 0, 64); c.quadraticCurveTo(-110, 64, -120, 30); c.lineTo(-250, 20); c.closePath(); };
  body(); fs(c, skin, 4.5);
  c.save(); body(); c.clip(); P(c); ell(c, -40, 60, 240, 34); c.fillStyle = '#dfe6ee'; c.fill();
  line(c, [-60, -60, -20, -20], 3, 'rgba(255,255,255,0.35)'); line(c, [-50, -64, -14, -30], 3, 'rgba(255,255,255,0.35)'); c.restore();
  c.fillStyle = '#fff';
  for (let k = 0; k < 10; k++) { P(c); c.moveTo(-248 + k * 13, 16); c.lineTo(-242 + k * 13, 32); c.lineTo(-236 + k * 13, 16); c.closePath(); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke(); }
  for (let k = 0; k < 5; k++) { P(c); c.moveTo(-96 + k * 12, -30); c.quadraticCurveTo(-88 + k * 12, 0, -96 + k * 12, 30); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); }
  P(c); c.moveTo(-40, 40); c.lineTo(-10, 100 + w * 5); c.lineTo(20, 46); c.closePath(); fs(c, fin, 3.5);
  P(c); circ(c, -170, -26, 9); fs(c, '#111', 2.5); P(c); circ(c, -172, -28, 3); c.fillStyle = angry ? '#ff1f3d' : '#fff'; c.fill();
  line(c, [-196, -48, -150, -36], 7);
}
function drawLair(c, t) {
  if (!G.lair) return;
  c.fillStyle = 'rgba(8,4,20,0.35)'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#211b30';
  P(c); c.moveTo(0, 0); for (let x = 0; x <= W + 30; x += 30) c.lineTo(x, 62 + Math.sin(x * 0.03) * 10 + (x % 90 === 0 ? 26 : 0)); c.lineTo(W + 30, 0); c.closePath(); c.fill();
  P(c); c.moveTo(0, H); for (let x = 0; x <= W + 30; x += 30) c.lineTo(x, H - 62 - Math.sin(x * 0.027 + 1) * 10 - (x % 120 === 0 ? 22 : 0)); c.lineTo(W + 30, H); c.closePath(); c.fill();
}
function drawFriendsBg(c, t) {
  if (G.LI.boss !== 'mega' || !(G.phase === 'warn' || G.phase === 'boss' || G.phase === 'dead')) return;
  const k = G.phase === 'warn' ? clamp(G.phaseT / 1.2, 0, 1) : 1, hk = G.helper && G.helper.kind;
  c.save(); c.globalAlpha = 0.3 * k;
  if (hk !== 'pike') { c.save(); c.translate(W * 0.42, 118 + Math.sin(t * 1.3) * 8); c.scale(0.55, 0.55); drawPike(c, { mouth: 0.2 }, t); c.restore(); }
  if (hk !== 'catfish') { c.save(); c.translate(W * 0.6, H - 96 + Math.sin(t * 1.1 + 1) * 8); c.scale(0.5, 0.5); drawCatfish(c, { mouth: 0.2 }, t); c.restore(); }
  c.restore();
}
function drawHelpers(c, t) {
  const k = G.helper; if (!k) return;
  if (k.kind === 'pike') {
    const grow = clamp(k.t / 1.0, 0, 1), out = clamp((k.t - 1.15) / 0.5, 0, 1);
    if (k.t < 1.0) { c.save(); c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 20); P(c); circ(c, k.tx, k.ty, 40 - grow * 14); c.lineWidth = 4; c.strokeStyle = '#ff3d5a'; c.stroke(); line(c, [k.tx - 50, k.ty, k.tx + 50, k.ty], 2, '#ff3d5a'); line(c, [k.tx, k.ty - 50, k.tx, k.ty + 50], 2, '#ff3d5a'); c.restore(); }
    const s = lerp(0.2, 0.62, easeOut(grow)) * (1 - out * 0.6), lunge = k.t > 1.0 ? Math.min(1, (k.t - 1.0) / 0.12) : 0;
    c.save(); c.globalAlpha = Math.min(1, 0.3 + grow) * (1 - out); c.translate(k.tx + 150 * s / 0.62 - lunge * 60, k.ty - 8); c.scale(s, s);
    drawPike(c, { mouth: k.t > 0.8 && k.t < 1.15 ? 1 : 0.3, phase2: true }, t); c.restore();
  } else {
    const grow = clamp(k.t / 0.7, 0, 1), out = clamp((k.t - 3.0) / 0.5, 0, 1);
    c.save(); c.globalAlpha = (0.3 + 0.7 * grow) * (1 - out); c.translate(k.x, k.y); const s = lerp(0.2, 0.5, easeOut(grow)); c.scale(s, s);
    drawCatfish(c, { mouth: k.sucking ? 1 : 0.3, sucking: k.sucking, phase2: true }, t); c.restore();
  }
}
function drawSquidAlly(c, t) {
  const s = G.squid; if (!s) return;
  if (s.strike) {
    const a = s.strike.t / 0.22;
    c.save(); c.globalAlpha = a;
    tube(c, [s.x, s.y, (s.x + s.strike.x) / 2 + 20, (s.y + s.strike.y) / 2 - 30, s.strike.x, s.strike.y], 6, '#e0558f');
    P(c); circ(c, s.strike.x, s.strike.y, 10); fs(c, '#e0558f', 2.5); c.restore();
  }
  glow(c, s.x, s.y, 60, 'rgba(255,140,200,A)', G.squidT < 3 && Math.floor(t * 8) % 2 ? 0.15 : 0.45);
  c.save(); c.translate(s.x, s.y); c.scale(-0.36, 0.36); drawSquid(c, { friendly: true }, t); c.restore();
}
function drawLash(c, b, t) {
  const L = b.lash; if (!L) return;
  if (L.phase === 'warn') { c.save(); c.globalAlpha = 0.35 + 0.3 * Math.sin(t * 30); c.strokeStyle = '#ff3d5a'; c.setLineDash([16, 10]); c.lineWidth = 6; P(c); c.moveTo(0, L.y); c.lineTo(b.x - 80, L.y); c.stroke(); c.restore(); return; }
  const pts = []; for (let x = b.x - 60; x >= -20; x -= 30) pts.push(x, L.y + Math.sin(x * 0.05 + t * 20) * 5);
  tube(c, pts, 14, '#e0558f');
  c.fillStyle = '#ffd0e6'; for (let x = b.x - 80; x > 0; x -= 34) { P(c); circ(c, x, L.y + 5, 3.5); c.fill(); }
}
function drawPortal(c, t) {
  const P0 = G.portal; if (!P0) return;
  const k = G.phaseT;
  const draw = (x, y, r) => {
    if (r < 2) return;
    glow(c, x, y, r * 1.8, 'rgba(120,255,80,A)', 0.55);
    P(c); circ(c, x, y, r); c.fillStyle = '#1f6b18'; c.fill();
    c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      P(c);
      for (let a = 0; a < TAU * 1.6; a += 0.2) { const rr = (a / (TAU * 1.6)) * r, aa = a + t * 6 + i * 2.1; const px = x + Math.cos(aa) * rr, py = y + Math.sin(aa) * rr; if (a === 0) c.moveTo(px, py); else c.lineTo(px, py); }
      c.lineWidth = 6; c.strokeStyle = i % 2 ? '#9dff6a' : '#d8ff9e'; c.stroke();
    }
    P(c); for (let a = 0; a <= TAU + 0.01; a += TAU / 28) { const rr = r + Math.sin(a * 7 + t * 9) * 6; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if (a === 0) c.moveTo(px, py); else c.lineTo(px, py); }
    c.lineWidth = 7; c.strokeStyle = '#c6ff6a'; c.stroke();
  };
  const r1 = 115 * easeOut(clamp(k / 0.6, 0, 1)) * (1 - clamp((k - 2.4) / 0.5, 0, 1));
  draw(P0.x, P0.y, r1);
  if (k > 2.2) draw(W * 0.2, H / 2, 70 * clamp((k - 2.2) / 0.3, 0, 1) * (1 - clamp((k - 3.0) / 0.4, 0, 1)));
}
function drawDarkDepths(c, t) {
  c.fillStyle = 'rgba(0,4,16,0.5)'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 3; i++) {
    const x = wrap(i * 420 - t * 14, -200, W + 200), y = 150 + i * 120;
    c.save(); c.globalAlpha = 0.08; c.translate(x, y); c.scale(0.9, 0.9); P(c); ell(c, 0, 0, 160, 40); c.fillStyle = '#9fd0ff'; c.fill(); c.restore();
  }
}
function drawOutro(c) {
  const o = G.outro; if (!o) return;
  const k = o.t;
  c.save();
  if (k < 2.8) {
    const a = clamp(Math.min(k * 4, (2.8 - k) * 4), 0, 1), s = 0.7 + 0.3 * easeOut(Math.min(1, k * 3));
    c.globalAlpha = a; c.translate(SW / 2, SH * 0.4); c.scale(s, s); c.rotate(-0.04);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '50px ' + FONT_DISPLAY; otext(c, 'ТЫ ПРОСТО БОСС,', 0, -32, '#ffd43b', 10);
    otext(c, 'ТЫ ПРОСТО НАЧАЛЬНИК!', 0, 34, '#7ee7f2', 10);
    c.restore(); c.save();
  }
  if (k >= 2.3) {
    const e = easeInOut(clamp((k - 2.3) / 1.4, 0, 1)), q = toScreen(G.player.x, G.player.y);
    const R = lerp(Math.hypot(SW, SH), 0, e);
    c.fillStyle = '#000'; P(c); c.rect(0, 0, SW, SH);
    if (R > 0.5) { c.moveTo(q.x + R, q.y); c.arc(q.x, q.y, R, 0, TAU, true); }
    c.fill('evenodd');
  }
  if (k >= 3.9) {
    const a = clamp((k - 3.9) / 1.4, 0, 1) * (1 - clamp((k - 10.6) / 0.6, 0, 1));
    c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'italic 700 34px "Old Standard TT", Georgia, "Times New Roman", serif';
    const lines = ['Теперь угадайте,', 'кого вызовет на помощь', 'Мегалодон?'];
    c.shadowColor = 'rgba(120,255,140,0.8)'; c.shadowBlur = 18;
    lines.forEach((ln, li) => {
      const total = c.measureText(ln).width; let x = SW / 2 - total / 2;
      for (let i = 0; i < ln.length; i++) {
        const ch = ln[i], wch = c.measureText(ch).width;
        const jx = Math.sin(k * 3 + i * 1.7 + li) * 1.5, jy = Math.sin(k * 2.3 + i * 0.9 + li * 2) * 3;
        c.fillStyle = li === 2 ? '#c6ffb0' : '#a8d8a0';
        c.fillText(ch, x + wch / 2 + jx, SH * 0.36 + li * 50 + jy);
        x += wch;
      }
    });
    c.shadowBlur = 0; c.globalAlpha = 1;
  }
  if (k >= 8.6) {
    const slam = easeOut(clamp((k - 8.6) / 0.35, 0, 1)), slide = easeInOut(clamp((k - 9.0) / 2.0, 0, 1)) * SH * 1.1;
    // the tentacle's spine as a curve from the top-right corner
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const curl = Math.max(0, (u - 0.7) / 0.3);   // the tip curls up
      const x = lerp(SW + 180, SW * 0.36, u * slam) + Math.sin(u * Math.PI * 2.2 + k * 3) * 70 * u - Math.sin(curl * 2.6) * 70 * curl;
      const y = lerp(-200, SH * 0.52, u * slam) + Math.sin(u * Math.PI * 1.6 + k * 2) * 50 * u - (1 - Math.cos(curl * 2.6)) * 60 * curl;
      pts.push([x, y, lerp(150, 8, Math.pow(u, 0.85))]);
    }
    const shape = (dy) => {
      P(c);
      for (let i = 0; i < pts.length; i++) { const [x, y, w] = pts[i], [x2, y2] = pts[Math.min(pts.length - 1, i + 1)], [x0, y0] = pts[Math.max(0, i - 1)]; const nx = -(y2 - y0), ny = x2 - x0, l = Math.hypot(nx, ny) || 1; const px = x + (nx / l) * w / 2, py = y + dy + (ny / l) * w / 2; if (i === 0) c.moveTo(px, py); else c.lineTo(px, py); }
      for (let i = pts.length - 1; i >= 0; i--) { const [x, y, w] = pts[i], [x2, y2] = pts[Math.min(pts.length - 1, i + 1)], [x0, y0] = pts[Math.max(0, i - 1)]; const nx = -(y2 - y0), ny = x2 - x0, l = Math.hypot(nx, ny) || 1; c.lineTo(x - (nx / l) * w / 2, y + dy - (ny / l) * w / 2); }
      c.closePath();
    };
    // slime trail left behind while it slides down
    for (let dy = 0; dy < slide; dy += 14) { shape(dy); c.fillStyle = 'rgba(140,230,90,0.035)'; c.fill(); }
    if (slide > 20) for (let i = 2; i < pts.length; i += 3) {
      const [x, y] = pts[i], len = (Math.sin(i * 7.3) * 0.5 + 0.5) * 60 + 20;
      P(c); c.moveTo(x - 4, y + slide - 10); c.lineTo(x - 4, y + slide + len); c.arc(x, y + slide + len, 4, Math.PI, 0, true); c.lineTo(x + 4, y + slide - 10); c.fillStyle = 'rgba(150,240,100,0.55)'; c.fill();
    }
    shape(slide); c.fillStyle = '#4a6b4f'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#1b2a1d'; c.stroke();
    c.fillStyle = '#d9e8c8';
    for (let i = 3; i < pts.length - 2; i += 2) { const [x, y, w] = pts[i]; P(c); ell(c, x - w * 0.18, y + slide + w * 0.22, w * 0.13 + 2, w * 0.09 + 2); c.fill(); c.lineWidth = 2; c.strokeStyle = '#1b2a1d'; c.stroke(); }
  }
  if (k >= 11.0) { c.globalAlpha = clamp((k - 11.0) / 1.0, 0, 1); c.fillStyle = '#000'; c.fillRect(0, 0, SW, SH); }
  c.restore();
}
