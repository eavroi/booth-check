"""Fichier son du kit de test de la vraie DJM-900NXS2 : python tests/kit_djm.py DOSSIER
Écrit DOSSIER/booth-check-test-djm.wav (44,1 kHz, 16 bits, stéréo, 20 min) : un « passage » de 12 s répété 100 fois
(57 passages SOUND COLOR FX + 38 passages BEAT FX depuis la V2.9, avec une marge ; la fiche est dans BOOTH CHECK/V2.9/kit-test-DJM/).
Un passage, à 120 BPM (6 mesures) :
  0 s     un clic (une seule impulsion) puis 3 s de silence : temps d'écho et de retard, longueur de la réverbération, réponse des filtres ;
  3-4,5 s du bruit blanc puis 1,5 s de silence : forme des filtres et du bruit de NOISE ;
  6-12 s  une boucle de batterie (grosse caisse, caisse claire, charleston, basse, accords) : son musical, porte de SWEEP.
Le clic marque le début de chaque passage : il sert à retrouver les passages dans l'enregistrement."""
import math,os,random,struct,sys,wave
SR=44100;PASS=12;N=SR*PASS;REPEAT=100
def passage():
  x=[0.0]*N;x[0]=.95
  rnd=random.Random(1)
  a,b=int(3*SR),int(4.5*SR);f=int(.005*SR)
  for i in range(a,b):
    g=min(1,(i-a)/f,(b-1-i)/f);x[i]=(rnd.random()*2-1)*.43*g          # bruit blanc à -12 dBFS RMS
  hl=sn=0.0;s0=int(6*SR)
  for i in range(s0,N):
    t=(i-s0)/SR;bt=t%.5;beat=int(t/.5);e=t%.25;nz=rnd.random()*2-1
    v=math.sin(2*math.pi*(45+120*math.exp(-bt*35))*bt)*math.exp(-bt*9)*.7
    hl+=.9*(nz-hl);v+=(nz-hl)*math.exp(-e*60)*.25
    if beat%2:sn+=.4*(nz-sn);v+=(sn*.6+math.sin(2*math.pi*190*bt)*.3)*math.exp(-bt*18)*.6
    v+=((t*[110,82.4,98,73.4][(beat//4)%4])%1*2-1)*.18
    if bt>.25:
      c=0.0
      for fr in (261.6,329.6,392):
        for h in range(1,8):c+=math.sin(2*math.pi*fr*h*t)/h
      v+=c*.05*math.exp(-(bt-.25)*6)
    x[i]=v*.6
  return x
def main(out):
  os.makedirs(out,exist_ok=True)
  frames=b''.join(struct.pack('<hh',s,s) for s in (max(-32767,min(32767,int(round(v*32767)))) for v in passage()))
  p=os.path.join(out,'booth-check-test-djm.wav')
  with wave.open(p,'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
    for _ in range(REPEAT):w.writeframes(frames)
  print(p,os.path.getsize(p)//1_000_000,'Mo')
if __name__=='__main__':main(sys.argv[1] if len(sys.argv)>1 else '.')
