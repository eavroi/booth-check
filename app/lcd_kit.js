/* ---------------- LCD drawing kit (800 x 480 logical, like the player's touch screen) ---------------- */
const LF='"Fira Sans Condensed","Arial Narrow",Arial,sans-serif',LA='Arimo,Arial,"Helvetica Neue",sans-serif',LN='Roboto,Arial,sans-serif';
const NAVY='#103062',SELBG='#dedee6',ROW0='#313031',ROW1='#181c18';
/* BACKGROUND COLOR of the USB, by its value in export.pdb: name, title bar, scroll bar (seen on the firmware) */
const BGCOL=[['DEFAULT COLOR',NAVY,'#8b8994'],['PINK','#a424a4','#c559c5'],['RED','#940000','#c50000'],['ORANGE','#8b4800','#cd7100'],['YELLOW','#8b7908','#c5b620'],['GREEN','#007500','#00b200'],['AQUA','#006983','#0099c5'],['BLUE','#001c83','#0040c5'],['PURPLE','#62008b','#94006a']];
/* the firmware's letters are taller and narrower than Fira Sans Condensed: drawn larger and pressed sideways */
const LFX=.88,LFS=1.12,isLF=f=>!f||f===LF;
function setF(g,size,font,wt){g.font=(wt||400)+' '+(isLF(font)?size*LFS:size)+'px '+(font||LF);}
function fillT(g,s,x,y,font){if(isLF(font)){g.save();g.translate(x,y);g.scale(LFX,1);g.fillText(s,0,0);g.restore();}else g.fillText(s,x,y);}
function T(g,t,x,y,size,col,font,wt,al){setF(g,size,font,wt);g.fillStyle=col||'#fff';g.textAlign=al||'left';fillT(g,t,x,y,font);}
function TW(g,t,size,font,wt){setF(g,size,font,wt);return g.measureText(t).width*(isLF(font)?LFX:1);}
/* text clipped to a width, cut without ellipsis like the player */
function TC(g,t,x,y,size,col,max,font,wt){setF(g,size,font,wt);g.fillStyle=col||'#fff';g.textAlign='left';let s=String(t==null?'':t);const k=isLF(font)?LFX:1;
  if(g.measureText(s).width*k>max){let lo=0,hi=s.length;while(lo<hi){const m=(lo+hi+1)>>1;if(g.measureText(s.slice(0,m)).width*k<=max)lo=m;else hi=m-1;}s=s.slice(0,lo);}fillT(g,s,x,y,font);}
/* the same text under the cursor: when it is too long it runs to the left and comes back round (firmware; the speed is ours) */
function TS(g,t,x,y,size,col,max,font,wt){const s=String(t==null?'':t),w=TW(g,s,size,font,wt);if(w<=max){TC(g,s,x,y,size,col,max,font,wt);return;}
  const L=w+48,T0=L/40+1.5,off=Math.max(0,now()%T0-1.5)*40;g.save();g.beginPath();g.rect(x,y-size*1.1,max,size*1.5);g.clip();g.fillStyle=col||'#fff';g.textAlign='left';fillT(g,s,x-off,y,font);fillT(g,s,x-off+L,y,font);g.restore();}
