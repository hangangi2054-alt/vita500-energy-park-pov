// First-person coaster camera for the park's existing 2D canvas renderer.
// Uses the same synchronized coasterPoint() track as the rest of the park.
import {coasterPoint, TREES} from './park-config.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const track = t => coasterPoint(((t % 1) + 1) % 1);
const subtract = (a,b) => ({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot = (a,b) => a.x*b.x+a.y*b.y+a.z*b.z;
const normal = v => {const len=Math.hypot(v.x,v.y,v.z)||1;return {x:v.x/len,y:v.y/len,z:v.z/len}};

// Exposed for tests and future camera customization.
export function coasterCamera(progress) {
 const t=clamp(progress,0,.999999),position=track(t);
 const ahead=track(t+.0025),behind=track(t-.0025);
 const forward=normal(subtract(ahead,behind));
 const right=normal({x:forward.z,y:0,z:-forward.x});
 const up=normal({x:forward.y*right.z,y:forward.z*right.x-forward.x*right.z,z:-forward.y*right.x});
 return {position:{x:position.x,y:position.y+.78,z:position.z},forward,right,up};
}

export function drawCoasterPOV(ctx,w,h,progress,seconds=0) {
 const camera=coasterCamera(progress);
 const focal=Math.min(w*1.05,h*1.4),horizon=h*.47;
 const bank=.07*Math.sin(progress*TAU*2);
 const rollCos=Math.cos(bank),rollSin=Math.sin(bank);
 function space(point){const delta=subtract(point,camera.position);return {x:dot(delta,camera.right),y:dot(delta,camera.up),z:dot(delta,camera.forward)}}
 function project(point){const v=space(point);if(v.z<.18)return null;const x=v.x*rollCos-v.y*rollSin,y=v.x*rollSin+v.y*rollCos;return {x:w*.5+x*focal/v.z,y:horizon-y*focal/v.z,z:v.z}}
 function stroke3(a,b,color,width=2){let v=space(a),q=space(b);if(v.z<.2&&q.z<.2)return;
  if(v.z<.2){const f=(.2-v.z)/(q.z-v.z);v={x:v.x+(q.x-v.x)*f,y:v.y+(q.y-v.y)*f,z:.2}}
  if(q.z<.2){const f=(.2-q.z)/(v.z-q.z);q={x:q.x+(v.x-q.x)*f,y:q.y+(v.y-q.y)*f,z:.2}}
  const transform=p=>{const x=p.x*rollCos-p.y*rollSin,y=p.x*rollSin+p.y*rollCos;return {x:w*.5+x*focal/p.z,y:horizon-y*focal/p.z}};
  const p=transform(v),r=transform(q);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(r.x,r.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
 const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#75c8ed');sky.addColorStop(.58,'#d6f2e6');sky.addColorStop(1,'#d9e4b6');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 const ground=project({x:camera.position.x+camera.forward.x*80,y:0,z:camera.position.z+camera.forward.z*80});
 // A distant park backdrop keeps the view understandable even at the top of a hill.
 const grassY=clamp(ground?.y??h*.87,h*.48,h*.92);ctx.fillStyle='#a5c98d';ctx.fillRect(0,grassY,w,h-grassY);
 ctx.fillStyle='rgba(255,255,255,.5)';for(const [x,y,s] of [[.15,.14,42],[.58,.1,32],[.89,.19,38]]){ctx.beginPath();ctx.ellipse(w*x,h*y,s*1.7,s*.37,0,0,TAU);ctx.fill()}
 // Park scenery is projected into the same first-person view as the track.
 for(const tree of TREES){const base={x:tree.x,y:0,z:tree.z},top={...base,y:2.7};const p=project(top);if(!p||p.z>55)continue;stroke3(base,top,'#8f8556',clamp(12/p.z,1,7));const crown=project({...top,y:3});if(crown){ctx.beginPath();ctx.fillStyle='#70a56e';ctx.ellipse(crown.x,crown.y,clamp(focal*1.15/p.z,3,w),clamp(focal*1.25/p.z,3,h),0,0,TAU);ctx.fill()}}
 // Ferris wheel visible from the coaster.
 const center={x:-12,y:4.1,z:-8.4},radius=3.5;for(let i=0;i<32;i++){const a=i*TAU/32,b=(i+1)*TAU/32;stroke3({x:center.x+radius*Math.cos(a),y:center.y+radius*Math.sin(a),z:center.z},{x:center.x+radius*Math.cos(b),y:center.y+radius*Math.sin(b),z:center.z},'#f0bb75',2)}
 stroke3({x:center.x-2.2,y:0,z:center.z},center,'#c8a56c',3);stroke3({x:center.x+2.2,y:0,z:center.z},center,'#c8a56c',3);
 // Draw far-to-near samples of the ACTUAL shared rollercoaster track.
 // The horizontal normal provides parallel tracks around tight curves.
 const samples=[];
 for(let i=0;i<=110;i++){
  const t=progress+.001+i*.0022,p=track(t),next=track(t+.0007),prev=track(t-.0007);
  const dx=next.x-prev.x,dz=next.z-prev.z,length=Math.hypot(dx,dz)||1,nx=dz/length,nz=-dx/length;
  const offset=s=>({x:p.x+nx*s,y:p.y,z:p.z+nz*s});
  samples.push({p,left:offset(-.38),right:offset(.38),leftSide:offset(-.52),rightSide:offset(.52)});
 }
 for(let i=samples.length-2;i>=0;i--){const a=samples[i],b=samples[i+1];
  stroke3(a.left,b.left,'#ed8e29',clamp(focal/(space(a.left).z*13),1.4,12));
  stroke3(a.right,b.right,'#ffd078',clamp(focal/(space(a.right).z*15),1.4,10));
  if(i%3===0)stroke3(a.leftSide,a.rightSide,'#bd8d5a',clamp(focal/(space(a.p).z*26),1,8));
  if(i%9===0){stroke3({x:a.p.x,y:0,z:a.p.z},a.p,'#8eac87',clamp(focal/(space(a.p).z*45),1,4))}
 }
 // Fixed front car and safety bar anchor the camera to a rider's seat.
 ctx.save();const shake=Math.sin(seconds*21)*1.5+Math.sin(seconds*36)*.7;ctx.translate(0,shake);
 const seatTop=h*.865;const shell=ctx.createLinearGradient(0,seatTop,0,h);shell.addColorStop(0,'#ffc96d');shell.addColorStop(1,'#df8130');ctx.fillStyle=shell;ctx.beginPath();ctx.moveTo(-w*.07,h);ctx.lineTo(w*.12,seatTop);ctx.quadraticCurveTo(w*.5,h*.825,w*.88,seatTop);ctx.lineTo(w*1.07,h);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#5c765b';ctx.lineWidth=clamp(w*.018,8,18);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(w*.18,h*.96);ctx.quadraticCurveTo(w*.5,h*.88,w*.82,h*.96);ctx.stroke();ctx.restore();
 ctx.fillStyle='rgba(22,57,56,.65)';ctx.font=`800 ${clamp(w*.027,12,19)}px system-ui,sans-serif`;ctx.textAlign='center';ctx.fillText('🎢  ROLLER COASTER · POV',w*.5,Math.max(30,h*.08));
 ctx.font=`700 ${clamp(w*.023,11,15)}px system-ui,sans-serif`;ctx.fillStyle='rgba(33,70,65,.8)';ctx.fillText(`${Math.round(progress*100)}%  ·  앞을 보고 달려요!`,w*.5,Math.max(50,h*.08+23));
 return camera;
}
