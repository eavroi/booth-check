/* ---------------- the controller map: the Hercules DJ Control Steel drawn after the top view of its manual (p. 6), the DDJ-400 after the top
   view of its MIDI list (p. 1), each control labelled with what it does now (template or learned); tabs show it alone, with SHIFT, or with Stop held.
   It floats over the booth like the keyboard map, and the control being touched lights up. Units: the manual drawing's. ---------------- */
const PSH={play:'PLAY',cue:'CUE',loop_in:'LOOP\nIN',loop_out:'LOOP\nOUT',reloop:'RELOOP',four_beat:'4/8\nBEAT',jump_rev:'JUMP ◀\n1/2X',jump_fwd:'JUMP ▶\n2X',
  hb1:'A / E',hb2:'B / F',hb3:'C / G',hb4:'D / H',bank:'BANK',call:'CALL/DEL',search_rev:'SEARCH ◀◀',search_fwd:'SEARCH ▶▶',track_rev:'TRACK ◀◀',track_fwd:'TRACK ▶▶',
  sync:'SYNC',player_master:'MASTER',tempo_reset:'T.RESET',tempo_range:'T.RANGE',master_tempo:'M.TEMPO',fn:'STOP',reverse:'REVERSE',slip:'SLIP',slip_rev:'SLIP REV',quantize:'QUANTIZE',jog_mode:'JOG MODE',
  nudge_rev:'BEND −',nudge_fwd:'BEND +',load:'LOAD',tempo:'TEMPO',jog:'JOG',trim:'TRIM',hi:'HI',mid:'MID',low:'LOW',fader:'FADER',color:'COLOR',ph_cue:'CUE\nCASQUE',
  kill_hi:'KILL HI',kill_mid:'KILL MID',kill_low:'KILL LOW',xfader:'CROSSFADER',master:'MASTER',balance:'BALANCE',mixing:'MIXING',ph_level:'LEVEL',param:'PARAMETER',fx_color:'COLOR',
  beatfx:'DEPTH',bfx_type:'FX TYPE',bfx_ch:'FX CH',bfx_depth:'DEPTH',bfx_time:'TIME',bfx_beat:'BEAT ◀▶',bfx_on:'BEAT FX\nON/OFF',bfx_tap:'TAP',bfx_beat_rev:'BEAT ◀',bfx_beat_fwd:'BEAT ▶',bfx_xpad:'X-PAD',bfx_autotap:'AUTO\nTAP',selector:'SÉLECTEUR',fx_side:'COLOR ↔',nav_up:'▲',nav_down:'▼',nav_back:'BACK',nav_push:'OK',jog_mode_all:'VINYL/CDJ',
  browse:'BROWSE',tag_list:'TAG LIST',info:'INFO',menu:'MENU',tag_track:'TAG',track_filter:'FILTER',short_cut:'SHORT\nCUT',
  call_rev:'CALL ◀\n1/2X',call_fwd:'CALL ▶\n2X',mem_delete:'DELETE',memory:'MEMORY',time_mode:'TIME\nMODE',shift:'SHIFT',jog_search:'SEARCH',cfx:'CFX',master_cue:'CUE',
  bfx_level:'LEVEL/DEPTH',bfx_next:'FX ▶',bfx_prev:'FX ◀',nav_turn:'SÉLECTEUR',nav_fast:'RAPIDE'};
const pshort=a=>{if(!a)return '';if(PSH[a])return PSH[a];let r=/^hot(del)?(\d)$/.exec(a);if(r)return (r[1]?'DEL ':'')+HL[+r[2]-1];r=/^bloop(\d)$/.exec(a);if(r)return fmtBeat(BLOOPS[+r[1]-1]);
  return a.startsWith('fx:')?a.slice(3).replace(' ','\n'):MACT[a]?tl(MACT[a].l):a;};
