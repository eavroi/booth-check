/* ---------------- BEAT FX of the DJM-900NXS2 (manual p. 13-18): 14 effects timed on the BPM ----------------
   What every control does comes from the manual. The amounts the manual does not give (number and strength of the repeats,
   reverb length, filter type and range, flanger / phaser depth, X-PAD response, FX FREQUENCY crossovers) are first settings,
   marked "à caler": they are to be checked against a recording of the real mixer (kit tests/kit_djm.py). */
/* the effects in the selector's order. On a channel every BEAT FX is fed after the channel fader, so it is never heard with the
   channel CUE (Victor, on the real mixer; manual p. 18 note 1); post = echo and reverb effects that go on when the fader comes
   down and after ON/OFF is turned off (manual p. 16-17; the tail after OFF: Victor, on the real mixer). */
const BFX=[
  {n:'DELAY',post:1,tmin:1,tmax:4000},{n:'ECHO',post:1,tmin:1,tmax:4000},{n:'PING PONG',post:1,tmin:1,tmax:4000},{n:'SPIRAL',post:1,tmin:10,tmax:4000},
  {n:'REVERB',post:1,pct:1},{n:'TRANS',tmin:10,tmax:16000},{n:'FILTER',tmin:10,tmax:32000,b64:1},{n:'FLANGER',tmin:10,tmax:32000,b64:1},
  {n:'PHASER',tmin:10,tmax:32000,b64:1},{n:'PITCH',pitch:1},{n:'SLIP ROLL',tmin:10,tmax:4000},{n:'ROLL',tmin:10,tmax:4000},
  {n:'VINYL BRAKE',tmin:10,tmax:4000},{n:'HELIX',tmin:10,tmax:4000}];
const bfxDef=()=>BFX.find(x=>x.n===MS.fxType);
/* the beat fractions of BEAT ◀ ▶: 1/16 to 16 (64 for FILTER, FLANGER, PHASER); the values between are not in the manual (à caler) */
const BEATS16=['1/16','1/8','1/4','1/2','3/4','1','2','4','8','16'],BEATS64=BEATS16.concat(['32','64']);
const XPADS=['1/16','1/8','1/4','1/2','3/4','1','2','4'];
/* REVERB: BEAT = 1-100 %, PITCH: BEAT = -50 to +100 %; the steps are not in the manual (à caler) */
const REV_STEPS=[1,10,20,30,40,50,60,70,80,90,100],PITCH_STEPS=[-50,-40,-30,-20,-10,0,10,20,30,40,50,60,70,80,90,100];
const fracBeats=l=>{const m=/^(\d+)\/(\d+)$/.exec(l);return m?m[1]/m[2]:+l;};
const BF={beat:4,timeMs:null,rev:50,revT:50,pitch:0,taps:[],tapHeld:false,atHeld:false,tapBpm:120,show:0,showWhat:'',start:0,sent:'',bpmExact:0,q:0,src:null,depthS:null};
const bfxBeats=()=>bfxDef().b64?BEATS64:BEATS16;
function bfxBpm(){return MS.tap?BF.tapBpm:(BF.bpmExact||MS.bpm||120);}
/* the effect's time in ms: the beat fraction (1 = one beat, manual p. 14) at the BPM, or the TIME knob's own value; out of the limits it
   stays at the limit and the screen blinks */
function bfxTimeRaw(){const D=bfxDef();if(D.pct||D.pitch)return 0;if(BF.timeMs!=null)return BF.timeMs;
  const L=bfxBeats(),b=fracBeats(L[Math.min(BF.beat,L.length-1)]);return b*60000/bfxBpm();}
