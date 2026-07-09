const R = require('./rosetta.js');
const fs = require('fs');
const {motifs, plasmids} = JSON.parse(fs.readFileSync('/tmp/claude-0/-home-user-selection-is-clean-/09cec8ec-f0e4-5f9a-b966-ecedf109e3ac/scratchpad/pe-instructions-cache.json','utf8'));
const seqs = motifs.concat(plasmids);

function pearson(xs,ys){ const n=xs.length,mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;
  let sx=0,sy=0,sxy=0; for(let i=0;i<n;i++){const dx=xs[i]-mx,dy=ys[i]-my;sx+=dx*dx;sy+=dy*dy;sxy+=dx*dy;}
  return sxy/(Math.sqrt(sx*sy)||1); }
function frac(str,ch){ let c=0; for(const x of str) if(x===ch)c++; return c/(str.length||1); }
function termFrac(term,sym){ let c=0,n=0; (function w(t){ n++; if(t[0]==='app'){w(t[1]);w(t[2]);} else if(t[0]===sym)c++; })(term); return c/n; }

// ── 1. ROUND-TRIP FIDELITY (L-system): gestures -> rule -> gestures ──
let lossless=0, total=0;
for(const seq of seqs.slice(0,3000)){
  const pkt={type:'motif',data:seq};
  const g1=R.peNativeToGestures(pkt);
  const rule=R.gesturesToLsys(g1);
  const g2=R.lsysToGestures(rule);
  // L can't express TURN magnitude or REPEAT/scale, so compare the L-expressible projection
  const proj=g=>g.filter(x=>x[0]!==R.G.REPEAT).map(x=>x[0]===R.G.TURN?[R.G.TURN,Math.sign(x[1])||1]:[x[0]]);
  total++;
  if(JSON.stringify(proj(g1))===JSON.stringify(g2.map(x=>x[0]===R.G.TURN?[R.G.TURN,Math.sign(x[1])||1]:[x[0]]))) lossless++;
}
console.log('L-system round-trip (L-expressible projection) lossless: '+lossless+'/'+total);

// ── 2. CROSS-PARADIGM MEANING PRESERVATION ──
// BRANCH-density in the Pe source must predict branchiness in BOTH target dialects.
const srcBranch=[], lBracket=[], cS=[];
for(const seq of seqs){
  const g=R.peNativeToGestures({type:'motif',data:seq});
  if(!g.length)continue;
  const prof=R.gestureProfile(g);
  srcBranch.push(prof[R.G.BRANCH]);
  lBracket.push(frac(R.gesturesToLsys(g),'['));
  cS.push(termFrac(R.gesturesToChem(g),'S'));
}
console.log('\nMEANING PRESERVATION (n='+srcBranch.length+'):');
console.log('  corr(Pe branch-density, L-system bracket-density) = '+pearson(srcBranch,lBracket).toFixed(3));
console.log('  corr(Pe branch-density, chemistry S-density)       = '+pearson(srcBranch,cS).toFixed(3));

// concrete demonstration: a branch-heavy vs a draw-heavy Pe program
function synthPe(gestKinds){ return gestKinds.map(k=>[ {DRAW:0,TURN:1,REPEAT:2,BRANCH:3,MERGE:4}[k], 0,0, 0.3 ]); }
const branchy=synthPe(['BRANCH','DRAW','BRANCH','DRAW','BRANCH','MERGE','MERGE','MERGE']);
const drawy  =synthPe(['DRAW','DRAW','TURN','DRAW','TURN','DRAW','DRAW','DRAW']);
for(const [name,seq] of [['BRANCH-heavy Pe',branchy],['DRAW-heavy Pe',drawy]]){
  const g=R.peNativeToGestures({type:'motif',data:seq});
  console.log('  '+name+' -> L:"'+R.gesturesToLsys(g)+'"  chem:S-frac='+termFrac(R.gesturesToChem(g),'S').toFixed(2));
}

// ── 3. SPEAK-BACK-TO-PE VALIDITY: synthesized motifs must be well-formed & bounded ──
let validMotifs=0, checked=0;
for(const seq of seqs.slice(0,2000)){
  const g=R.peNativeToGestures({type:'motif',data:seq});
  const motif=R.gesturesToPeMotif(g);
  checked++;
  const ok=Array.isArray(motif)&&motif.length>0&&motif.every(ins=>Array.isArray(ins)&&ins.length===4&&ins.every(x=>Number.isFinite(x))&&Math.abs(ins[3])<=1);
  if(ok)validMotifs++;
}
console.log('\nSPEAK-BACK-TO-PE: well-formed bounded motifs '+validMotifs+'/'+checked);

// ── 4. CHEM round-trip: term -> gestures -> term structural class preserved ──
function randTerm(d){ if(d<=0||Math.random()<0.4){const r=Math.random();return r<0.33?['S']:r<0.66?['K']:['I'];} return ['app',randTerm(d-1),randTerm(d-1)]; }
let chemPreserved=0;
for(let i=0;i<2000;i++){
  const t=randTerm(3);
  const g=R.chemToGestures(t);
  const t2=R.gesturesToChem(g);
  // S/K/I leaf multiset should be preserved (app structure may reassociate)
  const leaves=t=>{const a=[];(function w(x){if(x[0]==='app'){w(x[1]);w(x[2]);}else a.push(x[0]);})(t);return a.sort().join('');};
  if(leaves(t)===leaves(t2))chemPreserved++;
}
console.log('chemistry term leaf-multiset preserved through interlingua: '+chemPreserved+'/2000');
console.log('\nDONE.');
