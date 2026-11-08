/* ============================================================ particles & effects */
const FONT_DISPLAY = '"Dela Gothic One", "Arial Black", Impact, sans-serif';
const FONT_UI = '"Nunito", "Segoe UI", Roboto, Arial, sans-serif';
const FONT_HAND = '"Pangolin", "Comic Sans MS", "Segoe Print", cursive';

function part(o) { if (G.parts.length < 380) G.parts.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, life: 0.6, age: 0, r: 3, col: '#fff', type: 'dot', g: 0, rot: rand(0, TAU), vr: rand(-6, 6) }, o)); }
function burst(x, y, n, o) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(o.smin || 60, o.smax || 260);
    part(Object.assign({}, o, { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(o.lmin || 0.3, o.lmax || 0.7), r: rand(o.rmin || 2, o.rmax || 4) }));
  }
}
function ringFx(x, y, r0, r1, col, life) { part({ type: 'ring', x, y, r: r0, r1, col, life: life || 0.4 }); }
function hitSpark(x, y) {
  if (G.mode === 'fish') { part({ type: 'bubble', x, y, vx: rand(-40, 40), vy: rand(-80, -30), r: rand(2, 4), life: 0.4, col: '#e6fbff' }); ringFx(x, y, 3, 14, '#e6fbff', 0.18); }
  else { burst(x, y, 3, { type: 'spark', col: '#fff6c2', smin: 120, smax: 260, lmin: 0.12, lmax: 0.22, rmin: 2, rmax: 3 }); }
}
function puff(x, y) { part({ type: 'smoke', x, y, r: 6, r1: 16, col: G.mode === 'fish' ? 'rgba(220,250,255,A)' : 'rgba(255,255,255,A)', life: 0.35 }); }
function explodeAt(x, y, col) {
  ringFx(x, y, 8, 54, '#fff', 0.35);
  burst(x, y, 12, { type: 'dot', col, smin: 80, smax: 300, lmin: 0.3, lmax: 0.6, rmin: 3, rmax: 6 });
  for (let i = 0; i < 4; i++) part({ type: 'smoke', x: x + rand(-14, 14), y: y + rand(-14, 14), r: 10, r1: 28, col: G.mode === 'fish' ? 'rgba(220,250,255,A)' : 'rgba(255,240,220,A)', life: rand(0.4, 0.7), vx: rand(-30, 30), vy: rand(-40, 0) });
}
function explode(e) {
  const x = e.x, y = e.y, a = e.art;
  ringFx(x, y, 6, e.r * 2.4, '#fff', 0.3);
  if (a === 'pigeon' || a === 'crow' || a === 'gull') {
    const col = a === 'crow' ? '#3a3646' : a === 'gull' ? '#f7f7f2' : '#a7b0bf';
    burst(x, y, 9, { type: 'feather', col, smin: 50, smax: 180, lmin: 0.8, lmax: 1.4, rmin: 4, rmax: 7 });
    burst(x, y, 6, { type: 'dot', col: '#fff', smin: 60, smax: 200, lmin: 0.2, lmax: 0.4 });
  } else if (a === 'plane') {
    burst(x, y, 10, { type: 'chunk', col: '#ffffff', g: 260, smin: 60, smax: 220, lmin: 0.6, lmax: 1.1, rmin: 3, rmax: 6 });
  } else if (a === 'drone') {
    burst(x, y, 10, { type: 'spark', col: '#ffd166', smin: 120, smax: 340, lmin: 0.2, lmax: 0.4 });
    burst(x, y, 6, { type: 'chunk', col: '#3d4352', g: 420, smin: 60, smax: 200, lmin: 0.6, lmax: 1.0 });
    puff(x, y);
  } else if (a === 'cloud') {
    for (let i = 0; i < 10; i++) part({ type: 'smoke', x: x + rand(-50, 50), y: y + rand(-30, 30), r: 14, r1: 40, col: 'rgba(200,205,225,A)', life: rand(0.6, 1), vx: rand(-40, 40), vy: rand(-30, 30) });
    burst(x, y, 12, { type: 'dot', col: '#2f6fd6', g: 300, smin: 60, smax: 200, lmin: 0.5, lmax: 0.9 });
  } else if (a === 'balloon') {
    burst(x, y - 4, 8, { type: 'chunk', col: '#ff4d6d', g: 200, smin: 80, smax: 220, lmin: 0.5, lmax: 0.9, rmin: 3, rmax: 5 });
  } else if (a === 'chest') {
    burst(x, y, 8, { type: 'chunk', col: '#a0632f', g: 160, smin: 60, smax: 200, lmin: 0.6, lmax: 1.0 });
    burst(x, y, 8, { type: 'star', col: '#ffcf4a', smin: 40, smax: 140, lmin: 0.5, lmax: 0.9, rmin: 4, rmax: 6 });
  } else {
    const col = { piranha: '#ff5a3c', jelly: '#ff8fd0', shark: '#93a4ba', puffer: '#ffd23f', octo: '#a964dd' }[a] || '#fff';
    burst(x, y, 10, { type: 'bubble', col: '#e6fbff', smin: 40, smax: 160, lmin: 0.5, lmax: 1.0, rmin: 2, rmax: 6 });
    burst(x, y, 9, { type: 'dot', col, smin: 60, smax: 220, lmin: 0.25, lmax: 0.5, rmin: 2, rmax: 5 });
  }
  if (e.kind === 'heavy') { explodeAt(x - 20, y - 10, '#ffb347'); explodeAt(x + 20, y + 10, '#fff'); }
}
function updateParts(dt) {
  for (const p of G.parts) {
    p.age += dt;
    if (p.type === 'feather') { p.vx *= 1 - dt * 2.5; p.vy = p.vy * (1 - dt * 2.5) + 40 * dt; p.x += (p.vx + Math.sin(p.age * 6) * 30) * dt; p.y += p.vy * dt; p.rot += p.vr * dt * 0.5; continue; }
    if (p.type === 'bubble') { p.vx *= 1 - dt * 2; p.vy = p.vy * (1 - dt * 1.5) - 60 * dt; }
    p.vy += (p.g || 0) * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.type === 'dot' || p.type === 'spark') { p.vx *= 1 - dt * 3; p.vy *= 1 - dt * 3; }
  }
  G.parts = G.parts.filter((p) => p.age < p.life);
  for (const t of G.texts) { t.t += dt; t.y -= 34 * dt; }
  G.texts = G.texts.filter((t) => t.t < t.life);
  for (const b of G.banners) b.t += dt;
  G.banners = G.banners.filter((b) => b.t < b.life);
}
function drawParts(c) {
  for (const p of G.parts) {
    const k = p.age / p.life, a = 1 - k;
    switch (p.type) {
      case 'ring': P(c); circ(c, p.x, p.y, lerp(p.r, p.r1, easeOut(k))); c.globalAlpha = a; c.lineWidth = 4 * a + 1; c.strokeStyle = p.col; c.stroke(); c.globalAlpha = 1; break;
      case 'smoke': P(c); circ(c, p.x, p.y, lerp(p.r, p.r1, easeOut(k))); c.fillStyle = p.col.replace('A', (0.55 * a).toFixed(3)); c.fill(); break;
      case 'bubble': P(c); circ(c, p.x, p.y, p.r); c.globalAlpha = Math.min(1, a * 1.5); c.lineWidth = 1.6; c.strokeStyle = p.col; c.stroke(); c.globalAlpha = 1; break;
      case 'spark': c.globalAlpha = a; line(c, [p.x, p.y, p.x - p.vx * 0.04, p.y - p.vy * 0.04], p.r, p.col); c.globalAlpha = 1; break;
      case 'feather': c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = Math.min(1, a * 2); P(c); ell(c, 0, 0, p.r * 1.6, p.r * 0.6); fs(c, p.col, 1.2); c.restore(); c.globalAlpha = 1; break;
      case 'chunk': c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = Math.min(1, a * 2); P(c); c.rect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2); fs(c, p.col, 1.2); c.restore(); c.globalAlpha = 1; break;
      case 'star': c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = a; P(c); starPath(c, 0, 0, p.r, p.r * 0.45); c.fillStyle = p.col; c.fill(); c.restore(); c.globalAlpha = 1; break;
      default: P(c); circ(c, p.x, p.y, Math.max(0.3, p.r * (1 - k * 0.7))); c.globalAlpha = Math.min(1, a * 1.6); c.fillStyle = p.col; c.fill(); c.globalAlpha = 1;
    }
  }
}

