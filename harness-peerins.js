// #241 — two-universe inscription pair. OEE-NOTES #241 is the rule.
//
// A headless single universe has no peers: harness-env stubs BroadcastChannel. This rig forks
// two processes. Each boots engine.html the same way harness-establish does, with its own seeded
// Math.random. A synchronous parent passes packets across after both have called loop(), so a
// packet sent on tick T is received on tick T+1. ISOLATE stays off.
//
// Scores the focal only. entropyRatio / kinds_late follow harness-oee (SAMPLE 500, sample taken
// after boot and then every 500 driver steps, third means). estFrac follows harness-establish
// (EVERY 250, WARM 2000, ESTN 10). The census draws nothing. Migrants, plasmids, motifs and laws
// still cross in both arms.
//
// Env: SEED (focal, default 1)  PEER (default SEED+10)  TICKS (default 20000)  PEERINS (0 or 1)
//      INDEX (engine html)  TIME=1 (stderr timings)
// Prints one JSON object.
const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');

if (process.env.PEERINS_CHILD === '1') {
  childMain();
} else {
  parentMain();
}

function childMain() {
  const env = require(path.join(__dirname, 'harness-env.js'));
  env(globalThis);
  env.applyKnobs(globalThis);
  const instances = [];
  const outbound = [];
  globalThis.BroadcastChannel = class {
    constructor(name) {
      this.name = String(name);
      this.onmessage = null;
      instances.push(this);
    }
    postMessage(data) {
      let cloned;
      try { cloned = structuredClone(data); }
      catch (e) { cloned = null; }
      if (!cloned) return;
      for (const inst of instances) {
        if (inst === this || inst.name !== this.name) continue;
        if (typeof inst.onmessage === 'function') {
          try { inst.onmessage({ data: cloned }); }
          catch (e) { /* metabolism observer is not the sim */ }
        }
      }
      outbound.push({ name: this.name, data: cloned });
    }
    close() {}
    addEventListener() {}
  };
  function takeOut() {
    const o = outbound.splice(0, outbound.length);
    return o;
  }
  const html = fs.readFileSync(process.env.INDEX || path.join(__dirname, 'engine.html'), 'utf8');
  const code = html.match(/<script>([\s\S]*)<\/script>/)[1];
  const DRIVER = [
    ';globalThis.__tabId=(typeof TAB_ID!=="undefined")?TAB_ID:null;',
    'globalThis.__loopErr=null;',
    'globalThis.__peerCount=function(){try{return countPeers();}catch(e){return -1;}};',
    'globalThis.__fp=function(){',
    '  var alive=0,ps=0,as=0,lin=0,maxStr=0,i;',
    '  for(i=0;i<N;i++){ if(!palive[i])continue; alive++; ps+=px[i]+py[i]; as+=amp[i]; lin+=(pLin[i]|0); }',
    '  for(i=0;i<cellProgStr.length;i++) if(cellProgStr[i]>maxStr) maxStr=cellProgStr[i];',
    '  var wireOut=0,b;',
    '  for(i=0;i<cellProgB.length;i++){ b=cellProgB[i]; if(!(b>=-16&&b<=16)) wireOut++; }',
    '  return {t:tick|0,alive:alive,paid:(__liveness["birth.paid"]|0),',
    '    inscribe:(__liveness["cell.inscribe"]|0),inscribeNet:(__liveness["cell.inscribeNet"]|0),',
    '    chem:(__liveness["cell.chemExec"]|0),maxStr:maxStr,wireOut:wireOut,posSum:ps,ampSum:as,linSum:lin,pool:worldEnergy};',
    '};',
    'globalThis.__series=[];',
    'globalThis.__sampleDiv=function(){',
    '  var binCounts=Object.create(null),i,b,k,occupied=0,tot=0,h=0,p,base,d,q,r;',
    '  for(i=0;i<N;i++){ if(!palive[i])continue;',
    '    if(typeof tendBin==="function"){ try{b=tendBin(i);}catch(e){b=0;} }',
    '    else { base=i*DIMS; r=0; for(d=0;d<3&&d<DIMS;d++){ q=((tend[base+d]+1.2)/2.4*4)|0; q=q<0?0:q>3?3:q; r=r*4+q; } b=r; }',
    '    binCounts[b]=(binCounts[b]||0)+1; }',
    '  for(k in binCounts){ occupied++; tot+=binCounts[k]; }',
    '  if(tot>0){ for(k in binCounts){ p=binCounts[k]/tot; if(p>0) h-=p*Math.log2(p); } }',
    '  globalThis.__series.push({tick:tick|0,occupiedKinds:occupied,diversityHbits:+h.toFixed(3)});',
    '};',
    'globalThis.__est={first:Object.create(null),peak:Object.create(null)};',
    'globalThis.__census=function(){',
    '  var cnt=Object.create(null),i,l,est=globalThis.__est;',
    '  for(i=0;i<N;i++){ if(!palive[i])continue; l=pLin[i]; cnt[l]=(cnt[l]||0)+1; }',
    '  for(l in cnt){ if(est.first[l]===undefined) est.first[l]=tick|0; if(!(est.peak[l]>=cnt[l])) est.peak[l]=cnt[l]; }',
    '};',
    'globalThis.__steps=0;',
    'globalThis.__fps=[];',
    'globalThis.__peersAt100=null;',
    'globalThis.__inscSent=0;',
    'globalThis.__onStep=function(){',
    '  globalThis.__detMs+=5;',
    '  try{ loop(); }catch(e){ if(!globalThis.__loopErr) globalThis.__loopErr=String(e&&e.message||e); }',
    '  globalThis.__steps++;',
    '  if(globalThis.__steps%500===0) globalThis.__sampleDiv();',
    '  if(globalThis.__steps%250===0) globalThis.__census();',
    '  if(globalThis.__steps%1000===0) globalThis.__fps.push(globalThis.__fp());',
    '  if(globalThis.__steps===100) globalThis.__peersAt100=globalThis.__peerCount();',
    '};'
  ].join('\n');
  let bootErr = null;
  try {
    const Module = require('module');
    const mod = new Module(path.join(__dirname, 'peerins-sim.js'));
    mod.filename = mod.id;
    mod.paths = Module._nodeModulePaths(__dirname);
    mod._compile(code + DRIVER, mod.filename);
    globalThis.__sampleDiv();
    globalThis.__census();
  } catch (e) {
    bootErr = String(e && e.stack || e);
  }
  function countInsc(list) {
    let n = 0;
    for (const p of list) if (p && p.data && p.data.type === 'inscription') n++;
    return n;
  }
  process.on('message', (m) => {
    if (!m || !m.cmd) return;
    if (m.cmd === 'deliver') {
      const pkts = m.packets || [];
      for (const pkt of pkts) {
        if (!pkt || !pkt.data) continue;
        for (const inst of instances) {
          if (inst.name !== pkt.name) continue;
          if (typeof inst.onmessage === 'function') {
            try { inst.onmessage({ data: pkt.data }); }
            catch (e) { /* a bad peer packet is the engine's own reject path */ }
          }
        }
      }
      const out = takeOut();
      globalThis.__inscSent += countInsc(out);
      process.send({ cmd: 'delivered', out: out });
    } else if (m.cmd === 'step') {
      if (!bootErr) globalThis.__onStep();
      const out = takeOut();
      globalThis.__inscSent += countInsc(out);
      process.send({ cmd: 'stepped', out: out });
    } else if (m.cmd === 'mark') {
      process.send({ cmd: 'marked', peers: bootErr ? -1 : globalThis.__peerCount(), tab: globalThis.__tabId || null });
    } else if (m.cmd === 'report') {
      const end = bootErr ? null : globalThis.__fp();
      process.send({
        cmd: 'report',
        bootErr: bootErr,
        tab: globalThis.__tabId || null,
        loopErr: globalThis.__loopErr || null,
        fp: globalThis.__fps || [],
        end: end,
        series: globalThis.__series || [],
        est: globalThis.__est || { first: {}, peak: {} },
        peersAt100: globalThis.__peersAt100,
        inscSent: globalThis.__inscSent | 0
      });
    }
  });
  const bootOut = bootErr ? [] : takeOut();
  if (!bootErr) globalThis.__inscSent += countInsc(bootOut);
  process.send({ cmd: 'ready', bootErr: bootErr, tab: globalThis.__tabId || null, out: bootOut });
}

