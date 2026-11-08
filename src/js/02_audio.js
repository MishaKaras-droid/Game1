/* ============================================================ sound (Web Audio synth, no files) */
const Sound = (() => {
  let ac = null, master, comp, sfxBus, musicBus, musicLP, echo, echoWet, noiseBuf;
  let muted = !!store.get('muted', false);
  let song = null, step = 0, nextTime = 0;
  const last = Object.create(null);

  function init() {
    if (ac) { resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ac = new AC(); } catch (e) { ac = null; return; }
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ac.destination);
    comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
    comp.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.62; sfxBus.connect(comp);
    musicLP = ac.createBiquadFilter(); musicLP.type = 'lowpass'; musicLP.frequency.value = 4200; musicLP.connect(comp);
    musicBus = ac.createGain(); musicBus.gain.value = 0.3; musicBus.connect(musicLP);
    echo = ac.createDelay(1); echo.delayTime.value = 0.29;
    const fb = ac.createGain(); fb.gain.value = 0.33;
    echoWet = ac.createGain(); echoWet.gain.value = 0;
    echo.connect(fb); fb.connect(echo); echo.connect(echoWet); echoWet.connect(musicBus);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setInterval(schedule, 25);
    resume();
  }
  function resume() { if (ac && ac.state === 'suspended') ac.resume().catch(() => {}); }
  function suspend() { if (ac && ac.state === 'running') ac.suspend().catch(() => {}); }

  /* ---------- primitives */
  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + 0.01, dur));
  }
  function osc(type, f0, f1, dur, vol, t, dest, a) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, a || 0.005, vol, dur);
    o.connect(g); g.connect(dest || sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, ftype, f0, f1, t, q, dest) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = ftype; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain(); env(g, t, 0.004, vol, dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxBus);
    s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.05);
  }
  function quack(t, pitch) {
    pitch = pitch || 1;
    const o = ac.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(340 * pitch, t);
    o.frequency.linearRampToValueAtTime(270 * pitch, t + 0.08);
    o.frequency.linearRampToValueAtTime(170 * pitch, t + 0.22);
    const f1 = ac.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 3.5;
    f1.frequency.setValueAtTime(1150, t); f1.frequency.linearRampToValueAtTime(700, t + 0.22);
    const f2 = ac.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 6; f2.frequency.value = 2500;
    const g2 = ac.createGain(); g2.gain.value = 0.45;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.75, t + 0.015);
    g.gain.setValueAtTime(0.75, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    o.connect(f1); o.connect(f2); f2.connect(g2); g2.connect(g); f1.connect(g); g.connect(sfxBus);
    o.start(t); o.stop(t + 0.3);
  }

  const SFX = {
    knife: (t) => noise(0.07, 0.11, 'bandpass', 5200, 1900, t, 2.5),
    bubble: (t) => { osc('sine', rand(250, 320), 900, 0.09, 0.14, t); },
    hit: (t) => osc('square', 230, 120, 0.035, 0.045, t),
    pop: (t) => { noise(0.16, 0.24, 'lowpass', 2600, 300, t); osc('triangle', 320, 70, 0.14, 0.14, t); },
    popWater: (t) => { osc('sine', 480, 1500, 0.07, 0.18, t); osc('sine', 900, 2100, 0.05, 0.1, t + 0.045); noise(0.08, 0.06, 'highpass', 3000, 0, t); },
    boom: (t) => { noise(0.7, 0.55, 'lowpass', 1600, 110, t); osc('sine', 130, 34, 0.55, 0.5, t); },
    hurt: (t) => { osc('sawtooth', 430, 110, 0.3, 0.16, t); noise(0.18, 0.1, 'bandpass', 1500, 400, t, 1); },
    quack: (t) => quack(t, rand(0.95, 1.08)),
    quack2: (t) => { quack(t, 1.1); quack(t + 0.2, 0.95); },
    heal: (t) => [523, 659, 784, 1047].forEach((f, i) => osc('triangle', f, f, 0.13, 0.17, t + i * 0.06)),
    slurp: (t) => noise(0.32, 0.14, 'bandpass', 500, 2600, t, 7),
    chomp: (t) => { noise(0.08, 0.3, 'lowpass', 1900, 350, t); noise(0.08, 0.3, 'lowpass', 1900, 350, t + 0.14); },
    power: (t) => [392, 523, 659, 784, 1047].forEach((f, i) => osc('square', f, f, 0.08, 0.07, t + i * 0.045)),
    bombGet: (t) => [659, 880, 1175].forEach((f, i) => osc('square', f, f * 1.01, 0.1, 0.08, t + i * 0.07)),
    bomb: (t) => { noise(1.2, 0.55, 'lowpass', 3200, 80, t); osc('sawtooth', 90, 38, 0.9, 0.25, t); osc('sine', 220, 1300, 0.5, 0.1, t); },
    wave: (t) => { noise(1.4, 0.45, 'bandpass', 300, 1800, t, 0.8); noise(1.2, 0.25, 'lowpass', 900, 200, t + 0.2); },
    siren: (t) => { for (let i = 0; i < 3; i++) { osc('square', 660, 660, 0.22, 0.07, t + i * 0.5); osc('square', 495, 495, 0.22, 0.07, t + i * 0.5 + 0.25); } },
    charge: (t) => { noise(0.8, 0.16, 'bandpass', 300, 2400, t, 4); osc('sawtooth', 90, 300, 0.8, 0.05, t); },
    throw: (t) => noise(0.13, 0.13, 'bandpass', 1100, 3600, t, 2),
    swoosh: (t) => noise(0.25, 0.14, 'bandpass', 2400, 700, t, 2),
    babble: (t) => { for (let i = 0; i < 6; i++) osc('square', rand(330, 560), rand(260, 480), 0.05, 0.045, t + i * 0.075); },
    blub: (t) => { for (let i = 0; i < 5; i++) osc('sine', rand(180, 260), rand(500, 800), 0.07, 0.12, t + i * 0.08); },
    click: (t) => osc('triangle', 880, 660, 0.05, 0.12, t),
    bossHit: (t) => osc('square', 170, 120, 0.04, 0.05, t),
    clink: (t) => { osc('triangle', 2200, 1800, 0.08, 0.06, t); },
    tick: (t) => osc('square', 1900, 1700, 0.025, 0.05, t),
    honk: (t) => { osc('square', 415, 415, 0.16, 0.09, t); osc('square', 523, 523, 0.16, 0.07, t); osc('square', 415, 415, 0.22, 0.09, t + 0.2); osc('square', 523, 523, 0.22, 0.07, t + 0.2); },
    suck: (t) => { noise(1.6, 0.3, 'bandpass', 2200, 180, t, 1.5); osc('sawtooth', 160, 60, 1.4, 0.05, t); },
    charm: (t) => [784, 988, 1175, 1568, 1976].forEach((f, i) => osc('triangle', f, f, 0.12, 0.12, t + i * 0.05)),
    slowOn: (t) => { osc('sine', 900, 180, 0.7, 0.18, t); noise(0.6, 0.1, 'lowpass', 1500, 200, t); },
    don: (t) => { osc('sine', 75, 38, 0.4, 0.6, t); noise(0.25, 0.25, 'lowpass', 400, 80, t); osc('sine', 75, 38, 0.45, 0.6, t + 0.34); noise(0.25, 0.25, 'lowpass', 400, 80, t + 0.34); },
    drone: (t) => { osc('sawtooth', 55, 52, 4.5, 0.12, t, undefined, 1.2); osc('sine', 41, 40, 4.5, 0.25, t, undefined, 1.2); osc('triangle', 220, 196, 4, 0.03, t + 0.5, undefined, 1.5); },
    squelch: (t) => { noise(0.7, 0.45, 'bandpass', 250, 1400, t, 3); osc('sawtooth', 90, 45, 0.6, 0.15, t); noise(1.2, 0.2, 'lowpass', 600, 120, t + 0.4); },
    win: (t) => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => osc('square', f, f, i === 5 ? 0.6 : 0.14, 0.09, t + i * 0.13)),
    lose: (t) => [392, 330, 262, 196].forEach((f, i) => osc('triangle', f, f * 0.98, 0.32, 0.17, t + i * 0.22)),
  };
  const GAP = { hit: 0.05, knife: 0.06, bubble: 0.06, bossHit: 0.06, pop: 0.03, popWater: 0.03, clink: 0.08 };

  function play(name) {
    if (!ac || muted || ac.state !== 'running') return;
    const now = ac.currentTime;
    if (last[name] !== undefined && now - last[name] < (GAP[name] || 0.02)) return;
    last[name] = now;
    try { SFX[name](now + 0.005); } catch (e) { /* ignore a failed sound */ }
  }

  /* ---------- music */
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(tok) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(tok);
    if (!m) return 0;
    const n = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }
  function parseTrack(str, drum) {
    const toks = str.trim().split(/\s+/).filter((x) => x !== '|');
    const ev = new Array(toks.length).fill(null);
    for (let i = 0; i < toks.length; i++) {
      const tk = toks[i];
      if (tk === '.' || tk === '-') continue;
      if (drum) { ev[i] = { tok: tk }; continue; }
      let len = 1;
      while (toks[i + len] === '-') len++;
      ev[i] = { f: freq(tk), len };
    }
    return ev;
  }
  const SONGS = {
    sky: {
      bpm: 136, echo: 0.08,
      parts: [
        { wave: 'square', vol: 0.11, vib: true, str:
          'E5 - G5 - C6 - - - B5 - G5 - E5 - D5 - | C5 - E5 - A5 - - - G5 - E5 - C5 - D5 - | F5 - A5 - C6 - - - A5 - F5 - A5 - C6 - | B5 - - - G5 - - - D5 - G5 - B5 - D6 - |' +
          'E6 - - - D6 - C6 - B5 - C6 - G5 - E5 - | A5 - - - E5 - A5 - C6 - B5 - A5 - E5 - | F5 - A5 - C6 - F6 - E6 - D6 - C6 - A5 - | G5 - - - - - - - B5 - D6 - G6 - - -' },
        { wave: 'triangle', vol: 0.26, str:
          'C3 - C4 - G3 - C4 - C3 - C4 - G3 - E3 - | A2 - A3 - E3 - A3 - A2 - A3 - E3 - C3 - | F2 - F3 - C3 - F3 - F2 - F3 - C3 - A2 - | G2 - G3 - D3 - G3 - G2 - G3 - D3 - B2 -' },
        { drum: true, vol: 0.8, str: 'K . H . S . H . K . K H S . H H' },
      ],
    },
    sea: {
      bpm: 104, echo: 0.42,
      parts: [
        { wave: 'triangle', vol: 0.07, gate: 0.55, str:
          'A4 C5 E5 A5 E5 C5 A4 C5 E5 A5 E5 C5 A4 C5 E5 C5 | F4 A4 C5 F5 C5 A4 F4 A4 C5 F5 C5 A4 F4 A4 C5 A4 | G4 B4 D5 G5 D5 B4 G4 B4 D5 G5 D5 B4 G4 B4 D5 B4 | E4 G4 B4 E5 B4 G4 E4 G4 B4 E5 B4 G4 E4 G4 B4 G4' },
        { wave: 'sine', vol: 0.16, vib: true, echo: true, str:
          'E5 - - - - - D5 - C5 - - - B4 - A4 - | C5 - - - - - - - A4 - - - - - - - | B4 - - - D5 - - - G5 - - - F#5 - D5 - | E5 - - - - - - - - - - - . . . . |' +
          'A5 - - - G5 - E5 - C5 - - - D5 - E5 - | F5 - - - E5 - C5 - A4 - - - - - . . | G5 - - - F#5 - D5 - B4 - - - D5 - G5 - | E5 - - - - - - - B4 - - - - - - -' },
        { wave: 'triangle', vol: 0.26, str:
          'A2 - - - - - - - A2 - - - E2 - - - | F2 - - - - - - - F2 - - - C3 - - - | G2 - - - - - - - G2 - - - D3 - - - | E2 - - - - - - - E2 - - - B2 - - -' },
        { drum: true, vol: 0.45, str: 'K . . . H . . . K . . H . . H .' },
      ],
    },
    boss: {
      bpm: 152, echo: 0.06,
      parts: [
        { wave: 'square', vol: 0.1, vib: true, str:
          'E5 - B4 - E5 - G5 - F#5 - E5 - D5 - B4 - | C5 - E5 - G5 - C6 - B5 - G5 - E5 - C5 - | D5 - F#5 - A5 - D6 - C6 - A5 - F#5 - D5 - | D#5 - F#5 - B5 - - - A5 - F#5 - D#5 - B4 - |' +
          'E5 - - - G5 - - - B5 - - - A5 - G5 - | C6 - - - B5 - - - G5 - - - E5 - - - | D6 - - - C6 - - - A5 - F#5 - A5 - D6 - | B5 - - - - - - - D#6 - - - F#6 - - -' },
        { wave: 'sawtooth', vol: 0.085, str:
          'E2 - E3 - E2 - E3 - E2 - E3 - D3 - B2 - | C3 - C4 - C3 - C4 - C3 - C4 - B2 - G2 - | D3 - D4 - D3 - D4 - D3 - D4 - C4 - A3 - | B2 - B3 - B2 - B3 - B2 - B3 - A3 - F#3 -' },
        { drum: true, vol: 0.9, str: 'K . H K S . H . K . H K S . H H' },
      ],
    },
  };
  SONGS.sky2 = Object.assign({}, SONGS.sky, { bpm: 148, tracks: undefined });
  SONGS.sea2 = Object.assign({}, SONGS.sea, { bpm: 114, tracks: undefined });
  SONGS.sea3 = Object.assign({}, SONGS.sea, { bpm: 128, tracks: undefined });
  SONGS.boss3 = Object.assign({}, SONGS.boss, { bpm: 166, tracks: undefined });
  function drum(tok, t, vol) {
    if (tok === 'K') osc('sine', 150, 42, 0.17, 0.9 * vol, t, musicBus, 0.002);
    else if (tok === 'S') { noise(0.13, 0.42 * vol, 'highpass', 1300, 0, t, 0.7, musicBus); osc('triangle', 230, 160, 0.08, 0.28 * vol, t, musicBus); }
    else if (tok === 'H') noise(0.035, 0.2 * vol, 'highpass', 7200, 0, t, 0.7, musicBus);
  }
  function note(tr, ev, t, spb) {
    const dur = ev.len * spb * (tr.gate || 0.92);
    const o = ac.createOscillator(); o.type = tr.wave; o.frequency.setValueAtTime(ev.f, t);
    if (tr.vib && dur > 0.18) {
      const l = ac.createOscillator(), lg = ac.createGain();
      l.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(ev.f * 0.007, t + 0.15);
      l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.1);
    }
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(tr.vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(tr.vol * 0.6, t + Math.min(dur, 0.12) + 0.013);
    g.gain.setValueAtTime(tr.vol * 0.6, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.07);
    o.connect(g); g.connect(musicBus);
    if (tr.echo) g.connect(echo);
    o.start(t); o.stop(t + dur + 0.1);
  }
  function schedule() {
    if (!ac || !song || ac.state !== 'running') return;
    const spb = 60 / song.bpm / 4;
    if (nextTime < ac.currentTime - 0.2) nextTime = ac.currentTime + 0.05;
    while (nextTime < ac.currentTime + 0.12) {
      if (!muted) {
        for (const tr of song.tracks) {
          const ev = tr.ev[step % tr.ev.length];
          if (!ev) continue;
          if (tr.drum) drum(ev.tok, nextTime, tr.vol); else note(tr, ev, nextTime, spb);
        }
      }
      nextTime += spb; step++;
    }
  }
  function music(name) {
    if (!ac) return;
    const s = name && SONGS[name];
    if (!s) { song = null; return; }
    if (!s.tracks) s.tracks = s.parts.map((p) => Object.assign({}, p, { ev: parseTrack(p.str, p.drum) }));
    song = s; step = 0; nextTime = ac.currentTime + 0.1;
    echoWet.gain.setTargetAtTime(s.echo || 0, ac.currentTime, 0.1);
  }
  function setMuted(m) {
    muted = !!m; store.set('muted', muted);
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ac.currentTime, 0.03);
  }
  return { init, play, music, setMuted, isMuted: () => muted, suspend, resume, ready: () => !!ac };
})();
const sfx = (n) => Sound.play(n);