/* ============================================================ drawing the scene */
function progress() {
  if (!G) return 0;
  if (G.level === 2) return G.mode === 'fish' ? clamp(0.55 + (G.t / (G.len + 4)) * 0.45, 0, 1) : clamp(G.t / 46, 0, 1);
  return clamp(G.t / (G.len + 4), 0, 1);
}
function otext(c, txt, x, y, fill, lw) { c.lineWidth = lw || 5; c.strokeStyle = INK; c.lineJoin = 'round'; c.strokeText(txt, x, y); c.fillStyle = fill; c.fillText(txt, x, y); }
// keep a sprite upright on screen while the world is turned
function upright(c) { if (G && G.vert) c.rotate(Math.PI / 2); }

function drawEnemy(c, e, t) {
  const fn = ART[e.art]; if (!fn) return;
  c.save(); c.translate(e.x, e.y);
  if (e.move === 'lance' && e.st === 'warn') {
    c.save(); c.globalAlpha = 0.35 + 0.3 * Math.sin(t * 30); c.strokeStyle = '#ff3d5a'; c.setLineDash([14, 10]); c.lineWidth = 5;
    P(c); c.moveTo(-e.x - 20, 0); c.lineTo(-30, 0); c.stroke(); c.restore();
  }
  if (e.ally) glow(c, 0, 0, e.r * 2.4, 'rgba(255,140,200,A)', 0.5);
  if (UPRIGHT.has(e.art)) upright(c);
  if (e.shiver) c.translate(rand(-1.6, 1.6), rand(-1.6, 1.6));
  if (e.rot) c.rotate(e.rot);
  if (e.flip) c.scale(-1, 1);
  c.save(); fn(c, e, t); c.restore();
  if (e.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; fn(c, e, t); c.restore(); }
  c.restore();
  if (e.ally) {
    const q = { x: e.x, y: e.y }; c.save(); c.translate(q.x, q.y); upright(c);
    P(c); heartPath(c, 0, -e.r - 14 + Math.sin(t * 6) * 2, 7); fs(c, '#ff4d8d', 2); c.restore();
  }
}
function drawPlayer(c, t) {
  const p = G.player;
  if (!p.alive && p.deadT > 2) return;
  c.save();
  if (p.inv > 0 && p.alive && Math.floor(p.inv * 14) % 2 === 0) c.globalAlpha = 0.35;
  c.translate(p.x, p.y); upright(c);
  if (!p.alive) c.rotate(p.rot);
  if (p.sc !== undefined && p.sc !== 1) c.scale(p.sc, p.sc);
  if (p.spin) c.rotate(p.spin);
  if (G.mode === 'duck') drawDuckHero(c, 0, 0, t, { h: 77, tilt: p.tilt, flapSpeed: G.phase === 'turn' ? 24 : 15 });
  else drawCarpHero(c, 0, 0, t, { w: 150, tilt: p.tilt * 0.7 });
  c.restore();
}
function drawPickup(c, k, t) {
  const col = k.type === 'power' ? 'rgba(120,220,255,A)' : k.type === 'bomb' ? 'rgba(255,190,90,A)' : k.type === 'charm' ? 'rgba(255,150,210,A)' : k.type === 'slow' ? 'rgba(150,210,255,A)' : 'rgba(255,248,210,A)';
  glow(c, k.x, k.y, 36, col, 0.6 + Math.sin(t * 5 + k.age) * 0.15);
  c.save(); c.translate(k.x, k.y); upright(c); drawPickupIcon(c, 0, 0, k.type, t + k.age, 1); c.restore();
}
function wrapText(c, text, maxW) {
  const words = text.split(' '), lines = [];
  let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur);
  return lines;
}
// speech bubble in screen space; side -1 = bubble to the left of the speaker, +1 = right
function speechAt(c, text, ax, ay, tLeft, total, side) {
  c.font = '21px ' + FONT_HAND;
  const lines = wrapText(c, text, 240);
  let w = 0; for (const l of lines) w = Math.max(w, c.measureText(l).width);
  w += 30; const h = lines.length * 25 + 18;
  const bx = clamp(side < 0 ? ax - w - 26 : ax + 26, 10, SW - w - 10), by = clamp(ay - h - 20, 74, SH - h - 10);
  const k = clamp(Math.min((total - tLeft) * 7, tLeft * 4), 0, 1);
  const t1 = clamp(side < 0 ? bx + w - 30 : bx + 30, bx + 20, bx + w - 20), t2 = t1 + (side < 0 ? -28 : 28);
  c.save(); c.globalAlpha = k;
  c.translate(bx + w / 2, by + h / 2); c.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k); c.translate(-(bx + w / 2), -(by + h / 2));
  P(c); rr(c, bx, by, w, h, 14);
  c.moveTo(t1, by + h - 1); c.lineTo(ax, ay - 4); c.lineTo(t2, by + h - 1);
  fs(c, '#fff', 3.5);
  P(c); c.rect(Math.min(t1, t2) + 2, by + h - 5, 24, 6); c.fillStyle = '#fff'; c.fill();
  c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
  lines.forEach((l, i) => c.fillText(l, bx + w / 2, by + 21 + i * 25));
  c.restore();
}
function drawSpeech(c, b) {
  const s = toScreen(b.x, b.y + b.oy), k = BOSS[b.kind].scale || 1, hd = BOSS[b.kind].head.map((v) => v * k);
  speechAt(c, b.speech.text, s.x + hd[0], s.y + hd[1], b.speech.t, 2.3, -1);
}
const BOSS_ART = { granny: drawGranny, pike: drawPike, car: drawCar, catfish: drawCatfish, squid: drawSquid, mega: drawMega };
function drawBossEntity(c, b, t) {
  const x = b.x, y = b.y + b.oy;
  if (b.telegraph > 0) {
    c.save(); c.globalAlpha = 0.3 + 0.3 * Math.sin(t * 30); c.strokeStyle = '#ff3d5a'; c.setLineDash([18, 12]); c.lineWidth = 7;
    P(c); c.moveTo(0, y); c.lineTo(x - 120, y); c.stroke(); c.restore();
  }
  if (b.lash) drawLash(c, b, t);
  c.save(); c.translate(x, y); upright(c);
  if (b.telegraph > 0) c.translate(rand(-2.5, 2.5), rand(-2.5, 2.5));
  if (b.kind === 'car' && b.nose > 0.01) c.rotate(-b.nose * Math.PI / 2);
  if (b.dead) {
    if (b.kind === 'granny' || b.kind === 'car') c.rotate(b.rot);
    else if (b.kind === 'squid') { b.friendly = true; if (b.deadT > 1.4) c.scale(-1, 1); }
    else c.scale(1, Math.cos(b.rot));
  }
  const fn = BOSS_ART[b.kind];
  if (BOSS[b.kind].scale) c.scale(BOSS[b.kind].scale, BOSS[b.kind].scale);
  c.save(); fn(c, b, t); c.restore();
  if (b.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.2; fn(c, b, t); c.restore(); }
  c.restore();
}
// the beaten pike swims by and calls the catfish
function drawCameo(c, t) {
  const m = G.cameo; if (!m) return;
  c.save(); c.translate(m.x, m.y + Math.sin(t * 6) * 6); c.scale(0.42, 0.42);
  drawPike(c, { phase2: false, mouth: 0.5 + Math.sin(t * 10) * 0.3 }, t);
  line(c, [-110, -50, -80, -30], 10, '#fff'); line(c, [-110, -30, -80, -50], 10, '#fff');
  c.restore();
}
function drawTunnel(c, t) {
  if (!G.tunnel) return;
  const s = tunScroll(), top = [], bot = [];
  for (let x = -24; x <= W + 24; x += 12) { const a = tunAt(x); top.push([x, a ? a.c - a.g : -60]); bot.push([x, a ? a.c + a.g : H + 60]); }
  const rock = c.createLinearGradient(0, 0, 0, H); rock.addColorStop(0, '#16202b'); rock.addColorStop(0.5, '#2c3b4c'); rock.addColorStop(1, '#16202b');
  c.fillStyle = rock;
  P(c); c.moveTo(-24, -70); for (const [x, y] of top) c.lineTo(x, y); c.lineTo(W + 24, -70); c.closePath(); c.fill();
  P(c); c.moveTo(-24, H + 70); for (const [x, y] of bot) c.lineTo(x, y); c.lineTo(W + 24, H + 70); c.closePath(); c.fill();
  c.lineWidth = 4; c.strokeStyle = '#4f6a7f';
  P(c); top.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  P(c); bot.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  const step = 30;
  for (let u = Math.ceil((s - 40) / step) * step; u < s + W + 40; u += step) {
    const x = u - s, a = tunAt(x);
    if (!a || a.g > H / 2 + 20) continue;
    const ty = a.c - a.g, by = a.c + a.g;
    P(c); c.moveTo(x - 10, ty - 3); c.lineTo(x, ty + 17); c.lineTo(x + 10, ty - 3); c.closePath(); fs(c, '#efe6cf', 2);
    P(c); c.moveTo(x - 10, by + 3); c.lineTo(x, by - 17); c.lineTo(x + 10, by + 3); c.closePath(); fs(c, '#efe6cf', 2);
  }
}
function drawBombFx(c, t) {
  const fx = G.bombFx; if (!fx) return;
  const k = fx.t / fx.dur;
  if (G.mode === 'duck') {
    c.save(); c.globalAlpha = 1 - k;
    P(c); circ(c, fx.x, fx.y, fx.r); c.lineWidth = 40 * (1 - k) + 4; c.strokeStyle = '#fff'; c.stroke();
    P(c); circ(c, fx.x, fx.y, fx.r * 0.82); c.lineWidth = 12 * (1 - k) + 2; c.strokeStyle = '#ffd43b'; c.stroke();
    c.restore();
  } else {
    const fr = fx.front;
    c.save();
    c.globalAlpha = Math.min(1, (1 - k) * 2.5);
    const g = c.createLinearGradient(fr - 260, 0, fr, 0); g.addColorStop(0, 'rgba(140,230,255,0)'); g.addColorStop(1, 'rgba(160,240,255,0.55)');
    c.fillStyle = g; c.fillRect(fr - 260, 0, 260, H);
    P(c); c.moveTo(fr - 60, 0);
    for (let y = 0; y <= H; y += 20) c.lineTo(fr + Math.sin(y * 0.045 + t * 9) * 16, y);
    c.lineTo(fr - 60, H); c.closePath(); c.fillStyle = 'rgba(200,250,255,0.55)'; c.fill();
    c.lineWidth = 5; c.strokeStyle = '#fff';
    P(c); for (let y = 0; y <= H; y += 20) { const xx = fr + Math.sin(y * 0.045 + t * 9) * 16; if (y === 0) c.moveTo(xx, y); else c.lineTo(xx, y); } c.stroke();
    for (let i = 0; i < 6; i++) drawBubble(c, fr - 20 - ((i * 37 + t * 200) % 120), (i * 97 + t * 60) % H, 6 + (i % 3) * 3);
    c.restore();
  }
}
function drawWarns(c, t) {
  for (const w of G.warns) {
    if (Math.floor(t * 8) % 2) continue;
    const q = toScreen(24, w.y);
    c.save(); c.translate(q.x, q.y); if (G.vert) c.rotate(-Math.PI / 2);
    P(c); c.moveTo(-14, 0); c.lineTo(14, -18); c.lineTo(14, 18); c.closePath(); fs(c, '#ff3d5a', 3);
    c.restore();
    c.font = '22px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle';
    otext(c, '!', q.x + (G.vert ? 0 : 34), q.y - (G.vert ? 34 : 0), '#fff6e5', 5);
  }
}
function drawTexts(c) {
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const t of G.texts) {
    const a = 1 - t.t / t.life, q = toScreen(t.x, t.y);
    c.globalAlpha = Math.min(1, a * 2);
    c.font = '900 ' + t.size + 'px ' + FONT_UI;
    otext(c, t.text, clamp(q.x, 60, SW - 60), clamp(q.y - (G.vert ? 0 : 0), 20, SH - 20), t.col, 4);
  }
  c.globalAlpha = 1;
}
function drawHUD(c, t) {
  c.textBaseline = 'middle';
  const low = G.hp <= 1 && G.player.alive;
  for (let i = 0; i < MAX_HP; i++) {
    const x = 28 + i * 30, y = 28, s = low && i === 0 ? 11 * (1 + Math.sin(t * 10) * 0.12) : 11;
    P(c); heartPath(c, x, y, s);
    if (i < G.hp) { fs(c, '#ff3d5a', 3); P(c); ell(c, x - 4, y - 4, 3, 2, -0.6); c.fillStyle = 'rgba(255,255,255,.75)'; c.fill(); }
    else fs(c, 'rgba(34,29,46,0.35)', 2.5, 'rgba(255,246,229,0.75)');
  }
  for (let i = 0; i < G.bombs; i++) { P(c); starPath(c, 24 + i * 22, 58, 9, 4); fs(c, '#ffb347', 2.2); }
  c.font = '900 12px ' + FONT_UI; c.textAlign = 'left';
  otext(c, 'СИЛА', 15, 82, '#fff6e5', 4);
  for (let i = 0; i < MAX_POWER; i++) { P(c); rr(c, 54 + i * 15, 76, 11, 12, 3); fs(c, i < G.power ? '#7ee7f2' : 'rgba(34,29,46,0.3)', 2, i < G.power ? INK : 'rgba(255,246,229,0.7)'); }
  let hy = 104;
  if (G.charm > 0) {
    c.font = '900 12px ' + FONT_UI; c.textAlign = 'left'; otext(c, 'ДРУЖБА', 15, hy, '#ffd0e6', 4);
    for (let i = 0; i < G.charm; i++) { P(c); heartPath(c, 80 + i * 17, hy, 6.5); fs(c, '#ff4d8d', 2); }
    hy += 24;
  }
  if (G.slowT > 0) {
    c.font = '900 12px ' + FONT_UI; c.textAlign = 'left'; otext(c, 'ЗАМЕДЛЕНИЕ', 15, hy, '#bfe4ff', 4);
    P(c); rr(c, 110, hy - 6, 80, 12, 6); fs(c, 'rgba(34,29,46,0.4)', 2, '#fff');
    P(c); rr(c, 112, hy - 4, 76 * clamp(G.slowT / 7, 0, 1), 8, 4); c.fillStyle = '#4dabf7'; c.fill();
  }
  c.font = '26px ' + FONT_DISPLAY; c.textAlign = 'center';
  otext(c, fmt(G.score), W / 2, 28, '#fff6e5', 6);
  const b = G.boss;
  if (b && ['boss', 'bossDead', 'dead', 'mini', 'miniDead'].includes(G.phase)) {
    const bw = Math.min(440, W * 0.46), bx = W / 2 - bw / 2, by = 60;
    c.font = '900 13px ' + FONT_UI; otext(c, BOSS[b.kind].label, W / 2, 52, '#ffd43b', 4);
    P(c); rr(c, bx, by, bw, 15, 7.5); fs(c, 'rgba(34,29,46,0.65)', 3);
    const k = clamp(b.hp / b.maxHp, 0, 1) * b.shown;
    if (k > 0) { P(c); rr(c, bx + 3, by + 3, (bw - 6) * k, 9, 4.5); c.fillStyle = b.phase2 ? '#ff3d5a' : '#ffb347'; c.fill(); }
  }
  if (G.t < 6.5 && G.player.alive) {
    const a = clamp(Math.min((G.t - 1) * 2, (6.5 - G.t) * 2), 0, 1);
    if (a > 0) {
      c.globalAlpha = a; c.font = '800 17px ' + FONT_UI; c.textAlign = 'center';
      const msg = isTouch ? 'Веди пальцем по экрану — герой повторит движение. Стреляет сам!' : 'Стрелки / WASD или тяни мышью · стреляет сам · Пробел — суперудар';
      otext(c, msg, W / 2, H - 26, '#fff6e5', 5);
      c.globalAlpha = 1;
    }
  }
}
function drawBanners(c, t) {
  for (const b of G.banners) {
    const appear = easeOut(Math.min(1, b.t * 4)), a = clamp(Math.min(appear, (b.life - b.t) * 3), 0, 1);
    c.save(); c.globalAlpha = a;
    c.translate(W / 2, H * 0.42); const s = 0.6 + 0.4 * appear; c.scale(s, s); c.rotate(-0.04);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (b.style === 'sign') {
      c.font = '54px ' + FONT_HAND;
      const w = c.measureText(b.text).width + 60;
      P(c); rr(c, -w / 2 + 6, -36, w, 80, 12); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill();
      P(c); rr(c, -w / 2, -42, w, 80, 12); fs(c, '#ffffff', 7);
      c.fillStyle = INK; c.fillText(b.text, 0, 0);
    } else if (b.style === 'small') {
      c.translate(0, H * 0.22);
      c.font = '34px ' + FONT_DISPLAY; otext(c, b.text, 0, -10, '#ff8fc0', 8);
      if (b.sub) { c.font = '900 20px ' + FONT_UI; otext(c, b.sub, 0, 26, '#fff6e5', 5); }
    } else if (b.style === 'wave') {
      c.font = '50px ' + FONT_DISPLAY;
      otext(c, b.text, 0, 0, '#7ee7f2', 10);
    } else if (b.style === 'warn') {
      if (Math.floor(b.t * 4) % 2 === 0 || b.t > 2) {
        c.font = '58px ' + FONT_DISPLAY; otext(c, b.text, 0, -10, '#ff3d5a', 10);
      }
      c.font = '900 26px ' + FONT_UI; otext(c, 'Босс: ' + b.sub, 0, 46, '#ffd43b', 6);
    } else {
      c.font = '56px ' + FONT_DISPLAY; otext(c, b.text, 0, -12, '#ffd43b', 10);
      if (b.sub) { c.font = '900 24px ' + FONT_UI; otext(c, b.sub, 0, 40, '#fff6e5', 6); }
    }
    c.restore();
  }
  if (G.phase === 'warn') {
    const k = Math.sin(G.phaseT * 10) * 0.5 + 0.5;
    c.fillStyle = 'rgba(255,61,90,' + (0.15 + 0.15 * k).toFixed(3) + ')';
    c.fillRect(0, 0, W, 16); c.fillRect(0, H - 16, W, 16);
  }
}

