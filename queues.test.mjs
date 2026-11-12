import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenQueues, validPlayer, validSnapshot, mergeSnapshots} from '../dist/queue-core.js';

const state = (token, machine = 0, ready = true) => ({
  x: [5, -8, 12][machine], z: [2.5, -4.5, -8.5][machine],
  act: 'idle', nick: '방문자', intent: {token, machine, ready}
});

test('one browser at a time, then advance; stale intents never rejoin', () => {
  const q = new GardenQueues();
  q.observe('a', state('one')); q.observe('b', state('two'));
  q.tick(1000);
  assert.equal(q.lines[0][0].until, 4500);
  assert.equal(q.lines[0][1].until, null);
  q.tick(4500);
  assert.equal(q.lines[0][0].peerId, 'b');
  assert.equal(q.lines[0][0].until, 8000);
  q.observe('a', state('one'));
  assert.equal(q.lines[0].length, 1);
});
test('vending machines run independently and leaving removes only that player', () => {
  const q = new GardenQueues();
  q.observe('a', state('one')); q.observe('b', state('two', 1));
  q.tick(1000);
  assert.equal(q.lines[0][0].until, q.lines[1][0].until);
  q.observe('a', {intent: null});
  assert.equal(q.lines[0].length, 0); assert.equal(q.lines[1].length, 1);
  q.remove('b'); assert.equal(q.lines[1].length, 0);
});
test('a waiting browser must reach the machine before drinking', () => {
  const q = new GardenQueues();
  q.observe('a', {...state('one'), z: 3.35}); q.tick(1000);
  assert.equal(q.lines[0][0].until, null);
  q.observe('a', state('one')); q.tick(1200);
  assert.equal(q.lines[0][0].until, 4700);
});
test('coordinator migration preserves remaining drink time across different clocks', () => {
  const q = new GardenQueues(); q.observe('a', state('one')); q.tick(1000);
  const next = new GardenQueues(q.snapshot(2000), 90000);
  assert.equal(next.lines[0][0].until, 92500);
  next.tick(92500); assert.deepEqual(next.completed, ['one']);
});
test('handover merges queues and completion receipts without duplication', () => {
  const a = new GardenQueues(), b = new GardenQueues();
  a.observe('a', state('one')); b.observe('b', state('two', 1));
  const merged = mergeSnapshots(a.snapshot(0), b.snapshot(0));
  assert.equal(merged.lines[0].length, 1); assert.equal(merged.lines[1].length, 1);
  assert.equal(mergeSnapshots(merged, merged).lines.flat().length, 2);
});
test('network values are validated before entering the scene', () => {
  assert.equal(validPlayer({x: Infinity,z: 0,act:'idle'}), null);
  assert.equal(validPlayer({x:0,z:0,act:'script'}), null);
  assert.equal(validSnapshot({revision:1,lines:[[],[],[]],completed:[]},new Set()), true);
  assert.equal(validSnapshot({revision:1,lines:[[{peerId:'unknown'}],[],[]],completed:[]},new Set()), false);
});
