// Runs inside the test iframe so imports resolve to the actual mounted runtime.
import {game,load} from '../aquarium/aquarium.js';
const out=parent.document.getElementById('result'),wait=ms=>new Promise(r=>setTimeout(r,ms));
const checks=[];
async function until(predicate) {
  const deadline=performance.now()+10000;
  while(!predicate()) {if(performance.now()>deadline)throw Error('Timed out waiting for the mounted game');await wait(40);}
}
function check(ok,label){if(!ok)throw Error(label);checks.push(label);out.textContent=checks.join('\n');}
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
const canvas=document.getElementById('field');
function fixture(kind='ricefish', count=2, x=260, y=260) {
  game.fish=[];
  for(let i=0;i<count;i++) {game.spawn(kind);Object.assign(game.fish.at(-1),{x:x+i*22,y:y+i%2*12});}
}
function draw(points) {
  const box=canvas.getBoundingClientRect();
  const event=(type,p)=>canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,button:0,clientX:box.left+p.x*box.width/canvas.width,clientY:box.top+p.y*box.height/canvas.height}));
  event('pointerdown',points[0]);for(const p of points.slice(1,-1))event('pointermove',p);event('pointerup',points.at(-1));
}
const loop=[{x:205,y:205},{x:360,y:205},{x:360,y:325},{x:205,y:325},{x:205,y:205}];
try {
  canvas.setPointerCapture=()=>{}; // Synthetic pointer events do not have native capture.
  load(0);check(button('Begin')!==undefined,'First level ready card rendered');
  button('Begin').click();check(document.getElementById('overlay').hidden,'Begin starts the mounted game');
  await wait(200);check(game.elapsed===0,'Bubble waits for the first gesture');
  fixture();draw(loop.slice(0,3));check(game.progress.ricefish===0&&document.getElementById('status').textContent.includes('close'),'Open stroke is rejected through pointer handlers');
  fixture();draw(loop);check(game.progress.ricefish===1&&game.fish.every(f=>f.state==='departing'),'Matching pair swims away without a refuge');
  await until(()=>game.fish.length===10&&game.fish.every(f=>f.state==='roaming'));check(game.fish.length===10&&game.fish.every(f=>f.state==='roaming'),'Departures replenish the real population');
  document.getElementById('pause').click();const elapsed=game.elapsed,x=game.fish[0].x;
  await wait(250);check(game.elapsed===elapsed&&game.fish[0].x===x,'Pause freezes the bubble and fish');button('Resume').click();
  await wait(200);check(game.elapsed>elapsed,'Resume restarts the bubble');
  fixture();draw([{x:205,y:260},{x:350,y:260},{x:350,y:325},{x:205,y:325},{x:205,y:260}]);
  check(game.progress.ricefish===1&&document.getElementById('status').textContent.includes('passed through'),'Threaded fish reject the loop');
  fixture();draw(loop);fixture();draw(loop);check(game.mode==='settling','Final recipe waits for the swim-away animation');
  await until(()=>game.mode==='complete');check(button('Next level')!==undefined,'First level reaches its completion card');
  button('Next level').click();check(game.index===1&&document.getElementById('title').textContent==='Stream stones'&&game.rocks.length===6,'Next level opens stream gobies and stones');
  button('Begin').click();fixture('goby');draw(loop);check(game.progress.goby===1&&game.progress.ricefish===0,'Goby pair advances its own objective');
  fixture('ricefish',1);game.spawn('goby');Object.assign(game.fish.at(-1),{x:282,y:272});draw(loop);check(game.progress.ricefish===0&&document.getElementById('status').textContent.includes('own pocket'),'Mixed pair is rejected');
  game.elapsed=game.level.duration-.02;await until(()=>game.mode==='failed');check(game.mode==='failed'&&button('Retry')!==undefined,'Empty bubble reaches the failure card');
  button('Practice').click();fixture();draw(loop);const practiceTime=game.elapsed;await wait(200);
  check(game.practice&&game.elapsed===practiceTime,'Practice keeps the bubble full');
  fixture('goby');draw(loop);fixture('goby');draw(loop);fixture();draw(loop);
  await until(()=>game.mode==='complete');check(game.mode==='complete'&&button('Next level')!==undefined,'Second level advances to the schooling level');
  button('Next level').click();check(game.index===2&&document.getElementById('card').querySelector('svg').getAttribute('aria-label').includes('3'),'Schooling card shows the three-fish recipe');
  button('Begin').click();fixture('barb');draw(loop);check(game.progress.barb===0,'Two barbs do not count as a school');
  for(let i=0;i<3;i++){fixture('barb',3);draw(loop);}fixture();draw(loop);
  await until(()=>game.mode==='complete');check(game.mode==='complete','Schooling level completes through real gestures');
  button('Next level').click();check(game.index===3&&game.stems.length===3,'Fourth level introduces stems');button('Begin').click();
  const mid=game.stems[0].points[1];game.fish=[];draw([{x:mid.x-50,y:mid.y},{x:mid.x+50,y:mid.y}]);
  check(game.progress.ricefish===0&&document.getElementById('status').textContent.includes('stem'),'A stem cuts the cord during pointer movement');
  const clearLoop=[{x:50,y:160},{x:170,y:160},{x:170,y:270},{x:50,y:270},{x:50,y:160}];
  for(let i=0;i<4;i++){fixture('ricefish',2,85,210);draw(clearLoop);}
  await until(()=>game.mode==='complete');check(game.mode==='complete','Ricefish pairs count in the passages between stems');
  button('Next level').click();check(game.index===4&&game.level.shade,'Fifth level opens halfbeaks under leaves');button('Begin').click();
  for(let i=0;i<3;i++){fixture('halfbeak');draw(loop);}fixture('ricefish');draw(loop);
  await until(()=>game.mode==='complete');check(game.mode==='complete'&&button('Next level')===undefined,'Fifth level completes without linking to an unbuilt sixth level');
  document.getElementById('visits').click();check(document.querySelectorAll('.map button').length===5,'Level map exposes the five playable levels');
  out.textContent+='\nPASS';
} catch(e) {out.textContent+='\nFAIL: '+e.stack;}
