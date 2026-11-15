/* ============================================================ duck level 6: «Курсач в Кубе»
   Instead of writing her architecture coursework Ilona installed a pirated cube game and fell into it.
   Built on the level 4/5 engine (toon light, the juice controller) with the Cube World Kit models (Quaternius, CC0).
   The world is its own chunk builder (block road, terraces, cube trees, dirt huts), the loot is diamonds, ingots and
   golden keys, a chest is a loot magnet, a minecart is a ride. Enemies: skeletons that throw bones and swords,
   goblins that blow up into dirt blocks, demons and an ice yeti (ground pound only), peaceful sheep, pigs and
   a chicken that bounces the duck up to a sky line of diamonds. Boss: the Head Moderator in 3 phases. */
LEVEL_INFO[6].duck = { name: 'Курсач в Кубе', boss: 'moderator', song: 'sky2' };
const LEVEL6_DUCK = [];
const TRACK_PLAN6 = [
  ['straight', 80], ['curve', 130, 0.8], ['hill', 110, 0.14], ['straight', 50], ['scurve', 170, -0.7], ['straight', 60], ['hill', 120, 0.16], ['curve', 140, -0.9], ['straight', 50],
  ['loop', 90], ['straight', 60], ['scurve', 170], ['hill', 110, 0.15], ['curve', 130, 1], ['straight', 60], ['curve', 140, -0.8], ['hill', 120, 0.14], ['straight', 50], ['scurve', 170, 0.8], ['straight', 90],
];
const BOSS6_AT = 2100;
const SURFACES6 = [[0, 'c_grass'], [520, 'c_stone'], [1060, 'c_brick'], [1560, 'c_cheese']];
Object.assign(SURF_NAME, { c_grass: ['КУБИЧЕСКАЯ ПОЛЯНА', ''], c_stone: ['БУЛЫЖНАЯ ШАХТА', ''], c_brick: ['КИРПИЧНЫЙ ПОСЁЛОК', ''], c_cheese: ['СЫРНАЯ ДОЛИНА', 'Да, дорога из сыра'] });
const KEYS6 = 3;

/* ---------- the track */
function buildTrack6() {
  const Rn = mulberry(606), objs = [];
  const add = (o) => objs.push(Object.assign({ x: 0, h: 0, dead: false }, o));
  const loot = (d0, lane, n, gap, h, arc) => { for (let i = 0; i < n; i++) add({ type: 'cup', kind: i % 4 === 3 ? 'ingot' : 'gem', d: d0 + i * gap, x: laneX(lane), h: h + (arc ? Math.sin((i / Math.max(1, n - 1)) * Math.PI) * arc : 0) }); };
  const rails = (a, b, lane) => { for (let d = a; d <= b; d += 2.1) add({ type: 'rail', d, x: laneX(lane) }); };
  const blk = (d, lane) => add({ type: 'blk', d, x: laneX(lane), k: { c_grass: 'bDirt', c_stone: 'bStone', c_brick: 'bBrick', c_cheese: 'bCheese' }[surfaceAt(d)] });
  let d = 60, chests = 0, rides = 0, hens = 0, keys = 0;
  const loopsDone = new Set();
  while (d < BOSS6_AT - 70) {
    const lr = planRanges().find(([a, b, ty]) => ty === 'loop' && d > a - 22 && d < b + 10);
    if (lr) { if (!loopsDone.has(lr[0])) { loopsDone.add(lr[0]); loot(lr[0] - 6, 1, Math.floor((lr[1] - lr[0] + 6) / 3), 3, 0.5); } d = lr[1] + 14; continue; }
    let pool = d < 240 ? ['line', 'blocks', 'sheep', 'gate', 'skel'] : d < 520 ? ['blocks', 'gate', 'skel', 'gob', 'sheep', 'bamboo', 'mush', 'line']
      : ['blocks', 'gate', 'skel', 'skelA', 'gob', 'gobs', 'demon', 'yeti', 'sheep', 'pig', 'bamboo', 'wall', 'cart', 'mush', 'dash', 'mix1', 'mix2'];
    if (d > 300 && hens < 4 && d > 300 + hens * 430) pool = ['chicken'];
    else if (d > 420 && chests < 3 && d > 420 + chests * 540) pool = ['chest'];
    else if (d > 760 && rides < 2 && d > 760 + rides * 700) pool = ['ride'];
    const pat = pool[Math.floor(Rn() * pool.length)], L = Math.floor(Rn() * 3), L2 = (L + 1 + Math.floor(Rn() * 2)) % 3, L3 = 3 - L - L2;
    let extra = 0;
    switch (pat) {
      case 'line': loot(d, L, 9, 2.6, 0.5); add({ type: 'dash', d: d - 5, x: laneX(L) }); break;
      case 'blocks': blk(d, L); blk(d + 6, L2); loot(d - 8, L, 7, 3, 0.5, 2.3); break;
      case 'gate': add({ type: 'gate', d, x: laneX(L) }); add({ type: 'gate', d, x: laneX(L2) }); loot(d - 6, L, 6, 2.2, 0.3); break;
      case 'skel': add({ type: 'skel', d: d + 10, x: laneX(L), cd: 0.3 }); loot(d - 6, L2, 6, 3, 0.5); break;
      case 'skelA': add({ type: 'skelA', d: d + 10, x: laneX(L), cd: 0.3 }); blk(d + 4, L3); loot(d - 6, L2, 6, 3, 0.5); break;
      case 'gob': add({ type: 'gob', d: d + 8, x: laneX(L), v: -2.5, ph: Rn() }); add({ type: 'gob', d: d + 16, x: laneX(L2), v: -2.5, ph: Rn() }); loot(d - 6, L3, 6, 3, 0.5); break;
      case 'gobs': for (let k = 0; k < 3; k++) add({ type: 'gob', d: d + 6 + k * 5, x: laneX((L + k) % 3), v: -2.2, ph: Rn() }); loot(d + 2, L, 5, 3, 2.2); break;
      case 'demon': add({ type: 'demon', d: d + 8, x: laneX(L), v: -1.4, ph: Rn() }); loot(d - 6, L2, 6, 3, 0.5); break;
      case 'yeti': add({ type: 'yeti', d: d + 12, x: laneX(L), cd: 0.2 }); loot(d - 6, L2, 6, 3, 0.5); break;
      case 'sheep': add({ type: 'sheep', d, x0: 0, amp: 2.2, w: 1.3, ph: Rn() * TAU }); loot(d - 8, 1, 7, 3, 0.5, 2.2); break;
      case 'pig': add({ type: 'pig', d, x0: 0, amp: 2.2, w: 1.6, ph: Rn() * TAU }); add({ type: 'sheep', d: d + 9, x0: 0, amp: 2.2, w: 1.2, ph: Rn() * TAU }); loot(d - 6, L, 5, 3, 0.5); break;
      case 'chicken': {
        hens++; add({ type: 'chicken', d, x0: laneX(L), amp: 0.35, w: 3, ph: Rn() * TAU });
        // the sky line: only a bounce off the chicken gets up there
        for (let i = 0; i < 9; i++) {
          const o = { d: d + 3 + i * 2.5, x: laneX(L), h: 1.8 + Math.sin((i / 8) * Math.PI) * 4.6 };
          if (i === 4 && keys < KEYS6) { keys++; add(Object.assign(o, { type: 'gkey' })); } else add(Object.assign(o, { type: 'cup', kind: 'gem' }));
        }
        break;
      }
      case 'bamboo': add({ type: 'bamboo', d, x: laneX(L) }); add({ type: 'bamboo', d, x: laneX(L2) }); loot(d + 2.5, L, 5, 2.6, 0.5); break;
      case 'wall': add({ type: 'wall', d, x: laneX(L) }); add({ type: 'wall', d, x: laneX(L2) }); loot(d - 3, L, 4, 1.2, 3.5); break;
      case 'cart': rails(d - 8, d + 20, L); add({ type: 'mcart', d: d + 18, x: laneX(L), v: -6 }); loot(d - 6, L3, 7, 3, 0.5); break;
      case 'mush': add({ type: 'spring', d, x: laneX(L) }); loot(d + 5, L, 8, 3.2, 1.5, 4.2); add({ type: 'wall', d: d + 14, x: laneX(L) }); break;
      case 'dash': add({ type: 'dash', d, x: laneX(L) }); loot(d + 4, L, 8, 3.5, 0.5); for (let k = 0; k < 3; k++) if (k !== L) blk(d + 14, k); break;
      case 'mix1': add({ type: 'gate', d, x: laneX(L) }); add({ type: 'demon', d: d + 10, x: laneX(L2), v: -1.4, ph: Rn() }); add({ type: 'skel', d: d + 8, x: laneX(L3), cd: 0.5 }); break;
      case 'mix2': add({ type: 'yeti', d: d + 14, x: laneX(L), cd: 0.4 }); add({ type: 'gob', d: d + 6, x: laneX(L2), v: -2.5, ph: Rn() }); add({ type: 'sheep', d: d + 24, x0: 0, amp: 2.2, w: 1.3, ph: Rn() * TAU }); break;
      case 'chest': chests++; add({ type: 'chest', d, x: laneX(L) }); for (let k = 0; k < 3; k++) loot(d + 8, k, 8, 2.4, 0.5); break;
      case 'ride':
        rides++; rails(d - 6, d + 12, L); add({ type: 'ride', d, x: laneX(L) });
        for (let k = 0; k < 3; k++) blk(d + 22, k);
        add({ type: 'gob', d: d + 32, x: laneX(L2), v: -2, ph: Rn() }); add({ type: 'wall', d: d + 40, x: laneX(L) }); add({ type: 'demon', d: d + 50, x: laneX(L3), v: -1.4, ph: Rn() });
        for (let k = 0; k < 3; k++) loot(d + 26, k, 6, 4, 0.5);
        extra = 26; break;
    }
    d += 34 - (d / BOSS6_AT) * 7 + Rn() * 10 + extra;
  }
  return objs.sort((a, b) => a.d - b.d);
}
const PEACEFUL6 = ['sheep', 'pig', 'chicken'];
function collide6(o, R) {
  const air = R.y, rolling = R.roll > 0 && R.y < 0.5, stomp = air > 0.7 && R.vy < 2;
  const say = (txt, col) => { const q = runProj(o.x, (o.h || 0) + 1.6, o.d - R.s + RUN.PZ); floatText(q.sx, q.sy - 20, txt, col || '#fff', 22); };
  switch (o.type) {
    case 'rail': return true;
    case 'skel': case 'skelA': case 'gob': if (stomp) { runDestroy(o); R.vy = Math.max(R.vy, 11); return true; } return air > 1.9;
    // the big ones: only a ground pound breaks them; a plain landing bounces off
    case 'demon': case 'yeti':
      if (R.slam) { runDestroy(o); R.vy = 9; say(o.type === 'yeti' ? 'ЛЁД РАЗБИТ!' : 'БАЦ!', '#7ee7f2'); addScore(300); G.shake = Math.max(G.shake, 10); return true; }
      if (air > 1.0 && R.vy < 0) { R.vy = 13; say('ПРУЖИНИТ!', '#7ea7ff'); return true; }
      return air > 2.3;
    case 'sheep': case 'pig':
      if (air > 0.5 && R.vy < 2) { R.vy = 12; o.boing = 0.3; say(o.type === 'sheep' ? 'БЕ-Е!' : 'ХРЮ!', '#ffd8e8'); sfx('pop'); return true; }
      return air > 0.9;
    case 'chicken':
      if (air > 0.4 && R.vy < 2) { R.vy = 24; R.dj = false; o.boing = 0.4; say('КУД-КУДАХ!', '#fff27a'); sfx('quack2'); sfx('power'); return true; }
      if (!o.clucked) { o.clucked = true; say('ко-ко?', '#fff'); }
      return true;
    case 'blk': case 'dirtf': case 'chunkf': case 'jblk': return air > 0.85;
    case 'wall': if (R.slam) { runDestroy(o); R.vy = 8; return true; } return air > 2.7;
    case 'gate': return rolling || air > 2.5;
    case 'bamboo': return air > 3.4;
    case 'mcart': return air > 1.0;
    case 'bone': return air > 0.55;
    case 'sword': case 'snow': case 'jtool': return rolling || air > 2.3;
    case 'jtree': return rolling || air > 2.7;
  }
  return undefined;
}
function chestOpen6(o) {
  const R = G.run; if (o.opened) return; o.opened = true;
  R.magnet = 10; addScore(500);
  banner('ЛУТБОКС!', 'Алмазы и слитки летят к тебе 10 с', 1.6, 'green'); sfx('power'); sfx('heal');
}
// pickups and harmless things go through even during the overdose or the minecart ride
function pickup6(o, R) {
  switch (o.type) {
    case 'rail': return true;
    case 'gkey': {
      if (Math.abs(R.y - (o.h || 0)) > 2.2) return true;
      o.dead = true; R.keys = (R.keys || 0) + 1; addScore(1000); sfx('power'); sfx('heal');
      const q = runProj(o.x, o.h, RUN.PZ);
      burst(q.sx, q.sy, 10, { type: 'star', col: '#ffd43b', smin: 80, smax: 240, lmin: 0.4, lmax: 0.8, rmin: 4, rmax: 8 });
      if (R.keys >= KEYS6) { if (G.hp < MAX_HP) G.hp++; addScore(3000); floatText(q.sx, q.sy - 30, 'ВСЕ КЛЮЧИ! +1 ♥', '#ffd43b', 26); }
      else floatText(q.sx, q.sy - 30, 'КЛЮЧ ' + R.keys + '/' + KEYS6, '#ffd43b', 24);
      return true;
    }
    case 'chest': if (R.y > 1.7) return true; runDestroy(o); return true;
    case 'ride':
      if (R.y > 2.4) return true;
      o.dead = true; R.armor = 12; R.inv = 0; addScore(500);
      banner('ВАГОНЕТКА!', 'Тарань всё 12 с', 1.6, 'red'); sfx('power'); sfx('clink'); G.shake = 9;
      return true;
  }
  if (PEACEFUL6.includes(o.type) && (R.fever > 0 || R.armor > 0 || R.boost > 0)) return true;
  return false;
}
// what breaks into what (square crumbs); a chest broken any way opens
const FX6 = { skel: '#f2e6b8', skelA: '#c9ced6', gob: '#7cc242', demon: '#c8402e', yeti: '#bfe9ff', blk: '#9a9da6', wall: '#c9a26a', bamboo: '#b5d83a', bone: '#ffffff', sword: '#c9ced6', snow: '#ffffff',
  dirtf: '#9a6a42', chunkf: '#9a9da6', jblk: '#ffd23f', jtool: '#c9ced6', jtree: '#6fae3a', mcart: '#8a8f9c', chest: '#e0a850', gate: '#d9a55e', sheep: '#ffffff', pig: '#ff9db0', chicken: '#ffffff' };
