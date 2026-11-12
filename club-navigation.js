import {OBSTACLES,BOUNDS,CONFIG} from './club-config.js';
const STEP=.25;
export function walkable(p){
 if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||p.x<BOUNDS.minX||p.x>BOUNDS.maxX||p.z<BOUNDS.minZ||p.z>BOUNDS.maxZ)return false;
 const r=CONFIG.bodyRadius;return !OBSTACLES.some(o=>Math.hypot(Math.max(o.x1-p.x,0,p.x-o.x2),Math.max(o.z1-p.z,0,p.z-o.z2))<r);
}
export function clearSegment(a,b,options={}){
  const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.07));
  for(let i=0;i<=count;i++)if(!walkable({x:a.x+(b.x-a.x)*i/count,z:a.z+(b.z-a.z)*i/count},options))return false;
  return true;
}
export function collisionMove(start,dx,dz,options={}){
  let p={...start};const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.06));
  for(let i=0;i<steps;i++){
    const both={x:p.x+dx/steps,z:p.z+dz/steps};if(walkable(both,options)){p=both;continue}
    const x={x:p.x+dx/steps,z:p.z};if(walkable(x,options))p=x;
    const z={x:p.x,z:p.z+dz/steps};if(walkable(z,options))p=z;
  }return p;
}
export function findPath(start,end,options={}){
  if(!walkable(start,options)||!walkable(end,options))return null;
  if(clearSegment(start,end,options))return[{...end}];
  const grid=p=>({x:Math.round((p.x-BOUNDS.minX)/STEP),z:Math.round((p.z-BOUNDS.minZ)/STEP)});
  const point=p=>({x:BOUNDS.minX+p.x*STEP,z:BOUNDS.minZ+p.z*STEP});
  const key=p=>p.x+','+p.z,origin=grid(start),finish=grid(end);
  const nearest=(cell,actual)=>{
    const candidates=[];for(let z=-2;z<=2;z++)for(let x=-2;x<=2;x++){const c={x:cell.x+x,z:cell.z+z},p=point(c);if(walkable(p,options)&&clearSegment(actual,p,options))candidates.push(c)}
    return candidates.sort((a,b)=>Math.hypot(point(a).x-actual.x,point(a).z-actual.z)-Math.hypot(point(b).x-actual.x,point(b).z-actual.z))[0];
  };
  const from=nearest(origin,start),to=nearest(finish,end);if(!from||!to)return null;
  const heap=[];function push(node){heap.push(node);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p].f<=node.f)break;heap[i]=heap[p];i=p}heap[i]=node}
  function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c}heap[i]=last}return first}
  const estimate=p=>Math.hypot(to.x-p.x,to.z-p.z),scores=new Map([[key(from),0]]),parents=new Map(),nodes=new Map([[key(from),from]]);
  push({...from,g:0,f:estimate(from)});let reached=null,visited=0;
  while(heap.length&&visited++<25000){
    const current=pop(),id=key(current);if(current.g!==scores.get(id))continue;
    if(id===key(to)){reached=id;break}
    for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const next={x:current.x+dx,z:current.z+dz},p=point(next);if(!walkable(p,options)||!clearSegment(point(current),p,options))continue;
      if(dx&&dz&&(!walkable(point({x:current.x+dx,z:current.z}),options)||!walkable(point({x:current.x,z:current.z+dz}),options)))continue;
      const g=current.g+Math.hypot(dx,dz),nextId=key(next);if(g>=(scores.get(nextId)??Infinity))continue;
      scores.set(nextId,g);parents.set(nextId,id);nodes.set(nextId,next);push({...next,g,f:g+estimate(next)});
    }
  }
  if(!reached)return null;const reversed=[];while(reached){reversed.push(point(nodes.get(reached)));reached=parents.get(reached)}
  const raw=[{...start},...reversed.reverse(),{...end}],path=[];let i=0;
  while(i<raw.length-1){let j=raw.length-1;while(j>i+1&&!clearSegment(raw[i],raw[j],options))j--;path.push(raw[j]);i=j}
  return path;
}
