"""Tests de comportement : python tests/scenarios.py  (pip install playwright ; playwright install chromium)
Chaque scénario suit le mode d'emploi de la vraie machine. Ouvre index.html, joue la démo et vérifie l'état après chaque geste."""
import asyncio,pathlib,sys
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
sys.stdout.reconfigure(encoding='utf-8')
# Chaque scénario : (nom, code JS async qui renvoie true si c'est bon, ou un texte qui explique l'écart)
JS_HELPERS="""
window.TT={wait:ms=>new Promise(r=>setTimeout(r,ms)),near:(a,b,e)=>Math.abs(a-b)<=(e||.03),
  async fresh(d,i){d=d||D1;d.pause();await d.loadTrack(MEDIA[0].tracks[i||0],{list:MEDIA[0].tracks});return d;}};
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
