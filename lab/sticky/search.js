// lab/sticky/search.js - STICKY-SEARCH (lab/STICKY-SEARCH.md): automated search over rule knobs for "used novelty that sticks",
// scored RELATIVE to matched nulls run in the same config, then an automatic held-out confirmation of the top 3. Pre-registered:
// everything that decides (knobs, ranges, sampling, phases, score, bar, seeds) is fixed in this file before launch.
// RESUMABLE: every run is a file named by a hash of (opts, seed, ticks) under ROOT; finished runs (.done) and timed-out runs (.fail)
// are never redone, so after a box restart just relaunch:  setsid nohup node lab/sticky/search.js >> lab/sticky/trial/search.log 2>&1 &
// The search is deterministic given the finished runs, so a relaunch makes exactly the same decisions.
'use strict';
const fs=require('fs'), path=require('path'), crypto=require('crypto'), {spawn,execSync}=require('child_process');
const TEST=process.env.TEST==='1';   // TEST=1: tiny dry run (ROOT /tmp/sticky-test, 4k/6k ticks, no git, no doc) to check the plumbing only
const REPO=path.resolve(__dirname,'../..'), ROOT=TEST?'/tmp/sticky-test':'/home/box/sticky-runs', P=+(process.env.P||8), TR=TEST?'/tmp/sticky-test/trial':path.join(REPO,'lab/sticky/trial');
const SEARCH_SEEDS=[201,202,203,204,205,206], HELDOUT_SEEDS=[301,302,303];
const T_S=TEST?12000:100000, WIN_S=TEST?1:5, T_H=TEST?12000:450000, WIN_H=TEST?1:10, TIMEOUT_S=1800e3, TIMEOUT_H=7200e3;
const N_LHS=TEST?7:55, N_HALF=TEST?5:14, N_PAR=TEST?3:6, N_CHILD=TEST?4:14, N_CHILD_UP=TEST?2:4, N_FINAL=TEST?4:6, N_TOP=3;
fs.mkdirSync(ROOT,{recursive:true}); fs.mkdirSync(TR,{recursive:true});
const log=(...a)=>{ const l=`${new Date().toLocaleString('en-GB',{timeZone:'Europe/London'})} BST ${a.join(' ')}`; console.log(l); };
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
// ---------------- search space ----------------
// grp W = WORLD knob (applied to the design arm AND to every null, including the in-world RANDCAP); O = OPERATOR knob (design arm,
// SHUF and DRIFT; NOT the in-world RANDCAP, which keeps the default plain-chance operator). flag = probability-gated: a knob is
// changed from its default only when its flag gene < pOn.
const KN=[
  {n:'CHEM_DECAY',g:'W',t:'log',lo:1e-4,hi:5e-3,pOn:0.5},          // world-molecule turnover
  {n:'CHEM_D',g:'W',t:'lin',lo:0.05,hi:0.6,pOn:0.5},               // molecule diffusion (food locality)
  {n:'CHEM_ALPHA',g:'W',t:'lin',lo:0.2,hi:0.8,pOn:0.5},            // share of eaten light left as molecule 0
  {n:'PATCHES',g:'W',t:'int',lo:1,hi:8,pOn:0.5},                   // light patchiness: number of patches
  {n:'PATCH_R',g:'W',t:'lin',lo:4,hi:16,pOn:0.5},                  //   patch radius
  {n:'PATCH_V',g:'W',t:'log',lo:5e-4,hi:2e-2,pOn:0.5},             //   patch drift speed (environment drift)
  {n:'L_RATE',g:'W',t:'log',lo:0.01,hi:0.2,pOn:0.5},               //   light regrowth rate
  {n:'RENEW',g:'W',t:'log',lo:1.5,hi:30,pOn:0.35,map:v=>({RENEW:1,RN_CAP:+v.toPrecision(3)})},  // local food renewal (external energy)
  {n:'BODY_CROWD',g:'W',t:'log',lo:0.5,hi:20,pOn:0.35},           // upkeep scaling with crowding on the substrate (new)
  {n:'DISP',g:'W',t:'lin',lo:0.01,hi:0.3,pOn:0.35},               // newborn dispersal / carrier locality (new)
  {n:'BODY_UP',g:'W',t:'log',lo:2e-4,hi:2e-3,pOn:0.5},             // body upkeep per catalyst
  {n:'BODY_UPX',g:'W',t:'lin',lo:1,hi:2,pOn:0.5},                  // body-size cost exponent
  {n:'BODY_F',g:'W',t:'lin',lo:0.02,hi:0.2,pOn:0.5},               // catalyst turnover rate
  {n:'SCAR',g:'W',t:'lin',lo:0.1,hi:0.6,pOn:0.25,map:v=>({SCAR_T:30000,SCAR_ON:20000,SCAR_MIN:+v.toPrecision(3)})},  // base-metabolism run-down
  {n:'BODY_MUT',g:'O',t:'log',lo:0.002,hi:0.05,pOn:0.5},          // mutation-vs-capture-vs-fusion mix
  {n:'BODY_CAP',g:'O',t:'log',lo:0.005,hi:0.1,pOn:0.5},
  {n:'BODY_FUSE',g:'O',t:'lin',lo:0,hi:0.1,pOn:0.5},
  {n:'BODY_DUP',g:'O',t:'log',lo:0.002,hi:0.05,pOn:0.5},
  {n:'BODY_DEL',g:'O',t:'log',lo:0.002,hi:0.05,pOn:0.5},
  {n:'BODY_MQ',g:'O',t:'lin',lo:0,hi:1,pOn:0.5},
  {n:'CH_LEN',g:'O',t:'lin',lo:0,hi:1,pOn:0.5,map:v=>({CH_LEN:v<0.15?0:+(0.8+(v-0.15)/0.85*2.2).toPrecision(3)})},  // jump tail (0 = one-step)
  {n:'CH_AWAY',g:'O',t:'lin',lo:0,hi:0.8,pOn:0.35},
  {n:'BODY_MAX',g:'O',t:'int',lo:6,hi:24,pOn:0.5},
  {n:'XB',g:'O',t:'log',lo:0.1,hi:10,pOn:0.35,map:v=>({XB:1,XB_GAIN:+v.toPrecision(3)})},     // separate exploration budget (new)
  {n:'CAPSRC',g:'O',t:'vec4',pOn:0.3},                             // capture-source mix (LAST, RAND, ENV, EXT) instead of pure RAND
];
const NG=KN.reduce((s,k)=>s+2+(k.t==='vec4'?3:0),0);   // genes: [flag, value(s)] per knob
const BASE_O={CHEM:1,HBODY:1,BODY_F:0.05,BODY_MAX:16,BODY_FUSE:0.02};
function knobVals(gene){ const W={}, O={}; let i=0; const on=[];
  for(const k of KN){ const f=gene[i++], u=gene[i++]; const ex=k.t==='vec4'?[gene[i++],gene[i++],gene[i++]]:null; if(!(f<k.pOn))continue; on.push(k.n); let o;
    if(k.t==='vec4'){ const w=[u,...ex].map(x=>0.05+x), s=w.reduce((a,b)=>a+b,0); o={BODY_RCAP:0,BODY_CW:w.map(x=>+(x/s).toFixed(3))}; }
    else { let v=k.t==='log'?Math.exp(Math.log(k.lo)+u*(Math.log(k.hi)-Math.log(k.lo))):k.lo+u*(k.hi-k.lo); if(k.t==='int')v=Math.min(k.hi,Math.floor(k.lo+u*(k.hi-k.lo+1)));
      o=k.map?k.map(v):{[k.n]:k.t==='int'?v:+v.toPrecision(3)}; }
    Object.assign(k.g==='W'?W:O,o); } return {W,O,on}; }
