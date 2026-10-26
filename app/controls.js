let LASTOFF=null;
/* ---------------- what each control does (CDJ-2000NXS2 manual behaviour) ---------------- */
const blink=hz=>Math.floor(now()*hz*2)%2===0;
function needMedia(){if(!anyMedia()){toast(say('Pas de média : charge le dossier de ta clé (bouton en haut) ou clique sur le port USB','No media: load your USB folder (top bar) or click the USB port'));return false;}return true;}
function goScr(d,s){const u=d.ui;u.scr=s;u.info=false;u.sort=null;d.dirty=true;}
function toggleScr(d,s,init){if(d.ui.scr===s){goScr(d,'play');return;}if(init)init();goScr(d,s);}
/* ---------- transport ---------- */
function cueDown(d){
  if(!d.loaded())return;
  if(d.playing){d.pause();if(d.loop){d.lastLoop=d.loop;d.loop=null;d.adjust=null;}d.ghost=null;d.seek(d.cue);return;}   /* back cue */
  const p=d.pos();
  if(Math.abs(p-d.cue)<.02){d.cueHold=true;d.play();}                                                  /* cue point sampler */
  else{d.cue=d.snap(p);d.seek(d.cue);}                                                                /* set cue while paused */
  d.dirty=true;
}
function cueUp(d){if(d.cueHold){d.cueHold=false;if(d.playing){d.pause();d.seek(d.cue);}d.dirty=true;}}
/* the CDJ-2000NXS2 has its own TOUCH/BRAKE and RELEASE/START knobs: they act on PLAY/PAUSE and on the jog touch */
function tBrake(d){return .04+d.kTouch*2.96;}
function tStart(d){return .04+d.kRel*2.96;}
function playBtn(d){
  if(!d.loaded())return;
  if(d.cueHold){d.cueHold=false;d.dirty=true;return;}
  if(d.playing&&d.touchTarget>0){const tb=tBrake(d);if(tb>.08){d.brakeT=tb;d.braking=true;d.touchTarget=0;}else d.pause();}
  else{const ts=tStart(d);d.braking=false;if(d.playing){d.startT=Math.max(.04,ts);d.touchTarget=1;}else{d.play();if(ts>.08){d.startT=ts;d.touch=0;d.touchTarget=1;}}}
  d.dirty=true;
}
/* ---------- hot cues: A-D on bank 1, E-H on bank 2; CALL/DELETE ---------- */
function padN(d,i){return d.bank*4+i+1;}
function hotDown(d,i){hotDownN(d,padN(d,i));}
/* hot cue n = 1..8 (A..H), whatever the bank shown */
function hotDownN(d,n){
  if(!d.loaded())return;const c=d.cur.hot[n];
  if(d.callHeld){d.callUsed=true;if(c){delete d.cur.hot[n];toast(say('Hot cue '+HL[n-1]+' effacé (ici seulement, la clé n’est pas modifiée)','Hot cue '+HL[n-1]+' deleted (here only, the USB is not changed)'));}d.dirty=true;return;}
  if(!c&&d.callMode&&d.cur.store[n]){d.cur.hot[n]=d.cur.store[n];if(!Object.keys(d.cur.store).some(k=>!d.cur.hot[k]))d.callMode=false;toast(say('Hot cue '+HL[n-1]+' rappelé','Hot cue '+HL[n-1]+' recalled'));d.dirty=true;return;}
  if(c){
    d.hotHeld={n};if(d.playing)d.slipBegin();
    if(c.end)d.setLoop(c.time,c.end,true);else{if(d.loop){d.lastLoop=d.loop;d.loop=null;}d.adjust=null;d.seek(c.time);}
    if(!d.playing)d.play();
  }else{
    const lp=d.loop;
    d.cur.hot[n]=lp?{hot:n,time:lp.a,end:lp.b,name:'',color:null,tmp:true}:{hot:n,time:d.snap(d.pos()),end:null,name:'',color:null,tmp:true};
    toast(say('Hot cue '+HL[n-1]+' posé (ici seulement)','Hot cue '+HL[n-1]+' set (here only)'));
  }
  d.dirty=true;
}
function hotUp(d,i){hotUpN(d,padN(d,i));}
function hotUpN(d,n){const h=d.hotHeld;if(!h||h.n!==n)return;d.hotHeld=null;d.slipCheck();}
function callDown(d){d.callHeld=true;d.callUsed=false;}
function callUp(d){d.callHeld=false;if(d.callUsed||!d.loaded())return;
  const pending=Object.keys(d.cur.store).filter(k=>!d.cur.hot[k]);
  if(!pending.length&&!d.callMode){toast(Object.keys(d.cur.store).length?say('CALL : les hot cues de ce morceau sont déjà chargés','CALL: this track’s hot cues are already loaded'):say('CALL : aucun hot cue enregistré pour ce morceau','CALL: no hot cue stored for this track'));return;}
  d.callMode=!d.callMode;d.dirty=true;}
