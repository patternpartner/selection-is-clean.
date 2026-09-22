// ESTABLISHMENT — does novelty that ARRIVES ever TAKE HOLD?
//
// Written after watching the field rather than after reading the notes: at 6k ticks the panel read
// "1916 total, 15 alive", most of the living at age 32 with 0 buds, and the screen had gone to two
// clumps of one colour. Novelty was plainly arriving. What the picture asked was whether any of it
// ever displaces anything, and no rig on this page asks that -- harness-oee counts kinds discovered,
// harness-variance counts genes that differ, neither asks whether a newcomer can invade.
//
// Unit: the particle lineage, pLin[i] -- every value is a lineageRegistry key with a real birthTick
// (founder, or speciate when a child's tendency vector lands > SPECIATE_DIST from its parent's).
// At each census, over the living population:
//   lineages   distinct pLin alive
//   effN       1/sum(p^2), the effective number of lineages (Simpson). 1 = monoculture.
//   top        share of the population held by the largest lineage, and that lineage's age
// Over the run:
//   ESTABLISHED  a lineage first seen after tick WARM that ever reached ESTN members at a census.
//                Reported as a fraction of lineages first seen after WARM. This is the number.
//   TAKEOVERS    times the top lineage's id changed between censuses AND the new top was born after
//                the old top -- a newcomer displacing an incumbent, not two incumbents trading places.
//
// DRAWS NOTHING: reads pLin/palive/lineageRegistry, calls only loop(). No backticks.
// Env: SEED (default 1) TICKS (default 20000) EVERY (default 250) ESTN (default 10) WARM (default 2000)
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
require(path.join(__dirname,'harness-env.js')).applyKnobs(globalThis);
const TICKS=parseInt(process.env.TICKS||'20000',10), EVERY=parseInt(process.env.EVERY||'250',10);
const ESTN=parseInt(process.env.ESTN||'10',10), WARM=parseInt(process.env.WARM||'2000',10);
const html=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8');
const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
const DRIVER=[
';globalThis.__es=function(T,EVERY){',
'  var out={rows:[],err:null,first:{},peak:{}};',
'  var census=function(){',
'    var cnt=new Map(), n=0;',
'    for(var i=0;i<N;i++){ if(!palive[i])continue; n++; var l=pLin[i]; cnt.set(l,(cnt.get(l)||0)+1); }',
'    var s2=0, topL=-1, topN=0;',
'    cnt.forEach(function(c,l){ var p=c/(n||1); s2+=p*p; if(c>topN){topN=c;topL=l;}',
'      if(out.first[l]===undefined) out.first[l]=tick; if(!(out.peak[l]>=c)) out.peak[l]=c; });',
'    var e=lineageRegistry.get(topL);',
'    out.rows.push({t:tick,alive:n,lineages:cnt.size,effN:s2>0?1/s2:0,top:topL,topShare:topN/(n||1),',
'      topBorn:e?e.birthTick:null});',
'  };',
'  census();',
'  for(var step=0;step<T;step++){',
'    globalThis.__detMs+=5;',
'    try{ loop(); }catch(e){ if(!out.err) out.err=String(e&&e.message||e); }',
'    if((step+1)%EVERY===0) census();',
'  }',
'  return out;',
'};'
].join('\n');
const Module=require('module');
const mod=new Module('/tmp/establish.js'); mod.filename='/tmp/establish.js'; mod.paths=Module._nodeModulePaths('/tmp');
mod._compile(code+DRIVER,'/tmp/establish.js');
const r=globalThis.__es(TICKS,EVERY);
let late=0, est=0;
for(const l in r.first){ if(r.first[l]>WARM){ late++; if(r.peak[l]>=ESTN) est++; } }
let take=0, swaps=0;
for(let k=1;k<r.rows.length;k++){ const a=r.rows[k-1], b=r.rows[k];
  if(a.top!==b.top){ swaps++; if(b.topBorn!==null&&a.topBorn!==null&&b.topBorn>a.topBorn) take++; } }
const third=Math.floor(r.rows.length/3), mean=(f,a,b)=>{let s=0;for(let k=a;k<b;k++)s+=r.rows[k][f];return s/Math.max(1,b-a);};
const summary={seed:process.env.SEED||'1',ticks:TICKS,err:r.err,
  lateLineages:late, established:est, estFrac:late?+(est/late).toFixed(4):null, takeovers:take, topSwaps:swaps,
  effN_early:+mean('effN',1,third+1).toFixed(2), effN_late:+mean('effN',r.rows.length-third,r.rows.length).toFixed(2),
  topShare_late:+mean('topShare',r.rows.length-third,r.rows.length).toFixed(3),
  alive_late:+mean('alive',r.rows.length-third,r.rows.length).toFixed(0),
  lastTopAge:r.rows.length?(r.rows[r.rows.length-1].t-(r.rows[r.rows.length-1].topBorn||0)):null};
if(process.env.ROWS) for(const x of r.rows) console.log(JSON.stringify(x));
console.log(JSON.stringify(summary));
