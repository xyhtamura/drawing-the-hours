import { curbSeamY } from './geometry.js';

/** Cached, locally authored paper verge. Decoration never participates in hit tests. */
export function createDawnArt(width, height, pixelRatio = 1) {
  const canvas = document.createElement('canvas');
  const scale = Math.min(2, pixelRatio);
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  let seed = 147;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, '#f9eae6');
  wash.addColorStop(0.42, '#fcf8e9');
  wash.addColorStop(1, '#e6edd9');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  // Thin fibers are generated once, not randomized on each animation frame.
  for (let i = 0; i < width * height / 190; i++) {
    const x = random() * width, y = random() * height;
    ctx.strokeStyle = random() < 0.5 ? 'rgba(117,95,78,.035)' : 'rgba(255,255,255,.32)';
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1 + random() * 5, y + random()); ctx.stroke();
  }
  // A pavement lip and little seams establish the urban edge.
  ctx.fillStyle = '#dbd4cf'; ctx.fillRect(0, height - 19, width, 19);
  ctx.fillStyle = '#eee5db'; ctx.fillRect(0, height - 24, width, 5);
  ctx.strokeStyle = '#b9aaa1'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, height - 19); ctx.lineTo(width, height - 19); ctx.stroke();
  for (let x = 66; x < width; x += 126) {
    ctx.beginPath(); ctx.moveTo(x, height - 19); ctx.lineTo(x + 3, height); ctx.stroke();
  }
  // A paving seam crosses the verge; Dawn snails crawl along it. Fixed spacing
  // keeps the seeded random sequence for the grasses and flowers unchanged.
  ctx.strokeStyle = 'rgba(150,132,118,.5)'; ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let x = 0; x <= width + 6; x += 6) {
    const y = curbSeamY(x, width, height);
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = '#aab98f'; ctx.lineWidth = 1;
  for (let x = 41; x < width; x += 97) {
    const y = curbSeamY(x, width, height);
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 4, y - 5, x - 2, y - 9);
    ctx.moveTo(x + 2, y); ctx.quadraticCurveTo(x + 6, y - 4, x + 5, y - 8);
    ctx.stroke();
  }
  // A small bus-stop marker sits outside the central gesture area.
  ctx.fillStyle = '#a6a69a'; ctx.fillRect(width - 17, 99, 3, 59);
  ctx.fillStyle = '#eedcde'; ctx.fillRect(width - 27, 96, 23, 28);
  ctx.strokeStyle = '#946b77'; ctx.lineWidth = 1;
  ctx.strokeRect(width - 27, 96, 23, 28);
  ctx.strokeRect(width - 22, 102, 13, 13);
  ctx.beginPath(); ctx.moveTo(width - 22, 109); ctx.lineTo(width - 9, 109); ctx.stroke();
  ctx.fillStyle = '#946b77';
  for (const x of [width - 20, width - 11]) {
    ctx.beginPath(); ctx.arc(x, 117, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  // Cut-paper grasses live at the boundary; the center stays open for drawing.
  for (let i = 0; i < Math.ceil(width / 11); i++) {
    const x = random() * width, y = height - 23;
    const h = 10 + random() * 24;
    ctx.fillStyle = ['#9eae83', '#bac69e', '#d0d8b4'][i % 3];
    ctx.beginPath(); ctx.moveTo(x - 3, y);
    ctx.quadraticCurveTo(x - 10, y - h * .65, x - 5, y - h);
    ctx.quadraticCurveTo(x + 1, y - h * .5, x + 3, y); ctx.fill();
  }
  for (let i = 0; i < 16; i++) {
    const side = i % 2, x = side ? width - 8 - random() * 15 : 8 + random() * 15;
    const y = 115 + random() * Math.max(1, height - 170);
    ctx.strokeStyle = '#a8b38d'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.quadraticCurveTo(x + 6, y + 8, x, y); ctx.stroke();
    const r = 2.5 + random() * 2;
    ctx.fillStyle = i % 3 ? '#efd0d4' : '#fffbed';
    for (let a = 0; a < 5; a++) {
      const t = a * Math.PI * 2 / 5;
      ctx.beginPath(); ctx.ellipse(x + Math.cos(t) * r, y + Math.sin(t) * r, r, r * .7, t, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#bf945d'; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
  }
  return canvas;
}

/** Lines are measured using the active canvas font, including local web fonts. */
export function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line); line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}
