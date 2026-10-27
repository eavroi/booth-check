"""Tests de comportement : python tests/scenarios.py  (pip install playwright ; playwright install chromium)
Chaque scénario suit le mode d'emploi de la vraie machine. Ouvre index.html, joue la démo et vérifie l'état après chaque geste."""
import asyncio,pathlib,sys
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
sys.stdout.reconfigure(encoding='utf-8')
# Chaque scénario : (nom, code JS async qui renvoie true si c'est bon, ou un texte qui explique l'écart)
JS_HELPERS="""
window.TT={wait:ms=>new Promise(r=>setTimeout(r,ms)),near:(a,b,e)=>Math.abs(a-b)<=(e||.03),
  async fresh(d,i){d=d||D1;d.pause();await d.loadTrack(MEDIA[0].tracks[i||0],{list:MEDIA[0].tracks});return d;},
  /* a Hercules DJ Control Steel without the hardware: its template, and its messages sent by hand (CC on channel 1) */
  steel(){MIDI.cfg={tpl:'steel',map:MTPL.steel.map(),custom:false};MIDI.btn.clear();MIDI.pick.clear();},
  cc(n,v){midiMsg({data:[0xB0,n,v]});},press(n){this.cc(n,127);this.cc(n,0);},
  /* a short groove (kick, snare, hats, bass, chords) played through channel 2 of the mixer in an offline context */
  music(){if(this._m)return this._m;const sr=48000,n=sr*8,b=new AudioBuffer({numberOfChannels:2,length:n,sampleRate:sr}),L=b.getChannelData(0),R=b.getChannelData(1);let seed=1,hl=0,sn=0;
    const rnd=()=>{seed=(seed*16807)%2147483647;return seed/1073741823.5-1;};
    for(let i=0;i<n;i++){const t=i/sr,bt=t%.5,beat=Math.floor(t/.5),e=t%.25,nz=rnd();let x=Math.sin(2*Math.PI*(45+120*Math.exp(-bt*35))*bt)*Math.exp(-bt*9)*.7;
      hl+=.9*(nz-hl);x+=(nz-hl)*Math.exp(-e*60)*.25;if(beat%2){sn+=.4*(nz-sn);x+=(sn*.6+Math.sin(2*Math.PI*190*bt)*.3)*Math.exp(-bt*18)*.6;}
      x+=((t*[110,82.4,98,73.4][Math.floor(beat/4)%4])%1*2-1)*.18;if(bt>.25){let c=0;for(const f of [261.6,329.6,392])for(let h=1;h<8;h++)c+=Math.sin(2*Math.PI*f*h*t)/h;x+=c*.05*Math.exp(-(bt-.25)*6);}
      L[i]=R[i]=x*.6;}return this._m=b;},
  async fx(type,color,param,cutAt){const sr=48000,oc=new OfflineAudioContext(2,sr*3,sr),S={ctx:AU.ctx,out:AU.out,N:MIX.N,on:MS.on,fx:MIX.fxReady,col:MS.color,p:MS.param,c:MS.ch[1].color,f:MS.ch[1].fader};
    AU.ctx=oc;AU.out=oc.createGain();AU.out.connect(oc.destination);MS.on=true;
    try{mixBuild();await loadFxWorklet();MS.color=type;MS.param=param;MS.ch[1].color=color;MS.ch[1].fader=1;mixApply();colorBuild();
      const s=oc.createBufferSource();s.buffer=this.music();s.connect(MIX.N.ch[1].in);s.start(0,1);
      if(cutAt!=null){const g=MIX.N.ch[1].fader.gain;g.cancelScheduledValues(0);g.setValueAtTime(1,0);g.setValueAtTime(1,cutAt);g.linearRampToValueAtTime(0,cutAt+.05);}}
    finally{AU.ctx=S.ctx;AU.out=S.out;MIX.N=S.N;MS.on=S.on;MS.color=S.col;MS.param=S.p;MS.ch[1].color=S.c;MS.ch[1].fader=S.f;}
    const d=(await oc.startRendering()).getChannelData(0);MIX.fxReady=S.fx;return d;},
  /* level in dB from a to b seconds; between = only the second half of each beat (what is left between the kicks) */
  db(d,a,b,between){let e=0,n=0;for(let i=Math.round(a*48000);i<b*48000;i++){if(between&&(i/48000)%.5<.3)continue;e+=d[i]*d[i];n++;}return 10*Math.log10(e/n+1e-12);}};
"""
SCEN=[
 ('Chargement : à l’arrêt sur le point CUE',"""const d=await TT.fresh();return !d.playing&&TT.near(d.pos(),d.cue)||('pos '+d.pos()+' cue '+d.cue);"""),
 ('PLAY/PAUSE : la lecture avance',"""const d=await TT.fresh();const p0=d.pos();playBtn(d);await TT.wait(400);const p1=d.pos();playBtn(d);return d.playing===false&&p1-p0>.25||('avance '+(p1-p0));"""),
 ('CUE en lecture : retour au point CUE et pause',"""const d=await TT.fresh();playBtn(d);await TT.wait(300);cueDown(d);cueUp(d);return !d.playing&&TT.near(d.pos(),d.cue)||('pos '+d.pos());"""),
 ('CUE maintenu sur le point CUE : lecture, relâché : retour',"""const d=await TT.fresh();cueDown(d);await TT.wait(300);const pl=d.playing;cueUp(d);return pl&&!d.playing&&TT.near(d.pos(),d.cue)||('joue '+pl+' pos '+d.pos());"""),
 ('CUE à l’arrêt ailleurs : nouveau point CUE calé sur le temps (QUANTIZE)',"""const d=await TT.fresh();d.quant=true;d.seek(20.1234);cueDown(d);cueUp(d);return TT.near(d.cue,d.quantTime(20.1234),.001)&&!TT.near(d.cue,20.1234,.0005)||('cue '+d.cue);"""),
 ('HOT CUE : posé sur un pad vide puis rappelé',"""const d=await TT.fresh();d.quant=false;d.cur.hot={};d.seek(30);hotDown(d,0);hotUp(d,0);const h=d.cur.hot[1];d.seek(60);hotDown(d,0);hotUp(d,0);const ok=h&&TT.near(h.time,30)&&d.playing&&d.pos()<31;d.pause();return ok||('hot '+JSON.stringify(h)+' pos '+d.pos());"""),
 ('BEAT LOOP 4 : boucle de 4 temps',"""const d=await TT.fresh();playBtn(d);await TT.wait(200);d.beatLoop(4);const L=d.loop?(d.loop.b-d.loop.a)/d.spb():0;d.exitLoop();d.pause();return TT.near(L,4,.05)&&!d.loop||('longueur '+L);"""),
 ('SYNC : la platine suit le BPM du MASTER',"""if(DECKS.length<2)setBooth({p:[2,3],m:BOOTH.m});const a=DECKS[0],b=DECKS[1];await TT.fresh(a,0);await TT.fresh(b,1);BUS.setMaster(a);b.setSync(true);BUS.tick();const ok=TT.near(b.bpmNow(),a.bpmNow(),.05);b.setSync(false);return ok||('bpm '+b.bpmNow()+' / '+a.bpmNow());"""),
 ('PLAYER affiché = numéro de tranche',"""setBooth({p:[1,4],m:false});const ok=DECKS.map(d=>d.pn).join()==='1,4'&&DECKS.every(d=>d.ch===d.pn);setBooth({p:[2],m:false});return ok||DECKS.map(d=>d.pn).join();"""),
 ('Table : MASTER LEVEL au centre par défaut',"""return MS.master===.5||('master '+MS.master);"""),
 ('Table : fader de tranche à 0 = tranche muette',"""setBooth({p:[2],m:true});ensureCtx();const ch=MS.ch[1];const f=ch.fader;ch.fader=0;mixApply();const g=MIX.N.ch[1].fader.gain;await TT.wait(150);const v=g.value;ch.fader=f;mixApply();return v<.001||('gain '+v);"""),
 ('Double-clic : EQ et COLOR reviennent au centre',"""setBooth({p:[2],m:true});const ch=MS.ch[0];ch.hi=.9;ch.color=.1;mixReset('hi',0);mixReset('color',0);return ch.hi===.5&&ch.color===.5||(ch.hi+' '+ch.color);"""),
 ('Table : EQ au centre = son à plat de 50 Hz à 16 kHz (même couleur que la CDJ seule)',"""
  const run=async(on,f)=>{const sr=48000,oc=new OfflineAudioContext(2,sr*.5,sr),save={ctx:AU.ctx,out:AU.out,N:MIX.N,on:MS.on,fx:MIX.fxReady};
    AU.ctx=oc;AU.out=oc.createGain();AU.out.gain.value=.9;AU.out.connect(oc.destination);MS.on=on;
    try{mixBuild();const o=oc.createOscillator();o.frequency.value=f;const g=oc.createGain();g.gain.value=.1;o.connect(g);g.connect(MIX.N.ch[1].in);o.start(0);}
    finally{AU.ctx=save.ctx;AU.out=save.out;MIX.N=save.N;MS.on=save.on;}
    const b=await oc.startRendering();MIX.fxReady=save.fx;const d=b.getChannelData(0);let s=0;for(let i=d.length/2;i<d.length;i++)s+=d[i]*d[i];return 10*Math.log10(s/(d.length/2));};
  const gaps=[];for(const f of [50,100,300,1000,4000,10000,16000])gaps.push((await run(true,f))-(await run(false,f)));
  const spread=Math.max(...gaps)-Math.min(...gaps);return spread<.5||('écarts '+gaps.map(x=>x.toFixed(1)).join(' / ')+' dB');"""),
 ('Steel : PLAY du deck gauche lance la platine de gauche',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();TT.press(0x0B);await TT.wait(200);const pl=d.playing;TT.press(0x0B);return pl&&!d.playing||('joue '+pl);"""),
 ('Steel : pads 1-6 = boucles, IN puis OUT pose une boucle',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();d.quant=false;playBtn(d);await TT.wait(100);TT.press(0x01);await TT.wait(600);TT.press(0x04);const ok=!!d.loop&&d.loop.b-d.loop.a>.4;d.exitLoop();d.pause();return ok||('boucle '+JSON.stringify(d.loop));"""),
 ('Steel : pendant une boucle, pads 3/6 = LOOP 1/2X et 2X',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();playBtn(d);await TT.wait(100);d.beatLoop(4);TT.press(0x06);const a=d.loopLenBeats();TT.press(0x03);TT.press(0x03);const b=d.loopLenBeats();d.exitLoop();d.pause();return a===8&&b===2||(a+' puis '+b);"""),
 ('Steel : hors boucle, pad 6 = BEAT JUMP en avant',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();d.seek(30);const p0=d.pos();TT.press(0x06);return d.pos()>p0+.1||('pos '+p0+' → '+d.pos());"""),
 ('Steel : avec SHIFT, pads 7/10 = HOT CUE A/B',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();d.quant=false;d.cur.hot={};d.seek(40);TT.press(0x64);d.seek(50);TT.press(0x67);d.pause();const A=d.cur.hot[1],B=d.cur.hot[2];return A&&B&&TT.near(A.time,40)&&TT.near(B.time,50)||JSON.stringify(d.cur.hot);"""),
 ('Steel : pad 12 maintenu + hot cue = effacé (CALL/DELETE)',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();d.cur.hot={};d.seek(40);TT.press(0x64);d.pause();TT.cc(0x69,127);TT.press(0x64);TT.cc(0x69,0);return !d.cur.hot[1]||'pas effacé';"""),
 ('Steel : pad 9 = BANK, les pads passent aux hot cues E-H',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();d.quant=false;d.cur.hot={};d.bank=0;TT.press(0x66);const b=d.bank;d.seek(33);TT.press(0x64);d.pause();TT.press(0x66);return b===1&&d.bank===0&&!!d.cur.hot[5]&&!d.cur.hot[1]||('bank '+b+' hot '+Object.keys(d.cur.hot));"""),
 ('Steel : fader TEMPO en haut = moins vite (comme la CDJ)',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();d.tempoV=0;d.applyTempo();TT.cc(0x31,64);for(let v=64;v<=127;v+=7)TT.cc(0x31,v);TT.cc(0x31,127);const t=d.tempoV;d.tempoV=0;d.applyTempo();return t<-.9||('tempoV '+t);"""),
 ('Steel : Stop seul = MASTER TEMPO, Stop + ▶▶ = morceau suivant',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh(D1,0);d.mt=false;TT.press(0x0D);const mt=d.mt;TT.cc(0x0D,127);TT.press(0x0A);TT.cc(0x0D,0);await TT.wait(400);const tr=d.cur.tr===MEDIA[0].tracks[1];const mt2=d.mt;d.mt=false;return mt&&mt2&&tr||('MT '+mt+'/'+mt2+' morceau suivant '+tr);"""),
 ('Steel : Stop + Gain = COLOR de la tranche, le TRIM ne bouge pas',"""setBooth({p:[2],m:true});TT.steel();const ch=MS.ch[1];ch.color=.5;ch.trim=.5;TT.cc(0x0D,127);for(let v=64;v<=110;v+=4)TT.cc(0x33,v);TT.cc(0x0D,0);const c=ch.color,t=ch.trim;ch.color=.5;mixApply();return c>.75&&t===.5||('color '+c+' trim '+t);"""),
 ('Steel : Controls 1 (Deck A) = sélecteur rotatif de la platine gauche',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();const t0=d.selTarget||0;TT.cc(0x41,1);TT.cc(0x41,127);TT.cc(0x41,1);const t1=d.selTarget||0;return t1-t0===15||('sélecteur '+(t1-t0));"""),
 ('Steel : Stop de droite + Kill de gauche = SPACE (les deux Stop marchent)',"""setBooth({p:[2],m:true});TT.steel();MS.color=null;TT.cc(0x25,127);TT.press(0x0E);TT.cc(0x25,0);const c=MS.color;MS.color=null;return c==='SPACE'||('effet '+c);"""),
 ('Steel : voyants — Stop allumé seulement tant qu’il est maintenu, CALL/DELETE seulement pressé',"""setBooth({p:[2],m:false});TT.steel();const sent=[];MIDI.out={send:m=>sent.push(m.map(x=>x.toString(16)).join(' '))};MIDI.leds.clear();await TT.fresh();midiTick();sent.length=0;
   TT.cc(0x0D,127);midiTick();const held=sent.includes('b0 d 7f');sent.length=0;TT.cc(0x0D,0);midiTick();const rel=sent.includes('b0 d 0');D1.mt=false;
   sent.length=0;TT.cc(0x69,127);midiTick();const c1=sent.includes('b0 69 7f');sent.length=0;TT.cc(0x69,0);midiTick();const c0=sent.includes('b0 69 0');MIDI.out=null;return held&&rel&&c1&&c0||[held,rel,c1,c0].join();"""),
 ('CDJ : LOOP OUT sans IN = boucle depuis le point CUE',"""const d=await TT.fresh();d.quant=false;d.cue=10;d.seek(10);playBtn(d);await TT.wait(700);outDown(d);const lp=d.loop;d.exitLoop();d.pause();return lp&&TT.near(lp.a,10,.01)&&lp.b>10.4||JSON.stringify(lp);"""),
 ('CDJ : IN ADJUST = IN clignote, OUT éteint, le temps du point IN est affiché',"""const d=await TT.fresh();playBtn(d);await TT.wait(100);d.beatLoop(4);inDown(d);const out=keyLight(d,'loop_out'),adj=d.adjust;inDown(d);d.exitLoop();d.pause();return adj==='in'&&out===false||('adjust '+adj+' OUT '+out);"""),
 ('CDJ : jog à l’arrêt, le son suit la platine (recherche audible)',"""const d=await TT.fresh();d.seek(20);const st={tg:{t:'jog',top:true}};jogDown(d,st,null);jogTurn(d,st,20);await TT.wait(15);jogTurn(d,st,20);const heard=d.scratchOn&&(d.engHas?!!(d.engLast&&d.engLast.run&&d.engLast.v):!!d.src);jogUp(d,st);return heard&&!d.playing&&!d.scratchOn||('son '+heard+' joue '+d.playing);"""),
 ('CDJ : TRACK FILTER EDIT, le sélecteur atteint MASTER PLAYER, MY TAG et RESET',"""const d=await TT.fresh();const u=d.ui.filt;goScr(d,'filter');u.tab=0;u.sel=0;u.pad=null;for(let i=0;i<4;i++)rotaryTurn(d,1);const m=u.sel;const F=fm(d).filter;const was=F.useMaster;rotaryPush(d);const mp=F.useMaster!==was;F.useMaster=was;rotaryTurn(d,1);rotaryPush(d);const tab=u.tab;rotaryTurn(d,-1);const side=u.side;u.tab=0;u.side=null;goScr(d,'play');return m===4&&mp&&tab===1&&side==='reset'||[m,mp,tab,side].join();"""),
 ('Steel : voyants — PLAY clignote en pause (code de clignotement du Steel), allumé en lecture',"""setBooth({p:[2],m:false});TT.steel();const sent=[];MIDI.out={send:m=>sent.push(m.map(x=>x.toString(16)).join(' '))};MIDI.leds.clear();const d=await TT.fresh();midiTick();const paused=sent.includes('b0 3b 7f');sent.length=0;playBtn(d);await TT.wait(100);midiTick();const playing=sent.includes('b0 b 7f')&&sent.includes('b0 3b 0');d.pause();MIDI.out=null;return paused&&playing||('pause '+paused+' lecture '+playing);"""),
 ('Steel : jog en VINYL pendant la lecture = main posée, la lecture reprend quand il s’arrête',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();d.vinyl=true;playBtn(d);await TT.wait(150);for(let i=0;i<5;i++){TT.cc(0x2F,3);await TT.wait(15);}const t=d.touching;await TT.wait(400);const r=!d.touching&&d.playing;d.pause();return t&&r||('touché '+t+' reprise '+r);"""),
 ('Steel : jog en mode CDJ = pitch bend, la lecture ne s’arrête pas',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();d.vinyl=false;playBtn(d);await TT.wait(150);TT.cc(0x2F,5);await TT.wait(10);TT.cc(0x2F,5);const b=d.bend,t=d.touching;await TT.wait(300);d.pause();d.vinyl=true;return b>1&&!t||('bend '+b+' touché '+t);"""),
 ('Steel : jog à l’arrêt = recherche fine',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();d.seek(20);const p0=d.pos();for(let i=0;i<10;i++)TT.cc(0x2F,4);await TT.wait(300);return d.pos()>p0+.05&&!d.playing||('pos '+p0+' → '+d.pos());"""),
 ('Steel : Kill maintenu = bande au minimum, relâché = retour',"""setBooth({p:[2],m:true});TT.steel();const ch=MS.ch[1];ch.hi=.6;TT.cc(0x0E,127);const k=ch.hi;TT.cc(0x0E,0);const r=ch.hi;ch.hi=.5;mixApply();return k===0&&r===.6||(k+' / '+r);"""),
 ('Steel : fader loin de l’écran = ignoré tant qu’il ne l’a pas rejoint',"""setBooth({p:[2],m:true});TT.steel();const ch=MS.ch[1];ch.fader=1;TT.cc(0x32,10);const a=ch.fader;TT.cc(0x32,90);TT.cc(0x32,127);const b=ch.fader;TT.cc(0x32,64);const c=ch.fader;ch.fader=1;mixApply();return a===1&&b===1&&TT.near(c,64/127,.01)||(a+' '+b+' '+c);"""),
 ('Steel : le crossfader ne change pas A / THRU / B',"""setBooth({p:[2],m:true});TT.steel();const xf=MS.ch.map(c=>c.xf).join();TT.cc(0x39,64);TT.cc(0x39,20);return MS.ch.map(c=>c.xf).join()===xf||'assignation changée';"""),
 ('Steel : commandes de table sans table = rien ne bouge',"""setBooth({p:[2],m:false});TT.steel();const ch=MS.ch[1];const f=ch.fader;TT.cc(0x32,0);TT.cc(0x32,127);return ch.fader===f||('fader '+ch.fader);"""),
 ('Steel : deux platines, le deck droit pilote la platine de droite',"""setBooth({p:[2,3],m:false});TT.steel();const r=DECKS[1];await TT.fresh(r,1);TT.press(0x23);await TT.wait(150);const ok=r.playing&&!DECKS[0].playing;r.pause();setBooth({p:[2],m:false});return ok||'platine '+r.ch+' joue '+r.playing;"""),
 ('Steel : Stop + Sync = MASTER de la platine',"""setBooth({p:[2,3],m:false});TT.steel();const a=DECKS[0];await TT.fresh(a,0);BUS.setMaster(null);TT.cc(0x0D,127);TT.press(0x07);TT.cc(0x0D,0);const ok=BUS.master===a&&!a.mt;BUS.setMaster(null);setBooth({p:[2],m:false});return ok||('master '+(BUS.master&&BUS.master.ch)+' MT '+a.mt);"""),
 ('Steel : Stop + CUE casque, LOAD, LOAD, CUE casque = BROWSE, TAG LIST, INFO, MENU de la platine du Stop',"""setBooth({p:[2,3],m:false});TT.steel();const d=await TT.fresh(DECKS[0],0);const r=[];const st=x=>{goScr(d,'play');d.ui.info=false;TT.cc(0x0D,127);TT.press(x);TT.cc(0x0D,0);};
  st(0x14);r.push(d.ui.scr);st(0x12);r.push(d.ui.scr);st(0x16);r.push(d.ui.info?'info':d.ui.scr);st(0x18);r.push(d.ui.scr);goScr(d,'play');d.ui.info=false;const other=DECKS[1].ui.scr;setBooth({p:[2],m:false});
  return r.join()==='browse,taglist,iplay,menu'&&other==='play'||(r.join()+' / droite '+other);"""),
 ('Steel : Stop + CUE de la platine = SLIP REVERSE tant qu’on appuie',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();playBtn(d);await TT.wait(100);TT.cc(0x0D,127);TT.cc(0x0C,127);await TT.wait(50);const a=d.dir===-1&&d.slipRevHeld,pl=d.playing;TT.cc(0x0C,0);TT.cc(0x0D,0);const b=d.dir===1&&d.lever===0;d.pause();return a&&b&&pl||('appuyé '+a+' relâché '+b);"""),
 ('Steel : Stop + ▶ = SHORT CUT, Stop + Scratch = SLIP, sans changer le mode du jog',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();goScr(d,'play');const sl=d.slip,v=d.vinyl;TT.cc(0x0D,127);TT.press(0x2D);const sc=d.ui.scr;TT.press(0x29);TT.cc(0x0D,0);const ok=sc==='shortcut'&&d.slip!==sl&&d.vinyl===v;d.slip=sl;goScr(d,'play');return ok||(sc+' slip '+d.slip+' vinyl '+d.vinyl);"""),
 ('Steel, voyants : 4/8 BEAT et RELOOP éteints pendant une boucle, BEAT JUMP allumés',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();playBtn(d);await TT.wait(100);d.beatLoop(4);const m=MIDI.cfg.map,st=c=>midiLedState(m['c0:'+c.toString(16).padStart(2,'0')],'c0:'+c.toString(16).padStart(2,'0'));
  const r=[st(0x02),st(0x05),st(0x03),st(0x06)].join();d.exitLoop();d.pause();return r==='0,0,1,1'||r;"""),
 ('Steel, voyants : le Kill de l’effet COLOR choisi clignote',"""setBooth({p:[2],m:true});TT.steel();MS.color='CRUSH';const m=MIDI.cfg.map,st=c=>{const k='c0:'+c.toString(16).padStart(2,'0');return midiLedState(m[k],k);};const r=[st(0x27),st(0x26),st(0x0e)].join();MS.color=null;return r==='2,0,0'||r;"""),
 ('Steel : Stop + Kill = choix du SOUND COLOR FX',"""setBooth({p:[2],m:true});TT.steel();MS.color=null;TT.cc(0x0D,127);TT.press(0x0E);const a=MS.color;TT.cc(0x0D,0);TT.cc(0x25,127);TT.press(0x28);const b=MS.color;TT.press(0x28);const c=MS.color;TT.cc(0x25,0);return a==='SPACE'&&b==='FILTER'&&c===null||(a+' / '+b+' / '+c);"""),
 ('Steel : toucher le côté droit rend sa platine active',"""setBooth({p:[2,3],m:false});TT.steel();ACTIVE=DECKS[0];TT.press(0x24);const ok=ACTIVE===DECKS[1];setBooth({p:[2],m:false});return ok||('active '+ACTIVE.ch);"""),
 ('Steel : diagnostic des voyants, un code allumé à la fois, réponse enregistrée',"""TT.steel();const sent=[];MIDI.out={send:m=>sent.push(m.map(x=>x.toString(16)).join(' '))};mstore.set('diag',null);diagStart();const first=sent.includes('b0 1 7f');sent.length=0;diagAnswer('ok');const next=sent.includes('b0 1 0')&&sent.includes('b0 2 7f');const tickOff=(()=>{sent.length=0;MIDI.leds.clear();midiTick();return sent.length===0;})();const r=MIDI.diag.res[1];diagStop();MIDI.out=null;mstore.set('diag',null);return first&&next&&tickOff&&r==='ok'||[first,next,tickOff,r].join();"""),
 ('Steel : « Tester les voyants » n’allume pas le SHIFT (code 0x43) et éteint tout ensuite',"""TT.steel();const sent=[];MIDI.out={send:m=>sent.push(m.map(x=>x.toString(16)).join(' '))};midiLedTest();const bad=sent.includes('b0 43 7f');await TT.wait(1700);const off=sent.includes('b0 43 0')&&sent.includes('b0 b 0');MIDI.out=null;return !bad&&off||('shift allumé '+bad+' éteint ensuite '+off);"""),
 ('Steel : voyants des flèches ◀ ▶ = codes 0x12 / 0x16, LOAD ne les allume plus',"""setBooth({p:[2],m:false});TT.steel();const sent=[];MIDI.out={send:m=>sent.push(m.map(x=>x.toString(16)).join(' '))};MIDI.leds.clear();const d=await TT.fresh();ACTIVE=d;goScr(d,'browse');midiTick();const on=sent.includes('b0 12 7f')&&sent.includes('b0 16 7f');const wrong=sent.some(x=>x.startsWith('b0 2c')||x.startsWith('b0 2d'));goScr(d,'play');MIDI.out=null;return on&&!wrong||('flèches '+on+' mauvais codes '+wrong);"""),
 ('Steel : 2e diagnostic, la réponse est le bouton cliqué sur le plan',"""TT.steel();MIDI.port='Hercules DJ Control Steel';MIDI.out={send(){}};mstore.set('diagx2',null);diagStart(true);const g=[...$('planBody').querySelectorAll('.p-c')].find(x=>x.dataset.id==='c0:09');g.dispatchEvent(new MouseEvent('click',{bubbles:true}));const r=MIDI.diag.res[0x12];diagStop();showPlan(false);MIDI.out=null;mstore.set('diagx2',null);return !!r&&r.includes('c0:09')||('réponse '+r);"""),
 ('MASTER TEMPO : à +8 %, la hauteur ne bouge pas (sans MASTER TEMPO elle monte de 8 %)',"""
  const sr=48000,f0=440,src=new Float32Array(sr*4);for(let i=0;i<src.length;i++)src[i]=.5*Math.sin(2*Math.PI*f0*i/sr);
  const run=async(v,mt)=>{const oc=new OfflineAudioContext(2,sr,sr);await loadDeckWorklet(oc);
    const n=new AudioWorkletNode(oc,'bc-deck',{numberOfInputs:0,outputChannelCount:[2],processorOptions:{msgs:[{load:[src.slice()],sr},{v,mt,lp:null,run:true,pos:.5,seq:1}]}});n.connect(oc.destination);
    const d=(await oc.startRendering()).getChannelData(0);let z=[],e=0;for(let i=sr/2;i<sr;i++){e+=d[i]*d[i];if(d[i-1]<0&&d[i]>=0)z.push(i-1+d[i-1]/(d[i-1]-d[i]));}
    return {f:(z.length-1)/((z[z.length-1]-z[0])/sr),db:10*Math.log10(e/(sr/2))};};
  const a=await run(1.08,true),b=await run(1.08,false),c=await run(1,false),ref=10*Math.log10(.125);
  const ok=Math.abs(a.f-f0)<1.5&&Math.abs(b.f-f0*1.08)<1.5&&Math.abs(c.f-f0)<.5&&Math.abs(a.db-ref)<1;
  return ok||('MT '+a.f.toFixed(1)+' Hz ('+(a.db-ref).toFixed(1)+' dB), sans MT '+b.f.toFixed(1)+' Hz, normal '+c.f.toFixed(1)+' Hz');"""),
 ('Moteur : la démo joue avec le son (niveau de tranche)',"""setBooth({p:[2],m:true});const d=await TT.fresh();playBtn(d);await TT.wait(900);const lv=MS.ch[d.ch-1].level;const e=d.engHas;d.pause();return e&&lv>-30||('moteur '+e+' niveau '+lv);"""),
 ('SOUND COLOR FX : CRUSH ne monte plus le volume (à fond à gauche ou à droite, ±3 dB)',"""const dry=TT.db(await TT.fx(null,.5,.5),1,3);const l=TT.db(await TT.fx('CRUSH',0,.5),1,3)-dry,r=TT.db(await TT.fx('CRUSH',.25,.5),1,3)-dry;return Math.abs(l)<3&&Math.abs(r)<3||('gauche '+l.toFixed(1)+' dB, 3/4 droite '+r.toFixed(1)+' dB');"""),
 ('SOUND COLOR FX : SWEEP à gauche resserre le son (coupe entre les coups)',"""const dry=TT.db(await TT.fx(null,.5,.5),1,3,true);const g=TT.db(await TT.fx('SWEEP',0,.5),1,3,true)-dry;return g<-8||('entre les coups '+g.toFixed(1)+' dB');"""),
 ('SOUND COLOR FX : NOISE filtre aussi la musique (aigus coupés à gauche, graves coupés à droite)',"""const hi=d=>{const x=new Float32Array(d.length);for(let i=1;i<d.length;i++)x[i]=d[i]-d[i-1];return TT.db(x,1,3);};const D=await TT.fx(null,.5,.5),L=await TT.fx('NOISE',0,0),R=await TT.fx('NOISE',1,0);
  const l=hi(L)-hi(D),r=TT.db(R,1,3)-TT.db(D,1,3);return l<-10&&r<-10||('aigus à gauche '+l.toFixed(1)+' dB, niveau à droite '+r.toFixed(1)+' dB');"""),
 ('SOUND COLOR FX : SPACE et DUB ECHO continuent après le fader baissé, pas le son direct',"""const s=TT.db(await TT.fx('SPACE',1,.5,1.5),1.65,2.4),e=TT.db(await TT.fx('DUB ECHO',1,.5,1.5),1.65,2.4),d=TT.db(await TT.fx(null,.5,.5,1.5),1.65,2.4);return s>-55&&e>-55&&d<-100||('SPACE '+s.toFixed(0)+' DUB ECHO '+e.toFixed(0)+' direct '+d.toFixed(0)+' dB');"""),
 ('Slip en pause (VINYL + SLIP) : le morceau continue en fond, PLAY/PAUSE reprend au point du fond',"""const d=await TT.fresh();const k=d.kTouch;d.vinyl=true;d.slip=true;d.kTouch=0;playBtn(d);await TT.wait(250);playBtn(d);await TT.wait(50);const p0=d.pos(),g0=d.ghost&&d.ghost.pos;await TT.wait(700);const p1=d.pos(),g1=d.ghost&&d.ghost.pos;playBtn(d);const p2=d.pos(),pl=d.playing;d.pause();d.slip=false;d.vinyl=false;d.kTouch=k;
  return !!g0&&TT.near(p0,p1,.01)&&g1-g0>.5&&pl&&TT.near(p2,g1,.08)||('arrêt '+p0+'→'+p1+' fond '+g0+'→'+g1+' reprise '+p2+' joue '+pl);"""),
 ('Slip annulé au chargement d’un morceau',"""const d=await TT.fresh();d.slip=true;await TT.fresh(d,1);return d.slip===false||'slip resté actif';"""),
 ('Mode CDJ : PLAY/PAUSE arrête net même avec TOUCH/BRAKE au maximum',"""const d=await TT.fresh();const k=d.kTouch;d.vinyl=false;d.kTouch=1;playBtn(d);await TT.wait(200);playBtn(d);const ok=!d.playing&&!d.braking;d.kTouch=k;d.pause();return ok||('joue '+d.playing+' frein '+d.braking);"""),
 ('Lecture inverse : le sens de la molette qui accélère est inversé',"""const d=await TT.fresh();d.dir=-1;jogTurn(d,{mode:'bend',t:now()-.02},20);const b=d.bend;d.dir=1;jogTurn(d,{mode:'bend',t:now()-.02},20);const f=d.bend;d.bend=1;return b<1&&f>1||('arrière '+b+' avant '+f);"""),
 ('BPM non détecté : 130 BPM',"""const d=await TT.fresh();const b=d.cur.beats,bp=d.cur.tr.bpm;d.cur.beats=[];d.cur.tr.bpm=0;const s=d.spb();d.cur.beats=b;d.cur.tr.bpm=bp;return TT.near(s,60/130,.001)||('spb '+s);"""),
 ('MEMORY : message sur l’écran de la platine, CUE/LOOPPOINT FULL au-delà de 10 points',"""const d=await TT.fresh();const m=d.cur.mem;d.cur.mem=[];d.seek(10);d.cue=10;addMemory(d);const a=d.lcdMsg&&d.lcdMsg.t;for(let i=0;i<9;i++)d.cur.mem.push({time:20+i,end:null});d.cue=40;addMemory(d);const b=d.lcdMsg&&d.lcdMsg.t,n=d.cur.mem.length;d.cur.mem=m;
  return a==='MEMORY'&&b==='CUE/LOOPPOINT FULL'&&n===10||(a+' / '+b+' / '+n);"""),
 ('Double-clic : MASTER LEVEL ne bouge pas',"""const m=MS.master=.7;const r=mixReset('master');const ok=MS.master===.7&&!r;MS.master=.5;mixApply();return ok||('master '+MS.master);"""),
]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required'])
    pg=await b.new_page(viewport={'width':1600,'height':1000})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    await pg.goto((ROOT/'index.html').as_uri());await pg.wait_for_timeout(1500)
    await pg.evaluate(JS_HELPERS)
    bad=0
    for name,js in SCEN:
      try:r=await pg.evaluate('(async()=>{'+js+'})()')
      except Exception as e:r='erreur : '+str(e).split('\n')[0]
      ok=r is True;bad+=0 if ok else 1
      print(('OK   ' if ok else 'ÉCHEC')+' '+name+('' if ok else '  →  '+str(r)))
    errs=list(dict.fromkeys(e.splitlines()[0] for e in errs))
    print('erreurs de page :',errs[:5] or 'aucune')
    await b.close()
    sys.exit(1 if bad or errs else 0)
asyncio.run(main())