function RR(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function rbox(g,x,y,w,h,r,fill,stroke,lw){const o=stroke?(lw||1)/2:0;g.beginPath();g.roundRect(x+o,y+o,w-2*o,h-2*o,r);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw||1;g.stroke();}}
function box(g,x,y,w,h,fill,stroke,lw){if(fill){g.fillStyle=fill;g.fillRect(x,y,w,h);}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw||1;const o=(lw||1)/2;g.strokeRect(x+o,y+o,w-2*o,h-2*o);}}
function withAlpha(css,a){const m=/^#([0-9a-f]{6})$/i.exec(css);if(m){const n=parseInt(m[1],16);return 'rgba('+(n>>16)+','+((n>>8)&255)+','+(n&255)+','+a+')';}const r=/rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(css);return r?'rgba('+r[1]+','+r[2]+','+r[3]+','+a+')':css;}
/* 【 and 】 drawn as shapes so they look the same everywhere */
function lent(g,x,y,h,col,right){const w=h*.34;g.fillStyle=col;g.beginPath();
  if(!right){g.moveTo(x,y);g.lineTo(x+w,y);g.quadraticCurveTo(x-w*.3,y+h/2,x+w,y+h);g.lineTo(x,y+h);g.closePath();}
  else{g.moveTo(x+w,y);g.lineTo(x,y);g.quadraticCurveTo(x+w*1.3,y+h/2,x,y+h);g.lineTo(x+w,y+h);g.closePath();}
  g.fill();return w;}
function bracketText(g,t,x,y,size,col,max,font){const h=size*.96,top=y-size*.8;const w=lent(g,x,top,h,col,false);
  let s=t;const lim=(max||600)-2*w-6;while(s.length>1&&TW(g,s,size,font)>lim)s=s.slice(0,-1);
  T(g,s,x+w+3,y,size,col,font);const tw=TW(g,s,size,font);lent(g,x+w+5+tw,top,h,col,true);return 2*w+8+tw;}
/* icons */
function noteIcon(g,x,y,s,col){g.save();g.fillStyle=col;g.strokeStyle=col;g.lineWidth=s*.12;g.beginPath();g.ellipse(x+s*.28,y+s*.78,s*.22,s*.16,-.4,0,7);g.fill();
  g.beginPath();g.moveTo(x+s*.47,y+s*.76);g.lineTo(x+s*.47,y+s*.06);g.stroke();g.beginPath();g.moveTo(x+s*.47,y+s*.06);g.quadraticCurveTo(x+s*.62,y+s*.32,x+s*.86,y+s*.36);g.quadraticCurveTo(x+s*.66,y+s*.42,x+s*.47,y+s*.3);g.fill();g.restore();}
/* the track icon of the lists: a note with a small H, as on the firmware */
function fileIcon(g,x,y,col){noteIcon(g,x+5,y+1,21,col);g.font='700 10px '+LA;g.fillStyle=col;g.textAlign='left';g.fillText('H',x,y+11);}
/* the USB sign of the title bars and of the supports */
function usbIcon(g,x,y,col){g.save();g.strokeStyle=col;g.fillStyle=col;g.lineWidth=1.3;g.beginPath();g.moveTo(x+2,y+10);g.lineTo(x+17,y+10);g.stroke();g.beginPath();g.arc(x+2.5,y+10,2.5,0,7);g.fill();
  g.beginPath();g.moveTo(x+21,y+10);g.lineTo(x+16.5,y+7.4);g.lineTo(x+16.5,y+12.6);g.fill();
  g.beginPath();g.moveTo(x+5,y+10);g.lineTo(x+8.5,y+6.2);g.lineTo(x+13,y+6.2);g.stroke();g.fillRect(x+12.5,y+4.8,2.8,2.8);
  g.beginPath();g.moveTo(x+6.5,y+10);g.lineTo(x+9.5,y+13.8);g.lineTo(x+12,y+13.8);g.stroke();g.beginPath();g.arc(x+13,y+13.8,1.5,0,7);g.fill();g.restore();}
/* the sign of LOOP: a loop with its arrow on the left */
function loopIcon(g,x,y,col){g.strokeStyle=col;g.fillStyle=col;g.lineWidth=1.6;g.beginPath();g.moveTo(x+5,y+10);g.lineTo(x+13,y+10);g.arcTo(x+16,y+10,x+16,y+7,3);g.lineTo(x+16,y+4);g.arcTo(x+16,y+1,x+13,y+1,3);g.lineTo(x+3,y+1);g.stroke();g.beginPath();g.moveTo(x+6,y-2);g.lineTo(x,y+1.2);g.lineTo(x+6,y+4.4);g.fill();}
/* a hot cue on the waveforms: a square with a coloured edge, its letter in the same colour */
function hotMark(g,x,y,col,l){box(g,x,y,11,11,'#000',col,2);T(g,l,x+5.5,y+9,8.5,col,LA,700,'center');}
function keyGlyph(g,x,y,s,bg,fg){g.fillStyle=bg;g.fillRect(x,y,s,s);g.fillStyle=fg;const k=s/15;
  g.save();g.translate(x,y);g.scale(k,k);g.lineWidth=1.2;g.strokeStyle=fg;
  g.beginPath();g.moveTo(3,2.5);g.lineTo(3,12);g.stroke();g.beginPath();g.moveTo(3,12);g.quadraticCurveTo(7.5,9,6.5,7.5);g.quadraticCurveTo(5,6.5,3,8.3);g.stroke();
  for(const xx of [9.4,11.6]){g.beginPath();g.moveTo(xx,3);g.lineTo(xx,12);g.stroke();}
  for(const yy of [6,9]){g.beginPath();g.moveTo(8.2,yy+.6);g.lineTo(12.8,yy-.6);g.lineWidth=1.5;g.stroke();g.lineWidth=1.2;}
  g.restore();}
function playIcon(g,x,y,s,bg,fg){g.fillStyle=bg;g.fillRect(x,y,s,s);g.fillStyle=fg;g.beginPath();g.moveTo(x+s*.3,y+s*.2);g.lineTo(x+s*.78,y+s*.5);g.lineTo(x+s*.3,y+s*.8);g.fill();}
function triR(g,x,y,s,col){g.fillStyle=col;g.beginPath();g.moveTo(x,y-s);g.lineTo(x+s*1.1,y);g.lineTo(x,y+s);g.fill();}
function triL(g,x,y,s,col){g.fillStyle=col;g.beginPath();g.moveTo(x,y-s);g.lineTo(x-s*1.1,y);g.lineTo(x,y+s);g.fill();}
function star(g,cx,cy,r,col,fill){g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.42:r;g.lineTo(cx+rr*Math.cos(a),cy+rr*Math.sin(a));}g.closePath();
  if(fill){g.fillStyle=col;g.fill();}else{g.strokeStyle=col;g.lineWidth=1.3;g.stroke();}}
