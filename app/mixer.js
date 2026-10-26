/* ---------------- the mixer (after the DJM-900NXS2): state, audio routing, SOUND COLOR FX, level meters, headphones ----------------
   Signal path of one channel, as in the manual's block diagram: input selector, TRIM, SOUND COLOR FX, EQ/ISO, then the level meter
   and the CUE send (before the fader), the channel fader and the crossfader assign. Then MASTER LEVEL, BALANCE and the peak limiter. */
const CH_OF=[2,3,1,4];                       /* the order players are added in: channel 2 first, then 3, 1, 4 */
const MS={on:false,param:.5,color:null,master:.5,balance:.5,booth:.5,cueMaster:false,mixing:.5,phLevel:.6,mono:-1,eqCurve:1,chCurve:0,xfCurve:0,xfader:0,
  midi:false,cueLink:false,fxType:'PING PONG',fxCh:'MASTER',bpm:null,beat:['1/2','3/4','1'],touch:null,quantize:false,tap:false,freq:{LOW:true,MID:true,HI:true},fxOn:false,sendOn:false,depth:.5,pad:null,
  mL:-99,mR:-99,
  ch:[0,1,2,3].map(()=>({input:'DIGITAL',trim:.5,hi:.5,mid:.5,low:.5,color:.5,cue:false,fader:1,xf:0,level:-99,clip:0})),
  phones:'',phonesName:'',dirty:true};
const MIX={N:null,fxReady:false,ir:null,irP:-1,noise:null};
/* ---------- value curves ---------- */
const dbg=db=>Math.pow(10,db/20);
const trimGain=v=>v>=.5?dbg((v-.5)/.5*9):Math.pow(v/.5,3);
function eqGain(v,iso){if(v>=.5)return dbg((v-.5)/.5*6);if(iso)return Math.pow(v/.5,2.2);return dbg(-26*(1-v/.5));}
function chFaderGain(v,curve){if(v<=0)return 0;return curve<0?Math.pow(v,3):curve>0?1-Math.pow(1-v,3):Math.pow(v,1.6);}
/* crossfader x: -1 = A, 1 = B; curve -1 = sharp cut, 0 = in between, 1 = gradual */
function xfGains(x,curve){const t=(x+1)/2;
  if(curve<0)return [t<.97?1:(1-t)/.03,t>.03?1:t/.03];
  if(curve>0)return [Math.cos(t*Math.PI/2),Math.sin(t*Math.PI/2)];
  return [Math.min(1,2*(1-t)),Math.min(1,2*t)];}
