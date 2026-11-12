import test from 'node:test';import assert from 'node:assert/strict';
import {SEATS} from '../dist/study-config.js';
import {findPath,clearSegment,collisionMove,seatPosition,walkable,REST_CHAIRS} from '../dist/study-navigation.js';
import {StudyClock,clockText} from '../dist/study-clock.js';
test('every desk is reachable through the chair opening without crossing furniture',()=>{
  for(const seat of SEATS){const options={passSeat:seat.id},start={x:0,z:8},end=seatPosition(seat.id),path=findPath(start,end,options);assert.ok(path,'desk '+seat.id);let previous=start;for(const p of path){assert.ok(clearSegment(previous,p,options));previous=p}assert.ok(Math.hypot(previous.x-end.x,previous.z-end.z)<.001)}
});
test('manual movement cannot tunnel through a desk or divider',()=>{
  const s=SEATS[9],start={x:s.x,z:s.z-.35},options={passSeat:s.id};
  const end=collisionMove(start,0,4,options);assert.ok(end.z<s.z);assert.ok(walkable(end,options));
});
test('the corridor and all rest chairs have furniture-free routes, and the desk is reachable again',()=>{
  const start=seatPosition(9);
  for(const chair of REST_CHAIRS){const options={passSeat:9,passBench:chair.id};const path=findPath(start,chair,options);assert.ok(path);let p=start;for(const next of path){assert.ok(clearSegment(p,next,options));p=next}assert.ok(findPath(chair,start,options))}
});
test('moving between desks can exit the previous chair and enter the next one',()=>assert.ok(findPath(seatPosition(9),seatPosition(0),{passSeat:0,exitSeat:9})));
test('the clock records only running intervals, resumes, and excludes closed-browser time',()=>{
  const timer=new StudyClock();timer.start(1000);assert.equal(timer.total(6000),5000);timer.pause(6000);assert.equal(timer.total(20000),5000);timer.start(20000);assert.equal(timer.total(23000),8000);timer.pause(23000);const restored=new StudyClock(timer.elapsed);assert.equal(restored.total(999999),8000);assert.equal(restored.running,false);assert.equal(clockText(3661000),'01:01:01');
});
