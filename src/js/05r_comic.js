/* ============================================================ comic pause for reading
   A message or line of dialog seen for the first time pauses the game: the screen dims with a halftone,
   the text pops up in a comic panel (one at a time, never on top of each other), then the game eases back in.
   Space / Enter / tap continues early (after a short moment); repeats of a text show as ordinary banners. */
function readQueue(item) {
  if (!G || DEBUG.noRead) return false;
  const key = (item.who || '') + '|' + (item.title || '') + '|' + (item.sub || '') + '|' + (item.text || '');
  if (!G.seen) G.seen = new Set();
  if (G.seen.has(key)) return false;
  G.seen.add(key);
  const chars = ((item.title || '') + (item.sub || '') + (item.text || '')).length;
  item.hold = item.kind === 'say' ? clamp(1.6 + chars * 0.05, 2.2, 6) : clamp(1.9 + chars * 0.05, 2.6, 7);
  if (!G.readQ) G.readQ = [];
  G.readQ.push(item);
  return true;
}
const comicActive = () => !!(G && G.readCur);
function comicSkip() { const P = G && G.readCur; if (P && !P.closing && P.t > 0.6) { P.closing = true; sfx('click'); } }
// advances the panel clock in real time; returns true while the game should stay paused
function comicStep(dt) {
  if (!G.readCur && G.readQ && G.readQ.length) { G.readCur = G.readQ.shift(); G.readCur.t = 0; G.readCur.out = 0; sfx('pop'); }
  const P = G.readCur; if (!P) return false;
  P.t += dt;
  if (P.closing) {
    P.out += dt;
    if (P.out >= 0.3) { G.readCur = null; return !!(G.readQ && G.readQ.length); }
  } else if (P.t >= P.hold) P.closing = true;
  return true;
}
const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
function wrapText(c, text, maxW) {
  const out = []; let line = '';
  for (const w of String(text).split(/\s+/)) {
    const t = line ? line + ' ' + w : w;
    if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
let halftone = null;
function halftoneLayer() {
  if (halftone && halftone.w === SW) return halftone.cv;
  const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH;
  const c = cv.getContext('2d'); c.fillStyle = '#000';
  for (let y = 0; y < SH; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < SW; x += 12) {
    const d = Math.hypot((x - SW / 2) / SW, (y - SH / 2) / SH), r = 0.6 + d * 4.2;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  halftone = { w: SW, cv };
  return cv;
}
const COMIC_COL = { warn: '#e03131', red: '#c92a2a', green: '#2b8a3e', small: '#7048e8', wave: '#e8590c', title: '#e8590c', sign: '#1971c2' };
function drawComic(c) {
  const P = G && G.readCur;
  const nextUp = !!(G && G.readQ && G.readQ.length);
  if (!P) return;
  c.save(); c.setTransform(view.px, 0, 0, view.px, 0, 0);
  // dim + halftone; stays dark between two panels in a row
  const dimA = P.closing && !nextUp ? 1 - P.out / 0.3 : Math.min(1, P.t / 0.18);
  c.globalAlpha = clamp(dimA, 0, 1);
  c.fillStyle = 'rgba(14,10,30,0.62)'; c.fillRect(0, 0, SW, SH);
  c.globalAlpha = clamp(dimA, 0, 1) * 0.22; c.drawImage(halftoneLayer(), 0, 0);
  // the panel pops in (overshoot) and drops away
  const pin = easeOutBack(clamp(P.t / 0.3, 0, 1)), pout = P.closing ? clamp(P.out / 0.3, 0, 1) : 0;
  c.globalAlpha = 1 - pout;
  const say = P.kind === 'say', W0 = Math.min(SW * 0.82, 780), pad = 30;
  c.font = '800 25px ' + FONT_UI;
  const titleSize = say ? 0 : (P.style === 'small' ? 46 : 54);
  const bodyFont = say ? '800 30px ' + FONT_UI : '800 25px ' + FONT_UI, lineH = say ? 38 : 32;
  c.font = bodyFont;
  const lines = wrapText(c, say ? P.text : P.sub || '', W0 - pad * 2);
  if (!say && P.title) { c.font = titleSize + 'px ' + FONT_DISPLAY; }
  const titleW = !say && P.title ? c.measureText(P.title).width : 0, tScale = titleW > W0 - pad * 2 ? (W0 - pad * 2) / titleW : 1;
  const hTitle = !say && P.title ? titleSize * tScale + 14 : 0, h = pad * 2 + hTitle + lines.length * lineH + 22;
  const cx = SW / 2, cy = SH * 0.46;
  c.translate(cx, cy + pout * 60); c.rotate(-0.025 + Math.sin(P.t * 2) * 0.004); c.scale(0.55 + 0.45 * pin, 0.55 + 0.45 * pin);
  const x0 = -W0 / 2, y0 = -h / 2;
  // a red starburst behind warnings, like a «БАМ!»
  if (P.style === 'warn' || P.style === 'red') {
    c.save(); c.rotate(P.t * 0.4); P_burst(c, 0, 0, W0 * 0.62, W0 * 0.5, 18, '#ffd43b'); c.restore();
  }
  // panel: ink shadow, paper, thick outline (dialog = balloon with a tail)
  c.fillStyle = '#16121f'; roundRect(c, x0 + 9, y0 + 10, W0, h, say ? 34 : 12); c.fill();
  c.fillStyle = say ? '#fffdf6' : '#fff4c2'; roundRect(c, x0, y0, W0, h, say ? 34 : 12); c.fill();
  c.lineWidth = 6; c.strokeStyle = '#16121f'; c.stroke();
  if (say) {
    c.beginPath(); c.moveTo(x0 + 70, y0 + h - 3); c.lineTo(x0 + 34, y0 + h + 46); c.lineTo(x0 + 128, y0 + h - 3); c.closePath();
    c.fillStyle = '#fffdf6'; c.fill(); c.stroke();
    c.fillStyle = '#fffdf6'; c.fillRect(x0 + 74, y0 + h - 9, 50, 8);
  }
  let y = y0 + pad;
  if (say && P.who) {
    // speaker tag on the panel corner
    c.save(); c.translate(x0 + 24, y0 - 6); c.rotate(-0.06);
    c.font = '900 20px ' + FONT_UI; const tw = c.measureText(P.who.toUpperCase()).width + 28;
    c.fillStyle = '#16121f'; roundRect(c, 4, -18, tw, 36, 8); c.fill();
    c.fillStyle = '#ffd43b'; roundRect(c, 0, -22, tw, 36, 8); c.fill(); c.lineWidth = 3.5; c.strokeStyle = '#16121f'; c.stroke();
    c.fillStyle = '#16121f'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(P.who.toUpperCase(), 14, -3);
    c.restore();
    y += 6;
  }
  c.textAlign = 'center'; c.textBaseline = 'top';
  if (!say && P.title) {
    c.save(); c.translate(0, y); c.scale(tScale, tScale);
    c.font = titleSize + 'px ' + FONT_DISPLAY; c.lineJoin = 'round';
    c.lineWidth = 8; c.strokeStyle = '#16121f'; c.strokeText(P.title, 0, 0);
    c.fillStyle = COMIC_COL[P.style] || COMIC_COL.title; c.fillText(P.title, 0, 0);
    c.restore();
    y += hTitle;
  }
  c.font = bodyFont; c.fillStyle = '#16121f';
  for (const L of lines) { c.fillText(L, 0, y); y += lineH; }
  // auto-continue bar and the «next» hint
  const k = clamp(P.t / P.hold, 0, 1);
  c.fillStyle = 'rgba(22,18,31,0.18)'; c.fillRect(x0 + 24, y0 + h - 16, W0 - 48, 5);
  c.fillStyle = '#16121f'; c.fillRect(x0 + 24, y0 + h - 16, (W0 - 48) * k, 5);
  if (P.t > 0.6 && !P.closing && Math.floor(P.t * 2.5) % 2 === 0) {
    c.font = '900 15px ' + FONT_UI; c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillStyle = '#5c5470';
    c.fillText(isTouch ? 'тап — дальше ▸' : 'Пробел / Enter — дальше ▸', x0 + W0 - 22, y0 + h - 22);
  }
  c.restore();
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function P_burst(c, x, y, rx, ry, n, col) {
  c.beginPath();
  for (let i = 0; i <= n * 2; i++) { const a = (i / (n * 2)) * TAU, r = i % 2 ? 0.72 : 1; c.lineTo(x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r); }
  c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 6; c.strokeStyle = '#16121f'; c.stroke();
}
