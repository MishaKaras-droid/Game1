/* ============================================================ duck level 5: «Академический отпуск»
   After the Dissertation was defended the city let itself go: students turned into zombies.
   Built on the level 4 engine (city chunks, toon light, the juice controller) with the Zombie Apocalypse Kit models.
   New: slide under high barriers, ground pound for fragile stacks and crowds, homing chains, «Повышенная стипендия»
   (a coffee magnet for 10 s), the armoured taxi (15 s of invulnerable ramming) and the Troll-mutant boss in 3 phases. */
LEVEL_INFO[5].duck = { name: 'Академический отпуск', boss: 'troll', song: 'sky2' };
const LEVEL5_DUCK = [];
const TRACK_PLAN5 = [
  ['straight', 70], ['curve', 140, -0.8], ['hill', 110, 0.14], ['straight', 50], ['scurve', 170, 0.7], ['straight', 40], ['loop', 90], ['straight', 50],
  ['curve', 130, 1], ['hill', 120, 0.16], ['straight', 40], ['scurve', 170], ['curve', 140, -0.9], ['loop', 90], ['straight', 60],
  ['hill', 110, 0.15], ['curve', 130, 0.8], ['straight', 50], ['scurve', 170], ['straight', 80],
];
const BOSS5_AT = 2050;

