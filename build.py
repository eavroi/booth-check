"""Assemble le site en un seul fichier : python build.py  ->  index.html à la racine (GitHub Pages) et dist/booth-check.html (artifact Claude)."""
import re,os
R=lambda *p:open(os.path.join(B,*p),encoding='utf-8').read()
B=os.path.dirname(os.path.abspath(__file__));J=lambda *p:os.path.join(B,*p)
strip=lambda t:re.sub(r'^export ','',t,flags=re.M)
h=R('app','app.html')
h=h.replace('/*@FONTS*/',R('app','fonts.css'))
h=h.replace('/*@PDB*/',strip(R('lib','pdb.js'))).replace('/*@ANLZ*/',strip(R('lib','anlz.js')))
h=h.replace('/*@DEMO*/','const DEMO='+R('data','demo.json')+';')
order=['core.js','face_layout.js','cap_img.js','face_art.js','djm_art.js','lcd_kit.js','library.js','mixer.js','beatfx.js','deck.js','browse.js','lcd.js','controls.js','face_view.js','mixer_view.js','midi.js','midi_plan.js','report.js','ui.js','main.js']
h=h.replace('/*@APP*/','\n'.join(R('app',f) for f in order))
os.makedirs(J('dist'),exist_ok=True)
open(J('dist','booth-check.html'),'w',encoding='utf-8').write(h)
open(J('index.html'),'w',encoding='utf-8').write('<!doctype html>\n<html lang="fr">\n'+h.replace('<title>Booth Check</title>','<meta charset="utf-8"><title>Booth Check</title>',1)+'\n</html>\n')
print('ok',len(h))
