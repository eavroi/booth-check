/* ---------------- the touch screen: one page per mode, drawn like the CDJ-2000NXS2 firmware ---------------- */
const ZOOMS=[37.5,75,150,300,600];       /* px per second; the first one on loading (firmware) */
const LOADED_C='#3fd23f',PLAYED_C='#1c8a24';
const LROWS=8,LROWH=30,LY=46;
function hit(d,x,y,w,h,fn,o){d.ui.hits.push(Object.assign({x,y,w,h,fn},o||{}));}
/* title bar and scroll bar colours: those of the USB shown, or the one under the cursor in BACKGROUND COLOR */
function bgc(d){const u=d.ui,M=(u.scr==='browse'&&navMedium(d))||(d.cur&&d.cur.tr.m)||RM;return BGCOL[u.pop&&u.pop.bg?u.pop.sel:M?M.bg:0];}
function drawLcd(d,g){
  d.ui.hits=[];g.fillStyle='#000';g.fillRect(0,0,800,480);
  const u=d.ui,s=u.scr;
  if(!anyMedia()){noMedia(d,g);return;}
  const full=(s==='browse'&&curNav(d).k==='search')||(s==='filter'&&u.filt.pad!=null)||s==='hname';
  if(!full)lower(d,g);
  switch(s){
    case 'browse':if(curNav(d).k==='search')drawSearch(d,g);else drawList(d,g,'browse');break;
    case 'taglist':drawList(d,g,'taglist');break;
    case 'search':drawSearch(d,g);break;
    case 'iplay':drawInfoPlay(d,g);break;
    case 'menu':drawLoadPrev(d,g);break;
    case 'utility':drawUtility(d,g);break;
    case 'shortcut':drawShortcut(d,g);break;
    case 'filter':drawFilter(d,g);break;
    case 'hname':drawHistName(d,g);break;
    default:drawPlayUpper(d,g);
  }
  if(u.pop)popPanel(d,g);
  lcdBright(g);
}
/* LCD BRIGHTNESS 1-5, 3 = as drawn (factory setting, manual p. 38); 1-2 darker, 4-5 brighter (the steps are ours, not in the manual) */
function lcdBright(g){
  const dim=[.36,.18][SET.lcd];if(dim){g.fillStyle='rgba(0,0,0,'+dim+')';g.fillRect(0,0,800,480);return;}
  const up=[0,0,0,.18,.36][SET.lcd];if(!up)return;const t=g.getTransform();
  g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='lighter';g.globalAlpha=up;g.drawImage(g.canvas,t.e,t.f,800*t.a,480*t.d,t.e,t.f,800*t.a,480*t.d);g.restore();
}
function noMedia(d,g){
  lower(d,g);
  if(d.ui.scr==='hname'){drawHistName(d,g);return;}
  if(d.ui.scr==='utility'){drawUtility(d,g);return;}
  T(g,'NO DISC',400,400,22,'#ff1a1a',LF,400,'center');
}
/* ---------- lower half: player status, under every page except full-screen ones ---------- */
function lower(d,g){
  const ld=d.loaded(),cur=d.cur,tr=cur&&cur.tr,pos=ld?d.pos():0;
  const sg=g.createLinearGradient(0,292,0,299);sg.addColorStop(0,'#000');sg.addColorStop(.45,'#0b2030');sg.addColorStop(1,'#000');g.fillStyle=sg;g.fillRect(18,292,764,7);
  box(g,18,302,67,60,null,'#e8e8e8',1.4);T(g,'PLAYER',51.5,318,13,'#fff',LA,400,'center');T(g,String(d.pn),51.5,353,39,'#fff',LN,300,'center');
  T(g,SET.playMode===0?'CONTINUE':'SINGLE',51.5,382,13,'#fff',LA,400,'center');
  /* QUANTIZE in grey when it cannot act: a track not analysed, without a beat grid (manual p. 14) */
  const qc=d.quant&&!(ld&&d.beats().length<2)?'#ff0000':'#5a5a5a';T(g,'QUANTIZE',51.5,420,13,qc,LA,400,'center');box(g,18,427,67,27,null,qc,1.4);T(g,fmtBeat(d.qBeat),51.5,447,20,qc,LN,400,'center');
  hit(d,18,405,67,52,()=>{d.quant=!d.quant;d.dirty=true;});
  T(g,'TRACK',105,315,13,'#fff',LA,400,'left');
  let tn='00';if(cur){const L=cur.list||[];const i=L.indexOf(tr);tn=String(i>=0?i+1:1).padStart(2,'0');}
  T(g,tn,101,361,46,'#fff',LN,300,'left');
  if(SET.hcAuto!==0){const col=SET.hcAuto===2?'#ffffff':'#ff1a1a';chip(g,183,318,70,16,'A.HOT CUE',col);}
  if(d.autoCueOn){const col=SET.autoCueLevel===8?'#ffffff':'#ff1a1a';chip(g,183,339,70,16,'A.CUE',col);}
  if(d.remain)T(g,'REMAIN',290,315,13,'#fff',LA,400,'left');
  /* IN / OUT ADJUST: the time of the loop point being set is shown, in the time mode in use (manual p. 24-25, firmware) */
  const adj=ld?adjPoint(d):null,tp=adj!=null?adj:pos;
  const tv=ld?(d.remain?d.dur-tp:tp):0,[mm,ss,ms]=fmtMs(tv);
  const tc='#fff';
  let x=286;g.fillStyle=tc;g.textAlign='left';g.font='300 55px '+LN;for(const ch of mm){g.fillText(ch,x,361);x+=g.measureText(ch).width+1;}
  g.font='300 44px '+LN;g.fillText(':',x+1,356);x+=g.measureText(':').width+3;g.font='300 55px '+LN;for(const ch of ss){g.fillText(ch,x,361);x+=g.measureText(ch).width+1;}
  g.font='300 38px '+LN;g.fillText('.'+ms,x,361);
  hit(d,286,300,220,66,()=>{d.remain=!d.remain;});
  /* tempo */
  if(d.mt){box(g,573,302,35,17,null,'#ff1a1a',1.4);T(g,'MT',590.5,315.5,13,'#ff1a1a',LA,700,'center');}
  if(d.sync){box(g,617,302,44,17,'#dcdcdc');T(g,'SYNC',639,315.5,13,'#000',LA,700,'center');}
  if(d.sync&&BUS.master&&BUS.master!==d){T(g,'BPM',522,315,13,'#555',LA,400,'left');const b=ld&&tr.bpm?tr.bpm*d.sliderRate():0;
    if(b){const s=b.toFixed(1).split('.');digits(g,s[0],'.'+s[1],645,361,46,46,'#4a4a4a','right');}}
  else{T(g,'TEMPO',520,315,13,'#fff',LA,400,'left');
    const pct=d.tReset?0:d.tempoPct(),ps=Math.abs(pct).toFixed(2),[ip,fp]=ps.split('.');
    const w=digits(g,ip,'.'+fp,645,361,46,46,'#fff','right');
    if(pct<0)g.fillRect(645-w-24,344,13,2);if(pct>0){g.fillRect(645-w-25,344,15,2);g.fillRect(645-w-18.5,337.5,2,15);}
    T(g,'%',647,361,17,'#fff',LA,400,'left');}
  /* bpm */
  const M=BUS.master===d,bc=M?'#ff7a1a':'#fff';box(g,679,302,103,60,null,bc,1.5);
  const bpm=ld&&tr.bpm?d.bpmNow():0;
  if(bpm){const s=bpm.toFixed(1).split('.');digits(g,s[0],'.'+s[1],777,M?342:347,47,27,bc,'right');}
  if(M){g.fillStyle=bc;g.fillRect(679,349,103,13);T(g,'MASTER',730.5,359.5,13,'#000',LA,700,'center');}else T(g,'BPM',777,358,11,'#fff',LA,700,'right');
  hit(d,679,302,103,60,()=>{BUS.setMaster(d);});
  /* the range, in its colour on the firmware: ±6 green, ±10 red, ±16 white, WIDE in red letters */
  const rg=RANGES[d.rangeIdx],rc={6:'#00ff00',10:'#ff0000',16:'#ffffff'}[rg];
  if(rc){box(g,715,382,67,23,rc);T(g,'±'+rg,748.5,401,21,'#000',LN,400,'center');}else T(g,'WIDE',748.5,401,21,'#ff0000',LN,400,'center');
  hit(d,715,382,67,23,()=>{d.rangeIdx=(d.rangeIdx+1)%4;d.applyTempo();});
  /* LOOP: orange while the loop is active, grey once out of it; a loop set by hand has no length to show */
  if(d.loop||d.lastLoop){const on=!!d.loop,lc=on?'#ff7100':'#838183',tc2=on?'#000':'#838183';
    loopIcon(g,719,412,lc);T(g,'LOOP',741,421,13,lc,LA,400,'left');
    box(g,715,427,67,29,on?'#ff7100':null,on?null:lc,1);
    if(d.loopManual()){g.fillStyle=tc2;g.fillRect(734,441,11,2);g.fillRect(752,441,11,2);}else T(g,fmtBeat(d.loopLenBeats()),748.5,449,20,tc2,LN,400,'center');}
  if(ld){overview(d,g,100,381,600,39,pos);hit(d,100,368,600,72,null,{needle:true});}
  /* NEEDLE SEARCH while paused (a lighter bar), NEEDLE COUNTDOWN while playing (firmware) */
  const nd=ld&&!d.playing;g.fillStyle=nd?'#292c31':'#080c08';RR(g,100.5,442.5,599,13,6.5);g.fill();g.strokeStyle=nd?'#626973':'#292c31';g.lineWidth=1;g.stroke();
  T(g,nd?'NEEDLE SEARCH':'NEEDLE COUNTDOWN',400,453.5,12,'#9a9a9a',LA,400,'center');
  if(!cur)T(g,anyMedia()?'':'NO DISC',400,400,22,'#ff1a1a',LF,400,'center');
}
function chip(g,x,y,w,h,t,col){g.strokeStyle=col;g.lineWidth=1.3;RR(g,x+.65,y+.65,w-1.3,h-1.3,2);g.stroke();T(g,t,x+w/2,y+h-3.5,12,col,LA,400,'center');}
/* end of the track: the whole position graph blinks, slowly under 30 s left, fast under 15 s (manual p. 18);
   the jog ring too when JOG INDICATOR is ON (p. 38: the manual gives no times for it, the same ones are used) */
