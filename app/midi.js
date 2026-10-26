/* ---------------- MIDI controllers (Web MIDI: Chrome, Edge): ready-made templates, learn mode, soft takeover, controller lights ----------------
   A controller has a left and a right deck: each drives one player (and its channel of the mixer). The mixer part only works when the
   mixer is shown. Every binding is "message key" -> {a: action, s: side 'L'/'R' (deck actions), e: encoding of a turning control}. */
const MIDI={ok:!!navigator.requestMIDIAccess,acc:null,state:'off',port:'',inp:null,out:null,cfg:null,learn:null,hist:[],jogSum:{},
  btn:new Map(),down:new Map(),pick:new Map(),jog:new Map(),kill:new Map(),leds:new Map(),fn:{},quiet:0,navHeld:0,navT:null,fxSide:'L',said:{}};
const SIDES=['L','R'];
/* ---------- what a control can do ---------- */
const MACT={};
(function(){
  const A=(id,g,t,fr,en,f)=>MACT[id]={id,g,t,l:[fr,en],f};
  /* deck buttons */
  const K=(id,key,fr,en)=>A(id,'deck','btn',fr,en,(d,on)=>keyPress(d,key,on));
  K('play','play','PLAY/PAUSE','PLAY/PAUSE');K('cue','cue','CUE','CUE');
  K('loop_in','loop_in','LOOP IN','LOOP IN');K('loop_out','loop_out','LOOP OUT','LOOP OUT');K('reloop','reloop','RELOOP/EXIT','RELOOP/EXIT');
  K('four_beat','four_beat','4/8 BEAT (LOOP CUTTER)','4/8 BEAT (LOOP CUTTER)');
  K('call','hot_cue_call','HOT CUE CALL/DELETE','HOT CUE CALL/DELETE');
  K('search_rev','scan_rev','SEARCH ◀◀','SEARCH ◀◀');K('search_fwd','scan_fwd','SEARCH ▶▶','SEARCH ▶▶');
  K('track_rev','track_rev','TRACK SEARCH ◀◀','TRACK SEARCH ◀◀');K('track_fwd','track_fwd','TRACK SEARCH ▶▶','TRACK SEARCH ▶▶');
  K('sync','sync','BEAT SYNC','BEAT SYNC');K('player_master','master','MASTER (platine maître)','MASTER (master player)');K('tempo_reset','tempo_reset','TEMPO RESET','TEMPO RESET');
  K('jog_mode','jog_mode','JOG MODE','JOG MODE');K('slip','slip','SLIP','SLIP');K('quantize','quantize','QUANTIZE','QUANTIZE');
  K('master_tempo','master_tempo','MASTER TEMPO','MASTER TEMPO');K('tempo_range','tempo_range','TEMPO RANGE','TEMPO RANGE');
  K('browse','browse','BROWSE','BROWSE');K('tag_list','tag_list','TAG LIST','TAG LIST');K('info','info','INFO','INFO');K('menu','menu','MENU (maintenu : UTILITY)','MENU (held: UTILITY)');
  K('tag_track','tag_track','TAG TRACK/REMOVE','TAG TRACK/REMOVE');K('track_filter','track_filter','TRACK FILTER (maintenu : EDIT)','TRACK FILTER (held: EDIT)');K('short_cut','short_cut','SHORT CUT','SHORT CUT');
  A('reverse','deck','btn','REVERSE','REVERSE',(d,on)=>{if(on)setLever(d,d.lever===1?0:1);});
  /* the 4 HOT CUE keys of the CDJ: A-D, or E-H once BANK is pressed */
  for(let i=0;i<4;i++)K('hb'+(i+1),'hot_cue_'+'abcd'[i],'HOT CUE '+HL[i]+' / '+HL[i+4]+' (selon BANK)','HOT CUE '+HL[i]+' / '+HL[i+4]+' (by BANK)');
  A('bank','deck','btn','BANK (hot cues A-D ↔ E-H)','BANK (hot cues A-D ↔ E-H)',(d,on)=>{if(!on)return;d.bank=d.bank?0:1;d.dirty=true;toast('HOT CUE BANK '+(d.bank?'E-H':'A-D'),1400);});
  /* a function key: alone = its own function, held with another key = that key's second function */
  A('fn','deck','btn','Touche fonction (seule : MASTER TEMPO ; maintenue : 2e fonction des autres boutons)','Function key (alone: MASTER TEMPO; held: second function of the other keys)',null);
  /* out of a loop: BEAT JUMP; during a loop: LOOP 1/2X and 2X, like CUE/LOOP CALL on the CDJ */
  const J=dir=>(d,on)=>{if(!on||!d.loaded())return;if(d.loop){d.loopScale(dir<0?.5:2);toast('LOOP '+fmtBeat(d.loopLenBeats())+' BEAT');}else beatJump(d,dir);d.dirty=true;};
  A('jump_rev','deck','btn','BEAT JUMP ◀ (pendant une boucle : LOOP 1/2X)','BEAT JUMP ◀ (during a loop: LOOP 1/2X)',J(-1));
  A('jump_fwd','deck','btn','BEAT JUMP ▶ (pendant une boucle : LOOP 2X)','BEAT JUMP ▶ (during a loop: LOOP 2X)',J(1));
  for(let n=1;n<=8;n++)A('hot'+n,'deck','btn','HOT CUE '+HL[n-1],'HOT CUE '+HL[n-1],(d,on)=>{ensureCtx();if(on)hotDownN(d,n);else hotUpN(d,n);d.dirty=true;});
  /* pitch bend buttons: the rim of the jog, held */
  const B=dir=>(d,on)=>{if(!d.loaded())return;if(!d.playing){if(on)d.seek(d.pos()+dir*.02);return;}d.nudge=on?dir*.04:0;d.syncSrc();};
  A('nudge_rev','deck','btn','Pitch bend − (bord du jog)','Pitch bend − (jog rim)',B(-1));A('nudge_fwd','deck','btn','Pitch bend + (bord du jog)','Pitch bend + (jog rim)',B(1));
  /* LOAD: the first press opens BROWSE on that player, the next one loads the picked track */
  A('load','deck','btn','LOAD (BROWSE, puis charger)','LOAD (BROWSE, then load)',(d,on)=>{if(!on)return;ACTIVE=d;for(const x of DECKS)x.dirty=true;
    if(d.ui.scr==='browse'||d.ui.scr==='taglist')rotaryPush(d);else{keyPress(d,'browse',true);keyPress(d,'browse',false);}});
  A('tempo','deck','abs','TEMPO (fader)','TEMPO (slider)',null);
  A('jog','deck','rel','JOG','JOG',null);
  /* the mixer channel of that deck */
  const C=(id,k,fr,en)=>A(id,'chan','abs',fr,en,null);
  C('trim','trim','TRIM','TRIM');C('hi','hi','EQ HI','EQ HI');C('mid','mid','EQ MID','EQ MID');C('low','low','EQ LOW','EQ LOW');
  C('fader','fader','Fader de tranche','Channel fader');C('color','color','COLOR (SOUND COLOR FX)','COLOR (SOUND COLOR FX)');
  A('ph_cue','chan','btn','CUE casque de la tranche','Channel headphone CUE',null);
  for(const k of ['hi','mid','low'])A('kill_'+k,'chan','btn','Kill '+k.toUpperCase()+' (bande au minimum tant qu’on appuie)','Kill '+k.toUpperCase()+' (band down while held)',null);
  /* the whole mixer */
  const M=(id,fr,en)=>A(id,'mix','abs',fr,en,null);
  M('xfader','Crossfader','Crossfader');M('master','MASTER LEVEL','MASTER LEVEL');M('balance','BALANCE','BALANCE');
  M('mixing','MIXING (casque)','MIXING (headphones)');M('ph_level','LEVEL (casque)','LEVEL (headphones)');M('param','PARAMETER (SOUND COLOR FX)','PARAMETER (SOUND COLOR FX)');
  M('fx_color','COLOR de la tranche choisie','COLOR of the picked channel');
  for(const n of ['SPACE','DUB ECHO','SWEEP','NOISE','CRUSH','FILTER'])A('fx:'+n,'mix','btn','SOUND COLOR FX '+n,'SOUND COLOR FX '+n,null);
  A('beatfx','mix','rel','BEAT FX (prévu en V2.9)','BEAT FX (planned for V2.9)',null);
  A('fx_side','mix','btn','Tranche des boutons COLOR / PARAMETER (gauche ↔ droite)','Channel for COLOR / PARAMETER (left ↔ right)',null);
  /* browsing, on the active player */
  A('nav_up','nav','btn','Sélecteur ▲','Selector ▲',null);A('nav_down','nav','btn','Sélecteur ▼','Selector ▼',null);
  A('nav_back','nav','btn','BACK','BACK',(d,on)=>{if(d)keyPress(d,'back',on);});A('nav_push','nav','btn','Valider (appui sur le sélecteur)','Enter (selector push)',(d,on)=>{if(on&&d)rotaryPush(d);});
  A('jog_mode_all','nav','btn','JOG MODE des deux platines','JOG MODE of both players',null);
})();
const MGROUPS=[['deck',['Platine','Player']],['chan',['Tranche de la table','Mixer channel']],['mix',['Table','Mixer']],['nav',['Navigation','Browsing']]];
/* ---------- the templates (codes from the maker's documents or checked on the real controller) ---------- */
function steelMap(){
  const m={},cc=(code,a,s,e,f)=>{const b={a};if(s)b.s=s;if(e)b.e=e;if(f)b.f=f;m['c0:'+code.toString(16).padStart(2,'0')]=b;};
  const side=(s,o)=>{
    /* Stop is the function key: held, the keys below get their second function */
    cc(o.stop,'fn',s);cc(o.play,'play',s,0,'reverse');cc(o.cue,'cue',s,0,'slip');cc(o.prev,'search_rev',s,0,'track_rev');cc(o.next,'search_fwd',s,0,'track_fwd');
    cc(o.sync,'sync',s,0,'player_master');cc(o.bm,'nudge_rev',s,0,'tempo_range');cc(o.bp,'nudge_fwd',s,0,'tempo_reset');cc(o.load,'load',s,0,'tag_track');
    /* Controls 1 / 2 with Apply Ctrl on Deck A or Deck B: COLOR of that channel and PARAMETER */
    cc(o.color,'color',s,'tc');cc(o.param,'param',0,'tc');
    cc(o.tempo,'tempo',s);cc(o.jog,'jog',s,'tc');
    /* pads, two columns: 1 2 3 on the left, 4 5 6 on the right; SHIFT turns them into 7..12 */
    ['loop_in','four_beat','jump_rev','loop_out','reloop','jump_fwd'].forEach((a,i)=>cc(o.pad+i,a,s));
    ['hb1','hb3','bank','hb2','hb4','call'].forEach((a,i)=>cc(o.pad2+i,a,s));
    cc(o.trim,'trim',s);cc(o.hi,'hi',s);cc(o.mid,'mid',s);cc(o.low,'low',s);cc(o.fader,'fader',s);cc(o.phc,'ph_cue',s);
    /* with Stop held, the 6 Kill keys pick the 6 SOUND COLOR FX, in the order of the DJM's buttons */
    const fx=s==='L'?['SPACE','DUB ECHO','SWEEP']:['NOISE','CRUSH','FILTER'];
    cc(o.khi,'kill_hi',s,0,'fx:'+fx[0]);cc(o.kmid,'kill_mid',s,0,'fx:'+fx[1]);cc(o.klow,'kill_low',s,0,'fx:'+fx[2]);};
  side('L',{play:0x0B,cue:0x0C,stop:0x0D,prev:0x09,next:0x0A,sync:0x07,bm:0x11,bp:0x08,load:0x12,color:0x41,param:0x42,tempo:0x31,jog:0x2F,pad:0x01,pad2:0x64,
    trim:0x33,hi:0x34,mid:0x35,low:0x36,fader:0x32,phc:0x14,khi:0x0E,kmid:0x0F,klow:0x10});
  side('R',{play:0x23,cue:0x24,stop:0x25,prev:0x21,next:0x22,sync:0x1F,bm:0x20,bp:0x15,load:0x16,color:0x43,param:0x44,tempo:0x3B,jog:0x30,pad:0x19,pad2:0x6A,
    trim:0x3D,hi:0x3E,mid:0x3F,low:0x40,fader:0x3C,phc:0x18,khi:0x26,kmid:0x27,klow:0x28});
  cc(0x39,'xfader');cc(0x38,'master');cc(0x37,'balance');cc(0x3A,'mixing');cc(0x29,'jog_mode_all',0,0,'track_filter');
  cc(0x47,'ph_level');cc(0x45,'beatfx',0,'tc');cc(0x46,'beatfx',0,'tc');
  /* the cross: the selector of the active player; with Stop held, the 4 keys above the CDJ screen */
  cc(0x2A,'nav_up',0,0,'browse');cc(0x2B,'nav_down',0,0,'tag_list');cc(0x2C,'nav_back',0,0,'info');cc(0x2D,'nav_push',0,0,'menu');
  return m;
}
const MTPL={
  /* the Steel's lights: the key's own code lights it, another code makes it blink (manual, MIDI table); 0x70 asks for the knobs' positions */
  steel:{name:'Hercules DJ Control Steel',match:/steel/i,tested:true,map:steelMap,init:[[0xB0,0x70,0x7F]],
    blink:{0x01:0x31,0x02:0x32,0x03:0x33,0x04:0x34,0x05:0x35,0x06:0x36,0x07:0x37,0x08:0x38,0x0B:0x3B,0x0C:0x3C,0x0D:0x3D,0x0E:0x3E,0x0F:0x3F,0x10:0x40,0x11:0x41,0x12:0x42,0x14:0x44,
      0x15:0x60,0x16:0x47,0x18:0x58,0x19:0x4A,0x1A:0x4B,0x1B:0x4C,0x1C:0x4D,0x1D:0x4E,0x1E:0x50,0x1F:0x5F,0x20:0x55,0x23:0x53,0x24:0x54,0x25:0x46,0x26:0x5A,0x27:0x5B,0x28:0x5C,0x29:0x59,
      0x64:0x74,0x65:0x75,0x66:0x76,0x67:0x77,0x68:0x78,0x69:0x79,0x6A:0x7A,0x6B:0x7B,0x6C:0x7C,0x6D:0x7D,0x6E:0x7E,0x6F:0x7F}},
  none:{name:['Vide : tout apprendre','Empty: learn everything'],match:null,map:()=>({})},
};
const tplName=k=>tl(MTPL[k].name);
/* ---------- settings kept per controller (by MIDI port name) ---------- */
const mstore={get(k,v){try{const x=localStorage.getItem('bc.midi.'+k);return x==null?v:JSON.parse(x);}catch(e){return v;}},set(k,v){try{localStorage.setItem('bc.midi.'+k,JSON.stringify(v));}catch(e){}}};
function midiCfgFor(port){
  /* a template not changed by hand is always taken fresh, so that a corrected template reaches everyone */
  const c=mstore.get('cfg.'+port,null);if(c&&MTPL[c.tpl]){if(!c.custom)c.map=MTPL[c.tpl].map();return c;}
  const k=Object.keys(MTPL).find(k=>MTPL[k].match&&MTPL[k].match.test(port))||'none';
  return {tpl:k,map:MTPL[k].map(),custom:false};
}
function midiSave(){if(MIDI.port&&MIDI.cfg)mstore.set('cfg.'+MIDI.port,MIDI.cfg);}
/* the two sides of the controller: by default the two leftmost players */
function sideDeck(s){
  const sides=mstore.get('sides',{}),want=sides[s];
  if(want&&BOOTH.p.includes(want)){const d=DK[want-1];if(d&&DECKS.includes(d))return d;}
  const L=DECKS.slice().sort((a,b)=>a.ch-b.ch);return s==='L'?L[0]:L[1]||null;
}
/* ---------- connection ---------- */
async function midiStart(ask){
  if(!MIDI.ok){MIDI.state='unsupported';return;}
  if(MIDI.acc)return;
  if(!ask){try{const p=await navigator.permissions.query({name:'midi'});if(p.state!=='granted')return;}catch(e){return;}}
  try{MIDI.acc=await navigator.requestMIDIAccess({sysex:false});}catch(e){MIDI.state='denied';renderMidi();return;}
  MIDI.state='ready';MIDI.acc.onstatechange=()=>midiPorts();midiPorts();
}
function midiInputs(){return MIDI.acc?[...MIDI.acc.inputs.values()].filter(p=>p.state==='connected'):[];}
/* pick the input: the one chosen before, else a controller that has a template */
function midiPorts(){
  const ins=midiInputs(),was=MIDI.port;
  let p=ins.find(x=>x.name===MIDI.port)||ins.find(x=>x.name===mstore.get('port',''))||ins.find(x=>Object.values(MTPL).some(t=>t.match&&t.match.test(x.name)));
  if(MIDI.inp&&(!p||p!==MIDI.inp)){MIDI.inp.onmidimessage=null;MIDI.inp=null;}
  if(p&&p!==MIDI.inp)midiUse(p,false);
  else if(p&&!MIDI.out){MIDI.out=midiOutFor(p.name);if(MIDI.out){MIDI.leds.clear();midiInit();}}
  if(!p){if(was)toast(say('Contrôleur débranché : ','Controller unplugged: ')+was,2600);MIDI.port='';MIDI.out=null;}
  midiDot();renderMidi();
}
function midiUse(p,chosen){
  if(MIDI.inp)MIDI.inp.onmidimessage=null;
  MIDI.inp=p;MIDI.port=p.name;p.onmidimessage=midiMsg;if(chosen)mstore.set('port',p.name);
  MIDI.out=midiOutFor(p.name);
  MIDI.cfg=midiCfgFor(p.name);MIDI.btn.clear();MIDI.down.clear();MIDI.pick.clear();MIDI.leds.clear();MIDI.fn={};midiInit();
  toast(p.name+say(' branché',' plugged in')+(MIDI.cfg.tpl!=='none'?say(', modèle chargé',', template loaded'):say(' : ouvre « Contrôleur » pour relier ses boutons',': open “Controller” to map its buttons')),3200);
  midiDot();renderMidi();
}
/* on connection: the controller says where its knobs are (each one is taken over once it meets the screen) */
function midiInit(){const t=MIDI.cfg&&MTPL[MIDI.cfg.tpl];if(!t||!t.init||!MIDI.out)return;MIDI.quiet=performance.now()+800;midiSend(t.init);}
/* all the lights on for a second, to check them */
function midiLedTest(){const t=MIDI.cfg&&MTPL[MIDI.cfg.tpl];if(!t||!t.blink||!MIDI.out)return false;const ks=Object.keys(MIDI.cfg.map).filter(k=>k[0]==='c').map(k=>[0xB0|parseInt(k.slice(1)),parseInt(k.split(':')[1],16)]);
  midiSend(ks.map(([c,n])=>[c,n,0x7F]));setTimeout(()=>{MIDI.leds.clear();},1500);return true;}
