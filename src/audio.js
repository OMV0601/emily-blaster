// Web Audio API — synthesized sounds only, no external files.
let ctx = null;
let muted = false;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function masterGain() {
  const g = getCtx().createGain();
  g.gain.value = muted ? 0 : 0.35;
  g.connect(getCtx().destination);
  return g;
}

// Short scratch/whoosh — quill firing
export function playFire() {
  if (muted) return;
  const c = getCtx();
  const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'bandpass'; filt.frequency.value = 3200; filt.Q.value = 0.8;
  const g = masterGain(); g.gain.value = 0.15;
  src.connect(filt); filt.connect(g);
  src.start();
}

// Bright chime — correct hit
export function playCorrect() {
  if (muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const osc2 = c.createOscillator();
  const g = masterGain();
  g.gain.setValueAtTime(0.25, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
  osc.type = 'sine'; osc.frequency.value = 880;
  osc2.type = 'sine'; osc2.frequency.value = 1320;
  osc.connect(g); osc2.connect(g);
  osc.start(); osc2.start();
  osc.stop(c.currentTime + 0.6); osc2.stop(c.currentTime + 0.6);
}

// Dull thud — wrong hit
export function playError() {
  if (muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const g = masterGain();
  osc.type = 'sawtooth'; osc.frequency.value = 120;
  osc.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.15);
  g.gain.setValueAtTime(0.3, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
  osc.connect(g);
  osc.start(); osc.stop(c.currentTime + 0.2);
}

// Resolving tone — win
export function playWin() {
  if (muted) return;
  const c = getCtx();
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = masterGain();
    const t = c.currentTime + i * 0.18;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    osc.type = 'sine'; osc.frequency.value = freq;
    osc.connect(g);
    osc.start(t); osc.stop(t + 1.2);
  });
}

export function setMuted(val) { muted = val; }
export function isMuted() { return muted; }
