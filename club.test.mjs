import test from 'node:test';import assert from 'node:assert/strict';
import {OBSTACLES,TABLES,FIXTURES,tableSpot,CONFIG,spawn} from '../dist/club-config.js';
import {walkable,findPath,collisionMove,clearSegment} from '../dist/club-navigation.js';
import {ClubWallet,dance,stop,move,beginDrink,tick,validClubState} from '../dist/club-core.js';
const person=()=>({x:0,z:1,phase:'idle',danced:0,tired:0,paused:false,heartLeft:0});
test('spawn and all table approach spots are empty; paths route around the real fixture sizes',()=>{
 for(let i=0;i<100;i++)assert.ok(walkable(spawn()));
 for(const start of [{x:0,z:7.5},{x:-8.5,z:7},{x:8.5,z:-3.7},...TABLES.map(tableSpot)])for(const end of TABLES.map(tableSpot)){const path=findPath(start,end);assert.ok(path);let from=start;for(const p of path){assert.ok(clearSegment(from,p));from=p}}
 for(const o of OBSTACLES){assert.equal(walkable({x:o.x,z:o.z}),false);assert.equal(findPath({x:0,z:7},{x:o.x,z:o.z}),null)}
});
test('manual movement cannot tunnel into tables, stage, speakers, props or walls',()=>{
 for(const o of [...TABLES,...FIXTURES]){const start={x:o.x,z:o.z+o.d/2+CONFIG.bodyRadius+.1};if(!walkable(start))continue;const end=collisionMove(start,0,-5);assert.ok(walkable(end));assert.ok(end.z>=o.z+o.d/2+CONFIG.bodyRadius-.001)}
 assert.ok(walkable(collisionMove({x:0,z:7},100,100)));
});
test('dance zone, special reentry, normal return and movement transitions are exclusive',()=>{
 const p=person();p.z=10.5;assert.equal(dance(p),false);p.z=1;assert.ok(dance(p,true));assert.equal(dance(p,true),false);tick(p,CONFIG.specialSeconds+.1);assert.equal(p.phase,'dance');move(p);assert.equal(p.phase,'walk');assert.equal(p.specialLeft,0);stop(p);assert.equal(p.phase,'idle');
});
test('fatigue accumulates only while dancing; game freezes every personal timer; drink only at table',()=>{
 const p=person(),w=new ClubWallet();dance(p);tick(p,CONFIG.tireAfterSeconds);assert.equal(p.tired,1);p.paused=true;const before=JSON.stringify(p);tick(p,10);assert.equal(JSON.stringify(p),before);p.paused=false;assert.equal(beginDrink(p,w),false);Object.assign(p,tableSpot(TABLES[0]));assert.ok(beginDrink(p,w));assert.equal(w.balance,2);assert.equal(beginDrink(p,w),false);assert.equal(move(p),false);tick(p,CONFIG.drinkSeconds+.1);assert.equal(p.tired,0);assert.ok(p.awake);assert.equal(p.phase,'idle');assert.equal(w.balance,2);
});
test('gifts credit on receipt once; failed sends cost nothing; uncertain reservations cannot double spend',()=>{
 const a=new ClubWallet(),b=new ClubWallet();const t=a.reserve('once','b','응원해!');assert.equal(a.available,2);assert.equal(a.balance,3);const gift={id:t.id,message:t.message,nick:'친구'};assert.ok(b.receive(gift,'a'));assert.equal(b.balance,4);assert.ok(b.receive(gift,'a'));assert.equal(b.balance,4);assert.ok(a.confirm(t.id));assert.equal(a.balance,2);assert.equal(a.confirm(t.id),false);assert.equal(b.claim(t.id),false);assert.equal(b.balance,4);a.reserve('fail','b','실패');a.reject('fail');assert.equal(a.balance,2);assert.equal(a.available,2);const restored=new ClubWallet(JSON.parse(b.save()));assert.equal(restored.balance,4);assert.equal(restored.inbox[0].message,'응원해!');
});
test('peer state rejects obstacles and out-of-zone dances',()=>{
 assert.ok(validClubState(person()));assert.equal(validClubState({...person(),phase:'dance',z:10.5}),null);assert.equal(validClubState({...person(),x:TABLES[0].x,z:TABLES[0].z}),null);assert.equal(validClubState({...person(),phase:'bad'}),null);
});
