// lab/chance/ce-check.js - CHANCE-ENGINE design rule (pick) and go criterion (go), fixed in lab/CHANCE-ENGINE.md before any result.
//   node ce-check.js pick s1.json            SEEDS="110 111 112"   (arms R1 R2 RANDCAP DIRECT-R1 DIRECT-R2 DRIFT-R1 DRIFT-R2 SHUF-R1 SHUF-R2 BASE)
//   node ce-check.js go long.json R1|R2      SEEDS="113 114 115"   (arms D RANDCAP DIRECT DRIFT SHUF [R1 when D is R2] BASE)
'use strict'; const fs=require('fs'), [mode,file,des]=process.argv.slice(2), SEEDS=(process.env.SEEDS||'110 111 112').split(' ');
const r=JSON.parse(fs.readFileSync(file));
const pop=(arms,s)=>{ const b=r['BASE'+s], f=[]; for(const a of arms){ const x=r[a+s]; if(!x){ f.push(a+s+' missing'); continue; } if(x.reseeds>0)f.push(`${a}${s} reseeded`); if(b&&x.N<0.5*b.N)f.push(`${a}${s} N ${x.N.toFixed(0)} < 50% of BASE ${b.N.toFixed(0)}`); } return f; };
if(mode==='pick'){ const D={R1:['RANDCAP','DIRECT-R1','DRIFT-R1','SHUF-R1'],R2:['RANDCAP','DIRECT-R2','DRIFT-R2','SHUF-R2','R1']}, out=[];
  for(const d of ['R1','R2']){ let ahead=0, tot=0, sh=[], dq=[]; for(const s of SEEDS){ const F=r[d+s]; if(!F){ dq.push(d+s+' missing'); continue; } sh.push(F.share);
      for(const a of D[d]){ tot++; const x=r[a+s]; if(x&&F.Lu>x.Lu)ahead++; } dq.push(...pop([d,...D[d]],s)); }
    out.push({d,ahead,tot,frac:ahead/Math.max(1,tot),sh:sh.reduce((a,b)=>a+b,0)/Math.max(1,sh.length),dq}); }
  const ok=out.filter(o=>!o.dq.length), pool=(ok.length?ok:out).slice().sort((a,b)=>b.frac-a.frac||b.sh-a.sh);
  for(const o of out)console.log(`${o.d}: design-ahead ${o.ahead}/${o.tot} (${(100*o.frac).toFixed(0)}%), late body share ${(100*o.sh).toFixed(1)}%, ${o.dq.length?'DISQUALIFIED ('+o.dq.join('; ')+')':'qualified'}`);
  console.log(`CHOSEN ${pool[0].d}${ok.length?'':' (all disqualified: least-bad, flagged)'}`); }
else { const N=['RANDCAP','DIRECT','DRIFT','SHUF',...(des==='R2'?['R1']:[])]; let go=true, ratio=[];
  for(const s of SEEDS){ const F=r['D'+s]; if(!F){ console.log(`seed ${s}: missing`); go=false; continue; } const fail=[];
    for(const a of N){ const x=r[a+s]; if(!x||!(F.Lu>x.Lu))fail.push('Lu > '+a); }
    for(const a of ['RANDCAP','DRIFT']){ const x=r[a+s]; if(!x||!(F.LuInc>x.LuInc))fail.push('LuInc > '+a); }
    if(!(F.tr>=0))fail.push('trend>=0'); if(!(F.share>=0.10))fail.push('body share>=10%'); fail.push(...pop(['D',...N],s));
    if(r['RANDCAP'+s])ratio.push(F.Lu/Math.max(1e-9,r['RANDCAP'+s].Lu));
    console.log(`seed ${s}: D Lu ${F.Lu.toFixed(2)} LuInc ${F.LuInc.toFixed(2)} trend ${F.tr.toFixed(3)} body ${(100*F.share).toFixed(1)}% N ${F.N.toFixed(0)} | `+N.map(a=>`${a} ${r[a+s]?r[a+s].Lu.toFixed(2)+'/'+r[a+s].LuInc.toFixed(2):'-'}`).join(' ')+` -> ${fail.length?'FAILS ['+fail.join(', ')+']':'passes'}`); if(fail.length)go=false; }
  const mr=ratio.length?ratio.reduce((a,b)=>a+b,0)/ratio.length:0; console.log(`mean Lu(D)/Lu(RANDCAP) over seeds: ${mr.toFixed(3)} (needs >= 1.10)`); if(!(mr>=1.10))go=false;
  console.log(go?'=> GO: propose a deciding round.':'=> NO-GO.'); }
