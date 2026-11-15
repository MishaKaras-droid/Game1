/* ============================================================ dialog: comic balloons with a slow-down (no pause)
   A line said for the first time slows the game to half speed while it can be read (the balloon stays next to
   the speaker, the road stays visible). Repeated lines just show the balloon. */
const DIALOG_SLOW = 0.5;
function dialogLine(text) {
  // a line of dialog takes the stage: an ordinary banner on screen steps aside and comes back after it
  if (G && G.banners) for (const b of G.banners) {
    if (b.style === 'warn' || b.style === 'red' || b.t >= b.life - 0.3) continue;
    if (b.t < 1.4) { if (!G.bannerQ) G.bannerQ = []; if (!G.bannerQ.some((q) => q.text === b.text)) G.bannerQ.unshift(Object.assign({}, b, { t: 0 })); }
    b.life = b.t + 0.15;
  }
  const life = clamp(1.6 + String(text).length * 0.05, 2.3, 4.5);
  if (!G || DEBUG.noRead) return life;
  if (!G.seen) G.seen = new Set();
  if (!G.seen.has(text)) { G.seen.add(text); G.dlgT = Math.max(G.dlgT || 0, life * 0.75); }
  return life;
}
const comicActive = () => false;
function comicSkip() {}
// a light halftone rim while the world is slowed for reading
let halftone = null;
function halftoneLayer() {
  if (halftone && halftone.w === SW) return halftone.cv;
  const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH;
  const c = cv.getContext('2d'); c.fillStyle = '#000';
  for (let y = 0; y < SH; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < SW; x += 12) {
    const d = Math.hypot((x - SW / 2) / SW, (y - SH / 2) / SH), r = Math.max(0, (d - 0.32) * 9);
    if (r > 0.2) { c.beginPath(); c.arc(x, y, Math.min(5, r), 0, TAU); c.fill(); }
  }
  halftone = { w: SW, cv };
  return cv;
}
function drawDialogRim(c) {
  const k = 1 - (G.readK === undefined ? 1 : G.readK);
  if (k < 0.05 || G.phase === 'outro') return;
  c.save(); c.setTransform(view.px, 0, 0, view.px, 0, 0); c.globalAlpha = Math.min(1, k * 2) * 0.28; c.drawImage(halftoneLayer(), 0, 0); c.restore();
}