/* MASTER LEVEL at 12 o'clock gives the level the V2.5 gave at 80 %; turned fully up, 0 dB */
const masterGain=v=>Math.pow(v,.8);
/* ---------- the audio graph ---------- */
function mixBuild(){
  const c=AU.ctx,N={ch:[]};MIX.N=N;
  N.bypass=c.createGain();N.bypass.connect(AU.out);
  N.mSum=c.createGain();N.mLevel=c.createGain();N.split=c.createChannelSplitter(2);N.bl=c.createGain();N.br=c.createGain();N.merge=c.createChannelMerger(2);
  N.lim=c.createDynamicsCompressor();N.lim.threshold.value=-1;N.lim.knee.value=0;N.lim.ratio.value=20;N.lim.attack.value=.002;N.lim.release.value=.12;
  N.mixOn=c.createGain();
  N.mSum.connect(N.mLevel);N.mLevel.connect(N.split);N.split.connect(N.bl,0);N.split.connect(N.br,1);N.bl.connect(N.merge,0,0);N.br.connect(N.merge,0,1);
  N.merge.connect(N.lim);N.lim.connect(N.mixOn);N.mixOn.connect(AU.out);
  N.aL=c.createAnalyser();N.aR=c.createAnalyser();for(const a of [N.aL,N.aR])a.fftSize=1024;
  const ms=c.createChannelSplitter(2);N.lim.connect(ms);ms.connect(N.aL,0);ms.connect(N.aR,1);
  N.buf=new Float32Array(1024);
  /* headphones: the CUE mix and the master, blended by MIXING; MONO SPLIT puts the cue on the left and the master on the right */
  N.cueSum=c.createGain();N.cueMaster=c.createGain();N.lim.connect(N.cueMaster);N.cueMaster.connect(N.cueSum);
  N.phCue=c.createGain();N.phMst=c.createGain();N.cueSum.connect(N.phCue);N.lim.connect(N.phMst);
  N.phSt=c.createGain();N.phCue.connect(N.phSt);N.phMst.connect(N.phSt);
  const mono=()=>{const g=c.createGain();g.channelCount=1;g.channelCountMode='explicit';g.channelInterpretation='speakers';return g;};
  N.phCueM=mono();N.phMstM=mono();N.phCue.connect(N.phCueM);N.phMst.connect(N.phMstM);N.phSpl=c.createChannelMerger(2);N.phCueM.connect(N.phSpl,0,0);N.phMstM.connect(N.phSpl,0,1);
  N.phStG=c.createGain();N.phSpG=c.createGain();N.phSt.connect(N.phStG);N.phSpl.connect(N.phSpG);
  N.phLevel=c.createGain();N.phStG.connect(N.phLevel);N.phSpG.connect(N.phLevel);
  for(let i=0;i<4;i++){
    const C={};N.ch[i]=C;
    C.in=c.createGain();C.in.connect(N.bypass);
    C.sel=c.createGain();C.trim=c.createGain();C.in.connect(C.sel);C.sel.connect(C.trim);
    C.cIn=c.createGain();C.cOut=c.createGain();C.dry=c.createGain();C.trim.connect(C.cIn);C.cIn.connect(C.dry);C.dry.connect(C.cOut);C.fx=null;
    /* EQ / ISO: three bands split with Linkwitz-Riley crossovers (300 Hz, 4 kHz) so the bands add up flat */
    const bq=(t,f)=>{const b=c.createBiquadFilter();b.type=t;b.frequency.value=f;b.Q.value=Math.SQRT1_2;return b;};
    const chain=(a)=>{for(let k=0;k<a.length-1;k++)a[k].connect(a[k+1]);return a;};
    const lo=chain([bq('lowpass',300),bq('lowpass',300)]),ap=bq('allpass',4000),hi1=chain([bq('highpass',300),bq('highpass',300)]);
    const mid=chain([bq('lowpass',4000),bq('lowpass',4000)]),hi=chain([bq('highpass',4000),bq('highpass',4000)]);
    C.gLo=c.createGain();C.gMid=c.createGain();C.gHi=c.createGain();C.eq=c.createGain();
    C.cOut.connect(lo[0]);lo[1].connect(ap);ap.connect(C.gLo);C.cOut.connect(hi1[0]);hi1[1].connect(mid[0]);hi1[1].connect(hi[0]);mid[1].connect(C.gMid);hi[1].connect(C.gHi);
    for(const g of [C.gLo,C.gMid,C.gHi])g.connect(C.eq);
    C.an=c.createAnalyser();C.an.fftSize=1024;C.eq.connect(C.an);
    C.cue=c.createGain();C.eq.connect(C.cue);C.cue.connect(N.cueSum);
    C.fader=c.createGain();C.eq.connect(C.fader);C.fader.connect(N.mSum);
  }
  mixApply();loadFxWorklet();
}
function mixInput(ch){ensureCtx();return MIX.N.ch[ch-1].in;}
/* every control value to the graph (smoothed so nothing clicks) */
function setP(p,v){const c=AU.ctx;if(!c)return;p.setTargetAtTime(v,c.currentTime,.012);}
function mixApply(){
  const N=MIX.N;if(!N)return;MS.dirty=true;
  const on=MS.on;setP(N.bypass.gain,on?0:1);setP(N.mixOn.gain,on?1:0);
  const [gA,gB]=xfGains(MS.xfader,MS.xfCurve);
  MS.ch.forEach((ch,i)=>{const C=N.ch[i];
    setP(C.sel.gain,ch.input==='DIGITAL'||ch.input==='LINE'?1:0);setP(C.trim.gain,trimGain(ch.trim));
    const iso=MS.eqCurve<0;setP(C.gLo.gain,eqGain(ch.low,iso));setP(C.gMid.gain,eqGain(ch.mid,iso));setP(C.gHi.gain,eqGain(ch.hi,iso));
    setP(C.cue.gain,ch.cue?1:0);
    setP(C.fader.gain,chFaderGain(ch.fader,MS.chCurve)*(ch.xf<0?gA:ch.xf>0?gB:1));
    colorParams(i);});
  setP(N.mLevel.gain,masterGain(MS.master));setP(N.bl.gain,Math.min(1,2*(1-MS.balance)));setP(N.br.gain,Math.min(1,2*MS.balance));
  setP(N.cueMaster.gain,MS.cueMaster?1:0);
  const m=MS.mixing;setP(N.phCue.gain,Math.min(1,2*(1-m)));setP(N.phMst.gain,Math.min(1,2*m));
  setP(N.phStG.gain,MS.mono<0?0:1);setP(N.phSpG.gain,MS.mono<0?1:0);setP(N.phLevel.gain,Math.pow(MS.phLevel,2));
}
/* ---------- SOUND COLOR FX: one effect for every channel, each channel's COLOR knob sets its amount (centre = off) ---------- */
const FX_SRC=`class BcFx extends AudioWorkletProcessor{
  constructor(){super();this.mode=0;this.thr=0;this.rel=.05;this.bits=16;this.ds=1;this.env=0;this.g=1;this.h=[0,0];this.n=0;
    this.port.onmessage=e=>Object.assign(this,e.data);}
  process(inp,out){const I=inp[0],O=out[0];if(!I||!I.length){return true;}const L=I[0].length,sr=sampleRate;
    const ra=Math.exp(-1/(.0008*sr)),rr=Math.exp(-1/(Math.max(.005,this.rel)*sr));
    for(let i=0;i<L;i++){
      if(this.mode===1){let pk=0;for(let c=0;c<I.length;c++)pk=Math.max(pk,Math.abs(I[c][i]));this.env=pk>this.env?pk:this.env*rr+pk*(1-rr);
        const want=this.env>this.thr?1:0;this.g+=(want-this.g)*(want>this.g?.02:.002);for(let c=0;c<O.length;c++)O[c][i]=(I[c]||I[0])[i]*this.g;}
      else if(this.mode===2){if(this.n<=0){for(let c=0;c<2;c++){const s=(I[c]||I[0])[i];const q=Math.pow(2,this.bits-1);this.h[c]=Math.round(s*q)/q;}this.n=this.ds;}this.n--;
        for(let c=0;c<O.length;c++)O[c][i]=this.h[Math.min(c,1)];}
      else for(let c=0;c<O.length;c++)O[c][i]=(I[c]||I[0])[i];}
    return true;}}
registerProcessor('bc-fx',BcFx);`;
async function loadFxWorklet(){try{const c=AU.ctx;if(!c.audioWorklet)return;const u=URL.createObjectURL(new Blob([FX_SRC],{type:'text/javascript'}));await c.audioWorklet.addModule(u);MIX.fxReady=true;if(MS.color)colorBuild();}catch(e){MIX.fxReady=false;}}
function noiseBuf(){if(MIX.noise)return MIX.noise;const c=AU.ctx,b=c.createBuffer(2,c.sampleRate*2,c.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}return MIX.noise=b;}
function reverbIR(p){const c=AU.ctx,len=Math.round(c.sampleRate*(.8+p*4)),b=c.createBuffer(2,len,c.sampleRate);
  for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<len;i++){const t=i/len;d[i]=(Math.random()*2-1)*Math.pow(1-t,2.6)*(i<c.sampleRate*.012?i/(c.sampleRate*.012):1);}}return b;}
