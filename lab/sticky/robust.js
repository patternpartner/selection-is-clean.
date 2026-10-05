// lab/sticky/robust.js - STICKY-ROBUST (lab/STICKY-ROBUST.md): pre-registered overnight ROBUSTNESS-REWARDING adaptive search around
// c055 / e003-noCH_AWAY (RENEW on, 6 continuous knobs), scored by a LOW QUANTILE of the matched-null seed score over search seeds
// 701-706 x a fresh +/-12.5% jitter of the config's own knobs per evaluation; then, chained automatically, the held-out confirmation
// of the top 3 at 450k on unseen seeds 801-803 + (for configs that clear the centre bar) the 12-nudge (+/-25%) mini-check at 100k.
// Everything that decides is fixed in this file and in the doc BEFORE launch.
// RESUMABLE: every run is a file named by sha1(opts|seed|ticks) under ROOT; .done/.fail runs are never redone; 450k runs are split in
// 150k segments with exact full-state checkpoints (lab/sticky/fullsave.js, identity-checked on cos/sticky-longrun). All decisions are
// a deterministic function of the finished runs, so a relaunch makes exactly the same decisions. After a box restart:
//   bash /home/box/wt/sticky-robust/lab/sticky/launch-robust.sh     (idempotent; also starts the watcher)
'use strict';
const fs=require('fs'), path=require('path'), crypto=require('crypto'), {spawn,execSync}=require('child_process');
const TEST=process.env.TEST==='1';   // TEST=1: tiny dry run (ROOT /tmp/srb-test, tiny ticks, no git, no doc) to check plumbing only
const REPO=path.resolve(__dirname,'../..'), ROOT=TEST?'/tmp/srb-test':'/home/box/sticky-runs-rb', TR=TEST?'/tmp/srb-test/trial':path.join(REPO,'lab/sticky/trial-rb');
const DOC=path.join(REPO,'lab/STICKY-ROBUST.md'), BRANCH='cos/sticky-robust', P=+(process.env.P||8);
// ---------------- fixed design ----------------
const SEARCH_SEEDS=[701,702,703,704,705,706], CONF_SEEDS=[801,802,803];   // never used before (201-206, 301-303, 401-403, 501-503; 601-603 reserved)
const EVERY=1000;
const T_S=TEST?6000:100000, WIN_S=TEST?1:5;                     // search runs: 100k ticks, 5k windows (as STICKY-SEARCH)
const T_C=TEST?12000:450000, WIN_C=TEST?1:10, SEG_C=TEST?4000:150000;   // confirmation centre: 450k, 10k windows (original bar)
const T_N=TEST?6000:100000, WIN_N=TEST?1:5;                     // mini-nudge check: 100k, 5k windows
const TIMEOUT_1=TEST?120e3:1800e3, TIMEOUT_SEG=TEST?120e3:7200e3, MAX_TRY=3;
const N_HAND=5, N_LHS=TEST?2:7, N_PAR=4, N_CHILD=TEST?2:8, N_FINAL=TEST?3:6, N_TOP=3;
const JIT=0.125;                                                // jitter: each knob x U(1-JIT, 1+JIT), fresh per (config, seed)
fs.mkdirSync(ROOT,{recursive:true}); fs.mkdirSync(TR,{recursive:true});
const now=()=>new Date().toLocaleString('en-GB',{timeZone:'Europe/London'})+' BST';
const log=(...a)=>console.log(`${now()} ${a.join(' ')}`);
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const sig=v=>+(+v).toPrecision(3);
// search space: 6 knobs, log-uniform; RENEW is ON in every config. W = world knob (moves the in-world RANDCAP null too), O = operator knob.
const KN=[
  {n:'RN_CAP',  g:'W',lo:9,     hi:20},      // c055 18.1; -25% (13.6) passed, +25% (22.6) failed on 501-503 -> wider downward
  {n:'BODY_MUT',g:'O',lo:0.014, hi:0.04},    // c055 0.02, e003-noCH 0.0158; +25% passed -> wider upward
  {n:'BODY_CAP',g:'O',lo:0.04,  hi:0.1},     // c055 0.0456; +25% passed 3/3, -25% failed -> wider upward
  {n:'BODY_DEL',g:'O',lo:0.0026,hi:0.004},   // c055 0.00319; both directions failed -> kept narrow
  {n:'BODY_MQ', g:'O',lo:0.22,  hi:0.55},    // c055 0.255; +25% passed -> wider upward
  {n:'CH_LEN',  g:'O',lo:2.5,   hi:4.2},     // c055 2.77, e003-noCH 2.74; +25% (3.46) passed -> wider upward
];
const BASE_O={CHEM:1,HBODY:1,BODY_F:0.05,BODY_MAX:16,BODY_FUSE:0.02};
const REF={D:{...BASE_O,BODY_RCAP:1,CH_LEN:1.5}, DRIFT:{...BASE_O,BODY_RCAP:1,CH_LEN:1.5,BODY_DRIFT:1}, BASE:{CHEM:1}};
function mk(v){ const c={W:{RENEW:1},O:{}}; for(const k of KN)c[k.g][k.n]=sig(v[k.n]); return c; }   // v: {knob: value}
const flat=c=>({...c.W,...c.O});
function arms(c){ const X={...BASE_O,BODY_RCAP:1,CH_LEN:1.5,...c.W,...c.O}; return {X, R:{...BASE_O,...c.W,BODY_RCAP:1}, SH:{...X,BODY_SHUF:1}, DR:{...X,BODY_DRIFT:1}}; }
const toU=(k,v)=>(Math.log(v)-Math.log(k.lo))/(Math.log(k.hi)-Math.log(k.lo)), fromU=(k,u)=>Math.exp(Math.log(k.lo)+Math.min(1,Math.max(0,u))*(Math.log(k.hi)-Math.log(k.lo)));
const C055={RN_CAP:18.1,BODY_MUT:0.02,BODY_CAP:0.0456,BODY_DEL:0.00319,BODY_MQ:0.255,CH_LEN:2.77};
const E003N={RN_CAP:18.1,BODY_MUT:0.0158,BODY_CAP:0.0456,BODY_DEL:0.00319,BODY_MQ:0.255,CH_LEN:2.74};
// hand-placed phase-A points (fixed now): c055, e003-noCH, c055 with all five passing nudges, c055 with half of each, e003-noCH with the passing nudges
const PASSDIR={RN_CAP:0.75,BODY_MUT:1.25,BODY_CAP:1.25,BODY_DEL:1,BODY_MQ:1.25,CH_LEN:1.25};
const scale=(b,f)=>Object.fromEntries(Object.entries(b).map(([k,v])=>[k,v*f(k)]));
const HAND=[
  {id:'h-c055',v:C055},
  {id:'h-e003noCH',v:E003N},
  {id:'h-c055pass',v:scale(C055,k=>PASSDIR[k])},
  {id:'h-c055half',v:scale(C055,k=>1+(PASSDIR[k]-1)/2)},
  {id:'h-e003pass',v:scale(E003N,k=>k==='BODY_MUT'?1:PASSDIR[k])},   // e003-noCH-like: its low BODY_MUT kept, the other passing nudges applied
];
// jitter: deterministic from (config values, seed); each knob x U(1-JIT,1+JIT), 3 s.f.; not clipped to the search box
function jitter(c,seed){ const h=crypto.createHash('sha1').update(JSON.stringify(flat(c))+'|jit|'+seed).digest(); const r=mulberry32(h.readUInt32LE(0));
  const v={}; for(const k of KN)v[k.n]=c[k.g][k.n]*(1-JIT+2*JIT*r()); return mk(v); }
