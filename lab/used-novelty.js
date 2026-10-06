// lab/used-novelty.js - "used novelty that sticks", scored the way #291 says it must be.
// Two faults in the cos/sticky metric (lab/STICKY-SEARCH.md), both found in review (#291):
//   1. USE BY INCOME ONLY. A trick counted as used if 1% of organisms CARRIED it, so hitchhikers that earn nothing scored as
//      inventions (the #286 lesson: carrying a METAB instruction is not using it). Here a trick is used in a window only when
//      its mean share of income is at least MIN (default 1%). Carrier share is never read.
//   2. THE DESIGN MUST BEAT ITS OWN NO-SELECTION TWIN OUTRIGHT. The old bar compared (X - D) with (DR - DRIFT), a difference
//      of differences, and X never beat its drift twin DR directly (c055 on 401-403: 12.8/13.9/14.2 against 20.3/16.1/17.2).
//      Here every null - DR included - must be beaten outright, on the seed and in the mean.
// Income is read from whichever readout a row has: body.bU (heritable-body worlds, cos branches; under BODY_DRIFT it is the
// would-be income of shadow bodies, the same quantity measured without selection), chem.flux (CHEM worlds) or tasks.flux
// (TASKS worlds). All three are [key, share of income] lists.
//
//   new(w)  = used in window w and never used in an earlier window
//   st(w)   = how many of new(w) are still used in window w+LAG
//   S       = mean st over the late third of the windows that have a w+LAG (also: the middle third, and K = cumulative st)
//
// CLI, one seed: node lab/used-novelty.js WIN=10 X=x.jsonl R=r.jsonl SH=sh.jsonl DR=dr.jsonl   (any arm names; X is the design)
// Library:      const {S, bar}=require('./used-novelty.js')
'use strict';
const fs=require('fs');

function readRows(f){ return fs.readFileSync(f,'utf8').trim().split('\n').map(l=>{ try{ return JSON.parse(l); }catch(e){ return null; } }).filter(r=>r&&r.N>0); }
function incomeList(r){ if(r.body&&r.body.bU)return r.body.bU; if(r.chem&&r.chem.flux)return r.chem.flux; if(r.tasks&&r.tasks.flux)return r.tasks.flux; return null; }

// used[w]: the set of keys whose mean income share over window w is at least min. No carrier share, ever.
function usedSets(rows,WIN,min){ const nW=Math.floor(rows.length/WIN), used=[];
  for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), inc=new Map();
    for(const r of W){ const L=incomeList(r); if(!L)throw new Error('row at t='+r.t+' has no income readout (body.bU, chem.flux or tasks.flux)'); for(const [k,v] of L)inc.set(k,(inc.get(k)||0)+v/W.length); }
    used.push(new Set([...inc].filter(([k,v])=>v>=min).map(([k])=>k))); }
  return used; }

function S(rows,opt){ opt=opt||{}; const WIN=opt.WIN||10, MIN=opt.MIN!==undefined?opt.MIN:0.01, LAG=opt.LAG||2;
  const used=usedSets(rows,WIN,MIN), nW=used.length, ever=new Set(), st=[];
  for(let w=0;w<nW;w++){ const n=[...used[w]].filter(k=>!ever.has(k)); n.forEach(k=>ever.add(k)); if(w+LAG<nW)st.push(n.filter(k=>used[w+LAG].has(k)).length); }
  const E=st.length, th=Math.floor(E/3); if(th<1)return {late:NaN,middle:NaN,windows:nW,st,K:[]};
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length; let k=0; const K=st.map(x=>k+=x);
  return {late:mean(st.slice(E-th)),middle:mean(st.slice(E-2*th,E-th)),windows:nW,usedEver:ever.size,st,K}; }

// The bar over seeds. arms[seed] = {X:{S,collapse}, R:{...}, SH:{...}, DR:{...}, ...}. Every arm other than X is a null that
// X must beat outright: on at least SEEDS_WIN of the seeds (default: 2 of 3), and in the mean by REL (default 1.10, on S+1).
function bar(arms,opt){ opt=opt||{}; const REL=opt.REL||1.10, seeds=Object.keys(arms), need=opt.SEEDS_WIN||Math.ceil(seeds.length*2/3);
  const nulls=Object.keys(arms[seeds[0]]).filter(a=>a!=='X'), per=[], col=[]; let wins=0;
  for(const s of seeds){ const A=arms[s], beat=nulls.filter(a=>A.X.S>A[a].S); const all=beat.length===nulls.length; if(all)wins++;
    for(const a of ['X',...nulls]) if(A[a].collapse)col.push(a+'@'+s);
    per.push({seed:s,X:A.X.S,...Object.fromEntries(nulls.map(a=>[a,A[a].S])),beatsAll:all,lostTo:nulls.filter(a=>!(A.X.S>A[a].S))}); }
  const m=a=>seeds.reduce((x,s)=>x+arms[s][a].S,0)/seeds.length, rel=Math.min(...nulls.map(a=>(m('X')+1)/(m(a)+1)));
  const pass=wins>=need&&rel>=REL&&!col.length;
  return {pass,wins,need,seeds:seeds.length,rel,relPass:rel>=REL,collapse:col,per,means:Object.fromEntries(['X',...nulls].map(a=>[a,m(a)]))}; }

module.exports={S,bar,usedSets,incomeList,readRows};

if(require.main===module){ const args=Object.fromEntries(process.argv.slice(2).map(a=>a.split('=')));
  const WIN=+(args.WIN||10), MIN=args.MIN!==undefined?+args.MIN:0.01; delete args.WIN; delete args.MIN;
  if(!args.X){ console.error('usage: node lab/used-novelty.js [WIN=10] [MIN=0.01] X=design.jsonl NAME=null.jsonl ...'); process.exit(1); }
  const out={}; for(const [a,f] of Object.entries(args)){ const r=S(readRows(f),{WIN,MIN}); out[a]=r; console.log(`${a.padEnd(4)} S late ${r.late.toFixed(2)} | middle ${r.middle.toFixed(2)} | used ever ${r.usedEver} | windows ${r.windows} | ${f.split('/').pop()}`); }
  const nulls=Object.keys(out).filter(a=>a!=='X'); const lost=nulls.filter(a=>!(out.X.late>out[a].late));
  console.log(lost.length?`X does NOT beat: ${lost.join(', ')}`:`X beats every null outright (${nulls.join(', ')})`); }
