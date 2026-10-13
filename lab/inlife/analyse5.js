const fs=require('fs'); const S=process.argv[2]; const seeds=[11,12,13,14,15];
let s=987654321; const rnd=()=>{ s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; };
const D={}; for(const sd of seeds){ const j=JSON.parse(fs.readFileSync(S+'/d5-'+sd+'.json','utf8')); D[sd]=j; }
const arm=(sd,a)=>D[sd].indiv.filter(r=>r[0]===a);   // [arm,survived,kids,len,diff,aliased]
const mean=(x)=>x.reduce((a,b)=>a+b,0)/Math.max(x.length,1);
console.log('PER SEED (n per arm | survival REVERT / SHAM / CONTROL / UNCHANGED | offspring mean REVERT / SHAM / CONTROL)');
const counted=[]; const per={};
for(const sd of seeds){ const R=arm(sd,'REVERT'),Sh=arm(sd,'SHAM'),C=arm(sd,'CONTROL'),U=arm(sd,'UNCHANGED'); const ok=!D[sd].err&&R.length>=30;
  if(ok)counted.push(sd); per[sd]={R,Sh,C,U};
  const f=(a,i)=>mean(a.map(r=>r[i])).toFixed(3);
  console.log(sd,'n',R.length,'|',f(R,1),f(Sh,1),f(C,1),f(U,1),'| D(R-S)=',(mean(R.map(r=>r[1]))-mean(Sh.map(r=>r[1]))).toFixed(3),'| kids',f(R,2),f(Sh,2),f(C,2),'| counted',ok); }
console.log('\nBALANCE before treatment (mean program length / mean differing instructions / aliased fraction), pooled');
for(const a of ['REVERT','SHAM','CONTROL']){ const x=counted.flatMap(sd=>per[sd][a==='REVERT'?'R':a==='SHAM'?'Sh':'C']); console.log(a.padEnd(8),mean(x.map(r=>r[3])).toFixed(2),mean(x.map(r=>r[4])).toFixed(2),mean(x.map(r=>r[5])).toFixed(3)); }
const pool=(key,A,B,idx)=>{ const a=counted.flatMap(sd=>per[sd][A]), b=counted.flatMap(sd=>per[sd][B]); return mean(a.map(r=>r[idx]))-mean(b.map(r=>r[idx])); };
function analyse(idx,name){
  const d=pool(0,'R','Sh',idx);
  // stratified permutation: swap REVERT/SHAM labels within seed
  let ge=0; const P=20000; for(let p=0;p<P;p++){ let sa=0,na=0,sb=0,nb=0; for(const sd of counted){ const all=per[sd].R.concat(per[sd].Sh); for(let k=all.length-1;k>0;k--){ const j=Math.floor(rnd()*(k+1)); const t=all[k]; all[k]=all[j]; all[j]=t; } const h=per[sd].R.length; for(let k=0;k<all.length;k++){ if(k<h){sa+=all[k][idx];na++;} else {sb+=all[k][idx];nb++;} } } if(Math.abs(sa/na-sb/nb)>=Math.abs(d)-1e-12)ge++; }
  const pv=(ge+1)/(P+1);
  const bs=[]; for(let b=0;b<4000;b++){ let sa=0,na=0,sb=0,nb=0; for(const sd of counted){ const A=per[sd].R,B=per[sd].Sh; for(let k=0;k<A.length;k++){ sa+=A[Math.floor(rnd()*A.length)][idx]; na++; } for(let k=0;k<B.length;k++){ sb+=B[Math.floor(rnd()*B.length)][idx]; nb++; } } bs.push(sa/na-sb/nb); }
  bs.sort((x,y)=>x-y); const lo=bs[Math.floor(0.025*bs.length)], hi=bs[Math.floor(0.975*bs.length)];
  const signs=counted.map(sd=>Math.sign(mean(per[sd].R.map(r=>r[idx]))-mean(per[sd].Sh.map(r=>r[idx]))));
  console.log('\n'+name+': D(REVERT-SHAM)=',d.toFixed(4),' p(perm,2-sided)=',pv.toFixed(4),' 95%CI [',lo.toFixed(3),',',hi.toFixed(3),']  per-seed signs',signs.join(' '));
  return {d,pv,lo,hi,signs}; }
const prim=analyse(1,'PRIMARY survival to tick 4000');
const sec=analyse(2,'SECONDARY offspring in (1500,4000]');
const cs=pool(0,'C','Sh',1); console.log('\nGUARD CONTROL-SHAM survival =',cs.toFixed(4),' (compromised if |.|>0.05)');
const rc=pool(0,'R','C',1); console.log('REVERT-CONTROL survival =',rc.toFixed(4));
const need=Math.ceil(counted.length*2/3);
const neg=prim.signs.filter(x=>x<0).length, pos=prim.signs.filter(x=>x>0).length;
let verdict='INCONCLUSIVE';
if(counted.length<3) verdict='INCONCLUSIVE (fewer than 3 counted seeds)';
else if(prim.d<=-0.05&&prim.pv<0.05&&neg>=need) verdict='ADAPTIVE';
else if(prim.d>=0.05&&prim.pv<0.05&&pos>=need) verdict='MALADAPTIVE';
else if(prim.lo>=-0.08&&prim.hi<=0.08) verdict='NEUTRAL';
if(Math.abs(cs)>0.05) verdict+=' [COMPROMISED: replacement itself perturbs; compare REVERT vs CONTROL]';
console.log('\ncounted seeds:',counted.length,' need sign agreement >=',need);
console.log('VERDICT:',verdict);