function chBpm(i){const d=DECKS.find(x=>x.ch===i+1);return d&&d.loaded()?d.bpmNow()||120:120;}
function colorBuild(){
  const N=MIX.N;if(!N)return;const c=AU.ctx;
  for(let i=0;i<4;i++){const C=N.ch[i];
    if(C.fx){for(const n of C.fx.nodes){try{n.disconnect();}catch(e){}if(n.stop)try{n.stop();}catch(e){}}C.fx=null;}
    const t=MS.color;if(!t){setP(C.dry.gain,1);continue;}
    const fx={t,nodes:[]};const add=n=>(fx.nodes.push(n),n);
    fx.wet=add(c.createGain());fx.wet.gain.value=0;fx.wet.connect(C.cOut);
    if(t==='FILTER'){fx.f=add(c.createBiquadFilter());C.cIn.connect(fx.f);fx.f.connect(fx.wet);}
    else if(t==='SWEEP'){fx.f=add(c.createBiquadFilter());fx.f.type='bandpass';fx.mk=add(c.createGain());C.cIn.connect(fx.f);fx.f.connect(fx.mk);fx.mk.connect(fx.wet);
      if(MIX.fxReady){fx.gate=add(new AudioWorkletNode(c,'bc-fx',{outputChannelCount:[2]}));fx.gate.port.postMessage({mode:1});fx.gw=add(c.createGain());C.cIn.connect(fx.gate);fx.gate.connect(fx.gw);fx.gw.connect(C.cOut);fx.gw.gain.value=0;}}
    else if(t==='SPACE'){fx.send=add(c.createGain());fx.cv=add(c.createConvolver());fx.cv.normalize=true;fx.f=add(c.createBiquadFilter());
      if(!MIX.ir||Math.abs(MIX.irP-MS.param)>.02){MIX.ir=reverbIR(MS.param);MIX.irP=MS.param;}fx.cv.buffer=MIX.ir;
      C.cIn.connect(fx.send);fx.send.connect(fx.f);fx.f.connect(fx.cv);fx.cv.connect(fx.wet);fx.wet.gain.value=1;}
    else if(t==='DUB ECHO'){fx.send=add(c.createGain());fx.dl=add(c.createDelay(4));fx.fb=add(c.createGain());fx.f=add(c.createBiquadFilter());
      C.cIn.connect(fx.send);fx.send.connect(fx.dl);fx.dl.connect(fx.f);fx.f.connect(fx.fb);fx.fb.connect(fx.dl);fx.f.connect(fx.wet);fx.wet.gain.value=.9;}
    else if(t==='NOISE'){fx.src=add(c.createBufferSource());fx.src.buffer=noiseBuf();fx.src.loop=true;fx.f=add(c.createBiquadFilter());fx.src.connect(fx.f);fx.f.connect(fx.wet);fx.src.start();}
    else if(t==='CRUSH'){
      if(MIX.fxReady){fx.cr=add(new AudioWorkletNode(c,'bc-fx',{outputChannelCount:[2]}));fx.cr.port.postMessage({mode:2});}else{fx.cr=add(c.createGain());}
      fx.ws=add(c.createWaveShaper());fx.ws.oversample='2x';fx.f=add(c.createBiquadFilter());fx.f.type='highpass';
      C.cIn.connect(fx.cr);fx.cr.connect(fx.ws);fx.ws.connect(fx.f);fx.f.connect(fx.wet);}
    C.fx=fx;colorParams(i);
  }
}
function wsCurve(drive){const n=1024,a=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;a[i]=Math.tanh(x*drive)/Math.tanh(drive);}return a;}
function colorParams(i){
  const N=MIX.N;if(!N)return;const C=N.ch[i],fx=C.fx,v=MS.ch[i].color,d=v-.5,a=Math.min(1,Math.abs(d)*2),p=MS.param,on=a>.03;
  if(!fx){setP(C.dry.gain,1);return;}
  const f=fx.f;
  switch(fx.t){
    case 'FILTER':setP(C.dry.gain,on?0:1);setP(fx.wet.gain,on?1:0);
      if(d<0){f.type='lowpass';setP(f.frequency,20000*Math.pow(60/20000,a));}else{f.type='highpass';setP(f.frequency,20*Math.pow(9000/20,a));}setP(f.Q,.7+p*12);break;
    case 'SWEEP':
      if(d>0){setP(C.dry.gain,on?0:1);setP(fx.wet.gain,on?1:0);if(fx.gw)setP(fx.gw.gain,0);setP(f.frequency,150*Math.pow(8000/150,p));setP(f.Q,.5+a*8);setP(fx.mk.gain,1+a*1.5);}
      else if(fx.gate){setP(C.dry.gain,on?0:1);setP(fx.wet.gain,0);setP(fx.gw.gain,on?1:0);fx.gate.port.postMessage({thr:.02+a*.35,rel:.02+p*.25});}
      else{setP(C.dry.gain,1-a*.6);setP(fx.wet.gain,0);}break;
    case 'SPACE':setP(C.dry.gain,1);setP(fx.send.gain,on?a*1.1:0);if(d<0){f.type='lowpass';f.frequency.value=2500;}else{f.type='highpass';f.frequency.value=900;}
      if(Math.abs(MIX.irP-p)>.05){clearTimeout(MIX.irT);MIX.irT=setTimeout(()=>{MIX.ir=reverbIR(MS.param);MIX.irP=MS.param;for(const X of N.ch)if(X.fx&&X.fx.cv)X.fx.cv.buffer=MIX.ir;},150);}break;
    case 'DUB ECHO':setP(C.dry.gain,1);setP(fx.send.gain,on?a:0);setP(fx.dl.delayTime,60/chBpm(i)*.75);setP(fx.fb.gain,.3+p*.6);
      if(d<0){f.type='bandpass';f.frequency.value=1000;f.Q.value=.9;}else{f.type='highpass';f.frequency.value=2500;f.Q.value=.7;}break;
    case 'NOISE':setP(C.dry.gain,1);setP(fx.wet.gain,on?a*(.03+p*.3):0);
      if(d<0){f.type='lowpass';setP(f.frequency,20000*Math.pow(200/20000,a));}else{f.type='highpass';setP(f.frequency,20*Math.pow(8000/20,a));}break;
    case 'CRUSH':setP(C.dry.gain,on?0:1);setP(fx.wet.gain,on?1:0);
      if(d<0){fx.ws.curve=wsCurve(1+a*(4+p*30));setP(f.frequency,20);if(fx.cr.port)fx.cr.port.postMessage({bits:16,ds:1});}
      else{fx.ws.curve=wsCurve(1+p*3);setP(f.frequency,20*Math.pow(3000/20,a*a));if(fx.cr.port)fx.cr.port.postMessage({bits:Math.round(16-a*(9+p*4)),ds:1+Math.round(a*(4+p*12))});}break;
  }
}
/* BEAT FX screen, AUTO mode: the BPM measured on the channel the FX channel selector picks (70 to 180 BPM, manual p. 13);
   when nothing can be measured the last value stays and blinks. Here the BPM comes from the players that are heard there. */
