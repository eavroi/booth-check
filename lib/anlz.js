// Minimal ANLZ (.DAT/.EXT) reader: beat grid, waveforms, cues. Big-endian sections.
export function parseAnlz(buf){
  const u8=buf instanceof Uint8Array?buf:new Uint8Array(buf);
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
  const tag=o=>String.fromCharCode(u8[o],u8[o+1],u8[o+2],u8[o+3]);
  const res={beats:[],preview:null,detail:null,colorDetail:null,colorPreview:null,cues:[],cues2:[]};
  if(u8.length<12||tag(0)!=='PMAI')return res;
  let o=dv.getUint32(4),end=Math.min(dv.getUint32(8),u8.length);
  while(o+12<=end){
    const name=tag(o),hl=dv.getUint32(o+4),tl=dv.getUint32(o+8);
    if(tl<12||o+tl>u8.length)break;
    try{
    if(name==='PQTZ'){const n=dv.getUint32(o+20);for(let i=0;i<n;i++){const p=o+hl+i*8;if(p+8>o+tl)break;
      res.beats.push({n:dv.getUint16(p),bpm:dv.getUint16(p+2)/100,t:dv.getUint32(p+4)});}}
    else if(name==='PWAV'){const n=dv.getUint32(o+12);res.preview=u8.slice(o+hl,o+hl+n);}
    else if(name==='PWV3'){const n=dv.getUint32(o+16);res.detail=u8.slice(o+hl,o+hl+n);}
    else if(name==='PWV5'){const n=dv.getUint32(o+16);const a=new Uint16Array(n);for(let i=0;i<n;i++)a[i]=dv.getUint16(o+hl+i*2);res.colorDetail=a;}
    else if(name==='PWV4'){const n=dv.getUint32(o+16);res.colorPreview=u8.slice(o+hl,o+hl+n*6);}
    else if(name==='PCOB'){const cnt=dv.getUint16(o+18);let p=o+hl;
      for(let i=0;i<cnt&&p+12<=o+tl;i++){const el=dv.getUint32(p+8);
        if(tag(p)==='PCPT'){res.cues.push({hot:dv.getUint32(p+12),status:dv.getUint32(p+16),type:u8[p+28],time:dv.getUint32(p+32),loopEnd:dv.getUint32(p+36)});}
        p+=el;}}
    else if(name==='PCO2'){const cnt=dv.getUint16(o+16);let p=o+hl;
      for(let i=0;i<cnt&&p+12<=o+tl;i++){const el=dv.getUint32(p+8);
        if(tag(p)==='PCP2'){const c={hot:dv.getUint32(p+12),type:u8[p+16],time:dv.getUint32(p+20),loopEnd:dv.getUint32(p+24),colorId:u8[p+28],num:dv.getUint16(p+36),den:dv.getUint16(p+38),comment:''};
          const cl=dv.getUint32(p+40);
          if(cl>0&&p+44+cl<=p+el){let s='';for(let k=0;k+1<cl;k+=2){const ch=dv.getUint16(p+44+k);if(ch)s+=String.fromCharCode(ch);}c.comment=s;
            const q=p+44+cl;if(q+4<=p+el){c.hotColorIdx=u8[q];c.rgb=[u8[q+1],u8[q+2],u8[q+3]];}}
          res.cues2.push(c);}
        p+=el;}}
    }catch(e){}
    o+=tl;
  }
  return res;
}
