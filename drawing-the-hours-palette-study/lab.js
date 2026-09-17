(() => {
  'use strict';
  const {hours, groups, presets, sets} = window.PALETTE_STUDY;
  const roles = Object.keys(groups).flatMap(group => Object.keys(groups[group]));
  const $ = id => document.getElementById(id);
  const title = s => s[0].toUpperCase() + s.slice(1);
  const storageKey = 'drawing-the-hours-palette-study-v1';
  const hex = value => /^#[0-9a-f]{6}$/i.test(value);
  const fresh = () => ({version:1, selected:'midnight', chapters:Object.fromEntries(hours.map((hour,i) => {
    const preset = presets[hour].find(p => p.id === sets['paper-blue'].ids[i]);
    return [hour,{preset:preset.id, name:preset.name, colors:{...preset.colors}}];
  }))});
  function validate(data) {
    if (!data || data.version !== 1 || !data.chapters) throw new Error('Expected a version 1 palette study.');
    const clean = fresh();
    clean.selected = hours.includes(data.selected) ? data.selected : 'midnight';
    for (const hour of hours) {
      const p = data.chapters[hour];
      if (!p || roles.some(key => !hex(p.colors?.[key]))) throw new Error(`${title(hour)} needs all ${roles.length} colors as six-digit hex values.`);
      clean.chapters[hour] = {preset:presets[hour].some(v => v.id === p.preset) ? p.preset : presets[hour][0].id,
        name:typeof p.name === 'string' ? p.name.slice(0,80) : 'Imported palette',
        colors:Object.fromEntries(roles.map(key => [key,p.colors[key].toLowerCase()]))};
    }
    return clean;
  }
  let state = fresh();
  try { const raw = localStorage.getItem(storageKey); if (raw) state = validate(JSON.parse(raw)); } catch (_) {}
  let paths = [], drawing = null, pointerId = null, motion = false, time = 0;
  const main = $('preview');
  main.width = 960 * Math.min(2,window.devicePixelRatio || 1);
  main.height = 620 * Math.min(2,window.devicePixelRatio || 1);
  const minis = {};
  function notify(text) { $('status').textContent = text; }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); notify('Saved in this browser. Export to keep a file.'); }
    catch (_) { notify('Browser storage unavailable. Export to keep these colors.'); }
  }
  function choose(hour) { state.selected = hour; paths = []; cancelDrawing(); save(); refresh(); }
  for (const hour of hours) {
    const button = document.createElement('button'); button.textContent = title(hour); button.dataset.hour = hour;
    button.addEventListener('click',() => choose(hour)); $('hours').append(button);
    const card = document.createElement('button'); card.className = 'compare-card'; card.dataset.hour = hour;
    card.setAttribute('aria-label',`Edit ${title(hour)} palette`);
    const canvas = document.createElement('canvas'); canvas.width=400; canvas.height=260; canvas.setAttribute('aria-hidden','true');
    const label = document.createElement('strong'); label.textContent=title(hour);
    const name = document.createElement('span'); card.append(canvas,label,name);
    card.addEventListener('click',() => choose(hour)); $('compare').append(card); minis[hour]={canvas,name,card};
  }
  for (const [id,set] of Object.entries(sets)) $('set').add(new Option(set.name,id));
  const controls = {};
  for (const [group, entries] of Object.entries(groups)) {
    const fieldset = document.createElement('fieldset'); fieldset.className='swatch-group';
    const legend = document.createElement('legend'); legend.textContent=group; fieldset.append(legend);
    for (const [key,label] of Object.entries(entries)) {
      const row=document.createElement('div'); row.className='swatch-row';
      const picker=document.createElement('input'); picker.type='color'; picker.id=`pick-${key}`; picker.setAttribute('aria-label',label);
      const name=document.createElement('label'); name.htmlFor=picker.id; name.textContent=label;
      const text=document.createElement('input'); text.type='text'; text.maxLength=7; text.spellcheck=false;
      text.setAttribute('aria-label',`${label} hex value`); text.setAttribute('aria-invalid','false');
      const edit=value=>{
        state.chapters[state.selected].colors[key]=value.toLowerCase();
        state.chapters[state.selected].name='Custom palette';
        picker.value=value; text.value=value.toUpperCase(); text.setAttribute('aria-invalid','false');
        save(); repaint();
      };
      picker.addEventListener('input',()=>edit(picker.value));
      text.addEventListener('input',()=>{ if (hex(text.value)) edit(text.value); else text.setAttribute('aria-invalid','true'); });
      text.addEventListener('blur',()=>{if(!hex(text.value)){text.value=state.chapters[state.selected].colors[key].toUpperCase();text.setAttribute('aria-invalid','false');}});
      row.append(picker,name,text); fieldset.append(row); controls[key]={picker,text};
    }
    $('swatches').append(fieldset);
  }
  function presetSelected(id) {
    const p=presets[state.selected].find(p=>p.id===id);
    state.chapters[state.selected]={preset:p.id,name:p.name,colors:{...p.colors}};
    save(); refresh();
  }
  $('preset').addEventListener('change',()=>presetSelected($('preset').value));
  $('reset').addEventListener('click',()=>presetSelected(state.chapters[state.selected].preset));
  $('apply-set').addEventListener('click',()=>{
    const set=sets[$('set').value];
    hours.forEach((hour,i)=>{const p=presets[hour].find(p=>p.id===set.ids[i]);state.chapters[hour]={preset:p.id,name:p.name,colors:{...p.colors}};});
    save();refresh();notify(`Applied ${set.name} to all four hours.`);
  });
  $('card').addEventListener('change',drawMain);
  $('clear').addEventListener('click',()=>{paths=[];cancelDrawing();drawMain();});
  $('stroke').addEventListener('change',drawMain);
  $('motion').addEventListener('change',()=>{motion=$('motion').checked;if(motion)requestAnimationFrame(animate);else drawMain();});
  function animate(timestamp) {if(!motion)return;time=timestamp/1000;drawMain();requestAnimationFrame(animate);}
  function cancelDrawing(){if(pointerId!==null){try{main.releasePointerCapture(pointerId);}catch(_){}}pointerId=null;drawing=null;}
  function position(e){const r=main.getBoundingClientRect();return{x:(e.clientX-r.left)*960/r.width,y:(e.clientY-r.top)*620/r.height};}
  main.addEventListener('pointerdown',e=>{if(pointerId!==null||e.button!==0)return;e.preventDefault();pointerId=e.pointerId;main.setPointerCapture(pointerId);drawing={role:$('stroke').value,points:[position(e)]};drawMain();});
  main.addEventListener('pointermove',e=>{if(e.pointerId!==pointerId)return;drawing.points.push(position(e));drawMain();});
  main.addEventListener('pointerup',e=>{if(e.pointerId!==pointerId)return;drawing.points.push(position(e));paths.push(drawing);if(paths.length>50)paths.shift();cancelDrawing();drawMain();});
  main.addEventListener('pointercancel',()=>{cancelDrawing();drawMain();});
  main.addEventListener('lostpointercapture',()=>{if(drawing){pointerId=null;drawing=null;drawMain();}});
  function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  $('export').addEventListener('click',()=>{download(new Blob([JSON.stringify(state,null,2)+'\n'],{type:'application/json'}),'drawing-the-hours-palettes.json');notify('Exported all four palettes. The game is unchanged.');});
  $('import').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>100000)throw new Error('Palette file is too large.');state=validate(JSON.parse(await file.text()));paths=[];cancelDrawing();save();refresh();notify('Imported all four palettes.');}
    catch(error){notify(`Import failed: ${error.message}`);}e.target.value='';
  });
  $('png').addEventListener('click',()=>main.toBlob(blob=>{if(blob)download(blob,`${state.selected}-palette-preview.png`);}));
  $('css').addEventListener('click',async()=>{
    const css=`/* Palette study: ${state.selected}. Proposed roles, not an installed game theme. */\n:root {\n${roles.map(key=>`  --dth-${key}: ${state.chapters[state.selected].colors[key]};`).join('\n')}\n}\n`;
    try{await navigator.clipboard.writeText(css);notify('Copied proposed chapter CSS.');}
    catch(_){download(new Blob([css],{type:'text/css'}),`${state.selected}-palette.css`);notify('Clipboard unavailable; downloaded the CSS instead.');}
  });
  function luminance(hex){const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
  function ratio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  function contrast(){
    const c=state.chapters[state.selected].colors;
    const field=role=>Math.min(...['top','middle','bottom'].map(bg=>ratio(c[role],c[bg])));
    const values=[['Card text',ratio(c.ink,c.panel),4.5],['Field text',field('ink'),4.5],['Secondary text on card',ratio(c.muted,c.panel),4.5],['Trace against wash stops',field('trace'),3],['Seed against wash stops',field('seed'),3],['Outline against wash stops',field('outline'),3]];
    $('contrast').replaceChildren();
    for(const [label,value,target] of values){const box=document.createElement('div');box.className=`ratio${value<target?' low':''}`;const n=document.createElement('strong');n.textContent=`${value.toFixed(2)} : 1`;const text=document.createElement('span');text.textContent=`${label}${value<target?' · check visibility':''}`;box.append(n,text);$('contrast').append(box);}
  }
  function refresh(){
    $('preview-title').textContent=title(state.selected);
    $('preset').replaceChildren();for(const p of presets[state.selected])$('preset').add(new Option(p.name,p.id));
    $('preset').value=state.chapters[state.selected].preset;
    for(const key of roles){controls[key].picker.value=state.chapters[state.selected].colors[key];controls[key].text.value=state.chapters[state.selected].colors[key].toUpperCase();controls[key].text.setAttribute('aria-invalid','false');}
    document.querySelectorAll('#hours button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.hour===state.selected)));
    repaint();
  }
  function repaint(){drawMain();for(const hour of hours){scene(minis[hour].canvas,hour,state.chapters[hour].colors,false,0,false);minis[hour].name.textContent=state.chapters[hour].name;minis[hour].card.setAttribute('aria-pressed',String(hour===state.selected));}contrast();}
  function drawMain(){scene(main,state.selected,state.chapters[state.selected].colors,$('card').checked,motion?time:0,true);}

  function scene(canvas,hour,c,card,t,full){
    const ctx=canvas.getContext('2d');ctx.setTransform(canvas.width/960,0,0,canvas.height/620,0,0);
    const wash=ctx.createLinearGradient(0,0,960,620);wash.addColorStop(0,c.top);wash.addColorStop(.5,c.middle);wash.addColorStop(1,c.bottom);ctx.fillStyle=wash;ctx.fillRect(0,0,960,620);
    ctx.save();ctx.globalAlpha=.035;ctx.strokeStyle=c.ink;ctx.lineWidth=.7;
    for(let i=0;i<1200;i++){const x=(i*137.37)%960,y=(i*83.29)%620;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+3+(i%4),y+.6);ctx.stroke();}ctx.restore();
    ctx.fillStyle=c.edge;ctx.fillRect(0,581,960,39);
    if(hour==='midnight'){ctx.fillRect(0,110,22,510);ctx.fillRect(938,110,22,510);}
    if(hour==='dusk'){ctx.fillRect(0,110,25,510);}
    if(hour==='dawn'){ctx.fillRect(56,105,7,200);ctx.fillRect(32,112,55,38);}
    if(hour==='noon'){ctx.save();ctx.globalAlpha=.25;ctx.strokeStyle=c.edge;for(let x=80;x<960;x+=190){ctx.beginPath();ctx.moveTo(x,105);ctx.lineTo(x+55,580);ctx.stroke();}ctx.restore();}
    for(const x of [37,923])for(let i=0;i<8;i++){ctx.strokeStyle=c.vein;ctx.lineWidth=1.3;const y=575-i*28;ctx.beginPath();ctx.moveTo(x,590);ctx.quadraticCurveTo(x+(x<400?22:-22),y,x,y-15);ctx.stroke();leaf(ctx,x+(x<400?10:-10),y,c,.75);}
    leaf(ctx,523,401,c,1.4);if(hour==='dusk'||hour==='midnight')leaf(ctx,687,239,c,1.2);
    ctx.fillStyle=c.ink;ctx.font='600 18px system-ui';ctx.textAlign='left';ctx.fillText('01:35',77,43);ctx.fillStyle=c.muted;ctx.font='12px system-ui';ctx.fillText('Dandelion clock',77,62);
    ctx.strokeStyle=c.seed;ctx.lineWidth=1.5;for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(42,43);ctx.lineTo(42+23*Math.cos(a),43+23*Math.sin(a));ctx.stroke();ctx.beginPath();ctx.arc(42+23*Math.cos(a),43+23*Math.sin(a),2,0,Math.PI*2);ctx.stroke();}
    pill(ctx,363,25,230,30,c.panel);ctx.fillStyle=c.ink;ctx.textAlign='center';ctx.font='600 13px system-ui';ctx.fillText(`${title(hour)} · ${hour==='midnight'?'Trace':'Enclose'}`,478,45);
    ctx.textAlign='right';ctx.fillStyle=c.ink;ctx.font='600 15px system-ui';ctx.fillText(hour==='midnight'?'Traces: 1 / 3':'Combinations: 2 / 5',928,42);ctx.fillStyle=c.muted;ctx.font='12px system-ui';ctx.fillText('Score: 300',928,62);
    const kinds=['brimstone','damselfly','hawkmoth','hoverfly','lacewing','firefly'];
    const poses=[[235,220],[455,205],[700,240],[272,369],[523,398],[740,381]];
    kinds.forEach((kind,i)=>{const[x,y]=poses[i];const dx=t?Math.sin(t*.7+i)*18:0,dy=t?Math.cos(t*.55+i)*12:0;insect(ctx,kind,x+dx,y+dy,c,t,i,1);ctx.textAlign='center';ctx.fillStyle=c.muted;ctx.font='12px system-ui';ctx.fillText(title(kind),x+dx,y+dy+42);});
    for(const [x,y] of [[356,315],[655,430]]){ctx.strokeStyle=c.seed;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+7,y+20);ctx.stroke();for(let i=0;i<10;i++){const a=i*Math.PI/5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+13*Math.cos(a),y+13*Math.sin(a));ctx.stroke();}}
    ['petite','balanced','extended','trace'].forEach((role,i)=>{const x=180+i*190,y=515;ctx.strokeStyle=c[role];ctx.lineWidth=3.8;ctx.setLineDash(role==='trace'?[9,4]:[]);ctx.beginPath();if(role==='trace'){ctx.moveTo(x-55,y+8);ctx.lineTo(x-20,y-22);ctx.lineTo(x+20,y+15);ctx.lineTo(x+55,y-10);}else{ctx.ellipse(x,y,48,23,-.15,0,Math.PI*2);}ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=c.muted;ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText({petite:'Short cord',balanced:'Medium cord',extended:'Long cord',trace:'Trace'}[role],x,561);});
    if(full){for(const path of [...paths,...(drawing?[drawing]:[])]){ctx.strokeStyle=c[path.role];ctx.lineWidth=3.8;ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash(path.role==='trace'?[9,4]:[]);ctx.beginPath();path.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}ctx.setLineDash([]);}
    if(card){ctx.save();ctx.fillStyle='#000';ctx.globalAlpha=.22;ctx.fillRect(0,0,960,620);ctx.restore();pill(ctx,233,135,494,363,c.panel);ctx.strokeStyle=c.edge;ctx.lineWidth=1;ctx.strokeRect(245,147,470,339);ctx.fillStyle=c.ink;ctx.font='28px Georgia';ctx.textAlign='center';ctx.fillText(`${title(hour)} · instruction card`,480,190);ctx.font='15px system-ui';ctx.fillText('Preview text, insects, and cord on the card color.',480,232);ctx.fillStyle=c.muted;ctx.font='13px system-ui';ctx.fillText('Secondary instruction text',480,259);insect(ctx,'firefly',382,330,c,t,1,1);insect(ctx,'lacewing',480,330,c,t,0,1);insect(ctx,'firefly',578,330,c,t,2,1);ctx.strokeStyle=c.trace;ctx.lineWidth=3;ctx.setLineDash([9,4]);ctx.beginPath();ctx.moveTo(336,375);ctx.lineTo(624,375);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=c.ink;ctx.font='600 15px system-ui';ctx.fillText('Begin visit',480,454);}
  }
  function pill(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,10);ctx.fill();}
  function leaf(ctx,x,y,c,scale){ctx.save();ctx.translate(x,y);ctx.rotate(-.35);ctx.scale(scale,scale);ctx.fillStyle=c.leaf;ctx.strokeStyle=c.vein;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,20,8,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(18,0);for(let n=-10;n<11;n+=7){ctx.moveTo(n,0);ctx.lineTo(n+5,-5);}ctx.stroke();ctx.restore();}
  function insect(ctx,kind,x,y,c,t,i,scale){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle=c.outline;ctx.lineWidth=1.2;
    if(kind==='firefly'){const glow=t?(.4+.6*(.5+.5*Math.sin(t*2+i))):.8;const halo=ctx.createRadialGradient(0,10,3,0,10,34);halo.addColorStop(0,c.firefly+'99');halo.addColorStop(1,c.firefly+'00');ctx.save();ctx.globalAlpha=glow;ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,10,34,0,Math.PI*2);ctx.fill();ctx.restore();}
    const flap=t?.75+.25*Math.abs(Math.cos(t*4+i)):1;
    for(const side of [-1,1]){ctx.save();ctx.scale(side,1);ctx.fillStyle=c[kind];ctx.beginPath();
      if(kind==='brimstone'){ctx.ellipse(13*flap,-2,14*flap,23,-.3,0,Math.PI*2);}
      else if(kind==='damselfly'){ctx.ellipse(15,-7,19,4,-.25,0,Math.PI*2);ctx.ellipse(14,3,18,4,.15,0,Math.PI*2);}
      else if(kind==='hawkmoth'){ctx.moveTo(0,-13);ctx.lineTo(30,15);ctx.lineTo(6,10);ctx.closePath();}
      else if(kind==='lacewing'){ctx.ellipse(9,5,9,23,-.2,0,Math.PI*2);}
      else{ctx.globalAlpha=.78;ctx.ellipse(12,-2,9,18,.3,0,Math.PI*2);}
      ctx.fill();ctx.stroke();if(kind==='lacewing'){for(let yy=-7;yy<22;yy+=6){ctx.beginPath();ctx.moveTo(3,yy);ctx.lineTo(15,yy+3);ctx.stroke();}}ctx.restore();}
    ctx.fillStyle=c.body;ctx.beginPath();ctx.ellipse(0,0,kind==='damselfly'?2.5:5,kind==='damselfly'?25:17,0,0,Math.PI*2);ctx.fill();
    if(kind==='hoverfly'){ctx.fillStyle=c.hoverfly;for(let yy=-7;yy<13;yy+=7)ctx.fillRect(-4,yy,8,4);}
    if(kind==='firefly'){ctx.fillStyle=c.firefly;ctx.beginPath();ctx.ellipse(0,11,5,7,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
    ctx.strokeStyle=c.body;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-1,-14);ctx.lineTo(-7,-26);ctx.moveTo(1,-14);ctx.lineTo(7,-26);ctx.stroke();ctx.restore();
  }
  refresh();
  // Read-only diagnostic helpers for independent browser checks.
  window.paletteStudy={getState:()=>JSON.parse(JSON.stringify(state)),validate,ratio};
})();