function bfxTime(){const D=bfxDef(),t=bfxTimeRaw();return D.tmin?clamp(t,D.tmin,D.tmax):0;}
function bfxOut(){const D=bfxDef(),t=bfxTimeRaw();return !!D.tmin&&(t<D.tmin-.5||t>D.tmax+.5);}
const bfxActive=()=>MS.fxOn||MS.pad!=null;
/* the X-PAD: position 0..1 along the 8 pads (the strip between the two rows goes through them without steps) */
function padBeats(pos){const k=clamp(pos,0,1)*7,i=Math.min(6,Math.floor(k)),f=k-i,a=fracBeats(XPADS[i]),b=fracBeats(XPADS[i+1]);return a*Math.pow(b/a,f);}
/* ---------- the effect's place in the mixer ---------- */
function bfxSlot(){const N=MIX.N;if(!N)return null;const c=MS.fxCh;
  if(/^[1-4]$/.test(c))return N.ch[c-1].post;
  if(c==='A')return N.sA;if(c==='B')return N.sB;if(c==='MASTER')return N.sM;return null;}   /* MIC: no microphone in Booth Check */
function bfxBuild(){
  const N=MIX.N;if(!N||!MIX.fxReady)return;const c=AU.ctx;
  if(!MIX.bfx){try{MIX.bfx={node:new AudioWorkletNode(c,'bc-beat',{outputChannelCount:[2],processorOptions:{p:bfxParams()}}),slot:null};}catch(e){return;}}
  const B=MIX.bfx,s=bfxSlot();if(B.slot===s)return;
  if(B.slot){try{B.slot.in.disconnect(B.node);}catch(e){}try{B.node.disconnect();}catch(e){}try{B.slot.in.connect(B.slot.out);}catch(e){}B.slot=null;}
  if(s){try{s.in.disconnect(s.out);}catch(e){}s.in.connect(B.node);B.node.connect(s.out);B.slot=s;}
  BF.start++;BF.sent='';bfxSend();
}
/* ---------- the parameters sent to the effect ---------- */
function bfxParams(){
  const D=bfxDef(),i=BFX.indexOf(D);let T=bfxTime()/1000,x=-1;
  const held=MS.pad!=null&&MS.touch!=null;if(held)x=MS.touch;
  if(held&&D.tmin)T=clamp(padBeats(MS.touch)*60/bfxBpm(),D.tmin/1000,D.tmax/1000);
  const q=MS.quantize&&BF.q===1&&BF.src?BF.src:null;
  return {mode:i,on:bfxActive()&&!!bfxSlot(),T,depth:MS.depth,x,rev:BF.rev,revT:BF.revT,pitch:BF.pitch,
    band:[MS.freq.LOW?1:0,MS.freq.MID?1:0,MS.freq.HI?1:0],start:BF.start,quant:q?1:0,qPh:q?q.ph:0,qT:q?q.t:0,qSpb:q?q.spb:.5};
}
function bfxSend(force){const B=MIX.bfx;if(!B)return;const p=bfxParams(),k=JSON.stringify(Object.assign({},p,{qPh:0,qT:0}));
  if(!force&&k===BF.sent&&!p.quant)return;BF.sent=k;B.node.port.postMessage(p);}
/* every frame: the BPM, the beat grid for QUANTIZE (from the player heard on the FX channel), then the parameters */
function bfxTick(){
  const d=fxSrcDeck();BF.bpmExact=d?d.bpmNow():0;
  /* QUANTIZE on the screen: lit = the grid is received, blinking = not received (no analysed track playing forwards), off = OFF (manual p. 12) */
  let q=0;if(MS.quantize){q=2;if(d&&d.beats().length>1&&d.playing&&d.dir>0&&!d.scratchOn&&!d.touching){q=1;const c=AU.ctx;BF.src={ph:d.beatPhase(d.pos()),t:c?c.currentTime:0,spb:d.spb()/Math.max(.05,d.rate)};}}
  if(q!==BF.q){BF.q=q;MS.dirty=true;}
  if(BF.show&&now()-BF.show>1.5){BF.show=0;MS.dirty=true;}
  if(MS.pad!=null||MS.fxOn||BF.show||BF.q===2)MS.dirty=true;
  bfxSend();
}
/* the player heard on the channel the FX channel selector picks (the loudest one) */
function fxSrcDeck(){const c=MS.fxCh,heard=d=>d.loaded()&&d.playing&&MS.ch[d.ch-1].input==='DIGITAL'&&MS.ch[d.ch-1].level>-40;
  let src=DECKS.filter(heard);
  if(/^[1-4]$/.test(c))src=src.filter(d=>d.ch===+c);
  else if(c==='A'||c==='B')src=src.filter(d=>MS.ch[d.ch-1].xf===(c==='A'?-1:1)&&MS.ch[d.ch-1].fader>0);
  else if(c==='MASTER')src=src.filter(d=>MS.ch[d.ch-1].fader>0);
  else src=[];
  src.sort((a,b)=>MS.ch[b.ch-1].level-MS.ch[a.ch-1].level);return src[0]||null;}