function fx6(o, q) {
  const col = FX6[o.type]; if (!col) return false;
  if (o.type === 'chest') chestOpen6(o);
  burst(q.sx, q.sy, 12, { type: 'chunk', col, g: 520, smin: 80, smax: 280, lmin: 0.5, lmax: 0.9, rmin: 4, rmax: 8 });
  return true;
}
KNIFE_OK.push('skel', 'bamboo', 'bone', 'sword', 'snow', 'chest');
POUND_OK.push('skel', 'skelA', 'gob', 'demon', 'yeti', 'blk', 'wall', 'bone', 'dirtf', 'chunkf', 'jblk', 'chest', 'bamboo');
const KNIFE_NO6 = { skelA: 'БРОНЯ! Прыгни сверху', gob: 'ВЗОРВЁТСЯ! Бей в прыжке', demon: 'ТОЛСТЫЙ! Бей сверху ↓', yeti: 'ЛЁД! Бей сверху ↓', blk: 'ПЕРЕПРЫГНИ', wall: 'БЕЙ СВЕРХУ ↓', gate: 'ПОДКАТ ↓',
  sheep: 'ОНИ МИРНЫЕ!', pig: 'ОНИ МИРНЫЕ!', chicken: 'ПРЫГНИ НА НЕЁ!', mcart: 'ВАГОНЕТКА!', jblk: 'ПЕРЕПРЫГНИ', jtool: 'ПОДКАТ ↓', jtree: 'ПОДКАТ ↓', dirtf: 'ПЕРЕПРЫГНИ', chunkf: 'ПЕРЕПРЫГНИ' };

/* ---------- per-frame level logic: the magnet, the ride, throwing skeletons and yetis, goblin fuses, crossing animals */
function tick6(R) {
  const dt = R.dtLast || 0;
  updateFever(R, dt);
  if (!R.cards && R.t > 0.3 && R.s < 100) { R.cards = 2; banner('КУРСАЧ В КУБЕ', 'Уровень 6', 1.8, 'green'); }
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
  if (R.end || !G.player.alive) return;
  const born = [];
  for (let j = R.i; j < R.objs.length; j++) {
    const o = R.objs[j], dz = o.d - R.s; if (dz > 60) break;
    if (o.dead) continue;
    if (o.boing > 0) o.boing -= dt;
    if (o.atk > 0) o.atk -= dt;
    switch (o.type) {
      case 'sheep': case 'pig': case 'chicken': { const a = R.t * o.w + o.ph; o.x = o.x0 + Math.sin(a) * o.amp; o.dir = Math.cos(a) >= 0 ? 1 : -1; break; }
      case 'skel': case 'skelA': case 'yeti': {
        if (o.minion || dz < 11 || dz > 42) break;
        o.cd -= dt;
        if (o.cd <= 0) {
          o.cd = o.type === 'yeti' ? 1.9 : 1.6; o.atk = 0.55;
          if (o.type === 'skel') born.push({ type: 'bone', d: o.d - 1.2, x: o.x, h: 0, v: -8 });
          else born.push({ type: o.type === 'yeti' ? 'snow' : 'sword', d: o.d - 1.2, x: o.x, h: 1.35, v: -8 });
          if (dz < 36) sfx('throw');
        }
        break;
      }
      case 'gob': {
        if (o.minion) break;
        if (!o.fuse && dz < 26) { o.fuse = true; sfx('charge'); }
        if (o.fuse && dz < 4.6 && dz > -1) {
          // not knocked out in time: it blows up and throws dirt blocks onto the road ahead
          o.dead = true; o.smashed = 0.3; G.shake = Math.max(G.shake, 11); sfx('boom');
          const q = runProj(o.x, 1, dz + RUN.PZ);
          burst(q.sx, q.sy, 16, { type: 'chunk', col: '#9a6a42', g: 520, smin: 120, smax: 380, lmin: 0.5, lmax: 1.0, rmin: 5, rmax: 10 });
          floatText(q.sx, q.sy - 40, 'БА-БАХ!', '#ffb347', 28);
          const l0 = Math.round(o.x / RUN.LANE) + 1, lanes = [l0, l0 === 1 ? (Math.random() < 0.5 ? 0 : 2) : 1];
          lanes.forEach((l, i) => born.push({ type: 'dirtf', d: R.s + 15 + i * 4, x: laneX(l), h: 0, fall: 9, ft: 0 }));
        }
        break;
      }
    }
  }
  if (born.length) { for (const o of born) R.objs.push(Object.assign({ dead: false }, o)); R.objs.sort((a, b) => a.d - b.d); R.i = 0; }
}

