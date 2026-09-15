// THE ORPHAN-GENE CENSUS (#209) — WHICH GENES DOES ANYTHING ACTUALLY READ?
//
// #208b ended on a claim that is a warning about this whole file's method: atomIdleTolerance DRIFTS
// (0.038 / 0.070 / 0.065 across three control seeds) while provably never being read, and a gene that
// drifts unread is indistinguishable in any export from a gene under selection. Every
// spread-across-universes figure this project has ever cited as evidence of selection is consistent
// with drift until the READ is instrumented -- including the atomUseProtect 0..0.785 spread I cited
// as a control one entry earlier.
//
// Leaving that as a warning would be the exact failure the warning is about, so here is the check.
//
// METHOD, and it is static on purpose. A gene participates in the simulation only if something
// outside the genome's own plumbing reads it. The plumbing is small and enumerable: the mutation
// operator, the sanitiser, the encoder, the decoder, the clone, the budget trimmer. If every single
// occurrence of a key lives in those, the gene is WRITTEN, MUTATED, SAVED, LOADED and READ BY NOTHING
// -- it is a number that rides the genome and touches no behaviour, and no export can tell it apart
// from a gene selection is acting on.
//
// Static beats dynamic here. A runtime read-counter answers "was it read in THIS run at THIS budget",
// which is the budget-sensitivity trap this repo has paid for four times. "Does a read site exist
// anywhere in the file" has no trajectory and no budget.
//
// WHAT THIS DOES NOT CLAIM. A key with read sites outside the plumbing is not thereby shown to matter
// -- the site could sit behind a gate that never opens, which is exactly #208's finding about the
// atom cull. Reachability is a separate question and this rig does not answer it. What it produces is
// a floor: the orphans CANNOT matter, whatever else is true.
//
// Env: VERBOSE=1 (list every occurrence of every orphan, with line numbers)
const fs=require('fs');
const VERBOSE=(process.env.VERBOSE|0)===1;
const html=fs.readFileSync(__dirname+'/engine.html','utf8');
const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
const lines=code.split('\n');

// ── 1. THE KEYS. Read them from the genome literal itself rather than from a list anyone maintains:
// a hand-kept list is a list that silently goes stale, and a census that misses a gene reports it as
// absent rather than as unexamined.
let start=-1;
for(let i=0;i<lines.length;i++) if(/^let genome=\{/.test(lines[i])){ start=i; break; }
if(start<0){ console.log(JSON.stringify({error:'genome literal not found'})); process.exit(1); }
let depth=0,end=-1;
for(let i=start;i<lines.length;i++){
  for(const ch of lines[i]){ if(ch==='{')depth++; else if(ch==='}')depth--; }
  if(depth===0){ end=i; break; }
}
if(end<0){ console.log(JSON.stringify({error:'genome literal not closed'})); process.exit(1); }
const keys=[];
for(let i=start;i<=end;i++){
  const m=lines[i].match(/^\s{2}([A-Za-z_$][A-Za-z0-9_$]*)\s*:/);   // two-space indent = top level of the literal
  if(m&&!keys.includes(m[1]))keys.push(m[1]);
}

// ── 2. FUNCTION SPANS. TWO WRONG VERSIONS BEFORE THIS ONE, BOTH RECORDED.
//
// (a) NEAREST PRECEDING DECLARATION AT ANY INDENT. Wrong, and biased toward finding nothing:
//     mutateGenome declares helpers inside itself -- maybe(), metaMaybe(), tailDraw() -- so every
//     occurrence in its body after one of those was attributed to the nested helper, which is not in
//     the plumbing set, and the gene read as LIVE. It showed itself as effectSenseRate reporting
//     "one read site, in metaMaybe at line 18806", 1,100 lines past metaMaybe's own declaration.
//
// (b) BRACE DEPTH FROM COLUMN ZERO. Much worse, and biased the other way: braces inside strings,
//     regexes, template literals and comments are not brace depth, so a span never closed and one
//     function absorbed the rest of the file. It reported 165 of 191 genes as orphans, including
//     extinctionThresh -- which this very session read at line 19259 in checkExtinction. A result
//     that contradicts something already verified by hand is the instrument failing, not a finding.
//
// (c) COLUMN-ZERO TERMINATOR, which is what this file's style actually guarantees: every top-level
//     function opens at column zero and closes with a "}" at column zero, and every nested helper is
//     indented. So a span runs from its declaration to the next column-zero "}". No brace counting,
//     nothing to be confused by a string. VALIDATED below against a site read by hand.
const spans=[];
for(let i=0;i<lines.length;i++){
  const m=lines[i].match(/^function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/);
  if(!m)continue;
  let endLn=lines.length-1;
  for(let j=i+1;j<lines.length;j++) if(/^\}/.test(lines[j])){ endLn=j; break; }
  spans.push([i,endLn,m[1]]);
}
function fnOf(ln){ for(const [a,b,n] of spans) if(ln>=a&&ln<=b) return n; return '(top level)'; }