function arms(gene){ const {W,O,on}=knobVals(gene); const X={...BASE_O,BODY_RCAP:1,CH_LEN:1.5,...W,...O};
  return {on,W,O,X, R:{...BASE_O,...W,BODY_RCAP:1}, SH:{...X,BODY_SHUF:1}, DR:{...X,BODY_DRIFT:1}}; }
const REF={D:{...BASE_O,BODY_RCAP:1,CH_LEN:1.5}, DRIFT:{...BASE_O,BODY_RCAP:1,CH_LEN:1.5,BODY_DRIFT:1}, BASE:{CHEM:1}};
// ---------------- runs ----------------
const canon=o=>JSON.stringify(Object.keys(o).sort().reduce((a,k)=>(a[k]=o[k],a),{}));
const rid=(o,seed,ticks)=>crypto.createHash('sha1').update(canon(o)+'|'+seed+'|'+ticks).digest('hex').slice(0,14);
const rfile=(o,seed,ticks)=>path.join(ROOT,rid(o,seed,ticks));
let running=0, nDone=0; const queue=[];
const inflight=new Map();   // dedupe identical runs requested twice in one session (e.g. c000 arms == references)
function runOne(o,seed,ticks){ const f=rfile(o,seed,ticks); if(fs.existsSync(f+'.done')||fs.existsSync(f+'.fail'))return Promise.resolve();
  if(inflight.has(f))return inflight.get(f);
  const p=new Promise(res=>{ queue.push({o,seed,ticks,f,res}); pump(); }); inflight.set(f,p); return p; }
