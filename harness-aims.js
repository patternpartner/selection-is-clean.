// THE AIM CENSUS — what are lineages actually wanting, and what is paying them for it?
//
// #218c-k gave every lineage a portfolio of self-chosen set-points and #218h put their mean
// satisfaction into the world's own fitness at weight 0.35. #218's own notes name the risk first:
// that term is read from state the genome controls, which #184 says a fitness proxy must never be.
// This rig asks the question directly instead of arguing it: at each sample, over the LIVING
// population, which senses do aims sit on, how satisfied is each, and how much of the satisfaction is
// an aim meeting a value nothing is moving.
//
// THE SPECIFIC SUSPICION. The literal seeds every lineage with {sense:6,target:0} -- memory slot 0,
// target zero. pMem starts at zero. A lineage whose program never writes slot 0 meets that aim
// exactly, every tick, for nothing, and selection is then paying for NOT computing. "STILL" below
// counts aims whose sensed value is exactly the value it held at the previous sample -- a sense
// that has not moved between samples is a constant being wanted, whatever it is called.
//
// DRAWS NOTHING (CLAUDE.md trap 3): plain reads of pGenome/pMem/amp and the engine's own arrays.
// The one engine call is loop(). No backticks (trap 1): driver is a joined string.
//
// Env: SEED (default 1)  TICKS (default 20000)  SAMPLES (default 5)  plus every KNOBS entry.
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
require(path.join(__dirname,'harness-env.js')).applyKnobs(globalThis);
const TICKS=parseInt(process.env.TICKS||'20000',10);
const NSAMP=Math.max(2,parseInt(process.env.SAMPLES||'5',10));
const html=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8');
const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
const DRIVER=[
';globalThis.__ac=function(T,pts){',
'  var out={samples:[],err:null}, prev=null;',
'  var snap=function(){',
'    var nS=aimSenseCount(), by=[], cur={};',
'    for(var k=0;k<nS;k++) by.push({n:0,pay:0,still:0,zero:0,tol:0,w:0});',
'    var alive=0, withAims=0, aimsTot=0, satSum=0, satN=0, stillPay=0, payTot=0;',
'    for(var i=0;i<N;i++){ if(!palive[i])continue; alive++;',
'      var g=pGenome[i], as=aimsOf(g); if(!as||!as.length)continue; withAims++;',
'      for(var a=0;a<as.length;a++){ var A=as[a]; if(!A)continue;',
'        var kk=(((A.sense|0)%nS)+nS)%nS, v=aimSense(kk,i); if(v===null)continue;',
'        var sp=aimSpan(kk), t=finiteOr(A.target,0);',
'        if(Array.isArray(g.novelGenes)&&g.novelGenes.length&&g.novelGenes[0]) t+=__cl(finiteOr(g.novelGenes[0].v,0),-1,1)*sp*0.5;',
'        var tl=__cl(finiteOr(A.tol,1),AIM_TOL_LO,AIM_TOL_HI), e=Math.abs(v-t)/(sp||1);',
'        var pay=Math.max(0,1-e/tl)*2/(1+tl), w=__cl(finiteOr(A.weight,0),0,AIM_WEIGHT_MAX);',
'        var key=i+":"+kk; cur[key]=v; var still=(prev&&prev[key]===v)?1:0;',
'        var b=by[kk]; b.n++; b.pay+=pay; b.still+=still; b.zero+=(v===0?1:0); b.tol+=tl; b.w+=w;',
'        aimsTot++; satSum+=pay; satN++; payTot+=w*pay; if(still) stillPay+=w*pay; }',
'    }',
'    prev=cur;',
'    return {t:tick,alive:alive,withAims:withAims,aimsPer:withAims?aimsTot/withAims:0,',
'      meanSat:satN?satSum/satN:0, stillShare:payTot>0?stillPay/payTot:0, by:by};',
'  };',
'  out.samples.push(snap());',
'  for(var step=0;step<T;step++){',
'    globalThis.__detMs+=5;',
'    try{ loop(); }catch(e){ if(!out.err) out.err=String(e&&e.message||e); }',
'    for(var p=0;p<pts.length;p++){ if(pts[p]===step+1){ out.samples.push(snap()); }',
'      else if(pts[p]===step+2){ snap(); } }',   // a sample one tick before each real one, so STILL means "did not move over one tick"
'  }',
'  return out;',
'};'
].join('\n');
const Module=require('module');
const mod=new Module('/tmp/aim-census.js');
mod.filename='/tmp/aim-census.js'; mod.paths=Module._nodeModulePaths('/tmp');
mod._compile(code+DRIVER,'/tmp/aim-census.js');
const pts=[]; for(let i=1;i<NSAMP;i++) pts.push(Math.round(TICKS*i/(NSAMP-1)));
const res=globalThis.__ac(TICKS,pts);
const names=['amp','res','age','collapse','freq','phase','mem0','mem1','mem2','mem3','mem4','mem5','mem6','mem7'];
console.log('AIM CENSUS  seed='+(process.env.SEED||'1')+'  ticks='+TICKS+'  AIM='+(globalThis.__AIM??1)+(res.err?'  ERR '+res.err:''));
for(const s of res.samples){
  console.log('\n t='+s.t+'  alive='+s.alive+'  withAims='+s.withAims+'  aims/lineage='+s.aimsPer.toFixed(2)+
    '  meanSat='+s.meanSat.toFixed(3)+'  payFromStill='+(s.stillShare*100).toFixed(1)+'%');
  const tot=s.by.reduce((a,b)=>a+b.n,0)||1;
  for(let k=0;k<s.by.length;k++){ const b=s.by[k]; if(!b.n)continue;
    console.log('   '+names[k].padEnd(9)+(100*b.n/tot).toFixed(1).padStart(5)+'% of aims  sat '+(b.pay/b.n).toFixed(3)+
      '  still '+(100*b.still/b.n).toFixed(0).padStart(3)+'%  ==0 '+(100*b.zero/b.n).toFixed(0).padStart(3)+'%  tol '+(b.tol/b.n).toFixed(2)+'  w '+(b.w/b.n).toFixed(2)); }
}
if(process.env.JSON) fs.writeFileSync(process.env.JSON,JSON.stringify(res));
