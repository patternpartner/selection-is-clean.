// lab/meta/search.js - META-SEARCH over world rules (lab/META-SEARCH.md). SEARCH seeds 40-49 only; held-out check on TRIAL seeds 30-32.
// A simple elitist evolutionary loop over a mixed genome (every honest knob + the variation operator + evolvable evolvability).
// Fitness has the nulls built in: each config is run as FULL + RANDCAP + SHUF + NOINH on the same seed (matched config).
// Resumable: state in $MS/state.json, runs skip when ARM-SEED.done exists. Commits+pushes lab/meta after every generation.
//   MS=/tmp/ms P=8 nohup node lab/meta/search.js > /tmp/ms/search.log 2>&1 &
'use strict'; const fs=require('fs'), path=require('path'), cp=require('child_process'), E=process.env;
const ROOT=path.resolve(__dirname,'../..'); process.chdir(ROOT);
const MS=E.MS||'/tmp/ms', P=+(E.P||8), T=+(E.T||80000), WIN=+(E.WIN||8), GEN0=+(E.GEN0||12), LAMBDA=+(E.LAMBDA||10), GMAX=+(E.GMAX||16),
  STOP_AT=E.STOP_AT?Date.parse(E.STOP_AT):Infinity, HT=+(E.HT||450000), HSEEDS=(E.HSEEDS||'30 31 32').split(' '), SEEDS=[40,41,42,43,44,45,46,47,48,49];
const OUT=E.OUT||path.join(ROOT,'lab/meta'), CSV=path.join(OUT,'evals.csv'), LOG=path.join(OUT,'search-log.md'), STATE=path.join(MS,'state.json');
fs.mkdirSync(MS,{recursive:true});
// ---- genome: every coordinate in [0,1] ----
const G=[['BODY_F','log',0.02,0.3],['BODY_MAX','set',[4,8,12,16,24]],['BODY_UP','log',1e-4,3e-3],['BODY_UPX','set',[1,1.5,2]],
 ['BODY_MUT','log',0.002,0.1],['BODY_DUP','log',0.002,0.05],['BODY_DEL','log',0.002,0.05],['BODY_CAP','log',0.005,0.2],['BODY_MQ','lin',0,1],
 ['cwLast','lin',0,1],['cwRand','lin',0,1],['cwEnv','lin',0,1],['cwExt','lin',0,1],['BODY_HIST','set',[1,2,3,4]],['BODY_HL','lin',0.2,1],
 ['evoOn','set',[0,1]],['BODY_EVO','log',0.02,0.5],['fuseOn','set',[0,1]],['BODY_FUSE','log',0.005,0.1],['BODY_CHAIN','set',[4,8,12]],
 ['XFEED','set',[0,1]],['XF_UPT','log',0.05,0.5],['XF_LEAK','log',0.02,0.3],['scarOn','set',[0,1]],['SCAR_T','lin',10000,40000],['SCAR_MIN','lin',0.1,0.7],
 ['niche','set',[0,1]],['NICHE_AC_B','log',3e-4,3e-3]];