/* colour of a function: CDJ transport, loops, hot cues, the function key, the mixer, browsing, SOUND COLOR FX */
function pcat(a){
  if(!a)return 'off';if(a.startsWith('fx:')||a==='color'||a==='cfx'||a==='param'||a==='fx_color'||a==='beatfx'||a.startsWith('bfx_'))return 'fx';
  if(/^(loop_in|loop_out|reloop|four_beat|jump_rev|jump_fwd|call_rev|call_fwd|mem_delete|memory|bloop\d)$/.test(a))return 'loop';
  if(/^(hb\d|hot\d|hotdel\d|bank|call)$/.test(a))return 'hot';if(a==='fn'||a==='shift')return 'fn';
  if(MACT[a]&&(MACT[a].g==='chan'||MACT[a].g==='mix'))return 'mix';if(MACT[a]&&MACT[a].g==='nav'||/^(browse|tag_list|info|menu|tag_track|track_filter|load)$/.test(a))return 'nav';
  return 'play';
}
/* the drawing: b = button [x,y,w,h], k = knob [cx,cy,r], f = fader [x (axis), y0, y1, thumb y, horizontal], j = jog [cx,cy,r];
   c = the Steel's code (or codes) for that control, s = the code with SHIFT for the pads */
const STEEL_GEO=(function(){
  const G=[],M=423,b=(x,y,w,h,c,o)=>G.push({t:'b',x,y,w,h,c,...o}),k=(cx,cy,r,c,o)=>G.push({t:'k',cx,cy,r,c,...o});
  const side=(L)=>{
    const X=(x,w)=>L?x:M-x-(w||0),pc=L?0x01:0x19,ps=L?0x64:0x6A;
    const cols=L?[123.4,139.6]:[271,287.2];
    for(let ci=0;ci<2;ci++)for(let r=0;r<3;r++){const n=ci*3+r;b(cols[ci],[211.3,222.7,234.5][r],12.4,8.1,pc+n,{s:ps+n,pad:n+1});}
    b(cols[0],252,12.4,7.2,L?0x09:0x21);b(cols[1],252,12.4,7.2,L?0x0A:0x22);
    b(L?83.1:310.7,211.3,L?12.8:12.1,7.8,L?0x11:0x20);b(L?100.2:327.1,211.3,L?12.1:12.8,7.8,L?0x08:0x15);
    b(X(91.8,12),270.5,12,7.9,L?0x07:0x1F);
    G.push({t:'f',x:L?97:326,y0:225.5,y1:263,ty:245,w:17.6,c:L?0x31:0x3B});
    G.push({t:'j',cx:L?125.4:297.6,cy:301.6,r:27.2,c:L?0x2F:0x30});
    const bx=L?[96.5,118.9,141.4]:[268,290.5,312.9],bc=L?[0x0C,0x0D,0x0B]:[0x24,0x25,0x23];
    bx.forEach((x,i)=>b(x,334.6,13.6,8.9,bc[i]));
    b(X(127.4,13.1),187.2,13.1,9,null,{lab:'SHIFT',shift:1,id:L?'SHIFT gauche':'SHIFT droit'});
    k(L?150.4:272.6,191.2,5.6,L?0x33:0x3D);
    /* the mixer half of that side */
    [0x0E,0x0F,0x10].map(c=>L?c:c+0x18).forEach((c,i)=>b(X(162.3,12.4),[188.3,211.5,234.5][i],12.4,8.3,c));
    [0x34,0x35,0x36].map(c=>L?c:c+0x0A).forEach((c,i)=>k(L?186:237,[193.5,216.4,239.4][i],5.6,c));
    b(X(162.3,12.4),257.2,12.4,8.1,L?0x14:0x18);b(X(190,12.4),257.2,12.4,8.1,L?0x12:0x16);
    G.push({t:'f',x:L?179.2:243.8,y0:276,y1:318,ty:296,w:17.6,c:L?0x32:0x3C});
  };
  side(true);side(false);
  /* top left: the two endless Controls (their code changes with Apply Ctrl), Apply Ctrl and its 3 lights; top right: Monitor and Vol */
  k(90.7,189.4,5.6,[0x41,0x43,0x45],{ctl:1});k(116.2,189.4,5.6,[0x42,0x44,0x46],{ctl:2});
  b(89.1,199.1,7.9,5.6,null,{lab:'APPLY',apply:1,id:'Apply Ctrl'});
  k(306.8,189.4,5.6,0x3A);k(332.3,189.4,5.6,0x47);
  k(211.5,192.3,5.6,0x37);b(205.1,210.4,12.4,8.3,0x29);
  b(206.7,225,9.7,6.8,0x2A);b(196.6,234,8.5,7.2,0x2C);b(217.9,234,8.5,7.2,0x2D);b(206.7,242.3,9.7,7.5,0x2B);
  G.push({t:'f',x:211.5,y0:276,y1:318,ty:287,w:17.6,c:0x38});
  G.push({t:'f',x:211.5,y0:192,y1:231,ty:336,w:9,c:0x39,h:1});
  return G;
})();
/* the DDJ-400: b = key [centre x, y, w, h], r = round key, k = knob, f = fader, j = jog; k = its code(s), s = its code with SHIFT,
   pad = number of a pad (its code follows the pad mode). In the pixels of the list's picture, divided by DU; the right side is 797 px further */
