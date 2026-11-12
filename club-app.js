import {CONFIG,inDance,nearTable,tableSpot,spawn} from './club-config.js';
import {ClubWallet,dance,stop,move,beginDrink,tick} from './club-core.js';
import {walkable,findPath,collisionMove} from './club-navigation.js';
import {ClubScene} from './club-scene.js';
import {ClubAudio} from './club-audio.js';
import {createEnergyGame} from './club-energy-game.js';
const $=s=>document.querySelector(s),canvas=$('#club');
let saved;try{saved=JSON.parse(sessionStorage.getItem('vita-club-wallet'))}catch{}
const wallet=new ClubWallet(saved),audio=new ClubAudio();
const player={id:crypto.randomUUID(),nick:['반짝이는','리듬 타는','신나는'][Math.floor(Math.random()*3)]+' 에너지 '+Math.floor(100+Math.random()*900),...spawn(),phase:'idle',awake:true,tired:0,danced:0,specialLeft:0,drinkLeft:0,heartLeft:0,paused:false,poseTime:0};
let image=null;const product=new Image();product.onload=()=>image=product;product.src='assets/vita500-energy-front.png';
const scene=new ClubScene(canvas,()=>image),keys=new Set(),inFlight=new Set();
let peers=[],network=null,entered=false,target=null,friend=null,sending=false,mode=false,gameRunning=false,pointer=null,joy={x:0,z:0},last=0;
function toast(text){$('#toast').textContent=text;$('#toast').style.opacity=1;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.opacity=0,3500)}
function persist(){try{sessionStorage.setItem('vita-club-wallet',wallet.save())}catch{}inventory()}
function inventory(){
 $('#balance').textContent=wallet.balance;$('#pending').textContent=wallet.outbox.length?`확인 중 ${wallet.outbox.length}캔`:'';
 const unread=wallet.inbox.filter(n=>!n.read).length;$('#badge').textContent=unread;$('#badge').hidden=!unread;
 if($('#messages').open)renderMessages();
}
function clearInput(){keys.clear();joy={x:0,z:0};$('#joystick i').style.transform=''}
function stopDance(){if(stop(player)){target=null;audio.stop()}}
function goTo(end){
 if(!entered||mode||player.phase==='drink')return;
 if(!walkable(end)){toast('소품 안으로는 갈 수 없어요. 빈 바닥을 선택해 주세요.');return}
 const path=findPath(player,end);if(!path){toast('이곳으로 이어지는 통로가 없어요. 빈 바닥을 골라 주세요.');return}
 move(player);audio.stop();target=path;
}
async function startDance(special=false){
 if(!entered||mode)return;
 if(!inDance(player)){toast('중앙 노란 댄스존 안으로 이동한 뒤 춤을 눌러 주세요.');return}
 if(dance(player,special)){target=null;clearInput();try{await audio.start()}catch{toast('소리가 시작되지 않았어요. 소리 버튼을 눌러 주세요.')}}
}
$('#dance').onclick=()=>startDance();$('#special').onclick=()=>startDance(true);$('#stop').onclick=stopDance;
$('#sound').onclick=async()=>{await audio.toggle();if(!audio.muted&&['dance','special'].includes(player.phase)&&!mode)await audio.start();soundUI()};
function soundUI(){$('#sound').textContent=audio.muted?'♫ 소리 OFF':'♫ 소리 ON';$('#sound').setAttribute('aria-label',audio.muted?'소리 켜기':'음소거')}
$('#drink').onclick=async()=>{
 if(wallet.available<1){toast('보유 캔이 없어요. 에너지 만들기에서 가상 캔을 얻어보세요.');return}
 if(!beginDrink(player,wallet))return;target=null;audio.stop();clearInput();persist();try{await audio.init();audio.open()}catch{};
};
const game=createEnergyGame($('#game'),()=>image,(id,score)=>{const earned=wallet.earn(id,score);persist();$('#reward').textContent=`${score}점 · 가상 에너지 ${earned}캔 획득`;$('#gameResult').hidden=false;gameRunning=false},kind=>audio.pickup(kind));
$('#make').onclick=()=>{
 if(!entered||mode||player.phase==='drink')return;stopDance();target=null;clearInput();player.paused=true;player.phase='game';mode=true;audio.stop();audio.init().catch(()=>toast('소리를 켜려면 오른쪽 위 소리 버튼을 눌러 주세요.'));$('#activity').hidden=false;$('#gameResult').hidden=true;game.start();gameRunning=true;
};
function closeGame(){if(!mode)return;game.finish();mode=false;gameRunning=false;player.paused=false;player.phase='idle';$('#activity').hidden=true;clearInput();persist()}
$('#return').onclick=$('#gameReturn').onclick=closeGame;
function chooseFriend(p){if(mode||player.phase==='drink')return;friend=p;clearInput();$('#friendName').textContent=p.nick;$('#give').disabled=wallet.available<1;$('#friend').showModal()}
$('#friendClose').onclick=()=>$('#friend').close();
$('#give').onclick=()=>{if(!friend)return;$('#friend').close();$('#message').value='';$('#giftSend').disabled=false;$('#giftDialog').showModal()};
$('#giftCancel').onclick=()=>$('#giftDialog').close();
async function deliver(t){
 if(inFlight.has(t.id)||!network?.hasPeer(t.target))return;
 inFlight.add(t.id);
 try{const answer=await network.sendGift(t.target,{id:t.id,message:t.message,nick:player.nick});
  if(answer?.accepted){wallet.confirm(t.id);player.heartLeft=3;persist();toast('에너지와 메시지를 건넸어요. ♥')}
  else{wallet.reject(t.id);persist();toast('전송하지 못했어요. 캔은 차감되지 않았어요.')}
 }catch{toast('수신 확인을 기다리고 있어요. 캔은 아직 차감하지 않고 보관 중이에요.');persist()}
 finally{inFlight.delete(t.id)}
}
$('#giftForm').onsubmit=e=>{
 e.preventDefault();if(sending||!friend||wallet.available<1)return;const message=$('#message').value.trim();if(!message)return;
 if(!network?.hasPeer(friend.id)){toast('상대가 나갔어요. 캔은 차감되지 않았어요.');$('#giftDialog').close();return}
 sending=true;$('#giftSend').disabled=true;
 const t=wallet.reserve(crypto.randomUUID(),friend.id,message);if(t){persist();$('#giftDialog').close();deliver(t)}friend=null;sending=false;
};
setInterval(()=>{for(const t of wallet.outbox)deliver(t)},4500);
function renderMessages(){
 const list=$('#messageList');list.replaceChildren();$('#empty').hidden=wallet.inbox.length>0;
 for(const n of [...wallet.inbox].reverse()){
  const b=document.createElement('button'),title=document.createElement('strong'),meta=document.createElement('small');b.className='messageEntry';title.textContent=n.nick;meta.textContent=(n.read?'읽은 메시지':'새 메시지')+' · 가상 에너지 1캔 수령';b.append(title,meta);
  b.onclick=()=>{n.read=true;persist();$('#messages').close();$('#noteFrom').textContent=n.nick+'의 메시지';$('#noteText').textContent=n.message;$('#note').showModal()};list.append(b);
 }
}
$('#inbox').onclick=()=>{clearInput();renderMessages();$('#messages').showModal()};$('#messagesClose').onclick=()=>$('#messages').close();
$('#noteClose').onclick=()=>{$('#note').close();renderMessages();$('#messages').showModal()};
function activate(x,y){const hit=scene.hit(x,y);if(hit?.type==='demo'){toast('시연 댄서예요. 실제 방문자가 아니며 메시지는 보내지 않아요.');return}if(hit?.type==='person'){chooseFriend(hit.person);return}if(hit?.type==='table'){goTo(tableSpot(hit.table));toast('충전 테이블 앞자리로 이동해요. 도착하면 마시기를 눌러 주세요.');return}goTo(scene.projectFloor(x,y))}
canvas.onpointerdown=e=>{if(mode)return;pointer={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)};
canvas.onpointermove=e=>{if(!pointer)return;if(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>7)pointer.moved=true;if(pointer.moved){scene.yaw-=(e.clientX-pointer.lastX)*.005;scene.pitch=Math.max(.45,Math.min(.9,scene.pitch+(e.clientY-pointer.lastY)*.002))}pointer.lastX=e.clientX;pointer.lastY=e.clientY};
canvas.onpointerup=e=>{if(pointer&&!pointer.moved)activate(e.clientX,e.clientY);pointer=null};canvas.onpointercancel=()=>pointer=null;
const stick=$('#joystick');function stickMove(e){if(mode)return;const r=stick.getBoundingClientRect();joy.x=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/25));joy.z=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/25));stick.firstElementChild.style.transform=`translate(${joy.x*17}px,${joy.z*17}px)`}
stick.onpointerdown=e=>{stick.setPointerCapture(e.pointerId);stickMove(e)};stick.onpointermove=e=>{if(stick.hasPointerCapture(e.pointerId))stickMove(e)};stick.onpointerup=stick.onpointercancel=()=>{joy={x:0,z:0};stick.firstElementChild.style.transform=''};
addEventListener('keydown',e=>{if(e.target.matches('textarea,input')||$('dialog[open]'))return;const k=e.key.toLowerCase();if(k.startsWith('arrow')||k===' ')e.preventDefault();if(mode){game.key(k,true);return}keys.add(k)});
addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());game.key(e.key.toLowerCase(),false)});
addEventListener('blur',()=>{clearInput();for(const k of ['arrowleft','arrowright','a','d'])game.key(k,false)});
$('#enter').onclick=()=>{entered=true;$('#welcome').close();toast('노란 바닥으로 이동해 춤춰요! 테이블을 누르면 앞자리로 이동해요.')};$('#welcome').showModal();
import('./club-network.js').then(({connectClub})=>{
 network=connectClub({getState:()=>({...player,phase:mode?'game':player.phase}),onPlayers:p=>peers=p,onStatus:s=>$('#connection').textContent=s,
  onGift:(gift,sender)=>{const old=wallet.inbox.some(n=>n.id===gift?.id),ok=wallet.receive(gift,sender);if(ok&&!old){player.heartLeft=3;persist();toast('에너지와 메시지가 도착했어요. ♥')}return ok}});player.id=network.id;
}).catch(error=>{$('#connection').textContent='연결 불가 · 혼자 체험 중';console.error('Club connection',error)});
function frame(ms){
 const dt=Math.min(.05,(ms-last)/1000||.016);last=ms;
 if(entered&&!mode){
  if(!$('dialog[open]')&&player.phase!=='drink'){
   const sx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joy.x,sz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joy.z;
   if(Math.hypot(sx,sz)>.15){move(player);target=null;audio.stop();const l=Math.max(1,Math.hypot(sx,sz)),p=collisionMove(player,dt*CONFIG.speed*(sx*Math.cos(scene.yaw)+sz*Math.sin(scene.yaw))/l,dt*CONFIG.speed*(-sx*Math.sin(scene.yaw)+sz*Math.cos(scene.yaw))/l);player.x=p.x;player.z=p.z}
   else if(target){const q=target[0],dx=q.x-player.x,dz=q.z-player.z,d=Math.hypot(dx,dz);if(d<.03){player.x=q.x;player.z=q.z;target.shift();if(!target.length){target=null;player.phase='idle'}}else{const step=Math.min(d,dt*CONFIG.speed),p=collisionMove(player,dx/d*step,dz/d*step);player.x=p.x;player.z=p.z}}
   else if(player.phase==='walk')player.phase='idle';
  }
  tick(player,dt);player.poseTime+=dt;
 }
 if(!['dance','special'].includes(player.phase)||mode)audio.stop();
 const dancing=['dance','special'].includes(player.phase),table=nearTable(player);
 $('#stop').hidden=!dancing;$('#context').hidden=!table||mode||player.phase==='drink';$('#drink').textContent=wallet.available<1?'캔이 없어요 · 에너지 만들기':'↟ 마시기 · 1캔';
 $('#dance').disabled=player.phase==='drink'||mode;$('#special').disabled=player.phase==='drink'||player.phase==='special'||mode;
 $('#status').textContent=mode?'에너지 만드는 중 · 클럽은 잠시 정지':player.phase==='drink'?'딸깍—칙! 충전 중…':player.wakePulse>0?'ϟ 충전 ON! 다시 내 리듬으로':table?'테이블 앞에 도착했어요. 마시기로 충전해요.':player.tired>.85?(dancing?'휴… 춤이 느려져요. 옆 테이블에서 충전해요!':'옆 테이블을 눌러 충전하러 가요.'):player.phase==='special'?'고장 난 로봇 출동!':dancing?'한 곡만큼, 가볍게 흔들어봐!':table?'테이블 앞에 도착했어요. 마시기로 충전해요.':inDance(player)?'일반 춤 또는 필살기를 눌러요.':'노란 댄스존으로 이동해 보세요.';
 scene.render(player,peers,player.poseTime,dt);canvas.dataset.wallet=JSON.stringify({balance:wallet.balance,available:wallet.available,pending:wallet.outbox.length,inbox:wallet.inbox.length});$('#sound').dataset.audio=JSON.stringify(audio.state());
 if(mode)game.draw(gameRunning?dt:0);requestAnimationFrame(frame);
}
persist();soundUI();requestAnimationFrame(frame);
