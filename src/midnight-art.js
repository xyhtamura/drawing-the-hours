import { themeColor } from './theme.js';
import { paperBackdrop, paperShape, PAPER_USE } from './paper.js';
import { leafAnchors } from './lacewing.js';

/** Cached chapter wash and paper grain; resting leaves remain gameplay cues. */
export function createMidnightArt(width, height, pixelRatio = 1) {
  const canvas = document.createElement('canvas');
  const scale = Math.min(2, pixelRatio);
  canvas.width = Math.ceil(width * scale); canvas.height = Math.ceil(height * scale);
  const ctx = canvas.getContext('2d'); ctx.scale(scale, scale);
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, themeColor('top', '#d3d9e4')); wash.addColorStop(PAPER_USE.backdrop.midnight.mid, themeColor('middle', '#e5e7e3')); wash.addColorStop(1, themeColor('bottom', '#c6d2d0'));
  ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height);
  const pressed = paperBackdrop(canvas, 'midnight');
  for (const {x, y} of leafAnchors({width, height})) {
    ctx.fillStyle = themeColor('leaf', '#bccab9'); ctx.strokeStyle = themeColor('vein', '#8a9e8e'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, y, 28, 12, -0.3, 0, Math.PI * 2); paperShape(ctx, 'leaf');
    ctx.beginPath(); ctx.moveTo(x - 24, y + 7); ctx.lineTo(x + 24, y - 7); ctx.stroke();
  }
  if (pressed) return canvas;
  let seed = 1024;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  ctx.strokeStyle = 'rgba(53,70,91,.045)'; ctx.lineWidth = 0.6;
  for (let i = 0; i < width * height / 210; i++) {
    const x = rand() * width, y = rand() * height;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1 + rand() * 5, y + 0.5); ctx.stroke();
  }
  return canvas;
}