function midiOutFor(name){return MIDI.acc?[...MIDI.acc.outputs.values()].find(o=>o.state!=='disconnected'&&o.name===name)||null:null;}
/* the Steel drives 2 players and the mixer: offer to set them up */
function midiFull(){return BOOTH.p.length>=2&&BOOTH.m;}
function midiDot(){const b=$('bMidi');if(b)b.classList.toggle('on',!!MIDI.inp);}
/* ---------- incoming messages ---------- */
function midiKey(data){
  const st=data[0],ty=st&0xF0,ch=st&0x0F;
  if(ty===0x90||ty===0x80)return {k:'n'+ch+':'+data[1].toString(16).padStart(2,'0'),v:ty===0x80?0:data[2],txt:'NOTE '+(ch+1)+' / '+data[1]};
  if(ty===0xB0)return {k:'c'+ch+':'+data[1].toString(16).padStart(2,'0'),v:data[2],txt:'CC '+(ch+1)+' / '+data[1]};
  if(ty===0xE0)return {k:'p'+ch,v:data[2],txt:'PITCH '+(ch+1)};
  return null;
}
function midiMsg(e){
  const m=midiKey(e.data);if(!m)return;
  if(MIDI.learn){midiLearnIn(m);return;}
  const b=MIDI.cfg&&MIDI.cfg.map[m.k];
  /* the last messages, shown in the panel; for a jog, the steps added up (to count the steps of one turn) */
  let extra='';if(b&&MACT[b.a]&&MACT[b.a].t==='rel'){const n=b.e==='c64'?m.v-64:(m.v>=64?m.v-128:m.v);MIDI.jogSum[m.k]=(MIDI.jogSum[m.k]||0)+n;extra=say(' · total ',' · total ')+MIDI.jogSum[m.k];}
  const line=m.txt+' = '+m.v+(b?' → '+midiBindLabel(b):say(' (non relié)',' (not mapped)'))+extra;
  if(MIDI.hist[0]&&MIDI.hist[0].k===m.k)MIDI.hist[0].t=line;else{MIDI.hist.unshift({k:m.k,t:line});MIDI.hist.length=Math.min(MIDI.hist.length,6);}
  midiLastShow();if(typeof planHit==='function')planHit(m.k,m.v>=64||!b||MACT[b.a].t!=='btn');
  if(!b||!MACT[b.a])return;
  if(!AU.ctx||AU.ctx.state!=='running'){ensureCtx();if(AU.ctx&&AU.ctx.state!=='running'&&!MIDI.said.audio){MIDI.said.audio=true;toast(say('Clique une fois dans la page pour activer le son (règle du navigateur)','Click once in the page to turn the sound on (browser rule)'),4000);}}
  midiRun(b,m);
}
function midiRun(b,m){
  const A=MACT[b.a];
  if(A.t==='btn'){const on=m.v>=64,was=!!MIDI.btn.get(m.k);if(on===was)return;MIDI.btn.set(m.k,on);
    /* function key held on that side: the key does its second function (the release goes to the same one) */
    /* keys in the middle (no side): the Stop held on either side, and that side's player becomes the active one */
    let act=A,eb=b;
    if(on){const fs=b.s?(MIDI.fn[b.s]?b.s:null):(MIDI.fn.L?'L':MIDI.fn.R?'R':null);
      if(b.f&&fs&&MACT[b.f]){act=MACT[b.f];MIDI.fn[fs].used=true;if(!b.s){eb={...b,s:fs};midiActive(fs);}}
      MIDI.down.set(m.k,{a:act.id,b:eb});}
    else{const w=MIDI.down.get(m.k);if(w){act=MACT[w.a]||A;eb=w.b;}MIDI.down.delete(m.k);}
    midiButton(act,eb,on);return;}
  if(A.g==='deck')midiActive(b.s);
  if(A.t==='rel'||b.e){const n=b.e==='c64'?m.v-64:(m.v>=64?m.v-128:m.v);if(n)midiTurn(A,b,n);return;}
  midiAbs(A,b,m.k,m.v/127);
}
/* touching a side of the controller makes its player the active one (white outline): the browsing keys then act on it */
function midiActive(s){const d=s&&sideDeck(s);if(d&&ACTIVE!==d){ACTIVE=d;for(const x of DECKS)x.dirty=true;}}
function midiDeck(b){const d=sideDeck(b.s||'L');if(!d&&!MIDI.said['nodeck'+b.s]){MIDI.said['nodeck'+b.s]=true;toast(say('Pas de platine pour ce côté du contrôleur : ajoute-la dans « Matériel »','No player for this side of the controller: add one in “Gear”'),3000);}return d;}
function needMixer(){if(MS.on)return true;if(!MIDI.said.mixer){MIDI.said.mixer=true;toast(say('Table masquée : les commandes de table du contrôleur ne font rien. Ajoute la table dans « Matériel ».','Mixer hidden: the controller’s mixer controls do nothing. Add the mixer in “Gear”.'),3600);}return false;}
function midiButton(A,b,on){
  switch(A.g){
    case 'deck':{
      /* the function key works even without a player on that side (Stop + Kill picks an effect) */
      if(A.id==='fn'){if(on){MIDI.fn[b.s]={used:false};return;}const f=MIDI.fn[b.s];delete MIDI.fn[b.s];if(f&&!f.used){const d=midiDeck(b);if(d){midiActive(b.s);keyPress(d,'master_tempo',true);keyPress(d,'master_tempo',false);}}return;}
      const d=midiDeck(b);if(!d)return;if(on&&b.s)midiActive(b.s);
      A.f(d,on);return;}
    case 'chan':{const d=midiDeck(b);if(!d||!needMixer())return;const ch=MS.ch[d.ch-1];
      if(A.id==='ph_cue'){if(on){ch.cue=!ch.cue;mixApply();}return;}
      const k=A.id.slice(5),id=b.s+k;if(on){if(!MIDI.kill.has(id)){MIDI.kill.set(id,ch[k]);ch[k]=0;}}else if(MIDI.kill.has(id)){ch[k]=MIDI.kill.get(id);MIDI.kill.delete(id);}mixApply();return;}
    case 'mix':if(A.id.startsWith('fx:')){if(on&&needMixer()){setColor(A.id.slice(3));mixToast('SOUND COLOR FX : '+(MS.color||'OFF'),1400);}return;}
      if(A.id==='fx_side'&&on){MIDI.fxSide=MIDI.fxSide==='L'?'R':'L';const d=sideDeck(MIDI.fxSide);toast('SOUND COLOR FX → '+(d?'CH '+d.ch:say('aucune tranche','no channel')),1600);}return;
    case 'nav':{const d=ACTIVE;
      if(A.id==='jog_mode_all'){if(on){const v=!(DECKS[0]&&DECKS[0].vinyl);for(const x of DECKS){x.vinyl=v;x.dirty=true;}toast('JOG MODE : '+(v?'VINYL':'CDJ'),1400);}return;}
      if(A.id==='nav_up'||A.id==='nav_down'){const dir=A.id==='nav_up'?-1:1;clearInterval(MIDI.navT);
        if(on){MIDI.navHeld=dir;MIDI.navUsed=false;if(d)rotaryTurn(d,dir);let n=0;MIDI.navT=setInterval(()=>{if(++n>4&&!MIDI.navUsed&&ACTIVE)rotaryTurn(ACTIVE,dir);},90);}
        else MIDI.navHeld=0;return;}
      if(A.f)A.f(d,on);return;}
  }
}
/* a jog wheel or an endless knob turned by n steps */
const JOG_DEG=360/128;                       /* degrees per step of the controller's jog (Hercules Steel: about 128 steps a turn) */
function midiTurn(A,b,n){
  if(A.id==='jog'){
    /* UP or DOWN held + jog = fast scrolling through the list, as on the Hercules */
    if(MIDI.navHeld){MIDI.navUsed=true;if(ACTIVE)rotaryTurn(ACTIVE,Math.sign(n));return;}
    const d=midiDeck(b);if(!d)return;midiJog(d,n);return;}
  if(A.id==='beatfx'){if(!MIDI.said.bfx||now()-MIDI.said.bfx>4){MIDI.said.bfx=now();toast(say('BEAT FX : pas encore simulé, prévu en V2.9','BEAT FX: not simulated yet, planned for V2.9'),2600);}return;}
  const tg=midiTarget(A,b);if(!tg)return;tg.set(clamp(tg.get()+n/64,0,1),true);
}
/* the controller's jog has no touch sensor: turning it is the hand on the platter; when it stops, the hand is lifted */
function midiJog(d,n){
  ensureCtx();let st=MIDI.jog.get(d);
  if(!st){st={tg:{t:'jog',top:true},a:0};jogDown(d,st,null);MIDI.jog.set(d,st);}
  jogTurn(d,st,n*JOG_DEG*mstore.get('jogSens',1));d.dirty=true;
  clearTimeout(st.rel);st.rel=setTimeout(()=>{MIDI.jog.delete(d);jogUp(d,st);},120);
}
/* an absolute control (fader, knob): soft takeover, it only takes over once it has met the value on screen */
function midiAbs(A,b,k,v){
  const tg=midiTarget(A,b);if(!tg)return;
  const cur=tg.get(),p=MIDI.pick.get(k);
  let ok=p&&p.on&&Math.abs(cur-p.w)<.02;
  if(!ok){const prev=p?p.v:null;ok=Math.abs(v-cur)<.04||(prev!=null&&(prev-cur)*(v-cur)<=0);}
  if(!ok){MIDI.pick.set(k,{on:false,v,w:cur});if(performance.now()<MIDI.quiet)return;if(!MIDI.said.pick){MIDI.said.pick=true;toast(say('Contrôleur : amène le bouton jusqu’à la position affichée pour en prendre la main','Controller: move the control to the position on screen to take it over'),3200);}return;}
  tg.set(v);MIDI.pick.set(k,{on:true,v,w:tg.get()});
}
function midiTarget(A,b){
  /* a knob with a centre click: an absolute control snaps to it when close; an endless one stops on it when it goes past */
  const knob=(o,k,c)=>({get:()=>o[k],set:(v,rel)=>{if(c){if(rel){if((o[k]-.5)*(v-.5)<0)v=.5;}else if(Math.abs(v-.5)<.018)v=.5;}o[k]=v;mixApply();}});
  switch(A.id){
    /* the top of the slider is minus, as on the CDJ; a controller sends its top as 127 */
    case 'tempo':{const d=midiDeck(b);if(!d)return null;return {get:()=>(1-d.tempoV)/2,set:v=>{let t=1-v*2;if(Math.abs(t)<.02)t=0;d.tempoV=t;d.tReset=false;d.applyTempo();}};}
    case 'trim':case 'hi':case 'mid':case 'low':case 'color':case 'fader':{const d=midiDeck(b);if(!d||!needMixer())return null;return knob(MS.ch[d.ch-1],A.id,A.id!=='fader');}
    case 'fx_color':{const d=sideDeck(MIDI.fxSide);if(!d||!needMixer())return null;return knob(MS.ch[d.ch-1],'color',true);}
    case 'xfader':if(!needMixer())return null;return {get:()=>(MS.xfader+1)/2,set:v=>{let x=v*2-1;if(Math.abs(x)<.03)x=0;MS.xfader=x;mixApply();}};
    case 'master':case 'balance':case 'mixing':case 'param':if(!needMixer())return null;return knob(MS,A.id,A.id==='balance'||A.id==='mixing');
    case 'ph_level':if(!needMixer())return null;return knob(MS,'phLevel',false);
  }
  return null;
}
/* ---------- learn mode: pick a function in the panel, then touch the control ---------- */
function midiLearnStart(a,s){MIDI.learn={a,s:s||null,key:null,vals:[],t:0};renderMidi();}
function midiLearnIn(m){
  const L=MIDI.learn;
  if(!L.key){L.key=m.k;L.txt=m.txt;L.t=performance.now();setTimeout(midiLearnEnd,MACT[L.a].t==='btn'?60:450);}
  if(m.k===L.key)L.vals.push(m.v);
}
function midiLearnEnd(){
  const L=MIDI.learn;if(!L||!L.key)return;MIDI.learn=null;
  const A=MACT[L.a],b={a:L.a};if(L.s)b.s=L.s;
  /* a turning control that only sends small steps is an endless knob or a jog wheel */
  if(A.t!=='btn'){const v=L.vals;if(v.every(x=>x>=1&&x<=8||x>=120&&x<=127)&&v.some(x=>x!==v[0]||v.length<3))b.e='tc';else if(v.every(x=>x>=56&&x<=72&&x!==64))b.e='c64';
    if(A.t==='rel'&&!b.e)b.e='tc';}
  const map=MIDI.cfg.map;for(const k of Object.keys(map))if(map[k].a===b.a&&(map[k].s||null)===(b.s||null))delete map[k];
  map[L.key]=b;MIDI.cfg.custom=true;midiSave();MIDI.pick.delete(L.key);
  toast(midiBindLabel(b)+' ← '+L.txt,2400);renderMidi();
}
function midiUnbind(a,s){const map=MIDI.cfg.map;for(const k of Object.keys(map))if(map[k].a===a&&(map[k].s||null)===(s||null))delete map[k];MIDI.cfg.custom=true;midiSave();renderMidi();}
function midiBindLabel(b){const A=MACT[b.a];return (b.s?say(b.s==='L'?'Gauche : ':'Droite : ',b.s==='L'?'Left: ':'Right: '):'')+tl(A.l);}
function midiKeyText(k){const t=k[0],ch=parseInt(k.slice(1))+1,n=k.includes(':')?parseInt(k.split(':')[1],16):null;return (t==='n'?'NOTE ':t==='c'?'CC ':'PITCH ')+ch+(n!=null?' / '+n:'');}
/* ---------- lights on the controller: they follow the CDJ lights; 0 off, 1 on, 2 blinking ---------- */
function midiLedState(b,k){
  const d=b.s?sideDeck(b.s):ACTIVE,ld=!!d&&d.loaded(),L=v=>v?1:0;
  switch(b.a){
    case 'play':return !ld?0:d.playing&&d.touchTarget>0?1:2;
    case 'cue':return !ld?0:d.playing||Math.abs(d._pos-d.cue)<.02?1:2;
    case 'loop_in':return !ld?0:d.adjust==='in'?2:L(d.loop||d.loopIn!=null);
    case 'loop_out':return !ld?0:d.adjust==='out'?2:L(d.loop);
    case 'reloop':return L(ld&&(d.loop||d.lastLoop));
    case 'four_beat':case 'jump_rev':case 'jump_fwd':return L(ld&&d.loop);
    case 'call':return !ld?0:d.callHeld?1:d.callMode?2:0;
    case 'sync':return L(d&&d.sync);case 'player_master':return L(d&&BUS.master===d);case 'slip':return L(d&&d.slip);case 'quantize':return L(d&&d.quant);
    case 'fn':case 'master_tempo':return L(d&&d.mt);
    case 'jog_mode':return L(d&&d.vinyl);case 'jog_mode_all':return L(DECKS[0]&&DECKS[0].vinyl);
    /* pitch bend lights: pressed, or a guide while the TEMPO slider of the controller has not met the one on screen */
    case 'nudge_rev':case 'nudge_fwd':{if(MIDI.btn.get(k))return 1;const g=midiTempoGuide(b.s);return L(g&&(g<0)===(b.a==='nudge_rev'));}
    /* LOAD: browsing on that player; blinking in the last 30 s of the track, like the end warning of the CDJ */
    case 'load':return ld&&d.playing&&d.dur-d._pos<30&&d.dur>40?2:L(d&&ACTIVE===d&&(d.ui.scr==='browse'||d.ui.scr==='taglist'));
    case 'ph_cue':return L(d&&MS.on&&MS.ch[d.ch-1].cue);
    case 'kill_hi':case 'kill_mid':case 'kill_low':return L(MIDI.kill.has(b.s+b.a.slice(5))||d&&MS.on&&MS.ch[d.ch-1][b.a.slice(5)]<.01);
  }
  let n=0;if(/^hb\d$/.test(b.a))n=(d?d.bank:0)*4+(+b.a[2]);else if(/^hot\d$/.test(b.a))n=+b.a[3];
  if(n){if(!ld)return 0;const c=d.cur.hot[n];if(d.callHeld)return c?2:0;if(d.callMode&&!c&&d.cur.store[n])return 2;return L(c);}
  return null;
}
/* -1: move the controller's TEMPO slider up (toward minus) to meet the screen, 1: down, 0: taken over */
function midiTempoGuide(s){
  const k=Object.keys(MIDI.cfg.map).find(x=>MIDI.cfg.map[x].a==='tempo'&&MIDI.cfg.map[x].s===s),p=k&&MIDI.pick.get(k),d=sideDeck(s);
  if(!p||p.on||!d)return 0;const cur=(1-d.tempoV)/2;return Math.abs(cur-p.v)<.04?0:cur>p.v?-1:1;
}
/* sent only when a light changes, spaced a few ms apart (the Hercules driver loses messages sent in a burst);
   blinking is done by the controller itself (its own "blink" code) */
