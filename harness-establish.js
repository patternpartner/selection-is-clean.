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
const EC=require(path.join(__dirname,'establish-census.js')), DRIVER=EC.DRIVER;   // #249: one census, shared with harness-oee ESTABLISH=<every>
const Module=require('module');
const mod=new Module('/tmp/establish.js'); mod.filename='/tmp/establish.js'; mod.paths=Module._nodeModulePaths('/tmp');
mod._compile(code+DRIVER,'/tmp/establish.js');
const r=globalThis.__es(TICKS,EVERY);
const summary=EC.summarize(r,{WARM,ESTN,seed:process.env.SEED||'1',ticks:TICKS});
if(process.env.ROWS) for(const x of r.rows) console.log(JSON.stringify(x));
console.log(JSON.stringify(summary));