/* ============================================================ the Head Moderator (3D, three phases) */
const MOD_LINES = {
  intro: 'Кто разрешил коробки из грязи на МОЁМ сервере?!',
  throw: ['Лови булыжник!', 'Сыр — не стройматериал!', 'Киркой по рукам!', 'Это тебе за ландшафт!', 'Дерево в подарок!'],
  summon: ['Командный блок: /summon мобы ×5!', 'Мобы, разберитесь с гриферкой!', 'Скелеты, гоблины — фас!'],
  back: ['Читай правила сервера!', 'Пункт 3.2: никаких коробок!', 'Варн тебе, утка!'],
  freeze: ['Э-э… пинг… секундочку…', 'Подожди… я завис…'],
  hurt: ['Моя админская каска!', 'Ай! Это бан!', 'Жалоба в техподдержку!', 'Откат! Откат сервера!', 'У меня же креатив!'],
  crash: 'Что с сервером?! Я застрял в текстурах!',
  dead: 'Ладно… строй свои коробки… Ухожу на перезагрузку…',
};
function modAnim(name, once, ts) { const T = R3E.mod; if (T && T.play) { const a = T.play(name, once, 0.2); if (a) a.timeScale = ts || 1; } }
function modPhase(B, st) {
  const R = G.run;
  B.state = st; B.t = 0; B.vol = 0; B.atkT = 0.9; B.spawned = false; B.chainKills = 0; B.chainOpened = false; B.homable = false;
  if (st === 'throw') { if (!R.hints.p1) { R.hints.p1 = 1; banner('ФАЗА 1: БАН-ХАММЕР', 'Уворачивайся: дорожки, прыжок, подкат', 2, 'green'); } modAnim('Run'); }
  if (st === 'summon') { if (!R.hints.p2) { R.hints.p2 = 1; banner('ФАЗА 2: СПАВН МОБОВ', 'Цепочка по головам — и в лицо модератору!', 2.2, 'green'); } shawSay(pick(MOD_LINES.summon)); modAnim('Attack', true, 0.8); }
  if (st === 'freeze') { shawSay(pick(MOD_LINES.freeze)); modAnim('Idle'); }
  if (st === 'crash') { banner('ФАЗА 3: КРАХ СЕРВЕРА', 'Прыгни и ударь сверху ↓ по красной кнопке!', 2.6, 'red'); modAnim('Idle'); B.dropT = 2.4; B.lagT = 1; sfx('drone'); }
}
function modThrow(B) {
  const R = G.run, kind = ['jblk', 'jtool', 'chunkf', 'jtree'][(B.vol + B.round) % 4];
  const lanes = [0, 1, 2].sort(() => Math.random() - 0.5), n = B.hp <= 2 ? (Math.random() < 0.6 ? 2 : 1) : (Math.random() < 0.3 ? 2 : 1), d = R.s + B.z - 2;
  if (B.vol === 0 || Math.random() < 0.35) shawSay(kind === 'jtree' ? MOD_LINES.throw[4] : kind === 'jtool' ? MOD_LINES.throw[2] : pick(MOD_LINES.throw.slice(0, 4)));
  modAnim('Attack', true, 1.3); B.threwT = 0.75;
  for (let i = 0; i < n; i++) {
    const x = laneX(lanes[i]);
    if (kind === 'jblk') R.objs.push({ type: 'jblk', k: Math.random() < 0.5 ? 'bStone' : 'bCheese', d: d - i * 2, x, h: 0, v: -12 });
    else if (kind === 'jtool') R.objs.push({ type: 'jtool', k: Math.random() < 0.5 ? 'axe' : 'pick', d: d - i * 3, x, h: 1.4, v: -11 });
    else if (kind === 'jtree') R.objs.push({ type: 'jtree', d: d - i * 4, x, h: 1.45, v: -10 });
    else R.objs.push({ type: 'chunkf', k: Math.random() < 0.5 ? 'bStone' : 'bCheese', d: R.s + 15 + i * 3, x, h: 0, fall: 10, ft: 0 });
  }
  R.objs.sort((a, b) => a.d - b.d); R.i = 0;
  sfx('throw');
}
function modUpdate(B, dt) {
  const R = G.run;
  B.x = lerp(B.x, 0, Math.min(1, dt * 2)); B.aimH = 4.7;
  B.threwT = Math.max(0, (B.threwT || 0) - dt);
  const sink = B.state === 'crash' || B.state === 'dead' ? -2.5 : 0;
  B.h = lerp(B.h, sink, Math.min(1, dt * 3));
  switch (B.state) {
    case 'enter':
      B.z = lerp(B.z, 22, Math.min(1, dt * 1.4));
      if (B.t > 2.6) { if (B.round === 0) shawSay(MOD_LINES.intro); modPhase(B, 'throw'); }
      break;
    case 'throw':
      B.z = lerp(B.z, 22, Math.min(1, dt * 2));
      if (B.threwT <= 0 && R3E.mod && R3E.mod.cur !== R3E.mod.actions.Run) modAnim('Run');
      B.atkT -= dt;
      if (B.atkT <= 0) {
        if (B.vol >= (B.hp <= 2 ? 5 : 4)) modPhase(B, 'summon');
        else { modThrow(B); B.vol++; B.atkT = B.hp <= 2 ? 1.2 : 1.5; }
      }
      break;
    case 'summon': {
      B.z = lerp(B.z, 27, Math.min(1, dt * 2));
      if (!B.spawned && B.t > 0.9) {
        B.spawned = true;
        for (let k = 0; k < 5; k++) R.objs.push({ type: k % 2 ? 'gob' : 'skel', d: R.s + 10 + k * 4.5, x: laneX((k * 2 + B.round) % 3), h: 0, v: -1.5, ph: Math.random(), minion: true, dead: false });
        R.objs.sort((a, b) => a.d - b.d); R.i = 0;
        modAnim('Idle'); sfx('charm');
      }
      if (B.homable) { B.chainT -= dt; if (B.chainT <= 0) B.homable = false; }
      const alive = R.objs.some((o) => o.minion && !o.dead && o.d > R.s - 1);
      if (B.spawned && !alive && !B.homable && !B.chainOpened && (B.chainKills || 0) >= 2) { B.homable = true; B.chainT = 2.4; }
      if (B.homable) B.chainOpened = true;
      if ((B.spawned && !alive && !B.homable) || B.t > 9) {
        // no chain into the face: after two misses in a row the moderator lags for a moment (a ground pound next to him counts)
        B.homable = false; B.fails = (B.fails || 0) + 1; B.round++;
        if (B.fails >= 2) { B.fails = 0; modPhase(B, 'freeze'); } else { shawSay(pick(MOD_LINES.back)); modPhase(B, 'throw'); }
      }
      break;
    }
    case 'freeze':
      B.z = lerp(B.z, 7.5, Math.min(1, dt * 2.5));
      if (B.t > 3.8) { B.round++; shawSay(pick(MOD_LINES.back)); modPhase(B, 'throw'); }
      break;
    case 'hurt':
      B.z = lerp(B.z, 18, Math.min(1, dt * 2));
      if (B.t > 1.0) modPhase(B, B.hp <= 1 ? 'crash' : 'throw');
      break;
    case 'crash':
      B.z = lerp(B.z, 6.5, Math.min(1, dt * 2));
      if (!B.crashSaid && B.t > 2.9) { B.crashSaid = true; shawSay(MOD_LINES.crash); }   // after the phase card, one message at a time
      B.lagT -= dt; if (B.lagT <= 0) { B.lagT = rand(1.1, 1.9); G.hitStop = 0.05; }
      B.dropT -= dt;
      if (B.dropT <= 0) {
        B.dropT = 1.9;
        R.objs.push({ type: 'chunkf', k: 'bDirt', d: R.s + 16, x: laneX(Math.floor(Math.random() * 3)), h: 0, fall: 10, ft: 0, dead: false });
        R.objs.sort((a, b) => a.d - b.d); R.i = 0;
      }
      break;
    case 'dead':
      B.z = lerp(B.z, 9, Math.min(1, dt));
      if (B.t > 3.0 && !R.end) runFinish();
      break;
  }
}
function modHit(kind) {
  const R = G.run, B = R.boss; if (!B || B.state === 'dead' || B.state === 'hurt') return;
  B.hp = kind === 'button' ? 0 : Math.max(1, B.hp - 1);
  B.flash = 0.4; B.homable = false; B.fails = 0; G.shake = 14; sfx('boom'); G.hitStop = 0.12;
  const q = runProj(B.x, B.h + 4.4, B.z + RUN.PZ);
  burst(q.sx, q.sy, 22, { type: 'chunk', col: pick(['#ffd43b', '#fff', '#ff5fd0']), g: 400, smin: 120, smax: 420, lmin: 0.5, lmax: 0.9, rmin: 5, rmax: 10 });
  addScore(1500, q.sx, q.sy);
  const first = B.helmet !== false;
  if (first) { B.helmet = false; B.helmT = G.bgT; sfx('clink'); }
  floatText(q.sx, q.sy - 60, kind === 'button' ? 'СЕРВЕР ПЕРЕЗАГРУЖЕН!' : first ? 'КАСКА СБИТА!' : kind === 'pound' ? 'ЗАВИС — ПОЛУЧАЙ!' : 'ЦЕПОЧКА В ЛИЦО!', '#ffd43b', 28);
  if (B.hp <= 0) {
    B.state = 'dead'; B.t = 0; B.pressT = G.bgT; modAnim('Death', true); shawSay(MOD_LINES.dead); addScore(10000, q.sx, q.sy - 40); Sound.music(null); sfx('win');
    R.objs = R.objs.filter((o) => o.type === 'cup'); R.i = 0;
    R.splats = []; for (let i = 0; i < 7; i++) R.splats.push({ x: rand(0.1, 0.9) * SW, y: rand(0.1, 0.8) * SH, r: rand(30, 70), col: pick(['#7cf06a', '#ffd43b', '#ff5fd0']), t: 0 });
    return;
  }
  modAnim('HitRecieve', true); shawSay(first ? MOD_LINES.hurt[0] : pick(MOD_LINES.hurt.slice(1)));
  B.state = 'hurt'; B.t = 0; if (kind === 'pound') B.round++;
}
// the chain: minions broken by homing dashes (at least two) open a dash into the moderator's face once the wave is gone
function onChain6(o) {
  const R = G.run, B = R.boss;
  if (!B || !o.minion || B.state !== 'summon') return;
  B.chainKills = (B.chainKills || 0) + 1;
  if (B.chainKills < 2 || R.objs.some((m) => m.minion && !m.dead && m.d > R.s - 1)) return;
  B.homable = true; B.chainT = 2.4;
}
function onPound6(R) {
  const B = R.boss; if (!B) return;
  if (B.state === 'freeze' && B.z < 11) modHit('pound');
  else if (B.state === 'crash' && B.z < 10) {
    if (R.lane === 1) modHit('button');
    else { const a = runPlayerScreen(); floatText(a.sx, a.sy - a.k * 2.4, 'КНОПКА ПО ЦЕНТРУ!', '#ff8fa3', 22); }
  }
}

