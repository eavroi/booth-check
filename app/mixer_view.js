/* ---------------- the mixer face on screen: drawing, mouse, wheel, headphone output menu ---------------- */
const MXF={cv:null,g:null,s:1,body:null,dyn:[],sprites:new Map(),ready:false};
function mixResize(){
  const cv=MXF.cv;if(!cv)return;const w=cv.clientWidth;if(!w)return;const dpr=Math.min(2,window.devicePixelRatio||1);
  const W=Math.round(w*dpr),H=Math.round(w*(DM_Y1-DM_Y0)/DM_W*dpr);if(cv.width===W&&cv.height===H&&MXF.ready)return;
  cv.width=W;cv.height=H;MXF.s=W/DM_W;MXF.sprites.clear();
  DYN=[];const P=new Painter([0,DM_Y0,DM_W,DM_Y1],MXF.s);drawMixerBody(P,MS);MXF.dyn=DYN;DYN=null;MXF.body=P.cv;MXF.ready=true;
}
function mixRender(){
  const cv=MXF.cv;if(!MXF.ready||!MS.on||cv.closest('[hidden]'))return;const g=MXF.g||(MXF.g=cv.getContext('2d')),s=MXF.s,y0=Math.round(DM_Y0*s);
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);g.drawImage(MXF.body,0,0);
  for(const d of MXF.dyn){const k=d.key()+'@'+d.box[0]+','+d.box[1];let sp=MXF.sprites.get(k);
    if(!sp){const P=new Painter(d.box,s);d.fn(P);sp={cv:P.cv,x:P.px[0],y:P.px[1]};MXF.sprites.set(k,sp);if(MXF.sprites.size>1500)MXF.sprites.delete(MXF.sprites.keys().next().value);}
    const o=d.off?d.off():null;g.drawImage(sp.cv,sp.x+(o?Math.round(o[0]*s):0),sp.y-y0+(o?Math.round(o[1]*s):0));}
}
function mixToast(t,ms){toast(t,ms);STATUS.src='mix';}
/* ---------- what can be touched ---------- */
const INPUTS=['A','B','DIGITAL','LINE','PHONO','RETURN'],INPUT_DIR={A:-105,B:-45,DIGITAL:-12.5,LINE:15,PHONO:45,RETURN:75};
const MSG={
  usb:['USB A / B : la carte son pour ordinateur (rekordbox, DVS) n’est pas simulée','USB A / B: the computer sound card (rekordbox, DVS) is not simulated'],
  midi:['MIDI ON/OFF : le contrôle MIDI n’est pas simulé','MIDI ON/OFF: MIDI control is not simulated'],
  mic:['MIC : pas de micro dans Booth Check','MIC: no microphone in Booth Check'],
  link:['LINK CUE : préécoute d’un morceau depuis rekordbox sur ordinateur, non simulée','LINK CUE: previewing a track from rekordbox on a computer, not simulated'],
  utility:['UTILITY de la table (QUANTIZE maintenu) : pas encore simulé','Mixer UTILITY (QUANTIZE held): not simulated yet'],
  send:['SEND / RETURN : effets externes non simulés','SEND / RETURN: external effects are not simulated'],
  booth:['BOOTH MONITOR : pas de sortie cabine dans Booth Check','BOOTH MONITOR: no booth output in Booth Check'],
};
const msg=k=>tl(MSG[k]);
const MXH=[];
(function(){
  const K=(cx,cy,r,get,set,center,name)=>MXH.push({t:'knob',cx,cy,r,get,set,center,name});
  const S=(cx,cy,w,h,pos,get,set)=>MXH.push({t:'sw',box:[cx-w/2-6,cy-h/2-6,cx+w/2+6,cy+h/2+6],pos,get,set});
  const M=(box,k)=>MXH.push({t:'msg',box,k});
  const MC=(cx,cy,r,k)=>MXH.push({t:'msg',circle:[cx,cy,r],k});
  const B=(box,fn)=>MXH.push({t:'btn',box,fn});
  /* left column */
  M([40,250,180,432],'usb');M([232,250,372,432],'usb');M([62,468,158,534],'midi');M([254,468,350,534],'midi');
  MC(124,700,56,'mic');MC(286,700,56,'mic');MC(205,830,52,'mic');MC(205,945,52,'mic');M([130,1050,280,1110],'mic');
  for(const [name,x,y] of [['SPACE',90,1297],['DUB ECHO',205,1297],['SWEEP',318,1297],['NOISE',90,1433],['CRUSH',205,1433],['FILTER',318,1433]])
    B([x-48,y-36,x+48,y+36],()=>{setColor(name);mixToast('SOUND COLOR FX : '+(MS.color||'OFF'),1400);});
  K(205,1595,42,()=>MS.param,v=>MS.param=v);
  M([130,1748,280,1808],'link');
  S(205,1922,92,46,[-1,1],()=>MS.mono,v=>MS.mono=v);
  K(206,2080,53,()=>MS.mixing,v=>MS.mixing=v,true,'mixing');K(204,2268,53,()=>MS.phLevel,v=>MS.phLevel=v);
  MXH.push({t:'ph',circle:[205,2470,40]});MXH.push({t:'ph',circle:[206,2594,44]});
  /* channels */
  DM_STRIP.forEach((cx,i)=>{const ch=MS.ch[i];
    MXH.push({t:'sel',cx,cy:318,r:53,i});
    K(cx,510,46,()=>ch.trim,v=>ch.trim=v,true,'trim'+i);
    for(const [y,k] of [[706,'hi'],[908,'mid'],[1110,'low']])K(cx,y,53,()=>ch[k],v=>ch[k]=v,true,k+i);
    K(cx,1366,55,()=>ch.color,v=>ch.color=v,true,'color'+i);
    B([cx-72,1509,cx+72,1565],()=>{ch.cue=!ch.cue;});
    MXH.push({t:'vf',cx,i,box:[cx-92,1800,cx+92,2165]});
    S(cx,2328,104,64,[-1,0,1],()=>ch.xf,v=>ch.xf=v);
  });
  MXH.push({t:'hf',box:[790,2490,1152,2660]});
  /* master */
  K(DM_MX,316,52,()=>MS.master,v=>MS.master=v,false,'master');K(DM_MX+4,1366,47,()=>MS.balance,v=>MS.balance=v,true,'balance');
  B([DM_MX-72,1509,DM_MX+72,1565],()=>{MS.cueMaster=!MS.cueMaster;});
  K(DM_MX+2,1812,52,()=>MS.booth,v=>{MS.booth=v;if(!MXF.boothSaid){MXF.boothSaid=true;mixToast(msg('booth'),3000);}});
  S(DM_MX,2022,104,64,[-1,1],()=>MS.eqCurve,v=>MS.eqCurve=v);S(DM_MX,2172,104,64,[-1,0,1],()=>MS.chCurve,v=>MS.chCurve=v);S(DM_MX,2326,104,64,[-1,0,1],()=>MS.xfCurve,v=>MS.xfCurve=v);
  /* SEND / RETURN and BEAT FX */
  M([1772,170,2172,612],'send');
  /* BEAT FX */
  const H=(cx,cy,r,down,up)=>MXH.push({t:'hold',circle:[cx,cy,r],down,up});
  MXH.push({t:'xpad',box:[1790,980,2156,1204]});
  B([1799,1230,1911,1286],()=>beatKey(-1));B([2029,1230,2141,1286],()=>beatKey(1));
  H(1845,1392,36,autoTapDown,autoTapUp);H(1972,1372,54,tapDown,tapUp);
  H(2095,1392,36,()=>{MS.quantize=!MS.quantize;MS.dirty=true;MXF.qT=setTimeout(()=>mixToast(msg('utility'),2600),1000);},()=>clearTimeout(MXF.qT));
  for(const [t,bx] of [['LOW',1840],['MID',1970],['HI',2100]])B([bx-52,1506,bx+52,1568],()=>{MS.freq[t]=!MS.freq[t];});
  MXH.push({t:'rot',cx:FXSEL_C[0],cy:FXSEL_C[1],r:50,opts:FXSEL,get:()=>MS.fxType,set:setFxType});
  MXH.push({t:'rot',cx:FXCH_C[0],cy:FXCH_C[1],r:52,opts:FXCH,get:()=>MS.fxCh,set:setFxCh});
  MXH.push({t:'enc',circle:[1972,2098,60]});
  K(1972,2326,53,()=>MS.depth,v=>MS.depth=v);
  H(1970,2540,76,fxOnOff,()=>{});
})();
function mixPick(p){
  let rb=null,rd=1e9;for(const h of MXH)if(h.t==='rot'){const d=Math.hypot(p.x-h.cx,p.y-h.cy);if(d<=h.r+72&&d<rd){rd=d;rb=h;}}
  for(let i=MXH.length-1;i>=0;i--){const h=MXH[i];if(h.t==='rot')continue;
    if(h.circle){const [cx,cy,r]=h.circle;if((p.x-cx)**2+(p.y-cy)**2<=r*r)return h;continue;}
    if(h.t==='knob'){if((p.x-h.cx)**2+(p.y-h.cy)**2<=(h.r+10)**2)return h;continue;}
    if(h.t==='sel'){if((p.x-h.cx)**2+(p.y-h.cy)**2<=(h.r+70)**2&&p.y<400)return h;continue;}
    const [x0,y0,x1,y1]=h.box;if(p.x>=x0&&p.x<=x1&&p.y>=y0&&p.y<=y1)return h;}
  return rb;
}
function rotAt(h,p){const a=Math.atan2(p.x-h.cx,-(p.y-h.cy))*180/Math.PI;let best=null,bd=1e9;for(const o of h.opts){const d=Math.abs(a-o[1]);if(d<bd){bd=d;best=o[0];}}return best;}
function rotStep(h,n){const k=h.opts.findIndex(o=>o[0]===h.get())+n;if(k>=0&&k<h.opts.length)h.set(h.opts[k][0]);}
/* double click: back to the centre click, only on the knobs that have one (EQ, COLOR, TRIM, BALANCE, MIXING) and on the crossfader;
   never on a level (MASTER, HEADPHONES LEVEL, BOOTH MONITOR), a wrong double click there would be heard in the room */
