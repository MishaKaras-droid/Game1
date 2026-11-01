/* ============================================================ art: all drawn in code, cartoon style
   (thick ink outline, flat fills), same look as the knife duck meme */
const INK = '#221d2e';
const IMG = {};
const SPR = ASSETS.meta;

function loadImages() {
  return Promise.all(Object.keys(ASSETS.img).map((k) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { IMG[k] = im; res(); };
    im.onerror = () => res();
    im.src = ASSETS.img[k];
  })));
}

/* ---------- path helpers */
function P(c) { c.beginPath(); return c; }
function circ(c, x, y, r) { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }
function ell(c, x, y, rx, ry, rot) { rot = rot || 0; c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); c.ellipse(x, y, rx, ry, rot, 0, TAU); }
function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function fs(c, fill, lw, stroke) {
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.lineWidth = lw; c.strokeStyle = stroke || INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
}
function line(c, pts, lw, col) {
  P(c); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.lineWidth = lw; c.strokeStyle = col || INK; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
}
// a thick "inked" stroke: dark outline + colored core
function tube(c, pts, w, col) { line(c, pts, w + 4, INK); line(c, pts, w, col); }
function starPath(c, x, y, r1, r2, n) {
  n = n || 5;
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1, a = -Math.PI / 2 + (i * Math.PI) / n;
    if (i === 0) c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath();
}
function heartPath(c, x, y, s) {
  c.moveTo(x, y + s * 0.95);
  c.bezierCurveTo(x - s * 1.5, y - s * 0.05, x - s * 0.75, y - s * 1.25, x, y - s * 0.42);
  c.bezierCurveTo(x + s * 0.75, y - s * 1.25, x + s * 1.5, y - s * 0.05, x, y + s * 0.95);
  c.closePath();
}
// eye with pupil and an angry brow. tilt>0: left end of the brow is lower (character looks left)
function eye(c, x, y, r, px, py, tilt, iris, browW) {
  P(c); circ(c, x, y, r); fs(c, '#fff', Math.max(1.4, r * 0.32));
  P(c); circ(c, x + (px || 0) * r, y + (py || 0) * r, r * 0.52); c.fillStyle = iris || '#15121c'; c.fill();
  if (tilt !== 0) {
    const t = tilt === undefined ? 1 : tilt;
    line(c, [x - r * 1.25, y - r * (1.05 - 0.5 * t), x + r * 1.2, y - r * (1.05 + 0.5 * t)], Math.max(2, r * (browW || 0.55)));
  }
}
// feather-edged wing pointing along local +x
function wing(c, x, y, len, wid, ang, fill, lw) {
  c.save(); c.translate(x, y); c.rotate(ang);
  P(c); c.moveTo(0, -wid * 0.5);
  c.quadraticCurveTo(len * 0.62, -wid * 0.95, len, -wid * 0.12);
  c.quadraticCurveTo(len * 0.9, wid * 0.32, len * 0.72, wid * 0.16);
  c.quadraticCurveTo(len * 0.62, wid * 0.55, len * 0.45, wid * 0.32);
  c.quadraticCurveTo(len * 0.3, wid * 0.62, 0, wid * 0.5);
  c.closePath(); fs(c, fill, lw === undefined ? 2.5 : lw);
  c.restore();
}
function glow(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col.replace('A', String(a))); g.addColorStop(1, col.replace('A', '0'));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}

/* ============================================================ heroes */
function drawDuckHero(c, x, y, t, o) {
  const img = IMG.duck; if (!img) return;
  o = o || {};
  const h = o.h || 100, s = h / img.height, w = img.width * s;
  const flap = Math.sin(t * (o.flapSpeed || 15));
  c.save(); c.translate(x, y); c.rotate(o.tilt || 0);
  // two wings behind the body, flapping like a bumblebee
  const a = lerp(-0.25, -1.15, (flap + 1) / 2);
  const wy = -h * 0.02, wx = w * 0.36;
  wing(c, wx, wy, h * 0.5, h * 0.24, a, '#f6d64a', h * 0.03);
  c.save(); c.scale(-1, 1); wing(c, wx, wy, h * 0.5, h * 0.24, a, '#ecc93c', h * 0.03); c.restore();
  c.drawImage(img, -w / 2, -h / 2, w, h);
  c.restore();
}
function drawCarpHero(c, x, y, t, o) {
  const body = IMG.carpBody, head = IMG.mishaHead; if (!body || !head) return;
  o = o || {};
  const bw = o.w || 150, s = bw / body.width, bh = body.height * s;
  const amp = o.amp === undefined ? 5 : o.amp, sp = o.swim || 9;
  c.save(); c.translate(x, y); c.rotate(o.tilt || 0);
  const x0 = -bw / 2, y0 = -bh / 2, N = 22, sw = body.width / N;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), k = Math.pow(1 - u, 1.7);
    const off = Math.sin(t * sp - u * 3.2) * amp * k;
    const sx = i * sw, sW = Math.min(sw + 1.5, body.width - sx);
    c.drawImage(body, sx, 0, sW, body.height, x0 + sx * s, y0 + off, sW * s, bh);
  }
  const hh = bw * 0.376, hs = hh / head.height, hw = head.width * hs;
  const hx = x0 + SPR.carp.head[0] * s - hw * 0.5, hy = y0 + SPR.carp.head[1] * s - hh * 0.55;
  c.translate(hx + hw / 2, hy + hh / 2);
  c.rotate(Math.sin(t * sp * 0.5) * 0.04);
  c.drawImage(head, -hw / 2, -hh / 2, hw, hh);
  c.restore();
}

/* ============================================================ player bullets */
function drawKnife(c, x, y, ang) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.globalAlpha = 0.35; c.fillStyle = '#fff'; c.fillRect(-40, -1.5, 22, 3); c.globalAlpha = 1;
  P(c); rr(c, -18, -3.3, 11, 6.6, 2.6); fs(c, '#7e4fa0', 1.8);
  P(c); c.rect(-8, -3.8, 3.2, 7.6); fs(c, '#eef1f5', 1.5);
  P(c); c.moveTo(-5, -4.2); c.lineTo(10, -3.8); c.quadraticCurveTo(17, -2.6, 20, 0.6); c.quadraticCurveTo(10, 4.4, -5, 3.8); c.closePath(); fs(c, '#d5dae2', 1.8);
  P(c); c.moveTo(-3, 2.3); c.quadraticCurveTo(9, 3, 16, 0.8); c.strokeStyle = '#fff'; c.lineWidth = 1.2; c.stroke();
  c.restore();
}
function drawBubble(c, x, y, r) {
  P(c); circ(c, x, y, r); c.fillStyle = 'rgba(170,240,255,0.25)'; c.fill();
  c.lineWidth = 2.2; c.strokeStyle = 'rgba(236,252,255,0.95)'; c.stroke();
  P(c); c.arc(x, y, r * 0.62, Math.PI * 1.1, Math.PI * 1.55); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
  P(c); circ(c, x + r * 0.38, y + r * 0.34, r * 0.13); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill();
}