const DU=4.4,DDJ_VIEW='11 45 281 150';
const DDJ_GEO=(function(){
  const G=[],q=v=>+(v/DU).toFixed(1),
    b=(x,y,w,h,o)=>G.push({t:'b',x:q(x-w/2),y:q(y-h/2),w:q(w),h:q(h),...o}),r=(x,y,R,o)=>G.push({t:'r',cx:q(x),cy:q(y),r:q(R),...o}),k=(x,y,R,o)=>G.push({t:'k',cx:q(x),cy:q(y),r:q(R),...o}),
    f=(x,y0,y1,ty,o)=>G.push({t:'f',x:q(x),y0:q(y0),y1:q(y1),ty:q(ty),w:17,...o});
  SIDES.forEach((s,ch)=>{
    const dx=ch*797,mx=ch*100,n=c=>'n'+ch+':'+hex2(c),c=c=>'c'+ch+':'+hex2(c),K=(a,e)=>({k:n(a),...(e?{s:n(e)}:{})});
    [[111,0x10,0x4C],[177,0x11,0x4E],[241,0x4D,0x50],[304,0x51,0x3E],[358,0x53,0x3D],[420,0x58,0x60]].forEach(([x,a,e])=>b(x+dx,272,52,38,K(a,e)));
    G.push({t:'j',cx:q(265+dx),cy:q(473),r:q(170),k:c(0x22),s:c(0x29),more:[c(0x23),c(0x21),n(0x36),n(0x67)]});
    b(113+dx,640,52,26,{k:n(0x3F),lab:'SHIFT'});
    r(113+dx,706,31,K(0x0C,0x48));r(113+dx,776,31,K(0x0B,0x47));
    /* the pad mode keys: the second line with SHIFT */
    [['hot','HOT CUE','KEYBOARD','kbd',0x1B,0x69],['loop','BEAT LOOP','PAD FX 1','fx',0x6D,0x1E],['jump','BEAT JUMP','PAD FX 2','fx2',0x20,0x6B],['samp','SAMPLER','KEY SHIFT','key',0x22,0x6F]].forEach(([m,l,ls,ms,a,e],i)=>
      b([183,239,295,351][i]+dx,677,50,20,{mode:m,lab:l,labs:ls,ms,side:s,k:n(a),more:[n(e)]}));
    for(let p=0;p<8;p++)b([182,238,295,351][p%4]+dx,p<4?731:785,50,46,{pad:p,side:s});
    f(421+dx,625,810,717,{k:c(0x00)});
    [[296,0x04],[355,0x07],[412,0x0B],[470,0x0F]].forEach(([y,a])=>k(617+mx,y,15,{k:c(a)}));
    k(617+mx,532,18,{k:'c6:'+hex2(0x17+ch)});
    b(617+mx,591,44,17,K(0x54,0x68));
    f(617+mx,632,748,690,{k:c(0x13)});
  });
  /* the middle */
  b(584,243,52,24,{k:'n6:46',s:'n6:68'});b(748,243,52,24,{k:'n6:47',s:'n6:7a'});k(666,240,17,{k:'c6:40',s:'c6:64',press:'n6:41',presss:'n6:42'});
  k(524,498,15,{k:'c6:0c'});k(524,590,15,{k:'c6:0d'});k(802,295,15,{k:'c6:08'});b(806,356,48,17,{k:'n6:63'});
  b(782,412,40,19,{k:'n4:4a',s:'n4:66'});b(830,412,40,19,{k:'n4:4b',s:'n4:6b'});b(806,473,56,19,{k:'n4:63',s:'n4:64'});
  b(806,532,70,19,{lab:'CH 1 · 2 · MASTER',k:'n4:10',more:['n4:11','n4:14']});k(803,596,15,{k:'c4:02'});r(806,688,24,{k:'n4:47'});
  G.push({t:'f',x:q(666),y0:q(610),y1:q(722),ty:q(800),w:9,k:'c6:1f',h:1});
  return G;
})();
const pkey=c=>'c0:'+c.toString(16).padStart(2,'0');
/* the light check: a click on the map answers which control is lit */
let PLAN_PICK=null;
const PVIEW='70 166 283 190';
/* the map shows one layer at a time, each control with one big label: what it does alone, with SHIFT, or with a Stop held */
let PLAN_LAYER='n',PLAN_TMP=null;
const planL=()=>PLAN_TMP||PLAN_LAYER;
const pT=(x,y,t,cl,sz,anc)=>'<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" class="'+cl+'"'+(sz?' font-size="'+sz.toFixed(2)+'"':'')+(anc?' text-anchor="'+anc+'"':'')+'>'+esc(t)+'</text>';
/* a label always fits its key, on one or two lines: the font shrinks for the long ones */
const pFit=(t,w,sz)=>Math.min(sz,w*1.72/Math.max(1,String(t).length));
const pInKey=(cx,cy,w,h,t,cl,sz)=>{const ls=String(t).split('\n'),s=Math.min(sz,...ls.map(x=>pFit(x,w-1,sz)),(h-1)/ls.length/1.05),lh=s*1.12;
  return ls.map((x,i)=>pT(cx,cy+s*.36+(i-(ls.length-1)/2)*lh,x,cl,s,'middle')).join('');};
