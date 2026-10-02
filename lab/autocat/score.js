// count FULL-ahead comparisons (Lu strictly greater) vs RAND, RANDN, SHUF, NOAC across seeds in a feasibility dir; prints the number
const {execSync}=require('child_process'); const out=execSync(`ARMS="FULL NOAC RAND RANDN SHUF W1" DIR=${process.argv[2]} SEEDS="${process.argv[3]||'90 91 92'}" node ${__dirname}/trial.js`).toString();
console.log((out.match(/\((RAND|RANDN|SHUF|NOAC) [0-9.]+ \(FULL ahead\)/g)||[]).length+(out.match(/(RAND|RANDN|SHUF|NOAC) [0-9.]+ \(FULL ahead\)/g)||[]).length);