/* ============================================================ enemy bullets */
function drawEB(c, b, t) {
  const x = b.x, y = b.y;
  switch (b.type) {
    case 'drop': {
      const a = Math.atan2(b.vy, b.vx);
      c.save(); c.translate(x, y); c.rotate(a);
      P(c); c.moveTo(9, 0); c.quadraticCurveTo(-2, -8, -7, 0); c.quadraticCurveTo(-2, 8, 9, 0); c.closePath();
      fs(c, '#2f6fd6', 3, '#ffffff'); P(c); circ(c, 1, -2, 1.6); c.fillStyle = '#cfe6ff'; c.fill();
      c.restore(); break;
    }
    case 'spike': {
      const a = Math.atan2(b.vy, b.vx);
      c.save(); c.translate(x, y); c.rotate(a);
      P(c); c.moveTo(10, 0); c.lineTo(-6, -4); c.lineTo(-3, 0); c.lineTo(-6, 4); c.closePath(); fs(c, '#ffd23f', 2);
      c.restore(); break;
    }
    case 'ink': {
      P(c); circ(c, x, y, b.r + 2); c.fillStyle = '#e9d7ff'; c.fill();
      P(c); circ(c, x, y, b.r); c.fillStyle = '#3d1f5c'; c.fill();
      P(c); circ(c, x - b.r * 0.3, y - b.r * 0.3, b.r * 0.3); c.fillStyle = '#b77ef0'; c.fill();
      break;
    }
    case 'pie': {
      c.save(); c.translate(x, y); c.rotate(b.rot);
      P(c); ell(c, 0, 0, 13, 9); fs(c, '#e9a548', 2.5);
      P(c); ell(c, 0, -2, 9, 4.5); c.fillStyle = '#f6c879'; c.fill();
      line(c, [-5, -1, -2, 2], 1.6, '#9a5b1e'); line(c, [0, -1, 3, 2], 1.6, '#9a5b1e'); line(c, [5, -1, 8, 2], 1.6, '#9a5b1e');
      c.restore(); break;
    }
    case 'carrot': {
      c.save(); c.translate(x, y); c.rotate(b.rot);
      P(c); c.moveTo(-10, -4); c.lineTo(10, 0); c.lineTo(-10, 4); c.closePath(); fs(c, '#ff8a1f', 2);
      line(c, [-10, 0, -15, -4], 2.5, '#3fa34d'); line(c, [-10, 0, -15, 3], 2.5, '#3fa34d');
      c.restore(); break;
    }
    case 'tomato': {
      P(c); circ(c, x, y, 7.5); fs(c, '#f0433a', 2.2);
      P(c); starPath(c, x, y - 5, 4, 1.6, 5); c.fillStyle = '#3fa34d'; c.fill();
      P(c); circ(c, x - 2.5, y - 1.5, 1.8); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill();
      break;
    }
    case 'slipper': {
      c.save(); c.translate(x, y); c.rotate(b.rot);
      P(c); ell(c, 0, 0, 15, 7.5); fs(c, '#ff6fa5', 2.5);
      P(c); c.moveTo(-3, -7); c.quadraticCurveTo(8, -9, 12, 0); c.quadraticCurveTo(8, 6, -3, 7); c.closePath(); fs(c, '#ffb3cf', 2);
      P(c); circ(c, 6, 0, 4.2); fs(c, '#fff', 1.8);
      c.restore(); break;
    }
    case 'smoke': {
      P(c); circ(c, x, y, b.r + 2); c.fillStyle = INK; c.fill();
      P(c); circ(c, x - 3, y + 1, b.r * 0.7); circ(c, x + 3, y - 2, b.r * 0.75); circ(c, x + 1, y + 3, b.r * 0.6); c.fillStyle = '#8d8f99'; c.fill();
      P(c); circ(c, x - 2, y - 3, b.r * 0.35); c.fillStyle = '#c9cbd3'; c.fill();
      break;
    }
    case 'light': {
      const a = Math.atan2(b.vy, b.vx);
      c.save(); c.translate(x, y); c.rotate(a);
      P(c); ell(c, 0, 0, 13, 5); c.fillStyle = '#ffe066'; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
      P(c); ell(c, 2, 0, 8, 2.2); c.fillStyle = '#fff'; c.fill();
      c.restore(); break;
    }
    case 'tire': {
      c.save(); c.translate(x, y); c.rotate(b.rot);
      P(c); circ(c, 0, 0, b.r); fs(c, '#26252b', 2.5);
      P(c); circ(c, 0, 0, b.r * 0.5); fs(c, '#b8bec8', 2);
      for (let k = 0; k < 4; k++) line(c, [0, 0, Math.cos(k * 1.57) * b.r * 0.45, Math.sin(k * 1.57) * b.r * 0.45], 1.6);
      c.restore(); break;
    }
    case 'note': {
      P(c); ell(c, x - 3, y + 4, 6, 4.5, -0.4); fs(c, b.col || '#ffd43b', 2);
      line(c, [x + 2, y + 3, x + 2, y - 12, x + 8, y - 8], 2.5);
      break;
    }
    case 'mud': {
      P(c); circ(c, x, y, b.r + 2); c.fillStyle = '#e8d8b0'; c.fill();
      P(c); circ(c, x, y, b.r); c.fillStyle = '#6b4a2b'; c.fill();
      P(c); circ(c, x - b.r * 0.3, y - b.r * 0.3, b.r * 0.3); c.fillStyle = '#9a7246'; c.fill();
      break;
    }
    case 'bombDrop': {
      P(c); circ(c, x, y, b.r); fs(c, '#2b2834', 2, '#fff');
      line(c, [x + 3, y - b.r + 1, x + 7, y - b.r - 5], 2, '#c9a24a');
      if (Math.random() < 0.7) { P(c); circ(c, x + 8, y - b.r - 6, 2.5); c.fillStyle = '#ffb347'; c.fill(); }
      break;
    }
    case 'charm': {
      drawBubble(c, x, y, b.r);
      P(c); heartPath(c, x, y + 1, 6); c.fillStyle = '#ff4d8d'; c.fill();
      break;
    }
    default: { // orb
      P(c); circ(c, x, y, b.r + 2); c.fillStyle = INK; c.fill();
      P(c); circ(c, x, y, b.r); c.fillStyle = b.col || '#ff2d55'; c.fill();
      P(c); circ(c, x - b.r * 0.15, y - b.r * 0.15, b.r * 0.48); c.fillStyle = '#fff'; c.fill();
    }
  }
}

/* ============================================================ pickups */
function drawCoffee(c, x, y, t, s) {
  c.save(); c.translate(x, y); c.scale(s || 1, s || 1);
  c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2.5;
  for (let i = 0; i < 2; i++) {
    P(c); const sx = -4 + i * 8; c.moveTo(sx, -25);
    for (let k = 1; k <= 3; k++) c.lineTo(sx + Math.sin(t * 6 + k + i * 2) * 2.5, -25 - k * 5);
    c.stroke();
  }
  P(c); c.moveTo(-13, -14); c.lineTo(13, -14); c.lineTo(10, 21); c.lineTo(-10, 21); c.closePath(); fs(c, '#fffaf0', 3);
  P(c); c.moveTo(-12.1, -3); c.lineTo(12.1, -3); c.lineTo(11, 11); c.lineTo(-11, 11); c.closePath(); fs(c, '#c08552', 2.5);
  P(c); heartPath(c, 0, 4, 4.4); c.fillStyle = '#fff6e5'; c.fill();
  P(c); rr(c, -15.5, -20, 31, 7, 3); fs(c, '#6b4a3a', 2.5);
  P(c); rr(c, -9, -24.5, 18, 5.5, 2.5); fs(c, '#7d5a48', 2.5);
  c.restore();
}
function drawBurger(c, x, y, t, s) {
  c.save(); c.translate(x, y); c.scale(s || 1, s || 1);
  P(c); rr(c, -20, 9, 40, 10, 5); fs(c, '#e09443', 2.5);
  P(c); rr(c, -21.5, 1, 43, 10, 5); fs(c, '#6b3b23', 2.5);
  P(c); c.moveTo(-21, 1); c.lineTo(21, 1); c.lineTo(17, 4.5); c.lineTo(9, 4.5); c.lineTo(5, 11); c.lineTo(1, 4.5); c.lineTo(-21, 4.5); c.closePath(); fs(c, '#ffd23f', 2);
  P(c); c.moveTo(-23, -1);
  for (let i = 0; i < 8; i++) c.quadraticCurveTo(-23 + i * 5.75 + 2.9, 5, -23 + (i + 1) * 5.75, -1);
  c.lineTo(23, -3); c.lineTo(-23, -3); c.closePath(); fs(c, '#5cc94a', 2);
  P(c); c.moveTo(-21, -2); c.bezierCurveTo(-21, -25, 21, -25, 21, -2); c.closePath(); fs(c, '#f0a24b', 3);
  P(c); ell(c, -8, -13, 5, 3, -0.3); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill();
  c.fillStyle = '#fff3d0';
  for (const [sx, sy, r] of [[-10, -9, 0.4], [-3, -14, -0.3], [5, -10, 0.5], [11, -6, -0.2], [2, -5, 0.2], [-14, -4, 0.6]]) { P(c); ell(c, sx, sy, 2.2, 1.2, r); c.fill(); }
  c.restore();
}
function drawPowerOrb(c, x, y, t, s) {
  c.save(); c.translate(x, y); const k = (s || 1) * (1 + Math.sin(t * 6) * 0.06); c.scale(k, k);
  P(c); circ(c, 0, 0, 15);
  const g = c.createRadialGradient(-4, -5, 2, 0, 0, 15); g.addColorStop(0, '#a6f2ff'); g.addColorStop(1, '#2a6bff');
  fs(c, g, 3);
  P(c); c.moveTo(2.5, -10.5); c.lineTo(-6.5, 2); c.lineTo(-0.5, 2); c.lineTo(-3.5, 11); c.lineTo(7, -2.5); c.lineTo(1, -2.5); c.closePath(); fs(c, '#ffe14d', 2);
  c.restore();
}
function drawStarPickup(c, x, y, t, s) {
  c.save(); c.translate(x, y); const k = (s || 1) * (1 + Math.sin(t * 6) * 0.06); c.scale(k, k);
  P(c); circ(c, 0, 0, 15);
  const g = c.createRadialGradient(-4, -5, 2, 0, 0, 15); g.addColorStop(0, '#ffd27a'); g.addColorStop(1, '#e8590c');
  fs(c, g, 3);
  c.rotate(Math.sin(t * 3) * 0.2);
  P(c); starPath(c, 0, 1, 10, 4.3); fs(c, '#fff6e5', 2);
  c.restore();
}
function drawPickupIcon(c, x, y, type, t, s) {
  if (type === 'coffee') drawCoffee(c, x, y, t, s);
  else if (type === 'burger') drawBurger(c, x, y, t, s);
  else if (type === 'power') drawPowerOrb(c, x, y, t, s);
  else if (type === 'bomb') drawStarPickup(c, x, y, t, s);
  else if (type === 'slow') drawClock(c, x, y, t, s);
  else if (type === 'charm') drawCharm(c, x, y, t, s);
}
function drawClock(c, x, y, t, s) {
  c.save(); c.translate(x, y); const k = (s || 1) * (1 + Math.sin(t * 6) * 0.05); c.scale(k, k);
  line(c, [-9, -15, -13, -19], 4); line(c, [9, -15, 13, -19], 4);
  P(c); circ(c, 0, 0, 16); fs(c, '#4dabf7', 3);
  P(c); circ(c, 0, 0, 11.5); fs(c, '#fff', 1.5);
  for (let i = 0; i < 12; i += 3) { const a = (i / 12) * TAU; line(c, [Math.cos(a) * 8.5, Math.sin(a) * 8.5, Math.cos(a) * 10.5, Math.sin(a) * 10.5], 1.6); }
  line(c, [0, 0, Math.cos(t * 0.8 - 1.57) * 6, Math.sin(t * 0.8 - 1.57) * 6], 2.2);
  line(c, [0, 0, Math.cos(t * 4 - 1.57) * 9, Math.sin(t * 4 - 1.57) * 9], 1.5, '#e63946');
  c.restore();
}
function drawCharm(c, x, y, t, s) {
  c.save(); c.translate(x, y); const k = (s || 1) * (1 + Math.sin(t * 7) * 0.08); c.scale(k, k);
  P(c); circ(c, 0, 0, 16); c.fillStyle = 'rgba(255,170,215,0.55)'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke();
  P(c); heartPath(c, 0, 1, 9); fs(c, '#ff4d8d', 2.2);
  P(c); c.arc(-3, -3, 10, Math.PI * 1.1, Math.PI * 1.5); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
  c.restore();
}

