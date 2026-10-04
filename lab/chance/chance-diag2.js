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