// SELF-CHECK. Three sites this session read by hand, each in a named function. If the attribution
// cannot place them, every number below is void and the rig says so instead of printing a table.
const SELFCHECK=[
  {line:19259, fn:'checkExtinction', what:'alive<genome.extinctionThresh'},
  {line:18040, fn:'mutateGenome',    what:'genome.extinctionThresh=Math.max(1,Math.round(maybe(...)))'},
  {line:17191, fn:'collectClusterUpstream', what:'the upward channel'}
];
const scFails=SELFCHECK.filter(c=>fnOf(c.line-1)!==c.fn)
  .map(c=>'line '+c.line+' ('+c.what+') attributed to '+fnOf(c.line-1)+', expected '+c.fn);
if(scFails.length){ console.log(JSON.stringify({error:'ATTRIBUTION SELF-CHECK FAILED',scFails},null,1)); process.exit(1); }

// TWO KINDS OF READ, AND LUMPING THEM WAS THE FOURTH THING THIS RIG GOT WRONG.
//
// The first classification put mutateGenome in with the serialisation and called anything read only
// there an orphan. That labelled mutationTail an orphan -- and mutationTail is the gene that decides
// whether the search distribution is uniform or heavy-tailed, which is about as far from inert as a
// gene gets. Same for motifMemorySize, whose only read is the line that caps cultural memory.
//
// They are read by the MUTATION OPERATOR rather than by the world loop, and that is a real place to
// act: it shapes the search rather than the phenotype. So three classes, not two:
//
//   LIVE       read somewhere outside all genome machinery -- it touches what the world does.
//   META_ONLY  read only inside mutateGenome -- it shapes how the lineage searches, not what it is.
//   INERT      read by nothing but encode/decode/sanitize/clone. It rides the save file and no more.
//
// mutateChildGenome counts as serialisation here for a specific reason: it walks every numeric key
// generically under #181's lazy-gene contract, so it touches genes it knows nothing about and its
// presence says nothing about whether a gene means anything.
const SERIALISATION=new Set(['sanitizeGenome','encodeGenome','decodeGenome','cloneGenome',
  'trimGenomeToBudget','mutateChildGenome','saveGenome','loadGenome','serializeGenome','defaultGenome']);
const META=new Set(['mutateGenome']);
const PLUMBING=new Set([...SERIALISATION,...META]);

// ── 3. OCCURRENCES. Property-access form, on any receiver: the same gene is read off `genome`, off a
// particle's own `pGenome[i]`, off `_g`, off `src` in the clone. Matching the key name after a dot
// catches all of them, and these names are distinctive enough that collisions are not a real risk --
// but every occurrence is reported under VERBOSE so a collision is visible rather than assumed away.
const rows=[];
for(const k of keys){
  const re=new RegExp('\\.'+k.replace(/[$]/g,'\\$')+'\\b','g');
  const hits=[];
  for(let i=0;i<lines.length;i++){
    if(i>=start&&i<=end)continue;                      // the literal itself is the declaration
    const L=lines[i];
    let m; re.lastIndex=0;
    while((m=re.exec(L))!==null) hits.push({line:i+1,fn:fnOf(i),src:L.trim().slice(0,110)});
  }
  const outside=hits.filter(h=>!PLUMBING.has(h.fn));
  const metaOnly=hits.filter(h=>META.has(h.fn));
  const fns=[...new Set(hits.map(h=>h.fn))];
  rows.push({ key:k, occurrences:hits.length, outsidePlumbing:outside.length,
              worldReads:outside.length, metaReads:metaOnly.length,
              cls: outside.length>0 ? 'LIVE' : (metaOnly.length>0 ? 'META_ONLY' : 'INERT'),
              functions:fns, hits });
}
const orphans=rows.filter(r=>r.cls==='INERT');
const metaOnlyRows=rows.filter(r=>r.cls==='META_ONLY');
const live=rows.filter(r=>r.cls==='LIVE');

console.log(JSON.stringify({
  genomeLiteralLines:[start+1,end+1], keysFound:keys.length,
  // The headline. A gene here is mutated every cycle, encoded into every save, decoded on every load,
  // and read by nothing that runs the world.
  counts:{LIVE:live.length, META_ONLY:metaOnlyRows.length, INERT:orphans.length},
  metaOnly:metaOnlyRows.map(r=>({key:r.key, metaReads:r.metaReads})),
  orphanCount:orphans.length,
  orphans:orphans.map(r=>({key:r.key, occurrences:r.occurrences, onlyIn:r.functions})),
  liveGeneCount:live.length,
  // The ten most-read genes, as a sanity check on the method: if the top of this list is not obviously
  // load-bearing, the matcher is wrong and the orphan list cannot be trusted either.
  mostRead:live.slice().sort((a,b)=>b.outsidePlumbing-a.outsidePlumbing).slice(0,10)
        .map(r=>({key:r.key, outsidePlumbing:r.outsidePlumbing})),
  // The thin end: genes with exactly one read site outside the plumbing. Not orphans, but one gate
  // away from being one, and #208 is what a single read site behind a closed door looks like.
  singleReadSite:live.filter(r=>r.outsidePlumbing===1)
        .map(r=>({key:r.key, at:r.hits.filter(h=>!PLUMBING.has(h.fn)).map(h=>h.fn+':'+h.line)[0]})),
  detail:VERBOSE?orphans:undefined
},null,1));