const pTip=(b,bs,fn)=>{if(!b&&!bs)return say('Non relié','Not mapped');let t=b?midiBindLabel(b):'';if(b&&b.f)t+=' — '+(fn?'SHIFT : ':say('avec Stop : ','with Stop: '))+tl(MACT[b.f].l);if(bs)t+=' — SHIFT : '+midiBindLabel(bs);return t;};
/* the DDJ-400: Normal or SHIFT; the pads show the mode chosen on the controller (each side has its own) */
function ddjSvg(){
  const map=MIDI.cfg?MIDI.cfg.map:ddj400Map(),E=[],sh=planL()==='s',q=v=>+(v/DU).toFixed(1),T=pT,inKey=pInKey,tip=pTip;
  [[57,415],[475,383],[860,416]].forEach(([x,w],i)=>E.push('<rect class="'+(i===1?'p-mix':'p-body')+'" x="'+q(x)+'" y="'+q(208)+'" width="'+q(w)+'" height="'+q(637)+'" rx="2"/>'));
  E.push(T(q(535),q(330),'DDJ-400','p-brand',3.4,'middle'));
  for(const x of [652,676])E.push('<line x1="'+q(x)+'" x2="'+q(x)+'" y1="'+q(345)+'" y2="'+q(480)+'" class="p-slot"/>');
  for(const g of DDJ_GEO){
    const pad=g.pad!=null,m=pad?MIDI.padMode[g.side]:null,k=pad?ddjPad(g.side,m,g.pad,0):g.k,ks=pad?ddjPad(g.side,m,g.pad,1):g.s,b=map[k],bs=ks&&map[ks];
    /* with SHIFT: its own code, or for a knob its second function */
    let act=g.lab?null:sh?(bs?bs.a:ks||pad?null:b&&b.f||null):b&&b.a;if(act&&!MACT[act])act=null;
    const dk=pad?Object.keys(PAD_BASE).flatMap(x=>[ddjPad(g.side,x,g.pad,0),ddjPad(g.side,x,g.pad,1)]):[k,ks,g.press,g.presss,...(g.more||[])].filter(Boolean);
    const onMode=g.mode&&MIDI.padMode[g.side]===(sh?g.ms:g.mode),hwOn=g.lab&&(g.lab==='SHIFT'?sh:true);
    const cat=act?pcat(act):hwOn?'hw':'off',tc='p-t c-'+pcat(act),lab=pshort(act);
    const title=g.mode?say('Mode des pads : ','Pad mode: ')+g.lab+' — SHIFT : '+g.labs:g.lab==='SHIFT'?say('SHIFT : 2e fonction des boutons','SHIFT: second function of the keys'):tip(b,bs,1)+(g.press?' — '+say('appui : valider, SHIFT + appui : BACK','press: enter, SHIFT + press: BACK'):'');
    let h='<g class="p-c c-'+cat+(!act&&!hwOn?' p-dim':'')+(onMode?' p-star':'')+'" data-k="'+dk.join(' ')+'" data-id="'+esc(k||g.lab||'')+'" data-n="'+esc(b?midiBindLabel(b):g.lab||'')+'"><title>'+esc(title)+'</title>';
    if(g.t==='b'){const cx=g.x+g.w/2,cy=g.y+g.h/2;h+='<rect x="'+g.x+'" y="'+g.y+'" width="'+g.w+'" height="'+g.h+'" rx="1.2" class="p-key"/>';
      if(g.lab)h+=inKey(cx,cy,g.w,g.h,sh&&g.labs?g.labs:g.lab,'p-t',2.4);else if(lab)h+=inKey(cx,cy,g.w,g.h,lab,tc,2.9);}
    else if(g.t==='r'){h+='<circle cx="'+g.cx+'" cy="'+g.cy+'" r="'+g.r+'" class="p-key"/>';if(lab)h+=inKey(g.cx,g.cy,g.r*1.8,g.r*1.5,lab,tc,3);}
    else if(g.t==='k'){h+='<circle cx="'+g.cx+'" cy="'+g.cy+'" r="'+g.r+'" class="p-knob"/><line x1="'+g.cx+'" y1="'+(g.cy-g.r+.8).toFixed(1)+'" x2="'+g.cx+'" y2="'+(g.cy-1).toFixed(1)+'" class="p-tick"/>';
      if(lab)h+=T(g.cx,g.cy+g.r+3,lab,tc==='p-t c-play'?'p-t':tc,2.6,'middle');}
    else if(g.t==='f'){
      if(g.h)h+='<line x1="'+g.y0+'" x2="'+g.y1+'" y1="'+g.ty+'" y2="'+g.ty+'" class="p-slot"/><rect x="'+(g.x-2.4).toFixed(1)+'" y="'+(g.ty-4.5).toFixed(1)+'" width="4.8" height="9" rx=".8" class="p-key"/>'+(lab?T(g.x,g.ty-6.2,lab,'p-t p-lab',2.6,'middle'):'');
      else h+='<line x1="'+g.x+'" x2="'+g.x+'" y1="'+g.y0+'" y2="'+g.y1+'" class="p-slot"/><rect x="'+(g.x-g.w/2).toFixed(1)+'" y="'+(g.ty-3.6).toFixed(1)+'" width="'+g.w+'" height="7.2" rx="1" class="p-key"/>'+(lab?inKey(g.x,g.ty,g.w,7.2,lab,'p-t',2.8):'');}
    else if(g.t==='j'){h+='<circle cx="'+g.cx+'" cy="'+g.cy+'" r="'+g.r+'" class="p-jog"/><circle cx="'+g.cx+'" cy="'+g.cy+'" r="'+(g.r-5)+'" class="p-jogin"/>';
      if(lab)h+=T(g.cx,g.cy-3,lab,'p-t',5,'middle');
      if(!sh)h+=T(g.cx,g.cy+3,say('Dessus, VINYL : scratch','Top, VINYL: scratch'),'p-t p-sub',2.8,'middle')+T(g.cx,g.cy+7,say('Bord : pitch bend','Rim: pitch bend'),'p-t p-sub',2.8,'middle');}
    E.push(h+'</g>');
  }
  return '<svg viewBox="'+DDJ_VIEW+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+esc(say('Plan du DDJ-400','DDJ-400 map'))+'">'+E.join('')+'</svg>';
}
function planSvg(){
  const map=MIDI.cfg?MIDI.cfg.map:steelMap(),E=[],L=planL(),T=pT,inKey=pInKey,tip=pTip;
  /* the body: two dark wings and the lighter mixer panel in the middle */
  E.push('<path class="p-body" d="M76.3,175 Q76.3,169 82,169 L114,169 C119,169 119,173 124,173 L299,173 C304,173 304,169 309,169 L341,169 Q346.7,169 346.7,175 L346.7,343 Q346.7,350 340,350 L83,350 Q76.3,350 76.3,343 Z"/>');
  E.push('<rect class="p-mix" x="160" y="175.2" width="103" height="172" rx="2"/>');
  E.push(T(322,177,'DJ CONTROL STEEL','p-brand',2.6,'middle'));
  for(const g of STEEL_GEO){
    const codes=Array.isArray(g.c)?g.c:g.c!=null?[g.c]:[],keys=codes.map(pkey),b=keys.length?map[keys[0]]:null,bs=g.s!=null?map[pkey(g.s)]:null;
    const dk=keys.concat(g.s!=null?[pkey(g.s)]:[]).join(' ');
    /* what this control does on the layer shown */
    let act=null;if(L==='n')act=b&&b.a;else if(L==='s')act=bs&&bs.a;else act=b&&(b.a==='fn'?'fn':b.f);
    if(act&&!MACT[act])act=null;
    const hwOn=g.shift&&L==='s'||g.apply&&L!=='s';
    const cat=hwOn?'hw':pcat(act),off=!act&&!hwOn&&!g.ctl;
    const nm=g.id||(keys.length?(b?midiBindLabel(b):keys[0]):'');
    const title=g.shift?say('SHIFT : les pads 1-6 deviennent 7-12 (hot cues)','SHIFT: pads 1-6 become 7-12 (hot cues)'):g.apply?say('Apply Ctrl : Deck A = Controls 1 sur la platine gauche, Deck B = platine droite (Controls 2 = BEAT ◀ ▶), Select = BEAT FX (Controls 1 : effet, Stop + : canal ; Controls 2 : LEVEL/DEPTH, Stop + : TIME)','Apply Ctrl: Deck A = Controls 1 on the left player, Deck B = right player (Controls 2 = BEAT ◀ ▶), Select = BEAT FX (Controls 1: effect, Stop +: channel; Controls 2: LEVEL/DEPTH, Stop +: TIME)'):tip(b,bs);
    let h='<g class="p-c c-'+cat+(off?' p-dim':'')+(act==='bfx_on'?' p-star':'')+'" data-k="'+dk+'" data-id="'+esc(keys[0]||g.id||'')+'" data-n="'+esc(nm)+'"><title>'+esc(title)+'</title>';
    const lab=pshort(act),tc='p-t c-'+pcat(act);
    if(g.t==='b'){
      h+='<rect x="'+g.x+'" y="'+g.y+'" width="'+g.w+'" height="'+g.h+'" rx="1.2" class="p-key"/>';
      const cx=g.x+g.w/2,cy=g.y+g.h/2;
      if(g.lab)h+=inKey(cx,cy,g.w,g.h,g.lab,'p-t',2.6);
      /* Stop: alone it is MASTER TEMPO, held it gives the second functions */
      else if(b&&b.a==='fn')h+=L==='f'?inKey(cx,cy,g.w,g.h,say('STOP\ntenu','STOP\nheld'),'p-t c-fn',2.6):L==='n'?inKey(cx,cy,g.w,g.h,'STOP\nM.TEMPO','p-t',2.6):inKey(cx,cy,g.w,g.h,'STOP','p-t',2.4);
      else if(lab)h+=inKey(cx,cy,g.w,g.h,lab,tc,2.9);
    }else if(g.t==='k'){
      h+='<circle cx="'+g.cx+'" cy="'+g.cy+'" r="'+g.r+'" class="p-knob"/><line x1="'+g.cx+'" y1="'+(g.cy-g.r+1)+'" x2="'+g.cx+'" y2="'+(g.cy-1.5)+'" class="p-tick"/>';
      /* the two Controls: what they do with Apply Ctrl on a deck and on Select, above the knob */
      if(g.ctl){const bsel=keys[2]?map[keys[2]]:null;
        if(L==='n')h+=T(g.cx,g.cy-g.r-3.5,'Deck : '+pshort(b&&b.a),'p-t',2.2,'middle')+T(g.cx,g.cy-g.r-.9,'Select : '+pshort(bsel&&bsel.a),'p-t c-fx',2.2,'middle');
        else if(L==='f')h+=T(g.cx,g.cy-g.r-.9,'Select : '+pshort(bsel&&bsel.f),'p-t c-fx',2.2,'middle');}
      else if(lab)h+=T(g.cx,g.cy+g.r+3.2,lab,tc==='p-t c-play'?'p-t':tc,2.7,'middle');
    }else if(g.t==='f'){
      const big=lab;
      if(g.h){h+='<line x1="'+g.y0+'" x2="'+g.y1+'" y1="'+g.ty+'" y2="'+g.ty+'" class="p-slot"/><rect x="'+(g.x-2.4)+'" y="'+(g.ty-4.5)+'" width="4.8" height="9" rx=".8" class="p-key"/>'+(big?T(g.x,g.ty+8.6,big,'p-t p-lab',2.8,'middle'):'');}
      else{h+='<line x1="'+g.x+'" x2="'+g.x+'" y1="'+g.y0+'" y2="'+g.y1+'" class="p-slot"/><rect x="'+(g.x-g.w/2)+'" y="'+(g.ty-3.6)+'" width="'+g.w+'" height="7.2" rx="1" class="p-key"/>'+(big?inKey(g.x,g.ty,g.w,7.2,big,'p-t',2.8):'');}
    }else if(g.t==='j'){
      h+='<circle cx="'+g.cx+'" cy="'+g.cy+'" r="'+g.r+'" class="p-jog"/><circle cx="'+g.cx+'" cy="'+g.cy+'" r="'+(g.r-3)+'" class="p-jogin"/>';
      if(lab)h+=T(g.cx,g.cy-1,lab,'p-t',4,'middle')+T(g.cx,g.cy+4,say('VINYL : main posée','VINYL: hand on'),'p-t p-sub',2.5,'middle')+T(g.cx,g.cy+7.5,say('CDJ : pitch bend','CDJ: pitch bend'),'p-t p-sub',2.5,'middle');
    }
    E.push(h+'</g>');
  }
  /* Apply Ctrl's 3 lights */
  [[102.2,'A','Deck A'],[110.8,'SEL','Select'],[118.2,'B','Deck B']].forEach(([x,t,n])=>E.push('<g class="p-c c-hw" data-k="" data-id="led-'+n+'" data-n="'+esc(say('voyant ','light ')+n+' (Apply Ctrl)')+'"><title>'+esc(say('Voyant ','Light ')+n+' (Apply Ctrl)')+'</title><circle cx="'+x+'" cy="202" r="1.6" class="p-led"/></g>'+T(x,206.4,t,'p-t p-sub',1.8,'middle')));
  return '<svg viewBox="'+PVIEW+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+esc(say('Plan du Hercules DJ Control Steel','Hercules DJ Control Steel map'))+'">'+E.join('')+'</svg>';
}
const PLAN_TABS=[['n','Normal','Normal','Sans rien maintenir.','With nothing held.'],['s','SHIFT','SHIFT','Avec SHIFT : les pads deviennent les hot cues.','With SHIFT: the pads become the hot cues.'],
  ['f','Stop maintenu','Stop held','Stop maintenu, n’importe lequel des deux : 2e fonction de chaque commande. BEAT FX ON/OFF = pad en haut à gauche, il clignote quand l’effet marche.','Stop held, either one: the second function of each control. BEAT FX ON/OFF = top left pad, it blinks while the effect is on.']];
