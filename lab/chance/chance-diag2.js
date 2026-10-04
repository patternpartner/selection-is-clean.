// lab/chance/chance-diag2.js - POST-HOC DIAGNOSTIC (added 2026-10-04 ~13:00 BST; NOT part of any go criterion, no threshold here
// decides anything). Reads only the existing per-1000-tick JSONL samples (body.bU = income share per catalyst type, >= 0.2% of all
// chemical income; body.bC = share of organisms carrying the type, >= 0.2%; body.kinds = full count of carried kinds). No rerun.
// A "type" is a catalyst key: < 65536 = one-step catalyst (substrate key>>8 -> product key&255); >= 65536 = multi-step pathway id
// (made by an R1 long jump, by fusion, or by mutating a pathway; the log does not say which, and does not log its substrate).
// Windows of WIN samples; a type is PRESENT in a window if any sample has it at >= 0.2% carriers or income (same as chance-diag.js);
// GENUINELY NEW = present, never present before in the run. USED = >= 1% mean income or carriers in the window (Lu rule).
//
// 1. COEXISTENCE vs REPLACEMENT. The log has NO lineage/parent links and NO per-organism body sets, so the parent organism's own
//    trick cannot be identified. Population proxies only:
//    1a. same-substrate pairing (one-step new types only): incumbents = one-step types on the same substrate present in w-1.
//        Outcome one window later (w+1): COEXIST (new and >= 1 incumbent present), REPLACE (new present, every incumbent gone),
//        NEW LOST (new gone, incumbent present), BOTH LOST; or NO INCUMBENT (empty substrate niche). Null: background loss = share of
//        one-step substrate groups present in w-1 with NO new arrival in w that are wholly gone at w+1.
//    1b. census (all types incl. pathways): entries, exits of earlier types, net change in present types and in body.kinds per window.
// 2. CAUSE OF DEATH for genuinely new types that are gone one window later (present in w, absent in w+1). Per-sample trajectory in w:
//    e = income share / carrier share (earnings per carrier); e_peak = its max. At the LAST sample it is seen:
//    DEMAND VANISHED: still carried but e <= 0.1 e_peak, and censoring-safe (carriers x e_peak >= 2 x 0.2%, so at peak rate its income
//      would have been visible); STILL EARNING (lost carriers / out-competed): e >= 0.5 e_peak (or seen only via income);
//      DECLINING (0.1-0.5); NEVER VISIBLY EARNED (no sample with income >= 0.2%); UNDETERMINED (censored).
//    For one-step types, DISPLACED = a same-substrate type's carrier share rose from the type's peak sample to the mean of w+1.
//    DRIFT arms (bodies inert; would-be income logged) are the no-selection null for "still earning" deaths (= drift loss there).
//   DIR=/home/box/chance-runs/s1 SEEDS='110 111 112' ARMS='R1 RANDCAP ...' WIN=5 OUT=... node lab/chance/chance-diag2.js
'use strict'; const fs=require('fs'), path=require('path'), E=process.env;
const D=E.DIR, SEEDS=(E.SEEDS||'110 111 112').split(' '), ARMS=(E.ARMS||'R1 R2 RANDCAP DIRECT-R1 DIRECT-R2 DRIFT-R1 DRIFT-R2 SHUF-R1 SHUF-R2').split(' '), WIN=+(E.WIN||5), MIN=0.01, VIS=0.002;
const read=f=>fs.existsSync(f)?fs.readFileSync(f,'utf8').trim().split('\n').filter(x=>x.startsWith('{')).map(JSON.parse):null;
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN, pc=(a,b)=>b?(100*a/b).toFixed(0)+'%':'-', f1=v=>Number.isFinite(v)?v.toFixed(1):'-';
const sub=k=>k<65536?k>>8:-1;
// ===================== LOGGED READOUTS (cos/chance-logging; descriptive, not a go test) =====================
// With LOGS=<dir> this script instead reads the trick-logger files <dir>/<ARM>-<SEED>.log.jsonl[.gz] written by lab/chance/ce-logrun.js
// (lab/chance/ce-log.js documents the records) and classifies, for every GENUINELY NEW trick (first life of a key never carried
// before in the run; "life"/"end" records with gnew=1/life=1):
//  A. CAUSE OF DEATH of each such trick that went extinct (last carrier died) before the run ended:
//     NEVER EARNED      - zero income over its whole life: no input substrate ever at its carriers (no-sub), or substrate there but
//                         the reaction cannot run (not downhill / too steep) (dead-on-arrival);
//     DEMAND VANISHED   - earned, but at the death of its last carrier the input substrate in that cell was <= 10% of the life's best
//                         1000-tick mean substrate per copy (sDie <= 0.1 sPk);
//     OUT-COMPETED      - substrate had not vanished (sDie > 0.1 sPk), and EITHER it fell to <= 50% (earnings fell) OR a rival
//                         (another key with the same input substrate) had more carriers at the first 5k snapshot after the death than
//                         at the last snapshot before the birth (by >= max(1, 10%)) (displaced);
//     CARRIER DRIFT/LOSS - still earning (sDie > 0.5 sPk) and no rival rose: its carriers died or failed to pass it on.
//     Context columns: last carrier's death cause, share of lives with copies not passed on at a carrier's birth, and the carriers'
//     births per copy-tick relative to the population's births per organism-tick over the same span (fitness proxy).
//     Robustness: the demand-vanished share with the final-bin rule (sFin <= 0.1 sPk) instead of sDie.
//  B. COEXISTENCE vs REPLACEMENT with real parent links. Ancestor = the key it was mutated from (mut), the two keys fused (fuse), or the
//     donor's whole body set (cap; R1 long jumps = captures with walk length >= 2). Population level: at the first 5k snapshot after
//     the birth (new trick still alive): ancestor key(s) still carried anywhere (coexist) vs all extinct (replaced); eventual: did the
//     new trick outlive its ancestor (replaced), die first (new lost) or both alive at the end. Lineage level: among the new trick's
//     carriers at that snapshot, the share that still hold every ancestor key (from the logger's cx scan).
//     Context: for 'earnings fell', the share where the WORLD-mean concentration of the input substrate also halved between the
//     snapshots around the life (a global decline rather than local depletion near the carriers).
//  Shown for all new tricks and for ESTABLISHED ones (peak >= 10 simultaneous carriers).
async function logged(){ const zlib=require('zlib'), readline=require('readline');
  const LG=E.LOGS, ARMSL=(E.ARMS||'D RANDCAP DRIFT').split(' '); const out=[], L=x=>out.push(x), pc=(a,b)=>b?(100*a/b).toFixed(0)+'%':'-';
  L(`# chance-diag2 LOGGED READOUTS (descriptive, not a go test): ${LG}, seeds ${SEEDS.join(' ')}; windows 5000 ticks; pooled over seeds per arm`);
  const A={}, inc=(a,k,v=1)=>{ A[a]=A[a]||{}; A[a][k]=(A[a][k]||0)+v; }, g=(a,k)=>(A[a]&&A[a][k])||0;
  for(const a of ARMSL) for(const s of SEEDS){ let f=path.join(LG,`${a}-${s}.log.jsonl`); if(!fs.existsSync(f))f+='.gz'; if(!fs.existsSync(f))continue;
    const st=fs.createReadStream(f), rl=readline.createInterface({input:f.endsWith('.gz')?st.pipe(zlib.createGunzip()):st,crlfDelay:Infinity});
    const lives=new Map(), ends=new Map(), wins=[], sub0=new Map(), endsByKey=new Map(); inc(a,'runs');
    for await (const line of rl){ if(!line)continue; let r; try{ r=JSON.parse(line); }catch(e){ continue; }
      if(r.ev==='life'){ if(r.seq)sub0.set(r.key,r.seq[0]); if(r.gnew)lives.set(r.key,r); }
      else if(r.ev==='end'){ if(!endsByKey.has(r.key))endsByKey.set(r.key,[]); endsByKey.get(r.key).push(r); if(r.life===1)ends.set(r.key,r); }
      else if(r.ev==='win'){ const cnt=new Map(), bySub=new Map(); for(const x of r.k){ if(x[1]>0)cnt.set(x[0],x[1]); } const cx=new Map(r.cx.map(x=>[x[0],x])); wins.push({t:r.t,N:r.N,births:r.births,cnt,cx,mm:r.molMean}); } }
    const tEnd=wins.length?wins[wins.length-1].t:0; const sq=k=>k<65536?k>>8:(sub0.has(k)?sub0.get(k):-1);
    // per-window: carriers per substrate (for rivals), births per organism-tick
    for(const W of wins){ const m=new Map(); for(const [k,c] of W.cnt){ const q=sq(k); if(q<0)continue; m.set(q,(m.get(q)||0)+c); } W.bySub=m; }
    const wBefore=t=>{ let j=-1; for(let i=0;i<wins.length&&wins[i].t<=t;i++)j=i; return j; }, wAfter=t=>{ for(let i=0;i<wins.length;i++) if(wins[i].t>=t)return i; return -1; };
    const alive=(key,t)=>{ // was key carried at tick t? (any life spanning t)
      const E2=endsByKey.get(key)||[]; for(const e of E2) if(e.t0<=t&&e.t>=t)return true; const W=wins[wAfter(t)]; return false||(!!W&&W.cnt.has(key)&&!E2.some(e=>e.t0<=W.t&&e.t>=W.t&&e.t<t)); };
    for(const [k,lf] of lives){ if(lf.o==='init')continue; const e=ends.get(k), est=e?e.peak>=10:false, tag=lf.o==='cap'?(lf.k>=2?'capL':'cap1'):lf.o;
      inc(a,'new'); inc(a,'new_'+tag);
      // ---- A. cause of death
      if(e){ const sets=['all'].concat(e.peak>=10?['est']:[]); let cls;
        if(!(e.inc>0)) cls=e.sub>0?'doa':'nosub';
        else if(e.sDie<=0.1*e.sPk) cls='demand';
        else { const q=sq(k); let rival=false, gFell=false; const i0=wBefore(e.t0), i1=wAfter(e.t); if(q>=0&&i1>=0){ const own0=i0>=0?(wins[i0].cnt.get(k)||0):0, own1=wins[i1].cnt.get(k)||0;
              const r0=i0>=0?((wins[i0].bySub.get(q)||0)-own0):0, r1=(wins[i1].bySub.get(q)||0)-own1; rival=r1>=r0+Math.max(1,0.1*r0); if(i0>=0){ const g0=wins[i0].mm[q], g1=wins[i1].mm[q]; gFell=g0>0&&g1<=0.5*g0; } }
          cls=(e.sDie<=0.5*e.sPk||rival)?'outc':'drift'; if(cls==='outc')for(const S of sets){ inc(a,`${S}_outc_${e.sDie<=0.5*e.sPk?'fell':'rival'}`); if(e.sDie<=0.5*e.sPk&&gFell)inc(a,`${S}_outc_fellG`); } }
        const i0=wBefore(e.t0), i1=Math.max(i0+1,wAfter(e.t)); let bpo=NaN; if(i1>=0&&i1<wins.length){ let b=0,n=0; for(let i=Math.max(0,i0+1);i<=i1;i++){ b+=wins[i].births; n+=wins[i].N*5000; } bpo=n?b/n:NaN; }
        const rel=e.ct>0&&bpo>0?(e.cb/e.ct)/bpo:NaN;
        for(const S of sets){ inc(a,`${S}_dead`); inc(a,`${S}_${cls}`); inc(a,`${S}_why_${e.eDie}`); if(e.nl>0)inc(a,`${S}_nl`); if(e.inc>0&&Number.isFinite(e.sFin)&&e.sFin<=0.1*e.sPk)inc(a,`${S}_demandFin`); if(e.inc>0)inc(a,`${S}_earned`);
          if(Number.isFinite(rel)){ inc(a,`${S}_reln`); inc(a,`${S}_rel`,Math.min(rel,10)); if(rel<1)inc(a,`${S}_relLow`); }
          inc(a,`${S}_${tag}_dead`); inc(a,`${S}_${tag}_${cls}`); inc(a,`${S}_life`,e.t-e.t0); }
      } else { inc(a,'aliveEnd'); if(lf.o==='cap'&&lf.k>=2)inc(a,'aliveEnd_capL'); }
      // ---- B. coexistence vs replacement
      let anc=lf.o==='mut'?[lf.anc]:lf.o==='fuse'?lf.anc:lf.o==='cap'?lf.pset:null; if(!anc||!anc.length)continue; anc=anc.filter(x=>x!==k); if(!anc.length)continue;
      const iS=wAfter(lf.t+1); if(iS<0)continue; const W=wins[iS]; const sets=['all'].concat(e?(e.peak>=10?['est']:[]):(W.cnt.get(k)>=10?['est']:[]));
      if(!W.cnt.has(k)||(e&&e.t<W.t))continue;   // new trick did not live to the snapshot
      const nAl=anc.filter(x=>W.cnt.has(x)).length; const coex=lf.o==='cap'?nAl===anc.length:nAl>0;
      const cxr=W.cx.get(k);
      for(const S of sets){ inc(a,`${S}_cx_${tag}_n`); inc(a,`${S}_cx_${tag}_${coex?'coex':'repl'}`); if(cxr&&cxr[1]>0){ inc(a,`${S}_cx_${tag}_ln`); inc(a,`${S}_cx_${tag}_lall`,cxr[2]/cxr[1]); }
        if(lf.o!=='cap'){ // eventual: compare death times with the ancestor (mut: the one ancestor; fuse: the later-dying of the two)
          const ancEnd=x=>{ const E2=endsByKey.get(x)||[]; const e2=E2.find(z=>z.t0<=lf.t&&z.t>=lf.t); return e2?e2.t:(E2.some(z=>z.t0<=lf.t&&z.t<lf.t)&&!W.cnt.has(x)?lf.t:Infinity); };
          const ta=Math.max(...anc.map(ancEnd)), tn=e?e.t:Infinity; const v=tn===Infinity&&ta===Infinity?'both':ta<tn?'repl':'newlost'; inc(a,`${S}_ev_${tag}_${v}`); inc(a,`${S}_ev_${tag}_n`); } } }
  }
  for(const S of ['all','est']){ L(`\n## A. Cause of death of genuinely new tricks that went extinct (${S==='all'?'ALL new tricks':'ESTABLISHED: peak >= 10 carriers'})`);
    L('arm | new tricks | still alive at end | extinct | never earned: no substrate / not runnable | DEMAND VANISHED | OUT-COMPETED (earnings fell [of which world-mean substrate also halved] / rival rose) | CARRIER DRIFT/LOSS | demand vanished by final-bin rule | last carrier died starve / old / killed | lives with copies not passed on | carriers births per copy-tick vs population (mean, share < 1) | mean life (ticks)');
    for(const a of ARMSL){ if(!A[a])continue; const n=g(a,`${S}_dead`);
      L(`${a} | ${S==='all'?g(a,'new'):'-'} | ${S==='all'?g(a,'aliveEnd'):'-'} | ${n} | ${pc(g(a,`${S}_nosub`),n)} / ${pc(g(a,`${S}_doa`),n)} | ${pc(g(a,`${S}_demand`),n)} | ${pc(g(a,`${S}_outc`),n)} (${pc(g(a,`${S}_outc_fell`),n)} [${pc(g(a,`${S}_outc_fellG`),n)}] / ${pc(g(a,`${S}_outc_rival`),n)}) | ${pc(g(a,`${S}_drift`),n)} | ${pc(g(a,`${S}_demandFin`),n)} | ${pc(g(a,`${S}_why_starve`),n)} / ${pc(g(a,`${S}_why_old`),n)} / ${pc(g(a,`${S}_why_killed`),n)} | ${pc(g(a,`${S}_nl`),n)} | ${(g(a,`${S}_rel`)/g(a,`${S}_reln`)).toFixed(2)}, ${pc(g(a,`${S}_relLow`),g(a,`${S}_reln`))} | ${(g(a,`${S}_life`)/n).toFixed(0)}`); }
    L('by origin (extinct n: never earned / demand / out-competed / drift-loss); cap1 = one-step capture, capL = R1 long jump (capture walk >= 2)');
    for(const a of ARMSL){ if(!A[a])continue; L(`${a} | `+['mut','fuse','cap1','capL'].map(t=>{ const n=g(a,`${S}_${t}_dead`); return `${t} n=${n}: ${pc(g(a,`${S}_${t}_nosub`)+g(a,`${S}_${t}_doa`),n)} / ${pc(g(a,`${S}_${t}_demand`),n)} / ${pc(g(a,`${S}_${t}_outc`),n)} / ${pc(g(a,`${S}_${t}_drift`),n)}`; }).join(' | ')); } }
  for(const S of ['all','est']){ L(`\n## B. Coexistence vs replacement with real parent links (${S==='all'?'ALL new tricks alive at the first 5k snapshot':'ESTABLISHED'})`);
    L('arm | origin | n | population: ancestor(s) still carried (coexist) / gone (replaced) | lineage: share of the new trick\'s carriers holding every ancestor key | eventual (mut/fuse): new outlived ancestor (replaced) / died first / both alive at end');
    for(const a of ARMSL){ if(!A[a])continue; for(const t of ['mut','fuse','cap1','capL']){ const n=g(a,`${S}_cx_${t}_n`); if(!n)continue; const en=g(a,`${S}_ev_${t}_n`);
      L(`${a} | ${t} | ${n} | ${pc(g(a,`${S}_cx_${t}_coex`),n)} / ${pc(g(a,`${S}_cx_${t}_repl`),n)} | ${g(a,`${S}_cx_${t}_ln`)?(100*g(a,`${S}_cx_${t}_lall`)/g(a,`${S}_cx_${t}_ln`)).toFixed(0)+'%':'-'} | ${en?`${pc(g(a,`${S}_ev_${t}_repl`),en)} / ${pc(g(a,`${S}_ev_${t}_newlost`),en)} / ${pc(g(a,`${S}_ev_${t}_both`),en)}`:'-'}`); } } }
  L('\nnew tricks by origin (all): '+ARMSL.filter(a=>A[a]).map(a=>`${a}: `+['mut','fuse','cap1','capL','dup'].map(t=>`${t} ${g(a,'new_'+t)}`).join(', ')).join(' | '));
  console.log(out.join('\n')); if(E.OUT)fs.writeFileSync(E.OUT,out.join('\n')+'\n'); }
