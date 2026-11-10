/* ============================================================ screens, buttons, main loop */
const SCREENS = ['menu', 'pause', 'over', 'win', 'rotate'];
let recTab = 'duck', recResetArmed = false;
let pending = null, rotateSkipped = false, lastCheckpoint = null, wakeLock = null;

function show(id) {
  for (const s of SCREENS) $(s).hidden = s !== id;
  $('hud').hidden = !(state === 'play' || state === 'paused');
}
function best(mode) { return store.get('best.' + mode, 0) || 0; }
function saveBest(mode, score) { const b = Math.max(best(mode), Math.floor(score)); store.set('best.' + mode, b); return b; }
/* ---------- local records: top 5 per hero and level, plus cleared levels */
const RKEY = 'records2';
function loadRec() { const r = store.get(RKEY, null); return r && typeof r === 'object' && !Array.isArray(r) ? r : {}; }
function levelsOf(mode) { return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((l) => LEVEL_INFO[l] && LEVEL_INFO[l][mode]); }
function addRecord(mode, level, score, won, stars) {
  const all = loadRec(), key = mode + '-' + level;
  const list = Array.isArray(all[key]) ? all[key].filter((e) => e && typeof e.s === 'number') : [];
  const entry = { s: Math.floor(score), d: Date.now(), w: !!won, st: stars || 0 };
  list.push(entry); list.sort((a, b) => b.s - a.s);
  all[key] = list.slice(0, 5);
  if (won) { all._cleared = all._cleared || {}; all._cleared[key] = true; }
  store.set(RKEY, all);
  saveBest(mode, score);
  return { isBest: all[key][0] === entry && entry.s > 0, best: all[key][0].s };
}
function refreshRecords() {
  const all = loadRec(), cl = all._cleared || {};
  for (const [mode, id] of [['duck', 'recDuck'], ['fish', 'recFish']]) {
    const lv = levelsOf(mode), done = lv.filter((l) => cl[mode + '-' + l]).length;
    $(id).textContent = (best(mode) ? 'Рекорд: ' + fmt(best(mode)) : 'Рекорда пока нет') + ' · пройдено ' + done + ' из ' + lv.length;
  }
}
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' }); } catch (e) { return ''; } };
function renderRecords() {
  const all = loadRec(), cl = all._cleared || {}, body = $('recBody');
  for (const t of document.querySelectorAll('.tab')) t.setAttribute('aria-selected', String(t.dataset.tab === recTab));
  body.textContent = '';
  for (const l of levelsOf(recTab)) {
    const key = recTab + '-' + l, list = all[key] || [], row = document.createElement('div');
    row.className = 'rec-row';
    const head = document.createElement('div'); head.className = 'rec-head';
    const name = document.createElement('span'); name.className = 'rec-lv'; name.textContent = 'Уровень ' + l + ' · ' + LEVEL_INFO[l][recTab].name;
    const b = document.createElement('span'); b.className = 'rec-best'; b.textContent = list.length ? fmt(list[0].s) : '—';
    head.append(name, b); row.append(head);
    if (cl[key]) { const d = document.createElement('span'); d.className = 'rec-done'; d.textContent = '✓ Уровень пройден'; row.append(d); }
    if (list.length) {
      const ol = document.createElement('ol'); ol.className = 'rec-list';
      for (const e of list) { const li = document.createElement('li'); li.textContent = fmt(e.s) + ' — ' + fmtDate(e.d) + (e.w ? ' · победа ' + '★'.repeat(e.st || 0) : ''); ol.append(li); }
      row.append(ol);
    } else { const p = document.createElement('span'); p.className = 'rec-empty'; p.textContent = 'Ещё не играли'; row.append(p); }
    body.append(row);
  }
  $('btnRecReset').textContent = recResetArmed ? 'Точно сбросить?' : 'Сбросить';
}
function openRecords(on) {
  recResetArmed = false;
  $('records').hidden = !on;
  if (on) { renderRecords(); $('btnRecClose').focus(); } else { refreshRecords(); $('btnRecords').focus(); }
}
function updateBombBtn() {
  if (!G) return;
  $('bombCount').textContent = String(G.bombs);
  $('btnBomb').classList.toggle('empty', G.bombs <= 0);
}
const ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
function updateSoundUi() {
  const m = Sound.isMuted();
  $('btnSound').innerHTML = m ? ICON_OFF : ICON_ON;
  $('btnSound').setAttribute('aria-label', m ? 'Включить звук' : 'Выключить звук');
  $('btnSound2').textContent = m ? 'Звук: выкл' : 'Звук: вкл';
}
function toggleMute() { Sound.init(); Sound.setMuted(!Sound.isMuted()); updateSoundUi(); }
async function keepAwake(on) {
  try {
    if (on && !wakeLock && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    else if (!on && wakeLock) { const w = wakeLock; wakeLock = null; await w.release(); }
  } catch (e) { wakeLock = null; }
}

function goMenu() {
  state = 'menu'; G = null; r3Show(false);
  Sound.music(null); Sound.resume(); keepAwake(false);
  refreshRecords(); updateSoundUi();
  show('menu');
  sizeHeroes();
}
function tryStart(mode, fromBoss, level) {
  Sound.init(); sfx('click');
  if (isTouch) goFullscreen();
  pending = { mode, fromBoss: !!fromBoss, level: level || 1 };
  if (isTouch && view.portrait && !rotateSkipped) { state = 'rotate'; show('rotate'); return; }
  startGame(mode, fromBoss, level);
}
function startGame(mode, fromBoss, level) {
  Sound.init();
  G = newGame(mode, level || 1);
  if (fromBoss && lastCheckpoint && lastCheckpoint.mode === mode && lastCheckpoint.level === G.level) {
    G.score = lastCheckpoint.score; G.power = lastCheckpoint.power;
    G.t = G.len; G.ev = G.L.length;
    if (G.mode === 'duck' && G.level === 2) { G.vert = true; setWorld(); G.player.y = H / 2; }
    if (G.level === 3 && G.mode === 'fish') { G.dark = true; G.squidUnlocked = true; G.squidCharge = 100; }
    if (G.level === 4) { G.bright = true; G.squidUnlocked = true; G.squidCharge = 100; }
    if (G.level === 5) { G.dark = true; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; }
    if (G.level === 11) { G.lake67 = true; G.lakeSign = 'ОЗЕРО 228'; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; G.crocUnlocked = true; G.crocCharge = 100; }
    if (G.level === 10) { G.rivers = true; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; G.crocUnlocked = true; G.crocCharge = 100; }
    if (G.level === 9) { G.dark = true; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; G.crocUnlocked = true; G.crocCharge = 100; }
    if (G.level === 8) { G.mangrove = true; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; }
    if (G.level === 7) { G.lake67 = true; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; }
    if (G.level === 6) { G.lake = true; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; }
    if (G.level === 3 && G.mode === 'duck') startRunner(true);
  } else {
    if (G.level === 3 && G.mode === 'fish') { banner('ГАЗ!', 'Уровень 3 · скорость выше', 2.8); sfx('swoosh'); }
    else if (G.level === 11) { banner('УРОВЕНЬ 11', 'Бурные реки', 3, 'green'); sfx('swoosh'); G.rivers = true; G.squidUnlocked = true; G.squidCharge = 50; G.eelUnlocked = true; G.eelCharge = 50; G.crocUnlocked = true; G.crocCharge = 50; }
    else if (G.level === 10) { banner('ГАЗУЕМ!', 'Уровень 10 · русские реки', 3.2, 'green'); sfx('swoosh'); G.rivers = true; G.squidUnlocked = true; G.squidCharge = 50; G.eelUnlocked = true; G.eelCharge = 50; G.crocUnlocked = true; G.crocCharge = 50; }
    else if (G.level === 9) { banner('ГОТОВЬСЯ, БОЕЦ!', 'Уровень 9 · бурная Амазонка', 3.2, 'green'); sfx('wave'); G.rapids = true; G.squidUnlocked = true; G.squidCharge = 50; G.eelUnlocked = true; G.eelCharge = 50; }
    else if (G.level === 8) { banner('ЭТО БУДЕТ НЕЛЕГКО', 'Уровень 8 · озеро 67', 3.2, 'green'); sfx('drone'); G.lake67 = true; G.squidUnlocked = true; G.squidCharge = 50; G.eelUnlocked = true; G.eelCharge = 50; }
    else if (G.level === 7) { banner('АМАЗОНКА', 'УДАЧИ, БОЕЦ!', 3.2, 'green'); sfx('wave'); G.amazon = true; G.squidUnlocked = true; G.squidCharge = 50; G.eelUnlocked = true; G.eelCharge = 50; }
    else if (G.level === 6) { banner('УДАЧИ, ПОКА…', 'Уровень 6 · тёмные глубины', 3.2, 'red'); sfx('drone'); G.dark = true; G.deep = true; G.squidUnlocked = true; G.squidCharge = 50; G.eelUnlocked = true; G.eelCharge = 50; }
    else if (G.level === 5) { banner('УДАЧИ, БРАТ!', 'Уровень 5 · скорость ещё выше', 3); sfx('swoosh'); G.squidUnlocked = true; G.squidCharge = 50; }
    else if (G.level === 4) { banner('ОЖИДАЕТСЯ КАТОЧКА', 'Уровень 4', 3); sfx('siren'); G.squidUnlocked = true; G.squidCharge = 50; }
    else banner('УРОВЕНЬ ' + G.level, G.LI.name, 2.8);
    if (G.level >= 2) G.power = G.level >= 3 ? 3 : 2;
  }
  state = 'play';
  input.dx = input.dy = 0;
  show(null);
  updateBombBtn();
  Sound.music(G.LI.song);
  keepAwake(true);
  lastT = performance.now();
}
function pauseGame() {
  if (state !== 'play') return;
  state = 'paused';
  $('pauseHint').textContent = isTouch ? 'Нажми «Продолжить», когда будешь готов.' : 'Esc или P — продолжить.';
  updateSoundUi(); show('pause');
  Sound.suspend(); keepAwake(false);
  render();
}
function resumeGame() {
  if (state !== 'paused') return;
  state = 'play'; show(null);
  Sound.resume(); keepAwake(true);
  lastT = performance.now();
}
function onGameOver() {
  if (!G || G.ended) return;
  G.ended = true; state = 'over';
  sfx('lose'); keepAwake(false); Sound.music(null);
  const rec = addRecord(G.mode, G.level, G.score, false, 0), b = rec.best;
  $('overNew').hidden = !rec.isBest;
  $('overText').textContent = G.mode === 'duck' ? 'Утка Илона устала. Глоток кофе — и снова в небо!' : 'Карась Миша уплыл перекусить. Ещё попытка?';
  $('overScore').textContent = fmt(G.score);
  $('overBest').textContent = 'Рекорд уровня ' + G.level + ': ' + fmt(b);
  lastCheckpoint = G.checkpoint ? Object.assign({ mode: G.mode, level: G.level }, G.checkpoint) : null;
  $('btnBossAgain').hidden = !lastCheckpoint;
  $('btnAgain').className = lastCheckpoint ? 'btn alt' : 'btn';
  show('over');
}
function onWin() {
  if (!G || G.ended) return;
  G.ended = true; state = 'win';
  const bonus = G.hp * 1000;
  G.score += bonus;
  sfx('win'); keepAwake(false);
  const stars = G.hp >= 4 ? 3 : G.hp >= 2 ? 2 : 1;
  const rec = addRecord(G.mode, G.level, G.score, true, stars), b = rec.best;
  $('winNew').hidden = !rec.isBest;
  $('winText').textContent = {
    granny: 'Бабка на самокате улетела восвояси. Небо над городом снова спокойное!',
    pike: 'Злая рыба уплыла пузом кверху. Море снова тёплое и тихое!',
    car: '«Я твою выхлопную трубу шатала!» — сказала утка Илона. Бешеная Mitsubishi заглохла навсегда.',
    shawarma: 'Злая шаверма повержена! Утка Илона добежала до победы — и обед в кармане.',
    catfish: 'Сом уплыл в свою нору лечить усы. Щука больше не жалуется!',
    mega: 'Ты просто босс, ты просто начальник! Мегалодон повержен… но, кажется, это ещё не конец.',
    kraken: 'Кракен повержен! Но где-то в темноте кто-то уже точит свой нос…',
    crayboss: 'Красный рак повержен! Но говорят, следующий босс очень сильный…',
    salmon: 'Красный лосось повержен! Но под камнями кто-то уже щёлкает клешнями…',
    vampire: 'Рыба-вампир повержена! Ты справился, боец. Впереди — русские реки…',
    anaconda: 'Большая анаконда повержена! Но в тёмной воде блеснули чьи-то длинные клыки…',
    gator: 'Чёрный аллигатор повержен! Но в зарослях Амазонки уже кто-то шевелится…',
    perch: 'Все боссы повержены, даже Босс-окунь! Карась Миша — настоящий боец. Впереди Амазонка…',
    swordfish: 'Рыба-меч повержена! «Да как так?!» — только и успела сказать она. Но глубина стала красной…',
  }[G.LI.boss];
  const next = LEVEL_INFO[G.level + 1] && LEVEL_INFO[G.level + 1][G.mode] ? G.level + 1 : 0;
  $('winLevel').textContent = next ? 'Уровень ' + G.level + ' пройден. Впереди уровень ' + next + '!' : 'Уровень ' + G.level + ' пройден. Продолжение следует…';
  $('btnNext').hidden = !next;
  $('btnNext').textContent = 'Уровень ' + next + ' ▸';
  $('btnNext').dataset.level = String(next);
  $('btnWinAgain').className = next ? 'btn alt' : 'btn';
  $('winStars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  $('winScore').textContent = fmt(G.score);
  $('winBest').textContent = 'Бонус за сердечки +' + fmt(bonus) + ' · Рекорд уровня: ' + fmt(b);
  show('win');
}

/* ---------- buttons */
for (const b of document.querySelectorAll('[data-level]')) b.addEventListener('click', () => tryStart(b.dataset.mode, false, +b.dataset.level));
for (const cv of document.querySelectorAll('canvas.hero')) cv.addEventListener('click', () => tryStart(cv.dataset.mode, false, 1));
$('btnSound').addEventListener('click', toggleMute);
$('btnRecords').addEventListener('click', () => { sfx('click'); openRecords(true); });
$('btnRecClose').addEventListener('click', () => openRecords(false));
$('btnRecReset').addEventListener('click', () => {
  if (!recResetArmed) { recResetArmed = true; renderRecords(); return; }
  store.set(RKEY, {}); store.set('best.duck', 0); store.set('best.fish', 0); recResetArmed = false; renderRecords();
});
for (const t of document.querySelectorAll('.tab')) t.addEventListener('click', () => { recTab = t.dataset.tab; recResetArmed = false; renderRecords(); });
$('btnSound2').addEventListener('click', toggleMute);
$('btnResume').addEventListener('click', resumeGame);
$('btnRestart').addEventListener('click', () => { const m = G ? G.mode : 'duck', l = G ? G.level : 1; Sound.resume(); startGame(m, false, l); });
for (const id of ['btnMenu1', 'btnMenu2', 'btnMenu3']) $(id).addEventListener('click', () => { sfx('click'); goMenu(); });
$('btnAgain').addEventListener('click', () => { tryStart(G ? G.mode : 'duck', false, G ? G.level : 1); });
$('btnWinAgain').addEventListener('click', () => { tryStart(G ? G.mode : 'duck', false, G ? G.level : 1); });
$('btnNext').addEventListener('click', (e) => { tryStart(G ? G.mode : 'duck', false, +e.currentTarget.dataset.level || 2); });
let crocUi = '';
function updateCrocBtn() {
  const on = !!(G && G.crocUnlocked && !G.run && state !== 'menu');
  const p = G ? Math.round(G.crocCharge || 0) : 0, act = !!G && G.crocT > 0, key = on + '|' + p + '|' + act;
  if (key === crocUi) return;
  crocUi = key;
  const b = $('btnCroc');
  b.hidden = !on; b.style.setProperty('--p', String(p));
  b.classList.toggle('ready', p >= 100 && !act); b.classList.toggle('active', act);
}
$('btnCroc').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); useCroc(); });
$('btnCroc').addEventListener('click', (e) => { if (e.detail === 0) useCroc(); e.currentTarget.blur(); });
if (isTouch) $('crocKey').hidden = true;
let eelUi = '';
function updateEelBtn() {
  const on = !!(G && G.eelUnlocked && !G.run && state !== 'menu');
  const p = G ? Math.round(G.eelCharge || 0) : 0, act = !!G && G.eelT > 0, key = on + '|' + p + '|' + act;
  if (key === eelUi) return;
  eelUi = key;
  const b = $('btnEel');
  b.hidden = !on; b.style.setProperty('--p', String(p));
  b.classList.toggle('ready', p >= 100 && !act); b.classList.toggle('active', act);
}
$('btnEel').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); useEel(); });
$('btnEel').addEventListener('click', (e) => { if (e.detail === 0) useEel(); e.currentTarget.blur(); });
if (isTouch) $('eelKey').hidden = true;
let runUi = '';
function updateRunCtl(run) {
  const show = run && !G.run.end && state !== 'menu';
  const p = show ? Math.round(G.run.meter) : 0, act = show && G.run.boost > 0;
  const key = show + '|' + p + '|' + act;
  if (key === runUi) return;
  runUi = key;
  $('hud').classList.toggle('runner', show);
  $('dashBar').hidden = !show; $('btnJump').hidden = !(show && isTouch);
  $('dashFill').style.width = (act ? 100 : p) + '%';
  $('dashBar').classList.toggle('full', p >= 100 && !act);
  $('dashBar').classList.toggle('active', act);
}
$('btnJump').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); runJump(); });
$('dashBar').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); runBoost(); });
$('dashBar').addEventListener('click', (e) => { if (e.detail === 0) runBoost(); e.currentTarget.blur(); });
if (isTouch) $('hud').classList.add('touch');
const special = () => { if (G && G.run) runBoost(); else useSquid(); };
$('btnSquid').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); special(); });
$('btnSquid').addEventListener('click', (e) => { if (e.detail === 0) special(); e.currentTarget.blur(); });
if (isTouch) $('squidKey').hidden = true;
let squidUi = '';
function updateSquidBtn() {
  const run = !!(G && G.run);
  updateRunCtl(run);
  updateEelBtn();
  updateCrocBtn();
  const on = !!(G && G.squidUnlocked && !run && state !== 'menu');
  const p = !G ? 0 : Math.round(G.squidCharge || 0), act = !!G && G.squidT > 0;
  const key = on + '|' + p + '|' + act + '|' + run;
  const bub = !!(G && !G.run && typeof sqActive === 'function' && sqActive());
  if ($('btnBomb').classList.contains('bubbles') !== bub) $('btnBomb').classList.toggle('bubbles', bub);
  if (key === squidUi) return;
  squidUi = key;
  const b = $('btnSquid');
  b.querySelector('.sq-label').innerHTML = run ? 'РЫВОК' : 'КАЛЬ&shy;МАР';
  $('squidKey').textContent = run ? 'SHIFT' : 'Q';
  b.setAttribute('aria-label', run ? 'Рывок' : 'Позвать кальмара');
  b.hidden = !on;
  b.style.setProperty('--p', String(p));
  b.classList.toggle('ready', p >= 100 && !act);
  b.classList.toggle('active', !!act);
}
$('btnBossAgain').addEventListener('click', () => { if (lastCheckpoint) tryStart(lastCheckpoint.mode, true, lastCheckpoint.level); });
$('btnRotateSkip').addEventListener('click', () => { rotateSkipped = true; if (pending) startGame(pending.mode, pending.fromBoss, pending.level); });
$('btnPause').addEventListener('click', (e) => { e.currentTarget.blur(); pauseGame(); });
$('btnBomb').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); useBomb(); });
$('btnBomb').addEventListener('click', (e) => { if (e.detail === 0) useBomb(); e.currentTarget.blur(); });
if (isTouch) $('bombKey').hidden = true;
$('controlsHint').textContent = isTouch
  ? 'Веди пальцем по экрану — герой повторит движение. Стреляет сам. Кнопка со звездой — суперудар.'
  : 'Стрелки / WASD или тяни мышью · стреляет сам · Пробел — суперудар · P — пауза';
