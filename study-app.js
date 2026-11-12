import {CONFIG,SEATS,DEMOS} from './study-config.js';
import {Wallet,seatOwners} from './study-core.js';
import {StudyScene} from './study-scene.js';
import {createCanToy} from './can-toy.js';
import {createEnergyGame} from './energy-game.js';
import {findPath,collisionMove,seatPosition,REST_CHAIRS} from './study-navigation.js';
import {StudyClock,clockText} from './study-clock.js';
import {StudyAudio} from './study-audio.js';

const $=s=>document.querySelector(s),now=()=>performance.now();
let saved=null;try{saved=JSON.parse(sessionStorage.getItem('vita-study-wallet'))}catch{}
const wallet=new Wallet(saved);
const player={id:crypto.randomUUID(),nick:['꾸준한','씩씩한','느긋한'][Math.floor(Math.random()*3)]+' 책갈피 '+Math.floor(100+Math.random()*900),
  x:0,z:8,seat:null,phase:'idle',awake:false,wakeAt:-100,onBreak:false,restBench:null};
$('#nickname').textContent=player.nick;
let image=null;const product=new Image();product.onload=()=>image=product;product.src='assets/vita500-energy-front.png';
const scene=new StudyScene($('#room'),()=>image);
let peers=[],network=null,mode=null,pausedAt=0,target=null,studyStarted=now(),drinkEnds=0,fxEnds=0,last=0,
  friend=null,pointer=null,joy={x:0,z:0};
