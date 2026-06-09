import {
  POEM_SEQUENCE, DECOY_BANK,
  CANVAS_W, CANVAS_H,
  WORD, PROJECTILE, QUILL, PARTICLE, SHAKE,
  SCORE, MAX_BLOTS, RESPAWN_DELAY,
  COLORS,
} from './config.js';
import { WordToken, Projectile, InkParticle, InkBlot, Quill } from './entities.js';
import {
  drawBackground, drawWord, drawProjectile, drawParticle,
  drawInkBlot, drawQuill, applyShake, drawNextHint,
} from './render.js';
import { getMouseX, isLeftDown, isRightDown, consumeFire } from './input.js';
import { playFire, playCorrect, playError, playWin } from './audio.js';

// ── Game state ────────────────────────────────────────────────────
export class Game {
  constructor(canvas, onWin, onGameOver, onHUDUpdate) {
    this.canvas     = canvas;
    this.ctx        = canvas.getContext('2d');
    this.onWin      = onWin;
    this.onGameOver = onGameOver;
    this.onHUDUpdate = onHUDUpdate;

    this.reset();
  }

  reset() {
    this.seqIndex   = 0;         // next required word in POEM_SEQUENCE
    this.score      = 0;
    this.blots      = 0;
    this.shots      = 0;
    this.hits       = 0;

    this.words      = [];
    this.projectiles = [];
    this.particles  = [];
    this.inkBlots   = [];
    this.quill      = new Quill();

    this.shakeMag   = 0;
    this.fireCooldown = 0;
    this.time       = 0;

    // Respawn tracking for missed required words
    this.missedRespawnTimer = 0;
    this.missedWord = null;

    this._spawnInitialWords();
    this._updateHUD();
  }

  // ── Spawning ───────────────────────────────────────────────────
  _spawnInitialWords() {
    this._spawnCorrect();
    if (this.seqIndex + 1 < POEM_SEQUENCE.length) this._spawnCorrect(1);
    this._fillDecoys();
  }

  _spawnCorrect(offset = 0) {
    const idx = this.seqIndex + offset;
    if (idx >= POEM_SEQUENCE.length) return;
    if (this.words.find(w => w.index === idx && !w.dead)) return;
    const t = new WordToken(POEM_SEQUENCE[idx], true, idx);
    this.words.push(t);
  }

  _fillDecoys() {
    const onScreen = this.words.filter(w => !w.dead).length;
    const needed = Math.min(WORD.maxOnScreen, 4) - onScreen;
    if (needed <= 0) return;
    const used = new Set(this.words.filter(w => !w.dead).map(w => w.text));
    const pool = DECOY_BANK.filter(w => !used.has(w));
    for (let i = 0; i < needed && pool.length > 0; i++) {
      const ri = Math.floor(Math.random() * pool.length);
      const tok = new WordToken(pool[ri], false, -1);
      this.words.push(tok);
      pool.splice(ri, 1);
    }
  }

  // ── Update loop ────────────────────────────────────────────────
  update(dt) {
    this.time += dt;
    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    // Arrow key quill movement
    let targetX = getMouseX();
    if (isLeftDown())  targetX = Math.max(30, this.quill.x - 220 * dt);
    if (isRightDown()) targetX = Math.min(CANVAS_W - 30, this.quill.x + 220 * dt);

    this.quill.update(dt, targetX);

    // Fire
    if (consumeFire() && this.fireCooldown <= 0) {
      this._fire();
    }

    // Shake decay
    if (this.shakeMag > 0) this.shakeMag = Math.max(0, this.shakeMag - SHAKE.decay * dt);

    // Update entities
    this._updateWords(dt);
    this._updateProjectiles(dt);
    this._updateParticles(dt);

    // Respawn missed required word
    if (this.missedWord) {
      this.missedRespawnTimer -= dt;
      if (this.missedRespawnTimer <= 0) {
        this.missedWord.respawn();
        this.words.push(this.missedWord);
        this.missedWord = null;
      }
    }

    // Prune dead entities
    this.words       = this.words.filter(w => !w.dead);
    this.projectiles = this.projectiles.filter(p => !p.dead);
    this.particles   = this.particles.filter(p => !p.dead);

    // Don't spawn the current target if it's already queued for respawn
    const awaitingRespawn = this.missedWord ? this.missedWord.index : -1;
    if (awaitingRespawn !== this.seqIndex) this._spawnCorrect(0);
    if (this.seqIndex + 1 < POEM_SEQUENCE.length) this._spawnCorrect(1);
    this._fillDecoys();

    this._updateHUD();
  }

