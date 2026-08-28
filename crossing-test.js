// #137 acceptance test — structure must reach selection, and a bound opcode must mean one thing.
//
// The bugs this locks down were found by the crossing census, and two of the three claims I first
// made about them were wrong; what survived measurement is what is asserted here.
//
//   1. NO PHANTOM BINDINGS. The bind block runs on every mutateGenome call, not per birth, so with
//      an empty atom bank it bound an opcode to userAtoms[-1] and spliced a call-site for it.
//      Measured pre-fix over 6,000 ticks x 6 seeds: 108 binds, 14 of them to nothing.
//   2. EVERY BOUND SLOT RESOLVES. A slot is either an explicit -1 tombstone (its atom was culled)
//      or a valid index. Never an index past the end.
//   3. A SLOT NEVER RE-AIMS. An opcode's number is its position, and its meaning is the atom at
//      that position. The same slot must keep pointing at the SAME ATOM OBJECT for as long as both
//      exist. An atom mutating its own expression in place is evolution, not a re-aim, and must not
//      trip this — so the check is on object identity, not on the expression string.
//   4. NOTHING STRANDED. No kind of self-authored structure may sit on the germline with zero
//      instances anywhere in the living population — that is the bug that appeared four times
//      (#102, #130, #132b, #133b), always silently.
// Exits non-zero on any failure.   node crossing-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/xt.js'); m.filename='/tmp/xt.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(ticks){
  const out={}; let swaps=0, unresolved=0, last=[];
  for(let s=0;s<ticks;s++){ globalThis.__detMs+=5; try{loop();}catch(e){}
    const bos=genome.boundOpcodes||[], uas=genome.userAtoms||[];
    const cur=bos.map(i=> i<0 ? null : (uas[i]||undefined));
    for(let k=0;k<cur.length;k++){
      if(cur[k]===undefined) unresolved++;                       // (2)
      if(last[k] && cur[k] && last[k]!==cur[k]) swaps++;          // (3) identity, not expression
    }
    last=cur;
  }
  const bos=genome.boundOpcodes||[], uas=genome.userAtoms||[];
  out.everySlotResolves = unresolved===0;
  out.noSlotEverReAimed = swaps===0;
  // (1) with the bank empty there must be no bindings at all; more generally no slot may point
  // past the end of the bank
  // A -1 slot is legitimate ONLY as the tombstone of a culled atom. Anything beyond that came from
  // binding against an empty bank. Comparing the two counts makes this seed-independent: the earlier
  // version only noticed when the bank ended completely empty, and passed on seeds where the phantom
  // binds happened to be outnumbered by real ones.
  const tombstones=bos.filter(i=>i===-1).length, culls=(__liveness['atom.cull']|0);
  out.noPhantomBindings = tombstones<=culls
                       && bos.every(i=> i===-1 || (i>=0 && i<uas.length));
  const c=crossingCensus();
  out.nothingStranded = c.strandedCount===0;
  out.detail={slots:bos.length, atoms:uas.length, unresolved, swaps,
    tombstones, culls,
    rows:c.rows.map(r=>r.name+' g'+r.germline+'/p'+r.population)};
  return out;
};`, m.filename);

const T=parseInt(process.env.TICKS||'3000',10);
const r=globalThis.__t(T);
const checks=[
  ['noPhantomBindings','no opcode is bound to an atom that does not exist'],
  ['everySlotResolves','every bound slot is a tombstone or a valid atom'],
  ['noSlotEverReAimed','a bound opcode never comes to mean a different atom'],
  ['nothingStranded','no structure is authored-but-invisible to selection'],
];
let bad=0;
for(const [k,d] of checks){ const ok=r[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(20)+d); }
console.log('\n  '+T+' ticks — slots '+r.detail.slots+', atoms '+r.detail.atoms
  +', unresolved '+r.detail.unresolved+', re-aims '+r.detail.swaps
  +', tombstones '+r.detail.tombstones+' (culls: '+r.detail.culls+')');
console.log('  '+r.detail.rows.join('   '));
console.log(bad? '\n'+bad+' FAILED' : '\nauthored structure reaches selection, and an opcode means one thing');
process.exit(bad?1:0);
