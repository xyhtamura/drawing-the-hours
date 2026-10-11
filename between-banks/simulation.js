import {LEVELS, SPECIES, recipeSize} from './levels.js';
import {constrainToWalls} from '../src/string.js';
import {strokeDisruption} from './rules.js';
import {waterAt, waterZones} from './water.js';

/** Soft leaf shade for the top-view stream scenes. */
export function shadePatches(width, height, time) {
  return [0, 1, 2].map(i => ({x: width * (.22 + i * .28) + Math.sin(time * .08 + i) * 18,
    y: height * (.38 + (i % 2) * .26), rx: width * .19, ry: height * .14}));
}
export function shadeAt(x, y, width, height, time) {
  return Math.max(...shadePatches(width, height, time).map(p => Math.max(0, 1 - Math.hypot((x - p.x) / p.rx, (y - p.y) / p.ry))));
}

export class Aquarium {
  constructor(width, height, random = Math.random) {
    this.width = width; this.height = height; this.top = height > width ? 180 : 110; this.random = random;
    this.load(0);
  }
  load(index) {
    this.index = index; this.level = LEVELS[index]; this.time = 0; this.elapsed = 0;
    this.top = this.height > this.width ? (Object.keys(this.level.goals).length > 2 ? 240 : 180) : 110;
    this.started = false; this.mode = 'ready'; this.practice = false;
    this.fish = []; this.progress = Object.fromEntries(Object.keys(this.level.goals).map(k => [k, 0]));
    this.rocks = this.level.rocks ? [0,1,2,5,4,3].map(i => ({x: this.width * (.20 + i % 3 * .30),
      y: this.top + (this.height - this.top - 80) * (i < 3 ? .35 : .72), radius: 25 + i % 2 * 4})) : [];
    this.leafClumps = this.level.leaves ? [.30, .70].map((x,i) => ({x: this.width*x,
      y: this.top+(this.height-this.top-70)*(.43+i*.27)})) : [];
    this.leafDisks = this.leafClumps.flatMap(p => Array.from({length:7},(_,i) => ({
      x:p.x+(i ? Math.cos(i*Math.PI/3)*30 : 0), y:p.y+(i ? Math.sin(i*Math.PI/3)*30 : 0), radius:22, angle:i*.9})));
    this.leafWalls = this.leafDisks.map(p => ({p1:p,p2:p}));
    this.beetles = Array.from({length:this.level.beetles ?? 0},(_,i) => ({
      x:this.width*(.72-i*.42), y:this.top+(this.height-this.top-70)*(.25+i*.48),
      radius:17, heading:i*2.3+.7, targetHeading:i*2.3+.7, clock:0, turnTime:1.4+i, state:'roaming', type:'insect'}));
    this.bubbles = []; this.bubbleWait = 1.5;
    for (const [kind, count] of Object.entries(this.level.population)) {
      const batch = recipeSize(this.level, kind);
      for (let i = 0; i < count; i += batch) {
        const x = 100 + this.random() * (this.width - 200), y = this.top + 40 + this.random() * (this.height - this.top - 150);
        for (let slot = 0; slot < batch && i + slot < count; slot++) this.spawn(kind, x + (slot - .5) * 48, y + slot * 12);
      }
    }
  }
  spawn(kind, x, y) {
    const heading = this.random() * Math.PI * 2;
    let school = null, slot = 0, rock = null;
    if (kind === 'goby' && this.rocks.length) {
      rock = this.fish.filter(f => f.kind === 'goby').length % this.rocks.length;
      x = this.rocks[rock].x; y = this.rocks[rock].y;
    }
    const capacities = this.schoolCapacities(kind);
    if (capacities.length) {
      school = capacities.findIndex((capacity,i) => this.fish.filter(f=>f.kind===kind&&f.school===i).length < capacity);
      if (school < 0) school = 0;
      slot = Array.from({length:capacities[school]},(_,i)=>i).find(i=>!this.fish.some(f=>f.kind===kind&&f.school===school&&f.schoolSlot===i)) ?? 0;
      const pose = this.schoolPose(school,kind), angle=this.level.shoals?slot*2.399:slot*Math.PI*2/capacities[school];
      const spread=this.level.shoals?pose.spread*(.4+.6*Math.sqrt((slot+1)/capacities[school])):32;
      x=pose.x+Math.cos(angle)*spread; y=pose.y+Math.sin(angle)*spread;
    }
    x ??= 80 + this.random() * (this.width - 160); y ??= this.top + 20 + this.random() * (this.height - this.top - 100);
    const blocked = (cx,cy) => this.leafDisks.some(p=>Math.hypot(cx-p.x,cy-p.y)<SPECIES[kind].radius+p.radius+8);
    for(let attempt=0;attempt<80&&blocked(x,y);attempt++) {
      x=70+this.random()*(this.width-140); y=this.top+20+this.random()*(this.height-this.top-90);
    }
    if(blocked(x,y)) {
      const clear=[];
      for(let cy=this.top+30;cy<this.height-60;cy+=48) for(let cx=60;cx<this.width-60;cx+=48) if(!blocked(cx,cy))clear.push({x:cx,y:cy});
      if(!clear.length)throw Error('No clear fish spawn position.');
      ({x,y}=clear[this.fish.length%clear.length]);
    }
    this.fish.push({kind, x, y, heading, targetHeading: heading, school, schoolSlot: slot, rock,
      resting: kind === 'goby', restTime: .7 + this.random() * 1.5, turnTime: 2 + this.random() * 3,
      radius: SPECIES[kind].radius, type: 'insect', state: 'roaming', phase: this.random() * Math.PI * 2,
      motionClock: this.random() * 2.6, departure: 0, isBead: false});
  }
  schoolCapacities(kind) {
    return this.level.shoals?.[kind] ?? (kind==='barb' ? Array.from({length:Math.ceil(this.level.population.barb/3)},()=>3) : []);
  }
  schoolPose(index, kind = 'barb') {
    if(this.level.shoals) {
      const phase=index*2.1+(kind==='ricefish'?2:0);
      return {x:this.width*(kind==='ricefish'?.66:.27+index*.46)+Math.sin(this.time*.15+phase)*25,
        y:this.top+(this.height-this.top-90)*(kind==='ricefish'?.22:.46+index*.22)+Math.sin(this.time*.21+phase)*24,
        spread:38+(1+Math.sin(this.time*.34+phase))*15};
    }
    const phase = index * 2.1;
    return {x: this.width * (.20 + index * .30) + Math.sin(this.time * .18 + phase) * this.width * .045,
      y: this.top + (this.height - this.top - 70) * (.35 + index % 2 * .25) + Math.sin(this.time * .23 + phase) * 30,
      spread: 26 + (1 + Math.sin(this.time * .38 + phase)) * 18};
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
    const zones = waterZones(this.level, this.width, this.height, this.top);
    for(const beetle of this.beetles) {
      beetle.from={x:beetle.x,y:beetle.y}; beetle.clock+=dt; beetle.turnTime-=dt;
      if(beetle.turnTime<=0) {beetle.targetHeading+=(this.random()<.5?-1:1)*(1+this.random()*1.3);beetle.turnTime=1.5+this.random()*2;}
      const delta=Math.atan2(Math.sin(beetle.targetHeading-beetle.heading),Math.cos(beetle.targetHeading-beetle.heading));
      beetle.heading+=delta*Math.min(1,dt*7);
      const speed=beetle.clock%2.5<1.7?68:9;
      beetle.x+=Math.cos(beetle.heading)*speed*dt;beetle.y+=Math.sin(beetle.heading)*speed*dt;
      if(beetle.x<48||beetle.x>this.width-48){beetle.heading=Math.PI-beetle.heading;beetle.targetHeading=beetle.heading;}
      if(beetle.y<this.top||beetle.y>this.height-48){beetle.heading=-beetle.heading;beetle.targetHeading=beetle.heading;}
      beetle.x=Math.max(48,Math.min(this.width-48,beetle.x));beetle.y=Math.max(this.top,Math.min(this.height-48,beetle.y));
      beetle.radius+=22;constrainToWalls(beetle,beetle.from,this.leafWalls,{width:this.width,height:this.height},dt);beetle.radius-=22;
    }
    if(this.level.bubbles) {
      this.bubbleWait-=dt;
      if(this.bubbleWait<=0) {this.bubbles.push({x:90+this.random()*(this.width-180),y:this.top+70+this.random()*(this.height-this.top-150),age:0,radius:3});this.bubbleWait=3.5+this.random()*2;}
      for(const bubble of this.bubbles){bubble.age+=dt;bubble.radius=3+bubble.age*4;bubble.y-=10*dt;bubble.x+=Math.sin(this.time+bubble.age)*3*dt;}
      this.bubbles=this.bubbles.filter(b=>b.age<3.2);
    }
    const disruption=gesture ? strokeDisruption(gesture.points,this.leafDisks,this.beetles,true) : null;

    for (const f of this.fish) {
      if (f.state === 'departing') {
        f.departure += dt; f.x += Math.cos(f.heading) * 190 * dt; f.y += Math.sin(f.heading) * 190 * dt;
        continue;
      }
      const from = {x: f.x, y: f.y};
      f.motionClock += dt;
      let dart = false, speed = 26;
      if (f.kind === 'goby') {
        if (f.resting) {
          f.restTime -= dt; speed = 0;
          if (f.restTime <= 0) {f.resting = false; f.rock = (f.rock + 1) % this.rocks.length;}
        }
        if (!f.resting) {
          const target = this.rocks[f.rock], dx = target.x - f.x, dy = target.y - f.y;
          if (Math.hypot(dx, dy) < 7) {f.resting = true; f.restTime = 1.1 + this.random() * 1.4; speed = 0;}
          else {f.targetHeading = Math.atan2(dy, dx); dart = true; speed = Math.min(158, Math.hypot(dx, dy) * 5);}
        }
      }
      if (f.school !== null) {
        const pose = this.schoolPose(f.school,f.kind), capacity=this.schoolCapacities(f.kind)[f.school];
        const angle = (this.level.shoals ? f.schoolSlot*2.399+Math.sin(this.time*.5+f.schoolSlot)*.16 : f.schoolSlot*Math.PI*2/capacity) + this.time*.16;
        const spread=pose.spread*(this.level.shoals ? .4+.6*Math.sqrt((f.schoolSlot+1)/capacity) : 1);
        const dx = pose.x + Math.cos(angle) * spread - f.x, dy = pose.y + Math.sin(angle) * spread - f.y;
        f.targetHeading = Math.atan2(dy, dx); speed = Math.min(42, Math.hypot(dx, dy) * 1.8);
      }
      if (f.kind === 'halfbeak') {
        speed = 38; f.turnTime -= dt;
        if (f.turnTime <= 0) {f.targetHeading += (this.random() < .5 ? -1 : 1) * (1.2 + this.random() * .6); f.turnTime = 3 + this.random() * 3;}
      }
      if (f.kind === 'ricefish' && f.school === null) f.targetHeading += Math.sin(this.time * .8 + f.phase) * dt * .5;
      const delta = Math.atan2(Math.sin(f.targetHeading - f.heading), Math.cos(f.targetHeading - f.heading));
      f.heading += delta * Math.min(1, dt * (dart ? 12 : f.kind === 'barb' ? 5 : f.kind === 'halfbeak' ? 10 : 2));
      const water = f.isBead || (f.kind === 'goby' && f.resting) ? {vx:0,vy:0,drag:1} : waterAt(f.x, f.y, zones);
      const coupling = f.kind === 'goby' ? .25 : f.kind === 'barb' ? .65 : f.kind === 'halfbeak' ? .7 : 1;
      f.x += (Math.cos(f.heading) * speed * water.drag + water.vx * coupling) * dt;
      f.y += (Math.sin(f.heading) * speed * water.drag + water.vy * coupling) * dt;
      if (f.x < 48 || f.x > this.width - 48) {f.heading = Math.PI - f.heading; f.targetHeading = f.heading;}
      if (f.y < this.top || f.y > this.height - 48) {f.heading = -f.heading; f.targetHeading = f.heading;}
      f.x = Math.max(48, Math.min(this.width - 48, f.x)); f.y = Math.max(this.top, Math.min(this.height - 48, f.y));
      // Bubbles gently displace roaming fish; walls still constrain the displaced path.
      if(!f.isBead) for(const bubble of this.bubbles) {
        const dx=f.x-bubble.x,dy=f.y-bubble.y,d=Math.hypot(dx,dy),reach=48+bubble.radius;
        if(d<reach) {const push=14*(1-d/reach)*dt,angle=d>.01?Math.atan2(dy,dx):f.phase;f.x+=Math.cos(angle)*push;f.y+=Math.sin(angle)*push;}
      }
      f.x=Math.max(48,Math.min(this.width-48,f.x));f.y=Math.max(this.top,Math.min(this.height-48,f.y));
      const radius = f.radius; f.radius += 22;
      constrainToWalls(f, from, this.leafWalls, {width: this.width, height: this.height}, dt); f.radius = radius;
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
    return disruption;
  }
}
