import './style.css';
import { CANVAS_W, CANVAS_H, COLORS, POEM_SEQUENCE, POEM_LINES } from './config.js';
import { Game } from './game.js';
import { initInput } from './input.js';
import { setMuted, isMuted } from './audio.js';

// ── State machine ─────────────────────────────────────────────────
// Screens: 'title' | 'game' | 'victory' | 'gameover'
let currentScreen = 'title';

const screens = {
  title:    document.getElementById('screen-title'),
  game:     document.getElementById('screen-game'),
  victory:  document.getElementById('screen-victory'),
  gameover: document.getElementById('screen-gameover'),
};

function goTo(name) {
  for (const [key, el] of Object.entries(screens)) {
    if (key === name) el.classList.add('active');
    else              el.classList.remove('active');
  }
  currentScreen = name;
}

// ── Game canvas setup ─────────────────────────────────────────────
const gameCanvas = document.getElementById('game-canvas');

function resizeGameCanvas() {
  const dpr  = window.devicePixelRatio || 1;
  const wrap  = gameCanvas.parentElement;
  const cssW  = wrap.clientWidth;
  const cssH  = wrap.clientHeight;

  // Maintain 960:600 aspect, letterbox
  const scale = Math.min(cssW / CANVAS_W, cssH / CANVAS_H);
  const w = Math.round(CANVAS_W * scale);
  const h = Math.round(CANVAS_H * scale);

  gameCanvas.style.width  = w + 'px';
  gameCanvas.style.height = h + 'px';
  // canvas.width/height are in physical pixels (CSS size × dpr).
  // The context transform is reset when dimensions are set; render() applies
  // all scaling itself so we never need to pre-scale the context here.
  gameCanvas.width  = Math.round(w * dpr);
  gameCanvas.height = Math.round(h * dpr);
}

window.addEventListener('resize', resizeGameCanvas);

// ── Manuscript DOM panel ───────────────────────────────────────────
const manuscriptContainer = document.getElementById('manuscript-lines');

// Tracks which words have been rendered
const manuscriptState = {
  lines: [[], [], [], []],  // 4 poem lines, each an array of word-spans
};

// Map sequence index → line & position within line
const WORD_TO_LINE = buildWordLineMap();

function buildWordLineMap() {
  const map = {};
  let seqIdx = 0;
  for (let li = 0; li < POEM_LINES.length; li++) {
    // Split on spaces but keep words; strip punctuation for matching
    const lineWords = POEM_LINES[li].split(' ');
    for (const raw of lineWords) {
      const clean = raw.replace(/[^a-zA-Z]/g, '');
      if (POEM_SEQUENCE[seqIdx] && POEM_SEQUENCE[seqIdx].toLowerCase() === clean.toLowerCase()) {
        map[seqIdx] = { line: li, raw };
        seqIdx++;
      }
    }
  }
  return map;
}

function initManuscript() {
  manuscriptContainer.innerHTML = '';
  manuscriptState.lines = [[], [], [], []];
  for (let i = 0; i < POEM_LINES.length; i++) {
    const lineEl = document.createElement('span');
    lineEl.className = 'manuscript-line';
    lineEl.id = `mline-${i}`;
    manuscriptContainer.appendChild(lineEl);
  }
}

function appendWordToManuscript(seqIdx) {
  const info = WORD_TO_LINE[seqIdx];
  if (!info) return;
  const lineEl = document.getElementById(`mline-${info.line}`);
  if (!lineEl) return;

  const span = document.createElement('span');
  span.className = 'manuscript-word';
  span.textContent = (lineEl.textContent ? ' ' : '') + info.raw;
  span.style.animationDelay = '0s';
  lineEl.appendChild(span);
}

// ── HUD wiring ────────────────────────────────────────────────────
const hudScore    = document.getElementById('hud-score');
const hudAccuracy = document.getElementById('hud-accuracy');
const hudBlots    = document.getElementById('hud-blots');

function onHUDUpdate(ev) {
  if (ev.type === 'stats') {
    hudScore.textContent    = ev.score;
    hudAccuracy.textContent = ev.accuracy;
    hudBlots.textContent    = `${ev.blots} / 5`;
  } else if (ev.type === 'word') {
    appendWordToManuscript(ev.seqIndex);
  }
}

// ── Mute button ───────────────────────────────────────────────────
const btnMute = document.getElementById('btn-mute');
btnMute.addEventListener('click', () => {
  setMuted(!isMuted());
  btnMute.textContent = isMuted() ? '✕' : '♪';
  btnMute.classList.toggle('muted', isMuted());
});

// ── Game instance ─────────────────────────────────────────────────
let game = null;
let rafId = null;
let lastTime = null;

function startGame() {
  resizeGameCanvas();
  initManuscript();

  game = new Game(
    gameCanvas,
    onWin,
    onGameOver,
    onHUDUpdate,
  );

  // Map CSS px (relative to canvas element) → internal CANVAS_W coordinates.
  // The canvas CSS width always equals the letterboxed pixel width, so the
  // ratio cssX/cssW maps linearly to 0..CANVAS_W.
  initInput(gameCanvas, (cssX) => {
    const cssW = gameCanvas.getBoundingClientRect().width || 1;
    return (cssX / cssW) * CANVAS_W;
  });

  if (rafId) cancelAnimationFrame(rafId);
  lastTime = null;
  loop();
}

