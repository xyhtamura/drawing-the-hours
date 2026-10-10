import assert from 'node:assert/strict';
import {judgeStroke, strokeDisruption, CORD_LIMIT} from '../between-banks/rules.js';
import {Aquarium, shadePatches, shadeAt} from '../between-banks/simulation.js';
import {StringGesture} from '../src/string.js';
import {LEVELS} from '../between-banks/levels.js';
import {polylineTouchesDisk} from '../src/geometry.js';

const loop = [{x:60,y:60},{x:200,y:60},{x:200,y:200},{x:60,y:200},{x:60,y:60}];
const figure = [{x:250,y:250},{x:100,y:100},{x:60,y:250},{x:100,y:400},{x:250,y:250},{x:400,y:100},{x:440,y:250},{x:400,y:400},{x:250,y:250}];
const fish = (kind='ricefish',x=120,y=120,state='roaming') => ({kind,x,y,state});
assert.equal(CORD_LIMIT,1300);
assert.equal(LEVELS.length,8);
assert.equal(judgeStroke(loop,[fish(),fish('ricefish',150)]).released.length,2);
assert.match(judgeStroke(loop,[fish()]).error,/exactly two/);
assert.match(judgeStroke(loop,[fish(),fish('goby',150)]).error,/own pocket/);
assert.match(judgeStroke(loop,[fish(),fish('ricefish',150),fish('ricefish',160)]).error,/exactly two/);
assert.match(judgeStroke(loop,[]).error,/water/);
assert.match(judgeStroke(loop,[fish(),fish('ricefish',150)],true).error,/passed through/);
assert.match(judgeStroke(loop.slice(0,3),[fish(),fish('ricefish',150)]).error,/close/);
assert.match(judgeStroke([{x:0,y:0},{x:900,y:0},{x:900,y:900}],[]).error,/snapped/);
assert.match(judgeStroke(loop,[fish('ricefish',120,120,'departing'),fish()]).error,/exactly two/);
const smallFigure=figure.map(p=>({x:p.x*.75,y:p.y*.75}));
assert.equal(judgeStroke(smallFigure,[fish('ricefish',82.5,180),fish('ricefish',105,180),fish('goby',270,180),fish('goby',292.5,180)]).groups.length,2);

const game = new Aquarium(960,640,()=>.5);
game.mode='play';game.update(.04);assert.equal(game.elapsed,0,'Clock waits for first gesture');
game.started=true;game.update(.04);assert.equal(game.elapsed,.04);
game.mode='paused';const snapshot=JSON.stringify(game.fish);game.update(.04);assert.equal(game.elapsed,.04);assert.equal(JSON.stringify(game.fish),snapshot);
game.mode='play';game.practice=true;game.update(.04);assert.equal(game.elapsed,.04);
game.practice=false;game.elapsed=game.level.duration-.01;game.update(.04);assert.equal(game.mode,'failed');

game.load(0);game.mode='play';
const pair=game.fish.slice(0,2), result={groups:[pair],released:pair};game.accept(result);
assert.equal(game.progress.ricefish,1);assert.equal(pair[0].state,'departing');
const oldX=pair[0].x;game.update(.04);assert.notEqual(pair[0].x,oldX,'Released fish swim along their heading');
for(let i=0;i<40;i++)game.update(.04);
assert.equal(game.fish.length,10,'Population replenishes');assert.ok(!game.fish.includes(pair[0]));
game.progress.ricefish=2;const finalPair=game.fish.slice(0,2);game.accept({groups:[finalPair],released:finalPair});
assert.equal(game.mode,'settling');assert.ok(finalPair.every(f=>f.state==='departing'));
for(let i=0;i<40;i++)game.update(.04);assert.equal(game.mode,'complete');

game.load(1);game.mode='play';
const slowFish=game.fish.find(f=>f.kind==='goby');
Object.assign(slowFish,{x:300,y:240,heading:0,targetHeading:0,resting:true,restTime:.2});
game.update(.04);const pauseDistance=slowFish.x-300;
assert.equal(pauseDistance,0,'A resting goby holds its position');
game.rocks[0]={x:500,y:240,radius:25};
Object.assign(slowFish,{x:300,y:240,heading:0,targetHeading:0,resting:false,rock:0});
game.update(.04);assert.ok(slowFish.x-300>5,'A goby darts toward its next stone');
const dart=game.fish.find(f=>f.kind==='goby');Object.assign(dart,{x:120,y:240,heading:0,targetHeading:0,resting:false,rock:0});
const wall=new StringGesture({x:140,y:100});wall.sample({x:140,y:500},[]);
for(let i=0;i<5;i++)game.update(.04,wall);
assert.ok(dart.x<140-dart.radius,'Darting fish cannot tunnel through held cord');
const threaded=fish();Object.assign(threaded,{type:'insect',radius:10});
const stroke=new StringGesture({x:60,y:120});stroke.sample({x:170,y:120},[threaded]);
assert.equal(stroke.hasBeads,true);stroke.releaseBeads();assert.equal(threaded.state,'roaming');