/* ============================================================ enemies (all face left; origin = centre) */
const ART = {
  pigeon(c, e, t) {
    const f = (Math.sin(t * 16 + e.seed * 7) + 1) / 2;
    P(c); c.moveTo(10, -2); c.lineTo(28, -8); c.lineTo(30, 3); c.lineTo(12, 6); c.closePath(); fs(c, '#7b8596', 2.5);
    wing(c, 6, -6, 24, 11, lerp(-2.0, -0.5, f), '#8a94a6');
    P(c); ell(c, 0, 0, 17, 11.5); fs(c, '#a7b0bf', 3);
    P(c); ell(c, -2, 4.5, 11, 5); c.fillStyle = '#c3cad6'; c.fill();
    P(c); ell(c, -10, -1, 5.5, 4.5, 0.4); c.fillStyle = '#5fbf9a'; c.fill();
    P(c); ell(c, -7, 2, 4, 3, 0.4); c.fillStyle = '#a06bc9'; c.fill();
    P(c); circ(c, -15, -7, 8.5); fs(c, '#77829a', 3);
    P(c); c.moveTo(-22, -9); c.lineTo(-30, -5.5); c.lineTo(-22, -3.5); c.closePath(); fs(c, '#e8a33d', 2);
    eye(c, -17, -9, 3.3, -0.3, 0.1, 1, '#c0392b');
    wing(c, 4, -4, 26, 12, lerp(-2.2, -0.2, f), '#b9c1cd');
  },
  plane(c, e, t) {
    const roll = Math.sin(t * 5 + e.seed * 3);
    c.scale(1, 1 - Math.abs(roll) * 0.35);
    P(c); c.moveTo(-26, 0); c.lineTo(18, 10); c.lineTo(9, 2); c.closePath(); fs(c, '#c9d6e6', 2.4);
    P(c); c.moveTo(-26, 0); c.lineTo(9, 2); c.lineTo(13, 8); c.closePath(); fs(c, '#e3ecf6', 2.2);
    P(c); c.moveTo(-26, 0); c.lineTo(21, -13); c.lineTo(9, 2); c.closePath(); fs(c, '#ffffff', 2.4);
    line(c, [-9, -6, -3, -3.2], 2);
    P(c); circ(c, -5, -1.5, 1.5); c.fillStyle = INK; c.fill();
    line(c, [2, -10, 9, -12], 1.3, '#9fb3c8'); line(c, [4, -7, 12, -9], 1.3, '#9fb3c8');
  },
  crow(c, e, t) {
    const f = (Math.sin(t * 13 + e.seed * 5) + 1) / 2;
    P(c); c.moveTo(12, -2); c.lineTo(33, -10); c.lineTo(30, -1); c.lineTo(35, 6); c.lineTo(13, 7); c.closePath(); fs(c, '#2b2834', 2.5);
    wing(c, 6, -6, 28, 13, lerp(-2.1, -0.3, f), '#3a3646');
    P(c); ell(c, 0, 0, 19, 12.5); fs(c, '#363142', 3);
    P(c); circ(c, -17, -7, 10.5); fs(c, '#363142', 3);
    P(c); c.moveTo(-25, -11); c.lineTo(-40, -4); c.lineTo(-25, -2); c.closePath(); fs(c, '#55525f', 2.2);
    eye(c, -19, -9, 3.8, -0.3, 0.1, 1.3, '#e63946');
    P(c); ell(c, -4, -6, 8, 3, -0.2); c.fillStyle = 'rgba(150,120,220,.35)'; c.fill();
    wing(c, 4, -4, 30, 14, lerp(-2.2, -0.1, f), '#46405a');
  },
  drone(c, e, t) {
    tube(c, [-23, -10, 23, -10], 3, '#6c7486');
    for (const sx of [-23, 23]) {
      P(c); c.rect(sx - 1.6, -16, 3.2, 6); fs(c, '#555c6b', 1.5);
      P(c); ell(c, sx, -17, 13, 3.2); c.fillStyle = 'rgba(230,236,245,0.55)'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(34,29,46,0.5)'; c.stroke();
      const k = Math.sin(t * 45 + sx); line(c, [sx - 12 * k, -17, sx + 12 * k, -17], 2);
    }
    P(c); rr(c, -16, -12, 32, 19, 7); fs(c, '#3d4352', 3);
    P(c); rr(c, -12, -9.5, 24, 5, 2.5); c.fillStyle = '#5c6577'; c.fill();
    line(c, [-9, 7, -12, 14], 2.5); line(c, [9, 7, 12, 14], 2.5);
    const ch = e.charge || 0;
    if (ch > 0) glow(c, -5, -1, 12 + ch * 10, 'rgba(255,45,85,A)', 0.55 * ch);
    P(c); circ(c, -4, -1, 6.5); fs(c, '#11131a', 2);
    P(c); circ(c, -5, -1, 3.3 + ch * 1.6); c.fillStyle = ch > 0 ? '#ff2d55' : '#ff7a8f'; c.fill();
    if ((t * 2 + e.seed) % 1 < 0.5) { P(c); circ(c, 11, -13, 2); c.fillStyle = '#7CFC00'; c.fill(); }
  },
  cloud(c, e, t) {
    const pf = [[-44, 10, 25], [-20, -12, 31], [14, -17, 30], [43, 0, 27], [16, 18, 29], [-22, 21, 24], [38, 24, 20]];
    const breathe = 1 + Math.sin(t * 2) * 0.03;
    c.scale(breathe, 1 / breathe);
    P(c); for (const [x, y, r] of pf) circ(c, x, y, r + 3.5); c.fillStyle = INK; c.fill();
    P(c); for (const [x, y, r] of pf) circ(c, x, y, r); c.fillStyle = e.hp < e.maxHp * 0.4 ? '#6d6889' : '#8a93ab'; c.fill();
    P(c); for (const [x, y, r] of pf) circ(c, x - r * 0.18, y - r * 0.32, r * 0.55); c.fillStyle = 'rgba(255,255,255,0.2)'; c.fill();
    eye(c, -16, -1, 8, 0.05, 0.2, -1.1);
    eye(c, 12, -2, 8, -0.05, 0.2, 1.1);
    P(c); c.moveTo(-14, 19); c.quadraticCurveTo(-2, 10, 10, 19); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
    if (Math.sin(t * 9 + e.seed) > 0.7) {
      P(c); c.moveTo(-6, 34); c.lineTo(-14, 52); c.lineTo(-6, 52); c.lineTo(-12, 70); c.lineTo(4, 46); c.lineTo(-3, 46); c.lineTo(2, 34); c.closePath(); fs(c, '#ffe14d', 2.5);
    }
  },
  balloon(c, e, t) {
    c.translate(0, -22); c.rotate(Math.sin(t * 2 + e.seed) * 0.1);
    P(c); c.moveTo(0, 21); c.quadraticCurveTo(6, 31, 0, 40); c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke();
    drawPickupIcon(c, 0, 52, e.drop, t, 0.85);
    P(c); ell(c, 0, -2, 17, 21.5); fs(c, '#ff4d6d', 3);
    P(c); ell(c, -6, -10, 4, 7.5, 0.4); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill();
    P(c); c.moveTo(-3.5, 19); c.lineTo(3.5, 19); c.lineTo(0, 23.5); c.closePath(); fs(c, '#ff4d6d', 2);
  },
  gull(c, e, t) {
    const f = (Math.sin(t * 12 + e.seed) + 1) / 2;
    P(c); c.moveTo(12, -1); c.lineTo(29, -6); c.lineTo(28, 4); c.lineTo(12, 6); c.closePath(); fs(c, '#d9dee5', 2.5);
    wing(c, 4, -5, 36, 12, lerp(-2.3, -0.2, f), '#9aa6b3');
    P(c); ell(c, 0, 0, 18, 10.5); fs(c, '#f7f7f2', 3);
    P(c); circ(c, -15, -6, 8.5); fs(c, '#f7f7f2', 3);
    P(c); c.moveTo(-22, -8); c.lineTo(-35, -5); c.lineTo(-22, -2); c.closePath(); fs(c, '#ffc93c', 2);
    P(c); circ(c, -31, -4.6, 1.7); c.fillStyle = '#e63946'; c.fill();
    eye(c, -17, -8, 3.3, -0.3, 0.1, 1);
    wing(c, 2, -3, 38, 13, lerp(-2.4, -0.05, f), '#c3ccd6');
  },
  /* ---- underwater */
  piranha(c, e, t) {
    const w = Math.sin(t * 12 + e.seed * 4);
    c.save(); c.translate(16, 0); c.rotate(w * 0.35);
    P(c); c.moveTo(0, 0); c.lineTo(14, -11); c.lineTo(10, 0); c.lineTo(14, 11); c.closePath(); fs(c, '#4e5d78', 2.5);
    c.restore();
    P(c); c.moveTo(-4, -11); c.lineTo(7, -19); c.lineTo(11, -9); c.closePath(); fs(c, '#4e5d78', 2.2);
    P(c); ell(c, 0, 0, 19, 13.5); fs(c, '#62739a', 3);
    c.save(); P(c); ell(c, 0, 0, 17.5, 12); c.clip(); P(c); c.rect(-20, 2, 40, 14); c.fillStyle = '#ff5a3c'; c.fill(); c.restore();
    P(c); c.moveTo(-17, 3); c.lineTo(-23, 8.5); c.lineTo(-11, 9.5); c.closePath(); fs(c, '#62739a', 2);
    P(c); c.moveTo(-19, 3.5); c.lineTo(-17.5, 7); c.lineTo(-16, 3.5); c.lineTo(-14.5, 7); c.lineTo(-13, 3.5); c.closePath(); fs(c, '#fff', 1);
    eye(c, -9, -4, 4.2, -0.3, 0.1, 1.1, '#c0392b');
    P(c); ell(c, 2, 4, 5, 3, 0.6 + w * 0.2); fs(c, '#4e5d78', 1.8);
  },
  jelly(c, e, t) {
    const p = Math.sin(t * 4 + e.seed * 2);
    for (let i = 0; i < 5; i++) {
      const x0 = -12 + i * 6, pts = [x0, 5];
      for (let k = 1; k <= 4; k++) pts.push(x0 + Math.sin(t * 5 + i + k * 1.3) * 3.2, 5 + k * 7.5);
      tube(c, pts, 2.4, '#ff9fd6');
    }
    c.save(); c.scale(1 + p * 0.08, 1 - p * 0.1);
    P(c); c.moveTo(-19, 6); c.bezierCurveTo(-19, -24, 19, -24, 19, 6);
    c.quadraticCurveTo(12.5, 10, 6.5, 6); c.quadraticCurveTo(0, 10, -6.5, 6); c.quadraticCurveTo(-12.5, 10, -19, 6); c.closePath();
    fs(c, 'rgba(255,128,196,0.93)', 3);
    P(c); ell(c, -7, -9, 4, 6.5, 0.5); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
    eye(c, -6, -2, 3.2, 0, 0.15, -1.2); eye(c, 6, -2, 3.2, 0, 0.15, 1.2);
    c.restore();
  },
  shark(c, e, t) {
    const w = Math.sin(t * 10 + e.seed * 3);
    c.save(); c.translate(30, 0); c.rotate(w * 0.25);
    P(c); c.moveTo(0, -3); c.lineTo(17, -17); c.lineTo(11, 0); c.lineTo(15, 12); c.lineTo(0, 3); c.closePath(); fs(c, '#7d8fa6', 2.5);
    c.restore();
    P(c); c.moveTo(-3, -12); c.lineTo(8, -28); c.lineTo(15, -10); c.closePath(); fs(c, '#7d8fa6', 2.5);
    P(c); c.moveTo(-39, 2); c.quadraticCurveTo(-31, -14, 0, -13.5); c.quadraticCurveTo(24, -12, 32, -2); c.quadraticCurveTo(24, 10, 0, 11.5); c.quadraticCurveTo(-29, 12.5, -39, 2); c.closePath();
    fs(c, '#93a4ba', 3);
    c.save(); P(c); c.moveTo(-39, 2); c.quadraticCurveTo(-31, -14, 0, -13.5); c.quadraticCurveTo(24, -12, 32, -2); c.quadraticCurveTo(24, 10, 0, 11.5); c.quadraticCurveTo(-29, 12.5, -39, 2); c.closePath(); c.clip();
    P(c); ell(c, -6, 11, 30, 8); c.fillStyle = '#eef3f8'; c.fill(); c.restore();
    for (let k = 0; k < 3; k++) { P(c); c.moveTo(-15 + k * 4, -5); c.quadraticCurveTo(-12.5 + k * 4, 0, -15 + k * 4, 5); c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke(); }
    P(c); c.moveTo(-35, 4); c.quadraticCurveTo(-27, 9, -19, 5); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#fff';
    for (let k = 0; k < 4; k++) { P(c); c.moveTo(-33 + k * 3.5, 5.3); c.lineTo(-31.3 + k * 3.5, 8.6); c.lineTo(-29.6 + k * 3.5, 6); c.closePath(); c.fill(); }
    eye(c, -25, -4, 3.8, -0.3, 0.1, 1.3);
    P(c); c.moveTo(-8, 7); c.lineTo(-1, 17); c.lineTo(4, 8); c.closePath(); fs(c, '#7d8fa6', 2);
  },
  puffer(c, e, t) {
    const inf = e.charge || 0, R = 17 + inf * 5;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + e.seed, x = Math.cos(a), y = Math.sin(a), L = R + 6 + inf * 4;
      P(c); c.moveTo(x * (R - 2) - y * 3, y * (R - 2) + x * 3); c.lineTo(x * L, y * L); c.lineTo(x * (R - 2) + y * 3, y * (R - 2) - x * 3); c.closePath(); fs(c, '#f2b632', 1.8);
    }
    P(c); c.moveTo(R - 2, 0); c.lineTo(R + 11, -9); c.lineTo(R + 11, 9); c.closePath(); fs(c, '#f2b632', 2.2);
    P(c); circ(c, 0, 0, R); fs(c, '#ffd23f', 3);
    P(c); ell(c, -2, R * 0.42, R * 0.7, R * 0.38); c.fillStyle = '#fff1b8'; c.fill();
    c.fillStyle = '#e6a91a'; P(c); circ(c, 6, -R * 0.5, 2.6); circ(c, R * 0.55, 3, 2.1); circ(c, 2, -R * 0.15, 1.8); c.fill();
    eye(c, -R * 0.45, -R * 0.3, 4.8 + inf, -0.3, 0.1, 1.2);
    P(c); ell(c, -R + 1.5, R * 0.18, 3.3, 2.7); fs(c, '#ff7b7b', 2);
  },
  octo(c, e, t) {
    for (let i = 0; i < 6; i++) {
      const x0 = -32 + i * 12.8, ph = t * 3 + i * 1.1;
      tube(c, [x0, 20, x0 + Math.sin(ph) * 12, 40, x0 + Math.sin(ph + 1) * 16, 56, x0 + Math.sin(ph + 2) * 10 - 6, 70], 9, '#9b59d0');
    }
    P(c); c.moveTo(-44, 22); c.bezierCurveTo(-54, -44, 54, -44, 44, 22); c.quadraticCurveTo(0, 34, -44, 22); c.closePath();
    fs(c, e.hp < e.maxHp * 0.4 ? '#c0508f' : '#a964dd', 3.5);
    c.fillStyle = 'rgba(255,255,255,.18)'; P(c); ell(c, -18, -22, 12, 7, -0.4); c.fill();
    c.fillStyle = '#8b45c2'; P(c); circ(c, 22, -16, 4); circ(c, 30, -2, 3); circ(c, -30, -6, 3.5); c.fill();
    eye(c, -15, 3, 9, 0.05, 0.2, -1.1); eye(c, 15, 3, 9, -0.05, 0.2, 1.1);
    P(c); ell(c, 0, 20, 6, 4.5); fs(c, '#6d2f9c', 2.5);
  },
  chest(c, e, t) {
    if (e.y > 40) glow(c, 0, -6, 46, 'rgba(255,230,120,A)', 0.35 + Math.sin(t * 5) * 0.12);
    P(c); rr(c, -23, -6, 46, 26, 4); fs(c, '#a0632f', 3);
    line(c, [-23, 6, 23, 6], 1.6, '#7b4520');
    P(c); c.moveTo(-23, -6); c.quadraticCurveTo(0, -25, 23, -6); c.closePath(); fs(c, '#b8743a', 3);
    P(c); c.rect(-17, -13, 6, 33); c.rect(11, -13, 6, 33); fs(c, '#ffcf4a', 2);
    P(c); rr(c, -4.5, -5, 9, 10, 2); fs(c, '#ffcf4a', 2);
    drawPickupIcon(c, 0, -38 + Math.sin(t * 3) * 3, e.drop, t, 0.75);
  },
  hook(c, e, t) {
    // fishing line from above the water
    line(c, [0, -e.y - 20, 0, -18], 1.6, 'rgba(25,25,35,0.8)');
    tube(c, [0, -18, 0, 9], 2.6, '#d6dde6');
    P(c); c.arc(-7, 9, 7, 0, Math.PI, false); c.lineWidth = 6.6; c.strokeStyle = INK; c.lineCap = 'round'; c.stroke(); c.lineWidth = 2.6; c.strokeStyle = '#d6dde6'; c.stroke();
    tube(c, [-14, 9, -14, 2, -10, 5], 2.2, '#d6dde6');
    // worm
    const w = Math.sin(t * 7);
    tube(c, [-2, 2, 3 + w * 2, 7, -1, 12, 3 - w * 2, 16, 0, 21], 5, '#ff8fa3');
    P(c); circ(c, 0, -18, 3); fs(c, '#9aa4b1', 1.5);
  },
};

