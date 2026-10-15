// lab/migration-analyse.js - applies PREREG-migration.md.  node lab/migration-analyse.js DIR
const fs=require('fs'), {ring}=require('./migration-score.js'); const dir=process.argv[2];
const arms=['none','sham0.001','ring0.001','sham0.01','ring0.01','sham0.1','ring0.1']; const R={}; const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
for(const a of arms){ R[a]=[]; for(let k=0;k<10;k++){ const name=`r${k}_${a}`; try{ const r=ring(dir,name); const migrating=a!=='none';
  r.counted=r.windows>=10&&r.N.every(n=>n>50)&&(!migrating||(r.sent>0&&r.landed>=0.9*r.sent)); r.k=k; R[a].push(r); }catch(e){ R[a].push({name,counted:false,err:String(e.message).slice(0,60)}); } } }
function perm(a,b,n=20000){ const all=a.concat(b), na=a.length; const d0=Math.abs(mean(a)-mean(b)); let c=0, s=1234567; const rnd=()=>{ s=(Math.imul(s,1664525)+1013904223)>>>0; return s/4294967296; };
  for(let i=0;i<n;i++){ const x=all.slice(); for(let j=x.length-1;j>0;j--){ const k=Math.floor(rnd()*(j+1)); [x[j],x[k]]=[x[k],x[j]]; } if(Math.abs(mean(x.slice(0,na))-mean(x.slice(na)))>=d0-1e-12)c++; } return (c+1)/(n+1); }
const M=(a,key)=>R[a].filter(r=>r.counted).map(r=>r[key]);
console.log('counted rings per arm:',arms.map(a=>a+':'+M(a,'ever').length).join('  '));
for(const a of arms){ const e=M(a,'ever'),l=M(a,'late'),j=M(a,'jaccardFinal'),f=R[a].filter(r=>r.counted).map(r=>mean(r.distinctFn)); if(!e.length){ console.log(a,'none counted'); continue; }
  console.log(a.padEnd(10),'EVER',mean(e).toFixed(1),'(sd',Math.sqrt(mean(e.map(x=>(x-mean(e))**2))).toFixed(1)+')','LATE',mean(l).toFixed(1),'Jaccard',mean(j).toFixed(3),'distinct fn',mean(f).toFixed(0)); }
function verdict(ra,rb,key){ const x=M(ra,key),y=M(rb,key); if(x.length<8||y.length<8)return 'INCONCLUSIVE (n '+x.length+','+y.length+')'; const q=mean(x)/mean(y),p=perm(x,y); return (q>=1.25&&p<0.05?'BETTER':q<=0.8&&p<0.05?'WORSE':'NOT DIFFERENT')+` (ratio ${q.toFixed(2)}, p ${p.toFixed(4)})`; }
console.log('\nPRIMARY: RING vs SHAM at the same rate');
const out={}; for(const r of ['0.001','0.01','0.1']){ out[r]=verdict('ring'+r,'sham'+r,'ever'); console.log(' rate',r,'EVER:',out[r],'| LATE:',verdict('ring'+r,'sham'+r,'late')); }
console.log('\nARTEFACT: SHAM vs NOMIG (EVER)'); for(const r of ['0.001','0.01','0.1'])console.log(' sham',r,verdict('sham'+r,'none','ever'));
console.log('\nHUMP check: RING 0.01 vs RING 0.1 (EVER):',verdict('ring0.01','ring0.1','ever'),'| RING 0.01 vs RING 0.001:',verdict('ring0.01','ring0.001','ever'));
const hump=out['0.01'].startsWith('BETTER')&&verdict('ring0.01','ring0.1','ever').startsWith('BETTER'), mono=out['0.1'].startsWith('BETTER')&&!hump, anyBetter=Object.values(out).some(v=>v.startsWith('BETTER')), anyWorse=Object.values(out).some(v=>v.startsWith('WORSE'));
console.log('\nOUTCOME:',hump?'HUMP':mono?'MONOTONE':anyBetter?'BETTER at some rate, not the registered shape':anyWorse?'WORSE at some rate, nothing better':'NONE');