// ---------------- runs (generic: single-segment for 100k, 150k segments with exact checkpoints for 450k) ----------------
const canon=o=>JSON.stringify(Object.keys(o).sort().reduce((a,k)=>(a[k]=o[k],a),{}));
const rid=(o,seed,ticks)=>crypto.createHash('sha1').update(canon(o)+'|'+seed+'|'+ticks).digest('hex').slice(0,14);
const rfile=(o,seed,ticks)=>path.join(ROOT,rid(o,seed,ticks));
const segOf=ticks=>ticks===T_C?SEG_C:ticks;   // only the 450k centre runs are segmented
const rmq=p=>{ try{ fs.unlinkSync(p); }catch(e){} };
function segsDone(f){ let k=0; const b=path.basename(f); for(const x of fs.readdirSync(path.dirname(f))){ const m=x.match(/^(\w+)\.ckpt\.(\d+)$/); if(m&&m[1]===b)k=Math.max(k,+m[2]); } return k; }
function readRows(f,n){ if(!fs.existsSync(f+'.jsonl'))return []; const L=fs.readFileSync(f+'.jsonl','utf8').split('\n').filter(x=>x.startsWith('{')&&x.endsWith('}')); return n===undefined?L:L.slice(0,n); }
let running=0, nFin=0; const queue=[], inflight=new Map(), jobs=new Map();
// prio: 0 = search, 1 = confirmation centre / nudges, 2 = background 450k references (only fill otherwise idle slots)
function runOne(o,seed,ticks,prio){ const f=rfile(o,seed,ticks); if(fs.existsSync(f+'.done')||fs.existsSync(f+'.fail'))return Promise.resolve();
  if(inflight.has(f)){ const j=jobs.get(f); if(j&&queue.includes(j))j.prio=Math.min(j.prio,prio||0); return inflight.get(f); }   // a waiting job asked for at higher priority is promoted
  const p=new Promise(res=>{ const j={o,seed,ticks,f,res,prio:prio||0}; jobs.set(f,j); queue.push(j); pump(); }); inflight.set(f,p); return p; }
