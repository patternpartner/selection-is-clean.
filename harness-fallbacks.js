// THE FALLBACK CENSUS — WHICH GENES DOES A DEFAULT ANSWER FOR? (#298)
//
// #217o named a rung the ladder could not see: a mechanism can EXECUTE on every tick and still never
// read its gene, because a fallback answers in the gene's place. `uaProdW()` returned [1,1,1,1,1] for
// the project's whole life because the gene was undefined; `CHANNEL_RENT_SAFE()` kept a stale 0.6 in
// its `||`. Both were found by accident. #217o asked the structural question and nobody answered it:
// WHICH FUNCTIONS RETURN A LITERAL FALLBACK WHEN A GENOME FIELD FAILS A CHECK?
//
// A name search cannot answer it (trap 5: `uaProdW` reads the gene through a local `w`). So this rig
// does not search. It wraps every genome object - the germline `genome` and every `pGenome[i]` - in a
// Proxy whose `get` trap counts, per gene name, every read that finds:
//   MISSING   the key is not on the object at all. Whatever code shape or alias did the read, the value
//             it got was `undefined`, so any default the code then supplies is answering for the gene.
//   BAD       the key is there but holds null, NaN or +/-Infinity.
//   FALSY     the key holds 0, "" or false. Harmless on its own; it matters where the read site uses
//             `||`, which treats a gene that evolved to 0 as unset (CODEMAP/OEE-NOTES record one such
//             site, line "treats 0 as unset"). The static pass below lists every `<obj>.<gene> ||` site so
//             the two can be joined: a FALSY count on a gene with a `||` site is a default answering for a
//             real value of zero.
// For each it keeps the READ SITE (engine.html line and function) from a sampled stack, so a finding
// points at code, not at a name.
//
// IT DRAWS NOTHING (trap 4): a Proxy trap is a property read. And it is CHECKED not to perturb, not
// assumed: the same seed is run with and without the Proxies and a trajectory fingerprint (alive,
// position sum, tick) is compared every SAMPLE ticks. If they differ the census is about a different
// run and the rig says so and exits non-zero.
//
// WHAT A ZERO DOES NOT MEAN: a gene that is never MISSING in this run at this budget on this seed may be
// missing on a saved world, a later horizon or another seed. Budget and seeds are printed with the
// verdict. Only top-level keys of genome objects are watched; a missing field INSIDE a nested gene
// (channels[k].rule) is not seen here.
//
// Env: SEEDS (default 1,2,3)  TICKS (default 3000)  SAMPLE (default 500)  JSON=1
const fs=require('fs'), path=require('path');
const SEEDS=(process.env.SEEDS||'1,2,3').split(',').map(s=>s.trim()).filter(Boolean);
const TICKS=parseInt(process.env.TICKS||'3000',10);
const SAMPLE=parseInt(process.env.SAMPLE||'500',10);
const ASJSON=(process.env.JSON|0)===1;
const html=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8');
const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
const SCRIPT_LINE=html.slice(0,html.indexOf('<script>')).split('\n').length;   // engine.html line of code line 1
const CODE_LINES=code.split('\n').length;
const lines=html.split('\n');

