/* ---------------- deck face layout ----------------
   Started from the "Pioneer CDJ & XDJ Emulator" project (app/layout.py, GPL-2.0-or-later), then re-measured
   on a top view of the real CDJ-2000NXS2. Units: a 924 x 1196 grid, the top panel seen from above.
   Side columns are both 128 wide; every column control is centred on its column. */
const FW=924,FH=1196;
const LC=64,RC=860;                      /* centre lines of the left and right columns */
const COL_TOP=50,BASE_Y=1178.6,BASE_B=1195,LIP_Y=1166.4,LIP_B=1182.7,LIP_X0=202.7,LIP_X1=721.3;
/* bottom slopes: from the outer bottom (x0,BASE_B) up to the top edge of the lowered centre */
const SLOPE_K=.645;
const slopeX=(x0,y,dir)=>x0+dir*(BASE_B-y)*SLOPE_K;
const F_LCD=[246,110,678,369],F_BEZEL=[230,92,694,385];
const F_TOP_BLOCK=[128,0,796,398];
const F_JOG=[462,779,308],F_JOG_RIM=252,F_JOG_TOP=245,F_JOG_DISPLAY=113;
const F_SELECT=[745,189,30],SEL_COLLAR=54,SEL_RING=36,F_SELECT_PANEL=[697,92,796,284];
const F_SLIDER=[RC,805.9,1093.6],SL_ZERO=949.75,SL_TRAVEL=124,F_SLIDER_FRAME=[830,770,890,1127];
const C_LIME=[176,255,40],C_BLUE=[60,130,255],C_GREEN=[40,235,90],C_ORANGE=[255,120,30],C_AMBER=[255,160,40],
  C_RED=[255,30,30],C_CYAN=[70,220,255],C_YELLOW=[240,235,40],C_WHITE=[235,240,255],C_PALE_CYAN=[205,240,255];
const F_USB_PORT=[13,68,74,124];
const F_SD_SLOT=[13,177,115,234];
/* the deck outline: square top block, side columns from y=50 with small outer corners, base band and centre lip */
/* the deck outline (seen from above): the screen block on top with rounded top corners, the two side columns with
   rounded outer corners (square where they meet the centre), the base band, raised in the middle */
function silPath(g,inset){
  inset=inset||0;g.save();if(inset){const k=1-2*inset/FW;g.translate(FW/2,FH/2);g.scale(k,1-2*inset/FH);g.translate(-FW/2,-FH/2);}
  const r=9,rb=9,t=8,xa=slopeX(LIP_X0,LIP_B,1),xb=slopeX(LIP_X1,LIP_B,-1);g.beginPath();g.moveTo(128+t,0);g.lineTo(796-t,0);g.arcTo(796,0,796,t,t);g.lineTo(796,COL_TOP);g.lineTo(FW-r,COL_TOP);g.arcTo(FW,COL_TOP,FW,COL_TOP+r,r);
  g.lineTo(FW,BASE_B-rb);g.arcTo(FW,BASE_B,FW-rb,BASE_B,rb);g.lineTo(LIP_X1,BASE_B);g.lineTo(xb,LIP_B);g.lineTo(xa,LIP_B);g.lineTo(LIP_X0,BASE_B);
  g.lineTo(rb,BASE_B);g.arcTo(0,BASE_B,0,BASE_B-rb,rb);g.lineTo(0,COL_TOP+r);g.arcTo(0,COL_TOP,r,COL_TOP,r);
  g.lineTo(128,COL_TOP);g.lineTo(128,t);g.arcTo(128,0,128+t,0,t);g.closePath();g.restore();}
