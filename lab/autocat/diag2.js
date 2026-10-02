// lab/autocat/diag2.js - why do CATALYSED (NICHE_AC 2) founding attempts fail? Read-only replica of nFoundAC's checks.
//   SEED=93 TICKS=40000 OPTS='{...}' node lab/autocat/diag2.js
'use strict'; const {World}=require('../oee-core.js'); const E=process.env;
const w=new World(+(E.SEED||93),E.OPTS?JSON.parse(E.OPTS):{}), P=w.p, C=w.C, cnt={}, inc=k=>{cnt[k]=(cnt[k]||0)+1;}, orig=World.prototype.nFoundAC;
w.nFoundAC=function(c,a,b,f1,f2,toOrg){ if(toOrg){ const m=this.mol, x=f1===f2?P.NICHE_F*m[f1*C+c]/2:P.NICHE_F*Math.min(m[f1*C+c],m[f2*C+c]);
    if(!(x>=1e-3))inc(m[f1*C+c]<2e-3?'no feedstock in cell':'feedstock too little'); else { const d=this.nDelta(a,b), eN=this.eMol[a]+this.eMol[b]-d, v=(this.eMol[f1]+this.eMol[f2]-eN)*x;
      if(!(d>0))inc('named pair not exergonic'); else if(eN<0)inc('eN<0'); else if(v<0&&this.E[c]+v<(P.NICHE_XCOST||0)+1e-3)inc('cannot pay endergonic synthesis'); else inc('FOUNDED'); } }
  return orig.call(this,c,a,b,f1,f2,toOrg); };
for(let s=1;s<=+(E.TICKS||40000);s++)w.step(); console.log(JSON.stringify(cnt));
