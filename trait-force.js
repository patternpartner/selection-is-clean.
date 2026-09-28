// #257 — trait-homogeniser knockouts, shared by the rigs that run them (harness-oee.js; harness-sweep.js carries the
// same four inline, from before this module existed - keep them identical). Each knockout is RE-INSTALLED EVERY TICK,
// because the engine mutates genes and proposes laws under a rig (#216i):
//   bleed0   genome.tendencyBleed = 0, germline and every living particle - processGrid's neighbour trait blend
//   shrink1  law BIRTH_SHRINK = 1 - a birth no longer drags both parents toward the origin
//   blend0   law CONTACT_BLEND = 0 - no parent averaging at a birth
//   toll0    TEND_TOLL = 0 - no amplitude charged beyond TEND_SOFT (source-patched from const to let; one site, asserted)
// FORCE=a,b in the environment picks them. Draws nothing.
const FORCES=['bleed0','shrink1','blend0','toll0'];
function parse(env){ const F=String(env||'').split(',').filter(Boolean);
  for(const f of F) if(!FORCES.includes(f)) throw new Error('unknown FORCE '+f+' (known: '+FORCES.join(',')+')');
  return F; }
function patch(code,F){ if(!F.includes('toll0'))return code;
  const site='const TEND_TOLL=0.010;', n=code.split(site).length-1;
  if(n!==1) throw new Error('TEND_TOLL site count '+n+', expected 1');
  return code.replace(site,'let TEND_TOLL=0.010;'); }
// appended to the engine source: defines globalThis.__applyForce(F), to be called before every loop()
// NO BACKTICKS in this string: it is compiled inside the engine's own source.
const DRIVER=`
;globalThis.__applyForce=(function(){ let S1=null,B0=null;
  return function(F){ if(!F||!F.length)return;
    if(!S1){ S1=LAW_DECLARED.find(x=>x.name==='BIRTH_SHRINK'); B0=LAW_DECLARED.find(x=>x.name==='CONTACT_BLEND'); }
    if(F.includes('bleed0')){ genome.tendencyBleed=0; for(let i=0;i<N;i++) if(palive[i]&&pGenome[i])pGenome[i].tendencyBleed=0; }
    if(F.includes('shrink1'))S1.set(1);
    if(F.includes('blend0'))B0.set(0);
    if(F.includes('toll0'))TEND_TOLL=0; }; })();
`;
module.exports={FORCES,parse,patch,DRIVER};
