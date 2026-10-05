// lab/sticky/longrun.js - STICKY-LONGRUN (lab/STICKY-LONGRUN.md): pre-registered (1) open-endedness test of c055 at 1.5M ticks and
// (2) one-at-a-time +/-25% robustness map of c055 (+ the e003-noCH_AWAY arm) at 450k, on unseen seeds 501-503.
// Everything that decides (arms, seeds, ticks, windows, metrics, bars) is fixed in this file and in the doc BEFORE launch.
// RESUMABLE AT SEGMENT GRANULARITY: every run is split into 150k-tick segments; after each segment the full world state is saved
// with lab/sticky/fullsave.js (exact resume, identity-checked in lab/sticky/trial-lr/identity-segments.txt). After a box restart:
//   bash lab/sticky/launch-longrun.sh      (idempotent; also starts the watcher)
'use strict';
const fs=require('fs'), path=require('path'), crypto=require('crypto'), {spawn,execSync}=require('child_process');
const TEST=process.env.TEST==='1';   // TEST=1: tiny dry run (ROOT /tmp/slr-test, 1k-tick segments, no git, no doc) to check plumbing only
const REPO=path.resolve(__dirname,'../..'), ROOT=TEST?'/tmp/slr-test':'/home/box/sticky-runs-lr', TR=TEST?'/tmp/slr-test/trial':path.join(REPO,'lab/sticky/trial-lr');
const DOC=path.join(REPO,'lab/STICKY-LONGRUN.md'), BRANCH='cos/sticky-longrun', P=+(process.env.P||8);
const SEEDS=[501,502,503];                                   // unseen: search used 201-206, held-out 301-303, re-confirm 401-403. 601-603 reserved, unused.
const EVERY=1000, WIN=TEST?1:10;                                    // 1 sample / 1k ticks; 10k-tick windows (as held-out / re-confirm)
const T_LONG=TEST?15000:1500000, T_ROB=TEST?6000:450000, SEG=TEST?3000:150000, SEG_TIMEOUT=TEST?120e3:7200e3, MAX_TRY=3;
fs.mkdirSync(ROOT,{recursive:true}); fs.mkdirSync(TR,{recursive:true});
const now=()=>new Date().toLocaleString('en-GB',{timeZone:'Europe/London'})+' BST';
const log=(...a)=>console.log(`${now()} ${a.join(' ')}`);
// ---------------- arms (identical construction to lab/sticky/search.js) ----------------
const BASE_O={CHEM:1,HBODY:1,BODY_F:0.05,BODY_MAX:16,BODY_FUSE:0.02};
const REF={D:{...BASE_O,BODY_RCAP:1,CH_LEN:1.5}, DRIFT:{...BASE_O,BODY_RCAP:1,CH_LEN:1.5,BODY_DRIFT:1}, BASE:{CHEM:1}};
const C055={W:{RENEW:1,RN_CAP:18.1}, O:{BODY_MUT:0.02,BODY_CAP:0.0456,BODY_DEL:0.00319,BODY_MQ:0.255,CH_LEN:2.77}};   // = top3.json c055 (knobDesc)
const E003NOCH={W:{RENEW:1,RN_CAP:18.1}, O:{BODY_MUT:0.0158,BODY_CAP:0.0456,BODY_DEL:0.00319,BODY_MQ:0.255,CH_LEN:2.74}}; // e003 minus CH_AWAY
function arms(cfg){ const X={...BASE_O,BODY_RCAP:1,CH_LEN:1.5,...cfg.W,...cfg.O}; return {X, R:{...BASE_O,...cfg.W,BODY_RCAP:1}, SH:{...X,BODY_SHUF:1}, DR:{...X,BODY_DRIFT:1}}; }
// robustness nudges: each c055 knob x0.75 and x1.25 (3 significant figures), one at a time. RN_CAP is a WORLD knob (also moves R).
const NUDGE_KNOBS=[['RN_CAP','W'],['BODY_MUT','O'],['BODY_CAP','O'],['BODY_DEL','O'],['BODY_MQ','O'],['CH_LEN','O']];
const VARIANTS=[]; for(const [k,g] of NUDGE_KNOBS) for(const f of [0.75,1.25]){ const c={W:{...C055.W},O:{...C055.O}}; c[g][k]=+(c[g][k]*f).toPrecision(3); VARIANTS.push({id:`${k}${f<1?'-':'+'}25%`,knob:k,f,val:c[g][k],cfg:c}); }
// ---------------- runs (segmented, exact resume) ----------------
const canon=o=>JSON.stringify(Object.keys(o).sort().reduce((a,k)=>(a[k]=o[k],a),{}));
const rid=(o,seed,ticks)=>crypto.createHash('sha1').update(canon(o)+'|'+seed+'|'+ticks).digest('hex').slice(0,14);
const rfile=(o,seed,ticks)=>path.join(ROOT,rid(o,seed,ticks));
function segsDone(f){ let k=0; for(const x of fs.existsSync(path.dirname(f))?fs.readdirSync(path.dirname(f)):[]){ const m=x.match(/^(\w+)\.ckpt\.(\d+)$/); if(m&&m[1]===path.basename(f))k=Math.max(k,+m[2]); } return k; }
function readRows(f,n){ if(!fs.existsSync(f+'.jsonl'))return []; const L=fs.readFileSync(f+'.jsonl','utf8').split('\n').filter(x=>x.startsWith('{')&&x.endsWith('}')); return n===undefined?L:L.slice(0,n); }
let running=0, segCount=0; const queue=[], inflight=new Map();
function runOne(o,seed,ticks){ const f=rfile(o,seed,ticks); if(fs.existsSync(f+'.done')||fs.existsSync(f+'.fail'))return Promise.resolve();
  if(inflight.has(f))return inflight.get(f); const p=new Promise(res=>{ queue.push({o,seed,ticks,f,res}); pump(); }); inflight.set(f,p); return p; }
