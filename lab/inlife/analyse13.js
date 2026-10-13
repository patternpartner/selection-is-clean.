// analysis for PREREG-birthcost.md. node analyse13.js <dir containing d13/>
const fs=require('fs'); const S=process.argv[2]+'/d13'; const seeds=[81,82,83,84,85,86,87,88];
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length, sd=x=>{ const m=mean(x); return Math.sqrt(x.reduce((a,b)=>a+(b-m)*(b-m),0)/(x.length-1)); };
const lgam=x=>{ const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5]; let y=x,t=x+5.5; t-=(x+0.5)*Math.log(t); let s=1.000000000190015; for(const k of c)s+=k/++y; return -t+Math.log(2.5066282746310005*s/x); };
const tpdf=(x,v)=>Math.exp(lgam((v+1)/2)-lgam(v/2))/Math.sqrt(v*Math.PI)*Math.pow(1+x*x/v,-(v+1)/2);
const tcdf=(x,v)=>{ const n=4000, h=x/n; let s=tpdf(0,v)+tpdf(x,v); for(let i=1;i<n;i++)s+=tpdf(i*h,v)*(i%2?4:2); return 0.5+s*h/3; };
const tq=(p,v)=>{ let lo=0,hi=50; for(let i=0;i<80;i++){ const m=(lo+hi)/2; if(tcdf(m,v)<p)lo=m; else hi=m; } return (lo+hi)/2; };
const load=(s,m,k)=>{ const f=`${S}/${s}-${m}-${k}.json`; if(!fs.existsSync(f)||!fs.statSync(f).size)return null; return JSON.parse(fs.readFileSync(f,'utf8')); };
const rows=[]; for(const s of seeds){ const H=load(s,'HALF',0), D=load(s,'DOUBLE',0), N=[1,2,3,4].map(k=>load(s,'NUDGE',k)); if(!H||!D||N.some(x=>!x)||H.err||D.err||N.some(x=>x.err)){ console.log(s,'incomplete or error'); continue; } rows.push({s,H,D,N}); }
console.log('counted seeds:',rows.length);
for(const r of rows) console.log(r.s,'births HALF',r.H.birthsAfter,'DOUBLE',r.D.birthsAfter,'NUDGE',r.N.map(x=>x.birthsAfter).join(','),'| alive HALF',r.H.aliveEnd,'DOUBLE',r.D.aliveEnd,'NUDGE',r.N.map(x=>x.aliveEnd).join(','),'| meanWorldEnergy HALF',r.H.meanWorldEnergy.toFixed(2),'DOUBLE',r.D.meanWorldEnergy.toFixed(2),'NUDGE',mean(r.N.map(x=>x.meanWorldEnergy)).toFixed(2));
if(rows.length<5){ console.log('VERDICT: INCONCLUSIVE (fewer than 5 counted seeds)'); process.exit(); }
const crit=tq(1-0.05/4,rows.length-1);
const stat=v=>{ const m=mean(v), h=crit*sd(v)/Math.sqrt(v.length); return {m,lo:m-h,hi:m+h}; };
const fmt=st=>`mean L=${st.m.toFixed(3)} (ratio ${Math.exp(st.m).toFixed(2)})  CI [${st.lo.toFixed(3)}, ${st.hi.toFixed(3)}] (ratio [${Math.exp(st.lo).toFixed(2)}, ${Math.exp(st.hi).toFixed(2)}])`;
const a=Math.log(1.25), b=Math.log(0.8);
const verdict=(st,dir)=>{ if((st.lo>0||st.hi<0)&&Math.abs(st.m)>=a&&Math.sign(st.m)===dir)return 'BINDS (predicted direction)'; if((st.lo>0||st.hi<0)&&Math.abs(st.m)>=a)return 'MOVES BIRTHS THE WRONG WAY'; if(st.lo>=b&&st.hi<=a)return 'DOES NOT BIND'; return 'INCONCLUSIVE'; };
const L=(x,y)=>Math.log((x+1)/(y+1));
for(const [name,key,dir] of [['HALF cost (predict births UP)','H',1],['DOUBLE cost (predict births DOWN)','D',-1]]){
  const bs=stat(rows.map(r=>L(r[key].birthsAfter,mean(r.N.map(x=>x.birthsAfter))))), al=stat(rows.map(r=>L(r[key].aliveEnd,mean(r.N.map(x=>x.aliveEnd)))));
  console.log('\n'+name+'\n  births:',fmt(bs),'->',verdict(bs,dir),'\n  alive :',fmt(al)); }
const pl=stat(rows.map(r=>L(r.N[0].birthsAfter,mean(r.N.slice(1).map(x=>x.birthsAfter)))));
console.log('\nPLACEBO births (NUDGE1 vs 2-4):',fmt(pl));
