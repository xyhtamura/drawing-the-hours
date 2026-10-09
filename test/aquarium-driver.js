// Runs inside the test iframe so imports resolve to the actual mounted runtime.
import {game,load} from '../aquarium/aquarium.js';
const out=parent.document.getElementById('result'),wait=ms=>new Promise(r=>setTimeout(r,ms));
const checks=[];
function check(ok,label){if(!ok)throw Error(label);checks.push(label);out.textContent=checks.join('\n');}
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
const canvas=document.getElementById('field');
function fixture(kind='guppy') {
  game.fish=[];game.spawn(kind,260,260);game.spawn(kind,305,265);
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
  fixture();draw(loop.slice(0,3));check(game.progress.guppy===0&&document.getElementById('status').textContent.includes('close'),'Open stroke is rejected through pointer handlers');
  fixture();draw(loop);check(game.progress.guppy===1&&game.fish.every(f=>f.state==='departing'),'Matching pair swims away without a refuge');
  await wait(1700);check(game.fish.length===10&&game.fish.every(f=>f.state==='roaming'),'Departures replenish the real population');
  document.getElementById('pause').click();const elapsed=game.elapsed,x=game.fish[0].x;
  await wait(250);check(game.elapsed===elapsed&&game.fish[0].x===x,'Pause freezes the bubble and fish');button('Resume').click();
  await wait(200);check(game.elapsed>elapsed,'Resume restarts the bubble');
  fixture();draw([{x:205,y:260},{x:350,y:260},{x:350,y:325},{x:205,y:325},{x:205,y:260}]);
  check(game.progress.guppy===1&&document.getElementById('status').textContent.includes('passed through'),'Threaded fish reject the loop');
  fixture();draw(loop);fixture();draw(loop);check(game.mode==='settling','Final recipe waits for the swim-away animation');
  await wait(1700);check(button('Next level')!==undefined,'First level reaches its completion card');
  button('Next level').click();check(game.index===1&&document.getElementById('title').textContent==='Ricefish','Next level opens ricefish');
  button('Begin').click();fixture('ricefish');draw(loop);check(game.progress.ricefish===1&&game.progress.guppy===0,'Ricefish pair advances its own objective');
  fixture();game.fish[1].kind='ricefish';draw(loop);check(game.progress.guppy===0&&document.getElementById('status').textContent.includes('own pocket'),'Mixed pair is rejected');
  game.elapsed=game.level.duration-.02;await wait(120);check(game.mode==='failed'&&button('Retry')!==undefined,'Empty bubble reaches the failure card');
  button('Practice').click();fixture();draw(loop);const practiceTime=game.elapsed;await wait(200);
  check(game.practice&&game.elapsed===practiceTime,'Practice keeps the bubble full');
  fixture('ricefish');draw(loop);fixture('ricefish');draw(loop);fixture();draw(loop);
  await wait(1700);check(game.mode==='complete'&&button('Next level')===undefined,'Second level completes without linking to an unbuilt third level');
  document.getElementById('visits').click();check(document.querySelectorAll('.map button').length===2,'Level map exposes only the two playable levels');
  out.textContent+='\nPASS';
} catch(e) {out.textContent+='\nFAIL: '+e.stack;}