function dot(g,cx,cy,r,col){g.fillStyle=col;g.beginPath();g.arc(cx,cy,r,0,7);g.fill();}
function check(g,x,y,s,col,on){g.strokeStyle=col;g.lineWidth=1.4;g.strokeRect(x+.5,y+.5,s,s);if(on){g.beginPath();g.moveTo(x+s*.2,y+s*.5);g.lineTo(x+s*.43,y+s*.75);g.lineTo(x+s*.85,y+s*.2);g.lineWidth=2.2;g.stroke();}}
function funnel(g,x,y,s,col){g.fillStyle=col;g.beginPath();g.moveTo(x,y);g.lineTo(x+s,y);g.lineTo(x+s*.6,y+s*.5);g.lineTo(x+s*.6,y+s*.95);g.lineTo(x+s*.4,y+s*.8);g.lineTo(x+s*.4,y+s*.5);g.closePath();g.fill();}
function personIcon(g,x,y,col){g.fillStyle=col;g.beginPath();g.arc(x+7,y+5.5,3.8,0,7);g.fill();g.beginPath();g.moveTo(x+1.5,y+17);g.quadraticCurveTo(x+1,y+10,x+7,y+10);g.quadraticCurveTo(x+13,y+10,x+12.5,y+17);g.closePath();g.fill();}
function catIcon(g,kind,x,y,col){
  g.save();g.translate(x,y);g.scale(1.15,1.15);x=0;y=0;g.strokeStyle=col;g.fillStyle=col;g.lineWidth=1.6;
  switch(kind){
    case 'artist':case 'orig':case 'remixer':personIcon(g,x,y,col);break;
    case 'folder':g.beginPath();g.moveTo(x,y+3);g.lineTo(x+6,y+3);g.lineTo(x+8,y+5);g.lineTo(x+17,y+5);g.lineTo(x+17,y+17);g.lineTo(x,y+17);g.closePath();g.fill();break;
    case 'folderOpen':g.lineWidth=1.3;g.beginPath();g.moveTo(x,y+17);g.lineTo(x,y+3);g.lineTo(x+6,y+3);g.lineTo(x+8,y+5);g.lineTo(x+15,y+5);g.lineTo(x+15,y+8);g.stroke();g.beginPath();g.moveTo(x+3.5,y+8);g.lineTo(x+19,y+8);g.lineTo(x+15,y+17);g.lineTo(x,y+17);g.closePath();g.fill();break;
    case 'playlist':{g.fillRect(x+1,y+2,14,16);const bg=col==='#000'?'#fff':'#000';g.fillStyle=bg;for(let i=0;i<4;i++)g.fillRect(x+3,y+4.5+i*3.2,10,1.4);break;}
    case 'track':noteIcon(g,x,y,17,col);break;
    case 'album':g.beginPath();g.arc(x+8,y+10,7.5,0,7);g.fill();g.fillStyle=col==='#000'?'#dedfe7':'#000';g.beginPath();g.arc(x+8,y+10,2,0,7);g.fill();break;
    case 'search':g.beginPath();g.arc(x+6,y+7,5,0,7);g.stroke();g.lineWidth=2.4;g.beginPath();g.moveTo(x+9.6,y+10.6);g.lineTo(x+14.5,y+15.5);g.stroke();break;
    case 'key':keyGlyph(g,x,y+2,15,col,col==='#000'?'#dedfe7':'#000');break;
    case 'bpm':g.fillRect(x,y+3,17,13);T(g,'BPM',x+8.5,y+13,7,col==='#000'?'#dedfe7':'#000',LA,700,'center');break;
    case 'rating':star(g,x+8,y+10,7.5,col,true);break;
    case 'color':g.beginPath();g.arc(x+8,y+10,7,0,7);g.fill();break;
    case 'time':g.beginPath();g.arc(x+8,y+10,8,0,7);g.fill();g.strokeStyle=col==='#000'?'#fff':'#000';g.lineWidth=1.8;g.beginPath();g.moveTo(x+8,y+5);g.lineTo(x+8,y+10);g.lineTo(x+12.5,y+10);g.stroke();break;
    case 'history':g.beginPath();g.arc(x+8,y+10,7,-2.6,3.2);g.stroke();g.beginPath();g.moveTo(x+8,y+6);g.lineTo(x+8,y+10);g.lineTo(x+11,y+11);g.stroke();triL(g,x+3.5,y+5.5,2.6,col);break;
    case 'comment':g.beginPath();g.moveTo(x+1,y+3);g.lineTo(x+16,y+3);g.lineTo(x+16,y+13);g.lineTo(x+8,y+13);g.lineTo(x+4,y+17);g.lineTo(x+4,y+13);g.lineTo(x+1,y+13);g.closePath();g.fill();g.fillStyle=col==='#000'?'#fff':'#000';for(let i=0;i<3;i++)g.fillRect(x+4.5+i*3.5,y+7.4,2,2);break;
    case 'genre':case 'label':g.beginPath();g.moveTo(x+1,y+3);g.lineTo(x+10,y+3);g.lineTo(x+16,y+10);g.lineTo(x+10,y+17);g.lineTo(x+1,y+17);g.closePath();g.fill();g.fillStyle=col==='#000'?'#fff':'#000';g.beginPath();g.arc(x+5,y+7,1.6,0,7);g.fill();break;
    case 'usb':usbIcon(g,x-2,y,col);break;
    case 'date':g.fillRect(x+1,y+2,16,16);g.fillStyle=col==='#000'?'#fff':'#000';g.beginPath();g.moveTo(x+17,y+2);g.lineTo(x+17,y+9);g.lineTo(x+10,y+2);g.fill();g.fillRect(x+3,y+12,6,1.4);break;
    case 'year':case 'dj':case 'bitrate':g.strokeRect(x+1.5,y+4.5,14,12);break;
    case 'matching':g.beginPath();g.arc(x+6,y+10,5,0,7);g.stroke();g.beginPath();g.arc(x+11,y+10,5,0,7);g.stroke();break;
    default:g.beginPath();g.moveTo(x,y+4);g.lineTo(x+9,y+4);g.lineTo(x+15,y+10);g.lineTo(x+9,y+16);g.lineTo(x,y+16);g.closePath();g.fill();
  }
  g.restore();
}
const CAMELOT={'Abm':'1A','G#m':'1A','B':'1B','Ebm':'2A','D#m':'2A','F#':'2B','Gb':'2B','Bbm':'3A','A#m':'3A','Db':'3B','C#':'3B','Fm':'4A','Ab':'4B','G#':'4B','Cm':'5A','Eb':'5B','D#':'5B','Gm':'6A','Bb':'6B','A#':'6B','Dm':'7A','F':'7B','Am':'8A','C':'8B','Em':'9A','G':'9B','Bm':'10A','D':'10B','F#m':'11A','Gbm':'11A','A':'11B','C#m':'12A','Dbm':'12A','E':'12B'};
function keyTxt(k){if(!k)return '';if(SET.keyFmt===1){const c=CAMELOT[k];return c?c.padStart(3,'0'):k;}return k;}
function fmtMs(s){s=Math.max(0,s);const m=Math.floor(s/60),r=s-m*60;return [String(m).padStart(2,'0'),String(Math.floor(r)).padStart(2,'0'),String(Math.floor((r%1)*1000)).padStart(3,'0')];}
/* big light digits (time, tempo, bpm) with a smaller tail */
function digits(g,a,b,x,y,s1,s2,col,al,sp){g.font='300 '+s1+'px '+LN;const w1=g.measureText(a).width+(sp||0)*a.length;g.font='300 '+s2+'px '+LN;const w2=g.measureText(b).width;
  let x0=al==='right'?x-w1-w2:(al==='center'?x-(w1+w2)/2:x);g.fillStyle=col;g.textAlign='left';g.font='300 '+s1+'px '+LN;
  if(sp){for(const ch of a){g.fillText(ch,x0,y);x0+=g.measureText(ch).width+sp;}}else{g.fillText(a,x0,y);x0+=w1;}
  g.font='300 '+s2+'px '+LN;g.fillText(b,x0,y);return w1+w2;}
