// #231 — PER-OPCODE EQUIVALENCE between two engines. The test that proved the dispatch fold byte-identical,
// and the one that refused #231b's misreading of op 179, kept so the next change to vmStep can be held to it.
//
// Both engines boot on the same seed and warm up; then EVERY opcode 0..440 is driven through EACH machine
// (particle, plasmid, cluster, solo), three operand sets each, and the full state is hashed after every
// single execution: registers, actions, every particle array, the field and inscription arrays, programs,
// the genome, and the next random draw. The first line where the two engines disagree names the machine
// and the op. State is cumulative, so everything after that line differs too - read the FIRST one.
//
//   node vm-equiv.js <engineA.html> [engineB.html]     (B defaults to engine.html)
//   SEED=1  WARM=400  PASS=A|B  OPS=9,13 | OPS=not:9,13  (B forces every *Influence/*Strength gene to 0.5
//   so the gated bodies run; OPS restricts which ops are driven - an excluded op still runs in the warm-up)
//
// Two cautions it has already paid for: (1) the WARM-UP runs the real simulation, so an engine change that
// executes naturally there shows up at the first line even if that op is excluded; (2) the hash includes
// the genome's JSON, and a genome carries bookkeeping (an event log records a serialized blob's LENGTH),
// so a new liveness name alone can differ it. Diff the state before calling a difference behaviour.
// Exits 0 when identical, 1 when not. With one argument and B = the same file it is a self-check.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
if(process.argv[2]==='--one'){
  try{ require(path.join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
  require(path.join(__dirname,'harness-env.js'))(globalThis);
  const ENG=process.argv[3], WARM=+(process.env.WARM||process.env.TICKS||400), PASS=process.env.PASS||'A';
  const OPS=process.env.OPS||'';const neg=OPS.startsWith('not:');const L=new Set((neg?OPS.slice(4):OPS).split(',').filter(Boolean).map(Number));
  const OPSOK=op=>!OPS?true:(neg?!L.has(op):L.has(op));
  const code=fs.readFileSync(ENG,'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
  const Module=require('module');const m=new Module('/tmp/vmeq.js');m.filename='/tmp/vmeq.js';m.paths=Module._nodeModulePaths('/tmp');
  m._compile(code+`
;globalThis.__EQ=function(WARM,PASS,crypto,OPSOK){
  let err0=0; for(let s=0;s<WARM;s++){ globalThis.__detMs+=5; try{loop();}catch(e){err0++;} }
  const out=[]; out.push('warm errs '+err0+' N '+N+' tick '+tick);
  function H(){ const h=crypto.createHash('sha1');
    const arrs={vmRegs,vmActions,amp,px,py,vx,vy,tend,pMem,field,cellProgStr,cellProgOp,cellProgA,cellProgB,localRes,pProvision,pBroadcast,pEpigen,pMode,phase,freq,pPlasmidLen,pPlasmid};
    for(const k in arrs){const a=arrs[k]; if(a&&a.buffer) h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)); else h.update(String(a));}
    h.update(String(N)+'|'+birthQueue.length+'|'+JSON.stringify(birthQueue.slice(-3),(k,v)=>v&&v.buffer?Array.from(v):v));
    h.update(JSON.stringify(pProg.slice(0,Math.min(N,64))));
    try{h.update(JSON.stringify(genome,(k,v)=>typeof v==='function'?undefined:(v&&v.buffer?Array.from(v):v)));}catch(e){h.update('G!'+e.message);}
    h.update(String(Math.random()));
    return h.digest('hex').slice(0,16);}
  if(PASS==='B'){ for(const k of Object.keys(genome)) if(/Influence$|Strength$/.test(k)&&typeof genome[k]==='number') genome[k]=0.5; }
  let i=-1,j=-1; for(let q=0;q<N;q++){ if(!palive[q])continue; if(i<0)i=q; else if(j<0){j=q;break;} }
  let ci=-1; for(let q=0;q<N;q++){ if(palive[q]&&clusterID[q]>=0){const cx=clusterID[q]<MAX_CLUSTERS?clusterByID[clusterID[q]]:-1; if(cx>=0&&clusters[cx]&&clusters[cx].vmProgram){ci=q;break;}} }
  out.push('actors '+i+' '+j+' clusterActor '+ci);
  let seed=12345; const R=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
  const savedProg=pProg.slice();
  for(const mode of ['MAIN','PLAS','CLUS','SOLO']){
    for(let op=0;op<=440;op++){ if(!OPSOK(op))continue;
      for(let v=0;v<3;v++){
        const src=Math.floor(R()*24),dst=Math.floor(R()*24),k=(R()-0.5)*4;
        const inst=[op,src,dst,k]; let e='';
        try{
          if(mode==='MAIN'){ pPlasmidLen[i]=0; pProg[i]=[inst]; executeVM(i,j,0.7,10); }
          else if(mode==='PLAS'){ pProg[i]=[]; pPlasmidLen[i]=1; const b=i*PLASMID_SLOTS; pPlasmid[b]=op;pPlasmid[b+1]=src;pPlasmid[b+2]=dst;pPlasmid[b+3]=k; executeVM(i,j,0.7,10); pPlasmidLen[i]=0; }
          else if(mode==='CLUS'){ if(ci<0){e='nocl';} else { const cl=clusters[clusterByID[clusterID[ci]]]; cl.vmProgram=[inst]; const jj=(ci===j?i:j); executeClusterVM(ci,jj,0.7,10);} }
          else { for(let q=0;q<N;q++) if(palive[q]) pProg[q]=[inst.slice()]; executeSoloVM(); }
        }catch(ex){ e='ERR '+String(ex&&ex.message).slice(0,80); }
        out.push(mode+' '+op+' '+v+' '+e+' '+H());
      }
      for(let q=0;q<N;q++) pProg[q]=savedProg[q];
    }
  }
  return out;
};`,'/tmp/vmeq.js');
  process.stdout.write(globalThis.__EQ(WARM,PASS,crypto,OPSOK).join('\n')+'\n');
  process.exit(0);
}
const A=process.argv[2]||path.join(__dirname,'engine.html'), B=process.argv[3]||path.join(__dirname,'engine.html');   // no argument: a self-check, which is what smoke.sh runs
if(!A){ console.log('usage: node vm-equiv.js <engineA.html> [engineB.html]'); process.exit(2); }
const run=f=>cp.execFileSync(process.execPath,[__filename,'--one',f],{env:process.env,maxBuffer:1<<28}).toString().split('\n');
const a=run(A), b=run(B);
let first=-1; for(let k=0;k<Math.max(a.length,b.length);k++) if(a[k]!==b[k]){ first=k; break; }
const execs=a.filter(l=>/^(MAIN|PLAS|CLUS|SOLO) /.test(l)).length;
if(first<0){ console.log(JSON.stringify({identical:true,executions:execs,warm:a[0],seed:process.env.SEED||'1',pass:process.env.PASS||'A',ops:process.env.OPS||'all'})); process.exit(0); }
console.log(JSON.stringify({identical:false,firstDifference:{line:first,a:a[first],b:b[first]},executions:execs,warm:[a[0],b[0]]}));
process.exit(1);