function pump(){ while(running<P&&queue.length){ let bi=0; for(let i=1;i<queue.length;i++)if(queue[i].prio<queue[bi].prio)bi=i; const j=queue.splice(bi,1)[0]; running++;
    drive(j).catch(e=>{ log('ERROR drive',j.f,e.stack); fs.writeFileSync(j.f+'.fail','error '+e.message+'\n'); }).finally(()=>{ running--; nFin++; if(nFin%40===0)commit(`sticky-robust: progress (${nFin} runs finished this session)`); j.res(); pump(); }); } }
function seg(j,k,nSeg){ return new Promise(res=>{ const f=j.f, S=segOf(j.ticks), ck=`${f}.ckpt.${k}`, tmp=`${f}.ckpt.${k+1}.tmp`, last=nSeg===1;
    const out=fs.openSync(f+'.jsonl','a'), err=fs.openSync(f+'.err','a');
    const env={...process.env,SEED:String(j.seed),TICKS:String(S),EVERY:String(EVERY),OPTS:canon(j.o)}; if(!last)env.SAVE=tmp; if(k>0)env.LOAD=ck;
    const ch=spawn('node',[path.join(REPO,'lab/sticky/seg-run.js')],{cwd:REPO,env,stdio:['ignore',out,err]}); let to=false;
    const tm=setTimeout(()=>{ to=true; ch.kill('SIGKILL'); },nSeg===1?TIMEOUT_1:TIMEOUT_SEG);
    ch.on('exit',code=>{ clearTimeout(tm); fs.closeSync(out); fs.closeSync(err); res({ok:!to&&code===0&&(last||fs.existsSync(tmp)),to,code}); }); }); }