/* ---------- the controls ---------- */
function bfxShow(w){BF.show=now();BF.showWhat=w;MS.dirty=true;}
function setFxType(t){if(MS.fxType===t)return;MS.fxType=t;BF.timeMs=null;BF.beat=Math.min(BF.beat,bfxBeats().length-1);ensureCtx();bfxBuild();BF.start++;bfxSend(true);MS.dirty=true;}
function setFxCh(c){if(MS.fxCh===c)return;MS.fxCh=c;ensureCtx();bfxBuild();MS.dirty=true;if(c==='MIC')mixToast(say('BEAT FX sur MIC : pas de micro dans Booth Check, l’effet ne s’entend pas','BEAT FX on MIC: no microphone in Booth Check, the effect is not heard'),2600);}
function beatKey(dir){const D=bfxDef();
  if(D.pct){const k=REV_STEPS.findIndex(v=>v>=BF.rev);BF.rev=REV_STEPS[clamp((dir>0?(REV_STEPS[k]>BF.rev?k:k+1):(k<0?REV_STEPS.length:k)-1),0,REV_STEPS.length-1)];bfxShow('rev');}
  else if(D.pitch){const k=PITCH_STEPS.findIndex(v=>v>=BF.pitch);BF.pitch=PITCH_STEPS[clamp((dir>0?(PITCH_STEPS[k]>BF.pitch?k:k+1):(k<0?PITCH_STEPS.length:k)-1),0,PITCH_STEPS.length-1)];bfxShow('pitch');}
  else{BF.beat=clamp(BF.beat+dir,0,bfxBeats().length-1);BF.timeMs=null;BF.show=0;}
  MS.dirty=true;}
/* TIME: an endless knob. Held TAP: the BPM by hand; AUTO/TAP + TAP held: by 0.1 BPM (manual p. 14) */
function timeTurn(n){const D=bfxDef();
  if(BF.tapHeld){if(BF.atHeld)BF.atUsed=true;if(!MS.tap)return;BF.tapBpm=clamp(Math.round((BF.tapBpm+n*(BF.atHeld?.1:1))*10)/10,40,300);bfxShow('bpm');return;}
  if(D.pct){BF.revT=clamp(BF.revT+n,1,100);bfxShow('revT');return;}
  if(D.pitch){BF.pitch=clamp(BF.pitch+n,-50,100);bfxShow('pitch');return;}
  const t=bfxTime();BF.timeMs=clamp(Math.round(n>0?Math.max(t+1,t*Math.pow(1.02,n)):Math.min(t-1,t*Math.pow(1.02,n))),D.tmin,D.tmax);bfxShow('ms');}
/* TAP: at least 2 taps on the beat give the mean BPM; the fraction goes to 1/1 (manual p. 14). Only in TAP mode (p. 8) */
function tapDown(){BF.tapHeld=true;if(BF.atHeld){BF.atUsed=true;return;}
  if(!MS.tap){mixToast(say('TAP : passe d’abord en mode TAP avec la touche AUTO/TAP','TAP: first switch to TAP mode with the AUTO/TAP key'),2400);return;}
  const t=now(),T=BF.taps;if(T.length&&t-T[T.length-1]>2)T.length=0;T.push(t);if(T.length>8)T.shift();
  if(T.length>=2){const bpm=60*(T.length-1)/(T[T.length-1]-T[0]);BF.tapBpm=clamp(Math.round(bpm*10)/10,40,300);BF.beat=bfxBeats().indexOf('1');BF.timeMs=null;MS.dirty=true;}}
