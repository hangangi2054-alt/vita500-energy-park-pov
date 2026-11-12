// One elected browser serializes the three queues. No application server.
export class GardenQueues {
  constructor(snapshot = null, now = Date.now()) {
    this.lines = [[], [], []];
    this.completed = [];
    this.revision = 0;
    if (snapshot) {
      this.completed = [...snapshot.completed];
      this.lines = snapshot.lines.map(line => line.map(item => ({
        ...item, until: item.remaining === null ? null : now + item.remaining
      })));
    }
  }
  observe(peerId, state) {
    const intent = state.intent;
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i] = this.lines[i].filter(item => item.peerId !== peerId ||
        (intent && item.token === intent.token && intent.machine === i));
    }
    if (!intent || this.completed.includes(intent.token)) return;
    if (!Number.isInteger(intent.machine) || intent.machine < 0 || intent.machine > 2) return;
    const line = this.lines[intent.machine];
    let item = line.find(item => item.peerId === peerId && item.token === intent.token);
    if (!item) {
      item = {peerId, token: intent.token, ready: false, until: null};
      line.push(item);
    }
    const machine = [{x: 5, z: 0}, {x: -8, z: -7}, {x: 12, z: -11}][intent.machine];
    item.ready = !!intent.ready && Math.hypot(state.x - machine.x, state.z - machine.z - 2.5) < 0.2;
  }
  remove(peerId) {
    this.lines = this.lines.map(line => line.filter(item => item.peerId !== peerId));
  }
  tick(now = Date.now()) {
    for (const line of this.lines) {
      if (line[0]?.until !== null && line[0]?.until <= now) {
        this.completed.push(line.shift().token);
        this.completed = this.completed.slice(-256);
      }
      if (line[0]?.ready && line[0].until === null) line[0].until = now + 3500;
    }
  }
  snapshot(now = Date.now()) {
    return {
      revision: ++this.revision,
      lines: this.lines.map(line => line.map(({until, ...item}) => ({
        ...item, remaining: until === null ? null : Math.max(0, until - now)
      }))),
      completed: [...this.completed]
    };
  }
}

export function mergeSnapshots(incoming, local) {
  if (!local) return incoming;
  const completed = [...new Set([...local.completed, ...incoming.completed])].slice(-256);
  const seen = new Set();
  const lines = incoming.lines.map((line, index) => [...line, ...local.lines[index]].filter(item => {
    if (seen.has(item.peerId) || completed.includes(item.token)) return false;
    seen.add(item.peerId);
    return true;
  }));
  return {lines, completed, revision: Math.max(incoming.revision, local.revision)};
}

export function validPlayer(value) {
  if (!value || typeof value !== 'object' || !Number.isFinite(value.x) ||
      !Number.isFinite(value.z) || Math.abs(value.x) > 25 || Math.abs(value.z) > 25) return null;
  if (!['idle', 'walk', 'rest', 'stretch', 'drink'].includes(value.act)) return null;
  const result = {x: value.x, z: value.z, act: value.act, awake: !!value.awake,
    nick: String(value.nick || '정원 방문자').slice(0, 30), intent: null};
  if (value.intent && typeof value.intent.token === 'string' &&
      value.intent.token.length <= 80 && Number.isInteger(value.intent.machine) &&
      value.intent.machine >= 0 && value.intent.machine < 3) {
    result.intent = {token: value.intent.token, machine: value.intent.machine,
      ready: !!value.intent.ready};
  }
  return result;
}

export function validSnapshot(value, knownPeers) {
  if (!value || !Number.isSafeInteger(value.revision) || !Array.isArray(value.lines) ||
      value.lines.length !== 3 || !Array.isArray(value.completed) || value.completed.length > 256) return false;
  if (!value.completed.every(token => typeof token === 'string' && token.length <= 80)) return false;
  const seen = new Set();
  for (const line of value.lines) {
    if (!Array.isArray(line) || line.length > 64) return false;
    for (const item of line) {
      if (!item || !knownPeers.has(item.peerId) || seen.has(item.peerId) ||
          typeof item.token !== 'string' || item.token.length > 80 ||
          typeof item.ready !== 'boolean' ||
          !(item.remaining === null || (Number.isFinite(item.remaining) && item.remaining >= 0 && item.remaining <= 3500))) return false;
      seen.add(item.peerId);
    }
  }
  return true;
}
