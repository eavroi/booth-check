/* ---------------- deck face drawing ----------------
   Canvas drawing of the face. Painter and the first key styles come from the "Pioneer CDJ & XDJ Emulator" (app/art.py, GPL-2.0-or-later); the body, jog, selector and keys were redrawn after the real CDJ-2000NXS2. */
const PRINT=[225,228,232],PRINT_DIM=[150,154,160],GUN_TOP=[50,51,54],GUN_BOT=[30,31,33],GLOSS=[9,9,10];
const FACE_FONT='Arimo,Arial,"Helvetica Neue",Helvetica,"Liberation Sans",sans-serif';
const TRACKING=.05,COND_SX=.9;
const css=(c,a)=>c.length===4||a!=null?'rgba('+c[0]+','+c[1]+','+c[2]+','+(a!=null?a:c[3]/255)+')':'rgb('+c[0]+','+c[1]+','+c[2]+')';
const mix=(a,b,t)=>a.map((x,i)=>Math.round(x+(b[i]-x)*t));
const dimC=(c,t)=>mix([12,12,13],c,t==null?.28:t);
const conicCache=new Map();
class Painter{
  constructor(box,scale){
    this.scale=scale;this.box=box;
    this.px=[Math.round(box[0]*scale),Math.round(box[1]*scale)];
    this.w=Math.max(1,Math.round(box[2]*scale)-this.px[0]);this.h=Math.max(1,Math.round(box[3]*scale)-this.px[1]);
    this.cv=document.createElement('canvas');this.cv.width=this.w;this.cv.height=this.h;
    this.g=this.cv.getContext('2d');this.reset();
  }
  reset(){this.g.setTransform(this.scale,0,0,this.scale,-this.px[0],-this.px[1]);}
  path(fn){const g=this.g;g.beginPath();fn(g);}
  rr(box,r){const [x0,y0,x1,y1]=box;const g=this.g;r=Math.max(0,Math.min(r,(x1-x0)/2,(y1-y0)/2));g.beginPath();g.moveTo(x0+r,y0);g.arcTo(x1,y0,x1,y1,r);g.arcTo(x1,y1,x0,y1,r);g.arcTo(x0,y1,x0,y0,r);g.arcTo(x0,y0,x1,y0,r);g.closePath();}
  rrect(box,r,fill,outline,width){const g=this.g;
    if(fill){this.rr(box,r);g.fillStyle=css(fill);g.fill();}
    if(outline){const w=Math.max(1/this.scale,width||1)/1,h=w/2;this.rr([box[0]+h,box[1]+h,box[2]-h,box[3]-h],Math.max(0,r-h));g.strokeStyle=css(outline);g.lineWidth=w;g.stroke();}}
  circle(cx,cy,r,fill,outline,width){const g=this.g;
    if(fill){g.beginPath();g.arc(cx,cy,Math.max(0,r),0,Math.PI*2);g.fillStyle=css(fill);g.fill();}
    if(outline){const w=width||1;g.beginPath();g.arc(cx,cy,Math.max(0,r-w/2),0,Math.PI*2);g.strokeStyle=css(outline);g.lineWidth=w;g.stroke();}}
  line(pts,color,width){const g=this.g;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))g.lineTo(p[0],p[1]);g.strokeStyle=css(color);g.lineWidth=Math.max(1/this.scale,width||1);g.lineCap='butt';g.lineJoin='miter';g.stroke();}
  arc(cx,cy,r,a0,a1,color,width){const g=this.g;g.beginPath();g.arc(cx,cy,r-(width||1)/2,a0*Math.PI/180,a1*Math.PI/180);g.strokeStyle=css(color);g.lineWidth=width||1;g.stroke();}
  polygon(pts,fill){const g=this.g;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))g.lineTo(p[0],p[1]);g.closePath();g.fillStyle=css(fill);g.fill();}
  shape(box,radius,ellipse){if(ellipse){const g=this.g;g.beginPath();g.ellipse((box[0]+box[2])/2,(box[1]+box[3])/2,(box[2]-box[0])/2,(box[3]-box[1])/2,0,0,Math.PI*2);}else this.rr(box,radius||0);}
  gradient(box,top,bottom,radius,ellipse){const g=this.g;const lg=g.createLinearGradient(0,box[1],0,box[3]);lg.addColorStop(0,css(top));lg.addColorStop(1,css(bottom));this.shape(box,radius,ellipse);g.fillStyle=lg;g.fill();}
  /* a surface under the face's light, optionally brushed top to bottom */
  lit(box,base,peak,light,radius,brushed){
    const [lx,ly,rx,ry]=light,[x0,y0,x1,y1]=box,s=this.scale;
    const W=Math.max(1,Math.round((x1-x0)*s)),H=Math.max(1,Math.round((y1-y0)*s));
    const sw=Math.max(2,Math.round(W/8)),sh=Math.max(2,Math.round(H/8));
    const m=document.createElement('canvas');m.width=sw;m.height=sh;const mg=m.getContext('2d');const md=mg.createImageData(sw,sh);
    for(let j=0;j<sh;j++)for(let i=0;i<sw;i++){const ux=x0+(i+.5)/sw*(x1-x0),uy=y0+(j+.5)/sh*(y1-y0);const t=Math.exp(-Math.hypot((ux-lx)/rx,(uy-ly)/ry));const o=(j*sw+i)*4;
      for(let c=0;c<3;c++)md.data[o+c]=Math.min(255,base[c]+peak*t);md.data[o+3]=255;}
    mg.putImageData(md,0,0);
    const big=document.createElement('canvas');big.width=W;big.height=H;const bg=big.getContext('2d');bg.imageSmoothingEnabled=true;bg.imageSmoothingQuality='high';bg.drawImage(m,0,0,W,H);
    if(brushed){const id=bg.getImageData(0,0,W,H),d=id.data;let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
      const f=new Float32Array(W);for(let i=0;i<W;i++){const st=90+Math.floor(rnd()*166);f[i]=.5+(1+st/255)/3.2;}
      for(let j=0;j<H;j++)for(let i=0;i<W;i++){const o=(j*W+i)*4;const k=f[i];d[o]=Math.min(255,d[o]*k);d[o+1]=Math.min(255,d[o+1]*k);d[o+2]=Math.min(255,d[o+2]*k);}
      bg.putImageData(id,0,0);}
    const g=this.g;g.save();this.shape(box,radius);g.clip();g.drawImage(big,x0,y0,x1-x0,y1-y0);g.restore();
  }
  conic(lobes,spin,tint){
    const k=lobes+'|'+spin+'|'+tint.join(',');if(conicCache.has(k))return conicCache.get(k);
    const stops=[];for(let a=0;a<=360;a+=4){const v=.5+.5*Math.cos(lobes*(a-35-spin)*Math.PI/180);const gv=70+170*v;stops.push([a/360,tint.map(t=>Math.max(0,Math.min(255,Math.round(gv+t))))]);}
    conicCache.set(k,stops);return stops;
  }
  chrome(cx,cy,r,tint,lobes,spin){
    const g=this.g;const cg=g.createConicGradient(0,cx,cy);for(const [o,c] of this.conic(lobes||2,spin||0,tint||[0,0,0]))cg.addColorStop(o,css(c));
    g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.fillStyle=cg;g.fill();
  }
  dome(cx,cy,r,base){
    base=base||[14,14,15];this.gradient([cx-r,cy-r,cx+r,cy+r],mix(base,[80,82,88],.5),base,0,true);
    const g=this.g;g.save();g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.clip();
    this.glowRaw((q)=>{q.beginPath();q.arc(cx-r*.18,cy-r*.42,r*.42,0,Math.PI*2);q.fill();},[255,255,255],r*.25,.35,'source-over');
    g.restore();
  }
  /* soft light: shape blurred, under what is drawn (default) or over it */
  glowRaw(draw,color,blur,strength,op){
    const g=this.g;const c=document.createElement('canvas');c.width=this.w;c.height=this.h;const q=c.getContext('2d');
    q.setTransform(this.scale,0,0,this.scale,-this.px[0],-this.px[1]);q.fillStyle=css(color,strength);q.strokeStyle=css(color,strength);draw(q,this);
    g.save();g.setTransform(1,0,0,1,0,0);g.filter='blur('+Math.max(.5,blur*this.scale*.9)+'px)';g.globalCompositeOperation=op;g.drawImage(c,0,0);g.restore();
  }
  glow(draw,color,blur,strength,over){this.glowRaw(draw,color,blur,strength==null?1:strength,over?'source-atop':'destination-over');}
  text(x,y,text,px,fill,anchor,bold){
    if(!text)return;anchor=anchor||'mm';const g=this.g;const lines=String(text).split('\n'),lead=px*1.12;
    g.font=bold==='cond'?'400 '+px+'px "Fira Sans Condensed",'+FACE_FONT:(bold?'700 ':'400 ')+px+'px '+FACE_FONT;g.fillStyle=css(fill);g.textBaseline='middle';g.textAlign='left';
    const top=y-({t:0,a:0,m:lead*(lines.length-1)/2,s:lead*(lines.length-1),b:lead*(lines.length-1),d:lead*(lines.length-1)}[anchor[1]]);
    /* condensed print (TRACK FILTER / SHORT CUT): a narrow face, a little squeezed like the real one */
    const sx=bold==='cond'?COND_SX:1;if(sx!==1){g.save();g.translate(x,0);g.scale(sx,1);g.translate(-x,0);}
    lines.forEach((ln,i)=>{const w=textW(g,ln,px);let x0=x-({l:0,m:w/2,r:w}[anchor[0]]);const cy=top+i*lead;
      for(const ch of ln){g.fillText(ch,x0,cy);x0+=g.measureText(ch).width+TRACKING*px;}});
    if(sx!==1)g.restore();
  }
}
function textW(g,t,px){let w=0;for(const ch of t)w+=g.measureText(ch).width;return w+TRACKING*px*Math.max(0,t.length-1);}
/* rounded rectangle with one radius per corner: [top-left, top-right, bottom-right, bottom-left] */
function rrc(g,b,r){const [x0,y0,x1,y1]=b;g.beginPath();g.moveTo(x0+r[0],y0);g.lineTo(x1-r[1],y0);g.arcTo(x1,y0,x1,y0+r[1],r[1]);g.lineTo(x1,y1-r[2]);g.arcTo(x1,y1,x1-r[2],y1,r[2]);
  g.lineTo(x0+r[3],y1);g.arcTo(x0,y1,x0,y1-r[3],r[3]);g.lineTo(x0,y0+r[0]);g.arcTo(x0,y0,x0+r[0],y0,r[0]);g.closePath();}