async function drive(j){ const f=j.f, S=segOf(j.ticks), nSeg=j.ticks/S, per=S/EVERY; fs.writeFileSync(f+'.opts',canon(j.o)+` seed ${j.seed} ticks ${j.ticks} seg ${S}\n`);
  let tries=0, done1=false;
  while(true){ const k=nSeg===1?(done1?1:0):segsDone(f);
    if(k>=nSeg){ fs.writeFileSync(f+'.done',''); for(let i=0;i<=nSeg;i++)rmq(`${f}.ckpt.${i}`); return; }
    const keep=readRows(f,k*per); if(keep.length!==k*per){ log('inconsistent rows, restarting run from 0:',f); for(let i=0;i<=nSeg;i++)rmq(`${f}.ckpt.${i}`); fs.writeFileSync(f+'.jsonl',''); continue; }
    fs.writeFileSync(f+'.jsonl',keep.length?keep.join('\n')+'\n':''); rmq(`${f}.ckpt.${k+1}.tmp`);
    const r=await seg(j,k,nSeg); const n=readRows(f).length;
    if(r.ok&&n===(k+1)*per){ if(nSeg===1)done1=true; else { fs.renameSync(`${f}.ckpt.${k+1}.tmp`,`${f}.ckpt.${k+1}`); rmq(`${f}.ckpt.${k}`); } tries=0; continue; }
    tries++; log(`segment ${k+1}/${nSeg} of ${path.basename(f)} failed (timeout ${r.to}, code ${r.code}, rows ${n}); try ${tries}/${MAX_TRY}`);
    if(tries>=MAX_TRY){ fs.writeFileSync(f+'.fail',`segment ${k+1} failed ${tries}x (timeout ${r.to}, code ${r.code})\n`); return; } } }
// ---------------- metric (identical to STICKY-SEARCH / STICKY-LONGRUN) ----------------
function S(o,seed,ticks,WIN){ const f=rfile(o,seed,ticks); if(!fs.existsSync(f+'.done'))return null; const rows=readRows(f).map(JSON.parse); if(rows.length!==ticks/EVERY)return null;
  const nW=Math.floor(rows.length/WIN), used=[];
  for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), inc=new Map(), car=new Map();
    for(const r of W){ const b=r.body||{}; for(const [k,v] of (b.bU||[]))inc.set(k,(inc.get(k)||0)+v/W.length); for(const [k,v] of (b.bC||[]))car.set(k,(car.get(k)||0)+v/W.length); }
    used.push(new Set([...[...inc].filter(([k,v])=>v>=0.01).map(([k])=>k),...[...car].filter(([k,v])=>v>=0.01).map(([k])=>k)])); }
  const ever=new Set(), st=[]; for(let w=0;w<nW-2;w++){ const n=[...used[w]].filter(k=>!ever.has(k)); n.forEach(k=>ever.add(k)); st.push(n.filter(k=>used[w+2].has(k)).length); }
  const E=st.length, th=Math.floor(E/3), late=st.slice(E-th,E), lr=rows.slice(Math.floor(rows.length*2/3));
  return {S:late.reduce((a,b)=>a+b,0)/late.length, N:lr.reduce((a,r)=>a+r.N,0)/lr.length, reseeds:rows.at(-1).reseeds||0}; }
// seed score (search): log(min(rR, rSH, rDR)); -5 if any arm failed, collapsed (reseeds, or late N < 50% of BASE) or metric undefined
function seedScore(c,seed){ const A=arms(c), g=o=>S(o,seed,T_S,WIN_S); const x=g(A.X), r=g(A.R), sh=g(A.SH), dr=g(A.DR), d0=g(REF.D), dr0=g(REF.DRIFT), b=g(REF.BASE);
  if(!x||!r||!sh||!dr||!d0||!dr0||!b)return {score:-5,why:'run failed',x,r,sh,dr,d0,dr0};
  if([x,r,sh,dr].some(z=>z.reseeds>0||z.N<0.5*b.N))return {score:-5,why:'collapse',x,r,sh,dr,d0,dr0};
  const rR=(x.S+1)/(r.S+1), rSH=(x.S+1)/(sh.S+1), rDR=((x.S+1)/(d0.S+1))/((dr.S+1)/(dr0.S+1)), sc=Math.log(Math.min(rR,rSH,rDR));
  if(!Number.isFinite(sc))return {score:-5,why:'metric undefined',x,r,sh,dr,d0,dr0}; return {score:sc,rR,rSH,rDR,x,r,sh,dr,d0,dr0}; }