const DDJ_TABS=[['n','Normal','Normal','En test, pas encore essayé sur le vrai contrôleur. Les pads suivent le mode choisi sur le contrôleur.','In test, not tried on the real controller yet. The pads follow the mode chosen on the controller.'],
  ['s','SHIFT','SHIFT','Avec SHIFT : les fonctions imprimées sous les boutons, quand la CDJ ou la table les ont.','With SHIFT: the functions printed under the keys, when the CDJ or the mixer has them.']];
const DDJ_MODES=[['hot','HOT CUE'],['loop','BEAT LOOP'],['jump','BEAT JUMP'],['samp','SAMPLER'],['fx','PAD FX 1']];
function buildPlan(){
  const tp=MIDI.cfg?MIDI.cfg.tpl:'steel',steel=tp==='steel',ddj=!!MTPL[tp].plan,tabs=ddj?DDJ_TABS:PLAN_TABS,L=planL();
  $('planName').textContent=MIDI.port||tplName(ddj?tp:'steel');
  $('planTabs').hidden=!steel&&!ddj;$('planHint').hidden=!steel&&!ddj;
  if(steel||ddj){const t=tabs.find(x=>x[0]===L)||tabs[0];
    $('planTabs').innerHTML=tabs.map(x=>'<button type="button" data-l="'+x[0]+'" aria-pressed="'+(x===t)+'">'+esc(say(x[1],x[2]))+'</button>').join('')
      +(ddj?'<i></i>'+DDJ_MODES.map(x=>'<button type="button" data-m="'+x[0]+'" aria-pressed="'+(MIDI.padMode.L===x[0]&&MIDI.padMode.R===x[0])+'">'+esc(x[1])+'</button>').join(''):'');
    $('planHint').textContent=say(t[3],t[4]);}
  $('planBody').innerHTML=steel?planSvg():ddj?ddjSvg():'<p class="note">'+esc(say('Le plan dessiné existe pour le Hercules DJ Control Steel et le DDJ-400. Pour ce contrôleur, les correspondances sont dans le panneau Contrôleur.','The drawn map exists for the Hercules DJ Control Steel and the DDJ-400. For this controller, the mapping is in the Controller panel.'))+'</p>';
  const LEG=[['play',say('Platine','Player')],['loop',say('Boucles et sauts','Loops and jumps')],['hot','Hot cues'],['mix',say('Table','Mixer')],['fx',say('Effets','Effects')],['nav',say('Écran et navigation','Screen and browsing')]];
  $('planLeg').innerHTML=LEG.map(l=>'<span class="c-'+l[0]+'"><i></i>'+esc(l[1])+'</span>').join('');
}
/* a Stop or a SHIFT held on the controller shows its layer until it is let go */
function planFn(){const tp=MIDI.cfg&&MIDI.cfg.tpl,ddj=tp&&MTPL[tp].plan,t=MIDI.fn.L||MIDI.fn.R?(ddj?'s':'f'):null;if(t===PLAN_TMP)return;PLAN_TMP=t;if(!$('planPanel').hidden&&(!tp||tp==='steel'||ddj))buildPlan();}
/* the pad mode chosen on the controller */
function planMode(s,m){if(MIDI.padMode[s]===m)return;MIDI.padMode[s]=m;if(!$('planPanel').hidden&&MIDI.cfg&&MTPL[MIDI.cfg.tpl].plan)buildPlan();}
/* the control being touched lights up on the map */
function planHit(k,on){
  const p=$('planPanel');if(!p||p.hidden)return;
  for(const g of p.querySelectorAll('.p-c'))if(g.dataset.k.split(' ').includes(k)){g.classList.add('hit');clearTimeout(g._t);g._t=setTimeout(()=>g.classList.remove('hit'),on===false?60:260);}
}
function showPlan(on){const p=$('planPanel');$('planBody').classList.toggle('pick',!!PLAN_PICK||on&&MIDI.diag&&MIDI.diag.x&&MIDI.diag.on);if(on===!p.hidden)return;p.hidden=!on;if(on){buildPlan();placePlan();}}
function placePlan(x,y){const p=$('planPanel');let pos=null;try{pos=JSON.parse(localStorage.getItem('bc.planPos')||'null');}catch(e){}
  if(x==null){if(pos){x=pos[0];y=pos[1];}else{x=(window.innerWidth-p.offsetWidth)/2;y=Math.max(60,window.innerHeight-p.offsetHeight-24);}}
  x=clamp(x,8-p.offsetWidth+120,window.innerWidth-120);y=clamp(y,8,window.innerHeight-48);p.style.left=x+'px';p.style.top=y+'px';return [x,y];}
