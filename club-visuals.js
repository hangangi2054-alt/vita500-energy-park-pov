// Project the supplied front artwork onto physical surfaces; never recreate its type.
export function imageTriangle(ctx, image, source, dest) {
  const [s0,s1,s2]=source,[d0,d1,d2]=dest;
  const sx1=s1[0]-s0[0],sy1=s1[1]-s0[1],sx2=s2[0]-s0[0],sy2=s2[1]-s0[1];
  const dx1=d1[0]-d0[0],dy1=d1[1]-d0[1],dx2=d2[0]-d0[0],dy2=d2[1]-d0[1];
  const det=sx1*sy2-sx2*sy1;
  if(Math.abs(det)<.0001)return;
  const a=(dx1*sy2-dx2*sy1)/det,b=(dy1*sy2-dy2*sy1)/det;
  const c=(dx2*sx1-dx1*sx2)/det,d=(dy2*sx1-dy1*sx2)/det;
  const center=[(d0[0]+d1[0]+d2[0])/3,(d0[1]+d1[1]+d2[1])/3];const expand=p=>{let vx=p[0]-center[0],vy=p[1]-center[1],l=Math.hypot(vx,vy)||1;return[p[0]+vx/l*.65,p[1]+vy/l*.65]};ctx.save();ctx.beginPath();ctx.moveTo(...expand(d0));ctx.lineTo(...expand(d1));ctx.lineTo(...expand(d2));ctx.closePath();ctx.clip();
  ctx.transform(a,b,c,d,d0[0]-a*s0[0]-c*s0[1],d0[1]-b*s0[0]-d*s0[1]);
  ctx.drawImage(image,0,0);ctx.restore();
}
export function imageQuad(ctx,image,source,dest){
  imageTriangle(ctx,image,[source[0],source[1],source[2]],[dest[0],dest[1],dest[2]]);
  imageTriangle(ctx,image,[source[0],source[2],source[3]],[dest[0],dest[2],dest[3]]);
}

