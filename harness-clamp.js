// CLAMP CENSUS (#71) — HOW MUCH OF THE PHENOTYPE IS THE GENOME, AND HOW MUCH IS THE CLAMP?
//
// #70 found the substrate makes inertness free: every VM register index is folded (Math.abs(src)%12),
// the dispatch switch has no `default:` so an unrecognised opcode is a silent no-op, and 802 __cl()
// calls bound the rest. Nothing a mutation can do produces a program that breaks. That is the
// mechanism behind the repeated "channel measures near-inert" finding — a broken genome neither dies
// nor works, so selection sees nothing either way.
//
// Before removing any guardrail, measure which ones actually FIRE. A clamp that never binds is free
// documentation; a clamp that binds on most evaluations is the substrate overwriting an evolved value,
// and every mutation in that direction is invisible to selection by construction.
//
// This is harness-side ONLY. index.html is untouched, so the artwork carries no cost on a phone —
// the same reason harness-gates.js rewrites gate conditions here rather than shipping counters.
//
// Method: rewrite every `__cl(` CALL SITE (not the definition) to `__clS(<siteId>,` and define __clS
// to return exactly what __cl returns while counting. Per site: evaluations, binds at lo, binds at hi,
// and NaN passthroughs — NaN fails both comparisons and so leaves a clamp UNCHANGED, which is the one
// way a clamp silently fails at the job it exists for, and is counted separately rather than folded
// into the bind count.
//
// CONTROL: counting must not perturb. __clS returns the identical value for identical input and draws
// no randomness, so the run must come back bit-identical to the uninstrumented build. NOCOUNT=1 is the
// control arm — no rewrite at all — and `fingerprint` is a checksum over live particle state at the end
// of the run. If the two arms' fingerprints differ, the census is invalid and gets rebuilt, exactly as
// in #70. Comparing `alive` and `kinds` alone would not do: two scalars can agree by luck.
//
// Env: SEED  TICKS (default 3000)  TOP (default 25 sites reported)  CHECK=1 (run the control)
//      NOCOUNT=1 (control arm: no rewrite at all)  INDEX= (measure a different build)
const fs = require('fs');
const TICKS = parseInt(process.env.TICKS || '3000', 10);
const TOP   = parseInt(process.env.TOP || '25', 10);
const NOCOUNT = (process.env.NOCOUNT|0) === 1;  // control arm: skip the rewrite entirely

function selfProxy(){const f=function(){return p;};const p=new Proxy(f,{get(_t,prop){if(prop===Symbol.toPrimitive)return()=>0;if(prop==='width'||prop==='height')return 0;if(prop==='data')return new Uint8ClampedArray(4);return p;},apply(){return p;}});return p;}
const CTX=selfProxy();
function makeEl(){return {getContext:()=>CTX,addEventListener(){},removeEventListener(){},set onclick(_){},set onchange(_){},click(){},appendChild(){},removeChild(){},remove(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},style:{},width:1280,height:720,_text:'',get textContent(){return this._text;},set textContent(v){this._text=v;}};}
const ELS={};
globalThis.document={getElementById:(id)=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),addEventListener(){},removeEventListener(){},head:makeEl(),body:makeEl(),get hidden(){return false;}};
globalThis.window=globalThis;globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
// GENOME resume (ported from harness-oee.js). REQUIRED for the bank arm: a fresh boot authors ~3 atoms
// with ZERO uses, so STRIP=bank on a fresh boot would be hollow by construction — the exact trap that
// wasted the first payoff attempt. Point GENOME= at a real export with a used bank.
const _gnHash=process.env.GENOME?('#'+JSON.parse(require('fs').readFileSync(process.env.GENOME,'utf8')).genome):'';
globalThis.location={hash:_gnHash,pathname:'/',search:'',href:'http://x/'};globalThis.history={replaceState(){},pushState(){}};
globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
globalThis.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
globalThis.BroadcastChannel=class{constructor(){}postMessage(){}addEventListener(){}close(){}set onmessage(_){}};
globalThis.fetch=()=>new Promise(()=>{});globalThis.devicePixelRatio=1;globalThis.innerWidth=1280;globalThis.innerHeight=720;
globalThis.__detMs=0;globalThis.performance={now:()=>globalThis.__detMs};
if(process.env.SEED){let a=(parseInt(process.env.SEED,10)|0)>>>0;Math.random=function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=(t+Math.imul(t^t>>>7,61|t))^t;return ((t^t>>>14)>>>0)/4294967296;};}
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
// ENV KNOBS. This file never had any, and that silently invalidated the first cost A/B run against it:
// COSMOS=0 was passed, nothing read it, the LIVE block filled __COSMOS=1 in both arms, and the two runs
// came back identical to the digit — 2 launches and 10 emissions on both sides of a "control". An arm
// that cannot be turned off is not a control, so the plumbing goes in before any ablation claim does.
// Same one-line form as harness-oee.js.
if (process.env.COSMOS !== undefined) globalThis.__COSMOS = parseInt(process.env.COSMOS, 10);
for (const kn of ['COSMOS_COST','COSMOS_CONTACT','COSMOS_MERGE','COSMOS_SENSE','COSMOS_AFFORD','ESCAPE_DEATH'])
  if (process.env[kn] !== undefined) globalThis['__'+kn] = parseInt(process.env[kn], 10);