/* ============================================================ 3D: the cube world */
const C6 = { inited: false, mat: {} };
// pixel-art block textures, 2 x 2 blocks of 16 px each (drawn 4x larger, nearest filter)
function pxTex6(key, draw) {
  if (R3.tex[key]) return R3.tex[key];
  const t = canvasTex(128, 128, (c) => { c.imageSmoothingEnabled = false; c.scale(4, 4); draw(c); }, true);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipMapLinearFilter;
  return (R3.tex[key] = t);
}
function blockPx6(c, kind, seed) {
  const rnd = mulberry(seed), px = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) {
    const ox = bx * 16, oy = by * 16, alt = (bx + by) % 2;
    const speck = (cols, n) => { for (let i = 0; i < n; i++) px(ox + Math.floor(rnd() * 16), oy + Math.floor(rnd() * 16), 1 + Math.floor(rnd() * 2), 1, cols[Math.floor(rnd() * cols.length)]); };
    if (kind === 'grass') { px(ox, oy, 16, 16, alt ? '#66bd45' : '#70c94c'); speck(['#58ad3b', '#84dc5e', '#5fb942'], 26); }
    else if (kind === 'stone') {
      px(ox, oy, 16, 16, '#6f737c');
      for (const [x, y, w, h] of [[0, 0, 7, 5], [8, 0, 8, 4], [0, 6, 5, 5], [6, 5, 6, 6], [13, 5, 3, 6], [0, 12, 8, 4], [9, 12, 7, 4]]) px(ox + x, oy + y, w, h, ['#9a9ea8', '#8b8f99', '#a6aab3', '#8e929c'][Math.floor(rnd() * 4)]);
      speck(['#b4b8c0', '#7e828b'], 10);
    } else if (kind === 'brick') {
      px(ox, oy, 16, 16, '#e3cdb2');
      for (let r = 0; r < 4; r++) for (let k = -1; k < 3; k++) { const x = k * 8 + (r % 2 ? 4 : 0), x0 = Math.max(0, x), x1 = Math.min(16, x + 7); if (x1 > x0) px(ox + x0, oy + r * 4, x1 - x0, 3, ['#b9553d', '#c4603f', '#ad4c37'][Math.floor(rnd() * 3)]); }
    } else if (kind === 'cheese') {
      px(ox, oy, 16, 16, alt ? '#ffd23f' : '#ffcb33'); speck(['#ffe072'], 8);
      for (let i = 0; i < 4; i++) { const x = 1 + Math.floor(rnd() * 11), y = 1 + Math.floor(rnd() * 11), s = 2 + Math.floor(rnd() * 2); px(ox + x, oy + y, s, s, '#e2a51c'); px(ox + x, oy + y, s, 1, '#c98a10'); }
    } else if (kind === 'dirt') { px(ox, oy, 16, 16, '#9a6a42'); speck(['#86593a', '#ad7b50', '#7c5233'], 30); px(ox, oy, 16, 3, '#66bd45'); px(ox, oy + 3, 16, 1, '#58ad3b'); for (let i = 0; i < 5; i++) px(ox + Math.floor(rnd() * 16), oy + 4, 1, 1 + Math.floor(rnd() * 2), '#58ad3b'); }
    else if (kind === 'gem') { px(ox, oy, 16, 16, '#8d9199'); speck(['#7d818a', '#a3a7b0'], 12); for (const [x, y] of [[3, 3], [10, 2], [6, 8], [12, 10], [2, 12]]) { px(ox + x, oy + y, 3, 3, '#4fe0e6'); px(ox + x + 1, oy + y - 1, 1, 5, '#8ff4f6'); px(ox + x, oy + y + 1, 1, 1, '#dffcff'); } }
    // block edges: a lighter top-left and a darker bottom-right line read as a grid of cubes
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(ox, oy + 15, 16, 1); c.fillRect(ox + 15, oy, 1, 16);
    c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(ox, oy, 16, 1); c.fillRect(ox, oy, 1, 16);
  }
}
function cubeInit() {
  if (C6.inited) return; C6.inited = true;
  const M = C6.mat, mk = (kind, seed) => new THREE.MeshLambertMaterial({ map: pxTex6('c6_' + kind, (c) => blockPx6(c, kind, seed)), vertexColors: true, side: THREE.DoubleSide });
  M.c_grass = mk('grass', 11); M.c_stone = mk('stone', 12); M.c_brick = mk('brick', 13); M.c_cheese = mk('cheese', 14); M.dirt = mk('dirt', 15);
  M.gem = new THREE.MeshLambertMaterial({ map: pxTex6('c6_gem', (c) => blockPx6(c, 'gem', 16)), emissive: new THREE.Color('#0b3a3c') });
  M.gem.map = M.gem.map.clone(); M.gem.map.repeat.set(0.5, 0.5); M.gem.map.needsUpdate = true;
  M.ingot = new THREE.MeshLambertMaterial({ color: '#e9eef4' }); M.ingot2 = new THREE.MeshLambertMaterial({ color: '#aab3c0' });
  M.pillar = new THREE.MeshLambertMaterial({ color: '#8b8f99' });
  M.farGrass = new THREE.MeshLambertMaterial({ color: '#63b446' }); M.farDirt = new THREE.MeshLambertMaterial({ color: '#8c6a48' }); M.farStone = new THREE.MeshLambertMaterial({ color: '#8d93a0' }); M.farSnow = new THREE.MeshLambertMaterial({ color: '#f4f8ff' });
  M.plank = new THREE.MeshLambertMaterial({ color: '#d9a55e' }); M.bone = new THREE.MeshLambertMaterial({ color: '#fffdf2' });
  M.ring = () => new THREE.MeshBasicMaterial({ color: '#ff3040', transparent: true, opacity: 0.45, depthWrite: false });
}
// a kit model inside a group; kit meshes keep their own look (no ink shell, it does not fit skinned or off-centre meshes)
function kit6(g, key, size, opts) {
  const z = zkMake(key, size, opts); if (!z) return null;
  const blockish = key[0] === 'b' && key[1] === key[1].toUpperCase();
  z.root.traverse((m) => { if (m.isMesh && !blockish) m.userData.noOutline = true; });
  g.add(z.root); if (z.mixer) g.userData.mixer = z.mixer; if (!g.userData.zk) g.userData.zk = z;
  return z;
}
function lbl6(g, txt, col, y) {
  const tex = R3.tex['lbl6_' + txt] || (R3.tex['lbl6_' + txt] = canvasTex(256, 64, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.strokeStyle = '#16121f'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = '#fff'; c.font = '900 ' + (txt.length > 14 ? 24 : 30) + 'px Nunito, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, w / 2, h / 2 + 2); }));
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex })); sp.scale.set(2.2, 0.55, 1); sp.position.y = y; g.add(sp); return sp;
}
function glow6(g, col, sx, sy, y) {
  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: R3E.lampGlow.map, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  gl.scale.set(sx, sy, 1); gl.position.y = y || 0; g.add(gl); return gl;
}
function make6(o, g, add) {
  cubeInit();
  const G3 = R3.geo, M = C6.mat;
  const box = (col, sx, sy, sz, y) => add(G3.box, new THREE.MeshLambertMaterial({ color: col }), sx, sy, sz, 0, y, 0);
  const ring = () => { const r = new THREE.Mesh(G3.disc, M.ring()); r.rotation.x = -Math.PI / 2; r.position.y = 0.04; r.userData.isOutline = true; g.add(r); return r; };
  const faller = (z, spin) => { const r = ring(); g.userData.upd = (oo) => { const k = oo.ft === undefined ? 1 : oo.ft; if (z) { z.root.position.y = lerp(oo.fall || 0, 0, k); z.root.rotation.z = (1 - k) * spin; } r.visible = k < 1; r.scale.setScalar(0.5 + k * 0.7); }; };
  switch (o.type) {
    case 'cup': {
      const s = new THREE.Group();
      if (o.kind === 'ingot') { const a = new THREE.Mesh(G3.box, M.ingot2); a.scale.set(0.62, 0.2, 0.34); s.add(a); const b = new THREE.Mesh(G3.box, M.ingot); b.scale.set(0.5, 0.1, 0.24); b.position.y = 0.14; s.add(b); s.rotation.z = 0.25; }
      else { const a = new THREE.Mesh(G3.box, M.gem); a.scale.setScalar(0.46); a.rotation.set(0.62, 0, 0.62); s.add(a); }
      g.add(s); g.userData.spin = s; return true;
    }
    case 'gkey': { const z = kit6(g, 'key', 1.1, { by: 'len' }); if (!z) box('#ffd43b', 0.8, 0.4, 0.15, 0); const gl = glow6(g, '#ffe066', 3, 3, 0.3); g.userData.upd = (oo, t) => { if (z) z.root.rotation.y = t * 3; gl.material.opacity = 0.6 + Math.sin(t * 8) * 0.3; }; return true; }
    case 'chest': { if (!kit6(g, 'chest', 1.25)) box('#c98a3a', 1.3, 1.1, 1.1, 0.55); lbl6(g, 'ЛУТБОКС', '#b8860b', 1.9); glow6(g, '#ffe066', 3.4, 2.4, 0.7); return true; }
    case 'skel': case 'skelA': {
      const z = kit6(g, o.type, 1.95, { anim: o.minion ? 'Run' : 'Idle', phase: (o.ph || 0) * 2 }); if (!z) { box('#f2e6b8', 0.7, 1.9, 0.5, 0.95); return true; }
      if (!o.minion) g.userData.upd = (oo) => { const on = oo.atk > 0; if (on !== !!g.userData.atkOn) { g.userData.atkOn = on; const a = z.play(on ? 'Attack' : 'Idle', on, 0.1); if (a && on) a.timeScale = 1.6; } };
      return true;
    }
    case 'gob': {
      const z = kit6(g, 'gob', 1.6, { anim: 'Run', phase: (o.ph || 0) * 2 }); if (!z) box('#7cc242', 0.7, 1.5, 0.5, 0.75);
      const gl = glow6(g, '#ff3b30', 3.2, 3.2, 0.9); gl.visible = false;
      g.userData.upd = (oo, t) => { const on = !!oo.fuse && Math.floor(t * 9) % 2 === 0; gl.visible = on; if (z) z.root.scale.setScalar(oo.fuse ? 1.08 + Math.sin(t * 28) * 0.08 : 1); };
      return true;
    }
    case 'demon': { if (!kit6(g, 'demon', 2.6, { anim: 'Walk', phase: (o.ph || 0) * 2 })) box('#c8402e', 1.3, 2.5, 0.9, 1.25); lbl6(g, 'БЕЙ СВЕРХУ ↓', '#c92a2a', 3.1); return true; }
    case 'yeti': {
      const z = kit6(g, 'yeti', 2.7, { anim: 'Idle' }); if (!z) box('#bfe9ff', 1.4, 2.6, 1.0, 1.3);
      lbl6(g, 'ЛЁД! БЕЙ СВЕРХУ ↓', '#1c7ed6', 3.25);
      if (z) g.userData.upd = (oo) => { const on = oo.atk > 0; if (on !== !!g.userData.atkOn) { g.userData.atkOn = on; const a = z.play(on ? 'Attack' : 'Idle', on, 0.1); if (a && on) a.timeScale = 1.5; } };
      return true;
    }
    case 'sheep': case 'pig': case 'chicken': {
      const z = kit6(g, o.type, o.type === 'sheep' ? 1.35 : o.type === 'pig' ? 1.1 : 0.95, { anim: o.type === 'chicken' ? 'Run' : 'Walk', phase: (o.ph || 0) });
      if (!z) box(FX6[o.type], 0.8, 0.9, 1.2, 0.45);
      if (o.type === 'chicken') lbl6(g, 'ПРЫГНИ НА МЕНЯ ↑', '#2b8a3e', 1.7);
      if (z) g.userData.upd = (oo) => { z.root.rotation.y = (oo.dir || 1) * Math.PI / 2; const b = oo.boing > 0 ? oo.boing : 0; z.root.scale.set(1 + b, 1 - b * 1.4, 1 + b); };
      return true;
    }
    case 'blk': { if (!kit6(g, o.k || 'bStone', 1.2)) box('#9a9da6', 1.2, 1.2, 1.2, 0.6); return true; }
    case 'wall': {
      for (let k = 0; k < 2; k++) { const z = kit6(g, 'bCrate', 1.45); if (!z) { box('#c9a26a', 1.45, 2.9, 1.45, 1.45); break; } z.root.position.y = k * 1.45; z.root.rotation.y = k * 0.2; }
      lbl6(g, 'ВЫСОКО! БЕЙ СВЕРХУ ↓', '#c92a2a', 3.35); return true;
    }
    case 'gate': {
      for (const sx of [-0.92, 0.92]) add(G3.box, M.plank, 0.2, 1.5, 0.2, sx, 0.75, 0);
      for (const sx of [-0.52, 0.52]) { const z = kit6(g, 'bPlanks', 1.04); if (z) { z.root.position.set(sx, 1.42, 0); } else { box('#d9a55e', 2.1, 1.0, 0.9, 1.92); break; } }
      lbl6(g, 'ПОДКАТ ↓', '#e8590c', 2.85); return true;
    }
    case 'bamboo': {
      for (const [x, zz, r] of [[-0.55, 0.1, 0.3], [0.5, -0.1, 2.1], [0, 0.25, 4.0]]) { const z = kit6(g, 'bamboo', 3.3); if (!z) { box('#b5d83a', 1.6, 3.3, 0.6, 1.65); break; } z.root.position.x = x; z.root.position.z = zz; z.root.rotation.y = r; }
      lbl6(g, 'РУБИ НОЖОМ', '#5c940d', 3.7); return true;
    }
    case 'spring': { const z = kit6(g, 'mushroom', 0.95); if (!z) return false; glow6(g, '#ff8a80', 2.4, 1.6, 0.5); return true; }
    case 'rail': { const z = kit6(g, 'rail', 2.15, { by: 'len', turn: Math.PI / 2, shadow: false }); if (!z) { for (const sx of [-0.5, 0.5]) add(G3.box, R3.mat.dark, 0.08, 0.08, 2.1, sx, 0.05, 0); } return true; }
    case 'mcart': { const z = kit6(g, 'cart', 1.7, { by: 'len' }); if (!z) box('#8a8f9c', 1.6, 1.0, 1.6, 0.5); else z.root.position.y = 0.12; const d = kit6(g, 'bDiamond', 0.9); if (d) d.root.position.y = 0.55; return true; }
    case 'ride': {
      const z = kit6(g, 'cart', 1.9, { by: 'len' }); if (!z) box('#8a8f9c', 1.8, 1.0, 1.8, 0.5); else z.root.position.y = 0.12;
      lbl6(g, 'ЗАПРЫГИВАЙ!', '#2b8a3e', 2.2); glow6(g, '#7dff9a', 5, 3, 0.9); return true;
    }
    case 'bone': { const m = add(G3.box, M.bone, 0.5, 0.5, 0.5, 0, 0.32, 0); g.userData.upd = (oo, t) => { m.rotation.x = -t * 9; }; return true; }
    case 'sword': { const z = kit6(g, 'sword', 1.5); if (z) { z.root.position.y = -0.75; const piv = new THREE.Group(); g.remove(z.root); piv.add(z.root); g.add(piv); g.userData.upd = (oo, t) => { piv.rotation.z = t * 10; }; } else box('#c9ced6', 0.2, 1.4, 0.1, 0); return true; }
    case 'snow': { const z = kit6(g, 'bSnow', 1.05); if (z) { z.root.position.y = -0.52; g.userData.upd = (oo, t) => { z.root.rotation.y = t * 4; }; } else box('#fff', 1, 1, 1, 0); lbl6(g, 'ПОДКАТ ↓', '#1c7ed6', 1.0); return true; }
    case 'dirtf': { const z = kit6(g, 'bDirt', 1.2); if (!z) box('#9a6a42', 1.2, 1.2, 1.2, 0.6); faller(z, 2.2); return true; }
    case 'chunkf': { const z = kit6(g, o.k || 'bStone', 1.2); if (!z) box('#9a9da6', 1.2, 1.2, 1.2, 0.6); faller(z, 2.6); return true; }
    case 'jblk': { const z = kit6(g, o.k || 'bStone', 1.15); if (!z) { box('#9a9da6', 1.1, 1.1, 1.1, 0.55); return true; } const piv = new THREE.Group(); piv.position.y = 0.58; g.remove(z.root); z.root.position.y = -0.58; piv.add(z.root); g.add(piv); g.userData.upd = (oo, t) => { piv.rotation.x = -t * 7; }; return true; }
    case 'jtool': { const z = kit6(g, o.k || 'axe', 1.7); if (!z) { box('#c9ced6', 0.9, 1.6, 0.2, 0); return true; } const piv = new THREE.Group(); g.remove(z.root); z.root.position.y = -0.85; piv.add(z.root); g.add(piv); g.userData.upd = (oo, t) => { piv.rotation.x = -t * 11; }; lbl6(g, 'ПОДКАТ ↓', '#e8590c', 1.35); return true; }
    case 'jtree': {
      const z = kit6(g, 'tree2', 3.4); if (!z) { box('#6fae3a', 1.6, 1.0, 3.2, 0); return true; }
      const piv = new THREE.Group(); g.remove(z.root); z.root.position.y = -1.7; piv.add(z.root); piv.rotation.x = Math.PI / 2; const roll = new THREE.Group(); roll.add(piv); g.add(roll);
      g.userData.upd = (oo, t) => { roll.rotation.z = t * 3; }; lbl6(g, 'ПОДКАТ ↓', '#e8590c', 1.6); return true;
    }
  }
  return false;
}
/* ---------- world chunks (100 m): a road of blocks, a grass shoulder, a lower terrace with trees and dirt huts */
const DECOR6 = {
  c_grass: [['grass', 0.6], ['grass', 0.5], ['mushroom', 0.7], ['bush', 1.1], ['rock', 0.7], ['bGrass', 1.13], ['bDirt', 1.13], ['bambooS', 1.3]],
  c_stone: [['rock', 0.9], ['rock', 0.6], ['crystal', 1.2], ['bStone', 1.13], ['bGrey', 1.13], ['bDiamond', 1.13], ['grass', 0.5], ['bStone', 1.13]],
  c_brick: [['bBrick', 1.13], ['bPlanks', 1.13], ['bCrate', 1.0], ['bush', 1.0], ['grass', 0.6], ['bGrey', 1.13], ['mushroom', 0.6], ['bBrick', 1.13]],
  c_cheese: [['bCheese', 1.13], ['bCheese', 1.13], ['mushroom', 0.8], ['bambooS', 1.4], ['grass', 0.6], ['bush', 1.0], ['crystal', 0.9], ['bCheese', 1.13]],
};
const SHOULDER6 = { c_grass: 'c_grass', c_stone: 'c_grass', c_brick: 'c_stone', c_cheese: 'c_grass' };
function buildCubeChunk(ci) {
  cubeInit();
  const T = R3.track, d0 = ci * 100, d1 = d0 + 100;
  trackEnsure(T, d1 + 2);
  T.kitOK = ZK.cstate === 'ready';
  const g = new THREE.Group(), H = RUN.HALF, B = (2 * H) / 3, M = C6.mat, rnd = mulberry(6000 + ci);
  const runs = [];
  let cur = null;
  const flatR = (R) => { const v = R.clone(); v.y = 0; return v.lengthSq() > 1e-6 ? v.normalize() : new THREE.Vector3(1, 0, 0); };
  const put = (key, size, pos, rotY, opts) => { const z = zkMake(key, size, Object.assign({ shadow: false }, opts)); if (!z) return null; z.root.traverse((m) => { if (m.isMesh) m.userData.noOutline = true; }); z.root.position.copy(pos); z.root.rotation.y = rotY; g.add(z.root); return z; };
  for (let d = d0; d <= d1; d++) {
    const P = T.P[d], R = T.R[d], U = T.U[d], seg = T.seg[d], bio = surfaceAt(d), v = d / (2 * B);
    const loop = seg === 'loop', sw = loop ? 0 : 2 * B, tw = loop ? 0 : 3 * B, at = (x, h) => P.clone().addScaledVector(R, x).addScaledVector(U, h);
    const row = {
      road: { pts: [at(-H, 0), at(-H / 3, 0), at(H / 3, 0), at(H, 0)], us: [0, 0.5, 1, 1.5], v },
      shL: { pts: [at(-H - sw, 0.02), at(-H, 0.02)], us: [0, 1], v }, shR: { pts: [at(H, 0.02), at(H + sw, 0.02)], us: [0, 1], v },
      stL: { pts: [at(-H - sw, 0.02), at(-H - sw, -B)], us: [0, 0.5], v }, stR: { pts: [at(H + sw, 0.02), at(H + sw, -B)], us: [0, 0.5], v },
      teL: { pts: [at(-H - sw - tw, -B), at(-H - sw, -B)], us: [0, 1.5], v }, teR: { pts: [at(H + sw, -B), at(H + sw + tw, -B)], us: [0, 1.5], v },
      skL: { pts: [at(-H - sw - tw, -B), at(-H - sw - tw, -3 * B)], us: [0, 1], v }, skR: { pts: [at(H + sw + tw, -B), at(H + sw + tw, -3 * B)], us: [0, 1], v },
    };
    // a new run of rows starts where the biome changes; the boundary row belongs to both runs, so there is no gap
    if (!cur || cur.bio !== bio) { const nr = { bio, rows: {} }; for (const k in row) nr.rows[k] = cur ? [cur.rows[k][cur.rows[k].length - 1]] : []; runs.push(nr); cur = nr; }
    for (const k in row) cur.rows[k].push(row[k]);
    const flat = !loop && Math.abs(U.y) > 0.85;
    if (!loop && d % 30 === 15 && P.y > -4) for (const s of [-1, 1]) { const base = at(s * (H - 0.6), -0.1), hgt = base.y + 7.2; if (hgt > 0.5) { const pil = new THREE.Mesh(R3.geo.box, M.pillar); pil.scale.set(B, hgt, B); pil.position.set(base.x, base.y - hgt / 2, base.z); pil.rotation.y = Math.atan2(R.z, -R.x); g.add(pil); } }
    if (!flat || !T.kitOK) continue;
    const fr = flatR(R), face = (s) => Math.atan2(-s * fr.x, -s * fr.z);
    // small things on the shoulder
    if (d % 3 === 1) for (const s of [-1, 1]) {
      if (rnd() < 0.45) continue;
      const [key, size] = DECOR6[bio][Math.floor(rnd() * 8)], block = key[0] === 'b' && key !== 'bush' && key !== 'bambooS';
      const off = H + 1.1 + rnd() * (sw - 1.9), pos = at(s * off, block ? size / 2 : 0.02);
      put(key, size, pos, block ? face(s) : rnd() * TAU);
      if (block && rnd() < 0.35) put(key, size, at(s * off, size * 1.5), face(s));
    }
    // trees on the lower terrace
    if (d % 8 === 4) for (const s of [-1, 1]) {
      if (rnd() < 0.3) continue;
      const key = bio === 'c_cheese' && rnd() < 0.5 ? 'bamboo' : ['tree1', 'tree2', 'tree3'][Math.floor(rnd() * 3)];
      put(key, key === 'bamboo' ? 4.5 : 5 + rnd() * 2.5, at(s * (H + sw + B * (0.9 + rnd() * 1.6)), -B), rnd() * TAU);
    }
    // a fence along the edge of the shoulder
    if (d % 40 === 20 && rnd() < 0.7) { const s = rnd() < 0.5 ? -1 : 1; for (let k = 0; k < 5; k++) { const dd = Math.min(d1, d + k * 2); const Pk = T.P[dd], Rk = T.R[dd], Uk = T.U[dd], fk = flatR(Rk); put('fence', 1.1, Pk.clone().addScaledVector(Rk, s * (H + sw - 0.35)).addScaledVector(Uk, 0.55), Math.atan2(-fk.x, -fk.z) + Math.PI / 2); } }
    // «коробка из грязи»: Ilona's architecture — a dirt cube with a door
    if (d % 50 === 30 && rnd() < 0.75) {
      const s = rnd() < 0.5 ? -1 : 1, pos = at(s * (H + sw + B * 1.6), -B);
      put('bDirt', 3.4, pos.clone().addScaledVector(U, 1.7), face(s));
      const door = put('door', 2.2, pos.clone().addScaledVector(fr, -s * 1.72), face(s));
      if (door) { const holder = new THREE.Group(); holder.position.copy(pos).addScaledVector(fr, -s * 1.75).addScaledVector(U, 3.9); lbl6(holder, ['КОРОБКА №1', 'ДОМ ИЛОНЫ', 'ШЕДЕВР', 'НЕ СНОСИТЬ!', 'КУРСАЧ ТУТ'][Math.floor(rnd() * 5)], '#8a5a2b', 0); g.add(holder); }
    }
  }
  for (const r of runs) {
    if (r.rows.road.length < 2) continue;
    g.add(ribbon(r.rows.road, M[r.bio]));
    for (const k of ['shL', 'shR']) g.add(ribbon(r.rows[k], M[SHOULDER6[r.bio]]));
    for (const k of ['teL', 'teR']) g.add(ribbon(r.rows[k], M.c_grass));
    for (const k of ['stL', 'stR', 'skL', 'skR']) g.add(ribbon(r.rows[k], M.dirt));
  }
  // far away: stepped cube hills
  for (let k = 0; k < 4; k++) {
    const d = Math.floor(d0 + rnd() * 100), P = T.P[d], fr = flatR(T.R[d]), s = rnd() < 0.5 ? -1 : 1, w = 26 + rnd() * 30, steps = 2 + Math.floor(rnd() * 3), sh = 7 + rnd() * 6;
    const pos = P.clone().addScaledVector(fr, s * (75 + rnd() * 90)), ry = Math.atan2(fr.x, fr.z);
    for (let i = 0; i < steps; i++) {
      const top = i === steps - 1, mat = top && steps >= 4 ? M.farSnow : i % 2 ? M.farStone : M.farGrass;
      const m = new THREE.Mesh(R3.geo.box, mat), ww = w * (1 - i * 0.26); m.scale.set(ww, sh, ww); m.position.set(pos.x, -7 + sh * (i + 0.5), pos.z); m.rotation.y = ry; m.userData.far = true; g.add(m);
    }
  }
  r3Toonify(g, false);
  g.traverse((m) => { if (m.isMesh) { m.castShadow = false; if (m.userData.far) m.receiveShadow = false; } });
  return g;
}
/* ---------- the moderator in 3D: the giant, his helmet, the command block, the red button, the blocks he is stuck in */
function modFrame(t) {
  const R = G.run, B = R.boss, X = R3E;
  const hide = () => { for (const k of ['mod', 'modHelm', 'modCmd', 'modBtn', 'modStuck']) if (X[k]) (X[k].root || X[k]).visible = false; };
  if (!B) return hide();
  if (!X.mod) {
    X.mod = zkMake('giant', 5.4, { anim: 'Idle' }); if (!X.mod) return;
    X.mod.root.traverse((m) => { if (m.isMesh) m.userData.noOutline = true; });
    R3.scene.add(X.mod.root);
    X.mod.obj.traverse((b) => { if (b.isBone && b.name === 'Head') X.modHead = b; });
    const sub = (key, size, opts) => { const z = zkMake(key, size, opts); if (z) { z.root.traverse((m) => { if (m.isMesh) m.userData.noOutline = true; }); R3.scene.add(z.root); } return z; };
    X.modHelm = sub('bMetal', 1.9); X.modCmd = sub('bCommand', 1.3); X.modBtn = sub('button', 1.9, { by: 'len' });
    if (X.modCmd) glow6(X.modCmd.root, '#ff5fd0', 4.5, 4.5, 0.65);
    if (X.modBtn) X.modBtnGlow = glow6(X.modBtn.root, '#ff3b30', 5, 5, 0.4);
    const st = new THREE.Group();
    for (const [x, z, y, r] of [[-1.5, 0.9, 0, 0.3], [1.4, 1.0, 0, -0.2], [0.1, 1.5, 0, 0.6], [-0.9, -0.6, 0, 1.0], [1.2, -0.5, 0, 0.1], [0.3, 1.2, 1.2, 0.4]]) { const b = zkMake('bDirt', 1.25, { shadow: false }); if (b) { b.root.position.set(x, y, z); b.root.rotation.y = r; st.add(b.root); } }
    const cart = zkMake('cart', 1.9, { by: 'len', shadow: false }); if (cart) { cart.root.position.set(-1.9, 0.5, 1.6); cart.root.rotation.set(0.3, 0.5, 0.5); st.add(cart.root); }
    st.traverse((m) => { if (m.isMesh) m.userData.noOutline = true; });
    R3.scene.add(st); X.modStuck = st;
  }
  const T = X.mod, F = frameAt(R.s + B.z), lag = B.state === 'crash' || B.state === 'freeze';
  T.root.visible = true;
  // lag: the model snaps a few times a second instead of moving smoothly
  if (!lag || !T.lagF || Math.floor(t * 7) !== T.lagF) { T.lagF = Math.floor(t * 7); T.root.position.copy(F.p).addScaledVector(F.r, B.x + (lag ? rand(-0.12, 0.12) : 0)).addScaledVector(F.u, B.h); orient(T.root, F); }
  // between throws he runs ahead with his back to the duck, and turns round to throw and to talk
  const away = B.state === 'throw' && !(B.threwT > 0) && B.atkT > 0.45;
  B.turn = lerp(B.turn || 0, away ? Math.PI : 0, 0.2); T.root.rotateY(B.turn);
  const fl = B.flash > 0 && Math.floor(B.flash * 20) % 2 ? 0.5 : 0;
  T.root.traverse((m) => { if (m.isMesh && m.material && m.material.emissive) m.material.emissive.setScalar(fl); });
  T.root.updateMatrixWorld(true);
  const head = new THREE.Vector3(); if (X.modHead) X.modHead.getWorldPosition(head); else head.copy(T.root.position).addScaledVector(F.u, 4.4);
  if (X.modHelm) {
    const Hm = X.modHelm.root;
    if (B.helmet !== false) { Hm.visible = true; Hm.position.copy(head).addScaledVector(F.u, 0.55); orient(Hm, F); Hm.scale.set(1, 0.62, 1); }
    else { const e = t - (B.helmT || 0); Hm.visible = e < 1.6; Hm.position.copy(head).addScaledVector(F.u, 0.6 + 9 * e - 11 * e * e).addScaledVector(F.r, 5 * e); Hm.rotation.x += 0.3; Hm.rotation.z += 0.2; }
  }
  if (X.modCmd) {
    const C = X.modCmd.root; C.visible = B.state === 'summon';
    if (C.visible) { C.position.copy(T.root.position).addScaledVector(F.r, -3.1).addScaledVector(F.u, 3.4 + Math.sin(t * 4) * 0.25); orient(C, F); C.rotateY(t * 2.5); C.scale.setScalar(Math.min(1, B.t * 2.5) * (1 + Math.sin(t * 10) * 0.06)); }
  }
  if (X.modBtn) {
    const Bt = X.modBtn.root, pressed = B.state === 'dead';
    Bt.visible = B.state === 'crash' || pressed;
    if (Bt.visible) { Bt.position.copy(head).addScaledVector(F.u, 1.15 + (pressed ? 0 : Math.sin(t * 5) * 0.12)); orient(Bt, F); Bt.scale.set(1, pressed ? 0.45 : 1, 1); if (X.modBtnGlow) { X.modBtnGlow.visible = !pressed; X.modBtnGlow.material.opacity = 0.55 + Math.sin(t * 9) * 0.35; } }
  }
  if (X.modStuck) { const S = X.modStuck; S.visible = B.state === 'crash' || B.state === 'dead'; if (S.visible) { S.position.copy(F.p).addScaledVector(F.r, B.x); orient(S, F); S.scale.setScalar(Math.min(1, 0.2 + B.t * 1.6)); } }
}
function frame6(dt, t, F) {
  const R = G.run, D = R3.duck, T = R3.track;
  // the kit finished loading after the world was built: build the chunks and the objects again
  if (T && T.kitOK === false && ZK.cstate === 'ready') {
    T.kitOK = true;
    for (const [, grp] of R3.chunks) R3.scene.remove(grp); R3.chunks.clear();
    for (const o of R3.live) { R3.scene.remove(o.mesh); o.mesh = null; } R3.live.clear();
  }
  for (const o of R3.live) if (o.mesh && o.mesh.userData.mixer) o.mesh.userData.mixer.update(dt);
  const B = R.boss;
  if (R3E.mod && R3E.mod.mixer) { const lag = B && (B.state === 'crash' || B.state === 'freeze'); R3E.modAcc = (R3E.modAcc || 0) + dt; if (!lag) { R3E.mod.mixer.update(R3E.modAcc); R3E.modAcc = 0; } else if (R3E.modAcc > (B.state === 'freeze' ? 0.6 : 0.28)) { R3E.mod.mixer.update(R3E.modAcc * 0.5); R3E.modAcc = 0; } }
  // the minecart ride: the duck stands in the cart
  if (R.armor > 0) {
    if (!R3E.ride6) { R3E.ride6 = zkMake('cart', 2.0, { by: 'len' }); if (R3E.ride6) R3E.ride6.root.traverse((m) => { if (m.isMesh) m.userData.noOutline = true; }); }
    if (R3E.ride6 && R3E.ride6.root.parent !== D.root) D.root.add(R3E.ride6.root);
    if (R3E.ride6) { R3E.ride6.root.visible = true; R3E.ride6.root.position.y = 0.1; D.body.position.y += 0.45; }
  } else if (R3E.ride6) R3E.ride6.root.visible = false;
}
const THEME6 = {
  fog: '#bfe6ff', near: 70, far: 270, sun: 1.0, hemi: 0.78, sunCol: '#fff6dc', ground: '#55a53d',
  sky: () => canvasTex(4, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2f7fe0'); g.addColorStop(0.44, '#79bdf5'); g.addColorStop(0.5, '#d8f0ff'); g.addColorStop(1, '#bfe6ff'); c.fillStyle = g; c.fillRect(0, 0, w, h); }),
  cloud: () => canvasTex(256, 128, (c) => { c.fillStyle = '#fff'; for (const [x, y, w, h] of [[30, 62, 196, 40], [62, 36, 96, 30], [150, 48, 60, 20], [18, 78, 60, 18]]) c.fillRect(x, y, w, h); c.fillStyle = '#e4f1fb'; c.fillRect(30, 96, 196, 6); }),
};

/* ============================================================ 2D: overlay (timers, targets, lag) and the ending */
function hud6(c, x, y, t) {
  c.save(); c.translate(x, y + Math.sin(t * 4) * 1.5); c.rotate(Math.PI / 4);
  P(c); c.rect(-9, -9, 18, 18); fs(c, '#4fe0e6', 3);
  P(c); c.rect(-9, -9, 9, 9); c.fillStyle = '#b6f7f9'; c.fill();
  c.restore();
}
function lagOverlay6(c, t, k) {
  const rnd = mulberry(Math.floor(t * 11));
  for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? 'rgba(255,40,110,' + (0.13 * k).toFixed(3) + ')' : 'rgba(60,255,230,' + (0.13 * k).toFixed(3) + ')'; c.fillRect(rnd() * SW * 0.5 - 30, rnd() * SH, SW * (0.3 + rnd() * 0.7), 3 + rnd() * 16); }
  if (k < 1) return;
  const x = 18, y = 196, dots = '.'.repeat(1 + (Math.floor(t * 3) % 3));
  c.fillStyle = 'rgba(16,14,24,0.72)'; c.fillRect(x - 8, y - 16, 262, 84);
  c.font = '700 17px "Courier New", monospace'; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillStyle = Math.floor(t * 4) % 2 ? '#ff4d6d' : '#ffb3c1'; c.fillText('Высокий пинг: 999 мс', x, y);
  c.fillStyle = '#ffe066'; c.fillText('Сохранение чанков' + dots, x, y + 24);
  c.fillStyle = '#9dff6a'; c.fillText('TPS: ' + (1.5 + Math.abs(Math.sin(t * 2)) * 1.4).toFixed(1) + ' / 20', x, y + 48);
}
function overlay6(c, t) {
  overlay4(c, t);
  const R = G.run, B = R.boss;
  c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = '20px ' + FONT_DISPLAY;
  let y = 150;
  if (R.keys > 0) { otext(c, 'КЛЮЧИ ' + R.keys + '/' + KEYS6, 18, y, '#ffd43b', 5); y += 28; }
  if (R.magnet > 0) { otext(c, 'ЛУТБОКС-МАГНИТ ' + Math.ceil(R.magnet), 18, y, '#7ee7f2', 5); y += 28; }
  if (R.armor > 0) otext(c, 'ВАГОНЕТКА ' + Math.ceil(R.armor), 18, y, '#9dff6a', 5);
  c.textAlign = 'center';
  if (!B) return;
  if (B.state === 'crash') lagOverlay6(c, t, 1); else if (B.state === 'freeze') lagOverlay6(c, t, 0.6);
  const blink = Math.floor(t * 4) % 2;
  if (B.state === 'summon' && B.spawned && !B.homable && !B.chainOpened) {
    c.font = '22px ' + FONT_DISPLAY; otext(c, 'ЦЕПОЧКА ПО МОБАМ: ' + Math.min(2, B.chainKills || 0) + '/2', SW / 2, SH * 0.34, '#7ee7f2', 6);
  }
  if (B.homable || B.state === 'freeze' || (B.state === 'crash' && B.t > 2.9)) {
    const crash = B.state === 'crash', q = runProj3(B.x, B.h + (crash ? 6.6 : 4.7), B.z + RUN.PZ);
    if (q.sx > -100) {
      drawReticle(c, q.sx, q.sy, Math.max(30, q.k * (crash ? 1.2 : 1.6)), t);
      c.font = '26px ' + FONT_DISPLAY;
      const msg = B.homable ? (R.y > 0.25 ? 'ЖМИ ПРЫЖОК — В ЛИЦО!' : 'ПРЫГАЙ!') : crash && R.lane !== 1 ? (R.lane < 1 ? 'КНОПКА ПРАВЕЕ ▸' : '◂ КНОПКА ЛЕВЕЕ') : R.y > 0.6 ? 'ВНИЗ — УДАР СВЕРХУ!' : crash ? 'ПРЫГАЙ И ЖМИ КНОПКУ ↓' : 'ПРЫГАЙ И БЕЙ СВЕРХУ!';
      if (blink || (crash && R.lane !== 1)) otext(c, msg, q.sx, Math.max(110, q.sy - Math.max(60, q.k * 2.2)), '#ffe14d', 7);
    }
  }
}
function drawMod2D(c, x, y, S, t, B) {
  c.save(); c.translate(x, y); const s = S / 200; c.scale(s, s);
  P(c); c.rect(-50, -150, 100, 100); fs(c, '#e2a94e', 4);
  P(c); c.rect(-40, -200, 80, 56); fs(c, '#efbb62', 4);
  P(c); c.rect(-8, -180, 16, 26); fs(c, '#ff8fb0', 3);
  eye(c, -22, -182, 8, 0, 0.1, -1.2, '#c4141f'); eye(c, 22, -182, 8, 0, 0.1, 1.2, '#c4141f');
  P(c); c.rect(-52, -60, 104, 34); fs(c, '#2f5fb5', 3);
  for (const sx of [-1, 1]) { P(c); c.rect(sx * 62 - 14, -146, 28, 90); fs(c, '#e2a94e', 4); P(c); c.rect(sx * 26 - 16, -28, 32, 28); fs(c, '#d39a40', 4); }
  c.restore();
}
function drawEnd6(c, t) {
  // back in her room at dawn: the monitor shows the rebooted server, the coursework is still waiting
  const g = c.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#3b3a78'); g.addColorStop(0.55, '#c9749a'); g.addColorStop(1, '#ffcf9e');
  c.fillStyle = g; c.fillRect(0, 0, SW, SH);
  const px = (x, y, w, h, col, lw) => { P(c); c.rect(x, y, w, h); fs(c, col, lw === undefined ? 4 : lw); };
  // window with the sunrise
  px(SW * 0.06, SH * 0.1, 190, 170, '#ffd9a0');
  c.save(); P(c); c.rect(SW * 0.06, SH * 0.1, 190, 170); c.clip(); P(c); circ(c, SW * 0.06 + 95, SH * 0.1 + 170, 62); c.fillStyle = '#ff8f4d'; c.fill(); c.restore();
  line(c, [SW * 0.06 + 95, SH * 0.1, SW * 0.06 + 95, SH * 0.1 + 170], 4); line(c, [SW * 0.06, SH * 0.1 + 85, SW * 0.06 + 190, SH * 0.1 + 85], 4);
  // desk
  px(-10, SH - 120, SW + 20, 26, '#b7773f'); px(-10, SH - 96, SW + 20, 100, '#8b5a2b');
  // monitor
  const mx = SW * 0.6, my = SH - 330;
  px(mx + 96, SH - 150, 48, 32, '#3d4352'); px(mx + 60, SH - 126, 120, 12, '#3d4352');
  px(mx, my, 240, 184, '#2b2f3d'); px(mx + 12, my + 12, 216, 150, '#7ec8f2', 3);
  px(mx + 12, my + 112, 216, 50, '#66bd45', 0); px(mx + 12, my + 126, 216, 36, '#9a6a42', 0);
  for (const [bx, by] of [[30, 80], [62, 80], [62, 48], [150, 80]]) px(mx + bx, my + by, 32, 32, '#9a6a42', 2.5);
  px(mx + 164, my + 56, 26, 26, '#e2a94e', 2.5); px(mx + 170, my + 64, 5, 4, '#221d2e', 0); px(mx + 180, my + 64, 5, 4, '#221d2e', 0); px(mx + 172, my + 74, 12, 3, '#221d2e', 0);
  c.font = '900 13px ' + FONT_UI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#16121f'; c.fillText('СЕРВЕР ПЕРЕЗАГРУЖЕН', mx + 120, my + 28);
  if (Math.floor(t * 2) % 2) { c.fillStyle = '#2b8a3e'; c.fillText('игрок Ilona_Duck вышел', mx + 120, my + 148); }
  // pixels fly out of the screen
  for (let i = 0; i < 18; i++) { const k = (t * 0.5 + i / 18) % 1, a = i * 2.4; c.globalAlpha = 1 - k; c.fillStyle = ['#4fe0e6', '#66bd45', '#ffd43b', '#ff5fd0'][i % 4]; c.fillRect(mx + 120 - Math.cos(a) * k * 260 - 5, my + 90 - Math.abs(Math.sin(a)) * k * 190 - 5, 10, 10); } c.globalAlpha = 1;
  // coffee mugs and the untouched coursework
  for (const [x, col] of [[SW * 0.5, '#fffaf0'], [SW * 0.54, '#ffd6ea']]) { px(x, SH - 152, 26, 32, col, 3); P(c); c.arc(x + 28, SH - 136, 8, -1.2, 1.2); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); }
  c.save(); c.translate(SW * 0.9, SH - 124); c.rotate(-0.05);
  px(-52, -44, 104, 44, '#fffaf0', 3); px(-56, -52, 104, 44, '#fffaf0', 3);
  c.font = '900 14px ' + FONT_UI; c.fillStyle = '#c92a2a'; c.fillText('КУРСАЧ', -4, -36); c.font = '800 10px ' + FONT_UI; c.fillStyle = '#5c5f66'; c.fillText('страниц: 0', -4, -20); c.restore();
  c.save(); c.translate(mx + 214, my - 8); c.rotate(0.12); px(-36, -22, 72, 44, '#ffe066', 2.5); c.font = '900 11px ' + FONT_UI; c.fillStyle = '#16121f'; c.fillText('ДЕДЛАЙН:', 0, -7); c.fillText('ВЧЕРА', 0, 8); c.restore();
  const bob = Math.abs(Math.sin(t * 4)) * 40;
  drawDuckHero(c, SW * 0.34, SH - 215 - bob, t, { h: 210, flapSpeed: 16, tilt: Math.sin(t * 4) * 0.08 });
  hud6(c, SW * 0.34 + 86, SH - 250 - bob, t);
  for (let i = 0; i < 14; i++) { const x = (i * 137 + t * 90) % SW, y = (i * 71 + t * 120) % SH; c.fillStyle = ['#ffd43b', '#9dff6a', '#7ee7f2'][i % 3]; c.fillRect(x, y, 7, 7); }
}