// ROBUST score over n evaluations (each = one search seed x one fresh jitter): the r-th worst, r = max(1, floor(n/3)) -> n=2: worst, n=6: 2nd worst.
// Ties broken by the mean over the evaluations.
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN;
function robust(c){ const v=Object.values(c.ev).map(z=>z.score).sort((a,b)=>a-b), r=Math.max(1,Math.floor(v.length/3)); c.q=v[r-1]; c.mean=mean(v); c.n=v.length; return c; }
const byQ=(a,b)=>(b.q-a.q)||(b.mean-a.mean)||(a.id<b.id?-1:1);
async function evalCfgs(cfgs,seeds){ const ps=[]; for(const s of seeds){ for(const o of Object.values(REF))ps.push(runOne(o,s,T_S,0)); for(const c of cfgs){ const A=arms(jitter(c.c,s)); for(const k of ['X','R','SH','DR'])ps.push(runOne(A[k],s,T_S,0)); } }
  await Promise.all(ps); for(const c of cfgs){ c.ev=c.ev||{}; for(const s of seeds){ const jc=jitter(c.c,s); c.ev[s]={...seedScore(jc,s),jit:flat(jc)}; } robust(c); } }
// ---------------- bookkeeping ----------------
function commit(msg){ if(TEST)return; try{ execSync(`git add lab/sticky/trial-rb lab/STICKY-ROBUST.md && git commit -qm "${msg}" && (git push -q origin ${BRANCH} || true)`,{cwd:REPO,stdio:'ignore'}); }catch(e){} }
function appendDoc(title,body){ if(TEST){ fs.appendFileSync(path.join(TR,'doc-append.md'),`\n### ${title}\n${body}\n`); return; } fs.appendFileSync(DOC,`\n### ${title} (appended by robust.js ${now()})\n${body}\n`); }
const f2=v=>Number.isFinite(v)?v.toFixed(2):'-', f3=v=>Number.isFinite(v)?v.toFixed(3):'-';
const ALL=[];
function dump(name,cfgs){ const L=['id | robust score q (r-th worst log min-ratio) | mean | n evals | knobs | per eval: seed: score [S X / R / SH / DR ; ref D / DRIFT] jitter'];
  for(const c of [...cfgs].sort(byQ)) L.push(`${c.id} | ${f3(c.q)} | ${f3(c.mean)} | ${c.n} | ${JSON.stringify(flat(c.c))} | `+Object.entries(c.ev).map(([s,z])=>`${s}: ${f3(z.score)}${z.why?' '+z.why:''} [${['x','r','sh','dr','d0','dr0'].map(k=>z[k]?z[k].S.toFixed(2):'-').join(' / ')}] ${JSON.stringify(z.jit)}`).join(' ; '));
  fs.writeFileSync(path.join(TR,name+'.tsv'),L.join('\n')+'\n'); fs.writeFileSync(path.join(TR,'configs.json'),JSON.stringify(ALL.map(c=>({id:c.id,cfg:flat(c.c),q:c.q,mean:c.mean,n:c.n,from:c.from||null})),null,0)); }