const trio=[fish('barb',100,110),fish('barb',140,120),fish('barb',130,155)];
assert.equal(judgeStroke(loop,trio,false,LEVELS[2]).released.length,3);
assert.match(judgeStroke(loop,trio.slice(0,2),false,LEVELS[2]).error,/exactly 3/);
assert.match(judgeStroke(loop,[...trio,fish('ricefish')],false,LEVELS[2]).error,/own pocket/);
assert.equal(judgeStroke(loop,[fish(),fish('ricefish',150)],false,LEVELS[2]).groups.length,1);
const sortedSchool=judgeStroke(smallFigure,[fish('barb',82,175),fish('barb',104,180),fish('barb',112,200),fish('ricefish',270,180),fish('ricefish',292,180)],false,LEVELS[2]);
assert.equal(sortedSchool.groups.length,2);assert.equal(sortedSchool.released.length,5,'A figure eight sorts a three-fish school from a pair');
game.load(2);game.mode='play';
assert.equal(new Set(game.fish.filter(f=>f.kind==='barb').map(f=>f.school)).size,2);
let minSpread=Infinity,maxSpread=0;
for(let i=0;i<1400;i++) {
  game.update(.04);
  const members=game.fish.filter(f=>f.kind==='barb'&&f.school===0),centre=game.schoolPose(0);
  const spread=members.reduce((sum,f)=>sum+Math.hypot(f.x-centre.x,f.y-centre.y),0)/6;
  if(i>100){minSpread=Math.min(minSpread,spread);maxSpread=Math.max(maxSpread,spread);}
  assert.ok(members.every(f=>f.x>=48&&f.x<=912&&f.y>=game.top&&f.y<=592),'School stays in the playable field');
}
assert.ok(maxSpread-minSpread>20,'Actual schooling fish contract and spread');
const school=game.fish.filter(f=>f.kind==='barb'&&f.school===0);
game.accept({groups:[school],released:school});
for(let i=0;i<40;i++)game.update(.04);
assert.equal(game.fish.filter(f=>f.kind==='barb').length,13);
assert.equal(game.fish.filter(f=>f.kind==='barb'&&f.school===0).length,6,'Shoal replenishes into six slots');