function midiSend(list){const o=MIDI.out;if(!o)return;let t=Math.max(performance.now(),MIDI.sendT||0);for(const m of list){try{o.send(m,t);}catch(e){}t+=4;}MIDI.sendT=t;}
function midiTick(){
  const t=MIDI.out&&MIDI.cfg&&MTPL[MIDI.cfg.tpl];if(!t||!t.blink)return;
  for(const [k,b] of Object.entries(MIDI.cfg.map)){
    if(k[0]!=='c')continue;const st=midiLedState(b,k);if(st==null)continue;
    if(MIDI.leds.get(k)===st)continue;MIDI.leds.set(k,st);
    const ch=0xB0|parseInt(k.slice(1)),n=parseInt(k.split(':')[1],16),bl=t.blink[n];
    midiSend(st===2&&bl!=null?[[ch,n,0],[ch,bl,0x7F]]:bl!=null?[[ch,bl,0],[ch,n,st?0x7F:0]]:[[ch,n,st?0x7F:0]]);
  }
}
/* ---------- export / import of a mapping, to share it ---------- */
function midiExport(){
  const j={booth_check_midi:1,device:MIDI.port,tpl:MIDI.cfg.tpl,map:MIDI.cfg.map};
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(j,null,1)],{type:'application/json'}));
  a.download='booth-check-'+(MIDI.port||'controleur').replace(/[^\w-]+/g,'-').toLowerCase()+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
}
function midiImport(f){
  const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);if(!j||j.booth_check_midi!==1||typeof j.map!=='object')throw 0;
    const map={};for(const [k,b] of Object.entries(j.map))if(/^(n|c)\d{1,2}:[0-9a-f]{2}$|^p\d{1,2}$/.test(k)&&b&&MACT[b.a])map[k]={a:b.a,...(b.s==='L'||b.s==='R'?{s:b.s}:{}),...(b.e==='tc'||b.e==='c64'?{e:b.e}:{})};
    MIDI.cfg={tpl:MTPL[j.tpl]?j.tpl:'none',map,custom:true};midiSave();MIDI.pick.clear();MIDI.leds.clear();renderMidi();toast(say('Correspondances importées','Mapping imported'),2200);}
    catch(e){toast(say('Fichier non reconnu : ce n’est pas un export Booth Check','File not recognised: not a Booth Check export'),3000);}};r.readAsText(f);
}
/* ---------- the "Controller" panel ---------- */
function renderMidi(){
  const m=$('midiPanel');if(!m||m.hidden)return;
  let h='';
  if(!MIDI.ok){m.innerHTML='<h3>'+esc(say('Contrôleur MIDI','MIDI controller'))+'</h3><p class="note">'+esc(say('Ce navigateur ne gère pas les contrôleurs MIDI. Utilise Chrome ou Edge sur ordinateur.','This browser does not handle MIDI controllers. Use Chrome or Edge on a computer.'))+'</p>';return;}
  if(!MIDI.acc){
    h+='<h3>'+esc(say('Contrôleur MIDI','MIDI controller'))+'</h3><p class="note">'+esc(MIDI.state==='denied'?say('Accès MIDI refusé. Autorise-le dans les réglages du site (cadenas à gauche de l’adresse), puis réessaie.','MIDI access denied. Allow it in the site settings (padlock left of the address), then try again.')
      :say('Branche ton contrôleur, puis autorise l’accès MIDI : le navigateur va te le demander.','Plug in your controller, then allow MIDI access: the browser will ask you.'))+'</p>';
    h+='<button type="button" class="opt" data-act="allow"><span>'+esc(say('Activer le contrôleur','Turn the controller on'))+'</span></button>';m.innerHTML=h;return;}
  const ins=midiInputs();
  h+='<div class="lab">'+esc(say('Contrôleur','Controller'))+'</div>';
  if(!ins.length)h+='<p class="note">'+esc(say('Aucun appareil MIDI branché.','No MIDI device plugged in.'))+'</p>';
  h+=ins.map(p=>'<button type="button" class="opt" data-act="port" data-p="'+esc(p.name)+'" aria-pressed="'+(p===MIDI.inp)+'"><span>'+esc(p.name)+'</span>'+(p===MIDI.inp?'<span class="tag on">'+esc(say('actif','active'))+'</span>':'')+'</button>').join('');
  if(MIDI.inp){
    const c=MIDI.cfg;
    h+='<div class="lab">'+esc(say('Modèle','Template'))+'</div><div class="cols">'+Object.keys(MTPL).map(k=>'<button type="button" class="opt" data-act="tpl" data-t="'+k+'" aria-pressed="'+(c.tpl===k)+'"><span>'+esc(tplName(k))+'</span>'+(k!=='none'&&!MTPL[k].tested?'<span class="tag">'+esc(say('non testé','untested'))+'</span>':'')+'</button>').join('')+'</div>';
    if(c.custom)h+='<p class="note">'+esc(say('Correspondances modifiées par toi.','Mapping changed by you.'))+' <button type="button" class="link" data-act="reset">'+esc(say('Revenir au modèle','Back to the template'))+'</button></p>';
    const sides=SIDES.map(s=>{const d=sideDeck(s);return '<div class="side"><span>'+esc(s==='L'?say('Deck gauche','Left deck'):say('Deck droit','Right deck'))+'</span><div class="seg">'+BOOTH.p.map(n=>'<button type="button" data-act="side" data-s="'+s+'" data-n="'+n+'" aria-pressed="'+(!!d&&d.ch===n)+'">P'+n+'</button>').join('')+'</div></div>';}).join('');
    h+='<div class="lab">'+esc(say('Platine pilotée par chaque côté','Player driven by each side'))+'</div>'+sides;
    if(c.tpl==='steel'&&!midiFull())h+='<button type="button" class="opt" data-act="full"><span>'+esc(say('Le Steel pilote 2 platines et la table : les ajouter','The Steel drives 2 players and the mixer: add them'))+'</span></button>';
    const js=mstore.get('jogSens',1);h+='<div class="side"><span>'+esc(say('Sensibilité du jog','Jog sensitivity'))+'</span><input type="range" id="midiJog" min="0.4" max="2.5" step="0.05" value="'+js+'"><span class="mk" id="midiJogV">'+Math.round(js*100)+' %</span></div>';
    h+='<div class="cols"><button type="button" class="opt" data-act="plan"><span>'+esc(say('Plan du contrôleur','Controller map'))+'</span></button><button type="button" class="opt" data-act="ledtest"><span>'+esc(say('Tester les voyants','Test the lights'))+'</span></button></div>';
    h+='<div class="last" id="midiLast"></div><p class="note"><button type="button" class="link" data-act="jog0">'+esc(say('Remettre les totaux du jog à zéro','Reset the jog totals'))+'</button></p>';
    if(MIDI.learn)h+='<p class="learn">'+esc(say('Touche maintenant le bouton du contrôleur pour : ','Now touch the controller’s control for: ')+midiBindLabel(MIDI.learn))+' <button type="button" class="link" data-act="learn-stop">'+esc(say('Annuler','Cancel'))+'</button></p>';
    h+='<details class="maps"'+(MIDI.open?' open':'')+'><summary>'+esc(say('Correspondances et mode apprentissage','Mapping and learn mode'))+'</summary>';
    const keyOf=(a,s)=>Object.keys(c.map).find(k=>c.map[k].a===a&&(c.map[k].s||null)===(s||null));
    for(const [g,gl] of MGROUPS){
      const acts=Object.values(MACT).filter(A=>A.g===g);const sides=g==='deck'||g==='chan'?SIDES:[null];
      for(const s of sides){
        h+='<div class="grp">'+esc(tl(gl)+(s?say(s==='L'?' · gauche':' · droite',s==='L'?' · left':' · right'):''))+'</div>';
        h+=acts.map(A=>{const k=keyOf(A.id,s),lr=MIDI.learn&&MIDI.learn.a===A.id&&(MIDI.learn.s||null)===(s||null);
          return '<div class="row"><span class="fn">'+esc(tl(A.l))+'</span><span class="mk">'+(k?esc(midiKeyText(k)):'—')+'</span>'
            +'<button type="button" class="mini'+(lr?' on':'')+'" data-act="learn" data-a="'+A.id+'" data-s="'+(s||'')+'">'+esc(lr?say('…','…'):say('Apprendre','Learn'))+'</button>'
            +(k?'<button type="button" class="mini x" data-act="unbind" data-a="'+A.id+'" data-s="'+(s||'')+'" aria-label="'+esc(say('Retirer','Remove'))+'">×</button>':'<span class="mini sp"></span>')+'</div>';}).join('');
      }
    }
    h+='</details>';
    h+='<div class="cols"><button type="button" class="opt" data-act="export"><span>'+esc(say('Exporter','Export'))+'</span></button><button type="button" class="opt" data-act="import"><span>'+esc(say('Importer','Import'))+'</span></button></div>';
  }
  m.innerHTML=h;midiLastShow();if(!$('planPanel').hidden)buildPlan();
}
function midiLastShow(){const el=$('midiLast');if(!el)return;el.innerHTML=MIDI.hist.length?MIDI.hist.map((x,i)=>'<div'+(i?' class="old"':'')+'>'+esc(x.t)+'</div>').join(''):esc(say('Touche un bouton du contrôleur : les messages reçus s’affichent ici.','Touch a control: the messages received show here.'));}
function placeMidi(){const m=$('midiPanel'),b=$('bMidi'),r=(b.offsetParent?b:$('bMenu')).getBoundingClientRect(),w=m.offsetWidth;
  m.style.left=Math.round(Math.max(8,Math.min(window.innerWidth-w-8,r.right-w)))+'px';m.style.top=Math.round(r.bottom+6)+'px';
  m.style.maxHeight=Math.round(window.innerHeight-r.bottom-18)+'px';}