/* ---------- the track */
function buildTrack5() {
  const Rn = mulberry(505), objs = [];
  const add = (o) => objs.push(Object.assign({ x: 0, h: 0, dead: false }, o));
  const cups = (d0, lane, n, gap, h, arc) => { for (let i = 0; i < n; i++) add({ type: 'cup', d: d0 + i * gap, x: laneX(lane), h: h + (arc ? Math.sin((i / Math.max(1, n - 1)) * Math.PI) * arc : 0) }); };
  let d = 60, gotStipend = 0, gotArmor = 0;
  const loopsDone = new Set();
  while (d < BOSS5_AT - 70) {
    const lr = planRanges().find(([a, b, ty]) => ty === 'loop' && d > a - 22 && d < b + 10);
    if (lr) { if (!loopsDone.has(lr[0])) { loopsDone.add(lr[0]); cups(lr[0] - 6, 1, Math.floor((lr[1] - lr[0] + 6) / 3), 3, 0.5); } d = lr[1] + 14; continue; }
    let pool = d < 220 ? ['zombies', 'line', 'plastic', 'hbar'] : d < 500 ? ['zombies', 'hbar', 'crate', 'couch', 'chubby', 'trash', 'line'] : ['zombies', 'horde', 'hbar', 'crate', 'couch', 'chubby', 'taxi', 'trash', 'dash', 'spring', 'mix'];
    if (d > 380 && gotStipend < 3 && d > 380 + gotStipend * 520) pool = ['stipend'];
    else if (d > 700 && gotArmor < 2 && d > 700 + gotArmor * 700) pool = ['armor'];
    const pat = pool[Math.floor(Rn() * pool.length)], L = Math.floor(Rn() * 3), L2 = (L + 1 + Math.floor(Rn() * 2)) % 3, L3 = 3 - L - L2;
    switch (pat) {
      case 'line': cups(d, L, 9, 2.6, 0.5); add({ type: 'dash', d: d - 5, x: laneX(L) }); break;
      case 'zombies': add({ type: 'zombie', d: d + 6, x: laneX(L), v: -3, ph: Rn() }); add({ type: 'zombie', d: d + 13, x: laneX(L2), v: -3, ph: Rn() }); cups(d - 6, L3, 6, 3, 0.5); break;
      case 'horde': for (let k = 0; k < 3; k++) add({ type: 'zombie', d: d + 6 + k * 4.5, x: laneX((L + k) % 3), v: -2.6, ph: Rn() }); cups(d + 2, L, 5, 3, 2.2); break;
      case 'chubby': add({ type: 'chubby', d: d + 8, x: laneX(L), v: -1.6, ph: Rn() }); cups(d - 6, L2, 6, 3, 0.5); break;
      case 'hbar': add({ type: 'hbar', d, x: laneX(L) }); add({ type: 'hbar', d, x: laneX(L2) }); cups(d - 6, L, 6, 2.2, 0.3); break;
      case 'plastic': add({ type: 'plastic', d, x: laneX(L) }); add({ type: 'plastic', d: d + 6, x: laneX(L2) }); cups(d - 8, L3, 6, 3, 0.5); break;
      case 'crate': add({ type: 'crate', d, x: laneX(L) }); add({ type: 'crate', d, x: laneX(L2) }); cups(d - 4, L, 4, 1.2, 2.6); break;
      case 'couch': add({ type: 'couch', d, x: laneX(L) }); add({ type: 'trash', d: d + 7, x: laneX(L2) }); cups(d - 8, L, 7, 3, 0.5, 2.3); break;
      case 'taxi': add({ type: 'taxi', d, x: laneX(L) }); add({ type: 'taxi', d: d + 7, x: laneX(L2) }); cups(d - 6, L3, 7, 3, 0.5); break;
      case 'trash': add({ type: 'trash', d, x: laneX(L) }); add({ type: 'trash', d: d + 5, x: laneX(L2) }); add({ type: 'trash', d: d + 10, x: laneX(L3) }); break;
      case 'dash': add({ type: 'dash', d, x: laneX(L) }); cups(d + 4, L, 8, 3.5, 0.5); for (let k = 0; k < 3; k++) if (k !== L) add({ type: 'plastic', d: d + 14, x: laneX(k) }); break;
      case 'spring': add({ type: 'spring', d, x: laneX(L) }); cups(d + 5, L, 8, 3.2, 1.5, 4.2); add({ type: 'taxi', d: d + 14, x: laneX(L) }); break;
      case 'mix': add({ type: 'hbar', d, x: laneX(L) }); add({ type: 'chubby', d: d + 10, x: laneX(L2), v: -1.6, ph: Rn() }); add({ type: 'zombie', d: d + 6, x: laneX(L3), v: -3, ph: Rn() }); break;
      case 'stipend': gotStipend++; add({ type: 'stipend', d, x: laneX(L), h: 1.0 }); for (let k = 0; k < 3; k++) cups(d + 8, k, 8, 2.4, 0.5); break;
      case 'armor': gotArmor++; add({ type: 'armor', d, x: laneX(L) }); for (let k = 0; k < 3; k++) if (k !== L) add({ type: 'plastic', d: d + 18, x: laneX(k) }); add({ type: 'taxi', d: d + 30, x: laneX(L) }); add({ type: 'crate', d: d + 40, x: laneX(L2) }); break;
    }
    d += 34 - (d / BOSS5_AT) * 7 + Rn() * 10;
  }
  return objs.sort((a, b) => a.d - b.d);
}
function collide5(o, R) {
  const air = R.y, rolling = R.roll > 0 && R.y < 0.5;
  switch (o.type) {
    case 'zombie': case 'minion': if (air > 0.7 && R.vy < 2) { runDestroy(o); R.vy = Math.max(R.vy, 11); return true; } return air > 1.7;
    case 'chubby': if (air > 1.0 && R.vy < 0) { R.vy = 13; floatText(SW / 2, SH * 0.5, 'ПРУЖИНИТ!', '#7ea7ff', 20); o.hitDone = true; return true; } return air > 1.9;
    // everything can be jumped; slide and ground pound are the safer ways under/through the tall ones
    case 'hbar': return rolling || air > 1.85;
    case 'plastic': return air > 0.65;
    case 'couch': return air > 0.75;
    case 'crate': return air > 2.0;
    case 'taxi': return air > 1.0;
    case 'trash': return air > 0.5;
    case 'jbarrel': case 'jtires': return air > 0.7;
    case 'jtrash': return rolling || air > 2.3;
    case 'jcouch': return air > 0.9;
    case 'quake': return air > 0.35;
  }
  return undefined;
}
// pickups go through even during the overdose or the taxi ride
function pickup5(o, R) {
  if (o.type === 'stipend') {
    if (Math.abs(R.y - (o.h || 0)) > 2.2) return true;
    o.dead = true; R.magnet = 10; addScore(500);
    banner('СТИПЕНДИЯ!', 'Кофе летит к тебе 10 с', 1.6, 'green'); sfx('power'); sfx('heal');
    return true;
  }
  if (o.type === 'armor') {
    o.dead = true; R.armor = 15; R.inv = 0; addScore(500);
    banner('БРОНЕ-ТАКСИ!', 'Тарань всё 15 с', 1.6, 'red'); sfx('power'); sfx('honk'); G.shake = 9;
    return true;
  }
  return false;
}
const KNIFE_NO5 = { chubby: 'ТОЛСТЫЙ! Бей сверху ↓', crate: 'КРЕПКО! Бей сверху ↓', couch: 'ДИВАН НЕ РЕЖЕТСЯ', taxi: 'ЭТО ТАКСИ!', hbar: 'ПОДКАТ ↓', plastic: 'ПЕРЕПРЫГНИ', jcouch: 'УВЕРНИСЬ!' };

