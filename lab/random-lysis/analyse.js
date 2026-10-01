// lab/random-lysis/analyse.js - the readout pre-registered in lab/PREREG-random-lysis.md.
// New active reactions per 30,000-tick window come from lab/core-chem.js (WIN=30, MIN=0.01), unchanged; the rest from raw rows.
//   node lab/random-lysis/analyse.js [dir]   (reads <arm>.<seed>.all.jsonl or .jsonl.gz)
'use strict';
const fs=require('fs'), zlib=require('zlib'), path=require('path'), cp=require('child_process');
const D=process.argv[2]||path.join(__dirname,'raw'), ARMS=['c','v','m','o','r'], SEEDS=[4,5,6];
const res={};
for(const s of SEEDS) for(const a of ARMS){
  let f=path.join(D,`${a}.${s}.all.jsonl`); let tmp=null;
  if(!fs.existsSync(f)&&fs.existsSync(f+'.gz')){ tmp=path.join(require('os').tmpdir(),`rl.${a}.${s}.all.jsonl`); fs.writeFileSync(tmp,zlib.gunzipSync(fs.readFileSync(f+'.gz'))); f=tmp; }
  if(!fs.existsSync(f))continue;
  const out=cp.execFileSync('node',[path.join(__dirname,'..','core-chem.js'),f],{env:Object.assign({},process.env,{SEED:String(s),WIN:'30',MIN:'0.01'}),maxBuffer:1<<28}).toString();
  const hd=out.split('\n')[0], m=hd.match(/reactions ever active (\d+) \| new per window ([\d,]*)/);
  const per=m[2]?m[2].split(',').map(Number):[];
  const rows=fs.readFileSync(f,'utf8').trim().split('\n').map(JSON.parse);
  const late=rows.filter(r=>r.t>300000&&r.t<=600000);
  const mean=xs=>xs.length?xs.reduce((x,y)=>x+y,0)/xs.length:NaN;
  res[a+s]={arm:a,seed:s,windows:per.length,late:per.slice(10,20).reduce((x,y)=>x+y,0),lateWin:per.slice(10,20).filter(x=>x>0).length,ever:+m[1],
    top:mean(late.filter(r=>r.chem&&r.chem.topRx&&r.chem.topRx.length).map(r=>r.chem.topRx[0][1])),N:mean(late.map(r=>r.N)),
    lysed:rows.reduce((x,r)=>x+(r.ev.lysed||0),0),lysedLate:late.reduce((x,r)=>x+(r.ev.lysed||0),0),reseeds:rows.at(-1).reseeds||0,lastT:rows.at(-1).t,per:per.join(',')};
  if(tmp)fs.unlinkSync(tmp);
}
console.log('arm seed | windows | NEW active rx, windows 11-20 (primary) | windows 11-20 with a new rx | ever active | commonest-rx share 300-600k | mean N 300-600k | lysed total / late | reseeds | new per window');
for(const s of SEEDS) for(const a of ARMS){ const x=res[a+s]; if(!x)continue;
  console.log(`${a} ${s} | ${x.windows} | ${x.late} | ${x.lateWin}/10 | ${x.ever} | ${x.top.toFixed(3)} | ${x.N.toFixed(0)} | ${x.lysed} / ${x.lysedLate} | ${x.reseeds} | ${x.per}`); }
console.log('\nVERDICT (v beats r strictly on all 3 seeds):');
let all=true; for(const s of SEEDS){ const v=res['v'+s], r=res['r'+s]; if(!v||!r){ all=false; console.log(`seed ${s}: missing`); continue; }
  const b=v.late>r.late; all=all&&b; console.log(`seed ${s}: v ${v.late} vs r ${r.late} -> ${b?'v beats r':'v does NOT beat r'}`);
  for(const o of ['c','m','o']) if(res[o+s]) console.log(`   (not ruling) v ${v.late} vs ${o} ${res[o+s].late} -> ${v.late>res[o+s].late?'v above':'v not above'}`); }
console.log(all?'=> PASSES: the virus makes more late novelty than matched random lysis on 3 of 3 seeds.':'=> NOT SHOWN: the virus does not beat matched random lysis on all 3 seeds.');