function pump(){ while(running<P&&queue.length){ const j=queue.shift(); running++; drive(j).catch(e=>{ log('ERROR drive',j.f,e.stack); fs.writeFileSync(j.f+'.fail','error '+e.message+'\n'); }).finally(()=>{ running--; j.res(); pump(); }); } }
function seg(j,k){ return new Promise(res=>{ const f=j.f, ck=`${f}.ckpt.${k}`, tmp=`${f}.ckpt.${k+1}.tmp`;
    const out=fs.openSync(f+'.jsonl','a'), err=fs.openSync(f+'.err','a');
    const env={...process.env,SEED:String(j.seed),TICKS:String(SEG),EVERY:String(EVERY),OPTS:canon(j.o),SAVE:tmp}; if(k>0)env.LOAD=ck;
    const ch=spawn('node',[path.join(REPO,'lab/sticky/seg-run.js')],{cwd:REPO,env,stdio:['ignore',out,err]}); let to=false;
    const tm=setTimeout(()=>{ to=true; ch.kill('SIGKILL'); },SEG_TIMEOUT);
    ch.on('exit',code=>{ clearTimeout(tm); fs.closeSync(out); fs.closeSync(err); res({ok:!to&&code===0&&fs.existsSync(tmp),to,code}); }); }); }
async function drive(j){ const f=j.f, nSeg=j.ticks/SEG; fs.writeFileSync(f+'.opts',canon(j.o)+` seed ${j.seed} ticks ${j.ticks} seg ${SEG}\n`);
  let tries=0;
  while(true){ const k=segsDone(f); if(k>=nSeg){ fs.writeFileSync(f+'.done',''); for(let i=0;i<nSeg;i++)rmq(`${f}.ckpt.${i}`); if(j.ticks!==T_LONG)rmq(`${f}.ckpt.${nSeg}`); return; }
    // truncate the jsonl to exactly the rows of the k finished segments (drops a partial segment from a killed process)
    const keep=readRows(f,k*SEG/EVERY); if(keep.length!==k*SEG/EVERY){ log('inconsistent rows, restarting run from 0:',f); for(let i=0;i<=nSeg;i++)rmq(`${f}.ckpt.${i}`); fs.writeFileSync(f+'.jsonl',''); continue; }
    fs.writeFileSync(f+'.jsonl',keep.length?keep.join('\n')+'\n':''); rmq(`${f}.ckpt.${k+1}.tmp`);
    const r=await seg(j,k); const n=readRows(f).length;
    if(r.ok&&n===(k+1)*SEG/EVERY){ fs.renameSync(`${f}.ckpt.${k+1}.tmp`,`${f}.ckpt.${k+1}`); rmq(`${f}.ckpt.${k}`); tries=0; segCount++;
      if(segCount%40===0)commit(`sticky-longrun: progress (${segCount} segments this session)`); continue; }
    tries++; log(`segment ${k+1}/${nSeg} of ${path.basename(f)} failed (timeout ${r.to}, code ${r.code}, rows ${n}); try ${tries}/${MAX_TRY}`);
    if(tries>=MAX_TRY){ fs.writeFileSync(f+'.fail',`segment ${k+1} failed ${tries}x (timeout ${r.to}, code ${r.code})\n`); return; } } }