/* ---------- per-frame level logic: the coffee magnet, the taxi ride, phase cards */
function tick5(R) {
  const dt = R.dtLast || 0;
  updateFever(R, dt);
  if (!R.cards && R.t > 0.3 && R.s < 100) { R.cards = 2; banner('АКАДЕМИЧЕСКИЙ ОТПУСК', 'Уровень 5', 1.8, 'green'); }
  if (R.magnet > 0) {
    R.magnet -= dt;
    for (let j = R.i; j < R.objs.length; j++) {
      const o = R.objs[j], dz = o.d - R.s; if (dz > 18) break;
      if (o.type !== 'cup' || o.dead || dz < -1) continue;
      o.x = lerp(o.x, R.x, Math.min(1, dt * 7)); o.h = lerp(o.h, R.y + 0.4, Math.min(1, dt * 7)); o.d -= dt * 9;
      if (o.mesh) placeObj(o);
    }
  }
  if (R.armor > 0) { R.armor -= dt; if (R.armor <= 0) { R.armor = 0; R.inv = 1.2; } }

}
const HINT5 = {
  zombie: ['ЗОМБИ-СТУДЕНТ', 'Прыгни сверху, руби ножом или атакуй в прыжке'],
  chubby: ['СИНИЙ ТОЛСТЯК', 'Нож не берёт! Удар сверху или перепрыгни'],
  hbar: ['ВЫСОКИЙ БАРЬЕР', 'Подкат или высокий прыжок'],
  crate: ['ХРУПКИЕ ЯЩИКИ', 'Слишком высоко — прыгни и бей сверху ↓'],
  couch: ['ДИВАН', 'Перепрыгни'],
  taxi: ['ЖЁЛТОЕ ТАКСИ', 'Объезжай или перепрыгни'],
  stipend: ['ПОВЫШЕННАЯ СТИПЕНДИЯ', 'Хватай — кофе сам полетит к тебе'],
  armor: ['БРОНЕ-ТАКСИ', 'Запрыгивай — 15 секунд неуязвимого тарана'],
};