function resetCtl(h){if(h.t==='knob'&&h.center){h.set(.5);mixApply();return true;}if(h.t==='hf'){MS.xfader=0;mixApply();return true;}return false;}
function mixReset(name,i){const h=MXH.find(x=>x.name===(i==null?name:name+i));return h?resetCtl(h):false;}
function knobTo(h,v){v=clamp(v,0,1);if(h.center&&Math.abs(v-.5)<.018)v=.5;h.set(v);mixApply();}
function setInput(i,name){const ch=MS.ch[i];if(ch.input===name)return;ch.input=name;mixApply();
  if(name!=='DIGITAL'&&name!=='LINE')mixToast(say('Entrée '+(name==='RETURN'?'RETURN AUX':name==='A'||name==='B'?'USB '+name:name)+' : rien de branché ici, la tranche est muette','Input '+(name==='RETURN'?'RETURN AUX':name==='A'||name==='B'?'USB '+name:name)+': nothing plugged in here, the channel is silent'),2600);}
function selAt(h,p){const a=Math.atan2(p.x-h.cx,-(p.y-h.cy))*180/Math.PI;let best=null,bd=1e9;for(const n of INPUTS){const d=Math.abs(a-INPUT_DIR[n]);if(d<bd){bd=d;best=n;}}return best;}
function wireMixer(){
  const cv=MXF.cv;const toD=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*DM_W,y:DM_Y0+(e.clientY-r.top)/r.height*(DM_Y1-DM_Y0)};};
  const ptr=new Map();
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('pointerdown',e=>{
    const p=toD(e),h=mixPick(p);if(!h)return;e.preventDefault();ensureCtx();try{cv.setPointerCapture(e.pointerId);}catch(_){}
    const st={h,last:p,p0:p};ptr.set(e.pointerId,st);
    const t=performance.now(),L=MXF.lastDown;MXF.lastDown={h,t};
    if(L&&L.h===h&&t-L.t<350&&resetCtl(h)){st.h={t:'none'};MXF.lastDown=null;return;}
    switch(h.t){
      case 'msg':mixToast(msg(h.k),3200);break;
      case 'btn':h.fn();mixApply();break;
      case 'sw':{const [x0,,x1]=h.box,f=(p.x-x0)/(x1-x0);const n=h.pos.length;let v=h.pos[Math.min(n-1,Math.floor(f*n))];if(v===h.get())v=h.pos[(h.pos.indexOf(v)+1)%n];h.set(v);mixApply();break;}
      case 'sel':{const d2=(p.x-h.cx)**2+(p.y-h.cy)**2;if(d2>h.r*h.r){setInput(h.i,selAt(h,p));}else{st.acc=0;st.a=Math.atan2(p.y-h.cy,p.x-h.cx);}break;}
      case 'vf':MS.ch[h.i].fader=clamp((2127-p.y)/292,0,1);mixApply();break;
      case 'hf':{let v=clamp((p.x-970.5)/150,-1,1);if(Math.abs(v)<.03)v=0;MS.xfader=v;mixApply();break;}
      case 'ph':openPhones(e);break;
      case 'hold':h.down();break;
      case 'xpad':xpadDown(p);break;
      case 'enc':st.acc=0;break;
      case 'rot':{const d2=(p.x-h.cx)**2+(p.y-h.cy)**2;if(d2>h.r*h.r)h.set(rotAt(h,p));else{st.acc=0;st.a=Math.atan2(p.y-h.cy,p.x-h.cx);}break;}
    }
  });
  cv.addEventListener('pointermove',e=>{
    const p=toD(e),st=ptr.get(e.pointerId);
    if(!st){const h=mixPick(p);cv.style.cursor=h?(h.t==='knob'||h.t==='vf'||h.t==='enc'?'ns-resize':h.t==='hf'?'ew-resize':'pointer'):'default';return;}
    const h=st.h;
    switch(h.t){
      case 'knob':knobTo(h,h.get()+((st.last.y-p.y)+(p.x-st.last.x))/400);break;
      case 'vf':MS.ch[h.i].fader=clamp((2127-p.y)/292,0,1);mixApply();break;
      case 'hf':{let v=clamp((p.x-970.5)/150,-1,1);if(Math.abs(v)<.03)v=0;MS.xfader=v;mixApply();break;}
      case 'xpad':xpadMove(p);break;
      case 'enc':{st.acc+=(st.last.y-p.y)+(p.x-st.last.x);const n=Math.trunc(st.acc/8);if(n){timeTurn(n);st.acc-=n*8;}break;}
      case 'rot':if(st.a!=null){const a=Math.atan2(p.y-h.cy,p.x-h.cx);let da=a-st.a;if(da>Math.PI)da-=2*Math.PI;if(da<-Math.PI)da+=2*Math.PI;st.a=a;st.acc+=da*180/Math.PI;
        while(Math.abs(st.acc)>=22){rotStep(h,st.acc>0?1:-1);st.acc-=Math.sign(st.acc)*22;}}break;
      case 'sel':if(st.a!=null){const a=Math.atan2(p.y-h.cy,p.x-h.cx);let da=a-st.a;if(da>Math.PI)da-=2*Math.PI;if(da<-Math.PI)da+=2*Math.PI;st.a=a;st.acc+=da*180/Math.PI;
        while(Math.abs(st.acc)>=30){const k=INPUTS.indexOf(MS.ch[h.i].input)+(st.acc>0?1:-1);if(k>=0&&k<INPUTS.length)setInput(h.i,INPUTS[k]);st.acc-=Math.sign(st.acc)*30;}}break;
    }
    st.last=p;
  });
  const up=e=>{const st=ptr.get(e.pointerId);if(!st)return;ptr.delete(e.pointerId);
    if(st.h.t==='hold')st.h.up();if(st.h.t==='xpad')xpadUp();
    if(st.h.t==='sel'&&st.a!=null&&Math.hypot(st.last.x-st.p0.x,st.last.y-st.p0.y)<4){const k=(INPUTS.indexOf(MS.ch[st.h.i].input)+1)%INPUTS.length;setInput(st.h.i,INPUTS[k]);}};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{
    const p=toD(e),h=mixPick(p);if(!h)return;e.preventDefault();const n=wheelSteps('mx'+h.t+(h.cx||h.i||0),e);if(!n)return;
    switch(h.t){
      case 'knob':knobTo(h,h.get()-n*.04);break;
      case 'vf':MS.ch[h.i].fader=clamp(MS.ch[h.i].fader-n*.05,0,1);mixApply();break;
      case 'hf':MS.xfader=clamp(MS.xfader+n*.05,-1,1);mixApply();break;
      case 'sel':{const k=clamp(INPUTS.indexOf(MS.ch[h.i].input)+Math.sign(n),0,INPUTS.length-1);setInput(h.i,INPUTS[k]);break;}
      case 'rot':rotStep(h,Math.sign(n));break;
      case 'enc':timeTurn(-n);break;
    }
  },{passive:false});
  new ResizeObserver(()=>mixResize()).observe(cv);
}
/* ---------- the headphone output: a click on the PHONES socket lists the computer's audio outputs ---------- */
async function openPhones(e){
  const m=$('phMenu');m.hidden=false;
  const r=MXF.cv.getBoundingClientRect(),x=Math.min(window.innerWidth-340,Math.max(8,e.clientX-20)),y=Math.max(8,e.clientY-300);
  m.style.left=x+'px';m.style.top=y+'px';
  await buildPhones(false);
}
async function buildPhones(ask){
  const body=$('phList'),note=$('phNote');body.innerHTML='';note.textContent='';
  if(!phSupport()){note.textContent=say('Ce navigateur ne permet pas d’envoyer le son vers une 2e sortie. Utilise Chrome ou Edge.','This browser cannot send sound to a second output. Use Chrome or Edge.');return;}
  let list=[];
  try{if(ask){const s=await navigator.mediaDevices.getUserMedia({audio:true});s.getTracks().forEach(t=>t.stop());}
    list=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audiooutput'&&d.deviceId!=='communications');}catch(err){note.textContent=say('Accès refusé : ','Access denied: ')+(err.message||err);}
  const named=list.some(d=>d.label);
  const item=(id,label,sub)=>{const b=document.createElement('button');b.type='button';b.className='phItem';b.setAttribute('aria-pressed',MS.phones===id);
    b.innerHTML='<span>'+esc(label)+'</span>'+(sub?'<small>'+esc(sub)+'</small>':'');
    b.onclick=async()=>{const ok=await setPhones(id,label);if(ok){mixToast(id?say('Casque : ','Headphones: ')+label:say('Casque débranché','Headphones unplugged'),2400);closePhones();}};body.appendChild(b);};
  item('',say('Aucun casque','No headphones'),say('on n’entend que le master','only the master is heard'));
  list.forEach((d,k)=>item(d.deviceId,d.label||say('Sortie son ','Audio output ')+(k+1),d.deviceId==='default'?say('sortie par défaut de l’ordinateur','computer default output'):''));
  if(!named){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=say('Afficher toutes les sorties','Show all outputs');b.onclick=()=>buildPhones(true);body.appendChild(b);
    note.textContent=say('Pour donner le nom des sorties, Chrome demande l’accès au micro. Rien n’est enregistré.','To give the outputs’ names, Chrome asks for microphone access. Nothing is recorded.');}
  else note.textContent=say('Choisis la sortie où est branché ton casque, pas celle du master. Évite le Bluetooth : trop de retard pour caler.','Pick the output your headphones are plugged into, not the master one. Avoid Bluetooth: too much delay for cueing.');
}
function closePhones(){$('phMenu').hidden=true;}
