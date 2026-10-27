/* ---------------- the controller map: the Hercules DJ Control Steel drawn after the top view of its manual (p. 6),
   each control labelled with what it does now (template or learned), its function with Stop held and, for the pads, with SHIFT.
   It floats over the booth like the keyboard map, and the control being touched lights up. Units: the manual drawing's. ---------------- */
const PSH={play:'PLAY',cue:'CUE',loop_in:'LOOP IN',loop_out:'LOOP OUT',reloop:'RELOOP',four_beat:'4/8 BEAT',jump_rev:'JUMP◀ ½X',jump_fwd:'JUMP▶ 2X',
  hb1:'A / E',hb2:'B / F',hb3:'C / G',hb4:'D / H',bank:'BANK',call:'CALL/DEL',search_rev:'SEARCH ◀◀',search_fwd:'SEARCH ▶▶',track_rev:'TRACK ◀◀',track_fwd:'TRACK ▶▶',
  sync:'SYNC',player_master:'MASTER',tempo_reset:'T.RESET',tempo_range:'T.RANGE',master_tempo:'M.TEMPO',fn:'ALT',reverse:'REVERSE',slip:'SLIP',slip_rev:'SLIP REV',quantize:'QUANTIZE',jog_mode:'JOG MODE',
  nudge_rev:'BEND −',nudge_fwd:'BEND +',load:'LOAD',tempo:'TEMPO',jog:'JOG',trim:'TRIM',hi:'HI',mid:'MID',low:'LOW',fader:'FADER',color:'COLOR',ph_cue:'CUE',
  kill_hi:'KILL HI',kill_mid:'KILL MID',kill_low:'KILL LOW',xfader:'CROSSFADER',master:'MASTER',balance:'BALANCE',mixing:'MIXING',ph_level:'LEVEL',param:'PARAMETER',fx_color:'COLOR',
  beatfx:'BEAT FX',selector:'SÉLECTEUR',fx_side:'COLOR ↔',nav_up:'▲',nav_down:'▼',nav_back:'BACK',nav_push:'OK',jog_mode_all:'VINYL/CDJ',
  browse:'BROWSE',tag_list:'TAG LIST',info:'INFO',menu:'MENU',tag_track:'TAG',track_filter:'FILTER',short_cut:'SHORT CUT'};
