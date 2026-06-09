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
    img.data[i+3] = 14; // subtle on dark
  }
  gctx.putImageData(img, 0, 0);
  return grainCanvas;
}

// ── Background — deep Prussian-blue book cover ─────────────────────
export function drawBackground(ctx) {
  // Deep navy gradient (center slightly lighter, edges near-black)
  const grad = ctx.createRadialGradient(
    CANVAS_W * 0.5, CANVAS_H * 0.4, 0,
    CANVAS_W * 0.5, CANVAS_H * 0.5, CANVAS_W * 0.75
  );
  grad.addColorStop(0,   '#1C3F5E');
  grad.addColorStop(0.5, '#162C43');
  grad.addColorStop(1,   '#0A1825');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle paper grain (reads as dark linen on navy)
  const grain = buildGrain();
  const pat = ctx.createPattern(grain, 'repeat');
  ctx.fillStyle = pat;
  ctx.globalAlpha = 0.06;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.globalAlpha = 1;

  // Vignette — deeper at corners
  const vign = ctx.createRadialGradient(
    CANVAS_W * 0.5, CANVAS_H * 0.5, CANVAS_H * 0.25,
    CANVAS_W * 0.5, CANVAS_H * 0.5, CANVAS_W * 0.75
  );
  vign.addColorStop(0,   'rgba(0,0,0,0)');
  vign.addColorStop(0.65, 'rgba(0,0,0,0)');
  vign.addColorStop(1,   'rgba(0,0,0,0.5)');
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Decorative border — gold double rule
  drawBorder(ctx);
}

function drawBorder(ctx) {
  const m = 14;
  ctx.strokeStyle = `rgba(201,151,63,0.25)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(m, m, CANVAS_W - m * 2, CANVAS_H - m * 2);
  ctx.strokeStyle = `rgba(201,151,63,0.12)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(m + 5, m + 5, CANVAS_W - (m+5)*2, CANVAS_H - (m+5)*2);
}

// ── Word tokens ───────────────────────────────────────────────────
export function drawWord(ctx, token) {
  const { x, y, w, h, text, isTarget } = token;
  const bx = x - w / 2, by = y - h / 2;

  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur  = 8;
  ctx.shadowOffsetY = 3;

  // Target = gold pill; decoy = muted navy pill
  if (isTarget) {
    const tg = ctx.createLinearGradient(bx, by, bx, by + h);
    tg.addColorStop(0, '#D4A84B');
    tg.addColorStop(1, '#9E6E28');
    ctx.fillStyle = tg;
  } else {
    ctx.fillStyle = '#1E4A6E';
  }
  roundRect(ctx, bx, by, w, h, WORD.borderRadius);
  ctx.fill();

  // Top-edge shimmer
  const hiGrad = ctx.createLinearGradient(bx, by, bx, by + h * 0.5);
  hiGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
  hiGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hiGrad;
  roundRect(ctx, bx, by, w, h, WORD.borderRadius);
  ctx.fill();

  ctx.shadowColor   = 'transparent';
  ctx.shadowBlur    = 0;
  ctx.shadowOffsetY = 0;

  // Text — cream on gold, cream on navy
  ctx.font = `italic ${WORD.fontSize}px 'EB Garamond', Georgia, serif`;
  ctx.fillStyle    = isTarget ? '#1F1A14' : COLORS.cream;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

// ── Projectile ────────────────────────────────────────────────────
export function drawProjectile(ctx, proj) {
  for (let i = 0; i < proj.trail.length; i++) {
    const t = proj.trail[i];
    const alpha = (i / proj.trail.length) * 0.5;
    const r = PROJECTILE.radius * (i / proj.trail.length) * 0.7;
    ctx.beginPath();
    ctx.arc(t.x, t.y, Math.max(0.5, r), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(201,151,63,${alpha})`;
    ctx.fill();
  }
  // Head — bright gold orb
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, PROJECTILE.radius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.goldLight;
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur  = 14;
  ctx.fill();
  ctx.shadowBlur  = 0;
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
  ctx.beginPath();
  const segs = 10;
  for (let i = 0; i <= segs; i++) {
    const angle = (i / segs) * Math.PI * 2;
    const r = blot.r * (0.75 + 0.35 * Math.sin(angle * 3.7 + blot.r));
    if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else         ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fillStyle = `rgba(139,58,58,0.7)`;
  ctx.fill();
  ctx.restore();
}

// ── Quill ─────────────────────────────────────────────────────────
export function drawQuill(ctx, quill, time) {
  ctx.save();
  const bobY = quill.getBobY();
  ctx.translate(quill.x, QUILL.y + bobY);
  ctx.rotate((quill.tilt * Math.PI) / 180);

  const w = QUILL.width;
  const h = QUILL.height;

  // Feather vane — warm amber/cream (readable on dark)
  const shaftGrad = ctx.createLinearGradient(-w*0.4, -h*0.5, w*0.4, h*0.4);
  shaftGrad.addColorStop(0,   '#EDE3C5');
  shaftGrad.addColorStop(0.5, '#D4C08A');
  shaftGrad.addColorStop(1,   '#A88840');
  ctx.fillStyle = shaftGrad;

  ctx.beginPath();
  ctx.moveTo(0, h * 0.45);
  ctx.bezierCurveTo(-w*0.5, h*0.2,  -w*0.55, -h*0.1, -w*0.05, -h*0.5);
  ctx.bezierCurveTo( w*0.05, -h*0.52, w*0.5, -h*0.3,   w*0.5,  h*0.1);
  ctx.bezierCurveTo( w*0.4,  h*0.3,   w*0.1,  h*0.4,   0,      h*0.45);
  ctx.fill();

  // Rachis
  ctx.beginPath();
  ctx.moveTo(0, h * 0.45);
  ctx.quadraticCurveTo(-w*0.05, 0, -w*0.02, -h*0.5);
  ctx.strokeStyle = 'rgba(160,120,50,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Nib — dark iron tip
  ctx.beginPath();
  ctx.moveTo(-4, h * 0.35);
  ctx.lineTo(0,  h * 0.45);
  ctx.lineTo(4,  h * 0.35);
  ctx.fillStyle = '#0A1520';
  ctx.fill();

  // Ink drip — gold on dark bg
  const drip = Math.sin(time * 0.9) * 0.5 + 0.5;
  if (drip > 0.85) {
    const dripLen = (drip - 0.85) * 40;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.45);
    ctx.lineTo(0, h * 0.45 + dripLen);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, h * 0.45 + dripLen, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.gold;
    ctx.fill();
  }

  ctx.restore();
}

// ── Helpers ───────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,   x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,   y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x,   y,   x + r, y, r);
  ctx.closePath();
}

export function applyShake(ctx, magnitude) {
  if (magnitude < 0.5) return;
  ctx.translate(
    (Math.random() * 2 - 1) * magnitude,
    (Math.random() * 2 - 1) * magnitude
  );
}

// Gold pulsing arrow above next target word
export function drawNextHint(ctx, targetWord) {
  if (!targetWord) return;
  const x = targetWord.x;
  const y = targetWord.y - targetWord.h / 2 - 10;
  const pulse = Math.sin(Date.now() * 0.004) * 3;
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = COLORS.goldLight;
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(x,      y - 6  + pulse);
  ctx.lineTo(x - 7,  y - 14 + pulse);
  ctx.lineTo(x + 7,  y - 14 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}