function endBlink(d){if(!d.loaded()||!d.playing)return false;const r=d.dur-d._pos;return r<30&&Math.floor(now()*(r<15?4:2))%2===1;}
/* overview waveform (the playing address) with cue marks, needle position and 1-minute ticks */
function overview(d,g,x0,y0,W,H,pos){
  const cur=d.cur,an=cur.an,dur=d.dur,base=y0+H;
  if(endBlink(d))return;
  const ov=SET.wfColor===1?(an.ovRgb||an.ovBlue):(an.ovBlue||an.ovRgb);const half=SET.ovType===0,cw=W/400;
  if(ov)for(let i=0;i<400;i++){const hh=ov.h[i]/31*(half?H:H/2);if(hh<.3)continue;g.fillStyle='rgb('+ov.c[i*3]+','+ov.c[i*3+1]+','+ov.c[i*3+2]+')';
    if(half)g.fillRect(x0+i*cw,base-hh,cw+.15,hh);else g.fillRect(x0+i*cw,y0+H/2-hh,cw+.15,hh*2);}
  const px=x0+(dur?pos/dur:0)*W;
  /* bar graph (manual p. 18): ELAPSED = lit from the left edge up to the position; REMAIN = the left part goes out */
  const comb=(a,b)=>{if(b<=a)return;g.fillStyle='#e8e8e8';g.fillRect(a,base+1,b-a,7);g.fillStyle='#9a9a9a';for(let x=Math.ceil(a);x<b;x+=2)g.fillRect(x,base+2,.8,5);};
  const dark=(a,b)=>{if(b<=a)return;g.fillStyle='#000';g.fillRect(a,base+1,b-a,7);g.strokeStyle='#5a5a5a';g.lineWidth=1;g.strokeRect(a+.5,base+1.5,Math.max(0,b-a-1),6);};
  if(d.remain){dark(x0,px);comb(px,x0+W);}else{comb(x0,px);dark(px,x0+W);}
  /* cache meter (manual p. 17-18, drawing): the red part from the position on; how much and how fast are ours (to check on the real player) */
  const cm=Math.min(180,(dur-pos))*clamp((now()-cur.cacheT)/3,0,1)/dur*W;if(cm>0){g.fillStyle='#e8404a';g.fillRect(px,base+1,cm,7);}
  /* the scale: not shown for tracks over 15 minutes (manual p. 44) */
  if(dur&&dur<=900)for(let m=60;m<dur;m+=60){g.fillStyle='#fff';g.fillRect(x0+m/dur*W-.5,base+11,1,7);}
  if(d.loop){g.fillStyle='rgba(255,140,0,.5)';g.fillRect(x0+d.loop.a/dur*W,y0,Math.max(2,(d.loop.b-d.loop.a)/dur*W),H);}
  /* an active loop: a red line at its point (manual p. 25) */
  if(cur.activeLoop){g.fillStyle='#ff1a1a';g.fillRect(x0+cur.activeLoop.time/dur*W-.75,y0-2,1.5,H+3);}
  for(const c of cur.mem){const x=x0+c.time/dur*W;const col=c.color&&SET.hcColor?c.color:'#ff1a1a';
    g.fillStyle=col;g.beginPath();g.moveTo(x-5,y0-9);g.lineTo(x+5,y0-9);g.lineTo(x,y0-2);g.fill();}
  /* hot cues on both rows of the overview; the next point has a white triangle, which moves on with the track (firmware) */
  for(const k in cur.hot){const c=cur.hot[k];const x=x0+c.time/dur*W-5.5;hotMark(g,x,y0-10,hotColor(c),HL[c.hot-1]);hotMark(g,x,base+11,hotColor(c),HL[c.hot-1]);}
  const nx=nextCue(d,pos);if(nx){const x=x0+nx.time/dur*W;g.fillStyle='#fff';g.beginPath();g.moveTo(x-7,y0-9);g.lineTo(x+7,y0-9);g.lineTo(x,y0-1);g.fill();}
  const cx=x0+d.cue/dur*W;g.fillStyle='#ff8c00';g.beginPath();g.moveTo(cx-5,base+19);g.lineTo(cx+5,base+19);g.lineTo(cx,base+11);g.fill();
  if(d.ghost){g.fillStyle='#fff';g.fillRect(x0+d.ghost.pos/dur*W-1,y0,2,H+8);}
  if(d.touchPrev!=null){g.fillStyle='#ffcf3a';g.fillRect(x0+d.touchPrev/dur*W-1,y0-2,2,H+10);}
  /* the position: white while playing, red while paused (firmware) */
  g.fillStyle='#000';g.fillRect(px-3,y0-1,6,H+11);g.fillStyle=d.ghost?'#ffd200':d.playing?'#fff':'#ff0000';g.fillRect(px-1.5,y0,3,H+10);
}
/* hot cue colour as the player shows it: rekordbox colour when HOT CUE COLOR is ON, else green (cue) / orange (loop) */
function hotColor(c){if(SET.hcColor===1&&c.color)return c.color;return c.end?'#ff9600':'#28e214';}
/* ---------- upper half: playback ---------- */
function titleBar(g,col){g.fillStyle=col||NAVY;g.fillRect(18,12,764,30);}
/* the point being set in IN / OUT ADJUST: the waveform stops on it, the sound goes on (firmware) */
function adjPoint(d){return d.adjust&&d.loop?(d.adjust==='in'?d.loop.a:d.loop.b):null;}
/* the comment of a cue in the title: of the point called, else, playing outside a loop, of the next point within 16 bars; it stays when the player stops (firmware) */
function cueComment(d,pos){if(!d.loaded())return;if(d.called&&Math.abs(pos-d.called.time)<.02){d.cmt=d.called.name||null;return;}if(!d.playing)return;if(d.loop){d.cmt=null;return;}
  const n=nextCue(d,pos);d.cmt=n&&n.name&&(n.time-pos)/d.spb()<=64?n.name:null;}
function trackTitle(d,g,pos,col,maxX){const cur=d.cur,tr=cur&&cur.tr;if(!cur)return;cueComment(d,pos);
  if(d.cmt){box(g,36,18,22,18,'#3c2410');T(g,'CUE',47,31,10.5,'#ff7100',LA,700,'center');TC(g,d.cmt,66,36,25,'#fff',maxX-66);}else{noteIcon(g,37,16,22,'#fff');TC(g,tr.title,60,36,25,'#fff',maxX-60);}
  if(tr.key){keyGlyph(g,693,17,19,'#fff',col);T(g,keyTxt(tr.key),718,36,25,'#fff');}}
function drawPlayUpper(d,g){
  const cur=d.cur,ld=d.loaded(),tr=cur&&cur.tr,pos=ld?d.pos():0,bc=bgc(d);
  titleBar(g,bc[1]);
  /* a cue's rekordbox comment shows where the track name is (manual p. 27) */
  if(cur)trackTitle(d,g,pos,bc[1],tr.key?682:772);
  /* top row */
  const lp=d.loopPanel(),loopKey=()=>{if(d.loopPanel()){d.loopMode=false;d.loopHide=true;}else{d.loopMode=true;d.loopHide=false;}d.jumpMode=false;d.dirty=true;};
  modeBox(g,18,53,68,53,'LOOP','MODE',lp?'#ff7100':null);hit(d,18,53,68,53,loopKey);
  arrowBox(g,131,53,69,53,-1,fmtJump(d));hit(d,131,53,69,53,()=>beatJump(d,-1));
  arrowBox(g,635,53,69,53,1,fmtJump(d));hit(d,635,53,69,53,()=>beatJump(d,1));
  modeBox(g,714,53,68,53,'BEAT','JUMP',d.jumpMode?'#e8e8e8':null);hit(d,714,53,68,53,()=>{d.jumpMode=!d.jumpMode;d.loopMode=false;});
  phaseMeter(d,g,pos);
  const mode=lp||d.jumpMode,adj=ld?adjPoint(d):null;
  if(ld)hit(d,18,117,764,160,null,{wave:true});
  if(ld)drawDetail(d,g,125,mode?197:267,adj!=null?adj:d.touchPrev!=null?d.touchPrev:pos,mode);
  else if(cur)T(g,'Loading...',400,205,22,'#8fa6c8',LF,400,'center');
  if(lp){
    /* as on the real firmware: 8 keys of 91 x 73 px, 5 px apart, dark with an orange edge; the active one filled orange, none for a loop set by hand */
    const L=[.25,.5,1,2,4,8,16,32],w=91,h=73,cl=d.loop&&ld&&!d.loopManual()?d.loopLenBeats():null;
    L.forEach((n,i)=>{const x=18+i*96,y=206,on=cl!=null&&Math.abs(cl-n)<.01;
      rbox(g,x,y,w,h,2,on?'#ff7100':'#202429','#ff7100',1);T(g,fmtBeat(n),x+w/2,y+44,21,on?'#000':'#f2f2f2',LN,400,'center');
      /* slip beat loop: held; sliding the finger picks another length; RELOOP calls back the first loop set (manual p. 28) */
      hit(d,x,y,w,h,()=>{if(on)d.exitLoop();else d.beatLoop(n);},{loopN:n,hold:()=>{d.slipBegin();d.beatLoop(n);d.slipLoopHeld=d.loop&&{a:d.loop.a,b:d.loop.b};},up:()=>{const f=d.slipLoopHeld;if(f){d.slipLoopHeld=null;d.exitLoop();d.lastLoop=f;}}});});
  }else if(d.jumpMode){
    /* as on the real firmware: 4 pairs (back / forward) the same height as the loop keys; a white bar along the top
       with a small tab carrying the direction (◀◀ on the outer right of the back key, ▶▶ on the outer left of the forward key) */
    const V=[2,4,8,16],gap=7,G=16,gw=(764-3*G)/4,bw=(gw-gap)/2,h=73,y=204;
    V.forEach((n,i)=>{const gx=18+i*(gw+G);for(const dir of [-1,1]){const x=dir<0?gx:gx+bw+gap;
      rbox(g,x,y,bw,h,3,'#1f2227',null);
      g.fillStyle='#e6e6e6';g.fillRect(x+3,y+3,bw-6,2.5);
      const tw=30,th=12.5,sl=5,t0=y+3;g.beginPath();let cx;
      if(dir<0){const r=x+bw-3;g.moveTo(r-tw,t0);g.lineTo(r,t0);g.lineTo(r,t0+th);g.lineTo(r-tw+sl,t0+th);cx=r-tw/2+2;}
      else{const l=x+3;g.moveTo(l,t0);g.lineTo(l+tw,t0);g.lineTo(l+tw-sl,t0+th);g.lineTo(l,t0+th);cx=l+tw/2-2;}
      g.closePath();g.fill();const cy=t0+th/2;
      if(dir<0){triL(g,cx-.5,cy,3.3,'#1d1f23');triL(g,cx+4.5,cy,3.3,'#1d1f23');}else{triR(g,cx+.5,cy,3.3,'#1d1f23');triR(g,cx-4.5,cy,3.3,'#1d1f23');}
      T(g,String(n),x+bw/2,y+47,21,'#f2f2f2',LN,400,'center');hit(d,x,y,bw,h,()=>beatJump(d,dir,n));}});
  }
  if(d.lcdMsg&&now()<d.lcdMsg.until)lcdMessage(g,d.lcdMsg);
  if(!mode&&ld){chip2(g,680,272,48,15,'ZOOM',d.grid?'#555':'#c8c8c8');T(g,'– GRID',733,284.5,12,d.grid?'#fff':'#3d3d3d',LA,400,'left');if(d.grid)chip2(g,742,272,38,15,'',  '#fff');}
  if(ld&&!mode){let fx=24;const flag=(t,bg,fg)=>{const w=TW(g,t,11,LA,700)+10;box(g,fx,273,w,14,bg);T(g,t,fx+w/2,284,11,fg,LA,700,'center');fx+=w+5;};
    if(d.slip)flag('SLIP',(SET.slipFlash&&d.ghost&&!slipBlink(d))?'#4a3c06':'#ffd23a','#000');
    if(d.dir<0||d.revDone&&blink(2))flag(d.slipRevHeld?'SLIP REVERSE':'REVERSE','#ff1a1a','#fff');
    if(d.tReset)flag('TEMPO RESET','#d8d8d8','#000');
    if(d.grid)flag('GRID ADJUST','#fff','#000');}
}
/* MEMORY / DELETE / CUE/LOOPPOINT FULL over the waveform, with the cue or loop sign of the manual (place and look to check on the real player) */
function lcdMessage(g,m){g.font='700 26px '+LA;const tw=g.measureText(m.t).width,iw=m.icon?30:0,w=tw+iw+40,x=400-w/2,y=168;
  rbox(g,x,y,w,50,4,'rgba(0,0,0,.88)','#e8e8e8',1.6);
  if(m.icon==='cue'){g.fillStyle='#ff1a1a';g.beginPath();g.moveTo(x+20,y+16);g.lineTo(x+38,y+16);g.lineTo(x+29,y+34);g.fill();}
  else if(m.icon==='loop'){const c='#ff8c00';g.strokeStyle=c;g.lineWidth=2.6;g.beginPath();g.arc(x+29,y+25,8,-1.2,3.4);g.stroke();triL(g,x+26,y+16.6,4,c);}
  T(g,m.t,x+20+iw+tw/2,y+35,26,'#fff',LA,700,'center');}
