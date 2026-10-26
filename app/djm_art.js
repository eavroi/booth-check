/* ---------------- DJM-900NXS2 face (design proposal) ----------------
   Coordinates are pixels of the 2208 x 2724 top view of the real mixer (333 mm wide): the plate runs from y 97 to 2688,
   the base band to 2716. Same painter, print colour, font and knob language as the CDJ face. */
const DM_W=2208,DM_Y0=97,DM_Y1=2716,DM_PLATE_B=2688;
const DM_STRIP=[544,828.7,1113.4,1398];           /* channel centres */
const DM_MX=1662,DM_FX=1970;                        /* master column and BEAT FX column centres */
const DPRINT=[226,228,232],DPRINT_DIM=[150,152,158];
const DKA=v=>(135+v*270)*Math.PI/180;              /* knob angle: 0 = seven-thirty, 1 = four-thirty */
/* print */
const DT_K=.74;
/* moving parts: during the static pass (DYN is an array) they are only recorded, the live view draws them from the state */
let DYN=null;
function dyn(P,key,box,fn,off){if(DYN){DYN.push({key,box,fn,off});return;}fn(P);}
function dT(P,x,y,t,px,anchor,col,bold){P.text(x,y,t,px*DT_K,col||DPRINT,anchor||'mm',bold);}
/* the dotted bands (USB, MIC, LINK, HEADPHONES, MASTER, SEND / RETURN, BEAT FX) and the dotted panels */
function dotField(P,box,base,dot,step,r){
  const [x0,y0,x1,y1]=box,g=P.g;P.rrect(box,3,base);g.save();P.rr(box,3);g.clip();g.fillStyle=css(dot);
  for(let y=y0+step/2;y<y1;y+=step)for(let x=x0+step/2+((Math.round((y-y0)/step)%2)?step/2:0);x<x1;x+=step){g.beginPath();g.arc(x,y,r,0,7);g.fill();}g.restore();}
function band(P,x0,x1,y,label,dark){
  const box=[x0,y-19,x1,y+19];dotField(P,box,dark?[40,40,43]:[92,93,97],dark?[120,120,126,150]:[200,202,208,170],8.5,1.5);
  if(label){P.g.save();P.g.shadowColor='rgba(0,0,0,.6)';P.g.shadowBlur=3;dT(P,(x0+x1)/2,y+1,label,34,'mm',[246,247,250]);P.g.restore();}}
/* knob scale: 11 dots, a bigger one at the top, and the two end ticks */
function dScale(P,cx,cy,r,opt){opt=opt||{};const d=r+(opt.gap||20);
  for(let i=0;i<11;i++){if(opt.skip&&opt.skip.includes(i))continue;const a=DKA(i/10),big=i===5&&!opt.noTop;P.circle(cx+d*Math.cos(a),cy+d*Math.sin(a),big?4.2:3.2,DPRINT);}
  if(opt.top)P.line([[cx,cy-d-6],[cx,cy-d+8]],DPRINT,3.2);
  if(!opt.noEnds)for(const v of [0,1]){const a=DKA(v);P.line([[cx+(d-7)*Math.cos(a),cy+(d-7)*Math.sin(a)],[cx+(d+9)*Math.cos(a),cy+(d+9)*Math.sin(a)]],DPRINT,3.2);}}
/* knob caps */
function knurl(P,cx,cy,r,n,col,depth){for(let i=0;i<n;i++){const t=i*2*Math.PI/n,t2=t+Math.PI/n*.9;
  P.polygon([[cx+(r-depth)*Math.cos(t),cy+(r-depth)*Math.sin(t)],[cx+r*Math.cos(t),cy+r*Math.sin(t)],[cx+r*Math.cos(t2),cy+r*Math.sin(t2)],[cx+(r-depth)*Math.cos(t2),cy+(r-depth)*Math.sin(t2)]],col);}}
function pointer(P,cx,cy,r0,r1,v,w,col){const a=DKA(v);P.g.lineCap='round';P.line([[cx+r0*Math.cos(a),cy+r0*Math.sin(a)],[cx+r1*Math.cos(a),cy+r1*Math.sin(a)]],col||[248,248,252],w||7);P.g.lineCap='butt';}
function dKnob(P,kind,cx,cy,r,v){
  const g=P.g;
  /* soft shadow under every cap */
  g.save();g.shadowColor='rgba(0,0,0,.75)';g.shadowBlur=r*.35;g.shadowOffsetY=r*.12;P.circle(cx,cy,r,[6,6,7]);g.restore();
  if(kind==='eq'){/* black cap on a polished skirt (EQ, ISO) */
    const lg=g.createLinearGradient(cx-r,cy-r,cx+r,cy+r);lg.addColorStop(0,'#2a2b2f');lg.addColorStop(.4,'#8a8b90');lg.addColorStop(.75,'#f2f3f6');lg.addColorStop(1,'#d8d9dd');
    g.beginPath();g.arc(cx,cy,r,0,7);g.fillStyle=lg;g.fill();P.circle(cx,cy,r-5,[8,8,9]);
    knurl(P,cx,cy,r-6,28,[40,40,44],5);P.dome(cx,cy,r-12,[16,16,18]);pointer(P,cx,cy,4,r-8,v,7);return;}
  if(kind==='grey'){/* TRIM and MIC LEVEL: grey cap */
    P.circle(cx,cy,r,[60,61,65]);knurl(P,cx,cy,r,26,[112,113,118],6);P.dome(cx,cy,r-7,[86,87,92]);pointer(P,cx,cy,3,r-4,v,6.5);return;}
  if(kind==='chrome'){/* COLOR: knurled chrome */
    P.chrome(cx,cy,r,[-6,-6,-4],2,20);for(let i=0;i<40;i++){const t=i*9*Math.PI/180;P.line([[cx+(r-7)*Math.cos(t),cy+(r-7)*Math.sin(t)],[cx+r*Math.cos(t),cy+r*Math.sin(t)]],[60,60,64],1.6);}
    P.circle(cx,cy,r-8,[30,30,32]);P.chrome(cx,cy,r-10,[10,10,12],2,40);for(let rr=6;rr<r-12;rr+=4)P.circle(cx,cy,rr,null,[255,255,255,22],1);
    pointer(P,cx,cy,6,r-10,v,13,[20,20,22]);pointer(P,cx,cy,6,r-11,v,7,[250,250,252]);return;}
  if(kind==='dchrome'){/* PARAMETER: dark chrome */
    P.circle(cx,cy,r,[14,14,15]);knurl(P,cx,cy,r,22,[64,64,70],7);P.chrome(cx,cy,r-8,[-40,-40,-38],3,10);pointer(P,cx,cy,3,r-6,v,6.5);return;}
  if(kind==='enc'){/* TIME: endless encoder, knurled, no pointer */
    P.circle(cx,cy,r,[20,20,22]);knurl(P,cx,cy,r,18,[48,48,52],8);P.dome(cx,cy,r-12,[18,18,20]);P.circle(cx,cy,r-12,null,[60,60,64],1.5);return;}
  if(kind==='select'){/* rotary selectors: black, a long white bar */
    P.circle(cx,cy,r,[12,12,13]);knurl(P,cx,cy,r,30,[38,38,42],4);P.dome(cx,cy,r-5,[22,22,24]);
    const a=DKA(v);g.save();g.translate(cx,cy);g.rotate(a);P.rrect([-6,-6,r-4,6],5,[235,236,240]);g.restore();return;}
  /* standard black knob */
  P.circle(cx,cy,r,[14,14,16]);knurl(P,cx,cy,r,40,[30,30,33],6);P.circle(cx,cy,r,null,[40,40,44],1.5);P.dome(cx,cy,r-7,[18,18,20]);pointer(P,cx,cy,3,r-5,v,6.5);
}
/* the angle of a selector position given as a clock direction in degrees (0 = up, clockwise) */
const clk=d=>(d-90)*Math.PI/180;
/* rotary selectors, as on the real mixer: a smooth black knob crossed by a raised grey bar, a white line from the centre
   to the bar's tip, which passes the knob's edge on the pointing side */
