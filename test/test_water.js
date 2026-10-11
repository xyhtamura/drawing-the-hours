import assert from 'node:assert/strict';
import {waterAt, waterZones} from '../between-banks/water.js';
import {Aquarium} from '../between-banks/simulation.js';
import {LEVELS} from '../between-banks/levels.js';
import {StringGesture} from '../src/string.js';

const current = {type:'current',x:300,y:300,rx:100,ry:100,angle:0,strength:20};
assert.deepEqual(waterAt(300,300,[current]),{vx:20,vy:0,drag:1});
assert.deepEqual(waterAt(400,300,[current]),{vx:0,vy:0,drag:1});
const calm = {...current,type:'calm'};
assert.ok(Math.abs(waterAt(300,300,[calm]).drag-.45)<1e-12);
assert.ok(waterAt(300,300,[current,calm]).vx<20,'A calm pocket shelters fish from overlapping flow');
const eddy = {...current,type:'eddy'};
assert.equal(waterAt(300,300,[eddy]).vx,0);
assert.equal(waterAt(300,300,[eddy]).vy,0);
assert.ok(waterAt(350,300,[eddy]).vy>0);
assert.ok(waterAt(350,300,[{...eddy,strength:-20}]).vy<0,'Opposite eddies turn in opposite directions');

function fixture(water, kind='ricefish') {
  const game = new Aquarium(960,640,()=>.5);
  game.load(kind==='goby'?1:0); game.mode='play'; game.started=true;
  game.level = {...game.level,water};
  const fish=game.fish.find(f=>f.kind===kind);
  Object.assign(fish,{x:480,y:298,heading:0,targetHeading:0,phase:0,restTime:99});
  return {game,fish};
}
const force = [{type:'current',x:.5,y:.4,rx:.3,ry:.4,angle:0,strength:80}];
const carried=fixture(force),plain=fixture([]);
carried.game.update(.04);plain.game.update(.04);
assert.ok(carried.fish.x>plain.fish.x,'Flow adds displacement to real swimming');
assert.equal(carried.game.elapsed,plain.game.elapsed,'Conditions do not change the bubble timer');
const slowed=fixture([{...force[0],type:'calm'}]),free=fixture([]);
slowed.game.update(.04);free.game.update(.04);
assert.ok(slowed.fish.x<free.fish.x,'A calm pocket slows real swimming');
const goby=fixture(force,'goby');goby.game.update(.04);
assert.equal(goby.fish.x,480);assert.equal(goby.fish.y,298,'Resting gobies remain attached to stones');
for (const state of ['bead','departing']) {
  const a=fixture(force),b=fixture([]);
  for(const value of [a,b]) {if(state==='bead')value.fish.isBead=true;else value.fish.state='departing';}
  a.game.update(.04);b.game.update(.04);
  assert.equal(a.fish.x,b.fish.x,`${state} fish are not displaced by water`);
}
const blocked=fixture([{...force[0],strength:1000}]);blocked.fish.x=465;
const cord=new StringGesture({x:480,y:200});cord.sample({x:480,y:500},[]);
blocked.game.update(.04,cord);
assert.ok(blocked.fish.x<=480-blocked.fish.radius+.1,'Current cannot push a fish through a held cord');
const snapshot=JSON.stringify(carried.game.fish);const time=carried.game.time;
carried.game.mode='paused';carried.game.update(.04);
assert.equal(carried.game.time,time);assert.equal(JSON.stringify(carried.game.fish),snapshot);
for(const [width,height] of [[960,640],[640,960]]) for(const level of LEVELS) {
  const zones=waterZones(level,width,height,180);
  assert.ok(zones.length);
  for(const zone of zones) {
    assert.ok(zone.x>0&&zone.x<width&&zone.y>180&&zone.y<height-60);
    const flow=waterAt(zone.x,zone.y,zones);
    assert.ok(Object.values(flow).every(Number.isFinite),'Fields stay finite in both orientations');
  }
}
console.log('Water: currents, calm pools, opposite eddies, anchored gobies, beads, departures, timer, pause, cord containment, and both orientations passed.');