function fmtJump(d){const n=d.jumpBeats||1;return n>=1?(n+' Beat'):(fmtBeat(n)+' Beat');}
function chip2(g,x,y,w,h,t,col){g.strokeStyle=col;g.lineWidth=1;g.strokeRect(x+.5,y+.5,w-1,h-1);if(t)T(g,t,x+w/2,y+h-3,12,col,LA,400,'center');}
/* LOOP MODE / BEAT JUMP: when active the key keeps its dark face and takes a coloured edge (orange / white), as on the real firmware */
function modeBox(g,x,y,w,h,l1,l2,on){if(on)rbox(g,x,y,w,h,2,'#202429',on,1);else box(g,x,y,w,h,'#202429','#39444a',1);const c='#f0f0f0';T(g,l1,x+w/2,y+23,13.5,c,LF,400,'center');T(g,l2,x+w/2,y+40,13.5,c,LF,400,'center');}
function arrowBox(g,x,y,w,h,dir,label){
  g.fillStyle='#080c08';g.beginPath();
  if(dir<0){g.moveTo(x,y+h/2);g.lineTo(x+26,y);g.lineTo(x+w,y);g.lineTo(x+w,y+h);g.lineTo(x+26,y+h);}
  else{g.moveTo(x,y);g.lineTo(x+w-26,y);g.lineTo(x+w,y+h/2);g.lineTo(x+w-26,y+h);g.lineTo(x,y+h);}
  g.closePath();g.fill();g.strokeStyle='#2b302b';g.lineWidth=1.2;g.stroke();
  T(g,label,dir<0?x+w-11:x+11,y+h/2+5.5,14,'#e8e8e8',LF,400,dir<0?'right':'left');
}
/* phase meter: TYPE 1 = two rows of four beat boxes, TYPE 2 = bar lines */
function phaseMeter(d,g,pos){
  const ld=d.loaded(),M=BUS.master,other=M&&M!==d&&M.loaded()?M:null;
  const b=d.beats();let bi=-1,cd='- - . -';
  /* bars and beats to the next point, 00.0 in red once on it (firmware) */
  const bars=nb=>nb?String(Math.floor(nb/4)).padStart(2,'0')+'.'+(nb%4+1):'00.0';let cdNow=false;
  if(ld&&b.length){const n=d.beatInBar(pos);bi=n>0?n-1:-1;const target=d.touchPrev!=null?d.touchPrev:nextPoint(d,pos);
    if(target!=null){const nb=Math.max(0,Math.round((target-pos)/d.spb()));cd=bars(nb);cdNow=!nb;}}
  let mcd='- - . -',mbi=-1;if(other){const mp=other.pos();const n=other.beatInBar(mp);mbi=n>0?n-1:-1;const t=nextPoint(other,mp);if(t!=null){const nb=Math.max(0,Math.round((t-mp)/other.spb()));mcd=bars(nb);}}
  if(SET.phaseMeter===1){
    const x0=298,x1=506,cx=402,bw=(x1-x0)/16;
    const ruler=(y,col,dk)=>{g.fillStyle=col;g.fillRect(x0,y,x1-x0,2);
      g.save();g.beginPath();g.rect(x0-1,y-12,x1-x0+2,16);g.clip();
      if(dk&&dk.loaded()){const ph=dk.beatPhase(dk.pos()),b=dk.beats(),bi=Math.floor(ph),fr=ph-bi;
        for(let k=-9;k<=9;k++){const x=cx+(k-fr)*bw,idx=bi+k;const n=b.length&&idx>=0&&idx<b.length?b[idx].n:(((idx%4)+4)%4)+1;const bar=n===1;
          g.fillStyle=bar?'#ff1a1a':'#e8e8e8';g.fillRect(x-(bar?1:.6),bar?y-10:y-6,bar?2:1.2,bar?12:6);}}
      else for(let k=0;k<=16;k++){const x=x0+k*bw;g.fillStyle=k%4===0?'#ff1a1a':'#e8e8e8';g.fillRect(x-(k%4?0.6:1),k%4?y-6:y-10,k%4?1.2:2,k%4?6:12);}
      g.restore();};
    ruler(70,'#ff8c00',other);ruler(93,'#1e8cff',ld?d:null);g.fillStyle='#fff';g.fillRect(cx-1.5,56,3,42);
    if(/\d/.test(mcd))T(g,mcd,560,75,22,'#ffb41a',LN,400,'right');else dashes(g,516,75,'#ffb41a');T(g,'Bars',563,75,12,'#ff8c00',LA,700,'left');
    if(/\d/.test(cd))T(g,cd,560,99,22,'#1ec8ff',LN,400,'right');else dashes(g,516,99,'#1ec8ff');T(g,'Bars',563,99,12,'#1e8cff',LA,700,'left');
    if(other){T(g,'MASTER',290,70,11,'#ffb41a',LA,700,'right');T(g,'PLAYER',290,81,11,'#ffb41a',LA,700,'right');}
    return;}
  const row=(y,outline,lit,litCol,label,labelCol)=>{
    for(let i=0;i<4;i++){const x=293+i*54;if(i){g.fillStyle=outline;g.fillRect(x-6,y+7,6,1.4);}
      g.fillStyle=lit===i?litCol:'#080c08';RR(g,x+.6,y+.6,48.5,14,2.5);g.fill();g.strokeStyle=lit===i?(litCol==='#b40000'?'#ff1a1a':'#ff7100'):outline;g.lineWidth=1.4;g.stroke();}
    const num=/\d/.test(label),lc=label==='00.0'?'#ff0000':labelCol;
    if(num)T(g,label,556,y+18,25,lc,LN,300,'right');else{const c=labelCol;g.fillStyle=c;for(let i=0;i<2;i++)g.fillRect(516+i*13,y+6,8,1.6);g.fillRect(541,y+13,2,2);g.fillRect(547,y+6,7,1.6);}
    T(g,'Bars',561,y+16,11,labelCol,LA,700,'left');};
  /* the beat in progress: orange, red on the first beat of the bar (firmware) */
  const lit=n=>n===0?'#b40000':'#bd4800';
  row(59,'#9c4400',mbi,lit(mbi),mcd,'#ff7a1a');
  row(83,'#08559c',bi,lit(bi),cd,'#1e96ff');
}
function dashes(g,x,y,col){g.fillStyle=col;g.fillRect(x,y-7,8,1.8);g.fillRect(x+13,y-7,8,1.8);g.fillRect(x+25,y-1.5,2.2,2.2);g.fillRect(x+31,y-7,8,1.8);}
/* the next memory or hot cue after pos */
function nextCue(d,pos){const c=d.cur;if(!c)return null;let best=null;
  for(const m of c.mem)if(m.time>pos+.01&&(!best||m.time<best.time))best=m;
  for(const k in c.hot){const m=c.hot[k];if(m.time>pos+.01&&(!best||m.time<best.time))best=m;}return best;}
