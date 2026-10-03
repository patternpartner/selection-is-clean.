// Phase A3 design rule (mode pick) and go criterion (mode go), fixed in PHASEA3 before any result.
//   node body-check.js pick B1.json B2.json B3.json      SEEDS="70 71 72"
//   node body-check.js go long.json                       SEEDS="73 74 75"
const fs=require('fs'), [mode,...files]=process.argv.slice(2), SEEDS=(process.env.SEEDS||'70 71 72').split(' '), NULLS=(process.env.NULLS||'NOINH RANDCAP SHUF FIXED').split(' '), ARMS=['FULL',...NULLS];
const pop=(r,s)=>{ const b=r['BASE'+s], f=[]; for(const a of ARMS){ const x=r[a+s]; if(!x){ f.push(a+' missing'); continue; } if(x.reseeds>0)f.push(`${a}${s} reseeded`); if(b&&x.N<0.5*b.N)f.push(`${a}${s} N ${x.N.toFixed(0)} < 50% of BASE ${b.N.toFixed(0)}`); } return f; };
if(mode==='pick'){ const out=[]; for(const f of files){ const r=JSON.parse(fs.readFileSync(f)); let ahead=0, dq=[], sh=[];
    for(const s of SEEDS){ const F=r['FULL'+s]; if(!F){ dq.push('missing'); continue; } sh.push(F.share); for(const a of NULLS){ const x=r[a+s]; if(x&&F.Lu>x.Lu)ahead++; } dq.push(...pop(r,s)); }
    out.push({name:f.split('/').pop().replace('.json',''),ahead,sh:sh.reduce((a,b)=>a+b,0)/Math.max(1,sh.length),dq}); }
  const ok=out.filter(o=>!o.dq.length), pool=(ok.length?ok:out).slice().sort((a,b)=>b.ahead-a.ahead||b.sh-a.sh);
  for(const o of out)console.log(`${o.name}: FULL-ahead ${o.ahead}/${NULLS.length*SEEDS.length}, FULL late body share ${(100*o.sh).toFixed(1)}%, ${o.dq.length?'DISQUALIFIED ('+o.dq.join('; ')+')':'qualified'}`);
  console.log(`CHOSEN ${pool[0].name}${ok.length?'':' (all disqualified: least-bad, flagged)'}`); }
else { const r=JSON.parse(fs.readFileSync(files[0])); let go=true;
  for(const s of SEEDS){ const F=r['FULL'+s]; if(!F){ console.log(`seed ${s}: missing`); go=false; continue; } const fail=[];
    for(const a of NULLS){ const x=r[a+s]; if(!x||!(F.Lu>x.Lu))fail.push('> '+a); } if(!(F.tr>=0))fail.push('trend>=0'); if(!(F.share>=0.10))fail.push('body share>=10%'); fail.push(...pop(r,s));
    console.log(`seed ${s}: FULL Lu ${F.Lu.toFixed(2)} trend ${F.tr.toFixed(3)} body ${(100*F.share).toFixed(1)}% N ${F.N.toFixed(0)} | `+NULLS.map(a=>`${a} ${r[a+s]?r[a+s].Lu.toFixed(2):'-'}`).join(' ')+` -> ${fail.length?'FAILS ['+fail.join(', ')+']':'passes'}`); if(fail.length)go=false; }
  console.log(go?'=> GO: propose a deciding round.':'=> NO-GO.'); }
