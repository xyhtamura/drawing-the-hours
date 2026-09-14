/** Cached paper atrium, shared by Noon visits. All geometry is decorative. */
export function createNoonArt(width, height, pixelRatio = 1) {
  const canvas = document.createElement('canvas');
  const scale = Math.min(2, pixelRatio);
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, '#fff8e5'); wash.addColorStop(0.65, '#f3f3df'); wash.addColorStop(1, '#e4e9dd');
  ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height);
  // High glass panels: light and thin seams, not solid obstacles.
  ctx.strokeStyle = 'rgba(126,158,148,.19)'; ctx.lineWidth = 1;
  for (let x = 35; x < width; x += 145) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 46, height); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,.30)';
  ctx.beginPath(); ctx.moveTo(width * .42, 0); ctx.lineTo(width * .70, 0);
  ctx.lineTo(width * .94, height); ctx.lineTo(width * .72, height); ctx.fill();
  // Pale paving and planter lips frame a large, uncluttered center.
  ctx.fillStyle = '#e5dbce'; ctx.fillRect(0, height - 30, width, 30);
  ctx.fillStyle = '#c7b4a4'; ctx.fillRect(0, height - 31, width, 2);
  ctx.strokeStyle = '#cabcad';
  for (let x = 88; x < width; x += 130) {
    ctx.beginPath(); ctx.moveTo(x, height - 29); ctx.lineTo(x - 5, height); ctx.stroke();
  }
  for (const side of [0, 1]) {
    const x = side ? width - 7 : 7;
    ctx.fillStyle = '#d5af9d'; ctx.fillRect(side ? width - 17 : 0, height * .54, 17, height * .46 - 31);
    for (let i = 0; i < 9; i++) {
      const y = height * .52 + i * Math.max(12, height * .038);
      const direction = side ? -1 : 1;
      ctx.strokeStyle = '#7c9675'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.quadraticCurveTo(x + direction * 17, y + 5, x + direction * 9, y - 10); ctx.stroke();
      ctx.fillStyle = i % 2 ? '#b4c69e' : '#91ad88';
      ctx.beginPath(); ctx.ellipse(x + direction * 11, y, 5, 11, direction * .7, 0, Math.PI * 2); ctx.fill();
      if (i % 3 === 0) {
        ctx.fillStyle = '#e7b5b4'; ctx.beginPath(); ctx.arc(x + direction * 10, y - 13, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  // One tiny lunch wrapper on the paving, outside the main drawing area.
  ctx.save(); ctx.translate(width * .23, height - 14); ctx.rotate(-.08);
  ctx.fillStyle = '#fff9ef'; ctx.fillRect(-18, -8, 36, 16);
  ctx.strokeStyle = '#d2baad'; ctx.strokeRect(-18, -8, 36, 16);
  ctx.fillStyle = '#dcb57e'; ctx.beginPath(); ctx.moveTo(-8, 5); ctx.lineTo(7, 5); ctx.lineTo(3, -6); ctx.fill();
  ctx.restore();
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