const dec1=(g,x)=>g[1]==='lin'?g[2]+x*(g[3]-g[2]):g[1]==='log'?Math.exp(Math.log(g[2])+x*(Math.log(g[3])-Math.log(g[2]))):g[2][Math.min(g[2].length-1,Math.floor(x*g[2].length))];
const enc1=(g,v)=>g[1]==='lin'?(v-g[2])/(g[3]-g[2]):g[1]==='log'?(Math.log(v)-Math.log(g[2]))/(Math.log(g[3])-Math.log(g[2])):(g[2].indexOf(v)+0.5)/g[2].length;
const decode=x=>{ const v={}; G.forEach((g,i)=>v[g[0]]=dec1(g,x[i])); return v; };
const encode=v=>G.map(g=>Math.min(0.999,Math.max(0,enc1(g,v[g[0]]))));
const S2={CHEM:1,NICHE:2,NICHE_R:2,NICHE_COPY:1,NICHE_OPEN:1,NICHE_OPEN_P:0.125,NICHE_OPEN_CAP:2,NICHE_GC:1,NICHE_XCOST:0.1,NICHE_BCOST:0.3,NICHE_BLD:1,NICHE_UP:1,NICHE_UCOST:0.05,NICHE_SKIN:1,NICHE_SKIN_REGROW:1,NICHE_PERM:1};
const r6=x=>+(+x).toPrecision(4);
function envOpts(v){ const o={CHEM:1}; if(v.niche)Object.assign(o,S2,{NICHE_AC:2,NICHE_AC_B:r6(v.NICHE_AC_B)}); if(v.scarOn)Object.assign(o,{SCAR_T:Math.round(v.SCAR_T),SCAR_ON:10000,SCAR_MIN:r6(v.SCAR_MIN)}); return o; }
function opts(v){ const o=Object.assign(envOpts(v),{HBODY:1}); for(const k of ['BODY_F','BODY_UP','BODY_MUT','BODY_DUP','BODY_DEL','BODY_CAP','BODY_MQ','BODY_HL'])o[k]=r6(v[k]);
  o.BODY_MAX=v.BODY_MAX; o.BODY_UPX=v.BODY_UPX; o.BODY_HIST=v.BODY_HIST; o.BODY_CW=[v.cwLast,v.cwRand,v.cwEnv,v.cwExt].map(w=>r6(Math.max(0.001,w)));
  if(v.evoOn)o.BODY_EVO=r6(v.BODY_EVO); if(v.fuseOn){ o.BODY_FUSE=r6(v.BODY_FUSE); o.BODY_CHAIN=v.BODY_CHAIN; } if(v.XFEED){ o.XFEED=1; o.XF_UPT=r6(v.XF_UPT); o.XF_LEAK=r6(v.XF_LEAK); } return o; }