function selKnob(P,cx,cy,r,dirDeg){const g=P.g;
  g.save();g.shadowColor='rgba(0,0,0,.8)';g.shadowBlur=r*.4;g.shadowOffsetY=r*.14;P.circle(cx,cy,r,[4,4,5]);g.restore();
  const rg=g.createRadialGradient(cx-r*.3,cy-r*.35,r*.1,cx,cy,r);rg.addColorStop(0,'#2a2a2d');rg.addColorStop(.6,'#151517');rg.addColorStop(1,'#060607');
  g.beginPath();g.arc(cx,cy,r,0,7);g.fillStyle=rg;g.fill();P.circle(cx,cy,r,null,[46,46,50],1.6);P.circle(cx,cy,r-3,null,[0,0,0,140],2);
  const w=r*.36;g.save();g.translate(cx,cy);g.rotate(clk(dirDeg));
  /* the bar (x along the pointer): it spans the whole knob, its far end follows the knob's edge, its tip passes the near edge */
  g.save();g.beginPath();g.moveTo(0,-r-30);g.lineTo(r+30,-r-30);g.lineTo(r+30,r+30);g.lineTo(0,r+30);g.arc(0,0,r-1.5,Math.PI/2,Math.PI*1.5);g.closePath();g.clip();
  g.save();g.shadowColor='rgba(0,0,0,.7)';g.shadowBlur=r*.18;g.shadowOffsetY=r*.06;
  g.beginPath();g.moveTo(-r,-w);g.lineTo(r+3,-w);g.quadraticCurveTo(r+9,-w,r+9,-w+6);g.lineTo(r+9,w-6);g.quadraticCurveTo(r+9,w,r+3,w);g.lineTo(-r,w);g.closePath();
  const bg=g.createLinearGradient(0,-w,0,w);bg.addColorStop(0,'#5a5b60');bg.addColorStop(.35,'#3c3c40');bg.addColorStop(1,'#1c1c1f');g.fillStyle=bg;g.fill();g.restore();
  g.strokeStyle='rgba(120,120,128,.5)';g.lineWidth=1.2;g.stroke();g.restore();
  g.lineCap='round';g.beginPath();g.moveTo(-r*.12,0);g.lineTo(r+7,0);g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=10;g.stroke();
  g.beginPath();g.moveTo(-r*.12,0);g.lineTo(r+7,0);g.strokeStyle='#ececf0';g.lineWidth=6.5;g.stroke();g.lineCap='butt';
  g.restore();}
/* a knob and a switch that follow the state */
function kn(P,id,get,kind,cx,cy,r){dyn(P,()=>'kn|'+kind+'|'+Math.round(get()*100),[cx-r-16,cy-r-16,cx+r+18,cy+r+22],P=>dKnob(P,kind,cx,cy,r,get()));}
function sw(P,id,get,cx,cy,w,h){dyn(P,()=>'sw|'+w+'|'+get(),[cx-w/2-8,cy-h/2-8,cx+w/2+8,cy+h/2+8],P=>slideSwitch(P,cx,cy,w,h,get()));}
const blinkOn=()=>Math.floor(performance.now()/400)%2===0;
const clipOn=t=>!!t&&performance.now()/1000-t<.5;
/* lit parts */
function glowBox(P,box,col,blur,strength){P.glow(q=>{q.fillRect(box[0],box[1],box[2]-box[0],box[3]-box[1]);},col,blur,strength==null?.9:strength);}
function cueKey(P,cx,cy,lit,label){const b=[cx-70,cy-28,cx+70,cy+28],g=P.g;
  P.rrect([b[0]-3,b[1]-3,b[2]+3,b[3]+4],10,[4,4,5]);
  if(lit)glowBox(P,b,[255,110,30],14,.9);
  const lg=g.createLinearGradient(0,b[1],0,b[3]);
  if(lit){lg.addColorStop(0,'#ffb27a');lg.addColorStop(.5,'#ff8a3c');lg.addColorStop(1,'#f0601c');}else{lg.addColorStop(0,'#7a4a2c');lg.addColorStop(1,'#4a2a16');}
  P.rr(b,9);g.fillStyle=lg;g.fill();P.rrect(b,9,null,lit?[255,200,160]:[130,90,60],2);
  dT(P,cx,cy+1,label||'CUE',30,'mm',lit?[40,16,4]:[24,12,4]);}
function fxTag(P,cx,cy,lit){const b=[cx-68,cy-15,cx+68,cy+15];if(lit)glowBox(P,b,[60,150,255],8,.8);
  P.rrect(b,3,lit?[70,160,255]:[22,48,90],lit?[170,215,255]:[40,80,140],2);dT(P,cx,cy+1,'BEAT FX',24,'mm',lit?[8,20,44]:[70,110,170]);}
function clipTag(P,cx,cy,lit){const b=[cx-41,cy-15,cx+41,cy+15];P.rrect(b,3,[16,16,18],[60,60,64],2);if(lit)glowBox(P,[b[0]+6,b[1]+6,b[2]-6,b[3]-6],[255,40,40],6,.8);
  dT(P,cx,cy+1,'CLIP',24,'mm',lit?[255,90,90]:[200,40,40],true);}
