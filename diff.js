// Diff a calm-phase genome against a bloom-onset genome to surface the evolved exploit.
// Usage: node diff.js /tmp/c1
const fs = require('fs');
const dir = process.argv[2] || '/tmp/c1';
const calm = JSON.parse(fs.readFileSync(dir + '/genome_calm.json', 'utf8'));
const bloom = JSON.parse(fs.readFileSync(dir + '/genome_bloom.json', 'utf8'));
const A = calm.genome, B = bloom.genome;
console.log(`calm tick=${calm.tick}  ->  bloom tick=${bloom.tick} (N=${bloom.N})\n`);

function num(x) { return typeof x === 'number'; }
const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].sort();

console.log('=== SCALAR PARAMETER CHANGES (sorted by relative magnitude) ===');
const rows = [];
for (const k of keys) {
  if (num(A[k]) && num(B[k])) {
    const a = A[k], b = B[k];
    if (a === b) continue;
    const rel = a !== 0 ? (b - a) / Math.abs(a) : (b !== 0 ? Infinity : 0);
    rows.push({ k, a, b, rel });
  }
}
rows.sort((x, y) => Math.abs(y.rel) - Math.abs(x.rel));
for (const r of rows) {
  console.log(`  ${r.k.padEnd(28)} ${String(r.a).padStart(10)} -> ${String(r.b).padStart(10)}  (${r.rel === Infinity ? 'new' : (r.rel * 100).toFixed(0) + '%'})`);
}

console.log('\n=== ARRAY / STRUCTURE CHANGES ===');
for (const k of keys) {
  const a = A[k], b = B[k];
  if (Array.isArray(a) || Array.isArray(b)) {
    const la = Array.isArray(a) ? a.length : 0, lb = Array.isArray(b) ? b.length : 0;
    const sa = JSON.stringify(a), sb = JSON.stringify(b);
    if (sa !== sb) {
      console.log(`  ${k}: len ${la} -> ${lb}`);
      if (sa.length < 400 && sb.length < 400) {
        console.log(`      calm:  ${sa}`);
        console.log(`      bloom: ${sb}`);
      }
    }
  } else if (a && typeof a === 'object' || b && typeof b === 'object') {
    const sa = JSON.stringify(a), sb = JSON.stringify(b);
    if (sa !== sb && sa.length < 600) { console.log(`  ${k}: ${sa} -> ${sb}`); }
    else if (sa !== sb) { console.log(`  ${k}: object changed (len ${sa.length}->${sb.length})`); }
  }
}

// Spotlight likely-suspect fields
console.log('\n=== SPOTLIGHT (amplitude/fitness/objective levers) ===');
for (const k of ['objWeights', 'entropyK', 'densityCostK', 'creationCost', 'creationThresh', 'destructThresh', 'deathThreshold', 'metabolicCost', 'entropyBaseline', 'mutationRate']) {
  console.log(`  ${k.padEnd(20)} ${JSON.stringify(A[k])} -> ${JSON.stringify(B[k])}`);
}
for (const k of ['fitnessSensors', 'userAtoms']) {
  if (B[k]) console.log(`  ${k}: ${JSON.stringify(B[k]).slice(0, 600)}`);
}