const keys=new Set(),demoNotes=new Map(),inFlight=new Set();
let recorded=0;try{recorded=Number(localStorage.getItem('vita-study-time-ms'))||0}catch{}
const clock=new StudyClock(recorded),studyAudio=new StudyAudio();
let entered=false,accessSeat=null,accessBench=null,clockWasRunning=false,noteFromBook=false;
function saveTime(){try{localStorage.setItem('vita-study-time-ms',String(Math.max(clock.total(now()),Number(localStorage.getItem('vita-study-time-ms'))||0)))}catch{}}
setInterval(saveTime,1000);
addEventListener('pagehide',()=>{clock.pause(now());saveTime()});
addEventListener('storage',event=>{if(event.key==='vita-study-time-ms')clock.merge(Number(event.newValue)||0,now())});
function persist(){try{sessionStorage.setItem('vita-study-wallet',wallet.save())}catch{}updateInventory()}
function updateInventory(){
  $('#balance').textContent=wallet.balance;$('#pending').textContent=wallet.outbox.length?`전달 확인 중 ${wallet.outbox.length}캔`:'';
  $('#drink').disabled=wallet.available<1||player.phase==='drink';
  $('#drink').title=wallet.available<1?'사용 가능한 캔이 없어요. 에너지 만들기로 얻을 수 있어요.':'';
  updateGuestbookBadge();
}
function toast(message){$('#toast').textContent=message;$('#toast').style.opacity=1;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.opacity=0,3600)}
function noise(...args){studyAudio.noise(...args)}
$('#sound').onclick=async()=>{
  const button=$('#sound');button.disabled=true;button.textContent='준비 중…';
  try{await studyAudio.enable(!studyAudio.enabled);button.textContent=studyAudio.enabled?'소리 ON ♫':'소리 OFF';button.setAttribute('aria-label',studyAudio.enabled?'클래식 BGM과 효과음 끄기':'클래식 BGM과 효과음 켜기');$('#musicStatus').textContent=studyAudio.enabled?'바흐 · 프렐류드 C장조 / 피아노 합성 연주':'소리 버튼을 켜면 클래식과 효과음이 재생돼요.'}
  catch(error){await studyAudio.enable(false);button.textContent='소리 OFF';toast('음악을 불러오지 못했어요. 소리 버튼을 다시 눌러 주세요.');console.error('Study audio',error)}finally{button.disabled=false}
};
const toy=createCanToy($('#can'),()=>image,(_duration,strength)=>studyAudio.crunch(strength));
const game=createEnergyGame($('#game'),()=>image,(id,score)=>{
  const earned=wallet.earn(id,score);persist();$('#gameResult').hidden=false;
  $('#reward').textContent=`점수 ${score}점 · 가상 에너지 ${earned}캔 획득`;
},noise);
function owners(){return seatOwners([player,...peers],DEMOS)}
function freeSeat(id){return !owners().has(id)||owners().get(id)===player.id}
function goToSeat(id){
  if(mode||player.phase==='drink')return;
  if(!freeSeat(id)){toast('이미 다른 학생이 앉아 있어요. 빈자리를 골라 주세요.');return}
  const options={passSeat:id,exitSeat:accessSeat??player.seat,exitBench:accessBench??player.restBench};
  const path=findPath(player,seatPosition(id),options);if(!path){toast('지금은 이 자리로 갈 수 없어요. 통로 쪽에서 다시 선택해 주세요.');return}
  player.seat=id;player.phase='walk';player.awake=false;
  target={points:path,options,returning:player.onBreak,done:()=>{
    accessSeat=id;accessBench=null;player.restBench=null;player.onBreak=false;player.phase='study';studyStarted=now();if(entered)clock.start(now());toast(`${id+1}번 자리에서 공부를 시작해요.`);
  }};
}
function leaveSeat(){if(player.seat!==null)accessSeat=player.seat;if(!player.onBreak)player.seat=null;target=null;player.phase='walk';player.awake=false}
function takeBreak(benchId=null){
  if(mode||player.phase==='drink')return;
  const available=REST_CHAIRS.filter(b=>!peers.some(p=>p.onBreak&&p.restBench===b.id));
  const bench=benchId===null?available.sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z))[0]:available.find(b=>b.id===benchId);
  if(benchId!==null&&!bench){toast('다른 방문자가 쉬고 있는 의자예요.');return}
  const end=bench||{x:11.1,z:.5},options={passSeat:player.seat,exitSeat:accessSeat,passBench:bench?.id??null,exitBench:accessBench??player.restBench};
  const path=findPath(player,end,options);if(!path){toast('통로를 찾지 못했어요. 이동 패드로 통로 쪽에 선 뒤 다시 눌러 주세요.');return}
  clock.pause(now());saveTime();accessSeat=player.seat??accessSeat;accessBench=player.restBench;
  player.onBreak=true;player.restBench=bench?.id??null;player.phase='walk';player.awake=false;keys.clear();joy={x:0,z:0};
  target={points:path,options,restJourney:true,done:()=>{accessBench=bench?.id??null;player.phase=bench?'rest':'idle';toast(bench?'복도 의자에서 쉬어요. 공부 시간은 멈춰 있어요.':'의자가 사용 중이라 복도에서 잠시 쉬어요.')}};
}
function returnToStudy(){
  if(mode||player.phase==='drink')return;
  if(player.seat!==null&&owners().get(player.seat)===player.id){goToSeat(player.seat);return}
  const options={exitSeat:accessSeat,exitBench:accessBench??player.restBench},path=findPath(player,{x:0,z:8},options);if(!path)return;
  player.phase='walk';target={points:path,options,returning:true,done:()=>{player.onBreak=false;player.restBench=null;accessBench=null;player.phase='idle';if(entered)clock.start(now());toast('공부 시간 기록을 다시 시작했어요. 빈자리를 골라 주세요.')}};
}
$('#pauseStudy').onclick=()=>player.onBreak?returnToStudy():takeBreak();
$('#drink').onclick=()=>{
  if(mode||player.phase==='drink'||!wallet.spend())return;
  persist();target=null;player.phase='drink';drinkEnds=now()+CONFIG.drinkMs;
  noise(.065,.17,3600);setTimeout(()=>noise(.45,.13,7000),85);updateInventory();
};
function openActivity(which){
  if(mode||player.phase==='drink')return;clockWasRunning=clock.running;clock.pause(now());saveTime();mode=which;pausedAt=now();keys.clear();joy={x:0,z:0};
  $('#activity').hidden=false;$('#game').hidden=which!=='game';$('#can').hidden=which!=='toy';$('#toyFooter').hidden=which!=='toy';$('#gameLegend').hidden=which!=='game';$('#gameResult').hidden=true;
  $('#activityTitle').textContent=which==='game'?'갈랑가만 담아, 에너지 만들기':'잠깐 쉬어가요, 캔 꾹꾹';
  $('#activityHelp').textContent=which==='game'?'방향키 또는 터치·드래그로 캔을 움직여요.':'짧게 톡, 길게 꾹 · 드래그하면 다른 면을 볼 수 있어요.';
  if(which==='game')game.start();else toy.reset();
}
function closeActivity(){
  if(!mode)return;if(mode==='game')game.finish();toy.stop();
  studyStarted+=now()-pausedAt;mode=null;$('#activity').hidden=true;keys.clear();if(clockWasRunning&&!player.onBreak)clock.start(now());updateInventory();
}
$('#make').onclick=()=>openActivity('game');$('#squish').onclick=()=>openActivity('toy');$('#return').onclick=closeActivity;$('#gameReturn').onclick=closeActivity;$('#straighten').onclick=()=>toy.reset();
function selectFriend(person){
  if(player.phase==='drink'||mode)return;friend=person;
  $('#giftTo').textContent=`${person.nick}에게`;
  $('#giftType').textContent=person.demo?'시연용 동작 · 이 브라우저의 시연 학생에게만 표시됩니다. 실제 사용자에게 전송되지 않습니다.':'실제 연결된 방문자에게 직접 전달합니다. 상대가 온라인일 때만 가능해요.';
  $('#giftFeedback').textContent='';$('#message').value='';$('#giftSend').disabled=wallet.available<1;
  $('#giftDialog').showModal();keys.clear();
}
$('#giftCancel').onclick=()=>$('#giftDialog').close();
async function deliver(transfer){
  if(!network?.hasPeer(transfer.target)||inFlight.has(transfer.id))return false;
  inFlight.add(transfer.id);
  try{
    const answer=await network.sendGift(transfer.target,{id:transfer.id,message:transfer.message,nick:player.nick});
    if(answer?.accepted){wallet.confirm(transfer.id);persist();toast('메모와 가상 에너지 1캔을 전달했어요.');return true}
    wallet.outbox=wallet.outbox.filter(t=>t.id!==transfer.id);persist();toast('상대가 선물을 받지 못했어요. 캔은 차감되지 않았어요.');
  }catch{toast('전달 확인 중이에요. 확인될 때까지 이 캔은 사용을 잠시 보류해요.');persist()}
  finally{inFlight.delete(transfer.id)}return false;
}
$('#giftForm').onsubmit=async e=>{
  e.preventDefault();const message=$('#message').value.trim();if(!message||!friend||wallet.available<1)return;
  if(friend.demo){if(!wallet.spend())return;demoNotes.set(friend.id,{message,nick:player.nick});persist();$('#giftDialog').close();toast('시연 학생의 책상에 메모와 1캔을 놓았어요. 실제 전송은 아닙니다.');return}
  if(!network?.hasPeer(friend.id)){toast('친구의 연결이 끊겼어요. 캔은 차감되지 않았어요.');return}
  const transfer=wallet.reserve(crypto.randomUUID(),friend.id,message);if(!transfer)return;persist();$('#giftDialog').close();deliver(transfer);
};
setInterval(()=>{for(const transfer of wallet.outbox)deliver(transfer)},4500);
function updateGuestbookBadge(){
  const count=wallet.inbox.filter(note=>!note.claimed).length;$('#unreadBadge').textContent=count||'';$('#unreadBadge').hidden=count===0;
  if($('#guestbook').open)renderGuestbook();
}
function renderGuestbook(){
  const list=$('#letterList');list.replaceChildren();$('#lettersEmpty').hidden=wallet.inbox.length>0;
  for(const note of [...wallet.inbox].reverse()){
    const button=document.createElement('button');button.className='letterEntry';
    const title=document.createElement('strong'),preview=document.createElement('span'),meta=document.createElement('small');
    title.textContent=note.nick+'의 편지';preview.textContent=note.message;
    const date=note.receivedAt?new Date(note.receivedAt).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'이전 편지';
    meta.textContent=`${date} · ${note.claimed?'읽음 / 선물 수령 완료':'새 편지 / 에너지 1캔'}`;
    button.append(title,preview,meta);button.onclick=()=>openReceivedNote(note.id,true);list.append(button);
  }
}
function openReceivedNote(id,fromBook=false){
  const note=wallet.inbox.find(note=>note.id===id);if(!note)return;
  const claimed=wallet.claim(note.id);persist();noteFromBook=fromBook;
  $('#noteFrom').textContent=`${note.nick}의 메모`;$('#noteMessage').textContent=note.message;
  $('#noteReceipt').textContent=claimed?'선물 받은 가상 에너지 1캔이 보유 수량에 추가됐어요.':'이미 읽은 편지예요. 선물은 앞서 수령했으며 다시 지급되지 않아요.';
  if($('#guestbook').open)$('#guestbook').close();$('#noteDialog').showModal();keys.clear();
}
$('#guestbookButton').onclick=()=>{renderGuestbook();$('#guestbook').showModal();keys.clear()};
$('#guestbookClose').onclick=()=>$('#guestbook').close();
$('#noteDialog').onclose=()=>{if(noteFromBook){noteFromBook=false;renderGuestbook();$('#guestbook').showModal()}};
function showNote(owner){
  if(owner===player.id){
    const note=wallet.inbox.find(n=>!n.claimed);if(!note){toast('이미 읽은 편지는 방명록에서 다시 볼 수 있어요.');return}
    openReceivedNote(note.id);return;
  }else if(demoNotes.has(owner)){
    const note=demoNotes.get(owner);noteFromBook=false;$('#noteFrom').textContent='시연 학생의 책상 메모';$('#noteMessage').textContent=note.message;$('#noteReceipt').textContent='시연용 메모입니다. 실제 사용자에게 전달되지 않았으며, 보낸 사람에게 캔이 다시 지급되지 않습니다.';demoNotes.delete(owner);
  }else{toast('친구에게 온 메모예요. 내용은 받는 사람만 볼 수 있어요.');return}
  $('#noteDialog').showModal();keys.clear();
}
$('#noteClose').onclick=()=>$('#noteDialog').close();
function activate(hit){if(!hit)return;if(hit.type==='note')showNote(hit.owner);else if(hit.type==='person')selectFriend(hit.person);else if(hit.type==='seat')goToSeat(hit.seat);else if(hit.type==='rest')takeBreak(hit.bench)}
const canvas=$('#room');
canvas.onpointerdown=e=>{if(mode)return;pointer={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)};
canvas.onpointermove=e=>{if(!pointer)return;if(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>7)pointer.moved=true;if(pointer.moved){scene.yaw-=(e.clientX-pointer.lastX)*.006;scene.pitch=Math.max(.38,Math.min(.86,scene.pitch+(e.clientY-pointer.lastY)*.002))}pointer.lastX=e.clientX;pointer.lastY=e.clientY};
canvas.onpointerup=e=>{if(pointer&&!pointer.moved)activate(scene.hit(e.clientX,e.clientY));pointer=null};canvas.onpointercancel=()=>pointer=null;
const stick=$('#joystick');function moveStick(e){const r=stick.getBoundingClientRect();joy.x=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/25));joy.z=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/25));stick.firstElementChild.style.transform=`translate(${joy.x*17}px,${joy.z*17}px)`}
stick.onpointerdown=e=>{stick.setPointerCapture(e.pointerId);moveStick(e)};stick.onpointermove=e=>{if(stick.hasPointerCapture(e.pointerId))moveStick(e)};stick.onpointerup=stick.onpointercancel=()=>{joy={x:0,z:0};stick.firstElementChild.style.transform=''};
addEventListener('keydown',e=>{
  if(e.target.matches('textarea,input')||$('dialog[open]'))return;
  const key=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown',' '].includes(key))e.preventDefault();
  if(mode==='game'){game.key(key,true);return}if(!mode)keys.add(key);
});
addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());game.key(e.key.toLowerCase(),false)});
addEventListener('blur',()=>{keys.clear();joy={x:0,z:0};for(const k of ['arrowleft','arrowright','a','d'])game.key(k,false)});
$('#enter').onclick=()=>{entered=true;clock.start(now());$('#welcome').close();toast('타이머를 시작했어요. 빈 책상을 누르면 통로를 따라 걸어가요.')};$('#welcome').showModal();
function reconcile(){
  if(player.seat!==null&&owners().get(player.seat)!==player.id){player.seat=null;player.phase='idle';target=null;toast('다른 방문자가 먼저 이 자리에 앉았어요. 다른 빈자리를 선택해 주세요.')}
}
import('./study-network.js').then(({connectStudy})=>{
  network=connectStudy({getState:()=>({...player,noteCount:wallet.inbox.filter(n=>!n.claimed).length}),
    onPlayers:people=>{peers=people;reconcile()},
    onGift:(gift,sender)=>{const accepted=wallet.receive(gift,sender);if(accepted){persist();toast(player.seat===null?'메모와 에너지가 도착했어요. 자리에 앉으면 책상에서 확인할 수 있어요.':'책상에 메모와 에너지가 도착했어요. 메모를 눌러 보세요.')}return accepted},
    onStatus:text=>$('#connection').textContent=text});player.id=network.id;
}).catch(error=>{$('#connection').textContent='연결 불가 · 혼자 체험 중';console.error('Study connection',error)});
function frame(ms){
  const dt=Math.min(.06,(ms-last)/1000||.016);last=ms;const stamp=now();
  if(!mode&&!$('dialog[open]')){
    if(player.phase==='drink'){
      if(stamp>=drinkEnds){player.awake=true;player.wakeAt=ms/1000;player.phase=player.onBreak?'rest':player.seat===null?'idle':'focus';studyStarted=stamp;fxEnds=stamp+1800;updateInventory()}
    }else{
      const sx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joy.x;
      const sz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joy.z;
      if(Math.hypot(sx,sz)>.15){leaveSeat();const l=Math.max(1,Math.hypot(sx,sz)),moved=collisionMove(player,dt*3*(sx*Math.cos(scene.yaw)+sz*Math.sin(scene.yaw))/l,dt*3*(-sx*Math.sin(scene.yaw)+sz*Math.cos(scene.yaw))/l,{passSeat:accessSeat,passBench:accessBench??player.restBench});player.x=moved.x;player.z=moved.z}
      else if(target){const point=target.points[0],dx=point.x-player.x,dz=point.z-player.z,d=Math.hypot(dx,dz);if(d<.045){player.x=point.x;player.z=point.z;target.points.shift();if(!target.points.length){const done=target.done;target=null;done()}}else{player.phase='walk';const moved=collisionMove(player,dx/d*Math.min(d,dt*3.8),dz/d*Math.min(d,dt*3.8),target.options);player.x=moved.x;player.z=moved.z}}
      else if(player.phase==='walk')player.phase='idle';
      if(['study','focus'].includes(player.phase)&&stamp-studyStarted>=CONFIG.drowsyAfterMs){player.phase='sleepy';player.awake=false}
    }
  }
  $('#focusFx').hidden=stamp>=fxEnds||!!mode;
  $('#status').textContent=player.onBreak?(target?.returning?'자리로 돌아가는 중 · 타이머는 잠시 정지':'잠시 휴식 중 · 공부 시간은 멈춰 있어요.'):player.phase==='sleepy'?'꾸벅… 졸음이 오나요? 한 캔 마셔볼까요?':player.phase==='drink'?'딸깍—칙! 한 모금 충전 중':player.phase==='focus'?'빡공모드 ON · 다시 한 페이지씩!':player.seat!==null?`${player.seat+1}번 자리 · ${player.phase==='walk'?'통로를 따라 가는 중':'공부 중'}`:'빈자리를 눌러 공부를 시작하세요.';
  $('#clockValue').textContent=clockText(clock.total(now()));$('#clockState').textContent=mode?'개인 체험 중 · 시간 정지':player.onBreak?'잠시 휴식 · 시간 정지':clock.running?'공부 시간 기록 중':'입장하면 기록을 시작해요.';
  $('#pauseStudy').textContent=player.onBreak?'공부로 돌아가기':'잠시 쉬기';$('#pauseStudy').disabled=!!mode||player.phase==='drink'||!!target?.returning;
  $('#studyTimer').dataset.clock=JSON.stringify({running:clock.running,totalMs:clock.total(now()),onBreak:player.onBreak});$('#sound').dataset.audio=JSON.stringify(studyAudio.state());
  const counts=new Map([[player.id,wallet.inbox.filter(n=>!n.claimed).length],...peers.map(p=>[p.id,p.noteCount]),...Array.from(demoNotes.keys(),id=>[id,1])]);
  scene.render(player,peers,DEMOS,owners(),counts,ms/1000,dt);
  canvas.dataset.wallet=JSON.stringify({balance:wallet.balance,available:wallet.available,pending:wallet.outbox.length,inbox:wallet.inbox.filter(n=>!n.claimed).length});
  if(mode==='toy')toy.render(ms/1000,dt);if(mode==='game')game.draw(dt);
  requestAnimationFrame(frame);
}
persist();requestAnimationFrame(frame);
