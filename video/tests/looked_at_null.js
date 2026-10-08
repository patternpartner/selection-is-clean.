const {chromium}=require('/opt/node-tools/node_modules/playwright-core');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:400,height:760}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/user/selection-is-clean./video/looked_at.html');
const arms=[['select',{}],['neutral',{neutral:true}],['select+visitor',{visitor:true}]];
const seeds=[101,102,103,104];
for(const [name,o] of arms){for(const s of seeds){
 const r=await p.evaluate(([s,o])=>{const L=window.__lit;L.opts.neutral=!!o.neutral;L.opts.visitor=!!o.visitor;L.seed(s);
  const first=new Map(),est=new Map();let T=24000;
  for(let t=1;t<=T;t++){L.step();
    for(const q of L.pairs){if(q.dying)continue;if(q.root===q.id&&!first.has(q.id))first.set(q.id,t)}
    if(t%50===0){for(const [r,f] of first){if(!est.has(r)&&t>=f+1500&&t<f+1550){est.set(r,L.pairs.some(q=>!q.dying&&q.root===r&&q.id!==r))}}}}
  // establishment among strangers that arrived before T-1600 (exclude founders: roots <=70 never counted as first-seen only if id>70)
  let n=0,e=0;for(const [r,f] of first){if(r<=70||f>T-1600)continue;n++;if(est.get(r))e++}
  const a=L.pairs.filter(x=>!x.dying),m=k=>a.reduce((u,x)=>u+x.g[k],0)/a.length;
  return{n,e,hueAff:+m('hueAff').toFixed(2),near:+m('near').toFixed(2),N:a.length}},[s,o]);
 console.log(name,s,JSON.stringify(r));
}}
console.log('errors',errs);await b.close()})();
