import test from 'node:test';
import assert from 'node:assert/strict';
import {Wallet,rewardForScore,seatOwners,validStudyState} from '../dist/study-core.js';

test('drinking consumes exactly one available can and stops at zero',()=>{
  const wallet=new Wallet();assert.equal(wallet.balance,3);
  assert.equal(wallet.spend(),true);assert.equal(wallet.balance,2);
  wallet.spend();wallet.spend();assert.equal(wallet.spend(),false);assert.equal(wallet.balance,0);
});
test('pending delivery reserves a can; acknowledgment debits once',()=>{
  const wallet=new Wallet();wallet.reserve('gift','peer','화이팅');
  assert.equal(wallet.balance,3);assert.equal(wallet.available,2);
  wallet.spend();wallet.spend();assert.equal(wallet.spend(),false);
  assert.equal(wallet.confirm('gift'),true);assert.equal(wallet.balance,0);
  assert.equal(wallet.confirm('gift'),false);assert.equal(wallet.balance,0);
});
test('retries and repeated note clicks do not duplicate a gift',()=>{
  const wallet=new Wallet();const gift={id:'gift',message:'한 페이지 더!',nick:'친구'};
  assert.equal(wallet.receive(gift,'sender'),true);assert.equal(wallet.receive(gift,'sender'),true);
  assert.equal(wallet.inbox.length,1);assert.equal(wallet.balance,3);
  assert.equal(wallet.receive(gift,'different-sender'),false);
  assert.equal(wallet.claim('gift'),true);assert.equal(wallet.balance,4);
  assert.equal(wallet.claim('gift'),false);assert.equal(wallet.balance,4);
});
test('an unfinished transfer and claimed note survive reloading this tab',()=>{
  const wallet=new Wallet();wallet.reserve('a','p','좋은 하루');wallet.receive({id:'b',nick:'친구',message:'안녕'},'q');wallet.claim('b');
  const next=new Wallet(JSON.parse(wallet.save()));assert.equal(next.available,3);assert.equal(next.claim('b'),false);
});
test('game rewards are nonnegative, capped, and committed once',()=>{
  assert.equal(rewardForScore(-3),0);assert.equal(rewardForScore(12),2);assert.equal(rewardForScore(9999),6);
  const wallet=new Wallet();assert.equal(wallet.earn('round',12),2);assert.equal(wallet.earn('round',12),0);assert.equal(wallet.balance,5);
});
test('seat conflicts resolve deterministically; demo seats are reserved',()=>{
  const a={id:'a',seat:2},b={id:'b',seat:2};assert.equal(seatOwners([b,a]).get(2),'a');
  assert.equal(seatOwners([a],[{id:'demo',seat:2}]).get(2),'demo');
});
test('only bounded scene state and short messages are accepted',()=>{
  assert.equal(validStudyState({x:0,z:0,seat:99,phase:'study'}),null);
  assert.equal(validStudyState({x:Infinity,z:0,seat:null,phase:'idle'}),null);
  assert.equal(new Wallet().receive({id:'x',message:'a'.repeat(81),nick:'n'},'p'),false);
  assert.equal(validStudyState({x:2,z:3,seat:0,phase:'sleepy'}).phase,'sleepy');
});
