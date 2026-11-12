export class StudyAudio{
  constructor(){this.enabled=false;this.ctx=null;this.score=null;this.cursor=0;this.loopStart=0;this.scheduled=0;this.crunches=0;this.started=false;this.tempo=.88}
  async enable(value){
    if(!value){this.enabled=false;if(this.ctx){this.master.gain.setValueAtTime(0,this.ctx.currentTime);await this.ctx.suspend()}return}
    if(!this.ctx){
      const C=globalThis.AudioContext||globalThis.webkitAudioContext;this.ctx=new C();
      const c=this.ctx;this.master=c.createGain();this.master.gain.value=.75;
      const compressor=c.createDynamicsCompressor();compressor.threshold.value=-16;compressor.ratio.value=4;
      this.analyser=c.createAnalyser();this.analyser.fftSize=512;this.master.connect(compressor).connect(this.analyser).connect(c.destination);
      this.music=c.createGain();this.music.gain.value=.24;this.music.connect(this.master);
      this.effects=c.createGain();this.effects.gain.value=.75;this.effects.connect(this.master);
      const reverb=c.createConvolver(),buffer=c.createBuffer(2,c.sampleRate*1.3,c.sampleRate);
      for(let channel=0;channel<2;channel++){const data=buffer.getChannelData(channel);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3)*.22}
      reverb.buffer=buffer;const wet=c.createGain();wet.gain.value=.15;this.music.connect(reverb).connect(wet).connect(this.master);
      this.meter=new Uint8Array(this.analyser.fftSize);
    }
    await this.ctx.resume();this.enabled=true;this.master.gain.setTargetAtTime(.75,this.ctx.currentTime,.03);
    if(!this.score){const response=await fetch('assets/bach-prelude.json');if(!response.ok)throw Error('BGM could not load');this.score=await response.json()}
    if(!this.started){this.started=true;this.loopStart=this.ctx.currentTime+.15;this.cursor=0;this.scheduler=setInterval(()=>this.schedule(),120)}
    this.schedule();
  }
  schedule(){
    if(!this.enabled||!this.score||this.ctx.state!=='running')return;
    const limit=this.ctx.currentTime+.65;
    while(true){
      if(this.cursor>=this.score.notes.length){this.cursor=0;this.loopStart+=(this.score.duration+2)/this.tempo}
      const [start,duration,pitch,velocity]=this.score.notes[this.cursor],at=this.loopStart+start/this.tempo;
      if(at>limit)break;
      if(at>=this.ctx.currentTime-.04)this.piano(pitch,Math.max(this.ctx.currentTime,at),duration/this.tempo,velocity);
      this.cursor++;
    }
  }
  piano(pitch,at,duration,velocity){
    const c=this.ctx,f=440*2**((pitch-69)/12),length=Math.min(4,Math.max(.75,duration+1));
    for(const [partial,weight]of [[1,.52],[2,.18],[3,.075],[4,.035]]){
      const osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.value=f*partial*(1+partial*.00012);
      const volume=.28*(velocity/127)*weight;
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.009);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0001,volume*.08),at+length/(1+partial*.11));
      gain.gain.exponentialRampToValueAtTime(.00005,at+length);osc.connect(gain).connect(this.music);osc.start(at);osc.stop(at+length+.05);
    }this.scheduled++;
  }
  noise(duration=.15,gain=.08,frequency=2000){
    if(!this.enabled||this.ctx?.state!=='running')return;const c=this.ctx,buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
    const source=c.createBufferSource(),filter=c.createBiquadFilter(),volume=c.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;volume.gain.value=gain;
    source.connect(filter).connect(volume).connect(this.effects);source.start();
  }
  crunch(strength=.12){
    if(!this.enabled||this.ctx?.state!=='running')return;this.crunches++;const c=this.ctx,t=c.currentTime,s=Math.min(1,Math.max(.4,strength*5));
    for(let k=0;k<6;k++){
      const at=t+k*.018,length=.025+Math.random()*.035,buffer=c.createBuffer(1,Math.ceil(c.sampleRate*length),c.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
      const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1100+Math.random()*3200;filter.Q.value=1.6;
      gain.gain.value=.26*s;source.connect(filter).connect(gain).connect(this.effects);source.start(at);
    }
    const osc=c.createOscillator(),body=c.createGain();osc.type='triangle';osc.frequency.setValueAtTime(130,t);osc.frequency.exponentialRampToValueAtTime(65,t+.12);
    body.gain.setValueAtTime(.1*s,t);body.gain.exponentialRampToValueAtTime(.0001,t+.16);osc.connect(body).connect(this.effects);osc.start(t);osc.stop(t+.18);
  }
  state(){
    let rms=0;if(this.ctx&&this.ctx.state==='running'){this.analyser.getByteTimeDomainData(this.meter);rms=Math.sqrt(this.meter.reduce((sum,v)=>sum+((v-128)/128)**2,0)/this.meter.length)}
    return{enabled:this.enabled,context:this.ctx?.state||'not-started',notes:this.scheduled,crunches:this.crunches,rms};
  }
}