const fsOk = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
if (!fsOk) $('btnFull').hidden = true;
const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function goFullscreen() {
  if (!fsOk || isFull()) return;
  const el = document.documentElement;
  try {
    const r = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen && el.webkitRequestFullscreen();
    if (r && r.then) r.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* not supported */ } }).catch(() => {});
  } catch (e) { /* fullscreen refused */ }
}
function updateFsPrompt() { $('fsPrompt').hidden = !(isTouch && fsOk && !isFull()); }
$('btnFull').addEventListener('click', () => {
  if (isFull()) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { /* ignore */ } return; }
  goFullscreen();
});
$('fsPrompt').addEventListener('click', () => { sfx('click'); goFullscreen(); });
document.addEventListener('fullscreenchange', () => { updateFsPrompt(); setTimeout(resize, 200); });
document.addEventListener('webkitfullscreenchange', () => { updateFsPrompt(); setTimeout(resize, 200); });
updateFsPrompt();

hooks.key = (code, e, onButton) => {
  if (state === 'play' && G && G.run && code !== 'Escape' && code !== 'KeyP' && code !== 'KeyM') { runnerKey(code); return; }
  if (state === 'play') {
    if (code === 'Space' || code === 'KeyX' || code === 'KeyB' || code === 'Enter') useBomb();
    else if (code === 'KeyQ' || code === 'KeyC') useSquid();
    else if (code === 'KeyE' || code === 'KeyV') useEel();
    else if (code === 'KeyR') useCroc();
    else if (code === 'Escape' || code === 'KeyP') pauseGame();
    else if (code === 'KeyM') toggleMute();
  } else if (state === 'paused') {
    if (code === 'Escape' || code === 'KeyP') resumeGame();
    else if (code === 'KeyM') toggleMute();
  } else if (state === 'menu' && !$('records').hidden) {
    if (code === 'Escape') openRecords(false);
  } else if (state === 'menu' && !onButton) {
    if (code === 'Digit1') tryStart('duck');
    else if (code === 'Digit2') tryStart('fish');
  }
};
hooks.blur = () => { if (state === 'play') pauseGame(); };
hooks.tap = () => { if (state === 'play' && G && !G.run) doBurst(); };
hooks.swipe = (dir) => { if (state !== 'play' || !G || !G.run) return; if (dir === 'down') runRoll(); else if (dir !== 'up') runLane(dir === 'left' ? -1 : 1); };
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (state === 'play') pauseGame(); Sound.suspend(); }
  else if (state !== 'paused') Sound.resume();
});

