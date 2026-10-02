// lab/autocat/diag.js - Phase A diagnosis (trial seeds only, no verdict weight). Classifies EVERY executed BUILD by outcome,
// using a read-only replica of World.build's checks, run just before the real build (consumes no RNG, changes no state).
//   SEED=95 TICKS=30000 OPTS='{...}' node lab/autocat/diag.js
'use strict';
const {World}=require('../oee-core.js'); const E=process.env;
const seed=+(E.SEED||95), T=+(E.TICKS||30000), opts=E.OPTS?JSON.parse(E.OPTS):{};
const w=new World(seed,opts), P=w.p, S=P.CHEM_S, C=w.C, cnt={}, inc=k=>{cnt[k]=(cnt[k]||0)+1;};
const orig=World.prototype.build;
w.build=function(c,a,bb){ const m=this.mol; a&=S-1; const b=bb&(S-1);
  if(P.NICHE_RAND_SCHED)inc('randSched'); else if(this.bld&&!this.bld[c])inc('notBuilder');
  else if(this.sId[c]<0){ if(P.NICHE===3)inc('n3');
    else if(this.rec&&this.rec[c]>S){ if(this.E[c]<P.NICHE_BCOST)inc('recipe:energy'); else inc('recipe:BUILT'); }
    else if(P.NICHE_XCOST&&this.E[c]<P.NICHE_XCOST)inc('found:energy');
    else { const ma=m[a*C+c], mb=m[b*C+c], x=a===b?P.NICHE_F*ma/2:P.NICHE_F*Math.min(ma,mb);
      if(!(x>=1e-3)){ inc(ma<2e-3&&mb<2e-3?'found:inputs-both-absent':(ma<2e-3||mb<2e-3)?'found:inputs-one-absent':'found:inputs-too-little');
        if(a===0||b===0)inc('  (involves species 0)'); }
      else if(!this.nCan(b,a))inc('found:cap');
      else { const d=this.nDelta(a,b), eN=this.eMol[a]+this.eMol[b]-d; if(!(d>0))inc('found:binding-not-exergonic'); else if(eN<0)inc('found:eN<0'); else { inc('found:FOUNDED'); if(!this.creg.has(b*256+a))inc('found:FOUNDED-new-compound'); } } } }
  else { const ok=this.sCond&&this.sCond[c]<P.NICHE_UREN; if(ok&&this.E[c]>=P.NICHE_UCOST)inc('ext:(maintained first)');
    const B=this.sId[c], x=this.sAmt[c]; if(m[a*C+c]*P.NICHE_F<x)inc('ext:inputs');
    else if(P.NICHE_XCOST&&this.E[c]<P.NICHE_XCOST)inc('ext:energy');
    else { const d=this.nDelta(a,B), eN=this.eMol[a]+this.sE[c]-d; if(!(d>0))inc('ext:binding-not-exergonic'); else if(eN<0)inc('ext:eN<0'); else { inc('ext:EXTENDED'); if(!this.creg.has(B*256+a))inc('ext:EXTENDED-new-compound'); } } }
  inc('ALL'); return orig.call(this,c,a,bb); };
// presence census: how many species are present (>=2e-3) in an average occupied cell
let pres=0, presN=0; const t0=Date.now();
for(let s=1;s<=T;s++){ w.step(); if(s%5000===0){ for(let k=0;k<200;k++){ const c=(k*7919)%C; let q=0; for(let z=0;z<S;z++) if(w.mol[z*C+c]>=2e-3)q++; pres+=q; presN++; } } }
const wall=(Date.now()-t0)/1000;
let st=0; for(let c=0;c<C;c++) if(w.sId[c]>=0)st++;
console.log(JSON.stringify({seed,T,wallS:wall,perAttemptTotal:cnt.ALL,counts:Object.fromEntries(Object.entries(cnt).sort()),compoundsMade:w.cMade,structNow:st,meanSpeciesPresentPerCell:+(pres/presN).toFixed(2),buildCarriers:null},null,1));
