/* ---------------- the deck face: layered drawing and input (one face per deck) ---------------- */
const FACES=[];
class Face{
  constructor(cv,deck){Object.assign(this,{cv,g:cv.getContext('2d'),s:1,body:null,inner:null,rim:null,sprites:new Map(),down:new Set(),deck,ready:false});deck.face=this;FACES.push(this);wireFace(this);}
}
function sprite(F,key,box,draw){
  let sp=F.sprites.get(key);if(sp)return sp;
  const P=new Painter(box,F.s);draw(P);sp={cv:P.cv,x:P.px[0],y:P.px[1]};F.sprites.set(key,sp);
  if(F.sprites.size>900){const k=F.sprites.keys().next().value;F.sprites.delete(k);}
  return sp;
}
const grow=(b,m)=>[b[0]-m,b[1]-m,b[2]+m,b[3]+m];
function faceResize(F){
  const cv=F.cv,w=cv.clientWidth;if(!w)return;const dpr=Math.min(2,window.devicePixelRatio||1);
  const W=Math.round(w*dpr),H=Math.round(w*FH/FW*dpr);if(cv.width===W&&cv.height===H&&F.ready)return;
  cv.width=W;cv.height=H;F.s=W/FW;F.sprites.clear();
  const B=new Painter([0,0,FW,FH],F.s);drawBody(B,DECKS.length>1?'PLAYER '+F.deck.pn:'');jogStatic(B);F.body=B.cv;
  const [cx,cy,r]=F_JOG;const jb=[cx-r,cy-r,cx+r,cy+r];
  const R=new Painter(jb,F.s);jogRim(R,0);F.rim={cv:R.cv,x:R.px[0],y:R.px[1]};
  const I=new Painter(jb,F.s);jogInner(I);F.inner={cv:I.cv,x:I.px[0],y:I.px[1]};
  F.ready=true;
}
function parseCol(c){if(Array.isArray(c))return c;const m=/^#([0-9a-f]{6})$/i.exec(c);if(m){const n=parseInt(m[1],16);return [n>>16,(n>>8)&255,n&255];}const r=/rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(c);return r?[+r[1],+r[2],+r[3]]:[40,226,20];}
function renderFace(F){
  if(!F.ready)return;const g=F.g,d=F.deck,s=F.s;const blit=sp=>g.drawImage(sp.cv,sp.x,sp.y);
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,F.cv.width,F.cv.height);g.drawImage(F.body,0,0);
  /* jog rim at its angle, then the platter and the centre display */
  const [cx,cy,r]=F_JOG;const per=360/JOG_DIMPLES;
  g.save();g.translate(cx*s,cy*s);g.rotate((((d.rimAngle%per)+per)%per)*Math.PI/180);g.translate(-cx*s,-cy*s);blit(F.rim);g.restore();
  blit(F.inner);
  const live=d.loaded(),touch=!!d.touching;
  blit(sprite(F,'cb|'+live+touch+d.vinyl,[cx-F_JOG_DISPLAY,cy-F_JOG_DISPLAY,cx+F_JOG_DISPLAY,cy+F_JOG_DISPLAY],P=>centreBase(P,live,touch,d.vinyl)));
  if(live){g.setTransform(s,0,0,s,0,0);const P={g,line:Painter.prototype.line,scale:s};centrePointer(P,d._pos/1.8,d.playing?null:d.cue/1.8,d.ghost?d.ghost.pos/1.8:null);g.setTransform(1,0,0,1,0,0);}
  const white=anyMedia()&&!(SET.jogInd===1&&endBlink(d))?[0,1,2][SET.jogRing]:0;   /* JOG INDICATOR: the ring blinks at the end of the track */
  if(white)blit(sprite(F,'ring|'+white,[cx-r-24,cy-r-24,cx+r+24,cy+r+24],P=>ringLight(P,white,0)));
  /* keys */
  for(const k of F_KEYS){
    let lit=false,col=null;const dn=F.down.has(k.name);
    if(k.kind==='pad'){const pc=padLight(d,k.pad);lit=!!pc;col=pc?parseCol(pc):[40,226,20];}
    else lit=!!keyLight(d,k.name)||!!k.always;
    let pos=0;if(k.kind==='lever')pos=d.lever;
    const ck=k.name+'|'+(lit?1:0)+(dn?1:0)+'|'+(col?col.join(','):'')+'|'+pos;
    blit(sprite(F,ck,grow(keyBounds(k),k.kind==='big'?22:k.kind==='lever'?16:12),P=>{const kk=pos?Object.assign({},k,{pos}):k;drawKey(P,kk,lit,dn,col);}));
  }
  for(const [x,y,t,c,kind] of F_BADGES){const on=kind==='vinyl'?d.vinyl:kind==='cdj'?!d.vinyl:d.dir<0;blit(sprite(F,'bd|'+kind+on,[x-26,y-14,x+26,y+14],P=>badge(P,x,y,t,c,on)));}
  for(const [st,kx,ky,kr,name] of F_KNOBS){const v=name==='jog_adjust'?d.jogWeight:name==='touch_brake'?d.kTouch:d.kRel;const q=Math.round(v*60)/60;
    blit(sprite(F,'kn|'+name+q,[kx-kr-2,ky-kr-2,kx+kr+2,ky+kr+2],P=>knobCap(P,st,kx,ky,kr,q)));}
  /* the selector crown turns with each detent (18 degrees, eased) */
  const [sx,sy,sr]=F_SELECT;d.selShown=(d.selShown||0)+((d.selTarget||0)-(d.selShown||0))*.35;if(Math.abs(d.selTarget-d.selShown)<.05)d.selShown=d.selTarget||0;
  const ph=Math.round((((d.selShown%15)+15)%15)*2)/2;
  blit(sprite(F,'sel|'+ph+F.down.has('_sel'),[sx-SEL_COLLAR-4,sy-SEL_COLLAR-4,sx+SEL_COLLAR+4,sy+SEL_COLLAR+4],P=>selector(P,ph,F.down.has('_sel'))));
  const capY=SL_ZERO+d.tempoV*SL_TRAVEL;const zero=d.tempoPct()===0&&!d.tReset;
  g.fillStyle=zero?'#d8ff3a':'#2a3010';g.fillRect(801*s,947.75*s,12*s,4*s);if(zero){g.shadowColor='#d8ff3a';g.shadowBlur=6*s;g.fillRect(801*s,947.75*s,12*s,4*s);g.shadowBlur=0;}
  const cap=sprite(F,'cap',[F_SLIDER[0]-40,0,F_SLIDER[0]+40,70],P=>sliderCap(P,35));g.drawImage(cap.cv,cap.x,cap.y+(capY-35)*s);
  /* the LCD */
  const [lx0,ly0,lx1,ly1]=F_LCD;g.save();g.beginPath();g.rect(lx0*s,ly0*s,(lx1-lx0)*s,(ly1-ly0)*s);g.clip();
  g.setTransform((lx1-lx0)*s/800,0,0,(ly1-ly0)*s/480,lx0*s,ly0*s);g.textBaseline='alphabetic';drawLcd(d,g);
  if(d.jumpLetter&&now()-d.jumpLetter.t<.7&&d.jumpLetter.c){g.fillStyle='rgba(0,0,0,.75)';g.fillRect(340,120,120,110);T(g,d.jumpLetter.c,400,205,80,'#fff',LF,400,'center');}
  g.restore();g.setTransform(1,0,0,1,0,0);
  if(DECKS.length>1&&ACTIVE===d){g.setTransform(s,0,0,s,0,0);silPath(g,.8);g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=1.3;g.lineJoin='round';g.stroke();g.setTransform(1,0,0,1,0,0);}
}
/* ---------- input ---------- */
const inCircle=(p,cx,cy,r)=>(p.x-cx)**2+(p.y-cy)**2<=r*r;
const inBox=(p,b)=>p.x>=b[0]&&p.x<=b[2]&&p.y>=b[1]&&p.y<=b[3];
function pickTarget(p){
  if(inBox(p,F_LCD))return {t:'lcd'};
  const [sx,sy,sr]=F_SELECT;if(inCircle(p,sx,sy,SEL_COLLAR))return {t:'sel',center:inCircle(p,sx,sy,sr+2)};
  if(inBox(p,F_SLIDER_FRAME))return {t:'slider'};
  for(const [st,kx,ky,kr,name] of F_KNOBS)if(inCircle(p,kx,ky,kr+6))return {t:'knob',name};
  for(let i=F_KEYS.length-1;i>=0;i--){const k=F_KEYS[i];if(k.kind==='lever'?inBox(p,grow(k.box,4)):keyHit(k,p.x,p.y))return {t:'key',k};}
  const [cx,cy,r]=F_JOG;if(inCircle(p,cx,cy,r))return {t:'jog',top:inCircle(p,cx,cy,F_JOG_TOP)};
  return null;
}
const PTR=new Map();
let ACTIVE=null;
function keyPress(d,name,dir){
  const F=d.face,a=keyActions(d)[name];if(F)F.down[dir?'add':'delete'](name);d.dirty=true;if(!a)return;
  const id='k:'+d.n+':'+name,st=PTR.get(id)||{};
  if(dir){ensureCtx();if(a.down)a.down();if(a.press||a.long){st.long=false;clearTimeout(st.t);if(a.long)st.t=setTimeout(()=>{st.long=true;a.long();},name==='usb_stop'?2000:1000);}PTR.set(id,st);}
  else{clearTimeout(st.t);if(a.up)a.up();if(a.press&&!st.long)a.press();PTR.delete(id);}
}
/* a mouse notch is ~100 px of deltaY; trackpads send many small deltas: add them up so one notch = one step */
const WACC=new Map();
function wheelSteps(key,e,unit){let dy=e.deltaY;if(e.deltaMode===1)dy*=33;else if(e.deltaMode===2)dy*=600;
  const o=WACC.get(key)||{a:0,t:0},t=performance.now();if(t-o.t>350)o.a=0;o.t=t;o.a+=dy;const u=unit||100;let n=Math.trunc(o.a/u);o.a-=n*u;n=clamp(n,-3,3);WACC.set(key,o);return n;}
