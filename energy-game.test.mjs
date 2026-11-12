import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnergyGame} from '../dist/energy-game.js';
function canvas(){
  const context=new Proxy({}, {get:(object,key)=>object[key]??(()=>{}),set:(object,key,value)=>(object[key]=value,true)});
  return {clientWidth:600,clientHeight:500,width:0,height:0,dataset:{},getContext:()=>context,
    getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(){},hasPointerCapture:()=>true};
}
test('caught galangal raises score, reaches FEVER and settles once',()=>{
  globalThis.devicePixelRatio=1;const surface=canvas();let finished=0,result;
  const game=createEnergyGame(surface,()=>null,(id,score)=>{finished++;result=score},()=>{},()=>.5);
  game.start();for(let i=0;i<260;i++)game.draw(.1);game.finish();
  assert.equal(game.state.done,true);assert.equal(game.state.fever,true);assert.ok(result>=12);assert.equal(finished,1);
});
test('caught caffeine deducts points and pointer dragging moves the catcher',()=>{
  globalThis.devicePixelRatio=1;const surface=canvas();let score;
  const game=createEnergyGame(surface,()=>null,(_id,result)=>score=result,()=>{},()=>.9);
  game.start();game.draw(.1);surface.onpointerdown({pointerId:1,clientX:512});
  assert.equal(game.state.x,512);for(let i=0;i<260;i++)game.draw(.1);
  assert.ok(score<0);assert.equal(game.state.fever,false);
});