/* ============================================================ the Troll-mutant boss (3D, three phases in a cycle) */
const TROLL_LINES = {
  intro: 'Соискательница?! Твой автореферат — в спам!',
  throw: ['Лови рецензию!', 'Диван научной школы!', 'Шины от научрука!', 'Держи список литературы — весь!', 'Это тебе от оппонента!'],
  summon: ['Студенты, кто не сдал — за мной!', 'Кафедра, фас!', 'Зачётки к осмотру!'],
  slam: ['ТОПОТ ДИССОВЕТА!', 'Учёный совет постановил: ТОПОТ!'],
  stun: ['Ой… нога застряла в ВАКе…', 'Застрял… как диссер на рецензии…'],
  back: ['Перепиши введение!', 'Вопросы из зала!', 'Где актуальность?!'],
  hurt: ['Ты чего?! Я ж просто троллил!', 'Ай! Это не по ГОСТу!', 'Мой индекс Хирша!', 'Ну хватит, я ж пошутил!', 'Минус в карму!', 'Жалоба в деканат!'],
  dead: 'Ладно… пиши свою диссертацию…',
};
function trollPhase(B, st) {
  const R = G.run;
  B.state = st; B.t = 0; if (st === 'summon') B.chainOpened = false; B.vol = 0; B.atkT = 0.6; B.spawned = false; B.slammed = false; B.chainKills = 0;
  if (st === 'throw') { if (!R.hints.p1) { R.hints.p1 = 1; banner('ФАЗА 1: ХЛАМ', 'Прыгай, подкатывайся, руби', 2, 'green'); } }
  if (st === 'summon') { if (!R.hints.p2) { R.hints.p2 = 1; banner('ФАЗА 2: МИНЬОНЫ', 'Цепочка по зомби — и в Тролля!', 2.2, 'green'); } shawSay(pick(TROLL_LINES.summon)); trollAnim('Wave', true); }
  if (st === 'slam') { if (!R.hints.p3) { R.hints.p3 = 1; banner('ФАЗА 3: ТОПОТ', 'Перепрыгни волну — и удар сверху!', 2.2, 'green'); } shawSay(pick(TROLL_LINES.slam)); }
  if (st === 'stun') { shawSay(pick(TROLL_LINES.stun)); trollAnim('Idle'); }
}
function trollAnim(name, once) { const T = R3E.troll; if (T && T.play) { const a = T.play(name, once, 0.25); if (a && once) a.timeScale = 1.2; } }
function trollThrow(B) {
  const R = G.run, kind = ['jbarrel', 'jtrash', 'jcouch', 'jtires'][(B.vol + B.round) % 4];
  const lanes = [0, 1, 2].sort(() => Math.random() - 0.5), n = B.hp <= 2 ? (Math.random() < 0.6 ? 2 : 1) : (Math.random() < 0.3 ? 2 : 1), d = R.s + B.z - 2;
  if (B.vol === 0 || Math.random() < 0.35) shawSay(pick(TROLL_LINES.throw));
  trollAnim('Punch', true);
  for (let i = 0; i < n; i++) {
    const x = laneX(lanes[i]);
    if (kind === 'jbarrel' || kind === 'jtires') R.objs.push({ type: kind, d: d - i * 2, x, h: 0, v: -12 });
    else if (kind === 'jtrash') R.objs.push({ type: 'jtrash', d: d - i * 3, x, h: 1.5, v: -11 });
    else R.objs.push({ type: 'jcouch', d: R.s + 15 + i * 3, x, h: 0, fall: 10, ft: 0 });
  }
  R.objs.sort((a, b) => a.d - b.d); R.i = 0;
  sfx('throw');
}
function trollUpdate(B, dt) {
  const R = G.run;
  B.x = lerp(B.x, 0, Math.min(1, dt * 2)); B.aimH = 4.6;
  switch (B.state) {
    case 'enter':
      B.z = lerp(B.z, 22, Math.min(1, dt * 1.4)); B.h = 0;
      if (B.t > 2.6) { if (B.round === 0) shawSay(TROLL_LINES.intro); trollPhase(B, 'throw'); }
      break;
    case 'throw':
      B.z = lerp(B.z, 22, Math.min(1, dt * 2));
      B.atkT -= dt;
      if (B.atkT <= 0) {
        if (B.vol >= (B.hp <= 2 ? 5 : 4)) trollPhase(B, 'summon');
        else { trollThrow(B); B.vol++; B.atkT = B.hp <= 2 ? 1.15 : 1.45; }
      }
      break;
    case 'summon': {
      B.z = lerp(B.z, 27, Math.min(1, dt * 2));
      if (!B.spawned && B.t > 0.9) {
        B.spawned = true;
        const n = B.hp <= 2 ? 5 : 4;
        for (let k = 0; k < n; k++) R.objs.push({ type: 'minion', d: R.s + 10 + k * 4.5, x: laneX((k * 2 + B.round) % 3), h: 0, v: -1.5, ph: Math.random(), minion: true });
        R.objs.sort((a, b) => a.d - b.d); R.i = 0;
        trollAnim('Idle');
      }
      if (B.homable) { B.chainT -= dt; if (B.chainT <= 0) B.homable = false; }
      const alive = R.objs.some((o) => o.minion && !o.dead && o.d > R.s - 1);
      if (B.spawned && !alive && !B.homable && !B.chainOpened && (B.chainKills || 0) >= 2) { B.homable = true; B.chainT = 2.4; }
      if (B.homable) B.chainOpened = true;
      if ((B.spawned && !alive && !B.homable) || B.t > 9) { B.homable = false; trollPhase(B, 'slam'); }
      break;
    }
    case 'slam':
      B.z = lerp(B.z, 15, Math.min(1, dt * 2));
      if (!B.slammed && B.t > 1.0) {
        B.slammed = true; trollAnim('Jump_Land', true); G.shake = 14; sfx('boom');
        for (let k = 0; k < 3; k++) R.objs.push({ type: 'quake', d: R.s + B.z - 3, x: laneX(k), h: 0, v: -15 });
        R.objs.sort((a, b) => a.d - b.d); R.i = 0;
      }
      if (B.t > 1.9) trollPhase(B, 'stun');
      break;
    case 'stun':
      B.z = lerp(B.z, 7.5, Math.min(1, dt * 2.5));
      if (B.t > (B.hp <= 2 ? 3.2 : 4.0)) { B.round++; shawSay(pick(TROLL_LINES.back)); trollPhase(B, 'throw'); }
      break;
    case 'hurt':
      B.z = lerp(B.z, 18, Math.min(1, dt * 2));
      if (B.t > 1.0) trollPhase(B, B.next || 'throw');
      break;
    case 'dead':
      B.z += dt * 3;
      if (B.t > 2.8 && !R.end) runFinish();
      break;
  }
}
function trollHit(kind) {
  const R = G.run, B = R.boss; if (!B || B.state === 'dead') return;
  B.hp--; B.flash = 0.4; B.homable = false; G.shake = 14; sfx('boom'); G.hitStop = 0.12;
  const q = runProj(B.x, B.h + 4, B.z + RUN.PZ);
  burst(q.sx, q.sy, 22, { type: 'star', col: pick(['#ffd43b', '#fff', '#9dff6a']), smin: 120, smax: 420, lmin: 0.5, lmax: 0.9, rmin: 5, rmax: 10 });
  addScore(1500, q.sx, q.sy);
  floatText(q.sx, q.sy - 60, kind === 'pound' ? 'УДАР СВЕРХУ!' : 'ЦЕПОЧКА В ТРОЛЛЯ!', '#ffd43b', 28);
  if (B.hp <= 0) {
    B.state = 'dead'; B.t = 0; trollAnim('Death', true); shawSay(TROLL_LINES.dead, 'trollFace3'); addScore(10000, q.sx, q.sy - 40); Sound.music(null);
    R.splats = []; for (let i = 0; i < 7; i++) R.splats.push({ x: rand(0.1, 0.9) * SW, y: rand(0.1, 0.8) * SH, r: rand(30, 70), col: pick(['#9dff6a', '#ffd43b', '#9dff6a']), t: 0 });
    return;
  }
  // a hit: the troll's balloon shows one of the classic meme faces
  trollAnim('HitReact', true); shawSay(pick(TROLL_LINES.hurt), 'trollFace' + (1 + Math.floor(Math.random() * 6)));
  B.state = 'hurt'; B.t = 0; B.next = kind === 'chain' ? 'slam' : 'throw'; if (kind === 'pound') B.round++;
}
// the chain: minions broken by homing dashes (at least two) open a dash into the troll once the wave is gone
function onChain5(o) {
  const R = G.run, B = R.boss;
  if (!B || !o.minion || B.state !== 'summon') return;
  B.chainKills = (B.chainKills || 0) + 1;
  if (B.chainKills < 2 || R.objs.some((m) => m.minion && !m.dead && m.d > R.s - 1)) return;
  B.homable = true; B.chainT = 2.4;
}
function onPound5(R) { const B = R.boss; if (B && B.state === 'stun' && B.z < 11) trollHit('pound'); }

