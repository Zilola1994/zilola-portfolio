/* worlds.js — original "two worlds" layers revealed by tilt.
   LEFT  = Japanese-anime idol world (twilight sky, speed lines, sakura, screentone, sparkles, LUMI)
   RIGHT = Western horror-toy world (dim toy-factory shelves, stitched textures, vinyl art toys, NUI plush)
   All artwork is generated SVG; motifs vary per slide via a seeded RNG + slide-specific recipe. */
(function () {
  'use strict';
  const W = 1123, H = 794;
  function rng(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  const f = (n) => Math.round(n * 10) / 10;

  // per-slide recipes (index 1..14). focal = speed-line centre, lumi/nui = where the mascot peeks.
  const RECIPES = {
    1:  { focal: [300, 360], lines: 1, sakura: 26, tone: 1, words: [], sun: [900, 170], lumi: null, shelves: 3, nui: null, vinyl: 4, bulbs: 3, belt: 0 },
    2:  { focal: [140, 200], lines: 0, sakura: 18, tone: 1, words: [], sun: [960, 140], lumi: 'br', shelves: 2, nui: 'bl', vinyl: 3, bulbs: 2, belt: 0 },
    3:  { focal: [560, 120], lines: 1, sakura: 22, tone: 0, words: ['NEW!'], sun: [180, 140], lumi: null, shelves: 3, nui: 'br', vinyl: 5, bulbs: 3, belt: 1 },
    4:  { focal: [800, 400], lines: 1, sakura: 16, tone: 1, words: ['かわいい'], sun: [120, 640], lumi: 'bl', shelves: 2, nui: null, vinyl: 6, bulbs: 2, belt: 0 },
    5:  { focal: [560, 0],   lines: 1, sakura: 30, tone: 0, words: ['ワクワク'], sun: [560, 120], lumi: null, shelves: 3, nui: 'bl', vinyl: 4, bulbs: 4, belt: 1 },
    6:  { focal: [1000, 700], lines: 1, sakura: 20, tone: 1, words: ['キュン'], sun: [140, 120], lumi: 'tr', shelves: 4, nui: null, vinyl: 6, bulbs: 3, belt: 0 },
    7:  { focal: [300, 400], lines: 1, sakura: 24, tone: 0, words: ['ドキドキ'], sun: [980, 640], lumi: null, shelves: 2, nui: 'br', vinyl: 3, bulbs: 4, belt: 0 },
    8:  { focal: [560, 800], lines: 1, sakura: 10, tone: 1, words: [], sun: [1000, 120], lumi: null, shelves: 2, nui: null, vinyl: 3, bulbs: 2, belt: 0 },
    9:  { focal: [0, 400],   lines: 1, sakura: 10, tone: 0, words: [], sun: [1000, 680], lumi: null, shelves: 2, nui: null, vinyl: 3, bulbs: 2, belt: 1 },
    10: { focal: [1100, 0],  lines: 0, sakura: 12, tone: 1, words: [], sun: [160, 660], lumi: null, shelves: 2, nui: null, vinyl: 4, bulbs: 2, belt: 0 },
    11: { focal: [560, 300], lines: 1, sakura: 10, tone: 0, words: [], sun: [560, 80], lumi: null, shelves: 1, nui: null, vinyl: 2, bulbs: 3, belt: 1 },
    12: { focal: [200, 700], lines: 1, sakura: 16, tone: 1, words: ['ピコン'], sun: [980, 160], lumi: 'tl', shelves: 3, nui: 'tr', vinyl: 4, bulbs: 2, belt: 0 },
    13: { focal: [900, 300], lines: 0, sakura: 22, tone: 1, words: [], sun: [200, 180], lumi: null, shelves: 4, nui: 'bl', vinyl: 7, bulbs: 3, belt: 0 },
    14: { focal: [560, 400], lines: 1, sakura: 34, tone: 1, words: [], sun: [560, 420], lumi: null, shelves: 3, nui: null, vinyl: 5, bulbs: 4, belt: 1 }
  };
  const PEEK = { br: [W - 250, H - 300, 1, -12], bl: [-30, H - 300, -1, 12], tr: [W - 240, -40, 1, 168], tl: [-20, -40, -1, -168] };

  function anime(i) {
    const r = rng(i * 31 + 7), R = RECIPES[i] || RECIPES[1], id = 'wa' + i;
    let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>
      <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#170f42"/><stop offset=".5" stop-color="#4a2572"/><stop offset=".85" stop-color="#93387e"/><stop offset="1" stop-color="#c4567f"/></linearGradient>
      <radialGradient id="${id}sun"><stop offset="0" stop-color="#fff6c9"/><stop offset=".45" stop-color="#ffc0d6" stop-opacity=".9"/><stop offset="1" stop-color="#ff7bb0" stop-opacity="0"/></radialGradient>
      <pattern id="${id}tone" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="4.5" cy="4.5" r="1.7" fill="#fff"/></pattern>
      <linearGradient id="${id}fade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="${id}m"><rect width="${W}" height="${H}" fill="url(#${id}fade)"/></mask>
      <path id="${id}pt" d="M0 -9 C6 -9 9 -2 6 5 L0 9 L-6 5 C-9 -2 -6 -9 0 -9 Z M0 -9 L-1.6 -4 L0 -5.5 L1.6 -4 Z"/>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#${id}sky)"/>`;
    // sun with retro stripes
    const [sx, sy] = R.sun;
    s += `<circle cx="${sx}" cy="${sy}" r="260" fill="url(#${id}sun)" opacity=".5"/>`;
    s += `<g opacity=".38"><circle cx="${sx}" cy="${sy}" r="92" fill="#ffe7a8"/>`;
    for (let k = 0; k < 5; k++) s += `<rect x="${sx - 100}" y="${sy + 18 + k * 15}" width="200" height="${4 + k * 1.6}" fill="#c2468f"/>`;
    s += `</g>`;
    // clouds
    for (let k = 0; k < 5; k++) {
      const cx = r() * W, cy = 120 + r() * 520, sc = 0.6 + r() * 0.9;
      s += `<g transform="translate(${f(cx)} ${f(cy)}) scale(${f(sc)})" fill="#fff" opacity="${f(0.10 + r() * 0.12)}"><circle cx="0" cy="0" r="38"/><circle cx="42" cy="-14" r="48"/><circle cx="92" cy="2" r="34"/><rect x="-10" y="0" width="112" height="34" rx="17"/></g>`;
    }
    // screentone wash
    if (R.tone) s += `<rect width="${W}" height="${H}" fill="url(#${id}tone)" opacity=".16" mask="url(#${id}m)"/>`;
    // speed lines
    if (R.lines) {
      const [fx, fy] = R.focal; s += `<g fill="#fff" opacity=".22">`;
      for (let k = 0; k < 64; k++) {
        const a = (k / 64) * Math.PI * 2 + r() * 0.05, w = 0.004 + r() * 0.012, r0 = 160 + r() * 140, r1 = 1500;
        const p = (rad, ang) => `${f(fx + Math.cos(ang) * rad)} ${f(fy + Math.sin(ang) * rad)}`;
        s += `<path d="M${p(r0, a)} L${p(r1, a - w)} L${p(r1, a + w)} Z"/>`;
      }
      s += `</g>`;
    }
    // sparkles
    for (let k = 0; k < 16; k++) {
      const x = r() * W, y = r() * H * 0.8, z = 4 + r() * 10;
      s += `<path class="tw" style="animation-delay:-${f(r() * 3)}s" d="M${f(x)} ${f(y - z)} Q${f(x)} ${f(y)} ${f(x + z)} ${f(y)} Q${f(x)} ${f(y)} ${f(x)} ${f(y + z)} Q${f(x)} ${f(y)} ${f(x - z)} ${f(y)} Q${f(x)} ${f(y)} ${f(x)} ${f(y - z)}Z" fill="#fff8d6"/>`;
    }
    // LUMI peek
    if (R.lumi) {
      const [px, py, flip, rot] = PEEK[R.lumi];
      s += `<g transform="translate(${px} ${py}) rotate(${rot} 140 160) scale(${flip} 1) translate(${flip < 0 ? -280 : 0} 0)"><use href="#lumi" width="280" height="330" opacity=".95"/></g>`;
    }
    // manga onomatopoeia
    R.words.forEach((w, k) => {   // small manga sound-effect tucked into the bottom-right corner
      const x = W - 64 - k * 30, y = H - 46 - k * 54, rot = -8 + r() * 10;
      s += `<text x="${x}" y="${y}" text-anchor="end" transform="rotate(${f(rot)} ${x} ${y})" font-family="Dela Gothic One" font-size="40" fill="#fff" stroke="#ff4fa3" stroke-width="6" paint-order="stroke" opacity=".5">${w}</text>`;
    });
    // sakura petals (animated fall)
    s += `<g fill="#ffc6dc">`;
    for (let k = 0; k < R.sakura; k++) {
      const x = r() * W, y = r() * H, sc = 0.6 + r() * 1.1, d = 7 + r() * 8;
      s += `<g transform="translate(${f(x)} ${f(y)})"><g class="petal" style="animation-duration:${f(d)}s;animation-delay:-${f(r() * d)}s"><use href="#${id}pt" transform="rotate(${Math.round(r() * 360)}) scale(${f(sc)})" opacity="${f(0.55 + r() * 0.4)}"/></g></g>`;
    }
    s += `</g></svg>`;
    return s;
  }

  function vinyl(x, y, sc, r, k) {   // original bean-shaped vinyl art toy with one button eye + stitched patch
    const body = ['#5e6f6a', '#7b5f5a', '#4f5a73', '#6d6a4f'][k % 4];
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sc)})">
      <ellipse cx="0" cy="-4" rx="30" ry="6" fill="#000" opacity=".35" transform="translate(0 4)"/>
      <path d="M-24 0 C-30 -40 -26 -78 0 -80 C26 -78 30 -40 24 0 Z" fill="${body}"/>
      <path d="M-24 0 C-30 -40 -26 -78 0 -80" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="3"/>
      <circle cx="-8" cy="-50" r="7" fill="#1a1a1a"/><circle cx="-8" cy="-50" r="7" fill="none" stroke="#9fe8d8" stroke-opacity=".6" stroke-width="1.4"/>
      <circle cx="-10" cy="-52" r="1.4" fill="#cfe"/><circle cx="-6" cy="-52" r="1.4" fill="#cfe"/><circle cx="-10" cy="-48" r="1.4" fill="#cfe"/><circle cx="-6" cy="-48" r="1.4" fill="#cfe"/>
      <path d="M6 -56 L14 -44 M14 -56 L6 -44" stroke="#d9c7a0" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M-12 -30 Q0 -24 12 -30" fill="none" stroke="#111" stroke-width="2"/>
      <path d="M-14 -30 l4 4 m4 -2 l2 4 m6 -4 l-2 4 m6 -4 l-4 4" stroke="#d9c7a0" stroke-width="1.2"/>
      <rect x="4" y="-22" width="14" height="12" fill="#3a2f2a" opacity=".7" transform="rotate(12 11 -16)"/>
      <path d="M4 -22 h14 v12 h-14 z" fill="none" stroke="#d9c7a0" stroke-width="1" stroke-dasharray="2 2" transform="rotate(12 11 -16)"/>
    </g>`;
  }

  function horror(i) {
    const r = rng(i * 17 + 3), R = RECIPES[i] || RECIPES[1], id = 'wh' + i;
    let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>
      <linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1112"/><stop offset=".6" stop-color="#1a2321"/><stop offset="1" stop-color="#2b2119"/></linearGradient>
      <radialGradient id="${id}glow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
      <pattern id="${id}fab" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7h14M7 0v14" stroke="#9fe8d8" stroke-opacity=".05"/></pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#${id}bg)"/><rect width="${W}" height="${H}" fill="url(#${id}fab)"/>`;
    // back wall pegboard holes
    s += `<g fill="#000" opacity=".35">`;
    for (let y = 30; y < H; y += 46) for (let x = 20 + (y % 92 ? 23 : 0); x < W; x += 46) s += `<circle cx="${x}" cy="${y}" r="2.6"/>`;
    s += `</g>`;
    // shelves with toys
    const n = R.shelves, gap = H / (n + 1);
    for (let k = 1; k <= n; k++) {
      const y = Math.round(gap * k + 40);
      s += `<rect x="0" y="${y}" width="${W}" height="14" fill="#3b3128"/><rect x="0" y="${y + 14}" width="${W}" height="6" fill="#000" opacity=".5"/>`;
      for (let b = 60; b < W; b += 260) s += `<path d="M${b} ${y + 14} l0 26 l22 -26z" fill="#2a231d"/>`;
      // boxes + plush silhouettes on shelf
      let x = 20 + r() * 60;
      while (x < W - 60) {
        const t = r();
        if (t < 0.35) { const w = 60 + r() * 50, h = 50 + r() * 40; s += `<g opacity=".8"><rect x="${f(x)}" y="${f(y - h)}" width="${f(w)}" height="${f(h)}" fill="#4a3b2c"/><path d="M${f(x)} ${f(y - h)} l${f(w)} ${f(h)} M${f(x + w)} ${f(y - h)} l${f(-w)} ${f(h)}" stroke="#2b221a" stroke-width="3"/><rect x="${f(x + w * 0.3)}" y="${f(y - h * 0.62)}" width="${f(w * 0.4)}" height="12" fill="#d9c7a0" opacity=".5"/></g>`; x += w + 14; }
        else if (t < 0.7) { const sc = 0.55 + r() * 0.35; s += vinyl(x + 30 * sc, y, sc, r, Math.floor(r() * 4)); x += 70 * sc + 18; }
        else { const sz = 46 + r() * 30; s += `<g opacity=".9"><circle cx="${f(x + sz / 2)}" cy="${f(y - sz * 0.55)}" r="${f(sz / 2)}" fill="#15191a"/><circle cx="${f(x + sz * 0.36)}" cy="${f(y - sz * 0.6)}" r="${f(sz * 0.07)}" fill="#9fe8d8" class="blink" style="animation-delay:-${f(r() * 5)}s"/><circle cx="${f(x + sz * 0.64)}" cy="${f(y - sz * 0.6)}" r="${f(sz * 0.07)}" fill="#9fe8d8" class="blink" style="animation-delay:-${f(r() * 5)}s"/></g>`; x += sz + 20; }
      }
    }
    // stitched seams across the wall
    for (let k = 0; k < 2; k++) {
      const y0 = 80 + r() * (H - 160), y1 = y0 + (r() - 0.5) * 260;
      s += `<path d="M0 ${f(y0)} L${W} ${f(y1)}" stroke="#9fe8d8" stroke-opacity=".22" stroke-width="2" stroke-dasharray="10 8"/>`;
      for (let x = 20; x < W; x += 36) { const y = y0 + (y1 - y0) * (x / W); s += `<path d="M${x - 5} ${f(y - 7)} l10 14" stroke="#d9c7a0" stroke-opacity=".28" stroke-width="2"/>`; }
    }
    // conveyor belt
    if (R.belt) {
      s += `<g opacity=".85"><rect x="0" y="${H - 70}" width="${W}" height="26" rx="13" fill="#222"/>`;
      for (let x = 13; x < W; x += 34) s += `<circle cx="${x}" cy="${H - 57}" r="9" fill="#3a3a3a" stroke="#111" stroke-width="2"/>`;
      s += `</g>`;
    }
    // hanging bulbs
    for (let k = 0; k < R.bulbs; k++) {
      const x = (W / (R.bulbs + 1)) * (k + 1) + (r() - 0.5) * 80, len = 40 + r() * 90;
      s += `<g class="flick" style="animation-delay:-${f(r() * 6)}s"><circle cx="${f(x)}" cy="${f(len + 14)}" r="170" fill="url(#${id}glow)"/></g><path d="M${f(x)} 0 V${f(len)}" stroke="#111" stroke-width="2"/><rect x="${f(x - 6)}" y="${f(len)}" width="12" height="8" fill="#333"/><circle cx="${f(x)}" cy="${f(len + 16)}" r="9" fill="#ffe1a0" opacity=".85"/>`;
    }
    // hanging tags
    for (let k = 0; k < 3; k++) {
      const x = 80 + r() * (W - 160), y = 40 + r() * 80;
      s += `<g transform="rotate(${f(-15 + r() * 30)} ${f(x)} ${f(y)})" opacity=".6"><path d="M${f(x)} ${f(y - 30)} V${f(y)}" stroke="#d9c7a0" stroke-width="1"/><rect x="${f(x - 22)}" y="${f(y)}" width="44" height="26" rx="3" fill="#d9c7a0"/><circle cx="${f(x)}" cy="${f(y + 6)}" r="2.4" fill="#1a2321"/><text x="${f(x)}" y="${f(y + 21)}" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#2b2119">No.${String(Math.floor(r() * 90) + 10)}</text></g>`;
    }
    // NUI peek
    if (R.nui) {
      const [px, py, flip, rot] = PEEK[R.nui];
      s += `<g transform="translate(${px} ${py}) rotate(${rot} 140 160) scale(${flip} 1) translate(${flip < 0 ? -280 : 0} 0)" opacity=".92"><use href="#nui" width="280" height="330"/></g>`;
    }
    s += `<rect width="${W}" height="${H}" fill="url(#${id}vig)"/></svg>`;
    return s;
  }

  window.PortfolioWorlds = { anime, horror, RECIPES };
})();