function wirePlan(){
  const h=$('planHead');let st=null;
  sizeWin('planPanel','bc.planW',1040,480,1500);
  $('pClose').onclick=()=>showPlan(false);
  $('planTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.m){MIDI.padMode.L=MIDI.padMode.R=b.dataset.m;buildPlan();return;}PLAN_LAYER=b.dataset.l;PLAN_TMP=null;buildPlan();});
  $('planBody').addEventListener('click',e=>{const g=e.target.closest('.p-c');if(PLAN_PICK&&g){PLAN_PICK(g.dataset.id||'?',g.dataset.n||'?');planHit(g.dataset.k.split(' ')[0]||'');}});
  h.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const p=$('planPanel'),r=p.getBoundingClientRect();st={dx:e.clientX-r.left,dy:e.clientY-r.top};h.setPointerCapture(e.pointerId);e.preventDefault();});
  h.addEventListener('pointermove',e=>{if(st)placePlan(e.clientX-st.dx,e.clientY-st.dy);});
  const up=()=>{if(!st)return;st=null;const p=$('planPanel');try{localStorage.setItem('bc.planPos',JSON.stringify([parseFloat(p.style.left),parseFloat(p.style.top)]));}catch(_){}};
  h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);
  window.addEventListener('resize',()=>{if(!$('planPanel').hidden){const p=$('planPanel');placePlan(parseFloat(p.style.left),parseFloat(p.style.top));}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('planPanel').hidden)showPlan(false);});
}
