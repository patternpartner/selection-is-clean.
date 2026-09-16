// THE VARIANCE CENSUS (#217) — A READ IS NOT A MOVE
//
// #209 classified all 191 genome keys statically (does a read site exist?) and #210 dynamically (was
// it read in this run?). Both measure whether the engine LOOKS at a gene. Neither measures whether
// the gene has anything to look at.
//
// Selection needs variance. A gene read a million times a tick, held at the same value by every
// living particle, is a constant wearing a gene's name -- selection cannot sort what does not
// differ. CODEMAP states the suspicion twice ("'evolvable' often means 'will sit at a bound'",
// "most are inert") and #216p paid for a bespoke audit to answer it for ONE gene (motifKeepBias).
// This answers it for all of them at once, and it is the number this project stopped reporting:
// of N evolvable parameters, how many are actually evolving?
//
// WHAT IS MEASURED, and the population is the only side that counts. Structure is authored on the
// germline `genome`; selection only ever sees `pGenome[i]` (CODEMAP's germline-vs-population note,
// four silent failures). So every figure here is read from the LIVING POPULATION, and the germline
// value is reported alongside only so the two can be seen to disagree.
//
// FOUR CLASSES, at the last sample:
//   VARYING      living particles hold >1 distinct value. Raw material exists. Says NOTHING about
//                whether selection is acting on it -- drift produces this too (#209's own warning).
//   SWEPT        variance existed at an earlier sample and is gone at the last. Something removed
//                it: selection, a bottleneck, or a clamp. The only class that is evidence of
//                sorting, and it still needs a control to tell sorting from a population crash.
//   FLAT         one distinct value across the population at every sample, equal to the boot value.
//                Never had raw material. Selection provably never acted on it in this run.
//   PINNED       one distinct value at the last sample, and that value is a clamp bound read out of
//                sanitizeGenome. CODEMAP's predicted failure mode, now counted instead of asserted.
//
// WHAT A ZERO DOES NOT MEAN. This rig has a trajectory and a budget, so FLAT is "did not move in
// this run at this budget on this seed" -- not "cannot move". A gene whose mutation operator fires
// once per 10k ticks is FLAT at 3k and live at 30k. That is why it runs several seeds and prints
// the budget, and why the verdict line names both.
//
// IT DRAWS NOTHING (CLAUDE.md trap 4). Every figure is a property read on a plain object -- no
// engine function is called to observe state, so the census cannot move the trajectory it reports
// on. The only engine call is loop() itself.
//
// NON-NUMERIC KEYS are compared by a bounded digest (length + head + numeric-leaf sum), not by deep
// equality, because 191 keys x xN particles x 4 samples of JSON.stringify costs more than the
// measurement is worth. A digest collision UNDERREPORTS variance, so "FLAT" on a non-numeric key is
// a weaker claim than on a numeric one and is reported in its own column rather than pooled.
//
// Env: SEED (default 1)  TICKS (default 3000)  SAMPLES (default 4)  VERBOSE=1  JSON=1
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
require(path.join(__dirname,'harness-env.js')).applyKnobs(globalThis);

const TICKS=parseInt(process.env.TICKS||'3000',10);
globalThis.__forcedMKB=(process.env.MOTIF_BIAS!==undefined)?Number(process.env.MOTIF_BIAS):null;
const NSAMP=Math.max(2,parseInt(process.env.SAMPLES||'4',10));
const VERBOSE=(process.env.VERBOSE|0)===1;
const ASJSON=(process.env.JSON|0)===1;
const SEED=process.env.SEED||'1';

const html=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8');
const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
const lines=code.split('\n');

