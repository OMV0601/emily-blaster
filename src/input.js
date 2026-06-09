// Centralised input state — no callbacks, just poll from game loop.
const state = {
  mouseX: 480,       // internal canvas X coordinate
  firePressed: false,
  leftDown: false,
  rightDown: false,
};

let canvasEl = null;
let cssXToInternalFn = (x) => x;
let initialized = false;

// cssXToInternal: (cssX: number) => number  — maps CSS px to game coords.
// Registers listeners only once; updating cssXToInternal on replay is safe.
export function initInput(canvas, cssXToInternal) {
  canvasEl = canvas;
  cssXToInternalFn = cssXToInternal;
  if (initialized) return;
  initialized = true;

  window.addEventListener('mousemove', e => {
    const rect = canvasEl.getBoundingClientRect();
    state.mouseX = cssXToInternalFn(e.clientX - rect.left);
  });

  window.addEventListener('mousedown', e => {
    if (e.button === 0) state.firePressed = true;
  });

  window.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); state.firePressed = true; }
    if (e.code === 'ArrowLeft')  { e.preventDefault(); state.leftDown  = true; }
    if (e.code === 'ArrowRight') { e.preventDefault(); state.rightDown = true; }
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft')  state.leftDown  = false;
    if (e.code === 'ArrowRight') state.rightDown = false;
  });
}

// Call once per frame after reading it, to consume the fire event.
export function consumeFire() {
  const v = state.firePressed;
  state.firePressed = false;
  return v;
}

export function getMouseX() { return state.mouseX; }
export function isLeftDown()  { return state.leftDown; }
export function isRightDown() { return state.rightDown; }
