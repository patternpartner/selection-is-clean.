// WHOLE-BANK ABLATION — does the self-extending VM's authored-atom bank have ANY fitness grip?
//
// The single-atom ablation (harness-ablate.js) came back INCONCLUSIVE: no ONE proven atom is load-bearing.
// This distinguishes "no SINGLE atom matters (redundancy)" from "NO atom matters (decoration)". Knock out the
// ENTIRE bank — every authored atom pinned to constant 0 every tick (which also freezes authorship: any newly
// minted atom is re-zeroed next tick) — and compare fitness to intact, from the same authored genome, across
// seeds. If intact reliably beats whole-bank-ablated, the bank collectively contributes. If not, the whole
// self-extension machinery is executing atoms with no selective grip — the project's largest honest result.
//
// Pe unchanged; all via the GENOME= resume path + ABLATE=all hook in harness-oee.js.
// Env: AUTH_SEED (7)  AUTH_TICKS (45000)  CONT_TICKS (10000)  SEEDS (11,13,17,19,23)  CONC (3)
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const HARNESS = path.join(__dirname, 'harness-oee.js');
const TMP = process.env.TMPDIR || '/tmp';
const GENOME_FILE = path.join(TMP, 'ablate-bank-genome-' + process.pid + '.json');
const ENGINE = { MEME_TRANSFER:'1', GROUP_COMMONS:'1', RICH_GRAMMAR:'1', REACH:'1', ATOM_PIPELINE:'1', ATOM_DURABLE:'1' };
const AUTH_SEED = process.env.AUTH_SEED || '7';
const AUTH_TICKS = process.env.AUTH_TICKS || '45000';
const CONT_TICKS = process.env.CONT_TICKS || '10000';
const SEEDS = (process.env.SEEDS || '11,13,17,19,23').split(',').map(s=>s.trim());
const CONC = parseInt(process.env.CONC || '3', 10);
const SAMPLE = '1000';

function run(env){ return new Promise((res,rej)=>{ execFile('node',[HARNESS],{env:{...process.env,...env},maxBuffer:1<<28},
  (err,out)=>{ if(err)return rej(new Error(err.message+'\n'+out.slice(-400))); try{res(JSON.parse(out));}catch(e){rej(new Error('bad JSON: '+out.slice(-400)));} }); }); }
function lateMean(series,key){ const t2=Math.floor(2*series.length/3); let s=0,c=0; for(let i=t2;i<series.length;i++){const v=series[i][key]; if(typeof v==='number'){s+=v;c++;}} return c?s/c:0; }
function mean(a){ return a.length?a.reduce((x,y)=>x+y,0)/a.length:0; }
function sd(a){ const m=mean(a); return Math.sqrt(mean(a.map(x=>(x-m)*(x-m)))); }
async function pool(jobs,conc){ const out=new Array(jobs.length); let i=0; async function w(){ while(i<jobs.length){ const idx=i++; out[idx]=await jobs[idx](); } } await Promise.all(Array.from({length:Math.min(conc,jobs.length)},w)); return out; }

(async()=>{
  console.error(`[author] seed=${AUTH_SEED} ticks=${AUTH_TICKS} …`);
  await run({ ...ENGINE, SEED:AUTH_SEED, TICKS:AUTH_TICKS, SAMPLE, DUMP_GENOME:GENOME_FILE });
  const T = (JSON.parse(fs.readFileSync(GENOME_FILE,'utf8')).targets)||{};
  console.error(`[author] bank: totAtoms=${T.totAtoms} nBound=${T.nBound} (most-used uses=${T.provenUses})`);
  if (!T.totAtoms) { console.log(JSON.stringify({ error:'genome authored no atoms — nothing to ablate', targets:T },null,1)); return; }

  const specs = [];
  for (const seed of SEEDS) for (const mode of ['none','all']) specs.push({ seed, mode });
  const jobs = specs.map(sp=>async()=>{ const r=await run({ ...ENGINE, GENOME:GENOME_FILE, SEED:sp.seed, TICKS:CONT_TICKS, SAMPLE, ABLATE:sp.mode });
    const s=r.series||[]; return { ...sp, amp:lateMean(s,'meanAmp'), N:lateMean(s,'N'), boundOps:lateMean(s,'boundOps'), driverErr:r.driverErr }; });
  console.error(`[continue] ${jobs.length} runs (${SEEDS.length} seeds x [none, all]), conc=${CONC} …`);
  const results = await pool(jobs, CONC);

  const ampBy = m => results.filter(r=>r.mode===m).map(r=>r.amp);
  const perSeedDrop = SEEDS.map(seed=>{ const n=results.find(r=>r.seed===seed&&r.mode==='none'), a=results.find(r=>r.seed===seed&&r.mode==='all'); return (n&&a)?n.amp-a.amp:null; }).filter(x=>x!==null);
  const dropMean=mean(perSeedDrop), dropSd=sd(perSeedDrop), positive=perSeedDrop.filter(d=>d>0).length;
  const majority=Math.ceil(2*perSeedDrop.length/3);
  const beatsNoise=dropMean>dropSd, consistent=positive>=majority;
  let label; if(dropMean>0&&beatsNoise&&consistent)label='BANK_ADAPTIVE'; else if(dropMean<=0)label='BANK_NEUTRAL'; else label='INCONCLUSIVE';

  const verdict = {
    bank:{ totAtoms:T.totAtoms, nBound:T.nBound },
    intact_meanAmp:+mean(ampBy('none')).toFixed(4),
    wholeBankAblated_meanAmp:+mean(ampBy('all')).toFixed(4),
    perSeed_intactMinusAblated:perSeedDrop.map(d=>+d.toFixed(4)),
    effect_mean:+dropMean.toFixed(4), effect_sd:+dropSd.toFixed(4),
    beatsOwnNoise:beatsNoise, positiveInSeeds:positive+'/'+perSeedDrop.length+' (need >='+majority+')',
    VERDICT:label,
    note:'BANK_ADAPTIVE = removing the whole authored-atom bank robustly lowers fitness (the VM self-extension has selective grip). BANK_NEUTRAL = it does not (the atoms are executed decoration). Whole bank pinned to 0 every tick.'
  };
  console.log(JSON.stringify({ config:{AUTH_SEED,AUTH_TICKS,CONT_TICKS,SEEDS}, verdict, raw:results },null,1));
  try{ fs.unlinkSync(GENOME_FILE); }catch(e){}
})().catch(e=>{ console.error('BANK ABLATION FAILED:',e.message); process.exit(1); });
