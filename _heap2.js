const { chromium } = require('playwright-core');
const fs=require('fs'), path=require('path'), http=require('http'), cp=require('child_process');
const ROOT='/home/user/selection-is-clean.';
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json'};
const server=http.createServer((req,res)=>{
  const u=req.url.split('?')[0]; const f=path.join(ROOT,(u==='/'?'/index.html':u));
  fs.readFile(f,(e,b)=>{ if(e){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'}); res.end(b); });
});
function procs(){
  try{
    const out=cp.execSync("ps -eo rss,args | grep '[c]hrome-linux/chrome'").toString().trim().split('\n');
    const agg={};
    for(const line of out){
      const rss=parseInt(line.trim().split(/\s+/)[0],10)||0;
      const m=line.match(/--type=([a-zA-Z-]+)/);
      const k=m?m[1]:'browser';
      agg[k]=(agg[k]||0)+rss;
    }
    return Object.entries(agg).map(([k,v])=>k+' '+Math.round(v/1024)+'MB').join('  ')
      +'   TOTAL '+Math.round(Object.values(agg).reduce((a,b)=>a+b,0)/1024)+'MB';
  }catch(e){ return 'err '+e.message; }
}
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--no-sandbox','--disable-dev-shm-usage']});
  const ctx=await b.newContext({viewport:{width:412,height:915}});
  const blank=await ctx.newPage(); await blank.goto('about:blank');
  await new Promise(r=>setTimeout(r,3000));
  console.log('  BASELINE (about:blank)        '+procs());
  const p=await ctx.newPage();
  await p.goto(base+'/#n=8',{waitUntil:'load'});
  for(const t of [15,45,90]){ await new Promise(r=>setTimeout(r,t===15?15000:30000));
    console.log('  field #n=8 @'+String(t).padStart(3)+'s              '+procs()); }
  const h=await p.evaluate(async()=>{
    const out=[];
    for(const c of document.querySelectorAll('.cell')){
      try{ const a=c.firstChild.contentWindow.__field;
        out.push(a&&a.heapForTest?await a.heapForTest():null); }catch(e){ out.push(null); }
    } return out;
  });
  console.log('  per-worker isolate memory: '+JSON.stringify(h));
  await b.close(); server.close();
})().catch(e=>{ console.log('  error: '+e.message); server.close(); process.exit(1); });
