// lab/para-analyse.js DIR - applies PREREG-para.md to the runs and assays in DIR.
const fs=require('fs'), path=require('path'); const dir=process.argv[2]; const mean=x=>x.length?x.reduce((a,b)=>a+b,0)/x.length:NaN;
function perm(a,b,n=20000){ const all=a.concat(b), na=a.length, d0=Math.abs(mean(a)-mean(b)); let c=0, s=99991; const rnd=()=>{ s=(Math.imul(s,1664525)+1013904223)>>>0; return s/4294967296; };
  for(let i=0;i<n;i++){ const x=all.slice(); for(let j=x.length-1;j>0;j--){ const k=Math.floor(rnd()*(j+1)); [x[j],x[k]]=[x[k],x[j]]; } if(Math.abs(mean(x.slice(0,na))-mean(x.slice(na)))>=d0-1e-12)c++; } return (c+1)/(n+1); }
const R={para:[],ctrl:[]};
const SEEDS=(process.env.SEEDS||'3101 3102 3103 3104 3105 3106 3107 3108 3109 3110').split(/[ ,]+/).map(Number);   // PREREG-para.md step 2: unseen seeds may be ADDED when an arm has fewer than 8 counted runs
for(const s of SEEDS) for(const arm of ['para','ctrl']){ const base=path.join(dir,`${arm}_${s}`); const r={arm,s,counted:false};
  try{ const rows=fs.readFileSync(base+'.all.jsonl','utf8').trim().split('\n').map(JSON.parse); r.ticks=rows.at(-1).t; r.N=rows.at(-1).N; r.len=rows.at(-1).meanLen;
    const last=rows.slice(-250); r.injLast=last.reduce((a,x)=>a+((x.ev&&x.ev.injHit)||0),0); r.keysLast=mean(last.map(x=>(x.para&&x.para.keys)||0));
    const txt=fs.readFileSync(base+'.assay.txt','utf8'); const m=txt.match(/Q1 (\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)\s+Q2 (\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)\s+Q3 (\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)\s+Q4 (\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)/);
    if(!m)throw new Error('no per-quarter line'); const q=[1,6,11,16].map(i=>({n:+m[i],win:+m[i+1],lose:+m[i+2],strict:+m[i+3],miss:+m[i+4]})); r.q=q;
    r.succ=(txt.match(/new adaptive with an incumbent (\d+)/)||[])[1];
    r.counted=r.ticks>=1000000&&r.N>50&&q[1].n>=4&&q[3].n>=4&&(arm==='ctrl'||r.injLast>0);
    r.S2=q[1].strict; r.S4=q[3].strict; r.holds=r.S2>0?r.S4>=0.5*r.S2:r.S4>0; }catch(e){ r.err=String(e.message).slice(0,80); }
  R[arm].push(r); }
for(const arm of ['para','ctrl']){ console.log('==',arm); for(const r of R[arm]) console.log(' ',r.s,r.counted?'counted':'NOT COUNTED '+(r.err||''),'N',r.N,'len',r.len,'successions',r.succ,'injLast',r.injLast,'keys',r.keysLast&&r.keysLast.toFixed(1),
  '| strict wins by quarter',r.q?r.q.map(x=>x.strict+'/'+x.n).join(' '):'-','| holds',r.holds); }
const P=R.para.filter(r=>r.counted), C=R.ctrl.filter(r=>r.counted); console.log('\ncounted: para',P.length,'ctrl',C.length);
if(P.length<8||C.length<8){ console.log('VERDICT: INCONCLUSIVE (fewer than 8 counted runs in an arm)'); process.exit(); }
const a=P.map(r=>r.S4), b=C.map(r=>r.S4), ma=mean(a), mb=mean(b), p=perm(a,b);
let r1; if(mb===0) r1=(ma>=1&&p<0.05)?'BETTER':'NOT DIFFERENT'; else r1=(ma/mb>=1.25&&p<0.05)?'BETTER':(ma/mb<=0.8&&p<0.05)?'WORSE':'NOT DIFFERENT';
console.log(`R1: mean Q4 strict wins para ${ma.toFixed(2)} ctrl ${mb.toFixed(2)} ratio ${(ma/mb).toFixed(2)} p ${p.toFixed(4)} -> ${r1}`);
const hp=P.filter(r=>r.holds).length, hc=C.filter(r=>r.holds).length, r2=hp>=Math.ceil(P.length*2/3)&&hp>hc;
console.log(`R2: runs that hold para ${hp}/${P.length} ctrl ${hc}/${C.length} -> ${r2?'PASS':'FAIL'}`);
console.log('described: mean strict wins per quarter para',[0,1,2,3].map(i=>mean(P.map(r=>r.q[i].strict)).toFixed(2)).join(' '),'| ctrl',[0,1,2,3].map(i=>mean(C.map(r=>r.q[i].strict)).toFixed(2)).join(' '));
console.log('described: mean successions replayed per quarter para',[0,1,2,3].map(i=>mean(P.map(r=>r.q[i].n)).toFixed(1)).join(' '),'| ctrl',[0,1,2,3].map(i=>mean(C.map(r=>r.q[i].n)).toFixed(1)).join(' '));
console.log('VERDICT:',r1==='BETTER'&&r2?'KEEP-GOING':r1==='BETTER'?'PARTIAL (R1 without R2)':'KILL: the bound is not lifted by code-keyed parasitism at 1,000,000 ticks (about 5,500 generations)');
