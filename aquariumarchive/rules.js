import {extractClosedPockets, pointInPolygon, polylineLength, polylineTouchesDisk} from '../src/geometry.js';
export const CORD_LIMIT = 1500;
export function strokeCuts(points,hazards){
  return hazards.some(h=>{
    if(!h.cuts)return false;
    if(polylineTouchesDisk(points,h.x,h.y,h.radius))return true;
    if(h.kind==='root')for(let y=h.y+20;y<h.endY;y+=20)if(polylineTouchesDisk(points,h.x,y,12))return true;
    return false;
  });
}
export function judgeStroke(points, fish, hazards, pickups, level, slack = true) {
  if(polylineLength(points)>CORD_LIMIT) return {error:'The cord snapped. Use a smaller loop.'};
  if(strokeCuts(points,hazards)) return {error:'The cord touched a root or a jellyfish. Try another route.'};
  const pockets = extractClosedPockets(points,{touchDist:6,minArea:650});
  if(!pockets.length) return {error:'Cross the cord to close a loop before lifting.'};
  const contains=(p,e)=>pointInPolygon(e,p.polygon);
  if(pockets.some(p=>fish.some(f=>f.kind==='fry' && contains(p,f)))) return {error:'Fry were inside the loop. Leave the small gold fish free.'};
  if(pockets.some(p=>hazards.some(h=>!h.cuts && contains(p,h)))) return {error:'Loose netting spoiled the pocket. Draw around clear water.'};
  const groups=pockets.map(p=>fish.filter(f=>!f.safe && !f.guiding && f.kind!=='fry' && contains(p,f)));
  const taken=pickups.filter(e=>pockets.some(p=>contains(p,e)));
  if(level.split && groups.some(g=>g.length) && (groups.length!==2 || groups.some(g=>!g.length) || new Set(groups.flat().map(f=>f.kind)).size!==2)) return {error:'Make two occupied pockets: bangus in one, tilapia in the other.'};
  if(level.separate && groups.some(g=>new Set(g.map(f=>f.kind)).size>1)) return {error:'Keep each kind in its own pocket.'};
  if(groups.some(g=>g.length>0 && g.length<level.group)) return {error:`Each fish pocket needs at least ${level.group} fish.`};
  if(level.tidal && !slack && groups.some(g=>g.length)) return {error:'The current opened the ring. Finish the fish loop at Slack tide.'};
  const guided=[...new Set(groups.flat())];
  if(!guided.length && !taken.length) return {error:'The loop held only water. Try a fish or a pickup.'};
  return {guided,taken,pockets};
}
