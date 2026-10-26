/* ---------------- page wiring and main loop ---------------- */
const D1=new Deck(1);ACTIVE=D1;
const DK=[D1,null,null,null];
const ZOOM={on:false,cv:null};
/* 1 to 4 decks in one row, like a booth; a phone keeps at most 2 */
const PHONE=window.matchMedia('(max-width:900px)');
let NDECK=1;
function setDecks(n){
  n=clamp(n|0,1,PHONE.matches?2:4);NDECK=n;
  document.body.dataset.n=n;document.body.classList.toggle('two',n>1);
  for(let i=1;i<=4;i++)$('bN'+i).setAttribute('aria-pressed',i===n);
  for(let i=2;i<=4;i++){const on=i<=n;$('wrap'+i).hidden=!on;let d=DK[i-1];
    if(on){if(!d){d=DK[i-1]=new Deck(i);new Face($('face'+i),d);new ResizeObserver(()=>faceResize(d.face)).observe($('face'+i));d.applySettings();}
      else if(!DECKS.includes(d)){DECKS.push(d);BUS.add(d);}}
    else if(d&&DECKS.includes(d)){d.pause();d.eject();DECKS.splice(DECKS.indexOf(d),1);const j=BUS.decks.indexOf(d);if(j>=0)BUS.decks.splice(j,1);if(BUS.master===d)BUS.setMaster(null);if(ACTIVE===d)ACTIVE=D1;}}
  DECKS.sort((a,b)=>a.n-b.n);BUS.decks.sort((a,b)=>a.n-b.n);for(const d of DECKS)d.dirty=true;
  try{localStorage.setItem('bc.decks',String(n));}catch(e){}
  layoutBooth();
}
/* the booth row, left to right: channel 1, channel 2, the mixer, channel 3, channel 4 (deck 1 is on channel 2, deck 2 on 3, deck 3 on 1, deck 4 on 4) */
function layoutBooth(){
  for(let n=1;n<=4;n++)$('wrap'+n).style.order=CH_OF[n-1]*10;$('wrapM').style.order=25;
  const items=[...document.querySelectorAll('.decks>.deckwrap')].filter(w=>!w.hidden).sort((a,b)=>(+a.style.order)-(+b.style.order));
  for(const w of document.querySelectorAll('.decks>.deckwrap'))w.classList.remove('first','last');
  if(items.length){items[0].classList.add('first');items[items.length-1].classList.add('last');}
  const b=document.body.style;b.setProperty('--units',String(NDECK+(MS.on?DM_W/2208*961.6/924:0)));b.setProperty('--items',String(items.length));
  document.body.classList.toggle('mix',MS.on);
  for(const F of FACES){F.ready=false;}MXF.ready=false;
  requestAnimationFrame(()=>{for(const F of FACES)if(!F.cv.closest('[hidden]'))faceResize(F);if(MS.on)mixResize();});
}
/* the mixer is shown (and in the sound path) by default on a computer, hidden on a phone; hidden, the players go straight out */
const mixKey=()=>PHONE.matches?'bc.mixerP':'bc.mixer';
function setMixer(on){
  if(on===undefined)on=!MS.on;MS.on=on;$('wrapM').hidden=!on;$('bMix').setAttribute('aria-pressed',on);mixApply();
  try{localStorage.setItem(mixKey(),on?'1':'0');}catch(e){}
  if(!on)closePhones();layoutBooth();
}
function nextDeck(){const L=DECKS.slice().sort((a,b)=>a.ch-b.ch),i=L.indexOf(ACTIVE);ACTIVE=L[(i+1)%L.length];for(const d of DECKS)d.dirty=true;
  const w=$('wrap'+ACTIVE.n);if(w&&w.scrollIntoView)w.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});}