assert.equal(game.fish.filter(f=>f.kind==='ricefish'&&f.school===0).length,6,'Ricefish also form a larger gathering');
for(const [width,height] of [[960,640],[640,960]]) {
  const leafGame=new Aquarium(width,height,()=>.5);leafGame.load(3);leafGame.mode='play';
  assert.equal(leafGame.leafClumps.length,2);assert.equal(leafGame.beetles.length,1);
  const clear=f=>leafGame.leafDisks.every(p=>Math.hypot(f.x-p.x,f.y-p.y)>=f.radius+p.radius-.6);
  assert.ok(leafGame.fish.every(clear),'Fish spawn clear of leaf clumps');
  const leaf=leafGame.leafDisks[0],cross=[{x:leaf.x-80,y:leaf.y},{x:leaf.x+80,y:leaf.y}];
  assert.match(strokeDisruption(cross,leafGame.leafDisks),/Leaves/);
  assert.match(judgeStroke(cross,[],false,LEVELS[3],leafGame.leafDisks).error,/Leaves/);
  const swimmer=leafGame.fish[0];Object.assign(swimmer,{x:leaf.x-80,y:leaf.y,heading:0,targetHeading:0});
  for(let i=0;i<100;i++)leafGame.update(.04);
  assert.ok(clear(swimmer),'Fish reflect before entering leaf clumps');
  const pair=leafGame.fish.slice(0,2);leafGame.accept({groups:[pair],released:pair});
  for(let i=0;i<40;i++)leafGame.update(.04);assert.ok(leafGame.fish.every(clear),'Replacements spawn clear of leaves');
}
const held=[{x:100,y:200},{x:400,y:200}],crossing={x:250,y:230,from:{x:250,y:170},radius:17};
assert.match(strokeDisruption(held,[],[crossing],true),/beetle/,'Swept beetle movement cuts an idle cord even if both ends clear it');
assert.equal(strokeDisruption(held,[],[crossing]),null);
assert.match(strokeDisruption([{x:250,y:230}],[],[crossing]),/beetle/,'Starting on a beetle cuts the cord');
const moving=new Aquarium(960,640,()=>.5);moving.load(4);moving.mode='play';
assert.equal(moving.beetles.length,2);
Object.assign(moving.beetles[0],{x:250,y:181,heading:Math.PI/2,targetHeading:Math.PI/2,clock:0,turnTime:5});
const heldCord=new StringGesture(held[0]);heldCord.sample(held[1],[]);
moving.update(.04,heldCord);assert.match(moving.update(.04,heldCord),/beetle/,'A moving beetle contacts a held cord');
const frozen=JSON.stringify({beetles:moving.beetles,bubbles:moving.bubbles});moving.mode='paused';moving.update(.04);assert.equal(JSON.stringify({beetles:moving.beetles,bubbles:moving.bubbles}),frozen);
const disturbed=new Aquarium(960,640,()=>.5),still=new Aquarium(960,640,()=>.5);
for(const g of [disturbed,still]){g.load(4);g.mode='play';g.started=true;g.fish=[g.fish.find(f=>f.kind==='ricefish')];Object.assign(g.fish[0],{x:400,y:300,heading:0,targetHeading:0});}
disturbed.bubbles=[{x:380,y:300,age:1,radius:7}];disturbed.update(.04);still.update(.04);
assert.ok(disturbed.fish[0].x>still.fish[0].x,'Bubble mildly displaces a nearby fish');
assert.equal(disturbed.elapsed,still.elapsed,'World bubbles do not restore the countdown');
for(let i=0;i<300;i++)disturbed.update(.04);assert.ok(disturbed.bubbles.length<=2,'Expired bubbles are removed');
assert.ok(LEVELS.slice(5,7).every(l=>!l.beetles&&!l.leaves&&!l.bubbles&&!l.shoals),'Levels six and seven retain their previous mechanics');
const shade=shadePatches(960,640,0)[0];
assert.equal(shadeAt(shade.x,shade.y,960,640,0),1);
assert.equal(shadeAt(0,0,960,640,0),0);
assert.equal(judgeStroke(loop,[fish('halfbeak'),fish('halfbeak',150)],false,LEVELS[4]).released.length,2,'Halfbeaks can score outside shade');
game.load(4);game.mode='play';const halfbeak=game.fish.find(f=>f.kind==='halfbeak');
Object.assign(halfbeak,{x:300,y:300,heading:0,targetHeading:0,turnTime:.01});
game.update(.04);assert.ok(Math.abs(halfbeak.targetHeading)>1,'Halfbeaks turn sharply between glides');
const pairedKinds=[fish('ricefish',82,175),fish('ricefish',104,180),fish('goby',270,180),fish('goby',292,180)];
assert.equal(judgeStroke(smallFigure,pairedKinds,false,LEVELS[5]).groups.length,2);
assert.match(judgeStroke(loop,[fish(),fish('ricefish',150)],false,LEVELS[5]).error,/two pockets/);
assert.match(judgeStroke(smallFigure,pairedKinds.map(f=>({...f,kind:'ricefish'})),false,LEVELS[5]).error,/different kind/);
const schoolPair=[...trio.map(f=>({...f,x:f.x*.6+20,y:f.y*.4+130})),fish('halfbeak',270,180),fish('halfbeak',292,180)];
assert.equal(judgeStroke(smallFigure,schoolPair,false,LEVELS[6]).released.length,5);
assert.match(judgeStroke(smallFigure,schoolPair.slice(1),false,LEVELS[6]).error,/exactly 3/);
assert.equal(judgeStroke(loop,trio,false,LEVELS[7]).released.length,3);
for (const [width,height] of [[960,640],[640,960]]) for (const index of [2,3,4,5,6,7]) {
  const finalGame=new Aquarium(width,height,()=>.5);finalGame.load(index);finalGame.mode='play';
  for(let i=0;i<500;i++)finalGame.update(.04);
  assert.ok(finalGame.beetles.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&b.x>=48&&b.x<=width-48&&b.y>=finalGame.top&&b.y<=height-48),'Beetles remain finite and in bounds');
  assert.ok(finalGame.fish.every(f=>finalGame.leafDisks.every(p=>Math.hypot(f.x-p.x,f.y-p.y)>=f.radius+p.radius-.6)),'Fish remain clear of leaves after sustained movement');
  assert.ok(finalGame.fish.every(f=>Number.isFinite(f.x)&&Number.isFinite(f.y)&&f.x>=48&&f.x<=width-48&&f.y>=finalGame.top&&f.y<=height-48),'Final mixed populations remain finite and in bounds');
  for(const [kind,count] of Object.entries(finalGame.level.population)) assert.equal(finalGame.fish.filter(f=>f.kind===kind).length,count);
}
for(let index=0;index<LEVELS.length;index++) {
  game.load(index);game.mode='play';
  for(const [kind,count] of Object.entries(game.level.goals)) {
    const group=game.fish.filter(f=>f.kind===kind).slice(0,game.level.recipes?.[kind]??2);
    for(let i=0;i<count;i++)game.accept({groups:[group],released:group});
  }
  assert.equal(game.mode,'settling');for(let i=0;i<40;i++)game.update(.04);assert.equal(game.mode,'complete',`Level ${index+1} completes`);
}
console.log('Aquarium: recipes, purity, cord rules, clock, departures, schooling, replenishment, leaves, beetles, bubbles in both orientations, shade, and all eight completions passed.');
