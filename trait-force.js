// #257 — trait-homogeniser knockouts, shared by the rigs that run them (harness-oee.js; harness-sweep.js carries the
// same four inline, from before this module existed - keep them identical). Each knockout is RE-INSTALLED EVERY TICK,
// because the engine mutates genes and proposes laws under a rig (#216i):
//   bleed0   genome.tendencyBleed = 0, germline and every living particle - processGrid's neighbour trait blend
//   shrink1  law BIRTH_SHRINK = 1 - a birth no longer drags both parents toward the origin
//   blend0   law CONTACT_BLEND = 0 - no parent averaging at a birth
//   toll0    TEND_TOLL = 0 - no amplitude charged beyond TEND_SOFT (source-patched from const to let; one site, asserted)
// #258 adds the in-life forces the family-tree null does not have (source patches, site counts asserted):
//   motif0   the pull toward the best-matching stable motif (0.0001 x similarity per tick) is zeroed
//   nfd0     the trait NFD is off: no amp nudge by coarse-bin rarity (NFD_STRENGTH 0) and no rarity upkeep discount
//            (pRarity 1 for everyone - every particle pays full upkeep, as the commonest kind already did)
//   vmbleed0 the VM's evolved trait bleed between interacting particles (vmActions[3], executeVM and
//            executeClusterVM - two sites) is zeroed
//   (gt0 - the GLOBALTEND knob at 0, swing #21's lineage-local pull off - is gone: #258b deleted the pull, so it
//   had no gate left; an entry with no gate is a control that reads like one)
// #262 adds a REPAIR, not a knockout (one site, asserted):
//   nfdocc   the trait NFD divides by the mean over OCCUPIED cells, counted from the living (the program NFD's form),
//            instead of N/64 - with N/64 almost every living particle sits at the -1 clamp (harness-nfdsat.js)
// #266 adds the PROGRAM NFD's knockout (one site, asserted):
//   gnfd0    swing #37's program-vocabulary NFD off (GENO_NFD_ON 0): no amp nudge by program-signature rarity
// FORCE=a,b in the environment picks them. Draws nothing.
const FORCES=['bleed0','shrink1','blend0','toll0','motif0','nfd0','vmbleed0','nfdocc','gnfd0'];
function parse(env){ const F=String(env||'').split(',').filter(Boolean);
  for(const f of F) if(!FORCES.includes(f)) throw new Error('unknown FORCE '+f+' (known: '+FORCES.join(',')+')');
  return F; }
const PATCHES={
  toll0:[['const TEND_TOLL=0.010;','let TEND_TOLL=0.010;',1]],
  motif0:[['*0.0001*bestSim;','*0*bestSim;',1]],
  nfd0:[['TCELLS=TBINS*TBINS*TBINS, NFD_STRENGTH=0.004;','TCELLS=TBINS*TBINS*TBINS, NFD_STRENGTH=0;',1],
        ['pRarity[_i]=RARITY_DISCOUNT+(1-RARITY_DISCOUNT)*Math.min(1,_bc/(_mean+0.001));','pRarity[_i]=1;',1]],
  vmbleed0:[['const tbleed=vmActions[3]*influence;','const tbleed=0;',2]],
  gnfd0:[['const GENO_NFD_ON=1;','const GENO_NFD_ON=0;',1]],
  nfdocc:[['const _mean=N/TCELLS;','let _nl=0,_oc=0; for(let _c=0;_c<TCELLS;_c++) if(tHist[_c]){ _oc++; _nl+=tHist[_c]; } const _mean=_nl/Math.max(1,_oc);',1]]};
function patch(code,F){
  for(const f of F) for(const [site,rep,want] of (PATCHES[f]||[])){ const n=code.split(site).length-1;
    if(n!==want) throw new Error(f+': site count '+n+', expected '+want+' ('+site.slice(0,40)+')');
    code=code.split(site).join(rep); }
  return code; }
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
