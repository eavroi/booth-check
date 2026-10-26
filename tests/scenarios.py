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
  cc(n,v){midiMsg({data:[0xB0,n,v]});},press(n){this.cc(n,127);this.cc(n,0);}};
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
 ('Steel : Controls 1 (Deck A) tourne le COLOR de la tranche gauche',"""setBooth({p:[2],m:true});TT.steel();const ch=MS.ch[1];ch.color=.5;for(let i=0;i<8;i++)TT.cc(0x41,1);const c=ch.color;ch.color=.5;mixApply();return c>.6||('color '+c);"""),
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
 ('Steel : Stop + ▲ = BROWSE, Stop + ▼ = TAG LIST',"""setBooth({p:[2],m:false});TT.steel();const d=await TT.fresh();goScr(d,'play');TT.cc(0x0D,127);TT.press(0x2A);const a=d.ui.scr;TT.press(0x2B);const b=d.ui.scr;TT.cc(0x0D,0);goScr(d,'play');return a==='browse'&&b==='taglist'||(a+' / '+b);"""),
 ('Steel : Stop + Kill = choix du SOUND COLOR FX',"""setBooth({p:[2],m:true});TT.steel();MS.color=null;TT.cc(0x0D,127);TT.press(0x0E);const a=MS.color;TT.cc(0x0D,0);TT.cc(0x25,127);TT.press(0x28);const b=MS.color;TT.press(0x28);const c=MS.color;TT.cc(0x25,0);return a==='SPACE'&&b==='FILTER'&&c===null||(a+' / '+b+' / '+c);"""),
 ('Steel : toucher le côté droit rend sa platine active',"""setBooth({p:[2,3],m:false});TT.steel();ACTIVE=DECKS[0];TT.press(0x24);const ok=ACTIVE===DECKS[1];setBooth({p:[2],m:false});return ok||('active '+ACTIVE.ch);"""),
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
