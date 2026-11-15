// #438 - PREREG-open.md's four rules over one long pair (lab/port/out-long/NAME-base.jsonl and NAME-open.jsonl).
//   node lab/port/analyse-open.js [NAME=op1]
const fs=require('fs'), path=require('path'); const NAME=process.argv[2]||'op1', D=path.join(__dirname,'out-long');
const load=a=>{ const f=path.join(D,NAME+'-'+a+'.jsonl'); return fs.existsSync(f)?fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.F!==undefined):[]; };
const B=load('base'), O=load('open'); const legs=[...new Set(O.map(r=>r.leg))].sort((a,b)=>a-b);
const last=(L,g)=>{ const x=L.filter(r=>r.leg===g); return x[x.length-1]; }, first=(L,g)=>L.find(r=>r.leg===g);
const hs=h=>h?Object.keys(h).sort().map(k=>k+':'+h[k]).join(' '):'-', tot=h=>h?Object.entries(h).reduce((s,[k,v])=>s+k*v,0):0, cnt=h=>h?Object.values(h).reduce((s,v)=>s+v,0):0;
let pb=null, po=null, reloadOk=true; const rows=[];
for(const g of legs){ const b=last(B,g), o=last(O,g); if(!b||!o)continue;
  const m={}; for(const r of O.filter(r=>r.leg===g)) if(r.OPEN&&r.OPEN.m) for(const k in r.OPEN.m)m[k]=(m[k]||0)+r.OPEN.m[k];
  const dK_b=b.K-(pb?pb.K:0), dK_o=o.K-(po?po.K:0), f=first(O,g);
  let rel='-'; if(po&&f&&f.OPEN){ const before=po.OPEN?po.OPEN.n:null; rel='before '+hs(before)+' | after '+hs(f.OPEN.n)+' | lost '+((f.lost||[]).length); if(cnt(f.OPEN.n)>=29&&tot(f.OPEN.n)/cnt(f.OPEN.n)<tot(before)/cnt(before)-0.1)reloadOk=false; }
  rows.push({g,b,o,m}); console.log('leg '+g+'  t '+o.t+'  F base '+b.F+' open '+o.F+'  ratio '+(o.F/b.F).toFixed(2)+'  new this leg '+(b.F-(pb?pb.F:0))+' / '+(o.F-(po?po.F:0))+
    '  |  ticks this leg '+dK_b+' / '+dK_o+' ('+(dK_o/Math.max(1,dK_b)).toFixed(2)+')  alive '+b.A+' / '+o.A+'  |  inputs held (n:universes) '+hs(o.OPEN&&o.OPEN.n)+'  |  new by inputs depended on '+hs(m)+'  |  reload: '+rel);
  pb=b; po=o; }
if(rows.length){ const z=rows[rows.length-1], n=z.o.OPEN?z.o.OPEN.n:{}, U=cnt(n), ge7=Object.entries(n).filter(([k])=>+k>=7).reduce((s,[,v])=>s+v,0), mm=z.m, ge6=Object.entries(mm).filter(([k])=>+k>=6).reduce((s,[,v])=>s+v,0), all=cnt(mm);
  const pv=rows.length>1?rows[rows.length-2]:null, tk=(z.o.K-(pv?pv.o.K:0))/Math.max(1,z.b.K-(pv?pv.b.K:0));
  console.log('\nrule 1 count ratio '+(z.o.F/z.b.F).toFixed(2)+' (needs 0.90)  |  rule 2 universes at 7+ inputs '+ge7+' of '+U+', last leg new on 6+ inputs '+ge6+' of '+all+'  |  rule 3 reload '+(reloadOk?'ok by the histograms':'an input count fell')+'  |  rule 4 ticks in the last leg '+tk.toFixed(2)+' (needs 0.60)  |  legs '+rows.length+' of 6'); }