// ---------------- the search (deterministic) ----------------
const rng=mulberry32(20261005);
function lhs(n){ const G=[]; for(let i=0;i<n;i++)G.push({}); for(const k of KN){ const perm=[...Array(n).keys()]; for(let i=n-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [perm[i],perm[j]]=[perm[j],perm[i]]; } for(let i=0;i<n;i++)G[i][k.n]=fromU(k,(perm[i]+rng())/n); } return G; }
const gauss=()=>{ let u=0; for(let i=0;i<6;i++)u+=rng(); return (u-3)/Math.sqrt(0.5); };   // ~N(0,1)
function child(par){ const w=par.map((_,i)=>par.length-i), z=w.reduce((a,b)=>a+b,0); const pick=()=>{ let x=rng()*z; for(let i=0;i<par.length;i++){ x-=w[i]; if(x<=0)return par[i]; } return par[0]; };
  const a=pick(), b=rng()<0.5?pick():null, v={}, from=[a.id];
  if(b&&b!==a)from.push(b.id);
  for(const k of KN){ const src=(b&&rng()<0.5)?b:a; const u=toU(k,src.c[k.g][k.n])+0.1*gauss(); v[k.n]=fromU(k,u); }
  return {c:mk(v),from:from.join('x')}; }
async function search(){
  // Phase A: hand points + LHS on seeds 701-702 (each evaluation jittered)
  const A=[...HAND.map(h=>({id:h.id,c:mk(h.v)})),...lhs(N_LHS).map((v,i)=>({id:'a'+String(i+1).padStart(2,'0'),c:mk(v)}))]; ALL.push(...A);
  await evalCfgs(A,SEARCH_SEEDS.slice(0,2)); dump('phaseA',A); log('phase A done'); commit(`sticky-robust: phase A (${A.length} configs x seeds 701-702, jittered) done`);
  // Phase B: children around the top 4 of A (log-space gaussian step sd 0.1 of the range, 50% uniform crossover), seeds 701-702
  const par=[...A].sort(byQ).slice(0,N_PAR), B=[]; for(let i=0;i<N_CHILD;i++){ const ch=child(par); B.push({id:'b'+String(i+1).padStart(2,'0'),...ch}); } ALL.push(...B);
  await evalCfgs(B,SEARCH_SEEDS.slice(0,2)); dump('phaseB',B); log('phase B done'); commit(`sticky-robust: phase B (${B.length} children x seeds 701-702) done`);
  // Phase C: top 6 of A+B by the 2-eval robust score get seeds 703-706 -> 6 evaluations; rank by 2nd-worst of 6; top 3 -> confirmation
  const pool=[...ALL].sort(byQ).slice(0,N_FINAL); await evalCfgs(pool,SEARCH_SEEDS.slice(2)); dump('phaseC',pool);
  const top=[...pool].sort(byQ).slice(0,N_TOP); fs.writeFileSync(path.join(TR,'top3.json'),JSON.stringify(top.map(c=>({id:c.id,q:c.q,mean:c.mean,cfg:flat(c.c),c:c.c,arms:arms(c.c)})),null,1));
  const L=['# search result: top 6 by robust score (2nd worst of 6 evaluations = seeds 701-706 x own jitter)','id | q (2nd worst) | mean | knobs | per-eval scores']; for(const c of [...pool].sort(byQ))L.push(`${c.id} | ${f3(c.q)} | ${f3(c.mean)} | ${JSON.stringify(flat(c.c))} | ${Object.entries(c.ev).map(([s,z])=>s+':'+f3(z.score)+(z.why?'('+z.why+')':'')).join(' ')}`);
  L.push(`top 3 -> confirmation: ${top.map(c=>c.id).join(', ')}`); fs.writeFileSync(path.join(TR,'search.txt'),L.join('\n')+'\n');
  if(!fs.existsSync(path.join(TR,'search.appended'))||TEST){ appendDoc('Search result',"```\n"+L.join('\n')+"\n```"); fs.writeFileSync(path.join(TR,'search.appended'),now()+'\n'); }
  log('search done; top3',top.map(c=>c.id+' '+f3(c.q)).join(', ')); commit('sticky-robust: search done, top 3 = '+top.map(c=>c.id).join(' '));
  return top; }
