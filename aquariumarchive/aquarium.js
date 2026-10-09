import {LEVELS,SPECIES} from './levels.js';
import {judgeStroke,strokeCuts,CORD_LIMIT} from './rules.js';
import {polylineLength,polylineTouchesDisk} from '../src/geometry.js';

const $=id=>document.getElementById(id), canvas=$('field'), ctx=canvas.getContext('2d');
const portrait=matchMedia('(max-width:650px)').matches;
const W=portrait?640:960,H=portrait?760:600;
canvas.width=W;canvas.height=H;
const refuge={x:W-95,y:H-115,r:65};
let saved={visit:0,done:[]};
try{const s=JSON.parse(localStorage.getItem('drawing-hours-aquarium-v1'));if(s && Number.isInteger(s.visit) && s.visit>=0 && s.visit<8 && Array.isArray(s.done))saved={visit:s.visit,done:s.done.filter(n=>Number.isInteger(n)&&n>=0&&n<8)};}catch{}
let index=saved.visit,level=LEVELS[index],fish=[],hazards=[],pickups=[],rings=[],stroke=[],activePointer=null;
let mode='card',time=0,oxygen=100,slowUntil=0,practice=false,last=0,lastHud=0;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const slack=()=>!level.tidal || Math.abs(Math.sin(time*Math.PI/6))<.48;
function store(){try{localStorage.setItem('drawing-hours-aquarium-v1',JSON.stringify(saved));}catch{}}
function message(s){$('status').textContent=s;}
function show(html){stroke=[];activePointer=null;mode='card';updateHud();$('card').innerHTML=html;$('overlay').hidden=false;$('card').focus();$('pause').textContent='Pause';}
function action(label,fn,primary=false){const b=document.createElement('button');b.textContent=label;if(primary)b.className='primary';b.onclick=fn;$('card').querySelector('.actions').append(b);}
function run(){mode='play';$('overlay').hidden=true;last=performance.now();canvas.focus();message(level.rule);}
function pickup(kind){return {kind,x:100+Math.random()*(W-260),y:100+Math.random()*(H-270),radius:18,ready:time};}
function load(n){
  index=n;level=LEVELS[n];time=0;oxygen=100;slowUntil=0;rings=[];stroke=[];activePointer=null;
  saved.visit=n;store();
  hazards=[];pickups=[];fish=[];
  if(level.roots)for(let i=0;i<3;i++)hazards.push({kind:'root',x:W*(.2+.25*i),y:H-105-(i%2)*40,endY:H,radius:22,cuts:true});
  if(level.jelly)hazards.push({kind:'jelly',x:W*.66,y:H*.48,radius:27,cuts:true});
  for(let i=0;i<(level.debris||0);i++)hazards.push({kind:'net',x:W*(.32+i*.32),y:H*.65,radius:26,cuts:false});
  if(level.bubbles)pickups.push(pickup('bubble'),pickup('bubble'));
  if(level.grass)pickups.push(pickup('seaweed'));
  const count=level.goal+8;
  for(let i=0;i<count+(level.fry||0);i++){
    const kind=i>=count?'fry':level.kinds[i%level.kinds.length];
    const band=level.kinds.indexOf(kind);
    let x,y,attempt=0;
    do{x=level.split?W*(band===0?.28:.65)+(Math.random()-.5)*110:70+Math.random()*(W-220);y=100+Math.random()*(H-260);attempt++;}while(attempt<50 && hazards.some(h=>Math.hypot(x-h.x,y-h.y)<h.radius+40));
    const a=Math.random()*Math.PI*2;
    fish.push({kind,x,y,vx:Math.cos(a)*SPECIES[kind].speed,vy:Math.sin(a)*SPECIES[kind].speed,phase:Math.random()*6.28,safe:false,guiding:false});
  }
  $('number').textContent=level.place;$('title').textContent=level.title;
  $('objective').textContent=`Guide ${level.goal} fish into refuge${level.group>1?`, at least ${level.group} per pocket`:''}.`;
  $('oxygen-label').hidden=!level.oxygen;
  updateHud();message(level.rule);visitCard();
}
function visitCard(){
  show(`<p class="eyebrow">${level.place}</p><h2>${level.title}</h2><p class="story">${level.story}</p><p>${level.rule}</p><p>Hold and drag to draw. Cross an earlier part of the cord to close it, then lift. The cord blocks fish while held. The dashed circle is refuge.</p><div class="legend">${level.kinds.map(k=>`<span>${SPECIES[k].name}</span>`).join('')} ${level.fry?'<span>Gold fry: leave free</span>':''}</div><div class="actions"></div>`);
  action('Enter tank',run,true);action('Tank map',map);
}
function map(){
  show('<p class="eyebrow">Aquarium / detour</p><h2>Eight windows</h2><p>Every tank is open. Aquarium progress is saved separately from the meadow.</p><div class="map"></div><div class="actions"></div>');
  LEVELS.forEach((l,i)=>{const b=document.createElement('button');b.textContent=`${String(i+1).padStart(2,'0')} · ${l.title}`;const s=document.createElement('small');s.textContent=saved.done.includes(i)?'Visited':i===index?'Current tank':'Open';b.append(s);b.onclick=()=>load(i);$('card').querySelector('.map').append(b);});
  action('Return to tank',visitCard);
}
function pause(){if(mode!=='play')return;show(`<h2>Paused</h2><p>${level.rule}</p><div class="actions"></div>`);action('Resume',run,true);action('Tank card',visitCard);action('Retry',()=>load(index));action('Tank map',map);}
function finish(){
  if(!practice){saved.done=[...new Set([...saved.done,index])];if(index<7)saved.visit=index+1;store();}
  const final=index===7;
  show(`<p class="eyebrow">${practice?'Practice complete':'Tank complete'}</p><h2>${final?'Back to the path':level.title}</h2><p>${final?'I pick up my bag. Outside, the light has moved across the pavement. For a moment, the traffic turns like the school behind the glass.':'The fish settle inside the resting ring. I move along the glass to the next window.'}</p><p>${level.context}</p><div class="actions"></div>`);
  if(!final)action('Next window',()=>load(index+1),true);else action('Tank map',map,true);
  action('Visit again',()=>load(index));const a=document.createElement('a');a.href='../index.html';a.textContent='Return to the meadow';$('card').querySelector('.actions').append(a);
}
function failed(){show('<h2>The pump needs a rest</h2><p>Oxygen ran out before the transfer finished. Retry the tank, or turn on practice to remove oxygen pressure.</p><div class="actions"></div>');action('Retry',()=>load(index),true);action('Practice this tank',()=>{practice=true;practiceLabel();load(index);run();});action('Tank map',map);}
function notes(){
  show(`<p class="eyebrow">Exhibit notes</p><h2>Philippine waters</h2><p>${level.context}</p><p>These tanks are fictional aquarium exhibits. Fish motion, refuge rings, seaweed pickups, oxygen units, and tide timing are game rules, not husbandry advice.</p><ul><li><a href="https://www.seafdec.org.ph/milkfish/" target="_blank" rel="noopener">SEAFDEC: farming milkfish</a> describes hatcheries, ponds, cages, water exchange, and water-quality requirements.</li><li><a href="https://www.seafdec.org.ph/wp-content/content/pages/FreeDownloads/code%20of%20practice/Code_of_Practice_Mangrove.pdf" target="_blank" rel="noopener">SEAFDEC: sustainable use of mangroves for aquaculture</a> discusses habitat protection alongside farming.</li><li><a href="https://www.bfar.da.gov.ph/sardines-closed-fishing-season-now-on-its-12th-year-implementation-2/" target="_blank" rel="noopener">BFAR: sardine closed seasons</a> explains protection during spawning. This chapter specifies no legal dates or boundaries.</li></ul><div class="actions"></div>`);
  action('Return to tank',visitCard,true);
}
function practiceLabel(){$('practice').textContent=`Practice: ${practice?'on':'off'}`;$('practice').setAttribute('aria-pressed',String(practice));}
$('menu').onclick=map;$('pause').onclick=pause;$('notes').onclick=notes;
$('practice').onclick=()=>{practice=!practice;practiceLabel();load(index);message(practice?'Practice removes oxygen pressure and does not write completion.':'Practice is off. The tank restarted.');};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();if(mode==='play')pause();else if($('card').querySelector('.primary')?.textContent==='Resume')run();}if(e.key.toLowerCase()==='r' && e.target===canvas)load(index);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
const point=e=>{const r=canvas.getBoundingClientRect();return{x:clamp((e.clientX-r.left)*W/r.width,5,W-5),y:clamp((e.clientY-r.top)*H/r.height,5,H-5)};};
canvas.addEventListener('pointerdown',e=>{if(mode!=='play'||activePointer!==null||e.button!==0)return;e.preventDefault();activePointer=e.pointerId;canvas.setPointerCapture(e.pointerId);stroke=[point(e)];});
canvas.addEventListener('pointermove',e=>{
  if(mode!=='play'||e.pointerId!==activePointer)return;
  const samples=e.getCoalescedEvents?.();
  for(const sample of samples?.length?samples:[e]){const p=point(sample),a=stroke.at(-1);if(a && Math.hypot(p.x-a.x,p.y-a.y)>5)stroke.push(p);}
  if(polylineLength(stroke)>CORD_LIMIT){stroke=[];activePointer=null;message('The cord snapped. Draw a smaller loop.');}
  else if(strokeCuts(stroke,hazards)){stroke=[];activePointer=null;message('A root or jellyfish cut the cord.');}
});
canvas.addEventListener('pointerup',e=>{
  if(e.pointerId!==activePointer)return;stroke.push(point(e));activePointer=null;
  const result=judgeStroke(stroke,fish,hazards,pickups.filter(p=>p.ready<=time),level,slack());stroke=[];
  if(result.error){message(result.error);return;}
  result.guided.forEach(f=>{f.guiding=true;});
  result.taken.forEach(p=>{if(p.kind==='bubble')oxygen=Math.min(100,oxygen+32);else slowUntil=time+8;p.ready=time+10;});
  result.pockets.forEach(p=>rings.push({polygon:p.polygon,life:1.6}));
  message(result.guided.length?`${result.guided.length} fish are moving into refuge.`:result.taken.some(p=>p.kind==='bubble')?'Aeration restored oxygen.':'Seaweed slows the fish for 8 seconds.');
  updateHud();
});
const cancel=()=>{stroke=[];activePointer=null;};canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);