function inverse(P,cx,cy,t,px){px*=DT_K;P.g.font='700 '+px+'px '+FACE_FONT;const w=textW(P.g,t,px);P.rrect([cx-w/2-5,cy-px*.62,cx+w/2+5,cy+px*.62],3,DPRINT);P.text(cx,cy+1,t,px,[16,16,18],'mm',true);}
function meterLed(P,x,y,col,lit){const b=[x-9,y-15,x+9,y+15];if(lit)glowBox(P,b,col,7,.75);P.rrect(b,6,lit?mix(col,[255,255,255],.15):mix([12,12,13],col,.22));}
function slideSwitch(P,cx,cy,w,h,pos){/* pos -1 / 0 / 1 */
  const b=[cx-w/2,cy-h/2,cx+w/2,cy+h/2];P.rrect([b[0]-3,b[1]-3,b[2]+3,b[3]+3],8,[62,62,66]);P.rrect(b,6,[6,6,7]);
  P.gradient([b[0]+4,b[1]+4,b[2]-4,b[3]-4],[18,18,20],[30,30,33],4);
  const kx=cx+pos*(w/2-26);P.rrect([kx-18,b[1]+6,kx+18,b[3]-6],4,[40,40,44]);P.gradient([kx-15,b[1]+9,kx+15,b[3]-9],[70,70,76],[36,36,40],3);P.rrect([kx-4,b[1]+12,kx+4,b[3]-12],2,[200,200,206]);}
function vBar(P,x,y0,y1,col,w){P.g.lineCap='round';P.line([[x,y0],[x,y1]],col||[150,152,158],w||5);P.g.lineCap='butt';}
function screwD(P,x,y){const g=P.g;P.circle(x,y,22,[4,4,5]);const lg=g.createLinearGradient(x-20,y-20,x+20,y+20);lg.addColorStop(0,'#2a2a2e');lg.addColorStop(1,'#0a0a0b');g.beginPath();g.arc(x,y,19,0,7);g.fillStyle=lg;g.fill();
  P.circle(x,y,19,null,[52,52,56],1.5);P.line([[x-8,y],[x+8,y]],[0,0,0],4);P.line([[x,y-8],[x,y+8]],[0,0,0],4);}