/* ---------- animated heroes on the menu */
const heroes = [{ el: $('heroDuck'), kind: 'duck', w: 0, h: 0 }, { el: $('heroFish'), kind: 'fish', w: 0, h: 0 }];
function sizeHeroes() {
  const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
  for (const hr of heroes) {
    const r = hr.el.getBoundingClientRect();
    hr.w = Math.round(r.width * dpr); hr.h = Math.round(r.height * dpr);
    if (hr.w > 0 && hr.el.width !== hr.w) hr.el.width = hr.w;
    if (hr.h > 0 && hr.el.height !== hr.h) hr.el.height = hr.h;
  }
}
function drawHeroes(t) {
  for (const hr of heroes) {
    if (!hr.w || !hr.h) continue;
    const c = hr.el.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, hr.w, hr.h);
    if (hr.kind === 'duck') drawDuckHero(c, hr.w / 2, hr.h * 0.52 + Math.sin(t * 2.2) * hr.h * 0.03, t, { h: hr.h * 0.8, flapSpeed: 9, tilt: Math.sin(t * 1.3) * 0.05 });
    else { const w = hr.w * 0.86; drawCarpHero(c, hr.w * 0.47, hr.h * 0.56 + Math.sin(t * 1.8) * hr.h * 0.04, t, { w, amp: w * 0.035, swim: 6 }); }
  }
}
onResize.push(() => {
  if (state === 'menu') sizeHeroes();
  if (state === 'rotate' && !view.portrait && pending) startGame(pending.mode, pending.fromBoss, pending.level);
  if (G && state !== 'play') render();
});

