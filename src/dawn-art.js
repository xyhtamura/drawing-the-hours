import { localize } from './edition.js';
import { themeColor } from './theme.js';
import { paperBackdrop, PAPER_USE } from './paper.js';

/** Cached chapter wash and paper grain; resting leaves remain gameplay cues. */
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
  wash.addColorStop(0, themeColor('top', '#f9eae6'));
  wash.addColorStop(PAPER_USE.backdrop.dawn.mid, themeColor('middle', '#fcf8e9'));
  wash.addColorStop(1, themeColor('bottom', '#e6edd9'));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  if (paperBackdrop(canvas, 'dawn')) {
    // Dust: fine dark and pale specks over the pressed paper.
    for (let i = 0; i < width * height / 150; i++) {
      ctx.fillStyle = random() < 0.6 ? 'rgba(96,74,58,.13)' : 'rgba(255,250,240,.2)';
      ctx.fillRect(random() * width, random() * height, 0.5 + random() * 0.9, 0.5 + random() * 0.9);
    }
    return canvas;
  }
  // Thin fibers are generated once, not randomized on each animation frame.
  for (let i = 0; i < width * height / 190; i++) {
    const x = random() * width, y = random() * height;
    ctx.strokeStyle = random() < 0.5 ? 'rgba(117,95,78,.035)' : 'rgba(255,255,255,.32)';
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1 + random() * 5, y + random()); ctx.stroke();
  }
  return canvas;
}

/** Lines are measured using the active canvas font, including local web fonts. */
export function wrapText(ctx, text, maxWidth) {
  text = localize(text); // whole, so a renamed phrase is not split across lines first
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
