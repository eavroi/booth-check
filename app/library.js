/* ---------------- reading the USB (rekordbox export) ---------------- */
/* column ids of the export.pdb "columns" table (16); the menu tables refer to them */
const COLS={1:'GENRE',2:'ARTIST',3:'ALBUM',4:'TRACK',5:'BPM',6:'RATING',7:'YEAR',8:'REMIXER',9:'LABEL',10:'ORIGINAL ARTIST',11:'KEY',12:'CUE',13:'COLOR',
  14:'TIME',15:'BITRATE',16:'FILE NAME',17:'PLAYLIST',18:'HOT CUE BANK',19:'HISTORY',20:'SEARCH',21:'COMMENTS',22:'DATE ADDED',23:'DJ PLAY COUNT',24:'FOLDER',25:'DEFAULT',26:'ALPHABET',27:'MATCHING'};
/* what rekordbox writes when the device has no menu settings */
const DEF_MENU=[17,2,3,4,1,11,5,13,6,24,19,20];
const DEF_SORT=[25,26,2,3,5,6,11];
function b64ToFile(name,b64){const bin=atob(b64);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new File([u],name.split('/').pop());}
/* Squared by Comité d'accueil (Victor's own track): the real audio, fetched when the track is loaded, with its rekordbox analysis (no cue points in it) */
const DEMO_EXTRA=[{title:'Squared',artist:'Comité d’accueil',key:'F#m',bpm:128,duration:346,bitrate:192,sampleRate:44100,depth:16,trimMs:24.5,fileName:'squared.mp3',filePath:'/Contents/squared.mp3',url:'data/squared.mp3',analyzePath:'/PIONEER/USBANLZ/P999/0000SQRD/ANLZ0000.DAT',dateAdded:'2026-10-14'}];
function demoExtra(lib){const nid=o=>Math.max(0,...Object.keys(o).map(Number))+1;
  for(const x of DEMO_EXTRA){const a=nid(lib.artists);lib.artists[a]=x.artist;let k=Object.keys(lib.keys).find(i=>lib.keys[i]===x.key);if(k==null){k=nid(lib.keys);lib.keys[k]=x.key;}
    const id=Math.max(0,...lib.tracks.map(t=>t.id))+1;lib.tracks.push({id,artistId:a,keyId:+k,fileSize:0,artworkId:0,trackNo:0,genreId:0,albumId:0,labelId:0,remixerId:0,playCount:0,year:2026,colorId:0,rating:0,comment:'',mixName:'',autoload:'',...x});
    for(const pl of lib.playlists.filter(p=>!p.isFolder)){const n=lib.entries.filter(e=>e.playlist===pl.id).length;lib.entries.push({index:n+1,track:id,playlist:pl.id});}}}
function demoEntries(){return Object.keys(DEMO.files).map(p=>({file:b64ToFile(p,DEMO.files[p]),path:p}));}
function readMenus(buf){
  const out={menu:[],sort:[],column:0,names:{}};
  let tables;try{tables=parsePdbRaw(buf).tables;}catch(e){return out;}
  const rows=n=>tables.filter(t=>t.type===n).flatMap(t=>t.rows);
  for(const {dv,o} of rows(16)){const id=dv.getUint16(o,true);const s=readStr(dv,o+4).replace(/[￺￻]/g,'');if(s)out.names[id]=s;}
  const m=[];for(const {dv,o} of rows(17)){const id=dv.getUint16(o,true),vis=dv.getUint8(o+5),ord=dv.getUint16(o+6,true);if(ord>0&&vis!==1)m.push([ord,id]);}
  out.menu=m.sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  const s=[];for(const {dv,o} of rows(18)){const id=dv.getUint16(o,true),f=dv.getUint8(o+4),ord=dv.getUint8(o+5);if(f!==1&&ord>0)s.push([ord,id]);if(f===2)out.column=id;}
  out.sort=s.sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  /* history playlists (11) and their entries (12) */
  out.hist=[];for(const {dv,o} of rows(11))out.hist.push({id:dv.getUint32(o,true),name:readStr(dv,o+4),tracks:[]});
  const he=rows(12).map(({dv,o})=>({track:dv.getUint32(o,true),pl:dv.getUint32(o+4,true),idx:dv.getUint32(o+8,true)}));
  for(const h of out.hist)h.tracks=he.filter(e=>e.pl===h.id).sort((a,b)=>a.idx-b.idx).map(e=>e.track);
  /* the USB itself (table 19): counter, colour (BACKGROUND COLOR), date, name. Old rows stay in the page, only the live one counts */
  out.vol=null;for(const {dv,o} of rows(19)){const v={n:dv.getUint32(o+4,true),bg:dv.getUint8(o+9),date:readStr(dv,o+12),name:readStr(dv,o+30)};if(!out.vol||v.n>out.vol.n)out.vol=v;}
  return out;
}
class Medium{constructor(){Object.assign(this,{id:0,name:'USB',idx:new Map(),hasContents:false,lib:null,ext:null,tracks:[],byId:new Map(),tagById:new Map(),ttags:new Map(),
  demo:false,mounted:true,menu:[],sortMenu:[],column:0,colNames:{},hist:[],session:[],artImg:new Map(),anCache:new Map(),lv:new Map(),ver:0,setFound:[],setFiles:{},setValues:{},filter:newFilter(),bg:0,bg0:0,date:'',used:0});}}
