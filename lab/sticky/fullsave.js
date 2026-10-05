// lab/sticky/fullsave.js - EXACT save/resume of an oee-core World with every knob (HBODY, RENEW, DISP, XB, BODY_CROWD ...).
// The core's own World.save() predates the body/renewal state, so a resume with those knobs is NOT exact. This file does not touch the
// core: it serialises EVERY own field of the World generically (typed arrays as base64, RNG closures by their state .s, Maps, Sets,
// plain values) and restores them onto a freshly constructed World with the same params. Identity is checked in lab/sticky/trial-lr/.
'use strict';
const {World}=require('../oee-core.js');
function saveAll(w){ const o={}; for(const k of Object.keys(w)){ const v=w[k];
    if(v&&ArrayBuffer.isView(v)) o[k]={T:v.constructor.name,b:Buffer.from(v.buffer,v.byteOffset,v.byteLength).toString('base64')};
    else if(typeof v==='function'){ if(!('s' in v))throw new Error('fullsave: function field without state: '+k); o[k]={F:v.s}; }
    else if(v instanceof Map) o[k]={M:[...v.entries()]};
    else if(v instanceof Set) o[k]={S:[...v]};
    else o[k]={J:v}; }
  return JSON.stringify(o); }
function loadAll(txt){ const o=JSON.parse(txt); const w=new World(1,o.p.J);
  for(const k of Object.keys(o)){ const e=o[k];
    if(e.T){ const b=Buffer.from(e.b,'base64'); const Ctor=globalThis[e.T]; const A=new Ctor(b.byteLength/Ctor.BYTES_PER_ELEMENT); new Uint8Array(A.buffer).set(b);
      if(w[k]&&ArrayBuffer.isView(w[k])&&w[k].constructor===Ctor&&w[k].length===A.length) w[k].set(A); else w[k]=A; }
    else if('F' in e){ if(typeof w[k]!=='function')throw new Error('fullsave: RNG field missing after construct: '+k); w[k].s=e.F; }
    else if(e.M) w[k]=new Map(e.M);
    else if(e.S) w[k]=new Set(e.S);
    else w[k]=e.J; }
  for(const k of Object.keys(w)) if(!(k in o))throw new Error('fullsave: field created by constructor but not in save: '+k);
  return w; }
module.exports={saveAll,loadAll};
