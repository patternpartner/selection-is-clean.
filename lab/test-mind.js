// lab/test-mind.js - the mind (#293) learns: trained on programs from a fixed pattern, its loss falls far below uniform and
// what it writes follows the pattern.   node lab/test-mind.js   (exits 1 on failure)
'use strict';
const {Mind}=require('./mind.js'); let fails=0; const ok=(c,m)=>{ console.log((c?'ok   ':'FAIL ')+m); if(!c)fails++; };
const nops=32, m=new Mind(7,{P:1}), pat=[[17,0],[20,5],[15,1],[16,9]];   // EAT_LIGHT DIVIDE TURN MOVE, repeated
const prog=()=>{ const p=[]; const n=4+((Math.random()*3)|0); for(let i=0;i<n;i++)p.push(pat[i%4].slice()); return p; };
for(let i=0;i<300;i++)m.see(prog());
const r0=m.report(nops); for(let t=0;t<400;t++)m.train(nops); const r1=m.report(nops);
console.log('  loss op',r1.lossOp,'(uniform',r1.uniformOp+')','loss arg',r1.lossArg,'(uniform',r1.uniformArg+')');
ok(r1.lossOp<0.3*r1.uniformOp,'operation loss falls far below uniform');
ok(r1.lossArg<0.3*r1.uniformArg,'argument loss falls far below uniform');
let hit=0; for(let k=0;k<200;k++){ const s=[[17,0],[20,5]]; s.push([0,0]); m.P=1; const before=JSON.stringify(s);
  // ask it to substitute position 2 directly: what follows EAT_LIGHT DIVIDE should be TURN(1)
  const c=m.ctx(s,4); m.forward(c,false,nops); const op=m.sample(false,nops); m.forward(m.ctx(s,4,op),true,nops); const arg=m.sample(true,nops); if(op===15&&arg===1)hit++; }
ok(hit>150,'after EAT_LIGHT DIVIDE it writes TURN(1) '+hit+' times in 200');
const f=new Mind(7,{P:1,MODE:'frozen'}); for(let i=0;i<300;i++)f.see(prog()); for(let t=0;t<50;t++)f.train(nops); ok(f.nTrain===0,'a frozen mind never trains');
const s=Mind.load(JSON.parse(JSON.stringify(m.save()))); const a=[],b=[]; for(let k=0;k<20;k++){ const p1=[[17,0],[20,5]], p2=[[17,0],[20,5]]; m.propose(p1,nops,64); s.propose(p2,nops,64); a.push(JSON.stringify(p1)); b.push(JSON.stringify(p2)); }
ok(a.join()===b.join(),'save and load is exact (the same proposals afterwards)');
// curiosity (v4): trained on the pattern, a NOVEL mind avoids what it expects, and WHERE='uncertain' changes where it is unsure
{ const c=new Mind(7,{P:1,NOVEL:0.5}); for(let i=0;i<300;i++)c.see(prog()); for(let t=0;t<400;t++)c.train(nops);
  let same=0; for(let k=0;k<200;k++){ const s=[[17,0],[20,5],[0,0]]; c.forward(c.ctx(s,4),false,nops); if(c.sample(false,nops)===15)same++; }
  ok(same<20,'a NOVEL mind writes the expected TURN after EAT_LIGHT DIVIDE only '+same+' times in 200 (the plain mind: 200)');
  const u=new Mind(7,{P:1,WHERE:'uncertain'}); for(let i=0;i<300;i++)u.see(prog()); for(let t=0;t<400;t++)u.train(nops);
  const odd=[[17,0],[20,5],[15,1],[16,9],[3,77],[9,200],[17,0],[20,5]];   // a familiar start, then instructions it has never seen
  const at=new Array(odd.length).fill(0); for(let k=0;k<400;k++){ const s=odd.map(x=>x.slice()); u.propose(s,nops,64); for(let q=0;q<s.length;q++) if(s[q][0]!==odd[q][0]||s[q][1]!==odd[q][1])at[q]++; }
  const known=at[1]+at[2]+at[3], strange=at[5]+at[6]+at[7];
  ok(strange>2*known,'WHERE=uncertain changes where it cannot predict (positions after the unseen part '+strange+', inside the familiar start '+known+')');
  const r=Mind.load(JSON.parse(JSON.stringify(c.save()))); ok(r.NOVEL===0.5&&Mind.load(JSON.parse(JSON.stringify(u.save()))).WHERE==='uncertain','curiosity settings survive save and load'); }
// all three at once (v5): two networks, three drives, each used for about a third of the proposals; save and load exact
{ const {MixMind}=require('./mind.js'); const x=new MixMind(7,{P:1}); for(let i=0;i<300;i++)x.see(prog(),1); for(let t=0;t<200;t++)x.train(nops);
  for(let k=0;k<600;k++){ const s=prog(); x.propose(s,nops,64); }
  ok(x.uses.every(u=>u>150&&u<250),'each drive takes about a third of the proposals ('+x.uses.join(', ')+')');
  ok(x.exists.nTrain>0&&x.works.nTrain>0,'both networks learn');
  const y=MixMind.load(JSON.parse(JSON.stringify(x.save()))); const a=[],b=[]; for(let k=0;k<20;k++){ const p1=[[17,0],[20,5],[15,1]], p2=[[17,0],[20,5],[15,1]]; x.propose(p1,nops,64); y.propose(p2,nops,64); a.push(JSON.stringify(p1)); b.push(JSON.stringify(p2)); }
  ok(a.join()===b.join(),'the combined mind saves and loads exactly'); }