let MEDIA_SEQ=0;
async function loadUsb(list,isDemo,onInfo){
  const pdb=list.find(e=>/(^|\/)pioneer\/rekordbox\/export\.pdb$/i.test(e.path));
  if(!pdb){onInfo({err:'nopdb'});return null;}
  const cut=pdb.path.toLowerCase().lastIndexOf('pioneer/rekordbox/export.pdb'),prefix=pdb.path.slice(0,cut);
  const m=new Medium();m.id=++MEDIA_SEQ;
  for(const e of list){if(!e.path.startsWith(prefix))continue;const k='/'+norm(e.path.slice(prefix.length));m.idx.set(k,e.file);m.used+=e.file.size||0;if(k.startsWith('/contents/'))m.hasContents=true;}
  const nAudio=[...m.idx.keys()].filter(k=>k.startsWith('/contents/')).length;
  let menus;
  try{const b=new Uint8Array(await pdb.file.arrayBuffer());m.lib=parseExport(b);menus=readMenus(b);}
  catch(e){onInfo({err:'pdb',msg:e.message});return null;}
  const ef=m.idx.get('/pioneer/rekordbox/exportext.pdb');
  if(ef){try{m.ext=parseExt(new Uint8Array(await ef.arrayBuffer()));}catch(e){m.ext=null;}}
  const lib=m.lib,ext=m.ext;
  m.demo=!!isDemo;
  const folder=isDemo?'DEMO':(prefix.replace(/\/$/,'').split('/').pop()||'USB');m.folder=folder;
  if(isDemo)demoExtra(lib);
  m.tracks=lib.tracks.map(t=>{
    t.m=m;t.artist=lib.artists[t.artistId]||'';const al=lib.albums[t.albumId];t.album=al?al.name:'';
    t.genre=lib.genres[t.genreId]||'';t.key=lib.keys[t.keyId]||'';t.label=lib.labels[t.labelId]||'';t.remixer=lib.artists[t.remixerId]||'';
    t.fileKey=norm(t.filePath);t.ext=(t.fileName.split('.').pop()||'').toLowerCase();t.title=t.title||t.fileName||('#'+t.id);t.played=false;t.playT=0;return t;});
  m.byId=new Map(m.tracks.map(t=>[t.id,t]));
  if(ext){for(const t of ext.tags)m.tagById.set(t.id,t);for(const tt of ext.trackTags){if(!m.ttags.has(tt.track))m.ttags.set(tt.track,new Set());m.ttags.get(tt.track).add(tt.tag);}}
  if(isDemo&&ext&&ext.tags.length>3){const f=n=>{const g=ext.tags.find(x=>x.name===n);return g?g.id:null;};const mk=a=>new Set(a.map(f).filter(x=>x!=null));m.ttags.set(1,mk(['Techno','Synth','Peak Time']));m.ttags.set(2,mk(['Acid House','Beat','Lounge']));}
  m.menu=menus.menu.length?menus.menu:DEF_MENU;m.sortMenu=menus.sort.length?menus.sort:DEF_SORT;m.column=menus.column||0;m.colNames=menus.names;m.hist=menus.hist;
  /* My Settings written by rekordbox on this key; read only now, when the key is plugged in */
  const sf={};for(const [k2,p] of [['my','/pioneer/mysetting.dat'],['my2','/pioneer/mysetting2.dat'],['dev','/pioneer/devsetting.dat'],['djm','/pioneer/djmmysetting.dat']]){const f=m.idx.get(p);if(f){try{sf[k2]=new Uint8Array(await f.arrayBuffer());}catch(e){}}}
  /* the name, colour and date of the USB are in export.pdb (table 19); without them, the folder */
  const vol=menus.vol;if(vol){m.bg=m.bg0=vol.bg<BGCOL.length?vol.bg:0;m.date=vol.date;}
  let nm=(vol&&vol.name)||folder;let base=nm,k=2;while(MEDIA.some(x=>x.name===nm&&x.mounted))nm=base+' ('+(k++)+')';m.name=nm;
  /* TRACK FILTER conditions saved by rekordbox on the key (RBFLTR.DAT): only the BPM range is decoded with confidence */
  const rf=m.idx.get('/pioneer/rekordbox/rbfltr.dat');if(rf){try{const b=new Uint8Array(await rf.arrayBuffer());const r=readRbfltr(b);if(r){m.filter.bpmVal=r.bpm;m.filter.bpmPct=r.pct;m.rbfltr=r;}}catch(e){}}
  const ps=parseSettings({my:sf.my,my2:sf.my2,dev:sf.dev});m.setFound=ps.found;m.setFiles=sf;m.setValues=ps.values;
  /* the real key replaces the built-in example */
  if(!isDemo){for(let i=MEDIA.length-1;i>=0;i--)if(MEDIA[i].demo){unmount(MEDIA[i]);MEDIA.splice(i,1);}}
  MEDIA.push(m);RM=m;
  applyMediumSettings(m);
  /* what the top bar shows about the key (rendered in the page language by main.js) */
  m.info={demo:!!isDemo,name:m.name,tracks:m.tracks.length,playlists:lib.playlists.filter(p=>!p.isFolder).length,tags:ext?ext.tags.length:0,
    audio:m.hasContents?nAudio:null,settings:ps.found.length>0,keys:mounted().length};
  onInfo(m.info);
  return m;
}
function readRbfltr(b){
  const dv=new DataView(b.buffer,b.byteOffset,b.byteLength);
  for(let o=0;o+8<=b.length;o++){if(b[o]!==0x46||b[o+1]!==0x43||b[o+2]!==0x4e||b[o+3]!==0x44)continue;
    const len=dv.getUint32(o+8);if(len<24||o+len>b.length)continue;
    const lo=dv.getUint32(o+len-8),hi=dv.getUint32(o+len-4);
    if(lo>=2000&&hi<=40000&&lo<hi){const bpm=Math.round((lo+hi)/20)/10,pct=Math.round((hi-lo)/(hi+lo)*100);if(pct>=0&&pct<=6)return {bpm,pct};}}
  return null;
}
/* a 2nd USB leaves the settings as they are, and a player that is playing keeps its tempo */
function applyMediumSettings(m){USBCOMM=now()+1;if(mounted().some(x=>x!==m))return;resetSettings();for(const [k,v] of Object.entries(m.setValues||{})){SET[k]=v;SETSRC[k]='usb';}for(const d of DECKS)if(!d.playing)d.applySettings();}
function unmount(m){m.mounted=false;for(const d of DECKS){if(d.cur&&d.cur.tr.m===m)d.eject();const u=d.ui;if(u.nav.some(n=>n.m===m)){u.nav=[{k:'media',sel:0,top:0}];u.browsed=false;if(u.scr!=='play')u.scr='play';}d.dirty=true;}
  for(let i=TAGLIST.length-1;i>=0;i--)if(TAGLIST[i].m===m)TAGLIST.splice(i,1);}
