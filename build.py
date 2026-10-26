"""Assemble le site en un seul fichier : python3 build.py  ->  index.html à la racine (GitHub Pages) et dist/booth-check.html (artifact Claude)."""
import re,os
B=os.path.dirname(os.path.abspath(__file__));J=lambda *p:os.path.join(B,*p)
strip=lambda t:re.sub(r'^export ','',t,flags=re.M)
h=open(J('app','app.html')).read()
h=h.replace('/*@FONTS*/',open(J('app','fonts.css')).read())
h=h.replace('/*@PDB*/',strip(open(J('lib','pdb.js')).read())).replace('/*@ANLZ*/',strip(open(J('lib','anlz.js')).read()))
h=h.replace('/*@DEMO*/','const DEMO='+open(J('data','demo.json')).read()+';')
order=['core.js','face_layout.js','cap_img.js','face_art.js','djm_art.js','lcd_kit.js','library.js','mixer.js','deck.js','browse.js','lcd.js','controls.js','face_view.js','mixer_view.js','report.js','ui.js','main.js']
h=h.replace('/*@APP*/','\n'.join(open(J('app',f)).read() for f in order))
os.makedirs(J('dist'),exist_ok=True)
open(J('dist','booth-check.html'),'w').write(h)
open(J('index.html'),'w').write('<!doctype html>\n<html lang="fr">\n'+h.replace('<title>Booth Check</title>','<meta charset="utf-8"><title>Booth Check</title>',1)+'\n</html>\n')
print('ok',len(h))
