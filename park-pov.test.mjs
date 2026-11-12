import test from 'node:test';
import assert from 'node:assert/strict';
import {coasterCamera,drawCoasterPOV} from '../dist/park-pov.js';
import {coasterPoint} from '../dist/park-config.js';
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
test('POV camera follows the existing rollercoaster path with an orthonormal viewing basis',()=>{
 for(const t of [0,.06,.13,.25,.4,.55,.7,.82,.94]){
  const view=coasterCamera(t),point=coasterPoint(t);
  assert.ok(Math.abs(view.position.x-point.x)<1e-7);
  assert.ok(Math.abs(view.position.z-point.z)<1e-7);
  assert.ok(Math.abs(view.position.y-point.y-.78)<1e-7);
  for(const axis of ['forward','right','up'])assert.ok(Math.abs(dot(view[axis],view[axis])-1)<1e-5);
  for(const [a,b] of [['forward','right'],['forward','up'],['right','up']])assert.ok(Math.abs(dot(view[a],view[b]))<1e-5);
 }
});
test('POV renderer draws track without an external 3D engine',()=>{
 const commands=[];
 const ctx=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):(...args)=>commands.push([key,...args]),set:()=>true});
 for(const progress of [0,.25,.5,.75,.99])drawCoasterPOV(ctx,900,600,progress,2);
 assert.ok(commands.filter(([key])=>key==='lineTo').length>100);
});
