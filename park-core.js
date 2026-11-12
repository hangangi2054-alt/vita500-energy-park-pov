import {CONFIG,inDance,nearTable,coasterPoint} from './park-config.js';
import {walkable} from './park-navigation.js';
import {Wallet} from './study-core.js';
export class ParkWallet extends Wallet{
 constructor(saved){super(saved);if(!saved)this.balance=CONFIG.startingCans}
  receive(gift,sender){const old=this.inbox.some(n=>n.id===gift?.id);if(!super.receive(gift,sender))return false;if(!old)this.claim(gift.id);return true}
  reject(id){this.outbox=this.outbox.filter(t=>t.id!==id)}
}
export function dance(p,special=false){
  if(['drink','ride'].includes(p.phase)||p.paused||!inDance(p))return false;
  if(p.phase==='special')return false;
  p.phase=special?'special':'dance';p.specialLeft=special?CONFIG.specialSeconds:0;return true;
}
export function stop(p){if(['drink','ride'].includes(p.phase)||p.paused)return false;p.phase='idle';p.specialLeft=0;return true}
export function move(p,dx,dz){if(['drink','ride'].includes(p.phase)||p.paused)return false;p.phase='walk';p.specialLeft=0;return true}
export function beginDrink(p,wallet){if(p.paused||['drink','ride'].includes(p.phase)||!nearTable(p)||!wallet.spend())return false;p.phase='drink';p.drinkLeft=CONFIG.drinkSeconds;return true}
export function tick(p,dt){
  if(p.paused)return;
  if(p.phase==='dance'||p.phase==='special'){p.danced=Math.min(CONFIG.tireAfterSeconds,p.danced+dt);p.tired=p.danced/CONFIG.tireAfterSeconds;if(p.phase==='special'){p.specialLeft-=dt;if(p.specialLeft<=0)p.phase='dance'}}
  if(p.phase==='drink'){p.drinkLeft-=dt;if(p.drinkLeft<=0){p.phase='idle';p.danced=0;p.tired=0;p.awake=true;p.wakePulse=1.5}}
  p.wakePulse=Math.max(0,(p.wakePulse||0)-dt);p.heartLeft=Math.max(0,(p.heartLeft||0)-dt);
}
export function validParkState(data){
  if(!data||!Number.isFinite(data.x)||!Number.isFinite(data.z)||!['idle','walk','dance','special','drink','game','ride'].includes(data.phase)||(!inDance(data)&&['dance','special'].includes(data.phase)))return null;
  if(data.phase==='ride'){if(!Number.isFinite(data.rideProgress)||data.rideProgress<0||data.rideProgress>1)return null;const p=coasterPoint(data.rideProgress);if(Math.hypot(data.x-p.x,data.z-p.z)>.5)return null}else if(!walkable(data))return null;
  return{x:data.x,z:data.z,rideProgress:Math.max(0,Math.min(1,Number(data.rideProgress)||0)),nick:String(data.nick||'파크 방문자').slice(0,30),phase:data.phase,tired:Math.max(0,Math.min(1,Number(data.tired)||0)),awake:!!data.awake,heartLeft:Math.max(0,Math.min(3,Number(data.heartLeft)||0)),wakePulse:Math.max(0,Math.min(2,Number(data.wakePulse)||0))};
}