const rmq=p=>{ try{ fs.unlinkSync(p); }catch(e){} };
// ---------------- metric ----------------
// used(w): tricks with mean body-income share bU >= 1% or mean carrier share bC >= 1% over window w (10 samples).
// new(w): used(w) and never used in an earlier window. sticky st(w) = |{k in new(w): k in used(w+2)}|, defined for w < nW-2.
function series(rows){ const nW=Math.floor(rows.length/WIN), used=[];
  for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), inc=new Map(), car=new Map();
    for(const r of W){ const b=r.body||{}; for(const [k,v] of (b.bU||[]))inc.set(k,(inc.get(k)||0)+v/W.length); for(const [k,v] of (b.bC||[]))car.set(k,(car.get(k)||0)+v/W.length); }
    used.push(new Set([...[...inc].filter(([k,v])=>v>=0.01).map(([k])=>k),...[...car].filter(([k,v])=>v>=0.01).map(([k])=>k)])); }
  const ever=new Set(), st=[]; for(let w=0;w<nW-2;w++){ const n=[...used[w]].filter(k=>!ever.has(k)); n.forEach(k=>ever.add(k)); st.push(n.filter(k=>used[w+2].has(k)).length); }
  return st; }   // length E = nW-2
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN;
function slope(ys,xs){ const mx=mean(xs), my=mean(ys); let a=0,b=0; for(let i=0;i<xs.length;i++){ a+=(xs[i]-mx)*(ys[i]-my); b+=(xs[i]-mx)**2; } return a/b; }
// stats of one run truncated to `nrows` samples (450k analysis uses the 450-row prefix of a 1.5M run: prefix identity checked)
function stats(rows){ if(!rows||!rows.length)return null; const st=series(rows), E=st.length, th=Math.floor(E/3);
  const late=st.slice(E-th,E), mid=st.slice(E-2*th,E-th), lr=rows.slice(Math.floor(rows.length*2/3));
  const K=[]; st.reduce((a,v)=>(K.push(a+v),a+v),0);                              // cumulative distinct sticky new-used tricks
  const xsL=[...Array(th).keys()].map(i=>E-th+i), Kl=K.slice(E-th,E);
  const qb=Math.floor(th/4), blocks=[0,1,2,3].map(b=>{ const lo=E-th+b*qb, hi=b===3?E-1:E-th+(b+1)*qb-1; return K[hi]-(lo>0?K[lo-1]:0); });  // increments of K in 4 blocks of the late third
  return {S:mean(late), Smid:mean(mid), N:mean(lr.map(r=>r.N)), reseeds:rows.at(-1).reseeds||0, Kend:K[E-1], slopeL:slope(Kl,xsL), blocks, E, th}; }
function runStats(o,seed,ticks,nrows){ const f=rfile(o,seed,ticks); const need=nrows||ticks/EVERY;
  if(!fs.existsSync(f+'.done')&&!(nrows&&segsDone(f)*SEG/EVERY>=nrows))return null; const rows=readRows(f,need).map(JSON.parse); return rows.length===need?stats(rows):null; }