// ── 1. THE KEYS, read from the genome literal itself. A hand-kept list goes stale silently and a
// census that misses a gene reports it as absent rather than as unexamined (#209's rule).
let gStart=-1;
for(let i=0;i<lines.length;i++) if(/^let genome=\{/.test(lines[i])){ gStart=i; break; }
if(gStart<0){ console.error('genome literal not found'); process.exit(1); }
let depth=0, gEnd=-1;
for(let i=gStart;i<lines.length;i++){
  const stripped=lines[i].replace(/\/\/.*$/,'').replace(/'[^']*'/g,"''").replace(/"[^"]*"/g,'""');
  for(const ch of stripped){ if(ch==='{')depth++; else if(ch==='}')depth--; }
  if(depth===0&&i>gStart){ gEnd=i; break; }
}
const KEYS=[];
for(let i=gStart;i<=gEnd;i++){
  const m=lines[i].match(/^\s{2}([A-Za-z_$][\w$]*)\s*:/);
  if(m&&!KEYS.includes(m[1])) KEYS.push(m[1]);
}

// ── 2. CLAMP BOUNDS, read from sanitizeGenome rather than restated. CODEMAP's #153 rule: a bound
// copied into a rig is a bound that goes stale against a ceiling that moved underneath it. Only
// literal numeric bounds are taken; a bound that is itself an identifier (DIMS_MAX, SOMA_REPAIR_MAX)
// is left unknown rather than guessed, and a PINNED verdict is simply not offered for those keys.
const BOUNDS={};
for(const ln of lines){
  const m=ln.match(/genome\.([A-Za-z_$][\w$]*)\s*=\s*__cl\((.*)\)\s*;/);
  if(!m) continue;
  const args=m[2];
  const tail=args.match(/,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*$/);
  if(tail) BOUNDS[m[1]]=[parseFloat(tail[1]),parseFloat(tail[2])];
}

// ── 3. THE DRIVER. Built as a plain concatenated string, NOT a template literal: CLAUDE.md's first
// trap is that a backtick anywhere in an appended block terminates the literal the engine source is
// embedded in, and fails hundreds of lines from the cause. No backtick can break what is not one.
const DRIVER=[
';globalThis.__vc=function(T,pts,KEYS){',
'  var out={samples:[],err:null};',
'  var digest=function(v){',
'    if(v===null||v===undefined) return "u";',
'    var t=typeof v;',
'    if(t==="number") return isFinite(v)?("n"+v):("n!"+String(v));',
'    if(t==="boolean"||t==="string") return t.charAt(0)+String(v).slice(0,32);',
'    if(Array.isArray(v)){',
'      var s=0,h="";',
'      for(var i=0;i<v.length;i++){ var e=v[i];',
'        if(typeof e==="number"&&isFinite(e)) s+=e*(i+1);',
'        else if(Array.isArray(e)){ for(var j=0;j<e.length;j++) if(typeof e[j]==="number"&&isFinite(e[j])) s+=e[j]*(i+1)*(j+1); } }',
'      for(var k=0;k<6&&k<v.length;k++){ var q=v[k]; h+=(typeof q==="number")?q.toFixed(4):(Array.isArray(q)?("["+q.length):"o"); h+=","; }',
'      return "A"+v.length+":"+h+":"+s.toFixed(6);',
'    }',
'    if(t==="object"){ var ks=Object.keys(v); return "O"+ks.length+":"+ks.slice(0,6).join(","); }',
'    return "?"+t;',
'  };',
'  var snap=function(){',
'    var living=[];',
'    for(var i=0;i<N;i++) if(palive[i]&&pGenome[i]) living.push(pGenome[i]);',
'    var s={t:tick,alive:living.length,keys:{}};',
'    for(var k=0;k<KEYS.length;k++){',
'      var key=KEYS[k];',
'      var seen=Object.create(null), distinct=0, present=0, numeric=0;',
'      var mn=Infinity, mx=-Infinity;',
'      for(var j=0;j<living.length;j++){',
'        var v=living[j][key];',
'        if(v===undefined) continue;',
'        present++;',
'        if(typeof v==="number"&&isFinite(v)){ numeric++; if(v<mn)mn=v; if(v>mx)mx=v; }',
'        var d=digest(v);',
'        if(seen[d]===undefined){ seen[d]=1; distinct++; }',
'      }',
'      s.keys[key]={',
'        present:present, distinct:distinct, numeric:numeric,',
'        min:(mn===Infinity?null:mn), max:(mx===-Infinity?null:mx),',
'        germ:digest(genome[key]),',
'        germNum:(typeof genome[key]==="number"&&isFinite(genome[key]))?genome[key]:null',
'      };',
'    }',
'    return s;',
'  };',
'  out.samples.push(snap());',
'  for(var step=0;step<T;step++){',
'    globalThis.__detMs+=5;',
// #216u: MOTIF_BIAS forces genome.motifKeepBias every tick, the same way harness-strata does, and
// for the same reason (#216i: the germline drifts, so setting it once does not hold). This is the
// CEILING arm for #215 — the shipped gene seeds at 0 and reaches 0.03-0.17 by 60-120k, so testing
// what shipped would test a 2-to-8-eviction effect. If the mechanism at FULL strength moves nothing
// here, the shipped rate cannot, and the expensive long run is unnecessary.
// An assignment, not a draw: the RNG stream is untouched, though the arm is of course not
// trajectory-neutral — it changes which motif is dropped, which is the whole point.
'    if(globalThis.__forcedMKB!==null&&globalThis.__forcedMKB!==undefined){ try{ genome.motifKeepBias=globalThis.__forcedMKB; }catch(e){} }',
'    try{ loop(); }catch(e){ if(!out.err) out.err=String(e&&e.message||e); }',
'    for(var p=0;p<pts.length;p++) if(pts[p]===step+1) out.samples.push(snap());',
'  }',
'  return out;',
'};'
].join('\n');

const Module=require('module');
const mod=new Module('/tmp/variance-census.js');
mod.filename='/tmp/variance-census.js';
mod.paths=Module._nodeModulePaths('/tmp');
mod._compile(code+DRIVER,'/tmp/variance-census.js');

const pts=[];
for(let i=1;i<NSAMP;i++) pts.push(Math.round(TICKS*i/(NSAMP-1)));
const res=globalThis.__vc(TICKS,pts,KEYS);
const samples=res.samples, last=samples[samples.length-1];

// ── 4. CLASSIFY. Every verdict is read off the LIVING POPULATION; the germline is reported only
// where it disagrees, because a germline that has drifted away from every particle carrying it is
// the #137 crossing failure and is worth seeing, not worth averaging in.
const CLS={VARYING:[],SWEPT:[],PINNED:[],FLAT:[],ABSENT:[]};
const rows=[];
for(const key of KEYS){
  const l=last.keys[key];
  const everVaried=samples.some(s=>s.keys[key].distinct>1);
  const first=samples[0].keys[key];
  let cls;
  if(l.present===0) cls='ABSENT';
  else if(l.distinct>1) cls='VARYING';
  else if(everVaried) cls='SWEPT';
  else {
    const b=BOUNDS[key];
    const v=l.min;
    cls=(b&&v!==null&&(Math.abs(v-b[0])<1e-12||Math.abs(v-b[1])<1e-12))?'PINNED':'FLAT';
  }
  CLS[cls].push(key);
  rows.push({key,cls,distinct:l.distinct,present:l.present,numeric:l.numeric>0,
             min:l.min,max:l.max,germ:l.germNum,
             firstDistinct:first.distinct,
             traj:samples.map(s=>s.keys[key].distinct)});
}
// The germline/population disagreement, counted separately: a key where every living particle holds
// one value and the germline holds a different one.
const STRANDED=rows.filter(r=>r.cls!=='ABSENT'&&r.distinct===1&&r.numeric&&r.germ!==null&&r.min!==null&&Math.abs(r.germ-r.min)>1e-12);

// ── 4b. THE CONFOUND, and it is the whole reading. The population is SEEDED with variance at boot,
// so "distinct>1" at any single sample is mostly boot randomisation that has not been sorted yet --
// not evidence that anything evolved. The quantity that is not confounded by seeding is what happens
// to that variance over the run: variance RETAINED is the population still holding raw material,
// variance LOST is a sweep, a bottleneck or a crash. Reported per key as a trajectory and pooled as
// a single ratio, because a pooled ratio is the dependent variable this project stopped printing.
const bootVar=rows.filter(r=>r.firstDistinct>1).length;
const sumFirst=rows.reduce((a,r)=>a+r.firstDistinct,0);
const sumLast=rows.reduce((a,r)=>a+r.distinct,0);
const retention=sumFirst?sumLast/sumFirst:0;
const aliveFirst=samples[0].alive, aliveLast=last.alive;
const popRatio=aliveFirst?aliveLast/aliveFirst:0;
// Variance per capita: a population that halves loses variance for reasons that are not selection on
// any particular gene, so the ratio is also reported normalised by the headcount it was drawn from.
const retentionPerCapita=popRatio?retention/popRatio:0;

const total=KEYS.length;
const alive=last.alive;
const numericKeys=rows.filter(r=>r.numeric).length;

if(ASJSON){
  console.log(JSON.stringify({seed:SEED,ticks:TICKS,alive,total,
    classes:Object.fromEntries(Object.entries(CLS).map(([k,v])=>[k,v.length])),
    bootVar, sumFirst, sumLast, retention, popRatio, retentionPerCapita,
    aliveFirst, aliveLast, sampleTicks:samples.map(s=>s.t), samplePop:samples.map(s=>s.alive),
    stranded:STRANDED.map(r=>r.key), rows, err:res.err},null,1));
}else{
  console.log('VARIANCE CENSUS  seed='+SEED+'  ticks='+TICKS+'  samples='+samples.length+
              '  living='+alive+(res.err?('  [engine error: '+res.err+']'):''));
  console.log('population trace: '+samples.map(s=>s.t+':'+s.alive).join('  '));
  console.log('');
  console.log('  '+total+' genome keys, '+numericKeys+' numeric');
  for(const c of ['VARYING','SWEPT','PINNED','FLAT','ABSENT']){
    const pct=(100*CLS[c].length/total).toFixed(1);
    console.log('  '+c.padEnd(9)+String(CLS[c].length).padStart(4)+'  '+pct.padStart(5)+'%');
  }
  console.log('');
  console.log('  MOVING NOW (VARYING) ........ '+CLS.VARYING.length+' of '+total);
  console.log('  EVER MOVED (VARYING+SWEPT) .. '+(CLS.VARYING.length+CLS.SWEPT.length)+' of '+total);
  console.log('  VARIED AT BOOT .............. '+bootVar+' of '+total+'   (seeded, not earned)');
  console.log('');
  console.log('  VARIANCE RETENTION  '+sumLast+' / '+sumFirst+' distinct values = '+retention.toFixed(3));
  console.log('  population          '+aliveLast+' / '+aliveFirst+' = '+popRatio.toFixed(3));
  console.log('  per capita          '+retentionPerCapita.toFixed(3)+'   (>1 = variance outran the headcount)');
  if(STRANDED.length) console.log('  germline disagrees with a uniform population on '+STRANDED.length+' key(s): '+STRANDED.slice(0,8).map(r=>r.key).join(', ')+(STRANDED.length>8?' ...':''));
  if(VERBOSE){
    for(const c of ['VARYING','SWEPT','PINNED','FLAT','ABSENT']){
      if(!CLS[c].length) continue;
      console.log('');
      console.log('── '+c+' ('+CLS[c].length+')');
      for(const key of CLS[c]){
        const r=rows.find(x=>x.key===key);
        const range=(r.numeric&&r.min!==null)?(' ['+r.min+' .. '+r.max+']'):'';
        console.log('   '+key.padEnd(26)+'distinct '+r.traj.join(' -> ').padEnd(24)+range);
      }
    }
  }
}
process.exit(0);