/* ============================================================ bosses */
// Face photo (when provided later) or a drawn face
function photoFace(c, img, cx, cy, r) {
  c.save(); P(c); circ(c, cx, cy, r); c.clip();
  const s = (r * 2.15) / Math.min(img.width, img.height);
  c.drawImage(img, cx - (img.width * s) / 2, cy - (img.height * s) / 2, img.width * s, img.height * s);
  c.restore();
}

function drawGranny(c, b, t) {
  const angry = b.phase2;
  const fl = 1 + Math.sin(t * 31) * 0.12 + Math.random() * 0.06;
  // jet flame under the scooter
  c.save(); c.translate(94, 86); c.rotate(0.35);
  P(c); c.moveTo(0, -9); c.quadraticCurveTo(26 * fl, -12, 46 * fl, 0); c.quadraticCurveTo(26 * fl, 12, 0, 9); c.closePath(); c.fillStyle = '#ff7b1a'; c.fill();
  P(c); c.moveTo(0, -5); c.quadraticCurveTo(15 * fl, -6, 26 * fl, 0); c.quadraticCurveTo(15 * fl, 6, 0, 5); c.closePath(); c.fillStyle = '#ffe066'; c.fill();
  c.restore();
  // wheels, deck, booster
  const wheel = (x) => { P(c); circ(c, x, 98, 14); fs(c, '#2b2b33', 3); P(c); circ(c, x, 98, 5.5); fs(c, '#b8bec8', 2); };
  wheel(68);
  P(c); rr(c, 42, 82, 54, 15, 7); fs(c, '#c0c6cf', 3);
  P(c); c.rect(56, 83.5, 8, 12); c.fillStyle = '#e63946'; c.fill();
  P(c); rr(c, -76, 74, 158, 14, 7); fs(c, '#343a48', 3);
  wheel(-66);
  tube(c, [-66, 98, -82, -34], 5, '#d0d6de');
  // string bag swinging on the handlebar
  c.save(); c.translate(-80, -36); c.rotate(Math.sin(t * 2.4) * 0.22 + (b.swing || 0));
  line(c, [-6, 0, -12, 18], 1.6); line(c, [6, 0, 12, 18], 1.6);
  P(c); c.moveTo(-14, 16); c.quadraticCurveTo(-20, 50, 0, 54); c.quadraticCurveTo(20, 50, 14, 16); c.closePath();
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.fill();
  P(c); ell(c, 9, 10, 4.5, 15, 0.35); fs(c, '#e3b26b', 2.5);
  P(c); circ(c, -6, 36, 8); fs(c, '#ff9f1a', 2.5); P(c); circ(c, 6, 41, 8); fs(c, '#ff9f1a', 2.5); P(c); circ(c, -1, 26, 7.5); fs(c, '#ffc23f', 2.5);
  c.save(); P(c); c.moveTo(-14, 16); c.quadraticCurveTo(-20, 50, 0, 54); c.quadraticCurveTo(20, 50, 14, 16); c.closePath(); c.clip();
  c.strokeStyle = 'rgba(34,29,46,0.75)'; c.lineWidth = 1.3;
  for (let k = -30; k < 40; k += 7) { P(c); c.moveTo(k, 10); c.lineTo(k + 30, 60); c.moveTo(k + 30, 10); c.lineTo(k, 60); c.stroke(); }
  c.restore();
  P(c); c.moveTo(-14, 16); c.quadraticCurveTo(-20, 50, 0, 54); c.quadraticCurveTo(20, 50, 14, 16); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
  c.restore();
  tube(c, [-98, -36, -66, -40], 4, '#d0d6de');
  P(c); rr(c, -106, -42, 12, 9, 3); fs(c, '#2b2b33', 2);
  // granny (leans forward)
  c.save(); c.translate(10, 74); c.rotate(-0.12); c.translate(-10, -74);
  // scarf tails flutter behind the head
  const fw = Math.sin(t * 9);
  for (let i = 0; i < 2; i++) {
    P(c); c.moveTo(4, -36 + i * 5);
    c.quadraticCurveTo(26, -44 + fw * 5 + i * 6, 46, -36 + fw * 8 + i * 9);
    c.lineTo(44, -28 + fw * 8 + i * 9);
    c.quadraticCurveTo(24, -34 + fw * 5 + i * 6, 4, -30 + i * 5); c.closePath(); fs(c, '#e63946', 2.5);
  }
  tube(c, [3, 34, -2, 70], 7, '#b98b5e'); tube(c, [19, 34, 22, 70], 7, '#b98b5e');
  P(c); rr(c, -14, 64, 19, 11, 5); fs(c, '#6c6f78', 2.5); P(c); rr(c, 13, 64, 19, 11, 5); fs(c, '#6c6f78', 2.5);
  tube(c, [24, -24, 0, -18, -62, -40], 9, '#6f2d38');
  P(c); c.moveTo(-18, -26); c.quadraticCurveTo(5, -38, 30, -27); c.lineTo(44, 46); c.quadraticCurveTo(8, 54, -30, 46); c.closePath();
  fs(c, angry ? '#a33340' : '#8e3b46', 3);
  P(c); c.moveTo(14, -30); c.lineTo(30, -27); c.lineTo(44, 46); c.lineTo(22, 50); c.closePath(); c.fillStyle = 'rgba(0,0,0,0.13)'; c.fill();
  c.fillStyle = '#ffcf4a';
  for (const by of [-10, 9, 28]) { P(c); circ(c, -13 + by * 0.12, by, 3.3); c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke(); }
  P(c); ell(c, 5, -30, 22, 8); fs(c, '#efe3cf', 2.5);
  tube(c, [-6, -22, -32, -26, -70, -42], 9, '#8e3b46');
  P(c); circ(c, -72, -42, 6.5); fs(c, '#f2c4a0', 2.5);
  // head: scarf + face
  const hx = 2, hy = -64, R = 27;
  P(c); circ(c, hx, hy - 2, R + 8); fs(c, '#e63946', 3);
  if (IMG.grannyFace) {
    photoFace(c, IMG.grannyFace, hx, hy + 2, R);
    P(c); circ(c, hx, hy + 2, R); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
  } else {
    P(c); circ(c, hx, hy + 2, R); fs(c, angry ? '#f6b39a' : '#f4cfb0', 2.5);
    P(c); circ(c, hx - 15, hy + 10, 5); circ(c, hx + 15, hy + 10, 5); c.fillStyle = 'rgba(255,120,120,.45)'; c.fill();
    // glasses
    P(c); circ(c, hx - 10, hy - 1, 8); circ(c, hx + 10, hy - 1, 8); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill(); c.lineWidth = 2.3; c.strokeStyle = INK; c.stroke();
    line(c, [hx - 2, hy - 1, hx + 2, hy - 1], 2.3);
    P(c); circ(c, hx - 11, hy, 2.6); circ(c, hx + 9, hy, 2.6); c.fillStyle = INK; c.fill();
    line(c, [hx - 18, hy - 12 - (angry ? 2 : 0), hx - 4, hy - 9], 3); line(c, [hx + 18, hy - 12 - (angry ? 2 : 0), hx + 4, hy - 9], 3);
    P(c); circ(c, hx, hy + 8, 3.6); fs(c, '#e8b08f', 2);
    P(c); c.moveTo(hx - 8, hy + 18); c.quadraticCurveTo(hx, hy + (angry ? 12 : 14), hx + 8, hy + 18); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    line(c, [hx - 21, hy - 3, hx - 25, hy - 6], 1.5); line(c, [hx + 21, hy - 3, hx + 25, hy - 6], 1.5);
  }
  // scarf front edge + polka dots + knot
  P(c); c.arc(hx, hy + 2, R + 1, Math.PI * 1.08, Math.PI * 1.92); c.arc(hx, hy - 8, R + 9, Math.PI * 1.9, Math.PI * 1.1, true); c.closePath(); fs(c, '#e63946', 2.5);
  c.fillStyle = '#fff6e5';
  for (const [dx, dy] of [[-22, -18], [-8, -28], [8, -29], [22, -19], [-30, 0], [30, 0], [0, -36], [-17, -33], [17, -33]]) { P(c); circ(c, hx + dx, hy + dy, 2.3); c.fill(); }
  P(c); circ(c, hx + 2, hy + R + 4, 5.5); fs(c, '#e63946', 2.5);
  if (angry) for (let i = 0; i < 2; i++) {
    const k = (t * 1.6 + i * 0.5) % 1;
    P(c); circ(c, hx - 24 + i * 48, hy - 40 - k * 32, 6 + k * 8); c.fillStyle = 'rgba(255,255,255,' + (0.75 * (1 - k)).toFixed(2) + ')'; c.fill();
  }
  c.restore();
}