/* ---------- the static body (after the real CDJ-2000NXS2) ---------- */
function drawBody(P,deckLabel){
  const g=P.g;g.save();silPath(g);g.clip();
  chassis(P);displayPanel(P);leftColumn(P);rightColumn(P);jogSurround(P);sliderFrame(P);base(P);liserets(P);
  for(const [x,y,t] of F_PILLS)pill(P,x,y,t);
  for(const [names,m] of F_RECESSES)recess(P,recessBox(names,m));
  for(const [x,y,t] of F_FRAMES)frameWord(P,x,y,t);
  for(const pts of F_LINES)P.line(pts,PRINT,1.1);
  for(const t of F_TEXTS)P.text(t.x,t.y,t.text,t.size,PRINT,t.anchor,t.bold);
  for(const [st,kx,ky,kr] of F_KNOBS)knobScale(P,st,kx,ky,kr);
  P.rrect([LC-36,575,LC-32,579],0,PRINT);P.rrect([700.4,289.2,702.6,291.4],0,PRINT);
  if(deckLabel)P.text(462,1120,deckLabel,15,[120,122,128],'mm',true);
  g.restore();
}
function chassis(P){
  const g=P.g;
  P.rrect([0,0,FW,FH],0,[5,5,6]);
  /* side columns (the right one follows the bulge beside the selector) */
  g.save();rrc(g,[0,COL_TOP,128,BASE_Y],[9,0,0,0]);g.clip();P.lit([0,COL_TOP,128,BASE_Y],[33,33,35],22,[0,40,260,700],0);g.restore();
  g.save();rrc(g,[796,COL_TOP,FW,BASE_Y],[0,9,0,0]);g.clip();P.lit([796,COL_TOP,FW,BASE_Y],[33,33,35],18,[FW,40,260,800],0);g.restore();
  /* brushed centre plate */
  P.lit([129,398,796,BASE_Y],[10,10,11],44,F_LIGHT,0,true);
}
/* grey edge lines (liserets) where the parts of the case meet */
function liserets(P){
  /* the edge lines run inside the outline (x 128.5 and 795.5) so the deck clip never shaves them, full height from the top bar down */
  const g=P.g,c=css([78,78,83]);g.lineWidth=1.1;g.strokeStyle=c;g.lineJoin='miter';
  g.beginPath();g.moveTo(1,BASE_Y);g.lineTo(1,COL_TOP+9);g.arcTo(1,COL_TOP+1,9,COL_TOP+1,8);g.lineTo(128.5,COL_TOP+1);g.stroke();
  g.beginPath();g.moveTo(795.5,COL_TOP+1);g.lineTo(FW-9,COL_TOP+1);g.arcTo(FW-1,COL_TOP+1,FW-1,COL_TOP+9,8);g.lineTo(FW-1,BASE_Y);g.stroke();
  g.beginPath();g.moveTo(128.5,8);g.lineTo(128.5,BASE_Y);g.stroke();
  /* right boundary: straight, except the small angular step beside the selector */
  g.beginPath();g.moveTo(795.5,8);bulgePath(g);g.lineTo(795.5,BASE_Y);g.stroke();
}
/* the base band along the bottom, with the raised lip in the middle */
function base(P){
  /* bottom of the deck, measured on the photo of the real deck: the two sides are the upper part of the case, the centre
     between the slopes is a lower part seen from above with nothing under it; very thin neutral grey edge lines */
  const g=P.g,x0=LIP_X0,x1=LIP_X1,b=BASE_B,sx=(y,d)=>slopeX(d>0?x0:x1,y,d);
  /* the top outline of the centre piece: up the slope, a round shoulder, then flat (offset o below the top edge) */
  const top=(o,d,first)=>{const y=LIP_Y+o,ya=1174+o*.9,cx=sx(y,d),e=cx+d*(10-o*.6);
    if(d>0){if(first)g.moveTo(sx(ya,1),ya);else g.lineTo(sx(ya,1),ya);g.quadraticCurveTo(cx,y,e,y);}
    else{const y2=y,cx2=sx(y2,-1),e2=cx2-(10-o*.6);g.lineTo(e2,y2);g.quadraticCurveTo(cx2,y2,sx(ya,-1),ya);}};
  /* sides: lit from the right, the left one fades from its outer edge toward the slope */
  let lg=g.createLinearGradient(0,0,x0,0);lg.addColorStop(0,css([58,58,58]));lg.addColorStop(1,css([46,46,46]));g.fillStyle=lg;
  g.beginPath();g.moveTo(0,BASE_Y);g.lineTo(sx(BASE_Y,1),BASE_Y);g.lineTo(x0,b);g.lineTo(0,b);g.closePath();g.fill();
  lg=g.createLinearGradient(x1,0,FW,0);lg.addColorStop(0,css([54,54,54]));lg.addColorStop(.85,css([72,72,72]));lg.addColorStop(1,css([84,84,84]));g.fillStyle=lg;
  g.beginPath();g.moveTo(FW,BASE_Y);g.lineTo(sx(BASE_Y,-1),BASE_Y);g.lineTo(x1,b);g.lineTo(FW,b);g.closePath();g.fill();
  /* their top edge: a dark seam under the plate */
  g.fillStyle=css([21,21,21]);g.fillRect(0,BASE_Y-.4,sx(BASE_Y,1)-.5,.9);g.fillRect(sx(BASE_Y,-1)+.5,BASE_Y-.4,FW-sx(BASE_Y,-1),.9);
  /* centre piece: dark, a little lighter toward the right; a black gap separates it from the plate */
  g.beginPath();g.moveTo(sx(LIP_B,1),LIP_B);top(0,1,false);top(0,-1,false);g.lineTo(sx(LIP_B,-1),LIP_B);g.closePath();
  lg=g.createLinearGradient(x0,0,x1,0);lg.addColorStop(0,css([22,22,22]));lg.addColorStop(.4,css([26,26,26]));lg.addColorStop(.92,css([39,39,39]));lg.addColorStop(1,css([31,31,31]));
  g.fillStyle=lg;g.fill();
  g.lineCap='round';g.lineJoin='round';
  const st=(c,w)=>{g.strokeStyle=css(c);g.lineWidth=w;g.stroke();};
  g.beginPath();top(-.9,1,true);top(-.9,-1,false);st([0,0,0],.9);
  g.beginPath();top(.25,1,true);top(.25,-1,false);st([58,58,58],.45);
  g.beginPath();top(2.3,1,true);top(2.3,-1,false);st([86,86,86],.7);
  /* slopes: from the bottom corner up into the shoulder (the left one catches more light) */
  g.beginPath();g.moveTo(x0,b-.35);g.lineTo(sx(1174+2.3*.9,1),1174+2.3*.9);st([162,162,162],.6);
  g.beginPath();g.moveTo(x1,b-.35);g.lineTo(sx(1182,-1),1182);st([138,138,138],.6);
  g.beginPath();g.moveTo(sx(1182,-1),1182);g.lineTo(sx(1174+2.3*.9,-1),1174+2.3*.9);st([82,82,82],.5);
  /* bottom edges: the sides with their rounded outer corners, and the centre piece */
  const rb=9;
  g.beginPath();g.moveTo(1,BASE_Y+1);g.lineTo(1,b-rb);g.arcTo(1,b-.35,1+rb,b-.35,rb-1);g.lineTo(x0,b-.35);st([165,165,165],.6);
  g.beginPath();g.moveTo(FW-1,BASE_Y+1);g.lineTo(FW-1,b-rb);g.arcTo(FW-1,b-.35,FW-1-rb,b-.35,rb-1);g.lineTo(x1,b-.35);st([165,165,165],.6);
  g.beginPath();g.moveTo(sx(LIP_B,1),LIP_B-.35);g.lineTo(sx(LIP_B,-1),LIP_B-.35);st([150,150,150],.6);
  g.lineCap='butt';
}
function displayPanel(P){
  const [x0,y0,x1,y1]=F_TOP_BLOCK,g=P.g;
  P.rrect([x0,y0,x1,y1+2],0,[7,7,8]);
  /* glossy top bar */
  g.save();rrc(g,[x0,0,x1,26],[8,8,0,0]);g.clip();
  let lg=g.createLinearGradient(0,0,0,26);lg.addColorStop(0,css([70,70,74]));lg.addColorStop(.08,css([40,40,43]));lg.addColorStop(.6,css([16,16,17]));lg.addColorStop(1,css([8,8,9]));g.fillStyle=lg;g.fillRect(x0,0,x1-x0,26);
  g.restore();
  g.beginPath();g.moveTo(x0+.5,26);g.lineTo(x0+.5,8);g.arcTo(x0+.5,.5,x0+8,.5,7.5);g.lineTo(x1-8,.5);g.arcTo(x1-.5,.5,x1-.5,8,7.5);g.lineTo(x1-.5,26);g.strokeStyle=css([110,110,116]);g.lineWidth=1;g.stroke();
  P.line([[x0,26.5],[x1,26.5]],[86,86,90],1);
  P.gradient([x0+1,27,x1-1,y1],[14,14,15],[8,8,9],0);
  P.gradient([x0,y1-3,x1,y1+4],[150,150,156],[36,36,38]);
  /* screen bezel: thin glossy frame, the inner faces seen in perspective (bottom face lighter), square-ish corners */
  const b=F_BEZEL,[lx0,ly0,lx1,ly1]=F_LCD;
  P.rrect(b,3,[12,12,13],[64,64,68],1.2);
  P.polygon([[b[0]+2,b[1]+2],[b[2]-2,b[1]+2],[lx1+3,ly0-3],[lx0-3,ly0-3]],[18,18,20]);
  P.polygon([[b[0]+2,b[1]+2],[lx0-3,ly0-3],[lx0-3,ly1+3],[b[0]+2,b[3]-2]],[30,30,32]);
  P.polygon([[b[2]-2,b[1]+2],[b[2]-2,b[3]-2],[lx1+3,ly1+3],[lx1+3,ly0-3]],[24,24,26]);
  g.beginPath();g.moveTo(b[0]+2,b[3]-2);g.lineTo(lx0-3,ly1+3);g.lineTo(lx1+3,ly1+3);g.lineTo(b[2]-2,b[3]-2);g.closePath();
  lg=g.createLinearGradient(0,ly1+3,0,b[3]);lg.addColorStop(0,css([84,84,88]));lg.addColorStop(1,css([44,44,47]));g.fillStyle=lg;g.fill();
  P.line([[lx0-3,ly1+3.5],[lx1+3,ly1+3.5]],[140,140,146],.8);
  P.rrect([lx0-3,ly0-3,lx1+3,ly1+3],0,[0,0,0]);
  /* the selector housing */
  const [sx0,sy0,sx1,sy1]=F_SELECT_PANEL;P.rrect([sx0,sy0,sx1,sy1],0,[3,3,4]);P.line([[sx1,sy0+.5],[sx0+.5,sy0+.5],[sx0+.5,sy1-.5],[sx1,sy1-.5]],[72,72,76],1.1);
  /* the small step beside the selector belongs to the housing: same black */
  g.beginPath();g.moveTo(794,128);bulgePath(g);g.lineTo(794,252);g.closePath();g.fillStyle=css([3,3,4]);g.fill();
  P.line([[718,70],[731,70],[731,77],[720,77]],PRINT,1.2);P.polygon([[716,77],[721,73.5],[721,80.5]],PRINT);
}
function leftColumn(P){
  const g=P.g;
  /* USB port and its sliding cover */
  P.rrect(F_USB_PORT,4,[6,6,7]);P.gradient([18,73,69,120],[84,86,90],[44,46,50],3);
  P.rrect([21,76,66,96],2,[10,10,11]);P.circle(43,118,9,[22,22,24]);P.rrect([18,117,69,121],0,[44,46,50]);
  P.rrect([89,63,101,72],1,null,PRINT,1);P.line([[86,75],[104,75]],PRINT,1.1);P.line([[90,92],[100,92]],PRINT,2);
  P.line([[32,146],[53,146]],PRINT,1.2);P.circle(31,146,2,PRINT);P.polygon([[53,143],[57,146],[53,149]],PRINT);P.line([[39,146],[42,141],[46,141]],PRINT,1);P.line([[44,146],[47,150],[50,150]],PRINT,1);
  /* SD card slot: grey surround, hinged dark cover, lit strip under it */
  const [a,b,c,d]=F_SD_SLOT;
  P.rrect([a-1,b-1,c+1,d+1],5,[60,60,64]);P.rrect([a,b,c,d],4,[22,22,24]);
  P.gradient([a+3,b+3,c-3,d-12],[64,64,68],[40,40,43],2);P.line([[a+4,b+3.6],[c-4,b+3.6]],[150,150,156],1);
  P.line([[a+3,d-11.5],[c-3,d-11.5]],[12,12,13],1.4);
  P.rrect([a+3,d-10,c-3,d-3],2,[30,30,32]);
  P.glow(q=>{q.fillRect(a+18,d-8,c-a-36,4);},[190,235,245],2.5,.7);P.rrect([a+18,d-8,c-18,d-4],1,[208,236,242]);
    g.beginPath();g.moveTo(LC-12,245);g.lineTo(LC-5,245);g.lineTo(LC-2,248);g.lineTo(LC-2,259);g.lineTo(LC-12,259);g.closePath();g.strokeStyle=css(PRINT);g.lineWidth=1.1;g.stroke();
  P.polygon([[LC-7,249],[LC-9.5,253],[LC-4.5,253]],PRINT);
}
function rightColumn(P){
  P.circle(RC,95,2.2,[58,18,16]);   /* STANDBY: lit only in standby (manual p. 14), never here */
  P.arc(RC-20,64,7,300,240+360,PRINT,1.4);P.line([[RC-20,55],[RC-20,64]],PRINT,1.4);P.line([[RC-11,68],[RC-3,68],[RC-3,58]],PRINT,1.4);
  P.rrect([RC-56,479,RC+52,530],5,[12,12,13],[76,76,80],1);
}
function jogSurround(P){
  const [cx,cy,r]=F_JOG;
  P.circle(cx,cy,r+6,[6,6,7]);
  for(const [a0,a1,head] of [[126,141,126],[39,54,54]]){
    const R=r+18;P.arc(cx,cy,R+.6,a0,a1,PRINT,1.2);
    const a=head*Math.PI/180,tip=[cx+R*Math.cos(a),cy+R*Math.sin(a)];const back=(head+(head>90?6:-6))*Math.PI/180;
    P.polygon([tip,...[-3.5,3.5].map(o=>[cx+(R+o)*Math.cos(back),cy+(R+o)*Math.sin(back)])],PRINT);
  }
}
function sliderFrame(P){
  const [x0,y0,x1,y1]=F_SLIDER_FRAME;
  P.rrect([x0-2,y0-2,x1+2,y1+2],7,[4,4,5]);P.rrect([x0,y0,x1,y1],6,[22,22,24],[66,66,70],1);P.gradient([x0+4,y0+5,x1-4,y1-26],[28,28,30],[20,20,21],4);
  /* 50 graduations as on the real deck, a longer one every 5; the – and + sit on the first and last one */
  const n=50,step=(F_SLIDER[2]-F_SLIDER[1])/n;for(let i=0;i<=n;i++){const y=F_SLIDER[1]+i*step,big=i%5===0;
    const e=big?4.5:7;P.line([[x0+e,y],[RC-6,y]],big?[214,214,220]:[150,150,156],big?1.1:.7);P.line([[RC+6,y],[x1-e,y]],big?[214,214,220]:[150,150,156],big?1.1:.7);}
  /* the slot is centred on 0, as on the real deck (797 to 1102) */
  P.rrect([RC-3,797,RC+3,1102],3,[0,0,0]);
  for(let i=2;i<=n-2;i++){const y=F_SLIDER[1]+i*step;if(Math.abs(y-SL_ZERO)<7)continue;P.circle(820,y,.9,PRINT_DIM);}
}
function pill(P,x,y,t){P.g.font='700 6.6px '+FACE_FONT;const tw=textW(P.g,t,6.6);P.rrect([x-tw/2-3.5,y-5,x+tw/2+3.5,y+5],2.5,[196,198,202]);P.text(x,y+.3,t,6.6,[20,20,22],'mm',true);}
/* VINYL / CDJ: only the selected one is lit, black text */
function badge(P,x,y,t,col,lit){const off=t==='REV'?[96,18,16]:[36,38,42];P.rrect([x-20,y-8,x+20,y+8],2,lit?col:off,lit?mix(col,[255,255,255],.35):mix(off,[255,255,255],.12),1);
  if(lit)P.glow(q=>{q.fillRect(x-20,y-8,40,16);},col,3,.55);P.text(x,y,t,8.5,lit?[0,0,0]:(t==='REV'?[150,70,70]:[92,94,100]),'mm',true);}