/* ============================================================ 3D: zombie city theme, props, models */
function trollFrame(t) {
  const R = G.run, B = R.boss;
  if (!B) { if (R3E.troll) R3E.troll.root.visible = false; return; }
  if (!R3E.troll) { R3E.troll = zkMake('troll', 5.2, { anim: 'Idle' }); if (!R3E.troll) return; R3.scene.add(R3E.troll.root); }
  const T = R3E.troll, F = frameAt(R.s + B.z);
  T.root.visible = true;
  T.root.position.copy(F.p).addScaledVector(F.r, B.x).addScaledVector(F.u, B.h);
  orient(T.root, F);
  const sq = B.state === 'stun' ? 0.82 + Math.sin(t * 6) * 0.02 : 1;
  T.root.scale.set(1, sq, 1);
  T.root.traverse((m) => { if (m.isMesh && m.material) m.material.emissive && m.material.emissive.setScalar(B.flash > 0 && Math.floor(B.flash * 20) % 2 ? 0.5 : 0); });
}
function makeObj5(o, g, add) {
  const G3 = R3.geo, M = R3.mat;
  const kit = (key, size, opts) => { const z = zkMake(key, size, opts); if (z) { g.add(z.root); if (z.mixer) g.userData.mixer = z.mixer; g.userData.zk = z; } return z; };
  const box = (col, sx, sy, sz, y) => add(G3.box, new THREE.MeshLambertMaterial({ color: col }), sx, sy, sz, 0, y, 0);
  const label = (txt, col, y) => {
    const tex = R3.tex['lbl5_' + txt] || (R3.tex['lbl5_' + txt] = canvasTex(256, 64, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.strokeStyle = '#16121f'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = '#fff'; c.font = '900 30px Nunito, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, w / 2, h / 2 + 2); }));
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex })); sp.scale.set(2.2, 0.55, 1); sp.position.y = y; g.add(sp); return sp;
  };
  switch (o.type) {
    case 'zombie': case 'minion': { const z = kit('zombie', 1.75, { anim: 'Run', phase: (o.ph || 0) * 2 }); if (!z) box('#6fbf4f', 0.7, 1.7, 0.5, 0.85); break; }
    case 'chubby': { const z = kit('chubby', 2.1, { anim: 'Walk', phase: (o.ph || 0) * 2 }); if (!z) box('#4a5fd0', 1.2, 2.0, 0.9, 1.0); break; }
    case 'hbar': {
      const z = kit('barrierHigh', 1.8, { by: 'len' });
      if (z) z.root.position.y = 1.15; else box('#ff7a1a', 1.9, 0.5, 0.2, 1.5);
      for (const sx of [-0.95, 0.95]) add(G3.box, M.dark, 0.12, 2.0, 0.12, sx, 1.0, 0);
      label('ПОДКАТ ↓ / ПРЫЖОК', '#e8590c', 2.45);
      break;
    }
    case 'plastic': { if (!kit('plastic', 1.9, { by: 'len' })) box('#ffd43b', 1.8, 0.8, 0.5, 0.4); break; }
    case 'couch': { if (!kit('couch', 2.1, { by: 'len' })) box('#e0b030', 2.0, 0.9, 0.9, 0.45); break; }
    case 'jcouch': {
      const z = kit('couch', 2.1, { by: 'len' });
      const ring = new THREE.Mesh(G3.disc, new THREE.MeshBasicMaterial({ color: '#ff3040', transparent: true, opacity: 0.45, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; ring.userData.isOutline = true; g.add(ring);
      g.userData.upd = (oo, t) => { const k = oo.ft === undefined ? 1 : oo.ft; if (z) { z.root.position.y = lerp(oo.fall || 0, 0, k); z.root.rotation.z = (1 - k) * 2.5; } ring.visible = k < 1; ring.scale.setScalar(0.5 + k * 0.7); };
      break;
    }
    case 'crate': {
      const P = ZK.models.pallet;
      for (let k = 0; k < 5; k++) { const z = zkMake('pallet', 1.7, { by: 'len' }); if (!z) { box('#c9a26a', 1.6, 2.3, 1.2, 1.15); break; } z.root.position.y = k * (P ? (P.size.y * 1.7) / Math.max(P.size.x, P.size.z) : 0.25) * 1.0; z.root.rotation.y = k * 0.15; g.add(z.root); }
      label('ВЫСОКО! БЕЙ СВЕРХУ ↓', '#c92a2a', 2.75);
      break;
    }
    case 'taxi': { if (!kit('taxi', 3.8, { by: 'len', turn: Math.PI })) box('#ffcf33', 1.7, 1.2, 3.4, 0.6); break; }
    case 'armor': {
      if (!kit('armored', 4.0, { by: 'len', turn: Math.PI })) box('#c9a227', 1.8, 1.3, 3.6, 0.65);
      label('САДИСЬ!', '#2b8a3e', 2.6);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: R3E.lampGlow.map, color: '#7dff9a', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); gl.scale.set(5, 3, 1); gl.position.y = 1; g.add(gl);
      break;
    }
    case 'trash': { if (!kit('trash', 0.8)) box('#222', 0.8, 0.7, 0.8, 0.35); break; }
    case 'jbarrel': { const z = kit('barrel', 1.1); g.userData.upd = (oo, t) => { if (z) z.root.rotation.x = t * 8; }; if (!z) box('#2a5d8a', 0.8, 1.1, 0.8, 0.55); break; }
    case 'jtires': { const z = kit('tires', 1.0); g.userData.upd = (oo, t) => { if (z) z.root.rotation.y = t * 6; }; if (!z) box('#222', 1, 1, 1, 0.5); break; }
    case 'jtrash': { const z = kit('trash', 0.9); g.userData.upd = (oo, t) => { if (z) { z.root.rotation.z = t * 5; z.root.rotation.x = t * 3; } }; if (!z) box('#222', 0.8, 0.8, 0.8, 0); break; }
    case 'quake': {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.22, 6, 20, Math.PI), new THREE.MeshBasicMaterial({ color: '#ffd43b' }));
      w.rotation.y = Math.PI / 2; w.scale.set(1, 0.7, 1); g.add(w);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: R3E.lampGlow.map, color: '#ffb347', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); gl.scale.set(2.6, 1.2, 1); gl.position.y = 0.3; g.add(gl);
      break;
    }
    case 'stipend': {
      const tex = R3.tex.stipend || (R3.tex.stipend = spriteTex(200, 200, (c) => {
        c.translate(100, 100);
        c.fillStyle = '#ffd43b'; c.strokeStyle = '#16121f'; c.lineWidth = 7; c.beginPath(); c.arc(0, 0, 80, 0, TAU); c.fill(); c.stroke();
        c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 64, 0, TAU); c.stroke();
        c.fillStyle = '#16121f'; c.font = '900 64px Nunito, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('₽', 0, -6);
        c.font = '900 22px Nunito, Arial'; c.fillText('↑ СТИП', 0, 44);
      }));
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex })); sp.scale.set(1.4, 1.4, 1); g.add(sp);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: R3E.lampGlow.map, color: '#ffe066', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); gl.scale.set(3, 3, 1); g.add(gl);
      g.userData.upd = (oo, t) => { sp.material.rotation = Math.sin(t * 3) * 0.3; gl.material.opacity = 0.6 + Math.sin(t * 8) * 0.3; };
      break;
    }
  }
}
// sidewalk props from the kit: bins, tyres, hydrants, containers, traffic lights, water towers far away
function decor5(g, d0, d1, rnd, edge) {
  if (ZK.state !== 'ready') return;
  const T = R3.track, keys = ['trash', 'tires', 'hydrant', 'container', 'light', 'lamp', 'barrel', 'cone'];
  for (let k = 0; k < 7; k++) {
    const d = Math.floor(d0 + rnd() * 100), U = T.U[d];
    if (!U || T.seg[d] === 'loop' || Math.abs(U.y) < 0.9) continue;
    const s = rnd() < 0.5 ? -1 : 1, key = keys[Math.floor(rnd() * keys.length)];
    const size = { trash: 0.8, tires: 1.0, hydrant: 0.8, container: 2.6, light: 5.2, lamp: 5.5, barrel: 1.1, cone: 0.7 }[key];
    const z = zkMake(key, size, { shadow: false }); if (!z) continue;
    const R = T.R[d].clone(); R.y = 0; R.normalize();
    const pos = T.P[d].clone().addScaledVector(R, s * (edge + 0.8 + rnd() * 1.4));
    z.root.position.set(pos.x, T.P[d].y, pos.z); z.root.rotation.y = rnd() * TAU;
    if (key === 'light' || key === 'lamp') z.root.rotation.y = Math.atan2(-s * R.x, -s * R.z) + Math.PI / 2;
    g.add(z.root);
  }
  if (rnd() < 0.5) {
    const d = Math.floor(d0 + rnd() * 100), z = zkMake('tower', 18, { shadow: false });
    if (z && T.P[d]) { const R = T.R[d].clone(); R.y = 0; R.normalize(); const pos = T.P[d].clone().addScaledVector(R, (rnd() < 0.5 ? -1 : 1) * (45 + rnd() * 30)); z.root.position.set(pos.x, -7, pos.z); g.add(z.root); }
  }
}
function frame5(dt, t, F) {
  const R = G.run, D = R3.duck;
  for (const o of R3.live) if (o.mesh && o.mesh.userData.mixer) o.mesh.userData.mixer.update(dt * (o.type === 'chubby' ? 0.8 : 1));
  if (R3E.troll && R3E.troll.mixer) R3E.troll.mixer.update(dt);
  trollFrame(t);
  // the armoured taxi ride: the duck sits on the roof
  if (R.armor > 0) {
    if (!R3E.ride) R3E.ride = zkMake('armored', 4.2, { by: 'len', turn: Math.PI });
    if (R3E.ride && R3E.ride.root.parent !== D.root) D.root.add(R3E.ride.root);
    if (R3E.ride) { R3E.ride.root.visible = true; D.body.position.y += 1.25; R3E.ride.root.position.y = -0.0; }
  } else if (R3E.ride) R3E.ride.root.visible = false;
}
const THEME5 = {
  fog: '#57634f', near: 45, far: 210, sun: 0.85, hemi: 0.5, sunCol: '#ffcf9a', houses: '#a3ab98', ground: '#4b5046',
  sky: () => canvasTex(4, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#231d38'); g.addColorStop(0.4, '#5d4f73'); g.addColorStop(0.5, '#b89a5e'); g.addColorStop(1, '#6f7a5e'); c.fillStyle = g; c.fillRect(0, 0, w, h); }),
};

/* ============================================================ 2D: overlay (timers, chain & stun targets) and the ending */
function overlay5(c, t) {
  overlay4(c, t);
  const R = G.run, B = R.boss;
  // bonus timers sit on the left under the coffee counter, away from the banners in the middle
  c.textAlign = 'left'; c.textBaseline = 'middle';
  let y = 150;
  if (R.magnet > 0) { c.font = '20px ' + FONT_DISPLAY; otext(c, '₽ СТИПЕНДИЯ ' + Math.ceil(R.magnet), 18, y, '#ffd43b', 5); y += 28; }
  if (R.armor > 0) { c.font = '20px ' + FONT_DISPLAY; otext(c, 'БРОНЕ-ТАКСИ ' + Math.ceil(R.armor), 18, y, '#9dff6a', 5); }
  c.textAlign = 'center';
  if (B && (B.homable || B.state === 'stun')) {
    const q = runProj3(B.x, B.h + 4.6, B.z + RUN.PZ);
    if (q.sx > -100) {
      drawReticle(c, q.sx, q.sy, Math.max(30, q.k * 1.6), t);
      c.font = '26px ' + FONT_DISPLAY;
      const msg = B.homable ? (R.y > 0.25 ? 'ЖМИ ПРЫЖОК — В ТРОЛЛЯ!' : 'ПРЫГАЙ!') : R.y > 0.6 ? 'ВНИЗ — УДАР СВЕРХУ!' : 'ПРЫГАЙ И БЕЙ СВЕРХУ!';
      if (Math.floor(t * 4) % 2) otext(c, msg, q.sx, q.sy - Math.max(60, q.k * 2.6), '#ffe14d', 7);
    }
  }
}
function drawTroll2D(c, x, y, S, t, B) {
  c.save(); c.translate(x, y); const s = S / 200; c.scale(s, s);
  P(c); ell(c, 0, -90, 70, 90); fs(c, '#e9b62e', 4);
  P(c); ell(c, 0, -170, 40, 34); fs(c, '#f0c040', 4);
  eye(c, -14, -178, 8, 0, 0.1, -1.2, '#c4141f'); eye(c, 14, -178, 8, 0, 0.1, 1.2, '#c4141f');
  P(c); c.rect(-60, -40, 120, 36); fs(c, '#2f4f6f', 3);
  c.restore();
}
function drawEnd5(c, t) {
  const g = c.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#5b7fd6'); g.addColorStop(0.6, '#ffc58a'); g.addColorStop(1, '#ffe2b8');
  c.fillStyle = g; c.fillRect(0, 0, SW, SH);
  const Rr = mulberry(55);
  for (let x = -20; x < SW;) { const w = 60 + Rr() * 70, h = 90 + Rr() * 180; c.fillStyle = Rr() < 0.5 ? '#6c6aa6' : '#7b78b3'; c.fillRect(x, SH - 90 - h, w, h); for (let wy = SH - 80 - h; wy < SH - 100; wy += 18) for (let wx = x + 8; wx < x + w - 10; wx += 16) { c.fillStyle = Rr() < 0.5 ? '#ffe7a3' : '#4b4a7a'; c.fillRect(wx, wy, 8, 10); } x += w + 6; }
  c.fillStyle = '#5a5f6b'; c.fillRect(0, SH - 90, SW, 90); c.fillStyle = '#ffd43b'; for (let x = 20; x < SW; x += 90) c.fillRect(x, SH - 46, 46, 6);
  // the troll snoozes on the road
  c.save(); c.translate(SW * 0.76, SH - 70); c.rotate(-1.3); drawTroll2D(c, 0, 0, 120, t, {}); c.restore();
  c.font = '30px ' + FONT_DISPLAY; c.textAlign = 'center'; c.fillStyle = '#16121f';
  for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; c.globalAlpha = 1 - k; c.fillText('z', SW * 0.82 + k * 40, SH - 170 - k * 60 - i * 6); } c.globalAlpha = 1;
  // the students are back at their lectures
  c.save(); c.translate(SW * 0.56, SH - 150); c.rotate(0.04);
  P(c); rr(c, -120, -28, 240, 56, 8); fs(c, '#fffaf0', 4); c.font = '900 19px ' + FONT_UI; c.fillStyle = '#c92a2a'; c.textBaseline = 'middle'; c.fillText('СТУДЕНТЫ — НА ПАРЫ!', 0, 2); c.restore();
  const bob = Math.abs(Math.sin(t * 4)) * 40;
  drawDuckHero(c, SW * 0.34, SH - 200 - bob, t, { h: 210, flapSpeed: 16, tilt: Math.sin(t * 4) * 0.08 });
  const cat = IMG.catTrolling, et = G.run && G.run.end ? G.run.end.t : 3;
  if (cat && et > 1.6) {
    const k = easeOut(clamp((et - 1.6) / 0.45, 0, 1)), ch = Math.min(220, SH * 0.42), cw = (cat.width * ch) / cat.height;
    c.save(); c.translate(SW * 0.8, SH * 0.36); c.rotate(0.06 + (1 - k) * 0.6); c.scale(0.3 + 0.7 * k, 0.3 + 0.7 * k); c.globalAlpha = k;
    c.fillStyle = 'rgba(22,18,31,0.85)'; c.fillRect(-cw / 2 - 6, -ch / 2 - 6, cw + 24, ch + 24);
    c.fillStyle = '#fff'; c.fillRect(-cw / 2 - 12, -ch / 2 - 12, cw + 24, ch + 24); c.lineWidth = 4; c.strokeStyle = '#16121f'; c.strokeRect(-cw / 2 - 12, -ch / 2 - 12, cw + 24, ch + 24);
    c.drawImage(cat, -cw / 2, -ch / 2, cw, ch); c.restore();
  }
  for (let i = 0; i < 16; i++) { const x = ((i * 137 + t * 90) % SW), y = ((i * 71 + t * 120) % SH); P(c); starPath(c, x, y, 6, 2.5); c.fillStyle = ['#ffd43b', '#9dff6a', '#7ee7f2'][i % 3]; c.fill(); }
}

