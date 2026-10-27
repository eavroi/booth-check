/* ---------------- page chrome: language, key status, shortcuts panel and keyboard map, booth-only mode ---------------- */
const I18N={
  views:['Vues','Views'],
  tabDeck:['Matériel','Gear'],
  tabRep:['Contrôle clé USB','USB check'],
  load:['Charger clé USB','Load USB'],
  size:['Taille','Size'],smaller:['Réduire','Smaller'],bigger:['Agrandir','Bigger'],fit:['Taille ajustée à la fenêtre','Fit to the window'],
  noKey:['Aucune clé USB chargée. Le contrôle se lance sur ta clé, pas sur l’exemple intégré.','No USB loaded. The check runs on your USB, not on the built-in demo.'],
  menu:['Menu','Menu'],gearPanel:['Le booth : platines, table, couleurs','The booth: players, mixer, colours'],tabRepShort:['Clé USB','USB'],
  zoom:['Agrandir l’écran de la platine','Enlarge the deck screen'],
  solo:['Booth seul, plein écran','Booth only, full screen'],
  keys:['Raccourcis clavier','Keyboard shortcuts'],
  planTitle:['Plan du contrôleur','Controller map'],planNote:['Survole une commande pour le détail. La commande que tu touches s’allume sur le plan. Ce que tu changes avec « Apprendre » s’affiche ici.','Hover a control for details. The control you touch lights up on the map. What you change with “Learn” shows here.'],
  ctlAria:['Contrôleur MIDI : modèle, correspondances, apprentissage','MIDI controller: template, mapping, learn'],
  face1:['Platine 1 : clique sur les boutons, tourne le jog et le sélecteur, touche l’écran','Player 1: click the buttons, turn the jog and the selector, touch the screen'],
  face2:['Platine 2 : clique sur les boutons, tourne le jog et le sélecteur, touche l’écran','Player 2: click the buttons, turn the jog and the selector, touch the screen'],
  face3:['Platine 3 : clique sur les boutons, tourne le jog et le sélecteur, touche l’écran','Player 3: click the buttons, turn the jog and the selector, touch the screen'],
  face4:['Platine 4 : clique sur les boutons, tourne le jog et le sélecteur, touche l’écran','Player 4: click the buttons, turn the jog and the selector, touch the screen'],
  zoomCv:['Écran agrandi','Enlarged screen'],
  hints:['molette : jog (backspin) / sélecteur / tempo','wheel: jog (backspin) / selector / tempo'],
  push:['Valider','Push'],
  close:['Fermer','Close'],
  copy:['Copier en texte','Copy as text'],
  rerun:['Relancer','Run again'],
  limits:['Limites de l’outil','Tool limits'],
  local:['Fichiers lus en local, rien n’est envoyé','Files are read locally, nothing is uploaded'],
  perso:['Projet personnel, non affilié','Personal project, not affiliated'],
  credits:['Crédits et licences','Credits and licences'],
  cred1:['Booth Check est un projet personnel et gratuit, ni affilié à Pioneer DJ / AlphaTheta ni approuvé par eux. Pioneer DJ, CDJ, DJM et rekordbox sont des marques d’AlphaTheta.','Booth Check is a free personal project, neither affiliated with nor endorsed by Pioneer DJ / AlphaTheta. Pioneer DJ, CDJ, DJM and rekordbox are trademarks of AlphaTheta.'],
  cred2:['La face de la platine est dérivée du projet libre « Pioneer CDJ & XDJ Emulator » (licence GPL-2.0-or-later), réutilisée sous la même licence, puis redessinée d’après des photos de la vraie platine. La table de mixage est dessinée d’après des photos et le mode d’emploi de la vraie table.','The deck face is derived from the free “Pioneer CDJ & XDJ Emulator” project (GPL-2.0-or-later licence), reused under the same licence, then redrawn from photos of the real deck. The mixer is drawn from photos and the manual of the real mixer.'],
  cred3:['Polices : Arimo, Fira Sans Condensed et Roboto (SIL Open Font License / Apache 2.0).','Fonts: Arimo, Fira Sans Condensed and Roboto (SIL Open Font License / Apache 2.0).'],
  keysTitle:['Raccourcis clavier','Keyboard shortcuts'],
  gestTitle:['Gestes de la platine','Deck gestures'],
  keysNote:['Les raccourcis agissent sur la platine active. Aucun ne demande Shift.','Shortcuts act on the active deck. None needs Shift.'],
  mapHint:['Déplace-le par sa barre de titre ; il reste ouvert pendant que tu joues.','Move it by its title bar; it stays open while you play.'],
  kbd:['Clavier','Keyboard'],
  mapLink:['Voir le plan du clavier','Show the keyboard map'],
  mapTitle:['Plan du clavier','Keyboard map'],
  mapNote:['Main gauche : loops, cues et lecture, comme le côté gauche de la platine. Main droite : les 4 touches de l’écran (rangée du haut) et les 4 touches autour du sélecteur (rangée du milieu), dans le même ordre que sur la platine.','Left hand: loops, cues and playback, like the left side of the deck. Right hand: the 4 screen keys (top row) and the 4 keys around the selector (middle row), in the same order as on the deck.'],
  drop:['Dépose le dossier de la clé','Drop the USB folder'],
  faceM:['Table de mixage : clique sur les touches, tourne les potards et glisse les faders','Mixer: click the keys, turn the knobs and slide the faders'],
  phTitle:['Sortie casque','Headphone output'],
  mapMove:['Déplacer le plan','Move the map'],
};
const tl=v=>Array.isArray(v)?v[LANG==='en'?1:0]:v;
function setLang(l){
  LANG=l==='en'?'en':'fr';try{localStorage.setItem('bc.lang',LANG);}catch(e){}
  document.documentElement.lang=LANG;
  for(const el of document.querySelectorAll('[data-i18n]')){const v=I18N[el.dataset.i18n];if(v)el.textContent=v[LANG==='en'?1:0];}
  for(const el of document.querySelectorAll('[data-i18n-aria]')){const v=I18N[el.dataset.i18nAria];if(v){el.setAttribute('aria-label',v[LANG==='en'?1:0]);if(el.tagName==='BUTTON')el.title=v[LANG==='en'?1:0];}}
  $('lFR').setAttribute('aria-pressed',LANG==='fr');$('lEN').setAttribute('aria-pressed',LANG==='en');
  renderInfo();buildKeys();if(typeof renderGear==='function')renderGear();if(typeof renderMidi==='function')renderMidi();if(typeof buildPlan==='function'&&!$('planPanel').hidden)buildPlan();if(!$('mapPanel').hidden)buildMap();if(typeof rerenderReport==='function')rerenderReport();
}
/* ---------- the key shown in the top bar ---------- */
let INFO=null;
function setInfo(i){INFO=i;renderInfo();}
function renderInfo(){
  const el=$('srcInfo');if(!el)return;const i=INFO;el.className='key';el.title='';
  if(!i){el.textContent=say('Chargement…','Loading…');return;}
  if(i.busy){el.textContent=say('Lecture de la clé…','Reading the USB…');return;}
  if(i.err){el.className='key bad';el.textContent=i.err==='nopdb'?say('PIONEER/rekordbox/export.pdb introuvable : choisis la racine de la clé (PIONEER et Contents).','PIONEER/rekordbox/export.pdb not found: pick the root of the USB (PIONEER and Contents).')
    :say('export.pdb illisible : ','export.pdb unreadable: ')+i.msg;return;}
  const n=i.tracks+' '+say('morceaux','tracks');
  el.textContent=(i.demo?say('Exemple intégré','Built-in demo'):i.name)+' · '+n+(i.keys>1?' · '+i.keys+' '+say('clés','USBs'):'');
  el.title=[i.playlists+' playlists',i.tags?i.tags+' My Tags':say('pas de My Tag','no My Tag'),
    i.audio!=null?i.audio+' '+say('fichiers audio','audio files'):say('audio non sélectionné (lecture simulée)','audio not selected (simulated playback)'),
    i.settings?say('My Settings de la clé appliqués','USB My Settings applied'):say('pas de My Settings (réglages d’usine)','no My Settings (factory settings)')].join(' · ');
}
/* ---------- keyboard: every function sits on a physical key (KeyboardEvent.code), so no layout ever needs Shift;
   only the printed labels change with the keyboard (QWERTY, AZERTY France, AZERTY Belgium) ---------- */
