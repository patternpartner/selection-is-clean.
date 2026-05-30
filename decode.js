// Decode the system's own genome export (base64 JSON with compact keys) and report.
const fs = require('fs');
const path = process.argv[2];
const wrap = JSON.parse(fs.readFileSync(path, 'utf8'));
console.log('wrapper keys:', Object.keys(wrap));
let G;
if (typeof wrap.genome === 'string') {
  G = JSON.parse(Buffer.from(wrap.genome, 'base64').toString('utf8'));
} else { G = wrap.genome || wrap; }
console.log('decoded genome keys:', Object.keys(G).join(','));

// Compact-key map inferred from index.html encodeGenome (best-effort)
console.log('\n=== identity ===');
console.log('generation g:', G.g, '| ticks T:', G.T);
console.log('boundOpcodes bo:', JSON.stringify(G.bo));
console.log('userAtoms ua:', (G.ua||[]).length, '— with use counts:');
for (const a of (G.ua||[])) console.log('   uses=' + String(a.uses).padStart(9), 'age=' + a.age, ' ', a.expression);
console.log('fitnessSensors fs:', (G.fs||[]).length);
console.log('objWeights w:', JSON.stringify(G.w));
console.log('renderNodes rn:', (G.rn||[]).length, '| vmProgram vm len:', (G.vm||[]).length, '| DIMS in m?');

// The 'm' array holds scalar physics/meta params. Print with indices so we can map.
console.log('\n=== scalar bank m[] (index : value) ===');
(G.m||[]).forEach((v, i) => process.stdout.write(`${i}:${v}  ` + ((i + 1) % 6 === 0 ? '\n' : '')));
console.log('\n');

// lineage snapshots L and event log E (tail)
console.log('=== lineage records L (recent) ===');
for (const l of (G.L||[]).slice(-6)) console.log('  t=' + l.t, 'pop=' + l.p, 'clusters=' + l.c, 'fit=' + l.f, 'w=' + JSON.stringify(l.w));
console.log('\n=== event log E (tail) ===');
const E = G.E || [];
const counts = {};
for (const e of E) counts[e.k] = (counts[e.k] || 0) + 1;
console.log('event type counts:', JSON.stringify(counts));
for (const e of E.slice(-8)) console.log('  t=' + e.t, e.k, JSON.stringify(e.d).slice(0, 80));