// original bar (held-out / re-confirm), applied to a set of arm stats per seed
function bar(per){ let wins=0; const col=[], m={X:[],R:[],SH:[],DR:[],D0:[],DR0:[]}, lines=[];
  for(const [s,z] of Object.entries(per)){ const {x,r,sh,dr,d0,dr0,b}=z; if(!x||!r||!sh||!dr||!d0||!dr0||!b){ col.push(`seed ${s} missing/failed run`); lines.push(`seed ${s}: missing/failed run`); continue; }
    for(const [k,q] of [['X',x],['R',r],['SH',sh],['DR',dr]]) if(q.reseeds>0||q.N<0.5*b.N)col.push(`${k} ${s} collapse (N ${q.N.toFixed(0)} vs BASE ${b.N.toFixed(0)}, reseeds ${q.reseeds})`);
    const ok=x.S>r.S&&x.S>sh.S&&(x.S-d0.S)>(dr.S-dr0.S); if(ok)wins++; m.X.push(x.S); m.R.push(r.S); m.SH.push(sh.S); m.DR.push(dr.S); m.D0.push(d0.S); m.DR0.push(dr0.S);
    lines.push(`seed ${s}: S X ${x.S.toFixed(2)} | R ${r.S.toFixed(2)} | SH ${sh.S.toFixed(2)} | DR ${dr.S.toFixed(2)} | ref D ${d0.S.toFixed(2)} | ref DRIFT ${dr0.S.toFixed(2)} | beats all ${ok?'yes':'no'}`); }
  const q=k=>mean(m[k])+1, rel=m.X.length?Math.min(q('X')/q('R'),q('X')/q('SH'),(q('X')/q('D0'))/(q('DR')/q('DR0'))):NaN;
  return {wins,rel,col,lines,pass:wins>=2&&rel>=1.10&&!col.length}; }
const f2=v=>Number.isFinite(v)?v.toFixed(2):'-', f3=v=>Number.isFinite(v)?v.toFixed(3):'-';
function perSeed(cfg,ticks,nrows){ const A=arms(cfg), per={}; for(const s of SEEDS){ const g=(o,t,n)=>runStats(o,s,t,n);
    per[s]={x:g(A.X,ticks,nrows), r:g(A.R,ticks,nrows), sh:g(A.SH,ticks,nrows), dr:g(A.DR,ticks,nrows), d0:g(REF.D,T_LONG,ticks===T_LONG?undefined:nrows), dr0:g(REF.DRIFT,T_LONG,ticks===T_LONG?undefined:nrows), b:g(REF.BASE,T_LONG,ticks===T_LONG?undefined:nrows)}; } return per; }
// where a 450k arm is identical to a test-1 arm (c055 centre, shared R, refs), the 450-row prefix of the 1.5M run is used, not a rerun
function robArm(o,seed){ return isLongArm(o)?{o,ticks:T_LONG,nrows:T_ROB/EVERY}:{o,ticks:T_ROB}; }
const LONG_ARMS=new Set([...Object.values(arms(C055)),...Object.values(REF)].map(canon)); const isLongArm=o=>LONG_ARMS.has(canon(o));
function perSeedRob(cfg){ const A=arms(cfg), per={}; for(const s of SEEDS){ const g=o=>{ const a=robArm(o,s); return runStats(a.o,s,a.ticks,a.nrows); };
    per[s]={x:g(A.X),r:g(A.R),sh:g(A.SH),dr:g(A.DR),d0:g(REF.D),dr0:g(REF.DRIFT),b:g(REF.BASE)}; } return per; }