/* ---------- memory cues ---------- */
function addMemory(d){
  if(!d.loaded())return;
  const m=d.loop?{hot:0,time:d.loop.a,end:d.loop.b,name:'',color:null,tmp:true}:{hot:0,time:d.cue,end:null,name:'',color:null,tmp:true};
  if(d.cur.mem.some(x=>Math.abs(x.time-m.time)<.01&&!!x.end===!!m.end)){toast(say('Ce point est déjà en mémoire','This point is already in memory'));return;}
  d.cur.mem.push(m);d.cur.mem.sort((a,b)=>a.time-b.time);toast(say('Memory '+(m.end?'loop':'cue')+' ajouté (ici seulement, la clé n’est pas modifiée)','Memory '+(m.end?'loop':'cue')+' added (here only, the USB is not changed)'));d.dirty=true;
}
function deleteMem(d){
  if(!d.loaded())return;
  if(!d.called||d.playing||Math.abs(d.pos()-d.called.time)>.02){toast(say('DELETE : rappelle d’abord un memory cue avec CUE/LOOP CALL, à l’arrêt','DELETE: first recall a memory cue with CUE/LOOP CALL, while paused'));return;}
  const i=d.cur.mem.indexOf(d.called);if(i>=0)d.cur.mem.splice(i,1);d.called=null;toast(say('Memory cue effacé (ici seulement)','Memory cue deleted (here only)'));d.dirty=true;
}
function cueCall(d,dir){
  if(!d.loaded())return;
  if(d.loop&&d.playing){d.loopScale(dir<0?.5:2);toast('LOOP '+fmtBeat(d.loopLenBeats())+' BEAT');return;}
  const p=d.called?d.called.time:d.pos(),m=d.cur.mem;if(!m.length)return;
  let c=null;if(dir>0)c=m.find(x=>x.time>p+.02);else for(let i=m.length-1;i>=0;i--)if(m[i].time<p-.02){c=m[i];break;}
  if(!c)return;
  d.pause();d.cue=c.time;d.called=c;d.ghost=null;
  if(c.end){d.loop={a:c.time,b:c.end};d.lastLoop=d.loop;}else d.loop=null;
  d.seek(c.time);if(c.name)toast(c.name);d.dirty=true;
}
/* ---------- search ---------- */
function beatJump(d,dir,nb){
  if(!d.loaded())return;const n=nb||d.jumpBeats||1;
  if(d.loop){d.loopMove(n*dir);return;}
  d.seek(n>=1?d.beatShift(d.pos(),n*dir):d.pos()+dir*n*d.spb());if(!d.playing)d.cue=d.pos();
}
function trackSearch(d,dir){
  if(!d.loaded())return;
  const t=now();const dbl=dir<0&&d._tsT&&t-d._tsT<.6;d._tsT=t;
  if(dir<0&&!dbl&&d.pos()>1.2){d.seek(d.loop?d.loop.a:0);if(!d.playing)d.cue=d._pos;return;}
  const L=d.cur.list||[];const i=L.indexOf(d.cur.tr);const nx=L[i+dir];
  if(nx)d.loadTrack(nx,{list:L});
}
/* ---------- loops ---------- */
function inDown(d){
  if(!d.loaded())return;
  if(d.loop){startAdjust(d,'in');return;}
  if(d.playing){const a=d.snap(d.pos());d.loopIn=a;d.cue=a;d._inT=setTimeout(()=>{d._inT=null;if(d.loopIn!==a)return;d.setLoop(a,d.beatShift(a,4),false);d.autoLen=4;toast('LOOP 4 BEAT');},1000);d.dirty=true;}
  else cueDown(d);
}
function inUp(d){if(d._inT){clearTimeout(d._inT);d._inT=null;}cueUp(d);}
function outDown(d){
  if(!d.loaded())return;
  if(d.loop){startAdjust(d,'out');return;}
  if(d.loopIn!=null&&d.playing){const b=d.snap(d.pos());if(!d.setLoop(d.loopIn,b,true))d.loopIn=null;}
}
function startAdjust(d,w){if(d.adjust===w){d.adjust=null;d.dirty=true;return;}d.adjust=w;d.adjOrig={a:d.loop.a,b:d.loop.b};d.adjT=now();toast(say((w==='in'?'IN':'OUT')+' ADJUST : jog ou SEARCH ◀◀ ▶▶',(w==='in'?'IN':'OUT')+' ADJUST: jog or SEARCH ◀◀ ▶▶'));d.dirty=true;}
function reloopBtn(d){
  if(!d.loaded())return;
  if(d.loop&&(d.playing||d.adjust))d.exitLoop();
  else if(d.loop)d.play();
  else if(d.lastLoop){d.setLoop(d.lastLoop.a,d.lastLoop.b,true);if(!d.playing)d.play();}
  d.dirty=true;
}
function fourDown(d){if(!d.loaded())return;if(d.loop){d.loopScale(.5);toast('LOOP CUTTER : '+fmtBeat(d.loopLenBeats())+' BEAT');return;}d._4T=setTimeout(()=>{d._4T=null;d.beatLoop(8);},1000);}
function fourUp(d){if(d._4T){clearTimeout(d._4T);d._4T=null;d.beatLoop(4);}}
/* ---------- direction lever: up = SLIP REVERSE (spring), middle = FWD, down = REV ---------- */
function applyDir(d){d.advance();const dir=(d.rev||d.slipRevHeld)?-1:1;if(dir!==d.dir){d.dir=dir;d.startSrc();}d.dirty=true;}
function setLever(d,p){
  if(p===d.lever)return;
  if(d.lever===-1&&p!==-1){d.slipRevHeld=false;clearTimeout(d._srT);}
  d.lever=p;d.rev=p===1;
  if(p===-1){d.slipRevHeld=true;if(d.playing&&!d.ghost)d.ghost={pos:d._pos};const sp=d.spb()/d.rate;clearTimeout(d._srT);
    d._srT=setTimeout(()=>{if(d.slipRevHeld){d.slipRevHeld=false;applyDir(d);if(d.dir>0)d.slipEnd();}},8*sp*1000);}
  if(p===1)d.slipBegin();
  applyDir(d);if(d.dir>0)d.slipCheck();
}
/* ---------- browse side ---------- */
function backBtn(d,long){
  const u=d.ui;
  if(long){if(anyMedia()){u.nav=[{k:'media',sel:0,top:0}];goScr(d,'browse');}return;}
  if(u.sort){u.sort=null;return;}if(u.info){u.info=false;return;}
  switch(u.scr){
    case 'browse':if(u.nav.length>1)u.nav.pop();else goScr(d,'play');break;
    case 'utility':if(u.util.edit)u.util.edit=false;else goScr(d,'play');break;
    case 'filter':if(u.filt.pad!=null)u.filt.pad=null;else goScr(d,u.filt.from||'play');break;
    case 'taglist':case 'menu':case 'iplay':case 'shortcut':goScr(d,'play');break;
  }
  d.dirty=true;
}
function selTrack(d){
  const u=d.ui;
  if(u.scr==='browse'){const nv=curNav(d);if(nv.k==='search'){const it=levelItems(d,{k:'search'})[u.search.sel];return it?it.tr:null;}const it=u.items[nv.sel];return it&&it.kind==='track'?it.tr:null;}
  if(u.scr==='taglist'){const it=levelItems(d,{k:'taglist'})[u.tl.sel];return it?it.tr:null;}
  return d.cur?d.cur.tr:null;
}
function tagTrack(d){
  const tr=selTrack(d);if(!tr)return;
  const i=TAGLIST.indexOf(tr);
  if(d.ui.scr==='taglist'){if(i>=0)TAGLIST.splice(i,1);toast(say('Retiré de la TAG LIST','Removed from TAG LIST'));d.dirty=true;return;}
  if(i>=0){TAGLIST.splice(i,1);toast(say('« '+tr.title+' » retiré de la TAG LIST','“'+tr.title+'” removed from TAG LIST'));}
  else{if(TAGLIST.length>=100){toast(say('TAG LIST pleine (100 morceaux)','TAG LIST full (100 tracks)'));return;}TAGLIST.push(tr);toast(say('« '+tr.title+' » ajouté à la TAG LIST ('+TAGLIST.length+')','“'+tr.title+'” added to TAG LIST ('+TAGLIST.length+')'));}
  d.dirty=true;
}
function infoBtn(d){
  if(!needMedia())return;const u=d.ui;
  if(u.scr==='browse'||u.scr==='taglist'){u.sort=null;u.info=!u.info;return;}
  toggleScr(d,'iplay',()=>{u.iplay.sel=0;u.iplay.top=0;});
}
function menuBtn(d){
  if(!needMedia())return;const u=d.ui;
  if(u.scr==='browse'||u.scr==='taglist'){
    const items=u.scr==='taglist'?[]:u.items;
    if(u.sort){u.sort=null;return;}
    if(u.scr==='browse'&&items.some(x=>x.kind==='track')){u.info=false;const cur=curNav(d).sortCol||25;u.sort={sel:Math.max(0,(navMedium(d)||RM).sortMenu.indexOf(cur))};}
    else toast(say('SORT : disponible dans une liste de morceaux','SORT: available in a track list'));
    return;}
  toggleScr(d,'menu',()=>{u.menu.sel=0;});
}
function filterBtn(d,long){
  if(!needMedia())return;const u=d.ui;
  if(long){if(u.scr==='filter'){goScr(d,u.filt.from||'play');return;}u.filt.from=['browse','taglist'].includes(u.scr)?u.scr:'play';u.filt.pad=null;goScr(d,'filter');return;}
  const M=fm(d);if(!M)return;
  if(!filterHasCond(M)){toast(u.scr==='filter'?say('TRACK FILTER : coche au moins une condition','TRACK FILTER: tick at least one condition'):say('TRACK FILTER : aucune condition. Maintiens le bouton 1 s pour EDIT.','TRACK FILTER: no condition. Hold the button 1 s for EDIT.'));return;}
  M.filter.on=!M.filter.on;for(const n of u.nav){n.sel=0;n.top=0;}toast(M.filter.on?'TRACK FILTER ON':'TRACK FILTER OFF');d.dirty=true;
}
/* ---------- rotary selector ---------- */
function rotaryTurn(d,dir){
  const u=d.ui;d.selTarget=(d.selTarget||0)+dir*15;d.dirty=true;
  if(u.sort){u.sort.sel=clamp(u.sort.sel+dir,0,(navMedium(d)||RM).sortMenu.length-1);return;}
  switch(u.scr){
    case 'play':case 'menu':if(u.scr==='menu'){u.menu.sel=Math.max(0,u.menu.sel+dir);return;}
      if(d.grid){d.gridOff=(d.gridOff||0)+dir*.004;toast('SHIFT GRID '+(d.gridOff>=0?'+':'')+Math.round(d.gridOff*1000)+' ms');}else d.zi=clamp(d.zi-dir,0,ZOOMS.length-1);return;
    case 'browse':{const nv=curNav(d);if(nv.k==='search'){u.search.sel=Math.max(0,u.search.sel+dir);return;}
      if(d.selHeld){letterJump(d,dir);return;}nv.sel=clamp(nv.sel+dir,0,Math.max(0,u.items.length-1));return;}
    case 'taglist':u.tl.sel=Math.max(0,u.tl.sel+dir);return;
    case 'iplay':u.iplay.sel=Math.max(0,u.iplay.sel+dir);return;
    case 'utility':utilStep(d,dir);return;
    case 'filter':{const f=u.filt;if(f.tab===1){const E=fm(d).ext;if(!E)return;const cats=E.cats.length?E.cats:[{id:null}];const tags=E.tags.filter(t=>cats[f.tcol].id==null||t.parent===cats[f.tcol].id);
        f.tsel+=dir;if(f.tsel<0){if(f.tcol>0){f.tcol--;f.tsel=1e9;}else f.tsel=0;}else if(f.tsel>=tags.length){if(f.tcol<cats.length-1){f.tcol++;f.tsel=0;}else f.tsel=tags.length-1;}
        const t2=E.tags.filter(t=>cats[f.tcol].id==null||t.parent===cats[f.tcol].id);f.tsel=clamp(f.tsel,0,Math.max(0,t2.length-1));}
      else f.sel=clamp(f.sel+dir,0,3);return;}
    case 'shortcut':return;
  }
}
function letterJump(d,dir){
  const nv=curNav(d),items=d.ui.items;if(!items.length)return;const lab=it=>(it.kind==='track'?it.tr.title:it.label||'').toUpperCase();
  const sorted=!nv.sortCol||nv.sortCol===25||nv.sortCol===26;
  if(!sorted||nv.k==='pl'||nv.by==='pl'){nv.sel=clamp(nv.sel+dir*LROWS,0,items.length-1);return;}
  const c0=lab(items[nv.sel])[0]||'';let i=nv.sel;
  if(dir>0){while(i<items.length-1&&(lab(items[i])[0]||'')===c0)i++;}else{i=Math.max(0,i-1);const c1=lab(items[i])[0]||'';while(i>0&&(lab(items[i-1])[0]||'')===c1)i--;}
  nv.sel=i;d.jumpLetter={c:lab(items[i])[0]||'',t:now()};
}
function rotaryPush(d){
  const u=d.ui;
  if(u.sort){sortApply(d);return;}
  switch(u.scr){
    case 'browse':{const nv=curNav(d);if(nv.k==='search'){const L=levelItems(d,{k:'search'});const it=L[u.search.sel];if(it)d.loadTrack(it.tr,{list:L.map(x=>x.tr)});return;}listEnter(d,'browse');return;}
    case 'taglist':listEnter(d,'taglist');return;
    case 'menu':menuLoad(d);return;
    case 'iplay':infoJump(d);return;
    case 'utility':utilEnter(d);return;
    case 'filter':{const f=u.filt,F=fm(d).filter;if(f.tab===1){const E=fm(d).ext;if(!E)return;const cats=E.cats.length?E.cats:[{id:null}];const M=fm(d),c=cats[f.tcol];const tags=catTags(M,c);const t=tags[f.tsel];if(t)toggleTag(M,c,t);}
      else{const k=['bpm','key','rating','color'][f.sel];F[k]=!F[k];if(k==='color'&&F.color&&!F.colors.size)toast(say('COLOR : touche les couleurs à garder','COLOR: touch the colours to keep'));}return;}
    case 'play':if(d.grid){d.gridOff=0;toast('GRID RESET');}return;
  }
}
function rotaryHold(d){
  const u=d.ui;
  if(u.scr==='play'&&d.loaded()){d.grid=!d.grid;toast(d.grid?say('GRID ADJUST : tourne le sélecteur pour décaler la grille, appuie pour RESET','GRID ADJUST: turn the selector to shift the grid, push to RESET'):'GRID ADJUST OFF');d.dirty=true;return true;}
  if(u.scr==='browse'){d.selHeld=true;return true;}
  return false;
}
/* ---------- the key table: name of the face key -> behaviour ---------- */
function keyActions(d){return {
  play:{down:()=>playBtn(d)},
  cue:{down:()=>cueDown(d),up:()=>cueUp(d)},
  hot_cue_a:{down:()=>hotDown(d,0),up:()=>hotUp(d,0)},hot_cue_b:{down:()=>hotDown(d,1),up:()=>hotUp(d,1)},
  hot_cue_c:{down:()=>hotDown(d,2),up:()=>hotUp(d,2)},hot_cue_d:{down:()=>hotDown(d,3),up:()=>hotUp(d,3)},
  bank_rev:{down:()=>{d.bank=0;d.dirty=true;}},bank_fwd:{down:()=>{d.bank=1;d.dirty=true;}},
  hot_cue_call:{down:()=>callDown(d),up:()=>callUp(d)},
  track_rev:{down:()=>trackSearch(d,-1)},track_fwd:{down:()=>trackSearch(d,1)},
  scan_rev:{down:()=>scanStart(d,-1),up:()=>scanStop(d)},scan_fwd:{down:()=>scanStart(d,1),up:()=>scanStop(d)},
  loop_in:{down:()=>inDown(d),up:()=>inUp(d)},loop_out:{down:()=>outDown(d)},reloop:{down:()=>reloopBtn(d)},
  four_beat:{down:()=>fourDown(d),up:()=>fourUp(d)},
  slip:{down:()=>{d.slip=!d.slip;if(!d.slip)d.ghost=null;d.dirty=true;}},
  call_rev:{down:()=>cueCall(d,-1)},call_fwd:{down:()=>cueCall(d,1)},
  delete:{down:()=>deleteMem(d)},memory:{down:()=>addMemory(d)},
  quantize:{down:()=>{d.quant=!d.quant;d.dirty=true;}},
  time_mode:{press:()=>{d.remain=!d.remain;d.dirty=true;},long:()=>{d.autoCueOn=!d.autoCueOn;toast(d.autoCueOn?'AUTO CUE ON ('+sv('autoCueLevel')+')':'AUTO CUE OFF');d.dirty=true;}},
  browse:{press:()=>{if(!needMedia())return;if(d.ui.scr==='browse')goScr(d,'play');else goScr(d,'browse');},
    long:()=>{if(!needMedia())return;const M=navMedium(d)||RM;d.ui.nav=[{k:'media',sel:0,top:0},{k:'root',m:M,label:M.name,sel:0,top:0},{k:'search',label:'SEARCH',sel:0,top:0}];d.ui.search.q='';goScr(d,'browse');}},
  tag_list:{press:()=>{if(!needMedia())return;toggleScr(d,'taglist');}},
  info:{press:()=>infoBtn(d),long:()=>toast(say('LINK INFO : aucune autre platine reliée en PRO DJ LINK','LINK INFO: no other player linked over PRO DJ LINK'))},
  menu:{press:()=>menuBtn(d),long:()=>{d.ui.util.edit=false;if(d.ui.scr==='utility')goScr(d,'play');else goScr(d,'utility');}},
  back:{press:()=>backBtn(d,false),long:()=>backBtn(d,true)},
  tag_track:{press:()=>tagTrack(d)},
  track_filter:{press:()=>filterBtn(d,false),long:()=>filterBtn(d,true)},
  short_cut:{press:()=>{if(!needMedia())return;toggleScr(d,'shortcut');}},
  usb:{press:()=>{if(!needMedia())return;d.ui.nav=[{k:'media',sel:0,top:0}];goScr(d,'browse');}},
  pc:{press:()=>toast(say('PC : rekordbox sur ordinateur (LINK EXPORT) n’est pas simulé','PC: rekordbox on a computer (LINK EXPORT) is not simulated'))},
  link:{press:()=>toast(say('LINK : aucune autre platine sur le réseau PRO DJ LINK','LINK: no other player on the PRO DJ LINK network'))},
  sd:{press:()=>toast(say('SD : aucune carte insérée','SD: no card inserted'))},disc:{press:()=>toast(say('DISC : aucun disque','DISC: no disc'))},
  eject:{press:()=>toast(say('DISC EJECT : aucun disque','DISC EJECT: no disc'))},
  usb_stop:{press:()=>toast(say('USB STOP : maintiens le bouton pour démonter la clé','USB STOP: hold the button to unmount the USB')),long:()=>{const M=navMedium(d)||(d.cur&&d.cur.tr.m)||mounted().slice(-1)[0];if(!M||!M.mounted)return;if(DECKS.some(x=>x.playing&&x.cur&&x.cur.tr.m===M)){toast(say('USB STOP : arrête d’abord la lecture','USB STOP: stop playback first'));return;}
    unmount(M);LASTOFF=M;toast(say('Clé « '+M.name+' » démontée. Clique sur le port USB pour la remettre.','USB “'+M.name+'” unmounted. Click the USB port to plug it back.'),4000);}},
  usb_indicator:{press:()=>{const M=LASTOFF||MEDIA.find(m=>!m.mounted);if(!M){if(!MEDIA.length)toast(say('Charge d’abord le dossier de la clé','Load the USB folder first'));return;}M.mounted=true;LASTOFF=null;RM=M;applyMediumSettings(M);toast(say('Clé « '+M.name+' » connectée','USB “'+M.name+'” connected'));}},
  jog_mode:{down:()=>{d.vinyl=!d.vinyl;d.dirty=true;}},
  sync:{press:()=>{d.setSync(!d.sync);if(d.sync&&BUS.master===d&&DECKS.length===1)toast(say('SYNC : pas d’autre platine, ce lecteur devient MASTER','SYNC: no other player, this one becomes MASTER'));},long:()=>toast(say('INSTANT DOUBLES : il faut une autre platine','INSTANT DOUBLES: needs another player'))},
  master:{down:()=>{if(!d.loaded()){toast(say('MASTER : charge un morceau','MASTER: load a track'));return;}BUS.setMaster(BUS.master===d?null:d);}},
  tempo_range:{down:()=>{d.rangeIdx=(d.rangeIdx+1)%4;d.applyTempo();}},
  master_tempo:{down:()=>{d.mt=!d.mt;d.dirty=true;if(d.mt)toast(say('MASTER TEMPO : voyant seulement ici, la hauteur suit le tempo','MASTER TEMPO: indicator only here, pitch follows tempo'));}},
  tempo_reset:{down:()=>{d.tReset=!d.tReset;d.applyTempo();}},
};}
function scanStart(d,dir){
  if(!d.loaded())return;let n=0;
  const step=()=>{if(d.adjust){d.adjustStep(dir/75);return;}n++;const fast=d.jogHeld?6:1;d.seek(d.pos()+dir*.12*(1+Math.min(n,40)/5)*fast);if(!d.playing)d.cue=d._pos;};
  step();clearInterval(d._scan);d._scan=setInterval(step,70);
}
function scanStop(d){clearInterval(d._scan);d._scan=null;}
/* ---------- lights of each key ---------- */
function keyLight(d,name){
  const ld=d.loaded(),u=d.ui;
  switch(name){
    case 'play':return ld&&(d.playing&&d.touchTarget>0?true:blink(1));
    case 'cue':if(!ld)return false;if(d.playing)return true;return Math.abs(d._pos-d.cue)<.02?true:blink(1);
    case 'loop_in':if(d.adjust==='in')return blink(2);return !!d.loop||d.loopIn!=null;
    case 'loop_out':if(d.adjust==='out')return blink(2);return !!d.loop;
    case 'reloop':return !!d.loop||!!d.lastLoop;
    case 'four_beat':return !!d.loop;
    case 'slip':return d.slip&&(!SET.slipFlash||!d.ghost||blink(2));
    case 'quantize':return d.quant;
    case 'master_tempo':return d.mt;
    case 'sync':return d.sync;
    case 'master':return BUS.master===d;
    case 'tempo_reset':return d.tReset;
    case 'call_rev':case 'call_fwd':return ld&&(d.cur.mem.length>0||!!d.loop);
    case 'browse':return u.scr==='browse';
    case 'tag_list':return u.scr==='taglist';
    case 'info':return u.info||u.scr==='iplay';
    case 'menu':return !!u.sort||u.scr==='menu'||u.scr==='utility';
    case 'usb':return anyMedia();
    case 'usb_indicator':return anyMedia();
    case 'bank_rev':return d.bank===0;case 'bank_fwd':return d.bank===1;
    case 'track_filter':return filterActive(fm(d))||u.scr==='filter';
    case 'short_cut':return u.scr==='shortcut';
    case 'jog_mode':return false;
    case 'time_mode':return false;
  }
  return false;
}
function padLight(d,i){
  if(!d.loaded())return null;const n=padN(d,i),c=d.cur.hot[n];
  if(c){if(d.callHeld)return blink(2)?hotColor(c):null;return hotColor(c);}
  if(d.callMode&&d.cur.store[n])return blink(2)?hotColor(d.cur.store[n]):null;
  return null;
}