function drawBackground(c, T) {
  const p = progress();
  if (G.mode === 'fish') { drawSea(c, T, G.dark ? 1 : p); if (G.level >= 2) drawDeepGlow(c, T); if (G.dark) drawDarkDepths(c, T); return; }
  if (G.level === 1) { drawSky(c, T, p); return; }
  if (G.vert) { drawSkyUp(c, T, 1); return; }
  c.save();
  if (G.phase === 'turn') { const r = Math.sin(G.turnK * Math.PI) * 0.22; c.translate(SW / 2, SH / 2); c.rotate(r); c.scale(1 + Math.sin(G.turnK * Math.PI) * 0.25, 1 + Math.sin(G.turnK * Math.PI) * 0.25); c.translate(-SW / 2, -SH / 2); }
  drawSkyEvening(c, T, p, G.turnK);
  c.restore();
  if (G.turnK > 0) drawSkyUp(c, T, G.turnK);
}
function render() {
  const c = ctx;
  setScreen();
  c.setTransform(view.px, 0, 0, view.px, 0, 0);
  if (!G) { c.fillStyle = '#0b2f57'; c.fillRect(0, 0, W, H); return; }
  ensureBg(G.mode);
  const T = G.bgT;
  c.save();
  if (G.shake > 0.3 && !reducedMotion) c.translate(rand(-1, 1) * G.shake, rand(-1, 1) * G.shake);
  drawBackground(c, T);
  // ---- world (turned 90 degrees during vertical flight)
  c.save();
  if (G.vert) { c.translate(0, SH); c.rotate(-Math.PI / 2); }
  setWorld();
  drawLair(c, T);
  drawFriendsBg(c, T);
  drawTunnel(c, T);
  drawPortal(c, T);
  for (const k of G.pickups) drawPickup(c, k, T);
  for (const e of G.enemies) drawEnemy(c, e, T);
  drawHelpers(c, T);
  if (G.boss) drawBossEntity(c, G.boss, T);
  drawCameo(c, T);
  for (const s of G.pb) {
    if (s.charm) drawEB(c, { type: 'charm', x: s.x, y: s.y + Math.sin(s.age * 10) * 2, r: s.r }, T);
    else if (G.mode === 'duck') drawKnife(c, s.x, s.y, s.ang);
    else if (s.friendly) { P(c); circ(c, s.x, s.y, 6); fs(c, '#ff8fc0', 2, '#fff'); }
    else drawBubble(c, s.x, s.y + Math.sin(s.age * 16 + s.wob) * 1.6, s.r * (0.85 + Math.min(s.age * 1.2, 0.35)));
  }
  drawPlayer(c, T);
  drawSquidAlly(c, T);
  drawParts(c);
  for (const b of G.eb) drawEB(c, b, T);
  drawBombFx(c, T);
  c.restore();
  setScreen();
  drawWarns(c, T);
  if (G.boss && G.boss.speech) drawSpeech(c, G.boss);
  if (G.cameo && G.cameo.t < 3) { const q = toScreen(G.cameo.x, G.cameo.y); speechAt(c, 'Сом, помоги! Меня обижают!', q.x - 40, q.y - 20, 3 - G.cameo.t, 3, -1); }
  if (G.LI.boss === 'mega' && G.phase === 'warn') {
    const a = toScreen(W * 0.6, H - 96), b = toScreen(W * 0.42, 118);
    if (G.phaseT > 0.3 && G.phaseT < 1.8) speechAt(c, 'Мегалодон, приди!', a.x - 70, a.y - 30, 1.8 - G.phaseT, 1.5, -1);
    if (G.phaseT > 1.7 && G.phaseT < 3.2) speechAt(c, 'Отомсти за нас!', b.x - 60, b.y - 10, 3.2 - G.phaseT, 1.5, -1);
  }
  if (G.heroSay) { const q = toScreen(G.player.x, G.player.y); speechAt(c, G.heroSay.text, q.x + 10, q.y - 46, G.heroSay.t, 3.4, 1); }
  c.restore();
  drawTexts(c);
  if (G.slowT > 0) { const a = Math.min(1, G.slowT) * 0.16; c.fillStyle = 'rgba(80,160,255,' + a.toFixed(3) + ')'; c.fillRect(0, 0, W, H); }
  if (!G.outro) { drawHUD(c, T); drawBanners(c, T); }
  if (G.flash > 0) { c.globalAlpha = Math.min(0.55, G.flash); c.fillStyle = G.flashColor; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  drawOutro(c);
  if (G.outro && !$('hud').hidden) $('hud').hidden = true;
  updateSquidBtn();
}
