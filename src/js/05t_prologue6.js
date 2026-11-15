/* ============================================================ duck level 6: the comic prologue, drawn right here
   Three slides for PrologueComicOverlay (src/level5_prologue_and_juice.js). No image files: every slide is an inline
   SVG in a voxel-comic style (gradients, drop shadows, ink outlines) with small CSS animations.
   Each SVG prefixes its ids (a_, b_, c_), because all three sit in the page at once. */
const P6_INK = '#1b1626';
const p6S = `stroke="${P6_INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
// an oblique cube: front face, top face, right face
function p6Cube(x, y, w, h, d, front, top, side, sw) {
  const e = d * 0.55, st = `stroke="${P6_INK}" stroke-width="${sw || 3}" stroke-linejoin="round"`;
  return `<polygon points="${x + w},${y} ${x + w + d},${y - e} ${x + w + d},${y + h - e} ${x + w},${y + h}" fill="${side}" ${st}/>`
    + `<polygon points="${x},${y} ${x + d},${y - e} ${x + w + d},${y - e} ${x + w},${y}" fill="${top}" ${st}/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${front}" ${st}/>`;
}
// a square tree: trunk and three leaf cubes
function p6Tree(x, y, s) {
  return `<g transform="translate(${x},${y}) scale(${s})">`
    + `<ellipse cx="14" cy="2" rx="46" ry="9" fill="#000" opacity="0.22"/>`
    + p6Cube(-9, -70, 20, 70, 8, '#8a5a34', '#a5703f', '#6e4526')
    + p6Cube(-46, -120, 64, 52, 22, '#58a83a', '#7fd055', '#3f8a2c')
    + p6Cube(4, -150, 50, 44, 18, '#63b843', '#8ade62', '#479632')
    + p6Cube(-24, -182, 44, 40, 16, '#6cc24a', '#98e86e', '#4fa238')
    + `<rect x="-38" y="-112" width="12" height="12" fill="#8ade62" opacity="0.7"/><rect x="12" y="-142" width="10" height="10" fill="#a6f07c" opacity="0.7"/></g>`;
}
// Ilona the duck, after the game's low-poly model: a round yellow faceted body, orange beak and feet,
// long lashes, and tousled golden-brown hair down to the shoulders with a side-swept fringe.
// o: mood 'happy' | 'shock' | 'brave', look (pupil shift), rot, knife / cup (held in the raised wing), noShadow
function p6Duck(pre, x, y, s, o) {
  o = o || {};
  const mood = o.mood || 'happy', lk = o.look || 0, ink = `stroke="${P6_INK}" stroke-linejoin="round" stroke-linecap="round"`;
  const poly = (pts, fill, sw, extra) => `<polygon points="${pts}" fill="${fill}" ${sw ? ink + ` stroke-width="${sw}"` : ''} ${extra || ''}/>`;
  const facet = (pts, col, op) => `<polygon points="${pts}" fill="${col}" opacity="${op}"/>`;
  const eye = (cx, sd) => {
    if (mood === 'shock') return `<ellipse cx="${cx}" cy="-128" rx="11" ry="13" fill="#fff" ${ink} stroke-width="3"/><circle cx="${cx + lk}" cy="-127" r="4" fill="#3a2414"/>`
      + `<path d="M${cx - 10 * sd},-138 l${-5 * sd},-5 M${cx - 4 * sd},-141 l${-3 * sd},-6 M${cx + 3 * sd},-141 l0,-6" fill="none" ${ink} stroke-width="2.5"/>`;
    return `<ellipse cx="${cx}" cy="-126" rx="10" ry="10.5" fill="#fff"/><ellipse cx="${cx + lk}" cy="-125" rx="6.6" ry="7.6" fill="#4a2e1a"/><circle cx="${cx + lk}" cy="-124" r="3.6" fill="#1b1210"/><circle cx="${cx + lk + 2.4}" cy="-128" r="2" fill="#fff"/>`
      + `<path d="M${cx - 11},-126 Q${cx},-142 ${cx + 11},-126" fill="#f2b23a" opacity="0.55"/>`
      + `<path d="M${cx - 11},-128 Q${cx},-140 ${cx + 11},-128" fill="none" ${ink} stroke-width="3.4"/>`
      // lashes at the outer corner
      + `<path d="M${cx + 10 * sd},-130 l${7 * sd},-5 M${cx + 8 * sd},-133 l${5 * sd},-7 M${cx + 4 * sd},-136 l${2 * sd},-7" fill="none" ${ink} stroke-width="2.4"/>`;
  };
  const brows = mood === 'brave' ? `<path d="M-30,-150 L-10,-142 M30,-150 L10,-142" fill="none" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/>`
    : mood === 'shock' ? `<path d="M-28,-152 Q-18,-158 -8,-153 M8,-153 Q18,-158 28,-152" fill="none" stroke="#8a5a2b" stroke-width="4" stroke-linecap="round"/>`
    : `<path d="M-28,-146 Q-18,-152 -8,-147 M8,-147 Q18,-152 28,-146" fill="none" stroke="#8a5a2b" stroke-width="4" stroke-linecap="round"/>`;
  const beak = mood === 'shock'
    ? poly('-16,-110 0,-118 16,-110 8,-102 -8,-102', `url(#${pre}beak)`, 3) + poly('-10,-100 10,-100 6,-84 -6,-84', '#7a1f2b', 3) + poly('-8,-88 8,-88 4,-80 -4,-80', '#f07a12', 3)
    : poly('-20,-108 -8,-116 0,-119 8,-116 20,-108 10,-101 -10,-101', `url(#${pre}beak)`, 3) + facet('-8,-116 0,-119 8,-116 0,-108', '#ffd08a', 0.7)
      + poly('-13,-101 13,-101 6,-93 -6,-93', '#e8690f', 3) + `<path d="M-20,-108 Q-24,-110 -25,-114 M20,-108 Q24,-110 25,-114" fill="none" ${ink} stroke-width="2.5"/>`;
  // what she holds in the raised right wing
  const held = o.knife ? `<g transform="translate(64,-92) rotate(18)">` + poly('-5,2 5,2 6,-18 -6,-18', '#9b59b6', 3) + facet('-5,2 0,2 0,-18 -6,-18', '#c084d8', 0.8)
      + poly('-8,-18 8,-18 9,-52 0,-70 -9,-52', '#e6e9ee', 3) + facet('0,-18 8,-18 9,-52 0,-70', '#b9c0cb', 0.9) + `</g>`
    : o.cup ? `<g transform="translate(62,-84) rotate(8)">` + poly('-11,-26 11,-26 8,4 -8,4', '#fffaf0', 3) + poly('-10,-14 10,-14 9,-4 -9,-4', '#c98a5a', 0) + poly('-13,-32 13,-32 12,-26 -12,-26', '#f1ede4', 3) + `</g>` : '';
  const wingR = o.knife || o.cup || o.wingUp
    ? poly('40,-78 58,-98 72,-92 70,-74 52,-58', `url(#${pre}duck)`, 3) + facet('58,-98 72,-92 70,-74', '#fff3a0', 0.45)
    : poly('44,-76 62,-62 66,-40 56,-24 46,-34', `url(#${pre}duck)`, 3) + facet('62,-62 66,-40 56,-24', '#e8a81c', 0.35);
  return `<g transform="translate(${x},${y}) rotate(${o.rot || 0}) scale(${s})">`
    + (o.noShadow ? '' : `<ellipse cx="0" cy="2" rx="58" ry="9" fill="#000" opacity="0.28"/>`)
    // hair behind the head: layered locks down to the shoulders
    + poly('-6,-186 -34,-178 -54,-156 -60,-128 -66,-104 -56,-98 -58,-84 -44,-92 -40,-80 -30,-96 30,-96 38,-80 44,-92 56,-82 56,-98 66,-102 60,-130 52,-158 30,-180', `url(#${pre}hair2)`, 3)
    + facet('-54,-156 -60,-128 -66,-104 -46,-120', '#b98a3e', 0.6) + facet('52,-158 60,-130 66,-102 46,-120', '#b98a3e', 0.6)
    // feet
    + poly('-40,0 -44,-10 -30,-22 -12,-16 -8,0', '#ff7f1f', 3) + facet('-30,-22 -12,-16 -22,-8', '#ffab5c', 0.8)
    + poly('8,0 12,-16 30,-22 44,-10 40,0', '#ff7f1f', 3) + facet('12,-16 30,-22 22,-8', '#ffab5c', 0.8)
    // body: a faceted egg
    + poly('0,-6 -30,-10 -48,-30 -54,-54 -46,-78 -26,-94 26,-94 46,-78 54,-54 48,-30 30,-10', `url(#${pre}duck)`, 3)
    + facet('-26,-94 26,-94 0,-70', '#fff6a8', 0.5) + facet('-46,-78 -26,-94 0,-70 -28,-52', '#fff3a0', 0.3) + facet('46,-78 54,-54 48,-30 22,-46', '#e39a12', 0.28)
    + facet('-54,-54 -48,-30 -30,-10 -24,-36', '#e8a81c', 0.22) + facet('0,-6 30,-10 48,-30 14,-30', '#d98f0e', 0.3) + facet('-28,-52 0,-70 22,-46 -4,-28', '#fff3a0', 0.16)
    // wings
    + poly('-44,-76 -62,-62 -66,-40 -56,-24 -46,-34', `url(#${pre}duck)`, 3) + facet('-62,-62 -66,-40 -56,-24', '#fff3a0', 0.35)
    + wingR + held
    // head
    + poly('0,-172 -24,-168 -40,-152 -46,-130 -40,-108 -24,-94 0,-90 24,-94 40,-108 46,-130 40,-152 24,-168', `url(#${pre}duck)`, 3)
    + facet('-40,-152 -46,-130 -40,-108 -26,-128', '#fff3a0', 0.3) + facet('40,-152 46,-130 40,-108 28,-128', '#e39a12', 0.25) + facet('-24,-94 0,-90 24,-94 0,-100', '#e39a12', 0.25)
    + `<ellipse cx="-30" cy="-112" rx="8" ry="5" fill="#ff9f6a" opacity="0.55"/><ellipse cx="30" cy="-112" rx="8" ry="5" fill="#ff9f6a" opacity="0.55"/>`
    + eye(-18, -1) + eye(18, 1) + brows + beak
    // the fringe: tousled, swept to one side, a few locks sticking out
    + poly('-8,-190 -30,-184 -48,-166 -56,-142 -50,-122 -42,-138 -34,-150 -18,-160 2,-164 20,-160 34,-150 42,-136 50,-122 56,-144 48,-168 30,-184 14,-192 6,-182', `url(#${pre}hair)`, 3)
    + facet('-30,-184 -48,-166 -34,-150 -18,-160 -12,-176', '#f6dc98', 0.75) + facet('-8,-190 14,-192 6,-182 2,-164 -12,-176', '#fbe7b0', 0.7) + facet('30,-184 48,-168 34,-150 20,-160', '#d9ad55', 0.7) + facet('-56,-142 -50,-122 -42,-138', '#c99a4a', 0.8) + facet('56,-144 50,-122 42,-136', '#c99a4a', 0.8)
    + poly('10,-190 22,-204 20,-188', `url(#${pre}hair)`, 2.5) + poly('-16,-188 -28,-200 -22,-184', `url(#${pre}hair)`, 2.5) + poly('40,-176 56,-182 48,-168', `url(#${pre}hair2)`, 2.5)
    + `</g>`;
}
function p6Defs(pre, extra) {
  return `<defs>
    <linearGradient id="${pre}duck" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff07a"/><stop offset="0.5" stop-color="#ffd92e"/><stop offset="1" stop-color="#f0b21a"/></linearGradient>
    <linearGradient id="${pre}beak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb04a"/><stop offset="1" stop-color="#f07a12"/></linearGradient>
    <linearGradient id="${pre}hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d58a"/><stop offset="1" stop-color="#dcae58"/></linearGradient>
    <linearGradient id="${pre}hair2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9ad55"/><stop offset="1" stop-color="#b98a3e"/></linearGradient>
    <pattern id="${pre}dirt" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#9a6a42"/><rect x="5" y="14" width="6" height="5" fill="#845736"/><rect x="24" y="22" width="7" height="5" fill="#b07c52"/><rect x="14" y="30" width="5" height="4" fill="#7b5031"/><rect x="30" y="8" width="5" height="4" fill="#845736"/><path d="M0,0H40V40" fill="none" stroke="#5f3f25" stroke-width="2"/></pattern>
    <pattern id="${pre}grass" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#6cc24a"/><rect x="6" y="8" width="6" height="4" fill="#84dc5e"/><rect x="24" y="24" width="7" height="4" fill="#58ad3b"/><rect x="14" y="30" width="5" height="4" fill="#84dc5e"/><rect x="30" y="6" width="5" height="4" fill="#58ad3b"/><path d="M0,0H40V40" fill="none" stroke="#3f8a2c" stroke-width="2"/></pattern>
    <filter id="${pre}sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000" flood-opacity="0.35"/></filter>
    <filter id="${pre}glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
    ${extra || ''}
  </defs>
  <style>
    .p6-pulse{animation:p6pulse 2.2s ease-in-out infinite}.p6-bob{animation:p6bob 1.6s ease-in-out infinite}.p6-spin{animation:p6spin 5s linear infinite;transform-box:fill-box;transform-origin:center}
    .p6-spin2{animation:p6spin 2.4s linear infinite reverse;transform-box:fill-box;transform-origin:center}.p6-tw{animation:p6tw 1.3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
    .p6-sneak{animation:p6sneak 2.6s ease-in-out infinite}.p6-steam{animation:p6steam 3s ease-out infinite}.p6-stomp{animation:p6stomp 1.1s ease-in-out infinite}.p6-fly{animation:p6fly 1.8s ease-in-out infinite}
    .p6-blink{animation:p6blink 1s steps(1) infinite}
    @keyframes p6pulse{0%,100%{opacity:.55}50%{opacity:1}}@keyframes p6bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes p6spin{to{transform:rotate(360deg)}}@keyframes p6tw{0%,100%{transform:scale(.6);opacity:.4}50%{transform:scale(1.25);opacity:1}}
    @keyframes p6sneak{0%,100%{transform:translateX(0)}50%{transform:translateX(-14px)}}@keyframes p6steam{0%{transform:translateY(0);opacity:.6}100%{transform:translateY(-26px);opacity:0}}
    @keyframes p6stomp{0%,100%{transform:translateY(0)}45%{transform:translateY(-7px)}60%{transform:translateY(2px)}}@keyframes p6fly{0%,100%{transform:translate(0,0)}50%{transform:translate(8px,-10px)}}
    @keyframes p6blink{0%{opacity:1}50%{opacity:0}}
  </style>`;
}
// the scene is drawn in a 720 x 420 box and shown at 80 %, centred and pushed up, so the text bubble at the bottom
// never covers it; backgrounds are drawn wider than the box to fill the margins
const p6Svg = (defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 420" preserveAspectRatio="xMidYMid slice" font-family="Nunito, 'Segoe UI', Arial, sans-serif">${defs}<g transform="translate(72,2) scale(0.8)">${body}</g></svg>`;
const P6_BG = 'x="-200" y="-100" width="1120" height="720"';
const p6Star = (x, y, r, col, cls) => `<path class="${cls || 'p6-tw'}" d="M${x},${y - r} L${x + r * 0.28},${y - r * 0.28} L${x + r},${y} L${x + r * 0.28},${y + r * 0.28} L${x},${y + r} L${x - r * 0.28},${y + r * 0.28} L${x - r},${y} L${x - r * 0.28},${y - r * 0.28} Z" fill="${col}"/>`;

/* ---------- slide 1: night, the desk, empty mugs, coursework drafts, the green cube world in the monitor */
function p6Slide1() {
  const pre = 'a_';
  const mug = (x, y, col, rot) => `<g transform="translate(${x},${y}) rotate(${rot || 0})"><rect x="-13" y="-30" width="26" height="30" rx="4" fill="${col}" ${p6S}/><path d="M13,-24 q13,2 12,10 q-1,8 -12,8" fill="none" ${p6S}/><ellipse cx="0" cy="-29" rx="10" ry="3" fill="#3b2416"/><path d="M-9,-18 q4,5 0,12" fill="none" stroke="#b08a66" stroke-width="2"/></g>`;
  const paper = (x, y, rot, title) => `<g transform="translate(${x},${y}) rotate(${rot})"><rect x="-44" y="-30" width="88" height="60" rx="2" fill="#fbf6ea" ${p6S} stroke-width="2.5"/><text x="-36" y="-14" font-size="10" font-weight="900" fill="#c92a2a">${title}</text>${[0, 1, 2, 3].map((i) => `<path d="M-36,${-4 + i * 8} h${[64, 70, 52, 30][i]}" stroke="#aab1bd" stroke-width="2"/>`).join('')}<path d="M-20,2 l40,18 M22,0 l-44,22" stroke="#e03131" stroke-width="2.5" opacity="0.8"/></g>`;
  // the cube world on the screen
  let world = `<rect x="352" y="96" width="268" height="168" fill="url(#${pre}scr)"/>`;
  world += `<rect x="540" y="110" width="26" height="26" fill="#fff7a8"/><rect x="376" y="118" width="54" height="14" fill="#fff" opacity="0.9"/><rect x="392" y="108" width="28" height="12" fill="#fff" opacity="0.9"/>`;
  for (let i = 0; i < 7; i++) { const h = [2, 3, 3, 2, 1, 2, 3][i]; for (let k = 0; k < h; k++) world += `<rect x="${352 + i * 38.3}" y="${264 - (k + 1) * 30}" width="38.3" height="30" fill="${k === h - 1 ? '#3ee05a' : '#8a5f3a'}" stroke="#1f6b2c" stroke-width="1.5"/>`; if (h) world += `<rect x="${352 + i * 38.3}" y="${264 - h * 30}" width="38.3" height="8" fill="#8dff8a"/>`; }
  world += `<rect x="452" y="150" width="10" height="26" fill="#8a5a34"/><rect x="436" y="124" width="42" height="30" fill="#25c24a" stroke="#1f6b2c" stroke-width="1.5"/>`;
  world += `<rect x="566" y="146" width="34" height="30" fill="#9a6a42" stroke="#5f3f25" stroke-width="1.5"/><rect x="578" y="158" width="10" height="18" fill="#5f3f25"/>`;
  world += `<rect class="p6-blink" x="364" y="244" width="8" height="12" fill="#fff"/><text x="376" y="255" font-size="11" font-weight="900" fill="#fff">КУБАЧ.exe (пиратка)</text>`;
  const defs = p6Defs(pre, `
    <linearGradient id="${pre}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15133a"/><stop offset="1" stop-color="#2d2558"/></linearGradient>
    <linearGradient id="${pre}desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a86b3a"/><stop offset="1" stop-color="#5d371c"/></linearGradient>
    <linearGradient id="${pre}scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7df0ff"/><stop offset="1" stop-color="#c8ffd0"/></linearGradient>
    <radialGradient id="${pre}lamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#6dff7a" stop-opacity="0.75"/><stop offset="1" stop-color="#6dff7a" stop-opacity="0"/></radialGradient>
    <clipPath id="${pre}clip"><rect x="352" y="96" width="268" height="168" rx="6"/></clipPath>`);
  const body = `<rect ${P6_BG} fill="url(#${pre}wall)"/>`
    // window: moon and stars
    + `<g filter="url(#${pre}sh)"><rect x="34" y="34" width="150" height="150" rx="6" fill="#0c1136" ${p6S} stroke-width="5"/><circle cx="140" cy="80" r="24" fill="#fff3b0"/><circle cx="131" cy="73" r="20" fill="#0c1136"/>`
    + p6Star(70, 70, 6, '#fff') + p6Star(96, 126, 5, '#fff') + p6Star(150, 150, 4, '#cfd8ff') + p6Star(60, 150, 4, '#cfd8ff')
    + `<path d="M109,34 V184 M34,109 H184" ${p6S} stroke-width="4"/></g>`
    // wall clock and a sticky note
    + `<g transform="translate(252,62)"><rect x="-40" y="-20" width="80" height="40" rx="6" fill="#201a36" ${p6S}/><text class="p6-pulse" x="0" y="8" font-size="22" font-weight="900" text-anchor="middle" fill="#ff5d5d">03:17</text></g>`
    + `<g transform="translate(662,70) rotate(6)"><rect x="-38" y="-30" width="76" height="60" fill="#ffe066" ${p6S} stroke-width="2.5"/><text x="0" y="-8" font-size="10" font-weight="900" text-anchor="middle" fill="#16121f">КУРСАЧ:</text><text x="0" y="6" font-size="10" font-weight="900" text-anchor="middle" fill="#c92a2a">СДАТЬ</text><text x="0" y="20" font-size="10" font-weight="900" text-anchor="middle" fill="#c92a2a">ЗАВТРА!</text></g>`
    // the green light of the screen fills the room
    + `<ellipse class="p6-pulse" cx="486" cy="190" rx="330" ry="230" fill="url(#${pre}lamp)"/>`
    // desk
    + `<rect x="-200" y="300" width="1120" height="330" fill="url(#${pre}desk)" ${p6S}/><rect x="-200" y="300" width="1120" height="12" fill="#c98a50" opacity="0.8"/>`
    // monitor
    + `<g filter="url(#${pre}sh)"><rect x="462" y="276" width="48" height="26" fill="#2a2d3a" ${p6S}/><rect x="420" y="296" width="132" height="12" rx="4" fill="#2a2d3a" ${p6S}/>`
    + `<rect x="338" y="82" width="296" height="198" rx="12" fill="#2f3342" ${p6S} stroke-width="4"/><g clip-path="url(#${pre}clip)">${world}<rect x="352" y="96" width="268" height="40" fill="#fff" opacity="0.12"/></g><rect x="352" y="96" width="268" height="168" rx="6" fill="none" ${p6S}/><circle cx="486" cy="272" r="3" fill="#6dff7a"/></g>`
    // keyboard and mouse
    + `<g transform="translate(440,334)"><rect x="-74" y="-12" width="148" height="30" rx="5" fill="#3a3f52" ${p6S}/>${[0, 1, 2].map((r) => [...Array(11)].map((_, k) => `<rect x="${-68 + k * 12.4}" y="${-8 + r * 8}" width="9" height="5" rx="1" fill="${(k * 3 + r) % 7 === 0 ? '#6dff7a' : '#8b93ad'}"/>`).join('')).join('')}</g>`
    + `<g transform="translate(560,340)"><rect x="-13" y="-10" width="26" height="34" rx="12" fill="#e8ecf5" ${p6S}/><path d="M0,-10 V4" ${p6S} stroke-width="2"/></g>`
    // empty mugs, stains, drafts, crumpled paper
    + `<ellipse cx="78" cy="352" rx="22" ry="6" fill="none" stroke="#4a2c16" stroke-width="3" opacity="0.6"/>`
    + paper(120, 372, -12, 'КУРСОВАЯ') + paper(214, 384, 9, 'АРХИТЕКТУРА') + paper(640, 386, -7, 'ГЛАВА 1 ???')
    + mug(52, 338, '#fffaf0') + mug(96, 330, '#ffd6ea') + mug(148, 344, '#bfe9ff', 84) + mug(668, 344, '#fffaf0')
    + `<path class="p6-steam" d="M96,292 q-8,-10 0,-18 q8,-8 0,-18" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`
    + `<g fill="#f1ead8" ${p6S} stroke-width="2.5"><path d="M286,372 l12,-10 l14,4 l6,14 l-12,10 l-16,-4 z"/><path d="M604,398 l10,-8 l12,4 l4,10 l-12,6 l-12,-2 z"/></g>`
    // chair and Ilona, lit green from the screen
    + `<rect x="196" y="196" width="86" height="130" rx="14" fill="#3b3560" ${p6S}/><rect x="206" y="206" width="66" height="90" rx="10" fill="#4a4378"/>`
    + `<g class="p6-bob">` + p6Duck(pre, 258, 330, 0.98, { mood: 'happy', noShadow: true, look: 3, cup: true })
    + `</g>`
    + p6Star(330, 110, 7, '#b8ffc0') + p6Star(646, 150, 6, '#b8ffc0') + p6Star(420, 60, 5, '#b8ffc0');
  return p6Svg(defs, body);
}

/* ---------- slide 2: the pixel vortex throws the duck onto a cube meadow: square trees, a square sheep, a sneaking goblin */
function p6Slide2() {
  const pre = 'b_';
  let vortex = '';
  const cols = ['#4fe0e6', '#7cf06a', '#ffd43b', '#ff5fd0', '#fff'];
  for (let i = 0; i < 46; i++) { const a = i * 0.52, r = 12 + i * 4.3, s = 5 + (i % 5) * 2.2; vortex += `<rect x="${(Math.cos(a) * r - s / 2).toFixed(1)}" y="${(Math.sin(a) * r * 0.82 - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${cols[i % 5]}" opacity="${(1 - i / 70).toFixed(2)}"/>`; }
  let ground = '';
  for (let i = 0; i < 17; i++) { const lift = [0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 2, 2, 2, 3, 3, 3, 3][i]; ground += p6Cube(236 + i * 40, 330 - lift * 40, 40, 40 + lift * 40 + 300, 0, `url(#${pre}dirt)`, '#6cc24a', '#7a5233'); ground += `<rect x="${236 + i * 40}" y="${330 - lift * 40}" width="40" height="11" fill="#6cc24a" stroke="${P6_INK}" stroke-width="2"/>`; }
  const sheep = `<g transform="translate(498,330)"><g class="p6-bob"><ellipse cx="6" cy="2" rx="50" ry="8" fill="#000" opacity="0.22"/>`
    + [[-30, -22], [16, -22]].map(([x, y]) => `<rect x="${x}" y="${y}" width="12" height="24" fill="#3c3a44" ${p6S}/>`).join('')
    + p6Cube(-40, -72, 78, 52, 20, '#f4f4f8', '#ffffff', '#cfd2dc')
    + p6Cube(26, -84, 38, 36, 12, '#4a4753', '#5b5866', '#33313b')
    + `<rect x="34" y="-72" width="9" height="9" fill="#fff"/><rect x="50" y="-72" width="9" height="9" fill="#fff"/><rect x="38" y="-70" width="4" height="5" fill="${P6_INK}"/><rect x="54" y="-70" width="4" height="5" fill="${P6_INK}"/><rect x="40" y="-58" width="14" height="5" fill="#ff9db0"/>`
    + `<text x="60" y="-98" font-size="30" font-weight="900" fill="#fff" stroke="${P6_INK}" stroke-width="5" paint-order="stroke">?</text></g></g>`;
  const goblin = `<g class="p6-sneak"><g transform="translate(676,292)">`
    + p6Cube(-24, -50, 44, 50, 10, '#69b83a', '#8fe05a', '#4c8f2a')
    + `<rect x="-22" y="-10" width="40" height="12" fill="#8a5a34" ${p6S} stroke-width="2"/>`
    + `<polygon points="-30,-86 -58,-100 -30,-66" fill="#69b83a" ${p6S}/><polygon points="26,-86 54,-100 26,-66" fill="#69b83a" ${p6S}/>`
    + p6Cube(-30, -98, 56, 48, 12, '#7cc242', '#a2ea6a', '#58a033')
    + `<rect x="-22" y="-84" width="16" height="11" fill="#ffe14d" ${p6S} stroke-width="2"/><rect x="2" y="-84" width="16" height="11" fill="#ffe14d" ${p6S} stroke-width="2"/><rect x="-14" y="-82" width="5" height="7" fill="${P6_INK}"/><rect x="5" y="-82" width="5" height="7" fill="${P6_INK}"/>`
    + `<path d="M-26,-92 L-6,-86 M22,-92 L4,-86" ${p6S} stroke-width="4"/><path d="M-18,-64 h34 v6 h-34 z" fill="#2a1a22" ${p6S} stroke-width="2"/><path d="M-12,-64 v4 M-4,-64 v4 M4,-64 v4 M12,-64 v4" stroke="#fff" stroke-width="3"/>`
    + `<rect x="-6" y="-112" width="12" height="12" fill="#ff5fd0" ${p6S} stroke-width="2"/>`
    + `</g><text class="p6-blink" x="700" y="186" font-size="26" font-weight="900" fill="#ff3b30" stroke="${P6_INK}" stroke-width="5" paint-order="stroke" text-anchor="middle">!</text></g>`;
  const defs = p6Defs(pre, `
    <linearGradient id="${pre}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f8cf0"/><stop offset="1" stop-color="#bfeaff"/></linearGradient>
    <linearGradient id="${pre}room" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#15133a"/><stop offset="0.75" stop-color="#2d2558"/><stop offset="1" stop-color="#2d2558" stop-opacity="0"/></linearGradient>
    <radialGradient id="${pre}hole" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff"/><stop offset="0.35" stop-color="#8dfff0"/><stop offset="0.7" stop-color="#7a4cff" stop-opacity="0.8"/><stop offset="1" stop-color="#7a4cff" stop-opacity="0"/></radialGradient>`);
  const body = `<rect ${P6_BG} fill="url(#${pre}sky)"/>`
    + `<g fill="#fff" opacity="0.95"><rect x="420" y="48" width="120" height="26"/><rect x="446" y="30" width="60" height="20"/><rect x="600" y="92" width="90" height="22"/><rect x="620" y="78" width="40" height="16"/></g>`
    + `<rect x="604" y="30" width="46" height="46" fill="#fff3a0" ${p6S}/>`
    // far cube hills
    + p6Cube(380, 226, 110, 110, 30, '#58a83a', '#7fd055', '#3f8a2c') + p6Cube(520, 196, 120, 140, 30, '#4f9e36', '#74c64e', '#3a8029')
    + p6Tree(430, 332, 0.78) + p6Tree(612, 252, 0.9)
    + ground + sheep + goblin + p6Tree(332, 332, 1.08)
    // the dark room on the left with the monitor the vortex comes from
    + `<rect x="-200" y="-100" width="500" height="720" fill="url(#${pre}room)"/>`
    + `<g filter="url(#${pre}sh)"><rect x="-70" y="110" width="180" height="170" rx="10" fill="#2f3342" ${p6S} stroke-width="4"/><rect x="-56" y="124" width="152" height="142" rx="5" fill="#7dffa0" ${p6S}/><rect x="0" y="280" width="40" height="46" fill="#2a2d3a" ${p6S}/><rect x="-40" y="322" width="120" height="12" rx="4" fill="#2a2d3a" ${p6S}/><rect x="-200" y="334" width="330" height="300" fill="#5d371c" ${p6S}/></g>`
    + `<ellipse class="p6-pulse" cx="150" cy="200" rx="210" ry="170" fill="url(#${pre}hole)"/>`
    + `<g transform="translate(150,200)"><g class="p6-spin">${vortex}</g></g>`
    + `<g transform="translate(150,200)"><g class="p6-spin2"><path d="M0,-70 A70,70 0 0 1 70,0 M0,70 A70,70 0 0 1 -70,0" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.8"/><path d="M-120,0 A120,100 0 0 1 0,-100 M120,0 A120,100 0 0 1 0,100" fill="none" stroke="#ff5fd0" stroke-width="5" stroke-linecap="round" opacity="0.7"/></g></g>`
    // motion lines and the duck thrown out of the vortex
    + `<g stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.85"><path d="M196,150 L262,128"/><path d="M204,196 L258,176"/><path d="M208,238 L250,228"/></g>`
    + `<g class="p6-fly"><g filter="url(#${pre}sh)">` + p6Duck(pre, 318, 250, 0.95, { mood: 'shock', rot: -22, noShadow: true, wingUp: true }) + `</g>`
    + `<text x="386" y="104" font-size="34" font-weight="900" fill="#ffe14d" stroke="${P6_INK}" stroke-width="7" paint-order="stroke" transform="rotate(-10 386 104)">КРЯ-А-А?!</text></g>`
    + [[250, 96, 9, '#4fe0e6'], [226, 276, 8, '#ffd43b'], [300, 300, 7, '#ff5fd0'], [372, 150, 8, '#7cf06a'], [400, 250, 6, '#fff'], [280, 60, 6, '#fff']].map(([x, y, s, c]) => `<rect class="p6-tw" x="${x}" y="${y}" width="${s}" height="${s}" fill="${c}" stroke="${P6_INK}" stroke-width="1.5"/>`).join('');
  return p6Svg(defs, body);
}

/* ---------- slide 3: the huge yellow square troll in blue shorts with a giant pickaxe, a skeleton and a minecart of diamonds */
function p6Slide3() {
  const pre = 'c_';
  let ground = '';
  for (let i = -5; i < 24; i++) ground += `<rect x="${-20 + i * 40}" y="342" width="40" height="300" fill="url(#${pre}dirt)" stroke="${P6_INK}" stroke-width="2"/><rect x="${-20 + i * 40}" y="342" width="40" height="13" fill="${i % 2 ? '#66bd45' : '#70c94c'}" stroke="${P6_INK}" stroke-width="2"/>`;
  const boss = `<g class="p6-stomp"><g transform="translate(470,344) scale(0.86) translate(-470,-344)"><ellipse cx="470" cy="346" rx="150" ry="16" fill="#000" opacity="0.3"/>`
    // legs
    + p6Cube(398, 286, 50, 58, 16, '#d9a03c', '#f0be5a', '#b07c26') + p6Cube(478, 286, 50, 58, 16, '#d9a03c', '#f0be5a', '#b07c26')
    // blue shorts
    + p6Cube(386, 230, 156, 64, 22, `url(#${pre}shorts)`, '#5b8fe8', '#234a9a')
    + `<path d="M464,246 v48" ${p6S}/><rect x="386" y="230" width="156" height="12" fill="#ffd43b" ${p6S} stroke-width="2"/>`
    // torso
    + p6Cube(380, 120, 168, 114, 26, `url(#${pre}troll)`, '#ffd873', '#b9832a')
    + `<rect x="402" y="146" width="48" height="34" fill="#f6c95a" opacity="0.6"/><rect x="474" y="146" width="48" height="34" fill="#f6c95a" opacity="0.6"/><path d="M462,140 v84" stroke="#b9832a" stroke-width="3" opacity="0.6"/>`
    // left arm down with fist
    + p6Cube(330, 128, 46, 120, 14, '#e2a842', '#f6c95a', '#b07c26') + p6Cube(324, 244, 56, 44, 16, '#eab34a', '#ffd873', '#b9832a')
    // head
    + p6Cube(408, 40, 112, 86, 22, `url(#${pre}troll)`, '#ffe08a', '#b9832a')
    + `<path d="M418,66 L458,80 M510,66 L470,80" ${p6S} stroke-width="7"/>`
    + `<rect x="424" y="78" width="30" height="16" fill="#ffe14d" ${p6S}/><rect x="474" y="78" width="30" height="16" fill="#ffe14d" ${p6S}/><rect x="438" y="80" width="9" height="12" fill="#c4141f"/><rect x="480" y="80" width="9" height="12" fill="#c4141f"/>`
    + p6Cube(452, 84, 24, 30, 8, '#ff8fb0', '#ffb3c8', '#d9658a')
    + `<path d="M430,112 h68 v8 h-68 z" fill="#3a1820" ${p6S} stroke-width="2.5"/><path d="M438,112 v6 M452,112 v6 M476,112 v6 M490,112 v6" stroke="#fff" stroke-width="5"/>`
    // right arm raised, holding the giant pickaxe over the shoulder
    + `<g transform="rotate(-18 574 150)">` + p6Cube(552, 70, 46, 110, 14, '#e2a842', '#f6c95a', '#b07c26') + `</g>`
    + `<g transform="rotate(28 600 120)"><rect x="592" y="-34" width="16" height="230" rx="4" fill="#9a6a3a" ${p6S}/><rect x="596" y="-28" width="5" height="218" fill="#c08a52" opacity="0.7"/>`
    + `<path d="M516,-6 Q600,-70 684,-6 L674,14 Q600,-34 526,14 Z" fill="url(#${pre}steel)" ${p6S} stroke-width="4"/><path d="M534,-4 Q600,-52 666,-4" fill="none" stroke="#fff" stroke-width="4" opacity="0.6"/><rect x="586" y="-44" width="28" height="30" fill="#7a8696" ${p6S}/></g>`
    + p6Cube(560, 44, 56, 46, 16, '#eab34a', '#ffd873', '#b9832a')
    + `</g></g>`;
  const skel = `<g transform="translate(662,344)"><g class="p6-bob"><ellipse cx="0" cy="2" rx="34" ry="6" fill="#000" opacity="0.25"/>`
    + `<rect x="-16" y="-46" width="9" height="46" fill="#efe2b4" ${p6S}/><rect x="6" y="-46" width="9" height="46" fill="#efe2b4" ${p6S}/>`
    + `<rect x="-20" y="-92" width="40" height="48" fill="#f6ecc6" ${p6S}/>${[0, 1, 2].map((i) => `<path d="M-14,${-82 + i * 12} h28" stroke="${P6_INK}" stroke-width="3"/>`).join('')}`
    + `<rect x="-34" y="-90" width="10" height="44" fill="#efe2b4" ${p6S}/><rect x="24" y="-112" width="10" height="44" fill="#efe2b4" ${p6S} transform="rotate(-24 29 -70)"/>`
    + p6Cube(-24, -138, 46, 42, 10, '#fbf3d2', '#fffbe6', '#d6c794')
    + `<rect x="-16" y="-126" width="12" height="12" fill="${P6_INK}"/><rect x="4" y="-126" width="12" height="12" fill="${P6_INK}"/><rect x="-12" y="-122" width="4" height="4" fill="#ff3b30"/><rect x="8" y="-122" width="4" height="4" fill="#ff3b30"/><path d="M-12,-106 h24" stroke="${P6_INK}" stroke-width="3" stroke-dasharray="4 3"/>`
    + `<rect x="40" y="-150" width="12" height="12" fill="#fff" ${p6S} stroke-width="2" transform="rotate(20 46 -144)"/></g></g>`;
  const gem = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><polygon points="0,-18 16,-4 0,18 -16,-4" fill="url(#${pre}gem)" ${p6S} stroke-width="2.5"/><polygon points="0,-18 16,-4 0,-2 -16,-4" fill="#d8fbff" opacity="0.8"/><path d="M0,-2 V18" stroke="#fff" stroke-width="1.5" opacity="0.6"/></g>`;
  const cart = `<g transform="translate(206,344)"><path d="M-150,6 H130" stroke="#5a4632" stroke-width="10"/><path d="M-150,0 H130" stroke="#c9ced6" stroke-width="5"/>${[...Array(8)].map((_, i) => `<rect x="${-144 + i * 36}" y="2" width="12" height="10" fill="#8a5a34" stroke="${P6_INK}" stroke-width="2"/>`).join('')}`
    + `<g class="p6-bob">` + gem(-34, -62, 1) + gem(-4, -72, 1.25) + gem(28, -60, 1.05) + gem(-18, -50, 0.9) + gem(14, -48, 0.95)
    + p6Cube(-62, -52, 112, 44, 18, `url(#${pre}cart)`, '#6c7384', '#4a5060')
    + `<rect x="-62" y="-52" width="112" height="9" fill="#aab1c2" ${p6S} stroke-width="2"/><circle cx="-36" cy="-4" r="13" fill="#3a3f4e" ${p6S}/><circle cx="26" cy="-4" r="13" fill="#3a3f4e" ${p6S}/><circle cx="-36" cy="-4" r="4" fill="#c9ced6"/><circle cx="26" cy="-4" r="4" fill="#c9ced6"/>`
    + p6Star(-8, -98, 9, '#fff') + p6Star(42, -82, 7, '#d8fbff') + p6Star(-48, -80, 6, '#d8fbff') + `</g></g>`;
  const defs = p6Defs(pre, `
    <linearGradient id="${pre}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a78"/><stop offset="0.55" stop-color="#e2607a"/><stop offset="1" stop-color="#ffc56b"/></linearGradient>
    <linearGradient id="${pre}troll" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd363"/><stop offset="1" stop-color="#e0a033"/></linearGradient>
    <linearGradient id="${pre}shorts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f86ea"/><stop offset="1" stop-color="#2a55b8"/></linearGradient>
    <linearGradient id="${pre}steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f5fa"/><stop offset="1" stop-color="#8f9bb0"/></linearGradient>
    <linearGradient id="${pre}gem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ff6ff"/><stop offset="0.5" stop-color="#3fc8f0"/><stop offset="1" stop-color="#1d7fd6"/></linearGradient>
    <linearGradient id="${pre}cart" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f96a8"/><stop offset="1" stop-color="#5a6072"/></linearGradient>
    <radialGradient id="${pre}rage" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff2a8" stop-opacity="0.9"/><stop offset="1" stop-color="#ff7a3a" stop-opacity="0"/></radialGradient>`);
  const body = `<rect ${P6_BG} fill="url(#${pre}sky)"/>`
    + `<ellipse class="p6-pulse" cx="470" cy="170" rx="330" ry="230" fill="url(#${pre}rage)"/>`
    // rays of rage behind the boss
    + `<g class="p6-pulse" stroke="#fff3c0" stroke-width="7" stroke-linecap="round" opacity="0.5">${[...Array(12)].map((_, i) => { const a = -Math.PI + (i / 11) * Math.PI, c = Math.cos(a), s = Math.sin(a); return `<path d="M${(470 + c * 190).toFixed(0)},${(180 + s * 170).toFixed(0)} L${(470 + c * 300).toFixed(0)},${(180 + s * 270).toFixed(0)}"/>`; }).join('')}</g>`
    + `<g fill="#ffe9d6" opacity="0.85"><rect x="40" y="52" width="110" height="22"/><rect x="64" y="36" width="56" height="18"/><rect x="230" y="92" width="70" height="16"/></g>`
    // far hills and dirt boxes Ilona has built
    + p6Cube(-200, 250, 320, 100, 30, '#4a8f3a', '#69b84a', '#377029') + p6Cube(250, 286, 90, 60, 20, '#4a8f3a', '#69b84a', '#377029')
    + `<g transform="translate(86,250)">` + p6Cube(-36, -58, 62, 58, 18, `url(#${pre}dirt)`, '#b07c52', '#6f4a2c') + `<rect x="-14" y="-30" width="18" height="30" fill="#5f3f25" ${p6S} stroke-width="2"/><rect x="-22" y="-80" width="54" height="18" fill="#fbf6ea" ${p6S} stroke-width="2"/><text x="5" y="-67" font-size="10" font-weight="900" text-anchor="middle" fill="#c92a2a">ДОМ</text></g>`
    + p6Tree(300, 344, 0.62)
    + ground + boss + skel + cart
    // Ilona, small and brave, in the corner
    + `<g class="p6-bob">` + p6Duck(pre, 76, 346, 0.74, { mood: 'brave', look: 2, knife: true }) + `</g>`
    // BAN stamp
    + `<g transform="translate(250,70) rotate(-8)"><rect x="-74" y="-26" width="148" height="52" rx="8" fill="#fff" opacity="0.92" stroke="#e03131" stroke-width="6"/><text x="0" y="11" font-size="30" font-weight="900" text-anchor="middle" fill="#e03131">БАН!</text></g>`;
  return p6Svg(defs, body);
}
function prologue6Slides() {
  return [
    { svg: p6Slide1(), shake: false, text: 'Кря! Напишу курсач по архитектуре завтра. А пока — быстренько построю дом из грязи в пиратском кубаче!' },
    { svg: p6Slide2(), shake: true, text: 'Ой-ой! Кажется, пиратка была с вирусом — меня затянуло в чанки! А почему овца квадратная?!' },
    { svg: p6Slide3(), shake: true, text: 'Админ сервера в ярости из-за моих коробок из земли! Хватай алмазы, прыгай в вагонетку и пробивайся к выходу!' },
  ];
}