/* ---------------- the body ---------------- */
function drawMixerBody(P,st){
  const g=P.g;
  /* plate: lighter, brushed grey on the left column, dark elsewhere */
  P.rrect([0,DM_Y0,DM_W,DM_PLATE_B],12,[16,16,18]);
  g.save();P.rr([0,DM_Y0,DM_W,DM_PLATE_B],12);g.clip();
  P.lit([0,DM_Y0,DM_W,DM_PLATE_B],[17,17,19],30,[1100,150,1500,1300],0,false);
  const lg=g.createLinearGradient(0,DM_Y0,0,2000);lg.addColorStop(0,'rgba(112,113,117,.95)');lg.addColorStop(.25,'rgba(84,85,89,.85)');lg.addColorStop(.55,'rgba(44,45,48,.6)');lg.addColorStop(1,'rgba(22,22,24,0)');g.fillStyle=lg;g.fillRect(0,DM_Y0,392,2000-DM_Y0);
  /* fader section: a separate black plate */
  P.rrect([402,1702,1542,DM_PLATE_B+4],6,[10,10,11],[44,44,48],2);P.lit([404,1704,1540,DM_PLATE_B],[10,10,11],12,[970,1700,900,700],6,false);
  g.restore();
  P.rrect([0,DM_Y0,DM_W,DM_PLATE_B],12,null,[70,70,76],2);
  /* base band */
  const bg=g.createLinearGradient(0,DM_PLATE_B,0,DM_Y1);bg.addColorStop(0,'#1a1a1c');bg.addColorStop(.25,'#3e3e42');bg.addColorStop(1,'#2a2a2d');
  g.beginPath();g.moveTo(0,DM_PLATE_B);g.lineTo(DM_W,DM_PLATE_B);g.lineTo(DM_W,DM_Y1-14);g.arcTo(DM_W,DM_Y1,DM_W-14,DM_Y1,14);g.lineTo(14,DM_Y1);g.arcTo(0,DM_Y1,0,DM_Y1-14,14);g.closePath();g.fillStyle=bg;g.fill();
  P.line([[14,DM_Y1-1],[DM_W-14,DM_Y1-1]],[120,120,126],1.5);
  /* light rails between the columns */
  vBar(P,391,180,2555,[205,206,212],6);vBar(P,1550,180,2440,[205,206,212],6);vBar(P,1762,180,2440,[205,206,212],6);
  for(const x of [686,970.5,1255])vBar(P,x,288,1690,[110,111,117],5);
  for(const x of [686,970.5,1255]){vBar(P,x,1716,1800,[96,97,102],5);vBar(P,x,2160,2380,[96,97,102],5);}
  /* screws */
  /* screws, placed from the top view photo: one line along the bottom, one between channels 2 and 3 under the LOW knobs */
  for(const [x,y] of [[48,154],[686,154],[1504,154],[2164,154],[48,1090],[970.5,1200],[48,1921],[442,1745],[1500,1745],[970.5,2330],[2164,1724],[2164,2063],[48,2621],[371,2621],[450,2621],[1500,2621],[1577,2621],[2164,2621]])screwD(P,x,y);
  leftColumnD(P,st);for(let i=0;i<4;i++)stripD(P,i,st);masterD(P,st);fxD(P,st);faderSectionD(P,st);
}
function leftColumnD(P,st){
  /* USB: two ports with their lit strips, MIDI ON/OFF */
  band(P,35,378,201,'USB');
  P.rrect([190,226,220,246],2,null,DPRINT,2.4);P.line([[183,252],[227,252]],DPRINT,3);
  for(const [x,l] of [[110,'A'],[302,'B']]){const b=[x-62,258,x+62,424];P.rrect([b[0]-4,b[1]-4,b[2]+4,b[3]+4],10,[6,6,7]);P.rrect(b,8,[24,24,26],[70,70,76],2);
    P.gradient([b[0]+10,b[1]+10,b[2]-10,b[3]-38],[64,64,68],[34,34,37],4);P.circle(x,b[3]-38,30,[42,42,46]);
    /* USB link indicator: lit only when a computer is connected (manual), never the case here */
    P.rrect([b[0]+12,b[3]-26,b[2]-12,b[3]-12],2,[52,60,34]);
    dT(P,x,446,l,36);
    const k=[x-40,474,x+40,528];P.rrect([k[0]-3,k[1]-3,k[2]+3,k[3]+3],8,[4,4,5]);P.gradient(k,[40,40,44],[22,22,24],6);
    const on=false;P.rrect(k,6,null,on?[214,255,70]:[120,150,40],4);P.rrect([x-22,498,x+22,504],2,on?[230,255,90]:[110,130,40]);}
  dT(P,205,490,'MIDI',24);dT(P,205,512,'ON/OFF',24);
  /* MIC */
  band(P,35,378,560,'MIC');
  dT(P,205,602,'LEVEL',30);P.line([[125,612],[125,600],[160,600]],DPRINT,2.4);P.line([[250,600],[285,600],[285,612]],DPRINT,2.4);
  for(const [x,l] of [[124,'MIC 1'],[286,'MIC 2']]){dT(P,x,630,l,30);dScale(P,x,700,42,{gap:16,noEnds:false});dKnob(P,'grey',x,700,42,0);dT(P,x-44,752,'−∞',26,'rm');dT(P,x+40,752,'0',24);}
  dT(P,122,832,'HI',28);dScale(P,205,830,40,{gap:16});dKnob(P,'std',205,830,40,.5);dT(P,158,886,'−12',24);dT(P,258,886,'+12',24);
  dT(P,110,946,'LOW',28);dScale(P,205,945,40,{gap:16});dKnob(P,'std',205,945,40,.5);dT(P,158,1001,'−12',24);dT(P,258,1001,'+12',24);
  P.line([[285,790],[298,790],[298,945],[285,945]],DPRINT,2.4);dT(P,300,888,'EQ',28,'lm');
  /* OFF / ON / TALK OVER */
  dT(P,155,1030,'OFF',24);dT(P,205,1030,'ON',24);dT(P,284,1030,'TALK OVER',22);
  P.circle(350,1030,10,[230,20,40]);P.circle(350,1030,10,null,[120,10,20],2);
  for(const x of [185,228])P.circle(x,1050,4,DPRINT);P.line([[185,1050],[228,1050]],DPRINT,2);
  slideSwitch(P,205,1082,140,46,0);
  fxTag(P,205,1162,st.fxCh==='MIC');
  /* SOUND COLOR FX */
  dotField(P,[35,1240,380,1695],[50,51,55],[190,192,198,190],7.5,1.4);
  const scf=[['SPACE',90,1297],['DUB\nECHO',205,1297],['SWEEP',318,1297],['NOISE',90,1433],['CRUSH',205,1433],['FILTER',318,1433]];
  for(const [t,x,y] of scf){const b=[x-46,y-34,x+46,y+34],name=t.replace('\n',' ');
    dyn(P,()=>'scf|'+name+'|'+(st.color===name&&blinkOn()),[b[0]-12,b[1]-12,b[2]+12,b[3]+14],P=>{const on=st.color===name&&blinkOn();
    P.rrect([b[0]-3,b[1]-3,b[2]+3,b[3]+5],12,[6,6,7]);const g=P.g,lg=g.createLinearGradient(0,b[1],0,b[3]);lg.addColorStop(0,'#e8e9ec');lg.addColorStop(.5,'#9a9ca2');lg.addColorStop(1,'#d0d1d5');
    P.rr(b,11);g.fillStyle=lg;g.fill();const f=[b[0]+9,b[1]+9,b[2]-9,b[3]-9];P.rrect(f,6,on?[230,232,236]:[22,22,24]);if(on)glowBox(P,f,[255,255,255],8,.5);
    dT(P,x,y+(t.includes('\n')?0:1),t,t.includes('\n')?20:21,'mm',on?[20,20,22]:[240,240,244],true);});}
  dT(P,205,1366,'SOUND COLOR FX',36);
  dT(P,205,1512,'PARAMETER',30);dScale(P,205,1595,42,{gap:18,noEnds:true});
  for(const v of [0,1]){const a=DKA(v);P.line([[205+64*Math.cos(a),1595+64*Math.sin(a)],[205+82*Math.cos(a),1595+82*Math.sin(a)]],DPRINT,3.2);}
  kn(P,'param',()=>st.param,'dchrome',205,1595,42);dT(P,148,1665,'MIN',24);dT(P,270,1665,'MAX',24);
  /* LINK, HEADPHONES */
  band(P,35,378,1720,'LINK',true);cueKey(P,205,1778,st.cueLink);
  band(P,35,378,1842,'HEADPHONES',true);
  dT(P,190,1883,'MONO SPLIT',24,'rm');dT(P,228,1883,'STEREO',24,'lm');P.circle(197,1883,4,DPRINT);P.circle(218,1883,4,DPRINT);
  sw(P,'mono',()=>st.mono,205,1922,92,46);
  dT(P,205,1996,'MIXING',30);dScale(P,206,2080,53,{gap:16});kn(P,'mixing',()=>st.mixing,'std',206,2080,53);dT(P,145,2156,'CUE',24);dT(P,282,2156,'MASTER',24);
  dT(P,205,2186,'LEVEL',30);dScale(P,204,2268,53,{gap:16});kn(P,'phl',()=>st.phLevel,'std',204,2268,53);dT(P,150,2342,'−∞',30);dT(P,250,2342,'0',24);
  dT(P,205,2398,'PHONES',30);
  P.circle(205,2470,32,[4,4,5]);P.circle(205,2470,28,[22,22,24],[80,80,86],2.5);P.circle(205,2470,19,[8,8,9],[50,50,54],2);P.circle(205,2470,11,[0,0,0]);
  P.circle(206,2594,36,[4,4,5]);const g=P.g,lg=g.createLinearGradient(170,2560,240,2630);lg.addColorStop(0,'#f5d36a');lg.addColorStop(.5,'#9a6e10');lg.addColorStop(1,'#f0c858');g.beginPath();g.arc(206,2594,26,0,7);g.strokeStyle=lg;g.lineWidth=9;g.stroke();P.circle(206,2594,21,[0,0,0]);
}
function stripD(P,i,st){
  const cx=DM_STRIP[i],ch=st.ch[i];
  /* input selector: USB A/B, DIGITAL, LINE, PHONO, RETURN AUX */
  const pos={A:-105,B:-45,DIGITAL:-12.5,LINE:15,PHONO:45,RETURN:75};
  P.rrect([cx-104,224,cx-86,236],1,null,DPRINT,2.2);P.line([[cx-108,240],[cx-82,240]],DPRINT,2.6);
  dT(P,cx-34,232,'DIGITAL',27);dT(P,cx+44,232,'LINE',27);dT(P,cx-110,262,'A',26);dT(P,cx-73,262,'B',26);dT(P,cx+100,260,'PHONO',28);dT(P,cx+103,288,'RETURN',24);dT(P,cx+113,308,'AUX',24);
  P.line([[cx-114,274],[cx-114,289],[cx-52,303]],DPRINT,2.4);
  for(const d of [-45,-12.5,15,45,75]){const a=clk(d);P.line([[cx+55*Math.cos(a),318+55*Math.sin(a)],[cx+78*Math.cos(a),318+78*Math.sin(a)]],DPRINT,2.6);}
  dyn(P,()=>'in|'+i+'|'+ch.input,[cx-80,318-80,cx+80,318+80],P=>selKnob(P,cx,318,53,pos[ch.input]));
  dT(P,cx+97,368,String(i+1),110,'mm',[244,245,248]);
  /* CLIP, TRIM */
  dyn(P,()=>'clip|'+i+'|'+clipOn(ch.clip),[cx-90-50,433-24,cx-90+50,433+24],P=>clipTag(P,cx-90,433,clipOn(ch.clip)));dT(P,cx,433,'TRIM',30);dT(P,cx+83,431,['DECK 3/C','DECK 1/A','DECK 2/B','DECK 4/D'][i],22,'mm',DPRINT,'cond');
  dScale(P,cx,510,46,{gap:16});kn(P,'trim'+i,()=>ch.trim,'grey',cx,510,46);dT(P,cx-48,571,'−∞',30,'rm');dT(P,cx+56,571,'+9',26);
  /* channel level indicator */
  const mx=cx-122;P.rrect([mx-15,500,mx+15,1178],8,[6,6,7],[46,46,50],2);
  const labels=['12','9','6','3','0','-3','-6','-9','-12','-15','-18','-21','-24','-27','-30'];
  labels.forEach((l,k)=>{const y=528+k*43.3,col=k===0?[255,30,40]:k<5?[255,150,40]:[220,240,20],db=+l;dyn(P,()=>'led|'+k+'|'+(ch.level>=db-1.5),[mx-20,y-20,mx+20,y+20],P=>meterLed(P,mx,y,col,ch.level>=db-1.5));dT(P,mx+20,y,l,20,'lm',DPRINT_DIM);});
  dT(P,mx+20,1186,'dB',20,'lm',DPRINT_DIM);
  /* EQ / ISO */
  for(const [y,l,k] of [[706,'HI','hi'],[908,'MID','mid'],[1110,'LOW','low']]){
    dT(P,cx,y-88,l,30);dScale(P,cx,y,53,{gap:16});kn(P,k+i,()=>ch[k],'eq',cx,y,53);
    dT(P,cx-24,y+75,'−26/',26,'rm');inverse(P,cx-4,y+75,'−∞',22);dT(P,cx+66,y+75,'+6',26);}
  P.line([[cx+97,625],[cx+108,625],[cx+108,878]],DPRINT,2.4);P.line([[cx+108,936],[cx+108,1030],[cx+97,1030]],DPRINT,2.4);dT(P,cx+110,893,'EQ/',28);inverse(P,cx+108,920,'ISO',22);
  /* COLOR */
  dotField(P,[cx-140,1240,cx+140,1478],[34,34,37],[150,151,157,170],7.5,1.4);
  dT(P,cx,1268,'COLOR',30);P.arc(cx,1366,82,128,412,DPRINT,4);kn(P,'color'+i,()=>ch.color,'chrome',cx,1366,55);
  dT(P,cx-95,1448,'LOW',22);dT(P,cx+92,1448,'HI',22);
  dyn(P,()=>'cue|'+ch.cue,[cx-90,1537-46,cx+90,1537+46],P=>cueKey(P,cx,1537,ch.cue));fxTag(P,cx,1637,st.fxCh===String(i+1));
}
function faderSectionD(P,st){
  for(let i=0;i<4;i++){const cx=DM_STRIP[i],ch=st.ch[i];
    for(let k=0;k<11;k++){const y=1835+k*29.2;P.line([[cx-87,y],[cx-14,y]],[220,222,226],2.6);P.line([[cx+14,y],[cx+87,y]],[220,222,226],2.6);dT(P,cx+142,y,String(10-k),24);}
    P.rrect([cx-9,1812,cx+9,2152],4,[0,0,0],[40,40,44],1.5);
    dT(P,cx-60,2262,'A',26);dT(P,cx,2262,'THRU',26);dT(P,cx+60,2262,'B',26);
    P.line([[cx-56,2276],[cx-50,2284],[cx+50,2284],[cx+56,2276]],DPRINT,2);for(const dx of [-30,0,30])P.circle(cx+dx,2284,4,DPRINT);
    sw(P,'xf'+i,()=>ch.xf,cx,2328,104,64);
    dyn(P,()=>'fcap',[cx-90,2127-50,cx+90,2127+50],P=>faderCapD(P,cx,2127),()=>[0,-ch.fader*292]);}
  dT(P,970.5,2418,'CROSS FADER ASSIGN',30);P.line([[492,2398],[492,2418],[808,2418]],DPRINT,2.2);P.line([[1133,2418],[1450,2418],[1450,2398]],DPRINT,2.2);
  /* crossfader */
  dT(P,712,2573,'❮A',40,'mm',[240,240,244]);dT(P,1230,2573,'B❯',40,'mm',[240,240,244]);
  for(let k=0;k<11;k++){const x=820+k*30;if(Math.abs(x-970)<14)continue;P.line([[x,2495],[x,2652]],[220,222,226],2.4);}
  P.rrect([795,2565,1148,2583],3,[6,6,7],[120,120,126],2);P.rrect([801,2569,1142,2579],2,[0,0,0]);
  dyn(P,()=>'xcap',[920,2480,1021,2668],P=>{const x=970.5;P.g.save();P.g.shadowColor='rgba(0,0,0,.8)';P.g.shadowBlur=14;P.rrect([x-22,2508,x+22,2640],5,[30,30,33]);P.g.restore();
  P.gradient([x-22,2508,x+22,2640],[64,64,68],[24,24,26],5);P.rrect([x-5,2514,x+5,2634],3,[236,236,240]);P.rrect([x-22,2508,x+22,2640],5,null,[110,110,116],1.5);},()=>[st.xfader*150,0]);
}
function faderCapD(P,cx,y){const g=P.g;g.save();g.shadowColor='rgba(0,0,0,.85)';g.shadowBlur=16;g.shadowOffsetY=6;P.rrect([cx-64,y-22,cx+64,y+22],5,[24,24,26]);g.restore();
  P.gradient([cx-64,y-22,cx+64,y+4],[70,70,74],[40,40,43],5);P.gradient([cx-64,y+4,cx+64,y+22],[30,30,33],[18,18,20],0);
  P.rrect([cx-56,y+1,cx+56,y+7],3,[244,244,248]);P.rrect([cx-64,y-22,cx+64,y+22],5,null,[110,110,116],1.5);}