/* ---------- the run config for level 5 */
const RUN_CFG5 = Object.assign({}, RUN_CFG4, {
  evo: 2, bossAt: BOSS5_AT, surfaces: [[0, 'city']], build: buildTrack5, plan: () => TRACK_PLAN5,
  bossName: 'Тролль-мутант', bossLabel: 'АКАДЕМИЧЕСКИЙ ТРОЛЛЬ', voice: 'drone', lines: TROLL_LINES, bossHp: 6,
  drawBoss: drawTroll2D, drawEnd: drawEnd5, endSay: 'Тролль повержен! Теперь можно спокойно дописывать диссертацию!', deathFx: 'paper',
  ctxHints: { plastic: ['jump', 'ПРЫЖОК', isTouch ? 'Кнопка «Прыжок» справа внизу' : 'Стрелка вверх или Пробел'], trash: ['jump', 'ПРЫЖОК', isTouch ? 'Кнопка «Прыжок» справа внизу' : 'Стрелка вверх или Пробел'], hbar: ['roll', 'ПОДКАТ', isTouch ? 'Свайп вниз — проскочи под планкой' : 'Стрелка вниз — проскочи под планкой'], zombie: ['knife', 'НОЖ', isTouch ? 'Кнопка «Нож» — руби врагов' : 'F или клик мышью — руби врагов'], chubby: ['homing', 'АТАКА В ПРЫЖКЕ', isTouch ? 'В прыжке нажми «Прыжок» ещё раз — бросок на врага' : 'В прыжке нажми прыжок ещё раз — бросок на врага'], crate: ['pound', 'УДАР СВЕРХУ', isTouch ? 'В прыжке свайп вниз — ломает ящики' : 'В прыжке стрелка вниз — ломает ящики'] },
  targets: ['zombie', 'minion', 'chubby'], collide: collide5, tick: tick5, pickup: pickup5, knifeNo: KNIFE_NO5,
  floatTypes: ['stipend', 'jtrash'], moveTypes: ['zombie', 'minion', 'chubby', 'jbarrel', 'jtires', 'jtrash', 'jcouch', 'quake'], bounce: [], bounceH: {},
  openPhase: null, updOpen: null, bossUpdate: trollUpdate, bossHit: () => { const B = G.run.boss; if (B && B.homable) trollHit('chain'); }, boss3d: trollFrame,
  onChain: onChain5, onPound: onPound5, overlay: overlay5, theme: THEME5, decor: decor5, frame3d: frame5,
});
