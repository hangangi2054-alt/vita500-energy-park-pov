import {createGardenVisuals} from './visuals.js';
import {SEATS} from './study-config.js';
import {REST_CHAIRS,seatPosition} from './study-navigation.js';

export class StudyScene{
  constructor(canvas,getImage){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.faces=[];this.hits=[];this.yaw=.25;this.pitch=.58;this.camera={x:0,z:2};this.zoom=42;
    for(const key of ['project','poly','box','ell','limb'])this[key]=this[key].bind(this);
    this.people=createGardenVisuals({ctx:this.ctx,proj:this.project,poly:this.poly,box:this.box,ell:this.ell,limb:this.limb,
      faces:()=>this.faces,zoom:()=>this.zoom,yaw:()=>this.yaw,product:getImage,
      awake:()=>this.player.awake,wakeAt:()=>this.player.wakeAt,nickname:()=>this.player.nick});
  }
  project([x,y,z]){
    const dx=x-this.camera.x,dz=z-this.camera.z;
    const rx=dx*Math.cos(this.yaw)-dz*Math.sin(this.yaw),rz=dx*Math.sin(this.yaw)+dz*Math.cos(this.yaw);
    const f=Math.max(.42,Math.min(1.45,1/(1-rz*.032)));
    return[this.w*(this.w<600?.5:.59)+rx*this.zoom*f,this.h*.60+(rz*Math.sin(this.pitch)-y*Math.cos(this.pitch))*this.zoom*f,rz*Math.cos(this.pitch)+y*Math.sin(this.pitch),f];
  }
  poly(vertices,color){const p=vertices.map(this.project);this.faces.push({p,color,d:p.reduce((a,p)=>a+p[2],0)/p.length})}
  box(x,y,z,w,h,d,col){
    const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2],u=v=>[v[0],v[1]+h,v[2]];
    this.poly([a,b,u(b),u(a)],this.shade(col,.83));this.poly([b,c,u(c),u(b)],this.shade(col,.72));
    this.poly([c,e,u(e),u(c)],col);this.poly([e,a,u(a),u(e)],this.shade(col,.9));this.poly([u(a),u(b),u(c),u(e)],this.shade(col,1.08));
  }
  shade(hex,k){let n=parseInt(hex.slice(1),16);return 'rgb('+[n>>16,n>>8&255,n&255].map(v=>Math.min(255,v*k)).join(',')+')'}
  ell(x,y,z,rx,ry,rz,col,n=9){
    for(let j=0;j<4;j++)for(let i=0;i<n;i++){
      const p=(a,t)=>[x+Math.cos(a)*Math.sin(t)*rx,y+Math.cos(t)*ry,z+Math.sin(a)*Math.sin(t)*rz];
      const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n,t=j*Math.PI/4,u=(j+1)*Math.PI/4;
      this.poly([p(a,t),p(b,t),p(b,u),p(a,u)],this.shade(col,.83+.16*Math.sin(a)**2));
    }
  }
  limb(a,b,r,col){this.poly([[a[0]-r,a[1],a[2]],[a[0]+r,a[1],a[2]],[b[0]+r,b[1],b[2]],[b[0]-r,b[1],b[2]]],col)}
  label(x,y,z,text,color='#645339',font='600 11px sans-serif'){
    const p=this.project([x,y,z]);this.faces.push({p:[],d:10000,draw:()=>{this.ctx.font=font;this.ctx.fillStyle=color;this.ctx.textAlign='center';this.ctx.fillText(text,p[0],p[1])}});
  }
  desk(seat,occupant,notes){
    const {x,z,id}=seat,B=this.box;
    B(x,.55,z+.58,2.25,.12,1.28,'#d7ac6a');
    for(const dx of [-.92,.92])B(x+dx,0,z+.58,.09,.58,1.05,'#89775b');
    // Back and side dividers form a warm, open-front cubicle.
    B(x,.6,z-.8,2.35,1.12,.10,'#c5a77a');
    B(x-1.15,.6,z+.65,.08,.72,1.15,'#e0c499');B(x+1.15,.6,z+.15,.08,.72,1.95,'#e0c499');
    B(x,.27,z-.16,.85,.14,.72,'#d57f36');B(x,.31,z-.5,.85,.60,.10,'#d57f36');
    B(x-.3,0,z-.1,.06,.3,.6,'#625c4d');B(x+.3,0,z-.1,.06,.3,.6,'#625c4d');
    // Open book, ruled pages, pen, notebooks, and an individual desk lamp.
    B(x+.1,.675,z+.55,.79,.04,.55,'#f6f0d4');B(x+.1,.71,z+.55,.014,.01,.54,'#b5a389');
    for(let i=0;i<4;i++)B(x+.3,.72,z+.38+i*.09,.29,.006,.012,'#beb5a0');
    B(x+.66,.69,z+.8,.40,.06,.5,'#efb94e');B(x+.67,.755,z+.8,.35,.02,.45,'#f7e8c0');
    B(x+.3,.73,z+.21,.36,.025,.025,'#655d53');
    B(x-.75,.69,z+.73,.32,.035,.25,'#62684c');B(x-.75,.72,z+.73,.035,.64,.035,'#63694e');
    B(x-.65,1.33,z+.73,.46,.16,.30,'#f4b235');
    this.ell(x-.57,.69,z+.63,.44,.006,.37,'#f6df9b',10);
    this.label(x,1.96,z-.8,String(id+1).padStart(2,'0'),occupant?'#986f3e':'#cf7229','700 10px sans-serif');
    if(!occupant){const p=this.project([x,.6,z+.5]);this.hits.push({type:'seat',seat:id,x:p[0],y:p[1],r:this.zoom*.9*p[3]})}
    if(notes>0){
      B(x-.35,.74,z+.35,.38,.018,.32,'#fbea84');this.people.miniCan(x-.7,.70,z+.3,.42);
      const p=this.project([x-.35,.78,z+.35]);this.hits.push({type:'note',owner:occupant.id,x:p[0],y:p[1],r:Math.max(18,this.zoom*.3*p[3])});
      this.label(x-.45,1.1,z+.32,'메모 + 에너지','#ce6929','700 10px sans-serif');
    }
  }
  render(player,others,demos,owners,noteCounts,t,dt){
    this.player=player;const c=this.canvas,ctx=this.ctx,dpr=Math.min(devicePixelRatio,2);this.w=c.clientWidth;this.h=c.clientHeight;
    if(c.width!==this.w*dpr||c.height!==this.h*dpr){c.width=this.w*dpr;c.height=this.h*dpr}
    const seat=SEATS[player.seat];const desired=player.onBreak?{x:player.x*.85,z:player.z-.4}:seat?{x:seat.x*.65,z:seat.z-.5}:{x:player.x*.5,z:2};
    this.camera.x+=(desired.x-this.camera.x)*Math.min(1,dt*2);this.camera.z+=(desired.z-this.camera.z)*Math.min(1,dt*2);
    const targetZoom=this.w<600?Math.min(this.w/10.5,this.h/16):Math.min(this.w/25,this.h/15);
    this.zoom=targetZoom*(player.onBreak?1.15:seat?1.25:1)*(player.phase==='drink'?1.12:1);
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#eee2cc';ctx.fillRect(0,0,this.w,this.h);this.faces=[];this.hits=[];
    this.poly([[-10,0,-9],[15.2,0,-9],[15.2,0,11],[-10,0,11]],'#d9c7a5');this.faces[0].d=-100000;
    for(let z=-9;z<11;z+=1.2){this.poly([[-10,.005,z],[10,.005,z],[10,.005,z+.018],[-10,.005,z+.018]],'#c8b793');this.faces.at(-1).d=-99999}
    const wallStart=this.faces.length;this.box(0,0,-8.5,20,4,.25,'#f2e7ce');this.box(-10,0,1.2,.25,4,19.5,'#e8d8b9');
    for(const f of this.faces.slice(wallStart))f.d=-90000;
    for(const x of [-6,0,6]){const n=this.faces.length;this.box(x,1.5,-8.32,3.3,1.9,.04,'#b2c4b7');this.box(x,2.39,-8.27,3.3,.05,.08,'#f6edd8');this.box(x,1.5,-8.27,.055,1.9,.08,'#f6edd8');for(const f of this.faces.slice(n))f.d=-80000}
    this.box(-9.3,0,-4.5,.8,2.8,5.5,'#a48256');
    for(let row=0;row<3;row++)for(let i=0;i<15;i++)this.box(-8.8,.2+row*.85,-7+i*.34,.12,.58,.25,['#df853a','#e5b94f','#8d9b79','#e6d9b0'][i%4]);
    this.poly([[9.7,.01,-8.5],[15.2,.01,-8.5],[15.2,.01,10],[9.7,.01,10]],'#e7d9bd');this.faces.at(-1).d=-99998;
    const corridorWalls=this.faces.length;this.box(9.5,0,-4.8,.25,2.4,7.4,'#e5d8bd');this.box(9.5,0,4.125,.25,2.4,4.35,'#e5d8bd');for(const f of this.faces.slice(corridorWalls))f.d-=3;
    this.label(12.5,2.6,.5,'잠깐 쉬어가는 복도','#99815b','600 11px sans-serif');
    for(const b of REST_CHAIRS){this.box(b.x,.37,b.z,1.45,.16,.8,'#d49a59');this.box(b.x,.5,b.z-.37,1.45,.65,.10,'#c28b52');for(const dx of [-.55,.55])this.box(b.x+dx,0,b.z,.08,.38,.65,'#776c55');const p=this.project([b.x,.6,b.z]);this.hits.push({type:'rest',bench:b.id,x:p[0],y:p[1],r:Math.max(18,this.zoom*.65*p[3])})}
    this.label(0,3.7,-8.1,'비타500 에너지 독서실','#b3662b','800 16px sans-serif');
    this.label(0,3.15,-8.1,'에너지는 그대로, 카페인은 제로','#8d7b5b','10px sans-serif');
    const all=[player,...others,...demos.map(p=>({...seatPosition(p.seat),...p}))];
    for(const s of SEATS){const occupant=all.find(p=>p.id===owners.get(s.id));this.desk(s,occupant,noteCounts.get(occupant?.id)||0)}
    for(const person of all){
      const phase=person.phase,pose=['study','sleepy','focus'].includes(phase)?phase:phase==='drink'?'drink':phase==='walk'?'walk':phase==='rest'?'rest':'idle';
      this.people.human(person.x,person.z,pose,person.demo?'#e4b96d':person.id===player.id?'#fff4d9':'#a9b9a3',t,person.id===player.id,person.nick,person.awake,person.wakeAt??-100);
      if(phase==='sleepy')this.label(person.x+.55,1.9+Math.sin(t)*.06,person.z,'Zzz','#9d8c77','italic 700 17px sans-serif');
      if(phase==='rest')this.label(person.x,2.05,person.z,'휴식 중','#8c806a','600 10px sans-serif');
      if(phase==='focus')this.label(person.x,2.2,person.z,'빡공모드','#e87920','700 10px sans-serif');
      if(person.id!==player.id){const p=this.project([person.x,1.1,person.z]);this.hits.push({type:'person',person,x:p[0],y:p[1],r:Math.max(20,this.zoom*.55*p[3])})}
    }
    this.faces.sort((a,b)=>a.d-b.d);
    for(const face of this.faces){if(face.draw){face.draw();continue}ctx.fillStyle=face.color;ctx.beginPath();face.p.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill()}
    c.dataset.state=JSON.stringify({seat:player.seat,phase:player.phase,awake:player.awake,onBreak:player.onBreak,restBench:player.restBench,x:player.x,z:player.z,peers:others.map(p=>({id:p.id,seat:p.seat,phase:p.phase}))});
  }
  hit(x,y){return ['note','person','rest','seat'].flatMap(type=>this.hits.filter(h=>h.type===type&&Math.hypot(h.x-x,h.y-y)<h.r))[0]}
}
