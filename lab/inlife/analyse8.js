const fs=require('fs'); const S=process.argv[2]+'/d8'; const seeds=[41,42,43,44,45,46,47,48];
const T={1:12.706,2:4.303,3:3.182,4:2.776,5:2.571,6:2.447,7:2.365};
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length, sd=x=>{ const m=mean(x); return Math.sqrt(x.reduce((a,b)=>a+(b-m)*(b-m),0)/(x.length-1)); };
const load=(s,m,k)=>{ const f=`${S}/${s}-${m}-${k}.json`; if(!fs.existsSync(f)||!fs.statSync(f).size)return null; return JSON.parse(fs.readFileSync(f,'utf8')); };
const rows=[]; const counted=[];
for(const s of seeds){ const B=load(s,'BLANK',0), N=[1,2,3,4].map(k=>load(s,'NUDGE',k)); const ok=B&&N.every(x=>x)&&!B.err&&N.every(x=>!x.err); 
  if(!ok){ console.log(s,'incomplete or error'); continue; } counted.push(s);
  const nb=N.map(x=>x.birthsAfter), na=N.map(x=>x.aliveEnd);
  rows.push({s,B,N,nb,na});
  console.log(s,'births BLANK',B.birthsAfter,'| NUDGE',nb.join(','),'| alive BLANK',B.aliveEnd,'NUDGE',na.join(','),'| meanLen@2000/@4000 BLANK',(B.series.find(r=>r.t===2000)||{}).meanLen,(B.series.find(r=>r.t===4000)||{}).meanLen,'NUDGE',(N[0].series.find(r=>r.t===4000)||{}).meanLen); }
function stat(vals,name){ const n=vals.length; const m=mean(vals), s=sd(vals), h=T[n-1]*s/Math.sqrt(n); return {name,n,m,lo:m-h,hi:m+h}; }
function verdict(st){ const a=Math.log(1.25), b=Math.log(0.8); if((st.lo>0||st.hi<0)&&Math.abs(st.m)>=a) return 'MATTERS'; if(st.lo>=b&&st.hi<=a) return 'DOES NOT MATTER'; return 'INCONCLUSIVE'; }
const L=(x,y)=>Math.log((x+1)/(y+1));
const fmt=st=>`mean L=${st.m.toFixed(3)} (ratio ${Math.exp(st.m).toFixed(2)})  95%CI [${st.lo.toFixed(3)}, ${st.hi.toFixed(3)}] (ratio [${Math.exp(st.lo).toFixed(2)}, ${Math.exp(st.hi).toFixed(2)}])`;
if(counted.length<5){ console.log('\nVERDICT: INCONCLUSIVE (fewer than 5 counted seeds)'); process.exit(); }
const sb=stat(rows.map(r=>L(r.B.birthsAfter,mean(r.nb))),'births'), sa=stat(rows.map(r=>L(r.B.aliveEnd,mean(r.na))),'alive');
const pb=stat(rows.map(r=>L(r.nb[0],mean(r.nb.slice(1)))),'placebo births'), pa=stat(rows.map(r=>L(r.na[0],mean(r.na.slice(1)))),'placebo alive');
console.log('\ncounted seeds:',counted.length);
console.log('BIRTHS BLANK vs NUDGE:   ',fmt(sb),'->',verdict(sb));
console.log('ALIVE  BLANK vs NUDGE:   ',fmt(sa),'->',verdict(sa));
console.log('PLACEBO births (NUDGE1 vs 2-4):',fmt(pb));
console.log('PLACEBO alive  (NUDGE1 vs 2-4):',fmt(pa));
console.log('collapse (alive<5) in any BLANK run:',rows.some(r=>r.B.aliveEnd<5));
console.log('per-seed births ratio BLANK/NUDGE-mean:',rows.map(r=>(r.B.birthsAfter/Math.max(mean(r.nb),0.5)).toFixed(2)).join(' '));
