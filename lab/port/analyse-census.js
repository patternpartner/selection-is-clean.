// #372 - each replayed collapse: does the replay reproduce the #371 run (alive at matching ticks), where is the collapse, and what
// do the diagnostics say in the windows around it.   node lab/port/analyse-census.js [tag ...]
const fs=require('fs'), path=require('path'); const D=path.join(__dirname,'out-census2'), O=path.join(__dirname,'out-laws');
const tags=process.argv.slice(2).length?process.argv.slice(2):fs.readdirSync(D).filter(f=>f.endsWith('.done')).map(f=>f.replace('.done',''));
for(const tag of tags){ const L=fs.readFileSync(path.join(D,tag+'.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  const R=L.filter(r=>r.fnPaid!==undefined), G=new Map(L.filter(r=>r.diag).map(r=>[r.diag,r]));
  const orig=fs.readFileSync(path.join(O,tag+'.jsonl'),'utf8').trim().split('\n').map(JSON.parse).filter(r=>r.fnPaid!==undefined);
  const om=new Map(orig.map(r=>[r.tick,r.alive])); let same=0, cmp=0; for(const r of R){ if(om.has(r.tick)){ cmp++; if(om.get(r.tick)===r.alive)same++; } }
  let peak=0, reached=false, onset=null; for(let w=1;w<R.length;w++){ if(R[w-1].alive>=300)reached=true; peak=Math.max(peak,R[w-1].alive); if(reached&&R[w].alive<0.25*peak&&onset===null){ onset=w; break; } }
  console.log('== '+tag+'  replay matches the #371 run at '+same+'/'+cmp+' shared ticks; collapse below 25% of peak '+peak+' at '+(onset!==null?R[onset].tick:'none'));
  if(onset===null)continue; const lo=Math.max(0,onset-10), hi=Math.min(R.length-1,onset+3);
  for(let w=lo;w<=hi;w++){ const r=R[w], g=G.get(r.tick)||{};
    console.log('  '+String(r.tick).padStart(5)+' alive '+String(r.alive).padStart(4)+' births '+String(g.birth).padStart(4)+' refused '+String(g.refused).padStart(5)+' (unprov '+g.unprovisioned+', ration '+g.rationed+') prey '+String(g.prey).padStart(5)+' pred155 '+String(g.pred155).padStart(4)
      +' meanE '+g.meanE+' age '+g.meanAge+' prov '+g.meanProv+' esc '+g.esc+' bigLin '+g.bigLin+' lin '+g.lineages+' BEC '+g.BEC+' PBC '+g.PBC+' size '+r.meanSz.toFixed(1)+' task '+Math.round(r.taskInc)+(r.lawTrial?' TRIAL '+r.lawTrial:'')); } }
