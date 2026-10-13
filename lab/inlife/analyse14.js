// analysis for PREREG-vm-retire-or-prove.md (first attempt, d14) and -b.md (second attempt, d15, BLANK=BLANKVM=2). node analyse14.js <dir> [d14|d15]   files: <seed>-BLANK-0.json and <seed>-CTRL-<0..5>.json (harness-oee.js stdout)
const fs=require('fs'); const FOLDER=process.argv[3]||'d14'; const D=process.argv[2]+'/'+FOLDER; const SECOND=FOLDER==='d15'; const seeds=SECOND?[96,97,98,99,100,101]:[91,92,93,94,95];
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
const load=(s,m,k)=>{ const f=`${D}/${s}-${m}-${k}.json`; if(!fs.existsSync(f)||!fs.statSync(f).size)return null; try{ return JSON.parse(fs.readFileSync(f,'utf8')); }catch(e){ return null; } };
const M=j=>({ cer:j.verdict.diversity_trend.centredEntropyRatio, spread:j.verdict.diversity_trend.spread_late, est:j.establishment?j.establishment.estFrac:null, alive:j.establishment?j.establishment.alive_late:null,
  er:j.verdict.diversity_trend.entropyRatio, kinds:j.verdict.diversity_trend.kinds_late, prog:j.popProgLen, errs:(j.loopErrors||0)+(j.driverErr||0), N:j.series[j.series.length-1].N });
// thresholds (pre-registered): cer 0.05 absolute; spread 10% of control mean; est 25% relative to control mean (0 vs 0 = no move)
const thr={ cer:(c,b)=>Math.abs(b-c)>0.05, spread:(c,b)=>Math.abs(b-c)>0.10*Math.abs(c), est:(c,b)=>c===0?(b!==0):Math.abs(b-c)>0.25*Math.abs(c) };
const rows=[]; const out=[];
for(const s of seeds){ const B=load(s,'BLANK',0), C=[0,1,2,3,4,5].map(k=>load(s,'CTRL',k));
  if(!B||C.some(x=>!x)){ out.push(`${s}: incomplete (BLANK ${!!B}, controls ${C.filter(x=>x).length}/6)`); continue; }
  const b=M(B), call=C.map(M);
  const c=SECOND?call.filter(x=>x.N>=5&&x.errs===0):call;
  const crashC=call.length-c.length;
  const manip=SECOND?(b.prog<=1.5&&c.every(x=>x.prog>5)):(b.prog<1&&c.every(x=>x.prog>5)), clean=SECOND?(b.errs===0&&c.length>=4):(b.errs===0&&c.every(x=>x.errs===0)), alive=SECOND?true:(b.N>=5&&c.every(x=>x.N>=5));
  const counted=manip&&clean&&alive; const info={s,b,c,counted,manip,clean,alive,moves:{},crashC,crashB:b.N<5};
  for(const k of ['cer','spread','est']){ const vals=c.map(x=>x[k]); const cm=mean(vals); const lo=Math.min(...vals), hi=Math.max(...vals);
    const outside=b[k]<lo||b[k]>hi, beyond=thr[k](cm,b[k]); info.moves[k]=(outside&&beyond)?(b[k]>cm?'UP':'DOWN'):'none'; info['ctrl_'+k]=[cm,lo,hi]; }
  rows.push(info);
  out.push(`${s}${counted?'':' (NOT COUNTED: manip '+manip+' clean '+clean+' alive '+alive+')'}${SECOND?'  [controls excluded as crashed: '+crashC+'; BLANK ended extinct: '+(b.N<5)+']':''}  popProgLen BLANK ${b.prog} CTRL ${c.map(x=>x.prog).join(',')}  N BLANK ${b.N} CTRL ${c.map(x=>x.N).join(',')}`
    +`\n     cER BLANK ${b.cer} | CTRL mean ${info.ctrl_cer[0].toFixed(2)} [${info.ctrl_cer[1]},${info.ctrl_cer[2]}] -> ${info.moves.cer}`
    +`\n     spread BLANK ${b.spread} | CTRL mean ${info.ctrl_spread[0].toFixed(3)} [${info.ctrl_spread[1]},${info.ctrl_spread[2]}] -> ${info.moves.spread}`
    +`\n     estFrac BLANK ${b.est} | CTRL mean ${info.ctrl_est[0].toFixed(4)} [${info.ctrl_est[1]},${info.ctrl_est[2]}] -> ${info.moves.est}`
    +`\n     (reported) entropyRatio BLANK ${b.er} CTRL ${c.map(x=>x.er).join(',')} | kinds_late BLANK ${b.kinds} CTRL ${c.map(x=>x.kinds).join(',')}`); }
console.log(out.join('\n'));
const counted=rows.filter(r=>r.counted); console.log('\ncounted seeds:',counted.length,'of',seeds.length);
if(counted.length<3){ console.log('VERDICT: INCONCLUSIVE (fewer than 3 counted seeds); the default does not change'); process.exit(); }
const need=Math.ceil(counted.length*2/3);
const tally={}; for(const k of ['cer','spread','est']){ tally[k]={UP:counted.filter(r=>r.moves[k]==='UP').length, DOWN:counted.filter(r=>r.moves[k]==='DOWN').length, none:counted.filter(r=>r.moves[k]==='none').length}; }
console.log('moves per measure (BLANK vs control band):',JSON.stringify(tally),' need',need,'seeds for a verdict');
const worse=['cer','spread','est'].filter(k=>tally[k].UP>=need), better=['cer','spread','est'].filter(k=>tally[k].DOWN>=need);
const noMove=counted.filter(r=>['cer','spread','est'].every(k=>r.moves[k]==='none')).length;
let v;
if(worse.length&&better.length) v='SPLIT (default does not move)';
else if(worse.length) v='WORSE: the world is better without the VM programs on '+worse.join(',')+' -> DELETE or DORMANT (the user decides; saved worlds)';
else if(better.length) v='BETTER: the VM earns its place on '+better.join(',')+' -> KEEP';
else if(noMove>=need) v='DECORATION: no ruling measure moved on '+noMove+' of '+counted.length+' counted seeds -> DELETE unless the note names a dependency (the user decides; saved worlds)';
else v='KEEP, default does not move: BLANK changes the world on some seeds with no consistent direction';
console.log('seeds with no measure moving:',noMove,'of',counted.length); console.log('VERDICT:',v);