function drawPike(c, b, t) {
  const angry = b.phase2;
  const m = b.mouth || 0;
  const w = Math.sin(t * 5);
  const fin = angry ? '#e0452b' : '#d0582f';
  c.save(); c.translate(128, 0); c.rotate(w * 0.14);
  P(c); c.moveTo(0, -7); c.lineTo(42, -48); c.lineTo(32, 0); c.lineTo(44, 48); c.lineTo(0, 7); c.closePath(); fs(c, fin, 3.5);
  line(c, [8, -4, 34, -36], 1.5, 'rgba(0,0,0,.25)'); line(c, [8, 4, 36, 36], 1.5, 'rgba(0,0,0,.25)');
  c.restore();
  P(c); c.moveTo(58, -44); c.lineTo(84, -82); c.lineTo(112, -36); c.closePath(); fs(c, fin, 3);
  P(c); c.moveTo(66, 40); c.lineTo(92, 70); c.lineTo(110, 33); c.closePath(); fs(c, fin, 3);
  if (m > 0.05) { P(c); c.moveTo(-72, 4); c.lineTo(-150, 4); c.lineTo(-150, 4 + m * 30); c.lineTo(-72, 14); c.closePath(); c.fillStyle = '#7a1f2b'; c.fill(); }
  // lower jaw (opens)
  c.save(); c.translate(-72, 6); c.rotate(-m * 0.42);
  P(c); c.moveTo(0, -2); c.lineTo(-84, -2); c.quadraticCurveTo(-88, 10, -76, 14); c.lineTo(0, 22); c.closePath(); fs(c, '#bfc58a', 3);
  c.fillStyle = '#fff';
  for (let k = 0; k < 7; k++) { P(c); c.moveTo(-80 + k * 11, -1); c.lineTo(-75 + k * 11, -11); c.lineTo(-70 + k * 11, -1); c.closePath(); c.fill(); c.lineWidth = 1.3; c.strokeStyle = INK; c.stroke(); }
  c.restore();
  // body
  const body = () => { P(c); c.moveTo(-154, 4); c.quadraticCurveTo(-130, -22, -62, -44); c.quadraticCurveTo(30, -60, 112, -34); c.lineTo(132, -8); c.lineTo(132, 8); c.lineTo(112, 34); c.quadraticCurveTo(30, 54, -62, 42); c.lineTo(-72, 8); c.lineTo(-154, 8); c.closePath(); };
  body(); fs(c, angry ? '#7d7a2e' : '#5f7d32', 3.5);
  c.save(); body(); c.clip();
  P(c); ell(c, -10, 40, 130, 30); c.fillStyle = '#d9d6a0'; c.fill();
  c.fillStyle = 'rgba(214,226,140,0.75)';
  for (const [sx, sy] of [[-20, -26], [10, -32], [40, -24], [70, -30], [-4, -10], [30, -6], [60, -10], [90, -14], [-36, -6]]) { P(c); ell(c, sx, sy, 7, 4, 0.3); c.fill(); }
  c.restore();
  // upper teeth
  c.fillStyle = '#fff';
  for (let k = 0; k < 7; k++) { P(c); c.moveTo(-150 + k * 11, 7); c.lineTo(-145 + k * 11, 17); c.lineTo(-140 + k * 11, 7); c.closePath(); c.fill(); c.lineWidth = 1.3; c.strokeStyle = INK; c.stroke(); }
  P(c); c.moveTo(-46, -34); c.quadraticCurveTo(-28, 0, -46, 34); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  P(c); c.moveTo(-40, 26); c.lineTo(-20, 58 + w * 4); c.lineTo(-6, 30); c.closePath(); fs(c, fin, 3);
  if (IMG.pikeFace) {
    photoFace(c, IMG.pikeFace, -92, -12, 34);
    P(c); circ(c, -92, -12, 34); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    line(c, [-120, -44, -76, -34], 6);
  } else {
    P(c); circ(c, -86, -20, 14); fs(c, '#ffe14d', 3);
    P(c); circ(c, -90, -18, 6.5); c.fillStyle = angry ? '#ff1f3d' : '#d62839'; c.fill();
    P(c); circ(c, -92, -20, 2.2); c.fillStyle = '#fff'; c.fill();
    P(c); c.moveTo(-108, -30); c.lineTo(-64, -40); c.lineTo(-66, -32); c.lineTo(-104, -24); c.closePath(); fs(c, '#2f3a1a', 2);
    line(c, [-118, -8, -112, -2], 2); line(c, [-60, -10, -52, -6], 2);
  }
  // nostril + angry bubbles
  P(c); circ(c, -138, -6, 2.4); c.fillStyle = INK; c.fill();
  if (angry) for (let i = 0; i < 3; i++) { const k = (t * 1.2 + i / 3) % 1; drawBubble(c, -50 + i * 6, -40 - k * 70, 3 + k * 4); }
}