function thirdMean(series, key, lo, hi) {
  let s = 0, c = 0;
  for (let i = lo; i < hi && i < series.length; i++) { s += series[i][key] || 0; c++; }
  return c ? s / c : 0;
}
function oeeOf(series) {
  const n = series.length;
  const t1 = Math.floor(n / 3), t2 = Math.floor(2 * n / 3);
  const entropyBits_early = +thirdMean(series, 'diversityHbits', 0, t1).toFixed(2);
  const entropyBits_late = +thirdMean(series, 'diversityHbits', t2, n).toFixed(2);
  const kinds_early = +thirdMean(series, 'occupiedKinds', 0, t1).toFixed(1);
  const kinds_late = +thirdMean(series, 'occupiedKinds', t2, n).toFixed(1);
  const entropyRatio = entropyBits_early > 0 ? +(entropyBits_late / entropyBits_early).toFixed(2) : null;
  return { entropyRatio, kinds_early, kinds_late, entropyBits_early, entropyBits_late, samples: n };
}
function estOf(est) {
  const WARM = 2000, ESTN = 10;
  let late = 0, established = 0;
  const first = est && est.first || {};
  const peak = est && est.peak || {};
  for (const l in first) {
    if (first[l] > WARM) {
      late++;
      if (peak[l] >= ESTN) established++;
    }
  }
  return { lateLineages: late, established, estFrac: late ? +(established / late).toFixed(4) : null };
}

