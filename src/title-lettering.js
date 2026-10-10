import { loadPaper, onPapersArrived, paperTile } from './paper.js';

/** Xyh's three white lettering frames become coloured paper masks. */
export async function createHandwrittenTitle(canvas, heading, panel) {
  const frames = await Promise.all([1, 2, 3].map(n => new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = new URL(`../handwritten/drawinghand0${n}.png`, import.meta.url).href;
  })));
  // Keep the readable font title if any frame is unavailable.
  if (frames.some(frame => !frame)) return;
  canvas.width = 800; canvas.height = 760;
  const ctx = canvas.getContext('2d');
  let coloured = [], current = 0;
  function bake() {
    coloured = frames.map(frame => {
      const layer = Object.assign(document.createElement('canvas'), {width: 800, height: 760});
      const ink = layer.getContext('2d');
      // One common crop retains each frame's small handwritten differences.
      ink.drawImage(frame, 110, 190, 800, 760, 0, 0, 800, 760);
      ink.globalCompositeOperation = 'source-in';
      // Paint the full mask at once, so each band retains the original alpha.
      const fill = Object.assign(document.createElement('canvas'), {width: 800, height: 760});
      const paint = fill.getContext('2d');
      for (const [x, y, width, height, color] of [[0, 0, 800, 760, '#397568'], [200, 340, 400, 160, '#b7603c'], [0, 500, 800, 260, '#795373']]) {
        const tile = paperTile('title', color, {paper: 'mulberry', relief: .055, keep: .4, split: 12});
        paint.fillStyle = tile ? paint.createPattern(tile.canvas, 'repeat') : color;
        paint.fillRect(x, y, width, height);
      }
      ink.drawImage(fill, 0, 0);
      return layer;
    });
    draw(current);
  }
  function draw(index) {
    current = index;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(coloured[index], 0, 0);
    canvas.dataset.frame = String(index + 1);
  }
  bake();
  heading.classList.add('handwritten-ready');
  loadPaper('mulberry');
  onPapersArrived(() => { if (!panel.hidden) bake(); });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sequence = [0, 1, 2, 1], start = performance.now();
  function tick(now) {
    if (panel.hidden) return;
    const index = reduced.matches ? 0 : sequence[Math.floor(Math.max(0, now - start) / 240) % sequence.length];
    if (index !== current) draw(index);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
