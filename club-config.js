export const CONFIG=Object.freeze({startingCans:3,bodyRadius:.48,speed:3.7,tireAfterSeconds:16,specialSeconds:2.8,drinkSeconds:2.2});
export const BOUNDS={minX:-14.3,maxX:14.3,minZ:-11.3,maxZ:11.3};
// Rendered dimensions are also the collision dimensions; the navigation adds the body radius.
export const TABLES=[{id:0,x:-10.8,z:-2,w:2.8,d:1.7,h:1.1},{id:1,x:10.8,z:-2,w:2.8,d:1.7,h:1.1},{id:2,x:10.8,z:6,w:2.8,d:1.7,h:1.1}];
export const FIXTURES=[{id:'stage',x:0,z:-9.5,w:13,d:3,h:.8,color:'#292338'},...[-8.4,8.4].map((x,i)=>({id:'speaker'+i,x,z:-9.4,w:1.9,d:1.8,h:3.5,color:'#242234'})),...[-13.6,13.6].map((x,i)=>({id:'light'+i,x,z:2,w:.45,d:.45,h:4,color:'#544258'}))];
export const OBSTACLES=[...TABLES,...FIXTURES].map(o=>({...o,x1:o.x-o.w/2,x2:o.x+o.w/2,z1:o.z-o.d/2,z2:o.z+o.d/2}));
export const DANCE={minX:-7.2,maxX:7.2,minZ:-5.8,maxZ:8.2};
export const inDance=p=>p.x>=DANCE.minX&&p.x<=DANCE.maxX&&p.z>=DANCE.minZ&&p.z<=DANCE.maxZ;
export const tableSpot=t=>({x:t.x,z:t.z+t.d/2+CONFIG.bodyRadius+.35});
export const nearTable=p=>TABLES.find(t=>Math.hypot(p.x-tableSpot(t).x,p.z-tableSpot(t).z)<.75);
export const spawn=()=>({x:(Math.random()-.5)*1.4,z:4.8+Math.random()*.25});
export const DEMO_DANCERS=[[-5.3,-3.6],[-1.9,-4],[2,-3.8],[5.4,-3.5],[-5.5,.5],[-2.5,.3],[2.5,.6],[5.5,.4],[-4.8,5.5],[4.8,5.8]].map(([x,z],i)=>({id:'club-demo-'+i,nick:'시연 댄서',demo:true,x,z,phase:'dance',awake:true,tired:0,offset:i*.83,color:['#ffb77e','#ceb4fa','#9ce3cf','#f4a9c5','#9cbfe7'][i%5]}));
