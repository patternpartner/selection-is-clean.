// #159 acceptance test — one odd character must not be able to stop a creature saving.
//
// THE BUG, reported from the device as two puzzles that turned out to be one: the autosave stopped
// while the simulation kept running, and the SAVE button did nothing while the LOAD button still
// worked. encodeGenome ended `btoa(JSON.stringify(g))`, and btoa throws InvalidCharacterError on any
// character above U+00FF. decodeGenome uses atob, which encodes nothing and cannot fail that way:
//     archiveGenome -> trimGenomeToBudget -> encodeGenome   throws, silent catch, NO SAVE
//     exportFile    -> encodeGenome                          throws, returns null, BUTTON DEAD
//     decodeGenome  -> atob                                  unaffected, LOAD FINE
// One character, arriving in one migrant's vocabulary, permanently disables saving in the universe
// that accepts it — while everything else keeps working, so nothing looks broken.
// Exits non-zero on any failure.   node codec-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/cx.js'); m.filename='/tmp/cx.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(){
  const out={errors:[]};
  const run=(n,f)=>{ try{ return f(); }catch(e){ out.errors.push(n+': '+((e&&e.message)||e).slice(0,120)); return null; } };
  const mk=x=>({expression:x,compiled:null,failed:false,uses:0,age:0,state:0,alienHits:0,alienAttempts:0,creditTrace:0});
  const ODD='(a)+(1.0) \\u2212 \\u00e9\\u4e2d';   // minus sign, e-acute, a CJK char

  // ── 1. the codec survives what btoa could not ──────────────────────────────────────────────
  run('codec',()=>{
    const s='plain ascii {"a":1}';
    out.asciiIdentical = __b64enc(s)===btoa(s);            // byte-identical => every old save still reads
    out.asciiRoundTrip = __b64dec(__b64enc(s))===s;
    out.oddRoundTrip   = __b64dec(__b64enc(ODD))===ODD;    // and it no longer throws
    let threw=false; try{ btoa(ODD); }catch(e){ threw=true; }
    out.btoaStillWouldThrow = threw;                        // proves the test is testing something
  });

  // ── 2. a genome carrying an odd character still SAVES ──────────────────────────────────────
  run('save',()=>{
    genome.userAtoms=[mk('(a)+(1.0)'), mk(ODD)];
    genome.boundOpcodes=[0,1];
    let blob=null, threw=null;
    try{ blob=encodeGenome(); }catch(e){ threw=String(e&&e.message).slice(0,80); }
    out.encodesWithOddChar = threw===null && typeof blob==='string' && blob.length>0;
    out.encodeDidNotThrow  = threw;
    if(blob) out.decodesBack = decodeGenome(JSON.stringify({type:'selection-genome',version:2,genome:blob}))===true;
  });

  // ── 3. the sanitiser drops it, so it cannot linger in the bank ─────────────────────────────
  run('sanitise',()=>{
    genome.userAtoms=[mk('(a)+(1.0)'), mk(ODD), mk('(b)*(2.0)')];
    genome.boundOpcodes=[0,1,2];
    sanitizeGenome();
    const exprs=(genome.userAtoms||[]).map(a=>a.expression);
    out.sanitiserDropsOdd = exprs.indexOf(ODD)<0 && exprs.length===2;
    out.sanitiserKeepsGood = exprs.indexOf('(a)+(1.0)')>=0 && exprs.indexOf('(b)*(2.0)')>=0;
  });

  // ── 4. THE WIRE refuses it, so it never gets in ────────────────────────────────────────────
  run('wire',()=>{
    const base={nx:0.5,ny:0.5,tend:[0,0,0,0,0],mem:[0,0,0,0,0,0,0,0],plasmid:[],amp:1,phase:1,prog:null,ue:null};
    out.wireAcceptsClean = validNetworkPayload('migrant',Object.assign({},base,{ua:['(a)+(1.0)']}))===true;
    out.wireRefusesOdd   = validNetworkPayload('migrant',Object.assign({},base,{ua:[ODD]}))===false;
  });

  // ── 5. and the caught-tick message I added in #157 is stripped too ─────────────────────────
  run('errmsg',()=>{
    genome.userAtoms=[mk('(a)+(1.0)')]; genome.boundOpcodes=[0];
    const orig=applyEntropy;
    applyEntropy=function(){ throw new Error('bad expr: '+ODD); };
    globalThis.__detMs+=5; try{loop();}catch(e){}
    applyEntropy=orig;
    out.errMsgStripped = typeof __loopErrLast==='string' && UA_EXPR_SAFE.test(__loopErrLast);
    let threw=null; try{ encodeGenome(); }catch(e){ threw=String(e&&e.message); }
    out.savesAfterOddError = threw===null;
  });
  return out;
};`,'/tmp/cx.js');

const r=globalThis.__t();
const checks=[
  ['btoaStillWouldThrow','raw btoa still throws on the odd string (so this test tests something)'],
  ['asciiIdentical','the new encoder is BYTE-IDENTICAL to btoa for ascii — every old save still reads'],
  ['asciiRoundTrip','ascii round-trips'],
  ['oddRoundTrip','and so does a string btoa could not touch'],
  ['encodesWithOddChar','a genome carrying an odd character still encodes'],
  ['decodesBack','...and decodes back'],
  ['sanitiserDropsOdd','the sanitiser drops an unsafe expression from the bank'],
  ['sanitiserKeepsGood','...and keeps the good ones'],
  ['wireAcceptsClean','the wire still accepts a normal migrant vocabulary'],
  ['wireRefusesOdd','the wire REFUSES one carrying an unsafe character'],
  ['errMsgStripped','#157 caught-tick messages are stripped to printable ascii'],
  ['savesAfterOddError','...so an odd exception message cannot stop the creature saving'],
];
let bad=0;
for(const [k,d] of checks){ const ok=r[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(22)+d); }
for(const e of r.errors) console.log('    ERROR '+e);
if(r.errors.length) bad+=r.errors.length;
if(r.encodeDidNotThrow) console.log('    encode threw: '+r.encodeDidNotThrow);
console.log(bad? '\n'+bad+' FAILED' : '\none odd character can no longer stop a creature saving itself');
process.exit(bad?1:0);