function nextPoint(d,pos){const n=nextCue(d,pos);return n?n.time:null;}
/* detail waveform: RGB (PWV5) or blue (PWV3) at 150 columns per second */
function wfSample(i,an,blue){
  if(!blue&&an.colorDetail){const v=an.colorDetail[i];if(v==null)return null;return {h:(v>>2)&31,r:((v>>13)&7)*255/7,g:((v>>10)&7)*255/7,b:((v>>7)&7)*255/7};}
  if(an.detail){const v=an.detail[i];if(v==null)return null;return {h:v&31,w:v>>5};}
  if(an.colorDetail){const v=an.colorDetail[i];if(v==null)return null;const h=(v>>2)&31;return {h,w:Math.min(7,h>>2)};}
  return null;
}
function drawDetail(d,g,top,bot,pos,compact){
  const an=d.cur.an,blue=SET.wfColor===0;
  /* full height: a band of 110 px around the middle; under the LOOP or BEAT JUMP panel only its upper half stands on the bottom line (firmware) */
  const bt=top+16,bb=compact?bot-2:bot-16,cy=compact?bb:(bt+bb)/2,amp=compact?bb-bt:(bb-bt)/2,pps=ZOOMS[d.zi],mx=SET.wfPos===1?200:400;
  const xs=Math.max(18,mx-pos*pps),xe=Math.min(782,mx+(d.dur-pos)*pps);
  if(xe>xs){const bg=g.createLinearGradient(0,bt,0,compact?2*bb-bt:bb),mid=blue?'#0e2d66':'#313031';bg.addColorStop(0,'#000');bg.addColorStop(.5,mid);bg.addColorStop(1,'#000');
    g.fillStyle=bg;g.fillRect(xs,bt,xe-xs,bb-bt);}
  g.save();g.beginPath();g.rect(18,top,764,bot-top);g.clip();
  /* the loop behind the waveform: orange while active, grey once out of it */
  const zl=d.loop||d.lastLoop;if(zl){g.fillStyle=d.loop?'#b46100':'#313031';g.fillRect(mx+(zl.a-pos)*pps,bt,(zl.b-zl.a)*pps,bb-bt);}
  const src=blue?(an.detail||an.colorDetail):(an.colorDetail||an.detail),n=src?src.length:0;
  if(n){const k=Math.max(1,Math.ceil(150/pps)),cw=k*pps/150;      /* k data columns per drawn bar, bars anchored to the track */
    const g0=Math.max(0,Math.floor((pos-(mx-18)/pps)*150/k)),g1=Math.min(Math.ceil(n/k),Math.ceil((pos+(782-mx)/pps)*150/k)+1);
    for(let gi=g0;gi<g1;gi++){let hmax=0,best=-1;for(let j=gi*k;j<Math.min(n,gi*k+k);j++){const s2=wfSample(j,an,blue);if(s2&&s2.h>=hmax){hmax=s2.h;best=j;}}
      if(best<0)continue;const sm=wfSample(best,an,blue);const x=mx+(gi*k/150-pos)*pps;
      const a2=Math.min(amp,Math.max(.5,sm.h/31*amp*1.12));
      if(sm.r!=null)g.fillStyle='rgb('+(sm.r|0)+','+(sm.g|0)+','+(sm.b|0)+')';else{const w=sm.w/7;g.fillStyle='rgb('+Math.round(80+175*w)+','+Math.round(150+105*w)+',255)';}
      g.fillRect(x,cy-a2,Math.max(cw,.6),compact?a2:a2*2);}}
  if(!d.loop&&d.loopIn!=null){const x=mx+(d.loopIn-pos)*pps;g.fillStyle='#ff8c00';g.fillRect(x-1,bt,2,bb-bt);}
  const b=d.beats();
  if(b.length){const t0=(pos-(mx-18)/pps)*1000,t1=(pos+(782-mx)/pps)*1000;
    for(let i=lowerBound(b,t0);i<b.length&&b[i].t<=t1;i++){const x=Math.round(mx+(b[i].t/1000-pos)*pps);const bar=b[i].n===1;
      if(bar){g.fillStyle='#ff0000';g.fillRect(x-1,top,2,12);if(!compact)g.fillRect(x-1,bot-12,2,12);}
      else{g.fillStyle='#fff';g.fillRect(x-.75,top+8,1.5,6);if(!compact)g.fillRect(x-.75,bot-14,1.5,6);}
      if(d.grid){g.fillStyle=bar?'rgba(255,40,40,.7)':'rgba(255,255,255,.35)';g.fillRect(x-.5,bt,1,bb-bt);}}}
  const cur=d.cur;
  for(const c of cur.mem){const x=mx+(c.time-pos)*pps;if(x<0||x>800)continue;const col=c.color&&SET.hcColor?c.color:'#ff1a1a';
    g.fillStyle=col;g.beginPath();g.moveTo(x-6,top+1);g.lineTo(x+6,top+1);g.lineTo(x,top+9);g.fill();}
  /* a hot cue: its letter over and under the waveform, each with a small pin towards it (firmware) */
  for(const k in cur.hot){const c=cur.hot[k];const x=mx+(c.time-pos)*pps;if(x<-20||x>820)continue;const col=hotColor(c),l=HL[c.hot-1];
    hotMark(g,x-5.5,top,col,l);g.fillStyle=col;g.fillRect(x-1,top+11,2,3);if(!compact){hotMark(g,x-5.5,bot-11,col,l);g.fillStyle=col;g.fillRect(x-1,bot-14,2,3);}}
  const cx=mx+(d.cue-pos)*pps;if(!compact&&cx>18&&cx<782){g.fillStyle='#ff8c00';g.beginPath();g.moveTo(cx-6,bot-1);g.lineTo(cx+6,bot-1);g.lineTo(cx,bot-9);g.fill();}
  /* slip: white = the background position, yellow = the position heard (manual p. 28) */
  if(d.ghost){const x=mx+(d.ghost.pos-pos)*pps;g.fillStyle='#fff';g.fillRect(x-1,top,2,bot-top);}
  g.restore();
  /* the cursor: white while playing or in IN / OUT ADJUST, red while paused (firmware) */
  g.fillStyle=d.touchPrev!=null?'#ffcf3a':d.ghost?'#ffd200':d.playing||d.adjust?'#fff':'#ff0000';g.fillRect(mx-1.5,top,3,bot-top);
}
/* ---------- list pages ---------- */
function rowBg(g,r,x0,x1,y,sel){g.fillStyle=sel?SELBG:(r%2?ROW1:ROW0);g.fillRect(x0,y,x1-x0,LROWH);}
function clampList(st,n,rows){rows=rows||LROWS;st.sel=clamp(st.sel,0,Math.max(0,n-1));if(st.sel<st.top)st.top=st.sel;if(st.sel>=st.top+rows)st.top=st.sel-rows+1;st.top=clamp(st.top,0,Math.max(0,n-rows));}
function scrollBar(g,st,n,rows,y0,col,x){rows=rows||LROWS;y0=y0||LY;if(n<=rows)return;const h=rows*LROWH,th=Math.max(14,h*rows/n),ty=y0+(h-th)*st.top/Math.max(1,n-rows);g.fillStyle=col||'#8b8994';g.fillRect(x||22,ty,3,th);}
function listState(d,kind){return kind==='taglist'?d.ui.tl:curNav(d);}
function listItems(d,kind){return kind==='taglist'?levelItems(d,{k:'taglist'}):levelItems(d,curNav(d));}
/* the small menus over the screen: a grey head, dark rows, the cursor in white (firmware) */
function popBox(g,title){g.fillStyle='#949194';g.fillRect(430,12,352,30);T(g,title,606,36,25,'#292829',LF,400,'center');g.fillStyle='#313439';g.fillRect(430,42,352,246);g.strokeStyle='#73757b';g.lineWidth=1;g.strokeRect(430.5,42.5,351,245);}
function popRows(d,g,rows,sel,top,plain,pick){
  rows.slice(top,top+LROWS).forEach((r,j)=>{const i=top+j,y=46+j*LROWH,on=i===sel,c=on?'#000':'#fff',chk=r.on&&r.on();if(on){g.fillStyle='#fff';g.fillRect(435,y,342,28);}
    if(plain){if(chk){g.strokeStyle=c;g.lineWidth=2.4;g.beginPath();g.moveTo(443,y+15);g.lineTo(448,y+21);g.lineTo(458,y+8);g.stroke();}T(g,r.l,469,y+23,24,c);}else{bracketText(g,r.l,448,y+23,24,c,300);if(chk)triL(g,768,y+14,5,c);}
    if(on&&r.sub)triR(g,752,y+14,5,'#000');hit(d,430,y,352,LROWH,()=>{pick(i);d.dirty=true;});});
  if(rows.length>top+LROWS){g.fillStyle='#fff';g.beginPath();g.moveTo(746,268);g.lineTo(762,268);g.lineTo(754,276);g.fill();}}
function popPanel(d,g){const p=d.ui.pop;popBox(g,p.title);popRows(d,g,p.rows,p.sel,p.top||0,p.plain,i=>{if(p.sel===i)p.rows[i].fn();else p.sel=i;});}
/* the check of a tagged track, over its icon (firmware) */
function tagMark(g,x,y,col){g.strokeStyle=col;g.lineWidth=2.6;g.beginPath();g.moveTo(x+3,y+11);g.lineTo(x+8,y+17);g.lineTo(x+17,y+4);g.stroke();}
/* the key icon in green: the track fits the MASTER's key (manual p. 33) */
function keyGreen(g,x,y){keyGlyph(g,x,y+2,15,'#21c45a','#fff');}
/* the numbers in front of the tracks, in the lists that have an order of their own (manual p. 31) */
function listNumbered(d,kind){const nv=curNav(d);return kind==='taglist'||nv.by==='pl'||nv.by==='hist'||nv.by==='session';}
function listTitle(d,g,nv,c){const lab=nv.label||'';
  if(nv.k==='media'){T(g,'USB',30,36,25,c);return;}
  if(nv.k==='root'){usbIcon(g,34,17,c);T(g,rootLabel(nv.m),60,36,25,c);return;}
  if(nv.swatch){dot(g,43,27,10,nv.swatch);TC(g,lab,60,36,25,c,560);return;}
  if(nv.icon){catIcon(g,nv.icon==='folder'?'folderOpen':nv.icon,34,17,c);TC(g,lab,60,36,25,c,560);return;}
  bracketText(g,lab,40,36,25,c,560);}