let loopErrors=0,lastErr='';
console.error=(...a)=>{const s=a.join(' ');if(/Loop error|Boot error|Watchdog/.test(s)){loopErrors++;lastErr=s.slice(0,160);}};
console.warn=()=>{};

// INDEX= lets the same strip arms run against a DIFFERENT build — specifically the pre-#49 clamped
// economy (git show d6febcb:index.html). That answers the question the rig cannot: are the meta/bank
// taxes visible in the economy the LIVE ARTWORK actually runs, or only on the instrument?

const html=fs.readFileSync(process.env.INDEX||(__dirname+'/index.html'),'utf8');
let code=html.match(/<script>([\s\S]*)<\/script>/)[1];

// ── SITE REWRITE ────────────────────────────────────────────────────────────────────────────────
// Every `__cl(` except the definition itself becomes `__clS(<n>,`. Line numbers are resolved against
// a precomputed newline index so attribution is a real source location, not a serial number: a census
// that cannot name the site it is accusing is not actionable.
const nlAt=[]; for(let i=0;i<code.length;i++) if(code.charCodeAt(i)===10) nlAt.push(i);
function lineOf(off){ let lo=0,hi=nlAt.length; while(lo<hi){const m=(lo+hi)>>1; if(nlAt[m]<off)lo=m+1; else hi=m;} return lo+1; }
const sites=[]; let defSeen=0;
if(!NOCOUNT) code=code.replace(/__cl\(/g,(m,off)=>{
  if(code.slice(Math.max(0,off-9),off)==='function '){ defSeen++; return m; }   // the definition — left alone
  const ln=lineOf(off);
  const lineStart=code.lastIndexOf('\n',off)+1;
  let lineEnd=code.indexOf('\n',off); if(lineEnd<0)lineEnd=code.length;
  sites.push({id:sites.length, line:ln, src:code.slice(lineStart,lineEnd).trim().slice(0,150)});
  return '__clS('+(sites.length-1)+',';
});
if(!NOCOUNT && defSeen!==1){ console.log(JSON.stringify({error:'expected exactly 1 __cl definition, saw '+defSeen})); process.exit(1); }
if(!NOCOUNT && !sites.length){ console.log(JSON.stringify({error:'no __cl call sites found'})); process.exit(1); }

// __clS is __cl plus counters. Identical return for identical input, no randomness, so the trajectory
// cannot move. NaN is tallied apart from binds: x<lo and x>hi are both false for NaN, so a NaN sails
// through unchanged — the clamp reports success while having done nothing.
const NS=sites.length;
if(!NOCOUNT) code = 'const __clCalls=new Float64Array('+NS+'),__clLo=new Float64Array('+NS+'),__clHi=new Float64Array('+NS+'),__clNaN=new Float64Array('+NS+');\n'
     + 'function __clS(s,x,lo,hi){__clCalls[s]++;if(x!==x){__clNaN[s]++;return x;}if(x<lo){__clLo[s]++;return lo;}if(x>hi){__clHi[s]++;return hi;}return x;}\n'
     + code;

const driver=`
;(function(){
  // #72 falsifier 4, second attempt. maxSpeed and meanSpeed CANNOT answer it: they are taken over live
  // particles, so killing the 1e37 outliers drops them by arithmetic rather than by selection. The
  // quantity that separates the two is the escape-death RATE over time. Selection removing the programs
  // that drive unbounded velocity should make the rate DECLINE; a janitor collecting a constant trickle
  // of garbage should make it FLAT. Sampled per window, cumulative counter differenced.
  globalThis.__escSeries=[];
  globalThis.__run=function(n,win){ win=win||1000; let prev=0;
    for(let s=0;s<n;s++){ globalThis.__detMs+=5; try{loop();}catch(e){ globalThis.__driverErr=(globalThis.__driverErr||0)+1; }
      if((s+1)%win===0){ let cur=0; try{ cur=(typeof deathsByEscape!=='undefined')?deathsByEscape:0; }catch(e){}
        globalThis.__escSeries.push(cur-prev); prev=cur; } } };
  // Census accessors live in the SIM module's scope for the same reason __metaMag does — read from the
  // harness file directly they come back undefined, silently.
  globalThis.__clampDump=function(){ if(typeof __clCalls==='undefined')return []; const o=[]; for(let i=0;i<__clCalls.length;i++)
    o.push([__clCalls[i],__clLo[i],__clHi[i],__clNaN[i]]); return o; };
  // CONTROL fingerprint: a checksum over live particle state, not a summary of it. Positions,
  // amplitudes, tendencies, lineage ids and program lengths all fold in, so an instrument that
  // perturbed ANY of them by one ulp shows up here rather than hiding behind an equal alive count.
  globalThis.__fingerprint=function(){ try{ let a=0,b=0,c=0,d=0,n=0;
    let nanPos=0,nanAmp=0,nanTend=0;
    for(let i=0;i<N;i++){ if(!palive[i])continue; n++;
      // NaN is excluded from the SUMS and counted instead. A NaN folded into a checksum turns the whole
      // term into null and silently deletes that field from the control — which is how a live particle
      // with a NaN position went unnoticed here in the first place.
      if(px[i]!==px[i]||py[i]!==py[i])nanPos++; else a+=px[i]+py[i];
      if(amp[i]!==amp[i])nanAmp++; else b+=amp[i];
      c+=pLin[i]; d+=(pProg[i]?pProg[i].length:0);
      for(let q=0;q<DIMS;q++){ const _t=tend[i*DIMS+q]; if(_t!==_t)nanTend++; else b+=_t; } }
    return {n, pos:+a.toFixed(6), amp:+b.toFixed(6), lin:c, prog:d, nanPos, nanAmp, nanTend,
            tick:(typeof tick!=='undefined'?tick:-1),
            totalTicks:(typeof genome!=='undefined'?genome.totalTicks:-1)};
  }catch(e){ return {error:String(e&&e.message||e)}; } };
  // Position range among LIVE particles. The fingerprint sum ran to -2.2e8 at 300 ticks and overflowed
  // to Infinity by 1500, which is either a wrapped coordinate stored unwrapped or particles genuinely
  // leaving the world and staying alive. Those are very different findings, so measure rather than infer.
  globalThis.__posRange=function(){ try{
    // Bands by how far outside the world a live particle sits. A particle one screen out is plausibly
    // in transit — the spawner launches from just off-edge. One at 1e6 screens out is not in transit,
    // it is gone, and it is still counted alive by every population metric in this project.
    let n=0,inf=0,off=0, b1=0,b2=0,b3=0,b4=0, ampIn=0,ampOut=0,ampInf=0, clustered=0;
    let mnx=Infinity,mxx=-Infinity,mny=Infinity,mxy=-Infinity;
    for(let i=0;i<N;i++){ if(!palive[i])continue; n++; const x=px[i],y=py[i],a=amp[i];
      if(!isFinite(x)||!isFinite(y)){ inf++; if(isFinite(a))ampInf+=a; continue; }
      if(x<mnx)mnx=x; if(x>mxx)mxx=x; if(y<mny)mny=y; if(y>mxy)mxy=y;
      const dx=x<0?-x:(x>W?x-W:0), dy=y<0?-y:(y>H?y-H:0), d=dx>dy?dx:dy;
      if(d<=0){ if(isFinite(a))ampIn+=a; continue; }
      off++; if(isFinite(a))ampOut+=a;
      if(d<=W)b1++; else if(d<=W*100)b2++; else if(d<=W*1e6)b3++; else b4++;
      try{ if(typeof clusterID!=='undefined'&&clusterID[i]>=0)clustered++; }catch(e){}
    }
    return {n, offWorld:off, offFrac:n?+(off/n).toFixed(4):0, nonFinite:inf,
            band_within1screen:b1, band_to100:b2, band_to1e6:b3, band_beyond:b4,
            escapeesInClusters:clustered,
            ampInWorld:+ampIn.toFixed(3), ampOffWorld:+ampOut.toFixed(3), ampNonFinite:+ampInf.toFixed(3),
            ampOffFrac:(ampIn+ampOut)>0?+(ampOut/(ampIn+ampOut)).toFixed(4):0,
            xMin:mnx, xMax:mxx, yMin:mny, yMax:mxy, W, H};
  }catch(e){ return {error:String(e&&e.message||e)}; } };
  // #72 falsifier 4. Lethality only matters if it has a SELECTIVE consequence — if programs that drive
  // unbounded velocity are now selected against. Near-escapes (live particles outside the world but not
  // yet past the kill threshold) are the leading indicator: they should FALL in the treatment arm if
  // selection is acting, and stay flat if the kill merely removes garbage after the fact.
  globalThis.__escape=function(){ try{ let mx=0,sum=0,n=0,near=0;
    for(let i=0;i<N;i++){ if(!palive[i])continue; n++;
      const vxi=vx[i],vyi=vy[i]; if(isFinite(vxi)&&isFinite(vyi)){ const sp=Math.sqrt(vxi*vxi+vyi*vyi); sum+=sp; if(sp>mx)mx=sp; }
      const x=px[i],y=py[i]; if(isFinite(x)&&isFinite(y)&&(x<0||x>W||y<0||y>H))near++; }
    return { deathsByEscape:(typeof deathsByEscape!=='undefined'?deathsByEscape:null),
             escapeNonFinite:(typeof escapeNonFinite!=='undefined'?escapeNonFinite:null),
             on:(typeof __ESCAPE_DEATH!=='undefined'?!!__ESCAPE_DEATH:null),
             nearEscapes:near, meanSpeed:n?+(sum/n).toFixed(4):0, maxSpeed:+mx.toFixed(4) };
  }catch(e){ return {error:String(e&&e.message||e)}; } };
  globalThis.__aliveN=function(){ try{ let a=0; for(let i=0;i<N;i++)if(palive[i])a++; return a; }catch(e){ return -1; } };
  globalThis.__kinds=function(){ try{ const b={}; for(let i=0;i<N;i++){ if(!palive[i])continue;
      const q=i*DIMS; let r=0; for(let d=0;d<3&&d<DIMS;d++){ let v=((tend[q+d]+1.2)/2.4*4)|0; v=v<0?0:v>3?3:v; r=r*4+v; } b[r]=1; }
    return Object.keys(b).length; }catch(e){ return -1; } };
})();
`;
const Module=require('module');
const m=new Module(__dirname+'/clamp-sim.js');m.filename=__dirname+'/clamp-sim.js';m.paths=Module._nodeModulePaths(__dirname);
try{ m._compile(code+driver,m.filename); }catch(e){ console.log(JSON.stringify({error:'BOOT: '+e.message}));process.exit(1); }
globalThis.__run(TICKS);
const dump=NOCOUNT?[]:globalThis.__clampDump();
const fingerprint=globalThis.__fingerprint();

let tCalls=0,tLo=0,tHi=0,tNaN=0,everBound=0,neverCalled=0;
for(let i=0;i<dump.length;i++){
  const [c,lo,hi,nn]=dump[i];
  tCalls+=c; tLo+=lo; tHi+=hi; tNaN+=nn;
  if(lo+hi>0)everBound++;
  if(c===0)neverCalled++;
}
const rows=dump.map((d,i)=>({ site:i, line:sites[i].line, calls:d[0], lo:d[1], hi:d[2], nan:d[3],
    bindFrac:d[0]?+((d[1]+d[2])/d[0]).toFixed(4):0, src:sites[i].src }));
// Two orderings, because they answer different questions. By BIND COUNT: where the substrate does the
// most overwriting in absolute terms. By BIND FRACTION (on sites with real traffic): where an evolved
// value is pinned essentially always, i.e. where the genome has no say at all.
const byCount=[...rows].filter(r=>r.lo+r.hi>0).sort((a,b)=>(b.lo+b.hi)-(a.lo+a.hi)).slice(0,TOP);
const byFrac =[...rows].filter(r=>r.calls>=1000).sort((a,b)=>b.bindFrac-a.bindFrac).slice(0,TOP);
const nanSites=rows.filter(r=>r.nan>0).sort((a,b)=>b.nan-a.nan).slice(0,TOP);

console.log(JSON.stringify({
  seed:process.env.SEED||null, ticks:TICKS, index:process.env.INDEX||'index.html', nocount:NOCOUNT,
  fingerprint, posRange:globalThis.__posRange(), escape:globalThis.__escape(), escSeries:globalThis.__escSeries||null,
  loopErrors, lastErr, driverErr:globalThis.__driverErr||0,
  alive:globalThis.__aliveN(), kinds:globalThis.__kinds(),
  sites:NS, sitesNeverCalled:neverCalled, sitesEverBound:everBound,
  totalEvals:tCalls, bindsLo:tLo, bindsHi:tHi, nanPassthrough:tNaN,
  bindFrac:tCalls?+((tLo+tHi)/tCalls).toFixed(5):0,
  evalsPerTick:TICKS?Math.round(tCalls/TICKS):0,
  topByBindCount:byCount, topByBindFrac:byFrac, nanSites
},null,1));