// ---------------- bookkeeping ----------------
function commit(msg){ if(TEST)return; try{ execSync(`git add lab/sticky/trial-lr lab/STICKY-LONGRUN.md && git commit -qm "${msg}" && (git push -q origin ${BRANCH} || true)`,{cwd:REPO,stdio:'ignore'}); }catch(e){} }
function appendDoc(title,body){ if(TEST){ fs.appendFileSync(path.join(TR,'doc-append.md'),`\n### ${title}\n${body}\n`); return; } fs.appendFileSync(DOC,`\n### ${title} (appended by longrun.js ${now()})\n${body}\n`); }
// ---------------- test 1: open-endedness ----------------
function test1(){ const per=perSeed(C055,T_LONG), z0=Object.values(per).map(z=>z.x).find(Boolean)||{E:NaN,th:NaN}, L=[`# TEST 1 (open-endedness): c055, ${T_LONG/1e3}k ticks, seeds ${SEEDS.join(',')}, ${WIN*EVERY/1e3}k windows; late third = windows ${z0.E-z0.th}-${z0.E-1}, middle third = ${z0.E-2*z0.th}-${z0.E-z0.th-1}`];
  const B=bar(per); L.push(...B.lines.map(x=>'c055 '+x));
  const xs=SEEDS.map(s=>per[s].x).filter(Boolean); const mL=mean(xs.map(z=>z.S)), mM=mean(xs.map(z=>z.Smid));
  for(const s of SEEDS){ const z=per[s].x; if(z)L.push(`c055 X seed ${s}: S mid ${f2(z.Smid)} -> late ${f2(z.S)} | cumulative sticky K end ${z.Kend} | K slope (late third, per window) ${f3(z.slopeL)} | K increments in 4 late blocks [${z.blocks.join(', ')}] => ${z.blocks.every(v=>v>0)&&z.slopeL>0?'keeps rising':'PLATEAU'}`); }
  for(const s of SEEDS) for(const k of ['r','sh','dr','d0','dr0']){ const z=per[s][k]; if(z)L.push(`  (descriptive) ${({r:'R',sh:'SH',dr:'DR',d0:'ref D',dr0:'ref DRIFT'})[k]} seed ${s}: S mid ${f2(z.Smid)} late ${f2(z.S)} K end ${z.Kend} blocks [${z.blocks.join(', ')}]`); }
  const a=xs.length===3&&mL>=mM, nRise=xs.filter(z=>z.blocks.every(v=>v>0)&&z.slopeL>0).length, b=nRise>=2, c=B.pass;
  L.push(`c055 1.5M: (1a) no fade: mean late S ${f2(mL)} >= mean middle S ${f2(mM)} ${a?'PASS':'FAIL'} | (1b) cumulative sticky keeps rising on ${nRise}/3 seeds ${b?'PASS':'FAIL'} | (1c) beats every null on ${B.wins}/3 seeds, relative stickiness ${f3(B.rel)}, collapse ${B.col.length?B.col.join('; '):'none'} ${c?'PASS':'FAIL'} => ${a&&b&&c?'OPEN-ENDED over 1.5M (all three pass)':'NOT SHOWN (at least one criterion fails)'}`);
  // descriptive trajectory: the original bar at 450k and 900k prefixes of the same runs
  for(const n of [T_ROB/EVERY,2*T_ROB/EVERY]){ const p2=perSeed(C055,T_LONG,n); for(const s of SEEDS)for(const k of ['d0','dr0','b'])p2[s][k]=runStats(({d0:REF.D,dr0:REF.DRIFT,b:REF.BASE})[k],s,T_LONG,n); const B2=bar(p2); L.push(`  (descriptive) original bar on the ${n*EVERY/1e3}k prefix: ${B2.wins}/3 seeds, relative stickiness ${f3(B2.rel)}, ${B2.pass?'pass':'fail'}`); }
  return L; }
