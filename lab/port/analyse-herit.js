// #369b - PREREG-herit.md's rule, applied to lab/port/out-herit/. Written before the decision runs finished.
//   node lab/port/analyse-herit.js [dir]
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-herit');
const SEEDS=(process.env.SEEDS||'10201 10202 10203').split(/\s+/).filter(Boolean);
const rows=f=>fs.readFileSync(path.join(D,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.fnPaid!==undefined);
const done=t=>fs.existsSync(path.join(D,t+'.done'));
const fmt=x=>Math.abs(x)>=100?x.toFixed(0):x.toFixed(2);
function m(R){ const late=R.filter(r=>r.tick>5000&&r.tick<=10000), last2=R.filter(r=>r.tick>9000), mean=(a,k)=>a.reduce((s,r)=>s+r[k],0)/a.length;
  return {n:R.length, V:late.reduce((s,r)=>s+r.newToHistory,0), S:mean(late,'meanSz'), E:mean(late,'expH'), alive:mean(last2,'alive'), Vall:R.reduce((s,r)=>s+r.newToHistory,0),
    copies:R.reduce((s,r)=>s+(r.copies|0),0), desync:R[R.length-1].desync, ever:R[R.length-1].everPaid}; }
let counted=0; const tally={WORSE:0,BETTER:0,SPLIT:0,other:0,identical:0}; const out=[];
for(const s of SEEDS){ const A={OFF:[],ON:[]}; let ok=true; const why=[];
  for(const k of [1,2,3]) for(const a of ['OFF','ON']){ const t=s+'_'+a+k; if(!done(t)){ ok=false; why.push(t); continue; } const R=rows(t+'.jsonl'); if(R.length!==20){ ok=false; why.push(t+' '+R.length+' windows'); continue; } const x=m(R); x.k=k; A[a].push(x); }
  if(!ok){ out.push(s+': INCOMPLETE ('+why.join(', ')+')'); continue; }
  const counts=A.ON.every(x=>x.copies>=100)&&A.OFF.concat(A.ON).every(x=>x.ever>=500);
  for(const a of ['OFF','ON']) out.push('   '+a.padEnd(3)+' '+A[a].map(x=>'k'+x.k+' V '+x.V+' S '+fmt(x.S)+' E '+fmt(x.E)+' alive '+fmt(x.alive)+' Vall '+x.Vall+' copies '+x.copies+' desync '+x.desync+' ever '+x.ever).join('  |  '));
  const lo=(a,k)=>Math.min(...A[a].map(x=>x[k])), hi=(a,k)=>Math.max(...A[a].map(x=>x[k]));
  const worse={V:hi('ON','V')<lo('OFF','V')&&hi('ON','V')<0.9*lo('OFF','V'), S:hi('ON','S')<lo('OFF','S')-0.25, E:hi('ON','E')<0.9*lo('OFF','E')};
  const better={V:lo('ON','V')>hi('OFF','V')&&lo('ON','V')>1.1*hi('OFF','V'), S:lo('ON','S')>hi('OFF','S')+0.25, E:lo('ON','E')>1.1*hi('OFF','E')};
  const crash=A.ON.some(x=>{ const o=A.OFF.find(y=>y.k===x.k); return x.alive<5&&o&&o.alive>20; });
  const anyW=worse.V||worse.S||worse.E||crash, anyB=better.V||better.S||better.E;
  const identical=A.ON.every(x=>{ const o=A.OFF.find(y=>y.k===x.k); return o&&o.V===x.V&&o.S===x.S&&o.E===x.E; });
  let c; if(identical)c='identical'; else if(anyW&&anyB)c='SPLIT'; else if(anyW)c='WORSE'; else if(better.V)c='BETTER'; else c='other';
  out.splice(out.length-2,0,s+': '+(counts?'COUNTED':'NOT COUNTED')+' -> '+c+' (worse '+JSON.stringify(worse)+', better '+JSON.stringify(better)+', crash '+crash+')');
  if(counts){ counted++; tally[c]++; } }
console.log(out.join('\n'));
const two=x=>counted>0&&x*3>=counted*2;
console.log('\ncounted '+counted+' of '+SEEDS.length+'; '+JSON.stringify(tally));
let v; if(counted<3)v='INCONCLUSIVE (fewer than 3 counted seeds)'; else if(two(tally.WORSE))v='WORSE: LATERAL_HERIT stays 0 and is deleted'; else if(two(tally.SPLIT))v='SPLIT: default does not move (DORMANT)';
else if(two(tally.BETTER))v='BETTER: ship LATERAL_HERIT=1 under TASKS'; else if(tally.identical===counted)v='IDENTICAL: decoration, delete'; else v='KEEP (not WORSE, arms differ): ship as a heredity repair';
console.log('VERDICT: '+v);
