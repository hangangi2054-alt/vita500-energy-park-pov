import {StudyScene} from './study-scene.js';
import {createClubVisuals} from './club-visuals.js';
import {TABLES,FIXTURES,DANCE,DEMO_DANCERS,tableSpot} from './club-config.js';
export class ClubScene extends StudyScene{
 constructor(canvas,getImage){super(canvas,getImage);this.yaw=.12;this.pitch=.62;this.camera={x:0,z:1.3};this.avatarApi={ctx:this.ctx,proj:this.project,poly:this.poly,box:this.box,ell:this.ell,limb:this.limb,faces:()=>this.faces,zoom:()=>this.zoom,yaw:()=>this.yaw,product:getImage,awake:()=>this.player.awake,wakeAt:()=>-100,nickname:()=>this.player.nick,person:null};this.people=createClubVisuals(this.avatarApi)}
 projectFloor(sx,sy){const a=(sx-this.w*(this.w<600?.5:.59))/this.zoom,b=(sy-this.h*.60)/this.zoom,rz=b/(Math.sin(this.pitch)+.032*b),f=Math.max(.42,Math.min(1.45,1/(1-rz*.032))),rx=a/f;return{x:this.camera.x+rx*Math.cos(this.yaw)+rz*Math.sin(this.yaw),z:this.camera.z-rx*Math.sin(this.yaw)+rz*Math.cos(this.yaw)}}
 neon(points,color,width=2,depth=0){const q=points.map(this.project);this.faces.push({p:[],d:depth,draw:()=>{const ctx=this.ctx;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.shadowColor=color;ctx.shadowBlur=12;ctx.lineJoin='round';ctx.beginPath();q.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.lineWidth=Math.max(.7,width*.3);ctx.strokeStyle='#fff4df';ctx.shadowBlur=0;ctx.stroke();ctx.restore()}})}
 sign(x,y,z,text,size,color){const q=this.project([x,y,z]);this.faces.push({p:[],d:10000,draw:()=>{const ctx=this.ctx;ctx.save();ctx.textAlign='center';ctx.font='900 '+Math.max(10,this.zoom*q[3]*size)+'px sans-serif';ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=18;ctx.fillText(text,q[0],q[1]);ctx.shadowBlur=0;ctx.fillStyle='#fff2d8';ctx.globalAlpha=.65;ctx.fillText(text,q[0],q[1]);ctx.restore()}})}
 floorGlow(x,z,color,r=2){const q=this.project([x,.04,z]);this.faces.push({p:[],d:-75000,draw:()=>{const ctx=this.ctx;ctx.save();ctx.translate(q[0],q[1]);ctx.scale(1,.4);const radius=this.zoom*q[3]*r,g=ctx.createRadialGradient(0,0,0,0,0,radius);g.addColorStop(0,color);g.addColorStop(1,'#00000000');ctx.fillStyle=g;ctx.fillRect(-radius,-radius,radius*2,radius*2);ctx.restore()}})}
 render(player,others,t,dt){
  this.player=player;const c=this.canvas,ctx=this.ctx,dpr=Math.min(devicePixelRatio,2);this.w=c.clientWidth;this.h=c.clientHeight;if(c.width!==this.w*dpr||c.height!==this.h*dpr){c.width=this.w*dpr;c.height=this.h*dpr}
  this.camera.x+=(player.x*.78-this.camera.x)*Math.min(1,dt*2);this.camera.z+=((player.z*.65-1.4)-this.camera.z)*Math.min(1,dt*2);
  this.zoom=this.w<600?Math.min(this.w/8.8,this.h/15):Math.min(this.w/20.5,this.h/13);
  ctx.setTransform(dpr,0,0,dpr,0,0);const bg=ctx.createLinearGradient(0,0,0,this.h);bg.addColorStop(0,'#100e20');bg.addColorStop(1,'#090a13');ctx.fillStyle=bg;ctx.fillRect(0,0,this.w,this.h);this.faces=[];this.hits=[];
  this.poly([[-15,0,-12],[15,0,-12],[15,0,12],[-15,0,12]],'#191826');this.faces.at(-1).d=-100000;
  for(let x=-15;x<15;x+=2){this.poly([[x,.006,-12],[x+.018,.006,-12],[x+.018,.006,12],[x,.006,12]],'#343044');this.faces.at(-1).d=-99999}
  for(let z=-12;z<12;z+=2){this.poly([[-15,.006,z],[15,.006,z],[15,.006,z+.018],[-15,.006,z+.018]],'#343044');this.faces.at(-1).d=-99999}
  const wall=this.faces.length;this.box(0,0,-12,30.2,5.9,.22,'#1a1629');this.box(-15,0,0,.22,5.9,24,'#211a2e');for(const f of this.faces.slice(wall))f.d=-90000;
  this.neon([[-14.8,.15,11.8],[-14.8,.15,-11.8],[14.8,.15,-11.8],[14.8,.15,11.8]],'#fd9862',2,-85000);
  this.neon([[-14.8,5.6,9],[-14.8,5.6,-11.8],[14.8,5.6,-11.8]],'#bd81fa',2,-85000);
  for(let x=-13;x<=13;x+=2.6){this.box(x,0,-11.8,.08,5.6,.08,'#34273d');this.neon([[x,.3,-11.65],[x,4.9,-11.65]],x%5.2===0?'#ffad68':'#8b62bc',1,-83000)}
  const {minX:x1,maxX:x2,minZ:z1,maxZ:z2}=DANCE;
  for(let z=z1;z<z2;z+=1.75)for(let x=x1;x<x2;x+=1.8){const odd=(Math.round((x-x1)/1.8)+Math.round((z-z1)/1.75))%2;this.poly([[x,.014,z],[Math.min(x+1.73,x2),.014,z],[Math.min(x+1.73,x2),.014,Math.min(z+1.68,z2)],[x,.014,Math.min(z+1.68,z2)]],odd?'#3d2846':'#272c43');this.faces.at(-1).d=-80000}
  this.neon([[x1,.025,z1],[x2,.025,z1],[x2,.025,z2],[x1,.025,z2],[x1,.025,z1]],'#ffb965',2.5,-74000);
  this.neon([[x1+.22,.025,z1+.22],[x2-.22,.025,z1+.22],[x2-.22,.025,z2-.22],[x1+.22,.025,z2-.22],[x1+.22,.025,z1+.22]],'#a77bec',1,-74000);
  for(const [x,z,col]of [[-4,-1,'#f2823f24'],[4,1,'#be7cf52d'],[0,5,'#ffc56320']])this.floorGlow(x,z,col,5);
  for(const f of FIXTURES){this.box(f.x,0,f.z,f.w,f.h,f.d,f.color);if(f.id.startsWith('speaker')){for(const y of [.85,2.25]){this.ell(f.x,y,f.z+f.d/2+.025,.61,.61,.04,'#0f101c',12);this.ell(f.x,y,f.z+f.d/2+.07,.34,.34,.04,'#514358',12);const ring=Array.from({length:25},(_,i)=>[f.x+Math.cos(i*Math.PI/12)*.52,y+Math.sin(i*Math.PI/12)*.52,f.z+f.d/2+.09]);this.neon(ring,'#db926b',1.1,5)}this.box(f.x,3.1,f.z+.92,.65,.08,.04,'#febd78')}if(f.id.startsWith('light')){this.neon([[f.x,.3,f.z+.25],[f.x,3.8,f.z+.25]],'#d7a0ff',3,6);this.floorGlow(f.x,f.z,'#ac6bdf40',3)}}
  this.box(0,.8,-9.65,4.8,1.25,1.2,'#211c31');this.box(0,2.05,-9.65,5,.12,1.35,'#dd955e');this.neon([[-2.35,.97,-8.99],[-2.35,1.9,-8.99],[2.35,1.9,-8.99],[2.35,.97,-8.99],[-2.35,.97,-8.99]],'#ffbc77',2,6);
  for(const x of [-1.4,1.4]){this.box(x,2.2,-9.65,.8,.12,.7,'#100e1a');this.ell(x,2.33,-9.65,.23,.03,.23,'#b18ec2',12)}
  // LED equalizer wall and two concentric neon portals frame the stage.
  const panels=this.faces.length;this.box(0,1.1,-11.55,13.4,4.1,.10,'#0d0e19');for(const f of this.faces.slice(panels))f.d=-82000;
  for(let i=0;i<26;i++){const x=-6.1+i*.49,h=.35+(Math.sin(i*.8+t*.65)+1)*.33;for(let j=0;j<h*5;j++){this.box(x,1.3+j*.16,-11.46,.27,.10,.035,i%3?'#b46998':'#d89559');for(const f of this.faces.slice(-5))f.d=-81000}}
  for(let k=0;k<2;k++){const w=7+k*.55,low=.95-k*.15,top=5.2+k*.3;this.neon([[-w,low,-11.2],[-w,top,-11.2],[w,top,-11.2],[w,low,-11.2]],k?'#b57aed':'#ffab65',2.5,-80001)}
  this.sign(0,3,-11.1,'ENERGY',.9,'#ff9861');this.sign(0,2.25,-11.05,'NO CAFFEINE',.32,'#dfb6fa');
  this.sign(-12,3.1,-6,'비타500',.45,'#ffb96e');this.sign(-12,2.4,-6,'ENERGY ON',.23,'#cbb4ef');
  for(const x of [-6,-3,0,3,6]){this.box(x,5.25,-8.8,.38,.3,.45,'#51445b');const dx=Math.sin(t*.24+x)*2.2;this.poly([[x-.12,5.15,-8.5],[x+.12,5.15,-8.5],[x+dx+1.1,.05,3],[x+dx-1.1,.05,3]],x%2?'rgba(191,135,255,.045)':'rgba(255,181,86,.055)');this.floorGlow(x+dx,3,x%2?'#ac7de028':'#ffae4c21',2.2)}
  for(const table of TABLES){const {x,z,w,d,h}=table;this.box(x,h-.16,z,w,.16,d,'#a26e58');this.box(x,0,z,w*.73,h-.16,d*.72,'#282334');this.neon([[x-w/2,h,z+d/2+.01],[x+w/2,h,z+d/2+.01]],'#ffbb77',2,10);for(let i=0;i<4;i++)this.people.miniCan(x-.72+i*.48,h,z-.15,.48);const spot=tableSpot(table);this.floorGlow(spot.x,spot.z,'#ed9b4d38',1.1);const circle=Array.from({length:25},(_,i)=>[spot.x+Math.cos(i*Math.PI/12)*.7,.022,spot.z+Math.sin(i*Math.PI/12)*.55]);this.neon(circle,'#d69c6d',1,-73000);this.label(x,h+1.15,z,'충전 테이블 ↟','#ffe2a4','700 11px sans-serif');const q=this.project([x,h,z]);this.hits.push({type:'table',table,x:q[0],y:q[1],r:Math.max(24,this.zoom*1.05*q[3])});}
  const all=[...DEMO_DANCERS.map(p=>({...p,phase:(t+p.offset)%16<2?'special':'dance'})),...others,player];
  for(const p of all){this.avatarApi.person=p;const me=p.id===player.id;this.people.human(p.x,p.z,p.phase==='game'?'idle':p.phase,me?'#ffbe70':p.color||'#cab6ef',t+(p.offset||0),me,p.demo?'시연 댄서':p.nick,p.awake,-100);const q=this.project([p.x,1.05,p.z]);if(!me)this.hits.push({type:p.demo?'demo':'person',person:p,x:q[0],y:q[1],r:Math.max(21,this.zoom*.60*q[3])});if(p.heartLeft>0)this.label(p.x+.5,2.65+(3-p.heartLeft)*.12,p.z,'♥  ♥','#ff91a1','700 20px sans-serif');if(p.tired>.8)this.label(p.x,2.55,p.z,'휴… 잠깐 충전할까?','#ffdc9a','600 10px sans-serif');if(p.wakePulse>0)this.label(p.x,2.7,p.z,'ϟ 충전 ON','#ffe28b','900 19px sans-serif');}
  this.faces.sort((a,b)=>a.d-b.d);for(const face of this.faces){if(face.draw){face.draw();continue}ctx.fillStyle=face.color;ctx.beginPath();face.p.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill()}
  c.dataset.state=JSON.stringify({x:player.x,z:player.z,phase:player.phase,tired:player.tired,paused:player.paused,awake:player.awake,heartLeft:player.heartLeft,demoCount:DEMO_DANCERS.length,zoom:this.zoom,peers:others.map(p=>({id:p.id,nick:p.nick,x:p.x,z:p.z,phase:p.phase,heartLeft:p.heartLeft}))});
 }
 hit(x,y){return ['person','demo','table'].flatMap(type=>this.hits.filter(h=>h.type===type&&Math.hypot(h.x-x,h.y-y)<h.r))[0]}
}
