// Is "spits me out to the homescreen" an out-of-memory kill? Measure real process memory for a field
// booted from a normal genome vs one booted from the 1.18M-tick creature in every universe.
const { chromium } = require('playwright-core');
const fs=require('fs'), path=require('path'), http=require('http'), cp=require('child_process');
const ROOT='/home/user/selection-is-clean.';
const OLD="/root/.claude/uploads/0659dfc3-5df9-5f12-b58e-057778830720/10a73e00-selection_gen5405_t1183286.json";
const NEW="/tmp/claude-0/-home-user-selection-is-clean-/0659dfc3-5df9-5f12-b58e-057778830720/scratchpad/u1.json";
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json'};
const server=http.createServer((req,res)=>{
  const u=req.url.split('?')[0];
  const f=path.join(ROOT,(u==='/'?'/index.html':u));
  fs.readFile(f,(e,b)=>{ if(e){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'}); res.end(b); });
});
const rss=()=>{ try{
  const out=cp.execSync("ps -eo rss,args | grep '[c]hrome-linux/chrome' | awk '{s+=$1} END {print s}'").toString().trim();
  return Math.round((parseInt(out||'0',10))/1024); }catch(e){ return -1; } };

(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  for (const [tag,file] of [["NORMAL genome (u1, 72 atoms, dims 10)",NEW],["OLD creature (160 atoms, dims 32)",OLD]]){
    const genome=JSON.parse(fs.readFileSync(file,'utf8')).genome;
    const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
      args:['--no-sandbox','--disable-dev-shm-usage']});
    const ctx=await b.newContext({viewport:{width:412,height:915}});
    // seed the SHARED key before the field boots, so all nine come up on it — the author's exact state
    await ctx.addInitScript(g=>{ try{ localStorage.setItem('selection_genome',g); }catch(e){} }, genome);
    const p=await ctx.newPage();
    const baseRss=rss();
    await p.goto(base+'/#n=8',{waitUntil:'load'});
    console.log('\n  '+tag);
    console.log('     stored genome: '+genome.length.toLocaleString()+' chars');
    for(const t of [10,40,70,100]){
      await p.waitForTimeout(t===10?10000:30000);
      let N=0,ticks=0;
      try{ const s=await p.evaluate(async()=>{ let n=0,tk=0,c=0;
        for(const cell of document.querySelectorAll('.cell')){
          try{ const a=cell.firstChild.contentWindow.__field; if(a){ const st=await a.stat(); if(st){ n+=st.N|0; tk+=st.totalTicks|0; c++; } } }catch(e){}
        } return {n,tk,c}; }); N=s.n; ticks=s.c; }catch(e){}
      console.log('     t='+String(t).padStart(3)+'s   chrome RSS '+String(rss()).padStart(5)+' MB'
        +'   universes answering '+ticks+'   total particles '+N);
    }
    await b.close();
    await new Promise(r=>setTimeout(r,2000));
  }
  server.close();
})().catch(e=>{ console.log('  error: '+e.message); server.close(); process.exit(1); });
