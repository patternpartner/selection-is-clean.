// Phase A2 go criterion (fixed in PHASEA2 before any result). node gocheck.js long.json
const r=JSON.parse(require('fs').readFileSync(process.argv[2])), SEEDS=(process.env.SEEDS||'83 84 85').split(' '); let go=true;
for(const s of SEEDS){ const F=r['FULL'+s], ns=r['FULLNS'+s], fail=[]; if(!F){ console.log(`seed ${s}: missing`); go=false; continue; }
  for(const a of ['NOAC','RAND','RANDN','SHUF']){ const x=r[a+s]; if(!x||!(F.Lu>x.Lu))fail.push('> '+a); }
  if(!(F.tr>=0))fail.push('trend>=0'); if(!(F.strInc>=0.10))fail.push('structure income>=10%');
  for(const a of ['FULL','NOAC','RAND','RANDN','SHUF']){ const x=r[a+s]; if(x&&(x.reseeds>0||(ns&&x.N<0.5*ns.N)))fail.push(a+' population'); }
  console.log(`seed ${s}: FULL Lu ${F.Lu.toFixed(2)} trend ${F.tr.toFixed(3)} struct ${(100*F.strInc).toFixed(1)}% N ${F.N.toFixed(0)} (FULLNS ${ns?ns.N.toFixed(0):'-'}) | NOAC ${r['NOAC'+s]?.Lu.toFixed(2)} RAND ${r['RAND'+s]?.Lu.toFixed(2)} RANDN ${r['RANDN'+s]?.Lu.toFixed(2)} SHUF ${r['SHUF'+s]?.Lu.toFixed(2)} -> ${fail.length?'FAILS ['+fail.join(', ')+']':'passes'}`); if(fail.length)go=false; }
console.log(go?'=> GO: propose a deciding round.':'=> NO-GO.');
