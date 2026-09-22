// FECUNDITY — does a higher amp buy more offspring?
//
// Particle selection is said to sort on amp (applySelfModel's comment: "particle-level selection sorts
// on amp"), and 76 sites in the engine add to amp on that premise. Every harness run at 20k ticks has
// 70-90% of the living at the 1.2 soft line. LEAP 3 banks surplus above it as pProvision rather than
// clipping it, so pinning alone does not prove the differential is lost. The question is empirical:
// per particle-tick, how many births does a particle at amp a, provision p, actually parent?
//
// Both birth functions (addParticle, addCompound) are wrapped from the driver -- they are module-scope
// function declarations, so the binding is replaceable -- and each successful parented birth credits
// both parents at their amp and provision AT THE MOMENT OF BIRTH. Exposure (particle-ticks) is counted
// per bin every tick over the living. Deaths are counted the same way, from palive transitions.
// DRAWS NOTHING. No backticks.
// Env: SEED TICKS (default 8000) WARM (default 1500, exposure and births counted only after)
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
require(path.join(__dirname,'harness-env.js')).applyKnobs(globalThis);
const TICKS=parseInt(process.env.TICKS||'8000',10), WARM=parseInt(process.env.WARM||'1500',10);
const html=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8');
const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
const DRIVER=[
';globalThis.__fc=function(T,WARM){',
'  var AB=[0,0.2,0.4,0.6,0.8,1.0,1.15,1.1999,1e9];',   // last bin: at the soft line
'  var PB=[0,0.01,0.5,1.5,3,1e9];',
'  var ab=function(a){ for(var k=0;k<AB.length-1;k++) if(a<AB[k+1]) return k; return AB.length-2; };',
'  var pb=function(p){ for(var k=0;k<PB.length-1;k++) if(p<PB[k+1]) return k; return PB.length-2; };',
'  var expA=new Float64Array(8), birA=new Float64Array(8), dieA=new Float64Array(8);',
'  var expP=new Float64Array(5), birP=new Float64Array(5), dieP=new Float64Array(5);',
'  var expI=new Float64Array(10), birI=new Float64Array(10), ib=function(i){ return Math.min(9,Math.floor(10*i/Math.max(1,N))); };',
'  var on=false, err=null, wasAlive=new Uint8Array(CAP), lastA=new Float64Array(CAP), lastP=new Float64Array(CAP);',
'  var credit=function(pa){ if(!on||pa===undefined||pa===null||pa<0||pa>=N||!palive[pa]) return;',
'    birA[ab(amp[pa])]++; birP[pb(pProvision[pa]||0)]++; birI[ib(pa)]++; };',
'  var _ap=addParticle, _ac=addCompound;',
'  addParticle=function(x,y,tv,born,pA,pB){ var r=_ap.apply(this,arguments); if(r>=0){ credit(pA); credit(pB); } return r; };',
'  addCompound=function(x,y,nt,a,b,c,d,e,pA,pB){ var r=_ac.apply(this,arguments); if(r>=0){ credit(pA); credit(pB); } return r; };',
'  for(var step=0;step<T;step++){',
'    globalThis.__detMs+=5; on=(tick>=WARM);',
'    try{ loop(); }catch(e){ if(!err) err=String(e&&e.message||e); }',
'    if(!on) continue;',
'    for(var i=0;i<N;i++){',
'      if(palive[i]){ expI[ib(i)]++; expA[ab(amp[i])]++; expP[pb(pProvision[i]||0)]++; lastA[i]=amp[i]; lastP[i]=pProvision[i]||0; wasAlive[i]=1; }',
'      else if(wasAlive[i]){ dieA[ab(lastA[i])]++; dieP[pb(lastP[i])]++; wasAlive[i]=0; }',
'    }',
'  }',
'  return {AB:AB,PB:PB,expA:Array.from(expA),birA:Array.from(birA),dieA:Array.from(dieA),expP:Array.from(expP),birP:Array.from(birP),dieP:Array.from(dieP),expI:Array.from(expI),birI:Array.from(birI),err:err};',
'};'
].join('\n');
const Module=require('module');
const mod=new Module('/tmp/fecundity.js'); mod.filename='/tmp/fecundity.js'; mod.paths=Module._nodeModulePaths('/tmp');
mod._compile(code+DRIVER,'/tmp/fecundity.js');
const r=globalThis.__fc(TICKS,WARM);
console.log('FECUNDITY seed='+(process.env.SEED||'1')+' ticks='+TICKS+' warm='+WARM+(r.err?' ERR '+r.err:''));
const tot=r.expA.reduce((a,b)=>a+b,0);
console.log(' amp band        share   births/1k p-ticks   deaths/1k p-ticks');
for(let k=0;k<r.expA.length;k++){ if(!r.expA[k])continue;
  const lo=r.AB[k], hi=r.AB[k+1]>1e8?'':r.AB[k+1];
  console.log('  '+(lo+'-'+hi).padEnd(13)+(100*r.expA[k]/tot).toFixed(1).padStart(6)+'%'+(1000*r.birA[k]/r.expA[k]).toFixed(3).padStart(14)+(1000*r.dieA[k]/r.expA[k]).toFixed(3).padStart(20)); }
console.log(' provision band');
for(let k=0;k<r.expP.length;k++){ if(!r.expP[k])continue;
  const lo=r.PB[k], hi=r.PB[k+1]>1e8?'':r.PB[k+1];
  console.log('  '+(lo+'-'+hi).padEnd(13)+(100*r.expP[k]/tot).toFixed(1).padStart(6)+'%'+(1000*r.birP[k]/r.expP[k]).toFixed(3).padStart(14)+(1000*r.dieP[k]/r.expP[k]).toFixed(3).padStart(20)); }
console.log(' array-index decile (0 = lowest index; the birth loop runs i=0..N)');
for(let k=0;k<10;k++){ if(!r.expI[k])continue; console.log('  '+String(k).padEnd(13)+(100*r.expI[k]/tot).toFixed(1).padStart(6)+'%'+(1000*r.birI[k]/r.expI[k]).toFixed(3).padStart(14)); }
if(process.env.JSON) fs.writeFileSync(process.env.JSON,JSON.stringify(r));