function masterD(P,st){
  const x=DM_MX;
  band(P,1572,1750,201,'MASTER');dT(P,x,236,'LEVEL',30);dScale(P,x,316,52,{gap:16});kn(P,'master',()=>st.master,'std',x,316,52);
  dT(P,x-50,392,'−∞',30,'rm');dT(P,x+46,392,'0',24);P.arc(x,316,80,-50,10,DPRINT,4);
  dyn(P,()=>'mclip|'+(st.mL>13||st.mR>13),[x-50,433-24,x+50,433+24],P=>clipTag(P,x,433,st.mL>13||st.mR>13));
  const labels=['15','12','9','6','3','0','- 3','- 6','- 9','-12','-15','-18','-21','-24','-27'];
  for(const side of [-1,1]){const mx=x+side*48;P.rrect([mx-15,500,mx+15,1150],8,[6,6,7],[46,46,50],2);
    labels.forEach((l,k)=>{const y=528+k*43.3,col=k<2?[255,30,40]:k<6?[255,150,40]:[220,240,20],db=+l.replace(' ',''),lv=()=>side<0?st.mL:st.mR;dyn(P,()=>'led|'+k+'|'+(lv()>=db-1.5),[mx-20,y-20,mx+20,y+20],P=>meterLed(P,mx,y,col,lv()>=db-1.5));});}
  labels.forEach((l,k)=>dT(P,x+2,528+k*43.3,l,22));
  dT(P,x-48,1186,'L',22);dT(P,x,1186,'dB',22);dT(P,x+48,1186,'R',22);
  dT(P,x,1278,'BALANCE',30);dScale(P,x+4,1366,47,{gap:16});kn(P,'balance',()=>st.balance,'std',x+4,1366,47);dT(P,x-45,1440,'L',22);dT(P,x+52,1440,'R',22);
  dyn(P,()=>'cue|'+st.cueMaster,[x-90,1537-46,x+90,1537+46],P=>cueKey(P,x,1537,st.cueMaster));fxTag(P,x,1637,st.fxCh==='MASTER');
  dT(P,x,1726,'BOOTH MONITOR',29);dScale(P,x+2,1812,52,{gap:16});kn(P,'booth',()=>st.booth,'std',x+2,1812,52);dT(P,x-50,1882,'−∞',30,'rm');dT(P,x+46,1882,'0',24);
  P.line([[1575,1905],[1748,1905]],[120,120,126],2);
  dT(P,x,1936,'EQ CURVE',28);inverse(P,x-38,1961,'ISOLATOR',20);dT(P,x+28,1961,'EQ',22);for(const dx of [-26,-2])P.circle(x+dx,1978,4,DPRINT);
  sw(P,'eqc',()=>st.eqCurve,x,2022,104,64);
  dT(P,x,2088,'CH FADER',28);
  const curve=(cx,cy,k)=>{const g=P.g;g.beginPath();g.moveTo(cx-21,cy+11);for(let t=0;t<=1.0001;t+=.05){const xx=cx-21+42*t,yy=cy+11-22*(k===0?Math.pow(t,3.5):k===1?t:1-Math.pow(1-t,3.5));g.lineTo(xx,yy);}g.lineTo(cx+21,cy+11);g.closePath();g.fillStyle=css(DPRINT);g.fill();};
  curve(x-58,2118,0);curve(x,2118,1);curve(x+58,2118,2);
  sw(P,'chc',()=>st.chCurve,x,2172,104,64);
  dT(P,x,2238,'CROSS FADER',28);
  const xf=(cx,cy,k)=>{const g=P.g;g.strokeStyle=css(DPRINT);g.lineWidth=2.6;g.beginPath();const w=20,h=11;
    if(k===0){g.moveTo(cx-w,cy+h);g.lineTo(cx-w+7,cy-h);g.lineTo(cx+w,cy-h);g.moveTo(cx-w,cy-h);g.lineTo(cx+w-7,cy-h);g.lineTo(cx+w,cy+h);g.moveTo(cx-w+7,cy-h);g.lineTo(cx-w+11,cy+h);g.moveTo(cx+w-7,cy-h);g.lineTo(cx+w-11,cy+h);}
    else if(k===1){g.moveTo(cx-w,cy+h);g.quadraticCurveTo(cx-2,cy-h*1.6,cx+w,cy+h*.2);g.moveTo(cx+w,cy+h);g.quadraticCurveTo(cx+2,cy-h*1.6,cx-w,cy+h*.2);}
    else{g.moveTo(cx-w,cy-h);g.lineTo(cx+w,cy+h);g.moveTo(cx-w,cy+h);g.lineTo(cx+w,cy-h);}g.stroke();};
  xf(x-58,2268,0);xf(x,2268,1);xf(x+58,2268,2);
  sw(P,'xfc',()=>st.xfCurve,x,2326,104,64);
}
function fxD(P,st){
  const x=DM_FX;
  /* POWER, SEND / RETURN */
  dT(P,1950,138,'POWER',28);P.line([[1985,148],[1997,148],[1997,122]],DPRINT,2.4);
  band(P,1775,2165,201,'SEND / RETURN');
  dT(P,1852,238,'1/4" JACK',22,'rm');P.circle(1864,238,4,DPRINT);P.circle(1884,238,4,DPRINT);dT(P,1896,238,'USB',22,'lm');
  P.line([[1942,238],[1964,238]],DPRINT,2);P.circle(1940,238,4,DPRINT);P.polygon([[1964,233],[1972,238],[1964,243]],DPRINT);
  slideSwitch(P,1880,272,96,46,1);P.line([[1930,272],[2005,272]],DPRINT,2);
  dT(P,1880,318,'RETURN TYPE',22);dT(P,1840,340,'AUX',22,'rm');P.circle(1864,340,4,DPRINT);P.circle(1884,340,4,DPRINT);dT(P,1896,340,'INSERT',22,'lm');
  slideSwitch(P,1880,376,96,46,-1);
  const ub=[2028,225,2150,395];P.rrect([ub[0]-4,ub[1]-4,ub[2]+4,ub[3]+4],10,[6,6,7]);P.rrect(ub,8,[24,24,26],[70,70,76],2);P.gradient([ub[0]+10,ub[1]+10,ub[2]-10,ub[3]-48],[64,64,68],[34,34,37],4);
  P.rrect([ub[0]+14,ub[3]-38,ub[2]-14,ub[3]-26],2,[52,60,34]);dT(P,(ub[0]+ub[2])/2,ub[3]-12,'5V ⎓ 2.1A',15,'mm',DPRINT_DIM);
  dT(P,1890,433,'LEVEL',30);dScale(P,1892,526,52,{gap:16});dKnob(P,'std',1892,526,52,.5);dT(P,1830,594,'MIN',24);dT(P,1955,594,'MAX',24);
  dT(P,2088,433,'ON/OFF',30);bigBlue(P,2086,528,62,st.sendOn);
  /* BEAT FX: glass panel with the OLED screen, X-PAD, BEAT, TAP and QUANTIZE */
  band(P,1785,2160,625,'BEAT FX');
  const gp=[1784,646,2160,1464],g=P.g;P.rrect([gp[0]-3,gp[1]-3,gp[2]+3,gp[3]+3],12,[2,2,3]);P.rrect(gp,10,[10,10,12],[64,64,70],2);
  const lg=g.createLinearGradient(gp[0],gp[1],gp[2],gp[1]+260);lg.addColorStop(0,'rgba(255,255,255,.10)');lg.addColorStop(.5,'rgba(255,255,255,.02)');lg.addColorStop(.5001,'rgba(0,0,0,0)');g.fillStyle=lg;g.save();P.rr([gp[0],gp[1],gp[2],gp[1]+300],10);g.clip();g.fillRect(gp[0],gp[1],gp[2]-gp[0],300);g.restore();
  dyn(P,()=>'oled|'+st.bpm+'|'+(st.bpmLost&&!blinkOn())+'|'+st.quantize,[1844,688,2102,894],P=>oledD(P,[1860,704,2086,878],st));
  dT(P,x,952,'X-PAD',30);
  xpadD(P,st);
  for(const [bx,dir] of [[1855,-1],[2085,1]]){const b=[bx-56,1230,bx+56,1286];P.rrect([b[0]-3,b[1]-3,b[2]+3,b[3]+4],8,[2,2,3]);P.gradient(b,[56,56,60],[24,24,26],6);P.rrect(b,6,null,[96,96,102],1.5);
    P.polygon(dir<0?[[bx+14,1246],[bx+14,1270],[bx-16,1258]]:[[bx-14,1246],[bx-14,1270],[bx+16,1258]],[240,240,244]);}
  P.line([[1917,1232],[2023,1232]],DPRINT,2);P.line([[1917,1284],[2023,1284]],DPRINT,2);dT(P,x,1259,'BEAT',28);
  dT(P,1845,1316,'AUTO',22);dT(P,1845,1338,'/TAP',22);roundKey(P,1845,1392,26,null);
  P.circle(1972,1372,52,[8,8,9],[70,70,76],2);if(st.tap)P.glow(q=>{q.lineWidth=10;q.beginPath();q.arc(1972,1372,39,0,7);q.stroke();},[40,255,110],8,.9);
  P.circle(1972,1372,42,null,st.tap?[70,255,130]:[30,110,60],6);P.dome(1972,1372,36,[18,18,20]);dT(P,1972,1373,'TAP',26,'mm',st.tap?[80,255,140]:[40,130,70],true);
  P.g.beginPath();[[2048,1308],[2056,1302],[2064,1308],[2064,1318],[2056,1324],[2048,1318]].forEach((p,i)=>i?P.g.lineTo(p[0],p[1]):P.g.moveTo(p[0],p[1]));P.g.closePath();P.g.strokeStyle=css(DPRINT);P.g.lineWidth=2.4;P.g.stroke();P.circle(2056,1313,3,DPRINT);dT(P,2070,1314,'QUANTIZE',22,'lm');P.line([[2056,1338],[2072,1338]],DPRINT_DIM,2);dT(P,2078,1338,'UTILITY',22,'lm',DPRINT_DIM);
  roundKey(P,2095,1392,26,st.quantize?[255,40,70]:[110,20,30]);inverse(P,2095,1438,'WAKE UP',16);
  /* FX FREQUENCY */
  dT(P,x,1486,'FX FREQUENCY',28);
  for(const [t,bx] of [['LOW',1840],['MID',1970],['HI',2100]]){const on=st.freq[t],b=[bx-50,1508,bx+50,1566];P.rrect([b[0]-3,b[1]-3,b[2]+3,b[3]+4],8,[2,2,3]);
    if(on)glowBox(P,b,[60,150,255],10,.85);P.gradient(b,on?[60,120,220]:[18,30,60],on?[30,70,170]:[10,18,40],6);P.rrect(b,6,null,on?[150,205,255]:[40,70,130],4);P.rrect([b[0]+8,b[1]+8,b[2]-8,b[3]-8],3,on?[30,64,150]:[10,16,34]);
    dT(P,bx,1538,t,26,'mm',on?[170,215,255]:[70,100,160],true);}
  /* FX type selector (positions and angles measured on the real mixer) */
  const types=[['DELAY',-146,1896.5,1777.5],['ECHO',-123.5,1881,1751],['PING PONG',-101,1847.5,1725],['SPIRAL',-77,1866.5,1696],['REVERB',-53,1871,1670],['TRANS',-30.5,1896.5,1643],['FILTER',-8,1929,1619],
    ['FLANGER',12.5,2015,1619],['PHASER',34,2054,1643],['PITCH',56,2066.5,1670],['SLIP ROLL',78,2092.5,1696],['ROLL',100,2070,1725],['VINYL BRAKE',121,2085,1751],['HELIX',144,2042.5,1777.5]];
  const fx=[1970,1711],fr=50;
  for(const [t,d,lx,ly] of types){const a=clk(d);P.line([[fx[0]+(fr+9)*Math.cos(a),fx[1]+(fr+9)*Math.sin(a)],[fx[0]+(fr+24)*Math.cos(a),fx[1]+(fr+24)*Math.sin(a)]],DPRINT,2.6);
    dT(P,lx,ly,t,t==='VINYL BRAKE'?22:24,'mm',DPRINT,t==='HELIX');}
  selKnob(P,fx[0],fx[1],fr,types.find(t=>t[0]===st.fxType)[1]);
  /* FX channel selector */
  const chs=[['B',-104,1888.5,1915],['A',-79,1887.5,1887.5],['MIC',-57,1889,1856],['1',-35,1925,1831.5],['2',-12,1955,1820],['3',11,1986,1820],['4',33,2014,1831.5],['MASTER',56,2074,1856]];
  const cs=[1972.5,1900],cr=52;dT(P,1844,1890,'CROSS',22,'mm',DPRINT,'cond');dT(P,1845,1910,'FADER',22,'mm',DPRINT,'cond');
  for(const [t,d,lx,ly] of chs){const a=clk(d);P.line([[cs[0]+(cr+9)*Math.cos(a),cs[1]+(cr+9)*Math.sin(a)],[cs[0]+(cr+24)*Math.cos(a),cs[1]+(cr+24)*Math.sin(a)]],DPRINT,2.6);dT(P,lx,ly,t,26);}
  selKnob(P,cs[0],cs[1],cr,chs.find(c=>c[0]===st.fxCh)[1]);
  dT(P,x,2018,'TIME',30);dKnob(P,'enc',1972,2098,53,0);
  dT(P,x,2238,'LEVEL / DEPTH',30);dScale(P,1972,2326,53,{gap:16});dKnob(P,'std',1972,2326,53,st.depth);dT(P,1918,2400,'MIN',24);dT(P,2028,2400,'MAX',24);
  dT(P,x,2444,'ON/OFF',30);bigBlue(P,1970,2540,62,st.fxOn);
  /* model line: the mixer's own name replaced by the site's, as on the CDJ */
  dT(P,1830,2658,'PROFESSIONAL MIXER',24,'rm');dT(P,1846,2654,'BOOTH CHECK',40,'lm',[232,234,238]);
}
function roundKey(P,cx,cy,r,dot){P.circle(cx,cy,r+8,[6,6,7],[64,64,70],2);P.dome(cx,cy,r,[18,18,20]);if(dot){P.glow(q=>{q.beginPath();q.arc(cx,cy,9,0,7);q.fill();},dot,6,.9);P.circle(cx,cy,8,mix(dot,[255,255,255],.2));}}
function bigBlue(P,cx,cy,r,on){const g=P.g;P.circle(cx,cy,r+14,[6,6,7]);P.circle(cx,cy,r+10,on?[30,70,170]:[16,26,52]);
  if(on)P.glow(q=>{q.beginPath();q.arc(cx,cy,r+8,0,7);q.fill();},[70,140,255],22,.9);
  const rg=g.createRadialGradient(cx-r*.2,cy-r*.25,r*.1,cx,cy,r);
  if(on){rg.addColorStop(0,'#d8f0ff');rg.addColorStop(.55,'#7fc0ff');rg.addColorStop(1,'#3a78e0');}else{rg.addColorStop(0,'#5a6a84');rg.addColorStop(.6,'#34405a');rg.addColorStop(1,'#1c2436');}
  g.beginPath();g.arc(cx,cy,r,0,7);g.fillStyle=rg;g.fill();}
