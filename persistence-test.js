// #145 acceptance test — a creature must be able to save itself, and to come back from its own save.
//
// Found by measuring a REAL exported creature (generation 5,405, 1,183,286 ticks) rather than a
// simulation. Two independent size failures, both silent:
//
//   SAVING   the autosave is `if(g.length<500000) localStorage.setItem(...)`. That genome was
//            5,289,332 characters — 10.6x the cap — so it had SILENTLY STOPPED SAVING ITSELF. It ran,
//            it evolved, and it persisted nothing. 91.7% of it was the atom bank: 1,793 atoms against
//            192 bindable slots, 1,695 of them never once executed. userAtoms was the one self-authored
//            structure with no ceiling, while boundOpcodes and userEffects have always had one.
//
//   LOADING  sanitizeGenome did `expression.slice(0,160)`, and authoring never knew about that number.
//            Loading that creature's own export back in: 1,663 atoms truncated to exactly 160 chars and
//            1,671 of 1,793 — 93.2% — FAILED TO COMPILE. A cut expression is not a smaller expression,
//            it is unbalanced syntax.
//
// So the invariant is one sentence: ANYTHING THIS ENGINE CAN AUTHOR, IT MUST BE ABLE TO SAVE AND READ
// BACK. These checks drive authoring hard rather than waiting, for the #143 reason.
// Exits non-zero on any failure.   node persistence-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/pers.js'); m.filename='/tmp/pers.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(ticks,force){
  for(let s=0;s<ticks;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  const out={};
  const savedRate=genome.mutationRate;
  for(let i=0;i<force;i++){ genome.mutationRate=0.9; try{mutateGenome();}catch(e){} }
  genome.mutationRate=savedRate;

  // Read the two ceilings defensively: a build that has neither is precisely the build this test was
  // written against, and it should report that as a failure rather than die on a ReferenceError.
  const ATOM_CAP=(typeof MAX_USER_ATOMS!=='undefined')?MAX_USER_ATOMS:Infinity;
  const EXPR_CAP=(typeof UA_EXPR_MAX!=='undefined')?UA_EXPR_MAX:160;  // the sanitiser's long-standing cut
  const uas=genome.userAtoms||[], bos=genome.boundOpcodes||[];
  out.bankIsCapped   = ATOM_CAP!==Infinity && uas.length<=ATOM_CAP;
  out.everyExprFits  = uas.every(a=>typeof a.expression==='string'&&a.expression.length<=EXPR_CAP);
  out.boundStillValid= bos.every(i=>i===-1||(i>=0&&i<uas.length));

  // the save must be small enough that the autosave line actually runs
  const blob=encodeGenome();
  out.saveUnderCap   = blob.length<500000;

  // and it must come back — every expression that compiled before must compile after
  const before=uas.map(a=>{ const p={expression:a.expression,compiled:null,failed:false,uses:0,state:0};
    uaCall(p,1,1); return {e:a.expression, ok:!p.failed}; });
  const okBefore=before.filter(x=>x.ok);
  out.decodes = decodeGenome(blob)===true;
  const after=(genome.userAtoms||[]);
  const afterSet=new Set(after.map(a=>a.expression));
  out.noWorkingAtomLost = okBefore.every(x=>afterSet.has(x.e));
  out.nothingArrivesBroken = after.every(a=>{
    const p={expression:a.expression,compiled:null,failed:false,uses:0,state:0};
    uaCall(p,1,1); return !p.failed || a.failed; });   // pre-existing failures may persist; new ones may not
  out.detail={atoms:uas.length, cap:(ATOM_CAP===Infinity?'none':ATOM_CAP),
    exprMax:Math.max(0,...uas.map(a=>a.expression.length)),
    exprCap:EXPR_CAP, saveChars:blob.length, compiledBefore:okBefore.length, afterAtoms:after.length};
  return out;
};`, m.filename);

const r=globalThis.__t(parseInt(process.env.TICKS||'800',10), parseInt(process.env.FORCE||'900',10));
const checks=[
  ['bankIsCapped','the atom bank has a ceiling and respects it'],
  ['everyExprFits','no authored expression exceeds what the save format carries'],
  ['boundStillValid','every bound opcode still points somewhere real'],
  ['saveUnderCap','the genome is small enough that the autosave actually runs'],
  ['decodes','it reads back'],
  ['noWorkingAtomLost','every atom that compiled before still exists after'],
  ['nothingArrivesBroken','nothing arrives newly uncompilable'],
];
let bad=0;
for(const [k,d] of checks){ const ok=r[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(24)+d); }
const D=r.detail;
console.log('\n  atoms '+D.atoms+'/'+D.cap+'   longest expression '+D.exprMax+'/'+D.exprCap
  +'   save '+D.saveChars+' chars (cap 500000)');
console.log(bad? '\n'+bad+' FAILED' : '\na creature can save itself, and come back from its own save');
process.exit(bad?1:0);
