// #249 — the ESTABLISHMENT census, shared. harness-establish ran it in its own process; the retire-or-prove
// template needs it on the SAME trajectory as harness-oee's entropyRatio and kinds, and running both rigs
// per arm per seed doubled the cost of every verdict. One copy of the census, two callers:
//   harness-establish.js     unchanged output (checked byte-identical against the pre-#249 rig)
//   harness-oee.js           ESTABLISH=<every> adds an "establishment" block from the same census
// Draws nothing: reads pLin/palive/lineageRegistry/tick. No backticks - the DRIVER is compiled with the engine.
module.exports.DRIVER=[
';globalThis.__esNew=function(){',
'  var out={rows:[],err:null,first:{},peak:{}};',
'  out.census=function(){',
'    var cnt=new Map(), n=0;',
'    for(var i=0;i<N;i++){ if(!palive[i])continue; n++; var l=pLin[i]; cnt.set(l,(cnt.get(l)||0)+1); }',
'    var s2=0, topL=-1, topN=0;',
'    cnt.forEach(function(c,l){ var p=c/(n||1); s2+=p*p; if(c>topN){topN=c;topL=l;}',
'      if(out.first[l]===undefined) out.first[l]=tick; if(!(out.peak[l]>=c)) out.peak[l]=c; });',
'    var e=lineageRegistry.get(topL);',
'    out.rows.push({t:tick,alive:n,lineages:cnt.size,effN:s2>0?1/s2:0,top:topL,topShare:topN/(n||1),',
'      topBorn:e?e.birthTick:null});',
'  };',
'  return out;',
'};',
';globalThis.__es=function(T,EVERY){',
'  var out=globalThis.__esNew();',
'  out.census();',
'  for(var step=0;step<T;step++){',
'    globalThis.__detMs+=5;',
'    try{ loop(); }catch(e){ if(!out.err) out.err=String(e&&e.message||e); }',
'    if((step+1)%EVERY===0) out.census();',
'  }',
'  return out;',
'};'
].join('\n');
module.exports.summarize=function(r,o){
  const WARM=o.WARM, ESTN=o.ESTN;
  let late=0, est=0;
  for(const l in r.first){ if(r.first[l]>WARM){ late++; if(r.peak[l]>=ESTN) est++; } }
  let take=0, swaps=0;
  for(let k=1;k<r.rows.length;k++){ const a=r.rows[k-1], b=r.rows[k];
    if(a.top!==b.top){ swaps++; if(b.topBorn!==null&&a.topBorn!==null&&b.topBorn>a.topBorn) take++; } }
  const third=Math.floor(r.rows.length/3), mean=(f,a,b)=>{let s=0;for(let k=a;k<b;k++)s+=r.rows[k][f];return s/Math.max(1,b-a);};
  return {seed:o.seed,ticks:o.ticks,err:r.err,
    lateLineages:late, established:est, estFrac:late?+(est/late).toFixed(4):null, takeovers:take, topSwaps:swaps,
    effN_early:+mean('effN',1,third+1).toFixed(2), effN_late:+mean('effN',r.rows.length-third,r.rows.length).toFixed(2),
    topShare_late:+mean('topShare',r.rows.length-third,r.rows.length).toFixed(3),
    alive_late:+mean('alive',r.rows.length-third,r.rows.length).toFixed(0),
    lastTopAge:r.rows.length?(r.rows[r.rows.length-1].t-(r.rows[r.rows.length-1].topBorn||0)):null};
};
