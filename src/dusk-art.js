import { themeColor } from './theme.js';
import { leafAnchors } from './lacewing.js';

/** Cached chapter wash and paper grain; resting leaves remain gameplay cues. */
export function createDuskArt(width, height, pixelRatio = 1) {
  const canvas = document.createElement('canvas');
  const scale = Math.min(2, pixelRatio);
  canvas.width = Math.ceil(width * scale); canvas.height = Math.ceil(height * scale);
  const ctx = canvas.getContext('2d'); ctx.scale(scale, scale);
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, themeColor('top', '#e6d6da')); wash.addColorStop(0.5, themeColor('middle', '#f2e6d9')); wash.addColorStop(1, themeColor('bottom', '#d1d8ca'));
  ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height);
  let seed = 719;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  ctx.strokeStyle = 'rgba(93,73,80,.05)'; ctx.lineWidth = 0.6;
  for (let i = 0; i < width * height / 200; i++) {
    const x = rand() * width, y = rand() * height;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2 + rand() * 5, y + 0.5); ctx.stroke();
  }
  for (const { x, y } of leafAnchors({ width, height })) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.35);
    ctx.fillStyle = themeColor('leaf', '#c6ccb6'); ctx.strokeStyle = themeColor('vein', '#929d82'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-31, 0); ctx.quadraticCurveTo(0, -28, 32, 0);
    ctx.quadraticCurveTo(0, 27, -31, 0); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(29, 0);
    for (const dx of [-15, -3, 9]) {
      ctx.moveTo(dx, 0); ctx.lineTo(dx + 7, -10);
      ctx.moveTo(dx, 0); ctx.lineTo(dx + 7, 10);
    }
    ctx.stroke(); ctx.restore();
  }
  return canvas;
}