function drawList(d,g,kind){
  const u=d.ui,st=listState(d,kind);const items=u.items=listItems(d,kind);const rows=LROWS;clampList(st,items.length,rows);
  const TM=kind==='taglist'?tagMedium(d):null,nv=curNav(d),M=navMedium(d),bc=bgc(d),dim=!!(u.pop||u.sort);
  const white=dim?'#7b797b':'#fff',black=dim?'#9c999c':'#000';
  if(kind==='taglist'){
    /* TAG LIST: the player's number and the device, a grey bar that never takes the USB's colour, the number of tracks on the right (firmware) */
    titleBar(g,'#292829');box(g,37,19,16,16,white);T(g,String(d.pn),45,33,13,'#000',LA,700,'center');T(g,'USB',60,36,25,white);
    T(g,'Total Track '+(TM?items.length:TAGLIST.filter(x=>x.m.mounted).length),762,36,25,white,LF,400,'right');
  }else{titleBar(g,bc[1]);listTitle(d,g,nv,dim?'#838183':'#fff');
    if(filterActive(M)&&nv.k!=='media'){funnel(g,700,19,15,white);const n=items.filter(x=>x.kind==='track').length;T(g,'[ '+(n||filt(M,M.tracks).length)+']',776,36,22,white,LF,400,'right');}
    else if(nv.sortCol&&nv.sortCol!==25&&items.some(x=>x.kind==='track')){const s=colName(nv.sortCol,M),w=TW(g,s,25)+22;bracketText(g,s,772-w,36,25,white,300);}}
  const tracks=kind==='taglist'?!!TM:items.some(x=>x.kind==='track'),panel=!tracks||u.info,thumbs=tracks&&!u.info,x1=panel?468:782;
  const sortCol=nv.sortCol||25,rcol=kind==='taglist'?((TM&&TM.column)||2):(!sortCol||sortCol===25||sortCol===26)?(M?M.column:0):sortCol;
  const kset=masterKeys(),mkey=masterKey(),num=listNumbered(d,kind);
  for(let r=0;r<rows;r++){const i=st.top+r,it=items[i];const y=LY+r*LROWH;const sel=it&&i===st.sel,sx=thumbs?114:30;
    rowBg(g,r,30,x1,y,false);if(sel){g.fillStyle=SELBG;g.fillRect(sx,y,x1-sx,LROWH);}if(!it)continue;
    if(it.kind==='track'){const t=it.tr,isCur=d.cur&&d.cur.tr===t;const ldAny=DECKS.some(x=>x.cur&&x.cur.tr===t);
      const col=dim?white:ldAny?(sel?'#008a00':LOADED_C):t.played?PLAYED_C:sel?'#000':'#fff';let ix=35,tx=63;
      if(thumbs){artRow(g,t,y);ix=118;tx=147;}else if(num){T(g,String(i+1).padStart(3,'0'),33,y+23,24,col);ix=85;tx=113;}
      if(isCur)playIcon(g,ix+1,y+7,16,'#00a000','#000');else fileIcon(g,ix,y+4,col);
      if(TAGLIST.includes(t)&&kind!=='taglist')tagMark(g,ix,y+3,ldAny?'#00c000':'#ff0000');
      const right=thumbs&&rcol?470:x1-6;
      if(sel)TS(g,t.title,tx,y+23,24,col,right-tx);else TC(g,t.title,tx,y+23,24,col,right-tx);
      if(thumbs&&rcol)rightCol(g,t,rcol,480,y,296,col,kset);}
    else{const c=sel?black:white;
      if(it.cat!=null||it.all)bracketText(g,it.label,44,y+23,24,c,x1-54);
      else{if(it.swatch)dot(g,45,y+15,9,it.swatch);else if(it.keyName&&it.keyName===mkey)keyGreen(g,37,y+5);else catIcon(g,sel&&it.icon==='folder'?'folderOpen':it.icon,37,y+5,c);
        if(it.stars!=null){for(let k=0;k<5;k++)star(g,72+k*20,y+15,8,c,k<it.stars);}
        else if(!(u.tagBlink&&u.tagBlink.i===i&&now()<u.tagBlink.until&&Math.floor(now()*6)%2)){if(sel)TS(g,it.label,63,y+23,24,c,x1-70);else TC(g,it.label,63,y+23,24,c,x1-70);}}}
    hit(d,30,y,x1-30,LROWH,()=>{if(st.sel===i)listEnter(d,kind);else st.sel=i;},{list:kind,row:i});
  }
  scrollBar(g,st,items.length,rows,0,bc[2]);
  if(tracks){if(u.info)infoPanel(d,g,items[st.sel],st,kset);}
  else if(nv.k==='media'&&kind!=='taglist')mediaPanel(g,items,st);
  else previewPanel(d,g,items,st);
  if(u.sort)sortPanel(d,g);
}
/* the column on the right of a track list: the icon of what it shows and its value; the icon turns green when the track fits the MASTER's key */
function rightCol(g,t,col,x,y,w,c,kset){
  if(col===6){for(let k=0;k<5;k++)star(g,x+8+k*17,y+15,6.5,c,k<t.rating);return;}
  if(col===13){if(t.colorId)dot(g,x+9,y+15,7,MEMC[t.colorId]);return;}
  if(keyFits(kset,t.key))keyGreen(g,x,y+4);else catIcon(g,CAT_ICON[col]||'comment',x,y+4,c);
  const v=colValue(t,col);if(v)TC(g,v,x+28,y+23,24,c,w-28);
}
/* the artwork at the head of a row; without one, the top of a record */
function artRow(g,t,y){const art=artFor(t),w=82,h=LROWH-2,x=31;g.fillStyle='#080808';g.fillRect(x,y+1,w,h);
  if(art){const s=Math.max(w/art.width,h/art.height),sw=w/s,sh=h/s;g.drawImage(art,(art.width-sw)/2,(art.height-sh)/2,sw,sh,x,y+1,w,h);return;}
  g.save();g.beginPath();g.rect(x,y+1,w,h);g.clip();const gr=g.createLinearGradient(0,y+2,0,y+h);gr.addColorStop(0,'#5a5d5a');gr.addColorStop(1,'#313031');g.fillStyle=gr;g.beginPath();g.ellipse(x+w/2,y+h+15,38,31,0,Math.PI,0);g.fill();g.fillStyle='#080c08';g.beginPath();g.ellipse(x+w/2,y+h+15,12,20,0,Math.PI,0);g.fill();g.restore();}
/* the artwork in a panel; without one, a record */
function artBox(g,t,x,y,w,h){const art=artFor(t);g.fillStyle='#0c1414';g.fillRect(x,y,w,h);
  if(art){const s=Math.max(w/art.width,h/art.height),sw=w/s,sh=h/s;g.drawImage(art,(art.width-sw)/2,(art.height-sh)/2,sw,sh,x,y,w,h);return;}
  const cx=x+w/2,cy=y+h/2;dot(g,cx,cy,51,'#4a4c5c');dot(g,cx,cy,16,'#333542');dot(g,cx,cy,7,'#0c0c10');}
function panelBox(g,y0,notchY){g.fillStyle='#f6f2f6';g.fillRect(470,43,312,246);g.strokeStyle='#b8b8b8';g.lineWidth=1;g.strokeRect(470.5,43.5,311,245);
  if(notchY!=null){g.fillStyle='#f6f2f6';g.beginPath();g.moveTo(455,notchY);g.lineTo(471,notchY-10);g.lineTo(471,notchY+10);g.closePath();g.fill();g.strokeStyle='#b8b8b8';g.beginPath();g.moveTo(470,notchY-10);g.lineTo(455,notchY);g.lineTo(470,notchY+10);g.stroke();}
  g.fillStyle='#dedede';for(let r=1;r<LROWS;r++)g.fillRect(480,LY+r*LROWH-1,292,1);}
/* the level of the supports: what is known of the USB (the free space cannot be read from a browser) */
function mediaPanel(g,items,st){const it=items[st.sel];panelBox(g,LY,it?LY+(st.sel-st.top)*LROWH+15:null);const M=it&&it.media;if(!M)return;
  const size=n=>n>=1e9?(n/1e9).toFixed(2)+' GB':Math.round(n/1e6)+' MB';
  [M.name,M.tracks.length+' songs',M.lib.playlists.filter(p=>!p.isFolder).length+' playlists',M.date,size(M.used)+' used'].forEach((s,j)=>TC(g,s,478,LY+j*LROWH+23,24,'#000',296));}
function previewPanel(d,g,items,st){
  const it=items[st.sel];panelBox(g,LY,it?LY+(st.sel-st.top)*LROWH+15:null);
  if(!it||it.kind!=='dir'||!it.next||it.cat===20||it.cat===27)return;
  let kids=[];try{kids=levelItems(d,it.next).slice(0,LROWS);}catch(e){}
  if(!kids.length){T(g,'EMPTY',627,LY+3*LROWH+23,24,'#000',LF,400,'center');return;}
  const kset=masterKeys(),mkey=masterKey();
  kids.forEach((k,j)=>{const y=LY+j*LROWH;
    if(k.kind==='track'){const ld=DECKS.some(x=>x.cur&&x.cur.tr===k.tr),c=ld?'#008a00':'#000';if(ld&&d.cur&&d.cur.tr===k.tr)playIcon(g,479,y+7,16,'#00a000','#000');else fileIcon(g,478,y+4,c);TC(g,k.tr.title,508,y+23,24,c,266);}
    else if(k.all)bracketText(g,k.label,486,y+23,24,'#000',280);
    else{if(k.swatch){dot(g,489,y+15,9,k.swatch);}else if(k.keyName&&k.keyName===mkey)keyGreen(g,480,y+5);else catIcon(g,k.icon,481,y+5,'#000');
      if(k.stars!=null){for(let q=0;q<5;q++)star(g,516+q*20,y+15,8,'#000',q<k.stars);}else TC(g,k.label,508,y+23,24,'#000',266);}});
}
/* INFO in a track list: the details of the track under the cursor (firmware) */
function infoPanel(d,g,it,st,kset){
  panelBox(g,LY,LY+(st.sel-st.top)*LROWH+15);if(!it||it.kind!=='track')return;
  const t=it.tr,col=t.colorId?MEMC[t.colorId]:'#000';
  [['artist',t.artist],['genre',t.genre],['time',fmtT(t.duration)],['bpm',t.bpm?t.bpm.toFixed(1)+' bpm':''],['key',keyTxt(t.key)],['rating'],['date',t.dateAdded],['comment',t.comment]].forEach(([ic,v],i)=>{const y=LY+i*LROWH;
    if(ic==='rating'){for(let k=0;k<5;k++)star(g,489+k*21,y+15,10,col,k<t.rating);return;}
    if(ic==='key'&&keyFits(kset,t.key))keyGreen(g,480,y+4);else catIcon(g,ic,480,y+4,'#000');
    TC(g,v||'',508,y+23,24,'#000',i>=2&&i<=5?136:266);});
  artBox(g,t,651,105,113,120);
}
/* SORT (MENU in a track list): the items and their order come from the USB */
function sortPanel(d,g){
  const SM=navMedium(d)||RM,L=SM.sortMenu,st=d.ui.sort;st.sel=clamp(st.sel,0,L.length-1);const cur=curNav(d).sortCol||25;
  popBox(g,'SORT');popRows(d,g,L.map(id=>({l:colName(id,SM),on:()=>id===cur})),st.sel,Math.max(0,st.sel-LROWS+1),false,i=>{if(st.sel===i)sortApply(d);else st.sel=i;});
}
function sortApply(d){const st=d.ui.sort;const id=(navMedium(d)||RM).sortMenu[st.sel];if(id==null)return;const nv=curNav(d);nv.sortCol=id;nv.sel=0;nv.top=0;d.ui.sort=null;}
function listEnter(d,kind){
  const u=d.ui,st=listState(d,kind),items=listItems(d,kind),it=items[st.sel];if(!it)return;
  if(kind==='taglist'&&it.media){u.tl.m=it.media;u.tl.sel=0;u.tl.top=0;return;}
  if(it.kind==='dir'){
    if(it.cat===27){toast(say('MATCHING : non disponible ici (il faut les données de correspondance de rekordbox)','MATCHING: not available here (needs rekordbox matching data)'));return;}
    if(it.next.k==='cat'&&it.next.cat===20){u.nav.push({k:'search',label:'SEARCH',sel:0,top:0});u.search.q='';u.search.sel=0;u.search.top=0;return;}
    /* an empty list cannot be entered: the panel says EMPTY (firmware) */
    if(!levelItems(d,it.next).length)return;
    u.nav.push(Object.assign({sel:it.next.k==='bpmNear'?1:0,top:0,sortCol:curNav(d).sortCol,icon:it.all?curNav(d).icon:it.icon,swatch:it.swatch},it.next));}
  /* from the TAG LIST the track starts by itself (manual p. 35) */
  else{const list=items.filter(x=>x.kind==='track').map(x=>x.tr),tl=kind==='taglist';d.loadTrack(it.tr,{list,play:tl,tag:tl,nav:tl?null:u.nav.map(n=>({...n}))});}
}
/* ---------- search: keyboard on screen ---------- */
const KB=[['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'],['1234567890','-/:;()&@"','.,?!\'#%']];
function drawSearch(d,g){
  const s=d.ui.search;const items=levelItems(d,{k:'search'});const R=5;clampList(s,items.length,R);
  titleBar(g,bgc(d)[1]);bracketText(g,'SEARCH',24,36,25,'#fff');box(g,150,16,500,22,'#000','#8a8a8a',1);
  T(g,s.q+(Math.floor(now()*2)%2?'_':''),156,33,19,'#fff',LF);T(g,String(items.length),774,36,22,'#fff',LF,400,'right');
  if(filterActive(navMedium(d)))funnel(g,700,19,15,'#fff');
  for(let r=0;r<R;r++){const i=s.top+r,it=items[i];const y=LY+r*LROWH;rowBg(g,r,30,782,y,it&&i===s.sel);if(!it)continue;const sel=i===s.sel;const t=it.tr,isCur=d.cur&&d.cur.tr===t;
    const ldAny=DECKS.some(x=>x.cur&&x.cur.tr===t);const col=ldAny?LOADED_C:(t.played?PLAYED_C:(sel?'#000':'#fff'));if(isCur)playIcon(g,40,y+8,14,'#2fb52f','#000');else fileIcon(g,39,y+4,col);
    TC(g,t.title,64,y+23,24,col,470);TC(g,t.artist,560,y+22,20,sel?'#000':'#bbb',214);
    hit(d,30,y,752,LROWH,()=>{if(s.sel===i)d.loadTrack(t,{list:items.map(x=>x.tr)});else s.sel=i;});}
  scrollBar(g,s,items.length,R,0,bgc(d)[2]);
  kbDraw(d,g,s,206);
}
function kbDraw(d,g,s,ky){
  const rows=KB[s.kb],kh=46,gap=5;
  rows.forEach((row,ri)=>{const n=row.length,kw=72,off=18+(10-n)*(kw+gap)/2;[...row].forEach((ch,ci)=>{const x=off+ci*(kw+gap),y=ky+ri*(kh+gap);
    box(g,x,y,kw,kh,'#2a2e35','#4a505a',1);T(g,ch,x+kw/2,y+31,22,'#fff',LN,400,'center');hit(d,x,y,kw,kh,()=>{if(s.q.length<(s.max||200))s.q+=ch;s.sel=0;s.top=0;});});});
  const by=ky+3*(kh+gap);
  [[s.kb?'ABC':'123',18,110,()=>{s.kb=1-s.kb;}],['SPACE',134,380,()=>{s.q+=' ';s.sel=0;}],['DELETE',520,130,()=>{s.q=s.q.slice(0,-1);s.sel=0;}],['CLEAR',656,126,()=>{s.q='';s.sel=0;}]].forEach(([l,x,w,fn])=>{
    box(g,x,by,w,kh,'#2a2e35','#4a505a',1);T(g,l,x+w/2,by+30,18,'#fff',LF,400,'center');hit(d,x,by,w,kh,fn);});
}
/* HISTORY NAME: typed on the keyboard of the screen, the selector sets it (manual p. 39) */
function drawHistName(d,g){const s=d.ui.hname;titleBar(g,'#292829');bracketText(g,'HISTORY NAME',24,36,25,'#fff');box(g,30,70,740,44,'#000','#8a8a8a',1);
  T(g,s.q+(Math.floor(now()*2)%2?'_':''),42,101,27,'#fff',LF);T(g,s.q.length+'/32',772,36,20,'#fff',LF,400,'right');kbDraw(d,g,s,190);}
