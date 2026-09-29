// #261 — THE LAB EVOLVES THE ENGINE. The user: "become the bacteria in our approach ... be open ended". So instead of one
// hand-picked hypothesis at a time, a POPULATION of engine variants, many cheap runs, selection, recombination, mutation.
// This is a SEARCH, not a verdict: whatever it finds must still pass the retire-or-prove template on unseen seeds, and
// #256's family-tree null, before anything ships.
//
// GENOME (one engine variant, applied by harness-variant.js):
//   force   6 bits  trait-force knockouts: bleed0 blend0 toll0 motif0 nfd0 vmbleed0
//   mechOff 7 bits  #253's switches held OFF: RED_QUEEN NICHE_BUILD NICHE_LOCAL FRONTIER_EXPAND OPCODE_NOVELTY NOVELTY_ARCHIVE RICH_GRAMMAR
//   armOn   2 bits  dormant arms turned ON: GROUP_PROBE GENE_DRAW
//   laws    4 reals CONTACT_BLEND [0,0.03], BIRTH_LOTTERY [0,1], RARE_BIRTH [0,2], OUTLIER_BIRTH [0,3]
// LEFT OUT ON PURPOSE: INHERIT_SD and SPECIATE_DIST. Raising mutation strength or lowering the speciation distance buys
// spread and lineage counts by construction (measured on the first test: INHERIT_SD 0.35 took spread 0.51 -> 0.81 with
// other changes), and a search that may touch them will find noise, not novelty - #219b's warning and #255's lesson.
//
// JUDGE - no single score to game (#255). Three grid-free objectives, each a mean over every run the genome has had:
// trait spread late, centred entropy late, lineage novelty (new lineages holding 3 members for 1,000 ticks, per 1k).
// Feasible only if the mean floor is at least FLOOR living and no run went extinct. Fitness = the sum of the genome's
// RANKS on the three objectives among feasible genomes (Borda), so a genome cannot win on one measure alone.
// FAIRNESS: every genome in a generation runs on the same SEEDS_PER_GEN fresh seeds (common random numbers), and the
// seeds change every generation, so nothing can fit a fixed seed; elites accumulate evaluations across generations.
// The DEFAULT engine (empty genome) is a permanent member - the reference every other variant is ranked against.
//   GENS=40 POP=12 SEEDS_PER_GEN=2 TICKS=5000 PAR=6 node harness-evolve.js <outdir>
// Resumable: state is written after every generation (<outdir>/state.json); a restart continues from it.
const cp=require('child_process'), fs=require('fs'), path=require('path');
const E=process.env, OUT=process.argv[2]||'evolve-out';
const GENS=+(E.GENS||40), POP=+(E.POP||12), SPG=+(E.SEEDS_PER_GEN||2), TICKS=+(E.TICKS||5000), PAR=+(E.PAR||6), FLOOR=+(E.FLOOR||50);
const ELITE=+(E.ELITE||4), PBIT=+(E.PBIT||0.08), PLAW=+(E.PLAW||0.3), SEED0=+(E.SEED0||5000);
const FORCES=['bleed0','blend0','toll0','motif0','nfd0','vmbleed0'];
const MECHS=['RED_QUEEN','NICHE_BUILD','NICHE_LOCAL','FRONTIER_EXPAND','OPCODE_NOVELTY','NOVELTY_ARCHIVE','RICH_GRAMMAR'];
const ARMS=['GROUP_PROBE','GENE_DRAW'];
const LAWS=[['CONTACT_BLEND',0,0.03,0.03],['BIRTH_LOTTERY',0,1,0],['RARE_BIRTH',0,2,0],['OUTLIER_BIRTH',0,3,2]];   // name, lo, hi, default
fs.mkdirSync(OUT,{recursive:true});
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const defaultGenome=()=>({force:[],mechOff:[],armOn:[],laws:Object.fromEntries(LAWS.map(l=>[l[0],l[3]]))});
const keyOf=g=>JSON.stringify([g.force.slice().sort(),g.mechOff.slice().sort(),g.armOn.slice().sort(),LAWS.map(l=>+g.laws[l[0]].toFixed(4))]);
const toggle=(arr,x)=>arr.includes(x)?arr.filter(y=>y!==x):arr.concat([x]);
function mutate(g,r){ const c={force:g.force.slice(),mechOff:g.mechOff.slice(),armOn:g.armOn.slice(),laws:Object.assign({},g.laws)};
  for(const f of FORCES) if(r()<PBIT)c.force=toggle(c.force,f);
  for(const m of MECHS) if(r()<PBIT)c.mechOff=toggle(c.mechOff,m);
  for(const a of ARMS) if(r()<PBIT)c.armOn=toggle(c.armOn,a);
  for(const [n,lo,hi] of LAWS) if(r()<PLAW){ let v=c.laws[n]+(r()+r()+r()-1.5)*0.2*(hi-lo); c.laws[n]=v<lo?lo:v>hi?hi:v; }
  return c; }