function pump(){ while(running<P&&queue.length){ const j=queue.shift(); running++; fs.writeFileSync(j.f+'.opts',canon(j.o)+` seed ${j.seed} ticks ${j.ticks}\n`);
    const out=fs.openSync(j.f+'.jsonl','w'), err=fs.openSync(j.f+'.err','w'); const ch=spawn('node',[path.join(REPO,'lab/core-run.js')],{cwd:REPO,env:{...process.env,SEED:String(j.seed),TICKS:String(j.ticks),EVERY:'1000',OPTS:canon(j.o)},stdio:['ignore',out,err]});
    const to=setTimeout(()=>{ ch.kill('SIGKILL'); fs.writeFileSync(j.f+'.fail','timeout\n'); },j.ticks>T_S?TIMEOUT_H:TIMEOUT_S);
    ch.on('exit',()=>{ clearTimeout(to); fs.closeSync(out); fs.closeSync(err); running--; nDone++;
      if(!fs.existsSync(j.f+'.fail')){ const n=fs.readFileSync(j.f+'.jsonl','utf8').split('\n').filter(x=>x.startsWith('{')).length; if(n===j.ticks/1000)fs.writeFileSync(j.f+'.done',''); else fs.writeFileSync(j.f+'.fail',`exit with ${n} samples\n`); }
      if(nDone%60===0)commit(`sticky-search: progress (${nDone} runs this session)`); j.res(); pump(); }); } }
// ---------------- metric ----------------
function S(o,seed,ticks,WIN){ const f=rfile(o,seed,ticks); if(!fs.existsSync(f+'.done'))return null;
  const rows=fs.readFileSync(f+'.jsonl','utf8').trim().split('\n').map(JSON.parse), nW=Math.floor(rows.length/WIN), used=[];
  for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), inc=new Map(), car=new Map();
    for(const r of W){ const b=r.body||{}; for(const [k,v] of (b.bU||[]))inc.set(k,(inc.get(k)||0)+v/W.length); for(const [k,v] of (b.bC||[]))car.set(k,(car.get(k)||0)+v/W.length); }
    used.push(new Set([...[...inc].filter(([k,v])=>v>=0.01).map(([k])=>k),...[...car].filter(([k,v])=>v>=0.01).map(([k])=>k)])); }
  const ever=new Set(), st=[]; for(let w=0;w<nW;w++){ const n=[...used[w]].filter(k=>!ever.has(k)); n.forEach(k=>ever.add(k)); st.push(w+2<nW?n.filter(k=>used[w+2].has(k)).length:NaN); }
  const E=nW-2, th=Math.floor(E/3), late=st.slice(E-th,E), lr=rows.slice(Math.floor(rows.length*2/3));
  return {S:late.reduce((a,b)=>a+b,0)/late.length, N:lr.reduce((a,r)=>a+r.N,0)/lr.length, reseeds:rows.at(-1).reseeds||0}; }