/* ---------- main loop */
let lastT = performance.now();
function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
  lastT = now;
  try {
    if (state === 'play') { for (let i = 0; i < DEBUG.substeps && state === 'play'; i++) update(dt); render(); }
    else if (state === 'menu') drawHeroes(now / 1000);
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(loop);
}

function fontsReady() {
  try {
    if (!document.fonts) return Promise.resolve();
    const loads = ['26px "Dela Gothic One"', '900 16px "Nunito"', '800 16px "Nunito"', '21px "Pangolin"', 'italic 700 34px "Old Standard TT"'].map((f) => document.fonts.load(f, 'АБВ').catch(() => {}));
    return Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 2500))]);
  } catch (e) { return Promise.resolve(); }
}
function boot() {
  resize();
  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 250));
  Promise.race([Promise.all([loadImages(), fontsReady()]), new Promise((r) => setTimeout(r, 5000))]).then(() => {
    $('loading').hidden = true;
    goMenu();
    requestAnimationFrame((t) => { lastT = t; loop(t); });
  });
}

// test hooks (used by automated checks only)
window.__kb = {
  get G() { return G; }, get state() { return state; },
  start: (m, fromBoss, level) => startGame(m, fromBoss, level),
  eel: () => useEel(), croc: () => useCroc(),
  tunnelC: (x) => tunnelC(x), tunAt: (x) => tunAt(x), burst: () => doBurst(), squid: () => useSquid(),
  runAct: (a) => ({ jump: runJump, roll: runRoll, left: () => runLane(-1), right: () => runLane(1), boost: runBoost })[a](), menu: goMenu, pause: pauseGame, resume: resumeGame, bomb: useBomb,
  god: (v) => { DEBUG.god = v !== false; },
  debug: DEBUG,
  skip: (t) => { if (G) { G.t = t; while (G.ev < G.L.length && G.L[G.ev][0] < t) G.ev++; } },
  boss: () => { if (G) { if (G.mode === 'duck' && G.level === 2 && !G.vert) { G.vert = true; setWorld(); G.player.x = 120; G.player.y = H / 2; } G.t = G.len; G.ev = G.L.length; G.enemies.length = 0; G.eb.length = 0; G.tunnel = null; if (G.level === 3 && G.mode === 'duck') { startRunner(true); return; } if (G.level === 3) { G.dark = true; G.squidUnlocked = true; G.squidCharge = 100; G.evOff = 0; } if (G.level === 4) { G.bright = true; G.aqua = null; G.squidUnlocked = true; G.squidCharge = 100; G.evOff = 0; } if (G.level === 5) { G.dark = true; G.lake = false; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; G.evOff = 0; } if (G.level === 6) { G.dark = false; G.deep = false; G.lake = true; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; G.evOff = 0; } if (G.level === 7) { G.amazon = false; G.lake67 = true; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; G.evOff = 0; } if (G.level === 8) { G.lake67 = false; G.mangrove = true; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; G.evOff = 0; } if (G.level === 9) { G.rapids = false; G.dark = true; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; G.crocUnlocked = true; G.crocCharge = 100; G.evOff = 0; } if (G.level === 10) { G.rivers = true; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; G.crocUnlocked = true; G.crocCharge = 100; G.evOff = 0; } if (G.level === 11) { G.rivers = false; G.lake67 = true; G.lakeSign = 'ОЗЕРО 228'; G.squidUnlocked = true; G.squidCharge = 100; G.eelUnlocked = true; G.eelCharge = 100; G.crocUnlocked = true; G.crocCharge = 100; G.evOff = 0; } startWarning(); G.phaseT = 2.9; } },
  render: () => render(),
};
const hot = window.claude && window.claude.hot;
try { if (hot && hot.snapshot) hot.snapshot(() => ({ muted: Sound.isMuted() })); } catch (e) { /* optional */ }
if (hot && hot.ready) hot.ready(() => boot()); else boot();
