import {CONFIG,SEATS} from './study-config.js';
export const rewardForScore = score => Math.min(CONFIG.maxGameReward,
  Math.floor(Math.max(0,score)/CONFIG.scorePerCan));

export class Wallet {
  constructor(saved=null){
    this.balance=Number.isInteger(saved?.balance)&&saved.balance>=0?saved.balance:CONFIG.startingCans;
    this.inbox=Array.isArray(saved?.inbox)?saved.inbox:[];
    this.outbox=Array.isArray(saved?.outbox)?saved.outbox:[];
    this.rewards=Array.isArray(saved?.rewards)?saved.rewards:[];
    this.sent=Array.isArray(saved?.sent)?saved.sent:[];
  }
  get available(){return Math.max(0,this.balance-this.outbox.length)}
  spend(){if(this.available<1)return false;this.balance--;return true}
  reserve(id,target,message){
    if(this.available<1||this.outbox.some(t=>t.id===id)||this.sent.includes(id))return null;
    const transfer={id,target,message};this.outbox.push(transfer);return transfer;
  }
  confirm(id){
    const index=this.outbox.findIndex(t=>t.id===id);
    if(index<0)return false;
    this.outbox.splice(index,1);this.balance--;this.sent.push(id);return true;
  }
  receive(gift,sender){
    if(!gift||typeof gift.id!=='string'||gift.id.length>80||typeof gift.message!=='string'||gift.message.length>80||
      typeof gift.nick!=='string'||gift.nick.length>30)return false;
    const old=this.inbox.find(t=>t.id===gift.id);
    if(old)return old.sender===sender;
    if(this.inbox.length>=200)return false;
    this.inbox.push({id:gift.id,message:gift.message,nick:gift.nick,sender,claimed:false,receivedAt:Date.now()});return true;
  }
  claim(id){const gift=this.inbox.find(t=>t.id===id);if(!gift||gift.claimed)return false;gift.claimed=true;gift.readAt=Date.now();this.balance++;return true}
  earn(id,score){if(this.rewards.includes(id))return 0;const cans=rewardForScore(score);this.balance+=cans;this.rewards.push(id);return cans}
  save(){return JSON.stringify(this)}
}
export function validStudyState(data){
  if(!data||!Number.isFinite(data.x)||!Number.isFinite(data.z)||Math.abs(data.x)>16||Math.abs(data.z)>12||
    !['idle','walk','study','sleepy','drink','focus','rest'].includes(data.phase)||
    !(data.seat===null||(Number.isInteger(data.seat)&&!!SEATS[data.seat])))return null;
  return {x:data.x,z:data.z,phase:data.phase,seat:data.seat,awake:!!data.awake,onBreak:!!data.onBreak,restBench:Number.isInteger(data.restBench)&&data.restBench>=0&&data.restBench<3?data.restBench:null,
    nick:String(data.nick||'독서실 방문자').slice(0,30),noteCount:Math.max(0,Math.min(200,Number(data.noteCount)||0))};
}
export function seatOwners(players, demos=[]){
  const owners=new Map(demos.map(d=>[d.seat,d.id]));
  for(const p of [...players].sort((a,b)=>a.id.localeCompare(b.id))){
    if(p.seat!==null&&SEATS[p.seat]&&!owners.has(p.seat))owners.set(p.seat,p.id);
  }
  return owners;
}