  _fire() {
    playFire();
    this.shots++;
    const proj = new Projectile(this.quill.nibX, this.quill.nibY);
    this.projectiles.push(proj);
    this.fireCooldown = PROJECTILE.cooldown / 1000;
  }

  _updateWords(dt) {
    for (const w of this.words) {
      if (w.dead) continue;
      w.update(dt);
      // Check if required word fell off screen
      if (w.dead && w.isTarget && w.index === this.seqIndex && !w.hit) {
        // Missed required word — respawn after delay
        this.missedWord = w;
        this.missedRespawnTimer = RESPAWN_DELAY;
      }
    }
  }

  _updateProjectiles(dt) {
    for (const proj of this.projectiles) {
      if (proj.dead) continue;
      proj.update(dt);
      // Collision check with words
      for (const w of this.words) {
        if (w.dead || proj.dead) continue;
        if (w.contains(proj.x, proj.y)) {
          proj.dead = true;
          if (w.isTarget && w.index === this.seqIndex) {
            this._onCorrectHit(w, proj.x, proj.y);
          } else {
            this._onWrongHit(w, proj.x, proj.y);
          }
          break;
        }
      }
    }
  }

  _updateParticles(dt) {
    for (const p of this.particles) p.update(dt);
  }

  _onCorrectHit(word, x, y) {
    word.dead = true;
    word.hit  = true;
    this.hits++;
    this.score += SCORE.correct;
    playCorrect();
    this._spawnParticles(x, y, true);
    this.seqIndex++;

    // Notify manuscript
    this.onHUDUpdate({ type: 'word', word: word.text, seqIndex: this.seqIndex - 1 });

    if (this.seqIndex >= POEM_SEQUENCE.length) {
      // Win after a brief pause
      playWin();
      setTimeout(() => this.onWin(this.score, this._accuracy()), 800);
    }
  }

  _onWrongHit(word, x, y) {
    this.blots++;
    this.score = Math.max(0, this.score - SCORE.penalty);
    this.shakeMag = SHAKE.magnitude;
    playError();
    this._spawnParticles(x, y, false);
    this.inkBlots.push(new InkBlot(x, y));

    if (this.blots >= MAX_BLOTS) {
      setTimeout(() => this.onGameOver(), 600);
    }
  }

  _spawnParticles(x, y, correct) {
    for (let i = 0; i < PARTICLE.count; i++) {
      this.particles.push(new InkParticle(x, y, correct));
    }
  }

  _accuracy() {
    if (this.shots === 0) return 100;
    return Math.round((this.hits / this.shots) * 100);
  }

  _updateHUD() {
    this.onHUDUpdate({
      type: 'stats',
      score: this.score,
      accuracy: this.shots > 0 ? this._accuracy() + '%' : '—',
      blots: this.blots,
    });
  }

  // ── Render ─────────────────────────────────────────────────────
  render() {
    const ctx = this.ctx;

    ctx.save();

    // Map game units (CANVAS_W × CANVAS_H) to physical backing-store pixels.
    // canvas.width already incorporates devicePixelRatio from resizeGameCanvas.
    const scaleX = this.canvas.width  / CANVAS_W;
    const scaleY = this.canvas.height / CANVAS_H;
    const scale  = Math.min(scaleX, scaleY);
    const offsetX = (this.canvas.width  - CANVAS_W * scale) / 2;
    const offsetY = (this.canvas.height - CANVAS_H * scale) / 2;

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Screen shake
    if (this.shakeMag > 0.5) applyShake(ctx, this.shakeMag);

    // Draw scene
    drawBackground(ctx);

    for (const blot of this.inkBlots) drawInkBlot(ctx, blot);
    for (const w of this.words) if (!w.dead) drawWord(ctx, w);

    // Highlight next target
    const nextWord = this.words.find(w => !w.dead && w.isTarget && w.index === this.seqIndex);
    if (nextWord) drawNextHint(ctx, nextWord);

    for (const proj of this.projectiles) if (!proj.dead) drawProjectile(ctx, proj);
    for (const p of this.particles) if (!p.dead) drawParticle(ctx, p);

    drawQuill(ctx, this.quill, this.time);

    ctx.restore();
  }

}