function recess(P,box){const [x0,y0,x1,y1]=box,r=(y1-y0)/2;P.rrect([x0,y0+.5,x1,y1+1],r,[58,59,62]);P.rrect(box,r,[14,14,15]);P.gradient([x0+.8,y0+1.2,x1-.8,y1-.4],[30,30,32],[44,44,47],r-1);}
function frameWord(P,x,y,t){P.g.font='700 7.5px '+FACE_FONT;const tw=textW(P.g,t,7.5);P.rrect([x-tw/2-4,y-6,x+tw/2+4,y+6],2,null,PRINT,1);P.text(x,y,t,7.5,PRINT,'mm',true);}
/* knobs: the printed scale is part of the body; the cap is drawn at its value (0..1), 0 = seven-thirty, 1 = four-thirty */
const KA=v=>(135+v*270)*Math.PI/180;
function knobScale(P,style,cx,cy,r){
  if(style==='vinyl'){for(let i=0;i<11;i++){const a=KA(i/10);P.line([[cx+(r+3)*Math.cos(a),cy+(r+3)*Math.sin(a)],[cx+(r+8)*Math.cos(a),cy+(r+8)*Math.sin(a)]],PRINT,1.2);}}
  else{for(let i=0;i<11;i++){const a=KA(i/10),big=i===5;P.circle(cx+(r+7)*Math.cos(a),cy+(r+7)*Math.sin(a),big?1.6:1,big?PRINT:PRINT_DIM);}
    for(const v of [0,1]){const a=KA(v);P.line([[cx+(r+10)*Math.cos(a),cy+(r+10)*Math.sin(a)],[cx+(r+17)*Math.cos(a),cy+(r+17)*Math.sin(a)]],PRINT,1.2);}}
}
function knobCap(P,style,cx,cy,r,val){
  const a=KA(val);
  if(style==='jog_adjust'){P.circle(cx,cy,r+1,[4,4,5]);P.chrome(cx,cy,r,[-20,-20,-18],2,10);
    for(let i=0;i<36;i++){const t=i*10*Math.PI/180;P.line([[cx+(r-4)*Math.cos(t),cy+(r-4)*Math.sin(t)],[cx+r*Math.cos(t),cy+r*Math.sin(t)]],[40,40,44],.8);}
    for(let rr=4;rr<r-5;rr+=2.2)P.circle(cx,cy,rr,null,[255,255,255,26],.6);
    P.line([[cx+3*Math.cos(a),cy+3*Math.sin(a)],[cx+(r-3)*Math.cos(a),cy+(r-3)*Math.sin(a)]],[250,250,252],2.4);return;}
  P.circle(cx,cy,r+1,[3,3,4]);
  for(let i=0;i<30;i++){const t=i*12*Math.PI/180,t2=t+5*Math.PI/180;P.polygon([[cx+(r-3)*Math.cos(t),cy+(r-3)*Math.sin(t)],[cx+r*Math.cos(t),cy+r*Math.sin(t)],[cx+r*Math.cos(t2),cy+r*Math.sin(t2)],[cx+(r-3)*Math.cos(t2),cy+(r-3)*Math.sin(t2)]],[44,44,48]);}
  P.dome(cx,cy,r-3,[16,16,18]);
  P.line([[cx+2*Math.cos(a),cy+2*Math.sin(a)],[cx+(r-2)*Math.cos(a),cy+(r-2)*Math.sin(a)]],[245,246,250],2.6);
}
/* ---------- keys ---------- */
const DARK_CHROME=[-44,-44,-42];
function ledOutline(P,box,radius,color,lit,width){width=width||1.6;
  if(lit)P.glow(q=>{const [x0,y0,x1,y1]=box;q.lineWidth=width*2;q.beginPath();q.roundRect?q.roundRect(x0,y0,x1-x0,y1-y0,radius):q.rect(x0,y0,x1-x0,y1-y0);q.stroke();},color,3,.9);
  P.rrect(box,radius,null,lit?color:dimC(color),width);}