const KEYDEF=[
  ['Backquote','nextdeck','page'],['Digit1','hc1','hot'],['Digit2','hc2','hot'],['Digit3','hc3','hot'],['Digit4','hc4','hot'],['Digit5','hc5','hot'],['Digit6','hc6','hot'],['Digit7','hc7','hot'],['Digit8','hc8','hot'],
  ['Digit9','zoom','page'],['Digit0','solo','page'],['Minus','smaller','page'],['Equal','bigger','page'],['Backspace','back','scr'],
  ['KeyQ','loop_in','loop'],['KeyW','loop_out','loop'],['KeyE','reloop','loop'],['KeyR','four_beat','loop'],['KeyT','slip','loop'],['KeyY','quantize','page'],
  ['KeyU','browse','scr'],['KeyI','tag_list','scr'],['KeyO','info','scr'],['KeyP','menu','scr'],['Enter','push','scr'],
  ['KeyA','call_rev','cue'],['KeyS','call_fwd','cue'],['KeyD','memory','cue'],['KeyF','delete','cue'],['KeyG','hot_cue_call','hot'],
  ['KeyH','back','scr'],['KeyJ','tag_track','scr'],['KeyK','track_filter','scr'],['KeyL','short_cut','scr'],['Semicolon','jump_back','loop'],['Quote','jump_fwd','loop'],
  ['KeyZ','cue','play'],['KeyX','play','play'],['KeyC','sync','play'],['KeyV','master','play'],['KeyB','reverse','play'],['KeyN','slip_rev','play'],['KeyM','jog_mode','page'],['Slash','keys','page'],
  ['Space','play','play'],['Escape','back','scr'],['Home','track_rev','play'],['PageUp','track_fwd','play'],['End','scan_rev','play'],['PageDown','scan_fwd','play'],['Delete','delete','cue'],
  ['ArrowUp','sel_up','scr'],['ArrowDown','sel_down','scr'],['ArrowLeft','jog_back','play'],['ArrowRight','jog_fwd','play'],
  ['NumpadAdd','bigger','page'],['NumpadSubtract','smaller','page'],['NumpadEnter','push','scr'],
];
const KEYACT=Object.fromEntries(KEYDEF.map(k=>[k[0],k[1]]));
/* short names of the functions (keyboard map, panel) */
const ACT={nextdeck:['Platine suivante','Next deck'],zoom:['Écran agrandi','Enlarged screen'],solo:['Booth seul','Booth only'],smaller:['Taille −','Size −'],bigger:['Taille +','Size +'],
  back:'Back',loop_in:'Loop IN',loop_out:'Loop OUT',reloop:'Reloop / exit',four_beat:'4/8 beat · cutter',slip:'Slip',quantize:'Quantize',browse:'Browse',tag_list:'Tag list',info:'Info',menu:'Menu',
  push:['Valider','Push'],call_rev:'Call ◀ · 1/2X',call_fwd:'Call ▶ · 2X',memory:'Memory',delete:'Delete',hot_cue_call:'Hot cue call',tag_track:'Tag track',track_filter:'Track filter',short_cut:'Short cut',
  jump_back:'Beat jump −',jump_fwd:'Beat jump +',cue:'Cue',play:'Play / pause',sync:'Sync',master:'Master',reverse:'Reverse',slip_rev:'Slip reverse',
  jog_mode:'Jog mode',keys:['Raccourcis','Shortcuts'],track_rev:'Track search ◀',track_fwd:'Track search ▶',scan_rev:'Search ◀◀',scan_fwd:'Search ▶▶',
  sel_up:['Sélecteur ↑','Selector ↑'],sel_down:['Sélecteur ↓','Selector ↓'],jog_back:'Jog −',jog_fwd:'Jog +'};
