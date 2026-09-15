import { themeColor } from './theme.js';
import { leafAnchors } from './lacewing.js';

/** Cached planted passage. Leaves are scenery, never recipe contents. */
export function createDuskArt(width, height, pixelRatio = 1) {
  const canvas = document.createElement('canvas');
  const scale = Math.min(2, pixelRatio);
  canvas.width = Math.ceil(width * scale); canvas.height = Math.ceil(height * scale);
  const ctx = canvas.getContext('2d'); ctx.scale(scale, scale);
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, themeColor('top', '#e6d6da')); wash.addColorStop(0.5, themeColor('middle', '#f2e6d9')); wash.addColorStop(1, themeColor('bottom', '#d1d8ca'));
  ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = themeColor('edge', '#bcaaa9'); ctx.fillRect(0, 0, 24, height);
  ctx.strokeStyle = themeColor('edge', '#9e8e90'); ctx.lineWidth = 1;
  for (let y = 35; y < height; y += 65) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(23, y + 3); ctx.stroke();
  }
  ctx.fillStyle = themeColor('edge', '#bfb6af'); ctx.fillRect(24, height - 30, width - 24, 30);
  ctx.strokeStyle = themeColor('edge', '#a99b95');
  for (let x = 80; x < width; x += 115) {
    ctx.beginPath(); ctx.moveTo(x, height - 30); ctx.lineTo(x - 8, height); ctx.stroke();
  }
  for (let y = 70; y < height - 40; y += 32) {
    ctx.strokeStyle = themeColor('vein', '#879780'); ctx.beginPath(); ctx.moveTo(width - 7, y + 30);
    ctx.quadraticCurveTo(width - 30, y, width - 16, y - 14); ctx.stroke();
    ctx.fillStyle = themeColor('leaf', '#a0ad91'); ctx.beginPath();
    ctx.ellipse(width - 18, y, 6, 13, -0.5, 0, Math.PI * 2); ctx.fill();
  }
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
