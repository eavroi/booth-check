/* ---------------- USB check (report) ----------------
   Every check has a level (bad = problem, warn = warning, info = note, ok), a category, a title, an explanation,
   an optional fix and the list of tracks or files concerned. Texts follow the page language. */
let LAST_R=null,LAST_RM=null,REP_FILTER='all',REP_TEXT='';
function realKey(){return !!(RM&&!RM.demo);}
function showReportEmpty(){$('repBadge').hidden=true;$('rEmpty').hidden=false;$('rBody').hidden=true;LAST_R=null;REP_TEXT='';}
async function runScan(){
  if(!realKey()){showReportEmpty();return;}
  $('rEmpty').hidden=true;$('rBody').hidden=false;
  const tok=RM.scan={n:0};const tracks=RM.tracks.slice();const R={noDat:[],noExt:[],noBeats:[],noCue:[],noHot:[],unnamed:0,memTot:0,hotTot:0,hotDH:[],colorWf:0,cueTracks:0};
  $('repBadge').hidden=true;$('scanFill').style.width='0%';$('scanTxt').textContent=say('Lecture des fichiers ANLZ…','Reading the ANLZ files…');
  for(let i=0;i<tracks.length;i+=16){
    if(RM.scan!==tok)return;
    await Promise.all(tracks.slice(i,i+16).map(async t=>{
      let dat=null,ext=null;
      try{dat=await readAnlz(t.analyzePath);}catch(e){}
      try{ext=await readAnlz(t.analyzePath.replace(/\.DAT$/i,'.EXT'));}catch(e){}
      if(!dat)R.noDat.push(t);if(!ext)R.noExt.push(t);
      if(dat&&!dat.beats.length||!t.bpm)R.noBeats.push(t);
      if(ext&&ext.colorDetail)R.colorWf++;
      const list=normCues((ext&&ext.cues2.length)?ext.cues2:(dat?dat.cues:[]));
      const mem=list.filter(c=>!c.hot),hot=list.filter(c=>c.hot);
      R.memTot+=mem.length;R.hotTot+=hot.length;if(!mem.length)R.noCue.push(t);if(!hot.length)R.noHot.push(t);
      R.unnamed+=mem.filter(c=>!c.name).length;if(hot.some(c=>c.hot>3))R.hotDH.push(t);
    }));
    $('scanFill').style.width=Math.round(Math.min(tracks.length,i+16)/tracks.length*100)+'%';
  }
  if(RM.scan!==tok)return;
  RM.scan.done=true;$('scanFill').style.width='100%';
  LAST_R=R;LAST_RM=RM;renderReport(R);
}
function rerenderReport(){if(!realKey()){showReportEmpty();return;}if(LAST_R&&LAST_RM===RM&&RM.scan&&RM.scan.done)renderReport(LAST_R);}
function chk(level,cat,title,detail,fix,list,n){return {level,cat,title,detail,fix:fix||'',list:list||[],n:n!=null?n:(list&&list.length?list.length:null)};}
const LVL={bad:['Problème','Problem'],warn:['Avertissement','Warning'],info:['Remarque','Note'],ok:['OK','OK']};
const LVLS={bad:['Problèmes','Problems'],warn:['Avertissements','Warnings'],info:['Remarques','Notes'],ok:['OK','OK']};
const CAT={db:['Base de données','Database'],audio:['Fichiers audio','Audio files'],anlz:['Analyses','Analysis'],cues:['Cues','Cues'],set:['My Settings','My Settings'],meta:['Métadonnées','Metadata'],tool:['Outil','Tool']};
const pickL=a=>a[LANG==='en'?1:0];
function buildChecks(R){
  const T=RM.tracks,L=RM.lib,E=RM.ext,c=[];const nPl=L.playlists.filter(p=>!p.isFolder).length;
  c.push(chk('ok','db',say('export.pdb lu','export.pdb read'),
    say(T.length+' morceaux, '+nPl+' playlists'+(L.warn.length?' ('+L.warn.length+' avertissement(s) de lecture)':'')+'.',T.length+' tracks, '+nPl+' playlists'+(L.warn.length?' ('+L.warn.length+' read warning(s))':'')+'.')));
  if(RM.hasContents){
    const miss=T.filter(t=>!RM.idx.has(t.fileKey));
    c.push(miss.length?chk('bad','audio',say('Fichiers audio introuvables dans Contents','Audio files missing from Contents'),
      say('Le chemin enregistré dans export.pdb ne mène à aucun fichier. Le morceau apparaît dans BROWSE mais ne peut pas être lu.','The path stored in export.pdb leads to no file. The track shows in BROWSE but cannot be played.'),
      say('Relocaliser les fichiers dans rekordbox, puis réexporter les playlists concernées.','Relocate the files in rekordbox, then re-export the playlists concerned.'),miss.map(t=>t.filePath))
      :chk('ok','audio',say('Tous les fichiers audio sont présents','All audio files are present'),say('Chaque morceau de export.pdb a son fichier dans Contents.','Every track in export.pdb has its file in Contents.')));
  }else c.push(chk('info','audio',say('Dossier Contents non sélectionné','Contents folder not selected'),
    say('Sans l’audio, la lecture est simulée ; waveforms, cues et tags restent testables.','Without the audio, playback is simulated; waveforms, cues and tags can still be checked.'),
    say('Sélectionner la racine de la clé (PIONEER et Contents).','Select the root of the USB (PIONEER and Contents).')));
  const bad=T.filter(t=>['ogg','opus','wma','mka','ape'].includes(t.ext));
  if(bad.length)c.push(chk('bad','audio',say('Formats non lus par les CDJ (.ogg, .opus, .wma…)','Formats CDJs cannot play (.ogg, .opus, .wma…)'),
    say('Formats lus : MP3, AAC (M4A), WAV, AIFF, et FLAC/ALAC selon le firmware.','Playable formats: MP3, AAC (M4A), WAV, AIFF, and FLAC/ALAC depending on firmware.'),
    say('Convertir ces fichiers dans un format lu, puis réexporter.','Convert these files to a playable format, then re-export.'),bad.map(t=>t.filePath)));
  const fl=T.filter(t=>['flac','alac'].includes(t.ext));
  if(fl.length)c.push(chk('info','audio',say('Fichiers FLAC / ALAC (dépend du firmware)','FLAC / ALAC files (firmware dependent)'),
    say('Supportés seulement avec un firmware récent.','Supported only with a recent firmware.'),say('Vérifier la version du firmware de la platine.','Check the player’s firmware version.'),fl.map(t=>t.filePath)));
  const long=T.filter(t=>t.filePath.length>200);
  if(long.length)c.push(chk('warn','audio',say('Chemins de plus de 200 caractères','Paths longer than 200 characters'),
    say('Risque de problème de lecture sur la platine.','May cause reading problems on the player.'),say('Raccourcir les noms de dossiers.','Shorten the folder names.'),long.map(t=>t.filePath)));
  c.push(R.noDat.length?chk('bad','anlz',say('Morceaux sans analyse (ANLZ .DAT)','Tracks without analysis (ANLZ .DAT)'),
      say('Pas de waveform ni de beatgrid sur la clé pour ces morceaux.','No waveform and no beatgrid on the USB for these tracks.'),say('Analyser dans rekordbox puis réexporter.','Analyse in rekordbox, then re-export.'),R.noDat.map(t=>t.title))
    :chk('ok','anlz',say('Fichiers ANLZ .DAT présents pour tous les morceaux','ANLZ .DAT files present for every track'),say('Waveform de base et beatgrid.','Basic waveform and beatgrid.')));
  if(R.noExt.length)c.push(chk('warn','anlz',say('Morceaux sans fichier ANLZ .EXT','Tracks without an ANLZ .EXT file'),
    say('Pas de waveform couleur détaillée, ni de noms et couleurs de cues sur la platine.','No detailed colour waveform, no cue names or colours on the player.'),say('Réexporter ces morceaux depuis rekordbox.','Re-export these tracks from rekordbox.'),R.noExt.map(t=>t.title)));
  if(R.noBeats.length)c.push(chk('warn','anlz',say('Morceaux sans BPM ou beatgrid','Tracks without BPM or beatgrid'),
    say('SYNC, Quantize et le compteur de mesures ne fonctionnent pas correctement.','SYNC, Quantize and the bar counter do not work properly.'),say('Corriger le beatgrid dans rekordbox puis réexporter.','Fix the beatgrid in rekordbox, then re-export.'),R.noBeats.map(t=>t.title)));
  if(!R.noCue.length)c.push(chk('ok','cues',say('Tous les morceaux ont au moins un memory cue','Every track has at least one memory cue'),
    say(R.memTot+' memory cues au total, dont '+R.unnamed+' sans nom.',R.memTot+' memory cues in total, '+R.unnamed+' without a name.')));
  else c.push(chk(R.noCue.length===T.length?'warn':'info','cues',say('Morceaux sans memory cue','Tracks without memory cue'),
    say(R.memTot+' memory cues au total, dont '+R.unnamed+' sans nom. Les noms et couleurs aident à repérer intro, drop et break sur l’écran.',R.memTot+' memory cues in total, '+R.unnamed+' without a name. Names and colours help spot intro, drop and break on the screen.'),'',R.noCue.map(t=>t.title),R.noCue.length));
  c.push(R.noHot.length?chk('info','cues',say('Morceaux sans hot cue','Tracks without hot cue'),say(R.hotTot+' hot cues au total.',R.hotTot+' hot cues in total.'),'',R.noHot.map(t=>t.title))
    :chk('ok','cues',say('Tous les morceaux ont au moins un hot cue','Every track has at least one hot cue'),say(R.hotTot+' hot cues au total.',R.hotTot+' hot cues in total.')));
  if(RM.setFound.length){const Ls=SETDEF.filter(d=>SETSRC[d[0]]==='usb').map(d=>d[1]+' : '+d[2][SET[d[0]]]);
    c.push(chk('ok','set',say('My Settings présents sur la clé','My Settings present on the USB'),
      say('La platine reprend ces réglages (','The player uses these settings (')+RM.setFound.map(k=>({my:'MYSETTING.DAT',my2:'MYSETTING2.DAT',dev:'DEVSETTING.DAT'})[k]).join(', ')+').','',Ls,null));
    if(SET.hcAuto===0)c.push(chk('warn','set','HOT CUE AUTO LOAD = OFF',
      say('Les hot cues ne se chargent pas automatiquement : rappel (CALL) nécessaire à chaque morceau.','Hot cues are not loaded automatically: CALL needed on every track.'),
      say('rekordbox : Préférences › My Settings › HOT CUE AUTO LOAD = ON, puis réexporter (ou dans UTILITY sur la platine).','rekordbox: Preferences › My Settings › HOT CUE AUTO LOAD = ON, then re-export (or in UTILITY on the player).')));
    if(SET.hcColor===0)c.push(chk('warn','set','HOT CUE COLOR = OFF',
      say('Pads et repères de hot cue en vert (cue) / orange (loop) au lieu des couleurs rekordbox.','Hot cue pads and markers in green (cue) / orange (loop) instead of the rekordbox colours.'),
      say('rekordbox : Préférences › My Settings › HOT CUE COLOR = ON, puis réexporter (ou dans UTILITY sur la platine).','rekordbox: Preferences › My Settings › HOT CUE COLOR = ON, then re-export (or in UTILITY on the player).')));
    if(SET.ejectLock===1)c.push(chk('info','set','EJECT/LOAD LOCK = LOCK',say('Chargement d’un autre morceau impossible pendant la lecture.','Loading another track is impossible while playing.')));
  }else c.push(chk('info','set',say('Pas de My Settings (MYSETTING.DAT absent)','No My Settings (MYSETTING.DAT missing)'),
    say('La platine garde ses propres réglages.','The player keeps its own settings.'),say('rekordbox : Préférences › My Settings, puis exporter vers la clé.','rekordbox: Preferences › My Settings, then export to the USB.')));
  if(E&&E.tags.length){
    const un=T.filter(t=>!(RM.ttags.get(t.id)||{size:0}).size);
    c.push(un.length?chk(un.length>T.length*.5?'warn':'info','meta',say('Morceaux sans My Tag','Tracks without My Tag'),
        say(E.tags.length+' My Tags dans '+E.cats.length+' catégories. Un morceau sans tag n’apparaît jamais dans TRACK FILTER.',E.tags.length+' My Tags in '+E.cats.length+' categories. A track without a tag never shows in TRACK FILTER.'),'',un.map(t=>t.title))
      :chk('ok','meta',say('Tous les morceaux ont au moins un My Tag','Every track has at least one My Tag'),say(E.tags.length+' My Tags dans '+E.cats.length+' catégories.',E.tags.length+' My Tags in '+E.cats.length+' categories.')));
    const unused=E.tags.filter(g=>![...RM.ttags.values()].some(s=>s.has(g.id)));
    if(unused.length)c.push(chk('info','meta',say('My Tags jamais utilisés','My Tags never used'),say('Visibles dans le filtre, mais sans résultat.','Shown in the filter, but they find nothing.'),'',unused.map(g=>g.name)));
  }else c.push(chk('warn','meta',say('Aucun My Tag dans l’export','No My Tag in the export'),
    say('exportExt.pdb absent ou vide : TRACK FILTER ne propose rien sur la platine.','exportExt.pdb missing or empty: TRACK FILTER offers nothing on the player.'),
    say('Assigner les tags dans rekordbox puis réexporter.','Assign the tags in rekordbox, then re-export.')));
  const nk=T.filter(t=>!t.key),ng=T.filter(t=>!t.genre);
  if(nk.length)c.push(chk('info','meta',say('Morceaux sans tonalité','Tracks without key'),say('Ignorés par le tri et la recherche par KEY.','Ignored by sorting and searching by KEY.'),'',nk.map(t=>t.title)));
  if(ng.length)c.push(chk('info','meta',say('Morceaux sans genre','Tracks without genre'),say('Classés sans genre dans le menu GENRE.','Listed without genre in the GENRE menu.'),'',ng.map(t=>t.title)));
  const seen=new Map(),dup=[];for(const t of T){const k=norm(t.artist+'|'+t.title);if(seen.has(k))dup.push(t);else seen.set(k,1);}
  if(dup.length)c.push(chk('info','meta',say('Doublons probables','Probable duplicates'),say('Même artiste et même titre.','Same artist and same title.'),'',dup.map(t=>t.artist+' — '+t.title)));
  const rank={bad:0,warn:1,info:2,ok:3};c.sort((a,b)=>rank[a.level]-rank[b.level]);
  return c;
}
function limitsList(){return [
  chk('info','tool',say('Format de la clé (FAT32, exFAT, MBR, GPT)','USB format (FAT32, exFAT, MBR, GPT)'),
    say('Un navigateur ne voit ni le système de fichiers ni le schéma de partition.','A browser cannot see the file system or the partition scheme.'),
    say('Windows : Gestion des disques, clic droit sur la clé, Propriétés. FAT32 en MBR pour une NXS2 (exFAT n’est pas lu par tous les firmwares).','Windows: Disk Management, right-click the USB, Properties. FAT32 with MBR for an NXS2 (exFAT is not read by every firmware).')),
  chk('info','tool',say('Fidélité de la simulation','Simulation accuracy'),
    say('Reproduction du comportement de la platine d’après le manuel et les données exportées, pas une émulation du firmware. Le tempo change aussi la hauteur du son (MASTER TEMPO n’est qu’un voyant ici), et AIFF n’est pas décodable dans tous les navigateurs.','A reproduction of the player’s behaviour from the manual and the exported data, not a firmware emulation. Tempo also changes the pitch (MASTER TEMPO is only an indicator here), and AIFF cannot be decoded in every browser.')),
  chk('info','tool',say('Pas d’écriture sur la clé','No writing to the USB'),
    say('Les cues, memory cues et tags posés ici ne sont jamais enregistrés.','Cues, memory cues and tags set here are never saved.'))];}
