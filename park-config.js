export const CONFIG=Object.freeze({startingCans:3,bodyRadius:.46,speed:4,tireAfterSeconds:22,specialSeconds:2.8,drinkSeconds:2.2,rideSeconds:18});
export const BOUNDS={minX:-16,maxX:18,minZ:-11.5,maxZ:13.5};
export const DANCE={minX:-8,maxX:-1,minZ:-1.5,maxZ:5};
export const inDance=p=>p.x>=DANCE.minX&&p.x<=DANCE.maxX&&p.z>=DANCE.minZ&&p.z<=DANCE.maxZ;
export const STOPS={plaza:{x:-3,z:7},stage:{x:-4.5,z:2},coaster:{x:2.2,z:-1}};
export const TABLES=[{id:0,x:-11,z:5.5,w:2.4,d:1.3,h:1.05},{id:1,x:0,z:7,w:2.4,d:1.3,h:1.05}];
export const FIXTURES=[{id:'stage',x:-4.5,z:-4.6,w:8,d:2.5,h:.65,color:'#e8904d'},...[-10,1].map((x,i)=>({id:'speaker'+i,x,z:-4.6,w:1.2,d:1.3,h:2.2,color:'#526e68'})),{id:'wheel',x:-12,z:-8.4,w:6,d:4.8,h:.25,color:'#87ab89'},...[-3.2,3.2].map((x,i)=>({id:'gate'+i,x,z:11.6,w:.45,d:.45,h:3.6,color:'#eea35a'}))];
export const TREES=[[-15,2],[-15,10],[-7,11],[10,11],[17,9],[17,-10],[2,-10]].map(([x,z])=>({x,z}));
export const OBSTACLES=[...TABLES,...FIXTURES,...TREES.map(t=>({...t,w:.5,d:.5}))].map(o=>({...o,x1:o.x-o.w/2,x2:o.x+o.w/2,z1:o.z-o.d/2,z2:o.z+o.d/2})).concat([{x1:3.5,x2:16.8,z1:-8.3,z2:6.3}]);
export const tableSpot=t=>({x:t.x,z:t.z+t.d/2+CONFIG.bodyRadius+.35});
export const nearTable=p=>TABLES.find(t=>Math.hypot(p.x-tableSpot(t).x,p.z-tableSpot(t).z)<.8);
export const canBoard=p=>Math.hypot(p.x-STOPS.coaster.x,p.z-STOPS.coaster.z)<1.0;
export const spawn=()=>({x:-2.2+(Math.random()-.5)*1.2,z:8.5+Math.random()*.3});
export function coasterPoint(progress){const p=progress>=1?0:Math.max(0,progress),a=p*Math.PI*2;return{x:10-6*Math.cos(a),z:-1+6*Math.sin(a),y:.85+Math.sin(Math.PI*p)**2*(3.6+2.5*Math.sin(a*2))}}
export const DEMO_DANCERS=[[-7,0],[-4.5,-.5],[-2,0],[-6,3],[-2.5,3.5]].map(([x,z],i)=>({id:'park-demo-'+i,nick:'시연 방문자',demo:true,x,z,phase:'dance',awake:true,tired:0,offset:i*.8,color:['#ffbf76','#cfb9ee','#a4dcc8','#f0acc0','#b3d2ee'][i]}));