function tapUp(){BF.tapHeld=false;}
/* AUTO/TAP switches the mode when it is let go, unless it was used with TAP (+ TIME) */
function autoTapDown(){BF.atHeld=true;BF.atUsed=!!BF.tapHeld;}
function autoTapUp(){BF.atHeld=false;if(BF.atUsed)return;MS.tap=!MS.tap;if(MS.tap&&MS.bpm)BF.tapBpm=MS.bpm;BF.taps.length=0;MS.dirty=true;}
/* ON/OFF: on, blinking; again: off. Pressed while the X-PAD is touched: the effect stays on when the finger leaves (manual p. 14) */
function fxOnOff(){ensureCtx();if(MS.fxOn){MS.fxOn=false;}else{MS.fxOn=true;if(MS.pad==null)BF.start++;}bfxSend(true);MS.dirty=true;}
function xpadAt(p){if(Math.abs(p.y-1092)<=16&&p.x>=1812&&p.x<=2134)return {pad:'strip',pos:clamp((p.x-1834)/(2112-1834),0,1)};
  for(let r=0;r<2;r++)for(let k=0;k<4;k++){const cx=1849+k*86,cy=r?1146:1037;if(Math.abs(p.x-cx)<=43&&Math.abs(p.y-cy)<=36)return {pad:XPADS[r*4+k],pos:(r*4+k)/7};}
  return null;}