function rowHtml(c,open){
  const lab=pickL(LVL[c.level]);
  const more='<p>'+esc(c.detail)+'</p>'+(c.fix?'<p><b>'+esc(say('Correction :','Fix:'))+'</b> '+esc(c.fix)+'</p>':'')+
    (c.list.length?'<ul>'+c.list.slice(0,300).map(x=>'<li>'+esc(x)+'</li>').join('')+(c.list.length>300?'<li>… '+esc(say('et '+(c.list.length-300)+' autres','and '+(c.list.length-300)+' more'))+'</li>':'')+'</ul>':'');
  return '<details class="rrow"'+(open?' open':'')+'><summary class="rgrid"><span class="lvl '+c.level+'"><span class="dot '+c.level+'"></span>'+esc(lab)+'</span><span class="cat">'+esc(pickL(CAT[c.cat]))+'</span><span class="ttl">'+esc(c.title)+'</span><span class="num">'+(c.n!=null?c.n:'—')+'</span></summary><div class="more">'+more+'</div></details>';
}
function headHtml(){return '<div class="rgrid rth" role="row"><span>'+esc(say('Niveau','Level'))+'</span><span class="cat">'+esc(say('Catégorie','Category'))+'</span><span>'+esc(say('Vérification','Check'))+'</span><span style="text-align:right">'+esc(say('Éléments','Items'))+'</span></div>';}
function renderReport(R){
  $('rEmpty').hidden=true;$('rBody').hidden=false;
  const T=RM.tracks,L=RM.lib,E=RM.ext,checks=buildChecks(R);
  const cnt={bad:0,warn:0,info:0,ok:0};for(const c of checks)cnt[c.level]++;
  const nb=cnt.bad+cnt.warn;const bd=$('repBadge');bd.hidden=false;bd.textContent=nb?String(nb):'✓';bd.className='badge'+(nb?'':' ok');bd.title=nb?say(nb+' problème(s) ou avertissement(s)',nb+' problem(s) or warning(s)'):say('Aucun problème','No problem');
  $('scanTxt').textContent=say('Analyse terminée sur '+T.length+' morceaux.','Scan done on '+T.length+' tracks.');
  const files=[['export.pdb',true],['exportExt.pdb',!!E],['USBANLZ',T.length>R.noDat.length],['MYSETTING.DAT',RM.setFound.includes('my')]].filter(f=>f[1]).map(f=>f[0]);
  $('rFiles').textContent=(RM.demo?say('Exemple intégré','Built-in demo'):RM.name)+' · '+files.join(' · ');
  $('stats').innerHTML=[[T.length,say('Morceaux','Tracks')],[L.playlists.filter(p=>!p.isFolder).length,'Playlists'],[E?E.tags.length:0,'My Tags'],[R.memTot,'Memory cues'],[R.hotTot,'Hot cues'],[R.colorWf+'/'+T.length,say('Waveform couleur (PWV5)','Colour waveform (PWV5)')]]
    .map(s=>'<div class="stat"><b>'+esc(s[0])+'</b><span>'+esc(s[1])+'</span></div>').join('');
  const fb=(k,label,n)=>'<button type="button" data-f="'+k+'" aria-pressed="'+(REP_FILTER===k)+'">'+(k!=='all'?'<span class="dot '+k+'"></span>':'')+esc(label)+' · '+n+'</button>';
  $('rFilters').setAttribute('aria-label',say('Filtrer par niveau','Filter by level'));
  $('rFilters').innerHTML=fb('all',say('Tout','All'),checks.length)+['bad','warn','info','ok'].map(k=>fb(k,pickL(LVLS[k]),cnt[k])).join('');
  $('rFilters').onclick=e=>{const b=e.target.closest('button');if(!b)return;REP_FILTER=b.dataset.f;renderReport(R);};
  const shown=checks.filter(c=>REP_FILTER==='all'||c.level===REP_FILTER);
  $('checks').innerHTML=headHtml()+(shown.length?shown.map(c=>rowHtml(c,c.level==='bad')).join(''):'<div class="rrow" style="padding:14px 16px;color:var(--dim)">'+esc(say('Rien à afficher pour ce niveau.','Nothing to show for this level.'))+'</div>');
  $('limits').innerHTML=headHtml()+limitsList().map(c=>rowHtml(c,false)).join('');
  /* plain-text copy of the whole report */
  REP_TEXT=['Booth Check · '+say('Contrôle de la clé','USB check')+' · '+$('rFiles').textContent,''].concat(checks.map(c=>
    '['+pickL(LVL[c.level])+'] '+pickL(CAT[c.cat])+' · '+c.title+(c.n!=null?' ('+c.n+')':'')+'\n  '+c.detail+(c.fix?'\n  '+say('Correction : ','Fix: ')+c.fix:'')+(c.list.length?'\n'+c.list.slice(0,300).map(x=>'  - '+x).join('\n'):''))).join('\n');
}
function wireReport(){
  $('rLoad').onclick=()=>$('pick').click();
  $('rRun').onclick=()=>{if(RM)runScan();};
  $('rCopy').onclick=async()=>{const t=REP_TEXT;if(!t)return;let ok=false;
    try{await navigator.clipboard.writeText(t);ok=true;}catch(e){try{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();ok=document.execCommand('copy');a.remove();}catch(_){}}
    toast(ok?say('Rapport copié','Report copied'):say('Copie impossible dans ce navigateur','Copy not possible in this browser'));
    const b=$('rCopy'),o=b.textContent;b.textContent=ok?say('Copié','Copied'):o;setTimeout(()=>{b.textContent=say('Copier en texte','Copy as text');},1400);};
}