/* OLED: same seven zones as the manual's drawing of the screen */
function oledD(P,box,st){
  const [x0,y0,x1,y1]=box,g=P.g,W=[236,240,246],w=x1-x0;P.rrect([x0-8,y0-8,x1+8,y1+8],3,[0,0,0],[70,72,78],2);
  const txt=(t,x,y,px,wt,al,col)=>{g.save();g.font=(wt||400)+' '+px+'px '+FACE_FONT;g.fillStyle=col?css(col):css(W);g.textAlign=al||'center';g.textBaseline='alphabetic';g.fillText(t,x,y);g.restore();};
  txt(st.fxType.replace(' ',''),(x0+x1)/2,y0+38,40);
  P.rrect([x0+8,y0+52,x0+58,y0+66],2,null,W,1.4);txt('AUTO',x0+33,y0+63,11);txt('QUANTIZE',x0+33,y0+80,10,400,'center',st.quantize?W:[70,72,76]);
  if(!(st.bpmLost&&!blinkOn()))txt(st.bpm==null?'---':String(st.bpm),x0+170,y0+86,42,300,'right');txt('BPM',x0+178,y0+84,17,400,'left');
  const by=y0+98,cw=w/3;P.rrect([x0,by,x1,by+40],0,null,W,1.6);
  for(let k=0;k<3;k++){const cx=x0+cw*(k+.5);if(k===1)P.rrect([x0+cw+3,by+3,x0+2*cw-3,by+37],0,W);if(k>0)P.line([[x0+cw*k,by+5],[x0+cw*k,by+35]],W,1.2);
    txt(st.beat[k],cx,by+32,30,k===1?700:400,'center',k===1?[0,0,0]:W);}
  txt('BEAT',(x0+x1)/2,by+52,10);
  const ty=by+66;P.line([[x0+4,ty],[x1-4,ty]],[90,92,96],1.4);for(let k=0;k<=8;k++){const tx=x0+4+(w-8)*k/8;P.line([[tx,ty-4],[tx,ty+2]],[90,92,96],1.2);}
  if(st.touch!=null){const tx=x0+4+(w-8)*st.touch;P.rrect([x0+4,ty-4,tx,ty+3],1,W);}
}
function dotFrame(P,b,col){const [x0,y0,x1,y1]=b,g=P.g;g.fillStyle=css(col);const step=6.5;
  for(const inset of [3,8.5,14]){const a0=x0+inset,a1=x1-inset,c0=y0+inset,c1=y1-inset;
    for(let x=a0;x<=a1+.1;x+=step){g.beginPath();g.arc(x,c0,1.5,0,7);g.arc(x,c1,1.5,0,7);g.fill();}
    for(let y=c0+step;y<c1-.1;y+=step){g.beginPath();g.arc(a0,y,1.5,0,7);g.arc(a1,y,1.5,0,7);g.fill();}}}