function wireFace(F){
  const cv=F.cv;
  const toUnit=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*FW,y:(e.clientY-r.top)/r.height*FH};};
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('pointerdown',e=>{
    const d=F.deck;ACTIVE=d;const p=toUnit(e),tg=pickTarget(p);if(!tg)return;e.preventDefault();try{cv.setPointerCapture(e.pointerId);}catch(_){}
    const st={tg,p0:p,last:p,t0:now()};PTR.set(e.pointerId,st);
    switch(tg.t){
      case 'key':if(tg.k.kind==='lever'){st.lever=true;setLever(d,leverPos(tg.k,p));}else keyPress(d,tg.k.name,true);break;
      case 'lcd':lcdDown(d,st,p);break;
      case 'sel':st.a=Math.atan2(p.y-F_SELECT[1],p.x-F_SELECT[0]);st.acc=0;st.moved=false;if(tg.center){F.down.add('_sel');st.hold=setTimeout(()=>{st.long=true;rotaryHold(d);},1000);}break;
      case 'slider':sliderTo(d,p.y);break;
      case 'knob':break;
      case 'jog':jogDown(d,st,p);break;
    }
  });
  cv.addEventListener('pointermove',e=>{
    const st=PTR.get(e.pointerId);if(!st){const tg=pickTarget(toUnit(e));cv.style.cursor=tg?(tg.t==='jog'?'grab':tg.t==='slider'||tg.t==='knob'?'ns-resize':'pointer'):'default';return;}
    const d=F.deck,p=toUnit(e);
    switch(st.tg.t){
      case 'key':if(st.lever)setLever(d,leverPos(st.tg.k,p));break;
      case 'lcd':lcdMove(d,st,p);break;
      case 'sel':{const a=Math.atan2(p.y-F_SELECT[1],p.x-F_SELECT[0]);let da=a-st.a;if(da>Math.PI)da-=2*Math.PI;if(da<-Math.PI)da+=2*Math.PI;st.a=a;
        if(st.tg.center&&!st.moved&&Math.hypot(p.x-st.p0.x,p.y-st.p0.y)<6)break;
        st.acc+=da*180/Math.PI;while(Math.abs(st.acc)>=15){rotaryTurn(d,st.acc>0?1:-1);st.acc-=Math.sign(st.acc)*15;st.moved=true;if(!st.long)clearTimeout(st.hold);}break;}
      case 'slider':sliderTo(d,p.y);break;
      case 'knob':{const dv=((st.last.y-p.y)+(p.x-st.last.x))/110;knobSet(d,st.tg.name,dv);break;}
      case 'jog':jogMove(d,st,p);break;
    }
    st.last=p;
  });
  const up=e=>{
    const st=PTR.get(e.pointerId);if(!st)return;PTR.delete(e.pointerId);const d=F.deck;
    switch(st.tg.t){
      case 'key':if(st.lever){if(d.lever===-1)setLever(d,0);}else keyPress(d,st.tg.k.name,false);break;
      case 'lcd':lcdUp(d,st);break;
      case 'sel':F.down.delete('_sel');clearTimeout(st.hold);if(st.tg.center&&!st.moved&&!st.long)rotaryPush(d);d.selHeld=false;break;
      case 'jog':jogUp(d,st);break;
    }
    d.dirty=true;
  };
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{
    const d=F.deck,p=toUnit(e),tg=pickTarget(p);if(!tg)return;e.preventDefault();ACTIVE=d;
    if(tg.t==='jog'){jogFlick(d,e);return;}
    const n=wheelSteps(d.n+tg.t,e);if(!n)return;
    switch(tg.t){
      case 'sel':case 'lcd':for(let i=0;i<Math.abs(n);i++)rotaryTurn(d,Math.sign(n));break;
      case 'slider':d.tempoV=clamp(d.tempoV+n*STEPS[d.rangeIdx]/RANGES[d.rangeIdx],-1,1);d.tReset=false;d.applyTempo();break;
      case 'knob':knobSet(d,tg.name,-n*.05);break;
    }
  },{passive:false});
}
function leverPos(k,p){const [x0,y0,x1,y1]=k.box,f=(p.y-y0)/(y1-y0);return f<.36?-1:f>.64?1:0;}
function sliderTo(d,y){let v=clamp((y-SL_ZERO)/SL_TRAVEL,-1,1);if(Math.abs(v)<.02)v=0;d.tempoV=v;d.tReset=false;d.applyTempo();}
/* ---------- jog: CDJ mode bends; VINYL mode: top touch = scratch / hold; paused = search; loop adjust ---------- */
function jogDown(d,st,p){
  const [cx,cy]=F_JOG;if(p)st.a=Math.atan2(p.y-cy,p.x-cx);st.t=now();st.acc=0;d.jogHeld=true;d.spin=0;d.spinImp=0;if(d.spinning)endSpin(d);
  if(!d.loaded()){st.mode='free';return;}
  ensureCtx();
  st.mode=d.adjust?'adj':(!d.playing?'search':(d.vinyl&&st.tg.top?'touch':'bend'));
  if(st.mode==='touch'){d.advance();d.touching=true;d.slipBegin();const tb=tBrake(d);d.brakeT=Math.max(.04,tb);d.touchTarget=0;}
  if(st.mode==='search'&&d.vinyl&&st.tg.top){d.touching=true;}
  d.dirty=true;
}
function jogMove(d,st,p){
  const [cx,cy]=F_JOG;const a=Math.atan2(p.y-cy,p.x-cx);let da=a-st.a;if(da>Math.PI)da-=2*Math.PI;if(da<-Math.PI)da+=2*Math.PI;st.a=a;
  jogTurn(d,st,da*180/Math.PI);
}
/* the platter turned by raw degrees (the mouse on the face, or a controller's jog wheel) */
/* one half frame (1/150 s) every 4/3 degree: 1.8 s per turn, as the frame search (manual p. 22, 24) */
const HALF_FRAME_DEG=360/270;
/* TRACK SEARCH held: one track per 30 degrees (the manual gives no figure) */
const TRACK_JOG_DEG=30;
function jogTurn(d,st,raw){
  const deg=raw*jogSens(d);d.rimAngle+=deg;const t=now(),dt=Math.max(.008,t-st.t);st.t=t;const w=deg/dt;st.w=(st.w||0)*.5+w*.5;st.wt=t;
  if(d.tsHeld&&st.mode!=='adj'){const h=d.tsHeld;h.acc+=deg;while(Math.abs(h.acc)>=TRACK_JOG_DEG){trackJog(d,Math.sign(h.acc));h.acc-=Math.sign(h.acc)*TRACK_JOG_DEG;}return;}
  /* super fast search: SEARCH held, the jog drives the search, its speed follows the jog; when the jog stops, play goes on normally */
  if(d._scan&&(st.mode==='bend'||st.mode==='search')){d.seek(d._pos+deg/200*8);d.dirty=true;return;}
  switch(st.mode){
    case 'adj':st.acc+=deg;while(Math.abs(st.acc)>=HALF_FRAME_DEG){d.adjustStep((st.acc>0?1:-1)/150);st.acc-=Math.sign(st.acc)*HALF_FRAME_DEG;}break;
    /* frame search: paused, 1.8 s per turn in every jog mode (manual p. 22) */
    case 'search':d.advance();d.scratchOn=true;d.scratchV=clamp(w/200,-8,8);d.scratchT=t;d.syncSrc();d.dirty=true;break;
    case 'touch':d.advance();d.scratchOn=true;d.scratchV=clamp(w/200,-8,8);d.scratchT=t;d.syncSrc();break;
    case 'bend':{const K=1.1-.8*d.jogWeight;d.bend=clamp(1+d.dir*w/200*K*.35,.4,1.7);  /* in reverse the jog's direction is reversed too (manual p. 22) */clearTimeout(d._bendT);d._bendT=setTimeout(()=>{d.bend=1;d.syncSrc();},90);d.syncSrc();break;}
  }
}
/* end of a slip scratch: when the background track takes over again, RELEASE/START does not act (manual p. 23) */
function slipResume(d){const g=!!d.ghost;d.slipCheck();if(g&&!d.ghost){d.touch=d.touchTarget=1;}}
function jogUp(d,st){
  d.jogHeld=false;const m=st.mode;d.advance();d.bend=1;
  /* let go while the hand was moving: the platter keeps turning on its own momentum (longer when JOG ADJUST is LIGHT) */
  const fling=st.w&&now()-st.wt<.08&&Math.abs(st.w)>120?st.w:0;
  if(m==='touch'){d.scratchOn=false;d.scratchV=0;d.touching=false;const ts=tStart(d);d.startT=Math.max(.04,ts);d.touchTarget=1;slipResume(d);}
  if(m==='search'){d.scratchOn=false;d.scratchV=0;d.touching=false;if(!d.playing){d.seek(Math.round(d._pos*150)/150);}}
  d.syncSrc();d.dirty=true;
  if(fling&&m!=='adj'){d.spin=clamp(fling,-1600,1600);if(d.loaded()&&!d.spinning&&m!=='free'){d.spinning=true;d.spinMode=m==='touch'?'scratch':(m==='bend'?'bend':'search');
    if(d.spinMode==='scratch'){d.advance();d.touching=true;d.scratchOn=true;}}}
}
/* JOG ADJUST: LIGHT (0) = the platter follows the hand more and keeps spinning; HEAVY (1) = less, and stops quickly */
function jogSens(d){return 1.35-.7*d.jogWeight;}
function jogDrag(d){return .6+1.1*d.jogWeight;}
function knobSet(d,name,dv){const k=name==='jog_adjust'?'jogWeight':name==='touch_brake'?'kTouch':'kRel';d[k]=clamp(d[k]+dv,0,1);d.dirty=true;
  if(k==='jogWeight')toast('JOG ADJUST : '+(d[k]<.34?'LIGHT':d[k]>.66?'HEAVY':'MEDIUM')+' ('+Math.round(d[k]*100)+' %)',1200);
  else toast((k==='kTouch'?'TOUCH/BRAKE':'RELEASE/START')+' : '+(.04+d[k]*2.96).toFixed(1)+' s',1200);}
