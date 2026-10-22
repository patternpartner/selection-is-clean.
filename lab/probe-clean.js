// lab/probe-clean.js - #339: how much of a saved three-input world's task income is paid for words that were NOT clean (CLEAN in
// lab/oee-core-tasks.js: some bit depends, bit for bit, on a non-logic word or on an earlier epoch's inputs)? Loads a save, switches on CLEAN=2 bookkeeping (counts, refuses
// nothing, draws nothing), runs WARM ticks for the registers to be rewritten, then TICKS more, and reports the dirty share.
//   LOAD=lab/out-strict2/7201_o1.7.save [WARM=2000] [TICKS=20000] node lab/probe-clean.js
'use strict';
const fs=require('fs'); const {World}=require('./oee-core-tasks.js');
const E=process.env, w=World.load(fs.readFileSync(E.LOAD,'utf8')), C=w.C; w.p.CLEAN=2; w.Rj=new Uint32Array(C*4).fill(0xFFFFFFFF); w.Rdm=new Uint32Array(C*4); w.tlastJ=new Uint32Array(C).fill(0xFFFFFFFF); w.tlastDm=new Uint32Array(C); w.ev.dirtyPaid=0; w.ev.dirtyE=0;   // every bit starts as junk; WARM rewrites them (no organism here lives 400 ticks)
for(let s=0;s<+(E.WARM||2000);s++) w.step(); w.sample();
let inc=0, dE=0, paid=0, dP=0; for(let s=1;s<=+(E.TICKS||20000);s++){ w.step(); if(s%1000===0){ const r=w.sample(); inc+=r.tasks.income; dE+=r.ev.dirtyE||0; dP+=r.ev.dirtyPaid||0; } }
console.log(JSON.stringify({load:E.LOAD, income:Math.round(inc), dirtyIncome:Math.round(dE), dirtyShare:+(dE/Math.max(1,inc)).toFixed(3), dirtyPaid:dP}));