/* ============================================================ level 2 enemies */
Object.assign(ART, {
  wasp(c, e, t) {
    const f = Math.sin(t * 45 + e.seed);
    P(c); ell(c, 4, -10, 9, 3.5 + f * 2, -0.5); c.fillStyle = 'rgba(230,242,255,0.75)'; c.fill(); c.lineWidth = 1.3; c.strokeStyle = INK; c.stroke();
    P(c); ell(c, -3, -10, 8, 3 + f * 2, 0.4); c.fillStyle = 'rgba(230,242,255,0.75)'; c.fill(); c.stroke();
    P(c); c.moveTo(16, 1); c.lineTo(24, 3); c.lineTo(16, 5); c.closePath(); fs(c, INK, 1);
    P(c); ell(c, 6, 2, 11, 7.5); fs(c, '#ffd23f', 2.5);
    c.save(); P(c); ell(c, 6, 2, 10, 6.5); c.clip(); c.fillStyle = INK; c.fillRect(3, -8, 3.5, 20); c.fillRect(10, -8, 3.5, 20); c.restore();
    P(c); circ(c, -8, 0, 6.5); fs(c, '#3a3646', 2.5);
    eye(c, -9, -1.5, 2.8, -0.3, 0.1, 1.2, '#e63946');
  },
  rocket(c, e, t) {
    const fl = 0.8 + Math.random() * 0.4;
    P(c); c.moveTo(18, -4); c.lineTo(18 + 22 * fl, 0); c.lineTo(18, 4); c.closePath(); c.fillStyle = '#ffb347'; c.fill();
    P(c); c.moveTo(18, -2); c.lineTo(18 + 12 * fl, 0); c.lineTo(18, 2); c.closePath(); c.fillStyle = '#fff3b0'; c.fill();
    P(c); c.moveTo(12, -6); c.lineTo(22, -14); c.lineTo(20, -5); c.closePath(); fs(c, '#4dabf7', 2);
    P(c); c.moveTo(12, 6); c.lineTo(22, 14); c.lineTo(20, 5); c.closePath(); fs(c, '#4dabf7', 2);
    P(c); rr(c, -18, -7, 38, 14, 4); fs(c, '#e63946', 2.5);
    c.fillStyle = '#fff'; c.fillRect(-6, -6, 4, 12); c.fillRect(6, -6, 4, 12);
    P(c); c.moveTo(-18, -7); c.lineTo(-32, 0); c.lineTo(-18, 7); c.closePath(); fs(c, '#ffd43b', 2.5);
    eye(c, -11, -1, 2.6, -0.3, 0.1, 1.1);
  },
  blimp(c, e, t) {
    P(c); c.moveTo(56, -14); c.lineTo(86, -34); c.lineTo(80, -6); c.closePath(); fs(c, '#e63946', 3);
    P(c); c.moveTo(56, 14); c.lineTo(86, 34); c.lineTo(80, 6); c.closePath(); fs(c, '#e63946', 3);
    const pr = Math.sin(t * 40);
    P(c); ell(c, 90, 0, 3, 16 * Math.abs(pr) + 2); fs(c, 'rgba(230,236,245,0.8)', 1.5);
    P(c); rr(c, -24, 24, 48, 15, 5); fs(c, '#5c6577', 3);
    c.fillStyle = '#ffcf70'; for (let i = 0; i < 3; i++) c.fillRect(-17 + i * 13, 28, 8, 6);
    P(c); ell(c, 0, 0, 74, 31); fs(c, '#c5ccd6', 3.5);
    c.save(); P(c); ell(c, 0, 0, 72, 29); c.clip(); c.fillStyle = '#e63946'; c.fillRect(-80, 6, 160, 8);
    c.strokeStyle = 'rgba(34,29,46,0.25)'; c.lineWidth = 1.5; for (let k = -50; k <= 50; k += 25) { P(c); c.moveTo(k, -32); c.quadraticCurveTo(k - 6, 0, k, 32); c.stroke(); }
    P(c); ell(c, -10, -16, 46, 8); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill(); c.restore();
    eye(c, -48, -8, 6.5, -0.3, 0.15, 1.2); eye(c, -30, -9, 6, -0.3, 0.15, 1.2);
    P(c); c.moveTo(-58, 12); c.quadraticCurveTo(-48, 6, -38, 12); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  },
  ray(c, e, t) {
    const s = Math.sin(t * 5 + e.seed), w = 24 * (0.7 + 0.3 * s);
    tube(c, [20, 0, 38, 2, 52, 5], 2, '#5f527f');
    P(c); c.moveTo(52, 5); c.lineTo(60, 2); c.lineTo(56, 9); c.closePath(); fs(c, '#ffd23f', 1.5);
    P(c); c.moveTo(-26, 0); c.quadraticCurveTo(-10, -w * 0.4, 4, -w); c.quadraticCurveTo(14, -w * 0.4, 22, 0); c.quadraticCurveTo(14, w * 0.4, 4, w); c.quadraticCurveTo(-10, w * 0.4, -26, 0); c.closePath();
    fs(c, '#7a6c9b', 3);
    c.fillStyle = '#a597c7'; P(c); circ(c, 2, -w * 0.45, 3); circ(c, 8, w * 0.4, 2.5); circ(c, -6, 4, 2.2); c.fill();
    if (Math.sin(t * 12 + e.seed) > 0.6) line(c, [-6, -4, -1, 2, -5, 4, 0, 10], 2, '#7ee7f2');
    eye(c, -13, -4, 3, -0.3, 0.1, 1.2);
  },
  swordfish(c, e, t) {
    const w = Math.sin(t * 14 + e.seed);
    c.save(); c.translate(24, 0); c.rotate(w * 0.3);
    P(c); c.moveTo(0, 0); c.lineTo(14, -12); c.lineTo(9, 0); c.lineTo(14, 12); c.closePath(); fs(c, '#245a92', 2.5); c.restore();
    P(c); c.moveTo(-12, -9); c.quadraticCurveTo(-2, -34, 16, -8); c.closePath(); fs(c, '#245a92', 2.5);
    tube(c, [-26, -1, -60, -2], 2, '#cfd8e6');
    P(c); ell(c, 0, 0, 27, 11); fs(c, '#2f6fb3', 3);
    c.save(); P(c); ell(c, 0, 0, 25.5, 9.5); c.clip(); P(c); c.rect(-30, 2, 60, 12); c.fillStyle = '#d7e6f5'; c.fill(); c.restore();
    eye(c, -15, -3, 3.4, -0.3, 0.1, 1.3);
  },
  angler(c, e, t) {
    const pulse = 0.6 + Math.sin(t * 5) * 0.4;
    glow(c, -62, -62, 34, 'rgba(255,240,140,A)', 0.55 * pulse + 0.2);
    tube(c, [-10, -36, -30, -66, -56, -70, -62, -62], 2.5, '#4a3c50');
    P(c); circ(c, -62, -60, 7); fs(c, '#fff3a0', 2);
    P(c); c.moveTo(40, -6); c.lineTo(66, -30); c.lineTo(60, 0); c.lineTo(66, 30); c.lineTo(40, 8); c.closePath(); fs(c, '#3a2f3f', 3);
    P(c); ell(c, 0, 0, 48, 40); fs(c, e.hp < e.maxHp * 0.4 ? '#5a2f3f' : '#433649', 3.5);
    P(c); ell(c, 4, 22, 34, 14); c.fillStyle = '#6a5a6f'; c.fill();
    P(c); c.moveTo(-48, -2); c.quadraticCurveTo(-30, 30, -2, 26); c.quadraticCurveTo(-30, 14, -44, -10); c.closePath(); fs(c, '#7a1f2b', 2.5);
    c.fillStyle = '#fff';
    for (let k = 0; k < 6; k++) { const x = -44 + k * 7, y = -4 + k * 4.6; P(c); c.moveTo(x, y); c.lineTo(x + 3, y + 9); c.lineTo(x + 5, y + 1); c.closePath(); c.fill(); }
    eye(c, -22, -16, 6, -0.3, 0.2, 1.3, '#ffdd55');
  },
});

