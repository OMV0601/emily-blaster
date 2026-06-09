import {
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
  // poem: one entry from POEMS array in config.js
  constructor(canvas, poem, onWin, onGameOver, onHUDUpdate) {
    this.canvas      = canvas;
    this.ctx         = canvas.getContext('2d');
    this.poem        = poem;
    this.onWin       = onWin;
    this.onGameOver  = onGameOver;
    this.onHUDUpdate = onHUDUpdate;

    this.reset();
  }

  reset() {
    this.seqIndex    = 0;
    this.score       = 0;
    this.blots       = 0;
    this.shots       = 0;
    this.hits        = 0;

    this.words       = [];
    this.projectiles = [];
    this.particles   = [];
    this.inkBlots    = [];
    this.quill       = new Quill();

    this.shakeMag      = 0;
    this.fireCooldown  = 0;
    this.time          = 0;

    this.missedRespawnTimer = 0;
    this.missedWord         = null;

    this._spawnInitialWords();
    this._updateHUD();
  }

  // ── Spawning ───────────────────────────────────────────────────
  _spawnInitialWords() {
    this._spawnCorrect(0);
    if (this.seqIndex + 1 < this.poem.sequence.length) this._spawnCorrect(1);
    this._fillDecoys();
  }

  _spawnCorrect(offset = 0) {
    const idx = this.seqIndex + offset;
    if (idx >= this.poem.sequence.length) return;
    if (this.words.find(w => w.index === idx && !w.dead)) return;
    this.words.push(new WordToken(this.poem.sequence[idx], true, idx));
  }

  _fillDecoys() {
    const onScreen = this.words.filter(w => !w.dead).length;
    const needed   = Math.min(WORD.maxOnScreen, 5) - onScreen;
    if (needed <= 0) return;
    const used = new Set(this.words.filter(w => !w.dead).map(w => w.text));
    const pool = this.poem.decoys.filter(w => !used.has(w));
    for (let i = 0; i < needed && pool.length > 0; i++) {
      const ri = Math.floor(Math.random() * pool.length);
      this.words.push(new WordToken(pool[ri], false, -1));
      pool.splice(ri, 1);
    }
  }

  // ── Update loop ────────────────────────────────────────────────
  update(dt) {
    this.time += dt;
    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    let targetX = getMouseX();
    if (isLeftDown())  targetX = Math.max(30, this.quill.x - 220 * dt);
    if (isRightDown()) targetX = Math.min(CANVAS_W - 30, this.quill.x + 220 * dt);

    this.quill.update(dt, targetX);

    if (consumeFire() && this.fireCooldown <= 0) this._fire();

    if (this.shakeMag > 0) this.shakeMag = Math.max(0, this.shakeMag - SHAKE.decay * dt);

    this._updateWords(dt);
    this._updateProjectiles(dt);
    for (const p of this.particles) p.update(dt);

    // Respawn missed required word after delay
    if (this.missedWord) {
      this.missedRespawnTimer -= dt;
      if (this.missedRespawnTimer <= 0) {
        this.missedWord.respawn();
        this.words.push(this.missedWord);
        this.missedWord = null;
      }
    }

    this.words       = this.words.filter(w => !w.dead);
    this.projectiles = this.projectiles.filter(p => !p.dead);
    this.particles   = this.particles.filter(p => !p.dead);

    // Don't re-spawn the current target if it's queued for respawn
    const awaitingRespawn = this.missedWord ? this.missedWord.index : -1;
    if (awaitingRespawn !== this.seqIndex) this._spawnCorrect(0);
    if (this.seqIndex + 1 < this.poem.sequence.length) this._spawnCorrect(1);
    this._fillDecoys();

    this._updateHUD();
  }

  _fire() {
    playFire();
    this.shots++;
    this.projectiles.push(new Projectile(this.quill.nibX, this.quill.nibY));
    this.fireCooldown = PROJECTILE.cooldown / 1000;
  }

  _updateWords(dt) {
    for (const w of this.words) {
      if (w.dead) continue;
      w.update(dt);
      if (w.dead && w.isTarget && w.index === this.seqIndex && !w.hit) {
        this.missedWord         = w;
        this.missedRespawnTimer = RESPAWN_DELAY;
      }
    }
  }

  _updateProjectiles(dt) {
    for (const proj of this.projectiles) {
      if (proj.dead) continue;
      proj.update(dt);
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

  _onCorrectHit(word, x, y) {
    word.dead = true;
    word.hit  = true;
    this.hits++;
    this.score += SCORE.correct;
    playCorrect();
    this._spawnParticles(x, y, true);
    this.seqIndex++;

    this.onHUDUpdate({ type: 'word', seqIndex: this.seqIndex - 1 });

    if (this.seqIndex >= this.poem.sequence.length) {
      playWin();
      setTimeout(() => this.onWin(this.score, this._accuracy()), 800);
    }
  }

  _onWrongHit(word, x, y) {
    this.blots++;
    this.score   = Math.max(0, this.score - SCORE.penalty);
    this.shakeMag = SHAKE.magnitude;
    playError();
    this._spawnParticles(x, y, false);
    this.inkBlots.push(new InkBlot(x, y));
    if (this.blots >= MAX_BLOTS) setTimeout(() => this.onGameOver(), 600);
  }

  _spawnParticles(x, y, correct) {
    for (let i = 0; i < PARTICLE.count; i++) {
      this.particles.push(new InkParticle(x, y, correct));
    }
  }

  _accuracy() {
    return this.shots === 0 ? 100 : Math.round((this.hits / this.shots) * 100);
  }

  _updateHUD() {
    this.onHUDUpdate({
      type:     'stats',
      score:    this.score,
      accuracy: this.shots > 0 ? this._accuracy() + '%' : '—',
      blots:    this.blots,
    });
  }

  // ── Render ─────────────────────────────────────────────────────
  render() {
    const ctx = this.ctx;
    ctx.save();

    const scaleX = this.canvas.width  / CANVAS_W;
    const scaleY = this.canvas.height / CANVAS_H;
    const scale  = Math.min(scaleX, scaleY);
    const offsetX = (this.canvas.width  - CANVAS_W * scale) / 2;
    const offsetY = (this.canvas.height - CANVAS_H * scale) / 2;

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    if (this.shakeMag > 0.5) applyShake(ctx, this.shakeMag);

    drawBackground(ctx);

    for (const blot of this.inkBlots) drawInkBlot(ctx, blot);
    for (const w of this.words) if (!w.dead) drawWord(ctx, w);

    const nextWord = this.words.find(w => !w.dead && w.isTarget && w.index === this.seqIndex);
    if (nextWord) drawNextHint(ctx, nextWord);

    for (const proj of this.projectiles) if (!proj.dead) drawProjectile(ctx, proj);
    for (const p   of this.particles)   if (!p.dead)    drawParticle(ctx, p);

    drawQuill(ctx, this.quill, this.time);

    ctx.restore();
  }
}
