// #368 - PREREG-pop.md's rule, applied to lab/port/out-pop/. Written before the decision runs finished.
//   node lab/port/analyse-pop.js [dir]
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-pop');
const SEEDS=(process.env.SEEDS||'10101 10102 10103').split(/\s+/).filter(Boolean);
const rows=f=>{ try{ return fs.readFileSync(path.join(D,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse); }catch(_){ return null; } };
const done=t=>fs.existsSync(path.join(D,t+'.done'));
// windows after the save: for a NULL run ticks 4,500..8,000; for a reload 500..4,000
function after(R,off){ return R.filter(r=>typeof r.tick==='number'&&r.tick>off&&r.fnPaid!==undefined).map(r=>Object.assign({},r,{at:r.tick-off})); }
function measures(W){ const f=W.filter(r=>r.at<=1000); const mean=k=>f.reduce((a,r)=>a+r[k],0)/f.length;
  const last=W.filter(r=>r.at>3000); return {sz:mean('meanSz'), fn:mean('fnPaid'), H:mean('expH'), V:W.reduce((a,r)=>a+r.newToHistory,0), aliveLate:last.reduce((a,r)=>a+r.alive,0)/Math.max(1,last.length), n:W.length}; }
const fmt=x=>typeof x==='number'?(Math.abs(x)>=100?x.toFixed(0):x.toFixed(2)):String(x);
let counted=0, Fh=0, Vb=0, Vw=0, Gf=0; const lines=[];
for(const s of SEEDS){
  const arms={NULL:[],GERM:[],POP:[]}; let ok=true, why=[];
  for(const k of [1,2,3]){ for(const a of ['NULL','GERM','POP']){ const t=s+'_'+a+k; if(!done(t)){ ok=false; why.push(t+' not done'); continue; } const R=rows(t+'.jsonl');
    const W=after(R,a==='NULL'?4000:0); if(W.length!==8){ ok=false; why.push(t+' has '+W.length+' windows'); continue; }
    const m=measures(W); m.k=k; if(a==='POP'){ const pb=R.find(r=>r.popBoot); m.restored=pb&&pb.popBoot?pb.popBoot.restored:0; } arms[a].push(m); } }
  const N1=rows(s+'_NULL1.jsonl')||[], sv=N1.find(r=>r.saved===4000), everAtSave=sv?sv.everPaid:0;
  if(!ok){ lines.push(s+': INCOMPLETE ('+why.join(', ')+')'); continue; }
  const tookOff=everAtSave>=500, restoredAll=arms.POP.every(m=>m.restored>0), counts=tookOff&&restoredAll;
  const ref={}; for(const k of ['sz','fn','H']) ref[k]=arms.NULL.reduce((a,m)=>a+m[k],0)/arms.NULL.length;
  const d=m=>['sz','fn','H'].reduce((a,k)=>a+Math.abs(Math.log(Math.max(1e-9,m[k])/Math.max(1e-9,ref[k]))),0);
  for(const a of ['NULL','GERM','POP']) for(const m of arms[a]) m.d=d(m);
  const F=Math.max(...arms.POP.map(m=>m.d))<Math.min(...arms.GERM.map(m=>m.d));
  const vP=arms.POP.map(m=>m.V), vG=arms.GERM.map(m=>m.V), Vbetter=Math.min(...vP)>Math.max(...vG), Vworse=Math.max(...vP)<Math.min(...vG);
  const crash=arms.POP.some(m=>{ const g=arms.GERM.find(x=>x.k===m.k); return m.aliveLate<5&&g&&g.aliveLate>20; });
  lines.push(s+': '+(counts?'COUNTED':'NOT COUNTED')+' (ever paid by the save '+everAtSave+'; POP restored '+arms.POP.map(m=>m.restored).join('/')+')');
  for(const a of ['NULL','GERM','POP']) lines.push('   '+a.padEnd(4)+' '+arms[a].map(m=>'k'+m.k+' sz '+fmt(m.sz)+' fn '+fmt(m.fn)+' H '+fmt(m.H)+' d '+fmt(m.d)+' V '+m.V+' aliveLate '+fmt(m.aliveLate)).join('  |  '));
  lines.push('   F '+(F?'holds':'fails')+'; V '+(Vbetter?'BETTER':Vworse?'WORSE':'neither')+' (POP '+vP.join('/')+' vs GERM '+vG.join('/')+'); guard '+(crash?'FAILS':'ok'));
  if(counts){ counted++; if(F)Fh++; if(Vbetter)Vb++; if(Vworse)Vw++; if(crash)Gf++; }
}
console.log(lines.join('\n'));
const two=x=>counted>0&&x*3>=counted*2;
console.log('\ncounted seeds '+counted+' of '+SEEDS.length+'; F holds on '+Fh+', V BETTER on '+Vb+', V WORSE on '+Vw+', guard fails on '+Gf);
let verdict; if(counted<3)verdict='INCONCLUSIVE (fewer than 3 counted seeds)'; else if(two(Vw)||two(Gf))verdict='DO NOT SHIP'; else if(two(Fh))verdict='SHIP'; else verdict='INCONCLUSIVE';
console.log('VERDICT: '+verdict);
