import {joinRoom,selfId} from './vendor/trystero-0.26.0.mjs';
import {validStudyState} from './study-core.js';

export function connectStudy({getState,onPlayers,onGift,onStatus}){
  const roomId=(new URLSearchParams(location.search).get('room')||'reading-room').slice(0,80);
  const room=joinRoom({appId:'vita500-study-room-v2',maxReceiveBytes:8192},roomId,
    {onJoinError:()=>onStatus('직접 연결이 제한됐어요 · 혼자 체험 가능')});
  const states=new Map();
  const action=room.makeAction('study-state');
  const gift=room.makeAction('study-gift',{kind:'request',onRequest:(data,{peerId})=>({accepted:onGift(data,peerId)})});
  action.onReceive=({byteLength})=>byteLength<2048;
  gift.onReceive=({byteLength})=>byteLength<2048;
  const send=()=>Promise.resolve(action.send(getState())).catch(()=>{});
  const report=()=>{
    const ids=Object.keys(room.getPeers());
    onPlayers([...states].filter(([id])=>ids.includes(id)).map(([id,s])=>({id,...s})));
    onStatus(ids.length?`실제 방문자 ${ids.length}명과 연결됨`:'혼자 체험 중 · 다른 방문자를 기다려요');
  };
  action.onMessage=(data,{peerId})=>{const state=validStudyState(data);if(state){states.set(peerId,state);report()}};
  room.onPeerJoin=()=>{send();report()};
  room.onPeerLeave=id=>{states.delete(id);report()};
  const interval=setInterval(send,180);
  addEventListener('pagehide',()=>{clearInterval(interval);room.leave()},{once:true});
  report();
  return {id:selfId,sendGift:(target,data)=>gift.request(data,{target,timeoutMs:7000}),
    hasPeer:id=>Object.hasOwn(room.getPeers(),id)};
}
