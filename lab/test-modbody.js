// lab/test-modbody.js - module body fields (#292): a field declared {body:true} belongs to the organism in the cell, not the cell.
//   node lab/test-modbody.js     (exits 1 on any failure)
'use strict';
const crypto=require('crypto'), path=require('path'), {World}=require(path.join(__dirname,'oee-core.js'));
const FAT="({\n  name: 'FAT',\n  fields: { fat: { energy: true, body: true }, mark: { body: true } },\n  op(api, c, arg) { if (arg & 1) { api.move('E', c, 'fat', c, api.E(c) * 0.25); api.set('mark', c, 1); } else api.move('fat', c, 'E', c, api.get('fat', c) * 0.5); },\n})"; let fails=0; const ok=(c,msg)=>{ console.log((c?'ok   ':'FAIL ')+msg); if(!c)fails++; };
const w=new World(11,{}); for(let s=0;s<500;s++)w.step(); const m=w.installMod(FAT); const F=m.fields.fat, K=m.fields.mark;
let c=0; while(!w.alive[c])c++; const e0=w.E[c]; m.spec.op(m.api,c,1); ok(Math.abs(F[c]-e0*0.25)<1e-5&&K[c]===1,'bury a quarter into the body: fat '+F[c].toFixed(4)+', mark '+K[c]);
let b=w.ahead(c,w.face[c]); while(w.alive[b]){ w.face[c]=(w.face[c]+1)&7; b=w.ahead(c,w.face[c]); } const fat=F[c]; w.moveOrg(c,b); ok(F[b]===fat&&K[b]===1&&F[c]===0&&K[c]===0,'the body fields went with the organism and left nothing behind');
const cor=w.corpse[b], E=w.E[b]; w.kill(b,'starve'); ok(Math.abs(w.corpse[b]-(cor+Math.max(0,E)+w.p.BODY+fat))<1e-4&&F[b]===0&&K[b]===0,'at death the fat went to the corpse (+'+fat.toFixed(4)+') and the mark was cleared');
ok(m.api.move('E',b,'fat',b,1)===0&&m.api.move('corpse',b,'fat',b,1)===0,'no energy moves into the body of an empty cell'); m.api.set('mark',b,5); ok(K[b]===0,'no mark is written on an empty cell');
let threw=0; try{ m.api.diffuse('mark',0.1); }catch(e){ threw=1; } ok(threw,'a body field does not spread');
threw=0; try{ w.installMod("({name:'BAD',fields:{x:{body:true,init:1}},op(){}})"); }catch(e){ threw=1; } ok(threw,'a body field cannot start full');
// a world running with it: every body value sits on a living organism, and save + resume is exact
for(let s=0;s<3000;s++)w.step(); let stray=0, held=0; for(let i=0;i<w.C;i++){ if(!w.alive[i]&&(F[i]!==0||K[i]!==0))stray++; held+=F[i]; } const r=w.sample().mods.list[0];
ok(stray===0,'after 3,000 ticks no body value lies on an empty cell (fat held '+held.toFixed(1)+', carriers '+(r.carriers*100).toFixed(1)+'%, execs '+r.execs+')');
const h=x=>crypto.createHash('sha1').update(x).digest('hex').slice(0,12), sv=w.save(), w2=World.load(sv); for(let s=0;s<2000;s++){ w.step(); w2.step(); } ok(h(w.save())===h(w2.save()),'save and resume with body fields is exact');
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
