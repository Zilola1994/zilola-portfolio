/* ==========================================================================
   sound.js — ZILOLA MOTOYOSHI portfolio soundtrack
   100% original Web Audio synthesis (no samples, no external files).
   One shared clock drives three stems that always play in sync:
     LEFT  (tilt < 0) : bright idol-pop   — sparkle arpeggio, bouncy kick + claps, major
     NEUTRAL          : the melody softly on celesta + glass pad
     RIGHT (tilt > 0) : the SAME melody as an eerie music box + detuned toy piano,
                        reharmonized toward minor, sparse rhythm, soft low drone
   Rewrite the music by editing CONFIG and the stem*() functions below.
   Public API: window.PortfolioSound = { toggle(), start(), stop(), setTilt(t, force), isOn(), gains() }
   ========================================================================== */
(function () {
  'use strict';

  const CONFIG = {
    bpm: 128,            // shared tempo for all stems
    master: 0.14,        // overall volume (keep low)
    root: 60,            // MIDI note of the key centre (60 = C4)
    stepsPerBar: 16,     // 16th-note grid
    bars: 4,
    // one chord per bar, as semitone offsets from root
    chordsMajor: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]],   // C  G  Am F   (idol / neutral)
    chordsMinor: [[9, 12, 16], [4, 7, 11], [5, 9, 12], [2, 5, 9]],    // Am Em F  Dm  (music-box reharmonization)
    // shared melody: [step 0..63, semitone offset from root, length in steps]
    melody: [
      [0, 16, 2], [2, 19, 2], [4, 21, 2], [6, 19, 2], [8, 16, 3], [12, 14, 2], [14, 12, 2],
      [16, 14, 2], [18, 19, 2], [20, 23, 2], [22, 21, 2], [24, 19, 4], [30, 14, 2],
      [32, 12, 2], [34, 16, 2], [36, 21, 2], [38, 19, 2], [40, 16, 3], [44, 19, 2], [46, 21, 2],
      [48, 24, 4], [52, 21, 2], [54, 19, 2], [56, 17, 2], [58, 16, 2], [60, 14, 4]
    ],
    lookahead: 0.12,     // seconds scheduled ahead
    tickMs: 25,
    rampTime: 0.09       // stem crossfade smoothing (seconds, time-constant)
  };

  let ctx = null, master = null, comp = null, noiseBuf = null;
  const bus = {};
  let on = false, timer = null, step = 0, nextTime = 0, tilt = 0, lastGainUpdate = 0;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const stepDur = () => 60 / CONFIG.bpm / 4;
  const TOTAL = () => CONFIG.stepsPerBar * CONFIG.bars;

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3;
    master = ctx.createGain(); master.gain.value = 0;
    master.connect(comp); comp.connect(ctx.destination);
    ['L', 'N', 'R'].forEach((k) => { bus[k] = ctx.createGain(); bus[k].gain.value = k === 'N' ? 1 : 0; bus[k].connect(master); });
    // light shared reverb-ish echo for the right stem (feedback delay)
    const dly = ctx.createDelay(1); dly.delayTime.value = stepDur() * 3;
    const fb = ctx.createGain(); fb.gain.value = 0.32;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    bus.Rfx = ctx.createGain(); bus.Rfx.gain.value = 0.5;
    bus.Rfx.connect(dly); dly.connect(lp); lp.connect(fb); fb.connect(dly); lp.connect(bus.R);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  /* ---------- voice helpers (every envelope starts and ends at 0 → no clicks) ---------- */
  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
    g.gain.linearRampToValueAtTime(0, t + a + dec + 0.02);
    return t + a + dec + 0.05;
  }
  function tone(out, t, freq, type, a, peak, dec, detune = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    o.connect(g); g.connect(out); o.start(t); o.stop(env(g, t, a, peak, dec));
  }
  function noise(out, t, dur, peak, type, freq, q = 1) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(env(g, t, 0.002, peak, dur));
  }
  function kick(out, t, peak) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    o.connect(g); g.connect(out); o.start(t); o.stop(env(g, t, 0.003, peak, 0.22));
  }
  function bell(out, t, freq, peak, dec) {           // simple FM bell
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    car.frequency.value = freq; mod.frequency.value = freq * 3.5; mg.gain.setValueAtTime(freq * 1.2, t); mg.gain.exponentialRampToValueAtTime(1, t + dec);
    mod.connect(mg); mg.connect(car.frequency); car.connect(g); g.connect(out);
    car.start(t); mod.start(t); const end = env(g, t, 0.003, peak, dec); car.stop(end); mod.stop(end);
  }
  function pad(out, t, notes, dur, peak) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; f.connect(out);
    notes.forEach((m) => [-7, 7].forEach((dt) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = mtof(m); o.detune.value = dt; o.connect(g); g.connect(f);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + dur * 0.35);
      g.gain.linearRampToValueAtTime(peak * 0.8, t + dur * 0.8); g.gain.linearRampToValueAtTime(0, t + dur + 0.25);
      o.start(t); o.stop(t + dur + 0.3);
    }));
  }
  function drone(out, t, m, dur, peak) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220; f.connect(out);
    [-9, 9].forEach((dt) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; o.connect(g); g.connect(f);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.4);
      g.gain.setValueAtTime(peak, t + dur - 0.1); g.gain.linearRampToValueAtTime(0, t + dur + 0.4);
      o.start(t); o.stop(t + dur + 0.45);
    });
  }

  /* ---------- STEMS ---------- */
  function stemIdol(s, t, bar, mel) {                  // LEFT: bright idol-pop, major
    const out = bus.L, ch = CONFIG.chordsMajor[bar], R = CONFIG.root, beat = s % 4 === 0;
    if (beat) kick(out, t, 0.9);
    if (s % 16 === 4 || s % 16 === 12) { noise(out, t, 0.12, 0.35, 'bandpass', 1500, 0.8); noise(out, t + 0.012, 0.1, 0.25, 'bandpass', 1200, 0.8); }
    if (s % 2 === 1) noise(out, t, 0.03, 0.12, 'highpass', 8000);
    if (s % 2 === 0) tone(out, t, mtof(R + ch[0] - 24), 'sawtooth', 0.005, 0.12, stepDur() * 1.6);
    const arp = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 12];
    bell(out, t, mtof(R + arp[s % 8] + 12), 0.05, 0.18);
    if (mel) { const f = mtof(R + mel[1]); tone(out, t, f, 'square', 0.01, 0.06, stepDur() * mel[2] * 1.1); tone(out, t, f, 'triangle', 0.01, 0.12, stepDur() * mel[2] * 1.2, 5); }
  }
  function stemNeutral(s, t, bar, mel) {               // NEUTRAL: celesta + glass pad
    const out = bus.N, R = CONFIG.root;
    if (s % 16 === 0) pad(out, t, CONFIG.chordsMajor[bar].map((n) => R + n), stepDur() * 16, 0.035);
    if (mel) { const f = mtof(R + mel[1] + 12); tone(out, t, f, 'sine', 0.004, 0.12, 0.9); tone(out, t, f * 4, 'sine', 0.002, 0.025, 0.25); }
  }
  function stemToybox(s, t, bar, mel) {                // RIGHT: haunted music box, minor, sparse
    const out = bus.R, ch = CONFIG.chordsMinor[bar], R = CONFIG.root;
    if (s % 16 === 0) drone(out, t, R + ch[0] - 24, stepDur() * 16, 0.06);
    if (s === 0) kick(out, t, 0.25);                   // one soft thump per loop
    if (s % 32 === 24) noise(out, t, 0.6, 0.05, 'bandpass', 600, 6); // creak
    if (mel) {
      const f = mtof(R + mel[1] + 12);
      [-6, 6].forEach((dt) => tone(out, t, f, 'sine', 0.002, 0.07, 1.3, dt));
      tone(bus.Rfx, t, f * 2, 'sine', 0.002, 0.03, 0.6, 3);
    }
    if (s % 8 === 0) {                                  // detuned toy piano, sparse chord tones
      const m = R + ch[(s / 8) % 3];
      tone(out, t, mtof(m), 'triangle', 0.003, 0.08, 0.45, 18);
      tone(out, t, mtof(m + 12), 'triangle', 0.003, 0.035, 0.3, -14);
    }
  }

  function scheduleStep(s, t) {
    const bar = Math.floor(s / CONFIG.stepsPerBar) % CONFIG.bars;
    const mel = CONFIG.melody.find((n) => n[0] === s);
    stemIdol(s, t, bar, mel); stemNeutral(s, t, bar, mel); stemToybox(s, t, bar, mel);
  }
  function tick() {
    if (!ctx || ctx.state !== 'running') return;
    while (nextTime < ctx.currentTime + CONFIG.lookahead) {
      scheduleStep(step, nextTime); nextTime += stepDur(); step = (step + 1) % TOTAL();
    }
  }

  function applyGains(force) {
    if (!ctx) return;
    const now = ctx.currentTime;
    if (!force && now - lastGainUpdate < 0.04) return;
    lastGainUpdate = now;
    const a = Math.max(0, -tilt), b = Math.max(0, tilt);
    const gL = Math.sin(a * Math.PI / 2), gR = Math.sin(b * Math.PI / 2), gN = Math.cos(Math.max(a, b) * Math.PI / 2);
    bus.L.gain.setTargetAtTime(gL, now, CONFIG.rampTime);
    bus.R.gain.setTargetAtTime(gR * 1.1, now, CONFIG.rampTime);
    bus.N.gain.setTargetAtTime(gN, now, CONFIG.rampTime);
  }

  async function start() {
    if (!ctx && !init()) return false;
    if (ctx.state !== 'running') await ctx.resume();
    on = true;
    nextTime = ctx.currentTime + 0.06; step = 0;
    applyGains(true);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(CONFIG.master, ctx.currentTime + 0.4);
    if (!timer) timer = setInterval(tick, CONFIG.tickMs);
    tick();
    return true;
  }
  function stop() {
    on = false;
    if (!ctx) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.25);
    setTimeout(() => { if (!on && ctx.state === 'running') ctx.suspend(); }, 320);
  }
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { ctx.suspend(); }
    else if (on) { ctx.resume().then(() => { nextTime = ctx.currentTime + 0.06; }); }
  });

  window.PortfolioSound = {
    CONFIG,
    start, stop,
    toggle() { return on ? (stop(), Promise.resolve(false)) : start(); },
    setTilt(t, force) { tilt = Math.max(-1, Math.min(1, t)); if (on) applyGains(!!force); },
    gains() { return ctx ? { L: bus.L.gain.value, N: bus.N.gain.value, R: bus.R.gain.value, state: ctx.state, on } : null; },
    isOn: () => on
  };
})();
