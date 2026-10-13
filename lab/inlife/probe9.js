// probe9: which code sites produce successful parented births, in a normal world vs an all-blank world. Stack-trace attribution; draws no randomness.
const fs=require('fs'), path=require('path'); const R=path.join(__dirname,'..','..');
require(path.join(R,'harness-env.js'))(globalThis);
const raw=fs.readFileSync(path.join(R,'engine.html'),'utf8'); const lines=raw.split('\n');
const scriptStart=lines.findIndex(l=>l.includes('<script>'))+1;   // 1-based line of <script>
const code=raw.match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/p9.js'); m.filename='/tmp/p9.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__p9=function(MODE,T,END){
  const sites=new Map(); let on=false; const ENGLINES=${code.split("\n").length};
  const site=()=>{ const st=new Error().stack.split('\\n'); for(let i=2;i<st.length;i++){ const mm=st[i].match(/p9\\.js:(\\d+):/); if(mm&&+mm[1]<ENGLINES)return +mm[1]; } return -1; };
  const oP=addParticle,oC=addCompound;
  addParticle=function(x,y,tv,b,pa,pb){ const n0=N,r=oP.apply(this,arguments); if(on&&N>n0&&pa>=0){ const s='P@'+site(); sites.set(s,(sites.get(s)||0)+1); } return r; };
  addCompound=function(){ const n0=N,r=oC.apply(this,arguments); if(on&&N>n0&&arguments[8]>=0){ const s='C@'+site(); sites.set(s,(sites.get(s)||0)+1); } return r; };
  for(let t=1;t<=END;t++){ loop(); if(t===T){ on=true; if(MODE==='BLANK'){ for(let i=0;i<N;i++){ if(palive[i]&&pGenome[i]){ const c=[]; pProg[i]=c; pGenome[i].vmProgram=c; } } } }
    if(MODE==='BLANK'&&t>T&&(t-T)%20===0){ for(let i=0;i<N;i++){ if(palive[i]&&pGenome[i]&&pProg[i]&&pProg[i].length>0){ const c=[]; pProg[i]=c; pGenome[i].vmProgram=c; } } } }
  return [...sites.entries()].sort((a,b)=>b[1]-a[1]); };
`, '/tmp/p9.js');
const res=globalThis.__p9(process.env.MODE,1500,+(process.env.END||3500));
const out=res.map(([s,n])=>{ const L=+s.split('@')[1]; const el=L>0?scriptStart+L-1:-1; return {site:s,engineLine:el,count:n,text:(lines[el-1]||'').trim().slice(0,150)}; });
console.log(JSON.stringify(out));
