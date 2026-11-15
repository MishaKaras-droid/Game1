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
    hiss: (t) => { noise(1.4, 0.3, 'highpass', 4200, 2600, t, 0.8); noise(1.2, 0.12, 'bandpass', 6000, 5000, t + 0.3, 2); },
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
  function freq1(tok) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(tok);
    if (!m) return 0;
    const n = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }
  const freq = (tok) => tok.split('+').map(freq1);   // 'A3+C4+E4' is a chord
  function parseTrack(str, drum) {
    const toks = str.split(/[\s|]+/).filter(Boolean);
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
  /* ---------- song book
     One token is a 16th note: a note ('F#5'), a chord ('A3+C4+E4'), '-' holds the note, '.' is a rest, '|' is only for the eye.
     Part options: wave, vol, vib (vibrato), gate (note length, 0..1), echo (send to the delay), pluck (seconds of decay:
     marimba, balalaika, cowbell), det (cents: a second detuned oscillator), drum (K kick, S snare, H hat, O open hat,
     C clap, T / t high / low tom, R rim, M shaker). Song options: bpm, echo, swing (0..0.3), lp (music low-pass, Hz).
     Parts loop on their own length, so a 4-bar bass runs under an 8-bar melody. */
  const rep = (s, n) => (s + ' ').repeat(n);
  const arp = (a, b, c, d) => rep([a, b, c, d, c, b].join(' '), 2) + [a, b, c, b].join(' ') + ' ';   // one bar of 16ths
  const oct8 = (n, o) => rep(n + o + ' - ' + n + (o + 1) + ' -', 4);                                   // octave-jumping 8ths
  const off = (c) => rep('. . ' + c + ' .', 4);                                                        // off-beat stabs
  const whole = (c) => c + rep(' -', 15);
  const m8 = (s) => s.trim().split(/\s+/).map((n) => n + ' ' + n).join(' ') + ' ';                     // 8ths as a 16th tremolo
  const polka = (a, b) => rep(a + ' - . . ' + b + ' - . .', 2);
  const SONGS = {
    /* ----- duck 1 «Небо над городом»: a sunny march in C */
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
    /* ----- duck 2 «Вечер над городом и выше облаков»: dreamy evening synth, long echoing lead over slow arpeggios */
    dusk: {
      bpm: 140, echo: 0.34,
      parts: [
        { wave: 'sawtooth', vol: 0.06, vib: true, echo: true, det: 9, str:
          'E5 - - - - - C5 - E5 - - - A5 - - - | G5 - - - F5 - - - C5 - - - - - . . | E5 - - - - - D5 - E5 - - - G5 - - - | D5 - - - - - - - B4 - - - D5 - - - |' +
          'A5 - - - - - G5 - E5 - - - C6 - - - | A5 - - - - - - - F5 - - - A5 - - - | G5 - - - E5 - - - C5 - - - E5 - G5 - | B5 - - - - - A5 - G5 - - - - - . .' },
        { wave: 'triangle', vol: 0.085, gate: 0.6, str:
          'A3 - E4 - A4 - C5 - E5 - C5 - A4 - E4 - | F3 - C4 - F4 - A4 - C5 - A4 - F4 - C4 - | C4 - G4 - C5 - E5 - G5 - E5 - C5 - G4 - | G3 - D4 - G4 - B4 - D5 - B4 - G4 - D4 -' },
        { wave: 'triangle', vol: 0.24, str:
          'A2 - - - . . A2 - A2 - - - E3 - - - | F2 - - - . . F2 - F2 - - - C3 - - - | C3 - - - . . C3 - C3 - - - G2 - - - | G2 - - - . . G2 - G2 - - - D3 - - -' },
        { drum: true, vol: 0.6, str: 'K . . H S . . H K . K H S . H .' },
      ],
    },
    /* ----- duck 3 «Посадка и забег»: ska sprint in D, off-beat stabs and a walking bass */
    run: {
      bpm: 160, echo: 0.05,
      parts: [
        { wave: 'square', vol: 0.1, vib: true, str:
          'F#5 - A5 - D6 - A5 - F#5 - A5 - D6 - - - | B5 - - - G5 - B5 - D6 - - - B5 - - - | C#6 - - - A5 - C#6 - E6 - - - C#6 - A5 - | D6 - - - - - A5 - F#5 - - - . . . . |' +
          'D6 - B5 - F#5 - B5 - D6 - B5 - F#6 - - - | E6 - D6 - B5 - G5 - B5 - - - D6 - - - | E6 - - - C#6 - A5 - C#6 - E6 - A6 - - - | G6 - - - E6 - - - C#6 - E6 - A5 - - -' },
        { wave: 'square', vol: 0.028, gate: 0.45, str:
          off('D4+F#4+A4') + off('G3+B3+D4') + off('A3+C#4+E4') + off('D4+F#4+A4') + off('B3+D4+F#4') + off('G3+B3+D4') + off('A3+C#4+E4') + off('A3+C#4+G4') },
        { wave: 'triangle', vol: 0.26, str:
          'D3 - F#3 - A3 - F#3 - D3 - F#3 - A3 - B3 - | G2 - B2 - D3 - B2 - G2 - B2 - D3 - E3 - | A2 - C#3 - E3 - C#3 - A2 - C#3 - E3 - F#3 - | D3 - F#3 - A3 - F#3 - D3 - F#3 - A3 - B3 - |' +
          'B2 - D3 - F#3 - D3 - B2 - D3 - F#3 - A3 - | G2 - B2 - D3 - B2 - G2 - B2 - D3 - E3 - | A2 - C#3 - E3 - C#3 - A2 - C#3 - E3 - F#3 - | A2 - C#3 - E3 - G3 - A3 - G3 - E3 - C#3 -' },
        { drum: true, vol: 0.8, str: 'K . H . S . H . K . H K S . H H' },
      ],
    },
    /* ----- duck 4 «Город и Диссертация»: boost through the city — racing arpeggios and a pumping bass */
    thesis: {
      bpm: 168, echo: 0.07,
      parts: [
        { wave: 'square', vol: 0.085, vib: true, det: 7, str:
          'E5 - G5 - B5 - - - A5 - G5 - E5 - G5 - | E5 - - - C5 - E5 - G5 - - - - - E5 - | F#5 - A5 - D6 - - - C6 - A5 - F#5 - A5 - | B5 - - - - - F#5 - B5 - - - D6 - - - |' +
          'E6 - - - D6 - B5 - G5 - B5 - D6 - E6 - | C6 - - - B5 - G5 - E5 - G5 - C6 - - - | D6 - - - A5 - D6 - F#6 - - - E6 - D6 - | D#6 - - - B5 - - - F#5 - B5 - D#6 - F#6 -' },
        { wave: 'triangle', vol: 0.06, gate: 0.6, str:
          arp('E4', 'G4', 'B4', 'E5') + arp('C4', 'E4', 'G4', 'C5') + arp('D4', 'F#4', 'A4', 'D5') + arp('B3', 'D4', 'F#4', 'B4') +
          arp('E4', 'G4', 'B4', 'E5') + arp('C4', 'E4', 'G4', 'C5') + arp('D4', 'F#4', 'A4', 'D5') + arp('B3', 'D#4', 'F#4', 'B4') },
        { wave: 'sawtooth', vol: 0.08, str: oct8('E', 2) + oct8('C', 2) + oct8('D', 2) + oct8('B', 1) },
        { drum: true, vol: 0.85, str: 'K . H . S . H K K . H . S . H S' },
      ],
    },
    /* ----- duck 5 «Академический отпуск»: zombie tiptoe — tritones, a theremin and a slow heartbeat */
    zombie: {
      bpm: 144, echo: 0.3,
      parts: [
        { wave: 'square', vol: 0.075, gate: 0.5, str:
          'E4 . E5 . B4 . Bb4 . E4 . E5 . B4 . Bb4 . | E4 . E5 . B4 . Bb4 . A4 - G4 - F#4 - G4 - | C4 . C5 . G4 . F#4 . C4 . C5 . G4 . F#4 . | B3 . B4 . F#4 . F4 . D#4 - F#4 - B4 - D#5 -' },
        { wave: 'sine', vol: 0.12, vib: true, echo: true, str:
          'B5 - - - - - - - Bb5 - - - - - - - | B5 - - - - - - - E6 - - - - - - - | G5 - - - - - - - F#5 - - - - - - - | F#5 - - - - - - - D#5 - - - - - - - |' +
          'E6 - - - - - - - Eb6 - - - - - - - | E6 - - - - - D6 - B5 - - - - - - - | C6 - - - - - - - B5 - - - - - - - | A5 - - - - - - - B5 - - - - - . .' },
        { wave: 'triangle', vol: 0.26, str:
          'E2 - - - E2 - - - E2 - - - E2 - G2 - | E2 - - - E2 - - - E2 - - - E2 - G2 - | C3 - - - C3 - - - C3 - - - C3 - E3 - | B2 - - - B2 - - - B2 - - - B2 - D#3 -' },
        { drum: true, vol: 0.7, str: 'K . M . S . M H K . K M S . M .' },
      ],
    },
    /* ----- duck 6 «Курсач в Кубе»: pure 8-bit — bare squares, bouncy and blocky */
    cube: {
      bpm: 132, echo: 0,
      parts: [
        { wave: 'square', vol: 0.1, gate: 0.8, str:
          'E5 . E5 G5 . E5 C5 . D5 . E5 - . . G5 - | A5 . A5 G5 . E5 C5 . E5 - - - . . . . | F5 . F5 A5 . F5 C5 . D5 . F5 - . . A5 - | G5 . B5 D6 . B5 G5 . D5 - - - G5 - - - |' +
          'C6 . C6 G5 . E5 G5 . C6 . E6 - . . D6 - | C6 . A5 E5 . A5 C6 . E6 - - - C6 - A5 - | A5 . F5 C5 . F5 A5 . C6 - A5 - F5 - A5 - | G5 - B5 - D6 - G6 - . . G5 G5 G5 - . .' },
        { wave: 'square', vol: 0.03, gate: 0.5, str: arp('C4', 'E4', 'G4', 'C5') + arp('A3', 'C4', 'E4', 'A4') + arp('F3', 'A3', 'C4', 'F4') + arp('G3', 'B3', 'D4', 'G4') },
        { wave: 'triangle', vol: 0.27, str:
          'C3 - . C3 G2 - . G2 C3 - . C3 E3 - G3 - | A2 - . A2 E2 - . E2 A2 - . A2 C3 - E3 - | F2 - . F2 C3 - . C3 F2 - . F2 A2 - C3 - | G2 - . G2 D3 - . D3 G2 - . G2 B2 - D3 -' },
        { drum: true, vol: 0.75, str: 'K . H . S . H H K . H K S . H .' },
      ],
    },
    /* ----- carp 1 «Тёплое море»: a lazy wave in A minor */
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
    /* ----- carp 2 «Глубокие воды»: darker and slower, D minor, more echo, muffled highs */
    deep: {
      bpm: 100, echo: 0.5, lp: 3000,
      parts: [
        { wave: 'triangle', vol: 0.07, gate: 0.55, str: arp('D4', 'F4', 'A4', 'D5') + arp('Bb3', 'D4', 'F4', 'Bb4') + arp('G3', 'Bb3', 'D4', 'G4') + arp('A3', 'C#4', 'E4', 'A4') },
        { wave: 'sine', vol: 0.16, vib: true, echo: true, str:
          'A5 - - - - - G5 - F5 - - - E5 - D5 - | F5 - - - - - - - D5 - - - - - - - | G5 - - - Bb5 - - - D6 - - - C6 - Bb5 - | A5 - - - - - - - - - - - . . . . |' +
          'D6 - - - C6 - A5 - F5 - - - G5 - A5 - | Bb5 - - - A5 - F5 - D5 - - - - - . . | G5 - - - F5 - D5 - Bb4 - - - D5 - G5 - | E5 - - - - - - - C#5 - - - - - - -' },
        { wave: 'triangle', vol: 0.27, str:
          'D2 - - - - - - - D2 - - - A2 - - - | Bb2 - - - - - - - Bb2 - - - F2 - - - | G2 - - - - - - - G2 - - - D3 - - - | A2 - - - - - - - A2 - - - E2 - - -' },
        { drum: true, vol: 0.4, str: 'K . . . . . H . K . . H . . . .' },
      ],
    },
    /* ----- carp 3 «Газ! Туннели и тёмные глубины»: pedal to the floor — a galloping bass in E minor */
    gas: {
      bpm: 150, echo: 0.1,
      parts: [
        { wave: 'square', vol: 0.095, vib: true, str:
          'B5 - - - E5 - G5 - B5 - - - A5 - G5 - | D6 - - - B5 - G5 - D5 - G5 - B5 - - - | C6 - - - A5 - E5 - A5 - C6 - E6 - - - | D#6 - - - - - B5 - F#5 - - - B5 - - - |' +
          'E6 - D6 - B5 - G5 - E5 - G5 - B5 - E6 - | D6 - B5 - G5 - D5 - G5 - B5 - D6 - G6 - | E6 - - - C6 - - - A5 - C6 - E6 - A6 - | F#6 - - - - - - - D#6 - - - B5 - - -' },
        { wave: 'sawtooth', vol: 0.085, gate: 0.7, str: rep('E2 . E2 E2', 4) + rep('G2 . G2 G2', 4) + rep('A2 . A2 A2', 4) + rep('B2 . B2 B2', 4) },
        { drum: true, vol: 0.85, str: 'K . H H S . H H K K H H S . H S' },
      ],
    },
    /* ----- carp 4 «Ожидается каточка»: the match is loading — four on the floor, claps, an off-beat bass */
    katka: {
      bpm: 128, echo: 0.16,
      parts: [
        { wave: 'sawtooth', vol: 0.06, det: 12, pluck: 0.22, echo: true, str:
          'G5 . G5 . Eb5 . G5 . C6 . . Bb5 . . G5 . | Ab5 . Ab5 . Eb5 . Ab5 . C6 . . Bb5 . . Ab5 . | G5 . G5 . Eb5 . G5 . Bb5 . . G5 . . Eb5 . | F5 . F5 . D5 . F5 . Bb5 - - - D6 - - - |' +
          'C6 . C6 . G5 . C6 . Eb6 . . D6 . . C6 . | C6 . C6 . Ab5 . C6 . Eb6 . . C6 . . Ab5 . | Bb5 . Bb5 . G5 . Bb5 . Eb6 . . D6 . . Bb5 . | D6 - - - Bb5 - - - F5 - G5 - Bb5 - D6 -' },
        { wave: 'triangle', vol: 0.04, str: whole('C4+Eb4+G4') + ' ' + whole('Ab3+C4+Eb4') + ' ' + whole('G3+Bb3+Eb4') + ' ' + whole('F3+Bb3+D4') },
        { wave: 'sawtooth', vol: 0.09, gate: 0.7, str: rep('. . C2 C2', 3) + '. . C2 C3 ' + rep('. . Ab2 Ab2', 3) + '. . Ab2 Ab3 ' + rep('. . Eb2 Eb2', 3) + '. . Eb2 Eb3 ' + rep('. . Bb2 Bb2', 3) + '. . Bb2 Bb3' },
        { drum: true, vol: 0.9, str: 'K . O . K . O . K . O . K . O H' },
        { drum: true, vol: 0.7, str: '. . . . C . . . . . . . C . . .' },
      ],
    },
    /* ----- carp 5 «Удачи, брат»: electric eel — buzzing saw arpeggios, even faster */
    bro: {
      bpm: 146, echo: 0.12,
      parts: [
        { wave: 'square', vol: 0.085, vib: true, str:
          'D6 - - - Bb5 - G5 - Bb5 - - - D6 - - - | Eb6 - - - Bb5 - G5 - Bb5 - - - G5 - - - | F6 - - - D6 - Bb5 - D6 - - - F6 - - - | A5 - C6 - F6 - - - Eb6 - - - C6 - - - |' +
          'G6 - - - F6 - D6 - Bb5 - D6 - F6 - G6 - | G6 - - - Eb6 - - - Bb5 - Eb6 - G6 - - - | F6 - - - D6 - - - Bb5 - D6 - F6 - D6 - | C6 - - - - - A5 - F5 - - - - - . .' },
        { wave: 'sawtooth', vol: 0.032, gate: 0.5, str: arp('G4', 'Bb4', 'D5', 'G5') + arp('Eb4', 'G4', 'Bb4', 'Eb5') + arp('Bb3', 'D4', 'F4', 'Bb4') + arp('F4', 'A4', 'C5', 'F5') },
        { wave: 'triangle', vol: 0.26, str: oct8('G', 2) + oct8('Eb', 2) + oct8('Bb', 2) + oct8('F', 2) },
        { drum: true, vol: 0.85, str: 'K . H . S . H K K . H . S . H H' },
      ],
    },
    /* ----- carp 6 «Все боссы против тебя»: a grim march in C minor */
    rush: {
      bpm: 144, echo: 0.08,
      parts: [
        { wave: 'square', vol: 0.085, vib: true, det: 8, str:
          'C5 - - - G5 - - - Eb5 - D5 - C5 - - - | C5 - - - G5 - - - Ab5 - G5 - Eb5 - - - | Ab5 - - - C6 - - - Bb5 - Ab5 - G5 - - - | G5 - - - B5 - - - D6 - - - - - . . |' +
          'C6 - - - G5 - - - Eb6 - D6 - C6 - - - | C6 - - - G5 - - - Ab5 - Bb5 - C6 - - - | Eb6 - - - C6 - - - Ab5 - C6 - Eb6 - - - | D6 - - - B5 - - - G5 - B5 - D6 - G6 -' },
        { wave: 'sawtooth', vol: 0.09, gate: 0.75, str:
          'C2 - - C2 C2 - C2 - C2 - - C2 C2 - Eb2 - | C2 - - C2 C2 - C2 - C2 - - C2 C2 - Eb2 - | Ab2 - - Ab2 Ab2 - Ab2 - Ab2 - - Ab2 Ab2 - Bb2 - | G2 - - G2 G2 - G2 - G2 - - G2 G2 - B2 -' },
        { drum: true, vol: 0.85, str: 'K . S S K . S . K . S S K S S S' },
      ],
    },
    /* ----- carp 7 «Амазонка»: jungle — a marimba ostinato, a pan flute, toms and shakers, a little swing */
    amazon: {
      bpm: 112, echo: 0.3, swing: 0.14,
      parts: [
        { wave: 'sine', vol: 0.15, vib: true, echo: true, str:
          'E5 - - - - - D5 E5 G5 - - - E5 - - - | F#5 - - - A5 - - - F#5 - E5 - D5 - - - | E5 - - - - - G5 A5 B5 - - - A5 - G5 - | B5 - - - - - A5 - G5 - - - E5 - - - |' +
          'A5 - - - - - G5 A5 C6 - - - B5 - A5 - | A5 - - - F#5 - - - D5 - F#5 - A5 - - - | C6 - - - B5 - A5 - G5 - - - E5 - G5 - | B5 - - - - - - - E5 - - - . . . .' },
        { wave: 'triangle', vol: 0.13, pluck: 0.2, str:
          'A3 . E4 A4 . E4 C5 . A4 . E4 A4 . C5 E4 . | D4 . A4 D5 . A4 F#5 . D5 . A4 D5 . F#5 A4 . | A3 . E4 A4 . E4 C5 . A4 . E4 A4 . C5 E4 . | G3 . D4 G4 . D4 B4 . E4 . B4 E5 . G5 B4 .' },
        { wave: 'triangle', vol: 0.26, str:
          'A2 - - . . A2 - . E3 - . A2 . . G2 . | D3 - - . . D3 - . A2 - . D3 . . E3 . | A2 - - . . A2 - . E3 - . A2 . . G2 . | G2 - - . . G2 - . E2 - . E3 . . G2 .' },
        { drum: true, vol: 0.7, str: 't . M . T . M M t . M T . T M .' },
        { drum: true, vol: 0.6, str: 'K . . . . . . K . . K . . . . .' },
      ],
    },
    /* ----- carp 8 «Это будет нелегко»: mangroves and the anaconda — a snake charmer's pipe over a drone */
    mangrove: {
      bpm: 118, echo: 0.24, swing: 0.08,
      parts: [
        { wave: 'square', vol: 0.075, vib: true, echo: true, str:
          'D5 - - - Eb5 - F#5 - G5 - F#5 - Eb5 - D5 - | Eb5 - F#5 - G5 - A5 - Bb5 - - - A5 - - - | A5 - Bb5 A5 G5 - F#5 - G5 - A5 G5 F#5 - Eb5 - | D5 - - - - - - - . . D5 Eb5 F#5 - D5 - |' +
          'A5 - - - Bb5 - C6 - D6 - - - C6 - Bb5 - | A5 - Bb5 - A5 - G5 - F#5 - - - Eb5 - - - | G5 - A5 G5 F#5 - Eb5 - F#5 - G5 F#5 Eb5 - D5 - | D5 - - - - - - - - - - - . . . .' },
        { wave: 'triangle', vol: 0.27, str: 'D2 - - - - - D3 - D2 - - - A2 - D3 - | D2 - - - - - D3 - Eb2 - - - Eb3 - D3 -' },
        { wave: 'sawtooth', vol: 0.022, str: whole('D3+A3') },
        { drum: true, vol: 0.7, str: 'K . M R . M T . K . M R T . M M' },
      ],
    },
    /* ----- carp 9 «Бурная Амазонка»: rapids — a rushing samba in E minor */
    rapids: {
      bpm: 140, echo: 0.12,
      parts: [
        { wave: 'square', vol: 0.09, vib: true, gate: 0.8, str:
          'E5 . G5 B5 . G5 E5 . B5 - A5 G5 . E5 G5 . | F#5 . A5 D6 . A5 F#5 . D6 - C6 A5 . F#5 A5 . | E5 . G5 C6 . G5 E5 . C6 - B5 G5 . E5 G5 . | F#5 . B5 D#6 . B5 F#5 . A5 - - - F#5 - D#5 - |' +
          'B5 - - G5 - - E5 - B5 - - G5 - - B5 - | A5 - - F#5 - - D5 - A5 - - F#5 - - A5 - | G5 - - E5 - - C5 - G5 - - E5 - - G5 - | F#5 - - D#5 - - B4 - B5 - A5 - F#5 - D#5 -' },
        { wave: 'triangle', vol: 0.26, str: rep('E2 - - E3 . . B2 -', 2) + rep('D2 - - D3 . . A2 -', 2) + rep('C3 - - C3 . . G2 -', 2) + rep('B2 - - B3 . . F#3 -', 2) },
        { drum: true, vol: 0.7, str: 'K M M R K M R M K M R M K R M R' },
        { drum: true, vol: 0.6, str: 't . . T . . t . . T . . T . T .' },
      ],
    },
    /* ----- carp 10 «Русские реки»: a balalaika tremolo over an oom-pah bass */
    rus: {
      bpm: 126, echo: 0.1,
      parts: [
        { wave: 'sawtooth', vol: 0.075, pluck: 0.11, det: 6, str:
          m8('A4 C5 E5 E5 E5 D5 C5 D5') + m8('E5 E5 C5 C5 A4 A4 A4 .') + m8('D5 F5 A5 A5 A5 G5 F5 G5') + m8('A5 A5 E5 E5 C5 C5 C5 .') +
          m8('F5 F5 D5 F5 A5 A5 G5 F5') + m8('E5 E5 C5 E5 A5 A5 E5 C5') + m8('B4 D5 E5 G#5 B5 G#5 E5 D5') + m8('C5 B4 A4 A4 A4 . A4 .') },
        { wave: 'square', vol: 0.03, gate: 0.4, str:
          off('A3+C4+E4') + off('A3+C4+E4') + off('A3+D4+F4') + off('A3+C4+E4') + off('A3+D4+F4') + off('A3+C4+E4') + off('G#3+B3+E4') + off('A3+C4+E4') },
        { wave: 'triangle', vol: 0.27, str:
          polka('A2', 'E2') + polka('A2', 'E2') + polka('D3', 'A2') + polka('A2', 'E2') + polka('D3', 'A2') + polka('A2', 'E2') + polka('E2', 'B2') + polka('A2', 'E2') },
        { drum: true, vol: 0.55, str: 'K . M . S . M . K . M . S . M M' },
      ],
    },
    /* ----- carp 11 «Озеро 228»: a shady pond — phonk cowbells, a fat low bass, claps */
    lake228: {
      bpm: 130, echo: 0.14,
      parts: [
        { wave: 'square', vol: 0.085, pluck: 0.16, det: 14, echo: true, str:
          'F5 . F5 . Ab5 . F5 . C6 . Bb5 . Ab5 . F5 . | F5 . F5 . Ab5 . F5 . Gb5 . Gb5 . Eb5 . Gb5 . | F5 . F5 . Ab5 . F5 . C6 . Bb5 . Ab5 . C6 . | Db6 . C6 . Ab5 . Gb5 . F5 - - - . . F5 F5' },
        { wave: 'triangle', vol: 0.32, str:
          'F2 - - - - - . F2 F2 - - - . . Ab2 - | F2 - - - - - . F2 Gb2 - - - - - . . | F2 - - - - - . F2 F2 - - - . . Ab2 - | Db3 - - - - - C3 - F2 - - - - - . .' },
        { wave: 'sawtooth', vol: 0.018, str: whole('F3+Ab3+C4') + ' ' + whole('Gb3+Bb3+Db4') },
        { drum: true, vol: 0.85, str: 'K . H . C . H K . . K . C . H H' },
      ],
    },
    /* ===== bosses ===== */
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
    /* shawarma (duck 3): an oriental dance on a darbuka */
    bossShawa: {
      bpm: 150, echo: 0.1,
      parts: [
        { wave: 'sawtooth', vol: 0.07, vib: true, det: 6, str:
          'D5 - Eb5 - F#5 - G5 - A5 - - - G5 - F#5 - | Eb5 - F#5 - Eb5 - D5 - - - - - C5 - D5 - | A5 - Bb5 - A5 - G5 - F#5 - G5 - A5 - Bb5 - | A5 - G5 - F#5 - Eb5 - D5 - - - - - - - |' +
          'D6 - - - C6 - Bb5 - A5 - - - Bb5 - C6 - | D6 - Eb6 - D6 - C6 - Bb5 - A5 - G5 - F#5 - | G5 - A5 - Bb5 - A5 - G5 - F#5 - Eb5 - F#5 - | D5 - - - - - - - D6 - - - . . . .' },
        { wave: 'sawtooth', vol: 0.085, str:
          'D2 - D3 - D2 - D3 - D2 - D3 - Eb3 - D3 - | Eb2 - Eb3 - Eb2 - Eb3 - Eb2 - Eb3 - D3 - C3 - | G2 - G3 - G2 - G3 - G2 - G3 - A3 - Bb3 - | D2 - D3 - D2 - D3 - D2 - D3 - Eb3 - D3 -' },
        { drum: true, vol: 0.85, str: 'K . R . T . R R K . K . R . T R' },
      ],
    },
    /* the Dissertation and the Troll (duck 4, 5): a stern organ fugue */
    bossFugue: {
      bpm: 152, echo: 0.12,
      parts: [
        { wave: 'square', vol: 0.075, det: 10, gate: 0.8, str:
          'D5 A4 D5 F5 A5 F5 D5 F5 E5 A4 C#5 E5 A5 E5 C#5 E5 | F5 D5 F5 A5 D6 A5 F5 A5 G5 Bb4 D5 G5 Bb5 G5 D5 G5 | A5 E5 A5 C#6 E6 C#6 A5 G5 F5 D5 F5 A5 D6 A5 F5 D5 | E5 C#5 E5 G5 Bb5 G5 E5 C#5 D5 - - - A4 - D5 -' },
        { wave: 'sawtooth', vol: 0.09, str:
          'D3 - - - D3 - - - A2 - - - A2 - - - | D3 - - - D3 - - - G2 - - - G2 - - - | A2 - - - A2 - - - D3 - - - D3 - - - | A2 - - - A2 - - - D3 - D2 - D3 - - -' },
        { wave: 'triangle', vol: 0.045, str:
          'D4+F4+A4 - - - - - - - C#4+E4+A4 - - - - - - - | D4+F4+A4 - - - - - - - D4+G4+Bb4 - - - - - - - | C#4+E4+A4 - - - - - - - D4+F4+A4 - - - - - - - | C#4+E4+G4 - - - - - - - D4+F4+A4 - - - - - - -' },
        { drum: true, vol: 0.85, str: 'K . H . S . H . K K H . S . H H' },
      ],
    },
    /* the Head Moderator (duck 6): an 8-bit boss */
    bossCube: {
      bpm: 160, echo: 0,
      parts: [
        { wave: 'square', vol: 0.1, str:
          'A5 - E5 - A5 - C6 - B5 - A5 - G#5 - E5 - | F5 - A5 - C6 - F6 - E6 - C6 - A5 - F5 - | G5 - B5 - D6 - G6 - F6 - D6 - B5 - G5 - | E5 - G#5 - B5 - E6 - - - D6 - B5 - G#5 -' },
        { wave: 'square', vol: 0.03, gate: 0.5, str: arp('A3', 'C4', 'E4', 'A4') + arp('F3', 'A3', 'C4', 'F4') + arp('G3', 'B3', 'D4', 'G4') + arp('E3', 'G#3', 'B3', 'E4') },
        { wave: 'triangle', vol: 0.27, str: oct8('A', 2) + oct8('F', 2) + oct8('G', 2) + oct8('E', 2) },
        { drum: true, vol: 0.85, str: 'K . H K S . H . K . H K S . S S' },
      ],
    },
    /* alligator, anaconda, vampire fish (carp 7–9): war drums */
    bossJungle: {
      bpm: 150, echo: 0.1,
      parts: [
        { wave: 'sawtooth', vol: 0.075, vib: true, det: 8, str:
          'E5 - - E5 F5 - E5 - D5 - E5 - G5 - - - | E5 - - E5 F5 - E5 - D5 - C5 - B4 - - - | E5 - - E5 F5 - G5 - A5 - G5 - F5 - E5 - | F5 - - - E5 - - - D5 - F5 - E5 - - - |' +
          'B5 - - B5 C6 - B5 - A5 - B5 - D6 - - - | B5 - - B5 C6 - B5 - A5 - G5 - F5 - - - | E6 - - E6 F6 - E6 - D6 - C6 - B5 - A5 - | G5 - F5 - E5 - - - - - - - . . E5 E5' },
        { wave: 'sawtooth', vol: 0.09, gate: 0.75, str: 'E2 - - E2 . E2 E2 - E2 - - E2 . F2 E2 -' },
        { drum: true, vol: 0.9, str: 'K . t t S . t K K . t t S T T t' },
      ],
    },
    /* red salmon and red crayfish (carp 10, 11): a furious folk dance */
    bossRus: {
      bpm: 168, echo: 0.06,
      parts: [
        { wave: 'sawtooth', vol: 0.08, pluck: 0.1, det: 6, str:
          m8('A5 E5 A5 C6 B5 A5 G#5 E5') + m8('F5 D5 F5 A5 G5 F5 E5 D5') + m8('E5 G#5 B5 E6 D6 B5 G#5 E5') + m8('A5 C6 E6 C6 A5 . A5 .') },
        { wave: 'square', vol: 0.032, gate: 0.4, str: off('A3+C4+E4') + off('A3+D4+F4') + off('G#3+B3+E4') + off('A3+C4+E4') },
        { wave: 'sawtooth', vol: 0.09, str: polka('A2', 'E2') + polka('D3', 'A2') + polka('E2', 'B2') + polka('A2', 'E2') },
        { drum: true, vol: 0.9, str: 'K . H . S . H . K . H K S . S S' },
      ],
    },
  };
  SONGS.boss3 = Object.assign({}, SONGS.boss, { bpm: 166, tracks: undefined });
  function drum(tok, t, vol) {
    if (tok === 'K') osc('sine', 150, 42, 0.17, 0.9 * vol, t, musicBus, 0.002);
    else if (tok === 'S') { noise(0.13, 0.42 * vol, 'highpass', 1300, 0, t, 0.7, musicBus); osc('triangle', 230, 160, 0.08, 0.28 * vol, t, musicBus); }
    else if (tok === 'H') noise(0.035, 0.2 * vol, 'highpass', 7200, 0, t, 0.7, musicBus);
    else if (tok === 'O') noise(0.16, 0.16 * vol, 'highpass', 6500, 0, t, 0.7, musicBus);
    else if (tok === 'C') { for (let i = 0; i < 3; i++) noise(i === 2 ? 0.12 : 0.02, 0.32 * vol, 'bandpass', 1500, 0, t + i * 0.012, 1.2, musicBus); }
    else if (tok === 'T') osc('sine', 230, 150, 0.16, 0.6 * vol, t, musicBus, 0.002);
    else if (tok === 't') osc('sine', 150, 95, 0.2, 0.7 * vol, t, musicBus, 0.002);
    else if (tok === 'R') { osc('triangle', 1250, 1150, 0.035, 0.3 * vol, t, musicBus, 0.001); noise(0.02, 0.1 * vol, 'highpass', 3000, 0, t, 0.7, musicBus); }
    else if (tok === 'M') noise(0.06, 0.13 * vol, 'bandpass', 5200, 0, t, 1.5, musicBus);
  }
  function note(tr, ev, t, spb) {
    const dur = ev.len * spb * (tr.gate || 0.92);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(tr.vol, t + (tr.pluck ? 0.004 : 0.012));
    if (tr.pluck) g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, tr.pluck) + 0.02);
    else {
      g.gain.exponentialRampToValueAtTime(tr.vol * 0.6, t + Math.min(dur, 0.12) + 0.013);
      g.gain.setValueAtTime(tr.vol * 0.6, t + dur);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.07);
    }
    const end = t + (tr.pluck ? Math.max(dur, tr.pluck) : dur) + 0.1;
    g.connect(musicBus);
    if (tr.echo) g.connect(echo);
    for (const f of ev.f) {
      for (let k = 0; k < (tr.det ? 2 : 1); k++) {
        const o = ac.createOscillator(); o.type = tr.wave; o.frequency.setValueAtTime(f, t);
        if (k) o.detune.value = tr.det;
        if (tr.vib && dur > 0.18) {
          const l = ac.createOscillator(), lg = ac.createGain();
          l.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.007, t + 0.15);
          l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(end);
        }
        o.connect(g); o.start(t); o.stop(end);
      }
    }
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
          const t = nextTime + (step & 1 ? (song.swing || 0) * spb : 0);
          if (tr.drum) drum(ev.tok, t, tr.vol); else note(tr, ev, t, spb);
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
    musicLP.frequency.setTargetAtTime(s.lp || 4200, ac.currentTime, 0.1);
  }
  function setMuted(m) {
    muted = !!m; store.set('muted', muted);
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ac.currentTime, 0.03);
  }
  return { init, play, music, setMuted, isMuted: () => muted, suspend, resume, ready: () => !!ac };
})();
const sfx = (n) => Sound.play(n);
