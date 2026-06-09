import { COLORS, CANVAS_W, CANVAS_H, WORD, PROJECTILE, QUILL } from './config.js';

// ── Cached grain canvas ───────────────────────────────────────────
let grainCanvas = null;

function buildGrain() {
  if (grainCanvas) return grainCanvas;
  const sz = 256;
  grainCanvas = document.createElement('canvas');
  grainCanvas.width = grainCanvas.height = sz;
  const gctx = grainCanvas.getContext('2d');
  const img = gctx.createImageData(sz, sz);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255 | 0;
    img.data[i] = img.data[i+1] = img.data[i+2] = v;
    img.data[i+3] = 18; // very transparent
  }
  gctx.putImageData(img, 0, 0);
  return grainCanvas;
}

// ── Background ────────────────────────────────────────────────────
export function drawBackground(ctx) {
  // Parchment gradient
  const grad = ctx.createRadialGradient(
    CANVAS_W * 0.5, CANVAS_H * 0.45, 0,
    CANVAS_W * 0.5, CANVAS_H * 0.5, CANVAS_W * 0.72
  );
  grad.addColorStop(0,   COLORS.parchment);
  grad.addColorStop(0.7, COLORS.parchment);
  grad.addColorStop(1,   COLORS.parchmentDark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Paper grain (tiled)
  const grain = buildGrain();
  ctx.globalAlpha = 1;
  const pat = ctx.createPattern(grain, 'repeat');
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Foxing spots (age marks)
  drawFoxing(ctx);

  // Vignette
  const vign = ctx.createRadialGradient(
    CANVAS_W * 0.5, CANVAS_H * 0.5, CANVAS_H * 0.2,
    CANVAS_W * 0.5, CANVAS_H * 0.5, CANVAS_W * 0.72
  );
  vign.addColorStop(0,   'rgba(0,0,0,0)');
  vign.addColorStop(0.6, 'rgba(0,0,0,0)');
  vign.addColorStop(1,   'rgba(30,20,10,0.30)');
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Decorative border
  drawBorder(ctx);
}

// Faint seeded age spots
let foxingDots = null;
function drawFoxing(ctx) {
  if (!foxingDots) {
    foxingDots = [];
    for (let i = 0; i < 28; i++) {
      foxingDots.push({
        x: Math.random() * CANVAS_W,
        y: Math.random() * CANVAS_H,
        r: 3 + Math.random() * 14,
        a: 0.03 + Math.random() * 0.055,
      });
    }
  }
  for (const d of foxingDots) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(120,80,30,${d.a})`;
    ctx.fill();
  }
}

function drawBorder(ctx) {
  const m = 14;
  ctx.strokeStyle = `rgba(31,26,20,0.14)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(m, m, CANVAS_W - m * 2, CANVAS_H - m * 2);
  ctx.strokeStyle = `rgba(184,137,62,0.18)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(m + 4, m + 4, CANVAS_W - (m + 4) * 2, CANVAS_H - (m + 4) * 2);
}

// ── Word tokens ───────────────────────────────────────────────────
export function drawWord(ctx, token) {
  const { x, y, w, h, text, isTarget } = token;
  const bx = x - w / 2, by = y - h / 2;

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;

  // Box fill
  ctx.fillStyle = isTarget ? COLORS.blue : COLORS.inkSoft;
  roundRect(ctx, bx, by, w, h, WORD.borderRadius);
  ctx.fill();

  // Subtle inner highlight
  const hiGrad = ctx.createLinearGradient(bx, by, bx, by + h);
  hiGrad.addColorStop(0, 'rgba(255,255,255,0.12)');
  hiGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hiGrad;
  roundRect(ctx, bx, by, w, h, WORD.borderRadius);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Text
  ctx.font = `italic ${WORD.fontSize}px 'EB Garamond', Georgia, serif`;
  ctx.fillStyle = COLORS.parchment;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

// ── Projectile ────────────────────────────────────────────────────
export function drawProjectile(ctx, proj) {
  // Trail
  for (let i = 0; i < proj.trail.length; i++) {
    const t = proj.trail[i];
    const alpha = (i / proj.trail.length) * 0.45;
    const r = PROJECTILE.radius * (i / proj.trail.length) * 0.7;
    ctx.beginPath();
    ctx.arc(t.x, t.y, Math.max(0.5, r), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(28,63,94,${alpha})`;
    ctx.fill();
  }
  // Head
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, PROJECTILE.radius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.blueLight;
  ctx.shadowColor = COLORS.blue;
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ── Particles ─────────────────────────────────────────────────────
export function drawParticle(ctx, p) {
  ctx.globalAlpha = p.alpha();
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ── Ink blots ─────────────────────────────────────────────────────
export function drawInkBlot(ctx, blot) {
  ctx.save();
  ctx.translate(blot.x, blot.y);
  // Draw an irregular splatter
  ctx.beginPath();
  const segs = 10;
  for (let i = 0; i <= segs; i++) {
    const angle = (i / segs) * Math.PI * 2;
    const r = blot.r * (0.75 + 0.35 * Math.sin(angle * 3.7 + blot.r));
    if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fillStyle = `rgba(122,46,46,0.55)`;
  ctx.fill();
  ctx.restore();
}

// ── Quill ─────────────────────────────────────────────────────────
export function drawQuill(ctx, quill, time) {
  ctx.save();
  const bobY = quill.getBobY();
  const cx = quill.x;
  const cy = QUILL.y + bobY;

  ctx.translate(cx, cy);
  ctx.rotate((quill.tilt * Math.PI) / 180);

  const w = QUILL.width;
  const h = QUILL.height;

  // Quill shaft (feather vane) — stylised
  const shaftGrad = ctx.createLinearGradient(-w * 0.4, -h * 0.5, w * 0.4, h * 0.4);
  shaftGrad.addColorStop(0,   '#E8DFC0');
  shaftGrad.addColorStop(0.5, '#D4C99A');
  shaftGrad.addColorStop(1,   '#B8A870');
  ctx.fillStyle = shaftGrad;

  // Feather outline
  ctx.beginPath();
  ctx.moveTo(0, h * 0.45);           // nib bottom
  ctx.bezierCurveTo(
    -w * 0.5, h * 0.2,
    -w * 0.55, -h * 0.1,
    -w * 0.05, -h * 0.5
  );
  ctx.bezierCurveTo(
    w * 0.05, -h * 0.52,
    w * 0.5, -h * 0.3,
    w * 0.5, h * 0.1
  );
  ctx.bezierCurveTo(w * 0.4, h * 0.3, w * 0.1, h * 0.4, 0, h * 0.45);
  ctx.fill();

  // Central rachis (spine)
  ctx.beginPath();
  ctx.moveTo(0, h * 0.45);
  ctx.quadraticCurveTo(-w * 0.05, 0, -w * 0.02, -h * 0.5);
  ctx.strokeStyle = 'rgba(120,90,40,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Nib (iron-gall ink dark tip)
  ctx.beginPath();
  ctx.moveTo(-4, h * 0.35);
  ctx.lineTo(0, h * 0.45);
  ctx.lineTo(4, h * 0.35);
  ctx.fillStyle = COLORS.ink;
  ctx.fill();

  // Occasional ink drip
  const drip = Math.sin(time * 0.9) * 0.5 + 0.5;
  if (drip > 0.85) {
    const dripLen = (drip - 0.85) * 40;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.45);
    ctx.lineTo(0, h * 0.45 + dripLen);
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    // Droplet
    ctx.beginPath();
    ctx.arc(0, h * 0.45 + dripLen, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.blue;
    ctx.fill();
  }

  ctx.restore();
}

// ── Helpers ───────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Screen shake helper ───────────────────────────────────────────
export function applyShake(ctx, magnitude) {
  if (magnitude < 0.5) return;
  const dx = (Math.random() * 2 - 1) * magnitude;
  const dy = (Math.random() * 2 - 1) * magnitude;
  ctx.translate(dx, dy);
}

// ── "Next word" hint arrow ────────────────────────────────────────
export function drawNextHint(ctx, targetWord) {
  if (!targetWord) return;
  // Small pulsing arrow above the next target word
  const x = targetWord.x;
  const y = targetWord.y - targetWord.h / 2 - 10;
  const pulse = Math.sin(Date.now() * 0.004) * 3;
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.moveTo(x, y - 6 + pulse);
  ctx.lineTo(x - 7, y - 14 + pulse);
  ctx.lineTo(x + 7, y - 14 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
