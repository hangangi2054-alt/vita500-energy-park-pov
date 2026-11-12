import {StudyScene} from './study-scene.js';
import {createClubVisuals} from './club-visuals.js';
import {TABLES,FIXTURES,TREES,DEMO_DANCERS,DANCE,STOPS,tableSpot,coasterPoint} from './park-config.js';
export class ParkScene extends StudyScene{
 constructor(canvas,getImage){super(canvas,getImage);this.yaw=.12;this.pitch=.65;this.camera={x:0,z:5};this.height=0;this.lift=0;this.avatarApi={ctx:this.ctx,proj:this.project,poly:this.poly,box:this.box,ell:this.ell,limb:this.limb,faces:()=>this.faces,zoom:()=>this.zoom,yaw:()=>this.yaw,product:getImage,awake:()=>this.player.awake,wakeAt:()=>-100,nickname:()=>this.player.nick,person:null};this.people=createClubVisuals(this.avatarApi)}
 project([x,y,z]){y+=(this.lift||0)-(this.height||0);const dx=x-this.camera.x,dz=z-this.camera.z,rx=dx*Math.cos(this.yaw)-dz*Math.sin(this.yaw),rz=dx*Math.sin(this.yaw)+dz*Math.cos(this.yaw),f=Math.max(.5,Math.min(1.4,1/(1-rz*.022)));return[this.w*(this.w<600?.5:.56)+rx*this.zoom*f,this.h*.64+(rz*Math.sin(this.pitch)-y*Math.cos(this.pitch))*this.zoom*f,rz*Math.cos(this.pitch)+y*Math.sin(this.pitch),f]}
 projectFloor(x,y){const a=(x-this.w*(this.w<600?.5:.56))/this.zoom,b=(y-this.h*.64)/this.zoom,rz=(b-this.height*Math.cos(this.pitch))/(Math.sin(this.pitch)+.022*b),f=Math.max(.5,Math.min(1.4,1/(1-rz*.022))),rx=a/f;return{x:this.camera.x+rx*Math.cos(this.yaw)+rz*Math.sin(this.yaw),z:this.camera.z-rx*Math.sin(this.yaw)+rz*Math.cos(this.yaw)}}
 line(a,b,color,width=2){const p=this.project(a),q=this.project(b);this.faces.push({p:[],d:(p[2]+q[2])/2,draw:()=>{const c=this.ctx;c.save();c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke();c.restore()}})}
 sign(x,y,z,text,color='#d67e35',font='800 12px sans-serif'){this.label(x,y,z,text,color,font)}
 render(player,others,t,dt){
  this.player=player;const c=this.canvas,ctx=this.ctx,dpr=Math.min(devicePixelRatio,2);this.w=c.clientWidth;this.h=c.clientHeight;if(c.width!==this.w*dpr||c.height!==this.h*dpr){c.width=this.w*dpr;c.height=this.h*dpr}
  const riding=player.phase==='ride',desired=riding?{x:player.x-.5,z:player.z-.5}:{x:player.x*(this.w<600?.9:.7)+1,z:this.w<600?player.z-2.2:player.z*.58+.4},desiredHeight=riding?coasterPoint(player.rideProgress).y*.75:0;
  this.camera.x+=(desired.x-this.camera.x)*Math.min(1,dt*2);this.camera.z+=(desired.z-this.camera.z)*Math.min(1,dt*2);this.height+=(desiredHeight-this.height)*Math.min(1,dt*2);
  this.zoom=this.w<600?Math.min(this.w/10,this.h/22):Math.min(this.w/29,this.h/18.8);
  ctx.setTransform(dpr,0,0,dpr,0,0);const sky=ctx.createLinearGradient(0,0,0,this.h);sky.addColorStop(0,'#cde9e9');sky.addColorStop(1,'#edf0cc');ctx.fillStyle=sky;ctx.fillRect(0,0,this.w,this.h);
  ctx.fillStyle='#fffbee66';for(const [x,y,s]of [[.19,.12,44],[.55,.08,32],[.83,.18,46]]){ctx.beginPath();ctx.ellipse(this.w*x,this.h*y,s*2,s*.4,0,0,Math.PI*2);ctx.fill()}
  this.faces=[];this.hits=[];const B=this.box;
  this.poly([[-18,0,-14],[20,0,-14],[20,0,16],[-18,0,16]],'#a4c68b');this.faces.at(-1).d=-100000;
  // Broad cream paths, warm plaza paving, and a separate ride enclosure.
  B(-3,.005,5,16,.015,16,'#f0dfba');for(const f of this.faces.slice(-5))f.d=-90000;
  B(0,.005,10.5,6,.02,8,'#f1e4c3');for(const f of this.faces.slice(-5))f.d=-90000;
  B(2,.005,-1,5,.02,5,'#ecdfbf');for(const f of this.faces.slice(-5))f.d=-90000;
  B(10,.005,-1,13.5,.02,15,'#bad39a');for(const f of this.faces.slice(-5))f.d=-90000;
  for(let x=-10;x<=3;x+=1.5){this.poly([[x,.03,-2],[x+.015,.03,-2],[x+.015,.03,12],[x,.03,12]],'#deceaa');this.faces.at(-1).d=-85000}
  for(let z=-2;z<=12;z+=1.5){this.poly([[-11,.03,z],[4,.03,z],[4,.03,z+.015],[-11,.03,z+.015]],'#deceaa');this.faces.at(-1).d=-85000}
  for(const tree of TREES){B(tree.x,0,tree.z,.42,1.9,.42,'#a98b60');this.ell(tree.x,2.5,tree.z,1.3,1.5,1.1,'#78aa75',10);this.ell(tree.x-.4,2,tree.z+.3,1.1,.9,.9,'#90bb7c',10)}
  const stage=FIXTURES[0];B(stage.x,0,stage.z,stage.w,stage.h,stage.d,stage.color);B(stage.x,.65,stage.z-.95,7.6,1.75,.13,'#f1c785');B(stage.x,2.4,stage.z-.95,7.9,.15,.32,'#ffe1a0');
  this.sign(stage.x,2.02,stage.z-.8,'VITA500 ENERGY STAGE','#ca7331','900 15px sans-serif');this.sign(stage.x,1.45,stage.z-.78,'NO CAFFEINE · 에너지는 그대로','#a1834c','700 10px sans-serif');
  for(const speaker of FIXTURES.filter(f=>f.id.startsWith('speaker'))){B(speaker.x,0,speaker.z,speaker.w,speaker.h,speaker.d,speaker.color);for(const y of [.6,1.6]){this.ell(speaker.x,y,speaker.z+.67,.34,.34,.03,'#3e5c53',10);this.ell(speaker.x,y,speaker.z+.71,.18,.18,.02,'#8ca78b',10)}}
  for(let i=0;i<7;i++){const x=-8+i*1.16;B(x,2.55,-5.1,.035,.8,.035,'#ad9271');this.poly([[x,3.32,-5.1],[x+.65,3.12,-5.1],[x,2.91,-5.1]],['#f2a155','#f5d17c','#a6cba1'][i%3])}
  B(-4.5,.035,1.8,7.4,.02,7.2,'#e4bd80');for(const f of this.faces.slice(-5))f.d=-80000;for(let i=0;i<5;i++){this.poly([[-8,.065,-1+i*1.4],[-1,.065,-1+i*1.4],[-1,.065,-.98+i*1.4],[-8,.065,-.98+i*1.4]],'#d7ac76');this.faces.at(-1).d=-79000}
  // Ferris wheel is scenery; the rollercoaster is the interactive attraction.
  const wx=-12,wz=-8.4,cy=4.1,r=3.5;B(wx,0,wz,7.5,.25,4.8,'#88b089');this.line([wx-2.3,.2,wz],[wx,cy,wz],'#e0b575',6);this.line([wx+2.3,.2,wz],[wx,cy,wz],'#e0b575',6);
  for(let i=0;i<72;i++){const a=i*Math.PI/36,b=(i+1)*Math.PI/36;this.line([wx+Math.cos(a)*r,cy+Math.sin(a)*r,wz],[wx+Math.cos(b)*r,cy+Math.sin(b)*r,wz],'#f5d297',3);if(i%9===0){const theta=a+t*.045,px=wx+Math.cos(theta)*r,py=cy+Math.sin(theta)*r;this.line([wx,cy,wz],[px,py,wz],'#d0b58b',1.5);B(px,py-.7,wz,.66,.55,.65,['#e9a46a','#a6c5ae','#d6b6d4'][i%3]);B(px,py-.15,wz,.72,.09,.7,'#ffe2a3')}}
  this.ell(wx,cy,wz+.04,.25,.25,.13,'#f0b365',12);this.sign(wx,8.2,wz,'ENERGY PARK','#df9442','900 13px sans-serif');
  for(const table of TABLES){const {x,z,w,d,h}=table;B(x,h-.15,z,w,.15,d,'#ddae73');B(x,0,z,w*.78,h-.15,d*.7,'#f1c78a');for(const dx of [-w/2,w/2])B(x+dx,0,z-.45,.06,2.5,.06,'#b69b74');for(let i=0;i<6;i++){const xx=x-w/2+i*w/6;this.poly([[xx,2.7,z-.85],[xx+w/6,2.7,z-.85],[xx+w/6,2.35,z+.8],[xx,2.35,z+.8]],i%2?'#fff0bf':'#f4ae61')}
   for(let i=0;i<4;i++)this.people.miniCan(x-.66+i*.44,h,z,.48);this.sign(x,1.9,z+.1,'비타500 에너지 충전','#b67c3d','700 10px sans-serif');const q=this.project([x,h,z]);this.hits.push({type:'table',table,x:q[0],y:q[1],r:Math.max(23,this.zoom*1.1*q[3])});
  }
  // Entry arch and pennants establish a theme park, with no reading-room buildings.
  for(const x of [-3.2,3.2]){B(x,0,11.6,.45,4.8,.45,'#e8a158');B(x,4.8,11.6,.75,.18,.75,'#f6cf84')}
  B(0,4.35,11.6,6.8,.65,.3,'#f5cd80');this.sign(0,4.54,11.85,'VITA500 ENERGY PARK','#b8722e','900 16px sans-serif');
  for(const x of [-4.4,4.4])for(let j=0;j<3;j++){const q=this.project([x+j*.2,2.4+j*.3,11]);this.faces.push({p:[],d:q[2]+.1,draw:()=>{ctx.fillStyle=['#eab16c','#eacc8b','#b4c5d4'][j];ctx.beginPath();ctx.ellipse(q[0],q[1],7*q[3],10*q[3],.12,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c6b18b';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(q[0],q[1]+8*q[3]);ctx.lineTo(q[0],q[1]+43*q[3]);ctx.stroke()}})}
  for(let i=0;i<96;i++){const p=coasterPoint(i/96),q=coasterPoint((i+1)/96),dx=q.x-p.x,dz=q.z-p.z,l=Math.hypot(dx,dz)||1,nx=dz/l*.3,nz=-dx/l*.3;this.line([p.x+nx,p.y,p.z+nz],[q.x+nx,q.y,q.z+nz],'#e5913e',2);this.line([p.x-nx,p.y,p.z-nz],[q.x-nx,q.y,q.z-nz],'#edb254',2);if(i%3===0)this.line([p.x+nx,p.y,p.z+nz],[p.x-nx,p.y,p.z-nz],'#b89c6d',1);if(i%8===0){B(p.x,0,p.z,.15,p.y,.15,'#83a07c');this.line([p.x-.65,0,p.z],[p.x,p.y,p.z],'#91ad86',1.3)}}
  for(let z=-8;z<=6.3;z+=1.5)for(const x of [3.5,16.8]){if(x===3.5&&Math.abs(z+1)<1.6)continue;B(x,0,z,.075,.8,.075,'#a8aa77');this.line([x,.58,z],[x,.58,Math.min(6.3,z+1.5)],'#b4b983',1.1)}
  B(4,.1,-1,1.8,.32,2,'#ceae78');B(2.8,0,-2.5,.1,2.4,.1,'#b29569');B(2.8,2.25,-1,.12,.2,3.2,'#f1b768');this.sign(2.3,2,-1,'ENERGY COASTER →','#d28a3c','800 12px sans-serif');
  const station=this.project([STOPS.coaster.x,.5,STOPS.coaster.z]);this.hits.push({type:'ride',x:station[0],y:station[1],r:Math.max(23,this.zoom*.85*station[3])});
  const riders=[player,...others].filter(p=>p.phase==='ride');for(const p of riders.length?riders:[{rideProgress:0}]){const c=coasterPoint(p.rideProgress);B(c.x,c.y-.15,c.z,1.05,.4,1.3,'#ef9c40');B(c.x,c.y+.25,c.z-.45,1.05,.55,.15,'#f4c275');for(const dx of [-.43,.43]){this.ell(c.x+dx,c.y-.18,c.z,.12,.12,.3,'#647d64',8);this.line([c.x+dx,c.y+.3,c.z+.35],[c.x+dx,c.y+.85,c.z+.35],'#9a9c70',2)}this.line([c.x-.43,c.y+.85,c.z+.35],[c.x+.43,c.y+.85,c.z+.35],'#9a9c70',3)}
  for(const p of [...DEMO_DANCERS,...others,player]){this.avatarApi.person=p;const me=p.id===player.id;this.lift=p.phase==='ride'?coasterPoint(p.rideProgress).y+.3:0;this.people.human(p.x,p.z,p.phase==='game'?'idle':p.phase==='ride'?'focus':p.phase,me?'#ffc574':p.color||'#b0d2bc',t+(p.offset||0),me,p.demo?'시연 방문자':p.nick,p.awake,-100);this.lift=0;const q=this.project([p.x,1.05,p.z]);if(!me&&p.phase!=='ride')this.hits.push({type:p.demo?'demo':'person',person:p,x:q[0],y:q[1],r:Math.max(21,this.zoom*.6*q[3])});if(p.heartLeft>0)this.sign(p.x+.5,2.5,p.z,'♥ ♥','#e78c8e','800 18px sans-serif');if(p.wakePulse>0)this.sign(p.x,2.8,p.z,'ϟ ENERGY ON','#d98c29','900 18px sans-serif')}
  this.faces.sort((a,b)=>a.d-b.d);for(const f of this.faces){if(f.draw){f.draw();continue}ctx.fillStyle=f.color;ctx.beginPath();f.p.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill()}
  c.dataset.state=JSON.stringify({x:player.x,z:player.z,phase:player.phase,tired:player.tired,rideProgress:player.rideProgress||0,paused:player.paused,demos:DEMO_DANCERS.length,peers:others.map(p=>({id:p.id,nick:p.nick,x:p.x,z:p.z,phase:p.phase,rideProgress:p.rideProgress}))});
 }
 hit(x,y){return ['person','demo','table','ride'].flatMap(type=>this.hits.filter(h=>h.type===type&&Math.hypot(h.x-x,h.y-y)<h.r))[0]}
}
