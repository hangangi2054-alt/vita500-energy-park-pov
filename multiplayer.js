import {joinRoom, selfId} from './vendor/trystero-0.26.0.mjs';
import {GardenQueues, validPlayer, validSnapshot, mergeSnapshots} from './queue-core.js';

export function connectGarden({getPlayer, onPlayers, onQueues, onStatus}) {
  const roomName = new URLSearchParams(location.search).get('room') || 'great-lawn';
  const room = joinRoom({appId: 'vita500-energy-garden-20261109-v2', maxReceiveBytes: 32768},
    roomName.slice(0, 80), {onJoinError: () => onStatus('네트워크에서 직접 연결이 제한됐어요 · 혼자 체험 가능')});
  const states = new Map();
  const stateAction = room.makeAction('garden-v1');
  const queueAction = room.makeAction('queues-v1');
  const handoverAction = room.makeAction('handover-v1');
  let intent = null, leader = selfId, engine = new GardenQueues(), cached = null;
  let stableAt = Date.now() + 900, lastRevision = -1, stopped = false;
  const members = () => [selfId, ...Object.keys(room.getPeers())].sort();
  const local = () => ({...getPlayer(), intent});
  const safeSend = (action, data, options) => {
    Promise.resolve(action.send(data, options)).catch(() => {});
  };
  function elect() {
    const ids = members(), next = ids[0];
    if (next !== leader) {
      leader = next;
      stableAt = Date.now() + 900;
      lastRevision = -1;
      if (leader === selfId) engine = new GardenQueues(cached);
    }
    const count = ids.length - 1;
    onStatus(count ? `P2P 연결 · 나 외 ${count}명과 함께` : 'P2P 준비 · 다른 방문자를 기다려요');
    return ids;
  }
  function broadcastPlayer() {
    states.set(selfId, local());
    safeSend(stateAction, local());
  }
  function renderPlayers() {
    onPlayers([...states].filter(([id]) => id !== selfId && members().includes(id))
      .map(([id, value]) => ({id, ...value})));
  }
  stateAction.onReceive = ({byteLength}) => byteLength <= 4096;
  queueAction.onReceive = ({byteLength}) => byteLength <= 32768;
  handoverAction.onReceive = ({byteLength}) => byteLength <= 32768;
  handoverAction.onMessage = (data) => {
    if (leader !== selfId || Date.now() >= stableAt) return;
    if (!validSnapshot(data, new Set(members()))) return;
    cached = mergeSnapshots(data, cached);
    engine = new GardenQueues(cached);
  };
  stateAction.onMessage = (data, {peerId}) => {
    const parsed = validPlayer(data);
    if (!parsed) return;
    states.set(peerId, parsed);
    renderPlayers();
  };
  queueAction.onMessage = (data, {peerId}) => {
    const ids = elect();
    if (!validSnapshot(data, new Set(ids))) return;
    if (peerId !== leader) return;
    if (data.revision <= lastRevision) return;
    lastRevision = data.revision;
    cached = data;
    onQueues(data, selfId);
  };
  room.onPeerJoin = peerId => {
    stableAt = Date.now() + 900;
    elect();
    // Existing browsers immediately pass their queue snapshot to a newly elected
    // browser so changing the coordinator does not clear the line.
    if (cached) safeSend(handoverAction, cached, {target: peerId});
    broadcastPlayer();
  };
  room.onPeerLeave = peerId => {
    states.delete(peerId);
    engine.remove(peerId);
    elect();
    renderPlayers();
  };
  const timer = setInterval(() => {
    if (stopped) return;
    const ids = elect();
    broadcastPlayer();
    if (leader !== selfId || Date.now() < stableAt) return;
    const alive = new Set(ids);
    for (const line of engine.lines) for (const item of [...line]) {
      if (!alive.has(item.peerId)) engine.remove(item.peerId);
    }
    for (const id of ids) if (states.has(id)) engine.observe(id, states.get(id));
    engine.tick();
    cached = engine.snapshot();
    onQueues(cached, selfId);
    safeSend(queueAction, cached);
  }, 150);
  elect();
  const pagehide = () => { stopped = true; clearInterval(timer); room.leave(); };
  addEventListener('pagehide', pagehide, {once: true});
  return {
    selfId,
    command(command, machine) {
      if (command === 'join') intent = {token: crypto.randomUUID(), machine, ready: false};
      if (command === 'leave') intent = null;
      if (command === 'ready' && intent) intent.ready = true;
      broadcastPlayer();
      return intent?.token;
    },
    finish(token) { if (intent?.token === token) intent = null; },
    close: pagehide
  };
}
