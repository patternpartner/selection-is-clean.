// #438b: an open world's snapshot round trip under node. Runs a world until it has opened inputs, saves the open state (oSave),
// wipes it, loads it back (oLoad) and checks the input count, every ground key and the record; then loads the same ground written at
// a WIDER word (as the first shipped version saved it, 32 words a table) and checks the keys again.
//   SEED=12 TICKS=6000 node lab/port/open-save-test.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
process.env.TASKS='1'; process.env.MIND=process.env.MIND||'20'; process.env.SEED=process.env.SEED||'12';
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/open-save.js'); m.filename='/tmp/open-save.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__T=function(ticks){ for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; loop(); }
  const out=[], ok=(n,c,d)=>out.push((c?'ok    ':'FAIL  ')+n+'   '+d);
  const n0=tNin, keys=Array.from(tG), filled=keys.filter(k=>k!==0).length, logN=oLogN, w={}; oSave(w);
  ok('the world opened an input', n0>5, 'inputs '+n0+', ground cells filled '+filled+', record '+logN);
  const wipe=()=>{ tG.fill(0); tGZ.fill(0); oG.fill(0); oLogN=0; tNin=5; oWD=1; };
  wipe(); oLoad(JSON.parse(JSON.stringify(w.open)));
  let same=0; for(let c=0;c<keys.length;c++) if(tG[c]===keys[c])same++;
  ok('reload: inputs', tNin===n0, tNin+' of '+n0); ok('reload: every ground key', same===keys.length, same+' of '+keys.length); ok('reload: the record', oLogN===logN, oLogN+' of '+logN);
  const cells=FIELD_W*FIELD_H, wide=new Uint32Array(cells*32); for(let c=0;c<cells;c++) for(let x=0;x<32;x++)wide[c*32+x]=oG[c*OWM+(x&(OWM-1))];
  const u=new Uint8Array(wide.buffer); let b=''; for(let q=0;q<u.length;q++)b+=String.fromCharCode(u[q]); const O=JSON.parse(JSON.stringify(w.open)); O.g=btoa(b);
  wipe(); oLoad(O); same=0; for(let c=0;c<keys.length;c++) if(tG[c]===keys[c])same++;
  ok('a ground saved 32 words wide loads at '+OWM, same===keys.length&&tNin===n0, same+' of '+keys.length);
  return out; };`, m.filename);
const out=globalThis.__T(parseInt(process.env.TICKS||'6000',10)); console.log(out.join('\n')); const bad=out.filter(l=>l.startsWith('FAIL')).length;
console.log(bad?bad+' FAILED':'all '+out.length+' ok'); process.exit(bad?1:0);
