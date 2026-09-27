// #249 — OPEN IT UP BEFORE CULLING IT. Thirteen experiment arms ship switched off, and a switched-off
// mechanism has no measured effect in today's world, only in the world it was last tried in (most of them
// before #220f gave births variation). The user's rule: open them up, find out what they do, THEN cull.
//
// This is the SCREEN, not the verdict: it turns ARM on, runs, and reports the rungs below the dependent
// variable, draw-free, so the long pre-registered runs are spent only on arms that can be measured at all.
//   EXECUTED  every gate site of the arm is wrapped in a counter (__ah), so "reached with the arm on" is
//             counted, not inferred. The site count is ASSERTED per arm (CLAUDE.md: assert N when you
//             patch N sites) - a wrap that silently matches fewer sites is a control that reads like one.
//   EFFECT    a hash of palive/tend/amp every EVERY ticks. Diff it against the control (ARM unset, same
//             seed) and the first differing census is the first tick the arm changed the world.
//   WORLD     alive, lineages, effective lineages, and establishment exactly as harness-establish counts it.
//   LIVENESS  the engine's never-fired list at the end - does opening this arm wake anything else?
// The wrap draws nothing and returns the gate's own value, so the control is the unpatched engine's run.
//   ARM=CHAR_DISP SEED=1 TICKS=5000 node harness-openup.js      (ARM unset = control; NOWRAP=1 skips the wrap)
//   node harness-openup.js --emit engine.wrap.html            (the wrapped engine, for harness-oee INDEX=...)
// No backticks in the appended driver's comments: the engine source is compiled as one string.
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(require('path').join(__dirname,'harness-env.js'))(globalThis);
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const E=process.env, T=+(E.TICKS||5000), EVERY=+(E.EVERY||250), WARM=+(E.WARM||Math.floor(T/5)), ESTN=+(E.ESTN||10);
// arm -> number of gate sites. Most gates read (globalThis.__X|0)===1 inline; SELF_PREDICT is
// resolved once into a module flag and read by if(__X ...), so those sites are wrapped instead.
// #249: RQ_TRAIT, CHAR_DISP, NICHE_LOCALTEND, NICHE_CELLDRIFT and GRIP_SEED were deleted by the rule this rig fed.
const SITES={MUTUALISM:1,GENO_PARASITE:1,NICHE_DRIFT:1,NICHE_BIOTIC:1,SELFMODEL:2,GROUP_PROBE:2,SELF_PREDICT:2};
const FLAGVAR={SELF_PREDICT:1};
const ARMS=(E.ARM||'').split(',').filter(Boolean);
for(const a of ARMS){ if(!(a in SITES)){ console.log(JSON.stringify({error:'unknown arm '+a,known:Object.keys(SITES)})); process.exit(2); } globalThis['__'+a]=1; }
let code=fs.readFileSync(E.INDEX||path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const wrapped={};
if(!E.NOWRAP) for(const a in SITES){
  let n=0;
  if(FLAGVAR[a]){ code=code.replace(new RegExp('if\\(__'+a+'(?=[)&])','g'),()=>{n++;return 'if(__ah(\''+a+'\',__'+a+')';}); }
  else { const pat='(globalThis.__'+a+'|0)===1'; n=code.split(pat).length-1; code=code.split(pat).join('__ah(\''+a+'\','+pat+')'); }
  wrapped[a]=n;
  if(n!==SITES[a]){ console.log(JSON.stringify({error:'arm '+a+': wrapped '+n+' gate sites, expected '+SITES[a]})); process.exit(1); }
}
// --emit <out.html>: write the wrapped engine and stop, so a long-run rig (harness-oee INDEX=out.html) reports
// the same gate hits as armHits. The counters live on globalThis for that reason.
const PRE='globalThis.__armHit=globalThis.__armHit||{};function __ah(a,v){ if(v)globalThis.__armHit[a]=(globalThis.__armHit[a]|0)+1; return v; }\n';
if(process.argv[2]==='--emit'){ fs.writeFileSync(process.argv[3],'<!doctype html><script>'+PRE+code+'</script>\n'); console.log(JSON.stringify({emitted:process.argv[3],wrapped})); process.exit(0); }
const Module=require('module');const m=new Module('/tmp/openup.js');m.filename='/tmp/openup.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(PRE+code+`
;globalThis.__OU=function(T,EVERY,crypto){
  const out={rows:[],err:0,first:{},peak:{}};
  const census=function(){
    const cnt=new Map(); let n=0;
    for(let i=0;i<N;i++){ if(!palive[i])continue; n++; const l=pLin[i]; cnt.set(l,(cnt.get(l)||0)+1); }
    let s2=0; cnt.forEach(function(c,l){ const p=c/(n||1); s2+=p*p; if(out.first[l]===undefined)out.first[l]=tick; if(!(out.peak[l]>=c))out.peak[l]=c; });
    const h=crypto.createHash('sha1');
    for(const a of [palive,tend,amp]) h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));
    out.rows.push({t:tick,alive:n,lineages:cnt.size,effN:s2>0?+(1/s2).toFixed(2):0,h:h.digest('hex').slice(0,12)});
  };
  census();
  for(let s=0;s<T;s++){ globalThis.__detMs+=5; try{loop();}catch(e){out.err++;} if((s+1)%EVERY===0)census(); }
  const lc=livenessCensus();
  return {out,hits:globalThis.__armHit,never:lc.never,liveCount:lc.live.length+lc.rare.length,DIMS};
};`,'/tmp/openup.js');
const r=globalThis.__OU(T,EVERY,crypto), o=r.out;
let late=0,est=0; for(const l in o.first){ if(o.first[l]>WARM){ late++; if(o.peak[l]>=ESTN)est++; } }
const third=Math.max(1,Math.floor(o.rows.length/3)), mean=f=>{let s=0,k=0;for(let i=o.rows.length-third;i<o.rows.length;i++){s+=o.rows[i][f];k++;}return +(s/k).toFixed(2);};
console.log(JSON.stringify({arm:ARMS.join(',')||'control',seed:E.SEED||'1',ticks:T,loopErrors:o.err,wrapped:E.NOWRAP?null:wrapped,
  hits:r.hits,alive_late:mean('alive'),lineages_late:mean('lineages'),effN_late:mean('effN'),alive_end:o.rows[o.rows.length-1].alive,
  lateLineages:late,established:est,estFrac:late?+(est/late).toFixed(4):null,DIMS:r.DIMS,
  never:r.never,rows:o.rows.map(x=>[x.t,x.alive,x.lineages,x.effN,x.h])}));