for(let i=1;i<=8;i++)ACT['hc'+i]='Hot cue '+'ABCDEFGH'[i-1];
const KB_LET={KeyQ:'Q',KeyW:'W',KeyE:'E',KeyR:'R',KeyT:'T',KeyY:'Y',KeyU:'U',KeyI:'I',KeyO:'O',KeyP:'P',KeyA:'A',KeyS:'S',KeyD:'D',KeyF:'F',KeyG:'G',KeyH:'H',KeyJ:'J',KeyK:'K',KeyL:'L',KeyZ:'Z',KeyX:'X',KeyC:'C',KeyV:'V',KeyB:'B',KeyN:'N',KeyM:'M'};
const KB_AZ={KeyQ:'A',KeyW:'Z',KeyA:'Q',KeyZ:'W',KeyM:',',Semicolon:'M',Quote:'ù',BracketLeft:'^',BracketRight:'$',Backslash:'µ',IntlBackslash:'<',Comma:';',Period:':',Backquote:'²',Digit9:'ç',Digit0:'à'};
const KBL={
  qwerty:{name:'QWERTY',map:Object.assign({},KB_LET,{Backquote:'`',Digit1:'1',Digit2:'2',Digit3:'3',Digit4:'4',Digit5:'5',Digit6:'6',Digit7:'7',Digit8:'8',Digit9:'9',Digit0:'0',Minus:'-',Equal:'=',
    BracketLeft:'[',BracketRight:']',Backslash:'\\',Semicolon:';',Quote:"'",IntlBackslash:'\\',Comma:',',Period:'.',Slash:'/'})},
  azfr:{name:'AZERTY FR',map:Object.assign({},KB_LET,KB_AZ,{Digit1:'&',Digit2:'é',Digit3:'"',Digit4:"'",Digit5:'(',Digit6:'-',Digit7:'è',Digit8:'_',Minus:')',Equal:'=',Backslash:'*',Slash:'!'})},
  azbe:{name:'AZERTY BE',map:Object.assign({},KB_LET,KB_AZ,{Digit1:'&',Digit2:'é',Digit3:'"',Digit4:"'",Digit5:'(',Digit6:'§',Digit7:'è',Digit8:'!',Minus:')',Equal:'-',Slash:'='})},
};
const KB_NAMES={Space:['Espace','Space'],Enter:['Entrée','Enter'],Backspace:['⌫','⌫'],Escape:['Échap','Esc'],Home:['Début','Home'],End:['Fin','End'],PageUp:['Pg ↑','Pg ↑'],PageDown:['Pg ↓','Pg ↓'],
  Delete:['Suppr','Del'],Insert:['Inser','Ins'],ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Tab:'Tab',CapsLock:['Verr. maj','Caps'],ShiftLeft:'⇧',ShiftRight:'⇧',ControlLeft:'Ctrl',ControlRight:'Ctrl',AltLeft:'Alt',AltRight:'AltGr',MetaLeft:'',ContextMenu:'',
  NumpadAdd:'num +',NumpadSubtract:'num −',NumpadEnter:'num ↵'};
