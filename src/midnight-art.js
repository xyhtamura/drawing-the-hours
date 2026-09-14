import { leafAnchors } from './lacewing.js';

/** Window-side planter, with a bright drawing field under a blue night border. */
export function createMidnightArt(width, height, pixelRatio = 1) {
  const canvas = document.createElement('canvas');
  const scale = Math.min(2, pixelRatio);
  canvas.width = Math.ceil(width * scale); canvas.height = Math.ceil(height * scale);
  const ctx = canvas.getContext('2d'); ctx.scale(scale, scale);
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, '#d3d9e4'); wash.addColorStop(0.5, '#e5e7e3'); wash.addColorStop(1, '#c6d2d0');
  ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height);
  // Frame and sill stay outside the target area; nothing is a gesture obstacle.
  ctx.fillStyle = '#5e6a80'; ctx.fillRect(0, 140, 19, height - 140); ctx.fillRect(width - 19, 140, 19, height - 140);
  ctx.fillStyle = '#8c94a3'; ctx.fillRect(19, 140, 5, height - 140); ctx.fillRect(width - 24, 140, 5, height - 140);
  ctx.fillStyle = '#929b9f'; ctx.fillRect(0, height - 28, width, 28);
  ctx.fillStyle = '#afb5b3'; ctx.fillRect(24, height - 35, width - 48, 7);
  const light = ctx.createRadialGradient(width * 0.75, height * 0.55, 5, width * 0.75, height * 0.55, width * 0.65);
  light.addColorStop(0, 'rgba(255,248,212,.36)'); light.addColorStop(1, 'rgba(255,248,212,0)');
  ctx.fillStyle = light; ctx.fillRect(24, 0, width - 48, height - 35);
  for (const side of [1, -1]) {
    const x = side === 1 ? 30 : width - 30;
    ctx.strokeStyle = '#83958c'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const y = height - 60 - i * 21;
      ctx.beginPath(); ctx.moveTo(x, y + 25); ctx.quadraticCurveTo(x + side * 8, y, x + side * 14, y - 9); ctx.stroke();
      ctx.fillStyle = '#a7b9a5'; ctx.beginPath(); ctx.ellipse(x + side * 12, y, 5, 12, side * 0.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (const {x, y} of leafAnchors({width, height})) {
    ctx.fillStyle = '#bccab9'; ctx.strokeStyle = '#8a9e8e'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, y, 28, 12, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 24, y + 7); ctx.lineTo(x + 24, y - 7); ctx.stroke();
  }
  let seed = 1024;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  ctx.strokeStyle = 'rgba(53,70,91,.045)'; ctx.lineWidth = 0.6;
  for (let i = 0; i < width * height / 210; i++) {
    const x = rand() * width, y = rand() * height;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1 + rand() * 5, y + 0.5); ctx.stroke();
  }
  return canvas;
}
