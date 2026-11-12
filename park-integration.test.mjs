import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {ParkScene} from '../dist/park-scene.js';
test('independent park controller runs entrance, dance, recharge, coaster and minigame without study UI',async()=>{
 let time=1000,raf,latestScene;const elements=new Map();
 const ctx=new Proxy({}, {get:(o,k)=>o[k]??(k.startsWith('create')?()=>({addColorStop(){}}):k==='measureText'?text=>({width:String(text).length*8}):()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 class Element{
  set id(v){this._id=v;if(v)elements.set(v,this)}get id(){return this._id}
  constructor(id=''){this.id=id;this.dataset={};this.style={};this.hidden=false;this.disabled=false;this.open=false;this.clientWidth=1280;this.clientHeight=720;this.textContent='';this.children=[];this.firstElementChild={style:{}};this.value='';this.width=0;this.height=0}
  set innerHTML(html){for(const m of html.matchAll(/id="([^"]+)"/g))elements.set(m[1],new Element(m[1]))}get innerHTML(){return ''}append(...c){this.children.push(...c)}replaceChildren(...c){this.children=c}setAttribute(k,v){this[k]=v}getContext(){return ctx}showModal(){this.open=true}close(){this.open=false;this.onclose?.()}click(){if(!this.disabled)return this.onclick?.({preventDefault(){}})}getBoundingClientRect(){return{left:0,top:0,width:1280,height:720}}setPointerCapture(){}hasPointerCapture(){return true}
 }
 const html=await fs.readFile(new URL('../dist/park.html',import.meta.url),'utf8');for(const m of html.matchAll(/id="([^"]+)"/g))elements.set(m[1],new Element(m[1]));
 const body=new Element(),head=new Element();globalThis.document={body,head,createElement:()=>new Element(),querySelector:s=>s==='dialog[open]'?[...elements.values()].find(e=>e.open)||null:s==='#joystick i'?elements.get('joystick').firstElementChild:elements.get(s.slice(1))||null};
 const storage=new Map();globalThis.sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))};globalThis.Image=class{};globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=fn=>raf=fn;
 const originalPerformance=globalThis.performance,originalInterval=globalThis.setInterval,originalTimeout=globalThis.setTimeout,originalConsole=console.error;globalThis.performance={now:()=>time};globalThis.setInterval=()=>0;globalThis.setTimeout=()=>0;console.error=()=>{};
 const render=ParkScene.prototype.render;ParkScene.prototype.render=function(...args){latestScene=this;return render.apply(this,args)};
 try{
  await import('../dist/park-app.js?integration=park');const step=(n=1)=>{for(let i=0;i<n;i++){time+=50;raf(time)}};const state=()=>JSON.parse(elements.get('club').dataset.state),wallet=()=>JSON.parse(elements.get('club').dataset.wallet);
  elements.get('enter').click();step(3);assert.equal(elements.has('studyTimer'),false);assert.equal(wallet().balance,3);assert.equal(state().demos,5);
  elements.get('toStage').click();step(260);await elements.get('dance').click();step(5);assert.equal(state().phase,'dance');
  const table=latestScene.hits.find(h=>h.type==='table'&&h.table.id===1);assert.ok(table);const canvas=elements.get('club');canvas.onpointerdown({clientX:table.x,clientY:table.y,pointerId:1});canvas.onpointerup({clientX:table.x,clientY:table.y,pointerId:1});step(260);await elements.get('drink').click();step(60);assert.equal(wallet().balance,2);assert.equal(state().phase,'idle');
  elements.get('toRide').click();step(250);await elements.get('special').click();step(100);assert.equal(state().phase,'ride');assert.ok(state().rideProgress>.2);assert.equal(elements.get('make').disabled,true);step(280);assert.equal(state().phase,'idle');assert.ok(Math.abs(state().x-2.2)<.1);assert.equal(wallet().balance,2);
  const before={x:state().x,z:state().z};elements.get('make').click();step(2);assert.equal(elements.get('activity').hidden,false);assert.equal(state().paused,true);elements.get('return').click();step(2);assert.equal(state().paused,false);assert.equal(state().x,before.x);assert.equal(state().z,before.z);assert.equal(wallet().balance,2);
  elements.get('inbox').click();assert.ok(elements.get('messages').open);elements.get('messagesClose').click();assert.equal(elements.get('messages').open,false);
 }finally{await new Promise(resolve=>setImmediate(resolve));ParkScene.prototype.render=render;globalThis.performance=originalPerformance;globalThis.setInterval=originalInterval;globalThis.setTimeout=originalTimeout;console.error=originalConsole}
});