/* ============================================================ level 2 bosses */
function drawCar(c, b, t) {
  const angry = b.phase2, red = angry ? '#ff2b2b' : '#d62828';
  // hover thrusters
  for (const tx of [-90, 92]) {
    const L = 30 + Math.sin(t * 30 + tx) * 6;
    P(c); c.moveTo(tx - 12, 46); c.quadraticCurveTo(tx, 46 + L * 1.6, tx + 12, 46); c.closePath(); c.fillStyle = 'rgba(120,200,255,0.75)'; c.fill();
    P(c); c.moveTo(tx - 6, 46); c.quadraticCurveTo(tx, 46 + L, tx + 6, 46); c.closePath(); c.fillStyle = '#fff'; c.fill();
  }
  // exhaust pipe + fire
  const ex = 1 + (b.exh || 0);
  P(c); c.moveTo(166, 26); c.quadraticCurveTo(166 + 30 * ex, 20, 170 + 44 * ex * (0.8 + Math.random() * 0.3), 30); c.quadraticCurveTo(166 + 30 * ex, 40, 166, 34); c.closePath(); c.fillStyle = '#ff7b1a'; c.fill();
  P(c); rr(c, 138, 24, 30, 12, 4); fs(c, '#9aa3ad', 2.5);
  // spoiler
  line(c, [120, -24, 128, -42], 5); P(c); rr(c, 114, -50, 46, 9, 3); fs(c, INK, 0);
  // body
  P(c); c.moveTo(-158, 30); c.lineTo(-158, 4); c.quadraticCurveTo(-156, -16, -126, -20); c.lineTo(-62, -26); c.lineTo(-30, -62); c.lineTo(62, -64); c.lineTo(102, -26); c.lineTo(144, -22); c.quadraticCurveTo(160, -18, 160, 2); c.lineTo(160, 30); c.closePath();
  fs(c, red, 3.5);
  P(c); c.moveTo(-158, 22); c.lineTo(160, 22); c.lineTo(160, 30); c.lineTo(-158, 30); c.closePath(); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill();
  // windows
  P(c); c.moveTo(-50, -27); c.lineTo(-24, -56); c.lineTo(16, -57); c.lineTo(16, -27); c.closePath(); fs(c, '#8fd3ff', 2.5);
  P(c); c.moveTo(26, -27); c.lineTo(26, -57); c.lineTo(56, -58); c.lineTo(88, -27); c.closePath(); fs(c, '#8fd3ff', 2.5);
  line(c, [-34, -32, -18, -50], 3, 'rgba(255,255,255,0.8)');
  line(c, [20, -26, 20, 22], 2); P(c); rr(c, 30, -16, 14, 4, 2); fs(c, '#ddd', 1.2);
  // logo + name
  c.save(); c.translate(-110, 2);
  for (const [dx, dy, a] of [[0, -7, 0], [-6, 3, 2.09], [6, 3, -2.09]]) { c.save(); c.translate(dx, dy); c.rotate(a); P(c); c.moveTo(0, -6); c.lineTo(3.5, 0); c.lineTo(0, 6); c.lineTo(-3.5, 0); c.closePath(); fs(c, '#fff', 1.2); c.restore(); }
  c.restore();
  c.save(); c.font = 'italic 900 19px ' + '"Nunito", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 4; c.strokeStyle = INK; c.strokeText('MITSUBISHI', 10, 6); c.fillStyle = '#fff'; c.fillText('MITSUBISHI', 10, 6); c.restore();
  // angry headlight eye + grille teeth
  const lit = b.lights > 0 ? 1 : 0;
  if (lit) glow(c, -150, -6, 70, 'rgba(255,250,200,A)', 0.8);
  P(c); ell(c, -140, -6, 14, 9); fs(c, lit ? '#fffbe0' : '#fff', 2.5);
  P(c); circ(c, -145, -5, 4.5); c.fillStyle = angry ? '#ff1f3d' : INK; c.fill();
  line(c, [-158, -22, -122, -12], 5);
  P(c); rr(c, -160, 6, 26, 16, 3); fs(c, '#2b2834', 2);
  c.fillStyle = '#fff'; for (let k = 0; k < 4; k++) { P(c); c.moveTo(-158 + k * 6, 7); c.lineTo(-155 + k * 6, 14); c.lineTo(-152 + k * 6, 7); c.closePath(); c.fill(); }
  // wheels
  for (const wx of [-96, 96]) {
    P(c); circ(c, wx, 32, 23); fs(c, '#232228', 3);
    P(c); circ(c, wx, 32, 11); fs(c, '#c3c9d2', 2);
    const a = t * 14;
    for (let k = 0; k < 5; k++) line(c, [wx, 32, wx + Math.cos(a + k * 1.256) * 10, 32 + Math.sin(a + k * 1.256) * 10], 2);
  }
  if (angry) for (let i = 0; i < 2; i++) { const k = (t * 1.5 + i * 0.5) % 1; P(c); circ(c, -40 + i * 60, -70 - k * 34, 7 + k * 10); c.fillStyle = 'rgba(60,60,70,' + (0.6 * (1 - k)).toFixed(2) + ')'; c.fill(); }
}

