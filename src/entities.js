import { COLORS, CANVAS_W, CANVAS_H, WORD, PROJECTILE, QUILL, PARTICLE } from './config.js';

// ── Utilities ────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function rand(min, max) { return min + Math.random() * (max - min); }

// ── WordToken ────────────────────────────────────────────────────
export class WordToken {
  constructor(text, isTarget, index) {
    this.text      = text;
    this.isTarget  = isTarget;
    this.index     = index;       // sequence index (targets only)
    this.phaseX    = Math.random() * Math.PI * 2;
    this.phaseY    = Math.random() * Math.PI * 2;
    this.dead      = false;
    this.hit       = false;
    this._resetPosition();
  }

  _resetPosition() {
    this.w = Math.max(80, this.text.length * WORD.fontSize * 0.55 + WORD.padding * 2);
    this.h = WORD.fontSize + WORD.paddingV * 2;
    this.x = rand(this.w / 2 + 20, CANVAS_W - this.w / 2 - 20);
    this.y = -this.h - rand(0, 40);
    this.baseX = this.x;
    this.speedY = WORD.fallSpeed + rand(-8, 8);
    this.t = 0; // time accumulator for sway
  }

  respawn() {
    this.dead = false;
    this.hit  = false;
    this._resetPosition();
  }

  update(dt) {
    this.t += dt;
    this.y += this.speedY * dt;
    this.x  = this.baseX + Math.sin(this.t * WORD.swayFreq * Math.PI * 2 + this.phaseX) * WORD.sway;
    if (this.y > CANVAS_H + this.h) this.dead = true;
  }

  getBounds() {
    return {
      x: this.x - this.w / 2,
      y: this.y - this.h / 2,
      w: this.w,
      h: this.h,
    };
  }

  // Returns true if point (px, py) is inside the token
  contains(px, py) {
    const b = this.getBounds();
    return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
  }
}

// ── Projectile ───────────────────────────────────────────────────
export class Projectile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dead = false;
    this.trail = [];  // [{x,y}]
  }

  update(dt) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > PROJECTILE.trailLen) this.trail.shift();
    this.y -= PROJECTILE.speed * dt;
    if (this.y < -PROJECTILE.radius) this.dead = true;
  }
}

// ── InkParticle ──────────────────────────────────────────────────
export class InkParticle {
  constructor(x, y, correct) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(PARTICLE.speedMin, PARTICLE.speedMax);
    this.x  = x; this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - rand(60, 140); // bias upward slightly
    this.life    = rand(PARTICLE.lifeMin, PARTICLE.lifeMax);
    this.maxLife = this.life;
    this.size    = rand(PARTICLE.sizeMin, PARTICLE.sizeMax);
    this.color   = correct ? COLORS.blue : COLORS.oxblood;
    this.dead    = false;
  }

  update(dt) {
    this.vy += PARTICLE.gravity * dt;
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  alpha() { return Math.max(0, this.life / this.maxLife); }
}

// ── InkBlot ──────────────────────────────────────────────────────
export class InkBlot {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.r = rand(12, 24);
    this.life = 1;
    this.dead = false;
  }

  update(dt) {
    // blots persist; they don't die on their own
  }
}

// ── Quill ────────────────────────────────────────────────────────
export class Quill {
  constructor() {
    this.x     = CANVAS_W / 2;
    this.tilt  = 0;   // degrees, positive = right
    this.prevX = CANVAS_W / 2;
    this.bob   = 0;   // time accumulator
  }

  update(dt, targetX) {
    const dx = targetX - this.x;
    // Smooth follow
    this.x = lerp(this.x, targetX, Math.min(1, dt * 12));
    // Tilt toward direction of travel
    const tiltTarget = Math.max(-QUILL.tiltMax, Math.min(QUILL.tiltMax, (targetX - this.x) * 1.5));
    this.tilt = lerp(this.tilt, tiltTarget, Math.min(1, dt * QUILL.tiltSmooth));
    this.bob += dt;
  }

  get nibX() { return this.x; }
  get nibY() { return QUILL.y - QUILL.height * 0.4; }

  getBobY() {
    return Math.sin(this.bob * QUILL.bobFreq * Math.PI * 2) * QUILL.bobAmp;
  }
}
