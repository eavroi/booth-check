/* ---------------- browse model: categories, sorting and TRACK FILTER, read from the USB ---------------- */
const COLL=new Intl.Collator(undefined,{sensitivity:'base',numeric:true});
const byTitle=(a,b)=>COLL.compare(a.title,b.title);
const cmpS=(a,b)=>COLL.compare(String(a),String(b));
const CAT_ICON={1:'genre',2:'artist',3:'album',4:'track',5:'bpm',6:'rating',7:'year',8:'remixer',9:'label',10:'orig',11:'key',13:'color',14:'time',15:'bitrate',
  17:'playlist',19:'history',20:'search',21:'comment',22:'date',23:'dj',24:'folder',27:'matching'};
const colName=(id,M)=>(M&&M.colNames&&M.colNames[id])||COLS[id]||'';
/* ----- TRACK FILTER ----- */
const KEYS_ALL=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B','Cm','C#m','Dm','Ebm','Em','Fm','F#m','Gm','G#m','Am','Bbm','Bm'];
const KEYCYCLE=['Abm','B','Ebm','F#','Bbm','Db','Fm','Ab','Cm','Eb','Gm','Bb','Dm','F','Am','C','Em','G','Bm','D','F#m','A','C#m','E'];
function camelotOf(k){const c=CAMELOT[k];if(!c)return null;return {n:parseInt(c),m:c.slice(-1)};}
function relatedKeys(k){const c=camelotOf(k);if(!c)return [k];const out=new Set();
  for(const [dn,m] of [[0,c.m],[1,c.m],[-1,c.m],[0,c.m==='A'?'B':'A']]){const n=((c.n-1+dn+12)%12)+1;for(const [kk,v] of Object.entries(CAMELOT))if(v===n+m)out.add(kk);}return [...out];}
/* the keys of the KEY level, as the firmware writes them: the key, its relative, then its two neighbours (Abm, B, Dbm, Ebm) */
function keyLevels(k){const c=camelotOf(k);if(!c)return [[k]];const nm=(n,m)=>{const v=(((n-1+12)%12)+1)+m;return v==='12A'?'Dbm':(Object.keys(CAMELOT).find(x=>CAMELOT[x]===v&&KEYCYCLE.includes(x))||k);};
  const r=nm(c.n,c.m==='A'?'B':'A'),a=nm(c.n-1,c.m),b=nm(c.n+1,c.m);return [[k],[k,r],[k,r,a,b]];}
/* the tracks whose key fits the MASTER's: their icon turns green (manual p. 33) */
function masterKeys(){const m=BUS.master&&BUS.master.loaded()?BUS.master:null,k=m&&m.cur.tr.key;if(!k)return null;const s=new Set();for(const x of keyLevels(k)[2])s.add(CAMELOT[x]||x);return s;}
const keyFits=(S,k)=>!!(S&&k&&S.has(CAMELOT[k]||k));
function masterKey(){const m=BUS.master&&BUS.master.loaded()?BUS.master:null;return m?m.cur.tr.key:'';}
function activeTags(M){const f=M.filter;if(!f.tags.size||!M.ext)return [];const cats=M.ext.cats.length;return [...f.tags].filter(id=>{const t=M.tagById.get(id);return t&&(!cats||f.catOn.has(t.parent));});}
function filterHasCond(M){if(!M)return false;const f=M.filter;return f.bpm||f.key||f.rating||f.color||activeTags(M).length>0;}
function filterActive(M){return !!M&&M.filter.on&&filterHasCond(M);}
function passFilter(t){
  const M=t.m,f=M.filter;
  if(f.bpm){if(!t.bpm||Math.abs(t.bpm/f.bpmVal-1)*100>f.bpmPct+1e-9)return false;}
  if(f.key){if(!t.key)return false;const ok=f.related?relatedKeys(f.keyVal):[f.keyVal];const c=camelotOf(t.key);
    if(!ok.some(k=>k===t.key||(c&&CAMELOT[k]===CAMELOT[t.key])))return false;}
  if(f.rating&&t.rating<f.ratingVal)return false;
  if(f.color&&f.colors.size&&!f.colors.has(t.colorId))return false;
  const act=activeTags(M);if(act.length){const s=M.ttags.get(t.id);if(!s)return false;let n=0;for(const id of act)if(s.has(id))n++;if(f.and?n<act.length:n===0)return false;}
  return true;
}
function filt(M,arr){return filterActive(M)?arr.filter(passFilter):arr;}
/* ----- sorting of track lists ----- */
const SORTKEY={26:t=>t.title,2:t=>t.artist,3:t=>t.album,5:t=>t.bpm,6:t=>-t.rating,11:t=>KEYCYCLE.indexOf(t.key)<0?99:KEYCYCLE.indexOf(t.key),1:t=>t.genre,13:t=>t.colorId||99,
  21:t=>t.comment,9:t=>t.label,14:t=>t.duration,15:t=>-t.bitrate,22:t=>t.dateAdded,23:t=>-t.playCount,7:t=>t.year,8:t=>t.remixer,10:t=>t.artist};