function cross(a,b,r){ const pickSet=(A,B,U)=>U.filter(x=>(r()<0.5?A:B).includes(x));
  const laws={}; for(const [n] of LAWS)laws[n]=r()<0.5?a.laws[n]:b.laws[n];
  return {force:pickSet(a.force,b.force,FORCES),mechOff:pickSet(a.mechOff,b.mechOff,MECHS),armOn:pickSet(a.armOn,b.armOn,ARMS),laws}; }
function evalOne(g,seed){ return new Promise(res=>{ const env=Object.assign({},process.env,{SEED:String(seed),TICKS:String(TICKS),
    FORCE:g.force.join(','),MECHOFF:g.mechOff.join(','),ARMON:g.armOn.join(','),LAWS:LAWS.map(([n])=>n+':'+g.laws[n]).join(',')});
  cp.execFile('node',[path.join(__dirname,'harness-variant.js')],{env,maxBuffer:1e7},(e,out)=>{ try{ res(JSON.parse(out)); }catch(_){ res({error:String(e||out).slice(0,200)}); } }); }); }
async function pool(jobs){ let i=0; const out=new Array(jobs.length); async function w(){ while(i<jobs.length){ const k=i++; out[k]=await jobs[k](); } } await Promise.all(Array.from({length:PAR},w)); return out; }
// state: population (genomes), archive key -> {genome, runs:[...]}
const SF=path.join(OUT,'state.json');
let st=fs.existsSync(SF)?JSON.parse(fs.readFileSync(SF,'utf8')):null;
const r=mulberry(0xE7017E^(SEED0*2654435761)^((st?st.gen:0)*40503));
if(!st){ const pop=[defaultGenome()]; while(pop.length<POP)pop.push(mutate(mutate(defaultGenome(),r),r)); st={gen:0,pop,archive:{}}; }
function stats(key){ const a=st.archive[key]; const ok=a.runs.filter(x=>!x.error); if(!ok.length)return null;
  const mean=f=>ok.reduce((t,x)=>t+x[f],0)/ok.length;
  return {n:ok.length,spread:mean('spreadLate'),ent:mean('centredHLate'),lin:mean('lineagePersistPer1k'),floor:mean('floor'),extinct:ok.some(x=>x.floor===0||x.alive===0)}; }
function rankAll(keys){ const S=keys.map(k=>({k,s:stats(k)})).filter(x=>x.s); const feas=S.filter(x=>!x.s.extinct&&x.s.floor>=FLOOR);
  for(const f of ['spread','ent','lin']){ const sorted=feas.slice().sort((a,b)=>a.s[f]-b.s[f]); sorted.forEach((x,i)=>{ x.rank=(x.rank||0)+i; }); }
  for(const x of S) if(!feas.includes(x))x.rank=-1;
  return S.sort((a,b)=>b.rank-a.rank); }
(async()=>{
  const DEF=keyOf(defaultGenome());
  for(;st.gen<GENS;st.gen++){
    const seeds=Array.from({length:SPG},(_,j)=>SEED0+st.gen*SPG+j);
    for(const g of st.pop){ const k=keyOf(g); if(!st.archive[k])st.archive[k]={genome:g,runs:[]}; }
    const jobs=[]; for(const g of st.pop) for(const sd of seeds) jobs.push(()=>evalOne(g,sd).then(x=>{ x.seed=sd; st.archive[keyOf(g)].runs.push(x); }));
    await pool(jobs);
    const ranked=rankAll([...new Set(st.pop.map(keyOf))]);
    const line={gen:st.gen,seeds,ranked:ranked.map(x=>({key:x.k,isDefault:x.k===DEF,rank:x.rank,n:x.s.n,spread:+x.s.spread.toFixed(3),ent:+x.s.ent.toFixed(3),lin:+x.s.lin.toFixed(3),floor:+x.s.floor.toFixed(0),extinct:x.s.extinct}))};
    fs.appendFileSync(path.join(OUT,'log.jsonl'),JSON.stringify(line)+'\n');
    process.stderr.write('gen '+st.gen+' best '+ranked[0].k+' rank '+ranked[0].rank+' | default rank '+(ranked.find(x=>x.k===DEF)||{}).rank+'\n');
    // next population: the default (always), the elites, and offspring of tournament-picked parents
    const feasible=ranked.filter(x=>x.rank>=0), elites=feasible.slice(0,ELITE).map(x=>st.archive[x.k].genome);
    const pick=()=>{ const a=feasible[(r()*feasible.length)|0], b=feasible[(r()*feasible.length)|0]; return st.archive[(a.rank>=b.rank?a:b).k].genome; };
    const next=[defaultGenome()]; for(const e of elites) if(keyOf(e)!==DEF)next.push(e);
    let guard=0; while(next.length<POP&&guard++<500){ const c=mutate(cross(pick(),pick(),r),r); if(!next.some(g=>keyOf(g)===keyOf(c)))next.push(c); }
    st.pop=next; fs.writeFileSync(SF,JSON.stringify(Object.assign({},st,{gen:st.gen+1})));
  }
  fs.writeFileSync(path.join(OUT,'all.done'),'ok');
})();