function xpadDown(p){const h=xpadAt(p);if(!h)return;ensureCtx();const was=bfxActive();MS.pad=h.pad;MS.touch=h.pos;if(!was)BF.start++;bfxSend(true);MS.dirty=true;}
function xpadMove(p){if(MS.pad==null)return;const h=xpadAt(p);if(!h)return;MS.pad=h.pad;MS.touch=h.pos;MS.dirty=true;}
/* the controller's X-PAD key: the effect while it is held, at the fraction set with BEAT */
function bfxHold(on){if(on){ensureCtx();const was=bfxActive();MS.pad='steel';MS.touch=null;if(!was)BF.start++;bfxSend(true);MS.dirty=true;}else if(MS.pad==='steel')xpadUp();}
function xpadUp(){if(MS.pad==null)return;MS.pad=null;MS.touch=null;bfxSend(true);MS.dirty=true;}
/* ---------- the effect itself, in an AudioWorklet ---------- */
const BFX_SRC=`
const TAU=2*Math.PI;
/* a biquad (RBJ), state for 2 channels */
class Bq{constructor(){this.b0=1;this.b1=this.b2=this.a1=this.a2=0;this.z1=[0,0];this.z2=[0,0];}
  set(t,f,q){const w=TAU*Math.min(f,sampleRate*.45)/sampleRate,cs=Math.cos(w),al=Math.sin(w)/(2*q);let b0,b1,b2;const a0=1+al;
    if(t==='lp'){b0=(1-cs)/2;b1=1-cs;b2=b0;}else if(t==='hp'){b0=(1+cs)/2;b1=-(1+cs);b2=b0;}else{b0=1-al;b1=-2*cs;b2=1+al;}
    this.b0=b0/a0;this.b1=b1/a0;this.b2=b2/a0;this.a1=-2*cs/a0;this.a2=(1-al)/a0;return this;}
  run(x,c){const y=this.b0*x+this.z1[c];this.z1[c]=this.b1*x-this.a1*y+this.z2[c];this.z2[c]=this.b2*x-this.a2*y;return y;}}
const Q=Math.SQRT1_2;
class BcBeat extends AudioWorkletProcessor{
  constructor(o){super();const sr=sampleRate;this.N=1<<Math.ceil(Math.log2(sr*9));this.M=this.N-1;
    this.R=[new Float32Array(this.N),new Float32Array(this.N)];this.D=[new Float32Array(this.N),new Float32Array(this.N)];
    this.C=[new Float32Array(Math.ceil(sr*4.3)),new Float32Array(Math.ceil(sr*4.3))];
    this.w=0;this.n=0;this.mix=0;this.p={mode:4,on:false,T:.375,depth:.5,x:-1,rev:50,revT:50,pitch:0,band:[1,1,1],start:0,quant:0,qPh:0,qT:0,qSpb:.5};
    this.seen=-1;this.dep=.5;this.Ts=.375;this.Tsp=.375;this.lfo=0;this.gate=1;this.fq=0;
    /* FX FREQUENCY: three bands split like the channel EQ (300 Hz, 4 kHz, Linkwitz-Riley); the real crossovers are not in the manual (à caler) */
    this.xo={l1:new Bq().set('lp',300,Q),l2:new Bq().set('lp',300,Q),ap:new Bq().set('ap',4000,Q),h1:new Bq().set('hp',300,Q),h2:new Bq().set('hp',300,Q),
      m1:new Bq().set('lp',4000,Q),m2:new Bq().set('lp',4000,Q),k1:new Bq().set('hp',4000,Q),k2:new Bq().set('hp',4000,Q)};
    this.f1=new Bq();this.f2=new Bq();this.hpR=new Bq().set('hp',20,Q);
    const cl=[1116,1188,1277,1356],al=[556,441],k=sr/44100;
    this.cb=[0,1].map(c=>cl.map(l=>({b:new Float32Array(Math.round((l+c*23)*k)),i:0,f:0})));this.ab=[0,1].map(c=>al.map(l=>({b:new Float32Array(Math.round((l+c*23)*k)),i:0})));
    this.sp=[0,1].map(c=>[389,617].map(l=>({b:new Float32Array(Math.round((l+c*17)*k)),i:0})));
    this.ph=[0,1].map(()=>new Float32Array(6));this.phz=[0,0];
    if(o&&o.processorOptions&&o.processorOptions.p)Object.assign(this.p,o.processorOptions.p);this.dc=[[0,0],[0,0]];
    this.port.onmessage=e=>{Object.assign(this.p,e.data);};}
  rd(B,c,d){const N=this.N,x=this.w-d,i=Math.floor(x),f=x-i,a=B[c][i&this.M],b=B[c][(i+1)&this.M];return a+(b-a)*f;}
  begin(){const sr=sampleRate,p=this.p;
    /* turned on again while the tail of the last echo still sounds: the tail goes on */
    if(!(this.tail>0&&p.mode===this.tailMode)){this.D[0].fill(0);this.D[1].fill(0);for(const C of this.cb)for(const x of C){x.b.fill(0);x.f=0;}for(const C of this.ab)for(const x of C)x.b.fill(0);}
    this.tail=0;
    this.t0=this.n;this.Ts=this.Tsp=p.T;this.speed=1;this.rp=this.n;this.bk=0;this.L=Math.round(p.T*sr);this.Lp=this.L;
    /* the start of a recording (ROLL, SLIP ROLL, HELIX) and of a cycle falls on the beat grid with QUANTIZE: the nearest point, even a little late */
    let c0=this.n;if(p.quant){const sb=this.beatAt(this.n),u=Math.min(p.T/p.qSpb,1),k=Math.round(sb/u)*u;c0=Math.round(this.n+(k-sb)*p.qSpb*sr);if(c0<this.n-sr*.5)c0=this.n;}
    this.c0=c0;this.cn=0;this.hp=0;this.hl=0;
    if(c0<this.n){const back=this.n-c0;for(let i=0;i<back;i++){const j=(this.w-back+i)&this.M;this.C[0][i]=this.R[0][j];this.C[1][i]=this.R[1][j];}this.cn=back;}}
  beatAt(n){const p=this.p;return p.qPh+(currentTime+(n-this.n0)/sampleRate-p.qT)/p.qSpb;}
  process(inp,out){const I=inp[0],O=out[0];if(!O||!O.length)return true;const L=O[0].length,sr=sampleRate,p=this.p;this.n0=this.n;
    const has=I&&I.length,i0=has?I[0]:null,i1=has?(I[1]||I[0]):null;
    if(p.on&&p.start!==this.seen){this.seen=p.start;this.begin();}
    /* ON/OFF turned off: DELAY, ECHO, PING PONG, SPIRAL and REVERB let their echoes die out (10 s at most), the others stop */
    if(this.wasOn&&!p.on&&p.mode<=4){this.tail=10*sr;this.tailMode=p.mode;}
    if(p.on||p.mode!==this.tailMode)this.tail=p.on?this.tail:0;
    this.wasOn=p.on;
    if(!p.on)this.seen=-1;
    const mode=p.mode,ka=1-Math.exp(-1/(.02*sr)),km=1-Math.exp(-1/(.008*sr)),band=p.band,allB=band[0]&&band[1]&&band[2];
    const T=Math.max(.001,p.T),Ls=Math.round(T*sr),x=this.xo,dl=(a,b)=>Math.min(1,2*(1-a)),wt=a=>Math.min(1,2*a);
    for(let i=0;i<L;i++){const n=this.n;let xl=has?i0[i]:0,xr=has?i1[i]:0;
      this.mix+=((p.on?1:0)-this.mix)*km;this.dep+=(p.depth-this.dep)*ka;const d=this.dep,m=this.mix;
      /* the selected bands go into the effect, the others pass by */
      const tl=this.tail>0&&!p.on;if(tl)this.tail--;
      let sl=xl,sr2=xr,ul=0,ur=0;
      if(m>1e-4&&!allB){const sp=(v,c)=>{const lo=x.ap.run(x.l2.run(x.l1.run(v,c),c),c),h=x.h2.run(x.h1.run(v,c),c),md=x.m2.run(x.m1.run(h,c),c),hi=x.k2.run(x.k1.run(h,c),c);
          return [band[0]*lo+band[1]*md+band[2]*hi,(1-band[0])*lo+(1-band[1])*md+(1-band[2])*hi];};
        const a=sp(xl,0),b=sp(xr,1);sl=a[0];ul=a[1];sr2=b[0];ur=b[1];}
      if(tl){sl=sr2=0;}
      const w=this.w;this.R[0][w]=sl;this.R[1][w]=sr2;
      let yl=sl,yr=sr2;
      if(m>1e-4||tl){
        switch(mode){
          case 0:case 1:{/* DELAY: one repeat; ECHO: repeats that fade (feedback à caler) */
            this.Ts+=(T-this.Ts)*.0004;const ds=this.Ts*sr,a=this.rd(this.D,0,ds),b=this.rd(this.D,1,ds),fb=mode===1?.6:0;
            this.D[0][w]=sl+fb*a;this.D[1][w]=sr2+fb*b;yl=sl*dl(d)+a*wt(d);yr=sr2*dl(d)+b*wt(d);break;}
          case 2:{/* PING PONG: left, then right, then left..., fading */
            this.Ts+=(T-this.Ts)*.0004;const ds=this.Ts*sr,a=this.rd(this.D,0,ds),b=this.rd(this.D,1,ds),g=Math.sqrt(.6);
            this.D[0][w]=(sl+sr2)*.5+g*b;this.D[1][w]=g*a;yl=sl*dl(d)+a*wt(d);yr=sr2*dl(d)+b*wt(d);break;}
          case 3:{/* SPIRAL: an echo that goes through a diffuser; the delay glides, so the pitch moves when it changes; LEVEL/DEPTH = feedback and balance */
            this.Tsp+=(T-this.Tsp)*.00004;const ds=this.Tsp*sr,fb=.25+.55*d,o=[0,0];
            for(let c=0;c<2;c++){let v=this.rd(this.D,c,ds);for(const A of this.sp[c]){const z=A.b[A.i];const y=-.6*v+z;A.b[A.i]=v+.6*y;A.i=(A.i+1)%A.b.length;v=y;}o[c]=v;}
            this.D[0][w]=sl+fb*o[0];this.D[1][w]=sr2+fb*o[1];yl=sl*dl(d)+o[0]*wt(d);yr=sr2*dl(d)+o[1]*wt(d);break;}
          case 4:{/* REVERB: BEAT = how far it spreads (tail length), TIME = how much reverb, X-PAD = a high-pass on the reverb (à caler) */
            const fbk=.7+.28*p.rev/100,damp=.25,g=p.revT/100*.06,inp=(sl+sr2)*g,o=[0,0];
            for(let c=0;c<2;c++){let s=0;for(const K of this.cb[c]){const z=K.b[K.i];K.f=z*(1-damp)+K.f*damp;K.b[K.i]=inp+K.f*fbk;K.i=(K.i+1)%K.b.length;s+=z;}
              for(const A of this.ab[c]){const z=A.b[A.i];const y=-s+z;A.b[A.i]=s+z*.5;A.i=(A.i+1)%A.b.length;s=y;}o[c]=s;}
            if(p.x>=0){if((n&31)===0)this.hpR.set('hp',20*Math.pow(200,p.x),Q);o[0]=this.hpR.run(o[0],0);o[1]=this.hpR.run(o[1],1);}
            yl=sl*dl(d)+o[0]*wt(d);yr=sr2*dl(d)+o[1]*wt(d);break;}
          case 5:{/* TRANS: the sound is cut every beat fraction (open for the first half); LEVEL/DEPTH = how much is cut */
            const ph=this.phase(n,T),want=ph<.5?1:1-d;this.gate+=(want-this.gate)*(want>this.gate?.06:.03);yl=sl*this.gate;yr=sr2*this.gate;break;}
          case 6:{/* FILTER: a resonant low-pass whose cut-off goes up and down once per cycle (shape and range à caler) */
            const ph=this.phase(n,T);if((n&15)===0){const fc=200*Math.pow(60,.5-.5*Math.cos(TAU*ph));this.f1.set('lp',fc,2.5);}
            const a=this.f1.run(sl,0),b=this.f1.run(sr2,1);yl=sl*(1-d)+a*d;yr=sr2*(1-d)+b*d;break;}
          case 7:{/* FLANGER: a short delay (1-7 ms) swept once per cycle, with feedback */
            const ph=this.phase(n,T),ds=(.001+.006*(.5-.5*Math.cos(TAU*ph)))*sr,a=this.rd(this.D,0,ds),b=this.rd(this.D,1,ds);
            this.D[0][w]=sl+.55*a;this.D[1][w]=sr2+.55*b;yl=sl*(1-.5*d)+a*.5*d;yr=sr2*(1-.5*d)+b*.5*d;break;}
          case 8:{/* PHASER: 6 all-pass stages swept once per cycle (300 Hz - 3 kHz), with feedback */
            const ph=this.phase(n,T),fc=300*Math.pow(10,.5-.5*Math.cos(TAU*ph)),t=Math.tan(Math.PI*fc/sr),a1=(t-1)/(t+1),o=[0,0],s=[sl,sr2];
            for(let c=0;c<2;c++){let v=s[c]+.4*this.phz[c];const st=this.ph[c];for(let k=0;k<6;k++){const y=a1*v+st[k];st[k]=v-a1*y;v=y;}this.phz[c]=v;o[c]=v;}
            yl=sl*(1-.5*d)+o[0]*.5*d;yr=sr2*(1-.5*d)+o[1]*.5*d;break;}
          case 9:{/* PITCH: two read heads sliding through a 60 ms window; LEVEL/DEPTH scales the shift, fully left = the original */
            const pc=(p.x>=0?-50+150*p.x:p.pitch)*d,r=1+pc/100;if(Math.abs(pc)<.3){yl=sl;yr=sr2;break;}
            const W=.06*sr;this.hp=((this.hp+(1-r)/W)%1+1)%1;const p2=(this.hp+.5)%1,g1=1-Math.abs(2*this.hp-1),g2=1-Math.abs(2*p2-1);
            yl=this.rd(this.R,0,1+this.hp*W)*g1+this.rd(this.R,0,1+p2*W)*g2;yr=this.rd(this.R,1,1+this.hp*W)*g1+this.rd(this.R,1,1+p2*W)*g2;break;}
          case 10:case 11:{/* SLIP ROLL / ROLL: the sound from ON is recorded and repeated every beat fraction. SLIP ROLL records again when the
              length changes; ROLL keeps the first recording (manual p. 17-18) */
            if(mode===10&&Math.abs(Ls-this.L)>sr*.002){this.L=Ls;this.begin();}else if(mode===11)this.L=Ls;
            const k=n-this.c0,C=this.C,cap=C[0].length;let a=sl,b=sr2;
            if(k>=0){if(this.cn<cap&&k===this.cn){C[0][k]=sl;C[1][k]=sr2;this.cn++;}
              if(k>=this.L){const j=k%this.L;if(j<this.cn){a=C[0][j];b=C[1][j];}}}
            yl=sl*dl(d)+a*wt(d);yr=sr2*dl(d)+b*wt(d);break;}
          case 12:{/* VINYL BRAKE: the sound slows down; LEVEL/DEPTH = the speed (left = normal, right = stopped), reached in the effect's time */
            const tg=1-d,st=1/Math.max(1,T*sr);this.speed=this.speed<tg?Math.min(tg,this.speed+st):Math.max(tg,this.speed-st);
            this.rp+=this.speed;if(n-this.rp>this.N-sr)this.rp=n-this.N+sr;
            /* back at normal speed: a short cross-fade to the live sound, then the delay is gone */
            this.bk=this.speed>.999&&tg>.999?Math.min(1,this.bk+1/(.05*sr)):0;if(this.bk>=1)this.rp=n;
            /* a stopped record gives no sound: the held sample is taken out (DC blocker) */
            const back=n-this.rp,dc=this.dc,hp=(v,c)=>{const y=v-dc[c][0]+.997*dc[c][1];dc[c][0]=v;dc[c][1]=y;return y;};
            const bl=hp(this.rd(this.R,0,back),0),br=hp(this.rd(this.R,1,back),1);yl=bl*(1-this.bk)+sl*this.bk;yr=br*(1-this.bk)+sr2*this.bk;break;}
          case 13:{/* HELIX: the sound from ON is recorded and repeated; a new length changes the pitch of what was recorded;
              LEVEL/DEPTH = how much new sound is laid over it (fully right: frozen) */
            if(this.hl===0){this.hl=Math.max(1,this.L);}
            const k=n-this.c0,C=this.C,H=this.hl;let a=sl,b=sr2;
            if(k>=0){if(k<H){C[0][k]=sl;C[1][k]=sr2;}else{const r=H/Math.max(1,Ls);this.hp=(this.hp+r)%H;const j=Math.floor(this.hp),f=this.hp-j,j2=(j+1)%H;
                a=C[0][j]+(C[0][j2]-C[0][j])*f;b=C[1][j]+(C[1][j2]-C[1][j])*f;const keep=d;C[0][j]=C[0][j]*keep+sl*(1-keep);C[1][j]=C[1][j]*keep+sr2*(1-keep);}}
            const g=Math.min(1,d*4);yl=sl*(1-g)+a*g;yr=sr2*(1-g)+b*g;break;}
        }
      }
      if(tl){O[0][i]=xl+yl;if(O[1])O[1][i]=xr+yr;}
      else{O[0][i]=xl*(1-m)+(yl+ul)*m;if(O[1])O[1][i]=xr*(1-m)+(yr+ur)*m;}
      this.w=(w+1)&this.M;this.n++;}
    return true;}
  /* where we are in the cycle: on the beat grid with QUANTIZE, else from the moment the effect started */
  phase(n,T){const p=this.p;if(p.quant){const b=this.beatAt(n),tb=T/p.qSpb;return ((b/tb)%1+1)%1;}return (((n-this.t0)/(T*sampleRate))%1+1)%1;}
}
registerProcessor('bc-beat',BcBeat);`;
