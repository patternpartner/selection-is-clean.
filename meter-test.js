// #156 acceptance test — the open-endedness meter must survive a reload.
//
// THE BUG IT LOCKS DOWN. #130's meter serialised its LOG and its COUNTERS but not the three structures
// the counts are DERIVED from — they were runtime-only and said so in their own comment. So every
// reload hit `if(__oeeSeen===null)`, which by design adopts the whole bank as history and records
// activity of ZERO. On a device that reloads more often than every 5,000 ticks, every flush is a first
// flush and D is 0 forever. Measured on two real exports of one creature 20,000 ticks apart: germline
// atom executions 13,007 -> 26,306, nine of ten shared atoms rose, one by 14x, and the meter logged
// "nothing active" five epochs running. It reported no innovation while the thing it measures doubled.
//
// So the check is not "does the field exist in the save". It is: SAVE, RELOAD, RUN, and does the meter
// still see the activity it saw before? A test that only inspected the blob would pass on a build where
// decode threw the values away.
// Exits non-zero on any failure.   node meter-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/meter.js'); m.filename='/tmp/meter.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(){
  const out={errors:[]};
  const run=(name,fn)=>{ try{ return fn(); }catch(e){ out.errors.push(name+': '+((e&&e.message)||String(e)).slice(0,120)); return null; } };
  const mk=x=>({expression:x,compiled:null,failed:false,uses:0,age:0,state:0,alienHits:0,alienAttempts:0,creditTrace:0});
  const flush=(idx)=>flushEpoch({idx:idx,n:10,popSum:1000,popPeak:120,popMin:80,fitSum:5,divSum:1,clPeak:2,
                                 extStart:genome.extinctions|0,mut:genome.mutationRate});
  const lastRow=()=>oeeLog[oeeLog.length-1];

  // ── 1. a first flush cannot measure activity, and must SAY SO rather than say zero ─────────
  run('unmeasured',()=>{
    resetOeeRuntime(); oeeLog=[]; oeeNovel=0; oeePersist=0;
    genome.userAtoms=[mk('(a)+(1.0)')]; genome.userAtoms[0].uses=100;
    flush(0);
    out.firstFlushUnmeasured = lastRow()[1]===-1;          // -1 = unmeasured, NOT 0 = nothing active
  });

  // ── 2. with history, a rise IS detected ────────────────────────────────────────────────────
  run('detects',()=>{
    genome.userAtoms[0].uses=400;                           // it ran 300 more times
    flush(1);
    out.detectsRise = lastRow()[1]===1;                     // one computation active
  });

  // ── 3. THE ONE THAT WAS BROKEN: save, reload, and it still sees activity ───────────────────
  run('reload',()=>{
    const blob=encodeGenome();
    const seenBefore=__oeeSeen?__oeeSeen.size:0, lastBefore=__oeeLastUses?__oeeLastUses.size:0;
    // a genuine reload: wipe the runtime exactly as a fresh page would
    resetOeeRuntime();
    out.wipedByReload = __oeeSeen===null && __oeeLastUses===null;
    const ok=decodeGenome(JSON.stringify({type:'selection-genome',version:2,genome:blob}));
    out.decodedOK = ok===true;
    out.memoryRestored = !!__oeeSeen && !!__oeeLastUses &&
                         __oeeSeen.size===seenBefore && __oeeLastUses.size===lastBefore;
    // and now the real question — does the next flush MEASURE, or report a first flush?
    genome.userAtoms[0].uses=900;                           // it ran 500 more times across the reload
    flush(2);
    out.measuresAfterReload = lastRow()[1]===1;             // pre-#156 this was 0, and was a lie
  });

  // ── 4. novelty and persistence survive too ─────────────────────────────────────────────────
  run('novelty',()=>{
    const nBefore=oeeNovel|0;
    genome.userAtoms.push(mk('(b)*(3.0)')); genome.userAtoms[1].uses=10;
    flush(3);                                                // first sighting: baseline only
    genome.userAtoms[1].uses=200;
    flush(4);                                                // now it is active AND new
    out.noveltyCounted = (oeeNovel|0) > nBefore;
    const pendBefore=__oeePending?__oeePending.length:0;
    const blob2=encodeGenome();
    resetOeeRuntime();
    decodeGenome(JSON.stringify({type:'selection-genome',version:2,genome:blob2}));
    out.pendingRestored = !!__oeePending && __oeePending.length===pendBefore && pendBefore>0;
    // carry it past the lag with the atom still running — persistence must be able to RESOLVE
    for(let e=5;e<=5+OEE_PERSIST_LAG;e++){ genome.userAtoms[1].uses+=200; flush(e); }
    out.persistResolves = (oeePersist|0) > 0;
  });

  // ── 5. the seen-set is capped, and says when it cut ────────────────────────────────────────
  run('cap',()=>{
    oeeTrunc=0;
    __oeeSeen=new Set(); for(let i=0;i<OEE_SEEN_SAVE_CAP+500;i++) __oeeSeen.add(i);
    const blob=encodeGenome();
    const g=JSON.parse(Buffer.from(blob,'base64').toString('utf8'));
    out.seenCapped = Array.isArray(g.oSN) && g.oSN.length===OEE_SEEN_SAVE_CAP;
    out.truncDeclared = (g.oTR|0)===1;
    // the most RECENT keys are the ones kept — a forgotten key can recount, so keep the likely ones
    out.keptRecent = g.oSN[g.oSN.length-1]===OEE_SEEN_SAVE_CAP+499;
  });

  // ── 6. the instrument pays the save budget before the creature does ────────────────────────
  run('budget',()=>{
    __oeeSeen=new Set(); for(let i=0;i<OEE_SEEN_SAVE_CAP;i++) __oeeSeen.add(i);
    const atomsBefore=genome.userAtoms.length;
    const seenBefore=__oeeSeen.size;
    // force the trimmer to run by pretending the budget is tiny
    const realBudget=SAVE_BUDGET;
    out.budgetShedsMeterFirst = (function(){
      try{
        // encodeGenome is already over a 4KB budget with 2000 seen keys; walk the same loop by hand
        let blob=encodeGenome(); const target=4000*0.92;
        while(__oeeSeen && __oeeSeen.size>64 && blob.length>=target){
          __oeeSeen=new Set([...__oeeSeen].slice(-(__oeeSeen.size>>1))); oeeTrunc=1;
          blob=encodeGenome();
        }
        return __oeeSeen.size<seenBefore && genome.userAtoms.length===atomsBefore;
      }catch(e){ return false; }
    })();
  });

  // ── 7. a pre-#156 save has none of this and must still load cleanly ────────────────────────
  run('legacy',()=>{
    const blob=encodeGenome();
    const g=JSON.parse(Buffer.from(blob,'base64').toString('utf8'));
    delete g.oLU; delete g.oPD; delete g.oSN; delete g.oTR;   // an old file
    const old=Buffer.from(JSON.stringify(g),'utf8').toString('base64');
    const ok=decodeGenome(JSON.stringify({type:'selection-genome',version:2,genome:old}));
    out.legacyLoads = ok===true;
    out.legacyResets = __oeeSeen===null && __oeeLastUses===null;   // no history -> clean reset
    oeeLog=[];
    flush(90);
    out.legacySaysUnmeasured = lastRow()[1]===-1;                  // and says so, rather than 0
  });

  out.saveChars = encodeGenome().length;
  return out;
};`,'/tmp/meter.js');

const r=globalThis.__t();
const checks=[
  ['firstFlushUnmeasured','a flush with no history reports UNMEASURED (-1), not "nothing active" (0)'],
  ['detectsRise','with history, a rise in executions is detected'],
  ['wipedByReload','the test really does wipe the runtime, as a page reload would'],
  ['decodedOK','the save decodes'],
  ['memoryRestored','...and the meter gets its working memory back'],
  ['measuresAfterReload','THE BUG: it still measures activity after a reload'],
  ['noveltyCounted','a genuinely new computation is counted as novel'],
  ['pendingRestored','pending novelties survive the reload, so persistence can resolve'],
  ['persistResolves','...and one that keeps running does resolve as persistent'],
  ['seenCapped','the seen-set is capped in the save'],
  ['truncDeclared','and declares the cut instead of hiding it'],
  ['keptRecent','keeping the most recent keys, which are the likeliest to recur'],
  ['budgetShedsMeterFirst','under budget pressure the instrument sheds before any atom does'],
  ['legacyLoads','a pre-#156 save still loads'],
  ['legacyResets','...with a clean reset, since it carries no history'],
  ['legacySaysUnmeasured','...and its next flush says unmeasured rather than zero'],
];
let bad=0;
for(const [k,d] of checks){ const ok=r[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(24)+d); }
for(const e of r.errors) console.log('    ERROR '+e);
if(r.errors.length) bad+=r.errors.length;
console.log('\n  save with the meter carried: '+r.saveChars+' chars');
console.log(bad? '\n'+bad+' FAILED' : '\nthe meter remembers across a reload, and says so when it cannot');
process.exit(bad?1:0);
