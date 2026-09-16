import { themeColor } from './theme.js';
/** Cached chapter wash and paper grain; resting leaves remain gameplay cues. */
export function createNoonArt(width, height, pixelRatio = 1) {
  const canvas = document.createElement('canvas');
  const scale = Math.min(2, pixelRatio);
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, themeColor('top', '#fff8e5')); wash.addColorStop(0.65, themeColor('middle', '#f3f3df')); wash.addColorStop(1, themeColor('bottom', '#e4e9dd'));
  ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height);
  // Deterministic fibers keep the quiet paper texture stable as fliers move.
  let seed = 417;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  ctx.strokeStyle = 'rgba(103,101,79,.035)'; ctx.lineWidth = .6;
  for (let i = 0; i < width * height / 220; i++) {
    const x = rand() * width, y = rand() * height;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rand() * 5 + 1, y + .4); ctx.stroke();
  }
  return canvas;
}
