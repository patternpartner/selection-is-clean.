// field-fpcheck.js - #418: WOULD A RELOAD RESTORE THIS FIELD? For every universe in a saved field profile (a PROFILE from field-rate.js
// or long-pair.sh), is a genome stored, is a snapshot stored, and does the snapshot carry that genome's fingerprint (the engine's popHash)?
// The engine restores a population only beside the exact genome it was saved with, so a mismatch means founders at the next reload.
// Reads only. Point it at a COPY of the profile if a field may still use it; PORT must be the port the field ran on (storage is per origin).
//   PROFILE=dir PORT=8941 node lab/port/field-fpcheck.js
const { chromium } = (function(){ try{ return require('playwright-core'); }catch(e){ return require('playwright'); } })();
const http=require('http'), fs=require('fs');
const server=http.createServer((q,r)=>{ r.writeHead(200,{'Content-Type':'text/html'}); r.end('<!doctype html><title>p</title>'); });
(async()=>{ await new Promise(r=>server.listen(+process.env.PORT,'127.0.0.1',r));
  const ctx=await chromium.launchPersistentContext(process.env.PROFILE,{executablePath:(process.env.CHROME_PATH||'/opt/pw-browsers/chromium'),args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=ctx.pages()[0]||await ctx.newPage(); await page.goto('http://127.0.0.1:'+process.env.PORT+'/probe.html');
  const out=await page.evaluate(async()=>{
    const popHash=s=>{ let h=0x811c9dc5; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,0x01000193); } return (h>>>0).toString(36)+':'+s.length; };
    const db=await new Promise((res,rej)=>{ const r=indexedDB.open('selection_pop',1); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
    const keys=await new Promise(res=>{ const q=db.transaction('pop','readonly').objectStore('pop').getAllKeys(); q.onsuccess=()=>res(q.result); });
    const rows=[];
    for(const k of keys){ const v0=await new Promise(res=>{ const q=db.transaction('pop','readonly').objectStore('pop').get(k); q.onsuccess=()=>res(q.result); });
      const recG=(v0&&typeof v0==='object'&&!(v0 instanceof Blob)&&typeof v0.g==='string')?v0.g:null, v=recG!==null?v0.b:v0;   // #426: a record may carry its genome
      const t=v instanceof Blob?await new Response(v.stream().pipeThrough(new DecompressionStream('gzip'))).text():String(v||'');
      let fp=null, ticks=null; try{ const o=JSON.parse(t); fp=o.fp; ticks=o.ticks; }catch(e){ fp='unparsable'; }
      const slot=k.replace(/^pop_/,''), gk=slot==='genome'?'selection_genome':'selection_'+slot, g=localStorage.getItem(gk);
      let gt=null; try{ gt=g?JSON.parse(g).totalTicks:null; }catch(e){}
      const recMatch=recG!==null&&fp===popHash(recG);   // #426: the shell boots from the record's own genome when localStorage's differs
      rows.push({slot, snapFp:fp, snapTicks:ticks, genome:g?g.length:0, genomeTicks:gt, genomeFp:g?popHash(g):null, lsMatch:!!g&&fp===popHash(g), recMatch, match:(!!g&&fp===popHash(g))||recMatch}); }
    const ls=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(/^selection_/.test(k)) ls.push(k); }
    return {rows, lsGenomeKeys:ls.length}; });
  console.log('localStorage selection_* keys:',out.lsGenomeKeys,' snapshots:',out.rows.length,' fingerprint matches:',out.rows.filter(r=>r.match).length);
  for(const r of out.rows) console.log(r.slot.padEnd(11),'snap ticks',String(r.snapTicks).padStart(5),'genome',r.genome?('ticks '+r.genomeTicks):'NONE','match',r.match);
  await ctx.close(); server.close(); })().catch(e=>{ console.error(e); process.exit(1); });