/* ---------- INFO on the play screen: the loaded track, each line jumps to its level in the Browser ---------- */
const infoDeck=d=>(d.ui.iplay.pn&&DECKS.find(x=>x.pn===d.ui.iplay.pn))||d;
/* the lines in the order of the firmware: [name, value, level to jump to, icon, category of that level] */
function infoPlayRows(d){const t=d.cur&&d.cur.tr;if(!t)return [];const cn=t.colorId?(t.m.lib.colors[t.colorId]||COLNAME[t.colorId]):'';
  return [['TITLE',t.title,null],['ARTIST',t.artist,{k:'artistAlb',id:t.artistId,label:t.artist,icon:'artist'},'artist',2],['ALBUM',t.album,t.album?{k:'trk',by:'album',id:t.albumId,label:t.album,icon:'album'}:null,'album',3],
    ['TIME',fmtT(t.duration),null,'time'],['BPM',t.bpm?t.bpm.toFixed(1)+' bpm':'',t.bpm?{k:'bpmNear',id:Math.round(t.bpm),label:Math.round(t.bpm)+' bpm',icon:'bpm',sel:1}:null,'bpm',5],
    ['KEY',keyTxt(t.key),t.key?{k:'keyNear',key:t.key,label:keyTxt(t.key),icon:'key'}:null,'key',11],['RATING','',{k:'trk',by:'rating',id:t.rating,label:'RATING',icon:'rating'},'rating',6],
    ['COLOR',cn,t.colorId?{k:'trk',by:'color',id:t.colorId,label:cn,swatch:MEMC[t.colorId]}:null,'color',13],['GENRE',t.genre,t.genre?{k:'genreArt',id:t.genreId,label:t.genre,icon:'genre'}:null,'genre',1],['DATE ADDED',t.dateAdded,null,'date']];}
/* what the firmware shows, with the place of the manual's drawing (p. 35) for the source when it is another player's */
function drawInfoPlay(d,g){
  const x=infoDeck(d),tr=x.cur&&x.cur.tr,L=infoPlayRows(x),st=d.ui.iplay,bc=bgc(d);clampList(st,L.length);
  titleBar(g,bc[1]);usbIcon(g,34,17,'#fff');T(g,'USB@PLAYER'+x.pn,60,36,25,'#fff');
  if(tr){const Q=x.cur.list||[],n=Math.max(1,Q.indexOf(tr)+1),p3=v=>String(v).padStart(3,'0');T(g,'TRACK '+p3(n)+'/'+p3(Math.max(1,Q.length)),762,36,25,'#fff',LF,400,'right');}
  [46,107,168,228].forEach((y,i)=>{const n=i+1,k=DECKS.find(o=>o.pn===n),on=k===x,c=on?'#dee6ee':k?'#8a8f92':'#4a5052';
    if(on){box(g,19,y,66,57,'#202429','#39444a',1);g.fillStyle='#cdd2d5';g.fillRect(24,y+5,3,47);}else box(g,19,y,66,57,'#080c08');
    T(g,'PLAYER',55,y+16,12,c,LA,400,'center');T(g,String(n),55,y+48,30,c,LN,300,'center');if(k)hit(d,19,y,66,57,()=>{st.pn=n;st.sel=0;st.top=0;st.rate=false;d.dirty=true;});});
  g.fillStyle='#f6f2f6';g.fillRect(101,45,340,241);g.strokeStyle='#73757b';g.lineWidth=1;g.strokeRect(100.5,44.5,341,241);
  for(let r=0;r<LROWS;r++){const i=st.top+r,it=L[i];const y=LY+r*LROWH;const sel=it&&i===st.sel;if(r<LROWS-1){g.fillStyle='#dedede';g.fillRect(105,y+29,332,1);}if(!it)continue;
    if(sel)rbox(g,105,y,332,27,3,'#182020');const c=sel?'#fff':'#000';if(it[3])catIcon(g,it[3],112,y+4,c);else noteIcon(g,112,y+3,20,c);
    if(it[0]==='RATING'){const e=st.rate&&sel?'#ff7100':c;for(let k=0;k<5;k++)star(g,120+k*21,y+15,10,e,k<tr.rating);
      g.fillStyle=e;g.beginPath();g.moveTo(403,y+25);g.lineTo(404,y+19);g.lineTo(416,y+7);g.lineTo(422,y+13);g.lineTo(410,y+24);g.closePath();g.fill();}
    else{if(it[0]==='COLOR'&&tr.colorId)dot(g,120,y+15,10,MEMC[tr.colorId]);if(sel)TS(g,it[1]||'',138,y+23,24,c,290);else TC(g,it[1]||'',138,y+23,24,c,290);}
    hit(d,101,y,340,LROWH,()=>{if(st.sel===i)infoJump(d);else st.sel=i;});}
  scrollBar(g,st,L.length,LROWS,0,bc[2],93);
  if(tr){artBox(g,tr,560,106,113,120);if(tr.comment){catIcon(g,'comment',480,261,'#fff');TC(g,tr.comment,509,279,24,'#fff',270);}}
  if(x!==d){T(g,'SOURCE',616,62,13,'#fff',LA,700,'center');T(g,'USB',616,84,20,'#fff',LF,400,'center');T(g,'PLAYER '+x.pn,616,100,14,'#fff',LA,700,'center');}
}
/* the selector on a line: the Browser opens at that level, the cursor on the track or the value; BACK goes up through the category (firmware) */
function infoJump(d){if(infoDeck(d)!==d)return;const L=infoPlayRows(d),it=L[d.ui.iplay.sel];if(!it||!it[2])return;const u=d.ui,t=d.cur.tr,M=t.m,a=it[2],cat=it[4];
  const root=rootNav(M);root.sel=Math.max(0,levelItems(d,root).findIndex(x=>x.cat===cat));
  const c={k:'cat',cat,label:colName(cat,M),sel:0,top:0},last=Object.assign({sel:0,top:0},a);u.nav=[{k:'media',sel:0,top:0},root,c,last];u.browsed=true;
  c.sel=Math.max(0,levelItems(d,c).findIndex(x=>x.next&&x.next.k===a.k&&x.next.by===a.by&&x.next.id===a.id&&x.next.key===a.key));
  const j=levelItems(d,last).findIndex(x=>x.kind==='track'?x.tr===t:cat===1&&x.next&&x.next.id===t.artistId);if(j>=0)last.sel=j;
  goScr(d,'browse');}