function fxBpmTick(){
  const c=MS.fxCh,heard=d=>d.loaded()&&d.playing&&MS.ch[d.ch-1].input==='DIGITAL'&&MS.ch[d.ch-1].level>-40;
  let src=DECKS.filter(heard);
  if(/^[1-4]$/.test(c))src=src.filter(d=>d.ch===+c);
  else if(c==='A'||c==='B')src=src.filter(d=>MS.ch[d.ch-1].xf===(c==='A'?-1:1)&&MS.ch[d.ch-1].fader>0);
  else if(c==='MASTER')src=src.filter(d=>MS.ch[d.ch-1].fader>0);
  else src=[];
  src.sort((a,b)=>MS.ch[b.ch-1].level-MS.ch[a.ch-1].level);
  const bpm=src.length?src[0].bpmNow():0;
  if(bpm>=70&&bpm<=180){const v=Math.round(bpm);if(v!==MS.bpm||MS.bpmLost){MS.bpm=v;MS.bpmLost=false;}}
  else if(MS.bpm!=null)MS.bpmLost=true;
}
function setColor(t){MS.color=MS.color===t?null:t;ensureCtx();colorBuild();MS.dirty=true;}
/* ---------- level meters: peak, fast attack, falling 20 dB a second; 0 on the meter = -9 dBFS ---------- */
function peakDb(an,buf){an.getFloatTimeDomainData(buf);let m=0;for(let i=0;i<buf.length;i++){const v=Math.abs(buf[i]);if(v>m)m=v;}return m>0?20*Math.log10(m)+9:-99;}
let METER_T=0;
function mixMeters(){
  const N=MIX.N;if(!N)return;const t=now(),dt=Math.min(.1,t-(METER_T||t));METER_T=t;const fall=20*dt;
  const upd=(old,v)=>v>=old?v:Math.max(v,old-fall);
  MS.ch.forEach((ch,i)=>{const v=peakDb(N.ch[i].an,N.buf);const lv=upd(ch.level,v);if(Math.round(lv/3)!==Math.round(ch.level/3))MS.dirty=true;ch.level=lv;if(v>13){ch.clip=t;MS.dirty=true;}});
  const l=upd(MS.mL,peakDb(N.aL,N.buf)),r=upd(MS.mR,peakDb(N.aR,N.buf));if(Math.round(l/3)!==Math.round(MS.mL/3)||Math.round(r/3)!==Math.round(MS.mR/3))MS.dirty=true;MS.mL=l;MS.mR=r;
}
/* ---------- headphones on a second audio output ---------- */
const PH={ctx:null,el:null,dest:null};
const phSupport=()=>!!((window.AudioContext&&AudioContext.prototype.setSinkId)||(window.HTMLMediaElement&&HTMLMediaElement.prototype.setSinkId));
async function setPhones(id,name){
  ensureCtx();const N=MIX.N;
  try{
    if(!id){if(PH.dest)try{N.phLevel.disconnect(PH.dest);}catch(e){}if(PH.ctx)PH.ctx.suspend();if(PH.el)PH.el.pause();MS.phones='';MS.phonesName='';MS.dirty=true;return true;}
    if(!PH.dest){PH.dest=AU.ctx.createMediaStreamDestination();}
    try{N.phLevel.disconnect(PH.dest);}catch(e){}N.phLevel.connect(PH.dest);
    if(window.AudioContext&&AudioContext.prototype.setSinkId){
      if(!PH.ctx){PH.ctx=new AudioContext({latencyHint:'interactive'});PH.ctx.createMediaStreamSource(PH.dest.stream).connect(PH.ctx.destination);}
      await PH.ctx.setSinkId(id);await PH.ctx.resume();
    }else{
      if(!PH.el){PH.el=new Audio();PH.el.srcObject=PH.dest.stream;}
      await PH.el.setSinkId(id);await PH.el.play();
    }
    MS.phones=id;MS.phonesName=name||'';MS.dirty=true;return true;
  }catch(e){toast(say('Sortie casque impossible : ','Headphone output failed: ')+(e&&e.message||e),5000);return false;}
}