// score of one config on one seed (search): log(min(rR, rSH, rDR)), -5 if any arm failed/collapsed
function seedScore(A,seed,ticks,WIN){ const x=S(A.X,seed,ticks,WIN), r=S(A.R,seed,ticks,WIN), sh=S(A.SH,seed,ticks,WIN), dr=S(A.DR,seed,ticks,WIN), d0=S(REF.D,seed,ticks,WIN), dr0=S(REF.DRIFT,seed,ticks,WIN), b=S(REF.BASE,seed,ticks,WIN);
  if(!x||!r||!sh||!dr||!d0||!dr0||!b)return {score:-5,why:'run failed',x,r,sh,dr,d0,dr0};
  if([x,r,sh,dr].some(z=>z.reseeds>0||z.N<0.5*b.N))return {score:-5,why:'collapse',x,r,sh,dr,d0,dr0};
  const rR=(x.S+1)/(r.S+1), rSH=(x.S+1)/(sh.S+1), rDR=((x.S+1)/(d0.S+1))/((dr.S+1)/(dr0.S+1));
  const sc=Math.log(Math.min(rR,rSH,rDR)); if(!Number.isFinite(sc))return {score:-5,why:'metric undefined',x,r,sh,dr,d0,dr0};
  return {score:sc,rR,rSH,rDR,x,r,sh,dr,d0,dr0}; }
async function evalCfgs(cfgs,seeds){ const ps=[]; for(const s of seeds){ for(const o of Object.values(REF))ps.push(runOne(o,s,T_S)); for(const c of cfgs){ const A=arms(c.gene); for(const k of ['X','R','SH','DR'])ps.push(runOne(A[k],s,T_S)); } } await Promise.all(ps);
  for(const c of cfgs){ c.seeds=c.seeds||{}; for(const s of seeds)c.seeds[s]=seedScore(arms(c.gene),s,T_S,WIN_S); const v=Object.values(c.seeds).map(z=>z.score); c.score=v.reduce((a,b)=>a+b,0)/v.length; c.nSeeds=v.length; } }
// ---------------- bookkeeping ----------------
function commit(msg){ if(TEST)return; try{ execSync(`git add lab/sticky/trial lab/STICKY-SEARCH.md && git commit -qm "${msg}" && (git push -q origin cos/sticky-search || true)`,{cwd:REPO,stdio:'ignore'}); }catch(e){} }
const f3=v=>Number.isFinite(v)?v.toFixed(3):'-';
function dump(name,cfgs){ const L=['id | score (mean log min-ratio) | seeds | knobs on | per seed: score [S X / R / SH / DR ; ref D / DRIFT]'];
  for(const c of [...cfgs].sort((a,b)=>b.score-a.score)) L.push(`${c.id} | ${f3(c.score)} | ${c.nSeeds} | ${knobDesc(c.gene)} | `+Object.entries(c.seeds).map(([s,z])=>`${s}: ${f3(z.score)}${z.why?' '+z.why:''} [${['x','r','sh','dr','d0','dr0'].map(k=>z[k]?z[k].S.toFixed(2):'-').join(' / ')}]`).join(' ; '));
  fs.writeFileSync(path.join(TR,name+'.tsv'),L.join('\n')+'\n'); fs.writeFileSync(path.join(TR,'configs.json'),JSON.stringify(ALL.map(c=>({id:c.id,gene:c.gene,score:c.score,nSeeds:c.nSeeds,knobs:knobVals(c.gene)})),null,0)); }