const NULL={FULL:{},RANDCAP:{BODY_RCAP:1},SHUF:{BODY_SHUF:1},NOINH:{BODY_INH:0},FIXED:{BODY_FIXED:1},NOLEAK:{XF_LEAK:0},SHUFENV:{XF_SHUF:1}};
// ---- RNG for the search itself (reproducible) ----
let rs=+(E.RSEED||12345)>>>0; const rnd=()=>{ rs=(rs+0x6D2B79F5)>>>0; let t=rs; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
const gauss=()=>Math.sqrt(-2*Math.log(Math.max(1e-12,rnd())))*Math.cos(2*Math.PI*rnd());
// ---- state ----
let st=fs.existsSync(STATE)?JSON.parse(fs.readFileSync(STATE)):{gen:-1,cfg:[],evals:[],pending:null,k:0,rs,held:null};
rs=st.rs;
const save=()=>{ st.rs=rs; fs.writeFileSync(STATE+'.tmp',JSON.stringify(st)); fs.renameSync(STATE+'.tmp',STATE); fs.copyFileSync(STATE,path.join(OUT,'state.json')); };
const log=(...a)=>console.log(new Date().toISOString().slice(0,19),...a);
// ---- runs ----
function runJobs(jobs){ return new Promise(res=>{ let i=0, live=0; const next=()=>{ if(i>=jobs.length&&!live)return res();
    while(live<P&&i<jobs.length){ const j=jobs[i++]; fs.mkdirSync(j.dir,{recursive:true}); const base=path.join(j.dir,`${j.arm}-${j.seed}`); if(fs.existsSync(base+'.done'))continue;
      live++; const fo=fs.openSync(base+'.jsonl','w'), fe=fs.openSync(base+'.err','w');
      const ch=cp.spawn('node',['lab/core-run.js'],{env:Object.assign({},process.env,{SEED:String(j.seed),TICKS:String(j.T),EVERY:'1000',OPTS:JSON.stringify(j.o)}),stdio:['ignore',fo,fe]});
      ch.on('exit',code=>{ fs.closeSync(fo); fs.closeSync(fe); live--; let n=0; try{ n=fs.readFileSync(base+'.jsonl','utf8').trim().split('\n').filter(Boolean).length; }catch(e){}
        if(code===0&&n===j.T/1000)fs.writeFileSync(base+'.done',''); else log('RUN FAILED',base,code,n); next(); }); }
    if(i>=jobs.length&&!live)res(); }; next(); }); }
function trial(dir,arms,seeds,win){ const js=path.join(dir,`trial-${seeds.join('_')}.json`);
  cp.execFileSync('node',['lab/autocat/body-trial.js'],{env:Object.assign({},process.env,{DIR:dir,ARMS:arms.join(' '),SEEDS:seeds.join(' '),WIN:String(win),JSON:js}),stdio:['ignore','pipe','pipe']});
  return JSON.parse(fs.readFileSync(js)); }
// ---- fitness (pre-registered in lab/META-SEARCH.md) ----
function fitness(r,s,baseN){ const F=r['FULL'+s]; if(!F)return null; const nl=['RANDCAP','SHUF','NOINH'].map(a=>r[a+s]?r[a+s].Lu:0), best=Math.max(...nl);
  const dead=F.reseeds>0||F.N<0.5*baseN, low=!(F.share>=0.10); const fit=(F.Lu-best)+(F.tr>=0?1:0)-(dead?10:0)-(low?5:0);
  return {LuF:F.Lu,LuRANDCAP:nl[0],LuSHUF:nl[1],LuNOINH:nl[2],trF:F.tr,shareF:F.share,NF:F.N,baseN,reseeds:F.reseeds,size:F.size,fit}; }
// ---- bookkeeping ----
const meanFit=id=>{ const e=st.evals.filter(x=>x.id===id&&x.fit!=null); return e.length?e.reduce((a,b)=>a+b.fit,0)/e.length:-Infinity; };
const nEval=id=>st.evals.filter(x=>x.id===id).length;
const ranked=()=>st.cfg.map(c=>c.id).sort((a,b)=>meanFit(b)-meanFit(a));
function writeCsv(){ const keys=G.map(g=>g[0]), h=['gen','id','origin','seed',...keys,'LuF','LuRANDCAP','LuSHUF','LuNOINH','trF','shareF','NF','baseN','reseeds','size','fit','meanFit','nEval'];
  const L=[h.join(',')]; for(const e of st.evals){ const c=st.cfg[e.id], v=decode(c.x); L.push([e.gen,e.id,c.origin,e.seed,...keys.map(k=>r6(v[k])),...['LuF','LuRANDCAP','LuSHUF','LuNOINH','trF','shareF','NF','baseN','reseeds','size','fit'].map(k=>e[k]==null?'':r6(e[k])),r6(meanFit(e.id)),nEval(e.id)].join(',')); }
  fs.writeFileSync(CSV,L.join('\n')+'\n'); }
function push(msg){ if(E.NOPUSH)return log('(nopush) '+msg); try{ cp.execSync('git add lab/meta && git commit -qm '+JSON.stringify(msg),{stdio:'pipe'}); }catch(e){ log('commit skipped'); }
  for(let i=0;i<3;i++){ try{ cp.execSync('git push -q origin cos/meta-search',{stdio:'pipe',timeout:120000}); return; }catch(e){ log('push failed, retry'); cp.execSync('sleep 30'); } } }
// ---- variation (search level) ----
function child(){ const top=ranked().slice(0,5), pick=()=>{ const a=top[(rnd()*top.length)|0], b=top[(rnd()*top.length)|0]; return meanFit(a)>=meanFit(b)?a:b; };
  const p1=pick(); let x=st.cfg[p1].x.slice(), origin='mut '+p1;
  if(rnd()<0.5){ const p2=pick(); if(p2!==p1){ const y=st.cfg[p2].x; x=x.map((v,i)=>rnd()<0.5?v:y[i]); origin='x '+p1+'+'+p2; } }
  let m=0; while(!m) G.forEach((g,i)=>{ if(rnd()<0.2){ m++; if(g[1]==='set'&&rnd()<0.5)x[i]=rnd()*0.999; else { let v=x[i]+0.15*gauss(); while(v<0||v>1)v=v<0?-v:2-v; x[i]=Math.min(0.999,v); } } });
  return {x,origin}; }
const addCfg=(x,origin)=>{ const id=st.cfg.length; st.cfg.push({id,x,origin,gen:st.gen}); return id; };
function nextSeed(id){ const used=new Set(st.evals.filter(e=>e.id===id).map(e=>e.seed)); for(let k=0;k<10;k++){ const s=SEEDS[(st.k+k)%10]; if(!used.has(s)){ st.k++; return s; } } return SEEDS[(st.k++)%10]; }
const KNOWN={ B:{BODY_F:0.2,BODY_MAX:8,BODY_UP:5e-4,BODY_UPX:1,BODY_MUT:0.01,BODY_DUP:0.01,BODY_DEL:0.01,BODY_CAP:0.02,BODY_MQ:0.5,cwLast:1,cwRand:0,cwEnv:0,cwExt:0,BODY_HIST:1,BODY_HL:0.5,evoOn:0,BODY_EVO:0.1,fuseOn:0,BODY_FUSE:0.02,BODY_CHAIN:8,XFEED:0,XF_UPT:0.2,XF_LEAK:0.1,scarOn:0,SCAR_T:30000,SCAR_MIN:0.25,niche:0,NICHE_AC_B:0.001} };
KNOWN.C1=Object.assign({},KNOWN.B,{BODY_F:0.05,BODY_MAX:16,fuseOn:1,XFEED:1}); KNOWN.X2=Object.assign({},KNOWN.C1,{scarOn:1}); KNOWN.C1rand=Object.assign({},KNOWN.C1,{cwLast:0,cwRand:1});
KNOWN.C1evo=Object.assign({},KNOWN.C1,{cwLast:0.25,cwRand:0.25,cwEnv:0.25,cwExt:0.25,evoOn:1,BODY_EVO:0.1});
function planGen(){ st.gen++; const ev=[];
  if(st.gen===0){ for(const [k,v] of Object.entries(KNOWN))ev.push({id:addCfg(encode(v),'known '+k)}); while(ev.length<GEN0)ev.push({id:addCfg(G.map(()=>rnd()*0.999),'random')}); }
  else { const top=ranked().filter(id=>meanFit(id)>-Infinity); for(const id of top.slice(0,2))ev.push({id}); ev.push({id:addCfg(G.map(()=>rnd()*0.999),'immigrant')});
    while(ev.length<LAMBDA){ const c=child(); ev.push({id:addCfg(c.x,c.origin)}); } }
  for(const e of ev)e.seed=nextSeed(e.id); st.pending=ev; save(); }
async function runGen(){ const ev=st.pending, jobs=[], ARMS=['FULL','SHUF','RANDCAP','NOINH'];
  if(st.gen===0) for(const s of SEEDS)jobs.push({dir:path.join(MS,'base'),arm:'BASE',seed:s,T,o:{CHEM:1}});
  for(const a of ARMS) for(const e of ev){ const v=decode(st.cfg[e.id].x); jobs.push({dir:path.join(MS,'runs','c'+e.id),arm:a,seed:e.seed,T,o:Object.assign(opts(v),NULL[a])}); }
  log(`gen ${st.gen}: ${ev.length} configs, ${jobs.length} runs`); await runJobs(jobs);
  const bt=trial(path.join(MS,'base'),['BASE'],SEEDS,WIN);
  for(const e of ev){ let f=null; try{ const r=trial(path.join(MS,'runs','c'+e.id),ARMS,[e.seed],WIN); f=fitness(r,e.seed,bt['BASE'+e.seed]?bt['BASE'+e.seed].N:0); }catch(err){ log('trial failed',e.id,err.message); }
    st.evals.push(Object.assign({gen:st.gen,id:e.id,seed:e.seed},f||{fit:null})); }
  st.pending=null; save(); writeCsv();
  const top=ranked().slice(0,5); const lines=[`\n### Generation ${st.gen} (${new Date().toISOString().slice(0,16)}Z): ${ev.length} configs evaluated, ${st.cfg.length} configs / ${st.evals.length} evaluations so far`,'Top 5 by mean fitness:','```'];
  for(const id of top){ lines.push(`c${id} meanFit ${meanFit(id).toFixed(2)} n=${nEval(id)} [${st.cfg[id].origin}] ${JSON.stringify(opts(decode(st.cfg[id].x)))}`); } lines.push('```'); fs.appendFileSync(LOG,lines.join('\n')+'\n');
  push(`meta-search: generation ${st.gen} (${st.evals.length} evaluations), best c${top[0]} meanFit ${meanFit(top[0]).toFixed(2)}`); }
// ---- held-out check (pre-registered) ----
async function heldOut(){ if(!st.held){ const pool=ranked().filter(id=>nEval(id)>=2); const pick=(pool.length>=3?pool:ranked()).slice(0,3); st.held={pick,done:false}; save();
    fs.appendFileSync(LOG,`\n## Held-out check: top 3 configs ${pick.map(id=>'c'+id+' (meanFit '+meanFit(id).toFixed(2)+', n='+nEval(id)+')').join(', ')} on TRIAL seeds ${HSEEDS.join(',')} at ${HT}\n`); push('meta-search: search done, held-out check of '+pick.map(i=>'c'+i).join(' ')+' launched'); }
  const jobs=[]; for(const s of HSEEDS) for(const id of st.held.pick){ const v=decode(st.cfg[id].x), d=path.join(MS,'held','c'+id); const nulls=['RANDCAP','SHUF','NOINH','FIXED',...(v.XFEED?['NOLEAK','SHUFENV']:[])];
      for(const a of ['FULL',...nulls])jobs.push({dir:d,arm:a,seed:s,T:HT,o:Object.assign(opts(v),NULL[a])}); jobs.push({dir:d,arm:'BASE',seed:s,T:HT,o:envOpts(v)}); }
  log(`held-out: ${jobs.length} runs at ${HT}`); await runJobs(jobs); let anyGo=false; const out=[];
  for(const id of st.held.pick){ const v=decode(st.cfg[id].x), d=path.join(MS,'held','c'+id), nulls=['RANDCAP','SHUF','NOINH','FIXED',...(v.XFEED?['NOLEAK','SHUFENV']:[])];
    const tx=cp.execFileSync('node',['lab/autocat/body-trial.js'],{env:Object.assign({},process.env,{DIR:d,ARMS:['FULL',...nulls,'BASE'].join(' '),SEEDS:HSEEDS.join(' '),WIN:'15',JSON:path.join(OUT,`held-c${id}.json`)})}).toString();
    const go=cp.execFileSync('node',['lab/autocat/body-check.js','go',path.join(OUT,`held-c${id}.json`)],{env:Object.assign({},process.env,{SEEDS:HSEEDS.join(' '),NULLS:nulls.join(' ')})}).toString();
    if(/=> GO/.test(go))anyGo=true; out.push(`**c${id}** ${JSON.stringify(opts(v))}`,'```',tx.trim(),'```','Go criterion:','```',go.trim(),'```'); }
  fs.appendFileSync(LOG,out.join('\n')+`\n\n**Held-out verdict: ${anyGo?'GO (at least one config passes)':'NO-GO (no config passes)'}**\n`); st.held.done=true; save(); push(`meta-search: held-out check on seeds ${HSEEDS.join(',')} => ${anyGo?'GO':'NO-GO'}`); }
(async()=>{ if(!fs.existsSync(LOG))fs.writeFileSync(LOG,'# META-SEARCH log (appended by lab/meta/search.js; pre-registration in lab/META-SEARCH.md)\n');
  while(!(st.held)){ if(!st.pending){ if(st.gen>=GMAX||(st.gen>=0&&Date.now()>STOP_AT))break; planGen(); } await runGen(); }
  if(!st.held||!st.held.done)await heldOut(); log('SEARCH DONE'); })().catch(e=>{ log('FATAL',e.stack); process.exit(1); });