/* ---------- a flick of the mouse wheel on the jog: the platter spins and slows down by itself.
   Wheel up = backwards (backspin), wheel down = forwards. In VINYL the sound follows the platter (scratch);
   in CDJ mode it bends the pitch; paused it searches. 200 degrees per second = normal speed. ---------- */
const SPIN_K=2.6,SPIN_CAP=430,SPIN_EASE=.035;
function jogFlick(d,e){
  /* each wheel notch pushes the platter (an impulse). The push is handed to the platter over a few hundredths of a second, so
     the speed always changes smoothly; rolling the wheel on keeps pushing, up to a top speed; it never restarts by itself */
  let dy=e.deltaY;if(e.deltaMode===1)dy*=33;else if(e.deltaMode===2)dy*=600;
  if(!d.loaded()){const c=SPIN_CAP*jogSens(d);d.spin=clamp((d.spin||0)+clamp(dy,-120,120)*SPIN_K*jogSens(d),-c,c);return;}
  ensureCtx();
  if(d.adjust){const n=wheelSteps(d.n+'adj',e,60);if(n)d.adjustStep(n/150);d.spin=0;d.spinImp=0;return;}
  if(d.tsHeld){const n=wheelSteps(d.n+'ts',e,60);if(n)trackJog(d,n);return;}
  const sens=jogSens(d),cap=SPIN_CAP*sens,imp=clamp(dy,-120,120)*SPIN_K*sens;
  if(!d.spinning){
    d.spinning=true;d.spinMode=d.vinyl?'scratch':(d.playing?'bend':'search');d.spinWasPlaying=d.playing;
    /* in VINYL the platter was turning with the record: start from that speed, the push brakes it and throws it back */
    d.spin=d.spinMode==='scratch'&&d.playing?d.vel()*200:0;d.spinImp=0;
    if(d.spinMode==='scratch'){d.advance();d.slipBegin();d.touching=true;d.scratchOn=true;d.scratchV=d.spin/200;d.scratchT=now();}
    d.spinImp=imp-d.spin;
  }else d.spinImp=(d.spinImp||0)+imp;
  const tot=d.spin+d.spinImp;if(Math.abs(tot)>cap)d.spinImp=Math.sign(tot)*cap-d.spin;
}
function spinTick(d,dt){
  if(!d.spin&&!d.spinning&&!d.spinImp)return;
  if(d.spinImp){const take=Math.abs(d.spinImp)<2?d.spinImp:d.spinImp*(1-Math.exp(-dt/SPIN_EASE));d.spin=(d.spin||0)+take;d.spinImp-=take;}
  const w=d.spin||0;d.rimAngle+=w*dt;
  const dec=(260+2*Math.abs(w))*dt*jogDrag(d);d.spin=Math.abs(w)<=dec?0:w-Math.sign(w)*dec;
  if(!d.spinning||!d.loaded())return;
  switch(d.spinMode){
    case 'scratch':d.scratchV=clamp(d.spin/200,-20,20);d.scratchT=now();d.syncSrc();break;
    case 'bend':d.bend=clamp(1+d.dir*d.spin/200*.3,.4,1.8);d.syncSrc();break;
    case 'search':d._pos=clamp(d._pos+d.spin/200*dt,0,d.dur);break;
  }
  if(Math.abs(d.spin)<15&&Math.abs(d.spinImp||0)<2)endSpin(d);
}
function endSpin(d){
  const m=d.spinMode;d.spinning=false;d.spin=0;d.spinImp=0;d.advance();
  if(m==='scratch'){d.scratchOn=false;d.scratchV=0;d.touching=false;if(d.playing){const ts=tStart(d);d.startT=Math.max(.15,ts);d.touch=0;d.touchTarget=1;}slipResume(d);}
  if(m==='bend')d.bend=1;
  if(m==='search'&&!d.playing)d.seek(Math.round(d._pos*150)/150);
  d.syncSrc();d.dirty=true;
}
function jogNudge(d,dir){
  d.rimAngle+=dir*4;if(!d.loaded())return;
  if(d.adjust){d.adjustStep(dir/150);return;}
  if(d.playing){d.nudge=dir*.06;d.syncSrc();clearTimeout(d._nT);d._nT=setTimeout(()=>{d.nudge=0;d.syncSrc();},160);}
  else d.seek(d.pos()+dir*4/200*.5);
}
/* ---------- touch screen ---------- */
function lcdXY(p){const [x0,y0,x1,y1]=F_LCD;return {x:(p.x-x0)/(x1-x0)*800,y:(p.y-y0)/(y1-y0)*480};}
function lcdFind(d,q){const H=d.ui.hits;for(let i=H.length-1;i>=0;i--){const h=H[i];if(q.x>=h.x&&q.x<=h.x+h.w&&q.y>=h.y&&q.y<=h.y+h.h)return h;}return null;}
function needle(d,q){if(!d.loaded())return;const t=clamp((q.x-100)/600,0,1)*d.dur;
  if(!d.playing){if(d.loop){d.lastLoop=d.loop;d.loop=null;}d.adjust=null;d.seek(t);d.cue=t;}
  else if(SET.needleLock===0){d.loop=null;d.adjust=null;d.seek(t);}
  else d.touchPrev=t;d.dirty=true;}
function lcdDown(d,st,p){const q=lcdXY(p);const h=lcdFind(d,q);st.h=h;st.q0=q;st.moved=false;
  if(h&&h.needle){ensureCtx();needle(d,q);return;}
  if(h&&h.hold)st.holdT=setTimeout(()=>{st.held=true;h.hold();},700);}
function lcdMove(d,st,p){const q=lcdXY(p),h=st.h;
  if(h&&h.needle){needle(d,q);return;}
  if(h&&h.list&&Math.abs(q.y-st.q0.y)>LROWH*.6){const s=listState(d,h.list);const n=Math.round((st.q0.y-q.y)/LROWH);s.top=Math.max(0,s.top+n);s.sel=Math.max(0,s.sel+n);st.q0=q;st.moved=true;}}
function lcdUp(d,st){const h=st.h;clearTimeout(st.holdT);d.touchPrev=null;if(!h)return;if(h.needle)return;
  if(st.held){if(h.up)h.up();return;}if(!st.moved&&h.fn){ensureCtx();h.fn(st.q0.x,st.q0.y);}}