const knobDesc=g=>{ const {W,O}=knobVals(g); const s=JSON.stringify({...W,...O}); return s==='{}'?'(defaults = D)':s; };
// ---------------- the search (deterministic) ----------------
const ALL=[]; const rng=mulberry32(20261004);
function lhs(n){ const G=[]; for(let i=0;i<n;i++)G.push(new Array(NG)); for(let d=0;d<NG;d++){ const perm=[...Array(n).keys()]; for(let i=n-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [perm[i],perm[j]]=[perm[j],perm[i]]; } for(let i=0;i<n;i++)G[i][d]=(perm[i]+rng())/n; } return G; }
function child(par){ const w=par.map((_,i)=>par.length-i), z=w.reduce((a,b)=>a+b,0); const pick=()=>{ let x=rng()*z; for(let i=0;i<par.length;i++){ x-=w[i]; if(x<=0)return par[i]; } return par[0]; };
  const a=pick(); let g=a.gene.slice(); if(rng()<0.5){ const b=pick(); g=g.map((v,i)=>rng()<0.5?v:b.gene[i]); }
  let i=0; for(const k of KN){ if(rng()<0.1)g[i]=g[i]<k.pOn?Math.min(0.999,k.pOn+rng()*(1-k.pOn)):rng()*k.pOn; i++; const nv=1+(k.t==='vec4'?3:0); for(let j=0;j<nv;j++,i++) if(rng()<0.25)g[i]=Math.min(0.999,Math.max(0,g[i]+0.15*(rng()+rng()+rng()-1.5)*1.41)); }
  return g; }
async function main(){ log('search start, pid',process.pid);
  // Phase A: LHS
  const g0=new Array(NG).fill(0.999); ALL.push({id:'c000',gene:g0}); lhs(N_LHS).forEach((g,i)=>ALL.push({id:'c'+String(i+1).padStart(3,'0'),gene:g}));
  await evalCfgs(ALL,[201,202]); dump('phaseA',ALL); log('phase A done'); commit('sticky-search: phase A (LHS, 56 configs x seeds 201-202) done');
  // Phase B: successive halving
  const B=[...ALL].sort((a,b)=>b.score-a.score).slice(0,N_HALF); await evalCfgs(B,[203,204]); dump('phaseB',B); log('phase B done'); commit('sticky-search: phase B (top 14 x seeds 203-204) done');
  // Phase C: evolutionary step from the top 6 (4-seed score)
  const par=[...B].sort((a,b)=>b.score-a.score).slice(0,N_PAR); const C=[]; for(let i=0;i<N_CHILD;i++)C.push({id:'e'+String(i+1).padStart(3,'0'),gene:child(par)}); ALL.push(...C);
  await evalCfgs(C,[201,202]); const Cu=[...C].sort((a,b)=>b.score-a.score).slice(0,N_CHILD_UP); await evalCfgs(Cu,[203,204]); dump('phaseC',C); log('phase C done'); commit('sticky-search: phase C (14 children, top 4 to 4 seeds) done');
  // Phase D: final 6 by 4-seed score get seeds 205-206; top 3 (6-seed score, excluding the defaults c000) go to held-out
  const pool=ALL.filter(c=>c.nSeeds===4).sort((a,b)=>b.score-a.score).slice(0,N_FINAL); await evalCfgs(pool,[205,206]); dump('phaseD',pool);
  const top=pool.filter(c=>c.id!=='c000').sort((a,b)=>b.score-a.score).slice(0,N_TOP); fs.writeFileSync(path.join(TR,'top3.json'),JSON.stringify(top.map(c=>({id:c.id,score:c.score,gene:c.gene,arms:arms(c.gene)})),null,1));
  log('search done; top3',top.map(c=>c.id+' '+f3(c.score)).join(', ')); commit('sticky-search: search done, top 3 = '+top.map(c=>c.id).join(' '));
  await heldout(top); }