/* artwork thumbnails, decoded once */
function artFor(t){
  const M=t&&t.m;if(!t||!t.artworkId||!M||!M.lib)return null;
  if(M.artImg.has(t.artworkId))return M.artImg.get(t.artworkId);
  M.artImg.set(t.artworkId,null);
  const p=M.lib.artwork[t.artworkId];const f=p?M.idx.get(norm(p)):null;
  if(f)createImageBitmap(f).then(b=>M.artImg.set(t.artworkId,b)).catch(()=>{});
  return null;
}
/* ---------------- analysis files (ANLZ) ---------------- */
const rgbCss=(r,g,b)=>'rgb('+r+','+g+','+b+')';
function normCues(list){
  const out=[];
  for(const c of list){
    if(c.time===0xFFFFFFFF||c.time>86400000)continue;
    const isLoop=c.type===2&&c.loopEnd>c.time&&c.loopEnd!==0xFFFFFFFF;
    const rgb=c.rgb&&(c.rgb[0]|c.rgb[1]|c.rgb[2])?c.rgb.slice():null;
    out.push({hot:c.hot,time:c.time/1000,end:isLoop?c.loopEnd/1000:null,active:!!c.active,name:c.comment||'',rgb,color:c.hot>0?(rgb?rgbCss(...rgb):null):(MEMC[c.colorId]||null),colorId:c.colorId||0});
  }
  return out.sort((a,b)=>a.time-b.time);
}
/* overview (400 columns). RGB and blue are reduced the same way from the detailed waveforms, so both have the same height */
function makeOverview(a){
  const h=new Uint8Array(400),c=new Uint8Array(1200);
  if(a.colorDetail&&a.colorDetail.length>400){
    const d=a.colorDetail,n=d.length;
    for(let i=0;i<400;i++){const f=Math.floor(i*n/400),t=Math.max(f+1,Math.floor((i+1)*n/400));let mh=0,sr=0,sg=0,sb=0,sw=0;
      for(let j=f;j<t;j++){const v=d[j],hh=(v>>2)&31;if(hh>mh)mh=hh;const w=hh+1;sr+=((v>>13)&7)*w;sg+=((v>>10)&7)*w;sb+=((v>>7)&7)*w;sw+=w;}
      h[i]=mh;c[i*3]=Math.round(sr/sw*255/7);c[i*3+1]=Math.round(sg/sw*255/7);c[i*3+2]=Math.round(sb/sw*255/7);}
    return {h,c};}
  if(a.detail&&a.detail.length>400){
    const d=a.detail,n=d.length;
    for(let i=0;i<400;i++){const f=Math.floor(i*n/400),t=Math.max(f+1,Math.floor((i+1)*n/400));let mh=0,ws=0,wn=0;
      for(let j=f;j<t;j++){const v=d[j],hh=v&31;if(hh>mh)mh=hh;ws+=(v>>5)*(hh+1);wn+=hh+1;}
      const w=wn?ws/wn/7:0;h[i]=mh;c[i*3]=Math.round(50+140*w);c[i*3+1]=Math.round(120+110*w);c[i*3+2]=Math.round(225+30*w);}
    return {h,c};}
  if(a.pv&&a.pv.length>=400){let mx=1;for(let i=0;i<400;i++)mx=Math.max(mx,a.pv[i]&31);
    for(let i=0;i<400;i++){const b=a.pv[i];h[i]=Math.round((b&31)*31/mx);const w=(b>>5)/7;c[i*3]=Math.round(50+140*w);c[i*3+1]=Math.round(120+110*w);c[i*3+2]=Math.round(225+30*w);}return {h,c};}
  return null;
}
function demoCues(an){
  const b=an.beats;if(b.length<140)return [];
  const at=i=>b[Math.min(i,b.length-1)].t;
  return [{hot:0,type:1,time:at(0),loopEnd:0,comment:'Intro',colorId:5},{hot:0,type:1,time:at(64),loopEnd:0,comment:'Drop',colorId:2},{hot:0,type:1,time:at(128),loopEnd:0,comment:'Break',colorId:7},
    {hot:1,type:1,time:at(0),loopEnd:0,comment:'Start',colorId:0,rgb:[40,226,20]},{hot:2,type:1,time:at(64),loopEnd:0,comment:'Drop',colorId:0,rgb:[255,18,123]},{hot:3,type:2,time:at(96),loopEnd:at(104),comment:'Loop 8',colorId:0,rgb:[255,160,0]}];
}
async function readAnlz(path,M){const f=(M||RM).idx.get(norm(path));if(!f)return null;return parseAnlz(new Uint8Array(await f.arrayBuffer()));}
function getAnalysis(tr){
  const U=tr.m;
  if(U.anCache.has(tr.id))return U.anCache.get(tr.id);
  const p=(async()=>{
    const out={hasDat:false,hasExt:false,beats:[],cueList:[],detail:null,colorDetail:null};
    let cues=[],cues2=[],pv=null;
    try{const a=await readAnlz(tr.analyzePath,U);if(a){out.hasDat=true;out.beats=a.beats;cues=a.cues;pv=a.preview;}}catch(e){}
    try{const b=await readAnlz(tr.analyzePath.replace(/\.DAT$/i,'.EXT'),U);if(b){out.hasExt=true;out.colorDetail=b.colorDetail;out.detail=b.detail;cues2=b.cues2;}}catch(e){}
    let list=cues2.length?cues2:cues;
    /* active loop (set in rekordbox): the entry of the first cue list has status 4 */
    const act=new Set(cues.filter(c=>c.status===4).map(c=>c.time));for(const c of list)c.active=c.status===4||act.has(c.time);
    if(U.demo&&!list.length&&!tr.url)list=demoCues(out);
    out.cueList=normCues(list);
    out.ovRgb=makeOverview({colorDetail:out.colorDetail});out.ovBlue=makeOverview({detail:out.detail})||makeOverview({pv});if(!out.ovRgb)out.ovRgb=out.ovBlue;if(!out.ovBlue)out.ovBlue=out.ovRgb;
    return out;})();
  U.anCache.set(tr.id,p);
  if(U.anCache.size>40){const k=U.anCache.keys().next().value;U.anCache.delete(k);}
  return p;
}