/* ---------- MENU on the play screen: LOAD PREVIOUS TRACK, on the right half (firmware) ---------- */
const menuList=d=>d.hist.filter(t=>t.m.mounted&&!(d.cur&&d.cur.tr===t));
function drawLoadPrev(d,g){const bc=bgc(d),tr=d.cur&&d.cur.tr;
  titleBar(g,bc[1]);if(tr){noteIcon(g,37,16,22,'#fff');TC(g,tr.title,60,36,25,'#fff',360);}
  modeBox(g,18,53,68,53,'LOOP','MODE',d.loopPanel()?'#ff7100':null);arrowBox(g,131,53,69,53,-1,fmtJump(d));
  popBox(g,'LOAD PREVIOUS TRACK');const L=menuList(d),st=d.ui.menu;st.sel=clamp(st.sel,0,Math.max(0,L.length-1));
  L.slice(0,LROWS).forEach((t,i)=>{const y=46+i*LROWH,on=i===st.sel,c=on?'#000':'#fff';if(on){g.fillStyle='#fff';g.fillRect(435,y,342,28);}fileIcon(g,441,y+4,c);TC(g,t.title,470,y+23,24,c,300);
    hit(d,430,y,352,LROWH,()=>{if(st.sel===i)menuLoad(d);else st.sel=i;d.dirty=true;});});
}
function menuLoad(d){const t=menuList(d)[d.ui.menu.sel];if(t)d.loadTrack(t);}
/* ---------- UTILITY ---------- */
function drawUtility(d,g){
  const st=d.ui.util;st.sel=clamp(st.sel,0,UTIL_COUNT-1);if(st.sel<st.top)st.top=st.sel;if(st.sel>=st.top+LROWS)st.top=st.sel-LROWS+1;
  titleBar(g,'#292829');T(g,'UTILITY',30,36,25,'#fff');
  for(let r=0;r<LROWS;r++){const i=st.top+r,it=SETDEF[i];const y=LY+r*LROWH;if(!it)continue;const sel=i===st.sel,ed=sel&&st.edit;
    /* the cursor: on the name, then on the value once the selector is pushed (firmware) */
    g.fillStyle=sel?(ed?'#94a1ac':SELBG):'#181c18';g.fillRect(30,y,440,LROWH-1);g.fillStyle=sel?(ed?SELBG:'#94a1ac'):'#181c18';g.fillRect(471,y,311,LROWH-1);
    g.fillStyle='#414441';g.fillRect(30,y+LROWH-1,752,1);if(!sel)g.fillRect(470,y,1,LROWH);
    /* PLAYER No. is grey and cannot be changed while a storage device is connected (manual p. 12) */
    const grey=it[0]==='playerNo'&&anyMedia();const lc=grey?'#8a8a8a':'#fff';
    if(sel&&!ed)triR(g,40,y+15,6,'#000');
    T(g,it[1],62,y+23,24,sel?(grey?'#8a8a8a':'#181c18'):lc,LF);
    /* while a value is being changed it is only shown: it takes effect when the selector is pushed (manual p. 38) */
    let val=it[2][ed?st.val:SET[it[0]]];if(it[0]==='historyName')val=HISTNAME;if(it[0]==='version')val='Ver 1.85 (sim.)';if(it[0]==='linkStatus')val=anyMedia()?'NOT CONNECTED':'';
    if(ed)triR(g,478,y+15,6,'#000');
    T(g,val,503,y+23,24,ed?'#000':sel?(grey?'#8a8a8a':'#181c18'):lc,LF);
    hit(d,30,y,752,LROWH,()=>{if(st.sel===i){utilEnter(d);}else{st.sel=i;st.edit=false;}});}
  const h=LROWS*LROWH,th=h*LROWS/UTIL_COUNT,ty=LY+(h-th)*st.top/(UTIL_COUNT-LROWS);g.fillStyle='#94898b';g.fillRect(22,ty,3,th);
}
/* push: first on a setting, the cursor goes to its value; pushed again, the value is set (BACK before that cancels it: manual p. 38) */
function utilEnter(d){const st=d.ui.util,it=SETDEF[st.sel];if(!it||it[7])return;
  if(it[0]==='playerNo'){toast(anyMedia()?say('PLAYER No. : débranche la clé pour le changer','PLAYER No.: unplug the USB to change it'):say('PLAYER No. : AUTO, le numéro de la tranche de la table où la platine est branchée','PLAYER No.: AUTO, the mixer channel the player is plugged into'));return;}
  if(it[0]==='historyName'){d.ui.hname={q:HISTNAME,kb:0,max:32};goScr(d,'hname');return;}
  if(it[2].length<2)return;
  if(!st.edit){st.edit=true;st.val=SET[it[0]];return;}
  const k=it[0];st.edit=false;if(st.val===SET[k])return;SET[k]=st.val;SETSRC[k]='edit';
  for(const x of DECKS){if(k==='qbv')x.qBeat=[1,.5,.25,.125][SET.qbv];x.dirty=true;}
}
function utilStep(d,dir){
  const st=d.ui.util,it=SETDEF[st.sel];
  if(!st.edit){st.sel=clamp(st.sel+dir,0,UTIL_COUNT-1);return;}
  const ord=UTIL_ORDER[it[0]]||it[2].map((_,i)=>i),n=ord.length;st.val=ord[(ord.indexOf(st.val)+dir+n)%n];
}
/* ---------- SHORTCUT: the settings page ---------- */
function segs(d,g,x,y,w,h,opts,selIdx,fns,icons){const n=opts.length,sw=w/n;
  box(g,x,y,w,h,'#2a2c31','#8a8c90',1.2);
  opts.forEach((o,i)=>{const sx=x+i*sw,on=i===selIdx;if(on){g.fillStyle='#f2f2f2';g.fillRect(sx+1,y+1,sw-2,h-2);}else if(i){g.fillStyle='#8a8c90';g.fillRect(sx,y+1,1,h-2);}
    const c=on?'#3a3c40':'#c8c8c8';if(icons&&icons[i]){icons[i](g,sx+sw/2,y+h*.36,c);T(g,o,sx+sw/2,y+h-8,13,c,LF,400,'center');}else T(g,o,sx+sw/2,y+h/2+7,19,c,LF,400,'center');
    hit(d,sx,y,sw,h,fns[i]);});}