if(E.LOGS){ logged(); } else {
const T={}; const add=(a,key,v=1)=>{ T[a]=T[a]||{}; T[a][key]=(T[a][key]||0)+v; };
const perSeed=[];
for(const a of ARMS) for(const s of SEEDS){ const rows=read(path.join(D,`${a}-${s}.jsonl`)); if(!rows)continue; const nW=Math.floor(rows.length/WIN);
  const U=rows.map(r=>new Map((r.body&&r.body.bU)||[])), Cs=rows.map(r=>new Map((r.body&&r.body.bC)||[]));
  const present=[], used=[], seen=new Set(), newT=[];
  for(let w=0;w<nW;w++){ const P=new Set(), inc=new Map(), car=new Map();
    for(let i=w*WIN;i<(w+1)*WIN;i++){ for(const [k,v] of U[i]){ if(v>=VIS)P.add(k); inc.set(k,(inc.get(k)||0)+v/WIN); } for(const [k,v] of Cs[i]){ if(v>=VIS)P.add(k); car.set(k,(car.get(k)||0)+v/WIN); } }
    const Us=new Set([...inc].filter(([k,v])=>v>=MIN).map(([k])=>k).concat([...car].filter(([k,v])=>v>=MIN).map(([k])=>k)));
    const nw=new Set([...P].filter(k=>!seen.has(k))); for(const k of P)seen.add(k); present.push(P); used.push(Us); newT.push(nw); }
  const grp=P=>{ const m=new Map(); for(const k of P){ const q=sub(k); if(q<0)continue; if(!m.has(q))m.set(q,new Set()); m.get(q).add(k); } return m; };
  const G=present.map(grp); let ent=0,ext=0,dV=0,nWin=0, entCh=0, ree=0;
  // 1a / 1b
  for(let w=1;w+1<nW;w++){ const prev=present[w-1], nxt=present[w+1], Gp=G[w-1], arrivedQ=new Set();
    nWin++; ent+=newT[w].size; ext+=[...prev].filter(k=>!present[w].has(k)).length; dV+=present[w].size-prev.size; entCh+=[...newT[w]].filter(k=>k>=65536).length; ree+=[...present[w]].filter(k=>!prev.has(k)&&!newT[w].has(k)).length;
    for(const k of newT[w]){ const u=used[w].has(k); add(a,'new'); if(u)add(a,'newU'); if(k>=65536){ add(a,'newCh'); if(u)add(a,'newChU'); continue; }
      const q=sub(k); arrivedQ.add(q); const I=[...(Gp.get(q)||[])].filter(x=>x!==k);
      let o; if(!I.length)o='noinc'; else { const nk=nxt.has(k), ni=I.some(x=>nxt.has(x)); o=nk&&ni?'coex':nk?'repl':ni?'newlost':'bothlost'; }
      add(a,'1a_'+o); if(u)add(a,'1aU_'+o); if(I.length){ add(a,'ar_n'); if(!I.some(x=>nxt.has(x)))add(a,'ar_lost'); }
      if(w>=2){ const Ie=I.filter(x=>present[w-2].has(x)); if(Ie.length){ const nk=nxt.has(k), ni=Ie.some(x=>nxt.has(x)); add(a,'1e_'+(nk&&ni?'coex':nk?'repl':ni?'newlost':'bothlost')); add(a,'are_n'); if(!ni)add(a,'are_lost'); } } }
    for(const [q,S] of Gp){ if(arrivedQ.has(q))continue; add(a,'bg_n'); if(![...S].some(x=>nxt.has(x)))add(a,'bg_lost');
      if(w>=2){ const Se=[...S].filter(x=>present[w-2].has(x)); if(Se.length){ add(a,'bge_n'); if(!Se.some(x=>nxt.has(x)))add(a,'bge_lost'); } } } }
  const k0=rows.slice(0,WIN).map(r=>r.body?r.body.kinds:0), k1=rows.slice((nW-1)*WIN,nW*WIN).map(r=>r.body?r.body.kinds:0), kMid=rows.slice(Math.floor(nW/3)*WIN,(Math.floor(nW/3)+1)*WIN).map(r=>r.body?r.body.kinds:0);
  perSeed.push({a,s,nW,ree:ree/nWin,ent:ent/nWin,ext:ext/nWin,dV:dV/nWin,entCh:entCh/nWin,kMid:mean(kMid),kEnd:mean(k1)});
  // 2. cause of death
  for(let w=0;w+1<nW;w++) for(const k of newT[w]){ if(present[w+1].has(k))continue; const u=used[w].has(k), ch=k>=65536?'Ch':'1s';
    let ePk=0, iPk=-1, last=-1; for(let i=w*WIN;i<(w+1)*WIN;i++){ const c=Cs[i].get(k)||0, x=U[i].get(k)||0; if(c>=VIS||x>=VIS)last=i; if(c>=VIS&&x>=VIS&&x/c>ePk){ ePk=x/c; iPk=i; } }
    let o; const cL=Cs[last].get(k)||0, uL=U[last].get(k)||0;
    if(iPk<0) o=(cL<VIS&&uL>=VIS)?'earn':'never';
    else if(cL<VIS) o='earn';
    else { const r=(uL/cL)/ePk; if(r>=0.5)o='earn'; else if(r<=0.1)o=(cL*ePk>=2*VIS)?'demand':'undet'; else o='decl'; }
    add(a,'d_n'); add(a,'d_'+o); if(u){ add(a,'dU_n'); add(a,'dU_'+o); } if(o!=='never'){ add(a,'dV_n'); add(a,'dV_'+o); } add(a,'d'+ch+'_n'); add(a,'d'+ch+'_'+o);
    if(o==='earn'&&k<65536&&iPk>=0){ const q=sub(k); add(a,'d1e_n'); const pre=new Map(); for(const [x,v] of Cs[iPk]) if(x!==k&&sub(x)===q)pre.set(x,v);
      const post=new Map(); for(let i=(w+1)*WIN;i<(w+2)*WIN;i++) for(const [x,v] of Cs[i]) if(x!==k&&sub(x)===q)post.set(x,(post.get(x)||0)+v/WIN);
      if([...post].some(([x,v])=>v>(pre.get(x)||0)+VIS))add(a,'d1e_disp'); } } }
const out=[], L=x=>out.push(x), g=(a,k)=>(T[a]&&T[a][k])||0;
L(`# chance-diag2 (POST-HOC, not a go criterion): DIR ${D}, seeds ${SEEDS.join(' ')}, WIN ${WIN} samples (${WIN*1000} ticks). Pooled over seeds per arm.`);
L('\n## 1a. New one-step types vs same-substrate incumbents (population proxy; no lineage data), outcome one window later');
L('arm | new types (all) | of which pathways (no substrate logged, excluded) | one-step new | no incumbent on substrate | coexist | replace | new lost | both lost | coexist share of (coexist+replace) | incumbent group wholly gone at w+1: with arrival / background without arrival | USED one-step new: coexist / replace');
for(const a of ARMS){ if(!T[a])continue; const n1=g(a,'new')-g(a,'newCh'), cx=g(a,'1a_coex'), rp=g(a,'1a_repl'), cu=g(a,'1aU_coex'), ru=g(a,'1aU_repl');
  L(`${a} | ${g(a,'new')} | ${g(a,'newCh')} (${pc(g(a,'newCh'),g(a,'new'))}) | ${n1} | ${pc(g(a,'1a_noinc'),n1)} | ${pc(cx,n1)} | ${pc(rp,n1)} | ${pc(g(a,'1a_newlost'),n1)} | ${pc(g(a,'1a_bothlost'),n1)} | ${pc(cx,cx+rp)} (n=${cx+rp}) | ${pc(g(a,'ar_lost'),g(a,'ar_n'))} / ${pc(g(a,'bg_lost'),g(a,'bg_n'))} | ${cu} / ${ru} (${pc(cu,cu+ru)})`); }
L('\n## 1a-est. Same, but incumbents = ESTABLISHED same-substrate one-step types (present in both w-2 and w-1)');
L('arm | cases | coexist | replace | new lost | both lost | coexist share of (coexist+replace) | established group wholly gone at w+1: with arrival / background without arrival');
for(const a of ARMS){ if(!T[a])continue; const n=g(a,'are_n'), cx=g(a,'1e_coex'), rp=g(a,'1e_repl'); L(`${a} | ${n} | ${pc(cx,n)} | ${pc(rp,n)} | ${pc(g(a,'1e_newlost'),n)} | ${pc(g(a,'1e_bothlost'),n)} | ${pc(cx,cx+rp)} (n=${cx+rp}) | ${pc(g(a,'are_lost'),n)} / ${pc(g(a,'bge_lost'),g(a,'bge_n'))}`); }
L('\n## 1b. Census per window (all types incl. pathways): entries of genuinely new types, re-entries of earlier-seen types, exits, net change in present types; body.kinds (full census) at 1/3 and end');
L('arm seed | windows | new entries/window (of which pathways) | re-entries/window | exits/window | net present-type change/window | exits per entry | kinds at 1/3 -> end');
for(const x of perSeed) L(`${x.a} ${x.s} | ${x.nW} | ${f1(x.ent)} (${f1(x.entCh)}) | ${f1(x.ree)} | ${f1(x.ext)} | ${x.dV>=0?'+':''}${f1(x.dV)} | ${x.ent?(x.ext/x.ent).toFixed(2):'-'} | ${f1(x.kMid)} -> ${f1(x.kEnd)}`);
L('\n## 2. Cause of death: genuinely new types gone one window later (shares of those deaths)');
L('arm | deaths (of new types) | demand vanished | still earning when lost (out-competed or drift) | declining | income never above readout (0.2% of all chemical income): CAUSE NOT DETERMINABLE | undetermined (censored at end) | USED deaths: n, demand / still earning / never | one-step still-earning deaths with a same-substrate riser (displaced)');
for(const a of ARMS){ if(!T[a])continue; const n=g(a,'d_n'), nu=g(a,'dU_n');
  L(`${a} | ${n} | ${pc(g(a,'d_demand'),n)} | ${pc(g(a,'d_earn'),n)} | ${pc(g(a,'d_decl'),n)} | ${pc(g(a,'d_never'),n)} | ${pc(g(a,'d_undet'),n)} | ${nu}, ${pc(g(a,'dU_demand'),nu)} / ${pc(g(a,'dU_earn'),nu)} / ${pc(g(a,'dU_never'),nu)} | ${g(a,'d1e_disp')}/${g(a,'d1e_n')} (${pc(g(a,'d1e_disp'),g(a,'d1e_n'))})`); }
L('\n## 2-vis. Restricted to deaths whose income was visible in >= 1 sample (the only ones whose cause can be read): counts');
L('arm | n | demand vanished | still earning when lost | declining | undetermined');
for(const a of ARMS){ if(!T[a])continue; L(`${a} | ${g(a,'dV_n')} | ${g(a,'dV_demand')} | ${g(a,'dV_earn')} | ${g(a,'dV_decl')} | ${g(a,'dV_undet')}`); }
L('\n## 2b. Same, split by kind: one-step (1s) vs pathway (Ch) deaths: n, demand / still earning / income never visible');
for(const a of ARMS){ if(!T[a])continue; const r=c=>{ const n=g(a,'d'+c+'_n'); return `${c} n=${n}: ${pc(g(a,'d'+c+'_demand'),n)} / ${pc(g(a,'d'+c+'_earn'),n)} / ${pc(g(a,'d'+c+'_never'),n)}`; }; L(`${a} | ${r('1s')} | ${r('Ch')}`); }
console.log(out.join('\n')); if(E.OUT)fs.writeFileSync(E.OUT,out.join('\n')+'\n');
}