function tab(n){$('deck').hidden=n!=='deck';$('report').hidden=n!=='report';$('tabDeck').setAttribute('aria-selected',n==='deck');$('tabRep').setAttribute('aria-selected',n==='report');if(n==='report')zoom(false);}
function zoom(v){ZOOM.on=v;document.body.classList.toggle('zoom',v);$('bZoom').setAttribute('aria-pressed',v);}
async function useEntries(list,isDemo){
  const ok=await loadUsb(list,isDemo,setInfo);if(!ok)return;
  for(const d of DECKS)d.dirty=true;
  if(!isDemo&&SET.hcColor===0)toast(say('HOT CUE COLOR est sur OFF sur ta clé : pads verts/orange. Passe-le à ON dans UTILITY pour voir tes couleurs.','HOT CUE COLOR is OFF on your USB: green/orange pads. Set it ON in UTILITY to see your colours.'),7000);
  if(!isDemo)runScan();else showReportEmpty();
}
function page(){
  wireChrome();wireReport();
  new Face($('face1'),D1);ZOOM.cv=$('lcdZoom');MXF.cv=$('faceM');wireMixer();$('bMix').onclick=()=>setMixer();
  $('tabDeck').onclick=()=>tab('deck');$('tabRep').onclick=()=>tab('report');
  for(let i=1;i<=4;i++)$('bN'+i).onclick=()=>setDecks(i);
  PHONE.addEventListener&&PHONE.addEventListener('change',()=>{if(NDECK>2)setDecks(2);});
  {let m=null;try{m=localStorage.getItem(mixKey());}catch(e){}MS.on=m==null?!PHONE.matches:m==='1';$('wrapM').hidden=!MS.on;$('bMix').setAttribute('aria-pressed',MS.on);}
  $('bLoad').onclick=()=>$('pick').click();
  $('bZoom').onclick=()=>{tab('deck');zoom(!ZOOM.on);};
  $('pick').onchange=e=>{const l=[...e.target.files].map(f=>({file:f,path:f.webkitRelativePath||f.name}));e.target.value='';setInfo({busy:true});useEntries(l,false);};
  new ResizeObserver(()=>faceResize(D1.face)).observe($('face1'));
  wireZoom();wireKeys();
  /* drag and drop of the USB root folder */
  let dc=0;
  window.addEventListener('dragenter',e=>{e.preventDefault();dc++;$('drop').classList.add('on');});
  window.addEventListener('dragleave',()=>{dc=Math.max(0,dc-1);if(!dc)$('drop').classList.remove('on');});
  window.addEventListener('dragover',e=>e.preventDefault());
  window.addEventListener('drop',async e=>{e.preventDefault();dc=0;$('drop').classList.remove('on');
    const items=[...(e.dataTransfer.items||[])].map(i=>i.webkitGetAsEntry&&i.webkitGetAsEntry()).filter(Boolean);if(!items.length)return;
    setInfo({busy:true});const out=[];for(const en of items)await walk(en,out);useEntries(out,false);});
  async function walk(en,out){
    if(en.isFile){await new Promise(r=>en.file(f=>{out.push({file:f,path:en.fullPath.replace(/^\//,'')});r();},r));}
    else{const rd=en.createReader();let b;do{b=await new Promise((res,rej)=>rd.readEntries(res,rej));for(const c of b)await walk(c,out);}while(b.length);}
  }
  faceResize(D1.face);
  {let n=1;try{n=parseInt(localStorage.getItem('bc.decks'))||1;}catch(e){}if(n>1)setDecks(n);else{document.body.dataset.n=1;layoutBooth();}}
  /* the printed texts use the embedded fonts: redraw the faces once they are ready */
  if(document.fonts)Promise.all([document.fonts.load('400 10px "Fira Sans Condensed"'),document.fonts.load('400 10px Arimo'),document.fonts.load('700 10px Arimo')]).then(()=>{for(const F of FACES){F.ready=false;faceResize(F);}MXF.ready=false;mixResize();}).catch(()=>{});
  useEntries(demoEntries(),true).then(()=>requestAnimationFrame(tick));
}
/* the enlarged screen: same pages, same touch handling */
function wireZoom(){
  const cv=ZOOM.cv;const map=e=>{const r=cv.getBoundingClientRect();const [x0,y0,x1,y1]=F_LCD;return {x:x0+(e.clientX-r.left)/r.width*(x1-x0),y:y0+(e.clientY-r.top)/r.height*(y1-y0)};};
  let st=null;
  cv.addEventListener('pointerdown',e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId);}catch(_){}st={tg:{t:'lcd'}};lcdDown(ACTIVE,st,map(e));});
  cv.addEventListener('pointermove',e=>{if(st)lcdMove(ACTIVE,st,map(e));});
  const up=()=>{if(st){lcdUp(ACTIVE,st);st=null;}};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{e.preventDefault();rotaryTurn(ACTIVE,Math.sign(e.deltaY));},{passive:false});
  $('zbar').addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();const z=b.dataset.z,d=ACTIVE;
    if(z==='up')rotaryTurn(d,-1);else if(z==='down')rotaryTurn(d,1);else if(z==='push')rotaryPush(d);else if(z==='close')zoom(false);
    else{keyPress(d,z,true);const rel=()=>{keyPress(d,z,false);window.removeEventListener('pointerup',rel);};window.addEventListener('pointerup',rel);}});
}
function renderZoom(){
  if(!ZOOM.on)return;const cv=ZOOM.cv,w=cv.clientWidth;if(!w)return;const dpr=Math.min(2.5,window.devicePixelRatio||1);
  const W=Math.round(w*dpr),H=Math.round(w*.6*dpr);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  const g=cv.getContext('2d');g.setTransform(W/800,0,0,H/480,0,0);g.textBaseline='alphabetic';drawLcd(ACTIVE,g);
}
/* keyboard: every function is tied to a physical key (KeyboardEvent.code, see KEYDEF in ui.js),
   so AZERTY and QWERTY keyboards use the same places and nothing needs Shift */
const KEYPRESS=new Set(['loop_in','loop_out','reloop','four_beat','slip','quantize','browse','tag_list','info','menu','call_rev','call_fwd','memory','delete','hot_cue_call',
  'tag_track','track_filter','short_cut','cue','play','sync','master','jog_mode','track_rev','track_fwd','scan_rev','scan_fwd','back']);
function wireKeys(){
  const held=new Map();
  const release=c=>{const h=held.get(c);if(!h)return;held.delete(c);if(h.lever){if(h.d.lever===-1)setLever(h.d,0);}else keyPress(h.d,h.name,false);};
  document.addEventListener('keydown',e=>{
    if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
    const c=e.code,d=ACTIVE;
    /* open windows first: Esc closes them */
    if(!$('phMenu').hidden&&c==='Escape'){e.preventDefault();closePhones();return;}
    if(!$('credPanel').hidden&&c==='Escape'){e.preventDefault();showCredits(false);return;}
    if(c==='Escape'&&ZOOM.on){e.preventDefault();zoom(false);return;}
    if(c==='Escape'&&document.body.classList.contains('solo')){setSolo(false);return;}
    /* BROWSE > SEARCH: the keyboard types the letters */
    if(d.ui.scr==='browse'&&curNav(d).k==='search'){
      if(e.key.length===1&&/[a-z0-9 &\-'.,()!?#%:;@"/àâäçéèêëîïôöùûü]/i.test(e.key)){d.ui.search.q+=e.key.toUpperCase();d.ui.search.sel=0;e.preventDefault();return;}
      if(c==='Backspace'){e.preventDefault();if(d.ui.search.q)d.ui.search.q=d.ui.search.q.slice(0,-1);else keyPress(d,'back',true),keyPress(d,'back',false);return;}
    }
    const a=KEYACT[c];if(!a)return;e.preventDefault();
    if(held.has(c))return;
    switch(a){
      case 'nextdeck':if(!e.repeat)nextDeck();return;
      case 'zoom':if(!e.repeat){tab('deck');zoom(!ZOOM.on);}return;
      case 'solo':if(!e.repeat)setSolo();return;
      case 'smaller':setScale(SCALE-.1);return;
      case 'bigger':setScale(SCALE+.1);return;
      case 'keys':if(!e.repeat)showKeys();return;
      case 'push':rotaryPush(d);return;
      case 'sel_up':rotaryTurn(d,-1);return;
      case 'sel_down':rotaryTurn(d,1);return;
      case 'jog_back':jogNudge(d,-1);return;
      case 'jog_fwd':jogNudge(d,1);return;
      case 'jump_back':beatJump(d,-1);return;
      case 'jump_fwd':beatJump(d,1);return;
      case 'reverse':if(!e.repeat)setLever(d,d.lever===1?0:1);return;
      case 'slip_rev':if(!e.repeat){setLever(d,-1);held.set(c,{d,lever:true});}return;
    }
    if(e.repeat)return;
    if(/^hc[1-8]$/.test(a)){const n=+a[2];d.bank=n>4?1:0;d.dirty=true;const name='hot_cue_'+'abcd'[(n-1)%4];keyPress(d,name,true);held.set(c,{d,name});return;}
    if(KEYPRESS.has(a)){keyPress(d,a,true);held.set(c,{d,name:a});}
  });
  document.addEventListener('keyup',e=>release(e.code));
  window.addEventListener('blur',()=>{for(const c of [...held.keys()])release(c);});
}
/* ---------- main loop ---------- */
let lastTick=now();
function tick(){
  const tn=now(),dt=Math.min(.1,tn-lastTick);lastTick=tn;
  for(const d of DECKS){
    spinTick(d,dt);
    d.advance();
    if(d.braking&&d.touch<=0){d.braking=false;d.touchTarget=1;d.touch=1;d.pauseNow();}
    if(d.adjust&&now()-d.adjT>10){d.adjust=null;}
    if(d.ghost&&d.slipRevHeld===false&&d.dir>0&&!d.loop&&!d.touching&&!d.hotHeld&&!d.scratchOn)d.slipEnd();
  }
  BUS.tick();
  for(const M of MEDIA)if(M.filter.useMaster){const m=BUS.master&&BUS.master.loaded()?BUS.master:DECKS.find(x=>x.loaded());if(m){M.filter.bpmVal=Math.round(m.bpmNow()*10)/10;if(m.cur.tr.key)M.filter.keyVal=m.cur.tr.key;}}
  try{for(const F of FACES)if(DECKS.includes(F.deck))renderFace(F);renderZoom();if(MS.on){mixMeters();mixRender();}}catch(e){console.error(e);}
  renderStatus();
  requestAnimationFrame(tick);
}
setInterval(()=>{if(document.hidden)for(const d of DECKS)d.advance();},400);
function renderStatus(){
  const on=Date.now()<STATUS.until;
  const mx=on&&STATUS.src==='mix';
  {const el=$('stM');if(el){const t=mx?STATUS.msg:(MS.phonesName?say('Casque : ','Headphones: ')+MS.phonesName:say('Casque : clique sur la prise PHONES','Headphones: click the PHONES socket'))+(MS.color?' · SOUND COLOR FX '+MS.color:'');
    if(el.textContent!==t){el.textContent=t;el.className='st'+(mx?' warn':'');}}}
  for(const d of DECKS){const el=$('st'+d.n);if(!el)continue;const mine=on&&!mx&&(d===ACTIVE);
    const t=mine?STATUS.msg:(d.cur?(d.cur.loading?say('Chargement…','Loading…'):(d.playing?say('Lecture','Playing'):'Pause')+' · '+d.cur.tr.title+(DECKS.length>1&&BUS.master===d?' · MASTER':'')):(anyMedia()?say('Clé prête : BROWSE pour parcourir','USB ready: BROWSE to explore'):say('Pas de média','No media')));
    if(el.textContent!==t){el.textContent=t;el.className='st'+(mine?' warn':'');}}
}
page();