let KBD='azbe',KBD_USER=false;
const kl=c=>KB_NAMES[c]!=null?tl(KB_NAMES[c]):(KBL[KBD].map[c]||c);
function setKbd(k,user){if(!KBL[k])return;KBD=k;if(user){KBD_USER=true;try{localStorage.setItem('bc.kbd',k);}catch(e){}}buildKeys();if(!$('mapPanel').hidden)buildMap();}
/* Chrome / Edge can tell which keyboard is used (HTTPS pages only); elsewhere the manual choice, AZERTY Belgium by default */
async function detectKbd(){
  try{const s=localStorage.getItem('bc.kbd');if(s&&KBL[s]){KBD=s;KBD_USER=true;return;}}catch(e){}
  try{if(navigator.keyboard&&navigator.keyboard.getLayoutMap){const m=await navigator.keyboard.getLayoutMap();const q=(m.get('KeyQ')||'').toLowerCase(),six=m.get('Digit6');
    if(q==='a')KBD=six==='§'?'azbe':(six==='-'?'azfr':'azbe');else if(q==='q')KBD='qwerty';}}catch(e){}
}
/* ---------- shortcuts panel ---------- */
function buildKeys(){
  const K=(...codes)=>codes.map(kl).join(' · ');
  const G=[
    [['Lecture','Playback'],[[K('Space')+' · '+kl('KeyX'),'Play / pause'],[K('KeyZ'),'Cue'],[K('ArrowLeft','ArrowRight'),['Jog − / +','Jog − / +']],[K('KeyB'),'Reverse'],[K('KeyN'),['Slip reverse (maintenu)','Slip reverse (hold)']],[K('KeyC','KeyV'),'Sync · Master']]],
    [['Loop','Loop'],[[K('KeyQ','KeyW','KeyE'),'In · Out · Reloop / exit'],[K('KeyR'),'4 / 8 beat · loop cutter'],[K('KeyT'),'Slip'],[K('KeyA','KeyS'),['Loop 1/2X · 2X (boucle en lecture)','Loop 1/2X · 2X (loop playing)']],[K('Semicolon','Quote'),'Beat jump − / +']]],
    [['Hot cue et memory','Hot cue and memory'],[[kl('Digit1')+' … '+kl('Digit8'),'Hot cue A … H'],[K('KeyG'),'Hot cue call / delete'],[K('KeyA','KeyS'),['Call ◀ ▶ (memory)','Call ◀ ▶ (memory)']],[K('KeyD','KeyF'),'Memory · Delete']]],
    [['Écran','Screen'],[[K('ArrowUp','ArrowDown'),['Sélecteur','Selector']],[K('Enter'),['Valider','Push']],[K('KeyU','KeyI','KeyO','KeyP'),'Browse · Tag list · Info · Menu'],[K('KeyH','KeyJ','KeyK','KeyL'),'Back · Tag track · Filter · Short cut'],[K('Escape','Backspace'),'Back']]],
    [['Search','Search'],[[K('Home','PageUp'),'Track search ◀ ▶'],[K('End','PageDown'),'Search ◀◀ ▶▶']]],
    [['Page','Page'],[[K('Backquote'),['Platine active suivante','Next active deck']],[K('Digit9','Digit0'),['Écran agrandi · Booth seul','Enlarged screen · Booth only']],[K('Minus','Equal'),['Taille − / +','Size − / +']],[K('KeyY'),'Quantize'],[K('KeyM'),'Jog mode'],[K('Slash'),['Ce panneau','This panel']]]],
  ];
  $('kGrid').innerHTML=G.map(([t,rows])=>'<section><h3>'+esc(tl(t))+'</h3>'+rows.map(r=>'<div class="krow"><span>'+esc(tl(r[1]))+'</span><kbd>'+esc(r[0])+'</kbd></div>').join('')+'</section>').join('');
  for(const b of document.querySelectorAll('.kbdseg button'))b.setAttribute('aria-pressed',b.dataset.k===KBD);
  const gest=LANG==='en'?[
    'BROWSE opens the USB, a second press goes back to playback. Hold BROWSE = SEARCH, hold MENU = UTILITY.',
    'TRACK FILTER short = filter ON/OFF, held = EDIT.',
    'In a list: INFO = white details panel, MENU = SORT, TAG TRACK = add to TAG LIST.',
    'Mouse wheel on the jog: up = backspin. On the selector: turn. On the tempo slider: move.',
    'Selector held: jump by letter in a list, GRID ADJUST on the playback screen.',
    'Several USBs: load them one after another, they show at the root of BROWSE.',
    'Mixer: drag the knobs and faders (wheel for fine steps). Click the PHONES socket to choose the headphone output.']:[
    'BROWSE ouvre la clé, un 2ᵉ appui revient à la lecture. Maintenir BROWSE = SEARCH, maintenir MENU = UTILITY.',
    'TRACK FILTER court = filtre ON/OFF, maintenu = EDIT.',
    'Dans une liste : INFO = panneau blanc de détails, MENU = SORT, TAG TRACK = ajoute à la TAG LIST.',
    'Molette sur le jog : vers le haut = backspin. Sur le sélecteur : tourner. Sur le curseur tempo : déplacer.',
    'Sélecteur maintenu : saut par lettre dans une liste, GRID ADJUST sur l’écran de lecture.',
    'Plusieurs clés : charge-les l’une après l’autre, elles apparaissent à la racine de BROWSE.',
    'Table : glisse les potards et les faders (molette pour régler finement). Clic sur la prise PHONES pour choisir la sortie casque.'];
  $('kGest').innerHTML=gest.map(g=>'<li>'+esc(g)+'</li>').join('');
}
/* ---------- keyboard map window ---------- */
function buildMap(){
  const fn=c=>{const a=KEYACT[c];if(!a)return null;const d=KEYDEF.find(k=>k[0]===c);return {t:tl(ACT[a]),g:d[2]};};
  const key=(c,w,lab)=>{const f=fn(c);const L=lab!=null?lab:kl(c);return '<div class="mk'+(f?' g-'+f.g:' off')+'" style="--w:'+(w||1)+'"><b>'+esc(L)+'</b>'+(f?'<span>'+esc(f.t)+'</span>':'')+'</div>';};
  const row=a=>'<div class="mrow">'+a.join('')+'</div>';
  const rows=[
    row([key('Backquote'),...[1,2,3,4,5,6,7,8,9,0].map(n=>key('Digit'+n)),key('Minus'),key('Equal'),key('Backspace',2)]),
    row([key('Tab',1.5),...['Q','W','E','R','T','Y','U','I','O','P'].map(l=>key('Key'+l)),key('BracketLeft'),key('BracketRight'),key('Enter',1.5)]),
    row([key('CapsLock',1.75),...['A','S','D','F','G','H','J','K','L'].map(l=>key('Key'+l)),key('Semicolon'),key('Quote'),key('Backslash'),key('',1.25,'')]),
    row([key('ShiftLeft',1.25),key('IntlBackslash'),...['Z','X','C','V','B','N','M'].map(l=>key('Key'+l)),key('Comma'),key('Period'),key('Slash'),key('ShiftRight',2.75)]),
    row([key('ControlLeft',1.5),key('MetaLeft',1.25),key('AltLeft',1.25),key('Space',6.25).replace('class="mk','class="mk grow'),key('AltRight',1.25),key('ContextMenu',1.25),key('ControlRight',1.5)]),
  ];
  const side=[row([key('Insert'),key('Home'),key('PageUp')]),row([key('Delete'),key('End'),key('PageDown')]),row([key('',1,''),key('ArrowUp'),key('',1,'')]),row([key('ArrowLeft'),key('ArrowDown'),key('ArrowRight')])];
  $('mapKeys').innerHTML='<div class="mblock">'+rows.join('')+'</div><div class="mblock mside">'+side.join('')+'</div>';
  $('mapKbd').textContent=KBL[KBD].name;
  const LEG=[['hot','Hot cues','Hot cues'],['loop','Loop et beat jump','Loop and beat jump'],['cue','Call, memory, delete','Call, memory, delete'],['play','Lecture, jog, sync','Playback, jog, sync'],['scr','Écran et navigation','Screen and navigation'],['page','Page (taille, plein écran…)','Page (size, full screen…)']];
  $('mapLeg').innerHTML=LEG.map(l=>'<span class="g-'+l[0]+'"><i></i>'+esc(LANG==='en'?l[2]:l[1])+'</span>').join('');
}
/* a floating window resized by its corner grip, between a smallest and a largest width; the width is kept */
function sizeWin(id,key,def,min,max,apply){
  const p=$(id),g=p.querySelector('.fw-grip');let w=def;try{w=+localStorage.getItem(key)||def;}catch(e){}
  /* w is the width asked for; a narrow window only shows it smaller, without forgetting it */
  const show=()=>{const v=clamp(w,min,Math.max(min,Math.min(max,window.innerWidth-16)));p.style.width=v+'px';if(apply)apply(v);return v;};
  const set=v=>{w=clamp(v,min,max);show();};show();
  let st=null;
  g.addEventListener('pointerdown',e=>{st={x:e.clientX,w:show()};g.setPointerCapture(e.pointerId);e.preventDefault();e.stopPropagation();});
  g.addEventListener('pointermove',e=>{if(st)set(st.w+e.clientX-st.x);});
  const up=()=>{if(!st)return;st=null;try{localStorage.setItem(key,String(Math.round(w)));}catch(_){}};
  g.addEventListener('pointerup',up);g.addEventListener('pointercancel',up);
  window.addEventListener('resize',show);
}
/* the keyboard map floats over the booth: it can be moved by its title bar and stays open while playing */
function showMap(on){const p=$('mapPanel');if(on===!p.hidden)return;p.hidden=!on;if(on){buildMap();placeMap();}}
function placeMap(x,y){const p=$('mapPanel');let pos=null;try{pos=JSON.parse(localStorage.getItem('bc.mapPos')||'null');}catch(e){}
  if(x==null){if(pos){x=pos[0];y=pos[1];}else{x=(window.innerWidth-p.offsetWidth)/2;y=window.innerHeight-p.offsetHeight-24;}}
  x=clamp(x,8-p.offsetWidth+120,window.innerWidth-120);y=clamp(y,8,window.innerHeight-48);p.style.left=x+'px';p.style.top=y+'px';return [x,y];}