const pshort=a=>a?(PSH[a]||(a.startsWith('fx:')?a.slice(3):MACT[a]?tl(MACT[a].l):a)):'';
/* colour of a function: CDJ transport, loops, hot cues, the function key, the mixer, browsing, SOUND COLOR FX */
function pcat(a){
  if(!a)return 'off';if(a.startsWith('fx:')||a==='color'||a==='param'||a==='fx_color'||a==='beatfx')return 'fx';
  if(/^(loop_in|loop_out|reloop|four_beat|jump_rev|jump_fwd)$/.test(a))return 'loop';
  if(/^(hb\d|hot\d|bank|call)$/.test(a))return 'hot';if(a==='fn')return 'fn';
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
const pkey=c=>'c0:'+c.toString(16).padStart(2,'0');
/* the light check: a click on the map answers which control is lit */
let PLAN_PICK=null;
const PVIEW='70 166 283 190';
function planSvg(){
  const map=MIDI.cfg?MIDI.cfg.map:steelMap(),E=[];
  const T=(x,y,t,cl,sz,anc)=>'<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" class="'+cl+'"'+(sz?' font-size="'+sz+'"':'')+(anc?' text-anchor="'+anc+'"':'')+'>'+esc(t)+'</text>';
  const lab=(b)=>b?pshort(b.a):'';
  /* a label always fits its key: the font shrinks for the long ones */
  const fit=(t,w,sz)=>Math.min(sz,w*1.72/Math.max(1,String(t).length));
  const tip=(b,bs)=>{if(!b&&!bs)return say('Non relié','Not mapped');let t=b?midiBindLabel(b):'';if(b&&b.f)t+=' — '+say('avec Stop (ALT) : ','with Stop (ALT): ')+tl(MACT[b.f].l);if(bs)t+=' — SHIFT : '+midiBindLabel(bs);return t;};
  /* the body: two dark wings and the lighter mixer panel in the middle */
  E.push('<path class="p-body" d="M76.3,175 Q76.3,169 82,169 L114,169 C119,169 119,173 124,173 L299,173 C304,173 304,169 309,169 L341,169 Q346.7,169 346.7,175 L346.7,343 Q346.7,350 340,350 L83,350 Q76.3,350 76.3,343 Z"/>');
  E.push('<rect class="p-mix" x="160" y="175.2" width="103" height="172" rx="2"/>');
  E.push(T(99,175.6,'Hercules','p-brand',3.6,'middle')+T(322,177,'DJ CONTROL STEEL','p-brand',2.6,'middle'));
  for(const g of STEEL_GEO){
    const codes=Array.isArray(g.c)?g.c:g.c!=null?[g.c]:[],keys=codes.map(pkey),b=keys.length?map[keys[0]]:null,bs=g.s!=null?map[pkey(g.s)]:null;
    const dk=keys.concat(g.s!=null?[pkey(g.s)]:[]).join(' ');
    const cat=g.shift||g.apply?'hw':pcat(b&&b.a);
    const nm=g.id||(keys.length?(b?midiBindLabel(b):keys[0]):'');
    let h='<g class="p-c c-'+cat+'" data-k="'+dk+'" data-id="'+esc(keys[0]||g.id||'')+'" data-n="'+esc(nm)+'"><title>'+esc(g.shift?say('SHIFT : les pads 1-6 deviennent 7-12 (hot cues)','SHIFT: pads 1-6 become 7-12 (hot cues)'):g.apply?say('Apply Ctrl : Deck A = Controls 1 sur la platine gauche, Deck B = platine droite, Select = BEAT FX (V2.9)','Apply Ctrl: Deck A = Controls 1 on the left player, Deck B = right player, Select = BEAT FX (V2.9)'):g.ctl?tip(b)+' — '+say('Apply Ctrl Deck A : platine gauche ; Deck B : platine droite ; Select : BEAT FX (V2.9)','Apply Ctrl Deck A: left player; Deck B: right player; Select: BEAT FX (V2.9)'):tip(b,bs))+'</title>';
    if(g.t==='b'){
      h+='<rect x="'+g.x+'" y="'+g.y+'" width="'+g.w+'" height="'+g.h+'" rx="1.2" class="p-key"/>';
      const cx=g.x+g.w/2;
      if(g.pad){h+='<line x1="'+(g.x+.8)+'" x2="'+(g.x+g.w-.8)+'" y1="'+(g.y+g.h/2)+'" y2="'+(g.y+g.h/2)+'" class="p-sep"/>'+T(cx,g.y+3.2,lab(b),'p-t c-'+pcat(b&&b.a),fit(lab(b),g.w,2.15),'middle')+T(cx,g.y+g.h-1.1,lab(bs),'p-t c-'+pcat(bs&&bs.a),fit(lab(bs),g.w,2.15),'middle');}
      else if(g.lab)h+=T(cx,g.y+g.h/2+.9,g.lab,'p-t',2.3,'middle');
      /* Stop: the ALT key, MASTER TEMPO when pressed alone */
      else if(b&&b.a==='fn')h+=T(cx,g.y+g.h/2-.3,'ALT','p-t',2.4,'middle')+T(cx,g.y+g.h-1.1,say('seul : M.TEMPO','alone: M.TEMPO'),'p-t',fit(say('seul : M.TEMPO','alone: M.TEMPO'),g.w,1.8),'middle');
      else{const f=b&&b.f;h+=T(cx,g.y+(f?g.h/2-.3:g.h/2+.9),lab(b),'p-t',fit(lab(b),g.w,f?2.2:2.4),'middle');if(f)h+=T(cx,g.y+g.h-1.1,'■ '+pshort(f),'p-t c-fn',fit('■ '+pshort(f),g.w,1.95),'middle');}
    }else if(g.t==='k'){
      h+='<circle cx="'+g.cx+'" cy="'+g.cy+'" r="'+g.r+'" class="p-knob"/><line x1="'+g.cx+'" y1="'+(g.cy-g.r+1)+'" x2="'+g.cx+'" y2="'+(g.cy-1.5)+'" class="p-tick"/>';
      /* the two Controls: label above (Apply Ctrl and its lights sit just below) */
      h+=g.ctl?T(g.cx,g.cy-g.r-1.3,pshort(b&&b.a),'p-t p-lab',2.2,'middle'):T(g.cx,g.cy+g.r+3,lab(b),'p-t p-lab',2.3,'middle');
      if(!g.ctl&&b&&b.f)h+=T(g.cx,g.cy+g.r+5.6,'■ '+pshort(b.f),'p-t c-fn',1.9,'middle');
    }else if(g.t==='f'){
      if(g.h){h+='<line x1="'+g.y0+'" x2="'+g.y1+'" y1="'+g.ty+'" y2="'+g.ty+'" class="p-slot"/><rect x="'+(g.x-2.4)+'" y="'+(g.ty-4.5)+'" width="4.8" height="9" rx=".8" class="p-key"/>'+T(g.x,g.ty+8,lab(b),'p-t p-lab',2.3,'middle');}
      else{h+='<line x1="'+g.x+'" x2="'+g.x+'" y1="'+g.y0+'" y2="'+g.y1+'" class="p-slot"/><rect x="'+(g.x-g.w/2)+'" y="'+(g.ty-3.6)+'" width="'+g.w+'" height="7.2" rx="1" class="p-key"/>'+T(g.x,g.ty+.9,lab(b),'p-t',2.3,'middle');}
    }else if(g.t==='j'){
      h+='<circle cx="'+g.cx+'" cy="'+g.cy+'" r="'+g.r+'" class="p-jog"/><circle cx="'+g.cx+'" cy="'+g.cy+'" r="'+(g.r-3)+'" class="p-jogin"/>';
      h+=T(g.cx,g.cy-1,lab(b),'p-t',3.4,'middle')+T(g.cx,g.cy+4,say('VINYL : main posée · CDJ : pitch bend','VINYL: hand on · CDJ: pitch bend'),'p-t p-sub',1.9,'middle')+T(g.cx,g.cy+7.5,say('▲/▼ maintenu : défilement rapide','▲/▼ held: fast scroll'),'p-t p-sub',1.9,'middle');
    }
    E.push(h+'</g>');
  }
  /* Apply Ctrl's 3 lights */
  [[102.2,'A','Deck A'],[110.8,'SEL','Select'],[118.2,'B','Deck B']].forEach(([x,t,n])=>E.push('<g class="p-c c-hw" data-k="" data-id="led-'+n+'" data-n="'+esc(say('voyant ','light ')+n+' (Apply Ctrl)')+'"><title>'+esc(say('Voyant ','Light ')+n+' (Apply Ctrl)')+'</title><circle cx="'+x+'" cy="202" r="1.6" class="p-led"/></g>'+T(x,206.4,t,'p-t p-sub',1.6,'middle')));
  return '<svg viewBox="'+PVIEW+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+esc(say('Plan du Hercules DJ Control Steel','Hercules DJ Control Steel map'))+'">'+E.join('')+'</svg>';
}
function buildPlan(){
  const tp=MIDI.cfg?MIDI.cfg.tpl:'steel';
  $('planName').textContent=MIDI.port||tplName('steel');
  $('planBody').innerHTML=tp==='steel'?planSvg():'<p class="note">'+esc(say('Le plan dessiné existe pour le Hercules DJ Control Steel. Pour ce contrôleur, les correspondances sont dans le panneau Contrôleur.','The drawn map exists for the Hercules DJ Control Steel. For this controller, the mapping is in the Controller panel.'))+'</p>';
  const LEG=[['play',say('Platine','Player')],['loop',say('Boucles et sauts','Loops and jumps')],['hot',say('Hot cues (avec SHIFT)','Hot cues (with SHIFT)')],['fn',say('■ = maintenir Stop (ALT)','■ = hold Stop (ALT)')],['mix',say('Table','Mixer')],['fx','SOUND COLOR FX'],['nav',say('Écran et navigation','Screen and browsing')]];
  $('planLeg').innerHTML=LEG.map(l=>'<span class="c-'+l[0]+'"><i></i>'+esc(l[1])+'</span>').join('');
}
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
  sizeWin('planPanel','bc.planW',860,480,1500);
  $('pClose').onclick=()=>showPlan(false);
  $('planBody').addEventListener('click',e=>{const g=e.target.closest('.p-c');if(PLAN_PICK&&g){PLAN_PICK(g.dataset.id||'?',g.dataset.n||'?');planHit(g.dataset.k.split(' ')[0]||'');}});
  h.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const p=$('planPanel'),r=p.getBoundingClientRect();st={dx:e.clientX-r.left,dy:e.clientY-r.top};h.setPointerCapture(e.pointerId);e.preventDefault();});
  h.addEventListener('pointermove',e=>{if(st)placePlan(e.clientX-st.dx,e.clientY-st.dy);});
  const up=()=>{if(!st)return;st=null;const p=$('planPanel');try{localStorage.setItem('bc.planPos',JSON.stringify([parseFloat(p.style.left),parseFloat(p.style.top)]));}catch(_){}};
  h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);
  window.addEventListener('resize',()=>{if(!$('planPanel').hidden){const p=$('planPanel');placePlan(parseFloat(p.style.left),parseFloat(p.style.top));}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('planPanel').hidden)showPlan(false);});
}