function xpadD(P,st){
  const b=[1796,988,2150,1196];P.rrect([b[0]-8,b[1]-8,b[2]+8,b[3]+8],10,[30,30,33],[90,90,96],2);P.gradient(b,[44,45,49],[20,20,22],8);P.rrect(b,8,null,[110,110,116],1.5);
  const labels=[['1/16','1/8','1/4','1/2'],['3/4','1','2','4']];
  labels.forEach((row,ri)=>row.forEach((t,k)=>{const cx=1849+k*86,cy=ri?1146:1037,c=[cx-38,cy-32,cx+38,cy+32];const on=st.pad===t;
    P.rrect(c,4,on?[60,62,68]:[22,22,24]);dotFrame(P,c,on?[255,255,255]:[200,202,208]);
    dT(P,cx,cy+1,t,38,'mm',[248,248,252]);}));
  /* touch strip between the rows */
  const ty=1092;P.rrect([1812,ty-8,2134,ty+8],8,[60,62,66]);dotField(P,[1834,ty-5,2112,ty+5],[150,152,158],[230,232,238,200],5,1);
  P.polygon([[1812,ty],[1830,ty-12],[1830,ty+12]],[230,232,238]);P.polygon([[2134,ty],[2116,ty-12],[2116,ty+12]],[230,232,238]);
}