function wireMapDrag(){const h=$('mapHead');let st=null;
  h.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const p=$('mapPanel'),r=p.getBoundingClientRect();st={dx:e.clientX-r.left,dy:e.clientY-r.top};h.setPointerCapture(e.pointerId);e.preventDefault();});
  h.addEventListener('pointermove',e=>{if(!st)return;placeMap(e.clientX-st.dx,e.clientY-st.dy);});
  const up=e=>{if(!st)return;st=null;const p=$('mapPanel');try{localStorage.setItem('bc.mapPos',JSON.stringify([parseFloat(p.style.left),parseFloat(p.style.top)]));}catch(_){}};
  h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);
  window.addEventListener('resize',()=>{if(!$('mapPanel').hidden){const p=$('mapPanel');placeMap(parseFloat(p.style.left),parseFloat(p.style.top));}});}
/* the shortcuts panel stays docked on the right while playing */
function showKeys(on){
  const p=$('keysPanel');if(on===undefined)on=p.hidden;
  p.hidden=!on;document.body.classList.toggle('keys',on);$('bKeys').setAttribute('aria-pressed',on);
  try{localStorage.setItem('bc.keys',on?'1':'0');}catch(e){}
}
/* credits: a small bubble above the footer link, no overlay; a click anywhere else closes it */
function showCredits(on){const p=$('credPanel');if(on===undefined)on=p.hidden;p.hidden=!on;$('bCredits').setAttribute('aria-expanded',on);}
/* deck size: fitted to the window (100 %), then − / + in steps of 10 % */
let SCALE=1;
function setScale(v){
  SCALE=Math.round(clamp(v,.5,2.5)*10)/10;document.documentElement.style.setProperty('--sc',SCALE);
  $('bPct').textContent=Math.round(SCALE*100)+' %';try{localStorage.setItem('bc.scale',String(SCALE));}catch(e){}
}
/* ---------- booth only: the decks alone, full screen ---------- */
function setSolo(on){
  if(on===undefined)on=!document.body.classList.contains('solo');
  if(on){if(typeof zoom==='function')zoom(false);if(typeof tab==='function')tab('deck');showCredits(false);showMap(false);}
  document.body.classList.toggle('solo',on);$('bSolo').setAttribute('aria-pressed',on);
  const fs=document.fullscreenElement||document.webkitFullscreenElement,de=document.documentElement;
  try{if(on&&!fs){const r=(de.requestFullscreen||de.webkitRequestFullscreen);if(r){const pr=r.call(de);if(pr&&pr.catch)pr.catch(()=>{});}}
    else if(!on&&fs){const x=(document.exitFullscreen||document.webkitExitFullscreen);if(x){const pr=x.call(document);if(pr&&pr.catch)pr.catch(()=>{});}}}catch(e){}
  requestAnimationFrame(()=>{for(const F of FACES){F.ready=false;if(!F.cv.closest('[hidden]'))faceResize(F);}MXF.ready=false;mixResize();});
}
function wireChrome(){
  $('lFR').onclick=()=>setLang('fr');$('lEN').onclick=()=>setLang('en');
  $('bKeys').onclick=()=>showKeys();$('kClose').onclick=()=>showKeys(false);
  $('kMap').onclick=()=>showMap(true);$('mClose').onclick=()=>showMap(false);
  wireMapDrag();
  /* the keyboard map is drawn for 1000 px: smaller or larger, everything in it follows */
  sizeWin('mapPanel','bc.mapW',1000,560,1500,w=>{const z=w/1000;for(const id of ['mapKeys','mapLeg'])$(id).style.zoom=z;});
  $('phClose').onclick=()=>closePhones();
  document.addEventListener('pointerdown',e=>{if(!$('phMenu').hidden&&!e.target.closest('#phMenu')&&!e.target.closest('#faceM'))closePhones();});
  for(const id of ['kbdSeg','mapSeg'])$(id).addEventListener('click',e=>{const b=e.target.closest('button');if(b)setKbd(b.dataset.k,true);});
  $('bCredits').onclick=e=>{e.stopPropagation();showCredits();};$('cClose').onclick=()=>showCredits(false);
  document.addEventListener('pointerdown',e=>{if(!$('credPanel').hidden&&!e.target.closest('#credPanel')&&!e.target.closest('#bCredits'))showCredits(false);});
  $('bMinus').onclick=()=>setScale(SCALE-.1);$('bPlus').onclick=()=>setScale(SCALE+.1);$('bPct').onclick=()=>setScale(1);
  let sc=1,ko=false;try{sc=parseFloat(localStorage.getItem('bc.scale'))||1;ko=localStorage.getItem('bc.keys')==='1';}catch(e){}
  setScale(sc);if(ko)showKeys(true);
  $('bSolo').onclick=()=>setSolo(true);
  const fsc=()=>{if(!(document.fullscreenElement||document.webkitFullscreenElement)&&document.body.classList.contains('solo'))setSolo(false);};
  document.addEventListener('fullscreenchange',fsc);document.addEventListener('webkitfullscreenchange',fsc);
  setLang(LANG);
  detectKbd().then(()=>{buildKeys();});
}
