import {joinRoom,selfId} from './vendor/trystero-0.26.0.mjs';
import {validClubState} from './club-core.js';
export function connectClub({getState,onPlayers,onGift,onStatus}){
 const room=joinRoom({appId:'vita500-energy-teen-club-v1',maxReceiveBytes:8192},(new URLSearchParams(location.search).get('room')||'teen-club').slice(0,80),{onJoinError:()=>onStatus('직접 연결이 제한됐어요 · 혼자 체험 가능')});
 const states=new Map(),action=room.makeAction('club-state'),gift=room.makeAction('club-gift',{kind:'request',onRequest:(data,{peerId})=>({accepted:onGift(data,peerId)})});
 action.onReceive=gift.onReceive=({byteLength})=>byteLength<2048;
 const report=()=>{const ids=Object.keys(room.getPeers());onPlayers([...states].filter(([id])=>ids.includes(id)).map(([id,s])=>({id,...s})));onStatus(ids.length?`실제 방문자 ${ids.length}명과 연결됨`:'혼자 체험 중 · 다른 방문자를 기다려요')};
 const send=()=>Promise.resolve(action.send(getState())).catch(()=>{});
 action.onMessage=(data,{peerId})=>{const s=validClubState(data);if(s){states.set(peerId,s);report()}};
 room.onPeerJoin=()=>{send();report()};room.onPeerLeave=id=>{states.delete(id);report()};
 const timer=setInterval(send,160);addEventListener('pagehide',()=>{clearInterval(timer);room.leave()},{once:true});report();
 return{id:selfId,sendGift:(target,data)=>gift.request(data,{target,timeoutMs:6000}),hasPeer:id=>Object.hasOwn(room.getPeers(),id)};
}