function drawCatfish(c, b, t) {
  const m = b.mouth || 0, w = Math.sin(t * 4), angry = b.phase2;
  if (b.sucking) {
    c.save();
    const g = c.createLinearGradient(-170, 0, -560, 0); g.addColorStop(0, 'rgba(200,245,255,0.35)'); g.addColorStop(1, 'rgba(200,245,255,0)');
    c.fillStyle = g; P(c); c.moveTo(-168, 0); c.lineTo(-560, -190); c.lineTo(-560, 210); c.lineTo(-168, 24); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 3;
    for (let i = 0; i < 4; i++) { const k = 1 - ((t * 1.8 + i / 4) % 1); P(c); c.arc(-170, 12, 30 + k * 300, Math.PI * 0.82, Math.PI * 1.18); c.stroke(); }
    c.restore();
  }
  const dark = angry ? '#6b3f2f' : '#5b4a3a', fin = '#43362a';
  c.save(); c.translate(140, 0); c.rotate(w * 0.12);
  P(c); c.moveTo(0, -14); c.quadraticCurveTo(50, -54, 56, 0); c.quadraticCurveTo(50, 54, 0, 14); c.closePath(); fs(c, fin, 3.5); c.restore();
  P(c); c.moveTo(10, -58); c.lineTo(34, -86); c.lineTo(62, -52); c.closePath(); fs(c, fin, 3);
  P(c); c.moveTo(-10, 50); for (let i = 0; i <= 6; i++) c.lineTo(-10 + i * 22, 62 + Math.sin(t * 6 + i) * 5 + (i % 2) * 6); c.lineTo(130, 30); c.closePath(); fs(c, fin, 3);
  const body = () => { P(c); c.moveTo(-172, 8); c.quadraticCurveTo(-168, -56, -92, -64); c.quadraticCurveTo(20, -74, 142, -24); c.lineTo(150, 0); c.lineTo(142, 26); c.quadraticCurveTo(20, 66, -92, 58); c.quadraticCurveTo(-168, 54, -172, 8); c.closePath(); };
  body(); fs(c, dark, 4);
  c.save(); body(); c.clip();
  P(c); ell(c, -30, 52, 160, 28); c.fillStyle = '#cdbb98'; c.fill();
  c.fillStyle = 'rgba(40,30,22,0.35)';
  for (const [sx, sy, r] of [[-40, -40, 9], [0, -30, 7], [40, -38, 8], [80, -22, 6], [-70, -20, 6], [20, -10, 5]]) { P(c); circ(c, sx, sy, r); c.fill(); }
  c.restore();
  P(c); c.moveTo(-70, -46); c.quadraticCurveTo(-52, 0, -70, 44); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  P(c); c.moveTo(-60, 40); c.lineTo(-40, 80 + w * 4); c.lineTo(-24, 44); c.closePath(); fs(c, fin, 3);
  // mouth
  P(c); ell(c, -164, 14, 12 + m * 38, 5 + m * 34); fs(c, '#3a1018', 3);
  if (m > 0.3) { P(c); ell(c, -160, 22 + m * 12, 6 + m * 20, 3 + m * 10); c.fillStyle = '#c0485e'; c.fill(); }
  // whiskers
  tube(c, [-166, 2, -206, -10 + w * 6, -236, 18 + w * 10, -246, 62 + w * 8], 2.2, '#3a2e24');
  tube(c, [-156, 6, -186, 34 - w * 6, -196, 76 - w * 6, -184, 108], 2.2, '#3a2e24');
  for (let k = 0; k < 3; k++) tube(c, [-150 + k * 10, 44, -154 + k * 10 + Math.sin(t * 5 + k) * 5, 66], 1.5, '#3a2e24');
  if (IMG.catfishFace) {
    photoFace(c, IMG.catfishFace, -112, -20, 34);
    P(c); circ(c, -112, -20, 34); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  } else {
    eye(c, -124, -34, 7, -0.3, 0.2, 1.4, angry ? '#ff1f3d' : '#15121c', 0.8);
    eye(c, -100, -38, 6, -0.3, 0.2, 1.4, angry ? '#ff1f3d' : '#15121c', 0.8);
  }
}
