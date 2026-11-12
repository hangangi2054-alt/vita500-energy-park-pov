import {CONFIG,inDance,nearTable,tableSpot,spawn,STOPS,canBoard} from './park-config.js';
import {ParkWallet,dance,stop,move,beginDrink,tick} from './park-core.js';
import {walkable,findPath,collisionMove} from './park-navigation.js';
import {ParkScene} from './park-scene.js';
import {ClubAudio} from './club-audio.js';
import {createEnergyGame} from './club-energy-game.js';
import {boardRide,advanceRide,exitRide} from './park-ride.js';
import './park-ui.js';
const $=s=>document.querySelector(s),canvas=$('#club');
let saved;try{saved=JSON.parse(sessionStorage.getItem('vita-park-wallet'))}catch{}
const wallet=new ParkWallet(saved),audio=new ClubAudio();
const player={id:crypto.randomUUID(),nick:['반짝이는','리듬 타는','신나는'][Math.floor(Math.random()*3)]+' 에너지 '+Math.floor(100+Math.random()*900),...spawn(),phase:'idle',awake:true,tired:0,danced:0,specialLeft:0,drinkLeft:0,heartLeft:0,paused:false,poseTime:0,rideProgress:0};
let image=null;const product=new Image();product.onload=()=>image=product;product.src='assets/vita500-energy-front.png';
const scene=new ParkScene(canvas,()=>image),keys=new Set(),inFlight=new Set();
let peers=[],network=null,entered=false,target=null,friend=null,sending=false,mode=false,gameRunning=false,pointer=null,joy={x:0,z:0},last=0;
function toast(text){$('#toast').textContent=text;$('#toast').style.opacity=1;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.opacity=0,3500)}
function persist(){try{sessionStorage.setItem('vita-park-wallet',wallet.save())}catch{}inventory()}
function inventory(){
 $('#balance').textContent=wallet.balance;$('#pending').textContent=wallet.outbox.length?`확인 중 ${wallet.outbox.length}캔`:'';
 const unread=wallet.inbox.filter(n=>!n.read).length;$('#badge').textContent=unread;$('#badge').hidden=!unread;
 if($('#messages').open)renderMessages();
}
function clearInput(){keys.clear();joy={x:0,z:0};$('#joystick i').style.transform=''}
function stopDance(){if(stop(player)){target=null;audio.stop()}}
function goTo(end){
 if(!entered||mode||['drink','ride'].includes(player.phase))return;
 if(!walkable(end)){toast('소품 안으로는 갈 수 없어요. 빈 바닥을 선택해 주세요.');return}
 const path=findPath(player,end);if(!path){toast('이곳으로 이어지는 통로가 없어요. 빈 바닥을 골라 주세요.');return}
 move(player);audio.stop();target=path;
}
async function startDance(special=false){
 if(!entered||mode)return;
 if(!inDance(player)){goTo(STOPS.stage);toast('무대 앞 광장으로 이동해요. 도착하면 춤추기를 눌러 주세요.');return}
 if(dance(player,special)){target=null;clearInput();try{await audio.start()}catch{toast('소리가 시작되지 않았어요. 소리 버튼을 눌러 주세요.')}}
}
$('#dance').onclick=()=>startDance();$('#stop').onclick=stopDance;
$('#toPlaza').onclick=()=>goTo(STOPS.plaza);$('#toStage').onclick=()=>goTo(STOPS.stage);$('#toRide').onclick=()=>goTo(STOPS.coaster);
$('#special').onclick=async()=>{
 if(!entered||mode||player.phase==='drink')return;if(player.phase==='ride'){exitRide(player);toast('탑승장으로 돌아왔어요.');return}
 if(!canBoard(player)){goTo(STOPS.coaster);toast('롤러코스터 탑승장으로 걸어가요. 도착하면 한 번 더 눌러 주세요.');return}
 if(boardRide(player)){target=null;clearInput();audio.stop();try{await audio.init();audio.noise(.25,.08,1800)}catch{}toast('출발! 18초 동안 한 바퀴 돌고 탑승장으로 돌아와요.')}
};
$('#sound').onclick=async()=>{await audio.toggle();if(!audio.muted&&['dance','special'].includes(player.phase)&&!mode)await audio.start();soundUI()};
function soundUI(){$('#sound').textContent=audio.muted?'♫ 소리 OFF':'♫ 소리 ON';$('#sound').setAttribute('aria-label',audio.muted?'소리 켜기':'음소거')}
$('#drink').onclick=async()=>{
 if(wallet.available<1){toast('보유 캔이 없어요. 에너지 만들기에서 가상 캔을 얻어보세요.');return}
 if(!beginDrink(player,wallet))return;target=null;audio.stop();clearInput();persist();try{await audio.init();audio.open()}catch{};
};
const game=createEnergyGame($('#game'),()=>image,(id,score)=>{const earned=wallet.earn(id,score);persist();$('#reward').textContent=`${score}점 · 가상 에너지 ${earned}캔 획득`;$('#gameResult').hidden=false;gameRunning=false},kind=>audio.pickup(kind));
$('#make').onclick=()=>{
 if(!entered||mode||['drink','ride'].includes(player.phase))return;stopDance();target=null;clearInput();player.paused=true;player.phase='game';mode=true;audio.stop();audio.init().catch(()=>toast('소리를 켜려면 오른쪽 위 소리 버튼을 눌러 주세요.'));$('#activity').hidden=false;$('#gameResult').hidden=true;game.start();gameRunning=true;
};
function closeGame(){if(!mode)return;game.finish();mode=false;gameRunning=false;player.paused=false;player.phase='idle';$('#activity').hidden=true;clearInput();persist()}
$('#return').onclick=$('#gameReturn').onclick=closeGame;
function chooseFriend(p){if(mode||['drink','ride'].includes(player.phase))return;friend=p;clearInput();$('#friendName').textContent=p.nick;$('#give').disabled=wallet.available<1;$('#friend').showModal()}
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
function activate(x,y){const hit=scene.hit(x,y);if(hit?.type==='demo'){toast('시연 방문자예요. 실제 이용자가 아니며 메시지는 보내지 않아요.');return}if(hit?.type==='person'){chooseFriend(hit.person);return}if(hit?.type==='table'){goTo(tableSpot(hit.table));toast('충전 부스 앞으로 이동해요. 도착하면 마시기를 눌러 주세요.');return}if(hit?.type==='ride'){goTo(STOPS.coaster);return}goTo(scene.projectFloor(x,y))}
canvas.onpointerdown=e=>{if(mode||player.phase==='ride')return;pointer={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)};
canvas.onpointermove=e=>{if(!pointer)return;if(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>7)pointer.moved=true;if(pointer.moved){scene.yaw-=(e.clientX-pointer.lastX)*.005;scene.pitch=Math.max(.45,Math.min(.9,scene.pitch+(e.clientY-pointer.lastY)*.002))}pointer.lastX=e.clientX;pointer.lastY=e.clientY};
canvas.onpointerup=e=>{if(pointer&&!pointer.moved)activate(e.clientX,e.clientY);pointer=null};canvas.onpointercancel=()=>pointer=null;
const stick=$('#joystick');function stickMove(e){if(mode)return;const r=stick.getBoundingClientRect();joy.x=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/25));joy.z=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/25));stick.firstElementChild.style.transform=`translate(${joy.x*17}px,${joy.z*17}px)`}
stick.onpointerdown=e=>{stick.setPointerCapture(e.pointerId);stickMove(e)};stick.onpointermove=e=>{if(stick.hasPointerCapture(e.pointerId))stickMove(e)};stick.onpointerup=stick.onpointercancel=()=>{joy={x:0,z:0};stick.firstElementChild.style.transform=''};
addEventListener('keydown',e=>{if(e.target.matches('textarea,input')||$('dialog[open]'))return;const k=e.key.toLowerCase();if(k.startsWith('arrow')||k===' ')e.preventDefault();if(mode){game.key(k,true);return}keys.add(k)});
addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());game.key(e.key.toLowerCase(),false)});
addEventListener('blur',()=>{clearInput();for(const k of ['arrowleft','arrowright','a','d'])game.key(k,false)});
$('#enter').onclick=()=>{entered=true;$('#welcome').close();toast('에너지 파크에 오신 걸 환영해요! 광장·무대·롤러코스터로 걸어가 보세요.')};$('#welcome').showModal();
import('./park-network.js').then(({connectPark})=>{
 network=connectPark({getState:()=>({...player,phase:mode?'game':player.phase}),onPlayers:p=>peers=p,onStatus:s=>$('#connection').textContent=s,
  onGift:(gift,sender)=>{const old=wallet.inbox.some(n=>n.id===gift?.id),ok=wallet.receive(gift,sender);if(ok&&!old){player.heartLeft=3;persist();toast('에너지와 메시지가 도착했어요. ♥')}return ok}});player.id=network.id;
}).catch(error=>{$('#connection').textContent='연결 불가 · 혼자 체험 중';console.error('Club connection',error)});
function frame(ms){
 const dt=Math.min(.05,(ms-last)/1000||.016);last=ms;
 if(entered&&!mode){
  if(!$('dialog[open]')&&!['drink','ride'].includes(player.phase)){
   const sx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joy.x,sz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joy.z;
   if(Math.hypot(sx,sz)>.15){move(player);target=null;audio.stop();const l=Math.max(1,Math.hypot(sx,sz)),p=collisionMove(player,dt*CONFIG.speed*(sx*Math.cos(scene.yaw)+sz*Math.sin(scene.yaw))/l,dt*CONFIG.speed*(-sx*Math.sin(scene.yaw)+sz*Math.cos(scene.yaw))/l);player.x=p.x;player.z=p.z}
   else if(target){const q=target[0],dx=q.x-player.x,dz=q.z-player.z,d=Math.hypot(dx,dz);if(d<.03){player.x=q.x;player.z=q.z;target.shift();if(!target.length){target=null;player.phase='idle'}}else{const step=Math.min(d,dt*CONFIG.speed),p=collisionMove(player,dx/d*step,dz/d*step);player.x=p.x;player.z=p.z}}
   else if(player.phase==='walk')player.phase='idle';
  }
  if(player.phase==='ride'&&!$('dialog[open]')){if(advanceRide(player,dt))toast('한 바퀴 완료! 다시 파크를 둘러보세요.')}
  tick(player,dt);player.poseTime+=dt;
 }
 if(!['dance','special'].includes(player.phase)||mode)audio.stop();
 const dancing=['dance','special'].includes(player.phase),table=nearTable(player);
 $('#stop').hidden=!dancing;$('#context').hidden=!table||mode||player.phase==='drink';$('#drink').textContent=wallet.available<1?'캔이 없어요 · 에너지 만들기':'↟ 마시기 · 1캔';
 $('#dance').disabled=['drink','ride'].includes(player.phase)||mode;$('#special').disabled=player.phase==='drink'||mode;$('#make').disabled=player.phase==='ride';
 const label=player.phase==='ride'?'탑승 마치기':canBoard(player)?'롤러코스터 타기':'롤러코스터';if($('#special').dataset.label!==label){$('#special').innerHTML='<span>🎢</span>'+label;$('#special').dataset.label=label}
 $('#toPlaza').disabled=$('#toStage').disabled=$('#toRide').disabled=player.phase==='ride';
 $('#status').textContent=mode?'갈랑가를 담아 가상 에너지를 만들어요.':player.phase==='ride'?'롤러코스터 탑승 중! 한 바퀴 뒤 같은 탑승장으로 돌아와요.':player.phase==='drink'?'딸깍—칙! 한 모금 충전 중':player.wakePulse>0?'ϟ ENERGY ON! 다시 파크를 즐겨요.':table?'충전 부스에 도착했어요. 한 캔 마셔볼까요?':player.phase==='walk'?'놀이공원 길을 따라 이동하고 있어요.':dancing?'에너지 무대 앞에서 함께 춤춰요!':inDance(player)?'무대 앞에 도착했어요. 춤추기를 눌러요.':'파크 광장·에너지 무대·롤러코스터를 즐겨보세요.';
 scene.render(player,peers,player.poseTime,dt);canvas.dataset.wallet=JSON.stringify({balance:wallet.balance,available:wallet.available,pending:wallet.outbox.length,inbox:wallet.inbox.length});$('#sound').dataset.audio=JSON.stringify(audio.state());
 if(mode)game.draw(gameRunning?dt:0);requestAnimationFrame(frame);
}
persist();soundUI();requestAnimationFrame(frame);