function midiOpen(on){const m=$('midiPanel');if(on===undefined)on=m.hidden;m.hidden=!on;$('bMidi').setAttribute('aria-expanded',on);
  if(on){gearOpen(false);menu(false);ensureCtx();renderMidi();placeMidi();}else if(MIDI.learn){MIDI.learn=null;}}
function midiAct(b){
  const a=b.dataset.act;
  switch(a){
    case 'allow':ensureCtx();midiStart(true).then(()=>{renderMidi();placeMidi();});return;
    case 'port':{const p=midiInputs().find(x=>x.name===b.dataset.p);if(p)midiUse(p,true);return;}
    case 'tpl':{const k=b.dataset.t;if(MIDI.cfg.tpl===k&&!MIDI.cfg.custom)return;MIDI.cfg={tpl:k,map:MTPL[k].map(),custom:false};midiSave();MIDI.pick.clear();MIDI.leds.clear();renderMidi();return;}
    case 'reset':{const k=MIDI.cfg.tpl;MIDI.cfg={tpl:k,map:MTPL[k].map(),custom:false};midiSave();MIDI.pick.clear();MIDI.leds.clear();renderMidi();return;}
    case 'side':{const s=mstore.get('sides',{});s[b.dataset.s]=+b.dataset.n;const o=b.dataset.s==='L'?'R':'L';if(s[o]===s[b.dataset.s])delete s[o];mstore.set('sides',s);MIDI.pick.clear();renderMidi();return;}
    case 'learn':MIDI.open=true;if(MIDI.learn&&MIDI.learn.a===b.dataset.a&&(MIDI.learn.s||'')===b.dataset.s){MIDI.learn=null;renderMidi();return;}midiLearnStart(b.dataset.a,b.dataset.s);return;
    case 'learn-stop':MIDI.learn=null;renderMidi();return;
    case 'full':{const p=BOOTH.p.slice();for(const c of CH_OF){if(p.length>=2)break;if(!p.includes(c))p.push(c);}setBooth({p,m:true});MIDI.said={};renderMidi();return;}
    case 'ledtest':if(!midiLedTest())toast(say('Pas de voyants pilotables pour ce contrôleur (ou sortie MIDI absente)','No lights to drive on this controller (or no MIDI output)'),3000);return;
    case 'plan':midiOpen(false);showPlan(true);return;
    case 'jog0':MIDI.jogSum={};MIDI.hist=[];midiLastShow();return;
    case 'unbind':midiUnbind(b.dataset.a,b.dataset.s||null);return;
    case 'export':midiExport();return;
    case 'import':$('midiFile').click();return;
  }
}
function wireMidi(){
  const b=$('bMidi');if(!b)return;
  b.onclick=()=>midiOpen();
  $('midiPanel').addEventListener('click',e=>{const x=e.target.closest('button');if(x&&x.dataset.act)midiAct(x);});
  $('midiPanel').addEventListener('toggle',e=>{if(e.target.matches('details.maps'))MIDI.open=e.target.open;},true);
  $('midiPanel').addEventListener('input',e=>{if(e.target.id==='midiJog'){const v=+e.target.value;mstore.set('jogSens',v);$('midiJogV').textContent=Math.round(v*100)+' %';}});
  window.addEventListener('focus',()=>{if(MIDI.out){MIDI.leds.clear();midiInit();}});
  $('midiFile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)midiImport(f);};
  document.addEventListener('pointerdown',e=>{if(!$('midiPanel').hidden&&!e.target.closest('#midiPanel')&&!e.target.closest('#bMidi'))midiOpen(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('midiPanel').hidden)midiOpen(false);});
  window.addEventListener('resize',()=>{if(!$('midiPanel').hidden)placeMidi();});
  midiStart(false);
}
