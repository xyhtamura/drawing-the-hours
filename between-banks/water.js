/** Authored movement fields, rather than a fluid or habitat simulation. */
export function waterZones(level, width, height, top) {
  const depth = height - top - 60;
  return (level.water ?? []).map(zone => ({...zone, x: zone.x * width,
    y: top + zone.y * depth, rx: zone.rx * width, ry: zone.ry * depth}));
}

export function waterAt(x, y, zones) {
  let vx = 0, vy = 0, drag = 1;
  for (const zone of zones) {
    const dx = (x - zone.x) / zone.rx, dy = (y - zone.y) / zone.ry;
    const radius = Math.hypot(dx, dy);
    if (radius >= 1) continue;
    const weight = (1 - radius * radius) ** 2;
    if (zone.type === 'calm') drag = Math.min(drag, 1 - .55 * weight);
    else if (zone.type === 'current') {
      vx += Math.cos(zone.angle) * zone.strength * weight;
      vy += Math.sin(zone.angle) * zone.strength * weight;
    } else if (zone.type === 'eddy') {
      // A smooth tangential field is zero at the centre and fades at the edge.
      vx -= dy * zone.strength * weight;
      vy += dx * zone.strength * weight;
    }
  }
  return {vx: vx * drag, vy: vy * drag, drag};
}

export function drawWaterConditions(ctx, zones, time, reduced) {
  ctx.save();
  for (const zone of zones) {
    ctx.save(); ctx.translate(zone.x, zone.y); ctx.scale(zone.rx, zone.ry);
    const wash = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    wash.addColorStop(0, zone.type === 'calm' ? '#fff5da30' : '#5a92941a');
    wash.addColorStop(1, '#fff5da00');
    ctx.fillStyle = wash; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    const t = reduced ? 0 : time;
    for (let i = 0; i < 22; i++) {
      let dx, dy;
      if (zone.type === 'eddy') {
        const r = .25 + (i % 5) * .13;
        const a = i * 2.399 + t * zone.strength * (1 - r * r) ** 2 / Math.max(zone.rx, zone.ry);
        dx = Math.cos(a) * r; dy = Math.sin(a) * r;
      } else {
        const advance = zone.type === 'current' ? t * zone.strength : 0;
        dx = ((i * .618 + advance * Math.cos(zone.angle ?? 0) / (zone.rx * 2)) % 1 + 1) % 1 * 2 - 1;
        dy = ((i * .414 + advance * Math.sin(zone.angle ?? 0) / (zone.ry * 2)) % 1 + 1) % 1 * 2 - 1;
      }
      const fade = Math.max(0, 1 - Math.hypot(dx, dy));
      const x = zone.x + dx * zone.rx, y = zone.y + dy * zone.ry;
      const flow = waterAt(x, y, [zone]);
      ctx.globalAlpha = fade * .65; ctx.fillStyle = '#fff7dd';
      ctx.beginPath(); ctx.ellipse(x, y, zone.type === 'calm' ? 1.2 : 3, .8,
        Math.atan2(flow.vy, flow.vx), 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}
