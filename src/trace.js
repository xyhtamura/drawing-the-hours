import { getLengthBand } from './geometry.js';

const active = entity => entity.state !== 'harmonizing' && entity.state !== 'departing';
const snapshot = entities => new Map(entities.filter(active).map(entity =>
  [entity, { x: entity.x, y: entity.y, radius: entity.radius }]));

/** First contact of a moving pointer and moving disk, over one linear interval. */
export function sweptContact(p0, p1, e0, e1, radius) {
  const x = p0.x - e0.x, y = p0.y - e0.y;
  const dx = (p1.x - p0.x) - (e1.x - e0.x);
  const dy = (p1.y - p0.y) - (e1.y - e0.y);
  const c = x * x + y * y - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (a < 1e-12) return null;
  const b = 2 * (x * dx + y * dy);
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

/** Object identity reserves each living target once. No entity mutation until release. */
export class TraceGesture {
  constructor(point, entities, sequence = ['firefly', 'lacewing', 'firefly']) {
    this.sequence = [...sequence];
    this.point = { ...point };
    this.previous = snapshot(entities);
    this.contacts = [];
    this.fault = null;
    if ([...this.previous.values()].some(e => Math.hypot(point.x - e.x, point.y - e.y) <= e.radius)) {
      this.fault = 'Start in empty space, outside every target ring.';
    }
  }

  sample(point, entities) {
    if (this.fault) return;
    const current = snapshot(entities);
    const hits = [];
    for (const [entity, position] of current) {
      if (this.contacts.includes(entity)) continue;
      const before = this.previous.get(entity);
      // A new entrant has no trajectory before its appearance.
      const t = before ? sweptContact(this.point, point, before, position, position.radius)
        : (Math.hypot(point.x - position.x, point.y - position.y) <= position.radius ? 1 : null);
      if (t !== null) hits.push({ entity, t });
    }
    hits.sort((a, b) => a.t - b.t);
    for (let i = 0; i < hits.length; i++) {
      if (i + 1 < hits.length && Math.abs(hits[i + 1].t - hits[i].t) < 1e-7) {
        this.fault = 'Targets overlap. Release and try when they separate.';
        break;
      }
      const entity = hits[i].entity;
      if (entity.type === 'hazard') {
        this.fault = 'The trace touched a snail. Release and try again.';
        break;
      }
      if (this.contacts.length >= this.sequence.length) {
        this.fault = 'A fourth target was touched. Release after three different insects.';
        break;
      }
      const expected = this.sequence[this.contacts.length];
      if (entity.kind !== expected || !['butterfly', 'insect'].includes(entity.type)) {
        this.fault = `Expected a ${expected}. Release and start again.`;
        break;
      }
      this.contacts.push(entity);
    }
    this.point = { ...point };
    this.previous = current;
  }

  finish(length) {
    const message = this.fault || (this.contacts.length !== this.sequence.length
      ? 'Trace through firefly, lacewing, then another firefly before releasing.' : null);
    if (message) return { valid: false, mode: 'trace', message };
    const band = getLengthBand(length);
    const multiplier = band.name === 'Petite' ? 1 : band.name === 'Balanced' ? 1.25 : 1.5;
    return { valid: true, mode: 'trace', recipeType: 'ORDERED_TRACE', title: 'Ordered Trace',
      finalScore: Math.round(240 * multiplier), band: band.name,
      harmonizedEntities: [...this.contacts] };
  }
}
