import {LEVELS, SPECIES} from './levels.js';
import {constrainToWalls} from '../src/string.js';

export class Aquarium {
  constructor(width, height, random = Math.random) {
    this.width = width; this.height = height; this.top = height > width ? 180 : 110; this.random = random;
    this.load(0);
  }
  load(index) {
    this.index = index; this.level = LEVELS[index]; this.time = 0; this.elapsed = 0;
    this.started = false; this.mode = 'ready'; this.practice = false;
    this.fish = []; this.progress = Object.fromEntries(Object.keys(this.level.goals).map(k => [k, 0]));
    for (const [kind, count] of Object.entries(this.level.population)) {
      for (let i = 0; i < count; i += 2) {
        const x = 100 + this.random() * (this.width - 200), y = this.top + 40 + this.random() * (this.height - this.top - 150);
        this.spawn(kind, x - 24, y); this.spawn(kind, x + 24, y + 12);
      }
    }
  }
  spawn(kind, x, y) {
    const heading = this.random() * Math.PI * 2;
    this.fish.push({kind, x: x ?? 80 + this.random() * (this.width - 160),
      y: y ?? this.top + 20 + this.random() * (this.height - this.top - 100), heading, targetHeading: heading,
      radius: SPECIES[kind].radius, type: 'insect', state: 'roaming', phase: this.random() * Math.PI * 2,
      motionClock: this.random() * 2.6, departure: 0, isBead: false});
  }
  get remaining() {return Math.max(0, 1 - this.elapsed / this.level.duration);}
  get complete() {return Object.entries(this.level.goals).every(([k, n]) => this.progress[k] >= n);}
  accept(result) {
    for (const group of result.groups) {
      this.progress[group[0].kind] = Math.min(this.level.goals[group[0].kind], this.progress[group[0].kind] + 1);
    }
    for (const f of result.released) {
      f.state = 'departing'; f.departure = 0;
      // Each pair leaves along its existing heading, without a collection point.
    }
    if (this.complete) this.mode = 'settling';
  }
  update(dt, gesture = null) {
    if (!['play', 'settling'].includes(this.mode)) return;
    dt = Math.min(dt, .04); this.time += dt;
    if (this.mode === 'play' && this.started && !this.practice) this.elapsed += dt;
    const walls = gesture?.wallSegments ?? [];
    for (const f of this.fish) {
      if (f.state === 'departing') {
        f.departure += dt; f.x += Math.cos(f.heading) * 190 * dt; f.y += Math.sin(f.heading) * 190 * dt;
        continue;
      }
      const from = {x: f.x, y: f.y};
      f.motionClock += dt;
      const dart = f.kind === 'ricefish' && f.motionClock % 2.6 > 1.85;
      const speed = f.kind === 'ricefish' ? (dart ? 158 : 7) : 26;
      if (f.kind === 'ricefish' && Math.floor(f.motionClock / 2.6) !== Math.floor((f.motionClock - dt) / 2.6)) {
        f.targetHeading += (this.random() - .5) * 2.7;
      }
      if (f.kind === 'guppy') f.targetHeading += Math.sin(this.time * .8 + f.phase) * dt * .5;
      const delta = Math.atan2(Math.sin(f.targetHeading - f.heading), Math.cos(f.targetHeading - f.heading));
      f.heading += delta * Math.min(1, dt * (dart ? 9 : 2));
      f.x += Math.cos(f.heading) * speed * dt; f.y += Math.sin(f.heading) * speed * dt;
      if (f.x < 48 || f.x > this.width - 48) {f.heading = Math.PI - f.heading; f.targetHeading = f.heading;}
      if (f.y < this.top || f.y > this.height - 48) {f.heading = -f.heading; f.targetHeading = f.heading;}
      f.x = Math.max(48, Math.min(this.width - 48, f.x)); f.y = Math.max(this.top, Math.min(this.height - 48, f.y));
      constrainToWalls(f, from, walls, {width: this.width, height: this.height}, dt);
    }
    gesture?.updateBeads(dt, {width: this.width, height: this.height});
    this.fish = this.fish.filter(f => f.state !== 'departing' || f.departure < 1.5);
    if (this.mode === 'settling') {
      if (!this.fish.some(f => f.state === 'departing')) this.mode = 'complete';
    } else {
      for (const [kind, count] of Object.entries(this.level.population)) {
        while (this.fish.filter(f => f.kind === kind).length < count) this.spawn(kind);
      }
      if (this.remaining <= 0) {gesture?.releaseBeads(); this.mode = 'failed';}
    }
  }
}