// ---------------- test 2: robustness map ----------------
function test2(){ const L=['# TEST 2 (robustness): one knob at a time x0.75 / x1.25 from c055, 450k, seeds 501-503, original bar (>=2/3 seeds beat all nulls, rel >= 1.10, no collapse)'];
  const row=(id,cfg)=>{ const B=bar(perSeedRob(cfg)); return {id,B}; };
  const centre=row('c055 (centre)',C055); L.push(`${centre.id}: ${centre.B.wins}/3, rel ${f3(centre.B.rel)}, ${centre.B.col.length?'collapse/missing: '+centre.B.col.join('; '):'no collapse'} => ${centre.B.pass?'PASS':'FAIL'}`); centre.B.lines.forEach(x=>L.push('   '+x));
  const res=VARIANTS.map(v=>({v,...row(v.id,v.cfg)}));
  L.push('','| knob | c055 value | x0.75 (value: seeds won, rel, pass) | x1.25 (value: seeds won, rel, pass) |','|---|---|---|---|');
  for(const [k,g] of NUDGE_KNOBS){ const lo=res.find(r=>r.v.knob===k&&r.v.f<1), hi=res.find(r=>r.v.knob===k&&r.v.f>1), cell=r=>`${r.v.val}: ${r.B.wins}/3, ${f3(r.B.rel)}, ${r.B.pass?'PASS':'FAIL'}${r.B.col.length?' ('+r.B.col.join('; ')+')':''}`;
    L.push(`| ${k} (${g}) | ${C055[g][k]} | ${cell(lo)} | ${cell(hi)} |`); }
  for(const r of res){ L.push(`${r.id}:`); r.B.lines.forEach(x=>L.push('   '+x)); }
  const nPass=res.filter(r=>r.B.pass).length, need=Math.ceil(0.7*res.length);
  L.push('',`ROBUSTNESS: ${nPass}/${res.length} nudges clear the original bar (pre-registered threshold >= ${need}/${res.length}, i.e. >= 70%) => ${nPass>=need?'ROBUST':'FRAGILE'} (a sensitivity map, not a single verdict: see table)`);
  const e=row('e003-noCH_AWAY',E003NOCH); L.push(`e003-noCH_AWAY (own pre-registered arm, not counted in the 12): ${e.B.wins}/3, rel ${f3(e.B.rel)}, ${e.B.col.length?e.B.col.join('; '):'no collapse'} => ${e.B.pass?'PASS':'FAIL'}`); e.B.lines.forEach(x=>L.push('   '+x));
  return L; }
// ---------------- main (test-1 runs queued first, then test-2 runs) ----------------
function test1Runs(){ const ps=[]; for(const s of SEEDS){ const A=arms(C055); for(const k of ['X','R','SH','DR'])ps.push(runOne(A[k],s,T_LONG)); for(const o of Object.values(REF))ps.push(runOne(o,s,T_LONG)); } return Promise.all(ps); }
function test2Runs(){ const ps=[]; for(const s of SEEDS) for(const cfg of [...VARIANTS.map(v=>v.cfg),E003NOCH]){ const A=arms(cfg); for(const k of ['X','R','SH','DR'])if(!isLongArm(A[k]))ps.push(runOne(A[k],s,T_ROB)); } return Promise.all(ps); }
async function main(){ log('longrun start, pid',process.pid,'P',P);
  if(fs.existsSync(path.join(TR,'ALL-DONE'))){ log('already complete'); return; }
  const p1=test1Runs(), p2=test2Runs();
  // test 2 needs the 450k prefixes of the test-1 centre/ref runs: wait for its own runs and for those prefixes
  const t2=(async()=>{ await p2; while(SEEDS.some(s=>[...Object.values(arms(C055)),...Object.values(REF)].some(o=>{ const f=rfile(o,s,T_LONG); return !fs.existsSync(f+'.fail')&&!fs.existsSync(f+'.done')&&segsDone(f)*SEG<T_ROB; })))await new Promise(r=>setTimeout(r,30e3));
    if(!fs.existsSync(path.join(TR,'test2.txt'))||TEST){ const L=test2(); appendDoc('TEST 2 result: robustness / sensitivity map',"```\n"+L.join('\n')+"\n```"); fs.writeFileSync(path.join(TR,'test2.txt'),L.join('\n')+'\n'); log('test 2 done'); commit('sticky-longrun: test 2 (robustness map) result'); } })();
  await p1; if(!fs.existsSync(path.join(TR,'test1.txt'))||TEST){ const L=test1(); appendDoc('TEST 1 result: open-endedness at 1.5M',"```\n"+L.join('\n')+"\n```"); fs.writeFileSync(path.join(TR,'test1.txt'),L.join('\n')+'\n'); log('test 1 done'); commit('sticky-longrun: test 1 (open-endedness 1.5M) result'); }
  await t2; fs.writeFileSync(path.join(TR,'ALL-DONE'),now()+'\n'); log('all done'); commit('sticky-longrun: all done'); }
if(require.main===module) main().catch(e=>{ log('ERROR',e.stack); process.exit(1); });
module.exports={arms,C055,E003NOCH,VARIANTS,REF,stats,series};
