const CONFIG={gameSeconds:24,feverScore:12};
export function createEnergyGame(canvas,getImage,onFinish,sound,random=Math.random){
  const ctx=canvas.getContext('2d');let game=null,keys=new Set(),w=0,h=0;
  const setX=event=>{if(game&&!game.done){const r=canvas.getBoundingClientRect();game.x=Math.max(30,Math.min(w-30,event.clientX-r.left))}};
  canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);setX(e)};
  canvas.onpointermove=e=>{if(canvas.hasPointerCapture(e.pointerId))setX(e)};
  function root(x,y,size){
    ctx.save();ctx.translate(x,y);ctx.rotate(-.2);ctx.fillStyle='#d7aa73';ctx.strokeStyle='#987448';ctx.lineWidth=1.5;
    for(const [dx,dy,rot]of [[-13,2,-.4],[2,0,.3],[13,-5,.8]]){ctx.beginPath();ctx.ellipse(dx,dy,size*.42,size*.2,rot,0,Math.PI*2);ctx.fill();ctx.stroke()}
    ctx.strokeStyle='#f5dfb0';for(let i=-14;i<20;i+=8){ctx.beginPath();ctx.moveTo(i,-5);ctx.lineTo(i+4,7);ctx.stroke()}
    ctx.fillStyle='#608b51';ctx.beginPath();ctx.ellipse(14,-15,5,13,.6,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function caffeine(x,y,size){
    ctx.fillStyle='#514b43';ctx.beginPath();ctx.arc(x,y,size*.45,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a59e8b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,size*.32,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff1ce';ctx.font='800 20px sans-serif';ctx.textAlign='center';ctx.fillText('C',x,y+7);
  }
  function finish(){if(!game||game.done)return;game.done=true;onFinish(game.id,game.score)}
  return {
    start(){game={id:crypto.randomUUID(),score:0,left:CONFIG.gameSeconds,x:canvas.clientWidth/2,items:[],spawn:.2,done:false,fever:false};keys.clear()},
    key(key,down){down?keys.add(key):keys.delete(key)},
    finish,
    get state(){return game},
    draw(dt){
      if(!game)return;w=canvas.clientWidth;h=canvas.clientHeight;const dpr=Math.min(devicePixelRatio,2);if(canvas.width!==w*dpr||canvas.height!==h*dpr){canvas.width=w*dpr;canvas.height=h*dpr}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=game.fever?'#fff0c3':'#f5efdf';ctx.fillRect(0,0,w,h);
      game.flash=Math.max(0,(game.flash||0)-dt);if(game.flash>0){ctx.save();ctx.globalAlpha=game.flash/.4;ctx.fillStyle=game.lastCatch==='root'?'#ffd55c35':'#46305345';ctx.fillRect(0,0,w,h);ctx.strokeStyle=game.lastCatch==='root'?'#ffbb37':'#675079';ctx.lineWidth=5;ctx.strokeRect(3,3,w-6,h-6);ctx.restore()}
      ctx.strokeStyle='#e3d6b9';ctx.lineWidth=1;for(let x=0;x<w;x+=52){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
      if(!game.done){
        game.left=Math.max(0,game.left-dt);game.x+=((keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0))*dt*420;game.x=Math.max(30,Math.min(w-30,game.x));
        game.spawn-=dt;if(game.spawn<=0){game.spawn=game.fever?.42:.64;game.items.push({x:35+random()*(w-70),y:-45,type:random()<.74?'root':'caffeine',speed:90+random()*65})}
        for(const item of game.items){item.y+=dt*item.speed;if(item.y>h-125&&item.y<h-72&&Math.abs(item.x-game.x)<43){game.score+=item.type==='root'?2:-3;item.y=h+100;game.flash=.4;game.lastCatch=item.type;sound(item.type)}}
        game.items=game.items.filter(i=>i.y<h+60);if(game.score>=CONFIG.feverScore)game.fever=true;if(game.left<=0)finish();
      }
      for(const item of game.items){item.type==='root'?root(item.x,item.y,40):caffeine(item.x,item.y,40);ctx.fillStyle=item.type==='root'?'#4f723d':'#514b43';ctx.font='700 11px sans-serif';ctx.textAlign='center';ctx.fillText(item.type==='root'?'갈랑가':'카페인',item.x,item.y+35)}
      const img=getImage(),canH=113,canW=canH*207/511;
      ctx.fillStyle='#d2c4a75c';ctx.beginPath();ctx.ellipse(game.x,h-12,45,8,0,0,Math.PI*2);ctx.fill();
      if(img)ctx.drawImage(img,game.x-canW/2,h-canH-12,canW,canH);
      ctx.fillStyle='#5b533e';ctx.font='700 16px sans-serif';ctx.textAlign='left';ctx.fillText('점수 '+game.score,20,29);ctx.textAlign='right';ctx.fillText(Math.ceil(game.left)+'초',w-20,29);
      if(game.fever){ctx.textAlign='center';ctx.fillStyle='#e57821';ctx.font='900 30px sans-serif';ctx.fillText('FEVER',w/2,62);for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#e89428':'#ffcc52';ctx.font='18px sans-serif';ctx.fillText('✦',w/2+Math.cos(i*Math.PI/4+game.left)*95,65+Math.sin(i*Math.PI/4+game.left)*28)}}
      canvas.dataset.state=JSON.stringify({score:game.score,left:game.left,fever:game.fever,done:game.done,lastCatch:game.lastCatch||null});
    }
  };
}