/* ---------- the run config for level 6 */
const HK6 = {
  jump: ['jump', 'ПРЫЖОК', isTouch ? 'Кнопка «Прыжок» справа внизу' : 'Стрелка вверх или Пробел'],
  roll: ['roll', 'ПОДКАТ', isTouch ? 'Свайп вниз — проскочи под планкой' : 'Стрелка вниз — проскочи под планкой'],
  knife: ['knife', 'НОЖ', isTouch ? 'Кнопка «Нож» — руби скелетов и бамбук' : 'F или клик мышью — руби скелетов и бамбук'],
  homing: ['homing', 'АТАКА В ПРЫЖКЕ', isTouch ? 'В прыжке нажми «Прыжок» ещё раз — сбей гоблина, пока не взорвался' : 'В прыжке нажми прыжок ещё раз — сбей гоблина, пока не взорвался'],
  pound: ['pound', 'УДАР СВЕРХУ', isTouch ? 'В прыжке свайп вниз — ломает лёд и ящики' : 'В прыжке стрелка вниз — ломает лёд и ящики'],
  hen: ['hen', 'КУРИЦА-БАТУТ', 'Прыгни на неё — подбросит к алмазам в небе'],
};
const RUN_CFG6 = Object.assign({}, RUN_CFG4, {
  evo: 2, bossAt: BOSS6_AT, surfaces: SURFACES6, build: buildTrack6, plan: () => TRACK_PLAN6,
  bossName: 'Главный Модератор', bossLabel: 'ГЛАВНЫЙ МОДЕРАТОР', voice: 'drone', lines: MOD_LINES, bossHp: 5,
  drawBoss: drawMod2D, drawEnd: drawEnd6, endSay: 'Кря! Выбралась! Теперь — курсач по архитектуре. Честно-честно!', deathFx: 'paper',
  ctxHints: { blk: HK6.jump, gate: HK6.roll, skel: HK6.knife, bamboo: HK6.knife, gob: HK6.homing, wall: HK6.pound, yeti: HK6.pound, demon: HK6.pound, chicken: HK6.hen },
  targets: ['skel', 'skelA', 'gob'], collide: collide6, tick: tick6, pickup: pickup6, knifeNo: KNIFE_NO6,
  floatTypes: ['gkey', 'sword', 'snow', 'jtool', 'jtree'], moveTypes: ['skel', 'gob', 'demon', 'sheep', 'pig', 'chicken', 'mcart', 'bone', 'sword', 'snow', 'jblk', 'jtool', 'jtree', 'dirtf', 'chunkf'], bounce: [], bounceH: {},
  openPhase: null, updOpen: null, bossUpdate: modUpdate, bossHit: () => { const B = G.run.boss; if (B && B.homable) modHit('chain'); }, boss3d: modFrame,
  onChain: onChain6, onPound: onPound6, overlay: overlay6, theme: THEME6, decor: null, frame3d: frame6,
  chunk: buildCubeChunk, make: make6, fx: fx6, hudIcon: hud6, lootLost: 'Алмазы рассыпаны!', lootPart: 'chunk', lootPlus: '+◆',
  feverBanner: ['КОФЕЙНЫЙ ПЕРЕДОЗ!', 'Режим креатива — ломай всё!'], duckAlt: true,
});
