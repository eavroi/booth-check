"""Test rapide : python tests/smoke.py  (pip install playwright ; playwright install chromium)
Ouvre index.html, vérifie qu'il n'y a pas d'erreur, joue la démo et fait des captures dans tests/out/."""
import asyncio,os,pathlib
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent;OUT=ROOT/'tests'/'out';OUT.mkdir(exist_ok=True)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required'])
    pg=await b.new_page(viewport={'width':1600,'height':1000})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    await pg.goto((ROOT/'index.html').as_uri());await pg.wait_for_timeout(1800)
    print('première visite',await pg.evaluate("({platines:BOOTH.p.join(),table:MS.on})"))
    await pg.screenshot(path=str(OUT/'booth1.png'))
    r=await pg.evaluate("""(async()=>{setBooth({p:[2,3],m:true});const M=MEDIA[0];await D1.loadTrack(M.tracks[0],{list:M.tracks});D1.play();await new Promise(r=>setTimeout(r,1500));
      return {player:D1.pn,mixer:MS.on,level:Math.round(MS.ch[D1.ch-1].level),master:Math.round(MS.mL),bpm:MS.bpm}})()""")
    print('lecture',r)
    for name,js in (('booth2',"setBooth({p:[2,3],m:true})"),('booth4',"setBooth({p:[1,2,3,4],m:true})")):
      await pg.evaluate(js);await pg.wait_for_timeout(700);await pg.screenshot(path=str(OUT/f'{name}.png'))
    print('erreurs',errs or 'aucune');await b.close()
asyncio.run(main())
