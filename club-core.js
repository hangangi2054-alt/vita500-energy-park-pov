import {CONFIG,inDance,nearTable} from './club-config.js';
import {walkable} from './club-navigation.js';
import {Wallet} from './study-core.js';
export class ClubWallet extends Wallet{
 constructor(saved){super(saved);if(!saved)this.balance=CONFIG.startingCans}
  receive(gift,sender){const old=this.inbox.some(n=>n.id===gift?.id);if(!super.receive(gift,sender))return false;if(!old)this.claim(gift.id);return true}
  reject(id){this.outbox=this.outbox.filter(t=>t.id!==id)}
}
export function dance(p,special=false){
  if(p.phase==='drink'||p.paused||!inDance(p))return false;
  if(p.phase==='special')return false;
  p.phase=special?'special':'dance';p.specialLeft=special?CONFIG.specialSeconds:0;return true;
}
export function stop(p){if(p.phase==='drink'||p.paused)return false;p.phase='idle';p.specialLeft=0;return true}
export function move(p,dx,dz){if(p.phase==='drink'||p.paused)return false;p.phase='walk';p.specialLeft=0;return true}
export function beginDrink(p,wallet){if(p.paused||p.phase==='drink'||!nearTable(p)||!wallet.spend())return false;p.phase='drink';p.drinkLeft=CONFIG.drinkSeconds;return true}
export function tick(p,dt){
  if(p.paused)return;
  if(p.phase==='dance'||p.phase==='special'){p.danced=Math.min(CONFIG.tireAfterSeconds,p.danced+dt);p.tired=p.danced/CONFIG.tireAfterSeconds;if(p.phase==='special'){p.specialLeft-=dt;if(p.specialLeft<=0)p.phase='dance'}}
  if(p.phase==='drink'){p.drinkLeft-=dt;if(p.drinkLeft<=0){p.phase='idle';p.danced=0;p.tired=0;p.awake=true;p.wakePulse=1.5}}
  p.wakePulse=Math.max(0,(p.wakePulse||0)-dt);p.heartLeft=Math.max(0,(p.heartLeft||0)-dt);
}
export function validClubState(data){
  if(!data||!walkable(data)||!['idle','walk','dance','special','drink','game'].includes(data.phase)||(!inDance(data)&&['dance','special'].includes(data.phase)))return null;
  return{x:data.x,z:data.z,nick:String(data.nick||'클럽 방문자').slice(0,30),phase:data.phase,tired:Math.max(0,Math.min(1,Number(data.tired)||0)),awake:!!data.awake,heartLeft:Math.max(0,Math.min(3,Number(data.heartLeft)||0)),wakePulse:Math.max(0,Math.min(2,Number(data.wakePulse)||0))};
}