function led(P,cx,cy,rd,color,lit){if(lit)P.glow(q=>{q.beginPath();q.arc(cx,cy,rd*1.5,0,Math.PI*2);q.fill();},color,rd,1);P.circle(cx,cy,rd,lit?mix(color,[255,255,255],.25):mix([10,10,11],color,.55));}
function symbol(P,name,cx,cy,s,col){
  const tri=(x,y,s,right)=>{const d=right?1:-1;P.polygon([[x-d*s*.5,y-s*.6],[x+d*s*.6,y],[x-d*s*.5,y+s*.6]],col);};
  if(name==='scan_fwd'||name==='scan_rev'){const r=name==='scan_fwd';tri(cx-s*.45,cy,s,r);tri(cx+s*.45,cy,s,r);}
  else if(name==='track_fwd'||name==='track_rev'){const r=name==='track_fwd',sg=r?1:-1;tri(cx-sg*s*.55,cy,s,r);tri(cx+sg*s*.25,cy,s,r);const bx=cx+sg*s*.95;P.rrect([bx-s*.12,cy-s*.6,bx+s*.12,cy+s*.6],0,col);}
  else if(name==='left'||name==='right')tri(cx,cy,s*1.3,name==='right');
  else if(name==='play'){tri(cx-s*1.1,cy,s*1.5,true);P.line([[cx-s*.2,cy+s*.8],[cx+s*.15,cy-s*.8]],col,1.2);for(const dx of [.45,1])P.rrect([cx+s*dx,cy-s*.8,cx+s*(dx+.32),cy+s*.8],0,col);}
  else if(name==='eject'){P.polygon([[cx-s,cy+s*.2],[cx,cy-s*.9],[cx+s,cy+s*.2]],col);P.rrect([cx-s,cy+s*.45,cx+s,cy+s*.75],0,col);}
}
/* a key shape cut by the selector collar */
function segPath(P,box){}
function segClip(P){}
function drawKey(P,key,lit,down,color){
  const c=color||key.color;
  switch(key.kind){
    case 'src':case 'top':{const [x0,y0,x1,y1]=key.box;P.rrect([x0-2,y0-2,x1+2,y1+2],4,[2,2,3]);P.gradient(key.box,down?[14,14,15]:[22,22,24],[6,6,7],3);ledOutline(P,key.box,3,c,lit,1.8);if(!lit&&!key.always)P.rrect(key.box,3,null,dimC(c,.42),1.8);
      const tc=key.always?[236,238,242]:(lit?mix(c,[255,255,255],.1):dimC(c,.42));P.text((x0+x1)/2,(y0+y1)/2+(down?1:0),key.label,key.font,tc,'mm',true);break;}
    case 'pad':{const [x0,y0,x1,y1]=key.box;P.rrect([x0-2,y0-2,x1+2,y1+3],5,[6,6,7]);P.gradient(key.box,down?[30,31,33]:[44,45,48],[26,27,29],4);ledOutline(P,[x0+6,y0+6,x1-6,y1-6],1,c,lit,1.8);break;}
    case 'rect':{const [x0,y0,x1,y1]=key.box;P.rrect([x0-1,y0-1,x1+1,y1+2],3,[0,0,0]);P.gradient(key.box,down?[30,31,33]:[58,59,62],[20,20,22],3);
      P.text((x0+x1)/2,(y0+y1)/2,key.label,key.font,[230,232,236],'mm',true);break;}
    case 'jm':{const [x0,y0,x1,y1]=key.box;P.rrect([x0-2,y0-2,x1+2,y1+2],4,[2,2,3]);P.gradient(key.box,down?[40,40,44]:[96,96,102],[26,26,28],3);P.rrect(key.box,3,null,[140,140,146],1);
      P.text((x0+x1)/2,(y0+y1)/2,key.label,key.font,[236,236,240],'mm',true);break;}
    case 'seg':{const g=P.g,[x0,y0,x1,y1]=key.box,top=key.q<2,[cx,cy]=F_SELECT;
      const outer=top?y0:y1,R=SEG_ARC,ccy=top?outer+R:outer-R;
      const path=(m)=>{const Rm=R-m,a0=Math.asin((x0+m-cx)/Rm),a1=Math.asin((x1-m-cx)/Rm);g.beginPath();
        if(top){g.moveTo(x0+m,y1);g.arc(cx,ccy,Rm,-Math.PI/2+a0,-Math.PI/2+a1);g.lineTo(x1-m,y1);}
        else{g.moveTo(x0+m,y0);g.lineTo(x1-m,y0);g.arc(cx,ccy,Rm,Math.PI/2-a1,Math.PI/2-a0);}g.closePath();};
      path(-1);g.fillStyle=css([2,2,3]);g.fill();
      /* outer face: lighter, its inner border an arc parallel to the outer edge; inner face: darker */
      g.save();path(0);g.clip();
      let lg=g.createLinearGradient(0,y0,0,y1);lg.addColorStop(0,css(down?[24,24,26]:[46,46,49]));lg.addColorStop(1,css(down?[14,14,15]:[26,26,28]));g.fillStyle=lg;g.fillRect(x0,y0,x1-x0,y1-y0);
      g.beginPath();g.arc(cx,ccy,R,0,Math.PI*2);g.arc(cx,ccy,R-24,0,Math.PI*2,true);
      lg=g.createLinearGradient(0,top?y0:y1-24,0,top?y0+24:y1);lg.addColorStop(0,css(down?[40,40,43]:(top?[92,92,97]:[54,54,58])));lg.addColorStop(1,css(down?[26,26,28]:(top?[56,56,60]:[78,78,82])));g.fillStyle=lg;g.fill('evenodd');
      g.beginPath();g.arc(cx,ccy,R-24,0,Math.PI*2);g.strokeStyle=css([10,10,11]);g.lineWidth=1.4;g.stroke();
      g.beginPath();g.arc(cx,ccy,R-25.2,0,Math.PI*2);g.strokeStyle=css([84,84,88,140]);g.lineWidth=.6;g.stroke();
      if(key.q===0){g.beginPath();g.arc(cx,ccy,R-6,-Math.PI/2+Math.asin((x0+8-cx)/R),-Math.PI/2+Math.asin((x1-8-cx)/R));g.strokeStyle=css([176,176,182]);g.lineWidth=1.6;g.stroke();}
      g.restore();
      path(0);g.strokeStyle=css([96,96,102]);g.lineWidth=.7;g.stroke();break;}
    case 'dome':{const [cx,cy,r]=key.circle;P.circle(cx,cy,r+3,[70,72,76]);P.circle(cx,cy,r+1.5,[4,4,5]);P.dome(cx,cy,r,down?[8,8,9]:[18,18,20]);
      if(key.dot){const rd=Math.max(2.5,r*.3);if(lit)P.glow(q=>{q.beginPath();q.arc(cx,cy,rd*1.4,0,7);q.fill();},key.dot,rd,1);P.circle(cx,cy,rd,lit?mix(key.dot,[255,255,255],.25):dimC(key.dot,.45));}
      else if(lit){P.glow(q=>{q.lineWidth=2.5;q.beginPath();q.arc(cx,cy,r+1.5,0,7);q.stroke();},C_AMBER,3,.9);P.circle(cx,cy,r+2.2,null,C_AMBER,1.2);}break;}
    case 'cbtn':{const [cx,cy,r]=key.circle;P.circle(cx,cy,r+4,[3,3,4]);P.circle(cx,cy,r+2.5,[90,90,96]);P.chrome(cx,cy,r+1,[-30,-30,-28],2,down?20:0);P.circle(cx,cy,r-3,[10,10,11]);P.chrome(cx,cy,r-4,[-10,-10,-8],2,30);
      if(key.dot)led(P,cx,cy,Math.max(2.5,r*.33),key.dot,lit);break;}
    case 'frame':case 'port':ledOutline(P,key.box,5,c,lit,2);break;
    case 'sq':{const [x0,y0,x1,y1]=key.box;P.rrect([x0-1,y0-1,x1+1,y1+1],3,[2,2,3]);P.gradient(key.box,down?[20,20,22]:[96,96,100],[14,14,15],2);
      P.polygon([[x0+2,y0+2],[x1-6,y0+2],[x0+2,y1-6]],[150,150,156,90]);P.rrect([x0+4,y0+4,x1-4,y1-4],1,down?[10,10,11]:[30,30,32]);break;}
    case 'eject':{const [cx,cy,r]=key.circle;P.circle(cx,cy,r+6,[12,12,13],[60,60,64],1);P.chrome(cx,cy,r,DARK_CHROME,2,down?8:0);P.circle(cx,cy,r-6,[6,6,7]);P.dome(cx,cy,r-8,down?[8,8,9]:[20,20,22]);
      symbol(P,'eject',cx,cy,r*.22,lit?C_LIME:[150,190,40]);break;}
    case 'cdome':{const [cx,cy,r]=key.circle;P.circle(cx,cy,r+2.5,[6,6,7]);P.chrome(cx,cy,r,DARK_CHROME,2,down?8:0);P.chrome(cx,cy,r*.62,DARK_CHROME,3,30);if(key.dot)led(P,cx,cy,Math.max(2.5,r*.3),key.dot,lit);break;}
    case 'ring':{const [cx,cy,r]=key.circle;if(key.big)P.circle(cx,cy,r+6,[16,16,17],[70,70,74],1.2);P.circle(cx,cy,r+3.5,[4,4,5]);P.chrome(cx,cy,r+2,DARK_CHROME,2,20);
      P.circle(cx,cy,r-.5,[3,3,4]);P.dome(cx,cy,r-1.5,down?[6,6,7]:[14,14,15]);if(key.dot)led(P,cx,cy,Math.max(2.5,r*.3),key.dot,lit);break;}
    case 'pale':{const [cx,cy,r]=key.circle;P.circle(cx,cy,r+4,[4,4,5]);P.circle(cx,cy,r+2.4,lit?[255,255,255]:[214,216,220]);
      if(lit)P.glow(q=>{q.lineWidth=3;q.beginPath();q.arc(cx,cy,r+2,0,7);q.stroke();},[255,255,255],3,.8);
      P.circle(cx,cy,r-.4,[3,3,4]);P.dome(cx,cy,r-1,down?[4,4,5]:[12,12,13]);break;}
    case 'reloop':{const [cx,cy,r]=key.circle;P.circle(cx,cy,r+7,[10,10,11],[84,84,90],1.1);P.circle(cx,cy,r+4.5,[3,3,4]);P.chrome(cx,cy,r+3,DARK_CHROME,2,20);
      P.circle(cx,cy,r,[2,2,3]);P.dome(cx,cy,r-1.5,down?[6,6,7]:[16,16,18]);led(P,cx,cy,r*.3,key.dot,lit);break;}
    case 'plate':{const [cx,cy,r]=key.circle;P.circle(cx,cy,r+4,[3,3,4]);P.circle(cx,cy,r+2,[70,70,74]);P.chrome(cx,cy,r,[0,0,2],2,down?14:0);P.circle(cx,cy,r,null,[30,30,32],1);
      const face=lit?c:mix([30,30,32],c,.55);P.g.font='700 7px '+FACE_FONT;const tw=textW(P.g,key.label,7);
      if(lit)P.glow(q=>{q.fillRect(cx-tw/2-5,cy-6.5,tw+10,13);},c,3,.8);P.rrect([cx-tw/2-5,cy-6.5,cx+tw/2+5,cy+6.5],3,face,[20,20,22],.8);P.text(cx,cy,key.label,7,lit?[10,10,12]:[40,38,36],'mm',true);break;}
    case 'chrome':{const [cx,cy,r]=key.circle;P.circle(cx,cy,r+1,[4,4,5]);P.circle(cx,cy,r-1,[18,18,19]);P.chrome(cx,cy,r-4,DARK_CHROME,2,down?8:0);symbol(P,key.symbol,cx,cy,r*.3,C_AMBER);break;}
    case 'loop':{const [cx,cy,r]=key.circle,g=P.g;P.circle(cx,cy,r+5,[8,8,9],[92,92,98],1.1);P.circle(cx,cy,r+2.5,[2,2,3]);
      if(lit)P.glow(q=>{q.beginPath();q.arc(cx,cy,r+1,0,7);q.fill();},c,6,.9);
      const rg=g.createRadialGradient(cx-r*.15,cy-r*.2,r*.1,cx,cy,r);
      if(lit){rg.addColorStop(0,'#ffe2a8');rg.addColorStop(.55,'#ffa640');rg.addColorStop(1,'#ff7a14');}else{rg.addColorStop(0,'#c98a4e');rg.addColorStop(.6,'#a2602a');rg.addColorStop(1,'#6e3a14');}
      g.beginPath();g.arc(cx,cy,r,0,7);g.fillStyle=rg;g.fill();
      g.save();g.beginPath();g.arc(cx,cy,r,0,7);g.clip();P.glowRaw(q=>{q.beginPath();q.ellipse(cx-r*.1,cy-r*.5,r*.55,r*.3,0,0,7);q.fill();},[255,255,255],r*.25,lit?.45:.18,'source-over');g.restore();
      if(down)P.circle(cx,cy,r,[0,0,0,60]);break;}
    case 'call':{const [cx,cy,r]=key.circle;P.circle(cx,cy,r+3,[70,72,76]);P.circle(cx,cy,r+1.5,[4,4,5]);P.dome(cx,cy,r,down?[8,8,9]:[22,22,24]);symbol(P,key.symbol,cx,cy,r*.45,lit?[255,200,90]:C_AMBER);break;}
    case 'big':{const [cx,cy,r]=key.circle;P.circle(cx,cy,r+2,[4,4,5]);if(lit)P.glow(q=>{q.beginPath();q.arc(cx,cy,r+1,0,7);q.fill();},c,9,1);
      P.circle(cx,cy,r,lit?mix(c,[255,255,255],.12):dimC(c,.42));P.circle(cx,cy,r-7,[4,4,5]);P.chrome(cx,cy,r-9,[22,22,24],2,down?10:0);P.circle(cx,cy,r-9,null,[230,230,236],1);
      if(key.symbol)symbol(P,key.symbol,cx,cy,r*.16,[40,40,42]);P.text(cx,cy,key.label,key.font,[40,40,42],'mm',true);break;}
    case 'lever':{const [x0,y0,x1,y1]=key.box,g=P.g;P.rrect([x0-1,y0-1,x1+1,y1+1],4,[50,50,54]);P.rrect(key.box,3,[8,8,9]);
      P.gradient([x0+2,y0+2,x1-2,y0+12],[0,0,0],[16,16,17],2);P.gradient([x0+2,y1-10,x1-2,y1-2],[16,16,17],[30,30,32],2);
      const hy=(y0+y1)/2+(key.pos||0)*13,kx0=x0+5,kx1=x1-5;P.rrect([kx0-1,hy-11,kx1+1,hy+13],4,[0,0,0,150]);
      P.gradient([kx0,hy-12,kx1,hy+10],[96,96,100],[50,50,54],3);P.gradient([kx0+3,hy-8,kx1-3,hy+6],[86,86,90],[66,66,70],2);P.line([[kx0+4,hy-10],[kx1-4,hy-10]],[170,170,176],1);break;}
  }
}
/* ---------- the jog (after the real one: 24 round dishes, three studs between each pair, silver outer ring) ---------- */
const JOG_DIMPLES=24,RIM_IN=F_JOG_RIM,RIM_OUT=296;
function jogStatic(P){
  const [cx,cy,r]=F_JOG,g=P.g;
  P.circle(cx,cy,r+1,[4,4,5]);
  const lg=g.createLinearGradient(cx-r,cy-r,cx+r,cy+r);lg.addColorStop(0,'#f2f3f5');lg.addColorStop(.35,'#9a9ca2');lg.addColorStop(.55,'#d9dadd');lg.addColorStop(.8,'#7c7e84');lg.addColorStop(1,'#c9cace');
  g.beginPath();g.arc(cx,cy,r,0,7);g.fillStyle=lg;g.fill();
  P.circle(cx,cy,r-11,[10,10,11]);P.circle(cx,cy,RIM_OUT+1,[18,18,19]);
}
function jogRim(P,phase){
  const [cx,cy]=F_JOG,g=P.g,step=360/JOG_DIMPLES,mid=(RIM_IN+RIM_OUT)/2+.5;
  const rg=g.createRadialGradient(cx,cy,RIM_IN,cx,cy,RIM_OUT);rg.addColorStop(0,'#2e2f32');rg.addColorStop(.5,'#3c3d40');rg.addColorStop(1,'#333437');
  g.beginPath();g.arc(cx,cy,RIM_OUT,0,Math.PI*2);g.moveTo(cx+RIM_IN,cy);g.arc(cx,cy,RIM_IN,0,Math.PI*2,true);g.fillStyle=rg;g.fill();
  P.circle(cx,cy,RIM_OUT,null,[14,14,15],2);P.circle(cx,cy,RIM_IN+1.5,null,[16,16,17],2);
  for(let i=0;i<JOG_DIMPLES;i++){const a=(i*step+phase-90)*Math.PI/180;dish(P,cx+mid*Math.cos(a),cy+mid*Math.sin(a),a);
    const b=(i+.5)*step+phase-90;
    for(const [rr,da] of [[RIM_IN+9,-1.9],[mid-.5,0],[RIM_OUT-10.5,1.5]]){const t=(b+da)*Math.PI/180;stud(P,cx+rr*Math.cos(t),cy+rr*Math.sin(t),t);}}
}
function dish(P,x,y,a){
  /* a shallow round bowl in the rim: soft, lit from the top-left, no outline */
  const g=P.g,hr=16.5,ht=23.5;g.save();g.translate(x,y);g.rotate(a);
  g.beginPath();g.ellipse(0,0,hr,ht,0,0,7);g.save();g.clip();
  g.rotate(-a);const L=[-.62,-.78];
  let rg=g.createRadialGradient(L[0]*9,L[1]*9,2,0,0,ht*1.05);rg.addColorStop(0,'#5a5a5f');rg.addColorStop(.55,'#434347');rg.addColorStop(1,'#2a2a2d');g.fillStyle=rg;g.fillRect(-30,-30,60,60);
  g.restore();g.restore();
}
function stud(P,x,y,t){
  /* a low flat stud, as on the real rim (lit from above): the flat top is the rim's satin grey with a thin dark edge on its
     upper side and a soft lit lip at the bottom, the short side shows just under it, a faint shadow around */
  const g=P.g,r=4.5,P2=Math.PI*2;
  g.beginPath();g.arc(x,y+.5,r+.7,0,P2);g.fillStyle='rgba(0,0,0,.14)';g.fill();
  g.beginPath();g.arc(x,y+.9,r,0,P2);g.fillStyle='#46474a';g.fill();
  g.beginPath();g.arc(x,y,r,0,P2);g.fillStyle='#343538';g.fill();
  g.beginPath();g.arc(x,y,r-.3,Math.PI*.75,Math.PI*2.25);g.strokeStyle='rgba(8,8,10,.38)';g.lineWidth=1.6;g.stroke();
  g.beginPath();g.arc(x,y-.1,r-.7,Math.PI*.17,Math.PI*.83);g.strokeStyle='rgba(140,140,146,.6)';g.lineWidth=.9;g.stroke();
}
function jogInner(P){
  const [cx,cy]=F_JOG,g=P.g,ri=RIM_IN;
  P.circle(cx,cy,ri,[150,165,168]);P.chrome(cx,cy,ri-.8,[20,34,36],2,-20);P.circle(cx,cy,ri-5,[6,6,7]);P.circle(cx,cy,ri-9,null,[110,118,122],1.2);
  const top=ri-10;const rg=g.createRadialGradient(cx,cy,F_JOG_DISPLAY,cx,cy,top);rg.addColorStop(0,'#0a0a0b');rg.addColorStop(1,'#121214');g.beginPath();g.arc(cx,cy,top,0,7);g.fillStyle=rg;g.fill();
  for(let rr=F_JOG_DISPLAY+6;rr<top;rr+=3)P.circle(cx,cy,rr,null,[255,255,255,7],.6);
  P.circle(cx,cy,F_JOG_DISPLAY+.5,[0,0,0],[92,94,100],.8);
}
/* centre display of the jog (after the real one): a mesh of position segments, the touch rings and the VINYL lamp */
const CENTRE_R=[29,56],CENTRE_GAP=22;
function centreBase(P,live,touch,vinyl,mem){
  const [cx,cy]=F_JOG;P.circle(cx,cy,F_JOG_DISPLAY-1,[0,0,0]);
  const [ri,ro]=CENTRE_R,tick=live?[236,238,242]:[58,60,64];
  for(let i=0;i<120;i++){const a=(i*3-90)*Math.PI/180;P.line([[cx+ri*Math.cos(a),cy+ri*Math.sin(a)],[cx+ro*Math.cos(a),cy+ro*Math.sin(a)]],tick,1.15);}
  for(let rr=ri+2.6;rr<ro;rr+=2.6)P.circle(cx,cy,rr,null,[0,0,0],.75);
  /* two rings of eight segments (manual p. 18): outer = audio memory, lit once the track is in memory; inner = jog touch detection, lit while the top is touched in VINYL */
  const on=touch&&vinyl,off=live?[70,72,76]:[40,42,45],hi=[245,247,250];
  for(let k=0;k<8;k++){P.arc(cx,cy,23.4,k*45+3,k*45+42,mem?hi:off,2.8);P.arc(cx,cy,19.6,k*45+25.5,k*45+64.5,on?hi:off,2.6);}
  /* VINYL indicator: lit only in VINYL mode */
  if(vinyl){P.circle(cx,cy,14.2,[150,192,240]);const g=P.g;g.save();g.beginPath();g.arc(cx,cy,14.2,0,7);g.clip();
    for(let y=cy-14;y<cy+14;y+=1.5)P.line([[cx-15,y],[cx+15,y]],[92,140,205],.55);g.restore();
    g.save();g.translate(cx,cy+3);g.transform(1,0,-.22,1,0,0);g.font='700 9px '+FACE_FONT;g.textAlign='center';g.textBaseline='alphabetic';g.lineWidth=1.6;g.strokeStyle='rgba(20,30,50,.9)';g.strokeText('Vinyl',0,0);g.fillStyle='#fff';g.fillText('Vinyl',0,0);g.restore();}
  else P.circle(cx,cy,14.2,[10,11,13],[34,36,40],.8);
}
function centrePointer(P,turns,cueTurns,ghostTurns){
  const [cx,cy]=F_JOG,[ri,ro]=CENTRE_R;const a0=turns*360-90-CENTRE_GAP/2;const g=P.g;
  g.beginPath();for(let i=0;i<=8;i++){const a=(a0+CENTRE_GAP*i/8)*Math.PI/180;g.lineTo(cx+(ro+1)*Math.cos(a),cy+(ro+1)*Math.sin(a));}
  for(let i=8;i>=0;i--){const a=(a0+CENTRE_GAP*i/8)*Math.PI/180;g.lineTo(cx+(ri-.5)*Math.cos(a),cy+(ri-.5)*Math.sin(a));}g.closePath();g.fillStyle='#000';g.fill();
  const am=a0+CENTRE_GAP/2;for(const da of [-2.4,2.4]){const a=(am+da)*Math.PI/180;P.line([[cx+(ri+.5)*Math.cos(a),cy+(ri+.5)*Math.sin(a)],[cx+(ri+7)*Math.cos(a),cy+(ri+7)*Math.sin(a)]],[255,30,24],1.5);}
  if(cueTurns!=null){const a=(cueTurns*360-90)*Math.PI/180;P.line([[cx+(ro+2)*Math.cos(a),cy+(ro+2)*Math.sin(a)],[cx+(ro+9)*Math.cos(a),cy+(ro+9)*Math.sin(a)]],[255,150,30],2);}
  if(ghostTurns!=null){const a=(ghostTurns*360-90)*Math.PI/180;P.line([[cx+(ro+2)*Math.cos(a),cy+(ro+2)*Math.sin(a)],[cx+(ro+9)*Math.cos(a),cy+(ro+9)*Math.sin(a)]],[255,255,255],2);}
}
/* the jog's ring illumination: the ring inside the rim lights up (levels 0-3) */
function ringLight(P,white,red){
  const [cx,cy]=F_JOG,R=RIM_IN-3;
  for(const [col,lv] of [[[230,244,255],white],[[255,36,24],red]]){if(!lv)continue;const s=lv/3;
    P.glow(q=>{q.lineWidth=4;q.beginPath();q.arc(cx,cy,R+1,0,7);q.stroke();},col,3,.4*s,false);P.circle(cx,cy,R+2,null,col.concat([Math.round(255*(.3+.45*s))]),1.8);}
}
/* the rotary selector seen from above: glossy black collar with a chrome edge, lit ring, knurled chrome knob */
function selector(P,ang,down){
  /* rotary selector seen from above: polished chrome-black collar, thick white lit ring, knurled crown that turns, chrome cap */
  const [cx,cy,r]=F_SELECT,R=SEL_COLLAR,g=P.g;
  P.circle(cx,cy,R+1.2,[4,4,5]);
  const cg=g.createConicGradient(0,cx,cy);
  [[0,'#141416'],[.08,'#3a3a3e'],[.16,'#0c0c0d'],[.3,'#26262a'],[.42,'#08080a'],[.55,'#4a4a50'],[.63,'#9a9aa2'],[.68,'#4a4a50'],[.78,'#101012'],[.9,'#2e2e33'],[1,'#141416']].forEach(([o,c])=>cg.addColorStop(o,c));
  g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);g.fillStyle=cg;g.fill();
  const rg=g.createRadialGradient(cx,cy,r+10,cx,cy,R);rg.addColorStop(0,'rgba(0,0,0,.55)');rg.addColorStop(.5,'rgba(0,0,0,0)');rg.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=rg;g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);g.fill();
  P.circle(cx,cy,R-.4,null,[110,110,116],.8);
  P.glow(q=>{q.lineWidth=5;q.beginPath();q.arc(cx,cy,r+8,0,7);q.stroke();},[230,236,255],3.5,.85);
  P.circle(cx,cy,r+11,null,[240,243,250],4.6);P.circle(cx,cy,r+6.5,[8,8,9]);
  P.circle(cx,cy,r+4.5,[84,86,92]);
  for(let i=0;i<24;i++){const a=(i*15+ang)*Math.PI/180,a2=a+6*Math.PI/180;P.polygon([[cx+(r-1)*Math.cos(a),cy+(r-1)*Math.sin(a)],[cx+(r+4.5)*Math.cos(a),cy+(r+4.5)*Math.sin(a)],[cx+(r+4.5)*Math.cos(a2),cy+(r+4.5)*Math.sin(a2)],[cx+(r-1)*Math.cos(a2),cy+(r-1)*Math.sin(a2)]],[30,30,33]);}
  P.circle(cx,cy,r-1.5,[10,10,11]);P.chrome(cx,cy,r-3,[-8,-8,-6],2,down?18:0);
  if(down)P.circle(cx,cy,r-3,[0,0,0,60]);
}
function sliderCap(P,y){
  /* tempo slider knob: the real knob itself, cut from a photo of the deck (52 x 57 units, image with a 1-unit margin) */
  const x=F_SLIDER[0];
  if(CAP_IMG.complete&&CAP_IMG.naturalWidth){const k=2495/924,w=146/k,h=159/k,ox=x-51.88/2-.926,oy=y-56.85/2-1;
    const g=P.g;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(CAP_IMG,ox,oy,w,h);return;}
  const w=52,h=48,g=P.g,L=x-w/2,R=x+w/2,t=y-h/2,b=y+h/2,m0=t+h*.31,m1=t+h*.68,wl=t+h*.555;
  P.rrect([L-1,t+2,R+2,b+4],5,[0,0,0,150]);
  P.rrect([L,t,R,b],4,[22,22,24]);
  g.save();rrc(g,[L,t,R,b],[4,4,4,4]);g.clip();
  P.gradient([L,t,R,m0],[64,64,68],[40,40,43]);
  P.gradient([L,m0,R,m1],[52,52,56],[34,34,37]);
  P.gradient([L,m1,R,b],[40,40,43],[24,24,26]);
  P.line([[L,m0+.5],[R,m0+.5]],[104,104,110],1);P.line([[L,m0-.6],[R,m0-.6]],[14,14,15],1);
  P.line([[L,m1+.5],[R,m1+.5]],[12,12,13],1.2);P.line([[L,m1+1.6],[R,m1+1.6]],[64,64,68],.7);
  P.line([[L+3,t+1],[R-3,t+1]],[120,120,126],.9);
  g.restore();
  P.rrect([L,t,R,b],4,null,[96,96,102],1);
  P.glow(q=>{q.fillRect(L+3,wl-1.7,w-6,3.4);},[255,255,255],2,.55,false);P.rrect([L+3,wl-1.6,R-3,wl+1.6],1.2,[252,252,255]);
}
