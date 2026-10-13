// analysis for PREREG-popblank-traits.md. node analyse10.js <dir containing d10/>
const fs=require('fs'); const S=process.argv[2]+'/d10'; const seeds=[61,62,63,64,65,66,67,68];
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length, sd=x=>{ const m=mean(x); return Math.sqrt(x.reduce((a,b)=>a+(b-m)*(b-m),0)/(x.length-1)); };
const lgam=x=>{ const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5]; let y=x,t=x+5.5; t-=(x+0.5)*Math.log(t); let s=1.000000000190015; for(const k of c)s+=k/++y; return -t+Math.log(2.5066282746310005*s/x); };
const tpdf=(x,v)=>Math.exp(lgam((v+1)/2)-lgam(v/2))/Math.sqrt(v*Math.PI)*Math.pow(1+x*x/v,-(v+1)/2);
const tcdf=(x,v)=>{ const n=4000, h=x/n; let s=tpdf(0,v)+tpdf(x,v); for(let i=1;i<n;i++)s+=tpdf(i*h,v)*(i%2?4:2); return 0.5+s*h/3; };
const tq=(p,v)=>{ let lo=0,hi=50; for(let i=0;i<80;i++){ const m=(lo+hi)/2; if(tcdf(m,v)<p)lo=m; else hi=m; } return (lo+hi)/2; };
const load=(s,m,k)=>{ const f=`${S}/${s}-${m}-${k}.json`; if(!fs.existsSync(f)||!fs.statSync(f).size)return null; return JSON.parse(fs.readFileSync(f,'utf8')); };
const rows=[]; for(const s of seeds){ const B=load(s,'BLANK',0), N=[1,2,3,4].map(k=>load(s,'NUDGE',k)); if(!B||N.some(x=>!x)||B.err||N.some(x=>x.err)){ console.log(s,'incomplete or error'); continue; } rows.push({s,B,N}); }
console.log('counted seeds:',rows.length);
for(const r of rows) console.log(r.s,'dispersion BLANK',r.B.dispersion.toFixed(3),'NUDGE',r.N.map(x=>x.dispersion.toFixed(3)).join(','),'| lineagesAlive BLANK',r.B.lineagesAlive,'NUDGE',r.N.map(x=>x.lineagesAlive).join(','),'| minted BLANK',r.B.minted,'NUDGE',r.N.map(x=>x.minted).join(','),'| dims',r.B.dims);
if(rows.length<5){ console.log('VERDICT: INCONCLUSIVE (fewer than 5 counted seeds)'); process.exit(); }
const crit=tq(1-0.05/6,rows.length-1);
const M=[['TRAIT DISPERSION (primary)',r=>r.dispersion,1e-9],['LINEAGES ALIVE',r=>r.lineagesAlive,1],['LINEAGES MINTED',r=>r.minted,1]];
const stat=(vals)=>{ const m=mean(vals), h=crit*sd(vals)/Math.sqrt(vals.length); return {m,lo:m-h,hi:m+h}; };
const verdict=st=>{ const a=Math.log(1.25), b=Math.log(0.8); if((st.lo>0||st.hi<0)&&Math.abs(st.m)>=a)return 'MATTERS'; if(st.lo>=b&&st.hi<=a)return 'DOES NOT MATTER'; return 'INCONCLUSIVE'; };
const fmt=st=>`mean L=${st.m.toFixed(3)} (ratio ${Math.exp(st.m).toFixed(2)})  CI [${st.lo.toFixed(3)}, ${st.hi.toFixed(3)}] (ratio [${Math.exp(st.lo).toFixed(2)}, ${Math.exp(st.hi).toFixed(2)}])`;
console.log('\nBonferroni t critical (df',rows.length-1,', per-side tail 0.05/6):',crit.toFixed(3));
for(const [name,f,e] of M){ const bl=stat(rows.map(r=>Math.log((f(r.B)+e)/(mean(r.N.map(f))+e)))), pl=stat(rows.map(r=>Math.log((f(r.N[0])+e)/(mean(r.N.slice(1).map(f))+e))));
  console.log('\n'+name+'\n  BLANK vs NUDGE:',fmt(bl),'->',verdict(bl),'\n  placebo       :',fmt(pl)); }