export function createClubVisuals(api){
  const {ctx,proj,poly,box,ell,limb}=api;
  const crop={x:11,y:21,w:184,h:465};
  function panel(x,y,z,w,h,draw){
    const points=[[x-w/2,y+h,z],[x+w/2,y+h,z],[x+w/2,y,z],[x-w/2,y,z]].map(proj);
    api.faces().push({p:[],d:points.reduce((sum,p)=>sum+p[2],0)/4+.025,draw:()=>draw(points)});
  }
  function artwork(x,y,z,w,h){
    if(!api.product())return;
    panel(x,y,z,w,h,points=>imageQuad(ctx,api.product(),[
      [crop.x,crop.y],[crop.x+crop.w,crop.y],[crop.x+crop.w,crop.y+crop.h],[crop.x,crop.y+crop.h]
    ],points));
  }
  function cylinder(x,y,z,r,h,color,n=10){
    for(let i=0;i<n;i++){
      const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n;
      poly([[x+Math.sin(a)*r,y,z+Math.cos(a)*r],[x+Math.sin(b)*r,y,z+Math.cos(b)*r],
        [x+Math.sin(b)*r,y+h,z+Math.cos(b)*r],[x+Math.sin(a)*r,y+h,z+Math.cos(a)*r]],color);
    }
    poly(Array.from({length:n},(_,i)=>[x+Math.sin(i*Math.PI*2/n)*r,y+h,z+Math.cos(i*Math.PI*2/n)*r]),'#dfe4df');
  }
  function miniCan(x,y,z,h=.48){
    const r=h*.195;
    cylinder(x,y,z,r,h,'#ff5521',8);
    artwork(x,y+.015,z+r+.005,r*1.85,h-.03);
    cylinder(x,y,z,r*1.025,.018,'#adb5b0',8);
  }
  function textPanel(x,y,z,w,h,text,size,color='#f4f3df',background=null){
    panel(x,y,z,w,h,points=>{
      if(background){ctx.fillStyle=background;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill()}
      const p=proj([x,y+h*.45,z]);ctx.textAlign='center';ctx.font='800 '+Math.max(8,api.zoom()*points[0][3]*size)+'px sans-serif';ctx.fillStyle=color;ctx.fillText(text,p[0],p[1]);
    });
  }
  function vending(m,i){
    const x=m.x,z=m.z;
    // Powder-coated shell, inset insulated door, metal feet and lit header.
    let start=api.faces().length;box(x,.1,z,2.18,3.58,1.36,'#f45124');for(const face of api.faces().slice(start))face.d-=4;
    box(x-.82,0,z,.24,.17,.78,'#33483d');box(x+.82,0,z,.24,.17,.78,'#33483d');
    box(x,3.1,z+.715,2.08,.5,.08,'#202c25');
    textPanel(x,3.12,z+.77,2,.42,'비타500 ENERGY',.23,'#f5f4e7');
    start=api.faces().length;box(x-.24,.62,z+.72,1.48,2.42,.10,'#1e3029');for(const face of api.faces().slice(start))face.d-=3;
    start=api.faces().length;box(x-.24,.7,z+.78,1.28,2.23,.035,'#3d5546');for(const face of api.faces().slice(start))face.d-=3;
    for(let row=0;row<4;row++){
      const y=.76+row*.53;
      box(x-.24,y-.035,z+.84,1.3,.055,.06,'#d9e4d7');
      for(let col=0;col<5;col++)miniCan(x-.75+col*.255,y,z+.87,.45);
      box(x-.24,y+.48,z+.80,1.25,.023,.025,'#faffd9');
    }
    // Glass sits in front of the products, with a subtle reflected streak.
    poly([[x-.89,.71,z+1],[x+.41,.71,z+1],[x+.41,2.95,z+1],[x-.89,2.95,z+1]],'rgba(191,230,220,.08)');
    poly([[x-.85,2.85,z+1.01],[x-.69,2.9,z+1.01],[x+.25,.8,z+1.01],[x+.09,.8,z+1.01]],'rgba(255,255,255,.17)');
    box(x-.96,.62,z+1,.07,2.42,.08,'#253a30');box(x+.49,.62,z+1,.07,2.42,.08,'#253a30');
    box(x+.76,1.7,z+.78,.36,.64,.10,'#25392f');
    textPanel(x+.76,1.92,z+.85,.30,.23,'PUSH',.085,'#d5edc2','#395b42');
    box(x+.77,1.39,z+.83,.24,.045,.025,'#c7d2c8');
    box(x+.77,1.03,z+.83,.17,.2,.04,'#323d36');
    box(x,.22,z+.79,1.6,.32,.16,'#253a2c');
    box(x,.22,z+.89,1.34,.05,.04,'#a5b4a5');
    // Product wrapping is the supplied front image, on the side of the cabinet.
    const side=[[x+1.101,3,z+.6],[x+1.101,3,z-.5],[x+1.101,.55,z-.5],[x+1.101,.55,z+.6]].map(proj);
    if(api.product())api.faces().push({p:[],d:side.reduce((a,p)=>a+p[2],0)/4+.01,draw:()=>imageQuad(ctx,api.product(),[[11,21],[195,21],[195,486],[11,486]],side)});
    textPanel(x,.025,z+1.08,2.2,.16,'에너지는 그대로, 카페인은 제로',.105,'#d8ecd0');
    const p=proj([x,1.8,z+.6]);return{x:p[0],y:p[1],r:api.zoom()*1.65,i};
  }
  function human(x,z,action,col,t,isMe=false,name='데모',remoteAwake=false,pulseAt=-100){
    const person=api.person;const dancing=['dance','special'].includes(action),special=action==='special',fatigue=api.person?.tired||0;const beat=t*(special?17:5)*(1-fatigue*.48),swayDance=dancing?Math.sin(beat)*.16:0,hop=dancing?Math.abs(Math.sin(beat))*(special?.18:.055)-fatigue*.11:0; x+=swayDance;
    const stretch=action==='stretch',rest=['rest','study','sleepy','focus'].includes(action),walk=action==='walk',drink=action==='drink';
    const awake=isMe?api.awake():remoteAwake;
    const bounce=(walk?Math.sin(t*9)*.045:Math.sin(t*1.6)*.012)+hop;
    const b=rest?-.25:0,hy=1.5+b+bounce-fatigue*.08+(action==='sleepy'?Math.sin(t*1.5)*.075:0);
    const skin='#f7d4b0',hair=isMe?'#493b32':'#60503e';
    const p=(a,y,c)=>[x+a,y+b+bounce,z+c];
    ell(x,.018,z,.55,.018,.33,'#181525',10);
    if(rest){
      ell(x,.74+b,z,.34,.42,.23,col,10);
      for(const a of [-.17,.17]){limb(p(a,.59,0),p(a,.28,.5),.13,'#435f54');ell(x+a,.07,z+.59,.16,.09,.23,'#f9f5df',8)}
    }else{
      ell(x,.83+bounce,z,.38,.39,.29,col,12);
      for(const a of [-.17,.17]){const sw=walk?Math.sin(t*9+(a>0?Math.PI:0))*.19:dancing?Math.sin(beat+(a>0?Math.PI:0))*.16:0;const knee=p(a,.37,sw-.14);limb(p(a,.65,0),knee,.13,'#435f54');limb(knee,p(a,.14,sw),.13,'#435f54');ell(x+a,.09,z+sw+.05,.17,.095,.22,'#f8f4df',8)}
    }
    // Oversized round head, ears and a soft swept fringe.
    ell(x,hy,z,.53,.49,.45,skin,14);
    ell(x-.49,hy-.02,z,.095,.13,.10,skin,8);ell(x+.49,hy-.02,z,.095,.13,.10,skin,8);
    // A contiguous shell lies outside the scalp, so skin cannot poke through intersecting hair blobs.
    for(let row=0;row<6;row++)for(let i=0;i<16;i++){
      const point=(a,ring)=>{const front=Math.cos(a)*Math.sin(api.yaw())+Math.sin(a)*Math.cos(api.yaw());const end=1.42+(1-front)*.24;const theta=end*ring/6;return[x+Math.cos(a)*Math.sin(theta)*.554,hy+Math.cos(theta)*.514,z+Math.sin(a)*Math.sin(theta)*.476]};
      const a=i*Math.PI/8,b=(i+1)*Math.PI/8;poly([point(a,row),point(b,row),point(b,row+1),point(a,row+1)],hair);
    }
    const lift=stretch?1.97+Math.sin(t*1.45)*.16:rest?.68:1.02;
    const sway=stretch?Math.sin(t*1.45)*.14:0;
    let rightHand=null;for(const side of [-1,1]){
      const end=dancing?p(side*(.58+Math.cos(beat+side)*.12),1.12+Math.sin(beat+side)*.32*(special?1.6:1),.12+Math.cos(beat)*.12):p(side*.48+sway,drink&&side===1?1.47:lift,drink&&side===1?.37:rest?.42+.045*Math.sin(t*5):.03);if(side===1)rightHand=end;
      limb(p(side*.31,1.12,0),end,.105,skin);ell(...end,.12,.12,.12,skin,8);
    }
    
    if((drink||dancing)&&rightHand){miniCan(rightHand[0],rightHand[1]-.08,rightHand[2]+.055,.43);if(dancing){const q=proj([rightHand[0],rightHand[1]+.2,rightHand[2]+.12]);api.faces().push({p:[],d:10001,draw:()=>{ctx.save();const r=api.zoom()*q[3]*.43,g=ctx.createRadialGradient(q[0],q[1],r*.5,q[0],q[1],r*1.25);g.addColorStop(0,'#ff9b2700');g.addColorStop(.65,'#ff9b272b');g.addColorStop(1,'#ff9b2700');ctx.fillStyle=g;ctx.fillRect(q[0]-r*1.3,q[1]-r*1.3,r*2.6,r*2.6);ctx.fillStyle='#ffe483';ctx.font='13px sans-serif';ctx.fillText('✦',q[0]+Math.cos(t*3)*r,q[1]-r*.9);ctx.restore()}})}}
    const normal=[Math.sin(api.yaw())*.44,Math.cos(api.yaw())*.44];
    const face=proj([x+normal[0],hy-.07,z+normal[1]]),scale=api.zoom()*face[3];
    // Continuous front fringe covers subpixel seams between the low-poly scalp faces.
    api.faces().push({p:[],d:face[2]+.82,draw:()=>{
      const cx=face[0],line=face[1]-scale*.20,rx=scale*.55;ctx.save();
      const g=ctx.createLinearGradient(cx,line-scale*.65,cx,line+scale*.07);g.addColorStop(0,isMe?'#3c3029':'#514332');g.addColorStop(1,hair);ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(cx-rx,line-scale*.04);ctx.bezierCurveTo(cx-rx,line-scale*.68,cx+rx,line-scale*.68,cx+rx,line-scale*.04);ctx.lineTo(cx+rx*.9,line+scale*.04);ctx.quadraticCurveTo(cx+rx*.54,line-scale*.025,cx+rx*.26,line+scale*.035);ctx.quadraticCurveTo(cx-rx*.1,line-scale*.03,cx-rx*.39,line+scale*.04);ctx.lineTo(cx-rx*.9,line+scale*.02);ctx.closePath();ctx.fill();
      ctx.strokeStyle=isMe?'#ffc976':'#c7a6ee';ctx.lineWidth=scale*.065;ctx.beginPath();ctx.ellipse(cx,line-scale*.10,rx*1.02,scale*.43,0,Math.PI,Math.PI*2);ctx.stroke();for(const side of [-1,1]){ctx.fillStyle='#332b45';ctx.beginPath();ctx.ellipse(cx+side*rx,line+scale*.12,scale*.095,scale*.17,side*.12,0,Math.PI*2);ctx.fill();ctx.strokeStyle=isMe?'#ffd68a':'#c7a6ee';ctx.lineWidth=scale*.035;ctx.stroke()}ctx.restore();
    }});
    api.faces().push({p:[],d:face[2]+.85,draw:()=>{
      ctx.save();ctx.translate(face[0],face[1]);ctx.lineCap='round';
      for(const side of [-1,1]){
        const ex=side*scale*.17;
        ctx.fillStyle='#edaa8a88';ctx.beginPath();ctx.ellipse(side*scale*.32,scale*.135,scale*.095,scale*.046,0,0,Math.PI*2);ctx.fill();
        if(person?.heartLeft>0){ctx.fillStyle='#f37887';ctx.font='900 '+Math.max(8,scale*.22)+'px sans-serif';ctx.textAlign='center';ctx.fillText('♥',ex,scale*.06)}else if((awake||dancing||action==='study')&&action!=='sleepy'&&action!=='rest'){
          ctx.fillStyle='#fffdf2';ctx.beginPath();ctx.ellipse(ex,0,scale*.106,scale*(action==='study'?.065:.115-fatigue*.08),0,0,Math.PI*2);ctx.fill();
          ctx.fillStyle='#332f29';ctx.beginPath();ctx.ellipse(ex,scale*.012,scale*.067,scale*(action==='study'?.044:.088-fatigue*.06),0,0,Math.PI*2);ctx.fill();
          ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex-scale*.018,-scale*.024,scale*.022,0,Math.PI*2);ctx.fill();
        }else{
          ctx.strokeStyle='#594c3e';ctx.lineWidth=Math.max(2,scale*.035);ctx.beginPath();ctx.moveTo(ex-scale*.065,0);ctx.quadraticCurveTo(ex,rest?scale*.032:scale*.018,ex+scale*.065,0);ctx.stroke();
        }
      }
      ctx.strokeStyle='#9b6c52';ctx.lineWidth=Math.max(1,scale*.019);ctx.beginPath();ctx.arc(0,scale*.11,scale*.049,0,Math.PI);ctx.stroke();ctx.restore();
    }});
    const pulse=t-(isMe?api.wakeAt():pulseAt);
    if(awake&&pulse>=0&&pulse<2){
      const q=proj([x,hy+.2,z]);
      api.faces().push({p:[],d:10001,draw:()=>{
        ctx.save();ctx.globalAlpha=Math.max(0,1-pulse/2);ctx.strokeStyle='#fff2a0';ctx.lineWidth=3;
        for(let i=0;i<9;i++){let a=i*Math.PI*2/9,r=scale*(.7+pulse*.12);ctx.beginPath();ctx.moveTo(q[0]+Math.cos(a)*r,q[1]+Math.sin(a)*r*.8);ctx.lineTo(q[0]+Math.cos(a)*(r+scale*.15),q[1]+Math.sin(a)*(r+scale*.15)*.8);ctx.stroke()}
        ctx.fillStyle='#f27824';ctx.font='900 '+Math.max(15,scale*.26)+'px sans-serif';ctx.textAlign='center';ctx.fillText('번쩍!',q[0],q[1]-scale*.8);ctx.restore();
      }});
    }
    const label=proj([x,hy+.9,z]);
    api.faces().push({p:[],d:10000,draw:()=>{
      ctx.textAlign='center';ctx.font=(isMe?'700 ':'')+(isMe?12:10)+'px sans-serif';
      ctx.fillStyle=isMe?'#fff6bf':'#e4d2bd';ctx.fillText(isMe?'▼ '+api.nickname():name,label[0],label[1]);
    }});
  }
  return{human,vending,miniCan};
}
