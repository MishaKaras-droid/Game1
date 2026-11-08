'use strict';
/* ============================================================ utils */
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeInOut = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const d2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
const fmt = (n) => String(Math.max(0, Math.floor(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const wrap = (v, a, b) => { const w = b - a; return ((((v - a) % w) + w) % w) + a; };

function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return 'rgb(' + Math.round(lerp(A[0], B[0], t)) + ',' + Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ')';
}

const store = {
  get(k, d) { try { const v = localStorage.getItem('kryabul.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('kryabul.' + k, JSON.stringify(v)); } catch (e) { /* storage blocked: fine */ } },
};

const reducedMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
const isTouch = (() => { try { return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; } catch (e) { return false; } })();

/* ============================================================ view */
const SH = 540;         // logical screen height, width adapts to the screen
let SW = 960;
// W/H are the current *world* size. In the vertical part of duck level 2 the world is
// turned 90 degrees, so W (the flight direction) becomes the screen height.
let W = 960, H = 540;
function setScreen() { W = SW; H = SH; }
function setWorld() { if (G && G.vert) { W = SH; H = SW; } else { W = SW; H = SH; } }
const $ = (id) => document.getElementById(id);
const stage = $('stage');
const canvas = $('game');
const ctx = canvas.getContext('2d');
const view = { scale: 1, dpr: 1, px: 1, cssW: 0, cssH: 0, left: 0, top: 0, version: 0, portrait: false };
const onResize = [];

function resize() {
  const r = stage.getBoundingClientRect();
  const vw = Math.max(1, r.width), vh = Math.max(1, r.height);
  SW = Math.round(clamp((SH * vw) / vh, 720, 1170));
  setScreen();
  const scale = Math.min(vw / SW, vh / SH);
  const cssW = Math.round(SW * scale), cssH = Math.round(SH * scale);
  const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
  const px = scale * dpr;
  const changed = Math.abs(px - view.px) > 0.01 || cssW !== view.cssW || cssH !== view.cssH;
  view.scale = scale; view.dpr = dpr; view.px = px;
  view.cssW = cssW; view.cssH = cssH;
  view.left = Math.round((vw - cssW) / 2); view.top = Math.round((vh - cssH) / 2);
  view.portrait = vh > vw * 1.05;
  canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
  canvas.style.left = view.left + 'px'; canvas.style.top = view.top + 'px';
  const bw = Math.max(1, Math.round(cssW * dpr)), bh = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== bw) canvas.width = bw;
  if (canvas.height !== bh) canvas.height = bh;
  if (changed) view.version++;
  for (const fn of onResize) fn();
}

/* ============================================================ input */
const keys = Object.create(null);
const input = { dx: 0, dy: 0, dragging: false };
let dragPtr = null;
const hooks = { key: null, blur: null, tap: null, swipe: null, tapUp: null };   // set by the UI layer

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = (e.target && e.target.tagName) || '';
  const onButton = tag === 'BUTTON';
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) || (e.code === 'Space' && !onButton)) e.preventDefault();
  keys[e.code] = true;
  if (!e.repeat && hooks.key) hooks.key(e.code, e, onButton);
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  dragPtr = null; input.dragging = false;
  if (hooks.blur) hooks.blur();
});

stage.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button, .overlay, #menu')) return;
  if (hooks.tap) hooks.tap();          // every finger counts (bubbles in the squeezing pipe)
  if (dragPtr) { e.preventDefault(); return; }
  dragPtr = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t0: performance.now(), fired: false };
  input.dragging = true;
  try { stage.setPointerCapture(e.pointerId); } catch (_) { /* old browsers */ }
  e.preventDefault();
});
stage.addEventListener('pointermove', (e) => {
  if (!dragPtr || e.pointerId !== dragPtr.id) return;
  const sens = e.pointerType === 'mouse' ? 1 : 1.3;
  input.dx += ((e.clientX - dragPtr.x) / view.scale) * sens;
  input.dy += ((e.clientY - dragPtr.y) / view.scale) * sens;
  dragPtr.x = e.clientX; dragPtr.y = e.clientY;
  // quick strokes are swipes (used by the running level)
  if (!dragPtr.fired && hooks.swipe) {
    const dx = e.clientX - dragPtr.sx, dy = e.clientY - dragPtr.sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 32) {
      dragPtr.fired = true;
      hooks.swipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }
  }
});
const endDrag = (e) => {
  if (!dragPtr || e.pointerId !== dragPtr.id) return;
  if (e.type === 'pointerup' && !dragPtr.fired && performance.now() - dragPtr.t0 < 350 && hooks.tapUp) hooks.tapUp();
  dragPtr = null; input.dragging = false;
};
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
stage.addEventListener('lostpointercapture', endDrag);
// no page scrolling / pinch zoom / double-tap zoom while playing
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1 || !(e.target.closest && e.target.closest('.overlay'))) e.preventDefault();
}, { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('#stage')) e.preventDefault(); });
