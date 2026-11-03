// lab/probe-dupread.js - #342: is the second read's word usually the same as the first? Loads a saved TASKS world with OTHERS and runs on,
// drawing nothing beyond the world's own. Two numbers, side by side (the user's design):
//  EXECUTED: per organism and epoch with 2+ nonzero reads, whether every read returned the same word (all-duplicate), and over
//            consecutive nonzero read pairs, the share that were equal.
//  SUPPLY:   at the last tick of every 5th epoch, for each living organism with 2+ neighbours (of 8) that published a word this
//            epoch, the share of neighbour pairs holding the same word, and the share of such organisms with no two distinct words;
//            and the same for USABLE words only (clean and a function of this epoch's inputs).
//   LOAD=lab/out-tree/7601_o1.7.save [WARM=2000] [TICKS=5000] node lab/probe-dupread.js
'use strict';
const fs=require('fs'); const {World}=require('./oee-core-tasks.js');
const E=process.env, w=World.load(fs.readFileSync(E.LOAD,'utf8')), C=w.C, EP=w.p.TASK_EPOCH;
const first=new Float64Array(C), last=new Float64Array(C), nR=new Uint16Array(C), dist=new Uint8Array(C), seenE=new Int32Array(C).fill(-1);
let on=false; const X={orgEpochs2:0, allDup:0, pairs:0, pairsEq:0}, S={orgs:0, mono:0, pairs:0, pairsEq:0, nb:0, nbUsable:0, uOrgs:0, uMono:0, uPairs:0, uPairsEq:0};
// USABLE: a neighbour's word that is clean (no junk bit) and a function of this epoch's inputs - the only words a gate can be paid on
const usable=a=>(!w.tlastJ||w.tlastJ[a]===0)&&(w.p.NIN===4?w.fn4(w.tlast[a])>=0:true);
const flush=c=>{ if(on&&nR[c]>=2){ X.orgEpochs2++; if(!dist[c])X.allDup++; } nR[c]=0; dist[c]=0; };
const dA=w.depthAfter.bind(w);
w.depthAfter=function(b,op,arg,before){ dA(b,op,arg,before); if(op!==28)return; const c=b>>2, e=this.epoch(), v=this.R[b]>>>0;
  if(seenE[c]!==e){ flush(c); seenE[c]=e; } if(!v)return;
  if(nR[c]===0)first[c]=v; else { if(on){ X.pairs++; if(v===last[c])X.pairsEq++; } if(v!==first[c])dist[c]=1; } last[c]=v; nR[c]++; };
const tb=w.taskBirth.bind(w); w.taskBirth=function(c){ tb(c); nR[c]=0; dist[c]=0; seenE[c]=-1; };
function supply(){ const e=w.epoch(); for(let c=0;c<C;c++){ if(!w.alive[c])continue; const ws=[]; for(let f=0;f<8;f++){ const a=w.ahead(c,f); if(w.alive[a]&&w.tlastE[a]===e)ws.push(w.tlast[a]); }
  { const us=[]; for(let f=0;f<8;f++){ const a=w.ahead(c,f); if(w.alive[a]&&w.tlastE[a]===e){ S.nb++; if(usable(a)){ S.nbUsable++; us.push(w.tlast[a]); } } }
    if(us.length>=2){ S.uOrgs++; let eq=0,n=0; for(let i=0;i<us.length;i++)for(let j=i+1;j<us.length;j++){ n++; if(us[i]===us[j])eq++; } S.uPairs+=n; S.uPairsEq+=eq; if(eq===n)S.uMono++; } }
  if(ws.length<2)continue; S.orgs++; let eq=0, n=0; for(let i=0;i<ws.length;i++)for(let j=i+1;j<ws.length;j++){ n++; if(ws[i]===ws[j])eq++; } S.pairs+=n; S.pairsEq+=eq; if(eq===n)S.mono++; } }
for(let s=0;s<+(E.WARM||2000);s++) w.step(); on=true;
for(let s=0;s<+(E.TICKS||5000);s++){ w.step(); if(w.tick%(EP*5)===EP-1) supply(); }
const r=(a,b)=>+(a/Math.max(1,b)).toFixed(3);
console.log(JSON.stringify({load:E.LOAD.split('/').slice(-2).join('/'), readDir:w.p.READ_DIR||0,
  executed:{orgEpochsWith2plusReads:X.orgEpochs2, allDuplicate:r(X.allDup,X.orgEpochs2), consecutivePairsEqual:r(X.pairsEq,X.pairs)},
  supply:{orgsWith2plusPublishingNeighbours:S.orgs, neighbourPairsEqual:r(S.pairsEq,S.pairs), orgsWithNoTwoDistinct:r(S.mono,S.orgs), neighbourWordsUsable:r(S.nbUsable,S.nb), orgsWith2plusUsable:S.uOrgs, usablePairsEqual:r(S.uPairsEq,S.uPairs), orgsWithNoTwoDistinctUsable:r(S.uMono,S.uOrgs)}}));