// ── 1. STATIC: every `<genome-like>.<gene> ||` and `?? ` read site. Genome-like = the germline, a pGenome
// element, or a local named like one. A list of candidates only: the dynamic counts decide which matter.
const OBJ='(?:genome|pGenome\\[[^\\]]+\\]|g|gn|gm|pg|G|gen|src|par|child|cg)';
const OR_RE=new RegExp('\\b'+OBJ+'\\.([A-Za-z_$][\\w$]*)\\s*(\\|\\||\\?\\?)\\s*([^;,)}\\]]{0,24})','g');
const STATIC={};
let inSan=false;
for(let i=0;i<lines.length;i++){
  const ln=lines[i];
  if(/^function sanitizeGenome\(/.test(ln)) inSan=true; else if(inSan&&/^function /.test(ln)) inSan=false;
  if(/^\s*\/\//.test(ln)) continue;
  let m; OR_RE.lastIndex=0;
  while((m=OR_RE.exec(ln))){
    (STATIC[m[1]]=STATIC[m[1]]||[]).push({line:i+1,op:m[2],dflt:m[3].trim(),inSanitize:inSan});
  }
}

// ── 1b. SHAPE FALLBACKS: the Proxy sees a gene that is ABSENT, not one that is present in the wrong shape
// (#217n's own case: `if(!Array.isArray(w)||w.length<5)return [1,1,1,1,1]`). Seven read sites return a
// non-trivial stand-in for a gene; each is patched, in this rig's copy only, to count GENE vs STAND-IN.
// A counter is a property write, not a draw. Every patch must match exactly once and all seven must land,
// or the rig refuses to run (#217f: a patch written against a pattern that matched 1 of 4 shipped a knob
// that gated one path while three kept writing).
const SHAPE=[
  ['oeeW',        'if(!Array.isArray(w)||w.length<OEE_PROXY_N)return 0;'],
  ['uaVarW',      'if(!Array.isArray(w))return vars[(r*vars.length)|0];'],
  ['uaProdW',     'if(!__UA_PROD||!Array.isArray(w)||w.length<5)return [1,1,1,1,1];'],
  ['chanStencil', 'if(!Array.isArray(st)||!st.length)return CHANNEL_STENCIL_SEED;'],
  ['cosmosProg',  'if(!Array.isArray(prog)||!prog.length)return{bind:1,drive:1,burn:1};'],
  ['verbGate.bos','const bos=genome.boundOpcodes; if(!Array.isArray(bos)||ax>=bos.length)return 1;'],
  ['draw',        'if(!Array.isArray(d)||d.length<1)return defaultDraw();'],
];
let patched=code, landed=0;
for(const [name,src] of SHAPE){
  const n=patched.split(src).length-1;
  if(n!==1){ console.error('shape patch "'+name+'" matched '+n+' times, expected 1 - refusing to run'); process.exit(3); }
  const m=src.match(/^(.*?)(if\(.*\))(return.*;)$/);
  patched=patched.replace(src, m[1]+m[2]+'{__fbHit("'+name+'",1);'+m[3]+'}__fbHit("'+name+'",0);');
  landed++;
}
if(landed!==SHAPE.length){ console.error('only '+landed+' of '+SHAPE.length+' shape patches landed'); process.exit(3); }

// ── 2. THE DRIVER, a concatenated string (trap 1: no backtick can break what is not one).
const DRIVER=[
';globalThis.__fb=function(T,SAMPLE,useProxy,FILE,CODE_LINES,ORL){',
'  var C={miss:{},bad:{},falsy:{},site:{},missLate:{},falsyOr:{},falsySeen:{},shape:{}};',
'  globalThis.__fbHit=function(name,fell){ var o=C.shape[name]||(C.shape[name]=[0,0]); o[fell]++; };',
'  var IGN={toJSON:1,constructor:1,then:1,valueOf:1,toString:1,length:1,prototype:1};',
'  var late=false;',
'  var siteOf=function(){',
'    var st=(new Error()).stack.split("\\n");',
'    for(var i=1;i<st.length;i++){ var m=st[i].match(/at (?:([^ ]+) )?\\(?([^():]+):(\\d+):\\d+\\)?/);',
'      if(m&&m[2]===FILE&&+m[3]<=CODE_LINES) return (m[1]||"?")+"@"+m[3]; }',
'    return "?";',
'  };',
'  var note=function(cls,key){',
'    var c=C[cls]; c[key]=(c[key]||0)+1;',
'    if(cls==="miss"&&late) C.missLate[key]=(C.missLate[key]||0)+1;',
'    if(c[key]<=40||c[key]%5000===0){ var s=siteOf(), k=cls+"|"+key, o=C.site[k]||(C.site[k]={}); o[s]=(o[s]||0)+1; }',
'  };',
'  var WM=new WeakMap();',
'  var wrap=function(o){',
'    if(!o||typeof o!=="object") return o;',
'    if(WM.has(o)) return WM.get(o);',
'    var p=new Proxy(o,{get:function(t,k,r){',
'      var v=Reflect.get(t,k,r);',
'      if(typeof k==="string"&&!IGN[k]){',
'        if(v===undefined){ if(!(k in t)) note("miss",k); }',
'        else if(v===null||(typeof v==="number"&&!isFinite(v))) note("bad",k);',
'        else if((v===0||v===""||v===false)&&ORL[k]){',
'          var n=C.falsySeen[k]=(C.falsySeen[k]||0)+1;',
'          if(n<=300||n%25===0){ var w=n<=300?1:25, s=siteOf(), ln=+s.split("@")[1];',
'            if(ORL[k][ln]){ C.falsyOr[k]=(C.falsyOr[k]||0)+w; var kk="falsy|"+k, oo=C.site[kk]||(C.site[kk]={}); oo[s]=(oo[s]||0)+w; } }',
'        }',
'      }',
'      return v; }});',
'    WM.set(o,p); WM.set(p,p); return p;',
'  };',
'  var fp=[];',
'  var finger=function(){ var a=0,x=0; for(var i=0;i<N;i++) if(palive[i]){ a++; x+=(px[i]||0)+(py[i]||0)*3.1; } return [tick,a,Math.round(x*1e6)/1e6]; };',
'  var rewrap=function(){ if(!useProxy) return; genome=wrap(genome); for(var i=0;i<pGenome.length;i++) if(pGenome[i]) pGenome[i]=wrap(pGenome[i]); };',
'  var err=null;',
'  for(var step=0;step<T;step++){',
'    late=step>=T/2;',
'    globalThis.__detMs+=5;',
'    rewrap();',
'    try{ loop(); }catch(e){ if(!err) err=String(e&&e.message||e); }',
'    if((step+1)%SAMPLE===0) fp.push(finger());',
'  }',
'  var present={}; for(var i=0;i<N;i++) if(palive[i]&&pGenome[i]){ var ks=Object.keys(pGenome[i]); for(var z=0;z<ks.length;z++) present[ks[z]]=(present[ks[z]]||0)+1; }',
'  return {C:C,fp:fp,err:err,present:present,germKeys:Object.keys(genome)};',
'};'
].join('\n');

// the || sites outside sanitizeGenome, keyed by gene, in the compiled code's line numbers
const ORL={};
for(const [k,arr] of Object.entries(STATIC)) for(const x of arr) if(!x.inSanitize&&x.op==='||'){ (ORL[k]=ORL[k]||{})[x.line-SCRIPT_LINE+1]=1; }
const Module=require('module');
function runOnce(seed,useProxy){
  // a fresh engine per run: the census must not see a world another run left behind
  process.env.SEED=seed;
  for(const k of Object.keys(globalThis)) if(k.startsWith('__')&&k!=='__filename'&&k!=='__dirname') { try{ delete globalThis[k]; }catch(e){} }
  require(path.join(__dirname,'harness-env.js'))(globalThis);
  require(path.join(__dirname,'harness-env.js')).applyKnobs(globalThis);
  const FILE='/tmp/fallback-census-'+seed+'-'+(useProxy?1:0)+'.js';
  const mod=new Module(FILE); mod.filename=FILE; mod.paths=Module._nodeModulePaths('/tmp');
  mod._compile(patched+DRIVER,FILE);
  return globalThis.__fb(TICKS,SAMPLE,useProxy,FILE,CODE_LINES,ORL);
}

const out={seeds:{},TICKS,SEEDS,staticSites:STATIC};
for(const seed of SEEDS){
  const plain=runOnce(seed,false), probed=runOnce(seed,true);
  const same=JSON.stringify(plain.fp)===JSON.stringify(probed.fp);
  out.seeds[seed]={same,fpPlain:plain.fp,fpProbed:probed.fp,err:probed.err,C:probed.C,present:probed.present,germKeys:probed.germKeys};
  if(!ASJSON) console.log('seed '+seed+': probe '+(same?'does NOT perturb (fingerprints identical)':'PERTURBS THE RUN - census invalid')+(probed.err?'  loop error: '+probed.err:''));
}
const toLine=s=>{ const m=s.match(/@(\d+)$/); return m?s.replace(/@\d+$/,'@L'+(SCRIPT_LINE+parseInt(m[1],10)-1)):s; };
const allKeys=new Set();
for(const s of Object.values(out.seeds)){ for(const cls of ['miss','bad']) for(const k of Object.keys(s.C[cls])) allKeys.add(cls+'|'+k);
  for(const k of Object.keys(s.C.falsyOr)) allKeys.add('falsy|'+k); }
const rows=[];
for(const ck of allKeys){
  const [cls,key]=ck.split('|');
  const per=SEEDS.map(sd=>(cls==='falsy'?out.seeds[sd].C.falsyOr[key]:out.seeds[sd].C[cls][key])||0);
  const late=SEEDS.map(sd=>cls==='miss'?(out.seeds[sd].C.missLate[key]||0):null);
  const presentEnd=SEEDS.map(sd=>out.seeds[sd].present[key]||0);
  const sites={};
  for(const sd of SEEDS){ const o=out.seeds[sd].C.site[ck]||{}; for(const s of Object.keys(o)) sites[toLine(s)]=(sites[toLine(s)]||0)+o[s]; }
  // for a zero read, the default at the site decides: `x||0` answers 0 for 0 (harmless); `x||0.6` answers 0.6 for 0
  const dfltAt=l=>{ const e=(STATIC[key]||[]).find(x=>x.line===l); return e?e.dflt:'?'; };
  const siteDefaults=Object.keys(sites).map(sx=>{ const m=sx.match(/@L(\d+)$/); return m?dfltAt(+m[1]):'?'; });
  const answers=cls==='falsy'&&siteDefaults.some(d=>!/^0(\.0*)?$/.test(d));
  rows.push({cls,key,per,late,presentEnd,answers,siteDefaults,sites:Object.entries(sites).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([s,n])=>s+' x'+n),
             orSites:(STATIC[key]||[]).filter(x=>!x.inSanitize).map(x=>'L'+x.line+' '+x.op+' '+x.dflt)});
}
out.rows=rows;
const shapeRows=SHAPE.map(([name])=>({name,per:SEEDS.map(sd=>{ const o=out.seeds[sd].C.shape[name]||[0,0]; return {gene:o[0],standIn:o[1]}; })}));
out.shape=shapeRows;
if(ASJSON){ console.log(JSON.stringify(out)); }
else {
  console.log('\nTICKS '+TICKS+', seeds '+SEEDS.join(',')+'. MISSING = read while the key was absent (a default, if any, answered).');
  for(const cls of ['miss','bad','falsy']){
    if(cls==='falsy'){ const h=rows.filter(r=>r.cls==='falsy'&&!r.answers); console.log('\n(zero read at an `x||0` site, default equals the value, harmless: '+h.length+' genes: '+h.map(r=>r.key).join(', ')+')'); }
    const rs=rows.filter(r=>r.cls===cls&&(cls!=='falsy'||r.answers)).sort((a,b)=>b.per.reduce((x,y)=>x+y)-a.per.reduce((x,y)=>x+y));
    console.log('\n== '+{miss:'MISSING',bad:'BAD (null/NaN/inf)',falsy:'ZERO READ AT A `||` SITE (the default answered for a real 0; counts estimated from a sample)'}[cls]+' ('+rs.length+')');
    for(const r of rs) console.log('  '+r.key.padEnd(26)+' reads/seed '+r.per.join('/')+(cls==='miss'?'  late-half '+r.late.join('/'):'')+'  on living at end '+r.presentEnd.join('/')+
      '\n      read at: '+r.sites.map((x,j)=>x+(cls==='falsy'?' (default '+r.siteDefaults[j]+')':'')).join(' | ')+(r.orSites.length?'\n      ||/?? sites: '+r.orSites.slice(0,5).join(' | '):''));
  }
  console.log('\n== SHAPE FALLBACKS: calls answered by the GENE vs by the STAND-IN, per seed');
  for(const r of shapeRows) console.log('  '+r.name.padEnd(14)+r.per.map(x=>'gene '+x.gene+' / stand-in '+x.standIn).join('   '));
  const bad=Object.values(out.seeds).some(s=>!s.same);
  if(bad){ console.log('\nCENSUS INVALID: the probe changed the trajectory.'); process.exit(2); }
}
