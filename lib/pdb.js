// Minimal rekordbox DeviceSQL (export.pdb / exportExt.pdb) reader. Tolerant: bad pages are skipped.
export function parsePdbRaw(buf){
  const dv=new DataView(buf.buffer||buf,buf.byteOffset||0,buf.byteLength);
  const u32=o=>dv.getUint32(o,true),u16=o=>dv.getUint16(o,true);
  const pageSize=u32(4),nt=u32(8);
  const tables=[];
  for(let i=0;i<nt;i++){const o=28+i*16;tables.push({type:u32(o),first:u32(o+8),last:u32(o+12),rows:[]});}
  const warn=[];
  for(const t of tables){
    let p=t.first,guard=0,seen=new Set();
    while(guard++<100000){
      if(seen.has(p))break;seen.add(p);
      const po=p*pageSize; if(po+pageSize>dv.byteLength){warn.push('page out of range '+p);break;}
      const next=u32(po+12);
      const flags=dv.getUint8(po+0x1b);
      const isData=(flags&0x40)===0;
      if(isData){
        const nrs=dv.getUint8(po+0x18),nrl=u16(po+0x22);
        const nrows=(nrl>nrs&&nrl!==0x1fff)?nrl:nrs;
        const groups=Math.ceil(nrows/16);
        for(let g=0;g<groups;g++){
          const ge=po+pageSize-36*g;
          const present=u16(ge-4);
          for(let i=0;i<16;i++){
            if(g*16+i>=nrows)break;
            if(!(present&(1<<i)))continue;
            const off=u16(ge-6-2*i);
            const ro=po+0x28+off; if(ro>=po+pageSize)continue;
            t.rows.push({dv,o:ro,end:po+pageSize});
          }
        }
      }
      if(p===t.last)break;
      p=next;
    }
  }
  return {tables,warn,dv};
}
const dec8=new TextDecoder('latin1'),dec16=new TextDecoder('utf-16le'),decU=new TextDecoder('utf-8');
export function readStr(dv,o){
  try{
    const b=dv.getUint8(o);
    if(b&1){const len=(b>>1)-1;return decU.decode(new Uint8Array(dv.buffer,dv.byteOffset+o+1,Math.max(0,len)));}
    const len=dv.getUint16(o+1,true);
    const bytes=new Uint8Array(dv.buffer,dv.byteOffset+o+4,Math.max(0,len-4));
    if(b===0x40)return decU.decode(bytes);
    if(b===0x90){return dec16.decode(bytes).replace(/\0+$/,'');}
    return '';
  }catch(e){return '';}
}
export function parseExport(buf){
  const {tables,warn}=parsePdbRaw(buf);
  const T=n=>tables.filter(t=>t.type===n).flatMap(t=>t.rows);
  const out={artwork:{},tracks:[],artists:{},albums:{},genres:{},labels:{},keys:{},colors:{},playlists:[],entries:[],warn};
  for(const r of T(2)){const {dv,o}=r;const sub=dv.getUint16(o,true);const id=dv.getUint32(o+4,true);
    const near=dv.getUint8(o+9);const ofs=(sub&4)?dv.getUint16(o+10,true):near;out.artists[id]=readStr(dv,o+ofs);}
  for(const r of T(3)){const {dv,o}=r;const sub=dv.getUint16(o,true);const aid=dv.getUint32(o+8,true),id=dv.getUint32(o+12,true);
    const near=dv.getUint8(o+21);const ofs=(sub&4)?dv.getUint16(o+22,true):near;out.albums[id]={name:readStr(dv,o+ofs),artistId:aid};}
  for(const r of T(1))out.genres[r.dv.getUint32(r.o,true)]=readStr(r.dv,r.o+4);
  for(const r of T(4))out.labels[r.dv.getUint32(r.o,true)]=readStr(r.dv,r.o+4);
  for(const r of T(5))out.keys[r.dv.getUint32(r.o,true)]=readStr(r.dv,r.o+8);
  for(const r of T(6))out.colors[r.dv.getUint16(r.o+5,true)]=readStr(r.dv,r.o+8);
  for(const r of T(7)){const {dv,o}=r;out.playlists.push({parent:dv.getUint32(o,true),sort:dv.getUint32(o+8,true),id:dv.getUint32(o+12,true),isFolder:dv.getUint32(o+16,true)!==0,name:readStr(dv,o+20)});}
  for(const r of T(13))out.artwork[r.dv.getUint32(r.o,true)]=readStr(r.dv,r.o+4);
  for(const r of T(8)){const {dv,o}=r;out.entries.push({index:dv.getUint32(o,true),track:dv.getUint32(o+4,true),playlist:dv.getUint32(o+8,true)});}
  for(const r of T(0)){
    const {dv,o}=r;const u32=x=>dv.getUint32(o+x,true),u16=x=>dv.getUint16(o+x,true);
    const S=i=>readStr(dv,o+u16(0x5e+2*i));
    const t={id:u32(0x48),sampleRate:u32(8),fileSize:u32(0x10),artworkId:u32(0x1c),keyId:u32(0x20),bitrate:u32(0x30),trackNo:u32(0x34),
      bpm:u32(0x38)/100,genreId:u32(0x3c),albumId:u32(0x40),artistId:u32(0x44),labelId:u32(0x28),remixerId:u32(0x2c),playCount:u16(0x4e),year:u16(0x50),
      depth:u16(0x52),duration:u16(0x54),colorId:dv.getUint8(o+0x58),rating:dv.getUint8(o+0x59),
      title:S(17),comment:S(16),filePath:S(20),fileName:S(19),analyzePath:S(14),dateAdded:S(10),mixName:S(12),autoload:S(7)};
    out.tracks.push(t);
  }
  return out;
}
export function parseExt(buf){
  const {tables}=parsePdbRaw(buf);
  const cats=[],tags=[],trackTags=[];
  for(const t of tables){
    if(t.type===3)for(const r of t.rows){const {dv,o}=r;const sub=dv.getUint16(o,true);
      const ofs=(sub&4)?dv.getUint16(o+0x1e,true):dv.getUint8(o+0x1d);
      const row={id:dv.getUint32(o+0x14,true),parent:dv.getUint32(o+0xc,true),pos:dv.getUint32(o+0x10,true),isCat:dv.getUint32(o+0x18,true)!==0,name:readStr(dv,o+ofs)};
      (row.isCat?cats:tags).push(row);}
    if(t.type===4)for(const r of t.rows){const {dv,o}=r;trackTags.push({track:dv.getUint32(o+4,true),tag:dv.getUint32(o+8,true)});}
  }
  cats.sort((a,b)=>a.pos-b.pos);tags.sort((a,b)=>a.pos-b.pos);
  return {cats,tags,trackTags};
}