// growth (#295): growing keeps every prediction, a mind grows when its world changes under it, and a child inherits
{ const pr=(m,c,arg)=>{ m.forward(c,arg,nops); return Array.from(m.p.slice(0,arg?256:nops)); }, close=(a,b)=>a.every((x,i)=>Math.abs(x-b[i])<1e-5);
  const g=new Mind(7,{P:1,GROW:8,HMAX:96}); for(let i=0;i<300;i++)g.see(prog()); for(let t=0;t<100;t++)g.train(nops);
  const c=g.ctx([[17,0],[20,5]],4), before=[pr(g,c,false),pr(g,g.ctx([[17,0],[20,5]],4,15),true)]; g.grow(8);
  ok(g.H===72&&close(before[0],pr(g,c,false))&&close(before[1],pr(g,g.ctx([[17,0],[20,5]],4,15),true)),'growing 8 units changes nothing it predicts (H '+g.H+')');
  const h=Mind.load(JSON.parse(JSON.stringify(g.save()))); ok(h.H===72&&close(pr(h,c,false),pr(g,c,false)),'a grown mind saves and loads at its new size');
  const H0=g.H, other=[[3,77],[9,200],[11,4],[2,90]], prog2=()=>{ const p=[]; const n=4+((Math.random()*3)|0); for(let i=0;i<n;i++)p.push(other[i%4].slice()); return p; };
  for(let t=0;t<300;t++)g.train(nops); for(let i=0;i<1100;i++)g.see(prog2()); for(let t=0;t<30;t++)g.train(nops);
  ok(g.H>H0,'when the world changes under it, it grows ('+H0+' -> '+g.H+' units, grown '+g.grown+' times)');
  const k=g.child(); ok(close(pr(k,c,false),pr(g,c,false))||k.H>g.H,'a child predicts what its parent does (it inherits the weights)');
  ok(k.buf.length===g.buf.length&&k.rnd.s!==g.rnd.s,'and its memories, with a random stream of its own');
  ok(!!g.trial,'a growth is on trial'); for(let t=0;t<g.TRIAL+1&&g.trial;t++){ for(let i=0;i<60;i++)g.see(prog2()); g.train(nops); }
  ok(!g.trial&&(g.H===H0||g.H>H0),'and after its trial it is kept or removed (now '+g.H+' units, kept '+g.kept+' of '+g.grown+')');
  g.NOVEL=0.5; let nov=0, lr=0, gr=0, sh=0; for(let i=0;i<200;i++){ const q=g.child(); if(q.NOVEL!==g.NOVEL)nov++; if(q.LR!==g.LR)lr++; if(q.H>g.H)gr++; if(q.sNOVEL!==0.5)sh++; }
  ok(nov>60&&nov<140&&lr>60&&lr<140&&gr>15&&gr<70,'its curiosity and learning rate change about half the time ('+nov+', '+lr+' of 200), its size now and then ('+gr+')');
  ok(sh>60&&sh<140,'and the shadow of its curiosity changes by the same rule, independently ('+sh+' of 200)');
  { let a=g.child(); for(let i=0;i<5;i++)a=a.child(); const b=Mind.load(JSON.parse(JSON.stringify(a.save()))); ok(b.sNOVEL===a.sNOVEL&&b.sLR===a.sLR&&b.NOVEL===a.NOVEL,'the shadow is inherited and survives save and load'); }
  // a mind too small for its world keeps the units it tries; the learning rate is scaled down as it grows
  { const rich=()=>{ const p=[]; for(let i=0;i<8;i++)p.push([(i*5+3)%nops,(i*37+11)&255]); return p; };
    const t=new Mind(9,{P:1,H:2,GROW:8,HMAX:64}); for(let i=0;i<400;i++)t.see(rich()); for(let k=0;k<200;k++)t.train(nops);
    t.tryGrow(); for(let k=0;k<t.TRIAL;k++)t.train(nops); ok(t.H===10&&t.kept===1,'a 2-unit mind keeps the 8 units it tries ('+t.H+' units, kept '+t.kept+')');
    ok(t.H0===2&&Mind.load(JSON.parse(JSON.stringify(t.save()))).H0===2,'its starting size is kept, so its learning rate is scaled by 2/'+t.H); }
  const e=new Mind(7,{P:1,PER:0.5}); for(let i=0;i<300;i++)e.see(prog()); e.train(nops); const n1=e.nTrain; e.train(nops); ok(n1===1&&e.nTrain===1,'PER: with nothing new seen it does not train'); }
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