// ---------------- held-out confirmation (pre-registered bar) ----------------
// For each of the top 3 configs, at 450k on held-out seeds 301-303 (never used in the search), metric S with 10k windows:
//  (1) on >= 2 of 3 seeds: S_X > S_R and S_X > S_SH and (S_X - S_Dref) > (S_DR - S_DRref);
//  (2) relative stickiness >= 1.10: min( (mX+1)/(mR+1), (mX+1)/(mSH+1), [(mX+1)/(mDref+1)] / [(mDR+1)/(mDRref+1)] ) >= 1.10, m = mean S over seeds;
//  (3) no collapse: no arm reseeds and every arm's late N >= 50% of BASE's, on every seed.
// A config that meets all three is a CANDIDATE: it must be re-confirmed on fresh seeds 401-403 before any claim (3 configs were tested).
async function heldout(top){ const ps=[]; for(const s of HELDOUT_SEEDS){ for(const o of Object.values(REF))ps.push(runOne(o,s,T_H)); for(const c of top){ const A=arms(c.gene); for(const k of ['X','R','SH','DR'])ps.push(runOne(A[k],s,T_H)); } } await Promise.all(ps);
  const L=['# held-out confirmation, 450k, seeds 301-303, S with 10k windows (late third)']; const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  for(const c of top){ const A=arms(c.gene); let wins=0, col=[]; const m={X:[],R:[],SH:[],DR:[],D0:[],DR0:[]};
    for(const s of HELDOUT_SEEDS){ const g=o=>S(o,s,T_H,WIN_H); const x=g(A.X), r=g(A.R), sh=g(A.SH), dr=g(A.DR), d0=g(REF.D), dr0=g(REF.DRIFT), b=g(REF.BASE);
      if(!x||!r||!sh||!dr||!d0||!dr0||!b){ col.push(`seed ${s} missing/failed run`); continue; }
      for(const [k,z] of [['X',x],['R',r],['SH',sh],['DR',dr]]) if(z.reseeds>0||z.N<0.5*b.N)col.push(`${k} ${s} collapse (N ${z.N.toFixed(0)} vs BASE ${b.N.toFixed(0)}, reseeds ${z.reseeds})`);
      const ok=x.S>r.S&&x.S>sh.S&&(x.S-d0.S)>(dr.S-dr0.S); if(ok)wins++; m.X.push(x.S); m.R.push(r.S); m.SH.push(sh.S); m.DR.push(dr.S); m.D0.push(d0.S); m.DR0.push(dr0.S);
      L.push(`${c.id} seed ${s}: S X ${x.S.toFixed(2)} | R ${r.S.toFixed(2)} | SH ${sh.S.toFixed(2)} | DR ${dr.S.toFixed(2)} | ref D ${d0.S.toFixed(2)} | ref DRIFT ${dr0.S.toFixed(2)} | beats all ${ok?'yes':'no'}`); }
    const q=k=>mean(m[k])+1, rel=m.X.length?Math.min(q('X')/q('R'),q('X')/q('SH'),(q('X')/q('D0'))/(q('DR')/q('DR0'))):NaN;
    const pass=wins>=2&&rel>=1.10&&!col.length; L.push(`${c.id} ${knobDesc(c.gene)}: (1) seeds beating all nulls ${wins}/3 ${wins>=2?'PASS':'FAIL'} | (2) relative stickiness ${f3(rel)} ${rel>=1.10?'PASS':'FAIL'} | (3) collapse ${col.length?col.join('; ')+' FAIL':'none PASS'} => ${pass?'CANDIDATE (re-confirm on seeds 401-403)':'NO-GO'}`); }
  fs.writeFileSync(path.join(TR,'heldout.txt'),L.join('\n')+'\n');
  if(!TEST)fs.appendFileSync(path.join(REPO,'lab/STICKY-SEARCH.md'),`\n### Held-out confirmation result (appended by search.js ${new Date().toLocaleString('en-GB',{timeZone:'Europe/London'})} BST)\n\`\`\`\n${L.join('\n')}\n\`\`\`\n`);
  log('held-out done'); commit('sticky-search: held-out confirmation done'); }