// ---------------- confirmation (pre-registered) ----------------
// original bar for one config over CONF_SEEDS at (ticks, WIN): (1) >=2/3 seeds S_X>S_R, S_X>S_SH, (S_X-S_D)>(S_DR-S_DRIFT); (2) rel >= 1.10; (3) no collapse/missing
function bar(c,ticks,WIN){ const A=arms(c); let wins=0; const col=[], m={X:[],R:[],SH:[],DR:[],D0:[],DR0:[]}, lines=[];
  for(const s of CONF_SEEDS){ const g=o=>S(o,s,ticks,WIN); const x=g(A.X), r=g(A.R), sh=g(A.SH), dr=g(A.DR), d0=g(REF.D), dr0=g(REF.DRIFT), b=g(REF.BASE);
    if(!x||!r||!sh||!dr||!d0||!dr0||!b){ col.push(`seed ${s} missing/failed run`); lines.push(`seed ${s}: missing/failed run`); continue; }
    for(const [k,q] of [['X',x],['R',r],['SH',sh],['DR',dr]]) if(q.reseeds>0||q.N<0.5*b.N)col.push(`${k} ${s} collapse (N ${q.N.toFixed(0)} vs BASE ${b.N.toFixed(0)}, reseeds ${q.reseeds})`);
    const ok=x.S>r.S&&x.S>sh.S&&(x.S-d0.S)>(dr.S-dr0.S); if(ok)wins++; m.X.push(x.S); m.R.push(r.S); m.SH.push(sh.S); m.DR.push(dr.S); m.D0.push(d0.S); m.DR0.push(dr0.S);
    lines.push(`seed ${s}: S X ${f2(x.S)} | R ${f2(r.S)} | SH ${f2(sh.S)} | DR ${f2(dr.S)} | ref D ${f2(d0.S)} | ref DRIFT ${f2(dr0.S)} | beats all ${ok?'yes':'no'}`); }
  const q=k=>mean(m[k])+1, rel=m.X.length?Math.min(q('X')/q('R'),q('X')/q('SH'),(q('X')/q('D0'))/(q('DR')/q('DR0'))):NaN;
  return {wins,rel,col,lines,pass:wins>=2&&rel>=1.10&&!col.length}; }
const NUDGE_ORDER=[['RN_CAP',0.75],['BODY_MUT',1.25],['BODY_CAP',0.75],['BODY_DEL',1.25],['BODY_MQ',0.75],['CH_LEN',1.25],    // batch 1
                   ['RN_CAP',1.25],['BODY_MUT',0.75],['BODY_CAP',1.25],['BODY_DEL',0.75],['BODY_MQ',1.25],['CH_LEN',0.75]];   // batch 2
function nudged(c,k,f){ const v=flat(c); v[k]=v[k]*f; return {id:`${k}${f<1?'-':'+'}25%`,knob:k,f,c:mk(v)}; }
function confRuns(c,ticks,prio){ const A=arms(c), ps=[]; for(const s of CONF_SEEDS){ for(const o of Object.values(REF))ps.push(runOne(o,s,ticks,prio)); for(const k of ['X','R','SH','DR'])ps.push(runOne(A[k],s,ticks,prio)); } return Promise.all(ps); }
async function confirmOne(t,rank){ const c=t.c, out={id:t.id,rank,cfg:flat(c)};
  await confRuns(c,T_C,1); out.centre=bar(c,T_C,WIN_C); log(`confirm ${t.id}: centre ${out.centre.wins}/3 rel ${f3(out.centre.rel)} ${out.centre.pass?'PASS':'FAIL'}`);
  out.nudges=NUDGE_ORDER.map(([k,f])=>({...nudged(c,k,f),status:'not run'}));
  if(!out.centre.pass&&!(TEST&&process.env.FORCE_NUDGE==='1')){ out.verdict='NOT ROBUST-GO (centre fails the original bar; nudges not run: verdict already decided)'; return out; }
  const runBatch=async b=>{ const ns=out.nudges.slice(b*6,b*6+6); await Promise.all(ns.map(n=>confRuns(n.c,T_N,1))); for(const n of ns){ n.B=bar(n.c,T_N,WIN_N); n.status=n.B.pass?'PASS':'FAIL'; } };
  await runBatch(0); const fail1=out.nudges.slice(0,6).filter(n=>n.status==='FAIL').length; log(`confirm ${t.id}: nudge batch 1 fails ${fail1}/6`);
  if(fail1>=4&&!(TEST&&process.env.FORCE_NUDGE==='1')){ out.verdict=`NOT ROBUST-GO (centre passes, but ${fail1}/6 batch-1 nudges fail, so >=9/12 is impossible; batch 2 not run: verdict already decided)`; return out; }
  await runBatch(1); const np=out.nudges.filter(n=>n.status==='PASS').length; out.nPass=np;
  out.verdict=np>=9?`ROBUST-GO (centre passes; ${np}/12 nudges pass)`:`NOT ROBUST-GO (centre passes; only ${np}/12 nudges pass, need >= 9)`; return out; }
