// probe19: TRACER v2 - follows registers, MEMORY and CONTROL FLOW, and credits opcodes at every SINK (not only the actions array).
// Taint element = opId | (flags << 10); flags: 1 = passed through memory, 2 = control-dependent. A register changed by an instruction takes the union of its operand registers' taint,
// the current control taint, and the op itself (ops 0-4 are not recorded). Memory: pMem slots of the driver and the partner are diffed after every instruction into a shadow memory keyed by the
// particle's genome object (it survives compaction); registers 4.. are loaded from it at the start of a main/solo run (slots 6,7 are re-derived from the world each run, so they carry nothing);
// the solo VM's end-of-run write-back is applied when the next run starts. Control flow: when vmStep returns a different ip, the condition register's taint joins a per-run control taint.
// Sinks: emitted actions (magnitude), the participants' state, the field cells under them, and births / deaths / program changes. Reads state only; draws no random numbers.
const fs=require('fs'), path=require('path'); const R=path.join(__dirname,'..','..');
require(path.join(R,'harness-env.js'))(globalThis);
try{ require(path.join(R,'harness-env.js')).applyKnobs(globalThis); }catch(_){}   // REPL etc.: an env knob with no applyKnobs call is a no-op that reads like a control
const code=fs.readFileSync(path.join(R,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/p19.js'); m.filename='/tmp/p19.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__p19=function(END,TRACE){
  const opt=n=>{ try{ return eval(n); }catch(e){ return null; } };
  const SCAL=['px','py','vx','vy','amp','phase','freq','localRes','collapse','pResistance','pSignalEmit','pType','pEpigen','pMode','pProvision'].map(opt).filter(a=>a&&a.length>1);
  const FIELDS=['field','field2','signalField','rootField','crystalField','detritalField','fieldMemory','fieldOwnership','towerTerritoryField','forestField','bridgeField','inhibitorField','corpseField','cellProgA','cellProgB','cellProgStr'].map(opt).filter(a=>a&&a.length>1);
  const RCMAX=vmRegs.length, NA=vmActions.length, D=DIMS, MS=MEM_SIZE;
  const SEG=['state_i','state_j','mem_i','mem_j','field_i','field_j','global']; const segLen=[SCAL.length+D+2, SCAL.length+D+2, MS, MS, FIELDS.length, FIELDS.length, 5];
  const segStart=[]; let tot=0; for(const l of segLen){ segStart.push(tot); tot+=l; }
  const bufB=new Float64Array(tot), bufA=new Float64Array(tot);
  const cellOf=i=>{ const fx=Math.max(0,Math.min(FIELD_W-1,Math.floor(px[i]/(W/FIELD_W)))), fy=Math.max(0,Math.min(FIELD_H-1,Math.floor(py[i]/(H/FIELD_H)))); return fy*FIELD_W+fx; };
  const take=(i,j,b)=>{ let k=0;
    for(const w of [i,j]){ if(w>=0&&w<N){ for(const a of SCAL)b[k++]=a[w]; for(let d=0;d<D;d++)b[k++]=tend[w*D+d]; b[k++]=pBroadcast[w*2]; b[k++]=pBroadcast[w*2+1]; } else { const n=SCAL.length+D+2; for(let q=0;q<n;q++)b[k++]=0; } }
    for(const w of [i,j]){ for(let q=0;q<MS;q++)b[k++]=(w>=0&&w<N)?pMem[w*MS+q]:0; }
    for(const w of [i,j]){ if(w>=0&&w<N){ const c=cellOf(w); for(const f of FIELDS)b[k++]=f[c]; } else for(let q=0;q<FIELDS.length;q++)b[k++]=0; }
    b[k++]=N; b[k++]=(i>=0&&i<N)?palive[i]:0; b[k++]=(j>=0&&j<N)?palive[j]:0; b[k++]=(i>=0&&i<N&&pProg[i])?pProg[i].length:0; b[k++]=(j>=0&&j<N&&pProg[j])?pProg[j].length:0; };
  const memT=new WeakMap(); const NOKEY={}; const keyOf=w=>(w>=0&&w<N&&pGenome[w])?pGenome[w]:NOKEY;
  const memOf=w=>{ const key=keyOf(w); let a=memT.get(key); if(!a){ a=[]; for(let q=0;q<MS;q++)a.push([]); memT.set(key,a); } return a; };
  const CAP=12; const uni=(...sets)=>{ const s=new Set(); for(const a of sets)for(const x of a)s.add(x); return s.size>CAP?[...s].slice(0,CAP):[...s]; };
  const mark=(a,f)=>a.map(e=>e|(f<<10));
  const tr=[]; for(let r=0;r<RCMAX;r++)tr.push([]); let pc=[]; let lastSolo=null;
  const exec=new Map(), evs={}; for(const s of ['action','actionUser','state','field','global'])evs[s]=[new Map(),new Map(),new Map()];   // [direct, memory, control]
  const actMag=[new Map(),new Map(),new Map()]; let baseMag=0, totMag=0;
  const bump=(mp,k,v)=>mp.set(k,(mp.get(k)||0)+v);
  const credit=(type,T,mag)=>{ for(const e of T){ const o=e&1023, fl=e>>10; const f=(fl&1)?1:((fl&2)?2:0); bump(evs[type][f],o,1); if(type==='action'||type==='actionUser')bump(actMag[f],o,mag); } };
  const bA=new Float32Array(NA); const bR=new Float32Array(RCMAX);
  const ov=vmStep;
  vmStep=function(op,src,dst,k,si,di,i,j,ip){
    if(!TRACE)return ov.apply(this,arguments);
    if(ip===0&&__vmMode!==VM_PLAS){
      if(lastSolo){ for(let q=0;q<MS;q++)memOf(lastSolo)[q]=tr[4+q].slice(); lastSolo=null; }
      for(let r=0;r<RCMAX;r++)tr[r]=[]; pc=[];
      if(__vmMode===VM_MAIN||__vmMode===VM_SOLO){ const mm=memOf(i); for(let q=0;q<MS&&4+q<RCMAX;q++){ if(q===6||q===7)continue; tr[4+q]=mark(mm[q],1); } }
      if(__vmMode===VM_SOLO)lastSolo=i;
    }
    const rc=Math.min(__vmRC,RCMAX); for(let r=0;r<rc;r++)bR[r]=vmRegs[r]; for(let a=0;a<NA;a++)bA[a]=vmActions[a];
    take(i,j,bufB);
    const srcT=uni((si>=0&&si<RCMAX)?tr[si]:[], (di>=0&&di<RCMAX)?tr[di]:[]); bump(exec,op,1);
    const out=ov.apply(this,arguments);
    const base=op>4?[op]:[]; const pcm=mark(pc,2);
    if(out!==ip){ pc=uni(pc, mark((si>=0&&si<RCMAX)?tr[si]:[],0), base); }
    const T=uni(srcT,pcm,base);
    for(let r=0;r<rc;r++){ if(vmRegs[r]!==bR[r])tr[r]=uni(srcT,tr[r],pcm,base); }
    for(let a=0;a<NA;a++){ const d=vmActions[a]-bA[a]; if(d!==0){ const ad=Math.abs(d); totMag+=ad; if(T.length===0)baseMag+=ad; else credit(a>=EFFECT_SLOT0?'actionUser':'action',T,ad); } }
    take(i,j,bufA);
    const diff=s=>{ for(let q=segStart[s],e=segStart[s]+segLen[s];q<e;q++)if(bufB[q]!==bufA[q])return true; return false; };
    if(diff(0)||diff(1)){ if(T.length)credit('state',T,0); }
    if(diff(4)||diff(5)){ if(T.length)credit('field',T,0); }
    if(diff(6)){ if(T.length)credit('global',T,0); }
    for(const [s,w] of [[2,i],[3,j]]){ if(w<0||w>=N)continue; if(diff(s)){ const mm=memOf(w); for(let q=0;q<MS;q++){ if(bufB[segStart[s]+q]!==bufA[segStart[s]+q])mm[q]=T.slice(); } } }
    return out; };
  const fp=[];
  for(let t=1;t<=END;t++){ loop(); if(t%250===0){ let n=0,sx=0,sy=0,sa=0,st=0; for(let q=0;q<N;q++){ if(!palive[q])continue; n++; sx+=px[q]; sy+=py[q]; sa+=amp[q]; st+=tend[q*DIMS]; } fp.push(n+'|'+sx.toFixed(3)+'|'+sy.toFixed(3)+'|'+sa.toFixed(4)+'|'+st.toFixed(4)); } }
  const d=mp=>[...mp.entries()]; const outEv={}; for(const s of Object.keys(evs))outEv[s]=evs[s].map(d);
  return {exec:d(exec),ev:outEv,actMag:actMag.map(d),baseMag,totMag,fp}; };
`, '/tmp/p19.js');
const t0=Date.now(); const res=globalThis.__p19(+(process.env.END||2000), process.env.TRACE!=='0');
fs.writeFileSync(process.env.OUT,JSON.stringify({seed:process.env.SEED,trace:process.env.TRACE!=='0',wallS:(Date.now()-t0)/1000,...res})); console.log('done',process.env.SEED,(Date.now()-t0)/1000+'s');
