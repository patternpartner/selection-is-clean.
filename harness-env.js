// Shared headless browser-API stubs for the small test rigs. The big harnesses each carry their
// own copy inline; this exists so new checks do not have to paste 20 lines of shims to boot the sim.
// #250: LET V8 OPTIMISE THE VM. vmStep (#231's one dispatch for four machines) is far over V8's default
// --max-optimized-bytecode-size (61,440), so TurboFan never touches it: every instruction every creature runs
// went through the baseline tier, and a profile put ~70% of each tick there. Raising the limit before the
// engine is compiled makes the same run 2-3x faster with byte-identical output (hash series compared on
// seeds 5, 1-3). It changes WHEN code is compiled, never WHAT it computes: JS arithmetic is IEEE double in
// every tier. NO_V8OPT=1 turns it off for an A/B. Loaded by every node rig that boots the engine except
// sim.worker.js, which is the browser's worker - Chrome keeps the default, so the FIELD still runs slow.
if(!process.env.NO_V8OPT){ try{ require('v8').setFlagsFromString('--max-optimized-bytecode-size=2000000'); }catch(_){} }
module.exports=function(g){
function selfProxy(){const f=function(){return p};const p=new Proxy(f,{get(_t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='width'||k==='height')return 0;if(k==='data')return new Uint8ClampedArray(4);return p},apply(){return p}});return p}
const CTX=selfProxy();
function makeEl(){return{getContext:()=>CTX,addEventListener(){},removeEventListener(){},set onclick(_){},set onchange(_){},click(){},appendChild(){},removeChild(){},remove(){},setAttribute(){},classList:{add(){},remove(){},toggle(){},contains(){return false}},style:{},width:1280,height:720,_text:'',get textContent(){return this._text},set textContent(v){this._text=v}}}
const ELS={};
g.document={getElementById:id=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),querySelector:()=>null,addEventListener(){},removeEventListener(){},head:makeEl(),body:makeEl(),get hidden(){return false}};
g.window=g;g.addEventListener=()=>{};g.removeEventListener=()=>{};
g.location={hash:'',pathname:'/',search:'',href:'http://x/'};g.history={replaceState(){},pushState(){}};
g.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
g.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
g.BroadcastChannel=class{constructor(){}postMessage(){}addEventListener(){}close(){}set onmessage(_){}};
g.fetch=()=>new Promise(()=>{});g.devicePixelRatio=1;g.innerWidth=1280;g.innerHeight=720;
g.__DETERMINISTIC=1;   // #136: silence real-world signal (wall clock, device motion) — a seeded
                       // replay must not depend on what time of day it was run.
g.__detMs=0;g.performance={now:()=>g.__detMs};
let a=(parseInt(process.env.SEED||'1',10)|0)>>>0;
Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
g.requestAnimationFrame=()=>0;g.cancelAnimationFrame=()=>{};g.setTimeout=()=>0;g.clearTimeout=()=>{};g.setInterval=()=>0;g.clearInterval=()=>{};
console.error=()=>{};console.warn=()=>{};};

// Knob plumbing. The engine resolves every gate from globalThis.__NAME, never from process.env, so a
// knob with no explicit env line is unreachable from a harness — harness-strip.js states the rule
// outright: "a knob that cannot be turned off is not a control, so the plumbing goes in before any
// ablation claim does."
// #131's own repairs deliberately carry NO knob: selection already holds a finer dial on each (whether
// programs keep ops 232-235, genome.opnovStrength, genome.reachGain). Listing them here would have
// been worse than useless — an env var that silently does nothing is the same trap one level down.
// What is listed is the set that is genuinely dormant AND genuinely togglable.
// #215 added a gene (motifKeepBias) and its knob and did NOT list it here, which is the exact gap
// the paragraph above describes. It cost a bisect: substrate-test went red at TICKS=40 and the
// knob-off control that would have separated a real defect from a random-stream shift could not be
// run from a harness at all. Plumbed now.
// #216d: FOUND joins the list, and it is the oldest instance of this bug in the project.
// CLAUDE.md instructs every session to run the acceptance rig "with FOUND=0 as well as on".
// NOTHING read process.env.FOUND. The engine reads globalThis.__FOUND via foundOn() (engine.html
// 4662), FOUND was absent from this list, and substrate-test did not call applyKnobs at all until
// #216b. So FOUND=0 node substrate-test.js was byte-identical to node substrate-test.js, and every
// session that followed the front-page instruction ran the same thing twice believing it had a
// control. The rule this file states about harness knobs was being broken by the project's own
// setup instructions.
// #217d: CHEM joins the list AT THE SAME TIME as the gate it controls, which is the whole point of
// the paragraphs above. #215 shipped a gene and its knob and left this line alone, and it cost a
// bisect; FOUND sat unplumbed for the project's whole life while the front page told every session
// to use it as a control. A knob and its KNOBS entry are one change or they are a trap.
// #238: CHEM and CHEM_VERDICT leave the list in the same change that removes their gates -- the
// same rule read backwards: an entry with no gate behind it is a control that reads like one.
// #241: PEERINS gates the inscription bundle (spark writes, inscription networkSend, receive
// writes). #245: unset now means OFF, peerInsOn's default. PEERINS=1 turns the bundle on; either arm keeps
// the same draws.
// #249: six default-off arms had a gate in the engine and no entry here, so every applyKnobs rig
// (harness-establish among them) ran CHAR_DISP=1 as the control: CHAR_DISP, NICHE_LOCALTEND, NICHE_DRIFT,
// NICHE_CELLDRIFT, NICHE_BIOTIC, GROUP_PROBE. harness-oee reached them by its own env lines; nothing else did.
// #249: RQ_TRAIT, GRIP_SEED, CHAR_DISP, NICHE_LOCALTEND, NICHE_CELLDRIFT leave with their gates (deleted by the
// retire-or-prove rule); an entry with no gate behind it is a control that reads like one.
module.exports.KNOBS = ['MUTUALISM','GENO_PARASITE','SELF_PREDICT','MEME_TRANSFER','MOTIF_SELECT','FOUND','SELFMODEL','LAW_PERSIST','MUTMAG','AIM','INHERIT','INHERIT_SD','RATION','PROV_BIRTH','RARE_BIRTH_K','OUTLIER_BIRTH_K','EXTINCT_UNDO','AIM_STILL','LAW_KCAP','PEERINS','NICHE_DRIFT','NICHE_BIOTIC','GROUP_PROBE','GENE_DRAW'];
module.exports.applyKnobs = function(g){
  for (const kn of module.exports.KNOBS)
    if (process.env[kn] !== undefined) g['__'+kn] = parseInt(process.env[kn], 10);
};