function report(res){ const L=[`# held-out confirmation: top 3 centre at ${T_C/1e3}k on seeds ${CONF_SEEDS.join(',')} (10k windows, original bar) + mini-nudge check (each knob x0.75 / x1.25, ${T_N/1e3}k, 5k windows, original bar) on the same seeds`];
  for(const o of res){ L.push('',`${o.rank}. ${o.id} ${JSON.stringify(o.cfg)}`,`   centre ${T_C/1e3}k: ${o.centre.wins}/3 seeds beat all nulls, rel ${f3(o.centre.rel)}, ${o.centre.col.length?'collapse/missing: '+o.centre.col.join('; '):'no collapse'} => ${o.centre.pass?'PASS':'FAIL'}`); o.centre.lines.forEach(x=>L.push('      '+x));
    for(const n of o.nudges){ L.push(`   nudge ${n.id} (${n.knob} ${flat(n.c)[n.knob]}): ${n.B?`${n.B.wins}/3, rel ${f3(n.B.rel)}${n.B.col.length?', '+n.B.col.join('; '):''} => ${n.status}`:n.status}`); if(n.B)n.B.lines.forEach(x=>L.push('      '+x)); }
    L.push(`   => ${o.verdict}`); }
  const go=res.filter(o=>o.verdict.startsWith('ROBUST-GO')); L.push('',`SUMMARY: ${go.length?go.map(o=>o.id).join(', ')+' ROBUST-GO':'no config is ROBUST-GO'} (3 configs tested: any ROBUST-GO is a candidate to re-confirm on fresh seeds, not a final claim)`); return L; }
async function main(){ log('robust start, pid',process.pid,'P',P);
  if(fs.existsSync(path.join(TR,'ALL-DONE'))){ log('already complete'); return; }
  const refs=[]; for(const s of CONF_SEEDS)for(const o of Object.values(REF))refs.push(runOne(o,s,T_C,2));   // 450k references: fill idle slots during the search
  const top=await search();
  const res=await Promise.all(top.map((t,i)=>confirmOne(t,i+1))); await Promise.all(refs);
  const L=report(res); fs.writeFileSync(path.join(TR,'confirm.txt'),L.join('\n')+'\n');
  if(!fs.existsSync(path.join(TR,'confirm.appended'))||TEST){ appendDoc('Held-out confirmation result',"```\n"+L.join('\n')+"\n```"); fs.writeFileSync(path.join(TR,'confirm.appended'),now()+'\n'); }
  fs.writeFileSync(path.join(TR,'ALL-DONE'),now()+'\n'); log('all done'); commit('sticky-robust: all done'); }
if(require.main===module) main().catch(e=>{ log('ERROR',e.stack); process.exit(1); });
module.exports={KN,mk,arms,jitter,HAND,REF,nudged,NUDGE_ORDER,flat};