/* the boundary between the screen block and the right column: a small angular step out beside the selector */
function bulgePath(g){g.lineTo(795.5,132);g.lineTo(809.5,147);g.lineTo(809.5,233);g.lineTo(795.5,248);}
function K(name,kind,o){return Object.assign({name,kind,color:C_LIME,font:10,label:'',symbol:''},o);}
const padKey=(l,y,color)=>K('hot_cue_'+l,'pad',{box:[LC-33,y-18,LC+33,y+18],color,pad:'abcd'.indexOf(l)});
/* the four keys around the rotary selector: their inner edge follows the selector collar */
/* outer edge of the top pair / bottom pair: a gentle arc (big circle), inner edge hidden under the collar */
const SEG=[[705,97,742,170],[748,97,785,170],[705,208,742,281],[748,208,785,281]],SEG_ARC=170;
const F_KEYS=[
  K('usb_stop','cdome',{circle:[95,136,13]}),
  K('usb_indicator','port',{box:F_USB_PORT,color:C_PALE_CYAN,deco:true}),
  padKey('a',316,C_RED),padKey('b',388,C_CYAN),padKey('c',461,C_YELLOW),padKey('d',533,C_BLUE),
  K('bank_rev','ring',{circle:[LC-38,605,13],dot:C_BLUE}),
  K('hot_cue_call','sq',{box:[LC-10,593,LC+10,617]}),
  K('bank_fwd','ring',{circle:[LC+38,605,13],dot:C_BLUE}),
  K('reverse','lever',{box:[LC-39,663,LC+9,717]}),
  K('track_rev','chrome',{circle:[LC-29,797,22],symbol:'track_rev'}),
  K('track_fwd','chrome',{circle:[LC+29,797,22],symbol:'track_fwd'}),
  K('scan_rev','chrome',{circle:[LC-29,874,22],symbol:'scan_rev'}),
  K('scan_fwd','chrome',{circle:[LC+29,874,22],symbol:'scan_fwd'}),
  K('cue','big',{circle:[LC,985,50],label:'CUE',color:C_ORANGE,font:12}),
  K('play','big',{circle:[LC,1116,50],symbol:'play',color:C_GREEN}),
  K('pc','src',{box:[157,52,199,72],label:'PC',color:C_WHITE,font:9,always:true}),
  K('link','src',{box:[157,95,199,116],label:'LINK',color:C_BLUE}),
  K('usb','src',{box:[157,137,199,158],label:'USB'}),
  K('sd','src',{box:[157,180,199,201],label:'SD'}),
  K('disc','src',{box:[157,222,199,243],label:'DISC'}),
  K('time_mode','dome',{circle:[179,290,11]}),
  K('quantize','dome',{circle:[179,343,11],dot:C_RED}),
  K('browse','top',{box:[265,52,348,72],label:'BROWSE'}),
  K('tag_list','top',{box:[368,52,452,72],label:'TAG LIST'}),
  K('info','top',{box:[470,52,555,72],label:'INFO'}),
  K('menu','top',{box:[573,52,658,72],label:'MENU'}),
  K('back','seg',{box:SEG[0],q:0}),
  K('tag_track','seg',{box:SEG[1],q:1}),
  K('track_filter','seg',{box:SEG[2],q:2}),
  K('short_cut','seg',{box:SEG[3],q:3}),
  K('eject','eject',{circle:[RC,157,27],color:C_LIME}),
  K('jog_mode','jm',{box:[RC+4,488,RC+44,520],label:'JOG\nMODE',font:9,color:C_WHITE}),
  K('sync','plate',{circle:[RC-29,597,23],label:'SYNC',color:C_WHITE,font:8}),
  K('master','plate',{circle:[RC+29,597,23],label:'MASTER',color:C_ORANGE,font:7}),
  K('tempo_range','cbtn',{circle:[RC,667,12]}),
  K('master_tempo','cbtn',{circle:[RC,735,12],dot:C_RED}),
  K('tempo_reset','dome',{circle:[764,947,13]}),
  K('loop_in','loop',{circle:[169,447,18],color:C_ORANGE}),
  K('loop_out','loop',{circle:[244,447,18],color:C_ORANGE}),
  K('reloop','reloop',{circle:[331,447,15],dot:C_ORANGE}),
  K('four_beat','pale',{circle:[169,519,11.5]}),
  K('slip','ring',{circle:[169,575,10.5],dot:C_RED}),
  K('call_rev','call',{circle:[598,450,12],symbol:'left'}),
  K('call_fwd','call',{circle:[650,450,12],symbol:'right'}),
  K('delete','ring',{circle:[712,450,17],big:true}),
  K('memory','ring',{circle:[764,450,12]}),
];
const TX=(x,y,text,size,anchor,bold)=>({x,y,text,size:size||9,anchor:anchor||'mm',bold:bold==='cond'?'cond':!!bold});
const TF_PX=8.6;
const F_TEXTS=[
  TX(43,134,'5V ⎓ 2.1A',7.5),TX(95,101,'USB',9),TX(95,112,'STOP',9),TX(LC+4,251,'SD',10,'lm'),TX(LC,290,'HOT  CUE',10),
  ...[316,388,461,533].map((y,i)=>TX(LC-42,y,'ABCD'[i],9)),...[316,388,461,533].map((y,i)=>TX(LC+42,y,'EFGH'[i],9)),
  TX(LC+3,577,'CALL /',8,'rm'),TX(LC,629,'BANK',9),TX(LC,652,'DIRECTION',9),TX(LC+38,668,'SLIP',8.5),TX(LC+38,677,'REV',8.5),TX(LC+38,692,'FWD',8.5),
  TX(LC,764,'TRACK  SEARCH',9),TX(LC,841,'SEARCH',9),TX(LC,1056,'PLAY / PAUSE',9),
  TX(149,288,'TIME',8),TX(149,297,'MODE',8),TX(210,288,'AUTO',8),TX(210,297,'CUE',8),TX(179,361,'QUANTIZE',8),
  TX(296,40,'SEARCH',9,'lm'),TX(496,40,'LINK INFO',9,'lm'),TX(601,40,'UTILITY',9,'lm'),
  TX(724,85,'BACK',8.5),TX(766,75,'TAG TRACK',8.5),TX(766,85,'/ REMOVE',8.5),
  TX(703.4,290.4,'TRACK FILTER',TF_PX,'lm','cond'),TX(720.2,297.6,'EDIT',TF_PX,'lm','cond'),TX(769.7,290.4,'SHORT',TF_PX,'mm','cond'),TX(769.7,297.6,'CUT',TF_PX,'mm','cond'),
  TX(745,343,'MP3/AAC/WAV',8.5),TX(745,355,'AIFF/FLAC/ALAC',8.5),
  TX(RC,86,'STANDBY',7),TX(RC,114,'DISC EJECT',9),TX(RC,286,'VINYL',9.5),TX(RC,296,'SPEED ADJUST',9.5),
  TX(RC,311,'TOUCH / BRAKE',8),TX(RC,399,'RELEASE / START',8),
  TX(RC,550,'BEAT SYNC',9.5),TX(RC+8,564,'INST. DOUBLES',8.5),TX(RC,632,'TEMPO',9.5),TX(RC,643,'±6 / ±10 / ±16 / WIDE',7),
  TX(RC,703,'MASTER',9.5),TX(RC,713,'TEMPO',9.5),TX(RC,1112,'TEMPO',9),TX(764,973,'TEMPO',7.5),TX(764,982,'RESET',7.5),
  TX(820,805.4,'–',10),TX(820,949.75,'0',9),TX(820,1093.4,'+',10),
  TX(169,415,'IN/CUE',9.5),TX(244,415,'OUT',9.5),TX(289,434,'LOOP',9.5),TX(331,415,'RELOOP/EXIT',9.5),
  TX(160,497,'4 /',8.5,'rm'),TX(183,497,'8BEAT',8.5,'lm'),TX(169,557,'SLIP',9.5),TX(624,413,'CUE/LOOP',9.5),TX(624,427,'CALL',9.5),
  TX(588,470,'1/2X',7.5),TX(660,470,'2X',7.5),TX(712,413,'DELETE',9.5),TX(764,413,'MEMORY',9.5),
  TX(724,489,'JOG ADJUST',9.5),TX(690,555,'LIGHT',6),TX(759,555,'HEAVY',6),
  TX(230,1028,'–',9),TX(230,1039,'REV',8.5),TX(694,1028,'+',9),TX(694,1039,'FWD',8.5),
  TX(RC,1147,'MULTI PLAYER',8.5),TX(RC,1162,'BOOTH CHECK',13),
];
const F_PILLS=[[169,481,'IN ADJUST'],[244,481,'OUT ADJUST'],[169,543,'LOOP CUTTER'],[624,470,'LOOP']];
const F_BADGES=[[RC-31,494,'VINYL',C_BLUE,'vinyl'],[RC-31,514,'CDJ',C_LIME,'cdj'],[LC+38,711,'REV',C_RED,'rev']];
const F_RECESSES=[[['bank_rev','hot_cue_call','bank_fwd'],4],[['track_rev','track_fwd'],5],[['scan_rev','scan_fwd'],5],[['sync','master'],5]];
const F_FRAMES=[[LC+27,577,'DELETE']];
const F_KNOBS=[['vinyl',RC,342,19,'touch_brake'],['vinyl',RC,433,19,'release_start'],['jog_adjust',724,527,18,'jog_adjust']];
const F_LINES=[
  [[193,447],[220,447]],[[268,447],[308,447]],[[614,450],[634,450]],[[666,450],[684,450]],[[741,450],[748,450]],
  [[RC-46,567],[RC-46,560],[RC-38,560]],[[164,497],[180,497]],
  [[LC-42,622],[LC-42,629],[LC-14,629]],[[LC+14,629],[LC+42,629],[LC+42,622]],
  [[179,73],[179,94]],[[179,117],[179,136]],[[179,159],[179,179]],[[179,202],[179,221]],
  [[283,40],[292,40]],[[483,40],[492,40]],[[588,40],[597,40]],[[710.6,297.6],[717.6,297.6]],
  [[LC-42,334],[LC-42,370]],[[LC-42,406],[LC-42,443]],[[LC-42,479],[LC-42,515]],[[LC-42,551],[LC-42,566]],
  [[LC+42,334],[LC+42,370]],[[LC+42,406],[LC+42,443]],[[LC+42,479],[LC+42,515]],[[LC+42,551],[LC+42,566]],
  /* step icons of the VINYL SPEED ADJUST knobs */
  [[RC-46,372],[RC-38,372],[RC-38,383],[RC-28,383]],[[RC+28,372],[RC+34,372],[RC+41,383],[RC+46,383]],
  [[RC-46,473],[RC-38,473],[RC-38,462],[RC-28,462]],[[RC+28,473],[RC+34,473],[RC+41,462],[RC+46,462]],
];
const F_LIGHT=[160,410,320,210];
function keyBounds(k){if(k.box)return k.box;const [cx,cy,r]=k.circle;return [cx-r,cy-r,cx+r,cy+r];}
function keyHit(k,x,y){if(k.circle){const [cx,cy,r]=k.circle;return (x-cx)**2+(y-cy)**2<=(r+3)**2;}const [x0,y0,x1,y1]=k.box;return x>=x0-2&&x<=x1+2&&y>=y0-2&&y<=y1+2;}
function recessBox(names,m){const b=F_KEYS.filter(k=>names.includes(k.name)).map(keyBounds);return [Math.min(...b.map(v=>v[0]))-m,Math.min(...b.map(v=>v[1]))-m,Math.max(...b.map(v=>v[2]))+m,Math.max(...b.map(v=>v[3]))+m];}