function loop(ts = 0) {
  rafId = requestAnimationFrame(loop);
  if (lastTime === null) lastTime = ts;
  const dt = Math.min((ts - lastTime) / 1000, 0.05); // cap at 50ms
  lastTime = ts;

  if (currentScreen === 'game' && game) {
    game.update(dt);
    game.render();
  }
}

// ── Win / Game Over callbacks ─────────────────────────────────────
function onWin(score, accuracy) {
  populateVictoryScreen(score, accuracy);
  goTo('victory');
}

function onGameOver() {
  goTo('gameover');
}

function populateVictoryScreen(score, accuracy) {
  document.getElementById('victory-score').textContent    = `Score: ${score}`;
  document.getElementById('victory-accuracy').textContent = `Accuracy: ${accuracy}%`;

  const poemEl = document.getElementById('victory-poem');
  poemEl.innerHTML = '';
  POEM_LINES.forEach((line, i) => {
    const p = document.createElement('p');
    p.textContent = line;
    p.style.animationDelay = `${i * 0.25}s`;
    poemEl.appendChild(p);
  });
}

// ── Buttons ───────────────────────────────────────────────────────
document.getElementById('btn-begin').addEventListener('click', () => {
  goTo('game');
  startGame();
});

document.getElementById('btn-replay').addEventListener('click', () => {
  goTo('game');
  startGame();
});

document.getElementById('btn-retry').addEventListener('click', () => {
  goTo('game');
  startGame();
});

// ── Title screen ambient canvas ───────────────────────────────────
(function initTitleCanvas() {
  const tc = document.getElementById('title-canvas');
  const tctx = tc.getContext('2d');
  let tw = 0, th = 0;

  function resizeTitle() {
    tw = tc.width  = tc.offsetWidth;
    th = tc.height = tc.offsetHeight;
  }
  resizeTitle();
  new ResizeObserver(resizeTitle).observe(tc);

  // Feather particle
  const feathers = Array.from({ length: 3 }, () => ({
    x:     Math.random() * 400 + 200,
    y:     Math.random() * -200 - 50,
    rot:   Math.random() * Math.PI * 2,
    rotV:  (Math.random() - 0.5) * 0.4,
    vy:    20 + Math.random() * 15,
    vx:    (Math.random() - 0.5) * 15,
    alpha: 0.08 + Math.random() * 0.10,
    size:  60 + Math.random() * 40,
  }));

  // Ink wash blobs
  const blobs = Array.from({ length: 6 }, () => ({
    x: Math.random() * 800 + 100,
    y: Math.random() * 500 + 50,
    r: 60 + Math.random() * 120,
    alpha: 0.025 + Math.random() * 0.03,
    dx: (Math.random() - 0.5) * 8,
    dy: (Math.random() - 0.5) * 8,
  }));

  function drawTitleFrame(ts) {
    requestAnimationFrame(drawTitleFrame);
    if (currentScreen !== 'title') return;
    tctx.clearRect(0, 0, tw, th);

    // Drifting ink blobs
    for (const b of blobs) {
      b.x += b.dx * 0.016;
      b.y += b.dy * 0.016;
      if (b.x < -b.r)  b.x = tw + b.r;
      if (b.x > tw+b.r) b.x = -b.r;
      if (b.y < -b.r)  b.y = th + b.r;
      if (b.y > th+b.r) b.y = -b.r;
      const g = tctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, `rgba(28,63,94,${b.alpha})`);
      g.addColorStop(1, 'rgba(28,63,94,0)');
      tctx.fillStyle = g;
      tctx.beginPath();
      tctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      tctx.fill();
    }

    // Drifting feather outlines
    for (const f of feathers) {
      f.y += f.vy * 0.016;
      f.x += f.vx * 0.016 + Math.sin(ts * 0.0006 + f.rot) * 0.5;
      f.rot += f.rotV * 0.016;
      if (f.y > th + 100) { f.y = -100; f.x = Math.random() * tw; }

      tctx.save();
      tctx.translate(f.x, f.y);
      tctx.rotate(f.rot);
      tctx.globalAlpha = f.alpha;
      tctx.strokeStyle = COLORS.blue;
      tctx.lineWidth = 1.5;
      tctx.beginPath();
      const sz = f.size;
      tctx.moveTo(0, sz * 0.45);
      tctx.bezierCurveTo(-sz*0.5, sz*0.2, -sz*0.55, -sz*0.1, -sz*0.05, -sz*0.5);
      tctx.bezierCurveTo(sz*0.05, -sz*0.52, sz*0.5, -sz*0.3, sz*0.5, sz*0.1);
      tctx.bezierCurveTo(sz*0.4, sz*0.3, sz*0.1, sz*0.4, 0, sz*0.45);
      tctx.stroke();
      tctx.globalAlpha = 1;
      tctx.restore();
    }
  }

  requestAnimationFrame(drawTitleFrame);
})();

// ── Initial screen ────────────────────────────────────────────────
goTo('title');

// ── Input scaleX fix: reinit on resize ───────────────────────────
// (input module needs a getter; the getter closure captures gameCanvas so it
//  automatically reads the updated bounding rect on each frame)
