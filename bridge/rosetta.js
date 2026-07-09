// ═══════════════════════════════════════════════════════════════════════════
// ROSETTA — the shared interlingua. NOT a bag of floats: a universal vocabulary
// of the five things every generative/computational system does. Each system
// speaks OUT its structure in these gestures and hears IN gestures as its own
// primitives, mapped BY ROLE. Meaning (e.g. "branchy") is what crosses, expressed
// in each local dialect.
//
//   0 DRAW    emit / place a unit of structure
//   1 TURN    signed modulation (direction from param sign)
//   2 BRANCH  open a divergence
//   3 MERGE   recombine / close / select
//   4 REPEAT  iterate / scale / recurse
//
// A genome-in-transit is an ordered array of [G, param] gestures + origin tag.
// Grounded in Pe's real VM semantics (index.html line 9319):
//   op0 copy→DRAW  op1 +=si*k→TURN  op2 *=→REPEAT  op3 threshold→BRANCH  op4 EMIT→MERGE
// ═══════════════════════════════════════════════════════════════════════════
const G = { DRAW:0, TURN:1, BRANCH:2, MERGE:3, REPEAT:4 };
const CORE_OP_GESTURE = [G.DRAW, G.TURN, G.REPEAT, G.BRANCH, G.MERGE]; // op%5 → gesture, exact for core arithmetic ops 0..4
function clampP(x){ x=+x; if(!isFinite(x))return 0; return x<-1?-1:x>1?1:x; }

// ── PE  (index.html is NEVER modified; these adapters live in the listeners) ──
function peOpToGesture(op){ op=Math.abs(op|0); return CORE_OP_GESTURE[op%5]; } // arithmetic-family residue; exact for 0..4
function peNativeToGestures(pkt){
  const out=[];
  const push=(op,p)=>out.push([peOpToGesture(op), clampP(p)]);
  const d=pkt.data;
  if(pkt.type==='motif' && Array.isArray(d)){                 // [[op,src,dst,k],...]
    for(const ins of d) if(Array.isArray(ins)) push(ins[0], ins[3]);
  } else if(pkt.type==='plasmid' && Array.isArray(d)){
    for(const ins of d) if(Array.isArray(ins)) push(ins[0], ins[3]);
  } else if(pkt.type==='migrant' && d){
    if(Array.isArray(d.plasmid)) for(const ins of d.plasmid) if(Array.isArray(ins)) push(ins[0], ins[3]);
    if(Array.isArray(d.tend)) for(const t of d.tend) out.push([G.DRAW, clampP(t)]); // traits as placed structure
  } else if(pkt.type==='inscription' && d){
    push(d.op, (d.A||0)-(d.B||0));
  }
  return out;
}
// synthesize a VALID native Pe motif from gestures, so a new system can inform
// Pe THROUGH PE'S OWN structured receive path — no change to index.html.
function gesturesToPeMotif(gestures){
  const GEST_OP=[0,1,2,3,4]; // DRAW→copy TURN→+= BRANCH→threshold MERGE→emit REPEAT→scale (index into core ops)
  const inv={[G.DRAW]:0,[G.TURN]:1,[G.BRANCH]:3,[G.MERGE]:4,[G.REPEAT]:2};
  const m=[];
  for(const [g,p] of gestures){ const op=inv[g]!==undefined?inv[g]:0; m.push([op,(Math.random()*8)|0,(Math.random()*8)|0, clampP(p)]); }
  return m.length?m:[[0,0,0,0]];
}

// ── L-SYSTEM ──  F=DRAW  +/-=TURN±  [=BRANCH  ]=MERGE  (REPEAT→doubles prior draw)
function lsysToGestures(rule){
  const out=[];
  for(const ch of rule){
    if(ch==='F')out.push([G.DRAW,0]);
    else if(ch==='+')out.push([G.TURN,0.6]);
    else if(ch==='-')out.push([G.TURN,-0.6]);
    else if(ch==='[')out.push([G.BRANCH,0]);
    else if(ch===']')out.push([G.MERGE,0]);
  }
  return out;
}
function gesturesToLsys(gestures){
  let s='';
  for(const [g,p] of gestures){
    if(g===G.DRAW)s+='F';
    else if(g===G.TURN)s+=(p>=0?'+':'-');
    else if(g===G.BRANCH)s+='[';
    else if(g===G.MERGE)s+=']';
    else if(g===G.REPEAT)s+=(s.length?s[s.length-1]:'F'); // iterate the last gesture
  }
  // balance brackets
  let depth=0,out=''; for(const ch of s){ if(ch==='[')depth++; if(ch===']'){ if(depth<=0)continue; depth--; } out+=ch; }
  while(depth-->0)out+=']';
  return out||'F';
}

// ── CHEMISTRY (SKI) ──  I=DRAW(pass)  S=BRANCH(duplicate)  K=MERGE(select)  app=REPEAT(apply)
function chemToGestures(term){
  const out=[];
  (function walk(t){
    if(t[0]==='app'){ out.push([G.REPEAT,0]); walk(t[1]); walk(t[2]); }
    else if(t[0]==='S')out.push([G.BRANCH,0]);
    else if(t[0]==='K')out.push([G.MERGE,0]);
    else out.push([G.DRAW,0]); // I
  })(term);
  return out;
}
function gesturesToChem(gestures){
  // fold gestures into a term via left-application; DRAW→I, BRANCH→S, MERGE→K,
  // REPEAT→apply(prev,next), TURN→bias (near-0→I, else S/K by sign)
  const atoms=[];
  for(const [g,p] of gestures){
    if(g===G.DRAW)atoms.push(['I']);
    else if(g===G.BRANCH)atoms.push(['S']);
    else if(g===G.MERGE)atoms.push(['K']);
    else if(g===G.TURN)atoms.push(Math.abs(p)<0.2?['I']:(p>=0?['S']:['K']));
    else if(g===G.REPEAT){ if(atoms.length>=1)atoms.push(atoms[atoms.length-1]); else atoms.push(['I']); }
  }
  if(!atoms.length)return ['I'];
  let t=atoms[0];
  for(let i=1;i<atoms.length;i++) t=['app',t,atoms[i]];
  return t;
}

// meaning fingerprint: normalized gesture-category histogram (what a message MEANS)
function gestureProfile(gestures){
  const c=[0,0,0,0,0]; for(const [g] of gestures) c[g]++;
  const n=gestures.length||1; return c.map(x=>x/n);
}

module.exports = { G, clampP, peOpToGesture, peNativeToGestures, gesturesToPeMotif,
  lsysToGestures, gesturesToLsys, chemToGestures, gesturesToChem, gestureProfile };