function drawShortcut(d,g){
  g.strokeStyle='#5a5c62';g.lineWidth=1.2;g.strokeRect(22.5,14.5,755,272);g.fillStyle='#5a5c62';g.fillRect(290,16,1,268);g.fillRect(560,16,1,268);
  const L=(t,x,y)=>T(g,t,x,y,13,'#e8e8e8',LA,400,'left');
  L('PHASE METER',34,32);
  segs(d,g,34,38,190,52,['TYPE 1','TYPE 2'],SET.phaseMeter,[()=>setS('phaseMeter',0),()=>setS('phaseMeter',1)],
    [(g,cx,cy,c)=>{for(let r=0;r<2;r++)for(let i=0;i<4;i++){g.strokeStyle=c;g.lineWidth=1;g.strokeRect(cx-26+i*13,cy-7+r*8,11,5);if(i===r)g.fillStyle=c,g.fillRect(cx-26+i*13,cy-7+r*8,11,5);}},
     (g,cx,cy,c)=>{g.fillStyle=c;g.fillRect(cx-28,cy,56,1.4);for(let i=0;i<9;i++)g.fillRect(cx-28+i*7,cy-5,1,5);}]);
  L('HOT CUE AUTO LOAD',34,112);
  segs(d,g,34,118,240,52,['ON','SETTINGS','OFF'],[2,0,1][SET.hcAuto],[()=>setS('hcAuto',1),()=>setS('hcAuto',2),()=>setS('hcAuto',0)],
    [null,(g,cx,cy,c)=>{g.strokeStyle=c;g.lineWidth=1.5;g.beginPath();for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3;g.lineTo(cx+9*Math.cos(a),cy+9*Math.sin(a));}g.closePath();g.stroke();g.fillStyle=c;g.beginPath();g.moveTo(cx-4,cy-2);g.lineTo(cx+4,cy-2);g.lineTo(cx,cy+4);g.fill();},null]);
  L('QUANTIZE BEAT VALUE',34,192);
  segs(d,g,34,198,240,56,['1/8','1/4','1/2','1'],[3,2,1,0][SET.qbv],[()=>setS('qbv',3),()=>setS('qbv',2),()=>setS('qbv',1),()=>setS('qbv',0)]);
  box(g,306,22,14,16,'#f0f0f0');T(g,String(d.pn),313,35,12,'#000',LA,700,'center');T(g,'USB',323,37,22,'#fff',LF,400,'left');
  L('MY SETTINGS',306,112);
  [['LOAD',()=>{reloadMySettings(d);}],['SAVE',()=>{toast(say('SAVE : cette page ne peut pas écrire sur la clé','SAVE: this page cannot write to the USB'));}]].forEach(([t,fn],i)=>{const x=306+i*68;box(g,x,118,60,52,'#3a3d43','#6a6d73',1);T(g,t,x+30,149,16,'#e8e8e8',LF,400,'center');hit(d,x,118,60,52,fn);});
  L('WAVEFORM COLOR',306,192);
  segs(d,g,306,198,124,56,['BLUE','RGB'],SET.wfColor,[()=>setS('wfColor',0),()=>setS('wfColor',1)],
    [(g,cx,cy,c)=>{g.fillStyle='#1ea0ff';g.fillRect(cx-22,cy-5,44,10);},(g,cx,cy,c)=>{const cs=['#ff3a3a','#ffb43a','#e8ff6a','#ffffff','#7ad0ff','#7a5aff'];cs.forEach((k,i)=>{g.fillStyle=k;g.fillRect(cx-22+i*7.4,cy-5,7.4,10);});}]);
  const B=[['TRACK',4],['PLAYLIST',17],['SEARCH',20],['MATCHING',27]];
  B.forEach(([t,id],i)=>{const y=22+i*66,x=574,w=196,h=58,dis=id===27;box(g,x,y,w,h,dis?'#26282c':'#454850',dis?'#33353a':'#5a5d65',1);T(g,t,x+w/2,y+38,25,dis?'#5a5d63':'#fff',LF,400,'center');
    if(!dis)hit(d,x,y,w,h,()=>{const u=d.ui;u.scr='browse';u.browsed=true;u.sort=null;
      const M=navMedium(d)||RM;if(id===20){u.nav=[{k:'media',sel:0,top:0},rootNav(M),{k:'search',label:'SEARCH',sel:0,top:0}];u.search.q='';}
      else{const it=levelItems(d,{k:'root',m:M});const j=it.findIndex(x=>x.cat===id);u.nav=[{k:'media',sel:0,top:0},Object.assign(rootNav(M),{sel:Math.max(0,j)}),{k:'cat',cat:id,label:colName(id,M),sel:0,top:0}];}});});
}
function setS(k,v){SET[k]=v;SETSRC[k]='edit';for(const x of DECKS){x.qBeat=[1,.5,.25,.125][SET.qbv];x.dirty=true;}}
function reloadMySettings(d){const M=navMedium(d)||RM;const ps=parseSettings(M?M.setFiles:{});if(!ps.found.length){toast(say('Pas de My Settings sur la clé','No My Settings on the USB'));return;}resetSettings();for(const [k,v] of Object.entries(ps.values)){SET[k]=v;SETSRC[k]='usb';}for(const x of DECKS)x.applySettings();toast(say('My Settings de la clé « '+M.name+' » rechargés','My Settings reloaded from “'+M.name+'”'));}
/* ---------- TRACK FILTER (EDIT) ---------- */
function fm(d){return navMedium(d)||(d.cur&&d.cur.tr.m)||RM;}
const FCOL=[1,2,3,4,5,6,7,8];
/* colours of the TRACK FILTER pages: neutral greys like the rest of the screen, selections in light cyan */
const FB={bg:'#2b2d31',btn:'#4a4d53',btnOn:'#6c7078',edge:'#6c7077',sel:'#ffb84a',on:'#86e6dc',onTxt:'#0b2422',head:'#2f62b8'};
function drawFilter(d,g){
  const M=fm(d),f=M.filter,u=d.ui.filt;
  g.fillStyle=FB.bg;g.fillRect(18,42,764,248);
  g.fillStyle=FB.head;g.fillRect(18,12,764,30);T(g,'TRACK FILTER',28,35,22,'#fff');T(g,'USB@PLAYER'+d.pn,200,35,22,'#fff');
  if(filterActive(M)){funnel(g,700,19,15,'#fff');T(g,'[ '+(filterHasCond(M)?M.tracks.filter(passFilter).length:M.tracks.length)+']',776,36,22,'#fff',LF,400,'right');}
  const tabs=[['BPM\nKEY',0],['MY TAG',1]];
  /* the selector also reaches the tabs, MASTER PLAYER and RESET (orange frame) */
  const cur=w=>u.pad==null&&(u.tab===0?u.sel===w.a:u.side===w.b);
  tabs.forEach(([t,i],k)=>{const y=48+k*52,on=u.tab===i,c=k===1?cur({a:5}):cur({b:'tab'});box(g,22,y,60,46,on?FB.btnOn:FB.btn,c?FB.sel:FB.edge,c?2:1);if(on){g.fillStyle='#f2f4f8';g.fillRect(25,y+5,3,36);}
    t.split('\n').forEach((ln,j,a)=>T(g,ln,53,y+27+(j-(a.length-1)/2)*13,12,'#f2f4f8',LA,700,'center'));hit(d,22,y,60,46,()=>{u.tab=i;u.sel=0;u.pad=null;u.side=null;});});
  if(u.tab===1){g.fillStyle='#5fd8cc';g.beginPath();g.arc(52,170,15,0,7);g.fill();g.strokeStyle='#0e3b37';g.lineWidth=1;g.stroke();T(g,'i',52,177,19,'#0e3b37','Georgia,serif',700,'center');}
  {const c=cur({a:6,b:'reset'});box(g,22,214,60,34,FB.btn,c?FB.sel:FB.edge,c?2:1);}T(g,'–RESET',52,236,12,'#f2f4f8',LA,700,'center');
  hit(d,22,214,60,34,()=>filterReset(d));
  g.fillStyle=FB.edge;g.fillRect(88,46,1,240);
  if(u.tab===0)filterBpmKey(d,g);else filterTags(d,g);
  if(u.pad!=null)numPad(d,g);
}
function fbtn(g,x,y,w,h,on,sel){box(g,x,y,w,h,on?FB.btnOn:FB.btn,sel?FB.sel:FB.edge,sel?2:1);}
function filterBpmKey(d,g){
  const f=fm(d).filter,u=d.ui.filt;const ref=refTrack(d);followMaster(d);
  if(!f.bpmVal&&ref)f.bpmVal=Math.round(ref.bpm);if(!f.keyVal&&ref)f.keyVal=ref.key;
  const rows=[['BPM','bpm'],['KEY','key'],['RATING','rating'],['COLOR','color']];
  rows.forEach(([lab,k],r)=>{const y=50+r*52,sel=u.sel===r;
    fbtn(g,96,y,104,40,f[k],sel&&u.pad==null);check(g,106,y+12,15,'#e8eefc',f[k]);T(g,lab,132,y+27,19,'#fff',LF,400,'left');hit(d,96,y,104,40,()=>{u.sel=r;f[k]=!f[k];});
    g.strokeStyle=FB.edge;g.lineWidth=1;g.beginPath();g.moveTo(222,y);g.lineTo(206,y+20);g.lineTo(222,y+40);g.lineTo(670,y+40);g.lineTo(670,y);g.closePath();g.stroke();
    if(k==='bpm'){fbtn(g,232,y+5,104,30,true,u.pad==='bpm');T(g,(+f.bpmVal).toFixed(f.bpmVal%1?1:0),284,y+28,21,'#fff',LN,400,'center');hit(d,232,y+5,104,30,()=>{u.pad='bpm';u.padTxt='';});
      T(g,'BPM',344,y+27,16,'#fff',LA,700,'left');T(g,'≦  ±',418,y+28,19,'#fff',LA,700,'center');fbtn(g,452,y+5,150,30,true,u.pad==='pct');T(g,String(f.bpmPct),527,y+28,21,'#fff',LN,400,'center');
      hit(d,452,y+5,150,30,()=>{u.pad='pct';u.padTxt='';});T(g,'%',612,y+28,17,'#fff',LA,700,'left');}
    if(k==='key'){fbtn(g,232,y+5,104,30,true,false);T(g,f.keyVal||'---',284,y+28,21,'#fff',LF,400,'center');
      hit(d,232,y+5,104,30,()=>{const i=KEYCYCLE.indexOf(f.keyVal);f.keyVal=KEYCYCLE[(i+1)%KEYCYCLE.length];});
      box(g,342,y+5,140,30,f.related?'#4a6aa8':null,f.related?'#9ab':null,1);T(g,'RELATED KEY',350,y+27,17,'#fff',LA,700,'left');hit(d,342,y+5,140,30,()=>{f.related=!f.related;});}
    if(k==='rating'){fbtn(g,232,y+5,430,30,true,false);for(let i=0;i<5;i++){star(g,280+i*84,y+20,9,'#fff',i<f.ratingVal);hit(d,240+i*84,y+5,84,30,()=>{f.ratingVal=i+1;f.rating=true;});}}
    if(k==='color'){for(let i=0;i<8;i++){const x=232+i*56,on=f.colors.has(i+1);fbtn(g,x,y+5,50,30,on,false);g.fillStyle=MEMC[i+1];g.beginPath();g.arc(x+25,y+20,on?8:7,0,7);g.fill();if(on){g.strokeStyle='#fff';g.lineWidth=2;g.stroke();}
      hit(d,x,y+5,50,30,()=>{if(f.colors.has(i+1))f.colors.delete(i+1);else f.colors.add(i+1);f.color=f.colors.size>0;});}}
  });
  const on=!!f.useMaster,cm=u.sel===4&&u.pad==null;box(g,684,50,90,92,on?FB.on:FB.btn,cm?FB.sel:on?'#e6fffb':FB.edge,cm?2:on?1.6:1);T(g,'MASTER',729,92,14,on?FB.onTxt:'#fff',LA,700,'center');T(g,'PLAYER',729,108,14,on?FB.onTxt:'#fff',LA,700,'center');
  hit(d,684,50,90,92,()=>filterMaster(d));
}
function filterMaster(d){const f=fm(d).filter;f.useMaster=!f.useMaster;if(f.useMaster){if(!masterRef(d))toast(say('MASTER PLAYER : aucun morceau chargé sur la platine MASTER','MASTER PLAYER: no track loaded on the MASTER player'));else{f.bpm=true;f.key=true;}}followMaster(d);}
function filterReset(d){const f=fm(d).filter,u=d.ui.filt;Object.assign(f,{bpm:false,key:false,rating:false,color:false,on:false});f.colors.clear();f.tags.clear();f.catOn.clear();u.pad=null;}
/* the player whose BPM and KEY the filter uses with MASTER PLAYER: the sync master, else this deck */
function masterRef(d){const m=BUS.master&&BUS.master.loaded()?BUS.master:(d.loaded()?d:null);return m;}
function followMaster(d){const f=fm(d).filter;if(!f.useMaster)return;const m=masterRef(d);if(!m)return;f.bpmVal=Math.round(m.bpmNow()*10)/10;if(m.cur.tr.key)f.keyVal=m.cur.tr.key;}
function refTrack(d){const m=BUS.master&&BUS.master.loaded()?BUS.master:d;return m.loaded()?m.cur.tr:null;}
function numPad(d,g){
  const u=d.ui.filt,f=fm(d).filter;const y=258;
  for(let i=0;i<10;i++){const v=(i+1)%10,x=96+i*58,dis=u.pad==='pct'&&v>6&&u.padTxt==='';fbtn(g,x,y,52,36,false,false);T(g,String(v),x+26,y+26,20,dis?'#55617a':'#fff',LN,400,'center');
    if(!dis)hit(d,x,y,52,36,()=>{u.padTxt=(u.padTxt+v).slice(0,u.pad==='bpm'?3:2);const n=parseInt(u.padTxt,10)||0;if(u.pad==='bpm'){f.bpmVal=n;f.bpm=true;}else{f.bpmPct=Math.min(6,n);f.bpm=true;}});}
  fbtn(g,684,y+170,90,36,false,false);T(g,'CLOSE',729,y+195,16,'#fff',LA,700,'center');hit(d,684,y+170,90,36,()=>{u.pad=null;});
}
/* MY TAG: a tab per My Tag category (its box switches the category on/off), the tags of the chosen tab in two columns,
   CRITERIA AND / OR. */
function tagCats(M){const E=M.ext;if(!E)return [];return E.cats.length?E.cats:[{id:null,name:'MY TAG'}];}
function catTags(M,c){return M.ext.tags.filter(t=>c.id==null||t.parent===c.id);}
function filterTags(d,g){
  const M=fm(d),f=M.filter,u=d.ui.filt,E=M.ext;
  box(g,94,84,120,198,'#26282c',FB.edge,1);T(g,'CRITERIA',154,226,11,'#e8eaee',LA,700,'center');
  [['AND',true],['OR',false]].forEach(([t,v],i)=>{const x=100+i*54;box(g,x,234,54,38,f.and===v?FB.on:FB.btn,FB.edge,1);T(g,t,x+27,258,15,f.and===v?FB.onTxt:'#fff',LA,700,'center');hit(d,x,234,54,38,()=>{f.and=v;});});
  if(!E||!E.tags.length){T(g,'No My Tag.',500,170,20,'#aab',LF,400,'center');return;}
  const cats=tagCats(M);u.tcol=clamp(u.tcol,0,cats.length-1);
  const vis=4,c0=clamp(u.tcol-vis+1,0,Math.max(0,cats.length-vis)),tw=(782-94-3*6)/vis;
  cats.slice(c0,c0+vis).forEach((c,ci)=>{const ix=c0+ci,x=94+ci*(tw+6),sel=ix===u.tcol,on=f.catOn.has(c.id);
    box(g,x,48,tw,30,sel?FB.btnOn:FB.btn,sel?'#e6e8ec':FB.edge,sel?1.6:1);check(g,x+7,55,14,'#f2f4f8',on);TC(g,c.name,x+28,70,18,'#fff',tw-32);
    hit(d,x,48,tw,30,(px)=>{if(px<x+26||u.tcol===ix){if(on)f.catOn.delete(c.id);else f.catOn.add(c.id);}u.tcol=ix;u.tsel=0;});});
  if(cats.length>vis){T(g,'◀ '+(c0+1)+'-'+Math.min(cats.length,c0+vis)+' / '+cats.length+' ▶',154,104,11,'#c8ccd4',LA,400,'center');}
  const c=cats[u.tcol],tags=catTags(M,c);u.tsel=clamp(u.tsel,0,Math.max(0,tags.length-1));
  const rowTop=clamp(Math.floor(u.tsel/2)-2,0,Math.max(0,Math.ceil(tags.length/2)-3)),cw=(782-226-8)/2;
  for(let r=0;r<3;r++)for(let k=0;k<2;k++){const i=(rowTop+r)*2+k,t=tags[i];if(!t)continue;const x=226+k*(cw+8),y=86+r*66,on=f.tags.has(t.id),cur=i===u.tsel;
    const cs=cur&&!u.side;box(g,x,y,cw,56,on?FB.on:FB.btn,cs?FB.sel:FB.edge,cs?2:1);TC(g,t.name,x+12,y+36,22,on?FB.onTxt:'#fff',cw-20);
    hit(d,x,y,cw,56,()=>{u.tsel=i;u.side=null;toggleTag(M,c,t);});}
  const rows=Math.ceil(tags.length/2);if(rows>3){const h=196,th=h*3/rows,ty=86+(h-th)*rowTop/(rows-3);g.fillStyle='#d8dbe0';g.fillRect(219,ty,3,th);}
}
function toggleTag(M,c,t){const f=M.filter;if(f.tags.has(t.id))f.tags.delete(t.id);else{f.tags.add(t.id);f.catOn.add(c.id);}}