function wrap(child) {
  const q = [];
  let waiter = null;
  child.on('message', (m) => {
    if (waiter) { const w = waiter; waiter = null; w(m); }
    else q.push(m);
  });
  return {
    pending: [],
    send(m) { child.send(m); },
    next() {
      if (q.length) return Promise.resolve(q.shift());
      return new Promise((resolve) => { waiter = resolve; });
    },
    kill() { try { child.kill(); } catch (e) {} }
  };
}

async function parentMain() {
  const TICKS = parseInt(process.env.TICKS || '20000', 10);
  const FOCAL_SEED = parseInt(process.env.SEED || '1', 10);
  const PEER_SEED = parseInt(process.env.PEER || String(FOCAL_SEED + 10), 10);
  const wantTime = process.env.TIME === '1';
  function spawn(seed) {
    const envv = Object.assign({}, process.env, { PEERINS_CHILD: '1', SEED: String(seed) });
    return fork(__filename, [], { env: envv, stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
  }
  const t0 = Date.now();
  const a = wrap(spawn(FOCAL_SEED));
  const b = wrap(spawn(PEER_SEED));
  const readyA = await a.next();
  const readyB = await b.next();
  a.pending = readyA.out || [];
  b.pending = readyB.out || [];
  async function drain() {
    for (let i = 0; i < 8; i++) {
      if (!a.pending.length && !b.pending.length) return;
      const toA = b.pending, toB = a.pending;
      a.pending = []; b.pending = [];
      a.send({ cmd: 'deliver', packets: toA });
      b.send({ cmd: 'deliver', packets: toB });
      const [ra, rb] = await Promise.all([a.next(), b.next()]);
      a.pending = ra.out || [];
      b.pending = rb.out || [];
    }
  }
  await drain();
  a.send({ cmd: 'mark' });
  b.send({ cmd: 'mark' });
  const [markA, markB] = await Promise.all([a.next(), b.next()]);
  const tBoot = Date.now();
  for (let s = 0; s < TICKS; s++) {
    a.send({ cmd: 'step' });
    b.send({ cmd: 'step' });
    const [sa, sb] = await Promise.all([a.next(), b.next()]);
    a.pending = sa.out || [];
    b.pending = sb.out || [];
    await drain();
  }
  const tLoop = Date.now();
  a.send({ cmd: 'report' });
  b.send({ cmd: 'report' });
  const [repA, repB] = await Promise.all([a.next(), b.next()]);
  a.kill(); b.kill();
  const oee = oeeOf(repA.series || []);
  const est = estOf(repA.est || { first: {}, peak: {} });
  const end = repA.end || {};
  const out = {
    seed: FOCAL_SEED,
    peerSeed: PEER_SEED,
    ticks: TICKS,
    peerins: process.env.PEERINS === undefined ? null : (parseInt(process.env.PEERINS, 10) | 0),
    tab: repA.tab || readyA.tab || null,
    peerTab: repB.tab || readyB.tab || null,
    bootErr: repA.bootErr || repB.bootErr || readyA.bootErr || readyB.bootErr || null,
    peersAt0: markA.peers,
    peerPeersAt0: markB.peers,
    peersAt100: repA.peersAt100,
    fp: repA.fp || [],
    peerFp: repB.fp || [],
    end: end,
    alive: end.alive,
    paid: end.paid,
    inscribe: end.inscribe,
    inscribeNet: end.inscribeNet,
    chem: end.chem,
    maxStr: end.maxStr,
    wireOut: end.wireOut,
    inscSent: repA.inscSent | 0,
    peerInscSent: repB.inscSent | 0,
    loopErr: repA.loopErr,
    peerLoopErr: repB.loopErr,
    entropyRatio: oee.entropyRatio,
    kinds_late: oee.kinds_late,
    kinds_early: oee.kinds_early,
    entropyBits_early: oee.entropyBits_early,
    entropyBits_late: oee.entropyBits_late,
    oeeSamples: oee.samples,
    estFrac: est.estFrac,
    lateLineages: est.lateLineages,
    established: est.established
  };
  if (wantTime) process.stderr.write('time boot=' + (tBoot - t0) + 'ms loop=' + (tLoop - tBoot) + 'ms\n');
  process.stdout.write(JSON.stringify(out) + '\n');
  if (out.bootErr) process.exit(1);
}
