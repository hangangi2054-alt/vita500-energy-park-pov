import {SEATS} from './study-config.js';
export const REST_CHAIRS=[{id:0,x:12.5,z:-4},{id:1,x:12.5,z:.5},{id:2,x:12.5,z:5}];
const R=.16,STEP=.2,BOUNDS={minX:-8.8,maxX:14.4,minZ:-7.6,maxZ:9.4};
const cache=new Map();
export function obstacles({passSeat=null,passBench=null,exitSeat=null,exitBench=null}={}){
  const cacheKey=[passSeat,passBench,exitSeat,exitBench].join(':');if(cache.has(cacheKey))return cache.get(cacheKey);
  const rect=[];
  for(const s of SEATS){
    rect.push({x1:s.x-1.2,x2:s.x+1.2,z1:s.z+.01,z2:s.z+1.3});
    rect.push({x1:s.x-1.22,x2:s.x+1.22,z1:s.z-.86,z2:s.z-.75});
    // Left opening at the chair: an actual entrance, rather than teleporting through a partition.
    rect.push({x1:s.x-1.23,x2:s.x-1.08,z1:s.z+.04,z2:s.z+1.25});
    rect.push({x1:s.x+1.08,x2:s.x+1.23,z1:s.z-.86,z2:s.z+1.25});
    if(s.id!==passSeat&&s.id!==exitSeat)rect.push({x1:s.x-.47,x2:s.x+.47,z1:s.z-.57,z2:s.z-.07});
  }
  rect.push({x1:9.36,x2:9.64,z1:-8.5,z2:-1.05},{x1:9.36,x2:9.64,z1:1.95,z2:6.3});
  for(const b of REST_CHAIRS)if(b.id!==passBench&&b.id!==exitBench)rect.push({x1:b.x-.78,x2:b.x+.78,z1:b.z-.5,z2:b.z+.5});
  cache.set(cacheKey,rect);
  return rect;
}
export function walkable(p,options={}){
  if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||p.x<BOUNDS.minX||p.x>BOUNDS.maxX||p.z<BOUNDS.minZ||p.z>BOUNDS.maxZ)return false;
  return !obstacles(options).some(o=>p.x>o.x1-R&&p.x<o.x2+R&&p.z>o.z1-R&&p.z<o.z2+R);
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
export function seatPosition(id){const s=SEATS[id];return{x:s.x,z:s.z-.35}}
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
      const next={x:current.x+dx,z:current.z+dz},p=point(next);if(!walkable(p,options))continue;
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
