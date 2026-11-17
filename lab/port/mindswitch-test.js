// #448 - the per-universe mind switch, in a real field. By default the collective's mind learns and no other does; a universe's own
// switch (its mind button, __field.mindMode) changes its mind while it runs; the choice survives a reload; #nocollearn leaves none learning.
//   node lab/port/mindswitch-test.js
const http=require('http'),fs=require('fs'),path=require('path'); const ROOT=path.join(__dirname,'..','..');
let pw; try{ pw=require('playwright'); }catch(e){ try{ pw=require('playwright-core'); }catch(_){ console.log('SKIP: no playwright'); process.exit(0); } }
const out=[], ck=(n,c,d)=>{ out.push((c?'  ok    ':'  FAIL  ')+n+'   '+d); };
(async()=>{ const srv=http.createServer((q,r)=>{ const u=q.url.split('?')[0]; const f=path.join(ROOT,u==='/'?'index.html':u); fs.readFile(f,(e,d)=>{ if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{'content-type':u.endsWith('.js')?'text/javascript':'text/html'}); r.end(d); }); });
  await new Promise(z=>srv.listen(0,'127.0.0.1',z)); const base='http://127.0.0.1:'+srv.address().port; const b=await pw.chromium.launch(); const ctx=await b.newContext({viewport:{width:412,height:915}}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  const modes=()=>p.evaluate(async()=>{ const o=[]; for(const f of [...document.querySelectorAll('#grid iframe')]){ try{ const a=f.contentWindow.__field; const m=await Promise.race([a.mindMode(),new Promise(z=>setTimeout(()=>z('timeout'),6000))]); o.push([f.title,m]); }catch(e){ o.push([f.title,'err']); } } return o; });
  const W=+(process.env.WAIT||25000);
  await p.goto(base+'/index.html#n=2,layers=0'); await p.waitForTimeout(W); let m=await modes();
  ck('by default the collective learns and the others do not', m.length===3&&m.filter(x=>x[0]==='The collective'&&x[1]==='learn').length===1&&m.filter(x=>x[0]!=='The collective'&&x[1]==='draw').length===2, JSON.stringify(m));
  const set=await p.evaluate(async()=>{ const f=[...document.querySelectorAll('#grid iframe')].find(x=>x.title==='Universe 1'); return await f.contentWindow.__field.mindMode('learn'); });
  m=await modes(); ck('a universe switched to learning learns, at once', set==='learn'&&m.find(x=>x[0]==='Universe 1')[1]==='learn'&&m.find(x=>x[0]==='Universe 2')[1]==='draw', 'answer '+set+' '+JSON.stringify(m));
  const lab=await p.evaluate(()=>{ const f=[...document.querySelectorAll('#grid iframe')].find(x=>x.title==='Universe 1'); const bt=f.contentDocument.getElementById('gmind'); return bt?bt.textContent:null; });
  ck('its button says so', /(learning|\bon)$/.test(lab||''), String(lab));   // #449: a phone shows the short label, 'on'
  await p.evaluate(async()=>{ const f=[...document.querySelectorAll('#grid iframe')].find(x=>x.title==='The collective'); return await f.contentWindow.__field.mindMode('draw'); });
  await p.reload(); await p.waitForTimeout(W); m=await modes();
  ck('both choices survive a reload', m.find(x=>x[0]==='Universe 1')[1]==='learn'&&m.find(x=>x[0]==='The collective')[1]==='draw'&&m.find(x=>x[0]==='Universe 2')[1]==='draw', JSON.stringify(m));
  const p2=await (await b.newContext({viewport:{width:412,height:915}})).newPage(); await p2.goto(base+'/index.html#n=2,layers=0,nocollearn'); await p2.waitForTimeout(W);
  const m2=await p2.evaluate(async()=>{ const o=[]; for(const f of [...document.querySelectorAll('#grid iframe')]){ try{ o.push([f.title,await f.contentWindow.__field.mindMode()]); }catch(e){ o.push([f.title,'err']); } } return o; });
  ck('#nocollearn: no mind learns', m2.length===3&&m2.every(x=>x[1]==='draw'), JSON.stringify(m2));
  ck('no page errors', errs.length===0, errs.length+' '+(errs[0]||''));
  console.log(out.join('\n')); const bad=out.filter(l=>l.indexOf('FAIL')>=0).length; console.log(bad?bad+' FAILED, '+(out.length-bad)+' ok':'all '+out.length+' ok'); await b.close(); srv.close(); process.exit(bad?1:0); })().catch(e=>{ console.log('FAILED '+String(e).slice(0,300)); process.exit(1); });