function update(dt){
  time+=dt;
  const flow=(level.current||0)*Math.sin(time*Math.PI/6),slow=time<slowUntil?.35:1;
  if(level.oxygen&&!practice)oxygen=Math.max(0,oxygen-dt*level.oxygen*(stroke.length?1.25:1));
  hazards.forEach(h=>{if(h.kind==='jelly'){h.x=W*.66+Math.sin(time*.37)*W*.15;h.y=H*.47+Math.sin(time*.51)*60;}});
  fish.forEach(f=>{
    if(f.guiding){const dx=refuge.x-f.x,dy=refuge.y-f.y,d=Math.hypot(dx,dy);f.x+=dx*dt*1.5;f.y+=dy*dt*1.5;f.vx=dx;f.vy=dy;if(d<35){f.guiding=false;f.safe=true;f.phase=Math.random()*6.28;}return;}
    if(f.safe){f.x=refuge.x+Math.cos(time*.5+f.phase)*40;f.y=refuge.y+Math.sin(time*.5+f.phase)*30;return;}
    const spec=SPECIES[f.kind];
    let ax=Math.cos(time*.8+f.phase)*9,ay=Math.sin(time*.6+f.phase)*9;
    if(level.school && f.kind==='sardine'){ax+=(W*.43+Math.sin(time*.45)*W*.19-f.x)*.6;ay+=(H*.37+Math.sin(time*.8)*H*.1-f.y)*.6;}
    if(level.split){ax+=(W*(f.kind==='bangus'?.27:.67)-f.x)*.15;}
    if(f.kind==='tilapia'){ax*=.5;ay*=.5;}
    f.vx+=ax*dt;f.vy+=ay*dt;const speed=Math.hypot(f.vx,f.vy);if(speed>spec.speed){f.vx*=spec.speed/speed;f.vy*=spec.speed/speed;}
    let nx=f.x+(f.vx*slow+flow)*dt,ny=f.y+f.vy*slow*dt;
    if(nx<40||nx>W-45){f.vx*=-1;nx=clamp(nx,40,W-45);}if(ny<65||ny>H-65){f.vy*=-1;ny=clamp(ny,65,H-65);}
    if(stroke.length>1 && polylineTouchesDisk(stroke,nx,ny,spec.size*.5)){f.vx*=-1;f.vy*=-1;}else{f.x=nx;f.y=ny;}
  });
  rings.forEach(r=>r.life-=dt);rings=rings.filter(r=>r.life>0);
  if(fish.filter(f=>f.safe).length>=level.goal)finish();else if(oxygen<=0)failed();
}
function path(points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));}
function fishArt(f){
  const s=SPECIES[f.kind],n=s.size;ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.safe?Math.cos(time*.5+f.phase)*.25:Math.atan2(f.vy,f.vx));
  ctx.shadowColor='#18494235';ctx.shadowBlur=0;ctx.shadowOffsetY=3;
  ctx.fillStyle=s.trim;ctx.beginPath();ctx.moveTo(-n*.65,0);ctx.lineTo(-n*1.3,-n*.6);ctx.lineTo(-n*1.2,n*.55);ctx.closePath();ctx.fill();
  ctx.fillStyle=s.color;ctx.beginPath();ctx.ellipse(0,0,n,f.kind==='tilapia'?n*.65:n*.42,0,0,6.28);ctx.fill();ctx.shadowOffsetY=0;
  ctx.fillStyle=s.trim;ctx.beginPath();ctx.moveTo(-n*.45,-n*.32);ctx.lineTo(0,-n*.75);ctx.lineTo(n*.35,-n*.28);ctx.fill();
  ctx.strokeStyle=s.trim;ctx.lineWidth=1;ctx.beginPath();ctx.arc(n*.3,0,n*.25,-1.25,1.25);ctx.stroke();
  if(f.kind==='tilapia'||f.kind==='siganid')for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-n*.5+i*n*.3,-n*.27);ctx.lineTo(-n*.6+i*n*.3,n*.27);ctx.stroke();}
  ctx.fillStyle='#244746';ctx.beginPath();ctx.arc(n*.68,-n*.08,2,0,6.28);ctx.fill();ctx.restore();
}
function draw(){
  const grad=ctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,'#c2d9c6');grad.addColorStop(.5,'#8dbbb1');grad.addColorStop(1,'#487d7b');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  // Original canvas artwork: glass reflections, grain, sand, and a visitor's reflection.
  ctx.fillStyle='#f6edc512';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(80+i*165,0);ctx.lineTo(125+i*165,0);ctx.lineTo(230+i*150,H);ctx.lineTo(175+i*150,H);ctx.fill();}
  ctx.fillStyle='#b9bfa1';ctx.beginPath();ctx.moveTo(0,H-65);for(let x=0;x<=W;x+=20)ctx.lineTo(x,H-65+Math.sin(x*.011)*13);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
  ctx.fillStyle='#2c605316';for(let i=0;i<550;i++)ctx.fillRect((i*137.3)%W,(i*83.7)%H,1.3,1.3);
  if(level.grass||level.roots){ctx.strokeStyle='#4a796560';ctx.lineWidth=5;for(let i=0;i<18;i++){const x=25+i*W/18;ctx.beginPath();ctx.moveTo(x,H-50);ctx.quadraticCurveTo(x-15,H-95,x+Math.sin(time*.7+i)*10,H-135-(i%4)*13);ctx.stroke();}}
  ctx.save();ctx.strokeStyle='#edf0d6aa';ctx.setLineDash([6,7]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(refuge.x,refuge.y,refuge.r,0,6.28);ctx.stroke();ctx.restore();
  ctx.font='13px Mali, serif';ctx.fillStyle='#eef1d6';ctx.textAlign='center';ctx.fillText('REFUGE',refuge.x,refuge.y+refuge.r+23);
  ctx.fillStyle='#194e4430';ctx.beginPath();ctx.ellipse(W*.13,H-11,32,70,-.2,0,6.28);ctx.fill();ctx.beginPath();ctx.arc(W*.13,H-99,18,0,6.28);ctx.fill();
  ctx.strokeStyle='#f4ecd44a';ctx.lineWidth=2;for(let i=0;i<6;i++){let x=60+i*(W-120)/5;ctx.beginPath();ctx.moveTo(x,43);ctx.lineTo(x+Math.sin(time*Math.PI/6)*(level.current||0),43);ctx.lineTo(x+Math.sin(time*Math.PI/6)*(level.current||0)-Math.sign(Math.sin(time*Math.PI/6))*6,39);if(level.current)ctx.stroke();}
  hazards.forEach(h=>{
    ctx.save();ctx.translate(h.x,h.y);
    if(h.kind==='root'){ctx.strokeStyle='#756452';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,H-h.y);ctx.quadraticCurveTo(-15,20,0,-20);ctx.moveTo(0,8);ctx.lineTo(18,28);ctx.stroke();ctx.fillStyle='#eee6c1';ctx.font='10px Mali';ctx.fillText('ROOT',0,45);}
    else if(h.kind==='jelly'){ctx.fillStyle='#ddaaaab0';ctx.beginPath();ctx.ellipse(0,-12,24,18,0,Math.PI,6.28);ctx.lineTo(24,0);ctx.lineTo(-24,0);ctx.fill();ctx.strokeStyle='#ac7f96';ctx.lineWidth=2;for(let i=-2;i<3;i++){ctx.beginPath();ctx.moveTo(i*8,0);ctx.quadraticCurveTo(i*8+Math.sin(time*2+i)*8,12,i*7,24);ctx.stroke();}ctx.fillStyle='#6a4964';ctx.font='10px Mali';ctx.fillText('JELLY',0,-36);}
    else{ctx.rotate(.25);ctx.strokeStyle='#667571';ctx.lineWidth=1.5;ctx.strokeRect(-22,-18,44,36);for(let i=-2;i<3;i++){ctx.beginPath();ctx.moveTo(i*8,-18);ctx.lineTo(i*8,18);ctx.moveTo(-22,i*7);ctx.lineTo(22,i*7);ctx.stroke();}ctx.fillStyle='#274c45';ctx.font='10px Mali';ctx.fillText('NET',0,33);}
    ctx.restore();
  });
  pickups.filter(p=>p.ready<=time).forEach(p=>{ctx.save();ctx.translate(p.x,p.y+Math.sin(time*2+p.x)*4);ctx.strokeStyle=p.kind==='bubble'?'#edf8ee':'#396e4d';ctx.lineWidth=2;ctx.fillStyle=p.kind==='bubble'?'#c9efed80':'#9eb56c';if(p.kind==='bubble')for(let i=0;i<3;i++){ctx.beginPath();ctx.arc((i-1)*11,-(i%2)*12,7,0,6.28);ctx.fill();ctx.stroke();}else{ctx.beginPath();ctx.moveTo(0,17);ctx.bezierCurveTo(-35,-15,20,-30,0,-17);ctx.bezierCurveTo(38,-12,-18,5,0,17);ctx.fill();ctx.stroke();}ctx.fillStyle='#224d43';ctx.font='11px Mali';ctx.fillText(p.kind==='bubble'?'AIR +32':'SLOW · 8s',0,36);ctx.restore();});
  fish.forEach(fishArt);
  rings.forEach(r=>{ctx.globalAlpha=r.life/1.6;path(r.polygon);ctx.closePath();ctx.fillStyle='#faf1c130';ctx.fill();ctx.strokeStyle='#f5eac1';ctx.lineWidth=3;ctx.stroke();ctx.globalAlpha=1;});
  if(stroke.length){path(stroke);ctx.strokeStyle='#f5e0b7';ctx.lineWidth=4;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();ctx.fillStyle='#f5e0b7';ctx.beginPath();ctx.arc(stroke[0].x,stroke[0].y,6,0,6.28);ctx.fill();}
  ctx.textAlign='left';ctx.font='12px Mali, serif';ctx.fillStyle='#204e48';ctx.fillText('AQUARIUM / '+String(index+1).padStart(2,'0'),24,30);
}
function updateHud(){const count=fish.filter(f=>f.safe).length;$('progress').textContent=`${count} / ${level.goal} fish in refuge`;$('oxygen').value=oxygen;$('oxygen').setAttribute('aria-label',`Oxygen ${Math.round(oxygen)} game units`);$('tide').textContent=time<slowUntil?`Slowed · ${Math.ceil(slowUntil-time)}s`:level.tidal?(slack()?'Tide: Slack · transfer open':'Tide: Running · wait'):level.current?'Tidal current':'Still water';}
function frame(now){const dt=Math.min(.04,(now-(last||now))/1000);last=now;if(mode==='play')update(dt);if(mode==='play'||!reduced)draw();if(now-lastHud>150){updateHud();lastHud=now;}requestAnimationFrame(frame);}
load(index);draw();requestAnimationFrame(frame);
