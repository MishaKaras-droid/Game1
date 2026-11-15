/* ============================================================ nickname, achievements, online leaderboard (Supabase) */
const NET = {
  url: 'https://tuxwtjrubuzhygimdzup.supabase.co/rest/v1/',
  // public "anon" key: it is meant to live in the page, the database only allows reading and adding rows
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1eHd0anJ1YnV6aHlnaW1kenVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2OTYwNTcsImV4cCI6MjExMDI3MjA1N30.f7wm7_obc8XX7CpHynrfdbWslqzXxekSKb8nma0buJY',
};
function netReq(path, opt) {
  opt = opt || {};
  const headers = Object.assign({ apikey: NET.key, Authorization: 'Bearer ' + NET.key, 'Content-Type': 'application/json' }, opt.headers || {});
  return fetch(NET.url + path, { method: opt.method || 'GET', headers, body: opt.body ? JSON.stringify(opt.body) : undefined })
    .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.status === 204 || r.status === 201 ? null : r.json(); });
}

/* ---------- nickname */
function cleanNick(s) { return String(s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16); }
function getNick() { return cleanNick(store.get('nick', '')); }
function setNick(n) { store.set('nick', cleanNick(n)); }

/* ---------- send queue: results wait here until the network answers */
function loadQueue() { const q = store.get('netQueue', []); return Array.isArray(q) ? q : []; }
let flushing = false;
function flushQueue() {
  if (flushing) return;
  const q = loadQueue();
  if (!q.length) return;
  flushing = true;
  const item = q[0];
  const req = item.t === 'score'
    ? netReq('scores', { method: 'POST', body: item.row, headers: { Prefer: 'return=minimal' } })
    : netReq('achievements?on_conflict=nick,code', { method: 'POST', body: item.row, headers: { Prefer: 'return=minimal,resolution=ignore-duplicates' } });
  req.then(() => { const r = loadQueue(); r.shift(); store.set('netQueue', r); flushing = false; flushQueue(); })
    .catch(() => { flushing = false; });
}
function enqueue(t, row) { const q = loadQueue(); q.push({ t, row }); store.set('netQueue', q.slice(-200)); flushQueue(); }
window.addEventListener('online', flushQueue);

function submitScore(mode, level, score, won, stars) {
  const nick = getNick();
  if (!nick || score <= 0) return;
  enqueue('score', { nick, mode, level, score: Math.floor(score), won: !!won, stars: stars || 0 });
}

/* ---------- achievements */
const ACHIEVEMENTS = [
  { code: 'first_win',  icon: '🏆', name: 'Первая победа',     desc: 'Пройти любой уровень' },
  { code: 'flawless',   icon: '💖', name: 'Без царапинки',     desc: 'Победить, не потеряв ни одного сердечка' },
  { code: 'stars3',     icon: '⭐', name: 'Три звезды',        desc: 'Победить с тремя звёздами' },
  { code: 'score10k',   icon: '🔟', name: '10 000',            desc: 'Набрать 10 000 очков за забег' },
  { code: 'score50k',   icon: '💰', name: '50 000',            desc: 'Набрать 50 000 очков за забег' },
  { code: 'score100k',  icon: '💎', name: 'Сотка',             desc: 'Набрать 100 000 очков за забег' },
  { code: 'duck_win',   icon: '🦆', name: 'Крылья',            desc: 'Победить уткой Илоной' },
  { code: 'fish_win',   icon: '🐟', name: 'Жабры',             desc: 'Победить карасём Мишей' },
  { code: 'both',       icon: '🤝', name: 'Кря и Буль',        desc: 'Победить обоими героями' },
  { code: 'duck_all',   icon: '🎓', name: 'Кандидат утиных наук', desc: 'Пройти все уровни утки' },
  { code: 'fish_half',  icon: '🌊', name: 'Глубоководный',     desc: 'Пройти 6 уровней карася' },
  { code: 'fish_all',   icon: '👑', name: 'Повелитель рек',    desc: 'Пройти все уровни карася' },
  { code: 'games10',    icon: '🎮', name: 'Втянулся',          desc: 'Сыграть 10 раз' },
  { code: 'games50',    icon: '🔥', name: 'Не оторваться',     desc: 'Сыграть 50 раз' },
  { code: 'comeback',   icon: '😅', name: 'На последнем',      desc: 'Победить с одним сердечком' },
];
function myAch() { const a = store.get('ach', {}); return a && typeof a === 'object' && !Array.isArray(a) ? a : {}; }
// called at the end of every run; returns the achievements unlocked just now
function checkAchievements(r) {
  const got = myAch(), fresh = [];
  const games = (store.get('games', 0) || 0) + 1; store.set('games', games);
  const cl = (loadRec()._cleared) || {};
  const cleared = (m) => levelsOf(m).filter((l) => cl[m + '-' + l]).length;
  const cond = {
    first_win: r.won,
    flawless: r.won && r.hp >= MAX_HP,
    stars3: r.won && r.stars >= 3,
    score10k: r.score >= 10000,
    score50k: r.score >= 50000,
    score100k: r.score >= 100000,
    duck_win: r.won && r.mode === 'duck',
    fish_win: r.won && r.mode === 'fish',
    both: cleared('duck') > 0 && cleared('fish') > 0,
    duck_all: cleared('duck') >= levelsOf('duck').length,
    fish_half: cleared('fish') >= 6,
    fish_all: cleared('fish') >= levelsOf('fish').length,
    games10: games >= 10,
    games50: games >= 50,
    comeback: r.won && r.hp === 1,
  };
  for (const a of ACHIEVEMENTS) if (cond[a.code] && !got[a.code]) { got[a.code] = Date.now(); fresh.push(a); }
  store.set('ach', got);
  syncAchievements();
  return fresh;
}
// send every local achievement once per nickname (also after the nickname changes)
function syncAchievements() {
  const nick = getNick(); if (!nick) return;
  const sent = store.get('achSent', {}), mine = sent[nick] || {};
  for (const code of Object.keys(myAch())) if (!mine[code]) { mine[code] = 1; enqueue('ach', { nick, code }); }
  sent[nick] = mine; store.set('achSent', sent);
}

/* ---------- leaderboard: best run per player */
function fetchLeaders(mode) {
  return netReq('scores?select=nick,score,level,won,created_at&mode=eq.' + mode + '&order=score.desc&limit=300').then((rows) => {
    const seen = new Set(), out = [];
    for (const r of rows || []) { const k = r.nick.toLowerCase(); if (seen.has(k)) continue; seen.add(k); out.push(r); if (out.length >= 30) break; }
    return out;
  });
}
function fetchAchCounts() {
  return netReq('achievements?select=nick,code&limit=5000').then((rows) => {
    const by = {};
    for (const r of rows || []) by[r.nick] = (by[r.nick] || 0) + 1;
    return Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 30);
  });
}
flushQueue();