// ---------------- re-confirmation of a CANDIDATE on seeds 401-403 (same bar as held-out; not chained) ----------------
// Invoked with MODE=reconfirm. Uses identical nulls, S metric, and pass rule as heldout(). Does not alter the bar or c055.
const RECONFIRM_SEEDS=[401,402,403];
async function reconfirm(){
  const top=JSON.parse(fs.readFileSync(path.join(TR,'top3.json'),'utf8'));
  const c055=top.find(c=>c.id==='c055');
  if(!c055){ log('ERROR: c055 missing from top3.json'); process.exit(1); }
  log('reconfirm start: c055 on seeds 401-403 (pre-registered bar), pid',process.pid);
  // --- pre-registered re-check of c055 (identical to heldout) ---
  const ps=[]; for(const s of RECONFIRM_SEEDS){ for(const o of Object.values(REF))ps.push(runOne(o,s,T_H)); const A=arms(c055.gene); for(const k of ['X','R','SH','DR'])ps.push(runOne(A[k],s,T_H)); }
  await Promise.all(ps);
  const L=['# re-confirmation of c055, 450k, seeds 401-403, S with 10k windows (late third) — identical bar to held-out'];
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  { const c=c055; const A=arms(c.gene); let wins=0, col=[]; const m={X:[],R:[],SH:[],DR:[],D0:[],DR0:[]};
    for(const s of RECONFIRM_SEEDS){ const g=o=>S(o,s,T_H,WIN_H); const x=g(A.X), r=g(A.R), sh=g(A.SH), dr=g(A.DR), d0=g(REF.D), dr0=g(REF.DRIFT), b=g(REF.BASE);
      if(!x||!r||!sh||!dr||!d0||!dr0||!b){ col.push(`seed ${s} missing/failed run`); continue; }
      for(const [k,z] of [['X',x],['R',r],['SH',sh],['DR',dr]]) if(z.reseeds>0||z.N<0.5*b.N)col.push(`${k} ${s} collapse (N ${z.N.toFixed(0)} vs BASE ${b.N.toFixed(0)}, reseeds ${z.reseeds})`);
      const ok=x.S>r.S&&x.S>sh.S&&(x.S-d0.S)>(dr.S-dr0.S); if(ok)wins++; m.X.push(x.S); m.R.push(r.S); m.SH.push(sh.S); m.DR.push(dr.S); m.D0.push(d0.S); m.DR0.push(dr0.S);
      L.push(`${c.id} seed ${s}: S X ${x.S.toFixed(2)} | R ${r.S.toFixed(2)} | SH ${sh.S.toFixed(2)} | DR ${dr.S.toFixed(2)} | ref D ${d0.S.toFixed(2)} | ref DRIFT ${dr0.S.toFixed(2)} | beats all ${ok?'yes':'no'}`); }
    const q=k=>mean(m[k])+1, rel=m.X.length?Math.min(q('X')/q('R'),q('X')/q('SH'),(q('X')/q('D0'))/(q('DR')/q('DR0'))):NaN;
    const pass=wins>=2&&rel>=1.10&&!col.length;
    const verdict=pass?'GO (re-confirmed)':'NO-GO';
    L.push(`${c.id} ${knobDesc(c.gene)}: (1) seeds beating all nulls ${wins}/3 ${wins>=2?'PASS':'FAIL'} | (2) relative stickiness ${f3(rel)} ${rel>=1.10?'PASS':'FAIL'} | (3) collapse ${col.length?col.join('; ')+' FAIL':'none PASS'} => ${verdict}`);
    fs.writeFileSync(path.join(TR,'reconfirm.txt'),L.join('\n')+'\n');
    if(!TEST)fs.appendFileSync(path.join(REPO,'lab/STICKY-SEARCH.md'),`\n### Re-confirmation of c055 on seeds 401-403 (appended ${new Date().toLocaleString('en-GB',{timeZone:'Europe/London'})} BST)\n\`\`\`\n${L.join('\n')}\n\`\`\`\n`);
    log('c055 reconfirm =>',verdict); commit('sticky-search: c055 reconfirm on 401-403 => '+verdict);
  }
  // --- EXPLORATORY / post-hoc (NOT part of the verdict): e003 without CH_AWAY on 401-403 ---
  const e003=top.find(c=>c.id==='e003');
  if(e003){
    log('EXPLORATORY: e003 without CH_AWAY on 401-403 (post-hoc; not part of c055 verdict)');
    const A0=arms(e003.gene);
    // strip CH_AWAY from operator-bearing arms; R and world knobs unchanged
    const strip=o=>{ const x={...o}; delete x.CH_AWAY; return x; };
    const Ax={X:strip(A0.X), R:A0.R, SH:strip(A0.SH), DR:strip(A0.DR)};
    const ps2=[]; for(const s of RECONFIRM_SEEDS){ for(const o of Object.values(REF))ps2.push(runOne(o,s,T_H)); for(const k of ['X','R','SH','DR'])ps2.push(runOne(Ax[k],s,T_H)); }
    await Promise.all(ps2);
    const LE=['# EXPLORATORY / post-hoc: e003 without CH_AWAY, 450k, seeds 401-403 (NOT part of the pre-registered verdict)'];
    let wins=0, col=[]; const m={X:[],R:[],SH:[],DR:[],D0:[],DR0:[]};
    for(const s of RECONFIRM_SEEDS){ const g=o=>S(o,s,T_H,WIN_H); const x=g(Ax.X), r=g(Ax.R), sh=g(Ax.SH), dr=g(Ax.DR), d0=g(REF.D), dr0=g(REF.DRIFT), b=g(REF.BASE);
      if(!x||!r||!sh||!dr||!d0||!dr0||!b){ col.push(`seed ${s} missing/failed run`); continue; }
      for(const [k,z] of [['X',x],['R',r],['SH',sh],['DR',dr]]) if(z.reseeds>0||z.N<0.5*b.N)col.push(`${k} ${s} collapse (N ${z.N.toFixed(0)} vs BASE ${b.N.toFixed(0)}, reseeds ${z.reseeds})`);
      const ok=x.S>r.S&&x.S>sh.S&&(x.S-d0.S)>(dr.S-dr0.S); if(ok)wins++; m.X.push(x.S); m.R.push(r.S); m.SH.push(sh.S); m.DR.push(dr.S); m.D0.push(d0.S); m.DR0.push(dr0.S);
      LE.push(`e003-noCH_AWAY seed ${s}: S X ${x.S.toFixed(2)} | R ${r.S.toFixed(2)} | SH ${sh.S.toFixed(2)} | DR ${dr.S.toFixed(2)} | ref D ${d0.S.toFixed(2)} | ref DRIFT ${dr0.S.toFixed(2)} | beats all ${ok?'yes':'no'}`); }
    const q=k=>mean(m[k])+1, rel=m.X.length?Math.min(q('X')/q('R'),q('X')/q('SH'),(q('X')/q('D0'))/(q('DR')/q('DR0'))):NaN;
    const pass=wins>=2&&rel>=1.10&&!col.length;
    LE.push(`e003-noCH_AWAY ${JSON.stringify({...A0.W,...strip(A0.O)})}: (1) seeds beating all nulls ${wins}/3 ${wins>=2?'PASS':'FAIL'} | (2) relative stickiness ${f3(rel)} ${rel>=1.10?'PASS':'FAIL'} | (3) collapse ${col.length?col.join('; ')+' FAIL':'none PASS'} => ${pass?'would-pass bar (EXPLORATORY only)':'would-fail bar (EXPLORATORY only)'}`);
    fs.writeFileSync(path.join(TR,'reconfirm-exploratory-e003-noCH.txt'),LE.join('\n')+'\n');
    if(!TEST)fs.appendFileSync(path.join(REPO,'lab/STICKY-SEARCH.md'),`\n### EXPLORATORY / post-hoc: e003 without CH_AWAY on 401-403 (appended ${new Date().toLocaleString('en-GB',{timeZone:'Europe/London'})} BST)\n**Not part of the pre-registered c055 verdict.**\n\`\`\`\n${LE.join('\n')}\n\`\`\`\n`);
    log('EXPLORATORY e003-noCH_AWAY =>', pass?'would-pass':'would-fail'); commit('sticky-search: EXPLORATORY e003-noCH_AWAY on 401-403');
  }
  log('reconfirm all done');
}
if(require.main===module){
  const mode=process.env.MODE||'search';
  (mode==='reconfirm'?reconfirm():main()).catch(e=>{ log('ERROR',e.stack); process.exit(1); });
}
module.exports={KN,knobVals,arms,REF,lhs,NG,reconfirm};
