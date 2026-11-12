export class StudyClock{
  constructor(saved=0){this.elapsed=Number.isFinite(saved)&&saved>=0?saved:0;this.anchor=null}
  get running(){return this.anchor!==null}
  total(now){return this.elapsed+(this.running?Math.max(0,now-this.anchor):0)}
  start(now){if(!this.running)this.anchor=now}
  pause(now){this.elapsed=this.total(now);this.anchor=null}
  merge(saved,now){const running=this.running;this.pause(now);this.elapsed=Math.max(this.elapsed,Number(saved)||0);if(running)this.start(now)}
}
export function clockText(ms){const seconds=Math.floor(Math.max(0,ms)/1000);return[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':')}
