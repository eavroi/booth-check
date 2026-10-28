/* ---------------- the touch screen: one page per mode, drawn like the CDJ-2000NXS2 firmware ---------------- */
const ZOOMS=[35,70,140,280,560];
const LOADED_C='#3fd23f',PLAYED_C='#1c8a24';
const LROWS=8,LROWH=30,LY=46;
function hit(d,x,y,w,h,fn,o){d.ui.hits.push(Object.assign({x,y,w,h,fn},o||{}));}
function drawLcd(d,g){
  d.ui.hits=[];g.fillStyle='#000';g.fillRect(0,0,800,480);
  const u=d.ui,s=u.scr;
  if(!anyMedia()){noMedia(d,g);return;}
  const full=(s==='browse'&&curNav(d).k==='search')||(s==='filter'&&u.filt.pad!=null);
  if(!full)lower(d,g);
  switch(s){
    case 'browse':if(curNav(d).k==='search')drawSearch(d,g);else drawList(d,g,'browse');break;
    case 'taglist':drawList(d,g,'taglist');break;
    case 'search':drawSearch(d,g);break;
    case 'iplay':drawInfoPlay(d,g);break;
    case 'menu':drawPlayUpper(d,g);drawLoadPrev(d,g);break;
    case 'utility':drawUtility(d,g);break;
    case 'shortcut':drawShortcut(d,g);break;
    case 'filter':drawFilter(d,g);break;
    default:drawPlayUpper(d,g);
  }
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
  if(d.ui.scr==='utility'){drawUtility(d,g);return;}
  T(g,'NO DISC',400,400,22,'#ff1a1a',LF,400,'center');
}
/* ---------- lower half: player status, under every page except full-screen ones ---------- */
function lower(d,g){
  const ld=d.loaded(),cur=d.cur,tr=cur&&cur.tr,pos=ld?d.pos():0;
  const sg=g.createLinearGradient(0,292,0,299);sg.addColorStop(0,'#000');sg.addColorStop(.45,'#0b2030');sg.addColorStop(1,'#000');g.fillStyle=sg;g.fillRect(18,292,764,7);
  box(g,18,302,67,60,null,'#e8e8e8',1.4);T(g,'PLAYER',51.5,318,13,'#fff',LA,700,'center');T(g,String(d.pn),51.5,353,39,'#fff',LN,300,'center');
  T(g,SET.playMode===0?'CONTINUE':'SINGLE',51.5,382,13,'#fff',LA,700,'center');
  /* QUANTIZE in grey when it cannot act: a track not analysed, without a beat grid (manual p. 14) */
  const qc=d.quant&&!(ld&&d.beats().length<2)?'#ff0000':'#5a5a5a';T(g,'QUANTIZE',51.5,420,13,qc,LA,700,'center');box(g,18,427,67,27,null,qc,1.4);T(g,fmtBeat(d.qBeat),51.5,447,20,qc,LN,400,'center');
  hit(d,18,405,67,52,()=>{d.quant=!d.quant;d.dirty=true;});
  T(g,'TRACK',105,315,13,'#fff',LA,700,'left');
  let tn='00';if(cur){const L=cur.list||[];const i=L.indexOf(tr);tn=String(i>=0?i+1:1).padStart(2,'0');}
  T(g,tn,101,361,46,'#fff',LN,300,'left');
  if(SET.hcAuto!==0){const col=SET.hcAuto===2?'#ffffff':'#ff1a1a';chip(g,183,318,70,16,'A.HOT CUE',col);}
  if(d.autoCueOn){const col=SET.autoCueLevel===8?'#ffffff':'#ff1a1a';chip(g,183,339,70,16,'A.CUE',col);}
  T(g,d.remain?'REMAIN':'ELAPSED',290,315,13,'#fff',LA,700,'left');
  /* IN / OUT ADJUST: the time of the loop point being set is shown (manual p. 24-25) */
  const adj=ld&&d.adjust&&d.loop?(d.adjust==='in'?d.loop.a:d.loop.b):null;
  const tv=adj!=null?adj:ld?(d.remain?d.dur-pos:pos):0,[mm,ss,ms]=fmtMs(tv);
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
  else{T(g,'TEMPO',520,315,13,'#fff',LA,700,'left');
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
  box(g,715,382,67,23,'#ff0000');T(g,RANGES[d.rangeIdx]===100?'WIDE':'±'+RANGES[d.rangeIdx],748.5,401,21,'#000',LN,400,'center');
  hit(d,715,382,67,23,()=>{d.rangeIdx=(d.rangeIdx+1)%4;d.applyTempo();});
  if(d.loop||d.lastLoop){const on=!!d.loop,lc=on?'#ff8c00':'#fff';
    g.strokeStyle=lc;g.fillStyle=lc;g.lineWidth=1.6;g.beginPath();g.arc(724,416,4.2,-1.2,3.4);g.stroke();triL(g,722,411.4,2.6,lc);T(g,'LOOP',732,421,12,lc,LA,700,'left');
    box(g,715,426,67,28,on?'#ff8c00':null,on?null:'#fff',1.4);T(g,fmtBeat(d.loopLenBeats()),748.5,448,20,on?'#000':'#fff',LN,400,'center');}
  if(ld){overview(d,g,100,381,600,39,pos);hit(d,100,368,600,72,null,{needle:true});}
  g.fillStyle='#080c08';RR(g,100.5,442.5,599,13,6.5);g.fill();g.strokeStyle='#292c31';g.lineWidth=1;g.stroke();
  if(d.touchPrev!=null&&ld){T(g,'NEEDLE COUNTDOWN',400,453.5,12,'#9a9a9a',LA,400,'center');}else T(g,'NEEDLE COUNTDOWN',400,453.5,12,'#9a9a9a',LA,400,'center');
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
  /* the scale: not shown for tracks over 15 minutes (manual p. 44) */
  if(dur&&dur<=900)for(let m=60;m<dur;m+=60){g.fillStyle='#fff';g.fillRect(x0+m/dur*W-.5,base+11,1,7);}
  if(d.loop){g.fillStyle='rgba(255,140,0,.5)';g.fillRect(x0+d.loop.a/dur*W,y0,Math.max(2,(d.loop.b-d.loop.a)/dur*W),H);}
  for(const c of cur.mem){const x=x0+c.time/dur*W;const col=c.color&&SET.hcColor?c.color:'#ff1a1a';
    g.fillStyle=col;g.beginPath();g.moveTo(x-5,y0-9);g.lineTo(x+5,y0-9);g.lineTo(x,y0-2);g.fill();}
  for(const k in cur.hot){const c=cur.hot[k];const x=x0+c.time/dur*W;g.fillStyle=hotColor(c);g.fillRect(x-5,y0-11,10,10);T(g,HL[c.hot-1],x,y0-3,9,'#000',LA,700,'center');}
  const cx=x0+d.cue/dur*W;g.fillStyle='#ff8c00';g.beginPath();g.moveTo(cx-5,base+18);g.lineTo(cx+5,base+18);g.lineTo(cx,base+10);g.fill();
  if(d.ghost){g.fillStyle='#fff';g.fillRect(x0+d.ghost.pos/dur*W-1,y0,2,H+8);}
  if(d.touchPrev!=null){g.fillStyle='#ffcf3a';g.fillRect(x0+d.touchPrev/dur*W-1,y0-2,2,H+10);}
  g.fillStyle='#000';g.fillRect(px-2.5,y0-1,5,H+10);g.fillStyle=d.ghost?'#ffd200':'#fff';g.fillRect(px-1.5,y0,3,H+8);
}
/* hot cue colour as the player shows it: rekordbox colour when HOT CUE COLOR is ON, else green (cue) / orange (loop) */
function hotColor(c){if(SET.hcColor===1&&c.color)return c.color;return c.end?'#ff9600':'#28e214';}
/* ---------- upper half: playback ---------- */
function titleBar(g,col){g.fillStyle=col||NAVY;g.fillRect(18,12,764,30);}
function drawPlayUpper(d,g){
  const cur=d.cur,ld=d.loaded(),tr=cur&&cur.tr,pos=ld?d.pos():0;
  titleBar(g);
  /* a recalled point's rekordbox comment shows where the track name is (manual p. 27) */
  const cm=ld&&d.called&&d.called.name&&!d.playing&&Math.abs(pos-d.called.time)<.02?d.called.name:null;
  if(cur){noteIcon(g,37,16,22,'#fff');g.font='400 25px '+LF;const t=cm||((tr.artist?tr.artist+' - ':'')+tr.title);TC(g,t,60,36,25,'#fff',tr.key?622:712);
    if(tr.key){keyGlyph(g,693,17,17,'#fff',NAVY);T(g,keyTxt(tr.key),718,36,25,'#fff');}}
  /* top row */
  modeBox(g,18,53,68,53,'LOOP','MODE',d.loopMode?'#c0600f':null);hit(d,18,53,68,53,()=>{d.loopMode=!d.loopMode;d.jumpMode=false;});
  arrowBox(g,131,53,69,53,-1,fmtJump(d));hit(d,131,53,69,53,()=>beatJump(d,-1));
  arrowBox(g,635,53,69,53,1,fmtJump(d));hit(d,635,53,69,53,()=>beatJump(d,1));
  modeBox(g,714,53,68,53,'BEAT','JUMP',d.jumpMode?'#e8e8e8':null);hit(d,714,53,68,53,()=>{d.jumpMode=!d.jumpMode;d.loopMode=false;});
  phaseMeter(d,g,pos);
  const mode=d.loopMode||d.jumpMode;
  if(ld)drawDetail(d,g,mode?117:125,mode?197:267,d.touchPrev!=null?d.touchPrev:pos,mode);
  else if(cur)T(g,'Loading...',400,205,22,'#8fa6c8',LF,400,'center');
  if(d.loopMode){
    /* as on the real firmware: 8 keys of 91 x 73 px, 5 px apart, dark with an orange edge; the active one filled orange */
    const L=[.25,.5,1,2,4,8,16,32],w=91,h=73,cl=d.loop&&ld?d.loopLenBeats():null;
    L.forEach((n,i)=>{const x=18+i*96,y=204,on=cl!=null&&Math.abs(cl-n)<.01;
      rbox(g,x,y,w,h,3,on?'#ff7100':'#1f2227',on?'#ff7100':'#b4580e',1.6);T(g,fmtBeat(n),x+w/2,y+44,21,on?'#000':'#f2f2f2',LN,400,'center');
      hit(d,x,y,w,h,()=>{if(on)d.exitLoop();else d.beatLoop(n);},{hold:()=>{d.slipBegin();d.beatLoop(n);d.slipLoopHeld=true;},up:()=>{if(d.slipLoopHeld){d.slipLoopHeld=false;d.exitLoop();}}});});
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
  if(!mode&&ld){chip2(g,680,272,48,15,'ZOOM',d.grid?'#555':'#fff');T(g,'– GRID',733,284.5,12,d.grid?'#fff':'#3d3d3d',LA,700,'left');if(d.grid)chip2(g,742,272,38,15,'',  '#fff');}
  if(ld&&!mode){let fx=24;const flag=(t,bg,fg)=>{const w=TW(g,t,11,LA,700)+10;box(g,fx,273,w,14,bg);T(g,t,fx+w/2,284,11,fg,LA,700,'center');fx+=w+5;};
    if(d.slip)flag('SLIP',(SET.slipFlash&&d.ghost&&!slipBlink(d))?'#4a3c06':'#ffd23a','#000');
    if(d.dir<0)flag(d.slipRevHeld?'SLIP REVERSE':'REVERSE','#ff1a1a','#fff');
    if(d.adjust)flag(d.adjust==='in'?'IN ADJUST':'OUT ADJUST','#ff8c00','#000');
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
function chip2(g,x,y,w,h,t,col){g.strokeStyle=col;g.lineWidth=1.3;g.strokeRect(x+.65,y+.65,w-1.3,h-1.3);if(t)T(g,t,x+w/2,y+h-3,12,col,LA,700,'center');}
/* LOOP MODE / BEAT JUMP: when active the key keeps its dark face and takes a coloured edge (orange / white), as on the real firmware */
function modeBox(g,x,y,w,h,l1,l2,on){if(on)rbox(g,x,y,w,h,2,'#1f2227',on,1.6);else box(g,x,y,w,h,'#212429','#39414a',1);const c='#f0f0f0';T(g,l1,x+w/2,y+23,13.5,c,LF,400,'center');T(g,l2,x+w/2,y+40,13.5,c,LF,400,'center');}
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
  if(ld&&b.length){const n=d.beatInBar(pos);bi=n>0?n-1:-1;const target=d.touchPrev!=null?d.touchPrev:nextPoint(d,pos);
    if(target!=null){const nb=Math.max(0,Math.round((target-pos)/d.spb()));cd=Math.floor(nb/4)+'.'+(nb%4+1);}}
  let mcd='- - . -',mbi=-1;if(other){const mp=other.pos();const n=other.beatInBar(mp);mbi=n>0?n-1:-1;const t=nextPoint(other,mp);if(t!=null){const nb=Math.max(0,Math.round((t-mp)/other.spb()));mcd=Math.floor(nb/4)+'.'+(nb%4+1);}}
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
    for(let i=0;i<4;i++){const x=293+i*53.5;if(i){g.fillStyle=outline;g.fillRect(x-5,y+7,5,1.4);}
      g.fillStyle=lit===i?litCol:'#080c08';RR(g,x+.6,y+.6,48.5,14,2.5);g.fill();g.strokeStyle=lit===i?(litCol==='#b40000'?'#ff1a1a':litCol):outline;g.lineWidth=1.4;g.stroke();}
    const num=/\d/.test(label);
    if(num)T(g,label,556,y+14,21,labelCol,LN,400,'right');else{const c=labelCol;g.fillStyle=c;for(let i=0;i<2;i++)g.fillRect(516+i*13,y+6,8,1.6);g.fillRect(541,y+13,2,2);g.fillRect(547,y+6,7,1.6);}
    T(g,'Bars',561,y+14,12.5,labelCol,LA,700,'left');};
  const M2=M===d;
  row(59,'#9c4500',mbi,mbi===0?'#b40000':'#ff8c00',mcd,'#ff7a1a');
  row(83,'#155aa0',bi,bi===0?'#b40000':(M2?'#ff8c00':'#1e64ff'),cd,'#1e96ff');
}
function dashes(g,x,y,col){g.fillStyle=col;g.fillRect(x,y-7,8,1.8);g.fillRect(x+13,y-7,8,1.8);g.fillRect(x+25,y-1.5,2.2,2.2);g.fillRect(x+31,y-7,8,1.8);}
function nextPoint(d,pos){const c=d.cur;if(!c)return null;let best=null;
  for(const m of c.mem)if(m.time>pos+.01&&(best==null||m.time<best))best=m.time;
  for(const k in c.hot){const m=c.hot[k];if(m.time>pos+.01&&(best==null||m.time<best))best=m.time;}return best;}
/* detail waveform: RGB (PWV5) or blue (PWV3) at 150 columns per second */
function wfSample(i,an,blue){
  if(!blue&&an.colorDetail){const v=an.colorDetail[i];if(v==null)return null;return {h:(v>>2)&31,r:((v>>13)&7)*255/7,g:((v>>10)&7)*255/7,b:((v>>7)&7)*255/7};}
  if(an.detail){const v=an.detail[i];if(v==null)return null;return {h:v&31,w:v>>5};}
  if(an.colorDetail){const v=an.colorDetail[i];if(v==null)return null;const h=(v>>2)&31;return {h,w:Math.min(7,h>>2)};}
  return null;
}
function drawDetail(d,g,top,bot,pos,compact){
  const an=d.cur.an,blue=SET.wfColor===0;
  const m=compact?13:25,bt=top+m,bb=bot-m,cy=(bt+bb)/2,amp=(bb-bt)/2,pps=ZOOMS[d.zi],mx=SET.wfPos===1?200:400;
  const xs=Math.max(18,mx-pos*pps),xe=Math.min(782,mx+(d.dur-pos)*pps);
  if(xe>xs){const bg=g.createLinearGradient(0,bt,0,bb);
    if(blue){bg.addColorStop(0,'#000');bg.addColorStop(.5,'#0e2d66');bg.addColorStop(1,'#000');}else{bg.addColorStop(0,'#060606');bg.addColorStop(.5,'#2c2c2c');bg.addColorStop(1,'#060606');}
    g.fillStyle=bg;g.fillRect(xs,bt-2,xe-xs,bb-bt+4);}
  if(mx-pos*pps>18){g.fillStyle=blue?'#c8dcff':'#bbb';g.fillRect(18,cy-.5,Math.min(764,mx-pos*pps-18),1);}
  g.save();g.beginPath();g.rect(18,top,764,bot-top);g.clip();
  const src=blue?(an.detail||an.colorDetail):(an.colorDetail||an.detail),n=src?src.length:0;
  if(n){const k=Math.max(1,Math.ceil(150/pps)),cw=k*pps/150;      /* k data columns per drawn bar, bars anchored to the track */
    const g0=Math.max(0,Math.floor((pos-(mx-18)/pps)*150/k)),g1=Math.min(Math.ceil(n/k),Math.ceil((pos+(782-mx)/pps)*150/k)+1);
    for(let gi=g0;gi<g1;gi++){let hmax=0,best=-1;for(let j=gi*k;j<Math.min(n,gi*k+k);j++){const s2=wfSample(j,an,blue);if(s2&&s2.h>=hmax){hmax=s2.h;best=j;}}
      if(best<0)continue;const sm=wfSample(best,an,blue);const x=mx+(gi*k/150-pos)*pps;
      const a2=Math.min(amp,Math.max(.5,sm.h/31*amp*1.12));
      if(sm.r!=null)g.fillStyle='rgb('+(sm.r|0)+','+(sm.g|0)+','+(sm.b|0)+')';else{const w=sm.w/7;g.fillStyle='rgb('+Math.round(80+175*w)+','+Math.round(150+105*w)+',255)';}
      g.fillRect(x,cy-a2,Math.max(cw,.6),a2*2);}}
  const lp=d.loop;
  if(lp){const xa=mx+(lp.a-pos)*pps,xb=mx+(lp.b-pos)*pps;g.fillStyle='rgba(255,140,0,.35)';g.fillRect(xa,bt,xb-xa,bb-bt);
    const bl=Math.floor(now()*6)%2;g.fillStyle=d.adjust==='in'&&bl?'#fff':'#ff8c00';g.fillRect(xa-1,bt,2.5,bb-bt);g.fillStyle=d.adjust==='out'&&bl?'#fff':'#ff8c00';g.fillRect(xb-1.5,bt,2.5,bb-bt);}
  else if(d.loopIn!=null){const x=mx+(d.loopIn-pos)*pps;g.fillStyle='#ff8c00';g.fillRect(x-1,bt,2,bb-bt);}
  const b=d.beats(),go=d.gridOff||0;
  if(b.length){const t0=(pos-(mx-18)/pps)*1000,t1=(pos+(782-mx)/pps)*1000;
    for(let i=lowerBound(b,t0-go*1000);i<b.length&&b[i].t+go*1000<=t1;i++){const x=Math.round(mx+((b[i].t/1000+go)-pos)*pps);const bar=b[i].n===1;
      if(bar){g.fillStyle='#ff0000';g.fillRect(x-1,top,2,12);g.fillRect(x-1,bot-12,2,12);}
      else{g.fillStyle='#fff';g.fillRect(x-.75,top+8,1.5,6);g.fillRect(x-.75,bot-14,1.5,6);}
      if(d.grid){g.fillStyle=bar?'rgba(255,40,40,.7)':'rgba(255,255,255,.35)';g.fillRect(x-.5,bt,1,bb-bt);}}}
  const cur=d.cur;
  for(const c of cur.mem){const x=mx+(c.time-pos)*pps;if(x<0||x>800)continue;const col=c.color&&SET.hcColor?c.color:'#ff1a1a';
    g.fillStyle=col;g.beginPath();g.moveTo(x-6,bt-1);g.lineTo(x+6,bt-1);g.lineTo(x,bt+7);g.fill();}
  for(const k in cur.hot){const c=cur.hot[k];const x=mx+(c.time-pos)*pps;if(x<-20||x>820)continue;const col=hotColor(c);
    g.fillStyle=col;g.fillRect(x-.5,bt,1.2,bb-bt);g.fillRect(x,bb-13,12,13);T(g,HL[c.hot-1],x+6,bb-2.5,10.5,'#000',LA,700,'center');}
  const cx=mx+(d.cue-pos)*pps;if(cx>18&&cx<782){g.fillStyle='#ff8c00';g.beginPath();g.moveTo(cx-6,bb+1);g.lineTo(cx+6,bb+1);g.lineTo(cx,bb-7);g.fill();}
  if(d.ghost){const x=mx+(d.ghost.pos-pos)*pps;g.fillStyle='rgba(255,210,0,.95)';g.fillRect(x-1,top,2,bot-top);}
  g.restore();
  g.fillStyle=d.touchPrev!=null?'#ffcf3a':'#fff';g.fillRect(mx-1.5,top,3,bot-top);
}
/* ---------- list pages ---------- */
function rowBg(g,r,x0,x1,y,sel){g.fillStyle=sel?SELBG:(r%2?ROW1:ROW0);g.fillRect(x0,y,x1-x0,LROWH);}
function clampList(st,n,rows){rows=rows||LROWS;st.sel=clamp(st.sel,0,Math.max(0,n-1));if(st.sel<st.top)st.top=st.sel;if(st.sel>=st.top+rows)st.top=st.sel-rows+1;st.top=clamp(st.top,0,Math.max(0,n-rows));}
function scrollBar(g,st,n,rows,y0){rows=rows||LROWS;y0=y0||LY;if(n<=rows)return;const h=rows*LROWH,th=Math.max(14,h*rows/n),ty=y0+(h-th)*st.top/Math.max(1,n-rows);g.fillStyle='#d8d8d8';g.fillRect(21,ty,3,th);}
function listState(d,kind){return kind==='taglist'?d.ui.tl:curNav(d);}
function listItems(d,kind){return kind==='taglist'?levelItems(d,{k:'taglist'}):levelItems(d,curNav(d));}
function drawList(d,g,kind){
  const u=d.ui,st=listState(d,kind);const items=u.items=listItems(d,kind);const rows=kind==='taglist'?7:LROWS;clampList(st,items.length,rows);
  const nv=curNav(d);const title=kind==='taglist'?'TAG LIST':(nv.k==='media'?'USB':nv.k==='root'?nv.m.name:(nv.label||''));
  titleBar(g);bracketText(g,title,24,36,25,'#fff',560);
  const M=navMedium(d);if(filterActive(M)&&kind!=='taglist'&&nv.k!=='media'){funnel(g,700,19,15,'#fff');const n=items.filter(x=>x.kind==='track').length;T(g,'[ '+(n||filt(M,M.tracks).length)+']',776,36,22,'#fff',LF,400,'right');}
  const tracks=kind==='taglist'||(items.length>0&&items.some(x=>x.kind==='track'));
  const panel=!tracks||u.info;const x1=panel?470:782;
  const sortCol=nv.sortCol||25;const rcol=(!sortCol||sortCol===25||sortCol===26)?(M?M.column:0):sortCol;
  for(let r=0;r<rows;r++){const i=st.top+r,it=items[i];const y=LY+r*LROWH;const sel=it&&i===st.sel;
    rowBg(g,r,30,x1,y,sel);if(!it)continue;
    if(it.kind==='track'){const t=it.tr,isCur=d.cur&&d.cur.tr===t;const thumb=kind!=='taglist';const ldAny=DECKS.some(x=>x.cur&&x.cur.tr===t);
      let tx=thumb?112:40;
      if(thumb){const art=artFor(t);g.fillStyle='#0e0e0e';g.fillRect(30,y,74,LROWH);
        if(art){const s=Math.max(74/art.width,LROWH/art.height),sw=74/s,sh=LROWH/s;g.drawImage(art,(art.width-sw)/2,(art.height-sh)/2,sw,sh,30,y,74,LROWH);}
        else{g.fillStyle='#2b2b2b';g.beginPath();g.ellipse(67,y+LROWH+6,34,30,0,Math.PI,0);g.fill();g.fillStyle='#1a1a1a';g.beginPath();g.ellipse(67,y+LROWH+6,9,8,0,Math.PI,0);g.fill();}}
      const col=ldAny?LOADED_C:(t.played?PLAYED_C:(sel?'#000':'#fff'));
      if(isCur)playIcon(g,tx,y+8,14,'#2fb52f','#000');else fileIcon(g,tx-1,y+4,col);
      const tagged=TAGLIST.includes(t)&&kind!=='taglist';
      const right=panel?0:(rcol?190:0);
      TC(g,t.title,tx+24,y+23,24,col,x1-(tx+24)-right-(tagged?22:6));
      if(tagged){const cx=x1-right-16;g.strokeStyle=sel?'#000':'#8fe35a';g.lineWidth=2.2;g.beginPath();g.moveTo(cx-5,y+15);g.lineTo(cx-1,y+20);g.lineTo(cx+6,y+9);g.stroke();}
      if(right)rightCol(g,t,rcol,x1-right+4,y,right-8,ldAny?LOADED_C:(t.played?PLAYED_C:(sel?'#000':'#fff')));}
    else{if(it.swatch){dot(g,45,y+15,7,it.swatch);}else catIcon(g,it.icon,37,y+5,sel?'#000':'#fff');
      if(it.stars!=null){for(let k=0;k<5;k++)star(g,72+k*20,y+15,8,sel?'#000':'#fff',k<it.stars);}
      else TC(g,it.label,63,y+23,24,sel?'#000':'#fff',x1-70);}
    hit(d,30,y,x1-30,LROWH,()=>{if(st.sel===i)listEnter(d,kind);else st.sel=i;},{list:kind,row:i});
  }
  scrollBar(g,st,items.length,rows);
  if(!items.length)T(g,'No Track.',250,170,22,'#8a8a8a',LF,400,'center');
  if(kind==='taglist'){g.fillStyle='#c7cbd2';g.fillRect(30,LY+7*LROWH,752,LROWH);T(g,'Total Track '+items.length,772,LY+7*LROWH+22,20,'#000',LF,400,'right');}
  if(u.info&&items[st.sel]){infoPanel(d,g,items[st.sel],st);}
  else if(!tracks)previewPanel(d,g,items,st);
  if(u.sort)sortPanel(d,g);
}
function rightCol(g,t,col,x,y,w,c){
  switch(col){
    case 11:if(t.key){keyGlyph(g,x,y+8,14,c,c==='#000'?SELBG:'#000');T(g,keyTxt(t.key),x+20,y+22,20,c);}return;
    case 6:for(let k=0;k<5;k++)star(g,x+8+k*17,y+15,6.5,c,k<t.rating);return;
    case 13:if(t.colorId)dot(g,x+9,y+15,7,MEMC[t.colorId]);return;
    case 5:if(t.bpm){catIcon(g,'bpm',x,y+5,c);T(g,t.bpm.toFixed(1),x+24,y+22,20,c);}return;
  }
  const v=colValue(t,col);if(v){TC(g,v,x,y+22,20,c,w);}
}
function panelBox(g,y0,notchY){g.fillStyle='#f7f3f7';g.fillRect(470,43,312,246);g.strokeStyle='#b8b8b8';g.lineWidth=1;g.strokeRect(470.5,43.5,311,245);
  if(notchY!=null){g.fillStyle='#f7f3f7';g.beginPath();g.moveTo(455,notchY);g.lineTo(471,notchY-10);g.lineTo(471,notchY+10);g.closePath();g.fill();g.strokeStyle='#b8b8b8';g.beginPath();g.moveTo(470,notchY-10);g.lineTo(455,notchY);g.lineTo(470,notchY+10);g.stroke();}}
function previewPanel(d,g,items,st){
  const it=items[st.sel];panelBox(g,LY,it?LY+(st.sel-st.top)*LROWH+15:null);
  for(let r=1;r<LROWS;r++){g.fillStyle='#dedfde';g.fillRect(480,LY+r*LROWH,292,1);}
  if(!it||it.kind!=='dir'||!it.next)return;
  let kids=[];try{kids=levelItems(d,it.next).slice(0,LROWS);}catch(e){}
  kids.forEach((k,j)=>{const y=LY+j*LROWH;
    if(k.kind==='track'){fileIcon(g,480,y+4,'#000');TC(g,k.tr.title,508,y+23,24,'#000',266);}
    else{if(k.swatch){dot(g,489,y+15,7,k.swatch);}else catIcon(g,k.icon,481,y+5,'#000');
      if(k.stars!=null){for(let q=0;q<5;q++)star(g,516+q*20,y+15,8,'#000',q<k.stars);}else TC(g,k.label,508,y+23,24,'#000',266);}});
}
/* INFO in a list: white panel with the selected track's details */
function infoPanel(d,g,it,st){
  panelBox(g,LY,LY+(st.sel-st.top)*LROWH+15);
  if(it.kind!=='track'){TC(g,it.label||'',482,LY+26,22,'#000',290);return;}
  const t=it.tr,lh=26.6;
  const rows=[['artist',t.artist],['genre',t.genre],['time',fmtT(t.duration)],['bpm',t.bpm?t.bpm.toFixed(2):''],['key',keyTxt(t.key)],['rating',null],['album',t.album],['color',null],['comment',t.comment]];
  rows.forEach(([ic,v],i)=>{const y=LY+2+i*lh;catIcon(g,ic,478,y+3,'#000');
    if(ic==='rating'){for(let k=0;k<5;k++)star(g,508+k*17,y+14,6.5,'#000',k<t.rating);return;}
    if(ic==='color'){if(t.colorId)dot(g,508,y+12,7,MEMC[t.colorId]);return;}
    TC(g,v||'',500,y+20,20,'#000',i<5?132:270);});
  const art=artFor(t);const ax=640,ay=LY+56,as=130;g.fillStyle='#2a3a5a';g.fillRect(ax,ay,as,as);
  if(art)g.drawImage(art,ax,ay,as,as);else{g.fillStyle='#c8cdd8';g.beginPath();g.arc(ax+as/2,ay+as/2,52,0,7);g.fill();g.fillStyle='#8a94a8';g.beginPath();g.arc(ax+as/2,ay+as/2,16,0,7);g.fill();g.fillStyle='#2a3a5a';g.beginPath();g.arc(ax+as/2,ay+as/2,4,0,7);g.fill();}
  const tags=[...(t.m.ttags.get(t.id)||[])].map(id=>t.m.tagById.get(id)).filter(Boolean).map(x=>x.name);
  if(tags.length)TC(g,tags.join(' · '),640,ay+as+16,13,'#333',134,LA);
}
/* SORT (MENU in a track list): the items and their order come from the USB */
function sortPanel(d,g){
  const SM=navMedium(d)||RM,L=SM.sortMenu,st=d.ui.sort;st.sel=clamp(st.sel,0,L.length-1);
  const x0=430,w=352,y0=12,rh=26;const cur=curNav(d).sortCol||25;
  g.fillStyle='#e9ebf0';g.fillRect(x0,y0,w,26);T(g,'SORT',x0+w/2,y0+20,19,'#8a8f9a',LF,400,'center');
  const n=Math.min(L.length,10);g.fillStyle='#aab3c2';g.fillRect(x0,y0+26,w,n*rh+6);
  L.slice(0,n).forEach((id,i)=>{const y=y0+29+i*rh,sel=i===st.sel;if(sel){g.fillStyle='#f4f5f8';g.fillRect(x0+4,y,w-8,rh);}
    bracketText(g,colName(id,SM),x0+14,y+20,20,sel?'#000':(id===cur?'#103063':'#1d2330'),w-40);
    if(id===cur){triL(g,x0+w-14,y+13,5,'#103063');}
    hit(d,x0,y,w,rh,()=>{if(st.sel===i)sortApply(d);else st.sel=i;});});
}
function sortApply(d){const st=d.ui.sort;const id=(navMedium(d)||RM).sortMenu[st.sel];if(id==null)return;const nv=curNav(d);nv.sortCol=id;nv.sel=0;nv.top=0;d.ui.sort=null;}
function listEnter(d,kind){
  const u=d.ui,st=listState(d,kind),items=listItems(d,kind),it=items[st.sel];if(!it)return;
  if(it.kind==='dir'){
    if(it.cat===27){toast(say('MATCHING : non disponible ici (il faut les données de correspondance de rekordbox)','MATCHING: not available here (needs rekordbox matching data)'));return;}
    if(it.next.k==='cat'&&it.next.cat===20){u.nav.push({k:'search',label:'SEARCH',sel:0,top:0});u.search.q='';u.search.sel=0;u.search.top=0;return;}
    u.nav.push(Object.assign({sel:0,top:0,sortCol:curNav(d).sortCol},it.next));u.info=false;}
  else{const list=items.filter(x=>x.kind==='track').map(x=>x.tr);d.loadTrack(it.tr,{list});}
}
/* ---------- search: keyboard on screen ---------- */
const KB=[['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'],['1234567890','-/:;()&@"','.,?!\'#%']];
function drawSearch(d,g){
  const s=d.ui.search;const items=levelItems(d,{k:'search'});const R=5;clampList(s,items.length,R);
  titleBar(g);bracketText(g,'SEARCH',24,36,25,'#fff');box(g,150,16,500,22,'#000','#8a8a8a',1);
  T(g,s.q+(Math.floor(now()*2)%2?'_':''),156,33,19,'#fff',LF);T(g,String(items.length),774,36,22,'#fff',LF,400,'right');
  if(filterActive(navMedium(d)))funnel(g,700,19,15,'#fff');
  for(let r=0;r<R;r++){const i=s.top+r,it=items[i];const y=LY+r*LROWH;rowBg(g,r,30,782,y,it&&i===s.sel);if(!it)continue;const sel=i===s.sel;const t=it.tr,isCur=d.cur&&d.cur.tr===t;
    const ldAny=DECKS.some(x=>x.cur&&x.cur.tr===t);const col=ldAny?LOADED_C:(t.played?PLAYED_C:(sel?'#000':'#fff'));if(isCur)playIcon(g,40,y+8,14,'#2fb52f','#000');else fileIcon(g,39,y+4,col);
    TC(g,t.title,64,y+23,24,col,470);TC(g,t.artist,560,y+22,20,sel?'#000':'#bbb',214);
    hit(d,30,y,752,LROWH,()=>{if(s.sel===i)d.loadTrack(t,{list:items.map(x=>x.tr)});else s.sel=i;});}
  scrollBar(g,s,items.length,R);
  const rows=KB[s.kb],ky=206,kh=46,gap=5;
  rows.forEach((row,ri)=>{const n=row.length,kw=72,off=18+(10-n)*(kw+gap)/2;[...row].forEach((ch,ci)=>{const x=off+ci*(kw+gap),y=ky+ri*(kh+gap);
    box(g,x,y,kw,kh,'#2a2e35','#4a505a',1);T(g,ch,x+kw/2,y+31,22,'#fff',LN,400,'center');hit(d,x,y,kw,kh,()=>{s.q+=ch;s.sel=0;s.top=0;});});});
  const by=ky+3*(kh+gap);
  [[s.kb?'ABC':'123',18,110,()=>{s.kb=1-s.kb;}],['SPACE',134,380,()=>{s.q+=' ';s.sel=0;}],['DELETE',520,130,()=>{s.q=s.q.slice(0,-1);s.sel=0;}],['CLEAR',656,126,()=>{s.q='';s.sel=0;}]].forEach(([l,x,w,fn])=>{
    box(g,x,by,w,kh,'#2a2e35','#4a505a',1);T(g,l,x+w/2,by+30,18,'#fff',LF,400,'center');hit(d,x,by,w,kh,fn);});
}
/* ---------- INFO on the play screen: the loaded track, each line jumps to its category ---------- */
function infoPlayRows(d){const t=d.cur&&d.cur.tr;if(!t)return [];
  return [['TITLE',t.title,null],['ARTIST',t.artist,{k:'artistAlb',id:t.artistId,label:t.artist},'artist'],['ALBUM',t.album,{k:'trk',by:'album',id:t.albumId,label:t.album},'album'],
    ['GENRE',t.genre,{k:'genreArt',id:t.genreId,label:t.genre},'genre'],['LABEL',t.label,{k:'trk',by:'label',id:t.labelId,label:t.label},'label'],
    ['KEY',keyTxt(t.key),{k:'trk',by:'key',id:t.keyId,label:keyTxt(t.key)},'key'],['BPM',t.bpm?t.bpm.toFixed(2):'',{k:'trk',by:'bpm',id:Math.round(t.bpm),label:String(Math.round(t.bpm))},'bpm'],
    ['RATING','',{k:'trk',by:'rating',id:t.rating,label:'RATING'},'rating'],['COLOR',t.colorId?(t.m.lib.colors[t.colorId]||COLNAME[t.colorId]):'',t.colorId?{k:'trk',by:'color',id:t.colorId,label:COLNAME[t.colorId]}:null,'color'],
    ['TIME',fmtT(t.duration),null,'time'],['COMMENTS',t.comment,null,'comment'],['DATE ADDED',t.dateAdded,null,'date'],
    ['MY TAG',[...(t.m.ttags.get(t.id)||[])].map(id=>t.m.tagById.get(id)).filter(Boolean).map(x=>x.name).join(', '),null,'genre']];}
function drawInfoPlay(d,g){
  titleBar(g);bracketText(g,'INFO',24,36,25,'#fff');
  const L=infoPlayRows(d),st=d.ui.iplay;clampList(st,L.length);
  if(!L.length){T(g,'No Track.',400,170,22,'#8a8a8a',LF,400,'center');return;}
  for(let r=0;r<LROWS;r++){const i=st.top+r,it=L[i];const y=LY+r*LROWH;const sel=it&&i===st.sel;rowBg(g,r,30,620,y,sel);if(!it)continue;
    const c=sel?'#000':'#fff';if(it[3])catIcon(g,it[3],37,y+5,c);else noteIcon(g,37,y+5,18,c);
    if(it[0]==='RATING'){for(let k=0;k<5;k++)star(g,72+k*20,y+15,8,c,k<d.cur.tr.rating);}
    else TC(g,it[1]||'',63,y+23,24,c,550);
    hit(d,30,y,590,LROWH,()=>{if(st.sel===i)infoJump(d);else st.sel=i;});}
  scrollBar(g,st,L.length);
  const t=d.cur.tr,art=artFor(t);g.fillStyle='#202020';g.fillRect(630,LY,152,152);if(art)g.drawImage(art,630,LY,152,152);else noteIcon(g,684,LY+50,48,'#444');
  T(g,'MEMORY '+d.cur.mem.length,632,LY+176,14,'#ff4a4a',LA,700,'left');T(g,'HOT CUE '+Object.keys(d.cur.store).length,632,LY+198,14,'#3fd23f',LA,700,'left');
}
function infoJump(d){const L=infoPlayRows(d),it=L[d.ui.iplay.sel];if(!it||!it[2])return;const u=d.ui;
  const catOf={artistAlb:2,genreArt:1};u.nav=[{k:'media',sel:0,top:0},{k:'root',m:d.cur.tr.m,label:d.cur.tr.m.name,sel:0,top:0},Object.assign({sel:0,top:0},it[2])];u.scr='browse';}
/* ---------- MENU on the play screen: LOAD PREVIOUS TRACK ---------- */
function drawLoadPrev(d,g){
  const L=d.hist.filter(t=>t.m.mounted),st=d.ui.menu;st.sel=clamp(st.sel,0,Math.max(0,L.length-1));
  g.fillStyle='#f7f3f7';g.fillRect(400,43,382,246);g.fillStyle='#c7cbd2';g.fillRect(400,43,382,28);T(g,'LOAD PREVIOUS TRACK',591,63,18,'#1d2330',LF,400,'center');
  for(let r=0;r<7;r++){const y=73+r*30,t=L[r];if(r)g.fillStyle='#dedfde',g.fillRect(408,y,366,1);if(!t)continue;const sel=r===st.sel;
    if(sel){g.fillStyle='#103063';g.fillRect(402,y+1,378,29);}const c=sel?'#fff':'#000';
    T(g,String(r+1),418,y+22,17,sel?'#fff':'#666',LN,400,'center');fileIcon(g,432,y+4,c);TC(g,t.title,458,y+23,21,c,316);
    hit(d,400,y,382,30,()=>{if(st.sel===r)menuLoad(d);else st.sel=r;});}
  if(!L.length)T(g,'No Track.',591,170,20,'#666',LF,400,'center');
}
function menuLoad(d){const L=d.hist.filter(t=>t.m.mounted);const t=L[d.ui.menu.sel];if(t)d.loadTrack(t);}
/* ---------- UTILITY ---------- */
function drawUtility(d,g){
  const st=d.ui.util;st.sel=clamp(st.sel,0,UTIL_COUNT-1);if(st.sel<st.top)st.top=st.sel;if(st.sel>=st.top+LROWS)st.top=st.sel-LROWS+1;
  g.fillStyle='#5c5b60';g.fillRect(18,12,764,30);T(g,'UTILITY',30,35,24,'#fff');
  if(RM&&RM.setFound.length)T(g,'My Settings : '+RM.name,772,34,15,'#d6f5c0',LA,400,'right');
  for(let r=0;r<LROWS;r++){const i=st.top+r,it=SETDEF[i];const y=LY+r*LROWH;if(!it)continue;const sel=i===st.sel;
    g.fillStyle=sel?'#d6d7db':(r%2?'#33362b':'#3c3d35');g.fillRect(30,y,752,LROWH-1);g.fillStyle='#5e6152';g.fillRect(30,y+LROWH-1,752,1);
    if(!sel){g.fillStyle='#5e6152';g.fillRect(470,y,1,LROWH);}
    /* PLAYER No. is grey and cannot be changed while a storage device is connected (manual p. 12) */
    const grey=it[0]==='playerNo'&&anyMedia();const lc=grey?'#8a8a8a':'#fff';
    T(g,it[1],44,y+23,22,sel?(grey?'#8a8a8a':'#3a3a3a'):lc,LF);
    /* while a value is being changed it is only shown: it takes effect when the selector is pushed (manual p. 38) */
    let val=it[2][sel&&st.edit?st.val:SET[it[0]]];if(it[0]==='version')val='Ver 1.85 (sim.)';if(it[0]==='linkStatus')val=anyMedia()?'NOT CONNECTED':'';
    if(sel&&st.edit){g.fillStyle='#fff';g.fillRect(471,y,311,LROWH-1);triR(g,478,y+15,5,'#000');}
    T(g,val,492,y+23,22,sel?(grey?'#8a8a8a':'#000'):lc,LF);
    if(SETSRC[it[0]]==='usb'&&!sel){T(g,'USB',772,y+20,11,'#9fd27a',LA,700,'right');}
    hit(d,30,y,752,LROWH,()=>{if(st.sel===i){utilEnter(d);}else{st.sel=i;st.edit=false;}});}
  const h=LROWS*LROWH,th=h*LROWS/UTIL_COUNT,ty=LY+(h-th)*st.top/(UTIL_COUNT-LROWS);g.fillStyle='#bbb';g.fillRect(21,ty,3,th);
}
/* push: first on a setting, the cursor goes to its value; pushed again, the value is set (BACK before that cancels it: manual p. 38) */
function utilEnter(d){const st=d.ui.util,it=SETDEF[st.sel];if(!it||it[7])return;
  if(it[0]==='playerNo'){toast(anyMedia()?say('PLAYER No. : débranche la clé pour le changer','PLAYER No.: unplug the USB to change it'):say('PLAYER No. : AUTO, le numéro de la tranche de la table où la platine est branchée','PLAYER No.: AUTO, the mixer channel the player is plugged into'));return;}
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
    if(!dis)hit(d,x,y,w,h,()=>{const u=d.ui;u.scr='browse';u.info=false;u.sort=null;
      const M=navMedium(d)||RM;if(id===20){u.nav=[{k:'media',sel:0,top:0},{k:'root',m:M,label:M.name,sel:0,top:0},{k:'search',label:'SEARCH',sel:0,top:0}];u.search.q='';}
      else{const it=levelItems(d,{k:'root',m:M});const j=it.findIndex(x=>x.cat===id);u.nav=[{k:'media',sel:0,top:0},{k:'root',m:M,label:M.name,sel:Math.max(0,j),top:0},{k:'cat',cat:id,label:colName(id,M),sel:0,top:0}];}});});
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
