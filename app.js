/* app.js — slideshow, tilt (deviceorientation / mouse), worlds, glass, sound wiring */
(function () {
  'use strict';
  const qs = new URLSearchParams(location.search);
  const root = document.documentElement;
  const slides = Array.from(document.querySelectorAll('.slide'));
  const N = slides.length;
  // ?static = fully frozen (debug / print). prefers-reduced-motion only SOFTENS motion (slower, smaller) — it never freezes.
  const reduce = qs.has('static');
  const soft = !reduce && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (soft) root.classList.add('soft-motion');
  const dbgTilt = qs.has('tilt') ? Math.max(-1, Math.min(1, parseFloat(qs.get('tilt')) || 0)) : null;

  /* ---------- build world layers, glass & parallax per slide ---------- */
  const GLASS = '.glass,.fc,.ov,.cv-card,.ch,.lnode,.stp,.sk,.pr-contact,.pinfo>div,.ex-title,.label-chip';
  const PARALLAX = '.phone,.browser,.lp,.bn,.shot,.pv-card,.sop';
  slides.forEach((sl, k) => {
    const i = k + 1, page = sl.querySelector('.page');
    const wa = document.createElement('div'); wa.className = 'world-layer wa'; wa.setAttribute('aria-hidden', 'true');
    const wh = document.createElement('div'); wh.className = 'world-layer wh'; wh.setAttribute('aria-hidden', 'true');
    wa.innerHTML = window.PortfolioWorlds.anime(i);
    wh.innerHTML = window.PortfolioWorlds.horror(i);
    const seam = page.querySelector(':scope > .seam-bg');
    if (seam) seam.after(wa, wh); else page.prepend(wa, wh);
    page.querySelectorAll(GLASS).forEach((el) => {
      if (el.closest('.phone,.browser')) return;          // UI inside device mockups stays as designed
      el.classList.add('gl');
      if (getComputedStyle(el).position === 'static') el.classList.add('rel');
    });
    let depth = 0;
    page.querySelectorAll(PARALLAX).forEach((el) => {
      if (el.parentElement.closest(PARALLAX)) return;
      el.classList.add('px'); el.style.setProperty('--d', (8 + (depth++ % 3) * 5) + 'px');
    });
    page.querySelectorAll('use[href="#twin"],use[href="#lumi"],use[href="#nui"],use[href="#pipo"]').forEach((u) => {
      const svg = u.closest('svg');
      if (!svg || svg.closest('.world-layer') || svg.parentElement.closest('svg') || svg.closest('.px')) return;
      svg.classList.add('px'); svg.style.setProperty('--d', '-14px');
    });
  });

  /* ---------- background name layer (one instance, moved into the active slide right above the world layers) ---------- */
  const nameLayer = document.createElement('div');
  nameLayer.className = 'name-layer'; nameLayer.setAttribute('aria-hidden', 'true');
  nameLayer.innerHTML = '<div class="nl-glow"></div><div class="nl-breath">' + (window.ZILOLA_NAME_SVG || '') + '</div>';
  if (reduce) root.classList.add('nl-static');
  function placeName(sl) {
    const page = sl.querySelector('.page'), wh = page.querySelector(':scope > .world-layer.wh');
    if (wh) wh.after(nameLayer); else page.prepend(nameLayer);
  }

  /* ---------- fit to viewport ---------- */
  function fit() {
    const st = document.getElementById('stage').getBoundingClientRect();
    const s = Math.min((st.width - 24) / 1123, (st.height - 16) / 794);
    root.style.setProperty('--fit', Math.max(0.1, s).toFixed(4));
  }
  window.addEventListener('resize', fit); fit();

  /* ---------- slideshow ---------- */
  const dotsEl = document.getElementById('dots'), countEl = document.getElementById('count'), prog = document.getElementById('progress');
  slides.forEach((sl, k) => {
    const b = document.createElement('button'); b.type = 'button';
    b.setAttribute('aria-label', 'スライド ' + (k + 1) + ': ' + (sl.dataset.title || ''));
    b.addEventListener('click', () => go(k));
    dotsEl.appendChild(b);
  });
  let cur = -1;
  function go(k) {
    k = Math.max(0, Math.min(N - 1, k));
    if (k === cur) return;
    const back = k < cur;
    slides.forEach((sl, j) => { sl.classList.toggle('on', j === k); sl.classList.toggle('back', j === k && back); sl.setAttribute('aria-hidden', j === k ? 'false' : 'true'); });
    Array.from(dotsEl.children).forEach((d, j) => d.setAttribute('aria-current', j === k ? 'true' : 'false'));
    cur = k;
    placeName(slides[k]);
    countEl.textContent = String(k + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
    prog.style.width = ((k + 1) / N * 100) + '%';
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + '#' + (k + 1));
  }
  document.getElementById('prev').addEventListener('click', () => go(cur - 1));
  document.getElementById('next').addEventListener('click', () => go(cur + 1));
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(cur + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home') go(0); else if (e.key === 'End') go(N - 1);
  });
  let tx = null, ty = null;
  window.addEventListener('touchstart', (e) => { if (e.touches.length === 1) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; } }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) go(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
  /* ---------- autoplay (pauses on any user navigation) ---------- */
  const AUTO_MS = 7000, playBtn = document.getElementById('play');
  let autoTimer = null;
  function setPlay(on) {
    clearInterval(autoTimer); autoTimer = null;
    if (on) autoTimer = setInterval(() => go(cur >= N - 1 ? 0 : cur + 1), AUTO_MS);
    playBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    playBtn.setAttribute('aria-label', on ? '自動再生を一時停止' : '自動再生');
    playBtn.innerHTML = on ? '&#10074;&#10074;' : '&#9654;';
  }
  playBtn.addEventListener('click', (e) => { e.stopPropagation(); setPlay(!autoTimer); });
  const userStop = () => { if (autoTimer) setPlay(false); };
  ['prev', 'next', 'dots'].forEach((id) => document.getElementById(id).addEventListener('click', userStop, true));
  window.addEventListener('keydown', userStop, true);
  window.addEventListener('touchstart', userStop, { passive: true, capture: true });
  setPlay(!reduce && !qs.has('noauto'));

  const start = parseInt(qs.get('slide') || location.hash.slice(1), 10);
  go(isNaN(start) ? 0 : start - 1);

  /* ---------- tilt: target from device gamma or mouse X, rAF lerp ---------- */
  let target = 0, tilt = 0, gotOrientation = false;
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  let manual = null, wLabel = null; // manual world choice (-1 kawaii / 1 horror) overrides tilt & mouse
  function onOrient(e) {
    if (e.gamma == null || manual !== null) return;
    if (!gotOrientation) { gotOrientation = true; motionBtn.style.display = 'none'; }
    const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    let deg = e.gamma;
    if (ang === 90) deg = -e.beta; else if (ang === -90 || ang === 270) deg = e.beta;
    target = clamp(deg / 25);
  }
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || gotOrientation || manual !== null) return;
    target = clamp((e.clientX / window.innerWidth) * 2 - 1);
  });
  document.addEventListener('mouseleave', () => { if (!gotOrientation && manual === null) target = 0; });
  const motionBtn = document.getElementById('motion');
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const needsPermission = coarse && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
  if (needsPermission && !reduce) {
    motionBtn.style.display = 'inline-flex';
    motionBtn.addEventListener('click', () => {
      DeviceOrientationEvent.requestPermission().then((r) => {
        if (r === 'granted') motionBtn.style.display = 'none';
        else motionBtn.querySelector('span').textContent = 'モーション不可';
      }).catch(() => { motionBtn.querySelector('span').textContent = 'モーション不可'; });
    });
  }
  if (!reduce && 'DeviceOrientationEvent' in window) window.addEventListener('deviceorientation', onOrient);

  const DEAD = 0.06;
  function apply(t) {
    const a = Math.max(0, -t - DEAD) / (1 - DEAD), b = Math.max(0, t - DEAD) / (1 - DEAD);
    root.style.setProperty('--t', t.toFixed(4));
    root.style.setProperty('--tl', a.toFixed(4));
    root.style.setProperty('--tr', b.toFixed(4));
    root.style.setProperty('--ta', Math.max(a, b).toFixed(4));
    if (window.PortfolioSound) window.PortfolioSound.setTilt(t, t === target);
    if (wLabel) wLabel();
  }
  /* ---------- world toggle button (manual choice wins over tilt/mouse) ---------- */
  const wBtn = document.getElementById('worldtoggle');
  if (wBtn) {
    let asked = false;
    const label = () => {
      const h = manual !== null ? manual === 1 : tilt > 0.06;
      if (wBtn.dataset.world === (h ? 'horror' : 'kawaii')) return;
      wBtn.dataset.world = h ? 'horror' : 'kawaii';
      wBtn.setAttribute('aria-pressed', h ? 'true' : 'false');
      wBtn.querySelector('.wt-k').classList.toggle('on', !h);
      wBtn.querySelector('.wt-h').classList.toggle('on', h);
    };
    wBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!asked && needsPermission) { asked = true; try { DeviceOrientationEvent.requestPermission().catch(() => {}); } catch (_) {} }
      manual = (manual === null ? (tilt > 0.06 ? 1 : -1) : manual) === 1 ? -1 : 1;
      target = manual;
      root.classList.add('wt-anim'); clearTimeout(wBtn._t); wBtn._t = setTimeout(() => root.classList.remove('wt-anim'), 700);
      tilt = manual; apply(tilt); // jump immediately (frame-rate independent); CSS fades it
      if (window.PortfolioSound) window.PortfolioSound.setTilt(tilt, true); // music crossfades to the chosen world
      label();
    });
    label();
    wLabel = label;
  }
  if (dbgTilt !== null) { target = tilt = dbgTilt; apply(tilt); }
  else if (reduce) { apply(0); }
  else {
    const loop = () => {
      const nt = tilt + (target - tilt) * (soft ? 0.04 : 0.08);
      if (Math.abs(nt - tilt) > 0.0004 || Math.abs(target - nt) > 0.0004) { tilt = Math.abs(target - nt) < 0.0005 ? target : nt; apply(tilt); }
      requestAnimationFrame(loop);
    };
    apply(0); requestAnimationFrame(loop);
  }

  /* ---------- sound toggle (off by default, starts on tap) ---------- */
  const sBtn = document.getElementById('sound');
  sBtn.addEventListener('click', () => {
    if (!window.PortfolioSound) return;
    Promise.resolve(window.PortfolioSound.toggle()).then((st) => {
      const onNow = window.PortfolioSound.isOn();
      sBtn.setAttribute('aria-pressed', onNow ? 'true' : 'false');
      sBtn.querySelector('span:last-child').textContent = onNow ? 'SOUND ON' : 'SOUND OFF';
      if (onNow) window.PortfolioSound.setTilt(tilt, true);
    });
  });

  /* ---------- up-tilt overview grid (bird's-eye list of all slides) ---------- */
  const ov = document.createElement('div');
  ov.id = 'overview'; ov.setAttribute('aria-hidden', 'true');
  ov.innerHTML = '<div class="ov-head glassui"><b>CAREER OVERVIEW</b><span>全14スライド一覧 — クリックで移動 / 傾きを戻す・Escで閉じる</span></div><div class="ov-grid">' +
    slides.map((sl, k) => '<button type="button" class="ov-item glassui" data-k="' + k + '"><img src="thumbs/s' + String(k + 1).padStart(2, '0') + '.jpg" alt="" loading="lazy"><span><i>' + String(k + 1).padStart(2, '0') + '</i>' + (sl.dataset.title || '') + '</span></button>').join('') + '</div>';
  document.body.appendChild(ov);
  let ovOn = false;
  function setOverview(on) {
    if (on === ovOn) return; ovOn = on;
    ov.classList.toggle('on', on); ov.setAttribute('aria-hidden', on ? 'false' : 'true');
    ov.querySelectorAll('.ov-item').forEach((b) => b.toggleAttribute('aria-current', +b.dataset.k === cur));
    if (on) userStop();
  }
  ov.addEventListener('click', (e) => { const b = e.target.closest('.ov-item'); if (b) { go(+b.dataset.k); } setOverview(false); });
  window.addEventListener('keydown', (e) => { if (e.key === 'ArrowUp') { e.preventDefault(); setOverview(!ovOn); } else if (e.key === 'Escape' || e.key === 'ArrowDown') setOverview(false); });
  // mouse: dwell at the very top edge (above the header buttons) opens; moving down to the lower half closes
  let edgeT = null;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (e.clientY <= 4) { if (!edgeT && !ovOn) edgeT = setTimeout(() => setOverview(true), 350); }
    else { clearTimeout(edgeT); edgeT = null; if (ovOn && e.clientY > window.innerHeight * 0.92) setOverview(false); }
  });
  // device: tilting the top edge away (relative to the first resting pose) by > 22deg opens, back within 10deg closes
  let base = null;
  if (!reduce && 'DeviceOrientationEvent' in window) window.addEventListener('deviceorientation', (e) => {
    if (e.beta == null) return;
    const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    const v = ang === 90 ? e.gamma : (ang === -90 || ang === 270) ? -e.gamma : e.beta;   // "pitch" in the current orientation
    if (base === null) { base = v; return; }
    if (!ovOn) base += (v - base) * 0.004;                     // slowly follow the user's resting pose
    const d = base - v;                                        // positive = top tilted away
    if (d > 22) setOverview(true); else if (d < 10 && ovOn) setOverview(false);
  });
  window.__portfolio = { setOverview, get overview() { return ovOn; }, go, get index() { return cur; }, get autoplay() { return !!autoTimer; }, setPlay, setTilt(v) { target = tilt = clamp(v); apply(tilt); } };
})();
