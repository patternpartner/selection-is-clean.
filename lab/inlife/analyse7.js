const fs=require('fs'); const S=process.argv[2]; const seeds=[31,32,33,34,35,36,37,38];
let s=424242; const rnd=()=>{ s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; };
const mean=x=>x.reduce((a,b)=>a+b,0)/Math.max(x.length,1);
const D={}, per={}, counted=[];
for(const sd of seeds){ const f=S+'/d7-'+sd+'.json'; if(!fs.existsSync(f)){ console.log('seed',sd,'MISSING'); continue; } const j=JSON.parse(fs.readFileSync(f,'utf8')); D[sd]=j;
  // outcome columns: 0 arm, 1 survived, 2 kids, then derived 'reproduced' = kids>0
  const rows=j.indiv.map(r=>[r[0],r[1],r[2]>0?1:0,r[3],r[4],r[5],r[2]]);
  const g=a=>rows.filter(r=>r[0]===a); per[sd]={B:g('BLANK'),Sh:g('SHAM'),C:g('CONTROL'),U:g('UNCHANGED')};
  const ok=!j.err&&per[sd].B.length>=30; if(ok)counted.push(sd);
  const f3=(a,i)=>mean(a.map(r=>r[i])).toFixed(3);
  console.log(sd,'eligible',j.integrity.eligible,'perArm',per[sd].B.length,'| surv BLANK/SHAM/CONTROL/UNCH',f3(per[sd].B,1),f3(per[sd].Sh,1),f3(per[sd].C,1),f3(per[sd].U,1),'| repro BLANK/SHAM/CONTROL',f3(per[sd].B,2),f3(per[sd].Sh,2),f3(per[sd].C,2),'| reblanked',j.integrity.reblanked,'recloned',j.integrity.recloned,'| counted',ok);
}
console.log('\nMANIPULATION CHECK (ALIVE blank founders empty, measured before each re-empty):');
for(const sd of counted){ const cs=D[sd].curve.filter(c=>c.blankAlive!==undefined); console.log(sd,cs.map(c=>'t'+c.t+': '+c.blankAliveEmpty+'/'+c.blankAlive).join('  ')); }
const pool=(A,Bk,idx)=>mean(counted.flatMap(sd=>per[sd][A]).map(r=>r[idx]))-mean(counted.flatMap(sd=>per[sd][Bk]).map(r=>r[idx]));
function analyse(A,Bk,idx,name){
  const d=pool(A,Bk,idx); let ge=0; const P=20000;
  for(let p=0;p<P;p++){ let sa=0,na=0,sb=0,nb=0; for(const sd of counted){ const all=per[sd][A].concat(per[sd][Bk]); for(let k=all.length-1;k>0;k--){ const j=Math.floor(rnd()*(k+1)); const t=all[k]; all[k]=all[j]; all[j]=t; } const h=per[sd][A].length; for(let k=0;k<all.length;k++){ if(k<h){sa+=all[k][idx];na++;} else {sb+=all[k][idx];nb++;} } } if(Math.abs(sa/na-sb/nb)>=Math.abs(d)-1e-12)ge++; }
  const pv=(ge+1)/(P+1); const bs=[];
  for(let b=0;b<4000;b++){ let sa=0,na=0,sb=0,nb=0; for(const sd of counted){ const X=per[sd][A],Y=per[sd][Bk]; for(let k=0;k<X.length;k++){ sa+=X[Math.floor(rnd()*X.length)][idx]; na++; } for(let k=0;k<Y.length;k++){ sb+=Y[Math.floor(rnd()*Y.length)][idx]; nb++; } } bs.push(sa/na-sb/nb); }
  bs.sort((x,y)=>x-y); const lo=bs[Math.floor(0.025*bs.length)], hi=bs[Math.floor(0.975*bs.length)];
  const signs=counted.map(sd=>Math.sign(mean(per[sd][A].map(r=>r[idx]))-mean(per[sd][Bk].map(r=>r[idx]))));
  console.log('\n'+name+': D='+d.toFixed(4)+'  p='+pv.toFixed(4)+'  95%CI ['+lo.toFixed(3)+', '+hi.toFixed(3)+']  per-seed signs '+signs.join(' '));
  return {d,pv,lo,hi,signs}; }
const prim=analyse('B','Sh',1,'PRIMARY  survival  BLANK - SHAM');
analyse('B','Sh',2,'SECONDARY reproduced-at-all  BLANK - SHAM');
const cs=pool('C','Sh',1); console.log('\nGUARD CONTROL - SHAM survival =',cs.toFixed(4),'(COMPROMISED if |.|>0.05)');
console.log('pooled survival  BLANK',mean(counted.flatMap(sd=>per[sd].B).map(r=>r[1])).toFixed(3),' SHAM',mean(counted.flatMap(sd=>per[sd].Sh).map(r=>r[1])).toFixed(3),' CONTROL',mean(counted.flatMap(sd=>per[sd].C).map(r=>r[1])).toFixed(3));
console.log('pooled reproduced  BLANK',mean(counted.flatMap(sd=>per[sd].B).map(r=>r[2])).toFixed(3),' SHAM',mean(counted.flatMap(sd=>per[sd].Sh).map(r=>r[2])).toFixed(3),' CONTROL',mean(counted.flatMap(sd=>per[sd].C).map(r=>r[2])).toFixed(3));
const need=Math.ceil(counted.length*2/3), neg=prim.signs.filter(x=>x<0).length;
let v='INCONCLUSIVE';
if(counted.length<4) v='INCONCLUSIVE (fewer than 4 counted seeds)';
else if(prim.d<=-0.10&&prim.pv<0.05&&neg>=need) v='SENSITIVE';
else if(prim.lo>=-0.08&&prim.hi<=0.08) v='INSENSITIVE';
if(Math.abs(cs)>0.05) v+=' [COMPROMISED]';
console.log('\ncounted seeds:',counted.length,' need negative on >=',need,'\nVERDICT:',v);
