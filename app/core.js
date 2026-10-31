'use strict';
/* ---------------- shared utilities and the media library ---------------- */
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const norm=p=>String(p||'').normalize('NFC').toLowerCase();
const now=()=>performance.now()/1000;
const HL='ABCDEFGH';
const MEMC=[null,'#ff6ec7','#ff3b3b','#ff9c2a','#ffe14a','#46e06b','#3fe0d8','#4a7bff','#b05cff'];
const COLNAME=['','Pink','Red','Orange','Yellow','Green','Aqua','Blue','Purple'];
const RANGES=[6,10,16,100],STEPS=[0.02,0.05,0.05,0.5];
function fmtBeat(n){return n>=1?String(Math.round(n*100)/100):'1/'+Math.round(1/n);}
function lowerBound(b,ms){let lo=0,hi=b.length;while(lo<hi){const m=(lo+hi)>>1;if(b[m].t<ms)lo=m+1;else hi=m;}return lo;}
function fmtT(s){s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
/* site language (the deck itself stays in English, like the real one) */
let LANG=(()=>{try{const v=localStorage.getItem('bc.lang');if(v==='fr'||v==='en')return v;}catch(e){}return /^fr/i.test(navigator.language||'')?'fr':'en';})();
function say(fr,en){return LANG==='en'?en:fr;}
let STATUS={msg:'',until:0};
function toast(t,ms){STATUS.msg=t;STATUS.until=Date.now()+(ms||2600);STATUS.src='deck';}
/* ---------- player settings ----------
   Values follow the rekordbox My Settings files written to the USB (MYSETTING.DAT, MYSETTING2.DAT, DEVSETTING.DAT);
   defaults = the player's factory settings, marked * in the manual p. 38. [key, label, options, default, file, offset, base] */
const SETDEF=[
 ['playMode','PLAY MODE',['CONTINUE','SINGLE'],0,'my',23,0x80],
 ['ejectLock','EJECT/LOAD LOCK',['UNLOCK','LOCK'],0,'my',21,0x80],
 ['qbv','QUANTIZE BEAT VALUE',['1 Beat','1/2 Beat','1/4 Beat','1/8 Beat'],0,'my',24,0x80],
 ['hcAuto','HOT CUE AUTO LOAD',['OFF','ON','rekordbox SETTING'],2,'my',25,0x80],
 ['hcColor','HOT CUE COLOR',['OFF','ON'],0,'my',26,0x80],
 ['autoCueLevel','AUTO CUE LEVEL',['-36dB','-42dB','-48dB','-54dB','-60dB','-66dB','-72dB','-78dB','MEMORY'],8,'my',11,0x80],
 ['slipFlash','SLIP FLASHING',['OFF','ON'],1,'my',16,0x80],
 ['onAir','ON AIR DISPLAY',['OFF','ON'],1,'my',8,0x80],
 ['jogRing','JOG BRIGHTNESS',['OFF','1','2'],2,'my',14,0x80],
 ['jogInd','JOG INDICATOR',['OFF','ON'],1,'my',15,0x80],
 ['discSlot','DISC SLOT ILLUMINATION',['OFF','1','2'],2,'my',20,0x80],
 ['language','LANGUAGE',['ENGLISH','FRANÇAIS','DEUTSCH','ITALIANO','NEDERLANDS','ESPAÑOL','РУССКИЙ','한국어','简体中文','繁體中文','日本語','PORTUGUÊS','SVENSKA','ČEŠTINA','MAGYAR','DANSK','ΕΛΛΗΝΙΚΆ','TÜRKÇE'],0,'my',12,0x81],
 ['historyName','HISTORY NAME',['HISTORY'],0,null],
 ['playerNo','PLAYER No.',['AUTO','1','2','3','4'],0,null],
 ['linkStatus','LINK STATUS',['NOT CONNECTED'],0,null,null,null,true],
 ['midiCh','MIDI CHANNEL',Array.from({length:16},(_,i)=>String(i+1)),0,null],
 ['digitalOut','DIGITAL OUT',['16bit','24bit'],1,null],
 ['autoStandby','AUTO STANDBY',['OFF','ON'],1,null],
 ['lcd','LCD BRIGHTNESS',['1','2','3','4','5'],2,'my',9,0x81],
 ['touchCal','TOUCH DISPLAY CALIBRATION',[''],0,null,null,null,true],
 ['screenSaver','SCREEN SAVER',['OFF','ON'],1,null],
 ['duplication','DUPLICATION',['PLAYER 2','PLAYER 3','PLAYER 4'],0,null],
 ['version','VERSION No.',['—'],0,null,null,null,true],
];
const UTIL_COUNT=SETDEF.length;
/* order of the choices on the UTILITY screen when it differs from the order of the values in the files (manual p. 38) */
const UTIL_ORDER={qbv:[3,2,1,0],hcAuto:[1,2,0]};
/* My Settings values set elsewhere on the player (buttons, SHORTCUT), still read from the USB */
const SETDEF2=[
 ['timeMode',['ELAPSED','REMAIN'],1,'my',32,0x80],['autoCue',['OFF','ON'],1,'my',34,0x80],['jogMode',['CDJ','VINYL'],1,'my',33,0x80],
 ['tempoRange',['±6%','±10%','±16%','WIDE'],1,'my',36,0x80],['masterTempo',['OFF','ON'],0,'my',35,0x80],['quantize',['OFF','ON'],1,'my',10,0x80],
 ['sync',['OFF','ON'],0,'my',22,0x80],['needleLock',['UNLOCK','LOCK'],1,'my',29,0x80],['phaseMeter',['TYPE 1','TYPE 2'],0,'my',37,0x80],['vinylAdj',['TOUCH & RELEASE','TOUCH','RELEASE'],1,'my2',0,0x80],
 ['wfColor',['BLUE','RGB'],0,'dev',10,null],['keyFmt',['CLASSIC','ALPHANUMERIC'],0,'dev',12,null],['ovType',['HALF WAVEFORM','FULL WAVEFORM'],0,'dev',9,null],['wfPos',['CENTER','LEFT'],0,'dev',13,null],
];
const DEVMAP={wfColor:{1:0,3:1,4:1},keyFmt:{1:0,2:1},ovType:{1:0,2:1},wfPos:{1:0,2:1}};
const SET={},SETSRC={};
/* the USB indicator blinks while the player reads the USB (manual p. 14): until this time after a mount; the length is ours */
let USBCOMM=0;
function resetSettings(){for(const d of SETDEF){SET[d[0]]=d[3];SETSRC[d[0]]='default';}for(const d of SETDEF2){SET[d[0]]=d[2];SETSRC[d[0]]='default';}}
resetSettings();
const sv=k=>{const d=SETDEF.find(x=>x[0]===k);if(d)return d[2][SET[k]];const e=SETDEF2.find(x=>x[0]===k);return e?e[1][SET[k]]:'';};
function parseSettings(files){
  const out={},found=[];
  const all=SETDEF.filter(d=>d[4]).map(d=>({k:d[0],n:d[2].length,file:d[4],off:d[5],base:d[6]})).concat(SETDEF2.map(d=>({k:d[0],n:d[1].length,file:d[3],off:d[4],base:d[5]})));
  for(const [kind,buf] of Object.entries(files)){if(!buf||buf.length<104+14)continue;found.push(kind);
    for(const d of all){if(d.file!==kind)continue;const v=buf[104+d.off];if(v==null)continue;
      const idx=kind==='dev'?DEVMAP[d.k][v]:v-d.base;if(idx!=null&&idx>=0&&idx<d.n)out[d.k]=idx;}}
  return {values:out,found};
}
/* ---------- the USB keys plugged in (shared by every deck) ---------- */
const MEDIA=[];let RM=null;const TAGLIST=[];
/* HISTORY NAME (UTILITY, manual p. 39): the name of the history lists, 32 characters at most */
let HISTNAME='HISTORY';
const mounted=()=>MEDIA.filter(m=>m.mounted);
const anyMedia=()=>MEDIA.some(m=>m.mounted);
function newFilter(){return {on:false,bpm:false,bpmVal:0,bpmPct:6,key:false,keyVal:'',related:false,rating:false,ratingVal:3,color:false,colors:new Set(),tags:new Set(),catOn:new Set(),and:true};}