function sortTracks(arr,col){
  if(!col||col===25)return arr;const f=SORTKEY[col];if(!f)return arr;
  return arr.slice().sort((a,b)=>{const x=f(a),y=f(b);if(typeof x==='number'&&typeof y==='number'){if(x!==y)return x-y;}else{const ex=x===''||x==null,ey=y===''||y==null;if(ex!==ey)return ex?1:-1;const c=cmpS(x,y);if(c)return c;}return byTitle(a,b);});
}
/* value shown in the right column of a track list */
function colValue(t,col){
  switch(col){
    case 21:return t.comment;case 2:return t.artist;case 3:return t.album;case 1:return t.genre;case 9:return t.label;case 8:return t.remixer;
    case 5:return t.bpm?t.bpm.toFixed(2):'';case 11:return keyTxt(t.key);case 6:return '';case 13:return '';case 14:return fmtT(t.duration);
    case 15:return t.bitrate?t.bitrate+'kbps':'';case 22:return t.dateAdded;case 23:return String(t.playCount||0);case 7:return t.year?String(t.year):'';
    case 16:return t.fileName;
  }return '';
}
/* ----- levels ----- */
function grpItems(tracks,keyFn,labelFn,next,sorter,icon){
  const m=new Map();for(const t of tracks){const k=keyFn(t);if(!m.has(k))m.set(k,[]);m.get(k).push(t);}
  const arr=[...m].map(([k,a])=>({kind:'dir',label:labelFn(k,a[0]),icon,_k:k,next:next(k,labelFn(k,a[0]))}));
  arr.sort(sorter||((a,b)=>{const ea=!a._k,eb=!b._k;if(ea!==eb)return ea?1:-1;return cmpS(a.label,b.label);}));return arr;
}
const trackItems=(arr,col)=>sortTracks(arr,col).map(tr=>({kind:'track',tr}));
function plTracks(M,id){return M.lib.entries.filter(x=>x.playlist===id).sort((a,b)=>a.index-b.index).map(x=>M.byId.get(x.track)).filter(Boolean);}
function navTracks(M,e){
  const all=filt(M,M.tracks);
  switch(e.by){
    case 'pl':return filt(M,plTracks(M,e.id));
    case 'hist':{const h=M.hist.find(x=>x.id===e.id);return filt(M,h?h.tracks.map(id=>M.byId.get(id)).filter(Boolean):[]);}
    case 'session':return filt(M,M.session.slice());
    case 'artist':return all.filter(t=>t.artistId===e.id&&(e.album==null||t.albumId===e.album)&&(e.genre==null||t.genreId===e.genre));
    case 'album':return all.filter(t=>t.albumId===e.id).sort((a,b)=>(a.trackNo||0)-(b.trackNo||0)||byTitle(a,b));
    case 'genre':return all.filter(t=>t.genreId===e.id);
    case 'key':return all.filter(t=>t.keyId===e.id);
    case 'keys':return all.filter(t=>e.keys.some(k=>t.key&&(CAMELOT[t.key]||t.key)===(CAMELOT[k]||k)));
    case 'bpmPct':return all.filter(t=>t.bpm&&(e.pct?Math.abs(t.bpm/e.id-1)*100<=e.pct+1e-9:Math.round(t.bpm)===e.id));
    case 'label':return all.filter(t=>t.labelId===e.id);
    case 'color':return all.filter(t=>t.colorId===e.id);
    case 'rating':return all.filter(t=>t.rating===e.id);
    case 'bpm':return all.filter(t=>Math.round(t.bpm)===e.id);
    case 'year':return all.filter(t=>t.year===e.id);
    case 'remixer':return all.filter(t=>t.remixerId===e.id);
    case 'time':return all.filter(t=>Math.floor(t.duration/60)===e.id);
    case 'bitrate':return all.filter(t=>t.bitrate===e.id);
    case 'date':return all.filter(t=>t.dateAdded===e.id);
    case 'dj':return all.filter(t=>(t.playCount||0)===e.id);
    case 'all':return all.slice().sort(byTitle);
  }
  return [];
}
function navMedium(d){const n=d.ui.nav;for(let i=n.length-1;i>=0;i--)if(n[i].m)return n[i].m;return null;}
/* a list is built once and kept while what it depends on stays the same: a big USB is sorted once, not at every frame */
function filterSig(M){if(!filterActive(M))return '';const f=M.filter;return [f.bpm,f.bpmVal,f.bpmPct,f.key,f.keyVal,f.related,f.rating,f.ratingVal,f.color,[...f.colors],f.and,activeTags(M)].join();}
function levelItems(d,e){
  if(e.k==='media'||e.k==='taglist')return levelBuild(d,e);
  const M=e.m||navMedium(d);if(!M||!M.lib)return [];
  const sig=[e.k,e.cat,e.id,e.by,e.album,e.genre,e.path,e.pct,e.keys,e.sortCol,e.k==='search'?d.ui.search.q:'',filterSig(M),M.ver,M.session.length,M.hist.length,M.lib.entries.length,M.lib.playlists.length,SET.keyFmt].join('|');
  let r=M.lv.get(sig);if(!r){if(M.lv.size>80)M.lv.clear();r=levelBuild(d,e);M.lv.set(sig,r);}return r;
}
const rootLabel=m=>mounted().length>1?m.name:'USB';
const rootNav=m=>({k:'root',m,label:rootLabel(m),sel:0,top:0});
function levelBuild(d,e){
  if(e.k==='media')return mounted().map(m=>({kind:'dir',label:rootLabel(m),icon:'usb',media:m,next:{k:'root',m,label:rootLabel(m)}}));
  /* several USB keys: first the device, then its own TAG LIST (manual p. 34-35) */
  if(e.k==='taglist'){const T=tagMedium(d);return T?TAGLIST.filter(x=>x.m===T).map(tr=>({kind:'track',tr})):mounted().map(m=>({kind:'dir',label:m.name,icon:'usb',media:m}));}
  const M=e.m||navMedium(d);if(!M||!M.lib)return [];
  const sortCol=e.sortCol||25;const U=M;
  switch(e.k){
    case 'root':return M.menu.filter(id=>COLS[id]).map(id=>({kind:'dir',label:colName(id,M),cat:id,next:{k:'cat',cat:id,label:colName(id,M)}}));
    case 'cat':{const all=filt(M,M.tracks);
      switch(e.cat){
        case 17:return levelItems(d,{k:'pl',id:0});
        case 4:return trackItems(all.slice().sort(byTitle),sortCol);
        case 2:return grpItems(all,t=>t.artistId,(k,t)=>t.artist||'(unknown artist)',(k,l)=>({k:'artistAlb',id:k,label:l}),null,'artist');
        case 3:return grpItems(all,t=>t.albumId,(k,t)=>t.album||'(unknown album)',(k,l)=>({k:'trk',by:'album',id:k,label:l}),null,'album');
        case 1:return grpItems(all,t=>t.genreId,(k,t)=>t.genre||'(unknown genre)',(k,l)=>({k:'genreArt',id:k,label:l}),null,'genre');
        case 11:return grpItems(all,t=>t.keyId,(k,t)=>keyTxt(t.key)||'(unknown key)',(k,l)=>U.lib.keys[k]?({k:'keyNear',key:U.lib.keys[k],label:l}):({k:'trk',by:'key',id:k,label:l}),(a,b)=>{const ia=KEYCYCLE.indexOf(U.lib.keys[a._k]),ib=KEYCYCLE.indexOf(U.lib.keys[b._k]);return (ia<0?99:ia)-(ib<0?99:ib);},'key').map(x=>({...x,keyName:U.lib.keys[x._k]}));
        case 9:return grpItems(all,t=>t.labelId,(k,t)=>t.label||'(unknown label)',(k,l)=>({k:'trk',by:'label',id:k,label:l}),null,'label');
        case 13:{const arr=[];for(let c=1;c<=8;c++){const n=all.filter(t=>t.colorId===c).length;arr.push({kind:'dir',label:(U.lib.colors[c]||COLNAME[c]),swatch:MEMC[c],icon:'color',next:{k:'trk',by:'color',id:c,label:U.lib.colors[c]||COLNAME[c]}});}return arr;}
        case 6:{const arr=[];for(let r=5;r>=0;r--)arr.push({kind:'dir',label:'',stars:r,icon:'rating',next:{k:'trk',by:'rating',id:r,label:r?'★'.repeat(r):'0'}});return arr;}
        case 5:return grpItems(all.filter(t=>t.bpm),t=>Math.round(t.bpm),k=>k+' bpm',(k,l)=>({k:'bpmNear',id:k,label:l}),(a,b)=>a._k-b._k,'bpm');
        case 7:return grpItems(all,t=>t.year,k=>k?String(k):'(unknown year)',(k,l)=>({k:'trk',by:'year',id:k,label:l}),(a,b)=>b._k-a._k,'year');
        case 8:return grpItems(all,t=>t.remixerId,(k,t)=>t.remixer||'(unknown remixer)',(k,l)=>({k:'trk',by:'remixer',id:k,label:l}),null,'remixer');
        case 14:return grpItems(all,t=>Math.floor(t.duration/60),k=>k+' min',(k,l)=>({k:'trk',by:'time',id:k,label:l}),(a,b)=>a._k-b._k,'time');
        case 15:return grpItems(all,t=>t.bitrate,k=>k?k+'kbps':'(unknown)',(k,l)=>({k:'trk',by:'bitrate',id:k,label:l}),(a,b)=>b._k-a._k,'bitrate');
        case 22:return grpItems(all,t=>t.dateAdded,k=>k||'(unknown)',(k,l)=>({k:'trk',by:'date',id:k,label:l}),(a,b)=>cmpS(b._k,a._k),'date');
        case 23:return grpItems(all,t=>t.playCount||0,k=>String(k),(k,l)=>({k:'trk',by:'dj',id:k,label:l}),(a,b)=>b._k-a._k,'dj');
        case 24:return levelItems(d,{k:'folder',path:'/'});
        case 19:{const L=M.hist.map(h=>({kind:'dir',label:h.name,icon:'history',hist:h.id,next:{k:'trk',by:'hist',id:h.id,label:h.name}}));
          /* a new HISTORY NAME starts again at 001 (manual p. 39) */
          if(M.session.length){const nm=HISTNAME+' '+String(HISTNAME==='HISTORY'?M.hist.length+1:1).padStart(3,'0');L.push({kind:'dir',label:nm,icon:'history',next:{k:'trk',by:'session',label:nm}});}return L;}
        case 20:return [];
        case 27:return [];
      }return [];}
    /* the rows of the KEY and BPM levels, between the category and the tracks */
    case 'keyNear':return keyLevels(e.key).map(L=>{const l=L.map(keyTxt).join(', ');return {kind:'dir',label:l,icon:'key',keyName:e.key,next:{k:'trk',by:'keys',keys:L,label:l}};});
    case 'bpmNear':return [0,1,2,3,4,5,6].map(p=>({kind:'dir',label:'±'+p+'%',icon:'bpm',next:{k:'trk',by:'bpmPct',id:e.id,pct:p,label:e.label+' ±'+p+'%'}}));
    case 'artistAlb':{const tr=filt(M,M.tracks).filter(t=>t.artistId===e.id);
      return [{kind:'dir',label:'ALL',all:true,next:{k:'trk',by:'artist',id:e.id,label:e.label+'-ALL'}}].concat(grpItems(tr,t=>t.albumId,(k,t)=>t.album||'Unknown',(k,l)=>({k:'trk',by:'artist',id:e.id,album:k,label:l}),null,'album'));}
    case 'genreArt':{const tr=filt(M,M.tracks).filter(t=>t.genreId===e.id);
      return [{kind:'dir',label:'ALL',all:true,next:{k:'trk',by:'genre',id:e.id,label:e.label+'-ALL'}}].concat(grpItems(tr,t=>t.artistId,(k,t)=>t.artist||'(unknown artist)',(k,l)=>({k:'trk',by:'artist',id:k,genre:e.id,label:l}),null,'artist'));}
    case 'pl':{const kids=U.lib.playlists.filter(p=>p.parent===e.id).sort((a,b)=>a.sort-b.sort);
      return kids.map(p=>p.isFolder?{kind:'dir',label:p.name,icon:'folder',next:{k:'pl',id:p.id,label:p.name}}:{kind:'dir',label:p.name,icon:'playlist',next:{k:'trk',by:'pl',id:p.id,label:p.name}});}
    case 'trk':return trackItems(navTracks(M,e),sortCol);
    case 'folder':{const dirs=new Map(),files=[];
      for(const t of filt(M,M.tracks)){if(!t.filePath.toLowerCase().startsWith(e.path.toLowerCase()))continue;const rest=t.filePath.slice(e.path.length);const i=rest.indexOf('/');
        if(i>=0){const n=rest.slice(0,i);dirs.set(n,(dirs.get(n)||0)+1);}else files.push(t);}
      return [...dirs.keys()].sort(cmpS).map(n=>({kind:'dir',label:n,icon:'folder',next:{k:'folder',path:e.path+n+'/',label:n}})).concat(trackItems(files.sort(byTitle),sortCol));}
    case 'search':{const q=norm(d.ui.search.q);if(!q)return [];return filt(M,M.tracks).filter(t=>norm(t.title+' '+t.artist+' '+t.album+' '+t.fileName).includes(q)).sort(byTitle).map(tr=>({kind:'track',tr}));}
  }
  return [];
}
const curNav=d=>d.ui.nav[d.ui.nav.length-1];
/* the USB whose TAG LIST is shown; none yet when several are plugged in */
function tagMedium(d){const m=d.ui.tl.m,L=mounted();return m&&m.mounted?m:L.length===1?L[0]:null;}
