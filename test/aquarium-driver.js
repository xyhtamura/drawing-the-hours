// Runs inside the test iframe so imports resolve to the actual mounted runtime.
import {game,load} from '../between-banks/aquarium.js';
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
  for(const b of game.beetles)Object.assign(b,{x:game.width-80,y:game.height-80,heading:0,targetHeading:0});
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
  button('Next level').click();check(game.index===3&&game.leafClumps.length===2&&game.beetles.length===1,'Fourth level introduces two leaf clumps and a beetle');button('Begin').click();
  const mid=game.leafDisks[0];game.fish=[];draw([{x:mid.x-80,y:mid.y},{x:mid.x+80,y:mid.y}]);
  check(game.progress.ricefish===0&&document.getElementById('status').textContent.includes('Leaves'),'Leaves cut the cord during pointer movement');
  const b=game.beetles[0];Object.assign(b,{x:280,y:205});draw([{x:205,y:205},{x:360,y:205}]);
  check(document.getElementById('status').textContent.includes('beetle')&&game.progress.ricefish===0,'Drawing across a beetle cancels the cord');
  Object.assign(b,{x:280,y:181,heading:Math.PI/2,targetHeading:Math.PI/2,clock:0,turnTime:5});
  const rect=canvas.getBoundingClientRect(),eventAt=(type,x,y)=>canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,button:0,clientX:rect.left+x*rect.width/canvas.width,clientY:rect.top+y*rect.height/canvas.height}));
  document.getElementById('status').textContent='';
  eventAt('pointerdown',205,205);eventAt('pointermove',360,205);
  await until(()=>document.getElementById('status').textContent.includes('beetle'));
  eventAt('pointerup',360,205);check(game.progress.ricefish===0,'A moving beetle cuts a held cord without another pointer move');
  const clearLoop=[{x:50,y:160},{x:170,y:160},{x:170,y:270},{x:50,y:270},{x:50,y:160}];
  for(let i=0;i<4;i++){fixture('ricefish',2,85,210);draw(clearLoop);}
  await until(()=>game.mode==='complete');check(game.mode==='complete','Ricefish pairs count in the passages between leaf clumps');
  button('Next level').click();check(game.index===4&&game.level.shade&&game.beetles.length===2,'Fifth level opens halfbeaks under leaves');button('Begin').click();
  for(let i=0;i<3;i++){fixture('halfbeak');draw(loop);}fixture('ricefish');draw(loop);
  await until(()=>game.mode==='complete');check(button('Next level')!==undefined,'Fifth level advances to the sixth');
  const figure=[{x:250,y:250},{x:100,y:100},{x:60,y:250},{x:100,y:400},{x:250,y:250},{x:400,y:100},{x:440,y:250},{x:400,y:400},{x:250,y:250}].map(p=>({x:p.x*.75,y:p.y*.75+100}));
  function sortedFixture(first,second,count=2) {
    fixture(first,count,82,275);
    for(let i=0;i<2;i++){game.spawn(second);Object.assign(game.fish.at(-1),{x:270+i*22,y:275+i*12});}
  }
  button('Next level').click();check(game.index===5&&document.querySelector('.diagram').getAttribute('aria-label').includes('figure eight'),'Sixth level illustrates two distinct pockets');button('Begin').click();
  fixture();draw(loop);check(game.progress.ricefish===0&&document.getElementById('status').textContent.includes('two pockets'),'Sixth level rejects a lone matching pair');
  sortedFixture('ricefish','ricefish');draw(figure);check(game.progress.ricefish===0&&document.getElementById('status').textContent.includes('different kind'),'Sixth level rejects identical kinds in both pockets');
  for(let i=0;i<3;i++){sortedFixture('ricefish','goby');draw(figure);}
  await until(()=>game.mode==='complete');check(game.progress.ricefish===3&&game.progress.goby===3,'Sixth level completes with three sorted figures');
  button('Next level').click();check(game.index===6&&document.querySelector('.diagram').getAttribute('aria-label').includes('3 spotted barb'),'Seventh level illustrates the school and pair');button('Begin').click();
  sortedFixture('barb','halfbeak',2);draw(figure);check(game.progress.barb===0,'Seventh level rejects an undersized school');
  for(let i=0;i<3;i++){sortedFixture('barb','halfbeak',3);draw(figure);}
  await until(()=>game.mode==='complete');check(game.progress.barb===3&&game.progress.halfbeak===3,'Seventh level completes with school-and-pair figures');
  button('Next level').click();check(game.index===7&&Object.keys(game.level.goals).length===4,'Final level brings together all four kinds');button('Begin').click();
  for(const kind of Object.keys(game.level.goals)) for(let i=0;i<2;i++){fixture(kind,kind==='barb'?3:2);draw(loop);}
  await until(()=>game.mode==='complete');check(document.getElementById('card').querySelector('h2').textContent==='Chapter complete'&&button('Next level')===undefined,'Eighth level ends the chapter without a ninth-level link');
  button('Play again').click();check(game.index===7&&Object.values(game.progress).every(n=>n===0),'Final level can be replayed');
  document.getElementById('visits').click();check(document.querySelectorAll('.map button').length===8,'Level map exposes all eight levels');
  out.textContent+='\nPASS';
} catch(e) {out.textContent+='\nFAIL: '+e.stack;}
