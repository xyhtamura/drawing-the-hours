const CORD_COLORS = [[190, 86, 68], [204, 147, 63], [95, 143, 91], [57, 133, 143], [111, 93, 151], [180, 99, 136]];

/** Shade the mask as round cord, with coloured lengths and fine twisted fibres. */
function cordPixels(mask) {
  const {width, height, data} = mask;
  const distance = new Float32Array(width * height);
  for (let i = 0; i < distance.length; i++) distance[i] = data[i * 4 + 3] > 100 ? 1000 : 0;
  // Two chamfer passes locate each stroke's edge without changing the drawing.
  for (let y = 1; y < height; y++) for (let x = 1; x < width; x++) {
    const i = y * width + x;
    distance[i] = Math.min(distance[i], distance[i - 1] + 1, distance[i - width] + 1, distance[i - width - 1] + Math.SQRT2);
  }
  for (let y = height - 2; y >= 0; y--) for (let x = width - 2; x >= 0; x--) {
    const i = y * width + x;
    distance[i] = Math.min(distance[i], distance[i + 1] + 1, distance[i + width] + 1, distance[i + width + 1] + Math.SQRT2);
  }
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x, p = i * 4;
    if (!data[p + 3]) continue;
    const phase = (x + y * .42) / 115;
    const step = Math.floor(phase), blend = phase - step;
    const a = CORD_COLORS[step % CORD_COLORS.length], b = CORD_COLORS[(step + 1) % CORD_COLORS.length];
    const nx = (distance[i - 1] - distance[i + 1]) / 2;
    const ny = (distance[i - width] - distance[i + width]) / 2;
    const edge = Math.max(0, 1 - distance[i] / 5);
    const light = .93 + (-nx * .5 - ny * .7) * edge * .3;
    const twist = Math.sin(x * 1.15 + y * .9) * .075;
    const fibre = Math.sin(x * 12.9898 + y * 78.233) * .025;
    for (let c = 0; c < 3; c++) {
      const color = a[c] + (b[c] - a[c]) * blend;
      data[p + c] = Math.max(0, Math.min(255, color * (light + twist + fibre) + (1 - edge) * 15));
    }
  }
  return mask;
}

/** Xyh's three white lettering frames become multicoloured cord masks. */
export async function createHandwrittenTitle(canvas, heading, panel) {
  const frames = await Promise.all([1, 2, 3].map(n => new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = new URL(`../assets/title/drawinghand0${n}.webp`, import.meta.url).href;
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
      // Exports share one crop, retaining the handwritten frame differences.
      ink.drawImage(frame, 0, 0);
      ink.putImageData(cordPixels(ink.getImageData(0, 0, 800, 760)), 0, 0);
      const lifted = Object.assign(document.createElement('canvas'), {width: 800, height: 760});
      const cord = lifted.getContext('2d');
      cord.shadowColor = '#3a27194d'; cord.shadowBlur = 3; cord.shadowOffsetX = 1; cord.shadowOffsetY = 3;
      cord.drawImage(layer, 0, 0);
      return lifted;
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
