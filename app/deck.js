/* ---------------- audio, one Deck per player, and the sync bus that links them ---------------- */
const AU={ctx:null,out:null};
function ensureCtx(){
  if(!AU.ctx){const C=window.AudioContext||window.webkitAudioContext;AU.ctx=new C();AU.out=AU.ctx.createGain();AU.out.gain.value=.9;AU.out.connect(AU.ctx.destination);mixBuild();}
  if(AU.ctx.state==='suspended')AU.ctx.resume();
  return AU.ctx;
}
/* Pro DJ Link style tempo master and beat sync. With one player the deck can be master of itself;
   the bus is written for several decks (and a mixer) to plug in later. */
class SyncBus{
  constructor(){this.decks=[];this.master=null;}
  add(d){this.decks.push(d);}
  setMaster(d){if(this.master===d)return;const old=this.master;this.master=d;if(old)old.dirty=true;if(d)d.dirty=true;}
  masterBpm(){const m=this.master;return m&&m.loaded()?m.bpmNow():null;}
  /* beat phase of the master: fractional beat index at "now" */
  masterPhase(){const m=this.master;return m&&m.loaded()?m.beatPhase(m.pos()):null;}
  /* called every frame */
  tick(){
    if(this.master&&!this.master.loaded())this.master=null;
    for(const d of this.decks){if(!d.sync||d===this.master||!d.loaded())continue;
      const mb=this.masterBpm();if(!mb){continue;}
      const base=d.cur.tr.bpm||0;if(!base)continue;
      const want=mb/base;if(Math.abs(want-d.rate)>1e-4)d.setRate(want);
      /* phase: keep the beat fractions together while playing */
      if(d.playing&&this.master.playing&&!d.scratchOn&&!d.touching){
        const mp=this.masterPhase(),dp=d.beatPhase(d.pos());if(mp==null||dp==null)continue;
        let diff=((mp-dp)%1+1.5)%1-.5;
        if(Math.abs(diff)>.004)d.nudge=clamp(diff*.6,-.06,.06);else d.nudge=0;
      }else d.nudge=0;
    }
  }
}
const BUS=new SyncBus();
const DECKS=[];
class Deck{
  constructor(n){
    this.n=n;this.ch=n;this.pn=n;                 /* the player on channel n of the mixer is PLAYER n */
    this.gain=null;this.dirty=true;
    /* transport */
    Object.assign(this,{cur:null,buf:null,src:null,playing:false,_pos:0,last:now(),rate:1,bend:1,touch:1,touchTarget:1,dir:1,dur:1,cue:0,loop:null,
      scratchOn:false,scratchV:0,scratchT:0,touching:false,ghost:null,srcDir:1,srcRate:0,nudge:0,ended:false,loadTok:0});
    /* controls */
    Object.assign(this,{quant:true,qBeat:1,remain:true,autoCueOn:true,vinyl:true,mt:false,sync:false,rangeIdx:1,tempoV:0,tReset:false,slip:false,
      rev:false,lever:0,slipRevHeld:false,hotHeld:null,bank:0,callMode:false,callHeld:false,callUsed:false,loopIn:null,lastLoop:null,adjust:null,adjOrig:null,
      autoLen:4,loopMode:false,jumpMode:false,zi:2,grid:false,gridHold:false,brakeT:.05,startT:.05,jogWeight:.5,touchPrev:null,called:null,hist:[],
      cueHold:false,kTouch:0,kRel:0,rimAngle:0,spin:0,spinning:false,face:null});
    this.ui={scr:'play',nav:[{k:'media',sel:0,top:0}],tl:{sel:0,top:0},menu:{sel:0},util:{sel:0,top:0,edit:false},info:false,sort:null,
      search:{q:'',sel:0,top:0,kb:0},sc:{sel:0},filt:{tab:0,sel:0,pad:null,padTxt:'',tcol:0,tsel:0,side:null},iplay:{sel:0},hits:[],items:[]};
    BUS.add(this);DECKS.push(this);
  }
  loaded(){return !!(this.cur&&!this.cur.loading);}
  out(){if(!this.gain){ensureCtx();this.gain=AU.ctx.createGain();this.gain.connect(mixInput(this.ch));}return this.gain;}
  applySettings(){
    this.quant=!!SET.quantize;this.qBeat=[1,.5,.25,.125][SET.qbv];this.remain=SET.timeMode===1;this.autoCueOn=!!SET.autoCue;this.vinyl=SET.jogMode===1;
    this.mt=!!SET.masterTempo;this.rangeIdx=SET.tempoRange;this.setSync(!!SET.sync);this.applyTempo();this.dirty=true;
  }
  /* ---------- velocity model ---------- */
  vel(){if(this.scratchOn)return this.scratchV;if(!this.playing)return 0;return this.dir*this.rate*this.bend*this.touch*(1+this.nudge);}
  moving(){return this.playing||this.scratchOn;}
  stopSrc(){if(this.src){const s=this.src;this.src=null;try{s.onended=null;s.stop();}catch(e){}try{s.disconnect();}catch(e){}}}
  startSrc(){
    this.stopSrc();if(!this.buf||!this.moving())return;
    const v=this.vel(),av=Math.abs(v);if(av<0.03)return;
    const c=ensureCtx(),s=c.createBufferSource(),lp=this.loop&&!this.scratchOn?this.loop:null;
    if(v>0){s.buffer=this.buf;if(lp){s.loop=true;s.loopStart=lp.a;s.loopEnd=lp.b;}s.playbackRate.value=av;s.connect(this.out());s.start(0,clamp(this._pos,0,Math.max(0,this.buf.duration-.01)));this.srcDir=1;}
    else{const sr=this.buf.sampleRate,lo=lp?lp.a:0,maxSeg=this.scratchOn?6:30,a=Math.max(lo,this._pos-maxSeg),n=Math.floor((this._pos-a)*sr);
      if(n<256)return;
      const rb=c.createBuffer(this.buf.numberOfChannels,n,sr),off=Math.floor(a*sr);
      for(let ch=0;ch<rb.numberOfChannels;ch++){const sd=this.buf.getChannelData(ch),dd=rb.getChannelData(ch);for(let i=0;i<n;i++)dd[i]=sd[off+n-1-i];}
      s.buffer=rb;s.playbackRate.value=av;s.connect(this.out());s.start(0,0);this.srcDir=-1;}
    this.srcRate=av;this.src=s;s.onended=()=>{if(this.src===s)this.src=null;};
  }
  syncSrc(){
    if(!this.buf)return;const v=this.vel(),av=Math.abs(v);
    if(!this.moving()||av<0.03){if(this.src)this.stopSrc();return;}
    const d=v>0?1:-1;if(!this.src||this.srcDir!==d)this.startSrc();
    else if(Math.abs(av-this.srcRate)>0.004){this.src.playbackRate.value=av;this.srcRate=av;}
  }
  advance(){
    const t=now(),dt=Math.min(.25,t-this.last);this.last=t;
    if(this.scratchOn&&t-this.scratchT>.06)this.scratchV=0;
    if(this.touch!==this.touchTarget){const d=Math.max(.04,this.touchTarget<this.touch?this.brakeT:this.startT),st=dt/d;this.touch=this.touch<this.touchTarget?Math.min(this.touchTarget,this.touch+st):Math.max(this.touchTarget,this.touch-st);}
    if(this.playing&&this.cur&&!this.cur.loading&&!this.cur.tr.played){const tr=this.cur.tr;tr.playT=(tr.playT||0)+dt;if(tr.playT>=60){tr.played=true;tr.m.session.push(tr);}}
    if(!this.moving())return;
    const v=this.vel();
    if(this.ghost&&this.playing)this.ghost.pos=Math.min(this.dur,this.ghost.pos+this.rate*dt);
    this._pos+=v*dt;
    const lp=this.loop;
    if(lp&&!this.scratchOn){const L=lp.b-lp.a;if(v>0&&this._pos>=lp.b)this._pos=lp.a+(this._pos-lp.b)%L;else if(v<0&&this._pos<=lp.a){this._pos=lp.b-(lp.a-this._pos)%L;this.stopSrc();}}
    if(this._pos>=this.dur){this._pos=this.dur;if(this.scratchOn)this.scratchV=Math.min(0,this.scratchV);else{this.pauseNow();this.ended=true;this.onEnd();}}
    else if(this._pos<=0){this._pos=0;if(this.scratchOn)this.scratchV=Math.max(0,this.scratchV);else if(v<0)this.pauseNow();}
    this.syncSrc();
  }
  pos(){this.advance();return this._pos;}
  pauseNow(){this.playing=false;this.ghost=null;this.nudge=0;this.stopSrc();this.dirty=true;}
  play(){if(!this.loaded()||this.playing)return;ensureCtx();this.advance();if(this.dir>0&&this._pos>=this.dur-.05)this._pos=0;if(this.dir<0&&this._pos<=.05)this._pos=this.dur;
    this.playing=true;this.ended=false;this.touch=this.touchTarget=1;this.last=now();this.startSrc();this.dirty=true;}
  pause(){if(!this.playing)return;this.advance();this.pauseNow();}
  seek(t){this.advance();this._pos=clamp(t,0,this.dur);this.startSrc();}
  setRate(r){this.advance();this.rate=Math.max(0,r);this.syncSrc();}
  onEnd(){if(SET.playMode===0&&this.cur){const L=this.cur.list||[];const i=L.indexOf(this.cur.tr);const nx=L[i+1];if(nx)this.loadTrack(nx,{play:true});}}
  /* ---------- slip ---------- */
  slipBegin(){if(this.slip&&this.playing&&!this.ghost)this.ghost={pos:this._pos,t:now(),beats:0};}
  slipEnd(){if(!this.ghost)return;const g=this.ghost.pos;this.ghost=null;this.seek(g);}
  slipCheck(){if(this.ghost&&!this.loop&&this.dir>0&&!this.touching&&!this.hotHeld&&!this.slipRevHeld&&!this.scratchOn)this.slipEnd();}
  /* ---------- beats ---------- */
  beats(){return this.cur&&this.cur.beats?this.cur.beats:[];}
  spb(){const b=this.beats();if(b.length>1)return (b[b.length-1].t-b[0].t)/(b.length-1)/1000;const bpm=this.cur&&this.cur.tr.bpm;return bpm?60/bpm:.5;}
  bpmNow(){const t=this.cur&&this.cur.tr;if(!t)return 0;const b=this.beats();let bpm=t.bpm;
    if(b.length){const i=clamp(lowerBound(b,this._pos*1000+1)-1,0,b.length-1);bpm=b[i].bpm||bpm;}return bpm*this.rate;}
  beatPhase(t){const b=this.beats();if(b.length<2)return t/this.spb();const ms=t*1000;const i=clamp(lowerBound(b,ms+1)-1,0,b.length-2);return i+(ms-b[i].t)/(b[i+1].t-b[i].t);}
  beatInBar(t){const b=this.beats();if(!b.length)return -1;const i=lowerBound(b,t*1000+1)-1;return i>=0?b[i].n:-1;}
  quantTime(t){const b=this.beats();if(b.length<2)return t;const ms=t*1000;const i=clamp(lowerBound(b,ms+1)-1,0,b.length-2);const d=b[i+1].t-b[i].t,k=Math.round((ms-b[i].t)/d/this.qBeat)*this.qBeat;return (b[i].t+k*d)/1000;}
  snap(t){return this.quant?this.quantTime(t):t;}
  beatShift(t,n){
    const b=this.beats();if(b.length<2)return t+n*this.spb();
    const ms=t*1000;const i=clamp(lowerBound(b,ms+1)-1,0,b.length-2);const frac=(ms-b[i].t)/(b[i+1].t-b[i].t);const j=i+n;
    if(j<0)return Math.max(0,(b[0].t+(j+frac)*(b[1].t-b[0].t))/1000);
    if(j>b.length-2)return Math.min(this.dur,(b[b.length-1].t+(j-(b.length-1)+frac)*(b[b.length-1].t-b[b.length-2].t))/1000);
    return (b[j].t+frac*(b[j+1].t-b[j].t))/1000;
  }
  /* ---------- loops ---------- */
  setLoop(a,b,jump){a=Math.max(0,a);b=Math.min(this.dur,b);if(b-a<0.01)return false;this.advance();this.slipBegin();
    this.loop={a,b};this.lastLoop=this.loop;this.loopIn=null;this.adjust=null;if(jump||this._pos>=b||this._pos<a)this._pos=a;this.startSrc();this.dirty=true;return true;}
  exitLoop(){if(!this.loop)return;this.advance();this.lastLoop=this.loop;this.loop=null;this.adjust=null;this.startSrc();this.slipCheck();this.dirty=true;}
  beatLoop(n){if(!this.loaded())return;/* during a loop the real deck keeps the loop in point and only changes the length */const a=this.loop?this.loop.a:this.snap(this.pos());const end=n>=1?this.beatShift(a,Math.round(n)):a+n*this.spb();if(this.setLoop(a,end,false)){this.autoLen=n;toast('BEAT LOOP '+fmtBeat(n));}}
  loopLenBeats(){const l=this.loop||this.lastLoop;return l?Math.round((l.b-l.a)/this.spb()*32)/32:this.autoLen;}
  loopScale(f){const l=this.loop;if(!l)return;this.advance();const sp=this.spb(),len=clamp((l.b-l.a)*f,sp/32,sp*512);l.b=Math.min(this.dur,l.a+len);
    if(this._pos>=l.b)this._pos=l.a+((this._pos-l.a)%(l.b-l.a));this.startSrc();this.autoLen=this.loopLenBeats();this.dirty=true;}
  loopMove(n){const l=this.loop;if(!l)return;this.advance();const na=this.beatShift(l.a,n),nb=this.beatShift(l.b,n);if(na<0||nb>this.dur)return;this._pos+=na-l.a;l.a=na;l.b=nb;this.startSrc();}
  adjustStep(dt){const l=this.loop;if(!l||!this.adjust)return;const o=this.adjOrig;
    if(this.adjust==='in'){const v=l.a+dt;if(Math.abs(v-o.a)<=30/75&&v<l.b-.01&&v>=0)l.a=v;}else{const v=l.b+dt;if(Math.abs(v-o.b)<=30/75&&v>l.a+.01&&v<=this.dur)l.b=v;}
    this.adjT=now();this.startSrc();}
  /* ---------- tempo ---------- */
  tempoPct(){const r=RANGES[this.rangeIdx],st=STEPS[this.rangeIdx];return Math.round(this.tempoV*r/st)*st;}
  sliderRate(){return 1+(this.tReset?0:this.tempoPct())/100;}
  applyTempo(){if(this.sync&&BUS.master&&BUS.master!==this&&BUS.masterBpm())return;this.setRate(this.sliderRate());this.dirty=true;}
  setSync(on){this.sync=on;if(on){if(!BUS.master||!BUS.master.loaded())BUS.setMaster(this);}else{this.nudge=0;this.applyTempo();}this.dirty=true;}
  /* ---------- loading ---------- */
  eject(silent){this.loadTok++;this.pause();this.cur=null;this.buf=null;this._pos=0;this.loop=null;this.ghost=null;this.dur=1;this.cue=0;this.lastLoop=null;this.loopIn=null;
    if(BUS.master===this)BUS.setMaster(null);this.ui.scr='play';this.dirty=true;}
  async getAudio(tr,an){
    const M=tr.m,f=M.idx.get(tr.fileKey);
    if(f){try{ensureCtx();return {buf:await AU.ctx.decodeAudioData(await f.arrayBuffer()),note:''};}catch(e){return {buf:null,note:say('Format non décodable par ce navigateur ('+tr.ext.toUpperCase()+') : lecture simulée','Format not decodable by this browser ('+tr.ext.toUpperCase()+'): simulated playback')};}}
    if(M.demo)return {buf:synthDemo(tr,an.beats),note:''};
    return {buf:null,note:M.hasContents?say('Fichier audio introuvable sur la clé : lecture simulée','Audio file not found on the USB: simulated playback'):say('Dossier Contents non choisi : lecture simulée (pas de son)','Contents folder not selected: simulated playback (no sound)')};
  }
  async loadTrack(tr,opt){
    opt=opt||{};
    if(SET.ejectLock===1&&this.playing&&this.cur){toast(say('EJECT/LOAD LOCK : chargement impossible pendant la lecture','EJECT/LOAD LOCK: cannot load while playing'));return false;}
    const was=this.playing||!!opt.play;
    this.pause();Object.assign(this,{loop:null,ghost:null,buf:null,_pos:0,dur:tr.duration||1,adjust:null,loopIn:null,lastLoop:null,loopMode:false,jumpMode:false,
      slipRevHeld:this.lever===-1,hotHeld:null,touch:1,touchTarget:1,scratchOn:false,ended:false,called:null,grid:false,touchPrev:null,callMode:false,autoLen:4});
    this.dir=(this.rev||this.slipRevHeld)?-1:1;
    this.hist=[tr].concat(this.hist.filter(x=>x!==tr)).slice(0,8);
    const tok=++this.loadTok;
    this.cur={tr,an:null,hot:{},store:{},mem:[],note:'',loading:true,list:opt.list||(this.cur&&this.cur.list)||null};
    this.ui.scr='play';this.ui.info=false;this.ui.sort=null;this.dirty=true;
    const an=await getAnalysis(tr);if(tok!==this.loadTok)return false;
    const au=await this.getAudio(tr,an);if(tok!==this.loadTok)return false;
    const c=this.cur;c.an=an;c.beats=an.beats;c.note=au.note;c.loading=false;
    if(!c.list)c.list=tr.m.tracks.slice().sort(byTitle);
    for(const q of an.cueList){if(q.hot>0&&q.hot<=8)c.store[q.hot]=q;else if(q.hot===0)c.mem.push(q);}
    c.autoHot=SET.hcAuto===1||(SET.hcAuto===2&&String(tr.autoload).toUpperCase()==='ON');
    if(c.autoHot)for(const k in c.store)c.hot[k]=c.store[k];
    this.buf=au.buf;
    const lastBeat=an.beats.length?an.beats[an.beats.length-1].t/1000:0;
    this.dur=au.buf?au.buf.duration:Math.max(tr.duration,lastBeat,1);
    this.cue=0;
    if(this.autoCueOn){if(SET.autoCueLevel===8){const m=c.mem[0];if(m)this.cue=m.time;}else if(this.buf)this.cue=findAutoCue(this.buf,-36-6*SET.autoCueLevel);}
    this._pos=this.cue;this.applyTempo();this.dirty=true;
    if(c.note)toast(c.note,4000);
    if(was)this.play();
    return true;
  }
}
function findAutoCue(buf,db){
  const thr=Math.pow(10,db/20),ch=[];for(let c=0;c<buf.numberOfChannels;c++)ch.push(buf.getChannelData(c));
  const lim=Math.min(buf.length,buf.sampleRate*120);
  for(let i=0;i<lim;i+=16){for(const d of ch)if(Math.abs(d[i])>thr)return Math.max(0,i/buf.sampleRate-.005);}
  return 0;
}
function synthDemo(tr,beats){
  const sr=44100,c=ensureCtx(),dur=Math.max(tr.duration,1);const buf=c.createBuffer(1,Math.floor(sr*dur),sr);const d=buf.getChannelData(0);
  const spb=60/(tr.bpm||120),t0=(beats.length?beats[0].t:0)/1000;const roots=[55,55,65.41,49];
  for(let i=0;;i++){const tb=t0+i*spb;if(tb>=dur)break;const s0=Math.floor(tb*sr);
    let ph=0;for(let n=0;n<sr*.22&&s0+n<d.length;n++){const t=n/sr;ph+=2*Math.PI*(48+110*Math.exp(-t*28))/sr;d[s0+n]+=Math.sin(ph)*Math.exp(-t*13)*.8;}
    const h0=s0+Math.floor(spb*sr/2);for(let n=0;n<sr*.05&&h0+n<d.length;n++){const t=n/sr;d[h0+n]+=(Math.random()*2-1)*Math.exp(-t*80)*.16;}
    if(i%4===0||i%4===2){const f=roots[Math.floor(i/4)%4]*(i%4===2?1.5:1);for(let n=0;n<spb*sr*1.6&&s0+n<d.length;n++){const t=n/sr;d[s0+n]+=Math.sin(2*Math.PI*f*t)*Math.exp(-t*2.2)*.22;}}}
  return buf;
}
